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
     * @type {!Array<!Array<*>>}
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
   * Returns whether the specified type matches a key in the map.
   * @param {!Type} type The type to check for membership.
   * @return {boolean} If the type is in the map.
   */
  has(type) {
    for (const {key, value} of this.typeMap) {
      if (key.match(type)) {
        // Unset types after matches.
        key.unset();
        return true;
      }
      // Unset types after they are attempted to be matched.
      key.unset();
    }
    return false;
  }

  /**
   * Retrieves the first matching value set at the specified type. The matching
   * value is not unset.
   * @param {!Type} type The type for which to retrieve the value.
   * @return {*} The value set at the specified type, or null if the type was
   *     not found.
   */
  get(type) {
    for (const {key, value} of this.typeMap) {
      if (key.match(type)) {
        return value;
      }
      // Unset types that are unsuccessfully matched.
      key.unset();
    }
    return null;
  }

  /**
   * Executes the specified value for each key/value pair in the ma, in
   * insertion order.
   * @param {!Function(*, !Type)} lambda A function that takes a value and key
   *     and does something with them.
   */
  forEach(lambda) {
    for (const {key, value} of this.typeMap) lambda(value, key);
  }
}
