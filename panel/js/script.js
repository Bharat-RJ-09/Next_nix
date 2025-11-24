// panel/js/script.js - Frontend Login/OTP UI Flow (API Dependent)

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const passwordInput = document.getElementById("password");
  const userLoginInput = document.getElementById("userLogin");

  // Password Toggle Logic (Kept)
  const togglePasswordBtn = document.getElementById("togglePassword");
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", () => {
      const currentType = passwordInput.getAttribute("type");
      if (currentType === "password") {
        passwordInput.setAttribute("type", "text");
        togglePasswordBtn.textContent = "🔒"; 
      } else {
        passwordInput.setAttribute("type", "password");
        togglePasswordBtn.textContent = "👁"; 
      }
    });
  }

  // OTP modal elements (Kept for UI control)
  const otpModal = document.getElementById("otpModal");
  const otpInput = document.getElementById("otpInput");
  const otpMessage = document.getElementById("otpMessage");
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");
  const resendOtpBtn = document.getElementById("resendOtpBtn");
  const showOtpDev = document.getElementById("showOtpDev");
  const otpTimer = document.getElementById("otpTimer");
  const closeOtpBtn = document.getElementById("closeOtpBtn");

  // OTP State (Kept for UI flow, but values come from/go to API)
  let currentUserIdentifier = null; // Store username/email temporarily for API
  let otpTimerInterval = null;

  function startOtpTimer() {
    // Timer Logic (Kept)
    let otpExpires = Date.now() + 5 * 60 * 1000; // Mock 5 minutes
    clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(() => {
      const diff = Math.max(0, otpExpires - Date.now());
      const sec = Math.ceil(diff / 1000);
      const mm = String(Math.floor(sec / 60)).padStart(2, "0");
      const ss = String(sec % 60).padStart(2, "0");
      otpTimer.textContent = `${mm}:${ss}`;
      if (diff <= 0) {
        clearInterval(otpTimerInterval);
        otpMessage.textContent = "⏳ OTP expired. Please resend.";
      }
    }, 500);
  }

  function openOtpModal(email) {
    // UI Logic (Kept)
    otpModal.style.display = "flex";
    otpMessage.textContent = `OTP sent to ${email}`;
    otpInput.value = "";
    startOtpTimer();
  }
  
  // Login form submit -> API call for credentials check and OTP send
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const loginVal = userLoginInput.value.trim();
    const password = passwordInput.value;

    if (!loginVal || !password) { alert("Please fill all fields!"); return; }

    currentUserIdentifier = loginVal; // Store for OTP resend

    // --- API CALL: CHECK CREDENTIALS & SEND OTP ---
    fetch('/api/auth_login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginVal, password: password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            openOtpModal(data.email); // Use email returned by server
        } else {
            alert(data.message || "Login failed. Check credentials/status.");
        }
    })
    .catch(error => {
        console.error('Login API error:', error);
        alert('An unexpected error occurred during login.');
    });
  });

  // Verify OTP
  verifyOtpBtn.addEventListener("click", () => {
    const entered = otpInput.value.trim();
    if (!entered) { alert("Enter OTP"); return; }
    
    // --- API CALL: VERIFY OTP ---
    fetch('/api/auth_verify_otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: currentUserIdentifier, otp: entered })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert("✅ Login successful!");
            otpModal.style.display = "none";
            // Server should have set session cookies before redirect
            window.location.href = "index.html"; 
        } else {
            alert(data.message || "❌ Invalid OTP. Try again.");
        }
    })
    .catch(error => {
        console.error('Verify OTP API error:', error);
        alert('An unexpected error occurred during verification.');
    });
  });

  // Resend OTP
  resendOtpBtn.addEventListener("click", () => {
    if (!currentUserIdentifier) { alert("Session lost. Please login again."); return; }
    
    // --- API CALL: RESEND OTP ---
    fetch('/api/auth_resend_otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: currentUserIdentifier })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            openOtpModal(data.email); // Restart timer/modal
            alert("✅ OTP resent!");
        } else {
            alert(data.message || "❌ Could not resend OTP.");
        }
    })
    .catch(error => {
        console.error('Resend OTP API error:', error);
        alert('An unexpected error occurred during resend.');
    });
  });

  // Dev: show OTP (UI kept for development)
  showOtpDev.addEventListener("click", () => {
     alert("NOTE: OTP is now generated on the server (PHP). This button is for DEV/MOCK display only.");
  });

  // Close OTP modal (Kept)
  closeOtpBtn.addEventListener("click", () => {
    otpModal.style.display = "none";
    clearInterval(otpTimerInterval);
  });
});