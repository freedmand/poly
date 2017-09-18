import {Ast, EmptyAst, StatementsAst} from './ast.js';
import {ReadOnlyScope, Scope} from '../parser/scope.js';

import {Operator} from './operator.js';
import {Token} from '../tokenizer/token.js';
import {Type} from '../type/type.js';

// How much to decrease precedence of a following use of a right-associative
// operator.
const RIGHT_ASSOCIATIVE_DELTA = 0.00001;

/**
 * Defines the table of operators for the Poly programming language, creating a
 * look-up table so that each operator can be readily referenced by token.
 */
export class OperatorTable {
  /**
   * @param {!Ast=} statementsAst The Ast node that stores lists of statements.
   * @param {!Ast=} emptyAst The Ast node that stores an empty function.
   */
  constructor(statementsAst = StatementsAst, emptyAst = EmptyAst) {
    /** @type {!Ast} */
    this.statementsAst = statementsAst;
    /** @type {!Ast} */
    this.emptyAst = emptyAst;
    /**
     * A mapping of token text to operator.
     * @type {!Map<string, !Operator>}
     */
    this.textTable = new Map();
    /**
     * A mapping of token type to operator.
     * @type {!Map<string, !Operator>}
     */
    this.tokenTypeTable = new Map();
    /**
     * A base scope that stores primitive types.
     * @type {!Scope}
     */
    this.baseScope = new Scope();

    /**
     * The dummy end operator, used to signal the end of the program.
     * @type {!EndOperator}
     */
    this.endOperator = class EndOperator {
      constructor() {
        this.leftBindingPower = 0;
      }
    };

    // Create all types and operators.
    this.initializeTypes();
    this.initializeOperators();
    // Freeze the scope so that its internal counter can no longer be altered.
    this.baseScope = new ReadOnlyScope(this.baseScope);
  }

  /**
   * A function that is expected to be overridden in the extending class that
   * initializes all the primitive types.
   */
  initializeTypes() {}

  /**
   * A function that is expected to be overridden in the extending class that
   * initializes all the operators.
   */
  initializeOperators() {}

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
   * Makes the specified primitive type in the base scope.
   * @param {string} name The name of the primitive type.
   */
  makePrimitive(name) {
    const type = new Type(name);
    // Initialize the type in the base scope as a reserved type (cannot be
    // overriden in the program).
    this.baseScope.initialize(name, {
      reserved: true,
      constant: false,
      type: true,
      value: type,
    });
  }

  /**
   * Retrieves the specified type in the base scope by name.
   * @param {string} name The name of the type to retrieve.
   */
  getType(name) {
    return this.baseScope.getType(name);
  }

  /**
   * Creates an operator that acts as a literal. It returns the token text
   * passed into it.
   * @param {!Token} canonicalToken The generic token that should trigger this
   *     operator.
   * @param {{ast: !Ast, type: !Type}} params
   *
   *     ast: The Ast node with which this operator corresponds.
   *     type: The type this literal represents.
   * @return {!Operator} The
   */
  makeValueOperator(canonicalToken, {ast, type = null}) {
    // Create the operator.
    const operator = class extends Operator {
      constructor({parser, token}) {
        super({ast, parser, token});
      }
      prefixHandler() {
        if (type == null) return new this.ast(this.token, this.token.text);
        return new this.ast(this.token, type, this.token.text);
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
   * @param {{precedence: number, ast: !Ast, unaryAst: ?Ast, unaryPrecedence: number, rightAssociative: boolean}} params
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
  makeSimpleOperator(canonicalToken, {ast, precedence, type = null,
      unaryAst = null, unaryPrecedence = 100, unaryType = null,
      rightAssociative = false}) {
    // Create the operator.
    const operator = class extends Operator {
      constructor({parser, token}) {
        super({ast, parser, token});
        /** @type {number} */
        this.leftBindingPower = precedence;
        /** @type {boolean} */
        this.rightAssociative = rightAssociative;
        if (unaryAst != null) {
          // Set the prefix handler if unaryAst is defined.
          this.prefixHandler = () => {
            if (unaryType == null) {
              return new unaryAst(
                  this.token, this.parser.expression(unaryPrecedence));
            }
            return new unaryAst(
                this.token, unaryType, this.parser.expression(unaryPrecedence));
          };
        }
      }
      infixHandler(left) {
        this.parser.consumeWhileExists({type: 'newline'});
        // If the operator is right-associative, subtract the proper delta from
        // the next expression's precedence.
        if (type == null) {
          return new this.ast(this.token, left,
            this.parser.expression(this.leftBindingPower -
            (this.rightAssociative ? RIGHT_ASSOCIATIVE_DELTA : 0)));
        }
        return new this.ast(this.token, type, left,
            this.parser.expression(this.leftBindingPower -
            (this.rightAssociative ? RIGHT_ASSOCIATIVE_DELTA : 0)));
      }
    }

    // Assign it in the table and return it.
    this.setOperator(canonicalToken, operator);
    return operator;
  }

  /**
   * Creates an operator that responds to a brace with opening and closing
   * forms, like parentheses and curly braces.
   * @param {!Token} open The token that opens the brace.
   * @param {!Token} close The token that closes the brace.
   * @param {!Ast} ast The Ast node to create with the contents of the brace
   *     group.
   * @param {boolean} statement Whether the brace operator delineates a new
   *     statement.
   */
  makeBraceOperator(open, close, ast, statement = false) {
    if (statement) {
      this.setOperator(open, class extends Operator {
        constructor({token, parser}) {
          super({ast, parser, token, statement});
        }
        statementHandler() {
          this.parser.advance(open);
          // Consume until a closing brace is encountered, and then advance past
          // that brace.
          const result = this.parser.consumeUntil(
              this.ast, close, this.statement);
          this.parser.advance(close);
          return result;
        }
      });
      this.registerDummyOperator(close);
    } else {
      this.setOperator(open, class extends Operator {
        constructor({token, parser}) {
          super({ast, parser, token, statement});
        }
        prefixHandler() {
          const result = this.parser.consumeUntil(
              this.ast, close, this.statement);
          this.parser.advance(close);
          return result;
        }
      });
      // Assign an operator to the closing brace to handle trailing comma.
      const emptyAst = this.emptyAst;
      this.setOperator(close, class extends Operator {
        constructor({token, parser}) {
          super({emptyAst, parser, token, statement});
        }
        prefixHandler() {
          // Rewind to move the operator stream to the current position.
          this.parser.rewind();
          return new emptyAst(this.token);
        }
      });
    }
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
      this.tokenTypeTable.set(token.type, operator);
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
    } else if (hasType && this.tokenTypeTable.has(token.type)) {
      return this.tokenTypeTable.get(token.type);
    } else if (!hasText && !hasType) {
      throw new Error(`The token must have a 'text' or 'type' field defined`);
    } else {
      throw new Error('The token was not found in the operator tables');
    }
  }
}
