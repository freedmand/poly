import * as t from '../testing/tests.js';
import {IndexedText} from './indexed_text.js';

const text = `0123456789
This is a test
 line 3 
4
5
6.....
     7
`;

const altText = `a
123`;

const indexedText = new IndexedText(text);
const altIndexedText = new IndexedText(altText);

t.runTests('Indexed Text', {
  overallPositions() {
    t.assertEquals(indexedText.lines, 8);
    t.assertEquals(indexedText.chars, 53);
  },

  lineLengths() {
    t.assertEquals(indexedText.lineLength(0), 10);
    t.assertEquals(indexedText.lineLength(1), 14);
    t.assertEquals(indexedText.lineLength(2), 8);
    t.assertEquals(indexedText.lineLength(3), 1);
    t.assertEquals(indexedText.lineLength(4), 1);
    t.assertEquals(indexedText.lineLength(5), 6);
    t.assertEquals(indexedText.lineLength(6), 6);
    t.assertEquals(indexedText.lineLength(7), 0);
  },

  getPositionBeginning() {
    const {lineNumber, linePosition} = indexedText.linePosition(0);
    t.assertEquals(lineNumber, 0);
    t.assertEquals(linePosition, 0);
  },

  getPositionFirstLine() {
    const {lineNumber, linePosition} = indexedText.linePosition(6);
    t.assertEquals(lineNumber, 0);
    t.assertEquals(linePosition, 6);
  },

  getPositionMiddleLine() {
    const {lineNumber, linePosition} = indexedText.linePosition(42);
    t.assertEquals(lineNumber, 5);
    t.assertEquals(linePosition, 3);
  },

  getEndPositionEmptyLine() {
    const {lineNumber, linePosition} = indexedText.linePosition(53);
    t.assertEquals(lineNumber, 7);
    t.assertEquals(linePosition, 0);
  },

  getEndPositionNonemptyLine() {
    const {lineNumber, linePosition} = altIndexedText.linePosition(5);
    t.assertEquals(lineNumber, 1);
    t.assertEquals(linePosition, 3);
  },

  substringOverallMidFirstLine() {
    const substring = indexedText.substring(5);
    t.assertEquals(substring.lines, 8);
    t.assertEquals(substring.chars, 48);
    t.assertEquals(substring.lineLength(0), 5);
    t.assertEquals(substring.lineLength(1), 14);
    t.assertEquals(substring.getLine(0), '56789');
  },

  substringOverallMidLaterLine() {
    const substring = indexedText.substring(28);
    t.assertEquals(substring.lines, 6);
    t.assertEquals(substring.chars, 25);
    t.assertEquals(substring.lineLength(0), 6);
    t.assertEquals(substring.lineLength(1), 1);
  },

  multipleSubstring() {
    const substring = indexedText.substring(28);
    const substring2 = substring.substring(13);
    t.assertEquals(substring2.getLine(0), '....');
  },

  getLine() {
    t.assertEquals(indexedText.getLine(0), '0123456789');
    t.assertEquals(indexedText.getLine(1), 'This is a test');
    t.assertEquals(indexedText.getLine(2), ' line 3 ');
    t.assertEquals(indexedText.getLine(6), '     7');
    t.assertEquals(indexedText.getLine(7), '');
  },
});