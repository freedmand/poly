import {Scope} from './scope.js';
import * as t from '../testing/tests.js';

t.runTests('Scope', {
  define() {
    const scope = new Scope();
    scope.initialize('a', 3);
    t.assertTrue(scope.has('a'));
    t.assertEquals(scope.get('a'), 3);
  },

  undefined() {
    const scope = new Scope();
    t.assertFalse(scope.has('a'));
    t.assertRaises(() => scope.get('a'));
    t.assertRaises(() => scope.set('a'));
  },

  defineTwice() {
    const scope = new Scope();
    scope.initialize('a', 3);
    t.assertRaises(() => scope.initialize('a', 4));
  },

  nestedSimple() {
    const topScope = new Scope();
    topScope.initialize('animal', 'dog');
    const bottomScope = new Scope(topScope);
    t.assertTrue(bottomScope.has('animal'));
    t.assertEquals(bottomScope.get('animal'), 'dog');
  },

  nestedOverwriteInitialize() {
    const topScope = new Scope();
    topScope.initialize('animal', 'dog');
    const bottomScope = new Scope(topScope);
    bottomScope.initialize('animal', 'cat');
    t.assertEquals(topScope.get('animal'), 'dog');
    t.assertEquals(bottomScope.get('animal'), 'cat');
  },

  nestedOverwriteSet() {
    // A parent's variable can be modified from a child scope.
    const topScope = new Scope();
    topScope.initialize('animal', 'dog');

    const bottomScope = new Scope(topScope);
    bottomScope.set('animal', 'lemur');
    t.assertEquals(bottomScope.get('animal'), 'lemur');
    t.assertEquals(topScope.get('animal'), 'lemur');
  },

  popSimple() {
    const topScope = new Scope();
    topScope.initialize('animal', 'dog');
    const bottomScope = new Scope(topScope);
    bottomScope.initialize('animal', 'cat');

    let currentScope = bottomScope;
    t.assertEquals(currentScope.get('animal'), 'cat');
    currentScope = currentScope.pop();
    t.assertEquals(currentScope.get('animal'), 'dog');
  },

  deepNested() {
    const topScope = new Scope();
    topScope.initialize('animal', 'dog');
    const secondScope = new Scope(topScope);
    const thirdScope = new Scope(secondScope);
    const bottomScope = new Scope(thirdScope);
    t.assertEquals(bottomScope.get('animal'), 'dog');
  },

  multipleDescendants() {
    const topScope = new Scope();
    topScope.initialize('animal', 'dog');

    const bottomScope1 = new Scope(topScope);
    bottomScope1.initialize('animal', 'lemur');
    const bottomScope2 = new Scope(topScope);
    bottomScope2.initialize('animal', 'giraffe');

    t.assertEquals(bottomScope1.get('animal'), 'lemur');
    t.assertEquals(bottomScope2.get('animal'), 'giraffe');
    t.assertEquals(topScope.get('animal'), 'dog');
  },

  unsetSimple() {
    const scope = new Scope();
    scope.initialize('a', 3);
    t.assertTrue(scope.has('a'));
    t.assertEquals(scope.get('a'), 3);

    scope.uninitialize('a');
    t.assertFalse(scope.has('a'));
    t.assertRaises(() => scope.get('a'));
  },

  unsetNestedChild() {
    const topScope = new Scope();
    topScope.initialize('animal', 'dog');

    const bottomScope = new Scope(topScope);
    bottomScope.initialize('animal', 'lemur');

    t.assertEquals(bottomScope.get('animal'), 'lemur');
    bottomScope.uninitialize('animal');
    t.assertEquals(bottomScope.get('animal'), 'dog');
  },

  unsetNestedParent() {
    const topScope = new Scope();
    topScope.initialize('animal', 'dog');

    // Create two different child scopes, the first of which redefines 'animal'.
    const bottomScope1 = new Scope(topScope);
    bottomScope1.initialize('animal', 'lemur');
    const bottomScope2 = new Scope(topScope);
    t.assertEquals(bottomScope1.get('animal'), 'lemur');
    t.assertEquals(bottomScope2.get('animal'), 'dog');

    // After unsetting the parent scope's 'animal' variable, the nested scope
    // which redefines 'animal' can still access its 'animal' field, but the
    // other nested scope can no longer access 'animal'.
    topScope.uninitialize('animal');
    t.assertEquals(bottomScope1.get('animal'), 'lemur');
    t.assertRaises(() => bottomScope2.get('animal'));
  },

  toStringSimple() {
    const scope = new Scope();
    scope.initialize('animal', 'dog');
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
    scope.initialize('a', '2');
    scope.initialize('b', '3');
    t.assertEquals(scope.toString(), `{
  a = 2
  b = 3
}`);
  },

  toStringInsertionOrder() {
    // The order of the string representation reflects the order items were set.
    const scope = new Scope();
    scope.initialize('b', '2');
    scope.initialize('a', '3');
    t.assertEquals(scope.toString(), `{
  b = 2
  a = 3
}`);
  },

  toStringInsertionOrderUpdate() {
    // The order of the string representation reflects the order items were set,
    // even if an earlier variable updated.
    const scope = new Scope();
    scope.initialize('b', '2');
    scope.initialize('a', '3');
    scope.set('b', '4');
    t.assertEquals(scope.toString(), `{
  b = 4
  a = 3
}`);
  },

  toStringNested() {
    const topScope = new Scope();
    topScope.initialize('a', '2');
    const bottomScope = new Scope(topScope);
    bottomScope.initialize('b', '3');
    t.assertEquals(bottomScope.toString(), `{
  a = 2
  {
    b = 3
  }
}`);
  },
});
