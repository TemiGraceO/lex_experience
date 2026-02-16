const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');

// POST /api/register - Save registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, school, idCardFileName, interest, ticketType, amount } = req.body;

    // Validate required fields
    if (!name || !email || !school || !ticketType || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields" 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email format" 
      });
    }

    // Check if email already registered
    const existing = await Registration.findOne({ email });
    if (existing) {
      return res.json({ 
        success: false, 
        message: "This email is already registered",
        existingRegistration: true
      });
    }

    // Create new registration
    const registration = new Registration({
      name,
      email,
      school,
      idCardFileName,
      interest,
      ticketType,
      amount,
      paymentStatus: 'pending'
    });

    await registration.save();

    res.json({ 
      success: true, 
      message: "Registration saved successfully",
      registrationId: registration._id
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error. Please try again." 
    });
  }
});

// POST /api/update-payment - Update payment status
router.post('/update-payment', async (req, res) => {
  try {
    const { email, reference, status } = req.body;

    if (!email || !reference) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and reference required" 
      });
    }

    const updated = await Registration.findOneAndUpdate(
      { email },
      { 
        paymentStatus: status || 'paid',
        paymentReference: reference,
        paidAt: new Date()
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        message: "Registration not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Payment status updated",
      registration: updated
    });

  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

// GET /api/registrations - Get all registrations (admin only)
router.get('/registrations', async (req, res) => {
  try {
    // Add admin authentication in production
    const registrations = await Registration.find()
      .sort({ createdAt: -1 })
      .select('-__v'); // Exclude version key

    res.json({ 
      success: true, 
      count: registrations.length,
      data: registrations 
    });

  } catch (error) {
    console.error("Get registrations error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
});

module.exports = router;