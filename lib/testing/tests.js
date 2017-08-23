const ASSERTION_ERROR = 'Assertion error';

/**
 * Runs a suite of tests.
 * @param {string} name The name of the suite of tests to run.
 * @param {{string: Function()}} tests A map of tests to run. The keys are the
 *     names of the tests; the values are functions that run each test case.
 *     A function will throw an error if it does not pass.
 */
export function runTests(name, tests) {
  console.log(`Tests for ${name}`);
  for (const test of Object.keys(tests)) {
    console.log(`  ${test}`);
    try {
      tests[test]();
      console.log('    PASSED');
    } catch (e) {
      console.error(e);
      console.log('    FAILED');
    }
  }
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