import {Interpreter} from './interpreter/interpreter.js';
import {Parser} from './parser/parser.js';
import {PolyOpTable} from './spec/operators.js';
import {PolyTokenizer} from './spec/tokens.js';
import {SignatureError} from './error/signature_error.js';
import {State} from './interpreter/value_type.js';
import {Token} from './tokenizer/token.js';

/**
 * Repl (read-eval-print-loop) is a class that provides a basic Poly shell with
 * hooks to display debugging output at different steps.
 */
class Repl {
  constructor() {
    /**
     * The operator table for Poly.
     * @type {!PolyOpTable}
     */
    this.opTable = new PolyOpTable();
    /**
     * The state of the REPL. Updates as variables are assigned and reassigned.
     * @type {!State}
     */
    this.state = new State();
    /**
     * The interpreter for the REPL.
     * @type {!Interpreter}
     */
    this.interpreter = new Interpreter();
  }

  /**
   * Resets the state of the REPL.
   */
  resetState() {
    this.state = new State();
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
   * Shows the specified state in some way. The extending class defines this
   * functionality.
   * @param {!State} state
   */
  showState(state) {}

  /**
   * Shows the specified value in some way. The extending class defines this
   * functionality.
   * @param {!ValueType} value
   */
  showValue(value) {}

  /**
   * Interprets the specified text (by first tokenizing and parsing it), showing
   * the intermediate output along the way. Updates the state of the interpreter
   * based on the output state.
   * @param {string} text The text to interpret.
   */
  interpret(text) {
    const tokenizer = new PolyTokenizer(text);
    this.showTokens(tokenizer.tokenizeAll());
    tokenizer.reset();
    const parser = new Parser(tokenizer, this.opTable);
    const syntaxTree = parser.expression();
    this.showAst(syntaxTree);
    const {value, state} = this.interpreter.interpret(syntaxTree, this.state);
    this.showState(state);
    this.showValue(value);
    this.state = state;
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
     * The pane that shows state output.
     * @type {!Element}
     */
    this.statePane = this.constructPane('State');
    /**
     * The pane that shows value output.
     * @type {!Element}
     */
    this.valuePane = this.constructPane('Value');
    // Create the textbox in which the user can type an expression and the
    // button that can be clicked to evaluate the expression.
    this.createInterpretBox();
  }

  showTokens(tokens) {
    // Show a rudimentary representation of the tokens.
    this.tokensPane.textContent = tokens.map(
        (token) => `text: ${token.text}, type: ${token.type}`).join('\n');
  }

  showAst(ast) {
    this.astPane.textContent = ast;
  }

  showState(state) {
    this.statePane.textContent = state;
  }

  showValue(value) {
    this.valuePane.textContent = value;
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
   * runs the interpreter on the contents of the textbox.
   */
  createInterpretBox() {
    const pane = document.createElement('div');
    const header = document.createElement('h3');
    header.textContent = 'Type statement below';
    const textbox = document.createElement('textarea');
    textbox.style.whiteSpace = 'pre';
    textbox.style.fontFamily = 'monospace';
    const button = document.createElement('button');
    button.textContent = 'Interpret expression';
    button.addEventListener('click', () => {
      this.interpret(textbox.value);
    });
    pane.appendChild(header);
    pane.appendChild(textbox);
    pane.appendChild(button);
    document.body.appendChild(pane);
  }
}

// Construct a new instance of the REPL GUI to display the application.
new ReplGUI();