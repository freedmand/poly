import {Token} from '../tokenizer/token.js';

/**
 * The base Abstract Syntax Tree class. Stores an optional token and a number of
 * parameters, which can optionally take names to make debugging simpler. The
 * name property is inferred from the class name.
 */
export class Ast {
  /**
   * Constructs an Ast with optional children.
   * @param {...*} params Child Ast or literal nodes. If the first argument is a
   *     token, that argument will be used to set the token property which
   *     relates the Ast node with the token that created it.
   */
  constructor(...params) {
    /** @type {?Token} */
    this.token = null;
    if (params.length > 0 && params[0] instanceof Token) {
      // If the first param is a token, set the token property and shift the
      // params.
      this.token = params[0];
      params = params.slice(1);
    }
    /** @type {!Array<!Ast>} */
    this.params = params;
    /** @type {?Array<string>} */
    this.debug = null;
    /** @type {string} */
    this.name = this.constructor.name;
    /**
     * Whether the Ast operator is a literal, like a number or string.
     * @type {boolean}
     */
    this.literal = false;
    /**
     * Whether the Ast operator is a group that contains other operators, like
     * parentheses.
     * @type {boolean}
     */
    this.group = false;
  }

  /**
   * Returns a string representation of the Ast. If debug parameters are set,
   * they are displayed as names.
   */
  toString() {
    let params;
    if (this.debug != null) {
      // Return a string in the format: Name(name1:param1,...,nameN:paramN)
      params = this.debug.map(
          (debug) => `${debug[0]}:${debug[1]}`);
    } else {
      // Return a string in the format: Name(param1,...,paramN)
      params = this.params.map((param) => `${param}`);
    }
    return `${this.name}(${params.join(',')})`;
  }
}

/**
 * An extension of Ast geared for literals, like int and string.
 */
export class LiteralAst extends Ast {
  constructor(...params) {
    super(...params);
    this.literal = true;
  }
}

/**
 * An extension of Ast geared for groups, like parentheses.
 */
export class GroupAst extends Ast {
  constructor(...params) {
    super(...params);
    this.group = true;
  }
}