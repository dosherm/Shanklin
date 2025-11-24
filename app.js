const INITIAL_LAST_ACCIDENT_ISO = "2025-11-20T00:00:00Z";
const d1 = document.getElementById("digit1");
const d2 = document.getElementById("digit2");
const d3 = document.getElementById("digit3");
const labelText = document.getElementById("labelText");
const resetBtn = document.getElementById("resetBtn");
const statusEl = document.getElementById("status");

const LS_KEY = "lastAccidentISO";

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

function readLocal() {
  return localStorage.getItem(LS_KEY) || INITIAL_LAST_ACCIDENT_ISO;
}
function writeLocal(iso) {
  localStorage.setItem(LS_KEY, iso);
  statusEl.textContent = "Saved locally.";
}

function start() {
  let lastISO = readLocal();
  showDays(daysBetween(lastISO));
  setInterval(() => showDays(daysBetween(lastISO)), 60000);
  resetBtn.addEventListener("click", () => {
    const nowISO = new Date().toISOString();
    writeLocal(nowISO);
    lastISO = nowISO;
    showDays(daysBetween(lastISO));
  });
}
start();
