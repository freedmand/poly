import {Token} from '../tokenizer/token.js';
import {Ast} from './ast.js';
import {Parser} from './parser.js';

const NOT_IMPLEMENTED = 'Not implemented';

/**
 * An operator is a bridge that connects a single Ast operator with a parser
 * instance and token. It is used in the parser and can be extended to include
 * information like operator precedence and handle prefix and infix expressions.
 */
export class Operator {
  /**
   * Initializes an operator with an Ast object, a parser instance, and a token.
   * @param {{ast: !Ast, parser: !Parser, token: !Token}} params
   * 
   *     ast: The Ast operator corresponding to this operator.
   *     parser: An instance of Parser that can be used to evaluate expressions.
   *     token: The Tokenizer token with which this operator corresponds.
   */
  constructor({ast, parser, token}) {
    /** @type {!Ast} */
    this.ast = ast;
    /** @type {!Parser} */
    this.parser = parser;
    /** @type {!Token} */
    this.token = token;
    /** @type {string} */
    this.name = this.ast.name;
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