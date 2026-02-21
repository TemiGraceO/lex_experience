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
    const { name, email, school, interest, paymentReference } = req.body;

    console.log("New Registration (lex_Experience):");
    console.log(req.body);
    console.log("File:", req.file);

    if (!name || !email || !school) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // If ABU student, you might also require a file:
    if (school === "yes" && !req.file) {
      return res.status(400).json({ success: false, message: "ID required" });
    }

    // TODO: verify paymentReference, save to DB, send email, etc.

    return res.status(200).json({ success: true, message: "Registration received" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});