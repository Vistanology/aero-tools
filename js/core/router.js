window.VT = window.VT || {};

VT.router = (() => {
  const routes = {};
  let current = { view: 'hub', param: null };
  let currentApp = null;
  let cleanup = null;

  function register(view, fn) { routes[view] = fn; }

  function parse() {
    const h = location.hash.replace(/^#/, '') || '/';
    const parts = h.split('/').filter(Boolean);
    if (!parts.length) return { view: 'library', param: null };
    if (parts[0] === 'about') return { view: 'hub', param: null };
    const [v, p] = parts;
    if (v === 'tool') return { view: 'tool', param: p || null };
    if (v === 'docs') return { view: 'docs', param: p || null };
    // Favoritos é uma vista da Biblioteca, não uma segunda biblioteca: entra como
    // parâmetro para que o substrato, o palco e o CSS de [data-view="library"] sejam
    // os mesmos, e a única coisa que mude seja o recorte do acervo.
    if (v === 'favorites') return { view: 'library', param: 'favorites' };
    if (['library', 'modules', 'open', 'settings'].includes(v)) return { view: v, param: null };
    return { view: 'hub', param: null };
  }

  function render() {
    const { view, param } = parse();
    if (cleanup) { try { cleanup(); } catch { /* view teardown */ } cleanup = null; }
    if (currentApp) {
      try { if (currentApp.unmount) currentApp.unmount(); } catch { /* app teardown */ }
      currentApp = null;
    }
    const el = VT.utils.$('#view');
    el.innerHTML = '';
    document.body.dataset.view = view === 'tool' ? 'app' : view;
    const fn = routes[view] || routes.hub;
    const c = fn(el, param);
    if (typeof c === 'function') cleanup = c;
    current = { view, param };

    const t = VT.i18n.t;
    const titles = {
      hub: 'Vistanology Open — ' + t('hub.title1') + ' ' + t('hub.title2'),
      library: (param === 'favorites' ? t('nav.favorites') : t('lib.title')) + ' — Vistanology Open',
      docs: t('docs.title') + ' — Vistanology Open',
      modules: t('mod.title') + ' — Vistanology Open',
      open: t('open.title') + ' — Vistanology Open',
      settings: t('set.title') + ' — Vistanology Open'
    };
    if (view === 'tool') {
      const m = VT.registry.get(param);
      document.title = (m ? m.name[VT.i18n.lang] : t('app.notfound.title')) + ' — Vistanology Open';
    } else {
      document.title = titles[view] || titles.hub;
    }

    window.scrollTo({ top: 0 });
    const h = el.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    window.dispatchEvent(new CustomEvent('vt:view'));
  }

  function go(path) { location.hash = path; }
  function refresh() { render(); }
  function start() {
    window.addEventListener('hashchange', render);
    render();
  }
  function setCurrentApp(a) { currentApp = a; }

  return { register, go, refresh, start, parse, setCurrentApp, get current() { return current; } };
})();