// Originally adapted from
// http://orchestrate.io/blog/2014/06/13/how-to-test-code-that-uses-http-apis-using-node-js-mocha-and-nock/

import nock from 'nock';
import path from 'path';
import fs from 'fs-extra';
import mkdirp from 'mkdirp';
import { Config } from './config';

export function record(name: string, options: Config) {
  let recording: boolean;
  let fixturePath: string;

  beforeEach(function () {
    recording = false;
    fixturePath = path.resolve(path.join('test', 'fixtures', getFixturePath(this)));

    if (options.overwrite) {
      startRecording(options);
      recording = true;
      return;
    }

    try {
      // Make sure we don't have any conflicting interceptors for this test
      nock.cleanAll();

      require(fixturePath)();
      if (!nock.isActive()) nock.activate();
    } catch (e) {
      startRecording(options);
      recording = true;
    }
  });

  // Saves our recording if fixtures didn't already exist
  afterEach(async function () {
    if (recording &&
      ((this.currentTest && this.currentTest.state) !== 'failed' || options.recordOnFailure)) {

      let fixtures = nock.recorder.play();
      if (fixtures.length) {
        const header = 'var nock = require(\'nock\');\n'
                     + 'module.exports = function() {\n';

        let body: string;
        if (options.recorder.output_objects) {
          fixtures = removeExcludedScopeFromArray(fixtures, options.excludeScope);
          body     = 'nock.define(' + JSON.stringify(fixtures, null, 2) + ');';
        } else {
          body = removeExcludedScopeFromString(fixtures, options.excludeScope);
        };

        var footer = '\n};';

        await /* TODO: JSFIX could not patch the breaking change:
        Creating a directory with fs-extra no longer returns the path 
        Suggested fix: The returned promise no longer includes the path of the new directory */
        fs.ensureDir(path.dirname(fixturePath));
        await fs.writeFile(fixturePath, header + body + footer);
      }
    }
  });

  after(() => {
    nock.cleanAll();
    nock.restore();
  });
};

function getFixturePath(ctx: Mocha.Context) {
  if (!ctx.currentTest) throw new Error(`Can't determine current test`);
  let parent        = ctx.currentTest.parent;
  const fixturePath: string[] = [];
  while(parent && parent.title) {
    fixturePath.unshift(parent.title);
    parent = parent.parent;
  }
  fixturePath.push(ctx.currentTest.title + '.js');

  return path.join.apply(path, fixturePath);
}

function startRecording(options: any) {
  nock.restore();
  nock.recorder.clear();
  nock.recorder.rec(options.recorder);
}

function removeExcludedScopeFromString(lines, scope) {
  if (!scope.length) {
    return lines;
  }

  const scopeRegex = new RegExp('nock\(.*(' + scope.join('|') + ').*\)');

  return lines.reduce(function(result, line) {
    if (result.waitingForEnd) {
      if (/}\);$/.test(line)) {
        result.waitingForEnd = false
      }
    } else if(scopeRegex.test(line)) {
      result.waitingForEnd = true;
    } else {
      result.lines.push(line);
    }

    return result;
  }, { lines: [] }).lines.filter(Boolean).join('\n');
}

function removeExcludedScopeFromArray(fixtureArray, scope) {
  if (!scope.length) {
    return fixtureArray;
  }

  return fixtureArray.reduce(function(result, fixture) {
    const shouldExclude = scope.some(function(url) {
      return fixture.scope.indexOf(url) > -1;
    });

    if (!shouldExclude) {
      result.push(fixture);
    }

    return result;
  }, []);
}

export default record;
