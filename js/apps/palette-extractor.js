window.VT = window.VT || {};
VT.modules = VT.modules || {};

/* Palette Extractor — median cut over pixels the browser sampled locally.
   The algorithm is written to be provable rather than plausible: _dev/probe-palette.js
   loads medianCut() out of this file and checks it against hand-computed cases
   (flat quadrants return exactly those colours, populations sum to the sample,
   every box is contiguous in the channel it was split on, k=1 is the mean), and
   the sample image is four flat quadrants so the browser harness can assert the
   exact hexes and the exact 25 % shares instead of "looks close".
   Nothing here is uploaded: the file is decoded by the browser, read once through
   a canvas, and only the resulting numbers stay in memory.
*/
VT.modules['palette-extractor'] = (() => {
  const U = VT.utils;
  const { $, $$, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;
  const I = VT.icons;

  VT.i18n.add({
    en: {
      'pe.source': 'Image', 'pe.drop': 'Drop an image or click to browse',
      'pe.dropHint': 'PNG, JPEG, WebP, GIF or BMP — read in memory, never uploaded',
      'pe.sample': 'Use sample', 'pe.clear': 'Remove', 'pe.badType': 'Unsupported file: choose a raster image.',
      'pe.badDecode': 'Could not decode this image.',
      'pe.empty': 'Nothing to sample: this image has no visible pixels.',
      'pe.from': 'From', 'pe.dims': 'Dimensions', 'pe.fileSize': 'File size', 'pe.mime': 'Type',
      'pe.extract': 'Extract', 'pe.k': 'Colours requested', 'pe.res': 'Sampling resolution',
      'pe.resHint': 'The long edge is scaled to this many pixels before sampling; the sample image is 200 px and needs no scaling.',
      'pe.sort': 'Order', 'pe.sortPop': 'By share', 'pe.sortLum': 'By lightness', 'pe.sortHue': 'By hue',
      'pe.alpha': 'Skip transparent pixels', 'pe.wait': 'Drop an image or press Use sample to extract a palette.',
      'pe.done': '{n} colours from {p} sampled pixels', 'pe.doneSkip': '{n} colours from {p} sampled pixels, {s} transparent skipped',
      'pe.palette': 'Palette', 'pe.share': 'Share', 'pe.copyHex': 'Click a swatch to copy its hex',
      'pe.summary': 'Reading', 'pe.s.requested': 'Requested / returned', 'pe.s.sampled': 'Sampled pixels',
      'pe.s.skipped': 'Transparent skipped', 'pe.s.lightest': 'Lightest', 'pe.s.darkest': 'Darkest',
      'pe.s.greys': 'Near-grey', 'pe.s.dominant': 'Dominant hue', 'pe.s.mean': 'Mean luminance',
      'pe.none': 'no hue (achromatic)', 'pe.contrast': 'Contrast between the palette colours',
      'pe.cHint': 'Ratios are WCAG relative luminance. 4.5:1 carries normal text, 3:1 carries large text only.',
      'pe.cTop': 'The six leading colours, strongest pair first.',
      'pe.cAa': 'AA text', 'pe.cLarge': 'AA large', 'pe.cFail': 'not readable', 'pe.cVs': 'Pair',
      'pe.export': 'Export', 'pe.css': 'CSS custom properties', 'pe.copycss': 'Copy CSS',
      'pe.dlcss': 'Download CSS', 'pe.dljson': 'Download JSON', 'pe.dlhex': 'Download hex list',
      'pe.copied': 'Copied', 'pe.copyFail': 'Copy failed', 'pe.downloaded': 'File downloaded',
      'pe.needImage': 'Extract a palette first.', 'pe.privacy': 'The image is decoded and read in memory only. Nothing is uploaded, and no image data is stored — only the four settings on this bench.'
    },
    pt: {
      'pe.source': 'Imagem', 'pe.drop': 'Solte uma imagem ou clique para escolher',
      'pe.dropHint': 'PNG, JPEG, WebP, GIF ou BMP — lida em memória, nunca enviada',
      'pe.sample': 'Usar exemplo', 'pe.clear': 'Remover', 'pe.badType': 'Arquivo não suportado: escolha uma imagem raster.',
      'pe.badDecode': 'Não foi possível decodificar esta imagem.',
      'pe.empty': 'Nada para amostrar: esta imagem não tem pixels visíveis.',
      'pe.from': 'De', 'pe.dims': 'Dimensões', 'pe.fileSize': 'Tamanho', 'pe.mime': 'Tipo',
      'pe.extract': 'Extrair', 'pe.k': 'Cores pedidas', 'pe.res': 'Resolução da amostra',
      'pe.resHint': 'O lado maior é reduzido a estes pixels antes da amostragem; a imagem de exemplo tem 200 px e não precisa de redução.',
      'pe.sort': 'Ordem', 'pe.sortPop': 'Por participação', 'pe.sortLum': 'Por brilho', 'pe.sortHue': 'Por matiz',
      'pe.alpha': 'Ignorar pixels transparentes', 'pe.wait': 'Solte uma imagem ou use o exemplo para extrair uma paleta.',
      'pe.done': '{n} cores a partir de {p} pixels amostrados', 'pe.doneSkip': '{n} cores a partir de {p} pixels amostrados, {s} transparentes ignorados',
      'pe.palette': 'Paleta', 'pe.share': 'Participação', 'pe.copyHex': 'Clique numa amostra para copiar o hex',
      'pe.summary': 'Leitura', 'pe.s.requested': 'Pedidas / retornadas', 'pe.s.sampled': 'Pixels amostrados',
      'pe.s.skipped': 'Transparentes ignorados', 'pe.s.lightest': 'Mais clara', 'pe.s.darkest': 'Mais escura',
      'pe.s.greys': 'Quase cinza', 'pe.s.dominant': 'Matiz dominante', 'pe.s.mean': 'Luminância média',
      'pe.none': 'sem matiz (acromática)', 'pe.contrast': 'Contraste entre as cores da paleta',
      'pe.cHint': 'As razões usam a luminância relativa da WCAG. 4,5:1 sustenta texto normal; 3:1 só texto grande.',
      'pe.cTop': 'As seis cores principais, do par mais forte para o mais fraco.',
      'pe.cAa': 'texto AA', 'pe.cLarge': 'AA grande', 'pe.cFail': 'ilegível', 'pe.cVs': 'Par',
      'pe.export': 'Exportar', 'pe.css': 'Propriedades customizadas CSS', 'pe.copycss': 'Copiar CSS',
      'pe.dlcss': 'Baixar CSS', 'pe.dljson': 'Baixar JSON', 'pe.dlhex': 'Baixar lista de hex',
      'pe.copied': 'Copiado', 'pe.copyFail': 'Falha ao copiar', 'pe.downloaded': 'Arquivo baixado',
      'pe.needImage': 'Extraia uma paleta primeiro.', 'pe.privacy': 'A imagem é decodificada e lida apenas em memória. Nada é enviado e nenhum dado de imagem é guardado — só os quatro ajustes desta bancada.'
    }
  });

  const def = {
    id: 'palette-extractor', cat: 'creative', icon: 'palette', version: '1.0.0',
    name: { en: 'Palette Extractor', pt: 'Extrator de Paleta' },
    tagline: {
      en: 'Read an image locally and get its real palette: median-cut colours with their share of the pixels, contrast between them, and CSS or JSON you can drop straight into a stylesheet.',
      pt: 'Leia uma imagem localmente e receba sua paleta real: cores por median cut com a participação em pixels, o contraste entre elas e CSS ou JSON prontos para a folha de estilo.'
    },
    tags: ['image', 'palette', 'color', 'contrast', 'design tokens', 'median cut', 'css'],
    deps: [],
    docs: {
      en: {
        summary: 'Median cut over the pixels the browser sampled: the image is decoded locally, scaled so its long edge fits the sampling resolution, read once through getImageData, and split along its widest colour channel until the requested number of boxes is reached. Each box reports the mean colour of the pixels it holds and the share of the sample those pixels represent, so a colour that covers 3 % of the image is reported as 3 % rather than promoted next to the dominant one. Identical hexes are merged, near-grey colours are counted, and every pair is measured with the WCAG relative-luminance formula so you can see which combinations actually carry text.',
        usage: [
          'Drop an image or press Use sample — the sample is four flat 100 × 100 quadrants, so its palette is exactly those four colours at 25 % each.',
          'Set how many colours you want (2–16) and the sampling resolution; the status line reports the colours returned and the pixels actually sampled.',
          'Order the palette by share, lightness or hue, and click a swatch to copy its hex.',
          'Read the summary: requested versus returned, sampled and skipped pixels, lightest and darkest colour, near-grey count, dominant hue and mean luminance.',
          'Check the contrast table before using two palette colours together — 4.5:1 carries normal text, 3:1 only large text.',
          'Copy the CSS custom properties block, or download CSS, JSON or a plain hex list.'
        ],
        privacy: 'The file is read as bytes in memory, decoded by the browser and sampled through a canvas; nothing is uploaded, no pixel data is written to IndexedDB, and the only localStorage value is the four settings (colour count, resolution, order, transparent-pixel switch). The image itself disappears when the view unmounts.',
        limits: [
          'Median cut is a fast, deterministic approximation, not a perceptual colour model: it splits by channel range, so a photograph can return several near-identical blues and miss a small but meaningful colour. The merge step folds exact duplicates only.',
          'The reported share belongs to the sampled grid, not to the original image: scaling to the sampling resolution averages neighbouring pixels, so thin lines and hard edges are under-represented. Raise the resolution to check a detail.',
          'Transparency is skipped by default, which is what a designer usually wants; switch it off and fully transparent pixels join the sample as their stored RGB, which is usually black and will pull the palette dark.',
          'Contrast is computed for the sRGB values as given. It says nothing about the background the colour will sit on in your interface, about images behind text, or about how the palette looks to a colour-blind viewer.'
        ]
      },
      pt: {
        summary: 'Median cut sobre os pixels que o navegador amostrou: a imagem é decodificada localmente, reduzida para que o lado maior caiba na resolução da amostra, lida uma vez via getImageData e dividida pelo canal de cor de maior amplitude até chegar ao número de caixas pedido. Cada caixa informa a cor média dos pixels que contém e a participação desses pixels na amostra, de modo que uma cor presente em 3 % da imagem é reportada como 3 %, não colocada ao lado da dominante. Hexadecimais idênticos são unidos, quase-cinzas são contados e cada par é medido pela fórmula de luminância relativa da WCAG para você ver quais combinações realmente sustentam texto.',
        usage: [
          'Solte uma imagem ou pressione Usar exemplo — o exemplo são quatro quadrantes planos de 100 × 100, então a paleta é exatamente essas quatro cores a 25 % cada.',
          'Defina quantas cores quer (2–16) e a resolução da amostra; a linha de estado informa as cores retornadas e os pixels realmente amostrados.',
          'Ordene por participação, brilho ou matiz e clique numa amostra para copiar o hex.',
          'Leia o resumo: pedidas versus retornadas, pixels amostrados e ignorados, cor mais clara e mais escura, quantidade de quase-cinza, matiz dominante e luminância média.',
          'Confira a tabela de contraste antes de usar duas cores da paleta juntas — 4,5:1 sustenta texto normal; 3:1 só texto grande.',
          'Copie o bloco de propriedades customizadas CSS ou baixe CSS, JSON ou uma lista simples de hex.'
        ],
        privacy: 'O arquivo é lido como bytes em memória, decodificado pelo navegador e amostrado por um canvas; nada é enviado, nenhum dado de imagem vai para o IndexedDB e o único valor no localStorage são os quatro ajustes (número de cores, resolução, ordem, ignorar transparência). A imagem desaparece quando a view é desmontada.',
        limits: [
          'Median cut é uma aproximação rápida e determinística, não um modelo perceptual de cor: ele divide por amplitude de canal, então uma fotografia pode retornar vários azuis quase idênticos e perder uma cor pequena mas significativa. A união só dobra duplicatas exatas.',
          'A participação informada pertence à grade amostrada, não à imagem original: reduzir à resolução da amostra média pixels vizinhos, então linhas finas e bordas duras ficam subrepresentadas. Aumente a resolução para conferir um detalhe.',
          'A transparência é ignorada por padrão, o que designers normalmente querem; desligue e pixels totalmente transparentes entram com o RGB armazenado, geralmente preto, e puxam a paleta para escuro.',
          'O contraste usa os valores sRGB como estão. Nada diz sobre o fundo que a cor terá na sua interface, sobre imagens atrás de texto ou sobre como a paleta parece a uma pessoa daltônica.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'palette-extractor';
  // The sample is four flat quadrants: a palette whose answer is known exactly.
  const SAMPLE_QUADRANTS = ['#026DA7', '#7ED321', '#F5A623', '#4A235A'];
  const SAMPLE_SIDE = 200;

  let state = { k: 8, res: 220, sort: 'pop', skipAlpha: true };
  let refs = {};
  let src = null;   // { img, size, mime, name } — memory only, dropped on unmount
  let result = null;
  let alive = true;

  function persist() { VT.store.set(KEY, state); }

  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (Number.isFinite(s.k)) state.k = U.clamp(Math.round(s.k), 2, 16);
    if (Number.isFinite(s.res)) state.res = U.clamp(Math.round(s.res), 60, 400);
    if (['pop', 'lum', 'hue'].includes(s.sort)) state.sort = s.sort;
    if (typeof s.skipAlpha === 'boolean') state.skipAlpha = s.skipAlpha;
  }

  /* ---------------- algorithm ---------------- */

  function channelRange(box) {
    let lo = [255, 255, 255], hi = [0, 0, 0];
    for (const p of box) for (let c = 0; c < 3; c++) {
      if (p[c] < lo[c]) lo[c] = p[c];
      if (p[c] > hi[c]) hi[c] = p[c];
    }
    return { r: hi[0] - lo[0], g: hi[1] - lo[1], b: hi[2] - lo[2] };
  }

  // Deterministic: the sort tie-breaks on the other channels, so the same pixels
  // always produce the same palette, which is what makes the probe meaningful.
  function cmpChannel(ch) {
    return (a, b) => a[ch] - b[ch] || a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
  }

  // The cut has to land between two different colours. Splitting purely at half
  // the count bisects a long run — three flat 10 000 px colours then yield a mean
  // like #AA5500, a colour the image never contained — so the halfway index moves
  // to the nearest real boundary, forwards first so the choice stays deterministic.
  function cutPoint(sorted, cmp) {
    const n = sorted.length, mid = n >> 1;
    for (let d = 0; d < n; d++) {
      const hi = mid + d;
      if (hi >= 1 && hi < n && cmp(sorted[hi - 1], sorted[hi]) !== 0) return hi;
      const lo = mid - d;
      if (lo > 0 && lo < n && cmp(sorted[lo - 1], sorted[lo]) !== 0) return lo;
    }
    return mid;
  }

  function medianCut(pixels, k) {
    if (!pixels.length) return [];
    let boxes = [pixels];
    while (boxes.length < k) {
      let best = -1, bestRange = 0, bestCh = 0;
      for (let i = 0; i < boxes.length; i++) {
        if (boxes[i].length < 2) continue;
        const rg = channelRange(boxes[i]);
        const m = Math.max(rg.r, rg.g, rg.b);
        if (m > bestRange) { bestRange = m; best = i; bestCh = rg.r === m ? 0 : rg.g === m ? 1 : 2; }
      }
      if (best < 0 || bestRange === 0) break; // every box is already flat: no more real splits
      const sorted = boxes[best].slice().sort(cmpChannel(bestCh));
      const cmp = cmpChannel(bestCh);
      const mid = cutPoint(sorted, cmp);
      boxes.splice(best, 1, sorted.slice(0, mid), sorted.slice(mid));
    }
    return boxes.filter((b) => b.length).map((b) => {
      let r = 0, g = 0, bl = 0;
      for (const p of b) { r += p[0]; g += p[1]; bl += p[2]; }
      return { rgb: [Math.round(r / b.length), Math.round(g / b.length), Math.round(bl / b.length)], n: b.length };
    });
  }

  function samplePixels(img, res, skipAlpha) {
    const scale = Math.min(1, res / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data;
    const px = [];
    let skipped = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (skipAlpha && d[i + 3] === 0) { skipped++; continue; }
      px.push([d[i], d[i + 1], d[i + 2]]);
    }
    return { px, w, h, skipped, grid: w * h };
  }

  function buildPalette(img) {
    const smp = samplePixels(img, state.res, state.skipAlpha);
    if (!smp.px.length) return { error: 'empty' };
    const cut = medianCut(smp.px, state.k);
    // Fold exact duplicates: median cut can hand back the same mean twice when a
    // box splits along a channel the colours do not differ in.
    const byHex = new Map();
    for (const c of cut) {
      const hex = U.rgbToHex(c.rgb[0], c.rgb[1], c.rgb[2]).toUpperCase();
      const prev = byHex.get(hex);
      if (prev) prev.n += c.n; else byHex.set(hex, { hex, rgb: c.rgb, n: c.n });
    }
    const total = smp.px.length;
    const colors = [...byHex.values()].map((c) => {
      const hsl = U.rgbToHsl(c.rgb[0], c.rgb[1], c.rgb[2]);
      return {
        hex: c.hex, rgb: c.rgb, n: c.n, share: c.n / total,
        h: hsl.h, s: hsl.s, l: hsl.l,
        lum: U.luminance(c.hex),
        onWhite: U.contrast(c.hex, '#FFFFFF'),
        onBlack: U.contrast(c.hex, '#000000')
      };
    });
    const order = {
      pop: (a, b) => b.n - a.n || a.hex.localeCompare(b.hex),
      lum: (a, b) => b.lum - a.lum || a.hex.localeCompare(b.hex),
      hue: (a, b) => a.h - b.h || b.s - a.s || a.hex.localeCompare(b.hex)
    };
    colors.sort(order[state.sort] || order.pop);
    return { colors, sampled: total, skipped: smp.skipped, grid: smp.grid, w: smp.w, h: smp.h };
  }

  /* ---------------- export ---------------- */

  function cssBlock(colors) {
    const lines = colors.map((c, i) => '  --palette-' + (i + 1) + ': ' + c.hex.toLowerCase() +
      '; /* ' + (c.share * 100).toFixed(1) + '% of sampled pixels */');
    return ':root {\n' + lines.join('\n') + '\n}\n';
  }

  function jsonBlock(res) {
    return JSON.stringify({
      tool: 'Vistanology Open — Palette Extractor',
      algorithm: 'median cut',
      sampling: { grid: res.w + 'x' + res.h, requested: state.k, returned: res.colors.length, sampledPixels: res.sampled, transparentSkipped: res.skipped },
      colors: res.colors.map((c) => ({
        hex: c.hex.toLowerCase(), rgb: c.rgb, hsl: [c.h, c.s, c.l],
        share: +(c.share * 100).toFixed(2),
        contrast: { onWhite: +fmtRatio(c.onWhite), onBlack: +fmtRatio(c.onBlack) }
      }))
    }, null, 2) + '\n';
  }

  function hexList(colors) { return colors.map((c) => c.hex.toLowerCase()).join('\n') + '\n'; }

  // Contrast is truncated, never rounded up: "3.00:1" next to a "not readable"
  // badge would claim a threshold the true 2.995 does not clear.
  const fmtRatio = (v) => (Math.floor(v * 100) / 100).toFixed(2);

  function fileName(ext) { return 'vistanology-palette.' + ext; }

  /* ---------------- render ---------------- */

  function statusLine(text, good) {
    refs.status.textContent = text;
    refs.status.className = 'pe-status' + (good ? ' ok' : ' bad');
  }

  function clearOutput() {
    result = null;
    refs.swatches.innerHTML = '';
    refs.summary.innerHTML = '';
    refs.matrix.innerHTML = '';
    refs.css.value = '';
    setExportEnabled(false);
  }

  function render() {
    if (!src) {
      clearOutput();
      statusLine(t('pe.wait'), false);
      return;
    }
    let res;
    try {
      res = buildPalette(src.img);
    } catch (e) {
      clearOutput();
      statusLine(t('pe.badDecode'), false);
      return;
    }
    if (res.error) { clearOutput(); statusLine(t('pe.empty'), false); return; }
    result = res;

    statusLine(
      res.skipped
        ? t('pe.doneSkip', { n: res.colors.length, p: res.sampled.toLocaleString(), s: res.skipped.toLocaleString() })
        : t('pe.done', { n: res.colors.length, p: res.sampled.toLocaleString() }),
      true
    );

    refs.swatches.innerHTML = res.colors.map((c) => {
      const ink = c.onWhite >= c.onBlack ? '#FFFFFF' : '#000000';
      return '<button class="pe-swatch" type="button" data-hex="' + c.hex + '" style="background:' + c.hex + ';color:' + ink + '" ' +
        'aria-label="' + esc(c.hex + ' · ' + (c.share * 100).toFixed(1) + '%') + '">' +
        '<span class="pe-hex">' + c.hex + '</span>' +
        '<span class="pe-share">' + (c.share * 100).toFixed(1) + '%</span>' +
        '<span class="pe-hsl">' + c.h + '° ' + c.s + '% ' + c.l + '%</span>' +
        '</button>';
    }).join('');

    const lightest = res.colors.reduce((a, b) => (b.lum > a.lum ? b : a));
    const darkest = res.colors.reduce((a, b) => (b.lum < a.lum ? b : a));
    const greys = res.colors.filter((c) => c.s <= 10).length;
    const mean = res.colors.reduce((a, c) => a + c.lum * c.share, 0);
    const top = res.colors[0];
    const rows = [
      [t('pe.s.requested'), state.k + ' / ' + res.colors.length],
      [t('pe.s.sampled'), res.sampled.toLocaleString() + ' (' + res.w + '×' + res.h + ')'],
      [t('pe.s.skipped'), res.skipped.toLocaleString()],
      [t('pe.s.lightest'), lightest.hex + ' · L ' + (lightest.lum * 100).toFixed(1)],
      [t('pe.s.darkest'), darkest.hex + ' · L ' + (darkest.lum * 100).toFixed(1)],
      [t('pe.s.greys'), greys + ' / ' + res.colors.length],
      [t('pe.s.dominant'), top.s <= 10 ? t('pe.none') : top.h + '°'],
      [t('pe.s.mean'), mean.toFixed(4)]
    ];
    refs.summary.innerHTML = rows.map(([k, v]) =>
      '<div class="pe-row"><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>').join('');

    refs.matrix.innerHTML = pairs(res.colors).map((p) =>
      '<div class="pe-pair"><span class="pe-dot" style="background:' + p.a.hex + '"></span>' +
      '<span class="pe-dot" style="background:' + p.b.hex + '"></span>' +
      '<b>' + fmtRatio(p.ratio) + ':1</b>' +
      '<span class="badge ' + (p.ratio >= 4.5 ? 'badge-ok' : p.ratio >= 3 ? 'badge-warn' : 'badge-err') + '">' +
      esc(p.ratio >= 4.5 ? t('pe.cAa') : p.ratio >= 3 ? t('pe.cLarge') : t('pe.cFail')) + '</span></div>').join('');

    refs.css.value = cssBlock(res.colors);
    setExportEnabled(true);
  }

  // Every unordered pair of the six leading colours, the way a designer actually
  // reads it: which two of these can carry text against each other. Capped so a
  // 16-colour palette does not push 120 rows into the bench.
  function pairs(colors) {
    const use = colors.slice(0, 6);
    const out = [];
    for (let i = 0; i < use.length; i++) {
      for (let j = i + 1; j < use.length; j++) {
        out.push({ a: use[i], b: use[j], ratio: U.contrast(use[i].hex, use[j].hex) });
      }
    }
    return out.sort((x, y) => y.ratio - x.ratio);
  }

  function setExportEnabled(on) {
    $$('#pe-export button', document).forEach((b) => { b.disabled = !on; });
  }

  /* ---------------- sample image ---------------- */

  // The sample never touches the disk, so its "file size" is the byte length of
  // the base64 payload the canvas just produced — decoded rather than estimated.
  function dataURLBytes(url) {
    const b64 = url.slice(url.indexOf(',') + 1);
    const pad = b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0;
    return Math.floor(b64.length * 3 / 4) - pad;
  }

  function sampleDataURL() {
    const c = document.createElement('canvas');
    c.width = SAMPLE_SIDE; c.height = SAMPLE_SIDE;
    const x = c.getContext('2d');
    const half = SAMPLE_SIDE / 2;
    // fillRect on integer boundaries keeps each quadrant exactly one colour, so
    // the palette the harness expects is known before the image is read.
    SAMPLE_QUADRANTS.forEach((hex, i) => {
      x.fillStyle = hex;
      x.fillRect((i % 2) * half, Math.floor(i / 2) * half, half, half);
    });
    return c.toDataURL('image/png');
  }

  async function loadFromDataURL(url, meta) {
    try {
      const img = await U.loadImage(url);
      if (!alive) return;
      src = { img, size: meta.size, mime: meta.mime, name: meta.name };
      refs.img.src = url;
      refs.img.hidden = false;
      renderSourceMeta();
      render();
    } catch {
      // A file that will not decode is not the previous file: clear the bench so
      // the error is not shown next to a palette that no longer has a source.
      src = null;
      refs.img.removeAttribute('src'); refs.img.hidden = true;
      renderSourceMeta();
      clearOutput();
      statusLine(t('pe.badDecode'), false);
    }
  }

  function renderSourceMeta() {
    if (!src) { refs.from.textContent = ''; return; }
    refs.from.textContent = t('pe.from') + ' ' + src.img.naturalWidth + ' × ' + src.img.naturalHeight + ' px · ' +
      src.mime + ' · ' + U.formatBytes(src.size);
  }

  async function loadFile(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif|bmp|x-icon|vnd\.microsoft)/.test(file.type) && !/\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name || '')) {
      toast(t('pe.badType'), 'error');
      return;
    }
    const url = await U.readFileAsDataURL(file);
    await loadFromDataURL(url, { size: file.size, mime: file.type || 'image', name: file.name });
  }

  /* ---------------- mount ---------------- */

  function mount(root) {
    alive = true;
    restore();
    root.innerHTML = `<section class="pe-work">
      <section class="step glass">
        <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('pe.source')}</h3></div>
        <div class="dropzone" id="pe-drop" tabindex="0" role="button" aria-label="${esc(t('pe.drop'))}">
          <span class="orb orb-sm">${I.upload}</span>
          <strong>${t('pe.drop')}</strong><span>${t('pe.dropHint')}</span>
        </div>
        <input type="file" id="pe-file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" hidden>
        <div class="bench-row">
          <button id="pe-sample" class="btn btn-ghost btn-sm">${t('pe.sample')}</button>
          <button id="pe-clear" class="btn btn-ghost btn-sm">${t('pe.clear')}</button>
        </div>
        <p class="hint" id="pe-from"></p>
      </section>

      <section class="step glass">
        <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('pe.extract')}</h3></div>
        <div class="pe-grid">
          <div class="field"><label for="pe-k">${t('pe.k')} · <span id="pe-k-val"></span></label>
            <input id="pe-k" type="range" min="2" max="16" step="1"></div>
          <div class="field"><label for="pe-res">${t('pe.res')} · <span id="pe-res-val"></span></label>
            <input id="pe-res" type="range" min="60" max="400" step="20"></div>
          <label class="check-row" for="pe-alpha"><input id="pe-alpha" type="checkbox"><span>${t('pe.alpha')}</span></label>
        </div>
        <p class="hint">${t('pe.resHint')}</p>
        <div class="bench-seg" role="group" aria-label="${esc(t('pe.sort'))}">
          <button class="btn btn-ghost btn-sm" data-sort="pop" aria-pressed="true">${t('pe.sortPop')}</button>
          <button class="btn btn-ghost btn-sm" data-sort="lum" aria-pressed="false">${t('pe.sortLum')}</button>
          <button class="btn btn-ghost btn-sm" data-sort="hue" aria-pressed="false">${t('pe.sortHue')}</button>
        </div>
        <div class="pe-stage"><img id="pe-img" alt="" hidden></div>
        <p id="pe-status" class="pe-status"></p>
      </section>

      <section class="step glass">
        <div class="step-head"><span class="step-num">03</span><h3 class="step-title">${t('pe.palette')}</h3></div>
        <div class="pe-swatches" id="pe-swatches"></div>
        <p class="hint">${t('pe.copyHex')}</p>
        <div class="pe-summary" id="pe-summary"></div>
        <h4 class="pe-sub">${t('pe.contrast')}</h4>
        <p class="hint">${t('pe.cHint')} ${t('pe.cTop')}</p>
        <div class="pe-matrix" id="pe-matrix"></div>
      </section>

      <section class="step glass">
        <div class="step-head"><span class="step-num">04</span><h3 class="step-title">${t('pe.export')}</h3></div>
        <div class="field"><label for="pe-css">${t('pe.css')}</label>
          <textarea id="pe-css" class="input pe-code" rows="8" readonly spellcheck="false"></textarea></div>
        <div class="export-row" id="pe-export">
          <button id="pe-copycss" class="btn btn-primary btn-sm">${t('pe.copycss')}</button>
          <button id="pe-dlcss" class="btn btn-ghost btn-sm">${t('pe.dlcss')}</button>
          <button id="pe-dljson" class="btn btn-ghost btn-sm">${t('pe.dljson')}</button>
          <button id="pe-dlhex" class="btn btn-ghost btn-sm">${t('pe.dlhex')}</button>
        </div>
        <p class="privacy-line">${I.shield}<span>${t('pe.privacy')}</span></p>
      </section>
    </section>`;

    refs = {
      drop: $('#pe-drop', root), file: $('#pe-file', root), img: $('#pe-img', root),
      status: $('#pe-status', root), swatches: $('#pe-swatches', root), summary: $('#pe-summary', root),
      matrix: $('#pe-matrix', root), css: $('#pe-css', root), from: $('#pe-from', root),
      k: $('#pe-k', root), kVal: $('#pe-k-val', root), res: $('#pe-res', root), resVal: $('#pe-res-val', root),
      alpha: $('#pe-alpha', root)
    };

    refs.k.value = state.k; refs.kVal.textContent = state.k;
    refs.res.value = state.res; refs.resVal.textContent = state.res + ' px';
    refs.alpha.checked = state.skipAlpha;
    $$('.bench-seg .btn', root).forEach((b) => b.setAttribute('aria-pressed', b.dataset.sort === state.sort ? 'true' : 'false'));

    const live = U.debounce(render, 180);
    refs.k.addEventListener('input', () => {
      state.k = U.clamp(Number(refs.k.value), 2, 16);
      refs.kVal.textContent = state.k;
      persist(); live();
    });
    refs.res.addEventListener('input', () => {
      state.res = U.clamp(Number(refs.res.value), 60, 400);
      refs.resVal.textContent = state.res + ' px';
      persist(); live();
    });
    refs.alpha.addEventListener('change', () => { state.skipAlpha = refs.alpha.checked; persist(); render(); });
    $$('.bench-seg .btn', root).forEach((b) => b.addEventListener('click', () => {
      state.sort = b.dataset.sort;
      $$('.bench-seg .btn', root).forEach((x) => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      persist(); render();
    }));

    refs.drop.addEventListener('click', () => refs.file.click());
    refs.drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); refs.file.click(); } });
    ['dragover', 'dragenter'].forEach((ev) => refs.drop.addEventListener(ev, (e) => { e.preventDefault(); refs.drop.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach((ev) => refs.drop.addEventListener(ev, (e) => { e.preventDefault(); refs.drop.classList.remove('dragover'); }));
    refs.drop.addEventListener('drop', (e) => loadFile(e.dataTransfer.files[0]));
    refs.file.addEventListener('change', () => { loadFile(refs.file.files[0]); refs.file.value = ''; });

    $('#pe-sample', root).addEventListener('click', () => {
      const url = sampleDataURL();
      loadFromDataURL(url, { size: dataURLBytes(url), mime: 'image/png', name: 'sample' });
    });
    $('#pe-clear', root).addEventListener('click', () => {
      src = null; refs.img.removeAttribute('src'); refs.img.hidden = true;
      renderSourceMeta(); render();
    });

    refs.swatches.addEventListener('click', async (e) => {
      const btn = e.target.closest('.pe-swatch');
      if (!btn) return;
      const ok = await U.copyText(btn.dataset.hex);
      toast(ok ? t('pe.copied') + ' ' + btn.dataset.hex : t('pe.copyFail'), ok ? 'success' : 'error');
    });
    $('#pe-copycss', root).addEventListener('click', async () => {
      if (!result) { toast(t('pe.needImage'), 'warn'); return; }
      const ok = await U.copyText(refs.css.value);
      toast(ok ? t('pe.copied') : t('pe.copyFail'), ok ? 'success' : 'error');
    });
    $('#pe-dlcss', root).addEventListener('click', () => {
      if (!result) return;
      U.downloadText(refs.css.value, fileName('css'), 'text/css'); toast(t('pe.downloaded'), 'success');
    });
    $('#pe-dljson', root).addEventListener('click', () => {
      if (!result) return;
      U.downloadText(jsonBlock(result), fileName('json'), 'application/json'); toast(t('pe.downloaded'), 'success');
    });
    $('#pe-dlhex', root).addEventListener('click', () => {
      if (!result) return;
      U.downloadText(hexList(result.colors), fileName('txt'), 'text/plain'); toast(t('pe.downloaded'), 'success');
    });

    render();
    return () => { alive = false; };
  }

  function unmount() {
    alive = false;
    src = null;
    result = null;
    refs = {};
  }

  VT.registry.add(def);
  return def;
})();
