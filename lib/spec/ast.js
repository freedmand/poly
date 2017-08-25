import {Ast} from '../parser/ast.js';

// Arithmetic operators.
export class Add extends Ast {}
export class Sub extends Ast {}
export class Mul extends Ast {}
export class Div extends Ast {}
export class Pow extends Ast {}
export class UnaryMinus extends Ast {}

// Range.
export class Range extends Ast {}

// Assignment.
export class Assign extends Ast {}

// Groupings.
export class Group extends Ast {}

// Literals and variables.
export class IntLiteral extends Ast {}
export class Variable extends Ast {}

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
