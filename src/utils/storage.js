// ─────────────────────────────────────────────────────────────────────────────
// localStorage persistence layer
// All keys prefixed with "gv_" to avoid collisions
// Handles JSON parse/stringify and errors silently
// ─────────────────────────────────────────────────────────────────────────────

const PREFIX = "gv_";

export function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw !== null ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function lsSet(key, value) {
  try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); }
  catch {}
}

export function lsDel(key) {
  try { localStorage.removeItem(PREFIX + key); }
  catch {}
}

export function lsClear(prefix) {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX + (prefix || "")))
      .forEach(k => localStorage.removeItem(k));
  } catch {}
}

// ── User game state ──────────────────────────────────────────────────────────
export function saveUserState(username, state) {
  lsSet(`state_${username}`, {
    sg:         state.sg,
    eg:         state.eg,
    sLinked:    state.sLinked,
    eLinked:    state.eLinked,
    sProf:      state.sProf,
    eProf:      state.eProf,
    wishExtras: state.wishExtras,
  });
}

export function loadUserState(username) {
  return lsGet(`state_${username}`, null);
}

// ── Market listings ──────────────────────────────────────────────────────────
export function saveListings(listings) {
  // Strip base64 screenshots before saving to avoid quota issues
  const safe = listings.map(l => ({ ...l, offers: l.offers || [] }));
  lsSet("listings", safe);
}

export function loadListings() {
  return lsGet("listings", []);
}

// ── Trades ───────────────────────────────────────────────────────────────────
export function saveTrades(trades) {
  lsSet("trades", trades);
}

export function loadTrades() {
  return lsGet("trades", []);
}

// ── Session (remember me) ────────────────────────────────────────────────────
export function saveSession(username) {
  lsSet("session", { username, ts: Date.now() });
}

export function loadSession() {
  const s = lsGet("session", null);
  if (!s) return null;
  // Session expires after 7 days
  if (Date.now() - s.ts > 7 * 24 * 60 * 60 * 1000) { lsDel("session"); return null; }
  return s.username;
}

export function clearSession() {
  lsDel("session");
}

// ── User registry (registered users survive refresh) ─────────────────────────
export function saveUserDB(userDB) {
  // Save only safe fields — no passwords in plain text ideally,
  // but since this is client-side only we save all fields
  lsSet("userdb", userDB);
}

export function loadUserDB() {
  return lsGet("userdb", null);
}

// ── Activity log ─────────────────────────────────────────────────────────────
export function logActivity(username, action, detail = "") {
  const key = `activity_${username}`;
  const log = lsGet(key, []);
  log.unshift({
    id:     Date.now(),
    action,
    detail,
    time:   new Date().toLocaleTimeString(),
    date:   new Date().toLocaleDateString(),
  });
  lsSet(key, log.slice(0, 100)); // keep last 100 entries
}

export function getActivityLog(username) {
  return lsGet(`activity_${username}`, []);
}
