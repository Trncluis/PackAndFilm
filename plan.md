# Plan: PackAndFilm Comprehensive Upgrade & Feature Roadmap

## Overview
Consolidated roadmap combining our operational scheduling engine, Orbit-inspired user-friendly booking progression, live camera snapshot verification, and feature additions.

---

## 1. Zero-Regression Baseline (Preserved Unchanged)
- **Visual Brand & Aesthetics**: Pastel lavender, peach, mint, warm cream tones, glassmorphic cards, typography, and badges remain intact.
- **Security & KYC Rigor**: Valid primary ID (front & back), secondary ID (front & back), and handwritten verification slip remain mandatory.
- **Core Rates & Deposits**: ₱300 reservation downpayment, ₱1,000 security deposit, ₱200 meetup fee, and base pricing structures remain untouched.
- **Backend Sync**: Live Google Sheets & Apps Script webhook integration remains 100% synchronized.

---

## 2. Core Scheduling & 2-Hour Fleet Buffer Engine
1. **Operating Hours (8:00 AM – 12:00 AM Midnight Daily)**:
   - Purge all old "8:00 AM – 8:00 PM" labels across config, hero, headers, calculator, cards, FAQ, and terms.
   - Active customer window: **8:00 AM to 12:00 AM (Midnight)**.
   - Quiet/sleep hours: 1:00 AM to 7:59 AM (excluded from all booking dropdowns).
2. **2-Hour Fleet Turnover Buffer (1 Unit per Camera Protection)**:
   - When a booking on a camera ends at time $T_{\text{return}}$ (e.g. 3:00 PM), the unit enters an automatic 2-hour recharge/sanitization window:
     $$T_{\text{ready}} = T_{\text{return}} + 2\text{ hours} = \text{5:00 PM}$$
   - Any same-day booking on that unit cannot pick up before 5:00 PM, with clear notice:  
     *`⚠️ Turnover Buffer: Gear is returned at 3:00 PM and will be 100% recharged & ready for you at 5:00 PM.`*
3. **Orbit-Style Step 1 Toggle**:
   - `[ ☀️ Same-Day Rental (8 AM – 12 AM) ]` vs `[ ✈️ Multi-Day Rental (Overnight / 2+ Days) ]`
   - **Same-Day**: 1 calendar date tapped locks start and end date to the same day; time slots span 8:00 AM – 12:00 AM; billed at standard 1-day rate.
   - **Multi-Day**: 2+ days calendar range with tiered multi-day discounts.

---

## 3. Booking Modal Ergonomics & KYC Streamlining
1. **Built-in Live Camera Snapshot for Selfie & ID Verification**:
   - Add a direct in-modal camera button: `[ 📷 Take Live Photo with ID ]`.
   - **Mobile (iOS & Android)**: Natively opens the device front camera via `capture="user"` for immediate zero-lag snapshot.
   - **Desktop**: Renders an in-modal WebRTC live video viewfinder with a clean shutter button and instant retake/confirm preview.
   - **Anti-Fraud Security**: Eliminates gallery uploads of old, stolen, or AI-generated photos by enforcing real-time physical liveness.
   - **Fallback**: Keeps an "Or choose file from device" link if camera permission is denied.
2. **Emergency Contacts Reduced to 1**:
   - Lessen requirement from 2 emergency contacts down to **1 Primary Emergency Contact** (Name, Phone Number, Relationship, optional social handle). Eliminates 4 redundant input fields in Step 4.
3. **Voucher / Promo Code System**:
   - Add a promo code input box in Step 1/Step 5 (e.g. `PACKANDFILM10`, `EARLYBIRD`, or seasonal codes).
   - Validates code, applies flat or percentage discount to base rental, and displays discount pill on the price breakdown.
4. **Optional Add-Ons Selection**:
   - Introduce paid accessory options (e.g. Extra Battery Handle, Dual Mic Transmitter, Mini Tripod, ND Filters) as optional checkboxes in Step 1 alongside standard kit inclusions.

---

## 4. Camera Listing Calendar Slot View
- Display an interactive or preview calendar badge directly on each camera card in the catalog.
- Color-coded availability indicators (`Available`, `Booked`, `Turnover Pending`) so customers know instant availability before opening the modal.
- *(Waiting on user's screenshots for the exact visual layout preference)*.

---

## 5. Review & Feedback Section
- Creator testimonials showcase on the homepage + a clean modal/form where verified renters can submit ratings, feedback, and gear wishlists.

---

## 6. Copy & Header Adjustments
- Remove or refine: `"starting at just ₱450/day (as low as ₱350/day on extended rentals)"` from the hero subtitle and replace with cleaner creator-focused headline copy.
