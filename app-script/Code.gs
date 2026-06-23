/**
 * Google Apps Script Backend for Inventory Pro
 *
 * Required OAuth Scopes (add in appsscript.json if using clasp, or
 * GAS will auto-detect them — re-authorize after updating):
 *   https://www.googleapis.com/auth/spreadsheets
 *   https://www.googleapis.com/auth/gmail.send
 *   https://www.googleapis.com/auth/script.send_mail
 *
 * Instructions:
 * 1. Create a Google Sheet and name these 4 worksheets:
 *    - "Users"     (Columns: username, password, name, role)
 *    - "Inventory" (Columns: productId, productName, category, unit, rate, stock, cgst, sgst)
 *    - "Customers" (Columns: customerId, name, phone, email, address)
 *    - "Sales"     (Columns: saleId, date, invoiceNo, customerName, customerPhone, customerEmail,
 *                   subtotal, discountPercent, totalDiscount, totalCGST, totalSGST, totalTaxable, grandTotal, createdBy, itemsJson)
 * 2. In the "Users" sheet, add an initial row: admin, admin123, Administrator, admin
 * 3. Copy this entire script into Extensions > Apps Script.
 * 4. Click Deploy > New deployment > Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. IMPORTANT: When prompted, grant ALL permissions including Gmail.
 *    If email still fails, go to Project Settings > OAuth scopes and
 *    manually add: https://mail.google.com/
 * 6. Copy the Web App URL and paste it into js/config.js.
 */

function initializeDatabase() {
  try {
    var ss = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw');
    
    // 1. Upgrade & Fix Users sheet
    var userSheet = ss.getSheetByName('Users');
    if (userSheet) {
      var range = userSheet.getDataRange();
      var values = range.getValues();
      var headers = values[0];
      var hasName = false;
      for (var i = 0; i < headers.length; i++) {
        if (headers[i].toString().trim().toLowerCase() === 'name') {
          hasName = true;
          break;
        }
      }
      
      if (!hasName) {
        var newRows = [];
        newRows.push(['userId', 'username', 'password', 'name', 'role', 'status']);
        for (var r = 1; r < values.length; r++) {
          var row = values[r];
          var uId = row[0] ? row[0].toString().trim() : '';
          var uName = row[1] ? row[1].toString().trim() : '';
          var uPass = row[2] ? row[2].toString().trim() : '';
          var uRole = row[3] ? row[3].toString().trim() : '';
          var uStatus = row[4] ? row[4].toString().trim() : '';
          
          var finalUserId = uId;
          var finalUsername = uName;
          var finalPassword = uPass;
          var finalName = '';
          var finalRole = uRole;
          var finalStatus = uStatus || 'Active';
          
          if (uName.length === 64 && uId !== '' && uId !== 'U001' && uPass.length !== 64) {
            finalUserId = 'U00' + (r + 1);
            finalUsername = uId;
            finalPassword = uName;
            finalName = uPass;
            finalRole = uRole;
          } else if (uId === 'U001' || uName === 'admin') {
            finalUserId = 'U001';
            finalUsername = 'admin';
            finalPassword = uPass;
            finalName = 'Administrator';
            finalRole = 'admin';
            finalStatus = 'Active';
          } else {
            finalName = uId;
          }
          
          newRows.push([finalUserId, finalUsername, finalPassword, finalName, finalRole, finalStatus]);
        }
        userSheet.clearContents();
        userSheet.getRange(1, 1, newRows.length, 6).setValues(newRows);
      }
    }
    
    // 2. Fix Sales sheet
    var salesSheet = ss.getSheetByName('Sales');
    if (salesSheet) {
      var salesRange = salesSheet.getDataRange();
      var salesValues = salesRange.getValues();
      if (salesValues.length > 1) {
        var hasSalesChanges = false;
        for (var r = 1; r < salesValues.length; r++) {
          var row = salesValues[r];
          var colA = row[0] ? row[0].toString().trim() : '';
          var colC = row[2] ? row[2].toString().trim() : '';
          
          if (colA.indexOf('SALE-') === 0 && colC.indexOf('INV-') === 0) {
            var oldSaleId = colA;
            var oldDate = row[1];
            var oldInvoiceNo = colC;
            var oldCustomerName = row[3] ? row[3].toString().trim() : '';
            var oldPhone = row[4] ? row[4].toString().trim() : '';
            var oldEmail = row[5] ? row[5].toString().trim() : '';
            var oldSubtotal = parseFloat(row[6]) || 0;
            var oldDiscountPercent = parseFloat(row[7]) || 0;
            var oldTotalDiscount = parseFloat(row[8]) || 0;
            var oldTotalCGST = parseFloat(row[9]) || 0;
            var oldTotalSGST = parseFloat(row[10]) || 0;
            var oldTotalTaxable = parseFloat(row[11]) || 0;
            var oldGrandTotal = parseFloat(row[12]) || 0;
            var oldCreatedBy = row[13] ? row[13].toString().trim() : 'admin';
            var oldItemsJson = row[14] ? row[14].toString().trim() : '[]';
            
            var itemNames = '';
            var totalQty = 0;
            try {
              var items = JSON.parse(oldItemsJson);
              if (Array.isArray(items)) {
                itemNames = items.map(function(i) { return i.productName; }).join(", ");
                totalQty = items.reduce(function(sum, i) { return sum + (parseFloat(i.qty) || 0); }, 0);
              }
            } catch (e) {}
            
            var correctedRow = [
              oldInvoiceNo,
              oldDate,
              oldCustomerName,
              oldPhone,
              oldEmail,
              '',
              itemNames,
              totalQty,
              oldSubtotal,
              oldDiscountPercent,
              oldTotalDiscount,
              oldTotalCGST,
              oldTotalCGST,
              oldTotalSGST,
              oldTotalSGST,
              oldTotalTaxable,
              oldGrandTotal,
              oldCreatedBy,
              oldItemsJson
            ];
            
            salesValues[r] = correctedRow;
            hasSalesChanges = true;
          }
        }
        if (hasSalesChanges) {
          salesRange.setValues(salesValues);
        }
      }
    }
    
    // 3. Upgrade Inventory sheet with minStock and unit
    var invSheet = ss.getSheetByName('Inventory');
    if (invSheet) {
      var invRange = invSheet.getDataRange();
      var invValues = invRange.getValues();
      var invHeaders = invValues[0].map(function(h) { return h.toString().trim(); });
      
      var hasMinStock = false;
      var hasUnit = false;
      
      for (var i = 0; i < invHeaders.length; i++) {
        var hName = invHeaders[i].toLowerCase();
        if (hName === 'minstock') hasMinStock = true;
        if (hName === 'unit') hasUnit = true;
      }
      
      if (!hasMinStock) {
        invHeaders.push('minStock');
        var nextCol = invHeaders.length;
        invSheet.getRange(1, nextCol).setValue('minStock');
        if (invValues.length > 1) {
          for (var r = 1; r < invValues.length; r++) {
            invSheet.getRange(r + 1, nextCol).setValue(10);
          }
        }
      }
      
      if (!hasUnit) {
        invHeaders.push('unit');
        var nextCol = invHeaders.length;
        invSheet.getRange(1, nextCol).setValue('unit');
        if (invValues.length > 1) {
          for (var r = 1; r < invValues.length; r++) {
            invSheet.getRange(r + 1, nextCol).setValue('Nos');
          }
        }
      }
    }
  } catch (err) {
    Logger.log("Error in initializeDatabase: " + err.toString());
  }
}

// Configure headers for CORS
function doGet(e) {
  initializeDatabase();
  var action = e.parameter.action;
  var response = {};

  try {
    if (action === 'inventory') {
      response = getSheetData('Inventory');
    } else if (action === 'customers') {
      response = getSheetData('Customers');
    } else if (action === 'sales') {
      response = getSheetData('Sales');
    } else if (action === 'users') {
      response = getSheetData('Users');
    } else if (action === 'dashboard') {
      response = getDashboardStats();
    } else {
      response = { success: false, message: 'Invalid action' };
    }
  } catch (err) {
    response = { success: false, message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  initializeDatabase();
  var response = {};
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;

    if (action === 'login') {
      response = handleLogin(postData.username, postData.password);
    } else if (action === 'addProduct') {
      response = handleAddProduct(postData);
    } else if (action === 'addCustomer') {
      response = handleAddCustomer(postData);
    } else if (action === 'saveInvoice') {
      response = handleSaveInvoice(postData);
    } else if (action === 'editProduct') {
      response = handleEditProduct(postData);
    } else if (action === 'deleteProduct') {
      response = handleDeleteProduct(postData.productId);
    } else if (action === 'editCustomer') {
      response = handleEditCustomer(postData);
    } else if (action === 'deleteCustomer') {
      response = handleDeleteCustomer(postData.customerId);
    } else if (action === 'addUser') {
      response = handleAddUser(postData);
    } else if (action === 'editUser') {
      response = handleEditUser(postData);
    } else if (action === 'deleteUser') {
      response = handleDeleteUser(postData.username);
    } else if (action === 'changePassword') {
      response = handleChangePassword(postData);
    } else {
      response = { success: false, message: 'Invalid action' };
    }
  } catch (err) {
    response = { success: false, message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// DATA HELPER FUNCTIONS
// ==========================================

function getHeaderIndex(headers, columnName) {
  var lowerName = columnName.toLowerCase();
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().trim().toLowerCase() === lowerName) {
      return i;
    }
  }
  return -1;
}

function getSheetData(sheetName) {
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName(sheetName);
  if (!sheet) return [];
  
  var rows = sheet.getDataRange().getValues();
  if (rows.length <= 1) return [];
  
  var headers = rows[0];
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var key = headers[j].toString().trim();
      var lkey;
      // Handle uppercase acronyms nicely to prevent casing bugs (e.g. GST -> gst)
      if (key === "GST") lkey = "gst";
      else if (key === "CGST") lkey = "cgst";
      else if (key === "SGST") lkey = "sgst";
      else lkey = key.charAt(0).toLowerCase() + key.slice(1);
      
      obj[lkey] = row[j];
    }
    
    // Automatically map single GST column to cgst and sgst fields (split 50-50) for the frontend
    if (sheetName === 'Inventory') {
      var gstVal = parseFloat(obj.gst) || 0;
      obj.cgst = gstVal / 2;
      obj.sgst = gstVal / 2;
      obj.unit = obj.unit || 'Nos'; // fallback unit
    }
    
    data.push(obj);
  }
  return data;
}

function getDashboardStats() {
  var ss = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw');
  var inventorySheet = ss.getSheetByName('Inventory');
  var customersSheet = ss.getSheetByName('Customers');
  var salesSheet = ss.getSheetByName('Sales');

  var productsCount = inventorySheet ? Math.max(0, inventorySheet.getLastRow() - 1) : 0;
  var customersCount = customersSheet ? Math.max(0, customersSheet.getLastRow() - 1) : 0;
  
  var totalSales = 0;
  var recentSales = [];
  var lowStockProducts = [];
  
  var salesTrend = {};
  var productSales = {};

  // Initialize last 7 days map for sales trend
  var oneDayMs = 24 * 60 * 60 * 1000;
  var today = new Date();
  for (var d = 6; d >= 0; d--) {
    var dateObj = new Date(today.getTime() - d * oneDayMs);
    var dateStr = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "yyyy-MM-dd");
    salesTrend[dateStr] = 0;
  }

  // Sum grandTotal from Sales sheet and compile analytics
  if (salesSheet && salesSheet.getLastRow() > 1) {
    var salesRows = salesSheet.getDataRange().getValues();
    var salesHeaders = salesRows[0];
    
    // Find index of headers case-insensitively
    var grandTotalIndex = getHeaderIndex(salesHeaders, 'grandTotal');
    var dateIndex = getHeaderIndex(salesHeaders, 'date');
    var customerIndex = getHeaderIndex(salesHeaders, 'customerName');
    var invoiceIndex = getHeaderIndex(salesHeaders, 'invoiceNo');
    var itemsJsonIndex = getHeaderIndex(salesHeaders, 'itemsJson');
    
    // Sum total and collect recent transactions
    for (var i = salesRows.length - 1; i >= 1; i--) {
      var row = salesRows[i];
      var totalVal = parseFloat(row[grandTotalIndex]) || 0;
      
      // Fallback for old legacy rows where grandTotal was written to Column M (index 12)
      if ((totalVal === 0 || isNaN(totalVal)) && grandTotalIndex !== 12 && row.length > 12) {
        var fallbackVal = parseFloat(row[12]);
        if (!isNaN(fallbackVal) && fallbackVal > 0) {
          totalVal = fallbackVal;
        }
      }
      
      totalSales += totalVal;
      
      var dateVal = row[dateIndex];
      var dateStr = "";
      var formattedDate = "1970-01-01";
      if (dateVal) {
        try {
          var dObj = new Date(dateVal);
          dateStr = Utilities.formatDate(dObj, Session.getScriptTimeZone(), "yyyy-MM-dd");
          formattedDate = dateStr;
        } catch(e) {
          formattedDate = dateVal.toString();
        }
      }
      
      // Add to sales trend if date falls within the last 7 days
      if (dateStr && salesTrend.hasOwnProperty(dateStr)) {
        salesTrend[dateStr] += totalVal;
      }
      
      // Count product quantities for top products analytics
      var itemsJsonStr = row[itemsJsonIndex];
      // Fallback for old legacy rows where itemsJson was written to Column O (index 14)
      if (!itemsJsonStr && itemsJsonIndex !== 14 && row.length > 14) {
        itemsJsonStr = row[14];
      }
      
      if (itemsJsonStr) {
        try {
          var itemsList = JSON.parse(itemsJsonStr);
          if (Array.isArray(itemsList)) {
            itemsList.forEach(function(item) {
              var pName = item.productName || "Unknown Product";
              var qty = parseFloat(item.qty) || 0;
              productSales[pName] = (productSales[pName] || 0) + qty;
            });
          }
        } catch(e) {}
      }
      
      // Collect recent 5 sales
      if (recentSales.length < 5) {
        var invoiceNo = row[invoiceIndex] || "N/A";
        var customerName = row[customerIndex] || "N/A";
        
        // Fallback for old legacy rows where Column C (customerIndex) holds the invoice number (starts with "INV-")
        if (customerName.toString().indexOf("INV-") === 0) {
          invoiceNo = customerName;
          customerName = row[3] || "N/A"; // Actual customer name is in Column D (index 3)
        }
        
        recentSales.push({
          date: formattedDate,
          invoiceNo: invoiceNo,
          customerName: customerName,
          grandTotal: totalVal
        });
      }
    }
  }

  // Compile low-stock items from Inventory sheet
  if (inventorySheet && inventorySheet.getLastRow() > 1) {
    var invData = getSheetData('Inventory');
    for (var k = 0; k < invData.length; k++) {
      var stockVal = parseFloat(invData[k].stock) || 0;
      var thresholdVal = parseFloat(invData[k].minStock) || 10;
      if (stockVal < thresholdVal) {
        lowStockProducts.push({
          productId: invData[k].productId,
          productName: invData[k].productName,
          stock: stockVal,
          rate: parseFloat(invData[k].rate) || 0
        });
      }
    }
  }
  
  // Format sales trend labels and data
  var trendLabels = [];
  var trendData = [];
  for (var key in salesTrend) {
    trendLabels.push(key);
    trendData.push(salesTrend[key]);
  }
  
  // Format top products labels and data
  var topProductsList = [];
  for (var pName in productSales) {
    topProductsList.push({ name: pName, qty: productSales[pName] });
  }
  topProductsList.sort(function(a, b) { return b.qty - a.qty; });
  var topProducts = topProductsList.slice(0, 5);

  return {
    products: productsCount,
    customers: customersCount,
    sales: totalSales,
    recentSales: recentSales,
    lowStock: lowStockProducts,
    analytics: {
      salesTrend: {
        labels: trendLabels,
        data: trendData
      },
      topProducts: {
        labels: topProducts.map(function(x) { return x.name; }),
        data: topProducts.map(function(x) { return x.qty; })
      }
    }
  };
}

// ==========================================
// WRITE ACTIONS
// ==========================================

function hashPassword(password) {
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  var hash = "";
  for (var i = 0; i < digest.length; i++) {
    var byteVal = digest[i];
    if (byteVal < 0) byteVal += 256;
    var byteString = byteVal.toString(16);
    if (byteString.length == 1) byteString = "0" + byteString;
    hash += byteString;
  }
  return hash;
}

function handleLogin(username, password) {
  var users = getSheetData('Users');
  var inputHash = hashPassword(password);
  
  for (var i = 0; i < users.length; i++) {
    if (users[i].username.toString().trim().toLowerCase() === username.toString().trim().toLowerCase()) {
      var storedPassword = users[i].password.toString().trim();
      var isMatch = false;
      
      if (storedPassword.length === 64) {
        isMatch = (storedPassword === inputHash);
      } else {
        // Plaintext fallback (legacy check)
        if (storedPassword === password.toString().trim()) {
          // Auto-migrate to hashed password in the sheet!
          var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Users');
          if (sheet) {
            var rows = sheet.getDataRange().getValues();
            var headers = rows[0];
            var userIdx = getHeaderIndex(headers, 'username');
            var passIdx = getHeaderIndex(headers, 'password');
            if (userIdx !== -1 && passIdx !== -1) {
              for (var r = 1; r < rows.length; r++) {
                if (rows[r][userIdx].toString().trim().toLowerCase() === username.toString().trim().toLowerCase()) {
                  sheet.getRange(r + 1, passIdx + 1).setValue(inputHash);
                  break;
                }
              }
            }
          }
          isMatch = true;
        }
      }
      
      if (isMatch) {
        return {
          success: true,
          user: {
            username: users[i].username,
            name: users[i].name,
            role: users[i].role
          }
        };
      }
    }
  }
  return { success: false, message: 'Invalid username or password' };
}

function handleAddProduct(data) {
  if (!data) {
    Logger.log("Warning: data is undefined. This is expected if running the function directly from the Google Apps Script editor.");
    return { success: false, message: 'No data provided' };
  }
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Inventory');
  if (!sheet) {
    return { success: false, message: 'Inventory sheet not found' };
  }
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var nameIndex = getHeaderIndex(headers, 'productName');
  var newName = (data.productName || '').toString().trim().toLowerCase();
  
  // Check if a product with the same name already exists (case-insensitive)
  if (nameIndex !== -1 && newName !== "") {
    for (var r = 1; r < rows.length; r++) {
      if (rows[r][nameIndex].toString().trim().toLowerCase() === newName) {
        return { success: false, message: 'Product already exists: ' + rows[r][nameIndex] + '. Please try again.' };
      }
    }
  }
  
  var nextRow = sheet.getLastRow() + 1;
  var productId = 'PROD-' + (nextRow + 1000);
  
  // Construct row matching headers dynamically!
  var newRow = new Array(headers.length);
  for (var i = 0; i < headers.length; i++) {
    var h = headers[i].toString().trim();
    var val = '';
    if (h === 'productId') val = productId;
    else if (h === 'productName') val = data.productName || '';
    else if (h === 'category') val = data.category || '';
    else if (h === 'stock') val = parseFloat(data.stock) || 0;
    else if (h === 'rate') val = parseFloat(data.rate) || 0;
    else if (h === 'gst') val = (parseFloat(data.cgst) || 0) + (parseFloat(data.sgst) || 0);
    else if (h === 'cgst') val = parseFloat(data.cgst) || 0;
    else if (h === 'sgst') val = parseFloat(data.sgst) || 0;
    else if (h === 'unit') val = data.unit || 'Nos';
    else if (h === 'minStock') val = parseFloat(data.minStock) || 10;
    newRow[i] = val;
  }
  
  sheet.appendRow(newRow);
  return { success: true, productId: productId };
}

function handleAddCustomer(data) {
  if (!data) {
    Logger.log("Warning: data is undefined. This is expected if running the function directly from the Google Apps Script editor.");
    return { success: false, message: 'No data provided' };
  }
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Customers');
  if (!sheet) {
    return { success: false, message: 'Customers sheet not found' };
  }
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var phoneIndex = getHeaderIndex(headers, 'phone');
  var emailIndex = getHeaderIndex(headers, 'email');
  var nameIndex = getHeaderIndex(headers, 'name');
  var newPhone = (data.phone || '').toString().trim();
  var newEmail = (data.email || '').toString().trim().toLowerCase();
  
  // Check duplicate phone or email
  for (var r = 1; r < rows.length; r++) {
    var rowPhone = phoneIndex !== -1 ? rows[r][phoneIndex].toString().trim() : "";
    var rowEmail = emailIndex !== -1 ? rows[r][emailIndex].toString().trim().toLowerCase() : "";
    
    if ((newPhone !== "" && rowPhone === newPhone) || (newEmail !== "" && rowEmail === newEmail)) {
      var existingName = nameIndex !== -1 ? rows[r][nameIndex] : 'Unknown Customer';
      var matchedField = (newPhone !== "" && rowPhone === newPhone) ? 'phone number' : 'email';
      return { 
        success: false, 
        message: 'Customer account already exists with this ' + matchedField + ' (Name: ' + existingName + '). Please try again.' 
      };
    }
  }
  
  var nextRow = sheet.getLastRow() + 1;
  var customerId = 'CUST-' + (nextRow + 1000);
  
  var newRow = [
    customerId,
    data.name || '',
    data.phone || '',
    data.email || '',
    data.address || ''
  ];
  
  sheet.appendRow(newRow);
  return { success: true, customerId: customerId };
}

function handleSaveInvoice(data) {
  if (!data) {
    Logger.log("Warning: data is undefined. This is expected if running the function directly from the Google Apps Script editor.");
    return { success: false, message: 'No data provided' };
  }
  var ss = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw');
  var salesSheet = ss.getSheetByName('Sales');
  var inventorySheet = ss.getSheetByName('Inventory');
  
  if (!salesSheet || !inventorySheet) {
    return { success: false, message: 'Database sheets are missing' };
  }

  // 1. Log to Sales sheet
  var nextSaleRow = salesSheet.getLastRow() + 1;
  var saleId = 'SALE-' + (nextSaleRow + 1000);
  var saleDate = new Date();
  
  // In your Sales sheet, the columns are:
  // Column A: InvoiceNo, Column B: Date, Column C: CustomerName, Column D: Phone, Column E: Email, Column F: Address, 
  // Column G: Items, Column H: Qty, Column I: SubTotal, Column J: discountPercent, Column K: totalDiscount, 
  // Column L: CGST, Column M: totalCGST, Column N: SGST, Column O: totalSGST, Column P: totalTaxable, Column Q: grandTotal, 
  // Column R: createdBy, Column S: itemsJson
  var newSaleRow = [
    data.invoiceNo || '',                  // Column A: InvoiceNo (contains receipt ID e.g. INV-69524793)
    saleDate,                              // Column B: Date
    data.customerName || '',               // Column C: CustomerName
    data.customerPhone || '',              // Column D: Phone
    data.customerEmail || '',              // Column E: Email
    data.customerAddress || '',            // Column F: Address
    data.items ? data.items.map(function(i) { return i.productName; }).join(", ") : '', // Column G: Items (comma-separated names)
    data.items ? data.items.reduce(function(sum, i) { return sum + (parseFloat(i.qty) || 0); }, 0) : 0, // Column H: Qty
    parseFloat(data.subtotal) || 0,        // Column I: SubTotal (taxable subtotal)
    parseFloat(data.discountPercent) || 0, // Column J: discountPercent
    parseFloat(data.totalDiscount) || 0,   // Column K: totalDiscount
    parseFloat(data.totalCGST) || 0,       // Column L: CGST (CGST tax amount)
    parseFloat(data.totalCGST) || 0,       // Column M: totalCGST
    parseFloat(data.totalSGST) || 0,       // Column N: SGST
    parseFloat(data.totalSGST) || 0,       // Column O: totalSGST
    (parseFloat(data.totalCGST) || 0) + (parseFloat(data.totalSGST) || 0), // Column P: totalTaxable
    parseFloat(data.grandTotal) || 0,      // Column Q: grandTotal
    data.createdBy || 'admin',             // Column R: createdBy (username)
    JSON.stringify(data.items || [])       // Column S: itemsJson
  ];
  
  salesSheet.appendRow(newSaleRow);

  // 2. Deduct inventory quantities
  var invRows = inventorySheet.getDataRange().getValues();
  var invHeaders = invRows[0];
  var idIndex = getHeaderIndex(invHeaders, 'productId');
  var stockIndex = getHeaderIndex(invHeaders, 'stock');

  if (idIndex !== -1 && stockIndex !== -1) {
    var items = data.items || [];
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var pId = item.productId;
      var qtyToDeduct = parseFloat(item.qty) || 0;

      // Find the row matching the product ID
      for (var r = 1; r < invRows.length; r++) {
        if (invRows[r][idIndex].toString() === pId.toString()) {
          var currentStock = parseFloat(invRows[r][stockIndex]) || 0;
          var newStock = currentStock - qtyToDeduct;
          inventorySheet.getRange(r + 1, stockIndex + 1).setValue(newStock);
          break;
        }
      }
    }
  }

  // 3. Send HTML email with invoice table in body (no PDF attachment needed —
  //    the browser downloads the PDF locally after this API call returns)
  var emailSent  = false;
  var emailError = '';

  if (data.customerEmail) {
    try {
      var invoiceDate = data.invoiceDate || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy');

      // Build items table rows
      var itemRows = '';
      var itemsList = data.items || [];
      for (var ii = 0; ii < itemsList.length; ii++) {
        var it = itemsList[ii];
        itemRows += '<tr style="border-bottom:1px solid #e2e8f0;">' +
          '<td style="padding:8px 6px;text-align:center;">' + (ii + 1) + '</td>' +
          '<td style="padding:8px 6px;text-align:left;font-weight:600;">' + (it.productName || '') + '</td>' +
          '<td style="padding:8px 6px;text-align:center;">' + (it.qty || 0) + '</td>' +
          '<td style="padding:8px 6px;text-align:center;">' + (it.unit || 'Nos') + '</td>' +
          '<td style="padding:8px 6px;text-align:right;">\u20B9' + parseFloat(it.rate || 0).toFixed(2) + '</td>' +
          '<td style="padding:8px 6px;text-align:center;">' + (it.discount || 0) + '%</td>' +
          '<td style="padding:8px 6px;text-align:center;">' + (it.cgst || 0) + '%</td>' +
          '<td style="padding:8px 6px;text-align:center;">' + (it.sgst || 0) + '%</td>' +
          '<td style="padding:8px 6px;text-align:right;font-weight:700;">\u20B9' + parseFloat(it.total || 0).toFixed(2) + '</td>' +
        '</tr>';
      }

      var htmlBody =
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<style>' +
          '@media only screen and (max-width: 600px) {' +
            '.outer-container { padding: 8px !important; }' +
            '.header-container { padding: 16px 12px !important; border-radius: 8px !important; }' +
            '.header-container h1 { font-size: 18px !important; }' +
            '.header-container p { font-size: 11px !important; line-height: 1.3 !important; }' +
            '.card-container { padding: 12px !important; border-radius: 8px !important; }' +
            '.col-left, .col-right { width: 100% !important; display: block !important; text-align: left !important; }' +
            '.col-right { margin-top: 15px !important; text-align: left !important; }' +
            '.item-table th, .item-table td { padding: 6px 4px !important; font-size: 11px !important; }' +
            '.totals-table { width: 100% !important; max-width: 100% !important; }' +
          '}' +
        '</style>' +
        '</head><body style="margin:0;padding:0;background:#f8fafc;">' +
        '<div class="outer-container" style="font-family:Arial,sans-serif;max-width:800px;margin:auto;background:#f8fafc;padding:20px;">' +
          // Header
          '<div class="header-container" style="background:linear-gradient(135deg,#0b1329,#1e3a8a);border-radius:12px;padding:24px 28px;margin-bottom:20px;color:white;">' +
            '<h1 style="margin:0 0 4px;font-size:22px;">Seetha Rama Electricals</h1>' +
            '<p style="margin:0;font-size:12px;color:#93c5fd;">Authorized Dealers in CRI Pumps \u00B7 Sudhakar Pipes \u00B7 Polycab Wires</p>' +
            '<p style="margin:4px 0 0;font-size:12px;color:#bfdbfe;">Cherla, Bhadradri Kothagudem, Telangana \u2022 Ph: 9441494703 \u2022 GST: 36CWSPK2207B1ZQ</p>' +
          '</div>' +
          // Invoice Meta
          '<div class="card-container" style="background:white;border-radius:10px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;">' +
            '<table style="width:100%;border-collapse:collapse;">' +
              '<tr>' +
                '<td class="col-left" style="width:50%;vertical-align:top;">' +
                  '<div style="font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;margin-bottom:6px;">Billed To</div>' +
                  '<div style="font-weight:700;font-size:16px;">' + (data.customerName || '') + '</div>' +
                  '<div style="font-size:13px;color:#475569;">' + (data.customerAddress || '') + '</div>' +
                  '<div style="font-size:13px;color:#475569;">Ph: ' + (data.customerPhone || '') + '</div>' +
                '</td>' +
                '<td class="col-right" style="width:50%;text-align:right;vertical-align:top;">' +
                  '<div style="font-size:20px;font-weight:800;color:#1e3a8a;">INVOICE</div>' +
                  '<div style="font-size:13px;margin-top:8px;"><strong>Invoice No:</strong> ' + (data.invoiceNo || '') + '</div>' +
                  '<div style="font-size:13px;"><strong>Date:</strong> ' + invoiceDate + '</div>' +
                '</td>' +
              '</tr>' +
            '</table>' +
          '</div>' +
          // Items Table
          '<div class="card-container table-container" style="background:white;border-radius:10px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;overflow-x:auto;-webkit-overflow-scrolling:touch;">' +
            '<table class="item-table" style="width:100%;border-collapse:collapse;font-size:13px;">' +
              '<thead>' +
                '<tr style="background:linear-gradient(to right,#1e3a8a,#2563eb);color:white;">' +
                  '<th style="padding:10px 6px;text-align:center;">#</th>' +
                  '<th style="padding:10px 6px;text-align:left;">Product</th>' +
                  '<th style="padding:10px 6px;text-align:center;">Qty</th>' +
                  '<th style="padding:10px 6px;text-align:center;">Unit</th>' +
                  '<th style="padding:10px 6px;text-align:right;">Rate</th>' +
                  '<th style="padding:10px 6px;text-align:center;">Disc%</th>' +
                  '<th style="padding:10px 6px;text-align:center;">CGST%</th>' +
                  '<th style="padding:10px 6px;text-align:center;">SGST%</th>' +
                  '<th style="padding:10px 6px;text-align:right;">Total</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' + itemRows + '</tbody>' +
            '</table>' +
          '</div>' +
          // Totals
          '<div class="card-container" style="background:white;border-radius:10px;padding:20px;margin-bottom:16px;border:1px solid #e2e8f0;">' +
            '<table class="totals-table" style="width:100%;max-width:340px;margin-left:auto;border-collapse:collapse;font-size:14px;">' +
              '<tr><td style="padding:6px 0;color:#64748b;">Subtotal (without tax)</td><td style="text-align:right;font-weight:600;">\u20B9' + (parseFloat(data.subtotal || 0) + parseFloat(data.totalDiscount || 0)).toFixed(2) + '</td></tr>' +
              '<tr><td style="padding:6px 0;color:#64748b;">Subtotal (Taxable)</td><td style="text-align:right;font-weight:600;">\u20B9' + parseFloat(data.subtotal || 0).toFixed(2) + '</td></tr>' +
              '<tr><td style="padding:6px 0;color:#64748b;">CGST</td><td style="text-align:right;font-weight:600;">\u20B9' + parseFloat(data.totalCGST || 0).toFixed(2) + '</td></tr>' +
              '<tr><td style="padding:6px 0;color:#64748b;">SGST</td><td style="text-align:right;font-weight:600;">\u20B9' + parseFloat(data.totalSGST || 0).toFixed(2) + '</td></tr>' +
              '<tr style="background:#1e3a8a;color:white;border-radius:8px;">' +
                '<td style="padding:12px 10px;font-size:16px;font-weight:700;border-radius:8px 0 0 8px;">Grand Total (subtotal+tax)</td>' +
                '<td style="padding:12px 10px;text-align:right;font-size:18px;font-weight:800;border-radius:0 8px 8px 0;">\u20B9' + parseFloat(data.grandTotal || 0).toFixed(2) + '</td>' +
              '</tr>' +
            '</table>' +
            '<p style="font-size:12px;color:#64748b;margin-top:12px;font-style:italic;">Amount in Words: ' + (data.amountWords || '') + '</p>' +
          '</div>' +
          // Footer
          '<div style="text-align:center;font-size:12px;color:#94a3b8;padding-top:12px;border-top:1px solid #e2e8f0;">' +
            'Goods once sold will not be taken back. Thank you for your business!<br>' +
            'Seetha Rama Electricals \u2022 Cherla, Bhadradri Kothagudem, Telangana \u2022 Ph: 9441494703' +
          '</div>' +
        '</div></body></html>';

      var plainText = 'Dear ' + (data.customerName || 'Customer') + ',\n\n' +
        'Thank you for your purchase. Please find your Invoice details below.\n\n' +
        'Invoice No: ' + (data.invoiceNo || '') + '\n' +
        'Date: ' + invoiceDate + '\n' +
        'Grand Total: \u20B9' + parseFloat(data.grandTotal || 0).toFixed(2) + '\n' +
        '(' + (data.amountWords || '') + ')\n\n' +
        'The full invoice has been sent to you in HTML format. You can also find the PDF invoice attached by the sender.\n\n' +
        'Best regards,\nSeetha Rama Electricals\nPhone: 9441494703\nCherla, Bhadradri Kothagudem, Telangana';

      var mailOptions = { htmlBody: htmlBody };
      if (data.pdfBase64) {
        try {
          var decodedPdf = Utilities.base64Decode(data.pdfBase64);
          var pdfBlob = Utilities.newBlob(decodedPdf, 'application/pdf', 'Invoice-' + (data.invoiceNo || 'draft') + '.pdf');
          mailOptions.attachments = [pdfBlob];
        } catch (pdfDecodeErr) {
          Logger.log('PDF decode/attachment error: ' + pdfDecodeErr.toString());
        }
      }

      GmailApp.sendEmail(data.customerEmail,
        'Invoice ' + (data.invoiceNo || '') + ' \u2014 Seetha Rama Electricals',
        plainText,
        mailOptions
      );
      emailSent = true;
    } catch (emailErr) {
      emailError = emailErr.toString();
      Logger.log('Email error: ' + emailError);
    }
  }

  return { success: true, saleId: saleId, emailSent: emailSent, emailError: emailError };
}

function handleEditProduct(data) {
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Inventory');
  if (!sheet) return { success: false, message: 'Inventory sheet not found' };
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idIndex = getHeaderIndex(headers, 'productId');
  var nameIndex = getHeaderIndex(headers, 'productName');
  var catIndex = getHeaderIndex(headers, 'category');
  var stockIndex = getHeaderIndex(headers, 'stock');
  var rateIndex = getHeaderIndex(headers, 'rate');
  var gstIndex = getHeaderIndex(headers, 'gst');
  var minStockIndex = getHeaderIndex(headers, 'minStock');

  var pId = data.productId;
  var foundRow = -1;
  
  for (var r = 1; r < rows.length; r++) {
    if (rows[r][idIndex].toString() === pId.toString()) {
      foundRow = r + 1; // 1-based index
      break;
    }
  }
  
  if (foundRow === -1) return { success: false, message: 'Product not found' };
  
  // Check duplicate product names for other products
  var newName = (data.productName || '').toString().trim().toLowerCase();
  if (nameIndex !== -1 && newName !== "") {
    for (var r = 1; r < rows.length; r++) {
      if ((r + 1) !== foundRow && rows[r][nameIndex].toString().trim().toLowerCase() === newName) {
        return { success: false, message: 'Another product already exists with name: ' + rows[r][nameIndex] + '. Please try again.' };
      }
    }
  }
  
  if (nameIndex !== -1) sheet.getRange(foundRow, nameIndex + 1).setValue(data.productName || '');
  if (catIndex !== -1) sheet.getRange(foundRow, catIndex + 1).setValue(data.category || '');
  if (stockIndex !== -1) sheet.getRange(foundRow, stockIndex + 1).setValue(parseFloat(data.stock) || 0);
  if (rateIndex !== -1) sheet.getRange(foundRow, rateIndex + 1).setValue(parseFloat(data.rate) || 0);
  if (gstIndex !== -1) sheet.getRange(foundRow, gstIndex + 1).setValue((parseFloat(data.cgst) || 0) + (parseFloat(data.sgst) || 0));
  if (minStockIndex !== -1) sheet.getRange(foundRow, minStockIndex + 1).setValue(parseFloat(data.minStock) || 10);

  return { success: true };
}

function handleDeleteProduct(productId) {
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Inventory');
  if (!sheet) return { success: false, message: 'Inventory sheet not found' };
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idIndex = getHeaderIndex(headers, 'productId');
  
  for (var r = 1; r < rows.length; r++) {
    if (rows[r][idIndex].toString() === productId.toString()) {
      sheet.deleteRow(r + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Product not found' };
}

function handleEditCustomer(data) {
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Customers');
  if (!sheet) return { success: false, message: 'Customers sheet not found' };
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idIndex = getHeaderIndex(headers, 'customerId');
  var nameIndex = getHeaderIndex(headers, 'name');
  var phoneIndex = getHeaderIndex(headers, 'phone');
  var emailIndex = getHeaderIndex(headers, 'email');
  var addrIndex = getHeaderIndex(headers, 'address');

  var cId = data.customerId;
  var foundRow = -1;
  
  for (var r = 1; r < rows.length; r++) {
    if (rows[r][idIndex].toString() === cId.toString()) {
      foundRow = r + 1;
      break;
    }
  }
  
  if (foundRow === -1) return { success: false, message: 'Customer not found' };
  
  // Check phone and email duplicates for other customers
  var newPhone = (data.phone || '').toString().trim();
  var newEmail = (data.email || '').toString().trim().toLowerCase();
  for (var r = 1; r < rows.length; r++) {
    if ((r + 1) !== foundRow) {
      var rowPhone = phoneIndex !== -1 ? rows[r][phoneIndex].toString().trim() : "";
      var rowEmail = emailIndex !== -1 ? rows[r][emailIndex].toString().trim().toLowerCase() : "";
      
      if ((newPhone !== "" && rowPhone === newPhone) || (newEmail !== "" && rowEmail === newEmail)) {
        var existingName = nameIndex !== -1 ? rows[r][nameIndex] : 'Unknown Customer';
        var matchedField = (newPhone !== "" && rowPhone === newPhone) ? 'phone number' : 'email';
        return { 
          success: false, 
          message: 'Another customer account already exists with this ' + matchedField + ' (Name: ' + existingName + '). Please try again.' 
        };
      }
    }
  }
  
  if (nameIndex !== -1) sheet.getRange(foundRow, nameIndex + 1).setValue(data.name || '');
  if (phoneIndex !== -1) sheet.getRange(foundRow, phoneIndex + 1).setValue(data.phone || '');
  if (emailIndex !== -1) sheet.getRange(foundRow, emailIndex + 1).setValue(data.email || '');
  if (addrIndex !== -1) sheet.getRange(foundRow, addrIndex + 1).setValue(data.address || '');

  return { success: true };
}

function handleDeleteCustomer(customerId) {
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Customers');
  if (!sheet) return { success: false, message: 'Customers sheet not found' };
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var idIndex = getHeaderIndex(headers, 'customerId');
  
  for (var r = 1; r < rows.length; r++) {
    if (rows[r][idIndex].toString() === customerId.toString()) {
      sheet.deleteRow(r + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Customer not found' };
}

function handleAddUser(data) {
  if (!data) return { success: false, message: 'No data provided' };
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Users');
  if (!sheet) return { success: false, message: 'Users sheet not found' };
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var userIdx = getHeaderIndex(headers, 'username');
  var newUsername = (data.username || '').toString().trim().toLowerCase();
  
  if (userIdx !== -1 && newUsername !== "") {
    for (var r = 1; r < rows.length; r++) {
      if (rows[r][userIdx].toString().trim().toLowerCase() === newUsername) {
        return { success: false, message: 'Username already exists: ' + data.username };
      }
    }
  }
  
  // Append new row matching corrected schema: userId, username, password, name, role, status
  var newRow = [
    'U00' + (sheet.getLastRow() + 1),
    data.username || '',
    hashPassword(data.password || ''),
    data.name || '',
    data.role || 'staff',
    'Active'
  ];
  sheet.appendRow(newRow);
  return { success: true };
}

function handleEditUser(data) {
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Users');
  if (!sheet) return { success: false, message: 'Users sheet not found' };
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var userIdx = getHeaderIndex(headers, 'username');
  var passIdx = getHeaderIndex(headers, 'password');
  var nameIdx = getHeaderIndex(headers, 'name');
  var roleIdx = getHeaderIndex(headers, 'role');
  
  var username = data.username;
  var foundRow = -1;
  
  for (var r = 1; r < rows.length; r++) {
    if (rows[r][userIdx].toString().trim().toLowerCase() === username.toString().trim().toLowerCase()) {
      foundRow = r + 1;
      break;
    }
  }
  
  if (foundRow === -1) return { success: false, message: 'User not found' };
  
  if (nameIdx !== -1) sheet.getRange(foundRow, nameIdx + 1).setValue(data.name || '');
  if (roleIdx !== -1) sheet.getRange(foundRow, roleIdx + 1).setValue(data.role || 'staff');
  
  // Only update password if a new one is provided
  if (data.password && data.password.trim() !== "" && passIdx !== -1) {
    sheet.getRange(foundRow, passIdx + 1).setValue(hashPassword(data.password.trim()));
  }
  
  return { success: true };
}

function handleDeleteUser(username) {
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Users');
  if (!sheet) return { success: false, message: 'Users sheet not found' };
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var userIdx = getHeaderIndex(headers, 'username');
  
  for (var r = 1; r < rows.length; r++) {
    if (rows[r][userIdx].toString().trim().toLowerCase() === username.toString().trim().toLowerCase()) {
      sheet.deleteRow(r + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'User not found' };
}

function handleChangePassword(data) {
  if (!data) return { success: false, message: 'No data provided' };
  var sheet = SpreadsheetApp.openById('11xzihA8eclDMrW4NxvQtlR5b7z6gC6zfZ1S0HSfgjIw').getSheetByName('Users');
  if (!sheet) return { success: false, message: 'Users sheet not found' };
  
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var userIdx = getHeaderIndex(headers, 'username');
  var passIdx = getHeaderIndex(headers, 'password');
  
  var username = (data.username || '').toString().trim().toLowerCase();
  var currentPassword = data.currentPassword;
  var newPassword = data.newPassword;
  
  var foundRow = -1;
  var storedPassword = "";
  for (var r = 1; r < rows.length; r++) {
    if (rows[r][userIdx].toString().trim().toLowerCase() === username) {
      foundRow = r + 1;
      storedPassword = rows[r][passIdx].toString().trim();
      break;
    }
  }
  
  if (foundRow === -1) return { success: false, message: 'User not found' };
  
  // Verify current password
  var currentHash = hashPassword(currentPassword);
  var isMatch = false;
  if (storedPassword.length === 64) {
    isMatch = (storedPassword === currentHash);
  } else {
    isMatch = (storedPassword === currentPassword.toString().trim());
  }
  
  if (!isMatch) return { success: false, message: 'Incorrect current password' };
  
  // Update to new hashed password
  sheet.getRange(foundRow, passIdx + 1).setValue(hashPassword(newPassword));
  return { success: true };
}

function sendDailyLowStockEmail() {
  var email = Session.getActiveUser().getEmail();
  if (!email) return;
  
  var invData = getSheetData('Inventory');
  var lowStockItems = [];
  for (var i = 0; i < invData.length; i++) {
    var stock = parseFloat(invData[i].stock) || 0;
    var minStock = parseFloat(invData[i].minStock) || 10;
    if (stock < minStock) {
      lowStockItems.push(invData[i]);
    }
  }
  
  if (lowStockItems.length === 0) return;
  
  var tableRows = "";
  for (var j = 0; j < lowStockItems.length; j++) {
    var item = lowStockItems[j];
    tableRows += '<tr style="border-bottom: 1px solid #e2e8f0;">' +
      '<td style="padding: 10px; font-weight: 600;">' + item.productId + '</td>' +
      '<td style="padding: 10px;">' + item.productName + '</td>' +
      '<td style="padding: 10px;">' + item.category + '</td>' +
      '<td style="padding: 10px; color: #ef4444; font-weight: 700;">' + item.stock + ' ' + (item.unit || 'Nos') + '</td>' +
      '<td style="padding: 10px; font-weight: 600; text-align: right;">₹' + (parseFloat(item.rate) || 0).toFixed(2) + '</td>' +
      '</tr>';
  }
  
  var htmlBody = 
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #f8fafc; padding: 20px;">' +
      '<div style="background: linear-gradient(135deg, #0b1329, #1e3a8a); border-radius: 12px; padding: 20px; color: white; margin-bottom: 20px;">' +
        '<h2 style="margin: 0; font-size: 20px;">⚠️ Low Stock Alert</h2>' +
        '<p style="margin: 4px 0 0; font-size: 13px; color: #bfdbfe;">Inventory Pro daily digest report</p>' +
      '</div>' +
      '<div style="background: white; border-radius: 10px; padding: 20px; border: 1px solid #e2e8f0; margin-bottom: 20px;">' +
        '<p style="font-size: 14px; margin-bottom: 16px;">The following items in your inventory have fallen below their configured low stock alert thresholds:</p>' +
        '<table style="width: 100%; border-collapse: collapse; font-size: 13px;">' +
          '<thead>' +
            '<tr style="background: #f1f5f9; text-align: left;">' +
              '<th style="padding: 10px;">ID</th>' +
              '<th style="padding: 10px;">Product Name</th>' +
              '<th style="padding: 10px;">Category</th>' +
              '<th style="padding: 10px;">Stock Left</th>' +
              '<th style="padding: 10px; text-align: right;">Rate</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' + tableRows + '</tbody>' +
        '</table>' +
      '</div>' +
      '<div style="text-align: center; font-size: 11px; color: #94a3b8;">' +
        'This is an automated notification from Seetha Rama Electricals Inventory Pro.' +
      '</div>' +
    '</div>';
    
  GmailApp.sendEmail(email, "⚠️ Inventory Pro: Daily Low Stock Alert", "", {
    htmlBody: htmlBody
  });
}

