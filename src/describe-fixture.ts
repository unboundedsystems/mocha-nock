import record from './recorder';
import assert from 'assert';
import defaults from 'lodash.defaults';
import assign from 'lodash.assign';
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

interface DescribeFixture {
  (name: string, callback: Function): Mocha.Suite;
  (name: string, options: Partial<Config>, callback: Function): Mocha.Suite;
  (name: string, filter: string, options: Partial<Config>, callback: Function): Mocha.Suite;

  only: (name: any, options: any, callback: any) => Mocha.Suite;
  skip: (name: any, options: any, callback: any) => Mocha.Suite;
  setDefaultConfig: (newConfig?: Partial<Config>) => void;
}

function _describeFixture(name: string, callback: Function);
function _describeFixture(name: string, options: Partial<Config>, callback: Function);
function _describeFixture(name: string, filter: string, options: Partial<Config>, callback: Function);
function _describeFixture(
  name: string,
  arg2: string | Function | Partial<Config>,
  arg3?: Function | Partial<Config>,
  arg4?: Function) {

  let filter: string | null = null;
  let options: Partial<Config> = {};
  let callback: Function;

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

const describeFixture: DescribeFixture = assign(_describeFixture, {

  only: function only(name: any, options: any, callback: any) {
    if (arguments.length === 2 && typeof arguments[1] === 'function') {
      callback = options;
    }
    return describeFixture(name, 'only', options, callback)
  },

  skip: function skip(name: any, options: any, callback: any) {
    if (arguments.length === 2 && typeof arguments[1] === 'function') {
      callback = options;
    }

    return describeFixture(name, 'skip', options, callback)
  },

  setDefaultConfig: function setDefaultConfig(newConfig?: Partial<Config>) {
    if (!newConfig) {
      defaultConfig = _defaultConfig;
      return;
    };

    const recorder = defaults(newConfig.recorder || {}, _defaultConfig.recorder);
    defaultConfig.recorder = recorder;

    defaultConfig = defaults(newConfig, defaultConfig);
  }
});

describeFixture.setDefaultConfig();

export = describeFixture;
