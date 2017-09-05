/**
 * Runs all the tests defined in Poly. Anytime a new test file is added, it must
 * be added to tests.json.
 */

import {joinPath} from './string/string.js';
import {TEST_VARS} from './testing/tests.js';

const BASE_DIR = './lib';
const TESTS_FILE = joinPath(BASE_DIR, 'tests.json');

// Constants controlling output of test statistics at the conclusion of the test
// runner.
const ALL_TESTS = 'All'; // Button text for "All" tests button.
const TEST_STATS = 'Test statistics'; // Console message for test stats group.
const TEST_TIME = 'Total time'; // Console message for total time elasped.
const PRINT_STATS = 'printStats'; // Global function to print stats at end.

/**
 * Returns the name of the test file in upper camel case. For instance,
 * '.../indexed_test.js' would return 'Indexed Text'.
 * @param {string} testFile The file path of the test file.
 * @return {string} The name of the test.
 */
function nameFromTest(testFile) {
  const name = testFile.match(/([^\/]+)test\.js/)[1];
  const parts = name.split('_');
  return parts.map((x) => x.charAt(0).toUpperCase() + x.substr(1)).join(' ');
}

/**
 * Creates and loads a JavaScript module script with the specified import paths
 * imported. For example, if the imports is an array with paths:
 *
 *   ['./string/string_test.js', './parser/parser_test.js']
 *
 * A module would be created and run with the following content:
 *
 *   import './string/string_test.js';
 *   import './parser/parser_test.js';
 *
 * @param {!Array<string>} imports
 */
function runImports(imports) {
  // Populate the contents of the script based on the imports.
  const contents = `
      console.time('${TEST_TIME}');\n` + imports.map(
      (file) => `import '${joinPath(BASE_DIR, file)}';`).join('\n') + `
      console.group('${TEST_STATS}');
      console.timeEnd('${TEST_TIME}');
      window['${PRINT_STATS}']();
      `;

  // In a global function, prints out the final test statistics.
  window[PRINT_STATS] = () => {
    TEST_VARS.forEach((value, key) => console.log(
        `${value}:`, window[key] == null ? 0 : window[key]));
    console.groupEnd();
  };

  // Inject the script into the page.
  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = contents;
  document.body.appendChild(script);
}

/**
 * Creates a button that when clicked dynamically loads a JavaScript module
 * script with the specified imports. The button is appended to the body of the
 * document. Internally, uses the hash on the URL and refreshes the page to
 * ensure the module script loads anew each time.
 * @param {string} name The text on the button, typically corresponding to the
 *     name of the test case / cases to run.
 * @param {!Array<string>} imports The Javascript import paths to dynamically
 *     generate a script for, typically corresponding to running specific tests.
 */
function createButton(name, imports) {
  const button = document.createElement('button');
  button.textContent = name;
  const hash = `#${name}`.trim();
  // If the hash is appropriate, run the function.
  if (window.location.hash.trim() == hash) {
    runImports(imports);
  }
  button.addEventListener('click', () => {
    // Set the URL to the hash and refresh the page.
    history.replaceState(null, null, hash);
    window.location.reload();
  });
  document.body.appendChild(button);
}

fetch(TESTS_FILE).then((response) => {
  return response.json();
}).then((response) => {
  // Grab the JSON from the tests file and parse it.
  for (const file of response) {
    const name = nameFromTest(file);
    createButton(name, [file]);
  }
  // Create a button to run all the tests.
  createButton(ALL_TESTS, response);
});
