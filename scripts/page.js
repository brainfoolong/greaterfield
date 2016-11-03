"use strict";
$(function () {
    var parallax = $(".parallax");
    $(window).on("scroll", function () {
        var st = $(document).scrollTop() + $(window).height() / 2;
        parallax.each(function () {
            var center = $(this).offset().top + 150;
            var off = st - center;
            off = 1 / 300 * off;
            if (off > 1) off = 1;
            if (off < -0.5) off = -0.5;
            $(this).find("img").css("top", off * 100 + "px").css("transform", "scale("+(1.5 + (off))+")");

        });
    }).triggerHandler("scroll");

    // get latest release version
    $.getJSON("https://api.github.com/repos/brainfoolong/greaterfield/releases" , function (data) {
        if(data[0] && data[0].tag_name){
            $(".version").html(data[0].tag_name);
        }
    });
});