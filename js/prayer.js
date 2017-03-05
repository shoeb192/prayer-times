/* global dateTime */

/**
 * Class handling prayers 
 * @author ibrahim.zehhaf@gmail.com
 * @type {object}
 */

var prayer = {
    months: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
    times: [],
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
        this.setTimes();
        this.setWaitings();
        this.changePrayerOrder();
        this.initNextTimeHilight();
        this.initAdhanFlash();
        this.initIqamaFlash();
        this.initCronMidNight();
        this.setAidTime();
        this.setCustomContent();
        this.initDouaaAfterPrayerSlider();
        this.hideSpinner();
    },
    /**
     * load all data
     */
    loadData: function () {
        this.loadVersion();
        this.loadConfData();
        this.loadTimes();
    },
    /**
     * load app version
     */
    loadVersion: function () {
        $.ajax({
            url: "version?" + (new Date()).getTime(),
            async: false,
            success: function (data) {
                // reset conf if new version
                if (getVersion() !== data) {
                    removeConfFromLocalStorage();
                    setVersion(data);
                }

                $(".version").text("v" + data);
            }
        });
    },
    /**
     * load custom data
     * from localStorage if data exists, from json file otherwise
     */
    loadConfData: function () {
        if (localStorage.getItem("config") === null) {
            $.ajax({
                url: "conf/conf.json?" + (new Date()).getTime(),
                async: false,
                success: function (data) {
                    localStorage.setItem("config", JSON.stringify(data));
                    prayer.confData = data;
                }
            });
        } else {
            prayer.confData = JSON.parse(localStorage.getItem("config"));
        }
    },
    /**
     * load today prayer times
     * if calculChoice = csv we load from csv file
     * else we load from PrayTimes() function
     */
    loadTimes: function () {
        if (this.confData.calculChoice === "csv") {
            this.loadTimesFromCsv();
        } else if (this.confData.calculChoice === "custom") {
            this.loadTimesFromApi();
        }
    },
    /**
     * @returns {Array}
     */
    loadTimesFromCsv: function () {
        var times = new Array();
        $.ajax({
            url: "data/csv/" + prayer.confData.city + "/" + dateTime.getCurrentMonth() + ".csv?" + (new Date()).getTime(),
            async: false,
            success: function (data) {
                times = data.split(/\r|\n/);
                times = times[dateTime.getCurrentDay()].split(",");
                prayer.times = times.slice(1, times.length);
            }
        });
    },
    /**
     * @returns {Array}
     */
    loadTimesFromApi: function () {
        var prayTimes = new PrayTimes(prayer.confData.prayerMethod);
        if (prayer.confData.fajrDegree !== "") {
            prayTimes.adjust({"fajr": parseFloat(prayer.confData.fajrDegree)});
        }
        if (prayer.confData.ichaaDegree !== "") {
            prayTimes.adjust({"isha": parseFloat(prayer.confData.ichaaDegree)});
        }

        // times adjustment
        prayTimes.tune({
            fajr: prayer.confData.sobhAdjust,
            dhuhr: prayer.confData.dohrAdjust,
            asr: prayer.confData.asrAdjust,
            maghrib: prayer.confData.maghribAdjust,
            isha: prayer.confData.ishaAdjust
        });

        var pt = prayTimes.getTimes(new Date(), [parseFloat(prayer.confData.latitude), parseFloat(prayer.confData.longitude)]);
        this.times = [pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha];
    },
    /**
     * get today prayer times, array of only five prayer times
     * @returns {Array}
     */
    getTimes: function () {
        var times = this.times;
        times = [times[0], times[2], times[3], times[4], times[5]];
        if (dateTime.isLastSundayDst()) {
            $.each(times, function (i, time) {
                times[i] = prayer.dstConvertTime(time);
            });
        }
        return times;
    },
    /**
     * array of only five prayer times
     * @returns {Array}
     */
    getTimesWithAdjustedIchaa: function () {
        var times = this.getTimes().slice(0, 4);
        times.push(this.getIchaTime());
        return times;
    },
    getTimeByIndex: function (index) {
        return this.getTimesWithAdjustedIchaa()[index];
    },
    getWaitingByIndex: function (index) {
        var waiting = this.getWaitingTimes()[index];
        // if ichaa and waiting fixed to 0 we adjust wating to 3 min for adhan and douaa
        if (index === 4 && waiting === 0)
        {
            waiting = 3;
        }
        return waiting;
    },
    /**
     * get prayer waiting taimes
     * @returns {Array}
     */
    getWaitingTimes: function () {
        var waitings = this.confData.prayersWaitingTimes;
        if (this.confData.maximumIchaTimeForNoWaiting !== "" && this.getIchaTime() > this.confData.maximumIchaTimeForNoWaiting) {
            waitings[4] = 0;
        }
        return waitings;
    },
    /**
     * +1|-1 hour for time depending DST
     * @param {String} time
     * @returns {Array}
     */
    dstConvertTime: function (time) {
        if (prayer.confData.calculChoice === "csv" && dateTime.isLastSundayDst()) {
            time = time.split(":");
            var hourPrayerTime = Number(time[0]) + (dateTime.getCurrentMonth() === "03" ? 1 : -1);
            var minutePrayerTime = time[1];
            time = dateTime.addZero(hourPrayerTime) + ':' + minutePrayerTime;
        }
        return time;
    },
    /**
     * get current date object for given prayer time 
     * @param {String} time
     * @returns {Date}
     */
    getCurrentDateForPrayerTime: function (time) {
        var date = new Date();
        time = time.split(':');
        date.setHours(time[0]);
        date.setMinutes(time[1]);
        date.setSeconds(0);
        return date;
    },
    /**
     * get Ichaa time, if ichaa is <= then 19:50 then return 19:50 
     * @returns {String}
     */
    getIchaTime: function () {
        var ichaTime = this.getTimes()[4];
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
        var chouroukTime = this.times[1];
        if (dateTime.isLastSundayDst()) {
            chouroukTime = prayer.dstConvertTime(chouroukTime);
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
            var date = new Date();
            if (date.getHours() === 0 && date.getMinutes() === 0) {
                prayer.setDate();
                prayer.loadTimes();
                prayer.setTimes();
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
                $(prayer.getTimesWithAdjustedIchaa()).each(function (currentPrayerIndex, time) {
                    if (time === dateTime.getCurrentTime()) {
                        var prayerElm = $(".prayer:contains(" + currentTime + ")");
                        if (prayerElm.length) {
                            // if joumouaa time we don't flash adhan
                            if (!prayer.isJoumouaa(currentPrayerIndex)) {
                                prayer.adhanIsFlashing = true;
                                prayer.flashAdhan(prayerElm, currentPrayerIndex);
                            }
                        }
                    }
                });
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
                $(prayer.getTimesWithAdjustedIchaa()).each(function (currentPrayerIndex, time) {
                    var diffTimeInMiniute = Math.floor((new Date() - prayer.getCurrentDateForPrayerTime(time)) / prayer.oneMinute);
                    var currentPrayerWaitingTime = prayer.getWaitingByIndex(currentPrayerIndex);
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
     * @param {integer} currentPrayerIndex
     */
    flashAdhan: function (currentPrayerElm, currentPrayerIndex) {
        // iqama countdown
        prayer.iqamaCountdown(currentPrayerIndex);
        // timeout for douaa show
        prayer.adhanDouaa.setTimeout();
        var adhanFlashInterval = setInterval(function () {
            currentPrayerElm.toggleClass("flash");
        }, prayer.oneSecond);
        // timeout for stopping time flashing
        setTimeout(function () {
            clearInterval(adhanFlashInterval);
            prayer.adhanIsFlashing = false;
            currentPrayerElm.removeClass("flash");
        }, prayer.oneMinute);
    },
    /**
     * flash iqama for 30 sec
     * @param {integer} currentPrayerIndex 
     */
    flashIqama: function (currentPrayerIndex) {
        prayer.setNextTimeHilight(currentPrayerIndex);

        // if joumuaa time we don't flash iqama
        if (!prayer.isJoumouaa(currentPrayerIndex)) {
            var iqamaFlashInterval = setInterval(function () {
                $(".main").toggleClass("hidden");
                $(".iqama").toggleClass("hidden");
            }, prayer.oneSecond);
            // stop iqama flashing after 45 sec
            setTimeout(function () {
                clearInterval(iqamaFlashInterval);
                prayer.hideIqama();
            }, prayer.confData.iqamaDisplayTime * prayer.oneSecond);
        }
        // reset flag iqamaIsFlashing after one minute
        setTimeout(function () {
            prayer.iqamaIsFlashing = false;
        }, prayer.oneMinute);
    },
    /**
     * Set iqama countdonwn
     * @param {integer} currentPrayerIndex
     */
    iqamaCountdown: function (currentPrayerIndex) {
        var time = prayer.getTimeByIndex(currentPrayerIndex);
        var waiting = $(".prayer-wait .wait").eq(currentPrayerIndex).text();
        var prayerTimeDate = prayer.getCurrentDateForPrayerTime(time);
        var prayerTimePlusWaiting = prayerTimeDate.setMinutes(prayerTimeDate.getMinutes() + prayer.getWaitingByIndex(currentPrayerIndex));
        var currentElem = $(".prayer-wait .wait").eq(currentPrayerIndex);
        $(currentElem).countdown(prayerTimePlusWaiting, function (event) {
            $(this).text(event.strftime('%M:%S'));
        }).on('finish.countdown', function () {
            $(currentElem).text(waiting);
        });
    },
    hideIqama: function () {
        $(".main").removeClass("hidden");
        $(".iqama").addClass("hidden");
    },
    /**
     * serch and set the next prayer time hilight
     */
    initNextTimeHilight: function () {
        var date = new Date();
        // sobh is default
        prayer.hilighByIndex(0);
        var times = this.getTimesWithAdjustedIchaa();
        $.each(times, function (index, time) {
            prayerTimeDate = prayer.getCurrentDateForPrayerTime(time);
            // adding 15 minute
            prayerTimeDate.setMinutes(prayerTimeDate.getMinutes() + 15);
            if (date > prayerTimeDate) {
                index++;
                if (index === 5) {
                    index = 0;
                }
                prayer.hilighByIndex(index);
            }
        });
    },
    /**
     * hilight prayer by index
     * @param {integer} prayerIndex
     */
    hilighByIndex: function (prayerIndex) {
        var time = this.getTimeByIndex(prayerIndex);
        $(".prayer").removeClass("prayer-hilighted");
        $(".prayer-text .text").removeClass("text-hilighted");
        $(".prayer-wait .wait").removeClass("text-hilighted");

        // if joumouaa we hilight joumouaa time
        if (prayer.isJoumouaa(prayerIndex)) {
            $(".joumouaa-id").addClass("prayer-hilighted");
            return;
        }

        $(".prayer-text .text").eq(prayerIndex).addClass("text-hilighted");
        $(".prayer-wait .wait").eq(prayerIndex).addClass("text-hilighted");
        $(".desktop .prayer:contains(" + time + ")").addClass("prayer-hilighted");
        $(".mobile .prayer:contains(" + time + ")").addClass("prayer-hilighted");
    },
    /**
     * 10 minute after current iqama we hilight the next prayer time
     * @param {int} currentTimeIndex 
     */
    setNextTimeHilight: function (currentTimeIndex) {
        nextTimeIndex = currentTimeIndex + 1;
        // if icha is the current prayer
        if (nextTimeIndex === 5) {
            nextTimeIndex = 0;
        }
        setTimeout(function () {
            prayer.hilighByIndex(nextTimeIndex);
            prayer.showDouaasAfterPrayer();
        }, 10 * prayer.oneMinute);
    },
    /**
     * If enabled show douaa after prayer for 5 minutes
     */
    showDouaasAfterPrayer: function () {
        if (prayer.confData.douaaAfterPrayerEnabled === true) {
            $(".main").fadeOut(2000, function () {
                $(".douaa-after-prayer").fadeIn(300);
            });

            var douaaInterval = setInterval(function () {
                moveLeft();
            }, 15000);

            setTimeout(function () {
                $(".douaa-after-prayer").fadeOut(2000, function () {
                    $(".main").fadeIn(300);
                });
                clearInterval(douaaInterval);
            }, 5 * prayer.oneMinute);
        }
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
         * show douaa 2.5 minutes after adhan flash 
         * show douaa for configured time
         */
        setTimeout: function () {
            if (prayer.confData.douaaAfterAdhanEnabled === true) {
                setTimeout(function () {
                    prayer.adhanDouaa.show();
                    setTimeout(function () {
                        prayer.adhanDouaa.hide();
                    }, prayer.confData.adhanDouaaDisplayTime * prayer.oneSecond);
                }, 150 * prayer.oneSecond);
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
        if (prayer.confData.hijriDateEnabled === true) {
            $(".hijriDate").text(writeIslamicDate(prayer.confData.hijriAdjustment));
        }
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
     * if current time is joumouaa
     * @param {int} currentPrayerIndex 
     * @returns {boolean}
     */
    isJoumouaa: function (currentPrayerIndex) {
        var date = new Date();
        return date.getDay() === 5 && currentPrayerIndex === 1;
    },
    /**
     * @param {string} time 
     * @returns {integer}
     */
    getPrayerIndexByTime: function (time) {
        var index = null;
        $.each(prayer.getTimesWithAdjustedIchaa(), function (i, t) {
            if (t === time) {
                index = i;
            }
        });
        return  index;
    },
    /**
     * show aid time if enabled
     */
    setAidTime: function () {
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
    setTimes: function () {
        $(".joumouaa-id").text(this.getJoumouaaTime());
        $(".chourouk-id").text(this.getChouroukTime());
        $(".sobh").text(this.getTimes()[0]);
        $(".dohr").text(this.getTimes()[1]);
        $(".asr").text(this.getTimes()[2]);
        $(".maghrib").text(this.getTimes()[3]);
        $(".ichaa").text(this.getIchaTime());
    },
    /**
     * set wating times
     */
    setWaitings: function () {
        $(".wait").each(function (i, e) {
            $(e).text(prayer.getWaitingTimes()[i % 5] + "\"");
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
    },
    /**
     * Change prayer order for arabic
     */
    changePrayerOrder: function () {
        if (prayer.confData.lang === "ar") {
            var texts = $(".prayer-text").find("div");
            var times = $(".prayer-time").find("div");
            var waits = $(".prayer-wait").find("div");
            $(".prayer-text").find("dev").remove();
            $(".prayer-time").find("dev").remove();
            $(".prayer-wait").find("dev").remove();
            for (var i = 4; i >= 0; i--) {
                $(".prayer-text").append(texts[i]);
                $(".prayer-time").append(times[i]);
                $(".prayer-wait").append(waits[i]);
            }
            $("body").css("font-family", "Amiri");
            $(".prayer-time").css("font-family", "Arial");
        }
    },
    /**
     *  init douaa after prayer slider
     */
    initDouaaAfterPrayerSlider: function () {
        $('.douaa-after-prayer').load('douaa-slider.html', function () {
            var screenWidth = $(window).width() - 20;
            var screenHight = $(window).height() - $('.douaa-after-prayer .title').height() - 30;
            $('#slider ul li').width(screenWidth);
            $('#slider ul li').height(screenHight);
            var slideCount = $('#slider ul li').length;
            var sliderUlWidth = slideCount * screenWidth;
            $('#slider').css({width: screenWidth, height: screenHight});
            $('#slider ul').css({width: sliderUlWidth, marginLeft: -screenWidth});
            $('#slider ul li:last-child').prependTo('#slider ul');
            $('.douaa-after-prayer').fadeOut();
        });
    }
};

prayer.init();