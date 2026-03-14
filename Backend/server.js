// 🔥 COMPLETE SERVER.JS - EMAILS + CLOUDINARY + EVERYTHING WORKING
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const cloudinary = require('cloudinary').v2;
const { Resend } = require("resend");

const app = express();

// ✅ CHECK REQUIRED ENV VARS ON STARTUP
const requiredEnv = ['MONGODB_URI', 'RESEND_API_KEY', 'PAYSTACK_SECRET_KEY', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
requiredEnv.forEach((key) => {
  if (!process.env[key]) console.warn(`⚠️  Missing env var: ${key}`);
});

// ✅ RESEND EMAIL
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendLexEmail({ to, subject, html }) {
  try {
    await resend.emails.send({
      from: process.env.SENDER_EMAIL || 'Lex Xperience <no-reply@lexexperience.com>',
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (err) {
    console.error("Email failed (non-blocking):", err.message);
  }
}

// ✅ CLOUDINARY CONFIG
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
const innovateUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB — pitch deck PDF only
}).fields([
  { name: "pitchDeck", maxCount: 1 },
]);

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// Schemas
const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  school: String,
  registrationPayment: { reference: String, amount: Number },
  schoolName: String,
  interest: String,
  file: String,
  fileUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const innovateSchema = new mongoose.Schema({
  email: { type: String, required: true },
  name: String,
  reference: { type: String, required: true },
  amount: { type: Number, required: true },
  phone:        String,
  institution:  String,
  course:       String,
  yearOfStudy:  String,
  startupName:  String,
  tagline:      String,
  website:      String,
  stage:        String,
  teamSize:     String,
  duration:     String,
  problem:      String,
  solution:     String,
  legal:        String,
  bizModel:     String,
  traction:     String,
  useOfFunds:   String,
  videoLink:    String,
  pitchDeckUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const Registration = mongoose.model("Registration", registrationSchema);
const InnovateRegistration = mongoose.model("InnovateRegistration", innovateSchema);

// ✅ HEALTH CHECK
app.get("/", (req, res) => res.send("✅ Lex Xperience Backend - All Systems Operational!"));

// ✅ CHECK EMAIL DUPLICATE
app.get("/check-email", async (req, res) => {
  try {
    const { email, type } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });

    const normalizedEmail = email.trim().toLowerCase();

    if (type === "innovate") {
      const existing = await InnovateRegistration.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
      });
      return res.json({ registered: !!existing });
    }

    const existing = await Registration.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });
    return res.json({ registered: !!existing });

  } catch (err) {
    console.error("❌ check-email error:", err);
    return res.status(500).json({ success: false, message: "Check failed" });
  }
});

// ✅ INNOVATE FULL APPLICATION + PAYMENT
app.post("/innovate-apply", innovateUpload, async (req, res) => {
  try {
    const {
      email, name, reference, amount,
      phone, institution, course, yearOfStudy,
      startupName, tagline, website, stage, teamSize, duration,
      problem, solution, legal, bizModel, traction, useOfFunds,
      videoLink,
    } = req.body;

    if (!email || !reference || !amount) {
      return res.status(400).json({ success: false, message: "Missing Innovate payment data" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate
    const existing = await InnovateRegistration.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This email has already been registered for Lex Innovate.",
      });
    }

    // Amount check
    const paidAmount = Number(amount || 0);
    if (paidAmount < 20000) {
      return res.status(400).json({
        success: false,
        message: "Incorrect payment amount. Expected ₦20,000. Please contact us at lexxperience01@gmail.com.",
      });
    }

    const docData = {
      email: normalizedEmail,
      name: name ? name.trim() : "",
      reference,
      amount: paidAmount,
      phone: phone || "",
      institution: institution || "",
      course: course || "",
      yearOfStudy: yearOfStudy || "",
      startupName: startupName || "",
      tagline: tagline || "",
      website: website || "",
      stage: stage || "",
      teamSize: teamSize || "",
      duration: duration || "",
      problem: problem || "",
      solution: solution || "",
      legal: legal || "",
      bizModel: bizModel || "",
      traction: traction || "",
      useOfFunds: useOfFunds || "",
      videoLink: videoLink || "",
    };

    // Save to DB immediately, respond, then do uploads + email in background
    const doc = await InnovateRegistration.create(docData);
    res.json({ success: true, data: doc });

    // ---------- BACKGROUND: uploads + confirmation email ----------
    setImmediate(async () => {
      try {
        const pitchDeckFile = req.files && req.files.pitchDeck && req.files.pitchDeck[0];
        const update = {};

        if (pitchDeckFile) {
          const deckResult = await cloudinary.uploader.upload(pitchDeckFile.path, {
            folder: "lex-experience/innovate/decks",
            resource_type: "raw",
          });
          update.pitchDeckUrl = deckResult.secure_url;
          console.log("✅ Pitch deck uploaded:", deckResult.secure_url);
        }

        if (Object.keys(update).length > 0) {
          await InnovateRegistration.updateOne({ _id: doc._id }, update);
        }

        // ✅ CONFIRMATION EMAIL
        await sendLexEmail({
          to: normalizedEmail,
          subject: "Lex Innovate Pitch 2026 — You're In!",
          html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Lex Innovate 2026</title></head>
<body style="margin:0;padding:0;background-color:#050608;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050608;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0e1015 0%,#151826 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;border:1px solid rgba(247,222,80,0.2);border-bottom:none;">
              <div style="display:inline-block;">
                <span style="font-size:28px;font-weight:800;letter-spacing:0.06em;color:#f9fafb;">Lex</span><span style="font-size:28px;font-weight:800;letter-spacing:0.06em;color:#f7de50;">Xperience</span>
              </div>
              <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9ca3af;">Law • Innovation • Northern Nigeria</p>
            </td>
          </tr>

          <!-- GOLD DIVIDER -->
          <tr>
            <td style="background:linear-gradient(90deg,transparent,#f7de50,transparent);height:2px;border-left:1px solid rgba(247,222,80,0.2);border-right:1px solid rgba(247,222,80,0.2);"></td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#0e1015;padding:40px;border:1px solid rgba(247,222,80,0.2);border-top:none;border-bottom:none;">

              <!-- STATUS BADGE -->
              <div style="text-align:center;margin-bottom:28px;">
                <span style="display:inline-block;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);color:#86efac;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:6px 18px;border-radius:999px;">
                  ✓ Innovate Pitch Confirmed
                </span>
              </div>

              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f9fafb;line-height:1.3;">
                You're a Pitcher, ${doc.name || 'Innovator'}!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.7;">
                Your application for the <span style="color:#f2e7a2;font-weight:600;">Lex Innovate Pitch</span> has been received and your payment confirmed. Get ready to present your big idea to industry leaders, investors, and policy stakeholders.
              </p>

              <!-- TICKET CARD -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(247,222,80,0.1),rgba(185,154,45,0.05));border:1px solid rgba(247,222,80,0.3);border-radius:12px;padding:24px;">
                    <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#f7de50;text-transform:uppercase;letter-spacing:0.1em;">Your Registration</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#9ca3af;width:45%;">Startup</td>
                        <td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#f9fafb;font-weight:600;">${doc.startupName || '—'}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#9ca3af;">Event</td>
                        <td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#f9fafb;font-weight:600;">Lex Innovate Pitch — Day 4</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#9ca3af;">Amount Paid</td>
                        <td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#f9fafb;font-weight:600;">₦${paidAmount.toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:13px;color:#9ca3af;">Payment Reference</td>
                        <td style="padding:8px 0;font-size:13px;color:#f7de50;font-weight:600;word-break:break-all;">${reference}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- NEXT STEPS -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:#141821;border-radius:12px;padding:20px 24px;border:1px solid rgba(249,250,251,0.08);">
                    <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#f7de50;text-transform:uppercase;letter-spacing:0.1em;">Next Steps</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#9ca3af;width:40%;">Pitch Day</td>
                        <td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">April 3rd, 2026 — Day 4</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#9ca3af;">Venue</td>
                        <td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">Mahdi Hall, Faculty of Law, ABU Zaria</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#9ca3af;">Selection</td>
                        <td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">Finalists will be contacted via email</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- TIP BOX -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="background:rgba(247,222,80,0.06);border-left:3px solid #f7de50;border-radius:0 8px 8px 0;padding:14px 18px;">
                    <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
                      <strong style="color:#f2e7a2;">Tip:</strong> If selected as a finalist, you'll be required to submit a pitch deck and attend a mandatory prep session before the live pitch on April 3rd. Keep an eye on your inbox.
                    </p>
                  </td>
                </tr>
              </table>

                           <p style="font-size:14px;color:#9ca3af;line-height:1.7;margin:0;">
                Questions? Reach us at
                <a href="mailto:lexxperience01@gmail.com" style="color:#f7de50;text-decoration:none;">lexxperience01@gmail.com</a>
              </p>
            </td>
          </tr>

          <!-- GOLD DIVIDER -->
          <tr>
            <td style="background:linear-gradient(90deg,transparent,#f7de50,transparent);height:2px;border-left:1px solid rgba(247,222,80,0.2);border-right:1px solid rgba(247,222,80,0.2);"></td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0a0b0f;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(247,222,80,0.2);border-top:none;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">© 2026 Lex Xperience. All rights reserved.</p>
              <p style="margin:0;font-size:12px;color:#6b7280;">
                Mahdi Hall, Faculty of Law, ABU Zaria &nbsp;|&nbsp;
                <a href="mailto:lexxperience01@gmail.com" style="color:#9ca3af;text-decoration:none;">lexxperience01@gmail.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
        });

      } catch (bgErr) {
        console.error("❌ Innovate-apply background error:", bgErr);
      }
    });

  } catch (err) {
    console.error("❌ Innovate-apply error:", err);
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email has already been registered for Lex Innovate.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Innovate application failed. Please try again.",
    });
  }
});

// 🔥 LEX INNOVATE ROUTE (legacy — kept for reference)
app.post("/innovate-pay", async (req, res) => {
  try {
    const { email, name, reference, amount } = req.body;

    if (!email || !reference) {
      return res.status(400).json({ success: false, message: "Missing Innovate payment data" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await InnovateRegistration.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "This email has already been registered for Lex Innovate." });
    }

    const doc = await InnovateRegistration.create({
      email: normalizedEmail,
      name: name ? name.trim() : "",
      reference,
      amount: Number(amount || 0),
    });

    res.json({ success: true, data: doc });

    setImmediate(() => {
      sendLexEmail({
        to: normalizedEmail,
        subject: "Lex Innovate Pitch 2026 — You're In!",
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Lex Innovate 2026</title></head>
<body style="margin:0;padding:0;background-color:#050608;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050608;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#0e1015 0%,#151826 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;border:1px solid rgba(247,222,80,0.2);border-bottom:none;">
              <div style="display:inline-block;">
                <span style="font-size:28px;font-weight:800;letter-spacing:0.06em;color:#f9fafb;">Lex</span><span style="font-size:28px;font-weight:800;letter-spacing:0.06em;color:#f7de50;">Xperience</span>
              </div>
              <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9ca3af;">Law • Innovation • Northern Nigeria</p>
            </td>
          </tr>
          <tr><td style="background:linear-gradient(90deg,transparent,#f7de50,transparent);height:2px;border-left:1px solid rgba(247,222,80,0.2);border-right:1px solid rgba(247,222,80,0.2);"></td></tr>
          <tr>
            <td style="background:#0e1015;padding:40px;border:1px solid rgba(247,222,80,0.2);border-top:none;border-bottom:none;">
              <div style="text-align:center;margin-bottom:28px;">
                <span style="display:inline-block;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);color:#86efac;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:6px 18px;border-radius:999px;">✓ Innovate Pitch Confirmed</span>
              </div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f9fafb;line-height:1.3;">You're a Pitcher, ${doc.name || 'Innovator'}!</h1>
              <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.7;">Your registration for the <span style="color:#f2e7a2;font-weight:600;">Lex Innovate Pitch</span> is confirmed. Get ready to present your big idea to industry leaders, investors, and policy stakeholders.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="background:linear-gradient(135deg,rgba(247,222,80,0.1),rgba(185,154,45,0.05));border:1px solid rgba(247,222,80,0.3);border-radius:12px;padding:24px;">
                  <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#f7de50;text-transform:uppercase;letter-spacing:0.1em;">Your Registration</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#9ca3af;width:45%;">Event</td><td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#f9fafb;font-weight:600;">Lex Innovate Pitch — Day 4</td></tr>
                    <tr><td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#9ca3af;">Amount Paid</td><td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#f9fafb;font-weight:600;">₦${Number(amount || 0)}</td></tr>
                    <tr><td style="padding:8px 0;font-size:13px;color:#9ca3af;">Payment Reference</td><td style="padding:8px 0;font-size:13px;color:#f7de50;font-weight:600;word-break:break-all;">${reference}</td></tr>
                  </table>
                </td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="background:#141821;border-radius:12px;padding:20px 24px;border:1px solid rgba(249,250,251,0.08);">
                  <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#f7de50;text-transform:uppercase;letter-spacing:0.1em;">Next Steps</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td style="padding:6px 0;font-size:13px;color:#9ca3af;width:40%;">Pitch Day</td><td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">Day 4 — Lex Innovate</td></tr>
                    <tr><td style="padding:6px 0;font-size:13px;color:#9ca3af;">Venue</td><td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">Mahdi Hall, Faculty of Law, ABU Zaria</td></tr>
                  </table>
                </td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="background:rgba(247,222,80,0.06);border-left:3px solid #f7de50;border-radius:0 8px 8px 0;padding:14px 18px;">
                  <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;"><strong style="color:#f2e7a2;">Tip:</strong> Prepare your pitch deck and a clear summary of your solution. Present this confirmation at the Innovate Pitch registration desk on the day.</p>
                </td></tr>
              </table>
              <p style="font-size:14px;color:#9ca3af;line-height:1.7;margin:0;">Questions? Reach us at <a href="mailto:lexxperience01@gmail.com" style="color:#f7de50;text-decoration:none;">lexxperience01@gmail.com</a></p>
            </td>
          </tr>
          <tr><td style="background:linear-gradient(90deg,transparent,#f7de50,transparent);height:2px;border-left:1px solid rgba(247,222,80,0.2);border-right:1px solid rgba(247,222,80,0.2);"></td></tr>
          <tr>
            <td style="background:#0a0b0f;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(247,222,80,0.2);border-top:none;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">© 2026 Lex Xperience. All rights reserved.</p>
              <p style="margin:0;font-size:12px;color:#6b7280;">Mahdi Hall, Faculty of Law, ABU Zaria &nbsp;|&nbsp; <a href="mailto:lexxperience01@gmail.com" style="color:#9ca3af;text-decoration:none;">lexxperience01@gmail.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      });
    });

  } catch (err) {
    console.error("❌ Innovate error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "This email has already been registered for Lex Innovate." });
    }
    return res.status(500).json({ success: false, message: "Innovate payment failed. Please try again." });
  }
});

// ✅ VERIFY PAYMENT WITH PAYSTACK
app.post("/verify-payment", async (req, res) => {
  try {
    const { reference, expectedAmount } = req.body;
    if (!reference || !expectedAmount) {
      return res.status(400).json({ success: false, message: "Missing reference or expected amount" });
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    if (!data.status || data.data.status !== 'success') {
      return res.status(400).json({ success: false, message: "Payment was not successful." });
    }

    const paidAmountNaira = data.data.amount / 100;
    if (paidAmountNaira < Number(expectedAmount)) {
      console.warn(`⚠️ Amount mismatch: paid ₦${paidAmountNaira}, expected ₦${expectedAmount}`);
      return res.status(400).json({
        success: false,
        message: `Incorrect payment amount. Expected ₦${Number(expectedAmount).toLocaleString()} but received ₦${paidAmountNaira.toLocaleString()}. Please contact us at lexxperience01@gmail.com.`,
      });
    }

    return res.json({ success: true, amount: paidAmountNaira });

  } catch (err) {
    console.error("❌ verify-payment error:", err);
    return res.status(500).json({ success: false, message: "Payment verification failed." });
  }
});

// ✅ MAIN REGISTRATION ROUTE
app.post("/register", upload.single("regNumber"), async (req, res) => {
  try {
    const { name, email, school, schoolName, paymentReference, amount, interest } = req.body;

    if (!name || !email || !school || !paymentReference) {
      return res.status(400).json({ success: false, message: "Missing registration data" });
    }

    if (school === 'no' && (!schoolName || !schoolName.trim())) {
      return res.status(400).json({ success: false, message: "School name is required for non-ABU students." });
    }

    const paidAmount     = Number(amount || 0);
    const expectedAmount = school === 'yes' ? 5000 : 12000;

    if (paidAmount < expectedAmount) {
      console.warn(`⚠️ Amount mismatch for ${email}: paid ₦${paidAmount}, expected ₦${expectedAmount}`);
      return res.status(400).json({
        success: false,
        message: `Incorrect payment amount. Expected ₦${expectedAmount.toLocaleString()} but received ₦${paidAmount.toLocaleString()}. Please contact us at lexxperience01@gmail.com.`,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await Registration.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });
    if (existing) {
      return res.status(409).json({ success: false, message: "This email is already registered." });
    }

    const registrationData = {
      name: name.trim(),
      email: normalizedEmail,
      school,
      schoolName: school === 'no' ? (schoolName || '').trim() : '',
      interest: interest || "",
      registrationPayment: {
        reference: paymentReference,
        amount: Number(amount || 0),
      },
    };

    const saved = await Registration.create(registrationData);
    res.json({ success: true, data: saved });

    setImmediate(async () => {
      try {
        if (req.file) {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'lex-experience/ids',
            resource_type: 'auto'
          });
          await Registration.updateOne(
            { _id: saved._id },
            { file: req.file.filename, fileUrl: result.secure_url }
          );
          console.log("✅ Cloudinary done:", result.secure_url);
        }

        if (registrationData.school === 'yes') {
          await sendLexEmail({
            to: normalizedEmail,
            subject: "Lex Xperience 2026 — Registration Received",
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Lex Xperience 2026</title></head>
<body style="margin:0;padding:0;background-color:#050608;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050608;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0e1015 0%,#151826 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;border:1px solid rgba(247,222,80,0.2);border-bottom:none;">
          <div style="display:inline-block;">
            <span style="font-size:28px;font-weight:800;letter-spacing:0.06em;color:#f9fafb;">Lex</span><span style="font-size:28px;font-weight:800;letter-spacing:0.06em;color:#f7de50;">Xperience</span>
          </div>
          <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9ca3af;">Law • Innovation • Northern Nigeria</p>
        </td></tr>
        <tr><td style="background:linear-gradient(90deg,transparent,#f7de50,transparent);height:2px;border-left:1px solid rgba(247,222,80,0.2);border-right:1px solid rgba(247,222,80,0.2);"></td></tr>
        <tr><td style="background:#0e1015;padding:40px;border:1px solid rgba(247,222,80,0.2);border-top:none;border-bottom:none;">
          <div style="text-align:center;margin-bottom:28px;">
            <span style="display:inline-block;background:rgba(247,222,80,0.12);border:1px solid rgba(247,222,80,0.35);color:#f7de50;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:6px 18px;border-radius:999px;">Registration Received</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f9fafb;line-height:1.3;">Hi ${registrationData.name},</h1>
          <p style="margin:0 0 20px;font-size:15px;color:#9ca3af;line-height:1.7;">Thank you for registering for <span style="color:#f2e7a2;font-weight:600;">Lex Xperience 2026</span>. We've received your details and your ABU ID card is currently under review.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="background:rgba(247,222,80,0.06);border:1px solid rgba(247,222,80,0.25);border-radius:12px;padding:20px 24px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#f7de50;text-transform:uppercase;letter-spacing:0.1em;">What happens next?</p>
              <p style="margin:0;font-size:14px;color:#9ca3af;line-height:1.7;">Our team will manually verify your ABU ID card. Once verified, you will receive a <strong style="color:#f2e7a2;">separate confirmation email</strong> with your full ticket details. Please ensure the ID you uploaded is clear and legible to avoid delays.</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="background:#141821;border-radius:12px;padding:20px 24px;border:1px solid rgba(249,250,251,0.08);">
              <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#f7de50;text-transform:uppercase;letter-spacing:0.1em;">Event Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;font-size:13px;color:#9ca3af;width:40%;">Date</td><td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">March 31st – April 4th, 2026</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9ca3af;">Venue</td><td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">Mahdi Hall, Faculty of Law, ABU Zaria</td></tr>
              </table>
            </td></tr>
          </table>
          <p style="font-size:14px;color:#9ca3af;line-height:1.7;margin:0;">Questions? Reach us at <a href="mailto:lexxperience01@gmail.com" style="color:#f7de50;text-decoration:none;">lexxperience01@gmail.com</a></p>
        </td></tr>
        <tr><td style="background:linear-gradient(90deg,transparent,#f7de50,transparent);height:2px;border-left:1px solid rgba(247,222,80,0.2);border-right:1px solid rgba(247,222,80,0.2);"></td></tr>
        <tr><td style="background:#0a0b0f;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(247,222,80,0.2);border-top:none;">
          <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">© 2026 Lex Xperience. All rights reserved.</p>
          <p style="margin:0;font-size:12px;color:#6b7280;">Mahdi Hall, Faculty of Law, ABU Zaria &nbsp;|&nbsp; <a href="mailto:lexxperience01@gmail.com" style="color:#9ca3af;text-decoration:none;">lexxperience01@gmail.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
          });

        } else {
          await sendLexEmail({
            to: normalizedEmail,
            subject: "Lex Xperience 2026 — Your Ticket is Confirmed!",
            html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Lex Xperience 2026</title></head>
<body style="margin:0;padding:0;background-color:#050608;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050608;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0e1015 0%,#151826 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;border:1px solid rgba(247,222,80,0.2);border-bottom:none;">
          <div style="display:inline-block;">
            <span style="font-size:28px;font-weight:800;letter-spacing:0.06em;color:#f9fafb;">Lex</span><span style="font-size:28px;font-weight:800;letter-spacing:0.06em;color:#f7de50;">Xperience</span>
          </div>
          <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9ca3af;">Law • Innovation • Northern Nigeria</p>
        </td></tr>
        <tr><td style="background:linear-gradient(90deg,transparent,#f7de50,transparent);height:2px;border-left:1px solid rgba(247,222,80,0.2);border-right:1px solid rgba(247,222,80,0.2);"></td></tr>
        <tr><td style="background:#0e1015;padding:40px;border:1px solid rgba(247,222,80,0.2);border-top:none;border-bottom:none;">
          <div style="text-align:center;margin-bottom:28px;">
            <span style="display:inline-block;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);color:#86efac;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:6px 18px;border-radius:999px;">✓ Ticket Confirmed</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f9fafb;line-height:1.3;">You're in, ${registrationData.name}!</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.7;">Your registration for <span style="color:#f2e7a2;font-weight:600;">Lex Xperience 2026</span> is confirmed. We can't wait to see you there!</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:linear-gradient(135deg,rgba(247,222,80,0.1),rgba(185,154,45,0.05));border:1px solid rgba(247,222,80,0.3);border-radius:12px;padding:24px;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#f7de50;text-transform:uppercase;letter-spacing:0.1em;">🎟️ Your Ticket</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#9ca3af;width:45%;">Ticket Type</td><td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#f9fafb;font-weight:600;">General Admission</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#9ca3af;">Amount Paid</td><td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#f9fafb;font-weight:600;">₦${registrationData.registrationPayment.amount.toLocaleString()}</td></tr>
                <tr><td style="padding:8px 0;font-size:13px;color:#9ca3af;">Payment Reference</td><td style="padding:8px 0;font-size:13px;color:#f7de50;font-weight:600;word-break:break-all;">${registrationData.registrationPayment.reference}</td></tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:#141821;border-radius:12px;padding:20px 24px;border:1px solid rgba(249,250,251,0.08);">
              <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#f7de50;text-transform:uppercase;letter-spacing:0.1em;">Event Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;font-size:13px;color:#9ca3af;width:40%;">Date</td><td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">March 31st – April 4th, 2026</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9ca3af;">Venue</td><td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">Mahdi Hall, Faculty of Law, ABU Zaria</td></tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:rgba(247,222,80,0.06);border-left:3px solid #f7de50;border-radius:0 8px 8px 0;padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;"><strong style="color:#f2e7a2;">Important:</strong> Please bring this confirmation (printed or on your phone) to registration on the day.</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="background:rgba(37,211,102,0.08);border:1px solid rgba(37,211,102,0.25);border-radius:12px;padding:20px 24px;text-align:center;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.1em;">Join the WhatsApp Group</p>
              <p style="margin:0 0 14px;font-size:13px;color:#9ca3af;line-height:1.6;">Stay updated with event announcements, schedules, and important information.</p>
              <a href="https://chat.whatsapp.com/IiDHDFP7uIA96hUqtLyns5" style="display:inline-block;background:#25d366;color:#ffffff;font-weight:700;font-size:14px;padding:10px 24px;border-radius:8px;text-decoration:none;">Join WhatsApp Group</a>
            </td></tr>
          </table>
          <p style="font-size:14px;color:#9ca3af;line-height:1.7;margin:0;">Questions? Reach us at <a href="mailto:lexxperience01@gmail.com" style="color:#f7de50;text-decoration:none;">lexxperience01@gmail.com</a></p>
        </td></tr>
        <tr><td style="background:linear-gradient(90deg,transparent,#f7de50,transparent);height:2px;border-left:1px solid rgba(247,222,80,0.2);border-right:1px solid rgba(247,222,80,0.2);"></td></tr>
        <tr><td style="background:#0a0b0f;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(247,222,80,0.2);border-top:none;">
          <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">© 2026 Lex Xperience. All rights reserved.</p>
          <p style="margin:0;font-size:12px;color:#6b7280;">Mahdi Hall, Faculty of Law, ABU Zaria &nbsp;|&nbsp; <a href="mailto:lexxperience01@gmail.com" style="color:#9ca3af;text-decoration:none;">lexxperience01@gmail.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
          });
        }
      } catch (bgErr) {
        console.error("Background task failed:", bgErr);
      }
    });

  } catch (err) {
    console.error("❌ Register error:", err);
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "This email is already registered." });
    }
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
});

// ✅ ADMIN — Get all Xperience registrations
app.get("/admin/registrations", async (req, res) => {
  try {
    const data = await Registration.find({}, '-registrationPayment.reference').sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ✅ ADMIN — Get all Innovate registrations
app.get("/admin/innovate", async (req, res) => {
  try {
    const data = await InnovateRegistration.find({}, '-reference').sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ✅ GET FILE URL
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

// ✅ MANUAL — Send ABU confirmation email after ID verification
app.post("/admin/confirm-abu", async (req, res) => {
  try {
    const { email, adminKey } = req.body;
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const reg = await Registration.findOne({ email: email.trim().toLowerCase() });
    if (!reg) return res.status(404).json({ success: false, message: "Registration not found" });
    if (reg.school !== 'yes') return res.status(400).json({ success: false, message: "Not an ABU student" });

    await sendLexEmail({
      to: reg.email,
      subject: "Lex Xperience 2026 — Your Ticket is Confirmed!",
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Lex Xperience 2026</title></head>
<body style="margin:0;padding:0;background-color:#050608;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#050608;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#0e1015 0%,#151826 100%);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;border:1px solid rgba(247,222,80,0.2);border-bottom:none;">
          <div><span style="font-size:28px;font-weight:800;letter-spacing:0.06em;color:#f9fafb;">Lex</span><span style="font-size:28px;font-weight:800;letter-spacing:0.06em;color:#f7de50;">Xperience</span></div>
          <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#9ca3af;">Law • Innovation • Northern Nigeria</p>
        </td></tr>
        <tr><td style="background:linear-gradient(90deg,transparent,#f7de50,transparent);height:2px;border-left:1px solid rgba(247,222,80,0.2);border-right:1px solid rgba(247,222,80,0.2);"></td></tr>
        <tr><td style="background:#0e1015;padding:40px;border:1px solid rgba(247,222,80,0.2);border-top:none;border-bottom:none;">
          <div style="text-align:center;margin-bottom:28px;">
            <span style="display:inline-block;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.35);color:#86efac;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;padding:6px 18px;border-radius:999px;">✓ Ticket Confirmed</span>
          </div>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#f9fafb;line-height:1.3;">You're in, ${reg.name}!</h1>
          <p style="margin:0 0 24px;font-size:15px;color:#9ca3af;line-height:1.7;">Your ABU ID has been verified and your ticket for <span style="color:#f2e7a2;font-weight:600;">Lex Xperience 2026</span> is confirmed. We can't wait to see you there!</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:linear-gradient(135deg,rgba(247,222,80,0.1),rgba(185,154,45,0.05));border:1px solid rgba(247,222,80,0.3);border-radius:12px;padding:24px;">
              <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#f7de50;text-transform:uppercase;letter-spacing:0.1em;">🎟️ Your Ticket</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#9ca3af;width:45%;">Ticket Type</td><td style="padding:8px 0;border-bottom:1px solid rgba(249,250,251,0.07);font-size:13px;color:#f9fafb;font-weight:600;">ABU Student</td></tr>
                <tr><td style="padding:8px 0;font-size:13px;color:#9ca3af;">Amount Paid</td><td style="padding:8px 0;font-size:13px;color:#f9fafb;font-weight:600;">₦${reg.registrationPayment.amount.toLocaleString()}</td></tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:#141821;border-radius:12px;padding:20px 24px;border:1px solid rgba(249,250,251,0.08);">
              <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#f7de50;text-transform:uppercase;letter-spacing:0.1em;">Event Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:6px 0;font-size:13px;color:#9ca3af;width:40%;">Date</td><td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">March 31st – April 4th, 2026</td></tr>
                <tr><td style="padding:6px 0;font-size:13px;color:#9ca3af;">Venue</td><td style="padding:6px 0;font-size:13px;color:#f9fafb;font-weight:600;">Mahdi Hall, Faculty of Law, ABU Zaria</td></tr>
              </table>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
            <tr><td style="background:rgba(247,222,80,0.06);border-left:3px solid #f7de50;border-radius:0 8px 8px 0;padding:14px 18px;">
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;"><strong style="color:#f2e7a2;">Important:</strong> Please bring this confirmation (printed or on your phone) to registration on the day.</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="background:rgba(37,211,102,0.08);border:1px solid rgba(37,211,102,0.25);border-radius:12px;padding:20px 24px;text-align:center;">
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#4ade80;text-transform:uppercase;letter-spacing:0.1em;">Join the WhatsApp Group</p>
              <p style="margin:0 0 14px;font-size:13px;color:#9ca3af;line-height:1.6;">Stay updated with announcements, schedules, and important information.</p>
              <a href="https://chat.whatsapp.com/CUi0RRdRzoUHDSNQvxU71c" style="display:inline-block;background:#25d366;color:#ffffff;font-weight:700;font-size:14px;padding:10px 24px;border-radius:8px;text-decoration:none;">Join ABU Students Group</a>
            </td></tr>
          </table>
          <p style="font-size:14px;color:#9ca3af;line-height:1.7;margin:0;">Questions? Reach us at <a href="mailto:lexxperience01@gmail.com" style="color:#f7de50;text-decoration:none;">lexxperience01@gmail.com</a></p>
        </td></tr>
        <tr><td style="background:linear-gradient(90deg,transparent,#f7de50,transparent);height:2px;border-left:1px solid rgba(247,222,80,0.2);border-right:1px solid rgba(247,222,80,0.2);"></td></tr>
        <tr><td style="background:#0a0b0f;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid rgba(247,222,80,0.2);border-top:none;">
          <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">© 2026 Lex Xperience. All rights reserved.</p>
          <p style="margin:0;font-size:12px;color:#6b7280;">Mahdi Hall, Faculty of Law, ABU Zaria &nbsp;|&nbsp; <a href="mailto:lexxperience01@gmail.com" style="color:#9ca3af;text-decoration:none;">lexxperience01@gmail.com</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    res.json({ success: true, message: `Confirmation email sent to ${reg.email}` });
  } catch (err) {
    console.error("❌ confirm-abu error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});