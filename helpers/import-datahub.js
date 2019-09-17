/*
 * import-datahub.js
 */


const os = require('os')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const writeFile = promisify(fs.writeFile)
const child_process = require('child_process')
const uuid = require('uuid').v4


module.exports = importDatahub

const IMPORT_SCRIPT_PATH = path.join(__dirname, '../../../scripts/edccdb/import_metadata/json_data_hubs/importDataHub.py')


/**
 * Import dataHub
 *
 * @param {object} dataHub - The datahub object to validate
 * @return {Promise} - A Promise that resolves to an object like { ok: true|false, errors: [...] }
 */
function importDatahub(dataHub) {

  const filepath = path.join(os.tmpdir(), 'datahub-' + uuid() + '.json')

  console.log('Path: ' + IMPORT_SCRIPT_PATH)
  console.log('Writing: ' + filepath)

  return writeFile(filepath, JSON.stringify(dataHub))
  .then(() => {
    return exec(`python ${IMPORT_SCRIPT_PATH} --yes --hub=${filepath}`)
  })
}


// Helpers

function exec(command) {
  return new Promise(function(resolve, reject) {
    child_process.exec(command, function(error, stdout, stderr) {
      if (error) {
        return reject(error)
      }

      resolve({stdout, stderr})
    })
  })
}
