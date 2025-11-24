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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Inline SVG elements
const d1 = document.getElementById("digit1");
const d2 = document.getElementById("digit2");
const d3 = document.getElementById("digit3");
const labelTextSVG = document.getElementById("labelTextSVG");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");

// Modal elements
const modalBackdrop = document.getElementById("modalBackdrop");
const dtInput = document.getElementById("dtInput");
const cancelBtn = document.getElementById("cancelBtn");
const primeBtn = document.getElementById("primeBtn");
const confirmStep = document.getElementById("confirmStep");
const confirmNo = document.getElementById("confirmNo");
const confirmYes = document.getElementById("confirmYes");

function daysBetween(fromISO, to = new Date()) {
  const from = new Date(fromISO);
  const diff = to - from;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function renderDays(days) {
  const digits = days.toString().padStart(3, "0").slice(-3);
  d1.textContent = digits[0];
  d2.textContent = digits[1];
  d3.textContent = digits[2];
  labelTextSVG.textContent = `${days} DAYS SINCE LAST SHANKLIN`;
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
  if (!dtInput.value) return;
  confirmStep.classList.remove("hidden");
});

confirmNo.addEventListener("click", () => {
  closeModal();
});

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

async function start() {
  let lastISO = await getLastAccident();
  if (!lastISO) {
    const now = new Date().toISOString();
    await setLastAccident(new Date(now));
    lastISO = now;
  }
  renderDays(daysBetween(lastISO));
  setInterval(async () => {
    const updated = await getLastAccident();
    renderDays(daysBetween(updated));
  }, 60000);
}

start();