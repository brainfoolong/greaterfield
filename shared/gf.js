"use strict";

var gf = {

    // the api url
    api: "https://localhost/gf",
    // the current version
    version: null,
    // the shared folder to access extension files
    sharedFolder: null,

    /**
     * Initialize gf
     */
    init: function () {
        var cl = "";
        // add css classes to top
        if (window.location.href.match(/\/companion\/|\/companion$/i)) cl = "gf-companion";
        if (window.location.href.match(/\/forums\.battlefield\.com\//i)) cl = "gf-forums";
        // stop if we don't have found any suitable page
        if (cl == "") return false;
        $("html").addClass(cl);
        // domchange observer
        var observer = new MutationObserver(gf.domchange.onMutation);
        observer.observe(document.body, {childList: true, subtree: true});
        // keydown escape or press on close will close greaterfield
        $(document).on("keydown", function (ev) {
            if (ev.keyCode == 27) {
                $("#gf-menu").removeClass("active");
            }
        });
        // bind all toggle clicks
        $(document).on("click", ".gf .toggle[data-storage-key]", function () {
            $(this).toggleClass("active");
            gf.storage.set($(this).attr("data-storage-key"), $(this).hasClass("active"));
            gf.frontend.toast("success", gf.translations.get("reload"))
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
                gf.actions.embedGfIcon();
                gf.actions.updateToggles();
                gf.tools.each(gf.actions._config, function (k, v) {
                    if (gf.storage.get("action.config." + k, v.init)) {
                        gf.actions[k]();
                    }
                });
            }, 250);
        },
    },

    /**
     * All actions
     */
    actions: {
        /**
         * The config for all available actions
         */
        _config: {
            "emblems": {"init": 1, "section": "general"},
            "plugins": {"init": 1, "section": "general"},
            "themes": {"init": 1, "section": "general"}
        },
        /**
         * The config handlers for config
         */
        configHandlers: {
            plugins: function () {
                gf.actions.configHandlers.themesAndPlugins("plugins");
            },
            themes: function () {
                gf.actions.configHandlers.themesAndPlugins("themes");
            },
            themesAndPlugins: function (mode) {
                if (mode == "plugins") {
                    var u = {
                        "singular": "plugin",
                        "url": "https://github.com/brainfoolong/greaterfield/wiki/Plugin-Development"
                    };
                } else {
                    var u = {
                        "singular": "theme",
                        "url": "https://github.com/brainfoolong/greaterfield/wiki/Theme-Development"
                    };
                }
                var html = $(`
                        <div class="plugins-themes">
                            ${gf.translations.get("action.config." + mode + ".handler.1")}<br/>
                            <a href="${u.url}" target="_blank">${u.url}</a><br/><br/>
                            <div class="entries">${gf.translations.get("loading")}</div>
                            <div class="entries">
                                <div class="entry develop">
                                            <div class="screenshot"></div>
                                            <div class="column">
                                                <div class="title"><div class="toggle" data-storage-key="${u.singular}.development"><div class="handle"></div></div> ${gf.translations.get("action.config." + mode + ".deventry")}</div>
                                                <div class="description">${gf.translations.get("action.config." + mode + ".handler.2")}
                                                <br/><br/>
                                                <input type="text">
                                                </div>
                                            </div>
                                        </div>                                                            
                                </div>
                        </div>
                    `);
                html.find(".develop input").on("input blur", function () {
                    var url = this.value;
                    if (!url.match(/^http.*?\.css/i)) {
                        return true;
                    }
                    gf.storage.set(u.singular + ".development.url", url);
                }).val(gf.storage.get(u.singular + ".development.url", ""));

                $.getJSON('https://api.github.com/repos/brainfoolong/greaterfield-' + mode + '/contents/' + mode, function (data) {
                    var t = html.find(".entries").first();
                    t.html('');
                    gf.tools.each(data, function (k, dir) {
                        // ignore base entry
                        if (dir.name == "base") return true;
                        // get manifest file
                        $.getJSON('https://raw.githubusercontent.com/brainfoolong/greaterfield-' + mode + '/master/' + mode + '/' + dir.name + '/manifest.json', function (manifest) {
                            if (manifest.active === true) {
                                var cl = dir.name == gf.storage.get(u.singular + ".stable.name") ? 'active' : "";
                                t.append(`
                                        <div class="entry">
                                            <div class="screenshot"><img src="https://raw.githubusercontent.com/brainfoolong/greaterfield-${mode}/master/${mode}/${dir.name}/screenshot.jpg"></div>
                                            <div class="column">
                                                <div class="title"><div class="toggle ${cl}" data-name="${dir.name}"><div class="handle"></div></div>  ${manifest.name} v${manifest.version}</div>
                                                <div class="author">${gf.translations.get("author")}: ${manifest.author}</div>
                                                <div class="description">${manifest.description}</div>
                                            </div>
                                        </div>
                                    `);
                            }
                        });
                    });
                    t.on("click", ".toggle", function () {
                        if (mode == "plugins") {
                            // plugins are allowed to enable multiple at once
                            $(this).toggleClass("active");
                            var ids = [];
                            t.find(".toggle.active").each(function () {
                                ids.push($(this).attr("data-name"));
                            });
                            gf.storage.set(u.singular + ".stable.names", ids);
                        } else {
                            // themes are allowed to enable only one at a time, beside development entry
                            t.find(".toggle").not(this).removeClass("active");
                            $(this).toggleClass("active");
                            gf.storage.set(u.singular + ".stable.name", $(this).hasClass("active") ? $(this).attr("data-name") : false);
                        }
                        gf.frontend.toast("success", gf.translations.get("reload"));
                    });
                });
                gf.frontend.modal(html);
            }
        },
        /**
         * Check if a given element is flagged (true flag), additionally separated for given name
         * @param {jQuery} e
         * @param {=string} name
         * @returns {boolean|null} null when element is not given
         */
        flagged: function (e, name) {
            if (!e || !e.length) return null;
            name = name || "";
            var r = e.data("gf-" + name) || false;
            e.data("gf-" + name, true);
            return r;
        },

        /**
         * Update all our toggles with their initial state
         */
        updateToggles: function () {
            $(".gf .toggle").filter("[data-storage-key]").each(function () {
                if (!gf.actions.flagged($(this))) {
                    if (gf.storage.get($(this).attr("data-storage-key"))) {
                        $(this).addClass("active");
                    }
                }
            });
        },

        /**
         * Embed GF icon
         */
        embedGfIcon: function () {
            var icon = $("#gf-icon");
            if (icon.length) return;
            icon = $('<div id="gf-icon" class="gf"><img src="' + gf.sharedFolder + '/img/menu_icon.png"></div>');
            $("body").append(icon).append('<div id="gf-menu" class="gf"></div>');
            icon.on("click", function () {
                $("#gf-menu, #gf-icon").toggleClass("active");
                var menu = $("#gf-menu");
                menu.html('');
                if (menu.hasClass("active")) {
                    var sections = {};
                    gf.tools.each(gf.actions._config, function (k, v) {
                        sections[v.section] = v.section;
                    });
                    menu.append(`
                            <h3 class="font-futura">GreaterField v${gf.version}!</h3>
                        `);

                    // create for each section block
                    gf.tools.each(sections, function (k, sectionId) {
                        var section = $(`<div class="section"><div class="title">${gf.translations.get("action.config.section." + sectionId)}</div></div>`);
                        menu.append(section);
                        gf.tools.each(gf.actions._config, function (k, v) {
                            if (v.section == sectionId) {
                                var html = gf.translations.get("action.config." + k);
                                if (typeof gf.actions.configHandlers[k] == "function") {
                                    html = $('<span class="gf-btn">' + html + '</span>');
                                    html.on("click", gf.actions.configHandlers[k]);
                                }
                                var option = $(`<div class="option" data-id="${k}"><div class="toggle" data-storage-key="action.config.${k}"><div class="handle"></div></div><div class="text"></div></div>`);
                                var info = gf.translations.get("action.config." + k + ".info")
                                if (info != null) {
                                    option.append($('<div class="info"></div>').html(info));
                                }
                                option.find(".text").append(html);
                                section.append(option);
                            }
                        });
                    });
                }
            });
        },

        /**
         * Plugins
         */
        plugins: function () {
            var pluginsActivated = [];
            if (gf.storage.get("plugin.stable.names")) {
                gf.tools.each(gf.storage.get("plugin.stable.names"), function (k, v) {
                    pluginsActivated.push({
                        name: "stable-" + v,
                        url: "https://rawgit.com/brainfoolong/greaterfield-plugins/master/plugins/" + v + "/script.js"
                    });
                });
            }
            if (gf.storage.get("plugin.development") && gf.storage.get("plugin.development.url", "")) {
                pluginsActivated.push({
                    name: "dev",
                    url: gf.storage.get("plugin.development.url")
                });
            }
            gf.tools.each(pluginsActivated, function (k, v) {
                var e = $("#gf-plugin-" + v.name);
                if (e.length && e.attr("src") == v.url) return true;
                $("#gf-plugin-" + v.name).remove();
                $("head").append('<script type="text/javascript" defer="defer" src="' + v.url + '"></script>');
            });
        },

        /**
         * Themes - Check if any theme or development theme is activated and include it
         */
        themes: function () {
            var themesActivated = [];
            if (gf.storage.get("theme.stable.name")) {
                themesActivated.push({
                    name: "stable",
                    url: "https://rawgit.com/brainfoolong/greaterfield-themes/master/themes/" + gf.storage.get("theme.stable.name") + "/style.css"
                });
            }
            if (gf.storage.get("theme.development") && gf.storage.get("theme.development.url", "")) {
                themesActivated.push({
                    name: "dev",
                    url: gf.storage.get("theme.development.url")
                });
            }
            gf.tools.each(themesActivated, function (k, v) {
                var e = $("#gf-theme-" + v.name);
                if (e.length && e.attr("href") == v.url) return true;
                $("#gf-theme-" + v.name).remove();
                $("head").append('<link id="gf-theme-' + v.name + '" rel="stylesheet" href="' + v.url + '" media="all" type="text/css">');
            });
        },

        /**
         * Emblem gallery
         */
        emblems: function () {
            var e = $(".row.back-link.emblem-back-link");
            if (gf.actions.flagged(e) !== false || !gf.url.matchUrlParts(["emblems"])) return;
            e.append(`
                    <div class="column gr-adapt"><a href="https://greaterfield.com" target="_blank">Get more emblems from greaterfield.com</a></div>
                    <div class="column gr-adapt"><span>Import from Gallery</span></div>
                `);
        }
    },

    /**
     * Translate
     */
    translations: {
        /**
         * The translation values
         */
        _values: {},
        /**
         * The current locale
         */
        _locale: "en",
        /**
         * Load translation from extension folder for current local
         */
        load: function (callback) {
            gf.translations._locale = BF.globals.locale ? BF.globals.locale.split("_")[0] : "en";
            $.getJSON(gf.sharedFolder + "/translations/en.json", function (data) {
                gf.translations._values["en"] = data;
            });
            if (gf.translations._locale) {
                $.getJSON(gf.sharedFolder + "/translations/" + gf.translations._locale + ".json", function (data) {
                    gf.translations._values[gf.translations._locale] = data;
                });
            }
            // just wait a hardcoded time for the files to load, should be enough for both
            setTimeout(callback, 50);
        },
        /**
         * Get a translation for the current locale, if not found than for en, if than not found return null
         * @param {string} key
         * @param {=object} replacements Replace the given placeholders in {brackets}
         * @returns {string|null}
         */
        get: function (key, replacements) {
            var v = null;
            if (
                typeof gf.translations._values[gf.translations._locale] != "undefined" &&
                typeof gf.translations._values[gf.translations._locale][key] != "undefined"
            ) {
                v = gf.translations._values[gf.translations._locale][key];
            }

            if (
                v == null &&
                typeof gf.translations._values["en"] != "undefined" &&
                typeof gf.translations._values["en"][key] != "undefined"
            ) {
                v = gf.translations._values["en"][key];
            }
            if (v != null) {
                gf.tools.each(replacements, function (k, value) {
                    v = v.replace(new RegExp("{" + k + "}", "ig"), value);
                });
            }
            return v;
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
         * @param {=*} defaultIfUndefined Return this value instead of undefined if key is not found
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
     * Frontend things
     */
    frontend: {
        /**
         * Show a modal window
         * @param {jQuery|string} html
         */
        modal: function (html) {
            $("#gf-modal").remove();
            var e = $(`
            <div id="gf-modal" class="gf">
                <div class="inner">
                    <div class="close">x</div>
                    <div class="gf-content"></div>
                </div>
            </div>
            `);
            e.find(".close").on("click", function () {
                $(this).closest("#gf-modal").remove();
            });
            e.find(".gf-content").html(html);
            $("body").append(e);
        },
        /**
         * Show a toast message
         * @param {string} mode
         * @param {jQuery|string} html
         */
        toast: function (mode, html) {
            $("#gf-toast").remove();
            var e = $(`
            <div id="gf-toast" class="gf ${mode}">
                <div class="inner">
                    <div class="close">x</div>
                    <div class="gf-content"></div>
                </div>
            </div>
            `);
            e.find(".close").on("click", function () {
                $(this).closest("#gf-toast").remove();
            });
            e.find(".gf-content").html(html);
            setTimeout(function () {
                e.addClass("active");
            }, 30);
            $("body").append(e);
        },
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
         */
        each: function (arr, callback) {
            if (!arr) return false;
            if (Object.prototype.toString.call(arr) === '[object Array]') {
                for (var i = 0; i < arr.length; i++) {
                    if (callback(i, arr[i]) === false) return false;
                }
            } else {
                for (var i in arr) {
                    if (callback(i, arr[i]) === false) return false;
                }
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
    // load translation files
    gf.translations.load(function () {
        gf.storage.loadFromBackend(gf.init);
    });
});

