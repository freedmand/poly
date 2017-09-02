import {Type, ArrayType} from '../type/type.js';
import {TypeIndex} from '../type/type_index.js';
import {Scope} from '../parser/scope.js';

/**
 * @typedef {{state: !State, value: !Value}}
 */
export let stateValue;

/**
 * ValueType is an abstract class that represents a type which stores an
 * underlying value. The name of the type is hard-coded as the extending class's
 * name.
 */
export class ValueType extends Type {
  /**
   * @param {*} value A value of any type to store.
   */
  constructor(value) {
    super('');
    // The specification has to be set manually since this.constructor.name is
    // not available before super() has been called.
    this.specification = this.constructor.name;
    /** @type {*} */
    this.value = value;
  }

  /**
   * Returns the string representation of this type, in its simplest form.
   * @return {string}
   */
  toString() {
    return `${this.specification}(${this.value})`;
  }
}

/**
 * ArrayValueType is an abstract class that represents an array type which
 * stores underlying values. The type is derived from the values contained.
 */
export class ArrayValueType extends ArrayType {
  /**
   * @param {*} value A value of any type to store.
   */
  constructor(value) {
    super();
    if (value !== undefined) {
      // If a value is set, update the type with an array of the value.
      this.updateType(Type.array(...value));
    } else {
      // Otherwise, update the type with an empty array (type `[*]`).
      this.updateType(Type.array());
    }
    /** @type {*} */
    this.value = value;
  }

  /**
   * Returns the string representation of this type, in its simplest form.
   * @return {string}
   */
  toString() {
    return `${this.type.specification}(${this.value})`;
  }
}

/**
 * An abstract class that stores the operations allowed on a specified type and
 * describes how to compute them. This class is expected to be extended for
 * every type and have literal and evaluating operators registered in the
 * constructor. See IntOps in ../spec/types.js for an example.
 */
export class ValueTypeOps {
  /**
   * Initializes a ValueTypeOps that wraps the specified type.
   * @param {!ValueType} baseType The base type for the operators.
   */
  constructor(baseType) {
    /** @type {!ValueType} */
    this.baseType = baseType;

    /**
     * Stores a mapping of ast name to a mapping of function signature to a
     * corresponding function that produces a value type of this.baseType.
     *
     * As an example, let's say we have a function `Add` that operates on two
     * arguments of type `float` and `int` (type signature `float,int`). The
     * mapping would be set as follows:
     *
     *   new Map(['Add', new Map(
     *       ['float,int', ...],
     *   )])
     * @type {!Map<string, !Map<string, {fn: (Function(!State, *): !stateValue)}>>}
     */
    this.opTable = new Map();
    /**
     * An object that stores both the function that produces a value type of
     * this.baseType for any value and the corresponding literal operator that
     * triggers this function.
     * @type {?{op: !Ast, fn: (Function(!State, *): !stateValue)}}
     */
    this.literal = null;

    /**
     * The parent type table that stores this instance. This field gets
     * populated by the register function in TypeTable.
     * @type {?TypeTable}
     */
    this.typeTable = null;
  }

  /**
   * Registers the given operator as something that performs the specified
   * lambda function. The lambda function takes as argument value types of type
   * this.baseType and returns a value type also of type this.baseType.
   * @param {!Ast} op The operator to register.
   * @param {Function(...!ValueType): !ValueType | Function(!State, *): !stateValue} lambda
   *     The function that describes how the operator evaluates its arguments.
   * @param {?Type=} signature The expected type signature of the function. If
   *     left undefined, the function will default to requiring all its
   *     arguments to be the same type as this.baseType.
   * @param {?Type=} returnSignature The expected return signature of the
   *     function. If left undefined, the function will default to returning a
   *     value with the same type as this.baseType.
   */
  registerOperation(op, lambda, signature = null, returnSignature = null) {
    if (signature == null) {
      // If the signature is null, extract the signature as requiring all
      // arguments to be of type this.baseType.
      const argCount = lambda.length;
      const signatureList = [];
      for (let i = 0; i < argCount; i++) {
        signatureList.push(new (this.baseType));
      }
      signature = Type.and(...signatureList);
    }

    const value = {
      fn: (state, ...args) => {
        // Extract all the values from the arguments, which are all value types
        // of this.baseType.
        const values = args.map((arg) => arg.value);
        // Evaluate the lambda function to return a new value.
        const value = lambda(...values);

        // Return a new instance of this.baseType with the new value, performing
        // transformations in the literal function.
        if (returnSignature == null) {
          // If there is no custom return signature, return the application of
          // the literal function belonging to this instance.
          const result = this.literal.fn(state, value);
          return result;
        } else {
          // Otherwise, retrieve the literal function from the parent type
          // table.
          if (this.typeTable == null) {
            throw new Error('Type table needs to be set to return values ' +
                'with a different type signature');
          }
          const result = this.typeTable.types.get(returnSignature).literal.fn(
              state, value);
          return result;
        }
      },
    };

    if (this.opTable.has(op.name)) {
      this.opTable.get(op.name).set(signature, value);
    } else {
      // Create a new signature map is one does not exist yet.
      const signatureMap = new TypeIndex();
      signatureMap.set(signature, value);
      this.opTable.set(op.name, signatureMap);
    }
  }

  /**
   * Registers the given literal operator as something that creates a value type
   * of type this.baseType according to its lambda function.
   * @param {!Ast} op The literal operator to register.
   * @param {Function(*): !ValueType} lambda The function that initializes a
   *     value type based on some transformation of its arguments.
   */
  registerLiteral(op, lambda) {
    const fn = (state, ...args) => {
      // Evaluate the lambda function to return the value.
      const value = lambda(...args);
      // Return a new instance of this.baseType with the value.
      return {state, value: new (this.baseType)(value)};
    };
    this.literal = {op, fn};
  }
}

/**
 * TypeTable stores which operators work on which types for multiple different
 * types, indexing by operator and specification for fast retrieval during
 * interpretation and compilation.
 */
export class TypeTable {
  constructor() {
    /**
     * A mapping of operator name to the mapping of type specification to
     * function that creates the appropriate value type for that operator.
     * @type {!Map<string, !TypeIndex>}
     */
    this.ops = new Map();
    /**
     * A mapping of literal operator name to the function that creates the
     * appropriate value type.
     * @type {!Map<string, {fn: (Function(!State, *): !StateValue)}}
     */
    this.literalOps = new Map();

    /**
     * A mapping of the type signature to the corresponding ValueTypeOps
     * instance for that type.
     * @type {!TypeIndex}
     */
    this.types = new TypeIndex();
  }

  /**
   * Registers the given types in the table.
   * @param {!ValueTypeOps} typeOps A ValueTypeOps instance that will be
   *     registered in the table and indexed by operator.
   */
  register(typeOps) {
    const baseType = new (typeOps.baseType)();
    typeOps.typeTable = this;
    this.types.set(baseType, typeOps);
    typeOps.opTable.forEach((specMap, op) => {
      if (this.ops.has(op)) {
        // Update the existing specMap if one is already set for the operator.
        const baseSpecMap = this.ops.get(op);
        specMap.forEach((value, key) => {
          baseSpecMap.set(key, value);
        });
      } else {
        // Create a new specMap for the operator if none is set.
        this.ops.set(op, specMap);
      }
    });
    this.literalOps.set(typeOps.literal.op.name, typeOps.literal);
  }
}

/**
 * State stores the state information that represents the current interpretation
 * context.
 */
export class State {
  /**
   * @param {?Scope=} scope The scope of the interpreter. If left blank, a new
   *     scope will be initialized.
   */
  constructor(scope = null) {
    /** @type {!Scope} */
    this.scope = scope == null ? new Scope() : scope;
  }

  /**
   * Returns a new state with a child scope to the current state.
   * @return {!State}
   */
  newState() {
    return new State(new Scope(this.scope));
  }

  /**
   * Returns the state as a string, by returning the string representation of
   * the scope.
   * @return {string}
   */
  toString() {
    return this.scope.toString();
  }
}
