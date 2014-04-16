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
  // Output streams
  reportTo: process.stdout,
  logTo: process.stderr,

  // Whether to log additional information
  verbose: false,

  // ISO currency code (not currently used)
  currency: "BTC"
};

exports.Config = Config;
