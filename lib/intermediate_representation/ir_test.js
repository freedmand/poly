import * as t from '../testing/tests.js';
import * as ast from '../spec/ast.js';
import {Type} from '../type/type.js';
import {Scope} from '../parser/scope.js';
import {Parser} from '../parser/parser.js';
import {PolyTokenizer} from '../spec/tokens.js';
import {PolyOpTable} from '../spec/operators.js';
import {IR, IntermediateTranslator} from './ir.js';

const opTable = new PolyOpTable();
const translator = new IntermediateTranslator(opTable);

/**
 * Asserts the two given IR nodes are equal naively using their string
 * representation.
 * @param {!IR} ir1 The first IR node.
 * @param {!IR} ir2 The second IR node.
 * @throws {Error} The two nodes are not equal.
 */
function assertIREquals(ir1, ir2) {
  t.assertEquals(ir1.toString(), ir2.toString());
}

t.runTests('Intermediate Representation', {
  rawIntAdd() {
    const int = opTable.getType('Int');
    const a = new ast.IntLiteral(int, 2);
    const b = new ast.IntLiteral(int, 3);
    const c = new ast.Add(Type.function([int, int], int), a, b);
    assertIREquals(
      translator.translate(c).node,
      new IR('Add', Type.function([int, int], int), [
        new IR('LITERAL', int, '2'),
        new IR('LITERAL', int, '3'),
      ],
    ));
  },

  intAssignNestedScopeComplex() {
    const program = `
      a := 2 + 3
      b := 4 + 5
      {
        b := 5 + 6
        c := 6 + 7
        a = 1 + 1
      }
      c := 8 + 9
      d := 10
    `;
    const tokenizer = new PolyTokenizer(program);
    const parser = new Parser(tokenizer, opTable);
    const syntaxTree = parser.statements();
    const int = opTable.getType('Int');
    assertIREquals(
      translator.translate(syntaxTree).node,
      new IR('STATEMENTS', null, [
        new IR('ASSIGN', int, [
          1,
          new IR('Add', Type.function([int, int], int), [
            new IR('LITERAL', int, '2'),
            new IR('LITERAL', int, '3'),
          ]),
        ]),
        new IR('ASSIGN', int, [
          2,
          new IR('Add', Type.function([int, int], int), [
            new IR('LITERAL', int, '4'),
            new IR('LITERAL', int, '5'),
          ]),
        ]),
        new IR('STATEMENTS', null, [
          new IR('ASSIGN', int, [
            3,
            new IR('Add', Type.function([int, int], int), [
              new IR('LITERAL', int, '5'),
              new IR('LITERAL', int, '6'),
            ]),
          ]),
          new IR('ASSIGN', int, [
            4,
            new IR('Add', Type.function([int, int], int), [
              new IR('LITERAL', int, '6'),
              new IR('LITERAL', int, '7'),
            ]),
          ]),
          new IR('ASSIGN', int, [
            1,
            new IR('Add', Type.function([int, int], int), [
              new IR('LITERAL', int, '1'),
              new IR('LITERAL', int, '1'),
            ]),
          ]),
        ]),
        new IR('ASSIGN', int, [
          5,
          new IR('Add', Type.function([int, int], int), [
            new IR('LITERAL', int, '8'),
            new IR('LITERAL', int, '9'),
          ]),
        ]),
        new IR('ASSIGN', int, [
          6,
          new IR('LITERAL', int, '10'),
        ]),
      ]),
    );
  },
});
