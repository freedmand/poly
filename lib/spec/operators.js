import * as ast from './ast.js';
import {Operator} from '../parser/operator.js';
import {OperatorTable} from '../parser/operator_table.js';
import {Type} from '../type/type.js';

const primitives = ['Int', 'Float', 'String'];

/**
 * Initializes the operators for the Poly programming language.
 */
export class PolyOpTable extends OperatorTable {
  constructor() {
    super(ast.Statements);
  }

  initializeTypes() {
    primitives.forEach((primitive) => this.makePrimitive(primitive));
  }

  initializeOperators() {
    const [Int, Float, String] =
        primitives.map((primitive) => this.getType(primitive));

    // Set the appropriate comma token.
    this.setCommaToken({text: ','});

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
    this.makeValueOperator({type: 'variable'}, {
      ast: ast.Variable,
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
    // If no commas are encountered, parentheses acts as a Group, not a Tuple.
    this.makeBraceOperator(
        {text: '('}, {text: ')'}, ast.Tuple, false, ast.Group);
    this.makeBraceOperator({text: '['}, {text: ']'}, ast.Array);
    this.makeBraceOperator({text: '{'}, {text: '}'}, ast.Block, true);

    // Dummy operators.
    this.registerDummyOperator({type: 'newline'});
  }
}
