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
    port: 465,
    secure: true,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 15000,
    socketTimeout: 15000,
    pool: {
        maxConnections: 3,
        maxMessages: 100,
        rateDelta: 5000,
        rateLimit: 10
    }
});

// Don't verify on startup - verify on first email send instead
let smtpVerified = false;

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

        // Retry logic for sending email
        let lastError;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                await transporter.sendMail(mailOptions);
                res.status(200).json({ success: 'Message sent successfully!' });
                return;
            } catch (error) {
                lastError = error;
                console.error(`Email send attempt ${attempt} failed:`, error.message);
                
                if (attempt < 3) {
                    // Wait before retrying (exponential backoff: 2s, 4s)
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        
        throw lastError;
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
