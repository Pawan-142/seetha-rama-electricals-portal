// ==========================================
// SALES HISTORY CONTROLLER WITH FILTERS
// ==========================================

let allSalesRaw = [];
let allSalesFiltered = [];

async function loadSales() {
  setActiveNav("navSales");
  showPage("sales");

  document.getElementById("sales").innerHTML = `
    <!-- ===== HEADER BANNER ===== -->
    <div class="inv-banner">
      <div class="inv-banner-logo">📊</div>
      <div class="inv-banner-info">
        <h1 class="inv-banner-title">Sales History &amp; Analytics</h1>
        <p class="inv-banner-sub">View transactions, performance metrics, and print invoices</p>
      </div>
      <div class="inv-banner-tag" id="salesDateLabel">...</div>
    </div>

    <!-- ===== FILTER SECTION ===== -->
    <div class="card-box mb-4" style="padding: 16px;">
      <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
        <div class="field-group" style="margin-bottom: 0; min-width: 200px;">
          <label>Filter Date Range</label>
          <select id="salesFilterSelect" class="form-control" onchange="handleSalesFilterChange(this.value)">
            <option value="today">Today</option>
            <option value="week">Last 7 Days (Last Week)</option>
            <option value="month">Last 30 Days (Last Month)</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>
        
        <div id="customDateRangeInputs" style="display: none; gap: 12px; align-items: flex-end; flex-wrap: wrap;">
          <div class="field-group" style="margin-bottom: 0;">
            <label>Start Date</label>
            <input type="date" id="filterStartDate" class="form-control">
          </div>
          <div class="field-group" style="margin-bottom: 0;">
            <label>End Date</label>
            <input type="date" id="filterEndDate" class="form-control">
          </div>
          <button class="btn btn-primary" onclick="applyCustomSalesFilter()" style="padding: 8px 16px; font-size: 13px; height: 38px; margin-bottom: 0; display: inline-flex; align-items: center; justify-content: center;">
            Apply Filter
          </button>
        </div>
      </div>
    </div>

    <!-- ===== STATS CARDS ===== -->
    <div class="dashboard-grid mb-4">
      <div class="stat-card blue">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-value" id="todaySalesRevenue">₹0.00</div>
          <div class="stat-label">Sales Revenue</div>
        </div>
      </div>
      <div class="stat-card purple">
        <div class="stat-icon">📄</div>
        <div class="stat-info">
          <div class="stat-value" id="todaySalesCount">0</div>
          <div class="stat-label">Invoices Generated</div>
        </div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon">🏦</div>
        <div class="stat-info">
          <div class="stat-value" id="todayTaxes">₹0.00</div>
          <div class="stat-label">Taxes Collected</div>
        </div>
      </div>
      <div class="stat-card orange">
        <div class="stat-icon">🏷️</div>
        <div class="stat-info">
          <div class="stat-value" id="todayDiscounts">₹0.00</div>
          <div class="stat-label">Discounts Given</div>
        </div>
      </div>
    </div>

    <!-- ===== TODAY'S TRANSACTIONS ===== -->
    <div class="card-box">
      <div class="inventory-header">
        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: var(--text-main);" id="salesTableTitle">Invoices</h2>
        <div style="display: flex; gap: 12px; align-items: center;">
          <button class="btn btn-outline" onclick="exportSalesToCSV()" style="padding: 8px 16px; font-size: 13.5px; display: inline-flex; align-items: center; gap: 8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export to CSV
          </button>
          <input
            type="text"
            id="searchSalesInput"
            class="form-control"
            placeholder="Search by invoice #, customer name..."
            style="width: 280px; padding: 8px 14px;"
            onkeyup="searchTodaySales(this.value)"
          >
        </div>
      </div>

      <div id="todaySalesTable">
        <div style="text-align: center; color: var(--slate-400); padding: 40px;">Retrieving sales registry...</div>
      </div>
    </div>
  `;

  // Set today's date label nicely
  const today = new Date();
  document.getElementById("salesDateLabel").textContent = today.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  await fetchSalesHistory();
}

async function fetchSalesHistory() {
  try {
    const sales = await getCachedData("sales");
    
    allSalesRaw = sales;
    
    // Default filter to Today
    filterAndRenderSales("today");
  } catch (err) {
    console.error(err);
    document.getElementById("todaySalesTable").innerHTML = `
      <div style="text-align: center; color: var(--danger); padding: 30px; font-weight: 600;">
        Unable to load sales history from Google Sheets.
      </div>
    `;
  }
}

function handleSalesFilterChange(val) {
  const customInputs = document.getElementById("customDateRangeInputs");
  if (val === "custom") {
    customInputs.style.display = "flex";
    const todayStr = new Date().toISOString().split("T")[0];
    document.getElementById("filterStartDate").value = todayStr;
    document.getElementById("filterEndDate").value = todayStr;
    applyCustomSalesFilter();
  } else {
    customInputs.style.display = "none";
    filterAndRenderSales(val);
  }
}

function parseRawDate(dateInput) {
  if (!dateInput) return new Date(0);
  if (dateInput instanceof Date) return dateInput;
  
  const parts = dateInput.toString().split(/[\/\-\s]/);
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      // yyyy-MM-dd
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    } else if (parts[2].substring(0, 4).length === 4) {
      // dd-MM-yyyy
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2].substring(0, 4), 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }
  
  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }
  return new Date(0);
}

function isSameDay(d1, d2) {
  const p1 = parseRawDate(d1);
  return p1.getDate() === d2.getDate() &&
         p1.getMonth() === d2.getMonth() &&
         p1.getFullYear() === d2.getFullYear();
}

function filterAndRenderSales(range) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let filtered = [];

  if (range === "today") {
    document.getElementById("salesTableTitle").textContent = "Today's Invoices";
    filtered = allSalesRaw.filter(sale => isSameDay(sale.date, today));
  } else if (range === "week") {
    document.getElementById("salesTableTitle").textContent = "Last 7 Days Invoices";
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    filtered = allSalesRaw.filter(sale => {
      const d = parseRawDate(sale.date);
      return d >= weekAgo && d <= new Date();
    });
  } else if (range === "month") {
    document.getElementById("salesTableTitle").textContent = "Last 30 Days Invoices";
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    filtered = allSalesRaw.filter(sale => {
      const d = parseRawDate(sale.date);
      return d >= monthAgo && d <= new Date();
    });
  }

  // Sort descending by date/invoiceNo
  filtered.sort((a, b) => b.invoiceNo.localeCompare(a.invoiceNo));

  allSalesFiltered = filtered;
  renderTodaySales(filtered);
}

function applyCustomSalesFilter() {
  const startStr = document.getElementById("filterStartDate").value;
  const endStr = document.getElementById("filterEndDate").value;
  if (!startStr || !endStr) return;
  
  const start = new Date(startStr);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(endStr);
  end.setHours(23, 59, 59, 999);

  document.getElementById("salesTableTitle").textContent = "Filtered Invoices";
  
  const filtered = allSalesRaw.filter(sale => {
    const d = parseRawDate(sale.date);
    return d >= start && d <= end;
  });

  filtered.sort((a, b) => b.invoiceNo.localeCompare(a.invoiceNo));
  
  allSalesFiltered = filtered;
  renderTodaySales(filtered);
}

function renderTodaySales(sales) {
  // Update stats cards first
  let revenue = 0;
  let taxes = 0;
  let discounts = 0;

  sales.forEach(s => {
    revenue += Number(s.grandTotal) || 0;
    taxes += (Number(s.totalCGST) || 0) + (Number(s.totalSGST) || 0);
    discounts += Number(s.totalDiscount) || 0;
  });

  document.getElementById("todaySalesRevenue").textContent = "₹" + revenue.toFixed(2);
  document.getElementById("todaySalesCount").textContent = sales.length;
  document.getElementById("todayTaxes").textContent = "₹" + taxes.toFixed(2);
  document.getElementById("todayDiscounts").textContent = "₹" + discounts.toFixed(2);

  if (sales.length === 0) {
    document.getElementById("todaySalesTable").innerHTML = `
      <div style="text-align: center; color: var(--slate-500); padding: 40px; font-weight: 500;">
        No sales recorded for this date range yet.
      </div>
    `;
    return;
  }

  // Render views (Desktop Table & Mobile Cards)
  let desktopHtml = `
    <div class="desktop-only-view table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Invoice No</th>
            <th>Customer Name</th>
            <th>Phone</th>
            <th>Items Sold</th>
            <th>Subtotal</th>
            <th>Tax (GST)</th>
            <th>Grand Total</th>
            <th style="text-align: center; width: 140px;">Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  let mobileHtml = `
    <div class="mobile-only-view inventory-cards-grid">
  `;

  sales.forEach(sale => {
    const saleId = sale.invoiceNo || "N/A";
    const name = sale.customerName || "—";
    const phone = sale.customerPhone || sale.phone || "—";
    const items = sale.items || "—";
    const subtotal = Number(sale.subTotal) || 0;
    const cgst = Number(sale.totalCGST) || 0;
    const sgst = Number(sale.totalSGST) || 0;
    const totalTax = cgst + sgst;
    const grand = Number(sale.grandTotal) || 0;
    
    let formattedDate = "";
    if (sale.date) {
      const d = parseRawDate(sale.date);
      formattedDate = d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    // Desktop row
    desktopHtml += `
      <tr>
        <td style="font-weight: 600; color: var(--text-muted);">${formattedDate}</td>
        <td style="font-weight: 700; color: var(--primary);">${saleId}</td>
        <td style="font-weight: 600; color: var(--text-main);">${name}</td>
        <td>${phone}</td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${items}">
          ${items}
        </td>
        <td>₹${subtotal.toFixed(2)}</td>
        <td>₹${totalTax.toFixed(2)}</td>
        <td style="font-weight: 800; color: var(--text-main);">₹${grand.toFixed(2)}</td>
        <td style="text-align: center;">
          <button class="btn btn-outline" style="padding: 6px 12px; font-size: 12.5px; border-color: var(--primary); color: var(--primary);" onclick="viewHistoricalInvoice('${saleId}')">View Invoice</button>
        </td>
      </tr>
    `;

    // Mobile card
    mobileHtml += `
      <div class="mobile-item-card">
        <div class="mobile-card-header">
          <div>
            <span class="mobile-card-id">${saleId}</span>
            <span class="mobile-card-category" style="color: var(--text-muted); font-weight: 600; text-transform: none; letter-spacing: normal;">${formattedDate}</span>
          </div>
          <div>
            <span class="badge badge-success" style="font-size: 13px; font-weight: 700; background: rgba(37, 99, 235, 0.1); color: var(--primary); border: 1px solid rgba(37, 99, 235, 0.2);">₹${grand.toFixed(2)}</span>
          </div>
        </div>
        <h4 class="mobile-card-title" style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-main);">${name}</h4>
        <div class="mobile-card-details" style="font-size: 13.5px; display: flex; flex-direction: column; gap: 8px; margin-top: 10px;">
          <div class="detail-row">
            <span>Phone:</span>
            <strong>${phone}</strong>
          </div>
          <div class="detail-row">
            <span>Items Sold:</span>
            <span style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;" title="${items}">${items}</span>
          </div>
          <div class="detail-row">
            <span>Subtotal / Tax:</span>
            <span>₹${subtotal.toFixed(2)} / ₹${totalTax.toFixed(2)}</span>
          </div>
        </div>
        <div class="mobile-card-actions" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);">
          <button class="btn btn-outline" style="width: 100%; border-color: var(--primary); color: var(--primary); padding: 8px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; gap: 8px;" onclick="viewHistoricalInvoice('${saleId}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View Invoice
          </button>
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

  document.getElementById("todaySalesTable").innerHTML = desktopHtml + mobileHtml;
}

function searchTodaySales(keyword) {
  const cleanedKeyword = keyword.toLowerCase().trim();

  // Filter desktop table rows
  const rows = document.querySelectorAll("#todaySalesTable tbody tr");
  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(cleanedKeyword) ? "" : "none";
  });

  // Filter mobile cards
  const cards = document.querySelectorAll("#todaySalesTable .mobile-item-card");
  cards.forEach(card => {
    card.style.display = card.innerText.toLowerCase().includes(cleanedKeyword) ? "" : "none";
  });
}

async function viewHistoricalInvoice(invoiceNo) {
  // Find the invoice details from the global sales data
  const sale = allSalesRaw.find(s => s.invoiceNo === invoiceNo);
  if (!sale) {
    showToast("Invoice details not found.", "error");
    return;
  }

  // Set preview source to sales so back button works correctly
  window.invoicePreviewSource = "sales";

  // If the invoice page hasn't been built/loaded yet, build it in the background
  if (!document.getElementById("invDesktopBody")) {
    await loadInvoice();
    // loadInvoice changes nav to invoice, so restore it back to sales
    setActiveNav("navSales");
    showPage("sales");
  }
  
  rowCounter = 0;
  
  // Clear current rows
  document.getElementById("invDesktopBody").innerHTML = "";
  document.getElementById("invMobileCards").innerHTML = "";
  
  // 2. Populate metadata fields
  document.getElementById("invoiceNo").value = sale.invoiceNo || "";
  if (sale.date) {
    try {
      document.getElementById("invoiceDate").value = new Date(sale.date).toISOString().split("T")[0];
    } catch(e) {
      document.getElementById("invoiceDate").value = new Date().toISOString().split("T")[0];
    }
  }
  document.getElementById("invoiceCustomerName").value = sale.customerName || "";
  document.getElementById("invoiceCustomerPhone").value = sale.customerPhone || "";
  document.getElementById("invoiceCustomerEmail").value = sale.customerEmail || "";
  document.getElementById("invoiceCustomerAddress").value = sale.customerAddress || "";
  
  // Ensure autocomplete data is fetched so customerDatabase is populated
  if (typeof customerDatabase === 'undefined' || customerDatabase.length === 0) {
    await fetchAutocompleteData();
  }

  // Try to pre-fill search dropdown matching customer if possible
  const customerSelect = document.getElementById("customerSelect");
  if (customerSelect && typeof customerDatabase !== 'undefined') {
    // Search matching customer in Database
    const matchedCustomer = customerDatabase.find(c => c.name === sale.customerName || c.phone === sale.customerPhone);
    if (matchedCustomer) {
      customerSelect.value = matchedCustomer.customerId;
    } else {
      customerSelect.value = "";
    }
  }

  // 3. Parse items
  let items = [];
  if (sale.itemsJson) {
    try {
      items = JSON.parse(sale.itemsJson);
    } catch (e) {
      console.error("Error parsing itemsJson", e);
    }
  }
  
  if (!Array.isArray(items) || items.length === 0) {
    addInvoiceRow();
    return;
  }

  // Ensure autocomplete data is fetched so inventoryProducts is populated
  if (typeof inventoryProducts === 'undefined' || inventoryProducts.length === 0) {
    await fetchAutocompleteData();
  }
  
  // 4. Recreate each item row
  items.forEach(item => {
    addInvoiceRow();
    const rid = "irow-" + rowCounter;
    
    // Set desktop row inputs
    const tr = document.getElementById(rid);
    if (tr) {
      const sel = tr.querySelector(".inv-sel");
      if (sel) {
        sel.value = item.productId || "";
      }
      tr.querySelector(".qty").value = item.qty || 1;
      tr.querySelector(".unit").value = item.unit || "Nos";
      tr.querySelector(".rate").value = parseFloat(item.rate || 0).toFixed(2);
      tr.querySelector(".disc").value = parseFloat(item.discount || 0);
      tr.querySelector(".cgst").value = parseFloat(item.cgst || 9);
      tr.querySelector(".sgst").value = parseFloat(item.sgst || 9);
    }
    
    // Set mobile card inputs
    const card = document.getElementById("mc-" + rid);
    if (card) {
      const sel = card.querySelector(".m-sel");
      if (sel) sel.value = item.productId || "";
      card.querySelector(".m-qty").value = item.qty || 1;
      card.querySelector(".m-unit").value = item.unit || "Nos";
      card.querySelector(".m-rate").value = parseFloat(item.rate || 0).toFixed(2);
      card.querySelector(".m-disc").value = parseFloat(item.discount || 0);
      card.querySelector(".m-cgst").value = parseFloat(item.cgst || 9);
      card.querySelector(".m-sgst").value = parseFloat(item.sgst || 9);
    }
    
    // Recalculate row
    calcRow(rid);
  });
  
  // Set builder fields read-only so they cannot be edited for historical invoices
  setInvoiceFieldsReadOnly(true);

  // 5. Automatically trigger the print preview
  generateAndPreviewInvoice();
}

function exportSalesToCSV() {
  if (!allSalesFiltered || allSalesFiltered.length === 0) {
    showToast("No sales data available to export.", "warn");
    return;
  }

  // 1. Prepare CSV headers & rows
  const headers = ["Date", "Invoice No", "Customer Name", "Phone", "Items Sold", "Subtotal", "CGST", "SGST", "Total Tax", "Grand Total"];
  
  const csvRows = [headers.join(",")];
  
  allSalesFiltered.forEach(sale => {
    let formattedDate = "";
    if (sale.date) {
      const d = parseRawDate(sale.date);
      formattedDate = d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    
    const invoiceNo = sale.invoiceNo || "N/A";
    const name = (sale.customerName || "—").replace(/,/g, " "); // escape commas
    const phone = sale.customerPhone || sale.phone || "—";
    const items = (sale.items || "—").replace(/,/g, " | "); // escape commas
    const subtotal = (Number(sale.subTotal) || 0).toFixed(2);
    const cgst = (Number(sale.totalCGST) || 0).toFixed(2);
    const sgst = (Number(sale.totalSGST) || 0).toFixed(2);
    const totalTax = ((Number(sale.totalCGST) || 0) + (Number(sale.totalSGST) || 0)).toFixed(2);
    const grand = (Number(sale.grandTotal) || 0).toFixed(2);

    const row = [
      `"${formattedDate}"`,
      `"${invoiceNo}"`,
      `"${name}"`,
      `"${phone}"`,
      `"${items}"`,
      subtotal,
      cgst,
      sgst,
      totalTax,
      grand
    ];
    csvRows.push(row.join(","));
  });

  // 2. Generate and download file
  const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  
  const filterVal = document.getElementById("salesFilterSelect").value;
  const fileName = `sales_report_${filterVal}_${new Date().toISOString().split("T")[0]}.csv`;
  
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("CSV report downloaded successfully!", "success");
}

document.addEventListener("sreCacheUpdated", (e) => {
  if (e.detail.action === "sales") {
    const salesEl = document.getElementById("sales");
    if (salesEl && salesEl.style.display === "block") {
      fetchSalesHistory();
    }
  }
});

