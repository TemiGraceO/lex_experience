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
const regNumberInput = document.getElementById("regNumber");
const regError = document.getElementById("regError");
const verifyStatus = document.getElementById("verifyStatus");

const innovateSection = document.getElementById("innovateSection");
const innovateYes = document.getElementById("innovateYes");
const innovateNo = document.getElementById("innovateNo");

let baseAmount = 0;
let abuVerified = false;
let rafId;

// ⚠️ TEST MODE: Set this to TRUE to bypass the backend verification for testing
const MOCK_VERIFICATION_MODE = true; 

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
    // Handle select inputs differently if needed, but querySelector works for value
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
  formSuccess.hidden = false;
  formSuccess.style.animation = "fadeInUp 0.5s ease-out";
  formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { formSuccess.hidden = true; formSuccess.style.animation = ""; }, 5000);
}

// =========================
// ===== SCHOOL SELECT & PAYMENT LOGIC =====
schoolSelectEl.addEventListener("change", () => {
  const value = schoolSelectEl.value;

  if (!value) {
    paymentSection.style.display = "none";
    regSection.style.display = "none";
    return;
  }

  if (value === "yes") {
    baseAmount = 5000;
    paymentText.textContent = "ABU Student Ticket: ₦5,000";
    regSection.style.display = "block";
    abuVerified = false;
    payBtn.disabled = true; // Start disabled until verified
    verifyStatus.textContent = "Please enter your Reg Number to verify.";
    verifyStatus.style.color = "#333";
  } else {
    baseAmount = 12000;
    paymentText.textContent = "Non-ABU Student Ticket: ₦12,000";
    regSection.style.display = "none";
    abuVerified = true; // No verification needed
    payBtn.disabled = false;
    verifyStatus.textContent = "";
    regError.textContent = "";
  }

  paymentSection.style.display = "block";
});

// =========================
// ===== VERIFY ABU STUDENT =====
regNumberInput.addEventListener("input", () => {
    // Optional: Re-verify on typing if you want, but blur is fine
});
regNumberInput.addEventListener("blur", verifyABUStudent);

function verifyABUStudent() {
  const name = document.getElementById("name").value.trim();
  const regNumber = regNumberInput.value.trim();

  if (!name || !regNumber) return;

  verifyStatus.textContent = "Checking student record...";
  verifyStatus.style.color = "#333";
  payBtn.disabled = true;

  // ⚠️ MOCK MODE LOGIC
  if (MOCK_VERIFICATION_MODE) {
    console.log("⚠️ MOCK MODE: Skipping real API call.");
    setTimeout(() => {
      // Simulate success for testing
      abuVerified = true;
      verifyStatus.textContent = "✅ Verified (Mock Mode). You can proceed.";
      verifyStatus.style.color = "green";
      regError.textContent = "";
      payBtn.disabled = false;
    }, 1000);
    return;
  }

  // ⚠️ REAL API LOGIC (Uncomment when you have a backend)
  /*
  fetch("https://yourserver.com/api/verify-student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, regNumber })
  })
    .then(res => res.json())
    .then(data => {
      if (data.valid) {
        abuVerified = true;
        verifyStatus.textContent = "✅ Verified. Proceed to payment.";
        verifyStatus.style.color = "green";
        regError.textContent = "";
        payBtn.disabled = false;
      } else {
        handleVerificationFail("Name and registration number do not match.");
      }
    })
    .catch(() => {
      handleVerificationFail("Unable to connect to verification server.");
    });
  */

  function handleVerificationFail(msg) {
      abuVerified = false;
      verifyStatus.textContent = "";
      regError.textContent = msg;
      payBtn.disabled = true;
  }
}

// =========================
// ===== PAYSTACK PAYMENT =====
function payWithPaystack(amount, email, callback) {
  // 1. Check if Paystack is loaded
  if (typeof PaystackPop === 'undefined') {
    alert("Payment system is loading. Please wait a moment and try again.");
    console.error("PaystackPop is not defined. Check internet connection or script load.");
    return;
  }

  // 2. Validate Amount
  if (amount <= 0) {
    alert("Invalid ticket amount.");
    return;
  }

  let handler = PaystackPop.setup({
    key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a", // ⚠️ Rotate this key if you share code publicly
    email: email,
    amount: amount * 100, // Convert Naira to Kobo
    currency: "NGN",
    theme: {
    color: "#f7de50" },
    callback: function(response) {
      console.log("Payment Success:", response);
      callback(response);
    },
    onClose: function() { 
      console.log("Payment Closed");
      // Don't alert here, it's annoying if they just clicked away
    }
  });
  
  handler.openIframe();
}

// First Payment (Main Ticket)
payBtn.addEventListener("click", () => {
  console.log("Pay Button Clicked"); // Debug Log
  
  const email = document.getElementById("email").value.trim();
  const name = document.getElementById("name").value.trim();

  if (!email || !name) {
    alert("Please fill your name and email first.");
    return;
  }

  if (schoolSelectEl.value === "yes" && !abuVerified) {
    alert("Please verify your ABU registration number first.");
    return;
  }

  console.log("Initiating Paystack for:", baseAmount);
  payWithPaystack(baseAmount, email, (response) => {
    alert("🎉 Payment successful! Transaction reference: " + response.reference);

    // Send confirmation email
    fetch('http://localhost:3000/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reference: response.reference,
            email: email,
            name: document.getElementById('name').value
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
    // showSuccess(); // Don't show success yet, wait for Innovate choice
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