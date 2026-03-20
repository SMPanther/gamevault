// ─────────────────────────────────────────────────────────────────────────────
// Global notification history store — module-level so it persists across tabs
// ─────────────────────────────────────────────────────────────────────────────
let _notifs = [];
const _listeners = new Set();

export function pushNotif({ msg, type = "success" }) {
  _notifs = [{
    id:   Date.now(),
    msg,
    type,
    time: new Date().toLocaleTimeString(),
    date: new Date().toLocaleDateString(),
    read: false,
  }, ..._notifs].slice(0, 50); // keep last 50
  _listeners.forEach(fn => fn([..._notifs]));
}

export function markAllRead() {
  _notifs = _notifs.map(n => ({ ...n, read: true }));
  _listeners.forEach(fn => fn([..._notifs]));
}

export function clearAll() {
  _notifs = [];
  _listeners.forEach(fn => fn([]));
}

export function subscribeNotifs(fn) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

export function getNotifs() { return _notifs; }
