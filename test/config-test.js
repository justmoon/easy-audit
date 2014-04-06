var assert = require("assert");

var Config = require('../lib/config').Config;

describe('Config', function () {
  describe('#fromProgram', function () {
    it('should set certain properties', function () {
      var testProps = {
        verbose: true,
        currency: "LTC"
      };
      var config = Config.fromProgram(testProps);

      for (var i in testProps) {
        assert.equal(config[i], testProps[i]);
      }
    });
  });
});
