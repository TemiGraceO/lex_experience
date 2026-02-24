// server.js

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const mongoose = require("mongoose");

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("uploads"));

// Ensure uploads dir exists (in tmp for Render)
const uploadsDir = path.join(os.tmpdir(), "lexperience-uploads");
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
      registrationData.file = req.file.filename;
    }

    const saved = await Registration.findOneAndUpdate(
      { email: registrationData.email },
      registrationData,
      { upsert: true, new: true } // new = returnDocument:"after"
    );

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
