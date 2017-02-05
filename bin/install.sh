#!/bin/bash

mkdir -p /tmp/prayer
rm -rf /tmp/prayer/*

scp -r -P 222 admin@izf.synology.me:/volume1/web/prayer/* /tmp/prayer

mkdir -p /var/www/prayer 

cd /tmp/prayer

version=`cat version`

rm -rf /var/www/prayer/$version

mkdir /var/www/prayer/$version

mv /tmp/prayer/* /var/www/prayer/$version

rm -f current

cd /var/www/prayer

ln -s $version current