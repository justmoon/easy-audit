var extend = require('extend');

var Config = function () {
  extend(this, Config.defaults);
};

Config.fromProgram = function (program) {
  var config = new Config();

  config.verbose = program.verbose;
  config.currency = program.currency;

  return config;
};

Config.defaults = {
  logTo: process.stderr,
  verbose: false,
  currency: "BTC"
};

exports.Config = Config;
