window.VT = window.VT || {};

/* U18 · Diagram Studio — a local-first, SVG diagram/flowchart bench. Author typed nodes (rectangle,
 * diamond, capsule, note), connect them with orthogonal arrows, drag nodes on a grid-snapping canvas,
 * undo/redo the whole diagram, autosave + reopen named projects from IndexedDB, and export clean SVG
 * markup or a rasterized PNG. The diagram is a small validated data model; the same model drives the
 * on-screen SVG and the exported markup — no eval, no raw HTML, no external assets, nothing uploaded.
 */
VT.modules['diagram-studio'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const SVGNS = 'http://www.w3.org/2000/svg';
  const KEY = 'diagram-studio';
  const TOOL = 'diagram-studio';
  const AUTOSAVE_ID = 'diagram-studio:autosave';
  const LEGACY_AUTOSAVE_ID = 'ds:autosave';
  const GRID = 24;
  const SNAP = 8;

  const KINDS = ['rect', 'diamond', 'capsule', 'note'];

  let alive = false;
  let refs = {};
  let hist = null;
  let autosave = null;
  let doc = null;
  let selectedId = null;
  let edgeFrom = null;
  let drag = null;
  let seq = 1;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const snapv = (v) => (doc.canvas.snap ? Math.round(v / SNAP) * SNAP : Math.round(v));

  function DEFAULT_DOC() {
    return { name: t('ds.docDefault'), canvas: { w: 720, h: 480, bg: '#F2FAFE', grid: true, snap: true, zoom: 1 }, nodes: [], edges: [] };
  }

  const KIND_GLYPH = {
    rect: '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.6" y="3.6" width="10.8" height="6.8" rx="1.4"/></svg>',
    diamond: '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M7 1.8 12.4 7 7 12.2 1.6 7Z"/></svg>',
    capsule: '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="1.6" y="4.1" width="10.8" height="5.8" rx="2.9"/></svg>',
    note: '<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M2.4 2.2h7l2.2 2.2v7.4H2.4Z"/><path d="M9.4 2.2v2.2h2.2"/></svg>'
  };
  const KIND_LABEL = { rect: 'ds.kRect', diamond: 'ds.kDiamond', capsule: 'ds.kCapsule', note: 'ds.kNote' };

  const KIND_STYLE = {
    rect:    { w: 168, h: 84, fill: '#DCEEFA', stroke: '#127CA8' },
    diamond: { w: 184, h: 104, fill: '#DCF1EA', stroke: '#0E8C8C' },
    capsule: { w: 150, h: 64, fill: '#DCEEFA', stroke: '#127CA8' },
    note:    { w: 176, h: 96, fill: '#FBF0D8', stroke: '#D9962E' }
  };

  function newNode(kind, x, y) {
    const st = KIND_STYLE[kind] || KIND_STYLE.rect;
    const gx = x == null ? doc.canvas.w / 2 - st.w / 2 : x;
    const gy = y == null ? doc.canvas.h / 2 - st.h / 2 : y;
    return { id: 'n' + (seq++), kind, label: t('ds.newNode') + ' ' + (doc.nodes.length + 1),
      x: snapv(gx), y: snapv(gy), w: st.w, h: st.h, fill: st.fill, stroke: st.stroke };
  }

  function center(n) { return { cx: n.x + n.w / 2, cy: n.y + n.h / 2 }; }

  function SAMPLE_DOC() {
    const s = DEFAULT_DOC();
    const a = Object.assign(newNode('capsule', 40, 40), { label: t('ds.sStart') });
    const b = Object.assign(newNode('rect', 280, 40), { label: t('ds.sProcess') });
    const c = Object.assign(newNode('diamond', 248, 200), { label: t('ds.sDecision') });
    const d = Object.assign(newNode('capsule', 520, 210), { label: t('ds.sEnd') });
    a.x = 40; a.y = 60; b.x = 300; b.y = 60; c.x = 260; c.y = 220; d.x = 540; d.y = 220;
    s.nodes = [a, b, c, d];
    s.edges = [
      { id: 'e' + (seq++), from: a.id, to: b.id, label: '' },
      { id: 'e' + (seq++), from: b.id, to: c.id, label: '' },
      { id: 'e' + (seq++), from: c.id, to: d.id, label: t('ds.sYes') }
    ];
    return s;
  }

  function normalizeDoc(d) {
    const x = d && typeof d === 'object' ? d : {};
    const c = x.canvas && typeof x.canvas === 'object' ? x.canvas : {};
    const nodes = Array.isArray(x.nodes) ? x.nodes.filter((n) => n && typeof n === 'object').map((n) => ({
      id: (typeof n.id === 'string' && n.id) || 'n' + (seq++),
      kind: KINDS.indexOf(n.kind) >= 0 ? n.kind : 'rect',
      label: typeof n.label === 'string' ? n.label : '',
      x: Number.isFinite(n.x) ? n.x : 40, y: Number.isFinite(n.y) ? n.y : 40,
      w: clamp(Number(n.w) || 168, 40, 640), h: clamp(Number(n.h) || 84, 32, 480),
      fill: typeof n.fill === 'string' ? n.fill : '#DCEEFA',
      stroke: typeof n.stroke === 'string' ? n.stroke : '#127CA8'
    })) : [];
    const ids = {}; nodes.forEach((n) => { ids[n.id] = n; });
    const edges = Array.isArray(x.edges) ? x.edges.filter((e) => e && ids[e.from] && ids[e.to]).map((e) => ({
      id: (typeof e.id === 'string' && e.id) || 'e' + (seq++), from: e.from, to: e.to,
      label: typeof e.label === 'string' ? e.label : ''
    })) : [];
    seq = nodes.reduce((m, n) => Math.max(m, Number(String(n.id).replace(/\D/g, '')) || 0), seq);
    return {
      name: typeof x.name === 'string' ? x.name : t('ds.docDefault'),
      canvas: {
        w: clamp(Number(c.w) || 720, 240, 2000), h: clamp(Number(c.h) || 480, 200, 1600),
        bg: typeof c.bg === 'string' ? c.bg : '#F2FAFE',
        grid: c.grid !== false, snap: c.snap !== false, zoom: clamp(Number(c.zoom) || 1, 0.5, 2)
      },
      nodes, edges
    };
  }

  // ---------- edge routing (orthogonal elbow) ----------
  function anchor(n, side) {
    const c = center(n);
    if (side === 'L') return { x: n.x, y: c.cy };
    if (side === 'R') return { x: n.x + n.w, y: c.cy };
    if (side === 'T') return { x: c.cx, y: n.y };
    return { x: c.cx, y: n.y + n.h };
  }
  function buildEdgePath(a, b) {
    const ca = center(a), cb = center(b);
    const dx = cb.cx - ca.cx, dy = cb.cy - ca.cy;
    let p, q;
    if (Math.abs(dx) >= Math.abs(dy)) {
      p = anchor(a, dx >= 0 ? 'R' : 'L'); q = anchor(b, dx >= 0 ? 'L' : 'R');
      const mx = (p.x + q.x) / 2;
      return 'M' + p.x + ' ' + p.y + ' L' + mx + ' ' + p.y + ' L' + mx + ' ' + q.y + ' L' + q.x + ' ' + q.y;
    }
    p = anchor(a, dy >= 0 ? 'B' : 'T'); q = anchor(b, dy >= 0 ? 'T' : 'B');
    const my = (p.y + q.y) / 2;
    return 'M' + p.x + ' ' + p.y + ' L' + p.x + ' ' + my + ' L' + q.x + ' ' + my + ' L' + q.x + ' ' + q.y;
  }
  function edgeMid(a, b) {
    const ca = center(a), cb = center(b);
    return { x: (ca.cx + cb.cx) / 2, y: (ca.cy + cb.cy) / 2 };
  }

  function makeShapeEl(n) {
    let el;
    if (n.kind === 'diamond') {
      el = document.createElementNS(SVGNS, 'polygon');
      el.setAttribute('points', (n.w / 2) + ',0 ' + n.w + ',' + (n.h / 2) + ' ' + (n.w / 2) + ',' + n.h + ' 0,' + (n.h / 2));
    } else if (n.kind === 'capsule') {
      el = document.createElementNS(SVGNS, 'rect');
      el.setAttribute('x', 0); el.setAttribute('y', 0); el.setAttribute('width', n.w); el.setAttribute('height', n.h);
      el.setAttribute('rx', n.h / 2);
    } else {
      el = document.createElementNS(SVGNS, 'rect');
      el.setAttribute('x', 0); el.setAttribute('y', 0); el.setAttribute('width', n.w); el.setAttribute('height', n.h);
      el.setAttribute('rx', n.kind === 'note' ? 4 : 10);
    }
    el.setAttribute('fill', n.fill); el.setAttribute('stroke', n.stroke); el.setAttribute('stroke-width', 2);
    return el;
  }

  function renderDiagram() {
    if (!refs.svg) return;
    while (refs.svg.firstChild) refs.svg.removeChild(refs.svg.firstChild);
    refs.svg.setAttribute('viewBox', '0 0 ' + doc.canvas.w + ' ' + doc.canvas.h);
    refs.svg.setAttribute('width', Math.round(doc.canvas.w * doc.canvas.zoom));
    refs.svg.setAttribute('height', Math.round(doc.canvas.h * doc.canvas.zoom));
    if (refs.sheet) refs.sheet.style.background = doc.canvas.bg;

    const defs = document.createElementNS(SVGNS, 'defs');
    defs.innerHTML = '<marker id="ds-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#127CA8"></path></marker>';
    refs.svg.appendChild(defs);

    if (doc.canvas.grid) {
      // The grid is the bench's measuring line, so it has to survive a light
      // paper: minor lines every GRID, a stronger one every fifth.
      const gg = document.createElementNS(SVGNS, 'g');
      const line = (x1, y1, x2, y2, major) => {
        const ln = document.createElementNS(SVGNS, 'line');
        ln.setAttribute('x1', x1); ln.setAttribute('y1', y1); ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
        ln.setAttribute('stroke', major ? 'rgba(11,110,150,.16)' : 'rgba(11,110,150,.07)');
        ln.setAttribute('stroke-width', major ? 1.2 : 1);
        gg.appendChild(ln);
      };
      for (let gx = GRID; gx < doc.canvas.w; gx += GRID) line(gx, 0, gx, doc.canvas.h, gx % (GRID * 5) === 0);
      for (let gy = GRID; gy < doc.canvas.h; gy += GRID) line(0, gy, doc.canvas.w, gy, gy % (GRID * 5) === 0);
      refs.svg.appendChild(gg);
    }

    const byId = {}; doc.nodes.forEach((n) => { byId[n.id] = n; });
    const eg = document.createElementNS(SVGNS, 'g');
    doc.edges.forEach((e) => {
      const a = byId[e.from], b = byId[e.to]; if (!a || !b) return;
      const d = buildEdgePath(a, b);
      const isSel = e.id === selectedEdgeId;
      const path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', d); path.setAttribute('class', 'ds-edge-line');
      path.setAttribute('fill', 'none'); path.setAttribute('stroke', isSel ? '#D9962E' : '#127CA8');
      path.setAttribute('stroke-width', isSel ? 3 : 2); path.setAttribute('marker-end', 'url(#ds-arrow)');
      path.setAttribute('opacity', edgeFrom ? '0.9' : '0.75'); eg.appendChild(path);
      const hit = document.createElementNS(SVGNS, 'path');
      hit.setAttribute('d', d); hit.setAttribute('class', 'ds-edge');
      hit.setAttribute('fill', 'none'); hit.setAttribute('stroke', 'transparent'); hit.setAttribute('stroke-width', 16);
      hit.dataset.edge = e.id; eg.appendChild(hit);
      if (e.label) {
        const m = edgeMid(a, b);
        const tx = document.createElementNS(SVGNS, 'text');
        tx.setAttribute('x', m.x); tx.setAttribute('y', m.y - 3); tx.setAttribute('class', 'ds-elabel');
        tx.setAttribute('text-anchor', 'middle'); tx.textContent = e.label; eg.appendChild(tx);
      }
    });
    refs.svg.appendChild(eg);

    doc.nodes.forEach((n) => {
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 'ds-node' + (n.id === selectedId ? ' is-sel' : '') + (n.id === edgeFrom ? ' is-link' : ''));
      g.setAttribute('transform', 'translate(' + n.x + ' ' + n.y + ')'); g.dataset.node = n.id;
      g.appendChild(makeShapeEl(n));
      if (n.kind === 'note') { const fold = document.createElementNS(SVGNS, 'path');
        fold.setAttribute('d', 'M' + (n.w - 16) + ' 0 L' + n.w + ' 16'); fold.setAttribute('stroke', n.stroke); fold.setAttribute('fill', 'none'); g.appendChild(fold); }
      const tx = document.createElementNS(SVGNS, 'text');
      tx.setAttribute('x', n.w / 2); tx.setAttribute('y', n.h / 2 + 4); tx.setAttribute('class', 'ds-label');
      tx.setAttribute('text-anchor', 'middle'); tx.textContent = n.label; g.appendChild(tx);
      refs.svg.appendChild(g);
    });
  }

  // ---------- plumbing + ops ----------
  const canonical = () => JSON.stringify(doc);
  function record() { if (hist) { hist.record(canonical()); syncHist(); } }
  function scheduleSave() { if (autosave) autosave(); }
  const saveSoon = U.debounce(() => { if (!alive || !VT.db.available) return; VT.db.put({ id: AUTOSAVE_ID, tool: TOOL, name: '(autosave)', data: doc }).catch(() => {}); }, 600);
  function flushSave() { if (!alive || !VT.db.available) return; VT.db.put({ id: AUTOSAVE_ID, tool: TOOL, name: '(autosave)', data: doc }).catch(() => {}); }
  function syncHist() { if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo(); if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo(); }
  function commitRender() { renderDiagram(); updateStats(); }

  // Zoom is a view setting: it persists with the document but is deliberately
  // outside the undo stack, so undoing a node never rescales the bench.
  function setZoom(z) {
    doc.canvas.zoom = clamp(Math.round(z * 100) / 100, 0.5, 2);
    if (refs.zoomVal) refs.zoomVal.textContent = Math.round(doc.canvas.zoom * 100) + '%';
    renderDiagram();
    scheduleSave();
  }
  function fitZoom() {
    const wrap = refs.svg && refs.svg.closest('.mat');
    if (!wrap) return;
    setZoom((wrap.clientWidth - 46) / doc.canvas.w);
  }
  function applyDoc(next) {
    doc = normalizeDoc(next);
    selectedId = null; edgeFrom = null;
    if (hist) hist.reset(canonical());
    syncHist(); commitRender(); renderMeta(); flushSave();
  }
  function addNode(kind) {
    const n = newNode(kind, doc.canvas.w / 2 - (KIND_STYLE[kind].w / 2) + (doc.nodes.length % 5) * 16, 40 + (doc.nodes.length % 5) * 16);
    doc.nodes.push(n); selectedId = n.id; commitRender(); updateInspector(); record(); scheduleSave();
  }
  function getNode(id) { return doc.nodes.find((n) => n.id === id) || null; }
  function deleteNode(id) {
    const n = getNode(id);
    VT.ui.confirm({ title: t('ds.delNode'), body: t('ds.delNodeQ', { name: (n && n.label) || '' }), confirmLabel: t('ds.del'), danger: true }).then((yes) => {
      if (!yes) return;
      doc.nodes = doc.nodes.filter((x) => x.id !== id);
      doc.edges = doc.edges.filter((e) => e.from !== id && e.to !== id);
      if (selectedId === id) selectedId = null; if (edgeFrom === id) edgeFrom = null;
      commitRender(); record(); scheduleSave();
    });
  }
  function selectNode(id) { selectedId = id; edgeFrom = null; renderDiagram(); updateInspector(); }
  function moveNode(id, x, y) {
    const n = getNode(id); if (!n) return;
    n.x = snapv(clamp(x, 0, doc.canvas.w - n.w)); n.y = snapv(clamp(y, 0, doc.canvas.h - n.h));
    renderDiagram();
  }
  function setLabel(id, val) { const n = getNode(id); if (!n) return; n.label = val; renderDiagram(); scheduleSave(); record(); }
  function setEdgeLabel(id, val) { const e = doc.edges.find((x) => x.id === id); if (!e) return; e.label = val; renderDiagram(); scheduleSave(); record(); }
  function linkNodes() {
    if (!edgeFrom || !selectedId || edgeFrom === selectedId) { edgeFrom = null; renderDiagram(); toast(t('ds.linkPick'), 'info'); return; }
    const exists = doc.edges.some((e) => e.from === edgeFrom && e.to === selectedId);
    if (!exists) doc.edges.push({ id: 'e' + (seq++), from: edgeFrom, to: selectedId, label: '' });
    const to = selectedId; edgeFrom = null; selectedId = to;
    commitRender(); record(); scheduleSave(); toast(t('ds.linked'), 'success');
  }
  function startLink() {
    if (!selectedId) { toast(t('ds.pickFirst'), 'info'); return; }
    edgeFrom = selectedId; toast(t('ds.pickTarget'), 'info'); renderDiagram();
  }

  function stats() { return { nodes: doc.nodes.length, edges: doc.edges.length }; }
  function updateStats() { if (refs.empty) refs.empty.hidden = doc.nodes.length > 0;
    if (!refs.stats) return; const s = stats(); refs.stats.textContent = t('ds.stats', { nodes: s.nodes, edges: s.edges }); }
  function renderMeta() {
    if (!refs.name) return;
    refs.name.value = doc.name; refs.grid && (refs.grid.checked = doc.canvas.grid); refs.snap && (refs.snap.checked = doc.canvas.snap);
    if (refs.zoomVal) refs.zoomVal.textContent = Math.round((doc.canvas.zoom || 1) * 100) + '%';
    refs.cw && (refs.cw.value = doc.canvas.w); refs.ch && (refs.ch.value = doc.canvas.h);
  }

  // ---------- export (same model → markup / raster) ----------
  function svgMarkup() {
    const byId = {}; doc.nodes.forEach((n) => { byId[n.id] = n; });
    let e = '<defs><marker id="ds-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#127CA8"/></marker></defs>';
    doc.edges.forEach((ed) => { const a = byId[ed.from], b = byId[ed.to]; if (!a || !b) return;
      e += '<path d="' + buildEdgePath(a, b) + '" fill="none" stroke="#127CA8" stroke-width="2" marker-end="url(#ds-arrow)"/>';
      if (ed.label) { const m = edgeMid(a, b); e += '<text x="' + m.x + '" y="' + (m.y - 3) + '" text-anchor="middle" fill="#BFEFFF" font-family="Inter,system-ui,sans-serif" font-size="12">' + esc(ed.label) + '</text>'; }
    });
    doc.nodes.forEach((n) => {
      e += '<g transform="translate(' + n.x + ' ' + n.y + ')">';
      if (n.kind === 'diamond') e += '<polygon points="' + (n.w / 2) + ',0 ' + n.w + ',' + (n.h / 2) + ' ' + (n.w / 2) + ',' + n.h + ' 0,' + (n.h / 2) + '" fill="' + esc(n.fill) + '" stroke="' + esc(n.stroke) + '" stroke-width="2"/>';
      else if (n.kind === 'capsule') e += '<rect width="' + n.w + '" height="' + n.h + '" rx="' + (n.h / 2) + '" fill="' + esc(n.fill) + '" stroke="' + esc(n.stroke) + '" stroke-width="2"/>';
      else e += '<rect width="' + n.w + '" height="' + n.h + '" rx="' + (n.kind === 'note' ? 4 : 10) + '" fill="' + esc(n.fill) + '" stroke="' + esc(n.stroke) + '" stroke-width="2"/>';
      e += '<text x="' + (n.w / 2) + '" y="' + (n.h / 2 + 4) + '" text-anchor="middle" fill="#08293A" font-family="Inter,system-ui,sans-serif" font-size="13">' + esc(n.label) + '</text></g>';
    });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + doc.canvas.w + '" height="' + doc.canvas.h + '" viewBox="0 0 ' + doc.canvas.w + ' ' + doc.canvas.h + '">' + e + '</svg>';
  }
  function exportSVG() { U.downloadText(svgMarkup(), safeName() + '.svg', 'image/svg+xml'); toast(t('ds.exportedSvg'), 'success'); }
  function exportPNG() {
    const svg = svgMarkup();
    const img = new Image();
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    img.onload = () => {
      const scale = 2; const c = document.createElement('canvas');
      c.width = doc.canvas.w * scale; c.height = doc.canvas.h * scale;
      const ctx = c.getContext('2d');
      ctx.fillStyle = doc.canvas.bg; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob((blob) => { if (blob) { U.downloadBlob(blob, safeName() + '.png'); toast(t('ds.exportedPng'), 'success'); } }, 'image/png');
    };
    img.onerror = () => toast(t('ds.exportFail'), 'error');
    img.src = url;
  }
  function safeName() { return ((doc.name || 'diagram').replace(/[^\w-]+/g, '_')).slice(0, 60); }

  // ---------- pointer interaction ----------
  function clientToSvg(ev) {
    const pt = refs.svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const m = refs.svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    return pt.matrixTransform(m.inverse());
  }
  let selectedEdgeId = null;
  function onPointerDown(ev) {
    if (!alive) return;
    const p = clientToSvg(ev);
    const g = ev.target.closest && ev.target.closest('g.ds-node');
    if (!g) {
      const eh = ev.target.closest && ev.target.closest('path.ds-edge');
      if (edgeFrom) edgeFrom = null;
      if (eh) { selectedId = null; selectedEdgeId = eh.dataset.edge; renderDiagram(); updateInspector(); return; }
      selectedId = null; selectedEdgeId = null; renderDiagram(); updateInspector(); return;
    }
    const id = g.dataset.node;
    if (edgeFrom && edgeFrom !== id) {
      const from = edgeFrom; edgeFrom = null;
      if (!doc.edges.some((e) => e.from === from && e.to === id)) doc.edges.push({ id: 'e' + (seq++), from, to: id, label: '' });
      selectedId = id; commitRender(); record(); scheduleSave(); updateInspector(); toast(t('ds.linked'), 'success'); return;
    }
    edgeFrom = null; selectedEdgeId = null;
    selectNode(id);
    const n = getNode(id); if (!n) return;
    drag = { id, offX: n.x - p.x, offY: n.y - p.y, moved: false };
    ev.preventDefault();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }
  function onPointerMove(ev) {
    if (!drag) return;
    const p = clientToSvg(ev);
    const before = getNode(drag.id);
    const nx = snapv(clamp(p.x + drag.offX, 0, doc.canvas.w - before.w));
    const ny = snapv(clamp(p.y + drag.offY, 0, doc.canvas.h - before.h));
    if (nx !== before.x || ny !== before.y) drag.moved = true;
    moveNode(drag.id, p.x + drag.offX, p.y + drag.offY);
  }
  function onPointerUp() {
    if (drag && drag.moved) { record(); scheduleSave(); }
    drag = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  function updateInspector() {
    if (!refs.label) return;
    const n = getNode(selectedId);
    if (n) {
      refs.insp.hidden = false; refs.inspEdge.hidden = true; refs.inspNode.hidden = false;
      refs.label.value = n.label; refs.kw.value = n.w; refs.kh.value = n.h;
      refs.fill.value = n.fill; refs.stroke.value = n.stroke;
      if (refs.kind) refs.kind.value = n.kind;
    } else {
      refs.inspNode.hidden = true;
      const e = doc.edges.find((x) => x.id === selectedEdgeId);
      if (e) { refs.inspEdge.hidden = false; refs.elabel.value = e.label; }
      else refs.inspEdge.hidden = true;
    }
    if (!n && !doc.edges.find((x) => x.id === selectedEdgeId)) refs.insp.hidden = true;
    if (refs.noSel) refs.noSel.hidden = !refs.insp.hidden;
  }

  // ---------- document load + projects ----------
  function loadDoc() {
    if (!VT.db.available) { doc = DEFAULT_DOC(); selectedId = null; commitRender(); renderMeta(); updateInspector(); return Promise.resolve(); }
    return VT.db.get(AUTOSAVE_ID).then((rec) => {
      if (rec) return rec.tool === TOOL ? rec : null;
      return VT.db.get(LEGACY_AUTOSAVE_ID).then((legacy) => legacy && legacy.tool === TOOL ? legacy : null);
    }).then((rec) => {
      doc = normalizeDoc(rec && rec.data ? rec.data : DEFAULT_DOC());
      selectedId = null; edgeFrom = null;
      if (hist) hist.reset(canonical());
      syncHist(); commitRender(); renderMeta(); updateInspector();
    }).catch(() => { doc = DEFAULT_DOC(); commitRender(); renderMeta(); updateInspector(); });
  }
  function loadProjects() {
    if (!refs.projList) return;
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty dg-empty">' + esc(t('ds.dbUnavailable')) + '</div>'; return; }
    VT.db.list(TOOL).then((rows) => {
      const named = rows.filter((r) => r.id !== AUTOSAVE_ID && r.id !== LEGACY_AUTOSAVE_ID);
      refs.projList.innerHTML = '';
      if (!named.length) { refs.projList.innerHTML = '<div class="bench-empty dg-empty">' + esc(t('ds.noProjects')) + '</div>'; return; }
      named.forEach((r) => {
        const row = document.createElement('div'); row.className = 'bench-row dg-proj-row';
        const info = document.createElement('div'); info.className = 'dg-proj-info';
        const st = document.createElement('strong'); st.textContent = r.name || t('ds.untitled');
        const sm = document.createElement('span'); sm.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(st, sm);
        const open = document.createElement('button'); open.className = 'btn btn-ghost btn-sm'; open.textContent = t('ds.open');
        open.addEventListener('click', () => { flushSave(); applyDoc(r.data); toast(t('ds.projOpened', { name: r.name || t('ds.untitled') }), 'success'); });
        const del = document.createElement('button'); del.className = 'btn btn-ghost btn-sm'; del.textContent = 'x'; del.title = t('ds.del');
        del.addEventListener('click', () => { VT.db.remove(r.id).then(loadProjects).catch(() => toast(t('ds.dbError'), 'error')); });
        row.append(info, open, del); refs.projList.append(row);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty dg-empty">' + esc(t('ds.dbError')) + '</div>'; });
  }
  function saveProject() {
    if (!VT.db.available) { toast(t('ds.dbUnavailable'), 'error'); return; }
    const name = (refs.projName.value || '').trim() || doc.name || t('ds.untitled');
    flushSave();
    VT.db.put({ tool: TOOL, name, data: doc }).then(() => { toast(t('ds.projSaved', { name }), 'success'); refs.projName.value = ''; loadProjects(); }).catch(() => toast(t('ds.dbError'), 'error'));
  }

  // ---------- mount ----------
  function mount(root) {
    alive = true;
    const I = VT.icons;
    root.innerHTML =
      '<div class="dg-stage">'
      + '<div class="dg-bar bench">'
      + '<div class="bench-rail-group">'
      + '<button class="btn btn-primary btn-sm" id="ds-new">' + I.plus + ' ' + t('ds.new') + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="ds-sample">' + I.sparkle + ' ' + t('ds.sample') + '</button>'
      + '</div>'
      + '<span class="bench-sep"></span>'
      + '<div class="bench-rail-group">'
      + '<button class="btn btn-ghost btn-sm btn-icon" id="ds-undo" data-tip="' + t('hist.undo.tip') + '">' + I.undo + '</button>'
      + '<button class="btn btn-ghost btn-sm btn-icon" id="ds-redo" data-tip="' + t('hist.redo.tip') + '">' + I.redo + '</button>'
      + '</div>'
      + '<span class="bench-sep"></span>'
      + '<div class="dg-tools" role="group" aria-label="' + t('ds.addGroup') + '">'
      + Object.keys(KIND_STYLE).map((k) => '<button class="dg-tool ds-kind" data-kind="' + k + '">' + KIND_GLYPH[k] + '<span>' + t(KIND_LABEL[k]) + '</span></button>').join('')
      + '</div>'
      + '<button class="btn btn-ghost btn-sm" id="ds-link">' + I.link + ' ' + t('ds.link') + '</button>'
      + '<button class="btn btn-ghost btn-sm btn-danger" id="ds-del">' + t('ds.del') + '</button>'
      + '<div class="dg-bar-actions"><span class="ds-stats" id="ds-stats"></span>'
      + '<div class="dg-zoom" role="group" aria-label="' + t('ds.zoomGroup') + '">'
      + '<button class="dg-zbtn" id="ds-zoom-out" aria-label="' + t('ds.zoomOut') + '">&#8722;</button>'
      + '<button class="dg-zval" id="ds-zoom-val" data-tip="' + t('ds.zoomResetTip') + '">100%</button>'
      + '<button class="dg-zbtn" id="ds-zoom-in" aria-label="' + t('ds.zoomIn') + '">+</button>'
      + '<button class="dg-zfit" id="ds-zoom-fit">' + t('ds.fit') + '</button>'
      + '</div>'
      + '<button class="btn btn-sm" id="ds-exp-svg">' + I.download + ' ' + t('ds.exportSvg') + '</button>'
      + '<button class="btn btn-sm" id="ds-exp-png">' + I.download + ' ' + t('ds.exportPng') + '</button>'
      + '</div></div>'
      + '<div class="dg-work">'
      + '<div class="ds-canvas-wrap mat glass">'
      + '<div class="mat-sheet" id="ds-sheet"><svg id="ds-svg" class="ds-svg" xmlns="http://www.w3.org/2000/svg"></svg></div>'
      + '<div class="mat-empty" id="ds-canvas-empty" hidden>'
      + '<span class="orb orb-lg">' + I.branch + '</span>'
      + '<div class="mat-empty-title">' + t('ds.emptyTitle') + '</div>'
      + '<p class="mat-empty-body">' + t('ds.emptyBody') + '</p>'
      + '<div class="mat-empty-cta"><button class="btn btn-primary btn-sm" id="ds-empty-sample">' + I.sparkle + ' ' + t('ds.emptyCta') + '</button>'
      + '<span class="mat-empty-keys"><span class="kbd">Ctrl</span> + <span class="kbd">Z</span> ' + t('ds.emptyUndo') + '</span>'
      + '</div></div></div>'
      + '<div class="dg-side">'
      + '<section class="bench-sec glass"><h3 class="bench-sec-head">' + t('ds.secCanvas') + '</h3>'
      + '<div class="ds-field"><label>' + t('ds.name') + '</label><input class="input" id="ds-name" type="text"></div>'
      + '<div class="ds-grid2">'
      + '<label class="ds-size"><span>' + t('ds.width') + '</span><input class="input" id="ds-cw" type="number" min="240" max="2000" step="8"></label>'
      + '<label class="ds-size"><span>' + t('ds.height') + '</span><input class="input" id="ds-ch" type="number" min="200" max="1600" step="8"></label>'
      + '</div>'
      + '<div class="ds-toggles"><label class="ds-check"><input id="ds-grid" type="checkbox"><span>' + t('ds.grid') + '</span></label>'
      + '<label class="ds-check"><input id="ds-snap" type="checkbox"><span>' + t('ds.snap') + '</span></label></div>'
      + '</section>'
      + '<section class="bench-sec glass" id="ds-insp" hidden><h3 class="bench-sec-head">' + t('ds.secSelection') + '</h3>'
      + '<div class="ds-insp-node" id="ds-insp-node">'
      + '<label>' + t('ds.label') + '</label><input class="input" id="ds-label" type="text">'
      + '<div class="ds-grid2">'
      + '<label class="ds-size"><span>' + t('ds.width') + '</span><input class="input" id="ds-kw" type="number" min="40" max="640" step="4"></label>'
      + '<label class="ds-size"><span>' + t('ds.height') + '</span><input class="input" id="ds-kh" type="number" min="32" max="480" step="4"></label>'
      + '</div>'
      + '<div class="ds-colors"><label class="dg-color"><span>' + t('ds.fill') + '</span><input class="bench-color" id="ds-fill" type="color"></label>'
      + '<label class="dg-color"><span>' + t('ds.stroke') + '</span><input class="bench-color" id="ds-stroke" type="color"></label></div>'
      + '<label>' + t('ds.kind') + '</label><select class="input" id="ds-kind"><option value="rect">' + t('ds.kRect') + '</option><option value="diamond">' + t('ds.kDiamond') + '</option><option value="capsule">' + t('ds.kCapsule') + '</option><option value="note">' + t('ds.kNote') + '</option></select>'
      + '</div>'
      + '<div class="ds-insp-edge" id="ds-insp-edge"><label>' + t('ds.edgeLabel') + '</label><input class="input" id="ds-elabel" type="text"></div>'
      + '</section>'
      + '<section class="bench-sec bench-sec--quiet glass" id="ds-nosel"><h3 class="bench-sec-head">' + t('ds.secSelection') + '</h3>'
      + '<p>' + t('ds.noSel') + '</p></section>'
      + '<section class="bench-sec glass"><h3 class="bench-sec-head">' + t('ds.projects') + '</h3>'
      + '<div class="dg-proj-save"><input class="input" id="ds-proj-name" type="text" placeholder="' + t('ds.projNamePh') + '"><button class="btn btn-primary btn-sm" id="dg-proj-save">' + t('ds.save') + '</button></div>'
      + '<div class="bench-list ds-proj-list" id="ds-proj-list"></div></section>'
      + '</div></div>'
      + '<p class="privacy-line">' + I.shield + ' ' + t('ds.privacy') + '</p>'
      + '</div>';

    refs = {
      svg: $('#ds-svg', root), stats: $('#ds-stats', root), undo: $('#ds-undo', root), redo: $('#ds-redo', root),
      name: $('#ds-name', root), cw: $('#ds-cw', root), ch: $('#ds-ch', root), grid: $('#ds-grid', root), snap: $('#ds-snap', root),
      insp: $('#ds-insp', root), inspNode: $('#ds-insp-node', root), inspEdge: $('#ds-insp-edge', root),
      label: $('#ds-label', root), kw: $('#ds-kw', root), kh: $('#ds-kh', root), fill: $('#ds-fill', root), stroke: $('#ds-stroke', root),
      kind: $('#ds-kind', root), elabel: $('#ds-elabel', root), projName: $('#ds-proj-name', root), projList: $('#ds-proj-list', root),
      sheet: $('#ds-sheet', root), empty: $('#ds-canvas-empty', root), noSel: $('#ds-nosel', root),
      zoomOut: $('#ds-zoom-out', root), zoomIn: $('#ds-zoom-in', root), zoomVal: $('#ds-zoom-val', root), zoomFit: $('#ds-zoom-fit', root)
    };

    autosave = saveSoon;
    hist = VT.history.create({ equal: (a, b) => a === b, apply: (val) => { doc = normalizeDoc(JSON.parse(val)); commitRender(); renderMeta(); updateInspector(); syncHist(); } });

    $('#ds-new', root).addEventListener('click', () => { flushSave(); applyDoc(DEFAULT_DOC()); toast(t('ds.newDone'), 'success'); });
    $('#ds-sample', root).addEventListener('click', () => { flushSave(); applyDoc(SAMPLE_DOC()); });
    $('#ds-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#ds-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });
    $$('.ds-kind', root).forEach((b) => b.addEventListener('click', () => addNode(b.dataset.kind)));
    $('#ds-link', root).addEventListener('click', startLink);
    refs.zoomOut.addEventListener('click', () => setZoom(doc.canvas.zoom - 0.15));
    refs.zoomIn.addEventListener('click', () => setZoom(doc.canvas.zoom + 0.15));
    refs.zoomVal.addEventListener('click', () => setZoom(1));
    refs.zoomFit.addEventListener('click', fitZoom);
    $('#ds-empty-sample', root).addEventListener('click', () => { flushSave(); applyDoc(SAMPLE_DOC()); });
    $('#ds-del', root).addEventListener('click', () => {
      if (selectedId) deleteNode(selectedId);
      else if (selectedEdgeId) { const e = doc.edges.find((x) => x.id === selectedEdgeId); if (e) { doc.edges = doc.edges.filter((x) => x.id !== e.id); selectedEdgeId = null; commitRender(); record(); scheduleSave(); updateInspector(); } }
    });
    refs.svg.addEventListener('pointerdown', onPointerDown);
    $('#ds-exp-svg', root).addEventListener('click', exportSVG);
    $('#ds-exp-png', root).addEventListener('click', exportPNG);

    refs.name.addEventListener('input', () => { doc.name = refs.name.value; scheduleSave(); record(); });
    const sizeChanged = () => { doc.canvas.w = clamp(Number(refs.cw.value) || 720, 240, 2000); doc.canvas.h = clamp(Number(refs.ch.value) || 480, 200, 1600); commitRender(); record(); scheduleSave(); };
    refs.cw.addEventListener('change', sizeChanged); refs.ch.addEventListener('change', sizeChanged);
    refs.grid.addEventListener('change', () => { doc.canvas.grid = refs.grid.checked; renderDiagram(); record(); scheduleSave(); });
    refs.snap.addEventListener('change', () => { doc.canvas.snap = refs.snap.checked; record(); scheduleSave(); });

    const bindInsp = (inp, fn) => { inp.addEventListener('input', () => { if (!selectedId) return; fn(getNode(selectedId), inp.value); scheduleSave(); }); inp.addEventListener('change', () => { if (selectedId) record(); }); };
    bindInsp(refs.label, (n, v) => { n.label = v; renderDiagram(); });
    bindInsp(refs.kw, (n, v) => { n.w = clamp(Number(v) || n.w, 40, 640); renderDiagram(); });
    bindInsp(refs.kh, (n, v) => { n.h = clamp(Number(v) || n.h, 32, 480); renderDiagram(); });
    bindInsp(refs.fill, (n, v) => { n.fill = v; renderDiagram(); });
    bindInsp(refs.stroke, (n, v) => { n.stroke = v; renderDiagram(); });
    refs.kind.addEventListener('change', () => { const n = getNode(selectedId); if (!n) return; const st = KIND_STYLE[refs.kind.value]; n.kind = refs.kind.value; n.w = st.w; n.h = st.h; n.fill = st.fill; n.stroke = st.stroke; renderDiagram(); updateInspector(); record(); scheduleSave(); });
    refs.elabel.addEventListener('input', () => { const e = doc.edges.find((x) => x.id === selectedEdgeId); if (e) { e.label = refs.elabel.value; renderDiagram(); scheduleSave(); } });
    refs.elabel.addEventListener('change', () => record());
    $('#dg-proj-save', root).addEventListener('click', saveProject);

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) syncHist();
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) { deleteNode(selectedId); }
    });

    loadDoc();
    loadProjects();
    const onLang = () => { if (!alive) return; renderMeta(); updateStats(); loadProjects(); };
    window.addEventListener('vt:lang', onLang);
    return () => { window.removeEventListener('vt:lang', onLang); flushSave(); alive = false; };
  }

  function unmount() { flushSave(); alive = false; drag = null; hist = null; autosave = null; refs = {}; doc = null; selectedId = null; edgeFrom = null; selectedEdgeId = null; }

  const def = {
    id: 'diagram-studio', cat: 'creative', icon: 'branch', version: '0.1.0',
    name: { en: 'Diagram Studio', pt: 'Estúdio de Diagramas' },
    tagline: {
      en: 'A local-first SVG flowchart bench. Author typed nodes, connect them with orthogonal arrows, drag on a grid-snapping canvas, undo/redo the whole diagram, autosave to IndexedDB and export clean SVG markup or a 2x PNG. No eval, no external assets, nothing uploaded.',
      pt: 'Um estúdio de fluxogramas SVG local-first. Crie nós tipados, conecte-os com setas ortogonais, arraste numa grade com encaixe, desfacca/refaca o diagrama, salve no IndexedDB e exporte SVG limpo ou PNG 2x. Sem eval, sem assets externos, nada enviado.'
    },
    tags: ['diagram', 'flowchart', 'svg', 'canvas', 'nodes', 'creative'],
    deps: [],
    docs: {
      en: {
        summary: 'Create and edit SVG flowcharts entirely on-device. Add typed nodes (rectangle, diamond, capsule, note), connect them with orthogonal arrows in a two-step Link flow, drag to reposition with grid snap, edit the label/size/colors of the selection, and tune the canvas. Undo/redo the whole diagram, autosave to IndexedDB and reopen where you left off, keep named projects, and export clean SVG markup or a 2x rasterized PNG from the same data model.',
        usage: [
          'Start from New or Sample, then add nodes with the Rectangle, Diamond, Capsule or Note buttons.',
          'Select the first node, press Link, then click the target node to draw the arrow.',
          'Edit the selection in the side panel: label, width and height, fill and stroke — an edge gives you its own label field.',
          'Drag a node to move it (it snaps to the grid), zoom with − / + or Fit, and delete the selected node or edge with Delete.',
          'Export SVG or a 2× PNG, undo/redo with the buttons or Ctrl+Z / Ctrl+Shift+Z, and reopen a named project where you left it.'
        ],
        privacy: 'The diagram is stored on-device (IndexedDB autosave + named projects) and never uploaded. Node/edge labels are rendered as SVG text content and escaped in the exported markup; the export is built from the same validated model. There is no eval, no raw-HTML passthrough and no network call.',
        limits: [
          'Arrows are auto-routed as three-segment orthogonal elbows with no manual waypoints, so a dense layout can overlap them.',
          'Node size is clamped to 40–640 by 32–480 inside a canvas of 240–2000 by 200–1600, and zoom stays between 0.5× and 2×.',
          'PNG is rasterized at a fixed 2× with no scale control, the diagram is kept only in IndexedDB, and undo history is the shared in-memory stack (100 snapshots) that resets when you leave the tool.'
        ]
      },
      pt: {
        summary: 'Crie e edite fluxogramas SVG inteiramente no dispositivo. Adicione nós tipados (retângulo, losango, cápsula, anotação), conecte-os com setas ortogonais num fluxo Link em duas etapas, arraste para reposicionar com encaixe na grade, edite rótulo/tamanho/cores da seleção e ajuste a tela. Desfaça/refaça o diagrama, salve no IndexedDB, mantenha projetos nomeados e exporte SVG limpo ou PNG 2× do mesmo modelo.',
        usage: [
          'Comece em Novo ou Exemplo e adicione nós pelos botões Retângulo, Losango, Cápsula ou Anotação.',
          'Selecione o primeiro nó, pressione Link e clique no nó de destino para desenhar a seta.',
          'Edite a seleção no painel lateral: rótulo, largura e altura, preenchimento e traço — uma aresta oferece o próprio campo de rótulo.',
          'Arraste um nó para movê-lo (ele encaixa na grade), amplie com − / + ou Ajustar, e exclua o nó ou a aresta selecionada com Delete.',
          'Exporte SVG ou PNG 2×, desfaça/refaça pelos botões ou com Ctrl+Z / Ctrl+Shift+Z, e reabra um projeto nomeado de onde parou.'
        ],
        privacy: 'O diagrama é armazenado no dispositivo (salvamento automático no IndexedDB + projetos nomeados) e nunca é enviado. Os rótulos de nós e arestas são texto SVG escapado no markup exportado; a exportação usa o mesmo modelo validado. Não há eval, passagem de HTML bruto nem chamada de rede.',
        limits: [
          'As setas são roteadas automaticamente em cotovelos ortogonais de três trechos, sem waypoints manuais, então um layout denso pode sobrepor os trajetos.',
          'O tamanho do nó é limitado a 40–640 por 32–480 dentro de uma tela de 240–2000 por 200–1600, e o zoom fica entre 0.5× e 2×.',
          'O PNG é rasterizado em 2× fixo, sem controle de escala; o diagrama fica só no IndexedDB e o histórico de desfazer é a pilha compartilhada em memória (100 instantâneos), zerada ao sair da ferramenta.'
        ]
      }
    },
    mount, unmount
  };


  VT.i18n.add({
    en: {
      'ds.docDefault': 'Untitled diagram', 'ds.newNode': 'Node', 'ds.untitled': 'Untitled diagram',
      'ds.new': 'New', 'ds.sample': 'Sample', 'ds.newDone': 'Started a new diagram',
      'ds.link': 'Link', 'ds.del': 'Delete', 'ds.delNode': 'Delete node', 'ds.delNodeQ': 'Delete the node "{name}"? Its edges are removed too.',
      'ds.linkPick': 'Select a target node to link', 'ds.linked': 'Connected', 'ds.pickFirst': 'Select a source node first', 'ds.pickTarget': 'Now click the target node',
      'ds.kRect': 'Rectangle', 'ds.kDiamond': 'Diamond', 'ds.kCapsule': 'Capsule', 'ds.kNote': 'Note',
      'ds.name': 'Diagram name', 'ds.width': 'Width', 'ds.height': 'Height', 'ds.grid': 'Grid', 'ds.snap': 'Snap to grid',
      'ds.label': 'Label', 'ds.kind': 'Shape', 'ds.edgeLabel': 'Edge label', 'ds.fill': 'Fill', 'ds.stroke': 'Stroke',
      'ds.projects': 'Projects', 'ds.projNamePh': 'Project name...', 'ds.save': 'Save', 'ds.open': 'Open',
      'ds.noProjects': 'No saved projects yet.', 'ds.dbUnavailable': 'Storage is unavailable in this browser.', 'ds.dbError': 'Could not read storage.',
      'ds.projOpened': 'Opened "{name}"', 'ds.projSaved': 'Saved project "{name}"',
      'ds.exportSvg': 'Export SVG', 'ds.exportPng': 'Export PNG', 'ds.exportedSvg': 'Diagram exported as SVG', 'ds.exportedPng': 'Diagram exported as PNG', 'ds.exportFail': 'PNG export failed',
      'ds.privacy': 'Runs fully offline. Your diagram never leaves this device.',
      'ds.stats': '{nodes} node(s) · {edges} edge(s)',
      'ds.addGroup': 'Add a node', 'ds.zoomGroup': 'Canvas zoom', 'ds.zoomIn': 'Zoom in', 'ds.zoomOut': 'Zoom out', 'ds.zoomResetTip': 'Reset to 100%', 'ds.fit': 'Fit',
      'ds.emptyTitle': 'Empty canvas', 'ds.emptyBody': 'Add a shape from the rail, or open the sample diagram to see how nodes, links and labels fit together.',
      'ds.emptyCta': 'Open the sample', 'ds.emptyUndo': 'undo · Del removes the selection',
      'ds.secCanvas': 'Canvas', 'ds.secSelection': 'Selection', 'ds.noSel': 'Nothing selected. Click a node or an arrow on the canvas to edit its label, size and colours.',
      'ds.sStart': 'Start', 'ds.sProcess': 'Process', 'ds.sDecision': 'Decision?', 'ds.sEnd': 'End', 'ds.sYes': 'yes'
    },
    pt: {
      'ds.docDefault': 'Diagrama sem titulo', 'ds.newNode': 'No', 'ds.untitled': 'Diagrama sem titulo',
      'ds.new': 'Novo', 'ds.sample': 'Exemplo', 'ds.newDone': 'Novo diagrama iniciado',
      'ds.link': 'Conectar', 'ds.del': 'Excluir', 'ds.delNode': 'Excluir no', 'ds.delNodeQ': 'Excluir o no "{name}"? As arestas dele tambem serao removidas.',
      'ds.linkPick': 'Selecione um no de destino para conectar', 'ds.linked': 'Conectado', 'ds.pickFirst': 'Selecione primeiro um no de origem', 'ds.pickTarget': 'Agora clique no no de destino',
      'ds.kRect': 'Retangulo', 'ds.kDiamond': 'Losango', 'ds.kCapsule': 'Capsula', 'ds.kNote': 'Anotacao',
      'ds.name': 'Nome do diagrama', 'ds.width': 'Largura', 'ds.height': 'Altura', 'ds.grid': 'Grade', 'ds.snap': 'Encaixar na grade',
      'ds.label': 'Rotulo', 'ds.kind': 'Forma', 'ds.edgeLabel': 'Rotulo da aresta', 'ds.fill': 'Preenchimento', 'ds.stroke': 'Traco',
      'ds.projects': 'Projetos', 'ds.projNamePh': 'Nome do projeto...', 'ds.save': 'Salvar', 'ds.open': 'Abrir',
      'ds.noProjects': 'Nenhum projeto salvo ainda.', 'ds.dbUnavailable': 'Armazenamento indisponivel neste navegador.', 'ds.dbError': 'Nao foi possivel ler o armazenamento.',
      'ds.projOpened': 'Aberto "{name}"', 'ds.projSaved': 'Projeto "{name}" salvo',
      'ds.exportSvg': 'Exportar SVG', 'ds.exportPng': 'Exportar PNG', 'ds.exportedSvg': 'Diagrama exportado como SVG', 'ds.exportedPng': 'Diagrama exportado como PNG', 'ds.exportFail': 'Falha ao exportar PNG',
      'ds.privacy': 'Roda totalmente offline. Seu diagrama nunca sai deste dispositivo.',
      'ds.stats': '{nodes} no(s) · {edges} aresta(s)',
      'ds.addGroup': 'Adicionar um no', 'ds.zoomGroup': 'Zoom da tela', 'ds.zoomIn': 'Aumentar zoom', 'ds.zoomOut': 'Diminuir zoom', 'ds.zoomResetTip': 'Voltar a 100%', 'ds.fit': 'Ajustar',
      'ds.emptyTitle': 'Tela vazia', 'ds.emptyBody': 'Adicione uma forma pela barra, ou abra o diagrama de exemplo para ver como nos, conexoes e rotulos se encaixam.',
      'ds.emptyCta': 'Abrir o exemplo', 'ds.emptyUndo': 'desfazer · Del exclui a selecao',
      'ds.secCanvas': 'Tela', 'ds.secSelection': 'Selecao', 'ds.noSel': 'Nada selecionado. Clique num no ou numa seta na tela para editar rotulo, tamanho e cores.',
      'ds.sStart': 'Inicio', 'ds.sProcess': 'Processo', 'ds.sDecision': 'Decisao?', 'ds.sEnd': 'Fim', 'ds.sYes': 'sim'
    }
  });

  VT.registry.add(def);
  return def;
})();
