require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage config for uploaded IDs
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.get("/verify-payment/:reference", async (req, res) => {
  try {
    const reference = req.params.reference;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    res.json(response.data);

  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

app.post("/register", upload.single("regNumber"), async (req, res) => {
  try {
    const { name, email, school, interest } = req.body;

    console.log("New Registration (lex_Experience):");
    console.log(req.body);
    console.log(req.file);

    // Here you’ll:
    // 1. Save to database
    // 2. Trigger payment verification
    // 3. Send confirmation email

    res.json({ success: true, message: "Registration received" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
