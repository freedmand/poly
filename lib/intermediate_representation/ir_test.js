import * as ast from '../spec/ast.js';
import * as t from '../testing/tests.js';

import {IR, IntermediateTranslator} from './ir.js';

import {Parser} from '../parser/parser.js';
import {PolyOpTable} from '../spec/operators.js';
import {PolyTokenizer} from '../spec/tokens.js';
import {Scope} from '../parser/scope.js';
import {Type} from '../type/type.js';
import {TypeMismatchError} from '../error/type_error.js';

const opTable = new PolyOpTable();
const int = opTable.getType('Int');
const float = opTable.getType('Float');
const string = opTable.getType('String');

const translator = new IntermediateTranslator(opTable);

/**
 * Translates the specified program text, returning the translated intermediate
 * representation.
 * @param {string} text The program text.
 * @return {!IR} The resulting IR node of the program execution.
 */
function translateProgram(text) {
  const tokenizer = new PolyTokenizer(text);
  const parser = new Parser(tokenizer, opTable);
  const syntaxTree = parser.statements();
  return translator.translate(syntaxTree).node;
}

/**
 * Asserts that the specified expression text translates to the specified type.
 * @param {string} text The expression text.
 * @param {!Type} type The expected type of the translated text.
 * @throws {Error} The expression type differs from the expected type.
 */
function assertExpressionType(text, type) {
  const tokenizer = new PolyTokenizer(text);
  const parser = new Parser(tokenizer, opTable);
  const syntaxTree = parser.expression();
  const actualType = translator.translate(syntaxTree).node.getReturnType();
  if (!Type.equals(type, actualType)) {
    t.fail(`Expected expression with type ${actualType.specification} would ` +
        `have type ${type.specification}`);
  }
}

/**
 * Converts the specified program text to a syntax tree.
 * @param {string} text The text representing statements to convert to a syntax
 * tree.
 * @return {!Ast} The resulting syntax tree.
 */
function textToSyntaxTree(text) {
  const tokenizer = new PolyTokenizer(text);
  const parser = new Parser(tokenizer, opTable);
  const syntaxTree = parser.statements();
  return syntaxTree;
}

/**
 * Asserts that the specified program text encounters the specified type error
 * upon translation.
 * @param {string} text The text representing statements.
 * @param {!Type} expectedType Within the expected type error, the type that the
 *     program was expecting.
 * @param {!Type} actualType Within the expected type error, the type that the
 *     program got.
 * @throws {Error} The translation was expected to raise the following type
 *     error but either succeeded, did not raise the right type error, or raised
 *     another kind of error.
 */
function assertFailedTranslation(text, expectedType, actualType) {
  const syntaxTree = textToSyntaxTree(text);
  let succeeded = false;
  try {
    // Try translating the program, recording a successful run only if an error
    // is not thrown.
    translator.translate(syntaxTree);
    succeeded = true;
  } catch (e) {
    if (e instanceof TypeMismatchError) {
      // Dissect the type mismatch error.
      const errorActualType = e.got;
      const errorExpectedType = e.expected;
      if (!Type.equals(actualType, errorActualType) ||
          !Type.equals(expectedType, errorExpectedType)) {
        // Ensure the type mismatch error matches the expected type mismatch.
        const expectedTypeError =
            new TypeMismatchError(actualType, expectedType);
        t.fail(`Expected type error \`${expectedTypeError}\`, got \`${e}\``);
      }
    } else {
      t.fail(`Expected type mismatch error but got other error \`${e}\``);
      console.error(e);
    }
  }
  if (succeeded) {
    t.fail('Translation was expected to encounter an error');
  }
}

/**
 * Asserts the two given IR nodes are equal naively using their string
 * representation.
 * @param {!IR} ir1 The first IR node.
 * @param {!IR} ir2 The second IR node.
 * @throws {Error} The two nodes are not equal.
 */
function assertIREquals(ir1, ir2) {
  t.assertEquals(ir1.toString(), ir2.toString());
}

t.runTests('Intermediate Representation', {
  rawIntAdd() {
    const a = new ast.IntLiteral(int, 2);
    const b = new ast.IntLiteral(int, 3);
    const c = new ast.Add(Type.function([int, int], int), a, b);
    assertIREquals(
      translator.translate(c).node,
      new IR('Add', Type.function([int, int], int), [
        new IR('LITERAL', int, '2'),
        new IR('LITERAL', int, '3'),
      ],
    ));
  },

  intAssignNestedScopeComplex() {
    const program = `
      a := 2 + 3
      b := 4 + 5
      {
        b := 5 + 6
        c := 6 + 7
        a = 1 + 1
      }
      c := 8 + 9
      d := 10
    `;
    const tokenizer = new PolyTokenizer(program);
    const parser = new Parser(tokenizer, opTable);
    const syntaxTree = parser.statements();
    assertIREquals(
      translator.translate(syntaxTree).node,
      new IR('STATEMENTS', null, [
        new IR('ASSIGN', int, [
          1,
          new IR('Add', Type.function([int, int], int), [
            new IR('LITERAL', int, '2'),
            new IR('LITERAL', int, '3'),
          ]),
        ]),
        new IR('ASSIGN', int, [
          2,
          new IR('Add', Type.function([int, int], int), [
            new IR('LITERAL', int, '4'),
            new IR('LITERAL', int, '5'),
          ]),
        ]),
        new IR('STATEMENTS', null, [
          new IR('ASSIGN', int, [
            3,
            new IR('Add', Type.function([int, int], int), [
              new IR('LITERAL', int, '5'),
              new IR('LITERAL', int, '6'),
            ]),
          ]),
          new IR('ASSIGN', int, [
            4,
            new IR('Add', Type.function([int, int], int), [
              new IR('LITERAL', int, '6'),
              new IR('LITERAL', int, '7'),
            ]),
          ]),
          new IR('ASSIGN', int, [
            1,
            new IR('Add', Type.function([int, int], int), [
              new IR('LITERAL', int, '1'),
              new IR('LITERAL', int, '1'),
            ]),
          ]),
        ]),
        new IR('ASSIGN', int, [
          5,
          new IR('Add', Type.function([int, int], int), [
            new IR('LITERAL', int, '8'),
            new IR('LITERAL', int, '9'),
          ]),
        ]),
        new IR('ASSIGN', int, [
          6,
          new IR('LITERAL', int, '10'),
        ]),
      ]),
    );
  },

  typedAssignSimple() {
    const program = `
      a Int := 2
    `;
    const syntaxTree = textToSyntaxTree(program);
    assertIREquals(
      translator.translate(syntaxTree).node,
      new IR('STATEMENTS', null, [
        new IR('ASSIGN', int, [
          1,
          new IR('LITERAL', int, '2'),
        ]),
      ]),
    );
  },

  basicTypeMismatch() {
    // Expected Float, got Int.
    assertFailedTranslation('a Float := 2', float, int);
  },

  typeToTupleMismatch() {
    // Expected Int, got Int,Int.
    assertFailedTranslation('a Int := (2, 2)', int, Type.and(int, int));
  },

  singleElementTupleAssign() {
    const program = `
      a (Int,) := (2,)
    `;
    const syntaxTree = textToSyntaxTree(program);
    const intTuple = Type.and(int);
    assertIREquals(
      translator.translate(syntaxTree).node,
      new IR('STATEMENTS', null, [
        new IR('ASSIGN', intTuple, [
          1,
          new IR('Group', Type.function(Type.and(intTuple), intTuple), [
            new IR('Tuple', Type.function(intTuple, intTuple), [
              new IR('LITERAL', int, '2'),
            ]),
          ]),
        ]),
      ]),
    );
  },

  tupleDimensionMismatch() {
    // Expected (Int,), got Int,Int.
    assertFailedTranslation('a (Int,) := (2, 2)',
        Type.and(int), Type.and(int, int));
  },

  tupleSingleElementMismatch() {
    // Expected (Int,), got Int.
    assertFailedTranslation('a Int, := (2)', Type.and(int), int);
  },

  tupleSingleElementMismatch() {
    // Expected (Int, Float), got (Int, String).
    assertFailedTranslation(`a Int, Float := 2, '3'`,
        Type.and(int, float), Type.and(int, string));
  },

  singleElementArrayTupleAssign() {
    const program = `
      a [Int,] := [(2,)]
    `;
    const syntaxTree = textToSyntaxTree(program);
    const intTuple = Type.and(int);
    const arrayIntTuple = Type.array(intTuple);
    assertIREquals(
      translator.translate(syntaxTree).node,
      new IR('STATEMENTS', null, [
        new IR('ASSIGN', arrayIntTuple, [
          1,
          new IR('Array', Type.function(Type.and(intTuple), arrayIntTuple), [
            new IR('Group', Type.function(Type.and(intTuple), intTuple), [
              new IR('Tuple', Type.function(intTuple, intTuple), [
                new IR('LITERAL', int, '2'),
              ]),
            ]),
          ]),
        ]),
      ]),
    );
  },

  singleElementArrayTupleMismatch() {
    // Expected [Int,], got [Int].
    assertFailedTranslation('a [Int,] := [2,]',
        Type.array(Type.and(int)), Type.array(int));
  },

  intTypeSimple() {
    assertExpressionType('2', int);
  },

  intTypeParenthesisSimple() {
    assertExpressionType('(2)', int);
  },

  singleElementTupleType() {
    assertExpressionType('(2,)', Type.and(int));
  },

  multipleElementTupleType() {
    assertExpressionType('(2, 2)', Type.and(int, int));
  },

  multipleElementTupleMultipleTypes() {
    assertExpressionType(`(2, 2.0, '3')`, Type.and(int, float, string));
  },

  multipleElementTupleTypeTrailingComma() {
    assertExpressionType('(2, 2,)', Type.and(int, int));
  },

  arrayTypeSimple() {
    assertExpressionType('[2]', Type.array(int));
  },

  arrayTypeSimpleParenthesis() {
    assertExpressionType('[(2)]', Type.array(int));
  },

  arrayTypeSimpleTrailingComma() {
    assertExpressionType('[2,]', Type.array(int));
  },

  arrayTypeSimpleParenthesisTrailingComma() {
    assertExpressionType('[(2),]', Type.array(int));
  },

  arrayTypeSimpleMultipleElements() {
    assertExpressionType('[2, 2]', Type.array(int));
  },

  arrayTypeSimpleMultipleElementsTrailingComma() {
    assertExpressionType('[2, 2,]', Type.array(int));
  },

  arrayTypeMultipleTypes() {
    assertExpressionType('[2, 3.0]', Type.array(Type.or(int, float)));
  },

  arrayTypeTupleSubtype() {
    assertExpressionType('[(2,)]', Type.array(Type.and(int)));
  },

  arrayTypeTupleSubtypeTrailingComma() {
    assertExpressionType('[(2,),]', Type.array(Type.and(int)));
  },

  arrayTypeComplex() {
    assertExpressionType(`[3, ('4', 5.0), [6, 7]]`,
        Type.array(Type.or(int, Type.and(string, float), Type.array(int))));
  },

  arrayTypeComplex2() {
    assertExpressionType(`[3, ('4', 5.0), [6, 7.0]]`,
        Type.array(Type.or(
            int, Type.and(string, float), Type.array(Type.or(int, float)))));
  },

  arrayTypeOrBackwards() {
    assertExpressionType(`[[3, 4.0], [3.0, 4]]`,
        Type.array(Type.array(Type.or(int, float))));
  },
});
