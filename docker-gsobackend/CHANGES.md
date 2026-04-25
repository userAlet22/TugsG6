# Backend API Changes & Enhancements

**Date:** March 12, 2026  
**Developer Role:** Backend Developer  

## 1. Enhancement: Variadic Role Middleware
**File Changed:** `app/Http/Middleware/RoleMiddleware.php`

### Description
Upgraded the `RoleMiddleware` to accept multiple role IDs simultaneously instead of just a single role ID. This allows routes to be protected by multiple roles (e.g., `role:1,2` for Admin and Head) while maintaining full backward compatibility with single-role routes (e.g., `role:1`).

### Code Changes
**Method:** `handle()`

**Before:**
```php
public function handle(Request $request, Closure $next, $roleId): Response
{
    // ...
    if ($user->role_id != $roleId) {
        return response()->json(['message' => 'You do not have permission to access this route.'], 403);
    }
    // ...
}
```

**After:**
```php
public function handle(Request $request, Closure $next, ...$roleIds): Response
{
    // ...
    if (!in_array($user->role_id, $roleIds)) {
        return response()->json(['message' => 'You do not have permission to access this route.'], 403);
    }
    // ...
}
```

---

## 2. Bug Fix: Active User Info Endpoint Returning Relationship Objects
**File Changed:** `app/Http/Controllers/UserController.php`

### Description
Fixed a bug in the `/api/users/reqInfo` endpoint (`UserController::getUserDetails`) where the `position_id` and `office_id` fields were returning full Eloquent relationship objects instead of integer IDs. 

This bug caused frontend forms (like the User Request Slip) to auto-fill with object data instead of valid IDs, resulting in validation errors (`The selected requesting personnel is invalid`, etc.) upon form submission.

### Code Changes
**Method:** `getUserDetails()`

**Before:**
```php
'position_id' => $user->position,
'office_id'   => $user->office,
```

**After:**
```php
'position_id' => $user->position_id,
'office_id'   => $user->office_id,
```

---

*Note: The `/addservice` route was temporarily modified during testing but has been fully reverted to its original state (`auth:sanctum` only) to align with original system design intents.*

---

## 3. Enhancement: Login Location Tracking — Added Requester Role
**Date:** April 24, 2026  
**File Changed:** `app/Http/Controllers/UserController.php`

### Description
Extended the login location tracking feature to also capture the geographic coordinates of **Requester** accounts (role_id = 4) upon login.

Previously, only Head (2), Staff (3), and Campus Director (5) login locations were tracked. The Requester role was excluded. Since Requesters are also active system users who submit maintenance requests from various campus locations, their login locations are now included in the Admin's Location Tracker view.

The tracking still respects the global system setting `track_login_locations` — if it is set to `false`, no location data is saved for any role.

### Code Changes
**Method:** `login()` in `UserController`

**Before:**
```php
// Roles: 2=Head, 3=Staff, 5=Campus_Director
if (in_array($user->role_id, [2, 3, 5])) {
```

**After:**
```php
// Roles: 2=Head, 3=Staff, 4=Requester, 5=Campus_Director
if (in_array($user->role_id, [2, 3, 4, 5])) {
```

### Frontend Note
No changes are required on the frontend side for this update. The `GET /api/login-locations` API response format remains **identical** — it still returns the same fields (`id`, `account_name`, `role_id`, `latitude`, `longitude`, `address`, `created_at`). The frontend only needs to be aware that entries with `role_id: 4` (Requester) will now also appear in the location logs, and should ensure any role label/badge rendering handles `role_id = 4` displaying as "Requester".

---
