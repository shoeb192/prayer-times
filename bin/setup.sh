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
echo "disable_overscan=1" >> /bin/config.txt
echo "hdmi_group=1" >> /bin/config.txt
echo "hdmi_mode=16" >> /bin/config.txt

# disable screensaver
echo "@xset s noblank" >> /etc/xdg/lxsession/LXDE/autostart
echo "@xset s off" >> /etc/xdg/lxsession/LXDE/autostart
echo "@xset -dpms" >> /etc/xdg/lxsession/LXDE/autostart

echo "xserver-command=X -s 0 -dpms" >> /etc/lightdm/lightdm.conf

