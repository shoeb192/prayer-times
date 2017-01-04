var prayer = {
    prayersWaitingTimesInMinute: [20, 10, 10, 5, 10],
    minIchaTime: "19:50",
    joumouaa: "12:00",
    init: function () {
        this.setTime();
        this.setDate();
        this.setPrayerTimes();
        this.setPrayerWaiting();
        this.initCronMidNight();
        this.initAdhanFlash();
        this.initIqamaFlash();
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
    getCurrentDay: function () {
        var date = new Date();
        return date.getDay();
    },
    getCurrentMonth: function () {
        var date = new Date();
        var month = new Array();
        month[0] = ["01", "Janvier"];
        month[1] = ["02", "Février"];
        month[2] = ["03", "Mars"];
        month[3] = ["04", "Avril"];
        month[4] = ["05", "Mai"];
        month[5] = ["06", "Juin"];
        month[6] = ["07", "Juillet"];
        month[7] = ["08", "Aout"];
        month[8] = ["09", "Septembre"];
        month[9] = ["10", "Octobre"];
        month[10] = ["11", "Novembre"];
        month[11] = ["12", "Décembre"];
        return month[date.getMonth()];
    },
    getCsvFile: function () {
        return this.getCurrentMonth()[0] + ".csv";
    },
    loadPrayerTimes: function () {
        var csvFile = this.getCsvFile();
        var prayerTimes;
        $.ajax({
            url: "data/" + csvFile,
            async: false,
            dataType: "text",
            success: function (data) {
                prayerTimes = data.split("\n");
            }
        });

        return prayerTimes;
    },
    getCurentPrayerTimes: function () {
        var prayerTimes = this.loadPrayerTimes();
        prayerTimes = prayerTimes[this.getCurrentDay()].split(",");
        return [prayerTimes[1], prayerTimes[3], prayerTimes[4], prayerTimes[5], this.getIchaTime()];
    },
    getCurrentDateForPrayerTime: function (prayerTime) {
        var d = new Date();
        prayerTime = prayerTime.split(':');
        d.setHours(prayerTime[0]);
        d.setMinutes(prayerTime[1]);
        d.setSeconds(0);
        return d;
    },
    getIchaTime: function () {
        var prayerTimes = this.loadPrayerTimes();
        prayerTimes = prayerTimes[this.getCurrentDay()].split(",");
        var ichaTime = prayerTimes[6];
        if (ichaTime <= this.minIchaTime)
        {
            ichaTime = this.minIchaTime;
        }
        return ichaTime;
    },
    getChourouKTime: function () {
        var prayerTimes = this.loadPrayerTimes();
        prayerTimes = prayerTimes[this.getCurrentDay()].split(",");
        return prayerTimes[2];
    },
    initCronMidNight: function () {
        // toutes les minutes
        setInterval(function () {
            // à minuit on met à jour les prayerTimess
            if (prayer.dateTime.getCurrentHour() === "00" && prayer.dateTime.getCurrentMinute() === "00") {
                prayer.setDate();
                prayer.setPrayerTimes();
            }
        }, 1000);
    },
    /**
     * on vérifie toutes les min si l'heure du adhan est arrivée, si oui on fait clignoter l'heure
     */
    adhanIsFlashing: false,
    initAdhanFlash: function () {
        var currentTime = prayer.dateTime.getCurrentTime(false);
        $(".prayer").each(function (i, e) {
            if ($(e).text() === currentTime && !prayer.adhanIsFlashing) {
                prayer.adhanIsFlashing = true;
                var adhan = setInterval(function () {
                    $(e).toggleClass("flash");
                }, 1000);

                setTimeout(function () {
                    clearInterval(adhan);
                    prayer.adhanIsFlashing = false;
                    $(e).removeClass("flash");
                }, 60000);
            }
        });

        setInterval(this.initAdhanFlash, 1000);
    },
    /**
     * on vérifie toutes les min si l'heure de iqama est arrivée, si oui on fait clignoter les min de la iqama
     */
    iqamaIsFlashing: false,
    initIqamaFlash: function () {
        $.each(prayer.getCurentPrayerTimes(), function (i, prayerTime) {
            //si date ou chourouk on continue
            var diffTimeInMiniute = Math.floor((new Date() - prayer.getCurrentDateForPrayerTime(prayerTime)) / 60000);
            if (diffTimeInMiniute === prayer.prayersWaitingTimesInMinute[i] && !prayer.iqamaIsFlashing) {
                prayer.iqamaIsFlashing = true;
                var e = $(".wait").eq(i);
                var iqama = setInterval(function () {
                    e.toggleClass("flash");
                }, 1000);

                setTimeout(function () {
                    clearInterval(iqama);
                    prayer.iqamaIsFlashing = false;
                    e.removeClass("flash");
                }, 60000);
            }
        });
        setInterval(this.initIqamaFlash, 1000);
    },
    setTime: function () {
        $("#time").text(prayer.dateTime.getCurrentTime(true));
        setInterval(this.setTime, 1000);
    },
    setDate: function () {
        $("#date").text(this.dateTime.getCurrentDate());
    },
    dateTime: {
        getCurrentHour: function () {
            var date = new Date();
            var h = date.getHours();
            if (h < 10) {
                h = '0' + h;
            }
            return h;
        },
        getCurrentMinute: function () {
            var date = new Date();
            var m = date.getMinutes();
            if (m < 10) {
                m = '0' + m;
            }
            return m;
        },
        getCurrentTime: function (withSeconds) {
            var date = new Date();
            var ss = date.getSeconds();
            if (ss < 10) {
                ss = '0' + ss;
            }

            var time = prayer.dateTime.getCurrentHour() + ":" + prayer.dateTime.getCurrentMinute();
            if (withSeconds === true) {
                time += ":" + ss;
            }
            return  time;
        },
        getCurrentDate: function () {
            var date = new Date();
            var dd = date.getDate();
            var mm = date.getMonth() + 1; //January is 0!
            var yyyy = date.getFullYear();
            if (dd < 10) {
                dd = '0' + dd;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            return  prayer.getCurrentDayText()[0] + ' - ' + dd + '/' + mm + '/' + yyyy + ' - ' + prayer.getCurrentDayText()[1];
        }
    },
    setPrayerTimes: function () {
        $("#joumouaa").text(this.joumouaa);
        $("#sobh").text(this.getCurentPrayerTimes()[0]);
        $("#chourouk").text(this.getChourouKTime());
        $("#dohr").text(this.getCurentPrayerTimes()[1]);
        $("#asr").text(this.getCurentPrayerTimes()[2]);
        $("#maghrib").text(this.getCurentPrayerTimes()[3]);
        $("#ichaa").text(this.getIchaTime());
    },
    setPrayerWaiting: function () {
        $("#sobh-waiting").text(this.prayersWaitingTimesInMinute[0] + " min");
        $("#dohr-waiting").text(this.prayersWaitingTimesInMinute[1] + " min");
        $("#asr-waiting").text(this.prayersWaitingTimesInMinute[2] + " min");
        $("#maghrib-waiting").text(this.prayersWaitingTimesInMinute[3] + " min");
        $("#icha-waiting").text(this.prayersWaitingTimesInMinute[4] + " min");
    }
};

$(document).ready(function () {
    prayer.init();
});