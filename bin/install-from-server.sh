#!/bin/bash

mkdir -p /tmp/prayer

rm -rf /tmp/prayer/*

scp -r -P 222 izehhaf@izf.synology.me:~/web/prayer/* /tmp/prayer/

lasteVersion=`cat /tmp/prayer/version`

mkdir -p /home/pi/prayer/$lasteVersion

mv /tmp/prayer/* /home/pi/prayer/$lasteVersion/

rm /home/pi/prayer/current

ln -s /home/pi/prayer/$lasteVersion /home/pi/prayer/current
    