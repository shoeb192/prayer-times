#!/bin/bash

chromium-browser --app=http://localhost --start-maximized &
sleep 20
xdotool key F11