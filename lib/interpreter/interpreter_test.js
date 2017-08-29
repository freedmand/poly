import * as t from '../testing/tests.js';
import {Interpreter} from './interpreter.js';
import {Parser} from '../parser/parser.js';
import * as ast from '../spec/ast.js';
import {PolyOpTable} from '../spec/operators.js';
import {PolyTokenizer} from '../spec/tokens.js';
import {SignatureError} from '../error/signature_error.js';

const opTable = new PolyOpTable();
const interpreter = new Interpreter();

/**
 * Tokenizes, parses, and interprets the specified text, returning the result in
 * string format.
 * @param {string} text The text to interpret.
 * @return {string} The evaluation output.
 */
function interpret(text) {
  try {
    const tokenizer = new PolyTokenizer(text);
    const parser = new Parser(tokenizer, opTable);
    const expression = parser.parse();
    const result = interpreter.interpret(expression);
    return result.toString();
  } catch (e) {
    if (e instanceof SignatureError) {
      e.fullText = text;
      throw e;
    }
  }
}

t.runTests('Interpreter', {
  rawIntAdd() {
    const a = new ast.IntLiteral(2);
    const b = new ast.IntLiteral(3);
    const c = new ast.Add(a, b);
    const result = interpreter.interpret(c);
    t.assertEquals(result.toString(), 'Int(5)');
  },

  rawIntDiv() {
    const a = new ast.IntLiteral(7);
    const b = new ast.IntLiteral(2);
    const c = new ast.Div(a, b);
    const result = interpreter.interpret(c);
    t.assertEquals(result.toString(), 'Int(3)');
  },

  intAdd() {
    t.assertEquals(interpret('2 + 3'), 'Int(5)');
  },

  simpleParentheses() {
    t.assertEquals(interpret('2 + (3 + 4)'), 'Int(9)');
  },

  floatAdd() {
    t.assertEquals(interpret('0.2 + 0.3'), 'Float(0.5)');    
  },

  stringAdd() {
    t.assertEquals(interpret(`'ab'+'c'`), 'String(abc)');  
  },

  stringMul() {
    t.assertEquals(interpret(`'ab' * 3`), 'String(ababab)');  
  },

  stringMulNeg() {
    t.assertEquals(interpret(`'ab' * -3`), 'String(bababa)');  
  },

  stringMulZero() {
    t.assertEquals(interpret(`'ab' * 0`), 'String()');  
  },

  stringReverse() {
    t.assertEquals(interpret(`-'abcdefg'`), 'String(gfedcba)')
  },

  fraction() {
    t.assertEquals(interpret('3 / 4'), 'Fraction(3/4)');
  },

  fractionAdd() {
    t.assertEquals(interpret('3/4 + 2/3'), 'Fraction(17/12)');
  },

  fractionDivMul() {
    t.assertEquals(interpret('1 / (2 * 3)'), 'Fraction(1/6)');
  },

  fractionMulDiv() {
    t.assertEquals(interpret('1 * (2 / 3)'), 'Fraction(2/3)');
  },

  fractionDiv() {
    t.assertEquals(interpret('2 / 3 / 4'), 'Fraction(1/6)');
  },

  fractionNegative() {
    t.assertEquals(interpret('-(-2 / -3)'), 'Fraction(-2/3)');
  },

  fractionDoubleNegative() {
    t.assertEquals(interpret('-2/-3'), 'Fraction(2/3)');
  },

  fractionReduces() {
    t.assertEquals(interpret('4/6'), 'Fraction(2/3)');
  },
});