import * as ast from '../spec/ast.js';
import * as t from '../testing/tests.js';

import {IR, IntermediateTranslator} from './ir.js';

import {Parser} from '../parser/parser.js';
import {PolyOpTable} from '../spec/operators.js';
import {PolyTokenizer} from '../spec/tokens.js';
import {Scope} from '../parser/scope.js';
import {Type} from '../type/type.js';

const opTable = new PolyOpTable();
const int = opTable.getType('Int');
const float = opTable.getType('Float');
const string = opTable.getType('String');

const translator = new IntermediateTranslator(opTable);

function translateProgram(text) {
  const tokenizer = new PolyTokenizer(text);
  const parser = new Parser(tokenizer, opTable);
  const syntaxTree = parser.statements();
  return translator.translate(syntaxTree).node;
}

function assertExpressionType(text, type) {
  const tokenizer = new PolyTokenizer(text);
  const parser = new Parser(tokenizer, opTable);
  const syntaxTree = parser.expression();
  const actualType = translator.translate(syntaxTree).node.getReturnType();
  if (!Type.equals(type, actualType)) {
    t.fail(`Expected program with type ${actualType.specification} would ` +
        `have type ${type.specification}`);
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
    const tokenizer = new PolyTokenizer(program);
    const parser = new Parser(tokenizer, opTable);
    const syntaxTree = parser.statements();
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

  typedAssignMismatch() {
    const program = `
      a Float := 2
    `;
    const tokenizer = new PolyTokenizer(program);
    const parser = new Parser(tokenizer, opTable);
    const syntaxTree = parser.statements();
    // Throws a type error: expected Float, got Int.
    t.assertRaises(() => translator.translate(syntaxTree));
  },

  typedAssignMismatch() {
    const program = `
      a Int := (2, 2)
    `;
    const tokenizer = new PolyTokenizer(program);
    const parser = new Parser(tokenizer, opTable);
    const syntaxTree = parser.statements();
    const intTuple = Type.and(int, int);
    // Throws a type error: expected Int, got Int,Int.
    t.assertRaises(() => translator.translate(syntaxTree));
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
