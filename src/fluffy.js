/**
 * An even better animation frame.
 *
 * @copyright Oleg Slobodskoi 2013
 * @website https://github.com/kof/animationFrame
 * @license MIT
 */
(function(window){"use strict";var nativeRequestAnimationFrame,nativeCancelAnimationFrame;(function(){var i,vendors=["webkit","moz","ms","o"],top;try{window.top.name;top=window.top}catch(e){top=window}nativeRequestAnimationFrame=top.requestAnimationFrame;nativeCancelAnimationFrame=top.cancelAnimationFrame||top.cancelRequestAnimationFrame;for(i=0;i<vendors.length&&!nativeRequestAnimationFrame;i++){nativeRequestAnimationFrame=top[vendors[i]+"RequestAnimationFrame"];nativeCancelAnimationFrame=top[vendors[i]+"CancelAnimationFrame"]||top[vendors[i]+"CancelRequestAnimationFrame"]}nativeRequestAnimationFrame&&nativeRequestAnimationFrame(function(){AnimationFrame.hasNative=true})})();function AnimationFrame(options){if(!(this instanceof AnimationFrame))return new AnimationFrame(options);options||(options={});if(typeof options=="number")options={frameRate:options};options.useNative!=null||(options.useNative=true);this.options=options;this.frameRate=options.frameRate||AnimationFrame.FRAME_RATE;this._frameLength=1e3/this.frameRate;this._isCustomFrameRate=this.frameRate!==AnimationFrame.FRAME_RATE;this._timeoutId=null;this._callbacks={};this._lastTickTime=0;this._tickCounter=0}AnimationFrame.FRAME_RATE=60;AnimationFrame.shim=function(options){var animationFrame=new AnimationFrame(options);window.requestAnimationFrame=function(callback){return animationFrame.request(callback)};window.cancelAnimationFrame=function(id){return animationFrame.cancel(id)};return animationFrame};AnimationFrame.now=Date.now||function(){return(new Date).getTime()};AnimationFrame.navigationStart=AnimationFrame.now();AnimationFrame.perfNow=function(){if(window.performance&&window.performance.now)return window.performance.now();return AnimationFrame.now()-AnimationFrame.navigationStart};AnimationFrame.hasNative=false;AnimationFrame.prototype.request=function(callback){var self=this,delay;++this._tickCounter;if(AnimationFrame.hasNative&&self.options.useNative&&!this._isCustomFrameRate){return nativeRequestAnimationFrame(callback)}if(!callback)throw new TypeError("Not enough arguments");if(this._timeoutId==null){delay=this._frameLength+this._lastTickTime-AnimationFrame.now();if(delay<0)delay=0;this._timeoutId=window.setTimeout(function(){var id;self._lastTickTime=AnimationFrame.now();self._timeoutId=null;++self._tickCounter;for(id in self._callbacks){if(self._callbacks[id]){if(AnimationFrame.hasNative&&self.options.useNative){nativeRequestAnimationFrame(self._callbacks[id])}else{self._callbacks[id](AnimationFrame.perfNow())}delete self._callbacks[id]}}},delay)}this._callbacks[this._tickCounter]=callback;return this._tickCounter};AnimationFrame.prototype.cancel=function(id){if(AnimationFrame.hasNative&&this.options.useNative)nativeCancelAnimationFrame(id);delete this._callbacks[id]};if(typeof exports=="object"&&typeof module=="object"){module.exports=AnimationFrame}else if(typeof define=="function"&&define.amd){define(function(){return AnimationFrame})}else{window.AnimationFrame=AnimationFrame}})(window);

/*! Fluffy.js 1.0.0
 *
 * Sebastian Prein
 * Copyright 2014, MIT License
 */
(function()
{
    'use strict';

    var root;

    root = (typeof exports === 'object') ? exports : this;
    root.Fluffy || (root.Fluffy = { });

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
        // allowed values: null, tallest, smallest
        smartHeight: null,

        // the stage holding the scrollable content
        stageSelector: '#fluffy-stage',

        // if no trigger selector is given, the parent node of the content
        // selector is also the trigger area
        // triggerSelector: null,

        // define which axis to trigger movement for
        // allowed values: x, y, xy
        // triggerDirection: 'x'
    };

    // dom elements
    var my = { container: null, scrollbar: null, stage: null, content: null, items: null };

    // user settings
    var settings;

    // mouse data
    var mouse =
    {
        // last position
        last: 0,

        // real position
        real: 0,

        // modified position
        fake: 0,

        // move padding
        padding: 60,

        // response softness
        damp: 20,

        // available moving area
        moveArea: 0,

        // fidderence ratio based on moving area
        fidderenceRatio: 0,

        // interval watching mouse position
        observer: null
    }

    // calculation data
    var calc = {

        // width difference ratio betwen container and stage
        widthRatio: 0
    }


    /**
     * Initialize Fluffy.
     *
     * @public
     * @param {object} options User set options to override default.
     */
    Fluffy.init = function (options)
    {
        // set version
        Fluffy.version = '1.0.0';

        // use default settings and override options if given
        settings = defaults;

        if (options !== undefined && options !== null && typeof options === 'object')
            Object.keys(options).forEach(function (key)
            {
                if (settings[key] !== undefined)
                    settings[key] = options[key];
            });

        // feature test
        if (!supports)
            return _debug('Browser has no support for \'querySelector\' or \'addEventListener\'.');

        // check for dom elements
        my.container = getContainer();
        my.scrollbar = getScrollbar();
        my.stage = getStage();
        my.content = getContent();
        my.items = getItems();

        registerListeners();
    };

    /**
     * Returns the width of the scrollable content by summing up all item widths.
     *
     * @public
     */
    Fluffy.getContentWidth = function ()
    {
        for (var i = 0, contentWidth = 0; i < my.items.length; i++)
            contentWidth += my.items[i].offsetWidth;

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
        };

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

        console.debug('Fluffy: ' + message);
    };

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
    };

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
    };

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
        if (!window.requestAnimationFrame)
            return window.setInterval(fn, delay);

        var start = AnimationFrame.now(),
            handle = new Object();

        function loop()
        {
            var current = AnimationFrame.now(),
                delta = current - start;

            if (delta >= delay)
            {
                fn.call();
                start = AnimationFrame.now();
            }

            handle.value = requestAnimationFrame(loop);
        };

        handle.value = requestAnimationFrame(loop);
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
        window.cancelAnimationFrame ? window.cancelAnimationFrame(handle.value) : clearInterval(handle);
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
    };

    /**
     * Returns the Fluffy container element.
     *
     * @private
     */
    function getContainer ()
    {
        my.container = document.querySelector(settings.containerSelector);

        if (my.container === null)
            _debug('Container \'' + settings.containerSelector + '\' not found.');

        return my.container;
    };

    /**
     * Returns the Fluffy stage element.
     *
     * @private
     */
    function getStage ()
    {
        my.stage = document.querySelector(settings.stageSelector);

        if (my.stage === null)
            _debug('Stage \'' + settings.stageSelector + '\' not found.');

        return my.stage;
    };

    /**
     * Returns the Fluffy content element.
     *
     * @private
     */
    function getContent ()
    {
        my.content = document.querySelector(settings.contentSelector);

        if (my.content === null)
            _debug('Content \'' + settings.contentSelector + '\' not found.');

        return my.content;
    };

    /**
     * Returns the Fluffy content items list.
     *
     * @private
     */
    function getItems ()
    {
        var items = (settings.itemSelector !== null) ? document.querySelectorAll(settings.itemSelector) : my.content.childNodes;

        return my.items = _cleanItems(items);
    };

    /**
     * Returns the Fluffy scrollbar element.
     *
     * @private
     */
    function getScrollbar ()
    {
        my.scrollbar = document.querySelector(settings.scrollbarSelector);

        if (my.scrollbar === null)
            _debug('scrollbar \'' + settings.scrollbarSelector + '\' not found.');

        return my.scrollbar;
    };

    /**
     * Returns the total scrollable width.
     *
     * @private
     */
    function getScrollableWidth ()
    {
        return my.content.offsetWidth - my.stage.offsetWidth;
    };

    /**
     * Returns the position of the scrollbar relative to the current scrolled
     * position within the content area.
     *
     * @private
     */
    function getScrollbarPosition ()
    {
        return (my.stage.scrollLeft / getScrollableWidth() * (100 - (my.scrollbar.offsetWidth / my.stage.offsetWidth * 100))) + '%' ;
    };

    /**
     * Returns the scrolling position relative to the given position data.
     *
     * @private
     * @param {int} pos Mouse position.
     */
    function getScrollPosition (pos)
    {
        // position relative to container and stage (if it's got an offset)
        pos -= my.container.offsetLeft - my.stage.offsetLeft;

        // new scroll position
        return Math.min(Math.max(0, pos), my.container.offsetWidth);
    };

    /**
     * Runs several calculations needed for proper scrolling animation.
     *
     * @private
     */
    function runCalculations ()
    {
        // width ratio between content and stage
        calc.widthRatio = (my.content.offsetWidth / my.stage.offsetWidth) - 1;

        // available mousemove area
        mouse.moveArea = my.stage.offsetWidth - (mouse.padding * 2);

        // available mousemove fidderence ratio
        mouse.fidderenceRatio = (my.stage.offsetWidth / mouse.moveArea);
    }

    /**
     * Registers all listeners needed in order to track mouse positioning,
     * window resizing and scrolling calculations.
     *
     * @private
     */
    function registerListeners ()
    {
        // gimme fake scrollbar (not on touch)
        if (settings.showScrollbar && !isTouch)
        {
            _addClass(my.container, 'has-scrollbar');

            // update scrollbar position on scroll
            my.stage.addEventListener('scroll', function (e)
            {
                my.scrollbar.style.left = getScrollbarPosition();
            });
        }

        // use native scrolling on touch device (see css)
        if (isTouch)
            _addClass(my.container, 'is-touch');

        window.onload = function ()
        {
            // remove loading state
            if (my.container)
                _removeClass(my.container, 'is-loading');

            // set content width
            my.content.style.width = Fluffy.getContentWidth() + 'px';

            // if enabled the stage will get the height
            // of the smallest/tallest element
            if (settings.smartHeight !== null)
            {
                my.container.style.height = 'auto';
                my.stage.style.height = Fluffy.getContentHeight()[(settings.smartHeight === 'smallest') ? 0 : 1] + 'px';
            }

            // stop right here if touch device!
            if (isTouch)
                return;

            // run important calculations
            runCalculations();

            my.stage.addEventListener('mousemove', function (e)
            {
                mouse.real = getScrollPosition(e.pageX);
                mouse.fake = Math.floor(Math.min(Math.max(0, mouse.real - mouse.padding), mouse.moveArea) * mouse.fidderenceRatio);
            });

            // run mouse observer
            mouse.observer = _requestInterval(function()
            {
                // zeno's paradox equation "catching delay"
                mouse.last += (mouse.fake - mouse.last) / mouse.damp;

                // update scroll
                my.stage.scrollLeft = mouse.last * calc.widthRatio;

            }, 10);
        }

        window.onresize = function ()
        {
            // run important calculations
            runCalculations();

            // set content width
            my.content.style.width = Fluffy.getContentWidth() + 'px';

            // update scrollbar if shown
            if (settings.showScrollbar)
                my.scrollbar.style.left = getScrollbarPosition();
        }
    }
}).call(this);
