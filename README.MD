# Poly

Poly is a polyglot web programming language that will eventually be able to compile to HTML, CSS, and JS, as well as run in an interpreted context. By supporting and optimizing across these three disparate languages, Poly hopes to foster truly extensible language features and developer tools that can take advantage of the full frontend stack simultaneously.

Poly is still in extremely formative stages. The main code can be found in the `lib/` directory.

## Usage

To test and run the Poly REPL, ES6 modules must be enabled. In *the latest version of* Chrome, this can be done by visiting `chrome://flags` and enabling "Experimental JavaScript."

Start a local webserver in this root directory. This can be done simply with `python -m SimpleHTTPServer`. Visit the localhost page at `index.html` to view the test runner, or `repl.html` to view the Poly REPL. (ES6 modules need to be loaded in a webserver; viewing the files with `file://...` will cause a CORS exception).

## Language specification

At this early of a stage, the language specification has not been finalized. Browse through files that end in `_test.js` in the `lib/` directory for examples of valid Poly code. Good examples of test files to browse through include

* `lib/type/type_test.js`
* `lib/parser/parser_test.js`
* `lib/intermediate_representation/ir_test.js`
