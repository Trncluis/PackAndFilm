# Implementation Plan: Laminated Bag QR Code Community Media & Customer Review System

## 1. Scope & Core Requirements
- **Strict Git Guardrail**: DO NOT commit or push anything to local git or GitHub. All changes remain unstaged/uncommitted in the local working tree for manual user review and approval.
- **Strict Homepage & Hero Isolation**: The homepage, hero section, equipment catalog, and booking stepper remain 100% untouched.
- **Dedicated QR Landing Experience (`/review` and `/share`)**:
  - Scanning the physical laminated QR code in the camera bag opens a standalone mobile-first page.
  - Gives customers two distinct, clean choices:
    1. **✨ Drop Your Shots (Get Featured)**: Upload photos/clips taken with the rented camera + Instagram handle + repost consent. Stored in Google Drive.
    2. **⭐ Review & Suggestions**: Rate the rental experience (1-5 stars), select highlight tags, and provide feedback/suggestions for website and service improvements.
- **Backend & Google Drive Architecture**:
  - Google Apps Script receives media and creates/resolves a dedicated **`PackAndFilm Community Shots`** folder in Google Drive.
  - Submissions and reviews are recorded in dedicated sheet tabs (`Community_Media` and `Customer_Reviews`) for persistence and tracking.
- **Admin Dashboard Integration**:
  - A new **`📸 Community & Reviews`** tab in `AdminDashboard.tsx`.
  - Moderation view to see uploaded photos, open them in Google Drive, copy customer IG handles with 1 click, and read customer suggestions.

---

## 2. Proposed Changes & Architecture

### A. Routing & Standalone Customer Page (`src/components/DedicatedReviewPage.tsx` & `src/App.tsx`)
1. Create `src/components/DedicatedReviewPage.tsx`:
   - Neo-brutalist mobile-first design matching PackAndFilm tokens (`#1A1A2E`, `#553C9A`, `#FAF5FF`, `#F0FFF4`).
   - Responsive tabs:
     - **Tab 1: Drop Your Shots**:
       - Fields: `socialHandle` (IG handle or name), `cameraId` (camera rented), `files` (up to 5 photo/clip files with client-side preview and size validation), `caption` (optional shoot note), `consent` (repost permission checkbox).
       - Submit handler: base64 encodes files safely and calls Apps Script `submitCommunityMedia`.
       - Success state: celebration message + PackAndFilm Manila thank you card.
     - **Tab 2: Review & Feedback**:
       - Fields: `rating` (1-5 stars), `highlights` (multi-select pills: Pristine Gear, Long Battery, Fast Handover, Easy Booking), `feedbackText` (open feedback for website/gear), `customerName` (optional).
       - Submit handler: calls Apps Script `submitCustomerFeedback`.
       - Success state: thank you confirmation.
2. In `src/App.tsx`:
   - Add `'review'` to `ActiveView` union type.
   - Add route detection for `window.location.pathname === '/review'`, `'/share'`, or hash `#review`, `#/review`, `#share`.
   - Render `<DedicatedReviewPage onNavigate={navigateTo} />` when `activeView === 'review'`.

### B. Google Apps Script Backend (`google-apps-script/Code.gs`)
1. Add Google Drive folder helper:
   - `getOrCreateCommunityFolder_()`: looks up or creates the `PackAndFilm Community Shots` folder in Google Drive.
2. Add public actions in `doPost`:
   - `action === "submitCommunityMedia"`:
     - Extracts files (base64 data + filename + mimeType).
     - Uploads each file into the Drive folder, titled `[YYYY-MM-DD]_[handle]_[filename]`.
     - Records entry in `Community_Media` sheet: timestamp, customer handle, camera rented, file URLs, file IDs, consent boolean, status (`new`).
     - Returns `{ status: "success", count: files.length }`.
   - `action === "submitCustomerFeedback"`:
     - Records entry in `Customer_Reviews` sheet: timestamp, name/handle, star rating, highlights, feedback text, status (`new`).
     - Returns `{ status: "success" }`.
3. Add admin actions in `doPost`:
   - `action === "getCommunityData"`:
     - Authenticated with admin session token.
     - Returns community submissions list and customer reviews list.
   - `action === "updateCommunityStatus"`:
     - Allows admin to mark items as `featured` or `archived`.

### C. Admin Dashboard (`src/components/AdminDashboard.tsx`)
1. Extend `AdminViewMode` type to include `'reviews'`:
   - `'list' | 'calendar' | 'reviews'`
2. Add tab button in the top navigation bar:
   - `📸 Community & Reviews` with count badge.
3. Build the `Community & Reviews` view:
   - Summary metric banner: Photos Uploaded, Google Drive Folder direct link, Average Rating ⭐.
   - Media Gallery section:
     - Cards showing customer handle, camera rented, submission date, thumbnail previews.
     - 1-click **📂 Open in Google Drive** button.
     - 1-click **📋 Copy IG Handle** button.
     - Status badges (`New`, `Featured`).
   - Customer Feedback section:
     - Clean list showing star rating badges, highlighted praise chips, and improvement suggestions.

---

## 3. Verification & Validation Plan
1. **Automated End-to-End Tests**:
   - Run a Puppeteer/CDP script to verify `/review` route loads standalone without homepage content.
   - Verify tab switching between "Drop Shots" and "Review & Feedback".
   - Verify form input validation and error states.
   - Verify Admin Dashboard switcher opens the `📸 Community & Reviews` tab and renders correctly.
2. **TypeScript & Build Verification**:
   - Run `npm run build` to guarantee zero compile errors or broken types.
