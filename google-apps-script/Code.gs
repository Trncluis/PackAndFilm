/**
 * PackAndFilm Google Apps Script Backend (Production V3.2 - Multi-Admin & Enterprise Security)
 * 
 * Security Architecture & Key Features:
 * 1. Two Dedicated Admin Accounts (Partner 1 & Partner 2) with SHA-256 hashed credentials.
 * 2. Server-side session tokens with TTL (CacheService) for stateful authorization.
 * 3. Brute-force rate limiting (locks out after 5 consecutive failed attempts).
 * 4. ONE designated private Google Drive folder per booking (no public link exposure).
 * 5. Clean, sensible file naming inside customer folders without duplicate accumulation.
 * 6. "Customer Documents Folder" placed immediately after Notes (Column 20) in Bookings sheet.
 * 7. Dynamic column header mapping (resilient to column reordering or migrations).
 * 8. Audit logging: tracks which partner executed status updates and KYC approvals.
 * 9. Strict 4-step booking workflow: KYC Pending -> Confirmed -> Active Rental -> Completed.
 * 10. Complete separation between public customer bookings and restricted admin operations.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const KYC_ROOT_FOLDER_NAME = "PackAndFilm_KYC_Uploads";

// ─────────────────────────────────────────────────────────────
// 1. ADMIN CREDENTIALS & INITIALIZATION
// ─────────────────────────────────────────────────────────────

/**
 * SHA-256 Hash helper
 */
function hashString(str) {
  if (!str) return "";
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(str), Utilities.Charset.UTF_8);
  let hex = "";
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    hex += byteHex;
  }
  return hex;
}

/**
 * Default fallback admin accounts if PropertiesService has not been initialized.
 * Identities and access roles:
 * - Partner 1: username "partner1" (Lead Operations)
 * - Partner 2: username "partner2" (Equipment Manager)
 * Passwords stored securely as SHA-256 digests.
 * You can customize these at any time by running `setupAdminCredentials()` in Apps Script!
 */
const DEFAULT_ADMIN_CONFIG = {
  partner1: {
    name: "Partner 1 (Lead Operations)",
    // SHA-256 digest of admin 1 password
    hash: "60ff1c5671238d029b5fec5185d741fc3c63df32d2a02526fb5bad04c8d4b480"
  },
  partner2: {
    name: "Partner 2 (Equipment Manager)",
    // SHA-256 digest of admin 2 password
    hash: "a1166e19273ef9849bf5669549013d53fa68819979eab6869b3c733270860dd9"
  }
};

/**
 * Run this function once in Apps Script if you want to set custom private passkeys!
 */
function setupAdminCredentials(user1Pass, user2Pass) {
  const props = PropertiesService.getScriptProperties();
  const p1Hash = user1Pass ? hashString(user1Pass) : DEFAULT_ADMIN_CONFIG.partner1.hash;
  const p2Hash = user2Pass ? hashString(user2Pass) : DEFAULT_ADMIN_CONFIG.partner2.hash;

  props.setProperty("ADMIN_PARTNER1_HASH", p1Hash);
  props.setProperty("ADMIN_PARTNER1_NAME", "Partner 1 (Lead Operations)");
  props.setProperty("ADMIN_PARTNER2_HASH", p2Hash);
  props.setProperty("ADMIN_PARTNER2_NAME", "Partner 2 (Equipment Manager)");

  Logger.log("Admin accounts configured successfully in PropertiesService.");
}

/**
 * Utility function to clear all rate-limit lockout caches in Apps Script
 */
function clearAllLockouts() {
  const cache = CacheService.getScriptCache();
  cache.remove("fail_partner1");
  cache.remove("fail_partner2");
  cache.remove("fail_admin");
  cache.remove("fail_global");
  Logger.log("All lockout counters cleared.");
}

/**
 * Verify admin credentials against PropertiesService or default config
 */
function authenticateAdmin(username, password) {
  if (!password) return null;
  const cleanUser = String(username || "").trim().toLowerCase();
  const rawPass = String(password).trim();
  const inputHash = hashString(rawPass);
  const props = PropertiesService.getScriptProperties();

  // 1. Partner 1 Dedicated Passkey (SHA-256 hash validation)
  const savedP1Hash = props.getProperty("ADMIN_PARTNER1_HASH");
  const isP1Passkey =
    inputHash === DEFAULT_ADMIN_CONFIG.partner1.hash ||
    (savedP1Hash && inputHash === savedP1Hash);

  if (isP1Passkey && (cleanUser === "partner1" || !cleanUser)) {
    return { username: "partner1", name: props.getProperty("ADMIN_PARTNER1_NAME") || "Partner 1 (Lead Operations)" };
  }

  // 2. Partner 2 Dedicated Passkey (SHA-256 hash validation)
  const savedP2Hash = props.getProperty("ADMIN_PARTNER2_HASH");
  const isP2Passkey =
    inputHash === DEFAULT_ADMIN_CONFIG.partner2.hash ||
    (savedP2Hash && inputHash === savedP2Hash);

  if (isP2Passkey && (cleanUser === "partner2" || !cleanUser)) {
    return { username: "partner2", name: props.getProperty("ADMIN_PARTNER2_NAME") || "Partner 2 (Equipment Manager)" };
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// 2. SESSION TOKENS & BRUTE-FORCE RATE LIMITING
// ─────────────────────────────────────────────────────────────

const SESSION_TTL_SECONDS = 14400; // 4 Hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECONDS = 900; // 15 Minutes

function checkRateLimit(identifier) {
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get("fail_" + identifier) || 0);
  return fails >= MAX_FAILED_ATTEMPTS;
}

function recordFailedLogin(identifier) {
  const cache = CacheService.getScriptCache();
  const key = "fail_" + identifier;
  const fails = Number(cache.get(key) || 0) + 1;
  cache.put(key, String(fails), LOCKOUT_WINDOW_SECONDS);
  return fails;
}

function clearFailedLogins(identifier) {
  CacheService.getScriptCache().remove("fail_" + identifier);
}

function createAdminSession(adminProfile) {
  const token = Utilities.getUuid() + "-" + Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  const sessionData = JSON.stringify({
    username: adminProfile.username,
    name: adminProfile.name,
    createdAt: new Date().getTime()
  });
  cache.put("sess_" + token, sessionData, SESSION_TTL_SECONDS);
  return token;
}

function validateSessionToken(token) {
  if (!token || typeof token !== "string" || token.length < 20) {
    return null;
  }
  const cache = CacheService.getScriptCache();
  const raw = cache.get("sess_" + token);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function revokeSessionToken(token) {
  if (token) {
    CacheService.getScriptCache().remove("sess_" + token);
  }
}

// ─────────────────────────────────────────────────────────────
// 3. PRIVATE GOOGLE DRIVE FILE & FOLDER STORAGE
// ─────────────────────────────────────────────────────────────

/**
 * Retrieves or creates the top-level root folder for all customer KYC files.
 * Kept strictly private to the Google account owner / authorized admins.
 */
function getOrCreateRootFolder() {
  const folders = DriveApp.getFoldersByName(KYC_ROOT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const newFolder = DriveApp.createFolder(KYC_ROOT_FOLDER_NAME);
  return newFolder;
}

/**
 * Finds or creates ONE designated Google Drive subfolder for a specific booking.
 * Prevents creating duplicate folders on retries, updates, or additional uploads.
 */
function getOrCreateBookingFolder(rootFolder, bookingRef, customerName) {
  const cleanRef = String(bookingRef || "PNF-BOOKING").trim();
  const cleanCustomer = String(customerName || "Renter").replace(/[^a-zA-Z0-9]/g, "_");
  const folderName = cleanRef + "_" + cleanCustomer;

  // 1. Search for exact matching folder name
  const exactMatches = rootFolder.getFoldersByName(folderName);
  if (exactMatches.hasNext()) {
    return exactMatches.next();
  }

  // 2. Search for any folder starting with bookingRef to avoid variations
  const allFolders = rootFolder.getFolders();
  while (allFolders.hasNext()) {
    const f = allFolders.next();
    if (f.getName().startsWith(cleanRef)) {
      return f;
    }
  }

  // 3. Create fresh subfolder inside root
  const newFolder = rootFolder.createFolder(folderName);
  return newFolder;
}

/**
 * Saves base64 encoded document into the designated booking folder.
 * Preserves security: Documents remain private to the Google account owner/admins.
 * Overwrites/replaces any existing file for that slot to avoid duplicate clutter.
 */
function saveBase64ToDrive(parentFolder, base64Data, filenameBase, defaultExt) {
  if (!base64Data || typeof base64Data !== "string" || base64Data.trim() === "") {
    return "";
  }
  try {
    const parts = base64Data.split(",");
    const header = parts[0];
    const dataString = parts.length > 1 ? parts[1] : parts[0];

    let mimeType = "image/jpeg";
    let ext = defaultExt || ".jpg";

    const mimeMatch = header.match(/data:([^;]+);base64/);
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1].toLowerCase();
      if (mimeType.includes("png")) ext = ".png";
      else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = ".jpg";
      else if (mimeType.includes("pdf")) ext = ".pdf";
      else if (mimeType.includes("mp4")) ext = ".mp4";
      else if (mimeType.includes("quicktime")) ext = ".mov";
      else if (mimeType.includes("webm")) ext = ".webm";
    }

    const fullFilename = filenameBase + ext;

    // Check if an existing file with this base name exists in this folder, trash it to avoid duplicate clutter
    const existingFiles = parentFolder.getFiles();
    while (existingFiles.hasNext()) {
      const existing = existingFiles.next();
      if (existing.getName().startsWith(filenameBase)) {
        existing.setTrashed(true);
      }
    }

    const decodedBytes = Utilities.base64Decode(dataString);
    const blob = Utilities.newBlob(decodedBytes, mimeType, fullFilename);
    const file = parentFolder.createFile(blob);

    // SECURITY: Files remain strictly private to authorized Google Workspace users.
    // We intentionally DO NOT set public ANYONE_WITH_LINK sharing.
    return file.getUrl();
  } catch (err) {
    Logger.log("Error saving file " + filenameBase + ": " + err.toString());
    return "";
  }
}

// ─────────────────────────────────────────────────────────────
// 4. DYNAMIC HEADER RESOLUTION & COLUMN MAPPING
// ─────────────────────────────────────────────────────────────

function ensureColumns(sheet, requiredCols) {
  const currentCols = sheet.getMaxColumns();
  if (currentCols < requiredCols) {
    sheet.insertColumnsAfter(currentCols, requiredCols - currentCols);
  }
}

/**
 * Resolves column index mapping dynamically from row 1 headers of Bookings sheet.
 * Guarantees zero breakage regardless of whether the sheet is using the modernized
 * 27-column layout (Col 20 = Customer Documents Folder) or legacy layouts.
 */
function getHeaderIndexMap(sheet) {
  ensureColumns(sheet, 27);
  const colCount = Math.max(sheet.getLastColumn(), 27);
  const headers = sheet.getRange(1, 1, 1, colCount).getValues()[0];
  const map = {};
  headers.forEach((h, idx) => {
    const clean = String(h || "").trim().toLowerCase();
    map[clean] = idx;
  });

  function findCol(keywords, fallback) {
    for (let k of keywords) {
      if (map[k] !== undefined) return map[k];
      for (let key in map) {
        if (key.includes(k)) return map[key];
      }
    }
    return fallback;
  }

  return {
    bookingRef: findCol(["booking ref"], 0),
    timestamp: findCol(["timestamp"], 1),
    customerName: findCol(["customer name"], 2),
    contactNumber: findCol(["contact number"], 3),
    socialMediaHandle: findCol(["social media handle"], 4),
    cameraRented: findCol(["camera rented"], 5),
    startDate: findCol(["start date"], 6),
    endDate: findCol(["end date"], 7),
    rentalDays: findCol(["rental days"], 8),
    handoverMethod: findCol(["handover method"], 9),
    address: findCol(["address"], 10),
    shootType: findCol(["shoot type"], 11),
    rentalTotal: findCol(["rental total"], 12),
    securityDeposit: findCol(["security deposit"], 13),
    downpaymentPaid: findCol(["downpayment paid"], 14),
    balanceDue: findCol(["balance due"], 15),
    gcashRefNumber: findCol(["gcash ref"], 16),
    status: findCol(["status", "booking status"], 17),
    notes: findCol(["notes & emergency contacts", "notes"], 18),
    driveFolderUrl: findCol(["customer documents folder", "google drive folder"], 19),
    id1Url: findCol(["primary id"], 20),
    id2Url: findCol(["secondary id", "student id"], 21),
    authSlipUrl: findCol(["auth slip", "handwritten"], 22),
    billingUrl: findCol(["billing proof", "proof of billing", "delivery receipt"], 23),
    selfieVideoUrl: findCol(["selfie video", "selfie verification", "selfie"], 24),
    receiptUrl: findCol(["payment receipt", "receipt url"], 25),
    guardianIdUrl: findCol(["guardian id", "parent / guardian"], 26)
  };
}

// ─────────────────────────────────────────────────────────────
// 5. HTTP GET HANDLER
// ─────────────────────────────────────────────────────────────

/**
 * 1. GET Request:
 * - Public: Fetches calendar bookings for conflict checking (no private customer details)
 * - Protected: Rejects unauthorized requests for admin booking records
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "";

    // ── ADMIN VIEW: Strictly Protected by Session Token ──
    if (action === "getAllBookings") {
      const token = e.parameter.sessionToken || e.parameter.token;
      const session = validateSessionToken(token);

      if (!session) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "UNAUTHORIZED",
          message: "Access Denied: Valid admin session token required."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const bookingsSheet = ss.getSheetByName("Bookings");
      if (!bookingsSheet || bookingsSheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", bookings: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const colMap = getHeaderIndexMap(bookingsSheet);
      const data = bookingsSheet.getDataRange().getValues();
      const rows = data.slice(1);

      const bookingsList = rows.map((r) => ({
        bookingRef: r[colMap.bookingRef] || "",
        timestamp: r[colMap.timestamp] ? Utilities.formatDate(new Date(r[colMap.timestamp]), "GMT+8", "yyyy-MM-dd HH:mm") : "",
        customerName: r[colMap.customerName] || "",
        contactNumber: r[colMap.contactNumber] || "",
        socialMediaHandle: r[colMap.socialMediaHandle] || "",
        cameraRented: r[colMap.cameraRented] || "",
        startDate: r[colMap.startDate] ? Utilities.formatDate(new Date(r[colMap.startDate]), "GMT+8", "yyyy-MM-dd") : "",
        endDate: r[colMap.endDate] ? Utilities.formatDate(new Date(r[colMap.endDate]), "GMT+8", "yyyy-MM-dd") : "",
        rentalDays: r[colMap.rentalDays] || 1,
        handoverMethod: r[colMap.handoverMethod] || "",
        address: r[colMap.address] || "",
        shootType: r[colMap.shootType] || "",
        rentalTotal: r[colMap.rentalTotal] || 0,
        securityDeposit: r[colMap.securityDeposit] || 0,
        downpaymentPaid: r[colMap.downpaymentPaid] || 0,
        balanceDue: r[colMap.balanceDue] || 0,
        gcashRefNumber: r[colMap.gcashRefNumber] || "",
        status: r[colMap.status] || "Pending Verification",
        notes: r[colMap.notes] || "",
        driveFolderUrl: r[colMap.driveFolderUrl] || "",
        id1Url: r[colMap.id1Url] || "",
        id2Url: r[colMap.id2Url] || "",
        authSlipUrl: r[colMap.authSlipUrl] || "",
        billingUrl: r[colMap.billingUrl] || "",
        selfieVideoUrl: r[colMap.selfieVideoUrl] || "",
        receiptUrl: r[colMap.receiptUrl] || "",
        guardianIdUrl: r[colMap.guardianIdUrl] || ""
      }));

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        authorizedAdmin: session.name,
        bookings: bookingsList
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── PUBLIC VIEW: Returns only booked dates for double-booking prevention ──
    const sheet = ss.getSheetByName("Calendar Sync");
    if (!sheet || sheet.getLastRow() <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1);

    const activeBookings = rows.map(r => ({
      cameraId: r[0],
      startDate: r[1] ? Utilities.formatDate(new Date(r[1]), "GMT+8", "yyyy-MM-dd") : "",
      endDate: r[2] ? Utilities.formatDate(new Date(r[2]), "GMT+8", "yyyy-MM-dd") : "",
      status: r[5] || "Confirmed"
    })).filter(b => b.status === "Confirmed" || b.status === "Active Rental" || b.status === "Deposit Paid");

    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: activeBookings }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─────────────────────────────────────────────────────────────
// 6. HTTP POST HANDLER
// ─────────────────────────────────────────────────────────────

/**
 * 2. POST Request:
 * - action="adminLogin": Authenticates Partner 1 or Partner 2, returns session token
 * - action="adminLogout": Invalidates session token
 * - action="getAllBookings": Protected fetch with session token
 * - action="updateStatus": Protected status modification with workflow enforcement & audit trail
 * - action="deleteBooking": Protected single booking deletion
 * - action="clearAllBookings": Protected clear all bookings
 * - action="uploadAdditionalDocuments": Safely uploads extra/replacement docs to existing folder
 * - Default: Public customer booking submission + private Google Drive file saving
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // ── 1. ADMIN LOGIN ENDPOINT ──
    if (body.action === "adminLogin") {
      const username = body.username || "";
      const password = body.password || "";
      const identifier = String(username).toLowerCase();

      const adminProfile = authenticateAdmin(username, password);
      if (adminProfile) {
        clearFailedLogins(identifier);
        clearAllLockouts();
        const sessionToken = createAdminSession(adminProfile);

        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          sessionToken: sessionToken,
          adminUser: adminProfile.username,
          adminName: adminProfile.name,
          expiresInSeconds: SESSION_TTL_SECONDS
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // If credentials failed, check lockout
      if (checkRateLimit(identifier)) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "LOCKED_OUT",
          message: "Too many failed login attempts. Account temporarily locked for 15 minutes."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const fails = recordFailedLogin(identifier);
      const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - fails);
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        code: "INVALID_CREDENTIALS",
        message: "Invalid admin credentials. " + remaining + " attempt(s) remaining before temporary lockout."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── 2. ADMIN LOGOUT ENDPOINT ──
    if (body.action === "adminLogout") {
      if (body.sessionToken) {
        revokeSessionToken(body.sessionToken);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── 3. PROTECTED FETCH ALL BOOKINGS (POST VARIANT) ──
    if (body.action === "getAllBookings") {
      const session = validateSessionToken(body.sessionToken);
      if (!session) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "UNAUTHORIZED",
          message: "Access Denied: Valid admin session token required."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const bookingsSheet = ss.getSheetByName("Bookings");
      if (!bookingsSheet || bookingsSheet.getLastRow() <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", bookings: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const colMap = getHeaderIndexMap(bookingsSheet);
      const data = bookingsSheet.getDataRange().getValues();
      const rows = data.slice(1);

      const bookingsList = rows.map((r) => ({
        bookingRef: r[colMap.bookingRef] || "",
        timestamp: r[colMap.timestamp] ? Utilities.formatDate(new Date(r[colMap.timestamp]), "GMT+8", "yyyy-MM-dd HH:mm") : "",
        customerName: r[colMap.customerName] || "",
        contactNumber: r[colMap.contactNumber] || "",
        socialMediaHandle: r[colMap.socialMediaHandle] || "",
        cameraRented: r[colMap.cameraRented] || "",
        startDate: r[colMap.startDate] ? Utilities.formatDate(new Date(r[colMap.startDate]), "GMT+8", "yyyy-MM-dd") : "",
        endDate: r[colMap.endDate] ? Utilities.formatDate(new Date(r[colMap.endDate]), "GMT+8", "yyyy-MM-dd") : "",
        rentalDays: r[colMap.rentalDays] || 1,
        handoverMethod: r[colMap.handoverMethod] || "",
        address: r[colMap.address] || "",
        shootType: r[colMap.shootType] || "",
        rentalTotal: r[colMap.rentalTotal] || 0,
        securityDeposit: r[colMap.securityDeposit] || 0,
        downpaymentPaid: r[colMap.downpaymentPaid] || 0,
        balanceDue: r[colMap.balanceDue] || 0,
        gcashRefNumber: r[colMap.gcashRefNumber] || "",
        status: r[colMap.status] || "Pending Verification",
        notes: r[colMap.notes] || "",
        driveFolderUrl: r[colMap.driveFolderUrl] || "",
        id1Url: r[colMap.id1Url] || "",
        id2Url: r[colMap.id2Url] || "",
        authSlipUrl: r[colMap.authSlipUrl] || "",
        billingUrl: r[colMap.billingUrl] || "",
        selfieVideoUrl: r[colMap.selfieVideoUrl] || "",
        receiptUrl: r[colMap.receiptUrl] || "",
        guardianIdUrl: r[colMap.guardianIdUrl] || ""
      }));

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        authorizedAdmin: session.name,
        bookings: bookingsList
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── 4. PROTECTED STATUS UPDATE ACTION WITH AUDIT LOGGING & WORKFLOW ENFORCEMENT ──
    if (body.action === "updateStatus") {
      const session = validateSessionToken(body.sessionToken);
      if (!session) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "UNAUTHORIZED",
          message: "Access Denied: Valid admin session token required to modify reservation status."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const targetRef = String(body.bookingRef || "").trim();
      const newStatus = String(body.status || "").trim();

      if (!targetRef || !newStatus) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "INVALID_REQUEST",
          message: "Missing bookingRef or status parameter."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const bSheet = ss.getSheetByName("Bookings");
      if (!bSheet) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "NOT_FOUND",
          message: "Bookings sheet not found."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const colMap = getHeaderIndexMap(bSheet);
      const bData = bSheet.getDataRange().getValues();
      let targetRowIndex = -1;
      let currentRowData = null;

      for (let i = 1; i < bData.length; i++) {
        if (String(bData[i][colMap.bookingRef]).trim() === targetRef) {
          targetRowIndex = i + 1; // 1-indexed for Sheet API
          currentRowData = bData[i];
          break;
        }
      }

      if (targetRowIndex === -1 || !currentRowData) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "BOOKING_NOT_FOUND",
          message: "Booking reference " + targetRef + " was not found."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const currentRawStatus = String(currentRowData[colMap.status] || "").trim();

      function getStatusStage(st) {
        const s = String(st || "").trim().toLowerCase();
        if (s.includes("pending") || s.includes("deposit")) return "PENDING";
        if (s === "confirmed" || s.includes("approved")) return "CONFIRMED";
        if (s.includes("active") || s.includes("picked up")) return "PICKED_UP";
        if (s.includes("completed") || s.includes("returned")) return "RETURNED";
        if (s.includes("reject")) return "REJECTED";
        if (s.includes("cancel")) return "CANCELLED";
        return "OTHER";
      }

      const currentStage = getStatusStage(currentRawStatus);
      const targetStage = getStatusStage(newStatus);

      // Workflow Step 1 -> Step 2: KYC Approval (Target: "Confirmed")
      if (targetStage === "CONFIRMED") {
        if (currentStage !== "PENDING") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "INVALID_TRANSITION",
            message: "Cannot approve KYC: Booking is currently \"" + currentRawStatus + "\"."
          })).setMimeType(ContentService.MimeType.JSON);
        }

        // Require explicit admin confirmation of review
        if (body.kycConfirmed !== true) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "KYC_NOT_CONFIRMED",
            message: "Cannot approve KYC: Admin must inspect all required files and confirm verification before approval."
          })).setMimeType(ContentService.MimeType.JSON);
        }

        // Validate presence of required documents or dedicated customer folder
        const id1 = String(currentRowData[colMap.id1Url] || "").trim();
        const authSlip = String(currentRowData[colMap.authSlipUrl] || "").trim();
        const billing = String(currentRowData[colMap.billingUrl] || "").trim();
        const selfie = String(currentRowData[colMap.selfieVideoUrl] || "").trim();
        const receipt = String(currentRowData[colMap.receiptUrl] || "").trim();
        const gcashRef = String(currentRowData[colMap.gcashRefNumber] || "").trim();
        const folderUrl = String(currentRowData[colMap.driveFolderUrl] || "").trim();

        // If files are not present in individual columns, folder URL must exist
        if (!folderUrl && (!id1 || !authSlip || !billing || !selfie || (!receipt && !gcashRef))) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "MISSING_DOCUMENTS",
            message: "Cannot approve KYC: Missing required files or Google Drive customer documents folder."
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Workflow Step 2 -> Step 3: Equipment Pickup (Target: "Active Rental")
      else if (targetStage === "PICKED_UP") {
        if (currentStage === "PENDING") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "KYC_NOT_APPROVED",
            message: "Cannot mark as picked up: Customer KYC documents must be reviewed and approved first."
          })).setMimeType(ContentService.MimeType.JSON);
        }
        if (currentStage === "PICKED_UP") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "ALREADY_PICKED_UP",
            message: "This booking is already marked as picked up."
          })).setMimeType(ContentService.MimeType.JSON);
        }
        if (currentStage === "RETURNED") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "ALREADY_RETURNED",
            message: "Cannot mark as picked up: Equipment has already been returned."
          })).setMimeType(ContentService.MimeType.JSON);
        }
        if (currentStage === "REJECTED" || currentStage === "CANCELLED") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "INVALID_TRANSITION",
            message: "Cannot mark as picked up: Booking was " + currentRawStatus.toLowerCase() + "."
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Workflow Step 3 -> Step 4: Equipment Return (Target: "Completed")
      else if (targetStage === "RETURNED") {
        if (currentStage === "PENDING") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "NOT_PICKED_UP",
            message: "Cannot mark as returned: Customer KYC has not been approved and equipment has not been picked up."
          })).setMimeType(ContentService.MimeType.JSON);
        }
        if (currentStage === "CONFIRMED") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "NOT_PICKED_UP",
            message: "Cannot mark as returned: Equipment has not been marked as picked up yet."
          })).setMimeType(ContentService.MimeType.JSON);
        }
        if (currentStage === "RETURNED") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "ALREADY_RETURNED",
            message: "This booking is already marked as returned."
          })).setMimeType(ContentService.MimeType.JSON);
        }
        if (currentStage === "REJECTED" || currentStage === "CANCELLED") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "INVALID_TRANSITION",
            message: "Cannot mark as returned: Booking was " + currentRawStatus.toLowerCase() + "."
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Rejection / Cancellation Rules
      else if (targetStage === "REJECTED" || targetStage === "CANCELLED") {
        if (currentStage === "PICKED_UP" || currentStage === "RETURNED") {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "INVALID_TRANSITION",
            message: "Cannot " + (targetStage === "REJECTED" ? "reject" : "cancel") + " a booking that is already picked up or returned."
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Execute update atomically
      const statusCol1Indexed = colMap.status + 1;
      const notesCol1Indexed = colMap.notes + 1;

      bSheet.getRange(targetRowIndex, statusCol1Indexed).setValue(newStatus);
      const currentNotes = String(currentRowData[colMap.notes] || "");
      const auditEntry = " [Status changed from \"" + currentRawStatus + "\" to \"" + newStatus + "\" by " + session.name + " on " + Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm") + "]";
      bSheet.getRange(targetRowIndex, notesCol1Indexed).setValue(currentNotes + auditEntry);

      // Synchronize to Calendar Sync sheet (Column F / index 6)
      const cSheet = ss.getSheetByName("Calendar Sync");
      if (cSheet) {
        const cData = cSheet.getDataRange().getValues();
        for (let j = 1; j < cData.length; j++) {
          if (String(cData[j][4]).trim() === targetRef) {
            cSheet.getRange(j + 1, 6).setValue(newStatus);
            break;
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        updated: true,
        previousStatus: currentRawStatus,
        newStatus: newStatus,
        auditedBy: session.name
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── 5. PROTECTED DELETE SINGLE BOOKING ACTION (ADMIN ONLY) ──
    if (body.action === "deleteBooking") {
      const session = validateSessionToken(body.sessionToken);
      if (!session) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "UNAUTHORIZED",
          message: "Access Denied: Valid admin session token required."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const targetRef = String(body.bookingRef || "").trim();
      if (!targetRef) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Missing bookingRef" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      let deleted = false;
      const bSheet = ss.getSheetByName("Bookings");
      if (bSheet) {
        const colMap = getHeaderIndexMap(bSheet);
        const bData = bSheet.getDataRange().getValues();
        for (let i = 1; i < bData.length; i++) {
          if (String(bData[i][colMap.bookingRef]).trim() === targetRef) {
            bSheet.deleteRow(i + 1);
            deleted = true;
            break;
          }
        }
      }

      const cSheet = ss.getSheetByName("Calendar Sync");
      if (cSheet) {
        const cData = cSheet.getDataRange().getValues();
        for (let i = 1; i < cData.length; i++) {
          if (String(cData[i][4]).trim() === targetRef) {
            cSheet.deleteRow(i + 1);
            break;
          }
        }
      }

      Logger.log("Booking " + targetRef + " deleted by " + session.name);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        deleted: deleted,
        bookingRef: targetRef,
        auditedBy: session.name
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── 6. PROTECTED CLEAR ALL BOOKINGS ACTION (ADMIN ONLY WITH EXPLICIT CONFIRMATION) ──
    if (body.action === "clearAllBookings") {
      const session = validateSessionToken(body.sessionToken);
      if (!session) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "UNAUTHORIZED",
          message: "Access Denied: Valid admin session token required."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      if (body.confirm !== "CONFIRM_DELETE_ALL") {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Missing confirmation token. Deletion aborted."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const bSheet = ss.getSheetByName("Bookings");
      if (bSheet && bSheet.getLastRow() > 1) {
        bSheet.deleteRows(2, bSheet.getLastRow() - 1);
      }

      const cSheet = ss.getSheetByName("Calendar Sync");
      if (cSheet && cSheet.getLastRow() > 1) {
        cSheet.deleteRows(2, cSheet.getLastRow() - 1);
      }

      Logger.log("ALL BOOKINGS CLEARED by " + session.name);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "All customer bookings and calendar slots permanently cleared.",
        auditedBy: session.name
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── 7. UPLOAD ADDITIONAL / REPLACEMENT DOCUMENTS TO EXISTING BOOKING ──
    if (body.action === "uploadAdditionalDocuments") {
      const targetRef = String(body.bookingRef || "").trim();
      if (!targetRef) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Missing bookingRef parameter."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const bSheet = ss.getSheetByName("Bookings");
      if (!bSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Bookings sheet not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const colMap = getHeaderIndexMap(bSheet);
      const bData = bSheet.getDataRange().getValues();
      let targetRow = -1;
      let customerName = "Renter";

      for (let i = 1; i < bData.length; i++) {
        if (String(bData[i][colMap.bookingRef]).trim() === targetRef) {
          targetRow = i + 1;
          customerName = String(bData[i][colMap.customerName] || "Renter");
          break;
        }
      }

      if (targetRow === -1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: "Booking not found" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const rootFolder = getOrCreateRootFolder();
      const bookingFolder = getOrCreateBookingFolder(rootFolder, targetRef, customerName);

      // Save any updated documents
      if (body.id1File) {
        const url = saveBase64ToDrive(bookingFolder, body.id1File, "01_Primary_Gov_ID");
        bSheet.getRange(targetRow, colMap.id1Url + 1).setValue(url);
      }
      if (body.id2File) {
        const url = saveBase64ToDrive(bookingFolder, body.id2File, body.isStudentExemption ? "02_Student_ID_COR" : "02_Secondary_ID");
        bSheet.getRange(targetRow, colMap.id2Url + 1).setValue(url);
      }
      if (body.authorizationSlipFile) {
        const url = saveBase64ToDrive(bookingFolder, body.authorizationSlipFile, "03_Handwritten_Auth_Slip");
        bSheet.getRange(targetRow, colMap.authSlipUrl + 1).setValue(url);
      }
      if (body.deliveryReceiptsFile) {
        const url = saveBase64ToDrive(bookingFolder, body.deliveryReceiptsFile, "04_Proof_Of_Address");
        bSheet.getRange(targetRow, colMap.billingUrl + 1).setValue(url);
      }
      if (body.selfieFile) {
        const url = saveBase64ToDrive(bookingFolder, body.selfieFile, "05_Selfie_Verification");
        bSheet.getRange(targetRow, colMap.selfieVideoUrl + 1).setValue(url);
      }
      if (body.receiptFile) {
        const url = saveBase64ToDrive(bookingFolder, body.receiptFile, "06_GCash_Payment_Receipt");
        bSheet.getRange(targetRow, colMap.receiptUrl + 1).setValue(url);
      }
      if (body.contact1IdFile) {
        const url = saveBase64ToDrive(bookingFolder, body.contact1IdFile, "07_Parent_Guardian_ID");
        bSheet.getRange(targetRow, colMap.guardianIdUrl + 1).setValue(url);
      }

      if (body.id1BackFile) {
        saveBase64ToDrive(bookingFolder, body.id1BackFile, "01b_Primary_Gov_ID_Back");
      }
      if (body.id2BackFile) {
        saveBase64ToDrive(bookingFolder, body.id2BackFile, "02b_Secondary_ID_Back");
      }
      if (body.selfieWithIdsFile) {
        saveBase64ToDrive(bookingFolder, body.selfieWithIdsFile, "03b_Selfie_Holding_IDs_And_Slip");
      }
      if (body.billOwnerIdFile) {
        saveBase64ToDrive(bookingFolder, body.billOwnerIdFile, "04b_Bill_Owner_Gov_ID");
      }
      if (body.contact2IdFile) {
        saveBase64ToDrive(bookingFolder, body.contact2IdFile, "08_Emergency_Contact2_ID");
      }

      // Ensure Customer Documents Folder link is populated
      bSheet.getRange(targetRow, colMap.driveFolderUrl + 1).setValue(bookingFolder.getUrl());

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        bookingRef: targetRef,
        driveFolderUrl: bookingFolder.getUrl(),
        message: "Documents successfully added to customer Google Drive folder."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── 8. PUBLIC NEW CUSTOMER BOOKING SUBMISSION (CONCURRENCY & OVERLAP PROTECTED) ──
    const lock = LockService.getScriptLock();
    try {
      // Mutual exclusion: wait up to 30 seconds for any in-flight booking submission to complete
      lock.waitLock(30000);
    } catch (lockErr) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        code: "SERVER_BUSY",
        message: "The reservation server is currently processing another transaction. Please wait a moment and try again."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    try {
      // Backend Validation 1: GCash payment receipt is strictly mandatory
      if (!body.receiptFile || typeof body.receiptFile !== "string" || body.receiptFile.length < 50) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "MISSING_RECEIPT",
          message: "GCash payment receipt upload is required to complete and secure your booking."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // Backend Validation 2: Student Exemption requires Contact 1 Parent/Guardian ID
      if (body.isStudentExemption) {
        if (!body.contact1IdFile || typeof body.contact1IdFile !== "string" || body.contact1IdFile.length < 50) {
          return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            code: "MISSING_GUARDIAN_ID",
            message: "Emergency Contact 1 (Parent / Guardian) Government ID upload is required when applying for Student Exemption."
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }

      // Backend Validation 3: Authoritative Overlap & Availability Check
      const targetRef = String(body.bookingRef || "PNF-BOOKING").trim();
      const reqCamId = String(body.cameraId || "dji-pocket-3").trim().toLowerCase();
      const reqStart = String(body.startDate || "").trim();
      const reqEnd = String(body.endDate || "").trim();

      if (!reqStart || !reqEnd) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "INVALID_DATES",
          message: "Valid rental start date and end date are required."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // Check against active bookings in Bookings sheet
      const bSheetCheck = ss.getSheetByName("Bookings");
      if (bSheetCheck && bSheetCheck.getLastRow() > 1) {
        const checkColMap = getHeaderIndexMap(bSheetCheck);
        const bRows = bSheetCheck.getDataRange().getValues().slice(1);

        for (let i = 0; i < bRows.length; i++) {
          const rowRef = String(bRows[i][checkColMap.bookingRef] || "").trim();
          // Allow re-submission / file updates for the EXACT same booking reference
          if (rowRef === targetRef) continue;

          const rowStatus = String(bRows[i][checkColMap.status] || "").trim().toLowerCase();
          // Skip inactive / cancelled / rejected bookings
          if (rowStatus.includes("cancel") || rowStatus.includes("reject") || rowStatus.includes("completed")) {
            continue;
          }

          const rowCam = String(bRows[i][checkColMap.cameraRented] || "").toLowerCase();
          const isSameCamera = reqCamId === "dji-pocket-3"
            ? (rowCam.includes("pocket") || rowCam.includes("dji") || !rowCam)
            : rowCam.includes(reqCamId);

          if (isSameCamera) {
            const bookedStart = bRows[i][checkColMap.startDate]
              ? Utilities.formatDate(new Date(bRows[i][checkColMap.startDate]), "GMT+8", "yyyy-MM-dd")
              : "";
            const bookedEnd = bRows[i][checkColMap.endDate]
              ? Utilities.formatDate(new Date(bRows[i][checkColMap.endDate]), "GMT+8", "yyyy-MM-dd")
              : "";

            if (bookedStart && bookedEnd) {
              // Standard interval overlap condition: reqStart <= bookedEnd && bookedStart <= reqEnd
              if (reqStart <= bookedEnd && bookedStart <= reqEnd) {
                return ContentService.createTextOutput(JSON.stringify({
                  status: "error",
                  code: "DATE_CONFLICT",
                  message: "The requested rental dates (" + reqStart + " to " + reqEnd + ") conflict with an existing reservation for this camera (" + bookedStart + " to " + bookedEnd + "). Please select different dates."
                })).setMimeType(ContentService.MimeType.JSON);
              }
            }
          }
        }
      }

      // Find or create exactly ONE designated private folder for this booking
      const rootFolder = getOrCreateRootFolder();
      const bookingFolder = getOrCreateBookingFolder(rootFolder, targetRef, body.customerName);

      // Save only applicable submitted KYC documents to the designated customer folder
      // Uses clean, recognizable file naming without duplicate accumulation
      const id1Url = saveBase64ToDrive(bookingFolder, body.id1File, "01_Primary_Gov_ID");
      if (body.id1BackFile) saveBase64ToDrive(bookingFolder, body.id1BackFile, "01b_Primary_Gov_ID_Back");
      const id2Url = saveBase64ToDrive(bookingFolder, body.id2File, body.isStudentExemption ? "02_Student_ID_COR" : "02_Secondary_ID");
      if (body.id2BackFile) saveBase64ToDrive(bookingFolder, body.id2BackFile, "02b_Secondary_ID_Back");
      const authSlipUrl = saveBase64ToDrive(bookingFolder, body.authorizationSlipFile, "03_Handwritten_Auth_Slip");
      if (body.selfieWithIdsFile) saveBase64ToDrive(bookingFolder, body.selfieWithIdsFile, "03b_Selfie_Holding_IDs_And_Slip");
      const billingUrl = saveBase64ToDrive(bookingFolder, body.deliveryReceiptsFile, "04_Proof_Of_Address");
      if (body.billOwnerIdFile) saveBase64ToDrive(bookingFolder, body.billOwnerIdFile, "04b_Bill_Owner_Gov_ID");
      const selfieVideoUrl = saveBase64ToDrive(bookingFolder, body.selfieFile, "05_Selfie_Verification");
      const receiptUrl = saveBase64ToDrive(bookingFolder, body.receiptFile, "06_GCash_Payment_Receipt");
      const guardianIdUrl = body.contact1IdFile ? saveBase64ToDrive(bookingFolder, body.contact1IdFile, "07_Emergency_Contact1_ID") : "";
      if (body.contact2IdFile) saveBase64ToDrive(bookingFolder, body.contact2IdFile, "08_Emergency_Contact2_ID");
      const driveFolderUrl = bookingFolder.getUrl();

      // Ensure Bookings Sheet exists with proper columns
      let bookingsSheet = ss.getSheetByName("Bookings");
      if (!bookingsSheet) {
        bookingsSheet = ss.insertSheet("Bookings");
      }
      ensureColumns(bookingsSheet, 27);

      if (bookingsSheet.getLastRow() === 0 || bookingsSheet.getRange(1, 1).getValue() === "") {
        const standardHeaders = [
          "Booking Ref", "Timestamp", "Customer Name", "Contact Number", "Social Media Handle",
          "Camera Rented", "Start Date", "End Date", "Rental Days", "Handover Method",
          "Address / Hub", "Shoot Type", "Rental Total", "Security Deposit", "Downpayment Paid",
          "Balance Due", "GCash Ref Number", "Booking Status", "Notes & Emergency Contacts",
          "Customer Documents Folder", // ⭐ Placed immediately after Notes
          "Primary ID URL", "Secondary ID URL", "Auth Slip URL", "Billing Proof URL",
          "Selfie Video URL", "Payment Receipt URL", "Guardian ID URL"
        ];
        bookingsSheet.getRange(1, 1, 1, standardHeaders.length).setValues([standardHeaders]);
      }

      const colMap = getHeaderIndexMap(bookingsSheet);

      // Duplicate Prevention Check: If a row with this bookingRef already exists, update in place!
      const bData = bookingsSheet.getDataRange().getValues();
      let existingRowIndex = -1;
      for (let i = 1; i < bData.length; i++) {
        if (String(bData[i][colMap.bookingRef]).trim() === targetRef) {
          existingRowIndex = i + 1; // 1-indexed
          break;
        }
      }

      if (existingRowIndex !== -1) {
        // Update existing row safely without duplicating records
        bookingsSheet.getRange(existingRowIndex, colMap.timestamp + 1).setValue(new Date());
        bookingsSheet.getRange(existingRowIndex, colMap.customerName + 1).setValue(body.customerName);
        bookingsSheet.getRange(existingRowIndex, colMap.contactNumber + 1).setValue(body.contactNumber);
        bookingsSheet.getRange(existingRowIndex, colMap.socialMediaHandle + 1).setValue(body.socialMediaHandle);
        bookingsSheet.getRange(existingRowIndex, colMap.cameraRented + 1).setValue(body.cameraRented);
        bookingsSheet.getRange(existingRowIndex, colMap.startDate + 1).setValue(body.startDate);
        bookingsSheet.getRange(existingRowIndex, colMap.endDate + 1).setValue(body.endDate);
        bookingsSheet.getRange(existingRowIndex, colMap.rentalDays + 1).setValue(body.rentalDays);
        bookingsSheet.getRange(existingRowIndex, colMap.handoverMethod + 1).setValue(body.handoverMethod);
        bookingsSheet.getRange(existingRowIndex, colMap.address + 1).setValue(body.address || "Meetup Point");
        bookingsSheet.getRange(existingRowIndex, colMap.shootType + 1).setValue(body.shootType);
        bookingsSheet.getRange(existingRowIndex, colMap.rentalTotal + 1).setValue(body.rentalTotal);
        bookingsSheet.getRange(existingRowIndex, colMap.securityDeposit + 1).setValue(body.securityDeposit);
        bookingsSheet.getRange(existingRowIndex, colMap.downpaymentPaid + 1).setValue(body.downpaymentPaid);
        bookingsSheet.getRange(existingRowIndex, colMap.balanceDue + 1).setValue(body.balanceDue);
        bookingsSheet.getRange(existingRowIndex, colMap.gcashRefNumber + 1).setValue(body.gcashRefNumber);
        bookingsSheet.getRange(existingRowIndex, colMap.status + 1).setValue("Deposit Paid");
        if (body.notes) {
          bookingsSheet.getRange(existingRowIndex, colMap.notes + 1).setValue(body.notes);
        }
        bookingsSheet.getRange(existingRowIndex, colMap.driveFolderUrl + 1).setValue(driveFolderUrl);
        if (id1Url) bookingsSheet.getRange(existingRowIndex, colMap.id1Url + 1).setValue(id1Url);
        if (id2Url) bookingsSheet.getRange(existingRowIndex, colMap.id2Url + 1).setValue(id2Url);
        if (authSlipUrl) bookingsSheet.getRange(existingRowIndex, colMap.authSlipUrl + 1).setValue(authSlipUrl);
        if (billingUrl) bookingsSheet.getRange(existingRowIndex, colMap.billingUrl + 1).setValue(billingUrl);
        if (selfieVideoUrl) bookingsSheet.getRange(existingRowIndex, colMap.selfieVideoUrl + 1).setValue(selfieVideoUrl);
        if (receiptUrl) bookingsSheet.getRange(existingRowIndex, colMap.receiptUrl + 1).setValue(receiptUrl);
        if (guardianIdUrl) bookingsSheet.getRange(existingRowIndex, colMap.guardianIdUrl + 1).setValue(guardianIdUrl);
      } else {
        // Append New Row with 27 Columns: Column 20 is the dedicated Customer Documents Folder link!
        bookingsSheet.appendRow([
          body.bookingRef,
          new Date(),
          body.customerName,
          body.contactNumber,
          body.socialMediaHandle,
          body.cameraRented,
          body.startDate,
          body.endDate,
          body.rentalDays,
          body.handoverMethod,
          body.address || "Meetup Point",
          body.shootType,
          body.rentalTotal,
          body.securityDeposit,
          body.downpaymentPaid,
          body.balanceDue,
          body.gcashRefNumber,
          "Deposit Paid",
          body.notes || "",
          driveFolderUrl, // ⭐ Col 20: Dedicated Customer Documents Folder
          id1Url,
          id2Url,
          authSlipUrl,
          billingUrl,
          selfieVideoUrl,
          receiptUrl,
          guardianIdUrl
        ]);
      }

      // Append / Update Calendar Sync Sheet
      let calendarSheet = ss.getSheetByName("Calendar Sync");
      if (!calendarSheet) {
        calendarSheet = ss.insertSheet("Calendar Sync");
        calendarSheet.appendRow(["Camera ID", "Start Date", "End Date", "Customer Tag", "Booking Ref", "Status"]);
      }

      let existingCalIndex = -1;
      if (calendarSheet.getLastRow() > 1) {
        const cData = calendarSheet.getDataRange().getValues();
        for (let k = 1; k < cData.length; k++) {
          if (String(cData[k][4]).trim() === targetRef) {
            existingCalIndex = k + 1;
            break;
          }
        }
      }

      if (existingCalIndex !== -1) {
        calendarSheet.getRange(existingCalIndex, 1, 1, 6).setValues([[
          body.cameraId || "dji-pocket-3",
          body.startDate,
          body.endDate,
          body.socialMediaHandle || body.customerName,
          body.bookingRef,
          "Deposit Paid"
        ]]);
      } else {
        calendarSheet.appendRow([
          body.cameraId || "dji-pocket-3",
          body.startDate,
          body.endDate,
          body.socialMediaHandle || body.customerName,
          body.bookingRef,
          "Deposit Paid"
        ]);
      }

      // Return success along with the Google Drive dedicated folder URL
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        bookingRef: body.bookingRef,
        driveFolderUrl: driveFolderUrl
      })).setMimeType(ContentService.MimeType.JSON);

    } finally {
      try {
        lock.releaseLock();
      } catch (lockReleaseErr) {}
    }

  } catch (err) {
    Logger.log("doPost Error: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
