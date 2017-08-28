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