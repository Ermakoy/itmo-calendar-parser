'use strict';

import fs from 'fs';
import puppeteer from 'puppeteer';

import { mapTime, getWeekDay, vCalendar, createEvent, createEvents, getByDay } from './utils';

import beautifyName from './beautifyName';

const url = 'http://www.ifmo.ru/ru/schedule/0/M3408/raspisanie_zanyatiy_M3408.htm';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle0' });
  // Получение сырых данных максимально приближенных к нужному формату
  const rawData = await page.$$eval('.rasp_tabl_day .rasp_tabl', nodes =>
    nodes
      .map(day => day.querySelectorAll('tr'))
      .map(lessons => [].slice.call(lessons))
      .flat()
      .filter(el => el.innerText)
      .map(el => {
        const [time, week] = el
          .querySelector('.time')
          .innerText.trim()
          .split('\n');
        return {
          summary: el
            .querySelector('.lesson')
            .innerText.trim()
            .split('\n')[0],
          day: el.querySelector('.day').innerText.trim(),
          time,
          week,
          location: el
            .querySelector('.room')
            .innerText.trim()
            .split('\n\t')
            .reverse()
            .join(', '),
        };
      })
      .map(({ week, ...el }) => ({
        ...el,
        isWeekOdd: {
          'нечетная неделя': 1,
          'четная неделя': 0,
        }[week],
      }))
      .reduce(
        (acc, el) =>
          acc.concat({
            ...el,
            day: el.day || acc[acc.length - 1].day,
          }),
        [],
      ),
  );

  console.log(rawData);

  // Приведение данных к формату
  const events = rawData
    .map(event => ({ ...event, summary: beautifyName(event.summary) }))
    .map(({ time, ...event }) => ({ ...event, t: mapTime(time) }))
    .map(({ t, day, isWeekOdd, ...event }) => ({
      ...event,
      // Если неделя чет или нечет, то повторяем раз в 2 недели
      interval: typeof isWeekOdd !== 'undefined' ? 2 : 1,
      byDay: getByDay(day),
      start: getWeekDay(day, isWeekOdd)
        .hour(t[0][0])
        .minute(t[0][1])
        .local(),
      end: getWeekDay(day, isWeekOdd)
        .hour(t[1][0])
        .minute(t[1][1])
        .local(),
    }))
    .map(event => ({
      ...event,
      description: '',
      status: 'TENTATIVE', // TENTATIVE, CONFIRMED, CANCELLED
      productId: 'scheduler/ics',
    }));

  fs.writeFileSync(
    `./calendars/${new Date().toLocaleDateString().replace(/ /g, '_')}calendar.ics`,
    vCalendar(...events),
  );

  await browser.close();
})();
