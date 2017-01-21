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

![alt tag](http://priere.mosquee-houilles.fr/img/screenshot-3.png)

![alt tag](http://priere.mosquee-houilles.fr/img/douaa-after-athan.jpg)

## How it works

The software will be installed in a raspberry pi, this small computer will be plugged in LCD screen with hdmi cable. 

## How to configure

The config parameters are in data/conf.json, here is an exemple

```javascript
{
    "joumouaaTime": "14:00",
    "aidTime": "09:00",
    "minimumIchaTime": "19:50",
    "maximumIchaTimeForNoWaiting": "22:00",
    "prayersWaitingTimes": [20, 10, 10, 5, 10],
    "timesPath": "houilles",
    "hijriAdjustment": +1,
    "adhanDouaaEnabled": true,
    "androidAppEnabled": true,
    "headerText": "Mosquée ES-sounna - Houilles",
    "site": "Ces horaires sont accessbiles sur <span style=\"color: #1b6d85;\">http://priere.mosquee-houilles.fr</span> et sur notre application android",
    "supportTel": "06.29.11.16.41",
    "footerText": "Association SFI - Tél. 09.50.31.41.77 / 06.61.49.91.70 | RIB : IBAN FR76 3000 3018 6200 0504 6187 693 / BIC SOGEFRPP"
}
```

* `joumouaaTime` if set, it will be diplayed on screnn otherwhise 12:10 is displayed in winter and 13:10 in summer
* `aidTime` if set the text and time of aid wil be displayed
* `minimumIchaTime` that means ichaa time will be fixed at the choosen value if lower then it, leave it empty if you do not need this behaviour
* `maximumIchaTimeForNoWaiting` if set iqama will flash after adhan without waiting
* `prayersWaitingTimes` the times in minutes, to wait between athan and iqama [sobh, dohr, asr, maghrib, ichaa]
* `timesPath` the path to find prayer times files ex : `uoif/paris`, `mosquee-de-paris` ...
* `hijriAdjustment` to adjust hijri date ex : +1, -1
* `androidAppEnabled` to enable/disable displaying android app Qr code
* `headerText` The header text, you can put your mosque or association name for exemple
* `site` The site to view the app in mobile format 
* `supportTel` The support phone number, NOT change it
* `footerText` Footer text, here you can put some text like adress, account bank number, phone number...


> NB : After changing the conf file you should refresh page in browser
