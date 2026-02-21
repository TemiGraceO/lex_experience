const navToggle = document.getElementById("navToggle");
const paymentThanks = document.getElementById("paymentThanks");
const innovateSection = document.getElementById("innovateSection");
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
const verifyStatus = document.getElementById("verifyStatus");
const idError = document.getElementById("idError");
const idPreview = document.getElementById("idPreview");
const idPreviewImage = document.getElementById("idPreviewImage");
const idFileName = document.getElementById("idFileName");
const idFileType = document.getElementById("idFileType");
const innovateYes = document.getElementById("innovateYes");
const innovateNo = document.getElementById("innovateNo");
const formFields = document.getElementById("formFields");

let baseAmount = 0;
let abuVerified = false;
let rafId;
let uploadedFile = null;
let verifyTimeout;

const MOCK_VERIFICATION_MODE = true;

// 🔥 SINGLE FORM PROTECTION - NO DUPLICATES
registerForm.onsubmit = function() { return false; };
payBtn.onclick = function(e) {
  e.preventDefault();
  e.stopPropagation();
  handlePayment();
  return false;
};

function checkFormValidity() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const school = schoolSelectEl.value;
  const hasFile = uploadedFile !== null;

  let isValid = false;

  if (name && email && school) {
    if (school === "yes") {
      isValid = hasFile && abuVerified;
    } else {
      isValid = true;
    }
  }

  payBtn.disabled = !isValid;
  payBtn.style.opacity = isValid ? "1" : "0.6";
  payBtn.style.cursor = isValid ? "pointer" : "not-allowed";
}

function showSuccess() {
  registerForm.reset();
  uploadedFile = null;
  abuVerified = false;
  if (formSuccess) {
    formSuccess.hidden = false;
    formSuccess.style.animation = "fadeInUp 0.5s ease-out";
    setTimeout(() => { 
      formSuccess.hidden = true; 
      formSuccess.style.animation = ""; 
      payBtn.disabled = true;
      payBtn.style.opacity = "0.6";
    }, 5000);
  }
}

function showVerificationSuccess(message) {
  clearTimeout(verifyTimeout);
  verifyStatus.textContent = message;
  verifyStatus.style.color = "#22c55e";
  verifyTimeout = setTimeout(() => {
    verifyStatus.textContent = "";
  }, 10000);
}

function resetPreview() {
  idPreview.style.display = "none";
  idPreviewImage.src = "";
  idFileName.textContent = "";
  idFileType.textContent = "";
}

function verifyIDCard(file) {
  if (MOCK_VERIFICATION_MODE) {
    setTimeout(() => {
      abuVerified = true;
      showVerificationSuccess("✅ ID uploaded successfully. You can proceed to payment.");
      checkFormValidity();
    }, 1000);
    return;
  }
}

function showPostPayment() {
  console.log("🎉 showPostPayment called");
  if (formFields) formFields.style.display = "none";
  if (paymentThanks) paymentThanks.style.display = "block";
  if (innovateSection) innovateSection.style.display = "block";
  registerForm.reset();
  uploadedFile = null;
  abuVerified = false;
}

async function handlePayment() {
  console.log("🔥 Payment started");
  payBtn.disabled = true;
  payBtn.innerHTML = "⏳ Opening payment...";

  try {
    const email = document.getElementById("email").value.trim();
    const name = document.getElementById("name").value.trim();

    if (!email || !name) throw new Error("Please fill name and email");

    if (schoolSelectEl.value === "yes" && !abuVerified) {
      throw new Error("Please verify ABU ID first");
    }

    // Paystack payment
    const paymentResult = await new Promise((resolve, reject) => {
      const handler = PaystackPop.setup({
        key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
        email: email,
        amount: baseAmount * 100,
        currency: "NGN",
        theme: { color: "#f7de50" },
        callback: (response) => resolve(response),
        onClose: () => reject(new Error("Payment cancelled"))
      });
      handler.openIframe();
    });

    console.log("✅ Payment success:", paymentResult.reference);

    // Create FormData manually
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('school', schoolSelectEl.value);
    formData.append('interest', document.getElementById('interest').value);
    formData.append('paymentReference', paymentResult.reference);

    // Add file if exists
    const file = document.getElementById('regNumber').files[0];
    if (file) {
      formData.append('regNumber', file);
    }

    const res = await fetch("http://localhost:5000/register", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || "Server error");
    }

    const data = await res.json();
    if (data.success) {
      showPostPayment();
    } else {
      throw new Error(data.message || "Registration failed");
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
    alert("Registration failed: " + error.message);
  } finally {
    payBtn.disabled = false;
    payBtn.innerHTML = "Proceed to Payment";
  }
}

// 🔥 FIXED FILE UPLOAD - COMPLETE WORKING VERSION
regNumberInput.addEventListener("change", function(e) {
  const file = e.target.files[0];

  if (!file) {
    uploadedFile = null;
    abuVerified = false;
    resetPreview();
    checkFormValidity();
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    idError.textContent = "File too large. Maximum size is 5MB.";
    verifyStatus.textContent = "";
    uploadedFile = null;
    abuVerified = false;
    resetPreview();
    checkFormValidity();
    return;
  }

  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    idError.textContent = "Invalid file type. Please upload JPG, PNG, or PDF.";
    verifyStatus.textContent = "";
    uploadedFile = null;
    abuVerified = false;
    resetPreview();
    checkFormValidity();
    return;
  }

  uploadedFile = file;
  idError.textContent = "";
  verifyStatus.textContent = "File selected. Verifying...";
  verifyStatus.style.color = "#f7de50";

  idPreview.style.display = "flex";
  idFileName.textContent = file.name;
  idFileType.textContent = file.type.includes("pdf") ? "PDF document" : "Image file";

  if (file.type.includes("pdf")) {
    idPreviewImage.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
  } else {
    idPreviewImage.src = URL.createObjectURL(file);
  }

  verifyIDCard(file);
});

// Navigation
navToggle.addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
});

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 720) {
      document.body.classList.remove("nav-open");
    }
  });
});

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

// Form events
schoolSelectEl.addEventListener("change", () => {
  const value = schoolSelectEl.value;

  if (!value) {
    paymentSection.style.display = "none";
    regSection.style.display = "none";
    resetPreview();
    checkFormValidity();
    return;
  }

  if (value === "yes") {
    baseAmount = 5000;
    paymentText.textContent = "ABU Student Ticket: ₦5,000";
    regSection.style.display = "block";
    abuVerified = false;
    uploadedFile = null;
    verifyStatus.textContent = "Must be clear and legible";
    verifyStatus.style.color = "#f7de50";
    idError.textContent = "";
    resetPreview();
  } else {
    baseAmount = 12000;
    paymentText.textContent = "Non-ABU Student Ticket: ₦12,000";
    regSection.style.display = "none";
    abuVerified = true;
    verifyStatus.textContent = "";
    idError.textContent = "";
    resetPreview();
  }

  paymentSection.style.display = "block";
  checkFormValidity();
});

document.getElementById("name").addEventListener("input", checkFormValidity);
document.getElementById("email").addEventListener("input", checkFormValidity);

// Lex Innovate buttons
if (innovateYes) {
  innovateYes.addEventListener("click", () => {
    const email = document.getElementById("email").value.trim();
    payWithPaystack(12000, email, () => {
      alert("🎉 Payment complete! You are registered for Lex Innovate.");
      innovateSection.style.display = "none";
      showSuccess();
    });
  });
}

if (innovateNo) {
  innovateNo.addEventListener("click", () => {
    alert("🎉 Registration complete!");
    innovateSection.style.display = "none";
    showSuccess();
  });
}

function payWithPaystack(amount, email, callback) {
  return new Promise((resolve, reject) => {
    if (typeof PaystackPop === 'undefined') {
      reject(new Error("Payment system not loaded"));
      return;
    }

    let handler = PaystackPop.setup({
      key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
      email: email,
      amount: amount * 100,
      currency: "NGN",
      theme: { color: "#f7de50" },
      callback: function(response) {
        console.log("💳 Paystack callback:", response);
        resolve(response);
        callback(response);
      },
      onClose: function() {
        console.log("❌ Payment cancelled");
        reject(new Error("Payment cancelled"));
      }
    });

    handler.openIframe();
  });
}

checkFormValidity();
