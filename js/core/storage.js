window.VT = window.VT || {};

VT.store = (() => {
  const PREFIX = 'vistanology:';

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  }

  function set(key, value) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
    catch { return false; }
  }

  function remove(key) {
    try { localStorage.removeItem(PREFIX + key); } catch { /* private mode */ }
  }

  function clearAll() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch { /* private mode */ }
  }

  return { get, set, remove, clearAll };
})();

VT.favs = (() => {
  const list = () => VT.store.get('favorites', []);
  const has = (id) => list().includes(id);
  function toggle(id) {
    const l = list();
    const i = l.indexOf(id);
    if (i >= 0) l.splice(i, 1); else l.push(id);
    VT.store.set('favorites', l);
    return i < 0;
  }
  return { list, has, toggle };
})();

VT.recents = (() => {
  const list = () => VT.store.get('recents', []);
  function push(id) {
    const l = list().filter((x) => x !== id);
    l.unshift(id);
    VT.store.set('recents', l.slice(0, 6));
  }
  return { list, push };
})();