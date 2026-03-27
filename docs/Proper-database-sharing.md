# Proper Database Sharing


# For Backend

Follow these rules to successfully share and connect to the same database across different machines:

1. **Same Wi-Fi Network:** 
   Ensure that both your local computer and the database host's computer are connected to the exact same Wi-Fi network.

2. **Configure Environment and Run Servers:** 
   - Open your backend `.env` file.
   - For the `DB_HOST` variable, put the Wi-Fi IPv4 address of the computer hosting the database (e.g., `DB_HOST=10.0.0.192`).
   - Start the backend server by running:
     ```bash
     php artisan serve --host=0.0.0.0 --port=8000
     ```
   - Start the frontend server by running:
     ```bash
     npm run dev
     ```

3. **Successful Connection:** 
   After completing the steps above, you will now be sharing the exact same database directly from the host.

# OPTION 2

1. put the database host tailscale ip address in the .env file of the backend developer.

   DB_HOST=<tailscale ip address>

2. Start the backend server by running:
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

3. Start the frontend server by running:
   ```bash
   npm run dev
   ```

4. **Successful Connection:** 
   After completing the steps above, you will now be sharing the exact same database directly from the host.


   # For Frontend to backend


   in .env docker-gsofrontend in the frontend developer, put the tailscale ip address of the backend developer's computer.

   VITE_API_BASE_URL=http://<tailscale ip address>:8000/api
