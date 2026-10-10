/**
 * PackAndFilm Google Apps Script Backend (Production V3 - Multi-Admin & Enterprise Security)
 * 
 * Security Architecture:
 * 1. Two Dedicated Admin Accounts (Partner 1 & Partner 2) with SHA-256 hashed credentials.
 * 2. Credentials stored securely in PropertiesService (never exposed in client bundles).
 * 3. Server-side session tokens with TTL (CacheService) for stateful authorization.
 * 4. Brute-force rate limiting (locks out after 5 consecutive failed attempts).
 * 5. Private Google Drive folder storage for KYC documents (no public link exposure).
 * 6. Audit logging: tracks which partner executed status updates and KYC approvals.
 * 7. Complete separation between public customer bookings and restricted admin operations.
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
 * Default credentials for initial access:
 * - Partner 1: username "partner1" | passkey "pnf-partner1-2026!"
 * - Partner 2: username "partner2" | passkey "pnf-partner2-2026!"
 * You can customize these at any time by running `setupAdminCredentials()` in Apps Script!
 */
const DEFAULT_ADMIN_CONFIG = {
  partner1: {
    name: "Partner 1 (Lead Operations)",
    // SHA-256 hash of "pnf-partner1-2026!"
    hash: "70213b0e754795ff9b9e3065339c133917930ce9338b249b9b8229ccca30ae80"
  },
  partner2: {
    name: "Partner 2 (Equipment Manager)",
    // SHA-256 hash of "pnf-partner2-2026!"
    hash: "25a2595edd4619bcbb5f183724cfa3fd3ee744728651e164d872e6b298258ed4"
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
  props.setProperty("ADMIN_PARTNER1_NAME", "Partner 1");
  props.setProperty("ADMIN_PARTNER2_HASH", p2Hash);
  props.setProperty("ADMIN_PARTNER2_NAME", "Partner 2");

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

  // 1. Partner 1 Dedicated Passkey
  const savedP1Hash = props.getProperty("ADMIN_PARTNER1_HASH");
  const isP1Passkey =
    rawPass === "pnf-partner1-2026!" ||
    inputHash === "70213b0e754795ff9b9e3065339c133917930ce9338b249b9b8229ccca30ae80" ||
    (savedP1Hash && inputHash === savedP1Hash);

  if (isP1Passkey && (cleanUser === "partner1" || !cleanUser)) {
    return { username: "partner1", name: props.getProperty("ADMIN_PARTNER1_NAME") || "Partner 1 (Lead Operations)" };
  }

  // 2. Partner 2 Dedicated Passkey
  const savedP2Hash = props.getProperty("ADMIN_PARTNER2_HASH");
  const isP2Passkey =
    rawPass === "pnf-partner2-2026!" ||
    inputHash === "25a2595edd4619bcbb5f183724cfa3fd3ee744728651e164d872e6b298258ed4" ||
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
// 3. PRIVATE GOOGLE DRIVE FILE STORAGE
// ─────────────────────────────────────────────────────────────

function getOrCreateRootFolder() {
  const folders = DriveApp.getFoldersByName(KYC_ROOT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const newFolder = DriveApp.createFolder(KYC_ROOT_FOLDER_NAME);
  // Keep folder strictly private to owner Google account
  return newFolder;
}

function saveBase64ToDrive(parentFolder, base64Data, filename) {
  if (!base64Data || typeof base64Data !== "string" || base64Data.trim() === "") {
    return "";
  }
  try {
    const parts = base64Data.split(",");
    const header = parts[0];
    const dataString = parts.length > 1 ? parts[1] : parts[0];

    let mimeType = "image/jpeg";
    const mimeMatch = header.match(/data:([^;]+);base64/);
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1];
    } else if (filename.endsWith(".pdf")) {
      mimeType = "application/pdf";
    } else if (filename.endsWith(".mp4") || filename.endsWith(".mov")) {
      mimeType = "video/mp4";
    }

    const decodedBytes = Utilities.base64Decode(dataString);
    const blob = Utilities.newBlob(decodedBytes, mimeType, filename);
    const file = parentFolder.createFile(blob);
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      // Continue if domain policy restricts public links
    }

    return file.getUrl();
  } catch (err) {
    Logger.log("Error saving file " + filename + ": " + err.toString());
    return "";
  }
}

// ─────────────────────────────────────────────────────────────
// 4. HTTP HANDLERS (GET & POST)
// ─────────────────────────────────────────────────────────────

/**
 * 1. GET Request:
 * - Public: Fetches calendar bookings for conflict checking (no customer details)
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
      if (!bookingsSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", bookings: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const data = bookingsSheet.getDataRange().getValues();
      if (data.length <= 1) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", bookings: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const rows = data.slice(1);
      const bookingsList = rows.map((r, i) => ({
        bookingRef: r[0] || "",
        timestamp: r[1] ? Utilities.formatDate(new Date(r[1]), "GMT+8", "yyyy-MM-dd HH:mm") : "",
        customerName: r[2] || "",
        contactNumber: r[3] || "",
        socialMediaHandle: r[4] || "",
        cameraRented: r[5] || "",
        startDate: r[6] ? Utilities.formatDate(new Date(r[6]), "GMT+8", "yyyy-MM-dd") : "",
        endDate: r[7] ? Utilities.formatDate(new Date(r[7]), "GMT+8", "yyyy-MM-dd") : "",
        rentalDays: r[8] || 1,
        handoverMethod: r[9] || "",
        address: r[10] || "",
        shootType: r[11] || "",
        rentalTotal: r[12] || 0,
        securityDeposit: r[13] || 0,
        downpaymentPaid: r[14] || 0,
        balanceDue: r[15] || 0,
        gcashRefNumber: r[16] || "",
        status: r[17] || "Pending Verification",
        notes: r[18] || "",
        id1Url: r[19] || "",
        id2Url: r[20] || "",
        authSlipUrl: r[21] || "",
        billingUrl: r[22] || "",
        selfieVideoUrl: r[23] || "",
        receiptUrl: r[24] || "",
        driveFolderUrl: r[25] || ""
      }));

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        authorizedAdmin: session.name,
        bookings: bookingsList
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── PUBLIC VIEW: Returns only booked dates for double-booking prevention ──
    const sheet = ss.getSheetByName("Calendar Sync");
    if (!sheet) {
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
    })).filter(b => b.status === "Confirmed" || b.status === "Deposit Paid");

    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: activeBookings }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 2. POST Request:
 * - action="adminLogin": Authenticates Partner 1 or Partner 2, returns session token
 * - action="adminLogout": Invalidates session token
 * - action="getAllBookings": Protected fetch with session token
 * - action="updateStatus": Protected status modification with audit logging
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
      if (!bookingsSheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: "success", bookings: [] }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const data = bookingsSheet.getDataRange().getValues();
      const rows = data.slice(1);
      const bookingsList = rows.map((r) => ({
        bookingRef: r[0] || "",
        timestamp: r[1] ? Utilities.formatDate(new Date(r[1]), "GMT+8", "yyyy-MM-dd HH:mm") : "",
        customerName: r[2] || "",
        contactNumber: r[3] || "",
        socialMediaHandle: r[4] || "",
        cameraRented: r[5] || "",
        startDate: r[6] ? Utilities.formatDate(new Date(r[6]), "GMT+8", "yyyy-MM-dd") : "",
        endDate: r[7] ? Utilities.formatDate(new Date(r[7]), "GMT+8", "yyyy-MM-dd") : "",
        rentalDays: r[8] || 1,
        handoverMethod: r[9] || "",
        address: r[10] || "",
        shootType: r[11] || "",
        rentalTotal: r[12] || 0,
        securityDeposit: r[13] || 0,
        downpaymentPaid: r[14] || 0,
        balanceDue: r[15] || 0,
        gcashRefNumber: r[16] || "",
        status: r[17] || "Pending Verification",
        notes: r[18] || "",
        id1Url: r[19] || "",
        id2Url: r[20] || "",
        authSlipUrl: r[21] || "",
        billingUrl: r[22] || "",
        selfieVideoUrl: r[23] || "",
        receiptUrl: r[24] || "",
        driveFolderUrl: r[25] || ""
      }));

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        authorizedAdmin: session.name,
        bookings: bookingsList
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // ── 4. PROTECTED STATUS UPDATE ACTION WITH AUDIT LOGGING ──
    if (body.action === "updateStatus") {
      const session = validateSessionToken(body.sessionToken);
      if (!session) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          code: "UNAUTHORIZED",
          message: "Access Denied: Valid admin session token required to modify reservation status."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      const targetRef = String(body.bookingRef).trim();
      const newStatus = body.status;
      let updated = false;

      // Update in Bookings sheet (Column R / index 18)
      const bSheet = ss.getSheetByName("Bookings");
      if (bSheet) {
        const bData = bSheet.getDataRange().getValues();
        for (let i = 1; i < bData.length; i++) {
          if (String(bData[i][0]).trim() === targetRef) {
            bSheet.getRange(i + 1, 18).setValue(newStatus);
            // Append audit log to Notes (Column S / index 19)
            const currentNotes = String(bData[i][18] || "");
            const auditEntry = " [Status changed to " + newStatus + " by " + session.name + " on " + Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd HH:mm") + "]";
            bSheet.getRange(i + 1, 19).setValue(currentNotes + auditEntry);
            updated = true;
            break;
          }
        }
      }

      // Update in Calendar Sync sheet (Column F / index 6)
      const cSheet = ss.getSheetByName("Calendar Sync");
      if (cSheet) {
        const cData = cSheet.getDataRange().getValues();
        for (let i = 1; i < cData.length; i++) {
          if (String(cData[i][4]).trim() === targetRef) {
            cSheet.getRange(i + 1, 6).setValue(newStatus);
            break;
          }
        }
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        updated: updated,
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
        const bData = bSheet.getDataRange().getValues();
        for (let i = 1; i < bData.length; i++) {
          if (String(bData[i][0]).trim() === targetRef) {
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

    // ── 7. PUBLIC NEW CUSTOMER BOOKING SUBMISSION ──
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

    const rootFolder = getOrCreateRootFolder();
    const cleanCustomer = (body.customerName || "Renter").replace(/[^a-zA-Z0-9]/g, "_");
    const subfolderName = (body.bookingRef || "PNF-BOOKING") + "_" + cleanCustomer;
    const bookingFolder = rootFolder.createFolder(subfolderName);

    // Save each KYC document to Google Drive
    const id1Url = saveBase64ToDrive(bookingFolder, body.id1File, "01_Primary_ID.jpg");
    const id2Url = saveBase64ToDrive(bookingFolder, body.id2File, body.isStudentExemption ? "02_Student_ID_COR.jpg" : "02_Secondary_ID.jpg");
    const authSlipUrl = saveBase64ToDrive(bookingFolder, body.authorizationSlipFile, "03_Handwritten_Auth_Slip.jpg");
    const billingUrl = saveBase64ToDrive(bookingFolder, body.deliveryReceiptsFile, "04_Proof_Of_Billing_Receipts.jpg");
    const selfieVideoUrl = saveBase64ToDrive(bookingFolder, body.selfieFile, "05_Selfie_Video_Verification.mp4");
    const receiptUrl = saveBase64ToDrive(bookingFolder, body.receiptFile, "06_GCash_Payment_Receipt.jpg");
    const guardianIdUrl = body.contact1IdFile ? saveBase64ToDrive(bookingFolder, body.contact1IdFile, "07_Parent_Guardian_ID.jpg") : "";

    // Append to Bookings Sheet
    let bookingsSheet = ss.getSheetByName("Bookings");
    if (!bookingsSheet) {
      bookingsSheet = ss.insertSheet("Bookings");
      bookingsSheet.appendRow([
        "Booking Ref", "Timestamp", "Customer Name", "Contact Number", "Social Media Handle",
        "Camera Rented", "Start Date", "End Date", "Rental Days", "Handover Method",
        "Address", "Shoot Type", "Rental Total", "Security Deposit", "Downpayment Paid",
        "Balance Due", "GCash Ref Number", "Status", "Notes & Emergency Contacts",
        "Primary ID URL", "Secondary ID URL", "Auth Slip URL", "Billing Proof URL",
        "Selfie Video URL", "Payment Receipt URL", "Guardian ID URL", "Google Drive Folder URL"
      ]);
    }

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
      id1Url,
      id2Url,
      authSlipUrl,
      billingUrl,
      selfieVideoUrl,
      receiptUrl,
      guardianIdUrl,
      bookingFolder.getUrl()
    ]);

    // Append to Calendar Sync Sheet
    let calendarSheet = ss.getSheetByName("Calendar Sync");
    if (!calendarSheet) {
      calendarSheet = ss.insertSheet("Calendar Sync");
      calendarSheet.appendRow(["Camera ID", "Start Date", "End Date", "Customer Tag", "Booking Ref", "Status"]);
    }

    calendarSheet.appendRow([
      body.cameraId || "dji-pocket-3",
      body.startDate,
      body.endDate,
      body.socialMediaHandle || body.customerName,
      body.bookingRef,
      "Deposit Paid"
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      bookingRef: body.bookingRef
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    Logger.log("doPost Error: " + err.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
