"use strict";

function inject(document, version, folder) {

    var el;

    var importGf = false;
    var importJquery = false;
    var importCss = false;
    if(window.location.href.match(/forums\.battlefield\.com/)){
        importGf = true;
        importCss = true;
    }
    if(window.location.href.match(/www\.battlefield\.com\/.*?companion/)){
        importGf = true;
        importCss = true;
        importJquery = true;
    }
    if(window.location.href.match(/battlelog\.battlefield\.com\/.*?emblem\/edit/)){
        importGf = true;
    }

    if(importCss){
        el = document.createElement('link');
        el.setAttribute('type', 'text/css');
        el.setAttribute('rel', 'stylesheet');
        el.setAttribute('href', folder + "/css/general.css?" + version);
        document.head.appendChild(el);
    }

    if(importJquery){
        el = document.createElement('script');
        el.setAttribute('type', 'text/javascript');
        el.setAttribute('src', folder + "/jquery-3.1.1.min.js?" + version);
        document.head.appendChild(el);
    }

    if(importGf){
        el = document.createElement('script');
        el.setAttribute('type', 'text/javascript');
        el.setAttribute('src', folder + "/gf.js?" + version);
        document.head.appendChild(el);
    }
}