"use strict";

var runtimeApi = ((chrome && chrome.runtime && chrome.runtime.sendMessage ? chrome.runtime : null) || browser.runtime);
var extensionApi = ((chrome && chrome.extension && chrome.extension.onConnect ? chrome.extension : null) || browser.runtime);
var manifest = runtimeApi.getManifest();
runtimeApi.onConnect.addListener(function (port) {
    if (port.name == "bg") {
        port.onMessage.addListener(function (msg) {
            switch (msg.action) {
                case "init":
                    msg.data.version = manifest.version;
                    msg.data.sharedFolder = extensionApi.getURL("shared");
                    port.postMessage(msg);
                    break;
                case "storage-set":
                    localStorage.setItem("gf", JSON.stringify(msg.data.gf));
                    port.postMessage(msg);
                    break;
                case "storage-get":
                    var gf = localStorage.getItem("gf");
                    gf = (typeof gf == "undefined" || gf == null || gf == "undefined") ? {} : JSON.parse(gf);
                    msg.data.gf = gf;
                    port.postMessage(msg);
                    break;
            }
        });
    }
});