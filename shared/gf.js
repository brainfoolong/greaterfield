"use strict";

var gf = {

    // the api url
    api: "http://localhost/gf",
    // the current version
    version: null,
    // the shared folder to access extension files
    sharedFolder: null,

    /**
     * Initialize gf
     */
    init: function () {
        // domchange observer
        var observer = new MutationObserver(gf.domchange.onMutation);
        observer.observe(document.body, {childList: true, subtree: true});
        // keydown escape or press on close will close greaterfield
        $(document).on("keydown", function (ev) {
            if (ev.keyCode == 27) {
                $("#gf-menu").removeClass("active");
            }
        });
    },

    url: {
        // the current full url
        _currentUrl: null,
        // the url parts
        _currentUrlParts: null,
        /**
         * check if current url parts match all the given parts
         * @param {[]} parts
         * @returns {boolean}
         */
        matchUrlParts: function (parts) {
            if (!gf.url._currentUrlParts) return false;
            gf.tools.each(parts, function (i, part) {
                if ($.inArray(part, gf.url._currentUrlParts) == -1) return false;
            });
            return true;
        }
    },

    /**
     * Handle domchange
     */
    domchange: {
        // the timeout for the mutation to apply
        _to: 0,
        /**
         * On any dom mutation
         */
        onMutation: function () {
            clearTimeout(gf.domchange._to);
            gf.domchange._to = setTimeout(function () {
                gf.url._currentUrl = window.location.href.replace(/([\?\#](.*))/ig, "");
                gf.url._currentUrlParts = gf.url._currentUrl.replace(/http.*?\/\/(.*?)\//ig, "").toLowerCase().split("/");
                gf.domchange.actions._embedGfIcon();
                gf.tools.each(gf.domchange.actions._config, function (k, v) {
                    if (gf.storage.get("action.config." + k, v.init)) {
                        gf.domchange.actions[k]();
                    }
                });
            }, 250);
        },

        /**
         * All domchange actions
         */
        actions: {
            // the config for all available actions
            _config: {
                "emblems": {"init": 1, "section": "general"}
            },

            /**
             * Check if a given element is flagged (true flag), additionally separated for given name
             * @param {jQuery} e
             * @param {string} name
             * @returns {boolean|null} null when element is not given
             */
            _flagged: function (e, name) {
                if (!e || !e.length) return null;
                name = name || "";
                var r = e.data("gf-" + name) || false;
                e.data("gf-" + name, true);
                return r;
            },

            /**
             * Embed GF icon
             */
            _embedGfIcon: function () {
                var icon = $("#gf-icon");
                if (icon.length || !gf.url.matchUrlParts(["companion"])) return;
                icon = $('<div id="gf-icon"><img src="' + gf.sharedFolder + '/img/menu_icon.png"></div>');
                $("body").append(icon).append('<div id="gf-menu"></div>');
                icon.on("click", function () {
                    $("#gf-menu, #gf-icon").toggleClass("active");
                    var menu = $("#gf-menu");
                    menu.html('');
                    if (menu.hasClass("active")) {
                        var sections = {};
                        gf.tools.each(gf.domchange.actions._config, function (k, v) {
                            sections[v.section] = v.section;
                        });
                        menu.append(`
                            <h3 class="font-futura">GreaterField v${gf.version}!</h3>
                        `);

                        // create for each section block
                        gf.tools.each(sections, function (k, sectionId) {
                            var section = $(`<div class="section"><div class="title">${sectionId}</div></div>`);
                            menu.append(section);
                            gf.tools.each(gf.domchange.actions._config, function (k, v) {
                                if (v.section == sectionId) {
                                    var cl = gf.storage.get("action.config." + k, v.init) ? "active" : "";
                                    section.append(`
                                        <div class="option" data-id="${k}"><div class="toggle ${cl}"><div class="handle"></div></div>${k}</div>
                                    `);
                                }
                            });
                        });

                        menu.on("click", ".option .toggle", function () {
                            var id = $(this).closest(".option").attr("data-id");
                            console.log(id);
                            $(this).toggleClass("active");
                            gf.storage.set("action.config." + id, $(this).hasClass("active"));
                        });
                    }
                });
            },

            /**
             * Emblem gallery
             */
            emblems: function () {
                var e = $(".row.back-link.emblem-back-link");
                if (gf.domchange.actions._flagged(e) !== false || !gf.url.matchUrlParts(["emblems"])) return;
                e.append(`
                    <div class="column gr-adapt"><a href="${gf.api}" target="_blank">Get more emblems from greaterfield.com</a></div>
                    <div class="column gr-adapt"><span>Import from Gallery</span></div>
                `);

            }
        }
    },

    /**
     * Templates from extension
     */
    template: {
        /**
         * Load a template into given container
         * @param {jQuery} container
         * @param {string} name
         * @param {=function} callback
         */
        load: function (container, name, callback) {
            $.get(gf.sharedFolder + "/templates/" + name + ".html", function (data) {
                container.html(data);
                $.getScript(gf.sharedFolder + "/templates/" + name + ".js");
                if (callback) callback();
            });
            gf.backend.send("template-load", {"name": name}, function (msgData) {

            });
        }
    },

    /**
     * Storage handler
     */
    storage: {
        // the storage data
        _data: null,
        /**
         * Load storage object from backend
         * @param {=function} callback
         */
        loadFromBackend: function (callback) {
            gf.backend.send("storage-get", null, function (msgData) {
                gf.storage._data = msgData.gf;
                if (callback) callback(msgData);
            });
        },
        /**
         * Get a key from storage
         * @param {string} key
         * @param {*} defaultIfUndefined Return this value instead of undefined if key is not found
         * @returns {*}
         */
        get: function (key, defaultIfUndefined) {
            if (typeof defaultIfUndefined == "undefined") {
                defaultIfUndefined = null;
            }
            if (!gf.storage._data) {
                return null;
            }
            if (typeof gf.storage._data[key] == "undefined") {
                return defaultIfUndefined;
            }
            return gf.storage._data[key];
        },
        /**
         * Set a key with value in the storage object
         * @param {string} key
         * @param {*} value
         */
        set: function (key, value) {
            if (!gf.storage._data) {
                gf.storage._data = {};
            }
            gf.storage._data[key] = value;
            gf.backend.send("storage-set", {"gf": gf.storage._data});
        }
    },

    /**
     * The port to the background page
     */
    backend: {
        _callbackPrefix: "gf-" + Math.random(),
        _callbacks: [],
        /**
         * Send a command to the backend
         * @param {string} action
         * @param {*=} data
         * @param {=function} callback
         */
        send: function (action, data, callback) {
            data = data || {};
            gf.backend._callbacks.push(callback);
            window.postMessage({
                "action": action,
                "comeFrom": "gf-frontend",
                "callbackPrefix": gf.backend._callbackPrefix,
                "callbackId": gf.backend._callbacks.length - 1,
                "data": data
            }, "*");
        },
        /**
         * On receive a message from the backend
         * @param {object} msg
         */
        receive: function (msg) {
            if (msg.callbackPrefix == gf.backend._callbackPrefix && typeof gf.backend._callbacks[msg.callbackId] == "function") {
                gf.backend._callbacks[msg.callbackId](msg.data);
            }
        }
    },

    /**
     * Frontend requests to communicate with the webpage
     */
    frontend: {
        /**
         * Get current persona of the logged in user
         * @param {=number} index
         * @returns {object|null}
         */
        getCurrentPersona: function (index) {
            index = index || 0;
            if (SC && SC.personas && SC.personas[index]) return SC.personas[index];
            return null;
        },
        /**
         * Send request via jsonRPC to frontend
         * @param {string} action
         * @param {*} data
         * @param {=function} callback
         */
        request: function (action, data, callback) {
            SC.client.jsonRpc(action, data, callback);
        }
    },

    /**
     * Some helpfull tools
     */
    tools: {
        /**
         * Iterate over array or object
         * @param {[]|object} arr
         * @param {function} callback If return false than the iterations is stopped
         * @returns {boolean}
         */
        each: function (arr, callback) {
            for (var i in arr) {
                if (callback(i, arr[i]) === false) return false;
            }
        }
    }
};

// listener for the backend
window.addEventListener("message", function (event) {
    if (event.data && event.data.comeFrom == "gf-backend") {
        gf.backend.receive(event.data);
    }
}, false);

// load storage from backend and initialize gf
gf.backend.send("init", null, function (msgData) {
    gf.version = msgData.version;
    gf.sharedFolder = msgData.sharedFolder;
    gf.storage.loadFromBackend(gf.init);
});

