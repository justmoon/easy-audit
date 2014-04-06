var fs = require('fs'),
    bitcoin = require('bitcoinjs-lib'),
    Big = require('big.js'),
    Config = require('./config').Config;

var Assets = function (data, config) {
  if ("undefined" === typeof data.assets) {
    throw new Error("Invalid assets data, no 'assets' property.");
  }

  if (!Array.isArray(data.assets)) {
    throw new Error("Invalid assets data, 'assets' is not an array.");
  }

  if ("string" !== typeof data.blockhash) {
    throw new Error("Invalid assets data, 'blockhash' invalid type or not present");
  }

  if (""+parseInt(data.blockheight) !== ""+data.blockheight) {
    throw new Error("Invalid assets data, 'blockheight' invalid type or not present");
  }

  if ("string" !== typeof data.owner) {
    throw new Error("Invalid assets data, missing or invalid 'owner'");
  }

  var expectedMessage = data.owner + " : " + data.blockhash;
  if (data.message !== expectedMessage) {
    throw new Error("Invalid assets data, 'message' should be '"+expectedMessage+"'");
  }

  this._assets = data.assets;
  this._message = data.message;
  this._owner = data.owner;
  this._blockheight = parseInt(data.blockheight);
  this._config = config || new Config();
};

Assets.prototype.getBlockHeight = function () {
  return this._blockheight;
};

Assets.prototype.getOwner = function () {
  return this._owner;
};

Assets.prototype.verifySignatures = function () {
  var _this = this;

  if (this._config.verbose) {
    this._config.logTo.write("Verifying "+this._assets.length+" assets");
  }

  // Loop over assets and verify all signatures
  this._assets.forEach(function (asset) {
    var valid = bitcoin.Message.verify(asset.asset, bitcoin.convert.base64ToBytes(asset.signature), _this._message);

    if (!valid) {
      throw new Error("Invalid asset signature for "+asset.asset);
    }

    if (_this._config.verbose) {
      _this._config.logTo.write(".");
    }
  });

  if (this._config.verbose) {
    this._config.logTo.write("DONE\n");
  }
};

Assets.prototype.getTotal = function () {
  var total = new Big(0);

  this._assets.forEach(function (asset) {
    if ("string" !== typeof asset.balance) {
      throw new Error("Asset "+asset.asset+" has invalid or no balance.");
    }
    if (!asset.balance.match(/^[0-9]+$/)) {
      throw new Error("Asset "+asset.asset+" balance has invalid format.");
    }

    total = total.plus(asset.balance);
  });

  return total;
};

Assets.fromFile = function (path, config) {
  var data = JSON.parse(fs.readFileSync(path));

  var assets = new Assets(data, config);
  return assets;
};

exports.Assets = Assets;
