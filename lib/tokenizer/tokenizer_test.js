import * as t from '../testing/tests.js';
import {Tokenizer} from './tokenizer.js';

function assertTokensEquals(tokens1, tokens2) {
  if (tokens1.length != tokens2.length) {
    throw new Error(
        `The lengths differ (${tokens1.length} vs ${tokens2.length})`);
  }
  for (let i = 0; i < tokens1.length; i++) {
    const token1 = tokens1[i];
    const token2 = tokens2[i];
    const keys = [...new Set([...Object.keys(token1), ...Object.keys(token1)])];
    for (const key of keys) {
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
  tokenizerSimple() {
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

  tokenizerForRange() {
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
        type: 'number',
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
});