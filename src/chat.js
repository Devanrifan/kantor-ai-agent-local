// Klien chat: simpan riwayat per karyawan (localStorage, opsional) dan baca stream SSE dari /api/chat.

const KEY_HISTORY = 'kantorai.history.v1';
const KEY_CODE = 'kantorai.code';

const safe = {
  get(k) {
    try { return localStorage.getItem(k); } catch { return null; }
  },
  set(k, v) {
    try { localStorage.setItem(k, v); } catch { /* abaikan */ }
  },
  del(k) {
    try { localStorage.removeItem(k); } catch { /* abaikan */ }
  },
};

let histories = {};
try { histories = JSON.parse(safe.get(KEY_HISTORY) || '{}') || {}; } catch { histories = {}; }

const persist = () => safe.set(KEY_HISTORY, JSON.stringify(histories));

export const getHistory = (id) => histories[id] || [];
export function setHistory(id, list) {
  histories[id] = list.slice(-40);
  persist();
}
export function clearHistory(id) {
  delete histories[id];
  persist();
}

export const getCode = () => safe.get(KEY_CODE) || '';
export const setCode = (c) => (c ? safe.set(KEY_CODE, c) : safe.del(KEY_CODE));

export async function fetchConfig() {
  try {
    const r = await fetch('/api/config');
    if (!r.ok) throw new Error('config');
    return await r.json();
  } catch {
    return { demo: false, needsCode: false, offline: true };
  }
}

// Mengirim riwayat + pesan baru. Memanggil onText(potongan) saat streaming.
// Melempar Error dengan .code === 401 bila kode akses salah.
export async function streamChat(agentId, messages, { onText, signal }) {
  let res;
  try {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-access-code': getCode() },
      body: JSON.stringify({ agentId, messages }),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('Tidak bisa menghubungi server. Cek koneksi atau pastikan backend jalan.');
  }

  if (!res.ok) {
    let msg = 'Terjadi kesalahan.';
    try { msg = (await res.json()).error || msg; } catch { /* abaikan */ }
    const err = new Error(msg);
    err.code = res.status;
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) >= 0) {
      const raw = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 2);
      if (!raw.startsWith('data:')) continue;
      let evt;
      try { evt = JSON.parse(raw.slice(5).trim()); } catch { continue; }
      if (evt.error) throw new Error(evt.error);
      if (evt.t) {
        full += evt.t;
        onText(evt.t, full);
      }
    }
  }
  return full;
}
