var assert = require("assert"),
    fs = require("fs"),
    extend = require("extend"),
    streamBuffers = require("stream-buffers");

var Liabilities = require('../lib/liabilities').Liabilities,
    Config = require('../lib/config').Config;

var exampleData = JSON.parse(fs.readFileSync(__dirname + '/data/liabilities.json'));

describe('Liabilities', function () {
  
  describe('#new', function () {
    var data;

    beforeEach(function () {
      data = extend(true, {}, exampleData);
    });

    it('should successfully instantiate', function () {
      var assets = new Liabilities(data);
    });

    it('should throw when accounts are undefined', function () {
      data.accounts = void(0);
      assert.throws(function () {
        var assets = new Liabilities(data);
      });
    });

    it('should throw when accounts is not an array', function () {
      data.accounts = "bogus";
      assert.throws(function () {
        var assets = new Liabilities(data);
      });
    });
  });
  describe('#calculateRoot', function () {
    var liabilities;

    beforeEach(function () {
      var data = extend(true, {}, exampleData);
      liabilities = new Liabilities(data);
    });

    it('should result in correct root', function () {
      var root = liabilities.calculateRoot();
      assert.equal(root, "25faefe8190e0d179e3029b186e02be644a9c55b786df73ffb33ba270090b022");
    });

    it('should print debug information when in verbose mode', function () {
      liabilities._config.verbose = true;
      var stderr = liabilities._config.logTo = new streamBuffers.WritableStreamBuffer();

      liabilities.calculateRoot();

      assert.equal(stderr.getContentsAsString("utf8"), "Building tree with 5 accounts\n");
    });
  });
  describe('#combineNodes', function () {
    var liabilities;

    beforeEach(function () {
      var data = extend(true, {}, exampleData);
      liabilities = new Liabilities(data);
    });

    it('should return undefined for two undefined nodes', function () {
      var node = liabilities.combineNodes(void(0), void(0));
      assert.equal(typeof node, "undefined");
    });

    it('should return the left node when the right one is undefined', function () {
      var node = liabilities.combineNodes("test", void(0));
      assert.equal(node, "test");
    });

    it('should throw when only the right node is defined', function () {
      assert.throws(function () {
        liabilities.combineNodes(void(0), "test");
      }, /Invalid left node/);
    });

    it('should throw when left node is an integer', function () {
      assert.throws(function () {
        liabilities.combineNodes(123, "test");
      }, /Invalid left node/);
    });

    it('should throw when right node is an integer', function () {
      assert.throws(function () {
        liabilities.combineNodes("test", 123);
      }, /Invalid right node/);
    });
  });
  describe('#getTotal', function () {
    var liabilities;

    beforeEach(function () {
      var data = extend(true, {}, exampleData);
      liabilities = new Liabilities(data);
    });
    it('should calculate the right total', function () {
      var total = liabilities.getTotal();
      assert.equal(total.toString(), "11602");
    });
    it('should throw when an asset has no balance', function () {
      liabilities._accounts[0].balance = void(0);
      assert.throws(function () {
        liabilities.getTotal();
      }, /no balance/);
    });
    it('should throw when balance is an integer', function () {
      liabilities._accounts[0].balance = 123;
      assert.throws(function () {
        liabilities.getTotal();
      }, /no balance/);
    });
    it('should throw when a balance is a non-numeric string', function () {
      liabilities._accounts[0].balance = "abc";
      assert.throws(function () {
        liabilities.getTotal();
      }, /balance has invalid format/);
    });
    it('should throw when a balance is a non-integer string', function () {
      liabilities._accounts[0].balance = "123.123";
      assert.throws(function () {
        liabilities.getTotal();
      }, /balance has invalid format/);
    });
    it('should throw when a balance is negative', function () {
      liabilities._accounts[0].balance = "-123";
      assert.throws(function () {
        liabilities.getTotal();
      }, /balance has invalid format/);
    });
  });
  describe('#fromFile', function () {
    it('should successfully parse a valid example file', function () {
      var filename = __dirname + '/data/liabilities.json';
      var liabilities = Liabilities.fromFile(filename);
      assert.equal(liabilities._accounts.length, 5);
      assert.equal(liabilities._accounts[0].nonce, "13550350a8681c84c861aac2e5b440161c2b33a3e4f302ac680ca5b686de48de");
    });
    it('should throw with no path', function () {
      var filename = void(0);
      assert.throws(function () {
        Liabilities.fromFile(filename);
      }, /path must be a string/);
    });
    it('should throw when the file does not exist', function () {
      var filename = __dirname + '/data/nonexistent.json';
      assert.throws(function () {
        Liabilities.fromFile(filename);
      }, /no such file or directory/);
    });
    it('should throw when the JSON is invalid', function () {
      var filename = __dirname + '/data/invalid.json';
      assert.throws(function () {
        Liabilities.fromFile(filename);
      }, /SyntaxError/);
    });
  });
});
