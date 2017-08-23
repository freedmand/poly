const statement = [
  ['variable', 'type', 'equal', '@expression'],
  ['variable', '@set', '@expression'],
  ['variable', 'parenthesis[open]', 'parenthesis[close]'],
  ['for', 'variable', 'in', '@expression', 'curly brace[open]', '@statement', 'curly brace[close]'],
];

const set = [
  ['(=)'], ['(+=)'], ['(-=)'], ['(*=)'], ['(/=)'],
];

const expression = [
  ['number'],
  ['variable'],
  ['@expression', 'operation', '@expression'],
]

/**
 * Takes in a stream of tokens and returns a parse syntax tree representing a
 * program, before checking type, scope, and names. Returns parse errors if
 * no grammar can be matched.
 */
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
  }
}