import {TypeIndex} from './type_index.js';
import {Type, AndType, OrType, AlgebraicType} from './type.js';
import * as t from '../testing/tests.js';

t.runTests('TypeIndex', {
  empty() {
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    t.assertFalse(typeIndex.has(a));
  },

  simple() {
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    typeIndex.set(a, true);
    t.assertTrue(typeIndex.has(a));
    t.assertEquals(typeIndex.get(a), true);
  },

  multiple() {
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    const b = new Type('B');
    typeIndex.set(a, 1);
    typeIndex.set(b, 2);
    t.assertEquals(typeIndex.get(a), 1);
    t.assertEquals(typeIndex.get(b), 2);
  },

  andSimple() {
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    const b = new Type('B');
    const aAndB = Type.and(a, b);
    typeIndex.set(aAndB, 1);
    const bAndA = Type.and(b, a);
    t.assertTrue(typeIndex.has(Type.and(a, b)));
    // With `and`, order matters.
    t.assertFalse(typeIndex.has(bAndA));
    t.assertEquals(typeIndex.get(aAndB), 1);
  },

  orSimple() {
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const aOrB = Type.or(a, b);
    typeIndex.set(aOrB, 3);
    t.assertTrue(typeIndex.has(a));
    t.assertEquals(typeIndex.get(a), 3);
    t.assertTrue(typeIndex.has(b));
    t.assertEquals(typeIndex.get(b), 3);
    t.assertTrue(typeIndex.has(aOrB));
    t.assertEquals(typeIndex.get(aOrB), 3);

    t.assertFalse(typeIndex.has(c));
  },

  orMultiple() {
    // With multiple entries, the first to be inserted is matched.
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    const b = new Type('B');
    const aOrB = Type.or(a, b);

    typeIndex.set(a, 1);
    typeIndex.set(aOrB, 2);

    t.assertEquals(typeIndex.get(a), 1);
    t.assertEquals(typeIndex.get(aOrB), 2);
    t.assertEquals(typeIndex.get(b), 2);
  },

  algebraicSimple() {
    const typeIndex = new TypeIndex();
    const aPrime = new AlgebraicType(`A'`);
    typeIndex.set(aPrime, 5);
    const int = new Type('Int');
    const string = new Type('String');
    t.assertTrue(typeIndex.has(int));
    t.assertTrue(typeIndex.has(string));
  },
});
