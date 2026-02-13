// ===== ENHANCED MOBILE NAV TOGGLE =====
const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");
const navLinks = document.querySelectorAll(".nav-link");

if (navToggle) {
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
}

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    nav.style.transform = "translateY(-120%)";
    nav.style.opacity = "0";
  });
});

// ===== ACTIVE LINK ON SCROLL =====
const sections = document.querySelectorAll("section[id]");
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

// ===== BI-DIRECTIONAL SCROLL REVEAL (UP + DOWN) =====
const observerOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const el = entry.target;
    if (entry.isIntersecting) {
      el.classList.add("visible");
      const delay = el.getAttribute("data-delay");
      if (delay) el.style.setProperty("--delay", delay);
    } else {
      if (el.classList.contains("fade-in") ||
          el.classList.contains("fade-slide-left") ||
          el.classList.contains("fade-slide-right")) {
        el.classList.remove("visible");
      }
    }
  });
}, observerOptions);

document.querySelectorAll(".fade-in, .fade-slide-left, .fade-slide-right, .timeline-item, [data-delay]").forEach(el => {
  fadeObserver.observe(el);
});

// ===== IMAGE SCATTER EFFECT (TRIGGER ONCE) =====
function createScatterEffect(target) {
  if (target.dataset.scattered === "true") return;
  target.dataset.scattered = "true";

  const rect = target.getBoundingClientRect();
  const particleCount = 25;
  const particlesContainer = document.createElement("div");
  particlesContainer.className = "scatter-particles";

  target.parentElement.style.position = "relative";
  target.parentElement.appendChild(particlesContainer);

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.width = `${Math.random() * 8 + 4}px`;
    particle.style.height = particle.style.width;
    particle.style.left = `${Math.random() * rect.width}px`;
    particle.style.top = `${Math.random() * rect.height}px`;

    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 200;
    particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    particle.style.animationDelay = `${Math.random() * 0.2}s`;
    particlesContainer.appendChild(particle);
  }

  setTimeout(() => {
    particlesContainer.classList.add("active");
    setTimeout(() => {
      if (particlesContainer.parentNode) {
        particlesContainer.parentNode.removeChild(particlesContainer);
      }
    }, 2000);
  }, 1000);
}

const heroImageFrame = document.querySelector(".scatter-effect");
if (heroImageFrame) {
  const imageObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target.querySelector("img");
        if (img && !img.dataset.scattered) createScatterEffect(img);
        imageObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.7 });

  imageObserver.observe(heroImageFrame);
}

// ===== ENHANCED FORM VALIDATION =====
const registerForm = document.getElementById("registerForm");
const formSuccess = document.getElementById("formSuccess");

if (registerForm) {
  registerForm.addEventListener("submit", e => {
    e.preventDefault();
    if (validateForm()) showSuccess();
  });
}

function validateForm() {
  const fields = [
    { name: "name", message: "Please enter your full name." },
    { name: "email", message: "Please enter a valid email.", validator: v => /^\S+@\S+\.\S+$/.test(v) },
    { name: "school", message: "Please enter your institution." },
    { name: "role", message: "Please select your role." }
  ];

  let ok = true;

  fields.forEach(field => {
    const input = registerForm.querySelector(`[name="${field.name}"]`);
    if (!input) return;
    const group = input.closest(".form-group");
    const errorEl = group.querySelector(".error-message");

    group.classList.remove("error");
    errorEl.textContent = "";

    const value = input.value.trim();
    if (!value || (field.validator && !field.validator(value))) {
      group.classList.add("error");
      errorEl.textContent = field.message;
      ok = false;

      group.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => group.style.animation = "", 500);
    }
  });

  return ok;
}

function showSuccess() {
  registerForm.reset();
  formSuccess.hidden = false;
  formSuccess.style.animation = "fadeInUp 0.5s ease-out";
  formSuccess.scrollIntoView({ behavior: "smooth", block: "center" });

  setTimeout(() => {
    formSuccess.hidden = true;
    formSuccess.style.animation = "";
  }, 5000);
}

// ===== PERFORMANCE OPTIMIZED SCROLL =====
let rafId;
window.addEventListener("scroll", () => {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(updateActiveLink);
}, { passive: true });

if (!('IntersectionObserver' in window)) {
  setTimeout(() => {
    document.querySelectorAll(".fade-in, .fade-slide-left, .fade-slide-right").forEach(el => el.classList.add("visible"));
  }, 100);
}

const criticalImages = document.querySelectorAll(".hero-image");
criticalImages.forEach(img => {
  if (img.complete) img.style.opacity = "1";
  else img.addEventListener('load', function() { this.style.opacity = "1"; });
});


// ================= PAYMENT + ABU VERIFICATION =================
const schoolSelectEl = document.getElementById("school");
const paymentSection = document.getElementById("paymentSection");
const paymentText = document.getElementById("paymentText");
const payBtn = document.getElementById("payBtn");
const innovateSection = document.getElementById("innovateSection");
const innovateYes = document.getElementById("innovateYes");
const innovateNo = document.getElementById("innovateNo");
const regSection = document.getElementById("regSection");
const regNumberInput = document.getElementById("regNumber");
const regError = document.getElementById("regError");
const verifyStatus = document.getElementById("verifyStatus");

let baseAmount = 0;
let abuVerified = false;

// ===== GLOBAL PAYSTACK FUNCTION =====
function payWithPaystack(amount, email, callback) {
  let handler = PaystackPop.setup({
    key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
    email: email,
    amount: amount * 100,
    currency: "NGN",
    callback: function(response) { callback(response); },
    onClose: function() { alert("Payment window closed."); }
  });
  handler.openIframe();
}

// ===== SCHOOL SELECT =====
if (schoolSelectEl) {
  schoolSelectEl.addEventListener("change", () => {
    if (!schoolSelectEl.value) { paymentSection.style.display = "none"; return; }
    if (schoolSelectEl.value === "yes") {
      baseAmount = 5000;
      paymentText.textContent = "ABU Student Ticket: ₦5,000";
      regSection.style.display = "block";
      abuVerified = false;
      payBtn.disabled = true;
      verifyStatus.textContent = "Please verify your registration number.";
    } else {
      baseAmount = 12000;
      paymentText.textContent = "Non-ABU Student Ticket: ₦12,000";
      regSection.style.display = "none";
      abuVerified = true;
      payBtn.disabled = false;
      verifyStatus.textContent = "";
      regError.textContent = "";
    }
    paymentSection.style.display = "block";
  });
}

// ===== VERIFY STUDENT =====
if (regNumberInput) {
  regNumberInput.addEventListener("blur", verifyABUStudent);
}

function verifyABUStudent() {
  const name = document.getElementById("name").value.trim();
  const regNumber = regNumberInput.value.trim();
  if (!name || !regNumber) return;

  verifyStatus.textContent = "Checking student record...";
  payBtn.disabled = true;

  fetch("https://yourserver.com/api/verify-student", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, regNumber })
  })
  .then(res => res.json())
  .then(data => {
    if (data.valid) {
      abuVerified = true;
      verifyStatus.textContent = "✅ Verified. You can proceed.";
      regError.textContent = "";
      payBtn.disabled = false;
    } else {
      abuVerified = false;
      verifyStatus.textContent = "";
      regError.textContent = "Name and registration number do not match.";
      payBtn.disabled = true;
    }
  })
  .catch(() => {
    verifyStatus.textContent = "";
    regError.textContent = "Unable to verify right now.";
    payBtn.disabled = true;
  });
}

// ===== FIRST PAYMENT =====
if (payBtn) {
  payBtn.addEventListener("click", () => {
    const email = document.getElementById("email").value.trim();
    const name = document.getElementById("name").value.trim();
    if (!email || !name) { alert("Please fill your name and email first."); return; }
    if (schoolSelectEl.value === "yes" && !abuVerified) { alert("Please verify your ABU registration number first."); return; }
    payWithPaystack(baseAmount, email, () => {
      paymentSection.style.display = "none";
      innovateSection.style.display = "block";
    });
  });
}

// ===== LEX INNOVATE =====
if (innovateYes) innovateYes.addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  payWithPaystack(12000, email, () => {
    alert("🎉 Payment complete! You are registered for Lex Innovate.");
    innovateSection.style.display = "none";
    showSuccess();
  });
});
if (innovateNo) innovateNo.addEventListener("click", () => {
  alert("🎉 Registration complete!");
  innovateSection.style.display = "none";
  showSuccess();
});
