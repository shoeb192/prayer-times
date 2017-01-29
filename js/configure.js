/**
 * Configure app
 * @author ibrahim.zehhaf@gmail.com
 * @type {object}
 */

$(document).ready(function () {
    var data = JSON.parse(localStorage.getItem("config"));
    var input;
    $.each(data, function (key, value) {
        input = $("#" + key);

        if (input.attr("type") === "checkbox") {
            input.prop('checked', value);
        } else {
            input.val(value);
        }
    });
});

/**
 * Handling submit configure form
 */

$("#configure").submit(function (event) {
    var inputs = $('#configure :input');
    var data = JSON.parse(localStorage.getItem("config"));
    inputs.each(function () {
        data[this.id] = $(this).attr("type") === "checkbox" ? $(this).is(":checked") : $(this).val();
    });
    localStorage.setItem("config", JSON.stringify(data));
    window.location.href = "index.html";
    event.preventDefault();
});