#!/bin/bash

if [ -f ~/Desktop/site.txt ]; then
    url=`cat ~/Desktop/site.txt`
fi

if [ -z "$url" ]; then
    url="http://localhost"
fi

chromium-browser --app=$url --start-maximized &
sleep 30
xdotool key F11