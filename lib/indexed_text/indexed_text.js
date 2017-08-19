export class IndexedText {
  /**
   * @param {string} text The raw text to index.
   * @param {!Array<number} newLinePositions The position of all newlines in the
   *     document. Prepopulate this field to skip calculating this during
   *     initialization.
   */
  constructor(text, lineNumber = 0, charPosition = 0, newLinePositions = []) {
    /** @type {string} */
    this.text = text;
    /** @type {number} */
    this.lines = 0;
    /** @type {number} */
    this.chars = 0;

    this.lineNumber = lineNumber;
    this.charPosition = charPosition;

    /** @type {!Array<number>} */
    this.newLinePositions = newLinePositions;
    this.initialize();
  }

  /**
   * As part of initialization, calculates the position of every newline in the
   * text, the total number of lines, and the total number of characters.
   */
  initialize() {
    if (this.newLinePositions.length == 0) {
      let newLine = true;
      for (let i = 0; i < this.text.length; i++) {
        if (newLine) this.newLinePositions.push(i);
        const c = this.text.charAt(i);
        newLine = c == '\n';
      }
      if (newLine) this.newLinePositions.push(this.text.length);
    }
    this.lines = this.newLinePositions.length - this.lineNumber;
    this.chars = this.text.length - this.charPosition;
  }

  getNewLinePosition_(line) {
    if (line == 0) return 0;
    return this.newLinePositions[line + this.lineNumber] - this.charPosition;
  }

  /**
   * Returns the number of characters in the specified line, excluding the
   * trailing whitespace.
   * @param {number} lineNumber The line number.
   * @return {number} The number of characters in the line.
   */
  lineLength(lineNumber) {
    if (lineNumber == this.lines - 1) {
      return 0;
    }
    const position = this.getNewLinePosition_(lineNumber);
    const nextLine = this.getNewLinePosition_(lineNumber + 1);
    return nextLine - position - 1;
  }

  /**
   * Returns the contents of the specified line.
   * @param {number} lineNumber The zero-based line number to retrieve contents for.
   * @return {string}
   */
  getLine(lineNumber) {
    const currentLine = this.getNewLinePosition_(lineNumber);
    const nextLine = this.getNewLinePosition_(lineNumber + 1);
    return this.text.substring(currentLine, nextLine - 1);
  }

  /**
   * Returns the line number and line position of the overall character position.
   * @param {number} charPosition The character position.
   * @return {{lineNumber: number, linePosition: number}} The line number and
   *     position of the specified character position.
   */
  linePosition(charPosition) {
    if (charPosition == this.chars - this.charPosition) {
      return {
        lineNumber: this.lines - this.lineNumber - 1,
        linePosition: this.chars - this.newLinePositions[this.lines - this.lineNumber - 1] - this.charPosition,
      }
    }
    for (let lineNumber = 0; lineNumber < this.newLinePositions.length - this.lineNumber - 1;
        lineNumber++) {
      const currentLine = this.getNewLinePosition_(lineNumber);
      const nextLine = this.getNewLinePosition_(lineNumber + 1);
      if (charPosition >= currentLine && charPosition < nextLine) {
        return {
          lineNumber,
          linePosition: charPosition - currentLine,
        };
      }
    }
  }

  /**
   * Returns a new indexed text instance at the specified character position
   * substring.
   * @param {number} charPosition The start index of the substring.
   * @return {!IndexedText} A new indexed text instance with the substring.
   */
  substring(charPosition) {
    let {lineNumber} = this.linePosition(charPosition);
    return new IndexedText(this.text, lineNumber, charPosition, this.newLinePositions);
    // const newLinePositions = [0];
    // lineNumber++;
    // for (; lineNumber < this.newLinePositions.length; lineNumber++) {
    //   const newLinePosition = this.newLinePositions[lineNumber];
    //   newLinePositions.push(newLinePosition - charPosition);
    // }
    // return new IndexedText(this.text.substring(charPosition), newLinePositions);
  }
}