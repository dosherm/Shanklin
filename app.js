import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfqqXgrLGaRzY3ECH0FkckuSWlMgRgAWQ",
  authDomain: "shanklin-5d9d8.firebaseapp.com",
  projectId: "shanklin-5d9d8",
  storageBucket: "shanklin-5d9d8.firebasestorage.app",
  messagingSenderId: "294015099276",
  appId: "1:294015099276:web:5c91556f85d46c310df6a9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const d1 = document.getElementById("digit1");
const d2 = document.getElementById("digit2");
const d3 = document.getElementById("digit3");
const labelText = document.getElementById("labelText");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");

function daysBetween(fromISO, to = new Date()) {
  const from = new Date(fromISO);
  const diff = to - from;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function showDays(days) {
  const digits = days.toString().padStart(3, "0").slice(-3);
  d1.textContent = digits[0];
  d2.textContent = digits[1];
  d3.textContent = digits[2];
  labelText.textContent = `${days} DAYS SINCE LAST ACCIDENT`;
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

async function start() {
  let lastISO = await getLastAccident();
  if (!lastISO) {
    const now = new Date().toISOString();
    await setLastAccident(new Date(now));
    lastISO = now;
  }

  showDays(daysBetween(lastISO));

  // Refresh display every minute with latest data
  setInterval(async () => {
    const updated = await getLastAccident();
    showDays(daysBetween(updated));
  }, 60000);

  resetBtn.addEventListener("click", async () => {
    const now = new Date();
    await setLastAccident(now);
    showDays(daysBetween(now.toISOString()));
  });
}

start();
