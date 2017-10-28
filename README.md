# Prayer times for mosques ###

## Features

* Shows prayer times on LCD screen
* Shows current time, gregorian and hijri date
* Prayer time and iqama flashing
* Shows douaa after athan
* Shows douaas after prayer (adhkar essalate)
* Shows Aid prayer time
* Display messages and important information (online version only                 )
* No human adjustment all is automatic
* Configuration interface
* Choose between custom prayer calcul methode and defined csv file
* DST Handling for all prayer times (csv or custom mode)
* Adjust prayer times in custom mode
* Does not require an internet connection


### French screen
![alt tag](http://horaires-de-priere.fr/bundles/app/agency/img/software/french.png)

### Arabic screen
![alt tag](http://horaires-de-priere.fr/bundles/app/agency/img/software/arabic.png)

### Iqama screen
![alt tag](http://horaires-de-priere.fr/bundles/app/agency/img/software/iqama.png)

### Azan screen
![alt tag](http://horaires-de-priere.fr/bundles/app/agency/img/software/adhan-1.png)

![alt tag](http://horaires-de-priere.fr/bundles/app/agency/img/software/adhan-2.png)

### Duaa after azan screen
![alt tag](http://horaires-de-priere.fr/bundles/app/agency/img/software/douaa-after-adhan.png)

### Duaa between iqama and azan screen
![alt tag](http://horaires-de-priere.fr/bundles/app/agency/img/software/douaa-between-adhan-and-iqama.png)

### Duaa after prayer screen
![alt tag](http://horaires-de-priere.fr/bundles/app/agency/img/software/douaa-after-prayer.png)


### Responsive view for mobile
![alt tag](http://horaires-de-priere.fr/bundles/app/agency/img/software/mobile.png)

### Configuration screen
![alt tag](http://horaires-de-priere.fr/bundles/app/agency/img/software/configure.png)

## How it works

Plase visite my website [http://horaires-de-priere.fr]((http://horaires-de-priere.fr)) for more information, I have an online version witch is best un more complete.

### Requirements
1. nginx  
`sudo apt-get install nginx`

2. xdotool  
`sudo apt-get install xdotool`

### Install on Raspberry PI
1. Download the source code and put it in your Raspberry pi for exemple at /home/pi/prayer
2. Modify the root directory in /etc/nginx/sites-enabled/default, find this line `root /var/www/html;` and replace `/var/www/html` by `/home/pi/prayer`
3. Add this line `@sh /home/pi/prayer/bin/run.sh` at the bottom of autostart file `/home/pi/.config/lxsession/LXDE-pi/autostart`, this lets app running automatically after boot
4. Plug the Rasberry pi on LCD screen with hdmi cable and enjoy.