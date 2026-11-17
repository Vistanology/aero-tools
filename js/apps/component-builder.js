window.VT = window.VT || {};

/* U11 · Component Builder — assemble a reusable UI component (button, badge, alert, card)
 * from a typed props model, preview it live on the brand field the export uses, and
 * export clean, escaped HTML + scoped CSS. Text is escaped on render; color/size/variant/
 * radius come from browser-validated controls, so the exported markup is safe — no eval,
 * no free-form HTML injection. Fully local and offline-capable.
 */
VT.modules['component-builder'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'component-builder';
  const AUTOSAVE_ID = 'cb:autosave';

  let alive = false;
  let refs = {};
  let hist = null;
  let comp = {};
  let autosave = null;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const ICON = {
    spark: '<svg class="cb-ic" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2l2.2 6.2L20 10l-5.8 1.8L12 18l-2.2-6.2L4 10l5.8-1.8z"/></svg>',
    info: '<svg class="cb-ic cb-alert-ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v5M12 7.5v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    layers: '<svg class="cb-ic cb-card-ic" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 3l9 5-9 5-9-5z" opacity=".9"/><path fill="currentColor" d="M3 13l9 5 9-5" opacity=".5"/></svg>'
  };

  const ALERT_COLOR = { info: '#5FE6FF', success: '#7FE0B0', warning: '#FFD08A', error: '#FF8FA3' };

  const TYPES = {
    button: {
      name: 'cb.t.button', fields: ['text', 'variant', 'size', 'accent', 'radius', 'icon'],
      variants: ['solid', 'outline', 'ghost'], sizes: ['sm', 'md', 'lg'],
      defaults: () => ({ text: 'Get started', variant: 'solid', size: 'md', accent: '#5FE6FF', radius: 12, icon: true })
    },
    badge: {
      name: 'cb.t.badge', fields: ['text', 'variant', 'size', 'accent', 'radius', 'icon'],
      variants: ['solid', 'soft', 'outline'], sizes: ['sm', 'md', 'lg'],
      defaults: () => ({ text: 'New', variant: 'soft', size: 'md', accent: '#7FF0D4', radius: 999, icon: false })
    },
    alert: {
      name: 'cb.t.alert', fields: ['text', 'subtext', 'variant', 'accent', 'radius', 'icon'],
      variants: ['info', 'success', 'warning', 'error'],
      defaults: () => ({ text: 'Heads up', subtext: 'Your changes are saved locally.', variant: 'info', accent: '#5FE6FF', radius: 14, icon: true })
    },
    card: {
      name: 'cb.t.card', fields: ['text', 'subtext', 'variant', 'accent', 'radius', 'icon'],
      variants: ['default', 'outline', 'elevated'],
      defaults: () => ({ text: 'Cosmic Card', subtext: 'A glass surface with a luminous accent.', variant: 'default', accent: '#5FE6FF', radius: 20, icon: true })
    }
  };

  function typeOrDefault() { return TYPES[comp.type] || TYPES.button; }

  // ---------- HTML ----------
  function renderHtml(c) {
    const p = c.props, ty = TYPES[c.type];
    const vars = '--cb-accent:' + p.accent + ';--cb-radius:' + p.radius + 'px;';
    if (c.type === 'button') {
      return '<button class="cb-btn" data-v="' + p.variant + '" data-size="' + p.size + '" style="' + vars + '">' + (p.icon ? ICON.spark : '') + '<span>' + esc(p.text) + '</span></button>';
    }
    if (c.type === 'badge') {
      return '<span class="cb-badge" data-v="' + p.variant + '" data-size="' + p.size + '" style="' + vars + '">' + (p.icon ? ICON.spark : '') + esc(p.text) + '</span>';
    }
    if (c.type === 'alert') {
      return '<div class="cb-alert" data-v="' + p.variant + '" style="' + vars + '">' + (p.icon ? ICON.info : '') + '<div><div class="cb-alert-t">' + esc(p.text) + '</div><div class="cb-alert-b">' + esc(p.subtext) + '</div></div></div>';
    }
    // card
    return '<div class="cb-card" data-v="' + p.variant + '" style="' + vars + '">' + (p.icon ? ICON.layers : '') + '<div class="cb-card-t">' + esc(p.text) + '</div><div class="cb-card-b">' + esc(p.subtext) + '</div></div>';
  }

  // ---------- CSS ----------
  function renderCss(c) {
    const head = '/* Vistanology Component Builder — ' + c.type + ' */\n.cb-ic{display:inline-block;vertical-align:middle}\n';
    if (c.type === 'button') {
      return head +
        '.cb-btn{font-family:var(--cb-font,"Inter",system-ui,sans-serif);font-weight:600;font-size:14px;display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:var(--cb-radius,12px);border:1px solid transparent;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}\n' +
        '.cb-btn:hover{transform:translateY(-1px)}\n' +
        '.cb-btn[data-size="sm"]{font-size:13px;padding:7px 12px}\n.cb-btn[data-size="lg"]{font-size:15px;padding:13px 22px}\n' +
        '.cb-btn[data-v="solid"]{background:var(--cb-accent,#5FE6FF);color:#04070F;box-shadow:0 8px 20px -10px var(--cb-accent,#5FE6FF)}\n' +
        '.cb-btn[data-v="outline"]{background:transparent;color:var(--cb-accent,#5FE6FF);border-color:var(--cb-accent,#5FE6FF)}\n' +
        '.cb-btn[data-v="ghost"]{background:transparent;color:var(--cb-accent,#5FE6FF)}\n';
    }
    if (c.type === 'badge') {
      return head +
        '.cb-badge{font-family:var(--cb-font,"Inter",system-ui,sans-serif);font-weight:600;font-size:12px;display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:var(--cb-radius,999px);border:1px solid transparent}\n' +
        '.cb-badge[data-size="sm"]{font-size:10px;padding:2px 8px}\n.cb-badge[data-size="lg"]{font-size:13px;padding:6px 12px}\n' +
        '.cb-badge[data-v="solid"]{background:var(--cb-accent,#7FF0D4);color:#04070F}\n' +
        '.cb-badge[data-v="soft"]{background:color-mix(in srgb, var(--cb-accent,#7FF0D4) 18%, transparent);color:var(--cb-accent,#7FF0D4)}\n' +
        '.cb-badge[data-v="outline"]{background:transparent;color:var(--cb-accent,#7FF0D4);border-color:var(--cb-accent,#7FF0D4)}\n';
    }
    if (c.type === 'alert') {
      return head +
        '.cb-alert{font-family:var(--cb-font,"Inter",system-ui,sans-serif);color:#EAF7FF;display:flex;gap:10px;align-items:flex-start;max-width:360px;padding:12px 14px;border-radius:var(--cb-radius,14px);border:1px solid color-mix(in srgb, var(--cb-accent,#5FE6FF) 40%, transparent);background:color-mix(in srgb, var(--cb-accent,#5FE6FF) 12%, rgba(10,27,46,.6))}\n' +
        '.cb-alert-ic{color:var(--cb-accent,#5FE6FF);flex:0 0 auto;margin-top:1px}\n' +
        '.cb-alert-t{font-weight:600;color:var(--cb-accent,#5FE6FF)}\n.cb-alert-b{font-size:12px;color:#9FB8C8;margin-top:2px}\n';
    }
    // card
    return head +
      '.cb-card{font-family:var(--cb-font,"Inter",system-ui,sans-serif);color:#EAF7FF;width:260px;padding:16px;border-radius:var(--cb-radius,20px);background:rgba(13,36,56,.68);border:1px solid color-mix(in srgb, var(--cb-accent,#5FE6FF) 30%, transparent)}\n' +
      '.cb-card[data-v="outline"]{background:transparent}\n.cb-card[data-v="elevated"]{box-shadow:0 24px 60px -20px rgba(0,0,0,.72)}\n' +
      '.cb-card-ic{color:var(--cb-accent,#5FE6FF)}\n.cb-card-t{font-weight:600;display:flex;align-items:center;gap:8px}\n.cb-card-b{font-size:12px;color:#9FB8C8;margin-top:6px}\n';
  }

  const canonical = () => JSON.stringify(comp);

  function renderPreview() {
    if (!refs.style) return;
    refs.style.textContent = renderCss(comp);
    if (refs.preview) refs.preview.innerHTML = renderHtml(comp);
  }

  function commit() {
    if (!alive) return;
    renderPreview();
    if (refs.cssOut) refs.cssOut.textContent = renderCss(comp);
    if (refs.htmlOut) refs.htmlOut.textContent = renderHtml(comp);
    hist.record(canonical()); syncHist();
    if (autosave) autosave();
  }
  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }

  // ---------- controls ----------
  function fieldRow(key) {
    const p = comp.props;
    const row = document.createElement('div'); row.className = 'field';
    const lab = document.createElement('label'); lab.textContent = t('cb.f.' + key);

    if (key === 'text' || key === 'subtext') {
      const input = document.createElement('input'); input.type = 'text'; input.className = 'input'; input.value = p[key] || '';
      input.addEventListener('input', () => { p[key] = input.value; commit(); });
      row.append(lab, input);
    } else if (key === 'variant' || key === 'size') {
      const input = document.createElement('select'); input.className = 'input cb-select';
      const opts = key === 'variant' ? typeOrDefault().variants : (typeOrDefault().sizes || []);
      opts.forEach((o) => { const op = document.createElement('option'); op.value = o; op.textContent = t('cb.opt.' + o); input.append(op); });
      input.value = p[key];
      input.addEventListener('change', () => {
        p[key] = input.value;
        if (key === 'variant' && comp.type === 'alert') p.accent = ALERT_COLOR[input.value] || p.accent;
        commit();
      });
      row.append(lab, input);
    } else if (key === 'accent') {
      const line = document.createElement('div'); line.className = 'cb-ctrl-line';
      const input = document.createElement('input'); input.type = 'color'; input.className = 'bench-color'; input.value = p.accent;
      const val = document.createElement('span'); val.className = 'bench-val'; val.textContent = p.accent;
      input.addEventListener('input', () => { p.accent = input.value; val.textContent = input.value; commit(); });
      line.append(input, val); row.append(lab, line);
    } else if (key === 'radius') {
      const line = document.createElement('div'); line.className = 'cb-ctrl-line';
      const input = document.createElement('input'); input.type = 'range'; input.className = 'bench-range';
      input.min = 0; input.max = (comp.type === 'badge' ? 999 : 40); input.step = 1; input.value = p.radius;
      const val = document.createElement('span'); val.className = 'bench-val'; val.textContent = p.radius + ' px';
      input.addEventListener('input', () => { p.radius = Number(input.value); val.textContent = input.value + ' px'; commit(); });
      line.append(input, val); row.append(lab, line);
    } else if (key === 'icon') {
      const line = document.createElement('label'); line.className = 'check-row';
      const input = document.createElement('input'); input.type = 'checkbox'; input.checked = !!p.icon;
      input.addEventListener('change', () => { p.icon = input.checked; commit(); });
      line.append(input, document.createElement('span')); line.lastChild.textContent = t('cb.withIcon');
      row.append(lab, line);
    }
    return row;
  }

  function buildControls() {
    const wrap = refs.controls; if (!wrap) return;
    wrap.innerHTML = '';
    const g = document.createElement('div'); g.className = 'bench-sec glass';
    g.append(head(t('cb.g.props')));
    typeOrDefault().fields.forEach((k) => g.append(fieldRow(k)));
    wrap.append(g);
  }
  function head(txt) { const h = document.createElement('h3'); h.className = 'bench-sec-head'; h.textContent = txt; return h; }

  // The type switch is the bench's segmented control: without aria-pressed the
  // rail could not say which component was on the desk, and the only feedback
  // that something was selected was the hover fill under the pointer.
  function syncType() {
    $$('.bench-seg .btn', refs.stage).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.type === comp.type)));
  }

  function setType(id) {
    if (!TYPES[id]) return;
    comp = { type: id, props: TYPES[id].defaults() };
    buildControls(); commit(); syncType();
    refs.hint.textContent = t('cb.typeSet', { name: t(TYPES[id].name) });
  }

  // ---------- standalone export ----------
  function standaloneHTML() {
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Vistanology Component</title>\n<style>\n' + renderCss(comp) + '\nbody{display:grid;place-items:center;min-height:100vh;margin:0;background:#04070F}\n</style>\n</head>\n<body>\n' + renderHtml(comp) + '\n</body>\n</html>\n';
  }

  // ---------- persistence ----------
  function loadProjects() {
    refs.projList.innerHTML = '';
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty cb-empty">' + esc(t('cb.dbUnavailable')) + '</div>'; return; }
    VT.db.list('component-builder').then((rows) => {
      rows = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.projList.innerHTML = '<div class="bench-empty cb-empty">' + esc(t('cb.projEmpty')) + '</div>'; return; }
      rows.forEach((r) => {
        const el = document.createElement('div'); el.className = 'bench-row';
        const info = document.createElement('div'); info.className = 'cb-proj-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('cb.projUntitled');
        const meta = document.createElement('span'); meta.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(nm, meta);
        const open = document.createElement('button'); open.type = 'button'; open.className = 'btn btn-ghost btn-sm'; open.textContent = t('cb.projOpen');
        open.addEventListener('click', () => {
          comp = Object.assign({ type: 'button', props: TYPES.button.defaults() }, (r.data) || {});
          if (!TYPES[comp.type]) comp.type = 'button';
          buildControls(); renderPreview(); syncType(); hist.reset(canonical()); syncHist();
          refs.cssOut.textContent = renderCss(comp); refs.htmlOut.textContent = renderHtml(comp);
          toast(t('cb.projOpened', { name: r.name || t('cb.projUntitled') }), 'success');
        });
        el.append(info, open);
        refs.projList.append(el);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty cb-empty">' + esc(t('cb.dbError')) + '</div>'; });
  }

  function mount(root) {
    alive = true;
    const s = VT.store.get(KEY, null);
    comp = (s && s.comp && TYPES[s.comp.type]) ? s.comp : { type: 'button', props: TYPES.button.defaults() };
    const I = VT.icons;

    root.innerHTML = `
      <div class="cb-stage" id="cb-stage">
        <style id="cb-style"></style>
        <div class="cb-bar bench">
          <span class="bench-seg" role="group" aria-label="${t('cb.types')}">
            ${Object.keys(TYPES).map((k) => '<button class="btn btn-ghost btn-sm" data-type="' + k + '" aria-pressed="false">' + esc(t(TYPES[k].name)) + '</button>').join('')}
          </span>
          <span class="bench-sep" aria-hidden="true"></span>
          <span class="bench-rail-group">
            <button class="btn btn-ghost btn-sm" id="cb-undo" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
            <button class="btn btn-ghost btn-sm" id="cb-redo" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
          </span>
          <span class="cb-bar-end">
            <span class="cb-hint" id="cb-hint" role="status" aria-live="polite"></span>
            <span class="cb-bar-actions">
              <button class="btn btn-ghost btn-sm" id="cb-copy-html">${I.copy} ${t('cb.copyHtml')}</button>
              <button class="btn btn-ghost btn-sm" id="cb-copy-css">${I.code} ${t('cb.copyCss')}</button>
              <button class="btn btn-primary btn-sm" id="cb-export">${I.download} ${t('cb.export')}</button>
            </span>
          </span>
        </div>

        <div class="cb-work">
          <aside class="cb-controls" id="cb-controls" aria-label="${t('cb.controls')}"></aside>

          <section class="cb-preview-wrap" aria-label="${t('cb.preview')}">
            <div class="cb-scene plate" id="cb-scene"><div class="cb-preview" id="cb-preview"></div></div>
          </section>

          <aside class="cb-side">
            <section class="bench-sec glass">
              <h3 class="bench-sec-head">${t('cb.projList')}</h3>
              <div class="cb-proj-save">
                <input class="input" id="cb-proj-name" type="text" placeholder="${t('cb.projNamePh')}" aria-label="${t('cb.projNamePh')}">
                <button class="btn btn-ghost btn-sm" id="cb-proj-save">${I.file} ${t('cb.projSave')}</button>
              </div>
              <div class="bench-list cb-proj-list" id="cb-proj-list"></div>
            </section>
            <section class="bench-sec glass" aria-label="${t('cb.htmlLabel')}">
              <h3 class="bench-sec-head">${t('cb.htmlLabel')}</h3>
              <pre class="cb-out-block bench-code" id="cb-html-out"></pre>
              <h3 class="bench-sec-head">${t('cb.cssLabel')}</h3>
              <pre class="cb-out-block bench-code" id="cb-css-out"></pre>
            </section>
          </aside>
        </div>

        <p class="privacy-line">${I.shield} ${t('cb.privacy')}</p>
      </div>`;

    refs = {
      stage: $('#cb-stage', root), style: $('#cb-style', root), controls: $('#cb-controls', root),
      scene: $('#cb-scene', root), preview: $('#cb-preview', root), hint: $('#cb-hint', root),
      cssOut: $('#cb-css-out', root), htmlOut: $('#cb-html-out', root),
      undo: $('#cb-undo', root), redo: $('#cb-redo', root), projList: $('#cb-proj-list', root), projName: $('#cb-proj-name', root)
    };

    autosave = U.debounce(() => {
      if (!alive) return;
      VT.store.set(KEY, { comp });
      if (VT.db.available) VT.db.put({ id: AUTOSAVE_ID, tool: 'component-builder', name: '(autosave)', data: comp }).catch(() => {});
    }, 700);

    hist = VT.history.create({ apply: (val) => { comp = val ? JSON.parse(val) : { type: 'button', props: TYPES.button.defaults() }; buildControls(); renderPreview(); syncType(); if (refs.cssOut) refs.cssOut.textContent = renderCss(comp); if (refs.htmlOut) refs.htmlOut.textContent = renderHtml(comp); syncHist(); if (autosave) autosave(); } });

    buildControls();
    renderPreview();
    syncType();

    $$('.bench-seg .btn', root).forEach((b) => b.addEventListener('click', () => setType(b.dataset.type)));
    $('#cb-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#cb-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });

    $('#cb-copy-html', root).addEventListener('click', async () => {
      const ok = await U.copyText(renderHtml(comp));
      toast(ok ? t('cb.copiedHtml') : t('cb.copyFail'), ok ? 'success' : 'error');
    });
    $('#cb-copy-css', root).addEventListener('click', async () => {
      const ok = await U.copyText(renderCss(comp));
      toast(ok ? t('cb.copiedCss') : t('cb.copyFail'), ok ? 'success' : 'error');
    });
    $('#cb-export', root).addEventListener('click', () => {
      U.downloadText(standaloneHTML(), 'vistanology-component.html', 'text/html');
      toast(t('cb.exported'), 'success');
    });

    $('#cb-proj-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('cb.dbUnavailable'), 'error'); return; }
      const name = refs.projName.value.trim() || t('cb.projUntitled');
      refs.projName.value = name;
      try { await VT.db.put({ tool: 'component-builder', name, data: comp }); toast(t('cb.projSaved', { name }), 'success'); loadProjects(); }
      catch (e) { toast(t('cb.dbError'), 'error'); }
    });

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) syncHist();
    });

    hist.reset(canonical()); syncHist();
    refs.cssOut.textContent = renderCss(comp);
    refs.htmlOut.textContent = renderHtml(comp);
    loadProjects();

    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then((rec) => {
        if (!alive || !rec || !rec.data || !TYPES[rec.data.type]) return;
        comp = rec.data;
        buildControls(); renderPreview(); hist.reset(canonical()); syncHist();
        refs.cssOut.textContent = renderCss(comp); refs.htmlOut.textContent = renderHtml(comp);
        refs.hint.textContent = t('cb.restored');
      }).catch(() => {});
    }

    return () => { alive = false; };
  }

  function unmount() { alive = false; hist = null; autosave = null; refs = {}; }

  const def = {
    id: 'component-builder', cat: 'creative', icon: 'layers', version: '0.1.0',
    name: { en: 'Component Builder', pt: 'Construtor de Componentes' },
    tagline: {
      en: 'Assemble reusable UI components — buttons, badges, alerts and cards — from typed properties, preview them on the brand field exactly as they will ship, and export clean HTML + scoped CSS. Text is escaped, values are validated, no eval. Fully offline.',
      pt: 'Monte componentes de UI reutilizáveis — botões, selos, alertas e cartões — a partir de propriedades tipadas, pré-visualize-os sobre o campo da marca exatamente como serão publicados e exporte HTML limpo + CSS com escopo. Texto escapado, valores validados, sem eval. Totalmente offline.'
    },
    tags: ['component', 'ui', 'button', 'card', 'html', 'css', 'creative'],
    deps: [],
    docs: {
      en: {
        summary: 'A visual component composer: pick a type (button, badge, alert, card), edit its properties (label, variant, size, accent color, radius, icon), see it rendered live in the design identity, and export the markup and CSS.',
        usage: 'Choose a component type, then adjust the properties — the preview and the HTML/CSS output update instantly. Undo/redo the whole component, save named components to IndexedDB, and Copy HTML, Copy CSS or Export .html for a self-contained file. Labels are escaped and colors/sizes/variants come from validated controls.',
        privacy: 'All editing and export run in your browser. Exported HTML escapes all user text; the stylesheet interpolates only browser-validated values (color pickers, numeric radius, fixed variant/size lists). No scripts, no eval, and nothing is uploaded. Components autosave on-device via IndexedDB.',
        limits: 'Ships four well-crafted component types covering common UI needs; it exports a single component at a time, not a full library or framework binding. The exported CSS is plain, dependency-free CSS you can drop into any project.'
      },
      pt: {
        summary: 'Um compositor visual de componentes: escolha um tipo (botão, selo, alerta, cartão), edite suas propriedades (rótulo, variante, tamanho, cor de destaque, raio, ícone), veja-o renderizado ao vivo na identidade de design e exporte o markup e o CSS.',
        usage: 'Escolha um tipo de componente e ajuste as propriedades — a prévia e a saída HTML/CSS atualizam ao instante. Desfaça/refaça todo o componente, salve componentes nomeados no IndexedDB, e Copie o HTML, Copie o CSS ou Exporte .html para um arquivo autossuficiente. Rótulos são escapados e cores/tamanhos/variantes vêm de controles validados.',
        privacy: 'Toda a edição e exportação rodam no navegador. O HTML exportado escapa todo texto do usuário; a folha interpola apenas valores validados pelo navegador (seletores de cor, raio numérico, listas fixas de variante/tamanho). Sem scripts, sem eval, e nada é enviado. Os componentes são salvos automaticamente no dispositivo via IndexedDB.',
        limits: 'Inclui quatro tipos de componente bem elaborados que cobrem necessidades comuns de UI; exporta um componente por vez, não uma biblioteca completa ou vinculação a framework. O CSS exportado é puro e sem dependências, pronto para qualquer projeto.'
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'cb.types': 'Component', 'cb.copyHtml': 'Copy HTML', 'cb.copyCss': 'Copy CSS', 'cb.export': 'Export .html',
      'cb.controls': 'Properties', 'cb.preview': 'Preview', 'cb.htmlLabel': 'HTML', 'cb.cssLabel': 'CSS', 'cb.projList': 'Saved',
      'cb.g.props': 'Properties', 'cb.withIcon': 'With icon',
      'cb.t.button': 'Button', 'cb.t.badge': 'Badge', 'cb.t.alert': 'Alert', 'cb.t.card': 'Card',
      'cb.f.text': 'Label', 'cb.f.subtext': 'Body', 'cb.f.variant': 'Variant', 'cb.f.size': 'Size', 'cb.f.accent': 'Accent', 'cb.f.radius': 'Radius', 'cb.f.icon': 'Icon',
      'cb.opt.solid': 'solid', 'cb.opt.outline': 'outline', 'cb.opt.ghost': 'ghost', 'cb.opt.soft': 'soft', 'cb.opt.sm': 'sm', 'cb.opt.md': 'md', 'cb.opt.lg': 'lg',
      'cb.opt.info': 'info', 'cb.opt.success': 'success', 'cb.opt.warning': 'warning', 'cb.opt.error': 'error', 'cb.opt.default': 'default', 'cb.opt.elevated': 'elevated',
      'cb.typeSet': '{name} selected', 'cb.restored': 'Restored your last component',
      'cb.copiedHtml': 'HTML copied to clipboard', 'cb.copiedCss': 'CSS copied to clipboard', 'cb.copyFail': 'Could not copy — export the file instead.', 'cb.exported': 'Component exported as .html',
      'cb.projNamePh': 'Component name…', 'cb.projSave': 'Save', 'cb.projOpen': 'Open', 'cb.projUntitled': 'Untitled component',
      'cb.projEmpty': 'Nothing saved yet.', 'cb.projSaved': 'Saved "{name}"', 'cb.projOpened': 'Opened "{name}"',
      'cb.dbUnavailable': 'Local storage unavailable — components cannot be saved.', 'cb.dbError': 'Could not reach local storage.',
      'cb.privacy': 'You build and export entirely in your browser. Exported HTML escapes all text and the CSS uses only validated values — no scripts, no eval, and nothing is uploaded.'
    },
    pt: {
      'cb.types': 'Componente', 'cb.copyHtml': 'Copiar HTML', 'cb.copyCss': 'Copiar CSS', 'cb.export': 'Exportar .html',
      'cb.controls': 'Propriedades', 'cb.preview': 'Prévia', 'cb.htmlLabel': 'HTML', 'cb.cssLabel': 'CSS', 'cb.projList': 'Salvos',
      'cb.g.props': 'Propriedades', 'cb.withIcon': 'Com ícone',
      'cb.t.button': 'Botão', 'cb.t.badge': 'Selo', 'cb.t.alert': 'Alerta', 'cb.t.card': 'Cartão',
      'cb.f.text': 'Rótulo', 'cb.f.subtext': 'Corpo', 'cb.f.variant': 'Variante', 'cb.f.size': 'Tamanho', 'cb.f.accent': 'Destaque', 'cb.f.radius': 'Raio', 'cb.f.icon': 'Ícone',
      'cb.opt.solid': 'sólido', 'cb.opt.outline': 'contorno', 'cb.opt.ghost': 'fantasma', 'cb.opt.soft': 'suave', 'cb.opt.sm': 'p', 'cb.opt.md': 'm', 'cb.opt.lg': 'g',
      'cb.opt.info': 'info', 'cb.opt.success': 'sucesso', 'cb.opt.warning': 'aviso', 'cb.opt.error': 'erro', 'cb.opt.default': 'padrão', 'cb.opt.elevated': 'elevado',
      'cb.typeSet': '{name} selecionado', 'cb.restored': 'Componente anterior restaurado',
      'cb.copiedHtml': 'HTML copiado para a área de transferência', 'cb.copiedCss': 'CSS copiado para a área de transferência', 'cb.copyFail': 'Não foi possível copiar — exporte o arquivo.', 'cb.exported': 'Componente exportado como .html',
      'cb.projNamePh': 'Nome do componente…', 'cb.projSave': 'Salvar', 'cb.projOpen': 'Abrir', 'cb.projUntitled': 'Componente sem nome',
      'cb.projEmpty': 'Nada salvo ainda.', 'cb.projSaved': 'Salvo "{name}"', 'cb.projOpened': 'Aberto "{name}"',
      'cb.dbUnavailable': 'Armazenamento local indisponível — componentes não podem ser salvos.', 'cb.dbError': 'Não foi possível acessar o armazenamento local.',
      'cb.privacy': 'Você cria e exporta inteiramente no navegador. O HTML exportado escapa todo texto e o CSS usa apenas valores validados — sem scripts, sem eval, e nada é enviado.'
    }
  });

  VT.registry.add(def);
  return def;
})();
