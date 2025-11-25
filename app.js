import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging.js";

// ---- Firebase config ----
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

// ---- Elements expected in your existing index.html ----
const d1 = document.getElementById("digit1");
const d2 = document.getElementById("digit2");
const d3 = document.getElementById("digit3");
const labelTextSVG = document.getElementById("labelTextSVG");
const resetBtn = document.getElementById("resetBtn");

// Modal controls (as built earlier)
const modalBackdrop = document.getElementById("modalBackdrop");
const dtInput = document.getElementById("dtInput");
const cancelBtn = document.getElementById("cancelBtn");
const primeBtn = document.getElementById("primeBtn");
const confirmStep = document.getElementById("confirmStep");
const confirmNo = document.getElementById("confirmNo");
const confirmYes = document.getElementById("confirmYes");

// ---- Helpers ----
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
  if (labelTextSVG) labelTextSVG.textContent = `${days} DAYS SINCE LAST ACCIDENT`;
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

// ---- Modal wiring ----
function openModal() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove("hidden");
  requestAnimationFrame(() => modalBackdrop.classList.add("show"));
  if (dtInput) dtInput.value = "";
  if (primeBtn) primeBtn.disabled = true;
  if (confirmStep) confirmStep.classList.add("hidden");
}
function closeModal() {
  if (!modalBackdrop) return;
  modalBackdrop.classList.remove("show");
  setTimeout(() => modalBackdrop.classList.add("hidden"), 150);
}
if (dtInput) dtInput.addEventListener("input", () => { if (primeBtn) primeBtn.disabled = !dtInput.value; });
if (resetBtn) resetBtn.addEventListener("click", (e) => { e.preventDefault(); openModal(); });
if (cancelBtn) cancelBtn.addEventListener("click", () => closeModal());
if (primeBtn) primeBtn.addEventListener("click", () => { if (dtInput && dtInput.value) confirmStep.classList.remove("hidden"); });
if (confirmNo) confirmNo.addEventListener("click", () => closeModal());
if (confirmYes) confirmYes.addEventListener("click", async () => {
  if (!dtInput || !dtInput.value) return;
  const selected = new Date(dtInput.value);
  await setLastAccident(selected);
  window.location.reload();
});
if (modalBackdrop) modalBackdrop.addEventListener("click", (e) => { if (e.target === modalBackdrop) closeModal(); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

// ---- Live Firestore updates (keeps digits in sync across clients) ----
onSnapshot(doc(db, "settings", "lastAccident"), (snap) => {
  if (!snap.exists()) return;
  const iso = snap.data().timestamp;
  renderDays(daysBetween(iso));
});

// ---- Messaging: background + foreground notifications ----
(async function setupMessaging() {
  try {
    if (!(await isSupported())) return;

    // Register service worker for background notifications
    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");

    // Ask for permission (only if not already granted/denied)
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
    if (Notification.permission !== "granted") return;

    const messaging = getMessaging(app);
    const vapidKey = "BC16SkEdTJH-78uCwACzQywLJVwJDIMhAFlVm6R3Tp2s9n3zMxP3muCdbAu72hduZAUP0uvUWrW3AkrCpcKvk7w";
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (token) {
      await setDoc(doc(db, "fcmTokens", token), { created: new Date().toISOString() }, { merge: true });
    }

    // Foreground messages (when tab is open)
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "Shank‑O‑Meter Update";
      const options = {
        body: payload.notification?.body || "",
        icon: "./icon-192.png"
      };
      try {
        new Notification(title, options);
      } catch (e) {
        console.log("Notification (foreground):", title, options);
      }
    });
  } catch (err) {
    console.warn("Messaging setup skipped:", err);
  }
})();

// ---- Initial paint ----
(async function init() {
  const lastISO = await getLastAccident();
  if (lastISO) renderDays(daysBetween(lastISO));
})();