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
    /**
     * If debug is set, the named params map will be populated with keys
     * corresponding to the debug field and values corresponding to the
     * respective index in the params field.
     * @type {!Map<string, !Ast>}
     */
    this.namedParams = new Map();
    /** @type {string} */
    this.name = this.constructor.name;
    /**
     * Whether the Ast operator is a list of statements.
     * @type {boolean}
     */
    this.statements = false;
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
    /**
     * Whether the Ast operator is a block that has its own scope.
     * @type {boolean}
     */
    this.block = false;
    /**
     * Whether the Ast operator is a variable literal.
     * @type {boolean}
     */
    this.variable = false;
    /**
     * Whether the Ast operator is an assignment operator, where the first
     * operand is a variable.
     * @type {boolean}
     */
    this.assign = false;
    /**
     * Whether the Ast operator is a re-assignment operator, where the first
     * operand is a variable.
     * @type {boolean}
     */
    this.reassign = false;
    /**
     * The type this Ast node represents in string form, if it is a literal.
     * @type {?string}
     */
    this.type = null;
  }

  /**
   * Returns the value for the specified named parameter.
   * @param {string} name The name of the named parameter.
   * @return {!Ast} The value.
   * @throws {Error} The specified named parameter does not exist for this Ast
   *     node.
   */
  get(name) {
    if (!this.has(name)) {
      throw new Error('Ast does not have the specified named parameter');
    }
    return this.namedParams.get(name);
  }

  /**
   * Returns whether this Ast node has the specified named parameter.
   * @param {string} name The name of the named parameter.
   * @return {boolean}
   */
  has(name) {
    return this.namedParams.has(name);
  }

  /**
   * Sets the debug parameters to the specified string array, updating the named
   * params in the process.
   * @param {!Array<string>} debug
   */
  setDebug(debug) {
    this.debug = debug;
    if (this.debug != null) {
      this.namedParams.clear();
      // Set the named params.
      this.debug.forEach((name, index) => {
        this.namedParams.set(name, this.params[index]);
      });
    }
  }

  /**
   * Returns a string representation of the Ast. If debug parameters are set,
   * they are displayed as names.
   */
  toString() {
    let params = [];
    if (this.debug != null) {
      // Return a string in the format: Name(name1:param1,...,nameN:paramN)
      this.namedParams.forEach(
          (value, debug) => params.push(`${debug}:${value}`));
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
  /**
   * @param {string} type The type this literal represents, in string form.
   * @param {...*} params See base class.
   */
  constructor(type, ...params) {
    super(...params);
    this.setDebug(['value']);
    this.type = type;
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

/**
 * An extension of Ast geared for blocks that have a new scope, like curly
 * braces.
 */
export class BlockAst extends GroupAst {
  constructor(...params) {
    super(...params);
    this.group = true;
    this.block = true;
  }
}

/**
 * An extension of Ast geared for statements.
 */
export class StatementsAst extends Ast {
  constructor(...params) {
    super(...params);
    this.statements = true;
  }
}

/**
 * An extension of Ast for variables.
 */
export class VariableAst extends Ast {
  constructor(...params) {
    super(...params);
    this.variable = true;
    this.setDebug(['name']);
  }
}

/**
 * An extension of Ast for assignments, such as a simple variable assignment and
 * variable reassign.
 */
export class AssignAst extends Ast {
  constructor(...params) {
    super(...params);
    this.assign = true;
  }
}
