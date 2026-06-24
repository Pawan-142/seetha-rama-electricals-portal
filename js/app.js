// ==========================================
// SPA APP INITIALIZER & ROUTER
// ==========================================

window.onload = () => {
  const userStr = localStorage.getItem("sre_user");

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      // Validate role to prevent local storage collision issues
      if (user && (user.role === "staff" || user.role === "admin")) {
        document.getElementById("app").style.display = "flex";
        document.getElementById("loginPage").style.display = "none";
        
        configureUIForRole();
        
        if (user.role === "staff") {
          loadInvoice();
        } else {
          loadDashboard();
        }
      } else {
        // Clear collision session
        localStorage.removeItem("sre_user");
        renderLogin();
      }
    } catch(e) {
      localStorage.removeItem("sre_user");
      renderLogin();
    }
  } else {
    // Force login screen
    renderLogin();
  }
};

/**
 * Handles toggling content sections under SPA main shell
 * @param {string} pageId - Target section ID (dashboard, inventory, customers, invoice)
 */
function showPage(pageId) {
  document.querySelectorAll("main section").forEach(sec => {
    sec.style.display = "none";
  });

  const activePage = document.getElementById(pageId);
  if (activePage) {
    activePage.style.display = "block";
  }

  // Auto-scroll main window back to top on transitions
  const mainEl = document.querySelector("main");
  if (mainEl) mainEl.scrollTop = 0;
}

/**
 * Toggles visibility of a password input field
 * @param {string} inputId - Target input element ID
 * @param {HTMLButtonElement} btn - The toggle button element
 */
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    `;
  } else {
    input.type = "password";
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    `;
  }
}

/**
 * Toggles the mobile navigation drawer menu visibility
 */
function toggleMobileMenu() {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    sidebar.classList.toggle("mobile-nav-open");
  }
}