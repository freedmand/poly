import * as string from '../string/string.js';

import {ArrayType, Type} from '../type/type.js';

import {OperatorTable} from '../parser/operator_table.js';
import {Scope} from '../parser/scope.js';
import {TypeMismatchError} from '../error/type_error.js';

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
 * IntermediateTranslator translates a syntax tree into an intermediate
 * representation.
 */
export class IntermediateTranslator {
  /**
   *
   * @param {!OperatorTable} operatorTable The operator table that defines the
   *     basic types and the type signatures of the operators.
   */
  constructor(operatorTable) {
    /** @type {!OperatorTable} */
    this.operatorTable = operatorTable;
  }

  /**
   * Translates the Ast operator and returns the result.
   * @param {!Ast} op The Ast operator
   * @param {!Scope} scope The current scope of the translator, or null to use a
   *     fresh scope.
   * @return {{scope: !Scope, node: !IR}} The intermediate representation of the
   *     program and the resulting scope that stores the variables and types.
   */
  translate(op, scope) {
    // Initialize a new scope based on the operator's base scope if none is
    // defined.
    if (scope == null) scope = new Scope(this.operatorTable.baseScope);
    // Determine the type of operator and call the respective translation
    // function.
    if (op.statements) {
      return this.translateStatements(op, scope);
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
    // Compile each statement sequentially, preserving scope. If the operator is
    // a block, use a child scope.
    if (op.block) scope = new Scope(scope);
    const results = [];
    for (const statement of op.params) {
      results.push(this.translate(statement, scope).node);
    }
    const node = new IR(STATEMENTS, null, results, op);
    return {scope, node};
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
    const node = new IR(LITERAL, op.type, op.get('value'), op);
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

    if (op.has('type')) {
      // If it is a typed assign, extract the expected type and ensure it
      // matches the expression type.
      const expectedTypeAst = op.get('type');
      // TODO: Parse complex types (i.e. tuple type).
      const expectedType =
          this.translateTypeLiteral(expectedTypeAst.params[0], scope);
      const {match} = expectedType.match(type);
      if (!match) throw new TypeMismatchError(type, expectedType);
    }

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
    const {match} = expectedType.match(type);
    if (!match) throw new TypeMismatchError(type, expectedType);
    // Store the new value for the variable.
    const node = new IR(ASSIGN, type, [counter, valueNode], op);
    return {scope, node};
  }

  /**
   * Translates the Ast type literal and returns the resulting type.
   * @param {!Ast} op The Ast type literal operator.
   * @param {!Scope} scope The current scope of the translator.
   */
  translateTypeLiteral(op, scope) {
    // Filter away any empty params.
    const params = op.params.filter((param) => !param.empty);
    if (op.array) {
      return Type.array(this.translateTypeLiteral(params[0], scope));
    } else if (op.tuple) {
      return Type.softTuple(
          ...params.map((param) => this.translateTypeLiteral(param, scope)));
    } else if (op.or) {
      return Type.or(
          ...params.map((param) => this.translateTypeLiteral(param, scope)));
    } else if (op.group) {
      return Type.group(this.translateTypeLiteral(params[0], scope));
    } else if (op.empty) {
      throw new Error(
          'Empty types should not be passed to translateTypeLiteral.');
    }
    return scope.getType(params[0]);
  }

  /**
   * Translates the Ast function operator and returns the result.
   * @param {!Ast} op The Ast function operator.
   * @param {!Scope} scope The current scope of the translator.
   * @return {{scope: !Scope, node: !IR}} The intermediate representation of the
   *     function and the resulting scope.
   */
  translateFunction(op, scope) {
    // Translate all the children nodes of the function, skipping empty
    // operators.
    const nodes = [];
    for (const param of op.params) {
      if (param.empty) continue;
      nodes.push(this.translate(param, scope).node);
    }
    // Extract the argument type from the nodes.
    const argType = Type.and(...nodes.map((node) => node.getReturnType()));
    const returnType = op.type.getReturnTypeForArgs(argType);
    if (returnType == null) {
      throw new Error(`No function matching op '${op.name}' ` +
          `for types ${argType.specification}`);
    }
    // Populate a new function type and return the IR node.
    const type = Type.function(argType, returnType);
    const node = new IR(op.name, type, nodes, op);
    return {scope, node};
  }
}
