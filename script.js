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
    const verifyStatus = document.getElementById("verifyStatus");
    const idError = document.getElementById("idError");
    const idPreview = document.getElementById("idPreview");
    const idPreviewImage = document.getElementById("idPreviewImage");
    const idFileName = document.getElementById("idFileName");
    const idFileType = document.getElementById("idFileType");
    const innovateSection = document.getElementById("innovateSection");
    const innovateYes = document.getElementById("innovateYes");
    const innovateNo = document.getElementById("innovateNo");
    const paymentThanks = document.getElementById("paymentThanks");
    const formFields = document.getElementById("formFields");

    let baseAmount = 0;
    let abuVerified = false;
    let rafId;
    let uploadedFile = null;
    let verifyTimeout;

    const MOCK_VERIFICATION_MODE = true;

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


    function showSuccess() {
      registerForm.reset();
      uploadedFile = null;
      abuVerified = false;
      formSuccess.hidden = false;
      formSuccess.style.animation = "fadeInUp 0.5s ease-out";
      setTimeout(() => { 
        formSuccess.hidden = true; 
        formSuccess.style.animation = ""; 
        payBtn.disabled = true;
        payBtn.style.opacity = "0.6";
      }, 5000);
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

    regNumberInput.addEventListener("change", (e) => {
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

    document.getElementById("name").addEventListener("input", checkFormValidity);
    document.getElementById("email").addEventListener("input", checkFormValidity);

    function payWithPaystack(amount, email, callback) {
      if (typeof PaystackPop === 'undefined') {
        alert("Payment system is loading. Please wait a moment and try again.");
        console.error("PaystackPop is not defined.");
        return;
      }

      if (amount <= 0) {
        alert("Invalid ticket amount.");
        return;
      }

      let handler = PaystackPop.setup({
        key: "pk_test_fdee842fa175444c2e87ef45bd710104c894358a",
        email: email,
        amount: amount * 100,
        currency: "NGN",
        theme: { color: "#f7de50" },
        callback: function(response) {
          console.log("Payment Success:", response);
          callback(response);
        },
        onClose: function() { 
          console.log("Payment Closed");
        }
      });

      handler.openIframe();
    }

    function showPostPayment() {
      formFields.style.display = "none";
      paymentThanks.style.display = "block";
      innovateSection.style.display = "block";
    }

    payBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const name = document.getElementById("name").value.trim();

  if (!email || !name) {
    alert("Please fill your name and email first.");
    return;
  }

  if (schoolSelectEl.value === "yes" && !abuVerified) {
    alert("Please upload and verify your ABU ID card first.");
    return;
  }

  payWithPaystack(baseAmount, email, async (response) => {

    // AFTER successful payment → send to backend
    const formData = new FormData(registerForm);
    formData.append("paymentReference", response.reference);

    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        showPostPayment();
      }

    } catch (error) {
      console.error(error);
      alert("Registration failed after payment.");
    }
  });
});

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

    checkFormValidity();