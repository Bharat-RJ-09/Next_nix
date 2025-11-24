// js/signup.js - Frontend Signup Logic (API Dependent)

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const usernameInput = document.getElementById("username");
  const usernameMsg = document.getElementById("usernameMsg");
  const mobileInput = document.getElementById("mobile");
  
  // New OTP Elements
  const sendOtpBtn = document.getElementById("sendOtpBtn");
  const otpVerificationSection = document.getElementById("otpVerificationSection");
  const otpInput = document.getElementById("otpInput");
  const otpTimer = document.getElementById("otpTimer");
  const resendOtpBtn = document.getElementById("resendOtpBtn");
  const verifyOtpBtn = document.getElementById("verifyOtpBtn");
  const otpStatusMessage = document.getElementById("otpStatusMessage");
  const signupFinalBtn = document.getElementById("signupFinalBtn");

  const usernameRegex = /^[a-zA-Z0-9_]{1,15}$/;
  const mobileRegex = /^\d{10}$/;

  // OTP State
  let isOtpVerified = false;

  // --- OTP TIMER AND SEND LOGIC ---
  function startOtpTimer() {
    // UI Timer Logic (Kept)
    let otpExpires = Date.now() + 60 * 1000; // 60 seconds validity
    resendOtpBtn.disabled = true;
    
    clearInterval(otpTimerInterval);
    otpTimerInterval = setInterval(() => {
      const diff = Math.max(0, otpExpires - Date.now());
      const sec = Math.ceil(diff / 1000);
      const ss = String(sec % 60).padStart(2, "0");
      otpTimer.textContent = `00:${ss}`;
      
      if (diff <= 0) {
        clearInterval(otpTimerInterval);
        otpStatusMessage.textContent = "OTP expired. Resend or try again.";
        otpStatusMessage.style.color = "red";
        resendOtpBtn.disabled = false;
        // Server side OTP should also be invalidated
      }
    }, 500);
  }

  function handleSendOtpAPI(mobile) {
    // --- API CALL: SEND OTP FOR MOBILE ---
    fetch('/api/signup_send_otp.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: mobile })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            otpVerificationSection.style.display = 'block';
            sendOtpBtn.style.display = 'none';
            otpStatusMessage.textContent = `✅ OTP sent to ${mobile}.`;
            otpStatusMessage.style.color = "limegreen";
            startOtpTimer();
        } else {
            alert(data.message || "❌ OTP could not be sent. Mobile already registered?");
        }
    })
    .catch(error => {
        console.error('Send OTP API error:', error);
        alert('An unexpected error occurred.');
    });
  }

  sendOtpBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const mobile = mobileInput.value.trim();
      
      if (!mobileRegex.test(mobile)) {
          alert("Please enter a valid 10-digit mobile number.");
          return;
      }
      handleSendOtpAPI(mobile);
  });

  resendOtpBtn.addEventListener('click', () => {
      const mobile = mobileInput.value.trim();
      if (!mobileRegex.test(mobile)) return;
      handleSendOtpAPI(mobile);
  });

  // --- OTP VERIFICATION LOGIC ---
  verifyOtpBtn.addEventListener('click', () => {
      const entered = otpInput.value.trim();
      const mobile = mobileInput.value.trim();
      
      if (!entered || !mobileRegex.test(mobile)) {
          alert("Enter OTP and a valid mobile number.");
          return;
      }
      
      // --- API CALL: VERIFY OTP ---
      fetch('/api/signup_verify_otp.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mobile: mobile, otp: entered })
      })
      .then(response => response.json())
      .then(data => {
          if (data.status === 'success') {
              isOtpVerified = true;
              clearInterval(otpTimerInterval);
              otpStatusMessage.textContent = "✅ Mobile number verified!";
              otpStatusMessage.style.color = "limegreen";
              otpInput.disabled = true;
              verifyOtpBtn.disabled = true;
              signupFinalBtn.disabled = false; // ENABLE FINAL SIGNUP BUTTON
              alert("Mobile verified. You can now complete your registration.");
          } else {
              otpStatusMessage.textContent = data.message || "❌ Invalid OTP. Try again.";
              otpStatusMessage.style.color = "red";
          }
      })
      .catch(error => {
          console.error('Verify OTP API error:', error);
          alert('An unexpected error occurred during verification.');
      });
  });


  // --- INPUT VALIDATION AND FORM SUBMISSION ---
  usernameInput.addEventListener("input", () => {
    // Local validation for format
    const value = usernameInput.value.trim();
    if (!usernameRegex.test(value)) {
      usernameMsg.textContent = "❌ Username 1-15 chars, only letters, numbers, _ allowed";
      usernameMsg.style.color = "red";
      return;
    }
    
    // --- API CALL: CHECK USERNAME AVAILABILITY ---
    fetch(`/api/check_username.php?username=${value}`)
    .then(response => response.json())
    .then(data => {
        if (data.available) {
            usernameMsg.textContent = "✅ Username available";
            usernameMsg.style.color = "limegreen";
        } else {
            usernameMsg.textContent = "❌ Username already taken";
            usernameMsg.style.color = "red";
        }
    })
    .catch(error => {
         console.error('Username check API error:', error);
         usernameMsg.textContent = "⚠️ Check failed. Try again.";
         usernameMsg.style.color = "yellow";
    });
  });

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    if (!isOtpVerified) {
        alert("CRITICAL: Please verify your mobile number first!");
        return;
    }

    const fullname = document.getElementById("fullname").value.trim();
    const username = usernameInput.value.trim();
    const email = document.getElementById("email").value.trim();
    const mobile = mobileInput.value.trim();
    const password = document.getElementById("password").value;

    if (!fullname || !username || !email || !mobile || !password) {
      alert("Please fill all fields!");
      return;
    }
    
    // Final local validations
    if (!usernameRegex.test(username)) { alert("Invalid username. Follow rules."); return; }
    if (!/^[^\s@]+@gmail\.com$/.test(email)) { alert("Please use a valid Gmail address."); return; }
    if (!mobileRegex.test(mobile)) { alert("Mobile must be 10 digits."); return; }
    if (password.length < 6) { alert("Password must be at least 6 characters."); return; }
    
    // --- API CALL: FINAL SIGNUP ---
    fetch('/api/signup_final.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname, username, email, mobile, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert("✅ Account created successfully! Please login.");
            window.location.href = "login.html";
        } else {
            alert(data.message || "❌ Signup failed. Try a different username/email.");
        }
    })
    .catch(error => {
        console.error('Final Signup API error:', error);
        alert('An unexpected error occurred during registration.');
    });
  });
});