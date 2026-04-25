# SMS Notification System Documentation

The SMS notification system provides a robust, queued process for sending critical updates to system users. This feature operates in parallel with the pre-existing Expo push notification feature. It utilizes the Semaphore provider for routing messages securely to Philippine networks.

---

## 1. System Architecture & Flow

When a notification is triggered in the system via `SystemNotification::create(...)`, the data propagates through the following path:
1. **Model Event:** The creation of the `Notification` model triggers its `sync` hook.
2. **Channel Dispatch:** While Expo push fires normally, an asynchronous jobs is dispatched (`SendSmsNotification::class`) if `SMS_QUEUE=true`.
3. **Filtering:** The `SmsService` assesses if the notification's type is found within `SMS_ALLOWED_TYPES`. If it is not, execution terminates gracefully.
4. **Validation:** The service checks if a valid phone number exists by running the `normalizePhilippineNumber` parser.
5. **Database Logging (Attempt):** An initial `SmsDelivery` record is created in the database with status `pending`.
6. **Execution & Auditing:**
   - **Dry Run:** If `SMS_DRY_RUN=true`, the system aborts execution, changes the database status to `skipped`, and logs safely formatting into `laravel.log`.
   - **Live Run:** If `SMS_DRY_RUN=false`, the system fires an HTTP request out to Semaphore. On success, the `provider_message_id` and `status` (`sent`) are saved directly to the database. If there's an exception, the exact `error_message` is saved with status `failed`.

---

## 2. Environment Variables

The backend must be configured using variables placed directly in your `.env` file. These govern how and when the SMS sends.

```env
# Core Toggles
SMS_ENABLED=false
SMS_PROVIDER=semaphore

# Safety & Mode Configs
# IMPORTANT: Keep DRY_RUN=true during testing so you are not charged credits by Semaphore
SMS_DRY_RUN=true
SMS_QUEUE=true

# Provider Authentication
# Place your real provider credentials here
SMS_SENDER_NAME=
SMS_API_KEY=

# Internal Behaviors
SMS_TIMEOUT_SECONDS=15
SMS_MESSAGE_PREFIX=[GS-JS]
SMS_ALLOWED_TYPES=maintenance_request_approved_by_head,maintenance_request_approved_by_campus_director,maintenance_request_denied,maintenance_request_disapproved,maintenance_request_scheduled,maintenance_request_done,maintenance_request_completely_approved,account_request_rejected
```

---

## 3. Database Schema

### `sms_deliveries` Table
This database holds historical auditing information allowing administrators to verify if an SMS reached the user.
- **`id`**: Primary Key
- **`notification_id`**: Foreign Key tying the message context back to the original SystemNotification. 
- **`user_id`**: Foreign Key referencing the user who received it.
- **`to_number`**: E.164 formatted target phone number (+639...).
- **`provider`**: Which provider executed the HTTP constraint (e.g. `semaphore`).
- **`status`**: The ending state enum (`pending`, `skipped`, `failed`, `sent`).
- **`provider_message_id`**: The remote tracking ID Semaphore gives to check detailed network delivery later. 
- **`error_message`**: Stacktrace output or readable error bounds if the message failed sending or parsing.
- **`sent_at`**: ISO Timestamp of when the message passed through successfully.

---

## 4. API Endpoints for Frontends

Admin visibility is supported out-of-the-box. The frontend (e.g. mobile admin dashboard or web admin portal) can use the following endpoint to poll SMS logs.

### `GET /api/sms-deliveries`
**Description:** Fetches a descending order, paginated list of all SMS delivery attempts.
**Authentication:** Requires Sanctum Bearer Token `auth:sanctum` tied to an administrative role.

**Query Parameters:**
- `limit` (Optional, Default 50) - Items per page. 

**Response Example:**
```json
{
  "current_page": 1,
  "data": [
    {
      "id": 1,
      "notification_id": 45,
      "user_id": 12,
      "to_number": "639171234567",
      "provider": "semaphore",
      "status": "sent",
      "provider_message_id": "SEM-998877",
      "error_message": null,
      "sent_at": "2026-04-17T08:14:00.000000Z",
      "user": {
         "id": 12,
         "first_name": "John",
         "last_name": "Doe",
         "contact_number": "09171234567"
      },
      "notification": {
         "id": 45,
         "type": "maintenance_request_done"
      }
    }
  ],
  "total": 1
}
```

---

## 5. Deployment / Docker Concerns

Because resolving an external HTTP request out to Semaphore blocks the PHP runtime processing time, we explicitly advise using Laravel Queues (`SMS_QUEUE=true`).

A `queue_worker` node has been configured in the native `docker-compose.yml` to automatically listen and dispatch these payloads in the background out-of-band to prevent timeout faults in the user's mobile app.

**Service snippet:**
```yaml
  queue_worker:
    build:
      context: ./docker-gsobackend
      dockerfile: backend.dockerfile
    command: php artisan queue:work --tries=3
```
If a message fails sending, the queue catches the exception and places it back in circulation. Because `--tries=3` is configured, it will retry safely before natively failing and discarding gracefully.
