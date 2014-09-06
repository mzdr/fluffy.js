# Fluffy.js 1.1.0

A simple, light and flexible JavaScript library that empowers you, to create content that anyone can interact with in a real fluffy way.

Sebastian Prein  
Copyright 2014, MIT License

Contributions are greatly appreciated. Please fork this repository and open a pull request to add features, improvements, bugfixes etc.

## Usage

Fluffy is plain JavaScript. There's no need for heavy frameworks like jQuery or similar. It's totally fluid responsive, touch device friendly, super easy to customize and weights about **8KB** only.  

Just download the latest version from here and move it to your project. In your HTML file, where you want to have your fluffy area, make sure your markup looks like this:

```HTML
<div id="fluffy-container" class="fluffy-container is-loading">
    <div id="fluffy-scrollbar" class="fluffy-scrollbar"></div>
    <div id="fluffy-stage" class="fluffy-stage">
        <ul id="fluffy-content" class="fluffy-content">
            <li class="fluffy-item">…</li>
            …
        </ul>
    </div>
</div>
```

All IDs (`#fluffy-*`) are used to grab the respective DOM elements by the JavaScript logic. You can use different IDs, just remember to tell Fluffy which selectors it should look for. Feel free to adjust any class used by Fluffy to your liking, but be careful as you might break something.  

If everything is set up just include the almighty magic and you're ready to go.

```HTML
<script src="path/to/fluffy.min.js"></script>
<script>Fluffy.init({ options });</script>
```

## Options

This list shows all the available options and their default values.  

The overall Fluffy container holding everything together.  
`containerSelector: '#fluffy-container'`

The selector for the actual content.  
`contentSelector: '#fluffy-content'`

Enable debugging in case the output isn't as expected. See your browsers console for more information.  
`debug: false`

Selector to pick items, if none given all children in the content container will be picked.  
`itemSelector: null`

Selector for the scrollbar.  
`scrollbarSelector: '#fluffy-scrollbar'`

Displays the current position within the scrollable content in form of a scrollbar.  
`showScrollbar: true`

Automatically adjust the height of the content container either relative to the smallest or tallest element found. Allowed values: false, 'tallest', 'smallest'.  
`smartHeight: false`

The stage holding the scrollable content.  
`stageSelector: '#fluffy-stage'`

If no trigger selector is given, the Fluffy container is also the trigger area.  
`triggerSelector: null`

Define which axis to trigger movement for. Allowed values: x, y, xy.  
`triggerDirection: 'x'`

The higher the value the more lazier the reaction to the mouse movement will be.  
`mouseDamp: 20`

Adds space (in pixel) to the trigger area where no action happens.  
`mousePadding: 60`

## Support

Fluffy has been tested in those browsers successfully:  

- Google Chrome 37
- Mozilla Firefox 31
- Safari 7
- Windows Internet Explorer 9
- Android Browser 4.3
- iOS Safari 7.1
