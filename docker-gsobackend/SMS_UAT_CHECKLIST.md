# SMS Integration UAT Checklist

This checklist contains exact test cases to verify the Phase 1 backend SMS enhancement (both Dry-Run mode and Live mode), as well as details on how to set up your `.env` values for Semaphore go-live.

## Phase 1: Dry-Run Testing (No Cost)

Before sending real SMS, we must verify that the underlying logic works correctly using dry runs.

### Prerequisites

Update your `.env` in the backend (`docker-gsobackend/.env`):
```env
SMS_ENABLED=true
SMS_DRY_RUN=true
SMS_QUEUE=true
```

Then rebuild/restart your Docker containers so the new queue worker picks up the changes:
```bash
docker-compose down
docker-compose up -d --build
```

### Test Cases

- [x] **Test Case 1: Trigger an Allowed Notification Type**
  - **Action**: In the system, perform an action that triggers one of the `SMS_ALLOWED_TYPES` (e.g., approve or deny a maintenance request).
  - **Expected Result**: 
    - The action completes successfully in the UI/backend.
    - Expo Push Notification still works and is sent to the mobile device.
    - Check the Laravel logs (`storage/logs/laravel.log`). You should see an entry like: 
      `"SMS dry run successful. To: <number>, Message: <text>"`
  
- [x] **Test Case 2: Trigger an Ignored Notification Type**
  - **Action**: Trigger a notification that is **NOT** inside the `SMS_ALLOWED_TYPES` list (e.g., an internal system alert or standard staff notification).
  - **Expected Result**:
    - The action completes successfully.
    - Expo push is sent normally.
    - Check the logs. You should see an entry like:
      `"SMS skipped: Notification type <type> is not in allowed types list"`

- [x] **Test Case 3: Invalid Contact Number**
  - **Action**: Using an account with a missing or highly invalid contact number (e.g., alphabetical characters instead of numbers), try to trigger an allowed notification.
  - **Expected Result**:
    - The backend action still succeeds without crashing.
    - Check the logs. You should see an entry like:
      `"SMS skipped: No valid contact number for user <id>"`

---

## Phase 2: Live PhilSMS Setup (Go-Live)

Once Dry-Run passes all test cases, you can enable live SMS. Ensure your PhilSMS account is ready, topped up with credits, and has an API key.

### Prepare the Go-Live `.env` Values

Update your `.env` in the backend to the following:
```env
SMS_ENABLED=true
SMS_DRY_RUN=false
SMS_QUEUE=true
SMS_PROVIDER=philsms

# Set your actual PhilSMS Token here
PHILSMS_TOKEN=your_real_philsms_api_token_here

# Default is PhilSMS (Globe networks only). Must be registered for Smart.
PHILSMS_SENDER=PhilSMS
```

After updating these values, restart your queue worker to apply the new keys:
```bash
docker-compose restart queue_worker
docker-compose restart backend
```
*(If running locally outside docker: `php artisan queue:restart` or restart the terminal session)*

### Test Cases (Live)

- [x] **Test Case 4: Live SMS Delivery**
  - **Action**: With `SMS_DRY_RUN=false`, approve a maintenance request for a user account that is linked to your personal phone number.
  - **Expected Result**:
    - You receive a real SMS message on your mobile device within ~15-30 seconds.
    - In the logs (`storage/logs/laravel.log`) or `sms_deliveries` database table, you should see a success status.

- [x] **Test Case 5: Verify Sender Name**
  - **Action**: Receive an SMS through the system.
  - **Expected Result**: 
    - The message is sent by the correct Sender ID (default `PhilSMS`).
    - The message is prefixed with `[GS-JS]` correctly (if configured in `SMS_MESSAGE_PREFIX`).
