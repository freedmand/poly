/**
 * Runs all the tests defined in Poly. Anytime a new test file is added, it must
 * be added to tests.json.
 */

 import {joinPath} from './string/string.js';

const BASE_DIR = './lib';
const TESTS_FILE = joinPath(BASE_DIR, 'tests.json');
const ALL_TESTS = 'All';

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
  const contents = imports.map(
      (file) => `import '${joinPath(BASE_DIR, file)}';`).join('\n');
  Array.from(document.getElementsByTagName('iframe')).forEach((elem) => {
    elem.parentElement.removeChild(elem);
  });
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
