window.VT = window.VT || {};

VT.palette = (() => {
  const { $, esc } = VT.utils;
  const t = (k, v) => VT.i18n.t(k, v);
  const I = VT.icons;

  let root = null;
  let listEl = null;
  let inputEl = null;
  let prevFocus = null;
  let items = [];
  let all = [];
  let active = 0;

  function isOpen() { return !!(root && !root.hidden); }

  function fuzzy(text, q) {
    if (!q) return 1;
    const hay = text.toLowerCase();
    const idx = hay.indexOf(q);
    if (idx === 0) return 1000;
    if (idx > 0) return 500 - Math.min(400, idx) + (/[ \/_\-().]/.test(hay[idx - 1]) ? 100 : 0);
    let ti = 0, gaps = 0, last = -2;
    for (const c of q) {
      const f = hay.indexOf(c, ti);
      if (f === -1) return 0;
      if (f > last + 1) gaps += f - last - 1;
      last = f;
      ti = f + 1;
    }
    return Math.max(1, 100 - gaps);
  }

  function catalog() {
    const toolItems = VT.registry.all().map((m) => ({
      kind: 'tool',
      id: m.id,
      title: m.name[VT.i18n.lang] || m.name.en,
      titleAlt: (m.name.en + ' ' + m.name.pt).toLowerCase(),
      sub: m.tagline[VT.i18n.lang] || m.tagline.en,
      icon: I[m.icon] || I.sparkle,
      meta: t('cat.' + m.cat + '.name'),
      hay: [m.id, m.cat, m.name.en, m.name.pt, m.tagline.en, m.tagline.pt, ...(m.tags || [])].join(' ').toLowerCase(),
      run: () => VT.router.go('/tool/' + m.id)
    }));

    const nav = [
      ['/', 'pal.go.home', I.arrowRight],
      ['/library', 'pal.go.library', I.layers],
      ['/docs', 'pal.go.docs', I.book],
      ['/open', 'pal.go.open', I.branch],
      ['/settings', 'pal.go.settings', I.settings]
    ];
    const navItems = nav.map(([path, key, icon]) => ({
      kind: 'action', id: 'go' + path, title: t(key), sub: '', icon, meta: '',
      hay: (key + ' go to ' + path + ' page view').toLowerCase(),
      run: () => VT.router.go(path)
    }));

    const langAction = {
      kind: 'action', id: 'lang', title: t('pal.lang.toggle'), sub: '', icon: I.globe, meta: VT.i18n.lang.toUpperCase(),
      hay: 'language idiom lang switch english portugues toggle idioma',
      run: () => VT.i18n.setLang(VT.i18n.lang === 'en' ? 'pt' : 'en')
    };

    const s = VT.settings.get();
    const styleActions = [
      {
        kind: 'action', id: 'motion', title: s.motion === 'full' ? t('pal.motion.reduce') : t('pal.motion.restore'),
        sub: '', icon: I.sparkle, meta: t('pal.group.style'),
        hay: 'motion animation reduce animations movimento animacoes reducao acessibilidade',
        run: () => { VT.settings.set({ motion: VT.settings.get().motion === 'full' ? 'reduced' : 'full' }); VT.settings.apply(); VT.ui.toast(t('set.motion') + ': ' + (VT.settings.get().motion === 'full' ? t('set.motion.full') : t('set.motion.reduced')), 'success'); }
      },
      {
        kind: 'action', id: 'glass', title: s.glass === 'liquid' ? t('pal.glass.solid') : t('pal.glass.liquid'),
        sub: '', icon: I.image, meta: t('pal.group.style'),
        hay: 'glass liquid solid blur glassmorphism vidro fosco transparente',
        run: () => { VT.settings.set({ glass: VT.settings.get().glass === 'liquid' ? 'solid' : 'liquid' }); VT.settings.apply(); VT.ui.toast(t('set.glass') + ': ' + (VT.settings.get().glass === 'liquid' ? t('set.glass.liquid') : t('set.glass.solid')), 'success'); }
      }
    ];

    return toolItems.concat(navItems, [langAction], styleActions);
  }

  function markTitle(text, q) {
    if (!q) return esc(text);
    const idx = text.toLowerCase().indexOf(q);
    if (idx < 0) return esc(text);
    return esc(text.slice(0, idx)) + '<b class="pal-hit">' + esc(text.slice(idx, idx + q.length)) + '</b>' + esc(text.slice(idx + q.length));
  }

  function score(it, q) {
    if (!q) return 1;
    let total = 0;
    for (const w of q.split(/\s+/)) {
      const s = Math.max(fuzzy(it.title + ' · ' + it.id, w), fuzzy(it.titleAlt + ' ' + it.hay, w) - 1);
      if (s <= 0) return 0;
      total += s;
    }
    return total;
  }

  function filter() {
    const q = (inputEl.value || '').trim().toLowerCase();
    items = all
      .map((it) => ({ it, score: score(it, q) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.it);
    active = 0;
    render(q);
  }

  function render(q) {
    if (!items.length) {
      listEl.innerHTML = '<div class="pal-empty">' + I.search + '<span>' + esc(t('pal.empty', { q: q || '' })) + '</span></div>';
      root.setAttribute('aria-expanded', 'false');
      inputEl.removeAttribute('aria-activedescendant');
      return;
    }
    listEl.innerHTML = items.map((it, i) => `
      <div class="pal-row${i === active ? ' on' : ''}" role="option" id="pal-opt-${i}" aria-selected="${i === active}" data-i="${i}">
        <span class="orb">${it.icon}</span>
        <span class="pal-txt"><span class="pal-title">${markTitle(it.title, q)}</span>${it.sub ? '<span class="pal-sub">' + esc(it.sub) + '</span>' : ''}</span>
        <span class="pal-meta">${it.kind === 'tool' ? esc(it.meta) : esc(it.meta || t('pal.kind.action'))}</span>
      </div>`).join('');
    root.setAttribute('aria-expanded', 'true');
    inputEl.setAttribute('aria-activedescendant', 'pal-opt-' + active);
    const row = $('#pal-opt-' + active, listEl);
    if (row) row.scrollIntoView({ block: 'nearest' });
  }

  function move(d) {
    if (!items.length) return;
    active = (active + d + items.length) % items.length;
    render((inputEl.value || '').trim().toLowerCase());
  }

  function run(i) {
    const it = items[i === undefined ? active : i];
    if (!it) return;
    close();
    it.run();
  }

  function build() {
    if (root) return;
    root = document.createElement('div');
    root.className = 'pal-backdrop';
    root.hidden = true;
    root.innerHTML = `
      <div class="pal glass-3" role="dialog" aria-modal="true" aria-label="${esc(t('pal.title'))}">
        <div class="pal-search">
          ${I.search}
          <input id="pal-input" type="text" autocomplete="off" spellcheck="false"
            role="combobox" aria-expanded="false" aria-controls="pal-list" aria-autocomplete="list"
            placeholder="${esc(t('pal.placeholder'))}" aria-label="${esc(t('pal.title'))}">
          <span class="kbd">Esc</span>
        </div>
        <div class="pal-list" id="pal-list" role="listbox" aria-label="${esc(t('pal.title'))}"></div>
        <div class="pal-foot">
          <span><span class="kbd">↑</span><span class="kbd">↓</span> ${esc(t('pal.foot.nav'))}</span>
          <span><span class="kbd">↵</span> ${esc(t('pal.foot.run'))}</span>
          <span><span class="kbd">Ctrl K</span> ${esc(t('pal.foot.toggle'))}</span>
        </div>
      </div>`;
    $('#modal-root').appendChild(root);
    inputEl = $('#pal-input', root);
    listEl = $('#pal-list', root);

    inputEl.addEventListener('input', filter);
    listEl.addEventListener('mousedown', (e) => {
      const row = e.target.closest('.pal-row');
      if (!row) return;
      e.preventDefault();
      run(Number(row.dataset.i));
    });
    root.addEventListener('mousedown', (e) => { if (e.target === root) close(); });

    root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); run(); }
      else if (e.key === 'Tab') { e.preventDefault(); move(e.shiftKey ? -1 : 1); }
    });
  }

  function open(prefill) {
    build();
    all = catalog();
    root.hidden = false;
    prevFocus = document.activeElement;
    inputEl.value = prefill || '';
    filter();
    requestAnimationFrame(() => inputEl.focus());
  }

  function close() {
    if (!root || root.hidden) return;
    root.hidden = true;
    if (prevFocus && prevFocus.isConnected && prevFocus.focus) prevFocus.focus({ preventScroll: true });
    prevFocus = null;
  }

  function toggle() { isOpen() ? close() : open(); }

  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      toggle();
      return;
    }
    if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      toggle();
      return;
    }
    if (e.key === '?' && !mod && !e.altKey) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (/^(input|textarea|select)$/i.test(tag || '')) return;
      e.preventDefault();
      open();
    }
  }, true);

  return { open, close, toggle, isOpen };
})();
