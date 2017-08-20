#!/bin/bash

mkdir -p /tmp/prayer

rm -rf /tmp/prayer/*

cd /tmp/prayer/

wget izf.synology.me/prayer/prayer.tar.gz

tar -xf prayer.tar.gz 

rm prayer.tar.gz 

lasteVersion=`cat /tmp/prayer/version`

mkdir -p /home/pi/prayer/$lasteVersion

mv /tmp/prayer/* /home/pi/prayer/$lasteVersion/

rm /home/pi/prayer/current

ln -s /home/pi/prayer/$lasteVersion /home/pi/prayer/current
    
echo Version $lasteVersion has been successfully installed ;)
