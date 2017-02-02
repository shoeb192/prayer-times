# Prayer times for mosques ###

## Featurs

* Shows prayer times on LCD screen
* Shows current time, gregorian and hijri date (hijri date need internet connection) 
* Prayer time and iqama flashing
* Shows douaa after athan
* Shows Aid prayer time
* DST Handling for all prayer times
* No human adjustment all is automatic

![alt tag](http://priere.mosquee-houilles.fr/img/screenshot-1.png)

![alt tag](http://priere.mosquee-houilles.fr/img/screenshot-2.jpg)

![alt tag](http://priere.mosquee-houilles.fr/img/configure.png)

![alt tag](http://priere.mosquee-houilles.fr/img/screenshot-3.png)

![alt tag](http://priere.mosquee-houilles.fr/img/douaa-after-athan.svg)

## How it works

The software will be installed in a raspberry pi, this small computer will be plugged in LCD screen with hdmi cable. 

1. Download the source code and put it in your raspberry pi for exemple at /var/www/prayer
2. After installing nginx on your rasbperry pi create a vhost for the site or modify the root directory of the main nginx config
3. Modify your conf.json
4. Run firefox (iceweesle on raspberry pi)
5. Go to your server-name or localhost depends on what you have configure in 2 nd step
6. Clic F11 button and enjoy