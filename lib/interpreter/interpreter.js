import {State, TypeTable, ValueType} from './value_type.js';
import {PolyTypeTable, Variable} from '../spec/types.js';
import {Type} from '../type/type.js';
import {Ast} from '../parser/ast.js';
import {Scope} from '../parser/scope.js';
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
   * @param {?State} state The current state of the interpreter, or null to use
   *     a fresh state.
   * @return {{state: !State, value: ?ValueType}}
   *
   *     state: An interpreter state that stores a scope.
   *     value: An interpreter value. Will be null if the input operator was a
   *            statement.
   */
  interpret(op, state = null) {
    // Initialize a new state if none is defined.
    if (state == null) state = new State();
    if (op.statements) {
      // Evaluate each statement sequentially.
      for (const statement of op.params) {
        const result = this.interpret(statement, state);
        state = result.state;
      }
      return {state};
    } else if (op.group) {
      // Evaluate the expression inside the group.
      if (op.block) {
        // Evaluate with a new scope if the group is a block and do not capture
        // any of its state modifying behavior.
        return {state, value: this.interpret(...op.params, state.newState())};
      } else {
        return this.interpret(...op.params, state);
      }
    } else if (op.literal) {
      // Evaluate literal operators separately.
      if (this.typeTable.literalOps.has(op.name)) {
        const {fn} = this.typeTable.literalOps.get(op.name);
        if (op.literal) return fn(state, ...op.params);
      } else {
        throw new Error(NOT_IMPLEMENTED);
      }
    } else if (op.variable) {
      // Evaluate variables separately.
      const name = op.params[0];
      return {state, value: state.scope.get(name)};
    } else {
      // Recursively extract value types.
      let values;
      if (op.assign) {
        // If an assignment operator, do not try to interpret the variable.
        const variable = new Variable(op.namedParams.get('variable').params[0]);
        // Interpret the remaining parameters and append them to the
        // uninterpreted variable.
        values = [variable].concat((op.params.slice(1).map((param) => {
          return this.interpret(param, state).value;
        })));
        // Update the variable value in the scope.
        if (op.reassign) {
          state.scope.set(variable.value, ...(values.slice(1)));
        } else {
          // If the operator is not a reassignment, then the variable will be
          // initialized in the scope.
          state.scope.initialize(variable.value, ...(values.slice(1)));
        }
      } else {
        values = op.params.map((param) => this.interpret(param, state).value);
      }
      const spec = Type.and(...values);
      if (this.typeTable.ops.get(op.name).has(spec)) {
        // Extract the proper function given the type specification of its
        // arguments.
        const {fn} = this.typeTable.ops.get(op.name).get(spec);
        return fn(state, ...values);
      } else {
        throw new SignatureError(this.typeTable, op, values, spec);
      }
    }
  }
}
