var assert = require("assert"),
    streamBuffers = require("stream-buffers");

var AuditReporter = require('../lib/audit_reporter').AuditReporter,
    Config = require('../lib/config').Config;

var validLiabilitiesFile = __dirname + '/data/liabilities.json';
var validAssetsFile = __dirname + '/data/assets.json';
var expectedAuditReport =
      "ASSET OWNER: example.com\n" +
      "BLOCK HEIGHT: 294548\n" +
      "ROOT HASH: 25faefe8190e0d179e3029b186e02be6" +
                 "44a9c55b786df73ffb33ba270090b022\n" +
      "RESERVE RATIO: 107.31%\n";

describe('AuditReporter', function () {
  describe('#audit', function () {
    var reporter, config, stderr, stdout;

    beforeEach(function () {
      config = new Config();
      // Redirect output to the void
      config.reportTo = { write: function noop(){} };
      config.logTo = { write: function noop(){} };
      reporter = new AuditReporter(config);
    });

    it("should instantiate successfully even when no config object is provided", function () {
      var defaultReporter = new AuditReporter();
      assert.strictEqual(defaultReporter._config.verbose, Config.defaults.verbose);
      assert.equal(defaultReporter._config.currency, Config.defaults.currency);
    });

    it("should print the correct audit report when the audit data is valid", function () {
      var stdout = config.reportTo = new streamBuffers.WritableStreamBuffer();

      reporter.audit(validLiabilitiesFile, validAssetsFile);

      var report = stdout.getContentsAsString();
      assert.equal(report, expectedAuditReport);
    });

    it("should print no debug data when the verbose flag is false", function () {
      var stderr = config.logTo = new streamBuffers.WritableStreamBuffer();
      config.verbose = false;

      reporter.audit(validLiabilitiesFile, validAssetsFile);

      var debug = stderr.getContentsAsString();
      assert.equal(debug, "");
    });

    it("should print some debug info when the verbose flag is true", function () {
      var stderr = config.logTo = new streamBuffers.WritableStreamBuffer();
      config.verbose = true;

      reporter.audit(validLiabilitiesFile, validAssetsFile);

      var debug = stderr.getContentsAsString();
      assert.equal(debug,
                   "Verifying 1 assets.DONE\n" +
                   "Building tree with 5 accounts\n");
    });
  });
});

