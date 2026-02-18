require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
    console.log('--- Testing SMTP from .env file ---');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ SUCCESS: Connection to SMTP server is working!');

        console.log('Sending test email to yourself...');
        await transporter.sendMail({
            from: `"${process.env.APP_NAME}" <${process.env.SMTP_FROM}>`,
            to: process.env.SMTP_USER,
            subject: "JU Activity Hub - SMTP Test",
            text: "If you see this, your SMTP settings are 100% correct!",
        });
        console.log('✅ SUCCESS: Test email sent!');
    } catch (error) {
        console.error('❌ FAILED: SMTP Error detected:');
        if (error.responseCode === 535) {
            console.error('   -> Error 535: Invalid Password. You MUST use a Google App Password.');
            console.error('   -> Go to: https://myaccount.google.com/security -> App Passwords');
        } else {
            console.error('   ->', error.message);
        }
    }
}

test();
