io
==

RSS reader for Invisible Oranges built for class

Installation steps

1.  Initialize a new phonegap application

phonegap create io com.example.io io


2.  Install the following phonegap plugins

org.apache.cordova.device-motion
org.apache.cordova.device-orientation
org.apache.cordova.inappbrowser
org.apache.cordova.splashscreen


phonegap local plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-splashscreen.git
phonegap local plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-inappbrowser.git
phonegap local plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-device-motion.git
phonegap local plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-device-orientation.git


3. copy these files in www to the phonegap www

4. build for your device platform or run in the phonegap developer app

run android
run ios

or

phonegap serve
