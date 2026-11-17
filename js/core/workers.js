window.VT = window.VT || {};

/*
 * VT.workers — offload deterministic canvas pipelines to a Web Worker.
 * Worker source is an inline Blob so it works under file:// and offline.
 * Callers must treat the worker as an optimization only: any failure has to
 * fall back to the synchronous main-thread path (same output, different thread).
 */
VT.workers = (() => {
  const supported = typeof Worker !== 'undefined' &&
    typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap !== 'undefined';

  const SRC = `
'use strict';
function smoothName(v) { return v === 'low' ? 'nearest' : v; }
self.onmessage = async (e) => {
  const d = e.data;
  try {
    const cv = new OffscreenCanvas(d.w, d.h);
    const ctx = cv.getContext('2d', { alpha: d.alpha !== false });
    if (d.bg) { ctx.fillStyle = d.bg; ctx.fillRect(0, 0, d.w, d.h); }
    ctx.imageSmoothingEnabled = d.smooth !== 'low';
    ctx.imageSmoothingQuality = smoothName(d.smooth);
    ctx.drawImage(d.bmp, 0, 0, d.w, d.h);
    d.bmp.close();
    const blob = await cv.convertToBlob({ type: d.type, quality: d.quality });
    self.postMessage({ id: d.id, ok: true, blob });
  } catch (err) {
    try { d.bmp.close(); } catch (e2) { /* already closed */ }
    self.postMessage({ id: d.id, ok: false, error: String((err && err.name) || 'Error') });
  }
};`;

  let worker = null;
  let seq = 0;
  const pending = new Map();
  let broken = !supported;

  function ensure() {
    if (broken) return false;
    if (worker) return true;
    try {
      const url = URL.createObjectURL(new Blob([SRC], { type: 'text/javascript' }));
      worker = new Worker(url);
      URL.revokeObjectURL(url);
      worker.onmessage = (e) => {
        const p = pending.get(e.data.id);
        if (!p) return;
        pending.delete(e.data.id);
        clearTimeout(p.timer);
        e.data.ok ? p.resolve(e.data.blob) : p.reject(new Error(e.data.error || 'worker-failed'));
      };
      worker.onerror = () => {
        broken = true;
        for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error('worker-crashed')); }
        pending.clear();
      };
      return true;
    } catch (e) {
      broken = true;
      return false;
    }
  }

  function process(bitmap, opts, transfer) {
    return new Promise((resolve, reject) => {
      if (!ensure()) { reject(new Error('worker-unavailable')); return; }
      const id = ++seq;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error('worker-timeout'));
      }, opts.timeoutMs || 30000);
      pending.set(id, { resolve, reject, timer });
      const list = transfer === undefined ? [bitmap] : transfer;
      worker.postMessage({ id, bmp: bitmap, ...opts }, list);
    });
  }

  return { supported, get ready() { return !!worker && !broken; }, get broken() { return broken; }, process };
})();
