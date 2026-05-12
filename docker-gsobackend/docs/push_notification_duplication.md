# Expo Push Notification Duplication Explained

## The Issue
During testing, you may observe that a single action (such as a Head approving a maintenance request) results in your phone receiving multiple identical (or slightly different) Expo push notifications. 

For example, when a request is approved by a Head, you might receive two push notifications instead of one.

## The Cause
This duplication is **not a bug in the code**, but rather a side-effect of how the testing environment is set up on your physical device.

Your suspicion is 100% correct: **It is meant for multiple accounts.**

### How the Flow Works:
1. **Device Registration:** When you log into the mobile app, your phone generates a unique Expo Push Token and saves it to your `User` record in the database.
2. **Testing Multiple Roles:** Because you used the *same physical phone* to log into the **Requester** account, the **Staff** account, the **Head** account, and the **Campus Director** account, the database now has the exact same Expo Push Token saved for all of those different users.
3. **Event Trigger:** When an action occurs (e.g., `approveByHead`), the `MaintenanceRequestController` is designed to notify everyone who needs to know. It creates a `SystemNotification` for:
   - The Requester (to let them know their request moved forward).
   - The Campus Directors (to alert them that it is their turn to approve).
4. **Push Dispatch:** The `Notification` model detects these new database entries and sends a push notification to the Expo Push Token associated with each user. 
5. **The Result:** Because the Requester and the Campus Director currently share the *exact same push token* (your phone), Expo delivers both notifications to your device. 

## Conclusion
In a real-world production environment where the Requester, the Head, and the Campus Director are three different people with three different phones, this duplication will not happen. 

Each person will only receive the specific notification intended for their role. No code changes are required to fix this, as it is strictly a testing artifact.
