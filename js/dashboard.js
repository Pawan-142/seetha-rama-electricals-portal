// ==========================================
// DASHBOARD SCREEN CONTROLLER
// ==========================================

let salesChartInstance = null;
let productsChartInstance = null;
let categoryChartInstance = null;
let dashboardSalesRaw = [];
let productCategoryMap = {};

// Helper: parse date safely
function _parseDashboardDate(dateVal) {
  if (!dateVal) return new Date(0);
  const d = new Date(dateVal);
  if (!isNaN(d.getTime())) return d;
  
  // Format YYYY-MM-DD or DD-MM-YYYY
  const parts = dateVal.toString().split(/[\/\-\s]/);
  if (parts.length >= 3) {
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else if (parts[2].substring(0, 4).length === 4) {
      return new Date(parseInt(parts[2].substring(0, 4), 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    }
  }
  return new Date(0);
}

// Helper: generate array of dates between start and end inclusive
function _getDatesInRange(start, end) {
  const arr = [];
  let dt = new Date(start);
  let limit = 0;
  while (dt <= end && limit < 100) {
    arr.push(new Date(dt));
    dt.setDate(dt.getDate() + 1);
    limit++;
  }
  return arr;
}

// Helper: filter raw sales list by range
function _filterSalesByRange(sales, filterType, customStart, customEnd) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start = new Date(0);
  let end = new Date();
  end.setHours(23, 59, 59, 999);

  if (filterType === 'today') {
    start = new Date(today);
  } else if (filterType === 'yesterday') {
    start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    end = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    end.setHours(23, 59, 59, 999);
  } else if (filterType === 'week') {
    start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (filterType === 'month') {
    start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (filterType === 'custom') {
    if (customStart) {
      start = new Date(customStart);
      start.setHours(0, 0, 0, 0);
    }
    if (customEnd) {
      end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
    }
  }

  return {
    filtered: sales.filter(sale => {
      const d = _parseDashboardDate(sale.date);
      return d >= start && d <= end;
    }),
    start,
    end
  };
}

async function loadDashboard() {
  setActiveNav("navDashboard");
  showPage("dashboard");

  // Render Skeleton Structure
  document.getElementById("dashboard").innerHTML = `
    <h2 class="page-title">Dashboard Overview</h2>

    <!-- Stat Cards Grid -->
    <div class="dashboard-grid">
      <div class="stat-card blue">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value" id="totalProducts">0</span>
          <span class="stat-label">Total Products</span>
        </div>
      </div>

      <div class="stat-card purple">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value" id="totalCustomers">0</span>
          <span class="stat-label">Total Customers</span>
        </div>
      </div>

      <div class="stat-card green">
        <div class="stat-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
        <div class="stat-info">
          <span class="stat-value" id="totalSales">₹0.00</span>
          <span class="stat-label">Total Sales Revenue</span>
        </div>
      </div>
    </div>

    <!-- Analytics Charts Grid -->
    <div class="charts-grid">
      <!-- Line Chart -->
      <div class="card-box">
        <div class="sre-chart-header">
          <h3 style="font-size: 18px; font-weight: 700; margin: 0;">Sales Performance</h3>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <select id="salesFilter" class="sre-filter-select" onchange="handleSalesFilterChange(this.value)">
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week" selected>Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <div id="salesCustomDates" class="sre-custom-date-container">
              <input type="date" id="salesStartDate">
              <span style="font-size: 12px; color: var(--slate-400);">to</span>
              <input type="date" id="salesEndDate">
              <button class="btn btn-primary sre-filter-btn" onclick="applySalesCustomFilter()">Apply</button>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="salesChart"></canvas>
        </div>
      </div>

      <!-- Bar Chart -->
      <div class="card-box">
        <div class="sre-chart-header">
          <h3 style="font-size: 18px; font-weight: 700; margin: 0;">Top Selling Products</h3>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <select id="productsFilter" class="sre-filter-select" onchange="handleProductsFilterChange(this.value)">
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month" selected>Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <div id="productsCustomDates" class="sre-custom-date-container">
              <input type="date" id="productsStartDate">
              <span style="font-size: 12px; color: var(--slate-400);">to</span>
              <input type="date" id="productsEndDate">
              <button class="btn btn-primary sre-filter-btn" onclick="applyProductsCustomFilter()">Apply</button>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="productsChart"></canvas>
        </div>
      </div>

      <!-- Category Distribution Chart (New Graph) -->
      <div class="card-box">
        <div class="sre-chart-header">
          <h3 style="font-size: 18px; font-weight: 700; margin: 0;">Category Sales Revenue</h3>
          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <select id="categoryFilter" class="sre-filter-select" onchange="handleCategoryFilterChange(this.value)">
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month" selected>Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <div id="categoryCustomDates" class="sre-custom-date-container">
              <input type="date" id="categoryStartDate">
              <span style="font-size: 12px; color: var(--slate-400);">to</span>
              <input type="date" id="categoryEndDate">
              <button class="btn btn-primary sre-filter-btn" onclick="applyCategoryCustomFilter()">Apply</button>
            </div>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="categoryChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Lists Display Grid -->
    <div class="dashboard-sections">
      <!-- Recent Sales Section -->
      <div class="card-box">
        <h3 class="mb-4" style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">Recent Sales Transactions</h3>
        <div class="table-responsive" style="box-shadow: none; border: none; padding: 0;">
          <table class="table" style="font-size: 13.5px;">
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice No</th>
                <th>Customer</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody id="recentSalesBody">
              <tr>
                <td colspan="4" style="text-align: center; color: var(--slate-400); padding: 30px;">Loading transactions...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Low Stock Alerts Section -->
      <div class="card-box">
        <h3 class="mb-4" style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">Low Stock Alerts</h3>
        <div id="lowStockList">
          <p style="text-align: center; color: var(--slate-400); padding: 30px;">Loading alerts...</p>
        </div>
      </div>
    </div>
  `;

  try {
    // Concurrently fetch general stats, raw sales list, and raw inventory list
    const [statsRes, salesRes, invRes] = await Promise.all([
      fetch(API_URL + "?action=dashboard").then(r => r.json()),
      fetch(API_URL + "?action=sales").then(r => r.json()),
      fetch(API_URL + "?action=inventory").then(r => r.json())
    ]);

    dashboardSalesRaw = Array.isArray(salesRes) ? salesRes : (salesRes.data || []);
    const productsRaw = Array.isArray(invRes) ? invRes : (invRes.data || []);

    // Build Product Category lookup map
    productCategoryMap = {};
    productsRaw.forEach(p => {
      productCategoryMap[p.productId] = p.category || "Electrical";
    });

    // 1. Populate Metrics
    document.getElementById("totalProducts").innerText = statsRes.products || 0;
    document.getElementById("totalCustomers").innerText = statsRes.customers || 0;
    document.getElementById("totalSales").innerText = "₹" + (statsRes.sales || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // 2. Populate Recent Sales Table
    const salesBody = document.getElementById("recentSalesBody");
    const recent = statsRes.recentSales || [];
    if (recent.length === 0) {
      salesBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--slate-500);">No sales recorded yet</td></tr>`;
    } else {
      salesBody.innerHTML = recent.map(sale => `
        <tr>
          <td>${sale.date}</td>
          <td style="font-weight: 600; color: var(--primary);">${sale.invoiceNo}</td>
          <td>${sale.customerName}</td>
          <td style="font-weight: 700;">₹${(Number(sale.grandTotal) || 0).toFixed(2)}</td>
        </tr>
      `).join('');
    }

    // 3. Populate Low Stock Alerts List
    const stockList = document.getElementById("lowStockList");
    const low = statsRes.lowStock || [];
    if (low.length === 0) {
      stockList.innerHTML = `<p style="text-align: center; color: var(--success); font-weight: 500; padding: 20px;">All stock levels healthy!</p>`;
    } else {
      stockList.innerHTML = low.map(item => `
        <div class="low-stock-item">
          <div>
            <strong style="display: block; font-size: 14.5px; color: var(--slate-800);">${item.productName}</strong>
            <span style="font-size: 12px; color: var(--text-muted);">${item.productId} | ₹${(Number(item.rate) || 0).toFixed(2)}</span>
          </div>
          <span class="low-stock-badge">${item.stock} left</span>
        </div>
      `).join('');
    }

    // 4. Initialize and render each chart separately with defaults
    updateSalesChart("week");
    updateProductsChart("month");
    updateCategoryChart("month");

  } catch (err) {
    console.error(err);
    document.getElementById("recentSalesBody").innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">Unable to connect to Google Sheets backend.</td></tr>`;
    document.getElementById("lowStockList").innerHTML = `<p style="text-align: center; color: var(--danger);">Error loading stock alerts.</p>`;
  }
}

// ==================== SALES CHART LOGIC ====================
function handleSalesFilterChange(val) {
  const datesContainer = document.getElementById("salesCustomDates");
  if (val === "custom") {
    datesContainer.style.display = "inline-flex";
    const todayStr = new Date().toISOString().split("T")[0];
    document.getElementById("salesStartDate").value = todayStr;
    document.getElementById("salesEndDate").value = todayStr;
    applySalesCustomFilter();
  } else {
    datesContainer.style.display = "none";
    updateSalesChart(val);
  }
}

function applySalesCustomFilter() {
  const start = document.getElementById("salesStartDate").value;
  const end = document.getElementById("salesEndDate").value;
  updateSalesChart("custom", start, end);
}

function updateSalesChart(filterType, customStart = null, customEnd = null) {
  const { filtered, start, end } = _filterSalesByRange(dashboardSalesRaw, filterType, customStart, customEnd);

  // Group sum by date
  const dailySums = {};
  filtered.forEach(sale => {
    const d = _parseDashboardDate(sale.date);
    const key = d.toISOString().split("T")[0];
    dailySums[key] = (dailySums[key] || 0) + (parseFloat(sale.grandTotal) || 0);
  });

  // Generate labels and data points
  const dates = _getDatesInRange(start, end);
  const labels = [];
  const dataPoints = [];

  dates.forEach(d => {
    const key = d.toISOString().split("T")[0];
    const labelStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    labels.push(labelStr);
    dataPoints.push(dailySums[key] || 0);
  });

  const canvas = document.getElementById("salesChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (salesChartInstance) {
    salesChartInstance.destroy();
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(37, 99, 235, 0.22)");
  gradient.addColorStop(1, "rgba(37, 99, 235, 0.0)");

  salesChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        data: dataPoints,
        borderColor: "#2563eb",
        backgroundColor: gradient,
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: "#2563eb",
        pointHoverRadius: 6,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(val) { return "₹" + val.toLocaleString("en-IN"); },
            color: "#64748b"
          },
          grid: { color: "#e2e8f0" }
        },
        x: {
          ticks: { color: "#64748b" },
          grid: { display: false }
        }
      }
    }
  });
}

// ==================== PRODUCTS CHART LOGIC ====================
function handleProductsFilterChange(val) {
  const datesContainer = document.getElementById("productsCustomDates");
  if (val === "custom") {
    datesContainer.style.display = "inline-flex";
    const todayStr = new Date().toISOString().split("T")[0];
    document.getElementById("productsStartDate").value = todayStr;
    document.getElementById("productsEndDate").value = todayStr;
    applyProductsCustomFilter();
  } else {
    datesContainer.style.display = "none";
    updateProductsChart(val);
  }
}

function applyProductsCustomFilter() {
  const start = document.getElementById("productsStartDate").value;
  const end = document.getElementById("productsEndDate").value;
  updateProductsChart("custom", start, end);
}

function updateProductsChart(filterType, customStart = null, customEnd = null) {
  const { filtered } = _filterSalesByRange(dashboardSalesRaw, filterType, customStart, customEnd);

  // Group sum item counts
  const itemCounts = {};
  filtered.forEach(sale => {
    let items = [];
    if (sale.itemsJson) {
      try {
        items = JSON.parse(sale.itemsJson);
      } catch(e) {}
    }
    if (Array.isArray(items)) {
      items.forEach(item => {
        const name = item.productName || "Unknown Product";
        const qty = parseFloat(item.qty) || 0;
        itemCounts[name] = (itemCounts[name] || 0) + qty;
      });
    }
  });

  // Sort and pick top 5
  const topList = Object.keys(itemCounts)
    .map(name => ({ name, qty: itemCounts[name] }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const labels = topList.map(x => x.name);
  const dataPoints = topList.map(x => x.qty);

  const canvas = document.getElementById("productsChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (productsChartInstance) {
    productsChartInstance.destroy();
  }

  productsChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels.length ? labels : ["No Data"],
      datasets: [{
        data: dataPoints.length ? dataPoints : [0],
        backgroundColor: "#4f46e5",
        borderRadius: 6,
        maxBarThickness: 32
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            color: "#64748b"
          },
          grid: { color: "#e2e8f0" }
        },
        x: {
          ticks: { color: "#64748b" },
          grid: { display: false }
        }
      }
    }
  });
}

// ==================== CATEGORY CHART LOGIC ====================
function handleCategoryFilterChange(val) {
  const datesContainer = document.getElementById("categoryCustomDates");
  if (val === "custom") {
    datesContainer.style.display = "inline-flex";
    const todayStr = new Date().toISOString().split("T")[0];
    document.getElementById("categoryStartDate").value = todayStr;
    document.getElementById("categoryEndDate").value = todayStr;
    applyCategoryCustomFilter();
  } else {
    datesContainer.style.display = "none";
    updateCategoryChart(val);
  }
}

function applyCategoryCustomFilter() {
  const start = document.getElementById("categoryStartDate").value;
  const end = document.getElementById("categoryEndDate").value;
  updateCategoryChart("custom", start, end);
}

function updateCategoryChart(filterType, customStart = null, customEnd = null) {
  const { filtered } = _filterSalesByRange(dashboardSalesRaw, filterType, customStart, customEnd);

  const categorySums = {
    "Electrical": 0,
    "Plumbing": 0,
    "Hardware": 0,
    "Lighting": 0
  };

  filtered.forEach(sale => {
    let items = [];
    if (sale.itemsJson) {
      try {
        items = JSON.parse(sale.itemsJson);
      } catch(e) {}
    }
    if (Array.isArray(items)) {
      items.forEach(item => {
        const cat = productCategoryMap[item.productId] || "Electrical";
        const qty = parseFloat(item.qty) || 0;
        const rate = parseFloat(item.rate) || 0;
        categorySums[cat] = (categorySums[cat] || 0) + (qty * rate);
      });
    }
  });

  const labels = Object.keys(categorySums);
  const dataPoints = Object.values(categorySums);

  const canvas = document.getElementById("categoryChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  if (categoryChartInstance) {
    categoryChartInstance.destroy();
  }

  // Electrical, Plumbing, Hardware, Lighting colors
  const colors = ["#2563eb", "#4f46e5", "#f59e0b", "#10b981"];

  categoryChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{
        data: dataPoints,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: "#ffffff"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "right",
          labels: {
            boxWidth: 12,
            font: { family: "Outfit", size: 12 },
            color: "#64748b",
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                return data.labels.map(function(label, i) {
                  const ds = data.datasets[0];
                  const value = ds.data[i];
                  const formattedValue = "₹" + value.toLocaleString("en-IN", { maximumFractionDigits: 0 });
                  return {
                    text: label + ": " + formattedValue,
                    fillStyle: ds.backgroundColor[i],
                    strokeStyle: ds.borderColor,
                    lineWidth: ds.borderWidth,
                    hidden: isNaN(ds.data[i]) || chart.getDatasetMeta(0).data[i].hidden,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        }
      }
    }
  });
}

function setActiveNav(navId) {
  document.querySelectorAll(".sidebar .nav-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  const current = document.getElementById(navId);
  if (current) current.classList.add("active");
}