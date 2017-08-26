const ASSERTION_ERROR = 'Assertion error';

function logTopLevel(name, graphic = false, success = false) {
  if (graphic) {
    const h1 = document.createElement('h1');
    h1.textContent = name;
    h1.className = success ? 'success' : 'failed';
    document.body.appendChild(h1);
  } else {
    const text = `Tests for ${name}`;
    if (success) {
      console.groupCollapsed(text);
    } else {
      console.group(text);
    }
  }
}

function logSecondLevel(testName, graphic = false, success = false) {
  if (graphic) {
    const h3 = document.createElement('h3');
    h3.textContent = testName;
    h3.className = success ? 'success' : 'failed';
    document.body.appendChild(h3);
  } else {
    if (success) {
      console.groupCollapsed('%c' + testName, 'color:green;');
    } else {
      console.group('%c' + testName, 'color:red;');
    }
  }
}

function logPassed(testName, graphic = false) {
  if (graphic) {
    logSecondLevel(testName, graphic, true);
  } else {
    logSecondLevel(testName, graphic, true);
    console.log('%cPASSED', 'color:green;');
    console.groupEnd();
  }
}

function linkify(text) {
  const span = document.createElement('span');
  let match;
  let lastIndex = 0;
  const linkRegexp = new RegExp(/(http:\/\/[^\)]+[0-9]+)/.source, 'g');
  while (match = (linkRegexp.exec(text))) {
    if (match.index > lastIndex) {
      span.appendChild(
          document.createTextNode(text.substring(lastIndex, match.index)));
    }
    const a = document.createElement('a');
    a.href = match[1];
    a.textContent = match[0].match(/\/lib\/([^\)]*)/)[1];
    span.appendChild(a);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    span.appendChild(
        document.createTextNode(text.substring(lastIndex)));
  }
  return span;
}

function logFailed(testName, e, graphic = false) {
  if (graphic) {
    logSecondLevel(testName, graphic, false);
    const error = document.createElement('p');
    error.appendChild(linkify(e.stack));
    console.error(e.stack);
    error.className = 'error';
    document.body.appendChild(error);
  } else {
    logSecondLevel(testName, graphic);
    console.error(e);
    console.log('%cFAILED', 'color:red;');
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
  let logCalls = [];
  let passed = true;
  for (const test of Object.keys(tests)) {
    try {
      tests[test]();
      logCalls.push(() => logPassed(test, graphic));
    } catch (e) {
      logCalls.push(() => logFailed(test, e, graphic));
      passed = false;
    }
  }
  logTopLevel(name, graphic, passed);
  logCalls.forEach((x) => x());
  console.groupEnd();
}

export function fail() {
  throw new Error(ASSERTION_ERROR);
}

/**
 * Asserts whether the provided objects are equal to one another.
 * @param {*} param1 The first object.
 * @param {*} param2 The second object.
 * @throws {Error} If the objects do not equal.
 */
export function assertEquals(param1, param2) {
  if (param1 != param2) {
    console.error('Exepected', param1, 'would equal', param2);
    fail();
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
    console.error(`The lengths differ (${items1.length} vs ${items2.length})`);
    fail();
  }

  for (let i = 0; i < items1.length; i++) {
    const item1 = items1[i];
    const item2 = items2[i];
    if (item1 != item2) {
      console.error(`The arrays differ at item ${i}:
${item1}
vs
${item2}`);
      fail();
    }
  }
}

/**
 * Asserts whether the provided function raises an exception.
 * @param {!Function()} fn The function to execute.
 * @throws {Error} The function runs without exception.
 */
export function assertRaises(fn) {
  try {
    fn();
    console.error('Expected function would raise an exception');
    fail();
  } catch (e) {
    // Nothing needed here. The test passes.
  }
}