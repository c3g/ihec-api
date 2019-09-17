#!/usr/bin/env node
/*
 * index.js
 */

// Solves https://stackoverflow.com/questions/36628420/nodejs-request-hpe-invalid-header-token
process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser

const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')

const config = require('./config')



const app = express()

app.use(morgan('dev'))
app.use(bodyParser.json({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))


app.use('/datahub', require('./routers/datahub'))
app.use('/galaxy',  require('./routers/galaxy'))
app.use('/search',  require('./routers/search'))
app.use('/session', require('./routers/session'))
app.use('/stats',   require('./routers/stats'))
app.use('/ucsc',    require('./routers/ucsc'))
app.use('/washu',   require('./routers/washu'))
app.use('/rnaget',  require('./routers/rnaget'))


// 404 Handler
app.use((req, res) => {
  console.log(req.url)
  res.status(404)
  res.json({ ok: false, message: '404', url: req.url, method: req.method })
})

app.listen(config.port)

console.log(`Listening on port ${config.port}`)
