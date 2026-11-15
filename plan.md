# Implementation Plan: Admin Fleet Calendar, Unit Tracking & GCash Deposit Refund

## 1. Problem & Requirement Analysis

### Issue A: GCash Name & Number Missing in Admin Dashboard
- **Root Cause**: In the booking flow (Step 3), the customer inputs `booking.gcashAccountName` and `booking.gcashAccountNumber` for their ₱1,000 security deposit refund.
- **Resolution**:
  1. Forwarded in `src/App.tsx` both as root fields and inside `notes`.
  2. Extracted in `google-apps-script/Code.gs` and returned in `getAllBookings`.
  3. Rendered prominently in `AdminDashboard.tsx` on booking cards, unit inspection cards, and the KYC drawer with 1-click copy buttons.

### Issue B: Admin Fleet Calendar & Date Blocking (Partner-Friendly Redesign)
- **Partner Usability Requirement**: Make the calendar and date-blocking functionality intuitive, friendly, and matched directly to the customer website's `UnifiedRentalCalendar` styling and interaction.
- **Resolution**:
  1. Built the Admin Fleet Calendar mirroring `UnifiedRentalCalendar.tsx`:
     - Clean neo-brutalist circular day buttons (`SU`, `MO`, `TU`, `WE`, `TH`, `FR`, `SA`).
     - Multi-unit status dots: 🟢 Available, 🟠 Turnover, 🔴 Booked, 🔒 Admin Hold.
  2. **Direct Click-to-Range Functionality**:
     - Click Day 1 -> sets start date.
     - Click Day 2 -> sets return date (range is highlighted in soft purple `bg-[#EDE8FC]` with bold brutalist borders).
     - Or click same day for a single-day hold.
  3. **Inline Action Panel (Right side on desktop, stacked on mobile)**:
     - Top Card: **🔒 Lock / Reserve Selected Dates**:
       - Displays selected dates and days count.
       - Unit selector: `All 3 Fleet Units` | `Osmo Pocket 3` | `G7 X Black` | `G7 X Silver`.
       - 1-click reason pills: `🔧 Maintenance & Cleaning`, `👤 Personal Shoot / Test`, `🌟 Walk-In Customer`, `🚫 Shop Closed / Holiday`.
       - If Walk-In Customer: clean inputs for Customer Name and Phone Number.
       - Optional internal notes input.
       - Big, bold Action Button: **`🔒 Confirm & Lock Selected Dates`**.
     - Bottom Card: **📦 Fleet Equipment Status for Selected Day**:
       - Lists all 3 camera units on that day.
       - If available: `🟢 Ready to Rent` with `[🔒 Quick Lock]` button.
       - If hold: `🔒 Admin Hold` with reason, notes, and **`[🔓 Unblock / Release Dates]`** 1-click button!
       - If customer rental: Renter name, contact, pickup/return hours, **Deposit Refund GCash Details**, and `[👁️ Inspect KYC & Reservation]` button.
  4. **Cleaned Redundant Modal & Buttons**:
     - Removed redundant `[🔒 Block / Reserve Dates]` from the view switcher row.
     - Removed redundant `[+ Advanced Modal]` from the camera unit toolbar.
     - Deleted dead modal markup (`showBlockModal`) to eliminate clutter and confusion.
     - Preserved the original full-width cards and solid dark `#1A1A2E` active button styling per user preference.

### Issue C: White Screen Crash on Rapid Navigation After Refresh
- **Root Cause Discovered & Proven**:
  - When refreshing the admin dashboard, `AdminDashboard` immediately initializes its initial `bookings` state from `localBookings` (from `localStorage` or `App.tsx` state before the Google Sheets fetch completes).
  - These records (`BookingRecord`) had `id`, `title`, and `renterTag`, but did not have `customerName` or `bookingRef`.
  - When the user quickly switched to `Fleet Calendar & Units` (before `fetchAllBookings` replaced them with backend records), `getFleetUnitBookingsForDate` executed:
    1. `b.customerName.includes('[ADMIN')`: threw `TypeError: Cannot read properties of undefined (reading 'includes')`.
    2. `a.bookingRef.localeCompare(b.bookingRef)`: threw `TypeError: Cannot read properties of undefined (reading 'localeCompare')`.
  - Since React had no error boundary, this unhandled render exception unmounted the whole DOM tree into a blank white screen.
- **Resolution**:
  1. Built universal normalizer `normalizeAdminBooking` ensuring every booking object always has defined `customerName`, `bookingRef`, `cameraId`, `cameraRented`, `startDate`, `endDate`, `status`, and `notes`.
  2. Guarded `getFleetUnitBookingsForDate`: string-coerced all `customerName`, `status`, and `bookingRef` reads and guarded sorting logic against missing values.
  3. Added `customerName: customer` and `bookingRef: id` to `mapSheetRowToBooking` in `src/App.tsx` and updated `BookingRecord` in `src/data/bookings.ts`.
  4. Wrapped the dashboard in an `AdminErrorBoundary` class component that catches any unforeseen render glitch and presents a recovery card instead of a white screen.
  5. Verified with headless Chrome CDP rapid-reload script (`verify_rapid_refresh_and_switch.cjs`): 0 runtime exceptions and clean instant rendering.
  6. Discovered and resolved `UNDEFINEDD MULTI-DAY` typo by calculating `rentalDays` dynamically from `startDate` and `endDate` when undefined.

---

## 2. Strict Git Guardrails Status
- **Rule**: Absolutely ZERO commits and ZERO git pushes until explicitly authorized by the user.
- **Status**: Verified. 5 unstaged modified files (`google-apps-script/Code.gs`, `plan.md`, `src/App.tsx`, `src/components/AdminDashboard.tsx`, `src/data/bookings.ts`). No commits made.

---

## 3. Verification & Evidence
- **Build**: `npm run build` completed cleanly in 521ms (0 errors).
- **Comprehensive 8-Test Automated CDP Suite** (`scratch/deep_test_suite.cjs`):
  1. `Test 1: Initial Render` &rarr; PASS (Dashboard mounted cleanly)
  2. `Test 2: Rapid Tab Switching Stress Test` &rarr; PASS (10 rapid cycles in 600ms, 0 crashes)
  3. `Test 3: Month Navigation` &rarr; PASS (Chevrons Next/Prev & Jump to Today)
  4. `Test 4: Fleet Unit Filter Switching` &rarr; PASS (All 3 Units, Osmo Pocket 3, G7 X Black, G7 X Silver)
  5. `Test 5: Range Selection & Reversal` &rarr; PASS (Forward range, backward selection, Clear selection)
  6. `Test 6: Date Hold & Unblock` &rarr; PASS (Created hold, verified rack card, unblocked cleanly)
  7. `Test 7: Dirty Data Resilience` &rarr; PASS (Zero crashes with null, missing, NaN dates, and unassigned IDs)
  8. `Test 8: Bookings Manager & KYC Inspection` &rarr; PASS (Search filtering & inspection drawer operational)
  - **Runtime Exceptions**: 0
  - **Console Errors**: 0
  - **Verified Artifact**: [admin_deep_test_verified.png](file:///C:/Users/superuser/.gemini/antigravity/brain/d8cefea1-a5b9-43f1-8c1b-74d441a36da4/admin_deep_test_verified.png)
- **Interactive Browser CDP Tests**:
  - `admin_partner_calendar_overview.png`: Verified the clean calendar overview with all 3 camera units and status dots.
  - `admin_partner_range_selected.png`: Verified clicking Day 20 then Day 22 highlights the range and updates the Lock card to "3 Days".
  - `admin_partner_after_lock.png`: Verified clicking "Lock Selected Dates" creates the hold and shows the green confirmation banner.
  - `admin_partner_equipment_rack_scrolled.png`: Verified the 3-unit equipment rack with 1-click Unblock and Quick Lock buttons.
