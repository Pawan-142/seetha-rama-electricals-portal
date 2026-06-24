const API_URL = "https://script.google.com/macros/s/AKfycbyOcHY1cBhOtfGhyKlV02ow6vBmMSTOtPtbNj_SX-QtLwdkDlHMEx_IkIQdKlrTpnI/exec";

// Global SPA Cache Layer to speed up read requests
window.sreCache = {
  inventory: null,
  customers: null,
  sales: null,
  users: null,
  dashboard: null
};

// Auto-hydrate cache from localStorage on load
for (let key in window.sreCache) {
  try {
    const cached = localStorage.getItem("sre_cache_" + key);
    if (cached) {
      window.sreCache[key] = JSON.parse(cached);
    }
  } catch(e) {
    console.warn("Error hydrating cache for " + key, e);
  }
}

// Trigger background sync on startup if online
window.addEventListener('load', () => {
  triggerBackgroundSync();
});

function showSyncingIndicator() {
  let bar = document.getElementById("sre-sync-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "sre-sync-bar";
    bar.className = "sre-sync-bar";
    document.body.appendChild(bar);
  }
  bar.style.transform = "translateX(0)";
  bar.classList.add("syncing");
}

function hideSyncingIndicator() {
  const bar = document.getElementById("sre-sync-bar");
  if (bar) {
    bar.classList.remove("syncing");
    bar.style.transform = "translateX(100%)";
    setTimeout(() => {
      bar.style.transform = "translateX(-100%)";
    }, 400);
  }
}

async function triggerBackgroundSync() {
  try {
    showSyncingIndicator();
    const response = await fetch(API_URL + "?action=sync");
    const result = await response.json();
    if (result && result.success) {
      // Update all caches
      for (let key in window.sreCache) {
        if (result[key]) {
          const freshData = result[key];
          const hasChanged = JSON.stringify(window.sreCache[key]) !== JSON.stringify(freshData);
          if (hasChanged) {
            window.sreCache[key] = freshData;
            localStorage.setItem("sre_cache_" + key, JSON.stringify(freshData));
            // Dispatch update event
            document.dispatchEvent(new CustomEvent("sreCacheUpdated", { detail: { action: key } }));
          }
        }
      }
    }
  } catch (err) {
    console.warn("Background sync failed:", err);
  } finally {
    hideSyncingIndicator();
  }
}

// Unified fetch wrapper with in-memory caching and stale-while-revalidate revalidation
async function getCachedData(action, forceRefresh = false) {
  // If forceRefresh or no cache present, load synchronously
  if (forceRefresh || !window.sreCache[action]) {
    try {
      showSyncingIndicator();
      const response = await fetch(API_URL + "?action=" + action);
      const result = await response.json();
      const freshData = Array.isArray(result) ? result : (result.data || result);
      
      window.sreCache[action] = freshData;
      localStorage.setItem("sre_cache_" + action, JSON.stringify(freshData));
      return freshData;
    } catch(err) {
      console.error("fetch failed for " + action, err);
      if (window.sreCache[action]) return window.sreCache[action];
      throw err;
    } finally {
      hideSyncingIndicator();
    }
  }

  // Stale-While-Revalidate: fetch in the background
  showSyncingIndicator();
  fetch(API_URL + "?action=" + action)
    .then(res => res.json())
    .then(result => {
      const freshData = Array.isArray(result) ? result : (result.data || result);
      const hasChanged = JSON.stringify(window.sreCache[action]) !== JSON.stringify(freshData);
      if (hasChanged) {
        window.sreCache[action] = freshData;
        localStorage.setItem("sre_cache_" + action, JSON.stringify(freshData));
        document.dispatchEvent(new CustomEvent("sreCacheUpdated", { detail: { action } }));
      }
    })
    .catch(err => console.warn("Background revalidation failed for " + action, err))
    .finally(() => hideSyncingIndicator());

  return window.sreCache[action];
}

// Helper to clear specific or all caches after write actions (add/edit/delete/invoice save)
function invalidateCache(action = null) {
  if (action) {
    window.sreCache[action] = null;
    localStorage.removeItem("sre_cache_" + action);
    if (action === "sales" || action === "inventory") {
      window.sreCache["dashboard"] = null;
      localStorage.removeItem("sre_cache_dashboard");
    }
  } else {
    for (let key in window.sreCache) {
      window.sreCache[key] = null;
      localStorage.removeItem("sre_cache_" + key);
    }
  }
  // Automatically trigger a background sync to refresh the client data
  triggerBackgroundSync();
}