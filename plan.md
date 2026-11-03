# Plan: Streamlined 4-Step Booking, Model B Calendar Day Rates, & Zero Defaults

## 1. Objective & Architectural Alignment
Update PackAndFilm's booking engine according to the user's explicit business requirements:
1. **Adopt Model B (Strict Calendar Day Model)**:
   - Calculate rental duration as inclusive calendar days: `(End Date - Start Date) + 1`.
   - Nov 3 to Nov 3 = **1 Day** (₱450 Pocket 3 / ₱550 Canon G7X).
   - Nov 3 to Nov 4 = **2 Days** ($2 \times \text{rate}$).
   - Nov 3 to Nov 5 = **3 Days** ($3 \times \text{tier rate}$).
   - Remove misleading `(24h)` labels from digital receipts, confirmation summaries, and cards.
   - Update toggle button subtitle to `8:00 AM – 11:00 PM` (removing `8 AM - 12 AM`).

2. **Remove Redundant Summary Card from Step 1**:
   - Remove the duplicate summary card at the bottom of Step 1 (`media_1793681676983_055f3d87.png`).
   - The desktop Live Digital Receipt and mobile sticky receipt already render the real-time cost breakdown, ₱300 downpayment, balance on handover, and refundable security deposit.

3. **Merge Handover Mode into Step 1 (Streamlining from 5 steps to 4 steps)**:
   - Move Handover Mode (Meet-up at Pasig Hub vs. Grab Express Delivery ONLY) directly into Step 1 under the Calendar & Time selectors.
   - When **Meet-up** is selected: Prompt for Hub selection (SM East Ortigas, Bridgetowne, Opus Mall).
   - When **Grab Express Delivery** is selected: Prompt for complete Metro Manila delivery address.
   - Result: Booking becomes **4 clean, purposeful steps**:
     - **Step 1: Dates & Handover Logistics** (Rental dates, pickup/return times, handover method & location/address).
     - **Step 2: ID & KYC Document Verification** (Live selfie with IDs, ID 1 front/back, ID 2 front/back).
     - **Step 3: Personal Details & Downpayment** (Full name, mobile, email, social handle, emergency contact, GCash reference number & receipt proof).
     - **Step 4: Review Agreement & Final Booking Confirmation** (Terms agreement checkbox, complete itemized breakdown, submit booking).

4. **Zero Default Pre-Selections (Force Explicit Choices)**:
   - **Dates**: Default to empty strings (`startDate: ''`, `endDate: ''`) when visiting without URL parameters. Guide customer: *"Tap your desired date on the calendar"*.
   - **Time Slots**: Default to empty strings (`pickupTimeSlot: ''`, `returnTimeSlot: ''`) with `-- Select Pickup Time --` and `-- Select Return Time --` placeholders. Quick-select hour chips remain unselected until tapped.
   - **Handover Mode**: Default to empty (`handoverMode: ''` or prompt user to click Meetup Hub or Grab Express).
   - **Meetup Hub**: Default to empty (`meetupLocation: ''`) with `-- Select Meetup Hub --`.
   - **Shoot Type**: Default to empty (`shootType: ''`) with `-- Select Shoot Type --`.
   - **ID Types**: Default to empty (`id1Type: ''`, `id2Type: ''`) with `-- Select ID Type --`.
   - **Emergency Contact Relationship**: Remove default `'Family Member'`. Default to empty (`emergencyRelationship: ''`) with `-- Select Relationship --` (Options: Parent, Sibling, Spouse / Partner, Relative, Friend, Colleague).

---

## 2. Technical Modifications

### A. `src/App.tsx`
1. **Initial State Clean-up**:
   - `startDate`: `paramStart || ''`
   - `endDate`: `paramEnd || ''`
   - `handoverMode`: `''` (no default pre-selection)
   - `meetupLocation`: `''`
   - `pickupTimeSlot`: `''`
   - `returnTimeSlot`: `''`
   - `shootType`: `''`
   - `id1Type`: `''`
   - `id2Type`: `''`
   - `emergencyRelationship`: `''`
2. **Inclusive Calendar Day Duration Calculation (`calculateQuote`)**:
   - If `start` and `end` are selected:
     - Parse calendar dates `(y, m, d)`.
     - Calculate inclusive difference: `diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1`.
     - If `start === end`: `diffDays = 1`.
     - If `start` and `end` differ by 1 calendar day (e.g. Nov 3 to Nov 4): `diffDays = 2`.
   - If `start` or `end` is empty: `days = 0`, pricing displays as `--` until dates are chosen.
3. **Step Flow Re-architecture (5 Steps → 4 Steps)**:
   - Update `TOTAL_STEPS = 4`.
   - Step 1: Calendar + Preferred Times + Handover Mode (Meet-up vs Grab Express).
   - Remove redundant summary card from Step 1.
   - Step 2: KYC & Document Uploads.
   - Step 3: Personal Details, Emergency Contact, GCash Downpayment Reference & Receipt.
   - Step 4: Final Confirmation & Review.
4. **Validation Logic (`validateStep1`, `validateStep2`, `validateStep3`)**:
   - Step 1 validator checks:
     - Date selection (start date and end date must be chosen).
     - Pickup time and return time must be chosen.
     - Handover mode must be chosen (if Meetup, location must be selected; if Grab, delivery address must be filled).
   - Step 3 validator checks emergency contact name, number, and relationship selection.
5. **Labels and Copy**:
   - Remove `(24h)` in digital receipt and replace with clean duration text (`1 Day`, `2 Days`, etc.).
   - Replace `8 AM - 12 AM • ₱450/day flat` on Same-Day button with `8:00 AM – 11:00 PM • Single Day Shoot`.

### B. `src/components/UnifiedRentalCalendar.tsx`
1. Update `calculateDaysCount` to inclusive calendar days:
   - If `startDate` and `endDate` are valid: `(e - s) + 1`.
   - Update footer badge text: `${daysCount} ${daysCount === 1 ? 'Day Shoot' : 'Days Total'}`.
2. Support empty initial date state without runtime crashes or NaN.

### C. `src/components/DedicatedBookingPage.tsx`
- Sync with identical 4-step flow and Model B calculation if applicable.

---

## 3. Verification & Testing Plan
1. **Local Build & Typecheck**:
   - Run `npm run build` to verify zero TypeScript or bundler errors.
2. **CDP Automated Verification**:
   - Verify initial state on `/book`: No date pre-selected, no time pre-selected, no emergency contact relationship pre-selected.
   - Verify Model B duration & pricing:
     - Single Day (Nov 3): 1 Day @ ₱450 (Pocket 3) / ₱550 (Canon G7X).
     - 2 Days (Nov 3 to Nov 4): 2 Days @ ₱900 (Pocket 3) / ₱1,100 (Canon G7X).
     - 3 Days (Nov 3 to Nov 5): 3 Days @ ₱1,200 (Pocket 3) / ₱1,500 (Canon G7X).
   - Verify receipt shows duration without `(24h)`.
   - Verify Step 1 contains Handover selection without the redundant summary card.
   - Verify 4-step progression from Step 1 to Step 4 confirmation.
3. **Local Commit**:
   - Stage and commit locally (`git commit`). Strictly local, no `git push`.
