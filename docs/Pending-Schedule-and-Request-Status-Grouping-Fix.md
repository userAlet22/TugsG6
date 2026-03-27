# Pending Schedule and Request Status Grouping Fix

**Date:** March 25, 2026

## 1. Request Status Grouping Fix
**Affected Files:**
- `src/pages/Staff/StaffSlipRequests.jsx`
- `src/pages/Head/HeadRequests.jsx`
- `src/pages/CampusDirector/CampusDirectorRequests.jsx`

**Issue:** 
When users across non-administrative roles navigated between maintenance request status tabs (e.g., Disapproved, Urgent, Onhold, Completed, Done, Canceled), requests were disappearing. This happened because the frontend `Array.filter` logic was too restrictive, improperly enforcing signature checks (`verified_by`, `approved_by_1`) on finalized or historical states.

**Resolution:**
Rewrote the filtering structure fundamentally for all role-view tables:
- Retained the strict signature checks strictly for the active **"Pending"** workflow (where sequential approvals actually matter).
- Updated all other tabs to rely purely on direct status matching (`r.status.toLowerCase() === selectedTab.toLowerCase()`).
- This ensures items maintain their historical visibility regardless of who approved or disapproved them previously.

---

## 2. Pending Schedules List Enhancement
**Affected Files:**
- `src/pages/Schedules/SchedulePage.jsx`

**Feature Addition:**
Added a clean, sequential list view for easy access to upcoming schedule events on the calendar dashboard, eliminating the need to click through month-by-month grids.

**Implementation Details:**
- **Navigation Toggle:** Added a "View Pending / View Calendar" button in the upper right header section of the Schedules Page.
- **Data Filtering:** Extracted a `pendingSchedules` subset natively from the API response payload by filtering for events where the `date` is strictly equal to or greater than the current local date.
- **Conditional UI Rendering:** When the list view is toggled, the typical matrix calendar table unmounts and is replaced by a minimal list outlining the Date and Event Title.
- **Workflow Continuity:** Integrated the new list rows directly into the existing React State hooks. Clicking an item triggers the exact same detailed event modal behavior as clicking an event chip on the standard calendar grid.
- **Universal Effect:** Because `SchedulePage.jsx` is wrapped dynamically by role-specific components (e.g., `HeadSchedules.jsx`), this enhancement instantly deployed to all app users simultaneously.

---

## 3. Semantic Status Styling Fix
**Affected Files:**
- `src/pages/Staff/StaffSlipRequests.jsx`
- `src/pages/Head/HeadRequests.jsx`
- `src/pages/CampusDirector/CampusDirectorRequests.jsx`
- `src/pages/Admin/Requests.jsx`

**Issue:**
After exposing additional request status tabs (like Done, Canceled, Completed, Onhold, etc.) through the previous Array.filter fix, the active tab buttons and the table status badges were incorrectly defaulting to a `bg-red-500` fallback styling if the status was anything other than "Pending", "Verified", or "Approved". This caused positive historical statuses like "Done" and "Completed" to appear in red.

**Resolution:**
- Implemented a standard semantic styling helper function (`getStatusColor`) within the request pages to determine appropriate background and text colors based on the status name.
- Colors are now mapped semantically:
  - **Pending / Verified:** Yellow
  - **Approved / Completed / Done:** Green
  - **Urgent / Onhold / On hold:** Orange
  - **Disapproved / Rejected / Canceled:** Red
  - Everything else: Gray
- Cleanly dynamicized both the Tab layout generation and the Data Table Badge layout across all relevant user roles (Staff, Head, Campus Director, Admin) ensuring uniform UI styling regardless of account privileges.
