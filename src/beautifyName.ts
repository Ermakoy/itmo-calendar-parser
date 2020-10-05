import {
  compose,
  toUpper,
  head,
  toLower,
  tail,
  replace,
  join,
  trim,
  juxt,
  pipe,
  split,
} from 'ramda';

const upFirst = compose(toUpper, head);
const lowOther = pipe(split(''), tail, toLower);

const classTypeRegex = /\((ЛЕК|ЛАБ)\)/gi;

const pruneClass = replace(classTypeRegex, '');

const pointFreeUpperCase = compose(
  join(''),
  juxt([upFirst, lowOther]),
  trim,
  pruneClass,
);

const pipetest = pipe(pruneClass, trim, juxt([upFirst, lowOther]), join(''));

enum classType {
  LEC = 'Лекция',
  LAB = 'Лаба',
}

const getclassType = (name: string): classType =>
  ({ ЛЕК: 'Лекция', ЛАБ: 'Лаба' }[(classTypeRegex.exec(name) || [])[1]]);

export default (name: string): string => {
  const type = getclassType(name);

  return (type ? type + ': ' : '').concat(pointFreeUpperCase(name));
};
