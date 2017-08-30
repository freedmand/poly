import * as t from '../testing/tests.js';
import {Parser} from './parser.js';
import {PolyOpTable} from '../spec/operators.js';
import * as ast from '../spec/ast.js';
import {PolyTokenizer} from '../spec/tokens.js';

const operatorTable = new PolyOpTable();

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
    const tokenizer = new PolyTokenizer('2 + 3 * 4');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Add(
      new ast.IntLiteral(2),
      new ast.Mul(
        new ast.IntLiteral(3),
        new ast.IntLiteral(4),
      ),
    ));
  },

  unaryMinus() {
    const tokenizer = new PolyTokenizer('-2 + 91');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Add(
      new ast.UnaryMinus(new ast.IntLiteral(2)),
      new ast.IntLiteral(91),
    ));
  },

  multiplicationLeftAssociativity() {
    const tokenizer = new PolyTokenizer('2*2*3');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Mul(
      new ast.Mul(
        new ast.IntLiteral(2),
        new ast.IntLiteral(2),
      ),
      new ast.IntLiteral(3),
    ));
  },

  multiplicationLeftAssociativityLong() {
    const tokenizer = new PolyTokenizer('2*2*3*4');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Mul(
      new ast.Mul(
        new ast.Mul(
          new ast.IntLiteral(2),
          new ast.IntLiteral(2),
        ),
        new ast.IntLiteral(3),
      ),
      new ast.IntLiteral(4),
    ));
  },

  exponentiationRightAssociativity() {
    const tokenizer = new PolyTokenizer('2**2**3');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Pow(
      new ast.IntLiteral(2),
      new ast.Pow(
        new ast.IntLiteral(2),
        new ast.IntLiteral(3),
      ),
    ));
  },

  exponentiationRightAssociativityLong() {
    const tokenizer = new PolyTokenizer('2**2**3**4');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Pow(
      new ast.IntLiteral(2),
      new ast.Pow(
        new ast.IntLiteral(2),
        new ast.Pow(
          new ast.IntLiteral(3),
          new ast.IntLiteral(4),          
        ),
      ),
    ));
  },

  parentheses() {
    const tokenizer = new PolyTokenizer('(1 + 2) * 3');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Mul(
      new ast.Group(
        new ast.Add(
          new ast.IntLiteral(1),
          new ast.IntLiteral(2),
        )
      ),
      new ast.IntLiteral(3),      
    ));
  },

  unaryRange() {
    const tokenizer = new PolyTokenizer('..10');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Range(
      new ast.IntLiteral(10),   
    ));
  },

  binaryRange() {
    const tokenizer = new PolyTokenizer('-2..-10+3');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Range(
      new ast.UnaryMinus(new ast.IntLiteral(2)),
      new ast.Add(
        new ast.UnaryMinus(new ast.IntLiteral(10)),
        new ast.IntLiteral(3),
      )
    ));
  },

  assignVariable() {
    const tokenizer = new PolyTokenizer('a = 3 + 2');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Assign(
      new ast.Variable('a'),
      new ast.Add(
        new ast.IntLiteral(3),
        new ast.IntLiteral(2),
      )
    ));
  },

  string() {
    const tokenizer = new PolyTokenizer(`a = 'dog'`);
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Assign(
      new ast.Variable('a'),
      new ast.StringLiteral(`'dog'`),
    ));
  },

  block() {
    const tokenizer = new PolyTokenizer(`
{
  a = 'dog'
}`);
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Block(
      new ast.Assign(
        new ast.Variable('a'),
        new ast.StringLiteral(`'dog'`),
      ),
    ));
  },

  // TODO
  //
  // forIn() {
  //   const tokenizer = new PolyTokenizer('for i in ..10 {}');
  //   const parser = new Parser(tokenizer.stream(), operatorTable);
  //   astEquals(parser.parse(), new ast.ForIn(
  //     new ast.Variable('i'),
  //     new ast.Expression(
  //       new ast.Range(new ast.IntLiteral(10)),
  //     ),
  //     [],
  //   ));
  // },
});