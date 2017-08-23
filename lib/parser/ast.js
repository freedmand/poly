export class Ast {
  constructor() {
    this.params = [];
    this.debug = null;
  }
  toString() {
    let params;
    if (this.debug != null) {
      params = this.debug.map(
          (debug) => `${debug[0]}:${debug[1]}`);
    } else {
      params = this.params.map((param) => `${param}`);
    }
    return `${this.constructor.name}(${params.join(',')})`;
  }
}

export class Add extends Ast {
  constructor(param1, param2) {
    super();
    this.params = [param1, param2];
  }
}

export class ForIn extends Ast {
  constructor(variable, rangeExpression, statements) {
    super();
    this.params = [variable, rangeExpression, statements];
    this.debug = [
      ['variable', variable],
      ['rangeExpression', rangeExpression],
      ['statements', statements],
    ]
  }
}

export class Range extends Ast {
  constructor(expression) {
    super();
    this.params = [expression];
  }
}

export class Constant extends Ast {
  constructor(constant) {
    super();
    this.params = [constant];
  }
}
