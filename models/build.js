/*
 * build.js
 */


const db = require('../db')


exports.get = (id) =>
  db.queryOne('SELECT * FROM build WHERE id = @id', { id })

exports.getByName = (name) =>
  db.queryOne('SELECT * FROM build WHERE name = @name', { name })

