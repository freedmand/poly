import {Scope, makeVar, makeConst, makeReserved} from './scope.js';
import * as t from '../testing/tests.js';

t.runTests('Scope', {
  define() {
    const scope = new Scope();
    scope.initialize('a', makeVar(3));
    t.assertTrue(scope.has('a'));
    t.assertEquals(scope.get('a').value, 3);
  },

  undefined() {
    const scope = new Scope();
    t.assertFalse(scope.has('a'));
    t.assertRaises(() => scope.get('a'));
    t.assertRaises(() => scope.set('a'));
  },

  defineTwice() {
    const scope = new Scope();
    scope.initialize('a', makeVar(3));
    t.assertRaises(() => scope.initialize('a', makeVar(4)));
  },

  defineTwiceLatterConstant() {
    const scope = new Scope();
    scope.initialize('a', makeVar(3));
    t.assertRaises(() => scope.initialize('a', makeConst(4)));
  },

  defineTwiceConstant() {
    const scope = new Scope();
    scope.initialize('a', makeConst(3));
    t.assertRaises(() => scope.initialize('a', makeConst(4)));
  },

  defineTwiceLatterVar() {
    const scope = new Scope();
    scope.initialize('a', makeConst(3));
    t.assertRaises(() => scope.initialize('a', makeVar(4)));
  },

  set() {
    const scope = new Scope();
    scope.initialize('a', makeVar(3));
    // No problems reassigned a non-constant variable.
    scope.set('a', 4);
  },

  constantSet() {
    const scope = new Scope();
    scope.initialize('a', makeConst(3));
    // A constant variable cannot be reassigned.
    t.assertRaises(() => scope.set('a', 4));
  },

  reservedSet() {
    const scope = new Scope();
    scope.initialize('for', makeReserved());
    // A reserved variable cannot be reassigned.
    t.assertRaises(() => scope.set('for', 4));
  },

  nestedSimple() {
    const topScope = new Scope();
    topScope.initialize('animal', makeVar('dog'));
    const bottomScope = new Scope(topScope);
    t.assertTrue(bottomScope.has('animal'));
    t.assertEquals(bottomScope.get('animal').value, 'dog');
  },

  nestedOverwriteInitialize() {
    const topScope = new Scope();
    topScope.initialize('animal', makeVar('dog'));
    const bottomScope = new Scope(topScope);
    bottomScope.initialize('animal', makeVar('cat'));
    t.assertEquals(topScope.get('animal').value, 'dog');
    t.assertEquals(bottomScope.get('animal').value, 'cat');
  },

  nestedOverwriteConstantInitialize() {
    // No problems re-initializing a constant from a child scope.
    const topScope = new Scope();
    topScope.initialize('animal', makeConst('dog'));
    const bottomScope = new Scope(topScope);
    bottomScope.initialize('animal', makeConst('cat'));
    t.assertEquals(topScope.get('animal').value, 'dog');
    t.assertEquals(bottomScope.get('animal').value, 'cat');
  },

  nestedOverwriteReservedInitialize() {
    // Cannot re-initialize a reserved word from a child scope.
    const topScope = new Scope();
    topScope.initialize('true', makeReserved());
    const bottomScope = new Scope(topScope);
    t.assertRaises(() => bottomScope.initialize('true', makeVar('cat')));
    t.assertRaises(() => bottomScope.initialize('true', makeConst('cat')));
    t.assertRaises(() => bottomScope.initialize('true', makeReserved()));
  },

  nestedOverwriteSet() {
    // A parent's variable can be modified from a child scope.
    const topScope = new Scope();
    topScope.initialize('animal', makeVar('dog'));

    const bottomScope = new Scope(topScope);
    bottomScope.set('animal', 'lemur');
    t.assertEquals(bottomScope.get('animal').value, 'lemur');
    t.assertEquals(topScope.get('animal').value, 'lemur');
  },

  nestedOverwriteConstantSet() {
    // A parent's variable cannot be modified from a child scope if the parent
    // is a constant.
    const topScope = new Scope();
    topScope.initialize('animal', makeConst('dog'));

    const bottomScope = new Scope(topScope);
    t.assertRaises(() => bottomScope.set('animal', 'lemur'));
  },

  nestedOverwriteReservedSet() {
    // A parent's variable cannot be modified from a child scope if the parent
    // is a reserved word.
    const topScope = new Scope();
    topScope.initialize('if', makeReserved());

    const bottomScope = new Scope(topScope);
    t.assertRaises(() => bottomScope.set('if', 'lemur'));
  },

  popSimple() {
    const topScope = new Scope();
    topScope.initialize('animal', makeVar('dog'));
    const bottomScope = new Scope(topScope);
    bottomScope.initialize('animal', makeVar('cat'));

    let currentScope = bottomScope;
    t.assertEquals(currentScope.get('animal').value, 'cat');
    currentScope = currentScope.pop();
    t.assertEquals(currentScope.get('animal').value, 'dog');
  },

  deepNested() {
    const topScope = new Scope();
    topScope.initialize('animal', makeVar('dog'));
    const secondScope = new Scope(topScope);
    const thirdScope = new Scope(secondScope);
    const bottomScope = new Scope(thirdScope);
    t.assertEquals(bottomScope.get('animal').value, 'dog');
  },

  multipleDescendants() {
    const topScope = new Scope();
    topScope.initialize('animal', makeVar('dog'));

    const bottomScope1 = new Scope(topScope);
    bottomScope1.initialize('animal', makeVar('lemur'));
    const bottomScope2 = new Scope(topScope);
    bottomScope2.initialize('animal', makeVar('giraffe'));

    t.assertEquals(bottomScope1.get('animal').value, 'lemur');
    t.assertEquals(bottomScope2.get('animal').value, 'giraffe');
    t.assertEquals(topScope.get('animal').value, 'dog');
  },

  unsetSimple() {
    const scope = new Scope();
    scope.initialize('a', makeVar(3));
    t.assertTrue(scope.has('a'));
    t.assertEquals(scope.get('a').value, 3);

    scope.uninitialize('a');
    t.assertFalse(scope.has('a'));
    t.assertRaises(() => scope.get('a'));
  },

  unsetNestedChild() {
    const topScope = new Scope();
    topScope.initialize('animal', makeVar('dog'));

    const bottomScope = new Scope(topScope);
    bottomScope.initialize('animal', makeVar('lemur'));

    t.assertEquals(bottomScope.get('animal').value, 'lemur');
    bottomScope.uninitialize('animal');
    t.assertEquals(bottomScope.get('animal').value, 'dog');
  },

  unsetNestedParent() {
    const topScope = new Scope();
    topScope.initialize('animal', makeVar('dog'));

    // Create two different child scopes, the first of which redefines 'animal'.
    const bottomScope1 = new Scope(topScope);
    bottomScope1.initialize('animal', makeVar('lemur'));
    const bottomScope2 = new Scope(topScope);
    t.assertEquals(bottomScope1.get('animal').value, 'lemur');
    t.assertEquals(bottomScope2.get('animal').value, 'dog');

    // After unsetting the parent scope's 'animal' variable, the nested scope
    // which redefines 'animal' can still access its 'animal' field, but the
    // other nested scope can no longer access 'animal'.
    topScope.uninitialize('animal');
    t.assertEquals(bottomScope1.get('animal').value, 'lemur');
    t.assertRaises(() => bottomScope2.get('animal'));
  },

  toStringSimple() {
    const scope = new Scope();
    scope.initialize('animal', makeVar('dog'));
    t.assertEquals(scope.toString(), `{
  animal = dog
}`);
  },

  toStringEmpty() {
    const scope = new Scope();
    t.assertEquals(scope.toString(), `{
}`);
  },

  toStringMultipleEntries() {
    const scope = new Scope();
    scope.initialize('a', makeVar('2'));
    scope.initialize('b', makeVar('3'));
    t.assertEquals(scope.toString(), `{
  a = 2
  b = 3
}`);
  },

  toStringInsertionOrder() {
    // The order of the string representation reflects the order items were set.
    const scope = new Scope();
    scope.initialize('b', makeVar('2'));
    scope.initialize('a', makeVar('3'));
    t.assertEquals(scope.toString(), `{
  b = 2
  a = 3
}`);
  },

  toStringInsertionOrderUpdate() {
    // The order of the string representation reflects the order items were set,
    // even if an earlier variable updated.
    const scope = new Scope();
    scope.initialize('b', makeVar('2'));
    scope.initialize('a', makeVar('3'));
    scope.set('b', '4');
    t.assertEquals(scope.toString(), `{
  b = 4
  a = 3
}`);
  },

  toStringNested() {
    const topScope = new Scope();
    topScope.initialize('a', makeVar('2'));
    const bottomScope = new Scope(topScope);
    bottomScope.initialize('b', makeVar('3'));
    t.assertEquals(bottomScope.toString(), `{
  a = 2
  {
    b = 3
  }
}`);
  },

  counterSimple() {
    const scope = new Scope();
    scope.initialize('a', makeVar('2'));
    scope.initialize('b', makeVar('2'));
    t.assertEquals(scope.get('a').counter, 1);
    t.assertEquals(scope.get('b').counter, 2);
  },

  counterReassign() {
    const scope = new Scope();
    scope.initialize('a', makeVar('2'));
    scope.initialize('b', makeVar('2'));
    t.assertEquals(scope.get('a').counter, 1);
    t.assertEquals(scope.get('b').counter, 2);
    scope.set('a', makeVar('3'));
    t.assertEquals(scope.get('a').counter, 1);
  },

  counterNested() {
    const topScope = new Scope();
    topScope.initialize('a', makeVar('2'));
    const bottomScope = new Scope(topScope);
    bottomScope.initialize('a', makeVar('2'));
    t.assertEquals(bottomScope.get('a').counter, 2);
    t.assertEquals(topScope.get('a').counter, 1);
    bottomScope.uninitialize('a');
    t.assertEquals(bottomScope.get('a').counter, 1);
  },

  counterNestedShallow() {
    const topScope = new Scope();
    topScope.initialize('a', makeVar(1));
    const bottomScope = new Scope(topScope);
    bottomScope.initialize('b', makeVar(2));
    topScope.initialize('c', makeVar(3));
    bottomScope.initialize('d', makeVar(4));
    t.assertEquals(bottomScope.get('a').counter, 1);
    t.assertEquals(bottomScope.get('b').counter, 2);
    t.assertEquals(bottomScope.get('c').counter, 3);
    t.assertEquals(bottomScope.get('d').counter, 4);
  },

  counterNestedDeep() {
    const topScope = new Scope();
    topScope.initialize('1', makeVar('1'));
    const secondScope = new Scope(topScope);
    const thirdScope = new Scope(secondScope);
    const bottomScope = new Scope(thirdScope);
    topScope.initialize('2', makeVar('2'));
    bottomScope.initialize('3', makeVar('3'));
    bottomScope.initialize('4', makeVar('4'));
    topScope.initialize('5', makeVar('5'));
    topScope.initialize('6', makeVar('6'));
    secondScope.initialize('7', makeVar('7'));
    thirdScope.initialize('8', makeVar('8'));
    secondScope.initialize('9', makeVar('9'));
    bottomScope.initialize('10', makeVar('10'));
    for (let i = 1; i <= 10; i++) {
      t.assertEquals(bottomScope.get(`${i}`).counter, i);
    }
  },
});
