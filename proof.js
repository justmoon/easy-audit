#!/usr/bin/env node

var program = require('commander'),
    fs = require('fs');

var Config = require('./lib/config').Config;
var AuditReporter = require('./lib/audit_reporter').AuditReporter;

program
  .version(JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8')).version)
  .usage('<action>')
  .option('-v, --verbose', 'Output debugging information.', Config.defaults.verbose)
  .option('--currency <currency>', 'Specify a currency code.', Config.defaults.currency);


program
  .command('audit <liabilities> <assets>')
  .description('Create an audit report based on data supplied by an exchange')
  .action(function () {
    var config = Config.fromProgram(program);

    var reporter = new AuditReporter(config);
    reporter.audit(program.args[0], program.args[1]);

    process.exit(0);
  });

program.parse(process.argv);
program.help();
