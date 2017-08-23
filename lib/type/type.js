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