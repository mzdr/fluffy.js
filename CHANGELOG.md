# 2.0.0

Features:

- dropping support for IE9
- added support for multiple instances of Fluffy
- added automatic initialization of Fluffy (drops options object as well)
- each instance can be customized via data attributes now
- simplified necessary markup
- dropped debugging messages in favor of real warning messages when needed
- scrolling is now based on CSS3 transform instead of scroll property
- refactored the whole library to an object orientated base
- smartWidth/smartHeight are able to return the average size now

Bufixes:

- removed contentWidth hack in favor of correct calculations
- fixed smartWidth/smartHeight returning incorrect values

# 1.1.0 (2014-09-07)

Features:

- added option `triggerDirection` to define which axis to trigger movement for
- added option `triggerSelector` to specify a different element for triggering movement
- added option `mouseDamp` to adjust movement reaction speed
- added option `mousePadding` to added dead space in trigger area
- added `is-moving` modifier to container when movement is going on

Bugfixes:

- improved behaviour when elements are not found in the DOM
- improved debugging function when trying to print objects

# 1.0.0 (2014-09-02)

- First official release
