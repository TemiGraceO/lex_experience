// 🔥 LEX XPERIENCE SCRIPT.JS (LOGIC ONLY - DESIGN UNTOUCHED)
// Add this at the VERY TOP of script.js (first lines after variable declarations)
window.addEventListener('error', (e) => {
  if (e.filename && e.filename.includes('index-DL8lJNkN.js')) {
    e.preventDefault();
    console.warn('Ignoring platform bundle error:', e.message);
  }
}, true);

const app = express();

// ✅ ADD THESE 4 LINES (before other middleware)
app.use(express.static(path.join(__dirname, '.')));  // Serve HTML/CSS/JS
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && e.reason.message && e.reason.message.includes('language')) {
    e.preventDefault();
    console.warn('Ignoring platform promise rejection');
  }
}, true);

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
let uploadedFile = null;
let verifyTimeout;
const MOCK_VERIFICATION_MODE = true;

// Prevent native submit (we control flow)
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  e.stopPropagation();
});

// ---------- Form helpers ----------

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

function showPostPayment() {
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

// ---------- Main Lex payment ----------

async function handlePayment() {
  console.log("Payment starting...");

  const btn = payBtn;
  btn.disabled = true;
  btn.innerHTML = "Processing...";

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

    // Paystack popup for main ticket
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

    console.log("Main payment success:", paymentResult.reference);

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

    btn.innerHTML = "Processing registration...";

    const response = await fetch("https://lex-xperience-backend.onrender.com/register", {
      method: "POST",
      body: formData,
    });

    const text = await response.text();
    console.log("Register backend response:", text);

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("Invalid JSON from /register:", text);
      throw new Error("Server returned invalid response");
    }

    if (!result.success) {
      throw new Error(result.message || "Registration failed");
    }

    console.log("Registration complete!");
    showPostPayment();
  } catch (error) {
    console.error("Main payment error:", error);
    alert("Registration failed: " + error.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Proceed to Payment";
  }
}

// ---------- File upload (ABU ID) ----------

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

  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
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

// ---------- School selection ----------

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
    abuVerified = true; // no ID required
  }

  paymentSection.style.display = "block";
  checkFormValidity();
});

// ---------- Input watchers ----------

document.getElementById("name").addEventListener("input", checkFormValidity);
document.getElementById("email").addEventListener("input", checkFormValidity);

payBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  handlePayment();
});

// ---------- Lex Innovate handlers (SECOND PAYMENT) ----------

function payWithPaystack(amount, email, callback) {
  const handler = PaystackPop.setup({
    key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
    email,
    amount: amount * 100,
    currency: "NGN",
    callback: (response) => {
      if (callback) {
        callback(response);
      } else {
        console.log("Payment reference:", response.reference);
        alert("Payment successful!");
      }
    },
    onClose: () => {
      alert("Payment cancelled");
    },
  });

  handler.openIframe();
}

if (innovateYes) {
  innovateYes.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const email = document.getElementById("email").value.trim();

    if (!email) {
      alert("Please enter your email first");
      return;
    }

    if (!confirm("Add Lex Innovate Pitch for ₦12,000?")) return;

    payWithPaystack(12000, email, async (paystackResponse) => {
      try {
        console.log("Innovate Paystack success:", paystackResponse);

        const res = await fetch(
          "https://lex-xperience-backend.onrender.com/innovate-pay",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              reference: paystackResponse.reference,
              amount: 12000,
            }),
          }
        );

        console.log("Innovate fetch status:", res.status);
        const result = await res.json();
        console.log("Innovate backend JSON:", result);

        if (!result.success) {
          throw new Error(result.message || "Innovate payment failed");
        }

        alert("🎉 Lex Innovate registration successful!");
        innovateSection.style.display = "none";
      } catch (err) {
        console.error("Innovate error:", err);
        alert("Failed to save Innovate payment: " + err.message);
      }
    });
  });
}

if (innovateNo) {
  innovateNo.addEventListener("click", () => {
    alert("🎉 Registration complete! Enjoy Lex Xperience 2026!");
    innovateSection.style.display = "none";
  });
}

// ---------- Navigation & animations (unchanged design) ----------

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
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateActiveLink();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true }
);

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

updateActiveLink();
checkFormValidity();
console.log("Lex Xperience script loaded.");
