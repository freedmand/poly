// Console stylings for deltas.
const REMOVE_STYLE = 'background: maroon; color: white; ' +
'text-decoration: line-through; margin: 0 2px;';
const INSERT_STYLE = 'color:green; font-weight: bold; margin: 0 2px;';

/**
 * Parses a raw string literal.
 * @param {string} rawString The string literal, like `'dog\\ncat'`.
 * @return {string} The parsed string, like 'dog\ncat'.
 */
export function parse(rawString) {
  // TODO(implement complex string parsing behavior)
  return rawString.substring(1, rawString.length - 1);
}

/**
 * Returns the string reversed.
 * @param {string} str
 * @return {string} The reversed string.
 */
export function reverse(str) {
  return str.split('').reverse().join('');
}

/**
 * Returns whether the two strings are equal, ignoring case.
 * @param {string} str1
 * @param {string} str2
 * @return {boolean} Whether the two strings are equal.
 */
export function caseInsensitiveEquals(str1, str2) {
  return str1.toLowerCase() == str2.toLowerCase();
}

/**
 * Attempts to match the regular expression to the entire string, returning
 * all matching subgroups as an array. An empty array is returned if the regular
 * expression does not match or it does match but does not contain any groups.
 * @param {string} str
 * @param {!RegExp} regexp
 * @return {!Array<string>} The resulting groupings.
 */
export function matchAllGroups(str, regexp) {
  const wrapped = new RegExp('^' + regexp.source + '$');
  const matches = str.match(wrapped);
  const results = [];
  if (matches != null) {
    for (let i = 1; i < matches.length; i++) {
      results.push(matches[i]);
    }
  }
  return results;
}

/**
 * Replaces a region of a string with new contents.
 * @param {string} str The string to splice.
 * @param {number} index The start index of the region to replace.
 * @param {number} length The length of the region to replace.
 * @param {string} newContents The string that will replace the contents of the
 *     specified region.
 */
export function splice(str, index, length, newContents) {
  return str.substring(0, index) + newContents + str.substring(index + length);
}

/**
 * Joins the specified path components together. The last path component is the
 * file and the previous ones are directories.
 * @param {...string} pathComponents
 * @return {string} The resulting path joined by '/'.
 */
export function joinPath(...pathComponents) {
  let result = '';
  /**
   * Normalizes a path component by removing trailing slashes.
   * @param {string} pathComponent
   * @return {string} The normalized path component.
   */
  const normalize = (pathComponent) => {
    while (pathComponent.endsWith('/')) {
      pathComponent = pathComponent.substr(0, pathComponent.length - 1);
    }
    return pathComponent;
  }
  return pathComponents.map(normalize).join('/');
}

/**
 * Returns a logging message containing the full text specified, with the
 * delta region highlighted red, and the replacement text bolded and green.
 * @param {string} text The text base.
 * @param {!Delta} delta The delta to visualize.
 * @return {!Array<string>} The logging message arguments representing the
 *     application of the delta to the text, styled with '%c' specifiers.
 */
export function logDelta(text, delta) {
  /**
   * Escape a console logging string so that percent specifiers do not get
   * mangled.
   * @param {string} text The text to replace.
   * @return {string} The escaped text.
   */
  const re = (text) => text.replace(/%/g, '%%');
  const beforeDelta = text.substring(0, delta.charPosition);
  const badText = text.substring(
      delta.charPosition, delta.charPosition + delta.length);
  const goodText = delta.substitution;
  const afterDelta = text.substring(delta.charPosition + delta.length);
  return [
    `${re(beforeDelta)}%c${re(badText)}%c${re(goodText)}%c${re(afterDelta)}`,
    REMOVE_STYLE,
    INSERT_STYLE,
    '',
  ];
}

/**
 * Helper classes that represent indentation tokens for the toStringWithIndents
 * method.
 */
export class INDENT {}
export class UNINDENT {}

/**
 * Translates the specified array of contents to a new-line separated string
 * with proper indentation set according to indentation tokens.
 *
 * For example:
 *     toStringWithIndents(['A', new INDENT(), 'B', new UNINDENT(), 'C'])
 *
 * would return:
 *     'A\n' +
 *     '  B\n' +
 *     'C'
 * @param {!Array<string|INDENT|UNINDENT>} contents An array of strings and
 *     indentation tokens
 * @param {number} indent The amount of spaces for indentation.
 * @return {string} The string representation of the contents with proper
 *     indentation.
 */
export function toStringWithIndents(contents, indent = 2) {
  // Build up the results in an array that will later be joined by newline.
  const results = [];
  // Store the current indentation level.
  let currentIndent = 0;
  for (const content of contents) {
    // If an INDENT or UNINDENT token is encountered, increase or decrease the
    // current indentation appropriately and continue
    if (content instanceof INDENT) {
      currentIndent += indent;
    } else if (content instanceof UNINDENT) {
      currentIndent -= indent;
    } else {
      // Otherwise, push the resulting content with the appropriate indentation.
      results.push(`${' '.repeat(currentIndent)}${content}`);
    }
  }
  // Return the results joined by newline.
  return results.join('\n');
}
