import {Type} from '../type/type.js';

/**
 * TypeMismatchError represents a type error during translation, compilation, or
 * interpretation.
 */
export class TypeMismatchError extends Error {
  /**
   * @param {!Type} got The type that was actually encountered.
   * @param {!Type} expected The type that was expected.
   */
  constructor(got, expected) {
    super(`Was expecting ${expected}, got ${got}`);

    /** @type {!Type} */
    this.got = got;
    /** @type {!Type} */
    this.expected = expected;
  }
}
