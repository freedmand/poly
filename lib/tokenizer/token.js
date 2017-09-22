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

  /**
   * Returns a simple string representation of the token.
   * @return {string}
   */
  toString() {
    // JSON stringify token text to show escape characters literally.
    return `text: ${JSON.stringify(this.text)}, type: ${this.type}`;
  }
}

/**
 * A class that can match a Token instance by text, type, or both. If both text
 * and type are defined, a token only matches if both its text and type match.
 * If one of them is defined, a token only matches if its corresponding field
 * matches.
 */
export class TokenMatcher {
  /**
   * @param {{text: ?string, type: ?string}} params
   *
   *     text: The text of the token to match.
   *     type: The type of the token to match.
   */
  constructor({text = null, type = null}) {
    /** @type {?string} */
    this.text = text;
    /** @type {?string} */
    this.type = type;

    /**
     * Whether the text field is defined in this matcher.
     * @type {boolean}
     */
    this.hasText = this.text != null;
    /**
     * Whether the type field is defined in this matcher.
     * @type {boolean}
     */
    this.hasType = this.type != null;
  }

  /**
   * Returns whether the given token matches, or is satisfied by, this token
   * matcher.
   * @param {!Token} token The token to test.
   * @return {boolean} Whether this matcher successfully matches the given
   *     token.
   */
  match(token) {
    if (this.hasText && this.hasType) {
      // If the token matcher defines both 'text' and 'type', ensure both match.
      return this.text == token.text && this.type == token.type;
    }
    // Otherwise, if it has one but not the other, ensure only the one it has
    // ('text' or 'type') matches.
    if (this.hasText) return this.text == token.text;
    if (this.hasType) return this.type == token.type;
    throw new Error(
        `The token object must have a 'text' or 'type' field defined`);
  }

  /**
   * Returns a string representation of this token matcher.
   * @return {string}
   */
  toString() {
    const fields = [];
    // Display only the fields that are defined.
    if (this.text != null) {
      fields.push(`text: ${JSON.stringify(this.text)}`);
    }
    if (this.type != null) {
      fields.push(`type: ${this.type}`);
    }
    return fields.join(', ');
  }
}
