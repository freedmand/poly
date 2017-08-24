/**
 * A single token in the Poly language. Each token is able to store its location
 * in the file as well as basic type information.
 */
export class Token {
  /**
   * @param {string} text The raw text of the token.
   * @param {string} type The type of the token.
   * @param {number} lineNumber The line number on which the token appears.
   * @param {number} linePosition The character position of the token on the
   *     line on which it appears.
   * @param {number} charPosition The raw character position of the token in the
   *     entire file text.
   */
  constructor(text, type, lineNumber, linePosition, charPosition) {
    /** @type {string} */
    this.text = text;
    /** @type {type} */
    this.type = type;
    /** @type {number} */
    this.lineNumber = lineNumber;
    /** @type {number} */
    this.linePosition = linePosition;
    /** @type {number} */
    this.charPosition = charPosition;
  }
}