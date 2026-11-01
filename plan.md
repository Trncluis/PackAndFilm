# Architecture Plan: Declutter Homepage & Dedicated Navbar Modals

## 1. Objectives & Principles
- **Declutter Text Overload**: Ruthlessly remove redundant text blocks from the main scroll flow. Move dense legal text (8-clause Terms) and full KYC documentation into dedicated, accessible slide-out sheets/modals accessible directly from the navbar and preview cards.
- **Maintain Design Consistency**: Strictly enforce the PackAndFilm pastel neo-brutalist studio design system (`#FAFAF7` paper canvas, `#1A1A2E` 2px solid borders, hard offset shadows, rounded squircle containers, `#EDE8FC` lavender, `#FEF0E7` peach, `#E8F7F1` mint).
- **Zero Regressions & Ponytail Simplicity**: The smallest, cleanest diff that solves the problem. Reuse existing components (`CameraCatalogAvailability`, `UnifiedRentalCalendar`, `AdminDashboard`).
- **Safe Testing**: Test with local headless Chrome CDP. Never submit real customer records, never trigger production Google Apps Script mutations.

---

## 2. Changes to Implement
1. **Fix Terms & Conditions Accordion Dropdown Bug**:
   - In `src/App.tsx`, add `openTermsClause` to the `useMemo` dependency array of `landingPageContent`.
   - Separate state for on-page preview vs dedicated terms modal (`openTermsClause` vs `modalOpenTermsClause`).
   - Fix Step 5 booking modal T&C button by removing it from inside `<label htmlFor="modalTermsCheckbox">` to prevent event cancellation.
   - Raise terms modal z-index to `z-[70]`.

2. **Dedicated Navbar Modals / Sheets for Dense Content**:
   - Add dedicated state for `showKycModal`.
   - In the Navigation Dock:
     - `Camera Fleet` -> smoothly scrolls to `#catalog`.
     - `How to Book` -> smoothly scrolls to `#how`.
     - `Pricing` -> smoothly scrolls to `#pricing`.
     - `Requirements` -> opens the clean dedicated KYC Verification Modal (`setShowKycModal(true)`).
     - `Terms & Conditions` -> opens the clean dedicated Terms Modal (`setShowTermsModal(true)`).
     - `FAQ` -> smoothly scrolls to `#faq`.
     - `Book Now →` -> opens the Booking Modal.

3. **Homepage Streamlining**:
   - On `#terms`: Display a crisp 3-pillar summary card with a prominent "Read All 8 Clauses →" button that opens `showTermsModal`.
   - On `#kyc-requirements`: Keep the 4 visual credential cards, with an instant button to open the full KYC guide.

4. **Verification & Testing**:
   - Run `npm run build` (0 TypeScript / Vite errors).
   - Test headless Chrome CDP interactions:
     - Navbar clicks (Fleet, Requirements modal, Terms modal, Pricing).
     - On-page T&C dropdown click test.
     - Booking Step 5 T&C trigger test.
     - Confirmation of zero external network requests or production mutations.
