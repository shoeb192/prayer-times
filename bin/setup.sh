#!/bin/bash

# install packages
sudo apt-get update && apt-get install --no-install-recommends -y \
nginx \
xdotool \
iceweasel \
&& apt-get autoremove -y && apt-get clean

# change config.txt
sudo sed -i "s/#disable_overscan/disable_overscan/g" /bin/config.txt

# change default nginx conf
sudo sed -i "s/root \/var\/www\/html/root \/home\/pi\/prayer\/current/g" /etc/nginx/sites-enabled/default
sudo service nginx reload

# add autostart
echo "@sh /home/pi/prayer/current/bin/run.sh" >> /home/pi/.config/lxsession/LXDE-pi/autostart

# fix permissions
sudo chmod -R 777 /home/pi/prayer