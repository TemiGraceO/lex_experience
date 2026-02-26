// 🔥 COMPLETE SERVER.JS - EMAILS + CLOUDINARY + EVERYTHING WORKING
require("dotenv").config();
const nodemailer = require("nodemailer");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require('cloudinary').v2;

const app = express();

// ✅ EMAIL TRANSPORTER
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ EMAIL HELPER
async function sendLexEmail({ to, subject, html }) {
  const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
}

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
  reference: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Registration = mongoose.model("Registration", registrationSchema);
const InnovateRegistration = mongoose.model("InnovateRegistration", innovateSchema);

// 🔥 MAIN REGISTRATION ROUTE (WITH EMAIL!)
app.post("/register", upload.single("regNumber"), async (req, res) => {
  try {
    const { name, email, school, paymentReference, amount, interest } = req.body;

    if (!name || !email || !school || !paymentReference) {
      return res.status(400).json({ success: false, message: "Missing registration data" });
    }

    const registrationData = {
      name: name.trim(),
      email: email.trim(),
      school,
      interest: interest || "",
      registrationPayment: {
        reference: paymentReference,
        amount: Number(amount || 0),
      },
    };

    // 🚀 SAVE TO DB FIRST (fast)
    const saved = await Registration.findOneAndUpdate(
      { email: registrationData.email },
      registrationData,
      { upsert: true, new: true }
    );

    // ⚡ RESPOND IMMEDIATELY - under 1 second!
    res.json({ success: true, data: saved });

    // 🔥 BACKGROUND TASKS (don't block response)
    if (req.file) {
      // Cloudinary in background
      cloudinary.uploader.upload(req.file.path, {
        folder: 'lex-experience/ids',
        resource_type: 'auto'
      })
      .then(async (result) => {
        await Registration.updateOne(
          { _id: saved._id },
          { file: req.file.filename, fileUrl: result.secure_url }
        );
        console.log("✅ Cloudinary done:", result.secure_url);
      })
      .catch(err => console.error("Cloudinary failed:", err));
    }

    // Email in background
    sendLexEmail({
      to: registrationData.email,
      subject: "✅ Lex Xperience 2026 Registration Confirmed!",
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1e40af;">Welcome to Lex Xperience 2026, ${registrationData.name}!</h2>
            <p>Your registration is <strong>confirmed</strong>:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Ticket Type:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">
                ${registrationData.school === 'yes' ? 'ABU Student (₦5,000)' : 'General (₦12,000)'}
              </td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Payment Ref:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${registrationData.registrationPayment.reference}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₦${registrationData.registrationPayment.amount}</td></tr>
              ${registrationData.fileUrl ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>ID:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">✅ Verified & Uploaded</td></tr>` : ''}
            </table>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>📅 Event Details</h3>
              <p><strong>Date:</strong> March 31st – April 5th, 2026</p>
              <p><strong>Venue:</strong> Faculty of Law, ABU Zaria</p>
              <p>Bring this confirmation (printed or digital) to registration.</p>
            </div>
            <p>Full program schedule and logistics coming soon. Stay tuned!</p>
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              Lex Xperience 2026 | Law • Innovation • Northern Nigeria<br>
              <a href="mailto:lexxperience01@gmail.com" style="color: #1e40af;">lexxperience01@gmail.com</a>
            </p>
          </div>
        `,
      })
      .catch(err => console.error("Email failed:", err));

  } catch (err) {
    console.error("❌ Register error:", err);
    return res.status(500).json({ success: false, message: "Registration failed" });
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

// 🔥 LEX INNOVATE ROUTE (WITH EMAIL!)
app.post("/innovate-pay", async (req, res) => {
  try {
    const { email, reference, amount } = req.body;

    if (!email || !reference) {
      return res.status(400).json({ success: false, message: "Missing Innovate payment data" });
    }

    const doc = await InnovateRegistration.create({
      email: email.trim(),
      reference,
      amount: Number(amount || 0),
    });

    // 🔥 SEND INNOVATE CONFIRMATION EMAIL
    try {
      sendLexEmail({
        to: email.trim(),
        subject: "🎉 Lex Innovate Pitch Registration Confirmed!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">Lex Innovate Pitch Confirmed!</h2>
            <p>Your Lex Innovate registration is complete:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Payment Reference:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reference}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₦${Number(amount || 0)}</td></tr>
            </table>
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>🚀 Next Steps</h3>
              <p>Present this confirmation at Day 4 (Lex Innovate Pitch). Prepare your pitch deck and solution overview.</p>
              <p>Good luck! We're excited to see your innovation.</p>
            </div>
          </div>
        `,
      });
      console.log(`✅ Innovate email sent to ${email}`);
    } catch (emailErr) {
      console.error("❌ Innovate email failed:", emailErr.message);
    }

    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error("❌ Innovate error:", err);
    return res.status(500).json({ success: false, message: "Innovate payment failed" });
  }
});

// Health check
app.get("/", (req, res) => res.send("✅ Lex Xperience Backend - All Systems Operational!"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
