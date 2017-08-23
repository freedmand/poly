import * as t from '../testing/tests.js';
import {Type} from './type.js';

t.runTests('Type', {
  int() {
    t.assertEquals(Type.parse('2').type, 'Int');
    t.assertEquals(Type.parse('-2382').type, 'Int');
    t.assertEquals(Type.parse('0').type, 'Int');
  },

  badInt() {
    t.assertRaises(() => Type.parse('2,300').type);
    t.assertRaises(() => Type.parse('-2,382').type);
  },

  float() {
    t.assertEquals(Type.parse('2.').type, 'Float');
    t.assertEquals(Type.parse('-2382.32').type, 'Float');
    t.assertEquals(Type.parse('0.0').type, 'Float');
  },

  badFloat() {
    t.assertRaises(() => Type.parse('2.2142.2').type);
    t.assertRaises(() => Type.parse('-2,382.5').type);
  },

  string() {
    t.assertEquals(Type.parse(`'dog'`).type, 'String');
    t.assertEquals(Type.parse(`''`).type, 'String');
  },

  color() {
    t.assertEquals(Type.parse('#fff').type, 'Color');
    t.assertEquals(Type.parse('#abcdef').type, 'Color');
    t.assertEquals(Type.parse('#178f32aa').type, 'Color');
    t.assertEquals(Type.parse('rgb(125, 2, 35)').type, 'Color');
    t.assertEquals(Type.parse('rgba(125, 2, 35, 21)').type, 'Color');
  },

  fraction() {
    t.assertEquals(Type.parse('3 / 4').type, 'Fraction');
    t.assertEquals(Type.parse('12314/-2').type, 'Fraction');
    t.assertEquals(Type.parse('0/0').type, 'Fraction');
  },

  simpleComposable() {
    const carType = new Type('Car', '{model: String, year: Int}');
    t.assertTrue(carType.valid(`{model: 'Chevrolet', year: 1999}`));
  },
});