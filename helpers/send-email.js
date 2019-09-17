/*
 * mail.js
 */



const nodemailer = require('nodemailer')
const config = require('../config.js')

const transporter = nodemailer.createTransport(config.nodemailer)

module.exports = sendEmail

function sendEmail(options) {
  return new Promise((resolve, reject) => {
    transporter.sendMail(options, (err, info) => {
      if (err) {
        reject(err)
      } else {
        /* eslint-disable no-console */
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        /* eslint-enable no-console */

        resolve(info)
      }
    })
  })
}

