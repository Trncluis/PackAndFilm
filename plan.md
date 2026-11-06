# Master Implementation Plan: PackAndFilm v3.4 (Routing, Google Sheets Sync, Model B Ledger & Digital Receipt)

> **Execution Status:** Planning Mode (Mode B per `GEMINI.md`).  
> **Strict Deployment Guardrails:** No `git push`, no merge to `main`, no Vercel production deployment, no real customer submissions to production Google Sheets, and no real document uploads.

---

## 1. Executive Summary & Architectural Scope

This document represents the complete, fully verified technical implementation plan for PackAndFilm v3.4. It addresses all architecture, performance, financial, and privacy requirements without breaking existing features, altering business rules, or exposing sensitive customer data.

### Core Objectives
1. **Format-Aware & Empirically Calibrated Client-Side Document Processing**:
   - Reduces submission latency from 15–25 seconds down toward a 3–5 second target by pre-processing high-resolution camera uploads prior to base64 encoding.
   - Enforces realistic payload safety limits (max 5MB per file, max 10MB total base64 batch) to avoid Google Apps Script memory and payload boundaries.
   - Format-specific handling: PDF pass-through, PNG preservation, empirical JPEG calibration, and three-tier HEIC support (Native Decode $\rightarrow$ Binary Safe Storage $\rightarrow$ Admin Dashboard Graceful Fallback).
2. **Vercel SPA Routing & Refresh Fix**:
   - Eliminates 404 errors on direct navigation and browser refresh across all application routes (`/`, `/book`, `/requirements`, `/terms`, `/admin`).
   - Uses verified Vercel routing syntax that prioritizes the filesystem for static assets (`/assets/*`, `.js`, `.css`, images) while mapping virtual routes to `index.html`.
3. **Non-Destructive Google Sheets Schema & Authoritative Model B Accounting**:
   - Preserves Columns 1–27 completely intact (Columns 20–27 remain locked in position for Drive folder links and hidden KYC URLs).
   - Appends `Meetup Fee` and `Grand Total` strictly as Column 28 and Column 29.
   - Implements strict schema validation: if required financial columns are missing, the backend flags a schema mismatch rather than silently omitting data or misrepresenting a successful financial save.
   - Enforces authoritative Model B calculations and official Grab Express policy: PackAndFilm coordinates and books Grab Express directly; renter shoulders actual courier charges; Meetup Fee is strictly ₱0.
4. **Customer-Facing Digital Booking Receipt (Step 5)**:
   - Uses the actual, authoritative booking object returned by the backend after successful storage.
   - Standardizes on the exact label **"Meetup Fee"** (₱200 or ₱0) throughout.
   - Prominently displays the renter's chosen **Pickup Time Slot** and **Return Time Slot** within the 8:00 AM – 11:00 PM operating window.
   - Privacy-first: strictly omits Google Drive URLs, KYC file links, emergency contacts, and GCash refund mobile numbers.
   - Single-click Print / Save as PDF with dedicated `@media print` styling.

---

## 2. Affected Files & Components

| File / Component | Role in Implementation | Changes Needed |
|---|---|---|
| `vercel.json` *(New Root File)* | Vercel Deployment Routing | Configures SPA routing using verified Vercel rewrite syntax that guarantees static asset pass-through. |
| `src/utils/documentProcessor.ts` *(New Utility)* | Format-Aware File Processor | Client-side compression, PDF binary pass-through, size validation, three-tier HEIC handling, safe error boundaries. |
| `src/App.tsx` | Main Router, Modal Flow & Step 5 Receipt | Integrates `documentProcessor`, enhances `popstate` routing, updates Step 5 receipt with saved backend data, standardizes Grab Express wording and "Meetup Fee" terminology. |
| `google-apps-script/Code.gs` | Backend Handler & Sheets Ledger | Authoritative Model B calculation, dynamic column detection for Col 28 (`Meetup Fee`) and Col 29 (`Grand Total`), strict schema validation, sanitized customer confirmation response. |
| `src/index.css` | Global Styling & Print Styles | Neo-brutalist print media stylesheet (`@media print`) isolating the receipt card and stripping modal backdrops, navigation, and buttons. |
| `src/components/AdminDashboard.tsx` | Admin Verification Interface | Supports new financial fields (`Meetup Fee`, `Grand Total`), renders HEIC document cards with direct Drive links when inline preview is unavailable. |

---

## 3. Deep Technical Architecture & Solutions

### A. Format-Aware Document Processing & Realistic Payload Boundaries

#### 1. Identified Risks
- **Payload Limits**: Google Apps Script Web Apps fail if request payloads exceed internal limits or exhaust execution memory (~500MB runtime heap). Unconstrained uploads (e.g. six 15MB files = 90MB raw = 120MB base64) will crash Apps Script with `413 Payload Too Large` or out-of-memory errors.
- **HEIC Browser Fragmentation**: Browsers do not universally decode HEIC in `<canvas>`. Safari on iOS/macOS supports HEIC natively; Chrome and Firefox on Windows/Android do not support native HEIC canvas decoding without multi-megabyte WebAssembly decoders.
- **Text Degradation**: Over-aggressive compression can render ID numbers, student numbers, specimen signatures, or GCash reference numbers illegible, compromising KYC verification.

#### 2. Technical Solutions
- **Payload & Size Constraints**:
  - Individual file limit: **5MB maximum per file** for PDFs and uncompressed images.
  - Batch upload limit: **10MB maximum total base64 payload** (~7.5MB raw binary total).
  - Pre-flight check in `documentProcessor.ts`: Validates total batch size before network transmission; displays clear user-facing error if exceeded.
- **Format-Specific Handling**:
  - **PDF Documents** (`application/pdf`): Passed through directly as raw base64 data without canvas conversion or downscaling, preserving vector sharpness on multi-page student Certificates of Registration.
  - **PNG Images** (`image/png`): If file size $\le 1.0\text{MB}$, original lossless PNG is preserved. If $> 1.0\text{MB}$, canvas downscales to max 1600px dimension and re-encodes to high-quality PNG to protect crisp typography and transparency.
  - **JPEG/JPG Images** (`image/jpeg`): Initial calibration: maximum dimension 1600px, JPEG quality 0.82. Empirical verification tests check that fine print on IDs remains legible. If legibility is threatened, compression quality automatically scales up or falls back to original.
  - **Unsupported Formats**: Validates MIME type and file extension; immediately rejects executables, archives, or unknown files with: *"Please upload a valid JPG, PNG, HEIC, or PDF file."*
- **Three-Tier Architecture for HEIC**:
  - **Tier 1 (Client Processing)**: Detects HEIC. If the browser environment supports native HEIC decoding (e.g. Safari), decodes on canvas, normalizes EXIF orientation, and exports as JPEG.
  - **Tier 2 (Safe Storage Fallback)**: If canvas decoding fails or is unsupported (e.g. Chrome on Windows), the original HEIC binary is uploaded untouched with `.heic` extension to Google Drive. No heavy external WebAssembly dependencies are forced into the bundle.
  - **Tier 3 (Admin Preview Compatibility)**: In `AdminDashboard.tsx`, standard images/PDFs render via native `<img>` or `<iframe>`. For unrendered HEIC files, the dashboard renders an informational card (*"HEIC Document Vaulted in Google Drive • Direct In-Browser Preview Unavailable on this browser"*) accompanied by a direct button to open/download the file in Google Drive, completely avoiding broken image icons.

---

### B. Vercel SPA Routing & Refresh Configuration

#### 1. Identified Risks
- Unverified regex lookaheads in `vercel.json` can cause build failures, intercept static asset requests (`/assets/*.js`, `/assets/*.css`, images, fonts), or misroute backend API calls.

#### 2. Technical Solution
We deploy the verified Vercel SPA configuration that guarantees static files on disk are served directly while all client-side navigation routes fallback cleanly to `index.html`:

```json
{
  "rewrites": [
    {
      "source": "/((?!assets/|favicon\\.ico|logo\\.png|robots\\.txt|.*\\.[a-zA-Z0-9]+$).*)",
      "destination": "/index.html"
    }
  ]
}
```

- **Static Asset Guarantee**: Any request containing a file extension or matching `/assets/*` bypasses the rewrite and is served directly by the Vercel CDN.
- **Frontend State Binding (`src/App.tsx`)**:
  - Direct URL access to `/book` mounts the application and sets `activeView = 'book'` and `isModalOpen = true` at Step 1.
  - Direct URL access to `/requirements`, `/terms`, `/admin` mounts the corresponding view.
  - Unrecognized paths cleanly default to `home` without breaking application state.
  - Browser Back and Forward buttons (`popstate` listener) transition between views and modal visibility without resetting user input prematurely.

---

### C. Google Sheets Schema & Authoritative Model B Accounting

#### 1. Identified Risks
- Inserting columns in the middle of Columns 1–27 breaks existing formulas, shifts hidden KYC columns (21–27), and corrupts historical row data.
- Silently ignoring missing columns could cause financial values to be dropped while reporting a successful booking.

#### 2. Technical Solution
- **Preservation of Columns 1–27**:
  - Columns 1 through 27 remain completely locked in their current order:
    - Col 1–9: Booking Ref, Timestamp, Customer Name, Contact Number, Social Media Handle, Camera Rented, Start Date, End Date, Rental Days.
    - Col 10: `Handover Method` (stores `"Meetup"` or `"Grab Express Delivery"`).
    - Col 11: `Address / Hub` (stores Pasig Hub name e.g. `"SM East Ortigas"` or Delivery Address).
    - Col 12: `Shoot Type`.
    - Col 13: `Rental Total`.
    - Col 14: `Security Deposit` (₱1,000).
    - Col 15: `Downpayment Paid` (₱300).
    - Col 16: `Balance Due`.
    - Col 17: `GCash Ref Number`.
    - Col 18: `Booking Status`.
    - Col 19: `Notes & Emergency Contacts`.
    - Col 20: `Customer Documents Folder`.
    - Col 21–27: Hidden KYC Document URLs (`Primary ID`, `Secondary ID`, `Auth Slip`, `Billing Proof`, `Selfie`, `Receipt`, `Guardian ID`).
- **Append-Only Schema Evolution (Columns 28 & 29)**:
  - Genuinely new financial fields are appended **strictly after Column 27**:
    - **Column 28**: `Meetup Fee`
    - **Column 29**: `Grand Total`
- **Strict Schema Validation & Controlled Initialization in `Code.gs`**:
  - When `getHeaderIndexMap()` runs, it checks for `meetupFee` and `grandTotal` using `findCol(["meetup fee"], -1)` and `findCol(["grand total"], -1)`.
  - **Controlled Schema Auto-Initialization**:
    If the sheet currently has 27 columns, Apps Script executes `ensureColumns(sheet, 29)` and writes the headers `"Meetup Fee"` to Column 28 and `"Grand Total"` to Column 29 in Row 1.
  - **Schema Mismatch Detection**:
    If the script cannot locate or initialize Columns 28 and 29 (e.g. permission restriction or locked header row), it **rejects the transaction** and returns an explicit error:
    ```json
    {
      "status": "error",
      "code": "SCHEMA_MISMATCH",
      "message": "Database schema requires Meetup Fee (Col 28) and Grand Total (Col 29) headers. Booking was not recorded to prevent financial discrepancy."
    }
    ```
    This eliminates any silent loss of financial ledger entries.
  - **Legacy Record Handling**:
    Historical rows (created prior to v3.4) have empty cells in Columns 28 and 29. The mapper distinguishes legacy rows: when reading historical bookings in `getAllBookings`, if `meetupFee` is empty, it evaluates the row's `handoverMethod`: if Meetup, it maps `meetupFee: 200`, otherwise `0`; for `grandTotal`, it safely calculates `rentalTotal + meetupFee + securityDeposit`. New v3.4 bookings always have Columns 28 and 29 physically written.
- **Authoritative Model B Math in `Code.gs`**:
  The backend recalculates all financial totals from the authoritative camera pricing configuration:
  - **DJI Osmo Pocket 3**: 1–2 days @ ₱450/day; 3–5 days @ ₱400/day; 6+ days @ ₱350/day.
  - **Canon PowerShot G7 X Mark III**: 1–2 days @ ₱550/day; 3–5 days @ ₱500/day; 6+ days @ ₱450/day.
  - **Meetup Fee**: ₱200 if Handover is Meetup, ₱0 if Grab Express.
  - **Security Deposit**: ₱1,000 (Refundable, NOT rental income).
  - **Grand Total**: Rental Total + Meetup Fee + Security Deposit.
  - **Balance Due**: Grand Total - ₱300 Downpayment Credited.
- **Official Grab Express Operating Policy**:
  - UI, backend notes, and receipts explicitly state: *"PackAndFilm books Grab Express directly for equipment dispatch and return. Renter shoulders actual courier charges."*
  - Grab Express bookings strictly carry a **₱0 Meetup Fee**.

---

### D. Sanitized Backend Response & Digital Booking Receipt (Step 5)

#### 1. Sanitized Backend Response Payload
The confirmation response returned by `doPost` contains only what is necessary for the customer's receipt:

```json
{
  "status": "success",
  "bookingRef": "#PNF-2026-8492",
  "timestamp": "2026-11-05 14:30",
  "customerName": "Juan Dela Cruz",
  "cameraRented": "DJI Osmo Pocket 3 Creator Combo",
  "startDate": "2026-11-14",
  "endDate": "2026-11-15",
  "rentalDays": 2,
  "pickupTimeSlot": "10:00 AM",
  "returnTimeSlot": "8:00 PM",
  "handoverMethod": "Meetup",
  "meetupLocation": "SM East Ortigas",
  "rentalTotal": 900,
  "meetupFee": 200,
  "securityDeposit": 1000,
  "grandTotal": 2100,
  "downpaymentPaid": 300,
  "balanceDue": 1800,
  "gcashRefNumber": "1029384756"
}
```

- **Strict Privacy Exclusions**:
  - No `driveFolderUrl`
  - No KYC document URLs
  - No emergency contact names or phone numbers
  - No GCash refund mobile numbers
  - No internal admin logs

#### 2. Step 5 Receipt Implementation
- **Source of Truth**: Populated using the verified backend response object.
- **Consistent Terminology**: Strictly uses the label **"Meetup Fee"** throughout (no alternating with "Meetup Handling Fee").
- **Prominent Schedules**:
  - **Pickup Schedule**: `[Start Date] at [Pickup Time Slot]`.
  - **Return Schedule**: `[End Date] at [Return Time Slot]`.
  - **Operating Hours**: `8:00 AM – 11:00 PM Daily`.
- **Itemized Model B Statement**:
  - Camera Rental Fee: `₱[rentalTotal]`
  - Meetup Fee: `₱200` (or `₱0` for Grab Express)
  - Refundable Security Deposit: `₱1,000`
  - **Grand Package Total**: `₱[grandTotal]`
  - Downpayment Paid: `-₱300` (Credited • GCash Ref: `[gcashRefNumber]`)
  - **Balance Due at Handover**: `₱[balanceDue]`
- **Single-Click Print / Save as PDF**:
  - `@media print` in `src/index.css` hides modals, dark backdrops, navbars, and buttons.
  - The receipt card renders with clean borders and readable typography on standard A4 paper without clipped content.

---

## 4. Skills Applied

1. **Ponytail (`.agents/skills/ponytail/SKILL.md`)**:
   - Adheres to minimal code footprint: zero heavy image-processing npm dependencies; clean single Vercel SPA rewrite; non-destructive append-only column extension in `Code.gs`.
2. **Superpowers (`.agents/skills/using-superpowers/SKILL.md`)**:
   - Enforces rigorous discipline: strict schema mismatch reporting, thorough isolated testing matrix before completion, and complete isolation between customer receipts and admin data.
3. **shadcn (`.agents/skills/shadcn/SKILL.md`)**:
   - Informs semantic card containers, accessible field error states, and clean button variant handling.
4. **UI UX Pro Max (`.agents/skills/ui-ux-pro-max/SKILL.md`)**:
   - Preserves PackAndFilm's neo-brutalist visual style (`2px border #1A1A2E`, `3px drop shadow`), touch targets ($\ge 44\text{px}$), accessible color contrast ratios ($\ge 4.5:1$), and high-fidelity print stylesheet design.

---

## 5. Comprehensive Verification & Testing Matrix

All testing will be conducted strictly in local/isolated staging with mock fixtures. Zero live records will be submitted to the production spreadsheet.

### Test Suite 1: Format-Aware Image Compression & Processing
- [ ] **Empirical Legibility Test (JPEG/JPG)**: Test sample government IDs, student IDs, handwritten slips, and GCash screenshots with 1600px / 0.82 initial parameters. Verify that text, ID numbers, specimen signatures, and timestamps remain readable at 100% zoom.
- [ ] **Lossless PNG Test**: Upload sample PNG screenshot; verify transparency and sharp edge preservation without conversion artifacts.
- [ ] **PDF Raw Pass-Through Test**: Upload sample PDF document; verify raw binary base64 preservation without rasterization.
- [ ] **Three-Tier HEIC Test**:
  - Native browser decode test: Verify canvas decode and orientation correction on supporting environments.
  - Non-supporting browser test: Verify original binary pass-through without corruption.
  - Admin Dashboard test: Verify unconvertible HEIC files display an informational card with a direct Google Drive link rather than a broken image.
- [ ] **Payload Safety Limit Test**: Upload file $> 5\text{MB}$ or batch $> 10\text{MB}$; verify frontend pre-flight boundary cleanly blocks submission with clear guidance.

### Test Suite 2: Official Model B Financial Math Scenarios
| Scenario | Days | Tier Rate | Rental Total | Meetup Fee | Deposit | Grand Total | Downpayment | Balance Due |
|---|---|---|---:|---:|---:|---:|---:|---:|
| **Pocket 3, 1-day Meetup** | 1 | ₱450/day | ₱450 | ₱200 | ₱1,000 | ₱1,650 | ₱300 | ₱1,350 |
| **Pocket 3, 3-day Meetup** | 3 | ₱400/day | ₱1,200 | ₱200 | ₱1,000 | ₱2,400 | ₱300 | ₱2,100 |
| **Canon G7 X, 2-day Grab** | 2 | ₱550/day | ₱1,100 | ₱0 | ₱1,000 | ₱2,100 | ₱300 | ₱1,800 |
| **Canon G7 X, 6-day Grab** | 6 | ₱450/day | ₱2,700 | ₱0 | ₱1,000 | ₱3,700 | ₱300 | ₱3,400 |
- [ ] Verify frontend calculations match backend independent calculations for all 4 scenarios.
- [ ] Verify Grab Express bookings strictly calculate ₱0 Meetup Fee and display the official courier policy.

### Test Suite 3: Routing & Refresh Navigation
- [ ] **Direct Load Tests**: Visit `http://localhost:3000/`, `/book`, `/requirements`, `/terms`, `/admin` directly; confirm all load without 404.
- [ ] **Browser Refresh Tests**: Refresh on `/book` and `/terms`; confirm page reloads cleanly at the expected view.
- [ ] **Browser History Tests**: Click Back and Forward buttons; confirm transitions between views and modal close/open sync accurately.
- [ ] **Unknown Route Test**: Visit `/non-existent-route`; confirm graceful normalization to `home` view.
- [ ] **Asset Loading**: Confirm CSS, JS chunks, and public images load with HTTP 200 without being rewritten to `index.html`.

### Test Suite 4: Step 5 Final Digital Receipt & Print Layout
- [ ] **Backend Data Binding**: Verify Step 5 displays values from the backend response object.
- [ ] **Schedule Verification**: Confirm chosen `pickupTimeSlot` (e.g. 10:00 AM) and `returnTimeSlot` (e.g. 8:00 PM) are prominently displayed.
- [ ] **Terminology & Privacy Verification**: Confirm the label "Meetup Fee" is used exclusively. Confirm zero KYC document URLs, emergency contacts, or GCash refund numbers are rendered.
- [ ] **Print Layout Preview**: Trigger `window.print()`; verify all UI chrome is hidden and receipt renders crisply on standard A4 paper size.

### Test Suite 5: Google Sheets & Backend Compatibility
- [ ] Verify Columns 1–27 remain completely untouched in position.
- [ ] Verify controlled schema initialization safely appends Column 28 (`Meetup Fee`) and Column 29 (`Grand Total`).
- [ ] Verify that missing required headers trigger an explicit `SCHEMA_MISMATCH` rejection rather than silent omission.
- [ ] Verify historical 27-column booking records remain readable and compatible.
- [ ] Confirm `computeDeterministicArchiveFingerprint` remains stable.
- [ ] Verify zero regressions in Admin Dashboard operations and Google Drive folder linking.

---

## 6. Identified Risks, Safeguards & Limitations

1. **HEIC Decoding Compatibility**:
   - *Risk*: Legacy web browsers lack native HEIC canvas decoding.
   - *Safeguard*: Three-tier handling preserves the original binary in Google Drive; Admin Dashboard provides a dedicated Google Drive link rather than showing a broken thumbnail.
2. **Payload Size Limits**:
   - *Risk*: Massive document uploads can cause Google Apps Script out-of-memory errors.
   - *Safeguard*: Client-side pre-flight limits enforce max 5MB per file and max 10MB total batch size.
3. **Spreadsheet Header Modifications**:
   - *Risk*: Shifting existing columns 1–27 breaks KYC link formulas and historical rows.
   - *Safeguard*: Columns 1–27 remain completely untouched; new fields are strictly appended as Column 28 and Column 29 with dynamic `findCol()` lookups and strict schema mismatch error reporting.
4. **Strict Deployment Safeguards**:
   - Zero changes will be pushed to GitHub or deployed to Vercel production until local testing is complete and explicit approval is provided.
