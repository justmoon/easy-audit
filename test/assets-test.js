var assert = require("assert"),
    fs = require("fs"),
    extend = require("extend"),
    streamBuffers = require("stream-buffers");

var Assets = require('../lib/assets').Assets,
    Config = require('../lib/config').Config;

var exampleData = JSON.parse(fs.readFileSync(__dirname + '/data/assets.json'));

describe('Assets', function () {
  describe('#new', function () {
    var data;

    beforeEach(function () {
      data = extend(true, {}, exampleData);
    });

    it('should successfully instantiate', function () {
      var assets = new Assets(data);
    });

    it('should throw when assets are undefined', function () {
      data.assets = void(0);
      assert.throws(function () {
        var assets = new Assets(data);
      });
    });

    it('should throw when assets is not an array', function () {
      data.assets = "bogus";
      assert.throws(function () {
        var assets = new Assets(data);
      });
    });

    it('should throw when blockhash is not a string', function () {
      data.blockhash = 123;
      assert.throws(function () {
        var assets = new Assets(data);
      });
    });

    it('should throw when blockheight is a non-numeric string', function () {
      data.blockheight = "bogus";
      assert.throws(function () {
        var assets = new Assets(data);
      });
    });

    it('should throw when blockheight is a non-integer string', function () {
      data.blockheight = 123.123;
      assert.throws(function () {
        var assets = new Assets(data);
      });
    });

    it('should succeed when blockheight is an integer string', function () {
      data.blockheight = "123";
      var assets = new Assets(data);
    });

    it('should succeed when blockheight is an integer', function () {
      data.blockheight = 123;
      var assets = new Assets(data);
    });

    it('should throw when the message does not match owner and blockhash', function () {
      data.message = "example2.com : "+data.blockhash;
      assert.throws(function () {
        var assets = new Assets(data);
      });
    });
  });
  describe('#verifySignatures', function () {
    var assets;

    beforeEach(function () {
      var data = extend(true, {}, exampleData);
      assets = new Assets(data);
    });

    it('should succeed when signatures are valid', function () {
      assets.verifySignatures();
    });

    it('should print debug information when in verbose mode', function () {
      assets._config.verbose = true;
      var stderr = assets._config.logTo = new streamBuffers.WritableStreamBuffer();

      assets.verifySignatures();

      assert.equal(stderr.getContentsAsString("utf8"), "Verifying 1 assets.DONE\n");
    });

    it('should throw when signatures are invalid', function () {
      assets._assets[0].signature = "G3Y53f4QCWgqyKx3lK70CDr+SWHm2B/ThxG+kzjp+zR1d4AfpybnGEdNY8j1YQvBK0mw7E8AgLnUON2V+cdrAcQ=";
      assert.throws(function () {
        assets.verifySignatures();
      }, /Invalid asset signature/);
    });
  });
  describe('#getTotal', function () {
    var assets;

    beforeEach(function () {
      var data = extend(true, {}, exampleData);
      assets = new Assets(data);
    });
    it('should calculate the right total', function () {
      var total = assets.getTotal();
      assert.equal(total.toString(), "12450");
    });
    it('should throw when an asset has no balance', function () {
      assets._assets[0].balance = void(0);
      assert.throws(function () {
        assets.getTotal();
      }, /no balance/);
    });
    it('should throw when balance is an integer', function () {
      assets._assets[0].balance = 123;
      assert.throws(function () {
        assets.getTotal();
      }, /no balance/);
    });
    it('should throw when a balance is a non-numeric string', function () {
      assets._assets[0].balance = "abc";
      assert.throws(function () {
        assets.getTotal();
      }, /balance has invalid format/);
    });
    it('should throw when a balance is a non-integer string', function () {
      assets._assets[0].balance = "123.123";
      assert.throws(function () {
        assets.getTotal();
      }, /balance has invalid format/);
    });
    it('should throw when a balance is negative', function () {
      assets._assets[0].balance = "-123";
      assert.throws(function () {
        assets.getTotal();
      }, /balance has invalid format/);
    });
  });
  describe('#fromFile', function () {
    it('should successfully parse a valid example file', function () {
      var filename = __dirname + '/data/assets.json';
      var assets = Assets.fromFile(filename);
      assert.equal(assets._assets.length, 1);
      assert.equal(assets._assets[0].asset, "1P8EnMGHjwLYcGbdwGUapGRnff758Ux8iS");
      assert.equal(assets._message, "example.com : 0000000000000000525d3fe3dcb6e08de102d36b51f466f689e33c869049c547");
    });
    it('should throw with no path', function () {
      var filename = void(0);
      assert.throws(function () {
        Assets.fromFile(filename);
      }, /path must be a string/);
    });
    it('should throw when the file does not exist', function () {
      var filename = __dirname + '/data/nonexistent.json';
      assert.throws(function () {
        Assets.fromFile(filename);
      }, /no such file or directory/);
    });
    it('should throw when the JSON is invalid', function () {
      var filename = __dirname + '/data/invalid.json';
      assert.throws(function () {
        Assets.fromFile(filename);
      }, /SyntaxError/);
    });
  });
});
