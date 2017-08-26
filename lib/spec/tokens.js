/**
 * Defines the tokens in the Poly language specification.
 */

/**
 * The regular expression that defines whitespace in the Poly language.
 */
export const whitespaceRegexp = {
  regexp: /^\s*/,
  type: 'whitespace',
};

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
    regexp: /[0-9]+\.[0-9]*(?:[^.])/,
    type: 'float',
  },
  {
    regexp: /[0-9]+/,
    type: 'integer',
  },
];

/**
 * Mathematical operations, like '+', '=', etc.
 */
export const operations = [
  '+', '-', '**', '*', '/', '=', '(', ')',
].map((x) => ({
  type: 'operation',
  content: x,
}));

export const patterns = [reserveWords, brackets, tokenRegexps, operations];