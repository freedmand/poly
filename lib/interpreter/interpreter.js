import {PolyTypeTable} from '../spec/types.js';
import {Type, TypeTable} from '../type/type.js';
import {Ast} from '../parser/ast.js';
import {SignatureError} from '../error/signature_error.js';

const NOT_IMPLEMENTED = 'Not implemented';

/**
 * Intrepreter evaluates an abstract syntax tree and returns its result.
 */
export class Interpreter {
  constructor() {
    /**
     * The type table for the interpreter.
     * @type {!TypeTable}
     */
    this.typeTable = new PolyTypeTable();
  }

  /**
   * Interprets the Ast operator and returns the result.
   * @param {!Ast} op The Ast operator.
   * @return {!ValueType} The result.
   */
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
        throw new SignatureError(this.typeTable, op, values, spec);
      }
    }
  }
}