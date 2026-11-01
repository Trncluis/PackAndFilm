# Customer-Centric Page & Navigation Architecture

## 1. Executive Summary & Customer-First Philosophy
PackAndFilm's rental workflow transitions from an overcrowded single-page modal experience into a clean, modular multi-page application with zero duplicate content, zero data re-entry, and **100% preservation of all existing booking features, fields, and workflows**.

---

## 2. Core Rule: Zero Removal from the Booking System
**All existing booking functionality is preserved in full.** Nothing is cut, omitted, or simplified away:
- **Step 1 (Gear & Dates)**: Camera unit picker (Pocket 3 & G7 X), pickup & return date selection with live availability validation, turnaround buffer checks (24-hour maintenance block), delivery vs. self-pickup mode, and rental duration calculation.
- **Step 2 (Accessories & Add-ons)**: Complete accessory catalog (tripods, extra batteries, wide-angle lenses, SD cards, micro mics) with real-time pricing recalculation.
- **Step 3 (Customer & Renter Details)**: Full customer details (Full Name, Contact Number, Email, Delivery/Pickup Address, Social Media Handle, Notes).
- **Step 4 (Document Upload & KYC Verification)**: All primary & secondary ID upload slots, specimen signature upload, proof of billing / student COR alternative, live WebRTC camera selfie snapshot, and file validation.
- **Step 5 (Agreement & Order Review)**: Complete line-item breakdown (daily rate × days, accessories subtotal, refundable security deposit, delivery fee, grand total), interactive Terms & Conditions agreement checkbox, and quick-access contract review.
- **Step 6 (GCash Payment & Submission)**: GCash QR code display, account number copy button, reference number input, proof of payment receipt upload, submit button, loading state, error handling, and exact Google Apps Script webhook payload dispatch.

---

## 3. Recommended Page Structure
| Route | Page Name | Primary Purpose | Key Content Included | Content Relocated from Homepage |
|---|---|---|---|---|
| `/` | **Homepage / Gear Fleet** | Discover cameras, check daily rates, verify live availability, initiate booking. | Hero banner, DJI Pocket 3 & Canon G7 X showcase cards, inline 7-day availability strip, simplified 3-step rental pass, 6-item FAQ, boutique footer. | Removed 2,000px text dump of full KYC rules and 8 legal clauses. Relocated to dedicated reference pages. |
| `/book` | **Dedicated Checkout Page** | Full, uninterrupted 6-step checkout with persistent state and progress preservation. | **100% of all 6 booking steps intact.** All fields, uploads, WebRTC selfie, accessories, turnaround logic, and GCash payment. | Replaces the cramped mobile popup modal. Eliminates accidental backdrop dismissals and keyboard layout bugs. |
| `/requirements` | **Rental Requirements Guide** | Dedicated reference handbook for identity verification and rental eligibility. | Primary & Secondary ID tiers, Selfie with ID guidelines, Specimen signature verification, Proof of billing & Student COR alternatives, Privacy & data handling pledge. | Dedicated standalone page, plus accessible within `/book` via contextual slide-over sheets without leaving checkout. |
| `/terms` | **Terms & Conditions** | Legally binding equipment rental agreement. | All 8 official clauses: Rental Period & Turnaround Buffer, Care & Liability, Security Deposit & Refund, Extension & Late Returns, Cancellation, Inspection & Handover, Breach & Default, Governing Law. | Clean editorial document with readable layout and print action. |
| `/admin` | **Admin Management Console** | Internal operations and equipment management. | Live fleet calendar, booking approvals, Google Sheets synchronization, status toggles. | Preserved behind authentication badge. |

---

## 4. How Customers Navigate
1. **Header Navigation**:
   - Desktop: Sleek pill navigation bar (`Cameras`, `How It Works`, `Requirements`, `Terms`, `Book Now` CTA).
   - Mobile: Responsive hamburger drawer with tactile touch targets (min 48px height) and quick-action booking button.
2. **Contextual In-Page Triggers**:
   - Homepage camera card: Clicking *"Rent Pocket 3"* or *"Rent G7 X"* immediately opens `/book` with that camera already pre-selected.
   - Live availability strip: Tapping any date on the 7-day strip opens `/book` with that specific date pre-populated.
   - Footer & FAQ: Direct contextual links to `/requirements`, `/terms`, and `/book`.
3. **Browser Native Support**:
   - Zero-dependency routing using `window.history.pushState` and `window.addEventListener('popstate')`.
   - Browser Back / Forward buttons work naturally without losing form inputs.

---

## 5. Seamless Data Carry-Over (Zero Repeated Entry)
- Clicking *"Rent This Unit"* on the homepage passes `selectedCameraId` and optional pre-selected dates into top-level state and URL parameters (`/book?camera=pocket-3&start=2026-11-05`).
- The `/book` checkout page reads these pre-selected values on mount. The customer never has to re-pick their camera or re-select their dates.
- Form inputs in `/book` are backed by persistent component state and session storage fallback, so browsing away or toggling a reference sheet preserves 100% of uploaded files and typed information.

---

## 6. Mobile vs. Desktop Experience
- **Mobile Viewport (< 768px)**:
  - Single-column linear layout.
  - Sticky bottom action dock (`[ ← Back ]` and `[ Continue → ]`) always visible above mobile browser navigation.
  - Form inputs formatted with minimum 16px font size to prevent mobile Safari auto-zoom.
  - Direct camera capture support for ID uploads via mobile device camera.
  - Bottom sheet overlays for quick requirement lookups instead of fullscreen disruptive navigation.
- **Desktop Viewport (>= 768px)**:
  - 2-column checkout interface: Left side houses the active step form controls; Right side features a sticky live digital receipt detailing daily rate, turnaround buffer, refundable deposit, and live total.
  - Interactive calendar with hover states and dual-month preview.

---

## 7. Interaction Allocation Matrix
| Interaction / Component | Format | Rationale |
|---|---|---|
| Complete 6-step rental booking | **Dedicated Page (`/book`)** | Multi-step form with 7 file uploads and GCash verification needs full screen focus and keyboard space. |
| Full 8-clause rental contract | **Dedicated Page (`/terms`)** | High legal importance, requires comfortable reading length and printability. |
| Identity verification handbook | **Dedicated Page (`/requirements`)** | Searchable reference guide for prospective renters checking ID eligibility. |
| Live 7-day equipment availability | **Inline Component** | Immediate scannability directly on camera showroom cards on Homepage. |
| Package / Kit inclusions inspector | **Lightweight Modal** | Quick 1-click inspection of included cables, chargers, and SD cards without leaving page. |
| WebRTC desktop camera capture | **Lightweight Modal** | Isolated viewfinder modal for taking real-time selfie verification. |
| In-checkout requirement check | **Slide-Over Sheet / Drawer** | Allows renter in Step 4 of `/book` to check acceptable IDs without leaving the booking funnel. |

---

## 8. Implementation & Verification Safeguards
1. **Safe Testing**: All functional verification will use test fixture mocks. Zero live bookings, zero customer notifications, and zero external Google Apps Script webhook writes.
2. **Design System Adherence**: Retain pastel neo-brutalist styling (`#FAFAF7` background, `#EDE8FC` lavender, `#FEF0E7` peach, `#E8F7F1` mint, `#1A1A2E` 2px solid dark borders, hard offset shadows, rounded squircle corners).
3. **Quality Gates**: Zero TypeScript build errors (`npm run build`), headless Chrome CDP verification across mobile (375x812) and desktop (1280x800) viewports.
