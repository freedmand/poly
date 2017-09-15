const IMBALANCED_STACK = 'Stack is imbalanced';

/**
 * A result from attempting to match one type against another.
 * @typedef {{match: boolean, mappings: !Array<{from: !Type, to: !Type}>}}
 *
 *     match: Whether the type matched (contains a superset) of the specified
 *            type.
 *     mappings: An array of type mappings that represent the necessary
 *               transformations for the types to match.
 */
export let matchResult;

/**
 * Given a set of type mappings, returns a matchResult containing:
 *   - match = true iff the mappings are valid.
 *   - a condensed version of the mappings (redundant entries are merged). If
 *     match is false, an empty array is returned here.
 * @param {!Array<{from: !Type, to: !Type}} mappings
 * @return {!matchResult}
 */
function condenseAndValidate(mappings) {
  // Store key/value pairs corresponding to from/to entries.
  const typeMap = new TypeIndex();
  // Store the resulting mappings array that will be returned on success.
  for (const {from, to} of mappings) {
    if (!typeMap.setCompete(from, to)) {
      // If setting the from type in the type map results in a conflict, the
      // mappings are not valid.
      return {match: false, mappings: []};
    }
  }

  // Extract the resulting condensed mappings from the map.
  const resultMappings = [];
  typeMap.forEach((value, key) => resultMappings.push({from: key, to: value}));
  // Return a successful condensing if there were no type conflicts earlier.
  return {match: true, mappings: resultMappings};
}

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

    // If the stack is empty and an `or` (|) or `and` (,) operator is
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
     * Whether this type is a group type.
     */
    this.group = false;
    /**
     * Whether this type describes an `and` relation.
     * @param {boolean}
     */
    this.and = false;
    /**
     * Whether this type describes an `or` relation.
     * @param {boolean}
     */
    this.or = false;
    /**
     * Whether this type is an array type.
     * @param {boolean}
     */
    this.array = false;
    /**
     * Whether this type is a function type.
     * @param {boolean}
     */
    this.function = false;
    /**
     * Whether this type describes a spread relation.
     * @param {boolean}
     */
    this.spread = false;
    /**
     * Whether this type is a polymorphic type.
     * @param {boolean}
     */
    this.polymorphic = false;
  }

  /**
   * Returns this type in string representation.
   * @return {string}
   */
  toString() {
    return this.specification;
  }

  /**
   * Constructs a new type out of the union of old types.
   * @param {!Array<!Type>} types The types to join by union in the new type.
   * @return {!Type} The resulting union type.
   */
  static or(...types) {
    // Remove redundant types.
    const uniqueTypes = [];
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (type.or) {
        // If the type is an `or` type, add each subtype to the next position in
        // the array in order (this is done by iterating the type's subtypes in
        // reverse and splicing them into the types array).
        for (let j = type.types.length - 1; j >= 0; j--) {
          types.splice(i + 1, 0, type.types[j]);
        }
        continue;
      }
      // Iterate through each type.
      let matched = false;
      // Iterate through each saved unique type.
      for (const uniqueType of uniqueTypes) {
        if (Type.equals(type, uniqueType)) {
          // If the type equals the unique type, break and do not add the type
          // into the set of unique types.
          matched = true;
          break;
        }
      }
      if (matched) continue;
      // If the type did not equal any of the unique types, add the type to the
      // pool of unique types.
      uniqueTypes.push(type);
    }
    // A single type does not represent an `or` type.
    if (uniqueTypes.length == 1) return uniqueTypes[0];
    // Return a new `or` type composed of only unique types.
    return new OrType(...uniqueTypes);
  }

  /**
   * Constructs a new type that represents a group containing the specified
   * type.
   * @param {!Type} type The type to make a group type from.
   * @return {!Type} The resulting group type.
   */
  static group(type) {
    return new GroupType(type);
  }

  /**
   * Constructs a new type that represents a tuple of old types.
   * @param {!Array<!Type>} types The types to join by tuple in the new type.
   * @return {!Type} The resulting tuple type.
   */
  static and(...types) {
    return new AndType(...types);
  }

  /**
   * Constructs a new type that represents a flattened tuple of two specified
   * types.
   * @param {!Type} type1 The first type.
   * @param {!Type} type2 The second type.
   * @return {!Type} The resulting tuple type.
   */
  static softTuple(type1, type2) {
    /**
     * If the type is an `and` type, extracts the specified subtypes from it;
     * otherwise, returns a single-element array containing the type.
     * @param {!Type} type The type from which to extract subtypes.
     * @return {!Array<!Type>} The extracted subtypes.
     */
    const extractTypes = (type) => {
      if (type.and) return type.types;
      return [type];
    }
    return Type.and(...extractTypes(type1).concat(extractTypes(type2)));
  }

  /**
   * Returns whether both types match each other.
   * @param {!Type} type1 The first type.
   * @param {!Type} type2 The second type.
   * @return {boolean}
   */
  static equals(type1, type2) {
    return type1.match(type2).match && type2.match(type1).match;
  }

  /**
   * Returns the intersection of two types.
   * @param {!Type} type1 The first type.
   * @param {!Type} type2 The second type.
   * @return {?Type} The intersection type or null if no such type exists.
   */
  static intersect(type1, type2) {
    if (!type1.or && !type2.or) {
      // If neither of the types are `or` types, check for simple equality,
      // returning one of the types as the intersection result if the types are
      // equal (and null if they are not).
      if (Type.equals(type1, type2)) return type1;
      return null;
    }

    /**
     * Returns a pool of all the type's subtypes, if the type is an `or` type;
     * otherwise, returns a pool containing just the type itself.
     * @param {!Type} type
     * @return {!Array<!Type>} The resulting pool.
     */
    const populatePool = (type) => {
      const typePool = [];
      if (type.or) {
        for (const subtype of type.types) typePool.push(subtype);
      } else {
        typePool.push(type);
      }
      return typePool;
    }

    // Construct pools representing the subtypes within each type.
    const typePool1 = populatePool(type1);
    const typePool2 = populatePool(type2);

    const resultPool = [];
    // Attempt to calculate the intersection of each type in the first type pool
    // against each type in the second type pool, aggregating the results.
    for (const t1 of typePool1) {
      for (const t2 of typePool2) {
        const intersection = Type.intersect(t1, t2);
        if (intersection !== null) {
          resultPool.push(intersection);
          break;
        }
      }
    }

    // Return the `or` of all matching results.
    return Type.or(...resultPool);
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
   * Constructs a spread type composed of the following type.
   * @param {!Type} type The type to spread.
   * @return {!Type} The resulting spread type.
   */
  static spread(type) {
    return new SpreadType(type);
  }

  /**
   * Constructs a new function type out of the specified arguments and return
   * type.
   * @param {!Array<!Type>|!Type|null} argumentsType The arguments type to the
   *     function, left null if the function does not have arguments, in which
   *     case it will be transformed to be an empty `and` type. If specified as
   *     an array of types, it will be transformed to a single `and` type that
   *     encapsulates the arguments.
   * @param {!Array<!Type>|!Type|null} returnType The return type to the
   *     function, left null if the function does not return anything, in which
   *     case it will be transformed to be an empty `and` type. If specified as
   *     an array of types, it will be transformed to a single `and` type that
   *     encapsulates the return type.
   */
  static function(argumentsType, returnType = null) {
    if (argumentsType == null) argumentsType = Type.and();
    if (Array.isArray(argumentsType)) argumentsType = Type.and(...argumentsType);
    if (returnType == null) returnType = Type.and();
    if (Array.isArray(returnType)) returnType = Type.and(...returnType);
    return new FunctionType(argumentsType, returnType);
  }

  /**
   * Returns whether this type matches (contains a superset) the specified type.
   * @param {!Type} type The specified type.
   * @return {!matchResult} Whether the types match and a list of mappings
   *     representing any polymorphic transformations, if necessary.
   */
  match(type) {
    // Map `this` and `type` to their actual types if they have actual types
    // defined.
    const thisType = this.actualType != null ? this.actualType : this;
    const matchType = type.actualType != null ? type.actualType : type;
    return thisType.matchInternal(matchType);
  }

  /**
   * The internal matching algorithm that will be overridden by subclasses.
   * @param {!Type} type The specified type.
   * @return {!matchResult} Whether the types match and a list of mappings
   *     representing any polymorphic transformations, if necessary.
   * @protected
   */
  matchInternal(type) {
    return {match: this == type, mappings: []};
  }

  /**
   * Applies the specified mappings to this type, returning the result as a new
   * type. If there are any subtypes, this is recursively applied down the type
   * chain.
   * @param {!Array<{from: !Type, to: !Type}} mappings The mappings to apply.
   * @return {!Type} A new type representing the mappings applied to this type.
   */
  applyMappings(mappings) {
    return this;
  }

  /**
   * Gets the return type of the function for the specified argument type. If
   * this type is a function, checks if the argument type matches the specified
   * args and returns the appropriate return type for the function, applying any
   * necessary mappings. If this type is an `or` type, checks each subtype for
   * its return type if its a function, returning the first match. If no match
   * is found in either instance, or if the type is not a function or an `or`
   * type, returns null.
   * @param {!Type} args The argument type to match.
   * @return {?Type} The return type if the arguments match; otherwise null.
   */
  getReturnTypeForArgs(args) {
    return null;
  }
}

/**
 * AnyType is simply a type that matches anything.
 */
export class AnyType extends Type {
  constructor() {
    super('*');
  }

  matchInternal(type) {
    // AnyType matches everything.
    return {match: true, mappings: []};
  }
}

/**
 * GroupType represents a group that contains the specified type.
 */
export class GroupType extends Type {
  constructor(type) {
    super(type.specification);
    this.group = true;
    this.actualType = type;
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
    /**
     * The subtypes representing this `or` type.
     * @param {!Type}
     */
    this.types = types;
    this.or = true;
  }

  /**
   * Returns whether this type contains the specified type.
   * @param {!Type} type
   * @return {!matchResult}
   */
  contains(type) {
    for (const subtype of this.types) {
      const {match, mappings} = subtype.match(type);
      // If any of this type's subtypes contain the specified type, return true.
      if (match) return {match, mappings};
    }
    return {match: false, mappings: []};
  }

  /**
   * Returns whether this type matches -- is a superset -- of the specified
   * type.
   * @param {!Type} type
   * @return {boolean}
   */
  matchInternal(type) {
    if (type.or)  {
      // Store the cumulative set of mappings that must result to satisfy this
      // `or` type.
      const overallMappings = [];
      // If checking if this type is a superset of another or type, we must be
      // able to match all of the subtypes of the specified type.
      for (const subtype of type.types) {
        const {match, mappings} = this.match(subtype);
        if (!match) return {match: false, mappings: []};
        for (const mapping of mappings) {
          overallMappings.push(mapping);
        }
      }
      return condenseAndValidate(overallMappings);
    } else {
      // Otherwise, we only need to check that this type simply contains the
      // other type.
      return this.contains(type);
    }
  }

  applyMappings(mappings) {
    return Type.or(...this.types.map((type) => type.applyMappings(mappings)));
  }

  getReturnTypeForArgs(args) {
    for (const subtype of this.types) {
      // Explicitly forbid recursion by requiring subtypes to be functions.
      if (!subtype.function) return null;
      // Check if the subtype has a return type for the args, returning that
      // if it is not null.
      const returnType = subtype.getReturnTypeForArgs(args);
      if (returnType != null) return returnType;
    }
    // Return null if none of the subtypes matches.
    return null;
  }
}

/**
 * AndType represents a tuple of types, storing each of the children types and
 * providing matching functions.
 */
export class AndType extends Type {
  /** @param {...!Type} */
  constructor(...types) {
    if (types.length == 0) {
      // An empty `and` type has the specification `()`.
      super('()');
    } else {
      // Construct a specification of the form `type1,...,typeN`.
      const signature = types.map((x) => extractSpec(x)).join(',');
      super(signature);
    }
    /**
     * The subtypes representing this `and` type.
     * @param {!Type}
     */
    this.types = types;
    this.and = true;
  }

  /**
   * Returns whether this type matches the specified type, that is, contains an
   * exact ordered duplicate of the specified type's subtypes.
   * @param {!Type} type
   * @return {boolean}
   */
  matchInternal(type) {
    // Return false if the specified type does not have subtypes, or it does but
    // of a different cardinality.
    if (!type.and || type.types.length != this.types.length) {
      return {match: false, mappings: []};
    }
    // Store the cumulative set of mappings that must result to satisfy this
    // `and` type.
    const overallMappings = [];
    for (let i = 0; i < this.types.length; i++) {
      // If any of this type's subtypes does not match the specified type's
      // subtypes at each index, return false.
      const {match, mappings} = this.types[i].match(type.types[i]);
      if (!match) return {match: false, mappings: []};
      for (const mapping of mappings) overallMappings.push(mapping);
    }
    return condenseAndValidate(overallMappings);
  }

  applyMappings(mappings) {
    return Type.and(...this.types.map((type) => type.applyMappings(mappings)));
  }
}

export class FunctionType extends Type {
  /**
   * @param {!Type} argumentTypes The types for each function argument.
   * @param {!Type} returnType The function's return type, or null if it does
   *     not return anything.
   */
  constructor(argumentTypes, returnType = null) {
    super();
    /**
     * The tuple type of all the arguments in the function.
     * @type {!Type}
     */
    this.arguments = argumentTypes;
    /**
     * The type of the return value, or an empty tuple type if the function does
     * not return a value.
     * @type {!Type}
     */
    this.return = returnType;

    this.function = true;

    // Specification of the form `argsType -> returnType`.
    this.specification =
        `${this.arguments.specification} -> ${this.return.specification}`;
  }

  /**
   * Returns whether this function type matches the specified function type.
   * @param {!Type} type
   * @return {boolean}
   */
  matchInternal(type) {
    // Return false if the specified type is not a function.
    if (!type.function) return {match: false, mappings: []};

    // Try to match both the argument and return type, building up the mappings.
    const {match: argMatch, mappings: argMappings} =
        this.arguments.match(type.arguments);
    if (!argMatch) return {match: false, mappings: []};
    const {match: returnMatch, mappings: returnMappings} =
        this.return.match(type.return);
    if (!returnMatch) return {match: false, mappings: []};

    // If both argument and return type match, validate and condense the
    // mappings.
    return condenseAndValidate(argMappings.concat(returnMappings));
  }

  applyMappings(mappings) {
    return Type.function(
      this.arguments.applyMappings(mappings),
      this.return.applyMappings(mappings),
    );
  }

  getReturnTypeForArgs(args) {
    const {match, mappings} = this.arguments.match(args);
    if (match) return this.return.applyMappings(mappings);
    return null;
  }
}

/**
 * SpreadType is a type that matches an `And` type with zero or more occurrences
 * of the specified type.
 */
export class SpreadType extends Type {
  constructor(type) {
    // Construct a specification of the form `...type`.
    super(`...${type.specification}`);
    /**
     * The type to spread over.
     * @type {!Type}
     */
    this.type = type;
    this.spread = true;
  }

  /**
   * Returns whether this type matches the specified type, that is, when spread
   * to the number of arguments of the type, contains an exact ordered duplicate
   * of the specified type's subtypes.
   * @param {!Type} type
   * @return {boolean}
   */
  matchInternal(type) {
    // Return false if the specified type does not have subtypes.
    if (!type.and) return {match: false, mappings: []};
    /**
     * Store the cumulative set of mappings that must result to satisfy this
     * `spread` type.
     */
    const overallMappings = [];
    for (const subtype of type.types) {
      // If any of this type's subtypes does not match the specified type's
      // subtypes at each index, return false.
      const {match, mappings} = this.type.match(subtype);
      if (!match) return {match: false, mappings: []};
      for (const mapping of mappings) overallMappings.push(mapping);
    }
    return condenseAndValidate(overallMappings);
  }

  applyMappings(mappings) {
    return Type.spread(this.type.applyMappings(mappings));
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
          if (matcher.match(type).match) noMatches = false;
        }
        if (noMatches) typePool.push(type);
      }
      // The resulting type for the array is the `or` of every type built up in
      // the typePool (if only one type fits the bill, Type.or will return just
      // that type).
      type = Type.or(...typePool);
    }
    // Construct a specification of the form `[type]`.
    this.specification = `[${type.specification}]`;
    /**
     * The underlying type for the array.
     * @param {?Type}
     */
    this.subtype = type;
    this.array = true;
  }

  /**
   * Returns whether this array type matches the specified array type.
   * @param {!Type} type
   * @return {boolean}
   */
  matchInternal(type) {
    // Return false if the specified type is not an array type.
    if (!type.array) return {match: false, mappings: []};
    return this.subtype.match(type.subtype);
  }

  applyMappings(mappings) {
    return Type.array(this.subtype.applyMappings(mappings));
  }
}

/**
 * A modular type that can be act like any type, but must be applied
 * consistently within any one type expression.
 */
export class PolymorphicType extends Type {
  constructor(name) {
    super(name);
    this.polymorphic = true;
  }

  matchInternal(type) {
    // No mappings are required if matching against this same type.
    if (this == type) return {match: true, mappings: []};
    // Match always returns true, with a mapping from this type to the specified
    // type.
    return {match: true, mappings: [{from: this, to: type}]};
  }

  /**
   * Returns the corresponding type this one maps to in the specified mappings,
   * or this type if no such type is found.
   * @param {!Array<{from: !Type, to: !Type}} mappings
   * @return {!Type}
   */
  applyMappings(mappings) {
    for (const {from, to} of mappings) {
      const {match, mappings} = this.match(from);
      if (match && mappings.length == 0) return to;
    }
    return this;
  }
}

/**
 * TypeIndex is a map that stores type keys and arbitrary values. Retrieving a
 * value by key is not a simple look-up operation; rather, types are attempted
 * to be matched from the keys until one is found. The native type-matching
 * method is used so that complex types match correctly.
 * TODO: Implement a more efficient matching algorithm.
 */
export class TypeIndex {
  constructor() {
    /**
     * The primary map that stores key/value pairs.
     * @type {!Array<{key: !Type, value: *}>}
     */
    this.typeMap = [];
  }

  /**
   * Sets a value for the specified type in the map.
   * @param {!Type} type The type for which to set a value.
   * @param {*} value The value to set at the specified type.
   */
  set(type, value) {
    this.typeMap.push({
      key: type,
      value: value,
    });
  }

  /**
   * Sets the value as a type for the specified type in the map, but if the type
   * already exists in the map, then does the following:
   *   - if the type does not already exist in the map, applies the normal set
   *     function and returns true.
   *   - if the type already exists in the map, sets its value to its previous
   *     value's intersection with the specified value.
   *   - if the intersection is empty, returns false; otherwise, returns true.
   * @param {!Type} type The type for which to set a value.
   * @param {!Type} value The value to set for the specified type.
   * @return {boolean} Whether at least one of the conditions match.
   */
  setCompete(type, value) {
    // Iterate through the typeMap by index, so that the value can be modified
    // if necessary.
    for (let i = 0; i < this.typeMap.length; i++) {
      const {key, value: other} = this.typeMap[i];
      const {match, mappings} = key.match(type);
      if (match && mappings.length == 0) {
        // If the types match, set the value that exists at this type to its
        // intersection with the specified value and return true.
        const intersection = Type.intersect(value, other);
        if (intersection != null) {
          this.typeMap[i].value = intersection;
          return true;
        }
        // If no such intersection can work, return false.
        return false;
      }
    }
    // Set the type, as it does not already exist in the map.
    this.set(type, value);
    return true;
  }

  /**
   * Returns whether the specified type matches a key in the map as a match
   * result.
   * @param {!Type} type The type to check for membership.
   * @return {!matchResult} If the type is in the map and the mappings required
   *     to ensure the type is in the map.
   */
  has(type) {
    for (const {key, value} of this.typeMap) {
      const {match, mappings} = key.match(type);
      if (match) return {match, mappings};
    }
    return {match: false, mappings: []};
  }

  /**
   * Retrieves the first matching value set at the specified type.
   * @param {!Type} type The type for which to retrieve the value.
   * @return {{value: *, mappings: !Array<from: !Type, to: !Type}}
   *
   *     value: The value set at the specified type, or null if the type was not
   *            found.
   *     mappings: The mappings that needed to be set to ensure a match. [] if
   *               the type was not found.
   */
  get(type) {
    for (const {key, value} of this.typeMap) {
      const {match, mappings} = key.match(type);
      if (match) return {value, mappings};
    }
    return {value: null, mappings: []};
  }

  /**
   * Executes the specified value for each key/value pair in the map, in
   * insertion order.
   * @param {!Function(*, !Type)} lambda A function that takes a value and key
   *     and does something with them.
   */
  forEach(lambda) {
    for (const {key, value} of this.typeMap) lambda(value, key);
  }
}
