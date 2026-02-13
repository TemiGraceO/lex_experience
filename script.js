// ===== ENHANCED MOBILE NAV TOGGLE =====

const navToggle = document.getElementById("navToggle");
const nav = document.getElementById("nav");
const navLinks = document.querySelectorAll(".nav-link");

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

// Close nav when clicking a link (mobile)
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
    nav.style.transform = "translateY(-120%)";
    nav.style.opacity = "0";
  });
});

// ===== ACTIVE LINK ON SCROLL =====
const sections = document.querySelectorAll("section[id]");
let ticking = false;

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
const observerOptions = {
  threshold: 0.15,
  rootMargin: "0px 0px -50px 0px"
};

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const el = entry.target;
    
    if (entry.isIntersecting) {
      // Animate IN when entering viewport
      el.classList.add("visible");
      
      // Apply delay from data-delay attribute
      const delay = el.getAttribute("data-delay");
      if (delay) {
        el.style.setProperty("--delay", delay);
      }
    } else {
      // Animate OUT when leaving viewport (for UP scroll)
      if (el.classList.contains("fade-in") || 
          el.classList.contains("fade-slide-left") || 
          el.classList.contains("fade-slide-right")) {
        el.classList.remove("visible");
      }
    }
  });
}, observerOptions);

// Observe all fade elements
document.querySelectorAll(".fade-in, .fade-slide-left, .fade-slide-right, .timeline-item, [data-delay]").forEach(el => {
  fadeObserver.observe(el);
});

// ===== IMAGE SCATTER EFFECT (TRIGGER ONCE) =====
function createScatterEffect(target) {
  // Prevent multiple triggers
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
    
    // Random scatter direction and distance
    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 200;
    particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    
    particle.style.animationDelay = `${Math.random() * 0.2}s`;
    particlesContainer.appendChild(particle);
  }
  
  // Activate particles with smooth delay
  setTimeout(() => {
    particlesContainer.classList.add("active");
    
    // Clean up particles after animation completes
    setTimeout(() => {
      if (particlesContainer.parentNode) {
        particlesContainer.parentNode.removeChild(particlesContainer);
      }
    }, 2000);
  }, 1000);
}

// Trigger scatter effect on hero image when 70% visible
const heroImageFrame = document.querySelector(".scatter-effect");
if (heroImageFrame) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target.querySelector("img");
        if (img && !img.dataset.scattered) {
          createScatterEffect(img);
        }
        imageObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.7 });
  
  imageObserver.observe(heroImageFrame);
}

// ===== ENHANCED FORM VALIDATION =====
const registerForm = document.getElementById("registerForm");
const formSuccess = document.getElementById("formSuccess");

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const isValid = validateForm();
  
  if (isValid) {
    showSuccess();
  }
});

function validateForm() {
  const fields = [
    { name: "name", message: "Please enter your full name." },
    { name: "email", message: "Please enter a valid email address.", validator: email => /^\S+@\S+\.\S+$/.test(email) },
    { name: "school", message: "Please enter your institution." },
    { name: "role", message: "Please select your role." }
  ];
  
  let isValid = true;
  
  fields.forEach(field => {
    const input = registerForm.querySelector(`[name="${field.name}"]`);
    const group = input.closest(".form-group");
    const errorEl = group.querySelector(".error-message");
    
    // Clear previous state
    group.classList.remove("error");
    errorEl.textContent = "";
    
    const value = input.value.trim();
    
    if (!value || (field.validator && !field.validator(value))) {
      showFieldError(input, field.message);
      isValid = false;
      
      // Shake animation for invalid fields
      group.style.animation = "shake 0.5s ease-in-out";
      setTimeout(() => {
        group.style.animation = "";
      }, 500);
    }
  });
  
  return isValid;
}

function showFieldError(field, message) {
  const group = field.closest(".form-group");
  const errorEl = group.querySelector(".error-message");
  
  group.classList.add("error");
  errorEl.textContent = message;
}

function showSuccess() {
  registerForm.reset();
  formSuccess.hidden = false;
  formSuccess.style.animation = "fadeInUp 0.5s ease-out";
  
  // Scroll to success message
  formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
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

// Initial load animations
updateActiveLink();

if ('IntersectionObserver' in window) {
  // Modern browsers handled by observer
} else {
  // Fallback: animate everything immediately
  setTimeout(() => {
    document.querySelectorAll(".fade-in, .fade-slide-left, .fade-slide-right").forEach(el => {
      el.classList.add("visible");
    });
  }, 100);
}

// Preload critical images for smooth animations
const criticalImages = document.querySelectorAll(".hero-image");
criticalImages.forEach(img => {
  if (img.complete) {
    img.style.opacity = "1";
  } else {
    img.addEventListener('load', function() {
      this.style.opacity = "1";
    });
  }
});
// ================= PAYMENT FLOW =================
const schoolSelect = document.getElementById("school");
const paymentSection = document.getElementById("paymentSection");
const paymentText = document.getElementById("paymentText");
const payBtn = document.getElementById("payBtn");

const innovateSection = document.getElementById("innovateSection");
const innovateYes = document.getElementById("innovateYes");
const innovateNo = document.getElementById("innovateNo");

let baseAmount = 0;


// Show payment when ABU / Non-ABU is chosen
schoolSelect.addEventListener("change", () => {
  const value = schoolSelect.value;

  if (!value) {
    paymentSection.style.display = "none";
    return;
  }

  if (value === "yes") {
    baseAmount = 10000;
    paymentText.textContent = "ABU Student Ticket: ₦10,000";
  } else {
    baseAmount = 15000;
    paymentText.textContent = "Non-ABU Student Ticket: ₦15,000";
  }

  paymentSection.style.display = "block";
});


// ===== FIRST PAYMENT =====
payBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const name = document.getElementById("name").value;

  if (!email || !name) {
    alert("Please fill your name and email first.");
    return;
  }

  payWithPaystack(baseAmount, email, () => {
    // After success
    paymentSection.style.display = "none";
    innovateSection.style.display = "block";
  });
});


// ===== LEX INNOVATE =====
innovateYes.addEventListener("click", () => {
  const email = document.getElementById("email").value;

  payWithPaystack(12000, email, () => {
    alert("🎉 Payment complete! You are registered for Lex Innovate.");
    innovateSection.style.display = "none";
    showSuccess(); // your existing success function
  });
});


innovateNo.addEventListener("click", () => {
  alert("🎉 Registration complete!");
  innovateSection.style.display = "none";
  showSuccess();
});


// ===== PAYSTACK FUNCTION =====
function payWithPaystack(amount, email, callback) {
  let handler = PaystackPop.setup({
    key: "YOUR_PUBLIC_KEY_HERE", // replace with your key
    email: email,
    amount: amount * 100, // convert to kobo
    currency: "NGN",

    callback: function(response) {
      callback(response);
    },

    onClose: function() {
      alert("Payment window closed.");
    }
  });

  handler.openIframe();
}
