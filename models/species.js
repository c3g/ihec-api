/*
 * species.js
 */


const db = require('../db')

exports.byTaxonID = () =>
  db.query('SELECT taxon_id, common_name FROM species')
    .then(results => {
      const byTaxonID = {}
      results.forEach(r => {
        byTaxonID[r.taxon_id] = r.common_name
      })
      return byTaxonID
    })
