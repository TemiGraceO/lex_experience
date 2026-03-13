// 🔥 LEX XPERIENCE 2026 - PRODUCTION SCRIPT.JS

document.body.style.opacity = '1';
document.body.style.animation = 'none';

const BACKEND_URL = "https://lex-xperience-backend.onrender.com";

// ---------- STATE ----------
let baseAmount       = 0;
let abuVerified      = false;
let uploadedFile     = null;
let emailIsValid     = false;
let emailCheckTimeout;
let backendReachable = false;

// ---------- WAKE UP BACKEND ----------
(async () => {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 8000);
    const res = await fetch(BACKEND_URL + "/", { method: "GET", signal: controller.signal });
    if (res.ok) backendReachable = true;
  } catch (_) {}
})();

document.addEventListener("DOMContentLoaded", function () {

  // ---------- DOM REFS ----------
  var navToggle         = document.getElementById("navToggle");
  var nav               = document.getElementById("nav");
  var navLinks          = document.querySelectorAll(".nav-link");
  var sections          = document.querySelectorAll("section[id]");
  var registerForm      = document.getElementById("registerForm");
  var innovateOnlyForm  = document.getElementById("innovateOnlyForm");
  var schoolSelectEl    = document.getElementById("school");
  var paymentSection    = document.getElementById("paymentSection");
  var paymentText       = document.getElementById("paymentText");
  var payBtn            = document.getElementById("payBtn");
  var regSection        = document.getElementById("regSection");
  var regNumberInput    = document.getElementById("regNumber");
  var verifyStatus      = document.getElementById("verifyStatus");
  var idError           = document.getElementById("idError");
  var idPreview         = document.getElementById("idPreview");
  var idPreviewImage    = document.getElementById("idPreviewImage");
  var idFileName        = document.getElementById("idFileName");
  var idFileType        = document.getElementById("idFileType");
  var schoolNameSection = document.getElementById("schoolNameSection");
  var schoolNameInput   = document.getElementById("schoolName");
  var formFields        = document.getElementById("formFields");
  var paymentThanks     = document.getElementById("paymentThanks");
  var innovateSection   = document.getElementById("innovateSection");
  var innovateVerifyBtn  = document.getElementById("innovateVerifyBtn");
  var innovateOnlyPayBtn = document.getElementById("innovateOnlyPayBtn");
  var innovateStatusBox  = document.getElementById("innovateStatusBox");
  var innovatePayGroup   = document.getElementById("innovatePayGroup");
  var innovateOnlyThanks = document.getElementById("innovateOnlyThanks");
  var innovateOnlyFields = document.getElementById("innovateOnlyFields");
  var innovateAppForm    = document.getElementById("innovateAppForm");
  var backToTopBtn       = document.getElementById("backToTop");

  if (payBtn) { payBtn.disabled = true; payBtn.style.opacity = '0.6'; payBtn.style.cursor = 'not-allowed'; }

  if (registerForm)     registerForm.addEventListener("submit",    function(e){ e.preventDefault(); e.stopPropagation(); });
  if (innovateOnlyForm) innovateOnlyForm.addEventListener("submit", function(e){ e.preventDefault(); e.stopPropagation(); });

  // ---------- FORM A VALIDITY ----------
  function checkFormValidity() {
    if (!payBtn) return;
    var name       = (document.getElementById("name")  || {value:""}).value.trim();
    var email      = (document.getElementById("email") || {value:""}).value.trim();
    var school     = schoolSelectEl ? schoolSelectEl.value : "";
    var schoolName = (document.getElementById("schoolName") || {value:""}).value.trim();
    var errorMsg   = (document.getElementById("emailError") || {textContent:""}).textContent;
    var emailLooksValid = email.length > 3 && email.indexOf("@") > 0 && email.lastIndexOf(".") > email.indexOf("@");
    var isDuplicate     = errorMsg.indexOf("already registered") !== -1;
    var emailOk         = emailLooksValid && !isDuplicate;
    var isValid = !!(name && email && school && emailOk);
    if (school === "yes") isValid = isValid && uploadedFile !== null && abuVerified;
    if (school === "no")  isValid = isValid && schoolName.length > 0;
    payBtn.disabled      = !isValid;
    payBtn.style.opacity = isValid ? "1" : "0.6";
    payBtn.style.cursor  = isValid ? "pointer" : "not-allowed";
  }

  // ---------- TYPEWRITER ----------
  var typewriterEl    = document.getElementById("typewriter");
  var typewriterWords = ["Architects", "Pioneers", "Builders", "Visionaries"];
  var wordIndex = 0, charIndex = 0, isDeleting = false;
  function typeWrite() {
    if (!typewriterEl) return;
    var word = typewriterWords[wordIndex];
    typewriterEl.textContent = isDeleting ? word.substring(0, charIndex - 1) : word.substring(0, charIndex + 1);
    isDeleting ? charIndex-- : charIndex++;
    if (!isDeleting && charIndex === word.length) { setTimeout(function(){ isDeleting = true; typeWrite(); }, 1800); return; }
    if (isDeleting && charIndex === 0)            { isDeleting = false; wordIndex = (wordIndex + 1) % typewriterWords.length; }
    setTimeout(typeWrite, isDeleting ? 60 : 100);
  }
  typeWrite();

  // ---------- HELPERS ----------
  function showPostPayment() {
    var formTop = registerForm.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: formTop, behavior: "smooth" });
    setTimeout(function() {
      if (formFields)      formFields.style.display      = "none";
      if (paymentThanks)   paymentThanks.style.display   = "block";
      if (innovateSection) innovateSection.style.display = "block";
    }, 400);
  }

  function lockForm(form, text) {
    if (!form) return;
    form.classList.add("form-processing");
    var msg = form.querySelector("[id$='loaderMessage']");
    if (msg) msg.textContent = text || "Processing...";
  }

  function unlockForm(form) {
    if (form) form.classList.remove("form-processing");
  }

  function resetPreview() {
    if (idPreview)      idPreview.style.display = "none";
    if (idPreviewImage) idPreviewImage.src = "";
    if (idFileName)     idFileName.textContent = "";
    if (idFileType)     idFileType.textContent = "";
    if (idError)        idError.textContent = "";
    if (verifyStatus)   verifyStatus.textContent = "";
  }

  function showStatus(el, message, type) {
    if (!el) return;
    el.style.display = "block";
    el.className = "form-status-box status-" + type;
    el.textContent = message;
  }

  // ---------- TOGGLE FORMS ----------
  document.querySelectorAll('input[name="regType"]').forEach(function(radio) {
    radio.addEventListener("change", function() {
      if (radio.value === "new") {
        if (registerForm)     registerForm.style.display     = "block";
        if (innovateOnlyForm) innovateOnlyForm.style.display = "none";
      } else {
        if (registerForm)     registerForm.style.display     = "none";
        if (innovateOnlyForm) innovateOnlyForm.style.display = "block";
        if (innovateStatusBox)  { innovateStatusBox.style.display = "none"; innovateStatusBox.className = "form-status-box"; }
        if (innovatePayGroup)   innovatePayGroup.style.display   = "none";
        if (innovateOnlyFields) innovateOnlyFields.style.display = "block";
        if (innovateOnlyThanks) innovateOnlyThanks.style.display = "none";
        if (innovateAppForm)    innovateAppForm.style.display    = "none";
        if (innovateVerifyBtn)  innovateVerifyBtn.style.display  = "block";
      }
    });
  });

  // ---------- EMAIL CHECK (Form A) ----------
  async function checkEmailDuplicate(email) {
    var errorEl = document.getElementById("emailError");
    if (!errorEl) return;
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { errorEl.textContent = ""; emailIsValid = true; checkFormValidity(); return; }
    errorEl.style.color = "#9ca3af";
    errorEl.textContent = "Checking availability...";
    emailIsValid = false;
    checkFormValidity();
    try {
      var controller = new AbortController();
      var tid = setTimeout(function(){ controller.abort(); }, 10000);
      var res = await fetch(BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=xperience", { signal: controller.signal });
      clearTimeout(tid);
      if (!res.ok) throw new Error("Server " + res.status);
      var data = await res.json();
      backendReachable = true;
      if (data.registered) {
        errorEl.style.color = "#fca5a5";
        errorEl.textContent = "This email is already registered. Please use a different email.";
        emailIsValid = false;
      } else {
        errorEl.style.color = "#22c55e";
        errorEl.textContent = "Email is available";
        emailIsValid = true;
        setTimeout(function(){ if (errorEl.textContent === "Email is available") errorEl.textContent = ""; }, 4000);
      }
    } catch (err) {
      errorEl.style.color = "#f7de50";
      errorEl.textContent = err.name === "AbortError" ? "Email check timed out. We'll verify at payment." : "Could not verify email. We'll check at payment.";
      emailIsValid = true;
    }
    checkFormValidity();
  }

  var emailInput = document.getElementById("email");
  if (emailInput) {
    emailInput.addEventListener("input", function() {
      var email = emailInput.value.trim();
      var errorEl = document.getElementById("emailError");
      emailIsValid = false;
      if (errorEl) errorEl.textContent = "";
      checkFormValidity();
      clearTimeout(emailCheckTimeout);
      if (email) emailCheckTimeout = setTimeout(function(){ checkEmailDuplicate(email); }, 900);
    });
  }

  // ---------- ID VERIFY ----------
  function verifyIDCard() {
    if (verifyStatus) { verifyStatus.textContent = "Verifying ABU ID..."; verifyStatus.style.color = "#f7de50"; }
    setTimeout(function() {
      abuVerified = true;
      if (verifyStatus) { verifyStatus.textContent = "ABU ID uploaded successfully."; verifyStatus.style.color = "#22c55e"; }
      checkFormValidity();
    }, 1200);
  }

  // ---------- FILE UPLOAD (Form A) ----------
  if (regNumberInput) {
    regNumberInput.addEventListener("change", function(e) {
      e.preventDefault();
      var file = e.target.files[0];
      uploadedFile = null; abuVerified = false;
      resetPreview();
      if (!file) { if (idError) idError.textContent = "Please upload your ABU ID or admission letter."; checkFormValidity(); return; }
      if (file.size > 5 * 1024 * 1024) {
        if (idError) { idError.style.color = "#fecaca"; idError.textContent = "File too large (" + (file.size/1024/1024).toFixed(1) + "MB). Maximum is 5MB."; }
        e.target.value = ""; checkFormValidity(); return;
      }
      var validTypes = ["image/jpeg","image/jpg","image/png","image/webp","application/pdf"];
      if (validTypes.indexOf(file.type) === -1) {
        if (idError) { idError.style.color = "#fecaca"; idError.textContent = "Invalid file type. JPG, PNG or PDF only."; }
        e.target.value = ""; checkFormValidity(); return;
      }
      uploadedFile = file;
      if (idError) idError.textContent = "";
      var isPDF = file.type.indexOf("pdf") !== -1;
      if (idPreview)  idPreview.style.display = "flex";
      if (idFileName) idFileName.textContent  = file.name;
      if (idFileType) idFileType.textContent  = isPDF ? "PDF document" : file.type.replace("image/","").toUpperCase() + " image";
      if (idPreviewImage) {
        if (isPDF) { idPreviewImage.src = "https://cdn-icons-png.flaticon.com/512/337/337946.png"; }
        else { var reader = new FileReader(); reader.onload = function(ev){ idPreviewImage.src = ev.target.result; }; reader.readAsDataURL(file); }
      }
      verifyIDCard();
    });
  }

  // ---------- SCHOOL SELECT ----------
  if (schoolSelectEl) {
    schoolSelectEl.addEventListener("change", function() {
      var value = this.value;
      if (paymentSection)    paymentSection.style.display    = "none";
      if (regSection)        regSection.style.display        = "none";
      if (schoolNameSection) schoolNameSection.style.display = "none";
      resetPreview();
      uploadedFile = null; abuVerified = false;
      if (schoolNameInput) schoolNameInput.value = "";
      var schoolNameError = document.getElementById("schoolNameError");
      if (schoolNameError) schoolNameError.textContent = "";
      if (!value) { if (payBtn) payBtn.disabled = true; return; }
      if (value === "yes") {
        baseAmount = 5000;
        if (paymentText) paymentText.innerHTML = "<strong>ABU Student Ticket:</strong> &#8358;5,000";
        if (regSection) regSection.style.display = "block";
        if (verifyStatus) { verifyStatus.textContent = "Upload a clear, legible ABU ID card or admission letter."; verifyStatus.style.color = "#9ca3af"; }
      } else {
        baseAmount = 12000;
        if (paymentText) paymentText.innerHTML = "<strong>Non-ABU Student / Young Professional Ticket:</strong> &#8358;12,000";
        abuVerified = true;
        if (schoolNameSection) { schoolNameSection.style.display = "block"; setTimeout(function(){ if(schoolNameInput) schoolNameInput.focus(); }, 100); }
      }
      if (paymentSection) paymentSection.style.display = "block";
      checkFormValidity();
    });
  }

  // ---------- INPUT LISTENERS ----------
  var nameInput = document.getElementById("name");
  if (nameInput) nameInput.addEventListener("input", checkFormValidity);

  if (schoolNameInput) {
    schoolNameInput.addEventListener("input", function() {
      var errorEl = document.getElementById("schoolNameError");
      if (errorEl) errorEl.textContent = schoolNameInput.value.trim() ? "" : "Please enter the name of your school.";
      checkFormValidity();
    });
  }

  // ---------- PAY BUTTON (Form A) ----------
  if (payBtn) {
    payBtn.addEventListener("click", function(e) { e.preventDefault(); handlePayment(); });
  }

  async function handlePayment() {
    if (!payBtn) return;
    var originalText = payBtn.innerHTML;
    payBtn.disabled = true;
    lockForm(registerForm, "Verifying details...");
    try {
      var name       = (document.getElementById("name") || {}).value || "";
      var email      = (document.getElementById("email") || {}).value || "";
      var school     = schoolSelectEl ? schoolSelectEl.value : "";
      var interest   = (document.getElementById("interest") || {}).value || "";
      var schoolName = schoolNameInput ? schoolNameInput.value.trim() : "";
      name = name.trim(); email = email.trim();
      if (!name || !email || !school) throw new Error("Please fill in your name, email, and select school type.");
      if (school === "yes" && !abuVerified) throw new Error("Please upload and verify your ABU ID first.");
      if (school === "no" && !schoolName) {
        var sne = document.getElementById("schoolNameError");
        if (sne) sne.textContent = "Please enter the name of your school.";
        if (schoolNameInput) schoolNameInput.focus();
        throw new Error("Please enter the name of your school.");
      }
      var expectedAmount = school === "yes" ? 5000 : 12000;
      if (baseAmount !== expectedAmount) throw new Error("Payment amount mismatch. Please refresh and try again.");
      try {
        var controller = new AbortController();
        var tid = setTimeout(function(){ controller.abort(); }, 8000);
        var dupRes = await fetch(BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=xperience", { signal: controller.signal });
        clearTimeout(tid);
        if (dupRes.ok) {
          var dupData = await dupRes.json();
          if (dupData.registered) {
            var errEl = document.getElementById("emailError");
            if (errEl) { errEl.style.color = "#fca5a5"; errEl.textContent = "This email is already registered. Please use a different email."; }
            emailIsValid = false; unlockForm(registerForm); payBtn.disabled = false; payBtn.innerHTML = originalText; checkFormValidity(); return;
          }
        }
      } catch(_) {}
      registerForm.classList.remove("form-processing");
      var paymentResult = await new Promise(function(resolve, reject) {
        var handler = PaystackPop.setup({
          key: "pk_live_4671a8d0cd02e31339cfe5d157795faa58e2e4ba",
          email: email, amount: baseAmount * 100, currency: "NGN",
          callback: function(r){ resolve(r); },
          onClose:  function(){ reject(new Error("Payment cancelled")); }
        });
        handler.openIframe();
      });
      registerForm.classList.add("form-processing");
      lockForm(registerForm, "Verifying payment...");
      try {
        var verifyRes = await fetch(BACKEND_URL + "/verify-payment", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: paymentResult.reference, expectedAmount: expectedAmount })
        });
        var verifyData = await verifyRes.json();
        if (!verifyData.success) {
          unlockForm(registerForm); payBtn.disabled = false; payBtn.innerHTML = originalText;
          alert(verifyData.message || "Payment verification failed. Please contact us."); return;
        }
      } catch(_) {}
      lockForm(registerForm, "Saving your registration...");
      var formData = new FormData();
      formData.append("name",             name);
      formData.append("schoolName",       school === "no" ? schoolName : "");
      formData.append("email",            email);
      formData.append("school",           school);
      formData.append("interest",         interest);
      formData.append("paymentReference", paymentResult.reference);
      formData.append("amount",           String(baseAmount));
      if (school === "yes" && uploadedFile) formData.append("regNumber", uploadedFile);
      var response = await fetch(BACKEND_URL + "/register", { method: "POST", body: formData });
      var text = await response.text();
      var result;
      try { result = JSON.parse(text); } catch(e) { throw new Error("Server returned an invalid response. Please contact support."); }
      if (!result.success) throw new Error(result.message || "Registration failed. Please try again.");
      showPostPayment();
    } catch(error) {
      if (error.message !== "Payment cancelled") alert("Something went wrong: " + error.message);
    } finally {
      unlockForm(registerForm); payBtn.disabled = false; payBtn.innerHTML = originalText;
    }
  }

  // ---------- INNOVATE UPSELL (Form A post-payment) ----------
  if (paymentThanks) {
    paymentThanks.addEventListener("click", function(e) {
      if (e.target.id === "innovateNo") {
        if (innovateSection) innovateSection.style.display = "none";
        return;
      }
      if (e.target.id === "innovateYes") {
        var email = ((document.getElementById("email") || {}).value || "").trim();
        var name  = ((document.getElementById("name")  || {}).value || "").trim();
        if (innovateSection) innovateSection.style.display = "none";
        ipPreFill(name, email);
        ipShowAppForm();
      }
    });
  }

  // ---------- FORM B: VERIFY ----------
  if (innovateVerifyBtn) {
    innovateVerifyBtn.addEventListener("click", async function() {
      var name    = ((document.getElementById("innovateName")  || {}).value || "").trim();
      var email   = ((document.getElementById("innovateEmail") || {}).value || "").trim();
      var errorEl = document.getElementById("innovateEmailError");
      if (errorEl) errorEl.textContent = "";
      if (innovateStatusBox) innovateStatusBox.style.display = "none";
      if (!name || !email) { showStatus(innovateStatusBox, "Please enter both your full name and email address.", "error"); return; }
      if (!email.includes("@")) { if (errorEl) errorEl.textContent = "Please enter a valid email address."; return; }

      lockForm(innovateOnlyForm, "Verifying your registration..."); innovateVerifyBtn.disabled = true;
      try {
        var d1 = await (await fetch(BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=innovate")).json();
        if (d1.registered) { showStatus(innovateStatusBox, "This email has already been registered for Lex Innovate.", "warn"); return; }
        var d2 = await (await fetch(BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=xperience")).json();
        if (!d2.registered) { showStatus(innovateStatusBox, "No Lex Xperience registration found for this email. Please register for Lex Xperience first.", "error"); return; }

        showStatus(innovateStatusBox, "Registration confirmed for " + name + ". Please complete the application form below.", "success");

        // Lock name and email — no editing after verification
        var nameInp  = document.getElementById("innovateName");
        var emailInp = document.getElementById("innovateEmail");
        if (nameInp)  { nameInp.setAttribute("readonly", true);  nameInp.classList.add("input-locked"); }
        if (emailInp) { emailInp.setAttribute("readonly", true); emailInp.classList.add("input-locked"); }

        // Hide verify button, reveal application form
        innovateVerifyBtn.style.display = "none";
        ipPreFill(name, email);
        ipShowAppForm();

      } catch(_) {
        showStatus(innovateStatusBox, "Could not verify at this time. Please try again shortly.", "warn");
      } finally {
        unlockForm(innovateOnlyForm); innovateVerifyBtn.disabled = false;
      }
    });
  }

  // ---------- PAYMENT BUTTON (appears after form is completed) ----------
  if (innovateOnlyPayBtn) {
    innovateOnlyPayBtn.addEventListener("click", async function() {
      var email = ((document.getElementById("innovateEmail") || {}).value || "").trim();
      var name  = ((document.getElementById("ip-fullName")   || {}).value || "").trim() ||
                  ((document.getElementById("innovateName")  || {}).value || "").trim();
      var orig  = innovateOnlyPayBtn.innerHTML;
      innovateOnlyPayBtn.disabled = true; innovateOnlyPayBtn.innerHTML = "Opening payment...";

      try {
        var pr = await new Promise(function(resolve, reject) {
          var h = PaystackPop.setup({
            key: "pk_live_4671a8d0cd02e31339cfe5d157795faa58e2e4ba",
            email: email, amount: 20000 * 100, currency: "NGN",
            callback: function(r){ resolve(r); },
            onClose:  function(){ reject(new Error("Payment cancelled")); }
          });
          h.openIframe();
        });

        lockForm(innovateOnlyForm, "Saving your application..."); innovateOnlyPayBtn.innerHTML = "Processing...";

        var formData = new FormData();
        formData.append("email",       email);
        formData.append("name",        name);
        formData.append("reference",   pr.reference);
        formData.append("amount",      "20000");
        formData.append("phone",       (document.getElementById("ip-phone")       || {value:""}).value.trim());
        formData.append("institution", (document.getElementById("ip-institution") || {value:""}).value.trim());
        formData.append("course",      (document.getElementById("ip-course")      || {value:""}).value.trim());
        formData.append("yearOfStudy", (document.getElementById("ip-year")        || {value:""}).value);
        formData.append("startupName", (document.getElementById("ip-startupName") || {value:""}).value.trim());
        formData.append("tagline",     (document.getElementById("ip-tagline")     || {value:""}).value.trim());
        formData.append("website",     (document.getElementById("ip-website")     || {value:""}).value.trim());
        formData.append("stage",       (document.querySelector('input[name="ip-stage"]:checked')    || {value:""}).value);
        formData.append("teamSize",    (document.getElementById("ip-teamSize")    || {value:""}).value);
        formData.append("duration",    (document.querySelector('input[name="ip-duration"]:checked') || {value:""}).value);
        formData.append("problem",     (document.getElementById("ip-problem")     || {value:""}).value.trim());
        formData.append("solution",    (document.getElementById("ip-solution")    || {value:""}).value.trim());
        formData.append("legal",       (document.getElementById("ip-legal")       || {value:""}).value.trim());
        formData.append("bizModel",    (document.getElementById("ip-bizModel")    || {value:""}).value.trim());
        formData.append("traction",    (document.getElementById("ip-traction")    || {value:""}).value.trim());
        formData.append("useOfFunds",  (document.getElementById("ip-useOfFunds")  || {value:""}).value.trim());
        formData.append("videoLink",   (document.getElementById("ip-videoLink")   || {value:""}).value.trim());
        var deckFile  = (document.getElementById("ip-pitchDeck") || {files:[]}).files[0];
        if (deckFile)  formData.append("pitchDeck", deckFile);

        var res    = await fetch(BACKEND_URL + "/innovate-apply", { method: "POST", body: formData });
        var result = await res.json();
        if (!result.success) throw new Error(result.message || "Submission failed.");

        unlockForm(innovateOnlyForm);
        if (innovateOnlyFields) innovateOnlyFields.style.display = "none";
        if (innovateAppForm)    innovateAppForm.style.display    = "none";
        if (innovatePayGroup)   innovatePayGroup.style.display   = "none";
        if (innovateOnlyThanks) {
          innovateOnlyThanks.style.display = "block";
          innovateOnlyThanks.scrollIntoView({ behavior: "smooth", block: "start" });
        }

      } catch(err) {
        unlockForm(innovateOnlyForm);
        if (err.message === "Failed to fetch" || err.name === "TypeError") {
          if (innovateOnlyFields) innovateOnlyFields.style.display = "none";
          if (innovateAppForm)    innovateAppForm.style.display    = "none";
          if (innovatePayGroup)   innovatePayGroup.style.display   = "none";
          if (innovateOnlyThanks) { innovateOnlyThanks.style.display = "block"; innovateOnlyThanks.scrollIntoView({ behavior: "smooth", block: "start" }); }
        } else if (err.message !== "Payment cancelled") {
          showStatus(innovateStatusBox, "Payment failed: " + err.message, "error");
        }
      } finally {
        innovateOnlyPayBtn.disabled = false; innovateOnlyPayBtn.innerHTML = orig;
      }
    });
  }

  // ---------- PREFILL & SHOW APP FORM ----------
  function ipPreFill(name, email) {
    var ipName  = document.getElementById("ip-fullName");
    var ipEmail = document.getElementById("ip-email");
    if (ipName  && name)  { ipName.value  = name;  ipName.setAttribute("readonly", true);  ipName.classList.add("input-locked"); }
    if (ipEmail && email) { ipEmail.value = email; ipEmail.setAttribute("readonly", true); ipEmail.classList.add("input-locked"); }
  }

  function ipShowAppForm() {
    if (innovateAppForm) {
      innovateAppForm.style.display = "block";
      ipUpdateProgress(1);
      setTimeout(function(){
        innovateAppForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    }
  }

  // ---------- NAV ----------
  if (navToggle) navToggle.addEventListener("click", function(){ document.body.classList.toggle("nav-open"); });
  navLinks.forEach(function(link){ link.addEventListener("click", function(){ if (window.innerWidth <= 720) document.body.classList.remove("nav-open"); }); });
  document.addEventListener("click", function(e){
    if (!document.body.classList.contains("nav-open")) return;
    if (nav && !nav.contains(e.target) && navToggle && !navToggle.contains(e.target)) document.body.classList.remove("nav-open");
  });

  function updateActiveLink() {
    var scrollY = window.scrollY + 120;
    sections.forEach(function(section) {
      var id = section.getAttribute("id");
      if (scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
        navLinks.forEach(function(l){ l.classList.remove("active"); });
        var cur = document.querySelector('.nav-link[href="#' + id + '"]');
        if (cur) cur.classList.add("active");
      }
    });
  }

  var ticking = false;
  window.addEventListener("scroll", function(){
    if (!ticking) { requestAnimationFrame(function(){ updateActiveLink(); ticking = false; }); ticking = true; }
  }, { passive: true });

  // ---------- FADE OBSERVER ----------
  var fadeObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        var delay = entry.target.getAttribute("data-delay");
        if (delay) entry.target.style.setProperty("--delay", delay);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  document.querySelectorAll(".fade-in, .fade-slide-left, .fade-slide-right, .timeline-item, [data-delay]").forEach(function(el){ fadeObserver.observe(el); });

  updateActiveLink();
  checkFormValidity();

  // ---------- COUNTDOWN ----------
  var eventDate = new Date("2026-03-31T00:00:00+01:00").getTime();
  function updateCountdown() {
    var distance = eventDate - Date.now();
    if (distance <= 0) { var el = document.querySelector(".countdown"); if (el) el.innerHTML = '<span class="countdown-ended">Lex Xperience is Live!</span>'; return; }
    var d = Math.floor(distance / 86400000);
    var h = Math.floor((distance % 86400000) / 3600000);
    var m = Math.floor((distance % 3600000) / 60000);
    var s = Math.floor((distance % 60000) / 1000);
    [["cd-days",d],["cd-hours",h],["cd-mins",m],["cd-secs",s]].forEach(function(pair){
      var el = document.getElementById(pair[0]); if (!el) return;
      var val = String(pair[1]).padStart(2,"0");
      if (el.textContent !== val) { el.textContent = val; el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); setTimeout(function(){ el.classList.remove("tick"); }, 150); }
    });
  }
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // ---------- BACK TO TOP ----------
  window.addEventListener("scroll", function(){ if (backToTopBtn) backToTopBtn.classList.toggle("visible", window.scrollY > 400); }, { passive: true });
  if (backToTopBtn) backToTopBtn.addEventListener("click", function(){ window.scrollTo({ top: 0, behavior: "smooth" }); });

  // ---------- INNOVATE FILE UPLOADS ----------
  var ipDeckInput = document.getElementById("ip-pitchDeck");
  if (ipDeckInput) {
    ipDeckInput.addEventListener("change", function() {
      var file = this.files[0]; if (!file) return;
      var err = document.getElementById("ip-err-pitchDeck");
      if (file.size > 10 * 1024 * 1024) { if (err) err.textContent = "File too large. Maximum is 10MB."; this.value = ""; return; }
      if (file.type !== "application/pdf") { if (err) err.textContent = "PDF files only."; this.value = ""; return; }
      if (err) err.textContent = "";
      document.getElementById("ip-deckName").textContent = file.name;
      document.getElementById("ip-deckSize").textContent = (file.size/1024/1024).toFixed(2) + " MB";
      document.getElementById("ip-deckPreview").style.display = "flex";
    });
  }

  

  // ---------- WORD COUNTS ----------
  [
    { id: "ip-tagline",    ccId: "ip-wc-tagline",    max: 20  },
    { id: "ip-problem",    ccId: "ip-wc-problem",    max: 150 },
    { id: "ip-solution",   ccId: "ip-wc-solution",   max: 200 },
    { id: "ip-legal",      ccId: "ip-wc-legal",      max: 150 },
    { id: "ip-bizModel",   ccId: "ip-wc-bizModel",   max: 100 },
    { id: "ip-traction",   ccId: "ip-wc-traction",   max: 100 },
    { id: "ip-useOfFunds", ccId: "ip-wc-useOfFunds", max: 100 },
  ].forEach(function(f) {
    var el = document.getElementById(f.id);
    var cc = document.getElementById(f.ccId);
    if (!el || !cc) return;
    el.addEventListener("input", function() {
      var wc = ipWordCount(el.value);
      cc.textContent = wc + " / " + f.max + " words";
      cc.className = "ip-word-count" + (wc > f.max ? " over" : wc > f.max * 0.85 ? " warn" : "");
    });
  });

}); // end DOMContentLoaded


// ================================================================
// INNOVATE MULTI-STEP FORM — global functions (called from HTML)
// ================================================================

function ipWordCount(str) {
  return str.trim().split(/\s+/).filter(function(w){ return w.length > 0; }).length;
}

function ipSetErr(id, msg) {
  var el = document.getElementById("ip-err-" + id);
  if (el) el.textContent = msg;
}
function ipClearErr(id) { ipSetErr(id, ""); }

function ipUpdateProgress(step) {
  for (var i = 1; i <= 5; i++) {
    var dot   = document.getElementById("ip-dot-" + i);
    var label = document.getElementById("ip-label-" + i);
    if (!dot) continue;
    dot.classList.remove("active", "done");
    if (label) label.classList.remove("active");
    if (i < step)        { dot.classList.add("done"); }
    else if (i === step) { dot.classList.add("active"); if (label) label.classList.add("active"); }
  }
  var fill = document.getElementById("ipFill");
  if (fill) fill.style.width = (((step - 1) / 4) * 100) + "%";
}

function ipShowStep(n) {
  document.querySelectorAll(".ip-panel").forEach(function(p){ p.classList.remove("active"); });
  var panel = document.getElementById("ip-step-" + n);
  if (panel) {
    panel.classList.add("active");
    setTimeout(function(){ panel.scrollIntoView({ behavior: "smooth", block: "start" }); }, 50);
  }
  ipUpdateProgress(n);
}

function ipValidate(step) {
  var ok = true;

  if (step === 1) {
    [
      { id: "ip-fullName",    errKey: "fullName",    msg: "Full name is required." },
      { id: "ip-phone",       errKey: "phone",       msg: "Phone number is required." },
      { id: "ip-institution", errKey: "institution", msg: "Institution is required." },
      { id: "ip-course",      errKey: "course",      msg: "Course of study is required." },
    ].forEach(function(f) {
      var val = (document.getElementById(f.id) || {value:""}).value.trim();
      if (!val) { ipSetErr(f.errKey, f.msg); ok = false; } else ipClearErr(f.errKey);
    });
    var email = (document.getElementById("ip-email") || {value:""}).value.trim();
    if (!email || !email.includes("@")) { ipSetErr("email", "A valid email is required."); ok = false; } else ipClearErr("email");
    var year  = (document.getElementById("ip-year") || {value:""}).value;
    if (!year) { ipSetErr("year", "Please select your year of study."); ok = false; } else ipClearErr("year");
  }

  if (step === 2) {
    var sName = (document.getElementById("ip-startupName") || {value:""}).value.trim();
    if (!sName) { ipSetErr("startupName", "Startup name is required."); ok = false; } else ipClearErr("startupName");

    var tagline = (document.getElementById("ip-tagline") || {value:""}).value.trim();
    if (!tagline) { ipSetErr("tagline", "A one-line description is required."); ok = false; }
    else if (ipWordCount(tagline) > 20) { ipSetErr("tagline", "Please keep within 20 words."); ok = false; }
    else ipClearErr("tagline");

    if (!document.querySelector('input[name="ip-stage"]:checked'))    { ipSetErr("stage",    "Please select a stage."); ok = false; }    else ipClearErr("stage");
    if (!(document.getElementById("ip-teamSize") || {value:""}).value) { ipSetErr("teamSize", "Please select team size."); ok = false; } else ipClearErr("teamSize");
    if (!document.querySelector('input[name="ip-duration"]:checked')) { ipSetErr("duration", "Please select how long you have been working on this."); ok = false; } else ipClearErr("duration");

    var web = (document.getElementById("ip-website") || {value:""}).value.trim();
    if (web && !web.startsWith("http")) { ipSetErr("website", "Please enter a valid URL starting with http:// or https://"); ok = false; } else ipClearErr("website");
  }

  if (step === 3) {
    [
      { id: "ip-problem",    errKey: "problem",    max: 150 },
      { id: "ip-solution",   errKey: "solution",   max: 200 },
      { id: "ip-legal",      errKey: "legal",      max: 150 },
      { id: "ip-bizModel",   errKey: "bizModel",   max: 100 },
      { id: "ip-traction",   errKey: "traction",   max: 100 },
      { id: "ip-useOfFunds", errKey: "useOfFunds", max: 100 },
    ].forEach(function(f) {
      var val = (document.getElementById(f.id) || {value:""}).value.trim();
      var wc  = ipWordCount(val);
      if (!val)        { ipSetErr(f.errKey, "This field is required."); ok = false; }
      else if (wc > f.max) { ipSetErr(f.errKey, "Please keep within " + f.max + " words (" + wc + " used)."); ok = false; }
      else ipClearErr(f.errKey);
    });
  }

  if (step === 5) {
    var d1 = document.getElementById("ip-dec1") && document.getElementById("ip-dec1").checked;
    var d2 = document.getElementById("ip-dec2") && document.getElementById("ip-dec2").checked;
    var d3 = document.getElementById("ip-dec3") && document.getElementById("ip-dec3").checked;
    if (!d1 || !d2 || !d3) { ipSetErr("declaration", "Please check all three declarations to proceed."); ok = false; }
    else ipClearErr("declaration");
  }

  return ok;
}

function ipNext(from) {
  if (!ipValidate(from)) return;
  if (from === 4) {
    var sn = document.getElementById("ip-summaryName");    if (sn) sn.textContent = (document.getElementById("ip-fullName")    || {value:"—"}).value.trim();
    var se = document.getElementById("ip-summaryEmail");   if (se) se.textContent = (document.getElementById("ip-email")       || {value:"—"}).value.trim();
    var ss = document.getElementById("ip-summaryStartup"); if (ss) ss.textContent = (document.getElementById("ip-startupName") || {value:"—"}).value.trim();
  }
  ipShowStep(from + 1);
}

function ipPrev(from) {
  // If going back from the declaration step, hide the pay group
  if (from === 5) {
    var payGroup = document.getElementById("innovatePayGroup");
    if (payGroup) payGroup.style.display = "none";
  }
  ipShowStep(from - 1);
}

// Called from the "Complete & Pay" button on step E
function ipShowPayment() {
  if (!ipValidate(5)) return;
  var payGroup = document.getElementById("innovatePayGroup");
  if (payGroup) {
    payGroup.style.display = "block";
    setTimeout(function(){ payGroup.scrollIntoView({ behavior: "smooth", block: "center" }); }, 50);
  }
}