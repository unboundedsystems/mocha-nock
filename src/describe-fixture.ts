import record from './recorder';
import assert from 'assert';
import defaults from 'lodash.defaults';
import { Config } from './config';

const _defaultConfig: Config = {
  excludeScope:     ['localhost', '127.0.0.1', '0.0.0.0'],
  overwrite:        false,
  recordOnFailure:  false,
  recorder: {
    output_objects:  true,
    dont_print:      true
  }
};

let defaultConfig: Config = _defaultConfig;

function describeFixture(name: string, callback: Mocha.SuiteFunction);
function describeFixture(name: string, options: Partial<Config>, callback: Mocha.SuiteFunction);
function describeFixture(name: string, filter: string, options: Partial<Config>, callback: Mocha.SuiteFunction);
function describeFixture(
  name: string,
  arg2: string | Mocha.SuiteFunction | Partial<Config>,
  arg3?: Mocha.SuiteFunction | Partial<Config>,
  arg4?: Mocha.SuiteFunction) {

  let filter: string | null = null;
  let options: Partial<Config> = {};
  let callback: Mocha.SuiteFunction;

  if (arguments.length === 2) {
    if (typeof arg2 !== 'function') throw new Error(`Second argument must be a function`);
    callback = arg2;
  } else if (arguments.length === 3) {
    if (typeof arg2 !== 'object' || typeof arg3 !== 'function') {
      throw new Error(`Second argument must be an object and third argument must be a function`);
    }
    callback = arg3;
    options  = arg2;
  } else {
    if (typeof arg2 !== 'string' || typeof arg3 !== 'object' || typeof arg4 !== 'function') {
      throw new Error(`Arguments must be of type string, object, function`);
    }
    callback = arg4;
    options  = arg3;
    filter   = arg2;
  }

  assert(name, 'name should be defined');
  assert(callback, 'callback should be defined');

  let describeFn = describe;

  if (filter) {
    describeFn = describeFn[filter];
  }

  return describeFn(name, function() {
    // @ts-ignore
    callback.call(this);

    const recordOptions = defaults(options, defaultConfig);

    // Defaults does not recursively check so we need to explicitly check the
    // record options and set defaults
    recordOptions.recorder = defaults(recordOptions.recorder || {},
                                      defaultConfig.recorder);

    // Should always be an array
    if (!Array.isArray(recordOptions.excludeScope)) {
      recordOptions.excludeScope = [ recordOptions.excludeScope ];
    }

    record(name, recordOptions);
  });
}

describeFixture.only = function(name: any, options: any, callback: any) {
  if (arguments.length === 2 && typeof arguments[1] === 'function') {
    callback = options;
  }

  return describeFixture(name, 'only', options, callback)
}

describeFixture.skip = function(name: any, options: any, callback: any) {
  if (arguments.length === 2 && typeof arguments[1] === 'function') {
    callback = options;
  }

  return describeFixture(name, 'skip', options, callback)
}

describeFixture.setDefaultConfig = function(newConfig?: Partial<Config>) {
  if (!newConfig) {
    defaultConfig = _defaultConfig;
    return;
  };

  const recorder = defaults(newConfig.recorder || {}, _defaultConfig.recorder);
  defaultConfig.recorder = recorder;

  defaultConfig = defaults(newConfig, defaultConfig);
}

describeFixture.setDefaultConfig();

export = describeFixture;
