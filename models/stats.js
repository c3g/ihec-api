/*
 * stats.js
 */


const db = require('../db')


exports.byDescription = (description) =>
  db.queryOne('SELECT * FROM stats WHERE description = @description', { description })

exports.list = () =>
  db.query('SELECT * FROM stats')

exports.increment = (description) =>
  exports.byDescription(description)
    .then(stat =>
      stat === undefined ?
        db.query(`
          INSERT INTO stats
              (description, value)
          VALUES
              (@description, 1)
        `, { description }) :
        db.query(`
          UPDATE stats
            SET value = value + 1
          WHERE description = @description
        `, { description })
    )
    .then(() => exports.byDescription(description))

exports.reset = (description) =>
  db.query('UPDATE stats SET value = 0 WHERE description = @description', { description })
    .then(() => exports.byDescription(description))
