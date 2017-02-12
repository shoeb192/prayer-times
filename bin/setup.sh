#!/bin/bash

# install packages
apt-get update && apt-get install --no-install-recommends -y \
nginx \
xdotool \
iceweasel \
unclutter \
&& apt-get autoremove -y && apt-get clean

# change default nginx conf
sed -i "s/root \/var\/www\/html/root \/home\/pi\/prayer\/current/g" /etc/nginx/sites-enabled/default
service nginx reload

# add autostart
echo "@sh /home/pi/prayer/current/bin/run.sh" >> /home/pi/.config/lxsession/LXDE-pi/autostart

# fix permissions
chmod -R 777 /home/pi/prayer

# fix resolution
echo "disable_overscan=1" >> /boot/config.txt
echo "hdmi_group=1" >> /boot/config.txt
echo "hdmi_mode=16" >> /boot/config.txt

# disable screensaver
echo "xserver-command=X -s 0 -dpms" >> /etc/lightdm/lightdm.conf

