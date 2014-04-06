var fs = require('fs'),
    crypto = require('crypto'),
    Big = require('big.js');

var Liabilities = function (accounts, config) {
  this._accounts = accounts;
  this._config = config;
  this._tree = null;
  this._hash = 'sha256';
};

Liabilities.prototype.calculateRoot = function () {
  var _this = this;

  this.buildTree();

  return this._tree[this._tree.length-1];
};

Liabilities.prototype.getTotal = function () {
  var _this = this;

  var total = new Big(0);

  this._accounts.forEach(function (account) {
    if ("string" !== typeof account.balance) {
      throw new Error("Account "+account.nonce+" has invalid or no balance.");
    }
    if (!account.balance.match(/^[0-9]+$/)) {
      throw new Error("Account "+account.nonce+" balance has invalid format.");
    }
    total = total.plus(account.balance);
  });

  return total;
};

Liabilities.prototype.buildTree = function () {
  var _this = this;

  if (this._config.verbose) {
    process.stderr.write("Building tree with "+this._accounts.length+" accounts\n");
  }

  // Import leaf nodes into tree
  this._tree = this._accounts.map(function (account) {
    return crypto.createHash(_this._hash).update(
      account.nonce + "|" + account.balance
    ).digest('hex');
  });

  // Pad the tree to be of size 2^n
  var binaryLogOfLength = 0, length = this._tree.length;
  while (length) {
    length = length >>> 1;
    binaryLogOfLength++;
  }
  var powerOfTwoSize = 1 << binaryLogOfLength;
  this._tree = this._tree.concat(new Array(powerOfTwoSize - this._tree.length));

  // Calculate internal nodes including root node
  var i = 1;
  while (i < this._tree.length) {
    this._tree.push(_this.combineNodes(this._tree[i-1], this._tree[i]));
    i += 2;
  }
};

Liabilities.prototype.combineNodes = function (a, b) {
  // If both nodes are non-existent, their parent doesn't either
  if ("undefined" === typeof a && "undefined" === typeof b) {
    return void(0);
  }

  // If the right node doesn't exist, the left node gets promoted
  if ("undefined" === typeof b) {
    return a;
  }

  // Otherwise, nodes must be strings
  if ("string" !== typeof a) {
    throw new Error("Invalid left node in merkle tree generation.");
  }
  if ("string" !== typeof b) {
    throw new Error("Invalid right node in merkle tree generation.");
  }

  // Hash the two nodes together
  return crypto.createHash(this._hash).update(
    a + "|" + b
  ).digest('hex');
};

Liabilities.fromFile = function (path, config) {
  var data = JSON.parse(fs.readFileSync(path));
  if ("undefined" === typeof data.accounts) {
    throw new Error("Invalid liabilities file, no 'accounts' property.");
  }
  if (!Array.isArray(data.accounts)) {
    throw new Error("Invalid liabilities file, 'accounts' is not an array.");
  }
  var liabilities = new Liabilities(data.accounts, config);
  return liabilities;
};

exports.Liabilities = Liabilities;
