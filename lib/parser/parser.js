import {Ast} from './ast.js';
import {Operator} from './operator.js';
import {OperatorTable} from './operator_table.js';
import {Scope} from '../parser/scope.js';
import {TokenMatcher} from '../tokenizer/token.js';
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
     * The stream of operators that have been encountered thus far.
     * @type {!Array<!Operator>}
     */
    this.operators = [];
    /**
     * The index of the current operator in this.operators, or -1 if the stream
     * of operators has not yet been combed.
     * @param {number}
     */
    this.currentOperator = -1;
    /**
     * The current operator being iterated through.
     * @type {?Operator}
     */
    this.operator = null;
    /**
     * The previous operator encountered, or null if no previous operator
     * exists.
     * @type {?Operator}
     */
    this.previousOperator = null;

    // Set the current operator.
    this.nextOperator();
  }

  /**
   * Grabs the next token in the stream and sets the corresponding operator
   * from the operator table to the current operator. The end operator is set
   * when the stream is exhausted.
   * @param {boolean=} setPrev If true (default), sets the previous operator
   *     after the current operator has been set.
   */
  nextOperator(setPrev = true) {
    if (this.currentOperator < this.operators.length - 1) {
      // Only update the operator index if the operator stream has been rewound.
      this.currentOperator++;
    } else {
      const {value: token, done} = this.tokenStream.next();
      if (done) {
        // If the stream is done, push the end operator.
        const operator = new (this.operatorTable.endOperator)({parser: this});
        this.operators.push(operator);
      } else {
        const operator = new (this.operatorTable.getOperator(token))(
            {parser: this, token});
        this.operators.push(operator);
      }
      this.currentOperator++;
    }
    // Update the operators, no matter which path is taken.
    this.updateOperators(setPrev);
  }

  /**
   * Updates the current operator to the current operator index set.
   * @param {boolean=} setPrev If true (default), sets the previous operator
   *     after the current operator has been set.
   */
  updateOperators(setPrev = true) {
    this.operator = this.operators[this.currentOperator];
    if (setPrev) {
      this.previousOperator = this.operators[this.currentOperator - 1];
    }
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
   * @param {!TokenMatcher} tokenMatcher The token matcher to consume until
   *     satisfied.
   * @param {boolean=} statements Whether to consume statements (true) or
   *     expressions (false) until the next token is encountered.
   * @param {!Array<*>} prependParams Additional parameters to insert at the
   *     beginning of the populated Ast node.
   * @return {!Ast} The expression consumed.
   */
  consumeUntil(ast, tokenMatcher, statements = false, ...prependParams) {
    // If we're dealing with a statement, free up extraneous newlines.
    if (statements) this.consumeWhileExists(this.operatorTable.newlineMatcher);

    // If the end operator is reached before anything is parsed, the params will
    // be empty.
    let params = [];
    while (true) {
      if (tokenMatcher.match(this.operator.token)) break;
      this.consumeWhileExists(this.operatorTable.newlineMatcher);
      if (statements) {
        // If reading statements, consume extra newlines and append matching
        // statements to the params, just like this.statements().
        params.push(this.statement());
      } else {
        params = [this.expression(0, tokenMatcher)];
      }
    }
    if (statements) {
      // If reading statements, return results that include every statement
      // encountered.
      return new ast(...(prependParams.concat(params)));
    }
    return new ast(...(prependParams.concat(params)));
  }

  /**
   * Rewinds to the previous operator.
   */
  rewind() {
    this.currentOperator--;
    this.updateOperators();
  }

  /**
   * Returns the next operator in the stream, without actually advancing the
   * stream.
   */
  peek() {
    // Seek to the next operator and store it.
    this.nextOperator();
    const peekedOperator = this.operator;
    // Rewind and return the stored operator.
    this.rewind();
    return peekedOperator;
  }

  /**
   * Advances past the next token in the stream.
   * @param {?TokenMatcher=} tokenMatcher The optional token matcher we expect
   *     to satisfy and advance past. If left null, the parser will just go to
   *     the next operator.
   * @param {boolean=} orEnd If true, the advance matches the end operator as
   *     well.
   * @throws {Error} If token is set and the token advanced does not match.
   */
  advance(tokenMatcher = null, orEnd = false) {
    // If orEnd is true and the operator is an endOperator, the formal matching
    // condition can be skipped.
    const skip = orEnd &&
        this.operator instanceof this.operatorTable.endOperator;
    if (!skip && tokenMatcher && !tokenMatcher.match(this.operator.token)) {
      throw new Error(
          `Expected ${tokenMatcher} to match ${this.operator.token}`);
    }
    this.nextOperator();
  }

  /**
   * Repeatedly consumes from the stream while the specified token matcher is
   * satisfied. If the beginning of the stream does not match the specified
   * token matcher, nothing happens. Nothing is returned. The previous operator
   * is not altered.
   * @param {!TokenMatcher} tokenMatcher The token matcher.
   */
  consumeWhileExists(tokenMatcher) {
    while (!(this.operator instanceof this.operatorTable.endOperator) &&
        tokenMatcher.match(this.operator.token)) {
      this.nextOperator(false);
    }
  }

  /**
   * Parses a single expression.
   * @param {number=} rightBindingPower The right binding power of the current
   *     expression.
   * @param {?TokenMatcher} endTokenMatcher A token matcher that signals the end
   *     of the expression if satisfied. If null, the expression continues until
   *     its natural conclusion or the end of the file.
   * @return {!Ast} The expression as a syntax tree.
   */
  expression(rightBindingPower = 0, endTokenMatcher = null) {
    this.nextOperator();
    // Handle the previous operator, which should not be dependent on input to
    // the left of itself.
    let left = this.previousOperator.prefixHandler(); // nud in the literature.

    // Handle operator precedence with binding powers.
    while (rightBindingPower < this.operator.leftBindingPower) {
      // If endOperator is set and matches the current operator, end the
      // expression.
      if (endTokenMatcher != null &&
          endTokenMatcher.match(this.operator.token)) {
        return left;
      }

      this.nextOperator();

      // Handle the previous operator, which should utilize inputs to the left
      // and right of itself.
      left = this.previousOperator.infixHandler(left); // led in the literature.
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
    // Expect to advance past a newline or the end operator after parsing a
    // statement.
    this.advance(this.operatorTable.newlineMatcher, true);
    // Trim excess newlines.
    this.consumeWhileExists(this.operatorTable.newlineMatcher);
    return result;
  }

  /**
   * Parses statements until the end of the program.
   * @return {!Ast} The statements as a syntax tree.
   */
  statements() {
    const params = [];
    while (1) {
      this.consumeWhileExists(this.operatorTable.newlineMatcher);
      if (this.operator instanceof this.operatorTable.endOperator) {
        break;
      }
      params.push(this.statement());
    }
    return new (this.operatorTable.statementsAst)(...params);
  }
}
