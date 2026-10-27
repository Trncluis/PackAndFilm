/**
 * PackAndFilm Google Apps Script — Dashboard & Sheet Beautifier (V3.2 Production)
 * 
 * Features:
 * 1. "📊 Dashboard & Stats" Executive Overview with live KPI metric cards & breakdown charts.
 * 2. "Bookings" Tab with dedicated "Customer Documents Folder" placed immediately after Notes.
 * 3. Modernized Status Dropdown: ["Deposit Paid", "Pending Verification", "Confirmed", "Active Rental", "Completed", "Rejected", "Cancelled"].
 * 4. "Calendar Sync" & "Fleet Inventory" sheets formatted with PackAndFilm design system.
 * 5. Safe non-destructive migration helper: `migrateAndAlignBookingsSheet()` to adapt existing sheets.
 * 6. Dynamic Bounds Guard: Automatically expands sheet columns and rows to prevent "Those columns are out of bounds" errors.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESIGN TOKENS (PackAndFilm Brand System)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const LAVENDER = "#C9B8F0";
const LAVENDER_TINT = "#F5F2FC";
const PEACH = "#F5C6A8";
const PEACH_TINT = "#FEF6F0";
const INK = "#1A1A2E";
const MUTED = "#6B6B8A";
const BORDER_COLOR = "#E6E2F0";
const PURPLE_ACCENT = "#553C9A";
const SUCCESS_TINT = "#E8F7F1";

// Standard 27-Column Header Definition for Bookings Sheet
const BOOKING_COLUMNS = [
  "Booking Ref",                // Col 1  (A)
  "Timestamp",                  // Col 2  (B)
  "Customer Name",              // Col 3  (C)
  "Contact Number",             // Col 4  (D)
  "Social Media Handle",        // Col 5  (E)
  "Camera Rented",              // Col 6  (F)
  "Start Date",                 // Col 7  (G)
  "End Date",                   // Col 8  (H)
  "Rental Days",                // Col 9  (I)
  "Handover Method",            // Col 10 (J)
  "Address / Hub",              // Col 11 (K)
  "Shoot Type",                 // Col 12 (L)
  "Rental Total",               // Col 13 (M)
  "Security Deposit",           // Col 14 (N)
  "Downpayment Paid",           // Col 15 (O)
  "Balance Due",                // Col 16 (P)
  "GCash Ref Number",           // Col 17 (Q)
  "Booking Status",             // Col 18 (R)
  "Notes & Emergency Contacts", // Col 19 (S)
  "Customer Documents Folder",  // Col 20 (T) ⭐ DIRECTLY AFTER NOTES
  "Primary ID URL",             // Col 21 (U)
  "Secondary ID / COR URL",     // Col 22 (V)
  "Handwritten Auth Slip URL",  // Col 23 (W)
  "Proof of Address URL",       // Col 24 (X)
  "Selfie Verification URL",    // Col 25 (Y)
  "Payment Receipt URL",        // Col 26 (Z)
  "Guardian ID URL"             // Col 27 (AA)
];

// Widths for all 27 Columns (Col 20 is Customer Documents Folder)
const BOOKING_WIDTHS = [
  140, // 1: Booking Ref
  150, // 2: Timestamp
  160, // 3: Customer Name
  140, // 4: Contact Number
  150, // 5: Social Media Handle
  220, // 6: Camera Rented
  110, // 7: Start Date
  110, // 8: End Date
  100, // 9: Rental Days
  180, // 10: Handover Method
  200, // 11: Address / Hub
  140, // 12: Shoot Type
  130, // 13: Rental Total
  130, // 14: Security Deposit
  130, // 15: Downpayment Paid
  130, // 16: Balance Due
  160, // 17: GCash Ref Number
  160, // 18: Booking Status
  240, // 19: Notes & Emergency Contacts
  230, // 20: Customer Documents Folder ⭐ HIGHLIGHTED DEDICATED LINK
  140, // 21: Primary ID URL
  140, // 22: Secondary ID / COR URL
  140, // 23: Handwritten Auth Slip URL
  140, // 24: Proof of Address URL
  140, // 25: Selfie Verification URL
  140, // 26: Payment Receipt URL
  140  // 27: Guardian ID URL
];

// Standard 13-Column Definition for Calendar Sync Sheet (Cols 1-6 integration-locked)
const CALENDAR_SYNC_HEADERS = [
  "Camera ID",                      // Col 1  (A)
  "Start Date",                     // Col 2  (B)
  "End Date",                       // Col 3  (C)
  "Customer Tag",                   // Col 4  (D)
  "Booking Ref",                    // Col 5  (E)
  "Status",                         // Col 6  (F)
  "Pickup Event ID",                // Col 7  (G)
  "Return Event ID",                // Col 8  (H)
  "Confirmed At",                   // Col 9  (I)
  "Handover At",                    // Col 10 (J)
  "Completed At",                   // Col 11 (K)
  "Cancelled At",                   // Col 12 (L)
  "Calendar Sync Status & Audit Log"// Col 13 (M)
];

const CALENDAR_SYNC_WIDTHS = [
  150, // 1: Camera ID
  120, // 2: Start Date
  120, // 3: End Date
  170, // 4: Customer Tag
  150, // 5: Booking Ref
  150, // 6: Status
  180, // 7: Pickup Event ID
  180, // 8: Return Event ID
  160, // 9: Confirmed At
  160, // 10: Handover At
  160, // 11: Completed At
  160, // 12: Cancelled At
  280  // 13: Calendar Sync Status & Audit Log
];

// Standard 13-Column Definition for Financial & Refund Audit Sheet
const AUDIT_COLUMNS = [
  "Audit Record ID",                // Col 1  (A)
  "Booking Ref",                    // Col 2  (B)
  "Customer Name",                  // Col 3  (C)
  "Transaction Category",           // Col 4  (D)
  "Amount",                         // Col 5  (E)
  "Customer Payment Timestamp",     // Col 6  (F)
  "Payment Verification Timestamp", // Col 7  (G)
  "Booking Confirmation Timestamp", // Col 8  (H)
  "Disbursement Timestamp",         // Col 9  (I)
  "GCash / Channel Reference",      // Col 10 (J)
  "Verification Status",            // Col 11 (K)
  "Auditing Admin",                 // Col 12 (L)
  "Audit Notes & Receipt URL"       // Col 13 (M)
];

const AUDIT_WIDTHS = [
  140, // 1: Audit Record ID
  140, // 2: Booking Ref
  160, // 3: Customer Name
  210, // 4: Transaction Category
  130, // 5: Amount
  180, // 6: Customer Payment Timestamp
  190, // 7: Payment Verification Timestamp
  190, // 8: Booking Confirmation Timestamp
  180, // 9: Disbursement Timestamp
  170, // 10: GCash / Channel Reference
  170, // 11: Verification Status
  170, // 12: Auditing Admin
  260  // 13: Audit Notes & Receipt URL
];

// Standard 10-Column Definition for Fleet Inventory Sheet
const FLEET_COLUMNS = [
  "Unit ID", "Camera Model", "Serial Number", "Status",
  "Daily Rate", "2-Day Rate", "3-Day Rate", "Security Deposit",
  "Included Accessories", "Last Inspection"
];

const FLEET_WIDTHS = [120, 240, 160, 120, 130, 130, 160, 160, 320, 180];

// Allowed Booking Statuses (Validated in Bookings Col 18 & Calendar Sync Col 6)
const ALLOWED_BOOKING_STATUSES = [
  "Deposit Paid",
  "Pending Verification",
  "Confirmed",
  "Active Rental",
  "Dispatched",
  "Completed",
  "Rejected",
  "Cancelled"
];

// All 11 Valid Transaction Categories (Validated in Audit Col 4)
const TRANSACTION_CATEGORIES = [
  "Downpayment Verification",
  "Handover Balance Payment",
  "Security Deposit Receipt",
  "Security Deposit Refund",
  "Damage Deduction",
  "Deposit Forfeiture",
  "Retained Reservation Fee",
  "Assessed Cancellation Penalty",
  "Late Penalty Settlement",
  "Ledger Correction",
  "Goodwill Waiver"
];

// All 6 Valid Verification Statuses (Validated in Audit Col 11)
const AUDIT_VERIFICATION_STATUSES = [
  "Verified Received",
  "Verified Disbursed",
  "Pending Verification",
  "Unverified Claim",
  "Forfeited / Retained",
  "Waived"
];

/**
 * Bounds Guard Helper: Ensures the sheet has at least requiredCols columns.
 * Prevents "Those columns are out of bounds" errors in Google Sheets API.
 */
function ensureColumns(sheet, requiredCols) {
  const currentCols = sheet.getMaxColumns();
  if (currentCols < requiredCols) {
    sheet.insertColumnsAfter(currentCols, requiredCols - currentCols);
  }
}

/**
 * Bounds Guard Helper: Ensures the sheet has at least requiredRows rows.
 */
function ensureRows(sheet, requiredRows) {
  const currentRows = sheet.getMaxRows();
  if (currentRows < requiredRows) {
    sheet.insertRowsAfter(currentRows, requiredRows - currentRows);
  }
}

/**
 * Main Formatting & Beautification Function
 * Run this function in Google Apps Script Editor to format all sheets!
 */
function formatAndBeautifyWorkbook() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. DASHBOARD & STATS TAB (Executive Overview)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let dash = ss.getSheetByName("📊 Dashboard & Stats");
  if (!dash) {
    dash = ss.insertSheet("📊 Dashboard & Stats", 0);
  } else {
    dash.clear();
  }

  // Ensure sufficient bounds for dashboard
  ensureColumns(dash, 10);
  ensureRows(dash, 25);

  dash.setTabColor(LAVENDER);
  dash.setHiddenGridlines(false);

  // Set Row Heights (Generous luxury spacing)
  dash.setRowHeight(1, 16);
  dash.setRowHeight(2, 38); // Title
  dash.setRowHeight(3, 24); // Subtitle
  dash.setRowHeight(4, 20); // Spacer
  dash.setRowHeight(5, 26); // Metric Card Label Top
  dash.setRowHeight(6, 44); // Metric Card Value Top
  dash.setRowHeight(7, 18); // Spacer
  dash.setRowHeight(8, 26); // Metric Card Label Bottom
  dash.setRowHeight(9, 44); // Metric Card Value Bottom
  dash.setRowHeight(10, 26); // Spacer
  dash.setRowHeight(11, 32); // Table Headers
  dash.setRowHeights(12, 5, 30); // Table Content Rows

  // Set Column Widths for comfortable margins
  dash.setColumnWidth(1, 24);  // Margin A
  dash.setColumnWidth(2, 175); // B
  dash.setColumnWidth(3, 140); // C
  dash.setColumnWidth(4, 30);  // Gap D
  dash.setColumnWidth(5, 175); // E
  dash.setColumnWidth(6, 140); // F
  dash.setColumnWidth(7, 30);  // Gap G
  dash.setColumnWidth(8, 175); // H
  dash.setColumnWidth(9, 140); // I

  // Header Title & Subtitle
  dash.getRange("B2:I2").merge().setValue("PackAndFilm — Fleet Command & Financials 📸")
    .setFontFamily("Poppins").setFontSize(16).setFontWeight("bold").setFontColor(INK)
    .setVerticalAlignment("middle");
  dash.getRange("B3:I3").merge().setValue("Pasig City Hub Dispatch · Real-time booking turnover, inventory status & cashflow")
    .setFontFamily("Inter").setFontSize(10).setFontColor(MUTED)
    .setVerticalAlignment("top");

  // KPI Metric Cards Builder
  // Realization-Segregated: Uses verified audit ledger for cash received and custodial liabilities
  const kpis = [
    { labelCell: "B5", valCell: "B6", range: "B5:C6", label: "TOTAL ACTIVE BOOKINGS", formula: '=COUNTA(Bookings!A2:A)' },
    { labelCell: "E5", valCell: "E6", range: "E5:F6", label: "GROSS CONTRACTED TURNOVER", formula: '="₱" & TEXT(SUM(Bookings!M2:M), "#,##0")' },
    { labelCell: "H5", valCell: "H6", range: "H5:I6", label: "VERIFIED DOWNPAYMENTS (CASH)", formula: '="₱" & TEXT(IFERROR(SUMIFS(\'💸 Financial & Refund Audit\'!E2:E, \'💸 Financial & Refund Audit\'!D2:D, "Downpayment Verification", \'💸 Financial & Refund Audit\'!K2:K, "Verified Received"), 0), "#,##0")' },
    { labelCell: "B8", valCell: "B9", range: "B8:C9", label: "ACTIVE DEPOSITS IN CUSTODY", formula: '="₱" & TEXT(IFERROR(SUMIFS(\'💸 Financial & Refund Audit\'!E2:E, \'💸 Financial & Refund Audit\'!D2:D, "Security Deposit Receipt", \'💸 Financial & Refund Audit\'!K2:K, "Verified Received") - SUMIFS(\'💸 Financial & Refund Audit\'!E2:E, \'💸 Financial & Refund Audit\'!D2:D, "Security Deposit Refund", \'💸 Financial & Refund Audit\'!K2:K, "Verified Disbursed") - SUMIFS(\'💸 Financial & Refund Audit\'!E2:E, \'💸 Financial & Refund Audit\'!D2:D, "Damage Deduction", \'💸 Financial & Refund Audit\'!K2:K, "Forfeited / Retained"), 0), "#,##0")' },
    { labelCell: "E8", valCell: "E9", range: "E8:F9", label: "DAYS RENTED (UTILIZATION)", formula: '=SUM(Bookings!I2:I) & " Days"' },
    { labelCell: "H8", valCell: "H9", range: "H8:I9", label: "ACTIVE CAMERA FLEET", formula: '=COUNTA(\'Fleet Inventory\'!A2:A) & " Units"' }
  ];

  kpis.forEach(k => {
    dash.getRange(k.range).setBackground(LAVENDER_TINT)
      .setBorder(true, true, true, true, false, false, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
    dash.getRange(k.labelCell).setValue(k.label)
      .setFontFamily("Inter").setFontSize(9).setFontWeight("bold").setFontColor(MUTED)
      .setVerticalAlignment("middle").setHorizontalAlignment("left");
    dash.getRange(k.valCell).setFormula(k.formula)
      .setFontFamily("Poppins").setFontSize(20).setFontWeight("bold").setFontColor(INK)
      .setVerticalAlignment("middle").setHorizontalAlignment("left");
  });

  // Table 1: Handover Breakdown
  dash.getRange("B11:C11").merge().setValue("HANDOVER METHOD").setFontFamily("Poppins").setFontSize(10).setFontWeight("bold").setFontColor(INK).setBackground(LAVENDER_TINT).setVerticalAlignment("middle");
  dash.getRange("B12").setValue("Free Meetup (Pasig Hubs)").setFontFamily("Inter").setFontSize(10).setVerticalAlignment("middle");
  dash.getRange("C12").setFormula('=COUNTIF(Bookings!J2:J, "*Meetup*")').setFontFamily("Poppins").setFontSize(11).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
  dash.getRange("B13").setValue("Courier (Grab / Lalamove)").setFontFamily("Inter").setFontSize(10).setVerticalAlignment("middle");
  dash.getRange("C13").setFormula('=COUNTIF(Bookings!J2:J, "*Courier*")').setFontFamily("Poppins").setFontSize(11).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
  dash.getRange("B11:C13").setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);

  // Table 2: Category Breakdown
  dash.getRange("E11:F11").merge().setValue("SHOOT CATEGORY").setFontFamily("Poppins").setFontSize(10).setFontWeight("bold").setFontColor(INK).setBackground(PEACH_TINT).setVerticalAlignment("middle");
  dash.getRange("E12").setValue("Travel / Vacation").setFontFamily("Inter").setFontSize(10).setVerticalAlignment("middle");
  dash.getRange("F12").setFormula('=COUNTIF(Bookings!L2:L, "*Travel*")').setFontFamily("Poppins").setFontSize(11).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
  dash.getRange("E13").setValue("Concert / Music Fest").setFontFamily("Inter").setFontSize(10).setVerticalAlignment("middle");
  dash.getRange("F13").setFormula('=COUNTIF(Bookings!L2:L, "*Concert*")').setFontFamily("Poppins").setFontSize(11).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
  dash.getRange("E14").setValue("Vlog / Creative Project").setFontFamily("Inter").setFontSize(10).setVerticalAlignment("middle");
  dash.getRange("F14").setFormula('=COUNTIF(Bookings!L2:L, "*Vlog*") + COUNTIF(Bookings!L2:L, "*Event*")').setFontFamily("Poppins").setFontSize(11).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle");
  dash.getRange("E11:F14").setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);

  // Table 3: Quick Action Guide (Aligned to 4-Step Production Workflow)
  dash.getRange("H11:I11").merge().setValue("OPERATIONAL WORKFLOW").setFontFamily("Poppins").setFontSize(10).setFontWeight("bold").setFontColor(INK).setBackground(LAVENDER_TINT).setVerticalAlignment("middle");
  dash.getRange("H12:I12").merge().setValue("1. Inspect KYC via Documents Folder (Col T)").setFontFamily("Inter").setFontSize(9).setVerticalAlignment("middle");
  dash.getRange("H13:I13").merge().setValue("2. Approve KYC -> Move Status to 'Confirmed'").setFontFamily("Inter").setFontSize(9).setVerticalAlignment("middle");
  dash.getRange("H14:I14").merge().setValue("3. Equipment Handover -> Set 'Active Rental'").setFontFamily("Inter").setFontSize(9).setVerticalAlignment("middle");
  dash.getRange("H15:I15").merge().setValue("4. Check return, refund deposit -> 'Completed'").setFontFamily("Inter").setFontSize(9).setVerticalAlignment("middle");
  dash.getRange("H11:I15").setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. BOOKINGS TAB (Full Customer, KYC & Financial Tracker)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let bSheet = ss.getSheetByName("Bookings");
  if (!bSheet) {
    bSheet = ss.insertSheet("Bookings");
  }

  // ⭐ CRITICAL BOUNDS GUARD: Ensure sheet has at least 27 columns and 50 rows
  ensureColumns(bSheet, BOOKING_WIDTHS.length);
  ensureRows(bSheet, 50);

  bSheet.setTabColor(PEACH);
  bSheet.setFrozenRows(1);
  bSheet.setFrozenColumns(3);

  bSheet.setRowHeight(1, 36);
  const currentMaxRows = bSheet.getMaxRows();
  bSheet.setRowHeights(2, Math.max(1, currentMaxRows - 1), 32);

  // Set Widths for all 27 Columns (Col 20 is Customer Documents Folder)
  BOOKING_WIDTHS.forEach((w, idx) => bSheet.setColumnWidth(idx + 1, w));

  // Initialize Header Row if empty or incomplete
  if (bSheet.getLastRow() === 0 || String(bSheet.getRange(1, 1).getValue()).trim() === "") {
    bSheet.getRange(1, 1, 1, BOOKING_COLUMNS.length).setValues([BOOKING_COLUMNS]);
  } else {
    // Ensure Column 20 header says "Customer Documents Folder"
    bSheet.getRange(1, 20).setValue("Customer Documents Folder");
  }

  // Style Header Row
  const bHeader = bSheet.getRange(1, 1, 1, BOOKING_WIDTHS.length);
  bHeader.setBackground(LAVENDER)
    .setFontFamily("Poppins")
    .setFontSize(10)
    .setFontWeight("bold")
    .setFontColor(INK)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center");
  bHeader.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
  bHeader.setBorder(null, null, true, null, null, null, INK, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Distinct refined styling for Col 20 header (Customer Documents Folder)
  bSheet.getRange(1, 20).setBackground(LAVENDER).setFontColor(PURPLE_ACCENT);

  // Apply baseline data styling across all available data rows
  const maxBRows = Math.max(1, bSheet.getMaxRows() - 1);
  const bDataRange = bSheet.getRange(2, 1, maxBRows, BOOKING_WIDTHS.length);
  bDataRange.setFontFamily("Inter").setFontSize(10).setFontColor(INK).setVerticalAlignment("middle");
  bDataRange.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);

  // Column-specific alignments and number formats across full data range
  bSheet.getRange(2, 1, maxBRows, 1).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center"); // Col 1: Booking Ref
  bSheet.getRange(2, 2, maxBRows, 1).setHorizontalAlignment("center").setNumberFormat("yyyy-mm-dd hh:mm"); // Col 2: Timestamp
  bSheet.getRange(2, 3, maxBRows, 1).setHorizontalAlignment("left"); // Col 3: Customer Name
  bSheet.getRange(2, 4, maxBRows, 1).setHorizontalAlignment("center"); // Col 4: Contact Number
  bSheet.getRange(2, 5, maxBRows, 1).setHorizontalAlignment("center"); // Col 5: Social Media Handle
  bSheet.getRange(2, 6, maxBRows, 1).setHorizontalAlignment("left"); // Col 6: Camera Rented
  bSheet.getRange(2, 7, maxBRows, 2).setHorizontalAlignment("center").setNumberFormat("yyyy-mm-dd"); // Cols 7-8: Start & End Dates
  bSheet.getRange(2, 9, maxBRows, 1).setHorizontalAlignment("center").setNumberFormat("0"); // Col 9: Rental Days
  bSheet.getRange(2, 10, maxBRows, 1).setHorizontalAlignment("center"); // Col 10: Handover Method
  bSheet.getRange(2, 11, maxBRows, 1).setHorizontalAlignment("left"); // Col 11: Address / Hub
  bSheet.getRange(2, 12, maxBRows, 1).setHorizontalAlignment("center"); // Col 12: Shoot Type
  bSheet.getRange(2, 13, maxBRows, 4).setNumberFormat('"₱"#,##0').setHorizontalAlignment("right"); // Cols 13-16: Financials
  bSheet.getRange(2, 17, maxBRows, 1).setHorizontalAlignment("center"); // Col 17: GCash Ref
  bSheet.getRange(2, 18, maxBRows, 1).setFontFamily("Poppins").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center"); // Col 18: Status
  bSheet.getRange(2, 19, maxBRows, 1).setFontSize(9).setHorizontalAlignment("left").setWrap(true).setVerticalAlignment("top"); // Col 19: Notes & Emergency Contacts
  bSheet.getRange(2, 20, maxBRows, 1).setFontFamily("Inter").setFontColor(PURPLE_ACCENT).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle").setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP); // Col 20: Documents Folder
  bSheet.getRange(2, 21, maxBRows, 7).setFontSize(9).setFontColor(MUTED).setHorizontalAlignment("center").setVerticalAlignment("middle").setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP); // Cols 21-27: KYC URLs

  // Status Dropdown validation rule applied to all data rows
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ALLOWED_BOOKING_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  bSheet.getRange(2, 18, maxBRows, 1).setDataValidation(statusRule);

  // Repair notes formatting, customer folder hyperlink labels, and clip adjacent columns
  repairAndFormatBookingsSheet(bSheet);

  // Guarantee Columns 21-27 are hidden so the sheet visually ends at Column 20 (Customer Documents Folder)
  if (bSheet.getMaxColumns() >= 21) {
    bSheet.hideColumns(21, Math.min(7, bSheet.getMaxColumns() - 20));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. CALENDAR SYNC TAB (Columns 1-6 Fixed, 7-13 Extended)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let cSheet = ss.getSheetByName("Calendar Sync");
  if (!cSheet) {
    cSheet = ss.insertSheet("Calendar Sync");
  }

  // Non-breaking extension: 13 columns total (Cols 1-6 100% backward-compatible)
  ensureColumns(cSheet, CALENDAR_SYNC_WIDTHS.length);
  ensureRows(cSheet, 50);

  cSheet.setTabColor(LAVENDER);
  cSheet.setFrozenRows(1);
  cSheet.setFrozenColumns(1); // Anchor Camera ID during horizontal scroll
  cSheet.setRowHeight(1, 36);
  cSheet.setRowHeights(2, Math.max(1, cSheet.getMaxRows() - 1), 32);

  CALENDAR_SYNC_WIDTHS.forEach((w, idx) => cSheet.setColumnWidth(idx + 1, w));

  // Initialize or update header row
  if (cSheet.getLastRow() === 0 || String(cSheet.getRange(1, 1).getValue()).trim() === "") {
    cSheet.getRange(1, 1, 1, CALENDAR_SYNC_HEADERS.length).setValues([CALENDAR_SYNC_HEADERS]);
  } else {
    // Non-destructively set headers for extended columns 7-13 if missing
    cSheet.getRange(1, 7, 1, 7).setValues([["Pickup Event ID", "Return Event ID", "Confirmed At", "Handover At", "Completed At", "Cancelled At", "Calendar Sync Status & Audit Log"]]);
  }

  // Header styling consistent with Bookings & Audit
  const cHeader = cSheet.getRange(1, 1, 1, CALENDAR_SYNC_WIDTHS.length);
  cHeader.setBackground(LAVENDER)
    .setFontFamily("Poppins")
    .setFontSize(10)
    .setFontWeight("bold")
    .setFontColor(INK)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center");
  cHeader.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
  cHeader.setBorder(null, null, true, null, null, null, INK, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // Apply baseline data styling across all data rows
  const maxCRows = Math.max(1, cSheet.getMaxRows() - 1);
  const cDataRange = cSheet.getRange(2, 1, maxCRows, CALENDAR_SYNC_WIDTHS.length);
  cDataRange.setFontFamily("Inter").setFontSize(10).setFontColor(INK).setVerticalAlignment("middle");
  cDataRange.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);

  // Column-specific alignments matching the brand design system
  cSheet.getRange(2, 1, maxCRows, 1).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center"); // Col 1: Camera ID
  cSheet.getRange(2, 2, maxCRows, 2).setHorizontalAlignment("center").setNumberFormat("yyyy-mm-dd"); // Cols 2-3: Start & End Date
  cSheet.getRange(2, 4, maxCRows, 1).setHorizontalAlignment("center"); // Col 4: Customer Tag
  cSheet.getRange(2, 5, maxCRows, 1).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center"); // Col 5: Booking Ref
  cSheet.getRange(2, 6, maxCRows, 1).setFontFamily("Poppins").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center"); // Col 6: Status
  cSheet.getRange(2, 7, maxCRows, 2).setFontSize(9).setFontColor(MUTED).setHorizontalAlignment("center").setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP); // Cols 7-8: Event IDs
  cSheet.getRange(2, 9, maxCRows, 4).setHorizontalAlignment("center"); // Cols 9-12: Timestamps
  cSheet.getRange(2, 13, maxCRows, 1).setFontSize(9).setHorizontalAlignment("left").setWrap(true); // Col 13: Audit Log

  // Status dropdown validation on Col 6
  const calStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ALLOWED_BOOKING_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  cSheet.getRange(2, 6, maxCRows, 1).setDataValidation(calStatusRule);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. FLEET INVENTORY TAB
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let fSheet = ss.getSheetByName("Fleet Inventory");
  if (!fSheet) {
    fSheet = ss.insertSheet("Fleet Inventory");
  }

  ensureColumns(fSheet, FLEET_WIDTHS.length);
  ensureRows(fSheet, 20);

  fSheet.setTabColor(INK);
  fSheet.setFrozenRows(1);
  fSheet.setRowHeight(1, 36);
  fSheet.setRowHeights(2, Math.max(1, fSheet.getMaxRows() - 1), 32);

  FLEET_WIDTHS.forEach((w, idx) => fSheet.setColumnWidth(idx + 1, w));

  if (fSheet.getLastRow() === 0 || String(fSheet.getRange(1, 1).getValue()).trim() === "") {
    fSheet.getRange(1, 1, 1, FLEET_COLUMNS.length).setValues([FLEET_COLUMNS]);
    fSheet.appendRow([
      "PNF-P3-01", "DJI Osmo Pocket 3 Standard Kit", "6X89K20391", "Available",
      450, 840, 1260, 1000,
      "Wide-Angle Lens, Battery Handle, Protective Cover, Wrist Strap, Type-C Cable",
      Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd")
    ]);
    fSheet.appendRow([
      "PNF-G7X-01", "Canon PowerShot G7 X Mark III Creator Vlogging Kit", "G7X398201", "Available",
      500, 900, 1350, 1000,
      "2x NB-13L Batteries, Dedicated Charger, 32GB SD, OTG Reader, Wrist Strap, Padded Bag",
      Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd")
    ]);
    fSheet.appendRow([
      "PNF-FZ55-01", "KODAK PIXPRO FZ55 Digital Camera", "TBA", "Coming Soon",
      0, 0, 0, 0,
      "LB-012 Battery, AC Adapter, USB Cable, Wrist Strap, Padded Drawstring Pouch",
      Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd")
    ]);
  }

  const fHeader = fSheet.getRange(1, 1, 1, FLEET_WIDTHS.length);
  fHeader.setBackground(LAVENDER)
    .setFontFamily("Poppins")
    .setFontSize(10)
    .setFontWeight("bold")
    .setFontColor(INK)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center");
  fHeader.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
  fHeader.setBorder(null, null, true, null, null, null, INK, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  const maxFRows = Math.max(1, fSheet.getMaxRows() - 1);
  const fData = fSheet.getRange(2, 1, maxFRows, FLEET_WIDTHS.length);
  fData.setFontFamily("Inter").setFontSize(10).setFontColor(INK).setVerticalAlignment("middle");
  fData.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);

  fSheet.getRange(2, 1, maxFRows, 1).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center");
  fSheet.getRange(2, 2, maxFRows, 1).setHorizontalAlignment("left");
  fSheet.getRange(2, 3, maxFRows, 1).setHorizontalAlignment("center");
  fSheet.getRange(2, 4, maxFRows, 1).setFontFamily("Poppins").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  fSheet.getRange(2, 5, maxFRows, 4).setNumberFormat('"₱"#,##0').setHorizontalAlignment("right");
  fSheet.getRange(2, 9, maxFRows, 1).setFontSize(9).setHorizontalAlignment("left").setWrap(true);
  fSheet.getRange(2, 10, maxFRows, 1).setHorizontalAlignment("center").setNumberFormat("yyyy-mm-dd");

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. FINANCIAL & REFUND AUDIT TAB ("💸 Financial & Refund Audit")
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let aSheet = ss.getSheetByName("💸 Financial & Refund Audit");
  if (!aSheet) {
    aSheet = ss.insertSheet("💸 Financial & Refund Audit");
  }

  ensureColumns(aSheet, AUDIT_WIDTHS.length);
  ensureRows(aSheet, 50);

  aSheet.setTabColor(SUCCESS_TINT);
  aSheet.setFrozenRows(1);
  aSheet.setFrozenColumns(2);
  aSheet.setRowHeight(1, 36);
  aSheet.setRowHeights(2, Math.max(1, aSheet.getMaxRows() - 1), 32);

  AUDIT_WIDTHS.forEach((w, idx) => aSheet.setColumnWidth(idx + 1, w));

  // Initialize header row if missing
  if (aSheet.getLastRow() === 0 || String(aSheet.getRange(1, 1).getValue()).trim() === "") {
    aSheet.getRange(1, 1, 1, AUDIT_COLUMNS.length).setValues([AUDIT_COLUMNS]);
  }

  // Header styling consistent with Bookings & Calendar Sync
  const aHeader = aSheet.getRange(1, 1, 1, AUDIT_WIDTHS.length);
  aHeader.setBackground(LAVENDER)
    .setFontFamily("Poppins")
    .setFontSize(10)
    .setFontWeight("bold")
    .setFontColor(INK)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center");
  aHeader.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
  aHeader.setBorder(null, null, true, null, null, null, INK, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // DO NOT inject mock data! Preserve existing financial entries intact.

  // Apply baseline data styling across all available data rows
  const maxARows = Math.max(1, aSheet.getMaxRows() - 1);
  const aData = aSheet.getRange(2, 1, maxARows, AUDIT_WIDTHS.length);
  aData.setFontFamily("Inter").setFontSize(10).setFontColor(INK).setVerticalAlignment("middle");
  aData.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);

  // Specific column formatting
  aSheet.getRange(2, 1, maxARows, 2).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center"); // Record ID & Booking Ref
  aSheet.getRange(2, 3, maxARows, 1).setHorizontalAlignment("left"); // Customer Name
  aSheet.getRange(2, 4, maxARows, 1).setHorizontalAlignment("center"); // Transaction Category
  aSheet.getRange(2, 5, maxARows, 1).setNumberFormat('"₱"#,##0.00').setHorizontalAlignment("right"); // Amount
  aSheet.getRange(2, 6, maxARows, 4).setHorizontalAlignment("center"); // Timestamps
  aSheet.getRange(2, 10, maxARows, 1).setHorizontalAlignment("center"); // GCash Ref
  aSheet.getRange(2, 11, maxARows, 1).setFontFamily("Poppins").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center"); // Verification Status
  aSheet.getRange(2, 12, maxARows, 1).setHorizontalAlignment("center"); // Auditing Admin
  aSheet.getRange(2, 13, maxARows, 1).setFontSize(9).setHorizontalAlignment("left").setWrap(true); // Notes & Receipt URL

  // Category validation dropdown rule applied to ALL data rows (Rows 2 to maxRows)
  const categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(TRANSACTION_CATEGORIES, true)
    .setAllowInvalid(false)
    .build();
  aSheet.getRange(2, 4, maxARows, 1).setDataValidation(categoryRule);

  // Status validation dropdown rule applied to ALL data rows (Rows 2 to maxRows)
  const auditStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(AUDIT_VERIFICATION_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  aSheet.getRange(2, 11, maxARows, 1).setDataValidation(auditStatusRule);

  SpreadsheetApp.getActiveSpreadsheet().toast("Workbook successfully beautified & aligned!", "PackAndFilm System", 4);
}

/**
 * Non-destructive Migration Helper:
 * Run this function if you have an existing Bookings sheet and need to safely
 * insert or reposition the "Customer Documents Folder" column to Column 20 (immediately after Notes).
 */
function migrateAndAlignBookingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bSheet = ss.getSheetByName("Bookings");
  if (!bSheet) {
    Logger.log("Bookings sheet not found. Running formatAndBeautifyWorkbook instead.");
    formatAndBeautifyWorkbook();
    return;
  }

  // Ensure bounds
  ensureColumns(bSheet, 27);
  ensureRows(bSheet, 50);

  const headers = bSheet.getRange(1, 1, 1, bSheet.getLastColumn()).getValues()[0];
  let notesIndex = -1;
  let folderIndex = -1;

  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || "").trim().toLowerCase();
    if (h.includes("note")) notesIndex = i; // 0-based index
    if (h.includes("folder") || h.includes("customer documents")) folderIndex = i;
  }

  Logger.log("Notes column index: " + (notesIndex + 1) + ", Folder column index: " + (folderIndex + 1));

  // If Folder column already immediately follows Notes column, nothing to reorder!
  if (notesIndex !== -1 && folderIndex === notesIndex + 1) {
    bSheet.getRange(1, folderIndex + 1).setValue("Customer Documents Folder");
    Logger.log("Customer Documents Folder is already positioned correctly at Column " + (folderIndex + 1));
    formatAndBeautifyWorkbook();
    return;
  }

  // If folder exists at the end (e.g. Column 27) and Notes is Column 19:
  if (notesIndex !== -1 && folderIndex > notesIndex + 1) {
    Logger.log("Moving folder column from " + (folderIndex + 1) + " to " + (notesIndex + 2));
    bSheet.insertColumnAfter(notesIndex + 1); // inserts at notesIndex + 2
    bSheet.getRange(1, notesIndex + 2).setValue("Customer Documents Folder");

    // Copy data from old folder column (which shifted right by 1)
    const oldColAfterShift = folderIndex + 2;
    const numRows = Math.max(1, bSheet.getLastRow() - 1);
    if (numRows > 0) {
      const folderData = bSheet.getRange(2, oldColAfterShift, numRows, 1).getValues();
      bSheet.getRange(2, notesIndex + 2, numRows, 1).setValues(folderData);
    }
    // Delete old shifted column
    bSheet.deleteColumn(oldColAfterShift);
    Logger.log("Column moved successfully.");
  } else if (notesIndex !== -1 && folderIndex === -1) {
    // Insert new Column immediately after Notes
    Logger.log("Inserting new Customer Documents Folder column after Notes");
    bSheet.insertColumnAfter(notesIndex + 1);
    bSheet.getRange(1, notesIndex + 2).setValue("Customer Documents Folder");
  }

  formatAndBeautifyWorkbook();
}

/**
 * Dedicated Validator & Formatter for the Financial & Refund Audit Tab:
 * Applies the 11 Transaction Category dropdown options and 6 Status options
 * to ALL data rows (starting at Row 2), ensures correct alignment, currency
 * formatting, and crisp borders, without altering existing ledger entries or re-introducing mock data.
 */
function fixFinancialAuditValidationAndFormatting() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let aSheet = ss.getSheetByName("💸 Financial & Refund Audit");
  if (!aSheet) {
    aSheet = ss.insertSheet("💸 Financial & Refund Audit");
  }

  ensureColumns(aSheet, AUDIT_WIDTHS.length);
  ensureRows(aSheet, 50);

  aSheet.setTabColor(SUCCESS_TINT);
  aSheet.setFrozenRows(1);
  aSheet.setFrozenColumns(2);
  aSheet.setRowHeight(1, 36);
  aSheet.setRowHeights(2, Math.max(1, aSheet.getMaxRows() - 1), 32);

  AUDIT_WIDTHS.forEach((w, idx) => aSheet.setColumnWidth(idx + 1, w));

  // Ensure Header Row
  if (aSheet.getLastRow() === 0 || String(aSheet.getRange(1, 1).getValue()).trim() === "") {
    aSheet.getRange(1, 1, 1, AUDIT_COLUMNS.length).setValues([AUDIT_COLUMNS]);
  }

  const aHeader = aSheet.getRange(1, 1, 1, AUDIT_WIDTHS.length);
  aHeader.setBackground(LAVENDER)
    .setFontFamily("Poppins")
    .setFontSize(10)
    .setFontWeight("bold")
    .setFontColor(INK)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center");
  aHeader.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
  aHeader.setBorder(null, null, true, null, null, null, INK, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  const maxRows = Math.max(1, aSheet.getMaxRows() - 1);

  // Apply baseline data styling to all data rows
  const allData = aSheet.getRange(2, 1, maxRows, AUDIT_WIDTHS.length);
  allData.setFontFamily("Inter").setFontSize(10).setFontColor(INK).setVerticalAlignment("middle");
  allData.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);

  // Specific column formatting
  aSheet.getRange(2, 1, maxRows, 2).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center"); // Record ID & Booking Ref
  aSheet.getRange(2, 3, maxRows, 1).setHorizontalAlignment("left"); // Customer Name
  aSheet.getRange(2, 4, maxRows, 1).setHorizontalAlignment("center"); // Transaction Category
  aSheet.getRange(2, 5, maxRows, 1).setNumberFormat('"₱"#,##0.00').setHorizontalAlignment("right"); // Amount
  aSheet.getRange(2, 6, maxRows, 4).setHorizontalAlignment("center"); // Timestamps
  aSheet.getRange(2, 10, maxRows, 1).setHorizontalAlignment("center"); // GCash Ref
  aSheet.getRange(2, 11, maxRows, 1).setFontFamily("Poppins").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center"); // Verification Status
  aSheet.getRange(2, 12, maxRows, 1).setHorizontalAlignment("center"); // Auditing Admin
  aSheet.getRange(2, 13, maxRows, 1).setFontSize(9).setHorizontalAlignment("left").setWrap(true); // Notes & Receipt URL

  // Category validation dropdown rule applied to all data rows
  const categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(TRANSACTION_CATEGORIES, true)
    .setAllowInvalid(false)
    .build();
  aSheet.getRange(2, 4, maxRows, 1).setDataValidation(categoryRule);

  // Status validation dropdown rule applied to all data rows
  const auditStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(AUDIT_VERIFICATION_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  aSheet.getRange(2, 11, maxRows, 1).setDataValidation(auditStatusRule);

  SpreadsheetApp.getActiveSpreadsheet().toast("Financial & Refund Audit validation and styling updated!", "PackAndFilm System", 4);
}

// ─────────────────────────────────────────────────────────────
// BOOKINGS DISPLAY & FORMATTING HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Extracts Google Drive folder ID from a Drive URL or raw ID string.
 */
function extractFolderIdFromUrl(folderUrlOrId) {
  if (!folderUrlOrId || typeof folderUrlOrId !== "string") return "";
  const trimmed = folderUrlOrId.trim();
  if (/^[a-zA-Z0-9_-]{25,}$/.test(trimmed)) {
    return trimmed;
  }
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  return "";
}

/**
 * Retrieves the actual folder name from Google Drive using DriveApp.
 * Falls back to fallbackName or "Customer Documents" if DriveApp cannot resolve it.
 */
function getActualDriveFolderName(folderUrlOrId, fallbackName) {
  const folderId = extractFolderIdFromUrl(folderUrlOrId);
  if (folderId) {
    try {
      const folder = DriveApp.getFolderById(folderId);
      if (folder) {
        const actualName = folder.getName();
        if (actualName && actualName.trim() !== "") {
          return actualName.trim();
        }
      }
    } catch (err) {
      Logger.log("DriveApp.getFolderById warning: " + err.toString());
    }
  }
  return (fallbackName && String(fallbackName).trim()) || "Customer Documents";
}

/**
 * Extracts the underlying URL whether stored as =HYPERLINK("url", "label"),
 * RichText link, or plain text URL.
 */
function extractDriveFolderUrl(cellVal, cellFormula, richTextVal) {
  if (cellFormula && typeof cellFormula === "string" && cellFormula.toUpperCase().startsWith("=HYPERLINK")) {
    const match = cellFormula.match(/=HYPERLINK\(\s*["']([^"']+)["']/i);
    if (match && match[1]) return match[1].trim();
  }
  if (richTextVal && typeof richTextVal.getLinkUrl === "function") {
    const link = richTextVal.getLinkUrl();
    if (link) return link.trim();
  }
  const strVal = String(cellVal || "").trim();
  if (strVal.startsWith("http://") || strVal.startsWith("https://")) {
    return strVal;
  }
  const driveMatch = strVal.match(/https?:\/\/[^\s"']+/);
  if (driveMatch) return driveMatch[0];

  return "";
}

/**
 * Extracts a Google Drive Folder or File ID from a variety of URL shapes.
 */
function extractDriveIdFromUrl(url) {
  if (!url || typeof url !== "string") return "";
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : "";
}

/**
 * Scans a customer's dedicated Google Drive folder and maps all uploaded KYC files.
 */
function extractKycUrlsFromFolder(folder) {
  const docMap = {
    id1: "",
    id2: "",
    authSlip: "",
    billing: "",
    selfie: "",
    receipt: "",
    guardian: ""
  };
  if (!folder) return docMap;

  try {
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const name = file.getName().toLowerCase();
      const url = file.getUrl();

      if (name.startsWith("01_") || (name.includes("primary") && !name.includes("back"))) {
        if (!docMap.id1) docMap.id1 = url;
      } else if (name.startsWith("02_") || name.includes("secondary") || name.includes("student")) {
        if (!docMap.id2) docMap.id2 = url;
      } else if (name.startsWith("03_") || (name.includes("auth") && !name.includes("selfie"))) {
        if (!docMap.authSlip) docMap.authSlip = url;
      } else if (name.startsWith("04_") || name.includes("proof") || name.includes("address") || name.includes("billing") || name.includes("delivery")) {
        if (!docMap.billing) docMap.billing = url;
      } else if (name.startsWith("05_") || (name.includes("selfie") && !name.includes("slip") && !name.includes("ids"))) {
        if (!docMap.selfie) docMap.selfie = url;
      } else if (name.startsWith("06_") || name.includes("receipt") || name.includes("payment") || name.includes("gcash")) {
        if (!docMap.receipt) docMap.receipt = url;
      } else if (name.startsWith("07_") || name.includes("guardian") || name.includes("parent") || name.includes("contact1")) {
        if (!docMap.guardian) docMap.guardian = url;
      }
    }
  } catch (err) {
    Logger.log("Error extracting files from folder: " + err.toString());
  }

  return docMap;
}

/**
 * Formats notes text into clear, readable, structured sections with line breaks:
 * - General note remarks (if any)
 * - Emergency Contacts (bulleted per contact, preserving social information)
 * - Status History (bulleted per transition log)
 * Fully idempotent and preserves 100% of the content.
 */
function formatNotesText(rawNotes) {
  if (!rawNotes || typeof rawNotes !== "string") return "";
  let text = rawNotes.trim();
  if (!text) return "";

  // 1. Extract all status change and transition entries
  const statusRegex = /\[(?:Status changed from|Transition:)[^\]]+\]/g;
  const statusMatches = text.match(statusRegex) || [];

  // Remove status change entries from main text
  let nonStatusText = text.replace(statusRegex, "").trim();
  // Remove "Status History:" label if already present
  nonStatusText = nonStatusText.replace(/Status History:[\s\S]*$/i, "").trim();

  const sections = [];

  // 2. Parse Emergency Contacts if present
  const ecMatch = nonStatusText.match(/Emergency Contacts:\s*([\s\S]*)/i);
  let mainNote = "";
  let emergencyContacts = [];

  if (ecMatch) {
    mainNote = nonStatusText.substring(0, ecMatch.index).trim();
    const ecBody = ecMatch[1].trim();
    // Split contacts by semicolons or existing newlines/bullets
    const rawList = ecBody.split(/;|\n|•/).map(s => s.trim()).filter(Boolean);
    emergencyContacts = rawList;
  } else {
    mainNote = nonStatusText;
  }

  if (mainNote) {
    sections.push(mainNote);
  }

  if (emergencyContacts.length > 0) {
    const formattedContacts = emergencyContacts.map(c => c.startsWith("•") ? c : "• " + c).join("\n");
    sections.push("Emergency Contacts:\n" + formattedContacts);
  }

  if (statusMatches.length > 0) {
    const formattedStatus = statusMatches.map(s => "• " + s).join("\n");
    sections.push("Status History:\n" + formattedStatus);
  }

  return sections.join("\n\n");
}

/**
 * Repairs and formats all booking rows in the Bookings sheet:
 * 1. Formats Notes with line breaks, bullet points, and dynamic row heights.
 * 2. Displays Customer Documents Folder as =HYPERLINK(url, folderName) using the actual Drive folder name.
 * 3. Enforces WrapStrategy.CLIP on Col 20 and Cols 21-27, and removes any misplaced folder URLs from Cols 21-27.
 * 4. Preserves all data, schema, column order, and integrations.
 */
function repairAndFormatBookingsSheet(bSheet) {
  if (!bSheet) return;
  const lastRow = bSheet.getLastRow();
  if (lastRow <= 1) return;

  const lastCol = Math.max(bSheet.getLastColumn(), 27);
  const headers = bSheet.getRange(1, 1, 1, lastCol).getValues()[0];

  let notesIdx = 18;       // Default Column 19 (0-indexed 18)
  let folderIdx = 19;      // Default Column 20 (0-indexed 19)
  let customerNameIdx = 2; // Default Column 3 (0-indexed 2)

  // Dynamically resolve header indices
  headers.forEach((h, idx) => {
    const clean = String(h || "").trim().toLowerCase();
    if (clean.includes("note")) notesIdx = idx;
    if (clean.includes("folder") || clean.includes("customer documents")) folderIdx = idx;
    if (clean.includes("customer name")) customerNameIdx = idx;
  });

  const numRows = lastRow - 1;
  const dataRange = bSheet.getRange(2, 1, numRows, lastCol);
  const values = dataRange.getValues();
  const formulas = dataRange.getFormulas();

  for (let i = 0; i < numRows; i++) {
    const rowNum = i + 2;
    const customerName = String(values[i][customerNameIdx] || "").trim();

    // ── 1. Format Notes Column ──
    const currentNotes = String(values[i][notesIdx] || "").trim();
    if (currentNotes) {
      const formattedNotes = formatNotesText(currentNotes);
      if (formattedNotes !== currentNotes) {
        bSheet.getRange(rowNum, notesIdx + 1).setValue(formattedNotes);
      }
      // Set dynamic row height based on line count
      const lineCount = formattedNotes.split("\n").length;
      const targetHeight = Math.max(32, Math.min(120, 24 + lineCount * 14));
      bSheet.setRowHeight(rowNum, targetHeight);
    } else {
      bSheet.setRowHeight(rowNum, 32);
    }

    // ── 2. Format Customer Documents Folder Column ──
    const rawVal = values[i][folderIdx];
    const rawFormula = (formulas[i] && formulas[i][folderIdx]) || "";
    const folderUrl = extractDriveFolderUrl(rawVal, rawFormula);

    if (folderUrl) {
      const actualFolderName = getActualDriveFolderName(folderUrl, customerName);
      const hyperlinkFormula = '=HYPERLINK("' + folderUrl + '", "' + actualFolderName.replace(/"/g, '""') + '")';
      bSheet.getRange(rowNum, folderIdx + 1).setFormula(hyperlinkFormula);
    }

    // ── 3. Clean any misplaced duplicate folder URLs that spilled into other cells ──
    // Retains valid KYC file links in columns 21-27, only cleaning duplicate copies of the folder link
    if (folderUrl) {
      for (let c = 0; c < lastCol; c++) {
        if (c === folderIdx) continue;
        const cellVal = String(values[i][c] || "").trim();
        const cellForm = (formulas[i] && formulas[i][c]) || "";
        if (cellVal === folderUrl || cellForm.includes(folderUrl)) {
          bSheet.getRange(rowNum, c + 1).clearContent();
        }
      }

      // ── 3b. Auto-Recover and Populate Missing KYC Links from Customer's Drive Folder ──
      try {
        const folderId = extractDriveIdFromUrl(folderUrl);
        if (folderId) {
          const folder = DriveApp.getFolderById(folderId);
          if (folder) {
            const docMap = extractKycUrlsFromFolder(folder);
            const mapping = [
              { col: 21, key: "id1" },
              { col: 22, key: "id2" },
              { col: 23, key: "authSlip" },
              { col: 24, key: "billing" },
              { col: 25, key: "selfie" },
              { col: 26, key: "receipt" },
              { col: 27, key: "guardian" }
            ];
            mapping.forEach(m => {
              const currentVal = String(values[i][m.col - 1] || "").trim();
              if (!currentVal && docMap[m.key]) {
                bSheet.getRange(rowNum, m.col).setValue(docMap[m.key]);
              }
            });
          }
        }
      } catch (fErr) {
        Logger.log("Error recovering files from folder for row " + rowNum + ": " + fErr.toString());
      }
    }
  }

  // ── 3c. Ensure Standard Headers for Columns 21-27 ──
  const standardKycHeaders = [
    "Primary ID URL", "Secondary ID / COR URL", "Handwritten Auth Slip URL",
    "Proof of Address URL", "Selfie Verification URL", "Payment Receipt URL", "Guardian ID URL"
  ];
  if (bSheet.getMaxColumns() >= 27) {
    bSheet.getRange(1, 21, 1, 7).setValues([standardKycHeaders]);
  }

  // ── 4. Apply Wrap Strategies and Alignments ──
  // Notes: Wrap text and align top
  bSheet.getRange(2, notesIdx + 1, numRows, 1)
    .setWrap(true)
    .setVerticalAlignment("top")
    .setFontSize(9)
    .setHorizontalAlignment("left");

  // Customer Documents Folder: Clip text to avoid any potential overflow
  bSheet.getRange(2, folderIdx + 1, numRows, 1)
    .setFontFamily("Inter")
    .setFontColor(PURPLE_ACCENT)
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

  // KYC Columns (Cols 21-27): Set clip wrap strategy and muted styling
  const kycStartCol = folderIdx + 2;
  const kycColCount = Math.min(7, Math.max(0, bSheet.getMaxColumns() - (folderIdx + 1)));
  if (kycColCount > 0) {
    bSheet.getRange(2, kycStartCol, numRows, kycColCount)
      .setFontSize(9)
      .setFontColor(MUTED)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle")
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

    // ── 5. Make KYC Document Link Columns Completely Invisible in Google Sheets ──
    // Hides columns 21-27 from view in Sheets so it looks completely clean up to Column 20,
    // while remaining fully readable by the Admin Dashboard and backend integrations.
    bSheet.hideColumns(kycStartCol, kycColCount);
  }
}

/**
 * Top-Level Standalone Function:
 * Can be executed directly from the Apps Script toolbar to repair and format the Bookings tab.
 */
function fixAndFormatBookingsDisplay() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const bSheet = ss.getSheetByName("Bookings");
  if (!bSheet) {
    SpreadsheetApp.getActiveSpreadsheet().toast("Bookings sheet not found!", "PackAndFilm System", 4);
    return;
  }
  repairAndFormatBookingsSheet(bSheet);
  formatBookingsSheet();
  SpreadsheetApp.getActiveSpreadsheet().toast("Bookings sheet formatting, notes, and folder links repaired!", "PackAndFilm System", 4);
}

/**
 * Dedicated Formatter for the Bookings Tab:
 * Applies consistent styling, alignments, borders, and dropdowns across all 27 columns
 * without touching existing data or modifying the schema.
 */
function formatBookingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let bSheet = ss.getSheetByName("Bookings");
  if (!bSheet) return;

  ensureColumns(bSheet, BOOKING_WIDTHS.length);
  ensureRows(bSheet, 50);

  bSheet.setTabColor(PEACH);
  bSheet.setFrozenRows(1);
  bSheet.setFrozenColumns(3);

  bSheet.setRowHeight(1, 36);
  const currentMaxRows = bSheet.getMaxRows();
  bSheet.setRowHeights(2, Math.max(1, currentMaxRows - 1), 32);

  BOOKING_WIDTHS.forEach((w, idx) => bSheet.setColumnWidth(idx + 1, w));

  if (bSheet.getLastRow() === 0 || String(bSheet.getRange(1, 1).getValue()).trim() === "") {
    bSheet.getRange(1, 1, 1, BOOKING_COLUMNS.length).setValues([BOOKING_COLUMNS]);
  } else {
    bSheet.getRange(1, 20).setValue("Customer Documents Folder");
  }

  const bHeader = bSheet.getRange(1, 1, 1, BOOKING_WIDTHS.length);
  bHeader.setBackground(LAVENDER);
  bHeader.setFontFamily("Poppins");
  bHeader.setFontSize(10);
  bHeader.setFontWeight("bold");
  bHeader.setFontColor(INK);
  bHeader.setVerticalAlignment("middle");
  bHeader.setHorizontalAlignment("center");
  bHeader.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
  bHeader.setBorder(null, null, true, null, null, null, INK, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  bSheet.getRange(1, 20).setBackground(LAVENDER).setFontColor(PURPLE_ACCENT);

  const maxBRows = Math.max(1, bSheet.getMaxRows() - 1);
  const bDataRange = bSheet.getRange(2, 1, maxBRows, BOOKING_WIDTHS.length);
  bDataRange.setFontFamily("Inter").setFontSize(10).setFontColor(INK).setVerticalAlignment("middle");
  bDataRange.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);

  bSheet.getRange(2, 1, maxBRows, 1).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center");
  bSheet.getRange(2, 2, maxBRows, 1).setHorizontalAlignment("center").setNumberFormat("yyyy-mm-dd hh:mm");
  bSheet.getRange(2, 3, maxBRows, 1).setHorizontalAlignment("left");
  bSheet.getRange(2, 4, maxBRows, 1).setHorizontalAlignment("center");
  bSheet.getRange(2, 5, maxBRows, 1).setHorizontalAlignment("center");
  bSheet.getRange(2, 6, maxBRows, 1).setHorizontalAlignment("left");
  bSheet.getRange(2, 7, maxBRows, 2).setHorizontalAlignment("center").setNumberFormat("yyyy-mm-dd");
  bSheet.getRange(2, 9, maxBRows, 1).setHorizontalAlignment("center").setNumberFormat("0");
  bSheet.getRange(2, 10, maxBRows, 1).setHorizontalAlignment("center");
  bSheet.getRange(2, 11, maxBRows, 1).setHorizontalAlignment("left");
  bSheet.getRange(2, 12, maxBRows, 1).setHorizontalAlignment("center");
  bSheet.getRange(2, 13, maxBRows, 4).setNumberFormat('"₱"#,##0').setHorizontalAlignment("right");
  bSheet.getRange(2, 17, maxBRows, 1).setHorizontalAlignment("center");
  bSheet.getRange(2, 18, maxBRows, 1).setFontFamily("Poppins").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  bSheet.getRange(2, 19, maxBRows, 1).setFontSize(9).setHorizontalAlignment("left").setWrap(true).setVerticalAlignment("top");
  bSheet.getRange(2, 20, maxBRows, 1).setFontFamily("Inter").setFontColor(PURPLE_ACCENT).setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle").setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  bSheet.getRange(2, 21, maxBRows, 7).setFontSize(9).setFontColor(MUTED).setHorizontalAlignment("center").setVerticalAlignment("middle").setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ALLOWED_BOOKING_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  bSheet.getRange(2, 18, maxBRows, 1).setDataValidation(statusRule);

  // Repair notes formatting, customer folder hyperlink labels, dynamic row heights, and clip adjacent columns
  repairAndFormatBookingsSheet(bSheet);

  // Guarantee Columns 21-27 are hidden so the sheet visually ends at Column 20 (Customer Documents Folder)
  if (bSheet.getMaxColumns() >= 21) {
    bSheet.hideColumns(21, Math.min(7, bSheet.getMaxColumns() - 20));
  }

  SpreadsheetApp.getActiveSpreadsheet().toast("Bookings tab design successfully refreshed!", "PackAndFilm System", 4);
}

/**
 * Dedicated Formatter for the Calendar Sync Tab:
 * Matches fonts, row heights, headers, borders, and status dropdowns with the workbook style,
 * while preserving all synchronization data and keeping columns A–F 100% compatible.
 */
function formatCalendarSyncSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let cSheet = ss.getSheetByName("Calendar Sync");
  if (!cSheet) return;

  ensureColumns(cSheet, CALENDAR_SYNC_WIDTHS.length);
  ensureRows(cSheet, 50);

  cSheet.setTabColor(LAVENDER);
  cSheet.setFrozenRows(1);
  cSheet.setFrozenColumns(1);
  cSheet.setRowHeight(1, 36);
  cSheet.setRowHeights(2, Math.max(1, cSheet.getMaxRows() - 1), 32);

  CALENDAR_SYNC_WIDTHS.forEach((w, idx) => cSheet.setColumnWidth(idx + 1, w));

  if (cSheet.getLastRow() === 0 || String(cSheet.getRange(1, 1).getValue()).trim() === "") {
    cSheet.getRange(1, 1, 1, CALENDAR_SYNC_HEADERS.length).setValues([CALENDAR_SYNC_HEADERS]);
  } else {
    cSheet.getRange(1, 7, 1, 7).setValues([["Pickup Event ID", "Return Event ID", "Confirmed At", "Handover At", "Completed At", "Cancelled At", "Calendar Sync Status & Audit Log"]]);
  }

  const cHeader = cSheet.getRange(1, 1, 1, CALENDAR_SYNC_WIDTHS.length);
  cHeader.setBackground(LAVENDER);
  cHeader.setFontFamily("Poppins");
  cHeader.setFontSize(10);
  cHeader.setFontWeight("bold");
  cHeader.setFontColor(INK);
  cHeader.setVerticalAlignment("middle");
  cHeader.setHorizontalAlignment("center");
  cHeader.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);
  cHeader.setBorder(null, null, true, null, null, null, INK, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  const maxCRows = Math.max(1, cSheet.getMaxRows() - 1);
  const cDataRange = cSheet.getRange(2, 1, maxCRows, CALENDAR_SYNC_WIDTHS.length);
  cDataRange.setFontFamily("Inter").setFontSize(10).setFontColor(INK).setVerticalAlignment("middle");
  cDataRange.setBorder(true, true, true, true, true, true, BORDER_COLOR, SpreadsheetApp.BorderStyle.SOLID);

  cSheet.getRange(2, 1, maxCRows, 1).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center");
  cSheet.getRange(2, 2, maxCRows, 2).setHorizontalAlignment("center").setNumberFormat("yyyy-mm-dd");
  cSheet.getRange(2, 4, maxCRows, 1).setHorizontalAlignment("center");
  cSheet.getRange(2, 5, maxCRows, 1).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center");
  cSheet.getRange(2, 6, maxCRows, 1).setFontFamily("Poppins").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  cSheet.getRange(2, 7, maxCRows, 2).setFontSize(9).setFontColor(MUTED).setHorizontalAlignment("center").setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  cSheet.getRange(2, 9, maxCRows, 4).setHorizontalAlignment("center");
  cSheet.getRange(2, 13, maxCRows, 1).setFontSize(9).setHorizontalAlignment("left").setWrap(true);

  const calStatusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ALLOWED_BOOKING_STATUSES, true)
    .setAllowInvalid(false)
    .build();
  cSheet.getRange(2, 6, maxCRows, 1).setDataValidation(calStatusRule);

  SpreadsheetApp.getActiveSpreadsheet().toast("Calendar Sync tab design successfully refreshed!", "PackAndFilm System", 4);
}

/**
 * Automatically syncs the Fleet Inventory sheet with all 3 camera units:
 * - DJI Osmo Pocket 3 Standard Kit
 * - Canon PowerShot G7 X Mark III Creator Vlogging Kit
 * - KODAK PIXPRO FZ55 Digital Camera (Coming Soon)
 *
 * Safe to run anytime: Only appends units that are not already present!
 */
function syncFleetInventory() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let fSheet = ss.getSheetByName("Fleet Inventory");
  if (!fSheet) {
    fSheet = ss.insertSheet("Fleet Inventory");
  }

  ensureColumns(fSheet, FLEET_WIDTHS.length);
  if (fSheet.getLastRow() === 0 || String(fSheet.getRange(1, 1).getValue()).trim() === "") {
    fSheet.getRange(1, 1, 1, FLEET_COLUMNS.length).setValues([FLEET_COLUMNS]);
  }

  const existingData = fSheet.getDataRange().getValues();
  const existingUnitIds = existingData.slice(1).map(r => String(r[0]).trim());

  const fleetUnits = [
    [
      "PNF-P3-01", "DJI Osmo Pocket 3 Standard Kit", "6X89K20391", "Available",
      450, 840, 1260, 1000,
      "Wide-Angle Lens, Battery Handle, Protective Cover, Wrist Strap, Type-C Cable",
      Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd")
    ],
    [
      "PNF-G7X-01", "Canon PowerShot G7 X Mark III Creator Vlogging Kit", "G7X398201", "Available",
      500, 900, 1350, 1000,
      "2x NB-13L Batteries, Dedicated Charger, 32GB SD, OTG Reader, Wrist Strap, Padded Bag",
      Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd")
    ],
    [
      "PNF-FZ55-01", "KODAK PIXPRO FZ55 Digital Camera", "TBA", "Coming Soon",
      0, 0, 0, 0,
      "LB-012 Battery, AC Adapter, USB Cable, Wrist Strap, Padded Drawstring Pouch",
      Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd")
    ]
  ];

  let addedCount = 0;
  fleetUnits.forEach(unit => {
    if (!existingUnitIds.includes(unit[0])) {
      fSheet.appendRow(unit);
      addedCount++;
    }
  });

  const maxFRows = Math.max(1, fSheet.getMaxRows() - 1);
  fSheet.getRange(2, 1, maxFRows, 1).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center");
  fSheet.getRange(2, 2, maxFRows, 1).setHorizontalAlignment("left");
  fSheet.getRange(2, 3, maxFRows, 1).setHorizontalAlignment("center");
  fSheet.getRange(2, 4, maxFRows, 1).setFontFamily("Poppins").setFontWeight("bold").setFontSize(9).setHorizontalAlignment("center");
  fSheet.getRange(2, 5, maxFRows, 4).setNumberFormat('"₱"#,##0').setHorizontalAlignment("right");
  fSheet.getRange(2, 9, maxFRows, 1).setFontSize(9).setHorizontalAlignment("left").setWrap(true);
  fSheet.getRange(2, 10, maxFRows, 1).setHorizontalAlignment("center").setNumberFormat("yyyy-mm-dd");

  ss.toast("Fleet Inventory synchronized! Added " + addedCount + " new unit(s).", "PackAndFilm System", 4);
}
