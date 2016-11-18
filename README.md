<img src="https://raw.githubusercontent.com/brainfoolong/greaterfield/gh-pages/images/logo-grey-bg.png" width="100%" />

# Greaterfield
Improvements for Battlefield Web Companion and the Battlefield Forums!

# Downloads - Beta
* Google Chrome: https://chrome.google.com/webstore/detail/gnpnfbnogbhgbcgejjdanillfkoljdlg
* Firefox: https://github.com/brainfoolong/greaterfield/releases - Download and install the XPI file
* **Note:** Firefox is not in Mozilla AMO store because we have integrated plugins that are being loaded directly from our github repository, which is forbidden by mozilla rules. Chrome is fine, though. So, you have to install it manually. We do not provide automatic update for firefox add-ons, so you have to check updates manually. Firefox is too restrictive in their policy for us to work good with it. To make it work good, we have to remove community plugins.
* **Note2:** We will try a new run in Mozilla AMO store because we remove plugin support from greaterfield. Contribute directly in the core instead. It's even easier as plugin development.

<img src="https://raw.githubusercontent.com/brainfoolong/greaterfield/gh-pages/images/screenshots/1.jpg" width="33%" />
<img src="https://raw.githubusercontent.com/brainfoolong/greaterfield/gh-pages/images/screenshots/2.jpg" width="33%" />
<img src="https://raw.githubusercontent.com/brainfoolong/greaterfield/gh-pages/images/screenshots/3.jpg" width="33%" />

# What to contribute?
* Themes - https://github.com/brainfoolong/greaterfield/tree/master/shared/themes
* Plugins - Dropped, contribute to the core instead. It's even easier as separate plugin development.
* Translations - Install extension, Menu => Translations - Those changes will than be submitted to our github repository.
* Core - Guide coming soon

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
