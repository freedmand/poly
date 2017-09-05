import {Type, PolymorphicType} from '../type/type.js';
import {TypeTable, ValueType, ValueTypeOps} from '../interpreter/value_type.js';
import {Ast} from '../parser/ast.js';
import {reverse} from '../string/string.js';
import * as fraction from '../fraction/fraction.js';
import * as ast from './ast.js';

export class VariableOps extends ValueTypeOps {
  constructor(typeTable) {
    super('Variable', typeTable);
  }

  initialize() {
    this.registerLiteral(ast.Variable, (x) => x);

    // Assign and reassign operations.
    const aPrime = new PolymorphicType(`A'`);
    this.registerOperation(ast.Assign, (variable, value) => value,
        Type.and(this.getType('Variable'), aPrime), aPrime);
    this.registerOperation(ast.Reassign, (variable, value) => value,
        Type.and(this.getType('Variable'), aPrime), aPrime);
  }
}

export class IntOps extends ValueTypeOps {
  constructor(typeTable) {
    super('Int', typeTable);
  }

  initialize() {
    this.registerLiteral(ast.IntLiteral, (x) => parseInt(x) | 0);

    // Binary operations.
    this.registerOperation(ast.Add, (x, y) => x + y);
    this.registerOperation(ast.Sub, (x, y) => x - y);
    this.registerOperation(ast.Mul, (x, y) => x * y);
    this.registerOperation(ast.Div, (x, y) => x / y);

    // Unary operations.
    this.registerOperation(ast.UnaryMinus, (x) => -x);
  }
}

export class FloatOps extends ValueTypeOps {
  constructor(typeTable) {
    super('Float', typeTable);
  }

  initialize() {
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

export class StringOps extends ValueTypeOps {
  constructor(typeTable) {
    super('String', typeTable);
  }

  initialize() {
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
    }, Type.and(this.getType('String'), this.getType('Int')));

    // Unary operations.
    this.registerOperation(ast.UnaryMinus, (x) => reverse(x));
  }
}

export class ArrayOps extends ValueTypeOps {
  constructor(typeTable) {
    super(null, typeTable);
  }

  initialize() {
    const aPrime = new PolymorphicType(`A'`);
    const aPrimeArray = Type.array(aPrime);
    this.registerOperation(ast.Array, (...params) => params,
        Type.spread(aPrime), aPrimeArray);

    // [A'],[A'] -> [A']
    this.registerOperation(ast.Add, (...x) => x[0].value.concat(x[1].value),
        Type.and(aPrimeArray, aPrimeArray), aPrimeArray);
  }
}

const polyTypeOps = [
  VariableOps, IntOps, FloatOps, StringOps, ArrayOps,
];

export class PolyTypeTable extends TypeTable {
  constructor() {
    super();
    polyTypeOps.forEach((typeOps) => this.register(new typeOps(this)));
    polyTypeOps.forEach((typeOps) => this.initialize(new typeOps(this)));
  }
}
