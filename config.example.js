/*
 * config.example.js
 *
 * This is an example configuration. The application requires a similar file,
 * named 'config.js' in the same folder as this one, in order to work.
 */

const fs = require('fs')
const path = require('path')

const mysqlConfigPath = '/home/edcc/config/.edccdb'

const [database, user, password] = fs.readFileSync(mysqlConfigPath).toString().trim().split(',')


module.exports = {
  port: 8000,
  mysql: {
    host:     'localhost',
    user:     user,
    password: password,
    database: database,
  },
  paths: {
    data: path.join(__dirname, '../../data'), // path to local dataHubs
    submissions: path.join(__dirname, '../../data/submissions'),
    tracks: '/var/www/tracks',
  },
  submissionEmail: 'k4xxc7qlol5h2dsh@ethereal.email',
  nodemailer: {
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'k4xxc7qlol5h2dsh@ethereal.email',
      pass: 'HbhhmV2MFq3x5KCzkE'
    }
  },
  galaxy: {
    library: 'TEST-IHEC',
    placeholder: '{arguments}',
    command: 'ssh ihec-dev.vhost38 "sudo -u ihec ssh ihec-galaxy-dev \\"/cvmfs/soft.galaxy/v2/server/.venv/bin/python ~/bin/Galaxy_API/transferDataSetIhec.py {arguments}\\""',
  },
}
