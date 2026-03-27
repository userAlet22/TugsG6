# Shared Database Architecture Update (March 14, 2026)

## Summary
The backend architecture has been transitioned from a fully isolated Docker environment to a hybrid local setup. The backend now runs directly on the host machine via `php artisan serve` and connects to a shared MySQL database hosted on another developer's machine over the local network (`192.168.68.140`).

## Architecture Changes
### Previous Setup (Docker)
- **PHP/Laravel Execution:** Ran inside the `gso_backend` Docker container.
- **Database:** Ran inside the `gso_mysql` Docker container.
- **Connection:** Laravel connected to `DB_HOST=mysql` using the internal Docker network.

### Current Setup (Local Shared)
- **PHP/Laravel Execution:** Runs natively on the Windows host machine via XAMPP/Laragon/Herd using the `php artisan serve` command (Port 8000/8001).
- **Database:** Runs natively on a collaborator's local machine over the Wi-Fi network.
- **Connection:** Laravel connects to `DB_HOST=192.168.68.140` (Port 3306).

## Environment Variables (.env)
The following critical changes were made to the `docker-gsobackend/.env` file to enable this architecture:

```ini
DB_CONNECTION=mysql
DB_HOST=192.168.68.140
DB_PORT=3306
DB_DATABASE=manageit
DB_USERNAME=root
DB_PASSWORD=23-Shai-01186
```

## Front-End Connection
Because the backend is no longer routed through Docker's port mapping (which previously mapped container port `8000` to host port `9000`), the frontend now communicates directly with the local PHP server.

The `docker-gsofrontend/.env.development` (or `.env`) file must be updated to target the local `artisan serve` port:

```ini
VITE_API_BASE_URL=http://localhost:8000/api
```

## Verification
1. `php artisan migrate:status` returns successfully, indicating the shared network database is reachable.
2. The MySQL credentials (`root` / `23-Shai-01186`) authorize the incoming connection.
3. The `manageit` database exists and houses all necessary tables including the 5 recent enhancements (`users`, `maintenance_requests`, `schedule_events`, `notifications`).

## Notes for Collaboration
- Since `DB_HOST` maps to a local network IP (`192.168.68.140`), both developers must be on the same Wi-Fi/Tailscale network for the backend to function.
- `docker-compose.yml` is no longer the primary driver for local development unless frontend/phpmyadmin containers are still explicitly desired.

## Errors Encountered During Setup
### 1. `npm error EJSONPARSE` (Package.json Merge Conflict)
**Error Context (Git Bash Terminal):**
```bash
npm error EJSONPARSE
npm error JSON.parse Invalid package.json: JSONParseError: Expected property name or '}' in JSON at position 2 (line 2 column 1) while parsing near "{\n<<<<<<< HEAD\n  \"name..."
```
**Cause:** A `git pull` introduced a merge conflict directly inside `package.json`, causing it to have invalid JSON syntax (with markers like `<<<<<<< HEAD`).
**Resolution:** Manually resolved the conflict markers in `package.json`, kept the React/Vite layout from the head while preserving concurrent dependencies, and ran `npm install` again.

### 2. `mysql` CommandNotFound Exception
**Error Context (PowerShell Terminal):**
```powershell
mysql : The term 'mysql' is not recognized as the name of a cmdlet, function, script file, or operable program.
```
**Cause:** The user attempted to run `mysql -u root -p 23-Shai-01186` natively in PowerShell. However, the MySQL client is not installed globally on the Windows host machine; it previously only existed inside the Docker container.
**Resolution:** Because the architecture shifted away from Docker, connecting directly to the shared network database (`192.168.68.140`) is managed entirely by Laravel (via `.env`) or a desktop GUI like MySQL Workbench, meaning native Windows terminal access to `mysql` is no longer strictly required.

### 3. `Unknown database 'manageit'` 
**Cause:** When first adapting the `docker-compose.yml`, the default database name was changed to `manageit`, but the database had not been explicitly created in the running instance yet.
**Resolution:** Succeeded by ensuring the new `DB_HOST` has a pre-created `manageit` database on the network that Laravel's `php artisan migrate` commands could bind to.
