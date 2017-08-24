import * as t from '../testing/tests.js';
import {Parser} from './parser.js';
import {OperatorTable} from './operator_table.js';
import * as ast from './ast.js';
import {Tokenizer} from '../tokenizer/tokenizer.js';

const operatorTable = new OperatorTable();

/**
 * Asserts the two syntax trees are the same by comparing their string
 * representations.
 * @param {!ast.Ast} ast1 
 * @param {!ast.Ast} ast2 
 */
function astEquals(ast1, ast2) {
  t.assertEquals(ast1.toString(), ast2.toString());
}

t.runTests('Parser', {
  math() {
    const tokenizer = new Tokenizer('2 + 3 * 4');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Add(
      new ast.Literal(2),
      new ast.Mul(
        new ast.Literal(3),
        new ast.Literal(4),
      ),
    ));
  },

  unaryMinus() {
    const tokenizer = new Tokenizer('-2 + 91');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Add(
      new ast.UnaryMinus(new ast.Literal(2)),
      new ast.Literal(91),
    ));
  },

  multiplicationLeftAssociativity() {
    const tokenizer = new Tokenizer('2*2*3');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Mul(
      new ast.Mul(
        new ast.Literal(2),
        new ast.Literal(2),
      ),
      new ast.Literal(3),
    ));
  },

  multiplicationLeftAssociativityLong() {
    const tokenizer = new Tokenizer('2*2*3*4');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Mul(
      new ast.Mul(
        new ast.Mul(
          new ast.Literal(2),
          new ast.Literal(2),
        ),
        new ast.Literal(3),
      ),
      new ast.Literal(4),
    ));
  },

  exponentiationRightAssociativity() {
    const tokenizer = new Tokenizer('2**2**3');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Pow(
      new ast.Literal(2),
      new ast.Pow(
        new ast.Literal(2),
        new ast.Literal(3),
      ),
    ));
  },

  exponentiationRightAssociativityLong() {
    const tokenizer = new Tokenizer('2**2**3**4');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Pow(
      new ast.Literal(2),
      new ast.Pow(
        new ast.Literal(2),
        new ast.Pow(
          new ast.Literal(3),
          new ast.Literal(4),          
        ),
      ),
    ));
  },

  parentheses() {
    const tokenizer = new Tokenizer('(1 + 2) * 3');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Mul(
      new ast.Group(
        new ast.Add(
          new ast.Literal(1),
          new ast.Literal(2),
        )
      ),
      new ast.Literal(3),      
    ));
  },

  unaryRange() {
    const tokenizer = new Tokenizer('..10');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Range(
      new ast.Literal(10),   
    ));
  },

  binaryRange() {
    const tokenizer = new Tokenizer('-2..-10+3');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Range(
      new ast.UnaryMinus(new ast.Literal(2)),
      new ast.Add(
        new ast.UnaryMinus(new ast.Literal(10)),
        new ast.Literal(3),
      )
    ));
  },

  assignVariable() {
    const tokenizer = new Tokenizer('a = 3 + 2');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Assign(
      new ast.Variable('a'),
      new ast.Add(
        new ast.Literal(3),
        new ast.Literal(2),
      )
    ));
  },

  // TODO
  //
  // forIn() {
  //   const tokenizer = new Tokenizer('for i in ..10 {}');
  //   const parser = new Parser(tokenizer.stream(), operatorTable);
  //   astEquals(parser.parse(), new ast.ForIn(
  //     new ast.Variable('i'),
  //     new ast.Expression(
  //       new ast.Range(new ast.Literal(10)),
  //     ),
  //     [],
  //   ));
  // },
});