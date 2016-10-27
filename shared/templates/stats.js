"use strict";
(function () {
    // weapon data
    var c = $("#gf-container");
    var s = c.find(".stats");
    gf.frontend.request("Progression.getWeaponsByPersonaId", {
        "game": "tunguska",
        "personaId": gf.frontend.getCurrentPersona().personaId
    }, function (data) {
        var entry = $("tr.stats-entry.template");
        var containerCat = c.find(".stats .weapon-categories table");
        var containerAll = c.find(".stats .weapon-all table");
        for(var i in data){
            var o = data[i];
            var eCat = entry.clone();
            eCat.find(".name").html(o.name);
            containerCat.append(eCat);
            for(var w in o.weapons){
                var weapon = o.weapons[w];
                var eWeapon = entry.clone();
                eWeapon.find(".name").html(weapon.name);
                containerAll.append(eWeapon);
            }
        }
    });
})();