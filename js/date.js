/**
 * class handling date and time
 * @type object
 */
var dateTime = {
    /**
     * add zero to number if < to 10, ex : 1 becomes 01
     * @param {integer} value
     * @returns {String}
     */
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
    /**
     * get day of month ex: 0, 1 ... 30
     * 0 is the first day
     */
    getCurrentDay: function () {
        var date = new Date();
        return date.getDate();
    },
    /**
     * get current month numbre 01, 02 ... 12
     */
    getCurrentMonth: function () {
        var date = new Date();
        var month = date.getMonth() + 1;
        return this.addZero(month);
    },
    /**
     * get full current year ex: 2017
     */
    getCurrentYear: function () {
        var date = new Date();
        return date.getFullYear();
    },
    /**
     * get current time in hh:ii format or hh:ii:ss format depends on withSeconds arg
     * @param {bool} withSeconds
     * @returns {String}
     */
    getCurrentTime: function (withSeconds) {
        var date = new Date();
        var second = this.addZero(date.getSeconds());
        var time = this.getCurrentHour() + ':' + this.getCurrentMinute();
        if (withSeconds === true) {
            time += ':' + second;
        }
        return  time;
    },
    /**
     * get current gregorian date ex: Vendredi 26/05/2017
     * @returns {String}
     */
    getCurrentDate: function () {
        var day = this.addZero(this.getCurrentDay());
        var year = this.getCurrentYear();
        var dateText = this.getCurrentDayFrenchText()
                + ' ' + day
                + '/' + this.getCurrentMonth()
                + '/' + year;
        return dateText;
    },
    /**
     * get current day name ex: Vendredi
     * @returns {Array}
     */
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
    getLastSundayOfMonth: function (month) {
        var date = new Date();
        date.setMonth(month);
        date.setDate(30);
        date.setDate(date.getDate() - date.getDay());
        return date.getDate();
    },
    /**
     * true if date between last sunday of march and last sunday of october
     * @returns {Boolean}
     */
    isDst: function () {
        var date = new Date();
        var currentMonth = date.getMonth();
        var currentDay = date.getDate();

        // si mars et jour superieur au dernier dimanche
        if (currentMonth === 2 && currentDay >= this.getLastSundayOfMonth(2)) {
            return true;
        }
        // entre avril et septembre 
        if ($.inArray(currentMonth, [3, 4, 5, 6, 7, 8]) !== -1) {
            return true;
        }
        // du premier octobre au dernier dimanche d'octobre
        if (currentMonth === 9 && currentDay < this.getLastSundayOfMonth(9)) {
            return true;
        }
        return false;
    },
    /**
     * true if date is last sunday of march or october
     * @returns {Boolean}
     */
    isLastSundayDst: function () {
        var date = new Date();
        var currentMonth = date.getMonth();
        var currentDay = date.getDate();
        if ($.inArray(currentMonth, [2, 9]) !== -1) {
            if (currentDay >= this.getLastSundayOfMonth(currentMonth)) {
                return true;
            }
        }
        return false;
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