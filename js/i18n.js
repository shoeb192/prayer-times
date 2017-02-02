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
     * translate a string
     * @param {string} key
     * @param {string} lang
     * @returns {string} the translated string
     */
    trans: function (key, lang) {
        if (typeof (i18n.json[key][lang] !== 'undefined')) {
            return i18n.json[key][lang].firstCapitalize();
        }
        return key.firstCapitalize();
    },
    /**
     * parse som and translate texts
     */
    parseAndTrans: function () {
        $("[data-trans]").each(function (i, elem) {
            $(elem).text(i18n.trans($(elem).data("trans"), $("#lang").val()));
        });
    }
}

i18n.loadJson();

$(document).ready(function () {
    i18n.parseAndTrans();
});
