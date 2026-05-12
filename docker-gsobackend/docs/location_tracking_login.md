# Goal Description

The objective is to make location tracking mandatory for users logging into the system. Currently, the system supports tracking login locations, but users can bypass it by turning off their GPS or blocking location permissions in their browser or device settings. This change will enforce location access prior to authentication, rejecting login attempts if location data is unavailable.

## User Review Required

> [!WARNING]  
> **Backend Validation**: Do you want to enforce the location requirement strictly on the **backend API** as well? If we enforce it in the backend, any old mobile apps or test scripts that do not send `latitude` and `longitude` will fail to log in. My current plan adds the check primarily to the frontend and optionally hardens the backend.

> [!IMPORTANT]  
> **Reverse Geocoding (Address)**: The backend `login_locations` table accepts an `address` field. Currently, the implementation plan just sends `latitude` and `longitude`. Do you want the frontend to use a service (like Google Maps Geocoding API or Nominatim) to convert the coordinates into a readable address before logging in?

## Open Questions

1. Should Admin users also be strictly subjected to this rule, or only specific roles (e.g. Head, Staff, Requester, Campus Director) as currently checked in the backend? The frontend will currently block *all* users if they don't provide location.
2. If `track_login_locations` is set to `false` in the backend `system_settings`, should we still force users to turn on GPS in the frontend? 

## Proposed Changes

---

### Frontend

Modify the login page to request geolocation before sending the login API request. 

#### [MODIFY] `docker-gsofrontend/src/pages/LoginScreen/Loginpage.jsx`
- Update `handleSubmit` to first check `navigator.geolocation`.
- If location access is denied (`PERMISSION_DENIED`), display an error: `"Location permission is blocked. Please go to your settings and turn it on."`
- If GPS is turned off (`POSITION_UNAVAILABLE` or `TIMEOUT`), display an error: `"GPS must be turned on to log in. Please enable your GPS and try again."`
- If successful, append `latitude` and `longitude` to the POST body sent to `/login`.

---

### Backend (Optional but Recommended)

Harden the backend to ensure no user can bypass the location tracking via API tools like Postman (if the `track_login_locations` setting is true).

#### [MODIFY] `docker-gsobackend/app/Http/Controllers/UserController.php`
- In the `login` method, check if `track_login_locations` is enabled.
- If enabled, and the user belongs to a tracked role (Roles 2, 3, 4, 5), validate that `latitude` and `longitude` are present in the request. If missing, return a `403` or `422` error stating location is required.

## Verification Plan

### Automated/Manual Tests
- **Test 1: GPS Off / Permission Blocked:** Attempt to log in with browser location permissions blocked. Verify that an error message instructs the user to go to settings.
- **Test 2: GPS Unavailable:** Attempt to log in with location permissions allowed but GPS disabled at the OS level (or simulated). Verify the system asks the user to turn on GPS.
- **Test 3: Successful Login:** Allow location permissions and ensure GPS is on. Log in and verify that the coordinates are passed to the backend and stored in the `login_locations` table.
