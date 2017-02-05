#!/bin/bash

mkdir -p /tmp/prayer
rm -rf /tmp/prayer/*

scp -r -P 222 admin@izf.synology.me:/volume1/web/prayer/* /tmp/prayer

mkdir -p /home/pi/prayer 

cd /tmp/prayer

version=`cat version`

rm -rf /home/pi/prayer/$version

mkdir /home/pi/prayer/$version

mv /tmp/prayer/* /home/pi/prayer/$version

rm -f current

cd /home/pi/prayer

ln -s $version current