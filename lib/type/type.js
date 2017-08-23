const primitives = [
  {
    type: 'Fraction',
    regexps: [/-?[0-9]+\s*\/\s*-?[0-9]+/],
  },
  {
    type: 'Int',
    regexps: [/-?[0-9]+/],
  },
  {
    type: 'Float',
    regexps: [/-?[0-9]+\.[0-9]*/],
  },
  {
    type: 'String',
    regexps: [/'[^']*'/],
  },
  {
    type: 'Color',
    regexps: [
      /#[a-fA-F0-9]{3}/,
      /#[a-fA-F0-9]{6}/,
      /#[a-fA-F0-9]{8}/,
      /rgb\([0-9]+,\s*[0-9]+,\s*[0-9]+\)/,
      /rgba\([0-9]+,\s*[0-9]+,\s*[0-9]+,\s*[0-9]+\)/,
    ],
  }
];

function wrapRegexp(r) {
  return new RegExp('^' + r.source + '$');
}

export class Type {
  constructor(type, specification) {
    this.type = type;
    this.specification = specification;
  }

  static parse(contents) {
    for (const {type, regexps} of primitives) {
      for (const regexp of regexps) {
        const wrapped = wrapRegexp(regexp);
        if (contents.match(wrapped)) return new Type(type);
      }
    }
  }
}