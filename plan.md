# PackAndFilm: Calendar UI & Responsive Design Refinement Implementation Plan (Revised)

## 1. Confirmed Root Causes & Architecture Review

### A. Rectangular Calendar Cells
- **Mechanism**: In `src/components/CameraCatalogAvailability.tsx` (Line 466), `src/components/UnifiedRentalCalendar.tsx` (Line 277), and `src/components/CustomDatePicker.tsx` (Line 402), calendar date cells utilize fixed height utility classes (`h-11 sm:h-12` and `h-9`) inside a 7-column CSS grid (`grid-cols-7`).
- **Defect**: When the calendar container stretches to match desktop or modal container widths (500px–750px), the columns expand horizontally to 70px–100px while remaining clamped to 36px–48px tall, producing wide, flat rectangles rather than balanced squares.
- **Flawed Prior Proposal**: Adding `min-h-[38px] sm:min-h-[44px]` alongside `aspect-square` caused cells on narrow mobile viewports (<350px) to become tall rectangles whenever the calculated column width dropped below 38px.

### B. Fleet Showroom Card Cramping (User Uploaded Images 2–5)
- **Mechanism**: In `src/App.tsx` (Line 2267), the catalog grid is declared as `grid grid-cols-1 md:grid-cols-3 gap-6`.
- **Defect**: Tailwind's `md` breakpoint fires at 768px. At viewports between 768px and 1023px (tablets in portrait, split-screen browsers, narrow desktop windows), each camera card is squeezed into ~218px total width (170px inner width for the 7-day strip).
- **Consequences**:
  1. The 7-day availability strip header (`Live 7-Day Availability` + `Full Month >` button) exceeds 170px, causing the neo-brutalist pill to overflow past the card border.
  2. The 7 day buttons (`TODAY`, `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`) are compressed into ~24px slots. Labels like `TODAY` and `WED` collide and visually overlap adjacent columns.

### C. Horizontal Overflow Causes
- **Mechanism**: In the hero section (`src/App.tsx`), decorative ambient glow divs (`w-[700px]` centered via `left-1/2 -translate-x-1/2`) lack localized clipping containers.
- **Defect**: On viewports narrower than 700px, the uncontained decorative elements extend past the viewport boundary, causing unintended horizontal document scrolling.

---

## 2. Corrected Responsive Calendar Implementation (Square Cells)

Apply consistent, proportion-safe CSS across all three calendar components:

### A. Mathematical Square Proportions
- Visual cells use `aspect-square w-full` with **zero `min-h` or `max-h` constraints**. The column width strictly governs the cell height (width === height 1:1 at all screen sizes).
- Gaps between cells adjust responsively:
  - Mobile (<640px): `gap-1`
  - Tablet/Desktop (≥640px): `gap-1.5 sm:gap-2`
- Cell internal layout uses flexbox centering (`flex flex-col items-center justify-center p-0.5 sm:p-1`).
- Date numbers use optical centering (`text-xs sm:text-sm font-black leading-none`).
- Status indicators (dots for available, booked, selected) use micro-dot positioning (`h-1.5 flex items-center justify-center mt-1`) that never shifts the vertical baseline of the date number.

### B. Container Centering & Width Guardrails
- Rather than allowing the 7-column calendar grid to stretch infinitely across wide desktop modals, wrap calendar containers in a centered width constraint:
  - Month Calendar Modal: `max-w-sm sm:max-w-md mx-auto`
  - Unified Rental Calendar (Step 1): `max-w-lg mx-auto`
- This ensures desktop cells remain comfortably sized (~44px–52px square) with zero excessive whitespace.

### C. Touch Target Accessibility vs. Visual Square
- Buttons use `w-full aspect-square` within the grid columns.
- At 360px viewport width with `gap-1` inside a padded container, column width provides a comfortable ~38px × 38px tap target, scaling to 44px–52px on tablet/desktop.
- Zero overflow clipping on interactive focus rings: outline states use `focus-visible:ring-2 focus-visible:ring-[#1A1A2E] focus-visible:ring-offset-2`.

---

## 3. Reassessed Catalog Breakpoint Strategy

### Container Geometry & Card Width Requirements
- Section padding: `px-4 sm:px-8` (32px mobile, 64px desktop).
- Container: `max-w-7xl mx-auto`.
- Minimum comfortable card width for full 7-day strip + kit inclusions without text cramping: **~300px**.

### Recommended Breakpoints
Replace `grid-cols-1 md:grid-cols-3` with:
```html
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
```

| Viewport Range | Columns | Card Width Range | Visual & Content Behavior |
|---|---|---|---|
| **< 768px (Mobile)** | **1** | 288px – 704px | Spacious single-card vertical flow; perfectly readable. |
| **768px – 1199px (Tablet & Compact Desktop)** | **2** | 336px – 536px | Roomy two-column layout; eliminates 220px card crushing completely. |
| **≥ 1200px (Standard & Large Desktop)** | **3** | 352px – 400px | High-density 3-card lineup with comfortable margins and zero overflow. |

*(Note: If 3 cards are present, the 2-column layout displays the two active cameras side-by-side on Row 1, and the "Coming Soon" Kodak FZ55 cleanly on Row 2).*

---

## 4. Robust 7-Day Availability Strip Architecture

### A. Two-Letter Weekday Abbreviation System
- Adopt uniform two-letter uppercase abbreviations for all 7 days:
  `['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']`
- Each two-letter label occupies exactly ~14px–16px of text width, guaranteeing comfortable centering inside 28px+ column cells with zero adjacent collision.

### B. "Today" Representation
- **Visible Label**: Render `'TD'` on compact viewports and `'TODAY'` on spacious viewports via responsive utilities:
  - `<span className="sm:hidden">TD</span><span className="hidden sm:inline">TODAY</span>`
- **Accessible Description**: `aria-label={`Today, ${day.dayName} ${day.dayNum}`}` ensures screen readers announce full context.
- **Visual Distinction**: Distinct peach background (`bg-[#FEF0E7] text-[#C05621] border-2 border-[#1A1A2E]`) ensures instant recognition regardless of text length.

### C. Strip Header Constraints
- Header container: `flex items-center justify-between gap-2 min-w-0`
- Title container: `flex items-center gap-1.5 min-w-0` with title text `truncate text-[10px] sm:text-[11px]`
- `Full Month` button: `shrink-0 whitespace-nowrap text-[10px] px-2 py-0.5 sm:px-2.5 sm:py-1`
- Prevents the button from wrapping or extending outside the border under any card dimension.

---

## 5. Refined Horizontal Overflow Handling (Non-Destructive)

- **Rule**: Do **NOT** place `overflow-hidden` on parent sections (`#catalog`, `#hero`, modal body) because doing so clips neo-brutalist box shadows (`shadow-[6px_6px_0px_#1A1A2E]`), dropdown options, and focus outlines.
- **Solution**: Isolate decorative background shapes into their own zero-pointer-event containers:
  ```html
  {/* Isolated Decorative Background Layer */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10" aria-hidden="true">
    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] ... max-w-full" />
  </div>
  ```
- Interactive modals, dropdowns, and cards retain their full box shadows and interactive popovers without clipping.

---

## 6. Comprehensive Functional Regression Test Coverage

In addition to visual checks, the test suite (`scratch/test_calendar_regression.cjs`) will programmatically verify:

1. **Full-Day Reservation Buffer**: Confirms overlapping date intervals are strictly blocked.
2. **Month Boundary Crossing**: Verifies multi-day bookings spanning month ends (e.g. October 30 to November 2, or February 28 to March 2) compute correct durations and render continuous highlights.
3. **UTC+8 Manila Date Normalization**: Confirms that bookings created late in the evening (e.g., 11:30 PM Manila time) do not roll into the wrong UTC day.
4. **Month Navigation**: Verifies `handlePrevMonth` and `handleNextMonth` smoothly navigate through past, current, and future months with correct weekday offset calculation.
5. **Multi-Unit Inventory (Canon G7 X 2-Unit Capacity)**:
   - Scenario 1: 0 units booked -> Available.
   - Scenario 2: 1 unit booked -> Available (2nd unit open).
   - Scenario 3: 2 units booked -> Booked (Capacity reached).
   - Scenario 4: DJI Pocket 3 capacity = 1 strictness preserved.
6. **Model B Financial Ledger Calculations**:
   - Meetup fee (₱200 for Meetup, ₱0 for Grab Express).
   - Tiered durations (1–2d, 3–5d, 6+d).
   - Downpayment (₱300) and balance due.
7. **Viewport Resize Invariance**: Verifies cell aspect ratio remains 1.0 (width === height ±0.5px) during live window resizing from 320px to 1920px.

---

## 7. Skills Verification & Application

| Skill | Availability | Planned Application |
|---|---|---|
| **Ponytail** | Available (`.agents/skills/ponytail/SKILL.md`) | Minimalist diffs, zero unnecessary abstractions, lazy senior dev focus on the exact CSS attributes needed. |
| **Superpowers** | Available (`.agents/skills/using-superpowers/SKILL.md`) | Systematic verification, test-first validation, and evidence before assertions. |
| **shadcn** | Available (`.agents/skills/shadcn/SKILL.md`) | Clean component tokens, optical alignment, accessible keyboard states, and cohesive neo-brutalist styling. |
| **UI UX Pro Max** | Available (`.agents/skills/ui-ux-pro-max/SKILL.md`) | Responsive grid mathematics, typography scaling, touch target ergonomics, and color contrast. |

---

## 8. Files Expected to be Modified

1. [`src/components/CameraCatalogAvailability.tsx`](file:///c:/Users/superuser/Desktop/Webs/PackAndFilm/src/components/CameraCatalogAvailability.tsx):
   - Square cells in Month Modal (`aspect-square w-full`, centered container).
   - Two-letter weekday abbreviations (`['SU', 'MO', ...]`) and `TD`/`TODAY` responsive labels.
   - Robust `shrink-0` header and equal-width columns.
2. [`src/components/UnifiedRentalCalendar.tsx`](file:///c:/Users/superuser/Desktop/Webs/PackAndFilm/src/components/UnifiedRentalCalendar.tsx):
   - Square cells (`aspect-square w-full`).
   - Aligned weekday column grid gaps.
3. [`src/components/CustomDatePicker.tsx`](file:///c:/Users/superuser/Desktop/Webs/PackAndFilm/src/components/CustomDatePicker.tsx):
   - Square cells (`aspect-square w-full`).
4. [`src/App.tsx`](file:///c:/Users/superuser/Desktop/Webs/PackAndFilm/src/App.tsx):
   - Responsive catalog grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6`.
   - Isolated overflow wrapper for decorative hero glows.
5. [`plan.md`](file:///c:/Users/superuser/Desktop/Webs/PackAndFilm/plan.md):
   - Updated source of truth for planning approval.
