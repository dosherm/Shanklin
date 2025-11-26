import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getMessaging, getToken, isSupported } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyBfqqXgrLGaRzY3ECH0FkckuSWlMgRgAWQ",
  authDomain: "shanklin-5d9d8.firebaseapp.com",
  projectId: "shanklin-5d9d8",
  storageBucket: "shanklin-5d9d8.firebasestorage.app",
  messagingSenderId: "294015099276",
  appId: "1:294015099276:web:5c91556f85d46c310df6a9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Elements
const d1 = document.getElementById("digit1");
const d2 = document.getElementById("digit2");
const d3 = document.getElementById("digit3");
const labelTextSVG = document.getElementById("labelTextSVG");
const resetBtn = document.getElementById("resetBtn");
const modalBackdrop = document.getElementById("modalBackdrop");
const dtInput = document.getElementById("dtInput");
const cancelBtn = document.getElementById("cancelBtn");
const primeBtn = document.getElementById("primeBtn");
const confirmStep = document.getElementById("confirmStep");
const confirmNo = document.getElementById("confirmNo");
const confirmYes = document.getElementById("confirmYes");

// Notification UI
const notifyContainer = document.getElementById("notifyContainer");
const enableNotificationsBtn = document.getElementById("enableNotifications");

function updateNotificationButtonVisibility() {
  const perm = Notification.permission;
  if (notifyContainer) {
    notifyContainer.style.display = perm === "granted" ? "none" : "block";
  }
}

// Initial check at page load
updateNotificationButtonVisibility();

function daysBetween(fromISO, to = new Date()) {
  const from = new Date(fromISO);
  const diff = to - from;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function renderDays(days) {
  const digits = days.toString().padStart(3, "0").slice(-3);
  if (d1 && d2 && d3) {
    d1.textContent = digits[0];
    d2.textContent = digits[1];
    d3.textContent = digits[2];
  }
  if (labelTextSVG) {
    labelTextSVG.textContent = `${days} DAYS SINCE LAST ACCIDENT`;
  }
}

async function getLastAccident() {
  const ref = doc(db, "settings", "lastAccident");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().timestamp : null;
}

async function setLastAccident(date) {
  const ref = doc(db, "settings", "lastAccident");
  await setDoc(ref, { timestamp: date.toISOString() });
}

// Modal logic
function openModal() {
  modalBackdrop.classList.remove("hidden");
  requestAnimationFrame(() => modalBackdrop.classList.add("show"));
  dtInput.value = "";
  primeBtn.disabled = true;
  confirmStep.classList.add("hidden");
}

function closeModal() {
  modalBackdrop.classList.remove("show");
  setTimeout(() => modalBackdrop.classList.add("hidden"), 150);
}

dtInput.addEventListener("input", () => {
  primeBtn.disabled = !dtInput.value;
});

resetBtn.addEventListener("click", (e) => {
  e.preventDefault();
  openModal();
});

cancelBtn.addEventListener("click", () => closeModal());

primeBtn.addEventListener("click", () => {
  if (dtInput.value) confirmStep.classList.remove("hidden");
});

confirmNo.addEventListener("click", () => closeModal());

confirmYes.addEventListener("click", async () => {
  if (!dtInput.value) return;
  const selected = new Date(dtInput.value);
  await setLastAccident(selected);
  window.location.reload();
});

modalBackdrop.addEventListener("click", (e) => {
  if (e.target === modalBackdrop) closeModal();
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// Live Firestore updates
onSnapshot(doc(db, "settings", "lastAccident"), (snap) => {
  if (!snap.exists()) return;
  const iso = snap.data().timestamp;
  renderDays(daysBetween(iso));
});

// Messaging (iOS safe, single-notification mode)
if (enableNotificationsBtn) {
  enableNotificationsBtn.addEventListener("click", async () => {
    try {
      console.log("🔔 Requesting notification permission…");

      const perm = await Notification.requestPermission();
      updateNotificationButtonVisibility();

      if (perm !== "granted") {
        alert("Notifications were not enabled. You can try again.");
        return;
      }

      const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");

      if (!(await isSupported())) {
        alert("⚠️ Notifications are not supported on this browser.");
        return;
      }

      const messaging = getMessaging(app);
      const vapidKey =
        "BC16SkEdTJH-78uCwACzQywLJVwJDIMhAFlVm6R3Tp2s9n3zMxP3muCdbAu72hduZAUP0uvUWrW3AkrCpcKvk7w";

      console.log("⚙️ Requesting FCM token…");

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      console.log("📡 FCM token received:", token);

      if (token) {
        await setDoc(
          doc(db, "fcmTokens", token),
          {
            created: new Date().toISOString(),
          },
          { merge: true }
        );

        alert("✅ Notifications enabled!");
      }

      // ❗ Foreground onMessage handler REMOVED to prevent duplicate notifications

    } catch (err) {
      console.warn("Notification setup failed:", err);
      alert("⚠️ Unable to enable notifications. Check console.");
    }
  });
}

// Initial load
(async function init() {
  const lastISO = await getLastAccident();
  if (lastISO) renderDays(daysBetween(lastISO));
})();
