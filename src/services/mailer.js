const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    tls: {
        rejectUnauthorized: false
    }
});

async function sendMerchandiseEmail(subject, htmlContent) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yuhmak.com',
            to: process.env.EMAIL_RECIPIENTS,
            subject: subject,
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        await logger.info(`Correo enviado exitosamente: ${subject} - ID: ${info.messageId}`);
        return true;
    } catch (error) {
        await logger.error(`Error al enviar el correo: ${subject}`, error);
        throw error;
    }
}

module.exports = { sendMerchandiseEmail };
