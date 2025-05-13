/*******************************************************************************
 * Copyright 2017 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
if (window.Element && !Element.prototype.closest) {
    // eslint valid-jsdoc: "off"
    Element.prototype.closest =
        function(s) {
            "use strict";
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var el      = this;
            var i;
            do {
                i = matches.length;
                while (--i >= 0 && matches.item(i) !== el) {
                    // continue
                }
            } while ((i < 0) && (el = el.parentElement));
            return el;
        };
}

if (window.Element && !Element.prototype.matches) {
    Element.prototype.matches =
        Element.prototype.matchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            "use strict";
            var matches = (this.document || this.ownerDocument).querySelectorAll(s);
            var i       = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {
                // continue
            }
            return i > -1;
        };
}

if (!Object.assign) {
    Object.assign = function(target, varArgs) { // .length of function is 2
        "use strict";
        if (target === null) {
            throw new TypeError("Cannot convert undefined or null to object");
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource !== null) {
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    };
}

(function(arr) {
    "use strict";
    arr.forEach(function(item) {
        if (item.hasOwnProperty("remove")) {
            return;
        }
        Object.defineProperty(item, "remove", {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                this.parentNode.removeChild(this);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "image";

    var EMPTY_PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    var LAZY_THRESHOLD = 0;
    var SRC_URI_TEMPLATE_WIDTH_VAR = "{.width}";

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]',
        image: '[data-cmp-hook-image="image"]',
        map: '[data-cmp-hook-image="map"]',
        area: '[data-cmp-hook-image="area"]'
    };

    var lazyLoader = {
        "cssClass": "cmp-image__image--is-loading",
        "style": {
            "height": 0,
            "padding-bottom": "" // will be replaced with % ratio
        }
    };

    var properties = {
        /**
         * An array of alternative image widths (in pixels).
         * Used to replace a {.width} variable in the src property with an optimal width if a URI template is provided.
         *
         * @memberof Image
         * @type {Number[]}
         * @default []
         */
        "widths": {
            "default": [],
            "transform": function(value) {
                var widths = [];
                value.split(",").forEach(function(item) {
                    item = parseFloat(item);
                    if (!isNaN(item)) {
                        widths.push(item);
                    }
                });
                return widths;
            }
        },
        /**
         * Indicates whether the image should be rendered lazily.
         *
         * @memberof Image
         * @type {Boolean}
         * @default false
         */
        "lazy": {
            "default": false,
            "transform": function(value) {
                return !(value === null || typeof value === "undefined");
            }
        },
        /**
         * The image source.
         *
         * Can be a simple image source, or a URI template representation that
         * can be variable expanded - useful for building an image configuration with an alternative width.
         * e.g. '/path/image.coreimg{.width}.jpeg/1506620954214.jpeg'
         *
         * @memberof Image
         * @type {String}
         */
        "src": {
        }
    };

    var devicePixelRatio = window.devicePixelRatio || 1;

    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    function Image(config) {
        var that = this;

        function init(config) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");

            setupProperties(config.options);
            cacheElements(config.element);

            if (!that._elements.noscript) {
                return;
            }

            that._elements.container = that._elements.link ? that._elements.link : that._elements.self;

            unwrapNoScript();

            if (that._properties.lazy) {
                addLazyLoader();
            }

            if (that._elements.map) {
                that._elements.image.addEventListener("load", onLoad);
            }

            window.addEventListener("scroll", that.update);
            window.addEventListener("resize", onWindowResize);
            window.addEventListener("update", that.update);
            that._elements.image.addEventListener("cmp-image-redraw", that.update);
            that.update();
        }

        function loadImage() {
            var hasWidths = that._properties.widths && that._properties.widths.length > 0;
            var replacement = hasWidths ? "." + getOptimalWidth() : "";
            var url = that._properties.src.replace(SRC_URI_TEMPLATE_WIDTH_VAR, replacement);

            if (that._elements.image.getAttribute("src") !== url) {
                that._elements.image.setAttribute("src", url);
                if (!hasWidths) {
                    window.removeEventListener("scroll", that.update);
                }
            }

            if (that._lazyLoaderShowing) {
                that._elements.image.addEventListener("load", removeLazyLoader);
            }
        }

        function getOptimalWidth() {
            var container = that._elements.self;
            var containerWidth = container.clientWidth;
            while (containerWidth === 0 && container.parentNode) {
                container = container.parentNode;
                containerWidth = container.clientWidth;
            }
            var optimalWidth = containerWidth * devicePixelRatio;
            var len = that._properties.widths.length;
            var key = 0;

            while ((key < len - 1) && (that._properties.widths[key] < optimalWidth)) {
                key++;
            }

            return that._properties.widths[key].toString();
        }

        function addLazyLoader() {
            var width = that._elements.image.getAttribute("width");
            var height = that._elements.image.getAttribute("height");

            if (width && height) {
                var ratio = (height / width) * 100;
                var styles = lazyLoader.style;

                styles["padding-bottom"] = ratio + "%";

                for (var s in styles) {
                    if (styles.hasOwnProperty(s)) {
                        that._elements.image.style[s] = styles[s];
                    }
                }
            }
            that._elements.image.setAttribute("src", EMPTY_PIXEL);
            that._elements.image.classList.add(lazyLoader.cssClass);
            that._lazyLoaderShowing = true;
        }

        function unwrapNoScript() {
            var markup = decodeNoscript(that._elements.noscript.textContent.trim());
            var parser = new DOMParser();

            // temporary document avoids requesting the image before removing its src
            var temporaryDocument = parser.parseFromString(markup, "text/html");
            var imageElement = temporaryDocument.querySelector(selectors.image);
            imageElement.removeAttribute("src");
            that._elements.container.insertBefore(imageElement, that._elements.noscript);

            var mapElement = temporaryDocument.querySelector(selectors.map);
            if (mapElement) {
                that._elements.container.insertBefore(mapElement, that._elements.noscript);
            }

            that._elements.noscript.parentNode.removeChild(that._elements.noscript);
            if (that._elements.container.matches(selectors.image)) {
                that._elements.image = that._elements.container;
            } else {
                that._elements.image = that._elements.container.querySelector(selectors.image);
            }

            that._elements.map = that._elements.container.querySelector(selectors.map);
            that._elements.areas = that._elements.container.querySelectorAll(selectors.area);
        }

        function removeLazyLoader() {
            that._elements.image.classList.remove(lazyLoader.cssClass);
            for (var property in lazyLoader.style) {
                if (lazyLoader.style.hasOwnProperty(property)) {
                    that._elements.image.style[property] = "";
                }
            }
            that._elements.image.removeEventListener("load", removeLazyLoader);
            that._lazyLoaderShowing = false;
        }

        function isLazyVisible() {
            if (that._elements.container.offsetParent === null) {
                return false;
            }

            var wt = window.pageYOffset;
            var wb = wt + document.documentElement.clientHeight;
            var et = that._elements.container.getBoundingClientRect().top + wt;
            var eb = et + that._elements.container.clientHeight;

            return eb >= wt - LAZY_THRESHOLD && et <= wb + LAZY_THRESHOLD;
        }

        function resizeAreas() {
            if (that._elements.areas && that._elements.areas.length > 0) {
                for (var i = 0; i < that._elements.areas.length; i++) {
                    var width = that._elements.image.width;
                    var height = that._elements.image.height;

                    if (width && height) {
                        var relcoords = that._elements.areas[i].dataset.cmpRelcoords;
                        if (relcoords) {
                            var relativeCoordinates = relcoords.split(",");
                            var coordinates = new Array(relativeCoordinates.length);

                            for (var j = 0; j < coordinates.length; j++) {
                                if (j % 2 === 0) {
                                    coordinates[j] = parseInt(relativeCoordinates[j] * width);
                                } else {
                                    coordinates[j] = parseInt(relativeCoordinates[j] * height);
                                }
                            }

                            that._elements.areas[i].coords = coordinates;
                        }
                    }
                }
            }
        }

        function cacheElements(wrapper) {
            that._elements = {};
            that._elements.self = wrapper;
            var hooks = that._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS + "]");

            for (var i = 0; i < hooks.length; i++) {
                var hook = hooks[i];
                var capitalized = IS;
                capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
                var key = hook.dataset[NS + "Hook" + capitalized];
                that._elements[key] = hook;
            }
        }

        function setupProperties(options) {
            that._properties = {};

            for (var key in properties) {
                if (properties.hasOwnProperty(key)) {
                    var property = properties[key];
                    if (options && options[key] != null) {
                        if (property && typeof property.transform === "function") {
                            that._properties[key] = property.transform(options[key]);
                        } else {
                            that._properties[key] = options[key];
                        }
                    } else {
                        that._properties[key] = properties[key]["default"];
                    }
                }
            }
        }

        function onWindowResize() {
            that.update();
            resizeAreas();
        }

        function onLoad() {
            resizeAreas();
        }

        that.update = function() {
            if (that._properties.lazy) {
                if (isLazyVisible()) {
                    loadImage();
                }
            } else {
                loadImage();
            }
        };

        if (config && config.element) {
            init(config);
        }
    }

    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new Image({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body             = document.querySelector("body");
        var observer         = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new Image({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

    /*
        on drag & drop of the component into a parsys, noscript's content will be escaped multiple times by the editor which creates
        the DOM for editing; the HTML parser cannot be used here due to the multiple escaping
     */
    function decodeNoscript(text) {
        text = text.replace(/&(amp;)*lt;/g, "<");
        text = text.replace(/&(amp;)*gt;/g, ">");
        return text;
    }

})();

/*******************************************************************************
 * Copyright 2016 Adobe
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/
(function() {
    "use strict";

    var NS = "cmp";
    var IS = "formText";
    var IS_DASH = "form-text";

    var selectors = {
        self: "[data-" + NS + '-is="' + IS + '"]'
    };

    var properties = {
        /**
         * A validation message to display if there is a type mismatch between the user input and expected input.
         *
         * @type {String}
         */
        constraintMessage: {
        },
        /**
         * A validation message to display if no input is supplied, but input is expected for the field.
         *
         * @type {String}
         */
        requiredMessage: {
        }
    };

    function readData(element) {
        var data = element.dataset;
        var options = [];
        var capitalized = IS;
        capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
        var reserved = ["is", "hook" + capitalized];

        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                var value = data[key];

                if (key.indexOf(NS) === 0) {
                    key = key.slice(NS.length);
                    key = key.charAt(0).toLowerCase() + key.substring(1);

                    if (reserved.indexOf(key) === -1) {
                        options[key] = value;
                    }
                }
            }
        }

        return options;
    }

    function FormText(config) {
        if (config.element) {
            // prevents multiple initialization
            config.element.removeAttribute("data-" + NS + "-is");
        }

        this._cacheElements(config.element);
        this._setupProperties(config.options);

        this._elements.input.addEventListener("invalid", this._onInvalid.bind(this));
        this._elements.input.addEventListener("input", this._onInput.bind(this));
    }

    FormText.prototype._onInvalid = function(event) {
        event.target.setCustomValidity("");
        if (event.target.validity.typeMismatch) {
            if (this._properties.constraintMessage) {
                event.target.setCustomValidity(this._properties.constraintMessage);
            }
        } else if (event.target.validity.valueMissing) {
            if (this._properties.requiredMessage) {
                event.target.setCustomValidity(this._properties.requiredMessage);
            }
        }
    };

    FormText.prototype._onInput = function(event) {
        event.target.setCustomValidity("");
    };

    FormText.prototype._cacheElements = function(wrapper) {
        this._elements = {};
        this._elements.self = wrapper;
        var hooks = this._elements.self.querySelectorAll("[data-" + NS + "-hook-" + IS_DASH + "]");
        for (var i = 0; i < hooks.length; i++) {
            var hook = hooks[i];
            var capitalized = IS;
            capitalized = capitalized.charAt(0).toUpperCase() + capitalized.slice(1);
            var key = hook.dataset[NS + "Hook" + capitalized];
            this._elements[key] = hook;
        }
    };

    FormText.prototype._setupProperties = function(options) {
        this._properties = {};

        for (var key in properties) {
            if (properties.hasOwnProperty(key)) {
                var property = properties[key];
                if (options && options[key] != null) {
                    if (property && typeof property.transform === "function") {
                        this._properties[key] = property.transform(options[key]);
                    } else {
                        this._properties[key] = options[key];
                    }
                } else {
                    this._properties[key] = properties[key]["default"];
                }
            }
        }
    };

    function onDocumentReady() {
        var elements = document.querySelectorAll(selectors.self);
        for (var i = 0; i < elements.length; i++) {
            new FormText({ element: elements[i], options: readData(elements[i]) });
        }

        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var body = document.querySelector("body");
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // needed for IE
                var nodesArray = [].slice.call(mutation.addedNodes);
                if (nodesArray.length > 0) {
                    nodesArray.forEach(function(addedNode) {
                        if (addedNode.querySelectorAll) {
                            var elementsArray = [].slice.call(addedNode.querySelectorAll(selectors.self));
                            elementsArray.forEach(function(element) {
                                new FormText({ element: element, options: readData(element) });
                            });
                        }
                    });
                }
            });
        });

        observer.observe(body, {
            subtree: true,
            childList: true,
            characterData: true
        });
    }

    if (document.readyState !== "loading") {
        onDocumentReady();
    } else {
        document.addEventListener("DOMContentLoaded", onDocumentReady);
    }

})();

window.addEventListener("load", function() {
  if(window.perfTrackerExtEnabled) {
    if (window.isValidLcp) {
      try {
        const navTiming = getNavTiming();
        var telemetryInitializer = function (envelope) {
          envelope.data.timing = navTiming.timing;
          envelope.data.navigation = navTiming.navigation;
          window.fcpEntry.lcp = window.lcpEntry.renderTime || window.lcpEntry.loadTime;
          envelope.data.paint = window.fcpEntry;
          window.lcpEntry.resourceTimings  = window.resourceTimings.map(entry => {
            return {
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              responseStart: entry.responseStart,
              responseEnd: entry.responseEnd
            };
          });
          envelope.data.paint.lcpEntry = window.lcpEntry;
          envelope.data["bStore"] = findCookieValue('bStore');
        };
        window.telemetry.webAnalyticsPlugin.addTelemetryInitializer(telemetryInitializer);
      }
      catch (e){}
    }
  }
  else if (window.isFeatureEnabled("perf-tracker-1ds")) {   
    if (window.performance.toJSON === undefined) {
      console.log("Performance telemetry was not found");
    } else {
        const navTiming = getNavTiming();
        try {
          let lcp;
          let fcp = window.performance.getEntriesByName('first-contentful-paint')[0].toJSON();
            const po = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            lcp = lastEntry.renderTime || lastEntry.loadTime;
            fcp['lcp'] = lcp;
            var telemetryInitializer = function (envelope) {
              envelope.data.timing = navTiming.timing;
              envelope.data.navigation = navTiming.navigation;
              envelope.data.paint = fcp;
              envelope.data["bStore"] = findCookieValue('bStore');
            };
            window.telemetry.webAnalyticsPlugin.addTelemetryInitializer(telemetryInitializer);
           });
          po.observe({type: 'largest-contentful-paint', buffered: true});      
      }
      catch (e){}   
    }
  }
});

const getNavTiming = () => {
  if (window.performance.toJSON ) {
    var json;
    var stringifiedJson;
    json = window.performance.toJSON();
    stringifiedJson = JSON.stringify(json);
    var perf = JSON.parse(stringifiedJson);
    return {
      timing: perf.timing, 
      navigation: perf.navigation
    }
  } else {
    return {
      timing: null,
      navigation: null
    }
  }
}

const findCookieValue = (cname) => {
  if (!document.cookie) return '';
  const cookieString = document.cookie.split('; ').find(c => c.startsWith(cname));
  if (cookieString) return cookieString.split('=')[1];
  else return '';
}
$(document).ready(function() {
    $('[clickgroup-telemetry-enabled]').each(function() {
        var anchorCount = $(this).find('a').length;
        if (anchorCount === 1) {
          $(this).css('cursor', 'pointer');
        }
     });

    $('[clickgroup-telemetry-enabled]').click(function(e) {
        if ($(e.target).closest('a').length) {
        // Code to execute when the anchor tag is clicked
            let currentElement = $(e.target).closest('a');
            if ( currentElement && currentElement.html()) {
                currentElement.data( "telemetry", true );
                captureTelemetryPageAction.call(this, currentElement.data());
            }
        }

        if (!$(e.target).closest('a').length) {
        // Code to execute when the div (excluding the anchor tags) is clicked
            let currentElement = retrieveCurrentElement(e);
            if ( currentElement && currentElement.html()) {
//              let linkGroup = currentElement.find("a") || currentElement.find(".link-group");
                let linkGroup = currentElement.find("a");
                var anchorCount = linkGroup.length;
                // Redirect if there is only one anchor tag
                if (anchorCount === 1) {
                  let card = currentElement.find(".card");
                  let linkDataSet = linkGroup[0].dataset;
                  if (card.length>0 && card[0].dataset && card[0].dataset.hasOwnProperty("biCompnm")) {
                      linkDataSet = card[0].dataset;
                  }

                  currentElement.data( "telemetry", true );
                  captureTelemetryPageAction.call(this, linkDataSet);
                  // Get the href of the first anchor tag inside the div
                  var anchorHref = linkGroup[0].getAttribute('href');
                  var target = linkGroup[0].getAttribute('target');
                  // Redirect the page to the same path as the anchor's href if target is not _blank
                  window.open(anchorHref, target);
                }
            }
        }

        function captureTelemetryPageAction(linkDataSet) {
            let content = {};
            this.isCapturePageActionLoadedh = function () {
                return window.telemetry && window.telemetry.webAnalyticsPlugin && window.telemetry.webAnalyticsPlugin.capturePageAction;
            };
            if (this.isCapturePageActionLoadedh()) {
                content.cN = linkDataSet.biCn;
                content.cT = linkDataSet.biCt;
                content.ecn = linkDataSet.biEcn;
                content.ehn = linkDataSet.biEhn;
                content.pa = linkDataSet.biPa;
                content.hn = linkDataSet.biHn;
                content.compnm = linkDataSet.biCompnm;
                content.assetid = linkDataSet.biAssetid;
                content.carpos = linkDataSet.biCarpos;
                window.telemetry.webAnalyticsPlugin.capturePageAction(null, {
                    behavior: linkDataSet.biBhvr,
                    targetUri: linkDataSet.targetUri,
                    content: content
                });
            }
        }

        function retrieveCurrentElement(e) {
            if ($(e.target).closest("[clickgroup-telemetry-enabled]").html()) {
                let currentElement = $(e.target).closest("[clickgroup-telemetry-enabled]");
                return currentElement;
            }
        }
    });
});
var msftModalManager = (function() 
{
    var topBodyElement;

    function intialize() {
        topBodyElement = document.querySelector('#modalsRenderedAfterPageLoad');
    }

    function setupListeners() {

        function setVisibility(isVisible) {
            $(topBodyElement)
                .siblings()
                .toArray()
                .filter(function (sibling) {
                    return sibling.tagName !== 'SCRIPT' && sibling.tagName !== 'META';
                })
                .forEach(function (sibling) {
                    if (isVisible) {
                        sibling.setAttribute('aria-hidden', true);
                    } else {
                        sibling.removeAttribute('aria-hidden');
                    }  
                });
        }

        $('.modal.renderModalOnPageLoad').on('onShow', function(e) {
            //console.log('modal shown:', e.target.id);
            setVisibility(true);     
        });

        $('.modal.renderModalOnPageLoad').on('onHide', function(e) {
            //console.log('modal hidden', e.target.id);
            setVisibility(false);      
        });
    }

    function prependModalsToTopOfBody() {

        // modals that are rendered after page load (not after the result of some other trigger, like a button click) 
        // need to be moved to the top of the DOM, for accessibility

        document.querySelectorAll('.renderModalOnPageLoad').forEach(function (modal) {
            topBodyElement.appendChild(modal);
        });
    }

    function renderModalsInSequence() {

        msGeoSelector.shouldRender().then(function(geoSelectorShouldRender) {

            if (geoSelectorShouldRender) {
                msGeoSelector.render();

                msftEmailModal.shouldRender() && $(document).on(msGeoSelector.CLOSED_EVENT, function (e) {
                    msftEmailModal.render();
                });

            } else {
                msftEmailModal.shouldRender() && msftEmailModal.render();
            }
        }).catch(function() {
            msftEmailModal.shouldRender() && msftEmailModal.render();
        });
    }

    function renderModals() {
        intialize();
        setupListeners();
        prependModalsToTopOfBody();
        renderModalsInSequence();
    }

    $(document).ready(function () {
        renderModals();
    });
}());

(()=>{var e=function(){var e="notFetched",n=!1,t=0,o=[];function r(){return!!window.MsOnePlayer}function i(){return $.when(new Promise((function(e,n){!function n(){if(r())return e();setTimeout(n,200)}()})))}return{fetchScript:function(){return r()?$.when():"fetching"===e?i():((c=document.querySelectorAll(".aem-inline-video-component")).forEach((function(e){var r=new MutationObserver((function(e){!function(e,r){n||(e.forEach((function(e){e.addedNodes.forEach((function(e){var n=e;if(n.classList&&n.classList.contains("c-video-player")){t++;var o=n.closest(".video-modal");o&&new mwf.Modal({el:o})}}))})),t===r&&($('link[href*="oneplayer.css"]').remove(),n=!0,o.forEach((function(e){e.disconnect()}))))}(e,c.length)}));r.observe(e,{childList:!0,subtree:!0}),o.push(r)})),e="fetching",$.getScript("https://www.microsoft.com/videoplayer/js/oneplayer.js").then((function(){return e="fetched",i()})));var c}}}();window.msftOnePlayerVideo=e})();
$(function() {

    /*
    mwf.Modal finds tabbable elements on init (bundle.js line 9602). Since video
    is not guaranteed to be rendered when mwf.Modal is initialized, video
    buttons aren't recognized as tabbable elements and users will not be able
    to tab through. We have to disable autoinit and manually re-init once the
    videos have rendered.
    */

    $('.pause-onhide').on('onHide', function() {
        $(this).find('video').each(function() {
            this.pause();
        });
    });

});
$(function() {

    function a11yClick(event){
        var code = event.charCode || event.keyCode;
        if((code === 32)|| (code === 13)){
            return true;
        }
        return false;
    }

    $(".video-trigger").on('keypress', function(event){
        if(a11yClick(event)){
            this.click();
        }
    });

});
!function(){var t={165:function(){$((function(){"use strict";var t=$("#emailSup-modal");if(0!==t.length){var e=t.find(".countryList"),n=e.attr("data-attribute-lang");if(n){var r=n.split("-"),o=r[r.length-1],i=e.find("option[selected]");o!==i.attr("value")&&0!==e.find($("option[value=".concat(o,"]"))).length&&(i.removeAttr("selected"),e.find($("option[value=".concat(o,"]"))).attr("selected",""))}}}))}},e={};function n(r){if(e[r])return e[r].exports;var o=e[r]={exports:{}};return t[r](o,o.exports,n),o.exports}n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,{a:e}),e},n.d=function(t,e){for(var r in e)n.o(e,r)&&!n.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:e[r]})},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},function(){"use strict";n(165)}()}();
var msftEmailModal = (function() {    

    var emailModalSelector = '#emailSignupForm';
    var today = new Date();

    function modalExists() {

        var emailForm = document.querySelector(emailModalSelector);
        return !!emailForm;
    }

    function shouldRender() {

        if (!modalExists()) {
            return false;
        }
    
        var oldDate = localStorage.lastEmailSupPop ? new Date(localStorage.lastEmailSupPop) : today;
        oldDate.setMonth(oldDate.getMonth() + 1);

        return oldDate <= today;
    }

    function render() {

        localStorage.lastEmailSupPop = today;
        setupHandlers();

        var modalElement = document.querySelector('#emailSup-modal');

        var formValidation = new mwf.FormValidation({
            el: document.querySelector(emailModalSelector),
            preventFormSubmission: true,
        });

        formValidation.el.addEventListener('onValid', function (e) {
                
            $('.emailSup-swapContent').toggle();
            $('#emailSup-modal').focus();
            
            var url = $(modalElement).data("emailsupSelectorEndpoint");
            
            var data = {
                email: $('.userEmail').val(),
                country: $('.countryList').val(),
                culture: navigator.language
            }
            
            $.post(url, data).fail(function(xhr, status, error) {
                localStorage.removeItem('lastEmailSupPop');
            });
        });

        var options = {};

        if (mwf.version) { // starting with mwf version 1.0, this property indicates its version number
            options.el = modalElement;            
        } else {
            options.modal = modalElement;
        }

        var modal = new mwf.Modal(options);
        modal.show();
    }

    function setupHandlers() {

        $('.countryList').change(function () {

            var country = $('.countryList').val();
            var $consentNotCanada = $('#consentNotCanada');
            var $consentCanada = $('#consentCanada');
    
            if (country == "CA") {
                $consentCanada.show();
                $consentNotCanada.hide();
                $consentCanada.attr("aria-hidden", "false");
                $consentNotCanada.attr("aria-hidden", "true");
            } else {            
                $consentCanada.hide();
                $consentNotCanada.show();
                $consentCanada.attr("aria-hidden", "true");
                $consentNotCanada.attr("aria-hidden", "false");
            }        
        });
    }

    return {
        shouldRender: shouldRender,
        render: render
    }
}());
$(document).ready(function() {
    "use strict";
    var emailContainer = $(".modal-header .emailSup-swapContent");
    if (typeof emailContainer !== 'undefined' && emailContainer) {
        var headerElement = emailContainer.first().find(":header");
        var buttonItem = document.querySelector(".emailSup-swapContent button.form-group");
        if (typeof buttonItem !== 'undefined' && buttonItem) {
            buttonItem.dataset.biHn = headerElement.text().trim();
            buttonItem.dataset.biEhn = headerElement.text().trim();
            buttonItem.dataset.biCompnm = "Modal: Default"
        }
    }
    if($(".countryList").find("option[selected]").attr("value") == "CA"){
		$("#consentNotCanada").css("display","none");
		$("#consentCanada").css("display","block");
	}
	else{
		$("#consentCanada").css("display","none");
		$("#consentNotCanada").css("display","block");
	}
});
var msGeoSelector = (function() {
    "use strict";

    var LOCALE_COOKIE_KEY = "mslocale",
        LOCALE_REGION_INDEX = 1,
        LOCALE_LANGUAGE_INDEX = 0,
        GEOSELECTOR_ID = "geo-selector-modal",
        CLOSED_EVENT = "ms.geoselector.closed";

    var GEOSELECTOR_CSS_SELECTOR = '#' + GEOSELECTOR_ID;
    var currentLocale, preferredLocale, preferredAkamaiRegion, currentNonStandardLocale, preferredNonStandardLocale;

    function notifyModalDone() {
        setTimeout(function() {
            $(document).trigger(CLOSED_EVENT);
        }, 3000);
    }

    function checkGoogleBot(){
        var botAgentNames = ['googlebot']; // Googlebot user agent will also block all Google's other user agents.
        var isGoogleBot = false;
        if (navigator != null) {
            var userAgent = navigator.userAgent;
            if (userAgent && userAgent.includes(botAgentNames[0])){
                isGoogleBot = true
            }
        }
        return isGoogleBot;
    }

    function render() {
        var geoSelectorEndPoint = $(GEOSELECTOR_CSS_SELECTOR).data("geoSelectorEndpoint");
        var geoSelectorCFPath = $(GEOSELECTOR_CSS_SELECTOR).data("geoSelectorCfpath");
        var params;
        if (typeof(preferredLocale) !== "undefined" && preferredLocale) {
            params = {
                preferredRegion: preferredLocale.region,
                preferredLanguage: preferredLocale.language,
                preferredNonStandardLocaleCode: preferredNonStandardLocale ? preferredNonStandardLocale.localeCode : undefined,
                currentRegion: currentLocale.region,
                currentLanguage: currentLocale.language,
                currentNonStandardLocaleCode: currentNonStandardLocale ? currentNonStandardLocale.localeCode : undefined,
                cfPath: geoSelectorCFPath,
                supportNonstandardLocales: window.isFeatureEnabled("support-unsupported-locales")
            }
        } else {
            params = {
                currentRegion: currentLocale.region,
                currentLanguage: currentLocale.language,
                preferredAkamaiRegion: preferredAkamaiRegion,
                currentNonStandardLocaleCode: currentNonStandardLocale ? currentNonStandardLocale.localeCode : undefined,
                cfPath: geoSelectorCFPath,
                supportNonstandardLocales: window.isFeatureEnabled("support-unsupported-locales")
            }
        }

        $.get(geoSelectorEndPoint, params)
            .done(function(data) {
                processDataResponse(data);
            }).fail(function() {
                notifyModalDone();
            });
    }

    function processDataResponse(data) {

        try {
            if (!data || checkGoogleBot()) {
                notifyModalDone();
                return;
            }
            if(typeof(preferredLocale) == "undefined"){
                preferredLocale = {
                    language: data.language,
                    region: data.country,
                    localeCode: data.language + '-' + data.country
                };
            }

            $(".preferred-redirect-confirm")
                .html(data.marketRedirectConfirm)
                .attr("lang", data.language)
                .attr("hreflang", data.language)
                .attr("dir", data.dir);

            $(".preferred-redirect-reject")
                .html(data.marketRedirectReject)
                .attr("lang", data.language)
                .attr("dir", data.dir);

            $(".preferred-redirect-text")
                .html(data.marketRedirectText)
                .attr("lang", data.language)
                .attr("dir", data.dir);

            $(".preferred-redirect-heading")
                .html(data.marketRedirectHeading)
                .attr("lang", data.language)
                .attr("dir", data.dir);

            $(".preferred-redirect-translate")
                .html(data.marketRedirectTranslate)
                .attr("lang", data.language)
                .attr("dir", data.dir);

            $(".preferred-redirect-cancel")
                .attr("aria-label", data.marketRedirectCancel)
                .attr("lang", data.language)
                .attr("dir", data.dir);

            $(".redirect-text").each(function() {
                var redirectText = getCountryLanguageReplacedString($(this).text(), data.primaryCountry);
                $(this).html(redirectText);
            });

            $(".redirect-heading").each(function() {
                var redirectHeadingText = getCountryLanguageReplacedString($(this).text(), data.secondaryCountry);
                $(this).html(redirectHeadingText);
            });

            $(".redirect-confirm").each(function() {
                var redirectText = getCountryLanguageReplacedString($(this).text(), data.primaryCountry);
                $(this).html(redirectText);

                //JSLL data- attributes on Button
                $(this).attr("data-bi-cN", redirectText.trim());
                $(this).attr("data-bi-ecN", redirectText.trim());
				$(this).attr("data-bi-hN", $(".preferred-redirect-heading").text().trim());
				$(this).attr("data-bi-ehN", $(".preferred-redirect-heading").text().trim());
            });

            $(".redirect-reject").each(function() {
                var redirectHeadingText = getCountryLanguageReplacedString($(this).text(), data.secondaryCountry);
                $(this).html(redirectHeadingText);

                //JSLL data- attributes on Button
                $(this).attr("data-bi-cN", redirectHeadingText.trim());
                $(this).attr("data-bi-ecN", redirectHeadingText.trim());
				$(this).attr("data-bi-hN", $(".preferred-redirect-heading").text().trim());
				$(this).attr("data-bi-ehN", $(".preferred-redirect-heading").text().trim());
            });

            if (currentLocale.language === preferredLocale.language) {
                $(".same-language-hide").hide();
            }
            var geoSelector = document.querySelector(GEOSELECTOR_CSS_SELECTOR);

            geoSelector.addEventListener('onHide', function(e) {
                notifyModalDone();
            });
            var options = {};

            if (mwf.version) { // starting with mwf version 1.0, this property indicates its version number
                options.el = geoSelector;
            } else {
                options.modal = geoSelector;
            }

            var modal = new mwf.Modal(options);

            if (checkGeoSelectorReturnData(data)){
                var redirectURL = window.location.href.replace("/" + (currentNonStandardLocale ? currentNonStandardLocale.localeCode : currentLocale.localeCode), "/" + (preferredNonStandardLocale ? preferredNonStandardLocale.localeCode : preferredLocale.localeCode));
                $.ajax({
                    url: redirectURL,
                    type: "HEAD",
                    error: function(){
                        notifyModalDone();
                    },
                    complete: function(jqXHR) {
                        switch (jqXHR.status) {
                            case 200:
                                modal.show();
                                break;
                            default:
                                notifyModalDone();
                        }
                    }
                });
            }
            else{
                notifyModalDone();
            }


            $('.redirect-reject').click({
                currentLocale: currentLocale,
                currentNonStandardLocale: currentNonStandardLocale
            }, setLocaleToCookie);

            setRedirectConfirm();
        } catch (e) {
            notifyModalDone();
        }
    }

    function checkGeoSelectorReturnData(data) {
        return ((data.marketRedirectConfirm != null && data.marketRedirectConfirm != "") &&
               (data.marketRedirectReject  != null && data.marketRedirectReject != "") &&
               (data.marketRedirectText != null && data.marketRedirectText != "") &&
               (data.marketRedirectHeading != null && data.marketRedirectHeading != "") &&
               (data.marketRedirectTranslate != null && data.marketRedirectTranslate != "" ));
    }


    function getCountryLanguageReplacedString(text, countryLanguage) {
        return text.replace("{0}", countryLanguage);
    }

    function getLocaleFromCookie(localeCookie, isNonStandard) {
        localeCookie = localeCookie.replace(/\|/g, ",");
        localeCookie = localeCookie.replace(/\'/g, "\"");
        var obj = $.parseJSON(localeCookie);
        return isNonStandard ? getLocaleFromCode(obj.v) : getLocaleFromCode(obj.u);
    }

    function setRedirectConfirm() {
        var href = window.location.href.replace("/" + (currentNonStandardLocale ? currentNonStandardLocale.localeCode : currentLocale.localeCode), "/" + (preferredNonStandardLocale ? preferredNonStandardLocale.localeCode : preferredLocale.localeCode));
        $(".redirect-confirm").attr("href", href);
    }

    function setLocaleToCookie(event) {
        var allLocaleStr = "'u':'" + event.data.currentLocale.localeCode + "'";
        if(event.data.currentNonStandardLocale) {
            allLocaleStr += "|'v':'" + event.data.currentNonStandardLocale.localeCode + "'";
        }
        var msLocale = "{'r':'1'|" + allLocaleStr + "}";
        var hostname = location.hostname;
        var domain = hostname.substring(hostname.indexOf('.'), hostname.length);
        $.cookie.raw = true;
        $.cookie('mslocale', msLocale, {
            expires: 45,
            domain: domain,
            path: '/'
        });
    }

    function getLocaleFromCode(localeCode) {
        if(localeCode) {
            var localeSplit = localeCode.split("-");
            if (localeSplit.length >= LOCALE_REGION_INDEX) {
                return {
                    language: localeSplit[LOCALE_LANGUAGE_INDEX].toLowerCase(),
                    region: localeSplit[localeSplit.length - 1].toLowerCase(),
                    localeCode: localeCode.toLowerCase()
                };
            }
        }
    }

    function geoSelectorComponentExists($geoSelector) {
        return $geoSelector.length && $geoSelector.length > 0;
    }

    function cookieLocalesAreSame(localeCookie, $geoSelector) {

        var currentLocaleCode =  $geoSelector.data("currentLocaleCode");
        var currentNonStandardLocaleCode = $geoSelector.data("currentNonStandardLocaleCode");
        var preferredLocaleFromCookie = getLocaleFromCookie(localeCookie, false);
        var preferredNonStandardLocaleFromCookie = getLocaleFromCookie(localeCookie, true);
        var currentLocaleFromCode = getLocaleFromCode(currentLocaleCode, false);
        var currentNonStandardLocalefromCode = getLocaleFromCode(currentNonStandardLocaleCode, true);

        if(preferredNonStandardLocaleFromCookie && currentLocaleFromCode && currentLocaleFromCode.region === preferredNonStandardLocaleFromCookie.region) {
            return true;
        } else if (preferredLocaleFromCookie && currentNonStandardLocalefromCode && preferredLocaleFromCookie.region === currentNonStandardLocalefromCode.region) {
            return true;
        } else if (preferredNonStandardLocaleFromCookie && currentNonStandardLocalefromCode && preferredNonStandardLocaleFromCookie.region === currentNonStandardLocalefromCode.region) {
            return true;
        } else if (preferredLocaleFromCookie && currentLocaleFromCode && !preferredNonStandardLocaleFromCookie && !currentNonStandardLocalefromCode && preferredLocaleFromCookie.region === currentLocaleFromCode.region) {
            return true;
        }

        preferredLocale = preferredLocaleFromCookie;
        preferredNonStandardLocale = preferredNonStandardLocaleFromCookie;
        currentLocale = currentLocaleFromCode;
        currentNonStandardLocale = currentNonStandardLocalefromCode;

        return false;
    }

    function akamaiLocalesDiffer($geoSelector) {
        var geoInfo = $('.geo-info').data();
        if(geoInfo && geoInfo.country_code){
            preferredAkamaiRegion = geoInfo.country_code.toLowerCase();
            var currentLocaleCode = $geoSelector.data("currentLocaleCode");
            var currentNonStandardLocaleCode = $geoSelector.data("currentNonStandardLocaleCode");
            currentLocale = getLocaleFromCode(currentLocaleCode);
            currentNonStandardLocale = getLocaleFromCode(currentNonStandardLocaleCode);
            if (currentNonStandardLocale && preferredAkamaiRegion) {
                return Promise.resolve(currentNonStandardLocale.region !== preferredAkamaiRegion);
            } else if (currentLocale && preferredAkamaiRegion) {
                return Promise.resolve(currentLocale.region !== preferredAkamaiRegion);
            }
        }
        return Promise.resolve(true);
    }

    function shouldRender() {
        var $geoSelector = $(GEOSELECTOR_CSS_SELECTOR);

        if (!geoSelectorComponentExists($geoSelector)) {
            return Promise.resolve(false);
        }

        var localeCookie = $.cookie(LOCALE_COOKIE_KEY);
        var localeCookieExists = localeCookie !== undefined;

        if (localeCookieExists) {
            var shouldRenderBasedOffLocaleCookie = !cookieLocalesAreSame(localeCookie, $geoSelector);
            return Promise.resolve(shouldRenderBasedOffLocaleCookie);
        }

        return akamaiLocalesDiffer($geoSelector);
    }

    return {
        shouldRender: shouldRender,
        render: render,
        CLOSED_EVENT: CLOSED_EVENT
    }
}());
$( document ).ready(function() {
	"use strict";
	document.querySelectorAll("div.content-placement-item .link-group > a").forEach(function(item){
        // Find the closest content-placement-item
        var contentPlacementItem = item.closest(".content-placement-item");

        if (typeof contentPlacementItem !== 'undefined' && contentPlacementItem) {
            // assign to data-bi-ehn attribute
            item.dataset.biEhn = contentPlacementItem.querySelector("h1, h2, h3, h4, h5, h6").textContent;

            // assign to data-bi-hn attribute
            item.dataset.biHn = contentPlacementItem.querySelector("h1, h2, h3, h4, h5, h6").textContent;

            // Read the Component name and assign to data-bi-compname attribute
            item.dataset.biCompname = contentPlacementItem.getAttribute("data-content-placement-style");

            // Read the Heading text of that content placement item and assign to data-bi-hn attribute
            var jsllImage = contentPlacementItem.querySelector("img").src;
            if (typeof jsllImage !== 'undefined' && jsllImage) {
                item.dataset.biAssetid = jsllImage;
            }
        }
    });
});
(function() {
    "use strict";

    var $uhfSkipToMain = $("#uhfSkipToMain");
    var $acomHeaderSkipToMain = $(".azure-skip-nav");
    var href = "";
    if($uhfSkipToMain.length) {
        href = $uhfSkipToMain.data("href");
        href = href && href.replace("#", "") || "mainContent";
    } else if($acomHeaderSkipToMain.length) {
        href = $acomHeaderSkipToMain[0].getAttribute("href");
        href = href && href.replace("#", "") || "main";
    }

    $('.microsoft-template-layout-container').attr("id", href);
})();
/*! lazysizes - v5.3.2 */

!function(e){var t=function(u,D,f){"use strict";var k,H;if(function(){var e;var t={lazyClass:"lazyload",loadedClass:"lazyloaded",loadingClass:"lazyloading",preloadClass:"lazypreload",errorClass:"lazyerror",autosizesClass:"lazyautosizes",fastLoadedClass:"ls-is-cached",iframeLoadMode:0,srcAttr:"data-src",srcsetAttr:"data-srcset",sizesAttr:"data-sizes",minSize:40,customMedia:{},init:true,expFactor:1.5,hFac:.8,loadMode:2,loadHidden:true,ricTimeout:0,throttleDelay:125};H=u.lazySizesConfig||u.lazysizesConfig||{};for(e in t){if(!(e in H)){H[e]=t[e]}}}(),!D||!D.getElementsByClassName){return{init:function(){},cfg:H,noSupport:true}}var O=D.documentElement,i=u.HTMLPictureElement,P="addEventListener",$="getAttribute",q=u[P].bind(u),I=u.setTimeout,U=u.requestAnimationFrame||I,o=u.requestIdleCallback,j=/^picture$/i,r=["load","error","lazyincluded","_lazyloaded"],a={},G=Array.prototype.forEach,J=function(e,t){if(!a[t]){a[t]=new RegExp("(\\s|^)"+t+"(\\s|$)")}return a[t].test(e[$]("class")||"")&&a[t]},K=function(e,t){if(!J(e,t)){e.setAttribute("class",(e[$]("class")||"").trim()+" "+t)}},Q=function(e,t){var a;if(a=J(e,t)){e.setAttribute("class",(e[$]("class")||"").replace(a," "))}},V=function(t,a,e){var i=e?P:"removeEventListener";if(e){V(t,a)}r.forEach(function(e){t[i](e,a)})},X=function(e,t,a,i,r){var n=D.createEvent("Event");if(!a){a={}}a.instance=k;n.initEvent(t,!i,!r);n.detail=a;e.dispatchEvent(n);return n},Y=function(e,t){var a;if(!i&&(a=u.picturefill||H.pf)){if(t&&t.src&&!e[$]("srcset")){e.setAttribute("srcset",t.src)}a({reevaluate:true,elements:[e]})}else if(t&&t.src){e.src=t.src}},Z=function(e,t){return(getComputedStyle(e,null)||{})[t]},s=function(e,t,a){a=a||e.offsetWidth;while(a<H.minSize&&t&&!e._lazysizesWidth){a=t.offsetWidth;t=t.parentNode}return a},ee=function(){var a,i;var t=[];var r=[];var n=t;var s=function(){var e=n;n=t.length?r:t;a=true;i=false;while(e.length){e.shift()()}a=false};var e=function(e,t){if(a&&!t){e.apply(this,arguments)}else{n.push(e);if(!i){i=true;(D.hidden?I:U)(s)}}};e._lsFlush=s;return e}(),te=function(a,e){return e?function(){ee(a)}:function(){var e=this;var t=arguments;ee(function(){a.apply(e,t)})}},ae=function(e){var a;var i=0;var r=H.throttleDelay;var n=H.ricTimeout;var t=function(){a=false;i=f.now();e()};var s=o&&n>49?function(){o(t,{timeout:n});if(n!==H.ricTimeout){n=H.ricTimeout}}:te(function(){I(t)},true);return function(e){var t;if(e=e===true){n=33}if(a){return}a=true;t=r-(f.now()-i);if(t<0){t=0}if(e||t<9){s()}else{I(s,t)}}},ie=function(e){var t,a;var i=99;var r=function(){t=null;e()};var n=function(){var e=f.now()-a;if(e<i){I(n,i-e)}else{(o||r)(r)}};return function(){a=f.now();if(!t){t=I(n,i)}}},e=function(){var v,m,c,h,e;var y,z,g,p,C,b,A;var n=/^img$/i;var d=/^iframe$/i;var E="onscroll"in u&&!/(gle|ing)bot/.test(navigator.userAgent);var _=0;var w=0;var M=0;var N=-1;var L=function(e){M--;if(!e||M<0||!e.target){M=0}};var x=function(e){if(A==null){A=Z(D.body,"visibility")=="hidden"}return A||!(Z(e.parentNode,"visibility")=="hidden"&&Z(e,"visibility")=="hidden")};var W=function(e,t){var a;var i=e;var r=x(e);g-=t;b+=t;p-=t;C+=t;while(r&&(i=i.offsetParent)&&i!=D.body&&i!=O){r=(Z(i,"opacity")||1)>0;if(r&&Z(i,"overflow")!="visible"){a=i.getBoundingClientRect();r=C>a.left&&p<a.right&&b>a.top-1&&g<a.bottom+1}}return r};var t=function(){var e,t,a,i,r,n,s,o,l,u,f,c;var d=k.elements;if((h=H.loadMode)&&M<8&&(e=d.length)){t=0;N++;for(;t<e;t++){if(!d[t]||d[t]._lazyRace){continue}if(!E||k.prematureUnveil&&k.prematureUnveil(d[t])){R(d[t]);continue}if(!(o=d[t][$]("data-expand"))||!(n=o*1)){n=w}if(!u){u=!H.expand||H.expand<1?O.clientHeight>500&&O.clientWidth>500?500:370:H.expand;k._defEx=u;f=u*H.expFactor;c=H.hFac;A=null;if(w<f&&M<1&&N>2&&h>2&&!D.hidden){w=f;N=0}else if(h>1&&N>1&&M<6){w=u}else{w=_}}if(l!==n){y=innerWidth+n*c;z=innerHeight+n;s=n*-1;l=n}a=d[t].getBoundingClientRect();if((b=a.bottom)>=s&&(g=a.top)<=z&&(C=a.right)>=s*c&&(p=a.left)<=y&&(b||C||p||g)&&(H.loadHidden||x(d[t]))&&(m&&M<3&&!o&&(h<3||N<4)||W(d[t],n))){R(d[t]);r=true;if(M>9){break}}else if(!r&&m&&!i&&M<4&&N<4&&h>2&&(v[0]||H.preloadAfterLoad)&&(v[0]||!o&&(b||C||p||g||d[t][$](H.sizesAttr)!="auto"))){i=v[0]||d[t]}}if(i&&!r){R(i)}}};var a=ae(t);var S=function(e){var t=e.target;if(t._lazyCache){delete t._lazyCache;return}L(e);K(t,H.loadedClass);Q(t,H.loadingClass);V(t,B);X(t,"lazyloaded")};var i=te(S);var B=function(e){i({target:e.target})};var T=function(e,t){var a=e.getAttribute("data-load-mode")||H.iframeLoadMode;if(a==0){e.contentWindow.location.replace(t)}else if(a==1){e.src=t}};var F=function(e){var t;var a=e[$](H.srcsetAttr);if(t=H.customMedia[e[$]("data-media")||e[$]("media")]){e.setAttribute("media",t)}if(a){e.setAttribute("srcset",a)}};var s=te(function(t,e,a,i,r){var n,s,o,l,u,f;if(!(u=X(t,"lazybeforeunveil",e)).defaultPrevented){if(i){if(a){K(t,H.autosizesClass)}else{t.setAttribute("sizes",i)}}s=t[$](H.srcsetAttr);n=t[$](H.srcAttr);if(r){o=t.parentNode;l=o&&j.test(o.nodeName||"")}f=e.firesLoad||"src"in t&&(s||n||l);u={target:t};K(t,H.loadingClass);if(f){clearTimeout(c);c=I(L,2500);V(t,B,true)}if(l){G.call(o.getElementsByTagName("source"),F)}if(s){t.setAttribute("srcset",s)}else if(n&&!l){if(d.test(t.nodeName)){T(t,n)}else{t.src=n}}if(r&&(s||l)){Y(t,{src:n})}}if(t._lazyRace){delete t._lazyRace}Q(t,H.lazyClass);ee(function(){var e=t.complete&&t.naturalWidth>1;if(!f||e){if(e){K(t,H.fastLoadedClass)}S(u);t._lazyCache=true;I(function(){if("_lazyCache"in t){delete t._lazyCache}},9)}if(t.loading=="lazy"){M--}},true)});var R=function(e){if(e._lazyRace){return}var t;var a=n.test(e.nodeName);var i=a&&(e[$](H.sizesAttr)||e[$]("sizes"));var r=i=="auto";if((r||!m)&&a&&(e[$]("src")||e.srcset)&&!e.complete&&!J(e,H.errorClass)&&J(e,H.lazyClass)){return}t=X(e,"lazyunveilread").detail;if(r){re.updateElem(e,true,e.offsetWidth)}e._lazyRace=true;M++;s(e,t,r,i,a)};var r=ie(function(){H.loadMode=3;a()});var o=function(){if(H.loadMode==3){H.loadMode=2}r()};var l=function(){if(m){return}if(f.now()-e<999){I(l,999);return}m=true;H.loadMode=3;a();q("scroll",o,true)};return{_:function(){e=f.now();k.elements=D.getElementsByClassName(H.lazyClass);v=D.getElementsByClassName(H.lazyClass+" "+H.preloadClass);q("scroll",a,true);q("resize",a,true);q("pageshow",function(e){if(e.persisted){var t=D.querySelectorAll("."+H.loadingClass);if(t.length&&t.forEach){U(function(){t.forEach(function(e){if(e.complete){R(e)}})})}}});if(u.MutationObserver){new MutationObserver(a).observe(O,{childList:true,subtree:true,attributes:true})}else{O[P]("DOMNodeInserted",a,true);O[P]("DOMAttrModified",a,true);setInterval(a,999)}q("hashchange",a,true);["focus","mouseover","click","load","transitionend","animationend"].forEach(function(e){D[P](e,a,true)});if(/d$|^c/.test(D.readyState)){l()}else{q("load",l);D[P]("DOMContentLoaded",a);I(l,2e4)}if(k.elements.length){t();ee._lsFlush()}else{a()}},checkElems:a,unveil:R,_aLSL:o}}(),re=function(){var a;var n=te(function(e,t,a,i){var r,n,s;e._lazysizesWidth=i;i+="px";e.setAttribute("sizes",i);if(j.test(t.nodeName||"")){r=t.getElementsByTagName("source");for(n=0,s=r.length;n<s;n++){r[n].setAttribute("sizes",i)}}if(!a.detail.dataAttr){Y(e,a.detail)}});var i=function(e,t,a){var i;var r=e.parentNode;if(r){a=s(e,r,a);i=X(e,"lazybeforesizes",{width:a,dataAttr:!!t});if(!i.defaultPrevented){a=i.detail.width;if(a&&a!==e._lazysizesWidth){n(e,r,i,a)}}}};var e=function(){var e;var t=a.length;if(t){e=0;for(;e<t;e++){i(a[e])}}};var t=ie(e);return{_:function(){a=D.getElementsByClassName(H.autosizesClass);q("resize",t)},checkElems:t,updateElem:i}}(),t=function(){if(!t.i&&D.getElementsByClassName){t.i=true;re._();e._()}};return I(function(){H.init&&t()}),k={cfg:H,autoSizer:re,loader:e,init:t,uP:Y,aC:K,rC:Q,hC:J,fire:X,gW:s,rAF:ee}}(e,e.document,Date);e.lazySizes=t,"object"==typeof module&&module.exports&&(module.exports=t)}("undefined"!=typeof window?window:{});
window.lazySizesConfig = window.lazySizesConfig || {};

//page is optimized for fast onload event
lazySizesConfig.loadMode = 1;

//load all elements after the window onload event
lazySizesConfig.preloadAfterLoad = true;
$(()=>{
    document.addEventListener('click', (e)=>{
        if (e.target.matches('moray-anchor') || e.target.matches('moray-tab')) {
            window?.telemetry?.webAnalyticsPlugin?.capturePageAction?.(e.target);
        }
    });
  });
/*! For license information please see dynamic-price-bundle.js.LICENSE.txt */
(()=>{var t={800:t=>{var e;self,e=()=>(()=>{"use strict";var t={d:(e,s)=>{for(var i in s)t.o(s,i)&&!t.o(e,i)&&Object.defineProperty(e,i,{enumerable:!0,get:s[i]})},o:(t,e)=>Object.prototype.hasOwnProperty.call(t,e),r:t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}},e={};function s(t,e,s,i){var r,o=arguments.length,n=o<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,s,i);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(n=(o<3?r(n):o>3?r(e,s,n):r(e,s))||n);return o>3&&n&&Object.defineProperty(e,s,n),n}t.r(e),t.d(e,{DynamicPrice:()=>yt}),Object.create,Object.create,"function"==typeof SuppressedError&&SuppressedError;const i=globalThis,r=i.ShadowRoot&&(void 0===i.ShadyCSS||i.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),n=new WeakMap;class a{constructor(t,e,s){if(this._$cssResult$=!0,s!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(r&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&n.set(e,t))}return t}toString(){return this.cssText}}const h=(t,e)=>{if(r)t.adoptedStyleSheets=e.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet));else for(const s of e){const e=document.createElement("style"),r=i.litNonce;void 0!==r&&e.setAttribute("nonce",r),e.textContent=s.cssText,t.appendChild(e)}},l=r?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new a("string"==typeof t?t:t+"",void 0,o))(e)})(t):t,{is:c,defineProperty:p,getOwnPropertyDescriptor:d,getOwnPropertyNames:u,getOwnPropertySymbols:$,getPrototypeOf:f}=Object,_=globalThis,y=_.trustedTypes,g=y?y.emptyScript:"",m=_.reactiveElementPolyfillSupport,A=(t,e)=>t,v={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},b=(t,e)=>!c(t,e),E={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:b};Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;class w extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=E){if(e.state&&(e.attribute=!1),this._$Ei(),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&p(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:r}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get(){return i?.call(this)},set(e){const o=i?.call(this);r.call(this,e),this.requestUpdate(t,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??E}static _$Ei(){if(this.hasOwnProperty(A("elementProperties")))return;const t=f(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(A("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(A("properties"))){const t=this.properties,e=[...u(t),...$(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(l(t))}else void 0!==t&&e.push(l(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$Eg=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$ES(),this.requestUpdate(),this.constructor.l?.forEach((t=>t(this)))}addController(t){(this._$E_??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$E_?.delete(t)}_$ES(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return h(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$E_?.forEach((t=>t.hostConnected?.()))}enableUpdating(t){}disconnectedCallback(){this._$E_?.forEach((t=>t.hostDisconnected?.()))}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$EO(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){const r=(void 0!==s.converter?.toAttribute?s.converter:v).toAttribute(e,s.type);this._$Em=t,null==r?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=s.getPropertyOptions(i),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:v;this._$Em=i,this[i]=r.fromAttribute(e,t.type),this._$Em=null}}requestUpdate(t,e,s,i=!1,r){if(void 0!==t){if(s??=this.constructor.getPropertyOptions(t),!(s.hasChanged??b)(i?r:this[t],e))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$Eg=this._$EP())}C(t,e,s){this._$AL.has(t)||this._$AL.set(t,e),!0===s.reflect&&this._$Em!==t&&(this._$Ej??=new Set).add(t)}async _$EP(){this.isUpdatePending=!0;try{await this._$Eg}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t)!0!==s.wrapped||this._$AL.has(e)||void 0===this[e]||this.C(e,this[e],s)}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$E_?.forEach((t=>t.hostUpdate?.())),this.update(e)):this._$ET()}catch(e){throw t=!1,this._$ET(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$E_?.forEach((t=>t.hostUpdated?.())),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$ET(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$Eg}shouldUpdate(t){return!0}update(t){this._$Ej&&=this._$Ej.forEach((t=>this._$EO(t,this[t]))),this._$ET()}updated(t){}firstUpdated(t){}}w.elementStyles=[],w.shadowRootOptions={mode:"open"},w[A("elementProperties")]=new Map,w[A("finalized")]=new Map,m?.({ReactiveElement:w}),(_.reactiveElementVersions??=[]).push("2.0.2");const S=globalThis,P=S.trustedTypes,C=P?P.createPolicy("lit-html",{createHTML:t=>t}):void 0,x="$lit$",T=`lit$${(Math.random()+"").slice(9)}$`,U="?"+T,O=`<${U}>`,k=document,M=()=>k.createComment(""),R=t=>null===t||"object"!=typeof t&&"function"!=typeof t,H=Array.isArray,N="[ \t\n\f\r]",j=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,D=/-->/g,L=/>/g,I=RegExp(`>|${N}(?:([^\\s"'>=/]+)(${N}*=${N}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,q=/"/g,B=/^(?:script|style|textarea|title)$/i,V=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),W=V(1),F=(V(2),Symbol.for("lit-noChange")),J=Symbol.for("lit-nothing"),K=new WeakMap,Z=k.createTreeWalker(k,129);function G(t,e){if(!Array.isArray(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==C?C.createHTML(e):e}const Q=(t,e)=>{const s=t.length-1,i=[];let r,o=2===e?"<svg>":"",n=j;for(let e=0;e<s;e++){const s=t[e];let a,h,l=-1,c=0;for(;c<s.length&&(n.lastIndex=c,h=n.exec(s),null!==h);)c=n.lastIndex,n===j?"!--"===h[1]?n=D:void 0!==h[1]?n=L:void 0!==h[2]?(B.test(h[2])&&(r=RegExp("</"+h[2],"g")),n=I):void 0!==h[3]&&(n=I):n===I?">"===h[0]?(n=r??j,l=-1):void 0===h[1]?l=-2:(l=n.lastIndex-h[2].length,a=h[1],n=void 0===h[3]?I:'"'===h[3]?q:z):n===q||n===z?n=I:n===D||n===L?n=j:(n=I,r=void 0);const p=n===I&&t[e+1].startsWith("/>")?" ":"";o+=n===j?s+O:l>=0?(i.push(a),s.slice(0,l)+x+s.slice(l)+T+p):s+T+(-2===l?e:p)}return[G(t,o+(t[s]||"<?>")+(2===e?"</svg>":"")),i]};class X{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,o=0;const n=t.length-1,a=this.parts,[h,l]=Q(t,e);if(this.el=X.createElement(h,s),Z.currentNode=this.el.content,2===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=Z.nextNode())&&a.length<n;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(x)){const e=l[o++],s=i.getAttribute(t).split(T),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:n[2],strings:s,ctor:"."===n[1]?it:"?"===n[1]?rt:"@"===n[1]?ot:st}),i.removeAttribute(t)}else t.startsWith(T)&&(a.push({type:6,index:r}),i.removeAttribute(t));if(B.test(i.tagName)){const t=i.textContent.split(T),e=t.length-1;if(e>0){i.textContent=P?P.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],M()),Z.nextNode(),a.push({type:2,index:++r});i.append(t[e],M())}}}else if(8===i.nodeType)if(i.data===U)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=i.data.indexOf(T,t+1));)a.push({type:7,index:r}),t+=T.length-1}r++}}static createElement(t,e){const s=k.createElement("template");return s.innerHTML=t,s}}function Y(t,e,s=t,i){if(e===F)return e;let r=void 0!==i?s._$Co?.[i]:s._$Cl;const o=R(e)?void 0:e._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),void 0===o?r=void 0:(r=new o(t),r._$AT(t,s,i)),void 0!==i?(s._$Co??=[])[i]=r:s._$Cl=r),void 0!==r&&(e=Y(t,r._$AS(t,e.values),r,i)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??k).importNode(e,!0);Z.currentNode=i;let r=Z.nextNode(),o=0,n=0,a=s[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new et(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new nt(r,this,t)),this._$AV.push(e),a=s[++n]}o!==a?.index&&(r=Z.nextNode(),o++)}return Z.currentNode=k,i}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=J,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),R(t)?t===J||null==t||""===t?(this._$AH!==J&&this._$AR(),this._$AH=J):t!==this._$AH&&t!==F&&this._(t):void 0!==t._$litType$?this.g(t):void 0!==t.nodeType?this.$(t):(t=>H(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.T(t):this._(t)}k(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}$(t){this._$AH!==t&&(this._$AR(),this._$AH=this.k(t))}_(t){this._$AH!==J&&R(this._$AH)?this._$AA.nextSibling.data=t:this.$(k.createTextNode(t)),this._$AH=t}g(t){const{values:e,_$litType$:s}=t,i="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=X.createElement(G(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new tt(i,this),s=t.u(this.options);t.p(e),this.$(s),this._$AH=t}}_$AC(t){let e=K.get(t.strings);return void 0===e&&K.set(t.strings,e=new X(t)),e}T(t){H(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const r of t)i===e.length?e.push(s=new et(this.k(M()),this.k(M()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t&&t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class st{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,r){this.type=1,this._$AH=J,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=J}_$AI(t,e=this,s,i){const r=this.strings;let o=!1;if(void 0===r)t=Y(this,t,e,0),o=!R(t)||t!==this._$AH&&t!==F,o&&(this._$AH=t);else{const i=t;let n,a;for(t=r[0],n=0;n<r.length-1;n++)a=Y(this,i[s+n],e,n),a===F&&(a=this._$AH[n]),o||=!R(a)||a!==this._$AH[n],a===J?t=J:t!==J&&(t+=(a??"")+r[n+1]),this._$AH[n]=a}o&&!i&&this.O(t)}O(t){t===J?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class it extends st{constructor(){super(...arguments),this.type=3}O(t){this.element[this.name]=t===J?void 0:t}}class rt extends st{constructor(){super(...arguments),this.type=4}O(t){this.element.toggleAttribute(this.name,!!t&&t!==J)}}class ot extends st{constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}_$AI(t,e=this){if((t=Y(this,t,e,0)??J)===F)return;const s=this._$AH,i=t===J&&s!==J||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==J&&(s===J||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}}const at=S.litHtmlPolyfillSupport;at?.(X,et),(S.litHtmlVersions??=[]).push("3.1.0");class ht extends w{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const i=s?.renderBefore??e;let r=i._$litPart$;if(void 0===r){const t=s?.renderBefore??null;i._$litPart$=r=new et(e.insertBefore(M(),t),t,void 0,s??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return F}}ht._$litElement$=!0,ht.finalized=!0,globalThis.litElementHydrateSupport?.({LitElement:ht});const lt=globalThis.litElementPolyfillSupport;lt?.({LitElement:ht}),(globalThis.litElementVersions??=[]).push("4.0.2");const ct={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:b},pt=(t=ct,e,s)=>{const{kind:i,metadata:r}=s;let o=globalThis.litPropertyMetadata.get(r);if(void 0===o&&globalThis.litPropertyMetadata.set(r,o=new Map),o.set(s.name,t),"accessor"===i){const{name:i}=s;return{set(s){const r=e.get.call(this);e.set.call(this,s),this.requestUpdate(i,r,t)},init(e){return void 0!==e&&this.C(i,void 0,t),e}}}if("setter"===i){const{name:i}=s;return function(s){const r=this[i];e.call(this,s),this.requestUpdate(i,r,t)}}throw Error("Unsupported decorator location: "+i)};function dt(t){return(e,s)=>"object"==typeof s?pt(t,e,s):((t,e,s)=>{const i=e.hasOwnProperty(s);return e.constructor.createProperty(s,i?{...t,wrapped:!0}:t),i?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}const ut=Symbol();class $t{get taskComplete(){return this.t||(1===this.status?this.t=new Promise(((t,e)=>{this.i=t,this.o=e})):3===this.status?this.t=Promise.reject(this.h):this.t=Promise.resolve(this.l)),this.t}constructor(t,e,s){this.u=0,this.status=0,(this.p=t).addController(this);const i="object"==typeof e?e:{task:e,args:s};this._=i.task,this.v=i.args,this.j=i.argsEqual??ft,this.m=i.onComplete,this.g=i.onError,this.autoRun=i.autoRun??!0,"initialValue"in i&&(this.l=i.initialValue,this.status=2,this.k=this.A?.())}hostUpdate(){!0===this.autoRun&&this.O()}hostUpdated(){"afterUpdate"===this.autoRun&&this.O()}A(){if(void 0===this.v)return;const t=this.v();if(!Array.isArray(t))throw Error("The args function must return an array");return t}async O(){const t=this.A(),e=this.k;this.k=t,t===e||void 0===t||void 0!==e&&this.j(e,t)||await this.run(t)}async run(t){let e,s;t??=this.A(),this.k=t,1===this.status?this.T?.abort():(this.t=void 0,this.i=void 0,this.o=void 0),this.status=1,"afterUpdate"===this.autoRun?queueMicrotask((()=>this.p.requestUpdate())):this.p.requestUpdate();const i=++this.u;this.T=new AbortController;let r=!1;try{e=await this._(t,{signal:this.T.signal})}catch(t){r=!0,s=t}if(this.u===i){if(e===ut)this.status=0;else{if(!1===r){try{this.m?.(e)}catch{}this.status=2,this.i?.(e)}else{try{this.g?.(s)}catch{}this.status=3,this.o?.(s)}this.l=e,this.h=s}this.p.requestUpdate()}}abort(t){1===this.status&&this.T?.abort(t)}get value(){return this.l}get error(){return this.h}render(t){switch(this.status){case 0:return t.initial?.();case 1:return t.pending?.();case 2:return t.complete?.(this.value);case 3:return t.error?.(this.error);default:throw Error("Unexpected status: "+this.status)}}}const ft=(t,e)=>t===e||t.length===e.length&&t.every(((t,s)=>!b(t,e[s]))),_t=((t,...e)=>{const s=1===t.length?t[0]:e.reduce(((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1]),t[0]);return new a(s,t,o)})`
  @keyframes blink {
    0% {
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .ellipsis-loading span {
    animation: 1.4s ease 0s infinite normal both running blink;
  }
  .ellipsis-loading span:nth-child(2) {
    animation-delay: 0.2s;
  }
  .ellipsis-loading span:nth-child(3) {
    animation-delay: 0.4s;
  }
  .ellipsis-loading span:nth-child(4) {
    animation-delay: 0.6s;
  }
  .ellipsis-loading span:nth-child(5) {
    animation-delay: 0.8s;
  }
`;let yt=class extends ht{constructor(){super(...arguments),this.pid="",this.sku="",this.isM365="fasle",this.locale="en-us",this.env="prod",this.errorText="Price unavailable",this.productTask=new $t(this,{task:async([t,e,s,i],{signal:r})=>{if(!t)throw new Error("Product id is required");(s=s?.toLowerCase()||document.documentElement.lang?.toLowerCase()||"en-us").length<5&&(s="en-us"),i=i||(location.hostname.includes("www.")||location.hostname.includes("adobeprod")?"prod":"ppe");const o=await fetch(`https://www${"prod"===i?"":"ppe"}.microsoft.com/msstoreapi${"prod"===i?"prod":"ppe"}/api/productCompare?locale=${s}&productIds=${t}&environment=`+("prod"===i?"prod":"ppe")+("false"===e?"":"&isM365Page=true"),{signal:r});if(!o)throw new Error("DynamicPrice fetch no response");if(!o.ok)throw new Error(`DynamicPrice fetch bad response: ${o}`);const n=o.json();if(!n)throw new Error("DynamicPrice fetch: data is empty");return n},args:()=>[this.pid,this.isM365,this.locale,this.env]}),this.extract=t=>{const e=t?.products?.find((t=>t.id===this.pid));if(!e)throw new Error("(Product not found)");const s=this.sku?(e.skuInfo?.[this.sku.toUpperCase()]||e.skuInfo?.[this.sku.toLowerCase()])?.price:Object.values(e.skuInfo||{}).map((t=>t.price)).reduce(((t,e)=>t.currentValue<e.currentValue?t:e));if(!s)throw new Error("(Price not found)");return s?.recurrencePrice||s?.currentPrice||this.errorText}}render(){return this.productTask.render({pending:()=>W`<span class="ellipsis-loading"
          >$<span> • </span><span> • </span><span> • </span><span> • </span
          ><span> • </span><span> • </span></span
        >`,complete:t=>{let e="";try{e=this.extract(t)}catch(t){e=`(${this.errorText})`}return W`${e}`},error:t=>(console.log(t),W`(${this.errorText})`)})}connectedCallback(){super.connectedCallback(),this._getFromHelper()}_getFromHelper(){const t=`${this.pid}-${this.sku}${this.isM365&&"false"!=this.isM365?"-ism365":""}`,e=this.shadowRoot?.host.querySelector(`[data-pid-sku='${t}']`);e&&(this.errorText=e?.errorText||"Price unavailable")}};return yt.styles=_t,s([dt({attribute:"pid"})],yt.prototype,"pid",void 0),s([dt({attribute:"sku"})],yt.prototype,"sku",void 0),s([dt({attribute:"ism365"})],yt.prototype,"isM365",void 0),s([dt({attribute:"locale"})],yt.prototype,"locale",void 0),s([dt({attribute:"env"})],yt.prototype,"env",void 0),s([dt({state:!0,attribute:!1})],yt.prototype,"errorText",void 0),yt=s([(t=>(e,s)=>{void 0!==s?s.addInitializer((()=>{customElements.define(t,e)})):customElements.define(t,e)})("dynamic-price")],yt),e})(),t.exports=e()}},e={};function s(i){var r=e[i];if(void 0!==r)return r.exports;var o=e[i]={exports:{}};return t[i](o,o.exports,s),o.exports}s.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return s.d(e,{a:e}),e},s.d=(t,e)=>{for(var i in e)s.o(e,i)&&!s.o(t,i)&&Object.defineProperty(t,i,{enumerable:!0,get:e[i]})},s.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),(()=>{"use strict";s(800)})()})();
