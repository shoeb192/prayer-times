#!/bin/bash

chromium-browser --app=http://localhost --start-maximized &
sleep 30
xdotool key F11