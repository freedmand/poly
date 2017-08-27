import * as t from '../testing/tests.js';
import {Type, OrType, AndType} from './type.js';

t.runTests('Type', {
  intSpecification() {
    const int = new Type('Int');
    t.assertEquals(int.specification, 'Int');
  },

  orSpecification() {
    const red = new Type('Red');
    const green = new Type('Green');
    const blue = new Type('Blue');
    const rgb = Type.or(red, green, blue);
    t.assertEquals(rgb.specification, 'Red|Green|Blue');
  },

  andSpecification() {
    const hex = new Type('Hex');
    const rgb = Type.and(hex, hex, hex);
    t.assertEquals(rgb.specification, 'Hex,Hex,Hex');
  },

  nestedOrAndSpecification() {
    // Define the suits.
    const hearts = new Type('Hearts');
    const spades = new Type('Spades');
    const clubs = new Type('Clubs');
    const diamonds = new Type('Diamonds');
    const suit = new Type('Suit', Type.or(hearts, spades, clubs, diamonds));

    // Define the card number.
    const int = new Type('Int');
    const number = new Type('Number', int);

    // Define a single playing card.
    const card = new Type('Card', Type.and(suit, number));
    t.assertEquals(card.specification,
        'Card(Suit(Hearts|Spades|Clubs|Diamonds),Number(Int))');
  },

  arraySpecification() {
    const intArray = Type.array(new Type('Int'));
    t.assertEquals(intArray.specification, '[Int]');
  },

  mapSpecification() {
    const int = new Type('Int');
    const string = new Type('String');
    const intStringMap = Type.map(int, string);
    t.assertEquals(intStringMap.specification, 'Int:String');
  },

  nestedArrayMapSpecification() {
    // Define primitives.
    const int = new Type('Int');
    const string = new Type('String');
    const intArray = Type.array(int);

    // Define sub-types.
    const model = new Type('Model', string);
    const years = new Type('Years', intArray);

    const carDirectory = Type.map(model, years);
    t.assertEquals(carDirectory.specification, 'Model(String):Years([Int])');
  },

  nestedNestedOrSpecification() {
    const intOrString = Type.or(new Type('Int'), new Type('String'));
    const intOrStringOrChar = Type.or(intOrString, new Type('Char'));
    t.assertEquals(intOrStringOrChar.specification, '(Int|String)|Char');
  },

  nestedNestedAndSpecification() {
    const ab = Type.and(new Type('A'), new Type('B'));
    const cd = Type.and(new Type('C'), new Type('D'));
    
    const abcd = Type.and(ab, cd);
    t.assertEquals(abcd.specification, '(A,B),(C,D)');
  },

  matchSimple() {
    const a1 = new Type('A');
    const a2 = new Type('A');
    t.assertTrue(a1.match(a2));
  },

  matchOr() {
    const a = new Type('A');
    const b = new Type('B');
    const aOrB = Type.or(a, b);
    t.assertTrue(aOrB.match(a));
    t.assertTrue(aOrB.match(b));
  },

  matchOrUnidirectional() {
    // While A|B matches A or B, A does not match A|B, nor does B.
    const a = new Type('A');
    const b = new Type('B');
    const aOrB = Type.or(a, b);
    t.assertFalse(a.match(aOrB));
    t.assertFalse(b.match(aOrB));
  },

  matchDoubleOr() {
    // A|B matches A|B.
    const a = new Type('A');
    const b = new Type('B');
    const aOrB1 = Type.or(a, b);
    const aOrB2 = Type.or(a, b);
    t.assertTrue(aOrB1.match(aOrB2));
  },

  matchDoubleOrBackwards() {
    // A|B matches B|A and B|A matches A|B.
    const a = new Type('A');
    const b = new Type('B');
    const aOrB = Type.or(a, b);
    const bOrA = Type.or(b, a);
    t.assertTrue(aOrB.match(bOrA));
    t.assertTrue(bOrA.match(aOrB));
  },

  matchDoubleOrFalse() {
    // A|B does not match A|C, nor does A|C match A|B.
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const aOrB = Type.or(a, b);
    const aOrC = Type.or(a, c);
    t.assertFalse(aOrB.match(aOrC));
    t.assertFalse(aOrC.match(aOrB));
  },

  matchDoubleOrBackwardsFalse() {
    // No combination or order of A|B, B|C, and C|A match each other.
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const aOrB = Type.or(a, b);
    const bOrC = Type.or(b, c);
    const cOrA = Type.or(c, a);
    t.assertFalse(aOrB.match(bOrC));
    t.assertFalse(bOrC.match(aOrB));
    t.assertFalse(aOrB.match(cOrA));
    t.assertFalse(cOrA.match(aOrB));
    t.assertFalse(bOrC.match(cOrA));
    t.assertFalse(cOrA.match(bOrC));
  },

  matchAndSingleType() {
    // A,B does not match A or B.
    const a = new Type('A');
    const b = new Type('B');
    const aAndB = Type.and(a, b);
    t.assertFalse(aAndB.match(a));
    t.assertFalse(aAndB.match(b));
  },

  matchAndDoubleType() {
    // A,B matches A,B.
    const a = new Type('A');
    const b = new Type('B');
    const aAndB = Type.and(a, b);
    const aAndB2 = Type.and(a, b);
    t.assertTrue(aAndB.match(aAndB2));
  },

  matchAndDoubleTypeUnidirectional() {
    // A,B does not B,A.
    const a = new Type('A');
    const b = new Type('B');
    const aAndB = Type.and(a, b);
    const aAndB2 = Type.and(b, a);
    t.assertFalse(aAndB.match(aAndB2));
  },

  matchNestedAndOr() {
    // (A|B),C matches (A|B),C.
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const aOrB1 = Type.or(a, b);
    const aOrB2 = Type.or(a, b);
    const hybrid1 = Type.and(aOrB1, c);
    const hybrid2 = Type.and(aOrB2, c);
    t.assertTrue(hybrid1.match(hybrid2));
    t.assertTrue(hybrid2.match(hybrid1));
  },

  matchNestedOrAnd() {
    // (A,B)|C matches (A,B)|C.
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const aAndB1 = Type.and(a, b);
    const aAndB2 = Type.and(a, b);
    const hybrid1 = Type.or(aAndB1, c);
    const hybrid2 = Type.or(aAndB2, c);
    t.assertTrue(hybrid1.match(hybrid2));
    t.assertTrue(hybrid2.match(hybrid1));
  },

  matchNestedOrAndFalse() {
    // (A,B)|C does not match (A,B)|D, nor the other way around.
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const d = new Type('D');
    const aAndB1 = Type.and(a, b);
    const aAndB2 = Type.and(a, b);
    const hybrid1 = Type.or(aAndB1, c);
    const hybrid2 = Type.or(aAndB2, d);
    t.assertFalse(hybrid1.match(hybrid2));
    t.assertFalse(hybrid2.match(hybrid1));
  },

  matchNestedOr() {
    // (A|B)|C matches (B|C)|A.
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const aOrB = Type.or(a, b);
    const bOrC = Type.or(b, c);
    const hybrid1 = Type.or(aOrB, c);
    const hybrid2 = Type.or(bOrC, a);
    t.assertTrue(hybrid1.match(hybrid2));
    t.assertTrue(hybrid2.match(hybrid1));
  },

  matchNestedOrFalse() {
    // (A|B)|C does not match (B|C)|D.
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const d = new Type('D');
    const aOrB = Type.or(a, b);
    const bOrC = Type.or(b, c);
    const hybrid1 = Type.or(aOrB, c);
    const hybrid2 = Type.or(bOrC, d);
    t.assertFalse(hybrid1.match(hybrid2));
    t.assertFalse(hybrid2.match(hybrid1));
  },
});