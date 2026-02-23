const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads folder
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpe?g|png|pdf/i.test(file.mimetype);
    cb(allowed ? null : new Error("Invalid file type"), allowed);
  }
});

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

    const { name, email, school, paymentReference } = req.body;
    if (!name || !email || !school || !paymentReference) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }
    // ABU check
    if (school === "yes" && !req.file) {
      return res.status(400).json({ success: false, message: "ABU ID required" });
    }
    // ✅ PERFECT SUCCESS
    res.json({
      success: true,
      message: "Registration successful!",
      data: {
        name: name.trim(),
        email: email.trim(),
        school: school === "yes" ? "ABU" : "Non-ABU",
        paymentReference: paymentReference.trim(),
        file: req.file ? req.file.filename : null
      }
    });
    console.log("✅ SUCCESSFULLY REGISTERED");
  });
});

app.use("/uploads", express.static(uploadsDir));

app.listen(5000, () => {
  console.log("Server running: http://localhost:5000");
});