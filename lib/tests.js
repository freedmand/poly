export function runTests(tests) {
  for (const test of Object.keys(tests)) {
    console.log(`Running test ${test}`);
    try {
      tests[test]();
      console.log('PASSED');
    } catch (e) {
      console.error(e);
      console.log('FAILED');
    }
  }
}

export function assertEquals(param1, param2) {
  if (param1 != param2) {
    throw new Error(`Expected ${param1} to equal ${param2}`);
  }
}