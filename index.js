/**
 * v3.0.0
 *
 * @url https://github.com/SeydX/homebridge-bravia-tv
 * @author SeydX <seyd55@outlook.de>
 *
**/

'use strict';

module.exports = function (homebridge) {
  let BraviaTV = require('./src/platform.js')(homebridge);
  homebridge.registerPlatform('homebridge-bravia-tv', 'BraviaTV', BraviaTV, true);
};
