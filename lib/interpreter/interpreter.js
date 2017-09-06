import {State, TypeTable, ValueType} from './value_type.js';
import {PolyTypeTable} from '../spec/types.js';
import {Type} from '../type/type.js';
import {Ast} from '../parser/ast.js';
import {Scope, makeVar} from '../parser/scope.js';
import {SignatureError} from '../error/signature_error.js';

const NOT_IMPLEMENTED = 'Not implemented';
const VARIABLE_TYPE = 'Variable';

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

  interpretStatements(op, state) {
    // Evaluate each statement sequentially.
    for (const statement of op.params) {
      const result = this.interpret(statement, state);
      state = result.state;
    }
    return {state};
  }

  interpretGroup(op, state) {
    // Evaluate the expression inside the group.
    if (op.block) {
      // Evaluate with a new scope if the group is a block.
      return {state, value: this.interpret(...op.params, state.newState())};
    } else {
      return this.interpret(...op.params, state);
    }
  }

  interpretLiteral(op, state, expectedType) {
    if (this.typeTable.literalOps.has(op.name)) {
      // Evaluate literal operators separately.
      const {fn, typeOps} = this.typeTable.literalOps.get(op.name);
      if (expectedType != null) {
        let passed = false;
        if (typeOps.baseType != null) {
          const literalType = typeOps.getType(typeOps.baseType);
          if (expectedType.match(literalType).match) passed = true;
        }
        if (!passed) {
          const value = fn(state, null, ...op.params).value;
          throw new SignatureError(this.typeTable, op, value, expectedType);
        }
      }
      return fn(state, null, ...op.params);
    } else {
      throw new Error(NOT_IMPLEMENTED);
    }
  }

  interpretVariable(op, state, expectedType) {
    // Evaluate variables separately.
    const name = op.params[0];
    const {value} = state.scope.get(name);
    if (expectedType != null) {
      if (!expectedType.match(value).match) {
        throw new SignatureError(this.typeTable, op, value, expectedType);
      }
    }
    return {state, value: state.scope.get(name).value};
  }

  /**
   * Interprets the Ast operator and returns the result.
   * @param {!Ast} op The Ast operator.
   * @param {?State} state The current state of the interpreter, or null to use
   *     a fresh state.
   * @return {{state: !State, value: ?ValueType, expectedType: ?Type}}
   *
   *     state: An interpreter state that stores a scope.
   *     value: An interpreter value. Will be null if the input operator was a
   *            statement.
   *     expectedType: The expected type of the expression, for instance, if
   *                   assigning or reassigning a typed variable. If null, the
   *                   type will be inferred from the expression.
   */
  interpret(op, state = null, expectedType = null) {
    // Initialize a new state if none is defined.
    if (state == null) state = new State();
    if (op.statements) {
      return this.interpretStatements(op, state);
    } else if (op.group) {
      return this.interpretGroup(op, state);
    } else if (op.literal) {
      return this.interpretLiteral(op, state, expectedType);
    } else if (op.variable) {
      return this.interpretVariable(op, state, expectedType);
    } else {
      // Recursively extract value types.
      let values;
      if (op.assign) {
        // If an assignment operator, do not try to interpret the variable.
        // Create a new `Variable` type from the type table.
        const variable = new ValueType(op.namedParams.get('variable').params[0],
            this.typeTable.getType(VARIABLE_TYPE).value.type);
        // If reassigning a variable, use the variables type as the expected
        // type.
        let newExpectedType = null;
        if (op.reassign) {
          newExpectedType = state.scope.get(variable.value).value;
        }
        // Interpret the remaining parameters and append them to the
        // uninterpreted variable.
        values = [variable].concat((op.params.slice(1).map((param) => {
          return this.interpret(param, state, newExpectedType).value;
        })));
        // Update the variable value in the scope.
        if (op.reassign) {
          state.scope.set(variable.value, ...(values.slice(1)));
        } else {
          // If the operator is not a reassignment, then the variable will be
          // initialized in the scope.
          state.scope.initialize(variable.value, makeVar(...(values.slice(1))));
        }
      } else {
        values = op.params.map(
            (param) => this.interpret(param, state, expectedType).value);
      }
      const spec = Type.and(...values);
      if (this.typeTable.ops.get(op.name).has(spec).match) {
        // Extract the proper function given the type specification of its
        // arguments.
        const {value: {fn}, mappings} = this.typeTable.ops.get(
            op.name).get(spec);
        return fn(state, mappings, expectedType, ...values);
      } else {
        throw new SignatureError(this.typeTable, op, values, spec);
      }
    }
  }
}
