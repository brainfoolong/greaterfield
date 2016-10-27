"use strict";
(function () {
    var c = $("#gf-container");
    if (!gf.frontend.getCurrentPersona()) {
        c.find(".not-logged-in").removeClass("hidden");
    } else {
        c.find(".logged-in").removeClass("hidden");
        c.on("click", ".index-menu .btn", function () {
            gf.template.load($(this).closest(".index-menu").find(".container"), $(this).closest(".index-menu").attr("data-id"));
            $(this).closest(".index-menu").find(".container").removeClass("hidden");
        });
    }
})();