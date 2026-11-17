window.VT = window.VT || {};
VT.shell = VT.shell || {};

VT.shell.settings = (el) => {
  const t = VT.i18n.t, I = VT.icons;
  const s = VT.settings.get();

  const seg = (id, options, current) => `
    <div class="tabs" role="group" id="${id}">
      ${options.map(([val, label]) => `<button class="tab" data-val="${val}" aria-pressed="${current === val}" role="radio" aria-checked="${current === val}">${label}</button>`).join('')}
    </div>`;

  el.innerHTML = `
    <div class="lib-head"><h1>${t('set.title')}</h1></div>
    <div class="set-wrap" style="margin-top:22px">
      <section class="set-card glass">
        <div class="set-row">
          <div class="sr-text"><div class="sr-label">${t('set.lang')}</div><div class="sr-desc">${t('set.lang.desc')}</div></div>
          ${seg('set-lang', [['en', 'English'], ['pt', 'Português']], VT.i18n.lang)}
        </div>
        <div class="set-row">
          <div class="sr-text"><div class="sr-label">${t('set.motion')}</div><div class="sr-desc">${t('set.motion.desc')}</div></div>
          ${seg('set-motion', [['full', t('set.motion.full')], ['reduced', t('set.motion.reduced')]], s.motion)}
        </div>
        <div class="set-row">
          <div class="sr-text"><div class="sr-label">${t('set.glass')}</div><div class="sr-desc">${t('set.glass.desc')}</div></div>
          ${seg('set-glass', [['liquid', t('set.glass.liquid')], ['solid', t('set.glass.solid')]], s.glass)}
        </div>
      </section>
      <section class="set-card glass">
        <div class="set-row">
          <div class="sr-text"><div class="sr-label">${t('set.projects')}</div><div class="sr-desc">${t('set.projects.desc')}</div></div>
          <div class="mono" id="set-projects-count" style="color:var(--cyan)"></div>
        </div>
        <div class="set-row" style="flex-wrap:wrap;gap:8px">
          <div class="app-actions" id="set-projects-actions">
            <button class="btn btn-ghost" id="set-projects-export" disabled>${I.download} ${t('set.projects.export')}</button>
            <button class="btn btn-ghost" id="set-projects-import" disabled>${I.plus} ${t('set.projects.import')}</button>
            <button class="btn btn-danger" id="set-projects-erase" disabled>${I.alert} ${t('set.projects.erase')}</button>
          </div>
          <input type="file" id="set-projects-file" accept="application/json,.json" hidden>
        </div>
      </section>
      <section class="set-card glass">
        <div class="set-row">
          <div class="sr-text"><div class="sr-label">${t('set.data')}</div><div class="sr-desc">${t('set.data.desc')}</div></div>
          <button class="btn btn-danger" id="set-reset">${I.alert} ${t('set.data.reset')}</button>
        </div>
      </section>
    </div>`;

  const wire = (id, fn) => {
    VT.utils.$$('#' + id + ' .tab', el).forEach((b) => {
      b.addEventListener('click', () => {
        VT.utils.$$('#' + id + ' .tab', el).forEach((x) => {
          x.setAttribute('aria-pressed', x === b);
          x.setAttribute('aria-checked', x === b);
        });
        fn(b.dataset.val);
      });
    });
  };

  wire('set-lang', (v) => VT.i18n.setLang(v));
  wire('set-motion', (v) => { VT.settings.set({ motion: v }); VT.settings.apply(); });
  wire('set-glass', (v) => { VT.settings.set({ glass: v }); VT.settings.apply(); });

  const $el = (id) => VT.utils.$('#' + id, el);
  const setEnabled = (id, on) => { const b = $el(id); if (b) b.disabled = !on; };
  function renderCount(n) {
    const c = $el('set-projects-count');
    if (!c) return;
    c.textContent = n === 0 ? t('set.projects.count0') : t('set.projects.count', { n });
  }
  function refreshCount() {
    if (!VT.db.available) {
      const c = $el('set-projects-count'); if (c) c.textContent = t('set.projects.unavailable');
      return;
    }
    VT.db.count().then(renderCount).catch(() => {
      const c = $el('set-projects-count'); if (c) c.textContent = t('set.projects.unavailable');
    });
  }

  const projectsReady = VT.db.available;
  setEnabled('set-projects-export', projectsReady);
  setEnabled('set-projects-import', projectsReady);
  setEnabled('set-projects-erase', projectsReady);
  refreshCount();

  $el('set-projects-export').addEventListener('click', () => {
    VT.db.exportAll().then((payload) => {
      const stamp = new Date().toISOString().slice(0, 10);
      VT.utils.downloadText(JSON.stringify(payload, null, 2), 'vistanology-projects-' + stamp + '.json', 'application/json');
      VT.ui.toast(t('set.projects.exported'), 'success');
    }).catch(() => VT.ui.toast(t('set.projects.unavailable'), 'error'));
  });

  $el('set-projects-import').addEventListener('click', () => $el('set-projects-file').click());
  $el('set-projects-file').addEventListener('change', () => {
    const f = $el('set-projects-file').files && $el('set-projects-file').files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      let payload;
      try { payload = JSON.parse(String(reader.result)); }
      catch (e) { VT.ui.toast(t('set.projects.badFile'), 'error'); $el('set-projects-file').value = ''; return; }
      VT.db.importAll(payload, 'merge').then((res) => {
        VT.ui.toast(t('set.projects.importing', { n: res.imported }), 'success');
        refreshCount();
      }).catch(() => VT.ui.toast(t('set.projects.badFile'), 'error'))
        .finally(() => { $el('set-projects-file').value = ''; });
    };
    reader.onerror = () => VT.ui.toast(t('set.projects.badFile'), 'error');
    reader.readAsText(f);
  });

  $el('set-projects-erase').addEventListener('click', async () => {
    const ok = await VT.ui.confirm({
      title: t('set.projects.eraseTitle'),
      body: t('set.projects.eraseBody'),
      confirmLabel: t('set.projects.erase')
    });
    if (!ok) return;
    try { await VT.db.clear(); VT.ui.toast(t('set.projects.erased'), 'success'); refreshCount(); }
    catch (e) { VT.ui.toast(t('set.projects.unavailable'), 'error'); }
  });

  VT.utils.$('#set-reset', el).addEventListener('click', async () => {
    const ok = await VT.ui.confirm({
      title: t('set.data.confirm.title'),
      body: t('set.data.confirm.body'),
      confirmLabel: t('set.data.reset')
    });
    if (!ok) return;
    VT.store.clearAll();
    try { if (VT.db.available) await VT.db.clear(); } catch (e) { /* IndexedDB may be blocked */ }
    VT.settings.apply();
    VT.ui.toast(t('set.data.done'), 'success');
    VT.router.refresh();
  });
};