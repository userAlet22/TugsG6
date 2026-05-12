# SMS & In-App Notification Message Improvements

**Date:** 2026-05-02  
**Type:** Enhancement  
**Area:** `MaintenanceRequestController.php` — All `SystemNotification::create` messages

---

## Problem

The existing notification messages sent to users (via in-app and SMS) were missing critical context:

1. **No maintenance type** — Receiver had no way of knowing what kind of repair the request was for.
2. **Broken actor name** — Actor names were concatenated inconsistently. Some used only `last_name`, others used `last_name . ', ' . first_name`. This produced output like `"GSO Head System Head"` when a test account happened to have role-like words as their name. Root cause: test account had `first_name = "System"` and `last_name = "Head"`, combined with the hardcoded `"GSO Head"` prefix in the message string.
3. **No next-step context** — Messages simply stated what happened with no guidance on what comes next.
4. **No priority number** — Even after a priority was assigned, completion messages didn't reference it.

---

## Solution

For every `SystemNotification::create` call in `MaintenanceRequestController.php`, the following was done:

1. **Lazy-loaded relationships** using `$maintenanceRequest->load(['maintenanceType'])` before each notification block.
2. **Extracted helper variables** at each notification site:
   ```php
   $typeName  = optional($maintenanceRequest->maintenanceType)->type_name ?? 'Maintenance';
   $actorName = Auth::user()->first_name . ' ' . Auth::user()->last_name;
   ```
3. **Rewrote all 15 message strings** using a consistent new format.
4. **Added conditional priority number** in `assignSchedule()` and `markAsDone()`:
   ```php
   $priorityInfo = $maintenanceRequest->priority_number
       ? ' | Priority No. ' . $maintenanceRequest->priority_number
       : '';
   ```

Since the `Notification` model's `booted()` hook reads the `message` field and dispatches it as SMS automatically, improving the message here improves **both the in-app notification and SMS simultaneously**.

---

## New Message Format

```
[GS-JS] Ref #{id} ({MaintenanceType}{| Priority No. X}): {Action}. {Next step}.
```

---

## Full Message Reference

| Event | Recipient | New Message |
|---|---|---|
| Request submitted | Staff | `[GS-JS] New {type} request (Ref: #{id}) submitted by {name}. Please review and verify.` |
| Staff verifies | Requester | `[GS-JS] Ref #{id} ({type}): Your request has been verified by Staff {name}. It is now forwarded to the GSO Head for approval.` |
| Staff verifies (Head-submitted) | Campus Director | `[GS-JS] Ref #{id} ({type}): A request submitted by a Head has been verified by Staff {name} and is awaiting your approval.` |
| Staff verifies | GSO Head | `[GS-JS] Ref #{id} ({type}): A maintenance request has been verified by Staff {name} and is awaiting your approval.` |
| Head approves | Requester | `[GS-JS] Ref #{id} ({type}): Your request has been approved by GSO Head {name}. It is now forwarded to the Campus Director for final approval.` |
| Head approves | Campus Director | `[GS-JS] Ref #{id} ({type}): Approved by GSO Head {name}. This request is now awaiting your final approval.` |
| Director approves | Requester | `[GS-JS] Ref #{id} ({type}): Your request has been fully approved by Campus Director {name}. Staff will assign a priority number shortly.` |
| Director approves | Staff | `[GS-JS] Ref #{id} ({type}): Fully approved by Campus Director {name}. Please assign a priority number.` |
| Staff denies | Requester | `[GS-JS] Ref #{id} ({type}): Your request was denied by Staff {name}. Please check the app for the reason and contact the GSO office if needed.` |
| Head disapproves | Requester | `[GS-JS] Ref #{id} ({type}): Your request was disapproved by GSO Head {name}. Please check the app for the reason.` |
| Priority assigned | Requester | `[GS-JS] Ref #{id} ({type}): Your request is now fully approved with Priority No. {P-No}. Please wait for the maintenance schedule.` |
| Marked urgent | Requester | `[GS-JS] Ref #{id} ({type}): Your request has been flagged as URGENT by {name}. It will be prioritized immediately.` |
| Marked on hold | Requester | `[GS-JS] Ref #{id} ({type}): Your request has been placed ON HOLD by {name}. Please check the app for the reason.` |
| Scheduled & done | Requester | `[GS-JS] Ref #{id} ({type} \| Priority No. {P-No}): Your request has been completed by Staff {name}. We'd appreciate your feedback in the app.` |
| Marked done | Requester | `[GS-JS] Ref #{id} ({type} \| Priority No. {P-No}): Your request has been completed by Staff {name}. We'd appreciate your feedback in the app.` |

> `| Priority No. {P-No}` only appears when `priority_number` is not null.

---

## Files Changed

| File | Change |
|---|---|
| `app/Http/Controllers/MaintenanceRequestController.php` | All 15 `SystemNotification::create` message strings rewritten |
