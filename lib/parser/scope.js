const VARIABLE_NOT_FOUND_ERROR = 'Variable not found in scope';

/**
 * Scope is a class for storing variables with values in nested contexts,
 * replicating the common behavior found in programming languages. A scope can
 * be initialized with or without a parent context. In the former case, the
 * scope inherits variable definitions from its parent, but can still overwrite
 * them in its own context without tampering with the parent context. In the
 * latter case, the scope is a base and acts like a simple key-value store.
 */
export class Scope {
  /**
   * Constructs a new scope object, optionally with a parent context.
   * @param {?Scope} parent The parent scope this scope is initialized with.
   *     If null, the scope is a base.
   */
  constructor(parent = null) {
    /** @type {?Scope} */
    this.parent = parent;
    /**
     * Stores variable names and their values.
     * @type {!Map<string, *>}
     */
    this.table = new Map();
  }

  /**
   * Sets the variable name to the specified value in this scope.
   * @param {string} variable The name of the variable to set.
   * @param {*} value The value to set for that variable.
   */
  set(variable, value) {
    this.table.set(variable, value);
  }

  /**
   * Unsets, or deletes, the variable name in the current scope.
   * @param {string} variable The name of the variable to unset.
   */
  unset(variable) {
    this.table.delete(variable);
  }

  /**
   * Returns whether the specified variable name is defined in this scope or
   * any parent scopes.
   * @param {string} variable The name of the variable.
   * @return {boolean} Whether the value is set in this scope or any parent
   *     scopes.
   */
  has(variable) {
    if (this.table.has(variable)) return true;
    if (this.parent) return this.parent.has(variable);
    return false;
  }

  /**
   * Returns the value of the variable in this scope or the nearest parent
   * scope, throwing an error if the variable is undefined.
   * @param {string} variable The name of the variable.
   * @return {*} The value set in the closest scope for this variable name.
   * @throws {Error} The variable is not found in this scope or any parent
   *     scopes.
   */
  get(variable) {
    if (this.table.has(variable)) return this.table.get(variable);
    if (this.parent) return this.parent.get(variable);
    throw new Error(VARIABLE_NOT_FOUND_ERROR);
  }

  /**
   * Returns the parent scope, or null if no parent scope is defined.
   * @return {?Scope} The parent scope, or null if no parent scope is defined.
   */
  pop() {
    return this.parent;
  }
}