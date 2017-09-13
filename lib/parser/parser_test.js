import * as t from '../testing/tests.js';
import {Parser} from './parser.js';
import {PolyOpTable} from '../spec/operators.js';
import {Ast} from './ast.js';
import * as ast from '../spec/ast.js';
import {PolyTokenizer} from '../spec/tokens.js';

const operatorTable = new PolyOpTable();

/**
 * Asserts the two syntax trees are the same by comparing their string
 * representations.
 * @param {!Ast} ast1
 * @param {!Ast} ast2
 */
function astEquals(ast1, ast2) {
  t.assertEquals(ast1.toString(), ast2.toString());
}

t.runTests('Parser', {
  math() {
    const tokenizer = new PolyTokenizer('2 + 3 * 4');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Add(
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
    astEquals(parser.expression(), new ast.Add(
      new ast.UnaryMinus(new ast.IntLiteral(2)),
      new ast.IntLiteral(91),
    ));
  },

  multiplicationLeftAssociativity() {
    const tokenizer = new PolyTokenizer('2*2*3');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Mul(
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
    astEquals(parser.expression(), new ast.Mul(
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
    astEquals(parser.expression(), new ast.Pow(
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
    astEquals(parser.expression(), new ast.Pow(
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
    astEquals(parser.expression(), new ast.Mul(
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
    astEquals(parser.expression(), new ast.Range(
      new ast.IntLiteral(10),
    ));
  },

  binaryRange() {
    const tokenizer = new PolyTokenizer('-2..-10+3');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Range(
      new ast.UnaryMinus(new ast.IntLiteral(2)),
      new ast.Add(
        new ast.UnaryMinus(new ast.IntLiteral(10)),
        new ast.IntLiteral(3),
      )
    ));
  },

  arraySimple() {
    const tokenizer = new PolyTokenizer('[1, 2, 3]');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Array(
      new ast.IntLiteral(1),
      new ast.IntLiteral(2),
      new ast.IntLiteral(3),
    ));
  },

  arraySingle() {
    const tokenizer = new PolyTokenizer('[1]');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Array(
      new ast.IntLiteral(1),
    ));
  },

  arrayNested() {
    const tokenizer = new PolyTokenizer('[[1, 2], [3, 4], [5, 6]]');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Array(
      new ast.Array(
        new ast.IntLiteral(1),
        new ast.IntLiteral(2),
      ),
      new ast.Array(
        new ast.IntLiteral(3),
        new ast.IntLiteral(4),
      ),
      new ast.Array(
        new ast.IntLiteral(5),
        new ast.IntLiteral(6),
      ),
    ));
  },

  arrayNestedMixed() {
    const tokenizer = new PolyTokenizer('[[1, [2, 3]], [4, 5], 6]');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Array(
      new ast.Array(
        new ast.IntLiteral(1),
        new ast.Array(
          new ast.IntLiteral(2),
          new ast.IntLiteral(3),
        ),
      ),
      new ast.Array(
        new ast.IntLiteral(4),
        new ast.IntLiteral(5),
      ),
      new ast.IntLiteral(6),
    ));
  },

  tupleSimple() {
    const tokenizer = new PolyTokenizer(`(1, '2', 3.0)`);
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Tuple(
      new ast.IntLiteral(1),
      new ast.StringLiteral(`'2'`),
      new ast.FloatLiteral('3.0'),
    ));
  },

  tupleSingle() {
    const tokenizer = new PolyTokenizer('(1,)');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Tuple(
      new ast.IntLiteral(1),
    ));
  },

  parenthesesSingle() {
    // A single-element paranethetical without a trailing comma does not
    // represent a tuple.
    const tokenizer = new PolyTokenizer('(1)');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Group(
      new ast.IntLiteral(1),
    ));
  },

  tupleNestedWithNewlinesArrays() {
    // Newlines do not break up tuples.
    const tokenizer = new PolyTokenizer(`(
  (1,),
  2,
  ('3', ([4.0, 5.0], 6)),
)`);
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Tuple(
      new ast.Tuple(
        new ast.IntLiteral(1),
      ),
      new ast.IntLiteral(2),
      new ast.Tuple(
        new ast.StringLiteral(`'3'`),
        new ast.Tuple(
          new ast.Array(
            new ast.FloatLiteral('4.0'),
            new ast.FloatLiteral('5.0'),
          ),
          new ast.IntLiteral(6),
        ),
      ),
    ));
  },

  assignVariableSimple() {
    const tokenizer = new PolyTokenizer('a := 2');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Assign(
      new ast.Variable('a'),
      new ast.IntLiteral(2),
    ));
  },

  setVariableSimple() {
    const tokenizer = new PolyTokenizer('a = 2');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Reassign(
      new ast.Variable('a'),
      new ast.IntLiteral(2),
    ));
  },

  assignVariable() {
    const tokenizer = new PolyTokenizer('a := 3 + 2');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Assign(
      new ast.Variable('a'),
      new ast.Add(
        new ast.IntLiteral(3),
        new ast.IntLiteral(2),
      )
    ));
  },

  assignString() {
    const tokenizer = new PolyTokenizer(`a := 'dog'`);
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Assign(
      new ast.Variable('a'),
      new ast.StringLiteral(`'dog'`),
    ));
  },

  statementsBlock() {
    const tokenizer = new PolyTokenizer(`
{
  a := 'dog'
}`);
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Statements(
      new ast.Block(
        new ast.Assign(
          new ast.Variable('a'),
          new ast.StringLiteral(`'dog'`),
        ),
      ),
    ));
  },

  statementsBeforeBlock() {
    const tokenizer = new PolyTokenizer(`
a := 1
{
  b := 2
  c := 3
}`);
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Statements(
      new ast.Assign(
        new ast.Variable('a'),
        new ast.IntLiteral('1'),
      ),
      new ast.Block(
        new ast.Assign(
          new ast.Variable('b'),
          new ast.IntLiteral(2),
        ),
        new ast.Assign(
          new ast.Variable('c'),
          new ast.IntLiteral(3),
        ),
      ),
    ));
  },

  statementsBeforeAfterBlock() {
    const tokenizer = new PolyTokenizer(`
a := 1
{
  b := 2
  c := 3
}
d := 4`);
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Statements(
      new ast.Assign(
        new ast.Variable('a'),
        new ast.IntLiteral('1'),
      ),
      new ast.Block(
        new ast.Assign(
          new ast.Variable('b'),
          new ast.IntLiteral(2),
        ),
        new ast.Assign(
          new ast.Variable('c'),
          new ast.IntLiteral(3),
        ),
      ),
      new ast.Assign(
        new ast.Variable('d'),
        new ast.IntLiteral('4'),
      ),
    ));
  },

  statementsAssignSimple() {
    const tokenizer = new PolyTokenizer('a := 2');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Statements(
      new ast.Assign(
        new ast.Variable('a'),
        new ast.IntLiteral(2),
      ),
    ));
  },

  statementsAssign() {
    const tokenizer = new PolyTokenizer(`a := 2
b := 3`);
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.parse(), new ast.Statements(
      new ast.Assign(
        new ast.Variable('a'),
        new ast.IntLiteral('2'),
      ),
      new ast.Assign(
        new ast.Variable('b'),
        new ast.IntLiteral('3'),
      ),
    ));
  },

  typeSimple() {
    const tokenizer = new PolyTokenizer('Int');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Type('Int'));
  },

  typeTuple() {
    const tokenizer = new PolyTokenizer('(Int, String)');
    const parser = new Parser(tokenizer, operatorTable);
    astEquals(parser.expression(), new ast.Tuple(
      new ast.Type('Int'),
      new ast.Type('String'),
    ));
  },

  // TODO
  //
  // forIn() {
  //   const tokenizer = new PolyTokenizer('for i in ..10 {}');
  //   const parser = new Parser(tokenizer.stream(), operatorTable);
  //   astEquals(parser.expression(), new ast.ForIn(
  //     new ast.Variable('i'),
  //     new ast.Expression(
  //       new ast.Range(new ast.IntLiteral(10)),
  //     ),
  //     [],
  //   ));
  // },
});
