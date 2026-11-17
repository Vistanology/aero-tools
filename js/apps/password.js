window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['password'] = (() => {
  const U = VT.utils;
  const { $, $$, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'pw.mode': 'Mode', 'pw.chars': 'Characters', 'pw.pass': 'Passphrase',
      'pw.length': 'Length', 'pw.lower': 'Lowercase (a–z)', 'pw.upper': 'Uppercase (A–Z)',
      'pw.digits': 'Digits (0–9)', 'pw.symbols': 'Symbols (!@#…)', 'pw.exclude': 'Exclude ambiguous (I l 1 O 0)',
      'pw.require': 'At least one of each selected set',
      'pw.words': 'Words', 'pw.sep': 'Separator', 'pw.cap': 'Capitalize words', 'pw.num': 'Append a digit',
      'pw.sep.dash': 'Hyphen', 'pw.sep.dot': 'Dot', 'pw.sep.under': 'Underscore', 'pw.sep.space': 'Space', 'pw.sep.none': 'None',
      'pw.generate': 'Generate', 'pw.copy': 'Copy', 'pw.copied': 'Password copied', 'pw.copyfail': 'Could not copy',
      'pw.hide': 'Hide', 'pw.show': 'Show', 'pw.entropy': 'Entropy', 'pw.bits': '{n} bits',
      'pw.weak': 'Weak', 'pw.fair': 'Fair', 'pw.strong': 'Strong', 'pw.excellent': 'Excellent',
      'pw.err.noclass': 'Select at least one character set.',
      'pw.err.short': 'Length must be at least the number of selected sets.',
      'pw.history': 'Recent (this session)', 'pw.hist.clear': 'Clear', 'pw.hist.empty': 'Nothing generated yet.',
      'pw.hist.note': 'History lives in memory only — never stored, cleared on reload.',
      'pw.hist.copy': 'Copy this password', 'pw.privacy': 'Generated with crypto.getRandomValues. Never stored, never sent.',
      'pw.out.label': 'Generated password'
    },
    pt: {
      'pw.mode': 'Modo', 'pw.chars': 'Caracteres', 'pw.pass': 'Frase',
      'pw.length': 'Comprimento', 'pw.lower': 'Minúsculas (a–z)', 'pw.upper': 'Maiúsculas (A–Z)',
      'pw.digits': 'Dígitos (0–9)', 'pw.symbols': 'Símbolos (!@#…)', 'pw.exclude': 'Excluir ambíguos (I l 1 O 0)',
      'pw.require': 'Ao menos um de cada conjunto marcado',
      'pw.words': 'Palavras', 'pw.sep': 'Separador', 'pw.cap': 'Capitalizar palavras', 'pw.num': 'Anexar um dígito',
      'pw.sep.dash': 'Hífen', 'pw.sep.dot': 'Ponto', 'pw.sep.under': 'Sublinhado', 'pw.sep.space': 'Espaço', 'pw.sep.none': 'Nenhum',
      'pw.generate': 'Gerar', 'pw.copy': 'Copiar', 'pw.copied': 'Senha copiada', 'pw.copyfail': 'Não foi possível copiar',
      'pw.hide': 'Ocultar', 'pw.show': 'Mostrar', 'pw.entropy': 'Entropia', 'pw.bits': '{n} bits',
      'pw.weak': 'Fraca', 'pw.fair': 'Razoável', 'pw.strong': 'Forte', 'pw.excellent': 'Excelente',
      'pw.err.noclass': 'Selecione ao menos um conjunto de caracteres.',
      'pw.err.short': 'O comprimento deve ser ao menos o número de conjuntos marcados.',
      'pw.history': 'Recentes (esta sessão)', 'pw.hist.clear': 'Limpar', 'pw.hist.empty': 'Nada gerado ainda.',
      'pw.hist.note': 'O histórico vive só na memória — nunca armazenado, limpo no reload.',
      'pw.hist.copy': 'Copiar esta senha', 'pw.privacy': 'Gerado com crypto.getRandomValues. Nunca armazenado, nunca enviado.',
      'pw.out.label': 'Senha gerada'
    }
  });

  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const DIGITS = '0123456789';
  const SYMBOLS = '!@#$%^&*()-_=+[]{}:,.?/';
  const AMBIG = /[Il1O0]/g;
  const WORDS = ('apple river stone cloud ember frost grove harbor ivory jade kernel lunar meadow north orbit prism ' +
    'quartz ridge solar timber umber vivid willow xenon yield zephyr anchor bloom crest drift echo flint glade hollow ' +
    'inlet jolt kite latch moss nectar onyx plume quill reef spire thorn unity vault wharf yarn zinc amber brook cedar ' +
    'dune elm fern gust haze isle juniper knoll lagoon maple niche oasis pine quarry rust sage tundra ulna verge wren ' +
    'yew zinnia acorn basil coral delta estuary fjord gully heath iris jasmine kelp lichen mesa nadir opal pebble quasar ' +
    'rill summit talus umbra veld wadi xylem yonder zenith alloy brine cinder dale eddy forge garnet helm ingot jetty ' +
    'keel loam mire notch ore plinth quay rune shale tor urn vine weld yoke zircon').split(/\s+/);
  const SEPS = { dash: '-', dot: '.', under: '_', space: ' ', none: '' };
  const HIST_MAX = 8;

  const def = {
    id: 'password', cat: 'generators', icon: 'key', version: '1.0.0',
    name: { en: 'Password Generator', pt: 'Gerador de Senhas' },
    tagline: {
      en: 'Cryptographically secure passwords and passphrases with unbiased sampling, live entropy and a memory-only history.',
      pt: 'Senhas e frases criptograficamente seguras com amostragem sem viés, entropia ao vivo e histórico só na memória.'
    },
    tags: ['password', 'passphrase', 'security', 'random', 'entropy', 'crypto'],
    deps: [],
    docs: {
      en: {
        summary: 'A security-grade generator: characters or diceware-style passphrases built from crypto.getRandomValues with rejection sampling (no modulo bias), live entropy and strength, and a session-only history that is never written to disk.',
        usage: [
          'Choose Characters or Passphrase mode.',
          'Characters: set length (8–64) and toggle lowercase / uppercase / digits / symbols; optionally exclude ambiguous glyphs and require one of each selected set.',
          'Passphrase: set word count (3–8), separator, capitalization and an optional trailing digit.',
          'Read the entropy in bits and the strength label; regenerate until satisfied.',
          'Copy the result, or hide it on screen; recent generations stay in a memory-only list you can clear.',
          'Settings persist; passwords and history never do.'
        ],
        privacy: 'Randomness comes from crypto.getRandomValues with rejection sampling. Passwords and history exist only in memory and are never written to localStorage, never uploaded, never logged.',
        limits: [
          'Entropy is an estimate: length × log2(pool) for characters, words × log2(wordlist) for passphrases; requiring one of each set slightly reduces the true space.',
          'The passphrase wordlist is a fixed built-in list; entropy per word equals log2 of its size.',
          'History holds at most 8 entries and is cleared on reload or by the Clear button.',
          'Clipboard writes can be denied by the browser; an honest error toast is shown when copying fails.'
        ]
      },
      pt: {
        summary: 'Um gerador de nível segurança: caracteres ou frases estilo diceware feitos com crypto.getRandomValues e amostragem por rejeição (sem viés de módulo), entropia e força ao vivo, e histórico só de sessão que nunca vai ao disco.',
        usage: [
          'Escolha o modo Caracteres ou Frase.',
          'Caracteres: defina o comprimento (8–64) e marque minúsculas / maiúsculas / dígitos / símbolos; opcionalmente exclua ambíguos e exija um de cada conjunto.',
          'Frase: defina nº de palavras (3–8), separador, capitalização e um dígito final opcional.',
          'Leia a entropia em bits e o rótulo de força; regenere quantas vezes quiser.',
          'Copie o resultado ou oculte-o na tela; gerações recentes ficam numa lista só na memória que você pode limpar.',
          'As configurações persistem; senhas e histórico nunca.'
        ],
        privacy: 'A aleatoriedade vem de crypto.getRandomValues com amostragem por rejeição. Senhas e histórico existem só na memória: nunca vão ao localStorage, nunca são enviados, nunca registrados.',
        limits: [
          'A entropia é estimada: comprimento × log2(pool) para caracteres, palavras × log2(lista) para frases; exigir um de cada conjunto reduz um pouco o espaço real.',
          'A lista de palavras é fixa e embutida; a entropia por palavra é log2 do seu tamanho.',
          'O histórico guarda no máximo 8 entradas e é limpo no reload ou pelo botão Limpar.',
          'A escrita na área de transferência pode ser negada pelo navegador; um toast honesto aparece quando copiar falha.'
        ]
      }
    },
    mount, unmount
  };

  let alive = false;
  let current = null;      // { value, bits, mode }
  let history = [];        // memory-only
  let hide = false;
  let state = {
    mode: 'chars', length: 20, lower: true, upper: true, digits: true, symbols: true,
    exclude: false, require: true, words: 4, sep: 'dash', cap: false, num: false
  };

  /* ---------- crypto ---------- */
  function randBelow(n) {
    const limit = Math.floor(0x100000000 / n) * n;
    const buf = new Uint32Array(1);
    let x;
    do { crypto.getRandomValues(buf); x = buf[0]; } while (x >= limit);
    return x % n;
  }
  const pick = (s) => s[randBelow(s.length)];

  function classes() {
    const strip = (s) => state.exclude ? s.replace(AMBIG, '') : s;
    const out = [];
    if (state.lower) out.push(strip(LOWER));
    if (state.upper) out.push(strip(UPPER));
    if (state.digits) out.push(strip(DIGITS));
    if (state.symbols) out.push(strip(SYMBOLS));
    return out.filter((s) => s.length);
  }

  function genChars() {
    const cs = classes();
    if (!cs.length) return { err: 'pw.err.noclass' };
    if (state.require && state.length < cs.length) return { err: 'pw.err.short' };
    const pool = cs.join('');
    const chars = [];
    if (state.require) for (const c of cs) chars.push(pick(c));
    while (chars.length < state.length) chars.push(pick(pool));
    for (let i = chars.length - 1; i > 0; i--) { const j = randBelow(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    return { value: chars.join(''), bits: state.length * Math.log2(pool.length) };
  }

  function genPass() {
    const parts = [];
    for (let i = 0; i < state.words; i++) {
      let w = pick(WORDS);
      if (state.cap) w = w[0].toUpperCase() + w.slice(1);
      parts.push(w);
    }
    let value = parts.join(SEPS[state.sep]);
    let bits = state.words * Math.log2(WORDS.length);
    if (state.num) { value += String(randBelow(10)); bits += Math.log2(10); }
    return { value, bits };
  }

  function strength(bits) {
    if (bits < 36) return 'pw.weak';
    if (bits < 60) return 'pw.fair';
    if (bits < 80) return 'pw.strong';
    return 'pw.excellent';
  }

  /* ---------- persistence (settings only) ---------- */
  const KEY = 'password';
  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (['chars', 'pass'].includes(s.mode)) state.mode = s.mode;
    const n = Number(s.length); if (Number.isInteger(n) && n >= 8 && n <= 64) state.length = n;
    const w = Number(s.words); if (Number.isInteger(w) && w >= 3 && w <= 8) state.words = w;
    for (const k of ['lower', 'upper', 'digits', 'symbols', 'exclude', 'require', 'cap', 'num']) if (typeof s[k] === 'boolean') state[k] = s[k];
    if (Object.keys(SEPS).includes(s.sep)) state.sep = s.sep;
  }

  /* ---------- render ---------- */
  let refs = {};
  function render() {
    if (!alive) return;
    refs.lenVal.textContent = state.length;
    refs.wordsVal.textContent = state.words;
    const r = current;
    if (!r) { refs.out.textContent = ''; refs.bits.textContent = '—'; refs.strength.textContent = '—'; refs.bar.style.width = '0%'; return; }
    refs.out.textContent = hide ? '•'.repeat(r.value.length) : r.value;
    refs.bits.textContent = t('pw.bits', { n: Math.round(r.bits) });
    const sk = strength(r.bits);
    refs.strength.textContent = t(sk);
    refs.strength.dataset.level = sk.slice(3);
    refs.bar.style.width = U.clamp(Math.round(r.bits / 128 * 100), 4, 100) + '%';
    refs.bar.dataset.level = sk.slice(3);
    refs.hide.innerHTML = (hide ? VT.icons.unlock : VT.icons.lock) + '<span>' + t(hide ? 'pw.show' : 'pw.hide') + '</span>';
    renderHistory();
  }
  function renderHistory() {
    if (!history.length) { refs.hist.innerHTML = '<p class="hint">' + esc(t('pw.hist.empty')) + '</p>'; return; }
    refs.hist.innerHTML = history.map((h, i) =>
      '<div class="pw-hist-row"><code class="pw-hist-val">' + esc(h.value) + '</code>' +
      '<span class="pw-hist-bits mono">' + Math.round(h.bits) + 'b</span>' +
      '<button class="btn btn-ghost btn-icon btn-sm pw-hist-copy" data-i="' + i + '" aria-label="' + esc(t('pw.hist.copy')) + '">' + VT.icons.copy + '</button></div>').join('');
  }

  function generate(push = true) {
    const r = state.mode === 'chars' ? genChars() : genPass();
    if (r.err) { refs.err.textContent = t(r.err); current = null; render(); return false; }
    refs.err.textContent = '';
    current = { value: r.value, bits: r.bits, mode: state.mode };
    if (push) { history.unshift(current); if (history.length > HIST_MAX) history.length = HIST_MAX; }
    render();
    return true;
  }

  /* ---------- mount ---------- */
  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="pw-layout">
        <div class="pw-left">
          <section class="pw-stage glass-2">
            <label class="pw-out-label" for="pw-out">${t('pw.out.label')}</label>
            <div class="pw-out mono" id="pw-out" tabindex="0" aria-live="polite"></div>
            <div class="pw-meter">
              <div class="pw-meter-top"><span class="pw-entropy-label">${t('pw.entropy')}</span>
                <strong id="pw-bits" class="mono">—</strong><span id="pw-strength" class="pw-strength">—</span></div>
              <div class="pw-bar"><i id="pw-bar-i"></i></div>
            </div>
            <div class="export-row">
              <button class="btn btn-primary" id="pw-regen">${I.dice} ${t('pw.generate')}</button>
              <button class="btn" id="pw-copy">${I.copy} ${t('pw.copy')}</button>
              <button class="btn btn-ghost" id="pw-hide">${I.lock} ${t('pw.hide')}</button>
            </div>
            <p class="hint" id="pw-err" role="alert"></p>
            <p class="privacy-line">${I.shield} ${t('pw.privacy')}</p>
          </section>
          <section class="step glass">
            <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('pw.history')}</h3>
              <button class="btn btn-ghost btn-sm pw-hist-clear" id="pw-hist-clear">${I.x} ${t('pw.hist.clear')}</button></div>
            <div id="pw-history"></div>
            <p class="hint">${t('pw.hist.note')}</p>
          </section>
        </div>
        <div class="pw-controls">
          <section class="step glass">
            <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('pw.mode')}</h3></div>
            <div class="tabs pw-mode" role="tablist" aria-label="${t('pw.mode')}" id="pw-mode">
              <button class="tab" role="tab" data-tab="chars" aria-selected="${state.mode === 'chars'}">${t('pw.chars')}</button>
              <button class="tab" role="tab" data-tab="pass" aria-selected="${state.mode === 'pass'}">${t('pw.pass')}</button>
            </div>
            <div data-panel="chars" class="pw-panel">
              <div class="field"><label for="pw-len">${t('pw.length')} · <span id="pw-len-val"></span></label>
                <input type="range" id="pw-len" min="8" max="64" step="1"></div>
              <label class="check-row"><input type="checkbox" id="pw-lower">${t('pw.lower')}</label>
              <label class="check-row"><input type="checkbox" id="pw-upper">${t('pw.upper')}</label>
              <label class="check-row"><input type="checkbox" id="pw-digits">${t('pw.digits')}</label>
              <label class="check-row"><input type="checkbox" id="pw-symbols">${t('pw.symbols')}</label>
              <label class="check-row"><input type="checkbox" id="pw-exclude">${t('pw.exclude')}</label>
              <label class="check-row"><input type="checkbox" id="pw-require">${t('pw.require')}</label>
            </div>
            <div data-panel="pass" class="pw-panel">
              <div class="field"><label for="pw-words">${t('pw.words')} · <span id="pw-words-val"></span></label>
                <input type="range" id="pw-words" min="3" max="8" step="1"></div>
              <div class="field"><label for="pw-sep">${t('pw.sep')}</label>
                <select class="input" id="pw-sep">
                  <option value="dash">${t('pw.sep.dash')}</option><option value="dot">${t('pw.sep.dot')}</option>
                  <option value="under">${t('pw.sep.under')}</option><option value="space">${t('pw.sep.space')}</option>
                  <option value="none">${t('pw.sep.none')}</option>
                </select></div>
              <label class="check-row"><input type="checkbox" id="pw-cap">${t('pw.cap')}</label>
              <label class="check-row"><input type="checkbox" id="pw-num">${t('pw.num')}</label>
            </div>
          </section>
        </div>
      </div>`;

    refs = {
      out: $('#pw-out', root), bits: $('#pw-bits', root), strength: $('#pw-strength', root),
      bar: $('#pw-bar-i', root), err: $('#pw-err', root), hide: $('#pw-hide', root),
      hist: $('#pw-history', root), lenVal: $('#pw-len-val', root), wordsVal: $('#pw-words-val', root)
    };

    VT.ui.tabs($('.pw-controls .step', root), (id) => { state.mode = id; persist(); generate(); });

    const len = $('#pw-len', root); len.value = state.length;
    len.addEventListener('input', () => { state.length = Number(len.value); persist(); generate(); });
    const words = $('#pw-words', root); words.value = state.words;
    words.addEventListener('input', () => { state.words = Number(words.value); persist(); generate(); });
    const sep = $('#pw-sep', root); sep.value = state.sep;
    sep.addEventListener('change', () => { state.sep = sep.value; persist(); generate(); });
    const boolMap = { 'pw-lower': 'lower', 'pw-upper': 'upper', 'pw-digits': 'digits', 'pw-symbols': 'symbols', 'pw-exclude': 'exclude', 'pw-require': 'require', 'pw-cap': 'cap', 'pw-num': 'num' };
    for (const [id, k] of Object.entries(boolMap)) {
      const el = $('#' + id, root); el.checked = state[k];
      el.addEventListener('change', () => { state[k] = el.checked; persist(); generate(); });
    }

    $('#pw-regen', root).addEventListener('click', () => generate());
    $('#pw-copy', root).addEventListener('click', async () => {
      if (!current) return;
      const ok = await U.copyText(current.value);
      toast(t(ok ? 'pw.copied' : 'pw.copyfail'), ok ? 'success' : 'error');
    });
    refs.hide.addEventListener('click', () => { hide = !hide; render(); });
    $('#pw-hist-clear', root).addEventListener('click', () => { history = []; renderHistory(); });
    refs.hist.addEventListener('click', async (e) => {
      const b = e.target.closest('.pw-hist-copy'); if (!b) return;
      const h = history[Number(b.dataset.i)]; if (!h) return;
      const ok = await U.copyText(h.value);
      toast(t(ok ? 'pw.copied' : 'pw.copyfail'), ok ? 'success' : 'error');
    });

    generate();
    return () => { alive = false; };
  }

  function unmount() { alive = false; }

  VT.registry.add(def);
  return def;
})();