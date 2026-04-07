// ===========================================
// KONFIGURASI UTAMA
// ===========================================

const CONFIG = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'),
  DRIVE_FOLDER_ID: PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID'),
  MAX_FILE_SIZE: 2097152, // 2MB
  CACHE_DURATION: 300,
  JWT_SECRET: PropertiesService.getScriptProperties().getProperty('JWT_SECRET') || 'your-secret-key-min-32-chars-long',
  SESSION_DURATION: 86400,
  LOCK_TIMEOUT: 15000
};

const CACHE = CacheService.getScriptCache();

// ===========================================
// SHEET SCHEMA DEFINITIONS
// ===========================================

const SHEET_SCHEMAS = {
  Users: [
    'id', 'username', 'passwordHash', 'fullName', 'email', 'phone',
    'role', 'division', 'photoUrl', 'permissions', 'isActive',
    'lastLogin', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
  ],
  
  Customers: [
    'id', 'customerCode', 'customerName', 'address', 'city', 'province',
    'postalCode', 'googleMapsUrl', 'picName', 'picPosition', 'picPhone',
    'picEmail', 'creditLimit', 'currentCredit', 'paymentTerms', 'isActive',
    'notes', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
  ],
  
  Products: [
    'id', 'productCode', 'productName', 'category', 'baseUnitWeight',
    'basePricePerKg', 'basePricePerUnit', 'isPPN', 'unitName', 'kgName',
    'stockQtyUnit', 'stockQtyKg', 'minStock', 'isActive', 'description',
    'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
  ],
  
  CustomerPrices: [
    'id', 'customerId', 'customerCode', 'customerName', 'productId',
    'productCode', 'productName', 'specialPricePerKg', 'specialPricePerUnit',
    'discountPercent', 'isPPN', 'effectiveDate', 'expiryDate', 'isActive',
    'notes', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
  ],
  
  Transactions: [
    'id', 'invoiceNumber', 'invoiceDate', 'customerId', 'customerCode',
    'customerName', 'customerAddress', 'customerPhone', 'salesId', 'salesName',
    'subtotal', 'taxAmount', 'discountAmount', 'grandTotal', 'paidAmount',
    'remainingAmount', 'paymentStatus', 'deliveryStatus', 'notes',
    'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
  ],
  
  TransactionItems: [
    'id', 'transactionId', 'invoiceNumber', 'productId', 'productCode',
    'productName', 'unitWeight', 'pricePerKg', 'pricePerUnit', 'qtyOrderUnit',
    'qtyOrderKg', 'qtyFulfilledUnit', 'qtyFulfilledKg', 'qtyUnfulfilledUnit',
    'qtyUnfulfilledKg', 'unitName', 'kgName', 'isPPN', 'subtotal', 'taxAmount',
    'totalAmount', 'fulfillmentStatus', 'notes', 'createdAt'
  ],
  
  Deliveries: [
    'id', 'deliveryNumber', 'deliveryDate', 'transactionId', 'invoiceNumber',
    'customerId', 'customerCode', 'customerName', 'customerAddress',
    'customerPhone', 'googleMapsUrl', 'driverId', 'driverName', 'driverPhone',
    'vehicleId', 'vehiclePlate', 'vehicleType', 'totalItems', 'totalWeight',
    'deliveryStatus', 'deliveryTime', 'receiverName', 'receiverSignature',
    'deliveryPhoto', 'notes', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
  ],
  
  DeliveryItems: [
    'id', 'deliveryId', 'deliveryNumber', 'transactionItemId', 'productId',
    'productCode', 'productName', 'qtyDeliveredUnit', 'qtyDeliveredKg',
    'unitName', 'kgName', 'notes', 'createdAt'
  ],
  
  Drivers: [
    'id', 'driverCode', 'driverName', 'phone', 'licenseNumber', 'licenseExpiry',
    'address', 'isActive', 'notes', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
  ],
  
  Vehicles: [
    'id', 'vehiclePlate', 'vehicleType', 'vehicleBrand', 'vehicleModel',
    'maxCapacityKg', 'stnkExpiry', 'kirExpiry', 'isActive', 'notes',
    'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
  ],
  
  SalesTargets: [
    'id', 'year', 'month', 'targetType', 'targetEntityId', 'targetEntityName',
    'targetAmount', 'targetQtyUnit', 'targetQtyKg', 'targetCustomerCount',
    'achievedAmount', 'achievedQtyUnit', 'achievedQtyKg', 'achievedCustomerCount',
    'achievementPercent', 'notes', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
  ],
  
  Config: [
    'id', 'key', 'value', 'description', 'createdAt', 'updatedAt'
  ],
  
  AuditLogs: [
    'id', 'userId', 'userName', 'userRole', 'action', 'module',
    'entityId', 'entityType', 'dataBefore', 'dataAfter', 'notes',
    'ipAddress', 'userAgent', 'timestamp', 'createdAt'
  ]
};

// ===========================================
// AUTO SETUP SERVICE
// ===========================================

const SetupService = {
  
  /**
   * Main initialization function - creates all sheets and headers
   */
  initialize: function() {
    const results = {
      sheetsCreated: [],
      sheetsExisting: [],
      headersAdded: [],
      errors: []
    };
    
    try {
      const ss = this.getOrCreateSpreadsheet();
      
      // Create all sheets with headers
      Object.keys(SHEET_SCHEMAS).forEach(sheetName => {
        try {
          const sheetResult = this.ensureSheetWithHeaders(ss, sheetName, SHEET_SCHEMAS[sheetName]);
          
          if (sheetResult.created) {
            results.sheetsCreated.push(sheetName);
          } else {
            results.sheetsExisting.push(sheetName);
          }
          
          if (sheetResult.headersAdded) {
            results.headersAdded.push(sheetName);
          }
        } catch (error) {
          results.errors.push({
            sheet: sheetName,
            error: error.message
          });
        }
      });
      
      // Initialize default data
      this.initializeDefaultData();
      
      // Format sheets
      this.formatAllSheets(ss);
      
      Logger.log('Setup completed: ' + JSON.stringify(results));
      
      return {
        success: true,
        message: 'Initialization completed successfully',
        details: results
      };
      
    } catch (error) {
      Logger.log('Setup error: ' + error.message);
      return {
        success: false,
        error: error.message,
        details: results
      };
    }
  },
  
  /**
   * Get existing spreadsheet or create new one
   */
  getOrCreateSpreadsheet: function() {
    let ss;
    
    if (CONFIG.SPREADSHEET_ID) {
      try {
        ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
        return ss;
      } catch (e) {
        Logger.log('Spreadsheet not found, creating new one...');
      }
    }
    
    // Create new spreadsheet
    ss = SpreadsheetApp.create('Transaction Management System - ' + new Date().toLocaleDateString());
    const newId = ss.getId();
    
    // Save to script properties
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', newId);
    
    // Update CONFIG
    CONFIG.SPREADSHEET_ID = newId;
    
    Logger.log('New spreadsheet created with ID: ' + newId);
    
    return ss;
  },
  
  /**
   * Ensure sheet exists with proper headers
   */
  ensureSheetWithHeaders: function(ss, sheetName, headers) {
    let sheet = ss.getSheetByName(sheetName);
    let created = false;
    let headersAdded = false;
    
    if (!sheet) {
      // Create new sheet
      sheet = ss.insertSheet(sheetName);
      created = true;
      Logger.log('Created sheet: ' + sheetName);
    }
    
    // Check if headers exist
    const existingHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
    const hasValidHeaders = existingHeaders.length >= headers.length && 
                           existingHeaders[0] === headers[0];
    
    if (!hasValidHeaders || created) {
      // Set headers
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      headersAdded = true;
      
      // Format header row
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      
      // Freeze header row
      sheet.setFrozenRows(1);
      
      Logger.log('Headers added to sheet: ' + sheetName);
    }
    
    return { created, headersAdded };
  },
  
  /**
   * Initialize default configuration and admin user
   */
  initializeDefaultData: function() {
    // Initialize Config
    const defaultConfigs = [
      { key: 'APP_NAME', value: 'Sistem Manajemen Transaksi', description: 'Nama aplikasi' },
      { key: 'APP_VERSION', value: '3.0.0', description: 'Versi aplikasi' },
      { key: 'COMPANY_NAME', value: 'PT. Contoh Indonesia', description: 'Nama perusahaan' },
      { key: 'COMPANY_ADDRESS', value: '', description: 'Alamat perusahaan' },
      { key: 'COMPANY_PHONE', value: '', description: 'Telepon perusahaan' },
      { key: 'COMPANY_EMAIL', value: '', description: 'Email perusahaan' },
      { key: 'LOGO_URL', value: '', description: 'URL logo perusahaan' },
      { key: 'BANNER_URL', value: '', description: 'URL banner' },
      { key: 'TAX_RATE', value: '11', description: 'Tarif PPN (%)' },
      { key: 'INVOICE_PREFIX', value: 'INV', description: 'Prefix nomor invoice' },
      { key: 'DELIVERY_PREFIX', value: 'SJ', description: 'Prefix nomor surat jalan' }
    ];
    
    defaultConfigs.forEach(config => {
      try {
        const existing = Database.getOneByColumn('Config', 'key', config.key, false);
        if (!existing) {
          Database.insert('Config', config);
          Logger.log('Config created: ' + config.key);
        }
      } catch (e) {
        Logger.log('Error creating config ' + config.key + ': ' + e.message);
      }
    });
    
    // Create admin user if not exists
    try {
      const adminExists = Database.getOneByColumn('Users', 'username', 'admin', false);
      
      if (!adminExists) {
        Database.insert('Users', {
          username: 'admin',
          passwordHash: Utils.hashPassword('admin123'),
          fullName: 'Administrator',
          email: 'admin@example.com',
          phone: '',
          role: 'SuperAdmin',
          division: '',
          photoUrl: '',
          permissions: JSON.stringify([
            'dashboard.view',
            'transaction.create', 'transaction.read', 'transaction.update', 'transaction.delete',
            'delivery.create', 'delivery.read', 'delivery.update', 'delivery.delete',
            'report.view', 'report.export',
            'customer.create', 'customer.read', 'customer.update', 'customer.delete',
            'product.create', 'product.read', 'product.update', 'product.delete',
            'user.create', 'user.read', 'user.update', 'user.delete',
            'driver.create', 'driver.read', 'driver.update', 'driver.delete',
            'vehicle.create', 'vehicle.read', 'vehicle.update', 'vehicle.delete',
            'settings.manage', 'target.manage'
          ]),
          isActive: true,
          createdBy: 'system'
        });
        
        Logger.log('Admin user created (username: admin, password: admin123)');
      }
    } catch (e) {
      Logger.log('Error creating admin user: ' + e.message);
    }
  },
  
  /**
   * Format all sheets with proper column widths
   */
  formatAllSheets: function(ss) {
    const columnWidths = {
      'id': 280,
      'username': 120,
      'fullName': 180,
      'email': 200,
      'phone': 130,
      'customerCode': 100,
      'customerName': 200,
      'productCode': 100,
      'productName': 200,
      'address': 250,
      'invoiceNumber': 130,
      'deliveryNumber': 130,
      'notes': 200,
      'createdAt': 160,
      'updatedAt': 160,
      'timestamp': 160
    };
    
    Object.keys(SHEET_SCHEMAS).forEach(sheetName => {
      try {
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) return;
        
        const headers = SHEET_SCHEMAS[sheetName];
        
        headers.forEach((header, index) => {
          const width = columnWidths[header] || 100;
          sheet.setColumnWidth(index + 1, width);
        });
        
      } catch (e) {
        Logger.log('Error formatting sheet ' + sheetName + ': ' + e.message);
      }
    });
  },
  
  /**
   * Validate all sheets have correct structure
   */
  validateSetup: function() {
    const issues = [];
    
    try {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      
      Object.keys(SHEET_SCHEMAS).forEach(sheetName => {
        const sheet = ss.getSheetByName(sheetName);
        
        if (!sheet) {
          issues.push({
            sheet: sheetName,
            issue: 'Sheet does not exist'
          });
          return;
        }
        
        const expectedHeaders = SHEET_SCHEMAS[sheetName];
        const actualHeaders = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
        
        expectedHeaders.forEach((header, index) => {
          if (actualHeaders[index] !== header) {
            issues.push({
              sheet: sheetName,
              issue: `Header mismatch at column ${index + 1}: expected "${header}", got "${actualHeaders[index]}"`
            });
          }
        });
      });
      
      return {
        success: issues.length === 0,
        valid: issues.length === 0,
        issues: issues
      };
      
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.message,
        issues: issues
      };
    }
  },
  
  /**
   * Reset specific sheet (clear data, keep headers)
   */
  resetSheet: function(sheetName) {
    if (!SHEET_SCHEMAS[sheetName]) {
      return { success: false, error: 'Unknown sheet: ' + sheetName };
    }
    
    try {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      const sheet = ss.getSheetByName(sheetName);
      
      if (!sheet) {
        return { success: false, error: 'Sheet not found: ' + sheetName };
      }
      
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      
      // Clear cache
      Database.clearCache(sheetName);
      
      return { success: true, message: 'Sheet reset successfully: ' + sheetName };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// ===========================================
// ENTRY POINTS
// ===========================================

function doGet(e) {
  // Auto-initialize on first access
  ensureInitialized();
  
  return createJsonResponse({
    success: true,
    message: "API is running",
    version: "3.0.0",
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    // Auto-initialize on first access
    ensureInitialized();
    
    const request = JSON.parse(e.postData.contents);
    
    if (!request.action) {
      throw new Error("Action is required");
    }
    
    const result = routeRequest(request);
    return createJsonResponse(result);
    
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Ensure system is initialized before processing requests
 */
function ensureInitialized() {
  const initKey = 'system_initialized';
  const isInitialized = CACHE.get(initKey);
  
  if (!isInitialized) {
    // Check if spreadsheet exists and has all sheets
    try {
      const validation = SetupService.validateSetup();
      
      if (!validation.valid) {
        Logger.log('System not properly initialized, running setup...');
        SetupService.initialize();
      }
      
      // Mark as initialized for cache duration
      CACHE.put(initKey, 'true', 3600); // 1 hour
      
    } catch (error) {
      Logger.log('Initialization check failed: ' + error.message);
      SetupService.initialize();
      CACHE.put(initKey, 'true', 3600);
    }
  }
}

function createJsonResponse(data) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  output.setContent(JSON.stringify(data));
  return output;
}

// ===========================================
// ROUTER
// ===========================================

function routeRequest(request) {
  const action = request.action;
  const data = request.data || {};
  const auth = request.auth || {};
  
  // Public actions (no auth required)
  const publicActions = [
    'auth.login', 
    'auth.refreshToken', 
    'config.getPublic',
    'setup.initialize',
    'setup.validate',
    'setup.status'
  ];
  
  // Validate auth for protected actions
  if (!publicActions.includes(action)) {
    const authResult = validateAuth(auth);
    if (!authResult.valid) {
      return {
        success: false,
        error: "Unauthorized",
        code: "AUTH_REQUIRED"
      };
    }
    data._user = authResult.user;
  }
  
  // Route to handler
  const handlers = {
    // Setup
    'setup.initialize': () => SetupService.initialize(),
    'setup.validate': () => SetupService.validateSetup(),
    'setup.status': () => ({
      success: true,
      data: {
        spreadsheetId: CONFIG.SPREADSHEET_ID,
        initialized: !!CONFIG.SPREADSHEET_ID
      }
    }),
    'setup.resetSheet': () => SetupService.resetSheet(data.sheetName),
    
    // Auth
    'auth.login': () => AuthService.login(data),
    'auth.logout': () => AuthService.logout(data),
    'auth.refreshToken': () => AuthService.refreshToken(data),
    'auth.changePassword': () => AuthService.changePassword(data),
    
    // Config
    'config.getPublic': () => ConfigService.getPublic(),
    'config.getAll': () => ConfigService.getAll(data),
    'config.update': () => ConfigService.update(data),
    
    // Users
    'users.list': () => UserService.list(data),
    'users.get': () => UserService.get(data),
    'users.create': () => UserService.create(data),
    'users.update': () => UserService.update(data),
    'users.delete': () => UserService.delete(data),
    'users.uploadPhoto': () => UserService.uploadPhoto(data),
    
    // Customers
    'customers.list': () => CustomerService.list(data),
    'customers.get': () => CustomerService.get(data),
    'customers.create': () => CustomerService.create(data),
    'customers.update': () => CustomerService.update(data),
    'customers.delete': () => CustomerService.delete(data),
    'customers.search': () => CustomerService.search(data),
    
    // Products
    'products.list': () => ProductService.list(data),
    'products.get': () => ProductService.get(data),
    'products.create': () => ProductService.create(data),
    'products.update': () => ProductService.update(data),
    'products.delete': () => ProductService.delete(data),
    'products.search': () => ProductService.search(data),
    'products.getCustomerPrice': () => ProductService.getCustomerPrice(data),
    
    // Customer Prices
    'customerPrices.list': () => CustomerPriceService.list(data),
    'customerPrices.create': () => CustomerPriceService.create(data),
    'customerPrices.update': () => CustomerPriceService.update(data),
    'customerPrices.delete': () => CustomerPriceService.delete(data),
    
    // Transactions
    'transactions.list': () => TransactionService.list(data),
    'transactions.get': () => TransactionService.get(data),
    'transactions.create': () => TransactionService.create(data),
    'transactions.update': () => TransactionService.update(data),
    'transactions.delete': () => TransactionService.delete(data),
    'transactions.updatePayment': () => TransactionService.updatePayment(data),
    
    // Deliveries
    'deliveries.list': () => DeliveryService.list(data),
    'deliveries.get': () => DeliveryService.get(data),
    'deliveries.create': () => DeliveryService.create(data),
    'deliveries.update': () => DeliveryService.update(data),
    'deliveries.updateStatus': () => DeliveryService.updateStatus(data),
    'deliveries.complete': () => DeliveryService.complete(data),
    'deliveries.uploadProof': () => DeliveryService.uploadProof(data),
    
    // Sales Targets
    'targets.list': () => TargetService.list(data),
    'targets.get': () => TargetService.get(data),
    'targets.create': () => TargetService.create(data),
    'targets.update': () => TargetService.update(data),
    'targets.delete': () => TargetService.delete(data),
    'targets.getAchievement': () => TargetService.getAchievement(data),
    
    // Reports
    'reports.dashboard': () => ReportService.getDashboard(data),
    'reports.sales': () => ReportService.getSalesReport(data),
    'reports.daily': () => ReportService.getDailyReport(data),
    'reports.weekly': () => ReportService.getWeeklyReport(data),
    'reports.monthly': () => ReportService.getMonthlyReport(data),
    'reports.yearly': () => ReportService.getYearlyReport(data),
    'reports.topProducts': () => ReportService.getTopProducts(data),
    'reports.topCustomers': () => ReportService.getTopCustomers(data),
    'reports.targetAchievement': () => ReportService.getTargetAchievement(data),
    
    // Export
    'export.transactions': () => ExportService.exportTransactions(data),
    'export.deliveries': () => ExportService.exportDeliveries(data),
    'export.report': () => ExportService.exportReport(data),
    
    // Drivers & Vehicles
    'drivers.list': () => DriverService.list(data),
    'drivers.get': () => DriverService.get(data),
    'drivers.create': () => DriverService.create(data),
    'drivers.update': () => DriverService.update(data),
    'drivers.delete': () => DriverService.delete(data),
    
    'vehicles.list': () => VehicleService.list(data),
    'vehicles.get': () => VehicleService.get(data),
    'vehicles.create': () => VehicleService.create(data),
    'vehicles.update': () => VehicleService.update(data),
    'vehicles.delete': () => VehicleService.delete(data),
    
    // File Upload
    'files.upload': () => FileService.upload(data),
    'files.delete': () => FileService.delete(data)
  };
  
  const handler = handlers[action];
  if (!handler) {
    return {
      success: false,
      error: "Unknown action: " + action,
      code: "UNKNOWN_ACTION"
    };
  }
  
  return handler();
}

// ===========================================
// UTILS - HELPER FUNCTIONS
// ===========================================

const Utils = {
  generateUUID: function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
  
  getCurrentTimestamp: function() {
    return new Date().toISOString();
  },
  
  hashPassword: function(password) {
    const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
    return hash.map(function(byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
  },
  
  verifyPassword: function(password, hash) {
    return this.hashPassword(password) === hash;
  },
  
  base64UrlEncode: function(str) {
    let encoded = Utilities.base64Encode(str);
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  
  base64UrlDecode: function(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return Utilities.newBlob(Utilities.base64Decode(str)).getDataAsString();
  },
  
  createJWT: function(payload, secret, expiresInSeconds) {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    
    payload.iat = now;
    payload.exp = now + expiresInSeconds;
    
    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));
    
    const signatureInput = headerB64 + "." + payloadB64;
    const signature = Utilities.computeHmacSha256Signature(signatureInput, secret);
    const signatureB64 = this.base64UrlEncode(signature.map(b => String.fromCharCode(b < 0 ? b + 256 : b)).join(''));
    
    return headerB64 + "." + payloadB64 + "." + signatureB64;
  },
  
  verifyJWT: function(token, secret) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: "Invalid token format" };
      }
      
      const [headerB64, payloadB64, signatureB64] = parts;
      
      const signatureInput = headerB64 + "." + payloadB64;
      const expectedSignature = Utilities.computeHmacSha256Signature(signatureInput, secret);
      const expectedSignatureB64 = this.base64UrlEncode(expectedSignature.map(b => String.fromCharCode(b < 0 ? b + 256 : b)).join(''));
      
      if (signatureB64 !== expectedSignatureB64) {
        return { valid: false, error: "Invalid signature" };
      }
      
      const payload = JSON.parse(this.base64UrlDecode(payloadB64));
      
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return { valid: false, error: "Token expired" };
      }
      
      return { valid: true, payload: payload };
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },
  
  formatCurrency: function(number) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number);
  },
  
  parseDate: function(dateString) {
    if (!dateString) return null;
    return new Date(dateString);
  },
  
  formatDate: function(date, format) {
    if (!date) return '';
    const d = new Date(date);
    
    switch (format) {
      case 'date':
        return Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
      case 'datetime':
        return Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
      case 'display':
        return Utilities.formatDate(d, 'Asia/Jakarta', 'dd/MM/yyyy');
      case 'displayTime':
        return Utilities.formatDate(d, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm');
      default:
        return Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
    }
  },
  
  validateRequired: function(data, fields) {
    const missing = [];
    fields.forEach(function(field) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missing.push(field);
      }
    });
    
    if (missing.length > 0) {
      return {
        valid: false,
        error: "Missing required fields: " + missing.join(', ')
      };
    }
    
    return { valid: true };
  },
  
  sanitize: function(str) {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
  },
  
  paginate: function(data, page, pageSize) {
    page = parseInt(page) || 1;
    pageSize = parseInt(pageSize) || 20;
    
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      data: data.slice(startIndex, endIndex),
      pagination: {
        page: page,
        pageSize: pageSize,
        totalItems: totalItems,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  },
  
  /**
   * Acquire script lock with timeout
   */
  acquireLock: function(timeoutMs) {
    const lock = LockService.getScriptLock();
    const acquired = lock.tryLock(timeoutMs || CONFIG.LOCK_TIMEOUT);
    
    if (!acquired) {
      throw new Error('Sistem sedang sibuk, silakan coba lagi beberapa saat.');
    }
    
    return lock;
  }
};

// ===========================================
// DATABASE - OPTIMIZED WITH CACHING & LOCKING
// ===========================================

const Database = {
  // Headers cache (in-memory for current execution)
  _headersCache: {},
  
  getSpreadsheet: function() {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  },
  
  getSheet: function(sheetName) {
    const ss = this.getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      // Auto-create if missing
      Logger.log('Sheet not found, attempting to create: ' + sheetName);
      if (SHEET_SCHEMAS[sheetName]) {
        SetupService.ensureSheetWithHeaders(ss, sheetName, SHEET_SCHEMAS[sheetName]);
        return ss.getSheetByName(sheetName);
      }
      throw new Error("Sheet not found: " + sheetName);
    }
    return sheet;
  },
  
  /**
   * Get headers with caching
   */
  getHeaders: function(sheetName) {
    // Check in-memory cache first
    if (this._headersCache[sheetName]) {
      return this._headersCache[sheetName];
    }
    
    // Check schema
    if (SHEET_SCHEMAS[sheetName]) {
      this._headersCache[sheetName] = SHEET_SCHEMAS[sheetName];
      return SHEET_SCHEMAS[sheetName];
    }
    
    // Fallback to reading from sheet
    const sheet = this.getSheet(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    this._headersCache[sheetName] = headers;
    
    return headers;
  },
  
  getCacheKey: function(sheetName, suffix) {
    return `db_${sheetName}_${suffix || 'all'}`;
  },
  
  clearCache: function(sheetName) {
    const keys = [
      this.getCacheKey(sheetName, 'all'),
      this.getCacheKey(sheetName, 'active')
    ];
    keys.forEach(key => CACHE.remove(key));
    
    // Clear in-memory headers cache too
    delete this._headersCache[sheetName];
  },
  
  getAllData: function(sheetName, useCache = true) {
    const cacheKey = this.getCacheKey(sheetName, 'all');
    
    if (useCache) {
      const cached = CACHE.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    
    const sheet = this.getSheet(sheetName);
    const data = sheet.getDataRange().getValues();
    
    if (data.length < 2) {
      return [];
    }
    
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(function(row) {
      const obj = {};
      headers.forEach(function(header, index) {
        obj[header] = row[index];
      });
      return obj;
    }).filter(function(row) {
      return row.id && row.id !== '';
    });
    
    // Cache result
    try {
      CACHE.put(cacheKey, JSON.stringify(result), CONFIG.CACHE_DURATION);
    } catch (e) {
      // Cache might be too large
    }
    
    return result;
  },
  
  getActiveData: function(sheetName, useCache = true) {
    const cacheKey = this.getCacheKey(sheetName, 'active');
    
    if (useCache) {
      const cached = CACHE.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
    
    const allData = this.getAllData(sheetName, useCache);
    const result = allData.filter(row => row.isActive === true || row.isActive === 'TRUE');
    
    try {
      CACHE.put(cacheKey, JSON.stringify(result), CONFIG.CACHE_DURATION);
    } catch (e) {}
    
    return result;
  },
  
  getById: function(sheetName, id, useCache = true) {
    const data = this.getAllData(sheetName, useCache);
    return data.find(row => row.id === id) || null;
  },
  
  getByColumn: function(sheetName, columnName, value, useCache = true) {
    const data = this.getAllData(sheetName, useCache);
    return data.filter(row => row[columnName] === value);
  },
  
  getOneByColumn: function(sheetName, columnName, value, useCache = true) {
    const results = this.getByColumn(sheetName, columnName, value, useCache);
    return results.length > 0 ? results[0] : null;
  },
  
  /**
   * Optimized insert using cached headers
   */
  insert: function(sheetName, data) {
    const sheet = this.getSheet(sheetName);
    const headers = this.getHeaders(sheetName);
    
    if (!data.id) {
      data.id = Utils.generateUUID();
    }
    data.createdAt = Utils.getCurrentTimestamp();
    
    const row = headers.map(header => data[header] !== undefined ? data[header] : '');
    sheet.appendRow(row);
    
    this.clearCache(sheetName);
    return data;
  },
  
  update: function(sheetName, id, data) {
    const sheet = this.getSheet(sheetName);
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    const idColIndex = headers.indexOf('id');
    let rowIndex = -1;
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][idColIndex] === id) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      throw new Error("Record not found: " + id);
    }
    
    data.updatedAt = Utils.getCurrentTimestamp();
    
    headers.forEach((header, colIndex) => {
      if (data[header] !== undefined && header !== 'id' && header !== 'createdAt') {
        sheet.getRange(rowIndex, colIndex + 1).setValue(data[header]);
      }
    });
    
    this.clearCache(sheetName);
    return this.getById(sheetName, id, false);
  },
  
  softDelete: function(sheetName, id, userId) {
    return this.update(sheetName, id, {
      isActive: false,
      updatedAt: Utils.getCurrentTimestamp(),
      updatedBy: userId
    });
  },
  
  hardDelete: function(sheetName, id) {
    const sheet = this.getSheet(sheetName);
    const allData = sheet.getDataRange().getValues();
    const headers = allData[0];
    
    const idColIndex = headers.indexOf('id');
    
    for (let i = 1; i < allData.length; i++) {
      if (allData[i][idColIndex] === id) {
        sheet.deleteRow(i + 1);
        this.clearCache(sheetName);
        return true;
      }
    }
    
    throw new Error("Record not found: " + id);
  },
  
  search: function(sheetName, criteria, useCache = true) {
    const data = this.getAllData(sheetName, useCache);
    
    return data.filter(row => {
      return Object.keys(criteria).every(key => {
        const value = criteria[key];
        const rowValue = row[key];
        
        if (typeof value === 'object' && value !== null) {
          if (value.min !== undefined && rowValue < value.min) return false;
          if (value.max !== undefined && rowValue > value.max) return false;
          return true;
        }
        
        if (typeof rowValue === 'string' && typeof value === 'string') {
          return rowValue.toLowerCase().includes(value.toLowerCase());
        }
        
        return rowValue === value;
      });
    });
  },
  
  getByDateRange: function(sheetName, dateColumn, startDate, endDate, useCache = true) {
    const data = this.getAllData(sheetName, useCache);
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return data.filter(row => {
      const rowDate = new Date(row[dateColumn]);
      return rowDate >= start && rowDate <= end;
    });
  },
  
  count: function(sheetName, criteria) {
    if (!criteria) {
      return this.getAllData(sheetName).length;
    }
    return this.search(sheetName, criteria).length;
  },
  
  sum: function(sheetName, column, criteria) {
    const data = criteria ? this.search(sheetName, criteria) : this.getAllData(sheetName);
    return data.reduce((sum, row) => sum + (parseFloat(row[column]) || 0), 0);
  },
  
  /**
   * Optimized bulk insert
   */
  bulkInsert: function(sheetName, dataArray) {
    if (!dataArray || dataArray.length === 0) {
      return [];
    }
    
    const sheet = this.getSheet(sheetName);
    const headers = this.getHeaders(sheetName);
    
    const rows = dataArray.map(data => {
      if (!data.id) data.id = Utils.generateUUID();
      data.createdAt = Utils.getCurrentTimestamp();
      return headers.map(header => data[header] !== undefined ? data[header] : '');
    });
    
    // Single API call for all rows
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
    
    this.clearCache(sheetName);
    return dataArray;
  },
  
  /**
   * DIPERBAIKI: Bulk update multiple records dengan optimasi
   * Menggunakan batch update alih-alih loop individual
   */
  bulkUpdate: function(sheetName, updates) {
    // updates = [{ id: 'xxx', data: {...} }, ...]
    if (!updates || updates.length === 0) {
      return true;
    }
    
    const lock = Utils.acquireLock(CONFIG.LOCK_TIMEOUT);
    
    try {
      const sheet = this.getSheet(sheetName);
      const allData = sheet.getDataRange().getValues();
      const headers = allData[0];
      const idColIndex = headers.indexOf('id');
      
      // Buat map untuk lookup cepat: id -> rowIndex (1-based untuk sheet)
      const idToRowMap = {};
      for (let i = 1; i < allData.length; i++) {
        idToRowMap[allData[i][idColIndex]] = i + 1; // +1 karena sheet 1-indexed
      }
      
      // Proses setiap update
      updates.forEach(update => {
        const rowIndex = idToRowMap[update.id];
        if (!rowIndex) {
          Logger.log('Record not found for bulk update: ' + update.id);
          return; // Skip jika tidak ditemukan
        }
        
        // Tambahkan updatedAt
        update.data.updatedAt = Utils.getCurrentTimestamp();
        
        // Update setiap field yang ada di data
        headers.forEach((header, colIndex) => {
          if (update.data[header] !== undefined && header !== 'id' && header !== 'createdAt') {
            sheet.getRange(rowIndex, colIndex + 1).setValue(update.data[header]);
          }
        });
      });
      
      this.clearCache(sheetName);
      return true;
      
    } finally {
      lock.releaseLock();
    }
  },
  
  /**
   * BARU: Bulk rewrite - hapus semua data lalu tulis ulang
   * Berguna untuk operasi arsip yang menghapus banyak data sekaligus
   */
  bulkRewrite: function(sheetName, newData) {
    const sheet = this.getSheet(sheetName);
    const headers = this.getHeaders(sheetName);
    
    // Bersihkan semua isi sheet (kecuali header)
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
    
    // Tulis ulang data baru sekaligus
    if (newData && newData.length > 0) {
      const rows = newData.map(data => headers.map(h => data[h] !== undefined ? data[h] : ''));
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    
    this.clearCache(sheetName);
    return true;
  }
};

// ===========================================
// FILE SERVICE
// ===========================================

const FileService = {
  getFolder: function() {
    if (CONFIG.DRIVE_FOLDER_ID) {
      try {
        return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
      } catch (e) {
        Logger.log('Drive folder not found, creating new one');
      }
    }
    
    const folderName = 'TransactionApp_Files';
    const folders = DriveApp.getFoldersByName(folderName);
    
    if (folders.hasNext()) {
      const folder = folders.next();
      PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', folder.getId());
      return folder;
    }
    
    const folder = DriveApp.createFolder(folderName);
    PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', folder.getId());
    
    return folder;
  },
  
  upload: function(data) {
    const validation = Utils.validateRequired(data, ['fileName', 'mimeType', 'base64Data']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    try {
      const decoded = Utilities.base64Decode(data.base64Data);
      
      if (decoded.length > CONFIG.MAX_FILE_SIZE) {
        return {
          success: false,
          error: 'File size exceeds maximum limit of 2MB',
          code: 'FILE_TOO_LARGE'
        };
      }
      
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(data.mimeType)) {
        return {
          success: false,
          error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WEBP',
          code: 'INVALID_FILE_TYPE'
        };
      }
      
      const folder = this.getFolder();
      const subFolderName = data.subFolder || 'uploads';
      
      let subFolder;
      const subFolders = folder.getFoldersByName(subFolderName);
      if (subFolders.hasNext()) {
        subFolder = subFolders.next();
      } else {
        subFolder = folder.createFolder(subFolderName);
      }
      
      const timestamp = new Date().getTime();
      const extension = data.fileName.split('.').pop();
      const uniqueFileName = `${timestamp}_${Utils.generateUUID().substring(0, 8)}.${extension}`;
      
      const blob = Utilities.newBlob(decoded, data.mimeType, uniqueFileName);
      const file = subFolder.createFile(blob);
      
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      const fileId = file.getId();
      const fileUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
      
      return {
        success: true,
        data: {
          fileId: fileId,
          fileName: uniqueFileName,
          fileUrl: fileUrl,
          url: fileUrl,
          mimeType: data.mimeType,
          size: decoded.length
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: 'Failed to upload file: ' + error.message,
        code: 'UPLOAD_FAILED'
      };
    }
  },
  
  delete: function(data) {
    if (!data.fileId) {
      return { success: false, error: 'File ID required' };
    }
    
    try {
      const file = DriveApp.getFileById(data.fileId);
      file.setTrashed(true);
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete file: ' + error.message
      };
    }
  }
};

// ===========================================
// AUTH SERVICE
// ===========================================

function validateAuth(auth) {
  if (!auth.token) {
    return { valid: false, error: "Token required" };
  }
  
  const verification = Utils.verifyJWT(auth.token, CONFIG.JWT_SECRET);
  
  if (!verification.valid) {
    return { valid: false, error: verification.error };
  }
  
  return { valid: true, user: verification.payload };
}

const AuthService = {
  login: function(data) {
    const validation = Utils.validateRequired(data, ['username', 'password']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const user = Database.getOneByColumn('Users', 'username', data.username);
    
    if (!user) {
      return { 
        success: false, 
        error: "Username atau password salah",
        code: "INVALID_CREDENTIALS"
      };
    }
    
    if (!user.isActive) {
      return {
        success: false,
        error: "Akun tidak aktif",
        code: "ACCOUNT_INACTIVE"
      };
    }
    
    if (!Utils.verifyPassword(data.password, user.passwordHash)) {
      this.logLoginAttempt(user.id, false);
      return {
        success: false,
        error: "Username atau password salah",
        code: "INVALID_CREDENTIALS"
      };
    }
    
    const permissions = typeof user.permissions === 'string' ? 
      JSON.parse(user.permissions || '[]') : (user.permissions || []);
    
    const token = Utils.createJWT({
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: permissions
    }, CONFIG.JWT_SECRET, CONFIG.SESSION_DURATION);
    
    Database.update('Users', user.id, {
      lastLogin: Utils.getCurrentTimestamp()
    });
    
    this.logLoginAttempt(user.id, true);
    
    return {
      success: true,
      data: {
        token: token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          division: user.division,
          photoUrl: user.photoUrl,
          permissions: permissions
        },
        expiresIn: CONFIG.SESSION_DURATION
      }
    };
  },
  
  logout: function(data) {
    if (data._user) {
      Database.insert('AuditLogs', {
        userId: data._user.userId,
        userName: data._user.username,
        userRole: data._user.role,
        action: 'LOGOUT',
        module: 'Auth',
        timestamp: Utils.getCurrentTimestamp()
      });
    }
    return { success: true };
  },
  
  refreshToken: function(data) {
    if (!data.token) {
      return { success: false, error: "Token required" };
    }
    
    const verification = Utils.verifyJWT(data.token, CONFIG.JWT_SECRET);
    
    if (!verification.valid) {
      return {
        success: false,
        error: verification.error,
        code: "INVALID_TOKEN"
      };
    }
    
    const payload = verification.payload;
    const newToken = Utils.createJWT({
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      permissions: payload.permissions
    }, CONFIG.JWT_SECRET, CONFIG.SESSION_DURATION);
    
    return {
      success: true,
      data: {
        token: newToken,
        expiresIn: CONFIG.SESSION_DURATION
      }
    };
  },
  
  changePassword: function(data) {
    const validation = Utils.validateRequired(data, ['currentPassword', 'newPassword']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const user = Database.getById('Users', data._user.userId);
    
    if (!Utils.verifyPassword(data.currentPassword, user.passwordHash)) {
      return {
        success: false,
        error: "Password saat ini salah",
        code: "INVALID_PASSWORD"
      };
    }
    
    if (data.newPassword.length < 6) {
      return {
        success: false,
        error: "Password baru minimal 6 karakter",
        code: "WEAK_PASSWORD"
      };
    }
    
    Database.update('Users', user.id, {
      passwordHash: Utils.hashPassword(data.newPassword),
      updatedBy: data._user.userId
    });
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'UPDATE',
      module: 'Auth',
      entityId: user.id,
      entityType: 'User',
      notes: 'Password changed',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    return { success: true };
  },
  
  logLoginAttempt: function(userId, success) {
    const user = Database.getById('Users', userId);
    
    Database.insert('AuditLogs', {
      userId: userId,
      userName: user ? user.username : 'unknown',
      userRole: user ? user.role : 'unknown',
      action: success ? 'LOGIN' : 'LOGIN_FAILED',
      module: 'Auth',
      timestamp: Utils.getCurrentTimestamp()
    });
  }
};

// ===========================================
// CONFIG SERVICE
// ===========================================

const ConfigService = {
  getPublic: function() {
    const cacheKey = 'config_public';
    const cached = CACHE.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const publicKeys = ['APP_NAME', 'APP_VERSION', 'COMPANY_NAME', 'LOGO_URL', 'BANNER_URL'];
    const allConfig = this.getAll({}).data || {};
    
    const publicConfig = {};
    publicKeys.forEach(key => {
      if (allConfig[key]) {
        publicConfig[key] = allConfig[key];
      }
    });
    
    const result = { success: true, data: publicConfig };
    CACHE.put(cacheKey, JSON.stringify(result), CONFIG.CACHE_DURATION);
    
    return result;
  },
  
  getAll: function(data) {
    const cacheKey = 'config_all';
    const cached = CACHE.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const configData = Database.getAllData('Config');
    const config = {};
    
    configData.forEach(row => {
      config[row.key] = row.value;
    });
    
    const result = { success: true, data: config };
    CACHE.put(cacheKey, JSON.stringify(result), CONFIG.CACHE_DURATION);
    
    return result;
  },
  
  update: function(data) {
    const validation = Utils.validateRequired(data, ['key', 'value']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const existing = Database.getOneByColumn('Config', 'key', data.key);
    
    if (existing) {
      Database.update('Config', existing.id, {
        value: data.value,
        updatedAt: Utils.getCurrentTimestamp()
      });
    } else {
      Database.insert('Config', {
        key: data.key,
        value: data.value,
        description: data.description || ''
      });
    }
    
    CACHE.remove('config_all');
    CACHE.remove('config_public');
    
    return { success: true };
  }
};

// ===========================================
// USER SERVICE
// ===========================================

const UserService = {
  list: function(data) {
    let users = Database.getAllData('Users');
    
    if (data.search) {
      const search = data.search.toLowerCase();
      users = users.filter(u => 
        u.username.toLowerCase().includes(search) ||
        u.fullName.toLowerCase().includes(search) ||
        (u.email && u.email.toLowerCase().includes(search))
      );
    }
    
    if (data.role) {
      users = users.filter(u => u.role === data.role);
    }
    
    if (data.isActive !== undefined) {
      users = users.filter(u => u.isActive === data.isActive);
    }
    
    users = users.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });
    
    const result = Utils.paginate(users, data.page, data.pageSize);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  },
  
  get: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const user = Database.getById('Users', data.id);
    if (!user) {
      return { success: false, error: "User tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const { passwordHash, ...rest } = user;
    return { success: true, data: rest };
  },
  
  create: function(data) {
    const validation = Utils.validateRequired(data, ['username', 'password', 'fullName', 'role']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const existing = Database.getOneByColumn('Users', 'username', data.username);
    if (existing) {
      return { success: false, error: "Username sudah digunakan", code: "DUPLICATE_USERNAME" };
    }
    
    const user = Database.insert('Users', {
      username: data.username,
      passwordHash: Utils.hashPassword(data.password),
      fullName: data.fullName,
      email: data.email || '',
      phone: data.phone || '',
      role: data.role,
      division: data.division || '',
      photoUrl: data.photoUrl || '',
      permissions: JSON.stringify(data.permissions || []),
      isActive: true,
      createdBy: data._user.userId
    });
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'CREATE',
      module: 'User',
      entityId: user.id,
      entityType: 'User',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    const { passwordHash, ...rest } = user;
    return { success: true, data: rest };
  },
  
  update: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('Users', data.id);
    if (!existing) {
      return { success: false, error: "User tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const updateData = {};
    
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role) updateData.role = data.role;
    if (data.division !== undefined) updateData.division = data.division;
    if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
    if (data.permissions) updateData.permissions = JSON.stringify(data.permissions);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) updateData.passwordHash = Utils.hashPassword(data.password);
    
    updateData.updatedBy = data._user.userId;
    
    const updated = Database.update('Users', data.id, updateData);
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'UPDATE',
      module: 'User',
      entityId: data.id,
      entityType: 'User',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    const { passwordHash, ...rest } = updated;
    return { success: true, data: rest };
  },
  
  delete: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    Database.softDelete('Users', data.id, data._user.userId);
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'DELETE',
      module: 'User',
      entityId: data.id,
      entityType: 'User',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    return { success: true };
  },
  
  uploadPhoto: function(data) {
    if (!data.id) {
      return { success: false, error: "User ID required" };
    }
    
    const validation = Utils.validateRequired(data, ['fileName', 'mimeType', 'base64Data']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const uploadResult = FileService.upload({
      fileName: data.fileName,
      mimeType: data.mimeType,
      base64Data: data.base64Data,
      subFolder: 'profile_photos'
    });
    
    if (!uploadResult.success) {
      return uploadResult;
    }
    
    Database.update('Users', data.id, {
      photoUrl: uploadResult.data.fileUrl,
      updatedBy: data._user.userId
    });
    
    return {
      success: true,
      data: {
        photoUrl: uploadResult.data.fileUrl
      }
    };
  }
};

// ===========================================
// CUSTOMER SERVICE
// ===========================================

const CustomerService = {
  list: function(data) {
    let customers = data.activeOnly !== false ? 
      Database.getActiveData('Customers') : 
      Database.getAllData('Customers');
    
    if (data.search) {
      const search = data.search.toLowerCase();
      customers = customers.filter(c => 
        c.customerCode.toLowerCase().includes(search) ||
        c.customerName.toLowerCase().includes(search) ||
        (c.picName && c.picName.toLowerCase().includes(search))
      );
    }
    
    if (data.city) {
      customers = customers.filter(c => c.city === data.city);
    }
    
    customers.sort((a, b) => a.customerName.localeCompare(b.customerName));
    
    const result = Utils.paginate(customers, data.page, data.pageSize);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  },
  
  search: function(data) {
    const search = (data.search || '').toLowerCase();
    const limit = data.limit || 10;
    
    if (search.length < 2) {
      return { success: true, data: [] };
    }
    
    const customers = Database.getActiveData('Customers');
    
    const results = customers.filter(c => 
      c.customerCode.toLowerCase().includes(search) ||
      c.customerName.toLowerCase().includes(search)
    ).slice(0, limit);
    
    return { success: true, data: results };
  },
  
  get: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const customer = Database.getById('Customers', data.id);
    if (!customer) {
      return { success: false, error: "Customer tidak ditemukan", code: "NOT_FOUND" };
    }
    
    return { success: true, data: customer };
  },
  
  create: function(data) {
    const validation = Utils.validateRequired(data, [
      'customerCode', 'customerName', 'address', 'picPhone'
    ]);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const existing = Database.getOneByColumn('Customers', 'customerCode', data.customerCode);
    if (existing) {
      return { success: false, error: "Kode customer sudah digunakan", code: "DUPLICATE_CODE" };
    }
    
    const customer = Database.insert('Customers', {
      customerCode: data.customerCode,
      customerName: data.customerName,
      address: data.address,
      city: data.city || '',
      province: data.province || '',
      postalCode: data.postalCode || '',
      googleMapsUrl: data.googleMapsUrl || '',
      picName: data.picName || '',
      picPosition: data.picPosition || '',
      picPhone: data.picPhone,
      picEmail: data.picEmail || '',
      creditLimit: data.creditLimit || 0,
      currentCredit: 0,
      paymentTerms: data.paymentTerms || 30,
      isActive: true,
      notes: data.notes || '',
      createdBy: data._user.userId
    });
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'CREATE',
      module: 'Customer',
      entityId: customer.id,
      entityType: 'Customer',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    return { success: true, data: customer };
  },
  
  update: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('Customers', data.id);
    if (!existing) {
      return { success: false, error: "Customer tidak ditemukan", code: "NOT_FOUND" };
    }
    
    if (data.customerCode && data.customerCode !== existing.customerCode) {
      const duplicate = Database.getOneByColumn('Customers', 'customerCode', data.customerCode);
      if (duplicate) {
        return { success: false, error: "Kode customer sudah digunakan", code: "DUPLICATE_CODE" };
      }
    }
    
    const updateFields = [
      'customerCode', 'customerName', 'address', 'city', 'province', 
      'postalCode', 'googleMapsUrl', 'picName', 'picPosition', 'picPhone',
      'picEmail', 'creditLimit', 'paymentTerms', 'isActive', 'notes'
    ];
    
    const updateData = { updatedBy: data._user.userId };
    updateFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });
    
    const updated = Database.update('Customers', data.id, updateData);
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'UPDATE',
      module: 'Customer',
      entityId: data.id,
      entityType: 'Customer',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    return { success: true, data: updated };
  },
  
  delete: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const transactions = Database.getByColumn('Transactions', 'customerId', data.id);
    if (transactions.length > 0) {
      return { 
        success: false, 
        error: "Customer tidak dapat dihapus karena memiliki transaksi",
        code: "HAS_TRANSACTIONS"
      };
    }
    
    Database.softDelete('Customers', data.id, data._user.userId);
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'DELETE',
      module: 'Customer',
      entityId: data.id,
      entityType: 'Customer',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    return { success: true };
  }
};

// ===========================================
// PRODUCT SERVICE
// ===========================================

const ProductService = {
  list: function(data) {
    let products = data.activeOnly !== false ?
      Database.getActiveData('Products') :
      Database.getAllData('Products');
    
    if (data.search) {
      const search = data.search.toLowerCase();
      products = products.filter(p => 
        p.productCode.toLowerCase().includes(search) ||
        p.productName.toLowerCase().includes(search)
      );
    }
    
    if (data.category) {
      products = products.filter(p => p.category === data.category);
    }
    
    products.sort((a, b) => a.productName.localeCompare(b.productName));
    
    const result = Utils.paginate(products, data.page, data.pageSize);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  },
  
  search: function(data) {
    const search = (data.search || '').toLowerCase();
    const limit = data.limit || 10;
    
    if (search.length < 2) {
      return { success: true, data: [] };
    }
    
    const products = Database.getActiveData('Products');
    
    const results = products.filter(p => 
      p.productCode.toLowerCase().includes(search) ||
      p.productName.toLowerCase().includes(search)
    ).slice(0, limit);
    
    return { success: true, data: results };
  },
  
  get: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const product = Database.getById('Products', data.id);
    if (!product) {
      return { success: false, error: "Produk tidak ditemukan", code: "NOT_FOUND" };
    }
    
    return { success: true, data: product };
  },
  
  getCustomerPrice: function(data) {
    const validation = Utils.validateRequired(data, ['customerId', 'productId']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const cacheKey = `custprice_${data.customerId}_${data.productId}`;
    const cached = CACHE.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const product = Database.getById('Products', data.productId);
    if (!product) {
      return { success: false, error: "Produk tidak ditemukan" };
    }
    
    const customerPrices = Database.search('CustomerPrices', {
      customerId: data.customerId,
      productId: data.productId,
      isActive: true
    });
    
    let priceData;
    
    if (customerPrices.length > 0) {
      const cp = customerPrices[0];
      const now = new Date();
      const effectiveDate = new Date(cp.effectiveDate);
      const expiryDate = cp.expiryDate ? new Date(cp.expiryDate) : null;
      
      if (now >= effectiveDate && (!expiryDate || now <= expiryDate)) {
        priceData = {
          pricePerKg: cp.specialPricePerKg,
          pricePerUnit: cp.specialPricePerUnit,
          isPPN: cp.isPPN,
          discountPercent: cp.discountPercent || 0,
          isSpecialPrice: true
        };
      }
    }
    
    if (!priceData) {
      priceData = {
        pricePerKg: product.basePricePerKg,
        pricePerUnit: product.basePricePerUnit,
        isPPN: product.isPPN,
        discountPercent: 0,
        isSpecialPrice: false
      };
    }
    
    const result = { success: true, data: priceData };
    CACHE.put(cacheKey, JSON.stringify(result), CONFIG.CACHE_DURATION);
    
    return result;
  },
  
  create: function(data) {
    const validation = Utils.validateRequired(data, [
      'productCode', 'productName', 'baseUnitWeight', 
      'basePricePerKg', 'basePricePerUnit', 'unitName', 'kgName'
    ]);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const existing = Database.getOneByColumn('Products', 'productCode', data.productCode);
    if (existing) {
      return { success: false, error: "Kode produk sudah digunakan", code: "DUPLICATE_CODE" };
    }
    
    const product = Database.insert('Products', {
      productCode: data.productCode,
      productName: data.productName,
      category: data.category || '',
      baseUnitWeight: parseFloat(data.baseUnitWeight) || 0,
      basePricePerKg: parseFloat(data.basePricePerKg) || 0,
      basePricePerUnit: parseFloat(data.basePricePerUnit) || 0,
      isPPN: data.isPPN !== false,
      unitName: data.unitName,
      kgName: data.kgName,
      stockQtyUnit: parseFloat(data.stockQtyUnit) || 0,
      stockQtyKg: parseFloat(data.stockQtyKg) || 0,
      minStock: parseFloat(data.minStock) || 0,
      isActive: true,
      description: data.description || '',
      createdBy: data._user.userId
    });
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'CREATE',
      module: 'Product',
      entityId: product.id,
      entityType: 'Product',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    return { success: true, data: product };
  },
  
  update: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('Products', data.id);
    if (!existing) {
      return { success: false, error: "Produk tidak ditemukan", code: "NOT_FOUND" };
    }
    
    if (data.productCode && data.productCode !== existing.productCode) {
      const duplicate = Database.getOneByColumn('Products', 'productCode', data.productCode);
      if (duplicate) {
        return { success: false, error: "Kode produk sudah digunakan", code: "DUPLICATE_CODE" };
      }
    }
    
    const updateFields = [
      'productCode', 'productName', 'category', 'baseUnitWeight',
      'basePricePerKg', 'basePricePerUnit', 'isPPN', 'unitName', 'kgName',
      'stockQtyUnit', 'stockQtyKg', 'minStock', 'isActive', 'description'
    ];
    
    const updateData = { updatedBy: data._user.userId };
    updateFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });
    
    const updated = Database.update('Products', data.id, updateData);
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'UPDATE',
      module: 'Product',
      entityId: data.id,
      entityType: 'Product',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    return { success: true, data: updated };
  },
  
  delete: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const items = Database.getByColumn('TransactionItems', 'productId', data.id);
    if (items.length > 0) {
      return { 
        success: false, 
        error: "Produk tidak dapat dihapus karena memiliki transaksi",
        code: "HAS_TRANSACTIONS"
      };
    }
    
    Database.softDelete('Products', data.id, data._user.userId);
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'DELETE',
      module: 'Product',
      entityId: data.id,
      entityType: 'Product',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    return { success: true };
  }
};

// ===========================================
// CUSTOMER PRICE SERVICE
// ===========================================

const CustomerPriceService = {
  list: function(data) {
    let prices = Database.getAllData('CustomerPrices');
    
    if (data.customerId) {
      prices = prices.filter(p => p.customerId === data.customerId);
    }
    
    if (data.productId) {
      prices = prices.filter(p => p.productId === data.productId);
    }
    
    if (data.activeOnly !== false) {
      prices = prices.filter(p => p.isActive);
    }
    
    const result = Utils.paginate(prices, data.page, data.pageSize);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  },
  
  create: function(data) {
    const validation = Utils.validateRequired(data, [
      'customerId', 'productId', 'specialPricePerKg', 
      'specialPricePerUnit', 'effectiveDate'
    ]);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const customer = Database.getById('Customers', data.customerId);
    if (!customer) {
      return { success: false, error: "Customer tidak ditemukan" };
    }
    
    const product = Database.getById('Products', data.productId);
    if (!product) {
      return { success: false, error: "Produk tidak ditemukan" };
    }
    
    const price = Database.insert('CustomerPrices', {
      customerId: data.customerId,
      customerCode: customer.customerCode,
      customerName: customer.customerName,
      productId: data.productId,
      productCode: product.productCode,
      productName: product.productName,
      specialPricePerKg: parseFloat(data.specialPricePerKg),
      specialPricePerUnit: parseFloat(data.specialPricePerUnit),
      discountPercent: parseFloat(data.discountPercent) || 0,
      isPPN: data.isPPN !== false,
      effectiveDate: data.effectiveDate,
      expiryDate: data.expiryDate || '',
      isActive: true,
      notes: data.notes || '',
      createdBy: data._user.userId
    });
    
    CACHE.remove(`custprice_${data.customerId}_${data.productId}`);
    
    return { success: true, data: price };
  },
  
  update: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('CustomerPrices', data.id);
    if (!existing) {
      return { success: false, error: "Data tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const updateFields = [
      'specialPricePerKg', 'specialPricePerUnit', 'discountPercent',
      'isPPN', 'effectiveDate', 'expiryDate', 'isActive', 'notes'
    ];
    
    const updateData = { updatedBy: data._user.userId };
    updateFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });
    
    const updated = Database.update('CustomerPrices', data.id, updateData);
    
    CACHE.remove(`custprice_${existing.customerId}_${existing.productId}`);
    
    return { success: true, data: updated };
  },
  
  delete: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('CustomerPrices', data.id);
    if (!existing) {
      return { success: false, error: "Data tidak ditemukan", code: "NOT_FOUND" };
    }
    
    Database.hardDelete('CustomerPrices', data.id);
    
    CACHE.remove(`custprice_${existing.customerId}_${existing.productId}`);
    
    return { success: true };
  }
};

// ===========================================
// TRANSACTION SERVICE - WITH LOCK & BULK INSERT
// ===========================================

const TransactionService = {
  list: function(data) {
    let transactions = Database.getAllData('Transactions');
    
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      end.setHours(23, 59, 59, 999);
      
      transactions = transactions.filter(t => {
        const date = new Date(t.invoiceDate);
        return date >= start && date <= end;
      });
    }
    
    if (data.customerId) {
      transactions = transactions.filter(t => t.customerId === data.customerId);
    }
    
    if (data.salesId) {
      transactions = transactions.filter(t => t.salesId === data.salesId);
    }
    
    if (data.paymentStatus) {
      transactions = transactions.filter(t => t.paymentStatus === data.paymentStatus);
    }
    
    if (data.deliveryStatus) {
      transactions = transactions.filter(t => t.deliveryStatus === data.deliveryStatus);
    }
    
    if (data.search) {
      const search = data.search.toLowerCase();
      transactions = transactions.filter(t =>
        t.invoiceNumber.toLowerCase().includes(search) ||
        t.customerName.toLowerCase().includes(search)
      );
    }
    
    transactions.sort((a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate));
    
    const result = Utils.paginate(transactions, data.page, data.pageSize);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  },
  
  get: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const transaction = Database.getById('Transactions', data.id);
    if (!transaction) {
      return { success: false, error: "Transaksi tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const items = Database.getByColumn('TransactionItems', 'transactionId', data.id);
    
    return {
      success: true,
      data: {
        ...transaction,
        items: items
      }
    };
  },
  
  /**
   * Create transaction with LockService to prevent race conditions
   */
  create: function(data) {
    const validation = Utils.validateRequired(data, [
      'invoiceNumber', 'invoiceDate', 'customerId', 'salesId', 'items'
    ]);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Acquire lock to prevent concurrent transaction creation
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(CONFIG.LOCK_TIMEOUT)) {
      return {
        success: false,
        error: 'Sistem sedang sibuk memproses transaksi lain, silakan coba lagi.',
        code: 'SYSTEM_BUSY'
      };
    }
    
    try {
      // Check duplicate invoice number
      const existing = Database.getOneByColumn('Transactions', 'invoiceNumber', data.invoiceNumber, false);
      if (existing) {
        return { success: false, error: "Nomor invoice sudah digunakan", code: "DUPLICATE_INVOICE" };
      }
      
      // Get customer
      const customer = Database.getById('Customers', data.customerId, false);
      if (!customer) {
        return { success: false, error: "Customer tidak ditemukan", code: "CUSTOMER_NOT_FOUND" };
      }
      
      // Get sales
      const sales = Database.getById('Users', data.salesId, false);
      if (!sales) {
        return { success: false, error: "Sales tidak ditemukan", code: "SALES_NOT_FOUND" };
      }
      
      // Process items and calculate totals
      let subtotal = 0;
      let taxAmount = 0;
      const processedItems = [];
      
      for (const item of data.items) {
        const product = Database.getById('Products', item.productId, false);
        if (!product) {
          return { success: false, error: "Produk tidak ditemukan: " + item.productId };
        }
        
        // Get price
        const priceResult = ProductService.getCustomerPrice({
          customerId: data.customerId,
          productId: item.productId
        });
        
        const priceData = priceResult.data;
        const qtyOrderUnit = parseFloat(item.qtyOrderUnit) || 0;
        const qtyOrderKg = qtyOrderUnit * product.baseUnitWeight;
        
        const itemSubtotal = priceData.pricePerKg * qtyOrderKg;
        const isPPN = item.isPPN !== undefined ? item.isPPN : priceData.isPPN;
        const itemTax = isPPN ? itemSubtotal * 0.11 : 0;
        
        subtotal += itemSubtotal;
        taxAmount += itemTax;
        
        processedItems.push({
          productId: product.id,
          productCode: product.productCode,
          productName: product.productName,
          unitWeight: product.baseUnitWeight,
          pricePerKg: priceData.pricePerKg,
          pricePerUnit: priceData.pricePerUnit,
          qtyOrderUnit: qtyOrderUnit,
          qtyOrderKg: qtyOrderKg,
          qtyFulfilledUnit: 0,
          qtyFulfilledKg: 0,
          qtyUnfulfilledUnit: qtyOrderUnit,
          qtyUnfulfilledKg: qtyOrderKg,
          unitName: item.unitName || product.unitName,
          kgName: item.kgName || product.kgName,
          isPPN: isPPN,
          subtotal: itemSubtotal,
          taxAmount: itemTax,
          totalAmount: itemSubtotal + itemTax,
          fulfillmentStatus: 'UNFULFILLED',
          notes: item.notes || ''
        });
      }
      
      const discountAmount = parseFloat(data.discountAmount) || 0;
      const grandTotal = subtotal + taxAmount - discountAmount;
      
      // Create transaction
      const transactionId = Utils.generateUUID();
      const transaction = Database.insert('Transactions', {
        id: transactionId,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: data.invoiceDate,
        customerId: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.customerName,
        customerAddress: customer.address,
        customerPhone: customer.picPhone,
        salesId: sales.id,
        salesName: sales.fullName,
        subtotal: subtotal,
        taxAmount: taxAmount,
        discountAmount: discountAmount,
        grandTotal: grandTotal,
        paidAmount: 0,
        remainingAmount: grandTotal,
        paymentStatus: 'UNPAID',
        deliveryStatus: 'PENDING',
        notes: data.notes || '',
        createdBy: data._user.userId
      });
      
      // Bulk insert transaction items (optimized)
      const itemsToInsert = processedItems.map(item => ({
        transactionId: transactionId,
        invoiceNumber: data.invoiceNumber,
        ...item
      }));
      
      Database.bulkInsert('TransactionItems', itemsToInsert);
      
      // Log
      Database.insert('AuditLogs', {
        userId: data._user.userId,
        userName: data._user.username,
        userRole: data._user.role,
        action: 'CREATE',
        module: 'Transaction',
        entityId: transactionId,
        entityType: 'Transaction',
        timestamp: Utils.getCurrentTimestamp()
      });
      
      return {
        success: true,
        data: {
          ...transaction,
          items: processedItems
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: 'TRANSACTION_ERROR'
      };
    } finally {
      // Always release lock
      lock.releaseLock();
    }
  },
  
  update: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('Transactions', data.id);
    if (!existing) {
      return { success: false, error: "Transaksi tidak ditemukan", code: "NOT_FOUND" };
    }
    
    if (existing.deliveryStatus === 'DELIVERED') {
      return { 
        success: false, 
        error: "Tidak dapat mengubah transaksi yang sudah dikirim",
        code: "ALREADY_DELIVERED"
      };
    }
    
    const updateData = {
      notes: data.notes,
      updatedBy: data._user.userId
    };
    
    const updated = Database.update('Transactions', data.id, updateData);
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'UPDATE',
      module: 'Transaction',
      entityId: data.id,
      entityType: 'Transaction',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    return { success: true, data: updated };
  },
  
  delete: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('Transactions', data.id);
    if (!existing) {
      return { success: false, error: "Transaksi tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const deliveries = Database.getByColumn('Deliveries', 'transactionId', data.id);
    if (deliveries.length > 0) {
      return {
        success: false,
        error: "Tidak dapat menghapus transaksi yang sudah memiliki pengiriman",
        code: "HAS_DELIVERIES"
      };
    }
    
    // Use lock for delete operation
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(CONFIG.LOCK_TIMEOUT)) {
      return { success: false, error: 'Sistem sedang sibuk', code: 'SYSTEM_BUSY' };
    }
    
    try {
      // Delete items
      const items = Database.getByColumn('TransactionItems', 'transactionId', data.id);
      items.forEach(item => {
        Database.hardDelete('TransactionItems', item.id);
      });
      
      // Delete transaction
      Database.hardDelete('Transactions', data.id);
      
      Database.insert('AuditLogs', {
        userId: data._user.userId,
        userName: data._user.username,
        userRole: data._user.role,
        action: 'DELETE',
        module: 'Transaction',
        entityId: data.id,
        entityType: 'Transaction',
        dataBefore: JSON.stringify(existing),
        timestamp: Utils.getCurrentTimestamp()
      });
      
      return { success: true };
      
    } finally {
      lock.releaseLock();
    }
  },
  
  updatePayment: function(data) {
    const validation = Utils.validateRequired(data, ['id', 'amount', 'paymentMethod']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(CONFIG.LOCK_TIMEOUT)) {
      return { success: false, error: 'Sistem sedang sibuk', code: 'SYSTEM_BUSY' };
    }
    
    try {
      const transaction = Database.getById('Transactions', data.id, false);
      if (!transaction) {
        return { success: false, error: "Transaksi tidak ditemukan", code: "NOT_FOUND" };
      }
      
      const amount = parseFloat(data.amount);
      let newPaidAmount = transaction.paidAmount + amount;
      let newRemainingAmount = transaction.grandTotal - newPaidAmount;
      
      let newPaymentStatus;
      if (newRemainingAmount <= 0) {
        newPaymentStatus = 'PAID';
        newRemainingAmount = 0;
      } else if (newPaidAmount > 0) {
        newPaymentStatus = 'PARTIAL';
      } else {
        newPaymentStatus = 'UNPAID';
      }
      
      Database.update('Transactions', data.id, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus: newPaymentStatus,
        updatedBy: data._user.userId
      });
      
      Database.insert('AuditLogs', {
        userId: data._user.userId,
        userName: data._user.username,
        userRole: data._user.role,
        action: 'UPDATE',
        module: 'Transaction',
        entityId: data.id,
        entityType: 'Payment',
        notes: `Payment ${amount} via ${data.paymentMethod}`,
        timestamp: Utils.getCurrentTimestamp()
      });
      
      return {
        success: true,
        data: {
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount,
          paymentStatus: newPaymentStatus
        }
      };
      
    } finally {
      lock.releaseLock();
    }
  }
};

// ===========================================
// DELIVERY SERVICE - WITH LOCK & BULK UPDATE
// ===========================================

const DeliveryService = {
  list: function(data) {
    let deliveries = Database.getAllData('Deliveries');
    
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      end.setHours(23, 59, 59, 999);
      
      deliveries = deliveries.filter(d => {
        const date = new Date(d.deliveryDate);
        return date >= start && date <= end;
      });
    }
    
    if (data.status) {
      deliveries = deliveries.filter(d => d.deliveryStatus === data.status);
    }
    
    if (data.driverId) {
      deliveries = deliveries.filter(d => d.driverId === data.driverId);
    }
    
    if (data.transactionId) {
      deliveries = deliveries.filter(d => d.transactionId === data.transactionId);
    }
    
    if (data.search) {
      const search = data.search.toLowerCase();
      deliveries = deliveries.filter(d =>
        d.deliveryNumber.toLowerCase().includes(search) ||
        d.customerName.toLowerCase().includes(search) ||
        d.invoiceNumber.toLowerCase().includes(search)
      );
    }
    
    deliveries.sort((a, b) => new Date(b.deliveryDate) - new Date(a.deliveryDate));
    
    const result = Utils.paginate(deliveries, data.page, data.pageSize);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  },
  
  get: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const delivery = Database.getById('Deliveries', data.id);
    if (!delivery) {
      return { success: false, error: "Pengiriman tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const items = Database.getByColumn('DeliveryItems', 'deliveryId', data.id);
    
    return {
      success: true,
      data: {
        ...delivery,
        items: items
      }
    };
  },
  
  /**
   * DIPERBAIKI: Create delivery with LockService and bulkUpdate
   */
  create: function(data) {
    const validation = Utils.validateRequired(data, [
      'deliveryNumber', 'deliveryDate', 'transactionId', 
      'driverId', 'vehicleId', 'items'
    ]);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(CONFIG.LOCK_TIMEOUT)) {
      return { success: false, error: 'Sistem sedang sibuk', code: 'SYSTEM_BUSY' };
    }
    
    try {
      // Check duplicate
      const existing = Database.getOneByColumn('Deliveries', 'deliveryNumber', data.deliveryNumber, false);
      if (existing) {
        return { success: false, error: "Nomor surat jalan sudah digunakan", code: "DUPLICATE_NUMBER" };
      }
      
      const transaction = Database.getById('Transactions', data.transactionId, false);
      if (!transaction) {
        return { success: false, error: "Transaksi tidak ditemukan" };
      }
      
      const customer = Database.getById('Customers', transaction.customerId, false);
      
      const driver = Database.getById('Drivers', data.driverId, false);
      if (!driver) {
        return { success: false, error: "Driver tidak ditemukan" };
      }
      
      const vehicle = Database.getById('Vehicles', data.vehicleId, false);
      if (!vehicle) {
        return { success: false, error: "Kendaraan tidak ditemukan" };
      }
      
      // Process items
      let totalItems = 0;
      let totalWeight = 0;
      const processedItems = [];
      
      for (const item of data.items) {
        const transactionItem = Database.getById('TransactionItems', item.transactionItemId, false);
        if (!transactionItem) {
          return { success: false, error: "Item transaksi tidak ditemukan" };
        }
        
        const qtyDeliveredUnit = parseFloat(item.qtyDeliveredUnit) || 0;
        const qtyDeliveredKg = qtyDeliveredUnit * transactionItem.unitWeight;
        
        totalItems += qtyDeliveredUnit;
        totalWeight += qtyDeliveredKg;
        
        processedItems.push({
          transactionItemId: item.transactionItemId,
          productId: transactionItem.productId,
          productCode: transactionItem.productCode,
          productName: transactionItem.productName,
          qtyDeliveredUnit: qtyDeliveredUnit,
          qtyDeliveredKg: qtyDeliveredKg,
          unitName: transactionItem.unitName,
          kgName: transactionItem.kgName,
          notes: item.notes || ''
        });
      }
      
      // Create delivery
      const deliveryId = Utils.generateUUID();
      const delivery = Database.insert('Deliveries', {
        id: deliveryId,
        deliveryNumber: data.deliveryNumber,
        deliveryDate: data.deliveryDate,
        transactionId: transaction.id,
        invoiceNumber: transaction.invoiceNumber,
        customerId: transaction.customerId,
        customerCode: transaction.customerCode,
        customerName: transaction.customerName,
        customerAddress: transaction.customerAddress,
        customerPhone: transaction.customerPhone,
        googleMapsUrl: customer ? customer.googleMapsUrl : '',
        driverId: driver.id,
        driverName: driver.driverName,
        driverPhone: driver.phone,
        vehicleId: vehicle.id,
        vehiclePlate: vehicle.vehiclePlate,
        vehicleType: vehicle.vehicleType,
        totalItems: totalItems,
        totalWeight: totalWeight,
        deliveryStatus: 'PENDING',
        notes: data.notes || '',
        createdBy: data._user.userId
      });
      
      // Bulk insert delivery items
      const itemsToInsert = processedItems.map(item => ({
        deliveryId: deliveryId,
        deliveryNumber: data.deliveryNumber,
        ...item
      }));
      
      Database.bulkInsert('DeliveryItems', itemsToInsert);
      
      // Update transaction delivery status
      Database.update('Transactions', transaction.id, {
        deliveryStatus: 'PROCESSING',
        updatedBy: data._user.userId
      });
      
      // ==========================================
      // PERBAIKAN: Gunakan bulkUpdate untuk TransactionItems
      // ==========================================
      const itemUpdates = processedItems.map(item => {
        const transItem = Database.getById('TransactionItems', item.transactionItemId, false);
        const newFulfilledUnit = transItem.qtyFulfilledUnit + item.qtyDeliveredUnit;
        const newFulfilledKg = transItem.qtyFulfilledKg + item.qtyDeliveredKg;
        const newUnfulfilledUnit = transItem.qtyOrderUnit - newFulfilledUnit;
        const newUnfulfilledKg = transItem.qtyOrderKg - newFulfilledKg;
        
        let fulfillmentStatus = 'UNFULFILLED';
        if (newUnfulfilledUnit <= 0) {
          fulfillmentStatus = 'FULFILLED';
        } else if (newFulfilledUnit > 0) {
          fulfillmentStatus = 'PARTIAL';
        }
        
        return {
          id: item.transactionItemId,
          data: {
            qtyFulfilledUnit: newFulfilledUnit,
            qtyFulfilledKg: newFulfilledKg,
            qtyUnfulfilledUnit: Math.max(0, newUnfulfilledUnit),
            qtyUnfulfilledKg: Math.max(0, newUnfulfilledKg),
            fulfillmentStatus: fulfillmentStatus
          }
        };
      });
      
      // Bulk update semua transaction items sekaligus
      Database.bulkUpdate('TransactionItems', itemUpdates);
      // ==========================================
      
      Database.insert('AuditLogs', {
        userId: data._user.userId,
        userName: data._user.username,
        userRole: data._user.role,
        action: 'CREATE',
        module: 'Delivery',
        entityId: deliveryId,
        entityType: 'Delivery',
        timestamp: Utils.getCurrentTimestamp()
      });
      
      return {
        success: true,
        data: {
          ...delivery,
          items: processedItems
        }
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      lock.releaseLock();
    }
  },
  
  update: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('Deliveries', data.id);
    if (!existing) {
      return { success: false, error: "Pengiriman tidak ditemukan", code: "NOT_FOUND" };
    }
    
    if (existing.deliveryStatus === 'DELIVERED') {
      return {
        success: false,
        error: "Tidak dapat mengubah pengiriman yang sudah selesai",
        code: "ALREADY_DELIVERED"
      };
    }
    
    const updateData = { updatedBy: data._user.userId };
    
    if (data.driverId) {
      const driver = Database.getById('Drivers', data.driverId);
      if (driver) {
        updateData.driverId = driver.id;
        updateData.driverName = driver.driverName;
        updateData.driverPhone = driver.phone;
      }
    }
    
    if (data.vehicleId) {
      const vehicle = Database.getById('Vehicles', data.vehicleId);
      if (vehicle) {
        updateData.vehicleId = vehicle.id;
        updateData.vehiclePlate = vehicle.vehiclePlate;
        updateData.vehicleType = vehicle.vehicleType;
      }
    }
    
    if (data.deliveryDate) updateData.deliveryDate = data.deliveryDate;
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    const updated = Database.update('Deliveries', data.id, updateData);
    
    return { success: true, data: updated };
  },
  
  updateStatus: function(data) {
    const validation = Utils.validateRequired(data, ['id', 'status']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const delivery = Database.getById('Deliveries', data.id);
    if (!delivery) {
      return { success: false, error: "Pengiriman tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const validStatuses = ['PENDING', 'ON_DELIVERY', 'DELIVERED', 'FAILED'];
    if (!validStatuses.includes(data.status)) {
      return { success: false, error: "Status tidak valid" };
    }
    
    const updateData = {
      deliveryStatus: data.status,
      updatedBy: data._user.userId
    };
    
    if (data.status === 'DELIVERED') {
      updateData.deliveryTime = Utils.getCurrentTimestamp();
    }
    
    const updated = Database.update('Deliveries', data.id, updateData);
    
    this.updateTransactionDeliveryStatus(delivery.transactionId, data._user.userId);
    
    return { success: true, data: updated };
  },
  
  complete: function(data) {
    const validation = Utils.validateRequired(data, ['id', 'receiverName']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const delivery = Database.getById('Deliveries', data.id);
    if (!delivery) {
      return { success: false, error: "Pengiriman tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const updateData = {
      deliveryStatus: 'DELIVERED',
      deliveryTime: Utils.getCurrentTimestamp(),
      receiverName: data.receiverName,
      receiverSignature: data.signatureUrl || '',
      deliveryPhoto: data.photoUrl || '',
      updatedBy: data._user.userId
    };
    
    const updated = Database.update('Deliveries', data.id, updateData);
    
    this.updateTransactionDeliveryStatus(delivery.transactionId, data._user.userId);
    
    Database.insert('AuditLogs', {
      userId: data._user.userId,
      userName: data._user.username,
      userRole: data._user.role,
      action: 'UPDATE',
      module: 'Delivery',
      entityId: data.id,
      entityType: 'Delivery',
      notes: 'Delivery completed',
      timestamp: Utils.getCurrentTimestamp()
    });
    
    return { success: true, data: updated };
  },
  
  uploadProof: function(data) {
    const validation = Utils.validateRequired(data, ['id', 'type', 'fileName', 'mimeType', 'base64Data']);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const delivery = Database.getById('Deliveries', data.id);
    if (!delivery) {
      return { success: false, error: "Pengiriman tidak ditemukan" };
    }
    
    const uploadResult = FileService.upload({
      fileName: data.fileName,
      mimeType: data.mimeType,
      base64Data: data.base64Data,
      subFolder: 'delivery_proofs'
    });
    
    if (!uploadResult.success) {
      return uploadResult;
    }
    
    const updateField = data.type === 'signature' ? 'receiverSignature' : 'deliveryPhoto';
    Database.update('Deliveries', data.id, {
      [updateField]: uploadResult.data.fileUrl,
      updatedBy: data._user.userId
    });
    
    return {
      success: true,
      data: {
        fileUrl: uploadResult.data.fileUrl
      }
    };
  },
  
  updateTransactionDeliveryStatus: function(transactionId, userId) {
    const transaction = Database.getById('Transactions', transactionId);
    if (!transaction) return;
    
    const items = Database.getByColumn('TransactionItems', 'transactionId', transactionId);
    
    let allFulfilled = true;
    let anyFulfilled = false;
    
    items.forEach(item => {
      if (item.fulfillmentStatus === 'FULFILLED') {
        anyFulfilled = true;
      } else {
        allFulfilled = false;
      }
    });
    
    let newStatus;
    if (allFulfilled) {
      newStatus = 'DELIVERED';
    } else if (anyFulfilled) {
      newStatus = 'PARTIAL';
    } else {
      newStatus = 'PROCESSING';
    }
    
    Database.update('Transactions', transactionId, {
      deliveryStatus: newStatus,
      updatedBy: userId
    });
  }
};

// ===========================================
// DRIVER SERVICE
// ===========================================

const DriverService = {
  list: function(data) {
    let drivers = data.activeOnly !== false ?
      Database.getActiveData('Drivers') :
      Database.getAllData('Drivers');
    
    if (data.search) {
      const search = data.search.toLowerCase();
      drivers = drivers.filter(d =>
        d.driverCode.toLowerCase().includes(search) ||
        d.driverName.toLowerCase().includes(search)
      );
    }
    
    drivers.sort((a, b) => a.driverName.localeCompare(b.driverName));
    
    const result = Utils.paginate(drivers, data.page, data.pageSize);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  },
  
  get: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const driver = Database.getById('Drivers', data.id);
    if (!driver) {
      return { success: false, error: "Driver tidak ditemukan", code: "NOT_FOUND" };
    }
    
    return { success: true, data: driver };
  },
  
  create: function(data) {
    const validation = Utils.validateRequired(data, [
      'driverCode', 'driverName', 'phone', 'licenseNumber', 'licenseExpiry'
    ]);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const existing = Database.getOneByColumn('Drivers', 'driverCode', data.driverCode);
    if (existing) {
      return { success: false, error: "Kode driver sudah digunakan", code: "DUPLICATE_CODE" };
    }
    
    const driver = Database.insert('Drivers', {
      driverCode: data.driverCode,
      driverName: data.driverName,
      phone: data.phone,
      licenseNumber: data.licenseNumber,
      licenseExpiry: data.licenseExpiry,
      address: data.address || '',
      isActive: true,
      notes: data.notes || '',
      createdBy: data._user.userId
    });
    
    return { success: true, data: driver };
  },
  
  update: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('Drivers', data.id);
    if (!existing) {
      return { success: false, error: "Driver tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const updateFields = [
      'driverCode', 'driverName', 'phone', 'licenseNumber', 
      'licenseExpiry', 'address', 'isActive', 'notes'
    ];
    
    const updateData = { updatedBy: data._user.userId };
    updateFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });
    
    const updated = Database.update('Drivers', data.id, updateData);
    
    return { success: true, data: updated };
  },
  
  delete: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    Database.softDelete('Drivers', data.id, data._user.userId);
    
    return { success: true };
  }
};

// ===========================================
// VEHICLE SERVICE
// ===========================================

const VehicleService = {
  list: function(data) {
    let vehicles = data.activeOnly !== false ?
      Database.getActiveData('Vehicles') :
      Database.getAllData('Vehicles');
    
    if (data.search) {
      const search = data.search.toLowerCase();
      vehicles = vehicles.filter(v =>
        v.vehiclePlate.toLowerCase().includes(search) ||
        (v.vehicleBrand && v.vehicleBrand.toLowerCase().includes(search))
      );
    }
    
    if (data.vehicleType) {
      vehicles = vehicles.filter(v => v.vehicleType === data.vehicleType);
    }
    
    vehicles.sort((a, b) => a.vehiclePlate.localeCompare(b.vehiclePlate));
    
    const result = Utils.paginate(vehicles, data.page, data.pageSize);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  },
  
  get: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const vehicle = Database.getById('Vehicles', data.id);
    if (!vehicle) {
      return { success: false, error: "Kendaraan tidak ditemukan", code: "NOT_FOUND" };
    }
    
    return { success: true, data: vehicle };
  },
  
  create: function(data) {
    const validation = Utils.validateRequired(data, [
      'vehiclePlate', 'vehicleType', 'maxCapacityKg', 'stnkExpiry'
    ]);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const existing = Database.getOneByColumn('Vehicles', 'vehiclePlate', data.vehiclePlate);
    if (existing) {
      return { success: false, error: "Plat nomor sudah terdaftar", code: "DUPLICATE_PLATE" };
    }
    
    const vehicle = Database.insert('Vehicles', {
      vehiclePlate: data.vehiclePlate,
      vehicleType: data.vehicleType,
      vehicleBrand: data.vehicleBrand || '',
      vehicleModel: data.vehicleModel || '',
      maxCapacityKg: parseFloat(data.maxCapacityKg) || 0,
      stnkExpiry: data.stnkExpiry,
      kirExpiry: data.kirExpiry || '',
      isActive: true,
      notes: data.notes || '',
      createdBy: data._user.userId
    });
    
    return { success: true, data: vehicle };
  },
  
  update: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('Vehicles', data.id);
    if (!existing) {
      return { success: false, error: "Kendaraan tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const updateFields = [
      'vehiclePlate', 'vehicleType', 'vehicleBrand', 'vehicleModel',
      'maxCapacityKg', 'stnkExpiry', 'kirExpiry', 'isActive', 'notes'
    ];
    
    const updateData = { updatedBy: data._user.userId };
    updateFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });
    
    const updated = Database.update('Vehicles', data.id, updateData);
    
    return { success: true, data: updated };
  },
  
  delete: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    Database.softDelete('Vehicles', data.id, data._user.userId);
    
    return { success: true };
  }
};

// ===========================================
// TARGET SERVICE
// ===========================================

const TargetService = {
  list: function(data) {
    let targets = Database.getAllData('SalesTargets');
    
    if (data.year) {
      targets = targets.filter(t => t.year === parseInt(data.year));
    }
    
    if (data.month) {
      targets = targets.filter(t => t.month === parseInt(data.month));
    }
    
    if (data.targetType) {
      targets = targets.filter(t => t.targetType === data.targetType);
    }
    
    targets.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    const result = Utils.paginate(targets, data.page, data.pageSize);
    
    return {
      success: true,
      data: result.data,
      pagination: result.pagination
    };
  },
  
  get: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const target = Database.getById('SalesTargets', data.id);
    if (!target) {
      return { success: false, error: "Target tidak ditemukan", code: "NOT_FOUND" };
    }
    
    return { success: true, data: target };
  },
  
  create: function(data) {
    const validation = Utils.validateRequired(data, [
      'year', 'month', 'targetType', 'targetAmount'
    ]);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const existing = Database.search('SalesTargets', {
      year: parseInt(data.year),
      month: parseInt(data.month),
      targetType: data.targetType,
      targetEntityId: data.targetEntityId || ''
    });
    
    if (existing.length > 0) {
      return { success: false, error: "Target untuk periode ini sudah ada", code: "DUPLICATE" };
    }
    
    const target = Database.insert('SalesTargets', {
      year: parseInt(data.year),
      month: parseInt(data.month),
      targetType: data.targetType,
      targetEntityId: data.targetEntityId || '',
      targetEntityName: data.targetEntityName || '',
      targetAmount: parseFloat(data.targetAmount) || 0,
      targetQtyUnit: parseFloat(data.targetQtyUnit) || 0,
      targetQtyKg: parseFloat(data.targetQtyKg) || 0,
      targetCustomerCount: parseInt(data.targetCustomerCount) || 0,
      achievedAmount: 0,
      achievedQtyUnit: 0,
      achievedQtyKg: 0,
      achievedCustomerCount: 0,
      achievementPercent: 0,
      notes: data.notes || '',
      createdBy: data._user.userId
    });
    
    return { success: true, data: target };
  },
  
  update: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    const existing = Database.getById('SalesTargets', data.id);
    if (!existing) {
      return { success: false, error: "Target tidak ditemukan", code: "NOT_FOUND" };
    }
    
    const updateFields = [
      'targetAmount', 'targetQtyUnit', 'targetQtyKg', 
      'targetCustomerCount', 'notes'
    ];
    
    const updateData = { updatedBy: data._user.userId };
    updateFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });
    
    const updated = Database.update('SalesTargets', data.id, updateData);
    
    return { success: true, data: updated };
  },
  
  delete: function(data) {
    if (!data.id) {
      return { success: false, error: "ID required" };
    }
    
    Database.hardDelete('SalesTargets', data.id);
    
    return { success: true };
  },
  
  getAchievement: function(data) {
    const year = data.year || new Date().getFullYear();
    const month = data.month;
    
    let targets = Database.search('SalesTargets', { year: year });
    
    if (month) {
      targets = targets.filter(t => t.month === parseInt(month));
    }
    
    const results = targets.map(target => {
      const startDate = new Date(target.year, target.month - 1, 1);
      const endDate = new Date(target.year, target.month, 0, 23, 59, 59);
      
      let transactions;
      
      if (target.targetType === 'COMPANY') {
        transactions = Database.getByDateRange(
          'Transactions', 'invoiceDate',
          startDate.toISOString(), endDate.toISOString()
        );
      } else if (target.targetType === 'SALES' && target.targetEntityId) {
        transactions = Database.getByDateRange(
          'Transactions', 'invoiceDate',
          startDate.toISOString(), endDate.toISOString()
        ).filter(t => t.salesId === target.targetEntityId);
      } else {
        transactions = [];
      }
      
      const achievedAmount = transactions.reduce((sum, t) => sum + t.grandTotal, 0);
      const achievementPercent = target.targetAmount > 0 
        ? ((achievedAmount / target.targetAmount) * 100).toFixed(2)
        : 0;
      
      let status;
      if (parseFloat(achievementPercent) >= 100) {
        status = 'ACHIEVED';
      } else if (parseFloat(achievementPercent) >= 75) {
        status = 'ON_TRACK';
      } else if (parseFloat(achievementPercent) >= 50) {
        status = 'WARNING';
      } else {
        status = 'BEHIND';
      }
      
      return {
        ...target,
        achievedAmount: achievedAmount,
        achievementPercent: parseFloat(achievementPercent),
        remainingAmount: Math.max(0, target.targetAmount - achievedAmount),
        status: status
      };
    });
    
    return { success: true, data: results };
  }
};

// ===========================================
// REPORT SERVICE
// ===========================================

const ReportService = {
  getDashboard: function(data) {
    const cacheKey = 'dashboard_' + Utils.formatDate(new Date(), 'date');
    const cached = CACHE.get(cacheKey);
    if (cached && !data.refresh) {
      return JSON.parse(cached);
    }
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const transactions = Database.getByDateRange(
      'Transactions', 'invoiceDate',
      startOfMonth.toISOString(), endOfMonth.toISOString()
    );
    
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todayTransactions = transactions.filter(t => {
      const date = new Date(t.invoiceDate);
      return date >= todayStart && date <= todayEnd;
    });
    
    const dailySummary = {
      totalInvoices: todayTransactions.length,
      totalCustomers: [...new Set(todayTransactions.map(t => t.customerId))].length,
      totalAmount: todayTransactions.reduce((sum, t) => sum + t.grandTotal, 0)
    };
    
    const monthlySummary = {
      totalInvoices: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.grandTotal, 0),
      paidAmount: transactions.reduce((sum, t) => sum + t.paidAmount, 0),
      pendingAmount: transactions.reduce((sum, t) => sum + t.remainingAmount, 0)
    };
    
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const prevTransactions = Database.getByDateRange(
      'Transactions', 'invoiceDate',
      prevMonthStart.toISOString(), prevMonthEnd.toISOString()
    );
    
    const prevMonthTotal = prevTransactions.reduce((sum, t) => sum + t.grandTotal, 0);
    
    const monthlyComparison = {
      currentMonth: monthlySummary.totalAmount,
      previousMonth: prevMonthTotal,
      percentChange: prevMonthTotal > 0 
        ? ((monthlySummary.totalAmount - prevMonthTotal) / prevMonthTotal * 100).toFixed(2)
        : 0
    };
    
    const monthlyTrend = [];
    for (let m = 0; m <= today.getMonth(); m++) {
      const monthStart = new Date(today.getFullYear(), m, 1);
      const monthEnd = new Date(today.getFullYear(), m + 1, 0);
      
      const monthTransactions = Database.getByDateRange(
        'Transactions', 'invoiceDate',
        monthStart.toISOString(), monthEnd.toISOString()
      );
      
      monthlyTrend.push({
        month: m + 1,
        monthName: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 
                    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][m],
        totalAmount: monthTransactions.reduce((sum, t) => sum + t.grandTotal, 0),
        totalInvoices: monthTransactions.length
      });
    }
    
    const currentTarget = Database.search('SalesTargets', {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      targetType: 'COMPANY'
    })[0];
    
    const targetAchievement = currentTarget ? {
      targetAmount: currentTarget.targetAmount,
      achievedAmount: monthlySummary.totalAmount,
      achievementPercent: ((monthlySummary.totalAmount / currentTarget.targetAmount) * 100).toFixed(2)
    } : null;
    
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    
    const result = {
      success: true,
      data: {
        dailySummary,
        monthlySummary,
        monthlyComparison,
        monthlyTrend,
        targetAchievement,
        recentTransactions
      }
    };
    
    CACHE.put(cacheKey, JSON.stringify(result), 300);
    
    return result;
  },
  
  getSalesReport: function(data) {
    const startDate = data.startDate;
    const endDate = data.endDate;
    
    if (!startDate || !endDate) {
      return { success: false, error: "Start date and end date required" };
    }
    
    const transactions = Database.getByDateRange(
      'Transactions', 'invoiceDate', startDate, endDate
    );
    
    const summary = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.grandTotal, 0),
      totalPaid: transactions.reduce((sum, t) => sum + t.paidAmount, 0),
      totalUnpaid: transactions.reduce((sum, t) => sum + t.remainingAmount, 0),
      uniqueCustomers: [...new Set(transactions.map(t => t.customerId))].length
    };
    
    const salesData = {};
    transactions.forEach(t => {
      if (!salesData[t.salesId]) {
        salesData[t.salesId] = {
          salesId: t.salesId,
          salesName: t.salesName,
          totalTransactions: 0,
          totalAmount: 0
        };
      }
      salesData[t.salesId].totalTransactions++;
      salesData[t.salesId].totalAmount += t.grandTotal;
    });
    
    return {
      success: true,
      data: {
        summary,
        bySales: Object.values(salesData).sort((a, b) => b.totalAmount - a.totalAmount),
        transactions
      }
    };
  },
  
  getDailyReport: function(data) {
    const date = data.date || Utils.formatDate(new Date(), 'date');
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const transactions = Database.getByDateRange(
      'Transactions', 'invoiceDate',
      startDate.toISOString(), endDate.toISOString()
    );
    
    const deliveries = Database.getByDateRange(
      'Deliveries', 'deliveryDate',
      startDate.toISOString(), endDate.toISOString()
    );
    
    return {
      success: true,
      data: {
        date: date,
        transactions: {
          count: transactions.length,
          totalAmount: transactions.reduce((sum, t) => sum + t.grandTotal, 0),
          items: transactions
        },
        deliveries: {
          count: deliveries.length,
          completed: deliveries.filter(d => d.deliveryStatus === 'DELIVERED').length,
          pending: deliveries.filter(d => d.deliveryStatus === 'PENDING').length,
          items: deliveries
        }
      }
    };
  },
  
  getWeeklyReport: function(data) {
    let startDate = data.startDate;
    let endDate = data.endDate;
    
    if (!startDate || !endDate) {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      startDate = monday.toISOString().split('T')[0];
      endDate = new Date(monday.setDate(monday.getDate() + 6)).toISOString().split('T')[0];
    }
    
    const transactions = Database.getByDateRange(
      'Transactions', 'invoiceDate', startDate, endDate
    );
    
    const dailyData = {};
    let current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      dailyData[dateStr] = {
        date: dateStr,
        transactionCount: 0,
        transactionAmount: 0
      };
      current.setDate(current.getDate() + 1);
    }
    
    transactions.forEach(t => {
      const dateStr = new Date(t.invoiceDate).toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].transactionCount++;
        dailyData[dateStr].transactionAmount += t.grandTotal;
      }
    });
    
    return {
      success: true,
      data: {
        startDate,
        endDate,
        summary: {
          totalTransactions: transactions.length,
          totalAmount: transactions.reduce((sum, t) => sum + t.grandTotal, 0)
        },
        dailyData: Object.values(dailyData)
      }
    };
  },
  
  getMonthlyReport: function(data) {
    const year = data.year || new Date().getFullYear();
    const month = data.month || new Date().getMonth() + 1;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const transactions = Database.getByDateRange(
      'Transactions', 'invoiceDate',
      startDate.toISOString(), endDate.toISOString()
    );
    
    const totalSales = transactions.reduce((sum, t) => sum + t.grandTotal, 0);
    
    const target = Database.search('SalesTargets', {
      year: year,
      month: month,
      targetType: 'COMPANY'
    })[0];
    
    return {
      success: true,
      data: {
        year,
        month,
        summary: {
          totalTransactions: transactions.length,
          totalSales: totalSales,
          totalPaid: transactions.reduce((sum, t) => sum + t.paidAmount, 0),
          totalUnpaid: transactions.reduce((sum, t) => sum + t.remainingAmount, 0),
          uniqueCustomers: [...new Set(transactions.map(t => t.customerId))].length
        },
        target: target ? {
          targetAmount: target.targetAmount,
          achievedAmount: totalSales,
          achievementPercent: ((totalSales / target.targetAmount) * 100).toFixed(2)
        } : null,
        transactions,
        topProducts: this.getTopProducts({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }).data,
        topCustomers: this.getTopCustomers({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }).data
      }
    };
  },
  
  getYearlyReport: function(data) {
    const year = data.year || new Date().getFullYear();
    
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    
    const transactions = Database.getByDateRange(
      'Transactions', 'invoiceDate',
      startDate.toISOString(), endDate.toISOString()
    );
    
    const monthlyData = [];
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(year, m, 1);
      const monthEnd = new Date(year, m + 1, 0, 23, 59, 59);
      
      const monthTransactions = transactions.filter(t => {
        const date = new Date(t.invoiceDate);
        return date >= monthStart && date <= monthEnd;
      });
      
      const target = Database.search('SalesTargets', {
        year: year,
        month: m + 1,
        targetType: 'COMPANY'
      })[0];
      
      const totalSales = monthTransactions.reduce((sum, t) => sum + t.grandTotal, 0);
      
      monthlyData.push({
        month: m + 1,
        monthName: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'][m],
        transactionCount: monthTransactions.length,
        totalSales: totalSales,
        targetAmount: target ? target.targetAmount : 0,
        achievementPercent: target ? ((totalSales / target.targetAmount) * 100).toFixed(2) : 0
      });
    }
    
    return {
      success: true,
      data: {
        year,
        summary: {
          totalTransactions: transactions.length,
          totalSales: transactions.reduce((sum, t) => sum + t.grandTotal, 0),
          totalPaid: transactions.reduce((sum, t) => sum + t.paidAmount, 0),
          uniqueCustomers: [...new Set(transactions.map(t => t.customerId))].length
        },
        monthlyData,
        topProducts: this.getTopProducts({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }).data,
        topCustomers: this.getTopCustomers({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }).data
      }
    };
  },
  
  getTopProducts: function(data) {
    const startDate = data.startDate;
    const endDate = data.endDate;
    
    const transactions = Database.getByDateRange(
      'Transactions', 'invoiceDate', startDate, endDate
    );
    
    const transactionIds = transactions.map(t => t.id);
    const allItems = Database.getAllData('TransactionItems');
    const items = allItems.filter(item => transactionIds.includes(item.transactionId));
    
    const productSales = {};
    items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          totalQtyUnit: 0,
          totalQtyKg: 0,
          totalAmount: 0,
          transactionCount: 0
        };
      }
      productSales[item.productId].totalQtyUnit += item.qtyFulfilledUnit;
      productSales[item.productId].totalQtyKg += item.qtyFulfilledKg;
      productSales[item.productId].totalAmount += item.totalAmount;
      productSales[item.productId].transactionCount++;
    });
    
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
    
    return { success: true, data: topProducts };
  },
  
  getTopCustomers: function(data) {
    const startDate = data.startDate;
    const endDate = data.endDate;
    
    const transactions = Database.getByDateRange(
      'Transactions', 'invoiceDate', startDate, endDate
    );
    
    const customerSales = {};
    transactions.forEach(t => {
      if (!customerSales[t.customerId]) {
        customerSales[t.customerId] = {
          customerId: t.customerId,
          customerCode: t.customerCode,
          customerName: t.customerName,
          totalAmount: 0,
          paidAmount: 0,
          invoiceCount: 0
        };
      }
      customerSales[t.customerId].totalAmount += t.grandTotal;
      customerSales[t.customerId].paidAmount += t.paidAmount;
      customerSales[t.customerId].invoiceCount++;
    });
    
    const topCustomers = Object.values(customerSales)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);
    
    return { success: true, data: topCustomers };
  },
  
  getTargetAchievement: function(data) {
    return TargetService.getAchievement(data);
  }
};

// ===========================================
// EXPORT SERVICE
// ===========================================

const ExportService = {
  exportTransactions: function(data) {
    const transactions = TransactionService.list({
      startDate: data.startDate,
      endDate: data.endDate,
      page: 1,
      pageSize: 10000
    }).data;
    
    if (data.format === 'csv') {
      return this.toCSV(transactions, 'transactions');
    }
    
    return { success: true, data: transactions };
  },
  
  exportDeliveries: function(data) {
    const deliveries = DeliveryService.list({
      startDate: data.startDate,
      endDate: data.endDate,
      page: 1,
      pageSize: 10000
    }).data;
    
    if (data.format === 'csv') {
      return this.toCSV(deliveries, 'deliveries');
    }
    
    return { success: true, data: deliveries };
  },
  
  exportReport: function(data) {
    const reportType = data.reportType;
    let reportData;
    
    switch (reportType) {
      case 'daily':
        reportData = ReportService.getDailyReport(data).data;
        break;
      case 'weekly':
        reportData = ReportService.getWeeklyReport(data).data;
        break;
      case 'monthly':
        reportData = ReportService.getMonthlyReport(data).data;
        break;
      case 'yearly':
        reportData = ReportService.getYearlyReport(data).data;
        break;
      default:
        return { success: false, error: "Invalid report type" };
    }
    
    return { success: true, data: reportData };
  },
  
  toCSV: function(data, type) {
    if (!data || data.length === 0) {
      return { success: true, data: '' };
    }
    
    const headers = Object.keys(data[0]).filter(k => k !== 'items');
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
      const values = headers.map(header => {
        let value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
      });
      csvContent += values.join(',') + '\n';
    });
    
    return {
      success: true,
      data: csvContent,
      contentType: 'text/csv',
      filename: type + '_' + Utils.formatDate(new Date(), 'date') + '.csv'
    };
  }
};

// ===========================================
// MAINTENANCE SERVICE - AUDIT LOG ARCHIVAL (DIPERBAIKI)
// ===========================================

const MaintenanceService = {
  /**
   * Archive old audit logs (run as daily trigger)
   * DIPERBAIKI: Menggunakan bulk rewrite alih-alih delete satu per satu
   */
  archiveAuditLogs: function(daysOld) {
    daysOld = daysOld || 90; // Default 90 days
    
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(30000)) {
      return { success: false, error: 'Could not acquire lock' };
    }
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const logs = Database.getAllData('AuditLogs', false);
      const oldLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp || log.createdAt);
        return logDate < cutoffDate;
      });
      
      if (oldLogs.length === 0) {
        return { success: true, message: 'No logs to archive', count: 0 };
      }
      
      // Create or get archive spreadsheet
      const archiveId = this.getOrCreateArchiveSpreadsheet();
      const archiveSs = SpreadsheetApp.openById(archiveId);
      
      // Get or create archive sheet
      let archiveSheet = archiveSs.getSheetByName('AuditLogs_Archive');
      if (!archiveSheet) {
        archiveSheet = archiveSs.insertSheet('AuditLogs_Archive');
        archiveSheet.getRange(1, 1, 1, SHEET_SCHEMAS.AuditLogs.length)
          .setValues([SHEET_SCHEMAS.AuditLogs]);
      }
      
      // Append old logs to archive
      const headers = SHEET_SCHEMAS.AuditLogs;
      const rows = oldLogs.map(log => headers.map(h => log[h] || ''));
      
      if (rows.length > 0) {
        archiveSheet.getRange(
          archiveSheet.getLastRow() + 1, 1, rows.length, headers.length
        ).setValues(rows);
      }
      
      // ==========================================
      // PERBAIKAN: Tulis ulang sisa log aktif (Bulk Rewrite)
      // ==========================================
      const oldLogIds = new Set(oldLogs.map(log => log.id));
      const remainingLogs = logs.filter(log => !oldLogIds.has(log.id));
      const mainSheet = Database.getSheet('AuditLogs');
      
      // Bersihkan semua isi sheet (kecuali baris pertama/header)
      if (mainSheet.getLastRow() > 1) {
        mainSheet.getRange(2, 1, mainSheet.getLastRow() - 1, mainSheet.getLastColumn()).clearContent();
      }
      
      // Tulis ulang log yang tidak diarsipkan sekaligus
      if (remainingLogs.length > 0) {
        const remainingRows = remainingLogs.map(log => headers.map(h => log[h] !== undefined ? log[h] : ''));
        mainSheet.getRange(2, 1, remainingRows.length, headers.length).setValues(remainingRows);
      }
      
      Database.clearCache('AuditLogs');
      // ==========================================
      
      return {
        success: true,
        message: `Archived ${oldLogs.length} audit logs`,
        count: oldLogs.length
      };
      
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      lock.releaseLock();
    }
  },
  
  getOrCreateArchiveSpreadsheet: function() {
    const propKey = 'ARCHIVE_SPREADSHEET_ID';
    let archiveId = PropertiesService.getScriptProperties().getProperty(propKey);
    
    if (archiveId) {
      try {
        SpreadsheetApp.openById(archiveId);
        return archiveId;
      } catch (e) {
        // Spreadsheet doesn't exist, create new
      }
    }
    
    const ss = SpreadsheetApp.create('Transaction System Archive - ' + new Date().getFullYear());
    archiveId = ss.getId();
    PropertiesService.getScriptProperties().setProperty(propKey, archiveId);
    
    return archiveId;
  },
  
  /**
   * Clean up expired cache entries
   */
  cleanupCache: function() {
    // GAS Cache is self-cleaning, but we can clear specific patterns
    const sheetNames = Object.keys(SHEET_SCHEMAS);
    
    sheetNames.forEach(name => {
      Database.clearCache(name);
    });
    
    CACHE.remove('config_all');
    CACHE.remove('config_public');
    
    return { success: true, message: 'Cache cleared' };
  }
};

// ===========================================
// MANUAL INITIALIZATION & TEST FUNCTIONS
// ===========================================

/**
 * Run this function manually to initialize the system
 */
function initializeApp() {
  const result = SetupService.initialize();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Validate system setup
 */
function validateSetup() {
  const result = SetupService.validateSetup();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Test API login
 */
function testAPI() {
  const result = AuthService.login({
    username: 'admin',
    password: 'admin123'
  });
  
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

/**
 * Create scheduled trigger for audit log archival
 */
function createArchivalTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runDailyArchival') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new daily trigger at 2 AM
  ScriptApp.newTrigger('runDailyArchival')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
  
  Logger.log('Archival trigger created');
}

/**
 * Daily archival function (called by trigger)
 */
function runDailyArchival() {
  const result = MaintenanceService.archiveAuditLogs(90);
  Logger.log('Daily archival: ' + JSON.stringify(result));
}

/**
 * Get spreadsheet URL for easy access
 */
function getSpreadsheetUrl() {
  if (CONFIG.SPREADSHEET_ID) {
    return `[docs.google.com](https://docs.google.com/spreadsheets/d/${CONFIG.SPREADSHEET_ID})`;
  }
  return 'Spreadsheet not configured';
}
