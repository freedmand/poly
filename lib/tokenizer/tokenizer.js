import {IndexedText} from '../indexed_text/indexed_test.js';

const whitespaceRegexp = /^\s*/;

/**
 * Words that have a special meaning in Poly, corresponding to loops, built-in
 * functions, ranges, and more.
 */
const reserveWords = ['for', 'in'];

/**
 * Brackets that have an open and closing state and are managed by the tokenizer
 * in a stack.
 */
const brackets = [
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
const tokenRegexps = [
  {
    regexp: /[a-zA-Z][a-zA-Z0-9]*/,
    type: 'variable',
  },
  {
    regexp: /\.\./,
    type: 'range',
  },
  {
    regexp: /[0-9]+/,
    type: 'number',
  },
];

/**
 * The Poly language tokenizer, which converts raw text into tokens which can be
 * parsed.
 */
class Tokenizer {
  /**
   * @param {string} text The raw text to tokenize.
   */
  constructor(text) {
    /** @type {string} */
    this.text = new IndexedText(text);
    /**
     * A copy of text that will be consumed gradually as the parser consumes
     * tokens.
     * @type {string}
     */
    this.feed = text;
    this.parse();
  }

  /**
   * Consumes characters from the feed until the given regular expression is
   * satisfied, returning the characters consumed.
   * @param {!RegExp} regexp The regular expression that will be used to consume
   *     the feed.
   * @return {string} The characters consumed.
   */
  consumeRegexp(regexp) {
    const match = this.feed.match(regexpWrap(regexp));
    if (match === undefined) return '';
    const str = match[0];
    this.feed = this.feed.substring(match.length);
    return match;
  }

  parseBrackets() {

  }

  parseReserveWords() {
    for (const reserveWord of reserveWords) {
      const consumed = consumeRegexp
    }
  }

  parse() {
    switch (this.state) {
      case states.STATEMENT:
        this.parseStatement();
        break;
      case states.EXPRESSION:
        this.parseExpression();
        break;

    }
  }
}

/**
 * A single token in the Poly language. Each token is able to store its location
 * in the file as well as basic type information.
 */
class Token {
  /**
   * @param {string} text The raw text of the token.
   * @param {number} lineNumber The line number on which the token appears.
   * @param {number} linePosition The character position of the token on the
   *     line on which it appears.
   * @param {number} charPosition The raw character position of the token in the
   *     entire file text.
   */
  constructor(text, lineNumber, linePosition, charPosition) {
    this.text = text;
    this.lineNumber = lineNumber;
    this.position = position;
    this.charPosition = charPosition;
  }
}