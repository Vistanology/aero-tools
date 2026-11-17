window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['json-formatter'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'jf.input': 'Input', 'jf.output': 'Output', 'jf.placeholder': 'Paste or type JSON here…',
      'jf.pretty': 'Pretty', 'jf.min': 'Minified', 'jf.code': 'Code', 'jf.tree': 'Tree',
      'jf.indent': 'Indent', 'jf.sort': 'Sort keys', 'jf.sample': 'Sample', 'jf.clear': 'Clear',
      'jf.copy': 'Copy', 'jf.download': 'Download .json',
      'jf.valid': 'Valid JSON', 'jf.invalid': 'Invalid JSON', 'jf.empty': 'Waiting for JSON…',
      'jf.m.keys': 'Keys', 'jf.m.nodes': 'Nodes', 'jf.m.depth': 'Depth', 'jf.m.size': 'Size',
      'jf.tooBig': 'Too many nodes for the tree view — showing code instead.',
      'jf.copied': 'Copied to clipboard', 'jf.copyFail': 'Could not copy — select and copy manually.',
      'jf.downloaded': 'JSON downloaded', 'jf.privacy': 'Parsing and formatting run entirely in your browser. Nothing is uploaded.',
      'jf.line': 'line', 'jf.col': 'column'
    },
    pt: {
      'jf.input': 'Entrada', 'jf.output': 'Saída', 'jf.placeholder': 'Cole ou digite JSON aqui…',
      'jf.pretty': 'Formatado', 'jf.min': 'Minificado', 'jf.code': 'Código', 'jf.tree': 'Árvore',
      'jf.indent': 'Indentação', 'jf.sort': 'Ordenar chaves', 'jf.sample': 'Exemplo', 'jf.clear': 'Limpar',
      'jf.copy': 'Copiar', 'jf.download': 'Baixar .json',
      'jf.valid': 'JSON válido', 'jf.invalid': 'JSON inválido', 'jf.empty': 'Aguardando JSON…',
      'jf.m.keys': 'Chaves', 'jf.m.nodes': 'Nós', 'jf.m.depth': 'Profundidade', 'jf.m.size': 'Tamanho',
      'jf.tooBig': 'Nós demais para a árvore — mostrando código.',
      'jf.copied': 'Copiado para a área de transferência', 'jf.copyFail': 'Não foi possível copiar — selecione e copie manualmente.',
      'jf.downloaded': 'JSON baixado', 'jf.privacy': 'A leitura e a formatação rodam inteiramente no navegador. Nada é enviado.',
      'jf.line': 'linha', 'jf.col': 'coluna'
    }
  });

  const def = {
    id: 'json-formatter', cat: 'developer', icon: 'braces', version: '1.1.0',
    name: { en: 'JSON Formatter', pt: 'Formatador JSON' },
    tagline: {
      en: 'Validate, pretty-print, minify and sort JSON with live error positions, a syntax-highlighted view and a collapsible tree.',
      pt: 'Valide, formate, minifique e ordene JSON com posição de erro ao vivo, visão com realce de sintaxe e árvore recolhível.'
    },
    tags: ['json', 'format', 'validate', 'minify', 'tree', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'A local JSON workbench: live validation with line/column on error, pretty or minified output with 2/4/tab indent, optional recursive key sorting, syntax-highlighted code and a collapsible tree, plus key/node/depth/size stats and copy/download.',
        usage: [
          'Paste or type JSON in the input pane (or load the sample).',
          'Read the status: valid, or invalid with the exact line and column.',
          'Choose Pretty or Minified, the indent (2 / 4 / tab) and whether to sort keys.',
          'Switch between highlighted Code and a collapsible Tree to inspect structure.',
          'Undo/redo your edits with Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) or the Undo/Redo buttons.',
          'Copy the result or download it as a .json file.'
        ],
        privacy: 'Parsing, formatting and rendering happen in memory only. Nothing is uploaded or stored.',
        limits: [
          'Tree view is capped for very large documents (falls back to code).',
          'Key sorting is recursive and lexicographic; it changes key order, not values.',
          'Comments and trailing commas are rejected (strict JSON), with the error position shown.',
          'Undo history is in-memory only (never saved) and coalesces typing bursts into one step; it resets when you leave the tool.'
        ]
      },
      pt: {
        summary: 'Uma bancada JSON local: validação ao vivo com linha/coluna no erro, saída formatada ou minificada com indentação 2/4/tab, ordenação recursiva opcional de chaves, código com realce de sintaxe e árvore recolhível, mais estatísticas de chaves/nós/profundidade/tamanho e copiar/baixar.',
        usage: [
          'Cole ou digite JSON no painel de entrada (ou carregue o exemplo).',
          'Leia o status: válido, ou inválido com a linha e coluna exatas.',
          'Escolha Formatado ou Minificado, a indentação (2 / 4 / tab) e se ordena chaves.',
          'Alterne entre Código realçado e Árvore recolhível para inspecionar a estrutura.',
          'Desfaça/refaça edições com Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) ou os botões Desfazer/Refazer.',
          'Copie o resultado ou baixe como arquivo .json.'
        ],
        privacy: 'Leitura, formatação e renderização ocorrem apenas em memória. Nada é enviado ou armazenado.',
        limits: [
          'A árvore é limitada para documentos muito grandes (recorre ao código).',
          'A ordenação de chaves é recursiva e lexicográfica; muda a ordem, não os valores.',
          'Comentários e vírgulas finais são rejeitados (JSON estrito), com a posição do erro.',
          'O histórico de desfazer fica só em memória (nunca é salvo) e agrupa rajadas de digitação em um passo; é reiniciado ao sair da ferramenta.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'json-formatter';
  let alive = false;
  let state = { indent: '2', sort: false, mode: 'pretty', view: 'code' };
  let lastText = '';
  let refs = {};
  let hist = null;

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (['2', '4', 'tab'].includes(s.indent)) state.indent = s.indent;
    if (typeof s.sort === 'boolean') state.sort = s.sort;
    if (['pretty', 'min'].includes(s.mode)) state.mode = s.mode;
    if (['code', 'tree'].includes(s.view)) state.view = s.view;
  }

  const sortDeep = (x) => Array.isArray(x) ? x.map(sortDeep)
    : (x && typeof x === 'object' ? Object.keys(x).sort().reduce((o, k) => (o[k] = sortDeep(x[k]), o), {}) : x);

  function stats(v) {
    let keys = 0, nodes = 0, depth = 0;
    const walk = (x, d) => {
      nodes++; if (d > depth) depth = d;
      if (Array.isArray(x)) x.forEach((y) => walk(y, d + 1));
      else if (x && typeof x === 'object') { const ks = Object.keys(x); keys += ks.length; ks.forEach((k) => walk(x[k], d + 1)); }
    };
    walk(v, 1);
    return { keys, nodes, depth };
  }

  function highlight(src) {
    const re = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      const tok = m[0];
      let cls = 'num';
      if (tok[0] === '"') cls = /:$/.test(tok) ? 'key' : 'str';
      else if (/^(?:true|false|null)$/.test(tok)) cls = 'lit';
      out += '<span class="jf-' + cls + '">' + esc(tok) + '</span>';
      last = m.index + tok.length;
    }
    return out + esc(src.slice(last));
  }

  const leaf = (key, cls, txt) => '<div class="jf-leaf">' + (key !== undefined ? '<span class="jf-key">' + esc(String(key)) + '</span>: ' : '') + '<span class="jf-' + cls + '">' + esc(txt) + '</span></div>';
  function tree(v, key) {
    const label = key !== undefined ? '<span class="jf-key">' + esc(String(key)) + '</span>: ' : '';
    if (v === null) return leaf(key, 'lit', 'null');
    if (Array.isArray(v)) {
      if (!v.length) return leaf(key, 'punc', '[]');
      return '<details open><summary>' + label + '<span class="jf-punc">[</span><span class="jf-count">' + v.length + '</span></summary><div class="jf-kids">' + v.map((x, i) => tree(x, i)).join('') + '</div><span class="jf-punc">]</span></details>';
    }
    if (typeof v === 'object') {
      const ks = Object.keys(v);
      if (!ks.length) return leaf(key, 'punc', '{}');
      return '<details open><summary>' + label + '<span class="jf-punc">{</span><span class="jf-count">' + ks.length + '</span></summary><div class="jf-kids">' + ks.map((k) => tree(v[k], k)).join('') + '</div><span class="jf-punc">}</span></details>';
    }
    if (typeof v === 'string') return leaf(key, 'str', JSON.stringify(v));
    if (typeof v === 'boolean') return leaf(key, 'lit', String(v));
    return leaf(key, 'num', String(v));
  }

  function findError(s) {
    let i = 0; const n = s.length;
    const ws = () => { while (i < n && /\s/.test(s[i])) i++; };
    const fail = () => { throw i; };
    const isD = (c) => c >= '0' && c <= '9';
    function str() {
      if (s[i] !== '"') fail(); i++;
      while (i < n) { const c = s[i]; if (c === '\\') { i += 2; continue; } if (c === '"') { i++; return; } if (c === '\n') fail(); i++; }
      fail();
    }
    function num() {
      if (s[i] === '-') i++;
      if (!isD(s[i])) fail();
      while (i < n && isD(s[i])) i++;
      if (s[i] === '.') { i++; if (!isD(s[i])) fail(); while (i < n && isD(s[i])) i++; }
      if (s[i] === 'e' || s[i] === 'E') { i++; if (s[i] === '+' || s[i] === '-') i++; if (!isD(s[i])) fail(); while (i < n && isD(s[i])) i++; }
    }
    function val() {
      ws(); const c = s[i];
      if (c === '"') return str();
      if (c === '{') {
        i++; ws(); if (s[i] === '}') { i++; return; }
        for (;;) { ws(); if (s[i] !== '"') fail(); str(); ws(); if (s[i] !== ':') fail(); i++; val(); ws(); if (s[i] === ',') { i++; continue; } if (s[i] === '}') { i++; return; } fail(); }
      }
      if (c === '[') {
        i++; ws(); if (s[i] === ']') { i++; return; }
        for (;;) { val(); ws(); if (s[i] === ',') { i++; continue; } if (s[i] === ']') { i++; return; } fail(); }
      }
      if (c === 't') { if (s.startsWith('true', i)) { i += 4; return; } fail(); }
      if (c === 'f') { if (s.startsWith('false', i)) { i += 5; return; } fail(); }
      if (c === 'n') { if (s.startsWith('null', i)) { i += 4; return; } fail(); }
      if (c === '-' || isD(c)) return num();
      fail();
    }
    try { val(); ws(); if (i !== n) fail(); return -1; }
    catch (e) { return typeof e === 'number' ? e : -1; }
  }

  function errPos(msg, src) {
    const m = /position (\d+)/i.exec(msg);
    let idx = m ? +m[1] : findError(src);
    if (idx < 0) return null;
    idx = Math.min(idx, src.length);
    const upto = src.slice(0, idx);
    return { line: upto.split('\n').length, col: idx - upto.lastIndexOf('\n') };
  }

  function process() {
    if (!alive) return;
    const raw = refs.input.value;
    refs.status.className = 'jf-status';
    if (!raw.trim()) {
      refs.status.textContent = t('jf.empty');
      refs.err.hidden = true;
      refs.out.innerHTML = '';
      refs.stats.hidden = true;
      lastText = '';
      return;
    }
    let val;
    try { val = JSON.parse(raw); }
    catch (e) {
      const pos = errPos(e.message, raw);
      refs.status.classList.add('bad');
      refs.status.textContent = t('jf.invalid');
      refs.err.hidden = false;
      refs.err.textContent = e.message + (pos ? ` (${t('jf.line')} ${pos.line}, ${t('jf.col')} ${pos.col})` : '');
      refs.out.innerHTML = '';
      refs.stats.hidden = true;
      lastText = '';
      return;
    }
    refs.err.hidden = true;
    refs.status.classList.add('ok');
    refs.status.textContent = t('jf.valid');
    const sorted = state.sort ? sortDeep(val) : val;
    const indent = state.indent === 'tab' ? '\t' : Number(state.indent);
    lastText = state.mode === 'min' ? JSON.stringify(sorted) : JSON.stringify(sorted, null, indent);
    const st = stats(sorted);
    refs.stats.hidden = false;
    refs.stats.innerHTML =
      '<div><dt>' + t('jf.m.keys') + '</dt><dd>' + st.keys + '</dd></div>' +
      '<div><dt>' + t('jf.m.nodes') + '</dt><dd>' + st.nodes + '</dd></div>' +
      '<div><dt>' + t('jf.m.depth') + '</dt><dd>' + st.depth + '</dd></div>' +
      '<div><dt>' + t('jf.m.size') + '</dt><dd>' + U.formatBytes(new Blob([lastText]).size) + '</dd></div>';
    if (state.view === 'tree') {
      refs.out.innerHTML = st.nodes > 4000
        ? '<p class="hint">' + esc(t('jf.tooBig')) + '</p><pre class="jf-code">' + highlight(lastText) + '</pre>'
        : '<div class="jf-tree">' + tree(sorted) + '</div>';
    } else {
      refs.out.innerHTML = '<pre class="jf-code">' + highlight(lastText) + '</pre>';
    }
  }
  const processSoon = U.debounce(process, 180);

  const SAMPLE = JSON.stringify({
    project: 'Vistanology Open', local: true, tools: 31,
    categories: ['creative', 'generators', 'media', 'developer'],
    author: { name: 'Nuwget', site: 'https://example.invalid' },
    nested: { a: [1, 2, { b: null }] }
  }, null, 2);

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="jf-stage glass-2">
        <div class="jf-bar">
          <div id="jf-mode"><div class="jf-tabs" role="tablist" aria-label="${t('jf.output')}">
            <button class="tab" role="tab" data-tab="pretty" aria-selected="${state.mode === 'pretty'}">${t('jf.pretty')}</button>
            <button class="tab" role="tab" data-tab="min" aria-selected="${state.mode === 'min'}">${t('jf.min')}</button>
          </div></div>
          <div id="jf-view"><div class="jf-tabs" role="tablist" aria-label="${t('jf.output')}">
            <button class="tab" role="tab" data-tab="code" aria-selected="${state.view === 'code'}">${I.code} ${t('jf.code')}</button>
            <button class="tab" role="tab" data-tab="tree" aria-selected="${state.view === 'tree'}">${I.branch} ${t('jf.tree')}</button>
          </div></div>
          <div class="field jf-indent"><label for="jf-indent">${t('jf.indent')}</label>
            <select class="input" id="jf-indent"><option value="2">2</option><option value="4">4</option><option value="tab">tab</option></select></div>
          <label class="jf-sort"><input type="checkbox" id="jf-sort"> ${t('jf.sort')}</label>
          <span class="jf-status" id="jf-status"></span>
        </div>
        <p class="jf-err" id="jf-err" hidden role="alert"></p>
        <div class="jf-panes">
          <div class="jf-pane">
            <div class="jf-pane-head"><span>${t('jf.input')}</span>
              <span class="jf-pane-actions">
                <button class="btn btn-ghost btn-sm" id="jf-sample">${I.sparkle} ${t('jf.sample')}</button>
                <button class="btn btn-ghost btn-sm" id="jf-clear">${I.x} ${t('jf.clear')}</button>
                <span class="jf-actions-sep" aria-hidden="true"></span>
                <button class="btn btn-ghost btn-sm" id="jf-undo" data-tip="${t('hist.undo.tip')}" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
                <button class="btn btn-ghost btn-sm" id="jf-redo" data-tip="${t('hist.redo.tip')}" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
              </span></div>
            <textarea class="jf-input" id="jf-input" spellcheck="false" placeholder="${t('jf.placeholder')}" aria-label="${t('jf.input')}"></textarea>
          </div>
          <div class="jf-pane">
            <div class="jf-pane-head"><span>${t('jf.output')}</span>
              <span class="jf-pane-actions">
                <button class="btn btn-ghost btn-sm" id="jf-copy">${I.copy} ${t('jf.copy')}</button>
                <button class="btn btn-ghost btn-sm" id="jf-dl">${I.download} ${t('jf.download')}</button>
              </span></div>
            <div class="jf-out" id="jf-out" aria-live="polite"></div>
          </div>
        </div>
        <dl class="jf-stats" id="jf-stats" hidden></dl>
        <p class="privacy-line">${I.shield} ${t('jf.privacy')}</p>
      </div>`;

    refs = {
      input: $('#jf-input', root), out: $('#jf-out', root), status: $('#jf-status', root),
      err: $('#jf-err', root), stats: $('#jf-stats', root)
    };

    VT.ui.tabs($('#jf-mode', root), (id) => { state.mode = id; persist(); process(); });
    VT.ui.tabs($('#jf-view', root), (id) => { state.view = id; persist(); process(); });
    const ind = $('#jf-indent', root); ind.value = state.indent;
    ind.addEventListener('change', () => { state.indent = ind.value; persist(); process(); });
    const sort = $('#jf-sort', root); sort.checked = state.sort;
    sort.addEventListener('change', () => { state.sort = sort.checked; persist(); process(); });

    hist = VT.history.create({ apply: (val) => { refs.input.value = val; process(); syncHist(); } });
    hist.reset(refs.input.value);
    const recordSoon = U.debounce(() => { hist.record(refs.input.value); syncHist(); }, 500);
    function syncHist() {
      const u = $('#jf-undo', root), r = $('#jf-redo', root);
      if (u) u.disabled = !hist.canUndo();
      if (r) r.disabled = !hist.canRedo();
    }

    refs.input.addEventListener('input', () => { processSoon(); recordSoon(); });
    refs.input.addEventListener('keydown', (e) => { hist.onKey(e); syncHist(); });
    $('#jf-sample', root).addEventListener('click', () => { refs.input.value = SAMPLE; process(); hist.record(SAMPLE); syncHist(); });
    $('#jf-clear', root).addEventListener('click', () => { refs.input.value = ''; process(); hist.record(''); syncHist(); refs.input.focus(); });
    $('#jf-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); refs.input.focus(); });
    $('#jf-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); refs.input.focus(); });
    $('#jf-copy', root).addEventListener('click', async () => {
      if (!lastText) return;
      const ok = await U.copyText(lastText);
      toast(ok ? t('jf.copied') : t('jf.copyFail'), ok ? 'success' : 'error');
    });
    $('#jf-dl', root).addEventListener('click', () => {
      if (!lastText) return;
      U.downloadText(lastText, 'vistanology.json', 'application/json');
      toast(t('jf.downloaded'), 'success');
    });

    process();
    syncHist();
    return () => { alive = false; };
  }

  function unmount() { alive = false; lastText = ''; hist = null; }

  VT.registry.add(def);
  return def;
})();