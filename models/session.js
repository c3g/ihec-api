/*
 * session.js
 */


const db = require('../db')
const k = require('../constants')

const Build = require('./build')


exports.get = (sessionID) =>
  db.queryExactlyOne('SELECT * FROM session WHERE id = @sessionID', { sessionID })
    .then(normalizeSession)

exports.getAccession = (accessionID) =>
  db.queryExactlyOne(`SELECT s.*
                 FROM session as s
                 JOIN session_accession as a ON a.session_id = s.id
               WHERE a.accession = @accessionID`,
    { accessionID })
    .then(normalizeSession)

exports.create = (session) =>
  Build.getByName(session.build || k.DEFAULT_BUILD_NAME)
  .then(build =>
    db.insert(`
      INSERT INTO session ( build_id
                          , dataset_id_list
                          , parameter_list
                          , assembly_id
                          , creation_date)
                   VALUES ( @buildID
                          , @datasets
                          , @params
                          , @assembly
                          , NOW())`,
    { ...session, buildID: build.id }))

exports.createAccession = (sessionID) =>
  db.queryOne(`
      SELECT MAX(CONVERT(SUBSTR(accession, 7), UNSIGNED INTEGER)) AS id
        FROM session_accession`)
    .then(result => 'IHECDP' + (result.id + 1).toString().padStart(8, '0'))
    .then(accessionID =>
      db.insert(`
          INSERT INTO session_accession ( accession, session_id )
                                 VALUES ( @accessionID, @sessionID )`,
        { sessionID, accessionID })
      .then(() => accessionID))

exports.parseParams = (session) => {
  const params = parseURLParameters(session.params)
  return {
    assembly: params.assembly,
    build:    params.build,
    external: params.external,
    search:   params.search ? JSON.parse(params.search) : undefined,
    datasets: new Set(session.datasets)
  }
}




function normalizeSession(session) {
  session.params = session.parameter_list
  try {
    session.datasets = JSON.parse(session.dataset_id_list)
  } catch(e) {
    session.datasets = session.dataset_id_list.split(',')
  }
  delete session.parameter_list
  delete session.dataset_id_list
  return session
}

function parseURLParameters(string) {
  return string.replace(/^\s*\?/, '')
    .split('&')
    .filter(pair => pair !== '')
    .map(pair => pair.split('='))
    .reduce((acc, [key, value]) => {
      acc[decodeURIComponent(key)] = decodeURIComponent(value)
      return acc
    }, {})
}
