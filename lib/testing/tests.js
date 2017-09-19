import * as string from '../string/string.js';

import {SignatureError} from '../error/signature_error.js';

const ASSERTION_ERROR = 'Assertion error';

// Console stylings for passed and failed test cases.
const SUCCESS_STYLE = 'color:green;';
const ERROR_STYLE = 'color:red;';

/**
 * An ordered map from global variables and the corresponding message to print
 * in the overall test statistics that are printed after the test runner
 * completes. See ../run_tests.js for more details.
 */
export const TEST_VARS = new Map([
  ['topLevelTests', 'Top-level tests'],
  ['topLevelTestsPassing', '  Passing'],
  ['topLevelTestsFailing', '  Failing'],
  ['secondLevelTests', 'Second-level tests'],
  ['secondLevelTestsPassing', '  Passing'],
  ['secondLevelTestsFailing', '  Failing'],
]);

/**
 * An extension of error for assertion errors that stores parameters that caused
 * the error. These stored parameters allow detailed and styled log messages to
 * be displayed in the test runner.
 */
export class AssertionError extends Error {
  /**
   * @param {...*} params Parameters that caused the error. These can be a mix
   *     of informative strings and variables. For example:
   *
   *         throw new AssertionError('Expected', x, 'to equal', y);
   */
  constructor(...params) {
    super(params.join(' '));
    /** @type {!Array<*>} */
    this.params = params;
  }
}

/**
 * Increments the specified global variable, setting it to 1 if it has not yet
 * been initialized.
 * @param {string} global The global variable to increment.
 */
function increment(global) {
  if (window[global] != null) {
    window[global]++;
  } else {
    window[global] = 1;
  }
}

/**
 * Wraps a string of text so that it can be styled in Google Chrome using CSS.
 * See https://developers.google.com/web/tools/chrome-devtools/console/console-write#styling_console_output_with_css
 * @param {string} text The text to wrap.
 * @return {string} The text wrapped so that it can receive style as a follow-up
 *     argument.
 */
function wrapStyle(text) {
  return `%c${text}`;
}

/**
 * Starts logging a top-level test, usually corresponding to a test for a
 * particular file or class.
 * @param {string} name The name of the top-level test.
 * @param {boolean=} graphic Whether to display the information graphically in
 *     HTML (true), or styled in the console (false; default).
 * @param {boolean=} success Whether the top-level test passed.
 */
function logTopLevel(name, graphic = false, success = false) {
  increment('topLevelTests');
  increment(success ? 'topLevelTestsPassing' : 'topLevelTestsFailing');
  if (graphic) {
    const h1 = document.createElement('h1');
    h1.textContent = name;
    h1.className = success ? 'success' : 'failed';
    document.body.appendChild(h1);
  } else {
    const text = `Tests for ${name}`;
    if (success) {
      // Hide successful test cases by default.
      console.groupCollapsed(wrapStyle(text), SUCCESS_STYLE);
    } else {
      // Expand unsuccessful test cases.
      console.group(wrapStyle(text), ERROR_STYLE);
    }
  }
}

/**
 * Starts logging a second-level test, usually corresponding to a test for a
 * particular method or aspect of a function call.
 * @param {string} testName The name of the second-level test.
 * @param {boolean=} graphic Whether to display the information graphically in
 *     HTML (true), or styled in the console (false; default).
 * @param {boolean=} success Whether the second-level test passed.
 */
function logSecondLevel(testName, graphic = false, success = false) {
  increment('secondLevelTests');
  increment(success ? 'secondLevelTestsPassing' : 'secondLevelTestsFailing');
  if (graphic) {
    const h3 = document.createElement('h3');
    h3.textContent = testName;
    h3.className = success ? 'success' : 'failed';
    document.body.appendChild(h3);
  } else {
    if (success) {
      console.groupCollapsed(wrapStyle(testName), SUCCESS_STYLE);
    } else {
      console.group(wrapStyle(testName), ERROR_STYLE);
    }
  }
}

/**
 * Logs a passing second-level test, usually corresponding to a test for a
 * particular method or aspect of a function call.
 * @param {string} testName The name of the second-level test.
 * @param {boolean=} graphic Whether to display the information graphically in
 *     HTML (true), or styled in the console (false; default).
 */
function logPassed(testName, graphic = false) {
  if (graphic) {
    logSecondLevel(testName, graphic, true);
  } else {
    // Logs the second-level test and closes the console group.
    logSecondLevel(testName, graphic, true);
    console.log(wrapStyle('PASSED'), SUCCESS_STYLE);
    console.groupEnd();
  }
}

/**
 * Linkifies the specified text, corresponding to links to Poly files on a local
 * server starting with the path /lib/*. This function is used to convert the
 * text format of error stack traces in Chrome into an HTML representation in
 * which links to particular positions in files show up as actual links.
 * @param {string} text The text of an error stack trace.
 * @return {!Element} A span element containing the text of the stack trace with
 *     clickable links.
 */
function linkify(text) {
  const span = document.createElement('span');
  let match;
  let lastIndex = 0;
  const linkRegexp = new RegExp(/(http:\/\/[^\)]+[0-9]+)/.source, 'g');
  while (match = (linkRegexp.exec(text))) {
    // Iterate through matches of the link regular expression.
    if (match.index > lastIndex) {
      span.appendChild(
          document.createTextNode(text.substring(lastIndex, match.index)));
    }
    // Construct the link element.
    const a = document.createElement('a');
    a.href = match[1];
    a.textContent = match[0].match(/\/lib\/([^\)]*)/)[1];
    span.appendChild(a);

    // Update the index of the last operated character.
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    // If there is unfinished business, create a text node to encapsulate the
    // remaining text content.
    span.appendChild(
        document.createTextNode(text.substring(lastIndex)));
  }
  return span;
}

/**
 * Logs a failing second-level test, usually corresponding to a test for a
 * particular method or aspect of a function call.
 * @param {string} testName The name of the second-level test.
 * @param {{error:string, params:?Array<*>}} errorParam The text content of the
 *     error followed by optional params to describe the error in a format
 *     conducive to detailed console styling.
 * @param {boolean=} graphic Whether to display the information graphically in
 *     HTML (true), or styled in the console (false; default).
 */
function logFailed(testName, {error, params}, graphic = false) {
  if (graphic) {
    logSecondLevel(testName, graphic, false);
    const p = document.createElement('p');
    p.appendChild(linkify(e.stack));
    // Still log to the console in graphic error cases, because those links
    // automatically go to the Source tab in Developer Tools.
    console.error(e.stack);
    p.className = 'error';
    document.body.appendChild(p);
  } else {
    logSecondLevel(testName, graphic);
    // If params are specified, print out the params to the console.
    if (params) console.error(...params);
    console.error(error);
    console.log(wrapStyle('FAILED'), ERROR_STYLE);
    // End the console group.
    console.groupEnd();
  }
}

/**
 * Runs a suite of tests.
 * @param {string} name The name of the suite of tests to run.
 * @param {{string: Function()}} tests A map of tests to run. The keys are the
 *     names of the tests; the values are functions that run each test case.
 *     A function will throw an error if it does not pass.
 * @param {boolean=} graphic If true, renders testing output to the DOM.
 *     Otherwise, logs to the console.
 */
export function runTests(name, tests, graphic = false) {
  // Store pending log calls in an array, so that information can be displayed
  // later. This allows top-level tests to be printed with styled information on
  // whether they had passing or failing second-level test cases.
  const logCalls = [];
  let passed = true;
  for (const test of Object.keys(tests)) {
    try {
      tests[test]();
      // If the test succeeds, push a passing log message to the queue.
      logCalls.push(() => logPassed(test, graphic));
    } catch (e) {
      if (e instanceof AssertionError) {
        // If a test fails with an AssertionError, push a failing log message to
        // the queue with params.
        logCalls.push(() => logFailed(test, {
          error: e,
          params: e.params,
        }, graphic));
      } else if (e instanceof SignatureError) {
        // If a test fails with a SignatureError, push a failing log message and
        // a collapsible group containing suggested fixes.
        logCalls.push(() => {
          logFailed(test, {
            error: e,
          }, graphic);
          if (e.substitutions.length > 0) {
            console.group('Suggested fixes:');
            for (const substitution of e.substitutions) {
              console.log(...string.logDelta(e.fullText, substitution));
            }
            console.groupEnd();
          }
        });
      } else {
        // Otherwise, push a failing log message to the queue without params.
        logCalls.push(() => logFailed(test, {error: e}, graphic));
      }
      passed = false;
    }
  }
  // Log the top-level test cases in a group, followed by the stored
  // second-level test cases in the queue, closing the group at the end.
  logTopLevel(name, graphic, passed);
  logCalls.forEach((x) => x());
  console.groupEnd();
}

/**
 * Throws an AssertionError with the specified params.
 * @param {...*} params The detailed parameters for the AssertionError.
 */
export function fail(...params) {
  throw new AssertionError(...params);
}

/**
 * Asserts whether the provided objects are equal to one another.
 * @param {*} param1 The first object.
 * @param {*} param2 The second object.
 * @throws {Error} If the objects do not equal.
 */
export function assertEquals(param1, param2) {
  if (param1 != param2) {
    fail('Exepected', param1, 'would equal', param2);
  }
}

/**
 * Asserts whether the provided object is truthy.
 * @param {*} param The object.
 * @throws {Error} If the object is not truthy.
 */
export function assertTrue(param) {
  assertEquals(param, true);
}

/**
 * Asserts whether the provided object is falsy.
 * @param {*} param The object.
 * @throws {Error} If the object is not falsy.
 */
export function assertFalse(param) {
  assertEquals(param, false);
}

/**
 * Asserts whether the two arrays are equal to one another, using a simple
 * equality check on each sub-item.
 * @param {!Array<*>} items1 The first array.
 * @param {!Array<*>} items2 The second array.
 * @throws {Error} The arrays differ in length or have an unequal sub-item.
 */
export function assertArrayEquals(items1, items2) {
  if (items1.length != items2.length) {
    fail(`The lengths differ (${items1.length} vs ${items2.length})`);
  }

  for (let i = 0; i < items1.length; i++) {
    const item1 = items1[i];
    const item2 = items2[i];
    if (item1 != item2) {
      fail(`The arrays differ at item ${i}:
${item1}
vs
${item2}`);
    }
  }
}

/**
 * Asserts whether the provided function raises an exception.
 * @param {!Function()} fn The function to execute.
 * @throws {Error} The function runs without exception.
 */
export function assertRaises(fn) {
  let failed = false;
  try {
    fn();
    failed = true;
  } catch (e) {
    // Nothing needed here. The test passes.
  }
  if (failed) fail('Expected function would raise an exception');
}
