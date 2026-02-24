const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  school: String,

  registrationPayment: {
    reference: String,
    amount: Number
  },

  innovatePayment: {
    reference: String,
    amount: Number
  },

  file: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Registration = mongoose.model("Registration", registrationSchema);

// 🔥 ONE ENDPOINT FOR BOTH CASES - WORKS 100%
app.post("/register", upload.single("regNumber"), async (req, res) => {
  try {
    const { name, email, school, paymentReference, amount } = req.body;

    if (!name || !email || !school || !paymentReference) {
      return res.status(400).json({
        success: false,
        message: "Missing registration data"
      });
    }

    const registrationData = {
      name: name.trim(),
      email: email.trim(),
      school,
      registrationPayment: {
        reference: paymentReference,
        amount: Number(amount || 0)
      }
    };

    if (req.file) {
      registrationData.file = req.file.filename;
    }

    const saved = await Registration.findOneAndUpdate(
      { email },
      registrationData,
      { upsert: true, returnDocument: "after" }
    );

    res.json({
      success: true,
      data: saved
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});

app.post("/innovate-pay", async (req, res) => {
  try {
    const { email, reference, amount } = req.body;

    const updated = await Registration.findOneAndUpdate(
      { email },
      {
        innovatePayment: {
          reference,
          amount: Number(amount || 0)
        }
      },
      { upsert: true, returnDocument: "after" }
    );

    res.json({ success: true, data: updated });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Innovate payment failed"
    });
  }
});

app.get("/", (req, res) => res.send("Backend alive!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
