window.VT = window.VT || {};

/* U13 · Favicon & Icon Studio — generate a full multi-size app/favicon icon set locally.
 * Source is either a raster image (file / drag / paste) or a text/emoji monogram. A shared
 * renderIcon(size) draws every output from the SAME code path used for the live preview grid,
 * so each exported PNG matches what you see. No upload, no eval, no external assets; icons and
 * the generated site.webmanifest are produced on-device. Sizes are deterministic and verifiable.
 */
VT.modules['favicon-studio'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'favicon-studio';
  const AUTOSAVE_ID = 'fs:autosave';

  let alive = false;
  let refs = {};
  let hist = null;
  let autosave = null;
  let imgEl = null;        // decoded Image for image sources
  let srcThumb = '';       // dataURL of the source image (kept out of history snapshots)

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const SIZES = [16, 32, 48, 64, 128, 180, 192, 512];

  const DEFAULT_OPTS = () => ({
    type: 'monogram', bg: '#0B1B2E', bgMode: 'solid', bg2: '#5FE6FF',
    fg: '#5FE6FF', shape: 'rounded', radius: 22, pad: 12,
    text: 'V', font: 62, name: 'Vistanology'
  });
  let opts = DEFAULT_OPTS();

  const optsCanonical = () => JSON.stringify(opts);

  function applyOpts(val) {
    opts = Object.assign(DEFAULT_OPTS(), val ? JSON.parse(val) : {});
    syncControls();
    renderGrid();
  }

  function config() { return { src: srcThumb, opts }; }

  // ---------- rendering ----------
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function renderIcon(size) {
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    ctx.save();
    if (opts.shape === 'circle') { ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2, 0, 7); ctx.closePath(); ctx.clip(); }
    else if (opts.shape === 'rounded') { roundRect(ctx, 0, 0, size, size, size * opts.radius / 100); ctx.clip(); }
    if (opts.bgMode !== 'transparent') {
      if (opts.bgMode === 'gradient') { const g = ctx.createLinearGradient(0, 0, size, size); g.addColorStop(0, opts.bg); g.addColorStop(1, opts.bg2); ctx.fillStyle = g; }
      else ctx.fillStyle = opts.bg;
      ctx.fillRect(0, 0, size, size);
    }
    const inner = size * (1 - 2 * opts.pad / 100);
    const off = (size - inner) / 2;
    if (opts.type === 'image' && imgEl) {
      const iw = imgEl.naturalWidth, ih = imgEl.naturalHeight;
      const s = Math.min(inner / iw, inner / ih);
      const dw = iw * s, dh = ih * s;
      ctx.drawImage(imgEl, off + (inner - dw) / 2, off + (inner - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = opts.fg;
      ctx.font = '700 ' + Math.round(size * opts.font / 100) + 'px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(opts.text || 'V', size / 2, size / 2 + size * 0.02);
    }
    ctx.restore();
    return c;
  }

  function renderGrid() {
    if (!refs.grid) return;
    refs.grid.innerHTML = '';
    SIZES.forEach((sz) => {
      const cell = document.createElement('div'); cell.className = 'fs-cell';
      const c = renderIcon(sz);
      c.style.width = sz + 'px'; c.style.height = sz + 'px';
      c.style.maxWidth = '128px'; c.style.maxHeight = '128px';
      const lab = document.createElement('span'); lab.className = 'fs-cell-label'; lab.textContent = sz + '×' + sz;
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn-ghost btn-sm fs-dl'; btn.textContent = t('fs.dl');
      btn.addEventListener('click', () => exportOne(sz));
      cell.append(c, lab, btn); refs.grid.append(cell);
    });
  }

  function commit() {
    if (!alive) return;
    renderGrid();
    hist.record(optsCanonical()); syncHist();
    if (autosave) autosave();
  }
  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }

  // ---------- source ----------
  function setSourceImage(img, thumb) {
    imgEl = img; srcThumb = thumb;
    opts.type = 'image';
    syncTypeUI(); syncControls(); commit();
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast(t('fs.badType'), 'error'); return; }
    try {
      const url = await U.readFileAsDataURL(file);
      const img = await U.loadImage(url);
      if (!alive) return;
      const max = 512; const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const tc = document.createElement('canvas'); tc.width = Math.round(img.naturalWidth * scale); tc.height = Math.round(img.naturalHeight * scale);
      tc.getContext('2d').drawImage(img, 0, 0, tc.width, tc.height);
      setSourceImage(img, tc.toDataURL('image/png'));
      refs.hint.textContent = t('fs.sourceSet', { w: img.naturalWidth, h: img.naturalHeight });
    } catch (e) { toast(t('fs.loadFail'), 'error'); }
  }

  // ---------- export ----------
  function exportOne(size) {
    if (!size) return;
    renderIcon(size).toBlob((blob) => {
      if (!blob) { toast(t('fs.exportFail'), 'error'); return; }
      U.downloadBlob(blob, 'icon-' + size + 'x' + size + '.png');
      toast(t('fs.exportedOne', { size }), 'success');
    }, 'image/png');
  }

  function exportAll() {
    SIZES.forEach((sz, i) => setTimeout(() => exportOne(sz), i * 250));
    toast(t('fs.exportedAll', { n: SIZES.length }), 'success');
  }

  function buildManifest() {
    return JSON.stringify({
      name: opts.name || 'App', short_name: (opts.name || 'App').slice(0, 12),
      start_url: '/', display: 'standalone', background_color: opts.bgMode === 'transparent' ? '#ffffff' : opts.bg,
      theme_color: opts.bgMode === 'transparent' ? opts.fg : opts.bg,
      icons: SIZES.map((sz) => ({ src: 'icons/icon-' + sz + 'x' + sz + '.png', sizes: sz + 'x' + sz, type: 'image/png' }))
    }, null, 2);
  }

  function exportManifest() {
    U.downloadText(buildManifest(), 'site.webmanifest', 'application/manifest+json');
    toast(t('fs.manifestExported'), 'success');
  }

  // ---------- controls ----------
  function syncTypeUI() {
    $$('.fs-tab', refs.controls).forEach((b) => b.classList.toggle('is-on', b.dataset.type === opts.type));
    const imgPanel = refs.controls.querySelector('#fs-img-panel'); if (imgPanel) imgPanel.hidden = opts.type !== 'image';
    const monoPanel = refs.controls.querySelector('#fs-mono-panel'); if (monoPanel) monoPanel.hidden = opts.type !== 'monogram';
    const srcLabel = refs.controls.querySelector('#fs-src-label'); if (srcLabel) srcLabel.textContent = srcThumb ? t('fs.loaded') : t('fs.noSrc');
  }

  function syncControls() {
    if (!refs.controls) return;
    $$('.bench-color[data-k]', refs.controls).forEach((inp) => { inp.value = opts[inp.dataset.k]; });
    const shapeSel = refs.controls.querySelector('#fs-shape'); if (shapeSel) shapeSel.value = opts.shape;
    const bgModeSel = refs.controls.querySelector('#fs-bgmode'); if (bgModeSel) bgModeSel.value = opts.bgMode;
    $$('.bench-range[data-k]', refs.controls).forEach((inp) => { const k = inp.dataset.k; inp.value = opts[k]; const v = refs.controls.querySelector('.bench-val[data-v="' + k + '"]'); if (v) v.textContent = opts[k] + (k === 'font' || k === 'pad' || k === 'radius' ? '%' : ''); });
    const txt = refs.controls.querySelector('#fs-text'); if (txt) txt.value = opts.text;
    const nm = refs.controls.querySelector('#fs-name'); if (nm) nm.value = opts.name;
    const grad2 = refs.controls.querySelector('#fs-grad2-row'); if (grad2) grad2.style.display = opts.bgMode === 'gradient' ? '' : 'none';
    syncTypeUI();
  }

  function colorRow(key, labelKey) {
    const row = document.createElement('div'); row.className = 'fs-ctrl fs-ctrl-inline';
    const lab = document.createElement('label'); lab.textContent = t(labelKey);
    const inp = document.createElement('input'); inp.type = 'color'; inp.className = 'bench-color'; inp.dataset.k = key; inp.value = opts[key];
    inp.addEventListener('input', () => { opts[key] = inp.value; commit(); });
    row.append(lab, inp); return row;
  }
  function rangeRow(key, min, max, unit) {
    const row = document.createElement('div'); row.className = 'fs-ctrl';
    const lab = document.createElement('label'); lab.textContent = t('fs.f.' + key);
    const line = document.createElement('div'); line.className = 'fs-ctrl-line';
    const inp = document.createElement('input'); inp.type = 'range'; inp.className = 'bench-range'; inp.dataset.k = key; inp.min = min; inp.max = max; inp.step = 1; inp.value = opts[key];
    const val = document.createElement('span'); val.className = 'bench-val'; val.dataset.v = key; val.textContent = opts[key] + unit;
    inp.addEventListener('input', () => { opts[key] = Number(inp.value); val.textContent = inp.value + unit; commit(); });
    line.append(inp, val); row.append(lab, line); return row;
  }
  function selectRow(id, labelKey, values, key) {
    const row = document.createElement('div'); row.className = 'fs-ctrl';
    const lab = document.createElement('label'); lab.textContent = t(labelKey);
    const sel = document.createElement('select'); sel.className = 'input'; sel.id = id;
    values.forEach((v) => { const o = document.createElement('option'); o.value = v; o.textContent = t('fs.v.' + key + '.' + v); sel.append(o); });
    sel.value = opts[key]; sel.addEventListener('change', () => { opts[key] = sel.value; if (key === 'bgMode') syncControls(); commit(); });
    row.append(lab, sel); return row;
  }

  function buildControls() {
    const wrap = refs.controls; if (!wrap) return;
    wrap.innerHTML = '';
    // Source group
    const g0 = group(t('fs.g.source'));
    const tabs = document.createElement('div'); tabs.className = 'fs-tabs';
    [['monogram', 'fs.src.monogram'], ['image', 'fs.src.image']].forEach(([tp, lab]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-ghost btn-sm fs-tab'; b.dataset.type = tp; b.textContent = t(lab);
      b.addEventListener('click', () => { opts.type = tp; syncTypeUI(); commit(); });
      tabs.append(b);
    });
    g0.append(tabs);
    // monogram panel
    const mono = document.createElement('div'); mono.id = 'fs-mono-panel';
    const textRow = document.createElement('div'); textRow.className = 'fs-ctrl';
    const tl = document.createElement('label'); tl.textContent = t('fs.f.text');
    const ti = document.createElement('input'); ti.type = 'text'; ti.className = 'input'; ti.id = 'fs-text'; ti.maxLength = 4; ti.value = opts.text;
    ti.addEventListener('input', () => { opts.text = ti.value; commit(); });
    textRow.append(tl, ti); mono.append(textRow);
    mono.append(rangeRow('font', 20, 90, '%'));
    mono.append(colorRow('fg', 'fs.f.fg'));
    g0.append(mono);
    // image panel
    const imgp = document.createElement('div'); imgp.id = 'fs-img-panel'; imgp.hidden = opts.type !== 'image';
    const pick = document.createElement('button'); pick.type = 'button'; pick.className = 'btn btn-ghost btn-sm'; pick.textContent = t('fs.pick');
    pick.addEventListener('click', () => refs.file.click());
    const srcLabel = document.createElement('span'); srcLabel.className = 'fs-src-label'; srcLabel.id = 'fs-src-label'; srcLabel.textContent = srcThumb ? t('fs.loaded') : t('fs.noSrc');
    imgp.append(pick, srcLabel);
    g0.append(imgp);
    wrap.append(g0);

    // Background group
    const g1 = group(t('fs.g.background'));
    g1.append(selectRow('fs-bgmode', 'fs.f.bgMode', ['solid', 'gradient', 'transparent'], 'bgMode'));
    g1.append(colorRow('bg', 'fs.f.bg'));
    const grad2 = document.createElement('div'); grad2.id = 'fs-grad2-row';
    grad2.append(colorRow('bg2', 'fs.f.bg2')); g1.append(grad2);
    wrap.append(g1);

    // Shape group
    const g2 = group(t('fs.g.shape'));
    g2.append(selectRow('fs-shape', 'fs.f.shape', ['square', 'rounded', 'circle'], 'shape'));
    g2.append(rangeRow('radius', 0, 50, '%'));
    g2.append(rangeRow('pad', 0, 40, '%'));
    wrap.append(g2);

    // Manifest group
    const g3 = group(t('fs.g.manifest'));
    const nameRow = document.createElement('div'); nameRow.className = 'fs-ctrl';
    const nl = document.createElement('label'); nl.textContent = t('fs.f.name');
    const ni = document.createElement('input'); ni.type = 'text'; ni.className = 'input'; ni.id = 'fs-name'; ni.value = opts.name;
    ni.addEventListener('input', () => { opts.name = ni.value; if (autosave) autosave(); });
    nameRow.append(nl, ni); g3.append(nameRow);
    wrap.append(g3);

    syncControls();
  }

  /* A rail section is the bench's own piece: .bench-sec + glass, headed by
     .bench-sec-head. The tool had written a white card with a hairline and a
     hand-tuned label, which is the one look the design system forbids. */
  function group(title) { const g = document.createElement('div'); g.className = 'bench-sec glass'; const h = document.createElement('div'); h.className = 'bench-sec-head'; h.textContent = title; g.append(h); return g; }

  // ---------- persistence ----------
  function loadPresets() {
    refs.presetList.innerHTML = '';
    if (!VT.db.available) { refs.presetList.innerHTML = '<div class="bench-empty fs-empty">' + esc(t('fs.dbUnavailable')) + '</div>'; return; }
    VT.db.list('favicon-studio').then((rows) => {
      rows = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.presetList.innerHTML = '<div class="bench-empty fs-empty">' + esc(t('fs.presetEmpty')) + '</div>'; return; }
      rows.forEach((r) => {
        const el = document.createElement('div'); el.className = 'bench-row fs-preset-row';
        const info = document.createElement('div'); info.className = 'fs-preset-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('fs.presetUntitled');
        const meta = document.createElement('span'); meta.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(nm, meta);
        const open = document.createElement('button'); open.type = 'button'; open.className = 'btn btn-ghost btn-sm'; open.textContent = t('fs.presetOpen');
        open.addEventListener('click', () => {
          const d = r.data || {};
          opts = Object.assign(DEFAULT_OPTS(), d.opts || {});
          srcThumb = d.src || '';
          if (srcThumb) { U.loadImage(srcThumb).then((img) => { if (alive) { imgEl = img; buildControls(); hist.record(optsCanonical()); syncHist(); renderGrid(); } }); }
          else { imgEl = null; buildControls(); hist.record(optsCanonical()); syncHist(); renderGrid(); }
          toast(t('fs.presetOpened', { name: r.name || t('fs.presetUntitled') }), 'success');
        });
        el.append(info, open); refs.presetList.append(el);
      });
    }).catch(() => { refs.presetList.innerHTML = '<div class="bench-empty fs-empty">' + esc(t('fs.dbError')) + '</div>'; });
  }

  function mount(root) {
    alive = true;
    const s = VT.store.get(KEY, null);
    opts = Object.assign(DEFAULT_OPTS(), (s && s.opts) || {});
    const I = VT.icons;

    root.innerHTML = `
      <div class="fs-stage glass-2" id="fs-stage">
        <div class="fs-bar">
          <button class="btn btn-ghost btn-sm" id="fs-undo" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
          <button class="btn btn-ghost btn-sm" id="fs-redo" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
          <span class="fs-sep" aria-hidden="true"></span>
          <button class="btn btn-ghost btn-sm" id="fs-reset">${I.broom} ${t('fs.reset')}</button>
          <span class="fs-bar-actions">
            <button class="btn btn-ghost btn-sm" id="fs-copy-manifest">${I.copy} ${t('fs.copyManifest')}</button>
            <button class="btn btn-ghost btn-sm" id="fs-export-manifest">${I.file} ${t('fs.exportManifest')}</button>
            <button class="btn btn-primary btn-sm" id="fs-export-all">${I.download} ${t('fs.exportAll')}</button>
          </span>
        </div>
        <div class="fs-hint" id="fs-hint" role="status" aria-live="polite"></div>

        <div class="fs-work">
          <aside class="fs-controls" id="fs-controls" aria-label="${t('fs.controls')}"></aside>
          <section class="fs-preview" aria-label="${t('fs.preview')}">
            <div class="fs-grid" id="fs-grid"></div>
          </section>
          <aside class="fs-side">
            <div class="fs-col-head">${t('fs.presetList')}</div>
            <div class="fs-preset-save">
              <input class="input" id="fs-preset-name" type="text" placeholder="${t('fs.presetNamePh')}" aria-label="${t('fs.presetNamePh')}">
              <button class="btn btn-ghost btn-sm" id="fs-preset-save">${I.file} ${t('fs.presetSave')}</button>
            </div>
            <div class="bench-list fs-preset-list" id="fs-preset-list"></div>
            <div class="fs-col-head">${t('fs.manifestPreview')}</div>
            <pre class="bench-code fs-manifest" id="fs-manifest"></pre>
          </aside>
        </div>

        <input type="file" id="fs-file" accept="image/*" hidden>
        <p class="privacy-line">${I.shield} ${t('fs.privacy')}</p>
      </div>`;

    refs = {
      stage: $('#fs-stage', root), hint: $('#fs-hint', root), controls: $('#fs-controls', root),
      grid: $('#fs-grid', root), manifest: $('#fs-manifest', root),
      presetList: $('#fs-preset-list', root), presetName: $('#fs-preset-name', root),
      undo: $('#fs-undo', root), redo: $('#fs-redo', root), file: $('#fs-file', root)
    };

    autosave = U.debounce(() => {
      if (!alive) return;
      VT.store.set(KEY, { opts });
      if (VT.db.available) {
        VT.db.put({ id: AUTOSAVE_ID, tool: 'favicon-studio', name: '(autosave)', data: { src: srcThumb, opts } }).catch(() => {});
      }
      if (refs.manifest) refs.manifest.textContent = buildManifest();
    }, 700);

    hist = VT.history.create({ apply: (val) => applyOpts(val) });

    buildControls();
    renderGrid();
    refs.manifest.textContent = buildManifest();

    // file input + paste + drop
    refs.file.addEventListener('change', () => handleFile(refs.file.files[0]));
    refs.stage.addEventListener('paste', (e) => { const it = e.clipboardData && e.clipboardData.items; if (!it) return; for (const x of it) { if (x.type && x.type.startsWith('image/')) { handleFile(x.getAsFile()); break; } } });
    ['dragover'].forEach((ev) => refs.stage.addEventListener(ev, (e) => e.preventDefault()));
    refs.stage.addEventListener('drop', (e) => { e.preventDefault(); const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; if (f) handleFile(f); });

    $('#fs-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#fs-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });
    $('#fs-reset', root).addEventListener('click', () => { opts = DEFAULT_OPTS(); imgEl = null; srcThumb = ''; buildControls(); hist.record(optsCanonical()); syncHist(); renderGrid(); if (autosave) autosave(); refs.hint.textContent = t('fs.resetDone'); });
    $('#fs-export-all', root).addEventListener('click', () => exportAll());
    $('#fs-export-manifest', root).addEventListener('click', () => exportManifest());
    $('#fs-copy-manifest', root).addEventListener('click', async () => { const ok = await U.copyText(buildManifest()); toast(ok ? t('fs.copiedManifest') : t('fs.copyFail'), ok ? 'success' : 'error'); });

    $('#fs-preset-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('fs.dbUnavailable'), 'error'); return; }
      const name = refs.presetName.value.trim() || t('fs.presetUntitled');
      refs.presetName.value = name;
      try { await VT.db.put({ tool: 'favicon-studio', name, data: { src: srcThumb, opts } }); toast(t('fs.presetSaved', { name }), 'success'); loadPresets(); }
      catch (e) { toast(t('fs.dbError'), 'error'); }
    });

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) syncHist();
    });

    hist.reset(optsCanonical()); syncHist();
    loadPresets();

    // restore autosave source
    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then((rec) => {
        if (!alive || !rec || !rec.data) return;
        opts = Object.assign(DEFAULT_OPTS(), rec.data.opts || {});
        srcThumb = rec.data.src || '';
        const done = () => { buildControls(); hist.reset(optsCanonical()); syncHist(); renderGrid(); refs.manifest.textContent = buildManifest(); refs.hint.textContent = t('fs.restored'); };
        if (srcThumb && opts.type === 'image') { U.loadImage(srcThumb).then((img) => { if (alive) { imgEl = img; done(); } }).catch(done); }
        else done();
      }).catch(() => {});
    }

    return () => { alive = false; };
  }

  function unmount() { alive = false; hist = null; autosave = null; refs = {}; imgEl = null; srcThumb = ''; }

  const def = {
    id: 'favicon-studio', cat: 'generators', icon: 'palette', version: '0.1.0',
    name: { en: 'Favicon & Icon Studio', pt: 'Estúdio de Favicon e Ícones' },
    tagline: {
      en: 'Generate a complete app/favicon icon set (16→512px + apple-touch) from an image or a text/emoji monogram. Tune background, shape, padding and colors, preview every size live, and export PNGs plus a ready-to-use site.webmanifest. Deterministic, local, offline.',
      pt: 'Gere um conjunto completo de ícones de app/favicon (16→512px + apple-touch) a partir de uma imagem ou de um monograma de texto/emoji. Ajuste fundo, forma, espaçamento e cores, pré-visualize cada tamanho ao vivo e exporte PNGs além de um site.webmanifest pronto para uso. Determinístico, local, offline.'
    },
    tags: ['favicon', 'icon', 'app', 'manifest', 'pwa', 'generators'],
    deps: [],
    docs: {
      en: {
        summary: 'A local icon-set generator: feed it a raster image or a short monogram, choose a background (solid, gradient or transparent), a shape (square, rounded, circle), padding and colors, and it renders every standard size — 16, 32, 48, 64, 128, 180, 192, 512 — from one shared draw routine.',
        usage: [
          'Choose a source tab — Monogram (up to 4 characters) or Image (pick, drop or paste onto the stage).',
          'Set Fill (Solid, Gradient or Transparent), Shape (Square, Rounded or Circle), the corner radius, padding and foreground color.',
          'Read the live size grid and Download the size you need, or use Export all for the eight PNGs.',
          'Copy or download the generated site.webmanifest, and keep the styling as a named preset.'
        ],
        privacy: 'Everything is drawn to a canvas in your browser and exported as files you keep. No image, text or settings are uploaded; there are no analytics or trackers. Presets and autosave live on-device via IndexedDB.',
        limits: [
          'Fixed square sizes only — 16, 32, 48, 64, 128, 180, 192 and 512 — and PNG only: no ICO, no SVG, no custom sizes.',
          'A source image is downscaled to at most 512 px and re-encoded as PNG, so the export is not byte-identical to your file.',
          'The manifest references icons/icon-<size>.png paths you have to place yourself, Export all fires eight timed downloads a browser may block, and short_name is cut to 12 characters.'
        ]
      },
      pt: {
        summary: 'Um gerador local de conjuntos de ícones: forneça uma imagem raster ou um monograma curto, escolha um fundo (sólido, gradiente ou transparente), uma forma (quadrado, arredondado, círculo), espaçamento e cores, e ele renderiza todos os tamanhos padrão — 16, 32, 48, 64, 128, 180, 192, 512 — a partir de uma única rotina de desenho.',
        usage: [
          'Escolha uma aba de origem — Monograma (até 4 caracteres) ou Imagem (selecione, solte ou cole na área).',
          'Defina Preenchimento (Sólido, Gradiente ou Transparente), Forma (Quadrado, Arredondado ou Círculo), o raio do canto, o espaçamento e a cor do primeiro plano.',
          'Leia a grade de tamanhos ao vivo e Baixe o tamanho necessário, ou use Exportar tudo para os oito PNGs.',
          'Copie ou baixe o site.webmanifest gerado e guarde o estilo como uma predefinição nomeada.'
        ],
        privacy: 'Tudo é desenhado num canvas no seu navegador e exportado como arquivos seus. Nenhuma imagem, texto ou configuração é enviada; não há analytics nem rastreadores. Predefinições e salvamento automático ficam no dispositivo via IndexedDB.',
        limits: [
          'Só tamanhos quadrados fixos — 16, 32, 48, 64, 128, 180, 192 e 512 — e somente PNG: sem ICO, sem SVG, sem tamanho personalizado.',
          'Uma imagem de origem é reduzida a no máximo 512 px e re-codificada como PNG, então a exportação não é byte a byte o seu arquivo.',
          'O manifest aponta para caminhos icons/icon-<tamanho>.png que você precisa colocar no lugar, Exportar tudo dispara oito downloads cronometrados que o navegador pode bloquear, e short_name é cortado em 12 caracteres.'
        ]
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'fs.controls': 'Design', 'fs.preview': 'Icon set', 'fs.presetList': 'Presets', 'fs.manifestPreview': 'Manifest',
      'fs.g.source': 'Source', 'fs.g.background': 'Background', 'fs.g.shape': 'Shape & spacing', 'fs.g.manifest': 'Manifest',
      'fs.src.monogram': 'Monogram', 'fs.src.image': 'Image', 'fs.pick': 'Choose image', 'fs.noSrc': 'No image loaded', 'fs.loaded': 'Image loaded',
      'fs.f.text': 'Text / emoji', 'fs.f.font': 'Glyph size', 'fs.f.fg': 'Foreground', 'fs.f.bg': 'Background', 'fs.f.bg2': 'Gradient end',
      'fs.f.bgMode': 'Fill', 'fs.f.shape': 'Shape', 'fs.f.radius': 'Corner radius', 'fs.f.pad': 'Padding', 'fs.f.name': 'App name',
      'fs.v.bgMode.solid': 'Solid', 'fs.v.bgMode.gradient': 'Gradient', 'fs.v.bgMode.transparent': 'Transparent',
      'fs.v.shape.square': 'Square', 'fs.v.shape.rounded': 'Rounded', 'fs.v.shape.circle': 'Circle',
      'fs.reset': 'Reset', 'fs.dl': 'Download', 'fs.exportAll': 'Export all PNGs', 'fs.copyManifest': 'Copy manifest', 'fs.exportManifest': 'Export manifest',
      'fs.restored': 'Restored your last icon set', 'fs.resetDone': 'Design reset', 'fs.sourceSet': 'Loaded {w}×{h}px source',
      'fs.exportedOne': 'Saved icon-{size}x{size}.png', 'fs.exportedAll': 'Exported {n} icon sizes', 'fs.exportFail': 'Could not export that icon.',
      'fs.manifestExported': 'site.webmanifest exported', 'fs.copiedManifest': 'Manifest copied to clipboard', 'fs.copyFail': 'Could not copy — export the file instead.',
      'fs.badType': 'That file is not an image.', 'fs.loadFail': 'Could not read that image.',
      'fs.presetNamePh': 'Preset name…', 'fs.presetSave': 'Save', 'fs.presetOpen': 'Open', 'fs.presetUntitled': 'Untitled preset',
      'fs.presetEmpty': 'Nothing saved yet.', 'fs.presetSaved': 'Saved "{name}"', 'fs.presetOpened': 'Opened "{name}"',
      'fs.dbUnavailable': 'Local storage unavailable — presets cannot be saved.', 'fs.dbError': 'Could not reach local storage.',
      'fs.privacy': 'Icons are drawn and exported entirely in your browser. Nothing — image, text or settings — is ever uploaded.'
    },
    pt: {
      'fs.controls': 'Design', 'fs.preview': 'Conjunto de ícones', 'fs.presetList': 'Predefinições', 'fs.manifestPreview': 'Manifest',
      'fs.g.source': 'Fonte', 'fs.g.background': 'Fundo', 'fs.g.shape': 'Forma e espaçamento', 'fs.g.manifest': 'Manifest',
      'fs.src.monogram': 'Monograma', 'fs.src.image': 'Imagem', 'fs.pick': 'Escolher imagem', 'fs.noSrc': 'Nenhuma imagem carregada', 'fs.loaded': 'Imagem carregada',
      'fs.f.text': 'Texto / emoji', 'fs.f.font': 'Tamanho do glifo', 'fs.f.fg': 'Primeiro plano', 'fs.f.bg': 'Fundo', 'fs.f.bg2': 'Fim do gradiente',
      'fs.f.bgMode': 'Preenchimento', 'fs.f.shape': 'Forma', 'fs.f.radius': 'Raio do canto', 'fs.f.pad': 'Espaçamento', 'fs.f.name': 'Nome do app',
      'fs.v.bgMode.solid': 'Sólido', 'fs.v.bgMode.gradient': 'Gradiente', 'fs.v.bgMode.transparent': 'Transparente',
      'fs.v.shape.square': 'Quadrado', 'fs.v.shape.rounded': 'Arredondado', 'fs.v.shape.circle': 'Círculo',
      'fs.reset': 'Redefinir', 'fs.dl': 'Baixar', 'fs.exportAll': 'Exportar todos os PNGs', 'fs.copyManifest': 'Copiar manifest', 'fs.exportManifest': 'Exportar manifest',
      'fs.restored': 'Último conjunto de ícones restaurado', 'fs.resetDone': 'Design redefinido', 'fs.sourceSet': 'Fonte {w}×{h}px carregada',
      'fs.exportedOne': 'Ícone icon-{size}x{size}.png salvo', 'fs.exportedAll': '{n} tamanhos de ícone exportados', 'fs.exportFail': 'Não foi possível exportar esse ícone.',
      'fs.manifestExported': 'site.webmanifest exportado', 'fs.copiedManifest': 'Manifest copiado para a área de transferência', 'fs.copyFail': 'Não foi possível copiar — exporte o arquivo.',
      'fs.badType': 'Esse arquivo não é uma imagem.', 'fs.loadFail': 'Não foi possível ler essa imagem.',
      'fs.presetNamePh': 'Nome da predefinição…', 'fs.presetSave': 'Salvar', 'fs.presetOpen': 'Abrir', 'fs.presetUntitled': 'Predefinição sem nome',
      'fs.presetEmpty': 'Nada salvo ainda.', 'fs.presetSaved': 'Salvo "{name}"', 'fs.presetOpened': 'Aberto "{name}"',
      'fs.dbUnavailable': 'Armazenamento local indisponível — predefinições não podem ser salvas.', 'fs.dbError': 'Não foi possível acessar o armazenamento local.',
      'fs.privacy': 'Os ícones são desenhados e exportados inteiramente no navegador. Nada — imagem, texto ou configuração — é enviado.'
    }
  });

  VT.registry.add(def);
  return def;
})();
