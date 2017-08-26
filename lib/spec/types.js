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

const polyTypeOps = [IntOps];

export class PolyTypeTable extends TypeTable {
  constructor() {
    super();
    polyTypeOps.forEach((typeOps) => this.register(new typeOps()));
  }
}