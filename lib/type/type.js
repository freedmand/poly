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
 * Retrieves the underlying type for a specified type. For set algebraic types,
 * this returns their internal type value.
 * @param {!Type} type The type.
 * @return {!Type} The underlying type.
 */
function extractType(type) {
  if (type.hasOwnProperty('internalType')) return type.internalType;
  return type;
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
    /**
     * Whether this type describes an or relation.
     * @param {boolean}
     */
    this.or = false;
    /**
     * Whether this type is an array type.
     * @param {boolean}
     */
    this.array = false;
    /**
     * The internal, underlying type for this type. In most cases, this is just
     * `this`, but for algebraic types it is its internal type if set.
     */
    this.internalType = this;
  }

  /**
   * Constructs a new type out of the union of old types.
   * @param {!Array<!Type>} types The types to join by union in the new type.
   * @return {!Type} The resulting union type.
   */
  static or(...types) {
    // A single type does not represent an `or` type.
    if (types.length == 1) return types[0];
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
   * @param {...!Type} types The element subtypes for the array. Iterates
   *     through each and returns the simplest possible matching type.
   * @return {!Type} The resulting array type.
   */
  static array(...types) {
    return new ArrayType(...types);
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
    return this.internalType.specification == type.internalType.specification;
  }

  /**
   * Unsets the type or any of this type's children. This has no effect unless
   * the type is an algebraic type.
   */
  unset() {}
}

/**
 * AnyType is simply a type that matches anything.
 */
export class AnyType extends Type {
  constructor() {
    super('*');
  }

  match(type) {
    // AnyType matches everything.
    return true;
  }
}

/**
 * OrType represents the union of multiple types, storing each of the children
 * types and providing matching functions.
 */
export class OrType extends Type {
  /** @param {...!Type} */
  constructor(...types) {
    // Construct a specification of the form `type1|...|typeN`.
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
    for (const subtype of this.types) {
      // If any of this type's subtypes contain the specified type, return true.
      if (subtype.internalType.match(type.internalType)) return true;
    }
    return false;
  }

  /**
   * Returns whether this type matches -- is a superset -- of the specified
   * type.
   * @param {!Type} type
   * @return {boolean}
   */
  match(type) {
    if (type.or) {
      // If checking if this type is a superset of another or type, we must be
      // able to match all of the subtypes of the specified type.
      for (const subtype of type.types) {
        if (!this.internalType.match(subtype.internalType)) return false;
      }
      return true;
    } else {
      // Otherwise, we only need to check that this type simply contains the
      // other type.
      return this.contains(type);
    }
  }

  unset() {
    super.unset();
    this.types.forEach((type) => type.unset());
  }
}

/**
 * AndType represents the intersection of types, storing each of the children
 * types and providing matching functions.
 */
export class AndType extends Type {
  /** @param {...!Type} */
  constructor(...types) {
    // Construct a specification of the form `type1,...,typeN`.
    const signature = types.map((x) => extractSpec(x)).join(',');
    super(signature);
    /** @param {!Type} */
    this.types = types;
  }

  /**
   * Returns whether this type matches the specified type, that is, contains an
   * exact ordered duplicate of the specified type's subtypes.
   * @param {!Type} type
   * @return {boolean}
   */
  match(type) {
    // Return false if the specified type does not have subtypes or it does but
    // of a different cardinality.
    if (!type.hasOwnProperty('types') ||
        type.types.length != this.types.length) {
      return false;
    }
    for (let i = 0; i < this.types.length; i++) {
      // If any of this type's subtypes does not match the specified type's
      // subtypes at each index, return false.
      const subtype = this.types[i].internalType;
      const otherSubtype = type.types[i].internalType;
      if (!subtype.match(otherSubtype)) return false;
    }
    return true;
  }

  unset() {
    super.unset();
    this.types.forEach((type) => type.unset());
  }
}

/**
 * ArrayType represents a container type that can store zero or more elements of
 * a specified type.
 */
export class ArrayType extends Type {
  /**
   * @param {...!Type} types The types the array contains.
   */
  constructor(...types) {
    super('');
    let type;
    if (types.length == 0) {
      // An array of length zero must be able to match anything.
      type = new AnyType();
    } else {
      // typePool stores all the unique types in the array.
      const typePool = [types[0]];
      // Iteratively assemble the minimal type specification for the array.
      for (const type of types.slice(1)) {
        // Attempt to match each type in the array, starting with the second
        // element, to every element in the typePool, which is initialized with
        // the first element. If nothing matches, add the type from the array
        // into the pool.
        let noMatches = true;
        for (const matcher of typePool) {
          if (matcher.match(type)) noMatches = false;
        }
        if (noMatches) typePool.push(type);
      }
      // The resulting type for the array is the `or` of every type built up in
      // the typePool (if only one type fits the bill, Type.or will return just
      // that type).
      type = Type.or(...typePool);
    }
    /**
     * The underlying type for the array.
     * @param {?Type}
     */
    this.subtype = null;
    this.array = true;
    this.updateType({subtype: type});
  }

  /**
   * Updates the type and specification of this array to the specified array
   * type.
   * @param {!Type} type The array type to update.
   */
  updateType(type) {
    this.subtype = type.subtype;
    this.specification = `[${this.subtype.specification}]`;
  }

  /**
   * Returns whether this array type matches the specified array type.
   * @param {!Type} type
   * @return {boolean}
   */
  match(type) {
    // Return false if the specified type is not an array type.
    if (!type.array) return false;
    return this.subtype.internalType.match(type.subtype.internalType);
  }
}

/**
 * A modular type that can be act like any type. It can be set to behave like a
 * specified type, which it will mimick until unset() is called.
 */
export class AlgebraicType extends Type {
  constructor(name) {
    super(name);
  }

  /**
   * Sets the algebraic type to act like the specified type.
   * @param {!Type} type
   */
  set(type) {
    this.internalType = type;
  }

  /**
   * Unsets the algebraic type, so that it can act like anything again.
   */
  unset() {
    super.unset();
    this.internalType = this;
  }

  match(type) {
    // If no internal type is set, this type matches everything.
    if (this.internalType == this) this.set(type);
    // Otherwise, match against the internal type.
    return this.internalType.match(type.internalType);
  }
}
