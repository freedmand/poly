import * as t from '../testing/tests.js';
import {Type} from './type.js';

t.runTests('Type', {
  int() {
    const int = new Type('Int');
    t.assertEquals(int.specification, 'Int');
  },

  or() {
    const red = new Type('Red');
    const green = new Type('Green');
    const blue = new Type('Blue');
    const rgb = Type.or(red, green, blue);
    t.assertEquals(rgb.specification, 'Red|Green|Blue');
  },

  and() {
    const hex = new Type('Hex');
    const rgb = Type.and(hex, hex, hex);
    t.assertEquals(rgb.specification, 'Hex,Hex,Hex');
  },

  nestedOrAnd() {
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

  array() {
    const intArray = Type.array(new Type('Int'));
    t.assertEquals(intArray.specification, '[Int]');
  },

  map() {
    const int = new Type('Int');
    const string = new Type('String');
    const intStringMap = Type.map(int, string);
    t.assertEquals(intStringMap.specification, 'Int:String');
  },

  nestedArrayMap() {
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

  nestedNestedOr() {
    const intOrString = Type.or(new Type('Int'), new Type('String'));
    const intOrStringOrChar = Type.or(intOrString, new Type('Char'));
    t.assertEquals(intOrStringOrChar.specification, '(Int|String)|Char');
  },

  nestedNestedAnd() {
    const ab = Type.and(new Type('A'), new Type('B'));
    const cd = Type.and(new Type('C'), new Type('D'));
    
    const abcd = Type.and(ab, cd);
    t.assertEquals(abcd.specification, '(A,B),(C,D)');
  },
});