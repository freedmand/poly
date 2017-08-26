import * as t from '../testing/tests.js';
import {Interpreter} from './interpreter.js';
import {Parser} from '../parser/parser.js';
import * as ast from '../spec/ast.js';
import {PolyOpTable} from '../spec/operators.js';
import {PolyTokenizer} from '../spec/tokens.js';

const opTable = new PolyOpTable();
const interpreter = new Interpreter();

/**
 * Tokenizes, parses, and interprets the specified text, returning the result in
 * string format.
 * @param {string} text The text to interpret.
 * @return {string} The evaluation output.
 */
function interpret(text) {
  const tokenizer = new PolyTokenizer(text);
  const parser = new Parser(tokenizer, opTable);
  const expression = parser.parse();
  const result = interpreter.interpret(expression);
  return result.toString();
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

  floatAdd() {
    t.assertEquals(interpret('0.2 + 0.3'), 'Float(0.5)');    
  },

  stringAdd() {
    t.assertEquals(interpret(`'ab'+'c'`), 'String(abc)');  
  },

  stringReverse() {
    t.assertEquals(interpret(`-'abcdefg'`), 'String(gfedcba)')
  }
});