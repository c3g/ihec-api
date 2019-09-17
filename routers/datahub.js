/*
 * datahub.js
 */

const fs = require('fs')
const path = require('path')
const util = require('util')
const writeFile = util.promisify(fs.writeFile)
const express = require('express')
const router = express.Router()
const request = require('request-promise-native')
const sanitizeFilename = require('sanitize-filename')

const k = require('../constants')
const config = require('../config')
const sendEmail = require('../helpers/send-email')
const validateHub = require('../helpers/validateHub')
const { dataHandler, textHandler, errorHandler } = require('../helpers/handlers')
const { getDataHubs, getParams, fetchExternalHub } = require('../helpers/dataHubs')
const DataHubs = require('../models/dataHubs')
const Institutions = require('../models/institutions')
const Species = require('../models/species')


// getDataHub
router.use('/get', (req, res) => {
  getParams(req.query)
  .then(getDataHubs)
  .then(hubs => {
    res.contentType('application/json')
    res.write(JSON.stringify(DataHubs.merge(hubs), null, req.query.pretty ? '  ' : null))
    res.end()
  })
  .catch(errorHandler(res))
})

// getGridJSON
router.use('/grid', (req, res) => {
  Promise.all([
      getParams(req.query).then(getDataHubs)
    , Institutions.byName()
    , Species.byTaxonID()
  ])
  .then(([hubs, institutions, species]) => {

    const datasets =
      hubs.reduce((acc, hub) =>
        acc.concat(DataHubs.generateDatasets(
          hub.data,
          Object.assign(hub.context, { institutions, species })))
        , [])

    return { keys: k.GRID_RECORD_KEYS, items: datasets }
  })
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

// Get samples' CSV
router.use('/csv', (req, res) => {
  getParams(req.query)
  .then(getDataHubs)
  .then(hubs => {
    const datahub = DataHubs.merge(hubs)

    res.setHeader('content-disposition', `attachment; filename=samples${req.query.session ? '-' + req.query.session : ''}.csv`)
    res.contentType('text/csv')
    res.write(DataHubs.generateSamplesCSV(datahub))
    res.end()
  })
  .catch(errorHandler(res))
})

// Download tracks
router.use('/download', (req, res) => {
  const format = req.query.format || 'json'

  getParams(req.query)
  .then(getDataHubs)
  .then(format === 'text' ?
      DataHubs.getTracksAsText
    : DataHubs.getTracksAsJSON)
  .then(format === 'text' ?
      textHandler(res)
    : dataHandler(res))
  .catch(errorHandler(res))
})

// Get url markdown
router.use('/markdown', (req, res) => {
  const url = req.query.url

  request(url)
  .then(textHandler(res))
  .catch(errorHandler(res))
})

/**
 * @param {Array<string>} req.body - urls to validate
 */
router.use('/validate-urls', (req, res) => {
  const urls = req.body

  Promise.all(
    urls.map(url =>
      fetchExternalHub(url)
      .then(hub => validateHub(hub.data))
      .then(({ ok, errors }) =>
        ({ source: url, ok, errors, isCritical: false }))
      .catch(err =>
        Promise.resolve({ source: url, ok: false, errors: [err.message], isCritical: true}))
    )
  )
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

router.use('/validate', (req, res) => {
  const dataHub = req.body

  validateHub(dataHub, { extended: true })
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

router.use('/submit', (req, res) => {
  const submission = req.body

  validateHub(submission.dataHub, { extended: true })
  .then(validation => {
    if (validation.ok === false)
      return Promise.reject(validation.errors)

    const filename = `datahub_${submission.email}_${new Date().toISOString()}.json`
    const filepath = path.join(config.paths.submissions, filename)
    const content = JSON.stringify(submission.dataHub, null, '  ')

    return writeFile(filepath, content)
    .then(() =>
      sendEmail({
        from: submission.email,
        to: config.submissionEmail,
        subject: `Datahub Submitted by ${submission.name}`,
        html: `
          A new datahub has been submitted by <strong>${submission.name}</strong>.<br/>
          Contact email: <a href="mailto:${submission.email}">${submission.email}</a><br/>
          Comments: <br/>
          <pre>${submission.comments}</pre><br/>
          Saved as: ${filepath}
        `,
        attachments: [{
          filename: 'dataHub.json',
          content: content
        }],
      })
    )
  })
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

router.use('/get-description', (req, res) => {
  const url = req.query.external

  fetchExternalHub(url)
  .then(hub => {
    res.json(hub.data.hub_description)
    res.end()
  })
  .catch(errorHandler(res))
})

module.exports = router
