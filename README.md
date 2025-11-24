# Shank‑O‑Meter — Push Notifications

This app is configured for Firebase Cloud Messaging (FCM) using your VAPID key.

## What the frontend does
- Requests Notification permission and obtains an FCM token.
- Saves the token to Firestore in the `fcmTokens` collection.
- Registers a background messaging service worker (`firebase-messaging-sw.js`).
- Shows in‑app toasts when the Firestore doc updates (even without push).
- Listens for foreground FCM messages and shows a toast.

## To send push notifications when any user updates:
Deploy one Cloud Function that fires on the `settings/lastAccident` document.

### `functions/index.js`
```js
const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
admin.initializeApp();

exports.notifyUpdate = functions.firestore
  .onDocumentUpdated("settings/lastAccident", async (event) => {
    const after = event.data.after.data();
    const when = new Date(after.timestamp).toLocaleString();

    // Collect all tokens from Firestore
    const tokensSnap = await admin.firestore().collection("fcmTokens").get();
    const tokens = tokensSnap.docs.map(d => d.id).filter(Boolean);
    if (!tokens.length) return;

    const message = {
      notification: {
        title: "Shank‑O‑Meter updated",
        body: when
      },
      tokens
    };

    await admin.messaging().sendEachForMulticast(message);
  });
```

### Deploy
```bash
firebase deploy --only functions
```

Now, when any user clicks **Reset to Now** and confirms, the doc is updated, the
Function sends push notifications, and all users receive:
**"Shank‑O‑Meter updated — [Date] [Time]"**.