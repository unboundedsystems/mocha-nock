# Mocha Nock

## About

A simple library that makes saving fixtures with
[nock](https://github.com/pgte/nock) and
[mocha](http://mochajs.org/) easy. Just
use `describeFixture` instead of `describe` and it will record outbound requests
using nock into `test/fixtures` and read from them the next time you run the
tests.

## Install

```bash
npm install --save-dev mocha-nock
```

## Usage

Use `describeFixture` instead of `describe` and it will use nock to record all
requests.

The first time this test executes, it will save the HTTP request & response into your `test/fixtures` directory.
Then on subsequent tests, it will return the saved data and not use the network.

```js
const describeFixture = require('mocha-nock');
const request         = require('request-promise-native');

describeFixture('normal test', () => {
  it('works', async () => {
    const response = await request('http://localhost:4000/users');
  });

  describe('some other test', () => {
    // You can use mocha how you normally would to group tests
  });
});
```

It also supports `.skip` and `.only`, like mocha does.
```js
describeFixture.skip('skipped test', () => {
  // Anything in here will be skipped
});

describeFixture.only('only test', () => {
  // This will be the only test run
});
```

### Usage with test specific options
```js
// This test will not record the request to localhost:4000.
// For anything it does record, it will also record the reqheaders.
const opts = {
  excludeScope: 'localhost:4000',
  recorder: {
    enable_reqheaders_recording: true
  }
};

describeFixture('normal test', opts, () => {
  it('works', async () => {
    const resp1 = await request('http://localhost:4000/users');
    const resp2 = await request('https://google.com/');
  });
});
```

## Configuration

Defaults:

```js
{
  // Don't record any requests to this scope
  // It can be an array or string
  excludeScope: ['localhost', '127.0.0.1', '0.0.0.0'],

  // Re-record and overwrite your current fixtures
  overwrite: false,

  // Record fixtures when test fails
  recordOnFailure: false,

  // These options are passed to the nock recorder that runs behind the scenes
  // to capture requests
  recorder: {
    output_objects:  true,
    dont_print:      true
  }
}
```

To overide these you can call `describeFixture.setDefaults` with an object to
override them for ALL tests. It must be called before any `describeFixture()` is
called to work properly. The best place is in a test helper file.

You also are able to pass in test specific options as the last parameter to
`describeFixture()`. See the [Usage](#usage) section above for an example.


## Authors

Originally based off of an older version of [nock-vcr-recorder](https://github.com/poetic-labs/nock-vcr-recorder-mocha)
by Jake Craige.

* [Mark Terrel](https://twitter.com/MarkTerrel)
* [Jake Craige](http://twitter.com/jakecraige)


## Legal

&copy; 2018-2019 [Unbounded Systems, LLC](https://unbounded.systems)

&copy; 2014 [Poetic Systems, Inc.](http://poeticsystems.com)

[Licensed under the MIT license](http://www.opensource.org/licenses/mit-license.php)

