window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['image-compress'] = (() => {
  const U = VT.utils;
  const { $, esc, clamp } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'ic.source': 'Image', 'ic.drop': 'Drop an image or click to browse', 'ic.dropHint': 'PNG, JPEG, WebP, GIF or BMP — processed locally',
      'ic.sample': 'Use a sample image', 'ic.replace': 'Replace image', 'ic.clear': 'Remove',
      'ic.settings': 'Compression', 'ic.quality': 'Quality', 'ic.format': 'Output format',
      'ic.fmt.auto': 'Keep source format', 'ic.fmt.jpeg': 'JPEG', 'ic.fmt.webp': 'WebP', 'ic.fmt.png': 'PNG (lossless)',
      'ic.pngHint': 'PNG is lossless: the quality slider does not apply. Use JPEG or WebP to shrink photos.',
      'ic.compare': 'Before / after', 'ic.mode.slider': 'Slider', 'ic.mode.side': 'Side by side',
      'ic.before': 'Before', 'ic.after': 'After', 'ic.handle': 'Comparison position',
      'ic.m.src': 'Original', 'ic.m.out': 'Compressed', 'ic.m.save': 'Saved', 'ic.m.dims': 'Dimensions',
      'ic.download': 'Download compressed', 'ic.empty': 'No image yet', 'ic.emptySub': 'Drop a file above or generate a sample to see the before/after comparison.',
      'ic.badType': 'Unsupported file: choose a raster image (PNG, JPEG, WebP, GIF, BMP).',
      'ic.badDecode': 'Could not decode this image.', 'ic.badEncode': 'This browser could not encode the chosen format.',
      'ic.copiedFmt': 'Compressed as {fmt}', 'ic.privacy': 'Compression runs on a local canvas. Your image never leaves the device.',
      'ic.svgReject': 'SVG is vector: use SVG Studio to optimize it instead.'
    },
    pt: {
      'ic.source': 'Imagem', 'ic.drop': 'Solte uma imagem ou clique para escolher', 'ic.dropHint': 'PNG, JPEG, WebP, GIF ou BMP — processado localmente',
      'ic.sample': 'Usar imagem de exemplo', 'ic.replace': 'Trocar imagem', 'ic.clear': 'Remover',
      'ic.settings': 'Compressão', 'ic.quality': 'Qualidade', 'ic.format': 'Formato de saída',
      'ic.fmt.auto': 'Manter formato de origem', 'ic.fmt.jpeg': 'JPEG', 'ic.fmt.webp': 'WebP', 'ic.fmt.png': 'PNG (sem perdas)',
      'ic.pngHint': 'PNG é sem perdas: o slider de qualidade não se aplica. Use JPEG ou WebP para reduzir fotos.',
      'ic.compare': 'Antes / depois', 'ic.mode.slider': 'Slider', 'ic.mode.side': 'Lado a lado',
      'ic.before': 'Antes', 'ic.after': 'Depois', 'ic.handle': 'Posição da comparação',
      'ic.m.src': 'Original', 'ic.m.out': 'Comprimido', 'ic.m.save': 'Economia', 'ic.m.dims': 'Dimensões',
      'ic.download': 'Baixar comprimida', 'ic.empty': 'Nenhuma imagem ainda', 'ic.emptySub': 'Solte um arquivo acima ou gere um exemplo para ver a comparação antes/depois.',
      'ic.badType': 'Arquivo não suportado: escolha uma imagem raster (PNG, JPEG, WebP, GIF, BMP).',
      'ic.badDecode': 'Não foi possível decodificar esta imagem.', 'ic.badEncode': 'Este navegador não conseguiu codificar o formato escolhido.',
      'ic.copiedFmt': 'Comprimido como {fmt}', 'ic.privacy': 'A compressão roda em um canvas local. Sua imagem nunca sai do dispositivo.',
      'ic.svgReject': 'SVG é vetorial: use o SVG Studio para otimizá-lo.'
    }
  });

  const def = {
    id: 'image-compress', cat: 'media', icon: 'compress', version: '1.0.0',
    name: { en: 'Image Compressor', pt: 'Compressor de Imagens' },
    tagline: {
      en: 'Shrink PNG, JPEG and WebP locally with a live before/after slider, honest size savings and one-click export.',
      pt: 'Reduza PNG, JPEG e WebP localmente com slider antes/depois ao vivo, economia de tamanho honesta e exportação em um clique.'
    },
    tags: ['image', 'compress', 'optimize', 'jpeg', 'webp', 'png', 'quality', 'before-after'],
    deps: [],
    docs: {
      en: {
        summary: 'Compress raster images entirely in your browser: pick quality and output format, compare before/after with an accessible slider or side-by-side panes, read the real byte savings and download the result.',
        usage: [
          'Drop an image (or click the dropzone), or generate a local sample.',
          'Set quality (10–100) and output format: keep source, JPEG, WebP or PNG.',
          'Compare before/after with the slider (drag or arrow keys) or side-by-side.',
          'Read original vs compressed bytes and the savings percentage.',
          'Download the compressed file; replace or remove the image at any time.'
        ],
        privacy: 'Decoding and re-encoding happen on a local canvas. The image is never uploaded, never persisted; only settings survive reload.',
        limits: [
          'PNG output is lossless — the quality slider only affects JPEG/WebP.',
          'Savings can be negative (re-encoding an already-optimal file may grow it); the metric shows the truth.',
          'GIF/BMP are decoded but animation is not preserved: only the first frame is re-encoded.',
          'SVG is rejected by design (vector): use SVG Studio instead.'
        ]
      },
      pt: {
        summary: 'Comprima imagens raster inteiramente no navegador: escolha qualidade e formato de saída, compare antes/depois com slider acessível ou painéis lado a lado, leia a economia real de bytes e baixe o resultado.',
        usage: [
          'Solte uma imagem (ou clique na dropzone), ou gere um exemplo local.',
          'Defina qualidade (10–100) e formato: manter origem, JPEG, WebP ou PNG.',
          'Compare antes/depois com o slider (arraste ou setas) ou lado a lado.',
          'Leia bytes originais vs comprimidos e o percentual de economia.',
          'Baixe o arquivo comprimido; troque ou remova a imagem quando quiser.'
        ],
        privacy: 'Decodificação e recodificação acontecem em um canvas local. A imagem nunca é enviada nem persistida; só as configurações sobrevivem ao reload.',
        limits: [
          'PNG é sem perdas — o slider de qualidade só afeta JPEG/WebP.',
          'A economia pode ser negativa (recodificar um arquivo já ótimo pode aumentá-lo); a métrica mostra a verdade.',
          'GIF/BMP são decodificados, mas a animação não é preservada: apenas o primeiro quadro é recodificado.',
          'SVG é rejeitado por design (vetorial): use o SVG Studio.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'image-compress';
  const FORMATS = ['auto', 'jpeg', 'webp', 'png'];
  let alive = false;
  let state = { quality: 80, format: 'auto', mode: 'slider' };
  let srcImg = null, srcMeta = null, srcUrl = null;
  let outBlob = null, outUrl = null;
  let pct = 50, token = 0, busy = false;

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    const q = Number(s.quality); if (Number.isInteger(q) && q >= 10 && q <= 100) state.quality = q;
    if (FORMATS.includes(s.format)) state.format = s.format;
    if (['slider', 'side'].includes(s.mode)) state.mode = s.mode;
  }

  const outType = () => state.format === 'auto'
    ? (['image/png', 'image/jpeg', 'image/webp'].includes(srcMeta.type) ? srcMeta.type : 'image/jpeg')
    : 'image/' + state.format;
  const extOf = (mime) => ({ 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[mime] || 'png');

  let refs = {};
  function render() {
    if (!alive) return;
    const has = !!srcImg;
    refs.empty.hidden = has;
    refs.work.hidden = !has;
    refs.meta.textContent = has ? `${srcMeta.name} · ${srcMeta.type || '?'} · ${U.formatBytes(srcMeta.size)}` : '';
    refs.qualityVal.textContent = state.quality + '%';
    refs.pngHint.hidden = !(has && outType() === 'image/png');
    refs.compare.dataset.mode = state.mode;
    refs.compare.style.setProperty('--pct', pct + '%');
    refs.handle.setAttribute('aria-valuenow', String(Math.round(pct)));
    if (!has) return;
    refs.before.src = srcUrl;
    refs.after.src = outUrl || srcUrl;
    refs.mSrc.textContent = U.formatBytes(srcMeta.size);
    if (busy) {
      refs.mOut.textContent = '…'; refs.mSave.textContent = '…'; refs.dl.disabled = true;
      refs.mDims.textContent = `${srcImg.naturalWidth}×${srcImg.naturalHeight}`;
      return;
    }
    refs.mOut.textContent = outBlob ? U.formatBytes(outBlob.size) : '…';
    if (outBlob) {
      const save = (1 - outBlob.size / srcMeta.size) * 100;
      refs.mSave.textContent = (save >= 0 ? '−' : '+') + Math.abs(save).toFixed(1) + '%';
      refs.mSave.dataset.dir = save >= 0 ? 'down' : 'up';
      refs.mDims.textContent = `${srcImg.naturalWidth}×${srcImg.naturalHeight} · ${extOf(outBlob.type).toUpperCase()}`;
      refs.dl.disabled = false;
    } else {
      refs.mSave.textContent = '…'; refs.mDims.textContent = `${srcImg.naturalWidth}×${srcImg.naturalHeight}`;
      refs.dl.disabled = true;
    }
  }

  function compress() {
    if (!srcImg) return;
    const my = ++token;
    busy = true; render();
    const type = outType();
    const cv = document.createElement('canvas');
    cv.width = srcImg.naturalWidth; cv.height = srcImg.naturalHeight;
    const ctx = cv.getContext('2d');
    if (type === 'image/jpeg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, cv.width, cv.height); }
    ctx.drawImage(srcImg, 0, 0);
    cv.toBlob((blob) => {
      if (my !== token || !alive) return;
      busy = false;
      if (!blob) { toast(t('ic.badEncode'), 'error'); render(); return; }
      if (outUrl) URL.revokeObjectURL(outUrl);
      outBlob = blob; outUrl = URL.createObjectURL(blob);
      render();
    }, type, state.quality / 100);
  }
  const compressSoon = U.debounce(compress, 120);

  function clearImage() {
    token++; busy = false;
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    if (outUrl) URL.revokeObjectURL(outUrl);
    srcImg = null; srcMeta = null; srcUrl = null; outBlob = null; outUrl = null;
    render();
  }

  async function loadFile(file) {
    if (!file) return;
    if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) { toast(t('ic.svgReject'), 'error'); return; }
    if (!file.type.startsWith('image/')) { toast(t('ic.badType'), 'error'); return; }
    const url = URL.createObjectURL(file);
    let img;
    try { img = await U.loadImage(url); }
    catch { URL.revokeObjectURL(url); toast(t('ic.badDecode'), 'error'); return; }
    if (!img.naturalWidth || !img.naturalHeight) { URL.revokeObjectURL(url); toast(t('ic.badDecode'), 'error'); return; }
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    if (outUrl) URL.revokeObjectURL(outUrl);
    outBlob = null; outUrl = null;
    srcImg = img; srcUrl = url;
    srcMeta = { name: file.name, type: file.type, size: file.size };
    render(); compress();
  }

  function sample() {
    const cv = document.createElement('canvas');
    cv.width = 1200; cv.height = 800;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 1200, 800);
    g.addColorStop(0, '#0D2438'); g.addColorStop(0.55, '#17607A'); g.addColorStop(1, '#5FE6FF');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1200, 800);
    let seed = 42;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 26000; i++) {
      ctx.fillStyle = `rgba(${Math.floor(rnd() * 255)},${Math.floor(rnd() * 255)},${Math.floor(rnd() * 255)},0.16)`;
      ctx.fillRect(Math.floor(rnd() * 1200), Math.floor(rnd() * 800), 2, 2);
    }
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(rnd() * 1200, rnd() * 800, 30 + rnd() * 120, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(234,247,255,${0.05 + rnd() * 0.12})`;
      ctx.fill();
    }
    cv.toBlob((blob) => {
      if (!blob || !alive) return;
      loadFile(new File([blob], 'exemplo-vistanology.png', { type: 'image/png' }));
    }, 'image/png');
  }

  function setPct(v) {
    pct = clamp(v, 0, 100);
    refs.compare.style.setProperty('--pct', pct + '%');
    refs.handle.setAttribute('aria-valuenow', String(Math.round(pct)));
  }

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="ic-layout">
        <div class="ic-left">
          <section class="ic-stage glass-2">
            <div class="empty" id="ic-empty">
              <span class="orb orb-lg">${I.image}</span>
              <strong>${t('ic.empty')}</strong>
              <span>${t('ic.emptySub')}</span>
              <button class="btn btn-sm" id="ic-sample">${I.sparkle} ${t('ic.sample')}</button>
            </div>
            <div id="ic-work" hidden>
              <div class="ic-compare" id="ic-compare" data-mode="${state.mode}">
                <div class="ic-pane ic-pane-before"><img id="ic-before" alt="${t('ic.before')}"><span class="ic-tag">${t('ic.before')}</span></div>
                <div class="ic-pane ic-pane-after"><img id="ic-after" alt="${t('ic.after')}"><span class="ic-tag">${t('ic.after')}</span></div>
                <div class="ic-handle" id="ic-handle" role="slider" tabindex="0" aria-label="${t('ic.handle')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><span class="ic-grip">${I.swap}</span></div>
              </div>
              <dl class="ic-metrics">
                <div><dt>${t('ic.m.src')}</dt><dd id="ic-m-src"></dd></div>
                <div><dt>${t('ic.m.out')}</dt><dd id="ic-m-out"></dd></div>
                <div><dt>${t('ic.m.save')}</dt><dd id="ic-m-save"></dd></div>
                <div><dt>${t('ic.m.dims')}</dt><dd id="ic-m-dims"></dd></div>
              </dl>
              <div class="export-row">
                <button class="btn btn-primary" id="ic-dl">${I.download} ${t('ic.download')}</button>
                <button class="btn" id="ic-replace">${I.upload} ${t('ic.replace')}</button>
              </div>
            </div>
            <p class="privacy-line">${I.shield} ${t('ic.privacy')}</p>
          </section>
        </div>
        <div class="ic-controls">
          <section class="step glass">
            <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('ic.source')}</h3></div>
            <div class="dropzone" id="ic-drop" tabindex="0" role="button" aria-label="${t('ic.drop')}">
              <span class="orb orb-sm">${I.upload}</span>
              <strong>${t('ic.drop')}</strong><span>${t('ic.dropHint')}</span>
            </div>
            <input type="file" id="ic-file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" hidden>
            <div class="ic-srcmeta"><span class="hint" id="ic-meta"></span>
              <button class="btn btn-ghost btn-sm" id="ic-clear">${I.x} ${t('ic.clear')}</button></div>
          </section>
          <section class="step glass">
            <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('ic.settings')}</h3></div>
            <div class="field"><label for="ic-quality">${t('ic.quality')} · <span id="ic-quality-val"></span></label>
              <input type="range" id="ic-quality" min="10" max="100" step="1"></div>
            <div class="field"><label for="ic-format">${t('ic.format')}</label>
              <select class="input" id="ic-format">
                <option value="auto">${t('ic.fmt.auto')}</option><option value="jpeg">${t('ic.fmt.jpeg')}</option>
                <option value="webp">${t('ic.fmt.webp')}</option><option value="png">${t('ic.fmt.png')}</option>
              </select></div>
            <p class="hint" id="ic-pnghint" hidden>${t('ic.pngHint')}</p>
          </section>
          <section class="step glass" id="ic-mode-field">
            <div class="step-head"><span class="step-num">03</span><h3 class="step-title">${t('ic.compare')}</h3></div>
            <div class="tabs ic-mode" role="tablist" aria-label="${t('ic.compare')}">
              <button class="tab" role="tab" data-tab="slider" aria-selected="${state.mode === 'slider'}">${t('ic.mode.slider')}</button>
              <button class="tab" role="tab" data-tab="side" aria-selected="${state.mode === 'side'}">${t('ic.mode.side')}</button>
            </div>
          </section>
        </div>
      </div>`;

    refs = {
      empty: $('#ic-empty', root), work: $('#ic-work', root), meta: $('#ic-meta', root),
      qualityVal: $('#ic-quality-val', root), pngHint: $('#ic-pnghint', root),
      compare: $('#ic-compare', root), before: $('#ic-before', root), after: $('#ic-after', root), handle: $('#ic-handle', root),
      mSrc: $('#ic-m-src', root), mOut: $('#ic-m-out', root), mSave: $('#ic-m-save', root), mDims: $('#ic-m-dims', root),
      dl: $('#ic-dl', root), drop: $('#ic-drop', root), file: $('#ic-file', root)
    };

    VT.ui.tabs($('#ic-mode-field', root), (id) => { state.mode = id; persist(); render(); });
    const q = $('#ic-quality', root); q.value = state.quality;
    q.addEventListener('input', () => { state.quality = clamp(Number(q.value), 10, 100); persist(); render(); compressSoon(); });
    const fmt = $('#ic-format', root); fmt.value = state.format;
    fmt.addEventListener('change', () => { state.format = fmt.value; persist(); render(); compress(); });
    refs.drop.addEventListener('click', () => refs.file.click());
    refs.drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); refs.file.click(); } });
    ['dragover', 'dragenter'].forEach((ev) => refs.drop.addEventListener(ev, (e) => { e.preventDefault(); refs.drop.classList.add('dragover'); }));
    ['dragleave', 'dragend'].forEach((ev) => refs.drop.addEventListener(ev, () => refs.drop.classList.remove('dragover')));
    refs.drop.addEventListener('drop', (e) => { e.preventDefault(); refs.drop.classList.remove('dragover'); loadFile(e.dataTransfer.files[0]); });
    refs.file.addEventListener('change', () => { loadFile(refs.file.files[0]); refs.file.value = ''; });
    $('#ic-sample', root).addEventListener('click', sample);
    $('#ic-replace', root).addEventListener('click', () => refs.file.click());
    $('#ic-clear', root).addEventListener('click', clearImage);
    refs.dl.addEventListener('click', () => {
      if (!outBlob) return;
      const base = srcMeta.name.replace(/\.[^.]+$/, '') || 'imagem';
      U.downloadBlob(outBlob, `${base}-comprimido.${extOf(outBlob.type)}`);
      toast(t('ic.copiedFmt', { fmt: extOf(outBlob.type).toUpperCase() }), 'success');
    });

    const drag = (e) => {
      const r = refs.compare.getBoundingClientRect();
      setPct(((e.clientX - r.left) / r.width) * 100);
    };
    refs.compare.addEventListener('pointerdown', (e) => {
      if (state.mode !== 'slider') return;
      refs.compare.setPointerCapture(e.pointerId);
      drag(e);
      const move = (ev) => drag(ev);
      const up = () => { refs.compare.removeEventListener('pointermove', move); refs.compare.removeEventListener('pointerup', up); refs.compare.removeEventListener('pointercancel', up); };
      refs.compare.addEventListener('pointermove', move);
      refs.compare.addEventListener('pointerup', up);
      refs.compare.addEventListener('pointercancel', up);
    });
    refs.handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 2;
      if (e.key === 'ArrowLeft') { e.preventDefault(); setPct(pct - step); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setPct(pct + step); }
      if (e.key === 'Home') { e.preventDefault(); setPct(0); }
      if (e.key === 'End') { e.preventDefault(); setPct(100); }
    });

    render();
    return () => { alive = false; };
  }
  function unmount() {
    alive = false;
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    if (outUrl) URL.revokeObjectURL(outUrl);
    srcImg = null; srcMeta = null; srcUrl = null; outBlob = null; outUrl = null;
  }

  VT.registry.add(def);
  return def;
})();