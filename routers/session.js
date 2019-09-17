/*
 * session.js
 */

const express = require('express')
const router = express.Router()
const Session = require('../models/session')
const { dataHandler , errorHandler } = require('../helpers/handlers')


router.post('/create', (req, res) => {
  Session.create(req.body)
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

router.post('/create-accession', (req, res) => {
  Session.createAccession(req.body.sessionID)
  .then(dataHandler(res))
  .catch(errorHandler(res))
})

router.use('/:id', (req, res) => {
  Session.get(req.params.id)
  .then(session => session)
  .then(dataHandler(res))
  .catch(errorHandler(res))
})


module.exports = router
