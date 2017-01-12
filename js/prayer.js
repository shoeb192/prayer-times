/* global dateTime */

/**
 * Class handling prayers 
 * @author ibrahim.zehhaf@gmail.com
 * @type {object}
 */

var prayer = {
    customData: null,
    months: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
    prayerTimes: [],
    /**
     * hijri api url 
     */
    hijriDateApiUrl: "http://api.aladhan.com/gToH?date=",
    /**
     * init the app
     */
    init: function () {
        this.loadData();
        this.setTime();
        this.setDate();
        this.setPrayerTimes();
        this.setNextPrayerTimeHilight();
        this.setPrayerWaitings();
        this.initAdhanFlash();
        this.initIqamaFlash();
        this.initCronMidNight();
        this.setAidPrayerTime();
        this.setCustomContent();
    },
    /**
     * load all data
     */
    loadData: function () {
        this.loadCustomData();
        this.loadPrayerTimes();
        this.loadVersion();
    },
    /**
     * load app version
     */
    loadVersion: function () {
        $.ajax({
            url: "version",
            async: false,
            data: "text",
            success: function (data) {
                $(".version").text("v" + data);
            }
        });
    },
    /**
     * load custom data
     */
    loadCustomData: function () {
        $.ajax({
            url: "data/custom-data.json",
            async: false,
            success: function (data) {
                prayer.customData = data;
            }
        });
    },
    /**
     * load prayer times ["monthe" = ["day"=> "line"] ]
     */
    loadPrayerTimes: function () {
        var prayerTimes = new Array();
        $.each(this.months, function (i, month) {
            csvFile = month + ".csv";
            $.ajax({
                url: "data/months/" + month + ".csv",
                async: false,
                success: function (data) {
                    prayerTimes[month] = data.split("\n");
                }
            });
        });
        this.prayerTimes = prayerTimes;
    },
    /**
     * get prayer waiting taimes
     * @returns {Array}
     */
    getPrayersWaitingTimes: function () {
        var waitings = this.customData.prayersWaitingTimes;
        if (this.getIchaTime() > this.customData.maximumIchaTimeForNoWaiting) {
            waitings[4] = 0;
        }
        return waitings;
    },
    /**
     * array of csv line data 
     * @returns {Array}
     */
    getTodayPrayerLine: function () {
        var prayerTimes = this.prayerTimes;
        return prayerTimes[dateTime.getCurrentMonth()][dateTime.getCurrentDay()].split(",");
    },
    /**
     * array of only five prayer times
     * @returns {Array}
     */
    getTodayFivePrayerTimes: function () {
        var prayerTimes = this.getTodayPrayerLine();
        prayerTimes = [prayerTimes[1], prayerTimes[3], prayerTimes[4], prayerTimes[5], this.getIchaTime()];
        if (dateTime.isLastSundayDst()) {
            $.each(prayerTimes, function (i, prayerTime) {
                prayerTimes[i] = prayer.dstConvertPrayerTime(prayerTime);
            });
        }
        return prayerTimes;
    },
    /**
     * +1|-1 hour for prayerTime depending DST
     * @param {String} prayerTime
     * @returns {Array}
     */
    dstConvertPrayerTime: function (prayerTime) {
        if (dateTime.isLastSundayDst()) {
            prayerTime = prayerTime.split(":");
            var hourPrayerTime = Number(prayerTime[0]) + (dateTime.getCurrentMonth() === "03" ? 1 : -1);
            var minutePrayerTime = prayerTime[1];
            prayerTime = dateTime.addZero(hourPrayerTime) + ':' + minutePrayerTime;
        }
        return prayerTime;
    },
    /**
     * get current date object for given prayer time 
     * @param {String} prayerTime
     * @returns {Date}
     */
    getCurrentDateForPrayerTime: function (prayerTime) {
        var date = new Date();
        prayerTime = prayerTime.split(':');
        date.setHours(prayerTime[0]);
        date.setMinutes(prayerTime[1]);
        date.setSeconds(0);
        return date;
    },
    /**
     * get Ichaa time, if ichaa is <= then 19:50 then return 19:50 
     * @returns {String}
     */
    getIchaTime: function () {
        var ichaTime = this.getTodayPrayerLine()[6];
        if (ichaTime <= this.customData.minimumIchaTime)
        {
            ichaTime = this.customData.minimumIchaTime;
        }
        return ichaTime;
    },
    /**
     * get chourouk time
     * @returns {String}
     */
    getChouroukTime: function () {
        var chouroukTime = this.getTodayPrayerLine()[2];
        if (dateTime.isLastSundayDst()) {
            chouroukTime = prayer.dstConvertPrayerTime(chouroukTime);
        }
        return  chouroukTime;
    },
    /**
     * init the cron that change prayer times by day
     * at midnight we change prayer times for the day
     * we check every minute
     */
    initCronMidNight: function () {
        setInterval(function () {
            if (dateTime.getCurrentHour() === "00" && dateTime.getCurrentMinute() === "00") {
                prayer.setDate();
                prayer.setPrayerTimes();
                prayer.setPrayerWaitings();
            }
        }, 60000);
    },
    /**
     * Check every minute if athan time is ok
     * if adhan time is ok we flash time
     * after one minute we stop flashing and show adhan douaa
     */
    adhanIsFlashing: false,
    initAdhanFlash: function () {
        setInterval(function () {
            if (!prayer.adhanIsFlashing) {
                var currentTime = dateTime.getCurrentTime(false);
                var prayerElm = $(".prayer:contains(" + currentTime + ")");
                if (prayerElm.length) {
                    prayer.adhanIsFlashing = true;
                    prayer.flashAdhan(prayerElm);
                }
            }
        }, 1000);
    },
    /**
     * Check every second if iqama time is ok
     * if ok we show iqama flashing for 30 sec
     */
    waitForNextiqamaFlashing: false,
    initIqamaFlash: function () {
        setInterval(function () {
            if (!prayer.waitForNextiqamaFlashing) {
                $(".prayer").each(function (currentPrayerIndex, prayerTime) {
                    prayerTime = $(prayerTime).text();
                    var diffTimeInMiniute = Math.floor((new Date() - prayer.getCurrentDateForPrayerTime(prayerTime)) / 60000);
                    if (diffTimeInMiniute === prayer.getPrayersWaitingTimes()[currentPrayerIndex]) {
                        prayer.waitForNextiqamaFlashing = true;
                        // iqama flashing
                        prayer.flashIqama(currentPrayerIndex);
                    }
                });
            }
        }, 1000);
    },
    /**
     * serch and set the next prayer time hilight
     */
    setNextPrayerTimeHilight: function () {
        var date = new Date();
        // sobh is default
        prayer.setNextPrayerTimeHilightByIndex(-1);
        $.each(this.getTodayFivePrayerTimes(), function (index, prayerTime) {
            prayerTimeDate = prayer.getCurrentDateForPrayerTime(prayerTime);
            // adding 15 minute
            prayerTimeDate.setMinutes(prayerTimeDate.getMinutes() + 15);
            if (date > prayerTimeDate) {
                prayer.setNextPrayerTimeHilightByIndex(index);
            }
        });
    },

    /**
     * hilight prayer by index
     * @param {integer} prayerIndex
     */
    hilighPrayertByIndex: function (prayerIndex) {
        $(".prayer").removeClass("prayer-hilighted");
        $(".desktop .prayer").eq(prayerIndex).addClass("prayer-hilighted");
        $(".mobile .prayer").eq(prayerIndex).addClass("prayer-hilighted");
    },
    /**
     * 10 minute after iqama we hilight the next prayer time
     * @param {int} currentPrayerTimeIndex 
     */
    setNextPrayerTimeHilightByIndex: function (currentPrayerTimeIndex) {
        nextPrayerTimeIndex = currentPrayerTimeIndex + 1;
        // if icha is the current prayer
        if (nextPrayerTimeIndex === 5) {
            nextPrayerTimeIndex = 0;
        }
        // for init
        this.hilighPrayertByIndex(nextPrayerTimeIndex);
        // 10 minute after
        setTimeout(function () {
            this.hilighPrayertByIndex(nextPrayerTimeIndex);
        }, 10 * 60000);
    },
    /**
     * Flash adhan for 1 minute
     * @param {object} prayerElm
     */
    flashAdhan: function (prayerElm) {
        var adhanFlashInterval = setInterval(function () {
            prayerElm.toggleClass("flash");
        }, 1000);

        setTimeout(function () {
            clearInterval(adhanFlashInterval);
            prayer.adhanIsFlashing = false;
            prayerElm.removeClass("flash");

            if (prayer.customData.enableAdhanDouaa === true) {
                prayer.adhanDouaa.show();
                setTimeout(function () {
                    prayer.adhanDouaa.hide();
                }, 60000);
            }
        }, 60000);
    },
    /**
     * flash iqama for 30 sec
     * @param {integer} currentPrayerIndex 
     */
    flashIqama: function (currentPrayerIndex) {
        var iqamaFlashInterval = setInterval(function () {
            $(".main").toggleClass("hidden");
            $(".iqama").toggleClass("hidden");
        }, 1000);

        // stop iqama flashing after 30 sec
        setTimeout(function () {
            clearInterval(iqamaFlashInterval);
            prayer.hideIqama();
            prayer.setNextPrayerTimeHilightByIndex(currentPrayerIndex);
        }, 30000);

        // reinit waitForNextiqamaFlashing to false after 1 min
        setTimeout(function () {
            prayer.waitForNextiqamaFlashing = false;
        }, 60000);
    },
    hideIqama: function () {
        $(".main").removeClass("hidden");
        $(".iqama").addClass("hidden");
    },
    adhanDouaa: {
        show: function () {
            $(".main").addClass("hidden");
            $(".adhan").removeClass("hidden");
        },
        hide: function () {
            $(".main").removeClass("hidden");
            $(".adhan").addClass("hidden");
        }
    },
    /**
     * set time every second
     */
    setTime: function () {
        $(".time").text(dateTime.getCurrentTime(true));
        setInterval(function () {
            $(".time").text(dateTime.getCurrentTime(true));
        }, 1000);
    },
    /**
     * set date
     */
    setDate: function () {
        $(".gregorianDate").text(dateTime.getCurrentDate());
        this.setCurrentHijriDate();
    },
    /**
     * set the hijri date, it's getting from api http://api.aladhan.com/gToH?date=
     * this api calculate hijri date from gregorian give date
     */
    setCurrentHijriDate: function () {
        var hijriDate = "";
        var day = dateTime.addZero(dateTime.getCurrentDay() + this.customData.hijriAdjustment);
        var month = dateTime.getCurrentMonth();
        var year = dateTime.getCurrentYear();
        $.ajax({
            url: prayer.hijriDateApiUrl + day + '-' + month + '-' + year,
            dataType: "json",
            success: function (response) {
                if (response.code === 200) {
                    data = response.data.hijri;
                    hijriDate = dateTime.getCurrentDayArabicText()
                            + ' ' + data.day
                            + ' ' + data.month.ar
                            + ' ' + data.year;

                    $(".hijriDate").text(hijriDate);
                }
            }
        });
    },
    /**
     * get joumouaa time depending dst
     * @returns {String}
     */
    getJoumouaaTime: function () {
        if (this.customData.joumouaaTime !== "") {
            return this.customData.joumouaaTime;
        }
        return dateTime.isDst() ? "13:10" : "12:10";
    },
    /**
     * show aid time if enabled
     */
    setAidPrayerTime: function () {
        $(".chourouk").show();
        $(".aid").hide();
        if (this.customData.aidIsEnabled) {
            $(".aid-id").text(this.customData.aidTime);
            $(".chourouk").hide();
            $(".aid").show();
        }
    },
    /**
     * set all prayer times 
     */
    setPrayerTimes: function () {
        $(".joumouaa-id").text(this.getJoumouaaTime());
        $(".chourouk-id").text(this.getChouroukTime());
        $(".sobh").text(this.getTodayFivePrayerTimes()[0]);
        $(".dohr").text(this.getTodayFivePrayerTimes()[1]);
        $(".asr").text(this.getTodayFivePrayerTimes()[2]);
        $(".maghrib").text(this.getTodayFivePrayerTimes()[3]);
        $(".ichaa").text(this.getIchaTime());
    },
    /**
     * set wating times
     */
    setPrayerWaitings: function () {
        $(".wait").each(function (i, e) {
            $(e).text(prayer.getPrayersWaitingTimes()[i % 5] + " min");
        });
    },
    /**
     * set static custom content, header, footer ...
     */
    setCustomContent: function () {
        $(".header").text(this.customData.headerText);
        $(".assosciation").text(this.customData.footerText);
        $(".site>span").text(this.customData.site);
    }
};