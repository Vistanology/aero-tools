window.VT = window.VT || {};

VT.i18n.add({
  en: {
    'cs.harmony': 'Harmony', 'cs.random': 'Random', 'cs.complementary': 'Complementary', 'cs.analogous': 'Analogous',
    'cs.triadic': 'Triadic', 'cs.split': 'Split complementary', 'cs.mono': 'Monochromatic',
    'cs.generate': 'Generate', 'cs.export': 'Export', 'cs.badge': '5 colors',
    'cs.palette.hint': 'Click a swatch to copy its HEX. Lock colors to keep them while regenerating the rest.',
    'cs.inspector': 'Inspector', 'cs.pick': 'Pick a color', 'cs.repr': 'Representations',
    'cs.copyhex': 'Copy HEX', 'cs.copyrgb': 'Copy RGB', 'cs.copyhsl': 'Copy HSL',
    'cs.contrast': 'WCAG Contrast', 'cs.fg': 'Foreground', 'cs.bg': 'Background', 'cs.swap': 'Swap colors',
    'cs.ratio.hint': 'Contrast ratio (WCAG 2.1 relative luminance)',
    'cs.aa.normal': 'AA normal', 'cs.aa.large': 'AA large', 'cs.aaa.normal': 'AAA normal', 'cs.aaa.large': 'AAA large',
    'cs.pass': 'Pass', 'cs.fail': 'Fail',
    'cs.large.sample': 'Large text — 18pt / 24px',
    'cs.normal.sample': 'Normal body text: the quick brown fox jumps over the lazy dog.',
    'cs.extract': 'Image extraction', 'cs.local': 'Local only',
    'cs.drop': 'Drop an image here or click to browse', 'cs.drop.sub': 'PNG, JPEG, WebP — processed entirely in your browser.',
    'cs.extract.empty': 'No image yet', 'cs.extract.empty.sub': 'Extracted colors will appear here.',
    'cs.use': 'Use as palette', 'cs.extracted': '{n} colors extracted locally',
    'cs.noopaque': 'No opaque pixels found in this image', 'cs.imgfail': 'Could not read that image',
    'cs.imgtype': 'Please choose an image file', 'cs.loaded': 'Palette loaded from image',
    'cs.invalid': 'Invalid HEX value', 'cs.copied': '{v} copied',
    'cs.export.title': 'Export palette', 'cs.export.format': 'Format',
    'cs.export.css': 'CSS variables', 'cs.export.hex': 'HEX list', 'cs.export.json': 'JSON',
    'cs.export.done': 'Palette downloaded', 'cs.export.copied': 'Export copied',
    'cs.lock': 'Lock', 'cs.unlock': 'Unlock'
  },
  pt: {
    'cs.harmony': 'Harmonia', 'cs.random': 'Aleatória', 'cs.complementary': 'Complementar', 'cs.analogous': 'Análoga',
    'cs.triadic': 'Triádica', 'cs.split': 'Complementar dividida', 'cs.mono': 'Monocromática',
    'cs.generate': 'Gerar', 'cs.export': 'Exportar', 'cs.badge': '5 cores',
    'cs.palette.hint': 'Clique em uma amostra para copiar o HEX. Trave cores para mantê-las ao regenerar as demais.',
    'cs.inspector': 'Inspector', 'cs.pick': 'Escolha uma cor', 'cs.repr': 'Representações',
    'cs.copyhex': 'Copiar HEX', 'cs.copyrgb': 'Copiar RGB', 'cs.copyhsl': 'Copiar HSL',
    'cs.contrast': 'Contraste WCAG', 'cs.fg': 'Frente', 'cs.bg': 'Fundo', 'cs.swap': 'Trocar cores',
    'cs.ratio.hint': 'Razão de contraste (luminância relativa WCAG 2.1)',
    'cs.aa.normal': 'AA normal', 'cs.aa.large': 'AA grande', 'cs.aaa.normal': 'AAA normal', 'cs.aaa.large': 'AAA grande',
    'cs.pass': 'Passa', 'cs.fail': 'Falha',
    'cs.large.sample': 'Texto grande — 18pt / 24px',
    'cs.normal.sample': 'Texto normal: a rápida raposa marrom salta sobre o cão preguiçoso.',
    'cs.extract': 'Extração de imagem', 'cs.local': 'Só local',
    'cs.drop': 'Solte uma imagem aqui ou clique para escolher', 'cs.drop.sub': 'PNG, JPEG, WebP — processado inteiramente no seu navegador.',
    'cs.extract.empty': 'Nenhuma imagem ainda', 'cs.extract.empty.sub': 'As cores extraídas aparecerão aqui.',
    'cs.use': 'Usar como paleta', 'cs.extracted': '{n} cores extraídas localmente',
    'cs.noopaque': 'Nenhum pixel opaco encontrado nesta imagem', 'cs.imgfail': 'Não foi possível ler essa imagem',
    'cs.imgtype': 'Escolha um arquivo de imagem', 'cs.loaded': 'Paleta carregada da imagem',
    'cs.invalid': 'Valor HEX inválido', 'cs.copied': '{v} copiado',
    'cs.export.title': 'Exportar paleta', 'cs.export.format': 'Formato',
    'cs.export.css': 'Variáveis CSS', 'cs.export.hex': 'Lista HEX', 'cs.export.json': 'JSON',
    'cs.export.done': 'Paleta baixada', 'cs.export.copied': 'Exportação copiada',
    'cs.lock': 'Travar', 'cs.unlock': 'Destravar'
  }
});

(() => {
  const U = VT.utils;
  const { $, $$, esc } = U;
  const t = (k, v) => VT.i18n.t(k, v);
  const I = VT.icons;
  const { toast, modal } = VT.ui;

  let palette = [];
  let scheme = 'random';
  let insp = '#38B6E8';
  let fg = '#0A1B2E', bg = '#D5F8F5';
  let alive = false;

  /* ---------- Palette engine ---------- */

  function schemeHues(base) {
    const H = base === null ? U.randInt(0, 359) : base;
    switch (scheme) {
      case 'complementary': return [H, H + 180, H, H + 180, H];
      case 'analogous': return [H - 30, H - 15, H, H + 15, H + 30];
      case 'triadic': return [H, H + 120, H + 240, H + 120, H + 240];
      case 'split': return [H, H + 150, H + 210, H + 150, H + 210];
      case 'mono': return [H, H, H, H, H];
      default: return [0, 1, 2, 3, 4].map(() => U.randInt(0, 359));
    }
  }

  function generate() {
    const locked = palette.find((p) => p.locked);
    const base = locked ? U.hexToHsl(locked.hex).h : null;
    const hues = schemeHues(base);
    palette = palette.map((p, i) => {
      if (p.locked) return p;
      const s = scheme === 'mono' ? U.randInt(35, 85) : U.randInt(55, 92);
      const l = scheme === 'mono' ? U.clamp(26 + i * 12 + U.randInt(-4, 4), 20, 80) : U.clamp(32 + i * 8 + U.randInt(-6, 6), 26, 74);
      return { hex: U.hslToHex(hues[i], s, l), locked: false };
    });
    renderPalette();
  }

  async function copyHex(hex) {
    (await U.copyText(hex)) ? toast(t('cs.copied', { v: hex }), 'success') : toast(t('common.copyfail'), 'error');
  }

  function renderPalette() {
    const row = $('#cs-palette');
    row.innerHTML = palette.map((p, i) => `
      <div class="swatch">
        <button class="sw-color" style="background:${p.hex}" data-i="${i}" data-tip="${t('cs.copyhex')} ${p.hex}" aria-label="${t('cs.copyhex')} ${p.hex}"></button>
        <div class="sw-meta">
          <span class="sw-hex">${p.hex}</span>
          <div class="sw-actions">
            <input type="color" class="input" value="${p.hex}" data-i="${i}" aria-label="${t('cs.pick')} ${i + 1}">
            <input class="input mono sw-hexin" value="${p.hex}" data-i="${i}" maxlength="7" spellcheck="false" aria-label="HEX ${i + 1}">
            <button class="btn btn-sm btn-icon sw-lock" data-i="${i}" aria-pressed="${p.locked}" data-tip="${t(p.locked ? 'cs.unlock' : 'cs.lock')}" aria-label="${t(p.locked ? 'cs.unlock' : 'cs.lock')} ${i + 1}">${p.locked ? I.lock : I.unlock}</button>
          </div>
        </div>
      </div>`).join('');

    $$('.sw-color', row).forEach((b) => b.addEventListener('click', () => copyHex(palette[+b.dataset.i].hex)));
    $$('.sw-lock', row).forEach((b) => b.addEventListener('click', () => {
      const i = +b.dataset.i;
      palette[i].locked = !palette[i].locked;
      renderPalette();
    }));
    $$('input[type="color"]', row).forEach((inp) => inp.addEventListener('input', () => {
      palette[+inp.dataset.i].hex = inp.value.toUpperCase();
      renderPalette();
    }));
    $$('.sw-hexin', row).forEach((inp) => inp.addEventListener('change', () => {
      const hex = U.normalizeHex(inp.value);
      if (hex) { palette[+inp.dataset.i].hex = hex; renderPalette(); }
      else { inp.value = palette[+inp.dataset.i].hex; toast(t('cs.invalid'), 'error'); }
    }));
  }

  function paletteExportText(format) {
    const hexes = palette.map((p) => p.hex);
    if (format === 'css') return ':root {\n' + hexes.map((h, i) => '  --vistanology-' + (i + 1) + ': ' + h + ';').join('\n') + '\n}';
    if (format === 'json') return JSON.stringify({ name: 'Vistanology palette', scheme, colors: hexes }, null, 2);
    return hexes.join('\n');
  }

  function exportModal() {
    const m = modal({
      title: t('cs.export.title'),
      body:
        '<div class="field"><label for="cs-exp-format">' + t('cs.export.format') + '</label>' +
        '<select id="cs-exp-format" class="input"><option value="css">' + t('cs.export.css') + '</option><option value="hex">' + t('cs.export.hex') + '</option><option value="json">' + t('cs.export.json') + '</option></select></div>' +
        '<textarea id="cs-exp-out" class="input mono" rows="9" readonly aria-label="' + t('cs.export.title') + '"></textarea>',
      actions: [
        {
          label: t('common.download'), icon: I.download, onClick: () => {
            const f = $('#cs-exp-format', m.body).value;
            U.downloadText($('#cs-exp-out', m.body).value, 'vistanology-palette.' + (f === 'json' ? 'json' : f === 'css' ? 'css' : 'txt'), f === 'json' ? 'application/json' : 'text/plain');
            toast(t('cs.export.done'), 'success');
          }
        },
        {
          label: t('common.copy'), className: 'btn-primary', icon: I.copy, onClick: async () => {
            (await U.copyText($('#cs-exp-out', m.body).value)) ? toast(t('cs.export.copied'), 'success') : toast(t('common.copyfail'), 'error');
          }
        }
      ]
    });
    const out = $('#cs-exp-out', m.body);
    const fmt = $('#cs-exp-format', m.body);
    const refresh = () => { out.value = paletteExportText(fmt.value); };
    fmt.addEventListener('change', refresh);
    refresh();
  }

  /* ---------- Inspector ---------- */

  function setInsp(hex, skip) {
    insp = hex;
    const rgb = U.hexToRgb(hex);
    const hsl = U.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const set = (id, v) => { if (id !== skip) $(id).value = v; };
    set('#cs-i-picker', hex);
    set('#cs-i-hex', hex);
    set('#cs-i-r', rgb.r); set('#cs-i-g', rgb.g); set('#cs-i-b', rgb.b);
    set('#cs-i-h', hsl.h); set('#cs-i-s', hsl.s); set('#cs-i-l', hsl.l);
    const prev = $('#cs-i-preview');
    prev.style.background = hex;
    prev.style.color = U.contrast(hex, '#FFFFFF') >= U.contrast(hex, '#04070F') ? '#FFFFFF' : '#04070F';
    prev.innerHTML = '<span>' + hex + '<br><small>rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ') · hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)</small></span>';
    $('#cs-i-copy-hex').dataset.value = hex;
    $('#cs-i-copy-rgb').dataset.value = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
    $('#cs-i-copy-hsl').dataset.value = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
  }

  function wireInspector() {
    $('#cs-i-picker').addEventListener('input', (e) => setInsp(e.target.value.toUpperCase(), '#cs-i-picker'));
    $('#cs-i-hex').addEventListener('change', (e) => {
      const hex = U.normalizeHex(e.target.value);
      if (hex) setInsp(hex, '#cs-i-hex');
      else { e.target.value = insp; toast(t('cs.invalid'), 'error'); }
    });
    ['r', 'g', 'b'].forEach((ch) => $('#cs-i-' + ch).addEventListener('input', () => {
      const v = (id) => U.clamp(parseInt($(id).value, 10) || 0, 0, 255);
      setInsp(U.rgbToHex(v('#cs-i-r'), v('#cs-i-g'), v('#cs-i-b')), '#cs-i-' + ch);
    }));
    ['h', 's', 'l'].forEach((ch) => $('#cs-i-' + ch).addEventListener('input', () => {
      const v = (id, max) => U.clamp(parseInt($(id).value, 10) || 0, 0, max);
      setInsp(U.hslToHex(v('#cs-i-h', 360), v('#cs-i-s', 100), v('#cs-i-l', 100)), '#cs-i-' + ch);
    }));
    ['hex', 'rgb', 'hsl'].forEach((f) => $('#cs-i-copy-' + f).addEventListener('click', async (e) => {
      (await U.copyText(e.currentTarget.dataset.value)) ? toast(t('cs.copied', { v: e.currentTarget.dataset.value }), 'success') : toast(t('common.copyfail'), 'error');
    }));
    setInsp(insp);
  }

  /* ---------- Image extraction (k-means) ---------- */

  function extractColors(img) {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 120 / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    const pts = [];
    const step = Math.max(1, Math.floor(data.length / 4 / 4000));
    for (let i = 0; i < data.length; i += 4 * step) {
      if (data[i + 3] < 128) continue;
      pts.push([data[i], data[i + 1], data[i + 2]]);
    }
    if (!pts.length) return [];

    const k = Math.min(6, pts.length);
    let centers = [];
    let attempts = 0;
    while (centers.length < k && attempts < 500) {
      attempts++;
      const p = pts[U.randInt(0, pts.length - 1)];
      if (!centers.some((c) => c[0] === p[0] && c[1] === p[1] && c[2] === p[2])) centers.push(p.slice());
    }
    if (!centers.length) return [];

    for (let iter = 0; iter < 10; iter++) {
      const sums = centers.map(() => [0, 0, 0, 0]);
      pts.forEach((p) => {
        let best = 0, bd = Infinity;
        centers.forEach((c, ci) => {
          const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
          if (d < bd) { bd = d; best = ci; }
        });
        sums[best][0] += p[0]; sums[best][1] += p[1]; sums[best][2] += p[2]; sums[best][3]++;
      });
      centers = centers.map((c, ci) => sums[ci][3] ? [sums[ci][0] / sums[ci][3], sums[ci][1] / sums[ci][3], sums[ci][2] / sums[ci][3]] : c);
    }

    const counts = centers.map(() => 0);
    pts.forEach((p) => {
      let best = 0, bd = Infinity;
      centers.forEach((c, ci) => {
        const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (d < bd) { bd = d; best = ci; }
      });
      counts[best]++;
    });

    return centers
      .map((c, i) => ({ hex: U.rgbToHex(c[0], c[1], c[2]), n: counts[i] }))
      .sort((a, b) => b.n - a.n)
      .map((c) => c.hex)
      .filter((h, i, arr) => arr.indexOf(h) === i);
  }

  async function handleExtractFile(file) {
    if (!file || !file.type.startsWith('image/')) { toast(t('cs.imgtype'), 'error'); return; }
    try {
      const url = await U.readFileAsDataURL(file);
      const img = await U.loadImage(url);
      const colors = extractColors(img);
      if (!alive) return;
      if (!colors.length) { toast(t('cs.noopaque'), 'warn'); return; }
      const grid = $('#cs-x-grid');
      grid.innerHTML = colors.map((h) => '<button class="extract-chip" data-hex="' + h + '" data-tip="' + t('cs.copyhex') + ' ' + h + '"><span style="background:' + h + '"></span>' + h + '</button>').join('');
      $$('.extract-chip', grid).forEach((b) => b.addEventListener('click', () => copyHex(b.dataset.hex)));
      $('#cs-x-use').hidden = false;
      $('#cs-x-use').dataset.colors = JSON.stringify(colors);
      $('#cs-x-empty').hidden = true;
      toast(t('cs.extracted', { n: colors.length }), 'success');
    } catch { toast(t('cs.imgfail'), 'error'); }
  }

  function wireExtract() {
    const zone = $('#cs-x-zone');
    const input = $('#cs-x-file');
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', () => { handleExtractFile(input.files[0]); input.value = ''; });
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.remove('dragover'); }));
    zone.addEventListener('drop', (e) => handleExtractFile(e.dataTransfer.files[0]));
    $('#cs-x-use').addEventListener('click', (e) => {
      const colors = JSON.parse(e.currentTarget.dataset.colors || '[]');
      palette = colors.slice(0, 5).map((hex) => ({ hex, locked: false }));
      while (palette.length < 5) palette.push({ hex: U.randomHex(), locked: false });
      renderPalette();
      toast(t('cs.loaded'), 'success');
      $('#cs-palette').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---------- Contrast ---------- */

  function renderContrast() {
    const ratio = U.contrast(fg, bg);
    $('#cs-k-ratio').textContent = ratio.toFixed(2) + ':1';
    const prev = $('#cs-k-preview');
    prev.style.background = bg;
    prev.style.color = fg;
    const checks = [
      [t('cs.aa.normal'), 4.5], [t('cs.aa.large'), 3], [t('cs.aaa.normal'), 7], [t('cs.aaa.large'), 4.5]
    ];
    $('#cs-k-results').innerHTML = checks.map(([label, min]) => {
      const pass = ratio >= min;
      return '<div class="contrast-cell">' + label + '<span class="badge ' + (pass ? 'badge-ok' : 'badge-err') + '">' + t(pass ? 'cs.pass' : 'cs.fail') + '</span><span class="mono">≥ ' + min + ':1</span></div>';
    }).join('');
    $('#cs-k-fg-hex').value = fg;
    $('#cs-k-bg-hex').value = bg;
    $('#cs-k-fg').value = fg;
    $('#cs-k-bg').value = bg;
  }

  function wireContrast() {
    const bind = (picker, hexInput, setter) => {
      $(picker).addEventListener('input', (e) => { setter(e.target.value.toUpperCase()); renderContrast(); });
      $(hexInput).addEventListener('change', (e) => {
        const hex = U.normalizeHex(e.target.value);
        if (hex) { setter(hex); renderContrast(); }
        else { e.target.value = picker === '#cs-k-fg' ? fg : bg; toast(t('cs.invalid'), 'error'); }
      });
    };
    bind('#cs-k-fg', '#cs-k-fg-hex', (v) => { fg = v; });
    bind('#cs-k-bg', '#cs-k-bg-hex', (v) => { bg = v; });
    $('#cs-k-swap').addEventListener('click', () => { [fg, bg] = [bg, fg]; renderContrast(); });
    renderContrast();
  }

  /* ---------- Mount ---------- */

  function mount(el) {
    alive = true;
    palette = Array.from({ length: 5 }, () => ({ hex: U.randomHex(), locked: false }));

    el.innerHTML = `
      <div class="cs-toolbar">
        <div class="field"><label for="cs-scheme">${t('cs.harmony')}</label>
          <select id="cs-scheme" class="input">
            <option value="random">${t('cs.random')}</option><option value="complementary">${t('cs.complementary')}</option>
            <option value="analogous">${t('cs.analogous')}</option><option value="triadic">${t('cs.triadic')}</option>
            <option value="split">${t('cs.split')}</option><option value="mono">${t('cs.mono')}</option>
          </select>
        </div>
        <span class="spacer"></span>
        <button id="cs-generate" class="btn btn-primary">${I.dice} ${t('cs.generate')}</button>
        <button id="cs-export" class="btn">${I.download} ${t('cs.export')}</button>
      </div>

      <div class="palette-stage" id="cs-palette"></div>
      <p class="hint" style="margin-bottom:18px">${t('cs.palette.hint')}</p>

      <div class="cs-grid">
        <section class="cs-panel glass">
          <h3>${t('cs.inspector')}</h3>
          <div id="cs-i-preview" class="insp-preview"></div>
          <div class="field"><label for="cs-i-picker">${t('cs.pick')}</label><input type="color" id="cs-i-picker" class="input" value="${insp}"></div>
          <div class="field"><label for="cs-i-hex">HEX</label><div class="copy-row"><input id="cs-i-hex" class="input mono" spellcheck="false"><button id="cs-i-copy-hex" class="btn btn-icon" data-tip="${t('cs.copyhex')}" aria-label="${t('cs.copyhex')}">${I.copy}</button></div></div>
          <div class="field-row">
            <div class="field"><label for="cs-i-r">R</label><input id="cs-i-r" class="input" type="number" min="0" max="255"></div>
            <div class="field"><label for="cs-i-g">G</label><input id="cs-i-g" class="input" type="number" min="0" max="255"></div>
            <div class="field"><label for="cs-i-b">B</label><input id="cs-i-b" class="input" type="number" min="0" max="255"></div>
          </div>
          <div class="copy-row"><button id="cs-i-copy-rgb" class="btn btn-sm">${I.copy} ${t('cs.copyrgb')}</button></div>
          <div class="field-row">
            <div class="field"><label for="cs-i-h">H (0–360)</label><input id="cs-i-h" class="input" type="number" min="0" max="360"></div>
            <div class="field"><label for="cs-i-s">S (%)</label><input id="cs-i-s" class="input" type="number" min="0" max="100"></div>
            <div class="field"><label for="cs-i-l">L (%)</label><input id="cs-i-l" class="input" type="number" min="0" max="100"></div>
          </div>
          <div class="copy-row"><button id="cs-i-copy-hsl" class="btn btn-sm">${I.copy} ${t('cs.copyhsl')}</button></div>
        </section>

        <section class="cs-panel glass">
          <h3>${t('cs.contrast')}</h3>
          <div class="field-row k-row">
            <div class="k-pair">
              <div class="field fixed"><label for="cs-k-fg">${t('cs.fg')}</label><input type="color" id="cs-k-fg" class="input" value="${fg}"></div>
              <div class="field"><label for="cs-k-fg-hex">HEX</label><input id="cs-k-fg-hex" class="input mono" value="${fg}" spellcheck="false"></div>
            </div>
            <button id="cs-k-swap" class="btn btn-icon" data-tip="${t('cs.swap')}" aria-label="${t('cs.swap')}">${I.swap}</button>
            <div class="k-pair">
              <div class="field fixed"><label for="cs-k-bg">${t('cs.bg')}</label><input type="color" id="cs-k-bg" class="input" value="${bg}"></div>
              <div class="field"><label for="cs-k-bg-hex">HEX</label><input id="cs-k-bg-hex" class="input mono" value="${bg}" spellcheck="false"></div>
            </div>
          </div>
          <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap"><span id="cs-k-ratio" class="contrast-ratio"></span><span class="hint">${t('cs.ratio.hint')}</span></div>
          <div id="cs-k-preview" class="contrast-preview"><span class="big">${t('cs.large.sample')}</span><span>${t('cs.normal.sample')}</span></div>
          <div id="cs-k-results" class="contrast-results"></div>
        </section>
      </div>

      <section class="cs-panel glass">
        <h3>${t('cs.extract')} <span class="badge badge-ok">${t('cs.local')}</span></h3>
        <div class="cs-extract">
          <div>
            <div id="cs-x-zone" class="dropzone" role="button" tabindex="0" aria-label="${t('cs.drop')}">
              <span class="orb orb-sm">${I.upload}</span>
              <strong>${t('cs.drop')}</strong>
              <span>${t('cs.drop.sub')}</span>
            </div>
            <input type="file" id="cs-x-file" accept="image/*" hidden>
          </div>
          <div class="cs-extract-right">
            <div id="cs-x-empty" class="empty"><strong>${t('cs.extract.empty')}</strong>${t('cs.extract.empty.sub')}</div>
            <div id="cs-x-grid" class="extract-grid"></div>
            <div><button id="cs-x-use" class="btn btn-aqua" hidden>${I.palette} ${t('cs.use')}</button></div>
          </div>
        </div>
      </section>`;

    $('#cs-scheme').addEventListener('change', (e) => { scheme = e.target.value; });
    $('#cs-generate').addEventListener('click', generate);
    $('#cs-export').addEventListener('click', exportModal);
    renderPalette();
    wireInspector();
    wireExtract();
    wireContrast();
  }

  VT.registry.add({
    id: 'color-studio', cat: 'creative', icon: 'palette', version: '1.0.0',
    name: { en: 'Color Studio', pt: 'Color Studio' },
    tagline: {
      en: 'Harmony palettes with locks, a precision inspector, image color extraction and WCAG contrast.',
      pt: 'Paletas com harmonias e travas, inspector de precisão, extração de cores de imagem e contraste WCAG.'
    },
    tags: ['palette', 'hex', 'rgb', 'hsl', 'contrast', 'wcag', 'picker', 'extract', 'harmony', 'color', 'cor'],
    deps: [],
    docs: {
      en: {
        summary: 'A color workbench: generate harmony-based palettes, lock the colors you love, inspect any value in HEX/RGB/HSL, extract dominant colors from images and check WCAG 2.1 contrast.',
        usage: [
          'Choose a harmony (random, complementary, analogous, triadic, split, monochromatic) and Generate.',
          'Lock swatches to keep them fixed while the rest regenerate; click a swatch to copy its HEX.',
          'Use the Inspector to convert between HEX, RGB and HSL with live preview.',
          'Drop an image to extract up to six dominant colors (k-means, entirely local), then use them as a palette.',
          'Check foreground/background pairs against AA and AAA thresholds for normal and large text.'
        ],
        privacy: 'Images are decoded in memory via Canvas and never uploaded. Palette state lives only in this page session.',
        limits: [
          'Extraction samples up to 4000 pixels; very similar tones may merge into one cluster.',
          'WCAG ratios use relative luminance of sRGB values; they do not account for font weight or rendering.'
        ]
      },
      pt: {
        summary: 'Uma bancada de cor: gere paletas por harmonia, trave as cores que amar, inspecione qualquer valor em HEX/RGB/HSL, extraia cores dominantes de imagens e verifique contraste WCAG 2.1.',
        usage: [
          'Escolha uma harmonia (aleatória, complementar, análoga, triádica, dividida, monocromática) e Gere.',
          'Trave amostras para mantê-las fixas enquanto as demais regeneram; clique em uma amostra para copiar o HEX.',
          'Use o Inspector para converter entre HEX, RGB e HSL com prévia ao vivo.',
          'Solte uma imagem para extrair até seis cores dominantes (k-means, totalmente local) e use-as como paleta.',
          'Verifique pares frente/fundo contra os limiares AA e AAA para texto normal e grande.'
        ],
        privacy: 'Imagens são decodificadas em memória via Canvas e nunca enviadas. O estado da paleta vive apenas nesta sessão.',
        limits: [
          'A extração amostra até 4000 pixels; tons muito parecidos podem se fundir em um cluster.',
          'Razões WCAG usam luminância relativa de valores sRGB; não consideram peso de fonte ou renderização.'
        ]
      }
    },
    mount,
    unmount() { alive = false; }
  });
})();