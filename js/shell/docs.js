window.VT = window.VT || {};
VT.shell = VT.shell || {};

VT.shell.docsState = { q: '' };

VT.shell.docs = (el, id) => {
  const t = VT.i18n.t, L = VT.i18n.lang, I = VT.icons, R = VT.registry, U = VT.utils;
  const S = VT.shell.docsState;
  const m = id ? R.get(id) : null;
  const q = () => S.q.trim().toLowerCase();
  // Algumas ferramentas antigas gravam usage/limits como um único texto; as novas usam array.
  // Renderizamos as duas formas em vez de estourar a página inteira.
  const list = (x) => (Array.isArray(x) ? x : x ? [x] : []);
  // O filtro é um recorte da navegação, nunca uma busca no corpo do documento:
  // o leitor continua vendo o documento inteiro da ferramenta aberta.
  const keep = (x) => {
    const s = q();
    if (!s) return true;
    return [x.id, x.name.en, x.name.pt, x.tagline.en, x.tagline.pt, x.cat, ...(x.tags || [])]
      .join(' ').toLowerCase().includes(s);
  };
  const tools = R.all().filter(keep);

  const nav = `
    <nav class="docs-nav glass" aria-label="${t('docs.title')}">
      <div class="search-bar is-nav">
        ${I.search}
        <input id="docs-q" type="search" placeholder="${t('docs.search')}" value="${U.esc(S.q)}" aria-label="${t('docs.search')}">
      </div>
      <div>
        <a href="#/docs" ${!m ? 'aria-current="page"' : ''}>${t('docs.index')}</a>
      </div>
      ${VT.cats.map((c) => {
        const cat = R.byCat(c.id).filter(keep);
        if (!cat.length) return '';
        return `<div><div class="dn-cat">${c.num} · ${t('cat.' + c.id + '.name')}</div>
          ${cat.map((x) => `<a href="#/docs/${x.id}" ${m && m.id === x.id ? 'aria-current="page"' : ''}>${x.name[L]}</a>`).join('')}
        </div>`;
      }).join('')}
      <p class="dn-foot mono" id="docs-count" role="status" aria-live="polite" aria-atomic="true"></p>
    </nav>`;

  let article;
  if (m) {
    const d = m.docs[L] || m.docs.en;
    const sibs = R.byCat(m.cat);
    const at = sibs.findIndex((x) => x.id === m.id);
    const prev = at > 0 ? sibs[at - 1] : null;
    const next = at >= 0 && at < sibs.length - 1 ? sibs[at + 1] : null;
    const secs = [
      ['sec-usage', t('docs.usage')],
      ['sec-privacy', t('docs.privacy')],
      ['sec-limits', t('docs.limits')],
      ['sec-deps', t('docs.deps')]
    ];
    article = `
      <article class="docs-article glass-2">
        <h1>${m.name[L]}</h1>
        <div class="docs-meta">
          <span class="badge">${t('cat.' + m.cat + '.name')}</span>
          <span class="badge badge-aqua">v${m.version}</span>
          <span class="local-seal">${I.shield} ${t('app.local')}</span>
        </div>
        <div class="docs-toc" role="group" aria-label="${t('docs.contents')}">
          <span class="dt-label">${t('docs.contents')}</span>
          ${secs.map(([k, label]) => `<button class="dt-link" type="button" data-sec="${k}">${label}</button>`).join('')}
        </div>
        <div class="prose"><p>${d.summary}</p></div>
        <div class="prose docs-sec" id="sec-usage"><h2>${t('docs.usage')}</h2><ul>${list(d.usage).map((s) => '<li>' + s + '</li>').join('')}</ul></div>
        <div class="prose docs-sec" id="sec-privacy"><h2>${t('docs.privacy')}</h2><p>${d.privacy}</p></div>
        <div class="prose docs-sec" id="sec-limits"><h2>${t('docs.limits')}</h2><ul>${list(d.limits).map((s) => '<li>' + s + '</li>').join('')}</ul></div>
        <div class="prose docs-sec" id="sec-deps"><h2>${t('docs.deps')}</h2>${m.deps && m.deps.length ? '<ul>' + m.deps.map((s) => '<li><code>' + U.esc(s) + '</code></li>').join('') + '</ul>' : '<p>' + t('docs.none') + '</p>'}</div>
        <div class="docs-actions">
          <a class="btn btn-primary" href="#/tool/${m.id}">${I.arrowRight} ${t('docs.open')}</a>
          <a class="btn btn-ghost" href="#/modules">${I.grid} ${t('nav.modules')}</a>
        </div>
        <nav class="docs-pager" aria-label="${t('docs.all')}">
          ${prev ? `<a class="dp-side" href="#/docs/${prev.id}"><span class="dp-dir">${I.arrowLeft} ${t('docs.prev')}</span><span class="dp-name">${prev.name[L]}</span></a>` : '<span class="dp-side is-empty"></span>'}
          ${next ? `<a class="dp-side is-next" href="#/docs/${next.id}"><span class="dp-dir">${t('docs.next')} ${I.arrowRight}</span><span class="dp-name">${next.name[L]}</span></a>` : '<span class="dp-side is-empty"></span>'}
        </nav>
      </article>`;
  } else {
    article = `
      <article class="docs-article glass-2">
        <h1>${t('docs.title')}</h1>
        <div class="prose"><p>${t('docs.sub')}</p></div>
        ${VT.cats.map((c) => {
          const cat = R.byCat(c.id).filter(keep);
          if (!cat.length) return '';
          return `<div class="prose"><h3>${c.num} · ${t('cat.' + c.id + '.name')}</h3>
            <ul>${cat.map((x) => '<li><a href="#/docs/' + x.id + '">' + x.name[L] + '</a> — ' + U.esc((x.docs[L] || x.docs.en).summary) + '</li>').join('')}</ul></div>`;
        }).join('')}
        <p class="docs-none" id="docs-none" hidden>${t('docs.empty')} <a href="#/library">${t('nav.library')}</a></p>
      </article>`;
  }

  el.innerHTML = `<div class="docs-layout">${nav}${article}</div>`;

  const input = U.$('#docs-q', el);
  const count = U.$('#docs-count', el);
  count.textContent = t('docs.count', { n: tools.length, total: R.all().length });

  function rerender() {
    if (m) VT.shell.docs(el, m.id);
    else VT.shell.docs(el, null);
  }
  // Repintar a vista é o caminho mais curto e o mais caro; o documento aberto é
  // estático, então só o índice precisa reagir ao filtro enquanto se digita.
  let timer = null;
  input.addEventListener('input', (e) => {
    S.q = e.target.value;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const caret = input.selectionStart;
      rerender();
      // Repintar reemplaza el campo: sin devolver foco y cursor, escribir dos
      // letras seguidas era imposible.
      const again = U.$('#docs-q', el);
      if (again) { again.focus(); try { again.setSelectionRange(caret, caret); } catch { /* type=search */ } }
    }, 140);
  });

  if (!m) {
    const none = U.$('#docs-none', el);
    if (none) none.hidden = tools.length > 0;
  }

  U.$$('.dt-link', el).forEach((b) => b.addEventListener('click', () => {
    const sec = U.$('#' + b.dataset.sec, el);
    if (sec) sec.scrollIntoView({ behavior: document.body.dataset.motion === 'reduced' ? 'auto' : 'smooth', block: 'start' });
  }));
};
