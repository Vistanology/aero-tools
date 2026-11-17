window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['text-diff'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'df.a': 'Original', 'df.b': 'Modified', 'df.aPh': 'Paste the original text…', 'df.bPh': 'Paste the modified text…',
      'df.unified': 'Unified', 'df.split': 'Split', 'df.ignws': 'Ignore whitespace', 'df.igncase': 'Ignore case',
      'df.added': 'added', 'df.removed': 'removed', 'df.equal': 'unchanged', 'df.swap': 'Swap', 'df.sample': 'Sample',
      'df.clear': 'Clear', 'df.copy': 'Copy diff', 'df.dl': 'Download .diff', 'df.empty': 'Waiting for two texts…',
      'df.identical': 'Texts are identical', 'df.limited': 'line limit reached', 'df.result': 'Diff',
      'df.copied': 'Copied to clipboard', 'df.copyFail': 'Could not copy — select and copy manually.',
      'df.privacy': 'The diff is computed in your browser with an LCS algorithm. Nothing is uploaded.'
    },
    pt: {
      'df.a': 'Original', 'df.b': 'Modificado', 'df.aPh': 'Cole o texto original…', 'df.bPh': 'Cole o texto modificado…',
      'df.unified': 'Unificado', 'df.split': 'Lado a lado', 'df.ignws': 'Ignorar espaços', 'df.igncase': 'Ignorar maiúsculas',
      'df.added': 'adicionadas', 'df.removed': 'removidas', 'df.equal': 'inalteradas', 'df.swap': 'Inverter', 'df.sample': 'Exemplo',
      'df.clear': 'Limpar', 'df.copy': 'Copiar diff', 'df.dl': 'Baixar .diff', 'df.empty': 'Aguardando dois textos…',
      'df.identical': 'Os textos são idênticos', 'df.limited': 'limite de linhas atingido', 'df.result': 'Diff',
      'df.copied': 'Copiado para a área de transferência', 'df.copyFail': 'Não foi possível copiar — selecione e copie manualmente.',
      'df.privacy': 'O diff é computado no navegador com um algoritmo LCS. Nada é enviado.'
    }
  });

  const def = {
    id: 'text-diff', cat: 'developer', icon: 'diff', version: '1.0.0',
    name: { en: 'Text Diff', pt: 'Diff de Texto' },
    tagline: {
      en: 'Line-level diff of two texts with unified and side-by-side views, ignore whitespace/case, honest add/remove counts and .diff export.',
      pt: 'Diff por linhas de dois textos com visões unificada e lado a lado, ignorar espaços/maiúsculas, contagens honestas e exportação .diff.'
    },
    tags: ['diff', 'compare', 'text', 'lcs', 'patch', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'A local text comparison workbench: paste an original and a modified text and get a line-level LCS diff in unified or side-by-side view, with added/removed/unchanged counts, optional ignore-whitespace and ignore-case, swap, copy and a unified .diff download.',
        usage: [
          'Paste the original (A) and modified (B) texts, or load the sample.',
          'Choose Unified or Split view; toggle ignore whitespace / ignore case.',
          'Read added / removed / unchanged line counts.',
          'Swap A↔B, copy the unified diff, or download it as a .diff file.'
        ],
        privacy: 'The diff runs in memory with an LCS algorithm. Nothing is uploaded; only view and ignore options are persisted.',
        limits: [
          'Comparison is line-based (not word/character level).',
          'Each side is capped at 2000 lines to keep the O(n·m) LCS responsive; excess is truncated and flagged.',
          'Ignore options affect comparison only; displayed lines keep their original formatting.'
        ]
      },
      pt: {
        summary: 'Uma bancada local de comparação: cole um texto original e um modificado e obtenha um diff por linhas (LCS) em visão unificada ou lado a lado, com contagens de adicionadas/removidas/inalteradas, ignorar espaços/maiúsculas opcional, inverter, copiar e baixar .diff unificado.',
        usage: [
          'Cole os textos original (A) e modificado (B), ou carregue o exemplo.',
          'Escolha Unificado ou Lado a lado; alterne ignorar espaços / maiúsculas.',
          'Leia as contagens de linhas adicionadas / removidas / inalteradas.',
          'Inverta A↔B, copie o diff unificado ou baixe como .diff.'
        ],
        privacy: 'O diff roda em memória com um algoritmo LCS. Nada é enviado; só a visão e as opções de ignorar são persistidas.',
        limits: [
          'A comparação é por linhas (não por palavra/caractere).',
          'Cada lado é limitado a 2000 linhas para manter o LCS O(n·m) responsivo; o excesso é truncado e sinalizado.',
          'As opções de ignorar afetam só a comparação; as linhas exibidas mantêm a formatação original.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'text-diff';
  const MAX_LINES = 2000;
  let state = { view: 'unified', ignws: false, igncase: false };
  let refs = {};
  let ops = [];
  let lastDiff = '';

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (['unified', 'split'].includes(s.view)) state.view = s.view;
    if (typeof s.ignws === 'boolean') state.ignws = s.ignws;
    if (typeof s.igncase === 'boolean') state.igncase = s.igncase;
  }

  const key = (line) => {
    let k = line;
    if (state.ignws) k = k.replace(/\s+/g, ' ').trim();
    if (state.igncase) k = k.toLowerCase();
    return k;
  };

  function diffLines(aLines, bLines) {
    const n = aLines.length, m = bLines.length;
    const ka = aLines.map(key), kb = bLines.map(key);
    const w = m + 1;
    const dp = new Int32Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i * w + j] = ka[i] === kb[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
      }
    }
    const out = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (ka[i] === kb[j]) { out.push({ type: 'eq', a: i, b: j, text: aLines[i] }); i++; j++; }
      else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) { out.push({ type: 'del', a: i, b: null, text: aLines[i] }); i++; }
      else { out.push({ type: 'add', a: null, b: j, text: bLines[j] }); j++; }
    }
    while (i < n) { out.push({ type: 'del', a: i, b: null, text: aLines[i] }); i++; }
    while (j < m) { out.push({ type: 'add', a: null, b: j, text: bLines[j] }); j++; }
    return out;
  }

  function unifiedText(list) {
    return list.map(o => (o.type === 'add' ? '+ ' : o.type === 'del' ? '- ' : '  ') + o.text).join('\n');
  }

  function renderOut() {
    if (state.view === 'unified') {
      let oldNo = 0, newNo = 0;
      refs.out.innerHTML = '<div class="df-unified">' + ops.map(o => {
        const a = o.type === 'add' ? '' : ++oldNo;
        const b = o.type === 'del' ? '' : ++newNo;
        const sign = o.type === 'add' ? '+' : o.type === 'del' ? '-' : ' ';
        return '<div class="df-row df-' + o.type + '"><span class="df-no">' + a + '</span><span class="df-no">' + b + '</span>' +
          '<span class="df-sign">' + sign + '</span><span class="df-text">' + esc(o.text) + '</span></div>';
      }).join('') + '</div>';
    } else {
      let left = '', right = '';
      let oldNo = 0, newNo = 0;
      for (const o of ops) {
        if (o.type === 'eq') { oldNo++; newNo++;
          left += '<div class="df-row df-eq"><span class="df-no">' + oldNo + '</span><span class="df-text">' + esc(o.text) + '</span></div>';
          right += '<div class="df-row df-eq"><span class="df-no">' + newNo + '</span><span class="df-text">' + esc(o.text) + '</span></div>';
        } else if (o.type === 'del') { oldNo++;
          left += '<div class="df-row df-del"><span class="df-no">' + oldNo + '</span><span class="df-text">' + esc(o.text) + '</span></div>';
          right += '<div class="df-row df-blank"><span class="df-no"></span><span class="df-text"></span></div>';
        } else { newNo++;
          left += '<div class="df-row df-blank"><span class="df-no"></span><span class="df-text"></span></div>';
          right += '<div class="df-row df-add"><span class="df-no">' + newNo + '</span><span class="df-text">' + esc(o.text) + '</span></div>';
        }
      }
      refs.out.innerHTML = '<div class="df-split"><div class="df-col">' + left + '</div><div class="df-col">' + right + '</div></div>';
    }
  }

  function run() {
    const aRaw = refs.a.value, bRaw = refs.b.value;
    refs.status.className = 'df-status';
    if (!aRaw && !bRaw) {
      refs.status.textContent = t('df.empty');
      ops = []; lastDiff = ''; refs.out.innerHTML = ''; refs.stats.innerHTML = '';
      return;
    }
    let aLines = aRaw.split('\n'), bLines = bRaw.split('\n');
    let limited = false;
    if (aLines.length > MAX_LINES) { aLines = aLines.slice(0, MAX_LINES); limited = true; }
    if (bLines.length > MAX_LINES) { bLines = bLines.slice(0, MAX_LINES); limited = true; }
    ops = diffLines(aLines, bLines);
    const added = ops.filter(o => o.type === 'add').length;
    const removed = ops.filter(o => o.type === 'del').length;
    const equal = ops.filter(o => o.type === 'eq').length;
    if (added || removed) refs.status.classList.add('ok');
    refs.status.textContent = (added || removed ? '+' + added + ' / -' + removed : t('df.identical')) + (limited ? ' · ' + t('df.limited') : '');
    refs.stats.innerHTML =
      '<div><dt>' + t('df.added') + '</dt><dd class="df-add-n">+' + added + '</dd></div>' +
      '<div><dt>' + t('df.removed') + '</dt><dd class="df-del-n">-' + removed + '</dd></div>' +
      '<div><dt>' + t('df.equal') + '</dt><dd>' + equal + '</dd></div>';
    lastDiff = unifiedText(ops);
    renderOut();
  }
  const runSoon = U.debounce(run, 180);

  function mount(root) {
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="df-stage glass-2">
        <div class="df-bar">
          <div id="df-view"><div class="df-tabs" role="tablist" aria-label="${t('df.result')}">
            <button class="tab" role="tab" data-tab="unified" aria-selected="${state.view === 'unified'}">${t('df.unified')}</button>
            <button class="tab" role="tab" data-tab="split" aria-selected="${state.view === 'split'}">${t('df.split')}</button>
          </div></div>
          <label class="df-check"><input type="checkbox" id="df-ignws" ${state.ignws ? 'checked' : ''}> ${t('df.ignws')}</label>
          <label class="df-check"><input type="checkbox" id="df-igncase" ${state.igncase ? 'checked' : ''}> ${t('df.igncase')}</label>
          <span class="df-status" id="df-status"></span>
        </div>
        <div class="df-inputs">
          <div class="df-pane"><label for="df-a">${t('df.a')}</label>
            <textarea class="input df-area" id="df-a" spellcheck="false" placeholder="${t('df.aPh')}"></textarea></div>
          <div class="df-pane"><label for="df-b">${t('df.b')}</label>
            <textarea class="input df-area" id="df-b" spellcheck="false" placeholder="${t('df.bPh')}"></textarea></div>
        </div>
        <div class="df-actions">
          <button class="btn btn-ghost btn-sm" id="df-sample">${I.sparkle} ${t('df.sample')}</button>
          <button class="btn btn-ghost btn-sm" id="df-swap">${I.swap} ${t('df.swap')}</button>
          <button class="btn btn-ghost btn-sm" id="df-clear">${I.x} ${t('df.clear')}</button>
        </div>
        <dl class="df-stats" id="df-stats"></dl>
        <span class="df-label">${t('df.result')}</span>
        <div class="df-out" id="df-out"></div>
        <div class="df-actions">
          <button class="btn btn-ghost btn-sm" id="df-copy">${I.copy} ${t('df.copy')}</button>
          <button class="btn btn-ghost btn-sm" id="df-dl">${I.download} ${t('df.dl')}</button>
        </div>
        <p class="privacy-line">${I.shield} ${t('df.privacy')}</p>
      </div>`;

    refs = { a: $('#df-a', root), b: $('#df-b', root), status: $('#df-status', root), stats: $('#df-stats', root), out: $('#df-out', root) };

    VT.ui.tabs($('#df-view', root), (id) => { state.view = id; persist(); renderOut(); });
    refs.a.addEventListener('input', runSoon);
    refs.b.addEventListener('input', runSoon);
    $('#df-ignws', root).addEventListener('change', (e) => { state.ignws = e.target.checked; persist(); run(); });
    $('#df-igncase', root).addEventListener('change', (e) => { state.igncase = e.target.checked; persist(); run(); });
    $('#df-sample', root).addEventListener('click', () => {
      refs.a.value = 'alpha\nbeta\ngamma\ndelta\nepsilon';
      refs.b.value = 'alpha\nbeta modified\ngamma\nepsilon\nzeta';
      run();
    });
    $('#df-swap', root).addEventListener('click', () => {
      const tmp = refs.a.value; refs.a.value = refs.b.value; refs.b.value = tmp; run();
    });
    $('#df-clear', root).addEventListener('click', () => { refs.a.value = ''; refs.b.value = ''; run(); refs.a.focus(); });
    $('#df-copy', root).addEventListener('click', async () => {
      if (!lastDiff) return;
      const ok = await U.copyText(lastDiff);
      toast(ok ? t('df.copied') : t('df.copyFail'), ok ? 'success' : 'error');
    });
    $('#df-dl', root).addEventListener('click', () => {
      if (!lastDiff) return;
      U.downloadText(lastDiff, 'vistanology.diff', 'text/plain');
    });

    run();
    return () => {};
  }

  function unmount() { ops = []; lastDiff = ''; }

  VT.registry.add(def);
  return def;
})();