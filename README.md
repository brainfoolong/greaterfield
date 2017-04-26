<img src="https://raw.githubusercontent.com/brainfoolong/greaterfield/gh-pages/images/logo-grey-bg.png" width="100%" />

# Greaterfield
Improvements for Battlefield Web Companion and the Battlefield Forums!

# Development discontinued
Development for this extension has been discontinued. Thanks for all that helped here.

# Downloads - Beta
* Google Chrome: https://chrome.google.com/webstore/detail/gnpnfbnogbhgbcgejjdanillfkoljdlg

<img src="https://raw.githubusercontent.com/brainfoolong/greaterfield/gh-pages/images/screenshots/1.jpg" width="33%" />
<img src="https://raw.githubusercontent.com/brainfoolong/greaterfield/gh-pages/images/screenshots/2.jpg" width="33%" />
<img src="https://raw.githubusercontent.com/brainfoolong/greaterfield/gh-pages/images/screenshots/3.jpg" width="33%" />

# What to contribute?
* Themes - https://github.com/brainfoolong/greaterfield/tree/master/shared/themes
* Plugins - Dropped, contribute to the core instead. It's even easier as separate plugin development.
* Translations - Install extension, Menu => Translations - Those changes will than be submitted to our github repository.
* Core - https://github.com/brainfoolong/greaterfield/wiki/Core-development

# How to install the development version of this extension?
This is the default way for development for this extension. It's super fast and agile, every change is instantly testable when you just reload the page.
* Clone the master repository to disk
* Chrome
    * Open the Extensions window
    * Enable the 'Developer mode' checkbox
    * Click 'Load unpacked extension...' and point to the cloned repository folder
* Firefox
    * Open the Add-ons window
    * Click the settings icon at the top right (beside the 'Search all add-ons' field) and click on 'Debug Add-ons'
    * Enable add-on debugging
    * Click 'Load Temporary Add-on' and point to the cloned repository folder -> `manifest.json`

# Coding standards and guide lines
* JS strict mode
* ECMA Script 6 support (Template literals, classes, etc...) http://es6-features.org/
* CRLF line endings
* 4 space indents
* opening curly braces in same line with other code
* closing curly braces in new line
* speaking, short names for variables and methods
* JSDoc for each method and object variable, as best as possible
