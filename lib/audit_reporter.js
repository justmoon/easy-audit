var Liabilities = require('./liabilities').Liabilities,
    Assets = require('./assets').Assets,
    Config = require('./config').Config;

var AuditReporter = function (config) {
  this._config = config || new Config();
};

AuditReporter.prototype.audit = function (liabilitiesFile, assetsFile) {
  var liabilities = Liabilities.fromFile(liabilitiesFile, this._config);
  var assets = Assets.fromFile(assetsFile, this._config);

  // Print basic audit information
  this._config.reportTo.write("ASSET OWNER: " + assets.getOwner() + "\n");
  this._config.reportTo.write("BLOCK HEIGHT: " + assets.getBlockHeight() + "\n");

  assets.verifySignatures();

  var root = liabilities.calculateRoot();
  this._config.reportTo.write("ROOT HASH: " + root + "\n");

  var totalLiabilities = liabilities.getTotal();
  var totalAssets = assets.getTotal();

  if (this._config.verbose) {
    process.stderr.write("Total liabilities: "+totalLiabilities.toString()+"\n");
    process.stderr.write("Total assets:      "+totalAssets.toString()+"\n");
  }

  var ratio = totalAssets.div(totalLiabilities).times(100).toFixed(2);
  this._config.reportTo.write("RESERVE RATIO: " + ratio+"%\n");
};

exports.AuditReporter = AuditReporter;
