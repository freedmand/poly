const VARIABLE_NOT_FOUND_ERROR = 'Variable not found in scope';
// How much to indent nested scopes in the toString function.
const INDENT_LEVEL = 2;

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

  /**
   * Returns the current scope expressed as a string. Each entry has the form:
   *
   * {
   *   a = 2
   *   b = '3'
   * }
   *
   * If there is a parent scope, the entries are formatted as follows:
   *
   * {
   *   parentScopeVar = 2
   *   {
   *     childScopeVar = '2'
   *   }
   * }
   *
   * Scopes can be nested to arbitrary depth. The order of the keys reflects the
   * order the variables were initialized.
   * @return {string}
   */
  toString() {
    const stack = [this];
    let currentScope = this;
    // Construct a stack to manage returning a string with parent scopes listed
    // out first.
    while (currentScope.parent) {
      stack.push(currentScope.parent);
      currentScope = currentScope.parent;
    }
    let result = '';
    let spaces = 0;
    while (stack.length > 0) {
      // Pop each scope from the stack, printing an opening brace and the
      // contents of the scope's table.
      currentScope = stack.pop();
      result += `${' '.repeat(spaces)}{\n`;
      spaces += INDENT_LEVEL;
      currentScope.table.forEach((value, variable) => {
        // Extract the representation of the value if it is an object with a
        // toString() method.
        const valueRep = (typeof(value) == 'object' && 'toString' in value) ?
            value.toString() : value;
        result += `${' '.repeat(spaces)}${variable} = ${valueRep}\n`;
      });
    }
    while (spaces) {
      // Close the brace at each level.
      spaces -= INDENT_LEVEL;
      result += `${' '.repeat(spaces)}}`;
      if (spaces != 0) result += '\n';
    }
    return result;
  }
}