/**
 * A list of all productions that generate the grammar.
 *
 * statement
 * set
 * expression
 * args
 */
const productions = {
  'statement': [
    [ // x Int = 2
      {type: 'variable'},
      {type: 'type'},
      {text: '='},
      {production: 'expression'},
    ],
    [ // x = 2
      {type: 'variable'},
      {production: 'set'},
      {production: 'expression'},
    ],
    // [ // fn()
    //   {type: 'variable'},
    //   {text: '('},
    //   {production: 'args'},
    //   {text: ')'},
    // ],
    [ // for i in ..10 { ... }
      {type: 'for'},
      {type: 'variable'},
      {type: 'in'},
      {production: 'expression'},
      {text: '{'},
      {production: 'statement'},
      {text: '}'},
    ],
  ],
  'set': [
    [{text: '='}],
    [{text: '+='}],
    [{text: '-='}],
    [{text: '*='}],
    [{text: '/='}],
  ],
  'expression': [
    [{type: 'number'}],
    [{type: 'variable'}],
    [ // 2 + 2
      {production: 'expression'},
      {type: 'operation'},
      {production: 'expression'},
    ],
  ],
  // 'args': [
  //   [],
  //   [
  //     {production: 'expression'}
  //   ]
  // ]
};


/**
 * Takes in a stream of tokens and returns a parse syntax tree representing a
 * program, before checking type, scope, and names. Returns parse errors if
 * no grammar can be matched.
 */
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.state = ['statement'];
    this.parse();
  }

  parse() {
    
  }
}