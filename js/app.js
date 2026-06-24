// ==========================================
// SPA APP INITIALIZER & ROUTER
// ==========================================

window.onload = () => {
  initTheme();
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

// Global navigation state tracking
window.isNavigatingViaHistory = false;
window.currentActivePage = "";

/**
 * Handles toggling content sections under SPA main shell
 * @param {string} pageId - Target section ID (dashboard, inventory, customers, invoice)
 */
function showPage(pageId) {
  window.currentActivePage = pageId;

  document.querySelectorAll("main section").forEach(sec => {
    sec.style.display = "none";
  });

  const activePage = document.getElementById(pageId);
  if (activePage) {
    activePage.style.display = "block";
  }

  // Update navigation button active state in sidebar
  document.querySelectorAll(".sidebar button.nav-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  const navBtn = document.getElementById("nav" + pageId.charAt(0).toUpperCase() + pageId.slice(1));
  if (navBtn) {
    navBtn.classList.add("active");
  }

  // Push to history ONLY if we are not navigating via history popstate
  if (!window.isNavigatingViaHistory) {
    if (!history.state || history.state.pageId !== pageId) {
      history.pushState({ pageId }, "", "#" + pageId);
    }
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

// History navigation listener (browser back/forward, touchpad swiping, mouse back buttons)
window.addEventListener("popstate", (event) => {
  // If the invoice preview page is open, close it first and prevent navigating back
  const invoicePreview = document.getElementById("invoiceContainer");
  if (invoicePreview && invoicePreview.style.display === "block") {
    if (typeof closeInvoicePreview === "function") {
      closeInvoicePreview();
    }
    // Re-push current state to maintain browser history integrity
    history.pushState({ pageId: window.currentActivePage || "dashboard" }, "", "#" + (window.currentActivePage || "dashboard"));
    return;
  }

  if (event.state && event.state.pageId) {
    const pageId = event.state.pageId;
    window.isNavigatingViaHistory = true;
    
    switch(pageId) {
      case "dashboard":
        if (typeof loadDashboard === "function") loadDashboard();
        break;
      case "inventory":
        if (typeof loadInventory === "function") loadInventory();
        break;
      case "customers":
        if (typeof loadCustomers === "function") loadCustomers();
        break;
      case "invoice":
        if (typeof loadInvoice === "function") loadInvoice();
        break;
      case "sales":
        if (typeof loadSales === "function") loadSales();
        break;
      case "users":
        if (typeof loadUsers === "function") loadUsers();
        break;
    }
    
    window.isNavigatingViaHistory = false;
  }
});

// Escape key press to close modals & active overlays
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    // 1. If invoice preview is open, close it
    const invoicePreview = document.getElementById("invoiceContainer");
    if (invoicePreview && invoicePreview.style.display === "block") {
      if (typeof closeInvoicePreview === "function") closeInvoicePreview();
      return;
    }

    // 2. Check for active modal overlays
    const activeModals = document.querySelectorAll(".modal-overlay.active");
    if (activeModals.length > 0) {
      activeModals.forEach(modal => {
        const id = modal.id;
        if (id === "productModal" && typeof closeProductModal === "function") {
          closeProductModal();
        } else if (id === "customerModal" && typeof closeCustomerModal === "function") {
          closeCustomerModal();
        } else if (id === "userModal" && typeof closeUserModal === "function") {
          closeUserModal();
        } else if (id === "changePasswordModal" && typeof closeChangePasswordModal === "function") {
          closeChangePasswordModal();
        } else {
          modal.classList.remove("active");
        }
      });
    }
  }
});

// Theme Mode Toggle (Light/Dark)
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-theme");
  localStorage.setItem("sre_theme", isDark ? "dark" : "light");
  updateThemeUI(isDark);
  if (typeof updateChartsTheme === "function") {
    updateChartsTheme();
  }
}

function updateThemeUI(isDark) {
  document.querySelectorAll(".themeIconSun").forEach(el => {
    el.style.display = isDark ? "block" : "none";
  });
  document.querySelectorAll(".themeIconMoon").forEach(el => {
    el.style.display = isDark ? "none" : "block";
  });
  document.querySelectorAll(".themeText").forEach(el => {
    el.textContent = isDark ? "Light Mode" : "Dark Mode";
  });
}

// Initialize theme on load
function initTheme() {
  const savedTheme = localStorage.getItem("sre_theme");
  const isDark = savedTheme === "dark";
  if (isDark) {
    document.body.classList.add("dark-theme");
  } else {
    document.body.classList.remove("dark-theme");
  }
  setTimeout(() => {
    updateThemeUI(isDark);
  }, 50); // Let DOM elements load
}