import {Type} from '../type/type.js';
import {ValueType, TypeTable} from '../interpreter/value_type.js';
import {Ast} from '../parser/ast.js';
import {Delta} from '../indexed_text/indexed_text.js';
import * as string from '../string/string.js';

const commonSubstitutions = {
  'Int': [
    {
      sub: 'String',
      transform: (x) => `'${x}'`,
    },
    {
      sub: 'Float',
      transform: (x) => `${x}.0`,
    },
  ],
  'String': [
    {
      sub: 'Int',
      transform: (x) => string.parse(x),
      valid: (x) => x.match(/^'[0-9]+'$/),
    },
    {
      sub: 'Float',
      transform: (x) => string.parse(x),
      valid: (x) => x.match(/^'[0-9]+\.[0-9]+'$/),
    }
  ],
};

/**
 * An extension of error for signature errors, like type mismatches.
 */
export class SignatureError extends Error {
  /**
   * @param {!TypeTable} typeTable The base type table, which can be used to
   *     gather selections on alternative signatures.
   * @param {!Ast} op The Ast operator.
   * @param {!Array<!ValueType>} values The values of the Ast operator params.
   * @param {!Type} spec The expected type specification.
   */
  constructor(typeTable, op, values, spec) {
    super(`No match found for operator ${op.name} and ` +
        `signature ${spec.specification}`);
    /** @type {!TypeTable} */
    this.typeTable = typeTable;
    /** @type {!Ast} */
    this.op = op;
    /** @type {!Array<!ValueType>} */
    this.values = values;
    /** @type {!Type} */
    this.spec = spec;
    /** @type {!Array<!Delta>} */
    this.substitutions = this.calculateSubstitutions();
    /**
     * The full text of the code. This can be set later so that deltas produce
     * meaningful output.
     * @type {?string}
     */
    this.fullText = null;
  }

  /**
   * Calculates and returns all valid single-type substitutions as delta objects
   * in the original text.
   * @return {!Array<!Delta>}
   */
  calculateSubstitutions() {
    // Iterate through all the values.
    const substitutions = [];
    for (let i = 0; i < this.values.length; i++) {
      const value = this.values[i];
      const param = this.op.params[i];
      const token = this.op.params[i].token;
      if (commonSubstitutions.hasOwnProperty(value.specification)) {
        // If one of the value params can be substituted, iterate through the
        // possible substitutions.
        for (const {sub, transform, valid} of
            commonSubstitutions[value.specification]) {
          // If the token text does not pass validation, skip this possibility.
          if (valid && !valid(token.text)) continue;

          // Create the new type specification.
          const newTypes = this.values.slice(0, i).concat(
              [new Type(sub)]).concat(this.values.slice(i + 1));
          const spec = Type.and(...newTypes);
          if (this.typeTable.ops.get(this.op.name).has(spec)) {
            // If the new type specification is in the type table, append a new
            // delta.
            substitutions.push(new Delta(
                token.charPosition, token.text.length, transform(token.text)));
          }
        }
      }
    }
    return substitutions;
  }
}