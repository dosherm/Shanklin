import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging.js";

// Firebase config
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

// Inline SVG references (if present)
const d1 = document.getElementById("digit1");
const d2 = document.getElementById("digit2");
const d3 = document.getElementById("digit3");
const labelTextSVG = document.getElementById("labelTextSVG");

// Controls & modal
const resetBtn = document.getElementById("resetBtn");
const modalBackdrop = document.getElementById("modalBackdrop");
const dtInput = document.getElementById("dtInput");
const cancelBtn = document.getElementById("cancelBtn");
const primeBtn = document.getElementById("primeBtn");
const confirmStep = document.getElementById("confirmStep");
const confirmNo = document.getElementById("confirmNo");
const confirmYes = document.getElementById("confirmYes");
const toast = document.getElementById("toast");

function fmt(dtISO) {
  const d = new Date(dtISO);
  return d.toLocaleString();
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  toast.classList.remove("hidden");
  setTimeout(() => { toast.classList.remove("show"); }, 3500);
}

function daysBetween(fromISO, to = new Date()) {
  const from = new Date(fromISO);
  const diff = to - from;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function renderDays(days) {
  if (d1 && d2 && d3) {
    const digits = days.toString().padStart(3, "0").slice(-3);
    d1.textContent = digits[0];
    d2.textContent = digits[1];
    d3.textContent = digits[2];
  }
  if (labelTextSVG) labelTextSVG.textContent = `${days} DAYS SINCE LAST ACCIDENT`;
}

async function getLastAccident() {
  const ref = doc(db, "settings", "lastAccident");
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data().timestamp;
  return null;
}

async function setLastAccident(date) {
  const ref = doc(db, "settings", "lastAccident");
  await setDoc(ref, { timestamp: date.toISOString() });
}

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

// Wire modal
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

// Live Firestore listener to show toast when *anyone* updates it (in-app)
let lastSeenISO = null;
onSnapshot(doc(db, "settings", "lastAccident"), (snap) => {
  if (!snap.exists()) return;
  const iso = snap.data().timestamp;
  if (!lastSeenISO) lastSeenISO = iso;
  // Update the digits every time to stay current
  renderDays(daysBetween(iso));
  // If changed since last snapshot, show toast
  if (iso !== lastSeenISO) {
    showToast(`Shank‑O‑Meter updated — ${fmt(iso)}`);
    lastSeenISO = iso;
  }
});

// Request notifications + get FCM token (for background pushes)
(async () => {
  if (!(await isSupported())) return;
  try {
    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: "BC16SkEdTJH-78uCwACzQywLJVwJDIMhAFlVm6R3Tp2s9n3zMxP3muCdbAu72hduZAUP0uvUWrW3AkrCpcKvk7w", serviceWorkerRegistration: registration });
    if (token) {
      // Save token to Firestore for server-side topic subscription or direct sends
      await setDoc(doc(db, "fcmTokens", token), { created: new Date().toISOString() }, { merge: true });
    }
    // Foreground notifications
    onMessage(messaging, (payload) => {
      if (payload?.notification) {
        const t = payload.notification.title || "Shank‑O‑Meter";
        const b = payload.notification.body || "";
        showToast(`${t} — ${b}`);
      }
    });
  } catch (err) {
    console.warn("FCM token/permission issue:", err);
  }
})();

// Initial paint from current value
(async function init() {
  const lastISO = await getLastAccident();
  if (lastISO) renderDays(daysBetween(lastISO));
})();