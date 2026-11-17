window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['font-preview'] = (() => {
  const U = VT.utils;
  const { $, $$, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'fp.font': 'Typeface', 'fp.view': 'View', 'fp.specimen': 'Specimen', 'fp.waterfall': 'Waterfall', 'fp.glyphs': 'Glyphs',
      'fp.sample': 'Sample text', 'fp.preset': 'Presets', 'fp.pangram': 'Pangram EN', 'fp.pt': 'Text PT',
      'fp.alphabet': 'Alphabet', 'fp.digits': 'Digits', 'fp.paragraph': 'Paragraph',
      'fp.type': 'Type settings', 'fp.size': 'Size', 'fp.weight': 'Weight', 'fp.style': 'Style',
      'fp.normal': 'Normal', 'fp.italic': 'Italic', 'fp.tracking': 'Letter spacing', 'fp.leading': 'Line height',
      'fp.transform': 'Transform', 'fp.none': 'None', 'fp.upper': 'Uppercase', 'fp.lower': 'Lowercase', 'fp.capitalize': 'Capitalize',
      'fp.align': 'Alignment', 'fp.left': 'Left', 'fp.center': 'Center', 'fp.right': 'Right',
      'fp.colors': 'Colors', 'fp.fg': 'Text', 'fp.bg': 'Background', 'fp.contrast': 'Contrast',
      'fp.aa': 'AA text', 'fp.aafail': 'below AA',
      'fp.yours': 'Your fonts', 'fp.drop': 'Drop font files or click to browse',
      'fp.dropHint': '.woff2 · .woff · .ttf · .otf — up to 8 MB each, never uploaded',
      'fp.loaded': 'Loaded this session', 'fp.remove': 'Remove font', 'fp.nofonts': 'No custom fonts loaded yet.',
      'fp.session': 'Custom fonts live in memory only: they survive navigation, not a page reload.',
      'fp.metrics': 'Measured', 'fp.width': 'Text width', 'fp.cap': 'Cap height', 'fp.xheight': 'x-height',
      'fp.ascent': 'Ascent', 'fp.descent': 'Descent', 'fp.chars': 'Characters', 'fp.words': 'Words',
      'fp.copycss': 'Copy CSS', 'fp.png': 'PNG', 'fp.copied': 'CSS copied to clipboard',
      'fp.pngok': 'Specimen PNG downloaded', 'fp.pngfail': 'Could not export PNG',
      'fp.empty': 'Type a sample text to see the specimen.', 'fp.emptyTitle': 'Nothing to preview',
      'fp.fontok': 'Font loaded: {name}', 'fp.fontfail': 'Could not load {name}: not a usable font file.',
      'fp.fontbig': '{name} is larger than 8 MB.', 'fp.fontext': 'Unsupported file type: {name}',
      'fp.glyphcopied': 'Copied “{ch}”', 'fp.synth': 'Weights and italics the file does not contain are synthesized by the browser.',
      'fp.invalid': 'Invalid HEX value',
      'fp.group.bundled': 'Bundled (OFL)', 'fp.group.system': 'System stacks', 'fp.group.user': 'Your fonts',
      'fp.px': '{n} px'
    },
    pt: {
      'fp.font': 'Fonte', 'fp.view': 'Vista', 'fp.specimen': 'Espécime', 'fp.waterfall': 'Cascata', 'fp.glyphs': 'Glifos',
      'fp.sample': 'Texto de amostra', 'fp.preset': 'Presets', 'fp.pangram': 'Pangrama EN', 'fp.pt': 'Texto PT',
      'fp.alphabet': 'Alfabeto', 'fp.digits': 'Números', 'fp.paragraph': 'Parágrafo',
      'fp.type': 'Ajustes de tipo', 'fp.size': 'Corpo', 'fp.weight': 'Peso', 'fp.style': 'Estilo',
      'fp.normal': 'Normal', 'fp.italic': 'Itálico', 'fp.tracking': 'Entreletra', 'fp.leading': 'Entrelinha',
      'fp.transform': 'Transformação', 'fp.none': 'Nenhuma', 'fp.upper': 'Maiúsculas', 'fp.lower': 'Minúsculas', 'fp.capitalize': 'Iniciais maiúsculas',
      'fp.align': 'Alinhamento', 'fp.left': 'Esquerda', 'fp.center': 'Centro', 'fp.right': 'Direita',
      'fp.colors': 'Cores', 'fp.fg': 'Texto', 'fp.bg': 'Fundo', 'fp.contrast': 'Contraste',
      'fp.aa': 'AA texto', 'fp.aafail': 'abaixo de AA',
      'fp.yours': 'Suas fontes', 'fp.drop': 'Solte arquivos de fonte ou clique para escolher',
      'fp.dropHint': '.woff2 · .woff · .ttf · .otf — até 8 MB cada, nunca enviados',
      'fp.loaded': 'Carregadas nesta sessão', 'fp.remove': 'Remover fonte', 'fp.nofonts': 'Nenhuma fonte própria carregada.',
      'fp.session': 'Fontes próprias ficam só na memória: sobrevivem à navegação, não ao reload da página.',
      'fp.metrics': 'Medidas', 'fp.width': 'Largura do texto', 'fp.cap': 'Altura de maiúscula', 'fp.xheight': 'Altura-x',
      'fp.ascent': 'Ascendente', 'fp.descent': 'Descendente', 'fp.chars': 'Caracteres', 'fp.words': 'Palavras',
      'fp.copycss': 'Copiar CSS', 'fp.png': 'PNG', 'fp.copied': 'CSS copiado para a área de transferência',
      'fp.pngok': 'PNG do espécime baixado', 'fp.pngfail': 'Não foi possível exportar PNG',
      'fp.empty': 'Digite um texto de amostra para ver o espécime.', 'fp.emptyTitle': 'Nada para pré-visualizar',
      'fp.fontok': 'Fonte carregada: {name}', 'fp.fontfail': 'Não foi possível carregar {name}: arquivo de fonte inválido.',
      'fp.fontbig': '{name} tem mais de 8 MB.', 'fp.fontext': 'Tipo de arquivo não suportado: {name}',
      'fp.glyphcopied': 'Copiado “{ch}”', 'fp.synth': 'Pesos e itálicos que o arquivo não contém são sintetizados pelo navegador.',
      'fp.invalid': 'Valor HEX inválido',
      'fp.group.bundled': 'Incluídas (OFL)', 'fp.group.system': 'Pilhas do sistema', 'fp.group.user': 'Suas fontes',
      'fp.px': '{n} px'
    }
  });

  const BUNDLED = [
    { id: 'instrument-serif', label: 'Instrument Serif', family: "'Instrument Serif', Georgia, 'Times New Roman', serif" },
    { id: 'inter', label: 'Inter', family: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif" }
  ];
  const SYSTEM = [
    { id: 'system-ui', label: 'System UI', family: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
    { id: 'serif', label: 'Serif', family: "Georgia, 'Times New Roman', serif" },
    { id: 'sans', label: 'Sans-serif', family: 'Arial, Helvetica, sans-serif' },
    { id: 'mono', label: 'Monospace', family: "ui-monospace, 'Cascadia Code', Consolas, monospace" },
    { id: 'cursive', label: 'Cursive', family: 'cursive' },
    { id: 'fantasy', label: 'Fantasy', family: 'fantasy' }
  ];
  const userFonts = [];

  const SAMPLES = {
    pangram: 'The quick brown fox jumps over the lazy dog',
    pt: 'Vistanology: tecnologia útil, possibilidades abertas. Cada ferramenta roda no seu navegador.',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    digits: '0123456789 .,;:!?\'"()[]{}@#$%&*+-/=<>',
    paragraph: 'Typography is the craft of endowing human language with a durable visual form. A typeface carries tone, rhythm and hierarchy before a single word is read.'
  };
  const WATERFALL = [12, 16, 20, 24, 32, 48, 64, 96];
  const GLYPHS = (SAMPLES.alphabet + SAMPLES.digits).split('');
  const MAX_FONT_BYTES = 8 * 1024 * 1024;
  const FONT_EXT = /\.(woff2?|ttf|otf)$/i;
  const WEIGHTS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  const CSS_TRANSFORM = { none: 'none', upper: 'uppercase', lower: 'lowercase', capitalize: 'capitalize' };

  const def = {
    id: 'font-preview', cat: 'creative', icon: 'type', version: '1.0.0',
    name: { en: 'Font Preview', pt: 'Font Preview' },
    tagline: {
      en: 'Test bundled, system and your own font files with live specimen, waterfall, glyphs, measured metrics and CSS/PNG export.',
      pt: 'Teste fontes incluídas, do sistema e as suas com espécime ao vivo, cascata, glifos, medidas reais e export CSS/PNG.'
    },
    tags: ['font', 'typography', 'typeface', 'specimen', 'preview', 'woff2', 'ttf'],
    deps: ['Instrument Serif (OFL 1.1)', 'Inter (OFL 1.1)'],
    docs: {
      en: {
        summary: 'A typography bench: preview the bundled OFL faces, the system stacks, or your own font files — loaded locally, never uploaded — with specimen, waterfall and glyph views, real measured metrics and CSS/PNG export.',
        usage: [
          'Pick a typeface: bundled (Instrument Serif, Inter), a system stack, or one of your loaded files.',
          'Drop .woff2 / .woff / .ttf / .otf files (up to 8 MB each) to load them into the page. They stay in memory for the session.',
          'Write a sample text or use a preset: pangram, Portuguese text, alphabet, digits or paragraph.',
          'Switch between Specimen, Waterfall (12–96 px) and Glyphs; click any glyph to copy it.',
          'Tune size, weight, style, letter spacing, line height, transform, alignment and colors — the contrast ratio updates live.',
          'Read measured metrics (text width, cap height, x-height, ascent, descent) and export the CSS snippet or a PNG specimen.'
        ],
        privacy: 'Font files are read with FileReader and registered through the FontFace API in memory. Nothing is uploaded, and no font is written to disk or to localStorage.',
        limits: [
          'Custom fonts are session-only: they survive navigation but not a page reload.',
          'Weights and italics a file does not contain are synthesized by the browser.',
          'Metrics come from Canvas measureText, so they reflect the rendered face at the current size.',
          'PNG export uses canvas letter spacing (Chrome 99+, Safari 17.4+, Firefox 126+); older engines ignore the tracking value.',
          'Sample text is capped at 2000 characters; the PNG is 1200 px wide and at most 4000 px tall.'
        ]
      },
      pt: {
        summary: 'Uma bancada de tipografia: pré-visualize as fontes OFL incluídas, as pilhas do sistema ou seus próprios arquivos — carregados localmente, nunca enviados — com vistas de espécime, cascata e glifos, medidas reais e export CSS/PNG.',
        usage: [
          'Escolha uma fonte: incluídas (Instrument Serif, Inter), uma pilha do sistema ou um arquivo seu carregado.',
          'Solte arquivos .woff2 / .woff / .ttf / .otf (até 8 MB cada) para carregá-los na página. Ficam na memória durante a sessão.',
          'Escreva um texto de amostra ou use um preset: pangrama, texto em português, alfabeto, números ou parágrafo.',
          'Alterne entre Espécime, Cascata (12–96 px) e Glifos; clique em um glifo para copiá-lo.',
          'Ajuste corpo, peso, estilo, entreletra, entrelinha, transformação, alinhamento e cores — o contraste atualiza ao vivo.',
          'Leia as medidas reais (largura do texto, altura de maiúscula, altura-x, ascendente, descendente) e exporte o CSS ou um PNG do espécime.'
        ],
        privacy: 'Arquivos de fonte são lidos com FileReader e registrados pela FontFace API na memória. Nada é enviado, e nenhuma fonte é gravada em disco ou no localStorage.',
        limits: [
          'Fontes próprias duram só a sessão: sobrevivem à navegação, não ao reload da página.',
          'Pesos e itálicos que o arquivo não contém são sintetizados pelo navegador.',
          'As medidas vêm do measureText do Canvas, refletindo a face renderizada no corpo atual.',
          'O PNG usa entreletra do canvas (Chrome 99+, Safari 17.4+, Firefox 126+); engines mais antigos ignoram o valor.',
          'O texto de amostra é limitado a 2000 caracteres; o PNG tem 1200 px de largura e no máximo 4000 px de altura.'
        ]
      }
    },
    mount, unmount
  };

  let alive = false;
  let wfSig = '', glSig = '', fontSig = '';
  const saved = VT.store.get('font-preview', null);
  const state = Object.assign({
    font: 'instrument-serif', view: 'specimen', text: SAMPLES.pangram,
    size: 64, weight: 400, style: 'normal', tracking: 0, leading: 1.15,
    transform: 'none', align: 'left', fg: '#EAF7FF', bg: '#0A1B2E'
  }, saved || {});
  if (typeof state.text !== 'string') state.text = SAMPLES.pangram;
  state.text = state.text.slice(0, 2000);

  const pick = (v, list, d) => (list.includes(v) ? v : d);
  const step = (v, min, max, s, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? +U.clamp(Math.round(n / s) * s, min, max).toFixed(2) : d;
  };
  state.size = step(state.size, 8, 160, 1, 64);
  state.weight = pick(Number(state.weight), WEIGHTS, 400);
  state.tracking = step(state.tracking, -3, 24, 0.5, 0);
  state.leading = step(state.leading, 0.8, 2.4, 0.05, 1.15);
  state.style = pick(state.style, ['normal', 'italic'], 'normal');
  state.transform = pick(state.transform, ['none', 'upper', 'lower', 'capitalize'], 'none');
  state.align = pick(state.align, ['left', 'center', 'right'], 'left');
  state.view = pick(state.view, ['specimen', 'waterfall', 'glyphs'], 'specimen');
  state.fg = U.normalizeHex(state.fg) || '#EAF7FF';
  state.bg = U.normalizeHex(state.bg) || '#0A1B2E';

  const persist = U.debounce(() => {
    const { font, view, text, size, weight, style, tracking, leading, transform, align, fg, bg } = state;
    VT.store.set('font-preview', { font, view, text, size, weight, style, tracking, leading, transform, align, fg, bg });
  }, 400);

  const allFonts = () => BUNDLED.concat(SYSTEM, userFonts);
  const currentFont = () => allFonts().find((f) => f.id === state.font) || BUNDLED[0];
  const fontStack = () => currentFont().family;
  const fontShorthand = (size) => state.style + ' ' + state.weight + ' ' + size + 'px ' + fontStack();
  const transformed = (txt) => {
    if (state.transform === 'upper') return txt.toUpperCase();
    if (state.transform === 'lower') return txt.toLowerCase();
    if (state.transform === 'capitalize') return txt.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
    return txt;
  };
  const hasText = () => state.text.trim().length > 0;

  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');

  // measureText silently falls back to a system face while a webfont is still loading.
  function ensureFont() {
    const sig = state.style + ' ' + state.weight + ' ' + fontStack();
    if (sig === fontSig) return;
    fontSig = sig;
    document.fonts.load(fontShorthand(16), state.text || ' ').then(() => { if (alive) render(); }).catch(() => {});
  }

  function metrics() {
    const txt = transformed(state.text);
    mctx.font = fontShorthand(state.size);
    if ('letterSpacing' in mctx) mctx.letterSpacing = state.tracking + 'px';
    const lines = txt.split('\n');
    let width = 0;
    lines.forEach((l) => { width = Math.max(width, mctx.measureText(l).width); });
    const cap = mctx.measureText('H');
    const xh = mctx.measureText('x');
    const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
    return {
      width,
      cap: cap.actualBoundingBoxAscent || 0,
      xheight: xh.actualBoundingBoxAscent || 0,
      ascent: cap.fontBoundingBoxAscent || 0,
      descent: cap.fontBoundingBoxDescent || 0,
      chars: txt.length,
      words
    };
  }

  function cssSnippet() {
    const f = currentFont();
    const lines = [];
    if (f.dataUrl) {
      lines.push('@font-face {');
      lines.push('  font-family: ' + f.family + ';');
      lines.push('  src: url(' + f.dataUrl + ') format("' + f.format + '");');
      lines.push('  font-weight: ' + state.weight + ';');
      lines.push('  font-style: ' + state.style + ';');
      lines.push('}');
      lines.push('');
    }
    lines.push('.specimen {');
    lines.push('  font-family: ' + fontStack() + ';');
    lines.push('  font-size: ' + state.size + 'px;');
    lines.push('  font-weight: ' + state.weight + ';');
    lines.push('  font-style: ' + state.style + ';');
    lines.push('  letter-spacing: ' + state.tracking + 'px;');
    lines.push('  line-height: ' + state.leading + ';');
    lines.push('  text-transform: ' + CSS_TRANSFORM[state.transform] + ';');
    lines.push('  text-align: ' + state.align + ';');
    lines.push('  color: ' + state.fg + ';');
    lines.push('  background-color: ' + state.bg + ';');
    lines.push('}');
    return lines.join('\n');
  }

  function wrapLines(ctx, txt, maxWidth) {
    const out = [];
    txt.split('\n').forEach((para) => {
      const words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(''); return; }
      let line = '';
      words.forEach((w) => {
        const test = line ? line + ' ' + w : w;
        if (line && ctx.measureText(test).width > maxWidth) { out.push(line); line = w; }
        else line = test;
      });
      out.push(line);
    });
    return out;
  }

  function exportPng() {
    const width = 1200, pad = 64;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = fontShorthand(state.size);
    if ('letterSpacing' in ctx) ctx.letterSpacing = state.tracking + 'px';
    const lines = wrapLines(ctx, transformed(state.text), width - pad * 2);
    const lineH = Math.round(state.size * state.leading);
    const height = Math.min(4000, Math.max(240, pad * 2 + lines.length * lineH));
    canvas.width = width; canvas.height = height;
    ctx.font = fontShorthand(state.size);
    if ('letterSpacing' in ctx) ctx.letterSpacing = state.tracking + 'px';
    ctx.fillStyle = state.bg; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = state.fg; ctx.textBaseline = 'alphabetic';
    lines.forEach((line, i) => {
      const y = pad + state.size + i * lineH;
      if (y > height - pad / 2) return;
      const w = ctx.measureText(line).width;
      const x = state.align === 'center' ? (width - w) / 2 : state.align === 'right' ? width - pad - w : pad;
      ctx.fillText(line, Math.max(pad / 2, x), y);
    });
    canvas.toBlob((blob) => {
      if (!blob) { toast(t('fp.pngfail'), 'error'); return; }
      U.downloadBlob(blob, 'vistanology-specimen-' + currentFont().id + '-' + state.size + 'px.png');
      toast(t('fp.pngok'), 'success');
    }, 'image/png');
  }

  function renderFontSelect() {
    const sel = $('#fp-font');
    const group = (label, items) => '<optgroup label="' + esc(label) + '">' +
      items.map((f) => '<option value="' + f.id + '">' + esc(f.label) + '</option>').join('') + '</optgroup>';
    sel.innerHTML = group(t('fp.group.bundled'), BUNDLED) + group(t('fp.group.system'), SYSTEM) +
      (userFonts.length ? group(t('fp.group.user'), userFonts) : '');
    state.font = currentFont().id;
    sel.value = state.font;
  }

  function renderUserFonts() {
    const wrap = $('#fp-fontlist');
    if (!userFonts.length) { wrap.innerHTML = '<p class="hint">' + t('fp.nofonts') + '</p>'; return; }
    wrap.innerHTML = userFonts.map((f) =>
      '<div class="fp-font-row"><span class="fp-font-name">' + esc(f.label) + '</span>' +
      '<span class="mono fp-font-meta">' + f.format.toUpperCase() + ' · ' + U.formatBytes(f.bytes) + '</span>' +
      '<button class="btn btn-icon btn-sm fp-font-x" data-id="' + f.id + '" aria-label="' + t('fp.remove') + ' ' + esc(f.label) + '">' + VT.icons.x + '</button></div>').join('');
    $$('.fp-font-x', wrap).forEach((b) => b.addEventListener('click', () => {
      const i = userFonts.findIndex((f) => f.id === b.dataset.id);
      if (i < 0) return;
      const f = userFonts[i];
      try { document.fonts.delete(f.face); } catch { /* already gone */ }
      userFonts.splice(i, 1);
      if (state.font === f.id) state.font = BUNDLED[0].id;
      renderFontSelect(); renderUserFonts(); render();
    }));
  }

  function render() {
    if (!alive) return;
    const empty = !hasText();
    $('#fp-empty').hidden = !empty;
    $('#fp-panels').hidden = empty;
    $('#fp-copy').disabled = empty;
    $('#fp-png').disabled = empty;

    const spec = $('#fp-specimen');
    spec.textContent = state.text;
    spec.style.fontFamily = fontStack();
    spec.style.fontSize = state.size + 'px';
    spec.style.fontWeight = state.weight;
    spec.style.fontStyle = state.style;
    spec.style.letterSpacing = state.tracking + 'px';
    spec.style.lineHeight = state.leading;
    spec.style.textTransform = CSS_TRANSFORM[state.transform];
    spec.style.textAlign = state.align;
    spec.style.color = state.fg;
    $('#fp-canvas').style.background = state.bg;

    const nextWf = [state.text, state.font, state.weight, state.style, state.tracking, state.leading, state.transform, state.fg].join('|');
    if (nextWf !== wfSig) {
      wfSig = nextWf;
      $('#fp-waterfall').innerHTML = WATERFALL.map((s) =>
        '<div class="fp-wf-row"><span class="mono fp-wf-size">' + s + '</span>' +
        '<span class="fp-wf-text" style="font-family:' + esc(fontStack()) + ';font-size:' + s + 'px;font-weight:' + state.weight +
        ';font-style:' + state.style + ';letter-spacing:' + state.tracking + 'px;line-height:' + state.leading +
        ';text-transform:' + CSS_TRANSFORM[state.transform] + ';color:' + state.fg + '">' + esc(state.text) + '</span></div>').join('');
    }

    const nextGl = [state.font, state.weight, state.style, state.fg].join('|');
    if (nextGl !== glSig) {
      glSig = nextGl;
      $('#fp-glyphs').innerHTML = GLYPHS.map((ch) =>
        '<button class="fp-glyph" data-ch="' + esc(ch) + '" style="font-family:' + esc(fontStack()) + ';font-weight:' + state.weight +
        ';font-style:' + state.style + ';color:' + state.fg + '" aria-label="' + esc(ch) + ' U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + '">' +
        '<span class="fp-glyph-ch">' + esc(ch) + '</span><span class="mono fp-glyph-code">' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') + '</span></button>').join('');
      $$('.fp-glyph').forEach((b) => b.addEventListener('click', async () => {
        const ch = b.dataset.ch;
        (await U.copyText(ch)) ? toast(t('fp.glyphcopied', { ch }), 'success') : toast(t('common.copyfail'), 'error');
      }));
    }

    const m = metrics();
    const set = (id, v) => { $('#' + id).textContent = v; };
    set('fp-m-width', Math.round(m.width) + ' px');
    set('fp-m-cap', m.cap.toFixed(1) + ' px');
    set('fp-m-x', m.xheight.toFixed(1) + ' px');
    set('fp-m-asc', m.ascent.toFixed(1) + ' px');
    set('fp-m-desc', m.descent.toFixed(1) + ' px');
    set('fp-m-chars', String(m.chars));
    set('fp-m-words', String(m.words));

    const ratio = U.contrast(state.fg, state.bg);
    $('#fp-ratio').textContent = ratio.toFixed(2) + ':1';
    const ok = ratio >= 4.5;
    $('#fp-ratio-badge').textContent = ok ? t('fp.aa') : t('fp.aafail');
    $('#fp-ratio-badge').className = 'badge ' + (ok ? 'badge-ok' : 'badge-warn');

    $('#fp-size-val').textContent = t('fp.px', { n: state.size });
    $('#fp-track-val').textContent = state.tracking.toFixed(1) + ' px';
    $('#fp-lead-val').textContent = state.leading.toFixed(2);
    $$('#fp-style button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.style === state.style)));
    $$('#fp-align button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.align === state.align)));
    ensureFont();
    persist();
  }

  async function loadFiles(files) {
    for (const file of Array.from(files)) {
      if (!FONT_EXT.test(file.name)) { toast(t('fp.fontext', { name: file.name }), 'error'); continue; }
      if (file.size > MAX_FONT_BYTES) { toast(t('fp.fontbig', { name: file.name }), 'error'); continue; }
      const ext = file.name.split('.').pop().toLowerCase();
      const format = ext === 'ttf' ? 'truetype' : ext === 'otf' ? 'opentype' : ext;
      const base = file.name.replace(FONT_EXT, '').replace(/[^\w\- ]+/g, '').trim() || 'font';
      let n = 1, id = base.toLowerCase().replace(/\s+/g, '-'), family = '"' + base + '"';
      while (allFonts().some((f) => f.id === id)) { n++; id = base.toLowerCase().replace(/\s+/g, '-') + '-' + n; family = '"' + base + ' ' + n + '"'; }
      try {
        const dataUrl = await U.readFileAsDataURL(file);
        const face = new FontFace(family, 'url(' + dataUrl + ')');
        await face.load();
        document.fonts.add(face);
        userFonts.push({ id, label: file.name, family, face, dataUrl, format, bytes: file.size });
        state.font = id;
        renderFontSelect(); renderUserFonts(); render();
        toast(t('fp.fontok', { name: file.name }), 'success');
      } catch {
        toast(t('fp.fontfail', { name: file.name }), 'error');
      }
    }
  }

  function mount(el) {
    alive = true;
    const I = VT.icons;
    el.innerHTML = `
      <div class="fp-layout">
        <div class="fp-left">
        <section class="fp-stage glass-2">
          <div class="fp-bar">
            <div class="field fp-font-field"><label for="fp-font">${t('fp.font')}</label>
              <select id="fp-font" class="input"></select>
            </div>
            <div class="field"><label id="fp-view-label">${t('fp.view')}</label>
              <div class="tabs" id="fp-view" role="tablist" aria-labelledby="fp-view-label">
                ${['specimen', 'waterfall', 'glyphs'].map((k) => `<button class="tab" data-tab="${k}" role="tab" aria-selected="${state.view === k}">${t('fp.' + k)}</button>`).join('')}
              </div>
            </div>
          </div>
          <div class="fp-canvas" id="fp-canvas">
            <div id="fp-panels">
              <div class="fp-specimen" id="fp-specimen" data-panel="specimen"></div>
              <div class="fp-waterfall" id="fp-waterfall" data-panel="waterfall" hidden></div>
              <div class="fp-glyphs" id="fp-glyphs" data-panel="glyphs" hidden></div>
            </div>
            <div class="empty" id="fp-empty" hidden>${I.type}<strong>${t('fp.emptyTitle')}</strong>${t('fp.empty')}</div>
          </div>
          <div class="fp-metrics">
            <span class="fp-metrics-title mono">${t('fp.metrics')}</span>
            <dl class="fp-metrics-grid">
              ${[['width', 'fp-m-width'], ['cap', 'fp-m-cap'], ['xheight', 'fp-m-x'], ['ascent', 'fp-m-asc'], ['descent', 'fp-m-desc'], ['chars', 'fp-m-chars'], ['words', 'fp-m-words']]
                .map(([k, id]) => `<div class="fp-metric"><dt>${t('fp.' + k)}</dt><dd class="mono" id="${id}">—</dd></div>`).join('')}
            </dl>
          </div>
          <div class="export-row">
            <button id="fp-copy" class="btn btn-primary">${I.copy} ${t('fp.copycss')}</button>
            <button id="fp-png" class="btn btn-aqua">${I.download} ${t('fp.png')}</button>
          </div>
        </section>
        <section class="step glass">
          <div class="step-head"><h2 class="step-title">${t('fp.yours')}</h2></div>
          <div class="dropzone" id="fp-drop" role="button" tabindex="0" aria-label="${t('fp.drop')}">
            <span class="orb orb-sm">${I.upload}</span><strong>${t('fp.drop')}</strong><span>${t('fp.dropHint')}</span>
          </div>
          <input type="file" id="fp-file" accept=".woff2,.woff,.ttf,.otf,font/*" multiple hidden>
          <div class="fp-loaded-label mono">${t('fp.loaded')}</div>
          <div id="fp-fontlist"></div>
          <p class="hint">${t('fp.session')}</p>
        </section>
        </div>
        <div class="fp-controls">
          <section class="step glass">
            <div class="step-head"><h2 class="step-title">${t('fp.sample')}</h2></div>
            <div class="field"><label for="fp-text">${t('fp.sample')}</label>
              <textarea id="fp-text" class="input" rows="4" maxlength="2000" spellcheck="false">${esc(state.text)}</textarea>
            </div>
            <div class="fp-presets">
              ${Object.keys(SAMPLES).map((k) => `<button class="chip chip-sm" data-sample="${k}">${t('fp.' + k)}</button>`).join('')}
            </div>
          </section>
          <section class="step glass">
            <div class="step-head"><h2 class="step-title">${t('fp.type')}</h2></div>
            <div class="field"><label for="fp-size">${t('fp.size')} <span class="mono" id="fp-size-val"></span></label>
              <input type="range" id="fp-size" min="8" max="160" step="1" value="${state.size}">
            </div>
            <div class="field-row">
              <div class="field"><label for="fp-weight">${t('fp.weight')}</label>
                <select id="fp-weight" class="input">${WEIGHTS.map((w) => `<option value="${w}"${w === state.weight ? ' selected' : ''}>${w}</option>`).join('')}</select>
              </div>
              <div class="field"><label for="fp-transform">${t('fp.transform')}</label>
                <select id="fp-transform" class="input">${['none', 'upper', 'lower', 'capitalize'].map((k) => `<option value="${k}"${k === state.transform ? ' selected' : ''}>${t('fp.' + k)}</option>`).join('')}</select>
              </div>
            </div>
            <div class="field"><label id="fp-style-label">${t('fp.style')}</label>
              <div class="chips" id="fp-style" role="group" aria-labelledby="fp-style-label">
                ${['normal', 'italic'].map((k) => `<button class="chip" data-style="${k}" aria-pressed="${state.style === k}">${t('fp.' + k)}</button>`).join('')}
              </div>
            </div>
            <div class="field"><label for="fp-tracking">${t('fp.tracking')} <span class="mono" id="fp-track-val"></span></label>
              <input type="range" id="fp-tracking" min="-3" max="24" step="0.5" value="${state.tracking}">
            </div>
            <div class="field"><label for="fp-leading">${t('fp.leading')} <span class="mono" id="fp-lead-val"></span></label>
              <input type="range" id="fp-leading" min="0.8" max="2.4" step="0.05" value="${state.leading}">
            </div>
            <div class="field"><label id="fp-align-label">${t('fp.align')}</label>
              <div class="chips" id="fp-align" role="group" aria-labelledby="fp-align-label">
                ${['left', 'center', 'right'].map((k) => `<button class="chip" data-align="${k}" aria-pressed="${state.align === k}">${t('fp.' + k)}</button>`).join('')}
              </div>
            </div>
            <p class="hint">${t('fp.synth')}</p>
          </section>
          <section class="step glass">
            <div class="step-head"><h2 class="step-title">${t('fp.colors')}</h2></div>
            <div class="field-row k-row">
              <div class="k-pair">
                <div class="field fixed"><label for="fp-fg">${t('fp.fg')}</label><input type="color" id="fp-fg" class="input" value="${state.fg}"></div>
                <div class="field"><label for="fp-fg-hex">HEX</label><input id="fp-fg-hex" class="input mono" value="${state.fg}" spellcheck="false"></div>
              </div>
              <div class="k-pair">
                <div class="field fixed"><label for="fp-bg">${t('fp.bg')}</label><input type="color" id="fp-bg" class="input" value="${state.bg}"></div>
                <div class="field"><label for="fp-bg-hex">HEX</label><input id="fp-bg-hex" class="input mono" value="${state.bg}" spellcheck="false"></div>
              </div>
            </div>
            <div class="fp-contrast"><span class="mono">${t('fp.contrast')}</span><strong id="fp-ratio" class="mono">—</strong><span id="fp-ratio-badge" class="badge">—</span></div>
          </section>
        </div>
      </div>`;

    renderFontSelect();
    renderUserFonts();
    wfSig = glSig = fontSig = '';
    VT.ui.tabs($('.fp-stage'), (id) => { state.view = id; persist(); });

    $('#fp-font').addEventListener('change', (e) => { state.font = e.target.value; render(); });
    $('#fp-text').addEventListener('input', (e) => { state.text = e.target.value; render(); });
    $$('.fp-presets .chip').forEach((b) => b.addEventListener('click', () => {
      state.text = SAMPLES[b.dataset.sample]; $('#fp-text').value = state.text; render();
    }));
    $('#fp-size').addEventListener('input', (e) => { state.size = +e.target.value; render(); });
    $('#fp-weight').addEventListener('change', (e) => { state.weight = +e.target.value; render(); });
    $('#fp-transform').addEventListener('change', (e) => { state.transform = e.target.value; render(); });
    $('#fp-tracking').addEventListener('input', (e) => { state.tracking = +e.target.value; render(); });
    $('#fp-leading').addEventListener('input', (e) => { state.leading = +e.target.value; render(); });
    $$('#fp-style button').forEach((b) => b.addEventListener('click', () => { state.style = b.dataset.style; render(); }));
    $$('#fp-align button').forEach((b) => b.addEventListener('click', () => { state.align = b.dataset.align; render(); }));

    const bindColor = (pickerId, hexId, key) => {
      const picker = $(pickerId), hex = $(hexId);
      picker.addEventListener('input', () => { state[key] = picker.value.toUpperCase(); hex.value = state[key]; render(); });
      hex.addEventListener('change', () => {
        const v = U.normalizeHex(hex.value);
        if (v) { state[key] = v; picker.value = v; hex.value = v; render(); }
        else { hex.value = state[key]; toast(t('fp.invalid'), 'error'); }
      });
    };
    bindColor('#fp-fg', '#fp-fg-hex', 'fg');
    bindColor('#fp-bg', '#fp-bg-hex', 'bg');

    const drop = $('#fp-drop'), file = $('#fp-file');
    drop.addEventListener('click', () => file.click());
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); file.click(); } });
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('dragover'); }));
    drop.addEventListener('drop', (e) => { if (e.dataTransfer && e.dataTransfer.files.length) loadFiles(e.dataTransfer.files); });
    file.addEventListener('change', () => { if (file.files.length) loadFiles(file.files); file.value = ''; });

    $('#fp-copy').addEventListener('click', async () => {
      (await U.copyText(cssSnippet())) ? toast(t('fp.copied'), 'success') : toast(t('common.copyfail'), 'error');
    });
    $('#fp-png').addEventListener('click', exportPng);

    render();
  }

  function unmount() {
    alive = false;
    const { font, view, text, size, weight, style, tracking, leading, transform, align, fg, bg } = state;
    VT.store.set('font-preview', { font, view, text, size, weight, style, tracking, leading, transform, align, fg, bg });
  }

  VT.registry.add(def);
  return def;
})();