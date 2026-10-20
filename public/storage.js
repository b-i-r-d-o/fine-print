// storage.js — saves and loads Fine Print's data in the phone browser's local storage.
// Local storage is a small notebook the browser keeps for this one site. It survives
// closing the app, but every read/write is wrapped in try/catch because some browsers
// (private windows, blocked site data) refuse it. The app still works, it just forgets.

const PREFIX = 'fp.';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: keep going without saving */
  }
}

export function clearAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* nothing to clear */
  }
}
