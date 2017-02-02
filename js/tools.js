String.prototype.firstCapitalize= function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

function getConfFromLocalStorage(){
    return JSON.parse(localStorage.getItem("config"));
}
