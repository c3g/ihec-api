/*
 * handlers.js
 */


const errorHandler = res => err => {
  if (err instanceof Error)
    res.json({ ok: false, message: err.toString(), stack: err.stack.split('\n') })
  else
    res.json({ ok: false, message: err })
  res.end()
}

const dataHandler = res => data => {
  res.json({ ok: true, data: data })
  res.end()
}

const textHandler = res => text => {
  res.header('Content-Length', text.length)
  res.end(text)
}

module.exports = {
  errorHandler,
  dataHandler,
  textHandler,
}
