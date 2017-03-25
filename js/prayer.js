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
     * Conf
     * @type Json
     */
    confData: null,
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
        $('[data-toggle="tooltip"]').tooltip();
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
     * from localStorage if data already exists, from json file otherwise
     */
    loadConfData: function () {
        if (localStorage.getItem("config") === null) {
            $.ajax({
                url: "data/conf.json?" + (new Date()).getTime(),
                async: false,
                success: function (data) {
                    localStorage.setItem("config", JSON.stringify(data));
                    prayer.confData = data;
                }
            });
        } else {
            prayer.confData = JSON.parse(localStorage.getItem("config"));
        }
        this.debugConf();
    },
    debugConf: function () {
        var debugData = "<p><b>Source de calcul : </b>" + prayer.confData.calculChoice + "<br>";
        if (prayer.confData.calculChoice === "csvFile") {
            debugData += "<b>Chemin CSV : </b>" + prayer.confData.csvFilePath + "<br>";
        } else if(prayer.confData.calculChoice === "custom") {
            debugData += "<b>Méthode de calcul : </b>" + prayer.confData.prayerMethod + "<br>" +
                    "<b>latitude : </b>" + prayer.confData.latitude + "<br>" +
                    "<b>longitude : </b>" + prayer.confData.longitude + "<br>" +
                    "<b>Degré du fajr : </b>" + prayer.confData.fajrDegree + "<br>" +
                    "<b>Degré du ichaa : </b>" + prayer.confData.ichaaDegree + "<br></p>";
        }
        $(".header").attr("title", debugData);
    },
    /**
     * load today prayer times
     * if calculChoice = csvFile we load from csv file
     * else we load from PrayTimes() function
     */
    loadPrayerTimes: function () {
        if (this.confData.calculChoice === "csvFile") {
            this.loadPrayerTimesFromCsv();
        } else if (this.confData.calculChoice === "custom") {
            this.loadPrayerTimesFromApi();
        }
    },
    /**
     * @returns {Array}
     */
    loadPrayerTimesFromCsv: function () {
        var prayerTimes = new Array();
        $.ajax({
            url: "data/csv/" + prayer.confData.csvFilePath + "/" + dateTime.getCurrentMonth() + ".csv?" + (new Date()).getTime(),
            async: false,
            success: function (data) {
                prayerTimes = data.split("\n");
            }
        });
        this.prayerTimes = prayerTimes[dateTime.getCurrentDay()].split(",");
        this.prayerTimes = this.prayerTimes.slice(1, this.prayerTimes.length)
    },
    /**
     * @returns {Array}
     */
    loadPrayerTimesFromApi: function () {
        var prayTimes = new PrayTimes(prayer.confData.prayerMethod);
        if (prayer.confData.fajrDegree !== "") {
            prayTimes.adjust({"fajr": parseFloat(prayer.confData.fajrDegree)});
        }
        if (prayer.confData.ichaaDegree !== "") {
            prayTimes.adjust({"isha": parseFloat(prayer.confData.ichaaDegree)});
        }
        
        var pt = prayTimes.getTimes(new Date(), [parseFloat(prayer.confData.latitude), parseFloat(prayer.confData.longitude)]);
        this.prayerTimes = [pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha];
    },
    /**
     * array of only five prayer times
     * @returns {Array}
     */
    getTodayFivePrayerTimes: function () {
        var prayerTimes = this.prayerTimes;
        prayerTimes = [prayerTimes[0], prayerTimes[2], prayerTimes[3], prayerTimes[4], prayerTimes[5]];
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
     * get prayer waiting taimes
     * @returns {Array}
     */
    getPrayersWaitingTimes: function () {
        var waitings = this.confData.prayersWaitingTimes;
        if (this.confData.maximumIchaTimeForNoWaiting !== "" && this.getIchaTime() > this.confData.maximumIchaTimeForNoWaiting) {
            waitings[4] = 0;
        }
        return waitings;
    },
    /**
     * +1|-1 hour for prayerTime depending DST
     * @param {String} prayerTime
     * @returns {Array}
     */
    dstConvertPrayerTime: function (prayerTime) {
        if (prayer.confData.calculChoice === "csvFile" && dateTime.isLastSundayDst()) {
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
        if (this.confData.minimumIchaTime !== "" && ichaTime <= this.confData.minimumIchaTime)
        {
            ichaTime = this.confData.minimumIchaTime;
        }
        return ichaTime;
    },
    /**
     * get chourouk time
     * @returns {String}
     */
    getChouroukTime: function () {
        var chouroukTime = this.prayerTimes[1];
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
                prayer.loadPrayerTimes();
                prayer.setPrayerTimes();
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
            if (prayer.confData.adhanDouaaEnabled === true) {
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
     * set hijri date from hijriDate.js
     */
    setCurrentHijriDate: function () {
        $(".hijriDate").text(writeIslamicDate(prayer.confData.hijriAdjustment));
    },
    /**
     * get joumouaa time depending dst
     * @returns {String}
     */
    getJoumouaaTime: function () {
        if (this.confData.joumouaaTime !== "") {
            return this.confData.joumouaaTime;
        }
        return dateTime.isDst() ? "13:10" : "12:10";
    },
    /**
     * show aid time if enabled
     */
    setAidPrayerTime: function () {
        $(".chourouk").show();
        $(".aid").hide();
        if (this.confData.aidTime !== "") {
            $(".aid-id").text(this.confData.aidTime);
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
        $(".header").html(this.confData.headerText);
        $(".site").html(this.confData.site);
        $(".assosciation").html(this.confData.footerText);
        $(".supportTel").text(this.confData.supportTel);
        if (!this.confData.androidAppEnabled) {
            $(".android-app").addClass("visibilty-hidden");
        }
    },
    hideSpinner: function () {
        $(".main").fadeIn(1000, function () {
            $(".spinner").hide();
        });
    }
};