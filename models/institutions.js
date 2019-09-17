/*
 * institutions.js
 */

const db = require('../db')

exports.byName = () =>
  db.query('SELECT id, name, short_name FROM institution')
    .then(results => {
      const byName = {}
      results.forEach(r => {
        byName[r.name] = r.id
        byName[r.short_name] = r.id
      })
      return byName
    })

exports.colorsByName = () =>
  db.query('SELECT color, name, short_name FROM institution')
    .then(results => {
      const byName = {}
      results.forEach(r => {
        byName[r.name]       = r.color
        byName[r.short_name] = r.color
      })
      return byName
    })

exports.selectById = (id) =>
  db.queryOne('SELECT * FROM institution WHERE id = @id', { id })

exports.selectAll = () =>
  db.query('SELECT * FROM institution')
