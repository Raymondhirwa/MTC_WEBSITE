require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json()); // To parse JSON bodies
app.use(
    cors({
        origin: '*'
    })
);

// Email Transporter Configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
    pool: {
        maxConnections: 5,
        maxMessages: 100,
        rateDelta: 4000,
        rateLimit: 14
    },
    logger: true,
    debug: true
});

// Verify SMTP connection
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Connection Error:', error);
    } else {
        console.log('✅ SMTP Server connected successfully');
    }
});

// POST route to handle form submission
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation for missing fields
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: 'All fields are required!' });
        }

        const mailOptions = {
            from: email,
            to: process.env.EMAIL_USER,
            subject: `New Contact Form Submission: ${subject}`,
            text: `You have received a new message from your website contact form.

Name: ${name}
Email: ${email}
Subject: ${subject}
Message:
${message}`
        };

        // Send Email
        await transporter.sendMail(mailOptions);
        
        // Respond on success
        res.status(200).json({ success: 'Message sent successfully!' });
    } catch (error) {
        console.error('FULL EMAIL ERROR:', error);
        res.status(500).json({
            error: 'Failed to send message.',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running beautifully on http://localhost:${PORT}`);
});
