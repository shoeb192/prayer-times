#!/bin/bash

set -e

# stop chromium
killall chromium-browser || true

mkdir -p /tmp/prayer

rm -rf /tmp/prayer/*

cd /tmp/prayer/

wget izf.synology.me/prayer/prayer.tar.gz

tar -xf prayer.tar.gz 

rm prayer.tar.gz 

lasteVersion=`cat /tmp/prayer/version`

rm -rf /home/pi/prayer/$lasteVersion

mkdir -p /home/pi/prayer/$lasteVersion

mv /tmp/prayer/* /home/pi/prayer/$lasteVersion/

rm /home/pi/prayer/current

ln -s /home/pi/prayer/$lasteVersion /home/pi/prayer/current

/home/pi/prayer/current/bin/run.sh
    
echo "Version $lasteVersion has been successfully installed ;)"
