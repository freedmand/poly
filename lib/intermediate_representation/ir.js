import {Scope} from '../parser/scope.js';
import {Type} from '../type/type.js';
import * as string from '../string/string.js';

/**
 * Intermediate representation names.
 */
const LITERAL = 'LITERAL';
const VARIABLE = 'VARIABLE';
const ASSIGN = 'ASSIGN';
const STATEMENTS = 'STATEMENTS';

/**
 * IR, short for "Intermediate Representation", stores a completely typed
 * representation of a Poly program with variables represented as globally
 * scoped register allocations. If type is a function type, the node is a
 * function; otherwise, the node is a literal or variable with fixed type.
 */
export class IR {
  /**
   *
   * @param {string} name The name of the IR operator.
   * @param {!Type} type The function type or regular type of the IR operator.
   * @param {*} children An array of children or a single type describing a
   *     literal or variable register.
   * @param {?Ast} ast The Ast node from which this operator originates (can be
   *     used to retrace what source code caused this node).
   */
  constructor(name, type, children, ast = null) {
    /**
     * @type {string}
     */
    this.name = name;
    /**
     * @type {!Type}
     */
    this.type = type;
    /**
     * @type {*}
     */
    this.children = children;
    /**
     * @type {?Ast}
     */
    this.ast = ast;
  }

  /**
   * Retrieves the return type of this IR node. If the internal type is a
   * function, retrieves its return type; otherwise, just returns the literal
   * type.
   * @return {!Type}
   */
  getReturnType() {
    if (this.type.function) return this.type.return;
    return this.type;
  }

  /**
   * Returns the string representation of this IR node.
   */
  toString() {
    /**
     * Generates an array representing the string form of this IR node, with
     * indents (see string.toStringWithIndents).
     * @param {!IR} ir
     * @return {!Iterator<string|string.INDENT|string.UNINDENT>}
     */
    const toStringPieces = function*(ir) {
      const type = ir.type == null ? '' : `(${ir.type.specification})`;
      yield `${ir.name}${type}`;
      if (ir.children != null) {
        yield new string.INDENT();
        if (Array.isArray(ir.children)) {
          for (const child of ir.children) {
            if (child instanceof IR) {
              const pieces = toStringPieces(child);
              for (const piece of pieces) yield piece;
            } else {
              yield `${child}`;
            }
          }
        } else {
          yield `${ir.children}`;
        }
        yield new string.UNINDENT();
      }
    };

    // Return the entire string representation from its constitutient parts.
    return string.toStringWithIndents(Array.from(toStringPieces(this)));
  }
}

/**
 * Returns a fresh scope with basic types defined.
 * TODO: Move to lib/spec.
 * @return {!Scope}
 */
function getFreshScope() {
  const scope = new Scope();

  // Initialize basic types.
  scope.initialize('Int', {
    reserved: true,
    constant: false,
    type: true,
    value: new Type('Int'),
  });
  // Return a new scope with this base scope as child (so that its variables are
  // isolated).
  return new Scope(scope);
}

/**
 * IntermediateTranslator translates a syntax tree into an intermediate
 * representation.
 */
export class IntermediateTranslator {
  constructor() {}

  /**
   * Translates the Ast operator and returns the result.
   * @param {!Ast} op The Ast operator
   * @param {!Scope} scope The current scope of the translator, or null to use a
   *     fresh scope.
   * @return {{scope: !Scope, node: !IR}} The intermediate representation of the
   *     program and the resulting scope that stores the variables and types.
   */
  translate(op, scope) {
    // Initialize a new scope if none is defined.
    if (scope == null) scope = getFreshScope();
    // Determine the type of operator and call the respective translation
    // function.
    if (op.statements) {
      return this.translateStatements(op, scope);
    } else if (op.group) {
      return this.translateGroup(op, scope);
    } else if (op.literal) {
      return this.translateLiteral(op, scope);
    } else if (op.variable) {
      return this.translateVariable(op, scope);
    } else if (op.assign) {
      if (op.reassign) {
        return this.translateReassign(op, scope);
      } else {
        return this.translateAssign(op, scope);
      }
    } else {
      return this.translateFunction(op, scope);
    }
  }

  /**
   * Translates the Ast statements operator and returns the result.
   * @param {!Ast} op The Ast statements operator.
   * @param {!Scope} scope The current scope of the translator.
   * @return {{scope: !Scope, node: !IR}} The intermediate representation of the
   *     statements and the resulting scope.
   */
  translateStatements(op, scope) {
    // Compile each statement sequentially, preserving scope.
    const results = [];
    for (const statement of op.params) {
      results.push(this.translate(statement, scope).node);
    }
    const node = new IR(STATEMENTS, null, results, op);
    return {scope, node};
  }

  /**
   * Translates the Ast group operator and returns the result.
   * @param {!Ast} op The Ast group operator.
   * @param {!Scope} scope The current scope of the translator.
   * @return {{scope: !Scope, node: !IR}} The intermediate representation of the
   *     group and the resulting scope.
   */
  translateGroup(op, scope) {
    // Evaluate the expression inside the group.
    if (op.block) {
      // Evaluate with a new scope if the group is a block.
      return {scope, node: this.translate(...op.params, new Scope(scope)).node};
    } else {
      return this.translate(...op.params, scope);
    }
  }

  /**
   * Translates the Ast literal operator and returns the result.
   * @param {!Ast} op The Ast literal operator.
   * @param {!Scope} scope The current scope of the translator.
   * @return {{scope: !Scope, node: !IR}} The intermediate representation of the
   *     literal and the resulting scope.
   * @throws {Error} The literal does not have a defined type.
   */
  translateLiteral(op, scope) {
    if (op.type == null) {
      throw new Error('Literal must have type defined');
    }
    const type = scope.getType(op.type);
    const node = new IR(LITERAL, type, op.get('value'), op);
    return {scope, node};
  }

  /**
   * Translates the Ast variable operator and returns the result.
   * @param {!Ast} op The Ast variable operator.
   * @param {!Scope} scope The current scope of the translator.
   * @return {{scope: !Scope, node: !IR}} The intermediate representation of the
   *     variable and the resulting scope.
   */
  translateVariable(op, scope) {
    const name = op.get('name');
    const {value: type, counter} = scope.getTypeFull(name);
    const node = new IR(VARIABLE, type, counter, op);
    return {scope, node};
  }

  /**
   * Translates the Ast assign operator and returns the result.
   * @param {!Ast} op The Ast assign operator.
   * @param {!Scope} scope The current scope of the translator.
   * @return {{scope: !Scope, node: !IR}} The intermediate representation of the
   *     assignment and the resulting scope.
   */
  translateAssign(op, scope) {
    const variable = op.namedParams.get('variable').get('name');
    const value = op.namedParams.get('value');
    // Obtain the value IR node by translating it and retrieve its type.
    const valueNode = this.translate(value, scope).node;
    const type = valueNode.getReturnType();

    // Initialize a new variable in the scope with the proper type.
    const counter = scope.initialize(variable, {
      reserved: false,
      constant: false,
      type: true,
      value: type,
    });
    // Store only the register allocation for the variable.
    const node = new IR(ASSIGN, type, [counter, valueNode], op);
    return {scope, node};
  }

  /**
   * Translates the Ast reassign operator and returns the result.
   * @param {!Ast} op The Ast reassign operator.
   * @param {!Scope} scope The current scope of the translator.
   * @return {{scope: !Scope, node: !IR}} The intermediate representation of the
   *     reassignment and the resulting scope.
   * @throws {Error} The variable is being reassigned to something with a
   *     conflicting type.
   */
  translateReassign(op, scope) {
    const variable = op.namedParams.get('variable').get('name');
    // Retrieve the type and register allocation for the variable in the scope.
    const {value: expectedType, counter} = scope.getTypeFull(variable);

    // Assert that the type is not conflicting.
    const value = op.namedParams.get('value');
    const valueNode = this.translate(value, scope).node;
    const type = valueNode.getReturnType();
    if (!expectedType.match(type)) {
      throw new Error(`Type error: Was expecting ${expectedType}, got ${type}`);
    }
    // Store the new value for the variable.
    const node = new IR(ASSIGN, type, [counter, valueNode], op);
    return {scope, node};
  }

  /**
   * Translates the Ast function operator and returns the result.
   * @param {!Ast} op The Ast function operator.
   * @param {!Scope} scope The current scope of the translator.
   * @return {{scope: !Scope, node: !IR}} The intermediate representation of the
   *     function and the resulting scope.
   */
  translateFunction(op, scope) {
    // Translate all the children nodes of the function.
    const nodes = op.params.map((param) => this.translate(param, scope).node);
    // Extract the argument type from the nodes.
    const argType = Type.and(...nodes.map((node) => node.getReturnType()));
    // TODO: Get proper return type using tables.
    const returnType = nodes[0].getReturnType();
    // Populate a new function type and return the IR node.
    const type = Type.function(argType, returnType);
    const node = new IR(op.name, type, nodes, op);
    return {scope, node};
  }
}
