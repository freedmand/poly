const VARIABLE_NOT_FOUND_ERROR = 'Variable not found';
const VARIABLE_ALREADY_DEFINED_ERROR = 'Variable already initialized';
const VARIABLE_RESERVED_ERROR = 'Variable is a reserved word';
const VARIABLE_CONSTANT_ERROR = 'Constant variable cannot be reassigned';

// How much to indent nested scopes in the toString function.
const INDENT_LEVEL = 2;

/**
 * A value in the scope table, which includes meta-information on the item, like
 * whether it is a reserve word, constant, type, etc.
 * @typedef {{reserved: boolean, constant: boolean, type: boolean, counter: ?number, value: *}}
 *
 *     reserved: Whether the item is a language-level reserved word (cannot be
 *               reassigned or reinitialized in any scope).
 *     constant: Whether the item is a constant that cannot be reassigned, but
 *               can be reinitialized in a deeper scope.
 *     type: Whether the item is a type. If this is false, the item is a
 *           variable.
 *     counter: The internal reference number of the variable, guaranteed to be
 *              unique along the scope chain.
 *     value: The value of the item.
 */
export let scopeItem;

/**
 * Returns a regular (non-constant, non-reserved word) variable scope item with
 * the given value.
 * @param {*} value The value to set for the scope item.
 * @return {!scopeItem} The resulting scope item.
 */
export function makeVar(value) {
  return {
    reserved: false,
    constant: false,
    type: false,
    value,
  };
}

/**
 * Returns a constant variable scope item with the given value.
 * @param {*} value The value to set for the scope item.
 * @return {!scopeItem} The resulting scope item.
 */
export function makeConst(value) {
  return {
    reserved: false,
    constant: true,
    type: false,
    value,
  };
}

/**
 * Returns a reserved variable scope item.
 * @return {!scopeItem} A fresh reserved variable scope item.
 */
export function makeReserved() {
  return {
    reserved: true,
    constant: false,
    type: false,
    value: null,
  };
}

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
     * @type {!Map<string, scopeItem>}
     */
    this.table = new Map();
    /**
     * Stores internal reference numbers so that each variable is unique.
     * @type {number}
     */
    this.counter = this.parent == null ? 1 : this.parent.counter;
  }

  /**
   * Intializes the variable name to the specified value in this scope.
   * @param {string} variable The name of the variable to initialize.
   * @param {!scopeItem} item The scope item to set for that variable.
   * @return {number} The counter number for the newly initialized variable.
   * @throws {Error} The variable is already initialized in this scope or is a
   *     reserved word.
   */
  initialize(variable, item) {
    if (this.table.has(variable)) {
      // Cannot initialize a variable that is defined in the same scope.
      throw new Error(VARIABLE_ALREADY_DEFINED_ERROR);
    }
    if (this.has(variable)) {
      // Check if the variable exists in the table as a reserved word.
      const {reserved} = this.get(variable);
      if (reserved) throw new Error(VARIABLE_RESERVED_ERROR);
    }
    item.counter = this.getCounter();
    this.incrementCounter();
    this.table.set(variable, item);
    return item.counter;
  }

  /**
   * Sets the variable name to the specified value in the closest scope that
   * contains the variable name.
   * @param {string} variable The name of the variable to set.
   * @param {*} value The value to set for that variable.
   * @throws {Error} The variable is not found in this scope or any parent
   *     scopes, the variable is a reserved word, or the variable is a constant
   *     defined in this scope.
   */
  set(variable, value) {
    if (this.table.has(variable)) {
      const {reserved, constant, type, counter} = this.table.get(variable);
      // Cannot set a reserved word.
      if (reserved) throw new Error(VARIABLE_RESERVED_ERROR);
      // Cannot set a constant in this scope.
      if (constant) throw new Error(VARIABLE_CONSTANT_ERROR);
      this.table.set(variable, {reserved, constant, type, counter, value});
      return;
    }
    if (this.parent) return this.parent.set(variable, value);
    throw new Error(VARIABLE_NOT_FOUND_ERROR);
  }

  /**
   * Uninitializes, or deletes, the variable name in the current scope.
   * @param {string} variable The name of the variable to uninitialize.
   * @return {boolean} Whether the variable was found in the current scope and
   *     removed.
   * @throws {Error} The variable is a reserved word or constant.
   */
  uninitialize(variable) {
    if (this.table.has(variable)) {
      const {reserved, constant} = this.table.get(variable);
      if (reserved) throw new Error(VARIABLE_RESERVED_ERROR);
      if (constant) throw new Error(VARIABLE_CONSTANT_ERROR);
      this.table.delete(variable);
      return true;
    }
    return false;
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
   * Returns the item for the variable in this scope or the nearest parent
   * scope, throwing an error if the variable is not defined.
   * @param {string} variable The name of the variable.
   * @return {!scopeItem} The item set in the closest scope for this variable
   *     name.
   * @throws {Error} The variable is not found in this scope or any parent
   *     scopes.
   */
  get(variable) {
    if (this.table.has(variable)) return this.table.get(variable);
    if (this.parent) return this.parent.get(variable);
    throw new Error(VARIABLE_NOT_FOUND_ERROR);
  }

  /**
   * Returns the item for the variable in this scope or the nearest parent
   * scope, ensuring the resulting item is not a type.
   * @param {string} variable The name of the variable.
   * @return {!scopeItem} The non-type item set in the closest scope for this
   *     variable name.
   * @throws {Error} The variable is not defined or the resulting item is a
   *     type.
   */
  getVariableFull(variable) {
    const result = this.get(variable);
    if (result.type) {
      throw new Error('Was expecting a variable');
    }
    return result;
  }

  /**
   * Returns the value for the variable in this scope or the nearest parent
   * scope, ensuring the resulting item is not a type.
   * @param {string} variable The name of the variable.
   * @return {*} The resulting value.
   * @throws {Error} The variable is not defined or the resulting item is a
   *     type.
   */
  getVariable(variable) {
    return this.getVariableFull(variable).value;
  }

  /**
   * Returns the item for the variable in this scope or the nearest parent
   * scope, ensuring the resulting item is a type.
   * @param {string} variable The name of the variable.
   * @return {!scopeItem} The type item set in the closest scope for this
   *     variable name.
   * @throws {Error} The variable is not defined or the resulting item is not a
   *     type.
   */
  getTypeFull(variable) {
    const result = this.get(variable);
    if (!result.type) {
      throw new Error('Was expecting a type.');
    }
    return result;
  }

  /**
   * Returns the value for the variable in this scope or the nearest parent
   * scope, ensuring the resulting item is a type.
   * @param {string} variable The name of the variable.
   * @return {*} The resulting value.
   * @throws {Error} The variable is not defined or the resulting item is not a
   *     type.
   */
  getType(variable) {
    return this.getTypeFull(variable).value;
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
      currentScope.table.forEach(({value}, variable) => {
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

  /**
   * Sets this counter to the current counter, defined as the counter value at
   * the deepest level of the parent chain.
   * @return {number} The current counter value.
   */
  getCounter() {
    if (this.parent) this.counter = this.parent.getCounter();
    return this.counter;
  }

  /**
   * Increments the internal counter for this scope and all of its parents.
   */
  incrementCounter() {
    this.counter++;
    if (this.parent) this.parent.incrementCounter();
  }
}
