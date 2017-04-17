/* ##### string ##### */
String.prototype.firstCapitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


/* ##### time ##### */
Date.prototype.stdTimezoneOffset = function () {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.dst = function () {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}


/* ##### conf ##### */
function getConfFromLocalStorage() {
    return JSON.parse(localStorage.getItem("config"));
}

function removeConfFromLocalStorage() {
    return localStorage.removeItem("config");
}

/**
 * Load config data from the right json file
 * json file is determined from url for ex if url = houilles.horaires-de-priere.fr
 * the json file is houilles.json (the first part of url before dot)
 * if no file found we load from default.json file
 * The data loaded is saved in localStorage
 */
function loadConfData() {
    if (localStorage.getItem("config") === null) {
        var data;
        var url = window.location.href;
        url = url.split(".");
        var confFile = url[0].replace(/https?:\/\//, "") + ".json";
        $.ajax({
            url: "json/conf/" + confFile + "?" + (new Date()).getTime(),
            async: false,
            success: function (resp) {
                data = resp;
            },
            error: function () {
                $.ajax({
                    url: "json/conf/default.json?" + (new Date()).getTime(),
                    async: false,
                    success: function (resp) {
                        data = resp;
                    },
                    error: function (data) {
                        alert("No conf file found");
                    }
                });
            }
        });

        localStorage.setItem("config", JSON.stringify(data));
    }
}

/* ##### version ##### */
function getVersion() {
    return localStorage.getItem("version");
}

function setVersion(version) {
    return localStorage.setItem("version", version);
}

/* ##### others ##### */
/**
 * add zero to number if < to 10, ex : 1 becomes 01
 * @param {integer} value
 * @returns {String}
 */
function addZero(value) {
    if (value < 10) {
        value = '0' + value;
    }
    return value;
}

loadConfData();