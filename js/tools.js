String.prototype.firstCapitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

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