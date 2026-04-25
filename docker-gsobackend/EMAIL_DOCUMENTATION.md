# Email Notification System Documentation

The email notification system provides automated email delivery for critical system events to users and administrators. This feature operates in parallel with the existing Expo push notification and SMS notification systems. It utilizes Gmail SMTP (via a dedicated system Gmail account) for sending structured HTML emails.

---

## 1. System Architecture & Flow

The email system operates on two distinct tracks depending on the trigger:

### Track A — System Notification Emails (Queued)
When a `SystemNotification` record is created via `SystemNotification::create(...)`, the email pipeline is triggered automatically through the `Notification` model's `booted()` hook:

1. **Model Event:** The `Notification` model's `created` hook fires immediately after any `SystemNotification::create(...)` call.
2. **Type Filtering:** The hook checks if the notification's `type` is in the `EMAIL_ALLOWED_TYPES` list. If not, email is skipped silently.
3. **Job Dispatch:** If the type is allowed and `EMAIL_NOTIFICATIONS_QUEUE=true`, a `SendEmailNotification` job is dispatched to the queue.
4. **User Validation:** Inside the job, the user associated with the notification is loaded. If the user has no email, the job exits gracefully with a log warning.
5. **Email Delivery:** `Mail::to($user->email)->send(new SystemNotificationMail($notification))` is executed.
6. **Logging:** Success or failure is recorded in `storage/logs/laravel.log`.

### Track B — Direct Notification Emails (Synchronous)
Certain system events use Laravel's built-in `Illuminate\Notifications\Notification` class and fire **synchronously** during the HTTP request:

| Event | Notification Class | Recipient |
|---|---|---|
| New user registration | `NewUserRegistered` | All Admins and Staffs with an email |
| Account approved by admin | `AccountApproved` | The approved user |

> **⚠️ Important:** Track B emails are synchronous — if SMTP fails, the HTTP request will throw an error. Always ensure `MAIL_PASSWORD` is set correctly.

---

## 2. Files & Architecture

| File | Purpose |
|---|---|
| `app/Models/Notification.php` | Triggers `SendEmailNotification` job via `booted()` hook |
| `app/Jobs/SendEmailNotification.php` | Queued job — loads user, sends mail, logs result |
| `app/Mail/SystemNotificationMail.php` | Mailable class — defines subject and HTML template |
| `resources/views/emails/system_notification.blade.php` | HTML email template rendered for system notifications |
| `app/Notifications/NewUserRegistered.php` | Direct mail notification sent to Admins/Staffs on new registration |
| `app/Notifications/AccountApproved.php` | Direct mail notification sent to a user when their account is approved |
| `config/email_notifications.php` | Config file reading `EMAIL_*` env variables |

---

## 3. Environment Variables

The backend must be configured using the following variables in your `.env` file:

```env
# SMTP Settings (Gmail)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=mitsoftwareacc@gmail.com
MAIL_PASSWORD=your_gmail_app_password_here
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="mitsoftwareacc@gmail.com"
MAIL_FROM_NAME="GSO SYSTEM"

# Email Notification Feature Toggles
EMAIL_NOTIFICATIONS_ENABLED=true
EMAIL_NOTIFICATIONS_QUEUE=true

# Comma-separated list of notification types that trigger an email
EMAIL_ALLOWED_TYPES=maintenance_request_approved_by_head,maintenance_request_approved_by_campus_director,maintenance_request_denied,maintenance_request_disapproved,maintenance_request_scheduled,maintenance_request_done,maintenance_request_completely_approved,account_request_rejected
```

> **⚠️ Gmail App Password Required:** Gmail does not allow regular passwords for SMTP. You must generate a 16-character App Password from your Google Account (Security → 2-Step Verification → App Passwords). Paste it into `MAIL_PASSWORD` without spaces.

---

## 4. Notification Types That Trigger Emails

The following `SystemNotification` types will trigger an email to the associated user when `EMAIL_NOTIFICATIONS_ENABLED=true`:

| Notification Type | Description |
|---|---|
| `maintenance_request_approved_by_head` | Request approved by Head |
| `maintenance_request_approved_by_campus_director` | Request approved by Campus Director |
| `maintenance_request_denied` | Request denied |
| `maintenance_request_disapproved` | Request disapproved |
| `maintenance_request_scheduled` | Request has been scheduled |
| `maintenance_request_done` | Request marked as done/completed |
| `maintenance_request_completely_approved` | Request fully approved through all levels |
| `account_request_rejected` | User's registration account was rejected |

> **Note:** `account_request_created` (new user registration) is handled by Track B (`NewUserRegistered`) and does **not** go through this allowed types list.

---

## 5. Email Template

All system notification emails use a shared HTML template located at:
`resources/views/emails/system_notification.blade.php`

**Template Structure:**
- **Header:** GSO Maintenance System branding with JRMSU blue (`#004a99`)
- **Body:** Personalized greeting using the user's full name, the notification message, and a badge showing the notification type
- **Footer:** Automated disclaimer — "Please do not reply directly to this email."

**Email Subject Format:**
```
GSO System Update: {notification_type_with_spaces}
```
Example: `GSO System Update: Maintenance request approved by head`

---

## 6. Deployment / Docker Concerns

Because sending SMTP emails involves an external network call, all system notification emails (Track A) are dispatched via the Laravel queue to prevent blocking the user's HTTP request.

The `queue_worker` service in `docker-compose.yml` handles email job processing automatically:

```yaml
queue_worker:
  build:
    context: ./docker-gsobackend
    dockerfile: backend.dockerfile
  command: php artisan queue:work --tries=3
```

If an email fails (e.g., SMTP timeout), the queue retries it up to 3 times before marking it as failed. Failures are logged in `storage/logs/laravel.log`.

> **After updating `.env` MAIL settings**, always clear the config cache and restart the queue worker:
> ```bash
> php artisan config:clear
> docker-compose restart queue_worker
> ```

---

## 7. Logging

All email activity is logged to `storage/logs/laravel.log`:

| Event | Log Level | Message |
|---|---|---|
| Email sent successfully | `INFO` | `Email notification sent successfully. { notification_id, user_id, email, type }` |
| Email failed | `ERROR` | `Email notification sending failed. { notification_id, user_id, email, error }` |
| User has no email | `WARNING` | `Email Notification Job: User or email not found. { notification_id, user_id }` |
| Notification not found | `WARNING` | `Email Notification Job: Notification not found. { notification_id }` |
