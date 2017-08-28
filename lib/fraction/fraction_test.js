import * as t from '../testing/tests.js';
import {reduce, add, sub, mul, div} from './fraction.js';

function assertFractionEquals({num: num1, den: den1}, {num: num2, den: den2}) {
  // Ensure all the numerators and denominators are proper numbers.
  if (typeof num1 != 'number') {
    throw new t.AssertionError('The first numerator is not a number');
  }
  if (typeof num2 != 'number') {
    throw new t.AssertionError('The second numerator is not a number');
  }
  if (typeof den1 != 'number') {
    throw new t.AssertionError('The first denominator is not a number');
  }
  if (typeof den2 != 'number') {
    throw new t.AssertionError('The second denominator is not a number');
  }
  
  if (num1 != num2) {
    throw new t.AssertionError('Numerators differ (', num1, 'vs', num2, ')');
  }
  if (den1 != den2) {
    throw new t.AssertionError('Denominators differ (', den1, 'vs', den2, ')');
  }
}

t.runTests('Fraction', {
  reduceSimple() {
    assertFractionEquals(reduce({num: 5, den: 10}), {num: 1, den: 2});
    assertFractionEquals(reduce({num: 18, den: 30}), {num: 3, den: 5});
    assertFractionEquals(reduce({num: 17, den: 51}), {num: 1, den: 3});
    assertFractionEquals(reduce({num: 5, den: 7}), {num: 5, den: 7});
    assertFractionEquals(reduce({num: 1, den: 1}), {num: 1, den: 1});
  },

  addSimple() {
    assertFractionEquals(
      add(
        {num: 1, den: 2},
        {num: 1, den: 2},
      ),
      {num: 1, den: 1},
    );
    assertFractionEquals(
      add(
        {num: 2, den: 3},
        {num: 3, den: 4},
      ),
      {num: 17, den: 12},
    );
    assertFractionEquals(
      add(
        {num: 0, den: 2},
        {num: 1, den: 2},
      ),
      {num: 1, den: 2},
    );
    assertFractionEquals(
      add(
        {num: 5, den: 5},
        {num: 5, den: 5},
      ),
      {num: 2, den: 1},
    );
    assertFractionEquals(
      add(
        {num: 1, den: 7},
        {num: 1, den: 13},
      ),
      {num: 20, den: 91},
    );
  },

  subSimple() {
    assertFractionEquals(
      sub(
        {num: 1, den: 2},
        {num: 1, den: 2},
      ),
      {num: 0, den: 1},
    );
    assertFractionEquals(
      sub(
        {num: 2, den: 3},
        {num: 3, den: 4},
      ),
      {num: -1, den: 12},
    );
    assertFractionEquals(
      sub(
        {num: 0, den: 2},
        {num: 1, den: 2},
      ),
      {num: -1, den: 2},
    );
    assertFractionEquals(
      sub(
        {num: 5, den: 5},
        {num: 5, den: 5},
      ),
      {num: 0, den: 1},
    );
    assertFractionEquals(
      sub(
        {num: 1, den: 7},
        {num: 1, den: 13},
      ),
      {num: 6, den: 91},
    );
  },

  mulSimple() {
    assertFractionEquals(
      mul(
        {num: 1, den: 1},
        {num: 1, den: 1},
      ),
      {num: 1, den: 1},
    );
    assertFractionEquals(
      mul(
        {num: 1, den: 2},
        {num: 2, den: 1},
      ),
      {num: 1, den: 1},
    );
    assertFractionEquals(
      mul(
        {num: 2, den: 3},
        {num: 3, den: 4},
      ),
      {num: 1, den: 2},
    );
    assertFractionEquals(
      mul(
        {num: -3, den: 13},
        {num: 9, den: 7},
      ),
      {num: -27, den: 91},
    );
  },

  divSimple() {
    assertFractionEquals(
      div(
        {num: 1, den: 1},
        {num: 1, den: 1},
      ),
      {num: 1, den: 1},
    );
    assertFractionEquals(
      div(
        {num: 1, den: 2},
        {num: 2, den: 1},
      ),
      {num: 1, den: 4},
    );
    assertFractionEquals(
      div(
        {num: 2, den: 3},
        {num: 3, den: 4},
      ),
      {num: 8, den: 9},
    );
    assertFractionEquals(
      div(
        {num: -3, den: 13},
        {num: 9, den: 7},
      ),
      {num: -7, den: 39},
    );
  },
})