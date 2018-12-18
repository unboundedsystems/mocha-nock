// Originally adapted from
// http://orchestrate.io/blog/2014/06/13/how-to-test-code-that-uses-http-apis-using-node-js-mocha-and-nock/

import nock from 'nock';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import { Config } from './config';

export function record(name: string, options: Config) {
  let hasFixtures = !!options.overwrite;
  let fixturePath: string;

  beforeEach(function() {
    fixturePath = path.resolve(path.join('test', 'fixtures', getFixturePath(this)));

    if (!hasFixtures) {
      try {
        // Make sure we don't have any conflicting interceptors for this test
        nock.cleanAll();

        require(fixturePath)();
        hasFixtures = true;
      } catch (e) {
        startRecording(options);
      }
    } else {
      hasFixtures = false;
      startRecording(options);
    }
  });

  // Saves our recording if fixtures didn't already exist
  afterEach(function(done) {
    var recordOnFailure = !!options.recordOnFailure;
    if (!hasFixtures &&
      ((this.currentTest && this.currentTest.state) !== 'failed' || recordOnFailure)) {
      hasFixtures  = true;
      var fixtures = nock.recorder.play();
      if (fixtures.length) {
        var header = 'var nock = require(\'nock\');\n'
                    + 'module.exports = function() {\n';

        let body: string;
        if (options.recorder.output_objects) {
          fixtures = removeExcludedScopeFromArray(fixtures, options.excludeScope);
          body     = 'nock.define(' + JSON.stringify(fixtures, null, 2) + ');';
        } else {
          body = removeExcludedScopeFromString(fixtures, options.excludeScope);
        };

        var footer = '\n};';

        return mkdirp(path.dirname(fixturePath), function(err) {
          if(err) { return done(err); }

          return fs.writeFile(fixturePath, header + body + footer, done);
        });
      } else {
        return done();
      }
    } else {
      return done();
    }
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
