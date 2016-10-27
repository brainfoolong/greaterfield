"use strict";

(function () {
    var ivb = setInterval(function () {
        if (!document.head || !document.body || !window || !window.postMessage) return;
        clearInterval(ivb);

        var runtimeApi = ((chrome && chrome.runtime && chrome.runtime.sendMessage ? chrome.runtime : null) || browser.runtime);
        var extensionApi = ((chrome && chrome.extension && chrome.extension.onConnect ? chrome.extension : null) || browser.runtime);
        var manifest = runtimeApi.getManifest();

        // get settings from background page and than inject
        var port = extensionApi.connect({name: "bg"});
        port.onMessage.addListener(function (msg) {
            msg.comeFrom = "gf-backend";
            window.postMessage(msg, "*");
        });
        inject(window.document, manifest.version, extensionApi.getURL("shared"));

        window.addEventListener("message", function (event) {
            if(event.data && event.data.comeFrom == "gf-frontend"){
                port.postMessage(event.data);
            }
        }, false);
    }, 5);
})();
