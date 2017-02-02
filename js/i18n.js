/**
 * @author ibrahim.zehhaf.pro@gmail.com
 * Handel internationalisation
 */

var i18n = {
    json: {},
    /**
     * Load translation file
     */
    loadJson: function () {
        $.ajax({
            url: "i18n/i18n.json?" + (new Date()).getTime(),
            async: false,
            success: function (data) {
                i18n.json = data;
            }
        });
    },
    /**
     * parse som and translate texts
     */
    parseAndTrans: function () {
        $("[data-trans]").each(function (i, elem) {
            $(elem).text($(elem).data("trans").trans(getConfFromLocalStorage().lang));
        });
    }
};

i18n.loadJson();

/**
 * translate a string
 * @param {string} key
 * @param {string} lang
 * @returns {string} the translated string
 */
String.prototype.trans = function (lang) {
    try {
        return i18n.json[this][lang].firstCapitalize();
    } catch (err) {
        return this.firstCapitalize();
    }
};

$(document).ready(function () {
    i18n.parseAndTrans();
});
