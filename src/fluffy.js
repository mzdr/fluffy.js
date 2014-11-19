/*! Fluffy.js 2.0.0
 *
 * Sebastian Prein
 * Copyright 2014, MIT License
 */
(function ()
{
    'use strict';

    var root;

    root = (typeof exports === 'object') ? exports : this;
    root.Fluffy = {};

    // set version
    Fluffy.version = '2.0.0';

    var featureSupport = !!document.querySelector && !!root.addEventListener && !!root.requestAnimationFrame;

    // @see: http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
    var isTouch = ('ontouchstart' in root);

    // CSS property used for shifting content
    var shiftProperty = 'transform';

    // available smart size attributes
    var smartSize = [ 'smallest', 'average', 'largest' ];

    // default settings
    var defaults =
    {
        // if no trigger selector is given, the Fluffy container is also
        // the trigger area
        triggerSelector: null,

        // displays the current position within the scrollable content in form
        // of a scrollbar for each dimension
        showScrollbars: true,

        // automatically adjust the height of the content container according
        // to the smallest, largest or the average height of all items found.
        // allowed values: false, 'smallest', 'average', 'largest'
        smartHeight: false,

        // automatically adjust the width of the content container according
        // to the smallest, largest or the average width of all items found.
        // allowed values: false, 'smallest', 'average', 'largest'
        smartWidth: false,

        // define which dimension to trigger movement for
        // allowed values: x, y, xy
        triggerDirection: 'x',

        // the higher the value the more lazier the reaction to the
        // mouse movement will be
        mouseDamp: 20,

        // adds space (in pixel) to the trigger area where no action happens
        mousePadding: 60
    };

    // all fluffy occurrences
    var my = [];


    /**
     * Initialize Fluffy automatically.
     */
    (function ()
    {
        // build and check lifetime relevant things
        try
        {
            // lacking features?
            if (!featureSupport)
                throw Error('Browser is lacking support for several requirements like: \'querySelector\', \'addEventListener\' or \'requestAnimationFrame\'.');

            // since we're using CSS transforming to simulate the scrolling we need
            // to get the supported (vendor prefixed) CSS property for it
            shiftProperty = (function (prefixes)
            {
                var tmp = document.createElement('div');

                for (var i = 0; i < prefixes.length; i++)
                    if (typeof tmp.style[prefixes[i]] !== 'undefined')
                        return prefixes[i];

                throw Error('Browser doesn\'t support CSS3 transforms.')
            })(["transform", "msTransform", "MozTransform", "WebkitTransform", "OTransform"]);

            fetchDOMNodes();
        }

        catch (e)
        {
            return _(e.message, 'error');
        }

        prepareDOMNodes();
        registerEventListeners();

    })();

    /**
     * The MouseObserver is an object which provides functionality to start,
     * stop and get the current status of the observer. The observer itself is
     * an interval in where several calculations regarding the mouse are
     * happening and other parts are getting updated.
     *
     * @type {object}
     */
    var MouseObserver =
    {
        /**
         * Starts the interval which runs last calculations on the mouse
         * position and updates other relevant parts of Fluffy.
         *
         * @param {object} el A Fluffy object.
         */
        start: function (el)
        {
            // add modifier to container that it's moving
            el.container.classList.add('is-moving');

            el.mouse.observer = _requestInterval(function()
            {
                // make mouse move triggering more lazy
                var add = {
                    x: (el.mouse.fake.x - el.mouse.last.x) / el.settings.mouseDamp,
                    y: (el.mouse.fake.y - el.mouse.last.y) / el.settings.mouseDamp
                };

                // stop observing as no movement is going on
                if (MouseObserver.status(el) && Math.abs(add.x) < 0.001 && Math.abs(add.y) < 0.001)
                {
                    // stop observing
                    MouseObserver.stop(el);

                    // remove modifier
                    el.container.classList.remove('is-moving');
                }

                // update last mouse position
                el.mouse.last.x += add.x
                el.mouse.last.y += add.y

                // scroll content to last position
                updateContentPosition(el);

                // update scrollbar positions
                if (el.settings.showScrollbars)
                    updateScrollbarPosition(el);

            }, 10);
        },

        /**
         * Stops the interval and clears any status set.
         *
         * @param {object} el A Fluffy object.
         */
        stop: function (el)
        {
            _clearInterval(el.mouse.observer);
            el.mouse.observer = null;
        },

        /**
         * Returns a boolean value indicating whether the observer is running or
         * not.
         *
         * @param {object} el A Fluffy object.
         * @return {bool}
         */
        status: function (el)
        {
            return el.mouse.observer;
        }
    }

    /**
     * Just a simple console helper.
     *
     * @private
     * @param {mixed} message The message or array of messages.
     * @param {string} type Type of message. Could be 'warn', 'error', 'log' or 'debug' for example.
     * @return {bool}
     */
    function _ (message, type)
    {
        // default console message is of type debug
        type = typeof type !== 'undefined' ? type : 'debug';

        // pseudo type cast message to array
        message = message == null ? [] : (Array.isArray(message) ? message : [ message ]);

        if (!root.console || !console[type])
            return true;

        console.group('Fluffy %c(%s)', 'font-style: italic; color: rgba(0, 0, 0, 0.25);', Fluffy.version);

        [].forEach.call(message, function (line)
        {
            console[type](typeof line === 'string' ? line : JSON.stringify(line));
        });

        console.groupEnd();

        return true;
    }

    /**
     * Behaves the same as setInterval except uses requestAnimationFrame()
     * where possible for better performance.
     *
     * @private
     * @param {function} fn The callback function.
     * @param {int} delay The delay in milliseconds.
     */
    function _requestInterval (fn, delay)
    {
        var start = Date.now(),
            handle = {};

        function loop ()
        {
            handle.value = root.requestAnimationFrame(loop);

            var current = Date.now(),
                delta = current - start;

            if (delta >= delay)
            {
                fn.call();
                start = Date.now();
            }
        }

        handle.value = root.requestAnimationFrame(loop);

        return handle;
    }

    /**
     * Behaves the same as clearInterval except uses
     * cancelRequestAnimationFrame() where possible for better performance.
     *
     * @private
     * @param {int|object} fn The callback function.
     */
    function _clearInterval (handle)
    {
        root.cancelAnimationFrame(handle.value);
    }

    /**
     * Removes text nodes and unneeded DOM elements from the item list.
     *
     * @private
     * @param {object} items A set of DOM elements.
     */
    function _cleanItems (items)
    {
        for (var i = 0; i < items.length; i++)
        {
            var current = items[i],
                next = current.nextSibling,
                prev = current.previousSibling,
                parent = current.parentNode;

            // remove text nodes
            if (current !== null && current.nodeType === 3)
                parent.removeChild(current);

            if (prev !== null && prev.nodeType === 3)
                parent.removeChild(prev);

            if (next !== null && next.nodeType === 3)
                parent.removeChild(next);
        }

        return items;
    }

    /**
     * Fetches all occurrences of Fluffy containers and their contents. If a
     * container is found without content, there will be raised a warning and
     * the container is being ignored. Otherwise an object will be created for
     * each container holding all information needed about this particular
     * instance of Fluffy.
     *
     * @private
     */
    function fetchDOMNodes ()
    {
        // get all defined containers
        var containers = document.querySelectorAll('[data-fluffy-container]');

        // quit early if nothing found
        if (containers === null)
            throw Error('No containers found.');

        // prepare our stack
        for (var i = 0; i < containers.length; i++)
        {
            var content = containers[i].querySelector('[data-fluffy-content]'),
                trigger;

            // container has no content, so skip it
            if (content === null)
            {
                // print warning
                _('\'' + getDOMPath(containers[i]) + '\' has no content and therefore will be ignored.', 'warn');

                continue;
            }

            // use default settings
            var settings = defaults;

            // custom settings provided
            if (containers[i].hasAttribute('data-fluffy-options'))
            {
                // try to read the custom settings and override default
                try
                {
                    var options = JSON.parse(containers[i].getAttribute('data-fluffy-options'));

                    Object.keys(options).forEach(function (key)
                    {
                        if (settings[key] !== undefined)
                            settings[key] = options[key];
                    });
                }
                catch (e)
                {
                    _('\'' + getDOMPath(containers[i]) + '\' has invalid options and therefore will be ignored.', 'warn');
                }
            }

            // each stack item is based on the container, its content and all
            // of its items and possible scrollbars
            my.push({
                container: containers[i],
                content: content,
                items: _cleanItems(content.childNodes),
                trigger: settings.triggerSelector && (trigger = document.querySelector(settings.triggerSelector)) !== null ? trigger : containers[i],
                scrollbars: null,
                mouse:
                {
                    real: { x: 0, y: 0 },
                    fake: { x: 0, y: 0 },
                    last: { x: 0, y: 0 },
                    observer: null
                },
                ratios: {},
                settings: settings,
                sizes: {}
            });
        };
    }

    /**
     * Once all Fluffy occurrences have been fetched this method will do last
     * preparations like adding scrollbars and setting important CSS styling.
     *
     * @private
     */
    function prepareDOMNodes ()
    {
        my.forEach(function (el)
        {
            // depending on the dimension to trigger the relevant scrollbars
            // will be created and attached to the container
            attachScrollbars(el);

            // set important styling
            el.container.style.overflow = 'hidden';

            // adjust styling to touch devices
            if (isTouch)
            {
                el.container.style.webkitOverflowScrolling = 'touch';
                el.container.style.overflowX = el.settings.triggerDirection.indexOf('x') >= 0 ? 'scroll' : 'hidden';
                el.container.style.overflowY = el.settings.triggerDirection.indexOf('y') >= 0 ? 'scroll' : 'hidden';
            }
        });
    }

    /**
     * Attaches scrollbars to the container of the given Fluffy object depending
     * on which dimension should be triggered and if showScrollbars is set to true.
     *
     * @private
     * @param {object} el A Fluffy object.
     */
    function attachScrollbars (el)
    {
        // scrollbar disabled
        if (!el.settings.showScrollbars)
            return;

        var whichToCreate = el.scrollbars = [];

        // add horizontal scrollbar
        if (el.settings.triggerDirection.indexOf('x') >= 0)
            whichToCreate.push('horizontal');

        // add vertical scrollbar
        if (el.settings.triggerDirection.indexOf('y') >= 0)
            whichToCreate.push('vertical');

        // create scrollbar container
        var scrollbars = document.createElement('div');
            scrollbars.setAttribute('data-fluffy-scrollbars', '');

        whichToCreate.forEach(function (position)
        {
            var scrollbar = document.createElement('span');
            scrollbar.classList.add('is-' + position);

            scrollbars.appendChild(scrollbar);
            el.scrollbars[position] = scrollbar;
        });

        el.container.appendChild(scrollbars);
        el.container.classList.add('has-scrollbar');
    }

    /**
     * Gets the DOM path of a given DOM node.
     *
     * @param {object} currentNode DOM node.
     * @return {string}
     */
    function getDOMPath (currentNode)
    {
        // get dom path for debugging
        var domPath = [];

        do
        {
            var nodeSelector = currentNode.tagName.toLowerCase();

            // add node id
            if (currentNode.id)
                nodeSelector += '#' + currentNode.id;

            // add all classes
            if (currentNode.className)
                nodeSelector += '.' + [].join.call(currentNode.classList, '.');

            domPath.push(nodeSelector);
        }

        while (currentNode = currentNode.parentElement);

        return domPath.reverse().join('/');
    }

    /**
     * Returns the width of the container of the given Fluffy object.
     *
     * @private
     * @param {object} el A Fluffy object.
     * @return {number} In pixels.
     */
    function getContainerWidth (el)
    {
        return el.container.getBoundingClientRect().width;
    };

    /**
     * Returns the height of the container of the given Fluffy object.
     *
     * @private
     * @param {object} el A Fluffy object.
     * @return {number} In pixels.
     */
    function getContainerHeight (el)
    {
        return el.container.getBoundingClientRect().height;
    };

    /**
     * Returns the width of the trigger of the given Fluffy object.
     *
     * @private
     * @param {object} el A Fluffy object.
     * @return {number} In pixels.
     */
    function getTriggerWidth (el)
    {
        return el.trigger.getBoundingClientRect().width;
    };

    /**
     * Returns the height of the trigger of the given Fluffy object.
     *
     * @private
     * @param {object} el A Fluffy object.
     * @return {number} In pixels.
     */
    function getTriggerHeight (el)
    {
        return el.trigger.getBoundingClientRect().height;
    };

    /**
     * Returns the width of the scrollable content by summing up all item
     * widths.
     *
     * @private
     * @param {object} el A Fluffy object.
     * @return {number} In pixels.
     */
    function getContentWidth (el)
    {
        for (var i = 0, contentWidth = 0; i < el.items.length; i++)
            contentWidth += el.items[i].getBoundingClientRect().width;

        return contentWidth;
    };

    /**
     * Returns the height of the scrollable content by summing up all item
     * heights.
     *
     * @private
     * @param {object} el A Fluffy object.
     * @return {number} In pixels.
     */
    function getContentHeight (el)
    {
        for (var i = 0, contentHeight = 0; i < el.items.length; i++)
            contentHeight += el.items[i].getBoundingClientRect().height;

        return contentHeight;
    };

    /**
     * Returns the smart sizes of a given dimension for a set of items in a
     * Fluffy container. Smart hereby means the smallest, the average and the
     * largest size.
     *
     * @private
     * @param {string} dimension The dimension to return the smart sizes for.
     * @param {object} el A Fluffy object.
     * @return {array}
     */
    function getSmartItemSizesByDimension (dimension, el)
    {
        var dimension = dimension === 'height' ? 'height' : 'width',
            smallestSize = el.items[0].getBoundingClientRect()[dimension],
            largestSize = 0,
            averageSize = 0,
            rectCurrentItem;

        for (var i = 0; i < el.items.length; i++)
        {
            rectCurrentItem = el.items[i].getBoundingClientRect();
            averageSize += rectCurrentItem[dimension];

            if (rectCurrentItem[dimension] > largestSize)
                largestSize = rectCurrentItem[dimension];

            if (rectCurrentItem[dimension] < smallestSize)
                smallestSize = rectCurrentItem[dimension];
        }

        // order according the smartSizes var
        return [ smallestSize, averageSize / el.items.length, largestSize ];
    }

    /**
     * Returns the total scrollable height.
     *
     * @private
     * @param {object} el A Fluffy object.
     * @return {number} In pixels.
     */
    function getScrollableHeight (el)
    {
        return getContentHeight(el) - getContainerHeight(el);
    }

    /**
     * Returns the total scrollable width.
     *
     * @private
     * @param {object} el A Fluffy object.
     * @return {number} In pixels.
     */
    function getScrollableWidth (el)
    {
        return getContentWidth(el) - getContainerWidth(el);
    }

    /**
     * Returns the mouse position in pixels as an array within the trigger area.
     *
     * @private
     * @param {object} e Mouse moving event.
     * @param {object} el A Fluffy object.
     * @return {array} An array holding the x, y position of the mouse.
     */
    function getMousePosition (e, el)
    {
        /**
         * normalizing the offsetX, offsetY. thanks jack moore!
         * @see http://www.jacklmoore.com/notes/mouse-position/
         */
        e = e || root.event;

        var style = el.trigger.currentStyle || root.getComputedStyle(el.trigger, null),
            rect = el.trigger.getBoundingClientRect(),

            // trigger element borders
            border = {
                left: style.borderLeftWidth | 0,
                right: style.borderRightWidth | 0,
                top: style.borderTopWidth | 0,
                bottom: style.borderBottomWidth | 0
            },

            // the border width and offset needs to be subtracted from the
            // mouse position
            gap = {
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
    }

    /**
     * Returns the fake mouse position which is adjusted to the set padding and
     * mapped to the content position.
     *
     * @private
     * @param {object} el A Fluffy object.
     * @return {array} An array holding the x, y position of the mouse.
     */
    function getFakeMousePosition (el)
    {
        // retrieve value between 0 > value <= rect.{width,height}
        return {
            x: Math.min(Math.max(0, el.mouse.real.x - el.settings.mousePadding), el.sizes.moveArea.width) * el.ratios.moveAreaToContent.width,
            y: Math.min(Math.max(0, el.mouse.real.y - el.settings.mousePadding), el.sizes.moveArea.height) * el.ratios.moveAreaToContent.height
        };
    }

    /**
     * Caches all sizes for several elements that are used in calculations.
     *
     * @private
     * @param {object} el A Fluffy object.
     */
    function cacheSizes (el)
    {
        /**
         * That's a kind of map of all sizes for all relevant DOM elements.
         *
         * @type {object}
         */
        el.sizes =
        {
            container:
            {
                width: getContainerWidth(el),
                height: getContainerHeight(el)
            },
            content:
            {
                width: getContentWidth(el),
                height: getContentHeight(el)
            },
            scrollable:
            {
                width: getScrollableWidth(el),
                height: getScrollableHeight(el)
            },
            trigger:
            {
                width: getTriggerWidth(el),
                height: getTriggerHeight(el)
            },
            moveArea:
            {
                width: getTriggerWidth(el) - (el.settings.mousePadding * 2),
                height: getTriggerHeight(el) - (el.settings.mousePadding * 2)
            },
            scrollbars:
            {
                width: null,
                height: null
            }
        }

        if (!el.settings.showScrollbars)
            return;

        if (el.scrollbars.horizontal)
            el.sizes.scrollbars.horizontal = el.scrollbars.horizontal.getBoundingClientRect();

        if (el.scrollbars.vertical)
            el.sizes.scrollbars.vertical = el.scrollbars.vertical.getBoundingClientRect();
    }

    /**
     * Updates the size of the content element according the the calculated
     * width and height.
     *
     * @private
     * @param {object} el A Fluffy object.
     */
    function updateContentSize (el)
    {
        if (el.settings.smartWidth && smartSize.indexOf(el.settings.smartWidth) >= 0)
            el.content.style.width = getSmartItemSizesByDimension('width', el)[smartSize.indexOf(el.settings.smartWidth)] + 'px';

        else if (el.settings.triggerDirection.indexOf('x') >= 0)
            el.content.style.width = el.ratios.containerToContent.width * 100 + '%';

        if (el.settings.smartHeight && smartSize.indexOf(el.settings.smartHeight) >= 0)
            el.content.style.height = getSmartItemSizesByDimension('height', el)[smartSize.indexOf(el.settings.smartHeight)] + 'px';

        else if (el.settings.triggerDirection.indexOf('y') >= 0)
            el.content.style.height = el.ratios.containerToContent.height * 100 + '%';
    }

    /**
     * Scrolls the content to the given position according to the trigger
     * dimension set.
     *
     * @private
     * @param {object} el A Fluffy object.
     */
    function updateContentPosition (el)
    {
        var x = el.settings.triggerDirection.indexOf('x') >= 0 ? -el.mouse.last.x / el.sizes.scrollable.width * el.ratios.contentToScrollableArea.width * 100 : 0;
        var y = el.settings.triggerDirection.indexOf('y') >= 0 ? -el.mouse.last.y / el.sizes.scrollable.height * el.ratios.contentToScrollableArea.height * 100 : 0;

        el.content.style[shiftProperty] = 'translate(' + x + '%, ' + y + '%)';
    }

    /**
     * Updates the position of the scrollbar relative to the current scrolled
     * position within the content area.
     *
     * @private
     * @param {object} el A Fluffy object.
     */
    function updateScrollbarPosition (el)
    {
        if (!el.settings.showScrollbars)
            return;

        if (el.settings.triggerDirection.indexOf('x') >= 0)
            el.scrollbars.horizontal.style.left = el.mouse.last.x / el.sizes.scrollable.width * (1 - el.sizes.scrollbars.horizontal.width / el.sizes.container.width) * 100 + '%';

        if (el.settings.triggerDirection.indexOf('y') >= 0)
            el.scrollbars.vertical.style.top = el.mouse.last.y / el.sizes.scrollable.height * (1 - el.sizes.scrollbars.vertical.height / el.sizes.container.height) * 100 + '%';
    }

    /**
     * Define several ratios needed for proper calculations.
     *
     * @private
     * @param {object} el A Fluffy object.
     */
    function defineRatios (el)
    {

        // moving area to scrollable area
        el.ratios.moveAreaToContent = {
            width: el.sizes.scrollable.width / el.sizes.moveArea.width,
            height: el.sizes.scrollable.height / el.sizes.moveArea.height
        };

        // content to scrollable area
        el.ratios.contentToScrollableArea = {
            width: el.sizes.scrollable.width / el.sizes.content.width,
            height: el.sizes.scrollable.height / el.sizes.content.height
        };

        // container to content
        el.ratios.containerToContent = {
            width: el.sizes.content.width / el.sizes.container.width,
            height: el.sizes.content.height / el.sizes.container.height
        };
    }

    /**
     * Registers all listeners needed in order to track mouse positioning,
     * window resizing and scrolling calculations.
     *
     * @private
     */
    function registerEventListeners ()
    {
        root.addEventListener('load', function ()
        {
            my.forEach(function (el)
            {
                // fluffy is ready
                if (el.container)
                    el.container.classList.add('is-ready');

                // cache all sizes
                cacheSizes(el);

                // run important calculations
                defineRatios(el);

                // update content sizes
                updateContentSize(el);

                // stop right here if touch device!
                if (isTouch)
                    return;

                el.trigger.addEventListener('mousemove', function (e)
                {
                    // start mouse observer if not already started
                    if (MouseObserver.status(el) === null)
                        MouseObserver.start(el);

                    // get real mouse position in trigger area
                    el.mouse.real = getMousePosition(e, el);

                    // get fake mouse position (adjusted to set padding, mapped
                    // to content position)
                    el.mouse.fake = getFakeMousePosition(el);
                });
            });
        });

        // we're gonna debounce the resize event...
        var debounce;

        root.addEventListener('resize', function ()
        {
            // wait for it
            if (debounce)
                clearTimeout(debounce);

            debounce = setTimeout(function ()
            {
                my.forEach(function (el)
                {
                    // cache all sizes
                    cacheSizes(el);

                    // run important calculations
                    defineRatios(el);

                    // update content sizes
                    updateContentSize(el);
                });

            }, 100);

        });
    }
}).call(this);
