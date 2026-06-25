// ==========================================
// INVENTORY MODULE
// ==========================================

let inventoryEditMode = false;
let currentEditProductId = "";
let allProducts = [];

async function loadInventory() {
  setActiveNav("navInventory");
  showPage("inventory");

  const user = JSON.parse(localStorage.getItem("sre_user") || "{}");
  const isStaff = user.role === 'staff';

  document.getElementById("inventory").innerHTML = `
    <div class="inventory-header">
      <h2 style="margin: 0; font-size: 26px; font-weight: 700;">Inventory Items</h2>
      ${isStaff ? '' : `
      <button class="btn btn-primary" onclick="openProductModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add Product
      </button>
      `}
    </div>

    <!-- Search Input -->
    <div class="card-box mb-4" style="padding: 16px;">
      <input
        type="text"
        id="searchInvInput"
        class="form-control"
        placeholder="Search product by name, category, or ID..."
        onkeyup="searchInventory(this.value)"
      >
    </div>

    <div id="inventoryTable">
      <div style="text-align: center; color: var(--slate-400); padding: 40px;">Loading inventory products...</div>
    </div>
  `;

  await fetchInventory();
}

async function fetchInventory() {
  try {
    const products = await getCachedData("inventory");
    allProducts = products; // Store globally for editing prefill
    
    renderInventory(products);
  } catch (err) {
    console.error(err);
    document.getElementById("inventoryTable").innerHTML = `
      <div style="text-align: center; color: var(--danger); padding: 30px; font-weight: 600;">
        Unable to load products from Google Sheets database.
      </div>
    `;
  }
}

function renderInventory(products) {
  if (products.length === 0) {
    document.getElementById("inventoryTable").innerHTML = `
      <div style="text-align: center; color: var(--slate-500); padding: 40px; font-weight: 500;">
        No products found in the inventory sheet database.
      </div>
    `;
    return;
  }

  const user = JSON.parse(localStorage.getItem("sre_user") || "{}");
  const isStaff = user.role === 'staff';

  // Desktop view HTML (table)
  let desktopHtml = `
    <div class="table-responsive desktop-only-view">
      <table class="table">
        <thead>
          <tr>
            <th>Product ID</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Stock Level</th>
            <th>Min Limit</th>
            <th>Unit</th>
            <th>Base Rate</th>
            <th>CGST %</th>
            <th>SGST %</th>
            ${isStaff ? '' : '<th style="text-align: center; width: 240px;">Actions</th>'}
          </tr>
        </thead>
        <tbody>
  `;

  // Mobile view HTML (cards grid)
  let mobileHtml = `
    <div class="mobile-only-view inventory-cards-grid">
  `;

  products.forEach(product => {
    const stock = Number(product.stock) || 0;
    const rate = Number(product.rate) || 0;
    const minStock = Number(product.minStock) || 10;
    
    // Choose stock badge color
    let badgeClass = "badge-success";
    let trClass = "";
    if (stock <= 0) {
      badgeClass = "badge-danger";
    } else if (stock < minStock) {
      badgeClass = "badge-warning";
    }

    if (stock < minStock) {
      trClass = 'class="low-stock-row"';
    }

    const searchText = (product.productId + ' ' + product.productName + ' ' + (product.category || '')).toLowerCase();

    // Append to desktop table
    desktopHtml += `
      <tr ${trClass} data-search-text="${searchText}">
        <td style="font-weight: 600; color: var(--text-muted);">${product.productId || "N/A"}</td>
        <td style="font-weight: 600; color: var(--text-main);">${product.productName || "Unnamed"}</td>
        <td>${product.category || "N/A"}</td>
        <td><span class="badge ${badgeClass}">${stock}</span></td>
        <td style="font-weight: 500;">${minStock}</td>
        <td>${product.unit || "Nos"}</td>
        <td style="font-weight: 700;">₹${rate.toFixed(2)}</td>
        <td>${product.cgst || "9"}%</td>
        <td>${product.sgst || "9"}%</td>
        ${isStaff ? '' : `
        <td style="text-align: center;">
          <div class="table-actions">
            <button class="btn-action btn-adjust" onclick="openAdjustPriceModal('${product.productId}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              Adjust
            </button>
            <button class="btn-action btn-edit" onclick="openEditProductModal('${product.productId}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
              Edit
            </button>
            <button class="btn-action btn-delete" onclick="deleteProduct('${product.productId}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Delete
            </button>
          </div>
        </td>
        `}
      </tr>
    `;

    // Append to mobile cards
    mobileHtml += `
      <div class="mobile-item-card ${stock < minStock ? 'low-stock-card' : ''}" data-search-text="${searchText}">
        <div class="mobile-card-header">
          <div>
            <span class="mobile-card-id">${product.productId || "N/A"}</span>
            <span class="mobile-card-category">${product.category || "N/A"}</span>
          </div>
          <div>
            <span class="badge ${badgeClass}">Stock: ${stock}</span>
          </div>
        </div>
        <h4 class="mobile-card-title">${product.productName || "Unnamed"}</h4>
        <div class="mobile-card-details">
          <div class="detail-row">
            <span>Base Rate:</span>
            <strong>₹${rate.toFixed(2)}</strong>
          </div>
          <div class="detail-row">
            <span>Tax (CGST/SGST):</span>
            <span>${product.cgst || "9"}% / ${product.sgst || "9"}%</span>
          </div>
          <div class="detail-row">
            <span>Unit:</span>
            <span>${product.unit || "Nos"}</span>
          </div>
          <div class="detail-row">
            <span>Min Limit:</span>
            <span>${minStock}</span>
          </div>
        </div>
        ${isStaff ? '' : `
        <div class="mobile-card-actions" style="flex-wrap: wrap;">
          <button class="btn-action btn-adjust" style="flex: 1; justify-content: center; min-width: 80px;" onclick="openAdjustPriceModal('${product.productId}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            Adjust
          </button>
          <button class="btn-action btn-edit" style="flex: 1; justify-content: center; min-width: 80px;" onclick="openEditProductModal('${product.productId}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
            Edit
          </button>
          <button class="btn-action btn-delete" style="flex: 1; justify-content: center; min-width: 80px;" onclick="deleteProduct('${product.productId}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            Delete
          </button>
        </div>
        `}
      </div>
    `;
  });

  desktopHtml += `
        </tbody>
      </table>
    </div>
  `;

  mobileHtml += `
    </div>
  `;

  document.getElementById("inventoryTable").innerHTML = desktopHtml + mobileHtml;
}

function searchInventory(keyword) {
  const cleanedKeyword = keyword.toLowerCase().trim();

  // Search table rows
  const rows = document.querySelectorAll("#inventoryTable tbody tr");
  rows.forEach(row => {
    const text = row.getAttribute("data-search-text") || row.innerText.toLowerCase();
    row.style.display = text.includes(cleanedKeyword) ? "" : "none";
  });

  // Search mobile cards
  const cards = document.querySelectorAll("#inventoryTable .mobile-item-card");
  cards.forEach(card => {
    const text = card.getAttribute("data-search-text") || card.innerText.toLowerCase();
    card.style.display = text.includes(cleanedKeyword) ? "" : "none";
  });
}

// ==========================================
// MODAL CONTROLLER (PRODUCT INSERTIONS/EDITS)
// ==========================================

function openProductModal() {
  inventoryEditMode = false;
  currentEditProductId = "";
  
  // Reset modal title and button text
  document.querySelector("#productModal .modal-header h3").innerText = "Add New Product";
  document.querySelector("#productModal button[type='submit']").innerText = "Save Product";
  
  document.getElementById("productForm").reset();
  document.getElementById("p_minStock").value = 10;
  document.getElementById("productModal").classList.add("active");
}

function openEditProductModal(productId) {
  inventoryEditMode = true;
  currentEditProductId = productId;

  const product = allProducts.find(p => p.productId === productId);
  if (!product) return;

  // Set modal title and button text
  document.querySelector("#productModal .modal-header h3").innerText = "Edit Product";
  document.querySelector("#productModal button[type='submit']").innerText = "Save Changes";

  // Prefill input fields
  document.getElementById("p_name").value = product.productName || "";
  document.getElementById("p_category").value = product.category || "";
  document.getElementById("p_unit").value = product.unit || "Nos";
  document.getElementById("p_stock").value = product.stock || 0;
  document.getElementById("p_rate").value = product.rate || 0;
  document.getElementById("p_cgst").value = product.cgst || 9;
  document.getElementById("p_sgst").value = product.sgst || 9;
  document.getElementById("p_minStock").value = product.minStock || 10;

  document.getElementById("productModal").classList.add("active");
}

function closeProductModal() {
  document.getElementById("productModal").classList.remove("active");
}

async function saveProductModal(event) {
  event.preventDefault();
  
  const submitBtn = event.target.querySelector("button[type='submit']");
  submitBtn.innerText = inventoryEditMode ? "Updating Product..." : "Saving Product...";
  submitBtn.disabled = true;

  const data = {
    productName: document.getElementById("p_name").value.trim(),
    category: document.getElementById("p_category").value.trim(),
    unit: document.getElementById("p_unit").value.trim(),
    stock: parseFloat(document.getElementById("p_stock").value) || 0,
    rate: parseFloat(document.getElementById("p_rate").value) || 0,
    cgst: parseFloat(document.getElementById("p_cgst").value) || 9,
    sgst: parseFloat(document.getElementById("p_sgst").value) || 9,
    minStock: parseFloat(document.getElementById("p_minStock").value) || 10
  };

  const payload = {
    action: inventoryEditMode ? "editProduct" : "addProduct",
    ...data
  };

  if (inventoryEditMode) {
    payload.productId = currentEditProductId;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      showToast(inventoryEditMode ? "Product updated successfully!" : "Product added successfully!", "success");
      closeProductModal();
      invalidateCache("inventory");
      if (window.productCreatedFromInvoice) {
        window.productCreatedFromInvoice = false;
        if (window.lastActiveProductSelect) {
          window.lastActiveProductSelect.value = result.productId;
        }
        if (typeof fetchAutocompleteData === 'function') {
          await fetchAutocompleteData();
        }
        if (window.lastActiveProductSelect) {
          window.lastActiveProductSelect.dispatchEvent(new Event('change'));
          window.lastActiveProductSelect = null;
        }
      } else {
        await loadInventory();
      }
    } else {
      showToast(result.message || "Failed to save the product details.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Connection error. Could not write to the Sheets API.", "error");
  } finally {
    submitBtn.innerText = inventoryEditMode ? "Save Changes" : "Save Product";
    submitBtn.disabled = false;
  }
}

async function deleteProduct(productId) {
  if (!confirm("Are you sure you want to delete this product? This will permanently remove it from your inventory sheet.")) {
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteProduct",
        productId: productId
      })
    });

    const result = await response.json();

    if (result.success) {
      showToast("Product deleted successfully!", "success");
      invalidateCache("inventory");
      await loadInventory();
    } else {
      showToast(result.message || "Failed to delete the product.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Connection error. Could not delete product.", "error");
  }
}

document.addEventListener("sreCacheUpdated", (e) => {
  if (e.detail.action === "inventory") {
    const inventoryEl = document.getElementById("inventory");
    if (inventoryEl && inventoryEl.style.display === "block") {
      fetchInventory();
    }
  }
});

// ==========================================
// QUICK PRICE ADJUSTMENT CONTROLLERS
// ==========================================

let currentAdjustProductId = "";
let currentAdjustProductRate = 0;

function openAdjustPriceModal(productId) {
  const product = allProducts.find(p => p.productId === productId);
  if (!product) return;

  currentAdjustProductId = productId;
  currentAdjustProductRate = Number(product.rate) || 0;

  document.getElementById("adj_p_name").value = product.productName || "";
  document.getElementById("adj_current_rate_display").innerText = `₹${currentAdjustProductRate.toFixed(2)}`;
  document.getElementById("adj_value").value = "";
  document.getElementById("adj_type").value = "pct_dec";

  updatePriceAdjustmentPreview();
  document.getElementById("adjustPriceModal").classList.add("active");
}

function closeAdjustPriceModal() {
  document.getElementById("adjustPriceModal").classList.remove("active");
}

function updatePriceAdjustmentPreview() {
  const type = document.getElementById("adj_type").value;
  const valInput = document.getElementById("adj_value");
  let value = parseFloat(valInput.value) || 0;

  if (type === "pct_dec" || type === "pct_inc") {
    valInput.max = 100;
    if (value > 100) {
      value = 100;
      valInput.value = 100;
    }
  } else {
    valInput.removeAttribute("max");
  }

  if (value < 0) {
    value = 0;
    valInput.value = 0;
  }

  let newRate = currentAdjustProductRate;

  if (type === "pct_dec") {
    newRate = currentAdjustProductRate * (1 - value / 100);
  } else if (type === "pct_inc") {
    newRate = currentAdjustProductRate * (1 + value / 100);
  } else if (type === "amt_dec") {
    newRate = currentAdjustProductRate - value;
  } else if (type === "amt_inc") {
    newRate = currentAdjustProductRate + value;
  }

  if (newRate < 0) {
    newRate = 0;
  }

  document.getElementById("adj_new_rate_display").innerText = `₹${newRate.toFixed(2)}`;
}

async function savePriceAdjustment(event) {
  event.preventDefault();

  const product = allProducts.find(p => p.productId === currentAdjustProductId);
  if (!product) return;

  const type = document.getElementById("adj_type").value;
  let value = parseFloat(document.getElementById("adj_value").value) || 0;
  if (value <= 0) {
    showToast("Please enter an adjustment value greater than 0.", "error");
    return;
  }

  if ((type === "pct_dec" || type === "pct_inc") && value > 100) {
    value = 100;
  }

  let newRate = currentAdjustProductRate;
  if (type === "pct_dec") {
    newRate = currentAdjustProductRate * (1 - value / 100);
  } else if (type === "pct_inc") {
    newRate = currentAdjustProductRate * (1 + value / 100);
  } else if (type === "amt_dec") {
    newRate = currentAdjustProductRate - value;
  } else if (type === "amt_inc") {
    newRate = currentAdjustProductRate + value;
  }

  if (newRate < 0) newRate = 0;

  const submitBtn = document.getElementById("adj_submit_btn");
  submitBtn.innerText = "Updating...";
  submitBtn.disabled = true;

  const payload = {
    action: "editProduct",
    productId: currentAdjustProductId,
    productName: product.productName,
    category: product.category,
    unit: product.unit,
    stock: Number(product.stock) || 0,
    rate: Number(newRate.toFixed(2)),
    cgst: Number(product.cgst) || 9,
    sgst: Number(product.sgst) || 9,
    minStock: Number(product.minStock) || 10
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      showToast("Price adjusted successfully!", "success");
      closeAdjustPriceModal();
      invalidateCache("inventory");
      await loadInventory();
    } else {
      showToast(result.message || "Failed to adjust price.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Connection error. Could not save adjustment.", "error");
  } finally {
    submitBtn.innerText = "Update Price";
    submitBtn.disabled = false;
  }
}

function applyFormRateAdjustment() {
  const rateInput = document.getElementById("p_rate");
  const currentRate = parseFloat(rateInput.value) || 0;
  if (currentRate <= 0) {
    showToast("Please enter a valid base rate first before adjusting.", "warning");
    return;
  }

  const type = document.getElementById("p_rate_adj_type").value;
  const valInput = document.getElementById("p_rate_adj_val");
  let val = parseFloat(valInput.value) || 0;

  if (val <= 0) {
    showToast("Please enter an adjustment value greater than 0.", "warning");
    return;
  }

  if ((type === "pct_dec" || type === "pct_inc") && val > 100) {
    val = 100;
    valInput.value = 100;
  }

  let newRate = currentRate;
  if (type === "pct_dec") {
    newRate = currentRate * (1 - val / 100);
  } else if (type === "pct_inc") {
    newRate = currentRate * (1 + val / 100);
  } else if (type === "amt_dec") {
    newRate = currentRate - val;
  } else if (type === "amt_inc") {
    newRate = currentRate + val;
  }

  if (newRate < 0) {
    newRate = 0;
  }

  rateInput.value = newRate.toFixed(2);
  valInput.value = "";
  showToast(`Rate adjusted from ₹${currentRate.toFixed(2)} to ₹${newRate.toFixed(2)}!`, "success");
}

function handleFormRateAdjValInput() {
  const type = document.getElementById("p_rate_adj_type").value;
  const valInput = document.getElementById("p_rate_adj_val");
  let val = parseFloat(valInput.value) || 0;

  if (type === "pct_dec" || type === "pct_inc") {
    valInput.max = 100;
    if (val > 100) {
      valInput.value = 100;
    }
  } else {
    valInput.removeAttribute("max");
  }

  if (val < 0) {
    valInput.value = 0;
  }
}