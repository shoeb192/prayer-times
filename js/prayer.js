/* global dateTime */

/**
 * Class handling prayers 
 * @author ibrahim.zehhaf@gmail.com
 * @type {object}
 */

var prayer = {
    months: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
    prayerTimes: [],
    /**
     * hijri api url 
     */
    hijriDateApiUrl: "http://api.aladhan.com/gToH?date=",
    /**
     * One minute in milliseconds
     * @type Integer
     */
    oneMinute: 60000,
    /**
     * One minute in milliseconds
     * @type Integer
     */
    oneSecond: 1000,
    /**
     * init the app
     */
    init: function () {
        this.loadData();
        this.setTime();
        this.setDate();
        this.setPrayerTimes();
        this.setPrayerWaitings();
        this.initNextPrayerTimeHilight();
        this.initAdhanFlash();
        this.initIqamaFlash();
        this.initCronMidNight();
        this.setAidPrayerTime();
        this.setCustomContent();
        this.hideSpinner();
    },
    /**
     * load all data
     */
    loadData: function () {
        this.loadConfData();
        this.loadPrayerTimes();
        this.loadVersion();
    },
    /**
     * load app version
     */
    loadVersion: function () {
        $.ajax({
            url: "version?" + (new Date()).getTime(),
            async: false,
            success: function (data) {
                $(".version").text("v" + data);
            }
        });
    },
    /**
     * load custom data
     */
    loadConfData: function () {
        $.ajax({
            url: "data/conf.json?" + (new Date()).getTime(),
            async: false,
            success: function (data) {
                if (localStorage.getItem("config") === null) {
                    localStorage.setItem("config", JSON.stringify(data));
                }
            }
        });
    },
    /**
     * get custom data
     */
    getConfData: function () {
        return JSON.parse(localStorage.getItem("config"));
    },
    /**
     * load prayer times ["monthe" = ["day"=> "line"] ]
     */
    loadPrayerTimes: function () {
        var prayerTimes = new Array();
        $.ajax({
            url: "data/times/" + prayer.getConfData().timesPath + "/" + dateTime.getCurrentMonth() + ".csv?" + (new Date()).getTime(),
            async: false,
            success: function (data) {
                prayerTimes = data.split("\n");
            }
        });
        this.prayerTimes = prayerTimes;
    },
    /**
     * get prayer waiting taimes
     * @returns {Array}
     */
    getPrayersWaitingTimes: function () {
        var waitings = this.getConfData().prayersWaitingTimes;
        if (this.getConfData().maximumIchaTimeForNoWaiting !== "" && this.getIchaTime() > this.getConfData().maximumIchaTimeForNoWaiting) {
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
        return prayerTimes[dateTime.getCurrentDay()].split(",");
    },
    /**
     * array of only five prayer times
     * @returns {Array}
     */
    getTodayFivePrayerTimes: function () {
        var prayerTimes = this.getTodayPrayerLine();
        prayerTimes = [prayerTimes[1], prayerTimes[3], prayerTimes[4], prayerTimes[5], prayerTimes[6]];
        if (dateTime.isLastSundayDst()) {
            $.each(prayerTimes, function (i, prayerTime) {
                prayerTimes[i] = prayer.dstConvertPrayerTime(prayerTime);
            });
        }
        return prayerTimes;
    },
    /**
     * array of only five prayer times
     * @returns {Array}
     */
    getTodayFivePrayerTimesWithAdjustedIchaaTime: function () {
        var prayerTimes = this.getTodayFivePrayerTimes().slice(0, 4);
        prayerTimes.push(this.getIchaTime());
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
        var ichaTime = this.getTodayFivePrayerTimes()[4];
        if (this.getConfData().minimumIchaTime !== "" && ichaTime <= this.getConfData().minimumIchaTime)
        {
            ichaTime = this.getConfData().minimumIchaTime;
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
                // load PrayerTimes for the current month every 1 st of month
                if (dateTime.getCurrentDay() === 1) {
                    prayer.loadPrayerTimes();
                }

                prayer.setDate();
                prayer.setPrayerTimes();
                prayer.setPrayerWaitings();
            }
        }, prayer.oneMinute);
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
        }, prayer.oneSecond);
    },
    /**
     * Check every second if iqama time is ok
     * if ok we show iqama flashing for 30 sec
     */
    iqamaIsFlashing: false,
    initIqamaFlash: function () {
        setInterval(function () {
            if (!prayer.iqamaIsFlashing) {
                $(prayer.getTodayFivePrayerTimesWithAdjustedIchaaTime()).each(function (currentPrayerIndex, prayerTime) {
                    // if joumuaa time we don't flash iqama
                    if (dateTime.getCurrentDayText()[0] === "Vendredi" && currentPrayerIndex === 1) {
                        return;
                    }

                    var diffTimeInMiniute = Math.floor((new Date() - prayer.getCurrentDateForPrayerTime(prayerTime)) / prayer.oneMinute);
                    var currentPrayerWaitingTime = prayer.getPrayersWaitingTimes()[currentPrayerIndex];

                    // if icha time and waiting is equal to 0, flash iqama will be run after 2 mins
                    if (currentPrayerIndex === 4 && currentPrayerWaitingTime === 0) {
                        currentPrayerWaitingTime = 2;
                    }

                    if (diffTimeInMiniute === currentPrayerWaitingTime) {
                        prayer.iqamaIsFlashing = true;
                        // iqama flashing
                        prayer.flashIqama(currentPrayerIndex);
                    }
                });
            }
        }, prayer.oneSecond);
    },
    /**
     * Flash adhan for 1 minute
     * @param {object} currentPrayerElm
     */
    flashAdhan: function (currentPrayerElm) {
        var adhanFlashInterval = setInterval(function () {
            currentPrayerElm.toggleClass("flash");
        }, prayer.oneSecond);

        // timeout for stopping time flashing
        setTimeout(function () {
            clearInterval(adhanFlashInterval);
            prayer.adhanIsFlashing = false;
            currentPrayerElm.removeClass("flash");
            // timeout for douaa show
            prayer.adhanDouaa.setTimeout();
        }, prayer.oneMinute);

    },
    /**
     * flash iqama for 30 sec
     * @param {integer} currentPrayerIndex 
     */
    flashIqama: function (currentPrayerIndex) {
        prayer.setNextPrayerTimeHilight(currentPrayerIndex);

        var iqamaFlashInterval = setInterval(function () {
            $(".main").toggleClass("hidden");
            $(".iqama").toggleClass("hidden");
        }, prayer.oneSecond);

        // stop iqama flashing after 45 sec
        setTimeout(function () {
            clearInterval(iqamaFlashInterval);
            prayer.hideIqama();
        }, 30 * prayer.oneSecond);

        // reset flag iqamaIsFlashing after one minute
        setTimeout(function () {
            prayer.iqamaIsFlashing = false;
        }, prayer.oneMinute);
    },
    hideIqama: function () {
        $(".main").removeClass("hidden");
        $(".iqama").addClass("hidden");
    },
    /**
     * serch and set the next prayer time hilight
     */
    initNextPrayerTimeHilight: function () {
        var date = new Date();
        // sobh is default
        prayer.hilighPrayertByIndex(0);
        var prayerTimes = this.getTodayFivePrayerTimes().slice(0, 4);
        prayerTimes.push(this.getIchaTime());
        $.each(prayerTimes, function (index, prayerTime) {
            prayerTimeDate = prayer.getCurrentDateForPrayerTime(prayerTime);
            // adding 15 minute
            prayerTimeDate.setMinutes(prayerTimeDate.getMinutes() + 15);
            if (date > prayerTimeDate) {
                index++;
                if (index === 5) {
                    index = 0;
                }
                prayer.hilighPrayertByIndex(index);
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
     * 10 minute after current iqama we hilight the next prayer time
     * @param {int} currentPrayerTimeIndex 
     */
    setNextPrayerTimeHilight: function (currentPrayerTimeIndex) {
        nextPrayerTimeIndex = currentPrayerTimeIndex + 1;
        // if icha is the current prayer
        if (nextPrayerTimeIndex === 5) {
            nextPrayerTimeIndex = 0;
        }
        setTimeout(function () {
            prayer.hilighPrayertByIndex(nextPrayerTimeIndex);
        }, 10 * prayer.oneMinute);
    },
    adhanDouaa: {
        show: function () {
            $(".main").addClass("hidden");
            $(".adhan").removeClass("hidden");
        },
        hide: function () {
            $(".main").removeClass("hidden");
            $(".adhan").addClass("hidden");
        },
        /**
         * show douaa 30 sec after adhan flash 
         * show douaa for 30 sec
         */
        setTimeout: function () {
            if (prayer.getConfData().adhanDouaaEnabled === true) {
                setTimeout(function () {
                    prayer.adhanDouaa.show();
                    setTimeout(function () {
                        prayer.adhanDouaa.hide();
                    }, 30 * prayer.oneSecond);
                }, 30 * prayer.oneSecond);
            }
        }
    },
    /**
     * set time every second
     */
    setTime: function () {
        $(".time").text(dateTime.getCurrentTime(true));
        setInterval(function () {
            $(".time").text(dateTime.getCurrentTime(true));
        }, prayer.oneSecond);
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
        $(".hijriDate").text("");
        var hijriDate = "";
        var day = dateTime.addZero(dateTime.getCurrentDay());
        var month = dateTime.getCurrentMonth();
        var year = dateTime.getCurrentYear();
        $.ajax({
            url: prayer.hijriDateApiUrl + day + '-' + month + '-' + year,
            dataType: "json",
            success: function (response) {
                if (response.code === 200) {
                    var data = response.data.hijri;
                    var hijriDay = dateTime.addZero(parseInt(data.day) + parseInt(prayer.getConfData().hijriAdjustment));
                    hijriDate = dateTime.getCurrentDayArabicText()
                            + ' ' + hijriDay
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
        if (this.getConfData().joumouaaTime !== "") {
            return this.getConfData().joumouaaTime;
        }
        return dateTime.isDst() ? "13:10" : "12:10";
    },
    /**
     * show aid time if enabled
     */
    setAidPrayerTime: function () {
        $(".chourouk").show();
        $(".aid").hide();
        if (this.getConfData().aidTime !== "") {
            $(".aid-id").text(this.getConfData().aidTime);
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
        $(".header").html(this.getConfData().headerText);
        $(".site").html(this.getConfData().site);
        $(".assosciation").html(this.getConfData().footerText);
        $(".supportTel").text(this.getConfData().supportTel);
        if (!this.getConfData().androidAppEnabled) {
            $(".android-app").addClass("visibilty-hidden");
        }
    },
    hideSpinner: function () {
        $(".main").fadeIn(1000, function () {
            $(".spinner").hide();
        });
    }
};