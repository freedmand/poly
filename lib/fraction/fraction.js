/**
 * Describes a simple fraction with a numerator and denominator.
 * @typedef {{num: number, den: number}} param
 */
let Fraction;

/**
 * Returns the greatest common divisor of the numerator and the denominator.
 * This is most commonly used in reducing a fraction to the lowest terms.
 * @param {!Fraction} param The fraction whose numerator and denominator to use.
 * @return {number} The greatest common divisor.
 */
function gcd({num, den}) {
  // Calculate the greatest common divisor using the Euclidean algorithm.
  while (den) {
    [num, den] = [den, num % den];
  }
  return num;
}

/**
 * Casts the parameter to a fraction.
 * @param {number|!Fraction} param An integer or fraction.
 * @return {!Fraction} The fraction version of the input parameter.
 */
function cast(param) {
  if (typeof(param) == 'number') return {num: param, den: 1};
  return param;
}

/**
 * Normalizes the representation of the given fraction by only permitting a
 * single negative sign on the numerator.
 * @param {!Fraction} param The fraction to normalize.
 * @return {!Fraction} The normalized fraction.
 */
function normalize({num, den}) {
  if (den < 0) {
    return {num: num * -1, den: den * -1};
  }
  return {num, den};
}

/**
 * Reduces a fraction to its lowest terms.
 * @param {!Fraction} param
 * @return {!Fraction} The reduced fraction.
 */
export function reduce({num, den}) {
  const commonDenominator = gcd({num, den});
  return normalize({
    num: num / commonDenominator,
    den: den / commonDenominator,
  });
}

/**
 * Adds the two fractions and returns the result.
 * @param {!Fraction} param1 The first fraction.
 * @param {!Fraction} param2 The second fraction.
 * @return {!Fraction} The sum of the two fractions.
 */
export function add(param1, param2) {
  const {num: num1, den: den1} = cast(param1);
  const {num: num2, den: den2} = cast(param2);
  // The denominator will be the least common multiple of the two denominators.
  const den = (den1 * den2 / (gcd({num: den1, den: den2}))) | 0;
  const num = den / den1 * num1 + den / den2 * num2;
  return reduce({num, den});
}

/**
 * Subtracts the second fraction from the first and returns the result.
 * @param {!Fraction} param1 The first fraction.
 * @param {!Fraction} param2 The second fraction.
 * @return {!Fraction} The first fraction minus the second fraction.
 */
export function sub(param1, param2) {
  const {num: num1, den: den1} = cast(param1);
  const {num: num2, den: den2} = cast(param2);
  return add({num: num1, den: den1}, {num: -num2, den: den2});
}

/**
 * Multiplies the two fractions and returns the result.
 * @param {!Fraction} param1 The first fraction.
 * @param {!Fraction} param2 The second fraction.
 * @return {!Fraction} The product of the two fractions.
 */
export function mul(param1, param2) {
  const {num: num1, den: den1} = cast(param1);
  const {num: num2, den: den2} = cast(param2);
  return reduce({num: num1 * num2, den: den1 * den2});
}

/**
 * Divides the second fraction from the first and returns the result.
 * @param {!Fraction} param1 The first fraction.
 * @param {!Fraction} param2 The second fraction.
 * @return {!Fraction} The first fraction divided by the second fraction.
 */
export function div(param1, param2) {
  const {num: num1, den: den1} = cast(param1);
  const {num: num2, den: den2} = cast(param2);
  return mul({num: num1, den: den1}, {num: den2, den: num2});
}

/**
 * Returns whether the first fraction is less than the second fraction or not.
 * @param {!Fraction} param1 The first fraction.
 * @param {!Fraction} param2 The second fraction.
 * @return {boolean} Whether the first fraction is less than the second
 *     fraction.
 */
export function lessThan(param1, param2) {
  const result = sub(param1, param2);
  return result.num < 0;
}

/**
 * Returns whether the first fraction is greater than the second fraction or
 * not.
 * @param {!Fraction} param1 The first fraction.
 * @param {!Fraction} param2 The second fraction.
 * @return {boolean} Whether the first fraction is greater than the second
 *     fraction.
 */
export function greaterThan(param1, param2) {
  const result = sub(param1, param2);
  return result.num > 0;
}

/**
 * Returns the specified fraction expressed as a real number.
 * @param {!Fraction} fraction The fraction to convert to a real number.
 * @return {number} The real number representation of the fraction.
 */
export function toReal(fraction) {
  return fraction.num / fraction.den;
}

/**
 * Converts a float to its simplest fractional approximation within epsilon.
 * @param {number} float The number to convert to a fraction.
 * @param {number=} epsilon The epsilon bounds to tolerate.
 * @return {!Fraction} The float expressed as a fraction.
 */
export function fromFloat(float, epsilon = 0.00001) {
  // Define the bounds for an acceptable result.
  const floatLeft = float - epsilon;
  const floatRight = float + epsilon;
  /**
   * Returns whether x is within epsilon of the specified float.
   * @param {number} x
   * @return {boolean}
   */
  const withinEpsilon = (x) => x >= floatLeft && x <= floatRight;

  // Use Farey sequences to derive rational approximations.
  let leftBounds = {num: -1, den: 0};
  let middleBounds = {num: 0, den: 1};
  let rightBounds = {num:1, den: 0};
  let approximation = toReal(middleBounds);
  while (!withinEpsilon(approximation)) {
    if (float < approximation) {
      // If the float we are trying to reach is in between the left bounds and
      // middle bounds, set the right bounds in the next iteration to the
      // current middle bounds.
      rightBounds = {num: middleBounds.num, den: middleBounds.den};
      // Set the middle bounds by summing the numerator and denominators of the
      // left and middle bounds.
      middleBounds = {
        num: leftBounds.num + middleBounds.num,
        den: leftBounds.den + middleBounds.den,
      };
    } else {
      // If the float we are trying to reach is in between the middle bounds and
      // right bounds, set the left bounds in the next iteration to the
      // current middle bounds.
      leftBounds = {num: middleBounds.num, den: middleBounds.den};
      // Set the middle bounds by summing the numerator and denominators of the
      // right and middle bounds.
      middleBounds = {
        num: rightBounds.num + middleBounds.num,
        den: rightBounds.den + middleBounds.den,
      };
    }
    approximation = toReal(middleBounds);
  }
  // The approximation is stored in the middle bounds.
  return middleBounds;
}
