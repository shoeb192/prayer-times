/**
 * Configure app
 * @author ibrahim.zehhaf@gmail.com
 * @type {object}
 */

prayer.loadConfData();

$(document).ready(function () {
    
    /**
     * Init form from localStorage
     */
    var confDataFromLocalStorage = getConfFromLocalStorage();
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
    
    /**
     * init calcul choice input
     */
    $("." + confDataFromLocalStorage.calculChoice).show();
    $("#calculChoice").change(function (event) {
        $(".choice-calcul").hide();
        $("." + $(this).val()).show();
    });
    
    $("#reset-conf").click(function (event) {
         localStorage.removeItem("config");
         window.location.reload();
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
