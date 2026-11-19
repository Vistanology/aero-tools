/* VISTANOLOGY / OPEN — Mind Map Studio (U19 flagship, local-first SVG mind maps)
 * A radial mind-map bench: build a tree from a central topic, add branches and sub-branches,
 * collapse/expand, drag to nudge, edit the label and colour of the selection, undo/redo the whole
 * map, autosave to IndexedDB, keep named projects, and export clean SVG, a 2x PNG or the JSON tree.
 * No eval, no external assets, nothing uploaded.
 */
VT.modules['mind-map-studio'] = (function () {
  'use strict';
  const TOOL = 'mind-map-studio';
  const U = VT.utils;
  const t = (k, v) => VT.i18n.t(k, v);
  const esc = U.esc;

  const CANVAS_W = 800;
  const CANVAS_H = 560;
  const CX = CANVAS_W / 2;
  const CY = CANVAS_H / 2;
  const RING = 150;         // radial distance added per depth level
  const SNAP = 8;
  const AUTOSAVE_ID = 'mm:autosave';

  const PALETTE = ['#1FA0D8', '#FFD479', '#7CF0D0', '#FF9EC4', '#B79CFF', '#8FD14F', '#FF8A5C', '#5FC7FF'];

  let alive = false;
  let refs = {};
  let hist = null;
  let autosave = null;
  let map = null;
  let selectedId = null;
  let seq = 1;
  let drag = null;
  let layout = {};          // id -> { x, y, depth, angle }

  function nid() { return 'm' + (seq++); }

  function mkNode(label, color) { return { id: nid(), label: label || t('mm.branch'), color: color || PALETTE[0], collapsed: false, children: [] }; }

  function SAMPLE_MAP() {
    seq = 1;
    const root = { id: nid(), label: t('mm.rootLabel'), color: PALETTE[0], collapsed: false, children: [] };
    const idea = (label, kids) => { const n = { id: nid(), label, color: PALETTE[1 + (root.children.length % (PALETTE.length - 1))], collapsed: false, children: (kids || []).map((k) => ({ id: nid(), label: k, color: PALETTE[3], collapsed: false, children: [] })) }; return n; };
    root.children.push(idea(t('mm.sPlan'), [t('mm.sGoals'), t('mm.sSteps')]));
    root.children.push(idea(t('mm.sResearch'), [t('mm.sSources'), t('mm.sNotes')]));
    root.children.push(idea(t('mm.sDesign')));
    root.children.push(idea(t('mm.sShip'), [t('mm.sLaunch'), t('mm.sFeedback')]));
    return { name: t('mm.untitled'), root };
  }

  function DEFAULT_MAP() { seq = 1; return { name: t('mm.untitled'), root: { id: nid(), label: t('mm.rootLabel'), color: PALETTE[0], collapsed: false, children: [] } }; }

  function clampStr(s, n) { s = (s == null ? '' : String(s)); return s.length > n ? s.slice(0, n) : s; }
  function normColor(c) { return (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c)) ? c : PALETTE[0]; }

  function normalizeMap(m) {
    if (!m || typeof m !== 'object' || !m.root || typeof m.root !== 'object') return DEFAULT_MAP();
    seq = 1;
    const seen = new Set();
    const walk = (n, depth) => {
      if (!n || typeof n !== 'object') return null;
      if (depth > 12) { n.children = []; }
      let id = (typeof n.id === 'string' && n.id && !seen.has(n.id)) ? n.id : nid();
      while (seen.has(id)) id = nid();
      seen.add(id);
      const numericId = /^m(\d+)$/.exec(id);
      if (numericId) seq = Math.max(seq, Number(numericId[1]) + 1);
      const out = {
        id,
        label: clampStr(n.label, 80),
        color: normColor(n.color),
        collapsed: !!n.collapsed,
        children: Array.isArray(n.children) ? n.children.map((c) => walk(c, depth + 1)).filter(Boolean) : []
      };
      if (n.fx != null && n.fy != null && isFinite(n.fx) && isFinite(n.fy)) { out.fx = U.clamp(Number(n.fx), 20, CANVAS_W - 20); out.fy = U.clamp(Number(n.fy), 20, CANVAS_H - 20); }
      return out;
    };
    const root = walk(m.root, 0) || DEFAULT_MAP().root;
    return { name: clampStr(m.name, 80) || t('mm.untitled'), root };
  }

  function findNode(id, node) {
    node = node || map.root;
    if (node.id === id) return node;
    for (const c of node.children) { const r = findNode(id, c); if (r) return r; }
    return null;
  }
  function findParent(id, node) {
    node = node || map.root;
    for (const c of node.children) { if (c.id === id) return node; const r = findParent(id, c); if (r) return r; }
    return null;
  }
  function subtreeSize(n) { let c = 1; for (const k of n.children) c += subtreeSize(k); return c; }
  function countNodes() { return subtreeSize(map.root); }
  function countEdges() { let c = 0; (function walk(n) { if (!n.collapsed) { for (const k of n.children) { c++; walk(k); } } })(map.root); return c; }

  // ---------- radial layout ----------
  function computeLayout() {
    layout = {};
    const root = map.root;
    layout[root.id] = { x: root.fx != null ? root.fx : CX, y: root.fy != null ? root.fy : CY, depth: 0, angle: 0 };
    if (root.collapsed) return;
    const leafWeight = (n) => (n.collapsed || n.children.length === 0) ? 1 : n.children.reduce((s, k) => s + leafWeight(k), 0);
    const assign = (node, a0, a1, depth) => {
      if (node.collapsed) return;
      const total = node.children.reduce((s, k) => s + leafWeight(k), 0) || 1;
      let cur = a0;
      const span = a1 - a0;
      node.children.forEach((child) => {
        const frac = leafWeight(child) / total;
        const mid = cur + (frac * span) / 2;
        const r = RING * depth;
        const x = (child.fx != null) ? child.fx : (CX + r * Math.cos(mid));
        const y = (child.fy != null) ? child.fy : (CY + r * Math.sin(mid));
        layout[child.id] = { x: U.clamp(x, 24, CANVAS_W - 24), y: U.clamp(y, 24, CANVAS_H - 24), depth, angle: mid };
        assign(child, cur, cur + frac * span, depth + 1);
        cur += frac * span;
      });
    };
    assign(root, -Math.PI / 2, Math.PI * 1.5, 1);
  }

  function nodeW(n) { return U.clamp(38 + n.label.length * 8, 56, 220); }
  function nodeH() { return 30; }

  // ---------- render ----------
  function visibleChildren(n) { return n.collapsed ? [] : n.children; }

  function edgePath(a, b) {
    const mx = (a.x + b.x) / 2;
    return 'M ' + a.x.toFixed(1) + ' ' + a.y.toFixed(1) + ' C ' + mx.toFixed(1) + ' ' + a.y.toFixed(1) + ', ' + mx.toFixed(1) + ' ' + b.y.toFixed(1) + ', ' + b.x.toFixed(1) + ' ' + b.y.toFixed(1);
  }

  function nodeMarkup(n, depth) {
    const L = layout[n.id]; if (!L) return '';
    const w = nodeW(n), h = nodeH();
    const x = L.x - w / 2, y = L.y - h / 2;
    const rx = depth === 0 ? h / 2 : 8;
    const sel = n.id === selectedId;
    const fill = depth === 0 ? n.color : 'rgba(255,255,255,0.86)';
    const stroke = n.color;
    const txtFill = depth === 0 ? '#08293A' : '#0B3346';
    const fw = depth === 0 ? '700' : (n.children.length ? '600' : '400');
    const fs = depth === 0 ? 15 : (depth === 1 ? 13 : 12);
    let s = '<g class="mm-node' + (sel ? ' is-sel' : '') + '" data-node="' + n.id + '" transform="translate(' + L.x.toFixed(1) + ' ' + L.y.toFixed(1) + ')">';
    s += '<rect x="' + (-w / 2).toFixed(1) + '" y="' + (-h / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="' + rx + '" fill="' + esc(fill) + '" stroke="' + esc(stroke) + '" stroke-width="' + (sel ? 3 : 2) + '"/>';
    s += '<text class="mm-label" text-anchor="middle" y="' + (fs / 2 - 1) + '" font-size="' + fs + '" font-weight="' + fw + '" fill="' + esc(txtFill) + '">' + esc(n.label || (depth === 0 ? t('mm.rootLabel') : t('mm.branch'))) + '</text>';
    if (!n.collapsed && n.children.length) {
      s += '<circle class="mm-toggle" data-toggle="' + n.id + '" cx="' + (w / 2).toFixed(1) + '" cy="0" r="8" fill="rgba(255,255,255,0.94)" stroke="' + esc(stroke) + '"/>';
      s += '<text x="' + (w / 2).toFixed(1) + '" y="4" text-anchor="middle" font-size="12" fill="' + esc(stroke) + '">−</text>';
    } else if (n.collapsed && n.children.length) {
      s += '<circle class="mm-toggle" data-toggle="' + n.id + '" cx="' + (w / 2).toFixed(1) + '" cy="0" r="9" fill="rgba(255,255,255,0.94)" stroke="' + esc(stroke) + '"/>';
      s += '<text x="' + (w / 2).toFixed(1) + '" y="4" text-anchor="middle" font-size="11" fill="' + esc(stroke) + '">' + subtreeSize(n) - 1 + '</text>';
    }
    s += '</g>';
    return s;
  }

  function renderDiagram() {
    if (!alive || !refs.svg) return;
    computeLayout();
    let edges = '';
    let nodes = '';
    (function walk(n, depth) {
      nodes += nodeMarkup(n, depth);
      visibleChildren(n).forEach((c) => {
        const a = layout[n.id], b = layout[c.id];
        if (a && b) {
          const hot = (selectedId === n.id || selectedId === c.id);
          edges += '<path d="' + edgePath(a, b) + '" fill="none" stroke="' + esc(c.color) + '" stroke-width="' + (hot ? 3 : 2) + '" stroke-opacity="0.85"/>';
        }
        walk(c, depth + 1);
      });
    })(map.root, 0);
    const grid = map.grid ? buildGrid() : '';
    refs.svg.setAttribute('viewBox', '0 0 ' + CANVAS_W + ' ' + CANVAS_H);
    refs.svg.innerHTML = grid + '<g class="mm-edges">' + edges + '</g><g class="mm-nodes">' + nodes + '</g>';
    updateStats();
  }

  function buildGrid() {
    let g = '';
    for (let x = RING; x < CANVAS_W; x += 40) g += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + CANVAS_H + '"/>';
    for (let y = 0; y < CANVAS_H; y += 40) g += '<line x1="0" y1="' + y + '" x2="' + CANVAS_W + '" y2="' + y + '"/>';
    return '<g class="mm-grid">' + g + '</g>';
  }

  function commitRender() { renderDiagram(); }

  // ---------- history ----------
  function canonical() { return JSON.stringify(map); }
  function record() { if (hist) { hist.record(canonical()); syncHist(); } }
  function syncHist() { if (!refs.undo) return; refs.undo.disabled = !hist.canUndo(); refs.redo.disabled = !hist.canRedo(); }
  function applyDoc(next) { map = normalizeMap(next); selectedId = map.root.id; renderMeta(); commitRender(); updateInspector(); flushSave(); }

  const saveSoon = U.debounce(() => { if (!alive || !VT.db.available) return; VT.db.put({ id: AUTOSAVE_ID, tool: TOOL, name: '(autosave)', data: map }).catch(() => {}); }, 600);
  function scheduleSave() { if (autosave) autosave(); }
  function flushSave() { if (!alive || !VT.db.available) return; VT.db.put({ id: AUTOSAVE_ID, tool: TOOL, name: '(autosave)', data: map }).catch(() => {}); }

  // ---------- mutations ----------
  function selectNode(id) { selectedId = id; commitRender(); updateInspector(); }
  function addChild(id) {
    const n = findNode(id); if (!n) return;
    n.collapsed = false;
    const c = mkNode(t('mm.branch'), PALETTE[(n.color ? (PALETTE.indexOf(n.color) + 1) : 1) % PALETTE.length]);
    n.children.push(c); selectedId = c.id; commitRender(); record(); scheduleSave(); updateInspector();
  }
  function addSibling(id) {
    if (id === map.root.id) return addChild(id);
    const p = findParent(id); if (!p) return;
    const cur = findNode(id);
    const c = mkNode(t('mm.branch'), cur ? cur.color : PALETTE[1]);
    p.children.push(c); selectedId = c.id; commitRender(); record(); scheduleSave(); updateInspector();
  }
  function toggleCollapse(id) {
    const n = findNode(id); if (!n || !n.children.length) return;
    n.collapsed = !n.collapsed; commitRender(); record(); scheduleSave();
  }
  function deleteNode(id) {
    if (id === map.root.id) { VT.ui.toast(t('mm.cannotDeleteRoot'), 'info'); return; }
    const n = findNode(id); const cnt = n ? subtreeSize(n) - 1 : 0;
    VT.ui.confirm({ title: t('mm.del'), body: t('mm.delQ', { name: (n && n.label) || '', count: cnt }), confirmLabel: t('mm.del'), danger: true }).then((yes) => {
      if (!yes) return;
      const p = findParent(id); if (!p) return;
      p.children = p.children.filter((c) => c.id !== id);
      selectedId = p.id; commitRender(); record(); scheduleSave(); updateInspector();
    });
  }
  function setLabel(id, val) { const n = findNode(id); if (!n) return; n.label = clampStr(val, 80); commitRender(); scheduleSave(); record(); }
  function setColor(id, val) { const n = findNode(id); if (!n) return; n.color = normColor(val); commitRender(); scheduleSave(); record(); }
  function tidy() { (function w(n) { delete n.fx; delete n.fy; n.children.forEach(w); })(map.root); commitRender(); record(); scheduleSave(); }

  // ---------- pointer ----------
  function clientToSvg(ev) {
    const pt = refs.svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
    const m = refs.svg.getScreenCTM(); if (!m) return { x: 0, y: 0 };
    return pt.matrixTransform(m.inverse());
  }
  function snapv(v) { return Math.round(v / SNAP) * SNAP; }
  function onPointerDown(ev) {
    if (!alive) return;
    const tog = ev.target.closest && ev.target.closest('[data-toggle]');
    if (tog) { toggleCollapse(tog.dataset.toggle); ev.preventDefault(); return; }
    const g = ev.target.closest && ev.target.closest('g.mm-node');
    if (!g) { selectedId = null; commitRender(); updateInspector(); return; }
    const id = g.dataset.node;
    selectedId = id; edgeFromClear(); updateInspector(); commitRender();
    const L = layout[id]; const p = clientToSvg(ev);
    drag = { id, offX: L.x - p.x, offY: L.y - p.y, moved: false };
    ev.preventDefault();
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }
  function edgeFromClear() { /* reserved for symmetry with link flows */ }
  function onPointerMove(ev) {
    if (!drag) return;
    const p = clientToSvg(ev);
    const nx = U.clamp(snapv(p.x + drag.offX), 24, CANVAS_W - 24);
    const ny = U.clamp(snapv(p.y + drag.offY), 24, CANVAS_H - 24);
    const n = findNode(drag.id); if (!n) return;
    const cur = layout[n.id];
    if (!cur || cur.x !== nx || cur.y !== ny) drag.moved = true;
    n.fx = nx; n.fy = ny; renderDiagram();
  }
  function onPointerUp() {
    if (drag && drag.moved) { record(); scheduleSave(); }
    drag = null;
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  }

  // ---------- inspector ----------
  function updateInspector() {
    if (!refs.label) return;
    const n = findNode(selectedId);
    if (!n) { refs.insp.hidden = true; if (refs.noSel) refs.noSel.hidden = false; return; }
    refs.insp.hidden = false;
    if (refs.noSel) refs.noSel.hidden = true;
    refs.label.value = n.label;
    refs.color.value = n.color;
    refs.isRoot = n.id === map.root.id;
    if (refs.collapse) {
      refs.collapse.textContent = n.collapsed ? t('mm.expand') : t('mm.collapse');
      refs.collapse.style.display = n.children.length ? '' : 'none';
    }
  }

  function updateStats() { if (!refs.stats) return; refs.stats.textContent = t('mm.stats', { nodes: countNodes(), edges: countEdges() }); }
  function renderMeta() { if (refs.name) refs.name.value = map.name; }

  // ---------- export ----------
  function safeName() { return (map.name || 'mindmap').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') || 'mindmap'; }

  function svgMarkup() {
    computeLayout();
    let edges = '', nodes = '';
    (function walk(n, depth) {
      const L = layout[n.id];
      if (L) {
        const w = nodeW(n), h = nodeH(), rx = depth === 0 ? h / 2 : 8;
        const fill = depth === 0 ? n.color : '#FFFFFF';
        const stroke = n.color;
        const txtFill = depth === 0 ? '#08293A' : '#0B3346';
        const fs = depth === 0 ? 15 : (depth === 1 ? 13 : 12);
        const fw = depth === 0 ? '700' : (n.children.length ? '600' : '400');
        visibleChildren(n).forEach((c) => {
          const b = layout[c.id];
          if (b) edges += '<path d="' + edgePath(L, b) + '" fill="none" stroke="' + esc(c.color) + '" stroke-width="2" stroke-opacity="0.85"/>';
        });
        nodes += '<g transform="translate(' + L.x.toFixed(1) + ' ' + L.y.toFixed(1) + ')">';
        nodes += '<rect x="' + (-w / 2).toFixed(1) + '" y="' + (-h / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + h + '" rx="' + rx + '" fill="' + esc(fill) + '" stroke="' + esc(stroke) + '" stroke-width="2"/>';
        nodes += '<text text-anchor="middle" y="' + (fs / 2 - 1) + '" font-family="Inter,system-ui,sans-serif" font-size="' + fs + '" font-weight="' + fw + '" fill="' + esc(txtFill) + '">' + esc(n.label) + '</text></g>';
      }
      visibleChildren(n).forEach((c) => walk(c, depth + 1));
    })(map.root, 0);
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + CANVAS_W + '" height="' + CANVAS_H + '" viewBox="0 0 ' + CANVAS_W + ' ' + CANVAS_H + '"><rect width="100%" height="100%" fill="#F2FAFE"/>' + edges + nodes + '</svg>';
  }
  function exportSVG() { U.downloadText(svgMarkup(), safeName() + '.svg', 'image/svg+xml'); VT.ui.toast(t('mm.exportedSvg'), 'success'); }
  function exportJSON() { U.downloadText(JSON.stringify(map, null, 2), safeName() + '.json', 'application/json'); VT.ui.toast(t('mm.exportedJson'), 'success'); }
  function exportPNG() {
    const scale = 2;
    const img = new Image();
    const svg = svgMarkup();
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    img.onload = function () {
      try {
        const cv = document.createElement('canvas'); cv.width = CANVAS_W * scale; cv.height = CANVAS_H * scale;
        const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, cv.width, cv.height);
        cv.toBlob((b) => { if (b) { U.downloadBlob(b, safeName() + '.png'); VT.ui.toast(t('mm.exportedPng'), 'success'); } else VT.ui.toast(t('mm.exportFail'), 'error'); }, 'image/png');
      } catch (e) { VT.ui.toast(t('mm.exportFail'), 'error'); }
    };
    img.onerror = function () { VT.ui.toast(t('mm.exportFail'), 'error'); };
    img.src = url;
  }

  // ---------- load + projects ----------
  function loadMap() {
    if (!VT.db.available) { map = DEFAULT_MAP(); selectedId = map.root.id; commitRender(); renderMeta(); updateInspector(); return Promise.resolve(); }
    return VT.db.get(AUTOSAVE_ID).then((rec) => {
      map = normalizeMap(rec && rec.data ? rec.data : DEFAULT_MAP());
      selectedId = map.root.id;
      commitRender(); renderMeta(); updateInspector();
    }).catch(() => { map = DEFAULT_MAP(); selectedId = map.root.id; commitRender(); renderMeta(); updateInspector(); });
  }
  function loadProjects() {
    if (!refs.projList || !VT.db.available) { if (refs.projList) refs.projList.innerHTML = '<div class="bench-empty mm-empty">' + esc(t('mm.noProjects')) + '</div>'; return; }
    VT.db.list(TOOL).then((rows) => {
      const named = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!named.length) { refs.projList.innerHTML = '<div class="bench-empty mm-empty">' + esc(t('mm.noProjects')) + '</div>'; return; }
      refs.projList.innerHTML = '';
      named.forEach((r) => {
        const row = document.createElement('div'); row.className = 'bench-row mm-proj-row';
        const info = document.createElement('div'); info.className = 'mm-proj-info';
        const strong = document.createElement('strong'); strong.textContent = r.name || t('mm.untitled');
        const when = document.createElement('span'); when.textContent = new Date(r.updatedAt).toLocaleString();
        info.appendChild(strong); info.appendChild(when);
        const open = document.createElement('button'); open.className = 'btn btn-ghost btn-sm'; open.textContent = t('mm.open');
        open.addEventListener('click', () => { flushSave(); applyDoc(r.data); VT.ui.toast(t('mm.projOpened', { name: r.name || t('mm.untitled') }), 'success'); });
        const del = document.createElement('button'); del.className = 'btn btn-ghost btn-sm'; del.title = t('mm.del'); del.textContent = 'x';
        del.addEventListener('click', () => { VT.db.remove(r.id).then(loadProjects); });
        row.appendChild(info); row.appendChild(open); row.appendChild(del);
        refs.projList.appendChild(row);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty mm-empty">' + esc(t('mm.dbError')) + '</div>'; });
  }
  function saveProject() {
    const name = (refs.projName && refs.projName.value.trim()) || map.name || t('mm.untitled');
    flushSave();
    map.name = name; renderMeta();
    VT.db.put({ tool: TOOL, name: name, data: map }).then(() => { VT.ui.toast(t('mm.projSaved', { name }), 'success'); refs.projName.value = ''; loadProjects(); record(); }).catch(() => VT.ui.toast(t('mm.dbError'), 'error'));
  }

  // ---------- mount ----------
  function mount(root) {
    alive = true; seq = 1;
    root.innerHTML = ''
      + '<div class="mm-wrap">'
      + '<div class="mm-bar bench">'
      + '<div class="bench-rail-group"><button class="btn btn-primary btn-sm" id="mm-new">' + esc(t('mm.new')) + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="mm-sample">' + esc(t('mm.sample')) + '</button></div>'
      + '<span class="bench-sep"></span>'
      + '<div class="bench-rail-group"><button class="btn btn-ghost btn-sm" id="mm-undo" title="' + esc(t('hist.undo.tip')) + '">' + esc(t('hist.undo')) + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="mm-redo" title="' + esc(t('hist.redo.tip')) + '">' + esc(t('hist.redo')) + '</button></div>'
      + '<span class="bench-sep"></span>'
      + '<div class="bench-rail-group"><button class="btn btn-ghost btn-sm" id="mm-child">' + esc(t('mm.addChild')) + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="mm-sib">' + esc(t('mm.addSibling')) + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="mm-collapse">' + esc(t('mm.collapse')) + '</button></div>'
      + '<span class="bench-sep"></span>'
      + '<div class="bench-rail-group"><button class="btn btn-ghost btn-sm btn-danger" id="mm-del">' + esc(t('mm.del')) + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="mm-tidy">' + esc(t('mm.tidy')) + '</button></div>'
      + '<span class="mm-spacer"></span>'
      + '<div class="bench-rail-group"><button class="btn btn-ghost btn-sm" id="mm-exp-svg">' + esc(t('mm.exportSvg')) + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="mm-exp-png">' + esc(t('mm.exportPng')) + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="mm-exp-json">' + esc(t('mm.exportJson')) + '</button></div>'
      + '</div>'
      + '<div class="mm-work">'
      + '<div class="mm-stage mat glass"><svg id="mm-svg" class="mm-svg" xmlns="http://www.w3.org/2000/svg"></svg>'
      + '<div class="mm-statsbar"><span class="mm-stats" id="mm-stats"></span></div></div>'
      + '<aside class="mm-side">'
      + '<section class="bench-sec glass" id="mm-insp" hidden><h3 class="bench-sec-head">' + esc(t('mm.secSelection')) + '</h3>'
      + '<div class="mm-insp">'
      + '<label>' + esc(t('mm.label')) + '</label><input class="input" id="mm-label" type="text" maxlength="80">'
      + '<label>' + esc(t('mm.color')) + '</label><input class="bench-color" id="mm-color" type="color">'
      + '</div></section>'
      + '<section class="bench-sec bench-sec--quiet glass" id="mm-nosel"><h3 class="bench-sec-head">' + esc(t('mm.secSelection')) + '</h3>'
      + '<p>' + esc(t('mm.noSel')) + '</p></section>'
      + '<section class="bench-sec glass"><h3 class="bench-sec-head">' + esc(t('mm.secMap')) + '</h3>'
      + '<div class="mm-meta">'
      + '<label>' + esc(t('mm.name')) + '</label><input class="input" id="mm-name" type="text" maxlength="80">'
      + '</div></section>'
      + '<section class="bench-sec glass"><h3 class="bench-sec-head">' + esc(t('mm.secProjects')) + '</h3>'
      + '<div class="mm-projs">'
      + '<div class="mm-proj-head"><input class="input" id="mm-proj-name" type="text" placeholder="' + esc(t('mm.projPlaceholder')) + '"><button class="btn btn-primary btn-sm" id="mm-proj-save">' + esc(t('mm.saveProject')) + '</button></div>'
      + '<div id="mm-proj-list" class="bench-list mm-proj-list"></div>'
      + '</div></section>'
      + '</aside>'
      + '</div>'
      + '</div>';

    refs = {
      svg: U.$('#mm-svg', root), stats: U.$('#mm-stats', root), undo: U.$('#mm-undo', root), redo: U.$('#mm-redo', root),
      insp: U.$('#mm-insp', root), noSel: U.$('#mm-nosel', root), label: U.$('#mm-label', root), color: U.$('#mm-color', root),
      name: U.$('#mm-name', root), collapse: U.$('#mm-collapse', root),
      projName: U.$('#mm-proj-name', root), projList: U.$('#mm-proj-list', root)
    };

    autosave = saveSoon;
    hist = VT.history.create({ equal: (a, b) => a === b, apply: (val) => { map = normalizeMap(JSON.parse(val)); commitRender(); renderMeta(); updateInspector(); syncHist(); scheduleSave(); } });

    U.$('#mm-new', root).addEventListener('click', () => { flushSave(); applyDoc(DEFAULT_MAP()); VT.ui.toast(t('mm.newDone'), 'success'); });
    U.$('#mm-sample', root).addEventListener('click', () => { flushSave(); applyDoc(SAMPLE_MAP()); });
    U.$('#mm-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    U.$('#mm-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });
    U.$('#mm-child', root).addEventListener('click', () => { if (selectedId) addChild(selectedId); });
    U.$('#mm-sib', root).addEventListener('click', () => { if (selectedId) addSibling(selectedId); });
    U.$('#mm-collapse', root).addEventListener('click', () => { if (selectedId) toggleCollapse(selectedId); });
    U.$('#mm-del', root).addEventListener('click', () => { if (selectedId) deleteNode(selectedId); });
    U.$('#mm-tidy', root).addEventListener('click', tidy);
    U.$('#mm-exp-svg', root).addEventListener('click', exportSVG);
    U.$('#mm-exp-png', root).addEventListener('click', exportPNG);
    U.$('#mm-exp-json', root).addEventListener('click', exportJSON);
    U.$('#mm-proj-save', root).addEventListener('click', saveProject);

    refs.label.addEventListener('input', () => { if (selectedId) setLabelLive(selectedId, refs.label.value); });
    refs.label.addEventListener('change', () => { if (selectedId) setLabel(selectedId, refs.label.value); });
    function setLabelLive(id, val) { const n = findNode(id); if (!n) return; n.label = clampStr(val, 80); commitRender(); scheduleSave(); }
    refs.color.addEventListener('input', () => { if (selectedId) setColor(selectedId, refs.color.value); });
    refs.name.addEventListener('input', () => { map.name = clampStr(refs.name.value, 80); scheduleSave(); record(); });

    refs.svg.addEventListener('pointerdown', onPointerDown);
    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) syncHist();
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) deleteNode(selectedId);
      if (e.key === 'Enter' && selectedId) addChild(selectedId);
    });

    loadMap().then(() => { if (alive && hist) { hist.reset(canonical()); syncHist(); } });
    loadProjects();
    const onLang = () => { if (!alive) return; renderMeta(); updateStats(); loadProjects(); commitRender(); };
    window.addEventListener('vt:lang', onLang);
    return () => { window.removeEventListener('vt:lang', onLang); flushSave(); alive = false; };
  }

  function unmount() { flushSave(); alive = false; drag = null; hist = null; autosave = null; refs = {}; map = null; selectedId = null; layout = {}; }

  const def = {
    id: TOOL, cat: 'creative', icon: 'split', version: '0.1.0',
    name: { en: 'Mind Map Studio', pt: 'Estúdio de Mapas Mentais' },
    tagline: { en: 'Build radial mind maps on-device and export SVG, PNG or JSON.', pt: 'Crie mapas mentais radiais no dispositivo e exporte SVG, PNG ou JSON.' },
    tags: ['mindmap', 'brainstorm', 'diagram', 'svg', 'tree', 'creative'],
    deps: [],
    docs: {
      en: {
        summary: 'A local-first mind-map bench. Grow a tree from a central topic, add branches and sub-branches, collapse or expand any node, nudge nodes with the pointer, and edit the label and colour of the selection. Undo/redo the whole map, autosave to IndexedDB and reopen where you left off, keep named projects, and export clean SVG, a 2x PNG or the JSON tree.',
        usage: [
          'Start with New or Sample, then select a bubble.',
          'Grow the tree with Add branch or Add sibling; the − / + badge on a node collapses or expands its children.',
          'Drag a node to nudge it on the 8 px grid, then press Tidy to return everything to the radial layout.',
          'Rename (up to 80 characters) and recolour the selection in the inspector, then export SVG, the 2× PNG or the JSON tree.'
        ],
        privacy: 'The mind map is stored on-device (IndexedDB autosave + named projects) and never uploaded. Node labels are SVG text content and HTML-escaped in the exported markup; the export is built from the same validated model. No eval, no raw-HTML passthrough, no network call.',
        limits: [
          'The canvas is fixed at 800×560 and nodes are held 24 px inside it — there is no resize, pan or zoom.',
          'Depth is truncated to 12 levels on load, labels are capped at 80 characters, and a colour that is not a valid #rrggbb falls back to the palette.',
          'SVG and PNG export paint an opaque #F2FAFE background and skip collapsed subtrees, so a collapsed branch is not in the file you download.'
        ]
      },
      pt: {
        summary: 'Uma bancada de mapas mentais local-first. Faça crescer uma árvore a partir de um tópico central, adicione ramos e sub-ramos, recolha ou expanda qualquer nó, ajuste a posição arrastando e edite o rótulo e a cor da seleção. Desfaça/refaça o mapa inteiro, salve automaticamente no IndexedDB e reabra de onde parou, mantenha projetos nomeados e exporte SVG limpo, PNG 2x ou a árvore em JSON.',
        usage: [
          'Comece em Novo ou Exemplo e selecione um balão.',
          'Faça a árvore crescer com Adicionar ramo ou Adicionar irmão; o selo − / + do nó recolhe ou expande os filhos.',
          'Arraste um nó para deslocá-lo na grade de 8 px e pressione Organizar para devolver tudo ao layout radial.',
          'Renomeie (até 80 caracteres) e recolora a seleção no inspetor, depois exporte SVG, o PNG 2× ou a árvore em JSON.'
        ],
        privacy: 'O mapa é armazenado no dispositivo (salvamento automático no IndexedDB + projetos nomeados) e nunca é enviado. Os rótulos dos nós são texto SVG escapado no markup exportado; a exportação usa o mesmo modelo validado. Não há eval, passagem de HTML bruto nem chamada de rede.',
        limits: [
          'A tela é fixa em 800×560 e os nós são mantidos 24 px para dentro — não há redimensionamento, deslocamento nem zoom.',
          'A profundidade é truncada em 12 níveis ao carregar, os rótulos têm limite de 80 caracteres e uma cor que não seja #rrggbb válido volta para a paleta.',
          'A exportação SVG e PNG pinta um fundo opaco #F2FAFE e ignora os ramos recolhidos, então um ramo fechado não aparece no arquivo baixado.'
        ]
      }
    },
    mount: mount,
    unmount: unmount
  };

  VT.i18n.add({
    en: {
      'mm.new': 'New', 'mm.sample': 'Sample', 'mm.addChild': 'Add branch', 'mm.addSibling': 'Add sibling',
      'mm.collapse': 'Collapse', 'mm.expand': 'Expand', 'mm.del': 'Delete', 'mm.tidy': 'Tidy',
      'mm.rootLabel': 'Central idea', 'mm.branch': 'Branch', 'mm.untitled': 'Untitled mind map',
      'mm.label': 'Label', 'mm.color': 'Colour', 'mm.name': 'Map name',
      'mm.secSelection': 'Selection', 'mm.secMap': 'Map', 'mm.secProjects': 'Projects',
      'mm.noSel': 'Nothing selected. Click a bubble on the canvas to edit its label and colour.',
      'mm.saveProject': 'Save', 'mm.projPlaceholder': 'Project name',
      'mm.exportSvg': 'Export SVG', 'mm.exportPng': 'Export PNG', 'mm.exportJson': 'Export JSON',
      'mm.stats': '{nodes} nodes · {edges} branches',
      'mm.newDone': 'Started a new mind map', 'mm.delQ': 'Delete "{name}" and its {count} sub-branch(es)?',
      'mm.cannotDeleteRoot': 'The central idea cannot be deleted',
      'mm.open': 'Open', 'mm.noProjects': 'No saved projects yet.', 'mm.dbError': 'Could not read storage.',
      'mm.projOpened': 'Opened "{name}"', 'mm.projSaved': 'Project "{name}" saved',
      'mm.exportedSvg': 'Exported as SVG', 'mm.exportedPng': 'Exported as PNG', 'mm.exportedJson': 'Exported as JSON',
      'mm.exportFail': 'PNG export failed',
      'mm.sPlan': 'Plan', 'mm.sGoals': 'Goals', 'mm.sSteps': 'Steps', 'mm.sResearch': 'Research', 'mm.sSources': 'Sources',
      'mm.sNotes': 'Notes', 'mm.sDesign': 'Design', 'mm.sShip': 'Ship', 'mm.sLaunch': 'Launch', 'mm.sFeedback': 'Feedback'
    },
    pt: {
      'mm.new': 'Novo', 'mm.sample': 'Exemplo', 'mm.addChild': 'Adicionar ramo', 'mm.addSibling': 'Adicionar irmão',
      'mm.collapse': 'Recolher', 'mm.expand': 'Expandir', 'mm.del': 'Excluir', 'mm.tidy': 'Organizar',
      'mm.rootLabel': 'Ideia central', 'mm.branch': 'Ramo', 'mm.untitled': 'Mapa mental sem título',
      'mm.label': 'Rótulo', 'mm.color': 'Cor', 'mm.name': 'Nome do mapa',
      'mm.secSelection': 'Seleção', 'mm.secMap': 'Mapa', 'mm.secProjects': 'Projetos',
      'mm.noSel': 'Nada selecionado. Clique em um balão na tela para editar o rótulo e a cor.',
      'mm.saveProject': 'Salvar', 'mm.projPlaceholder': 'Nome do projeto',
      'mm.exportSvg': 'Exportar SVG', 'mm.exportPng': 'Exportar PNG', 'mm.exportJson': 'Exportar JSON',
      'mm.stats': '{nodes} nó(s) · {edges} ramo(s)',
      'mm.newDone': 'Novo mapa mental iniciado', 'mm.delQ': 'Excluir "{name}" e seus {count} sub-ramo(s)?',
      'mm.cannotDeleteRoot': 'A ideia central não pode ser excluída',
      'mm.open': 'Abrir', 'mm.noProjects': 'Nenhum projeto salvo ainda.', 'mm.dbError': 'Não foi possível ler o armazenamento.',
      'mm.projOpened': 'Aberto "{name}"', 'mm.projSaved': 'Projeto "{name}" salvo',
      'mm.exportedSvg': 'Exportado como SVG', 'mm.exportedPng': 'Exportado como PNG', 'mm.exportedJson': 'Exportado como JSON',
      'mm.exportFail': 'Falha ao exportar PNG',
      'mm.sPlan': 'Plano', 'mm.sGoals': 'Metas', 'mm.sSteps': 'Passos', 'mm.sResearch': 'Pesquisa', 'mm.sSources': 'Fontes',
      'mm.sNotes': 'Notas', 'mm.sDesign': 'Design', 'mm.sShip': 'Entrega', 'mm.sLaunch': 'Lançar', 'mm.sFeedback': 'Feedback'
    }
  });

  VT.registry.add(def);
  return def;
})();
