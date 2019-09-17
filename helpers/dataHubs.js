/*
 * dataHubs.js
 */

const fs   = require('fs')
const path   = require('path')
const { promisify } = require('util')
const fetch = require('isomorphic-fetch')

const readFile = promisify(fs.readFile)

const compileQuery = require('./search-query')
const DataHubs = require('../models/dataHubs')
const Session = require('../models/session')

const config = require('../config')


module.exports = {
  readLocalHub,
  fetchExternalHub,
  getDataHubs,
  getParams
}


// Container class
class Hub {
  constructor(data, context = {}) {
    this.data = data
    this.context = context
  }
  map(fn) {
    return new Hub(fn(this.data, this.context), this.context)
  }
  chain(fn) {
    const { data, context } = fn(this.data, this.context)
    return new Hub(data, context)
  }
  join(fn) {
    return fn(this.data, this.context)
  }
}


function readLocalHub(assembly, build, context = {}) {
  const filename = `${assembly}.${build}.json`
  const filepath = path.join(config.paths.data, filename)

  return readJSON(filepath)
    .then(data =>
      new Hub(data, { source: `Build ${build} (${assembly})`, isExternal: false, build, ...context }))
}

function fetchExternalHub(url, context = {}) {
  return fetchJSON(url)
    .then(data =>
      new Hub(data, { source: url, isExternal: true, ...context }))
}

// Returns a promise that resolves to the hubs specified in params
function getDataHubs(params) {
  const { assembly, build, external, search, datasets } = params

  const externalHubLinks = external ? external.split(',') : []

  const dataHubs = []

  if (assembly || build) {
    if (!build)
      return Promise.reject('Missing parameter `build`')
    if (!assembly)
      return Promise.reject('Missing parameter `assembly`')
    dataHubs.push(readLocalHub(assembly, build, { params }))
  }

  if (externalHubLinks.length > 0) {
    dataHubs.push(
      ...externalHubLinks.map(link =>
        fetchExternalHub(link, { params })))
  }

  if (!search && !datasets)
    return Promise.all(dataHubs)

  const searchPredicate   = search ? compileQuery(search) : () => true
  const datasetsPredicate = (datasets.size > 0) ? (item => datasets.has(item.id)) : () => true

  const predicate = item => searchPredicate(item) && datasetsPredicate(item)

  return Promise.all(dataHubs)
    .then(hubs =>
      hubs.map(hub =>
        hub.map(data => DataHubs.filter(data, predicate))))
}

// Returns a promise that resolves to the query parameters
function getParams(query) {
  const { session, accession } = query

  if (session)
    return Session.get(session)
            .then(session => Session.parseParams(session))

  if (accession)
    return Session.getAccession(accession)
            .then(session => Session.parseParams(session))

  const datasets =
         query.datasets instanceof Set ? query.datasets :
    typeof query.datasets === 'string' ? new Set(query.datasets.split(',')) :
         Array.isArray(query.datasets) ? new Set(query.datasets) : []

  const params = {
    assembly: query.assembly,
    build:    query.build,
    external: query.external,
    search:   parseJSONorUndefined(query.search),
    datasets: datasets,
  }

  return Promise.resolve(params)
}



// Helpers

function readJSON(path) {
  return readFile(path).then(buffer => JSON.parse(buffer.toString()))
}

function fetchJSON(url) {
  return fetch(url)
    .catch(err => {
      if (err.code === 'ENOTFOUND')
        return Promise.reject({
          message: 'URL was not found. Check that you have an existent URL.'
        })
      return Promise.reject(err)
    })
    .then(res => res.text())
    .then(content => {
      try {
        return JSON.parse(content)
      } catch(e) {
        return Promise.reject({
          message: 'Content is not a JSON file or contains a syntax error.'
        })
      }
    })
}

function parseJSONorUndefined(input) {
  try {
    return JSON.parse(input)
  } catch (err) {
    return undefined
  }
}
