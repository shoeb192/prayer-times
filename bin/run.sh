#!/bin/bash

url=`cat ~/Desktop/site.txt`
chromium-browser --app=$url --start-maximized &
sleep 30
xdotool key F11