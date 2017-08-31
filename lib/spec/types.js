import {Type, AlgebraicType} from '../type/type.js';
import {TypeTable, ValueType, ValueTypeOps} from '../interpreter/value_type.js';
import {Ast} from '../parser/ast.js';
import {reverse} from '../string/string.js';
import * as fraction from '../fraction/fraction.js';
import * as ast from './ast.js';

export class Variable extends ValueType {}
export class VariableOps extends ValueTypeOps {
  constructor() {
    super(Variable);
    this.registerLiteral(ast.Variable, (x) => x);

    // Assign and reassign operations.
    const aPrime = new AlgebraicType(`A'`);
    this.registerOperation(ast.Assign, (variable, value) => value,
        Type.and(new Variable(), aPrime), aPrime);
    this.registerOperation(ast.Reassign, (variable, value) => value,
        Type.and(new Variable(), aPrime), aPrime);
  }
}

export class Int extends ValueType {}
export class IntOps extends ValueTypeOps {
  constructor() {
    super(Int);
    this.registerLiteral(ast.IntLiteral, (x) => parseInt(x) | 0);

    // Binary operations.
    this.registerOperation(ast.Add, (x, y) => x + y);
    this.registerOperation(ast.Sub, (x, y) => x - y);
    this.registerOperation(ast.Mul, (x, y) => x * y);
    this.registerOperation(ast.Div, (x, y) => x / y);
    this.registerOperation(ast.FractionDiv, (x, y) => ({num:x, den:y}),
        Type.and(new Int(), new Int()), new Fraction());

    // Unary operations.
    this.registerOperation(ast.UnaryMinus, (x) => -x);
  }
}

export class Float extends ValueType {}
export class FloatOps extends ValueTypeOps {
  constructor() {
    super(Float);
    this.registerLiteral(ast.FloatLiteral, (x) => parseFloat(x));

    // Binary operations.
    this.registerOperation(ast.Add, (x, y) => x + y);
    this.registerOperation(ast.Sub, (x, y) => x - y);
    this.registerOperation(ast.Mul, (x, y) => x * y);
    this.registerOperation(ast.Div, (x, y) => x / y);

    // Unary operations.
    this.registerOperation(ast.UnaryMinus, (x) => -x);
  }
}

export class String extends ValueType {}
export class StringOps extends ValueTypeOps {
  constructor() {
    super(String);
    this.registerLiteral(ast.StringLiteral, (x) => `${x}`);

    // Binary operations.
    this.registerOperation(ast.Add, (x, y) => x + y);
    this.registerOperation(ast.Mul, (str, n) => {
      let result = '';
      if (n > 0) {
        // If n is positive, return the string repeated n times.
        for (let i = 0; i < n; i++) {
          result += str;
        }
      } else if (n < 0) {
        // If n is negative, return the reverse of the string repeated n times.
        const reversed = reverse(str);
        for (let i = 0; i < -n; i++) {
          result += reversed;
        }
      }
      return result;
    }, Type.and(new String(), new Int()));

    // Unary operations.
    this.registerOperation(ast.UnaryMinus, (x) => reverse(x));
  }
}

export class Fraction extends ValueType {
  toString() {
    return `${this.specification}(${this.value.num}/${this.value.den})`;
  }
}
export class FractionOps extends ValueTypeOps {
  constructor() {
    super(Fraction);
    this.registerLiteral(ast.FractionLiteral,
        ({num, den}) => fraction.reduce({num, den}));

    // Binary operations.
    /**
     * Registers all possible overloaded versions of the specified binary
     * operator and lambda function with Fraction and Int arguments.
     * @param {!Ast} ast The binary operator.
     * @param {Function(...!ValueType): !ValueType} lambda The lambda function.
     */
    const registerOverloadedOperation = (ast, lambda) => {
      this.registerOperation(ast, lambda);
      this.registerOperation(ast, lambda, Type.and(new Fraction(), new Int()));
      this.registerOperation(ast, lambda, Type.and(new Int(), new Fraction()));
    };
    registerOverloadedOperation(ast.Add, (x, y) => fraction.add(x, y));
    registerOverloadedOperation(ast.Sub, (x, y) => fraction.sub(x, y));
    registerOverloadedOperation(ast.Mul, (x, y) => fraction.mul(x, y));
    registerOverloadedOperation(ast.FractionDiv, (x, y) => fraction.div(x, y));

    // Unary operations.
    this.registerOperation(ast.UnaryMinus, (x) => fraction.mul(x, -1));
  }
}

const polyTypeOps = [VariableOps, IntOps, FloatOps, StringOps, FractionOps];

export class PolyTypeTable extends TypeTable {
  constructor() {
    super();
    polyTypeOps.forEach((typeOps) => this.register(new typeOps()));
  }
}
