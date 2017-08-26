/**
 * Runs all the tests defined in Poly. Anytime a new test file is added, it must
 * be added here to be run in the test runner.
 */

import './file/file_test.js';
import './indexed_text/indexed_text_test.js';
import './string/string_test.js';
import './tokenizer/tokenizer_test.js';
import './type/type_test.js';
import './parser/ast_test.js';
import './parser/parser_test.js';
import './interpreter/interpreter_test.js';

document.getElementById('hide').addEventListener('click', (e) => {
  Array.from(document.getElementsByClassName('success')).forEach((elem) => {
    elem.style.display = e.target.checked ? 'none' : 'inherit';
  });;
});