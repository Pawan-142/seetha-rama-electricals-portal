// ==========================================
// DASHBOARD SCREEN CONTROLLER
// ==========================================

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
      <div class="card-box">
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">Sales Performance (Last 7 Days)</h3>
        <div class="chart-container">
          <canvas id="salesChart"></canvas>
        </div>
      </div>
      <div class="card-box">
        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">Top Selling Products</h3>
        <div class="chart-container">
          <canvas id="productsChart"></canvas>
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
    const response = await fetch(API_URL + "?action=dashboard");
    const data = await response.json();

    // 1. Populate Metrics
    document.getElementById("totalProducts").innerText = data.products || 0;
    document.getElementById("totalCustomers").innerText = data.customers || 0;
    document.getElementById("totalSales").innerText = "₹" + (data.sales || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // 2. Populate Recent Sales Table
    const salesBody = document.getElementById("recentSalesBody");
    const recent = data.recentSales || [];
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
    const low = data.lowStock || [];
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

    // 4. Render Analytics Charts using Chart.js
    const analytics = data.analytics || {};
    const salesTrend = analytics.salesTrend || { labels: [], data: [] };
    const topProducts = analytics.topProducts || { labels: [], data: [] };

    // Sales Performance Line Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    const salesGradient = salesCtx.createLinearGradient(0, 0, 0, 200);
    salesGradient.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
    salesGradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

    new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: salesTrend.labels,
        datasets: [{
          data: salesTrend.data,
          borderColor: '#2563eb', // --primary
          backgroundColor: salesGradient,
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointBackgroundColor: '#2563eb',
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
              callback: function(value) { return '₹' + value.toLocaleString("en-IN"); },
              color: '#64748b'
            },
            grid: { color: '#e2e8f0' }
          },
          x: {
            ticks: { color: '#64748b' },
            grid: { display: false }
          }
        }
      }
    });

    // Top Selling Products Bar Chart
    const productsCtx = document.getElementById('productsChart').getContext('2d');
    new Chart(productsCtx, {
      type: 'bar',
      data: {
        labels: topProducts.labels,
        datasets: [{
          data: topProducts.data,
          backgroundColor: '#4f46e5', // --secondary
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
              color: '#64748b'
            },
            grid: { color: '#e2e8f0' }
          },
          x: {
            ticks: { color: '#64748b' },
            grid: { display: false }
          }
        }
      }
    });

  } catch (err) {
    console.error(err);
    document.getElementById("recentSalesBody").innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger);">Unable to connect to Google Sheets backend.</td></tr>`;
    document.getElementById("lowStockList").innerHTML = `<p style="text-align: center; color: var(--danger);">Error loading stock alerts.</p>`;
  }
}

function setActiveNav(navId) {
  document.querySelectorAll(".sidebar .nav-btn").forEach(btn => {
    btn.classList.remove("active");
  });
  const current = document.getElementById(navId);
  if (current) current.classList.add("active");
}