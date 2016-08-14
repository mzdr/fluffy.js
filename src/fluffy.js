/*! Fluffy.js v2.1.1 | (c) 2016 Sebastian Prein | http://mzdr.github.io/fluffy.js/ */

// using https://github.com/umdjs/umd/blob/master/templates/returnExports.js
(function register(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('Fluffy', factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.Fluffy = factory();

        // in non-module mode we initialize Fluffy automatically,
        // otherwise we would have breaking changes ;)
        switch (document.readyState) {
            case 'loading':
            case 'interactive':
                document.onreadystatechange = function onReadyStateChange() {
                    if (document.readyState == 'complete') {
                        root.Fluffy.detect();
                    }
                };
            break;
            case 'complete':
                root.Fluffy.detect();
            break;
        }
    }
})(this, function Fluffy() {
    'use strict';

    /**
     * Fluffy version.
     *
     * @type {String}
     */
    var version = '2.1.1';

    /**
     * Simple detection of several features needed for Fluffy to run properly.
     *
     * @type {Boolean}
     */
    var featureSupport = !!document.querySelector &&
                         !!window.addEventListener &&
                         !!window.requestAnimationFrame;

    /**
     * Simple detection if we're on a touch device or not. I know, not really
     * reliable.
     *
     * @see http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
     * @type {Boolean}
     */
    var isTouch = 'ontouchstart' in window;

    /**
     * This is the default CSS property used for shifting the Fluffy content.
     * During the automatic initialization there is a routine which checks if
     * it needs to be prefixed.
     *
     * @type {String}
     */
    var shiftProperty = 'transform';

    /**
     * All available smart size attributes.
     *
     * @type {Array}
     */
    var smartSize = [ 'smallest', 'average', 'largest' ];

    /**
     * Defines the maximum decimal places when rounding in calculations.
     *
     * @type {Number}
     */
    var maxDecimalPlaces = 3;

    /**
     * Those are the default settings used by the FluffyObject class.
     *
     * @type {Object}
     */
    var defaults = {

        /**
         * If no trigger selector is given, the Fluffy container is also
         * the trigger area.
         *
         * @type {String}
         */
        triggerSelector: null,

        /**
         * Displays the current position within the scrollable content in
         * forms scrollbars for each dimension.
         *
         * @type {Boolean}
         */
        showScrollbars: true,

        /**
         * Automatically adjust the height of the content container according
         * to the smallest, largest or the average height of all items found.
         *
         * Allowed values: false, 'smallest', 'average', 'largest'.
         *
         * @type {Boolean}
         */
        smartHeight: false,

        /**
         * Automatically adjust the width of the content container according
         * to the smallest, largest or the average width of all items found.
         *
         * Allowed values: false, 'smallest', 'average', 'largest'.
         *
         * @type {Boolean}
         */
        smartWidth: false,

        /**
         * Define which dimension to trigger movement for.
         *
         * Allowed values: 'x', 'y', 'xy'.
         *
         * @type {String}
         */
        triggerDirection: 'x',

        /**
         * The higher the value the more lazier the reaction to the mouse
         * movement will be.
         *
         * @type {Number}
         */
        mouseDamp: 20,

        /**
         * Adds space (in pixel) to the trigger area where no action happens.
         *
         * @type {Number}
         */
        mousePadding: 60
    };

    /**
     * Size of the screen.
     *
     * @type {Object}
     */
    var screenSize = {
        x: window.innerWidth,
        y: window.innerHeight
    };

    /**
     * Fluffy stores all instantiated objects in this variable.
     *
     * @type {Array}
     */
    var fluffyObjects = [];

    /**
     * Just a simple console helper.
     *
     * @private
     * @param {Array|String} messages The message or array of messages.
     * @param {String} type Type of message. Could be 'warn', 'error', 'log' or 'debug' for example.
     * @return {Boolean}
     */
    function _(messages, type) {

        // default console message is of type debug
        type = typeof type !== 'undefined' ? type : 'debug';

        if (!window.console || !console[type]) {
            return true;
        }

        console[type].call(window.console, messages);

        return true;
    }

    /**
     * Registers global listener to the resize event that will handle all
     * instances of Fluffy.
     */
    function _registerResizeListener() {

        // need a debouncer
        var debounce;

        window.addEventListener('resize', function onResize(e) {

            // wait for it
            if (debounce) {
                clearTimeout(debounce);
            }

            debounce = setTimeout(function() {
                for (var i = 0; i < fluffyObjects.length; i++) {
                    fluffyObjects[i].updateContentSize();
                    fluffyObjects[i].updateContentPosition();
                }
            }, 100);
        });
    }

    /**
     * This represents a single Fluffy object.
     *
     * @param {HTMLElement} containerNode A DOM node representing a Fluffy container.
     */
    function FluffyObject(containerNode) {

        /**
         * This holds the Fluffy container.
         *
         * @type {HTMLElement}
         */
        this.container = null;

        /**
         * this holds the actual Fluffy content.
         *
         * @type {HTMLElement}
         */
        this.content = null;

        /**
         * This holds all child nodes of the Fluffy content.
         *
         * @type {NodeList}
         */
        this.items = null;

        /**
         * This holds the (separate) trigger element where the actual
         * interaction between the input device and the Fluffy container
         * happens. If no 'triggerSelector' has been provided the container
         * itself will be used for triggering.
         *
         * @type {HTMLElement}
         */
        this.trigger = null;

        /**
         * This holds the available scrollbars of the Fluffy container.
         *
         * @type {Object}
         */
        this.scrollbars = {};

        /**
         * This holds all relevant information about the mouse position,
         * including the MouseObserver.
         *
         * @type {Object}
         */
        this.mouse = {
            real: { x: 0, y: 0 },
            fake: { x: 0, y: 0 },
            last: { x: 0, y: 0 },
            observer: null
        };

        /**
         * This holds all relevant ratios needed for calculations.
         *
         * @type {Object}
         */
        this.ratios = {};

        /**
         * This holds the default settings as well as the user set settings.
         *
         * @type {Object}
         */
        this.settings = {};

        /**
         * This holds all cached sizes for all relevant DOM nodes.
         *
         * @type {Object}
         */
        this.sizes = {};

        /**
         * Removes text nodes and unneeded DOM elements from the content.
         *
         * @public
         */
        this.cleanContent = function cleanContent() {
            for (var i = 0; i < this.items.length; i++) {
                var current = this.items[i];
                var next = current.nextSibling;
                var prev = current.previousSibling;
                var parent = current.parentNode;

                // remove text nodes
                if (current !== null && current.nodeType === 3) {
                    parent.removeChild(current);
                }

                if (prev !== null && prev.nodeType === 3) {
                    parent.removeChild(prev);
                }

                if (next !== null && next.nodeType === 3) {
                    parent.removeChild(next);
                }
            }
        };

        /**
         * This method will do last preparations like adding scrollbars and
         * setting important CSS styling.
         *
         * @public
         */
        this.prepare = function prepare() {

            // remove invisible DOM nodes and anything that could f*ck up the
            // visual output of this instance
            this.cleanContent();

            // depending on the dimension to trigger the relevant scrollbars
            // will be created and attached to the container
            this.attachScrollbars();

            // get mouse observer instance
            this.mouse.observer = new MouseObserver(this);

            // set important styling
            this.container.style.overflow = 'hidden';

            // adjust styling to touch devices
            if (isTouch) {
                this.container.style.webkitOverflowScrolling = 'touch';
                this.container.style.overflowX = this.settings.triggerDirection.indexOf('x') >= 0 ? 'scroll' : 'hidden';
                this.container.style.overflowY = this.settings.triggerDirection.indexOf('y') >= 0 ? 'scroll' : 'hidden';
            }
        };

        /**
         * Attaches scrollbars to the container depending on which dimension
         * should be triggered and if showScrollbars is set to true.
         *
         * @public
         */
        this.attachScrollbars = function attachScrollbars() {

            // scrollbar disabled
            if (!this.settings.showScrollbars) {
                return;
            }

            var whichToCreate = [];

            // add horizontal scrollbar
            if (this.settings.triggerDirection.indexOf('x') >= 0) {
                whichToCreate.push('horizontal');
            }

            // add vertical scrollbar
            if (this.settings.triggerDirection.indexOf('y') >= 0) {
                whichToCreate.push('vertical');
            }

            // create scrollbar container
            var scrollbars = document.createElement('div');
                scrollbars.setAttribute('data-fluffy-scrollbars', '');

            for (var i = 0; i < whichToCreate.length; i++) {
                var scrollbar = document.createElement('span');
                scrollbar.classList.add('is-' + whichToCreate[i]);

                scrollbars.appendChild(scrollbar);
                this.scrollbars[whichToCreate[i]] = scrollbar;
            }

            this.container.appendChild(scrollbars);
            this.container.classList.add('has-scrollbar');
        };

        /**
         * Returns the width of the container.
         *
         * @public
         * @return {Number} In pixels.
         */
        this.getContainerWidth = function getContainerWidth() {
            return this.container.getBoundingClientRect().width;
        };

        /**
         * Returns the height of the container.
         *
         * @public
         * @return {Number} In pixels.
         */
        this.getContainerHeight = function getContainerHeight() {
            return this.container.getBoundingClientRect().height;
        };

        /**
         * Returns the width of the trigger.
         *
         * @public
         * @return {Number} In pixels.
         */
        this.getTriggerWidth = function getTriggerWidth() {
            return this.trigger.getBoundingClientRect().width;
        };

        /**
         * Returns the height of the trigger.
         *
         * @public
         * @return {Number} In pixels.
         */
        this.getTriggerHeight = function getTriggerHeight() {
            return this.trigger.getBoundingClientRect().height;
        };

        /**
         * Returns the width of the scrollable content by summing up all item
         * widths.
         *
         * @public
         * @return {Number} In pixels.
         */
        this.getContentWidth = function getContentWidth() {
            for (var i = 0, contentWidth = 0; i < this.items.length; i++) {
                contentWidth += this.items[i].getBoundingClientRect().width;
            }

            return contentWidth;
        };

        /**
         * Returns the height of the scrollable content by summing up all item
         * heights.
         *
         * @public
         * @return {Number} In pixels.
         */
        this.getContentHeight = function getContentHeight() {
            for (var i = 0, contentHeight = 0; i < this.items.length; i++) {
                contentHeight += this.items[i].getBoundingClientRect().height;
            }

            return contentHeight;
        };

        /**
         * Returns the smart widths for a set of items in a Fluffy container.
         * Smart hereby means the smallest, the average and the largest width.
         *
         * @public
         * @return {Object}
         */
        this.getSmartWidth = function getSmartWidth() {
            var widths = {
                smallest: null,
                largest: 0,
                average: 0,
            };

            for (var i = 0; i < this.items.length; i++) {
                var width = 'naturalWidth' in this.items[i] ?
                    this.items[i].naturalWidth :
                    this.items[i].getBoundingClientRect().width;

                widths.average += width;

                if (width > widths.largest) {
                    widths.largest = width;
                }

                if (widths.smallest === null || width < widths.smallest) {
                    widths.smallest = width;
                }
            }

            // get average width
            widths.average /= this.items.length;

            return widths;
        };

        /**
         * Returns the smart heights for a set of items in a Fluffy container.
         * Smart hereby means the smallest, the average and the largest height.
         *
         * @public
         * @return {Object}
         */
        this.getSmartHeight = function getSmartHeight() {
            var heights = {
                smallest: null,
                largest: 0,
                average: 0,
            };

            for (var i = 0; i < this.items.length; i++) {
                var height = 'naturalHeight' in this.items[i] ?
                    this.items[i].naturalHeight :
                    this.items[i].getBoundingClientRect().height;

                heights.average += height;

                if (height > heights.largest) {
                    heights.largest = height;
                }

                if (heights.smallest === null || height < heights.smallest) {
                    heights.smallest = height;
                }
            }

            // get average height
            heights.average /= this.items.length;

            return heights;
        };

        /**
         * Returns the total scrollable height.
         *
         * @public
         * @return {Number} In pixels.
         */
        this.getScrollableHeight = function getScrollableHeight() {
            return this.getContentHeight() - this.getContainerHeight();
        };

        /**
         * Returns the total scrollable width.
         *
         * @public
         * @return {Number} In pixels.
         */
        this.getScrollableWidth = function getScrollableWidth() {
            return this.getContentWidth() - this.getContainerWidth();
        };

        /**
         * Returns the mouse position in pixels as an array within the trigger
         * area.
         *
         * @public
         * @param {Object} e Mouse moving event.
         * @return {Array} An array holding the x, y position of the mouse.
         */
        this.getMousePosition = function getMousePosition(e) {
            /**
             * normalizing the offsetX, offsetY. thanks jack moore!
             * @see http://www.jacklmoore.com/notes/mouse-position/
             */
            e = e || window.event;

            var style = this.trigger.currentStyle ||
                        window.getComputedStyle(this.trigger, null);

            var rect = this.trigger.getBoundingClientRect();

            // trigger element borders
            var border = {
                left: style.borderLeftWidth | 0,
                right: style.borderRightWidth | 0,
                top: style.borderTopWidth | 0,
                bottom: style.borderBottomWidth | 0
            };

            // the border width and offset needs to be subtracted from the
            // mouse position
            var gap = {
                left: rect.left + border.left,
                right: border.left + border.right,
                bottom: border.top + border.bottom,
                top: rect.top + border.top
            };

            // retrieve value between 0 > value <= rect.{width,height}
            return {
                x: Math.min(Math.max(0, e.clientX - gap.left), rect.width - gap.right),
                y: Math.min(Math.max(0, e.clientY - gap.top), rect.height - gap.bottom)
            };
        };

        /**
         * Returns the fake mouse position which is adjusted to the padding set
         * and mapped to the content position.
         *
         * @public
         * @return {Array} An array holding the x, y position of the mouse.
         */
        this.getFakeMousePosition = function getFakeMousePosition() {

            // retrieve value between 0 > value <= rect.{width,height}
            return {
                x:
                    Math.min(
                        Math.max(
                            0,
                            this.mouse.real.x - this.settings.mousePadding
                        ),
                        this.sizes.moveArea.width
                    ) * this.ratios.moveAreaToContent.width,
                y:
                    Math.min(
                        Math.max(
                            0,
                            this.mouse.real.y - this.settings.mousePadding
                        ),
                        this.sizes.moveArea.height
                    ) * this.ratios.moveAreaToContent.height
            };
        };

        /**
         * Caches all sizes for several elements that are used in calculations.
         *
         * @public
         */
        this.cacheSizes = function cacheSizes() {
            /**
             * That's kind of a map for all sizes of all relevant DOM elements.
             *
             * @type {Object}
             */
            this.sizes = {
                container: {
                    width: this.getContainerWidth(),
                    height: this.getContainerHeight()
                },
                content: {
                    width: this.getContentWidth(),
                    height: this.getContentHeight()
                },
                scrollable: {
                    width: this.getScrollableWidth(),
                    height: this.getScrollableHeight()
                },
                trigger: {
                    width: this.getTriggerWidth(),
                    height: this.getTriggerHeight()
                },
                moveArea: {
                    width: this.getTriggerWidth() - (this.settings.mousePadding * 2),
                    height: this.getTriggerHeight() - (this.settings.mousePadding * 2)
                },
                scrollbars: {
                    horizontal:
                        this.settings.showScrollbars &&
                        this.scrollbars.horizontal ?
                        this.scrollbars.horizontal.getBoundingClientRect() :
                        null,
                    vertical:
                        this.settings.showScrollbars &&
                        this.scrollbars.vertical ?
                        this.scrollbars.vertical.getBoundingClientRect() :
                        null
                }
            };
        };

        /**
         * Updates the size of the content element according the the calculated
         * width and height.
         *
         * @public
         */
        this.updateContentSize = function updateContentSize() {

            // any smart sizes requested?
            if (this.settings.smartWidth && smartSize.indexOf(this.settings.smartWidth) >= 0) {
                this.content.style.width = this.getSmartWidth()[this.settings.smartWidth] + 'px';
            }

            if (this.settings.smartHeight && smartSize.indexOf(this.settings.smartHeight) >= 0) {
                this.content.style.height = this.getSmartHeight()[this.settings.smartHeight] + 'px';
            }

            // cache all sizes
            this.cacheSizes();

            // run important calculations
            this.defineRatios();

            if (this.settings.triggerDirection.indexOf('x') >= 0) {
                this.content.style.width = (
                    this.ratios.containerToContent.width *
                    100 +
                    0.001
                ).toFixed(maxDecimalPlaces) + '%';
            }


            if (this.settings.triggerDirection.indexOf('y') >= 0) {
                this.content.style.height = (
                    this.ratios.containerToContent.height *
                    100 +
                    0.001
                ).toFixed(maxDecimalPlaces) + '%';
            }

            // check if mouse position needs to be adjusted
            if (screenSize.x !== window.innerWidth || screenSize.y !== window.innerHeight) {
                this.mouse.real = {
                    x: this.mouse.real.x * (window.innerWidth / screenSize.x),
                    y: this.mouse.real.y * (window.innerHeight / screenSize.y),
                };

                screenSize = {
                    x: window.innerWidth,
                    y: window.innerHeight
                };

                this.mouse.fake = this.getFakeMousePosition();
            }
        };

        /**
         * Scrolls the content to the given position according to the trigger
         * dimension set.
         *
         * @public
         */
        this.updateContentPosition = function updateContentPosition() {

            // by default
            var x = 0, y = 0;

            if (this.settings.triggerDirection.indexOf('x') >= 0) {
                x = (
                    this.mouse.last.x /
                    this.sizes.scrollable.width *
                    this.ratios.contentToScrollableArea.width *
                    100
                ).toFixed(maxDecimalPlaces);
            }

            if (this.settings.triggerDirection.indexOf('y') >= 0) {
                y = (
                    this.mouse.last.y /
                    this.sizes.scrollable.height *
                    this.ratios.contentToScrollableArea.height *
                    100
                ).toFixed(maxDecimalPlaces);
            }

            this.content.style[shiftProperty] =
                'translate(-' + x + '%, -' + y + '%)';
        };

        /**
         * Updates the position of the scrollbar relative to the current
         * scrolled position within the content area.
         *
         * @public
         */
        this.updateScrollbarPosition = function updateScrollbarPosition() {

            if (!this.settings.showScrollbars) {
                return;
            }

            if (this.settings.triggerDirection.indexOf('x') >= 0) {
                this.scrollbars.horizontal.style.left = (
                    this.mouse.last.x /
                    this.sizes.scrollable.width *
                    this.ratios.containerToScrollbarArea.width *
                    100
                ).toFixed(maxDecimalPlaces) + '%';
            }

            if (this.settings.triggerDirection.indexOf('y') >= 0) {
                this.scrollbars.vertical.style.top = (
                    this.mouse.last.y /
                    this.sizes.scrollable.height *
                    this.ratios.containerToScrollbarArea.height *
                    100
                ).toFixed(maxDecimalPlaces) + '%';
            }
        };

        /**
         * Define several ratios needed for proper calculations.
         *
         * @public
         */
        this.defineRatios = function defineRatios() {

            // moving area to scrollable area
            this.ratios.moveAreaToContent = {
                width: this.sizes.scrollable.width / this.sizes.moveArea.width,
                height: this.sizes.scrollable.height / this.sizes.moveArea.height
            };

            // content to scrollable area
            this.ratios.contentToScrollableArea = {
                width: this.sizes.scrollable.width / this.sizes.content.width,
                height: this.sizes.scrollable.height / this.sizes.content.height
            };

            // container to content
            this.ratios.containerToContent = {
                width: this.sizes.content.width / this.sizes.container.width,
                height: this.sizes.content.height / this.sizes.container.height
            };

            // scrollbar to container
            this.ratios.containerToScrollbarArea = {
                width: this.sizes.scrollbars.horizontal ? (
                    this.sizes.container.width -
                    this.sizes.scrollbars.horizontal.width
                ) / this.sizes.container.width :
                    0,
                height: this.sizes.scrollbars.vertical ?  (
                    this.sizes.container.height -
                    this.sizes.scrollbars.vertical.height
                ) / this.sizes.container.height :
                    0
            };
        };

        /**
         * Registers all listeners needed in order to track mouse positioning,
         * window resizing and scrolling calculations.
         *
         * @public
         */
        this.registerEventListeners = function registerEventListeners() {

            // Fluffy is ready
            if (this.container) {
                this.container.classList.add('is-ready');
            }

            // update content sizes
            this.updateContentSize();

            // stop right here if touch device!
            if (isTouch) {
                return;
            }

            this.trigger.addEventListener('mousemove', function onMouseMove(e) {

                // start mouse observer if not already started
                if (this.mouse.observer.status() === false) {
                    this.mouse.observer.start();
                }

                // get real mouse position in trigger area
                this.mouse.real = this.getMousePosition(e);

                // get fake mouse position (adjusted to set padding, mapped
                // to content position)
                this.mouse.fake = this.getFakeMousePosition();

            }.bind(this));
        };

        /**
         * That's the closure that is handling all the constructor logic and
         * builds up all available properties.
         */
        (function construct() {
            var contentNode = containerNode.querySelector('[data-fluffy-content]');

            // container has no content, that's not good!
            if (contentNode === null) {
                _(containerNode, 'warn');
                _('↳ Has no [data-fluffy-content] element and therefore will be ignored.', 'warn');
                return;
            }

            // prepare settings for this object
            var settings = {};

            // custom settings provided
            if (containerNode.hasAttribute('data-fluffy-options')) {

                // try to read the custom settings
                try {
                    var options = JSON.parse(containerNode.getAttribute('data-fluffy-options'));

                    // parsed options are in a wrong format
                    if (typeof options !== 'object') {
                        _(containerNode, 'warn');
                        _('↳ Fluffy options need to be of type object. Skipping for container above. Using defaults instead.', 'warn');

                    // use given options
                    } else {
                        settings = options;
                    }
                } catch(e) {
                    _(containerNode, 'warn');
                    _('↳ Trying to parse options for container above has failed. Using defaults instead.', 'warn');
                }

                // integrity checks for several options
                if ('mousePadding' in settings && settings.mousePadding < 0) {
                    settings.mousePadding = defaults.mousePadding;
                }

                if ('mouseDamp' in settings && settings.mouseDamp <= 0) {
                    settings.mouseDamp = defaults.mouseDamp;
                }
            }

            // fill up missing settings with its default values
            for (var key in defaults) {
                if (!(key in settings)) {
                    settings[key] = defaults[key];
                }
            }

            // fill properties
            this.container = containerNode;
            this.content = contentNode;
            this.items = contentNode.childNodes;
            this.settings = settings;
            this.trigger = containerNode;

            if (settings.triggerSelector) {
                var triggerNode = document.querySelector(
                    settings.triggerSelector
                );

                if (triggerNode !== null) {
                    this.trigger = triggerNode;
                }
            }

            // time for last preparations
            this.prepare();

            // register final event listeners when document has been loaded
            switch (document.readyState) {
                case 'loading':
                case 'interactive':
                    document.onreadystatechange = function onReadyStateChange() {
                        if (document.readyState == 'complete') {
                            this.registerEventListeners();
                        }
                    }.bind(this);
                break;
                case 'complete':
                    this.registerEventListeners();
                break;
            }
        }).call(this);
    };


    /**
     * The MouseObserver is an object which provides functionality to start,
     * stop and get the current status of the observer. The observer itself is
     * an interval in where several calculations regarding the mouse are
     * happening and other parts are getting updated.
     *
     * @param {Object} fluffyObject A Fluffy object.
     */
    function MouseObserver(fluffyObject) {
        if (fluffyObject instanceof FluffyObject === false) {
            throw Error('MouseObserver expects first parameter to be an instance of FluffyObject. Instead ' + fluffyObject.constructor.name + ' was given.');
        }

        /**
         * Behaves the same as setInterval except uses requestAnimationFrame()
         * where possible for better performance.
         *
         * @private
         * @param {function} fn The callback function.
         * @param {int} delay The delay in milliseconds.
         */
        function _requestInterval(fn, delay) {
            var start = Date.now();
            var handle = {};

            function loop() {
                handle.value = window.requestAnimationFrame(loop);

                var current = Date.now();
                var delta = current - start;

                if (delta >= delay) {
                    fn.call();
                    start = Date.now();
                }
            }

            handle.value = window.requestAnimationFrame(loop);

            return handle;
        }

        /**
         * Behaves the same as clearInterval except uses
         * cancelRequestAnimationFrame() where possible for better performance.
         *
         * @private
         * @param {int|object} fn The callback function.
         */
        function _clearInterval(handle) {
            window.cancelAnimationFrame(handle.value);
        }

        /**
         * Starts the interval which runs last calculations on the mouse
         * position and updates other relevant parts of Fluffy.
         */
        this.start = function start() {

            // add modifier to container that it's moving
            fluffyObject.container.classList.add('is-moving');

            this.id = _requestInterval(function() {

                // make mouse move triggering more lazy
                var add = {
                    x: (fluffyObject.mouse.fake.x - fluffyObject.mouse.last.x) /
                        fluffyObject.settings.mouseDamp,
                    y: (fluffyObject.mouse.fake.y - fluffyObject.mouse.last.y) /
                        fluffyObject.settings.mouseDamp
                };

                // stop observing as no movement is going on
                if (Math.abs(add.x) < 0.001 && Math.abs(add.y) < 0.001) {

                    // stop observing
                    this.stop();

                    // remove modifier
                    fluffyObject.container.classList.remove('is-moving');
                }

                // update last mouse position
                fluffyObject.mouse.last.x += add.x;
                fluffyObject.mouse.last.y += add.y;

                // scroll content to last position
                fluffyObject.updateContentPosition();

                // update scrollbar positions
                fluffyObject.updateScrollbarPosition();

            }.bind(this), 10);
        };

        /**
         * Stops the interval and clears any status set.
         */
        this.stop = function stop() {
            this.id = _clearInterval(this.id);
        };

        /**
         * Returns a boolean value indicating whether the observer is running
         * or not.
         *
         * @return {Boolean}
         */
        this.status = function status() {
            return typeof this.id === 'object';
        };
    };


    /**
     * Creates a Fluffy instance.
     *
     * @param {string|HTMLElement} reference
     */
    function create(reference) {
        var container = reference;

        if (typeof reference === 'string') {
            container = document.querySelector(reference);
        }

        // quit early if nothing found
        if (container === null) {
            return;
        }

        // check if there is already a Fluffy object with the given container
        for (var i = 0; i < fluffyObjects.length; i++) {
            if (fluffyObjects[i].container === container) {
                return;
            }
        }

        fluffyObjects.push(new FluffyObject(container));
    };

    /**
     * Automatically detects any Fluffy markup and creates according instances.
     */
    function detect() {

        // get all defined containers
        var containers = document.querySelectorAll('[data-fluffy-container]');

        // quit early if nothing found
        if (containers.length === 0) {
            return;
        }

        // fill our stack
        for (var i = 0; i < containers.length; i++) {
            create(containers[i]);
        }
    };

    /**
     * Build and check lifetime relevant things.
     */
    (function construct() {

        // lacking features?
        if (!featureSupport) {
            throw Error('Browser is lacking support for several requirements like: \'querySelector\', \'addEventListener\' or \'requestAnimationFrame\'.');
        }

        // since we're using CSS transforming to simulate the scrolling we need
        // to get the supported (vendor prefixed) CSS property for it
        shiftProperty = (function getShiftProperty(prefixes) {
            var tmp = document.createElement('div');

            for (var i = 0; i < prefixes.length; i++) {
                if (prefixes[i] in tmp.style) {
                    return prefixes[i];
                }
            }

            throw Error('Browser doesn\'t support CSS3 transforms.');
        })([
            'transform',
            'msTransform',
            'MozTransform',
            'WebkitTransform',
            'OTransform'
        ]);

        // add global touch state modifier
        if (isTouch) {
            document.documentElement.classList.add('is-touch');
        }

        _registerResizeListener();
    })();

    return {
        create: create,
        detect: detect,
        version: version
    };
});
