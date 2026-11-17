window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['image-resize'] = (() => {
  const U = VT.utils;
  const { $, clamp } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'rs.source': 'Image', 'rs.drop': 'Drop an image or click to browse', 'rs.dropHint': 'PNG, JPEG, WebP, GIF or BMP — processed locally',
      'rs.sample': 'Use a sample image', 'rs.replace': 'Replace image', 'rs.clear': 'Remove',
      'rs.size': 'New size', 'rs.mode.percent': 'Percent', 'rs.mode.pixels': 'Pixels', 'rs.mode.fit': 'Fit box',
      'rs.percent': 'Scale', 'rs.width': 'Width', 'rs.height': 'Height', 'rs.lock': 'Lock aspect ratio',
      'rs.fitW': 'Max width', 'rs.fitH': 'Max height',
      'rs.smooth': 'Resampling', 'rs.smooth.high': 'High (smooth)', 'rs.smooth.medium': 'Medium', 'rs.smooth.low': 'Low (pixelated)',
      'rs.output': 'Output', 'rs.format': 'Format', 'rs.fmt.auto': 'Keep source format', 'rs.quality': 'Quality',
      'rs.pngHint': 'PNG is lossless: the quality slider does not apply.',
      'rs.preview': 'Resized preview', 'rs.m.src': 'Original', 'rs.m.out': 'New size', 'rs.m.scale': 'Scale', 'rs.m.bytes': 'File size',
      'rs.download': 'Download resized', 'rs.empty': 'No image yet', 'rs.emptySub': 'Drop a file above or generate a sample to resize it.',
      'rs.upscale': 'Upscaling beyond 100% cannot add detail — it only interpolates pixels.',
      'rs.badType': 'Unsupported file: choose a raster image (PNG, JPEG, WebP, GIF, BMP).',
      'rs.badDecode': 'Could not decode this image.', 'rs.badEncode': 'This browser could not encode the chosen format.',
      'rs.svgReject': 'SVG is vector: use SVG Studio to optimize it instead.',
      'rs.copiedFmt': 'Resized to {w}×{h}', 'rs.privacy': 'Resizing runs on a local canvas. Your image never leaves the device.'
    },
    pt: {
      'rs.source': 'Imagem', 'rs.drop': 'Solte uma imagem ou clique para escolher', 'rs.dropHint': 'PNG, JPEG, WebP, GIF ou BMP — processado localmente',
      'rs.sample': 'Usar imagem de exemplo', 'rs.replace': 'Trocar imagem', 'rs.clear': 'Remover',
      'rs.size': 'Novo tamanho', 'rs.mode.percent': 'Percentual', 'rs.mode.pixels': 'Pixels', 'rs.mode.fit': 'Caixa',
      'rs.percent': 'Escala', 'rs.width': 'Largura', 'rs.height': 'Altura', 'rs.lock': 'Travar proporção',
      'rs.fitW': 'Largura máx.', 'rs.fitH': 'Altura máx.',
      'rs.smooth': 'Reamostragem', 'rs.smooth.high': 'Alta (suave)', 'rs.smooth.medium': 'Média', 'rs.smooth.low': 'Baixa (pixelada)',
      'rs.output': 'Saída', 'rs.format': 'Formato', 'rs.fmt.auto': 'Manter formato de origem', 'rs.quality': 'Qualidade',
      'rs.pngHint': 'PNG é sem perdas: o slider de qualidade não se aplica.',
      'rs.preview': 'Prévia redimensionada', 'rs.m.src': 'Original', 'rs.m.out': 'Novo tamanho', 'rs.m.scale': 'Escala', 'rs.m.bytes': 'Tamanho',
      'rs.download': 'Baixar redimensionada', 'rs.empty': 'Nenhuma imagem ainda', 'rs.emptySub': 'Solte um arquivo acima ou gere um exemplo para redimensioná-lo.',
      'rs.upscale': 'Ampliar além de 100% não adiciona detalhe — apenas interpola pixels.',
      'rs.badType': 'Arquivo não suportado: escolha uma imagem raster (PNG, JPEG, WebP, GIF, BMP).',
      'rs.badDecode': 'Não foi possível decodificar esta imagem.', 'rs.badEncode': 'Este navegador não conseguiu codificar o formato escolhido.',
      'rs.svgReject': 'SVG é vetorial: use o SVG Studio para otimizá-lo.',
      'rs.copiedFmt': 'Redimensionado para {w}×{h}', 'rs.privacy': 'O redimensionamento roda em um canvas local. Sua imagem nunca sai do dispositivo.'
    }
  });

  const def = {
    id: 'image-resize', cat: 'media', icon: 'resize', version: '1.1.0',
    name: { en: 'Image Resizer', pt: 'Redimensionador de Imagens' },
    tagline: {
      en: 'Resize images locally by percent, exact pixels or a fit box, with aspect lock, resampling quality and a live preview.',
      pt: 'Redimensione imagens localmente por percentual, pixels exatos ou caixa, com trava de proporção, qualidade de reamostragem e prévia ao vivo.'
    },
    tags: ['image', 'resize', 'scale', 'dimensions', 'aspect', 'resample', 'pixels'],
    deps: [],
    docs: {
      en: {
        summary: 'Resize a raster image entirely in your browser: choose percent, exact pixel dimensions (with aspect-ratio lock) or a fit-within box, pick resampling quality and output format, watch the live preview and real output bytes, then download.',
        usage: [
          'Drop an image (or click the dropzone), or generate a local sample.',
          'Pick a sizing mode: percent (1–400%), exact pixels, or fit within a max box.',
          'In pixels mode, lock the aspect ratio so editing one side derives the other.',
          'Choose resampling quality and output format/quality; read the live preview and metrics.',
          'Download the resized file; replace or remove the image at any time.'
        ],
        privacy: 'Resizing and re-encoding happen on a local canvas. The image is never uploaded, never persisted; only settings survive reload.',
        limits: [
          'Dimensions are clamped to 1–8000 px per side (canvas safety limit).',
          'Upscaling beyond 100% interpolates pixels; it cannot recover detail that is not there.',
          'Low resampling uses nearest-neighbour (pixelated); high uses smooth interpolation.',
          'GIF/BMP are decoded but animation is not preserved: only the first frame is resized.',
          'SVG is rejected by design (vector): use SVG Studio instead.',
          'Resize + encode run in a background thread (Web Worker) when the browser supports it; otherwise the identical main-thread path is used automatically.'
        ]
      },
      pt: {
        summary: 'Redimensione uma imagem raster inteiramente no navegador: escolha percentual, dimensões exatas em pixels (com trava de proporção) ou uma caixa máxima, defina a qualidade de reamostragem e o formato de saída, veja a prévia ao vivo e os bytes reais, e baixe.',
        usage: [
          'Solte uma imagem (ou clique na dropzone), ou gere um exemplo local.',
          'Escolha o modo: percentual (1–400%), pixels exatos ou caber numa caixa máxima.',
          'No modo pixels, trave a proporção para que editar um lado derive o outro.',
          'Escolha a reamostragem e o formato/qualidade de saída; leia a prévia e as métricas ao vivo.',
          'Baixe o arquivo redimensionado; troque ou remova a imagem quando quiser.'
        ],
        privacy: 'Redimensionamento e recodificação rodam em canvas local. A imagem nunca é enviada nem persistida; só as configurações sobrevivem ao reload.',
        limits: [
          'Dimensões limitadas a 1–8000 px por lado (limite de segurança do canvas).',
          'Ampliar além de 100% interpola pixels; não recupera detalhe inexistente.',
          'Reamostragem baixa usa vizinho mais próximo (pixelada); alta usa interpolação suave.',
          'GIF/BMP são decodificados, mas a animação não é preservada: só o primeiro quadro é redimensionado.',
          'SVG é rejeitado por design (vetorial): use o SVG Studio.',
          'Redimensionar + codificar rodam em thread de fundo (Web Worker) quando o navegador suporta; caso contrário, o caminho idêntico na thread principal é usado automaticamente.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'image-resize';
  const MODES = ['percent', 'pixels', 'fit'];
  const FORMATS = ['auto', 'png', 'jpeg', 'webp'];
  const SMOOTH = ['high', 'medium', 'low'];
  const MAXDIM = 8000;
  let alive = false;
  let state = { mode: 'percent', percent: 50, w: 800, h: 600, lock: true, fitW: 1024, fitH: 768, smooth: 'high', format: 'auto', quality: 90 };
  let srcBmp = null, srcDim = null, srcMeta = null;
  let outBlob = null, outUrl = null;
  let token = 0, busy = false;
  let refs = {};

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (MODES.includes(s.mode)) state.mode = s.mode;
    const p = Number(s.percent); if (Number.isInteger(p) && p >= 1 && p <= 400) state.percent = p;
    const w = Number(s.w); if (Number.isInteger(w) && w >= 1 && w <= MAXDIM) state.w = w;
    const h = Number(s.h); if (Number.isInteger(h) && h >= 1 && h <= MAXDIM) state.h = h;
    if (typeof s.lock === 'boolean') state.lock = s.lock;
    const fw = Number(s.fitW); if (Number.isInteger(fw) && fw >= 1 && fw <= MAXDIM) state.fitW = fw;
    const fh = Number(s.fitH); if (Number.isInteger(fh) && fh >= 1 && fh <= MAXDIM) state.fitH = fh;
    if (SMOOTH.includes(s.smooth)) state.smooth = s.smooth;
    if (FORMATS.includes(s.format)) state.format = s.format;
    const q = Number(s.quality); if (Number.isInteger(q) && q >= 10 && q <= 100) state.quality = q;
  }

  const outType = () => state.format === 'auto'
    ? (['image/png', 'image/jpeg', 'image/webp'].includes(srcMeta.type) ? srcMeta.type : 'image/jpeg')
    : 'image/' + state.format;
  const extOf = (mime) => ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[mime] || 'png');

  function target() {
    const sw = srcDim.w, sh = srcDim.h;
    let w, h;
    if (state.mode === 'percent') { w = sw * state.percent / 100; h = sh * state.percent / 100; }
    else if (state.mode === 'pixels') { w = state.w; h = state.h; }
    else { const r = Math.min(state.fitW / sw, state.fitH / sh); w = sw * r; h = sh * r; }
    return { w: clamp(Math.round(w), 1, MAXDIM), h: clamp(Math.round(h), 1, MAXDIM) };
  }

  function render() {
    if (!alive) return;
    const has = !!srcBmp;
    refs.empty.hidden = has;
    refs.work.hidden = !has;
    refs.meta.textContent = has ? `${srcMeta.name} · ${srcMeta.type || '?'} · ${U.formatBytes(srcMeta.size)}` : '';
    refs.percentVal.textContent = state.percent + '%';
    refs.qualityVal.textContent = state.quality + '%';
    refs.quality.disabled = has && outType() === 'image/png';
    refs.pngHint.hidden = !(has && outType() === 'image/png');
    refs.percentField.hidden = state.mode !== 'percent';
    refs.pixelsField.hidden = state.mode !== 'pixels';
    refs.fitField.hidden = state.mode !== 'fit';
    refs.lockField.hidden = state.mode !== 'pixels';
    if (!has) return;
    const tg = target();
    refs.mSrc.textContent = `${srcDim.w}×${srcDim.h}`;
    refs.upscale.hidden = !(tg.w > srcDim.w || tg.h > srcDim.h);
    if (busy) {
      refs.mOut.textContent = '…'; refs.mScale.textContent = '…'; refs.mBytes.textContent = '…';
      refs.dl.disabled = true;
      return;
    }
    refs.mOut.textContent = `${tg.w}×${tg.h}`;
    refs.mScale.textContent = Math.round((tg.w / srcDim.w) * 100) + '%';
    if (outBlob) {
      refs.mBytes.textContent = U.formatBytes(outBlob.size);
      refs.preview.src = outUrl;
      refs.dl.disabled = false;
    } else { refs.mBytes.textContent = '…'; refs.dl.disabled = true; }
  }

  function resizeSync(tg, type, my) {
    const cv = document.createElement('canvas');
    cv.width = tg.w; cv.height = tg.h;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = state.smooth !== 'low';
    ctx.imageSmoothingQuality = state.smooth === 'low' ? 'low' : state.smooth;
    if (type === 'image/jpeg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, tg.w, tg.h); }
    ctx.drawImage(srcBmp, 0, 0, tg.w, tg.h);
    cv.toBlob((blob) => {
      if (my !== token || !alive) return;
      busy = false;
      if (!blob) { toast(t('rs.badEncode'), 'error'); render(); return; }
      if (outUrl) URL.revokeObjectURL(outUrl);
      outBlob = blob; outUrl = URL.createObjectURL(blob);
      VT.modules['image-resize'].__lastOut = () => outBlob;
      render();
    }, type, state.quality / 100);
  }

  function resize() {
    if (!srcBmp) return;
    const my = ++token;
    busy = true; render();
    const tg = target();
    const type = outType();
    const opts = { w: tg.w, h: tg.h, smooth: state.smooth, type, quality: state.quality / 100, bg: type === 'image/jpeg' ? '#FFFFFF' : null };
    // copy (not transfer): the main thread keeps the bitmap for later resizes and for the fallback path
    VT.workers.process(srcBmp, opts, null).then((blob) => {
      if (my !== token || !alive) return;
      busy = false;
      if (outUrl) URL.revokeObjectURL(outUrl);
      outBlob = blob; outUrl = URL.createObjectURL(blob);
      VT.modules['image-resize'].__lastOut = () => outBlob;
      render();
    }).catch(() => {
      if (my !== token || !alive) return;
      resizeSync(tg, type, my);
    });
  }
  const resizeSoon = U.debounce(resize, 120);

  function clearImage() {
    token++; busy = false;
    if (srcBmp) srcBmp.close();
    if (outUrl) URL.revokeObjectURL(outUrl);
    srcBmp = null; srcDim = null; srcMeta = null; outBlob = null; outUrl = null;
    render();
  }

  async function loadFile(file) {
    if (!file) return;
    if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) { toast(t('rs.svgReject'), 'error'); return; }
    if (!file.type.startsWith('image/')) { toast(t('rs.badType'), 'error'); return; }
    let bmp;
    try {
      try { bmp = await createImageBitmap(file, { frame: 0 }); }
      catch { bmp = await createImageBitmap(file); }
    } catch { toast(t('rs.badDecode'), 'error'); return; }
    if (!bmp.width || !bmp.height) { bmp.close(); toast(t('rs.badDecode'), 'error'); return; }
    if (srcBmp) srcBmp.close();
    if (outUrl) URL.revokeObjectURL(outUrl);
    srcBmp = bmp; srcDim = { w: bmp.width, h: bmp.height };
    outBlob = null; outUrl = null;
    srcMeta = { name: file.name, type: file.type, size: file.size };
    state.w = bmp.width; state.h = bmp.height;
    syncPixelInputs();
    render(); resize();
  }

  function sample() {
    const cv = document.createElement('canvas');
    cv.width = 1200; cv.height = 800;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 1200, 800);
    g.addColorStop(0, '#0D2438'); g.addColorStop(0.55, '#17607A'); g.addColorStop(1, '#5FE6FF');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1200, 800);
    ctx.strokeStyle = 'rgba(234,247,255,0.6)'; ctx.lineWidth = 2;
    for (let x = 0; x <= 1200; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 800); ctx.stroke(); }
    for (let y = 0; y <= 800; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke(); }
    ctx.fillStyle = 'rgba(234,247,255,0.85)';
    ctx.beginPath(); ctx.arc(600, 400, 140, 0, Math.PI * 2); ctx.fill();
    cv.toBlob((blob) => {
      if (!blob || !alive) return;
      loadFile(new File([blob], 'exemplo-vistanology.png', { type: 'image/png' }));
    }, 'image/png');
  }

  function syncPixelInputs() {
    if (refs.w) refs.w.value = state.w;
    if (refs.h) refs.h.value = state.h;
  }

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="rs-layout">
        <div class="rs-left">
          <section class="rs-stage glass-2">
            <div class="empty" id="rs-empty">
              <span class="orb orb-lg">${I.resize}</span>
              <strong>${t('rs.empty')}</strong>
              <span>${t('rs.emptySub')}</span>
              <button class="btn btn-sm" id="rs-sample">${I.sparkle} ${t('rs.sample')}</button>
            </div>
            <div id="rs-work" hidden>
              <div class="rs-preview-wrap">
                <img id="rs-preview" alt="${t('rs.preview')}">
              </div>
              <dl class="rs-metrics">
                <div><dt>${t('rs.m.src')}</dt><dd id="rs-m-src"></dd></div>
                <div><dt>${t('rs.m.out')}</dt><dd id="rs-m-out"></dd></div>
                <div><dt>${t('rs.m.scale')}</dt><dd id="rs-m-scale"></dd></div>
                <div><dt>${t('rs.m.bytes')}</dt><dd id="rs-m-bytes"></dd></div>
              </dl>
              <p class="hint" id="rs-upscale" hidden>${t('rs.upscale')}</p>
              <div class="export-row">
                <button class="btn btn-primary" id="rs-dl">${I.download} ${t('rs.download')}</button>
                <button class="btn" id="rs-replace">${I.upload} ${t('rs.replace')}</button>
              </div>
            </div>
            <p class="privacy-line">${I.shield} ${t('rs.privacy')}</p>
          </section>
        </div>
        <div class="rs-controls">
          <section class="step glass">
            <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('rs.source')}</h3></div>
            <div class="dropzone" id="rs-drop" tabindex="0" role="button" aria-label="${t('rs.drop')}">
              <span class="orb orb-sm">${I.upload}</span>
              <strong>${t('rs.drop')}</strong><span>${t('rs.dropHint')}</span>
            </div>
            <input type="file" id="rs-file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" hidden>
            <div class="rs-srcmeta"><span class="hint" id="rs-meta"></span>
              <button class="btn btn-ghost btn-sm" id="rs-clear">${I.x} ${t('rs.clear')}</button></div>
          </section>
          <section class="step glass" id="rs-size-field">
            <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('rs.size')}</h3></div>
            <div class="tabs rs-mode" role="tablist" aria-label="${t('rs.size')}">
              <button class="tab" role="tab" data-tab="percent" aria-selected="${state.mode === 'percent'}">${t('rs.mode.percent')}</button>
              <button class="tab" role="tab" data-tab="pixels" aria-selected="${state.mode === 'pixels'}">${t('rs.mode.pixels')}</button>
              <button class="tab" role="tab" data-tab="fit" aria-selected="${state.mode === 'fit'}">${t('rs.mode.fit')}</button>
            </div>
            <div class="field" id="rs-percent-field"><label for="rs-percent">${t('rs.percent')} · <span id="rs-percent-val"></span></label>
              <input type="range" id="rs-percent" min="1" max="400" step="1"></div>
            <div class="rs-pixels" id="rs-pixels-field" hidden>
              <div class="field"><label for="rs-w">${t('rs.width')}</label><input type="number" class="input" id="rs-w" min="1" max="8000" step="1"></div>
              <div class="field"><label for="rs-h">${t('rs.height')}</label><input type="number" class="input" id="rs-h" min="1" max="8000" step="1"></div>
            </div>
            <label class="rs-lock" id="rs-lock-field" hidden><input type="checkbox" id="rs-lock"> ${t('rs.lock')}</label>
            <div class="rs-pixels" id="rs-fit-field" hidden>
              <div class="field"><label for="rs-fitw">${t('rs.fitW')}</label><input type="number" class="input" id="rs-fitw" min="1" max="8000" step="1"></div>
              <div class="field"><label for="rs-fith">${t('rs.fitH')}</label><input type="number" class="input" id="rs-fith" min="1" max="8000" step="1"></div>
            </div>
            <div class="field"><label for="rs-smooth">${t('rs.smooth')}</label>
              <select class="input" id="rs-smooth">
                <option value="high">${t('rs.smooth.high')}</option><option value="medium">${t('rs.smooth.medium')}</option><option value="low">${t('rs.smooth.low')}</option>
              </select></div>
          </section>
          <section class="step glass">
            <div class="step-head"><span class="step-num">03</span><h3 class="step-title">${t('rs.output')}</h3></div>
            <div class="field"><label for="rs-format">${t('rs.format')}</label>
              <select class="input" id="rs-format">
                <option value="auto">${t('rs.fmt.auto')}</option><option value="png">PNG</option>
                <option value="jpeg">JPEG</option><option value="webp">WebP</option>
              </select></div>
            <div class="field"><label for="rs-quality">${t('rs.quality')} · <span id="rs-quality-val"></span></label>
              <input type="range" id="rs-quality" min="10" max="100" step="1"></div>
            <p class="hint" id="rs-pnghint" hidden>${t('rs.pngHint')}</p>
          </section>
        </div>
      </div>`;

    refs = {
      empty: $('#rs-empty', root), work: $('#rs-work', root), meta: $('#rs-meta', root),
      percentVal: $('#rs-percent-val', root), qualityVal: $('#rs-quality-val', root),
      quality: $('#rs-quality', root), pngHint: $('#rs-pnghint', root),
      percentField: $('#rs-percent-field', root), pixelsField: $('#rs-pixels-field', root),
      fitField: $('#rs-fit-field', root), lockField: $('#rs-lock-field', root),
      preview: $('#rs-preview', root), upscale: $('#rs-upscale', root),
      mSrc: $('#rs-m-src', root), mOut: $('#rs-m-out', root), mScale: $('#rs-m-scale', root), mBytes: $('#rs-m-bytes', root),
      dl: $('#rs-dl', root), drop: $('#rs-drop', root), file: $('#rs-file', root),
      w: $('#rs-w', root), h: $('#rs-h', root)
    };

    VT.ui.tabs($('#rs-size-field', root), (id) => { state.mode = id; persist(); render(); resizeSoon(); });
    const pc = $('#rs-percent', root); pc.value = state.percent;
    pc.addEventListener('input', () => { state.percent = clamp(Number(pc.value), 1, 400); persist(); render(); resizeSoon(); });
    const lock = $('#rs-lock', root); lock.checked = state.lock;
    lock.addEventListener('change', () => { state.lock = lock.checked; persist(); });
    const onDim = (which) => () => {
      const el = which === 'w' ? refs.w : refs.h;
      const v = clamp(Math.round(Number(el.value) || 1), 1, MAXDIM);
      if (which === 'w') { state.w = v; if (state.lock && srcDim) state.h = clamp(Math.round(v * srcDim.h / srcDim.w), 1, MAXDIM); }
      else { state.h = v; if (state.lock && srcDim) state.w = clamp(Math.round(v * srcDim.w / srcDim.h), 1, MAXDIM); }
      syncPixelInputs(); persist(); render(); resizeSoon();
    };
    refs.w.addEventListener('input', onDim('w'));
    refs.h.addEventListener('input', onDim('h'));
    const fw = $('#rs-fitw', root); fw.value = state.fitW;
    fw.addEventListener('input', () => { state.fitW = clamp(Math.round(Number(fw.value) || 1), 1, MAXDIM); persist(); render(); resizeSoon(); });
    const fh = $('#rs-fith', root); fh.value = state.fitH;
    fh.addEventListener('input', () => { state.fitH = clamp(Math.round(Number(fh.value) || 1), 1, MAXDIM); persist(); render(); resizeSoon(); });
    const sm = $('#rs-smooth', root); sm.value = state.smooth;
    sm.addEventListener('change', () => { state.smooth = sm.value; persist(); resizeSoon(); });
    const fmt = $('#rs-format', root); fmt.value = state.format;
    fmt.addEventListener('change', () => { state.format = fmt.value; persist(); render(); resize(); });
    const q = refs.quality; q.value = state.quality;
    q.addEventListener('input', () => { state.quality = clamp(Number(q.value), 10, 100); persist(); render(); resizeSoon(); });

    refs.drop.addEventListener('click', () => refs.file.click());
    refs.drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); refs.file.click(); } });
    ['dragover', 'dragenter'].forEach((ev) => refs.drop.addEventListener(ev, (e) => { e.preventDefault(); refs.drop.classList.add('dragover'); }));
    ['dragleave', 'dragend'].forEach((ev) => refs.drop.addEventListener(ev, () => refs.drop.classList.remove('dragover')));
    refs.drop.addEventListener('drop', (e) => { e.preventDefault(); refs.drop.classList.remove('dragover'); loadFile(e.dataTransfer.files[0]); });
    refs.file.addEventListener('change', () => { loadFile(refs.file.files[0]); refs.file.value = ''; });
    $('#rs-sample', root).addEventListener('click', sample);
    $('#rs-replace', root).addEventListener('click', () => refs.file.click());
    $('#rs-clear', root).addEventListener('click', clearImage);
    refs.dl.addEventListener('click', () => {
      if (!outBlob) return;
      const tg = target();
      const base = srcMeta.name.replace(/\.[^.]+$/, '') || 'imagem';
      U.downloadBlob(outBlob, `${base}-${tg.w}x${tg.h}.${extOf(outBlob.type)}`);
      toast(t('rs.copiedFmt', { w: tg.w, h: tg.h }), 'success');
    });

    syncPixelInputs();
    render();
    return () => { alive = false; };
  }

  function unmount() {
    alive = false;
    token++;
    if (srcBmp) srcBmp.close();
    if (outUrl) URL.revokeObjectURL(outUrl);
    srcBmp = null; srcDim = null; srcMeta = null; outBlob = null; outUrl = null;
  }

  VT.registry.add(def);
  return def;
})();