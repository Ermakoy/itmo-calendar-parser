#!/bin/sh
cd /etc/yum.repos.d
files=$(ls -p | grep -v /)
for file in $files; do
	arrLen=$($files[@])
	counter=0
	cat $file | grep 'mirrorlist=h' | sed 's/^...........//' | while read -r url ; do
		str=$(curl -Is "$url" | head -1)
		if [ -z "$str" -a "$str"!=" " ]; then
			((counter=counter+1))
		fi
	done
	if [ $counter == arrLen ]; then
		yum-config-manager --disable $file
	fi
done

