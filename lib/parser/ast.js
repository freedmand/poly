import {Token} from '../tokenizer/token.js';
import {Type} from '../type/type.js';
import * as string from '../string/string.js';

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
   *     relates the Ast node with the token that created it. If the first
   *     argument after the optional token is a type, the Ast node will store
   *     that type information.
   */
  constructor(...params) {
    /**
     * The token corresponding to this Ast node.
     * @type {?Token}
     */
    this.token = null;
    if (params.length > 0 && params[0] instanceof Token) {
      // If the first param is a token, set the token property and shift the
      // params.
      this.token = params[0];
      params = params.slice(1);
    }
    /**
     * The type of the Ast operator (a function type if the operator is a
     * function, like addition).
     * @type {?Type}
     */
    this.type = null;
    if (params.length > 0 && params[0] instanceof Type) {
      // If the first param now is a type, set the type property and shift the
      // params.
      this.type = params[0];
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
     * Whether the Ast operator is a type literal, like `Int` or `String`.
     * @type {boolean}
     */
    this.typeLiteral = false;
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
   * @return {string}
   */
  toString(includeTypes = false) {
    /**
     * Returns an array of lines and indentation tokens representing the string
     * form of the specified Ast.
     * @param {!Ast|*} ast An Ast node or value literal.
     * @param {?string=} debugPrefix If non-null, a prefix to print before the
     *     name, describing the type of Ast sub-field.
     */
    const toStringPieces = (ast, debugPrefix = null) => {
      // Normalize the debugPrefix into something that can be reliably prepended
      // before the Ast name or value representation.
      if (debugPrefix == null) {
        debugPrefix = '';
      } else {
        debugPrefix = `${debugPrefix}:`;
      }
      // If ast is a value literal, just return a single-element array of its
      // value representation.
      if (!(ast instanceof Ast)) return [`${debugPrefix}${ast}`];
      // Otherwise, recursively build up an array of lines and indentation
      // tokens.
      const result = [];
      // If this Ast stores type information, capture it with a string printed
      // after the name.
      let typeSuffix = '';
      if (includeTypes && ast.type != null) typeSuffix = ` ${ast.type} `;
      result.push(`${debugPrefix}${ast.name}${typeSuffix}(`);
      result.push(new string.INDENT());
      for (let i = 0; i < ast.params.length; i++) {
        // Check for debug prefix before every Ast param.
        let debugPrefix = null;
        if (ast.debug != null && ast.debug.length >= i + 1) {
          debugPrefix = ast.debug[i];
        }
        // Recursively obtain the string pieces of the Ast param and append them
        // to the result array.
        const pieces = toStringPieces(ast.params[i], debugPrefix);
        for (const piece of pieces) result.push(piece);
      }
      // Unindent and return the result.
      result.push(new string.UNINDENT());
      result.push(')');
      return result;
    };
    // Return the string representation of the array of newlines and indentation
    // tokens.
    return string.toStringWithIndents(toStringPieces(this));
  }
}

/**
 * An extension of Ast geared for literals, like int and string.
 */
export class LiteralAst extends Ast {
  /**
   * @param {...*} params See base class.
   */
  constructor(...params) {
    super(...params);
    this.setDebug(['value']);
    this.literal = true;
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
export class BlockAst extends StatementsAst {
  constructor(...params) {
    super(...params);
    this.block = true;
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
 * An extension of Ast for types.
 */
export class TypeAst extends Ast {
  constructor(...params) {
    super(...params);
    this.typeLiteral = true;
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
