window.VT = window.VT || {};
VT.shell = VT.shell || {};

VT.shell.appframe = (el, id) => {
  const t = VT.i18n.t, L = VT.i18n.lang, I = VT.icons;
  const m = VT.registry.get(id);

  if (!m) {
    el.innerHTML = `<div class="empty" style="margin-top:40px">${I.alert}<strong>${t('app.notfound.title')}</strong>${t('app.notfound.body')}<a class="btn btn-primary" style="margin-top:12px" href="#/library">${I.arrowLeft} ${t('nav.library')}</a></div>`;
    return;
  }

  VT.recents.push(m.id);
  const cat = VT.cats.find((c) => c.id === m.cat);

  el.innerHTML = `
    <header class="app-masthead">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="#/library">${t('nav.library')}</a><span class="sep">/</span>
        <a href="#/library" data-cat="${m.cat}">${t('cat.' + m.cat + '.name')}</a><span class="sep">/</span>
        <span class="here">${m.name[L]}</span>
      </nav>
      <div class="app-head">
        <span class="orb orb-lg">${I[m.icon]}</span>
        <div class="ah-text">
          <h1 class="app-title">${m.name[L]}</h1>
          <p class="app-tag">${m.tagline[L]}</p>
        </div>
        <div class="app-actions">
          <span class="local-seal">${I.shield} ${t('app.local')}</span>
          <span class="badge badge-aqua">v${m.version}</span>
          <a class="btn btn-sm" href="#/docs/${m.id}">${I.book} ${t('app.docs')}</a>
          <button class="btn btn-icon btn-sm" id="af-fav" aria-pressed="${VT.favs.has(m.id)}" data-tip="${t(VT.favs.has(m.id) ? 'app.fav.remove' : 'app.fav.add')}" aria-label="${t(VT.favs.has(m.id) ? 'app.fav.remove' : 'app.fav.add')}">${VT.favs.has(m.id) ? I.starFill : I.star}</button>
        </div>
      </div>
    </header>
    <div class="app-body" id="app-body"></div>`;

  VT.utils.$('[data-cat]', el).addEventListener('click', (e) => {
    e.preventDefault();
    Object.assign(VT.shell.libraryState, { cat: m.cat, fav: false, recent: false, q: '' });
    VT.router.go('/library');
  });

  const fav = VT.utils.$('#af-fav', el);
  fav.addEventListener('click', () => {
    const on = VT.favs.toggle(m.id);
    fav.setAttribute('aria-pressed', on);
    fav.innerHTML = on ? I.starFill : I.star;
    fav.dataset.tip = t(on ? 'app.fav.remove' : 'app.fav.add');
    fav.setAttribute('aria-label', fav.dataset.tip);
  });

  const body = VT.utils.$('#app-body', el);
  m.mount(body);
  VT.router.setCurrentApp({ unmount: m.unmount });
};