window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['svg-studio'] = (() => {
  const U = VT.utils;
  const { $, $$, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'sv.source': 'Source', 'sv.drop': 'Drop an .svg file or click to browse',
      'sv.dropHint': '.svg up to 512 KB — parsed, sanitized and previewed locally',
      'sv.code': 'SVG code', 'sv.samples': 'Samples', 'sv.sample.mark': 'Mark', 'sv.sample.chart': 'Chart', 'sv.sample.icon': 'Icon',
      'sv.clear': 'Clear', 'sv.count': '{n} characters',
      'sv.err.parse': 'Not well-formed XML — fix the markup to preview.',
      'sv.err.root': 'The root element must be <svg>.',
      'sv.err.big': 'Source is larger than 512 KB.',
      'sv.sanitized': 'Sanitized: removed {n} unsafe node(s)/attribute(s).',
      'sv.stage': 'Preview', 'sv.zoom': 'Zoom', 'sv.fit': 'Fit', 'sv.bg': 'Background',
      'sv.dark': 'Dark', 'sv.light': 'Light', 'sv.checker': 'Checker',
      'sv.inspect': 'Inspector', 'sv.width': 'Width', 'sv.height': 'Height', 'sv.viewbox': 'viewBox',
      'sv.nodes': 'Elements', 'sv.paths': 'Paths', 'sv.gradients': 'Gradients',
      'sv.size': 'Size', 'sv.optimized': 'Optimized', 'sv.saved': 'Saved',
      'sv.colors': 'Colors found', 'sv.nocolors': 'No explicit fill/stroke colors.',
      'sv.recolor': 'Recolor', 'sv.from': 'From', 'sv.to': 'To', 'sv.apply': 'Apply',
      'sv.recolored': 'Replaced {n} color value(s).', 'sv.recolor.none': 'That color was not found.',
      'sv.optimize': 'Optimize', 'sv.opt.comments': 'Remove comments', 'sv.opt.metadata': 'Remove metadata / title / desc',
      'sv.opt.whitespace': 'Collapse whitespace', 'sv.opt.empty': 'Remove empty groups', 'sv.opt.hex': 'Shorten hex colors',
      'sv.opt.precision': 'Number precision', 'sv.opt.apply': 'Optimize now', 'sv.opt.done': 'Optimized: {a} → {b} ({p}% smaller).',
      'sv.export': 'Export', 'sv.copy': 'Copy SVG', 'sv.copied': 'SVG copied to clipboard', 'sv.copyfail': 'Could not copy',
      'sv.svg': 'Download SVG', 'sv.png': 'PNG', 'sv.pngscale': 'PNG scale', 'sv.pngok': 'PNG downloaded', 'sv.pngfail': 'Could not export PNG',
      'sv.empty': 'Paste SVG code or drop a file to inspect, optimize and export it.',
      'sv.emptyTitle': 'Nothing to preview', 'sv.loaded': 'Loaded {name}', 'sv.loadfail': 'Could not read {name}',
      'sv.privacy': 'Parsed and rasterized in memory. No upload, no network.'
    },
    pt: {
      'sv.source': 'Código', 'sv.drop': 'Solte um arquivo .svg ou clique para escolher',
      'sv.dropHint': '.svg até 512 KB — lido, sanitizado e pré-visualizado localmente',
      'sv.code': 'Código SVG', 'sv.samples': 'Exemplos', 'sv.sample.mark': 'Marca', 'sv.sample.chart': 'Gráfico', 'sv.sample.icon': 'Ícone',
      'sv.clear': 'Limpar', 'sv.count': '{n} caracteres',
      'sv.err.parse': 'XML malformado — corrija a marcação para pré-visualizar.',
      'sv.err.root': 'O elemento raiz precisa ser <svg>.',
      'sv.err.big': 'O código passa de 512 KB.',
      'sv.sanitized': 'Sanitizado: {n} nó(s)/atributo(s) inseguro(s) removido(s).',
      'sv.stage': 'Pré-visualização', 'sv.zoom': 'Zoom', 'sv.fit': 'Ajustar', 'sv.bg': 'Fundo',
      'sv.dark': 'Escuro', 'sv.light': 'Claro', 'sv.checker': 'Xadrez',
      'sv.inspect': 'Inspetor', 'sv.width': 'Largura', 'sv.height': 'Altura', 'sv.viewbox': 'viewBox',
      'sv.nodes': 'Elementos', 'sv.paths': 'Caminhos', 'sv.gradients': 'Gradientes',
      'sv.size': 'Tamanho', 'sv.optimized': 'Otimizado', 'sv.saved': 'Economia',
      'sv.colors': 'Cores encontradas', 'sv.nocolors': 'Nenhuma cor explícita de fill/stroke.',
      'sv.recolor': 'Recolorir', 'sv.from': 'De', 'sv.to': 'Para', 'sv.apply': 'Aplicar',
      'sv.recolored': '{n} valor(es) de cor substituído(s).', 'sv.recolor.none': 'Essa cor não foi encontrada.',
      'sv.optimize': 'Otimizar', 'sv.opt.comments': 'Remover comentários', 'sv.opt.metadata': 'Remover metadata / title / desc',
      'sv.opt.whitespace': 'Recolher espaços', 'sv.opt.empty': 'Remover grupos vazios', 'sv.opt.hex': 'Encurtar cores hex',
      'sv.opt.precision': 'Precisão numérica', 'sv.opt.apply': 'Otimizar agora', 'sv.opt.done': 'Otimizado: {a} → {b} ({p}% menor).',
      'sv.export': 'Exportar', 'sv.copy': 'Copiar SVG', 'sv.copied': 'SVG copiado para a área de transferência', 'sv.copyfail': 'Não foi possível copiar',
      'sv.svg': 'Baixar SVG', 'sv.png': 'PNG', 'sv.pngscale': 'Escala do PNG', 'sv.pngok': 'PNG baixado', 'sv.pngfail': 'Não foi possível exportar PNG',
      'sv.empty': 'Cole código SVG ou solte um arquivo para inspecionar, otimizar e exportar.',
      'sv.emptyTitle': 'Nada para pré-visualizar', 'sv.loaded': 'Carregado {name}', 'sv.loadfail': 'Não foi possível ler {name}',
      'sv.privacy': 'Lido e rasterizado na memória. Sem upload, sem rede.'
    }
  });

  const MAX_CHARS = 512 * 1024;
  const BAD_TAGS = new Set(['script', 'foreignobject', 'iframe', 'embed', 'object', 'audio', 'video', 'handler', 'listener']);
  const ANIM_TAGS = new Set(['animate', 'set', 'animatetransform', 'animatemotion']);
  const COLOR_ATTRS = ['fill', 'stroke', 'stop-color', 'color', 'flood-color', 'lighting-color'];
  const NUM_ATTRS = ['d', 'points', 'transform', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'offset', 'stroke-width', 'font-size', 'viewBox', 'dx', 'dy'];
  const TEXT_TAGS = new Set(['text', 'tspan', 'textpath', 'title', 'desc', 'style']);

  const SAMPLES = {
    mark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">\n  <!-- brand mark -->\n  <defs>\n    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">\n      <stop offset="0" stop-color="#5FE6FF"/>\n      <stop offset="1" stop-color="#8FA0FF"/>\n    </linearGradient>\n  </defs>\n  <rect x="8" y="8" width="104" height="104" rx="24" fill="#0A1B2E"/>\n  <path d="M30 78 L60 34 L90 78 Z" fill="url(#g)"/>\n  <circle cx="60" cy="86" r="6" fill="#5FE6FF"/>\n</svg>',
    chart: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120" width="200" height="120">\n  <metadata>demo</metadata>\n  <title>Quarterly</title>\n  <rect width="200" height="120" fill="#0A1B2E"/>\n  <g fill="#5FE6FF">\n    <rect x="20" y="60" width="24" height="40"/>\n    <rect x="60" y="40" width="24" height="60"/>\n    <rect x="100" y="70" width="24" height="30"/>\n    <rect x="140" y="24" width="24" height="76"/>\n  </g>\n  <path d="M16 100 H184" stroke="#EAF7FF" stroke-width="1.500000"/>\n</svg>',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">\n  <!-- stroke icon -->\n  <g fill="none" stroke="#5FE6FF" stroke-width="1.500000" stroke-linecap="round">\n    <circle cx="12" cy="12" r="8.500000"/>\n    <path d="M12 7.000000 v5 l3.500000 2"/>\n  </g>\n  <g></g>\n</svg>'
  };

  const def = {
    id: 'svg-studio', cat: 'creative', icon: 'layers', version: '1.1.0',
    name: { en: 'SVG Studio', pt: 'SVG Studio' },
    tagline: {
      en: 'Inspect, sanitize, optimize, recolor and export SVG — parsed and rasterized entirely in your browser.',
      pt: 'Inspecione, sanitize, otimize, recolora e exporte SVG — lido e rasterizado inteiramente no seu navegador.'
    },
    tags: ['svg', 'vector', 'optimize', 'sanitize', 'inspect', 'export', 'png'],
    deps: [],
    docs: {
      en: {
        summary: 'A vector workbench: paste or drop SVG, see it rendered live, read real structure metrics, strip unsafe markup, shrink the file with safe optimizations, recolor any fill/stroke and export clean SVG or PNG.',
        usage: [
          'Paste SVG code or drop an .svg file (up to 512 KB). It is parsed, sanitized and previewed immediately.',
          'Read the inspector: dimensions, viewBox, element/path/gradient counts, byte size and the optimized size.',
          'Switch zoom (Fit / 100% / 200%) and background (dark / light / checker) to judge the artwork.',
          'Click a color chip to pick it as the recolor source, choose a target and apply across fill/stroke/stop-color.',
          'Toggle safe optimizations (comments, metadata, whitespace, empty groups, hex shortening, number precision) and apply.',
          'Undo/redo source changes (typing, clear, optimize, recolor, load) with Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) or the buttons.',
          'Export: copy the SVG, download the .svg, or rasterize to PNG at 1×/2×/4×.'
        ],
        privacy: 'SVG is parsed with DOMParser and rasterized with Canvas in memory. Unsafe nodes/attributes are stripped before anything is rendered. No upload, no network request, no telemetry.',
        limits: [
          'Sanitizing removes scripts, event handlers, foreignObject and external references; such SVGs render without those parts.',
          'Optimization is conservative: it never strips inherited presentation defaults, so rendering stays identical.',
          'Number precision rounds coordinates; very high precision loss can shift hairline geometry.',
          'PNG rasterization uses the SVG intrinsic size (width/height or viewBox); percentage-only sizes fall back to viewBox or 300×150.',
          'Source is capped at 512 KB; larger files are rejected to keep the editor responsive.',
          'Undo history is in-memory only (never saved); it resets when you leave the tool.'
        ]
      },
      pt: {
        summary: 'Uma bancada vetorial: cole ou solte SVG, veja renderizado ao vivo, leia métricas reais da estrutura, remova marcação insegura, reduza o arquivo com otimizações seguras, recolora qualquer fill/stroke e exporte SVG limpo ou PNG.',
        usage: [
          'Cole código SVG ou solte um arquivo .svg (até 512 KB). É lido, sanitizado e pré-visualizado na hora.',
          'Leia o inspetor: dimensões, viewBox, contagens de elementos/caminhos/gradientes, tamanho em bytes e tamanho otimizado.',
          'Alterne zoom (Ajustar / 100% / 200%) e fundo (escuro / claro / xadrez) para avaliar a arte.',
          'Clique numa cor para escolhê-la como origem da recoloração, escolha o destino e aplique em fill/stroke/stop-color.',
          'Marque otimizações seguras (comentários, metadata, espaços, grupos vazios, hex curto, precisão numérica) e aplique.',
          'Desfaça/refaça mudanças no código (digitação, limpar, otimizar, recolorir, carregar) com Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) ou os botões.',
          'Exporte: copie o SVG, baixe o .svg ou rasterize em PNG 1×/2×/4×.'
        ],
        privacy: 'O SVG é lido com DOMParser e rasterizado com Canvas na memória. Nós/atributos inseguros são removidos antes de qualquer renderização. Sem upload, sem rede, sem telemetria.',
        limits: [
          'A sanitização remove scripts, handlers de evento, foreignObject e referências externas; esses SVGs renderizam sem essas partes.',
          'A otimização é conservadora: nunca remove defaults de apresentação herdados, então a renderização permanece idêntica.',
          'A precisão numérica arredonda coordenadas; perda muito alta pode deslocar geometrias finas.',
          'A rasterização PNG usa o tamanho intrínseco do SVG (width/height ou viewBox); tamanhos só em % caem para viewBox ou 300×150.',
          'O código é limitado a 512 KB; arquivos maiores são rejeitados para manter o editor responsivo.',
          'O histórico de desfazer fica só em memória (nunca é salvo); reinicia ao sair da ferramenta.'
        ]
      }
    },
    mount, unmount
  };

  let alive = false;
  let state = {
    code: '', zoom: 'fit', bg: 'dark', pngScale: 2,
    opt: { comments: true, metadata: false, whitespace: true, empty: true, hex: true, precision: 3 },
    from: '#5FE6FF', to: '#F50F73'
  };
  let lastGood = '';
  let removedCount = 0;

  /* ---------- engine ---------- */

  function parseSVG(text) {
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const root = doc.documentElement;
    if (!root || root.localName === 'parsererror' || doc.querySelector('parsererror')) throw new Error('parse');
    if (root.localName.toLowerCase() !== 'svg') throw new Error('root');
    return doc;
  }
  const serialize = (root) => new XMLSerializer().serializeToString(root);

  function sanitizeCSS(css) {
    return String(css)
      .replace(/@import[^;]+;?/gi, '')
      .replace(/url\(\s*(['"]?)(?!#)[^)]*\)/gi, '')
      .replace(/expression\s*\(/gi, '(')
      .replace(/javascript:/gi, '')
      .replace(/behavior\s*:/gi, '')
      .replace(/-moz-binding\s*:[^;]+;?/gi, '');
  }

  function sanitize(text) {
    const doc = parseSVG(text);
    let removed = 0;
    (function walk(node) {
      const tag = node.localName.toLowerCase();
      if (BAD_TAGS.has(tag)) { removed++; node.remove(); return; }
      if (ANIM_TAGS.has(tag)) {
        const an = (node.getAttribute('attributeName') || '').toLowerCase();
        if (an === 'href' || an === 'xlink:href') { removed++; node.remove(); return; }
      }
      for (const attr of Array.from(node.attributes)) {
        const n = attr.name.toLowerCase(), v = attr.value;
        if (n.startsWith('on')) { node.removeAttribute(attr.name); removed++; continue; }
        if (n === 'href' || n === 'xlink:href') {
          const ok = v.startsWith('#') || (tag === 'image' && /^data:image\/(png|jpeg|jpg|gif|webp);/i.test(v));
          if (!ok) { node.removeAttribute(attr.name); removed++; }
          continue;
        }
        if (n === 'style') { const s = sanitizeCSS(v); if (s !== v) { node.setAttribute('style', s); removed++; } continue; }
        if (/javascript:/i.test(v) || /url\(\s*['"]?(?!#)/i.test(v)) { node.removeAttribute(attr.name); removed++; continue; }
      }
      if (tag === 'style') { const s = sanitizeCSS(node.textContent); if (s !== node.textContent) { node.textContent = s; removed++; } }
      for (const child of Array.from(node.children)) walk(child);
    })(doc.documentElement);
    return { code: serialize(doc.documentElement), removed };
  }

  function roundNumbers(root, p) {
    const re = /-?(?:\d+\.?\d*|\.\d+)/g;
    const fix = (v) => v.replace(re, (m) => String(parseFloat(Number(m).toFixed(p))));
    for (const el of [root, ...root.querySelectorAll('*')]) {
      for (const a of NUM_ATTRS) {
        const v = el.getAttribute(a);
        if (v != null && /\d/.test(v)) { const nv = fix(v); if (nv !== v) el.setAttribute(a, nv); }
      }
    }
  }
  function shortenHex(root) {
    const fix = (v) => v.replace(/#([0-9a-f]{6})\b/gi, (m, h) =>
      (h[0] === h[1] && h[2] === h[3] && h[4] === h[5]) ? '#' + h[0] + h[2] + h[4] : m);
    for (const el of [root, ...root.querySelectorAll('*')]) {
      for (const a of COLOR_ATTRS) { const v = el.getAttribute(a); if (v) { const nv = fix(v); if (nv !== v) el.setAttribute(a, nv); } }
      const s = el.getAttribute('style'); if (s) { const ns = fix(s); if (ns !== s) el.setAttribute('style', ns); }
    }
  }
  function collapseWhitespace(root) {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const kill = [];
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (!/^\s+$/.test(n.nodeValue)) continue;
      const p = n.parentElement;
      if (p && !TEXT_TAGS.has(p.localName.toLowerCase()) && p.children.length) kill.push(n);
    }
    kill.forEach((n) => n.remove());
  }
  function removeEmptyGroups(root) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const g of Array.from(root.querySelectorAll('g'))) {
        if (!g.children.length && !g.getAttribute('id')) { g.remove(); changed = true; }
      }
    }
  }
  function removeComments(root) {
    const walker = root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
    const kill = [];
    while (walker.nextNode()) kill.push(walker.currentNode);
    kill.forEach((n) => n.remove());
  }

  function optimize(code, o) {
    const root = parseSVG(code).documentElement;
    if (o.comments) removeComments(root);
    if (o.metadata) for (const n of Array.from(root.querySelectorAll('metadata,title,desc'))) n.remove();
    if (o.empty) removeEmptyGroups(root);
    if (o.hex) shortenHex(root);
    if (o.precision != null) roundNumbers(root, o.precision);
    if (o.whitespace) collapseWhitespace(root);
    return serialize(root);
  }

  function recolor(code, from, to) {
    const root = parseSVG(code).documentElement;
    const F = U.normalizeHex(from), T = U.normalizeHex(to);
    let n = 0;
    const swap = (v) => (U.normalizeHex(v) === F ? (n++, T) : v);
    for (const el of [root, ...root.querySelectorAll('*')]) {
      for (const a of COLOR_ATTRS) { const v = el.getAttribute(a); if (v) { const nv = swap(v); if (nv !== v) el.setAttribute(a, nv); } }
      const s = el.getAttribute('style');
      if (s) { const ns = s.replace(/(fill|stroke|stop-color|color)\s*:\s*([^;]+)/gi, (m, k, v) => k + ':' + swap(v.trim())); if (ns !== s) el.setAttribute('style', ns); }
    }
    return { code: serialize(root), n };
  }

  function naturalSize(root) {
    const vb = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
    const pw = root.getAttribute('width') || '', ph = root.getAttribute('height') || '';
    let w = /%$/.test(pw) ? NaN : parseFloat(pw);
    let h = /%$/.test(ph) ? NaN : parseFloat(ph);
    if (!Number.isFinite(w) || w <= 0) w = (vb.length === 4 && vb[2] > 0) ? vb[2] : 300;
    if (!Number.isFinite(h) || h <= 0) h = (vb.length === 4 && vb[3] > 0) ? vb[3] : 150;
    return { w, h };
  }

  function inspect(code) {
    const root = parseSVG(code).documentElement;
    const { w, h } = naturalSize(root);
    const els = root.querySelectorAll('*').length + 1;
    const paths = root.querySelectorAll('path').length;
    const grads = root.querySelectorAll('linearGradient,radialGradient').length;
    const colors = new Set();
    for (const el of [root, ...root.querySelectorAll('*')]) {
      for (const a of COLOR_ATTRS) {
        const v = el.getAttribute(a);
        const hx = v && U.normalizeHex(v);
        if (hx) colors.add(hx);
      }
    }
    const bytes = new Blob([code]).size;
    const optBytes = new Blob([optimize(code, state.opt)]).size;
    return { w, h, vb: root.getAttribute('viewBox') || '—', els, paths, grads, colors: [...colors], bytes, optBytes };
  }

  /* ---------- persistence ---------- */
  const KEY = 'svg-studio';
  function persist() {
    VT.store.set(KEY, { code: state.code, zoom: state.zoom, bg: state.bg, pngScale: state.pngScale, opt: state.opt, from: state.from, to: state.to });
  }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (typeof s.code === 'string') state.code = s.code.slice(0, MAX_CHARS);
    if (['fit', '100', '200'].includes(s.zoom)) state.zoom = s.zoom;
    if (['dark', 'light', 'checker'].includes(s.bg)) state.bg = s.bg;
    if ([1, 2, 4].includes(s.pngScale)) state.pngScale = s.pngScale;
    if (s.opt && typeof s.opt === 'object') {
      for (const k of ['comments', 'metadata', 'whitespace', 'empty', 'hex']) if (typeof s.opt[k] === 'boolean') state.opt[k] = s.opt[k];
      const p = Number(s.opt.precision);
      if (Number.isInteger(p) && p >= 0 && p <= 4) state.opt.precision = p;
    }
    state.from = U.normalizeHex(s.from) || state.from;
    state.to = U.normalizeHex(s.to) || state.to;
  }

  /* ---------- render ---------- */
  let refs = {};
  let hist = null;
  let sourceError = '';
  function syncHist() {
    const u = refs.undo, r = refs.redo;
    if (u) u.disabled = !hist || !hist.canUndo();
    if (r) r.disabled = !hist || !hist.canRedo();
  }
  function render() {
    if (!alive) return;
    if (sourceError) { refs.err.textContent = sourceError; setExportEnabled(false); return; }
    const code = state.code;
    const has = !!code;
    refs.empty.hidden = has;
    refs.canvas.hidden = !has;
    refs.err.textContent = '';
    refs.count.textContent = t('sv.count', { n: code.length });

    if (!has) { refs.insp.hidden = true; refs.colorsBox.hidden = true; setExportEnabled(false); return; }

    let info;
    try { info = inspect(code); } catch { refs.err.textContent = t('sv.err.parse'); setExportEnabled(false); return; }
    lastGood = code;
    setExportEnabled(true);

    // preview
    refs.canvas.innerHTML = code;
    const svg = refs.canvas.querySelector('svg');
    if (svg) {
      const { w } = naturalSize(svg);
      svg.style.display = 'block'; svg.style.margin = '0 auto';
      if (state.zoom === 'fit') { svg.style.width = '100%'; svg.style.height = 'auto'; svg.style.maxHeight = '420px'; }
      else { svg.style.width = (state.zoom === '200' ? w * 2 : w) + 'px'; svg.style.height = 'auto'; }
    }
    refs.canvas.dataset.bg = state.bg;

    // inspector
    refs.insp.hidden = false;
    refs.w.textContent = info.w + ' px'; refs.h.textContent = info.h + ' px';
    refs.vb.textContent = info.vb; refs.nodes.textContent = info.els;
    refs.paths.textContent = info.paths; refs.grads.textContent = info.grads;
    refs.bytes.textContent = U.formatBytes(info.bytes);
    refs.opt.textContent = U.formatBytes(info.optBytes);
    const saved = info.bytes > 0 ? Math.max(0, Math.round((1 - info.optBytes / info.bytes) * 100)) : 0;
    refs.saved.textContent = saved + '%';
    refs.sanitized.hidden = removedCount === 0;
    refs.sanitized.textContent = t('sv.sanitized', { n: removedCount });

    // palette
    refs.colorsBox.hidden = false;
    if (!info.colors.length) { refs.colors.innerHTML = '<p class="hint">' + esc(t('sv.nocolors')) + '</p>'; }
    else {
      refs.colors.innerHTML = info.colors.map((c) =>
        '<button class="sv-chip" data-color="' + c + '" aria-pressed="' + (c === state.from) + '">' +
        '<span class="sv-sw" style="background:' + c + '"></span>' + c + '</button>').join('');
    }
    refs.from.value = state.from; refs.fromHex.value = state.from;
    refs.to.value = state.to; refs.toHex.value = state.to;
  }

  function setExportEnabled(on) {
    for (const b of [refs.copy, refs.dlsvg, refs.dlpng]) b.disabled = !on;
  }

  function setCode(code, opts = {}) {
    if (code.length > MAX_CHARS) { sourceError = t('sv.err.big'); render(); toast(sourceError, 'error'); return false; }
    let clean;
    try { clean = sanitize(code); }
    catch (e) { sourceError = t(e.message === 'root' ? 'sv.err.root' : 'sv.err.parse'); render(); return false; }
    sourceError = '';
    state.code = clean.code;
    removedCount = clean.removed;
    if (opts.syncTextarea !== false) refs.code.value = clean.code;
    if (opts.notify && clean.removed > 0) toast(t('sv.sanitized', { n: clean.removed }), 'warn');
    render(); persist();
    return true;
  }

  /* ---------- mount ---------- */
  function mount(root) {
    alive = true;
    sourceError = '';
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="sv-layout">
        <div class="sv-left">
          <section class="sv-stage glass-2">
            <div class="sv-bar">
              <div class="field fixed" id="sv-zoom-field"><label id="sv-zoom-l">${t('sv.zoom')}</label>
                <div class="tabs" role="tablist" aria-labelledby="sv-zoom-l" id="sv-zoom">
                  <button class="tab" role="tab" data-tab="fit" aria-selected="${state.zoom === 'fit'}">${t('sv.fit')}</button>
                  <button class="tab" role="tab" data-tab="100" aria-selected="${state.zoom === '100'}">100%</button>
                  <button class="tab" role="tab" data-tab="200" aria-selected="${state.zoom === '200'}">200%</button>
                </div>
              </div>
              <div class="field fixed" id="sv-bg-field"><label id="sv-bg-l">${t('sv.bg')}</label>
                <div class="tabs" role="tablist" aria-labelledby="sv-bg-l" id="sv-bg">
                  <button class="tab" role="tab" data-tab="dark" aria-selected="${state.bg === 'dark'}">${t('sv.dark')}</button>
                  <button class="tab" role="tab" data-tab="light" aria-selected="${state.bg === 'light'}">${t('sv.light')}</button>
                  <button class="tab" role="tab" data-tab="checker" aria-selected="${state.bg === 'checker'}">${t('sv.checker')}</button>
                </div>
              </div>
            </div>
            <div class="sv-canvas" id="sv-canvas" data-bg="${state.bg}"></div>
            <div class="empty" id="sv-empty">${I.layers}<strong>${t('sv.emptyTitle')}</strong>${t('sv.empty')}</div>
            <p class="privacy-line">${I.shield} ${t('sv.privacy')}</p>
          </section>
          <section class="step glass sv-insp" id="sv-insp" hidden>
            <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('sv.inspect')}</h3></div>
            <p class="hint" id="sv-sanitized" hidden></p>
            <dl class="sv-metrics">
              <div><dt>${t('sv.width')}</dt><dd id="sv-w">—</dd></div>
              <div><dt>${t('sv.height')}</dt><dd id="sv-h">—</dd></div>
              <div><dt>${t('sv.viewbox')}</dt><dd id="sv-vb">—</dd></div>
              <div><dt>${t('sv.nodes')}</dt><dd id="sv-nodes">—</dd></div>
              <div><dt>${t('sv.paths')}</dt><dd id="sv-paths">—</dd></div>
              <div><dt>${t('sv.gradients')}</dt><dd id="sv-grads">—</dd></div>
              <div><dt>${t('sv.size')}</dt><dd id="sv-bytes">—</dd></div>
              <div><dt>${t('sv.optimized')}</dt><dd id="sv-opt">—</dd></div>
              <div><dt>${t('sv.saved')}</dt><dd id="sv-saved">—</dd></div>
            </dl>
          </section>
          <section class="step glass" id="sv-colorsbox" hidden>
            <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('sv.colors')}</h3></div>
            <div class="sv-colors" id="sv-colors"></div>
            <div class="field-row k-row">
              <div class="field fixed"><label for="sv-from">${t('sv.from')}</label><input type="color" class="input" id="sv-from"></div>
              <div class="field"><label for="sv-from-hex">HEX</label><input class="input mono" id="sv-from-hex" maxlength="7"></div>
              <div class="field fixed"><label for="sv-to">${t('sv.to')}</label><input type="color" class="input" id="sv-to"></div>
              <div class="field"><label for="sv-to-hex">HEX</label><input class="input mono" id="sv-to-hex" maxlength="7"></div>
              <div class="field fixed"><label>&nbsp;</label><button class="btn btn-aqua" id="sv-recolor">${I.swap} ${t('sv.apply')}</button></div>
            </div>
          </section>
        </div>
        <div class="sv-controls">
          <section class="step glass">
            <div class="step-head"><span class="step-num">03</span><h3 class="step-title">${t('sv.source')}</h3></div>
            <div class="dropzone" id="sv-drop" tabindex="0" role="button" aria-label="${t('sv.drop')}">
              <span class="orb orb-sm">${I.upload}</span>
              <strong>${t('sv.drop')}</strong><span>${t('sv.dropHint')}</span>
            </div>
            <input type="file" id="sv-file" accept=".svg,image/svg+xml" hidden>
            <div class="field"><label for="sv-code">${t('sv.code')}</label>
              <textarea class="input mono sv-code" id="sv-code" spellcheck="false" rows="10"></textarea>
            </div>
            <p class="hint" id="sv-err" role="alert"></p>
            <div class="sv-srcmeta"><span class="hint" id="sv-count"></span>
              <button class="btn btn-ghost btn-sm" id="sv-clear">${I.x} ${t('sv.clear')}</button>
              <span class="sv-actions-sep" aria-hidden="true"></span>
              <button class="btn btn-ghost btn-sm" id="sv-undo" data-tip="${t('hist.undo.tip')}" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
              <button class="btn btn-ghost btn-sm" id="sv-redo" data-tip="${t('hist.redo.tip')}" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button></div>
            <div class="field"><label>${t('sv.samples')}</label>
              <div class="chips sv-samples">
                <button class="chip" data-sample="mark">${t('sv.sample.mark')}</button>
                <button class="chip" data-sample="chart">${t('sv.sample.chart')}</button>
                <button class="chip" data-sample="icon">${t('sv.sample.icon')}</button>
              </div>
            </div>
          </section>
          <section class="step glass">
            <div class="step-head"><span class="step-num">04</span><h3 class="step-title">${t('sv.optimize')}</h3></div>
            <label class="check-row"><input type="checkbox" id="sv-o-comments">${t('sv.opt.comments')}</label>
            <label class="check-row"><input type="checkbox" id="sv-o-metadata">${t('sv.opt.metadata')}</label>
            <label class="check-row"><input type="checkbox" id="sv-o-whitespace">${t('sv.opt.whitespace')}</label>
            <label class="check-row"><input type="checkbox" id="sv-o-empty">${t('sv.opt.empty')}</label>
            <label class="check-row"><input type="checkbox" id="sv-o-hex">${t('sv.opt.hex')}</label>
            <div class="field"><label for="sv-o-precision">${t('sv.opt.precision')}</label>
              <select class="input" id="sv-o-precision">
                <option value="0">0</option><option value="1">1</option><option value="2">2</option>
                <option value="3">3</option><option value="4">4</option>
              </select>
            </div>
            <button class="btn btn-primary" id="sv-optimize">${I.wand} ${t('sv.opt.apply')}</button>
          </section>
          <section class="step glass">
            <div class="step-head"><span class="step-num">05</span><h3 class="step-title">${t('sv.export')}</h3></div>
            <div class="export-row">
              <button class="btn" id="sv-copy">${I.copy} ${t('sv.copy')}</button>
              <button class="btn" id="sv-dlsvg">${I.download} ${t('sv.svg')}</button>
            </div>
            <div class="field-row">
              <div class="field"><label for="sv-pngscale">${t('sv.pngscale')}</label>
                <select class="input" id="sv-pngscale"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select>
              </div>
              <div class="field"><label>&nbsp;</label><button class="btn btn-aqua" id="sv-dlpng">${I.image} ${t('sv.png')}</button></div>
            </div>
          </section>
        </div>
      </div>`;

    refs = {
      canvas: $('#sv-canvas', root), empty: $('#sv-empty', root), err: $('#sv-err', root),
      count: $('#sv-count', root), code: $('#sv-code', root), insp: $('#sv-insp', root),
      sanitized: $('#sv-sanitized', root), colorsBox: $('#sv-colorsbox', root), colors: $('#sv-colors', root),
      w: $('#sv-w', root), h: $('#sv-h', root), vb: $('#sv-vb', root), nodes: $('#sv-nodes', root),
      paths: $('#sv-paths', root), grads: $('#sv-grads', root), bytes: $('#sv-bytes', root),
      opt: $('#sv-opt', root), saved: $('#sv-saved', root),
      from: $('#sv-from', root), fromHex: $('#sv-from-hex', root), to: $('#sv-to', root), toHex: $('#sv-to-hex', root),
      copy: $('#sv-copy', root), dlsvg: $('#sv-dlsvg', root), dlpng: $('#sv-dlpng', root),
      drop: $('#sv-drop', root), file: $('#sv-file', root),
      undo: $('#sv-undo', root), redo: $('#sv-redo', root)
    };

    // tabs (one instance per tablist)
    VT.ui.tabs($('#sv-zoom-field', root), (id) => { state.zoom = id; render(); persist(); });
    VT.ui.tabs($('#sv-bg-field', root), (id) => { state.bg = id; render(); persist(); });

    // source
    refs.code.value = state.code;
    hist = VT.history.create({ apply: (val) => { refs.code.value = val; setCode(val, { syncTextarea: false }); syncHist(); } });
    hist.reset(refs.code.value);
    const recordSoon = U.debounce(() => { hist.record(refs.code.value); syncHist(); }, 500);
    const onInput = U.debounce(() => { setCode(refs.code.value, { syncTextarea: false }); }, 250);
    refs.code.addEventListener('input', () => { onInput(); recordSoon(); });
    refs.code.addEventListener('keydown', (e) => { hist.onKey(e); syncHist(); });
    $('#sv-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); refs.code.focus(); });
    $('#sv-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); refs.code.focus(); });
    $('#sv-clear', root).addEventListener('click', () => { sourceError = ''; state.code = ''; removedCount = 0; refs.code.value = ''; render(); persist(); hist.record(''); syncHist(); });
    $$('.sv-samples .chip', root).forEach((b) => b.addEventListener('click', () => { setCode(SAMPLES[b.dataset.sample], { notify: true }); }));

    // dropzone
    const openPick = () => refs.file.click();
    refs.drop.addEventListener('click', openPick);
    refs.drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPick(); } });
    ['dragenter', 'dragover'].forEach((ev) => refs.drop.addEventListener(ev, (e) => { e.preventDefault(); refs.drop.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((ev) => refs.drop.addEventListener(ev, (e) => { e.preventDefault(); refs.drop.classList.remove('dragover'); }));
    refs.drop.addEventListener('drop', (e) => { const f = e.dataTransfer && e.dataTransfer.files[0]; if (f) loadFile(f); });
    refs.file.addEventListener('change', () => { const f = refs.file.files[0]; if (f) loadFile(f); refs.file.value = ''; });

    // optimize controls
    const optMap = { 'sv-o-comments': 'comments', 'sv-o-metadata': 'metadata', 'sv-o-whitespace': 'whitespace', 'sv-o-empty': 'empty', 'sv-o-hex': 'hex' };
    for (const [id, k] of Object.entries(optMap)) {
      const el = $('#' + id, root);
      el.checked = state.opt[k];
      el.addEventListener('change', () => { state.opt[k] = el.checked; render(); persist(); });
    }
    const prec = $('#sv-o-precision', root);
    prec.value = String(state.opt.precision);
    prec.addEventListener('change', () => { state.opt.precision = Number(prec.value); render(); persist(); });
    $('#sv-optimize', root).addEventListener('click', () => {
      if (sourceError || !state.code) return;
      const before = new Blob([state.code]).size;
      const out = optimize(state.code, state.opt);
      const after = new Blob([out]).size;
      state.code = out; refs.code.value = out; removedCount = 0;
      render(); persist(); hist.record(out); syncHist();
      const p = before > 0 ? Math.max(0, Math.round((1 - after / before) * 100)) : 0;
      toast(t('sv.opt.done', { a: U.formatBytes(before), b: U.formatBytes(after), p }), 'success');
    });

    // recolor
    const bindColor = (pick, hex, key) => {
      pick.addEventListener('input', () => { state[key] = pick.value.toUpperCase(); hex.value = state[key]; render(); persist(); });
      hex.addEventListener('change', () => {
        const v = U.normalizeHex(hex.value);
        if (!v) { toast(t('fp.invalid'), 'error'); hex.value = state[key]; return; }
        state[key] = v; pick.value = v; hex.value = v; render(); persist();
      });
    };
    bindColor(refs.from, refs.fromHex, 'from');
    bindColor(refs.to, refs.toHex, 'to');
    refs.colors.addEventListener('click', (e) => {
      const b = e.target.closest('.sv-chip'); if (!b) return;
      state.from = b.dataset.color; render(); persist();
    });
    $('#sv-recolor', root).addEventListener('click', () => {
      if (sourceError || !state.code) return;
      const r = recolor(state.code, state.from, state.to);
      if (!r.n) { toast(t('sv.recolor.none'), 'warn'); return; }
      state.code = r.code; refs.code.value = r.code;
      render(); persist(); hist.record(r.code); syncHist();
      toast(t('sv.recolored', { n: r.n }), 'success');
    });

    // export
    refs.copy.addEventListener('click', async () => {
      const ok = await U.copyText(state.code);
      toast(t(ok ? 'sv.copied' : 'sv.copyfail'), ok ? 'success' : 'error');
    });
    refs.dlsvg.addEventListener('click', () => { U.downloadText(state.code, 'vistanology-svg.svg', 'image/svg+xml'); });
    const scale = $('#sv-pngscale', root);
    scale.value = String(state.pngScale);
    scale.addEventListener('change', () => { state.pngScale = Number(scale.value); persist(); });
    refs.dlpng.addEventListener('click', exportPNG);

    render();
    syncHist();
    return () => { alive = false; };
  }

  async function loadFile(f) {
    if (!/\.svg$/i.test(f.name) && f.type !== 'image/svg+xml') { toast(t('sv.loadfail', { name: f.name }), 'error'); return; }
    if (f.size > MAX_CHARS) { toast(t('sv.err.big'), 'error'); return; }
    try {
      const text = await f.text();
      if (setCode(text, { notify: true })) { if (hist) hist.record(refs.code.value); syncHist(); toast(t('sv.loaded', { name: f.name }), 'success'); }
    } catch { toast(t('sv.loadfail', { name: f.name }), 'error'); }
  }

  async function exportPNG() {
    if (!state.code) return;
    try {
      const root = parseSVG(state.code).documentElement;
      const { w, h } = naturalSize(root);
      const s = state.pngScale;
      const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(state.code);
      const img = await U.loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(w * s)); canvas.height = Math.max(1, Math.round(h * s));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('blob');
      U.downloadBlob(blob, 'vistanology-svg-' + s + 'x.png');
      toast(t('sv.pngok'), 'success');
    } catch { toast(t('sv.pngfail'), 'error'); }
  }

  function unmount() { alive = false; hist = null; }

  VT.registry.add(def);
  return def;
})();