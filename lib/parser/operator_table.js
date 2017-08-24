import {Operator} from './operator.js';
import {Token} from '../tokenizer/token.js';
import {Ast, Add, Sub, Mul, Div, Literal} from './ast.js';

/**
 * Defines the table of operators for the Poly programming language, creating a
 * look-up table so that each operator can be readily referenced by token.
 */
export class OperatorTable {
  constructor() {
    /**
     * A mapping of token text to operator.
     * @type {!Map<string, !Operator>}
     */
    this.textTable = new Map();
    /**
     * A mapping of token type to operator.
     * @type {!Map<string, !Operator>}
     */
    this.typeTable = new Map();

    /**
     * The dummy end operator, used to signal the end of the program.
     * @type {!EndOperator}
     */
    this.endOperator = class EndOperator {
      constructor() {
        this.leftBindingPower = 0;
      }
    };

    // Create all other operators.
    this.initializeOperators();
  }

  /**
   * Initializes the operators for the Poly programming language.
   */
  initializeOperators() {
    // The literal operator.
    this.makeValueOperator({type: 'number'}, {
      ast: Literal,
    });

    // Arithmetic operators.
    this.makeSimpleOperator({text: '+'}, {
      precedence: 10,
      ast: Add,
    });
    this.makeSimpleOperator({text: '-'}, {
      precedence: 10,
      ast: Sub,
    });
    this.makeSimpleOperator({text: '*'}, {
      precedence: 20,
      ast: Mul,
    });
    this.makeSimpleOperator({text: '/'}, {
      precedence: 20,
      ast: Div,
    });
  }

  /**
   * Creates an operator that acts as a literal. It returns the token text
   * passed into it.
   * @param {!Token} canonicalToken The generic token that should trigger this
   *     operator.
   * @param {{ast: !Ast}} params
   * 
   *     ast: The Ast node with which this operator corresponds. 
   */
  makeValueOperator(canonicalToken, {ast}) {
    // Create the operator.
    const operator = class extends Operator {
      constructor({token, parser}) {
        super({ast, parser, token});
      }
      prefixHandler() {
        return new this.ast(this.token.text);
      }
    };

    // Assign it in the table and return it.
    this.setOperator(canonicalToken, operator);
    return operator;
  }

  /**
   * Creates an infix operator that has a specified level of precedence.
   * @param {!Token} canonicalToken The generic token that should trigger this
   *     operator.
   * @param {{precedence: number, ast: !Ast}} params
   *
   *     ast: The Ast node with which this operator corresponds.
   *     precedence: The binding precedence of this operator.
   */
  makeSimpleOperator(canonicalToken, {ast, precedence}) {
    // Create the operator.
    const operator = class extends Operator {
      constructor({token, parser}) {
        super({ast, parser, token});
        this.leftBindingPower = precedence;
      }
      infixHandler(left) {
        return new this.ast(
            left, this.parser.expression(this.leftBindingPower));
      }
    }

    // Assign it in the table and return it.
    this.setOperator(canonicalToken, operator);
    return operator;
  }

  /**
   * Sets the operator for the given token to the specified value in the table.
   * The operator will be indexed by 'text' or 'type', depending on which
   * respective field is defined on token. If both are defined, 'text' will be
   * preferred.
   * @param {!Token} token A token with 'text' or 'type' defined.
   * @param {*} value The value to set the token to.
   * @throws {Error} The token does not have 'text' or 'type' sub-fields.
   */
  setOperator(token, value) {
    if (token.hasOwnProperty('text')) {
      this.textTable.set(token.text, value);
    } else if (token.hasOwnProperty('type')) {
      this.typeTable.set(token.type, value);
    } else {
      throw new Error(`The token must have a 'text' or 'type' field defined`);
    }
  }

  /**
   * Gets the operator associated with the given token from the table. The token
   * will be retrieved by its 'text' or 'type' field, depending on which is
   * defined. If both are defined, 'text' will be used.
   * @param {!Token} token The token to retrieve from the table.
   * @return {*} The value from the table at that token.
   * @throws {Error} The token does not have 'text' or 'type' sub-fields, or the
   *     token was not found.
   */
  getOperator(token) {
    const [hasText, hasType] = ['text', 'type'].map(
        (x) => token.hasOwnProperty(x));
    if (hasText && this.textTable.has(token.text)) {
      return this.textTable.get(token.text);
    } else if (hasType && this.typeTable.has(token.type)) {
      return this.typeTable.get(token.type);
    } else if (!hasText && !hasType) {
      throw new Error(`The token must have a 'text' or 'type' field defined`);
    } else {
      throw new Error('The token was not found in the operator tables');
    }
  }
}