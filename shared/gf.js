"use strict";

/**
 * Greaterfield - Improvements for Battlefield Web Companion and the Battlefield Forums!
 *
 * @author BrainFooLong and all contributors
 * @link https://github.com/brainfoolong/greaterfield
 */

var gf = {

    /**
     * The homepage url
     */
    homepage: "https://greaterfield.com",
    //homepage: "https://localhost/gf",

    /**
     * The current version, injected by init scripts
     */
    version: null,

    /**
     * The shared folder the point to the extension directory, injected by init scripts
     */
    sharedFolder: null,

    /**
     * Initialize greaterfield
     */
    init: function () {
        var classAdd = "";
        // add css classes to top
        if (window.location.href.match(/\/companion\/|\/companion(\?|$)/i)) classAdd = "gf-companion";
        if (window.location.href.match(/\/forums\.battlefield\.com\//i)) classAdd = "gf-forums";
        if (window.location.href.match(/\/battlelog\.battlefield\.com\//i)) classAdd = "gf-battlelog";
        // stop if we don't have found any suitable page
        if (classAdd == "") return false;
        $("html").addClass(classAdd);

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

    /**
     * Api tools
     */
    api: {

        /**
         * Send a request to our api
         * @param {string} action
         * @param {object|null} data
         * @param {=function} callback
         */
        request: function (action, data, callback) {
            $.post(gf.homepage + "/api", {"action": action, "data": data}, function (data) {
                if (typeof callback == "function") {
                    callback(JSON.parse(data));
                }
            });
        }
    },

    /**
     * Some nifty url tools
     */
    url: {
        /**
         * The current full url
         */
        currentUrl: null,
        /**
         * The url parts
         */
        currentUrlParts: null,
        /**
         * Check if current url parts match all the given parts
         * @param {[]} parts
         * @returns {boolean}
         */
        matchUrlParts: function (parts) {
            if (!gf.url.currentUrlParts) return false;
            gf.tools.each(parts, function (i, part) {
                if ($.inArray(part, gf.url.currentUrlParts) == -1) return false;
            });
            return true;
        }
    },

    /**
     * Domchange and mutation handling
     */
    domchange: {
        /**
         * The timeout for the mutation to apply
         */
        _to: 0,
        /**
         * On any dom mutation
         */
        onMutation: function () {
            clearTimeout(gf.domchange._to);
            gf.domchange._to = setTimeout(function () {
                gf.url.currentUrl = window.location.href.replace(/([\?\#](.*))/ig, "");
                gf.url.currentUrlParts = gf.url.currentUrl.replace(/http.*?\/\/(.*?)\//ig, "").toLowerCase().split("/");
                gf.domchange.events.embedMenuIcon();
                gf.domchange.events.updateToggles();
                gf.tools.each(gf.config.keys, function (k, v) {
                    var storageKey = "config." + k;
                    if (v.overrideKey) {
                        storageKey = v.overrideKey;
                    }
                    // set initial value
                    if (gf.storage.get(storageKey) === null) {
                        gf.storage.set(storageKey, v.init);
                    }
                    if (typeof gf.domchange.events[k] == "function" && gf.storage.get(storageKey)) {
                        gf.domchange.events[k]();
                    }
                });
            }, 250);
        },
        /**
         * All events that fires on domchange, mostly one for each config key
         */
        events: {

            /**
             * Update all our toggles with their initial state
             */
            updateToggles: function () {
                $(".gf .toggle").filter("[data-storage-key]").each(function () {
                    if (gf.tools.isVirgin($(this), "toggles")) {
                        if (gf.storage.get($(this).attr("data-storage-key"))) {
                            $(this).addClass("active");
                        }
                    }
                });
            },

            /**
             * Embed GF menu icon
             */
            embedMenuIcon: function () {
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
                        gf.tools.each(gf.config.keys, function (k, v) {
                            sections[v.section] = v.section;
                        });
                        menu.append(`
                            <h3 class="font-futura">GreaterField v${gf.version}!</h3>
                        `);

                        // create for each section block
                        gf.tools.each(sections, function (k, sectionId) {
                            var section = $(`<div class="section"><div class="title">${gf.translations.get("config.section." + sectionId)}</div></div>`);
                            menu.append(section);
                            gf.tools.each(gf.config.keys, function (k, v) {
                                if (v.section == sectionId) {
                                    var storageKey = "config." + k;
                                    if (v.overrideKey) {
                                        storageKey = v.overrideKey;
                                    }
                                    var html = gf.translations.get(storageKey);
                                    if (typeof gf.config.handlers[k] == "function") {
                                        html = $('<span class="gf-btn">' + html + '</span>');
                                        html.on("click", gf.config.handlers[k]);
                                    }
                                    var option = $(`<div class="option"><div class="toggle" data-storage-key="${storageKey}"><div class="handle"></div></div><div class="text"></div></div>`);
                                    var info = gf.translations.get(storageKey + ".info");
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
             * Plugins - Check if any plugin or development plugin is activated and include it
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
                    $("head").append('<script type="text/javascript" defer="defer" src="' + v.url + '" id="gf-plugin-' + v.name + '"></script>');
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
             * Emblem gallery and improvements
             */
            emblems: function () {
                // bf4 emblem import
                (function () {
                    var e = $("#emblem-action-save");
                    if (!gf.tools.isVirgin(e) || $("#gf-emblem-import").length) return;
                    var btn = $(`<button id="gf-emblem-import" class="btn btn-primary pull-right margin-left">
                         <span>${gf.translations.get("emblem.import.battlelog")}</span>
                         </button>
                    `);
                    e.after(btn);
                    btn.on("click", function () {
                        gf.storage.set("emblem.import.code", JSON.stringify(emblem.emblem.data.objects));
                        base.showReceipt(gf.translations.get("emblem.import.battlelog.copied"));
                    });
                })();

                // share to public emblem gallery button
                (function () {
                    if ($("#gf-emblem-share").length || !gf.url.matchUrlParts(["emblems"])) return;
                    var copyBtn = $(".modal-container button.btn.action-copy");
                    var activeEmblem = $(".emblem-gallery-emblem.selected img").first();
                    if (copyBtn.length && activeEmblem.length) {
                        var btn = $(`<button class="btn-block btn" id="gf-emblem-share">Share to Greaterfield Gallery</button>`);
                        copyBtn.after(btn);
                        btn.on("click", function () {
                            btn.remove();
                            gf.frontend.toast("success", gf.translations.get("loading"));
                            var persona = gf.frontend.getCurrentPersona();
                            gf.frontend.request("Emblems.fetchPrivateEmblem", {
                                "personaId": persona.personaId,
                                "platform": persona.platform,
                                "slot": parseInt(window.location.href.match(/([0-9]+)($|\?)/)[1])
                            }, function (data) {
                                var img = new Image();
                                img.crossOrigin = 'Anonymous';
                                img.onload = function () {
                                    var canvas = document.createElement('CANVAS');
                                    var ctx = canvas.getContext('2d');
                                    var dataURL;
                                    canvas.height = this.height;
                                    canvas.width = this.width;
                                    ctx.drawImage(this, 0, 0);
                                    var dataURL = canvas.toDataURL("image/png");
                                    gf.api.request("emblem.save", {
                                        "image": dataURL,
                                        "objects": data
                                    }, function (code) {
                                        gf.frontend.toast(code == "1" ? "success" : "error", gf.translations.get("emblem.share.callback." + code));
                                    });
                                };
                                var src = activeEmblem.attr("src");
                                img.src = src;
                                if (img.complete || typeof img.complete == "undefined") {
                                    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
                                    img.src = src;
                                }
                            });
                        });
                    }
                })();

                // public emblem gallery button, modal and import
                (function () {
                    var e = $("#gf-emblem-public");
                    if (e.length || !gf.url.matchUrlParts(["emblems"])) return;
                    e = $("#emblem-preview").next();
                    var btn = $(`<button class="btn-block btn" id="gf-emblem-public">${gf.translations.get("emblem.gallery")}</button>`);
                    e.prepend(btn);
                    btn.on("click", function () {
                        var html = $(`
                            <div class="emblem-gallery">
                                <div>${gf.translations.get("emblem.import.notice")}</div><br/>
                                <div class="filters">
                                    <span class="gf-btn" data-id="newest">Newest</span> 
                                    <span class="gf-btn" data-id="top">Top</span> 
                                    <span class="gf-btn" data-id="random">Random</span>
                                </div>
                                <div class="entries"></div>
                                <div class="more"><span class="gf-btn">Show more emblems</span></div>
                            </div>
                        `);
                        var entries = [];
                        var showEntries = function (filter) {
                            entries.sort(function (a, b) {
                                var aV = 0;
                                var bV = 0;
                                if (filter == "newest") {
                                    aV = a.id;
                                    bV = b.id;
                                }
                                if (filter == "top") {
                                    aV = a.installs;
                                    bV = b.installs;
                                }
                                if (filter == "random") {
                                    aV = Math.random();
                                    bV = Math.random();
                                }
                                if (aV > bV) return -1;
                                if (aV < bV) return 1;
                                return 0;
                            });
                            html.find(".entries").html('');
                            gf.tools.each(entries, function (k, emblem) {
                                var entry = $(`
                                    <div class="entry gf-hidden" data-id="${emblem.id}">
                                        <div class="image"><img data-src="${emblem.image}"></div>
                                        <div class="gf-btn import">${gf.translations.get("import")}</div>
                                        <div class="gf-btn report">${gf.translations.get("report")}</div>
                                    </div>
                                `);
                                html.find(".entries").append(entry);
                                if (gf.storage.get("emblem.report." + emblem.id)) {
                                    entry.find(".report").remove();
                                }
                            });
                            html.find(".more .gf-btn").trigger("click");
                        };
                        html.on("click", ".filters .gf-btn", function () {
                            showEntries($(this).attr("data-id"));
                        });
                        html.on("click", ".more .gf-btn", function () {
                            var i = 0;
                            var max = 50;
                            html.find(".entries .entry.gf-hidden").each(function () {
                                i++;
                                $(this).removeClass("gf-hidden");
                                var img = $(this).find("img");
                                img.attr("src", img.attr("data-src"));
                                if (i > max) return false;
                            });
                            if (!html.find(".entries .entry.gf-hidden").length) {
                                $(this).remove();
                            }
                        });
                        html.on("click", ".entry .report", function () {
                            var id = $(this).closest(".entry").attr("data-id");
                            if (!gf.storage.get("emblem.report." + id)) {
                                var html = $(`
                                    <div class="emblem-report">
                                        ${gf.translations.get("emblem.report.text.1")}
                                        <textarea class="gf-input"></textarea><br/>
                                        <span class="gf-btn send">${gf.translations.get("send")}</span>
                                    </div>
                                `);
                                html.on("click", ".send", function () {
                                    var text = html.find("textarea").val().trim();
                                    if (text.length < 10) {
                                        gf.frontend.toast("error", gf.translations.get("emblem.report.error.1"));
                                        return;
                                    }
                                    gf.api.request("emblem.report", {"id": id, "text": text}, function () {
                                        gf.frontend.modal();
                                        gf.storage.set("emblem.report." + id, true);
                                        gf.frontend.toast("success", gf.translations.get("emblem.report.done"));
                                    });
                                });
                                gf.frontend.modal(html);
                            }
                        });
                        html.on("click", ".entry .import", function () {
                            if (gf.cache.get("emblem.import")) {
                                gf.frontend.toast("error", gf.translations.get("emblem.import.error.1"));
                            } else {
                                var id = $(this).closest(".entry").attr("data-id");
                                gf.frontend.toast("success", gf.translations.get("loading"));
                                gf.api.request("emblem.load", {
                                    "id": id,
                                    "done": gf.storage.get("emblem.loaded." + id)
                                }, function (data) {
                                    var objects = data.data;
                                    if (typeof objects.objects != "undefined") objects = objects.objects;
                                    gf.cache.set("emblem.import", 1);
                                    gf.storage.set("emblem.loaded." + id, 1);
                                    gf.frontend.request("Emblems.newPrivateEmblem", {"data": JSON.stringify(objects)}, function () {
                                        gf.cache.set("emblem.import", 0);
                                        gf.frontend.modal();
                                        gf.frontend.toast("success", gf.translations.get("reload"));
                                    });
                                });
                            }
                        });
                        gf.frontend.modal(html);
                        gf.api.request("emblem.gallery", null, function (data) {
                            entries = data.emblems;
                            showEntries("newest");
                        });
                    });
                    var importBtn = $(`<button class="btn-block btn" id="gf-emblem-code-import">${gf.translations.get("emblem.code.import")}</button>`);
                    e.prepend(importBtn);
                    importBtn.on("click", function () {
                        var html = $(`
                            <div class="emblem-code-import">
                                <div>${gf.translations.get("emblem.code.import.text.1")}</div>
                                <div>${gf.translations.get("emblem.import.notice")}</div>
                                <div><textarea class="gf-input"></textarea></div>
                                <span class="gf-btn import">${gf.translations.get("import")}</span>
                            </div>
                        `);
                        html.find("textarea").val(gf.storage.get("emblem.import.code"));
                        html.on("click", ".import", function () {
                            if (gf.cache.get("emblem.import")) {
                                gf.frontend.toast("error", gf.translations.get("emblem.import.error.1"));
                            } else {
                                gf.frontend.toast("success", gf.translations.get("loading"));
                                var t = html.find("textarea").val();
                                var m = t.match(/(\[.*?\])/);
                                if (m) {
                                    gf.cache.set("emblem.import", 1);
                                    gf.frontend.request("Emblems.newPrivateEmblem", {"data": m[1]}, function () {
                                        gf.cache.set("emblem.import", 0);
                                        gf.frontend.modal();
                                        gf.frontend.toast("success", gf.translations.get("reload"));
                                    });
                                } else {
                                    gf.frontend.toast("error", gf.translations.get("emblem.import.error.2"));
                                }
                            }
                        });
                        gf.frontend.modal(html);
                    });
                })();
            }
        }
    },

    /**
     * Some helpfull stuff for plugins
     */
    plugins: {
        /**
         * Register a plugin
         * @param {function} pluginHandler
         */
        register: function (pluginHandler) {
            var valid = true;
            var err = function (msg) {
                valid = false;
                console.error("GFPlugin:" + msg);
            };
            if (typeof pluginHandler != "function") {
                err("Cannot register plugin, is not a function callback");
                return false;
            }
            var plugin = pluginHandler();
            if (
                typeof plugin != "object" ||
                typeof plugin.id == "undefined" ||
                typeof plugin.domchange == "undefined" ||
                typeof plugin.domchange.events == "undefined" ||
                typeof plugin.config == "undefined" ||
                typeof plugin.config.keys == "undefined" ||
                typeof plugin.translations == "undefined" ||
                typeof plugin.translations.en == "undefined" ||
                typeof plugin.translations.en.name == "undefined" ||
                plugin.id.match(/[^0-9a-z\-]/)
            ) {
                err("Cannot register plugin, callback return no valid plugin object");
                return false;
            }
            var pluginPrefix = "plugin." + plugin.id + ".";

            // check config flags
            gf.tools.each(plugin.config.keys, function (k, v) {
                if (v.init !== true && v.init !== false) err("Config Flag " + k + " does not have a boolean init key");
                if (typeof plugin.translations.en["config." + k] == "undefined") err("Config Flag " + k + " have no corresponding EN translation key");
            });
            if (!valid) return false;

            // add translations
            gf.tools.each(plugin.translations, function (locale, values) {
                var newValues = {};
                gf.tools.each(values, function (k, v) {
                    newValues[pluginPrefix + k] = v;
                });
                gf.translations.addValues(locale, newValues);

                // add section specific translation#
                newValues = {};
                newValues["config.section." + pluginPrefix] = gf.translations.get(pluginPrefix + "name");
                gf.translations.addValues(locale, newValues);
            });

            gf.tools.each(plugin.config.keys, function (k, v) {
                // add config key
                v.section = pluginPrefix;
                v.overrideKey = pluginPrefix + "config." + k;
                gf.config.keys[pluginPrefix + k] = v;
                // add handlers
                if (typeof plugin.config.handlers != "undefined" && typeof plugin.config.handlers[k] == "function") {
                    gf.config.handlers[pluginPrefix + k] = plugin.config.handlers[k];
                }
                // add domchange events
                if (typeof plugin.domchange.events[k] == "function") {
                    gf.domchange.events[pluginPrefix + k] = plugin.domchange.events[k];
                }
            });

            // inject required functions
            plugin.t = function (key) {
                return gf.translations.get(pluginPrefix + key);
            };
            plugin.storage.get = function (key) {
                return gf.storage.get(pluginPrefix + key);
            };
            plugin.storage.set = function (key, value) {
                return gf.storage.set(pluginPrefix + key, value);
            };
            // trigger init if exist
            if (typeof plugin.init == "function") plugin.init();
        }
    },

    /**
     * Configuration keys and handlers
     */
    config: {
        /**
         * The available config keys for the menu
         */
        keys: {
            "emblems": {"init": true, "section": "general"},
            "plugins": {"init": true, "section": "general"},
            "themes": {"init": true, "section": "general"}
        },
        /**
         * The available config option click handlers
         */
        handlers: {
            plugins: function () {
                gf.config.handlers.themesAndPlugins("plugins");
            },
            themes: function () {
                gf.config.handlers.themesAndPlugins("themes");
            },
            /**
             * Internal function to handle both themes/plugins options
             * @param mode
             */
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
                            ${gf.translations.get("config." + mode + ".handler.1")}<br/>
                            <a href="${u.url}" target="_blank">${u.url}</a><br/><br/>
                            <div class="entries">${gf.translations.get("loading")}</div>
                            <div class="entries">
                                <div class="entry develop">
                                            <div class="screenshot"></div>
                                            <div class="column">
                                                <div class="title">
                                                    <div class="toggle" data-storage-key="${u.singular}.development"><div class="handle"></div></div> 
                                                    ${gf.translations.get("config." + mode + ".deventry")}
                                                </div>
                                                <div class="description">${gf.translations.get("config." + mode + ".handler.2")}
                                                <input type="text" class="gf-input">
                                                </div>
                                            </div>
                                        </div>                                                            
                                </div>
                        </div>
                    `);
                html.find(".develop input").on("input blur", function () {
                    var url = this.value;
                    if ((mode == "themes" && !url.match(/^http.*?\.css/i)) || (mode == "plugins" && !url.match(/^http.*?\.js/i))) {
                        return true;
                    }
                    gf.storage.set(u.singular + ".development.url", url);
                    gf.frontend.toast("success", gf.translations.get("reload"));
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
        }
    },

    /**
     * Translations
     */
    translations: {
        /**
         * The translation values
         */
        _values: {},
        /**
         * The current locale
         */
        locale: "en",
        /**
         * Add values for a specific locale
         * @param {string} locale
         * @param {object} values
         */
        addValues: function (locale, values) {
            gf.translations._values[locale] = $.extend(gf.translations._values[locale] || {}, values);
        },
        /**
         * Load translation from extension folder for current local
         */
        load: function (callback) {
            var locale = "en";
            if (typeof BF != "undefined") {
                locale = BF.globals.locale;
            } else if (window.locale) {
                locale = window.locale;
            }
            locale = locale.toLowerCase().replace(/_/ig, "-");
            if (locale != "pt-br") {
                locale = locale.split("-")[0];
            }
            gf.translations.locale = locale;
            $.getJSON(gf.sharedFolder + "/translations/en.json", function (data) {
                gf.translations.addValues("en", data);
            });
            if (gf.translations.locale) {
                $.getJSON(gf.sharedFolder + "/translations/" + gf.translations.locale + ".json", function (data) {
                    gf.translations.addValues(gf.translations.locale, data);
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
                typeof gf.translations._values[gf.translations.locale] != "undefined" &&
                typeof gf.translations._values[gf.translations.locale][key] != "undefined"
            ) {
                v = gf.translations._values[gf.translations.locale][key];
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
     * Storage handling
     */
    storage: {
        /**
         * The storage data
         */
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
         * Get a key from the storage
         * @param {string} key
         * @param {=} defaultIfUndefined Return this value instead of undefined if key is not found
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
         * Set a key with value in the storage
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
     * Cache handling
     */
    cache: {
        /**
         * The cache data
         */
        _data: null,
        /**
         * Get a key from the cache
         * @param {string} key
         * @param {=} defaultIfUndefined Return this value instead of undefined if key is not found
         * @returns {*}
         */
        get: function (key, defaultIfUndefined) {
            if (typeof defaultIfUndefined == "undefined") {
                defaultIfUndefined = null;
            }
            if (!gf.cache._data) {
                return null;
            }
            if (typeof gf.cache._data[key] == "undefined") {
                return defaultIfUndefined;
            }
            return gf.cache._data[key];
        },
        /**
         * Set a key with value in the cache
         * @param {string} key
         * @param {*} value
         */
        set: function (key, value) {
            if (!gf.cache._data) {
                gf.cache._data = {};
            }
            gf.cache._data[key] = value;
        }
    },
    /**
     * The port to the background page of the extension
     */
    backend: {
        /**
         * The used callback prefix, a random id
         */
        _callbackPrefix: "gf-" + Math.random(),
        /**
         * The callbacks from the send() to receive corresponding requests properly
         */
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
     * Frontend shiny tools
     */
    frontend: {
        /**
         * Show a modal window
         * @param {=jQuery} html If undefined than the existing modal will just get removed
         */
        modal: function (html) {
            $("#gf-modal").remove();
            if (!html) return;
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
        },
        /**
         * Send a request to battlelog
         * @param {string} url
         * @param {=function} callback
         */
        battlelogRequest: function (url, callback, error) {
            $.ajax({
                "url": url,
                complete: function (data, status) {
                    if (status == "success") {
                        callback(typeof data == "string" ? JSON.parse(data) : data, status);
                    } else {
                        callback(data, status);
                    }
                },
                beforeSend: function (xhr) {
                    xhr.overrideMimeType('application/json');
                    xhr.setRequestHeader('X-AjaxNavigation', 1);
                }
            });
        }
    },

    /**
     * Some helpfull tools
     */
    tools: {
        /**
         * Check if a given element is virgin, in programmer speech :)
         * This will return true if this function ever has been called before on this element
         * If the element not exist or this function has been called before on the element, it will return false
         * It is used to check if an element has already been processed by a domchange event
         * @param {jQuery} e The element
         * @param {string} name A name to check virginity for
         * @returns {boolean|null} null when element is not given
         */
        isVirgin: function (e, name) {
            if (!e || !e.length) return false;
            name = name || "";
            if (e.data("gf-" + name)) return false;
            e.data("gf-" + name, true);
            return true;
        },
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

