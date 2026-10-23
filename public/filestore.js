// filestore.js — keeps each agreement's ORIGINAL file(s) on the phone, so you can open them later.
// Uses IndexedDB, the browser's larger built-in storage (local storage is too small for PDFs).
// Nothing here leaves the phone. Every call is wrapped so the app still works if storage is blocked.

const DB_NAME = 'fineprint-files';
const STORE = 'originals';

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('no IndexedDB')); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run(mode, fn) {
  const db = await openDB();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const result = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(result && 'result' in result ? result.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Save originals for an agreement: [{ blob, name, type }] (one PDF, or several photographed pages). */
export async function saveOriginals(id, files) {
  try {
    const items = files.map((f) => ({ blob: f.blob || f, name: f.name || 'file', type: f.type || (f.blob && f.blob.type) || '' }));
    await run('readwrite', (s) => s.put(items, id));
    return true;
  } catch {
    return false;
  }
}

export async function getOriginals(id) {
  try { return (await run('readonly', (s) => s.get(id))) || null; } catch { return null; }
}

export async function deleteOriginals(id) {
  try { await run('readwrite', (s) => s.delete(id)); } catch { /* nothing to delete */ }
}

export async function clearOriginals() {
  try { await run('readwrite', (s) => s.clear()); } catch { /* nothing to clear */ }
}
