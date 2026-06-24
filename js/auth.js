// ==========================================
// AUTHENTICATION FLOW
// ==========================================

function renderLogin() {
  document.getElementById("loginPage").style.display = "block";
  document.getElementById("loginPage").innerHTML = `
    <div class="login-wrapper" id="loginWrapper">
      <!-- Animated Particles -->
      <div class="login-particles" id="loginParticles"></div>

      <!-- Frosted Glass Login Card -->
      <div class="sre-login-card" id="loginFormCard">
        <!-- Logo -->
        <div class="sre-card-logo">
          <img src="assets/logo.png" alt="SRE Logo">
        </div>

        <div class="sre-card-title">Welcome Back!</div>
        <div class="sre-card-sub">Sign in to your account</div>

        <form onsubmit="handleLoginSubmit(event)" id="loginForm">
          <!-- Username -->
          <label class="sre-field-label" for="username">Username</label>
          <div class="sre-input-wrap">
            <span class="sre-input-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input type="text" id="username" placeholder="Enter username"
                   class="sre-input" required autocomplete="username">
          </div>

          <!-- Password -->
          <label class="sre-field-label" for="password">Password</label>
          <div class="sre-input-wrap">
            <span class="sre-input-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </span>
            <input type="password" id="password" placeholder="Enter password"
                   class="sre-input" required autocomplete="current-password">
            <button type="button" class="sre-eye-btn" onclick="togglePasswordVisibility('password', this)">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            </button>
          </div>

          <!-- Remember Me -->
          <div class="sre-form-row">
            <label class="sre-checkbox">
              <input type="checkbox" id="rememberMe" checked>
              <span class="sre-checkmark"></span>
              Remember me
            </label>
          </div>

          <!-- Sign In Button -->
          <button type="submit" id="loginBtn" class="sre-signin-btn">
            <span>Sign In</span>
            <span class="sre-btn-arrow">&rarr;</span>
          </button>
        </form>

        <!-- Copyright -->
        <div class="sre-copyright-right" style="margin-top: 12px; text-align: center; font-size: 11px; color: var(--slate-400);">&copy; 2026 Seetha Rama Electricals.</div>
      </div>
    </div>
  `;

  // Initialize all interactive features
  _setupLoginInteractions();
}

/* ── Login Interactions Setup ── */
function _setupLoginInteractions() {
  const wrapper = document.getElementById('loginWrapper');
  if (!wrapper) return;

  // Parallax on showcase image via mouse move
  wrapper.addEventListener('mousemove', function(e) {
    const showcase = document.getElementById('showcaseImg');
    if (showcase) {
      const rect = wrapper.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const moveX = (x - 0.5) * 10;
      const moveY = (y - 0.5) * 7;
      showcase.style.transform = 'scale(1.08) translate(' + moveX + 'px, ' + moveY + 'px)';
    }
  });

  wrapper.addEventListener('mouseleave', function() {
    const showcase = document.getElementById('showcaseImg');
    if (showcase) {
      showcase.style.transform = 'scale(1.05) translate(0, 0)';
    }
  });

  // Interactive category tabs
  _setupCategoryTabs();

  // Input focus animations
  _setupInputAnimations();

  // Create ambient particles
  _createLoginParticles();
}

/* ── Interactive Category Tabs ── */
function _setupCategoryTabs() {
  const tabs = document.querySelectorAll('.sre-cat-tab');
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      tabs.forEach(function(t) { t.classList.remove('sre-cat-active'); });
      tab.classList.add('sre-cat-active');
    });
  });
}

/* ── Input Focus Animations ── */
function _setupInputAnimations() {
  const inputs = document.querySelectorAll('.sre-input');
  const formCard = document.getElementById('loginFormCard');

  inputs.forEach(function(input) {
    input.addEventListener('focus', function() {
      if (formCard) formCard.classList.add('sre-form-focused');
    });
    input.addEventListener('blur', function() {
      setTimeout(function() {
        const activeEl = document.activeElement;
        if (!activeEl || !activeEl.classList.contains('sre-input')) {
          if (formCard) formCard.classList.remove('sre-form-focused');
        }
      }, 50);
    });
    input.addEventListener('input', function() {
      if (input.value.length > 0) {
        input.classList.add('sre-input-filled');
      } else {
        input.classList.remove('sre-input-filled');
      }
    });
  });

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const btn = document.getElementById('loginBtn');
        if (btn) {
          btn.classList.add('sre-btn-pressed');
          setTimeout(function() { btn.classList.remove('sre-btn-pressed'); }, 200);
        }
      }
    });
  }
}

/* ── Ambient Particle System ── */
function _createLoginParticles() {
  var container = document.getElementById('loginParticles');
  if (!container) return;

  for (var i = 0; i < 40; i++) {
    var p = document.createElement('div');
    p.className = 'login-particle';
    p.style.left = (Math.random() * 100) + '%';
    p.style.top = (Math.random() * 100) + '%';
    p.style.animationDelay = (Math.random() * 8) + 's';
    p.style.animationDuration = (3 + Math.random() * 5) + 's';
    var size = (1.5 + Math.random() * 3) + 'px';
    p.style.width = size;
    p.style.height = size;
    container.appendChild(p);
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  
  const loginBtn = document.getElementById("loginBtn");
  const usernameVal = document.getElementById("username").value.trim();
  const passwordVal = document.getElementById("password").value.trim();

  loginBtn.innerText = "Signing in...";
  loginBtn.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "login",
        username: usernameVal,
        password: passwordVal
      })
    });

    const result = await response.json();

    if (result.success) {
      localStorage.setItem("sre_user", JSON.stringify(result.user));
      
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("app").style.display = "flex";
      
      configureUIForRole();
      
      if (result.user.role === 'staff') {
        loadInvoice();
      } else {
        loadDashboard();
      }
    } else {
      showToast(result.message || "Invalid login credentials.", "error");
      loginBtn.innerText = "Sign In";
      loginBtn.disabled = false;
    }
  } catch (err) {
    console.error(err);
    showToast("Connection to the server failed. Please check your network.", "error");
    loginBtn.innerText = "Sign In";
    loginBtn.disabled = false;
  }
}

function logout() {
  localStorage.removeItem("sre_user");
  location.reload();
}

function configureUIForRole() {
  const userStr = localStorage.getItem("sre_user");
  if (!userStr) return;
  
  try {
    const user = JSON.parse(userStr);
    const isStaff = user.role === 'staff';
    
    // Hide or show sidebar items
    const navDashboard = document.getElementById("navDashboard");
    const navCustomers = document.getElementById("navCustomers");
    const navSales     = document.getElementById("navSales");
    const navUsers     = document.getElementById("navUsers");
    
    if (navDashboard) navDashboard.style.display = isStaff ? "none" : "flex";
    if (navCustomers) navCustomers.style.display = isStaff ? "none" : "flex";
    if (navSales)     navSales.style.display     = isStaff ? "none" : "flex";
    if (navUsers)     navUsers.style.display     = isStaff ? "none" : "flex";
    
    // Set a profile/user name label in the sidebar footer
    const footer = document.querySelector(".nav-footer");
    if (footer) {
      let profileEl = document.getElementById("userProfileDisplay");
      if (!profileEl) {
        profileEl = document.createElement("div");
        profileEl.id = "userProfileDisplay";
        profileEl.className = "user-profile-display";
        footer.insertBefore(profileEl, footer.firstChild);
      }
      profileEl.innerHTML = `
        <span>👤</span>
        <div style="flex: 1; min-width: 0;">
          <div class="user-profile-name">${user.name || user.username}</div>
          <div class="user-profile-role">${user.role}</div>
        </div>
        <button onclick="openChangePasswordModal()" style="background: transparent; border: none; cursor: pointer; color: var(--slate-400); padding: 4px; display: flex; align-items: center; justify-content: center;" title="Change Password">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </button>
      `;
    }
  } catch(e) {
    console.error("configureUIForRole error", e);
  }
}

function openChangePasswordModal() {
  document.getElementById("changePasswordForm").reset();
  document.getElementById("changePasswordModal").classList.add("active");
}

function closeChangePasswordModal() {
  document.getElementById("changePasswordModal").classList.remove("active");
}

async function saveChangePasswordModal(event) {
  event.preventDefault();
  
  const current = document.getElementById("cp_current").value;
  const newPass = document.getElementById("cp_new").value;
  const confirmPass = document.getElementById("cp_confirm").value;
  
  if (newPass !== confirmPass) {
    showToast("New passwords do not match!", "warn");
    return;
  }
  
  const submitBtn = event.target.querySelector("button[type='submit']");
  submitBtn.innerText = "Updating...";
  submitBtn.disabled = true;
  
  let username = "";
  try {
    username = JSON.parse(localStorage.getItem("sre_user") || "{}").username;
  } catch(e) {}
  
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "changePassword",
        username: username,
        currentPassword: current,
        newPassword: newPass
      })
    });
    
    const result = await response.json();
    if (result.success) {
      showToast("Password updated successfully!", "success");
      closeChangePasswordModal();
    } else {
      showToast(result.message || "Failed to update password.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Connection error. Password could not be updated.", "error");
  } finally {
    submitBtn.innerText = "Update Password";
    submitBtn.disabled = false;
  }
}