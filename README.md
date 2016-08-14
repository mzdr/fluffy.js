# Fluffy.js [![GitHub release](https://img.shields.io/github/release/mzdr/fluffy.js.svg?maxAge=86400)](https://github.com/mzdr/fluffy.js/releases/latest)

A simple, light and flexible JavaScript library that makes your content – no matter how big it is – fit in any screen!

– http://mzdr.github.io/fluffy.js/

Sebastian Prein  
Copyright 2016, MIT License

Contributions are greatly appreciated. Please fork this repository and open a pull request to add features, improvements, bugfixes etc.

## Usage

### Markup

Now let me explain you how Fluffy works.

1. Everything that is related to it gets into the **Fluffy container**. This helps Fluffy to correctly inject elements and classes for several states of execution.

  _Notice: **If** you don't use automatic detection, you can use **any** selector you like. That means you don't have to stick to the data attribute._

  ```html
  <div data-fluffy-container>
      …
  </div>
  ```

2. Your actual content is an element with the `data-fluffy-content` attribute.

  _Notice: The content element **does not** necessarily has to be the **direct child** of the container. But it's **recommended** to do it that way._

  ```html
  <div data-fluffy-container>
      <div data-fluffy-content>
          <!-- your content -->
      </div>
  </div>
  ```

  Your content can be anything you'd like it to be. Check out the [examples](http://mzdr.github.io/fluffy.js/#/examples/) to get glimpse of what possibilities you have.

3. **And that's it *almost it*!**

  Now depending on your setup (either [as a module](#use-it-as-a-module) or [plain in the browser](#use-it-plain-in-the-browser)) you have to hack a little JavaScript or just load the correct files. See below for further instructions.

### Use it as a module

Since Fluffy.js is a [registered](https://www.npmjs.com/package/fluffy.js) NPM package ([Bower](https://bower.io/) too), you can use it as a module.

1. Install it with:

  `npm install --save fluffy.js`

2. Now you can require it anywhere you like:

  ```js
  const Fluffy = require('fluffy.js');

  // Prints 2.1.0
  console.log(Fluffy.version);

  // Start automatic detection
  Fluffy.detect();

  // Or provide a DOM node for single creation
  const myElement = document.querySelector('#what-ever-you-like');

  Fluffy.create(myElement);
  ```

### Use it plain in the browser

If you just want to hit and run, this is probably the best way.

1. Download the [latest stable version](https://github.com/mzdr/fluffy.js/releases/latest) and move all the files from the zip archive to the respective folder in your project.

2. Include the two lines below somewhere in your HTML file.

  ```html
  <link rel="stylesheet" href="PATH/TO/fluffy.min.css">
  <script src="PATH/TO/fluffy.min.js"></script>
  ```

3. **That's it!** Open your browser and see for yourself!

## Options

Since each Fluffy container is an instance on its own you're able to customize each one independently with the `data-fluffy-options='…'` attribute. This takes a **JSON** string with all of the options you want to change.

### Example

Let's say you don't want to have scrollbars and a separate trigger instead. The markup then would look like this:

```html
<div data-fluffy-container
     data-fluffy-options='{"showScrollbars": false, "triggerSelector": "#my-trigger"}'>
    <div data-fluffy-content>
        <!-- your content -->
    </div>
</div>
```

### Available options

Below you see all the available options, their default values and it's description.

| Option | Default | Description |
|--------|---------|-------------|
| triggerSelector | null | Defines a separate element which is used to trigger the actual interaction with the Fluffy content. If the target element doesn't exist, the *container* will be used as fallback/default.<br><br>Allowed values: '*[any valid CSS selector]*'<br>Examples: '#my-trigger', '#id > li:nth-child(8) a + img' |
| showScrollbars | true | Displays the current position within the scrollable content in forms of scrollbars.<br><br>Allowed values: *true*, *false* |
| smartHeight | false | Automatically adjust the height of the content container according to the smallest, largest or the average height of all items found.<br><br>Allowed values: *false*, *'smallest'*, *'average'*, *'largest'*. |
| smartWidth | false | See *smartHeight*, just for *width* this time. |
| triggerDirection | 'x' | Define which axis to trigger movement for.<br><br>Allowed values: *'x'*, *'y'*, *'xy'*. |
| mouseDamp | 20 | The higher the value the more lazier the reaction to the mouse movement will be.<br><br>Allowed values: *[any positive number]* |
| mousePadding | 60 | Adds space (in pixel) to the trigger area where no action happens.<br><br>Allowed values: *[any positive number]* |
