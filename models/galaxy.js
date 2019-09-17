/*
 * galaxy.js
 */

const child_process = require('child_process')
const shellEscape = require('any-shell-escape')
const uuid = require('uuid/v4')
const config = require('../config')

module.exports = {
  createSession,
  getSessionResult,
}

const commands = new Map()

class GalaxySessionCommand {
  constructor(datasets) {
    this.id = uuid()
    this.isRunning = true
    this.success = null
    this.message = null
    this.url = null
    this.userID = null
    this.historyID = null
    this.email = null

    commands.set(this.id, this)

    this.start(datasets)
  }

  start(datasets) {
    const args = ['-l', config.galaxy.library]
    const command = config.galaxy.command.replace(config.galaxy.placeholder, shellEscape(args))

    const child = child_process.exec(command, this.callback.bind(this))
    child.stdin.setEncoding('utf-8')
    child.stdin.write(datasets.join('\n'))
    child.stdin.end()
  }

  startDeleteTimeout() {
    this.isRunning = false
    setTimeout(() => {
      commands.delete(this.id)
    }, 5 * 60 * 1000)
  }

  getID() {
    return this.id
  }

  getResult() {
    return {
      isRunning: this.isRunning,
      success:   this.success,
      message:   this.message,
      url:       this.url,
      userID:    this.userID,
      historyID: this.historyID,
      email:     this.email,
    }
  }

  callback(err, stdout, stderr) {
    this.startDeleteTimeout()

    const trimmedStdout = stdout.trim()
    const trimmedStderr = stderr.trim()

    if (err) {
      this.success = false
      this.message = err.message + ': ' + (trimmedStdout || trimmedStderr)
      return
    }

    const lines = trimmedStdout.split('\n')
    const lastIndex = lines.length - 1

    try {
      const result = JSON.parse(lines[lastIndex])

      this.success = true
      this.url = result.url
      this.userID = result.user_id
      this.historyID = result.history_id
      this.email = result.email
    } catch (err) {
      this.success = false
      this.message = err.message + ': ' + lines[lastIndex]
    }
  }
}

function createSession(datasets) {
  const sessionCommand = new GalaxySessionCommand(datasets)
  return sessionCommand.id
}

function getSessionResult(id) {
  const sessionCommand = commands.get(id)

  if (!sessionCommand)
    return Promise.reject(new Error(`Session ${id} doesn't exist`))

  return Promise.resolve(sessionCommand.getResult())
}

/*

INFO - 09/11/2018 02:22:37 PM - # NEW REQUEST #
INFO - 09/11/2018 02:24:01 PM - USER CREATED: user_name=DEvinBShe@galaxy.genap.ca id=f4ea604abc413f3c
INFO - 09/11/2018 02:24:02 PM - Files have been uploaded to history
{"url": "https://DEvinBShe@galaxy.genap.ca:Ew6qAtfbOxJUQZf@ihec-galaxy-dev.vhost38.genap.ca/galaxy/history/view_multiple\n", "emai": "DEvinBShe@galaxy.genap.ca", "history_id": "61352e7231fad1f5", "user_id": "f4ea604abc413f3c"}

*/
