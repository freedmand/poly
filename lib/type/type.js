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
    /**
     * Whether this type describes an or relation.
     * @param {boolean}
     */
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
    if (type.internalType) {
      // Match algebraic types that are set to the proper specification.
      return this.specification == type.internalType.specification;
    }
    return this.specification == type.specification;
  }

  /**
   * Unsets the type or any of this type's children. This has no effect unless
   * the type is an algebraic type.
   */
  unset() {}
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
      if (subtype.match(type)) return true;
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
    if (type.or)  {
      // If checking if this type is a superset of another or type, we must be
      // able to match all of the subtypes of the specified type.
      for (const subtype of type.types) {
        if (!this.match(subtype)) return false;
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
      if (!this.types[i].match(type.types[i])) return false;
    }
    return true;
  }

  unset() {
    super.unset();
    this.types.forEach((type) => type.unset());
  }
}

/**
 * A modular type that can be act like any type. It can be set to behave like a
 * specified type, which it will mimick until unset() is called.
 */
export class AlgebraicType extends Type {
  constructor(name) {
    super(name);
    /**
     * The internal type this type represents.
     * @type {?Type}
     */
    this.internalType = null;
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
    this.internalType = null;
  }

  match(type) {
    // If no internal type is set, this type matches everything.
    if (this.internalType == null) this.set(type);
    // Otherwise, match against the internal type.
    return this.internalType.match(type);
  }
}
