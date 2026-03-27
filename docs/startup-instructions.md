# Local Development Startup Instructions (March 14, 2026)

## Purpose
This document provides the exact steps needed to launch the GS-JS backend and frontend locally, bypassing Docker entirely, and connecting to a shared network database. This workflow is ideal for collaboration with developers running local XAMPP/Laragon setups.

---

### Prerequisites
1. Ensure your computer is connected to the same Wi-Fi network (or Tailscale network) as the computer hosting the MySQL database (`192.168.68.140`).
2. Ensure the host computer has their database server running.
3. Your local PHP installation via Herd/Composer must be active.

---

### Step 1: Start the Backend (Laravel API)
The backend must be running to act as the bridge between the frontend and the database.

1. Open your code editor and launch a new terminal (PowerShell or Git Bash).
2. Navigate into the backend folder:
   ```bash
   cd docker-gsobackend
   ```
3. Start the Laravel development server:
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```
4. **Leave this terminal open.** This terminal replaces the old `gso_backend` Docker container.

---

### Step 2: Start the Frontend (React Vite)
The frontend needs its own server to bundle the React code and serve the interface.

1. Open a **second, separate terminal tab** in your code editor.
2. Navigate into the frontend folder:
   ```bash
   cd docker-gsofrontend
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. **Leave this terminal open.** This terminal replaces the old `gso_frontend` Docker container.

---

### Step 3: Access the Application
- With both terminals running concurrently, you can now open your browser and navigate to the frontend URL provided by Vite (typically `http://localhost:5173` or similar).
- The React frontend will automatically communicate with the local API at `localhost:8000`.
- The local API will automatically query your colleague's database at `192.168.68.140`.

> **Note:** The `docker compose up` command is no longer required to develop or run this project unless you specifically need the local `phpmyadmin` container.
