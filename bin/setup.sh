#!/bin/bash

# install packages
apt-get update && apt-get install --no-install-recommends -y \
nginx \
xdotool \
iceweasel \
unclutter \
vim \
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
echo "overscan_left=20" >> /boot/config.txt
echo "overscan_right=20" >> /boot/config.txt
echo "overscan_top=20" >> /boot/config.txt
echo "overscan_bottom=20" >> /boot/config.txt

# disable screensaver
sed -i "s/\[SeatDefaults\]\n/\[SeatDefaults\]\nxserver-command=X -s 0 -dpms/g" /etc/lightdm/lightdm.conf

