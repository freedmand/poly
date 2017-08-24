import {Operator} from './operator.js';
import {Token} from '../tokenizer/token.js';
import * as ast from './ast.js';

// How much to decrease precedence of a following use of a right-associative
// operator.
const RIGHT_ASSOCIATIVE_DELTA = 0.00001;

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
      ast: ast.Literal,
    });

    // Arithmetic operators.
    this.makeSimpleOperator({text: '+'}, {
      precedence: 10,
      ast: ast.Add,
    });
    this.makeSimpleOperator({text: '-'}, {
      precedence: 10,
      ast: ast.Sub,
      unaryAst: ast.UnaryMinus,
      unaryPrecedence: 100,
    });
    this.makeSimpleOperator({text: '*'}, {
      precedence: 20,
      ast: ast.Mul,
    });
    this.makeSimpleOperator({text: '/'}, {
      precedence: 20,
      ast: ast.Div,
    });
    this.makeSimpleOperator({text: '**'}, {
      precedence: 30,
      ast: ast.Pow,
      rightAssociative: true,
    });

    // Range operator.
    this.makeSimpleOperator({type: 'range'}, {
      precedence: 5,
      ast: ast.Range,
      unaryAst: ast.Range,
      unaryPrecedence: 50,
    });

    // Groupings.
    this.setOperator({text:'('}, class extends Operator {
      constructor({token, parser}) {
        super({ast: ast.Group, parser, token});
      }
      prefixHandler() {
        const advance = {text: ')'};
        const expression = this.parser.consumeUntil(advance);
        this.parser.advance(advance);
        return new this.ast(expression);
      }
    });
    this.registerDummyOperator({text: ')'});
  }

  /**
   * Creates an operator that does not do anything but occupies a place in the
   * operator table. This is useful for things like trailing parentheses.
   * @param {!Token} canonicalToken The generic token that should trigger this
   *     operator.
   * @return {!Operator} The dummy operator created.
   */
  registerDummyOperator(canonicalToken) {
    const operator = class extends Operator {
      constructor({token, parser}) {
        super({token, parser});
      }
    };
    this.setOperator(canonicalToken, operator);
    return operator;
  }

  /**
   * Creates an operator that acts as a literal. It returns the token text
   * passed into it.
   * @param {!Token} canonicalToken The generic token that should trigger this
   *     operator.
   * @param {{ast: !ast.Ast}} params
   * 
   *     ast: The Ast node with which this operator corresponds. 
   * @return {!Operator} The 
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
   * @param {{precedence: number, ast: !ast.Ast, unaryAst: ?ast.Ast, unaryPrecedence: number, rightAssociative: boolean}} params
   *
   *     ast: The Ast node with which this operator corresponds.
   *     precedence: The binding precedence of this operator.
   *     unaryAst: The optional Ast node if this operator is used in a unary
   *               context.
   *     unaryPrecedence: The precedence of the operator if used in a unary
   *                      context. Only works is unaryAst is set.
   *     rightAssociative: Whether the operator is right-associative, like
   *                       exponentiation.
   */
  makeSimpleOperator(canonicalToken, {ast, precedence, unaryAst = null,
      unaryPrecedence = 100, rightAssociative = false}) {
    // Create the operator.
    const operator = class extends Operator {
      constructor({token, parser}) {
        super({ast, parser, token});
        /** @type {number} */
        this.leftBindingPower = precedence;
        /** @type {boolean} */
        this.rightAssociative = rightAssociative;
        if (unaryAst != null) {
          // Set the prefix handler if unaryAst is defined.
          this.prefixHandler = () => {
            return new unaryAst(this.parser.expression(unaryPrecedence));
          };
        }
      }
      infixHandler(left) {
        // If the operator is right-associative, subtract the proper delta from
        // the next expression's precedence.
        return new this.ast(
            left, this.parser.expression(this.leftBindingPower - 
                (this.rightAssociative ? RIGHT_ASSOCIATIVE_DELTA : 0)));
      }
    }

    // Assign it in the table and return it.
    this.setOperator(canonicalToken, operator);
    return operator;
  }

  /**
   * Sets the operator table to point to the specified operator for the given
   * token. The operator will be indexed by 'text' or 'type', depending on which
   * respective field is defined on token. If both are defined, 'text' will be
   * preferred.
   * @param {!Token} token A token with 'text' or 'type' defined.
   * @param {!Operator} operator The operator value that will be set in the
   *     operator table.
   * @throws {Error} The token does not have 'text' or 'type' sub-fields.
   */
  setOperator(token, operator) {
    if (token.hasOwnProperty('text')) {
      this.textTable.set(token.text, operator);
    } else if (token.hasOwnProperty('type')) {
      this.typeTable.set(token.type, operator);
    } else {
      throw new Error(`The token must have a 'text' or 'type' field defined`);
    }
  }

  /**
   * Gets the operator associated with the given token from the table. The token
   * will be retrieved by its 'text' or 'type' field, depending on which is
   * defined. If both are defined, 'text' will be used.
   * @param {!Token} token The token to retrieve from the table.
   * @return {!Operator} The operator from the table for that token.
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