import {Tokenizer} from '../tokenizer/tokenizer.js';

/**
 * Defines the tokens in the Poly language specification.
 */

/**
 * The regular expression that defines whitespace in the Poly language.
 */
export const whitespaceRegexps = [[
  {
    regexp: /\\n/,
    type: 'whitespace',
  },
  {
    regexp: /^[^\S\n]*/,
    type: 'whitespace',
  },
]];

/**
 * Words that have a special meaning in Poly, corresponding to loops, built-in
 * functions, ranges, and more.
 */
export const reserveWords = ['for', 'in'];

/**
 * Brackets that have an open and closing state and are managed by the tokenizer
 * in a stack.
 */
export const brackets = [
  {
    type: 'curly brace',
    open: '{',
    close: '}',
  },
  {
    type: 'parenthesis',
    open: '(',
    close: ')',
  },
];

function tokenStringParse(x) {
  if (typeof(x) != 'string') {
    throw new Error(`Invalid string: ${x}`);
  } else {
    if (x.startsWith(`'`) && x.endsWith(`'`)) {
      return x.substring(1, x.length - 1);
    } else {
      throw new Error(`Invalid string: ${x}`);
    }
  }
}

/**
 * Regular expressions corresponding to tokens that are not reserved words or
 * brackets, like variables, numbers, strings, etc.
 */
export const tokenRegexps = [
  {
    regexp: /[a-z][a-zA-Z0-9]*/,
    type: 'variable',
  },
  {
    regexp: /[A-Z][a-zA-Z0-9]*/,
    type: 'type',
  },
  {
    regexp: /\.\./,
    type: 'range',
  },
  {
    regexp: /[0-9]+\.[0-9]+/,
    type: 'float',
  },
  {
    regexp: /[0-9]+/,
    type: 'integer',
  },
  {
    regexp: /'[^']*?'/,
    type: 'string',
  },
  {
    regexp: /[\n][\s]*/,
    type: 'newline',
  },
  {
    regexp: /;/, // semicolon is synonymous with newline
    type: 'newline',
  },
];

/**
 * Mathematical operations, like '+', '=', etc.
 */
export const operations = [
  '+', '-', '**', '*', '//', '/', ':=', '=', '(', ')',
].map((x) => ({
  type: 'operation',
  content: x,
}));

export const patterns = [reserveWords, brackets, tokenRegexps, operations];

/**
 * The Poly language tokenizer, which converts raw text into tokens which can
 * then be parsed.
 */
export class PolyTokenizer extends Tokenizer {
  constructor(text) {
    super(text, whitespaceRegexps, patterns);
  }
}
