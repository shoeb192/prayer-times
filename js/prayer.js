/* global dateTime */

/**
 * Class handling prayers 
 * @author ibrahim.zehhaf@gmail.com
 * @type {object}
 */

var prayer = {
    months: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
    /**
     * time to wait before hilight next prayer time  (in minutes)
     * @type Number
     */
    nextPrayerHilightWait: 5,
    /**
     * prayer times
     * @type Array
     */
    times: [],
    /**
     * One minute in milliseconds
     * @type Integer
     */
    oneMinute: 60000,
    /**
     * One second in milliseconds
     * @type Integer
     */
    oneSecond: 1000,
    /**
     * in milliseconds
     * @type Number 
     */
    adhanFlashingTime: 120000,
    /**
     * Conf from conf.json
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
        this.initNextTimeHilight();
        this.initAdhanFlash();
        this.initIqamaFlash();
        this.initCronHandlingTimes();
        this.setCustomTime();
        this.jumuaHandler.init();
        this.setCustomContent();
        this.setQRCode();
        this.translateToArabic();
        this.initEvents();
        this.hideSpinner();
        prayer.initWakupFajr();
        douaaSlider.init();
    },
    /**
     * load all data
     */
    loadData: function () {
        this.loadVersion();
        this.setConfData();
        this.loadTimes();

        // if current time > ichaa time + 5 minutes we load tomorrow times
        var date = new Date();
        if (date.getHours() !== 0) {
            var ichaaDateTime = this.getCurrentDateForPrayerTime(this.getIchaTime());
            ichaaDateTime.setMinutes(ichaaDateTime.getMinutes() + this.nextPrayerHilightWait);
            if (date > ichaaDateTime) {
                this.loadTimes(true);
            }
        }
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
    setConfData: function () {
        loadConfData();
        prayer.confData = JSON.parse(localStorage.getItem("config"));
    },
    /**
     * load prayer times
     * if calculChoice = csv we load from csv file
     * else we load from PrayTimes() function
     * @param {boolean} tomorrow if true we load tomorrow time, otherxise we load today times
     */
    loadTimes: function (tomorrow) {
        if (this.confData.calculChoice === "csv") {
            this.loadTimesFromCsv(tomorrow);
        } else if (this.confData.calculChoice === "custom") {
            this.loadTimesFromApi(tomorrow);
        }
    },
    /**
     * @param {boolean} tomorrow 
     * @returns {Array}
     */
    loadTimesFromCsv: function (tomorrow) {

        var month = dateTime.getCurrentMonth();
        var day = dateTime.getCurrentDay();
        if (typeof tomorrow === 'boolean' && tomorrow === true) {
            month = dateTime.getTomorrowMonth();
            day = dateTime.getTomorrowDay();
        }
        var times = new Array();
        $.ajax({
            url: "data/csv/" + prayer.confData.city + "/" + month + ".csv?" + getVersion(),
            async: false,
            success: function (data) {
                times = data.split(/(?:\r?\n)/g);
                times = times[day].split(",");
                prayer.times = times.slice(1, times.length);
            }
        });
    },
    /**
     * @param {boolean} tomorrow 
     * Load times from PrayTimes API
     */
    loadTimesFromApi: function (tomorrow) {
        var prayTimes = new PrayTimes(prayer.confData.prayerMethod);
        if (prayer.confData.fajrDegree !== "") {
            prayTimes.adjust({"fajr": parseFloat(prayer.confData.fajrDegree)});
        }
        if (prayer.confData.ichaaDegree !== "") {
            prayTimes.adjust({"isha": parseFloat(prayer.confData.ichaaDegree)});
        }

        // times adjustment
        prayTimes.tune({
            fajr: prayer.confData.prayerTimesAdjustment[0],
            dhuhr: prayer.confData.prayerTimesAdjustment[1],
            asr: prayer.confData.prayerTimesAdjustment[2],
            maghrib: prayer.confData.prayerTimesAdjustment[3],
            isha: prayer.confData.prayerTimesAdjustment[4]
        });

        var date = new Date();
        if (typeof tomorrow === 'boolean' && tomorrow === true) {
            date = dateTime.tomorrow();
        }
        var timezone = prayer.confData.timezone == parseInt(prayer.confData.timezone) ? parseInt(prayer.confData.timezone) : 'auto';
        var dst = prayer.confData.dst == parseInt(prayer.confData.dst) ? parseInt(prayer.confData.dst) : 'auto';

        var pt = prayTimes.getTimes(date, [parseFloat(prayer.confData.latitude), parseFloat(prayer.confData.longitude)], timezone, dst);
        this.times = [pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha];
    },
    /**
     * get today prayer times, array of only five prayer times
     * @returns {Array}
     */
    getTimes: function () {
        var times = this.times;
        times = [times[0], times[2], times[3], times[4], times[5]];
        $.each(times, function (i, time) {
            times[i] = prayer.dstConvertTimeForCsvMode(time);
            if (prayer.confData.prayerTimesFixing[i] !== "" && prayer.confData.prayerTimesFixing[i] > times[i]) {
                times[i] = prayer.confData.prayerTimesFixing[i];
            }
        });
        return times;
    },
    getTimeByIndex: function (index) {
        return this.getTimes()[index];
    },
    getWaitingByIndex: function (index) {
        var waiting = this.getWaitingTimes()[index];
        // if waiting fixed to 0 we adjust wating to 3 min for adhan and douaa
        if (waiting === 0)
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
        if (this.confData.maximumIchaTimeForNoWaiting !== "" && this.getIchaTime() >= this.confData.maximumIchaTimeForNoWaiting) {
            waitings[4] = 0;
        }
        return waitings;
    },
    /**
     * +1|-1 hour for time depending DST
     * @param {String} time
     * @returns {Array}
     */
    dstConvertTimeForCsvMode: function (time) {
        var applyConvertion = prayer.confData.calculChoice === "csv" &&
                parseInt(prayer.confData.dst) !== 0 &&
                dateTime.isLastSundayDst();

        if (applyConvertion) {
            time = time.split(":");
            var hourPrayerTime = Number(time[0]) + (dateTime.getCurrentMonth() === "03" ? 1 : -1);
            var minutePrayerTime = time[1];
            time = addZero(hourPrayerTime) + ':' + minutePrayerTime;
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
        return this.getTimes()[4];
    },
    /**
     * get chourouk time
     * @returns {String}
     */
    getChouroukTime: function () {
        var chouroukTime = this.times[1];
        if (dateTime.isLastSundayDst()) {
            chouroukTime = prayer.dstConvertTimeForCsvMode(chouroukTime);
        }
        return  chouroukTime;
    },
    /**
     * Get the imsak time calculated by soustraction of imsakNbMinBeforeSobh from sobh time
     * @returns {String}
     */
    getImsak: function () {
        var sobh = this.getTimeByIndex(0);
        var sobhDateTime = this.getCurrentDateForPrayerTime(sobh);
        var imsakDateTime = sobhDateTime.setMinutes(sobhDateTime.getMinutes() - this.confData.imsakNbMinBeforeSobh);
        var imsakDateTime = new Date(imsakDateTime);
        return addZero(imsakDateTime.getHours()) + ':' + addZero(imsakDateTime.getMinutes());
    },
    /**
     * init the cron that change prayer times by day
     * at midnight we change prayer times for the day
     * we check every minute
     */
    initCronHandlingTimes: function () {
        setInterval(function () {
            var date = new Date();
            if (date.getHours() === 0 && date.getMinutes() === 0) {
                prayer.setDate();
                prayer.loadTimes();
                prayer.setTimes();
                prayer.initNextTimeHilight();
            }

            prayer.setCustomTime();
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
                var currentTime = dateTime.getCurrentTime()
                $(prayer.getTimes()).each(function (currentPrayerIndex, time) {
                    if (time === currentTime) {
                        // if jumua time we don't flash adhan
                        if (!prayer.isJumua(currentPrayerIndex)) {
                            prayer.adhanIsFlashing = true;
                            prayer.flashAdhan(currentPrayerIndex);
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
                $(prayer.getTimes()).each(function (currentPrayerIndex, time) {
                    if (!prayer.isJumua(currentPrayerIndex)) {
                        var diffTimeInMiniute = Math.floor((new Date() - prayer.getCurrentDateForPrayerTime(time)) / prayer.oneMinute);
                        var currentPrayerWaitingTime = prayer.getWaitingByIndex(currentPrayerIndex);
                        if (diffTimeInMiniute === currentPrayerWaitingTime) {
                            prayer.iqamaIsFlashing = true;
                            // iqama flashing
                            prayer.flashIqama(currentPrayerIndex);
                        }
                    }
                });
            }
        }, prayer.oneSecond);
    },
    /**
     * Flash adhan for 1 minute
     * @param {Number} currentPrayerIndex
     */
    flashAdhan: function (currentPrayerIndex) {
        if (prayer.confData.azanVoiceEnabled === true) {
            var file = "adhan-maquah.mp3";
            if (currentPrayerIndex === 0) {
                var file = "adhan-maquah-fajr.mp3";
            }
            this.playSound(file);
        } else if (prayer.confData.azanBip === true) {
            this.playSound();
        }

        // iqama countdown
        prayer.iqamaCountdown(currentPrayerIndex);
        // timeout for douaa show
        prayer.douaa.setTimeout(currentPrayerIndex);
        $(".top-content .content").addClass("hidden");

        var adhanFlashInterval = setInterval(function () {
            $(".top-content .adhan-flash").toggleClass("hidden");
        }, prayer.oneSecond);

        // if adhan we increase adhan flash time
        if (prayer.confData.azanVoiceEnabled === true) {
            prayer.adhanFlashingTime = prayer.oneSecond * 200;
        }
        // timeout for stopping time flashing
        setTimeout(function () {
            prayer.stopAdhanFlashing(adhanFlashInterval);
        }, prayer.adhanFlashingTime);
    },
    /**
     * flash iqama for 30 sec
     * @param {Number} currentPrayerIndex 
     */
    flashIqama: function (currentPrayerIndex) {
        if (prayer.confData.iqamaBip === true) {
            this.playSound();
        }

        // init next hilight timeout
        prayer.setNextTimeHilight(currentPrayerIndex);
        // init douaa after prayer timeout
        douaaSlider.show(currentPrayerIndex);

        // if joumuaa time we don't flash iqama
        if (!prayer.isJumua(currentPrayerIndex)) {
            $(".main").fadeOut(1000, function () {
                $(".iqama").removeClass("hidden");
            });
            var iqamaFlashInterval = setInterval(function () {
                $(".iqama .image").toggleClass("hidden");
            }, prayer.oneSecond);
            // stop iqama flashing after 45 sec
            setTimeout(function () {
                prayer.stopIqamaFlashing(iqamaFlashInterval);
            }, prayer.confData.iqamaDisplayTime * prayer.oneSecond);
        }
        // reset flag iqamaIsFlashing after one minute
        setTimeout(function () {
            prayer.iqamaIsFlashing = false;
        }, prayer.oneMinute);
    },
    /**
     * Set iqama countdonwn
     * @param {Number} currentPrayerIndex
     */
    iqamaCountdown: function (currentPrayerIndex) {
        var time = prayer.getTimeByIndex(currentPrayerIndex);
        var waiting = $(".prayer-wait ._" + currentPrayerIndex).text();
        var prayerTimeDate = prayer.getCurrentDateForPrayerTime(time);
        var prayerTimePlusWaiting = prayerTimeDate.setMinutes(prayerTimeDate.getMinutes() + prayer.getWaitingByIndex(currentPrayerIndex));
        var currentElem = $(".prayer-wait ._" + currentPrayerIndex);
        $(currentElem).countdown(prayerTimePlusWaiting, function (event) {
            $(this).text(event.strftime('%M:%S'));
        }).on('finish.countdown', function () {
            $(currentElem).text(waiting);
        });
    },
    stopAdhanFlashing: function (adhanFlashInterval) {
        prayer.adhanIsFlashing = false;
        clearInterval(adhanFlashInterval);
        $(".top-content .content").removeClass("hidden");
        $(".top-content .adhan-flash").addClass("hidden");
    },
    stopIqamaFlashing: function (iqamaFlashInterval) {
        clearInterval(iqamaFlashInterval);
        $(".iqama").addClass("hidden");
        if (prayer.confData.blackScreenWhenPraying === false) {
            $(".main").fadeIn(1000);
        }
    },
    /**
     * serch and set the next prayer time hilight
     */
    initNextTimeHilight: function () {
        var date = new Date();
        // sobh is default
        prayer.hilighByIndex(0);
        var times = this.getTimes();
        $.each(times, function (index, time) {
            prayerDateTime = prayer.getCurrentDateForPrayerTime(time);
            // adding 5 minute
            prayerDateTime.setMinutes(prayerDateTime.getMinutes() + prayer.nextPrayerHilightWait);
            if (date > prayerDateTime) {
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
     * @param {Number} prayerIndex
     */
    hilighByIndex: function (prayerIndex) {
        var time = this.getTimeByIndex(prayerIndex);
        $(".prayer").removeClass("prayer-hilighted");
        $(".prayer-text .text").removeClass("text-hilighted");
        $(".prayer-wait .wait").removeClass("text-hilighted");

        // if joumouaa we hilight joumouaa time
        if (prayer.isJumua(prayerIndex)) {
            $(".joumouaa-id").addClass("prayer-hilighted");
            return;
        }

        $(".prayer-text ._" + prayerIndex).addClass("text-hilighted");
        $(".prayer-wait ._" + prayerIndex).addClass("text-hilighted");
        $(".prayer:contains(" + time + ")").addClass("prayer-hilighted");
    },
    /**
     * 5 minute after current iqama we hilight the next prayer time
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
            // if ichaa we load tomorrow times
            var date = new Date();
            if (nextTimeIndex === 0 && date.getHours() !== 0) {
                prayer.loadTimes(true);
                prayer.setTimes();
            }
        }, prayer.nextPrayerHilightWait * prayer.oneMinute);
    },
    douaa: {
        showAdhanDouaa: function () {
            $(".main").fadeOut(1000, function () {
                $(".adhan").fadeIn(1000);
            });
        },
        hideAdhanDouaa: function () {
            $(".adhan").fadeOut(1000, function () {
                $(".main").fadeIn(1000);
            });
        },
        showHadith: function () {
            $(".main").fadeOut(1000, function () {
                $(".douaa-between-adhan-iqama").fadeIn(1000);
            });
        },
        hideHadith: function () {
            $(".douaa-between-adhan-iqama").fadeOut(1000, function () {
                $(".main").fadeIn(1000);
            });
        },
        /**
         * show douaa 2.5 minutes after adhan flash
         * show douaa for configured time
         * show hadith to remeber importance of douaa between adhan and iqama, 3 minutes after adhan flash
         * @param {Number} currentPrayerIndex
         */
        setTimeout: function (currentPrayerIndex) {
            if (prayer.confData.douaaAfterAdhanEnabled === true) {
                var duaTimeout = 150 * prayer.oneSecond;
                if (prayer.confData.azanVoiceEnabled === true) {
                    duaTimeout = 200 * prayer.oneSecond;
                }
                setTimeout(function () {
                    prayer.douaa.showAdhanDouaa();
                    setTimeout(function () {
                        prayer.douaa.hideAdhanDouaa();

                        // show hadith between adhan and iqama
                        if (prayer.getWaitingTimes()[currentPrayerIndex] !== 0) {
                            setTimeout(function () {
                                prayer.douaa.showHadith();
                                setTimeout(function () {
                                    prayer.douaa.hideHadith();
                                }, 30 * prayer.oneSecond);
                            }, 10 * prayer.oneSecond);
                        }

                    }, 30 * prayer.oneSecond);
                }, duaTimeout);
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
        if (this.confData.joumouaaAsDuhr === true) {
            // return duhr
            return this.getTimeByIndex(1);
        }

        if (this.confData.joumouaaTime !== "") {
            return this.confData.joumouaaTime;
        }
        return dateTime.isDst() ? "13:15" : "12:15";
    },
    /**
     * if current time is joumouaa
     * @param {int} currentPrayerIndex 
     * @returns {boolean}
     */
    isJumua: function (currentPrayerIndex) {
        var date = new Date();
        return date.getDay() === 5 && currentPrayerIndex === 1;
    },
    /**
     * @param {string} time 
     * @returns {Number}
     */
    getPrayerIndexByTime: function (time) {
        var index = null;
        $.each(prayer.getTimes(), function (i, t) {
            if (t === time) {
                index = i;
            }
        });
        return  index;
    },
    /**
     * handle custom time
     * chourouk time
     * aid time if enabled
     * imsak time if enabled
     */
    setCustomTime: function () {
        // hide all custom times
        $(".custom-time").hide();

        // if aid time enabled we set/show it
        if (this.confData.aidTime !== "") {
            $(".aid-id").text(this.confData.aidTime);
            $(".aid").show();
            return;
        }

        // set chourouk time
        $(".chourouk-id").text(this.getChouroukTime());

        // if imsak enabled
        if (parseInt(this.confData.imsakNbMinBeforeSobh) === 0) {
            $(".chourouk").show();
            return;
        }

        // if imsak time enabled we show it between chourouk + 1 hour and sobh
        var imsak = this.getImsak();
        $(".imsak-id").text(imsak);

        if (parseInt(this.confData.imsakNbMinBeforeSobh) !== 0) {
            var date = new Date();
            var midnight = new Date();
            midnight.setHours(0);
            midnight.setMinutes(0);
            midnight.setSeconds(0);
            var sobhDate = prayer.getCurrentDateForPrayerTime(prayer.getTimeByIndex(0));
            // if time betwwen midnight and sobh => show imsak
            if (date.getTime() < sobhDate.getTime() && date.getTime() > midnight.getTime()) {
                $(".imsak").show();
                return;
            }

            var chouroukDate = prayer.getCurrentDateForPrayerTime(prayer.getChouroukTime());
            chouroukDate = chouroukDate.setHours(chouroukDate.getHours() + 1);
            // if time > chourouk + 1 hour => show imsak
            if (date.getTime() > chouroukDate) {
                $(".imsak").show();
                return;
            }

            // default show chourouk
            $(".chourouk").show();
        }
    },
    /**
     * set all prayer times 
     */
    setTimes: function () {
        $(".sobh").text(this.getTimes()[0]);
        $(".dohr").text(this.getTimes()[1]);
        $(".asr").text(this.getTimes()[2]);
        $(".maghrib").text(this.getTimes()[3]);
        $(".ichaa").text(this.getIchaTime());
        $(".joumouaa-id").text(this.getJoumouaaTime());
    },
    /**
     * set wating times
     */
    setWaitings: function () {
        $(".wait").each(function (i, e) {
            $(e).text(prayer.getWaitingTimes()[i % 5] + "'");
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
        $(".supportTel").parent().attr("href", "tel:" + this.confData.supportTel);
        $(".supportEmail").text(this.confData.supportEmail);
        $(".supportEmail").parent().attr("href", "mailto:" + this.confData.supportEmail);
    },
    hideSpinner: function () {
        $(".main").fadeIn(1000, function () {
            $(".spinner").hide();
        });
    },
    /**
     * Arabic handler
     */
    translateToArabic: function () {
        if (prayer.confData.lang === "ar") {
            var texts = $(".prayer-text").find("div");
            var times = $(".prayer-time").find("div");
            var waits = $(".prayer-wait").find("div");
            for (var i = 4; i >= 0; i--) {
                $(".prayer-text").append(texts[i]);
                $(".prayer-time").append(times[i]);
                $(".prayer-wait").append(waits[i]);
            }
            $(".fr").remove();
            $(".ar").css({"font-size": "130%", 'font-family': 'Amiri'});
            $(".adhan .ar, .douaa-between-adhan-iqama .ar, .jumua-dhikr-reminder .ar").css("font-size", "900%");
            $(".adhan .title, .douaa-between-adhan-iqama .title").css("margin-bottom", "80px");
            $(".header").css("font-size", "750%");
        }
    },
    /**
     * Set QR code
     */
    setQRCode: function () {
        if (prayer.confData.qrcodeEnabled === true) {
            new QRCode("qrcode", {
                text: prayer.confData.site,
                width: 100,
                height: 100
            });
        }
    },
    /**
     * Play a sound
     */
    playSound: function (file) {
        if (typeof file === "undefined")
        {
            file = "bip.mp3";
        }

        var audio = new Audio('/static/mp3/' + file);
        audio.play();
    }, /**
     * cron for fajr waking up
     * @returns {undefined}
     */
    fajrWakeAdhanIsPlaying: false,
    initWakupFajr: function () {
        setInterval(function () {
            if (prayer.fajrWakeAdhanIsPlaying === false && parseInt(prayer.confData.wakeForFajrTime) > 0) {
                var date = new Date();
                var fajrTime = prayer.getTimeByIndex(0);
                var diffTimeInMiniute = Math.floor((date - prayer.getCurrentDateForPrayerTime(fajrTime)) / prayer.oneMinute);
                if (diffTimeInMiniute === -parseInt(prayer.confData.wakeForFajrTime)) {
                    var $contentEl = $(".top-content .content");
                    var $alarmFlashEl = $(".top-content .alarm-flash");

                    prayer.fajrWakeAdhanIsPlaying = true;
                    // play adhan sound
                    prayer.playSound("adhan-maquah.mp3");
                    $contentEl.addClass("hidden");

                    // flash every one seconde
                    var interval = setInterval(function () {
                        $alarmFlashEl.toggleClass("hidden");
                    }, prayer.oneSecond);

                    // timeout to stop flashing
                    setTimeout(function () {
                        prayer.fajrWakeAdhanIsPlaying = false;
                        $contentEl.removeClass("hidden");
                        $alarmFlashEl.addClass("hidden");
                        clearInterval(interval);
                    }, 200 * prayer.oneSecond);
                }
            }
        }, prayer.oneMinute);
    },
    jumuaHandler: {
        /**
         * init cron
         */
        init: function () {
            setInterval(function () {
                var date = new Date();
                if (date.getDay() === 5) {
                    var currentTime = dateTime.getCurrentTime(false);
                    // show reminder
                    if (currentTime === prayer.getJoumouaaTime()) {
                        // hilight asr
                        prayer.setNextTimeHilight(1);

                        if (prayer.confData.jumuaDhikrReminderEnabled === true) {
                            prayer.jumuaHandler.showReminder();
                            setTimeout(function () {
                                prayer.jumuaHandler.hideReminder();
                            }, prayer.confData.jumuaTimeout * prayer.oneMinute);
                        } else if (prayer.confData.jumuaBlackScreenEnabled === true) {
                            prayer.jumuaHandler.showBlackScreen();
                            setTimeout(function () {
                                prayer.jumuaHandler.hideBlackScreen();
                            }, prayer.confData.jumuaTimeout * prayer.oneMinute);
                        }
                    }
                }
            }, prayer.oneMinute);
        },
        showReminder: function () {
            $(".main").fadeOut(1000, function () {
                $(".jumua-dhikr-reminder").fadeIn(1000);
            });
        },
        hideReminder: function () {
            $(".jumua-dhikr-reminder").fadeOut(1000, function () {
                $(".main").fadeIn(1000);
            });
        },
        showBlackScreen: function () {
            $(".main").fadeOut(1000);
        },
        hideBlackScreen: function () {
            $(".main").fadeIn(1000);
        }
    },
    /**
     * Init events
     */
    initEvents: function () {
        $(".version").click(function () {
            prayer.test();
        });
    },
    /**
     * Test main app features 
     */
    test: function () {
        // show douaa after prayer
        douaaSlider.oneDouaaShowingTime = 1000;
        douaaSlider.show();
        setTimeout(function () {
            // show douaa after adhan
            prayer.douaa.showAdhanDouaa();
            setTimeout(function () {
                prayer.douaa.hideAdhanDouaa();
            }, 3000);
            setTimeout(function () {
                //show hadith between adhan and iqama
                prayer.douaa.showHadith();
                setTimeout(function () {
                    prayer.douaa.hideHadith();
                    setTimeout(function () {
                        prayer.jumuaHandler.showReminder();
                        setTimeout(function () {
                            prayer.jumuaHandler.hideReminder();
                            // flash adhan
                            prayer.flashAdhan(2);
                            setTimeout(function () {
                                prayer.stopAdhanFlashing();
                                // flash iqama
                                prayer.confData.iqamaDisplayTime = 5;
                                prayer.flashIqama(4);
                                setTimeout(function () {
                                    location.reload();
                                }, 5000);
                            }, 5000);
                        }, 5000);
                    }, 3000);
                }, 5000);
            }, 5000);
        }, douaaSlider.getTimeForShow() + 3000);
    }
};

/**
 * Douaa slider class
 * @type {Object}
 */
var douaaSlider = {
    oneDouaaShowingTime: 20000,
    /**
     * it saves html (ul,li)
     * @type String
     */
    sliderHtmlContent: '',
    /**
     *  init douaa after prayer slider
     */
    init: function () {
        setTimeout(function () {
            $('.douaa-after-prayer').load('douaa-slider-one-screen.html', function () {
                var screenWidth = $(window).width();
                $('#slider ul li').width(screenWidth);
                var slideCount = $('#slider ul li').length;
                var sliderUlWidth = slideCount * screenWidth;
                $('#slider').css({width: screenWidth});
                $('#slider ul').css({width: sliderUlWidth, marginLeft: -screenWidth});
                $('#slider ul li:last-child').prependTo('#slider ul');
                $("#slider .ar").css({'font-family': 'Amiri'});
                if (prayer.confData.lang === "ar") {
                    $("#slider .fr").remove();
                    $("#slider .title").css({'margin-bottom': '50px'});
                    $("#slider").css({'font-size': '100%'});
                    $("#slider .elkoursi").attr("style", "font-size : 750%");
                }
                //save html slider
                douaaSlider.sliderHtmlContent = $('#slider').html();
            });
        }, 5 * prayer.oneSecond);
    },
    /**
     * If enabled show douaa after prayer
     * @param {Number} currentTimeIndex
     */
    show: function (currentTimeIndex) {
        setTimeout(function () {
            if (prayer.confData.douaaAfterPrayerEnabled === true && !prayer.isJumua(currentTimeIndex)) {
                $(".main").fadeOut(2000, function () {
                    $(".douaa-after-prayer").fadeIn(1000);
                });
                var douaaInterval = setInterval(function () {
                    douaaSlider.moveRight();
                }, douaaSlider.oneDouaaShowingTime);

                setTimeout(function () {
                    clearInterval(douaaInterval);
                    $(".douaa-after-prayer").fadeOut(2000, function () {
                        $(".main").fadeIn(1000);
                        $('#slider').html(douaaSlider.sliderHtmlContent);
                    });

                }, douaaSlider.getTimeForShow());
            } else {
                $(".main").fadeIn(1000);
            }
        }, prayer.confData.douaaAfterPrayerWait[currentTimeIndex] * prayer.oneMinute);
    },
    /**
     * Number of seconds to show all douaa
     * @returns {Number}
     */
    getTimeForShow: function () {
        return ($('#slider ul li').length * this.oneDouaaShowingTime) - 1000;
    },
    moveRight: function () {
        var screenWidth = $(window).width();
        $('#slider ul').animate({
            left: -screenWidth
        }, 1000, function () {
            $('#slider ul li:first-child').appendTo('#slider ul');
            $('#slider ul').css('left', '');
        });
    }
};

prayer.init();
