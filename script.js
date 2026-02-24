// 🔥 PERFECT LEX XPERIENCE SCRIPT.JS - COMPLETE & BULLETPROOF
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

let baseAmount = 0;
let abuVerified = false;
let rafId;
let uploadedFile = null;
let verifyTimeout;
const MOCK_VERIFICATION_MODE = true;

// 🔥 FORM PROTECTION - NO DUPLICATES
registerForm.addEventListener("submit", function(e) {
  e.preventDefault();
  e.stopPropagation();
});

function checkFormValidity() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const school = schoolSelectEl.value;
  const hasFile = uploadedFile !== null;

  let isValid = name && email && school;

  if (school === "yes") {
    isValid = isValid && hasFile && abuVerified;
  }

  payBtn.disabled = !isValid;
  payBtn.style.opacity = isValid ? "1" : "0.6";
  payBtn.style.cursor = isValid ? "pointer" : "not-allowed";
}

function showPostPayment() {
  console.log("🎉 Registration complete - showing success");
  formFields.style.display = "none";
  paymentThanks.style.display = "block";
  innovateSection.style.display = "block";
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

function verifyIDCard(file) {
  if (MOCK_VERIFICATION_MODE) {
    setTimeout(() => {
      abuVerified = true;
      showVerificationSuccess("ABU ID uploaded successfully! You can now proceed.");
      checkFormValidity();
    }, 1200);
  }
}

// 🔥 PERFECTLY FIXED PAYMENT HANDLER - WORKS FOR BOTH ABU & NON-ABU
// 🔥 BULLETPROOF PAYMENT HANDLER
async function handlePayment() {
  console.log("Payment starting...");
  
  const payBtn = document.getElementById("payBtn");
  payBtn.disabled = true;
  payBtn.innerHTML = "Processing...";

  try {
    // Get form values
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

    // Paystack payment
    const paymentResult = await new Promise((resolve, reject) => {
      const handler = PaystackPop.setup({
        key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
        email,
        amount: baseAmount * 100,
        currency: "NGN",
        callback: function(response) {
        resolve(response);
    },
        onClose: () => reject(new Error("Payment cancelled"))
      });
      handler.openIframe();
    });

    console.log("Payment success:", paymentResult.reference);

    // Create FormData
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('school', school);
    formData.append('interest', interest);
    formData.append('paymentReference', paymentResult.reference);

    // File handling
    if (school === "yes" && uploadedFile) {
      formData.append('regNumber', uploadedFile);
    }

    payBtn.innerHTML = "Processing registration...";

    // Backend submission
    response = await fetch("https://lex-xperience-backend.onrender.com/register", {
  method: "POST",
  body: formData
});

    // 🔥 SAFER RESPONSE HANDLING
    const text = await response.text();
    console.log("Backend response:", text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("❌ Invalid JSON:", text);
      throw new Error("Server returned invalid response");
    }

    if (!result.success) {
      throw new Error(result.message || "Registration failed");
    }

    console.log("Registration complete!");
    showPostPayment();

  } catch (error) {
    console.error("❌ Error:", error);
    alert("Registration failed: " + error.message);
  } finally {
    payBtn.disabled = false;
    payBtn.innerHTML = "Proceed to Payment";
  }
}


// 🔥 PERFECT FILE UPLOAD HANDLER
regNumberInput.addEventListener("change", function(e) {
  e.preventDefault(); // ✅ add this
  e.stopPropagation(); // ✅ and this
  const file = e.target.files[0];

  // Clear previous file
  uploadedFile = null;
  abuVerified = false;
  resetPreview();

  if (!file) {
    idError.textContent = "Please upload your ABU ID or admission letter.";
    checkFormValidity();
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    idError.textContent = "File too large. Maximum size is 5MB.";
    e.target.value = ""; // Clear input
    checkFormValidity();
    return;
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    idError.textContent = "Invalid file type. Please upload JPG, PNG, or PDF only.";
    e.target.value = ""; // Clear input
    checkFormValidity();
    return;
  }

  // ✅ ALL VALID - SET UP PREVIEW & VERIFY
  uploadedFile = file;
  idError.textContent = "";
  verifyStatus.textContent = "🔍 Verifying ABU ID...";
  verifyStatus.style.color = "#f7de50";

  // Show preview
  idPreview.style.display = "flex";
  idFileName.textContent = file.name;
  idFileType.textContent = file.type.includes("pdf") ? "PDF document" : `${file.type.toUpperCase()} image`;

  // Set preview image
  if (file.type.includes("pdf")) {
    idPreviewImage.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
  } else {
    idPreviewImage.src = URL.createObjectURL(file);
  }

  // Verify ID
  verifyIDCard(file);
});

// 🔥 SCHOOL SELECTION HANDLER
schoolSelectEl.addEventListener("change", function() {
  const value = this.value;

  // Reset everything
  paymentSection.style.display = "none";
  regSection.style.display = "none";
  resetPreview();
  uploadedFile = null;
  abuVerified = false;

  if (!value) {
    payBtn.disabled = true;
    return;
  }

  // Set pricing & show sections
  if (value === "yes") {
    // ABU Student
    baseAmount = 5000;
    paymentText.textContent = "ABU Student Ticket: ₦5,000";
    regSection.style.display = "block";
    verifyStatus.textContent = "Upload clear, legible ABU ID or admission letter";
    verifyStatus.style.color = "#f7de50";
  } else {
    // Non-ABU Student
    baseAmount = 12000;
    paymentText.textContent = "Non-ABU Student Ticket: ₦12,000";
    abuVerified = true; // Auto-verified for non-ABU
  }

  paymentSection.style.display = "block";
  checkFormValidity();
});

// 🔥 FORM INPUT WATCHERS
document.getElementById("name").addEventListener("input", checkFormValidity);
document.getElementById("email").addEventListener("input", checkFormValidity);

// 🔥 PAY BUTTON - FIXED
payBtn.addEventListener("click", function(e) {
  e.preventDefault();
  e.stopPropagation();
  handlePayment();
});

// 🔥 LEX INNOVATE HANDLERS
if (innovateYes) {
  innovateYes.addEventListener("click", function(e) {
  e.preventDefault();
  e.stopPropagation();

  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Please enter your email first");
    return;
  }

  if (!confirm("Add Lex Innovate Pitch for ₦12,000?")) return;

  payWithPaystack(12000, email, async (response) => {
    try {
      const res = await fetch("https://lex-xperience-backend.onrender.com/innovate-pay", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email,
    reference: response.reference,
    amount: 12000
  })
});

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message);
      }

      alert("🎉 Lex Innovate registration successful!");
      innovateSection.style.display = "none";

    } catch (err) {
      alert("Failed to save Innovate payment");
      console.error(err);
    }
  });
});
}

if (innovateNo) {
  innovateNo.addEventListener("click", function() {
    alert("🎉 Registration complete! Enjoy Lex Xperience 2026!");
    innovateSection.style.display = "none";
  });
}

function payWithPaystack(amount, email, callback) {
  const handler = PaystackPop.setup({
    key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
    email: email,
    amount: amount * 100,
    currency: "NGN",

    callback: function(response) {
      if (callback) {
        callback(response);
      } else {
        console.log("Payment reference:", response.reference);
        alert("Payment successful!");
      }
    },

    onClose: function() {
      alert("Payment cancelled");
    }
  });

  handler.openIframe();
}
// 🔥 NAVIGATION
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

// 🔥 SMOOTH SCROLL & ACTIVE NAV
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

// 🔥 INTERSECTION OBSERVER FOR ANIMATIONS
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

document.querySelectorAll(".fade-in, .fade-slide-left, .fade-slide-right, .timeline-item, [data-delay]").forEach(el => {
  fadeObserver.observe(el);
});

// 🔥 INITIALIZE
updateActiveLink();
checkFormValidity();
console.log("Lex Xperience script loaded perfectly!");
