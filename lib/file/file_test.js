import * as t from '../testing/tests.js';
import {File} from './file.js';

t.runTests('File', {
  getExtension() {
    t.assertEquals(File.getExtension('test.txt'), 'txt');
    t.assertEquals(File.getExtension('a.b.c'), 'c');
    t.assertEquals(File.getExtension('untitled'), '');
    t.assertEquals(File.getExtension(''), '');
  },

  isType() {
    t.assertTrue(new File('dog.txt').isType('txt'));
    t.assertTrue(new File('dog.TXT').isType('txt'));
    t.assertTrue(new File('dog.txt').isType('TXT'));
    t.assertTrue(new File('dog.TXT').isType('TXT'));
    t.assertTrue(new File('dog').isType(''));

    t.assertFalse(new File('dog.txt').isType('exe'));
    t.assertFalse(new File('dog.TXT').isType('bat'));
    t.assertFalse(new File('dog').isType('txt'));
  },
})