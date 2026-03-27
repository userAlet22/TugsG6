# Frontend Using Backend's API & Database Setup

This guide documents the setup for when a frontend developer (e.g., `macmac` or `reah`) wants to connect their local React app to a remote backend developer's local API and database over **Tailscale**.

## Architecture Overview

*   **Backend Developer (Host):** Runs the Laravel API (`php artisan serve`) and the MySQL database natively on their machine.
*   **Frontend Developer:** Runs only the React frontend (`npm run dev`) and relies on the Backend Developer's machine to process requests and store data over the Tailscale network.

---

## Step-by-Step Instructions

### 1. Tailscale Connection (Crucial Step)
Both developers **MUST** be logged into the **exact same Tailscale account** (e.g., `mitsoftwareacc@gmail.com`).
If the frontend developers are logged into a different Tailscale account (e.g., `jhonscarletg@gmail.com`), the computers are on two different isolated "islands" and physically cannot see each other.

### 2. Backend Setup (The Host)
The backend developer is responsible for hosting everything except the frontend UI.
1. Start MySQL (e.g., via MySQL Workbench, XAMPP).
2. Serve the API on all network interfaces: 
   `php artisan serve --host=0.0.0.0 --port=8000`
3. The `docker-gsobackend/.env` file points to its own local database. No changes are needed here from the default local setup:
   ```ini
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=manageit
   DB_USERNAME=root
   ```

### 3. Frontend Setup (The Collaborator)
The frontend developer **does not** run the backend server or interact with `DB_HOST` in any way. Their UI simply passes HTTP requests to the Backend Developer's API.

1. Ensure they **do not** run `php artisan serve` on their own computer.
2. In `docker-gsofrontend/.env`, they must set their API URL to the Backend Developer's **Tailscale IP**:
   ```ini
   VITE_API_BASE_URL=http://<BACKEND_TAILSCALE_IP>:8000/api
   ```
   *(e.g., `http://100.90.253.94:8000/api`)*
3. They simply run `npm run dev`. Their requests will automatically tunnel securely through Tailscale to the backend developer's API.

---

## Summary of `.env` configurations
*   **Backend's `docker-gsobackend/.env`:** Uses `127.0.0.1` because the database is hosted locally on the same computer as the backend.
*   **Frontend's `docker-gsofrontend/.env`:** Uses `http://<Tailscale_IP>:8000/api` because the backend API is hosted on a remote computer across the Tailscale network.
