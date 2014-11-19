# Fluffy.js 2.0.0

A simple, light and flexible JavaScript library that makes your content – no matter how big it is – fit in any screen! 

– [http://mzdr.github.io/fluffy.js/](http://mzdr.github.io/fluffy.js/)

Sebastian Prein  
Copyright 2014, MIT License

Contributions are greatly appreciated. Please fork this repository and open a pull request to add features, improvements, bugfixes etc.

## Usage

To get started just download the latest stable version from here and move all the files from the zip archive to the respective folder in your project. When you've done that, go on!

Now let me explain you how Fluffy works. Everything that is related to it gets into the Fluffy container.

```html
<div data-fluffy-container>
    …
</div>
```

This helps Fluffy to correctly inject elements and classes for several states of execution. You can use an existing element or create a new one, all it needs is the `data-fluffy-container` attribute.

Your actual content is an element with the `data-fluffy-content` attribute.

```html
<div data-fluffy-container>
    <div data-fluffy-content>
        <!-- your content -->
    </div>
</div>
```

Well, that's almost it. All that's left is the almighty magic and a little bit of styling, which is by the way just a real basic styling to have a minimal visual feedback at least. Feel free to do whatever you like with it!

```html
<link rel="stylesheet" href="path/to/fluffy.min.css">
<script src="path/to/fluffy.min.js"></script>
```

**That's it!** Open your browser and see for yourself!

## Options

Since each Fluffy container is an instance on its own you're able to customize each one independently with the `data-fluffy-options='…'` attribute. This takes a **JSON** string with all of the options you want to change.

For example if you don't want to have scrollbars and a separate trigger instead, it would look like this:

```html
<div data-fluffy-container 
     data-fluffy-options='{"showScrollbars": false, "triggerSelector": "#my-trigger"}'>
    <div data-fluffy-content>
        <!-- your content -->
    </div>
</div>
```


Below is a list of all available options.

`triggerSelector: null`  
Defines a separate element which is used to trigger the actual interaction with the Fluffy content. If the target element doesn't exist, the container will be used as fallback/default.  

`showScrollbars: true`  
Displays the current position within the scrollable content in forms of scrollbars.  

`smartHeight: false`  
Automatically adjust the height of the content container according to the smallest, largest or the average height of all items found.  
  
Allowed values: false, 'smallest', 'average', 'largest'.  

`smartWidth: false`  
See smartHeight, just for width this time.  
  
Allowed values: false, 'smallest', 'average', 'largest'.  

`triggerDirection: 'x'`  
Define which axis to trigger movement for. Allowed values: x, y, xy.  

`mouseDamp: 20`  
The higher the value the more lazier the reaction to the mouse movement will be.  

`mousePadding: 60`  
Adds space (in pixel) to the trigger area where no action happens.  

