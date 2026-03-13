// 🔥 LEX XPERIENCE 2026 - PRODUCTION SCRIPT.JS

// ✅ Fix body opacity immediately so a JS crash never leaves the page invisible
document.body.style.opacity = '1';
document.body.style.animation = 'none';

const BACKEND_URL = "https://lex-xperience-backend.onrender.com";
const MOCK_VERIFICATION_MODE = true;

// ---------- STATE ----------
let baseAmount    = 0;
let abuVerified   = false;
let uploadedFile  = null;
let emailIsValid  = false;
let verifyTimeout;
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
  var backToTopBtn       = document.getElementById("backToTop");

  // Initialise payBtn as disabled on load
  if (payBtn) { payBtn.disabled = true; payBtn.style.opacity = '0.6'; payBtn.style.cursor = 'not-allowed'; }

  // Prevent native form submit
  if (registerForm)     registerForm.addEventListener("submit",    function(e){ e.preventDefault(); e.stopPropagation(); });
  if (innovateOnlyForm) innovateOnlyForm.addEventListener("submit", function(e){ e.preventDefault(); e.stopPropagation(); });

  // ---------- FORM VALIDITY ----------
  function checkFormValidity() {
    if (!payBtn) return;
    var name       = (document.getElementById("name")  || {value:""}).value.trim();
    var email      = (document.getElementById("email") || {value:""}).value.trim();
    var school     = schoolSelectEl ? schoolSelectEl.value : "";
    var schoolName = (document.getElementById("schoolName") || {value:""}).value.trim();
    var errorMsg   = (document.getElementById("emailError") || {textContent:""}).textContent;

    // Email OK if: has @ and dot, AND backend hasn't confirmed it's a duplicate
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
        if (registerForm)    registerForm.style.display    = "block";
        if (innovateOnlyForm) innovateOnlyForm.style.display = "none";
      } else {
        if (registerForm)    registerForm.style.display    = "none";
        if (innovateOnlyForm) innovateOnlyForm.style.display = "block";
        if (innovateStatusBox) { innovateStatusBox.style.display = "none"; innovateStatusBox.className = "form-status-box"; }
        if (innovatePayGroup)  innovatePayGroup.style.display  = "none";
        if (innovateOnlyFields) innovateOnlyFields.style.display = "block";
        if (innovateOnlyThanks) innovateOnlyThanks.style.display = "none";
      }
    });
  });

  // ---------- EMAIL CHECK ----------
  async function checkEmailDuplicate(email) {
    var errorEl = document.getElementById("emailError");
    if (!errorEl) return;
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { errorEl.textContent = ""; emailIsValid = true; checkFormValidity(); return; }

    errorEl.style.color = "#9ca3af";
    errorEl.textContent = "⏳ Checking availability...";
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
        errorEl.textContent = "⚠️ This email is already registered. Please use a different email.";
        emailIsValid = false;
      } else {
        errorEl.style.color = "#22c55e";
        errorEl.textContent = "✓ Email is available";
        emailIsValid = true;
        setTimeout(function(){ if (errorEl.textContent === "✓ Email is available") errorEl.textContent = ""; }, 4000);
      }
    } catch (err) {
      errorEl.style.color = "#f7de50";
      errorEl.textContent = err.name === "AbortError" ? "⚠️ Email check timed out. We'll verify at payment." : "⚠️ Could not verify email. We'll check at payment.";
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

  // ---------- MOCK ID VERIFY ----------
  function verifyIDCard() {
    if (verifyStatus) { verifyStatus.textContent = "🔍 Verifying ABU ID..."; verifyStatus.style.color = "#f7de50"; }
    setTimeout(function() {
      abuVerified = true;
      if (verifyStatus) { verifyStatus.textContent = "✅ ABU ID uploaded successfully!"; verifyStatus.style.color = "#22c55e"; }
      checkFormValidity();
    }, 1200);
  }

  // ---------- FILE UPLOAD ----------
  if (regNumberInput) {
    regNumberInput.addEventListener("change", function(e) {
      e.preventDefault();
      var file = e.target.files[0];
      uploadedFile = null; abuVerified = false;
      resetPreview();

      if (!file) { if (idError) idError.textContent = "Please upload your ABU ID or admission letter."; checkFormValidity(); return; }

      if (file.size > 5 * 1024 * 1024) {
        var sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        if (idError) { idError.style.color = "#fecaca"; idError.textContent = "❌ File too large (" + sizeMB + "MB). Maximum is 5MB."; }
        e.target.value = ""; checkFormValidity(); return;
      }

      var validTypes = ["image/jpeg","image/jpg","image/png","image/webp","application/pdf"];
      if (validTypes.indexOf(file.type) === -1) {
        if (idError) { idError.style.color = "#fecaca"; idError.textContent = "❌ Invalid file type. JPG, PNG or PDF only."; }
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
        if (paymentText) paymentText.innerHTML = "<strong>ABU Student Ticket:</strong> ₦5,000";
        if (regSection) regSection.style.display = "block";
        if (verifyStatus) { verifyStatus.textContent = "Upload a clear, legible ABU ID card or admission letter."; verifyStatus.style.color = "#9ca3af"; }
      } else {
        baseAmount = 12000;
        if (paymentText) paymentText.innerHTML = "<strong>Non-ABU Student / Young Professional Ticket:</strong> ₦12,000";
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

  // ---------- PAY BUTTON ----------
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

      // Hard duplicate check
      try {
        var controller = new AbortController();
        var tid = setTimeout(function(){ controller.abort(); }, 8000);
        var dupRes = await fetch(BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=xperience", { signal: controller.signal });
        clearTimeout(tid);
        if (dupRes.ok) {
          var dupData = await dupRes.json();
          if (dupData.registered) {
            var errEl = document.getElementById("emailError");
            if (errEl) { errEl.style.color = "#fca5a5"; errEl.textContent = "⚠️ This email is already registered. Please use a different email."; }
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
      formData.append("schoolName",        school === "no" ? schoolName : "");
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

  // ---------- INNOVATE UPSELL (event delegation on hidden parent) ----------
  if (paymentThanks) {
    paymentThanks.addEventListener("click", async function(e) {
      if (e.target.id === "innovateNo") {
        if (innovateSection) innovateSection.style.display = "none";
        return;
      }
      if (e.target.id === "innovateYes") {
        var yesBtn = e.target;
        var noBtn  = document.getElementById("innovateNo");
        var email  = ((document.getElementById("email") || {}).value || "").trim();
        var orig   = yesBtn.innerHTML;
        yesBtn.disabled = true; if (noBtn) noBtn.disabled = true;
        yesBtn.innerHTML = "Processing...";
        try {
          var pr = await new Promise(function(resolve, reject) {
            var h = PaystackPop.setup({ key: "pk_live_4671a8d0cd02e31339cfe5d157795faa58e2e4ba", email: email, amount: 20000 * 100, currency: "NGN", callback: function(r){ resolve(r); }, onClose: function(){ reject(new Error("Payment cancelled")); } });
            h.openIframe();
          });
          var res = await fetch(BACKEND_URL + "/innovate-pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, reference: pr.reference, amount: 20000 }) });
          var result = await res.json();
          if (!result.success) throw new Error(result.message || "Innovate payment failed");
          if (innovateSection) innovateSection.style.display = "none";
        } catch(err) {
          if (err.message !== "Payment cancelled") alert("Failed: " + err.message);
        } finally {
          yesBtn.disabled = false; if (noBtn) noBtn.disabled = false; yesBtn.innerHTML = orig;
        }
      }
    });
  }

  // ---------- FORM B ----------
  if (innovateVerifyBtn) {
    innovateVerifyBtn.addEventListener("click", async function() {
      var name    = ((document.getElementById("innovateName") || {}).value || "").trim();
      var email   = ((document.getElementById("innovateEmail") || {}).value || "").trim();
      var errorEl = document.getElementById("innovateEmailError");
      if (errorEl) errorEl.textContent = "";
      if (innovateStatusBox) innovateStatusBox.style.display = "none";
      if (innovatePayGroup)  innovatePayGroup.style.display  = "none";
      if (!name || !email) { showStatus(innovateStatusBox, "Please enter both your full name and email address.", "error"); return; }
      if (!email.includes("@")) { if (errorEl) errorEl.textContent = "Please enter a valid email address."; return; }
      lockForm(innovateOnlyForm, "Verifying your registration..."); innovateVerifyBtn.disabled = true;
      try {
        var d1 = await (await fetch(BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=innovate")).json();
        if (d1.registered) { showStatus(innovateStatusBox, "⚠️ This email has already been registered for Lex Innovate.", "warn"); return; }
        var d2 = await (await fetch(BACKEND_URL + "/check-email?email=" + encodeURIComponent(email) + "&type=xperience")).json();
        if (!d2.registered) { showStatus(innovateStatusBox, "❌ No Lex Xperience registration found for this email. Please register for Lex Xperience first.", "error"); return; }
        showStatus(innovateStatusBox, "✅ Registration confirmed for " + name + "! You can now proceed to pay for Lex Innovate.", "success");
        // Hide the verify button once confirmed
        innovateVerifyBtn.style.display = 'none';
        if (innovatePayGroup) innovatePayGroup.style.display = "block";
      } catch(_) { showStatus(innovateStatusBox, "⚠️ Could not verify at this time. Please try again shortly.", "warn");
      } finally { unlockForm(innovateOnlyForm); innovateVerifyBtn.disabled = false; }
    });
  }

  if (innovateOnlyPayBtn) {
    innovateOnlyPayBtn.addEventListener("click", async function() {
      var email = ((document.getElementById("innovateEmail") || {}).value || "").trim();
      var name  = ((document.getElementById("innovateName")  || {}).value || "").trim();
      var orig  = innovateOnlyPayBtn.innerHTML;
      innovateOnlyPayBtn.disabled = true; innovateOnlyPayBtn.innerHTML = "Opening payment...";
      try {
        var pr = await new Promise(function(resolve, reject) {
          var h = PaystackPop.setup({ key: "pk_live_4671a8d0cd02e31339cfe5d157795faa58e2e4ba", email: email, amount: 20000 * 100, currency: "NGN", callback: function(r){ resolve(r); }, onClose: function(){ reject(new Error("Payment cancelled")); } });
          h.openIframe();
        });
        lockForm(innovateOnlyForm, "Saving your Innovate registration..."); innovateOnlyPayBtn.innerHTML = "Processing...";
        var res = await fetch(BACKEND_URL + "/innovate-pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, name: name, reference: pr.reference, amount: 20000 }) });
        var result = await res.json();
        if (!result.success) throw new Error(result.message || "Payment failed");
        if (innovateOnlyFields) innovateOnlyFields.style.display = "none";
        if (innovateOnlyThanks) innovateOnlyThanks.style.display = "block";
      } catch(err) {
        if (err.message !== "Payment cancelled") showStatus(innovateStatusBox, "❌ Payment failed: " + err.message, "error");
      } finally { unlockForm(innovateOnlyForm); innovateOnlyPayBtn.disabled = false; innovateOnlyPayBtn.innerHTML = orig; }
    });
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
    if (distance <= 0) { var el = document.querySelector(".countdown"); if (el) el.innerHTML = '<span class="countdown-ended">🎉 Lex Xperience is Live!</span>'; return; }
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

}); // end DOMContentLoaded