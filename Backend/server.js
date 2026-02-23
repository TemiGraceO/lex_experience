const express = require("express");
const cors = require("cors");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Store in memory, never touches disk
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const registrations = {};

app.post("/register", upload.single("regNumber"), async (req, res) => {
  try {
    const { name, email, school, paymentReference, interest } = req.body;

    if (!name || !email || !school || !paymentReference)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    if (school === "yes" && !req.file)
      return res.status(400).json({ success: false, message: "ABU ID required" });

    let fileUrl = null;

    // ✅ Upload to Cloudinary from memory buffer
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "lexperience-ids", resource_type: "auto" },
          (error, result) => error ? reject(error) : resolve(result)
        );
        stream.end(req.file.buffer);
      });
      fileUrl = result.secure_url;
    }

    if (!registrations[email]) registrations[email] = {};
    registrations[email].main = true;
    registrations[email].name = name.trim();
    registrations[email].fileUrl = fileUrl;

    res.json({ success: true, message: "Registration successful!" });
    console.log("✅ Registered:", email);

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/register-innovate", async (req, res) => {
  const { email, paymentReference } = req.body;
  if (!email || !registrations[email]?.main)
    return res.status(400).json({ success: false, message: "Complete main registration first" });

  registrations[email].innovate = true;
  res.json({ success: true, message: "Lex Innovate added!" });
});

app.get("/registration-status", (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false });
  res.json({ success: true, state: registrations[email] || {} });
});

app.listen(5000, () => console.log("Server running on port 5000"));