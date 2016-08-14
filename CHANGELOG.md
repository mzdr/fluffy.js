# 2.1.1 (2016-08-14)

Just fucked up last publish on NPM. -.-

# 2.1.0 (2016-08-14)

Features:

- Added module support for AMD and Node
- Added public .create() method
- Added public .detect() method
- Improved error handling and warnings to be more helpful

# 2.0.3 (2016-07-16)

Bugfixes:

- Fluffy now waits for the DOM to finish before initializing itself

# 2.0.2 (2016-04-09)

- Fixed "main" tag in `bower.json`

# 2.0.1 (2015-05-22)

- Added Fluffy.js to Bower registry.

# 2.0.0 (2015-02-08)

Features:

- Dropped support for IE9
- Added support for multiple instances of Fluffy
- Added automatic initialization of Fluffy (drops options object as well)
- Each instance can be customized via data attributes now
- Simplified necessary markup
- Dropped debugging messages in favor of real warning messages when needed
- Scrolling is now based on CSS3 transform instead of scroll property
- Refactored the whole library to an object orientated base
- SmartWidth/smartHeight are able to return the average size now

Bufixes:

- Removed contentWidth hack in favor of correct calculations
- Fixed smartWidth/smartHeight returning incorrect values

# 1.1.0 (2014-09-07)

Features:

- Added option `triggerDirection` to define which axis to trigger movement for
- Added option `triggerSelector` to specify a different element for triggering movement
- Added option `mouseDamp` to adjust movement reaction speed
- Added option `mousePadding` to added dead space in trigger area
- Added `is-moving` modifier to container when movement is going on

Bugfixes:

- Improved behaviour when elements are not found in the DOM
- Improved debugging function when trying to print objects

# 1.0.0 (2014-09-02)

- First official release
