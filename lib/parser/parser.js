import {Ast} from './ast.js';
import {Operator} from './operator.js';
import {OperatorTable} from './operator_table.js';
import {Scope} from '../parser/scope.js';
import {Token} from '../tokenizer/token.js';
import {Tokenizer} from '../tokenizer/tokenizer.js';

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
    return this.statements();
  }

  /**
   * Consumes and parses until the specified token is encountered.
   * @param {!Ast} ast The ast to wrap results in.
   * @param {!Token} token The token to consume until.
   * @param {boolean} statements Whether to consume statements (true) or
   *     expressions (false) until the next token is encountered.
   * @return {!Ast} The expression consumed.
   */
  consumeUntil(ast, token, statements = false) {
    // If we're dealing with a statement, free up extraneous newlines.
    if (statements) this.consumeWhileExists({type: 'newline'});

    // If the end operator is reached before anything is parsed, the params will
    // be empty.
    let params = [];
    while (true) {
      if (this.operator.match(token)) break;
      if (statements) {
        // If reading statements, consume extra newlines and append matching
        // statements to the params, just like this.statements().
        this.consumeWhileExists({type: 'newline'});
        params.push(this.statement());
      } else {
        params = [this.expression(0, token)];
      }
    }
    if (statements) {
      // If reading statements, return results that include every statement
      // encountered.
      return new ast(...params);
    }
    return new ast(...params);
  }

  /**
   * Consumes and parses until the specified token is encountered, then advances
   * to the next token in the stream. Returns the comma-delineated expressions
   * encountered, and the number of commas encountered.
   * @param {!Token} commaToken The comma token.
   * @param {!Token} token The token to consume until.
   * @return {{commas: number, params: !Array<!Ast>}}
   *
   *     commas: The number of commas consumed.
   *     params: The parameters consumed. Each comma separates a new parameter.
   */
  consumeCommasUntil(commaToken, token) {
    // Populate params until the end token is encountered.
    const params = [];
    let commas = 0;
    while (true) {
      // Remove extraneous newlines before the parameter.
      this.consumeWhileExists({type: 'newline'});
      if (this.operator.match(token)) break;
      params.push(this.expression());
      if (this.operator.match(token)) break;
      // There must be a comma now that the expression has been parsed and the
      // end token has not been encountered.
      this.advance(commaToken);
      commas += 1;
    }
    this.advance(token);
    return {commas, params};
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
   * Repeatedly consumes the specified token from the stream if it exists until
   * it is no longer at the beginning of the stream. If the token is at the
   * beginning of the stream, nothing happens. Nothing is returned.
   * @param {!Token} token
   */
  consumeWhileExists(token) {
    while (!(this.operator instanceof this.operatorTable.endOperator) &&
        this.operator.match(token)) {
      this.operator = this.nextOperator();
    }
  }

  /**
   * Parses a single expression.
   * @param {number=} rightBindingPower The right binding power of the current
   *     expression.
   * @param {?Token} endOperator An operator token that signals the end of the
   *     expression. If null, the expression continues until its natural
   *     conclusion or the end of the file.
   * @return {!Ast} The expression as a syntax tree.
   */
  expression(rightBindingPower = 0, endOperator = null) {
    let previousOperator = this.operator;
    this.operator = this.nextOperator();
    // Handle the previous operator, which should not be dependent on input to
    // the left of itself.
    let left = previousOperator.prefixHandler(); // *nud* in the literature.

    // If endOperator is set and matches the current operator, end the
    // expression.
    if (endOperator != null && this.operator.match(endOperator)) return left;

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

  /**
   * Parses a single statement.
   * @return {!Ast} The statement as a syntax tree.
   */
  statement() {
    // Apply the statement handler of the current operator to parse the
    // statement.
    const result = this.operator.statementHandler();
    // Trim excess newlines.
    this.consumeWhileExists({type: 'newline'});
    return result;
  }

  /**
   * Parses statements until the end of the program.
   * @return {!Ast} The statements as a syntax tree.
   */
  statements() {
    const params = [];
    while (1) {
      this.consumeWhileExists({type: 'newline'});
      if (this.operator instanceof this.operatorTable.endOperator) {
        break;
      }
      params.push(this.statement());
    }
    return new (this.operatorTable.statementsAst)(...params);
  }
}
