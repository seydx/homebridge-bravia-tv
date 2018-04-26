'use strict';

const inherits = require('util').inherits;

module.exports = {
  registerWith: function (hap) {
    const Characteristic = hap.Characteristic;
    const Service = hap.Service;
    
    /// /////////////////////////////////////////////////////////////////////////
    // MaxVolume Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.MaxVolume = function () {
      Characteristic.call(this, 'Max Volume', '158e647d-1d2f-4067-825c-3b58a009f4ce');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: Characteristic.Units.NONE,
        maxValue: 100,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.MaxVolume, Characteristic);
    Characteristic.MaxVolume.UUID = '158e647d-1d2f-4067-825c-3b58a009f4ce';
    
    /// /////////////////////////////////////////////////////////////////////////
    // PollInterval Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.PollInterval = function () {
      Characteristic.call(this, 'Polling Interval', '39208fb8-6675-4be6-8c6d-6a5af3253dd4');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: Characteristic.Units.NONE,
        maxValue: 100,
        minValue: 10,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.PollInterval, Characteristic);
    Characteristic.PollInterval.UUID = '39208fb8-6675-4be6-8c6d-6a5af3253dd4';
    
    /// /////////////////////////////////////////////////////////////////////////
    // FavChannelNr Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.FavChannelNr = function () {
      Characteristic.call(this, 'Favourite Channel', '27bc592f-aed6-4bff-8ca7-04d7e3a33936');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: Characteristic.Units.NONE,
        maxValue: 10,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.FavChannelNr, Characteristic);
    Characteristic.FavChannelNr.UUID = '27bc592f-aed6-4bff-8ca7-04d7e3a33936';
    
    /// /////////////////////////////////////////////////////////////////////////
    // FavChannelName Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.FavChannelName = function () {
      Characteristic.call(this, 'Favourite Channel', 'ba7c210c-52fe-4594-89ac-2c9f9f9d8e27');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.FavChannelName, Characteristic);
    Characteristic.FavChannelName.UUID = 'ba7c210c-52fe-4594-89ac-2c9f9f9d8e27';
    
    /// /////////////////////////////////////////////////////////////////////////
    // FavAppNr Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.FavAppNr = function () {
      Characteristic.call(this, 'Favourite App', '1ecf82e7-84e5-4584-8b49-d05a93ec3da3');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: Characteristic.Units.NONE,
        maxValue: 10,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.FavAppNr, Characteristic);
    Characteristic.FavAppNr.UUID = '1ecf82e7-84e5-4584-8b49-d05a93ec3da3';
    
    /// /////////////////////////////////////////////////////////////////////////
    // FavAppName Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.FavAppName = function () {
      Characteristic.call(this, 'Favourite App', 'efe5fd27-1dba-4b55-a243-25e5005434a6');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.FavAppName, Characteristic);
    Characteristic.FavAppName.UUID = 'efe5fd27-1dba-4b55-a243-25e5005434a6';
    
    /// /////////////////////////////////////////////////////////////////////////
    // FavInputNr Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.FavInputNr = function () {
      Characteristic.call(this, 'Favourite Input', '994310e0-27b6-4a13-9497-4954fa97645b');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: Characteristic.Units.NONE,
        maxValue: 10,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.FavInputNr, Characteristic);
    Characteristic.FavInputNr.UUID = '994310e0-27b6-4a13-9497-4954fa97645b';
    
    /// /////////////////////////////////////////////////////////////////////////
    // FavInputName Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.FavInputName = function () {
      Characteristic.call(this, 'Favourite Input', '4ace2c60-fd9e-4046-912b-fd03802f8617');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.FavInputName, Characteristic);
    Characteristic.FavInputName.UUID = '4ace2c60-fd9e-4046-912b-fd03802f8617';
    
    /// /////////////////////////////////////////////////////////////////////////
    // OffStateNr Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.OffStateNr = function () {
      Characteristic.call(this, 'Off State', '9648ec76-6139-4de2-8ecb-90be2420e33c');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: Characteristic.Units.NONE,
        maxValue: 3,
        minValue: 1,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.OffStateNr, Characteristic);
    Characteristic.OffStateNr.UUID = '9648ec76-6139-4de2-8ecb-90be2420e33c';
    
    /// /////////////////////////////////////////////////////////////////////////
    // OffStateName Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.OffStateName = function () {
      Characteristic.call(this, 'Off State', 'cc7d8f38-54f8-4b9f-9204-5a2d91ac0a8d');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.OffStateName, Characteristic);
    Characteristic.OffStateName.UUID = 'cc7d8f38-54f8-4b9f-9204-5a2d91ac0a8d';
    
    /// /////////////////////////////////////////////////////////////////////////
    // ChannelSourceNr Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.ChannelSourceNr = function () {
      Characteristic.call(this, 'Channel Source', '12a4d151-2fb9-4fa0-94ee-86aee2ee3a45');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: Characteristic.Units.NONE,
        maxValue: 2,
        minValue: 1,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ChannelSourceNr, Characteristic);
    Characteristic.ChannelSourceNr.UUID = '12a4d151-2fb9-4fa0-94ee-86aee2ee3a45';
    
    /// /////////////////////////////////////////////////////////////////////////
    // ChannelSourceName Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.ChannelSourceName = function () {
      Characteristic.call(this, 'Channel Source', 'c99c0a2e-725d-4dd4-979a-e9acaa4f2210');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ChannelSourceName, Characteristic);
    Characteristic.ChannelSourceName.UUID = 'c99c0a2e-725d-4dd4-979a-e9acaa4f2210';
    
    /// /////////////////////////////////////////////////////////////////////////
    // TargetApp Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.TargetApp = function () {
      Characteristic.call(this, 'App', '613f5692-4713-4743-85ca-627e8f17d3bf');
      this.setProps({
        format: Characteristic.Formats.INT,
        unit: Characteristic.Units.NONE,
        maxValue: 999,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.TargetApp, Characteristic);
    Characteristic.TargetApp.UUID = '613f5692-4713-4743-85ca-627e8f17d3bf';

    /// /////////////////////////////////////////////////////////////////////////
    // TargetName Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.TargetName = function () {
      Characteristic.call(this, 'App', 'e2454387-a3e9-44a9-82f2-852f9628ecbc');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.TargetName, Characteristic);
    Characteristic.TargetName.UUID = 'e2454387-a3e9-44a9-82f2-852f9628ecbc';

    /// /////////////////////////////////////////////////////////////////////////
    // ChannelName Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.ChannelName = function () {
      Characteristic.call(this, 'Channel', 'a4352cad-842b-47c1-9ef3-0300199ec849');
      this.setProps({
        format: Characteristic.Formats.STRING,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.ChannelName, Characteristic);
    Characteristic.ChannelName.UUID = 'a4352cad-842b-47c1-9ef3-0300199ec849';

    /// /////////////////////////////////////////////////////////////////////////
    // TargetChannel Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.TargetChannel = function () {
      Characteristic.call(this, 'Channel', 'b098e733-c600-4e89-a079-9625e20d5424');
      this.setProps({
        format: Characteristic.Formats.UINT8,
        unit: Characteristic.Units.NONE,
        maxValue: 99999,
        minValue: 0,
        minStep: 1,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.TargetChannel, Characteristic);
    Characteristic.TargetChannel.UUID = 'b098e733-c600-4e89-a079-9625e20d5424';

    /// /////////////////////////////////////////////////////////////////////////
    // Input Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.InputCharacteristics = function (api, parameter) {
      const displayName = parameter.name;
      const uri = parameter.uri;
      const meta = parameter.meta;

      this.UUID = api.uuid.generate(displayName);
      Characteristic.call(this, displayName, this.UUID);
      this.setProps({
        format: Characteristic.Formats.BOOL,
        unit: meta,
        uri: uri,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.InputCharacteristics, Characteristic);

    /// /////////////////////////////////////////////////////////////////////////
    // Command Characteristic
    /// /////////////////////////////////////////////////////////////////////////
    Characteristic.Command = function (api, parameter) {
      const displayName = parameter.name;

      this.UUID = api.uuid.generate(displayName);

      Characteristic.call(this, displayName, this.UUID);
      this.setProps({
        format: Characteristic.Formats.BOOL,
        type: parameter.type,
        uri: parameter.uri,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
      });
      this.value = this.getDefaultValue();
    };
    inherits(Characteristic.Command, Characteristic);

    /// /////////////////////////////////////////////////////////////////////////
    // RemoteControl Service
    /// /////////////////////////////////////////////////////////////////////////
    Service.RemoteControl = function (displayName, subtype) {
      Service.call(this, displayName, 'ac1a97c8-0271-4089-9a74-d330c0d48c14', subtype);
    };
    inherits(Service.RemoteControl, Service);
    Service.RemoteControl.UUID = 'ac1a97c8-0271-4089-9a74-d330c0d48c14';
  }
};
