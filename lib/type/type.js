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
    /** @param {boolean} */
    this.or = false;
  }

  /**
   * Constructs a new type out of the union of old types.
   * @param {!Array<!Type>} types The types to join by union in the new type.
   * @return {!Type} The resulting union type.
   */
  static or(...types) {
    return new OrType(...types);
  }

  /**
   * Constructs a new type out of the intersection of old types.
   * @param {!Array<!Type>} types The types to join by intersection in the new
   *     type.
   * @return {!Type} The resulting intersection type.
   */
  static and(...types) {
    return new AndType(...types);
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

  /**
   * @param {!Type} type
   * @return {boolean}
   */
  match(type) {
    return this.specification == type.specification;
  }
}

export class OrType extends Type {
  /** @param {...!Type} */
  constructor(...types) {
    const signature = types.map((x) => extractSpec(x)).join('|');
    super(signature);
    /** @param {!Type} */
    this.types = types;
    this.or = true;
  }

  /**
   * Returns whether this type contains the specified type.
   * @param {!Type} type
   * @return {boolean}
   */
  contains(type) {
    let matched = false;
    this.types.forEach((subtype) => {
      if (subtype.match(type)) matched = true;
    });
    return matched;
  }

  /**
   * Returns whether this type matches -- is a superset -- of the specified
   * type.
   * @param {!Type} type
   * @return {boolean}
   */
  match(type) {
    if (type.or)  {
      let matched = true;
      type.types.forEach((subtype) => {
        if (!this.match(subtype)) matched = false;
      });
      return matched;
    } else {
      return this.contains(type);
    }
  }
}

export class AndType extends Type {
  /** @param {...!Type} */
  constructor(...types) {
    const signature = types.map((x) => extractSpec(x)).join(',');
    super(signature);
    /** @param {!Type} */
    this.types = types;
  }

  /**
   * @param {!Type} type
   * @return {boolean}
   */
  match(type) {
    let matched = true;
    if (!type.hasOwnProperty('types') || type.types.length != this.types.length) {
      return false;
    }
    this.types.forEach((subtype, idx) => {
      if (!subtype.match(type.types[idx])) matched = false;
    });
    return matched;
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
     * @type {!Map<string, !Map<string, {fn: (Function(*): !ValueType)}>>}
     */
    this.opTable = new Map();
    /**
     * An object that stores both the function that produces a value type of
     * this.baseType for any value and the corresponding literal operator that
     * triggers this function.
     * @type {?{op: !Ast, fn: (Function(*): !ValueType)}}
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
   * @param {?string} signature The expected type signature of the function. If
   *     left undefined, the function will default to requiring all its
   *     arguments to be the same type as this.baseType.
   */
  registerOperation(op, lambda, signature = null) {
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
    };

    if (this.opTable.has(op.name)) {
      this.opTable.get(op.name).set(signature.specification, value);
    } else {
      // Create a new signature map is one does not exist yet.
      const signatureMap = new Map();
      signatureMap.set(signature.specification, value);
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
    const fn = (...args) => {
      // Evaluate the lambda function to return the value.
      const value = lambda(...args);
      // Return a new instance of this.baseType with the value.
      return new (this.baseType)(value);
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
     * @type {!Map<string, !Map<string, {fn: (Function(*): !ValueType)}>>}
     */
    this.ops = new Map();
    /**
     * A mapping of literal operator name to the function that creates the
     * appropriate value type.
     * @type {!Map<string, {fn: (Function(*): !ValueType)}}
     */
    this.literalOps = new Map();
  }

  /**
   * Registers the given types in the table.
   * @param {!ValueTypeOps} typeOps A ValueTypeOps instance that will be
   *     registered in the table and indexed by operator.
   */
  register(typeOps) {
    const baseType = typeOps.baseType;
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