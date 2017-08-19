import {caseInsensitiveEquals} from '../string/string.js';

/**
 * A virtual representation of a file.
 */
export class File {
  /**
   * @param {string} name The name of the file.
   * @param {string} contents The file's contents.
   */
  constructor(name, contents) {
    this.name = name;
    this.contents = contents;
    this.extension = File.getExtension(this.name);
  }

  /**
   * Returns a file's extension given its name.
   * @param {string} name The full name of the file.
   * @return {string} The extension of the file; the empty string if none is
   *     provided.
   */
  static getExtension(name) {
    const index = name.lastIndexOf('.');
    if (index != -1) return name.substring(index + 1);
    return '';
  }

  /**
   * Returns whether the file's extension matches the given type.
   * @param {string} extension The extension to check for.
   * @return {boolean} If the file's extension matches.
   */
  isType(extension) {
    return caseInsensitiveEquals(this.extension, extension);
  }
}