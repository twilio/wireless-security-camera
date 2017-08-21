# Security Camera Blueprint
### Front-end single page application
The scripts located in this directory are meant to run on [Twilio Runtime](https://www.twilio.com/docs/api/runtime/functions). These scripts are meant to be bundled into SPA artifacts to be uploaded to Twilio Runtime.

Full instructions for this tutorial can be found in the [Security Camera Blueprint](https://www.twilio.com/wireless/blueprints/security-camera/). Below you will find the minimum steps necessary to build these SPA artifacts.

### What is Twilio Runtime?
Twilio Runtime is a suite designed to help you build, scale and operate your application, consisting of a plethora of tools including helper libraries, API keys, asset storage, debugging tools, and a node based serverless hosting environment [Twilio Functions](https://www.twilio.com/docs/api/runtime/functions).

### Deploy Runtime assets
Runtime assets are used to host the front-end of this Blueprint. The front-end is written using the [AngularJS](https://angularjs.org/) framework and compiled as a [single page application](https://en.wikipedia.org/wiki/Single-page_application). To deploy, you need to download the latest version of **index.html** and **index.min.js** from the **assets** folder.

You may modify these files as you wish and bundle up by running the following commands in a terminal from the root directory:

```
make prepare
make
```

Visit the [Security Camera Blueprint](https://www.twilio.com/wireless/blueprints/security-camera/) for more information.
