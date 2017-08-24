/**
 * The base Abstract Syntax Tree class. Stores a number of parameters, which can
 * optionally take names to make debugging simpler. The name of the AST class
 * is inferred from the class name.
 */
export class Ast {
  /**
   * Constructs an Ast with optional children.
   * @param {...(!Ast|number|string)} params Child Ast or literal nodes.
   */
  constructor(...params) {
    /** @type {!Array<!Ast>} */
    this.params = params;
    /** @type {?Array<string>} */
    this.debug = null;
    /** @type {string} */
    this.name = this.constructor.name;
  }

  /**
   * Returns a string representation of the Ast. If debug parameters are set,
   * they are displayed as names.
   */
  toString() {
    let params;
    if (this.debug != null) {
      // Return a string in the format: Name(name1:param1,...,nameN:paramN)
      params = this.debug.map(
          (debug) => `${debug[0]}:${debug[1]}`);
    } else {
      // Return a string in the format: Name(param1,...,paramN)
      params = this.params.map((param) => `${param}`);
    }
    return `${this.name}(${params.join(',')})`;
  }
}

// Arithmetic operators.
export class Add extends Ast {}
export class Sub extends Ast {}
export class Mul extends Ast {}
export class Div extends Ast {}
export class Pow extends Ast {}
export class UnaryMinus extends Ast {}

// Range.
export class Range extends Ast {}

// Groupings.
export class Group extends Ast {}

// A simple literal.
export class Literal extends Ast {}

// TODO
// export class ForIn extends Ast {
//   constructor(variable, rangeExpression, statements) {
//     super();
//     this.params = [variable, rangeExpression, statements];
//     this.debug = [
//       ['variable', variable],
//       ['rangeExpression', rangeExpression],
//       ['statements', statements],
//     ]
//   }
// }

// export class Range extends Ast {
//   constructor(expression) {
//     super();
//     this.params = [expression];
//   }
// }

// export class Constant extends Ast {
//   constructor(constant) {
//     super();
//     this.params = [constant];
//   }
// }
