/**
 * Configure app
 * @author ibrahim.zehhaf@gmail.com
 * @type {object}
 */

$(document).ready(function () {
    var confDataFromLocalStorage = JSON.parse(localStorage.getItem("config"));
    console.dir(confDataFromLocalStorage);
    var input;
    $.each(confDataFromLocalStorage, function (key, value) {
        if (key === "prayersWaitingTimes") {
            $(value).each(function (i, val) {
                $("#wait" + i).val(val);
            });
            return;
        }

        input = $("#" + key);
        if (input.attr("type") === "checkbox") {
            input.prop('checked', value);
        } else {
            input.val(value);
        }
    });
    
    $("." + confDataFromLocalStorage.calculChoice).show();
    $("#calculChoice").change(function (event) {
        $(".choice-calcul").hide();
        $("." + $(this).val()).show();
    });
    
});

/**
 * Handling submit configure form
 */

$("#configure").submit(function (event) {
    var inputs = $('#configure :input');
    var data = JSON.parse(localStorage.getItem("config"));
    inputs.each(function () {
        if (data.hasOwnProperty(this.id)) {
            data[this.id] = $(this).attr("type") === "checkbox" ? $(this).is(":checked") : $(this).val();
        }
    });

    $(".prayer-wait").each(function (i, elem) {
        data["prayersWaitingTimes"][i] = parseInt($(elem).val());
    });

    localStorage.setItem("config", JSON.stringify(data));
    window.location.href = "index.html";
    event.preventDefault();
});
