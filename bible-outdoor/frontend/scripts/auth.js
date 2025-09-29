document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("auth-form");
  const title = document.getElementById("form-title");
  const joinFields = document.getElementById("join-fields");
  const confirmField = document.getElementById("confirm-password-field");
  const toggleText = document.getElementById("form-toggle-text");
  const emailInput = document.getElementById("auth-email");
  const passwordInput = document.getElementById("auth-password");
  const confirmInput = document.getElementById("confirm-password");
  const nameInput = document.getElementById("join-name");
  const submitBtn = document.getElementById("form-submit-btn");
  const messageBox = document.getElementById("form-message");
  const logoutBtn = document.getElementById("logout-btn");
  const welcomeName = document.getElementById("welcome-name");
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const forgotPasswordBtn = document.getElementById("forgot-password-btn");
  const resetModal = document.getElementById("reset-modal");
  const resetForm = document.getElementById("reset-form");
  const resetEmail = document.getElementById("reset-email");
  const sendResetCodeBtn = document.getElementById("send-reset-code-btn");
  const resetCodeInput = document.getElementById("reset-code");
  const newPasswordInput = document.getElementById("new-password");
  const resetPasswordBtn = document.getElementById("reset-password-btn");
  const resetMsg = document.getElementById("reset-msg");
  const closeResetModal = document.getElementById("close-reset-modal");
  const verifyResetCodeBtn = document.getElementById("verify-reset-code-btn");
  const showRegisterBtn = document.getElementById("show-register-btn");
  const closeRegisterBtn = document.getElementById("close-register-btn");
  let isLogin = false;

  // Set your backend API base URL here
  const API_BASE = "https://tbo-qyda.onrender.com";

  // If URL contains #login, force login mode
  if (window.location.hash === "#login") {
    isLogin = true;
    title.textContent = "Login to Your Account";
    joinFields.style.display = "none";
    confirmField.style.display = "none";
    submitBtn.textContent = "Login";
    toggleText.innerHTML = `Don't have an account? <a href="#" id="toggle-link">Join</a>`;
    updateFieldRequirements();
  }

  function updateFieldRequirements() {
    const passwordHint = document.getElementById('password-hint');
    const requirementsDiv = document.getElementById('publicPasswordRequirements');
    const matchDiv = document.getElementById('publicPasswordMatch');
    
    if (isLogin) {
      nameInput.removeAttribute("required");
      confirmInput.removeAttribute("required");
      // Hide password requirements for login
      if (passwordHint) passwordHint.style.display = 'none';
      if (requirementsDiv) requirementsDiv.style.display = 'none';
      if (matchDiv) matchDiv.style.display = 'none';
    } else {
      nameInput.setAttribute("required", "required");
      confirmInput.setAttribute("required", "required");
      // Show password requirements for signup
      if (passwordHint) passwordHint.style.display = 'block';
    }
  }
  updateFieldRequirements();

  // Real-time password validation setup
  setupRealTimeValidation();

  // Use JWT for member authentication
  function setMemberSession(token, member) {
    localStorage.setItem("tbo_member_jwt", token);
    localStorage.setItem("tbo_member", JSON.stringify(member));
  }
  function clearMemberSession() {
    localStorage.removeItem("tbo_member_jwt");
    localStorage.removeItem("tbo_member");
  }
  function getMember() {
    const token = localStorage.getItem("tbo_member_jwt");
    const member = localStorage.getItem("tbo_member");
    return token && member ? JSON.parse(member) : null;
  }

  const showMessage = (text, success = true) => {
    messageBox.textContent = text;
    messageBox.style.display = 'block';
    messageBox.style.background = success ? 'var(--sky)' : '#ffe5e5';
    messageBox.style.color = success ? 'var(--primary)' : '#a94442';
    messageBox.style.border = success ? '1px solid var(--primary)' : '1px solid #f5c6cb';
    setTimeout(() => { messageBox.style.display = 'none'; }, 6000);
  };

  function showWelcome(name) {
    form.style.display = "none";
    logoutBtn.style.display = "inline-block";
    welcomeName.textContent = `${name}`;
    // Hide Join Us button when logged in
    if (showRegisterBtn) {
      showRegisterBtn.style.display = "none";
    }
  }

  // Handle logout
  logoutBtn.addEventListener("click", function () {
    clearMemberSession();
    logoutBtn.style.display = "none";
    welcomeName.textContent = "";
    form.style.display = "none";
    if (showRegisterBtn) {
      showRegisterBtn.style.display = "inline-block";
    }
  });

  // Toggle between login and register
  form.addEventListener("click", function(e) {
    if (e.target && e.target.matches("#toggle-link")) {
      e.preventDefault();
      isLogin = !isLogin;
      title.textContent = isLogin ? "Login to Your Account" : "Join Our Community";
      joinFields.style.display = isLogin ? "none" : "block";
      confirmField.style.display = isLogin ? "none" : "block";
      submitBtn.textContent = isLogin ? "Login" : "Join Us";
      toggleText.innerHTML = isLogin
        ? `Don't have an account? <a href=\"#\" id=\"toggle-link\">Join</a>`
        : `Already a member? <a href=\"#\" id=\"toggle-link\">Login</a>`;
      updateFieldRequirements();
      form.reset();
      messageBox.style.display = 'none';
      updateForgotPasswordLink();
      
      // Hide password requirements when switching to login
      const requirementsDiv = document.getElementById('publicPasswordRequirements');
      const matchDiv = document.getElementById('publicPasswordMatch');
      if (isLogin) {
        if (requirementsDiv) requirementsDiv.style.display = 'none';
        if (matchDiv) matchDiv.style.display = 'none';
      }
    }
  });

  // Show/hide forgot password link based on mode
  function updateForgotPasswordLink() {
    forgotPasswordLink.style.display = isLogin ? "block" : "none";
  }
  updateForgotPasswordLink();

  // Helper to show/hide button loader
  function showButtonLoader(btn, text) {
    if (!btn) return;
    btn.disabled = true;
    btn.classList.add('loading');
    btn._oldText = btn.innerHTML;
    btn.innerHTML = text;
  }
  function hideButtonLoader(btn) {
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove('loading');
    if (btn._oldText) btn.innerHTML = btn._oldText;
  }
  function showSuccessLoader(btn, text) {
    if (!btn) return;
    btn.innerHTML = `✅ ${text}`;
  }

  // Account creation and login (SECURE, BACKEND)
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const pass = passwordInput.value.trim();
    if (isLogin) {
      if (!email || !pass) return showMessage("Enter both email and password.", false);
      showButtonLoader(submitBtn, "Logging in...");
      try {
        const res = await fetch(`${API_BASE}/api/members/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: pass })
        });
        const data = await res.json();
        if (!data.token) {
          // If not verified, show verification modal and do not show message box
          if (data.message && /not verified|verify your email/i.test(data.message)) {
            showVerifyModal(email);
            return; // Do not show the message box
          }
          return showMessage(data.message || "Login failed", false);
        }
        setMemberSession(data.token, data.member);
        showSuccessLoader(submitBtn, "Success! Welcome back!");
        showMessage("✅ Login successful. Welcome back, " + data.member.name + "!");
        form.reset();
        setTimeout(() => showWelcome(data.member.name), 1200);
      } catch (err) {
        showMessage("Server error. Please try again.", false);
      } finally {
        hideButtonLoader(submitBtn);
      }
    } else {
      const name = nameInput.value.trim();
      const confirmPass = confirmInput.value.trim();
      // Password requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
      const passwordRequirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
      if (!name || !email || !pass || !confirmPass) return showMessage("Please fill out all fields.", false);
      if (!passwordRequirements.test(pass)) return showMessage("Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.", false);
      if (pass !== confirmPass) return showMessage("Passwords do not match!", false);
      showButtonLoader(submitBtn, "Creating account...");
      try {
        const res = await fetch(`${API_BASE}/api/members/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password: pass })
        });
        const data = await res.json();
        if (!data.message) {
          hideButtonLoader(submitBtn);
          return showMessage(data.message || "Registration failed", false);
        }
        
        // Show success state
        showSuccessLoader(submitBtn, "Account created! Check email...");
        
        // If not verified, show verification modal
        if (data.message && /not verified|verify your email/i.test(data.message)) {
          showVerifyModal(email);
        } else {
          // Show custom verification modal (normal flow)
          showVerifyModal(email);
        }
        form.reset();
        isLogin = true;
        title.textContent = "Login to Your Account";
        joinFields.style.display = "none";
        confirmField.style.display = "none";
        submitBtn.textContent = "Login";
        toggleText.innerHTML = `Don't have an account? <a href=\"#\" id=\"toggle-link\">Join</a>`;
        updateFieldRequirements();
      } catch (err) {
        showMessage("Server error. Please try again.", false);
      } finally {
        hideButtonLoader(submitBtn);
      }
    }
  });

  // Custom verification modal logic
  function showVerifyModal(email) {
    const modal = document.getElementById("verify-modal");
    const form = document.getElementById("verify-form");
    const codeInput = document.getElementById("verify-code");
    const msgBox = document.getElementById("verify-msg");
    const closeBtn = document.getElementById("close-verify-modal");
    const resendBtn = document.getElementById("resend-code-btn");
    const timerSpan = document.getElementById("resend-timer");
    let countdown = 60;
    let timer;
    function startCountdown() {
      resendBtn.disabled = true;
      timerSpan.textContent = `(${countdown}s)`;
      timer = setInterval(() => {
        countdown--;
        timerSpan.textContent = `(${countdown}s)`;
        if (countdown <= 0) {
          clearInterval(timer);
          resendBtn.disabled = false;
          timerSpan.textContent = '';
        }
      }, 1000);
    }
    startCountdown();
    msgBox.style.display = "none";
    codeInput.value = "";
    modal.style.display = "flex";
    form.onsubmit = async function(e) {
      e.preventDefault();
      const code = codeInput.value.trim();
      msgBox.style.display = "none";
      if (!code.match(/^\d{6}$/)) {
        msgBox.textContent = "Please enter the 6-digit code.";
        msgBox.style.display = "block";
        msgBox.style.color = "#c0392b";
        return;
      }
      const verifyBtn = form.querySelector('button[type="submit"]');
      showButtonLoader(verifyBtn, "Verify");
      try {
        const res = await fetch(`${API_BASE}/api/members/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code })
        });
        const data = await res.json();
        if (res.ok) {
          msgBox.textContent = "✅ Email verified! You can now log in.";
          msgBox.style.color = "var(--primary)";
          msgBox.style.display = "block";
          setTimeout(() => { modal.style.display = "none"; }, 1200);
        } else {
          msgBox.textContent = data.message || "Verification failed.";
          msgBox.style.color = "#c0392b";
          msgBox.style.display = "block";
        }
      } catch {
        msgBox.textContent = "Server error. Please try again.";
        msgBox.style.color = "#c0392b";
        msgBox.style.display = "block";
      } finally {
        hideButtonLoader(verifyBtn);
      }
    };
    resendBtn.onclick = async function() {
      if (resendBtn.disabled) return;
      resendBtn.disabled = true;
      countdown = 60;
      startCountdown();
      msgBox.style.display = "none";
      showButtonLoader(resendBtn, "Resend Code");
      try {
        const res = await fetch(`${API_BASE}/api/members/resend-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
          msgBox.textContent = "A new code has been sent to your email.";
          msgBox.style.color = "var(--primary)";
          msgBox.style.display = "block";
        } else {
          msgBox.textContent = data.message || "Failed to resend code.";
          msgBox.style.color = "#c0392b";
          msgBox.style.display = "block";
        }
      } catch {
        msgBox.textContent = "Server error. Please try again.";
        msgBox.style.color = "#c0392b";
        msgBox.style.display = "block";
      } finally {
        hideButtonLoader(resendBtn);
      }
    };
    closeBtn.onclick = function() {
      modal.style.display = "none";
      clearInterval(timer);
    };
  }

  // Support multiple reset modals (for duplicate IDs)
  const resetModals = [
    document.getElementById("reset-modal"),
    document.getElementById("reset-modal-2")
  ].filter(Boolean);
  const resetForms = [
    document.getElementById("reset-form"),
    document.getElementById("reset-form-2")
  ].filter(Boolean);
  const resetEmails = [
    document.getElementById("reset-email"),
    document.getElementById("reset-email-2")
  ].filter(Boolean);
  const sendResetCodeBtns = [
    document.getElementById("send-reset-code-btn"),
    document.getElementById("send-reset-code-btn-2")
  ].filter(Boolean);
  const resetCodeInputs = [
    document.getElementById("reset-code"),
    document.getElementById("reset-code-2")
  ].filter(Boolean);
  const newPasswordInputs = [
    document.getElementById("new-password"),
    document.getElementById("new-password-2")
  ].filter(Boolean);
  const resetPasswordBtns = [
    document.getElementById("reset-password-btn"),
    document.getElementById("reset-password-btn-2")
  ].filter(Boolean);
  const resetMsgs = [
    document.getElementById("reset-msg"),
    document.getElementById("reset-msg-2")
  ].filter(Boolean);
  const closeResetModals = [
    document.getElementById("close-reset-modal")
  ].filter(Boolean);
  const verifyResetCodeBtns = [
    document.getElementById("verify-reset-code-btn"),
    document.getElementById("verify-reset-code-btn-2")
  ].filter(Boolean);

  // Show reset modal
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener("click", function(e) {
      e.preventDefault();
      resetForms.forEach(f => f.reset());
      resetMsgs.forEach(m => { m.style.display = "none"; });
      resetCodeInputs.forEach(i => { i.style.display = "none"; i.disabled = false; });
      verifyResetCodeBtns.forEach(b => { b.style.display = "none"; b.disabled = false; });
      newPasswordInputs.forEach(i => { i.style.display = "none"; });
      resetPasswordBtns.forEach(b => { b.style.display = "none"; });
      sendResetCodeBtns.forEach(b => { b.style.display = "block"; b.disabled = false; });
      resetEmails.forEach(e => { e.disabled = false; });
      resetModals.forEach(m => { m.style.display = "flex"; });
    });
  }

  // Close reset modal
  closeResetModals.forEach(btn => {
    btn.addEventListener("click", function() {
      resetModals.forEach(m => { m.style.display = "none"; });
    });
  });

  // Send reset code
  sendResetCodeBtns.forEach((btn, idx) => {
    btn.addEventListener("click", async function(e) {
      e.preventDefault();
      const email = resetEmails[idx].value.trim().toLowerCase();
      if (!email) {
        resetMsgs[idx].textContent = "Enter your email.";
        resetMsgs[idx].style.display = "block";
        resetMsgs[idx].style.color = "#c0392b";
        return;
      }
      showButtonLoader(btn, "Sending code...");
      btn.disabled = true;
      resetMsgs[idx].style.display = "none";
      try {
        const res = await fetch(`${API_BASE}/api/members/send-reset-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
          resetMsgs[idx].textContent = "A reset code has been sent to your email.";
          resetMsgs[idx].style.color = "var(--primary)";
          resetMsgs[idx].style.display = "block";
          resetEmails[idx].disabled = true;
          btn.style.display = "none";
          resetCodeInputs[idx].style.display = "block";
          verifyResetCodeBtns[idx].style.display = "block";
          newPasswordInputs[idx].style.display = "none";
          resetPasswordBtns[idx].style.display = "none";
        } else {
          resetMsgs[idx].textContent = data.message || "Failed to send code.";
          resetMsgs[idx].style.color = "#c0392b";
          resetMsgs[idx].style.display = "block";
          btn.disabled = false;
        }
      } catch {
        resetMsgs[idx].textContent = "Server error. Please try again.";
        resetMsgs[idx].style.color = "#c0392b";
        resetMsgs[idx].style.display = "block";
        btn.disabled = false;
      } finally {
        hideButtonLoader(btn);
      }
    });
  });

  // Verify reset code
  verifyResetCodeBtns.forEach((btn, idx) => {
    btn.addEventListener("click", async function(e) {
      e.preventDefault();
      const email = resetEmails[idx].value.trim().toLowerCase();
      const code = resetCodeInputs[idx].value.trim();
      if (!code.match(/^\d{6}$/)) {
        resetMsgs[idx].textContent = "Enter the 6-digit code.";
        resetMsgs[idx].style.display = "block";
        resetMsgs[idx].style.color = "#c0392b";
        return;
      }
      showButtonLoader(btn, "Verifying...");
      btn.disabled = true;
      try {
        const res = await fetch(`${API_BASE}/api/members/verify-reset-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code })
        });
        const data = await res.json();
        if (res.ok) {
          resetMsgs[idx].textContent = "Code verified. Enter your new password.";
          resetMsgs[idx].style.color = "var(--primary)";
          resetMsgs[idx].style.display = "block";
          resetCodeInputs[idx].disabled = true;
          btn.style.display = "none";
          newPasswordInputs[idx].style.display = "block";
          resetPasswordBtns[idx].style.display = "block";
        } else {
          resetMsgs[idx].textContent = data.message || "Invalid code.";
          resetMsgs[idx].style.color = "#c0392b";
          resetMsgs[idx].style.display = "block";
          btn.disabled = false;
        }
      } catch {
        resetMsgs[idx].textContent = "Server error. Please try again.";
        resetMsgs[idx].style.color = "#c0392b";
        resetMsgs[idx].style.display = "block";
        btn.disabled = false;
      } finally {
        hideButtonLoader(btn);
      }
    });
  });

  // Handle reset form (reset password only)
  resetForms.forEach((form, idx) => {
    form.addEventListener("submit", async function(e) {
      e.preventDefault();
      const email = resetEmails[idx].value.trim().toLowerCase();
      const code = resetCodeInputs[idx].value.trim();
      const newPass = newPasswordInputs[idx].value.trim();
      // Use same password requirements as registration
      const passwordRequirements = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
      if (!passwordRequirements.test(newPass)) {
        resetMsgs[idx].textContent = "Password must be at least 8 characters, include uppercase, lowercase, a number, and a special character.";
        resetMsgs[idx].style.display = "block";
        resetMsgs[idx].style.color = "#c0392b";
        return;
      }
      showButtonLoader(resetPasswordBtns[idx], "Resetting password...");
      try {
        const res = await fetch(`${API_BASE}/api/members/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, newPassword: newPass })
        });
        const data = await res.json();
        if (res.ok) {
          showSuccessLoader(resetPasswordBtns[idx], "Success! Password reset!");
          resetMsgs[idx].textContent = "✅ Password reset! You can now log in.";
          resetMsgs[idx].style.color = "var(--primary)";
          resetMsgs[idx].style.display = "block";
          setTimeout(() => { resetModals[idx].style.display = "none"; }, 1500);
        } else {
          resetMsgs[idx].textContent = data.message || "Failed to reset password.";
          resetMsgs[idx].style.color = "#c0392b";
          resetMsgs[idx].style.display = "block";
        }
      } catch {
        resetMsgs[idx].textContent = "Server error. Please try again.";
        resetMsgs[idx].style.color = "#c0392b";
        resetMsgs[idx].style.display = "block";
      } finally {
        hideButtonLoader(resetPasswordBtns[idx]);
      }
    });
  });

  // On page load, check for JWT and fetch user info
  async function checkAuth() {
    const member = getMember();
    if (member) {
      showWelcome(member.name);
    } else {
      clearMemberSession();
    }
  }
  checkAuth();

  // Hide form by default
  form.style.display = "none";
  // Show form when 'Join Us' is clicked
  if (showRegisterBtn) {
    showRegisterBtn.addEventListener("click", function () {
      form.style.display = "block";
      showRegisterBtn.style.display = "none";
    });
  }
  // Hide form when close button is clicked
  if (closeRegisterBtn) {
    closeRegisterBtn.addEventListener("click", function () {
      form.style.display = "none";
      showRegisterBtn.style.display = "inline-block";
    });
  }
  // Hide form and show button on page reload
  window.addEventListener("beforeunload", function () {
    form.style.display = "none";
    showRegisterBtn.style.display = "inline-block";
  });

  // Real-time password validation function
  function setupRealTimeValidation() {
    const authPasswordInput = document.getElementById('auth-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const passwordHint = document.getElementById('password-hint');
    
    if (!authPasswordInput || !confirmPasswordInput || !passwordHint) return;

    // Create requirements container dynamically
    const requirementsDiv = document.createElement('div');
    requirementsDiv.className = 'password-requirements';
    requirementsDiv.id = 'publicPasswordRequirements';
    requirementsDiv.style.display = 'none';
    requirementsDiv.innerHTML = `
      <h4>Password Requirements:</h4>
      <div class="requirement invalid" id="public-req-length">
        <span class="requirement-icon"></span>
        At least 8 characters
      </div>
      <div class="requirement invalid" id="public-req-uppercase">
        <span class="requirement-icon"></span>
        One uppercase letter
      </div>
      <div class="requirement invalid" id="public-req-lowercase">
        <span class="requirement-icon"></span>
        One lowercase letter
      </div>
      <div class="requirement invalid" id="public-req-number">
        <span class="requirement-icon"></span>
        One number
      </div>
      <div class="requirement invalid" id="public-req-special">
        <span class="requirement-icon"></span>
        One special character
      </div>
    `;

    // Create password match indicator
    const matchDiv = document.createElement('div');
    matchDiv.className = 'password-match invalid';
    matchDiv.id = 'publicPasswordMatch';
    matchDiv.style.display = 'none';
    matchDiv.innerHTML = `
      <span class="requirement-icon"></span>
      <span id="publicMatchText">Passwords do not match</span>
    `;

    // Insert after password hint
    passwordHint.insertAdjacentElement('afterend', requirementsDiv);
    
    // Insert after confirm password field
    const confirmField = document.getElementById('confirm-password-field');
    if (confirmField) {
      confirmField.insertAdjacentElement('afterend', matchDiv);
    }

    // Validation functions
    function validatePasswordRequirements(password) {
      const requirements = {
        'public-req-length': password.length >= 8,
        'public-req-uppercase': /[A-Z]/.test(password),
        'public-req-lowercase': /[a-z]/.test(password),
        'public-req-number': /\d/.test(password),
        'public-req-special': /[^A-Za-z\d]/.test(password)
      };

      Object.keys(requirements).forEach(reqId => {
        const element = document.getElementById(reqId);
        if (element) {
          element.className = requirements[reqId] ? 'requirement valid' : 'requirement invalid';
        }
      });

      return Object.values(requirements).every(Boolean);
    }

    function validatePasswordMatch() {
      const newPass = authPasswordInput.value;
      const confirmPass = confirmPasswordInput.value;
      const matchText = document.getElementById('publicMatchText');
      
      if (confirmPass === '') {
        matchDiv.style.display = 'none';
        return false;
      }

      matchDiv.style.display = 'flex';
      
      if (newPass === confirmPass) {
        matchDiv.className = 'password-match valid';
        if (matchText) matchText.textContent = 'Passwords match';
        return true;
      } else {
        matchDiv.className = 'password-match invalid';
        if (matchText) matchText.textContent = 'Passwords do not match';
        return false;
      }
    }

    // Event listeners for real-time validation
    authPasswordInput.addEventListener('input', function() {
      const password = this.value;
      
      // Only show requirements during signup mode
      if (!isLogin) {
        if (password === '') {
          requirementsDiv.style.display = 'none';
        } else {
          requirementsDiv.style.display = 'block';
          validatePasswordRequirements(password);
        }
        
        // Also check password match if confirm field has content
        if (confirmPasswordInput.value !== '') {
          validatePasswordMatch();
        }
      }
    });

    confirmPasswordInput.addEventListener('input', function() {
      // Only validate password match during signup mode
      if (!isLogin) {
        validatePasswordMatch();
      }
    });

    // Update the form validation to use real-time results
    const originalFormValidation = form.onsubmit;
    form.addEventListener('submit', function(e) {
      if (!isLogin) {
        const password = authPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Use real-time validation results
        const requirementsMet = validatePasswordRequirements(password);
        const passwordsMatch = validatePasswordMatch();
        
        if (!requirementsMet) {
          e.preventDefault();
          showMessage('Please meet all password requirements.', false);
          return false;
        }
        
        if (!passwordsMatch) {
          e.preventDefault();
          showMessage('Passwords do not match.', false);
          return false;
        }
      }
    });
  }
});
