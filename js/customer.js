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
      <button class="btn btn-success" onclick="openCustomerModal()">
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

  let html = `
    <div class="table-responsive">
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

  customers.forEach(customer => {
    html += `
      <tr>
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
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  document.getElementById("customerTable").innerHTML = html;
}

function searchCustomer(keyword) {
  const rows = document.querySelectorAll("#customerTable tbody tr");
  const cleanedKeyword = keyword.toLowerCase().trim();

  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(cleanedKeyword) ? "" : "none";
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
      alert(customerEditMode ? "Customer details updated successfully!" : "Customer added successfully to database!");
      closeCustomerModal();
      invalidateCache("customers");
      if (window.customerCreatedFromInvoice) {
        window.customerCreatedFromInvoice = false;
        if (typeof fetchAutocompleteData === 'function') {
          await fetchAutocompleteData();
          if (typeof customerDatabase !== 'undefined') {
            const newCustName = data.name.toLowerCase();
            const newCust = customerDatabase.find(c => c.name.toLowerCase() === newCustName);
            if (newCust) {
              const sel = document.getElementById("customerSelect");
              if (sel) {
                sel.value = newCust.customerId;
                sel.dispatchEvent(new Event('change'));
              }
            }
          }
        }
      } else {
        await loadCustomers();
      }
    } else {
      alert(result.message || "Failed to save customer details.");
    }
  } catch (err) {
    console.error(err);
    alert("Connection error. Could not write customer to sheet.");
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
      alert("Customer deleted successfully!");
      invalidateCache("customers");
      await loadCustomers();
    } else {
      alert(result.message || "Failed to delete the customer.");
    }
  } catch (err) {
    console.error(err);
    alert("Connection error. Could not delete customer.");
  }
}