window.VT = window.VT || {};

/* VT.db · local-first structured storage (IndexedDB)
 * Companion to VT.store (synchronous localStorage for settings). VT.db holds larger,
 * structured, user-created data — saved "projects" — entirely on the device. Nothing here
 * ever touches the network. The schema is versioned (DB_VERSION) and migrated in
 * onupgradeneeded, so evolving the format never silently corrupts existing data.
 */
VT.db = (() => {
  const DB_NAME = 'vistanology-open';
  const DB_VERSION = 1;
  const STORE = 'projects';
  const META = 'meta';
  const SCHEMA_VERSION = DB_VERSION;

  const available = typeof indexedDB !== 'undefined' && indexedDB !== null;

  let _opening = null;

  function uid() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    let s = '';
    const hex = '0123456789abcdef';
    for (let i = 0; i < 32; i++) s += hex[Math.floor(Math.random() * 16)];
    return s.slice(0, 8) + '-' + s.slice(8, 12) + '-4' + s.slice(13, 16) +
      '-' + hex[8 + Math.floor(Math.random() * 4)] + s.slice(16, 20) + '-' + s.slice(20, 32);
  }

  function open() {
    if (!available) return Promise.reject(new Error('IndexedDB unavailable in this context'));
    if (_opening) return _opening;
    _opening = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = req.result;
        const tx = req.transaction;
        const oldVersion = e.oldVersion;
        if (oldVersion < 1) {
          const os = db.createObjectStore(STORE, { keyPath: 'id' });
          os.createIndex('tool', 'tool', { unique: false });
          os.createIndex('updatedAt', 'updatedAt', { unique: false });
          const meta = db.createObjectStore(META, { keyPath: 'key' });
          meta.put({ key: 'schemaVersion', value: SCHEMA_VERSION });
        }
        // Future migrations: if (oldVersion < 2) { ...alter stores/indexes... }
        tx.oncomplete = () => {
          const m = db.transaction(META, 'readwrite');
          m.objectStore(META).put({ key: 'schemaVersion', value: SCHEMA_VERSION });
        };
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('IndexedDB open blocked'));
    });
    _opening.catch(() => { _opening = null; });
    return _opening;
  }

  function req(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function normalize(obj, existing) {
    const now = Date.now();
    return Object.assign({}, obj, {
      id: obj.id || (existing && existing.id) || uid(),
      tool: obj.tool || 'misc',
      name: typeof obj.name === 'string' ? obj.name : '',
      data: obj.data === undefined ? null : obj.data,
      createdAt: obj.createdAt || (existing && existing.createdAt) || now,
      updatedAt: now
    });
  }

  async function put(obj) {
    const id = obj.id || uid();
    const db = await open();
    const existing = await req(db.transaction(STORE).objectStore(STORE).get(id));
    const rec = normalize(obj, existing);
    await req(db.transaction(STORE, 'readwrite').objectStore(STORE).put(rec));
    return rec;
  }

  function get(id) {
    return open().then((db) => req(db.transaction(STORE).objectStore(STORE).get(id)));
  }

  async function list(toolId) {
    const db = await open();
    const all = await req(db.transaction(STORE).objectStore(STORE).getAll());
    const rows = toolId ? all.filter((r) => r.tool === toolId) : all;
    return rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }

  function remove(id) {
    return open().then((db) => req(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id)));
  }

  function clear() {
    return open().then((db) => req(db.transaction(STORE, 'readwrite').objectStore(STORE).clear()));
  }

  function count() {
    return open().then((db) => req(db.transaction(STORE).objectStore(STORE).count()));
  }

  async function exportAll() {
    const projects = await list();
    return {
      app: 'vistanology-open',
      kind: 'projects-backup',
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      projects
    };
  }

  async function importAll(payload, mode) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.projects)) {
      throw new Error('Invalid backup format');
    }
    if (mode === 'replace') await clear();
    const projects = payload.projects;
    let imported = 0;
    let skipped = 0;
    for (const p of projects) {
      if (!p || typeof p !== 'object' || !('data' in p)) { skipped++; continue; }
      await put(p);
      imported++;
    }
    return { imported, skipped, total: projects.length };
  }

  return {
    available,
    DB_NAME,
    SCHEMA_VERSION,
    uid,
    open,
    put,
    get,
    list,
    remove,
    clear,
    count,
    exportAll,
    importAll
  };
})();
