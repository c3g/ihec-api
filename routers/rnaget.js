/*
 * rnaget.js
 */


const os = require('os')
const fs = require('fs')
const util = require('util')
const path = require('path')
const express = require('express')
const router = express.Router()
const request = require('request-promise-native')
const { BigWig } = require('@gmod/bbi')
const loompy = require('loompy')
const removeFile = util.promisify(fs.unlink)
const fileExists = util.promisify(fs.exists)
const { range } = require('rambda')
const uuid = require('uuid')

const k = require('../constants')
const config = require('../config')
const validateHub = require('../helpers/validateHub')
const { getDataHubs, getParams, fetchExternalHub } = require('../helpers/dataHubs')
const Datahubs = require('../models/dataHubs')
const Institutions = require('../models/institutions')
const Species = require('../models/species')
const Session = require('../models/session')


// Projects

router.use('/projects/search/filters', emptyArray)
router.use('/projects/search', projectSearch)
router.use('/projects/:projectId', projectGet)

function projectGet(req, res) {
  Institutions.selectById(req.params.projectId)
  .then(institutionToProject)
  .then(success(res))
  .catch(failure(res))
}

function projectSearch(req, res) {
  Institutions.selectAll()
  .then(mapFn(institutionToProject))
  .then(success(res))
  .catch(failure(res))
}

// Studies

router.use('/studies/search/filters', emptyArray)
router.use('/studies/search', studySearch)
router.use('/studies/:studyId', studyGet)

function studyGet(req, res) {
  Institutions.selectById(req.params.studyId)
  .then(institutionToStudy)
  .then(success(res))
  .catch(failure(res))
}

function studySearch(req, res) {
  Institutions.selectAll()
  .then(mapFn(institutionToStudy))
  .then(success(res))
  .catch(failure(res))
}

// Expressions

router.use('/expressions/formats', unimplemented)
router.use('/expressions/search/filters', unimplemented)
router.use('/expressions/search', unimplemented)
router.use('/expressions/:expressionId', unimplemented)

// Continuous

router.use('/continuous/formats', continuousFormats)
router.use('/continuous/search/filters', unimplemented)
router.use('/continuous/search', unimplemented)
router.use('/continuous/:continuousId', continuousGet)

function continuousFormats(req, res) {
  Promise.resolve(['loom'])
  .then(success(res))
  .catch(failure(res))
}

function continuousGet(req, res) {
  const { continuousId } = req.params
  const { chr, start, end } = req.query
  const id = [continuousId, chr, start, end, uuid.v4()].join('-')
  const loomFilename = `${id}.loom`
  const loomFilepath = path.join(os.tmpdir(), loomFilename)

  Session.getAccession(continuousId)
  .then(Session.parseParams)
  .then(getDataHubs)
  .then(Datahubs.getTracksAsExtendedJSON)
  .then(tracks => tracks.filter(t => /(bw|bigwig)$/i.test(t.url)))
  .then(tracks => createLoom(loomFilepath, chr, start, end, tracks))
  .then(() => {
    res.setHeader('content-disposition', 'attachment; filename=' + loomFilename)
    res.setHeader('content-type', 'application/vnd.loom')
    const stream = fs.createReadStream(loomFilepath)
    stream.pipe(res)
    stream.on('end', () => {
      removeFile(loomFilepath)
    })
  })
  // .then(success(res))
  .catch(failure(res))
}

module.exports = router

// Helpers

function createLoom(loomFilepath, chr, start, end, tracks) {
  return Promise.all(tracks.map(track => {
    const filepath = path.join(config.paths.tracks, track.url.replace(/^.*?tracks/, ''))
    return readBigwigValue(filepath, chr, start, end)
  }))
  .then(values => {

    const rowAttrs = { tracks: tracks.map(t => [t.id, t.type].join(':')), sampleID: tracks.map(t => t.sampleID) }
    const colAttrs = { positions: range(start, end + 1)  }

    loompy.create(loomFilepath, values, rowAttrs, colAttrs) // FIXME(synchronous call, should be async)

    return
  })
}

/**
 * @param {string} filepath
 * @param {string} [refName]
 * @param {number} [start]
 * @param {number} [end]
 * @return {Promise<TypedArray>}
 */
async function readBigwigValue(filepath, refName, start, end) {
  const file = new BigWig({ path: filepath })
  const header = await file.getHeader()
  const ref = header.refsByName[refName]
  if (refName !== undefined && start === undefined)
    start = 0
  if (refName !== undefined && end === undefined)
    end = ref.length

  if (refName !== undefined && start < 0)
    throw new Error('Out of bounds: "start" is lower than 0')
  if (refName !== undefined && start > end)
    throw new Error('Out of bounds: "start" is higher than "end"')
  if (refName !== undefined && end > ref.length)
    throw new Error('Out of bounds: "end" is higher than length')

  // Case 1: get part of the file
  if (refName !== undefined) {
    const length = end - start
    const data = new Float32Array(length).fill(NaN)
    const entries = await file.getFeatures(refName, start, end, { scale: 1 })
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      for (let position = entry.start; position < entry.end; position++) {
        data[position] = entry.score
      }
    }
    return data
  }

  // Case 2: get whole file
  const length = getFullLength(header)
  const data = new Float32Array(length).fill(NaN)

  let offset = 0

  for (let key in header.refsByNumber) {
    const ref = header.refsByNumber[key]
    const entries = await file.getFeatures(ref.name, 0, ref.length, { scale: 1 })

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      for (let position = entry.start; position < entry.end; position++) {
        data[offset + position] = entry.score
      }
    }

    offset += ref.length
  }

  return data
}

function getFullLength(header) {
  let length = 0
  for (let key in header.refsByNumber) {
    const ref = header.refsByNumber[key]
    length += ref.length
  }
  return length
}

function institutionToProject(institution) {
  return {
    id: String(institution.id),
    tags: [],
    name: institution.name,
    description: institution.site_url
  }
}

function institutionToStudy(institution) {
  return {
    id: String(institution.id),
    tags: [],
    name: institution.name,
    description: institution.site_url,
    parentProjectID: String(institution.id), // One study per project
  }
}

function mapFn(fn) {
  return (list) => console.log(list) || list.map(fn)
}

function emptyArray(req, res) {
  res.send([])
  res.end()
}

function success(res) {
  return (result) => {
    res.send(result)
    res.end()
  }
}

function failure(res, status = 400) {
  return (err) => {
    res.status(status)
    res.send({ message: err.message, stack: err.stack })
    res.end()
  }
}

function unimplemented(req, res) {
  res.status(501).send('Not Implemented')
}
