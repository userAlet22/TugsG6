# API Fetch Bug Resolution (March 14, 2026)

## Issue
Users encountered a React fetch error during the login process:
`SyntaxError: Unexpected token '<', "<html>"... is not valid JSON`

## Cause
The issue was traced to the frontend environment configuration for Vite. In `docker-gsofrontend/.env`, the `VITE_API_BASE_URL` was incorrectly pointing to `http://100.74.28.17:8000`.

When the React frontend attempted to contact this incorrect endpoint during the `POST /login` request, it received a default 404 HTML error page instead of the expected JSON response from the Laravel backend. The `response.json()` parser then failed, causing the frontend to crash.

## Resolution
1. **Restored Environment Variable:** The `VITE_API_BASE_URL` in `docker-gsofrontend/.env` was reverted to its correct local Docker development route:
   ```env
   VITE_API_BASE_URL=http://localhost:9000/api
   ```
2. **Container Restart:** The `gso_frontend` Docker container was restarted to successfully load the new `.env` configuration.
   ```bash
   docker compose restart frontend
   ```

## Verification
- An automated browser test was performed confirming that the `admin123` credentials correctly authenticated and routed to the Dashboard without encountering any JSON parsing or network errors.
