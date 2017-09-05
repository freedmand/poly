import {Type, TypeIndex} from '../type/type.js';
import {Scope} from '../parser/scope.js';

/**
 * @typedef {{state: !State, value: !Value}}
 */
export let stateValue;

/**
 * ValueType stores a value and type, representing a value with that type.
 */
export class ValueType extends Type {
  /**
   * @param {*} value A value of any kind to store.
   * @param {!Type} type The type of the value.
   */
  constructor(value, type) {
    super();
    /**
     * The value stored.
     * @type {*}
     */
    this.value = value;
    // Set this.actualType so that type matching works as expected.
    this.actualType = type;
    this.specification = this.actualType.specification;
  }

  /**
   * Returns the string representation of this type, in its simplest form.
   * @return {string}
   */
  toString() {
    return `${this.specification}(${this.value})`;
  }

  matchInternal(type) {
    // Match the actual type against the specified type.
    return this.actualType.match(type);
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
   * Initializes a ValueTypeOps that optionally wraps the specified type.
   * @param {?string} baseType The base type name for the operators, or null if
   *     none is specified (in this case, all arguments and return
   *     specifications must be explicitly spelled out).
   * @param {!TypeTable} typeTable The parent type table for this ValueTypeOps
   *     instance.
   */
  constructor(baseType = null, typeTable) {
    /** @type {?string} */
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
     * The parent type table that stores this instance.
     * @type {!TypeTable}
     */
    this.typeTable = typeTable;
  }

  /**
   * Retrieves the specified type by name.
   * @param {string} typeName The type name for which to retrieve the type.
   * @return {!Type} The corresponding type.
   */
  getType(typeName) {
    return this.typeTable.getType(typeName).value.type;
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
      if (this.baseType == null) {
        throw new Error('Must specify signature if base type is null');
      }
      // If the signature is null, extract the signature as requiring all
      // arguments to be of type this.baseType.
      signature = Type.spread(this.getType(this.baseType));
    }

    const value = {
      fn: (state, mappings, ...args) => {

        if (returnSignature == null) {
          // Extract all the values from the arguments, which are all expected
          // to be value types of this.baseType, and apply the lambda function.
          const value = lambda(...(args.map((arg) => arg.value)));
          // If returnSignature is null, return a new instance of this.baseType
          // with the new value, performing transformations in the literal
          // function.
          return this.literal.fn(state, returnSignature, value);
        } else {
          // Apply the lambda function.
          let value = lambda(...args);
          // Apply mappings to get the appropriate return signature.
          const mappedReturnSignature = returnSignature.applyMappings(mappings);

          if (value instanceof ValueType) {
            if (!mappedReturnSignature.match(value)) {
              // If the result of the application of the lambda is a ValueType,
              // ensure it has an appropriate specification.
              throw new SignatureError(this.typeTable, op, value, mappedReturnSignature);
            }
          } else {
            // If the result of the application of the lambda is not a
            // ValueType, set it to be one with the mapped return specification.
            value = new ValueType(value, mappedReturnSignature);
          }
          return {state, value};
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
    const fn = (state, returnSignature, ...args) => {
      // Evaluate the lambda function to return the value.
      const value = lambda(...args);
      if (returnSignature == null) {
        // If no return signature is set, default to this.baseType.
        if (this.baseType == null) {
          throw new Error('Cannot register literal with implied return type ' +
              'if base type is not set');
        }
        // Return a new value type of this.baseType.
        return {
          state,
          value: new ValueType(value, this.getType(this.baseType), true),
        };
      } else {
        // If the return signature is set, return a new value type of the
        // specified return signature.
        return {state, value: new ValueType(value, returnSignature, true)};
      }
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
     * The base scope that maps type name to the corresponding Type and
     * ValueTypeOps instance.
     * @type {!Scope}
     */
    this.baseScope = new Scope();
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
   * Retrieves the corresponding Type and ValueTypeOps instance for the
   * specified type name in the base scope.
   * @param {string} typeName The type name.
   * @return {{type: !Type, ops: !ValueTypeOps}}
   *
   *     type: The corresponding Type instance.
   *     ops: The corresponding ValueTypeOps instance.
   */
  getType(typeName) {
    return this.baseScope.get(typeName);
  }

  /**
   * Sets the specified type name to a new instance of the type and the
   * specified ValueTypeOps instance in the base scope.
   * @param {string} typeName The type name.
   * @param {!ValueTypeOps} ops The ValueTypeOps instance to set.
   */
  setType(typeName, ops) {
    this.baseScope.initialize(typeName, {
      reserved: true,
      constant: true,
      type: true,
      value: {
        type: new Type(typeName),
        ops,
      },
    });
  }

  /**
   * Registers the given types in the table.
   * @param {!ValueTypeOps} typeOps A ValueTypeOps instance that will be
   *     registered in the table along with its corresponding base type (if one
   *     is set).
   */
  register(typeOps) {
    if (typeOps.baseType) {
      // If a base type is specified, update the type information in the base
      // scope and the types index.
      this.setType(typeOps.baseType, typeOps);
      this.types.set(this.getType(typeOps.baseType).value.type, typeOps);
    }
  }

  /**
   * Initializes the specified ValueTypeOps instance, registering all of its
   * operators and literal operators. This step is intended to be called after
   * register has been called on all ValueTypeOps instances.
   * @param {!ValueTypeOps} typeOps A ValueTypeOps instance that will have all
   *     of its operators initialized in the table.
   */
  initialize(typeOps) {
    typeOps.initialize();
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
    if (typeOps.literal !== null) {
      this.literalOps.set(typeOps.literal.op.name, typeOps.literal);
    }
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
