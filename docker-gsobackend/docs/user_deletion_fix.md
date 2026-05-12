# User Account Deletion Fix

**Date:** 2026-05-02  
**Type:** Bug Fix  
**Area:** User Management (Admin)

---

## Problem

When the System Admin attempted to delete a user account from the User Management screen, the app displayed the error:

> `The route api/users/12 could not be found.`

The frontend was correctly sending a `DELETE /api/users/{id}` request, but the Laravel backend had no matching route or controller method implemented.

---

## Root Cause

- `routes/api.php` had no `DELETE /users/{id}` route defined.
- `UserController.php` had no `destroy()` method.

---

## Solution: Soft Delete

Implemented **Soft Delete** instead of a hard delete to preserve historical data integrity. Since maintenance requests are linked to users via a foreign key (`requesting_personnel`), a hard delete would have cascaded and permanently wiped all maintenance records submitted by the deleted user.

Soft Delete sets a `deleted_at` timestamp on the user row. Laravel automatically excludes soft-deleted users from all queries, meaning:
- Deleted users no longer appear in the Users List.
- Deleted users cannot log in.
- Their historical maintenance request records remain intact in the database.

---

## Files Changed

| File | Change |
|---|---|
| `database/migrations/2026_05_02_000001_add_soft_deletes_to_users_table.php` | New migration — adds `deleted_at` column to `users` table |
| `app/Models/User.php` | Added `SoftDeletes` trait |
| `routes/api.php` | Added `Route::delete('/users/{id}', ...)` inside admin sanctum group |
| `app/Http/Controllers/UserController.php` | Added `destroy($id)` method |

---

## Safeguards in the destroy() Method

- Only **Admins (role_id = 1)** can call this endpoint (returns `403` otherwise).
- Returns `404` if the user ID does not exist.
- Prevents an admin from **deleting their own account** (returns `422`).

---

## Verification

Tested on the mobile app. Deleting "Director mc" (user ID 12) no longer throws the route error. The user is removed from the list and their maintenance request records are preserved.
