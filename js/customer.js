// ==========================================
// CUSTOMER MODULE CONTROLLER
// ==========================================

let customerEditMode = false;
let currentEditCustomerId = "";
let allCustomers = [];

async function loadCustomers() {
  setActiveNav("navCustomers");
  showPage("customers");

  document.getElementById("customers").innerHTML = `
    <div class="inventory-header">
      <h2 style="margin: 0; font-size: 26px; font-weight: 700;">Customer Database</h2>
      <button class="btn btn-primary" onclick="openCustomerModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        Add Customer
      </button>
    </div>

    <!-- Search Input -->
    <div class="card-box mb-4" style="padding: 16px;">
      <input
        type="text"
        id="searchCustInput"
        class="form-control"
        placeholder="Search customers by name, phone, email, address..."
        onkeyup="searchCustomer(this.value)"
      >
    </div>

    <div id="customerTable">
      <div style="text-align: center; color: var(--slate-400); padding: 40px;">Loading customer accounts...</div>
    </div>
  `;

  await fetchCustomers();
}

async function fetchCustomers() {
  try {
    const customers = await getCachedData("customers");
    allCustomers = customers; // Store globally for editing prefill
    
    renderCustomers(customers);
  } catch (err) {
    console.error(err);
    document.getElementById("customerTable").innerHTML = `
      <div style="text-align: center; color: var(--danger); padding: 30px; font-weight: 600;">
        Unable to load customer registry from Google Sheets.
      </div>
    `;
  }
}

function renderCustomers(customers) {
  if (customers.length === 0) {
    document.getElementById("customerTable").innerHTML = `
      <div style="text-align: center; color: var(--slate-500); padding: 40px; font-weight: 500;">
        No customers logged in the database yet.
      </div>
    `;
    return;
  }

  // Desktop view HTML (table)
  let desktopHtml = `
    <div class="table-responsive desktop-only-view">
      <table class="table">
        <thead>
          <tr>
            <th>Customer ID</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Billing Address</th>
            <th style="text-align: center; width: 160px;">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  // Mobile view HTML (cards grid)
  let mobileHtml = `
    <div class="mobile-only-view customer-cards-grid">
  `;

  customers.forEach(customer => {
    const searchText = (customer.customerId + ' ' + customer.name + ' ' + customer.phone + ' ' + (customer.email || '') + ' ' + (customer.address || '')).toLowerCase();

    // Append to desktop table
    desktopHtml += `
      <tr data-search-text="${searchText}">
        <td style="font-weight: 600; color: var(--slate-600);">${customer.customerId || "N/A"}</td>
        <td style="font-weight: 600; color: var(--slate-900);">${customer.name || "Unnamed"}</td>
        <td>${customer.phone || "N/A"}</td>
        <td style="color: var(--primary); font-weight: 500;">${customer.email || "N/A"}</td>
        <td style="font-size: 13px; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${customer.address || "N/A"}
        </td>
        <td style="text-align: center;">
          <button class="btn btn-outline" style="padding: 6px 12px; font-size: 12.5px; border-color: var(--primary); color: var(--primary); margin-right: 6px;" onclick="openEditCustomerModal('${customer.customerId}')">Edit</button>
          <button class="btn btn-outline text-danger" style="padding: 6px 12px; font-size: 12.5px; border-color: var(--danger); color: var(--danger);" onclick="deleteCustomer('${customer.customerId}')">Delete</button>
        </td>
      </tr>
    `;

    // Append to mobile cards
    mobileHtml += `
      <div class="mobile-item-card" data-search-text="${searchText}">
        <div class="mobile-card-header">
          <div>
            <span class="mobile-card-id">${customer.customerId || "N/A"}</span>
          </div>
          <div>
            <span class="mobile-card-phone-badge">${customer.phone || "N/A"}</span>
          </div>
        </div>
        <h4 class="mobile-card-title">${customer.name || "Unnamed"}</h4>
        <div class="mobile-card-details">
          <div class="detail-row">
            <span>Email:</span>
            <span style="color: var(--primary); font-weight: 500;">${customer.email || "N/A"}</span>
          </div>
          <div class="detail-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
            <span>Billing Address:</span>
            <span style="line-height: 1.4; color: var(--slate-600);">${customer.address || "N/A"}</span>
          </div>
        </div>
        <div class="mobile-card-actions">
          <button class="btn btn-outline btn-sm" style="flex: 1; border-color: var(--primary); color: var(--primary);" onclick="openEditCustomerModal('${customer.customerId}')">Edit</button>
          <button class="btn btn-outline text-danger btn-sm" style="flex: 1; border-color: var(--danger); color: var(--danger);" onclick="deleteCustomer('${customer.customerId}')">Delete</button>
        </div>
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

  document.getElementById("customerTable").innerHTML = desktopHtml + mobileHtml;
}

function searchCustomer(keyword) {
  const cleanedKeyword = keyword.toLowerCase().trim();

  // Search table rows
  const rows = document.querySelectorAll("#customerTable tbody tr");
  rows.forEach(row => {
    const text = row.getAttribute("data-search-text") || row.innerText.toLowerCase();
    row.style.display = text.includes(cleanedKeyword) ? "" : "none";
  });

  // Search mobile cards
  const cards = document.querySelectorAll("#customerTable .mobile-item-card");
  cards.forEach(card => {
    const text = card.getAttribute("data-search-text") || card.innerText.toLowerCase();
    card.style.display = text.includes(cleanedKeyword) ? "" : "none";
  });
}

// ==========================================
// MODAL CONTROLLER (CUSTOMER INSERTIONS/EDITS)
// ==========================================

function openCustomerModal() {
  customerEditMode = false;
  currentEditCustomerId = "";

  // Reset modal title and button text
  document.querySelector("#customerModal .modal-header h3").innerText = "Add New Customer";
  document.querySelector("#customerModal button[type='submit']").innerText = "Save Customer";

  document.getElementById("customerForm").reset();
  document.getElementById("customerModal").classList.add("active");
}

function openEditCustomerModal(customerId) {
  customerEditMode = true;
  currentEditCustomerId = customerId;

  const customer = allCustomers.find(c => c.customerId === customerId);
  if (!customer) return;

  // Set modal title and button text
  document.querySelector("#customerModal .modal-header h3").innerText = "Edit Customer";
  document.querySelector("#customerModal button[type='submit']").innerText = "Save Changes";

  // Prefill input fields
  document.getElementById("c_name").value = customer.name || "";
  document.getElementById("c_phone").value = customer.phone || "";
  document.getElementById("c_email").value = customer.email || "";
  document.getElementById("c_address").value = customer.address || "";

  document.getElementById("customerModal").classList.add("active");
}

function closeCustomerModal() {
  document.getElementById("customerModal").classList.remove("active");
  window.customerCreatedFromInvoice = false;
}

async function saveCustomerModal(event) {
  event.preventDefault();
  
  const submitBtn = event.target.querySelector("button[type='submit']");
  submitBtn.innerText = customerEditMode ? "Updating Customer..." : "Adding Customer...";
  submitBtn.disabled = true;

  const data = {
    name: document.getElementById("c_name").value.trim(),
    phone: document.getElementById("c_phone").value.trim(),
    email: document.getElementById("c_email").value.trim(),
    address: document.getElementById("c_address").value.trim()
  };

  const payload = {
    action: customerEditMode ? "editCustomer" : "addCustomer",
    ...data
  };

  if (customerEditMode) {
    payload.customerId = currentEditCustomerId;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.success) {
      showToast(customerEditMode ? "Customer details updated successfully!" : "Customer added successfully to database!", "success");
      const isFromInvoice = window.customerCreatedFromInvoice;
      closeCustomerModal();
      invalidateCache("customers");
      if (isFromInvoice) {
        if (typeof fetchAutocompleteData === 'function') {
          await fetchAutocompleteData();
          const customersList = window.sreCache.customers || [];
          const newCustName = data.name.toLowerCase().trim();
          const newCust = customersList.find(c => (c.name || '').toLowerCase().trim() === newCustName);
          if (newCust) {
            const sel = document.getElementById("customerSelect");
            if (sel) {
              sel.value = newCust.customerId;
              sel.dispatchEvent(new Event('change'));
            }
          }
        }
      } else {
        await loadCustomers();
      }
    } else {
      showToast(result.message || "Failed to save customer details.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Connection error. Could not write customer to sheet.", "error");
  } finally {
    submitBtn.innerText = customerEditMode ? "Save Changes" : "Save Customer";
    submitBtn.disabled = false;
  }
}

async function deleteCustomer(customerId) {
  if (!confirm("Are you sure you want to delete this customer? This will permanently remove them from your database.")) {
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "deleteCustomer",
        customerId: customerId
      })
    });

    const result = await response.json();

    if (result.success) {
      showToast("Customer deleted successfully!", "success");
      invalidateCache("customers");
      await loadCustomers();
    } else {
      showToast(result.message || "Failed to delete the customer.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Connection error. Could not delete customer.", "error");
  }
}

document.addEventListener("sreCacheUpdated", (e) => {
  if (e.detail.action === "customers") {
    const customersEl = document.getElementById("customers");
    if (customersEl && customersEl.style.display === "block") {
      fetchCustomers();
    }
  }
});