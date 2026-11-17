window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['uuid'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'uu.version': 'Version', 'uu.v4': 'v4 · random', 'uu.v7': 'v7 · time-ordered',
      'uu.count': 'How many', 'uu.format': 'Format', 'uu.case': 'Case', 'uu.lower': 'Lowercase', 'uu.upper': 'Uppercase',
      'uu.hyphens': 'Hyphens', 'uu.wrap': 'Wrapper', 'uu.wrap.none': 'None', 'uu.wrap.braces': 'Braces { }', 'uu.wrap.urn': 'URN urn:uuid:',
      'uu.generate': 'Generate', 'uu.copy': 'Copy all', 'uu.copied': '{n} UUID(s) copied', 'uu.copyfail': 'Could not copy',
      'uu.download': 'Download .txt', 'uu.out.label': 'Generated UUIDs',
      'uu.info.v4': 'v4 carries 122 random bits (version + variant fixed).',
      'uu.info.v7': 'v7 embeds a 48-bit millisecond timestamp first, so lists sort by creation time. First: {time}.',
      'uu.privacy': 'Generated with crypto.getRandomValues. Nothing stored, nothing sent.'
    },
    pt: {
      'uu.version': 'Versão', 'uu.v4': 'v4 · aleatório', 'uu.v7': 'v7 · ordenado por tempo',
      'uu.count': 'Quantos', 'uu.format': 'Formato', 'uu.case': 'Caixa', 'uu.lower': 'Minúsculas', 'uu.upper': 'Maiúsculas',
      'uu.hyphens': 'Hífens', 'uu.wrap': 'Envoltório', 'uu.wrap.none': 'Nenhum', 'uu.wrap.braces': 'Chaves { }', 'uu.wrap.urn': 'URN urn:uuid:',
      'uu.generate': 'Gerar', 'uu.copy': 'Copiar todos', 'uu.copied': '{n} UUID(s) copiado(s)', 'uu.copyfail': 'Não foi possível copiar',
      'uu.download': 'Baixar .txt', 'uu.out.label': 'UUIDs gerados',
      'uu.info.v4': 'v4 carrega 122 bits aleatórios (versão + variante fixos).',
      'uu.info.v7': 'v7 embute um timestamp de 48 bits em milissegundos no início, então listas ordenam por criação. Primeiro: {time}.',
      'uu.privacy': 'Gerado com crypto.getRandomValues. Nada armazenado, nada enviado.'
    }
  });

  const def = {
    id: 'uuid', cat: 'generators', icon: 'hash', version: '1.0.0',
    name: { en: 'UUID Generator', pt: 'Gerador de UUID' },
    tagline: {
      en: 'Bulk RFC-4122 v4 and time-ordered v7 UUIDs with case, hyphen and wrapper formats — cryptographically random, local only.',
      pt: 'UUIDs v4 e v7 (ordenados por tempo) em lote, com formatos de caixa, hífens e envoltório — aleatoriedade criptográfica, só local.'
    },
    tags: ['uuid', 'guid', 'v4', 'v7', 'identifier', 'random', 'bulk'],
    deps: [],
    docs: {
      en: {
        summary: 'Generate RFC-4122 UUIDs in bulk: version 4 (122 random bits) or version 7 (48-bit millisecond timestamp + random, so output sorts by creation time). Choose count, case, hyphens and wrapper, then copy or download.',
        usage: [
          'Pick v4 (random) or v7 (time-ordered).',
          'Set how many (1–100).',
          'Choose case, hyphens and wrapper (none / braces / urn:uuid:).',
          'Generate, then copy all or download a .txt list.',
          'For v7 the info line decodes the embedded timestamp of the first UUID.'
        ],
        privacy: 'Random bytes come from crypto.getRandomValues; v7 timestamps come from the local clock. Nothing is stored or sent.',
        limits: [
          'v7 ordering is monotonic within a millisecond via an incrementing sequence; across clock jumps it follows the local clock.',
          'The urn:uuid: wrapper forces hyphens (the URN namespace requires the canonical form).',
          'Count is clamped to 1–100; the generated list is memory-only and regenerated on reload.'
        ]
      },
      pt: {
        summary: 'Gere UUIDs RFC-4122 em lote: versão 4 (122 bits aleatórios) ou versão 7 (timestamp de 48 bits em ms + aleatório, então a saída ordena por criação). Escolha quantidade, caixa, hífens e envoltório, depois copie ou baixe.',
        usage: [
          'Escolha v4 (aleatório) ou v7 (ordenado por tempo).',
          'Defina quantos (1–100).',
          'Escolha caixa, hífens e envoltório (nenhum / chaves / urn:uuid:).',
          'Gere, depois copie todos ou baixe uma lista .txt.',
          'Para v7 a linha de informação decodifica o timestamp do primeiro UUID.'
        ],
        privacy: 'Bytes aleatórios vêm de crypto.getRandomValues; timestamps v7 vêm do relógio local. Nada é armazenado ou enviado.',
        limits: [
          'A ordenação v7 é monotônica dentro de um milissegundo via sequência incremental; entre saltos de relógio segue o relógio local.',
          'O envoltório urn:uuid: força hífens (o namespace URN exige a forma canônica).',
          'A quantidade é limitada a 1–100; a lista gerada vive só na memória e é regenerada no reload.'
        ]
      }
    },
    mount, unmount
  };

  let alive = false;
  let list = [];
  let lastTime = 0, lastSeq = 0;
  let state = { version: 'v4', count: 5, upper: false, hyphens: true, wrap: 'none' };

  const hex = (b) => Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  function fmt(bytes) {
    const h = hex(bytes);
    let s = state.hyphens || state.wrap === 'urn'
      ? h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20)
      : h;
    if (state.upper) s = s.toUpperCase(); else s = s.toLowerCase();
    if (state.wrap === 'braces') s = '{' + s + '}';
    if (state.wrap === 'urn') s = 'urn:uuid:' + s;
    return s;
  }
  function v4() {
    const b = new Uint8Array(16); crypto.getRandomValues(b);
    b[6] = (b[6] & 0x0F) | 0x40; b[8] = (b[8] & 0x3F) | 0x80;
    return b;
  }
  function v7() {
    let now = Date.now();
    let seq;
    if (now > lastTime) { lastTime = now; const r = new Uint8Array(2); crypto.getRandomValues(r); seq = ((r[0] & 0x0F) << 8) | r[1]; lastSeq = seq; }
    else { now = lastTime; lastSeq = (lastSeq + 1) & 0xFFF; seq = lastSeq; if (seq === 0) { lastTime = ++now; } }
    const b = new Uint8Array(16); crypto.getRandomValues(b);
    for (let i = 0; i < 6; i++) b[i] = (now / Math.pow(2, 8 * (5 - i))) & 0xFF;
    b[6] = 0x70 | (seq >> 8); b[7] = seq & 0xFF; b[8] = (b[8] & 0x3F) | 0x80;
    return b;
  }
  function decodeV7(bytes) {
    let ms = 0; for (let i = 0; i < 6; i++) ms = ms * 256 + bytes[i];
    return new Date(ms).toISOString();
  }

  const KEY = 'uuid';
  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (['v4', 'v7'].includes(s.version)) state.version = s.version;
    const n = Number(s.count); if (Number.isInteger(n) && n >= 1 && n <= 100) state.count = n;
    for (const k of ['upper', 'hyphens']) if (typeof s[k] === 'boolean') state[k] = s[k];
    if (['none', 'braces', 'urn'].includes(s.wrap)) state.wrap = s.wrap;
  }

  let refs = {};
  function render() {
    if (!alive) return;
    refs.countVal.textContent = state.count;
    refs.out.value = list.map(fmt).join('\n');
    if (state.version === 'v4') refs.info.textContent = t('uu.info.v4');
    else refs.info.textContent = t('uu.info.v7', { time: list.length ? decodeV7(list[0]) : '—' });
  }
  function generate() {
    list = [];
    for (let i = 0; i < state.count; i++) list.push(state.version === 'v4' ? v4() : v7());
    render();
  }

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="uu-layout">
        <div class="uu-left">
          <section class="uu-stage glass-2">
            <label class="pw-out-label" for="uu-out">${t('uu.out.label')}</label>
            <textarea class="input mono uu-out" id="uu-out" readonly rows="10" spellcheck="false"></textarea>
            <p class="hint" id="uu-info"></p>
            <div class="export-row">
              <button class="btn btn-primary" id="uu-regen">${I.dice} ${t('uu.generate')}</button>
              <button class="btn" id="uu-copy">${I.copy} ${t('uu.copy')}</button>
              <button class="btn" id="uu-dl">${I.download} ${t('uu.download')}</button>
            </div>
            <p class="privacy-line">${I.shield} ${t('uu.privacy')}</p>
          </section>
        </div>
        <div class="uu-controls">
          <section class="step glass">
            <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('uu.version')}</h3></div>
            <div class="tabs uu-version" role="tablist" aria-label="${t('uu.version')}" id="uu-version">
              <button class="tab" role="tab" data-tab="v4" aria-selected="${state.version === 'v4'}">${t('uu.v4')}</button>
              <button class="tab" role="tab" data-tab="v7" aria-selected="${state.version === 'v7'}">${t('uu.v7')}</button>
            </div>
            <div class="field"><label for="uu-count">${t('uu.count')} · <span id="uu-count-val"></span></label>
              <input type="range" id="uu-count" min="1" max="100" step="1"></div>
            <div class="step-head uu-fmt-head"><span class="step-num">02</span><h3 class="step-title">${t('uu.format')}</h3></div>
            <div class="field"><label for="uu-case">${t('uu.case')}</label>
              <select class="input" id="uu-case"><option value="lower">${t('uu.lower')}</option><option value="upper">${t('uu.upper')}</option></select></div>
            <label class="check-row"><input type="checkbox" id="uu-hyphens">${t('uu.hyphens')}</label>
            <div class="field"><label for="uu-wrap">${t('uu.wrap')}</label>
              <select class="input" id="uu-wrap"><option value="none">${t('uu.wrap.none')}</option><option value="braces">${t('uu.wrap.braces')}</option><option value="urn">${t('uu.wrap.urn')}</option></select></div>
          </section>
        </div>
      </div>`;

    refs = { out: $('#uu-out', root), info: $('#uu-info', root), countVal: $('#uu-count-val', root) };
    VT.ui.tabs($('.uu-controls .step', root), (id) => { state.version = id; persist(); generate(); });
    const count = $('#uu-count', root); count.value = state.count;
    count.addEventListener('input', () => { state.count = U.clamp(Number(count.value), 1, 100); persist(); generate(); });
    const cs = $('#uu-case', root); cs.value = state.upper ? 'upper' : 'lower';
    cs.addEventListener('change', () => { state.upper = cs.value === 'upper'; persist(); render(); });
    const hy = $('#uu-hyphens', root); hy.checked = state.hyphens;
    hy.addEventListener('change', () => { state.hyphens = hy.checked; persist(); render(); });
    const wr = $('#uu-wrap', root); wr.value = state.wrap;
    wr.addEventListener('change', () => { state.wrap = wr.value; persist(); render(); });
    $('#uu-regen', root).addEventListener('click', generate);
    $('#uu-copy', root).addEventListener('click', async () => {
      const ok = await U.copyText(refs.out.value);
      toast(ok ? t('uu.copied', { n: list.length }) : t('uu.copyfail'), ok ? 'success' : 'error');
    });
    $('#uu-dl', root).addEventListener('click', () => U.downloadText(refs.out.value, 'vistanology-uuids.txt', 'text/plain'));
    generate();
    return () => { alive = false; };
  }
  function unmount() { alive = false; }

  VT.registry.add(def);
  return def;
})();