import * as string from '../string/string.js';

import {AssignAst, Ast, BlockAst, EmptyAst, GroupAst, LiteralAst, StatementsAst, TypeAst, VariableAst} from '../parser/ast.js';
import {GenericType, Type} from '../type/type.js';

// Arithmetic operators.
export class Add extends Ast {}
export class Sub extends Ast {}
export class Mul extends Ast {}
export class Div extends Ast {}
export class FractionDiv extends Ast {}
export class Pow extends Ast {}
export class UnaryMinus extends Ast {}

// Types.
export class Array extends Ast {
  constructor(...args) {
    super(...args);
    this.array = true;
    this.type = new (class ArrayType extends GenericType {
      getReturnTypeForArgs(args) {
        return Type.softArray(...args.types);
      }
    });
  }
}
export class Tuple extends Ast {
  constructor(...args) {
    super(...args);
    this.tuple = true;
    this.type = new (class TupleType extends GenericType {
      getReturnTypeForArgs(args) {
        return Type.softTuple(...args.types);
      }
    });
  }
}
export class Or extends Ast {
  constructor(...args) {
    super(...args);
    this.or = true;
    this.type = new (class OrType {
      getReturnTypeForArgs(args) {
        return Type.or(...args.types);
      }
    });
  }
}
export class Empty extends EmptyAst {
  constructor(...args) {
    super(...args);
    this.empty = true;
    this.type = new (class EmptyType {
      getReturnTypeForArgs(args) {
        return Type.empty();
      }
    });
  }
}

// Infix brace operators.
export class FunctionParams extends Ast {}
export class ArrayIndex extends Ast {}

// Range.
export class Range extends Ast {}

// Assignment.
export class Assign extends AssignAst {
  constructor(...params) {
    super(...params);
    this.setDebug(['variable', 'value']);
  }
}
export class TypedAssign extends AssignAst {
  constructor(...params) {
    super(...params);
    this.setDebug(['variable', 'type', 'value']);
  }
}
export class Reassign extends AssignAst {
  constructor(...params) {
    super(...params);
    this.reassign = true;
    this.setDebug(['variable', 'value']);
  }
}

// Groupings and blocks.
export class Group extends GroupAst {
  constructor(...args) {
    super(...args);
    this.type = new (class GroupType {
      getReturnTypeForArgs(args) {
        return Type.group(...args.types);
      }
    });
  }
}
export class Block extends BlockAst {}

// Literals.
export class IntLiteral extends LiteralAst {}
export class FloatLiteral extends LiteralAst {}
export class StringLiteral extends LiteralAst {
  constructor(...params) {
    super(...params);
    this.params = this.params.map((x) => string.parse(x));
  }
}
export class FractionLiteral extends LiteralAst {}

// Variables.
export class Variable extends VariableAst {}
export class TypeLiteral extends TypeAst {}

// Statements.
export class Statements extends StatementsAst {}

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
