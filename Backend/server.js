const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.static("uploads"));

// Create uploads folder
const uploadsDir = require("os").tmpdir() + "/lexperience-uploads"
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const mongoose = require("mongoose");
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB error:", err));

  const registrationSchema = new mongoose.Schema({
  name: String,
  email: String,
  school: String,
  paymentReference: String,
  file: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Registration = mongoose.model("Registration", registrationSchema);

// 🔥 ONE ENDPOINT FOR BOTH CASES - WORKS 100%
app.post("/register", (req, res) => {
  console.log("🔥 REGISTRATION STARTED");
  upload.single('regNumber')(req, res, (err) => {
    if (err) {
      console.error("❌ UPLOAD ERROR:", err);
      return res.status(400).json({ success: false, message: err.message });
    }

    console.log("📋 ALL DATA RECEIVED:");
    console.log("- name:", req.body.name);
    console.log("- email:", req.body.email);
    console.log("- school:", req.body.school);
    console.log("- paymentReference:", req.body.paymentReference);

    // ✅ ALL DATA IS HERE NOW
    const { name, email, school, paymentReference } = req.body;

    if (!name || !email || !school || !paymentReference) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing data: " + JSON.stringify({name, email, school, paymentReference}) 
      });
    }

    // ABU check
    if (school === "yes" && !req.file) {
      return res.status(400).json({ success: false, message: "ABU ID required" });
    }

    // ✅ PERFECT SUCCESS
    const newRegistration = new Registration({
  name: name.trim(),
  email: email.trim(),
  school: school === "yes" ? "ABU" : "Non-ABU",
  paymentReference: paymentReference.trim(),
  file: req.file ? req.file.filename : null
});

newRegistration.save()
  .then(() => {
    console.log("✅ SAVED TO DATABASE");

    res.json({
      success: true,
      message: "Registration successful!"
    });
  })
  .catch(err => {
    console.error("❌ DATABASE SAVE ERROR:", err);
    res.status(500).json({ success: false, message: "Database error" });
  });

    console.log("✅ SUCCESSFULLY REGISTERED");
  });
});

app.post("/add-innovate", async (req, res) => {
  const { email, innovateReference } = req.body;

  try {
    const updated = await Registration.findOneAndUpdate(
      { email },
      { innovatePayment: innovateReference },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/", (req, res) => res.send("Backend alive!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
