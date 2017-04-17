#!/bin/bash

if [ -z "$1" ]; then
echo "The version is mandatory";
exit 1
fi

mkdir cp -r /media/pi/DISK_IMG/p-times/$1 /home/pi/prayer/
rm /home/pi/prayer/current
ln -s /home/pi/prayer/$1 /home/pi/prayer/current
    