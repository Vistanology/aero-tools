window.VT = window.VT || {};
VT.shell = VT.shell || {};

VT.shell.libraryState = { q: '', cat: 'all', fav: false, sort: 'collection', recent: false };

VT.shell.library = (el, param) => {
  const t = VT.i18n.t, L = VT.i18n.lang, I = VT.icons, R = VT.registry;
  const S = VT.shell.libraryState;
  S.fav = param === 'favorites';
  if (S.fav) S.recent = false;
  const PLATES = VT.shell.WORLD_IMG;
  const stageImg = (cat) => (PLATES[cat] || 'stage-all') + '.webp';

  el.innerHTML = `
    <div class="lib-stage ocean rim" id="lib-stage" data-cat="${S.cat}">
      <img class="ls-img" src="assets/images/${stageImg(S.cat)}" alt="" aria-hidden="true" loading="lazy">
      <div class="ls-copy">
        <p class="eyebrow"><a href="#/about">Vistanology</a> · ${t('lib.eyebrow')}</p>
        <h1>${t('lib.title')}</h1>
        <p class="ls-sub">${t('lib.sub')}</p>
      </div>
      <span class="mono" id="lib-count" role="status" aria-live="polite" aria-atomic="true"></span>
    </div>
    <div class="search-bar ocean-2">
      ${I.search}
      <input id="lib-q" type="search" placeholder="${t('lib.search')}" value="${VT.utils.esc(S.q)}" aria-label="${t('lib.search')}">
      <span class="kbd">/</span>
    </div>
    <div class="chips" id="lib-chips" role="group" aria-label="${t('lib.title')}">
      <button class="chip" type="button" data-cat="all">${t('lib.all')}</button>
      ${VT.cats.map((c) => `<button class="chip" type="button" data-cat="${c.id}">${t('cat.' + c.id + '.name')}</button>`).join('')}
      <button class="chip" type="button" data-fav="1">${I.star} ${t('lib.favorites')}</button>
    </div>
    <div class="aero-tube" aria-hidden="true"></div>
    <div class="lib-controls">
      <label class="field" for="lib-sort">
        <span>${t('lib.sort')}</span>
        <select class="input" id="lib-sort">
          <option value="collection">${t('lib.sort.collection')}</option>
          <option value="az">${t('lib.sort.az')}</option>
          <option value="recent">${t('lib.sort.recent')}</option>
        </select>
      </label>
      <button class="chip" type="button" id="lib-recent">${t('lib.recents')}</button>
    </div>
    <div class="tool-grid" id="lib-grid"></div>`;

  const grid = VT.utils.$('#lib-grid', el);
  const count = VT.utils.$('#lib-count', el);
  const stage = VT.utils.$('#lib-stage', el);
  const search = VT.utils.$('#lib-q', el);
  const sort = VT.utils.$('#lib-sort', el);
  const recent = VT.utils.$('#lib-recent', el);
  sort.value = S.sort;

  function syncStage() {
    const cat = S.fav || S.recent ? 'all' : S.cat;
    stage.dataset.cat = cat;
    VT.utils.$('.ls-img', stage).src = 'assets/images/' + stageImg(cat);
    stage.querySelector('h1').textContent = S.fav ? t('hub.favorites') : (S.recent ? t('hub.recents') : (cat === 'all' ? t('lib.title') : t('cat.' + cat + '.name')));
    stage.querySelector('.ls-sub').textContent = S.recent ? t('lib.recents.sub') : (cat === 'all' ? t('lib.sub') : t('cat.' + cat + '.desc'));
    VT.utils.$$('#lib-chips .chip', el).forEach((c) => {
      c.setAttribute('aria-pressed', c.dataset.fav ? S.fav : (!S.fav && !S.recent && c.dataset.cat === S.cat));
    });
    recent.setAttribute('aria-pressed', S.recent);
  }

  function results() {
    const recents = VT.recents.list();
    const matches = R.search(S.q);
    let list = S.recent ? recents.map((id) => R.get(id)).filter((m) => m && matches.includes(m)) : matches;
    if (S.fav) list = list.filter((m) => VT.favs.has(m.id));
    else if (!S.recent && S.cat !== 'all') list = list.filter((m) => m.cat === S.cat);
    if (S.sort === 'az') list.sort((a, b) => a.name[L].localeCompare(b.name[L], L));
    else if (S.sort === 'recent') {
      const rank = new Map(recents.map((id, i) => [id, i]));
      list.sort((a, b) => (rank.get(a.id) ?? recents.length) - (rank.get(b.id) ?? recents.length));
    }
    return list;
  }

  function showCollection(fav) {
    const path = fav ? '/favorites' : '/library';
    if (location.hash !== '#' + path) VT.router.go(path);
    else renderGrid();
  }

  function renderGrid() {
    syncStage();
    const list = results();
    count.textContent = t(list.length === 1 ? 'lib.count.one' : 'lib.count', { n: list.length });
    if (!list.length) {
      const favEmpty = S.fav && !VT.favs.list().some((id) => R.get(id));
      const recentEmpty = S.recent && !VT.recents.list().some((id) => R.get(id));
      const cleared = favEmpty ? 'fav' : (recentEmpty ? 'recent' : (S.q ? 'q' : (!S.fav && !S.recent && S.cat !== 'all' ? 'cat' : '')));
      const emptyKey = favEmpty ? 'lib.empty.fav' : (recentEmpty ? 'lib.empty.recent' : 'lib.empty');
      const actionKey = cleared === 'fav' || cleared === 'recent' ? 'lib.empty.act.all' : (cleared === 'cat' ? 'lib.empty.act.category' : 'lib.empty.act.clear');
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">
        ${favEmpty ? I.star : I.search}
        <strong>${t(emptyKey + '.title')}</strong>
        ${t(emptyKey + '.body')}
        ${cleared ? `<button class="btn btn-ghost btn-sm" id="lib-empty-act" type="button">${I.arrowLeft} ${t(actionKey)}</button>` : ''}
      </div>`;
      const btn = VT.utils.$('#lib-empty-act', grid);
      if (btn) btn.addEventListener('click', () => {
        if (cleared === 'fav' || cleared === 'recent') {
          Object.assign(S, { recent: false, cat: 'all', q: '' });
          search.value = '';
          showCollection(false);
          return;
        }
        if (cleared === 'q') S.q = '';
        else S.cat = 'all';
        search.value = S.q;
        renderGrid();
        search.focus();
      });
      return;
    }
    grid.innerHTML = list.map((m, i) => `
      <div class="tool-tile" data-id="${m.id}" data-cat="${m.cat}" style="--i:${i}">
        <a class="tt-link" href="#/tool/${m.id}" aria-label="${VT.utils.esc(m.name[L])}">
          <div class="tt-crest">
            <span class="tt-mark" aria-hidden="true">${I[m.icon]}</span>
            <span class="tt-cat">${t('cat.' + m.cat + '.name')}</span>
          </div>
          <div class="tt-body">
            <div class="tt-top">
              <span class="orb">${I[m.icon]}</span>
              <span><span class="tt-name">${m.name[L]}</span><br><span class="tt-tag">${m.tagline[L]}</span></span>
            </div>
            <div class="tt-meta">
              <span class="badge badge-aqua">v${m.version}</span>
              <span class="local-seal">${I.shield} ${t('app.local')}</span>
            </div>
            <span class="tt-open">${t('lib.open')} ${I.arrowRight}</span>
          </div>
        </a>
        <button class="btn btn-ghost btn-icon btn-sm tt-fav" type="button" data-fav-id="${m.id}" aria-pressed="${VT.favs.has(m.id)}" data-tip="${t(VT.favs.has(m.id) ? 'app.fav.remove' : 'app.fav.add')}" aria-label="${t(VT.favs.has(m.id) ? 'app.fav.remove' : 'app.fav.add')}">${VT.favs.has(m.id) ? I.starFill : I.star}</button>
      </div>`).join('');

    VT.utils.$$('.tt-fav', grid).forEach((b, index) => {
      b.addEventListener('click', () => {
        const on = VT.favs.toggle(b.dataset.favId);
        b.setAttribute('aria-pressed', on);
        b.innerHTML = on ? I.starFill : I.star;
        b.dataset.tip = t(on ? 'app.fav.remove' : 'app.fav.add');
        b.setAttribute('aria-label', b.dataset.tip);
        if (S.fav) {
          renderGrid();
          const remaining = VT.utils.$$('.tt-fav', grid);
          (remaining[Math.min(index, remaining.length - 1)] || search).focus();
        }
      });
    });
  }

  search.addEventListener('input', (e) => { S.q = e.target.value; renderGrid(); });
  sort.addEventListener('change', (e) => { S.sort = e.target.value; renderGrid(); });
  recent.addEventListener('click', () => {
    S.recent = !S.recent;
    showCollection(false);
  });
  VT.utils.$$('#lib-chips .chip', el).forEach((chip) => {
    chip.addEventListener('click', () => {
      S.recent = false;
      if (chip.dataset.fav) showCollection(!S.fav);
      else {
        S.cat = chip.dataset.cat;
        showCollection(false);
      }
    });
  });

  const onKey = (e) => {
    const target = document.activeElement;
    if (e.key === '/' && !e.defaultPrevented && !e.isComposing && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !target?.isContentEditable && !/^(input|textarea|select)$/i.test(target?.tagName || '')) {
      e.preventDefault();
      search.focus();
    }
  };
  document.addEventListener('keydown', onKey);

  renderGrid();
  return () => document.removeEventListener('keydown', onKey);
};
