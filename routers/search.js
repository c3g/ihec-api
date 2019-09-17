/*
 * search.js
 */

const express = require('express')
const router = express.Router()

const { dataHandler , errorHandler } = require('../helpers/handlers')
const { getDataHubs , getParams } = require('../helpers/dataHubs')
const { getValues, getKeyValues } = require('../models/dataHubs')
const { SEARCH_KEYS } = require('../constants')


router.use('/keys', (req, res) => {
  dataHandler(res)(SEARCH_KEYS)
})

router.use('/values/:key', (req, res) => {
  getParams(req.query)
  .then(getDataHubs)
  .then(getValues(req.params.key))
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

router.use('/key-values/:term', (req, res) => {
  getParams(req.query)
  .then(getDataHubs)
  .then(getKeyValues(req.params.term))
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

module.exports = router
