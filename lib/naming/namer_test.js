import {Namer} from './namer.js';
import * as t from '../testing/tests.js';

t.runTests('Namer', {
  namingSimple() {
    const n = new Namer('abc');
    t.assertEquals(n.next(), 'a');
    t.assertEquals(n.next(), 'b');
    t.assertEquals(n.next(), 'c');
  },

  namingBinaryMultipleDigits() {
    const n = new Namer('01');
    t.assertEquals(n.next(), '0');
    t.assertEquals(n.next(), '1');
    t.assertEquals(n.next(), '00');
    t.assertEquals(n.next(), '01');
    t.assertEquals(n.next(), '10');
    t.assertEquals(n.next(), '11');
    t.assertEquals(n.next(), '000');
    t.assertEquals(n.next(), '001');
    t.assertEquals(n.next(), '010');
    t.assertEquals(n.next(), '011');
    t.assertEquals(n.next(), '100');
    t.assertEquals(n.next(), '101');
    t.assertEquals(n.next(), '110');
    t.assertEquals(n.next(), '111');
    t.assertEquals(n.next(), '0000');
  },

  namingDifferentFirstAndSecond() {
    // The first letters can only be in 'ab', but any other letter can be in
    // 'abc'.
    const n = new Namer('abc', 'ab');
    t.assertEquals(n.next(), 'a');
    t.assertEquals(n.next(), 'b');
    t.assertEquals(n.next(), 'aa');
    t.assertEquals(n.next(), 'ab');
    t.assertEquals(n.next(), 'ac');
    t.assertEquals(n.next(), 'ba');
    t.assertEquals(n.next(), 'bb');
    t.assertEquals(n.next(), 'bc');
    t.assertEquals(n.next(), 'aaa');
    t.assertEquals(n.next(), 'aab');
    t.assertEquals(n.next(), 'aac');
    t.assertEquals(n.next(), 'aba');
    t.assertEquals(n.next(), 'abb');
    t.assertEquals(n.next(), 'abc');
    t.assertEquals(n.next(), 'aca');
    t.assertEquals(n.next(), 'acb');
    t.assertEquals(n.next(), 'acc');
    t.assertEquals(n.next(), 'baa');
    t.assertEquals(n.next(), 'bab');
    t.assertEquals(n.next(), 'bac');
    t.assertEquals(n.next(), 'bba');
    t.assertEquals(n.next(), 'bbb');
    t.assertEquals(n.next(), 'bbc');
    t.assertEquals(n.next(), 'bca');
    t.assertEquals(n.next(), 'bcb');
    t.assertEquals(n.next(), 'bcc');
    t.assertEquals(n.next(), 'aaaa');
  },
});
