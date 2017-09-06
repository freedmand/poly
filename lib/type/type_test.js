import * as t from '../testing/tests.js';
import {Type, OrType, AndType, PolymorphicType} from './type.js';

function assertMatch(matchResult, match, mappings = null) {
  if (mappings == null) mappings = [];
  t.assertEquals(matchResult.match, match);
  if (matchResult.mappings.length != mappings.length) {
    t.fail(`The lengths differ (${matchResult.mappings.length.length} vs ` +
        `${mappings.length.length})`);
  }
  for (let i = 0; i < matchResult.mappings.length; i++) {
    const {from: from1, to: to1} = matchResult.mappings[i];
    const {from: from2, to: to2} = mappings[i];
    if (from1 != from2) {
      t.fail(`Mapping ${i} differs in from: (${from1.specification}) vs ` +
          `(${from2.specification})`);
    }
    if (to1 != to2) {
      t.fail(`Mapping ${i} differs in to: (${to1.specification}) vs ` +
          `(${to2.specification})`);
    }
  }
}

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

  emptyAnd() {
    const empty = Type.and();
    t.assertEquals(empty.specification, '()');
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

  arrayOrSpecification() {
    const int = new Type('Int');
    const string = new Type('String');
    const array = Type.array(int, string);
    t.assertEquals(array.specification, '[Int|String]');
  },

  nestedArraySpecification() {
    const intArray = Type.array(new Type('Int'));
    const nestedIntArray = Type.array(intArray);
    t.assertEquals(nestedIntArray.specification, '[[Int]]');
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

  functionSpecification() {
    const int = new Type('Int');
    const string = new Type('String');
    const fn = Type.function([string, int], int);
    t.assertEquals(fn.specification, 'String,Int -> Int');
  },

  emptyFunctionReturnSpecification() {
    const int = new Type('Int');
    const string = new Type('String');
    const fn = Type.function([string, int]);
    t.assertEquals(fn.specification, 'String,Int -> ()');
  },

  emptyFunctionArgumentsSpecification() {
    const int = new Type('Int');
    const string = new Type('String');
    const fn = Type.function(null, [string, int]);
    t.assertEquals(fn.specification, '() -> String,Int');
  },

  emptyFunctionSpecification() {
    const fn = Type.function();
    t.assertEquals(fn.specification, '() -> ()');
  },

  matchSimple() {
    const a1 = new Type('A');
    const a2 = new Type('A');
    assertMatch(a1.match(a2), true);
  },

  matchOr() {
    const a = new Type('A');
    const b = new Type('B');
    const aOrB = Type.or(a, b);
    assertMatch(aOrB.match(a), true);
    assertMatch(aOrB.match(b), true);
  },

  matchOrUnidirectional() {
    // While A|B matches A or B, A does not match A|B, nor does B.
    const a = new Type('A');
    const b = new Type('B');
    const aOrB = Type.or(a, b);
    assertMatch(a.match(aOrB), false);
    assertMatch(b.match(aOrB), false);
  },

  matchDoubleOr() {
    // A|B matches A|B.
    const a = new Type('A');
    const b = new Type('B');
    const aOrB1 = Type.or(a, b);
    const aOrB2 = Type.or(a, b);
    assertMatch(aOrB1.match(aOrB2), true);
  },

  matchDoubleOrBackwards() {
    // A|B matches B|A and B|A matches A|B.
    const a = new Type('A');
    const b = new Type('B');
    const aOrB = Type.or(a, b);
    const bOrA = Type.or(b, a);
    assertMatch(aOrB.match(bOrA), true);
    assertMatch(bOrA.match(aOrB), true);
  },

  matchDoubleOrFalse() {
    // A|B does not match A|C, nor does A|C match A|B.
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const aOrB = Type.or(a, b);
    const aOrC = Type.or(a, c);
    assertMatch(aOrB.match(aOrC), false);
    assertMatch(aOrC.match(aOrB), false);
  },

  matchDoubleOrBackwardsFalse() {
    // No combination or order of A|B, B|C, and C|A match each other.
    const a = new Type('A');
    const b = new Type('B');
    const c = new Type('C');
    const aOrB = Type.or(a, b);
    const bOrC = Type.or(b, c);
    const cOrA = Type.or(c, a);
    assertMatch(aOrB.match(bOrC), false);
    assertMatch(bOrC.match(aOrB), false);
    assertMatch(aOrB.match(cOrA), false);
    assertMatch(cOrA.match(aOrB), false);
    assertMatch(bOrC.match(cOrA), false);
    assertMatch(cOrA.match(bOrC), false);
  },

  matchEmptyAnd() {
    const a = Type.and();
    const b = Type.and();
    assertMatch(a.match(b), true);
    assertMatch(b.match(a), true);
  },

  matchAndSingleType() {
    // A,B does not match A or B.
    const a = new Type('A');
    const b = new Type('B');
    const aAndB = Type.and(a, b);
    assertMatch(aAndB.match(a), false);
    assertMatch(aAndB.match(b), false);
  },

  matchAndDoubleType() {
    // A,B matches A,B.
    const a = new Type('A');
    const b = new Type('B');
    const aAndB = Type.and(a, b);
    const aAndB2 = Type.and(a, b);
    assertMatch(aAndB.match(aAndB2), true);
  },

  matchAndDoubleTypeUnidirectional() {
    // A,B does not B,A.
    const a = new Type('A');
    const b = new Type('B');
    const aAndB = Type.and(a, b);
    const aAndB2 = Type.and(b, a);
    assertMatch(aAndB.match(aAndB2), false);
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
    assertMatch(hybrid1.match(hybrid2), true);
    assertMatch(hybrid2.match(hybrid1), true);
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
    assertMatch(hybrid1.match(hybrid2), true);
    assertMatch(hybrid2.match(hybrid1), true);
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
    assertMatch(hybrid1.match(hybrid2), false);
    assertMatch(hybrid2.match(hybrid1), false);
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
    assertMatch(hybrid1.match(hybrid2), true);
    assertMatch(hybrid2.match(hybrid1), true);
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
    assertMatch(hybrid1.match(hybrid2), false);
    assertMatch(hybrid2.match(hybrid1), false);
  },

  polymorphicType() {
    const aPrime = new PolymorphicType(`A'`);
    const int = new Type('Int');
    assertMatch(aPrime.match(int), true, [
      {from: aPrime, to: int},
    ]);
  },

  polymorphicTypeMultiple() {
    const aPrime = new PolymorphicType(`A'`);
    const int = new Type('Int');
    const string = new Type('String');
    assertMatch(aPrime.match(int), true, [
      {from: aPrime, to: int},
    ]);
    assertMatch(aPrime.match(string), true, [
      {from: aPrime, to: string},
    ]);
  },

  polymorphicArrayType() {
    const int = new Type('Int');
    const aPrime = new PolymorphicType('A');
    const intArray = Type.array(int);
    const aPrimeArray = Type.array(aPrime);
    assertMatch(intArray.match(aPrimeArray), false);
    assertMatch(aPrimeArray.match(intArray), true, [
      {from: aPrime, to: int},
    ]);
  },

  complexPolymorphicAndMatching() {
    const aPrime = new PolymorphicType(`A'`);
    const bPrime = new PolymorphicType(`B'`);
    const int = new Type('Int');
    const string = new Type('String');
    const intIntString = Type.and(int, int, string);
    // These should match intIntString.
    const aAB = Type.and(aPrime, aPrime, bPrime);
    const bBA = Type.and(bPrime, bPrime, aPrime);
    // These shouldn't intIntString.
    const aBB = Type.and(aPrime, bPrime, bPrime);
    const bAA = Type.and(bPrime, aPrime, aPrime);

    assertMatch(aAB.match(intIntString), true, [
      {from: aPrime, to: int},
      {from: bPrime, to: string},
    ]);
    assertMatch(bBA.match(intIntString), true, [
      {from: bPrime, to: int},
      {from: aPrime, to: string},
    ]);

    assertMatch(aBB.match(intIntString), false);
    assertMatch(bAA.match(intIntString), false);
  },

  complexPolymorphicOrMatching() {
    const aPrime = new PolymorphicType(`A'`);
    const int = new Type('Int');
    const string = new Type('String');
    // (Int|String),String
    const complex1 = Type.and(Type.or(int, string), string);
    // String,(Int|String)
    const complex2 = Type.and(string, Type.or(int, string));
    // A',A'
    const polymorphic = Type.and(aPrime, aPrime);

    assertMatch(polymorphic.match(complex1), true, [
      {from: aPrime, to: string},
    ]);
    assertMatch(polymorphic.match(complex2), true, [
      {from: aPrime, to: string},
    ]);
  },

  complexPolymorphicOrMatchingDeep() {
    const aPrime = new PolymorphicType(`A'`);
    const int = new Type('Int');
    const string = new Type('String');
    const float = new Type('Float');
    // (Int|String),(String|Float),(Float|String)
    const complex = Type.and(
      Type.or(int, string),
      Type.or(string, float),
      Type.or(float, string),
    );
    // A',A',A'
    const polymorphic = Type.and(aPrime, aPrime, aPrime);

    assertMatch(polymorphic.match(complex), true, [
      {from: aPrime, to: string},
    ]);
  },

  polymorphicFunctionMatching() {
    const aPrime = new PolymorphicType(`A'`);
    const bPrime = new PolymorphicType(`B'`);
    const swapFunction = Type.function([aPrime, bPrime], [bPrime, aPrime]);
    t.assertEquals(swapFunction.specification, `A',B' -> B',A'`);

    const int = new Type('Int');
    const string = new Type('String');
    const swapIntString = Type.function([int, string], [string, int]);
    assertMatch(swapFunction.match(swapIntString), true, [
      {from: aPrime, to: int},
      {from: bPrime, to: string},
    ]);
    const swapStringInt = Type.function([string, int], [int, string]);
    assertMatch(swapFunction.match(swapStringInt), true, [
      {from: aPrime, to: string},
      {from: bPrime, to: int},
    ]);
    const swapIntInt = Type.function([int, int], [int, int]);
    assertMatch(swapFunction.match(swapIntInt), true, [
      {from: aPrime, to: int},
      {from: bPrime, to: int},
    ]);
    const swapStringString = Type.function([string, string], [string, string]);
    assertMatch(swapFunction.match(swapStringString), true, [
      {from: aPrime, to: string},
      {from: bPrime, to: string},
    ]);

    const losingPairs = [
      [int, int], [int, string],
      [int, int], [string, int],
      [int, int], [string, string],
      [int, string], [int, int],
      [int, string], [int, string],
      [int, string], [string, string],
      [string, int], [int, string],
      [string, int], [string, int],
      [string, int], [string, string],
      [string, string], [int, int],
      [string, string], [int, string],
      [string, string], [string, string],
    ];
    for (const [argTypes, returnTypes] of losingPairs) {
      const fn = Type.function(argTypes, returnTypes);
      assertMatch(swapFunction.match(fn), false);
    }
  },
});
