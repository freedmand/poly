import * as t from '../testing/tests.js';
import * as ast from '../spec/ast.js';
import {Type} from '../type/type.js';
import {Scope} from '../parser/scope.js';
import {IR, IntermediateTranslator} from './ir.js';

const translator = new IntermediateTranslator();

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
    const a = new ast.IntLiteral(2);
    const b = new ast.IntLiteral(3);
    const c = new ast.Add(a, b);
    const int = new Type('Int');
    assertIREquals(
      translator.translate(c).node,
      new IR('Add', Type.function([int, int], int), [
        new IR('LITERAL', int, '2'),
        new IR('LITERAL', int, '3'),
      ],
    ));
  },
});
