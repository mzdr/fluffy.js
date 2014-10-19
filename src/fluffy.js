/**
 * An even better animation frame.
 *
 * @copyright Oleg Slobodskoi 2013
 * @website https://github.com/kof/animationFrame
 * @license MIT
 */
(function(window){"use strict";var nativeRequestAnimationFrame,nativeCancelAnimationFrame;(function(){var i,vendors=["webkit","moz","ms","o"],top;try{window.top.name;top=window.top}catch(e){top=window}nativeRequestAnimationFrame=top.requestAnimationFrame;nativeCancelAnimationFrame=top.cancelAnimationFrame||top.cancelRequestAnimationFrame;for(i=0;i<vendors.length&&!nativeRequestAnimationFrame;i++){nativeRequestAnimationFrame=top[vendors[i]+"RequestAnimationFrame"];nativeCancelAnimationFrame=top[vendors[i]+"CancelAnimationFrame"]||top[vendors[i]+"CancelRequestAnimationFrame"]}nativeRequestAnimationFrame&&nativeRequestAnimationFrame(function(){AnimationFrame.hasNative=true})})();function AnimationFrame(options){if(!(this instanceof AnimationFrame))return new AnimationFrame(options);options||(options={});if(typeof options=="number")options={frameRate:options};options.useNative!=null||(options.useNative=true);this.options=options;this.frameRate=options.frameRate||AnimationFrame.FRAME_RATE;this._frameLength=1e3/this.frameRate;this._isCustomFrameRate=this.frameRate!==AnimationFrame.FRAME_RATE;this._timeoutId=null;this._callbacks={};this._lastTickTime=0;this._tickCounter=0}AnimationFrame.FRAME_RATE=60;AnimationFrame.shim=function(options){var animationFrame=new AnimationFrame(options);window.requestAnimationFrame=function(callback){return animationFrame.request(callback)};window.cancelAnimationFrame=function(id){return animationFrame.cancel(id)};return animationFrame};AnimationFrame.now=Date.now||function(){return(new Date).getTime()};AnimationFrame.navigationStart=AnimationFrame.now();AnimationFrame.perfNow=function(){if(window.performance&&window.performance.now)return window.performance.now();return AnimationFrame.now()-AnimationFrame.navigationStart};AnimationFrame.hasNative=false;AnimationFrame.prototype.request=function(callback){var self=this,delay;++this._tickCounter;if(AnimationFrame.hasNative&&self.options.useNative&&!this._isCustomFrameRate){return nativeRequestAnimationFrame(callback)}if(!callback)throw new TypeError("Not enough arguments");if(this._timeoutId==null){delay=this._frameLength+this._lastTickTime-AnimationFrame.now();if(delay<0)delay=0;this._timeoutId=window.setTimeout(function(){var id;self._lastTickTime=AnimationFrame.now();self._timeoutId=null;++self._tickCounter;for(id in self._callbacks){if(self._callbacks[id]){if(AnimationFrame.hasNative&&self.options.useNative){nativeRequestAnimationFrame(self._callbacks[id])}else{self._callbacks[id](AnimationFrame.perfNow())}delete self._callbacks[id]}}},delay)}this._callbacks[this._tickCounter]=callback;return this._tickCounter};AnimationFrame.prototype.cancel=function(id){if(AnimationFrame.hasNative&&this.options.useNative)nativeCancelAnimationFrame(id);delete this._callbacks[id]};if(typeof exports=="object"&&typeof module=="object"){module.exports=AnimationFrame}else if(typeof define=="function"&&define.amd){define(function(){return AnimationFrame})}else{window.AnimationFrame=AnimationFrame}})(window);

/*! Fluffy.js 1.1.0
 *
 * Sebastian Prein
 * Copyright 2014, MIT License
 */
(function()
{
    'use strict';

    var root;

    root = (typeof exports === 'object') ? exports : this;
    root.Fluffy || (root.Fluffy = {});

    // feature test
    var supports = !!document.querySelector && !!root.addEventListener;

    // touch device?
    // @see: http://www.stucox.com/blog/you-cant-detect-a-touchscreen/
    var isTouch = ('ontouchstart' in window);

    // default settings
    var defaults =
    {
        // the overall container holding everything together
        containerSelector: '#fluffy-container',

        // the selector for the actual content
        contentSelector: '#fluffy-content',

        // enable debugging output
        debug: false,

        // selector to pick items, if none given all children in the content
        // container will be picked
        itemSelector: null,

        // selector for the scrollbar
        scrollbarSelector: '#fluffy-scrollbar',

        // displays the current position within the scrollable content in form
        // of a scrollbar
        showScrollbar: true,

        // automatically adjust the height of the content container either
        // relative to the smallest or tallest element found
        // allowed values: false, tallest, smallest
        smartHeight: false,

        // the stage holding the scrollable content
        stageSelector: '#fluffy-stage',

        // if no trigger selector is given, the Fluffy container is also
        // the trigger area
        triggerSelector: null,

        // define which axis to trigger movement for
        // allowed values: x, y, xy
        triggerDirection: 'x',

        // the higher the value the more lazier the reaction to the
        // mouse movement will be
        mouseDamp: 20,

        // adds space (in pixel) to the trigger area where no action happens
        mousePadding: 60
    }

    // dom elements
    var my = { container: null, scrollbar: {}, stage: null, content: null, items: null }

    // user settings
    var settings;

    // mouse data, initial values
    var mouse =
    {
        real: { x: 0, y: 0 },
        fake: { x: 0, y: 0 },
        last: { x: 0, y: 0 },
        observer:
        {
            start: null,
            stop: null,
            status: null,
            process: { run: false }
        }
    }

    // several ratios
    var ratio = {}


    /**
     * Initialize Fluffy.
     *
     * @public
     * @param {object} options User set options to override default.
     */
    Fluffy.init = function (options)
    {
        // set version
        Fluffy.version = '1.1.0';

        // active requestAnimationFrame shim
        window.AnimationFrame.shim();

        // use default settings and override options if given
        settings = defaults;

        if (typeof options === 'object')
        {
            Object.keys(options).forEach(function (key)
            {
                if (settings[key] !== undefined)
                    settings[key] = options[key];
            });
        }

        // feature test
        if (!supports)
            return _debug('Browser has no support for \'querySelector\' or \'addEventListener\'.');

        // just a precaution
        settings.triggerDirection = settings.triggerDirection.toLowerCase();

        _debug('User settings loaded.');
        _debug('Loading DOM elements.');

        // try to get all necessary dom elements
        try
        {
            getContainer();
            getTrigger();
            getScrollbar();
            getStage();
            getContent();
            getItems();
        }

        catch (e)
        {
            return _debug(e.message);
        }

        // set important styling
        my.stage.style.overflow = 'hidden';

        // adjust styling to touch devices
        if (isTouch)
        {
            my.stage.style.webkitOverflowScrolling = 'touch';
            my.stage.style.overflowX = settings.triggerDirection.indexOf('x') >= 0 ? 'scroll' : 'hidden';
            my.stage.style.overflowY = settings.triggerDirection.indexOf('y') >= 0 ? 'scroll' : 'hidden';
        }

        registerListeners();
    }

    /**
     * Returns the width of the scrollable content by summing up all item widths.
     *
     * @public
     */
    Fluffy.getContentWidth = function ()
    {
        // right now i don't know why, but somehow contentWidth needs to have
        // a puffer of 2px, otherwise in some browsers the last item doesn't
        // fit in and causes a line break
        for (var i = 0, contentWidth = 2; i < my.items.length; i++)
            contentWidth += my.items[i].offsetWidth;

        // 1px buffer
        return contentWidth;
    }

    /**
     * Returns the smallest or tallest height of the scrollable content by
     * checking each item for it's height.
     *
     * @public
     */
    Fluffy.getContentHeight = function ()
    {
        var smallest = my.items[0].offsetHeight;
        var tallest = 0;

        for (var i = 0; i < my.items.length; i++)
        {
            if (my.items[i].offsetHeight > tallest)
                tallest = my.items[i].offsetHeight;

            if (my.items[i].offsetHeight < smallest)
                smallest = my.items[i].offsetHeight;
        }

        return [ smallest, tallest ];
    }

    /**
     * Debugging helper. Prints additional information if debugging is enabled.
     *
     * @private
     * @param {string} message Message to be printed.
     */
    function _debug (message)
    {
        if (!settings.debug || (!window.console || !console.debug))
            return;

        console.debug('[Fluffy] ' + (typeof message === 'string' ? message : JSON.stringify(message)));
    }

    /**
     * Removes a class from a given DOM element.
     *
     * @private
     * @param {object} el DOM Element.
     * @param {string} name Name of the class.
     */
    function _removeClass (el, name)
    {
        // use DOMTokenList
        if (typeof el.classList === 'object')
            return el.classList.remove(name);

        var className = el.className.split(' ');
        className.splice(className.indexOf(name), 1);
        el.className = className.join(' ');
    }

    /**
     * Adds a class to a given DOM element.
     *
     * @private
     * @param {object} anchor DOM element.
     * @param {string} name Name of the class.
     */
    function _addClass (el, name)
    {
        // use DOMTokenList
        if (typeof el.classList === 'object')
            return el.classList.add(name);

        el.className += ' ' + name;
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
        var start = AnimationFrame.now(),
            handle = { run: true };

        function loop()
        {
            var current = AnimationFrame.now(),
                delta = current - start;

            if (delta >= delay && handle.run)
            {
                fn.call();
                start = AnimationFrame.now();
            }

            handle.value = window.requestAnimationFrame(loop);
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
    function _clearInterval (handle)
    {
        window.cancelAnimationFrame(handle.value);
        handle.run = false;
    }

    /**
     * Removes text nodes and unneeded DOM elements from the item list.
     *
     * @private
     * @param {object} items Fluffy content items.
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
     * Returns the Fluffy container element.
     *
     * @private
     */
    function getContainer ()
    {
        my.container = document.querySelector(settings.containerSelector);

        if (my.container === null)
            throw Error('Container \'' + settings.containerSelector + '\' is undefined.');

        return my.container;
    }

    /**
     * Returns the Fluffy trigger element.
     *
     * @private
     */
    function getTrigger ()
    {
        // use trigger selector if given
        my.trigger = (settings.triggerSelector === null) ? getContainer() : document.querySelector(settings.triggerSelector);

        if (my.trigger === null)
            throw Error('Trigger \'' + settings.containerSelector + '\' is undefined.');

        return my.trigger;
    }

    /**
     * Returns the Fluffy stage element.
     *
     * @private
     */
    function getStage ()
    {
        my.stage = document.querySelector(settings.stageSelector);

        if (my.stage === null)
            throw Error('Stage \'' + settings.stageSelector + '\' is undefined.');

        return my.stage;
    }

    /**
     * Returns the Fluffy content element.
     *
     * @private
     */
    function getContent ()
    {
        my.content = document.querySelector(settings.contentSelector);

        if (my.content === null)
            throw Error('Content \'' + settings.contentSelector + '\' is undefined.');

        return my.content;
    }

    /**
     * Returns the Fluffy content items list.
     *
     * @private
     */
    function getItems ()
    {
        var items = (settings.itemSelector !== null) ? document.querySelectorAll(settings.itemSelector) : my.content.childNodes;

        return my.items = _cleanItems(items);
    }

    /**
     * Returns the Fluffy scrollbar element.
     *
     * @private
     */
    function getScrollbar ()
    {
        // scrollbar disabled
        if (!settings.showScrollbar)
            return;

        _debug('Creating scrollbars.');

        // try to get scrollbar container
        var scrollbar = document.querySelector(settings.scrollbarSelector);

        if (scrollbar === null)
            throw Error('Scrollbar \'' + settings.scrollbarSelector + '\' is undefined.');

        // add horizontal scrollbar
        if (settings.triggerDirection.indexOf('x') >= 0)
        {
            my.scrollbar.left = document.createElement('span');
            scrollbar.appendChild(my.scrollbar.left);
            _addClass(my.scrollbar.left, 'is-left');
        }

        // add vertical scrollbar
        if (settings.triggerDirection.indexOf('y') >= 0)
        {
            my.scrollbar.top = document.createElement('span');
            scrollbar.appendChild(my.scrollbar.top);
            _addClass(my.scrollbar.top, 'is-top');
        }

        return my.scrollbar;
    }

    /**
     * Returns the total scrollable height.
     *
     * @private
     */
    function getScrollableHeight ()
    {
        return my.content.offsetHeight - my.stage.offsetHeight;
    }

    /**
     * Returns the total scrollable width.
     *
     * @private
     */
    function getScrollableWidth ()
    {
        return my.content.offsetWidth - my.stage.offsetWidth;
    }

    /**
     * Returns the mouse position within the trigger area.
     *
     * @private
     * @param {object} e Mouse moving event.
     */
    function getMousePosition (e)
    {
        /**
         * normalizing the offsetX, offsetY. thanks jack moore!
         * @see http://www.jacklmoore.com/notes/mouse-position/
         */
        e = e || window.event;

        var style = my.trigger.currentStyle || window.getComputedStyle(my.trigger, null),
            rect = my.trigger.getBoundingClientRect(),

            // trigger element borders
            border = {
                left: style.borderLeftWidth | 0,
                right: style.borderRightWidth | 0,
                top: style.borderTopWidth | 0,
                bottom: style.borderBottomWidth | 0
            },

            // the border width and offset needs to be subtracted from the mouse position
            gap = {
                left: rect.left + border.left,
                right: border.left + border.right,
                bottom: border.top + border.bottom,
                top: rect.top + border.top
            };

        // retrieve value between 0 > value <= rect.{width,height}
        return {
            x: (settings.triggerDirection.indexOf('x') >= 0) ? Math.min(Math.max(0, e.clientX - gap.left), rect.width - gap.right) : 0,
            y: (settings.triggerDirection.indexOf('y') >= 0) ? Math.min(Math.max(0, e.clientY - gap.top), rect.height - gap.bottom) : 0
        }
    }

    /**
     * Returns the fake mouse position which is adjusted to the set padding and
     * mapped to the stage position.
     *
     * @private
     */
    function getFakeMousePosition ()
    {
        // retrieve value between 0 > value <= rect.{width,height}
        return {
            x: (settings.triggerDirection.indexOf('x') >= 0) ? Math.min(Math.max(0, mouse.real.x - settings.mousePadding), mouse.moveArea.width) * ratio.moveAreaToContent.width : 0,
            y: (settings.triggerDirection.indexOf('y') >= 0) ? Math.min(Math.max(0, mouse.real.y - settings.mousePadding), mouse.moveArea.height) * ratio.moveAreaToContent.height : 0
        }
    }

    /**
     * Updates the size of the content element according the the calculated
     * width and height.
     *
     * @private
     */
    function updateContentSize ()
    {
        _debug('Updating content container size.');

        // set content width
        my.content.style.width = Fluffy.getContentWidth() + 'px';

        // if y-axis should be triggered or smart height is enabled
        // set stage height aswell
        if (settings.triggerDirection.indexOf('y') >= 0 || settings.smartHeight !== false)
            my.content.style.height = Fluffy.getContentHeight()[(settings.smartHeight === 'smallest') ? 0 : 1] + 'px';
    }

    /**
     * Updates the position of the scrollbar relative to the current scrolled
     * position within the content area.
     *
     * @private
     */
    function updateScrollbarPosition ()
    {
        if (!settings.showScrollbar)
            return;

        if (settings.triggerDirection.indexOf('x') >= 0)
            my.scrollbar.left.style.left = my.stage.scrollLeft / getScrollableWidth() * (1 - my.scrollbar.left.offsetWidth / my.stage.offsetWidth) * 100 + '%';

        if (settings.triggerDirection.indexOf('y') >= 0)
            my.scrollbar.top.style.top = my.stage.scrollTop / getScrollableHeight() * (1 - my.scrollbar.top.offsetHeight / my.stage.offsetHeight) * 100 + '%';
    }

    /**
     * Scrolls the stage to the given position according to the trigger axis set.
     *
     * @private
     */
    function scrollStageTo (pos)
    {
        if (settings.triggerDirection.indexOf('x') >= 0)
            my.stage.scrollLeft = pos.x;

        if (settings.triggerDirection.indexOf('y') >= 0)
            my.stage.scrollTop = pos.y;
    }

    /**
     * Runs several calculations needed for proper scrolling animation.
     *
     * @private
     */
    function calculateRatios ()
    {
        _debug('Calculating ratios.');

        // available mousemove area
        mouse.moveArea = {
            width: my.trigger.offsetWidth - (settings.mousePadding * 2),
            height: my.trigger.offsetHeight - (settings.mousePadding * 2)
        };

        // map position in moving area to content position
        ratio.moveAreaToContent = {
            width: getScrollableWidth() / mouse.moveArea.width,
            height: getScrollableHeight() / mouse.moveArea.height
        };
    }

    /**
     * Registers all listeners needed in order to track mouse positioning,
     * window resizing and scrolling calculations.
     *
     * @private
     */
    function registerListeners ()
    {
        window.addEventListener('load', function ()
        {
            // remove loading state
            if (my.container)
                _removeClass(my.container, 'is-loading');

            // update content sizes
            updateContentSize();

            // stop right here if touch device!
            if (isTouch)
                return;

            // gimme fake scrollbar
            if (settings.showScrollbar)
            {
                _addClass(my.container, 'has-scrollbar');

                // update scrollbar position on scroll
                my.stage.addEventListener('scroll', function (e) { updateScrollbarPosition(); });
            }

            // run important calculations
            calculateRatios();

            _debug('Registering event listeners.');

            my.trigger.addEventListener('mousemove', function (e)
            {
                // start mouse observer if not already started
                if (mouse.observer.status() === false)
                    mouse.observer.start();

                // get real mouse position in trigger area
                mouse.real = getMousePosition(e);

                // get fake mouse position (adjusted to set padding, mapped to stage position)
                mouse.fake = getFakeMousePosition();
            });

            // start mouse observer
            mouse.observer.start = function ()
            {
                _debug('Starting mouse observer.');

                // add modifier to container that it's moving
                _addClass(my.container, 'is-moving');

                mouse.observer.process = _requestInterval(function()
                {
                    // make mouse move triggering more lazy
                    var add = {
                        x: (mouse.fake.x - mouse.last.x) / settings.mouseDamp,
                        y: (mouse.fake.y - mouse.last.y) / settings.mouseDamp
                    }

                    // stop observing as no movement is going on
                    if (mouse.observer.status() && Math.abs(add.x) < 0.001 && Math.abs(add.y) < 0.001)
                    {
                        // stop observing
                        mouse.observer.stop();

                        // remove modifier
                        _removeClass(my.container, 'is-moving');
                    }

                    // scroll to new position
                    scrollStageTo({
                        x: (mouse.last.x += add.x),
                        y: (mouse.last.y += add.y)
                    });

                }, 10);
            }

            // stop mouse observer
            mouse.observer.stop = function ()
            {
                _debug('Stopping mouse observer.');
                _clearInterval(mouse.observer.process);
            }

            // mouse observer status
            mouse.observer.status = function () { return mouse.observer.process.run; }
        });

        // we're gonna debounce the resize event...
        var debounce;

        window.addEventListener('resize', function ()
        {
            // wait for it
            if (debounce)
                clearTimeout(debounce);

            debounce = setTimeout(function () {

                // first update sizes then
                updateContentSize();

                // run important calculations
                calculateRatios();

                // update scrollbar if shown
                updateScrollbarPosition();

            }, 100);

        });
    }
}).call(this);
