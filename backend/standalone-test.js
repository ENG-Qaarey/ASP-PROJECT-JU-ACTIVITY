const nodemailer = require('nodemailer');

async function test() {
    console.log('Starting standalone SMTP test...');

    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "muscabqaarey@gmail.com",
            pass: "abcdefghijklmnop",
        },
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('Connection successful!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: '"Test" <muscabqaarey@gmail.com>',
            to: "muscabqaarey@gmail.com",
            subject: "SMTP Test",
            text: "If you see this, your SMTP settings are correct!",
        });
        console.log('Email sent: ' + info.messageId);
    } catch (error) {
        console.error('SMTP Error:', error);
    }
}

test().catch(err => {
    console.error('TOP LEVEL ERROR:', err);
    process.exit(1);
});
