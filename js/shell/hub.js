window.VT = window.VT || {};
VT.shell = VT.shell || {};

// Each studio is presented as a place; the plate carries that mood.
// One distinct image per category — never the same picture twice.
// Shared with the Library stage band.
VT.shell.WORLD_IMG = {
  creative: 'cat-creative', generators: 'cat-generators', media: 'cat-media',
  developer: 'cat-developer', productivity: 'cat-productivity', documents: 'cat-documents'
};

// Editorial mosaic: the six plates are deliberately unequal in weight.
const WORLD_SIZE = { creative: 'is-feature', developer: 'w-wide', productivity: 'w-half', documents: 'w-half' };

VT.shell.hub = (el) => {
  const t = VT.i18n.t, L = VT.i18n.lang, I = VT.icons, R = VT.registry;
  const favs = VT.favs.list().map((id) => R.get(id)).filter(Boolean);
  const recents = VT.recents.list().map((id) => R.get(id)).filter(Boolean);
  const WORLD_IMG = VT.shell.WORLD_IMG;

  const strip = (title, items) => items.length ? `
    <section class="hub-section">
      <div class="section-head"><h2>${title}</h2><div class="rule"></div></div>
      <div class="strip" style="margin-top:16px">
        ${items.map((m) => `
          <a class="strip-tile glass rim" data-cat="${m.cat}" href="#/tool/${m.id}">
            <span class="orb orb-sm">${I[m.icon]}</span>
            <span><span class="st-name">${m.name[L]}</span><br><span class="st-cat">${t('cat.' + m.cat + '.name')}</span></span>
          </a>`).join('')}
      </div>
    </section>` : '';

  el.innerHTML = `
    <section class="hero">
      <img class="hero-img" src="assets/images/hero-aero.webp" alt="" aria-hidden="true" fetchpriority="high">
      <div class="hero-veil"></div>
      <div class="hero-content">
        <p class="hero-kicker">${t('hub.kicker')}</p>
        <h1 class="hero-title">${t('hub.title1')}<em>${t('hub.title2')}</em></h1>
        <p class="hero-sub">${t('hub.sub')}</p>
        <div class="seals">
          <span class="seal">${I.check} ${t('hub.seal.free')}</span>
          <span class="seal">${I.branch} ${t('hub.seal.open')}</span>
          <span class="seal">${I.shield} ${t('hub.seal.privacy')}</span>
        </div>
        <div class="hero-cta">
          <a class="btn btn-primary" href="#/library">${t('hub.cta.library')} ${I.arrowRight}</a>
          <a class="btn btn-field" href="#/docs">${I.book} ${t('hub.cta.docs')}</a>
        </div>
        <p class="hero-badge">${I.lock} ${t('aero.hero.badge')}</p>
        <form class="hub-search" role="search">
          <input class="input" id="hub-q" type="search" aria-label="${t('hub.search')}" placeholder="${t('lib.search')}">
          <button class="btn btn-field" type="submit">${I.search} ${t('hub.search')}</button>
        </form>
      </div>
    </section>

    <div class="hero-stats">
      <div class="hero-stat is-accent"><span class="hs-v">${R.all().length}</span><span class="hs-k">${t('aero.stat.tools')}</span></div>
      <div class="hero-stat"><span class="hs-v">100%</span><span class="hs-k">${t('aero.stat.local')}</span></div>
      <div class="hero-stat"><span class="hs-v">0</span><span class="hs-k">${t('aero.stat.bytes')}</span></div>
    </div>

    <section class="hub-section">
      <div class="section-head"><h2>${t('hub.featured')}</h2><div class="rule"></div></div>
      <p class="section-sub">${t('hub.featured.sub')}</p>
      <div class="featured-grid">
        ${['data-workspace', 'page-builder', 'image-studio'].map((id) => R.get(id)).filter(Boolean).map((m) => `
          <a class="featured-tool" href="#/tool/${m.id}" data-cat="${m.cat}">
            <span class="orb orb-field">${I[m.icon]}</span>
            <h3>${m.name[L]}</h3>
            <p>${t('hub.featured.' + m.id)}</p>
            <span class="ft-open">${t('lib.open')} ${I.arrowRight}</span>
          </a>`).join('')}
      </div>
    </section>

    <section class="hub-section">
      <div class="section-head"><span class="section-num">01</span><h2>${t('hub.collection')}</h2><div class="rule"></div><span class="mono">${t('hub.tools', { n: R.all().length })}</span></div>
      <p class="section-sub">${t('aero.worlds.sub')}</p>
      <div class="world-grid">
        ${VT.cats.map((c) => {
          const n = R.byCat(c.id).length;
          const size = WORLD_SIZE[c.id] ? ' ' + WORLD_SIZE[c.id] : '';
          return `
          <a class="world-card${size}" data-cat="${c.id}" href="#/library">
            <img class="world-img" src="assets/images/${WORLD_IMG[c.id]}.webp" alt="" aria-hidden="true" loading="lazy">
            <div class="world-veil"></div>
            <div class="world-top"></div>
            <span class="orb orb-sm orb-field world-orb">${I[c.icon]}</span>
            <div class="world-body">
              <span class="world-num">${c.num}</span>
              <span class="world-name">${t('cat.' + c.id + '.name')}</span>
              <span class="world-desc">${t('cat.' + c.id + '.desc')}</span>
              <span class="world-foot">
                <span class="world-count">${t(n === 1 ? 'hub.count.one' : 'hub.count', { n })}</span>
                ${I.arrowRight}
              </span>
            </div>
          </a>`;
        }).join('')}
      </div>
    </section>

    ${strip(t('hub.favorites'), favs)}
    ${strip(t('hub.recents'), recents)}

    <section class="hub-section">
      <div class="section-head"><span class="section-num">02</span><h2>${t('hub.principles')}</h2><div class="rule"></div></div>
      <div class="principles">
        <div class="principle"><span class="p-lead">${t('hub.p1.lead')}</span><p>${t('hub.p1.body')}</p></div>
        <div class="principle"><span class="p-lead">${t('hub.p2.lead')}</span><p>${t('hub.p2.body')}</p></div>
        <div class="principle"><span class="p-lead">${t('hub.p3.lead')}</span><p>${t('hub.p3.body')}</p></div>
      </div>
    </section>

    <section class="band">
      <img class="band-img" src="assets/images/band-horizon.webp" alt="" aria-hidden="true" loading="lazy">
      <div class="band-veil"></div>
      <div class="band-body">
        <p class="eyebrow">${t('hub.kicker')}</p>
        <h2 class="band-title">${t('aero.band.title')}</h2>
        <p class="band-sub">${t('aero.band.sub')}</p>
        <div class="band-cta">
          <a class="btn btn-primary" href="#/library">${t('aero.band.cta')} ${I.arrowRight}</a>
          <a class="btn btn-field" href="#/open">${I.branch} ${t('nav.open')}</a>
        </div>
      </div>
    </section>`;

  VT.utils.$('.hub-search', el).addEventListener('submit', (e) => {
    e.preventDefault();
    Object.assign(VT.shell.libraryState, { q: VT.utils.$('#hub-q', el).value.trim(), cat: 'all', recent: false });
    VT.router.go('/library');
  });

  VT.utils.$$('.world-card', el).forEach((card) => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      Object.assign(VT.shell.libraryState, { cat: card.dataset.cat, recent: false, q: '' });
      VT.router.go('/library');
    });
  });

  // The hero runs to the window edge, so the page gutter has to be published as a
  // length. Measuring the live boxes (not 100vw) keeps the scrollbar out of the
  // arithmetic, which is what would otherwise create a horizontal overflow.
  const bleed = () => {
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const outside = Math.max(0, (document.documentElement.clientWidth - el.getBoundingClientRect().width) / 2);
    el.style.setProperty('--bleed', (pad + outside).toFixed(2) + 'px');
  };
  bleed();
  window.addEventListener('resize', bleed);
  return () => window.removeEventListener('resize', bleed);
};
