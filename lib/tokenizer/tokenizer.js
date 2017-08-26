import {Token} from './token.js';
import {IndexedText} from '../indexed_text/indexed_text.js';

/**
 * @typedef {string|{type:string,open:string,close:string}|
 *     {type:string,regexp:!RegExp},{type:string,content:string}}
 */
let Matcher;

/**
 * Wraps a regular expression to only match at the beginning of the text.
 * @param {!RegExp} regexp The regular expression to wrap.
 * @return {!RegExp} The new regular expression that only matches at the
 *     beginning of the text.
 */
function wrapRegexp(regexp) {
  return new RegExp('^' + regexp.source);
}

/**
 * 
 * @param {!Matcher} matcher 
 */
function getType(matcher) {
  if (typeof matcher == 'string') return matcher;
  return matcher.type;
}

/**
 * An abstract class for a language tokenizer, which converts raw text into
 * tokens which can then be parsed.
 */
export class Tokenizer {
  /**
   * @param {string} text The raw text to tokenize.
   * @param {!Array<!Array<!Matcher>>} whitespacePatterns A list of whitespace
   *     patterns to match in the tokenizer.
   * @param {!Array<!Array<!Matcher>>} patterns A list of token patterns to
   *     match in the tokenizer.
   */
  constructor(text, whitespacePatterns, patterns) {
    /** @type {!IndexedText} */
    this.text = new IndexedText(text);
    /**
     * A copy of text that will be consumed gradually as the tokenizer consumes
     * tokens.
     * @type {string}
     */
    this.feed = text;
    /**
     * The index of the feed, that will be advanced as the feed is consumed.
     * @type {number}
     */
    this.index = 0;

    /** @type {!Array<!Array<!Matcher>>} */
    this.whitespacePatterns = whitespacePatterns;
    /** @type {!Array<!Array<!Matcher>>} */
    this.patterns = patterns;
  }

  /**
   * Matches characters from the feed until the given regular expression or
   * string is satisfied, returning the characters matched. The feed is not
   * consumed.
   * @param {!Matcher} pattern The regular expression or string that will
   *     be used to match characters from the feed.
   * @return {string} The characters matched.
   */
  peek(pattern) {
    if (typeof pattern == 'string') {
      // String patterns can be matched with simple startsWith.
      if (this.feed.startsWith(pattern)) {
        return pattern;
      } else {
        return '';
      }
    } else if (pattern.regexp) {
      // Regular expression patterns must be matched with the regular expression
      // at the start of the feed.
      const match = this.feed.match(wrapRegexp(pattern.regexp));
      if (match == undefined) return match;
      const str = match[0];
      return str;
    } else if (pattern.content) {
      // If the pattern matcher has content, it is a simple string match.
      return this.peek(pattern.content);
    } else if (pattern.open && pattern.close) {
      // If the pattern matcher is a bracket, attempt matching its opening and
      // closing styles.
      const open = this.peek(pattern.open);
      if (open) return open;
      const close = this.peek(pattern.close);
      if (close) return close;
    } else {
      throw new Error('Improper matcher');
    }
  }

  /**
   * Advances the feed by the given number of characters.
   * @param {number} length 
   */
  advance(length) {
    this.feed = this.feed.substring(length);
    this.index += length;
  }

  /**
   * Consumes characters from the feed until the given regular expression or
   * string is satisfied, returning the characters consumed as a token.
   * @param {!Matcher} pattern The regular expression or string that will
   *     be used to consume the feed.
   * @return {?Token} The characters consumed as a token, or null if the pattern
   *     is not matched.
   */
  consume(pattern) {
    const match = this.peek(pattern);
    if (match != null && match.length > 0) {
      const type = getType(pattern);
      const index = this.index;
      const {lineNumber, linePosition} = this.text.linePosition(index);
      this.advance(match.length);
      // Transform the pattern is a post-processing function is defined.
      const text = pattern.post ? pattern.post(match) : match;
      return new Token(text, type, lineNumber, linePosition, index);
    }
    return null;
  }

  /**
   * Iterates through all the patterns specified, attempting to consume each
   * one. If one is matched, the resulting token is returned.
   * @param {!Array<!Matcher>} patterns The patterns to attempt consuming
   *     at the beginning of the feed.
   * @return {?Token} The resulting token if a pattern is matched, or null if
   *     nothing is matched.
   */
  attemptConsume(patterns) {
    for (const pattern of patterns) {
      const token = this.consume(pattern);
      if (token != null) return token;
    }
    return null;
  }

  /**
   * Iterates through a list of lists of patterns, attempting to consume each
   * pattern from each list in order. If one is matched, the resulting token is
   * returned.
   * @param {!Array<!Array<!Matcher>>} patternsList The list of patterns
   *     to attempt consuming at the beginning of the feed.
   * @return {?Token} The resulting token if a pattern is matched, or null if
   *     nothing is matched.
   */
  attemptConsumePatternsList(patternsList) {
    for (const patterns of patternsList) {
      const token = this.attemptConsume(patterns);
      if (token != null) return token;
    }
    return null;
  }

  /**
   * Tokenizes at the current position in the feed, returning the token matched
   * or throwing a tokenizer error if nothing can be matched at the current
   * position. The feed is advanced if a token is matched.
   * @return {!Token} The resulting token at this position in the feed.
   * @throws {Error} If no token can be matched at any point.
   */
  tokenize() {
    // Remove any extraneous whitespace.
    this.attemptConsumePatternsList(this.whitespacePatterns);
    const token = this.attemptConsumePatternsList(this.patterns);
    if (token) {
      return token;
    } else {
      throw new Error(`Cannot match the feed at position ${this.index}`,
          this.feed);
    }
  }

  /**
   * Tokenizes the entire feed from the current position, yielding each token
   * in the final tokenizer result.
   * @return {!Iterator<!Token>}
   * @throws {Error} If no token can be matched at any point.
   */
  * stream() {
    while (this.feed) {
      yield this.tokenize();
    }
  }

  /**
   * Tokenizes the entire feed from the current position, returning a list of
   * tokens that is the final tokenizer result.
   * @return {!Array<!Token>} The tokens tokenized.
   * @throws {Error} If no token can be matched at any point.
   */
  tokenizeAll() {
    return Array.from(this.stream());
  }
}
