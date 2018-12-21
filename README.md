# homebridge-bravia-tv v3

[![npm](https://img.shields.io/npm/v/homebridge-bravia-tv.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-bravia-tv)
[![npm](https://img.shields.io/npm/dt/homebridge-bravia-tv.svg?style=flat-square)](https://www.npmjs.com/package/homebridge-bravia-tv)
[![GitHub last commit](https://img.shields.io/github/last-commit/SeydX/homebridge-bravia-tv.svg?style=flat-square)](https://github.com/SeydX/homebridge-bravia-tv)

## Homebridge dynamic platform plugin for Sony Bravia Android TVs
>_Note: If you are looking for the non dynamic version, install the old version! [homebridge-sonybravia-platform v2](https://github.com/SeydX/homebridge-sonybravia-platform)_ 


This is a dynamic platform plugin for [Homebridge](https://github.com/nfarina/homebridge) to control your **Sony Bravia Android TV**. 

This plugin supports following functions:

- Switch for **Power** (on/off)
- Switch for the **Inputs** like HDMI, Scart, CEC Devices, AV, WIFI mirroring etc.
- Switch for **Apps**
- Switch for **Channels**
- Bulb for controlling the **Volume**
- Service for a few **remote control commands**

## Why do we need this plugin and whats the difference?

It's the only plugin that exposes nearly all TV functionalities to HomeKit. All created switches has own characteristics which can be accessed in 3rd party apps like Elgato EVE. It has a built in 'settings' characteristics to adjust the plugin parameter whithin an app! It supports the latest homebridge API and has dynamic platform functionality. It can auto detect new apps _(channels coming soon)_ and add them to HomeKit or remove them. It has cache functionality to cache the TV API in your persist folder (to avoid heavy polling). You have the full functionality about the plugin, you can enable/disable all switches/services/bulbs from your config.json file. And many more functions coming soon!

See [Images](https://github.com/SeydX/homebridge-bravia-tv/tree/master/images/) for more details.

## Installation instructions

After [Homebridge](https://github.com/nfarina/homebridge) has been installed:

-  ```sudo npm install -g homebridge-bravia-tv```

## Preparing the TV

- Set **Remote start** to **ON** _(Settings -> Network -> Remote Start)_
- Change **Authentication** to **Normal and Pre-Shared Key** _(Settings -> Network -> IP Control -> Authentication)_
- Enter a **Pre-Shared Key** _(Settings -> Network -> IP control -> Pre-Shared Key)_

## Basic configuration

 ```
{
 "bridge": {
   ...
},
 "accessories": [
   ...
],
 "platforms": [
    {
      "platform": "BraviaTV",
      "name": "TV",
      "ipadress": "192.168.1.1",
      "psk": "YourPSKhere"
    }
]
}
 ```

## Advanced Configuration

 ```
{
 "bridge": {
   ...
},
 "accessories": [
   ...
],
 "platforms": [
    {
      "platform": "BraviaTV",
      "name": "TV",
      "ipadress": "192.168.1.1",
      "port": 80,
      "psk": "YourPSKhere",
      "tvEnabled": true,
      "volumeEnabled": true,
      "inputsEnabled": true,
      "detectCEC": true,
      "extraInputs": false,
      "appsEnabled": true,
      "channelsEnabled": false,
      "remoteControl": false
    }
]
}
 ```

## Options

| **Attributes** | **Required** | **Usage** |
|------------|----------|-------|
| name | **Yes** | **Unique Name** for the Platform.   |
| ipadress | **Yes** | IP adress from your Sony Bravia Android TV |
| port | No | If you have problems with connecting to the TV, try a different port _(Default: 80)_ |
| psk | **Yes** | Your PRE SHARED KEY _(see preparing the TV above)_ |
| tvEnabled | No | Exposes new switch accessory to HomeKit for switching tv on/off with **settings** characteristics |
| inputsEnabled | No | Exposes new switch accessory for HDMI inputs to HomeKit (Default: true) |
| extraInputs | No | Adds extra sources like scart, composite and display mirroring as **characteristics** to the Input switch _(see inputsEnabled)_ (Default: false) |
| detectCEC | No | Adds connected CEC devices as new **characteristics** to the Input Switch and remove 'old' HDMI inputs instead (Default: true) |
| volumeEnabled | No | Exposes bulb accessory to HomeKit to control TV volume (Default: true) |
| appsEnabled | No | Exposes new switch accessory for installed apps to HomeKit (Default: true) |
| channelsEnabled | No | Exposes new switch accessory for all channels to HomeKit (Default: false) |
| remoteControl | No | Exposes remote control to HomeKit (Default: false) |

## In App settings

<img src="https://github.com/SeydX/homebridge-bravia-tv/blob/master/images/inapps_settings.gif" align="right" alt="In-App Settings">

There are more settings available within the app to customize the plugin for your own whishes _(this has the advantage that you do not have to restart homebridge every time you make changes, see gif)_

- **Channel Source:** Defines the source of your channels (DVBT, DVBC coming soon)

- **Favourite App:** One of the installed apps on the TV, needed for the 'main' apps switch and for Off State

- **Favourite Channel:** One of the channels on the TV, needed for the 'main' channels switch and for Off State

- **Favourite Input:** One of the detected inputs on the TV, needed for the 'main' inputs switch and for Off State

- **Max Volume:** Defines the max adjustable volume via the bulb accessory

- **Off State:** Defines the 'off' mode (HOME; CHANNEL; OFF) by i.e. switching the input, app or channel switch off

- **Polling Interval:** Defines the time of polling the TV

## Supported clients

This plugin has been verified to work with the following apps on iOS 11.3:

* Apple Home _(partial)_
* All 3rd party apps like Elgato Eve etc. _(recommended)_


## Known issues | TODO

- ISSUE: At the moment it is not possible to deactivate a CEC device or shutting it down, this plugin activates the option setted in the settings instead (Off State > "HOME" for favourite app, "CHANNEL" for favourite channel and "OFF" for turning the TV off by switching Input switch off)


## Contributing

You can contribute to this homebridge plugin in following ways:

- [Report issues](https://github.com/SeydX/homebridge-bravia-tv/issues) and help verify fixes as they are checked in.
- Review the [source code changes](https://github.com/SeydX/homebridge-bravia-tv/pulls).
- Contribute bug fixes.
- Contribute changes to extend the capabilities

Pull requests are accepted.
