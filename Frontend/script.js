// ===== MOBILE NAV TOGGLE =====
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
const navLinkEls = document.querySelectorAll(".nav-link");

navToggle.addEventListener("click", () => {
  document.body.classList.toggle("nav-open");
});

// Close nav when clicking a link (mobile)
navLinkEls.forEach((link) => {
  link.addEventListener("click", () => {
    document.body.classList.remove("nav-open");
  });
});

// ===== ACTIVE LINK ON SCROLL =====
const sections = document.querySelectorAll("section[id]");

function onScroll() {
  const scrollY = window.scrollY + 120; // offset for header
  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute("id");

    if (scrollY >= top && scrollY < top + height) {
      navLinkEls.forEach((l) => l.classList.remove("active"));
      const current = document.querySelector(`.nav-link[href="#${id}"]`);
      if (current) current.classList.add("active");
    }
  });
}
window.addEventListener("scroll", onScroll);
onScroll();

// ===== SCROLL REVEAL =====
const revealEls = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealEls.forEach((el) => observer.observe(el));

// ===== FORM VALIDATION =====
const form = document.getElementById("regForm");
const successEl = document.getElementById("formSuccess");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Reset errors
  successEl.classList.add("hidden");
  form.querySelectorAll(".form-group").forEach((group) => {
    group.classList.remove("error");
    const err = group.querySelector(".error");
    if (err) err.textContent = "";
  });

  let valid = true;

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const school = form.school.value.trim();
  const role = form.role.value;

  if (!name) {
    showError("name", "Tell us who you are.");
    valid = false;
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    showError("email", "We need a valid email to reach you.");
    valid = false;
  }

  if (!school) {
    showError("school", "Where are you representing?");
    valid = false;
  }

  if (!role) {
    showError("role", "Pick what best describes you.");
    valid = false;
  }

  if (!valid) return;

  // Success state (demo only)
  form.reset();
  successEl.classList.remove("hidden");

  setTimeout(() => {
    successEl.classList.add("hidden");
  }, 6000);
});

function showError(fieldName, message) {
  const field = form.querySelector(`[name="${fieldName}"]`);
  const group = field.closest(".form-group");
  if (!group) return;
  group.classList.add("error");
  const err = group.querySelector(".error");
  if (err) err.textContent = message;
}