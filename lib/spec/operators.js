import * as ast from './ast.js';
import {Operator} from '../parser/operator.js';
import {OperatorTable} from '../parser/operator_table.js';

/**
 * Initializes the operators for the Poly programming language.
 */
export class PolyOpTable extends OperatorTable {
  constructor() {
    super(ast.Statements);
  }

  initializeOperators() {
    // Set the appropriate comma token.
    this.setCommaToken({text: ','});

    // The literal operator and variables.
    this.makeValueOperator({type: 'integer'}, {
      ast: ast.IntLiteral,
    });
    this.makeValueOperator({type: 'float'}, {
      ast: ast.FloatLiteral,
    });
    this.makeValueOperator({type: 'string'}, {
      ast: ast.StringLiteral,
    });
    this.makeValueOperator({type: 'variable'}, {
      ast: ast.Variable,
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
    this.makeSimpleOperator({text: '//'}, {
      precedence: 20,
      ast: ast.Div,
    });
    this.makeSimpleOperator({text: '/'}, {
      precedence: 20,
      ast: ast.FractionDiv,
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
    this.makeBraceOperator({text: '('}, {text: ')'}, ast.Tuple, false, ast.Group);
    this.makeBraceOperator({text: '['}, {text: ']'}, ast.Array);
    this.makeBraceOperator({text: '{'}, {text: '}'}, ast.Block, true);

    // Dummy operators.
    this.registerDummyOperator({type: 'newline'});
  }
}
