import {Token} from '../tokenizer/token.js';
import {Tokenizer} from '../tokenizer/tokenizer.js';
import {Operator} from './operator.js';
import {OperatorTable} from './operator_table.js';

/**
 * Takes in a fresh tokenizer and returns a parse syntax tree representing a
 * program, before checking type, scope, and names. Returns parse errors if
 * no grammar can be matched. Uses the Top Down Operator Precedence (TDOP).
 * See http://javascript.crockford.com/tdop/tdop.html for more details about
 * the method used.
 */
export class Parser {
  /**
   * Creates a new parser from a tokenizer that has not yet consumed its source
   * and an operator table.
   * @param {!Tokenizer} tokenizer The fresh tokenizer to stream operators from.
   * @param {!OperatorTable} operatorTable An operator table defining the Poly
   *     language spec.
   */
  constructor(tokenizer, operatorTable) {
    /**
     * The stream of tokens to iterate through.
     * @type {!Iterator<!Token>}
     */
    this.tokenStream = tokenizer.stream();
    /** @type {!OperatorTable} */
    this.operatorTable = operatorTable;
    /**
     * The current operator being iterated through.
     * @type {!Operator}
     */
    this.operator = this.nextOperator();
  }

  /**
   * Grabs the next token in the stream and returns the corresponding operator
   * from the operator table. Returns the end operator when the stream is
   * exhausted.
   * @return {!Operator} The operator corresponding to the next token in the
   *     stream, or the end operator if all tokens have been consumed.
   */
  nextOperator() {
    const {value: token, done} = this.tokenStream.next();
    if (done) {
      return new (this.operatorTable.endOperator)({parser: this});
    }
    return new (this.operatorTable.getOperator(token))({parser: this, token});
  }

  /**
   * Parses the entire token stream, returning the parse tree.
   * @return {!Ast} The token stream as a parsed syntax tree.
   */
  parse() {
    return this.expression();
  }

  /**
   * Consumes and parses an expression until the specified token is encountered.
   * @param {!Token} token The token to consume until.
   * @return {!Ast} The expression consumed.
   */
  consumeUntil(token) {
    let expression = [];
    while (true) {
      if (this.operator.match(token)) break;
      expression = this.expression();
    }
    return expression;
  }

  /**
   * Advances past the next token in the stream.
   * @param {?Token=} token The optional token we expect to advance past.
   * @throws {Error} If token is set and the token advanced does not match.
   */
  advance(token = null) {
    if (token && !this.operator.match(token)) {
      throw new Error(`Expected ${token} to match ${this.operator.token}`);
    }
    this.operator = this.nextOperator();
  }

  /**
   * Parses a single expression.
   * @param {number=} rightBindingPower The right binding power of the current
   *     expression.
   * @return {!Ast} The expression as a syntax tree.
   */
  expression(rightBindingPower = 0) {
    let previousOperator = this.operator;
    this.operator = this.nextOperator();
    // Handle the previous operator, which should not be dependent on input to
    // the left of itself.
    let left = previousOperator.prefixHandler(); // *nud* in the literature.

    // Handle operator precedence with binding powers.
    while (rightBindingPower < this.operator.leftBindingPower) {
      previousOperator = this.operator;
      this.operator = this.nextOperator();
      // Handle the previous operator, which should utilize inputs to the left
      // and right of itself.
      left = previousOperator.infixHandler(left); // *led* in the literature.
    }
    return left;
  }
}