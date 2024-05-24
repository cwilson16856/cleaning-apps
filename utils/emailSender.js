const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

// Validate environment variables for email configuration
const validateEmailConfig = () => {
    const requiredConfigs = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
    const missingConfigs = requiredConfigs.filter(config => !process.env[config]);
    if (missingConfigs.length > 0) {
        throw new Error(`Missing required email configuration environment variables: ${missingConfigs.join(', ')}`);
    }
};

validateEmailConfig();

// Create a reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Send email function
const sendEmail = async (emailOptions) => {
    try {
        let info = await transporter.sendMail(emailOptions);
        console.log(`Email sent: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending email: ${error.message}`, error);
        throw error; // Rethrow the error after logging
    }
};

module.exports = { sendEmail };