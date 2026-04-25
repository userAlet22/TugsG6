# SMS Notification System — Implementation & Testing Report

**Project:** GS-JS Mobile Backend (Laravel)
**Report Date:** April 18, 2026
**Author:** Backend Developer (Mobile App)
**Status:** Dry-Run Validated ✅ | Live Provider Pending 🔄

---

## 1. Overview

This report documents the implementation and testing of the SMS Notification feature added to the GS-JS mobile backend. The system was designed to run in parallel with the existing Expo Push Notification channel, sending SMS alerts to users at critical stages of the Maintenance Request workflow.

---

## 2. Implementation Summary

### 2.1 Architecture

The SMS system was built using a **Queue-based, provider-abstracted architecture** with the following key files:

| File | Purpose |
|------|---------|
| `app/Services/Sms/SmsService.php` | Core service: normalization, filtering, dry-run logic, audit logging |
| `app/Services/Sms/Contracts/SmsProvider.php` | Interface contract for all SMS providers |
| `app/Services/Sms/Providers/SemaphoreSmsProvider.php` | Semaphore API integration |
| `app/Services/Sms/Providers/TwilioSmsProvider.php` | Twilio REST API integration (built, not yet live) |
| `app/Jobs/SendSmsNotification.php` | Queued job for async SMS dispatch |
| `app/Models/SmsDelivery.php` | Eloquent model for audit logging |
| `app/Models/Notification.php` | Hook point: dispatches SMS job on `created` event |
| `app/Http/Controllers/SmsDeliveryController.php` | Admin API endpoint for SMS delivery logs |
| `database/migrations/2026_04_17_081009_create_sms_deliveries_table.php` | Migration for audit table |
| `config/sms.php` | Centralized SMS configuration |

### 2.2 Workflow Integration

SMS is automatically triggered by the existing Notification model's `created` event. No changes were required on the **mobile frontend** side — the SMS fires entirely in the backend when the following workflow actions occur:

```
Requester submits → Staff verifies → Head approves → [SMS FIRED ✅]
                                                    → Campus Director approves → [SMS FIRED ✅]
                                                    → Staff denies → [SMS FIRED ✅]
                                                    → Head disapproves → [SMS FIRED ✅]
                                                    → Request scheduled → [SMS FIRED ✅]
                                                    → Request marked done → [SMS FIRED ✅]
```

> **Note:** Submission and Staff Verification do NOT trigger SMS — only critical final-stage events do.

### 2.3 SMS Allowed Types (`.env` Configurable)

```
maintenance_request_approved_by_head
maintenance_request_approved_by_campus_director
maintenance_request_denied
maintenance_request_disapproved
maintenance_request_scheduled
maintenance_request_done
maintenance_request_completely_approved
account_request_rejected
```

### 2.4 Phone Number Normalization

The backend automatically converts Philippine mobile number formats to E.164:
- `09171234567` → `+639171234567` ✅
- `639171234567` → `+639171234567` ✅
- Invalid numbers are skipped and logged with `status: skipped`

### 2.5 Database Audit Table: `sms_deliveries`

Every SMS attempt (successful or not) is logged:

| Column | Description |
|--------|-------------|
| `notification_id` | Links to the source notification |
| `user_id` | Target recipient |
| `to_number` | E.164 formatted number |
| `provider` | `semaphore` or `twilio` |
| `status` | `pending`, `skipped`, `sent`, `failed` |
| `provider_message_id` | Remote tracking ID from provider |
| `error_message` | Exact error if delivery failed |
| `sent_at` | Timestamp of successful send |

### 2.6 Admin API Endpoint

```
GET /api/sms-deliveries
Authorization: Bearer <admin_token>
```
Returns a paginated history of all SMS delivery attempts with related user and notification data.

---

## 3. Environment Configuration

```env
# Core Toggle
SMS_ENABLED=true

# Safety Mode (true = no real SMS sent, no cost)
SMS_DRY_RUN=true

# Async Queue
SMS_QUEUE=true

# Provider Selection
SMS_PROVIDER=semaphore   # or: twilio

# Semaphore Credentials
SMS_API_KEY=
SMS_SENDER_NAME=

# Twilio Credentials (built, pending live test)
TWILIO_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
```

To run the background queue worker:
```bash
php artisan queue:work --tries=3
```

---

## 4. Testing Results

### 4.1 Dry-Run Testing (April 17–18, 2026)

**Setup:** `SMS_ENABLED=true`, `SMS_DRY_RUN=true`, `SMS_QUEUE=true`

**Test Flow:**
1. Created a Maintenance Request as Requester (with real TM number on account)
2. Verified as Staff
3. Approved as Head
4. Approved as Campus Director
5. Scheduled and marked as Done

**Queue Worker Output (successful):**
```
2026-04-17 23:24:18  App\Notifications\MaintenanceRequestCreated ........... DONE
2026-04-17 23:24:18  App\Jobs\SendSmsNotification .......................... DONE
2026-04-17 23:24:18  App\Jobs\SendSmsNotification .......................... DONE
2026-04-17 23:24:18  App\Jobs\SendSmsNotification .......................... DONE
2026-04-17 23:24:18  App\Jobs\SendSmsNotification .......................... DONE
2026-04-17 23:25:24  App\Jobs\SendSmsNotification .......................... DONE
...
```

#### Database Audit Results (`sms_deliveries` table):

| ID | Status | To Number | Result |
|----|--------|-----------|--------|
| 1 | `skipped` | `+639123456789` | Dry run — would have sent ✅ |
| 2 | `skipped` | `+639123456786` | Dry run — would have sent ✅ |
| 3 | `skipped` | `0942121545` | ⚠️ Invalid number (10 digits, User ID 10: Haron Diniay, Campus Director) |
| 4 | `skipped` | `+639785564342` | Dry run — would have sent ✅ |
| 5 | `skipped` | `+639786654543` | Dry run — would have sent ✅ |

**Dry-Run Verdict: PASSED ✅**
- All SMS jobs dispatched and processed correctly
- All valid PH numbers correctly intercepted
- Dry-run mode successfully prevented any real charges
- 1 invalid number detected and logged (`User ID: 10` — needs correction in database)

> **Action Item:** Update `contact_number` for User ID 10 (Haron Diniay, Campus Director) from `0942121545` to a valid 11-digit PH mobile number.

#### Bug Found and Fixed During Dry-Run:
- **Bug:** `$user` variable was referenced in `SmsService.php` before being assigned, causing `FAIL` on some jobs.
- **Fix:** Added `$user = $notification->user;` before `SmsDelivery::create()`.

---

### 4.2 Expo Push Notification Verification

As part of the same test flow, Expo Push Notifications were also verified to be working correctly and in parallel with the SMS system:

| Event | Push Received |
|-------|--------------|
| New request submitted | ✅ Staff notified |
| Staff verified | ✅ Requester notified |
| Head approved | ✅ Requester + Campus Director notified |
| Campus Director approved | ✅ Requester + Staff notified |
| Scheduled & marked done | ✅ Requester notified |

---

### 4.3 Twilio Free Trial Testing (April 18, 2026)

**Objective:** Test live SMS delivery to a real TM number using Twilio's free trial.

**Twilio Account Created:** GS-JSforSMS (Trial: $15.50 USD credit)
**Assigned Twilio Number:** `+12183576363` (US 10DLC)
**Target Number:** `+639700214915` (TM - Globe network)

**Result: FAILED ❌**

**Error:** `21612 — Message cannot be sent with the current combination of 'To' and/or 'From' parameters`

**Root Cause:**
Twilio's free trial assigns **US 10DLC numbers**, which are:
- Restricted to US-to-US messaging only
- Not capable of sending international SMS to Philippine numbers (+63)
- Sending to PH numbers requires a PH-registered Alphanumeric Sender ID or local PH number, both of which require a **paid Twilio plan**

**Conclusion:** Twilio Free Trial is **not viable** for Philippine SMS testing. The `TwilioSmsProvider` has been built and is available in the codebase for future use if the project upgrades to a paid Twilio account.

---

### 4.4 Alternative Provider Research (April 18, 2026)

#### itextmo.com — ❌ Service No Longer Available

During research for a free SMS testing provider, **itextmo.com** was identified as a candidate. Upon visiting the site, it was found that the domain has been **sold and parked** on HugeDomains for $595 USD. The service no longer exists and cannot be used as an SMS provider.

#### PhilSMS (philsms.com) — ✅ Account Created, Requires Top-Up

**Account Created:** Mc Laurence Butuan (`dashboard.philsms.com`)
**Current Plan:** No active subscription

**Key Findings:**
- PhilSMS is a live, PH-native SMS gateway and a valid alternative to Semaphore
- Pricing: **₱0.35/SMS** (cheaper than Semaphore's ₱0.50)
- Supports: Globe, TM, Smart, TNT, Sun, DITO — all PH networks
- **No free trial available** — credits must be purchased before sending any SMS
- **Default Sender ID "PhilSMS" only works for Globe subscribers** (including TM). To reach Smart/TNT users, a custom Sender ID must be registered via `support@philsms.com`
- Minimum top-up required before live testing can proceed

**Status:** ✅ Successfully topped up and integrated. Live tests were successfully conducted on 2026-04-18. Messages were successfully received on a TM mobile number.

#### Semaphore (semaphore.co) — ✅ Account Free, ❌ No Free SMS Credits

Semaphore was the original planned production provider. Signing up is free, but just like PhilSMS, **no free trial SMS credits are provided.** You must top up to send real messages.

- **Cost:** ₱0.50/SMS
- **Default Sender ID:** Works on both **Globe and Smart** networks ✅
- **Advantage over PhilSMS:** No Sender ID registration needed for Smart subscribers by default

#### Free PH SMS Provider Research — Conclusion

An internet search was conducted to find a truly free, PH-local SMS testing service. The findings were:

| Provider | Type | Free Trial? | Notes |
|----------|------|------------|-------|
| **Semaphore** | PH-local | ❌ No | Free signup, credits required |
| **PhilSMS** | PH-local | ❌ No | Free signup, credits required |
| **IPROG SMS** | Claimed PH | ❓ Unverified | Claims daily free SMS limit, but website inaccessible (403 error) |
| **SMS.to** | Global | ✅ Free credits (no CC) | International provider — similar carrier restrictions to Twilio for PH |
| **EasySendSMS** | Global | ✅ Free credits on signup | International provider — not PH-native, carrier issues possible |
| **itextmo.com** | Was PH | ❌ Defunct | Domain sold, service no longer exists |

**Conclusion: There is NO reliable, truly free PH-native SMS testing provider.** All legitimate Philippine SMS gateways (Semaphore, PhilSMS) require purchasing credits before any messages can be sent. Global providers (SMS.to, EasySendSMS) may offer free credits but risk the same carrier routing issues experienced with Twilio's US numbers.

**Decision:** Proceed with a small top-up on **PhilSMS** (cheapest at ₱0.35/SMS) for live testing, then switch to **Semaphore** for production if the wider Smart/TNT subscriber reach is needed without Sender ID registration.

---

## 5. Frontend Integration Testing

Although the SMS system does not require any mobile frontend changes to function, the testing process involved using the mobile app to trigger the backend workflow. The following frontend-related observations were made during testing.

### 5.1 Frontend Bug: `request_id` vs `id` Field Mismatch

**Discovered:** April 18, 2026 during Staff verification step of the test flow.

**Symptom:** When the Staff role tapped a Maintenance Request card from the list to view details, the app crashed with:
```
No query results for model [App\Models\MaintenanceRequest] undefined
Request ID: #undefined
```

**Root Cause (Backend Analysis):**
The backend list endpoint (`GET /api/maintenance-requests/list-with-details`) returns the ID field as **`request_id`**, not `id`. The mobile frontend was accessing `item.id` (which resolves to JavaScript `undefined`) instead of `item.request_id`. This caused the navigation to send literally `undefined` to the detail route (e.g., `GET /api/staffpov/undefined`), which the backend correctly rejected with a 404.

**Backend Status:** ✅ No backend changes required. Backend is returning correct data.

**Frontend Fix Required:** Update the navigation/list screen to use `item.request_id` instead of `item.id` when navigating to the Request Details screen.

**Status:** 🔄 Fix sent to mobile frontend developer — pending confirmation.

### 5.2 Expo Push Notifications — Verified Working ✅

Despite the navigation bug above, Expo Push Notifications were confirmed to be working correctly throughout the entire workflow on the **Staff role device**:

| Event | Notification Received |
|-------|-----------------------|
| New request submitted | ✅ "A new maintenance request was submitted by Request, System" |
| Staff verified | ✅ "Your maintenance request has been verified by staff." |
| Head approved | ✅ "Your maintenance request has been approved by the head of GSO." |
| Head approved (CD copy) | ✅ "A maintenance request was approved by the head GSO" |
| Campus Director approved | ✅ "Your maintenance request has been approved by the campus director" |
| Campus Director approved (Staff copy) | ✅ "A maintenance request was approved by the campus director, please view and assign a priority number" |
| Priority assigned + scheduled + done | ✅ "Your request completed the approval process and has a priority number now!" |
| Scheduled & marked done | ✅ "Your maintenance request has been scheduled and immediately marked as done." |

This confirms that the Notification model's `created` hook is firing correctly, meaning the SMS dispatch path is also being correctly reached — the only blocker for live SMS is the live provider credential.

---

## 6. Identified Issues

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | User ID 10 (Haron Diniay) has invalid 10-digit contact number `0942121545` | Medium | ⚠️ Needs fix |
| 2 | Frontend: `request_id` vs `id` field mismatch causing `undefined` in navigation | High | 🔄 Frontend fix pending |
| 3 | Twilio free trial cannot send to PH numbers | Low | ✅ Known, switching to PhilSMS |
| 4 | itextmo.com is defunct — domain parked for sale | Low | ✅ Known, removed from options |
| 5 | PhilSMS has no free trial — requires credit top-up before live testing | Low | ✅ Resolved (1 peso topped up, live tested) |

---

## 7. Next Steps

- [x] Sign up for **PhilSMS** (philsms.com) — account created
- [x] Top up PhilSMS credits (minimum amount for testing)
- [x] Retrieve PhilSMS API key from Developers section
- [x] Build `PhilSmsProvider` in the backend
- [x] Update `.env` with PhilSMS API key and set `SMS_DRY_RUN=false`, `SMS_PROVIDER=philsms`
- [x] Perform live SMS test to real TM number
- [ ] Fix contact number for User ID 10 (Haron Diniay) — `0942121545` → valid 11-digit number
- [ ] Confirm frontend `request_id` fix from mobile developer
- [ ] Run complete end-to-end live SMS UAT with PhilSMS

---

## 8. Provider Comparison Summary

| Provider | PH Networks | Free Trial | Cost/SMS | Status |
|----------|------------|------------|----------|---------|
| **Semaphore** | Globe, Smart, TM, TNT, Sun | ❌ No | ₱0.50 | Primary target (production) |
| **PhilSMS** | Globe, Smart, TM, TNT, Sun, DITO | ❌ No — requires credit top-up | ₱0.35 | Account created, pending top-up |
| **Twilio** | US only (trial) / PH (paid) | ✅ $15.50 USD (US only) | ~₱3-5 | Built-in provider, not viable for PH free trial |
| **itextmo.com** | N/A | N/A | N/A | ❌ Domain sold — service defunct |
