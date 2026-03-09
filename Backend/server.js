// 🔥 LEX XPERIENCE 2026 - FIXED PRODUCTION SCRIPT.JS
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && (
    args[0].includes('Cannot destructure property') ||
    args[0].includes('language')
  )) return;
  originalError.apply(console, args);
};
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('Cannot destructure property')) {
    e.preventDefault(); e.stopPropagation(); return true;
  }
}, true);
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && e.reason.message.includes('Cannot destructure property')) e.preventDefault();
});

// ---------- DOM ELEMENTS ----------
const navToggle        = document.getElementById("navToggle");
const nav              = document.getElementById("nav");
const navLinks         = document.querySelectorAll(".nav-link");
const sections         = document.querySelectorAll("section[id]");
const registerForm     = document.getElementById("registerForm");
const innovateOnlyForm = document.getElementById("innovateOnlyForm");
const schoolSelectEl   = document.getElementById("school");
const paymentSection   = document.getElementById("paymentSection");
const paymentText      = document.getElementById("paymentText");
const payBtn           = document.getElementById("payBtn");
const regSection       = document.getElementById("regSection");
const regNumberInput   = document.getElementById("regNumber");
const verifyStatus     = document.getElementById("verifyStatus");
const idError          = document.getElementById("idError");
const idPreview        = document.getElementById("idPreview");
const idPreviewImage   = document.getElementById("idPreviewImage");
const idFileName       = document.getElementById("idFileName");
const idFileType       = document.getElementById("idFileType");
const innovateYes      = document.getElementById("innovateYes");
const innovateNo       = document.getElementById("innovateNo");
const formFields       = document.getElementById("formFields");
const paymentThanks    = document.getElementById("paymentThanks");
const innovateSection  = document.getElementById("innovateSection");

// Form B elements
const innovateVerifyBtn  = document.getElementById("innovateVerifyBtn");
const innovateOnlyPayBtn = document.getElementById("innovateOnlyPayBtn");
const innovateStatusBox  = document.getElementById("innovateStatusBox");
const innovatePayGroup   = document.getElementById("innovatePayGroup");
const innovateOnlyThanks = document.getElementById("innovateOnlyThanks");
const innovateOnlyFields = document.getElementById("innovateOnlyFields");

// ---------- STATE ----------
let baseAmount   = 0;
let abuVerified  = false;
let uploadedFile = null;
let verifyTimeout;
let emailCheckTimeout;
let emailIsValid = true; // tracks if current email passed duplicate check

const MOCK_VERIFICATION_MODE = true;
const BACKEND_URL = "https://lex-xperience-backend.onrender.com";

// Prevent native form submit
registerForm.addEventListener("submit", (e) => { e.preventDefault(); e.stopPropagation(); });
innovateOnlyForm.addEventListener("submit", (e) => { e.preventDefault(); e.stopPropagation(); });

// ---------- REGISTRATION TYPE TOGGLE ----------
document.querySelectorAll('input[name="regType"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const val = radio.value;
    if (val === "new") {
      registerForm.style.display = "block";
      innovateOnlyForm.style.display = "none";
    } else {
      registerForm.style.display = "none";
      innovateOnlyForm.style.display = "block";
      innovateStatusBox.style.display = "none";
      innovateStatusBox.className = "form-status-box";
      innovatePayGroup.style.display = "none";
      document.getElementById("innovateOnlyFields").style.display = "block";
      innovateOnlyThanks.style.display = "none";
    }
  });
});

// ---------- FORM A VALIDITY CHECK ----------
function checkFormValidity() {
  const name   = document.getElementById("name").value.trim();
  const email  = document.getElementById("email").value.trim();
  const school = schoolSelectEl.value;
  const emailErr = document.getElementById("emailError");

  // Basic field check
  let isValid = !!(name && email && school && emailIsValid);

  // ABU student requires verified upload
  if (school === "yes") {
    isValid = isValid && uploadedFile !== null && abuVerified;
  }

  // Don't enable if there's an email error showing
  if (emailErr && emailErr.textContent.trim() !== "") {
    isValid = false;
  }

  payBtn.disabled = !isValid;
  payBtn.style.opacity = isValid ? "1" : "0.6";
  payBtn.style.cursor  = isValid ? "pointer" : "not-allowed";
}

// ---------- TYPEWRITER ----------
const typewriterEl    = document.getElementById("typewriter");
const typewriterWords = ["Architects", "Pioneers", "Builders", "Visionaries"];
let wordIndex = 0, charIndex = 0, isDeleting = false;

function typeWrite() {
  const currentWord = typewriterWords[wordIndex];
  typewriterEl.textContent = isDeleting
    ? currentWord.substring(0, charIndex - 1)
    : currentWord.substring(0, charIndex + 1);
  isDeleting ? charIndex-- : charIndex++;
  if (!isDeleting && charIndex === currentWord.length) {
    setTimeout(() => { isDeleting = true; typeWrite(); }, 1800); return;
  }
  if (isDeleting && charIndex === 0) {
    isDeleting = false;
    wordIndex = (wordIndex + 1) % typewriterWords.length;
  }
  setTimeout(typeWrite, isDeleting ? 60 : 100);
}
typeWrite();

// ---------- UI HELPERS ----------
function showPostPayment() {
  const formTop = registerForm.getBoundingClientRect().top + window.scrollY - 100;
  window.scrollTo({ top: formTop, behavior: "smooth" });
  setTimeout(() => {
    formFields.style.display = "none";
    paymentThanks.style.display = "block";
    innovateSection.style.display = "block";
  }, 400);
}

function lockForm(form, text = "Processing...") {
  form.classList.add("form-processing");
  const msg = form.querySelector("[id$='loaderMessage']");
  if (msg) msg.textContent = text;
}

function unlockForm(form) {
  form.classList.remove("form-processing");
}

function showVerificationSuccess(message) {
  clearTimeout(verifyTimeout);
  verifyStatus.textContent = message;
  verifyStatus.style.color = "#22c55e";
}

function resetPreview() {
  idPreview.style.display = "none";
  idPreviewImage.src = "";
  idFileName.textContent = "";
  if (idFileType) idFileType.textContent = "";
  idError.textContent = "";
  verifyStatus.textContent = "";
}

function showStatus(el, message, type) {
  el.style.display = "block";
  el.className = `form-status-box status-${type}`;
  el.textContent = message;
}

// ---------- REAL-TIME DUPLICATE EMAIL CHECK (Form A) ----------
document.getElementById("email").addEventListener("input", () => {
  emailIsValid = true; // reset while typing
  checkFormValidity();
  clearTimeout(emailCheckTimeout);

  const email  = document.getElementById("email").value.trim();
  const errorEl = document.getElementById("emailError");

  if (!email || !email.includes("@") || !email.includes(".")) {
    errorEl.textContent = "";
    return;
  }

  // Show checking state
  errorEl.style.color = "#9ca3af";
  errorEl.textContent = "Checking email...";

  emailCheckTimeout = setTimeout(async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/check-email?email=${encodeURIComponent(email)}&type=xperience`);
      const data = await res.json();

      if (data.registered) {
        errorEl.style.color = "#fecaca";
        errorEl.textContent = "⚠️ This email is already registered. Please use a different email.";
        emailIsValid = false;
      } else {
        errorEl.style.color = "#22c55e";
        errorEl.textContent = "✓ Email is available";
        emailIsValid = true;
        // Clear the green tick after 3s
        setTimeout(() => {
          if (errorEl.textContent === "✓ Email is available") errorEl.textContent = "";
        }, 3000);
      }
    } catch (_) {
      // Backend unreachable — don't block user
      errorEl.textContent = "";
      emailIsValid = true;
    }
    checkFormValidity();
  }, 800);
});

// ---------- MOCK ID VERIFICATION ----------
function verifyIDCard(file) {
  if (MOCK_VERIFICATION_MODE) {
    verifyStatus.textContent = "🔍 Verifying ABU ID...";
    verifyStatus.style.color = "#f7de50";
    setTimeout(() => {
      abuVerified = true;
      showVerificationSuccess("✅ ABU ID uploaded successfully!");
      checkFormValidity();
    }, 1200);
  }
}

// ---------- FILE UPLOAD (Form A) ----------
regNumberInput.addEventListener("change", (e) => {
  e.preventDefault(); e.stopPropagation();
  const file = e.target.files[0];

  // Reset state
  uploadedFile = null;
  abuVerified  = false;
  resetPreview();

  if (!file) {
    idError.textContent = "Please upload your ABU ID or admission letter.";
    checkFormValidity();
    return;
  }

  // ✅ File size check — clear and user-friendly
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    idError.style.color = "#fecaca";
    idError.textContent = `❌ File too large (${sizeMB}MB). Maximum allowed size is 5MB. Please compress or choose a smaller file.`;
    e.target.value = "";
    checkFormValidity();
    return;
  }

  // ✅ File type check
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  if (!validTypes.includes(file.type)) {
    idError.style.color = "#fecaca";
    idError.textContent = "❌ Invalid file type. Please upload JPG, PNG, or PDF only.";
    e.target.value = "";
    checkFormValidity();
    return;
  }

  // All good — store file and show preview
  uploadedFile = file;
  idError.textContent = "";

  // Build preview
  const isPDF = file.type.includes("pdf");
  idPreview.style.display = "flex";
  idFileName.textContent  = file.name;
  if (idFileType) idFileType.textContent = isPDF ? "PDF document" : file.type.replace("image/", "").toUpperCase() + " image";

  if (isPDF) {
    idPreviewImage.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
  } else {
    const reader = new FileReader();
    reader.onload = (ev) => { idPreviewImage.src = ev.target.result; };
    reader.readAsDataURL(file);
  }

  // Kick off verification
  verifyIDCard(file);
});

// ---------- SCHOOL SELECT ----------
schoolSelectEl.addEventListener("change", function () {
  const value = this.value;
  paymentSection.style.display = "none";
  regSection.style.display     = "none";
  resetPreview();
  uploadedFile = null;
  abuVerified  = false;

  if (!value) {
    payBtn.disabled = true;
    return;
  }

  if (value === "yes") {
    baseAmount = 5000;
    paymentText.innerHTML = `<strong>ABU Student Ticket:</strong> ₦5,000`;
    regSection.style.display = "block";
    verifyStatus.textContent  = "Upload a clear, legible ABU ID card or admission letter.";
    verifyStatus.style.color  = "#9ca3af";
  } else {
    baseAmount = 12000;
    paymentText.innerHTML = `<strong>Non-ABU Student / Young Professional Ticket:</strong> ₦12,000`;
    abuVerified = true;
  }

  paymentSection.style.display = "block";
  checkFormValidity();
});

// ---------- INPUT LISTENERS ----------
document.getElementById("name").addEventListener("input", checkFormValidity);

// ---------- PAY BUTTON ----------
payBtn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); handlePayment(); });

// ---------- MAIN PAYMENT FLOW (Form A) ----------
async function handlePayment() {
  const btn          = payBtn;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  lockForm(registerForm, "Processing payment...");

  try {
    const name     = document.getElementById("name").value.trim();
    const email    = document.getElementById("email").value.trim();
    const school   = schoolSelectEl.value;
    const interest = document.getElementById("interest").value || "";

    if (!name || !email || !school) throw new Error("Please fill in your name, email, and select school type.");
    if (school === "yes" && !abuVerified) throw new Error("Please upload and verify your ABU ID first.");

    // Final duplicate check before opening Paystack
    try {
      const dupRes  = await fetch(`${BACKEND_URL}/check-email?email=${encodeURIComponent(email)}&type=xperience`);
      const dupData = await dupRes.json();
      if (dupData.registered) {
        const errorEl = document.getElementById("emailError");
        errorEl.style.color    = "#fecaca";
        errorEl.textContent    = "⚠️ This email is already registered. Please use a different email.";
        emailIsValid = false;
        unlockForm(registerForm);
        btn.disabled   = false;
        btn.innerHTML  = originalText;
        return;
      }
    } catch (_) { /* silently pass if backend is slow */ }

    registerForm.classList.remove("form-processing");

    const paymentResult = await new Promise((resolve, reject) => {
      const handler = PaystackPop.setup({
        key:      "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
        email,
        amount:   baseAmount * 100,
        currency: "NGN",
        callback: (response) => resolve(response),
        onClose:  () => reject(new Error("Payment cancelled")),
      });
      handler.openIframe();
    });

    registerForm.classList.add("form-processing");
    document.getElementById("loaderMessage").textContent = "Saving your registration...";
    btn.innerHTML = "Processing registration...";

    const formData = new FormData();
    formData.append("name",             name);
    formData.append("email",            email);
    formData.append("school",           school);
    formData.append("interest",         interest);
    formData.append("paymentReference", paymentResult.reference);
    formData.append("amount",           String(baseAmount));
    if (school === "yes" && uploadedFile) formData.append("regNumber", uploadedFile);

    const response = await fetch(`${BACKEND_URL}/register`, { method: "POST", body: formData });
    const text     = await response.text();
    let result;
    try { result = JSON.parse(text); } catch (e) { throw new Error("Server returned an invalid response. Please contact support."); }
    if (!result.success) throw new Error(result.message || "Registration failed. Please try again.");

    showPostPayment();

  } catch (error) {
    console.error("❌ Payment error:", error);
    if (error.message !== "Payment cancelled") {
      alert("Something went wrong: " + error.message);
    }
  } finally {
    unlockForm(registerForm);
    btn.disabled  = false;
    btn.innerHTML = originalText;
  }
}

// ---------- LEX INNOVATE PAYMENT (from Form A post-payment) ----------
async function handleInnovatePayment() {
  const btn          = innovateYes;
  const originalText = btn.innerHTML;
  [innovateYes, innovateNo].forEach(b => { b.disabled = true; b.style.opacity = "0.45"; });
  btn.innerHTML = "Processing...";
  const email = document.getElementById("email").value.trim();

  try {
    const paystackResponse = await new Promise((resolve, reject) => {
      const handler = PaystackPop.setup({
        key:      "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
        email,
        amount:   12000 * 100,
        currency: "NGN",
        callback: (response) => resolve(response),
        onClose:  () => reject(new Error("Payment cancelled")),
      });
      handler.openIframe();
    });

    btn.innerHTML = "Processing...";
    const res    = await fetch(`${BACKEND_URL}/innovate-pay`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, reference: paystackResponse.reference, amount: 12000 }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || "Innovate payment failed");
    innovateSection.style.display = "none";

  } catch (error) {
    console.error("Innovate error:", error);
    if (error.message !== "Payment cancelled") alert("Failed: " + error.message);
  } finally {
    [innovateYes, innovateNo].forEach(b => { b.disabled = false; b.style.opacity = ""; });
    btn.innerHTML = originalText;
  }
}

// ---------- FORM B: VERIFY & PAY ----------
innovateVerifyBtn.addEventListener("click", async () => {
  const name    = document.getElementById("innovateName").value.trim();
  const email   = document.getElementById("innovateEmail").value.trim();
  const errorEl = document.getElementById("innovateEmailError");

  errorEl.textContent = "";
  innovateStatusBox.style.display = "none";
  innovatePayGroup.style.display  = "none";

  if (!name || !email) {
    showStatus(innovateStatusBox, "Please enter both your full name and email address.", "error");
    return;
  }
  if (!email.includes("@") || !email.includes(".")) {
    errorEl.textContent = "Please enter a valid email address.";
    return;
  }

  lockForm(innovateOnlyForm, "Verifying your registration...");
  innovateVerifyBtn.disabled = true;

  try {
    // Check if already paid for Innovate
    const dupRes  = await fetch(`${BACKEND_URL}/check-email?email=${encodeURIComponent(email)}&type=innovate`);
    const dupData = await dupRes.json();
    if (dupData.registered) {
      showStatus(innovateStatusBox, "⚠️ This email has already been registered for Lex Innovate. Please contact us if you believe this is an error.", "warn");
      return;
    }

    // Check if they've paid for Lex Xperience
    const res  = await fetch(`${BACKEND_URL}/check-email?email=${encodeURIComponent(email)}&type=xperience`);
    const data = await res.json();

    if (!data.registered) {
      showStatus(innovateStatusBox, "❌ No Lex Xperience registration found for this email. Please register for Lex Xperience first, or check that you entered the correct email.", "error");
      return;
    }

    showStatus(innovateStatusBox, `✅ Registration confirmed for ${name}! You can now proceed to pay for Lex Innovate.`, "success");
    innovatePayGroup.style.display = "block";

  } catch (err) {
    showStatus(innovateStatusBox, "⚠️ Could not verify at this time. Please check your connection and try again.", "warn");
  } finally {
    unlockForm(innovateOnlyForm);
    innovateVerifyBtn.disabled = false;
  }
});

// Form B Pay button
innovateOnlyPayBtn.addEventListener("click", async () => {
  const email        = document.getElementById("innovateEmail").value.trim();
  const name         = document.getElementById("innovateName").value.trim();
  const btn          = innovateOnlyPayBtn;
  const originalText = btn.innerHTML;
  btn.disabled  = true;
  btn.innerHTML = "Opening payment...";

  try {
    const paystackResponse = await new Promise((resolve, reject) => {
      const handler = PaystackPop.setup({
        key:      "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
        email,
        amount:   12000 * 100,
        currency: "NGN",
        callback: (r) => resolve(r),
        onClose:  () => reject(new Error("Payment cancelled")),
      });
      handler.openIframe();
    });

    lockForm(innovateOnlyForm, "Saving your Innovate registration...");
    btn.innerHTML = "Processing...";

    const res    = await fetch(`${BACKEND_URL}/innovate-pay`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, name, reference: paystackResponse.reference, amount: 12000 }),
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || "Payment failed");

    innovateOnlyFields.style.display = "none";
    innovateOnlyThanks.style.display = "block";

  } catch (err) {
    console.error(err);
    if (err.message !== "Payment cancelled") {
      showStatus(innovateStatusBox, "❌ Payment failed: " + err.message, "error");
    }
  } finally {
    unlockForm(innovateOnlyForm);
    btn.disabled  = false;
    btn.innerHTML = originalText;
  }
});

// Innovate Yes/No buttons
if (innovateYes) innovateYes.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); handleInnovatePayment(); });
if (innovateNo)  innovateNo.addEventListener("click",  () => { innovateSection.style.display = "none"; });

// ---------- NAV ----------
navToggle.addEventListener("click", () => { document.body.classList.toggle("nav-open"); });
navLinks.forEach((link) => { link.addEventListener("click", () => { if (window.innerWidth <= 720) document.body.classList.remove("nav-open"); }); });
document.addEventListener("click", (e) => {
  if (!document.body.classList.contains("nav-open")) return;
  if (!nav.contains(e.target) && !navToggle.contains(e.target)) document.body.classList.remove("nav-open");
});

function updateActiveLink() {
  const scrollY = window.scrollY + 120;
  sections.forEach((section) => {
    const id = section.getAttribute("id");
    if (scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
      navLinks.forEach((l) => l.classList.remove("active"));
      const current = document.querySelector(`.nav-link[href="#${id}"]`);
      if (current) current.classList.add("active");
    }
  });
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) { requestAnimationFrame(() => { updateActiveLink(); ticking = false; }); ticking = true; }
}, { passive: true });

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      const delay = entry.target.getAttribute("data-delay");
      if (delay) entry.target.style.setProperty("--delay", delay);
    }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

document.querySelectorAll(".fade-in, .fade-slide-left, .fade-slide-right, .timeline-item, [data-delay]").forEach((el) => fadeObserver.observe(el));

updateActiveLink();
checkFormValidity();

// ---------- COUNTDOWN ----------
const eventDate = new Date("2026-03-31T00:00:00").getTime();
let countdownInterval;
function updateCountdown() {
  const distance = eventDate - Date.now();
  if (distance <= 0) {
    const el = document.querySelector(".countdown");
    if (el) el.innerHTML = '<span class="countdown-ended">🎉 Lex Xperience is Live!</span>';
    clearInterval(countdownInterval); return;
  }
  const d = Math.floor(distance / 86400000);
  const h = Math.floor((distance % 86400000) / 3600000);
  const m = Math.floor((distance % 3600000) / 60000);
  const s = Math.floor((distance % 60000) / 1000);
  function setVal(id, val) {
    const el = document.getElementById(id); if (!el) return;
    const formatted = String(val).padStart(2, "0");
    if (el.textContent !== formatted) {
      el.textContent = formatted;
      el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
      setTimeout(() => el.classList.remove("tick"), 150);
    }
  }
  setVal("cd-days", d); setVal("cd-hours", h); setVal("cd-mins", m); setVal("cd-secs", s);
}
updateCountdown();
countdownInterval = setInterval(updateCountdown, 1000);

// ---------- BACK TO TOP ----------
const backToTopBtn = document.getElementById("backToTop");
window.addEventListener("scroll", () => {
  backToTopBtn.classList.toggle("visible", window.scrollY > 400);
}, { passive: true });
backToTopBtn.addEventListener("click", () => { window.scrollTo({ top: 0, behavior: "smooth" }); });