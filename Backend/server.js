// server.js
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// ⚠️ REPLACE THESE WITH YOUR ACTUAL DETAILS
const PAYSTACK_SECRET_KEY = "sk_test_c19274b06e0b4b223ac4216f82aa230dfecb7b8c"; 
const EMAIL_USER = "graceolorunfemi96@gmail.com";      // Your Gmail address
const EMAIL_PASS = "mlursnupwpnfhxma";          // Your Gmail App Password (16 chars)

// Nodemailer Transporter (Configures how to send email)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

// Route to handle email sending
app.post('/api/send-confirmation', async (req, res) => {
    const { reference, email, name } = req.body;

    if (!reference || !email) {
        return res.status(400).json({ message: "Missing details" });
    }

    try {
        // 1. Verify the payment with Paystack
        const response = await axios.get(
            `https://api.paystack.co/transaction/verify/${reference}`,
            { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
        );

        const data = response.data;

        if (data.data.status !== 'success') {
            return res.status(400).json({ message: "Payment not successful" });
        }

        // 2. Send the Confirmation Email
        const mailOptions = {
            from: '"Lex Xperience Team" <graceolorunfemi96@gmail.com>',
            to: email,
            subject: "Registration Confirmed: Lex Xperience 2026 🎉",
            html: `
                <div style="font-family: sans-serif; color: #333;">
                    <h2>Welcome, ${name}!</h2>
                    <p>Your payment of ₦${data.data.amount / 100} has been verified.</p>
                    <p><strong>Reference:</strong> ${reference}</p>
                    <p>We are excited to have you at Lex Xperience 2026.</p>
                    <br>
                    <p>See you there!</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: "Email sent" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

app.listen(3000, () => console.log("Server running on port 3000"));