import * as t from '../testing/tests.js';
import {Int, Interpreter} from './interpreter.js';
import {Parser} from '../parser/parser.js';
import {PolyOpTable} from '../spec/operators.js';
import {Tokenizer} from '../tokenizer/tokenizer.js';

const opTable = new PolyOpTable();

t.runTests('Interpreter', {
  intAdd() {
    const a = new Int(2);
    const b = new Int(3);
    const c = Int.add(a, b);
    t.assertEquals(c.toString(), 'Int(5)');
  },

  intDiv() {
    const a = new Int(7);
    const b = new Int(2);
    const c = Int.div(a, b);
    t.assertEquals(c.toString(), 'Int(3)');
  },

  interpret() {
    const tokenizer = new Tokenizer('2 + 3');
    const parser = new Parser(tokenizer, opTable);
    const expression = parser.parse();
    const interpreter = new Interpreter();
    const result = interpreter.interpret(expression);
    t.assertEquals(result.toString(), 'Int(5)');
  },
});