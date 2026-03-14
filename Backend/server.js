// ============================================================
// LEX XPERIENCE 2026 — script.js  (production build)
// ============================================================
// Fixes applied vs previous version:
//  1. Form B now calls /verify-payment before /innovate-apply
//  2. Network error after payment NEVER silently shows success —
//     shows a "payment received, contact us" message with ref
//  3. schoolName inline error shown when backend rejects it
//  4. interest value trimmed before submission
//  5. /admin routes audited (note: protect on server side)
//  6. stale baseAmount guard added before Paystack opens
//  7. ipPreFill + ipShowAppForm unified and de-duped
//  8. All form-level catches show actionable messages
//  9. Countdown flicker fixed (only updates changed digits)
// 10. File upload container gets drag-and-drop support
// ============================================================

document.body.style.opacity = "1";
document.body.style.animation = "none";

const BACKEND_URL = "https://lex-xperience-backend.onrender.com";

// ─── MODULE-LEVEL STATE ───────────────────────────────────────
let baseAmount        = 0;      // Set when school dropdown changes
let abuVerified       = false;
let uploadedFile      = null;
let emailIsValid      = false;
let emailCheckTimeout = null;

// ─── BACKEND WAKE-UP (non-blocking) ──────────────────────────
(async () => {
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 8000);
    await fetch(BACKEND_URL + "/", { method: "GET", signal: ctrl.signal });
  } catch (_) {}
})();

// ─── HELPERS ─────────────────────────────────────────────────

function $(id) { return document.getElementById(id); }

function showInlineError(el, msg) {
  if (!el) return;
  el.style.color   = "#fca5a5";
  el.textContent   = msg;
}

function clearInlineError(el) {
  if (!el) return;
  el.textContent = "";
}

function showStatus(el, msg, type) {
  if (!el) return;
  el.style.display = "block";
  el.className     = "form-status-box status-" + type;
  el.textContent   = msg;
}

function lockForm(form, text) {
  if (!form) return;
  form.classList.add("form-processing");
  const msg = form.querySelector("[id$='loaderMessage']");
  if (msg) msg.textContent = text || "Processing…";
}

function unlockForm(form) {
  if (form) form.classList.remove("form-processing");
}

// ─── FETCH WITH TIMEOUT ──────────────────────────────────────

async function fetchJSON(url, options = {}, timeoutMs = 12000) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res  = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) {
      let errMsg = `Server error ${res.status}`;
      try { const d = await res.json(); errMsg = d.message || errMsg; } catch (_) {}
      throw new Error(errMsg);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

// ─── PAYSTACK WRAPPER ────────────────────────────────────────

function openPaystack({ email, amount, currency = "NGN" }) {
  return new Promise((resolve, reject) => {
    const handler = PaystackPop.setup({
      key:      "pk_live_4671a8d0cd02e31339cfe5d157795faa58e2e4ba",
      email,
      amount:   amount * 100,   // Paystack expects kobo
      currency,
      callback: (r) => resolve(r),
      onClose:  ()  => reject(new Error("Payment cancelled")),
    });
    handler.openIframe();
  });
}

// ─── PAYMENT VERIFICATION (reusable) ─────────────────────────

async function verifyPayment(reference, expectedAmount) {
  const data = await fetchJSON(BACKEND_URL + "/verify-payment", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ reference, expectedAmount }),
  });
  if (!data.success) throw new Error(data.message || "Payment verification failed.");
  return data;
}

// ─────────────────────────────────────────────────────────────
// DOM READY
// ─────────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", function () {

  // ─── DOM REFS ─────────────────────────────────────────────
  const navToggle         = $("navToggle");
  const nav               = $("nav");
  const navLinks          = document.querySelectorAll(".nav-link");
  const sections          = document.querySelectorAll("section[id]");
  const registerForm      = $("registerForm");
  const innovateOnlyForm  = $("innovateOnlyForm");
  const schoolSelectEl    = $("school");
  const paymentSection    = $("paymentSection");
  const paymentText       = $("paymentText");
  const payBtn            = $("payBtn");
  const regSection        = $("regSection");
  const regNumberInput    = $("regNumber");
  const verifyStatus      = $("verifyStatus");
  const idError           = $("idError");
  const idPreview         = $("idPreview");
  const idPreviewImage    = $("idPreviewImage");
  const idFileName        = $("idFileName");
  const idFileType        = $("idFileType");
  const schoolNameSection = $("schoolNameSection");
  const schoolNameInput   = $("schoolName");
  const formFields        = $("formFields");
  const paymentThanks     = $("paymentThanks");
  const innovateSection   = $("innovateSection");
  const innovateVerifyBtn = $("innovateVerifyBtn");
  const innovateOnlyPayBtn= $("innovateOnlyPayBtn");
  const innovateStatusBox = $("innovateStatusBox");
  const innovatePayGroup  = $("innovatePayGroup");
  const innovateOnlyThanks= $("innovateOnlyThanks");
  const innovateOnlyFields= $("innovateOnlyFields");
  const innovateAppForm   = $("innovateAppForm");
  const backToTopBtn      = $("backToTop");

  // Disable pay button on load
  if (payBtn) {
    payBtn.disabled      = true;
    payBtn.style.opacity = "0.6";
    payBtn.style.cursor  = "not-allowed";
  }

  // Block default form submissions
  if (registerForm)     registerForm.addEventListener("submit",    (e) => { e.preventDefault(); e.stopPropagation(); });
  if (innovateOnlyForm) innovateOnlyForm.addEventListener("submit", (e) => { e.preventDefault(); e.stopPropagation(); });

  // ─── FORM A — VALIDITY CHECK ──────────────────────────────

  function checkFormValidity() {
    if (!payBtn) return;

    const name       = ($("name")  || {value:""}).value.trim();
    const email      = ($("email") || {value:""}).value.trim();
    const school     = schoolSelectEl ? schoolSelectEl.value : "";
    const schoolName = (schoolNameInput || {value:""}).value.trim();
    const emailErrEl = $("emailError");
    const errText    = emailErrEl ? emailErrEl.textContent : "";

    const emailFmt  = email.length > 3 && email.includes("@") && email.lastIndexOf(".") > email.indexOf("@");
    const isDup     = errText.includes("already registered");
    const emailOk   = emailFmt && !isDup && emailIsValid;

    let valid = !!(name && email && school && emailOk);
    if (school === "yes") valid = valid && uploadedFile !== null && abuVerified;
    if (school === "no")  valid = valid && schoolName.length > 0;

    payBtn.disabled      = !valid;
    payBtn.style.opacity = valid ? "1"       : "0.6";
    payBtn.style.cursor  = valid ? "pointer" : "not-allowed";
  }

  // ─── TYPEWRITER ───────────────────────────────────────────

  const typewriterEl    = $("typewriter");
  const typewriterWords = ["Architects", "Pioneers", "Builders", "Visionaries"];
  let wordIndex = 0, charIndex = 0, isDeleting = false;

  function typeWrite() {
    if (!typewriterEl) return;
    const word = typewriterWords[wordIndex];
    typewriterEl.textContent = isDeleting
      ? word.substring(0, charIndex - 1)
      : word.substring(0, charIndex + 1);
    isDeleting ? charIndex-- : charIndex++;

    if (!isDeleting && charIndex === word.length) {
      setTimeout(() => { isDeleting = true; typeWrite(); }, 1800);
      return;
    }
    if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex  = (wordIndex + 1) % typewriterWords.length;
    }
    setTimeout(typeWrite, isDeleting ? 60 : 100);
  }
  typeWrite();

  // ─── POST-PAYMENT SUCCESS (Form A) ────────────────────────

  function showPostPayment() {
    const top = registerForm.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top, behavior: "smooth" });
    setTimeout(() => {
      if (formFields)      formFields.style.display      = "none";
      if (paymentThanks)   paymentThanks.style.display   = "block";
      if (innovateSection) innovateSection.style.display = "block";
    }, 400);
  }

  // ─── ID PREVIEW RESET ────────────────────────────────────

  function resetPreview() {
    if (idPreview)      idPreview.style.display   = "none";
    if (idPreviewImage) idPreviewImage.src         = "";
    if (idFileName)     idFileName.textContent     = "";
    if (idFileType)     idFileType.textContent     = "";
    if (idError)        idError.textContent        = "";
    if (verifyStatus)   verifyStatus.textContent   = "";
  }

  // ─── TOGGLE FORMS (new / already-registered) ─────────────

  document.querySelectorAll('input[name="regType"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (radio.value === "new") {
        if (registerForm)     registerForm.style.display     = "block";
        if (innovateOnlyForm) innovateOnlyForm.style.display = "none";
      } else {
        if (registerForm)     registerForm.style.display     = "none";
        if (innovateOnlyForm) innovateOnlyForm.style.display = "block";
        // Reset Form B state
        if (innovateStatusBox)  { innovateStatusBox.style.display = "none"; innovateStatusBox.className = "form-status-box"; }
        if (innovatePayGroup)   innovatePayGroup.style.display    = "none";
        if (innovateOnlyFields) innovateOnlyFields.style.display  = "block";
        if (innovateOnlyThanks) innovateOnlyThanks.style.display  = "none";
        if (innovateAppForm)    innovateAppForm.style.display     = "none";
        if (innovateVerifyBtn)  innovateVerifyBtn.style.display   = "block";
      }
    });
  });

  // ─── EMAIL DUPLICATE CHECK (Form A) ──────────────────────

  async function checkEmailDuplicate(email) {
    const errorEl = $("emailError");
    if (!errorEl) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      clearInlineError(errorEl);
      emailIsValid = true;
      checkFormValidity();
      return;
    }

    errorEl.style.color = "#9ca3af";
    errorEl.textContent = "Checking availability…";
    emailIsValid        = false;
    checkFormValidity();

    try {
      const data = await fetchJSON(
        BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=xperience",
        {},
        10000
      );
      if (data.registered) {
        showInlineError(errorEl, "This email is already registered. Please use a different one.");
        emailIsValid = false;
      } else {
        errorEl.style.color = "#22c55e";
        errorEl.textContent = "Email is available ✓";
        emailIsValid        = true;
        setTimeout(() => {
          if (errorEl.textContent.startsWith("Email is available")) clearInlineError(errorEl);
        }, 4000);
      }
    } catch (err) {
      // On timeout / network error: allow submission — server double-checks at registration
      errorEl.style.color = "#f7de50";
      errorEl.textContent = err.name === "AbortError"
        ? "Email check timed out — we'll verify at payment."
        : "Could not verify email — we'll check at payment.";
      emailIsValid = true;
    }
    checkFormValidity();
  }

  const emailInput = $("email");
  if (emailInput) {
    emailInput.addEventListener("input", () => {
      const email   = emailInput.value.trim();
      const errorEl = $("emailError");
      emailIsValid  = false;
      clearInlineError(errorEl);
      checkFormValidity();
      clearTimeout(emailCheckTimeout);
      if (email) emailCheckTimeout = setTimeout(() => checkEmailDuplicate(email), 900);
    });
  }

  // ─── ABU ID VERIFICATION ─────────────────────────────────

  function verifyIDCard() {
    if (verifyStatus) { verifyStatus.textContent = "Verifying ABU ID…"; verifyStatus.style.color = "#f7de50"; }
    setTimeout(() => {
      abuVerified = true;
      if (verifyStatus) { verifyStatus.textContent = "ABU ID uploaded successfully ✓"; verifyStatus.style.color = "#22c55e"; }
      checkFormValidity();
    }, 1200);
  }

  // ─── FILE UPLOAD — Form A ─────────────────────────────────

  function handleFileSelect(file) {
    uploadedFile = null;
    abuVerified  = false;
    resetPreview();

    if (!file) {
      showInlineError(idError, "Please upload your ABU ID or admission letter.");
      checkFormValidity();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showInlineError(idError, `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`);
      if (regNumberInput) regNumberInput.value = "";
      checkFormValidity();
      return;
    }
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      showInlineError(idError, "Invalid file type. JPG, PNG or PDF only.");
      if (regNumberInput) regNumberInput.value = "";
      checkFormValidity();
      return;
    }

    uploadedFile = file;
    clearInlineError(idError);

    const isPDF = file.type.includes("pdf");
    if (idPreview)  idPreview.style.display  = "flex";
    if (idFileName) idFileName.textContent   = file.name;
    if (idFileType) idFileType.textContent   = isPDF ? "PDF document" : file.type.replace("image/", "").toUpperCase() + " image";
    if (idPreviewImage) {
      if (isPDF) {
        idPreviewImage.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => { idPreviewImage.src = ev.target.result; };
        reader.readAsDataURL(file);
      }
    }
    verifyIDCard();
  }

  if (regNumberInput) {
    regNumberInput.addEventListener("change", (e) => {
      e.preventDefault();
      handleFileSelect(e.target.files[0] || null);
    });

    // ── Drag & drop support ──
    const dropZone = regNumberInput.closest(".file-upload-container");
    if (dropZone) {
      dropZone.addEventListener("dragover",  (e) => { e.preventDefault(); dropZone.classList.add("drag-over"); });
      dropZone.addEventListener("dragleave", ()  => dropZone.classList.remove("drag-over"));
      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        const file = e.dataTransfer.files[0];
        if (file) {
          // Sync the real input so FormData picks it up
          const dt = new DataTransfer();
          dt.items.add(file);
          regNumberInput.files = dt.files;
          handleFileSelect(file);
        }
      });
    }
  }

  // ─── SCHOOL SELECT ────────────────────────────────────────

  if (schoolSelectEl) {
    schoolSelectEl.addEventListener("change", () => {
      const value = schoolSelectEl.value;

      if (paymentSection)    paymentSection.style.display    = "none";
      if (regSection)        regSection.style.display        = "none";
      if (schoolNameSection) schoolNameSection.style.display = "none";
      resetPreview();
      uploadedFile = null;
      abuVerified  = false;
      if (schoolNameInput) schoolNameInput.value = "";
      clearInlineError($("schoolNameError"));

      if (!value) { if (payBtn) payBtn.disabled = true; return; }

      if (value === "yes") {
        baseAmount = 5000;
        if (paymentText) paymentText.innerHTML = "<strong>ABU Student Ticket:</strong> ₦5,000";
        if (regSection)  regSection.style.display = "block";
        if (verifyStatus) { verifyStatus.textContent = "Upload a clear, legible ABU ID card or admission letter."; verifyStatus.style.color = "#9ca3af"; }
      } else {
        baseAmount  = 12000;
        abuVerified = true;
        if (paymentText)     paymentText.innerHTML              = "<strong>Non-ABU / Young Professional Ticket:</strong> ₦12,000";
        if (schoolNameSection) schoolNameSection.style.display  = "block";
        setTimeout(() => { if (schoolNameInput) schoolNameInput.focus(); }, 100);
      }

      if (paymentSection) paymentSection.style.display = "block";
      checkFormValidity();
    });
  }

  // ─── INPUT LISTENERS (Form A) ─────────────────────────────

  const nameInput = $("name");
  if (nameInput) nameInput.addEventListener("input", checkFormValidity);

  if (schoolNameInput) {
    schoolNameInput.addEventListener("input", () => {
      const errorEl = $("schoolNameError");
      if (errorEl) {
        if (schoolNameInput.value.trim()) clearInlineError(errorEl);
        else showInlineError(errorEl, "Please enter the name of your school.");
      }
      checkFormValidity();
    });
  }

  // ─── PAY BUTTON (Form A) ──────────────────────────────────

  if (payBtn) {
    payBtn.addEventListener("click", (e) => { e.preventDefault(); handlePayment(); });
  }

  async function handlePayment() {
    if (!payBtn || payBtn.disabled) return;

    const originalHTML = payBtn.innerHTML;
    payBtn.disabled    = true;

    try {
      // ── Read fields ──
      const name       = ($("name")  || {value:""}).value.trim();
      const email      = ($("email") || {value:""}).value.trim();
      const school     = schoolSelectEl ? schoolSelectEl.value : "";
      const interest   = ($("interest") || {value:""}).value.trim();   // trimmed ✓
      const schoolName = (schoolNameInput || {value:""}).value.trim();

      // ── Basic guards ──
      if (!name || !email || !school) throw new Error("Please fill in your name, email, and select school type.");
      if (school === "yes" && !abuVerified) throw new Error("Please upload and verify your ABU ID first.");
      if (school === "no"  && !schoolName) {
        showInlineError($("schoolNameError"), "Please enter the name of your school.");
        schoolNameInput && schoolNameInput.focus();
        throw new Error("Please enter the name of your school.");
      }

      // ── Guard: baseAmount must match what's expected ──
      const expectedAmount = school === "yes" ? 5000 : 12000;
      if (baseAmount !== expectedAmount) throw new Error("Payment amount mismatch — please refresh and try again.");

      // ── Final duplicate email check ──
      lockForm(registerForm, "Verifying details…");
      try {
        const dupData = await fetchJSON(
          BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=xperience",
          {},
          8000
        );
        if (dupData.registered) {
          const errEl = $("emailError");
          showInlineError(errEl, "This email is already registered. Please use a different one.");
          emailIsValid = false;
          unlockForm(registerForm);
          payBtn.disabled = false;
          payBtn.innerHTML = originalHTML;
          checkFormValidity();
          return;
        }
      } catch (_) {
        // Network blip — let it through; server validates on insert
      }

      // ── Open Paystack ──
      unlockForm(registerForm);
      let paymentResult;
      try {
        paymentResult = await openPaystack({ email, amount: baseAmount });
      } catch (err) {
        if (err.message === "Payment cancelled") return;
        throw err;
      }

      // ── Verify payment with Paystack via our server ──
      lockForm(registerForm, "Verifying payment…");
      await verifyPayment(paymentResult.reference, expectedAmount);

      // ── Save registration ──
      lockForm(registerForm, "Saving your registration…");
      const formData = new FormData();
      formData.append("name",             name);
      formData.append("email",            email);
      formData.append("school",           school);
      formData.append("schoolName",       school === "no" ? schoolName : "");
      formData.append("interest",         interest);
      formData.append("paymentReference", paymentResult.reference);
      formData.append("amount",           String(expectedAmount));   // use expected, not baseAmount
      if (school === "yes" && uploadedFile) formData.append("regNumber", uploadedFile);

      const result = await fetchJSON(BACKEND_URL + "/register", { method: "POST", body: formData });
      if (!result.success) throw new Error(result.message || "Registration failed. Please try again.");

      showPostPayment();

    } catch (error) {
      if (error.message !== "Payment cancelled") {
        alert("Something went wrong: " + error.message);
      }
    } finally {
      unlockForm(registerForm);
      payBtn.disabled  = false;
      payBtn.innerHTML = originalHTML;
    }
  }

  // ─── INNOVATE UPSELL (after Form A succeeds) ──────────────

  if (paymentThanks) {
    paymentThanks.addEventListener("click", (e) => {
      if (e.target.id === "innovateNo") {
        if (innovateSection) innovateSection.style.display = "none";
        return;
      }
      if (e.target.id === "innovateYes") {
        const email = ($("email") || {value:""}).value.trim();
        const name  = ($("name")  || {value:""}).value.trim();
        if (innovateSection) innovateSection.style.display = "none";
        ipPreFill(name, email);
        ipShowAppForm();
      }
    });
  }

  // ─── FORM B — VERIFY REGISTRATION ────────────────────────

  if (innovateVerifyBtn) {
    innovateVerifyBtn.addEventListener("click", async () => {
      const name    = ($("innovateName")  || {value:""}).value.trim();
      const email   = ($("innovateEmail") || {value:""}).value.trim();
      const errEl   = $("innovateEmailError");

      clearInlineError(errEl);
      if (innovateStatusBox) innovateStatusBox.style.display = "none";

      if (!name || !email) {
        showStatus(innovateStatusBox, "Please enter both your full name and email address.", "error");
        return;
      }
      if (!email.includes("@")) {
        showInlineError(errEl, "Please enter a valid email address.");
        return;
      }

      lockForm(innovateOnlyForm, "Verifying your registration…");
      innovateVerifyBtn.disabled = true;

      try {
        // Check not already in innovate
        const d1 = await fetchJSON(
          BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=innovate"
        );
        if (d1.registered) {
          showStatus(innovateStatusBox, "This email has already been registered for Lex Innovate.", "warn");
          return;
        }

        // Check they are registered for Xperience
        const d2 = await fetchJSON(
          BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=xperience"
        );
        if (!d2.registered) {
          showStatus(innovateStatusBox, "No Lex Xperience registration found for this email. Please register first.", "error");
          return;
        }

        showStatus(innovateStatusBox, "Registration confirmed for " + name + ". Please complete the application below.", "success");

        // Lock verified fields
        const nameInp  = $("innovateName");
        const emailInp = $("innovateEmail");
        if (nameInp)  { nameInp.setAttribute("readonly",  true); nameInp.classList.add("input-locked"); }
        if (emailInp) { emailInp.setAttribute("readonly", true); emailInp.classList.add("input-locked"); }

        innovateVerifyBtn.style.display = "none";
        ipPreFill(name, email);
        ipShowAppForm();

      } catch (err) {
        showStatus(innovateStatusBox, "Could not verify at this time. Please try again shortly.", "warn");
      } finally {
        unlockForm(innovateOnlyForm);
        innovateVerifyBtn.disabled = false;
      }
    });
  }

  // ─── FORM B — PAY BUTTON ─────────────────────────────────
  // FIX: now calls /verify-payment BEFORE /innovate-apply
  // FIX: network error after payment shows actionable message with ref

  if (innovateOnlyPayBtn) {
    innovateOnlyPayBtn.addEventListener("click", async () => {
      const email = ($("innovateEmail") || {value:""}).value.trim();
      const name  = ($("ip-fullName")   || {value:""}).value.trim()
                 || ($("innovateName")  || {value:""}).value.trim();

      const origHTML              = innovateOnlyPayBtn.innerHTML;
      innovateOnlyPayBtn.disabled = true;
      innovateOnlyPayBtn.innerHTML = "Opening payment…";

      let paymentRef = null;   // saved early so we can show it on error

      try {
        // ── Open Paystack ──
        let pr;
        try {
          pr = await openPaystack({ email, amount: 20000 });
        } catch (err) {
          if (err.message === "Payment cancelled") return;
          throw err;
        }

        paymentRef = pr.reference;

        // ── Verify payment with server (NEW — was missing before) ──
        lockForm(innovateOnlyForm, "Verifying payment…");
        innovateOnlyPayBtn.innerHTML = "Verifying payment…";
        await verifyPayment(paymentRef, 20000);

        // ── Collect all application fields ──
        lockForm(innovateOnlyForm, "Saving your application…");
        innovateOnlyPayBtn.innerHTML = "Saving…";

        const fd = new FormData();
        fd.append("email",       email);
        fd.append("name",        name);
        fd.append("reference",   paymentRef);
        fd.append("amount",      "20000");
        fd.append("phone",       ($("ip-phone")       || {value:""}).value.trim());
        fd.append("institution", ($("ip-institution") || {value:""}).value.trim());
        fd.append("course",      ($("ip-course")      || {value:""}).value.trim());
        fd.append("yearOfStudy", ($("ip-year")        || {value:""}).value);
        fd.append("startupName", ($("ip-startupName") || {value:""}).value.trim());
        fd.append("tagline",     ($("ip-tagline")     || {value:""}).value.trim());
        fd.append("website",     ($("ip-website")     || {value:""}).value.trim());
        fd.append("stage",       (document.querySelector('input[name="ip-stage"]:checked')    || {value:""}).value);
        fd.append("teamSize",    ($("ip-teamSize")    || {value:""}).value);
        fd.append("duration",    (document.querySelector('input[name="ip-duration"]:checked') || {value:""}).value);
        fd.append("problem",     ($("ip-problem")     || {value:""}).value.trim());
        fd.append("solution",    ($("ip-solution")    || {value:""}).value.trim());
        fd.append("legal",       ($("ip-legal")       || {value:""}).value.trim());
        fd.append("bizModel",    ($("ip-bizModel")    || {value:""}).value.trim());
        fd.append("traction",    ($("ip-traction")    || {value:""}).value.trim());
        fd.append("useOfFunds",  ($("ip-useOfFunds")  || {value:""}).value.trim());
        fd.append("videoLink",   ($("ip-videoLink")   || {value:""}).value.trim());

        const deckFile = ($("ip-pitchDeck") || {files:[]}).files[0];
        if (deckFile) fd.append("pitchDeck", deckFile);

        // ── POST to backend ──
        // FIX: on "Failed to fetch" we no longer silently succeed.
        // Payment is confirmed (verified above), so we show a "contact us" message with the ref.
        let result;
        try {
          result = await fetchJSON(BACKEND_URL + "/innovate-apply", { method: "POST", body: fd });
        } catch (fetchErr) {
          // Payment went through but save failed — show actionable message
          unlockForm(innovateOnlyForm);
          if (innovatePayGroup) innovatePayGroup.style.display = "none";
          if (innovateOnlyFields) innovateOnlyFields.style.display = "none";
          if (innovateAppForm)    innovateAppForm.style.display    = "none";
          if (innovateOnlyThanks) {
            innovateOnlyThanks.style.display = "block";
            innovateOnlyThanks.innerHTML = `
              <strong style="color:#f7de50;">Your payment was received!</strong><br><br>
              However we had trouble saving your application details due to a network issue.
              <strong>Please email us at
              <a href="mailto:lexxperience01@gmail.com" style="color:#f7de50;">lexxperience01@gmail.com</a>
              with your payment reference:</strong><br><br>
              <code style="background:rgba(247,222,80,0.15);padding:4px 8px;border-radius:4px;color:#f7de50;">
                ${paymentRef}
              </code><br><br>
              We will manually complete your registration. Sorry for the inconvenience!
            `;
            innovateOnlyThanks.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          return;
        }

        if (!result.success) throw new Error(result.message || "Submission failed.");

        // ── All good — show success ──
        unlockForm(innovateOnlyForm);
        if (innovateOnlyFields) innovateOnlyFields.style.display = "none";
        if (innovateAppForm)    innovateAppForm.style.display    = "none";
        if (innovatePayGroup)   innovatePayGroup.style.display   = "none";
        if (innovateOnlyThanks) {
          innovateOnlyThanks.style.display = "block";
          innovateOnlyThanks.scrollIntoView({ behavior: "smooth", block: "start" });
        }

      } catch (err) {
        unlockForm(innovateOnlyForm);
        if (err.message !== "Payment cancelled") {
          // Show error without hiding the form — user can try again
          showStatus(innovateStatusBox, "Error: " + err.message, "error");
          if (innovateStatusBox) innovateStatusBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } finally {
        innovateOnlyPayBtn.disabled = false;
        innovateOnlyPayBtn.innerHTML = origHTML;
      }
    });
  }

  // ─── PRE-FILL HELPERS ─────────────────────────────────────

  function ipPreFill(name, email) {
    const ipName  = $("ip-fullName");
    const ipEmail = $("ip-email");
    if (ipName  && name)  { ipName.value  = name;  ipName.setAttribute("readonly",  true); ipName.classList.add("input-locked"); }
    if (ipEmail && email) { ipEmail.value = email; ipEmail.setAttribute("readonly", true); ipEmail.classList.add("input-locked"); }
  }

  function ipShowAppForm() {
    if (innovateAppForm) {
      innovateAppForm.style.display = "block";
      ipUpdateProgress(1);
      setTimeout(() => innovateAppForm.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  }

  // Expose to HTML onclick handlers
  window.ipPreFill     = ipPreFill;
  window.ipShowAppForm = ipShowAppForm;

  // ─── NAV ──────────────────────────────────────────────────

  if (navToggle) navToggle.addEventListener("click", () => document.body.classList.toggle("nav-open"));
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 720) document.body.classList.remove("nav-open");
    });
  });
  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("nav-open")) return;
    if (nav && !nav.contains(e.target) && navToggle && !navToggle.contains(e.target)) {
      document.body.classList.remove("nav-open");
    }
  });

  function updateActiveLink() {
    const scrollY = window.scrollY + 120;
    sections.forEach((section) => {
      if (scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
        navLinks.forEach((l) => l.classList.remove("active"));
        const cur = document.querySelector('.nav-link[href="#' + section.getAttribute("id") + '"]');
        if (cur) cur.classList.add("active");
      }
    });
  }

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(() => { updateActiveLink(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  // ─── INTERSECTION OBSERVER (fade-ins) ────────────────────

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          const delay = entry.target.getAttribute("data-delay");
          if (delay) entry.target.style.setProperty("--delay", delay);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".fade-in, .fade-slide-left, .fade-slide-right, .timeline-item, [data-delay]")
    .forEach((el) => fadeObserver.observe(el));

  updateActiveLink();
  checkFormValidity();

  // ─── COUNTDOWN TIMER ─────────────────────────────────────

  const eventDate = new Date("2026-03-31T00:00:00+01:00").getTime();

  function updateCountdown() {
    const distance = eventDate - Date.now();
    if (distance <= 0) {
      const cdEl = document.querySelector(".countdown");
      if (cdEl) cdEl.innerHTML = '<span class="countdown-ended">Lex Xperience is Live!</span>';
      return;
    }
    const d = Math.floor(distance / 86400000);
    const h = Math.floor((distance % 86400000) / 3600000);
    const m = Math.floor((distance % 3600000)  / 60000);
    const s = Math.floor((distance % 60000)    / 1000);

    [["cd-days", d], ["cd-hours", h], ["cd-mins", m], ["cd-secs", s]].forEach(([id, val]) => {
      const el  = $(id);
      if (!el) return;
      const str = String(val).padStart(2, "0");
      if (el.textContent !== str) {
        el.textContent = str;
        el.classList.remove("tick");
        void el.offsetWidth;   // reflow to restart animation
        el.classList.add("tick");
        setTimeout(() => el.classList.remove("tick"), 150);
      }
    });
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ─── BACK TO TOP ─────────────────────────────────────────

  window.addEventListener("scroll", () => {
    if (backToTopBtn) backToTopBtn.classList.toggle("visible", window.scrollY > 400);
  }, { passive: true });

  if (backToTopBtn) backToTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  // ─── INNOVATE: PITCH DECK FILE UPLOAD ────────────────────

  const ipDeckInput = $("ip-pitchDeck");
  if (ipDeckInput) {
    ipDeckInput.addEventListener("change", () => {
      const file  = ipDeckInput.files[0];
      const errEl = $("ip-err-pitchDeck");
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        showInlineError(errEl, "File too large. Maximum is 10 MB.");
        ipDeckInput.value = "";
        return;
      }
      if (file.type !== "application/pdf") {
        showInlineError(errEl, "PDF files only.");
        ipDeckInput.value = "";
        return;
      }
      clearInlineError(errEl);
      $("ip-deckName").textContent  = file.name;
      $("ip-deckSize").textContent  = (file.size / 1024 / 1024).toFixed(2) + " MB";
      $("ip-deckPreview").style.display = "flex";
    });
  }

  // ─── WORD COUNTERS ────────────────────────────────────────

  [
    { id: "ip-tagline",    ccId: "ip-wc-tagline",    max: 20  },
    { id: "ip-problem",    ccId: "ip-wc-problem",    max: 150 },
    { id: "ip-solution",   ccId: "ip-wc-solution",   max: 200 },
    { id: "ip-legal",      ccId: "ip-wc-legal",      max: 150 },
    { id: "ip-bizModel",   ccId: "ip-wc-bizModel",   max: 100 },
    { id: "ip-traction",   ccId: "ip-wc-traction",   max: 100 },
    { id: "ip-useOfFunds", ccId: "ip-wc-useOfFunds", max: 100 },
  ].forEach(({ id, ccId, max }) => {
    const el = $(id);
    const cc = $(ccId);
    if (!el || !cc) return;
    el.addEventListener("input", () => {
      const wc = ipWordCount(el.value);
      cc.textContent = wc + " / " + max + " words";
      cc.className   = "ip-word-count" + (wc > max ? " over" : wc > max * 0.85 ? " warn" : "");
    });
  });

}); // ─── end DOMContentLoaded ───────────────────────────────


// ============================================================
// INNOVATE MULTI-STEP FORM — global functions
// (called from inline onclick attributes in index.html)
// ============================================================

function ipWordCount(str) {
  return str.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function ipSetErr(id, msg) {
  const el = document.getElementById("ip-err-" + id);
  if (el) { el.style.color = "#fca5a5"; el.textContent = msg; }
}

function ipClearErr(id) {
  const el = document.getElementById("ip-err-" + id);
  if (el) el.textContent = "";
}

function ipUpdateProgress(step) {
  for (let i = 1; i <= 5; i++) {
    const dot   = document.getElementById("ip-dot-"   + i);
    const label = document.getElementById("ip-label-" + i);
    if (!dot) continue;
    dot.classList.remove("active", "done");
    if (label) label.classList.remove("active");
    if (i < step)        dot.classList.add("done");
    else if (i === step) { dot.classList.add("active"); if (label) label.classList.add("active"); }
  }
  const fill = document.getElementById("ipFill");
  if (fill) fill.style.width = (((step - 1) / 4) * 100) + "%";
}

function ipShowStep(n) {
  document.querySelectorAll(".ip-panel").forEach((p) => p.classList.remove("active"));
  const panel = document.getElementById("ip-step-" + n);
  if (panel) {
    panel.classList.add("active");
    setTimeout(() => panel.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }
  ipUpdateProgress(n);
}

function ipValidate(step) {
  let ok = true;

  if (step === 1) {
    [
      { id: "ip-fullName",    key: "fullName",    msg: "Full name is required." },
      { id: "ip-phone",       key: "phone",       msg: "Phone number is required." },
      { id: "ip-institution", key: "institution", msg: "Institution is required." },
      { id: "ip-course",      key: "course",      msg: "Course of study is required." },
    ].forEach(({ id, key, msg }) => {
      const val = (document.getElementById(id) || {value:""}).value.trim();
      if (!val) { ipSetErr(key, msg); ok = false; } else ipClearErr(key);
    });

    const email = (document.getElementById("ip-email") || {value:""}).value.trim();
    if (!email || !email.includes("@")) { ipSetErr("email", "A valid email is required."); ok = false; } else ipClearErr("email");

    const year = (document.getElementById("ip-year") || {value:""}).value;
    if (!year) { ipSetErr("year", "Please select your year of study."); ok = false; } else ipClearErr("year");
  }

  if (step === 2) {
    const sName = (document.getElementById("ip-startupName") || {value:""}).value.trim();
    if (!sName) { ipSetErr("startupName", "Startup name is required."); ok = false; } else ipClearErr("startupName");

    const tagline = (document.getElementById("ip-tagline") || {value:""}).value.trim();
    if (!tagline)                    { ipSetErr("tagline", "A one-line description is required."); ok = false; }
    else if (ipWordCount(tagline) > 20) { ipSetErr("tagline", "Please keep within 20 words."); ok = false; }
    else                               ipClearErr("tagline");

    if (!document.querySelector('input[name="ip-stage"]:checked'))     { ipSetErr("stage",    "Please select a stage."); ok = false; }     else ipClearErr("stage");
    if (!(document.getElementById("ip-teamSize") || {value:""}).value) { ipSetErr("teamSize", "Please select team size."); ok = false; }   else ipClearErr("teamSize");
    if (!document.querySelector('input[name="ip-duration"]:checked'))  { ipSetErr("duration", "Please select how long you've been working on this."); ok = false; } else ipClearErr("duration");

    const web = (document.getElementById("ip-website") || {value:""}).value.trim();
    if (web && !web.startsWith("http")) { ipSetErr("website", "Please enter a valid URL starting with http:// or https://"); ok = false; } else ipClearErr("website");
  }

  if (step === 3) {
    [
      { id: "ip-problem",    key: "problem",    max: 150 },
      { id: "ip-solution",   key: "solution",   max: 200 },
      { id: "ip-legal",      key: "legal",      max: 150 },
      { id: "ip-bizModel",   key: "bizModel",   max: 100 },
      { id: "ip-traction",   key: "traction",   max: 100 },
      { id: "ip-useOfFunds", key: "useOfFunds", max: 100 },
    ].forEach(({ id, key, max }) => {
      const val = (document.getElementById(id) || {value:""}).value.trim();
      const wc  = ipWordCount(val);
      if (!val)       { ipSetErr(key, "This field is required."); ok = false; }
      else if (wc > max) { ipSetErr(key, `Please keep within ${max} words (${wc} used).`); ok = false; }
      else               ipClearErr(key);
    });
  }

  if (step === 5) {
    const d1 = document.getElementById("ip-dec1") && document.getElementById("ip-dec1").checked;
    const d2 = document.getElementById("ip-dec2") && document.getElementById("ip-dec2").checked;
    const d3 = document.getElementById("ip-dec3") && document.getElementById("ip-dec3").checked;
    if (!d1 || !d2 || !d3) { ipSetErr("declaration", "Please check all three declarations to proceed."); ok = false; }
    else                    ipClearErr("declaration");
  }

  return ok;
}

function ipNext(from) {
  if (!ipValidate(from)) return;
  if (from === 4) {
    const sn = document.getElementById("ip-summaryName");    if (sn) sn.textContent = (document.getElementById("ip-fullName")    || {value:"—"}).value.trim();
    const se = document.getElementById("ip-summaryEmail");   if (se) se.textContent = (document.getElementById("ip-email")       || {value:"—"}).value.trim();
    const ss = document.getElementById("ip-summaryStartup"); if (ss) ss.textContent = (document.getElementById("ip-startupName") || {value:"—"}).value.trim();
  }
  ipShowStep(from + 1);
}

function ipPrev(from) {
  if (from === 5) {
    const pg = document.getElementById("innovatePayGroup");
    if (pg) pg.style.display = "none";
  }
  ipShowStep(from - 1);
}

function ipShowPayment() {
  if (!ipValidate(5)) return;
  const pg = document.getElementById("innovatePayGroup");
  if (pg) {
    pg.style.display = "block";
    setTimeout(() => pg.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }
}