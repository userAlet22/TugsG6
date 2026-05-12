# SMS & System Notification Improvements

## Overview
To improve the usability of notifications for the recipients (end-users/requesters), the system's notification messages generated in the backend have been enhanced. Previously, notifications provided generic status updates (e.g., "Your maintenance request has been verified by staff.").

Now, these messages inject specific details to create an informative, actionable notification that makes tracking and auditing easier for users.

## Key Improvements
1. **Reference Numbers (`Ref: #ID`)**: The primary key (`id`) of the `MaintenanceRequest` is now explicitly stated in every notification. This serves as the reference/ticket number.
2. **Action Author Accountability**: Instead of general terms like "staff" or "head", the actual name (and role) of the authenticated user performing the action is injected into the text (e.g., "Staff John Doe", "Campus Director Jane Smith").
3. **Dynamic Priority Numbers**: When a priority number is assigned, the actual priority number (e.g., `P-2026-5-1`) is included directly in the SMS so the user knows exactly where they stand without logging into the app.

## Implementation Details

All changes are localized to the `App\Http\Controllers\MaintenanceRequestController` inside the `SystemNotification::create([...])` blocks. 

Because `App\Services\Sms\SmsService` directly accesses the `$notification->message` property, the changes made to the `SystemNotification` model directly reflect in the outbound SMS notifications.

### Example Modifications

**Staff Verification:**
*Old:* `Your maintenance request has been verified by staff.`
*New:* `Your maintenance request (Ref: #102) has been verified by Staff Jane Doe.`

**GSO Head Approval:**
*Old:* `Your maintenance request has been approved by the head of GSO.`
*New:* `Your maintenance request (Ref: #102) has been approved by GSO Head John Smith.`

**Assigning Priority:**
*Old:* `Your request completed the approval process and has a priority number now!, please wait for the service.`
*New:* `Your request (Ref: #102) completed the approval process and has a priority number (E-26-5-1) now! Please wait for the service.`

## Character Limits
The `SmsService` enforces a `480` character limit using `mb_strimwidth($text, 0, 480, '...')`. The updated messages are designed to be concise and will easily fit within this limit, ensuring they are not cut off unexpectedly by the SMS provider (Semaphore, Twilio, PhilSms).
