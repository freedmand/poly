import {Ast, LiteralAst, GroupAst} from '../parser/ast.js';
import * as string from '../string/string.js';

// Arithmetic operators.
export class Add extends Ast {}
export class Sub extends Ast {}
export class Mul extends Ast {}
export class Div extends Ast {}
export class FractionDiv extends Ast {}
export class Pow extends Ast {}
export class UnaryMinus extends Ast {}

// Range.
export class Range extends Ast {}

// Assignment.
export class Assign extends Ast {}

// Groupings.
export class Group extends GroupAst {}

// Literals and variables.
export class IntLiteral extends LiteralAst {}
export class FloatLiteral extends LiteralAst {}
export class StringLiteral extends LiteralAst {
  constructor(...params) {
    super(...params);
    this.params = this.params.map((x) => string.parse(x));
  }
}
export class FractionLiteral extends LiteralAst {
  constructor(numerator, denominator) {
    super(numerator, denominator);
    this.debug = ['numerator', 'denominator'];
  }
}
export class Variable extends LiteralAst {}

// TODO
// export class ForIn extends Ast {
//   constructor(variable, rangeExpression, statements) {
//     super();
//     this.params = [variable, rangeExpression, statements];
//     this.debug = [
//       ['variable', variable],
//       ['rangeExpression', rangeExpression],
//       ['statements', statements],
//     ]
//   }
// }

// export class Range extends Ast {
//   constructor(expression) {
//     super();
//     this.params = [expression];
//   }
// }

// export class Constant extends Ast {
//   constructor(constant) {
//     super();
//     this.params = [constant];
//   }
// }
