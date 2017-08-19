import * as t from '../testing/tests.js';
import {File} from './file.js';

t.runTests('File', {
  getExtension() {
    t.assertEquals(File.getExtension('test.txt'), 'txt');
    t.assertEquals(File.getExtension('a.b.c'), 'c');
    t.assertEquals(File.getExtension('untitled'), '');
    t.assertEquals(File.getExtension(''), '');
  },
})