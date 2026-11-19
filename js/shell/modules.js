window.VT = window.VT || {};
VT.shell = VT.shell || {};

VT.shell.modulesState = { q: '', cat: 'all', gapsOnly: false };

/* Cobertura documental real, medida desde el propio manifesto: una herramienta solo
   aparece como completa si summary/usage/privacy/limits existen en los dos idiomas. */
function docGaps(m) {
  const miss = [];
  for (const l of ['en', 'pt']) {
    const d = m.docs && m.docs[l];
    if (!d) { miss.push(l + '.*'); continue; }
    if (!d.summary) miss.push(l + '.summary');
    if (!Array.isArray(d.usage) || !d.usage.length) miss.push(l + '.usage');
    if (!d.privacy) miss.push(l + '.privacy');
    if (!Array.isArray(d.limits) || !d.limits.length) miss.push(l + '.limits');
  }
  return miss;
}

VT.shell.modules = (el, param) => {
  const t = VT.i18n.t, L = VT.i18n.lang, I = VT.icons, R = VT.registry, U = VT.utils;
  const S = VT.shell.modulesState;
  const all = R.all();
  const complete = all.filter((m) => !docGaps(m).length).length;

  el.innerHTML = `
    <div class="mod-stage ocean rim">
      <p class="eyebrow"><a href="#/about">Vistanology</a> · ${t('mod.eyebrow')}</p>
      <h1>${t('mod.title')}</h1>
      <p class="ms-sub">${t('mod.sub')}</p>
      <span class="mono" id="mod-count" role="status" aria-live="polite" aria-atomic="true"></span>
    </div>
    <div class="search-bar ocean-2">
      ${I.search}
      <input id="mod-q" type="search" placeholder="${t('mod.search')}" value="${U.esc(S.q)}" aria-label="${t('mod.search')}">
    </div>
    <div class="chips" id="mod-chips" role="group" aria-label="${t('mod.title')}">
      <button class="chip" type="button" data-cat="all" aria-pressed="${S.cat === 'all'}">${t('lib.all')}</button>
      ${VT.cats.map((c) => `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${S.cat === c.id}">${t('cat.' + c.id + '.name')}</button>`).join('')}
      <button class="chip chip-flag" type="button" id="mod-gaps" aria-pressed="${S.gapsOnly}">${I.alert} ${t('mod.gaps.only')}</button>
    </div>
    <div class="aero-tube" aria-hidden="true"></div>
    <div class="mod-cover glass" id="mod-cover">
      <div class="mc-lead">${I.check}<span>${t('mod.cover', { done: complete, total: all.length })}</span></div>
      <p class="mc-sub">${t('mod.cover.sub')}</p>
    </div>
    <div class="mod-clusters" id="mod-clusters"></div>
    <div class="mod-deps glass-2">
      <h2>${I.branch} ${t('mod.deps')}</h2>
      <p class="md-sub">${t('mod.deps.sub')}</p>
      <table class="dep-table">
        <thead><tr><th>${t('dep.name')}</th><th>${t('dep.version')}</th><th>${t('dep.license')}</th><th>${t('dep.usedfor')}</th></tr></thead>
        <tbody>
          ${VT.deps.map((d) => `<tr><td>${U.esc(d.name)}</td><td class="mono">${U.esc(d.version)}</td><td>${U.esc(d.license)} · ${U.esc(d.author)}</td><td>${U.esc(d.used[L] || d.used.en)}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`;

  const grid = U.$('#mod-clusters', el);
  const count = U.$('#mod-count', el);
  const cover = U.$('#mod-cover', el);
  const search = U.$('#mod-q', el);
  const gapsBtn = U.$('#mod-gaps', el);

  function results() {
    let list = R.search(S.q);
    if (S.cat !== 'all') list = list.filter((m) => m.cat === S.cat);
    if (S.gapsOnly) list = list.filter((m) => docGaps(m).length);
    return list;
  }

  function node(m, i) {
    const miss = docGaps(m);
    return `
      <div class="mod-node${miss.length ? ' is-gap' : ''}" data-id="${m.id}" style="--i:${i}">
        <span class="orb" aria-hidden="true">${I[m.icon]}</span>
        <div class="mn-text">
          <a class="mn-name" href="#/tool/${m.id}">${m.name[L]}</a>
          <p class="mn-tag">${m.tagline[L]}</p>
        </div>
        <div class="mn-meta">
          <span class="badge badge-aqua">v${m.version}</span>
          ${(m.deps || []).map((d) => `<span class="badge">${U.esc(d)}</span>`).join('')}
          ${miss.length
            ? `<span class="badge badge-warn">${I.alert} ${t('mod.cover.gap')}</span>`
            : `<span class="badge badge-ok">${I.check} ${t('mod.cover.done')}</span>`}
          <a class="mn-docs" href="#/docs/${m.id}">${I.book} ${t('mod.docs')}</a>
        </div>
        ${miss.length ? `<p class="mn-gaps">${U.esc(miss.join(' · '))}</p>` : ''}
      </div>`;
  }

  function render() {
    const list = results();
    count.textContent = t(list.length === 1 ? 'mod.count.one' : 'mod.count', { n: list.length });
    U.$$('#mod-chips .chip', el).forEach((c) => {
      c.setAttribute('aria-pressed', c.id === 'mod-gaps' ? String(S.gapsOnly) : String(c.dataset.cat === S.cat));
    });
    if (!list.length) {
      grid.innerHTML = `<div class="empty">
        ${S.gapsOnly ? I.check : I.search}
        <strong>${S.gapsOnly ? U.esc(t('mod.empty.gap.title')) : U.esc(t('mod.empty.title'))}</strong>
        ${U.esc(S.gapsOnly ? t('mod.empty.gap.body') : t('mod.empty.body'))}
        <button class="btn btn-ghost btn-sm" id="mod-empty-act" type="button">${I.arrowLeft} ${U.esc(t('mod.empty.act'))}</button>
      </div>`;
      U.$('#mod-empty-act', grid).addEventListener('click', () => {
        Object.assign(S, { q: '', cat: 'all', gapsOnly: false });
        search.value = '';
        render();
      });
      return;
    }
    grid.innerHTML = VT.cats.map((c) => {
      const tools = list.filter((m) => m.cat === c.id);
      if (!tools.length) return '';
      return `<section class="mod-cluster glass" data-cat="${c.id}">
        <header class="mc-head">
          <span class="mc-num mono">${c.num}</span>
          <span class="mc-orb orb" aria-hidden="true">${I[c.icon]}</span>
          <div><h2>${t('cat.' + c.id + '.name')}</h2><p>${t('cat.' + c.id + '.desc')}</p></div>
          <span class="mc-count mono">${t('mod.cluster.count', { n: tools.length })}</span>
        </header>
        <div class="mc-nodes">${tools.map(node).join('')}</div>
      </section>`;
    }).join('');
    cover.dataset.gaps = String(complete < all.length);
  }

  search.addEventListener('input', (e) => { S.q = e.target.value; render(); });
  gapsBtn.addEventListener('click', () => { S.gapsOnly = !S.gapsOnly; render(); });
  U.$$('#mod-chips .chip[data-cat]', el).forEach((chip) => {
    chip.addEventListener('click', () => { S.cat = chip.dataset.cat; render(); });
  });

  const onKey = (e) => {
    const target = document.activeElement;
    if (e.key === '/' && !e.defaultPrevented && !e.isComposing && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey && !target?.isContentEditable && !/^(input|textarea|select)$/i.test(target?.tagName || '')) {
      e.preventDefault();
      search.focus();
    }
  };
  document.addEventListener('keydown', onKey);

  render();
  return () => document.removeEventListener('keydown', onKey);
};
