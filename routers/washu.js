/*
 * washu.js
 */


const express = require('express')
const router = express.Router()

const { dataHandler, errorHandler } = require('../helpers/handlers')
const { getDataHubs, getParams } = require('../helpers/dataHubs')
const Washu = require('../models/washu')
const Session = require('../models/session')
const Assembly = require('../models/assembly')

router.use((req, res, next) => {
  res.header('Accept-Ranges', 'bytes')
  return next()
})

router.use('/hub', (req, res) => {
  getParams({ session: req.query.session })
  .then(getDataHubs)
  .then(Washu.generateHub)
  .then(result => {
    res.json(result)
    res.end()
  })
  .catch(errorHandler(res))
})

module.exports = router
