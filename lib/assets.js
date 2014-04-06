var fs = require('fs'),
    bitcoin = require('bitcoinjs-lib'),
    Big = require('big.js');

var Assets = function (assets, message, config) {
  this._assets = assets;
  this._message = message;
  this._config = config;
};

Assets.prototype.verifySignatures = function () {
  var _this = this;

  if (this._config.verbose) {
    process.stderr.write("Verifying "+this._assets.length+" assets");
  }

  // Loop over assets and verify all signatures
  this._assets.forEach(function (asset) {
    var valid = bitcoin.Message.verify(asset.asset, bitcoin.convert.base64ToBytes(asset.signature), _this._message);

    if (!valid) {
      throw new Error("Invalid asset signature for "+asset.asset);
    }

    if (_this._config.verbose) {
      process.stderr.write(".");
    }
  });

  if (this._config.verbose) {
    process.stderr.write("DONE\n");
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
  if ("undefined" === typeof data.assets) {
    throw new Error("Invalid assets file, no 'assets' property.");
  }
  if (!Array.isArray(data.assets)) {
    throw new Error("Invalid assets file, 'assets' is not an array.");
  }

  if ("string" !== typeof data.blockhash) {
    throw new Error("Invalid assets file, 'blockhash' invalid type or not present");
  }

  if (""+parseInt(data.blockheight) !== ""+data.blockheight) {
    throw new Error("Invalid assets file, 'blockheight' invalid type or not present");
  }

  var expectedMessage = data.owner + " : " + data.blockhash;
  if (data.message !== expectedMessage) {
    throw new Error("Invalid assets file, 'message' should be '"+expectedMessage+"'");
  }

  var assets = new Assets(data.assets, data.message, config);
  return assets;
};

exports.Assets = Assets;
