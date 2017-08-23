import * as t from '../testing/tests.js';
import {Grammar} from './grammar.js';

t.runTests('Grammar', {
  parse() {
    const g = Grammar.fromString(`
      A -> B c | d
      B -> c
    `);
    t.assertEquals(g.productions.length, 2);
    t.assertEquals(g.productions[0].symbol, 'A');
    t.assertEquals(g.productions[0].rules.length, 2);
    t.assertArrayEquals(g.productions[0].rules[0].symbols.map((x) => x.symbol),
        ['B', 'c']);
    t.assertArrayEquals(g.productions[0].rules[1].symbols.map((x) => x.symbol),
        ['d']);
    t.assertEquals(g.productions[1].rules.length, 1);
    t.assertArrayEquals(g.productions[1].rules[0].symbols.map((x) => x.symbol),
        ['c']);
  },

  toString() {
    const g = Grammar.fromString(`
      A -> B | C | d e
      B -> C | e
      C -> e d
    `);
    t.assertEquals(g.toString(), `A -> B | C | d e
B -> C | e
C -> e d`);
  },
});