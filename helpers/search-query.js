/*
 * Query compilation
 */


module.exports = compileQuery

const SEPARATORS = {
  'AND': '&&',
  'OR': '||'
}
const OPERATORS = {
  '=':  '==',
  '!=': '!=',
}

function compileQuery(query) {
  return new Function('item', 'return ' + queryToString(query))
}

function queryToString(query) {
  // ['AND', { key: ..., operator: '=', value: ...}, ...]
  if (Array.isArray(query))
    return query.slice(1)
      .map(q => queryToString(q))
      .join(SEPARATORS[query[0]])

  // { key: ..., operator: '=', value: ...}
  return `item[${quote(query.key)}] ${OPERATORS[query.operator]} ${quote(query.value)}`
}

function quote(value) {
  return value === 'null' ? 'null' : `'` + value.replace(/'/g, '\\\'') + `'`
}
