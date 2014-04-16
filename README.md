[![Build Status](https://travis-ci.org/justmoon/easy-audit.svg?branch=master)](https://travis-ci.org/justmoon/easy-audit) [![Coverage Status](https://coveralls.io/repos/justmoon/easy-audit/badge.png?branch=master)](https://coveralls.io/r/justmoon/easy-audit?branch=master)

[![NPM](https://nodei.co/npm/easy-audit.png)](https://www.npmjs.org/package/easy-audit)

# Easy Audit

This tool is designed to simplify the job of crypto-currency auditors.

## Motivation

This tool is inspired by Olivier Lalonde's PoL and PoA tools:

* https://github.com/olalonde/proof-of-liabilities
* https://github.com/olalonde/proof-of-assets

The reason I wrote my own was because most exchanges seem to request a type of
audit which leaks zero information to the public. This tool also expects a data
format that does not contain any user-identifying information.

Note that the implementations are not compatible unfortunately.

## Installation

``` sh
npm install -g easy-audit
```

## Usage

### Get [assets.json](test/data/assets.json) from exchange

The exchange operator needs to sign a message with all of their hot and cold
wallets. This usually works differently for each exchange, but the resulting
format should be something like this:

``` json
{
  "blockhash": "000000000000000023d6840808390f0cbefc9ead835daa4dbb5c9d7d0f205eb2",
  "blockheight": 294548,
  "owner": "example.com",
  "message": "example.com : 0000000000000000525d3fe3dcb6e08de102d36b51f466f689e33c869049c547",
  "assets": [
    {
      "asset": "1P8EnMGHjwLYcGbdwGUapGRnff758Ux8iS",
      "signature": "HNNpRss3/45/VhuBLYAIFJ+7LYHqzYxsl0g4c61vPvhR8cdub4ZTFLShObjatwrQAIn3haalqvnQqlH70fTVcv0=",
      "balance": "12450"
    }
  ]
}
```

The message should be `[owner] : [blockheight]` where `owner` is the domain of
the exchange being audited and `blockheight` is the height of the reference
block.

All balances should be the total amount of unspent outputs associated with that
Bitcoin address at the given block height.

### Get [liabilities.json](test/data/liabilities.json) from exchange

We also need a list of liabilities. The exchange operator can provide that in
the following format:

``` json
{
  "accounts": [
    {
      "nonce" : "13550350a8681c84c861aac2e5b440161c2b33a3e4f302ac680ca5b686de48de",
      "balance" : "1234"
    }
  ]
}
```

The nonce can be generated in any way that the exchange operator prefers,
however we recommend the following way:

* nonce ... `SHA256 ( user_email || user_secret )`
* user_email ... A value that is unique to the user and user-chosen
* user_secret ... A random or pseudo-random 256-bit value that is unique to each user

The `user_email` and `user_secret` are known to the user, but not the auditor.
This means that the auditor only sees anonymous balances.

### Audit assets separately

The `assets.json` format specified above is compatible with
[libcoin](https://github.com/libcoin/libcoin)'s cryptoshi.

First, you need to run libcoin to download a blockchain with full persistence:

``` sh
libcoind --bitcoin --persistence=FULL --debug --log=-
```

* `--bitcoin` ... Use Bitcoin blockchain
* `--persistence=FULL` ... Don't prune old transactions
* `--debug` ... Print additional information
* `--log=-` ... Log to stdout

Once libcoin has reached the reference blockheight, you can run `cryptoshi
audit`:

``` sh
cryptoshi audit path/to/assets.json
```

If successful, cryptoshi should print something like:

```
PASSES audit with 12450 Satoshis
```

There should be no other messages (warnings or errors.)

### Run audit using easy-audit

``` sh
easy-audit audit path/to/liabilities.json path/to/assets.json
```

The tool will output something like:

``` sh
ASSET OWNER: example.com
BLOCK HEIGHT: 294548
ROOT HASH: 25faefe8190e0d179e3029b186e02be644a9c55b786df73ffb33ba270090b022
RESERVE RATIO: 107.31%
```

This is what you sign and post publicly. For your own reference you may also
want to run a verbose audit using the `-v` parameter.

Once the audit is posted, users may wish to verify they were included in it. The
exchange operator should disclose to each user their `user_secret`, the sibling
nodes between them and the root hash and their balance at the reference block
height. The user should verify:

* Their nonce matches `SHA256 ( user_email || user_secret )`.
* The balance provided matches what they were holding at the reference
  block height.
* Their leaf hash matches `SHA256 ( nonce || "|" || balance)`.
* The siblings provided connect their leaf hash to the root hash where each
  internal node is calculated as `SHA256 ( left_hash || "|" || right_hash )`.
* The root hash matches the one the auditor signed.

## Features

* Checks input file integrity
* Ensures assets message uses correct format
* Generates liabilities root hash
* Verifies asset signatures
* Calculates total assets and liabilities
* Calculates reserve ratio

Currencies supported: Bitcoin

## Run tests

``` sh
npm test
```

You can also generate a code coverage report:

``` sh
npm test --coverage
```

## Future plans

* Support for more currencies
* Support for Ripple liability proof
* Support for balance proof against Bitcoin blockchain
* Calculate how old the reference block is

## Limitations

Ideally this tool would be implemented as a zero-knowledge proof (ZKP) that the
exchange operator themselves executes and that anyone can verify. Until someone
implements that, users have to trust the auditor.

Exchanges can borrow money for an audit, they can buy bitcoins against their
customers' fiat balances, they can ask third parties to sign the audit message
instead of them signing it and more.

The fact that an exchange is solvent at a given point in time says nothing about
their overall exposure to regulatory, technical, financial and other risks. It
also says nothing about their integrity.

The liability proof relies on the fact that users actually bother to go through
the verification process.

## License

This tool is released under the [ISC license](http://opensource.org/licenses/ISC).
