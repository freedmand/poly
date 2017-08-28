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