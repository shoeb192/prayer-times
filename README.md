# Prayer times for mosques ###

## Featurs

* Shows prayer times on LCD screen
* Shows current time, gregorian and hijri date
* Prayer time and iqama flashing
* Shows douaa after athan
* Shows Aid prayer time
* DST Handling for all prayer times
* No human adjustment all is automatic
* Configuration interface
* Choose between custom prayer calcul methode and defined csv file

![alt tag](http://priere.mosquee-houilles.fr/img/EN-screen.png)

![alt tag](http://priere.mosquee-houilles.fr/img/FR-screen.png)

![alt tag](http://priere.mosquee-houilles.fr/img/AR-screen.png)

![alt tag](http://priere.mosquee-houilles.fr/img/configure.png)

![alt tag](http://priere.mosquee-houilles.fr/img/iqama.png)

![alt tag](http://priere.mosquee-houilles.fr/img/douaa-after-athan.svg)

## How it works

### Requirements
1. nginx  
`sudo apt-get install nginx`

2. iceweasel (Firefox on linux)  
`sudo apt-get install iceweasel`

3. xdotool  
`sudo apt-get install xdotool`

### Install on Raspberry PI
1. Download the source code and put it in your Raspberry pi for exemple at /home/pi/prayer
2. Modify the root directory in /etc/nginx/sites-enabled/default, find this line `root /var/www/html;` and replace `/var/www/html` by `/home/pi/prayer`
3. Add this line `@sh /home/pi/prayer/bin/run.sh` at the bottom of autostart `/home/pi/.config/lxsession/LXDE-pi/autostart`, this let app running automatically after boot
4. Plug the Rasberry pi on LCD screen with hdmi cable and enjoy.