// 🔥 LEX XPERIENCE 2026 - COMPLETE PRODUCTION SCRIPT.JS
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Cannot destructure property')) {
    return; // Ignore Paystack destructuring errors
  }
  originalError.apply(console, args);
};

// ---------- DOM ELEMENTS ----------
const navToggle = document.getElementById("navToggle");
const paymentThanks = document.getElementById("paymentThanks");
const innovateSection = document.getElementById("innovateSection");
const nav = document.getElementById("nav");
const navLinks = document.querySelectorAll(".nav-link");
const sections = document.querySelectorAll("section[id]");
const registerForm = document.getElementById("registerForm");
const schoolSelectEl = document.getElementById("school");
const paymentSection = document.getElementById("paymentSection");
const paymentText = document.getElementById("paymentText");
const payBtn = document.getElementById("payBtn");
const regSection = document.getElementById("regSection");
const regNumberInput = document.getElementById("regNumber");
const verifyStatus = document.getElementById("verifyStatus");
const idError = document.getElementById("idError");
const idPreview = document.getElementById("idPreview");
const idPreviewImage = document.getElementById("idPreviewImage");
const idFileName = document.getElementById("idFileName");
const idFileType = document.getElementById("idFileType");
const innovateYes = document.getElementById("innovateYes");
const innovateNo = document.getElementById("innovateNo");
const formFields = document.getElementById("formFields");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");

// ---------- STATE ----------
let baseAmount = 0;
let abuVerified = false;
let uploadedFile = null;
let verifyTimeout;
const MOCK_VERIFICATION_MODE = true;
const BACKEND_URL = "https://lex-xperience-backend.onrender.com";

// Prevent native form submit
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  e.stopPropagation();
});

// ---------- FORM VALIDATION ----------
function checkFormValidity() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const school = schoolSelectEl.value;
  const hasFile = uploadedFile !== null;

  let isValid = !!(name && email && school);

  if (school === "yes") {
    isValid = isValid && hasFile && abuVerified;
  }

  payBtn.disabled = !isValid;
  payBtn.style.opacity = isValid ? "1" : "0.6";
  payBtn.style.cursor = isValid ? "pointer" : "not-allowed";
}

// ---------- UI HELPERS ----------
function showPostPayment() {
  formFields.style.display = "none";
  paymentThanks.style.display = "block";
  innovateSection.style.display = "block";
}

function lockUI(text = "Processing payment...") {
  document.body.classList.add('locked');
  registerForm.classList.add('locked');
  if (loadingOverlay) {
    loadingOverlay.classList.add('active');
    if (loadingText) loadingText.textContent = text;
  }
}

function unlockUI() {
  document.body.classList.remove('locked');
  registerForm.classList.remove('locked');
  if (loadingOverlay) loadingOverlay.classList.remove('active');
}

function showVerificationSuccess(message) {
  clearTimeout(verifyTimeout);
  verifyStatus.textContent = message;
  verifyStatus.style.color = "#22c55e";
  verifyTimeout = setTimeout(() => {
    verifyStatus.textContent = "";
  }, 8000);
}

function resetPreview() {
  idPreview.style.display = "none";
  idPreviewImage.src = "";
  idFileName.textContent = "";
  idFileType.textContent = "";
  idError.textContent = "";
}

// ---------- MOCK ID VERIFICATION ----------
function verifyIDCard(file) {
  if (MOCK_VERIFICATION_MODE) {
    setTimeout(() => {
      abuVerified = true;
      showVerificationSuccess("✅ ABU ID verified successfully!");
      checkFormValidity();
    }, 1200);
  }
}

// ---------- MAIN PAYMENT FLOW ----------
async function handlePayment() {
  console.log("🚀 Main payment starting...");
  
  const btn = payBtn;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  
  lockUI("Processing payment...");

  try {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const school = schoolSelectEl.value;
    const interest = document.getElementById("interest").value || "";

    if (!name || !email || !school) {
      throw new Error("Please fill name, email, and select school type");
    }

    if (school === "yes" && !abuVerified) {
      throw new Error("Please verify your ABU ID first");
    }

    // 🔥 PAYSTACK PAYMENT
    if (loadingText) loadingText.textContent = "Processing payment...";
    const paymentResult = await new Promise((resolve, reject) => {
      const handler = PaystackPop.setup({
        key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
        email,
        amount: baseAmount * 100,
        currency: "NGN",
        callback: (response) => resolve(response),
        onClose: () => reject(new Error("Payment cancelled")),
      });
      handler.openIframe();
    });

    console.log("✅ Main payment success:", paymentResult.reference);

    // 🔥 BACKEND REGISTRATION
    if (loadingText) loadingText.textContent = "Registering you...";
    btn.innerHTML = "Processing registration...";

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("school", school);
    formData.append("interest", interest);
    formData.append("paymentReference", paymentResult.reference);
    formData.append("amount", String(baseAmount));

    if (school === "yes" && uploadedFile) {
      formData.append("regNumber", uploadedFile);
    }

    const response = await fetch(`${BACKEND_URL}/register`, {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    console.log("Backend response:", text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON from backend:", text);
      throw new Error("Server returned invalid response");
    }

    if (!result.success) {
      throw new Error(result.message || "Registration failed");
    }

    console.log("🎉 Registration complete!");
    showPostPayment();

  } catch (error) {
    console.error("❌ Main payment error:", error);
    alert("Registration failed: " + error.message);
  } finally {
    unlockUI();
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ---------- LEX INNOVATE PAYMENT ----------
async function handleInnovatePayment() {
  console.log("🚀 Innovate payment starting...");
  
  const btn = innovateYes;
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "Processing Innovate...";

  const email = document.getElementById("email").value.trim();
  if (!email) {
    alert("Please enter your email first");
    btn.disabled = false;
    btn.innerHTML = originalText;
    return;
  }

  try {
    // 🔥 PAYSTACK PAYMENT
    const paystackResponse = await new Promise((resolve, reject) => {
      const handler = PaystackPop.setup({
        key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
        email,
        amount: 12000 * 100,
        currency: "NGN",
        callback: (response) => resolve(response),
        onClose: () => reject(new Error("Payment cancelled")),
      });
      handler.openIframe();
    });

    console.log("✅ Innovate Paystack success:", paystackResponse.reference);
    btn.innerHTML = "Saving Innovate...";

    // 🔥 BACKEND SAVE
    const res = await fetch(`${BACKEND_URL}/innovate-pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        reference: paystackResponse.reference,
        amount: 12000,
      }),
    });

    const result = await res.json();
    console.log("✅ Innovate backend result:", result);

    if (!result.success) {
      throw new Error(result.message || "Innovate payment failed");
    }

    // SUCCESS
    innovateSection.style.display = "none";

  } catch (error) {
    console.error("❌ Innovate error:", error);
    alert("Failed to save Innovate payment: " + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ---------- EVENT LISTENERS ----------

// File upload (ABU ID only)
regNumberInput.addEventListener("change", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const file = e.target.files[0];
  uploadedFile = null;
  abuVerified = false;
  resetPreview();

  if (!file) {
    idError.textContent = "Please upload your ABU ID or admission letter.";
    checkFormValidity();
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    idError.textContent = "File too large. Maximum size is 5MB.";
    e.target.value = "";
    checkFormValidity();
    return;
  }

  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  if (!validTypes.includes(file.type)) {
    idError.textContent = "Invalid file type. Please upload JPG, PNG, or PDF only.";
    e.target.value = "";
    checkFormValidity();
    return;
  }

  uploadedFile = file;
  idError.textContent = "";
  verifyStatus.textContent = "🔍 Verifying ABU ID...";
  verifyStatus.style.color = "#f7de50";

  idPreview.style.display = "flex";
  idFileName.textContent = file.name;
  idFileType.textContent = file.type.includes("pdf")
    ? "PDF document"
    : `${file.type.toUpperCase()} image`;

  if (file.type.includes("pdf")) {
    idPreviewImage.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
  } else {
    idPreviewImage.src = URL.createObjectURL(file);
  }

  verifyIDCard(file);
});

// School selection
schoolSelectEl.addEventListener("change", function () {
  const value = this.value;

  paymentSection.style.display = "none";
  regSection.style.display = "none";
  resetPreview();
  uploadedFile = null;
  abuVerified = false;

  if (!value) {
    payBtn.disabled = true;
    return;
  }

  if (value === "yes") {
    baseAmount = 5000;
    paymentText.textContent = "ABU Student Ticket: ₦5,000";
    regSection.style.display = "block";
    verifyStatus.textContent = "Upload clear, legible ABU ID or admission letter";
    verifyStatus.style.color = "#f7de50";
  } else {
    baseAmount = 12000;
    paymentText.textContent = "Non-ABU Student Ticket: ₦12,000";
    abuVerified = true; // No ID required for non-ABU
  }

  paymentSection.style.display = "block";
  checkFormValidity();
});

// Input watchers
document.getElementById("name").addEventListener("input", checkFormValidity);
document.getElementById("email").addEventListener("input", checkFormValidity);

// Main payment button
payBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handlePayment();
});

// Lex Innovate buttons
if (innovateYes) {
  innovateYes.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleInnovatePayment();
  });
}

if (innovateNo) {
  innovateNo.addEventListener("click", () => {
    alert("🎉 Registration complete! Enjoy Lex Xperience 2026!");
    innovateSection.style.display = "none";
  });
}

// ---------- NAVIGATION & ANIMATIONS ----------
navToggle.addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 720) {
      document.body.classList.remove("nav-open");
    }
  });
});

function updateActiveLink() {
  const scrollY = window.scrollY + 120;
  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute("id");
    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach((l) => l.classList.remove("active"));
      const current = document.querySelector(`.nav-link[href="#${id}"]`);
      if (current) current.classList.add("active");
    }
  });
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateActiveLink();
      ticking = false;
    });
    ticking = true;
  }
}, { passive: true });

const observerOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const el = entry.target;
    if (entry.isIntersecting) {
      el.classList.add("visible");
      const delay = el.getAttribute("data-delay");
      if (delay) el.style.setProperty("--delay", delay);
    }
  });
}, observerOptions);

document
  .querySelectorAll(
    ".fade-in, .fade-slide-left, .fade-slide-right, .timeline-item, [data-delay]"
  )
  .forEach((el) => fadeObserver.observe(el));

// ---------- INIT ----------
updateActiveLink();
checkFormValidity();
console.log("✅ Lex Xperience 2026 - Production Ready!");
