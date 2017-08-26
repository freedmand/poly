import * as t from '../testing/tests.js';
import {Interpreter} from './interpreter.js';
import {Parser} from '../parser/parser.js';
import * as ast from '../spec/ast.js';
import {PolyOpTable} from '../spec/operators.js';
import {Tokenizer} from '../tokenizer/tokenizer.js';

const opTable = new PolyOpTable();

t.runTests('Interpreter', {
  intAdd() {
    const a = new ast.IntLiteral(2);
    const b = new ast.IntLiteral(3);
    const c = new ast.Add(a, b);
    const interpreter = new Interpreter();
    const result = interpreter.interpret(c);
    t.assertEquals(result.toString(), 'Int(5)');
  },

  intDiv() {
    const a = new ast.IntLiteral(7);
    const b = new ast.IntLiteral(2);
    const c = new ast.Div(a, b);
    const interpreter = new Interpreter();
    const result = interpreter.interpret(c);
    t.assertEquals(result.toString(), 'Int(3)');
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