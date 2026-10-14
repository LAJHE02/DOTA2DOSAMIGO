const PREFIX = 'dota-ranking:v4:';

export function readCache(key, ttlMs) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { savedAt, value } = JSON.parse(raw);
    if (Date.now() - savedAt > ttlMs) return null;
    return { savedAt, value };
  } catch {
    return null;
  }
}

export function writeCache(key, value) {
  const savedAt = Date.now();
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt, value }));
  } catch {
    // Cache é opcional: se o navegador bloquear, o app segue funcionando.
  }
  return savedAt;
}
