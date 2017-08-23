/**
 * A class that abstractly represents a context-free grammar.
 */
export class Grammar {
  /**
   * @param {!Array<!Production>} productions 
   */
  constructor(productions) {
    this.productions = productions;
  }

  /**
   * Returns a string version of the grammar in the following format:
   * 
   *   A -> B c | d
   *   B -> d
   * 
   * (no leading or trailing spaces or newlines in the actual output)
   */
  toString() {
    return this.productions.map((x) => `${x}`).join('\n');
  }

  /**
   * Parses a grammar defined in a string of the following format:
   *
   *   A -> B C | d
   *   B -> c C | epsilon
   * 
   * Each production must be on its own line. Each symbol must be separated by
   * spaces. A vertical line (|) can be used to separate multiple rules on the
   * same line.
   * @param {string} string Text defining the grammar.
   * @return {!Grammar} The resulting grammar.
   * @throws {Error} The grammar cannot be parsed from the string.
   */
  static fromString(string) {
    const productions = string.split('\n');
    const resultingProductions = [];
    // Iterate through every line.
    for (let production of productions) {
      // Remove extraneous whitespace and skip empty lines.
      production = production.trim();
      if (production == '') continue;

      // Grab all the tokens (space-separated) and remove empty ones.
      const tokens = production.split(' ').filter((x) => x.length > 0);
      // Ensure the second token is '->' indicating a production.
      if (tokens[1] != '->') {
        throw new Error(`Invalid production: no '->' as the second token`);
      }

      // The leading token is the production symbol.
      const productionSymbol = tokens[0];
      // The remaining tokens describe rules.
      const ruleSymbols = tokens.slice(2);
      const rules = [];
      let currentRule = [];
      // Iterate through each rule, splitting on '|'.
      for (const ruleSymbol of ruleSymbols) {
        if (ruleSymbol == '|') {
          rules.push(new Rule(currentRule));
          // Start a new rule.
          currentRule = [];
        } else {
          currentRule.push(new Symbol(ruleSymbol));
        }
      }
      if (currentRule.length > 0) rules.push(new Rule(currentRule));

      // Add the rules to the resulting productions.
      resultingProductions.push(new Production(productionSymbol, rules));
    }
    // Return the productions in a new grammar.
    return new Grammar(resultingProductions);
  }
}

export class Rule {
  /**
   * @param {!Array<!Symbol>} symbols 
   */
  constructor(symbols) {
    this.symbols = symbols;
  }

  /**
   * @return {string} The string version of the rule.
   */
  toString() {
    return this.symbols.map((x) => x.symbol).join(' ');
  }
}

/**
 * Abstract class representing a single symbol in the grammar.
 */
class Symbol {
  /**
   * @param {string} symbol 
   */
  constructor(symbol) {
    /** @type {string} */
    this.symbol = symbol;
  }
}

export class Production extends Symbol {
  /**
   * @param {string} symbol 
   * @param {!Array<!Rule>} rules 
   */
  constructor(symbol, rules) {
    super(symbol);
    this.rules = rules;
  }

  /**
   * @return {string} The string version of this production.
   */
  toString() {
    return `${this.symbol} -> ${this.rules.join(' | ')}`;
  }
}

export class Terminal extends Symbol {
  /**
   * @param {string} symbol 
   */
  constructor(symbol) {
    super(symbol);
  }
}