window.VT = window.VT || {};
VT.shell = VT.shell || {};

VT.shell.docs = (el, id) => {
  const t = VT.i18n.t, L = VT.i18n.lang, I = VT.icons, R = VT.registry;
  const m = id ? R.get(id) : null;

  const nav = `
    <nav class="docs-nav glass" aria-label="${t('docs.title')}">
      <div>
        <a href="#/docs" ${!m ? 'aria-current="page"' : ''}>${t('docs.index')}</a>
      </div>
      ${VT.cats.map((c) => {
        const tools = R.byCat(c.id);
        if (!tools.length) return '';
        return `<div><div class="dn-cat">${c.num} · ${t('cat.' + c.id + '.name')}</div>
          ${tools.map((x) => `<a href="#/docs/${x.id}" ${m && m.id === x.id ? 'aria-current="page"' : ''}>${x.name[L]}</a>`).join('')}
        </div>`;
      }).join('')}
    </nav>`;

  let article;
  if (m) {
    const d = m.docs[L] || m.docs.en;
    article = `
      <article class="docs-article glass-2">
        <h1>${m.name[L]}</h1>
        <div class="docs-meta">
          <span class="badge">${t('cat.' + m.cat + '.name')}</span>
          <span class="badge badge-aqua">v${m.version}</span>
          <span class="local-seal">${I.shield} ${t('app.local')}</span>
        </div>
        <div class="prose"><p>${d.summary}</p></div>
        <div class="prose"><h2>${t('docs.usage')}</h2><ul>${d.usage.map((s) => '<li>' + s + '</li>').join('')}</ul></div>
        <div class="prose"><h2>${t('docs.privacy')}</h2><p>${d.privacy}</p></div>
        <div class="prose"><h2>${t('docs.limits')}</h2><ul>${d.limits.map((s) => '<li>' + s + '</li>').join('')}</ul></div>
        <div class="prose"><h2>${t('docs.deps')}</h2>${m.deps && m.deps.length ? '<ul>' + m.deps.map((s) => '<li><code>' + s + '</code></li>').join('') + '</ul>' : '<p>' + t('docs.none') + '</p>'}</div>
        <div><a class="btn btn-primary" href="#/tool/${m.id}">${I.arrowRight} ${t('docs.open')}</a></div>
      </article>`;
  } else {
    article = `
      <article class="docs-article glass-2">
        <h1>${t('docs.title')}</h1>
        <div class="prose"><p>${t('docs.sub')}</p></div>
        ${VT.cats.map((c) => {
          const tools = R.byCat(c.id);
          if (!tools.length) return '';
          return `<div class="prose"><h3>${c.num} · ${t('cat.' + c.id + '.name')}</h3>
            <ul>${tools.map((x) => '<li><a href="#/docs/' + x.id + '">' + x.name[L] + '</a> — ' + (x.docs[L] || x.docs.en).summary + '</li>').join('')}</ul></div>`;
        }).join('')}
      </article>`;
  }

  el.innerHTML = `<div class="docs-layout">${nav}${article}</div>`;
};