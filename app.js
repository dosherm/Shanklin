import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getMessaging, getToken, onMessage, isSupported } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging.js";

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

async function setupMessaging() {
  if (!(await isSupported())) {
    console.warn("Firebase messaging not supported on this browser.");
    return;
  }
  try {
    const registration = await navigator.serviceWorker.register("./firebase-messaging-sw.js");
    console.log("Service Worker registered for messaging.");
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission not granted.");
      return;
    }
    const vapidKey = "BC16SkEdTJH-78uCwACzQywLJVwJDIMhAFlVm6R3Tp2s9n3zMxP3muCdbAu72hduZAUP0uvUWrW3AkrCpcKvk7w";
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (token) {
      await setDoc(doc(db, "fcmTokens", token), { created: new Date().toISOString() }, { merge: true });
      console.log("Token saved:", token);
    }
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "Shank-O-Meter Update";
      const options = {
        body: payload.notification?.body || "There was an update to the Shank-O-Meter.",
        icon: "/icon-192.png"
      };
      new Notification(title, options);
    });
  } catch (err) {
    console.error("Error initializing messaging:", err);
  }
}
setupMessaging();

const d1 = document.getElementById("digit1");
const d2 = document.getElementById("digit2");
const d3 = document.getElementById("digit3");
const labelTextSVG = document.getElementById("labelTextSVG");
const resetBtn = document.getElementById("resetBtn");

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
let lastISO = null;
onSnapshot(doc(db, "settings", "lastAccident"), (snap) => {
  if (!snap.exists()) return;
  const iso = snap.data().timestamp;
  renderDays(daysBetween(iso));
  lastISO = iso;
});
resetBtn.addEventListener("click", async () => {
  const now = new Date();
  await setLastAccident(now);
  renderDays(daysBetween(now.toISOString()));
});
