import {PolyTypeTable} from '../spec/types.js';
import {Type} from '../type/type.js';

const NOT_IMPLEMENTED = 'Not implemented';

export class Interpreter {
  constructor() {
    this.typeTable = new PolyTypeTable();
  }

  interpret(op) {
    if (op.group) {
      // Evaluate the expression inside the group.
      return this.interpret(...op.params);
    } else if (op.literal) {
      // Evaluate literal operators separately.
      if (this.typeTable.literalOps.has(op.name)) {
        const {fn} = this.typeTable.literalOps.get(op.name);
        if (op.literal) return fn(...op.params);
      } else {
        throw new Error(NOT_IMPLEMENTED);
      }
    } else {
      // Recursively extract value types.
      const values = op.params.map((param) => this.interpret(param));
      const spec = Type.and(...values);
      if (this.typeTable.ops.get(op.name).has(spec.specification)) {
        // Extract the proper function given the type specification of its
        // arguments.
        const {fn} = this.typeTable.ops.get(op.name).get(spec.specification);
        return fn(...values);
      } else {
        throw new Error(
            `No match found for operator ${op.name} and signature ${spec.specification}`);
      }
    }

    // if (this.typeTable.ops.has(op.name)) {
    //   const {fn, baseType} = this.typeTable.ops.get(op.name);
    //   if (op.literal) return fn(...op.params);
    //   const values = op.params.map((param) => this.interpret(param));
    //   return fn(...values);
    // }
    // throw new Error(NOT_IMPLEMENTED);
  }
}