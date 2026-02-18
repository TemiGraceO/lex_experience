require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');
const cors = require('cors');
const registerRoutes = require('./routes/register')

const app = express();
app.use(cors({ 
  origin: process.env.FRONTEND_URL || '*',
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api', registerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Lex Xperience API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found" 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ 
    success: false, 
    message: "Internal server error" 
  });
});

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
});