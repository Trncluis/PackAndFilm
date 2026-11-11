# Implementation Plan: 3-Color Calendar Clarity System (Anti-Confusion UX)

## Problem Statement
Renters currently experience visual confusion on the booking calendars:
1. **Masked Booked Today:** When Today (e.g. Nov 11) is fully booked, the calendar prioritizes the "Today" orange styling over "Booked" styling, showing an active-looking peach button with an orange dot instead of a disabled red strikethrough.
2. **Turnover Days Look Like 100% Free Days:** On same-day return dates (e.g. Nov 12), the 2-hour buffer opens evening hours (10:00 PM – 11:00 PM). The calendar categorizes the day as "available" and shows a standard green dot. Customers expect 8:00 AM full-day availability and get confused when morning hours are blocked upon clicking.

---

## The 3-Color Clarity System

### 1. Visual Specification
* 🟢 **Available (Full Day)**:
  - Clean white cell, `#1A1A2E` text, emerald green dot (`bg-[#38A169]`).
  - Tooltip: `Available for rental (Full day 8:00 AM – 11:00 PM)`.
* 🟠 **Turnover (Late Pickup)**:
  - Soft amber tint (`bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]`).
  - Amber indicator dot (`bg-[#D97706] ring-1 ring-[#B45309]`).
  - Cell label / tooltip: `⚡ Same-day turnaround! Available from [Time] (2h buffer applied)`.
* 🔴 **Reserved / Booked (Including Today)**:
  - Muted red tint (`bg-[#FFF5F5] text-[#C53030] line-through border border-[#FEB2B2]/60`).
  - Red indicator dot (`bg-[#E53E3E]`).
  - Cursor `cursor-not-allowed`, `disabled={true}`.
  - If date is Today: retains small orange border or "Today (Reserved)" label so renters know it is today, but clearly unavailable.

---

## Proposed Changes

### Component 1: `src/components/UnifiedRentalCalendar.tsx`
1. **Reorder Class Priority:**
   - Check `isBooked` **before** plain `isToday`, or style `isToday && isBooked` as distinctly reserved with a crossed-out number and red dot.
2. **Turnover Styling:**
   - Detect `dayInfo.isTurnover` on available days.
   - Render amber styling (`bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#92400E] border-amber-200`) and amber indicator dot.
3. **Updated Legend Bar:**
   - Add clear legend items:
     - 🟢 Available (Full Day)
     - 🟠 Turnover (Late Pickup)
     - 🔴 Reserved
     - 🟧 Today

### Component 2: `src/components/CameraCatalogAvailability.tsx`
1. **7-Day Strip:**
   - If `day.isTurnover`, render amber dot (`bg-[#D97706]`) instead of green.
   - Hover status bar displays: `⚡ [Date]: Available from [Time] (Same-day turnaround)`.
   - If `day.status === 'booked' && isToday`, render red dot with strikethrough text.
2. **Month Calendar Modal:**
   - Align cell rendering and legend with the 3-Color Clarity System.

---

## Verification & Safety Guardrails
1. **Zero Git Commits / Zero Git Pushes**: Strictly keep working tree unstaged.
2. **Build Verification**: Run `npm run build` to confirm 0 compilation errors.
3. **CDP Verification Script**: Test both Canon G7 X and DJI Pocket 3 on:
   - Nov 11 (Today, booked) -> Verify strikethrough + red dot.
   - Nov 12 (Turnover day) -> Verify amber dot + turnover tooltip/badge.
   - Nov 15 (Free day) -> Verify green dot + full day options.
4. **Capture Screenshots**: Verify visually before and after.
