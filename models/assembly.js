/*
 * assembly.js
 */


const db = require('../db')

exports.get = (id) =>
  db.queryOne('SELECT * FROM assembly WHERE id = @id', { id })
