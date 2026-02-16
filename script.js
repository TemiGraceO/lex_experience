// =========================
// ===== GLOBAL VARIABLES =====
const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");
const navLinks = document.querySelectorAll(".nav-link");

const sections = document.querySelectorAll("section[id]");
const registerForm = document.getElementById("registerForm");
const formSuccess = document.getElementById("formSuccess");

const schoolSelectEl = document.getElementById("school");
const paymentSection = document.getElementById("paymentSection");
const paymentText = document.getElementById("paymentText");
const payBtn = document.getElementById("payBtn");

const regSection = document.getElementById("regSection");
const regNumberInput = document.getElementById("regNumber"); // Now file input
const verifyStatus = document.getElementById("verifyStatus");
const idError = document.getElementById("idError");

const innovateSection = document.getElementById("innovateSection");
const innovateYes = document.getElementById("innovateYes");
const innovateNo = document.getElementById("innovateNo");

let baseAmount = 0;
let abuVerified = false;
let rafId;
let uploadedFile = null;

// ⚠️ TEST MODE: Set to FALSE when you have backend ready for file verification
const MOCK_VERIFICATION_MODE = true; 

// =========================
// ===== FORM VALIDITY CHECKER =====
function checkFormValidity() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const school = schoolSelectEl.value;
  const hasFile = uploadedFile !== null;
  
  let isValid = false;
  
  // Check basic fields
  if (name && email && school) {
    if (school === "yes") {
      // ABU student: needs file upload AND verification
      isValid = hasFile && abuVerified;
    } else {
      // Non-ABU student: just needs basic fields
      isValid = true;
    }
  }
  
  // Enable/disable button
  payBtn.disabled = !isValid;
  
  // Visual feedback
  if (isValid) {
    payBtn.style.opacity = "1";
    payBtn.style.cursor = "pointer";
  } else {
    payBtn.style.opacity = "0.6";
    payBtn.style.cursor = "not-allowed";
  }
}

// =========================
// ===== MOBILE NAV TOGGLE =====
navToggle.addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
  if (document.body.classList.contains("nav-open")) {
    nav.style.transform = "translateY(0)";
    nav.style.opacity = "1";
  } else {
    nav.style.transform = "translateY(-120%)";
    nav.style.opacity = "0";
  }
});

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    nav.style.transform = "translateY(-120%)";
    nav.style.opacity = "0";
  });
});

// =========================
// ===== ACTIVE LINK ON SCROLL =====
function updateActiveLink() {
  const scrollY = window.scrollY + 120;
  sections.forEach(section => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute("id");
    if (scrollY >= top && scrollY < top + height) {
      navLinks.forEach(l => l.classList.remove("active"));
      const current = document.querySelector(`.nav-link[href="#${id}"]`);
      if (current) current.classList.add("active");
    }
  });
}

window.addEventListener("scroll", () => {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(updateActiveLink);
}, { passive: true });

updateActiveLink();

// =========================
// ===== SCROLL REVEAL =====
const observerOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const el = entry.target;
    if (entry.isIntersecting) {
      el.classList.add("visible");
      const delay = el.getAttribute("data-delay");
      if (delay) el.style.setProperty("--delay", delay);
    }
  });
}, observerOptions);

document.querySelectorAll(".fade-in, .fade-slide-left, .fade-slide-right, .timeline-item, [data-delay]").forEach(el => fadeObserver.observe(el));

// =========================
// ===== FORM VALIDATION =====
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (validateForm()) showSuccess();
});

function validateForm() {
  const fields = [
    { name: "name", message: "Please enter your full name." },
    { name: "email", message: "Please enter a valid email address.", validator: email => /^\S+@\S+\.\S+$/.test(email) },
    { name: "school", message: "Please select an option." }
  ];

  let isValid = true;
  fields.forEach(field => {
    const input = registerForm.querySelector(`[name="${field.name}"]`);
    const group = input.closest(".form-group");
    const errorEl = group.querySelector(".error-message");
    group.classList.remove("error");
    errorEl.textContent = "";

    const value = input.value.trim();
    if (!value || (field.validator && !field.validator(value))) {
      group.classList.add("error");
      errorEl.textContent = field.message;
      isValid = false;
    }
  });
  return isValid;
}

function showSuccess() {
  registerForm.reset();
  uploadedFile = null;
  abuVerified = false;
  formSuccess.hidden = false;
  formSuccess.style.animation = "fadeInUp 0.5s ease-out";
  formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { 
    formSuccess.hidden = true; 
    formSuccess.style.animation = ""; 
    payBtn.disabled = true;
    payBtn.style.opacity = "0.6";
  }, 5000);
}

// =========================
// ===== SCHOOL SELECT & PAYMENT LOGIC =====
schoolSelectEl.addEventListener("change", () => {
  const value = schoolSelectEl.value;

  if (!value) {
    paymentSection.style.display = "none";
    regSection.style.display = "none";
    checkFormValidity();
    return;
  }

  if (value === "yes") {
    baseAmount = 5000;
    paymentText.textContent = "ABU Student Ticket: ₦5,000";
    regSection.style.display = "block";
    abuVerified = false;
    uploadedFile = null;
    verifyStatus.textContent = "ID card or Admission Letter must be clear and legible";
    verifyStatus.style.color = "#f7de50";
    idError.textContent = "";
    payBtn.disabled = true;
    payBtn.style.opacity = "0.6";
  } else {
    baseAmount = 12000;
    paymentText.textContent = "Non-ABU Student Ticket: ₦12,000";
    regSection.style.display = "none";
    abuVerified = true; // No verification needed for non-ABU
    verifyStatus.textContent = "";
    idError.textContent = "";
    payBtn.disabled = false;
    payBtn.style.opacity = "1";
  }

  paymentSection.style.display = "block";
  checkFormValidity();
});

// =========================
// ===== FILE UPLOAD HANDLING =====
regNumberInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  
  if (!file) {
    uploadedFile = null;
    abuVerified = false;
    checkFormValidity();
    return;
  }

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    idError.textContent = "File too large. Maximum size is 5MB.";
    verifyStatus.textContent = "";
    uploadedFile = null;
    abuVerified = false;
    checkFormValidity();
    return;
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    idError.textContent = "Invalid file type. Please upload JPG, PNG, or PDF.";
    verifyStatus.textContent = "";
    uploadedFile = null;
    abuVerified = false;
    checkFormValidity();
    return;
  }

  // File is valid
  uploadedFile = file;
  idError.textContent = "";
  verifyStatus.textContent = "File selected. Verifying...";
  verifyStatus.style.color = "#333";
  
  // Trigger verification
  verifyIDCard(file);
});

// =========================
// ===== VERIFY ID CARD =====
function verifyIDCard(file) {
  if (MOCK_VERIFICATION_MODE) {
    // Simulate verification delay
    setTimeout(() => {
      abuVerified = true;
      verifyStatus.textContent = "✅ ID uploaded successfully. You can proceed to payment.";
      verifyStatus.style.color = "green";
      checkFormValidity();
    }, 1000);
    return;
  }

  // REAL BACKEND VERIFICATION
  const formData = new FormData();
  formData.append('idCard', file);
  formData.append('name', document.getElementById("name").value.trim());
  formData.append('email', document.getElementById("email").value.trim());

  fetch("https://lex-backend.onrender.com/api/verify-id", {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.valid) {
      abuVerified = true;
      verifyStatus.textContent = "✅ ID verified. Proceed to payment.";
      verifyStatus.style.color = "green";
      checkFormValidity();
    } else {
      abuVerified = false;
      verifyStatus.textContent = "";
      idError.textContent = data.message || "ID verification failed. Please ensure it's a clear photo of your ABU ID card.";
      checkFormValidity();
    }
  })
  .catch(err => {
    console.error(err);
    abuVerified = false;
    verifyStatus.textContent = "Verification service unavailable. Please try again.";
    verifyStatus.style.color = "red";
    checkFormValidity();
  });
}

// =========================
// ===== REAL-TIME VALIDATION LISTENERS =====
// Check validity whenever user types in required fields
document.getElementById("name").addEventListener("input", checkFormValidity);
document.getElementById("email").addEventListener("input", checkFormValidity);

// =========================
// ===== PAYSTACK PAYMENT =====
function payWithPaystack(amount, email, callback) {
  if (typeof PaystackPop === 'undefined') {
    alert("Payment system is loading. Please wait a moment and try again.");
    console.error("PaystackPop is not defined.");
    return;
  }

  if (amount <= 0) {
    alert("Invalid ticket amount.");
    return;
  }

  let handler = PaystackPop.setup({
    key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
    email: email,
    amount: amount * 100,
    currency: "NGN",
    theme: { color: "#f7de50" },
    callback: function(response) {
      console.log("Payment Success:", response);
      callback(response);
    },
    onClose: function() { 
      console.log("Payment Closed");
    }
  });
  
  handler.openIframe();
}

// First Payment (Main Ticket)
payBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const name = document.getElementById("name").value.trim();

  if (!email || !name) {
    alert("Please fill your name and email first.");
    return;
  }

  if (schoolSelectEl.value === "yes" && !abuVerified) {
    alert("Please upload and verify your ABU ID card first.");
    return;
  }

  // Save to Google Sheets (if you have the URL set up)
  // saveToGoogleSheets(name, email, uploadedFile?.name || "No file");

  console.log("Initiating Paystack for:", baseAmount);
  payWithPaystack(baseAmount, email, (response) => {
    alert("🎉 Payment successful! Transaction reference: " + response.reference);

    // Send confirmation email
    fetch('https://lex-backend.onrender.com/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reference: response.reference,
            email: email,
            name: name,
            school: schoolSelectEl.value,
            idFileName: uploadedFile?.name || "N/A"
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log("Confirmation email sent!");
        } else {
            console.error("Failed to send email:", data.message);
        }
    })
    .catch(err => console.error(err));
    
    innovateSection.style.display = "block";
    paymentSection.style.display = "none";
  });
});

// Lex Innovate Add-on
innovateYes.addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  payWithPaystack(12000, email, () => {
    alert("🎉 Payment complete! You are registered for Lex Innovate.");
    innovateSection.style.display = "none";
    showSuccess();
  });
});

innovateNo.addEventListener("click", () => {
  alert("🎉 Registration complete!");
  innovateSection.style.display = "none";
  showSuccess();
});