import * as t from '../testing/tests.js';
import {Tokenizer} from './tokenizer.js';
import {Token} from './token.js';

/**
 * Asserts whether two lists of tokens are equal to one another.
 * @param {!Array<!Token>} tokens1 The first list of tokens.
 * @param {!Array<!Token>} tokens2 The second list of tokens.
 * @param {!Array<string>=} omitFields If specified, fields to omit when
 *     checking if two given tokens are equal to one another.
 */
function assertTokensEquals(tokens1, tokens2, omitFields = []) {
  if (tokens1.length != tokens2.length) {
    throw new Error(
        `The lengths differ (${tokens1.length} vs ${tokens2.length})`);
  }
  for (let i = 0; i < tokens1.length; i++) {
    const token1 = tokens1[i];
    const token2 = tokens2[i];
    const keys = [...new Set([...Object.keys(token1), ...Object.keys(token1)])];
    for (const key of keys) {
      if (omitFields.includes(key)) continue;
      if (token1.hasOwnProperty(key) && !token2.hasOwnProperty(key)) {
        throw new Error(`The first token at index ${i} has key ${key} but ` +
            `the second does not`);
      }
      if (!token1.hasOwnProperty(key) && token2.hasOwnProperty(key)) {
        throw new Error(`The second token at index ${i} has key ${key} but ` +
            `the first does not`);
      }
      if (token1[key] != token2[key]) {
        throw new Error(`The tokens at index ${i} differ in key ${key}:
${token1[key]}
vs
${token2[key]}
        `);
      }
    }
  }
}

t.runTests('Tokenizer', {
  simple() {
    const tokenizer = new Tokenizer('{}');
    const tokens = tokenizer.tokenizeAll();
    assertTokensEquals(tokens, [
      {
        text: '{',
        type: 'curly brace',
        lineNumber: 0,
        linePosition: 0,
        charPosition: 0,
      },
      {
        text: '}',
        type: 'curly brace',
        lineNumber: 0,
        linePosition: 1,
        charPosition: 1,
      },
    ]);
  },

  forRange() {
    const tokenizer = new Tokenizer(`for i in ..10 {
      
}`);
    const tokens = tokenizer.tokenizeAll();
    assertTokensEquals(tokens, [
      {
        text: 'for',
        type: 'for',
        lineNumber: 0,
        linePosition: 0,
        charPosition: 0,
      },
      {
        text: 'i',
        type: 'variable',
        lineNumber: 0,
        linePosition: 4,
        charPosition: 4,
      },
      {
        text: 'in',
        type: 'in',
        lineNumber: 0,
        linePosition: 6,
        charPosition: 6,
      },
      {
        text: '..',
        type: 'range',
        lineNumber: 0,
        linePosition: 9,
        charPosition: 9,
      },
      {
        text: '10',
        type: 'integer',
        lineNumber: 0,
        linePosition: 11,
        charPosition: 11,
      },
      {
        text: '{',
        type: 'curly brace',
        lineNumber: 0,
        linePosition: 14,
        charPosition: 14,
      },
      {
        text: '}',
        type: 'curly brace',
        lineNumber: 2,
        linePosition: 0,
        charPosition: 23,
      },
    ]);
  },

  assign() {
    const tokenizer = new Tokenizer(`x = 3
y = 4`);
    const tokens = tokenizer.tokenizeAll();
    assertTokensEquals(tokens, [
      {
        text: 'x',
        type: 'variable',
      },
      {
        text: '=',
        type: 'operation',
      },
      {
        text: '3',
        type: 'integer',
      },
      {
        text: 'y',
        type: 'variable',
      },
      {
        text: '=',
        type: 'operation',
      },
      {
        text: '4',
        type: 'integer',
      },
    ], ['lineNumber', 'linePosition', 'charPosition']);
  },

  mathExpression() {
    const tokenizer = new Tokenizer(`x + 12.2 * (-2 / 4)`);
    const tokens = tokenizer.tokenizeAll();
    assertTokensEquals(tokens, [
      {
        text: 'x',
        type: 'variable',
      },
      {
        text: '+',
        type: 'operation',
      },
      {
        text: '12.2',
        type: 'float',
      },
      {
        text: '*',
        type: 'operation',
      },
      {
        text: '(',
        type: 'parenthesis',
      },
      {
        text: '-',
        type: 'operation',
      },
      {
        text: '2',
        type: 'integer',
      },
      {
        text: '/',
        type: 'operation',
      },
      {
        text: '4',
        type: 'integer',
      },
      {
        text: ')',
        type: 'parenthesis',
      },
    ], ['lineNumber', 'linePosition', 'charPosition']);
  },

  string() {
    const tokenizer = new Tokenizer(`x + 'str'`);
    const tokens = tokenizer.tokenizeAll();
    assertTokensEquals(tokens, [
      {
        text: 'x',
        type: 'variable',
      },
      {
        text: '+',
        type: 'operation',
      },
      {
        text: `str`,
        type: 'string',
      },
    ], ['lineNumber', 'linePosition', 'charPosition']);
  },
});