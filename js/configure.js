/**
 * Configure app
 * @author ibrahim.zehhaf@gmail.com
 * @type {object}
 */

prayer.loadVersion();
prayer.loadConfData();


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

if (prayer.confData.lang === "ar") {
    $("body").css("font-family", "Amiri");
    $("body").css("font-size", "16px");
}

/**
 * Handling submit configure form
 */

function submitConfForm() {
    var inputs = $('#configure :input');
    var data = JSON.parse(localStorage.getItem("config"));
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

    localStorage.setItem("config", JSON.stringify(data));
}

$("#configure").submit(function (event) {
    submitConfForm();
    window.location.href = "index.html";
    event.preventDefault();
});
