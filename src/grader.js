const spawn = require('child_process').spawn;

// Wraps `spawn` in a Promise to allow us to use async/await
// Based on https://github.com/expo/spawn-async/blob/master/src/spawnAsync.js
// To simplify error handling, this promise will only ever resolve
// Error cases are handled by attaching an `error` object to the result or
// resolving with a non-zero status.
// Copies a lot of behavior from spawnAsync, namely, output capturing and
// timeouts. We need to do this async in order to keep the event loop free.
const spawnAsync = async (...args) => {
  const opts = (args.length >= 3) ? (args[2] || {}) : {};
  const maxBuffer = opts.maxBuffer || 200 * 1024; // Default for spawnSync
  const killSignal = opts.killSignal || 'SIGTERM'; // Default for spawnSync

  return new Promise((resolve) => {
    const child = spawn.apply(spawn, args);
    const killChild = () => child.kill(killSignal);
    let timeoutId = null;
    if (opts.timeout) {
      timeoutId = setTimeout(killChild, opts.timeout);
    }
    let stdout = '';
    let stderr = '';
    child.stdout && child.stdout.on('data', (data) => {
      stdout += data;
      if (stdout.length > maxBuffer) killChild();
    });
    child.stderr && child.stderr.on('data', (data) => {
      stderr += data;
      if (stderr.length > maxBuffer) killChild();
    });
    child.on('close', (code, signal) => {
      child.removeAllListeners();
      if (timeoutId) clearTimeout(timeoutId);
      resolve({ pid: child.pid, stdout, stderr, status: code, signal });
    });
    child.on('error', error => {
      child.removeAllListeners();
      if (timeoutId) clearTimeout(timeoutId);
      resolve({ pid: child.pid, stdout, stderr, status: null, error });
    });
  });
};

module.exports = async ({ cwd, execCommand = './test'}) => {
  const results = [];
  const recordResult = (testCase, p) => {
    const result = {
      exitCode: p.status,
      signal: p.signal,
      error: p.error,
      name: testCase.name,
      tags: testCase.tags,
    };

    try {
      result.stdout = p.stdout.toString().substring(0, 10 * 1024);
    } catch (e) {
      result.stdout = '[Process timed out.]';
    }

    try {
      result.stderr = p.stderr.toString().substring(0, 10 * 1024);
    } catch (e) {
      result.stderr = '[Process timed out.]';
    }

    results.push(result);
  };

  // Run `make`
  const p = await spawnAsync('make', [execCommand], { cwd });
  recordResult({name: 'make', tags: {make: true}}, p);

  // Only continue if `make` was successful
  if (p.status === 0) {
    // Ask `catch` to list all test cases and tags
    const p = await spawnAsync(execCommand, ['--list-test-names-only'], { cwd });
    const catchListOutputLines = p.stdout.toString().split('\n');
    catchListOutputLines.pop();  // Remove blank entry at end

    const testCases = [];
    for (let i = 0; i < catchListOutputLines.length; i++) {
      // Test case name:
      const testCaseName = catchListOutputLines[i].trim().replace(/,/g, '\\,');

      // Test case tags:
      const p = await spawnAsync(execCommand, ['-t', testCaseName], { cwd });
      const catchTagsOutputlines = p.stdout.toString().split('\n');

      // Default tag values:
      const testCaseTags = {
        weight: 1,
        timeout: 10000
      };

      catchTagsOutputlines.forEach(function (s) {
        // Matches: "[tag=4]", "[valgrind]", etc
        const tag_re = /\[((\w+)(=(\w+))?)\]/g;
        let match;

        while ((match = tag_re.exec(s))) {
          // Capture the groups:
          const tagName = match[2];
          let tagValue = match[4];

          // For tags without a value (eg: [valgrind]), default to true
          if (tagValue === undefined) { tagValue = true; }

          // Save the tag; store it as an int for "weight" and "timeout"
          if (tagName == 'weight' || tagName == 'timeout') {
            testCaseTags[tagName] = parseInt(tagValue);
          } else {
            testCaseTags[tagName] = tagValue;
          }
        }
      });

      // Add to list of test cases:
      testCases.push({
        name: testCaseName,
        tags: testCaseTags
      });
    }

    // Run the test cases
    for (const testCase of testCases) {
      const opts = {
        cwd,
        timeout: testCase.tags.timeout,
        maxBuffer: 1024 * 1024,
        killSignal: 'SIGKILL'
      };
      let p = await spawnAsync(execCommand, ['-r', 'xml', testCase.name], opts);

      // We'll only run valgrind if it's enabled and they passed the tests
      if (testCase.tags.valgrind && !(p.status != 0 || p.signal || p.error)) {
        // It's Valgrind time! Let's check for memory errors.
        p = await spawnAsync('valgrind', ['--leak-check=full', '--error-exitcode=1', execCommand, '-r', 'xml', `"${testCase.name}"`], opts);
      }
      recordResult(testCase, p);
    }
  }

  return results;
};
