import * as ast from '../spec/ast.js';

class TypeValue {
  constructor(value) {
    this.value = value;
    this.type = this.constructor.name;
  }

  toString() {
    return `${this.type}(${this.value})`;
  }
}

export class Int extends TypeValue {
  constructor(value) {
    super(value | 0);
  }

  static add(value1, value2) {
    return new Int(value1.value + value2.value);
  }

  static sub(value1, value2) {
    return new Int(value1.value - value2.value);
  }

  static mul(value1, value2) {
    return new Int(value1.value * value2.value);
  }

  static div(value1, value2) {
    return new Int(value1.value / value2.value);
  }
}

export class Interpreter {
  constructor() {

  }

  interpret(tree) {
    if (tree instanceof ast.IntLiteral) {
      return this.evaluateLiteral(tree);
    } else if (tree instanceof ast.Add) {
      const param1 = this.interpret(tree.params[0]);
      const param2 = this.interpret(tree.params[1]);
      if (param1 instanceof Int && param2 instanceof Int) {
        return Int.add(param1, param2);
      } else {
        throw new Error('Not implemented');
      }
    } else {
      throw new Error('Not implemented');      
    }
  }

  /**
   * 
   * @param {!ast.Literal} literal 
   */
  evaluateLiteral(literal) {
    const value = literal.params[0];
    // TODO: Handle literal types
    return new Int(parseInt(value));
  }
}