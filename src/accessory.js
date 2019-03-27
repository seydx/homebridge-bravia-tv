'use strict';

const http = require('http');
const HomeKitTypes = require('./types.js');

var Accessory, Service, Characteristic, UUIDGen, PlatformAccessory;

const pluginName = 'homebridge-bravia-tv';
const platformName = 'BraviaTV';

class BRAVIA {
  constructor (platform, type, publish) {

    // HB
    PlatformAccessory = platform.api.platformAccessory;
    Accessory = platform.api.hap.Accessory;
    Service = platform.api.hap.Service;
    Characteristic = platform.api.hap.Characteristic;
    UUIDGen = platform.api.hap.uuid;
    HomeKitTypes.registerWith(platform.api.hap);

    this.platform = platform;
    this.log = platform.log;
    this.api = platform.api;
    this.config = platform.config;
    this.accessories = platform.accessories;

    // STORAGE
    this.storage = require('node-persist');
    this.storage.initSync({
      dir: platform.api.user.persistPath()
    });

    // Error count
    this.errorCount = {
      tv: 0,
      inputs: 0,
      apps: 0,
      channels: 0,
      volume: 0
    };

    // Init req promise
    this.getContent = function (setPath, setMethod, setParams, setVersion) {
      return new Promise((resolve, reject) => {
        var options = {
          host: this.config.ipadress,
          port: this.config.port,
          family: 4,
          path: setPath,
          method: 'POST',
          headers: {
            'X-Auth-PSK': this.config.psk
          }
        };

        var post_data = {
          'method': setMethod,
          'params': [setParams],
          'id': 1,
          'version': setVersion
        };

        var req = http.request(options, function (res) {
          if (res.statusCode < 200 || res.statusCode > 299) {
            reject(new Error('Failed to load data, status code: ' + res.statusCode));
          }

          const body = [];
          res.on('data', (chunk) => body.push(chunk));
          res.on('end', () => resolve(body.join('')));
        });

        req.on('error', (err) => reject(err));

        req.write(JSON.stringify(post_data));
        req.end();
      });
    };
    
    this.getIRCC = function(setIRCC) {

      return new Promise((resolve, reject) => {

        var post_data = '<?xml version="1.0"?><s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body><u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1"><IRCCCode>' + setIRCC + '</IRCCCode></u:X_SendIRCC></s:Body></s:Envelope>';

        var options = {
          host: this.config.ipadress,
          path: '/sony/IRCC',
          port: this.config.port,
          method: 'POST',
          headers: {
            'X-Auth-PSK': this.config.psk,
            'SOAPACTION': '"urn:schemas-sony-com:service:IRCC:1#X_SendIRCC"',
            'Cookie': 'cookie',
            'Content-Type': 'text/xml',
            'Content-Length': Buffer.byteLength(post_data)
          }
        };

        var buffer = '';

        var req = http.request(options, function(res) {

          if (res.statusCode < 200 || res.statusCode > 299) {
            reject(new Error('Failed to load data, status code: ' + res.statusCode));
          }

          const body = [];
          res.on('data', (chunk) => {
            buffer = buffer + chunk;
            body.push(buffer);
          });
          res.on('end', () => resolve(body.join(buffer)));

        });

        req.on('error', (err) => reject(err));

        req.write(post_data);
        req.end();

      });

    };

    if (publish) {
      this.addAccessory(this.config, type);
    } else {
      const accessory = type;
      this.getService(accessory, accessory.context.type);
    }
  }

  addAccessory (config, type) {
    const self = this;
    const allAccessories = self.accessories;
    var accessory, name, deviceType, accessoryType;

    switch (type) {
      case 1:
        name = config.name + ' Power';
        deviceType = Accessory.Categories.SWITCH;
        accessoryType = Service.Switch;
        break;
      case 2:
        name = config.name + ' Inputs';
        deviceType = Accessory.Categories.SWITCH;
        accessoryType = Service.Switch;
        break;
      case 3:
        name = config.name + ' Apps';
        deviceType = Accessory.Categories.SWITCH;
        accessoryType = Service.Switch;
        break;
      case 4:
        name = config.name + ' Channels';
        deviceType = Accessory.Categories.SWITCH;
        accessoryType = Service.Switch;
        break;
      case 5:
        name = config.name + ' Remote';
        deviceType = Accessory.Categories.OTHER;
        accessoryType = Service.RemoteControl;
        break;
      case 6:
        name = config.name + ' Volume';
        deviceType = Accessory.Categories.LIGHTBULB;
        accessoryType = Service.Lightbulb;
        break;
      default:
        break;
    }

    this.log('Publishing new accessory: ' + name);

    accessory = this.accessories[name];
    const uuid = UUIDGen.generate(name);

    accessory = new PlatformAccessory(name, uuid, deviceType);
    accessory.addService(accessoryType, name);

    // Setting reachable to true
    accessory.reachable = true;

    accessory.context = {};
    accessory.context.type = type;

    accessory.context.lastvolume = 10;
    accessory.context.maxvolume = 70;
    
    accessory.context.pollinterval = 10000;
    accessory.context.offstatename = 'HOME';
    accessory.context.offstatenr = 0;
    
    if(config.appsEnabled){
      accessory.context.favappname = this.storage.getItem('Sony_Apps')[0].title;
      accessory.context.favappnr = 0;
      accessory.context.favappuri = this.storage.getItem('Sony_Apps')[0].uri;
      for(const i in allAccessories){allAccessories[i].context.maxapps = this.storage.getItem('Sony_Apps').length;}
      //accessory.context.maxapps = this.storage.getItem('Sony_Apps').length;
    }
    
    if(config.channelsEnabled){
      accessory.context.favchannelname = this.storage.getItem('Sony_Channels')[0].title;
      accessory.context.favchannelnr = 0;
      accessory.context.favchanneluri = this.storage.getItem('Sony_Channels')[0].uri;
      //accessory.context.maxchannels = this.storage.getItem('Sony_Channels').length;
      for(const i in allAccessories){allAccessories[i].context.maxchannels = this.storage.getItem('Sony_Channels').length;}
      accessory.context.channelsourcename = 'tv:dvbt';
      accessory.context.channelsourcenr = 0;
    }
	
    if(config.inputsEnabled){
      accessory.context.favinputname = this.storage.getItem('Sony_Inputs')[0].name;
      accessory.context.favinputnr = 0;
      accessory.context.favinputuri = this.storage.getItem('Sony_Inputs')[0].uri;
      //accessory.context.maxinputs = this.storage.getItem('Sony_Inputs').length;
      for(const i in allAccessories){allAccessories[i].context.maxinputs = this.storage.getItem('Sony_Inputs').length;}
    }

    accessory.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Name, config.name)
      .setCharacteristic(Characteristic.Identify, config.name)
      .setCharacteristic(Characteristic.Manufacturer, 'SeydX')
      .setCharacteristic(Characteristic.Model, 'BRAVIA')
      .setCharacteristic(Characteristic.SerialNumber, 'psk-' + config.psk + '-' + type)
      .setCharacteristic(Characteristic.FirmwareRevision, require('../package.json').version);

    // Publish
    this.platform.api.registerPlatformAccessories(pluginName, platformName, [accessory]);

    // Cache
    this.accessories[name] = accessory;

    // Get services
    this.getService(accessory, type);
  }

  getService (accessory, type) {
    const self = this;

    accessory.on('identify', function (paired, callback) {
      self.log(accessory.displayName + ': Identify!!!');
      callback();
    });

    var service;

    if (accessory.getService(Service.Switch)) {
      service = accessory.getService(Service.Switch);
    } else if (accessory.getService(Service.RemoteControl)) {
      service = accessory.getService(Service.RemoteControl);
    } else if (accessory.getService(Service.Lightbulb)) {
      service = accessory.getService(Service.Lightbulb);
    }

    switch (type) {
      case 1: // tv
      
        //Volume Parameter
        if(self.config.volumeEnabled){
          if (!service.testCharacteristic(Characteristic.MaxVolume))service.addCharacteristic(Characteristic.MaxVolume);
          service.getCharacteristic(Characteristic.MaxVolume)
            .setProps({
              maxValue: 100,
              minValue: 0,
              minStep: 1
            })
            .updateValue(accessory.context.maxvolume);
        } else {
          if (service.testCharacteristic(Characteristic.MaxVolume)) {
            service.removeCharacteristic(service.getCharacteristic(Characteristic.MaxVolume));
          }
        }
      
        //Input Parameter
        if(self.config.inputsEnabled){
          if (!service.testCharacteristic(Characteristic.FavInputNr))service.addCharacteristic(Characteristic.FavInputNr);
          service.getCharacteristic(Characteristic.FavInputNr)
            .setProps({
              maxValue: (accessory.context.maxinputs-1),
              minValue: 0,
              minStep: 1
            })
            .updateValue(accessory.context.favinputnr);
          if (!service.testCharacteristic(Characteristic.FavInputName))service.addCharacteristic(Characteristic.FavInputName);
          service.getCharacteristic(Characteristic.FavInputName)
            .updateValue(accessory.context.favinputname);
        } else {
          if (service.testCharacteristic(Characteristic.FavInputNr)) {
            service.removeCharacteristic(service.getCharacteristic(Characteristic.FavInputNr));
          }
          if (service.testCharacteristic(Characteristic.FavInputName)) {
            service.removeCharacteristic(service.getCharacteristic(Characteristic.FavInputName));
          }
        }
        
        //Apps Parameter
        if(self.config.appsEnabled){
          if (!service.testCharacteristic(Characteristic.FavAppNr))service.addCharacteristic(Characteristic.FavAppNr);
          service.getCharacteristic(Characteristic.FavAppNr)
            .setProps({
              maxValue: (accessory.context.maxapps-1),
              minValue: 0,
              minStep: 1
            })
            .updateValue(accessory.context.favappnr);
          if (!service.testCharacteristic(Characteristic.FavAppName))service.addCharacteristic(Characteristic.FavAppName);
          service.getCharacteristic(Characteristic.FavAppName)
            .updateValue(accessory.context.favappname);
        } else {
          if (service.testCharacteristic(Characteristic.FavAppNr)) {
            service.removeCharacteristic(service.getCharacteristic(Characteristic.FavAppNr));
          }
          if (service.testCharacteristic(Characteristic.FavAppName)) {
            service.removeCharacteristic(service.getCharacteristic(Characteristic.FavAppName));
          }
        }
        
        //Channel Parameter
        if(self.config.channelsEnabled){
          if (!service.testCharacteristic(Characteristic.FavChannelNr))service.addCharacteristic(Characteristic.FavChannelNr);
          service.getCharacteristic(Characteristic.FavChannelNr)
            .setProps({
              maxValue: accessory.context.maxchannels,
              minValue: 0,
              minStep: 1
            })
            .updateValue(accessory.context.favchannelnr);
          if (!service.testCharacteristic(Characteristic.FavChannelName))service.addCharacteristic(Characteristic.FavChannelName);
          service.getCharacteristic(Characteristic.FavChannelName)
            .updateValue(accessory.context.favchannelname);
          if (!service.testCharacteristic(Characteristic.ChannelSourceNr))service.addCharacteristic(Characteristic.ChannelSourceNr);
          service.getCharacteristic(Characteristic.ChannelSourceNr)
            .setProps({
              maxValue: 0,
              minValue: 0,
              minStep: 1
            })
            .updateValue(accessory.context.channelsourcenr);
          if (!service.testCharacteristic(Characteristic.ChannelSourceName))service.addCharacteristic(Characteristic.ChannelSourceName);
          service.getCharacteristic(Characteristic.ChannelSourceName)
            .updateValue(accessory.context.channelsourcename);
        } else {
          if (service.testCharacteristic(Characteristic.FavChannelNr)) {
            service.removeCharacteristic(service.getCharacteristic(Characteristic.FavChannelNr));
          }
          if (service.testCharacteristic(Characteristic.FavChannelName)) {
            service.removeCharacteristic(service.getCharacteristic(Characteristic.FavChannelName));
          }
          if (service.testCharacteristic(Characteristic.ChannelSourceNr)) {
            service.removeCharacteristic(service.getCharacteristic(Characteristic.ChannelSourceNr));
          }
          if (service.testCharacteristic(Characteristic.ChannelSourceName)) {
            service.removeCharacteristic(service.getCharacteristic(Characteristic.ChannelSourceName));
          }
        }
        if (!service.testCharacteristic(Characteristic.OffStateNr))service.addCharacteristic(Characteristic.OffStateNr);
        service.getCharacteristic(Characteristic.OffStateNr)
          .setProps({
            maxValue: 2,
            minValue: 0,
            minStep: 1
          })
          .updateValue(accessory.context.offstatenr);
        if (!service.testCharacteristic(Characteristic.OffStateName))service.addCharacteristic(Characteristic.OffStateName);
        service.getCharacteristic(Characteristic.OffStateName)
          .updateValue(accessory.context.offstatename);
        
        if (!service.testCharacteristic(Characteristic.PollInterval))service.addCharacteristic(Characteristic.PollInterval);
        
        service.getCharacteristic(Characteristic.PollInterval)
          .setProps({
            maxValue: 100,
            minValue: 10,
            minStep: 1
          })
          .updateValue(accessory.context.pollinterval/1000);

        service.getCharacteristic(Characteristic.On)
          .updateValue(false)
          .on('set', self.setPower.bind(this));

        self.getPower(service, accessory);
        self.getStates(accessory, service);

        break;
      case 2: // inputs (hdmi, cec, extras)

        for (const i in accessory.services) {
          if (accessory.services[i].displayName == accessory.displayName) {

            if (accessory.services[i].characteristics.length > 2) {
              var custom = accessory.services[i].characteristics;
              var skip = false;
              var skipExtra = false;
              var remove = false;
              var removeExtras = false;
              for (const j in custom) {
                if (self.config.detectCEC) {
                  if (custom[j].props.unit == 'meta:hdmi' || custom[j].props.unit == 'meta:playbackdevice') {
                    if (custom[j].props.unit == 'meta:playbackdevice') {
                      skip = true;
                    }

                    custom[j]
                      .updateValue(false)
                      .on('set', this.setInput.bind(this, accessory, custom[j]));

                    self.getInput(custom[j], accessory.services[i].characteristics, service, accessory);
                  }
                } else {
                  if (custom[j].props.unit == 'meta:playbackdevice') {
                    remove = true;
                  } else if (custom[j].props.unit == 'meta:hdmi') {
                    custom[j]
                      .updateValue(false)
                      .on('set', this.setInput.bind(this, accessory, custom[j]));

                    self.getInput(custom[j], accessory.services[i].characteristics, service, accessory);
                  }
                }

                if (self.config.extraInputs) {
                  if (custom[j].props.unit == 'meta:scart' || custom[j].props.unit == 'meta:composite' || custom[j].props.unit == 'meta:wifidisplay') {
                    skipExtra = true;

                    custom[j]
                      .updateValue(false)
                      .on('set', this.setInput.bind(this, accessory, custom[j]));

                    self.getInput(custom[j], accessory.services[i].characteristics, service, accessory);
                  }
                } else {
                  if (custom[j].props.unit == 'meta:scart' || custom[j].props.unit == 'meta:composite' || custom[j].props.unit == 'meta:wifidisplay') {
                    removeExtras = true;
                  }
                }
              }

              if (self.config.inputsEnabled) {
                if (!skip && self.config.detectCEC) {
                  self.log('CEC is active, but no devices detected in accessory cache!');
                  self.addOrRemoveInput(accessory, null, 'cec', true);
                }

                if (!skipExtra && self.config.extraInputs) {
                  self.log('Extra Inputs are active, but no devices detected in accessory cache!');
                  self.addOrRemoveInput(accessory, null, 'extra', true);
                }

                if (remove) {
                  self.log('CEC is not active, but devices were detected in accessory cache!');
                  self.addOrRemoveInput(accessory, null, 'cec', false);
                }

                if (removeExtras) {
                  self.log('Extra Inputs are not active, but devices were detected in accessory cache!');
                  self.addOrRemoveInput(accessory, null, 'extra', false);
                }
              }
            } else {
              
              if(!self.config.detectCEC && !self.config.extraInputs){
                self.addOrRemoveInput(accessory, null, 'hdmi', true);
              }
              
              if(self.config.detectCEC && !self.config.extraInputs){
                self.addOrRemoveInput(accessory, null, 'hdmi', true);
                self.addOrRemoveInput(accessory, null, 'cec', true); 
              }
              if (self.config.extraInputs && !self.config.detectCEC) {
                self.addOrRemoveInput(accessory, null, 'hdmi', true);
                self.addOrRemoveInput(accessory, null, 'extra', true);
              }
              
              if(self.config.extraInputs && self.config.detectCEC){
                self.addOrRemoveInput(accessory, null, 'all', true);
              }
            }
            
            service.getCharacteristic(Characteristic.On)
              .updateValue(false)
              .on('set', self.setMainInput.bind(this, accessory, service));
              
            self.getMainInput(accessory, service);
            
          }
        }

        break;
      case 3: // apps

        service.getCharacteristic(Characteristic.On)
          .updateValue(false);
          
        if (!service.testCharacteristic(Characteristic.TargetName)) {
          service.addCharacteristic(Characteristic.TargetName);
        }
        if (!service.testCharacteristic(Characteristic.TargetApp)) {
          service.addCharacteristic(Characteristic.TargetApp);
        }

        service.getCharacteristic(Characteristic.On)
          .updateValue(false)
          .on('set', this.setFavApp.bind(this, accessory, service));

        service.getCharacteristic(Characteristic.TargetName)
          .updateValue(self.storage.getItem('Sony_Apps')[0].title);

        service.getCharacteristic(Characteristic.TargetApp)
          .setProps({
            maxValue: (accessory.context.maxapps-1),
            minValue: 0,
            minStep: 1
          })
          .updateValue(0)
          .on('set', this.setTargetApp.bind(this, accessory, service));

        self.getAppOn(service, accessory);
        self.getApps(service, accessory);
        self.getAppStates(service, accessory);

        break;
      case 4: // channels

        service.getCharacteristic(Characteristic.On)
          .updateValue(false)
          .on('set', this.setFavChannel.bind(this, accessory, service));

        if (!service.testCharacteristic(Characteristic.ChannelName)) {
          service.addCharacteristic(Characteristic.ChannelName);
        }
        if (!service.testCharacteristic(Characteristic.TargetChannel)) {
          service.addCharacteristic(Characteristic.TargetChannel);
        }

        service.getCharacteristic(Characteristic.ChannelName)
          .updateValue(self.storage.getItem('Sony_Channels')[0].title);

        service.getCharacteristic(Characteristic.TargetChannel)
          .setProps({
            maxValue: accessory.context.maxchannels,
            minValue: 1,
            minStep: 1
          })
          .updateValue(0)
          .on('set', this.setTargetChannel.bind(this, accessory, service));
          
        //self.getChannels(service, accessory);
        self.getChannelOn(service, accessory);

        break;
      case 5: // remote

        for (const i in accessory.services) {
          if (accessory.services[i].displayName == accessory.displayName) {
            if (accessory.services[i].characteristics.length > 1) {
              custom = accessory.services[i].characteristics;
              var countSkip = 0;
              var countRemove = 0;
              for (const j in custom) {
                if (self.config.remoteControl) {
                  if (custom[j].props.type == 'remote') {
                    countSkip += 1;
                    custom[j]
                      .updateValue(false)
                      .on('set', this.setCommand.bind(this, custom[j], custom[j].displayName));
                  }
                } else {
                  if (custom[j].props.unit == 'remote') {
                    countRemove += 1;
                  }
                }
              }

              if (countSkip == 0 && self.config.remoteControl) {
                self.log('Remote control is active, but no devices detected in accessory cache!');
                self.addOrRemoveCommand(accessory, null, true);
              }

              if (countRemove > 0 && !self.config.remoteControl) {
                self.log('Remote control is not active, but devices were detected in accessory cache!');
                self.addOrRemoveInput(accessory, null, false);
              }
            } else {
              self.addOrRemoveCommand(accessory, null, true);
            }
          }
        }

        break;
      case 6: // volume

        service.getCharacteristic(Characteristic.On)
          .on('set', this.setMute.bind(this))
          .updateValue(false);

        if (!service.testCharacteristic(Characteristic.Brightness)) {
          service.addCharacteristic(Characteristic.Brightness);
        }

        service.getCharacteristic(Characteristic.Brightness)
          .setProps({
            maxValue: 100,
            minValue: 0,
            minStep: 1
          })
          .on('set', this.setVolume.bind(this, accessory, service))
          .updateValue(accessory.context.lastvolume);

        self.getVolume(service, accessory);

        break;
      default:
        break;
    }
  }

  addOrRemoveCommand (accessory, device, publish) {
    const self = this;

    const service = accessory.getService(Service.RemoteControl);

    for (const i in accessory.services) {
      if (accessory.services[i].displayName == accessory.displayName) {
        if (publish) {
          if (self.storage.getItem('Sony_Remote')) {
            const commands = self.storage.getItem('Sony_Remote');

            self.log('Adding new \'command\' characteristic(s)');

            for (const remote in commands) {
              self.log('Adding new command characteristic: ' + commands[remote].name);

              const parameter = {
                name: commands[remote].name,
                uri: commands[remote].value,
                type: 'remote'
              };

              var newparameter = JSON.parse(JSON.stringify(parameter));

              const c = new Characteristic.Command(self.api.hap, newparameter);
              service.addCharacteristic(c);

              var custom = accessory.services[i].characteristics;
              for (const l in custom) {
                if (custom[l].displayName == commands[remote].name) {
                  custom[l]
                    .on('set', self.setCommand.bind(this, custom[l], custom[l].displayName));
                }
              }
            }
          } else {
            self.log('Cant get \'Remote control commands\' from storage, trying again in 5 seconds or restart homebridge to generate new list...');
            setTimeout(function () {
              self.addOrRemoveCommand(accessory, device, publish);
            }, 5000);
          }
        } else {
          self.removeCommands(accessory.services[i].characteristics, service);
        }
      }
    }
  }
  
  removeCommands (commandCharacteristic, service) {
    const self = this;
    for (const remote in commandCharacteristic) {
      var command = commandCharacteristic;
      if (command[remote].props.type == 'remote') {
        self.log('Removing ' + command[remote].displayName + ' characteristic!');
        service.removeCharacteristic(command[remote]);
        self.removeCommands(commandCharacteristic);
      }
    }
  }

  addOrRemoveInput (accessory, device, type, publish) {
    const self = this;

    const service = accessory.getService(Service.Switch);

    for (const i in accessory.services) {
      if (accessory.services[i].displayName == accessory.displayName) {
        if (publish) {
          if (self.storage.getItem('Sony_Inputs')) {
            self.log('Adding new \'input\' characteristic(s)');

            const resultArray = self.storage.getItem('Sony_Inputs');

            if (type == 'cec') {
              var uri = [];

              for (const device in resultArray) {
                if (resultArray[device].meta == 'meta:playbackdevice') {
                  const parameter = {
                    name: resultArray[device].name,
                    uri: resultArray[device].uri,
                    meta: resultArray[device].meta
                  };

                  var port;

                  if (resultArray[device].uri.match('logicalAddr')) {
                    port = resultArray[device].uri.split('port=')[1].split('&logicalAddr=')[0];
                  } else {
                    port = resultArray[device].uri.split('port=')[1];
                  }

                  uri.push({
                    cecuri: resultArray[device].uri,
                    port: port,
                    hdmiuri: 'extInput:hdmi?port=' + port
                  });

                  var newparameter = JSON.parse(JSON.stringify(parameter));

                  self.log('Adding new CEC device: ' + resultArray[device].name);

                  const c = new Characteristic.InputCharacteristics(self.api.hap, newparameter);
                  service.addCharacteristic(c);

                  var custom = accessory.services[i].characteristics;
                  for (const l in custom) {
                    if (custom[l].displayName == resultArray[device].name) {
                      custom[l]
                        .updateValue(false)
                        .on('set', self.setInput.bind(this, accessory, custom[l]));

                      self.getInput(custom[l], accessory.services[i].characteristics, service, accessory);
                      //self.getMainInput(custom[l], accessory.services[i].characteristics, service)
                    }
                  }
                  self.removeHDMI(accessory.services[i].characteristics, service, uri);
                }
              }
            } else if (type == 'hdmi') {

              for (const device in resultArray) {
                if (resultArray[device].meta == 'meta:hdmi') {
                  const parameter = {
                    name: resultArray[device].name,
                    uri: resultArray[device].uri,
                    meta: resultArray[device].meta
                  };

                  newparameter = JSON.parse(JSON.stringify(parameter));

                  self.log('Adding new HDMI input: ' + resultArray[device].name);

                  const c = new Characteristic.InputCharacteristics(self.api.hap, newparameter);
                  service.addCharacteristic(c);

                  custom = accessory.services[i].characteristics;
                  for (const l in custom) {
                    if (custom[l].displayName == resultArray[device].name) {
                      custom[l]
                        .updateValue(false)
                        .on('set', self.setInput.bind(this, accessory, custom[l]));

                      self.getInput(custom[l], accessory.services[i].characteristics, service, accessory);
                    }
                  }
                }
              }
            } else if (type == 'extra') {
              for (const device in resultArray) {
                if (resultArray[device].meta == 'meta:scart' || resultArray[device].meta == 'meta:composite' || resultArray[device].meta == 'meta:wifidisplay') {
                  const parameter = {
                    name: resultArray[device].name,
                    uri: resultArray[device].uri,
                    meta: resultArray[device].meta
                  };

                  newparameter = JSON.parse(JSON.stringify(parameter));

                  self.log('Adding new Extra input: ' + resultArray[device].name);

                  const c = new Characteristic.InputCharacteristics(self.api.hap, newparameter);
                  service.addCharacteristic(c);

                  custom = accessory.services[i].characteristics;
                  for (const l in custom) {
                    if (custom[l].displayName == resultArray[device].name) {
                      custom[l]
                        .updateValue(false)
                        .on('set', self.setInput.bind(this, accessory, custom[l]));

                      self.getInput(custom[l], accessory.services[i].characteristics, service, accessory);
                    }
                  }
                }
              }
            } else if (type == 'all') {
              var accessoryArray = [];

              for (const device in resultArray) {
                if (resultArray[device].meta == 'meta:scart' || resultArray[device].meta == 'meta:composite' || resultArray[device].meta == 'meta:wifidisplay') {
                  const parameter = {
                    name: resultArray[device].name,
                    uri: resultArray[device].uri,
                    meta: resultArray[device].meta
                  };

                  var newConfig = JSON.parse(JSON.stringify(parameter));
                  accessoryArray.push(newConfig);
                }
              }
              
              for (const device in resultArray) {
                if (resultArray[device].meta == 'meta:hdmi') {
                  const parameter = {
                    name: resultArray[device].name,
                    uri: resultArray[device].uri,
                    meta: resultArray[device].meta
                  };

                  newConfig = JSON.parse(JSON.stringify(parameter));
                  accessoryArray.push(newConfig);
                }
              }

              for (const device in resultArray) {
                if (resultArray[device].meta == 'meta:playbackdevice') {
                  uri = resultArray[device].uri;

                  if (self.config.cecDevices) {
                    for (const l in self.config.cecDevices) {
                      if (self.config.cecDevices[l].title == resultArray[device].name) {
                        port = self.cecDevices[l].hdmiport;
                      }
                    }
                  } else {
                    if (uri.match('logicalAddr')) {
                      port = uri.split('port=')[1].split('&logicalAddr=')[0];
                    } else {
                      port = uri.split('port=')[1];
                    }
                  }

                  const newuri = 'extInput:hdmi?port=' + port;

                  for (const devices in accessoryArray) {
                    if (accessoryArray[devices].uri == newuri) {
                      accessoryArray[devices].name = resultArray[device].name;
                      accessoryArray[devices].uri = resultArray[device].uri;
                      accessoryArray[devices].meta = resultArray[device].meta;
                    }
                  }
                }
              }

              for (const device in accessoryArray) {
                const parameter = {
                  name: accessoryArray[device].name,
                  uri: accessoryArray[device].uri,
                  meta: accessoryArray[device].meta
                };

                newparameter = JSON.parse(JSON.stringify(parameter));

                self.log('Adding new input: ' + accessoryArray[device].name);

                const c = new Characteristic.InputCharacteristics(self.api.hap, newparameter);
                service.addCharacteristic(c);

                custom = accessory.services[i].characteristics;
                for (const l in custom) {
                  if (custom[l].displayName == accessoryArray[device].name) {
                    custom[l]
                      .updateValue(false)
                      .on('set', self.setInput.bind(this, accessory, custom[l]));

                    self.getInput(custom[l], accessory.services[i].characteristics, service, accessory);
                  }
                }
              }
            }
          } else {
            self.log('Can\'t get \'inputs\' from storage, trying again in 5 seconds or restart homebridge to generate new list...');
            setTimeout(function () {
              self.addOrRemoveInput(accessory, device, type, publish);
            }, 5000);
          }
        } else {
          if (self.config.inputsEnabled) {
            if (type == 'extra') {
              self.removeEXTRA(accessory.services[i].characteristics, service);
            } else if (type == 'cec') {
              const resultArray = self.storage.getItem('Sony_Inputs');

              uri = [];

              for (const cec in accessory.services[i].characteristics) {
                var sources = accessory.services[i].characteristics;

                if (sources[cec].props.unit == 'meta:playbackdevice') {

                  if (sources[cec].props.uri.match('logicalAddr')) {
                    port = sources[cec].props.uri.split('port=')[1].split('&logicalAddr=')[0];
                  } else {
                    port = sources[cec].props.uri.split('port=')[1];
                  }

                  uri.push({
                    cecuri: sources[cec].props.uri,
                    port: port,
                    hdmiuri: 'extInput:hdmi?port=' + port
                  });
                }
              }

              for (const device in resultArray) {
                if (resultArray[device].meta == 'meta:hdmi') {
                  for (const links in uri) {
                    if (resultArray[device].uri == uri[links].hdmiuri) {
                      const parameter = {
                        name: resultArray[device].name,
                        uri: resultArray[device].uri,
                        meta: resultArray[device].meta
                      };

                      newparameter = JSON.parse(JSON.stringify(parameter));

                      self.log('Adding new HDMI device: ' + resultArray[device].name);

                      const c = new Characteristic.InputCharacteristics(self.api.hap, newparameter);
                      service.addCharacteristic(c);

                      custom = accessory.services[i].characteristics;
                      for (const l in custom) {
                        if (custom[l].displayName == resultArray[device].name) {
                          custom[l]
                            .updateValue(false)
                            .on('set', self.setInput.bind(this, accessory, custom[l]));

                          self.getInput(custom[l], accessory.services[i].characteristics, service, accessory);
                        }
                      }
                      self.removeCEC(accessory.services[i].characteristics, service);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  removeHDMI (hdmiCharacteristic, service, uri) {
    const self = this;
    for (const hdmi in hdmiCharacteristic) {
      const sources = hdmiCharacteristic;
      if (sources[hdmi].props.unit == 'meta:hdmi') {
        for (const parameter in uri) {
          if (sources[hdmi].props.uri == uri[parameter].hdmiuri) {
            self.log('Removing ' + sources[hdmi].displayName + ' characteristic instead!');
            service.removeCharacteristic(sources[hdmi]);
            self.removeHDMI(hdmiCharacteristic, service);
          }
        }
      }
    }
  }
  
  removeEXTRA (extraCharacteristic, service) {
    const self = this;
    for (const extra in extraCharacteristic) {
      const sources = extraCharacteristic;
      if (sources[extra].props.unit == 'meta:scart'||sources[extra].props.unit == 'meta:composite'||sources[extra].props.unit == 'meta:wifidisplay') {
        self.log('Removing ' + sources[extra].displayName + ' characteristic!');
        service.removeCharacteristic(sources[extra]);
        self.removeEXTRA(extraCharacteristic, service);
      }
    }
  }
  
  removeCEC (cecCharacteristic, service) {
    const self = this;
    for (const cec in cecCharacteristic) {
      const sources = cecCharacteristic;
      if (sources[cec].props.unit == 'meta:playbackdevice') {
        self.log('Removing ' + sources[cec].displayName + ' characteristic instead!');
        service.removeCharacteristic(sources[cec]);
        //self.removeCEC(cecCharacteristic, service)
      }
    }
  }
  
  getStates(accessory, service){
    const self = this;
    const allAccessories = self.accessories;
    
    if(service.testCharacteristic(Characteristic.MaxVolume)){
      for(const j in allAccessories){
        allAccessories[j].context.maxvolume = service.getCharacteristic(Characteristic.MaxVolume).value;
      }
    } 
    
    if(service.testCharacteristic(Characteristic.PollInterval)){
      for(const j in allAccessories){
        allAccessories[j].context.pollinterval = (service.getCharacteristic(Characteristic.PollInterval).value * 1000);
      }
    } 
    
    if(service.testCharacteristic(Characteristic.OffStateNr) && service.testCharacteristic(Characteristic.OffStateName)){
      const offStates = { 
        off: 0,
        home: 1,
        channels: 2
      };
      for(const j in allAccessories){
        if(service.getCharacteristic(Characteristic.OffStateNr).value == offStates.home){
          if(self.config.appsEnabled){
            setTimeout(function(){service.getCharacteristic(Characteristic.OffStateName).updateValue('HOME');},500);
            allAccessories[j].context.offstatename = service.getCharacteristic(Characteristic.OffStateName).value; 
            allAccessories[j].context.offstatenr = 1;
          } else {
            self.log('Can\'t switch this setting because \'Apps\' is not enabled! Off State: OFF');
            setTimeout(function(){service.getCharacteristic(Characteristic.OffStateName).updateValue('OFF');},500);
            setTimeout(function(){service.getCharacteristic(Characteristic.OffStateNr).updateValue(2);},500);
            allAccessories[j].context.offstatename = service.getCharacteristic(Characteristic.OffStateName).value; 
            allAccessories[j].context.offstatenr = 0;
          }
        } else if(service.getCharacteristic(Characteristic.OffStateNr).value == offStates.channels){
          if(self.config.channelsEnabled){
            setTimeout(function(){service.getCharacteristic(Characteristic.OffStateName).updateValue('CHANNEL');},500);
            allAccessories[j].context.offstatename = service.getCharacteristic(Characteristic.OffStateName).value; 
            allAccessories[j].context.offstatenr = 2;
          } else {
            self.log('Can\'t switch this setting because \'Channels\' is not enabled! Off State: OFF');
            setTimeout(function(){service.getCharacteristic(Characteristic.OffStateName).updateValue('OFF');},500);
            setTimeout(function(){service.getCharacteristic(Characteristic.OffStateNr).updateValue(2);},500);
            allAccessories[j].context.offstatename = service.getCharacteristic(Characteristic.OffStateName).value; 
            allAccessories[j].context.offstatenr = 0;
          }
        } else {
          setTimeout(function(){service.getCharacteristic(Characteristic.OffStateName).updateValue('OFF');},500);
          allAccessories[j].context.offstatename = service.getCharacteristic(Characteristic.OffStateName).value; 
          allAccessories[j].context.offstatenr = 0;
        }
      }
    }
    
    if(service.testCharacteristic(Characteristic.ChannelSourceNr) && service.testCharacteristic(Characteristic.ChannelSourceName)){
      const channelSource = { 
        dvbt: 0,
        dvbc: 1
      };	      	    
      for(const j in allAccessories){
        if(service.getCharacteristic(Characteristic.ChannelSourceNr).value == channelSource.dvbt){
          setTimeout(function(){service.getCharacteristic(Characteristic.ChannelSourceName).updateValue('tv:dvbt');},500);
          allAccessories[j].context.channelsourcename = service.getCharacteristic(Characteristic.ChannelSourceName).value; 
          allAccessories[j].context.channelsourcenr = 0;
        } else if(service.getCharacteristic(Characteristic.ChannelSourceNr).value == channelSource.dvbc){
          //setTimeout(function(){service.getCharacteristic(Characteristic.ChannelSourceName).updateValue('tv:dvbc');},500);
          setTimeout(function(){service.getCharacteristic(Characteristic.ChannelSourceName).updateValue('tv:dvbt');},500);
          allAccessories[j].context.channelsourcename = service.getCharacteristic(Characteristic.ChannelSourceName).value; 
          allAccessories[j].context.channelsourcenr = 1;
        }
      }
    }
    
    if(service.testCharacteristic(Characteristic.FavInputNr) && service.testCharacteristic(Characteristic.FavInputName)){
      for(const j in allAccessories){
        const inputArray = self.storage.getItem('Sony_Inputs');
        for(const inputs in inputArray){		    
          if(service.getCharacteristic(Characteristic.FavInputNr).value == inputs){
            setTimeout(function(){service.getCharacteristic(Characteristic.FavInputName).updateValue(inputArray[inputs].name);},500);
            allAccessories[j].context.favinputname = service.getCharacteristic(Characteristic.FavInputName).value; 
            allAccessories[j].context.favinputnr = service.getCharacteristic(Characteristic.FavInputNr).value;
            allAccessories[j].context.maxinputs = self.storage.getItem('Sony_Inputs').length;
          } 
        }
      }
    }
    
    if(service.testCharacteristic(Characteristic.FavAppNr) && service.testCharacteristic(Characteristic.FavAppName)){
      for(const j in allAccessories){
        const appsArray = self.storage.getItem('Sony_Apps');
        for(const app in appsArray){
          if(service.getCharacteristic(Characteristic.FavAppNr).value == app){
            setTimeout(function(){service.getCharacteristic(Characteristic.FavAppName).updateValue(appsArray[app].title);},500);
            allAccessories[j].context.favappname = service.getCharacteristic(Characteristic.FavAppName).value; 
            allAccessories[j].context.favappnr = service.getCharacteristic(Characteristic.FavAppNr).value;
            allAccessories[j].context.favappuri = appsArray[app].uri;
            allAccessories[j].context.maxapps = self.storage.getItem('Sony_Apps').length;
          } 
        }
      }
    }
    
    if(service.testCharacteristic(Characteristic.FavChannelNr) && service.testCharacteristic(Characteristic.FavChannelName)){
      for(const j in allAccessories){
        const channelsArray = self.storage.getItem('Sony_Channels');
        for(const channel in channelsArray){
          if(service.getCharacteristic(Characteristic.FavChannelNr).value == channel){
            setTimeout(function(){service.getCharacteristic(Characteristic.FavChannelName).updateValue(channelsArray[channel].title);},500);
            allAccessories[j].context.favchannelname = service.getCharacteristic(Characteristic.FavChannelName).value; 
            allAccessories[j].context.favchannelnr = service.getCharacteristic(Characteristic.FavChannelNr).value;
            allAccessories[j].context.favchanneluri = channelsArray[channel].uri;
            allAccessories[j].context.maxchannels = self.storage.getItem('Sony_Channels').length;
          } 
        }
      }
    }
    
    setTimeout(function () {
      self.getStates(accessory, service);
    }, 1000);
  }

  getPower (service,accessory) {
    const self = this;

    self.getContent('/sony/system', 'getPowerStatus', '1.0', '1.0')
      .then((data) => {
        const response = JSON.parse(data);
        var status = response.result[0].status;

        if ('error' in response) {
          self.log('An error occured by getting ' + accessory.displayName + ' state, trying again..');
          self.log(data);
          setTimeout(function () {
            self.getPower(service);
          }, accessory.context.pollinterval);
        } else {
          status == 'active' ? status = true : status = false;
        }

        service.getCharacteristic(Characteristic.On)
          .updateValue(status);

        self.errorCount.tv = 0;

        setTimeout(function () {
          self.getPower(service, accessory);
        }, accessory.context.pollinterval);
      })
      .catch((err) => {
        if (self.errorCount.tv > 5) {
          self.errorCount.tv = 0;
          self.log('An error occured by getting ' + accessory.displayName + ' state, trying again..');
          self.log(err);
        }
        setTimeout(function () {
          self.errorCount.tv += 1;
          self.getPower(service, accessory);
        }, 60000);
      });
  }

  setPower (state, callback) {
    const self = this;
    
    const allAccessories = self.accessories;
    
    if(!state){
      for(const i in allAccessories){
        if(allAccessories[i].getService(Service.Switch)||allAccessories[i].getService(Service.Lightbulb)){
          if(allAccessories[i].getService(Service.Switch)) allAccessories[i].getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(state);
          if(allAccessories[i].getService(Service.Lightbulb)) allAccessories[i].getService(Service.Lightbulb).getCharacteristic(Characteristic.On).updateValue(state);         
          for(const j in allAccessories[i].services){
            const services = allAccessories[i].services;
            if(services[j].displayName == self.config.name + ' Inputs'){
              const characteristics = services[j].characteristics;
              for(const l in characteristics){
                if(characteristics[l].displaName != 'Name'){
                  characteristics[l].updateValue(state);
                }
              }
            }
          }          
        }
      }
    } else {
      for(const i in allAccessories){
        if(allAccessories[i].getService(Service.Lightbulb)) {
          allAccessories[i].getService(Service.Lightbulb).getCharacteristic(Characteristic.On).updateValue(state);
          allAccessories[i].getService(Service.Lightbulb).getCharacteristic(Characteristic.Brightness).updateValue(allAccessories[i].context.lastvolume);
        }
      }
    }

    self.getContent('/sony/system', 'setPowerStatus', {
      'status': state
    }, '1.0')
      .then((data) => {
        const response = JSON.parse(data);

        if ('error' in response) {
          self.log('An error occured by setting tv state!');
          self.log(data);

          state ? callback(null, false) : callback(null, true);
        } else {
          state ? self.log('Turn on TV') : self.log('Turn off TV');
          callback(null, state);
        }
      })
      .catch((err) => {
        self.log('An error occured by setting tv state!');
        self.log(err);
        state ? callback(null, false) : callback(null, true);
      });
  }

  // Volume
  getVolume (service, accessory) {
    const self = this;
    self.getContent('/sony/audio', 'getVolumeInformation', '1.0', '1.0')
      .then((data) => {
        const response = JSON.parse(data);
        var volume = 0;
        var mute = false;

        if ('result' in response) {
          const device = response.result[0];

          for (const i in device) {
            if (device[i].target == 'speaker') {
              volume = device[i].volume;
              mute = device[i].mute == false;
              accessory.context.lastvolume = volume;
            }
          }
        } else {
          volume = 0;
          mute = false;
        }

        if (volume > accessory.context.maxvolume) {
          volume = accessory.context.maxvolume;
        }

        service.getCharacteristic(Characteristic.On)
          .updateValue(mute);

        service.getCharacteristic(Characteristic.Brightness)
          .updateValue(volume);

        self.errorCount.volume = 0;

        setTimeout(function () {
          self.getVolume(service, accessory);
        }, accessory.context.pollinterval);
      })
      .catch((err) => {
        if (self.errorCount.volume > 5) {
          self.errorCount.volume = 0;
          self.log('An error occured by getting ' + accessory.displayName + ' state, trying again..');
          self.log(err);
        }
        setTimeout(function () {
          self.errorCount.volume += 1;
          self.getVolume(service, accessory);
        }, 60000);
      });
  }

  setMute (state, callback) {
    const self = this;

    state ? state = false : state = true;

    self.getContent('/sony/audio', 'setAudioMute', {
      'status': state
    }, '1.0')
      .then((data) => {
        const response = JSON.parse(data);

        if ('error' in response) {
          self.log('An error occured by setting mute state');
          self.log(data);
          state ? callback(null, false) : callback(null, true);
        } else {
          state ? self.log('Activating TV mute') : self.log('Deactivating TV mute');
          callback(null, state);
        }
      })
      .catch((err) => {
        self.log('An error occured by setting mute state');
        self.log(err);
        state ? callback(null, false) : callback(null, true);
      });
  }

  setVolume (accessory, service, value, callback) {
    const self = this;
    if (value > accessory.context.maxvolume) {
      value = accessory.context.maxvolume;
      setTimeout(function(){
        service.getCharacteristic(Characteristic.Brightness).updateValue(value);
      }, 800);
    }

    const newValue = value.toString();

    self.getContent('/sony/audio', 'setAudioVolume', {
      'target': 'speaker',
      'volume': newValue
    }, '1.0')
      .then((data) => {
        var response = JSON.parse(data);

        if ('error' in response) {
          self.log('An error occured by setting volume');
          self.log(data);
        } else {
          self.log('Volume: ' + value);
        }

        callback(null, value);
      })
      .catch((err) => {
        self.log('An error occured by setting volume');
        self.log(err);
        callback(null, value);
      });
  }
  
  getApps(service, accessory){
    const self = this;
    const allAccessories = self.accessories;
    self.getContent('/sony/appControl', 'getApplicationList', '1.0', '1.0')
      .then((data) => {
        var response = JSON.parse(data);
        if ('error' in response) {
          self.log('An error occured by refreshing app list, trying again...');
          self.log(data);
          setTimeout(function () {
            self.getApps(service, accessory);
          }, 10 * 60 * 1000);
        } else {
          const result = response.result[0];
          if(result.length > accessory.context.maxapps){
            self.log('Found new installed app! Refreshing app list');
            self.storage.setItem('Sony_Apps', result);
          } else if(result.length < accessory.context.maxapps){
            self.log('An installed app was removed. Refreshing app list');
            self.storage.setItem('Sony_Apps', result);
          }
          accessory.context.maxapps = result.length;
          for(const i in allAccessories){
            if(allAccessories[i].getService(Service.Switch)){       
              for(const j in allAccessories[i].services){
                const services = allAccessories[i].services;
                if(services[j].displayName == self.config.name + ' Apps'){
                  const characteristics = services[j].characteristics;
                  for(const l in characteristics){
                    if(characteristics[l].displayName == 'App' && characteristics[l].props.format == 'int'){
                      characteristics[l]
                        .setProps({
                          maxValue: (result.length-1),
                          minValue: 0,
                          minStep: 1
                        });
                    }
                  }
                } else if(services[j].displayName == self.config.name + ' Power'){
                  const characteristics = services[j].characteristics;
                  for(const l in characteristics){
                    if(characteristics[l].displayName == 'Favourite App' && characteristics[l].props.format == 'int'){
                      characteristics[l]
                        .setProps({
                          maxValue: (result.length-1),
                          minValue: 0,
                          minStep: 1
                        });
                    }
                  }
                }
              }          
            }
          }
          setTimeout(function () {
            self.getApps(service, accessory);
          }, 10 * 60 * 1000);
        }
      })
      .catch((err) => {
        self.log('An error occured by refreshing app list, trying again...');
        self.log(err);
        setTimeout(function () {
          self.getApps(service, accessory);
        }, 10 * 60 * 1000);
      });
  }
  
  getAppStates (service, accessory) {
    const self = this;
    const targetApp = service.getCharacteristic(Characteristic.TargetApp).value;
    const apps = self.storage.getItem('Sony_Apps');
    for (var i = 0; i < apps.length; i++) {
      switch (i) {
        case targetApp:
          service.getCharacteristic(Characteristic.TargetName).updateValue(apps[i].title);
          break;
      }
    }
    setTimeout(function () {
      self.getAppStates(service, accessory);
    }, 1000);
  }
  
  getAppOn(service, accessory){
    const self = this;
    self.getContent('/sony/avContent', 'getPlayingContentInfo', '1.0', '1.0')
      .then((data) => {
        const response = JSON.parse(data);
        var state = false;
        if ('error' in response) {
          if (response.error[0] == 7) {
            state = true;
          } else {
            state = false;
          }
        } else {
          state = false;
        }
        service.getCharacteristic(Characteristic.On).updateValue(state);
        self.errorCount.apps = 0;
        setTimeout(function () {
          self.getAppOn(service);
        }, accessory.context.pollinterval);
      })
      .catch((err) => {
        if (self.errorCount.apps > 5) {
          self.errorCount.apps = 0;
          self.log('An error occured by getting ' + service.displayName + ' state, trying again..');
          self.log(err);
        }
        setTimeout(function () {
          self.errorCount.apps += 1;
          self.getAppOn(service);
        }, 60000);
      });
  }
  
  setFavApp(accessory, service, state, callback){
    const self = this;
    const allAccessories = self.accessories;
    if(state){
      self.getContent('/sony/appControl', 'setActiveApp', {'uri': accessory.context.favappuri}, '1.0')
        .then((data) => {
          const response = JSON.parse(data);
          if ('error' in response) {
            if (response.error[0] == 7 || response.error[0] == 40005) {
              self.getContent('/sony/system', 'setPowerStatus', {
                'status': true
              }, '1.0')
                .then((tvdata) => {
                  const tvresponse = JSON.parse(tvdata);
                  if('result' in tvresponse){
                    self.log('Turning on the TV...');
                    setTimeout(function () {
                      service.getCharacteristic(Characteristic.On).setValue(true);
                      service.getCharacteristic(Characteristic.On).updateValue(true);
                    }, 1000);
                    callback(null, true);
                  } else {
                    self.log('An error occured by setting TV on!');
                    self.log(tvdata);
                    callback(null, false);
                  }
                })
                .catch((tverr) => {
                  self.log('An error occured by setting TV on!');
                  self.log(tverr);
                  callback(null, false);
                });
            } else {
              self.log('An error occured by setting ' + accessory.context.favappname + ' on!');
              self.log(data);
              callback(null, false);
            }
          } else {
            self.log('Turn on: ' + accessory.context.favappname);
            for(const i in allAccessories){
              if(allAccessories[i].getService(Service.Switch)){
                for(const j in allAccessories[i].services){
                  const services = allAccessories[i].services;
                  if(services[j].displayName==self.config.name + ' Inputs'||services[j].displayName==self.config.name + ' Channels'){
                    const characteristics = services[j].characteristics;
                    for(const l in characteristics){
                      if(characteristics[l].displaName != 'Name'){
                        characteristics[l].updateValue(false);
                      }
                    }
                  }
                }
              }
            }
            callback(null, true);
          }
        })
        .catch((err) => {
          self.log('An error occured by setting ' + accessory.context.favappname + ' on!');
          self.log(err);
          callback(null, false);
        });
    } else {
      self.getContent('/sony/appControl', 'terminateApps', '1.0', '1.0')
        .then((data) => {
          const response = JSON.parse(data);
          if ('error' in response) {
            self.log('An error occured by terminating app');
            self.log(data);
            callback(null, true);
          } else {
            self.log('Turn off: ' + accessory.context.favappname);
            callback(null, false);
          }
        })
        .catch((err) => {
          self.log('An error occured by terminating app');
          self.log(err);
          callback(null, true);
        });
    }
  }
  
  setTargetApp(accessory, service, value, callback){
    const self = this;   
    const apps = self.storage.getItem('Sony_Apps');
    var uri, title;
    for (var i = 0; i <= apps.length; i++) {
      switch (i) {
        case value:
          title = apps[i].title;
          uri = apps[i].uri;
          break;
      }
    }
    self.getContent('/sony/appControl', 'setActiveApp', {'uri': uri}, '1.0')
      .then((data) => {
        const response = JSON.parse(data);
        if ('error' in response) {
          self.log('An error occured by setting ' + title + ' on!');
          self.log(data);
          callback(null, value);
        } else {
          self.log('Turn on: ' + title);
          callback(null, value);
        }
      })
      .catch((err) => {
        self.log('An error occured by setting ' + title + ' on!');
        self.log(err);
        callback(null, value);
      });
  }

  getInput (accessory, service, mainService, mainAccessory) {
    const self = this;
    var port, simpleuri;

    if (accessory.props.unit == 'meta:playbackdevice') {
      if (accessory.props.uri.match('logicalAddr')) {
        port = accessory.props.uri.split('port=')[1].split('&logicalAddr=')[0];
      } else {
        port = accessory.props.uri.split('port=')[1];
      }

      simpleuri = 'extInput:hdmi?port=' + port;
    } else {
      simpleuri = accessory.props.uri;
    }

    self.getContent('/sony/avContent', 'getPlayingContentInfo', '1.0', '1.0')
      .then((data) => {
        const response = JSON.parse(data);
        var state = false;

        if ('result' in response) {
          const result = response.result[0].uri;

          if (result == accessory.props.uri || result == simpleuri) {
            state = true;
          } else {
            state = false;
          }
        } else {
          state = false;
        }

        accessory.updateValue(state);

        self.errorCount.inputs = 0;

        setTimeout(function () {
          self.getInput(accessory, service, mainService, mainAccessory);
        }, mainAccessory.context.pollinterval);
      })
      .catch((err) => {
        if (self.errorCount.inputs > 40) {
          self.errorCount.inputs = 0;
          self.log('An error occured by getting ' + accessory.displayName + ' state, trying again..');
          self.log(err);
        }
        setTimeout(function () {
          self.errorCount.inputs += 1;
          self.getInput(accessory, service, mainService, mainAccessory);
        }, 60000);
      });
  }
  
  getMainInput(accessory, mainService){
    const self = this;
    var active = false;
    for(const i in accessory.services){
      const services = accessory.services;
      if(services[i].displayName == accessory.displayName){
        const characteristics = services[i].characteristics;
        for(const j in characteristics){
          if(characteristics[j].displayName !== 'Name'&&characteristics[j].displayName !== 'On'){
            if(characteristics[j].value == true){
              active = true;
            }
          }
        }
      }
    }
    active ? mainService.getCharacteristic(Characteristic.On).updateValue(true) : mainService.getCharacteristic(Characteristic.On).updateValue(false);
    setTimeout(function () {
      self.getMainInput(accessory, mainService);
    }, 1000);
  }
  
  setMainInput (accessory, service, state, callback) {
    const self = this;
    var error = true;
    const allAccessories = self.accessories;
    if(state){
      for (const i in service.characteristics) {
        const character = service.characteristics;         
        if(character[i].displayName != 'On'&&character[i].displayName != 'Name'){
          if(character[i].displayName == accessory.context.favinputname){
            character[i].setValue(true);
            character[i].updateValue(true);
            error = false;
            for(const i in allAccessories){
              if(allAccessories[i].getService(Service.Switch)){
                for(const j in allAccessories[i].services){
                  const services = allAccessories[i].services;
                  if(services[j].displayName==self.config.name+' Apps'||services[j].displayName==self.config.name + ' Channels'){
                    const characteristics = services[j].characteristics;
                    for(const l in characteristics){
                      if(characteristics[l].displaName != 'Name'){
                        characteristics[l].updateValue(false);
                      }
                    }
                  }
                }
              }
            }
            callback(null, true);
          }
        }
      }
    } else {
      for (const i in service.characteristics) {
        const character = service.characteristics;         
        if(character[i].displayName != 'On'&&character[i].displayName != 'Name'){
          if(character[i].value == true){
            character[i].setValue(false);
            character[i].updateValue(false);
            error = false;
            callback(null, false);
          }
        }
      }
    }
    if(error){
      error = false;
      self.log('Can\'t find ' + accessory.context.favinputname + ' in cached characteristics! Please control your settings and change to correct value!');
      if(state){
        callback(null, false);
      } else {
        callback(null, true);
      }
    }
  }

  setInput (accessory, character, state, callback) {
    const self = this;
    if (state) {
      self.getContent('/sony/avContent', 'setPlayContent', {
        'uri': character.props.uri
      }, '1.0')
        .then((data) => {
          const response = JSON.parse(data);
          if ('error' in response) {
            if (response.error[0] == 7 || response.error[0] == 40005) {
              self.getContent('/sony/system', 'setPowerStatus', {
                'status': true
              }, '1.0')
                .then((data) => {
                  const response = JSON.parse(data);
                  if('result' in response){
                    self.log('Turning on the TV...');
                    setTimeout(function () {
                      character.setValue(true);
                      character.updateValue(true);
                      callback(null, true);
                    }, 1000);
                  } else {
                    self.log('An error occured by setting TV on!');
                    self.log(data);
                    accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(false);
                    callback(null, false);
                  }
                })
                .catch((err) => {
                  self.log('An error occured by setting TV on!');
                  self.log(err);
                  accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(false);
                  callback(null, false);
                });
            } else {
              self.log('An error occured by setting ' + character.displayName + ' on!');
              self.log(data);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(false);
              callback(null, false);
            }
          } else {
            self.log('Turn on: ' + character.displayName);
            accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
            callback(null, true);
          }
        })
        .catch((err) => {
          self.log('An error occured by setting ' + character.displayName + ' on!');
          self.log(err);
          accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(false);
          callback(null, false);
        });
    } else {
      if (accessory.context.offstatename == 'HOME') {
        self.getContent('/sony/appControl', 'setActiveApp', {
          'uri': accessory.context.favappuri
        }, '1.0')
          .then((data) => {
            var response = JSON.parse(data);

            if ('error' in response) {
              self.log('An error occured by switching to ' + accessory.context.favappname);
              self.log(data);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
              callback(null, true);
            } else {
              self.log('Switch to: ' + accessory.context.favappname);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(false);
              callback(null, false);
            }
          })
          .catch((err) => {
            self.log('An error occured by setting ' + accessory.displayName + ' off!');
            self.log(err);
            accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
            callback(null, true);
          });
      } else if (accessory.context.offstatename == 'CHANNEL') {
        self.getContent('/sony/avContent', 'setPlayContent', {
          'uri': accessory.context.favchanneluri
        }, '1.0')
          .then((data) => {
            var response = JSON.parse(data);

            if ('error' in response) {
              self.log('An error occured by switching to ' + accessory.context.favchannelname);
              self.log(data);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
              callback(null, true);
            } else {
              self.log('Switch to: ' + accessory.context.favchannelname);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(false);
              callback(null, false);
            }
          })
          .catch((err) => {
            self.log('An error occured by setting ' + accessory.displayName + ' off!');
            self.log(err);
            accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
            callback(null, true);
          });
      } else if (accessory.context.offstatename == 'OFF') {
        self.getContent('/sony/system', 'setPowerStatus', {
          'status': false
        }, '1.0')
          .then((data) => {
            const response = JSON.parse(data);

            if ('error' in response) {
              self.log('An error occured by setting tv state!');
              self.log(data);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
              callback(null, true);
            } else {
              self.log('Switch TV off');
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(false);
              callback(null, false);
            }
          })
          .catch((err) => {
            self.log('An error occured by setting tv state!');
            self.log(err);
            accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
            callback(null, true);
          });
      }
    }
  }
  
  getChannelOn(service, accessory){
    const self = this;
    self.getContent('/sony/avContent', 'getPlayingContentInfo', '1.0', '1.0')
      .then((data) => {
        const response = JSON.parse(data);
        var state = false;
        var channelnr, channelname;

        if ('result' in response) {
          const result = response.result[0];
          
          if(result.uri.match('tv')){
            state = true;
            channelnr = parseInt(result.dispNum);
            channelname = result.title;
          } else {
            state = false;
            channelnr = 0;
            channelname = self.storage.getItem('Sony_Channels')[0].title;
          }
          
        } else {
          state = false;
          channelnr = 0;
          channelname = self.storage.getItem('Sony_Channels')[0].title;
        }
        
        service.getCharacteristic(Characteristic.ChannelName).updateValue(channelname);  
        service.getCharacteristic(Characteristic.TargetChannel).updateValue(channelnr);       
        service.getCharacteristic(Characteristic.On).updateValue(state);

        self.errorCount.channels = 0;

        setTimeout(function () {
          self.getChannelOn(service, accessory);
        }, accessory.context.pollinterval);
      })
      .catch((err) => {
        if (self.errorCount.channels > 5) {
          self.errorCount.channels = 0;
          self.log('An error occured by getting ' + accessory.displayName + ' state, trying again..');
          self.log(err);
        }
        setTimeout(function () {
          self.errorCount.channels += 1;
          self.getChannelOn(service, accessory);
        }, 60000);
      });
  }
  
  setTargetChannel(accessory, service, value, callback){
    const self = this;   
    const channels = self.storage.getItem('Sony_Channels');
    var uri, title;
    for (var i = 0; i <= channels.length; i++) {
      switch (i) {
        case value:
          title = channels[i].title;
          uri = channels[i].uri;
          break;
      }
    }
    self.getContent('/sony/avContent', 'setPlayContent', {'uri': uri}, '1.0')
      .then((data) => {
        const response = JSON.parse(data);
        if ('error' in response) {
          self.log('An error occured by setting ' + title + ' on!');
          self.log(data);
          callback(null, value);
        } else {
          self.log('Turn on: ' + title);
          callback(null, value);
        }
      })
      .catch((err) => {
        self.log('An error occured by setting ' + title + ' on!');
        self.log(err);
        callback(null, value);
      });
  }
  
  setFavChannel(accessory, service, state, callback){
    const self = this;
    const allAccessories = self.accessories;
    if(state){
      self.getContent('/sony/avContent', 'setPlayContent', {'uri': accessory.context.favchanneluri}, '1.0')
        .then((data) => {
          const response = JSON.parse(data);
          if ('error' in response) {
            if (response.error[0] == 7 || response.error[0] == 40005) {
              self.getContent('/sony/system', 'setPowerStatus', {
                'status': true
              }, '1.0')
                .then((tvdata) => {
                  const tvresponse = JSON.parse(tvdata);
                  if('result' in tvresponse){
                    self.log('Turning on the TV...');
                    setTimeout(function () {
                      service.getCharacteristic(Characteristic.On).setValue(true);
                      service.getCharacteristic(Characteristic.On).updateValue(true);
                    }, 1000);
                    callback(null, true);
                  } else {
                    self.log('An error occured by setting TV on!');
                    self.log(tvdata);
                    callback(null, false);
                  }
                })
                .catch((tverr) => {
                  self.log('An error occured by setting TV on!');
                  self.log(tverr);
                  callback(null, false);
                });
            } else {
              self.log('An error occured by setting ' + accessory.context.favchannelname + ' on!');
              self.log(data);
              callback(null, false);
            }
          } else {
            self.log('Turn on: ' + accessory.context.favchannelname);
            for(const i in allAccessories){
              if(allAccessories[i].getService(Service.Switch)){
                for(const j in allAccessories[i].services){
                  const services = allAccessories[i].services;
                  if(services[j].displayName==self.config.name + ' Inputs'||services[j].displayName==self.config.name + ' Apps'){
                    const characteristics = services[j].characteristics;
                    for(const l in characteristics){
                      if(characteristics[l].displaName != 'Name'){
                        characteristics[l].updateValue(false);
                      }
                    }
                  }
                }
              }
            }
            callback(null, true);
          }
        })
        .catch((err) => {
          self.log('An error occured by setting ' + accessory.context.favchannelname + ' on!');
          self.log(err);
          callback(null, false);
        });
    } else {
      if (accessory.context.offstatename == 'HOME') {
        self.getContent('/sony/appControl', 'setActiveApp', {
          'uri': accessory.context.favappuri
        }, '1.0')
          .then((data) => {
            var response = JSON.parse(data);

            if ('error' in response) {
              self.log('An error occured by switching to ' + accessory.context.favappname);
              self.log(data);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
              callback(null, true);
            } else {
              self.log('Switch to: ' + accessory.context.favappname);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(false);
              callback(null, false);
            }
          })
          .catch((err) => {
            self.log('An error occured by setting ' + accessory.displayName + ' off!');
            self.log(err);
            accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
            callback(null, true);
          });
      } else if (accessory.context.offstatename == 'CHANNEL') {
        self.log('Can\'t take \'CHANNEL\' as offState for channel characteristic. Setting \'HOME\' as offState for channels!');
        self.getContent('/sony/appControl', 'setActiveApp', {
          'uri': accessory.context.favappuri
        }, '1.0')
          .then((data) => {
            var response = JSON.parse(data);

            if ('error' in response) {
              self.log('An error occured by switching to ' + accessory.context.favappname);
              self.log(data);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
              callback(null, true);
            } else {
              self.log('Switch to: ' + accessory.context.favappname);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(false);
              callback(null, false);
            }
          })
          .catch((err) => {
            self.log('An error occured by setting ' + accessory.displayName + ' off!');
            self.log(err);
            accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
            callback(null, true);
          });
      } else if (accessory.context.offstatename == 'OFF') {
        self.getContent('/sony/system', 'setPowerStatus', {
          'status': false
        }, '1.0')
          .then((data) => {
            const response = JSON.parse(data);

            if ('error' in response) {
              self.log('An error occured by setting tv state!');
              self.log(data);
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
              callback(null, true);
            } else {
              self.log('Switch TV off');
              accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(false);
              callback(null, false);
            }
          })
          .catch((err) => {
            self.log('An error occured by setting tv state!');
            self.log(err);
            accessory.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(true);
            callback(null, true);
          });
      }
    }
  }
  
  setCommand (charac, displayName, state, callback) {
    const self = this;     
    if(state){	    
      self.getIRCC(charac.props.uri)
        .then((data) => {
          if(!data.match('error')){
            self.log('Successfully send ' + displayName + ' command (' + charac.props.uri + ')');
          } else {
            self.log('An error occured by sending ' + displayName + ' command (' + charac.props.uri + ')');
          }
          setTimeout(function() {
            charac.updateValue(false);
          }, 500);
          callback(null, false);
        })
        .catch((err) => {
          self.log('An error occured by sending ' + displayName + ' command (' + charac.props.uri + ')');
          self.log(err);
          setTimeout(function() {
            charac.updateValue(false);
          }, 500);
          callback(null, false);
        });
    } else {
      callback(null, false);
    }
  }

  removeAccessory (accessory) {
    if (accessory) {
      this.log.warn('Removing accessory: ' + accessory.displayName + '. No longer configured.');
      this.api.unregisterPlatformAccessories(pluginName, platformName, [accessory]);
      delete this.accessories[accessory.displayName];
    }
  }
}

module.exports = BRAVIA;
