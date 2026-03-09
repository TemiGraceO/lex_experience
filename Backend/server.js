// 🔥 COMPLETE SERVER.JS - EMAILS + CLOUDINARY + EVERYTHING WORKING
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require('cloudinary').v2;
const { Resend } = require("resend");

const app = express();

// ✅ RESEND EMAIL
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendLexEmail({ to, subject, html }) {
  try {
    await resend.emails.send({
      from: process.env.SENDER_EMAIL || 'Lex Xperience <no-reply@lexexperience.ng>',
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error("Email failed (non-blocking):", err.message);
  }
}

// ✅ CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Schemas
const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  school: String,
  registrationPayment: { reference: String, amount: Number },
  interest: String,
  file: String,
  fileUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const innovateSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: String,
  reference: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Registration = mongoose.model("Registration", registrationSchema);
const InnovateRegistration = mongoose.model("InnovateRegistration", innovateSchema);

// ✅ HEALTH CHECK (also wakes up the server on cold start)
app.get("/", (req, res) => res.send("✅ Lex Xperience Backend - All Systems Operational!"));

// ✅ CHECK EMAIL DUPLICATE
app.get("/check-email", async (req, res) => {
  try {
    const { email, type } = req.query;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (type === "innovate") {
      const existing = await InnovateRegistration.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
      });
      return res.json({ registered: !!existing });
    }

    // Default: check main Lex Xperience registration
    const existing = await Registration.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });
    return res.json({ registered: !!existing });

  } catch (err) {
    console.error("❌ check-email error:", err);
    return res.status(500).json({ success: false, message: "Check failed" });
  }
});

// 🔥 MAIN REGISTRATION ROUTE
app.post("/register", upload.single("regNumber"), async (req, res) => {
  try {
    const { name, email, school, paymentReference, amount, interest } = req.body;

    if (!name || !email || !school || !paymentReference) {
      return res.status(400).json({ success: false, message: "Missing registration data" });
    }

    // Check for duplicate before saving
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await Registration.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "This email is already registered." });
    }

    const registrationData = {
      name: name.trim(),
      email: normalizedEmail,
      school,
      interest: interest || "",
      registrationPayment: {
        reference: paymentReference,
        amount: Number(amount || 0),
      },
    };

    // Save to DB
    const saved = await Registration.create(registrationData);

    // Respond immediately
    res.json({ success: true, data: saved });

    // Background tasks (non-blocking)
    setImmediate(async () => {
      try {
        // Cloudinary upload
        if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'lex-experience/ids',
            resource_type: 'auto'
          });
          await Registration.updateOne(
            { _id: saved._id },
            { file: req.file.filename, fileUrl: result.secure_url }
          );
          console.log("✅ Cloudinary done:", result.secure_url);
        }

        // Confirmation email
        await sendLexEmail({
          to: normalizedEmail,
          subject: "✅ Lex Xperience 2026 Registration Confirmed!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #b99a2d;">Welcome to Lex Xperience 2026, ${registrationData.name}!</h2>
              <p>Your registration is <strong>confirmed</strong>. Here are your details:</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Ticket Type</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    ${registrationData.school === 'yes' ? 'ABU Student (₦5,000)' : 'General (₦12,000)'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Payment Ref</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${registrationData.registrationPayment.reference}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td>
                  <td style="padding: 8px; border: 1px solid #ddd;">₦${registrationData.registrationPayment.amount}</td>
                </tr>
              </table>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>📅 Event Details</h3>
                <p><strong>Date:</strong> March 31st – April 4th, 2026</p>
                <p><strong>Venue:</strong> Faculty of Law, ABU Zaria</p>
                <p>Bring this confirmation (printed or digital) to registration on the day.</p>
              </div>
              <p>Full programme schedule and logistics coming soon. Stay tuned!</p>
              <hr style="margin: 30px 0;">
              <p style="color: #666; font-size: 12px; text-align: center;">
                Lex Xperience 2026 | Law • Innovation • Northern Nigeria<br>
                <a href="mailto:lexxperience01@gmail.com" style="color: #b99a2d;">lexxperience01@gmail.com</a>
              </p>
            </div>
          `,
        });
      } catch (bgErr) {
        console.error("Background task failed:", bgErr);
      }
    });

  } catch (err) {
    console.error("❌ Register error:", err);
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "This email is already registered." });
    }
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
});

// ✅ GET FILE URL
app.get("/get-file/:email", async (req, res) => {
  try {
    const doc = await Registration.findOne({ email: req.params.email });
    if (doc?.fileUrl) {
      res.json({ success: true, fileUrl: doc.fileUrl });
    } else {
      res.json({ success: false, message: "No file found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Error" });
  }
});

// 🔥 LEX INNOVATE ROUTE
app.post("/innovate-pay", async (req, res) => {
  try {
    const { email, name, reference, amount } = req.body;

    if (!email || !reference) {
      return res.status(400).json({ success: false, message: "Missing Innovate payment data" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for duplicate innovate registration
    const existing = await InnovateRegistration.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "This email has already been registered for Lex Innovate." });
    }

    const doc = await InnovateRegistration.create({
      email: normalizedEmail,
      name: name ? name.trim() : "",
      reference,
      amount: Number(amount || 0),
    });

    res.json({ success: true, data: doc });

    // Send confirmation email (non-blocking)
    setImmediate(() => {
      sendLexEmail({
        to: normalizedEmail,
        subject: "Lex Innovate Pitch Registration Confirmed!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">Lex Innovate Pitch — You're In!</h2>
            <p>Your Lex Innovate registration is confirmed:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Payment Reference</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${reference}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">₦${Number(amount || 0)}</td>
              </tr>
            </table>
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>Next Steps</h3>
              <p>Present this confirmation at <strong>Day 4 (Lex Innovate Pitch)</strong>.</p>
              <p>Prepare your pitch deck and solution overview. Good luck — we're excited to see your innovation!</p>
            </div>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              Lex Xperience 2026 | Law • Innovation • Northern Nigeria<br>
              <a href="mailto:lexxperience01@gmail.com" style="color: #b99a2d;">lexxperience01@gmail.com</a>
            </p>
          </div>
        `,
      });
    });

  } catch (err) {
    console.error("❌ Innovate error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "This email has already been registered for Lex Innovate." });
    }
    return res.status(500).json({ success: false, message: "Innovate payment failed. Please try again." });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀Server running on port ${PORT}`);
});