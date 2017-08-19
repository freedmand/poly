import * as t from '../testing/tests.js';
import {caseInsensitiveEquals} from './string.js';

t.runTests('String', {
  caseInsensitiveEquals() {
    t.assertTrue(caseInsensitiveEquals('dog', 'dog'));
    t.assertTrue(caseInsensitiveEquals('dog', 'DOG'));
    t.assertTrue(caseInsensitiveEquals('DOG', 'dog'));
    t.assertTrue(caseInsensitiveEquals('DOG', 'DOG'));
    t.assertFalse(caseInsensitiveEquals('DOG', 'CAT'));
    t.assertFalse(caseInsensitiveEquals('DOG', '   DOG  '));
  },
})