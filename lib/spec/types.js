import {ValueType, ValueTypeOps, TypeTable} from '../type/type.js';
import * as ast from './ast.js';

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
    this.registerOperation(ast.Mul, (x, y) => {
      let result = '';
      for (let i = 0; i < Math.abs(y); i++) {
        result += x;
      }
      return result;
    }, 'String,Int');

    // Unary operations.
    this.registerOperation(ast.UnaryMinus,
        (x) => x.split('').reverse().join(''));
  }
}

const polyTypeOps = [IntOps, FloatOps, StringOps];

export class PolyTypeTable extends TypeTable {
  constructor() {
    super();
    polyTypeOps.forEach((typeOps) => this.register(new typeOps()));
  }
}