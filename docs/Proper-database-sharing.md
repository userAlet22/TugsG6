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


# For Frontend to Backend

In the `.env` file of `docker-gsofrontend` for the frontend developer, put the Tailscale IP address of the backend developer's computer:

```env
VITE_API_BASE_URL=http://<backend_tailscale_ip>:8000/api
```

---

# For Mobile App (Expo) to Backend

When a separate team is developing a Mobile App and needs to use your Backend and Database over Tailscale:

1. **Mobile App API Connection:**
   The Mobile App team connects exactly like the frontend. They only need to point their API requests to the Backend Developer's Tailscale IP address:
   ```env
   API_BASE_URL=http://<backend_tailscale_ip>:8000/api
   ```

2. **Database Access is Handled Automatically:**
   The Mobile App team **does not** need direct database credentials. When the App requests data via the API, the Backend automatically queries the database (which might be hosted by a completely different group) and securely returns the results.

3. **CRITICAL STEP FOR BACKEND DEVELOPER (Image URLs):**
   If the backend serves files or images, the backend developer MUST change the `APP_URL` parameter in their `docker-gsobackend/.env` file from localhost to their Tailscale IP:
   ```env
   # Change this:
   # APP_URL=http://localhost

   # To this:
   APP_URL=http://<backend_tailscale_ip>:8000
   ```
   **Why?** If left as `localhost`, any image links sent to the Mobile App will instruct the user's phone to search inside the phone itself, breaking all images. Changing it to the Tailscale IP ensures the phone reaches the correct server. Always restart `php artisan serve` after updating `.env`.
