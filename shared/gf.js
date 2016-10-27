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
            "themes": function () {
                var html = $(`
                        <div>
                            Give the website a better look with this community made themes. Are you a css artist? Add your own theme here, visit:<br/>
                            <a href="https://github.com/brainfoolong/greaterfield/wiki/Theme-Development" target="_blank">https://github.com/brainfoolong/greaterfield/wiki/Theme-Development</a><br/><br/>
                            <div class="themes">Please wait, we loading the themes...</div>
                            <div class="themes">
                                <div class="entry develop">
                                            <div class="screenshot"></div>
                                            <div class="column">
                                                <div class="title"><div class="toggle" data-storage-key="theme.development"><div class="handle"></div></div> Development Theme</div>
                                                <div class="description">Enter an URL to a CSS file in the field bellow. So you can quickly develop a theme in combination with github/dropbox or whatever. Just point to your css url. Don't forget to enable the development theme with the tiny toggle above. After you have entered the link just reload the page. If you want to add a theme to our themes in the list above, head to the above mentioned link :)
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
                    gf.storage.set("theme.development.url", this.value);
                }).val(gf.storage.get("theme.development.url", ""));

                $.getJSON('https://api.github.com/repos/brainfoolong/greaterfield-themes/contents/themes', function (data) {
                    var t = html.find(".themes").first();
                    t.html('');
                    gf.tools.each(data, function (k, dir) {
                        // ignore base theme
                        if (dir.name == "base") return true;
                        // get manifest file
                        $.getJSON("https://raw.githubusercontent.com/brainfoolong/greaterfield-themes/master/themes/" + dir.name + "/manifest.json", function (manifest) {
                            if (manifest.active === true) {
                                var cl = dir.name == gf.storage.get("theme.stable.name");
                                t.append(`
                                        <div class="entry">
                                            <div class="screenshot"><img src="https://raw.githubusercontent.com/brainfoolong/greaterfield-themes/master/themes/${dir.name}/screenshot.jpg"></div>
                                            <div class="column">
                                                <div class="title"><div class="toggle" data-name="${dir.name}"><div class="handle"></div></div>  ${manifest.name} v${manifest.version}</div>
                                                <div class="author">${manifest.author}</div>
                                                <div class="description">${manifest.description}</div>
                                            </div>
                                        </div>
                                    `);
                            }
                        });
                    });
                    t.find(".toggle").on("click", function () {
                        t.find(".toggle").not(this).removeClass("active");
                        $(this).toggleClass("active");
                        gf.storage.set("theme.stable.name", $(this).hasClass("active") ? $(this).attr("data-name") : false);
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
                        var section = $(`<div class="section"><div class="title">${sectionId}</div></div>`);
                        menu.append(section);
                        gf.tools.each(gf.actions._config, function (k, v) {
                            if (v.section == sectionId) {
                                var html = k;
                                if (typeof gf.actions.configHandlers[k] == "function") {
                                    html = $('<button class="btn">' + html + '</button>');
                                    html.on("click", gf.actions.configHandlers[k]);
                                }
                                var option = $(`<div class="option" data-id="${k}"><div class="toggle" data-storage-key="action.config.${k}"><div class="handle"></div></div><div class="text"></div></div>`);
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

        },

        /**
         * Themes - Check if any theme or development theme is activated and include it
         */
        themes: function () {
            var themesActivated = [];
            if (gf.storage.get("theme.stable.name")) {
                themesActivated.push({
                    name: "stable",
                    url: "https://raw.githubusercontent.com/brainfoolong/greaterfield-themes/master/themes/" + gf.storage.get("theme.stable.name") + "/style.css"
                });
            }
            if (gf.storage.get("theme.development") && gf.storage.get("theme.development.url")) {
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
                    <div class="column gr-adapt"><a href="${gf.api}" target="_blank">Get more emblems from greaterfield.com</a></div>
                    <div class="column gr-adapt"><span>Import from Gallery</span></div>
                `);
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

