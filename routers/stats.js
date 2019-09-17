/*
 * stats.js
 */


const express = require('express')
const router = express.Router()

const Stats = require('../models/stats')
const { dataHandler , errorHandler } = require('../helpers/handlers')


router.use('/list', (req, res) => {
  Stats.list()
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

router.post('/increment', (req, res) => {
  Stats.increment(req.body.description)
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

router.post('/reset', (req, res) => {
  Stats.reset(req.body.description)
  .then(dataHandler(res))
  .catch(errorHandler(res))
})


module.exports = router
