/**
 * Namer provides an endless iterator to deterministically cycle through all
 * possible variable names according to the allowed character sets. This is
 * useful when renaming variable names to use the shortest possible names first
 * and have an inexhaustible set.
 */
export class Namer {
  /**
   * @param {string} allowedCharacters A string containing all the allowed
   *     characters in variable names.
   * @param {?string=} allowedFirstCharacters An optional string containing all
   *     the allowed characters at the start of variable names. If set, variable
   *     names will only start with characters in this string.
   */
  constructor(allowedCharacters, allowedFirstCharacters = null) {
    /** @type {string} */
    this.allowedCharacters = allowedCharacters;
    /** @type {string} */
    this.allowedFirstCharacters =
        allowedFirstCharacters ? allowedFirstCharacters : allowedCharacters;
    /**
     * The current length of variable names being iterated.
     * @private {number}
     */
    this.length_ = 1;
    /**
     * An internal index to help iterate through variable names without having
     * to store every name generated.
     * @private {number}
     */
    this.index_ = 0;
  }

  /**
   * Returns the next variable name.
   * @return {string}
   */
  next() {
    // Use the current index and calculate all the positions in the allowed
    // character arrays by dividing and calculating the modulus at appropriate
    // strides.
    let i = this.index_;
    // Store whether the current iteration is the last iteration at the current
    // length.
    let last = true;

    // Build the resulting string backwards by iterating and applying modulus
    // methods.
    let result = '';
    // Iterate through the allowed characters at any position in the string.
    for (let _ = 0; _ < this.length_ - 1; _++) {
      const index = i % this.allowedCharacters.length;
      if (index != this.allowedCharacters.length - 1) last = false;
      result = this.allowedCharacters.charAt(index) + result;
      // Integer divide i by the length of the allowed characters.
      i = (i / this.allowedCharacters.length) | 0;
    }
    // Finally, place the proper character from the allowed first characters at
    // the beginning of the resulting string.
    if (i != this.allowedFirstCharacters.length - 1) last = false;
    result = this.allowedFirstCharacters.charAt(i) + result;

    if (last) {
      // If the current iteration is the last one at the current length,
      // increment the length and reset the index.
      this.index_ = 0;
      this.length_++;
    } else {
      // Otherwise, simply increment the index.
      this.index_++;
    }
    return result;
  }
}