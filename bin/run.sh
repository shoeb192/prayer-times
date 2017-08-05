#!/bin/bash

chromium-browser --app=http://localhost --start-maximized --incognito &
sleep 30
xdotool key F11