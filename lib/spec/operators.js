import * as ast from './ast.js';
import {Operator} from '../parser/operator.js';
import {OperatorTable} from '../parser/operator_table.js';

/**
 * Initializes the operators for the Poly programming language.
 */
export class PolyOpTable extends OperatorTable {
  constructor() {
    super();
  }

  initializeOperators() {
    // The literal operator and variables.
    this.makeValueOperator({type: 'integer'}, {
      ast: ast.IntLiteral,
    });
    this.makeValueOperator({type: 'float'}, {
      ast: ast.FloatLiteral,
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

    // Assign.
    this.makeSimpleOperator({text: '='}, {
      precedence: 4,
      ast: ast.Assign,
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
}