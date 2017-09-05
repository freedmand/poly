import {TypeIndex, Type, AndType, OrType, PolymorphicType} from './type.js';
import * as t from '../testing/tests.js';

t.runTests('TypeIndex', {
  empty() {
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    t.assertFalse(typeIndex.has(a).match);
  },

  simple() {
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    typeIndex.set(a, true);
    t.assertTrue(typeIndex.has(a).match);
    t.assertEquals(typeIndex.get(a).value, true);
  },

  multiple() {
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    const b = new Type('B');
    typeIndex.set(a, 1);
    typeIndex.set(b, 2);
    t.assertEquals(typeIndex.get(a).value, 1);
    t.assertEquals(typeIndex.get(b).value, 2);
  },

  andSimple() {
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    const b = new Type('B');
    const aAndB = Type.and(a, b);
    typeIndex.set(aAndB, 1);
    const bAndA = Type.and(b, a);
    t.assertTrue(typeIndex.has(Type.and(a, b)).match);
    // With `and`, order matters.
    t.assertFalse(typeIndex.has(bAndA).match);
    t.assertEquals(typeIndex.get(aAndB).value, 1);
  },

  orSimple() {
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const aOrB = Type.or(a, b);
    typeIndex.set(aOrB, 3);
    t.assertTrue(typeIndex.has(a).match);
    t.assertEquals(typeIndex.get(a).value, 3);
    t.assertTrue(typeIndex.has(b).match);
    t.assertEquals(typeIndex.get(b).value, 3);
    t.assertTrue(typeIndex.has(aOrB).match);
    t.assertEquals(typeIndex.get(aOrB).value, 3);

    t.assertFalse(typeIndex.has(c).match);
  },

  orMultiple() {
    // With multiple entries, the first to be inserted is matched.
    const typeIndex = new TypeIndex();
    const a = new Type('A');
    const b = new Type('B');
    const aOrB = Type.or(a, b);

    typeIndex.set(a, 1);
    typeIndex.set(aOrB, 2);

    t.assertEquals(typeIndex.get(a).value, 1);
    t.assertEquals(typeIndex.get(aOrB).value, 2);
    t.assertEquals(typeIndex.get(b).value, 2);
  },

  polymorphicSimple() {
    const typeIndex = new TypeIndex();
    const aPrime = new PolymorphicType(`A'`);
    typeIndex.set(aPrime, 5);
    const int = new Type('Int');
    const string = new Type('String');
    t.assertTrue(typeIndex.has(int).match);
    t.assertTrue(typeIndex.has(string).match);
  },
});
