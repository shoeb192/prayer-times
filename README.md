# Prayer times for mosques ###

## Featurs

* Shows prayer times on LCD screen
* Shows current time, gregorian and hijri date
* Prayer time and iqama flashing
* Shows douaa after athan
* Shows douaas after prayer (adhkar essalate)
* Shows Aid prayer time
* No human adjustment all is automatic
* Configuration interface
* Choose between custom prayer calcul methode and defined csv file
* DST Handling for all prayer times (csv or custom mode)
* Adjust prayer times in custom mode
* Does not require an internet connection

![alt tag](http://izf.synology.me/photo/webapi/thumb.php?api=SYNO.PhotoStation.Thumb&method=get&version=1&size=large&id=photo_c3896372616e20686f72616972657320707269c3a87265_494d475f32303137303330345f3132313932362e6a7067&rotate_version=0&thumb_sig=2f766f6c756d65312f70686f746f2fc3896372616e20686f72616972657320707269c3a872652f494d475f32303137303330345f3132313932362e6a7067&mtime=1488645849&SynoToken=qod69jke6bcs3f2rgigkigjd62)

### French screen
![alt tag](http://izf.synology.me/photo/webapi/thumb.php?api=SYNO.PhotoStation.Thumb&method=get&version=1&size=large&id=photo_c3896372616e20686f72616972657320707269c3a87265_6672656e63682e706e67&rotate_version=0&mtime=1488661668&SynoToken=qod69jke6bcs3f2rgigkigjd62)

### Arabic screen
![alt tag](http://izf.synology.me/photo/webapi/thumb.php?api=SYNO.PhotoStation.Thumb&method=get&version=1&size=large&id=photo_c3896372616e20686f72616972657320707269c3a87265_6172616269632e706e67&rotate_version=0&mtime=1489238780&SynoToken=qod69jke6bcs3f2rgigkigjd62)

### Iqama screen
![alt tag](http://priere.mosquee-houilles.fr/img/iqama.png)

### Duaa after athan screen
![alt tag](http://priere.mosquee-houilles.fr/img/douaa-after-athan.png)

### Duaa after prayer screen
![alt tag](http://izf.synology.me/photo/webapi/thumb.php?api=SYNO.PhotoStation.Thumb&method=get&version=1&size=large&id=photo_c3896372616e20686f72616972657320707269c3a87265_646f7561612d61667465722d7072617965722e706e67&rotate_version=0&thumb_sig=2f766f6c756d65312f70686f746f2fc3896372616e20686f72616972657320707269c3a872652f646f7561612d61667465722d7072617965722e706e67&mtime=1489237730&SynoToken=qod69jke6bcs3f2rgigkigjd62)

### Configuration screen
![alt tag](http://izf.synology.me/photo/webapi/thumb.php?api=SYNO.PhotoStation.Thumb&method=get&version=1&size=large&id=photo_c3896372616e20686f72616972657320707269c3a87265_636f6e6669677572652e706e67&rotate_version=0&thumb_sig=2f766f6c756d65312f70686f746f2fc3896372616e20686f72616972657320707269c3a872652f636f6e6669677572652e706e67&mtime=1488661663&SynoToken=qod69jke6bcs3f2rgigkigjd62)

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
3. Add this line `@sh /home/pi/prayer/bin/run.sh` at the bottom of autostart file `/home/pi/.config/lxsession/LXDE-pi/autostart`, this lets app running automatically after boot
4. Plug the Rasberry pi on LCD screen with hdmi cable and enjoy.