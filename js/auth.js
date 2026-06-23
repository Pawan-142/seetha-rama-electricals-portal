// ==========================================
// AUTHENTICATION FLOW
// ==========================================

function renderLogin() {
  document.getElementById("loginPage").style.display = "block";
  document.getElementById("loginPage").innerHTML = `
    <div class="login-wrapper" id="loginWrapper">
      <!-- Animated Particles -->
      <div class="login-particles" id="loginParticles"></div>

      <!-- ==================== LEFT PANEL ==================== -->
      <div class="login-left">
        <!-- Top Content Area -->
        <div class="login-left-top">
          <!-- SR Logo -->
          <div class="sre-logo-group">
            <div class="sre-logo-mark">
              <span class="sre-logo-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="rgba(255,255,255,0.9)" stroke="none"/>
                </svg>
              </span>
            </div>
            <div class="sre-logo-title-wrap">
              <div class="sre-logo-title">SEETHA RAMA</div>
              <div class="sre-logo-subtitle">ELECTRICALS</div>
            </div>
          </div>

          <!-- Category Tabs -->
          <div class="sre-cat-tabs">
            <div class="sre-cat-tab sre-cat-active" id="catElectrical">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span>Electrical</span>
            </div>
            <span class="sre-cat-sep">|</span>
            <div class="sre-cat-tab" id="catPlumbing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 20V10m0 0c0-4 3-7 6-7s6 3 6 7m-12 0h12m0 0v10M10 14v2m4-2v2"/></svg>
              <span>Plumbing</span>
            </div>
            <span class="sre-cat-sep">|</span>
            <div class="sre-cat-tab" id="catHardware">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              <span>Hardware</span>
            </div>
            <span class="sre-cat-sep">|</span>
            <div class="sre-cat-tab" id="catLighting">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <span>Lighting</span>
            </div>
          </div>
        </div>

        <!-- Product Showcase Image -->
        <div class="sre-showcase" id="sreShowcase">
          <img src="assets/product-showcase.png"
               alt="Electrical, Plumbing &amp; Hardware Products"
               class="sre-showcase-img" id="showcaseImg">
          <div class="sre-showcase-overlay"></div>
          <div class="sre-showcase-glow sre-glow-top"></div>
          <div class="sre-showcase-glow sre-glow-bottom"></div>

          <!-- Feature badges overlaid at bottom of image -->
          <div class="sre-features-row">
            <div class="sre-feature">
              <span class="sre-feature-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </span>
              <strong>Trusted Brands</strong>
              <small>100% Genuine Products</small>
            </div>
            <div class="sre-feature">
              <span class="sre-feature-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <strong>Quality Assured</strong>
              <small>Best Quality Guaranteed</small>
            </div>
            <div class="sre-feature">
              <span class="sre-feature-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </span>
              <strong>Fast Delivery</strong>
              <small>On time, Every time</small>
            </div>
            <div class="sre-feature">
              <span class="sre-feature-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
              </span>
              <strong>Expert Support</strong>
              <small>We're here to help you</small>
            </div>
          </div>
        </div>
      </div>

      <!-- ==================== RIGHT PANEL ==================== -->
      <div class="login-right" id="loginRight">
        <!-- White Login Card -->
        <div class="sre-login-card" id="loginFormCard">
          <!-- House + Lightning Icon -->
          <div class="sre-card-logo">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1565c0" stroke-width="1.8"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
              <path d="M12 8l-2 4h4l-2 4" stroke="#f57c00" stroke-width="1.6" fill="rgba(245,124,0,0.12)"/>
            </svg>
          </div>

          <div class="sre-card-title">Welcome Back!</div>
          <div class="sre-card-sub">Sign in to access your dashboard</div>

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

            <!-- Remember Me + Forgot -->
            <div class="sre-form-row">
              <label class="sre-checkbox">
                <input type="checkbox" checked>
                <span class="sre-checkmark"></span>
                Remember me
              </label>
              <a href="#" class="sre-forgot" onclick="event.preventDefault()">Forgot Password?</a>
            </div>

            <!-- Sign In Button -->
            <button type="submit" id="loginBtn" class="sre-signin-btn">
              <span>Sign In</span>
              <span class="sre-btn-arrow">&rarr;</span>
            </button>
          </form>

          <!-- Divider -->
          <div class="sre-divider">or</div>

          <!-- Secure Admin Access Button -->
          <button class="sre-admin-btn" onclick="document.getElementById('loginBtn').click()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Secure Admin Access
          </button>

          <!-- Info Strip -->
          <div class="sre-info-strip">
            <div class="sre-info-item">
              <span class="sre-info-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </span>
              <div>
                <strong>Secured Data</strong>
                <small>Your data is safe with us</small>
              </div>
            </div>
            <div class="sre-info-item">
              <span class="sre-info-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </span>
              <div>
                <strong>GST Billing</strong>
                <small>Accurate invoices with GST</small>
              </div>
            </div>
            <div class="sre-info-item">
              <span class="sre-info-icon">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                </svg>
              </span>
              <div>
                <strong>Easy Returns</strong>
                <small>Hassle-free return policy</small>
              </div>
            </div>
          </div>

          <!-- Copyright -->
          <div class="sre-copyright-right">&copy; 2026 Seetha Rama Electricals. All rights reserved.</div>
        </div>
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
      localStorage.setItem("user", JSON.stringify(result.user));
      
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
    alert("Connection to the server failed. Please check your network.");
    loginBtn.innerText = "Sign In";
    loginBtn.disabled = false;
  }
}

function logout() {
  localStorage.removeItem("user");
  location.reload();
}

function configureUIForRole() {
  const userStr = localStorage.getItem("user");
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
    alert("New passwords do not match!");
    return;
  }
  
  const submitBtn = event.target.querySelector("button[type='submit']");
  submitBtn.innerText = "Updating...";
  submitBtn.disabled = true;
  
  let username = "";
  try {
    username = JSON.parse(localStorage.getItem("user") || "{}").username;
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
      alert("Password updated successfully!");
      closeChangePasswordModal();
    } else {
      alert(result.message || "Failed to update password.");
    }
  } catch (err) {
    console.error(err);
    alert("Connection error. Password could not be updated.");
  } finally {
    submitBtn.innerText = "Update Password";
    submitBtn.disabled = false;
  }
}