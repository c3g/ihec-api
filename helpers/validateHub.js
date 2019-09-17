/*
 * validateHub.js
 */

const fs = require('fs')
const path = require('path')
const AJV = require('ajv')
const request = require('request-promise-native')
const { forEachTrack } = require('../models/dataHubs')


module.exports = validateHub


// Load schemas

const ajv = new AJV({ allErrors: true })
ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-04.json'))

const schemaDir   = path.join(__dirname, '../schemas')
const schemaFiles = fs.readdirSync(schemaDir)

schemaFiles.forEach(filename => {
  const basename = path.basename(filename, '.json')
  const schema = loadSchema(path.join(schemaDir, filename))

  ajv.addSchema(schema, basename)
})




/**
 * Validate dataHub
 *
 * @param {object} dataHub - The datahub object to validate
 * @param {object} options - Additionnal options
 * @param {boolean} options.extended - If extended validation should be performed (track urls validation)
 * @return {Promise} - A Promise that resolves to an object like { ok: true|false, errors: [...] }
 */
function validateHub(dataHub, options = {}) {

  let ok = ajv.validate('hub', dataHub)
  let errors = !ajv.errors ? [] : ajv.errors.map(e => e.dataPath + ' ' + e.message)

  if (options.extended === false)
    return Promise.resolve({ ok, errors })

  const requests = []
  forEachTrack({ data: dataHub }, (track, type, dataset, id, sample, hub, i) => {
    requests.push(validateURL(id, type, track.big_data_url))
  })

  return Promise.all(requests)
  .then(messages => {
    errors = errors.concat(messages.filter(Boolean))
    return { ok: errors.length === 0, errors }
  })
}


function validateURL(id, type, url, retries = 10) {
  return request.head(url)
    .then(() => Promise.resolve(undefined))
    .catch(err => {
      if (retries > 0)
        return validateURL(id, type, url, retries - 1)

      const message = `.datasets['${id}'].browser['${type}']: ${
        err.name === 'StatusCodeError' && err.statusCode === 404 ?
          'URL could not be found (404)' :
          `Track URL is not accessible (${err.message})`
      }`

      return message
    })
}

// Reads schema and returns it but with `file:...` occurences removed, because ajv
// doesnt support them.
function loadSchema(filepath) {
  const basename = path.basename(filepath, '.json')

  const content =
    fs.readFileSync(filepath)
      .toString()
      .replace(/file:.*?(\w+)\.json/g, (m, name) => name)

  const schema = JSON.parse(content)
  schema.id = basename

  traverse(schema, object => {
    if (object.format === 'md5')
      delete object.format
  })

  return schema
}

function traverse(root, fn) {
  fn(root)
  Object.keys(root).forEach(key => {
    const value = root[key]
    if (typeof value === 'object' && value !== null)
      traverse(value, fn)
  })
}
