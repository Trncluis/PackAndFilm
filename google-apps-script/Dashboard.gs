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
  150, // 21: Primary ID URL
  150, // 22: Secondary ID / COR URL
  150, // 23: Handwritten Auth Slip URL
  150, // 24: Proof of Address URL
  150, // 25: Selfie Verification URL
  150, // 26: Payment Receipt URL
  150  // 27: Guardian ID URL
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
  // Updated Active Deposits Held formula to accurately count Confirmed, Active Rental, and legacy Dispatched bookings!
  const kpis = [
    { labelCell: "B5", valCell: "B6", range: "B5:C6", label: "TOTAL ACTIVE BOOKINGS", formula: '=COUNTA(Bookings!A2:A)' },
    { labelCell: "E5", valCell: "E6", range: "E5:F6", label: "GROSS RENTAL REVENUE", formula: '="₱" & TEXT(SUM(Bookings!M2:M), "#,##0")' },
    { labelCell: "H5", valCell: "H6", range: "H5:I6", label: "DOWNPAYMENTS IN GCASH", formula: '="₱" & TEXT(SUM(Bookings!O2:O), "#,##0")' },
    { labelCell: "B8", valCell: "B9", range: "B8:C9", label: "ACTIVE DEPOSITS HELD", formula: '="₱" & TEXT(SUMIFS(Bookings!N2:N, Bookings!R2:R, "Confirmed") + SUMIFS(Bookings!N2:N, Bookings!R2:R, "Active Rental") + SUMIFS(Bookings!N2:N, Bookings!R2:R, "Dispatched"), "#,##0")' },
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

  bSheet.setRowHeight(1, 38);
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

  // Highlight the dedicated Customer Documents Folder header
  bSheet.getRange(1, 20).setBackground("#B794F4").setFontColor(INK);

  // Populate Seed Data if sheet only contains header row
  if (bSheet.getLastRow() <= 1) {
    bSheet.appendRow([
      "#PNF-2026-001", new Date("2026-10-06T14:20:00"), "Mikey Mendez", "0917 888 2341", "@mikey.creates",
      "DJI Osmo Pocket 3 Standard Kit", "2026-10-14", "2026-10-17", 3, "Courier (Lalamove)", "NAIA T3 Flight Dispatch",
      "Travel / Siargao", 1350, 2500, 300, 3550, "1029384756123", "Confirmed",
      "Verified written note + emergency contacts",
      "https://drive.google.com/drive/folders/sample_folder_mikey_001",
      "https://drive.google.com/file/d/sample_id1", "https://drive.google.com/file/d/sample_id2",
      "https://drive.google.com/file/d/sample_slip", "https://drive.google.com/file/d/sample_bill",
      "https://drive.google.com/file/d/sample_selfie", "https://drive.google.com/file/d/sample_receipt",
      ""
    ]);
    bSheet.appendRow([
      "#PNF-2026-002", new Date("2026-10-06T18:45:00"), "Jillian Santos", "0922 555 1928", "@jillian_vlogs",
      "DJI Osmo Pocket 3 Standard Kit", "2026-10-21", "2026-10-23", 2, "Free Meetup", "Ortigas MRT / Megamall Hub",
      "Concert (Olivia Rodrigo)", 1000, 1000, 300, 1700, "9876543210123", "Active Rental",
      "Student ID + Guardian verified. Handed over at Mega B.",
      "https://drive.google.com/drive/folders/sample_folder_jillian_002",
      "https://drive.google.com/file/d/sample_id1_2", "https://drive.google.com/file/d/sample_cor_2",
      "https://drive.google.com/file/d/sample_slip_2", "https://drive.google.com/file/d/sample_bill_2",
      "https://drive.google.com/file/d/sample_selfie_2", "https://drive.google.com/file/d/sample_receipt_2",
      "https://drive.google.com/file/d/sample_guardian_2"
    ]);
    bSheet.appendRow([
      "#PNF-2026-003", new Date("2026-10-07T09:15:00"), "Sofia Alcantara", "0918 333 7744", "@sofia_films",
      "DJI Osmo Pocket 3 Standard Kit", "2026-10-24", "2026-10-26", 2, "Free Meetup", "Estancia Mall Pasig Hub",
      "Vlog / Halloween Market", 1000, 1000, 300, 1700, "5544332211009", "Deposit Paid",
      "Awaiting proof of billing upload inspection",
      "https://drive.google.com/drive/folders/sample_folder_sofia_003",
      "https://drive.google.com/file/d/sample_id1_3", "", "https://drive.google.com/file/d/sample_slip_3",
      "", "https://drive.google.com/file/d/sample_selfie_3", "https://drive.google.com/file/d/sample_receipt_3",
      ""
    ]);
  }

  const effectiveRows = Math.max(bSheet.getLastRow() - 1, 1);
  const dataRange = bSheet.getRange(2, 1, effectiveRows, BOOKING_WIDTHS.length);
  dataRange.setFontFamily("Inter").setFontSize(10).setFontColor(INK).setVerticalAlignment("middle");

  // Format Specific Column Ranges
  bSheet.getRange(2, 1, effectiveRows, 1).setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center");
  bSheet.getRange(2, 7, effectiveRows, 3).setHorizontalAlignment("center"); // Dates and Days
  bSheet.getRange(2, 13, effectiveRows, 4).setNumberFormat('"₱"#,##0').setHorizontalAlignment("right"); // Financials
  bSheet.getRange(2, 17, effectiveRows, 1).setHorizontalAlignment("center"); // GCash Ref

  // Format Dedicated Customer Documents Folder Column (Col 20 / T)
  const folderColRange = bSheet.getRange(2, 20, effectiveRows, 1);
  folderColRange.setHorizontalAlignment("center")
    .setFontFamily("Inter")
    .setFontColor(PURPLE_ACCENT)
    .setFontWeight("bold");

  // Status Dropdown validation — Bound strictly to available sheet rows
  const statusRowCount = Math.max(1, bSheet.getMaxRows() - 1);
  const statusCol = bSheet.getRange(2, 18, statusRowCount, 1);
  const allowedStatuses = [
    "Deposit Paid",
    "Pending Verification",
    "Confirmed",
    "Active Rental",
    "Dispatched",
    "Completed",
    "Rejected",
    "Cancelled"
  ];
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(allowedStatuses, true)
    .setAllowInvalid(false)
    .build();
  statusCol.setDataValidation(rule);
  statusCol.setHorizontalAlignment("center").setFontFamily("Poppins").setFontWeight("bold").setFontSize(9);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. CALENDAR SYNC TAB
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let cSheet = ss.getSheetByName("Calendar Sync");
  if (!cSheet) {
    cSheet = ss.insertSheet("Calendar Sync");
  }

  ensureColumns(cSheet, 6);
  ensureRows(cSheet, 30);

  cSheet.setTabColor(LAVENDER);
  cSheet.setFrozenRows(1);
  cSheet.setRowHeight(1, 36);
  cSheet.setRowHeights(2, Math.max(1, cSheet.getMaxRows() - 1), 30);

  const cWidths = [150, 120, 120, 180, 150, 140];
  cWidths.forEach((w, idx) => cSheet.setColumnWidth(idx + 1, w));

  cSheet.getRange(1, 1, 1, cWidths.length)
    .setBackground(LAVENDER_TINT)
    .setFontFamily("Poppins")
    .setFontSize(10)
    .setFontWeight("bold")
    .setFontColor(INK)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center");

  if (cSheet.getLastRow() <= 1) {
    cSheet.getRange(1, 1, 1, 6).setValues([["Camera ID", "Start Date", "End Date", "Customer Tag", "Booking Ref", "Status"]]);
    cSheet.appendRow(["dji-pocket-3", "2026-10-14", "2026-10-17", "@mikey.creates", "#PNF-2026-001", "Confirmed"]);
    cSheet.appendRow(["dji-pocket-3", "2026-10-21", "2026-10-23", "@jillian_vlogs", "#PNF-2026-002", "Active Rental"]);
    cSheet.appendRow(["dji-pocket-3", "2026-10-24", "2026-10-26", "@sofia_films", "#PNF-2026-003", "Deposit Paid"]);
  }

  cSheet.getRange(2, 1, Math.max(1, cSheet.getLastRow() - 1), cWidths.length)
    .setFontFamily("Inter").setFontSize(10).setVerticalAlignment("middle").setHorizontalAlignment("center");

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. FLEET INVENTORY TAB
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  let fSheet = ss.getSheetByName("Fleet Inventory");
  if (!fSheet) {
    fSheet = ss.insertSheet("Fleet Inventory");
  }

  ensureColumns(fSheet, 10);
  ensureRows(fSheet, 20);

  fSheet.setTabColor(INK);
  fSheet.setFrozenRows(1);
  fSheet.setRowHeight(1, 36);
  fSheet.setRowHeights(2, Math.max(1, fSheet.getMaxRows() - 1), 34);

  const fWidths = [120, 240, 160, 120, 130, 130, 160, 160, 320, 180];
  fWidths.forEach((w, idx) => fSheet.setColumnWidth(idx + 1, w));

  fSheet.getRange(1, 1, 1, fWidths.length)
    .setBackground(LAVENDER_TINT)
    .setFontFamily("Poppins")
    .setFontSize(10)
    .setFontWeight("bold")
    .setFontColor(INK)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center");

  if (fSheet.getLastRow() <= 1) {
    fSheet.getRange(1, 1, 1, 10).setValues([[
      "Unit ID", "Camera Model", "Serial Number", "Status",
      "Daily Rate", "2-Day Rate", "3-Day Rate", "Security Deposit",
      "Included Accessories", "Last Inspection"
    ]]);
    fSheet.appendRow([
      "PNF-P3-01", "DJI Osmo Pocket 3 Standard Kit", "6X89K20391", "Available",
      500, 1000, 1350, 2500,
      "Wide-Angle Lens, Battery Handle, Protective Cover, Wrist Strap, Type-C Cable",
      Utilities.formatDate(new Date(), "GMT+8", "yyyy-MM-dd")
    ]);
  }

  const fData = fSheet.getRange(2, 1, Math.max(1, fSheet.getLastRow() - 1), fWidths.length);
  fData.setFontFamily("Inter").setFontSize(10).setVerticalAlignment("middle");
  fSheet.getRange("E2:H10").setNumberFormat('"₱"#,##0').setHorizontalAlignment("right");
  fSheet.getRange("A2:A10").setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center");
  fSheet.getRange("D2:D10").setFontFamily("Poppins").setFontWeight("bold").setHorizontalAlignment("center");

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
