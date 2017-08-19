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
      console.error(`    ${e}`);
      console.log('    FAILED');
    }
  }
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
    throw new Error(ASSERTION_ERROR);
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