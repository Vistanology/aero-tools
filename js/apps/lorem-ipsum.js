window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['lorem-ipsum'] = (() => {
  const U = VT.utils;
  const { $, esc, clamp } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'li.unit': 'Unit', 'li.paragraphs': 'Paragraphs', 'li.sentences': 'Sentences', 'li.words': 'Words',
      'li.count': 'How many', 'li.classic': 'Start with “Lorem ipsum dolor sit amet…”',
      'li.seed': 'Seed', 'li.seed.ph': 'empty = random each time', 'li.roll': 'Roll a random seed',
      'li.seed.hint': 'Same seed + same settings = identical text. Leave empty for a fresh draw on every generate.',
      'li.output': 'Output', 'li.wrap': 'Wrap', 'li.wrap.none': 'Plain text', 'li.wrap.p': 'HTML <p> paragraphs',
      'li.view.preview': 'Preview', 'li.view.source': 'Source',
      'li.generate': 'Generate', 'li.copy': 'Copy', 'li.copied': '{n} words copied', 'li.copyfail': 'Could not copy',
      'li.dl.txt': 'Download .txt', 'li.dl.html': 'Download .html', 'li.out.label': 'Placeholder text',
      'li.m.paras': 'Paragraphs', 'li.m.sents': 'Sentences', 'li.m.words': 'Words', 'li.m.chars': 'Characters',
      'li.privacy': 'Built-in wordlist, generated in your browser. Nothing stored, nothing sent.'
    },
    pt: {
      'li.unit': 'Unidade', 'li.paragraphs': 'Parágrafos', 'li.sentences': 'Frases', 'li.words': 'Palavras',
      'li.count': 'Quantos', 'li.classic': 'Começar com “Lorem ipsum dolor sit amet…”',
      'li.seed': 'Semente', 'li.seed.ph': 'vazio = aleatório a cada vez', 'li.roll': 'Sortear uma semente',
      'li.seed.hint': 'Mesma semente + mesmas configurações = texto idêntico. Deixe vazio para um sorteio novo a cada gerar.',
      'li.output': 'Saída', 'li.wrap': 'Envoltório', 'li.wrap.none': 'Texto puro', 'li.wrap.p': 'Parágrafos HTML <p>',
      'li.view.preview': 'Prévia', 'li.view.source': 'Código',
      'li.generate': 'Gerar', 'li.copy': 'Copiar', 'li.copied': '{n} palavras copiadas', 'li.copyfail': 'Não foi possível copiar',
      'li.dl.txt': 'Baixar .txt', 'li.dl.html': 'Baixar .html', 'li.out.label': 'Texto de preenchimento',
      'li.m.paras': 'Parágrafos', 'li.m.sents': 'Frases', 'li.m.words': 'Palavras', 'li.m.chars': 'Caracteres',
      'li.privacy': 'Lista de palavras embutida, gerada no seu navegador. Nada armazenado, nada enviado.'
    }
  });

  const def = {
    id: 'lorem-ipsum', cat: 'generators', icon: 'text', version: '1.0.0',
    name: { en: 'Lorem Ipsum Generator', pt: 'Gerador de Lorem Ipsum' },
    tagline: {
      en: 'Placeholder prose by paragraphs, sentences or words — classic opening, reproducible seeds and HTML &lt;p&gt; wrapping, generated locally.',
      pt: 'Texto de preenchimento por parágrafos, frases ou palavras — abertura clássica, sementes reproduzíveis e envoltório HTML &lt;p&gt;, gerado localmente.'
    },
    tags: ['lorem', 'ipsum', 'placeholder', 'dummy', 'filler', 'text', 'seed', 'html'],
    deps: [],
    docs: {
      en: {
        summary: 'Generate lorem ipsum placeholder text by paragraphs, sentences or words. Optional classic opening, a seed for reproducible output, and plain-text or HTML &lt;p&gt; wrapping. Preview as editorial prose or inspect the exact export source.',
        usage: [
          'Pick the unit (paragraphs / sentences / words) and how many.',
          'Optionally start with the classic “Lorem ipsum dolor sit amet…” opening.',
          'Set a seed to make the output reproducible, or roll a random one; empty means a fresh draw each generate.',
          'Choose plain text or HTML &lt;p&gt; wrapping; switch Preview / Source to see prose or the exact payload.',
          'Copy the payload or download it as .txt / .html.'
        ],
        privacy: 'Text is assembled from a built-in wordlist with a seeded PRNG (or crypto.getRandomValues when unseeded). Nothing is stored or sent.',
        limits: [
          'Counts are clamped per unit: paragraphs 1–10, sentences 1–20, words 1–300.',
          'A seed reproduces text only while unit, count, classic-opening and wrap stay the same.',
          'The wordlist is the classic Cicero-derived lorem vocabulary; it is not real Latin prose.',
          'Only settings persist; the generated text is memory-only and regenerated on reload.'
        ]
      },
      pt: {
        summary: 'Gere texto de preenchimento lorem ipsum por parágrafos, frases ou palavras. Abertura clássica opcional, semente para saída reproduzível e envoltório em texto puro ou HTML &lt;p&gt;. Prévia como prosa editorial ou o código exato da exportação.',
        usage: [
          'Escolha a unidade (parágrafos / frases / palavras) e quantos.',
          'Opcionalmente comece com a abertura clássica “Lorem ipsum dolor sit amet…”.',
          'Defina uma semente para reproduzir a saída, ou sorteie uma; vazio significa sorteio novo a cada gerar.',
          'Escolha texto puro ou envoltório HTML &lt;p&gt;; alterne Prévia / Código para ver a prosa ou o payload exato.',
          'Copie o payload ou baixe como .txt / .html.'
        ],
        privacy: 'O texto é montado a partir de uma lista de palavras embutida com PRNG semeado (ou crypto.getRandomValues sem semente). Nada é armazenado ou enviado.',
        limits: [
          'Quantidades limitadas por unidade: parágrafos 1–10, frases 1–20, palavras 1–300.',
          'Uma semente reproduz o texto apenas enquanto unidade, quantidade, abertura clássica e envoltório permanecem iguais.',
          'A lista é o vocabulário lorem clássico derivado de Cícero; não é prosa latina real.',
          'Só as configurações persistem; o texto gerado vive na memória e é regenerado no reload.'
        ]
      }
    },
    mount, unmount
  };

  const RAW = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum ' +
    'ut enim ad minima veniam quis nostrum exercitationem ullam corporis suscipit laboriosam nisi aliquid ex ea commodi consequatur quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur vel illum qui dolorem eum fugiat quo voluptas nulla pariatur ' +
    'at vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident similique sunt in culpa qui officia deserunt mollitia animi id est laborum et dolorum fuga ' +
    'et harum quidem rerum facilis est et expedita distinctio nam libero tempore cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus omnis voluptas assumenda est omnis dolor repellendus ' +
    'temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae itaque earum rerum hic tenetur a sapiente delectus ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat';
  const WORDS = [...new Set(RAW.split(/\s+/))];
  const CLASSIC_SENTENCE = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
  const CLASSIC_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'.split(' ');
  const RANGES = { paragraphs: [1, 10], sentences: [1, 20], words: [1, 300] };

  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return (h ^= h >>> 16) >>> 0; };
  }
  function mulberry32(a) {
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
  }
  function makeRng(seedStr) {
    if (!seedStr) { const b = new Uint32Array(1); crypto.getRandomValues(b); return mulberry32(b[0]); }
    return mulberry32(xmur3(seedStr)());
  }
  const ri = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

  function sentence(rng) {
    const n = ri(rng, 6, 14);
    const ws = [];
    for (let i = 0; i < n; i++) ws.push(pick(rng, WORDS));
    const commaAt = rng() < 0.45 ? ri(rng, 2, n - 3) : -1;
    const s = ws.map((w, i) => (i === commaAt ? w + ',' : w)).join(' ');
    return s[0].toUpperCase() + s.slice(1) + '.';
  }

  let alive = false;
  let paras = [];
  let state = { unit: 'paragraphs', count: 3, classic: true, seed: '', wrap: 'none', view: 'preview' };

  const KEY = 'lorem-ipsum';
  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (Object.keys(RANGES).includes(s.unit)) state.unit = s.unit;
    const [mn, mx] = RANGES[state.unit];
    const n = Number(s.count); if (Number.isInteger(n) && n >= mn && n <= mx) state.count = n;
    if (typeof s.classic === 'boolean') state.classic = s.classic;
    if (typeof s.seed === 'string') state.seed = s.seed.slice(0, 64);
    if (['none', 'p'].includes(s.wrap)) state.wrap = s.wrap;
    if (['preview', 'source'].includes(s.view)) state.view = s.view;
  }

  function plainText() { return paras.map((ss) => ss.join(' ')).join('\n\n'); }
  function payload() {
    if (state.wrap === 'p') return paras.map((ss) => '<p>' + esc(ss.join(' ')) + '</p>').join('\n');
    return plainText();
  }

  let refs = {};
  function render() {
    if (!alive) return;
    const plain = plainText();
    refs.prose.innerHTML = paras.map((ss) => '<p>' + esc(ss.join(' ')) + '</p>').join('');
    refs.src.value = payload();
    refs.mParas.textContent = paras.length;
    refs.mSents.textContent = state.unit === 'words' ? 0 : paras.reduce((a, ss) => a + ss.length, 0);
    refs.mWords.textContent = plain.trim() ? plain.trim().split(/\s+/).length : 0;
    refs.mChars.textContent = plain.length;
    refs.countVal.textContent = state.count;
    refs.dl.innerHTML = VT.icons.download + ' ' + (state.wrap === 'p' ? t('li.dl.html') : t('li.dl.txt'));
  }
  function generate() {
    const rng = makeRng(state.seed.trim());
    paras = [];
    if (state.unit === 'words') {
      const ws = state.classic ? CLASSIC_WORDS.slice(0, state.count) : [];
      while (ws.length < state.count) ws.push(pick(rng, WORDS));
      const s = ws.join(' ');
      paras = [[s[0].toUpperCase() + s.slice(1)]];
    } else {
      const paraCount = state.unit === 'paragraphs' ? state.count : 1;
      const fixedSentences = state.unit === 'sentences' ? state.count : 0;
      for (let p = 0; p < paraCount; p++) {
        const k = fixedSentences || ri(rng, 3, 6);
        const ss = [];
        for (let i = 0; i < k; i++) ss.push(state.classic && p === 0 && i === 0 ? CLASSIC_SENTENCE : sentence(rng));
        paras.push(ss);
      }
    }
    render();
  }

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    const [mn, mx] = RANGES[state.unit];
    root.innerHTML = `
      <div class="li-layout">
        <div class="li-left">
          <section class="li-stage glass-2">
            <div id="li-view-field">
              <div class="li-bar">
                <span class="pw-out-label">${t('li.out.label')}</span>
                <div class="tabs li-view" role="tablist" aria-label="${t('li.output')}">
                  <button class="tab" role="tab" data-tab="preview" aria-selected="${state.view === 'preview'}">${t('li.view.preview')}</button>
                  <button class="tab" role="tab" data-tab="source" aria-selected="${state.view === 'source'}">${t('li.view.source')}</button>
                </div>
              </div>
              <div class="li-prose" data-panel="preview" id="li-prose"></div>
              <textarea class="input mono li-src" data-panel="source" id="li-src" readonly rows="12" spellcheck="false"></textarea>
            </div>
            <dl class="li-metrics">
              <div><dt>${t('li.m.paras')}</dt><dd id="li-m-paras"></dd></div>
              <div><dt>${t('li.m.sents')}</dt><dd id="li-m-sents"></dd></div>
              <div><dt>${t('li.m.words')}</dt><dd id="li-m-words"></dd></div>
              <div><dt>${t('li.m.chars')}</dt><dd id="li-m-chars"></dd></div>
            </dl>
            <div class="export-row">
              <button class="btn btn-primary" id="li-regen">${I.dice} ${t('li.generate')}</button>
              <button class="btn" id="li-copy">${I.copy} ${t('li.copy')}</button>
              <button class="btn" id="li-dl"></button>
            </div>
            <p class="privacy-line">${I.shield} ${t('li.privacy')}</p>
          </section>
        </div>
        <div class="li-controls">
          <section class="step glass" id="li-unit-step">
            <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('li.unit')}</h3></div>
            <div class="tabs li-unit" role="tablist" aria-label="${t('li.unit')}">
              <button class="tab" role="tab" data-tab="paragraphs" aria-selected="${state.unit === 'paragraphs'}">${t('li.paragraphs')}</button>
              <button class="tab" role="tab" data-tab="sentences" aria-selected="${state.unit === 'sentences'}">${t('li.sentences')}</button>
              <button class="tab" role="tab" data-tab="words" aria-selected="${state.unit === 'words'}">${t('li.words')}</button>
            </div>
            <div class="field"><label for="li-count">${t('li.count')} · <span id="li-count-val"></span></label>
              <input type="range" id="li-count" min="${mn}" max="${mx}" step="1"></div>
            <label class="check-row"><input type="checkbox" id="li-classic">${t('li.classic')}</label>
          </section>
          <section class="step glass">
            <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('li.seed')}</h3></div>
            <div class="li-seed-row">
              <input class="input mono" id="li-seed" type="text" maxlength="64" placeholder="${t('li.seed.ph')}" spellcheck="false" autocomplete="off">
              <button class="btn" id="li-roll" aria-label="${t('li.roll')}" title="${t('li.roll')}">${I.dice}</button>
            </div>
            <p class="hint">${t('li.seed.hint')}</p>
          </section>
          <section class="step glass">
            <div class="step-head"><span class="step-num">03</span><h3 class="step-title">${t('li.output')}</h3></div>
            <div class="field"><label for="li-wrap">${t('li.wrap')}</label>
              <select class="input" id="li-wrap"><option value="none">${t('li.wrap.none')}</option><option value="p"></option></select></div>
          </section>
        </div>
      </div>`;

    refs = {
      prose: $('#li-prose', root), src: $('#li-src', root), countVal: $('#li-count-val', root), dl: $('#li-dl', root),
      mParas: $('#li-m-paras', root), mSents: $('#li-m-sents', root), mWords: $('#li-m-words', root), mChars: $('#li-m-chars', root)
    };
    $('#li-wrap option[value="p"]', root).textContent = t('li.wrap.p');

    VT.ui.tabs($('#li-view-field', root), (id) => { state.view = id; persist(); });
    VT.ui.tabs($('#li-unit-step', root), (id) => {
      state.unit = id;
      const [a, b] = RANGES[id];
      state.count = clamp(state.count, a, b);
      const c = $('#li-count', root); c.min = a; c.max = b; c.value = state.count;
      persist(); generate();
    });
    const count = $('#li-count', root); count.value = state.count;
    count.addEventListener('input', () => {
      const [a, b] = RANGES[state.unit];
      state.count = clamp(Number(count.value), a, b); persist(); generate();
    });
    const cl = $('#li-classic', root); cl.checked = state.classic;
    cl.addEventListener('change', () => { state.classic = cl.checked; persist(); generate(); });
    const seed = $('#li-seed', root); seed.value = state.seed;
    seed.addEventListener('input', () => { state.seed = seed.value; persist(); generate(); });
    $('#li-roll', root).addEventListener('click', () => {
      const b = new Uint8Array(4); crypto.getRandomValues(b);
      state.seed = Array.from(b, (x) => x.toString(36)).join('').slice(0, 6);
      seed.value = state.seed; persist(); generate();
    });
    const wr = $('#li-wrap', root); wr.value = state.wrap;
    wr.addEventListener('change', () => { state.wrap = wr.value; persist(); render(); });
    $('#li-regen', root).addEventListener('click', generate);
    $('#li-copy', root).addEventListener('click', async () => {
      const ok = await U.copyText(payload());
      toast(ok ? t('li.copied', { n: refs.mWords.textContent }) : t('li.copyfail'), ok ? 'success' : 'error');
    });
    $('#li-dl', root).addEventListener('click', () => {
      const html = state.wrap === 'p';
      U.downloadText(payload(), html ? 'vistanology-lorem-ipsum.html' : 'vistanology-lorem-ipsum.txt', html ? 'text/html' : 'text/plain');
    });
    generate();
    return () => { alive = false; };
  }
  function unmount() { alive = false; }

  VT.registry.add(def);
  return def;
})();