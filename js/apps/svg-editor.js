window.VT = window.VT || {};

/* U14 · SVG Editor — a visual vector bench. Author shapes (rect, ellipse, line, triangle, star)
 * on a live SVG canvas: add, select, drag to move, resize from corners, rotate around the center,
 * snap to a grid, tune fill/stroke/opacity/corners, reorder and toggle layers, undo/redo the whole
 * document, autosave + named projects to IndexedDB, and export clean SVG markup or a rasterized PNG.
 * Everything is drawn from a small, validated document model — no eval, no external assets, nothing
 * uploaded. The same model drives the on-screen canvas and the exported markup, so what you edit is
 * exactly what you download.
 */
VT.modules['svg-editor'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const SVGNS = 'http://www.w3.org/2000/svg';
  const KEY = 'svg-editor';
  const AUTOSAVE_ID = 'se:autosave';
  const GRID = 32;
  const SNAP = 8;

  let alive = false;
  let refs = {};
  let hist = null;
  let autosave = null;
  let doc = DEFAULT_DOC();
  let selectedId = null;
  let drag = null;
  let seq = 1;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const snap = (v) => (doc.canvas.snap ? Math.round(v / SNAP) * SNAP : Math.round(v));

  function DEFAULT_DOC() {
    return { name: 'Untitled', canvas: { w: 480, h: 320, bg: '#F7FCFF', grid: true, snap: true }, shapes: [] };
  }

  const TYPES = {
    rect: { label: 'se.t.rect', make: () => ({ w: 160, h: 110, rx: 12 }) },
    ellipse: { label: 'se.t.ellipse', make: () => ({ w: 150, h: 150, rx: 0 }) },
    line: { label: 'se.t.line', make: () => ({ w: 180, h: 0, rx: 0, fill: 'none', stroke: '#1FA0D8', strokeWidth: 5 }) },
    triangle: { label: 'se.t.triangle', make: () => ({ w: 150, h: 140, rx: 0 }) },
    star: { label: 'se.t.star', make: () => ({ w: 150, h: 150, rx: 0 }) }
  };

  function newShape(type) {
    const ty = TYPES[type]; if (!ty) return null;
    const extra = ty.make();
    return Object.assign({
      id: 's' + (seq++), type, cx: doc.canvas.w / 2, cy: doc.canvas.h / 2,
      fill: '#1FA0D8', stroke: 'none', strokeWidth: 0, opacity: 1, rx: 0, rotation: 0, visible: true,
      name: t(ty.label) + ' ' + (doc.shapes.length + 1)
    }, extra);
  }

  function getShape(id) { return doc.shapes.find((s) => s.id === id) || null; }
  const canonical = () => JSON.stringify(doc);

  // ---------- geometry ----------
  function rot(v, deg) {
    const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
  }
  function angleOf(pt, sh) { return (Math.atan2(pt.y - sh.cy, pt.x - sh.cx) * 180) / Math.PI; }

  function starPoints(cx, cy, w, h) {
    const rx = w / 2, ry = h / 2, out = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5, R = i % 2 ? 0.42 : 1;
      out.push([(cx + Math.cos(a) * rx * R).toFixed(2), (cy + Math.sin(a) * ry * R).toFixed(2)].join(','));
    }
    return out.join(' ');
  }
  function triPoints(cx, cy, w, h) {
    const rx = w / 2, ry = h / 2;
    return [[cx, (cy - ry).toFixed(2)], [(cx + rx).toFixed(2), (cy + ry).toFixed(2)], [(cx - rx).toFixed(2), (cy + ry).toFixed(2)]].map((p) => p.join(',')).join(' ');
  }

  function shapeGeometry(sh) {
    const hw = sh.w / 2, hh = sh.h / 2;
    const tf = sh.rotation ? ' rotate(' + sh.rotation + ' ' + sh.cx + ' ' + sh.cy + ')' : '';
    if (sh.type === 'rect') return { tag: 'rect', attrs: { x: (sh.cx - hw).toFixed(2), y: (sh.cy - hh).toFixed(2), width: sh.w.toFixed(2), height: sh.h.toFixed(2), rx: Math.min(sh.rx, hw, hh).toFixed(2) }, tf };
    if (sh.type === 'ellipse') return { tag: 'ellipse', attrs: { cx: sh.cx.toFixed(2), cy: sh.cy.toFixed(2), rx: hw.toFixed(2), ry: hh.toFixed(2) }, tf };
    if (sh.type === 'triangle') return { tag: 'polygon', attrs: { points: triPoints(sh.cx, sh.cy, sh.w, sh.h) }, tf };
    if (sh.type === 'star') return { tag: 'polygon', attrs: { points: starPoints(sh.cx, sh.cy, sh.w, sh.h) }, tf };
    // line
    return { tag: 'line', attrs: { x1: (sh.cx - hw).toFixed(2), y1: (sh.cy - hh).toFixed(2), x2: (sh.cx + hw).toFixed(2), y2: (sh.cy + hh).toFixed(2) }, tf };
  }

  // ---------- rendering ----------
  function el(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    return e;
  }

  function renderCanvas() {
    if (!refs.canvas) return;
    const c = doc.canvas;
    refs.canvas.setAttribute('viewBox', '0 0 ' + c.w + ' ' + c.h);
    refs.canvas.setAttribute('width', c.w);
    refs.canvas.setAttribute('height', c.h);
    refs.canvas.innerHTML = '';

    if (c.bg !== 'transparent') refs.canvas.append(el('rect', { class: 'se-bg', x: 0, y: 0, width: c.w, height: c.h, fill: c.bg }));

    if (c.grid) {
      const g = el('g', { class: 'se-grid' });
      for (let x = GRID; x < c.w; x += GRID) g.append(el('line', { x1: x, y1: 0, x2: x, y2: c.h }));
      for (let y = GRID; y < c.h; y += GRID) g.append(el('line', { x1: 0, y1: y, x2: c.w, y2: y }));
      refs.canvas.append(g);
    }

    const layer = el('g', { id: 'se-layer' });
    doc.shapes.forEach((sh) => {
      if (!sh.visible) return;
      const geo = shapeGeometry(sh);
      const e = el(geo.tag, geo.attrs);
      e.setAttribute('class', 'se-shape');
      e.setAttribute('data-id', sh.id);
      e.setAttribute('fill', sh.fill);
      e.setAttribute('stroke', sh.stroke);
      e.setAttribute('stroke-width', sh.strokeWidth);
      e.setAttribute('opacity', sh.opacity);
      if (geo.tf) e.setAttribute('transform', geo.tf.trim());
      layer.append(e);
    });
    refs.canvas.append(layer);

    renderOverlay();
    updateGeo();
  }

  function renderOverlay() {
    if (!refs.canvas) return;
    const old = refs.canvas.querySelector('#se-overlay'); if (old) old.remove();
    const sh = getShape(selectedId); if (!sh) return;
    const r = refs.canvas.getBoundingClientRect();
    const s = r.width ? doc.canvas.w / r.width : 1;
    const hs = 9 * s, off = hs / 2;
    const hw = sh.w / 2, hh = sh.h / 2;
    const g = el('g', { id: 'se-overlay', transform: (sh.rotation ? 'rotate(' + sh.rotation + ' ' + sh.cx + ' ' + sh.cy + ')' : '') + '' });
    g.append(el('rect', { class: 'se-sel', x: (sh.cx - hw).toFixed(2), y: (sh.cy - hh).toFixed(2), width: sh.w.toFixed(2), height: sh.h.toFixed(2) }));
    const corners = { nw: [sh.cx - hw, sh.cy - hh], ne: [sh.cx + hw, sh.cy - hh], se: [sh.cx + hw, sh.cy + hh], sw: [sh.cx - hw, sh.cy + hh] };
    Object.keys(corners).forEach((k) => {
      const h = el('rect', { class: 'se-handle', 'data-h': k, x: (corners[k][0] - off).toFixed(2), y: (corners[k][1] - off).toFixed(2), width: hs.toFixed(2), height: hs.toFixed(2) });
      g.append(h);
    });
    const rh = el('circle', { class: 'se-rot', 'data-h': 'rot', cx: sh.cx.toFixed(2), cy: (sh.cy - hh - 22 * s).toFixed(2), r: (6 * s).toFixed(2) });
    g.append(el('line', { class: 'se-rot-line', x1: sh.cx.toFixed(2), y1: (sh.cy - hh).toFixed(2), x2: sh.cx.toFixed(2), y2: (sh.cy - hh - 22 * s).toFixed(2) }));
    g.append(rh);
    refs.canvas.append(g);
  }

  function updateGeo() {
    if (!refs.geo) return;
    const sh = getShape(selectedId);
    refs.geo.textContent = sh
      ? t('se.geo', { x: Math.round(sh.cx), y: Math.round(sh.cy), w: Math.round(sh.w), h: Math.round(sh.h), r: Math.round(sh.rotation) })
      : t('se.geoNone', { n: doc.shapes.length });
  }

  function renderLayers() {
    if (!refs.layers) return;
    refs.layers.innerHTML = '';
    if (!doc.shapes.length) { refs.layers.innerHTML = '<div class="bench-empty se-empty">' + esc(t('se.layersEmpty')) + '</div>'; return; }
    // top layer first (reverse of paint order)
    [...doc.shapes].reverse().forEach((sh) => {
      const row = document.createElement('div');
      row.className = 'se-layer' + (sh.id === selectedId ? ' is-sel' : '') + (sh.visible ? '' : ' is-hidden');
      row.dataset.id = sh.id;
      const eye = document.createElement('button'); eye.type = 'button'; eye.className = 'btn btn-ghost btn-sm se-eye'; eye.textContent = sh.visible ? '◉' : '◌'; eye.title = t('se.toggleVis');
      eye.addEventListener('click', (e) => { e.stopPropagation(); sh.visible = !sh.visible; commit(); });
      const nm = document.createElement('span'); nm.className = 'se-layer-name'; nm.textContent = sh.name;
      const dn = document.createElement('button'); dn.type = 'button'; dn.className = 'btn btn-ghost btn-sm se-mv'; dn.textContent = '▼'; dn.title = t('se.sendBack');
      dn.addEventListener('click', (e) => { e.stopPropagation(); moveLayer(sh.id, -1); });
      const up = document.createElement('button'); up.type = 'button'; up.className = 'btn btn-ghost btn-sm se-mv'; up.textContent = '▲'; up.title = t('se.bringFront');
      up.addEventListener('click', (e) => { e.stopPropagation(); moveLayer(sh.id, 1); });
      row.append(eye, nm, up, dn);
      row.addEventListener('click', () => select(sh.id));
      refs.layers.append(row);
    });
  }

  function moveLayer(id, dir) {
    const i = doc.shapes.findIndex((s) => s.id === id); if (i < 0) return;
    const j = clamp(i + dir, 0, doc.shapes.length - 1); if (i === j) return;
    const [s] = doc.shapes.splice(i, 1); doc.shapes.splice(j, 0, s);
    commit();
  }

  function select(id) {
    selectedId = id;
    buildProps();
    renderOverlay();
    renderLayers();
    updateGeo();
  }

  // ---------- commit / history ----------
  function commit() {
    if (!alive) return;
    renderCanvas(); renderLayers();
    if (refs.manifestOut) refs.manifestOut.textContent = serializeSVG();
    hist.record(canonical()); syncHist();
    if (autosave) autosave();
  }
  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }

  // ---------- property panel ----------
  function buildProps() {
    if (!refs.props) return;
    refs.props.innerHTML = '';
    const sh = getShape(selectedId);
    refs.props.append(canvasGroup());
    if (!sh) {
      const hint = document.createElement('div'); hint.className = 'bench-empty se-empty'; hint.textContent = t('se.pickShape');
      refs.props.append(hint); return;
    }
    const g = document.createElement('div'); g.className = 'se-group';
    g.append(head(t('se.g.shape') + ' · ' + t(TYPES[sh.type].label)));
    g.append(numRow('se-w', t('se.f.w'), sh.w, (v) => { sh.w = Math.max(1, v); }));
    g.append(numRow('se-h', t('se.f.h'), sh.h, (v) => { sh.h = Math.max(0, v); }));
    g.append(rangeRow('se-rot', t('se.f.rotation'), sh.rotation, -180, 180, '°', (v) => { sh.rotation = v; }));
    g.append(colorRow('se-fill', t('se.f.fill'), sh.fill, (v) => { sh.fill = v; }));
    g.append(colorRow('se-stroke', t('se.f.stroke'), sh.stroke === 'none' ? '#F7FCFF' : sh.stroke, (v) => { sh.stroke = v; if (sh.strokeWidth === 0) sh.strokeWidth = 3; }));
    g.append(rangeRow('se-sw', t('se.f.strokeWidth'), sh.strokeWidth, 0, 24, '', (v) => { sh.strokeWidth = v; }));
    g.append(rangeRow('se-op', t('se.f.opacity'), Math.round(sh.opacity * 100), 0, 100, '%', (v) => { sh.opacity = v / 100; }));
    if (sh.type === 'rect') g.append(rangeRow('se-rx', t('se.f.rx'), sh.rx, 0, Math.round(Math.min(sh.w, sh.h) / 2), '', (v) => { sh.rx = v; }));
    const actions = document.createElement('div'); actions.className = 'se-props-actions';
    const dup = document.createElement('button'); dup.type = 'button'; dup.className = 'btn btn-ghost btn-sm'; dup.textContent = t('se.dup');
    dup.addEventListener('click', () => duplicate());
    const del = document.createElement('button'); del.type = 'button'; del.className = 'btn btn-ghost btn-sm se-danger'; del.textContent = t('se.del');
    del.addEventListener('click', () => removeSelected());
    actions.append(dup, del); g.append(actions);
    refs.props.append(g);
  }

  function canvasGroup() {
    const c = doc.canvas;
    const g = document.createElement('div'); g.className = 'se-group';
    g.append(head(t('se.g.canvas')));
    g.append(numRow('se-cw', t('se.f.cw'), c.w, (v) => { c.w = clamp(Math.round(v), 16, 4096); }));
    g.append(numRow('se-ch', t('se.f.ch'), c.h, (v) => { c.h = clamp(Math.round(v), 16, 4096); }));
    g.append(colorRow('se-cbg', t('se.f.bg'), c.bg === 'transparent' ? '#F7FCFF' : c.bg, (v) => { c.bg = v; }));
    const trow = document.createElement('label'); trow.className = 'se-toggle';
    const tr = document.createElement('input'); tr.type = 'checkbox'; tr.checked = c.bg === 'transparent';
    tr.addEventListener('change', () => { c.bg = tr.checked ? 'transparent' : '#F7FCFF'; commit(); });
    trow.append(tr, span(t('se.transparent'))); g.append(trow);
    const grow = document.createElement('label'); grow.className = 'se-toggle';
    const gr = document.createElement('input'); gr.type = 'checkbox'; gr.checked = c.grid;
    gr.addEventListener('change', () => { c.grid = gr.checked; commit(); });
    grow.append(gr, span(t('se.showGrid'))); g.append(grow);
    const srow = document.createElement('label'); srow.className = 'se-toggle';
    const sr = document.createElement('input'); sr.type = 'checkbox'; sr.checked = c.snap;
    sr.addEventListener('change', () => { c.snap = sr.checked; commit(); });
    srow.append(sr, span(t('se.snapGrid'))); g.append(srow);
    return g;
  }

  function span(txt) { const s = document.createElement('span'); s.textContent = txt; return s; }
  function head(txt) { const h = document.createElement('div'); h.className = 'se-group-head'; h.textContent = txt; return h; }

  function colorRow(id, label, val, set) {
    const row = document.createElement('div'); row.className = 'se-ctrl se-ctrl-inline';
    const lab = document.createElement('label'); lab.textContent = label;
    const inp = document.createElement('input'); inp.type = 'color'; inp.className = 'bench-color'; inp.id = id; inp.value = /^#[0-9a-fA-F]{6}$/.test(val) ? val : '#000000';
    inp.addEventListener('input', () => { set(inp.value); commit(); });
    row.append(lab, inp); return row;
  }
  function rangeRow(id, label, val, min, max, unit, set) {
    const row = document.createElement('div'); row.className = 'se-ctrl';
    const lab = document.createElement('label'); lab.textContent = label;
    const line = document.createElement('div'); line.className = 'se-ctrl-line';
    const inp = document.createElement('input'); inp.type = 'range'; inp.className = 'bench-range'; inp.id = id; inp.min = min; inp.max = max; inp.step = 1; inp.value = val;
    const out = document.createElement('span'); out.className = 'bench-val'; out.textContent = val + unit;
    inp.addEventListener('input', () => { const v = Number(inp.value); set(v); out.textContent = v + unit; commit(); });
    line.append(inp, out); row.append(lab, line); return row;
  }
  function numRow(id, label, val, set) {
    const row = document.createElement('div'); row.className = 'se-ctrl se-ctrl-inline';
    const lab = document.createElement('label'); lab.textContent = label;
    const inp = document.createElement('input'); inp.type = 'number'; inp.className = 'input se-num'; inp.id = id; inp.value = Math.round(val);
    inp.addEventListener('input', () => { set(Number(inp.value)); commit(); });
    row.append(lab, inp); return row;
  }

  // ---------- shape ops ----------
  function addShape(type) {
    const sh = newShape(type); if (!sh) return;
    doc.shapes.push(sh); select(sh.id); commit();
    refs.hint.textContent = t('se.added', { name: sh.name });
  }
  function removeSelected() {
    if (!selectedId) return;
    doc.shapes = doc.shapes.filter((s) => s.id !== selectedId);
    select(null); commit();
  }
  function duplicate() {
    const sh = getShape(selectedId); if (!sh) return;
    const copy = Object.assign({}, sh, { id: 's' + (seq++), cx: sh.cx + 16, cy: sh.cy + 16, name: sh.name + ' 2' });
    doc.shapes.push(copy); select(copy.id); commit();
  }

  // ---------- export ----------
  function serializeSVG() {
    const c = doc.canvas;
    let s = '<svg xmlns="' + SVGNS + '" width="' + c.w + '" height="' + c.h + '" viewBox="0 0 ' + c.w + ' ' + c.h + '">\n';
    if (c.bg !== 'transparent') s += '  <rect width="' + c.w + '" height="' + c.h + '" fill="' + c.bg + '"/>\n';
    doc.shapes.forEach((sh) => {
      if (!sh.visible) return;
      const geo = shapeGeometry(sh);
      const attrs = Object.assign({}, geo.attrs, { fill: sh.fill, stroke: sh.stroke, 'stroke-width': sh.strokeWidth, opacity: sh.opacity });
      if (geo.tf) attrs.transform = geo.tf.trim();
      const pairs = Object.keys(attrs).map((k) => k + '="' + attrs[k] + '"').join(' ');
      s += '  <' + geo.tag + ' ' + pairs + '/>\n';
    });
    s += '</svg>';
    return s;
  }

  function exportSVG() {
    U.downloadText(serializeSVG(), (doc.name || 'artwork').replace(/[^\w-]+/g, '_') + '.svg', 'image/svg+xml');
    toast(t('se.exportedSvg'), 'success');
  }
  async function copySVG() {
    const ok = await U.copyText(serializeSVG());
    toast(ok ? t('se.copiedSvg') : t('se.copyFail'), ok ? 'success' : 'error');
  }
  function exportPNG() {
    const scale = Number((refs.pngScale && refs.pngScale.value) || 2);
    const svg = serializeSVG();
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = Math.round(doc.canvas.w * scale); cv.height = Math.round(doc.canvas.h * scale);
      const ctx = cv.getContext('2d'); ctx.drawImage(img, 0, 0, cv.width, cv.height);
      cv.toBlob((blob) => {
        if (!blob) { toast(t('se.pngFail'), 'error'); return; }
        U.downloadBlob(blob, (doc.name || 'artwork').replace(/[^\w-]+/g, '_') + '@' + scale + 'x.png');
        toast(t('se.exportedPng', { s: scale }), 'success');
      }, 'image/png');
    };
    img.onerror = () => toast(t('se.pngFail'), 'error');
    img.src = url;
  }

  function sample() {
    doc = DEFAULT_DOC(); doc.name = 'Sample';
    seq = 1;
    doc.shapes = [
      Object.assign(newShape('rect'), { cx: 240, cy: 160, w: 360, h: 240, fill: '#12304F', rx: 24, name: 'Panel' }),
      Object.assign(newShape('star'), { cx: 130, cy: 120, w: 120, h: 120, fill: '#1FA0D8', name: 'Star' }),
      Object.assign(newShape('ellipse'), { cx: 330, cy: 200, w: 150, h: 150, fill: '#7FE0B0', opacity: 0.85, name: 'Orb' }),
      Object.assign(newShape('line'), { cx: 240, cy: 250, w: 300, h: 0, stroke: '#FFD08A', strokeWidth: 6, name: 'Rule' })
    ];
    select(null); buildProps(); commit();
    refs.hint.textContent = t('se.sampleLoaded');
  }

  // ---------- pointer interaction ----------
  function svgPoint(e) {
    const r = refs.canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (doc.canvas.w / r.width), y: (e.clientY - r.top) * (doc.canvas.h / r.height) };
  }

  function onDown(e) {
    if (!refs.canvas) return;
    const handle = e.target.closest ? e.target.closest('[data-h]') : null;
    const shapeEl = e.target.closest ? e.target.closest('[data-id]') : null;
    const pt = svgPoint(e);
    if (handle) {
      const sh = getShape(selectedId); if (!sh) return;
      if (handle.dataset.h === 'rot') drag = { mode: 'rotate', sh, start: angleOf(pt, sh), orig: sh.rotation };
      else drag = { mode: 'resize', sh, h: handle.dataset.h, start: pt, o: { cx: sh.cx, cy: sh.cy, w: sh.w, h: sh.h, rot: sh.rotation } };
    } else if (shapeEl) {
      const sh = getShape(shapeEl.getAttribute('data-id')); if (!sh) return;
      if (sh.id !== selectedId) select(sh.id);
      drag = { mode: 'move', sh, start: pt, o: { cx: sh.cx, cy: sh.cy } };
    } else { select(null); return; }
    try { refs.canvas.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  }

  function onMove(e) {
    if (!drag || !alive) return;
    const pt = svgPoint(e);
    const sh = drag.sh;
    if (drag.mode === 'move') {
      sh.cx = snap(drag.o.cx + (pt.x - drag.start.x));
      sh.cy = snap(drag.o.cy + (pt.y - drag.start.y));
    } else if (drag.mode === 'resize') {
      const dp = { x: pt.x - drag.start.x, y: pt.y - drag.start.y };
      const lp = rot(dp, -drag.o.rot);
      const sx = drag.h === 'nw' || drag.h === 'sw' ? -1 : 1;
      const sy = drag.h === 'nw' || drag.h === 'ne' ? -1 : 1;
      const hw0 = drag.o.w / 2, hh0 = drag.o.h / 2;
      const newHW = Math.max(1, hw0 + sx * lp.x);
      const newHH = Math.max(0, hh0 + sy * lp.y);
      const shift = rot({ x: sx * (newHW - hw0) / 2, y: sy * (newHH - hh0) / 2 }, drag.o.rot);
      sh.w = snap(newHW * 2); sh.h = snap(newHH * 2);
      sh.cx = snap(drag.o.cx + shift.x); sh.cy = snap(drag.o.cy + shift.y);
      if (sh.type === 'rect') sh.rx = clamp(sh.rx, 0, Math.round(Math.min(sh.w, sh.h) / 2));
    } else if (drag.mode === 'rotate') {
      sh.rotation = Math.round(drag.orig + (angleOf(pt, sh) - drag.start));
    }
    renderCanvas();
  }

  function onUp(e) {
    if (!drag) return;
    drag = null;
    try { refs.canvas.releasePointerCapture(e.pointerId); } catch (_) {}
    if (refs.manifestOut) refs.manifestOut.textContent = serializeSVG();
    hist.record(canonical()); syncHist();
    if (autosave) autosave();
    buildProps();
  }

  // ---------- persistence ----------
  function loadProjects() {
    refs.projList.innerHTML = '';
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty se-empty">' + esc(t('se.dbUnavailable')) + '</div>'; return; }
    VT.db.list('svg-editor').then((rows) => {
      rows = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.projList.innerHTML = '<div class="bench-empty se-empty">' + esc(t('se.projEmpty')) + '</div>'; return; }
      rows.forEach((r) => {
        const row = document.createElement('div'); row.className = 'bench-row se-proj-row';
        const info = document.createElement('div'); info.className = 'se-proj-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('se.projUntitled');
        const meta = document.createElement('span'); meta.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(nm, meta);
        const open = document.createElement('button'); open.type = 'button'; open.className = 'btn btn-ghost btn-sm'; open.textContent = t('se.projOpen');
        open.addEventListener('click', () => { applyDoc(r.data, t('se.projOpened', { name: r.name || t('se.projUntitled') })); });
        row.append(info, open); refs.projList.append(row);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty se-empty">' + esc(t('se.dbError')) + '</div>'; });
  }

  function setDoc(d) {
    const nd = DEFAULT_DOC();
    if (d && d.canvas) Object.assign(nd.canvas, d.canvas);
    if (d && Array.isArray(d.shapes)) { nd.shapes = d.shapes.filter((s) => s && TYPES[s.type]); nd.name = d.name || 'Untitled'; }
    seq = nd.shapes.reduce((m, s) => { const n = parseInt(String(s.id).replace(/\D/g, ''), 10); return Math.max(m, isNaN(n) ? 0 : n); }, 0) + 1;
    doc = nd;
    selectedId = null;
    buildProps(); renderCanvas(); renderLayers();
    if (refs.manifestOut) refs.manifestOut.textContent = serializeSVG();
  }

  function applyDoc(data, msg) {
    setDoc(data || DEFAULT_DOC());
    hist.reset(canonical()); syncHist();
    if (autosave) autosave();
    if (msg) toast(msg, 'success');
  }

  function mount(root) {
    alive = true;
    const s = VT.store.get(KEY, null);
    if (s && s.doc && s.doc.canvas) doc = Object.assign(DEFAULT_DOC(), s.doc);
    const I = VT.icons;

    root.innerHTML = `
      <div class="se-stage" id="se-stage">
        <div class="se-bar bench">
          <span class="se-adds" role="group" aria-label="${t('se.add')}">
            ${Object.keys(TYPES).map((k) => '<button class="btn btn-ghost btn-sm" data-add="' + k + '">' + esc(t(TYPES[k].label)) + '</button>').join('')}
          </span>
          <span class="se-sep" aria-hidden="true"></span>
          <button class="btn btn-ghost btn-sm" id="se-undo" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
          <button class="btn btn-ghost btn-sm" id="se-redo" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
          <button class="btn btn-ghost btn-sm" id="se-sample">${I.sparkle} ${t('se.sample')}</button>
          <button class="btn btn-ghost btn-sm" id="se-clear">${I.broom} ${t('se.clear')}</button>
          <span class="se-bar-actions">
            <label class="se-scale">${t('se.pngScale')} <select class="input se-scale-sel" id="se-png-scale"><option value="1">1×</option><option value="2" selected>2×</option><option value="4">4×</option></select></label>
            <button class="btn btn-ghost btn-sm" id="se-copy">${I.copy} ${t('se.copySvg')}</button>
            <button class="btn btn-ghost btn-sm" id="se-export-svg">${I.code} ${t('se.exportSvg')}</button>
            <button class="btn btn-primary btn-sm" id="se-export-png">${I.download} ${t('se.exportPng')}</button>
          </span>
        </div>
        <div class="se-hint" id="se-hint" role="status" aria-live="polite"></div>

        <div class="se-work">
          <section class="se-canvas-wrap mat glass" aria-label="${t('se.canvas')}">
            <svg id="se-canvas" class="se-canvas" role="img" aria-label="${t('se.canvas')}"></svg>
            <div class="se-geo" id="se-geo"></div>
          </section>
          <aside class="se-side">
            <section class="bench-sec glass">
            <div class="se-props" id="se-props" aria-label="${t('se.props')}"></div></section>
            <section class="bench-sec glass"><h3 class="bench-sec-head">${t('se.layers')}</h3>
            <div class="se-layers" id="se-layers"></div></section>
            <section class="bench-sec glass"><h3 class="bench-sec-head">${t('se.projList')}</h3>
            <div class="se-proj-save">
              <input class="input" id="se-proj-name" type="text" placeholder="${t('se.projNamePh')}" aria-label="${t('se.projNamePh')}">
              <button class="btn btn-ghost btn-sm" id="se-proj-save">${I.file} ${t('se.projSave')}</button>
            </div>
            <div class="bench-list se-proj-list" id="se-proj-list"></div></section>
            <section class="bench-sec glass"><h3 class="bench-sec-head">${t('se.svgLabel')}</h3>
            <pre class="bench-code se-out" id="se-svg-out"></pre></section>
          </aside>
        </div>

        <p class="privacy-line">${I.shield} ${t('se.privacy')}</p>
      </div>`;

    refs = {
      stage: $('#se-stage', root), canvas: $('#se-canvas', root), geo: $('#se-geo', root),
      hint: $('#se-hint', root), props: $('#se-props', root), layers: $('#se-layers', root),
      projList: $('#se-proj-list', root), projName: $('#se-proj-name', root),
      manifestOut: $('#se-svg-out', root), pngScale: $('#se-png-scale', root),
      undo: $('#se-undo', root), redo: $('#se-redo', root)
    };

    autosave = U.debounce(() => {
      if (!alive) return;
      VT.store.set(KEY, { doc });
      if (VT.db.available) VT.db.put({ id: AUTOSAVE_ID, tool: 'svg-editor', name: '(autosave)', data: doc }).catch(() => {});
    }, 700);

    hist = VT.history.create({ apply: (val) => { setDoc(val ? JSON.parse(val) : DEFAULT_DOC()); } });

    $$('.se-adds .btn', root).forEach((b) => b.addEventListener('click', () => addShape(b.dataset.add)));
    $('#se-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#se-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });
    $('#se-sample', root).addEventListener('click', () => sample());
    $('#se-clear', root).addEventListener('click', () => { doc.shapes = []; select(null); commit(); refs.hint.textContent = t('se.cleared'); });
    $('#se-copy', root).addEventListener('click', () => copySVG());
    $('#se-export-svg', root).addEventListener('click', () => exportSVG());
    $('#se-export-png', root).addEventListener('click', () => exportPNG());

    $('#se-proj-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('se.dbUnavailable'), 'error'); return; }
      const name = refs.projName.value.trim() || t('se.projUntitled');
      refs.projName.value = name; doc.name = name;
      try { await VT.db.put({ tool: 'svg-editor', name, data: doc }); toast(t('se.projSaved', { name }), 'success'); loadProjects(); }
      catch (e) { toast(t('se.dbError'), 'error'); }
    });

    refs.canvas.addEventListener('pointerdown', onDown);
    refs.canvas.addEventListener('pointermove', onMove);
    refs.canvas.addEventListener('pointerup', onUp);
    refs.canvas.addEventListener('pointercancel', onUp);
    window.addEventListener('resize', onResize);

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) { syncHist(); return; }
      const sh = getShape(selectedId);
      if (!sh) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeSelected(); }
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const d = e.shiftKey ? SNAP : 1;
        if (e.key === 'ArrowLeft') sh.cx -= d; else if (e.key === 'ArrowRight') sh.cx += d;
        else if (e.key === 'ArrowUp') sh.cy -= d; else if (e.key === 'ArrowDown') sh.cy += d;
        commit();
      }
    });

    buildProps();
    renderCanvas();
    renderLayers();
    refs.manifestOut.textContent = serializeSVG();
    hist.reset(canonical()); syncHist();
    loadProjects();

    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then((rec) => {
        if (!alive || !rec || !rec.data || !rec.data.canvas) return;
        applyDoc(rec.data);
        refs.hint.textContent = t('se.restored');
      }).catch(() => {});
    }

    return () => { alive = false; };
  }

  function onResize() { if (alive) renderOverlay(); }

  function unmount() {
    alive = false; hist = null; autosave = null; refs = {}; drag = null; selectedId = null;
    doc = DEFAULT_DOC(); seq = 1;
    window.removeEventListener('resize', onResize);
  }

  const def = {
    id: 'svg-editor', cat: 'creative', icon: 'layers', version: '0.1.0',
    name: { en: 'SVG Editor', pt: 'Editor SVG' },
    tagline: {
      en: 'A visual vector bench: place rectangles, ellipses, lines, triangles and stars, then move, resize and rotate them on a live SVG canvas with grid snapping. Tune fill, stroke, opacity and corners, reorder layers, undo/redo the whole document, and export clean SVG markup or a crisp PNG. Deterministic, local, offline.',
      pt: 'Uma bancada vetorial visual: posicione retângulos, elipses, linhas, triângulos e estrelas, depois mova, redimensione e gire num canvas SVG ao vivo com ajuste à grade. Ajuste preenchimento, traço, opacidade e cantos, reordene camadas, desfaça/refaça todo o documento e exporte markup SVG limpo ou um PNG nítido. Determinístico, local, offline.'
    },
    tags: ['svg', 'vector', 'editor', 'shapes', 'design', 'creative'],
    deps: [],
    docs: {
      en: {
        summary: 'A visual SVG editor built on a small document model. Add primitive shapes, drag to move, resize from the corners, rotate around the center, snap to a grid, and style each shape (fill, stroke, width, opacity, corner radius). Layers get automatic names such as “Rect 1” and can be reordered, hidden or deleted.',
        usage: [
          'Add a shape from Rect / Ellipse / Line / Triangle / Star; it lands at the canvas center.',
          'Drag its body to move, a corner handle to resize, or the top handle to rotate; nudge with the arrow keys (Shift snaps 8 px) and remove with Delete.',
          'Style the selected shape in the side panel (Width, Height, Rotation, Fill, Stroke, Stroke width, Opacity, Corner radius) and set canvas size and background above it.',
          'Reorder or hide shapes in the Layers list with the forward/backward and visible controls.',
          'Copy SVG, Download SVG, or Download PNG at 1×, 2× or 4×; save named projects to IndexedDB.'
        ],
        privacy: 'The document is a plain data model rendered to an on-screen SVG and re-serialized for export — there is no eval and no free-form HTML. Nothing is uploaded; projects and autosave live on-device via IndexedDB. PNG export rasterizes your own markup locally.',
        limits: [
          'Five primitives only (rect, ellipse, line, triangle, star): there is no pen or path-node editor and no boolean path operations, by design — use SVG Studio to import, sanitize and optimize existing vector files.',
          'Canvas size is clamped to 16–4096 px and PNG export is limited to 1×, 2× or 4× scale.',
          'Shape names are generated from the type and cannot be edited, and exported coordinates are rounded to two decimals.'
        ]
      },
      pt: {
        summary: 'Um editor visual de SVG construído sobre um pequeno modelo de documento. Adicione formas primitivas, arraste para mover, redimensione pelos cantos, gire em torno do centro, ajuste à grade e estilize cada forma (preenchimento, traço, largura, opacidade, raio do canto). As camadas recebem nomes automáticos como “Retângulo 1” e podem ser reordenadas, ocultadas ou excluídas.',
        usage: [
          'Adicione uma forma em Retângulo / Elipse / Linha / Triângulo / Estrela; ela entra no centro do canvas.',
          'Arraste o corpo para mover, uma alça de canto para redimensionar ou a alça superior para girar; ajuste com as setas (Shift encaixa de 8 px) e remova com Delete.',
          'Estilize a forma selecionada no painel lateral (Largura, Altura, Rotação, Preenchimento, Traço, Largura do traço, Opacidade, Raio do canto) e defina acima o tamanho e o fundo do canvas.',
          'Reordene ou oculte formas na lista de Camadas com os controles de trazer para frente/para trás e de visibilidade.',
          'Copie o SVG, baixe o SVG ou baixe o PNG em 1×, 2× ou 4×; salve projetos nomeados no IndexedDB.'
        ],
        privacy: 'O documento é um modelo de dados puro renderizado num SVG na tela e re-serializado para exportação — não há eval nem HTML livre. Nada é enviado; projetos e salvamento automático ficam no dispositivo via IndexedDB. A exportação PNG rasteriza seu próprio markup localmente.',
        limits: [
          'Cinco primitivas apenas (retângulo, elipse, linha, triângulo, estrela): não há editor de nós de paths nem operações booleanas, por escolha — use o SVG Studio para importar, sanitizar e otimizar arquivos vetoriais existentes.',
          'O tamanho do canvas é limitado a 16–4096 px e a exportação PNG só aceita escala 1×, 2× ou 4×.',
          'Os nomes das formas são gerados a partir do tipo e não podem ser editados, e as coordenadas exportadas são arredondadas a duas casas decimais.'
        ]
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'se.add': 'Add shape', 'se.t.rect': 'Rect', 'se.t.ellipse': 'Ellipse', 'se.t.line': 'Line', 'se.t.triangle': 'Triangle', 'se.t.star': 'Star',
      'se.sample': 'Sample', 'se.clear': 'Clear', 'se.copySvg': 'Copy SVG', 'se.exportSvg': 'Download SVG', 'se.exportPng': 'Download PNG', 'se.pngScale': 'PNG',
      'se.canvas': 'Canvas', 'se.props': 'Design', 'se.layers': 'Layers', 'se.projList': 'Projects', 'se.svgLabel': 'SVG',
      'se.g.canvas': 'Canvas', 'se.g.shape': 'Shape', 'se.f.cw': 'Width', 'se.f.ch': 'Height', 'se.f.bg': 'Background', 'se.transparent': 'Transparent background',
      'se.showGrid': 'Show grid', 'se.snapGrid': 'Snap to grid', 'se.f.w': 'Width', 'se.f.h': 'Height', 'se.f.rotation': 'Rotation', 'se.f.fill': 'Fill',
      'se.f.stroke': 'Stroke', 'se.f.strokeWidth': 'Stroke width', 'se.f.opacity': 'Opacity', 'se.f.rx': 'Corner radius',
      'se.dup': 'Duplicate', 'se.del': 'Delete', 'se.toggleVis': 'Toggle visibility', 'se.bringFront': 'Bring forward', 'se.sendBack': 'Send backward',
      'se.pickShape': 'Select a shape on the canvas to edit it.', 'se.layersEmpty': 'No shapes yet — add one above.',
      'se.geo': 'x {x} · y {y} · {w}×{h} · {r}°', 'se.geoNone': '{n} shape(s) · click one to edit',
      'se.added': 'Added {name}', 'se.cleared': 'Canvas cleared', 'se.sampleLoaded': 'Sample scene loaded', 'se.restored': 'Restored your last artwork',
      'se.exportedSvg': 'SVG downloaded', 'se.copiedSvg': 'SVG copied to clipboard', 'se.copyFail': 'Could not copy — download the file instead.',
      'se.exportedPng': 'PNG downloaded at {s}×', 'se.pngFail': 'Could not rasterize the PNG.',
      'se.projNamePh': 'Project name…', 'se.projSave': 'Save', 'se.projOpen': 'Open', 'se.projUntitled': 'Untitled artwork',
      'se.projEmpty': 'Nothing saved yet.', 'se.projSaved': 'Saved "{name}"', 'se.projOpened': 'Opened "{name}"',
      'se.dbUnavailable': 'Local storage unavailable — projects cannot be saved.', 'se.dbError': 'Could not reach local storage.',
      'se.privacy': 'You draw and export entirely in your browser. The artwork is a plain data model rendered to SVG — no scripts, no eval, and nothing is ever uploaded.'
    },
    pt: {
      'se.add': 'Adicionar forma', 'se.t.rect': 'Retângulo', 'se.t.ellipse': 'Elipse', 'se.t.line': 'Linha', 'se.t.triangle': 'Triângulo', 'se.t.star': 'Estrela',
      'se.sample': 'Exemplo', 'se.clear': 'Limpar', 'se.copySvg': 'Copiar SVG', 'se.exportSvg': 'Baixar SVG', 'se.exportPng': 'Baixar PNG', 'se.pngScale': 'PNG',
      'se.canvas': 'Canvas', 'se.props': 'Design', 'se.layers': 'Camadas', 'se.projList': 'Projetos', 'se.svgLabel': 'SVG',
      'se.g.canvas': 'Canvas', 'se.g.shape': 'Forma', 'se.f.cw': 'Largura', 'se.f.ch': 'Altura', 'se.f.bg': 'Fundo', 'se.transparent': 'Fundo transparente',
      'se.showGrid': 'Mostrar grade', 'se.snapGrid': 'Ajustar à grade', 'se.f.w': 'Largura', 'se.f.h': 'Altura', 'se.f.rotation': 'Rotação', 'se.f.fill': 'Preenchimento',
      'se.f.stroke': 'Traço', 'se.f.strokeWidth': 'Largura do traço', 'se.f.opacity': 'Opacidade', 'se.f.rx': 'Raio do canto',
      'se.dup': 'Duplicar', 'se.del': 'Excluir', 'se.toggleVis': 'Alternar visibilidade', 'se.bringFront': 'Trazer à frente', 'se.sendBack': 'Enviar para trás',
      'se.pickShape': 'Selecione uma forma no canvas para editá-la.', 'se.layersEmpty': 'Nenhuma forma ainda — adicione acima.',
      'se.geo': 'x {x} · y {y} · {w}×{h} · {r}°', 'se.geoNone': '{n} forma(s) · clique numa para editar',
      'se.added': '{name} adicionada', 'se.cleared': 'Canvas limpo', 'se.sampleLoaded': 'Cena de exemplo carregada', 'se.restored': 'Último trabalho restaurado',
      'se.exportedSvg': 'SVG baixado', 'se.copiedSvg': 'SVG copiado para a área de transferência', 'se.copyFail': 'Não foi possível copiar — baixe o arquivo.',
      'se.exportedPng': 'PNG baixado em {s}×', 'se.pngFail': 'Não foi possível rasterizar o PNG.',
      'se.projNamePh': 'Nome do projeto…', 'se.projSave': 'Salvar', 'se.projOpen': 'Abrir', 'se.projUntitled': 'Trabalho sem nome',
      'se.projEmpty': 'Nada salvo ainda.', 'se.projSaved': 'Salvo "{name}"', 'se.projOpened': 'Aberto "{name}"',
      'se.dbUnavailable': 'Armazenamento local indisponível — projetos não podem ser salvos.', 'se.dbError': 'Não foi possível acessar o armazenamento local.',
      'se.privacy': 'Você desenha e exporta inteiramente no navegador. O trabalho é um modelo de dados puro renderizado em SVG — sem scripts, sem eval, e nada é enviado.'
    }
  });

  VT.registry.add(def);
  return def;
})();
