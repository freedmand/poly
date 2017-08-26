import {PolyTypeTable} from '../spec/types.js';

export class Interpreter {
  constructor() {
    this.typeTable = new PolyTypeTable();
  }

  interpret(op) {
    if (this.typeTable.ops.has(op.name)) {
      const {fn, baseType} = this.typeTable.ops.get(op.name);
      if (op.literal) return fn(...op.params);
      const values = op.params.map((param) => this.interpret(param));
      return fn(...values);
    }
    throw new Error('Not implemented');
  }
}