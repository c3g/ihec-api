/*
 * galaxy.js
 */

const express = require('express')
const router = express.Router()

const { dataHandler, errorHandler } = require('../helpers/handlers')
const { getDataHubs, getParams } = require('../helpers/dataHubs')
const Galaxy = require('../models/galaxy')
const Session = require('../models/session')
const DataHubs = require('../models/dataHubs')

router.use('/create-session', (req, res) => {
  const params = Session.parseParams(req.body)

  getParams(params)
  .then(getDataHubs)
  .then(DataHubs.merge)
  .then(hub => {

    const datasets = []

    DataHubs.forEachTrack({ data: hub }, track => {
      datasets.push(track.big_data_url.replace(/^.*?tracks/, ''))
    })

    return Galaxy.createSession(datasets)
  })
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

router.use('/get-session-result/:id', (req, res) => {
  Galaxy.getSessionResult(req.params.id)
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

module.exports = router
