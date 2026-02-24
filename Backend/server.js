const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ✅ CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ MEMORY STORAGE
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

// MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Schemas
const Registration = mongoose.model("Registration", new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  school: String,
  registrationPayment: { reference: String, amount: Number },
  interest: String,
  fileUrl: String,
  fileName: String,
  createdAt: { type: Date, default: Date.now }
}));

const InnovateRegistration = mongoose.model("InnovateRegistration", new mongoose.Schema({
  email: String,
  reference: String,
  amount: Number,
  createdAt: { type: Date, default: Date.now }
}));

// ✅ FIXED REGISTER ROUTE
app.post("/register", upload.single("regNumber"), async (req, res) => {
  try {
    const { name, email, school, paymentReference, amount, interest } = req.body;

    if (!name || !email || !school || !paymentReference) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    const registrationData = {
      name: name.trim(),
      email: email.trim(),
      school,
      interest: interest || "",
      registrationPayment: { reference: paymentReference, amount: Number(amount || 0) }
    };

    if (req.file) {
      registrationData.fileName = req.file.originalname;
      
      // ✅ UPLOAD TO CLOUDINARY PROPERLY
      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: "auto", folder: "lex-experience" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary error:", error);
              reject(error);
            } else {
              registrationData.fileUrl = result.secure_url;
              resolve(result);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

      await uploadPromise;
    }

    const saved = await Registration.findOneAndUpdate(
      { email: registrationData.email },
      registrationData,
      { upsert: true, new: true }
    );

    res.json({ success: true, data: saved });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/innovate-pay", async (req, res) => {
  try {
    const { email, reference, amount } = req.body;
    const doc = await InnovateRegistration.create({ 
      email: email.trim(), 
      reference, 
      amount: Number(amount) 
    });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/get-file/:email", async (req, res) => {
  try {
    const doc = await Registration.findOne({ email: req.params.email });
    res.json({ 
      success: !!doc?.fileUrl, 
      fileUrl: doc?.fileUrl,
      fileName: doc?.fileName 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error" });
  }
});

app.get("/", (req, res) => res.send("Backend alive!"));

// ✅ FIXED: Vercel serverless format
module.exports = app;

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));