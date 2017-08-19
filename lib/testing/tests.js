const ASSERTION_ERROR = 'Assertion error';

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

export function assertEquals(param1, param2) {
  if (param1 != param2) {
    console.error('Exepected', param1, 'would equal', param2);
    throw new Error(ASSERTION_ERROR);
  }
}