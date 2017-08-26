import {Ast} from '../parser/ast.js';

const IMBALANCED_STACK = 'Stack is imbalanced';

/**
 * Extracts the specification from the type, enclosing it in parentheses if it
 * is not already self-contained.
 * @param {!Type} type The type to extract the specification from.
 * @return {string} The type's specification, potentially enclosed in
 *     parentheses.
 * @throws {Error} If the parentheses or square brackets in the specification
 *     are not balanced.
 */
function extractSpec(type) {
  const specification = type.specification;

  // Create a stack to ensure parentheses and brackets are balanced and see if
  // the specification needs to be enclosed in parentheses to prevent ambiguity.
  const stack = [];
  for (const c of specification) {
    // Push to the stack when encountering opening braces.
    if (c == '(' || c == '[') stack.push(c);

    // Pop from the stack when encountering closing braces.
    if (c == ')') {
      if (stack.pop() != '(') throw new Error(IMBALANCED_STACK);
    }
    if (c == ']') {
      if (stack.pop() != '[') throw new Error(IMBALANCED_STACK);
    }
    
    // If the stack is empty and a union or intersection operator is
    // encountered, then the expression is not self-contained and requires
    // enclosing parentheses.
    if (stack.length == 0 && (c == ',' || c == '|')) {
      return `(${specification})`;
    }
  }
  return specification;
}

/**
 * Type represents an algebraic type that can be composed with other types to
 * create complex specifications.
 */
export class Type {
  /**
   * Constructs a new type, optionally around an old specification.
   * @param {string} type The name of the type, if a top-level type; otherwise,
   *     the specification of the type.
   * @param {?Type} childType The optional child type for this type. Top-level
   *     types need not have any child type defined.
   */
  constructor(type, childType=null) {
    if (childType == null) {
      this.specification = type;
    } else {
      this.specification = `${type}(${childType.specification})`;
    }
  }

  /**
   * Constructs a new type out of the union of old types.
   * @param {!Array<!Type>} types The types to join by union in the new type.
   * @return {!Type} The resulting union type.
   */
  static or(...types) {
    return new Type(types.map((x) => extractSpec(x)).join('|'));
  }

  /**
   * Constructs a new type out of the intersection of old types.
   * @param {!Array<!Type>} types The types to join by intersection in the new
   *     type.
   * @return {!Type} The resulting intersection type.
   */
  static and(...types) {
    return new Type(types.map((x) => extractSpec(x)).join(','));
  }

  /**
   * Constructs an array type composed of elements of the specified type.
   * @param {!Type} type The element type for the array.
   * @return {!Type} The resulting array type.
   */
  static array(type) {
    return new Type(`[${type.specification}]`);
  }

  /**
   * Constructs a map type composed of keys and values in the specified type.
   * @param {!Type} keyType The key type for the map.
   * @param {!Type} valueType The value type for the map.
   * @return {!Type} The resulting map type.
   */
  static map(keyType, valueType) {
    return new Type(`${keyType.specification}:${valueType.specification}`);
  }
}

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
     * Stores a mapping of ast name to both a boolean that stores whether the
     * ast operation is a literal operation and a function that produces a value
     * type of this.baseType.
     * @type {!Map<string, {fn: (Function(*): !ValueType), literal: boolean}}
     */
    this.opTable = new Map();
    /**
     * A function that produces a value type of this.baseType for any value.
     * @type {?{fn: (Function(*): !ValueType)}}
     */
    this.literal = null;
  }

  /**
   * Registers the given operator as something that performs the specified
   * lambda function. The lambda function takes as argument value types of type
   * this.baseType and returns a value type also of type this.baseType.
   * @param {!Ast} op The operator to register.
   * @param {Function(...!ValueType): !ValueType} lambda The function that
   *     describes how the operator evaluates its arguments.
   */
  registerOperation(op, lambda) {
    this.opTable.set(op.name, {
      fn: (...args) => {
        // Extract all the values from the arguments, which are all value types
        // of this.baseType.
        const values = args.map((arg) => arg.value);
        // Evaluate the lambda function to return a new value.
        const value = lambda(...values);
        // Return a new instance of this.baseType with the new value, performing
        // transformations in the literal function.
        return this.literal.fn(value);
      },
      literal: false,
    });
  }

  /**
   * Registers the given literal operator as something that creates a value type
   * of type this.baseType according to its lambda function.
   * @param {!Ast} op The literal operator to register.
   * @param {Function(*): !ValueType} lambda The function that initializes a
   *     value type based on some transformation of its arguments.
   */
  registerLiteral(op, lambda) {
    const fn = (...args) => {
      // Evaluate the lambda function to return the value.
      const value = lambda(...args);
      // Return a new instance of this.baseType with the value.
      return new (this.baseType)(value);
    };
    this.opTable.set(op.name, {fn, literal: true});
    this.literal = {fn};
  }
}

/**
 * TypeTable stores which operators work on which types for multiple different
 * types, indexing by operator for fast retrieval during interpretation and
 * compilation.
 */
export class TypeTable {
  constructor() {
    /**
     * A mapping of operator name to both the function that creates the
     * appropriate value type for that operator and the base type of that value
     * type.
     * @type {!Map<string, {fn: (Function(*): !ValueType), baseType: !ValueType}>}
     */
    this.ops = new Map();
  }

  /**
   * Registers the given types in the table.
   * @param {!Array<!ValueTypeOps>} typeOps An array of ValueTypeOps instances
   *     corresponding to all the types recognized by the language.
   */
  register(typeOps) {
    const baseType = typeOps.baseType;
    typeOps.opTable.forEach(({fn, literal}, op) => {
      this.ops.set(op, {fn, baseType, literal});
    });
  }
}