window.VT = window.VT || {};

/* U12 · Image Studio — a non-destructive local image editor.
 * The source image is decoded once into an offscreen canvas; every edit (rotate, flip,
 * crop, brightness/contrast/saturate/hue/grayscale/sepia/blur) is a parameter applied at
 * draw time, so the original is never mutated and undo/redo only carries the small edit
 * state. Export re-renders the full-resolution frame with the SAME filter string used for
 * the live preview, so what you see is what you download. Nothing is uploaded; all work is
 * on-device (canvas + IndexedDB). No eval, no external assets.
 */
VT.modules['image-studio'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'image-studio';
  const AUTOSAVE_ID = 'is:autosave';

  let alive = false;
  let refs = {};
  let hist = null;
  let autosave = null;
  let srcCanvas = null;   // decoded source at natural size
  let srcName = '';
  let srcType = 'image/png';
  let compareOn = false;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const DEFAULT_EDIT = () => ({
    rot: 0, flipH: false, flipV: false,
    brightness: 100, contrast: 100, saturate: 100, hue: 0, grayscale: 0, sepia: 0, blur: 0,
    crop: 'free', quality: 0.92, format: 'image/png'
  });
  let edit = DEFAULT_EDIT();

  const CROPS = { free: 0, '1:1': 1, '4:3': 4 / 3, '3:2': 3 / 2, '16:9': 16 / 9 };
  const FILTER_ORDER = [
    ['blur', 'px'], ['brightness', '%'], ['contrast', '%'], ['grayscale', '%'],
    ['hue', 'deg'], ['invert', '%'], ['sepia', '%'], ['saturate', '%']
  ];

  function filterString(e) {
    const parts = [];
    if (e.blur > 0) parts.push('blur(' + e.blur + 'px)');
    if (e.brightness !== 100) parts.push('brightness(' + e.brightness + '%)');
    if (e.contrast !== 100) parts.push('contrast(' + e.contrast + '%)');
    if (e.grayscale > 0) parts.push('grayscale(' + e.grayscale + '%)');
    if (e.hue !== 0) parts.push('hue-rotate(' + e.hue + 'deg)');
    if (e.sepia > 0) parts.push('sepia(' + e.sepia + '%)');
    if (e.saturate !== 100) parts.push('saturate(' + e.saturate + '%)');
    return parts.join(' ') || 'none';
  }

  const editsCanonical = () => JSON.stringify(edit);

  function applyEditsToState(val) {
    edit = Object.assign(DEFAULT_EDIT(), val ? JSON.parse(val) : {});
    syncControls();
    render();
    if (autosave) autosave();
  }

  // ---------- geometry ----------
  function computeDims() {
    if (!srcCanvas) return null;
    const swap = edit.rot % 180 !== 0;
    let W = swap ? srcCanvas.height : srcCanvas.width;
    let H = swap ? srcCanvas.width : srcCanvas.height;
    if (edit.crop && CROPS[edit.crop]) {
      const A = CROPS[edit.crop];
      if (W / H > A) { const nW = Math.round(H * A); W = nW; }
      else { const nH = Math.round(W / A); H = nH; }
    }
    return { W, H };
  }

  function render() {
    if (!refs.canvas || !srcCanvas) return;
    const dims = computeDims();
    const stage = refs.stage;
    const availW = Math.max(120, stage.clientWidth - 16);
    const availH = Math.max(120, stage.clientHeight - 16);
    const scale = Math.min(availW / dims.W, availH / dims.H, 1);
    refs.canvas.width = Math.max(1, Math.round(dims.W * scale));
    refs.canvas.height = Math.max(1, Math.round(dims.H * scale));
    const ctx = refs.canvas.getContext('2d');
    ctx.clearRect(0, 0, refs.canvas.width, refs.canvas.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = compareOn ? 'none' : filterString(edit);
    ctx.save();
    ctx.translate(refs.canvas.width / 2, refs.canvas.height / 2);
    ctx.rotate(edit.rot * Math.PI / 180);
    ctx.scale(edit.flipH ? -1 : 1, edit.flipV ? -1 : 1);
    const dw = srcCanvas.width * scale, dh = srcCanvas.height * scale;
    ctx.drawImage(srcCanvas, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    ctx.filter = 'none';
    if (edit.crop && CROPS[edit.crop]) {
      const A = CROPS[edit.crop];
      const cur = refs.canvas.width / refs.canvas.height;
      let cw = refs.canvas.width, ch = refs.canvas.height;
      if (cur > A) cw = Math.round(ch * A); else ch = Math.round(cw / A);
      const x = (refs.canvas.width - cw) / 2, y = (refs.canvas.height - ch) / 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(95,230,255,.9)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, cw, ch);
      ctx.restore();
    }
    refs.dims.textContent = dims.W + ' × ' + dims.H + ' px';
  }

  function commit() {
    if (!alive) return;
    render();
    hist.record(editsCanonical()); syncHist();
    if (autosave) autosave();
  }
  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }

  // ---------- full-res export ----------
  function renderFull() {
    const dims = computeDims();
    const c = document.createElement('canvas'); c.width = dims.W; c.height = dims.H;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = filterString(edit);
    ctx.save();
    ctx.translate(dims.W / 2, dims.H / 2);
    ctx.rotate(edit.rot * Math.PI / 180);
    ctx.scale(edit.flipH ? -1 : 1, edit.flipV ? -1 : 1);
    ctx.drawImage(srcCanvas, -srcCanvas.width / 2, -srcCanvas.height / 2);
    ctx.restore();
    if (edit.crop && CROPS[edit.crop]) {
      const A = CROPS[edit.crop];
      let cw = dims.W, ch = dims.H;
      if (dims.W / dims.H > A) cw = Math.round(ch * A); else ch = Math.round(cw / A);
      const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
      cc.getContext('2d').drawImage(c, Math.round((dims.W - cw) / 2), Math.round((dims.H - ch) / 2), cw, ch, 0, 0, cw, ch);
      return cc;
    }
    return c;
  }

  function exportImage() {
    if (!srcCanvas) { toast(t('is.noImage'), 'error'); return; }
    const c = renderFull();
    const fmt = edit.format;
    const ext = fmt === 'image/jpeg' ? 'jpg' : fmt === 'image/webp' ? 'webp' : 'png';
    const base = (srcName.replace(/\.[^.]+$/, '') || 'image') + '-edited.' + ext;
    if (fmt === 'image/png') {
      c.toBlob((blob) => { if (blob) { U.downloadBlob(blob, base); toast(t('is.exported', { name: base }), 'success'); } }, 'image/png');
    } else {
      c.toBlob((blob) => { if (blob) { U.downloadBlob(blob, base); toast(t('is.exported', { name: base }), 'success'); } }, fmt, edit.quality);
    }
  }

  // ---------- loading ----------
  function setSourceFromImage(img, name, type) {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    srcCanvas = c; srcName = name || 'image'; srcType = type || 'image/png';
    edit = DEFAULT_EDIT();
    buildControls();
    hist.reset(editsCanonical()); syncHist();
    refs.dropzone.hidden = true;
    refs.editor.hidden = false;
    requestAnimationFrame(() => render());
    if (autosave) autosave();
    refs.hint.textContent = t('is.loaded', { w: img.naturalWidth, h: img.naturalHeight });
  }

  async function handleFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { toast(t('is.badType'), 'error'); return; }
    try {
      const url = await U.readFileAsDataURL(file);
      const img = await U.loadImage(url);
      if (!alive) return;
      setSourceFromImage(img, file.name, file.type);
    } catch (e) { toast(t('is.loadFail'), 'error'); }
  }

  function loadSample() {
    const w = 800, h = 600;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0a1b2e'); g.addColorStop(0.5, '#123a5c'); g.addColorStop(1, '#5FE6FF');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 3 + 1, 0, 7); ctx.fillStyle = 'rgba(255,255,255,' + (Math.random() * .8 + .2) + ')'; ctx.fill(); }
    ctx.fillStyle = '#04070F'; ctx.font = 'bold 46px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('VISTANOLOGY', w / 2, h / 2);
    ctx.fillStyle = '#EAF7FF'; ctx.font = '22px Inter, system-ui, sans-serif';
    ctx.fillText('Image Studio sample', w / 2, h / 2 + 40);
    U.loadImage(c.toDataURL('image/png')).then((img) => { if (alive) setSourceFromImage(img, 'sample.png', 'image/png'); });
  }

  // ---------- controls ----------
  const SLIDERS = [
    ['brightness', 0, 200, '%'], ['contrast', 0, 200, '%'], ['saturate', 0, 200, '%'],
    ['hue', 0, 360, 'deg'], ['grayscale', 0, 100, '%'], ['sepia', 0, 100, '%'], ['blur', 0, 12, 'px']
  ];

  function sliderRow(key, min, max, unit) {
    const row = document.createElement('div'); row.className = 'field is-ctrl';
    const lab = document.createElement('label'); lab.textContent = t('is.f.' + key);
    const line = document.createElement('div'); line.className = 'is-ctrl-line';
    const input = document.createElement('input'); input.type = 'range'; input.className = 'bench-range';
    input.min = min; input.max = max; input.step = 1; input.value = edit[key]; input.dataset.k = key;
    const val = document.createElement('span'); val.className = 'bench-val'; val.dataset.v = key; val.textContent = edit[key] + unit;
    input.addEventListener('input', () => { edit[key] = Number(input.value); val.textContent = input.value + unit; commit(); });
    line.append(input, val); row.append(lab, line); return row;
  }

  function syncControls() {
    $$('.bench-range[data-k]', refs.controls).forEach((inp) => { const k = inp.dataset.k; inp.value = edit[k]; const v = refs.controls.querySelector('.bench-val[data-v="' + k + '"]'); if (v) { const unit = (k === 'hue' ? 'deg' : k === 'blur' ? 'px' : '%'); v.textContent = edit[k] + unit; } });
    const sel = refs.controls.querySelector('#is-crop'); if (sel) sel.value = edit.crop;
    const format = refs.controls.querySelector('#is-format'); if (format) format.value = edit.format;
    const quality = refs.controls.querySelector('#is-quality-row input'); if (quality) quality.value = Math.round(edit.quality * 100);
    const qualityValue = refs.controls.querySelector('#is-quality-row .bench-val'); if (qualityValue) qualityValue.textContent = Math.round(edit.quality * 100) + '%';
    toggleQuality();
    $$('.is-chip[data-rot]', refs.controls).forEach((b) => { const on = Number(b.dataset.rot) === edit.rot; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
    $$('.is-chip[data-flip]', refs.controls).forEach((b) => { const on = !!edit[b.dataset.flip]; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
  }

  function buildControls() {
    const wrap = refs.controls; if (!wrap) return;
    wrap.innerHTML = '';
    // Transform group
    const g1 = group(t('is.g.transform'));
    const rotRow = document.createElement('div'); rotRow.className = 'is-chips';
    [['-90', 'is.rot.ccw', 'ccw'], ['90', 'is.rot.cw', 'cw']].forEach(([d, k]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-ghost btn-sm is-chip'; b.dataset.rot = d; b.setAttribute('aria-pressed', 'false'); b.textContent = t(k);
      b.addEventListener('click', () => { edit.rot = ((edit.rot + Number(d)) % 360 + 360) % 360; syncControls(); commit(); });
      rotRow.append(b);
    });
    g1.append(rotRow);
    const flipRow = document.createElement('div'); flipRow.className = 'is-chips';
    [['flipH', 'is.flipH'], ['flipV', 'is.flipV']].forEach(([k, lab]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-ghost btn-sm is-chip'; b.dataset.flip = k; b.textContent = t(lab);
      b.addEventListener('click', () => { edit[k] = !edit[k]; syncControls(); commit(); });
      flipRow.append(b);
    });
    g1.append(flipRow);
    // Crop
    const cropRow = document.createElement('div'); cropRow.className = 'field is-ctrl';
    const cl = document.createElement('label'); cl.textContent = t('is.f.crop');
    const cs = document.createElement('select'); cs.className = 'input'; cs.id = 'is-crop';
    Object.keys(CROPS).forEach((c) => { const o = document.createElement('option'); o.value = c; o.textContent = t('is.crop.' + c); cs.append(o); });
    cs.value = edit.crop; cs.addEventListener('change', () => { edit.crop = cs.value; commit(); });
    cropRow.append(cl, cs); g1.append(cropRow);
    wrap.append(g1);

    // Adjust group
    const g2 = group(t('is.g.adjust'));
    SLIDERS.forEach(([k, min, max, unit]) => g2.append(sliderRow(k, min, max, unit)));
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'btn btn-ghost btn-sm'; reset.textContent = t('is.reset');
    reset.addEventListener('click', () => { edit = Object.assign(DEFAULT_EDIT(), { format: edit.format, quality: edit.quality }); syncControls(); commit(); refs.hint.textContent = t('is.resetDone'); });
    g2.append(reset);
    wrap.append(g2);

    // Export group
    const g3 = group(t('is.g.export'));
    const fRow = document.createElement('div'); fRow.className = 'field is-ctrl';
    const fl = document.createElement('label'); fl.textContent = t('is.f.format');
    const fs = document.createElement('select'); fs.className = 'input'; fs.id = 'is-format';
    [['image/png', 'PNG'], ['image/jpeg', 'JPEG'], ['image/webp', 'WebP']].forEach(([v, lab]) => { const o = document.createElement('option'); o.value = v; o.textContent = lab; fs.append(o); });
    fs.value = edit.format; fs.addEventListener('change', () => { edit.format = fs.value; toggleQuality(); commit(); });
    fRow.append(fl, fs); g3.append(fRow);
    const qRow = document.createElement('div'); qRow.className = 'field is-ctrl'; qRow.id = 'is-quality-row';
    const ql = document.createElement('label'); ql.textContent = t('is.f.quality');
    const qline = document.createElement('div'); qline.className = 'is-ctrl-line';
    const qi = document.createElement('input'); qi.type = 'range'; qi.className = 'bench-range'; qi.min = 10; qi.max = 100; qi.step = 1; qi.value = Math.round(edit.quality * 100);
    const qv = document.createElement('span'); qv.className = 'bench-val'; qv.textContent = Math.round(edit.quality * 100) + '%';
    qi.addEventListener('input', () => { edit.quality = Number(qi.value) / 100; qv.textContent = qi.value + '%'; commit(); });
    qline.append(qi, qv); qRow.append(ql, qline); g3.append(qRow);
    wrap.append(g3);
    toggleQuality();
    syncControls();
  }

  function toggleQuality() { const r = refs.controls.querySelector('#is-quality-row'); if (r) r.style.display = edit.format === 'image/png' ? 'none' : ''; }

  function group(title) { const g = document.createElement('section'); g.className = 'bench-sec glass'; const h = document.createElement('h3'); h.className = 'bench-sec-head'; h.textContent = title; g.append(h); return g; }

  // ---------- persistence ----------
  function loadProjects() {
    refs.projList.innerHTML = '';
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty is-empty">' + esc(t('is.dbUnavailable')) + '</div>'; return; }
    VT.db.list('image-studio').then((rows) => {
      rows = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.projList.innerHTML = '<div class="bench-empty is-empty">' + esc(t('is.projEmpty')) + '</div>'; return; }
      rows.forEach((r) => {
        const el = document.createElement('div'); el.className = 'bench-row is-proj-row';
        const info = document.createElement('div'); info.className = 'is-proj-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('is.projUntitled');
        const meta = document.createElement('span'); meta.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(nm, meta);
        const open = document.createElement('button'); open.type = 'button'; open.className = 'btn btn-ghost btn-sm'; open.textContent = t('is.projOpen');
        open.addEventListener('click', () => {
          const d = r.data || {};
          if (!d.src) { toast(t('is.projNoSrc'), 'error'); return; }
          U.loadImage(d.src).then((img) => {
            if (!alive) return;
            setSourceFromImage(img, d.name || t('is.projUntitled'), d.type || 'image/png');
            edit = Object.assign(DEFAULT_EDIT(), d.edit || {});
            buildControls(); hist.reset(editsCanonical()); syncHist(); render();
            toast(t('is.projOpened', { name: r.name || t('is.projUntitled') }), 'success');
          }).catch(() => toast(t('is.loadFail'), 'error'));
        });
        el.append(info, open); refs.projList.append(el);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty is-empty">' + esc(t('is.dbError')) + '</div>'; });
  }

  function mount(root) {
    alive = true;
    const s = VT.store.get(KEY, null);
    edit = Object.assign(DEFAULT_EDIT(), (s && s.edit) || {});
    const I = VT.icons;

    root.innerHTML = `
      <div class="is-stage glass-2" id="is-stage">
        <div class="is-bar">
          <button class="btn btn-ghost btn-sm" id="is-undo" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
          <button class="btn btn-ghost btn-sm" id="is-redo" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
          <span class="bench-sep" aria-hidden="true"></span>
          <button class="btn btn-ghost btn-sm" id="is-compare">${I.target} ${t('is.compare')}</button>
          <button class="btn btn-ghost btn-sm" id="is-new">${I.image} ${t('is.newImage')}</button>
          <span class="is-bar-actions">
            <button class="btn btn-primary btn-sm" id="is-export">${I.download} ${t('is.export')}</button>
          </span>
        </div>
        <div class="bench-hint" id="is-hint" role="status" aria-live="polite"></div>

        <div class="is-dropzone" id="is-dropzone">
          <input type="file" id="is-file" accept="image/*" hidden>
          <div class="is-drop-inner">
            <div class="is-drop-ic">${I.image}</div>
            <p class="is-drop-title">${t('is.dropTitle')}</p>
            <p class="is-drop-sub">${t('is.dropSub')}</p>
            <div class="is-drop-actions">
              <button class="btn btn-primary btn-sm" id="is-browse">${t('is.browse')}</button>
              <button class="btn btn-ghost btn-sm" id="is-sample">${t('is.sample')}</button>
            </div>
          </div>
        </div>

        <div class="is-editor" id="is-editor" hidden>
          <aside class="is-controls" id="is-controls" aria-label="${t('is.controls')}"></aside>
          <section class="is-preview" aria-label="${t('is.preview')}">
            <div class="is-canvas-wrap" id="is-canvas-wrap"><canvas id="is-canvas"></canvas></div>
            <div class="is-dims" id="is-dims"></div>
          </section>
          <aside class="is-side">
            <section class="bench-sec glass">
              <h3 class="bench-sec-head">${t('is.projList')}</h3>
              <div class="is-proj-save">
                <input class="input" id="is-proj-name" type="text" placeholder="${t('is.projNamePh')}" aria-label="${t('is.projNamePh')}">
                <button class="btn btn-ghost btn-sm" id="is-proj-save">${I.file} ${t('is.projSave')}</button>
              </div>
              <div class="bench-list is-proj-list" id="is-proj-list"></div>
            </section>
          </aside>
        </div>

        <p class="privacy-line">${I.shield} ${t('is.privacy')}</p>
      </div>`;

    refs = {
      stage: $('#is-stage', root), hint: $('#is-hint', root),
      dropzone: $('#is-dropzone', root), editor: $('#is-editor', root),
      canvas: $('#is-canvas', root), canvasWrap: $('#is-canvas-wrap', root), dims: $('#is-dims', root),
      controls: $('#is-controls', root), projList: $('#is-proj-list', root), projName: $('#is-proj-name', root),
      undo: $('#is-undo', root), redo: $('#is-redo', root), file: $('#is-file', root)
    };

    autosave = U.debounce(() => {
      if (!alive) return;
      VT.store.set(KEY, { edit });
      if (VT.db.available && srcCanvas) {
        try {
          VT.db.put({ id: AUTOSAVE_ID, tool: 'image-studio', name: '(autosave)', data: { src: srcCanvas.toDataURL('image/png'), name: srcName, type: srcType, edit } }).catch(() => {});
        } catch (e) { /* tainted or oversized; skip autosave of pixels */ }
      }
    }, 800);

    hist = VT.history.create({ apply: (val) => applyEditsToState(val) });

    // file input + dropzone
    $('#is-browse', root).addEventListener('click', () => refs.file.click());
    $('#is-sample', root).addEventListener('click', () => loadSample());
    refs.file.addEventListener('change', () => handleFile(refs.file.files[0]));
    const dz = refs.dropzone;
    ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('is-drag'); }));
    ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('is-drag'); }));
    dz.addEventListener('drop', (e) => { const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]; handleFile(f); });
    // paste anywhere in the stage
    refs.stage.addEventListener('paste', (e) => { const it = e.clipboardData && e.clipboardData.items; if (!it) return; for (const x of it) { if (x.type && x.type.startsWith('image/')) { handleFile(x.getAsFile()); break; } } });

    $('#is-new', root).addEventListener('click', () => { refs.file.value = ''; refs.editor.hidden = true; refs.dropzone.hidden = false; srcCanvas = null; });
    $('#is-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#is-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });
    $('#is-compare', root).addEventListener('click', () => { compareOn = !compareOn; $('#is-compare', root).classList.toggle('is-active', compareOn); if (srcCanvas) render(); });
    $('#is-export', root).addEventListener('click', () => exportImage());

    $('#is-proj-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('is.dbUnavailable'), 'error'); return; }
      if (!srcCanvas) { toast(t('is.noImage'), 'error'); return; }
      const name = refs.projName.value.trim() || t('is.projUntitled');
      refs.projName.value = name;
      try {
        await VT.db.put({ tool: 'image-studio', name, data: { src: srcCanvas.toDataURL('image/png'), name: srcName, type: srcType, edit } });
        toast(t('is.projSaved', { name }), 'success'); loadProjects();
      } catch (e) { toast(t('is.dbError'), 'error'); }
    });

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) syncHist();
    });

    buildControls();
    hist.reset(editsCanonical()); syncHist();
    loadProjects();

    // restore autosave source if present
    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then((rec) => {
        if (!alive || !rec || !rec.data || !rec.data.src) return;
        U.loadImage(rec.data.src).then((img) => {
          if (!alive) return;
          setSourceFromImage(img, rec.data.name || 'image', rec.data.type || 'image/png');
          edit = Object.assign(DEFAULT_EDIT(), rec.data.edit || {});
          buildControls(); hist.reset(editsCanonical()); syncHist(); render();
          refs.hint.textContent = t('is.restored');
        }).catch(() => {});
      }).catch(() => {});
    }

    return () => { alive = false; };
  }

  function unmount() { alive = false; hist = null; autosave = null; refs = {}; srcCanvas = null; compareOn = false; }

  const def = {
    id: 'image-studio', cat: 'media', icon: 'image', version: '0.1.0',
    name: { en: 'Image Studio', pt: 'Estúdio de Imagem' },
    tagline: {
      en: 'A non-destructive local image editor: rotate, flip, crop and tune brightness, contrast, saturation, hue, grayscale, sepia and blur, compare against the original, and export PNG, JPEG or WebP at full resolution. The original is never mutated and nothing is uploaded. Fully offline.',
      pt: 'Um editor de imagens local não destrutivo: gire, espelhe, recorte e ajuste brilho, contraste, saturação, matiz, escala de cinza, sépia e desfoque, compare com o original e exporte PNG, JPEG ou WebP em resolução total. O original nunca é alterado e nada é enviado. Totalmente offline.'
    },
    tags: ['image', 'photo', 'edit', 'filter', 'crop', 'media'],
    deps: [],
    docs: {
      en: {
        summary: 'Load any local image and edit it non-destructively: rotation, flips, center-crop aspect presets and a CSS-filter stack (brightness, contrast, saturate, hue-rotate, grayscale, sepia, blur). The live preview and the exported file use the same filter string, so the download matches what you see.',
        usage: [
          'Load an image: Choose image, drop one on the dropzone, paste from the clipboard, or start from Use sample.',
          'Rotate with ⟲ / ⟳, flip with ↔ / ↕, then pick a Crop aspect ratio.',
          'Drag the Brightness, Contrast, Saturation, Hue, Grayscale, Sepia and Blur sliders.',
          'Hold Compare to see the untouched original; step through the edit stack with undo/redo.',
          'Pick PNG, JPEG or WebP, set quality where the format allows it, then Export at full resolution — or save a named project.'
        ],
        privacy: 'The image is decoded into a canvas in your browser and every edit is applied at draw time; the source pixels are never overwritten. No image data, keys or files are uploaded, and there are no analytics or trackers. Projects and autosave are stored on-device via IndexedDB.',
        limits: [
          'Crop is center-based on fixed aspect presets rather than a free drag rectangle, and the edit set is the curated filter/transform list, not a full retouch toolchain.',
          'Export is PNG, JPEG or WebP only; blur is computed at preview scale and again at full resolution on export, so a strong blur is slower there.',
          'Editing needs canvas ctx.filter support, and autosave skips the pixels without warning when the canvas cannot be serialized (tainted or oversized source).'
        ]
      },
      pt: {
        summary: 'Carregue qualquer imagem local e edite-a de forma não destrutiva: rotação, espelhamentos, predefinições de recorte por proporção e uma pilha de filtros CSS (brilho, contraste, saturação, matiz, escala de cinza, sépia, desfoque). A prévia ao vivo e o arquivo exportado usam a mesma string de filtros, então o download corresponde ao que você vê.',
        usage: [
          'Carregue uma imagem: Escolher imagem, solte uma na área de soltura, cole da área de transferência ou comece por Usar exemplo.',
          'Gire com ⟲ / ⟳, espelhe com ↔ / ↕ e escolha uma proporção de Recorte.',
          'Arraste os controles de Brilho, Contraste, Saturação, Matiz, Escala de cinza, Sépia e Desfoque.',
          'Segure Comparar para ver o original intacto; percorra a pilha de edições com desfazer/refazer.',
          'Escolha PNG, JPEG ou WebP, ajuste a qualidade quando o formato permitir e Exporte na resolução total — ou salve um projeto nomeado.'
        ],
        privacy: 'A imagem é decodificada em um canvas no seu navegador e cada edição é aplicada no momento do desenho; os pixels originais nunca são sobrescritos. Nenhum dado de imagem, chave ou arquivo é enviado, e não há analytics nem rastreadores. Projetos e salvamento automático ficam no dispositivo via IndexedDB.',
        limits: [
          'O recorte é central e sobre proporções fixas, não um retângulo livre de arrastar; o conjunto de edições é a lista curada de filtros e transformações, não uma cadeia completa de retoque.',
          'A exportação é só PNG, JPEG ou WebP; o desfoque é calculado na escala da prévia e de novo em resolução total ao exportar, então um desfoque forte fica mais lento aí.',
          'A edição exige suporte a ctx.filter no canvas, e o salvamento automático pula os pixels sem aviso quando o canvas não pode ser serializado (origem contaminada ou grande demais).'
        ]
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'is.dropTitle': 'Drop an image here', 'is.dropSub': 'or choose a file, drag one in, paste from the clipboard, or try a sample.',
      'is.browse': 'Choose image', 'is.sample': 'Use sample', 'is.newImage': 'New image', 'is.compare': 'Compare',
      'is.export': 'Export', 'is.controls': 'Edit', 'is.preview': 'Preview', 'is.projList': 'Saved',
      'is.g.transform': 'Transform', 'is.g.adjust': 'Adjust', 'is.g.export': 'Export',
      'is.rot.ccw': 'Rotate ⟲', 'is.rot.cw': 'Rotate ⟳', 'is.flipH': 'Flip ↔', 'is.flipV': 'Flip ↕',
      'is.f.crop': 'Crop', 'is.f.brightness': 'Brightness', 'is.f.contrast': 'Contrast', 'is.f.saturate': 'Saturation',
      'is.f.hue': 'Hue', 'is.f.grayscale': 'Grayscale', 'is.f.sepia': 'Sepia', 'is.f.blur': 'Blur',
      'is.f.format': 'Format', 'is.f.quality': 'Quality', 'is.reset': 'Reset edits',
      'is.crop.free': 'Free (no crop)', 'is.crop.1:1': 'Square 1:1', 'is.crop.4:3': 'Portrait 4:3', 'is.crop.3:2': 'Photo 3:2', 'is.crop.16:9': 'Wide 16:9',
      'is.loaded': 'Loaded {w}×{h}px image', 'is.restored': 'Restored your last edit', 'is.resetDone': 'Edits reset',
      'is.exported': 'Exported {name}', 'is.noImage': 'Load an image first.', 'is.badType': 'That file is not an image.', 'is.loadFail': 'Could not read that image.',
      'is.projNamePh': 'Project name…', 'is.projSave': 'Save', 'is.projOpen': 'Open', 'is.projUntitled': 'Untitled project',
      'is.projEmpty': 'Nothing saved yet.', 'is.projSaved': 'Saved "{name}"', 'is.projOpened': 'Opened "{name}"', 'is.projNoSrc': 'That project has no stored image.',
      'is.dbUnavailable': 'Local storage unavailable — projects cannot be saved.', 'is.dbError': 'Could not reach local storage.',
      'is.privacy': 'You edit and export entirely in your browser. The original pixels are never overwritten and nothing is uploaded.'
    },
    pt: {
      'is.dropTitle': 'Solte uma imagem aqui', 'is.dropSub': 'ou escolha um arquivo, arraste um, cole da área de transferência ou experimente um exemplo.',
      'is.browse': 'Escolher imagem', 'is.sample': 'Usar exemplo', 'is.newImage': 'Nova imagem', 'is.compare': 'Comparar',
      'is.export': 'Exportar', 'is.controls': 'Editar', 'is.preview': 'Prévia', 'is.projList': 'Salvos',
      'is.g.transform': 'Transformar', 'is.g.adjust': 'Ajustar', 'is.g.export': 'Exportar',
      'is.rot.ccw': 'Girar ⟲', 'is.rot.cw': 'Girar ⟳', 'is.flipH': 'Espelhar ↔', 'is.flipV': 'Espelhar ↕',
      'is.f.crop': 'Recorte', 'is.f.brightness': 'Brilho', 'is.f.contrast': 'Contraste', 'is.f.saturate': 'Saturação',
      'is.f.hue': 'Matiz', 'is.f.grayscale': 'Cinza', 'is.f.sepia': 'Sépia', 'is.f.blur': 'Desfoque',
      'is.f.format': 'Formato', 'is.f.quality': 'Qualidade', 'is.reset': 'Redefinir edições',
      'is.crop.free': 'Livre (sem recorte)', 'is.crop.1:1': 'Quadrado 1:1', 'is.crop.4:3': 'Retrato 4:3', 'is.crop.3:2': 'Foto 3:2', 'is.crop.16:9': 'Largo 16:9',
      'is.loaded': 'Imagem {w}×{h}px carregada', 'is.restored': 'Última edição restaurada', 'is.resetDone': 'Edições redefinidas',
      'is.exported': 'Exportado {name}', 'is.noImage': 'Carregue uma imagem primeiro.', 'is.badType': 'Esse arquivo não é uma imagem.', 'is.loadFail': 'Não foi possível ler essa imagem.',
      'is.projNamePh': 'Nome do projeto…', 'is.projSave': 'Salvar', 'is.projOpen': 'Abrir', 'is.projUntitled': 'Projeto sem nome',
      'is.projEmpty': 'Nada salvo ainda.', 'is.projSaved': 'Salvo "{name}"', 'is.projOpened': 'Aberto "{name}"', 'is.projNoSrc': 'Esse projeto não tem imagem armazenada.',
      'is.dbUnavailable': 'Armazenamento local indisponível — projetos não podem ser salvos.', 'is.dbError': 'Não foi possível acessar o armazenamento local.',
      'is.privacy': 'Você edita e exporta inteiramente no navegador. Os pixels originais nunca são sobrescritos e nada é enviado.'
    }
  });

  VT.registry.add(def);
  return def;
})();
