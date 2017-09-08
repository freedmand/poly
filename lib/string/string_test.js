import * as t from '../testing/tests.js';
import * as string from './string.js';

t.runTests('String', {
  caseInsensitiveEquals() {
    t.assertTrue(string.caseInsensitiveEquals('dog', 'dog'));
    t.assertTrue(string.caseInsensitiveEquals('dog', 'DOG'));
    t.assertTrue(string.caseInsensitiveEquals('DOG', 'dog'));
    t.assertTrue(string.caseInsensitiveEquals('DOG', 'DOG'));
    t.assertFalse(string.caseInsensitiveEquals('DOG', 'CAT'));
    t.assertFalse(string.caseInsensitiveEquals('DOG', '   DOG  '));
  },

  matchAllGroupsSingleGroup() {
    t.assertArrayEquals(
        string.matchAllGroups('3 + 4', /([0-9]+.*[0-9]+)/), ['3 + 4']);
  },

  matchAllGroupsMultipleGroups() {
    t.assertArrayEquals(
        string.matchAllGroups('3 + 4', /([0-9]+).*([0-9]+)/), ['3', '4']);
  },

  matchAllGroupsNoMatch() {
    t.assertArrayEquals(string.matchAllGroups('dog', /cat/), []);
  },

  matchAllGroupsMatchWithNoGrouping() {
    t.assertArrayEquals(
        string.matchAllGroups('3 + 4', /[0-9]+.*[0-9]+/), []);
  },

  toStringWithIndents() {
    t.assertEquals(string.toStringWithIndents([
      'add(', new string.INDENT(), '2', '3', new string.UNINDENT(), ')',
    ]), `add(
  2
  3
)`);
  },
})
