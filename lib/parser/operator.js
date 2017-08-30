import {Token} from '../tokenizer/token.js';
import {Ast} from './ast.js';

const NOT_IMPLEMENTED = 'Not implemented';

/**
 * An operator is a bridge that connects a single Ast operator with a parser
 * instance and token. It is used in the parser and can be extended to include
 * information like operator precedence and handle prefix and infix expressions.
 */
export class Operator {
  /**
   * Initializes an operator with an Ast object, a parser instance, and a token.
   * @param {{ast: ?Ast, parser: !Parser, token: !Token, statement: number=}} params
   *
   *     ast: The Ast operator corresponding to this operator. If omitted, the
   *          operator is not functional (for instance, closing parenthesis).
   *     parser: An instance of Parser that can be used to evaluate expressions.
   *     token: The Tokenizer token with which this operator corresponds.
   *     statement: Whether this operator has special logic for beginning a
   *                statement.
   */
  constructor({ast, parser, token, statement = false}) {
    /** @type {?Ast} */
    this.ast = ast;
    /** @type {!Parser} */
    this.parser = parser;
    /** @type {!Token} */
    this.token = token;
    /** @type {boolean} */
    this.statement = statement;
    /** @type {?string} */
    this.name = null;
    if (this.ast) this.name = this.ast.name;
  }

  /**
   * Returns whether the given operator matches the specified token object.
   * @param {!Object} tokenObj A token object literal with fields 'type',
   *     'text', or both set.
   * @return {boolean} Whether the given operator's token has no conflicts with
   *     the specified token object.
   */
  match(tokenObj) {
    const [hasText, hasType] = ['text', 'type'].map(
      (x) => tokenObj.hasOwnProperty(x));
    if (hasText && hasType) {
      return this.token.text == tokenObj.text &&
          this.token.type == tokenObj.type;
    }
    if (hasText) return this.token.text == tokenObj.text;
    if (hasType) return this.token.type == tokenObj.type;
    throw new Error(
        `The token object must have a 'text' or 'type' field defined`);
  }

  /**
   * A handler for statement operators. This is like prefixHandler, but
   * specifically for the start of a statement.
   */
  statementHandler() {
    throw new Error(NOT_IMPLEMENTED);
  }

  /**
   * A handler for prefix operators, like unary negation and literals.
   */
  prefixHandler() {
    throw new Error(NOT_IMPLEMENTED);
  }

  /**
   * A handler for infix operators, like addition and exponentiation.
   * @param {!} left
   */
  infixHandler(left) {
    throw new Error(NOT_IMPLEMENTED);
  }
}