var prayer = {
    customData: null,
    months: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"],
    prayerTimes: [],
    hijriDateApiUrl: "http://api.aladhan.com/gToH?date=",
    init: function () {
        this.loadData();
        this.setCustomContent();
        this.setTime();
        this.setDate();
        this.setPrayerTimes();
        this.setPrayerWaitings();
        this.initAdhanFlash();
        this.initIqamaFlash();
        this.initCronMidNight();
        this.setAidPrayerTime();
    },
    loadData: function () {
        this.loadCustomData();
        this.loadPrayerTimes();
        this.loadVersion();
    },
    loadVersion: function () {
        $.ajax({
            url: "version",
            async: false,
            data: "text",
            success: function (data) {
                $("#version").text("v" + data);
            }
        });
    },
    loadCustomData: function () {
        $.ajax({
            url: "data/custom-data.json",
            async: false,
            success: function (data) {
                prayer.customData = data;
            }
        });
    },
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
    getPrayersWaitingTimes: function () {
        var waitings = this.customData.prayersWaitingTimes;
        if (this.getIchaTime() > this.customData.maximumIchaTimeForNoWaiting) {
            waitings[4] = 0;
        }
        return waitings;
    },
    getTodayPrayerLine: function () {
        var prayerTimes = this.prayerTimes;
        return prayerTimes[dateTime.getCurrentMonth()][dateTime.getCurrentDay()].split(",");
    },
    getTodayFivePrayerTimes: function () {
        var prayerTimes = this.getTodayPrayerLine();
        return [prayerTimes[1], prayerTimes[3], prayerTimes[4], prayerTimes[5], this.getIchaTime()];
    },
    getTodayPrayerTimeByIndex: function (index) {
        return this.getTodayFivePrayerTimes()[index];
    },
    getCurrentDateForPrayerTime: function (prayerTime) {
        var date = new Date();
        prayerTime = prayerTime.split(':');
        date.setHours(prayerTime[0]);
        date.setMinutes(prayerTime[1]);
        date.setSeconds(0);
        return date;
    },
    getIchaTime: function () {
        var ichaTime = this.getTodayPrayerLine()[6];
        if (ichaTime <= this.customData.minimumIchaTime)
        {
            ichaTime = this.customData.minimumIchaTime;
        }
        return ichaTime;
    },
    getChouroukTime: function () {
        return this.getTodayPrayerLine()[2];
    },
    initCronMidNight: function () {
        // toutes les minutes
        setInterval(function () {
            // à minuit on met à jour les prayerTimess
            if (dateTime.getCurrentHour() === "00" && dateTime.getCurrentMinute() === "00") {
                prayer.setDate();
                prayer.setPrayerTimes();
                prayer.setPrayerWaitings();
            }
        }, 1000);
    },
    /**
     * on vérifie toutes les min si l'heure du adhan est arrivée, si oui on fait clignoter l'heure
     */
    adhanIsFlashing: false,
    initAdhanFlash: function () {
        setInterval(function () {
            if (!prayer.adhanIsFlashing) {
                var currentTime = dateTime.getCurrentTime(false);
                var prayerElm = $(".prayer:contains(" + currentTime + ")");
                if (prayerElm.length) {
                    prayer.adhanIsFlashing = true;
                    var adhanFlashInterval = setInterval(function () {
                        prayerElm.toggleClass("flash");
                    }, 1000);

                    setTimeout(function () {
                        clearInterval(adhanFlashInterval);
                        prayer.adhanIsFlashing = false;
                        prayerElm.removeClass("flash");
                    }, 60000);
                }
            }
        }, 1000);
    },
    /**
     * on vérifie toutes les min si l'heure de iqama est arrivée, si oui on fait clignoter les min de la iqama
     */
    iqamaIsFlashing: false,
    initIqamaFlash: function () {
        setInterval(function () {
            if (!prayer.iqamaIsFlashing) {
                $.each(prayer.getTodayFivePrayerTimes(), function (currentPrayerIndex, prayerTime) {
                    //si date ou chourouk on continue
                    var diffTimeInMiniute = Math.floor((new Date() - prayer.getCurrentDateForPrayerTime(prayerTime)) / 60000);
                    if (diffTimeInMiniute === prayer.getPrayersWaitingTimes()[currentPrayerIndex]) {
                        prayer.iqamaIsFlashing = true;
                        var iqamaFlashInterval = setInterval(function () {
                            prayer.showIqama();
                        }, 1000);

                        setTimeout(function () {
                            clearInterval(iqamaFlashInterval);
                            $(".main").removeClass("hidden");
                            $(".iqama").addClass("hidden");
                            prayer.setNextPrayerTimeHilight(currentPrayerIndex);
                        }, 60000);

                        /**
                         * temp pendant lequel on vérifie pas el iqama (en général le temps entre 2 prière)
                         * minimum 1h entre maghrib et icha
                         */
                        setTimeout(function () {
                            prayer.iqamaIsFlashing = false;
                        }, 60 * 60000);
                    }
                });
            }
        }, 1000);
    },
    /**
     * 5 min après el iqama on met en surbrillance la prochaine heure de prière
     * @param {int} currentPrayerTimeIndex 
     */
    setNextPrayerTimeHilight: function (currentPrayerTimeIndex) {
        nextPrayerTimeIndex = currentPrayerTimeIndex + 1;
        // si prière en cours est ichaa
        if (nextPrayerTimeIndex === 5) {
            nextPrayerTimeIndex = 0;
        }
        setTimeout(function () {
            $(".prayer").removeClass("prayer-hilighted");
            $(".prayer:contains(" + prayer.getTodayPrayerTimeByIndex(nextPrayerTimeIndex) + ")").addClass("prayer-hilighted");
        }, 5 * 60000);
    },
    showIqama: function () {
        $(".main").toggleClass("hidden");
        $(".iqama").toggleClass("hidden");
    },
    setTime: function () {
        $("#time").text(dateTime.getCurrentTime(true));
        setInterval(function () {
            $("#time").text(dateTime.getCurrentTime(true));
        }, 1000);
    },
    setDate: function () {
        $("#date").text(dateTime.getCurrentDate());
        this.setCurrentHijriDate();
    },
    setCurrentHijriDate: function () {
        var hijriDate = "";
        var day = dateTime.addZero(dateTime.getCurrentDay() + this.customData.adjustment);
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

                    $("#hijriDate").text(hijriDate);
                }
            }
        });
    },
    setAidPrayerTime: function () {
        $(".chourouk").show();
        $(".aid").hide();
        $("#aid").text(this.customData.aidTime);
        if (this.customData.aidIsEnabled) {
            $(".chourouk").hide();
            $(".aid").show();
        }
    },
    setPrayerTimes: function () {
        $("#joumouaa").text(this.customData.joumouaaTime);
        $("#sobh").text(this.getTodayFivePrayerTimes()[0]);
        $("#chourouk").text(this.getChouroukTime());
        $("#dohr").text(this.getTodayFivePrayerTimes()[1]);
        $("#asr").text(this.getTodayFivePrayerTimes()[2]);
        $("#maghrib").text(this.getTodayFivePrayerTimes()[3]);
        $("#ichaa").text(this.getIchaTime());
    },
    setPrayerWaitings: function () {
        $("#sobh-waiting").text(this.getPrayersWaitingTimes()[0] + " min");
        $("#dohr-waiting").text(this.getPrayersWaitingTimes()[1] + " min");
        $("#asr-waiting").text(this.getPrayersWaitingTimes()[2] + " min");
        $("#maghrib-waiting").text(this.getPrayersWaitingTimes()[3] + " min");
        $("#icha-waiting").text(this.getPrayersWaitingTimes()[4] + " min");
    },
    setCustomContent: function () {
        $(".header").text(this.customData.headerText);
        $(".footer").text(this.customData.footerText);
    }
};

/**
 * dateTime functions
 */
var dateTime = {
    addZero: function (value) {
        if (value < 10) {
            value = '0' + value;
        }
        return value;
    },
    getCurrentMinute: function () {
        var date = new Date();
        return this.addZero(date.getMinutes());
    },
    getCurrentHour: function () {
        var date = new Date();
        return this.addZero(date.getHours());
    },
    getCurrentDay: function () {
        var date = new Date();
        return date.getDate();
    },
    getCurrentMonth: function () {
        var date = new Date();
        var month = date.getMonth() + 1;
        return this.addZero(month);
    },
    getCurrentYear: function () {
        var date = new Date();
        return date.getFullYear();
    },
    getCurrentTime: function (withSeconds) {
        var date = new Date();
        var second = this.addZero(date.getSeconds());
        var time = this.getCurrentHour() + ':' + this.getCurrentMinute();
        if (withSeconds === true) {
            time += ':' + second;
        }
        return  time;
    },
    getCurrentDate: function () {
        var day = this.addZero(this.getCurrentDay());
        var year = this.getCurrentYear();
        var dateText = this.getCurrentDayFrenchText()
                + ' ' + day
                + '/' + this.getCurrentMonth()
                + '/' + year;
        return dateText;
    },
    getCurrentDayText: function () {
        var date = new Date();
        var day = new Array();
        var dayIndex = date.getDay();
        day[0] = ["Dimanche", "الأحد"];
        day[1] = ["Lundi", "الإثنين"];
        day[2] = ["Mardi", "الثلاثاء"];
        day[3] = ["Mercredi", "الأربعاء"];
        day[4] = ["Jeudi", "الخميس"];
        day[5] = ["Vendredi", "الجمعة"];
        day[6] = ["Samedi", "السبت"];

        return day[dayIndex];
    },
    getCurrentDayArabicText: function () {
        return this.getCurrentDayText()[1];
    },
    getCurrentDayFrenchText: function () {
        return this.getCurrentDayText()[0];
    }
};

$(document).ready(function () {
    prayer.init();
});