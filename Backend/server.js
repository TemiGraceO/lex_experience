require("dotenv").config();
const nodemailer = require("nodemailer");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const mongoose = require("mongoose");

const app = express();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // or true if you use port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
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

// Ensure uploads dir exists (in tmp for Render)
app.use(express.static(path.join(__dirname, 'public')));
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Mongo connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Schemas/models

const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  school: String,
  registrationPayment: {
    reference: String,
    amount: Number,
  },
  interest: String,
  file: String,
  fileUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const innovateSchema = new mongoose.Schema({
  email: { type: String, required: true },
  reference: { type: String, required: true },
  amount: { type: Number, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Registration = mongoose.model("Registration", registrationSchema);
const InnovateRegistration = mongoose.model("InnovateRegistration", innovateSchema);

// ---------- Routes ----------

// Main Lex registration (with optional file)
app.post("/register", upload.single("regNumber"), async (req, res) => {
  try {
    const { name, email, school, paymentReference, amount, interest } = req.body;

    if (!name || !email || !school || !paymentReference) {
      return res.status(400).json({
        success: false,
        message: "Missing registration data",
      });
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

    if (req.file) {
      // ✅ STORE FULL DOWNLOAD URL
      const fileUrl = `https://lex-experience.vercel.app/uploads/${req.file.filename}`;
      registrationData.file = req.file.filename;
      registrationData.fileUrl = fileUrl;  // ← NEW: Complete URL
    }

    const saved = await Registration.findOneAndUpdate(
      { email: registrationData.email },
      registrationData,
      { upsert: true, new: true } // new = returnDocument:"after"
    );

// send confirmation email (non-blocking but awaited here so you can catch errors)
try {
  await sendLexEmail({
    to: registrationData.email,
    subject: "Lex Experience Registration Successful",
    html: `
      <p>Hi ${registrationData.name},</p>
      <p>Thank you for registering for <strong>Lex Experience</strong>.</p>
      <p>Details:</p>
      <ul>
        <li>School: ${registrationData.school}</li>
        <li>Interest: ${registrationData.interest || "N/A"}</li>
        <li>Payment reference: ${registrationData.registrationPayment.reference}</li>
        <li>Amount: ${registrationData.registrationPayment.amount}</li>
      </ul>
      <p>We’ll contact you soon with more information.</p>
    `,
  });
} catch (e) {
  console.error("Error sending Lex Experience email:", e);
}


    return res.json({
      success: true,
      data: saved,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});
// ✅ GET FILE URL BY EMAIL
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

// Lex Innovate payment (separate collection)
app.post("/innovate-pay", async (req, res) => {
  try {
    const { email, reference, amount } = req.body;

    if (!email || !reference) {
      return res.status(400).json({
        success: false,
        message: "Missing Innovate payment data",
      });
    }

    const doc = await InnovateRegistration.create({
      email: email.trim(),
      reference,
      amount: Number(amount || 0),
    });

    try {
  await sendLexEmail({
    to: email.trim(),
    subject: "Lex Innovate Registration Successful",
    html: `
      <p>Hi,</p>
      <p>Your registration for <strong>Lex Innovate</strong> is complete.</p>
      <p>Details:</p>
      <ul>
        <li>Payment reference: ${reference}</li>
        <li>Amount: ${Number(amount || 0)}</li>
      </ul>
      <p>We’ll contact you soon with next steps.</p>
    `,
  });
} catch (e) {
  console.error("Error sending Lex Innovate email:", e);
}


    return res.json({
      success: true,
      data: doc,
    });
  } catch (err) {
    console.error("Innovate error:", err);
    return res.status(500).json({
      success: false,
      message: "Innovate payment failed",
    });
  }
});

// Health check
app.get("/", (req, res) => res.send("Backend alive!"));

// Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
