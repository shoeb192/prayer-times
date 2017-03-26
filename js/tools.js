String.prototype.firstCapitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.dst = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

function getConfFromLocalStorage() {
    return JSON.parse(localStorage.getItem("config"));
}

function removeConfFromLocalStorage() {
    return localStorage.removeItem("config");
}

function getVersion() {
   return localStorage.getItem("version");
}

function setVersion(version) {
   return localStorage.setItem("version", version);
}