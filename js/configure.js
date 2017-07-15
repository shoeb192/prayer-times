/**
 * Configure app
 * @author ibrahim.zehhaf@gmail.com
 * @type {object}
 */

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
    if (key === "prayerTimesFixing") {
        $(value).each(function (i, val) {
            $("#fixing" + i).val(val);
        });
        return;
    }
    
    if (key === "douaaAfterPrayerWait") {
        $(value).each(function (i, val) {
            $("#douaaWait" + i).val(val);
        });
        return;
    }
    
    if (key === "prayerTimesAdjustment") {
        $(value).each(function (i, val) {
            $("#adjust" + i).val(val);
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
$("#calculChoice").bind("change keyup", function (event) {
    $(".choice-calcul").hide();
    $("." + $(this).val()).show();
});

$("#reset-conf").click(function (event) {
    removeConfFromLocalStorage();
    window.location.reload();
});

$("#lang").bind("change", function (event) {
    submitConfForm();
    window.location.reload();
});

if (getConfFromLocalStorage().lang === "ar") {
    $("body").css("font-family", "Amiri");
    $("body").css("font-size", "18px");
}

/**
 * Handling submit configure form
 */

function submitConfForm() {
    var inputs = $('#configure :input');
    var data = getConfFromLocalStorage();
    inputs.each(function () {
        if (data.hasOwnProperty(this.id)) {
            data[this.id] = $(this).attr("type") === "checkbox" ? $(this).is(":checked") : $(this).val();
        }
    });

    $(".wait").each(function (i, elem) {
        data["prayersWaitingTimes"][i] = parseInt($(elem).val());
    });
    
    $(".fixing").each(function (i, elem) {
        data["prayerTimesFixing"][i] = $(elem).val();
    });
    
    $(".adjust").each(function (i, elem) {
        data["prayerTimesAdjustment"][i] = $(elem).val();
    });
    
    $(".douaaWait").each(function (i, elem) {
        data["douaaAfterPrayerWait"][i] = $(elem).val();
    });

    localStorage.setItem("config", JSON.stringify(data));
}

$("#configure").submit(function (event) {
    submitConfForm();
    window.location.href = "index.html";
    event.preventDefault();
});
