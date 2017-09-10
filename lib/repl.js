import {IntermediateTranslator, IR} from './intermediate_representation/ir.js';
import {Parser} from './parser/parser.js';
import {Type} from './type/type.js';
import {PolyOpTable} from './spec/operators.js';
import {OperatorTable} from './parser/operator_table.js';
import {PolyTokenizer} from './spec/tokens.js';
import {Scope} from './parser/scope.js';
import {Token} from './tokenizer/token.js';

/**
 * Repl (read-eval-print-loop) is a class that provides a basic Poly shell with
 * hooks to display debugging output at different steps.
 */
class Repl {
  constructor() {
    /**
     * The operator table for the REPL.
     * @type {!OperatorTable}
     */
    this.opTable = new PolyOpTable();

    /**
     * The intermediate translator for the REPL, initialized with the operator
     * table.
     * @type {!IntermediateTranslator}
     */
    this.translator = new IntermediateTranslator(this.opTable);
  }

  /**
   * Shows the specified tokens in some way. The extending class defines this
   * functionality.
   * @param {!Array<!Token>} tokens
   */
  showTokens(tokens) {}

  /**
   * Shows the specified Ast in some way. The extending class defines this
   * functionality.
   * @param {!Ast} ast
   */
  showAst(ast) {}

  /**
   * Shows the specified scope in some way. The extending class defines this
   * functionality.
   * @param {!Scope} scope
   */
  showScope(scope) {}

  /**
   * Shows the specified intermediate representation in some way. The extending
   * class defines this functionality.
   * @param {!IR} ir
   */
  showIR(ir) {}

  /**
   * Translates the specified text (by first tokenizing and parsing it), showing
   * each stage of output along the way until the intermediate representation.
   * @param {string} text The text to translate.
   */
  translate(text) {
    const tokenizer = new PolyTokenizer(text);
    this.showTokens(tokenizer.tokenizeAll());
    tokenizer.reset();
    const parser = new Parser(tokenizer, this.opTable);
    const syntaxTree = parser.statements();
    this.showAst(syntaxTree);
    const {node, scope} = this.translator.translate(syntaxTree);
    this.showScope(scope);
    this.showIR(node);
  }
}

/**
 * A simple graphical user interface on top of REPL that is constructed
 * dynamically and provides functionality to type in an expression and evaluate
 * it.
 */
class ReplGUI extends Repl {
  constructor() {
    super();

    /**
     * The pane that shows token output.
     * @type {!Element}
     */
    this.tokensPane = this.constructPane('Tokens');
    /**
     * The pane that shows ast output.
     * @type {!Element}
     */
    this.astPane = this.constructPane('Ast');
    /**
     * The pane that shows scope output.
     * @type {!Element}
     */
    this.scopePane = this.constructPane('Scope');
    /**
     * The pane that shows intermediate representation output.
     * @type {!Element}
     */
    this.irPane = this.constructPane('Intermediate Representation');

    // Create the textbox in which the user can type an expression and the
    // button that can be clicked to evaluate the expression.
    this.createTranslateBox();

    /**
     * The element that shows any errors encountered in the process.
     * @type {!Element}
     */
    this.errorBox = this.createErrorBox();
  }

  showTokens(tokens) {
    // Show a rudimentary representation of the tokens.
    this.tokensPane.textContent = tokens.map((token) => {
      // JSON stringify token text to show escape characters literally.
      return `text: ${JSON.stringify(token.text)}, type: ${token.type}`;
    }).join('\n');
  }

  showAst(ast) {
    this.astPane.textContent = ast.toString(true);
  }

  showScope(scope) {
    this.scopePane.textContent = scope;
  }

  showIR(ir) {
    this.irPane.textContent = ir;
  }

  translate(text) {
    try {
      super.translate(text);
      this.errorBox.textContent = '';
    } catch (e) {
      this.errorBox.textContent = e;
    }
  }

  /**
   * Constructs a rudimentary HTML pane in a `div` with a title in a `h3`
   * element and a `pre` that will get populated with debugging or output
   * information by other functions.
   * @param {string} title The title of the pane.
   * @return {!Element} The `pre` element whose content will dynamically be
   *     updated to show information.
   */
  constructPane(title) {
    const pane = document.createElement('div');
    const header = document.createElement('h3');
    header.textContent = title;
    const pre = document.createElement('pre');
    pane.appendChild(header);
    pane.appendChild(pre);
    document.body.appendChild(pane);
    return pre;
  }

  /**
   * Creates a textbox and button in a rudimentary pane. Clicking the button
   * runs the translator on the contents of the textbox.
   */
  createTranslateBox() {
    const pane = document.createElement('div');
    const header = document.createElement('h3');
    header.textContent = 'Type statements below';
    const textbox = document.createElement('textarea');
    textbox.style.whiteSpace = 'pre';
    textbox.style.fontFamily = 'monospace';
    const button = document.createElement('button');
    button.textContent = 'Translate expression';
    button.addEventListener('click', () => {
      this.translate(textbox.value);
    });
    pane.appendChild(header);
    pane.appendChild(textbox);
    pane.appendChild(button);
    document.body.appendChild(pane);
  }

  /**
   * Creates an error box that will show any errors encountered in the process.
   */
  createErrorBox() {
    const errorBox = document.createElement('div');
    document.body.appendChild(errorBox);
    return errorBox;
  }
}

// Construct a new instance of the REPL GUI to display the application.
new ReplGUI();
