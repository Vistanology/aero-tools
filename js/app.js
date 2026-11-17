window.VT = window.VT || {};
VT.version = '0.25.0';

VT.settings = (() => {
  const DEFAULTS = { motion: 'full', glass: 'liquid' };
  const get = () => Object.assign({}, DEFAULTS, VT.store.get('settings', {}));
  const set = (patch) => VT.store.set('settings', Object.assign(get(), patch));
  function apply() {
    const s = get();
    document.body.dataset.motion = s.motion;
    document.body.dataset.glass = s.glass;
  }
  return { get, set, apply };
})();

(() => {
  const { $, $$ } = VT.utils;
  const t = (k, v) => VT.i18n.t(k, v);
  const I = VT.icons;

  function renderChrome() {
    $('#topbar').innerHTML = `
      <a class="skip-link" href="#view">${t('nav.skip')}</a>
      <div class="topbar-in">
        <a class="brand-link" href="#/" aria-label="Vistanology Open — ${t('nav.home')}">
          <img class="brand-emblem" src="assets/brand/emblem.svg" alt="" width="45" height="45">
          <span class="brand-name">Vistanology</span><span class="brand-tag">${t('brand.tag')}</span>
        </a>
        <nav class="topnav" id="main-navigation" aria-label="${t('nav.main')}">
          <a href="#/library" data-nav="library">${I.layers}<span>${t('nav.library')}</span></a>
          <a href="#/favorites" data-nav="favorites">${I.star}<span>${t('nav.favorites')}</span></a>
          <a href="#/docs" data-nav="docs">${I.book}<span>${t('nav.docs')}</span></a>
          <a href="#/open" data-nav="open">${I.branch}<span>${t('nav.open')}</span></a>
          <a class="mobile-settings" href="#/settings" data-nav="settings">${I.settings}<span>${t('nav.settings')}</span></a>
        </nav>
        <span class="nav-divider" aria-hidden="true"></span>
        <div class="topbar-right">
          <span class="net-badge" id="net-badge" hidden role="status" aria-live="polite"><span class="net-dot"></span><span class="net-text"></span></span>
          <button class="btn btn-ghost btn-icon" id="cmd-k" data-tip="${t('pal.tip')}" aria-label="${t('pal.tip')}" aria-keyshortcuts="Control+K">${I.search}</button>
          <div class="lang-toggle" role="group" aria-label="Language">
            <button data-lang="en" aria-pressed="${VT.i18n.lang === 'en'}">EN</button>
            <button data-lang="pt" aria-pressed="${VT.i18n.lang === 'pt'}">PT</button>
          </div>
          <a class="btn btn-ghost btn-icon" href="#/settings" data-tip="${t('nav.settings')}" aria-label="${t('nav.settings')}" data-nav="settings">${I.settings}</a>
          <button class="btn btn-ghost btn-icon nav-toggle" id="nav-toggle" type="button" aria-label="${t('nav.menu')}" aria-expanded="false" aria-controls="main-navigation">${I.menu}</button>
        </div>
      </div>`;

    $('#footer').innerHTML = `
      <div class="footer-in">
        <img class="brand-emblem is-sm" src="assets/brand/emblem.svg" alt="" width="22" height="22">
        <span class="mono">v${VT.version}</span>
        <span>${t('footer.license')}</span>
        <span>${t('footer.made')}</span>
        <div class="footer-links">
          <a href="#/library">${t('nav.library')}</a>
          <a href="#/open">${t('nav.open')}</a>
          <a href="#/docs">${t('nav.docs')}</a>
          <a href="#/settings">${t('nav.settings')}</a>
        </div>
      </div>`;

    $$('.lang-toggle button').forEach((b) => b.addEventListener('click', () => VT.i18n.setLang(b.dataset.lang)));
    $('#cmd-k').addEventListener('click', () => { closeNav(); VT.palette.open(); });
    $('#nav-toggle').addEventListener('click', () => {
      const open = $('#nav-toggle').getAttribute('aria-expanded') !== 'true';
      $('#nav-toggle').setAttribute('aria-expanded', String(open));
      $('#topbar').classList.toggle('nav-open', open);
      if (open) $('#main-navigation a').focus();
    });
    $('.skip-link').addEventListener('click', (e) => {
      e.preventDefault();
      $('#view').focus({ preventScroll: true });
      $('#view').scrollIntoView();
    });
    updateNav();
    updateNet();
  }

  function closeNav() {
    $('#topbar').classList.remove('nav-open');
    $('#nav-toggle')?.setAttribute('aria-expanded', 'false');
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('#topbar').classList.contains('nav-open')) {
      closeNav();
      $('#nav-toggle').focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#topbar') || e.target.closest('#main-navigation a, .brand-link')) closeNav();
  });
  document.addEventListener('focusin', (e) => {
    if (!e.target.closest('#topbar')) closeNav();
  });

  function updateNet() {
    const b = $('#net-badge');
    if (!b) return;
    b.hidden = navigator.onLine !== false;
    $('.net-text', b).textContent = t('net.offline');
  }

  function updateNav() {
    const { view, param } = VT.router.current;
    // Uma ferramenta aberta é um lugar dentro da Biblioteca: o item certo da barra
    // fica marcado, e o usuário nunca perde a referência de onde entrou.
    let active = view === 'tool' ? 'library' : view;
    if (view === 'library' && param === 'favorites') active = 'favorites';
    $$('.topnav a').forEach((a) => {
      if (a.dataset.nav === active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const gear = $('.topbar-right [data-nav="settings"]');
    if (gear) { if (view === 'settings') gear.setAttribute('aria-current', 'page'); else gear.removeAttribute('aria-current'); }
  }

  VT.settings.apply();
  renderChrome();

  VT.router.register('hub', VT.shell.hub);
  VT.router.register('library', VT.shell.library);
  VT.router.register('tool', VT.shell.appframe);
  VT.router.register('docs', VT.shell.docs);
  VT.router.register('open', VT.shell.open);
  VT.router.register('settings', VT.shell.settings);

  window.addEventListener('vt:lang', () => { renderChrome(); VT.router.refresh(); });
  window.addEventListener('vt:view', () => { updateNav(); closeNav(); });

  // The chrome reads as scene or as glass depending on whether the page has moved.
  // rAF-throttled and passive: one attribute write, no layout work per event.
  let scrollTick = false;
  const markScroll = () => {
    const on = (window.scrollY || document.documentElement.scrollTop) > 8;
    if (on) document.body.setAttribute('data-scrolled', ''); else document.body.removeAttribute('data-scrolled');
    scrollTick = false;
  };
  window.addEventListener('scroll', () => {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(markScroll);
  }, { passive: true });
  markScroll();

  VT.router.start();

  window.addEventListener('online', updateNet);
  window.addEventListener('offline', updateNet);

  if ('serviceWorker' in navigator) {
    const host = location.hostname;
    const secure = location.protocol === 'https:' || host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    if (secure) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => { /* offline é melhoria, não requisito */ });
      });
    }
  }
})();