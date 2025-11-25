import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging.js";

// --- config, elements, and helper functions omitted for brevity ---
// (Identical to your current structure, only the messaging block is enhanced)

(async function setupMessaging() {
  try {
    if (!(await isSupported())) {
      alert("⚠️ Firebase messaging is not supported in this browser.");
      return;
    }

    const statusDiv = document.createElement("div");
    statusDiv.style.position = "fixed";
    statusDiv.style.bottom = "1em";
    statusDiv.style.left = "1em";
    statusDiv.style.backgroundColor = "white";
    statusDiv.style.border = "1px solid #ccc";
    statusDiv.style.padding = "0.5em";
    statusDiv.style.zIndex = 9999;
    statusDiv.innerText = `🔔 Notification.permission = ${Notification.permission}`;
    document.body.appendChild(statusDiv);

    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");

    if (Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      alert(`🔔 Permission result: ${result}`);
      if (result !== "granted") return;
    }

    const messaging = getMessaging(initializeApp({
      apiKey: "AIzaSyBfqqXgrLGaRzY3ECH0FkckuSWlMgRgAWQ",
      authDomain: "shanklin-5d9d8.firebaseapp.com",
      projectId: "shanklin-5d9d8",
      storageBucket: "shanklin-5d9d8.firebasestorage.app",
      messagingSenderId: "294015099276",
      appId: "1:294015099276:web:5c91556f85d46c310df6a9"
    }));

    const vapidKey = "BC16SkEdTJH-78uCwACzQywLJVwJDIMhAFlVm6R3Tp2s9n3zMxP3muCdbAu72hduZAUP0uvUWrW3AkrCpcKvk7w";
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });

    if (token) {
      console.log("📡 FCM token received:", token);
      alert("📡 Token created.");
      try {
        await setDoc(doc(getFirestore(), "fcmTokens", token), { created: new Date().toISOString() }, { merge: true });
        alert("✅ Token saved to Firestore.");
      } catch (writeErr) {
        console.error("❌ Error saving token:", writeErr);
        alert("❌ Error saving token to Firestore. Check console.");
      }
    } else {
      alert("⚠️ Failed to get FCM token.");
    }

    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "Shank‑O‑Meter Update";
      const options = { body: payload.notification?.body || "", icon: "./icon-192.png" };
      try { new Notification(title, options); } catch (e) { console.log("Notification:", title, options); }
    });
  } catch (e) {
    console.warn("Messaging setup issue:", e);
    alert(`⚠️ Messaging setup failed: ${e.message}`);
  }
})();