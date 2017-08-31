import * as t from '../testing/tests.js';
import * as ast from '../spec/ast.js';

t.runTests('Ast', {
  add() {
    t.assertEquals(new ast.Add(2, 3).toString(), 'Add(2,3)');
  },

  // TODO
  // forIn() {
  //   t.assertEquals(
  //       new ast.ForIn('x', new ast.Range(new ast.Constant(10)), []).toString(),
  //       'ForIn(variable:x,rangeExpression:Range(Constant(10)),statements:)');
  // },
});
