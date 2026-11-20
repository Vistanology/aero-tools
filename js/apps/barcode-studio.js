window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['barcode-studio'] = (() => {
  const U = VT.utils;
  const { $, $$, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  /* ------------------------------------------------------------------
   * Encoding tables, extracted from the published specifications and
   * proven before being embedded (node _dev/extract-code128.js,
   * node _dev/extract-ean13.js) — never typed from memory.
   *  - Code 128: 107 width strings indexed by symbol value. Proven by the
   *    run-lengths of every published 11-bit pattern, by the four fixed
   *    anchors (Start A 211412, Start B 211214, Start C 211232, Stop 233111)
   *    and by the article's worked checksum "PJJ123C" in set A → 878 → 54.
   *  - EAN-13: the L/G/R 7-bit symbols plus the first-digit parity table.
   *    Proven by R = complement(L), G = reverse(R), odd L / even G parity,
   *    the published checksums 400638133393→1 and 590123412345→7, and a
   *    bars-to-digits round-trip over seven numbers.
   * ------------------------------------------------------------------ */
  const C128 = [
    '212222', '222122', '222221', '121223', '121322', '131222',
    '122213', '122312', '132212', '221213', '221312', '231212',
    '112232', '122132', '122231', '113222', '123122', '123221',
    '223211', '221132', '221231', '213212', '223112', '312131',
    '311222', '321122', '321221', '312212', '322112', '322211',
    '212123', '212321', '232121', '111323', '131123', '131321',
    '112313', '132113', '132311', '211313', '231113', '231311',
    '112133', '112331', '132131', '113123', '113321', '133121',
    '313121', '211331', '231131', '213113', '213311', '213131',
    '311123', '311321', '331121', '312113', '312311', '332111',
    '314111', '221411', '431111', '111224', '111422', '121124',
    '121421', '141122', '141221', '112214', '112412', '122114',
    '122411', '142112', '142211', '241211', '221114', '413111',
    '241112', '134111', '111242', '121142', '121241', '114212',
    '124112', '124211', '411212', '421112', '421211', '212141',
    '214121', '412121', '111143', '111341', '131141', '114113',
    '114311', '411113', '411311', '113141', '114131', '311141',
    '411131', '211412', '211214', '211232', '233111',
  ];
  const EAN = {
    L: { 0: '0001101', 1: '0011001', 2: '0010011', 3: '0111101', 4: '0100011', 5: '0110001', 6: '0101111', 7: '0111011', 8: '0110111', 9: '0001011' },
    G: { 0: '0100111', 1: '0110011', 2: '0011011', 3: '0100001', 4: '0011101', 5: '0111001', 6: '0000101', 7: '0010001', 8: '0001001', 9: '0010111' },
    R: { 0: '1110010', 1: '1100110', 2: '1101100', 3: '1000010', 4: '1011100', 5: '1001110', 6: '1010000', 7: '1000100', 8: '1001000', 9: '1110100' },
    parity: { 0: 'LLLLLL', 1: 'LLGLGG', 2: 'LLGGLG', 3: 'LLGGGL', 4: 'LGLLGG', 5: 'LGGLLG', 6: 'LGGGLL', 7: 'LGLGLG', 8: 'LGLGGL', 9: 'LGGLGL' },
    GUARDS: { start: '101', center: '01010', end: '101' }
  };

  const START = { A: 103, B: 104, C: 105 };
  // Code-set switches carried as data values, read off the published table
  // (columns Value | Hex | 128A | 128B | 128C): 99 = Code C, 100 = Code B,
  // 101 = Code A. 98 in set A is Shift-to-B, which is how a high ASCII
  // character survives inside a control-character string.
  const SW = { A: 101, B: 100, C: 99 };
  const SHIFT_B = 98;
  const C128_STOP = '2331112';            // the 11-module stop symbol plus the 2-module final bar
  const QUIET = 10;                       // modules of clear space on each side
  const SAMPLES = { ean13: '590123412345', code128: 'Vistanology-42' };

  VT.i18n.add({
    en: {
      'bc.value': 'Value', 'bc.valuePhEan': '12 or 13 digits, e.g. 590123412345',
      'bc.valuePhC128': 'ASCII text, e.g. Vistanology-42',
      'bc.sample': 'Sample', 'bc.clear': 'Clear', 'bc.sym': 'Symbology',
      'bc.symEan': 'EAN-13', 'bc.symC128': 'Code 128',
      'bc.set': 'Code set', 'bc.setAuto': 'Auto',
      'bc.csetNote': 'Auto uses Code C for runs of four or more digits and Code B — or Code A when the text has control characters — for everything else.',
      'bc.shape': 'Shape', 'bc.height': 'Height', 'bc.narrow': 'Narrowest bar', 'bc.showText': 'Human-readable text',
      'bc.ink': 'Bars', 'bc.paper': 'Background',
      'bc.structure': 'Structure', 'bc.mModules': 'Modules', 'bc.mCheck': 'Check value', 'bc.mSet': 'Code sets used',
      'bc.mChars': 'Characters', 'bc.mParity': 'Left parity', 'bc.mDigits': 'Digits', 'bc.mSymbols': 'Symbols',
      'bc.contrast': 'Ink/background contrast', 'bc.contrastOk': 'printable', 'bc.contrastWarn': 'low contrast',
      'bc.wait': 'Type a value to encode it.',
      'bc.eanLen': 'EAN-13 needs 12 digits (the check digit is added) or 13 digits.',
      'bc.eanCheck': 'The check digit should be {expect} — as typed this is not a valid EAN-13.',
      'bc.emptyNeed': 'Type something to encode.',
      'bc.range': 'Code 128 covers ASCII 0–127; “{char}” is outside it.',
      'bc.c128Digits': 'Forced Code C needs an even number of digits.',
      'bc.c128Ctl': 'Forced Code B cannot carry control characters (ASCII 0–31); use Auto or A.',
      'bc.export': 'Export', 'bc.png': 'PNG', 'bc.svg': 'SVG', 'bc.copySvg': 'Copy SVG', 'bc.copyData': 'Copy encoded value',
      'bc.copied': 'Copied to clipboard.', 'bc.copyFail': 'Could not copy — select it manually.',
      'bc.downPng': 'PNG downloaded.', 'bc.downSvg': 'SVG downloaded.', 'bc.pngFail': 'The browser refused to produce the PNG.',
      'bc.titleEan': 'EAN-13 encoded, check digit computed', 'bc.titleC128': 'Code 128 encoded',
      'bc.privacy': 'Encoding and drawing run in this page from the embedded tables. Your value is never uploaded and never saved; only the symbology, code set and shape settings are remembered.'
    },
    pt: {
      'bc.value': 'Conteúdo', 'bc.valuePhEan': '12 ou 13 dígitos, ex. 590123412345',
      'bc.valuePhC128': 'Texto ASCII, ex. Vistanology-42',
      'bc.sample': 'Exemplo', 'bc.clear': 'Limpar', 'bc.sym': 'Simbologia',
      'bc.symEan': 'EAN-13', 'bc.symC128': 'Code 128',
      'bc.set': 'Conjunto de códigos', 'bc.setAuto': 'Automático',
      'bc.csetNote': 'O automático usa Code C para sequências de quatro ou mais dígitos e Code B — ou Code A quando há caracteres de controle — para o resto.',
      'bc.shape': 'Forma', 'bc.height': 'Altura', 'bc.narrow': 'Barra mais estreita', 'bc.showText': 'Texto legível',
      'bc.ink': 'Barras', 'bc.paper': 'Fundo',
      'bc.structure': 'Estrutura', 'bc.mModules': 'Módulos', 'bc.mCheck': 'Valor de verificação', 'bc.mSet': 'Conjuntos usados',
      'bc.mChars': 'Caracteres', 'bc.mParity': 'Paridade esquerda', 'bc.mDigits': 'Dígitos', 'bc.mSymbols': 'Símbolos',
      'bc.contrast': 'Contraste barra/fundo', 'bc.contrastOk': 'imprimível', 'bc.contrastWarn': 'contraste baixo',
      'bc.wait': 'Digite um valor para codificá-lo.',
      'bc.eanLen': 'EAN-13 precisa de 12 dígitos (o dígito verificador é calculado) ou 13 dígitos.',
      'bc.eanCheck': 'O dígito verificador deveria ser {expect} — como digitado não é um EAN-13 válido.',
      'bc.emptyNeed': 'Digite algo para codificar.',
      'bc.range': 'Code 128 cobre ASCII 0–127; “{char}” está fora.',
      'bc.c128Digits': 'Code C forçado precisa de número par de dígitos.',
      'bc.c128Ctl': 'Code B forçado não carrega caracteres de controle (ASCII 0–31); use Automático ou A.',
      'bc.export': 'Exportar', 'bc.png': 'PNG', 'bc.svg': 'SVG', 'bc.copySvg': 'Copiar SVG', 'bc.copyData': 'Copiar valor codificado',
      'bc.copied': 'Copiado para a área de transferência.', 'bc.copyFail': 'Não foi possível copiar — selecione manualmente.',
      'bc.downPng': 'PNG baixado.', 'bc.downSvg': 'SVG baixado.', 'bc.pngFail': 'O navegador não gerou o PNG.',
      'bc.titleEan': 'EAN-13 codificado, dígito verificador calculado', 'bc.titleC128': 'Code 128 codificado',
      'bc.privacy': 'A codificação e o desenho rodam nesta página a partir das tabelas embutidas. Seu valor nunca é enviado nem salvo; apenas simbologia, conjunto e forma são lembrados.'
    }
  });

  const def = {
    id: 'barcode-studio', cat: 'generators', icon: 'barcode', version: '1.0.0',
    name: { en: 'Barcode Studio', pt: 'Estúdio de Códigos de Barras' },
    tagline: {
      en: 'Encode EAN-13 and Code 128 barcodes in the browser from the published symbol tables, with the check digit computed, a structure report and PNG or SVG export.',
      pt: 'Codifique barras EAN-13 e Code 128 no navegador a partir das tabelas de símbolos publicadas, com dígito verificador calculado, relatório de estrutura e exportação PNG ou SVG.'
    },
    tags: ['barcode', 'ean', 'ean-13', 'code128', 'code 128', 'gtin', 'check digit', 'generator'],
    deps: [],
    docs: {
      en: {
        summary: 'Two symbologies on one bench. EAN-13 takes 12 digits and computes the published check digit, or takes 13 digits and refuses a wrong one; Code 128 takes ASCII text and picks Code C for runs of four or more digits, Code B for ordinary text and Code A when control characters appear, inserting the Shift symbol where set A cannot carry a character directly. The symbol tables are embedded in the file after being extracted from the published specifications and validated by _dev/extract-code128.js and _dev/extract-ean13.js. The module string, the module count, the check value and the code sets actually used are all reported, and one shared geometry writes both the canvas and the SVG.',
        usage: [
          'Pick EAN-13 or Code 128 in the segmented control at the top of the bench.',
          'Type the value — 12 digits for EAN-13 (the check digit is added for you), any ASCII text for Code 128 — or press Sample.',
          'For Code 128 you may force a code set; Auto is what the printed examples use.',
          'Set the height and the width of the narrowest bar; the preview and the exported file always carry the same number of modules.',
          'Export PNG or SVG, or copy the SVG markup or the encoded value; the structure panel shows modules, check value, code sets and ink/background contrast.'
        ],
        privacy: 'Encoding and drawing happen inside this page from the embedded tables. The value is not uploaded, not logged and not stored: only the symbology, code set, height, bar width, text switch and the two colours are written to localStorage.',
        limits: [
          'Only EAN-13 and Code 128. EAN-8, UPC-A and ITF-14 are not implemented, although a UPC-A number does encode as EAN-13 with a leading zero.',
          'Code 128 stops at ASCII 0–127 and the three code sets: FNC1–FNC4 and the Latin-1 extension that reaches characters above 127 are refused rather than guessed.',
          'The structure report proves the encoding against the published tables, not the print. Screen pixels, printer dot gain and the 10-module quiet zone must be checked with a real scanner before production use.'
        ]
      },
      pt: {
        summary: 'Duas simbologias em uma bancada. EAN-13 aceita 12 dígitos e calcula o dígito verificador publicado, ou aceita 13 dígitos e recusa um verificador errado; Code 128 aceita texto ASCII e escolhe Code C para sequências de quatro ou mais dígitos, Code B para texto comum e Code A quando aparecem caracteres de controle, inserindo o símbolo Shift quando o conjunto A não carrega um caractere diretamente. As tabelas de símbolos estão embutidas no arquivo depois de extraídas das especificações publicadas e validadas por _dev/extract-code128.js e _dev/extract-ean13.js. A sequência de módulos, a contagem de módulos, o valor de verificação e os conjuntos realmente usados são informados, e uma única geometria escreve o canvas e o SVG.',
        usage: [
          'Escolha EAN-13 ou Code 128 no controle segmentado no topo da bancada.',
          'Digite o valor — 12 dígitos para EAN-13 (o verificador é calculado para você), qualquer texto ASCII para Code 128 — ou pressione Exemplo.',
          'Em Code 128 você pode forçar um conjunto de códigos; Automático é o usado nos exemplos impressos.',
          'Ajuste a altura e a largura da barra mais estreita; a pré-visualização e o arquivo exportado sempre carregam o mesmo número de módulos.',
          'Exporte PNG ou SVG, ou copie o markup SVG ou o valor codificado; o painel de estrutura mostra módulos, valor de verificação, conjuntos e contraste barra/fundo.'
        ],
        privacy: 'A codificação e o desenho acontecem nesta página, a partir das tabelas embutidas. O valor não é enviado, nem registrado, nem guardado: apenas simbologia, conjunto, altura, largura da barra, o texto legível e as duas cores são escritos no localStorage.',
        limits: [
          'Somente EAN-13 e Code 128. EAN-8, UPC-A e ITF-14 não estão implementados, embora um número UPC-A seja codificável como EAN-13 com um zero à esquerda.',
          'Code 128 para no ASCII 0–127 e nos três conjuntos: FNC1–FNC4 e a extensão Latin-1 que alcança caracteres acima de 127 são recusados, não adivinhados.',
          'O relatório de estrutura prova a codificação contra as tabelas publicadas, não a impressão. Pixels de tela, ganho de ponto da impressora e a zona de silêncio de 10 módulos exigem conferência em leitor real antes de produção.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'barcode-studio';
  let state = { sym: 'ean13', set: 'auto', h: 90, mod: 3, showText: true, ink: '#000000', paper: '#FFFFFF' };
  let refs = {};
  let current = null;
  let alive = true;

  function persist() { VT.store.set(KEY, state); }

  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (s.sym === 'ean13' || s.sym === 'code128') state.sym = s.sym;
    if (['auto', 'a', 'b', 'c'].includes(s.set)) state.set = s.set;
    if (Number.isFinite(s.h)) state.h = U.clamp(Math.round(s.h), 30, 220);
    if (Number.isFinite(s.mod)) state.mod = U.clamp(Math.round(s.mod), 1, 8);
    if (typeof s.showText === 'boolean') state.showText = s.showText;
    const ink = U.normalizeHex(s.ink), paper = U.normalizeHex(s.paper);
    if (ink) state.ink = ink.toUpperCase();
    if (paper) state.paper = paper.toUpperCase();
  }

  /* ---------------- encoding ---------------- */

  // A missing table entry must fail loudly: silently shortening the stream is
  // how a barcode generator produces something that scans as a different value.
  const widthsToBits = (w) => {
    const s = String(w);
    if (!/^[1-4]{6,7}$/.test(s)) throw new Error('unknown Code 128 symbol widths: ' + s);
    let out = '';
    for (let i = 0; i < s.length; i++) out += (i % 2 === 0 ? '1' : '0').repeat(+s[i]);
    return out;
  };

  function eanCheck(first12) {
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3);
    return (10 - (sum % 10)) % 10;
  }

  function encodeEAN(input) {
    const d = input.replace(/[\s.-]/g, '');
    if (!/^\d+$/.test(d) || (d.length !== 12 && d.length !== 13)) return { error: t('bc.eanLen') };
    const expect = eanCheck(d.slice(0, 12));
    if (d.length === 13 && Number(d[12]) !== expect) return { error: t('bc.eanCheck', { expect }) };
    const text = d.slice(0, 12) + expect;
    const p = EAN.parity[text[0]];
    let bits = EAN.GUARDS.start;
    for (let i = 0; i < 6; i++) bits += (p[i] === 'L' ? EAN.L : EAN.G)[text[1 + i]];
    bits += EAN.GUARDS.center;
    for (let i = 0; i < 6; i++) bits += EAN.R[text[7 + i]];
    bits += EAN.GUARDS.end;
    return {
      sym: 'ean13', text, bits, layout: 'ean13',
      groups: [text[0], text.slice(1, 7), text.slice(7, 12), text[12]],
      meta: [
        [t('bc.mModules'), bits.length + ' / 95'],
        [t('bc.mParity'), p + ' + RRRRRR'],
        [t('bc.mCheck'), String(expect)],
        [t('bc.mDigits'), '13']
      ]
    };
  }

  // Set A carries ASCII 32–95 as 0–63 and shares 64–95 between the control
  // characters 0–31 and the high range 96–127, which is why a high character in
  // set A goes through the Shift-to-B code. Set B carries 32–127 as 0–95.
  function charValue(ch, set) {
    const c = ch.charCodeAt(0);
    return set === 'A' ? (c <= 31 ? c + 64 : c - 32) : c - 32;
  }

  function encodeC128(input, wantSet) {
    const chars = Array.from(input.replace(/\r\n?/g, '\n'));
    if (!chars.length) return { error: t('bc.emptyNeed') };
    for (const ch of chars) {
      const c = ch.charCodeAt(0);
      if (c > 127) return { error: t('bc.range', { char: ch }) };
    }
    const isDigit = (c) => c >= '0' && c <= '9';
    const runFrom = (j) => { let n = 0; while (j + n < chars.length && isDigit(chars[j + n])) n++; return n; };
    const values = [];
    const trace = [];
    let set = null;
    function open(s) {
      if (set === s) return false;
      values.push(set === null ? START[s] : SW[s]);
      // The trace is the sequence of code sets actually used, so "B → C → B"
      // shows a switch back rather than collapsing it into a set of names.
      const last = trace[trace.length - 1];
      if (last !== s) trace.push(s);
      set = s;
      return true;
    }

    const hasCtl = chars.some((c) => c.charCodeAt(0) < 32);
    const letter = wantSet === 'a' ? 'A' : wantSet === 'b' ? 'B' : (hasCtl ? 'A' : 'B');
    if (wantSet === 'b' && hasCtl) return { error: t('bc.c128Ctl') };
    if (wantSet === 'c') {
      if (!chars.every(isDigit) || chars.length % 2) return { error: t('bc.c128Digits') };
      open('C');
      for (let i = 0; i < chars.length; i += 2) values.push(Number(chars[i] + chars[i + 1]));
    } else {
      let i = 0;
      while (i < chars.length) {
        const run = runFrom(i);
        if (run >= 4 || (set === 'C' && run >= 2)) {
          open('C');
          const pairs = run % 2 ? run - 1 : run;
          for (let k = 0; k < pairs; k += 2) values.push(Number(chars[i + k] + chars[i + k + 1]));
          i += pairs;
          continue;
        }
        open(letter);
        const c = chars[i].charCodeAt(0);
        if (set === 'A' && c >= 96) { values.push(SHIFT_B); values.push(c - 32); }
        else values.push(charValue(chars[i], set));
        i++;
      }
    }

    let sum = values[0];
    for (let i = 1; i < values.length; i++) sum += values[i] * i;
    const check = sum % 103;
    let bits = '';
    for (const v of values) bits += widthsToBits(C128[v]);
    bits += widthsToBits(C128[check]) + widthsToBits(C128_STOP);
    const printable = chars.every((c) => { const n = c.charCodeAt(0); return n >= 32 && n <= 126; });
    return {
      sym: 'code128', text: input, bits, layout: 'code128',
      groups: ['', '', '', printable ? input : ''],
      meta: [
        [t('bc.mModules'), String(bits.length)],
        [t('bc.mSet'), trace.join(' → ')],
        [t('bc.mSymbols'), String(values.length + 2)],
        [t('bc.mCheck'), check + ' (mod 103)'],
        [t('bc.mChars'), String(chars.length)]
      ]
    };
  }

  function encode() {
    const raw = refs.value ? refs.value.value : '';
    if (!raw.trim()) return { empty: true };
    return state.sym === 'ean13' ? encodeEAN(raw) : encodeC128(raw, state.set);
  }

  /* ---------------- geometry, canvas and SVG ---------------- */

  function runsOf(bits) {
    const out = [];
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] !== '1') continue;
      let n = 1;
      while (i + n < bits.length && bits[i + n] === '1') n++;
      out.push({ x: i, n });
      i += n - 1;
    }
    return out;
  }

  // One geometry feeds both renderers, so the PNG and the SVG are the same code.
  function geom(res, o) {
    const mod = o.mod, quiet = QUIET * mod, barH = o.h;
    const textH = o.showText ? Math.max(12, Math.round(barH * 0.2)) : 0;
    const w = res.bits.length * mod + quiet * 2;
    const fs = Math.round(textH * 0.74);
    const base = barH + textH - Math.round(textH * 0.2);
    const labels = [];
    if (o.showText) {
      if (res.layout === 'ean13') {
        labels.push({ x: quiet / 2, y: base, s: res.groups[0], fs: fs + 2 });
        labels.push({ x: quiet + 24 * mod, y: base, s: res.groups[1], fs });
        labels.push({ x: quiet + 67.5 * mod, y: base, s: res.groups[2], fs });
        labels.push({ x: w - quiet / 2, y: base, s: res.groups[3], fs: fs + 2 });
      } else if (res.groups[3]) {
        labels.push({ x: w / 2, y: base, s: res.groups[3], fs });
      }
    }
    return { w, h: barH + textH, barH, quiet, mod, runs: runsOf(res.bits), labels };
  }

  function paint(canvas, res, o) {
    const g = geom(res, o);
    canvas.width = g.w;
    canvas.height = g.h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = o.paper;
    ctx.fillRect(0, 0, g.w, g.h);
    ctx.fillStyle = o.ink;
    for (const r of g.runs) ctx.fillRect(g.quiet + r.x * g.mod, 0, r.n * g.mod, g.barH);
    if (g.labels.length) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      for (const l of g.labels) {
        ctx.font = l.fs + 'px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillText(l.s, l.x, l.y);
      }
    }
    return g;
  }

  function svgMarkup(res, o) {
    const g = geom(res, o);
    const rects = g.runs.map((r) => `<rect x="${g.quiet + r.x * g.mod}" y="0" width="${r.n * g.mod}" height="${g.barH}"/>`).join('');
    const texts = g.labels.map((l) => `<text x="${l.x}" y="${l.y}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="${l.fs}" fill="${o.ink}">${esc(l.s)}</text>`).join('');
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
      + `<svg xmlns="http://www.w3.org/2000/svg" width="${g.w}" height="${g.h}" viewBox="0 0 ${g.w} ${g.h}">`
      + `<title>${esc(res.text)}</title>`
      + `<rect width="${g.w}" height="${g.h}" fill="${o.paper}"/><g fill="${o.ink}">${rects}</g>${texts}</svg>\n`;
  }

  const fileName = (res, ext) => 'vistanology-' + res.sym + '-' + res.text.replace(/[^A-Za-z0-9+._-]+/g, '-').slice(0, 40) + '.' + ext;

  /* ---------------- render ---------------- */

  function setExportEnabled(on) {
    $$('button', refs.exportRow).forEach((b) => { b.disabled = !on; });
  }

  function render() {
    if (!alive || !refs.canvas) return;
    const res = encode();
    current = res.error || res.empty ? null : res;
    if (!current) {
      refs.canvas.width = 0;
      refs.canvas.height = 0;
      refs.status.textContent = res.error || t('bc.wait');
      refs.status.className = 'bc-status' + (res.error ? ' bad' : '');
      refs.meta.innerHTML = '';
      setExportEnabled(false);
      return;
    }
    paint(refs.canvas, current, state);
    refs.status.textContent = current.sym === 'ean13' ? t('bc.titleEan') : t('bc.titleC128');
    refs.status.className = 'bc-status ok';
    const cr = U.contrast(state.ink, state.paper);
    const rows = current.meta.map(([k, v]) => `<div class="bc-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`);
    rows.push(`<div class="bc-row"><span>${esc(t('bc.narrow'))}</span><b>${state.mod} px</b></div>`);
    rows.push(`<div class="bc-row"><span>${esc(t('bc.contrast'))}</span><b>${cr.toFixed(2)}:1 `
      + `<em class="badge ${cr >= 4.5 ? 'badge-ok">' + esc(t('bc.contrastOk')) : 'badge-warn">' + esc(t('bc.contrastWarn'))}</em></b></div>`);
    refs.meta.innerHTML = rows.join('');
    setExportEnabled(true);
  }

  function setSym(sym) {
    state.sym = sym;
    persist();
    $$('.bc-seg .btn', refs.stage).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sym === sym)));
    refs.value.placeholder = sym === 'ean13' ? t('bc.valuePhEan') : t('bc.valuePhC128');
    refs.value.maxLength = sym === 'ean13' ? 16 : 80;
    refs.setRow.hidden = sym !== 'code128';
    refs.setHint.hidden = sym !== 'code128';
    render();
  }

  function mount(root) {
    alive = true;
    refs = { stage: root };
    restore();

    root.innerHTML = `<section class="bc-work">
      <section class="step glass">
        <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('bc.value')}</h3></div>
        <div class="bench-seg" role="group" aria-label="${esc(t('bc.sym'))}">
          <button class="btn btn-ghost btn-sm" data-sym="ean13" aria-pressed="true">${t('bc.symEan')}</button>
          <button class="btn btn-ghost btn-sm" data-sym="code128" aria-pressed="false">${t('bc.symC128')}</button>
        </div>
        <div class="field"><label for="bc-value">${t('bc.value')}</label>
          <input id="bc-value" class="input" type="text" autocomplete="off" spellcheck="false" maxlength="16"></div>
        <div class="bench-row" id="bc-set-row" hidden><span class="bc-label">${t('bc.set')}</span>
          <select id="bc-set" class="select">
            <option value="auto">${t('bc.setAuto')}</option><option value="a">A</option>
            <option value="b">B</option><option value="c">C</option>
          </select></div>
        <p class="hint" id="bc-set-hint" hidden>${t('bc.csetNote')}</p>
        <div class="bench-row">
          <button id="bc-sample" class="btn btn-ghost btn-sm">${t('bc.sample')}</button>
          <button id="bc-clear" class="btn btn-ghost btn-sm">${t('bc.clear')}</button>
        </div>
      </section>

      <section class="step glass">
        <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('bc.shape')}</h3></div>
        <div class="bc-stage"><canvas id="bc-canvas" class="bc-canvas" width="0" height="0"></canvas></div>
        <p id="bc-status" class="bc-status"></p>
        <div class="bc-grid">
          <div class="field"><label for="bc-h">${t('bc.height')}</label><input id="bc-h" type="range" min="30" max="220" step="2"></div>
          <div class="field"><label for="bc-mod">${t('bc.narrow')}</label><input id="bc-mod" type="range" min="1" max="8" step="1"></div>
          <div class="field"><label for="bc-ink">${t('bc.ink')}</label><input id="bc-ink" class="input" type="color"></div>
          <div class="field"><label for="bc-paper">${t('bc.paper')}</label><input id="bc-paper" class="input" type="color"></div>
          <label class="check-row" for="bc-text"><input id="bc-text" type="checkbox"><span>${t('bc.showText')}</span></label>
        </div>
      </section>

      <section class="step glass">
        <div class="step-head"><span class="step-num">03</span><h3 class="step-title">${t('bc.structure')}</h3></div>
        <div id="bc-meta" class="bc-meta"></div>
      </section>

      <section class="step glass">
        <div class="step-head"><span class="step-num">04</span><h3 class="step-title">${t('bc.export')}</h3></div>
        <div class="export-row" id="bc-export">
          <button id="bc-png" class="btn btn-primary btn-sm">${t('bc.png')}</button>
          <button id="bc-svg" class="btn btn-ghost btn-sm">${t('bc.svg')}</button>
          <button id="bc-copysvg" class="btn btn-ghost btn-sm">${t('bc.copySvg')}</button>
          <button id="bc-copydata" class="btn btn-ghost btn-sm">${t('bc.copyData')}</button>
        </div>
        <p class="privacy-line">${t('bc.privacy')}</p>
      </section>
    </section>`;

    refs.value = $('#bc-value', root);
    refs.canvas = $('#bc-canvas', root);
    refs.status = $('#bc-status', root);
    refs.meta = $('#bc-meta', root);
    refs.setRow = $('#bc-set-row', root);
    refs.setHint = $('#bc-set-hint', root);
    refs.setSel = $('#bc-set', root);
    refs.exportRow = $('#bc-export', root);
    refs.h = $('#bc-h', root);
    refs.mod = $('#bc-mod', root);
    refs.ink = $('#bc-ink', root);
    refs.paper = $('#bc-paper', root);
    refs.text = $('#bc-text', root);

    refs.h.value = state.h;
    refs.mod.value = state.mod;
    refs.ink.value = state.ink.toLowerCase();
    refs.paper.value = state.paper.toLowerCase();
    refs.text.checked = state.showText;
    refs.setSel.value = state.set;

    const live = U.debounce(render, 160);
    refs.value.addEventListener('input', live);
    $$('.bench-seg .btn', root).forEach((b) => b.addEventListener('click', () => setSym(b.dataset.sym)));
    refs.setSel.addEventListener('change', () => { state.set = refs.setSel.value; persist(); render(); });
    refs.h.addEventListener('input', () => { state.h = +refs.h.value; persist(); render(); });
    refs.mod.addEventListener('input', () => { state.mod = +refs.mod.value; persist(); render(); });
    refs.ink.addEventListener('input', () => { state.ink = refs.ink.value.toUpperCase(); persist(); render(); });
    refs.paper.addEventListener('input', () => { state.paper = refs.paper.value.toUpperCase(); persist(); render(); });
    refs.text.addEventListener('change', () => { state.showText = refs.text.checked; persist(); render(); });

    $('#bc-sample', root).addEventListener('click', () => {
      refs.value.value = SAMPLES[state.sym];
      render();
    });
    $('#bc-clear', root).addEventListener('click', () => {
      refs.value.value = '';
      render();
      refs.value.focus();
    });

    $('#bc-png', root).addEventListener('click', () => {
      if (!current) return;
      refs.canvas.toBlob((blob) => {
        if (!blob) { toast(t('bc.pngFail'), 'error'); return; }
        U.downloadBlob(blob, fileName(current, 'png'));
        toast(t('bc.downPng'), 'success');
      }, 'image/png');
    });
    $('#bc-svg', root).addEventListener('click', () => {
      if (!current) return;
      U.downloadText(svgMarkup(current, state), fileName(current, 'svg'), 'image/svg+xml');
      toast(t('bc.downSvg'), 'success');
    });
    $('#bc-copysvg', root).addEventListener('click', async () => {
      if (!current) return;
      const ok = await U.copyText(svgMarkup(current, state));
      toast(ok ? t('bc.copied') : t('bc.copyFail'), ok ? 'success' : 'error');
    });
    $('#bc-copydata', root).addEventListener('click', async () => {
      if (!current) return;
      const ok = await U.copyText(current.text);
      toast(ok ? t('bc.copied') : t('bc.copyFail'), ok ? 'success' : 'error');
    });

    setSym(state.sym);
    return () => { alive = false; };
  }

  function unmount() {
    alive = false;
    current = null;
    refs = {};
  }

  VT.registry.add(def);
  return def;
})();
