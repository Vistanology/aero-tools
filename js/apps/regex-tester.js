window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['regex-tester'] = (() => {
  const U = VT.utils;
  const { $, $$, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'rx.pattern': 'Pattern', 'rx.patternPh': 'e.g. (\\w+)@(\\w+\\.\\w+)', 'rx.flags': 'Flags',
      'rx.test': 'Test text', 'rx.testPh': 'Paste the text to search…', 'rx.stage': 'Live matches',
      'rx.matches': 'Matches', 'rx.groups': 'groups', 'rx.time': 'time', 'rx.matchList': 'Match detail',
      'rx.replace': 'Replacement', 'rx.replacePh': 'e.g. $2/$1 or [$&]', 'rx.result': 'Replace result',
      'rx.copy': 'Copy', 'rx.copyMatches': 'Copy matches', 'rx.sample': 'Sample', 'rx.clear': 'Clear',
      'rx.empty': 'Waiting for a pattern…', 'rx.invalid': 'Invalid regex', 'rx.noMatch': 'No matches',
      'rx.ok': 'matches', 'rx.okOne': 'match', 'rx.copied': 'Copied to clipboard', 'rx.copyFail': 'Could not copy — select and copy manually.',
      'rx.privacy': 'Matching and replacing run entirely in your browser. Nothing is uploaded.',
      'rx.more': 'more', 'rx.limited': 'match limit reached', 'rx.none': '—'
    },
    pt: {
      'rx.pattern': 'Padrão', 'rx.patternPh': 'ex.: (\\w+)@(\\w+\\.\\w+)', 'rx.flags': 'Flags',
      'rx.test': 'Texto de teste', 'rx.testPh': 'Cole o texto a pesquisar…', 'rx.stage': 'Matches ao vivo',
      'rx.matches': 'Matches', 'rx.groups': 'grupos', 'rx.time': 'tempo', 'rx.matchList': 'Detalhe dos matches',
      'rx.replace': 'Substituição', 'rx.replacePh': 'ex.: $2/$1 ou [$&]', 'rx.result': 'Resultado da substituição',
      'rx.copy': 'Copiar', 'rx.copyMatches': 'Copiar matches', 'rx.sample': 'Exemplo', 'rx.clear': 'Limpar',
      'rx.empty': 'Aguardando um padrão…', 'rx.invalid': 'Regex inválida', 'rx.noMatch': 'Sem matches',
      'rx.ok': 'matches', 'rx.okOne': 'match', 'rx.copied': 'Copiado para a área de transferência', 'rx.copyFail': 'Não foi possível copiar — selecione e copie manualmente.',
      'rx.privacy': 'A busca e a substituição rodam inteiramente no navegador. Nada é enviado.',
      'rx.more': 'mais', 'rx.limited': 'limite de matches atingido', 'rx.none': '—'
    }
  });

  const def = {
    id: 'regex-tester', cat: 'developer', icon: 'regex', version: '1.0.0',
    name: { en: 'Regex Tester', pt: 'Testador de Regex' },
    tagline: {
      en: 'Live regular-expression workbench: highlighted matches, capture groups, flags and a replace preview with honest timing.',
      pt: 'Bancada de expressões regulares ao vivo: matches destacados, grupos de captura, flags e prévia de substituição com tempo honesto.'
    },
    tags: ['regex', 'regexp', 'match', 'replace', 'groups', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'A local regex workbench: type a pattern and flags, paste test text and see every match highlighted live with its index and capture groups; a replacement field previews String.replace output. Invalid patterns report the engine error; timing is measured, not guessed.',
        usage: [
          'Type a pattern (without slashes) and toggle flags g/i/m/s/u/y.',
          'Paste test text; matches highlight live and are listed with index and groups.',
          'Read match count, capture-group count and measured execution time.',
          'Enter a replacement template ($1, $&, $$) to preview the replace result.',
          'Copy the replace result or the match list.'
        ],
        privacy: 'Matching and replacing happen in memory only. Only the flag selection is persisted; pattern and text are never stored.',
        limits: [
          'Matching is capped at 500 matches and test text at 50 000 characters to keep the UI responsive.',
          'JavaScript regex is synchronous; a catastrophically backtracking pattern can still block the UI briefly.',
          'Zero-length matches are advanced by one code unit to avoid infinite loops.'
        ]
      },
      pt: {
        summary: 'Uma bancada de regex local: digite um padrão e flags, cole o texto de teste e veja cada match destacado ao vivo com índice e grupos de captura; um campo de substituição pré-visualiza a saída de String.replace. Padrões inválidos reportam o erro do motor; o tempo é medido, não estimado.',
        usage: [
          'Digite um padrão (sem barras) e alterne as flags g/i/m/s/u/y.',
          'Cole o texto de teste; os matches destacam-se ao vivo e são listados com índice e grupos.',
          'Leia a contagem de matches, de grupos de captura e o tempo de execução medido.',
          'Informe um modelo de substituição ($1, $&, $$) para pré-visualizar o resultado.',
          'Copie o resultado da substituição ou a lista de matches.'
        ],
        privacy: 'Busca e substituição ocorrem apenas em memória. Só a seleção de flags é persistida; padrão e texto nunca são armazenados.',
        limits: [
          'A busca é limitada a 500 matches e o texto de teste a 50 000 caracteres para manter a UI responsiva.',
          'Regex em JavaScript é síncrono; um padrão com backtracking catastrófico ainda pode bloquear a UI brevemente.',
          'Matches de comprimento zero avançam uma unidade de código para evitar loops infinitos.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'regex-tester';
  const FLAG_ORDER = ['g', 'i', 'm', 's', 'u', 'y'];
  const MAX_MATCHES = 500;
  const MAX_TEXT = 50000;
  let state = { flags: { g: true, i: false, m: false, s: false, u: false, y: false } };
  let refs = {};
  let lastResult = '', lastMatchesText = '';

  function persist() { VT.store.set(KEY, { flags: state.flags }); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object' || !s.flags || typeof s.flags !== 'object') return;
    for (const f of FLAG_ORDER) if (typeof s.flags[f] === 'boolean') state.flags[f] = s.flags[f];
  }

  const flagString = () => FLAG_ORDER.filter(f => state.flags[f]).join('');

  function collect(re, text) {
    const matches = [];
    const t0 = performance.now();
    if (re.global || re.sticky) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text)) !== null) {
        matches.push(m);
        if (m[0] === '') re.lastIndex++;
        if (matches.length >= MAX_MATCHES) break;
        if (re.lastIndex > text.length) break;
      }
    } else {
      const m = re.exec(text);
      if (m) matches.push(m);
    }
    const ms = performance.now() - t0;
    return { matches, ms };
  }

  function highlight(text, matches) {
    let html = '', pos = 0;
    for (const m of matches) {
      const start = m.index, end = start + m[0].length;
      if (start < pos) continue;
      html += esc(text.slice(pos, start));
      html += m[0].length ? '<mark class="rx-mark">' + esc(m[0]) + '</mark>' : '<mark class="rx-mark rx-zero"></mark>';
      pos = end;
    }
    html += esc(text.slice(pos));
    return html;
  }

  function run() {
    const pattern = refs.pattern.value;
    const text = refs.test.value.slice(0, MAX_TEXT);
    refs.status.className = 'rx-status';
    if (!pattern) {
      refs.status.textContent = t('rx.empty');
      refs.stage.innerHTML = esc(text);
      refs.stats.innerHTML = '';
      refs.matchList.innerHTML = '';
      refs.result.textContent = '';
      lastResult = ''; lastMatchesText = '';
      return;
    }
    let re;
    try { re = new RegExp(pattern, flagString()); }
    catch (e) {
      refs.status.classList.add('bad');
      refs.status.textContent = t('rx.invalid') + ': ' + e.message;
      refs.stage.innerHTML = esc(text);
      refs.stats.innerHTML = '';
      refs.matchList.innerHTML = '';
      refs.result.textContent = '';
      lastResult = ''; lastMatchesText = '';
      return;
    }
    const { matches, ms } = collect(re, text);
    const limited = matches.length >= MAX_MATCHES;
    refs.status.classList.add(matches.length ? 'ok' : 'bad');
    refs.status.textContent = matches.length
      ? matches.length + (limited ? '+' : '') + ' ' + t(matches.length === 1 && !limited ? 'rx.okOne' : 'rx.ok') + (limited ? ' · ' + t('rx.limited') : '')
      : t('rx.noMatch');
    refs.stage.innerHTML = highlight(text, matches);

    const groupCount = matches.length ? matches[0].length - 1 : 0;
    refs.stats.innerHTML =
      '<div><dt>' + t('rx.matches') + '</dt><dd>' + matches.length + (limited ? '+' : '') + '</dd></div>' +
      '<div><dt>' + t('rx.groups') + '</dt><dd>' + groupCount + '</dd></div>' +
      '<div><dt>' + t('rx.time') + '</dt><dd>' + ms.toFixed(1) + ' ms</dd></div>';

    refs.matchList.innerHTML = matches.map((m, i) => {
      let groups = '';
      for (let g = 1; g < m.length; g++) {
        groups += '<div class="rx-group"><span>$' + g + '</span><code>' + esc(m[g] === undefined ? t('rx.none') : m[g]) + '</code></div>';
      }
      if (m.groups) for (const k of Object.keys(m.groups)) {
        groups += '<div class="rx-group"><span>' + esc(k) + '</span><code>' + esc(m.groups[k] === undefined ? t('rx.none') : m.groups[k]) + '</code></div>';
      }
      return '<div class="rx-match"><div class="rx-match-head"><span class="rx-idx">#' + (i + 1) + '</span>' +
        '<span class="rx-pos">@' + m.index + '</span></div>' +
        '<code class="rx-full">' + esc(m[0] === '' ? '∅' : m[0]) + '</code>' +
        (groups ? '<div class="rx-groups">' + groups + '</div>' : '') + '</div>';
    }).join('');
    lastMatchesText = matches.map((m, i) => '#' + (i + 1) + ' @' + m.index + ' ' + m[0]).join('\n');

    const repl = refs.repl.value;
    if (repl) {
      try { lastResult = text.replace(re, repl); }
      catch { lastResult = ''; }
    } else lastResult = '';
    refs.result.textContent = lastResult;
  }
  const runSoon = U.debounce(run, 150);

  function mount(root) {
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="rx-stage glass-2">
        <div class="rx-bar">
          <div class="rx-patternwrap"><label class="rx-label" for="rx-pattern">${t('rx.pattern')}</label>
            <input class="input rx-pattern" id="rx-pattern" spellcheck="false" placeholder="${t('rx.patternPh')}"></div>
          <div class="rx-flags" role="group" aria-label="${t('rx.flags')}">
            ${FLAG_ORDER.map(f => `<label class="rx-flag"><input type="checkbox" data-flag="${f}" ${state.flags[f] ? 'checked' : ''}><span>${f}</span></label>`).join('')}
          </div>
        </div>
        <span class="rx-status" id="rx-status"></span>
        <div class="rx-panes">
          <div class="rx-pane">
            <label class="rx-label" for="rx-test">${t('rx.test')}</label>
            <textarea class="input rx-test" id="rx-test" spellcheck="false" placeholder="${t('rx.testPh')}"></textarea>
            <div class="rx-actions">
              <button class="btn btn-ghost btn-sm" id="rx-sample">${I.sparkle} ${t('rx.sample')}</button>
              <button class="btn btn-ghost btn-sm" id="rx-clear">${I.x} ${t('rx.clear')}</button>
            </div>
            <label class="rx-label" for="rx-repl">${t('rx.replace')}</label>
            <input class="input rx-repl" id="rx-repl" spellcheck="false" placeholder="${t('rx.replacePh')}">
          </div>
          <div class="rx-pane">
            <span class="rx-label">${t('rx.stage')}</span>
            <pre class="rx-highlight" id="rx-stage"></pre>
            <dl class="rx-stats" id="rx-stats"></dl>
            <span class="rx-label">${t('rx.matchList')}</span>
            <div class="rx-matchlist" id="rx-matches"></div>
            <span class="rx-label">${t('rx.result')}</span>
            <div class="rx-outrow"><pre class="rx-result" id="rx-result"></pre>
              <button class="btn btn-ghost btn-sm" id="rx-copy-result">${I.copy} ${t('rx.copy')}</button></div>
            <button class="btn btn-ghost btn-sm" id="rx-copy-matches">${I.copy} ${t('rx.copyMatches')}</button>
          </div>
        </div>
        <p class="privacy-line">${I.shield} ${t('rx.privacy')}</p>
      </div>`;

    refs = {
      pattern: $('#rx-pattern', root), test: $('#rx-test', root), status: $('#rx-status', root),
      stage: $('#rx-stage', root), stats: $('#rx-stats', root), matchList: $('#rx-matches', root),
      repl: $('#rx-repl', root), result: $('#rx-result', root)
    };

    refs.pattern.addEventListener('input', runSoon);
    refs.test.addEventListener('input', runSoon);
    refs.repl.addEventListener('input', runSoon);
    $$('.rx-flag input', root).forEach(cb => cb.addEventListener('change', () => {
      state.flags[cb.dataset.flag] = cb.checked; persist(); run();
    }));
    $('#rx-sample', root).addEventListener('click', () => {
      refs.pattern.value = '(\\w+)@(\\w+\\.\\w+)';
      refs.test.value = 'Contact ana@vistanology.dev or bruno@open.dev for details.';
      refs.repl.value = '$2/$1';
      run();
    });
    $('#rx-clear', root).addEventListener('click', () => {
      refs.pattern.value = ''; refs.test.value = ''; refs.repl.value = ''; run(); refs.pattern.focus();
    });
    $('#rx-copy-result', root).addEventListener('click', async () => {
      if (!lastResult) return;
      const ok = await U.copyText(lastResult);
      toast(ok ? t('rx.copied') : t('rx.copyFail'), ok ? 'success' : 'error');
    });
    $('#rx-copy-matches', root).addEventListener('click', async () => {
      if (!lastMatchesText) return;
      const ok = await U.copyText(lastMatchesText);
      toast(ok ? t('rx.copied') : t('rx.copyFail'), ok ? 'success' : 'error');
    });

    run();
    return () => {};
  }

  function unmount() { lastResult = ''; lastMatchesText = ''; }

  VT.registry.add(def);
  return def;
})();