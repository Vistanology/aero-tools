window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['image-convert'] = (() => {
  const U = VT.utils;
  const { $, clamp } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'cv.source': 'Source images', 'cv.drop': 'Drop images or click to browse', 'cv.dropHint': 'PNG, JPEG, WebP, GIF or BMP — several at once, processed locally',
      'cv.output': 'Output', 'cv.format': 'Convert to', 'cv.quality': 'Quality', 'cv.bg': 'JPEG background',
      'cv.bgHint': 'JPEG has no transparency: transparent pixels are filled with this color.',
      'cv.pngHint': 'PNG is lossless: quality does not apply.',
      'cv.queue': 'Conversion queue', 'cv.empty': 'No images yet', 'cv.emptySub': 'Add one or more images to convert them all to a single format.',
      'cv.sample': 'Add sample images',
      'cv.convertAll': 'Convert all', 'cv.zip': 'Download all (.zip)', 'cv.clear': 'Clear queue',
      'cv.totals': '{done}/{total} converted · {in} → {out}',
      'cv.pending': 'Queued', 'cv.busy': 'Converting…', 'cv.done': 'Ready', 'cv.error': 'Failed',
      'cv.alpha': 'has transparency', 'cv.download': 'Download', 'cv.remove': 'Remove',
      'cv.badType': 'Unsupported file: choose a raster image (PNG, JPEG, WebP, GIF, BMP).',
      'cv.badDecode': 'Could not decode this image.', 'cv.badEncode': 'This browser could not encode the chosen format.',
      'cv.svgReject': 'SVG is vector: use SVG Studio to optimize it instead.',
      'cv.added': '{n} image(s) added', 'cv.zipped': 'ZIP with {n} file(s)', 'cv.zipEmpty': 'Convert at least one image first.',
      'cv.privacy': 'Conversion runs on a local canvas. Your images never leave the device.'
    },
    pt: {
      'cv.source': 'Imagens de origem', 'cv.drop': 'Solte imagens ou clique para escolher', 'cv.dropHint': 'PNG, JPEG, WebP, GIF ou BMP — várias de uma vez, processado localmente',
      'cv.output': 'Saída', 'cv.format': 'Converter para', 'cv.quality': 'Qualidade', 'cv.bg': 'Fundo do JPEG',
      'cv.bgHint': 'JPEG não tem transparência: pixels transparentes são preenchidos com esta cor.',
      'cv.pngHint': 'PNG é sem perdas: a qualidade não se aplica.',
      'cv.queue': 'Fila de conversão', 'cv.empty': 'Nenhuma imagem ainda', 'cv.emptySub': 'Adicione uma ou mais imagens para convertê-las todas para um único formato.',
      'cv.sample': 'Adicionar imagens de exemplo',
      'cv.convertAll': 'Converter todas', 'cv.zip': 'Baixar todas (.zip)', 'cv.clear': 'Limpar fila',
      'cv.totals': '{done}/{total} convertidas · {in} → {out}',
      'cv.pending': 'Na fila', 'cv.busy': 'Convertendo…', 'cv.done': 'Pronta', 'cv.error': 'Falhou',
      'cv.alpha': 'tem transparência', 'cv.download': 'Baixar', 'cv.remove': 'Remover',
      'cv.badType': 'Arquivo não suportado: escolha uma imagem raster (PNG, JPEG, WebP, GIF, BMP).',
      'cv.badDecode': 'Não foi possível decodificar esta imagem.', 'cv.badEncode': 'Este navegador não conseguiu codificar o formato escolhido.',
      'cv.svgReject': 'SVG é vetorial: use o SVG Studio para otimizá-lo.',
      'cv.added': '{n} imagem(ns) adicionada(s)', 'cv.zipped': 'ZIP com {n} arquivo(s)', 'cv.zipEmpty': 'Converta ao menos uma imagem primeiro.',
      'cv.privacy': 'A conversão roda em um canvas local. Suas imagens nunca saem do dispositivo.'
    }
  });

  const def = {
    id: 'image-convert', cat: 'media', icon: 'convert', version: '1.0.0',
    name: { en: 'Image Converter', pt: 'Conversor de Imagens' },
    tagline: {
      en: 'Batch-convert PNG, JPEG and WebP locally with per-file status, transparency-aware JPEG background and a one-click ZIP.',
      pt: 'Converta PNG, JPEG e WebP em lote localmente com status por arquivo, fundo JPEG ciente de transparência e ZIP em um clique.'
    },
    tags: ['image', 'convert', 'batch', 'png', 'jpeg', 'webp', 'zip', 'transparency'],
    deps: [],
    docs: {
      en: {
        summary: 'Convert a whole batch of raster images to one target format entirely in your browser: per-file queue with live status and byte deltas, quality for lossy formats, a chosen background for transparent pixels going to JPEG, and individual or ZIP download.',
        usage: [
          'Drop several images at once (or click the dropzone) to build the queue.',
          'Pick the target format: PNG, JPEG or WebP; set quality for JPEG/WebP.',
          'For JPEG, choose the background color that replaces transparent pixels.',
          'Convert all; each row shows status, output size and the size delta.',
          'Download files individually or grab everything as a single .zip.'
        ],
        privacy: 'Decoding and re-encoding happen on a local canvas; the ZIP is assembled in memory. Images are never uploaded and never persisted; only output settings survive reload.',
        limits: [
          'PNG output is lossless — quality only affects JPEG/WebP.',
          'GIF/BMP are decoded but animation is not preserved: only the first frame is converted.',
          'SVG is rejected by design (vector): use SVG Studio instead.',
          'The ZIP uses the store method (no compression): it bundles files, it does not shrink them further.'
        ]
      },
      pt: {
        summary: 'Converta um lote inteiro de imagens raster para um formato-alvo inteiramente no navegador: fila por arquivo com status ao vivo e deltas de bytes, qualidade para formatos com perdas, fundo escolhido para pixels transparentes indo a JPEG, e download individual ou ZIP.',
        usage: [
          'Solte várias imagens de uma vez (ou clique na dropzone) para montar a fila.',
          'Escolha o formato-alvo: PNG, JPEG ou WebP; defina a qualidade para JPEG/WebP.',
          'Para JPEG, escolha a cor de fundo que substitui os pixels transparentes.',
          'Converta todas; cada linha mostra status, tamanho de saída e o delta de tamanho.',
          'Baixe os arquivos individualmente ou pegue tudo em um único .zip.'
        ],
        privacy: 'Decodificação e recodificação rodam em canvas local; o ZIP é montado em memória. As imagens nunca são enviadas nem persistidas; só as configurações de saída sobrevivem ao reload.',
        limits: [
          'PNG é sem perdas — a qualidade só afeta JPEG/WebP.',
          'GIF/BMP são decodificados, mas a animação não é preservada: só o primeiro quadro é convertido.',
          'SVG é rejeitado por design (vetorial): use o SVG Studio.',
          'O ZIP usa o método store (sem compressão): ele agrupa arquivos, não os reduz mais.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'image-convert';
  const FORMATS = ['png', 'jpeg', 'webp'];
  let alive = false;
  let state = { format: 'png', quality: 90, bg: '#FFFFFF' };
  let items = [];
  let seq = 0;
  let converting = false;
  let refs = {};

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (FORMATS.includes(s.format)) state.format = s.format;
    const q = Number(s.quality); if (Number.isInteger(q) && q >= 10 && q <= 100) state.quality = q;
    if (typeof s.bg === 'string' && U.normalizeHex(s.bg)) state.bg = U.normalizeHex(s.bg);
  }

  const mimeOf = (f) => 'image/' + f;
  const extOf = (mime) => ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[mime] || 'png');

  /* ---- minimal store-only ZIP (no compression, no dependency) ---- */
  const CRC_TABLE = (() => {
    const tbl = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); tbl[n] = c >>> 0; }
    return tbl;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function zipStore(entries) {
    const enc = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    for (const { name, bytes } of entries) {
      const nameB = enc.encode(name);
      const crc = crc32(bytes);
      const local = new DataView(new ArrayBuffer(30));
      local.setUint32(0, 0x04034b50, true);
      local.setUint16(4, 20, true);
      local.setUint16(6, 0x0800, true);
      local.setUint16(8, 0, true);
      local.setUint16(10, dosTime, true);
      local.setUint16(12, dosDate, true);
      local.setUint32(14, crc, true);
      local.setUint32(18, bytes.length, true);
      local.setUint32(22, bytes.length, true);
      local.setUint16(26, nameB.length, true);
      local.setUint16(28, 0, true);
      chunks.push(new Uint8Array(local.buffer), nameB, bytes);
      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true);
      cen.setUint16(4, 20, true);
      cen.setUint16(6, 20, true);
      cen.setUint16(8, 0x0800, true);
      cen.setUint16(10, 0, true);
      cen.setUint16(12, dosTime, true);
      cen.setUint16(14, dosDate, true);
      cen.setUint32(16, crc, true);
      cen.setUint32(20, bytes.length, true);
      cen.setUint32(24, bytes.length, true);
      cen.setUint16(28, nameB.length, true);
      cen.setUint32(42, offset, true);
      central.push(new Uint8Array(cen.buffer), nameB);
      offset += 30 + nameB.length + bytes.length;
    }
    const centralSize = central.reduce((n, c) => n + c.length, 0);
    const eocd = new DataView(new ArrayBuffer(22));
    eocd.setUint32(0, 0x06054b50, true);
    eocd.setUint16(8, entries.length, true);
    eocd.setUint16(10, entries.length, true);
    eocd.setUint32(12, centralSize, true);
    eocd.setUint32(16, offset, true);
    return new Blob([...chunks, ...central, new Uint8Array(eocd.buffer)], { type: 'application/zip' });
  }

  function detectAlpha(img) {
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 64, 64);
    const d = ctx.getImageData(0, 0, 64, 64).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
    return false;
  }

  function totals() {
    const done = items.filter((i) => i.status === 'done');
    const inB = items.reduce((n, i) => n + i.meta.size, 0);
    const outB = done.reduce((n, i) => n + i.outBlob.size, 0);
    return { done: done.length, total: items.length, inB, outB };
  }

  function updateRow(it) {
    it.rStatus.textContent = t('cv.' + it.status);
    it.rStatus.dataset.status = it.status;
    it.rOut.textContent = it.status === 'done' ? U.formatBytes(it.outBlob.size) : '—';
    if (it.status === 'done') {
      const delta = (1 - it.outBlob.size / it.meta.size) * 100;
      it.rDelta.textContent = (delta >= 0 ? '−' : '+') + Math.abs(delta).toFixed(1) + '%';
      it.rDelta.dataset.dir = delta >= 0 ? 'down' : 'up';
    } else { it.rDelta.textContent = ''; }
    it.rTarget.textContent = extOf(mimeOf(state.format)).toUpperCase();
    it.rDl.disabled = it.status !== 'done';
    it.rThumb.src = it.status === 'done' ? it.outUrl : it.srcUrl;
  }

  function render() {
    if (!alive) return;
    refs.empty.hidden = items.length > 0;
    refs.list.hidden = items.length === 0;
    const tt = totals();
    refs.totals.textContent = t('cv.totals', { done: tt.done, total: tt.total, in: U.formatBytes(tt.inB), out: U.formatBytes(tt.outB) });
    refs.zip.disabled = tt.done === 0;
    refs.convert.disabled = converting || items.length === 0;
    refs.clear.disabled = items.length === 0;
    refs.quality.disabled = state.format === 'png';
    refs.qualityVal.textContent = state.quality + '%';
    refs.pngHint.hidden = state.format !== 'png';
    refs.bgField.hidden = state.format !== 'jpeg';
    refs.bgHint.hidden = state.format !== 'jpeg';
    items.forEach(updateRow);
  }

  function makeRow(it) {
    const row = document.createElement('li');
    row.className = 'cv-row';
    row.innerHTML = `
      <img class="cv-thumb" alt="">
      <div class="cv-info">
        <strong class="cv-name"></strong>
        <span class="cv-meta hint"></span>
        <span class="cv-alpha hint" hidden>${t('cv.alpha')}</span>
      </div>
      <div class="cv-result">
        <span class="cv-target mono"></span>
        <span class="cv-out mono"></span>
        <span class="cv-delta mono"></span>
        <span class="cv-status" data-status="pending"></span>
      </div>
      <div class="cv-actions">
        <button class="btn btn-sm cv-dl">${VT.icons.download} ${t('cv.download')}</button>
        <button class="btn btn-ghost btn-sm cv-rm" aria-label="${t('cv.remove')}">${VT.icons.x}</button>
      </div>`;
    it.rThumb = $('.cv-thumb', row);
    it.rName = $('.cv-name', row);
    it.rMeta = $('.cv-meta', row);
    it.rAlpha = $('.cv-alpha', row);
    it.rTarget = $('.cv-target', row);
    it.rOut = $('.cv-out', row);
    it.rDelta = $('.cv-delta', row);
    it.rStatus = $('.cv-status', row);
    it.rDl = $('.cv-dl', row);
    it.rName.textContent = it.meta.name;
    it.rMeta.textContent = `${extOf(it.meta.type).toUpperCase()} · ${U.formatBytes(it.meta.size)} · ${it.img.naturalWidth}×${it.img.naturalHeight}`;
    it.rAlpha.hidden = !it.alpha;
    it.rDl.addEventListener('click', () => {
      if (it.status !== 'done') return;
      U.downloadBlob(it.outBlob, outName(it));
    });
    $('.cv-rm', row).addEventListener('click', () => removeItem(it));
    it.el = row;
    refs.list.appendChild(row);
    updateRow(it);
  }

  const outName = (it) => it.meta.name.replace(/\.[^.]+$/, '') + '.' + extOf(mimeOf(state.format));

  function convertItem(it) {
    return new Promise((resolve) => {
      it.status = 'busy'; updateRow(it);
      const type = mimeOf(state.format);
      const cv = document.createElement('canvas');
      cv.width = it.img.naturalWidth; cv.height = it.img.naturalHeight;
      const ctx = cv.getContext('2d');
      if (type === 'image/jpeg') { ctx.fillStyle = state.bg; ctx.fillRect(0, 0, cv.width, cv.height); }
      ctx.drawImage(it.img, 0, 0);
      cv.toBlob((blob) => {
        if (!alive) { resolve(); return; }
        if (!blob) { it.status = 'error'; updateRow(it); resolve(); return; }
        if (it.outUrl) URL.revokeObjectURL(it.outUrl);
        it.outBlob = blob; it.outUrl = URL.createObjectURL(blob);
        it.status = 'done'; updateRow(it); resolve();
      }, type, state.quality / 100);
    });
  }

  async function convertAll() {
    if (converting || !items.length) return;
    converting = true; render();
    for (const it of items) { await convertItem(it); render(); }
    converting = false; render();
  }
  const convertSoon = U.debounce(convertAll, 150);

  function removeItem(it) {
    if (it.srcUrl) URL.revokeObjectURL(it.srcUrl);
    if (it.outUrl) URL.revokeObjectURL(it.outUrl);
    items = items.filter((x) => x !== it);
    it.el.remove();
    render();
  }

  function clearAll() {
    items.forEach((it) => { if (it.srcUrl) URL.revokeObjectURL(it.srcUrl); if (it.outUrl) URL.revokeObjectURL(it.outUrl); });
    items = [];
    refs.list.innerHTML = '';
    render();
  }

  async function addFiles(files) {
    let added = 0;
    for (const file of Array.from(files)) {
      if (!file) continue;
      if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) { toast(t('cv.svgReject'), 'error'); continue; }
      if (!file.type.startsWith('image/')) { toast(t('cv.badType'), 'error'); continue; }
      const url = URL.createObjectURL(file);
      let img;
      try { img = await U.loadImage(url); }
      catch { URL.revokeObjectURL(url); toast(t('cv.badDecode'), 'error'); continue; }
      if (!img.naturalWidth || !img.naturalHeight) { URL.revokeObjectURL(url); toast(t('cv.badDecode'), 'error'); continue; }
      const it = { id: ++seq, file, img, srcUrl: url, outBlob: null, outUrl: null, status: 'pending', alpha: detectAlpha(img), meta: { name: file.name, type: file.type, size: file.size } };
      items.push(it);
      makeRow(it);
      added++;
    }
    if (added) { toast(t('cv.added', { n: added }), 'success'); render(); convertAll(); }
    else render();
  }

  function sampleFiles() {
    const mk = (w, h, hue, alpha) => new Promise((res) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsl(${hue} 60% 18%)`); g.addColorStop(1, `hsl(${hue + 40} 80% 60%)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      if (alpha) { ctx.clearRect(w * 0.25, h * 0.25, w * 0.5, h * 0.5); }
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(w * 0.7, h * 0.35, Math.min(w, h) * 0.18, 0, Math.PI * 2); ctx.fill();
      cv.toBlob((b) => res(new File([b], alpha ? 'exemplo-alpha.png' : `exemplo-${hue}.png`, { type: 'image/png' })), 'image/png');
    });
    return Promise.all([mk(640, 420, 200, false), mk(420, 420, 20, true)]);
  }

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="cv-layout">
        <div class="cv-left">
          <section class="cv-stage glass-2">
            <div class="cv-bar">
              <h3 class="cv-title">${t('cv.queue')}</h3>
              <span class="hint mono" id="cv-totals"></span>
            </div>
            <div class="empty" id="cv-empty">
              <span class="orb orb-lg">${I.convert}</span>
              <strong>${t('cv.empty')}</strong>
              <span>${t('cv.emptySub')}</span>
              <button class="btn btn-sm" id="cv-sample">${I.sparkle} ${t('cv.sample')}</button>
            </div>
            <ul class="cv-list" id="cv-list" hidden></ul>
            <div class="export-row">
              <button class="btn btn-primary" id="cv-convert">${I.convert} ${t('cv.convertAll')}</button>
              <button class="btn" id="cv-zip">${I.download} ${t('cv.zip')}</button>
              <button class="btn btn-ghost" id="cv-clear">${I.x} ${t('cv.clear')}</button>
            </div>
            <p class="privacy-line">${I.shield} ${t('cv.privacy')}</p>
          </section>
        </div>
        <div class="cv-controls">
          <section class="step glass">
            <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('cv.source')}</h3></div>
            <div class="dropzone" id="cv-drop" tabindex="0" role="button" aria-label="${t('cv.drop')}">
              <span class="orb orb-sm">${I.upload}</span>
              <strong>${t('cv.drop')}</strong><span>${t('cv.dropHint')}</span>
            </div>
            <input type="file" id="cv-file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" multiple hidden>
          </section>
          <section class="step glass">
            <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('cv.output')}</h3></div>
            <div class="field"><label for="cv-format">${t('cv.format')}</label>
              <select class="input" id="cv-format">
                <option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option>
              </select></div>
            <div class="field"><label for="cv-quality">${t('cv.quality')} · <span id="cv-quality-val"></span></label>
              <input type="range" id="cv-quality" min="10" max="100" step="1"></div>
            <p class="hint" id="cv-pnghint" hidden>${t('cv.pngHint')}</p>
            <div class="field" id="cv-bg-field" hidden><label for="cv-bg">${t('cv.bg')}</label>
              <input type="color" class="input cv-bg" id="cv-bg"></div>
            <p class="hint" id="cv-bghint" hidden>${t('cv.bgHint')}</p>
          </section>
        </div>
      </div>`;

    refs = {
      empty: $('#cv-empty', root), list: $('#cv-list', root), totals: $('#cv-totals', root),
      convert: $('#cv-convert', root), zip: $('#cv-zip', root), clear: $('#cv-clear', root),
      quality: $('#cv-quality', root), qualityVal: $('#cv-quality-val', root),
      pngHint: $('#cv-pnghint', root), bgField: $('#cv-bg-field', root), bgHint: $('#cv-bghint', root),
      drop: $('#cv-drop', root), file: $('#cv-file', root)
    };

    const fmt = $('#cv-format', root); fmt.value = state.format;
    fmt.addEventListener('change', () => { state.format = fmt.value; persist(); render(); convertSoon(); });
    const q = refs.quality; q.value = state.quality;
    q.addEventListener('input', () => { state.quality = clamp(Number(q.value), 10, 100); persist(); render(); convertSoon(); });
    const bg = $('#cv-bg', root); bg.value = state.bg;
    bg.addEventListener('input', () => { state.bg = U.normalizeHex(bg.value) || '#FFFFFF'; persist(); convertSoon(); });

    refs.drop.addEventListener('click', () => refs.file.click());
    refs.drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); refs.file.click(); } });
    ['dragover', 'dragenter'].forEach((ev) => refs.drop.addEventListener(ev, (e) => { e.preventDefault(); refs.drop.classList.add('dragover'); }));
    ['dragleave', 'dragend'].forEach((ev) => refs.drop.addEventListener(ev, () => refs.drop.classList.remove('dragover')));
    refs.drop.addEventListener('drop', (e) => { e.preventDefault(); refs.drop.classList.remove('dragover'); addFiles(e.dataTransfer.files); });
    refs.file.addEventListener('change', () => { addFiles(refs.file.files); refs.file.value = ''; });
    $('#cv-sample', root).addEventListener('click', async () => { addFiles(await sampleFiles()); });
    refs.convert.addEventListener('click', convertAll);
    refs.clear.addEventListener('click', clearAll);
    refs.zip.addEventListener('click', async () => {
      const done = items.filter((i) => i.status === 'done');
      if (!done.length) { toast(t('cv.zipEmpty'), 'error'); return; }
      const entries = [];
      for (const it of done) entries.push({ name: outName(it), bytes: new Uint8Array(await it.outBlob.arrayBuffer()) });
      U.downloadBlob(zipStore(entries), 'vistanology-convert.zip');
      toast(t('cv.zipped', { n: entries.length }), 'success');
    });

    render();
    return () => { alive = false; };
  }

  function unmount() {
    alive = false;
    items.forEach((it) => { if (it.srcUrl) URL.revokeObjectURL(it.srcUrl); if (it.outUrl) URL.revokeObjectURL(it.outUrl); });
    items = [];
  }

  VT.registry.add(def);
  return def;
})();