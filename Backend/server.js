const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ✅ CLOUDINARY CONFIG (Vercel Environment Variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ MEMORY STORAGE (Vercel = no disk)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Schemas
const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  school: String,
  registrationPayment: {
    reference: String,
    amount: Number,
  },
  interest: String,
  fileUrl: String,      // Cloudinary URL
  fileName: String,     // Original filename
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

// Routes
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

    // ✅ UPLOAD FILE TO CLOUDINARY (if exists)
    if (req.file) {
      registrationData.fileName = req.file.originalname;
      
      return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            resource_type: "auto", 
            folder: "lex-experience/abu-ids",
            transformation: [{ quality: "auto:good", fetch_format: "auto" }]
          },
          async (error, result) => {
            if (error) {
              console.error("Cloudinary error:", error);
              return res.status(500).json({ success: false, message: "File upload failed" });
            }
            
            registrationData.fileUrl = result.secure_url; // ✅ Permanent CDN URL
            
            try {
              const saved = await Registration.findOneAndUpdate(
                { email: registrationData.email },
                registrationData,
                { upsert: true, new: true }
              );
              res.json({ success: true, data: saved });
            } catch (dbError) {
              console.error("Mongo error:", dbError);
              res.status(500).json({ success: false, message: "Database error" });
            }
            resolve();
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
    } else {
      // No file uploaded
      const saved = await Registration.findOneAndUpdate(
        { email: registrationData.email },
        registrationData,
        { upsert: true, new: true }
      );
      res.json({ success: true, data: saved });
    }
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

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

    res.json({
      success: true,
      data: doc,
    });
  } catch (err) {
    console.error("Innovate error:", err);
    res.status(500).json({
      success: false,
      message: "Innovate payment failed",
    });
  }
});

// ✅ GET FILE URL BY EMAIL
app.get("/get-file/:email", async (req, res) => {
  try {
    const doc = await Registration.findOne({ email: req.params.email });
    if (doc?.fileUrl) {
      res.json({ 
        success: true, 
        fileUrl: doc.fileUrl,
        fileName: doc.fileName 
      });
    } else {
      res.json({ success: false, message: "No file found" });
    }
  } catch (err) {
    console.error("Get file error:", err);
    res.status(500).json({ success: false, message: "Error" });
  }
});

// Health check
app.get("/", (req, res) => res.send("Lex Experience Backend - Cloudinary Ready!"));

module.exports = app; // Vercel Serverless
