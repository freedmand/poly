import * as t from '../testing/tests.js';
import {caseInsensitiveEquals, matchAllGroups} from './string.js';

t.runTests('String', {
  caseInsensitiveEquals() {
    t.assertTrue(caseInsensitiveEquals('dog', 'dog'));
    t.assertTrue(caseInsensitiveEquals('dog', 'DOG'));
    t.assertTrue(caseInsensitiveEquals('DOG', 'dog'));
    t.assertTrue(caseInsensitiveEquals('DOG', 'DOG'));
    t.assertFalse(caseInsensitiveEquals('DOG', 'CAT'));
    t.assertFalse(caseInsensitiveEquals('DOG', '   DOG  '));
  },

  matchAllGroupsSingleGroup() {
    t.assertArrayEquals(
        matchAllGroups('3 + 4', /([0-9]+.*[0-9]+)/), ['3 + 4']);
  },

  matchAllGroupsMultipleGroups() {
    t.assertArrayEquals(
        matchAllGroups('3 + 4', /([0-9]+).*([0-9]+)/), ['3', '4']);
  },

  matchAllGroupsNoMatch() {
    t.assertArrayEquals(matchAllGroups('dog', /cat/), []);
  },

  matchAllGroupsMatchWithNoGrouping() {
    t.assertArrayEquals(
        matchAllGroups('3 + 4', /[0-9]+.*[0-9]+/), []);
  },
})
