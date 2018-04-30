'use strict';

const http = require('http');
const async = require('async');
const Device = require('./accessory.js');

var HomebridgeAPI;

const pluginName = 'homebridge-bravia-tv';
const platformName = 'BraviaTV';

module.exports = function (homebridge) {
  HomebridgeAPI = homebridge;
  return BraviaTV;
};

function BraviaTV (log, config, api) {
  if (!api || !config) return;
  if (!config.psk || !config.ipadress) throw new Error('Please check your config.json!');

  // HB
  const self = this;
  this.log = log;
  this.accessories = [];
  this.channelArray = [];
  this.channel = 0;
  
  this.configParameter = {
    name: config.name||'TV',
    psk: config.psk,
    ipadress: config.ipadress,
    port: config.port||80,
    extraInputs: config.extraInputs||false,
    volumeEnabled: config.volumeEnabled===true,
    appsEnabled: config.appsEnabled||false,
    channelsEnabled: config.channelsEnabled||false,
    detectCEC: config.detectCEC||false,
    remoteControl: config.remoteControl||false,
    inputsEnabled: config.inputsEnabled===true,
    tvEnabled: config.tvEnabled===true
  };
  
  this.config = this.configParameter;

  // STORAGE
  this.storage = require('node-persist');
  this.storage.initSync({
    dir: HomebridgeAPI.user.persistPath()
  });

  this.types = {
    tv: 1,
    inputs: 2,
    apps: 3,
    channels: 4,
    remote: 5,
    volume: 6
  };

  // Init req promise
  this.getContent = function (setPath, setMethod, setParams, setVersion) {
    return new Promise((resolve, reject) => {
      var options = {
        host: self.config.ipadress,
        port: self.config.port,
        family: 4,
        path: setPath,
        method: 'POST',
        headers: {
          'X-Auth-PSK': self.config.psk
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
  
  if (api) {
    if (api.version < 2.2) {
      throw new Error('Unexpected API version. Please update your homebridge!');
    }
    this.api = api;
    this.api.on('didFinishLaunching', self.didFinishLaunching.bind(this));
  }
}

BraviaTV.prototype = {

  didFinishLaunching: function(){
    const self = this;
    self.checkStorage(function (err, state) {
      if(err||!state){
        if(err)self.log(err);
        setTimeout(function(){
          self.didFinishLaunching();
        }, 5000);
      } else {
        self.initPlatform(); 
      }
    });  
  },
	
  checkStorage: function(callback){
    const self = this;
    if((self.config.appsEnabled && !self.storage.getItem('Sony_Apps'))||
       (self.config.channelsEnabled && !self.storage.getItem('Sony_Channels'))||
       (self.config.remoteControl && !self.storage.getItem('Sony_Remote'))||
       (self.config.inputsEnabled && !self.storage.getItem('Sony_Inputs'))){
      self.log('Missing storage file! Checking TV state...');
      self.getContent('/sony/system', 'getPowerStatus', '1.0', '1.0')
        .then((data) => {
          var response = JSON.parse(data);
          if ('error' in response) {
            self.log('An error occured by getting TV state');
            callback(data, false);
          } else {
            const state = response.result[0].status;
            if (state == 'active') {
              self.log('TV is active.');
              
              async.waterfall([
                function(next) {
                  if(self.config.appsEnabled){
                    if(!self.storage.getItem('Sony_Apps')){
                      self.installedApps(function (err, result) {
                        if (err) {
                          self.log('An error occurred by getting \'Apps\'! Trying again...');
                          callback(err, false);
                        } else {
                          self.log('Storing \'Sony_Apps\' in cache...');
                          self.storage.setItem('Sony_Apps', result);
                          next();
                        }
                      });
                    } else {
                      next();
                    }
                  } else {
                    self.log('Apps not enabled, skip requesting...');
                    next();
                  }
                },
                function(next) {
                  if(self.config.channelsEnabled){
                    if(!self.storage.getItem('Sony_Channels')){
                      self.mainChannels(0, 200, function (err, result) {
                        if (err) {
                          self.log('An error occurred by getting \'Channels\'! Trying again...');
                          callback(err, false);
                        } else {
                          self.log('Storing \'Sony_Channels\' in cache...');
                          self.storage.setItem('Sony_Channels', result);
                          next();
                        }
                      });
                    } else {
                      next();
                    }
                  } else {
                    self.log('Channels not enabled, skip requesting...');
                    next();
                  }
                },
                function(next) {
                  if(self.config.inputsEnabled){
                    if(!self.storage.getItem('Sony_Inputs')){
                      self.externalInputs(function (err, result) {
                        if (err) {
                          self.log('An error occurred by getting \'External inputs\'! Trying again...');
                          callback(err, false);
                        } else {
                          const resultArray = [];
                          for (const j in result) {
                            const parameter = {
                              name: result[j].title,
                              uri: result[j].uri,
                              meta: result[j].icon
                            };
                            var newConfig = JSON.parse(JSON.stringify(parameter));
                            resultArray.push(newConfig);
                          }
                          self.log('Storing \'Sony_Inputs\' in cache...');
                          self.storage.setItem('Sony_Inputs', resultArray);
                          next();
                        }
                      });
                    } else {
                      next();
                    }
                  } else {
                    self.log('Inputs not enabled, skip requesting...');
                    next();
                  }
                },
                function(next) {
                  if(self.config.remoteControl){
                    if(!self.storage.getItem('Sony_Remote')){
                      self.remoteCommands(function (err, result) {
                        if (err) {
                          self.log('An error occurred by getting \'Remote control commands\'! Trying again...');
                          callback(err, false);
                        } else {
                          const resultArray = [];
                          for (const j in result) {
                            if (result[j].name == 'Up' ||
                                result[j].name == 'Down' ||
                                result[j].name == 'Right' ||
                                result[j].name == 'Left' ||
                                result[j].name == 'Confirm' ||
                                result[j].name == 'Exit' ||
                                result[j].name == 'Home' ||
                                result[j].name == 'Return' ||
                                result[j].name == 'Netflix'
                            ) {
                              const parameter = {
                                name: result[j].name,
                                value: result[j].value
                              };
                              var newConfig = JSON.parse(JSON.stringify(parameter));
                              resultArray.push(newConfig);
                            }
                          }
                          self.log('Storing \'Sony_Remote\' in cache...');
                          self.storage.setItem('Sony_Remote', resultArray);
                          next(null, 'Finished!');
                        }
                      });
                    } else {
                      next(null, 'Finished!');
                    }
                  } else {
                    self.log('Remote not enabled, skip requesting...');
                    next();
                  }
                }
              ], function (err, result) {
                if(err){
                  self.log(err);
                } else {
                  self.log(result);
                  self.log('Initialize configuration...');
                  setTimeout(function(){
                    callback(null, true); 
                  }, 5000);
                }
              });
              
            } else {
              callback('TV seems to be off! Please turn on the TV for storing TV information in cache! Trying again...', false);
            }
          }
        })
        .catch((err) => {
          self.log('An error occured by getting TV state');
          callback(err, false);
        });
    } else {
      callback(null, true);
    }
  },

  tvState: function (callback) {
    const self = this;

    self.getContent('/sony/system', 'getPowerStatus', '1.0', '1.0')
      .then((tvdata) => {
        var tvresponse = JSON.parse(tvdata);
        var status = tvresponse.result[0].status;

        if ('error' in tvresponse) {
          callback(tvdata, null);
          setTimeout(function () {
            self.tvState(callback);
          }, 10000);
        } else {
          if (status == 'active') {
            callback(null, status);
          } else if (status == 'standby') {
            callback(null, status);
            setTimeout(function () {
              self.tvState(callback);
            }, 10000);
          } else {
            callback(status, null);
            setTimeout(function () {
              self.tvState(callback);
            }, 10000);
          }
        }
      })
      .catch((err) => {
        callback(err, null);
        setTimeout(function () {
          self.tvState(callback);
        }, 10000);
      });
  },

  externalInputs: function (callback) {
    const self = this;

    self.getContent('/sony/avContent', 'getCurrentExternalInputsStatus', '1.0', '1.0')
      .then((data) => {
        var response = JSON.parse(data);

        if ('error' in response) {
          callback(data, null);
          setTimeout(function () {
            self.externalInputs(callback);
          }, 10000);
        } else {
          callback(null, response.result[0]);
        }
      })
      .catch((err) => {
        callback(err, null);
        setTimeout(function () {
          self.externalInputs(callback);
        }, 10000);
      });
  },

  installedApps: function (callback) {
    const self = this;

    self.getContent('/sony/appControl', 'getApplicationList', '1.0', '1.0')
      .then((data) => {
        var response = JSON.parse(data);

        if ('error' in response) {
          callback(data, null);
          setTimeout(function () {
            self.installedApps(callback);
          }, 10000);
        } else {
          callback(null, response.result[0]);
        }
      })
      .catch((err) => {
        callback(err, null);
        setTimeout(function () {
          self.installedApps(callback);
        }, 10000);
      });
  },

  mainChannels: function (stIdx, cnt, callback) {
    this.channel++;  
    const self = this;

    self.getContent('/sony/avContent', 'getContentList', {'source': 'tv:dvbt', 'stIdx': stIdx, 'cnt':cnt}, '1.2')
      .then((data) => {
        var response = JSON.parse(data);

        if ('error' in response) {
          callback(data, null);
          setTimeout(function () {
            self.mainChannels(stIdx, cnt, callback);
          }, 60000);
        } else {
          const channelList = response.result[0];        
          for(const i in channelList){
            const parameter = {
              uri: channelList[i].uri,
              title: channelList[i].title,
              index: channelList[i].index,
              dispNum: channelList[i].dispNum
            };
            self.channelArray.push(parameter);
          }
          if(channelList.length==cnt){
            self.mainChannels(cnt*self.channel, cnt, callback);
          } else {
            callback(null, self.channelArray); 
          }
        }
      })
      .catch((err) => {
        callback(err, null);
        setTimeout(function () {
          self.mainChannels(stIdx, cnt, callback);
        }, 10000);
      });
  },

  remoteCommands: function (callback) {
    const self = this;

    self.getContent('/sony/system', 'getRemoteControllerInfo', '1.0', '1.0')
      .then((data) => {
        var response = JSON.parse(data);

        if ('error' in response) {
          callback(data, null);
          setTimeout(function () {
            self.remoteCommands(callback);
          }, 10000);
        } else {
          callback(null, response.result[1]);
        }
      })
      .catch((err) => {
        callback(err, null);
        setTimeout(function () {
          self.remoteCommands(callback);
        }, 10000);
      });
  },

  initPlatform: function () {
    const self = this;
    var skip;

    if (this.config.volumeEnabled) {
      skip = false;
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.volume) {
          skip = true;
        }
      }
      if (!skip) {
        new Device(this, this.types.volume, true);
      }
    } else {
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.volume) {
          this.removeAccessory(this.accessories[i]);
        }
      }
    }

    if (this.config.appsEnabled) {
      skip = false;
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.apps) {
          skip = true;
        }
      }
      if (!skip) {
        new Device(this, self.types.apps, true);
      }
    } else {
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.apps) {
          this.removeAccessory(this.accessories[i]);
        }
      }
    }

    if (this.config.channelsEnabled) {
      skip = false;
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.channels) {
          skip = true;
        }
      }
      if (!skip) {
        new Device(this, this.types.channels, true);
      }
    } else {
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.channels) {
          this.removeAccessory(this.accessories[i]);
        }
      }
    }

    if (this.config.remoteControl) {
      skip = false;
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.remote) {
          skip = true;
        }
      }
      if (!skip) {
        new Device(this, this.types.remote, true);
      }
    } else {
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.remote) {
          this.removeAccessory(this.accessories[i]);
        }
      }
    }

    if (this.config.inputsEnabled) {
      skip = false;
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.inputs) {
          skip = true;
        }
      }
      if (!skip) {
        new Device(this, this.types.inputs, true);
      }
    } else {
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.inputs) {
          this.removeAccessory(this.accessories[i]);
        }
      }
    }
    
    if (this.config.tvEnabled) {
      skip = false;
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.tv) {
          skip = true;
        }
      }
      if (!skip) {
        new Device(this, this.types.tv, true);
      }
    } else {
      for (const i in this.accessories) {
        if (this.accessories[i].context.type == this.types.tv) {
          this.removeAccessory(this.accessories[i]);
        }
      }
    }
    
    if(self.config.tvEnabled){
      const allAccessories = self.accessories;
      for(const j in allAccessories){
        if(allAccessories[j].displayName == self.config.name + ' Power'){
          const accessory = allAccessories[j];
          self.log('Current TV configuration:');
          self.log('Last volume: ' + accessory.context.lastvolume);
          self.log('Max configurable volume: ' + accessory.context.maxvolume);
          self.log('Polling interval: ' + accessory.context.pollinterval / 1000 + ' seconds');
          self.log('Off State: ' + accessory.context.offstatename);
          self.log('Channel source: ' + accessory.context.channelsourcename);
          self.log('Max configurable apps: ' + accessory.context.maxapps);
          self.log('Favourite app: ' + accessory.context.favappname);
          self.log('Max configurable channels: ' + accessory.context.maxchannels);
          self.log('Favourite channel: ' + accessory.context.favchannelname);
          self.log('Max configurable inputs: ' + accessory.context.maxinputs);
          self.log('Favourite input: ' + accessory.context.favinputname);
        }
      }
    }
    
  },

  configureAccessory: function (accessory) {
    const self = this;
    if((self.config.appsEnabled && !self.storage.getItem('Sony_Apps'))||
       (self.config.channelsEnabled && !self.storage.getItem('Sony_Channels'))||
       (self.config.remoteControl && !self.storage.getItem('Sony_Remote'))||
       (self.config.inputsEnabled && !self.storage.getItem('Sony_Inputs'))){
      setTimeout(function(){
        self.configureAccessory(accessory);
      }, 2000);
    } else {
      self.log.info('Configuring accessory from cache: ' + accessory.displayName);
      accessory.reachable = true;
      self.accessories[accessory.displayName] = accessory;
      new Device(self, accessory, false);
    }
  },

  removeAccessory: function (accessory) {
    if (accessory) {
      this.log.warn('Removing accessory: ' + accessory.displayName + '. No longer configured.');
      this.api.unregisterPlatformAccessories(pluginName, platformName, [accessory]);
      delete this.accessories[accessory.displayName];
    }
  }

};
