const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mick.tz@hotmail.de',
        subject: "Thanks for joining or whatever, we don't case!",
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.` // syntatic sugar usin backtics
    })
}

const sendUnsubscribeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'mick.tz@hotmail.de',
        subject: 'Goodbye A$%hole!',
        text: `Service was free A-hole! Thanks for clearing our servers ${name}.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendUnsubscribeEmail
}
