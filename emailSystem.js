const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "810e7b5c95243a",
    pass: "15a27d166385e4"
  }
});

async function testmail(){
    let body = `test`

    await transporter.sendMail({
        Form: "60307275@udst.edu.qa",
        to:"mahin1738@gmail.com",
        subject:"tets",
        html: body
    })
}

/**
 * Sends a 2FA code to the user's email.
 * @param {string} toEmail - Recipient email address
 * @param {string} code - The 6-digit 2FA code
 * @returns {Promise<void>}
 */
async function send2FACode(toEmail, code) {
  await transporter.sendMail({
    from: "no-reply@scheduleapp.com",
    to: toEmail,
    subject: "Your 2FA Login Code",
    html: `<p>Your login verification code is: <strong>${code}</strong></p>
           <p>This code expires in 3 minutes.</p>`
  })
}

/**
 * Sends a suspicious activity warning email.
 * @param {string} toEmail - Recipient email address
 * @returns {Promise<void>}
 */
async function sendSuspiciousActivityEmail(toEmail) {
  await transporter.sendMail({
    from: "no-reply@scheduleapp.com",
    to: toEmail,
    subject: "Suspicious Login Activity Detected",
    html: `<p>We detected multiple failed login attempts on your account.</p>
           <p>If this was not you, please contact your administrator.</p>`
  })
}

/**
 * Sends an account locked notification email.
 * @param {string} toEmail - Recipient email address
 * @returns {Promise<void>}
 */
async function sendAccountLockedEmail(toEmail) {
  await transporter.sendMail({
    from: "no-reply@scheduleapp.com",
    to: toEmail,
    subject: "Account Locked",
    html: `<p>Your account has been locked due to too many failed login attempts.</p>
           <p>Please contact your administrator to unlock it.</p>`
  })
}

module.exports = { send2FACode, sendSuspiciousActivityEmail, sendAccountLockedEmail }

testmail();