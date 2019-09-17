/*
 * ucsc.js
 */

const express = require('express')
const router = express.Router()

const { textHandler, errorHandler } = require('../helpers/handlers')
const { getDataHubs, getParams } = require('../helpers/dataHubs')
const UCSC = require('../models/ucsc')
const Session = require('../models/session')
const Assembly = require('../models/assembly')

router.use((req, res, next) => {
  res.header('Accept-Ranges', 'bytes')
  return next()
})

router.use('/hub', (req, res) => {
  Promise.resolve(UCSC.generateHub(req.query.session))
  .then(textHandler(res))
  .catch(errorHandler(res))
})

router.use('/genome', (req, res) => {
  Session.get(req.query.session)
  .then(session =>
    Assembly.get(session.assembly_id)
    .then(assembly =>
      UCSC.generateGenome(session.id, assembly.name)))
  .then(textHandler(res))
  .catch(errorHandler(res))
})

router.use('/track-db', (req, res) => {
  getParams({ session: req.query.session })
  .then(getDataHubs)
  .then(UCSC.generateTracks)
  .then(textHandler(res))
  .catch(errorHandler(res))
})

module.exports = router
