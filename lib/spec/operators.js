import * as ast from './ast.js';

import {PolymorphicType, Type} from '../type/type.js';

import {Operator} from '../parser/operator.js';
import {OperatorTable} from '../parser/operator_table.js';

const primitives = ['Int', 'Float', 'String'];

/**
 * Initializes the operators for the Poly programming language.
 */
export class PolyOpTable extends OperatorTable {
  constructor() {
    super(ast.Statements, ast.Empty, {type: 'newline'});
  }

  initializeTypes() {
    primitives.forEach((primitive) => this.makePrimitive(primitive));
  }

  initializeOperators() {
    const [Int, Float, String] =
        primitives.map((primitive) => this.getType(primitive));
    const aPrime = new PolymorphicType(`A'`);
    const bPrime = new PolymorphicType(`B'`);

    // The literal operator and variables.
    this.makeValueOperator({type: 'integer'}, {
      ast: ast.IntLiteral,
      type: Int,
    });
    this.makeValueOperator({type: 'float'}, {
      ast: ast.FloatLiteral,
      type: Float,
    });
    this.makeValueOperator({type: 'string'}, {
      ast: ast.StringLiteral,
      type: String,
    });
    this.makeValueOperator({type: 'type'}, {
      ast: ast.TypeLiteral,
    });

    // Variable is a custom value operator that has custom logic for handling
    // instances of it at the beginning of a statement.
    this.setOperator({type: 'variable'}, class extends Operator {
      constructor({parser, token}) {
        super({ast: ast.Variable, parser, token});
      }
      prefixHandler() {
        // If encountered in an expression, return a normal variable Ast.
        return new this.ast(this.token, this.token.text);
      }
      statementHandler() {
        // If encountered at the beginning of a statement, try to consume type
        // information, an assign operator (`=` or `:=`), and an expression.
        const variable = this.prefixHandler();
        this.parser.advance();
        const type =
            this.parser.consumeUntil(
                ast.TypeLiteral, this.parser.operatorTable.assignMatcher);

        // If doing a normal reassignment, the type information should not be
        // included.
        if (this.parser.operator.match({text: '='})) {
          if (type.params.length != 0) {
            throw new Error('Reassignment cannot include type');
          }
          this.parser.advance();
          return new ast.Reassign(variable, this.parser.expression());
        }

        // Advance past the `:=` sign and parse the remainder of the expression.
        this.parser.advance();
        const expression = this.parser.expression();
        if (type.params.length == 0) {
          // Return a normal assignment if type information is not present.
          return new ast.Assign(variable, expression);
        }
        // Otherwise, return a typed Ast that includes the type information.
        return new ast.TypedAssign(variable, type, expression);
      }
    });

    // Arithmetic operators.
    this.makeSimpleOperator({text: '+'}, {
      precedence: 10,
      ast: ast.Add,
      type: Type.or(
        Type.function([Int, Int], Int),
        Type.function([Float, Float], Float),
        Type.function([String, String], String),
      ),
    });
    this.makeSimpleOperator({text: '-'}, {
      precedence: 10,
      ast: ast.Sub,
      type: Type.or(
        Type.function([Int, Int], Int),
        Type.function([Float, Float], Float),
      ),
      unaryAst: ast.UnaryMinus,
      unaryPrecedence: 100,
      unaryType: Type.or(
        Type.function([Int], Int),
        Type.function([Float], Float),
      ),
    });
    this.makeSimpleOperator({text: '*'}, {
      precedence: 20,
      ast: ast.Mul,
      type: Type.or(
        Type.function([Int, Int], Int),
        Type.function([Float, Float], Float),
        Type.function([String, Int], String),
      ),
    });
    this.makeSimpleOperator({text: '/'}, {
      precedence: 20,
      ast: ast.Div,
      type: Type.or(
        Type.function([Int, Int], Int),
        Type.function([Float, Float], Float),
      ),
    });
    this.makeSimpleOperator({text: '**'}, {
      precedence: 30,
      ast: ast.Pow,
      rightAssociative: true,
      type: Type.or(
        Type.function([Int, Int], Int),
        Type.function([Float, Float], Float),
      ),
    });
    this.makeSimpleOperator({text: '|'}, {
      precedence: 40,
      ast: ast.Or,
      type: Type.function([aPrime, bPrime], Type.or(aPrime, bPrime)),
    });
    this.makeSimpleOperator({text: ','}, {
      precedence: 40,
      ast: ast.Tuple,
      type: Type.function([aPrime, bPrime], Type.or(aPrime, bPrime)),
    });

    // Range operator.
    this.makeSimpleOperator({type: 'range'}, {
      precedence: 5,
      ast: ast.Range,
      type: Type.or(
        Type.function([Int, Int], Type.array(Int)),
      ),
      unaryAst: ast.Range,
      unaryPrecedence: 50,
      unaryType: Type.or(
        Type.function([Int, Int], Type.array(Int)),
      ),
    });

    // Assign.
    this.makeSimpleOperator({text: ':='}, {
      precedence: 3,
      ast: ast.Assign,
    });
    this.makeSimpleOperator({text: '='}, {
      precedence: 4,
      ast: ast.Reassign,
    });

    // Groupings.
    this.makeBraceOperator(
        {text: '('}, {text: ')'}, ast.Group);
    this.makeBraceOperator({text: '['}, {text: ']'}, ast.Array);
    this.makeBraceOperator({text: '{'}, {text: '}'}, ast.Block, true);

    // Dummy operators.
    this.registerDummyOperator({type: 'newline'});
  }
}
