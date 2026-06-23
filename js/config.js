const API_URL = "https://script.google.com/macros/s/AKfycbyOcHY1cBhOtfGhyKlV02ow6vBmMSTOtPtbNj_SX-QtLwdkDlHMEx_IkIQdKlrTpnI/exec";

// Global SPA Cache Layer to speed up read requests
window.sreCache = {
  inventory: null,
  customers: null,
  sales: null,
  users: null,
  dashboard: null
};

// Unified fetch wrapper with in-memory caching
async function getCachedData(action, forceRefresh = false) {
  if (forceRefresh || !window.sreCache[action]) {
    const response = await fetch(API_URL + "?action=" + action);
    const result = await response.json();
    // Google Sheets response can be an array directly or wrapped in a data property
    window.sreCache[action] = Array.isArray(result) ? result : (result.data || result);
  }
  return window.sreCache[action];
}

// Helper to clear specific or all caches after write actions (add/edit/delete/invoice save)
function invalidateCache(action = null) {
  if (action) {
    window.sreCache[action] = null;
    // Clearing sales or inventory also invalidates the compiled dashboard statistics
    if (action === "sales" || action === "inventory") {
      window.sreCache["dashboard"] = null;
    }
  } else {
    // Clear all
    for (let key in window.sreCache) {
      window.sreCache[key] = null;
    }
  }
}