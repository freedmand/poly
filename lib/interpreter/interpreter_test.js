import * as t from '../testing/tests.js';
import {Interpreter} from './interpreter.js';
import {Parser} from '../parser/parser.js';
import * as ast from '../spec/ast.js';
import {Ast} from '../parser/ast.js';
import {PolyOpTable} from '../spec/operators.js';
import {PolyTokenizer} from '../spec/tokens.js';
import {SignatureError} from '../error/signature_error.js';

const opTable = new PolyOpTable();

/**
 * Tokenizes, parses, and interprets the specified text using the specified
 * parser function.
 * @param {string} text The text to interpret.
 * @param {!Function(!Parser) : !Ast} parserFn A function that takes a parser
 *     and returns a syntax tree.
 * @return {string} The evaluation output as a string.
 */
function interpretHelper(text, parserFn) {
  try {
    const tokenizer = new PolyTokenizer(text);
    const parser = new Parser(tokenizer, opTable);
    const syntaxTree = parserFn(parser);
    const interpreter = new Interpreter();
    const result = interpreter.interpret(syntaxTree);
    if (result.value) return result.value.toString();
    return result.state.scope.toString();
  } catch (e) {
    // Populate a SignatureError with the full text for easier debugging.
    if (e instanceof SignatureError) {
      e.fullText = text;
      throw e;
    } else {
      throw e;
    }
  }
}

/**
 * Tokenizes, parses, and interprets the specified text as an expression,
 * returning the result in string format.
 * @param {string} text The text to interpret.
 * @return {string} The evaluation output as a string.
 */
function interpretExpression(text) {
  return interpretHelper(text, (parser) => parser.expression());
}

/**
 * Tokenizes, parses, and interprets the specified text as a program (list of
 * statements), returning the result in string format.
 * @param {string} text The text to interpret.
 * @return {string} The evaluation output as a string.
 */
function interpret(text) {
  return interpretHelper(text, (parser) => parser.parse());
}

t.runTests('Interpreter', {
  rawIntAdd() {
    const a = new ast.IntLiteral(2);
    const b = new ast.IntLiteral(3);
    const c = new ast.Add(a, b);
    const result = new Interpreter().interpret(c);
    t.assertEquals(result.value.toString(), 'Int(5)');
  },

  rawIntDiv() {
    const a = new ast.IntLiteral(7);
    const b = new ast.IntLiteral(2);
    const c = new ast.Div(a, b);
    const result = new Interpreter().interpret(c);
    t.assertEquals(result.value.toString(), 'Int(3)');
  },

  intAdd() {
    t.assertEquals(interpretExpression('2 + 3'), 'Int(5)');
  },

  simpleParentheses() {
    t.assertEquals(interpretExpression('2 + (3 + 4)'), 'Int(9)');
  },

  floatAdd() {
    t.assertEquals(interpretExpression('0.2 + 0.3'), 'Float(0.5)');
  },

  stringAdd() {
    t.assertEquals(interpretExpression(`'ab'+'c'`), 'String(abc)');
  },

  stringMul() {
    t.assertEquals(interpretExpression(`'ab' * 3`), 'String(ababab)');
  },

  stringMulNeg() {
    t.assertEquals(interpretExpression(`'ab' * -3`), 'String(bababa)');
  },

  stringMulZero() {
    t.assertEquals(interpretExpression(`'ab' * 0`), 'String()');
  },

  stringReverse() {
    t.assertEquals(interpretExpression(`-'abcdefg'`), 'String(gfedcba)')
  },

  arraySimple() {
    t.assertEquals(interpretExpression('[1, 2, 3]'),
        '[Int](Int(1),Int(2),Int(3))');
  },

  arrayEmpty() {
    t.assertEquals(interpretExpression('[]'),
        `[A']()`);
  },

  arrayMultipleTypesRaises() {
    t.assertRaises(() => interpretExpression(`[1, '2', 3.0]`));
  },

  array2d() {
    t.assertEquals(interpretExpression(`[[1, 2], [3, 4], [5, 6]]`),
        '[[Int]]' +
        '([Int](Int(1),Int(2)),[Int](Int(3),Int(4)),[Int](Int(5),Int(6)))');
  },

  array2dDifferentDimensions() {
    t.assertEquals(interpretExpression(`[[1, 2], [3, 4, 5]]`),
    '[[Int]]([Int](Int(1),Int(2)),[Int](Int(3),Int(4),Int(5)))');
  },

  array2dDifferentTypesRaises() {
    t.assertRaises(() => interpretExpression(`[[1, 2], ['3', '4']]`));
  },

  arrayAdd() {
    t.assertEquals(interpretExpression('[1, 2] + [3, 4]'),
        '[Int](Int(1),Int(2),Int(3),Int(4))');
  },

  assignSimple() {
    t.assertEquals(interpret('a := 2'), `{
  a = Int(2)
}`);
  },

  assignSimpleString() {
    t.assertEquals(interpret(`a := '2'`), `{
  a = String(2)
}`);
  },

  assignExpression() {
    t.assertEquals(interpretExpression('3 + (a := 2)'), 'Int(5)');
  },

  assignMultiple() {
    t.assertEquals(interpret(`a := 2
b := 3`), `{
  a = Int(2)
  b = Int(3)
}`);
  },

  assignAndAdd() {
    t.assertEquals(interpret(`a := 2
b := a + 3`), `{
  a = Int(2)
  b = Int(5)
}`);
  },

  assignNestedScopes() {
    // The nested a = 3 assignment does not get reflected in the program scope.
    t.assertEquals(interpret(`a := 2
{
  a := 3
}`), `{
  a = Int(2)
}`);
  },

  setNestedScopes() {
    // The nested a = 3 reassignment does get reflected in the program scope.
    t.assertEquals(interpret(`a := 2
{
  a = 3
}`), `{
  a = Int(3)
}`);
  },
});
