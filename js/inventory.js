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
            ${isStaff ? '' : '<th style="text-align: center; width: 160px;">Actions</th>'}
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
        <td style="font-weight: 600; color: var(--slate-600);">${product.productId || "N/A"}</td>
        <td style="font-weight: 600; color: var(--slate-900);">${product.productName || "Unnamed"}</td>
        <td>${product.category || "N/A"}</td>
        <td><span class="badge ${badgeClass}">${stock}</span></td>
        <td style="font-weight: 500;">${minStock}</td>
        <td>${product.unit || "Nos"}</td>
        <td style="font-weight: 700;">₹${rate.toFixed(2)}</td>
        <td>${product.cgst || "9"}%</td>
        <td>${product.sgst || "9"}%</td>
        ${isStaff ? '' : `
        <td style="text-align: center;">
          <button class="btn btn-outline" style="padding: 6px 12px; font-size: 12.5px; border-color: var(--primary); color: var(--primary); margin-right: 6px;" onclick="openEditProductModal('${product.productId}')">Edit</button>
          <button class="btn btn-outline text-danger" style="padding: 6px 12px; font-size: 12.5px; border-color: var(--danger); color: var(--danger);" onclick="deleteProduct('${product.productId}')">Delete</button>
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
        <div class="mobile-card-actions">
          <button class="btn btn-outline btn-sm" style="flex: 1; border-color: var(--primary); color: var(--primary);" onclick="openEditProductModal('${product.productId}')">Edit</button>
          <button class="btn btn-outline text-danger btn-sm" style="flex: 1; border-color: var(--danger); color: var(--danger);" onclick="deleteProduct('${product.productId}')">Delete</button>
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