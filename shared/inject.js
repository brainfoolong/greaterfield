"use strict";

function inject(document, version, folder) {

    var el;

    el = document.createElement('link');
    el.setAttribute('type', 'text/css');
    el.setAttribute('rel', 'stylesheet');
    el.setAttribute('href', folder + "/css/general.css?" + version);
    document.head.appendChild(el);

    el = document.createElement('script');
    el.setAttribute('type', 'text/javascript');
    el.setAttribute('src', folder + "/jquery-3.1.1.min.js?" + version);
    document.head.appendChild(el);

    el = document.createElement('script');
    el.setAttribute('type', 'text/javascript');
    el.setAttribute('src', folder + "/gf.js?" + version);
    document.head.appendChild(el);
}