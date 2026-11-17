window.VT = window.VT || {};

/* U8 · Design System Lab — tune the daylight glass identity and export CSS tokens.
 * A flat token model drives live CSS custom properties on a preview root; controls are
 * color/range/select only, so every value is browser-validated and interpolated into the
 * exported stylesheet without any eval. Fully local, offline-capable.
 */
VT.modules['design-lab'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'design-lab';

  let alive = false;
  let refs = {};
  let hist = null;
  let tokens = {};
  let autosave = null;
  const AUTOSAVE_ID = 'ds:autosave';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- token schema ----------
  const DEFAULTS = {
    base: '#EDF7FD', accent: '#0A5E88', accent2: '#0B6247', text: '#08293A',
    glassAlpha: 0.55, blur: 20, borderAlpha: 0.14,
    radius: 14, shadowAlpha: 0.72, shadowY: 24, shadowBlur: 60,
    displayFont: 'serif', uiFont: 'sans'
  };

  const FONTS = {
    serif: "'Instrument Serif', Georgia, 'Times New Roman', serif",
    sans: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
    mono: "ui-monospace, 'Cascadia Code', 'SF Mono', Consolas, monospace",
    rounded: "'Nunito', 'Segoe UI', system-ui, sans-serif"
  };

  // control descriptors grouped for the panel
  const GROUPS = [
    { id: 'palette', label: 'ds.g.palette', fields: [
      { key: 'base', kind: 'color' }, { key: 'accent', kind: 'color' },
      { key: 'accent2', kind: 'color' }, { key: 'text', kind: 'color' }
    ] },
    { id: 'glass', label: 'ds.g.glass', fields: [
      { key: 'glassAlpha', kind: 'range', min: 0.10, max: 0.95, step: 0.01 },
      { key: 'blur', kind: 'range', min: 0, max: 40, step: 1, unit: 'px' },
      { key: 'borderAlpha', kind: 'range', min: 0.04, max: 0.40, step: 0.01 }
    ] },
    { id: 'shape', label: 'ds.g.shape', fields: [
      { key: 'radius', kind: 'range', min: 0, max: 28, step: 1, unit: 'px' },
      { key: 'shadowY', kind: 'range', min: 0, max: 40, step: 1, unit: 'px' },
      { key: 'shadowBlur', kind: 'range', min: 0, max: 100, step: 1, unit: 'px' },
      { key: 'shadowAlpha', kind: 'range', min: 0, max: 1, step: 0.02 }
    ] },
    { id: 'type', label: 'ds.g.type', fields: [
      { key: 'displayFont', kind: 'select', options: ['serif', 'sans', 'mono', 'rounded'] },
      { key: 'uiFont', kind: 'select', options: ['sans', 'serif', 'mono', 'rounded'] }
    ] }
  ];

  const PRESETS = {
    cosmic: { name: 'ds.p.cosmic', v: { ...DEFAULTS } },
    aurora: { name: 'ds.p.aurora', v: { base: '#0B1830', accent: '#7FF0D4', accent2: '#8FA0FF', text: '#EAF7FF', glassAlpha: 0.5, blur: 26, borderAlpha: 0.20, radius: 20, shadowAlpha: 0.6, shadowY: 28, shadowBlur: 70, displayFont: 'serif', uiFont: 'sans' } },
    midnight: { name: 'ds.p.midnight', v: { base: '#05070F', accent: '#5FE6FF', accent2: '#38B6E8', text: '#DCEBFF', glassAlpha: 0.72, blur: 14, borderAlpha: 0.10, radius: 12, shadowAlpha: 0.85, shadowY: 20, shadowBlur: 48, displayFont: 'serif', uiFont: 'sans' } },
    ember: { name: 'ds.p.ember', v: { base: '#1A0E14', accent: '#FFB27D', accent2: '#FF8FA3', text: '#FFEDE4', glassAlpha: 0.55, blur: 22, borderAlpha: 0.16, radius: 18, shadowAlpha: 0.7, shadowY: 26, shadowBlur: 64, displayFont: 'serif', uiFont: 'sans' } },
    frost: { name: 'ds.p.frost', v: { base: '#0E2233', accent: '#9DEAFF', accent2: '#7FF0D4', text: '#F2FAFF', glassAlpha: 0.40, blur: 34, borderAlpha: 0.28, radius: 26, shadowAlpha: 0.4, shadowY: 30, shadowBlur: 80, displayFont: 'serif', uiFont: 'sans' } }
  };

  // ---------- color helpers ----------
  function hexToRgb(hex) {
    let h = String(hex).replace('#', '').trim();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  function rgba(hex, a) {
    const c = hexToRgb(hex) || { r: 10, g: 27, b: 46 };
    return 'rgba(' + c.r + ', ' + c.g + ', ' + c.b + ', ' + (Math.round(a * 100) / 100) + ')';
  }
  function mix(hexA, hexB, tAmt) {
    const a = hexToRgb(hexA) || { r: 0, g: 0, b: 0 }, b = hexToRgb(hexB) || { r: 0, g: 0, b: 0 };
    const r = Math.round(a.r + (b.r - a.r) * tAmt), g = Math.round(a.g + (b.g - a.g) * tAmt), bl = Math.round(a.b + (b.b - a.b) * tAmt);
    return 'rgb(' + r + ', ' + g + ', ' + bl + ')';
  }

  // ---------- derived token values ----------
  function derived() {
    const r = clamp(tokens.radius, 0, 28);
    return {
      '--ds-base': tokens.base,
      '--ds-accent': tokens.accent,
      '--ds-accent2': tokens.accent2,
      '--ds-on-accent': VT.utils.luminance(tokens.accent) < 0.22 ? '#F5FCFF' : '#08293A',
      '--ds-text': tokens.text,
      '--ds-surface': rgba(tokens.base, clamp(tokens.glassAlpha, 0, 1)),
      '--ds-surface-2': rgba(mixHex(tokens.base, '#ffffff', 0.06), clamp(tokens.glassAlpha + 0.12, 0, 1)),
      '--ds-surface-3': rgba(mixHex(tokens.base, '#ffffff', 0.12), clamp(tokens.glassAlpha + 0.24, 0, 1)),
      '--ds-line': rgba(tokens.accent, clamp(tokens.borderAlpha, 0, 1)),
      '--ds-line-strong': rgba(tokens.accent, clamp(tokens.borderAlpha * 2, 0, 1)),
      '--ds-blur': clamp(tokens.blur, 0, 40) + 'px',
      '--ds-r-sm': Math.max(0, r - 4) + 'px',
      '--ds-r-md': r + 'px',
      '--ds-r-lg': (r + 6) + 'px',
      '--ds-r-xl': (r + 14) + 'px',
      '--ds-shadow': '0 ' + clamp(tokens.shadowY, 0, 40) + 'px ' + clamp(tokens.shadowBlur, 0, 100) + 'px -' + Math.round(clamp(tokens.shadowY, 0, 40) / 2) + 'px ' + rgba('#000000', clamp(tokens.shadowAlpha, 0, 1)),
      '--ds-font-display': FONTS[tokens.displayFont] || FONTS.serif,
      '--ds-font-ui': FONTS[tokens.uiFont] || FONTS.sans
    };
  }
  // hex+hex mix returning hex (for surface tinting)
  function mixHex(hexA, hexB, tAmt) {
    const a = hexToRgb(hexA) || { r: 10, g: 27, b: 46 }, b = hexToRgb(hexB) || { r: 255, g: 255, b: 255 };
    const to = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
    return '#' + to(a.r + (b.r - a.r) * tAmt) + to(a.g + (b.g - a.g) * tAmt) + to(a.b + (b.b - a.b) * tAmt);
  }

  const canonical = () => JSON.stringify(tokens);

  function applyVars() {
    const d = derived();
    for (const k in d) refs.preview.style.setProperty(k, d[k]);
  }

  function commit() {
    if (!alive) return;
    applyVars();
    if (refs.cssOut) refs.cssOut.textContent = exportCSS();
    hist.record(canonical()); syncHist();
    if (autosave) autosave();
  }
  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }

  // ---------- controls ----------
  function buildControls() {
    const wrap = refs.controls; wrap.innerHTML = '';
    GROUPS.forEach((g) => {
      const sec = document.createElement('div'); sec.className = 'ds-group';
      const h = document.createElement('div'); h.className = 'ds-group-head'; h.textContent = t(g.label);
      sec.append(h);
      g.fields.forEach((f) => sec.append(controlRow(f)));
      wrap.append(sec);
    });
  }

  function controlRow(f) {
    const row = document.createElement('div'); row.className = 'ds-ctrl';
    const lab = document.createElement('label'); lab.textContent = t('ds.f.' + f.key);
    let input, valEl;
    if (f.kind === 'color') {
      input = document.createElement('input'); input.type = 'color'; input.className = 'bench-color'; input.value = tokens[f.key];
      input.addEventListener('input', () => { tokens[f.key] = input.value; commit(); });
      valEl = document.createElement('span'); valEl.className = 'bench-val'; valEl.textContent = tokens[f.key];
      input.addEventListener('input', () => { valEl.textContent = input.value; });
    } else if (f.kind === 'range') {
      input = document.createElement('input'); input.type = 'range'; input.className = 'bench-range';
      input.min = f.min; input.max = f.max; input.step = f.step; input.value = tokens[f.key];
      valEl = document.createElement('span'); valEl.className = 'bench-val';
      const show = () => { valEl.textContent = f.unit === 'px' ? (Math.round(Number(input.value)) + ' px') : Number(input.value).toFixed(2); };
      show();
      input.addEventListener('input', () => { tokens[f.key] = Number(input.value); show(); commit(); });
    } else {
      input = document.createElement('select'); input.className = 'input ds-select';
      f.options.forEach((o) => { const op = document.createElement('option'); op.value = o; op.textContent = o; input.append(op); });
      input.value = tokens[f.key];
      input.addEventListener('change', () => { tokens[f.key] = input.value; commit(); });
    }
    row.append(lab);
    const line = document.createElement('div'); line.className = 'ds-ctrl-line'; line.append(input); if (valEl) line.append(valEl);
    row.append(line);
    return row;
  }

  function applyPreset(id) {
    const p = PRESETS[id]; if (!p) return;
    tokens = Object.assign({}, DEFAULTS, p.v);
    buildControls(); commit(); hist.record(canonical()); syncHist();
    refs.hint.textContent = t('ds.presetApplied', { name: t(p.name) });
  }

  // ---------- export ----------
  function exportCSS() {
    const d = derived();
    const lines = Object.keys(d).map((k) => '  ' + k + ': ' + d[k] + ';');
    return '/* Vistanology Design System Lab — daylight glass tokens */\n:root {\n' + lines.join('\n') + '\n}\n\n/* Sample usage */\n.ds-surface { background: var(--ds-surface); backdrop-filter: blur(var(--ds-blur)); border: 1px solid var(--ds-line); border-radius: var(--ds-r-md); box-shadow: var(--ds-shadow); color: var(--ds-text); font-family: var(--ds-font-ui); }\n';
  }

  // ---------- persistence ----------
  function loadProjects() {
    refs.projList.innerHTML = '';
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty ds-empty">' + esc(t('ds.dbUnavailable')) + '</div>'; return; }
    VT.db.list('design-lab').then((rows) => {
      rows = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.projList.innerHTML = '<div class="bench-empty ds-empty">' + esc(t('ds.projEmpty')) + '</div>'; return; }
      rows.forEach((r) => {
        const el = document.createElement('div'); el.className = 'bench-row ds-proj-row';
        const info = document.createElement('div'); info.className = 'ds-proj-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('ds.projUntitled');
        const meta = document.createElement('span'); meta.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(nm, meta);
        const open = document.createElement('button'); open.type = 'button'; open.className = 'btn btn-ghost btn-sm'; open.textContent = t('ds.projOpen');
        open.addEventListener('click', () => { tokens = Object.assign({}, DEFAULTS, (r.data && r.data.tokens) || {}); buildControls(); applyVars(); hist.reset(canonical()); syncHist(); toast(t('ds.projOpened', { name: r.name || t('ds.projUntitled') }), 'success'); });
        el.append(info, open);
        refs.projList.append(el);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty ds-empty">' + esc(t('ds.dbError')) + '</div>'; });
  }

  function mount(root) {
    alive = true;
    const s = VT.store.get(KEY, null);
    tokens = Object.assign({}, DEFAULTS, (s && s.tokens) || {});
    const I = VT.icons;

    root.innerHTML = `
      <div class="ds-stage glass-2" id="ds-stage">
        <div class="ds-bar">
          <span class="ds-presets" role="group" aria-label="${t('ds.presets')}">
            ${Object.keys(PRESETS).map((k) => '<button class="btn btn-ghost btn-sm" data-preset="' + k + '">' + esc(t(PRESETS[k].name)) + '</button>').join('')}
          </span>
          <span class="ds-sep" aria-hidden="true"></span>
          <button class="btn btn-ghost btn-sm" id="ds-reset">${I.broom} ${t('ds.reset')}</button>
          <button class="btn btn-ghost btn-sm" id="ds-undo" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
          <button class="btn btn-ghost btn-sm" id="ds-redo" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
          <span class="ds-bar-actions">
            <button class="btn btn-ghost btn-sm" id="ds-copy">${I.copy} ${t('ds.copyCss')}</button>
            <button class="btn btn-primary btn-sm" id="ds-export">${I.download} ${t('ds.export')}</button>
          </span>
        </div>
        <div class="ds-hint" id="ds-hint" role="status" aria-live="polite"></div>

        <div class="ds-work">
          <aside class="ds-controls" id="ds-controls" aria-label="${t('ds.controls')}"></aside>

          <section class="ds-preview-wrap" aria-label="${t('ds.preview')}">
            <div class="ds-preview" id="ds-preview">
              <div class="ds-hero">
                <span class="ds-badge">${I.sparkle} ${t('ds.badge')}</span>
                <h1 class="ds-h1">${t('ds.heroTitle')}</h1>
                <p class="ds-lead">${t('ds.heroLead')}</p>
                <div class="ds-row">
                  <button class="ds-btn ds-btn-primary">${t('ds.btnPrimary')}</button>
                  <button class="ds-btn ds-btn-ghost">${t('ds.btnGhost')}</button>
                </div>
              </div>
              <div class="ds-card">
                <div class="ds-card-head"><span class="ds-dot"></span><span class="ds-dot alt"></span><span class="ds-dot"></span></div>
                <h2 class="ds-h2">${t('ds.cardTitle')}</h2>
                <p class="ds-card-text">${t('ds.cardText')}</p>
                <input class="ds-input" type="text" placeholder="${t('ds.inputPh')}" aria-label="${t('ds.inputPh')}">
                <div class="ds-chips"><span class="ds-chip">radius</span><span class="ds-chip">blur</span><span class="ds-chip">shadow</span></div>
                <div class="ds-nested">${t('ds.nested')}</div>
              </div>
            </div>
          </section>

          <aside class="ds-side">
            <div class="ds-col-head">${t('ds.projList')}</div>
            <div class="ds-proj-save">
              <input class="input" id="ds-proj-name" type="text" placeholder="${t('ds.projNamePh')}" aria-label="${t('ds.projNamePh')}">
              <button class="btn btn-ghost btn-sm" id="ds-proj-save">${I.file} ${t('ds.projSave')}</button>
            </div>
            <div class="bench-list ds-proj-list" id="ds-proj-list"></div>
            <div class="ds-css" aria-label="${t('ds.cssLabel')}">
              <div class="ds-col-head">${t('ds.cssLabel')}</div>
              <pre class="bench-code ds-css-out" id="ds-css-out"></pre>
            </div>
          </aside>
        </div>

        <p class="privacy-line">${I.shield} ${t('ds.privacy')}</p>
      </div>`;

    refs = {
      stage: $('#ds-stage', root), controls: $('#ds-controls', root), preview: $('#ds-preview', root),
      hint: $('#ds-hint', root), cssOut: $('#ds-css-out', root),
      undo: $('#ds-undo', root), redo: $('#ds-redo', root), projList: $('#ds-proj-list', root), projName: $('#ds-proj-name', root)
    };

    autosave = U.debounce(() => {
      if (!alive || !VT.db.available) return;
      VT.db.put({ id: AUTOSAVE_ID, tool: 'design-lab', name: '(autosave)', data: { tokens } }).catch(() => {});
    }, 700);

    hist = VT.history.create({ apply: (val) => { tokens = val ? JSON.parse(val) : Object.assign({}, DEFAULTS); buildControls(); applyVars(); if (refs.cssOut) refs.cssOut.textContent = exportCSS(); syncHist(); } });

    buildControls();
    applyVars();

    $$('.ds-presets .btn', root).forEach((b) => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
    $('#ds-reset', root).addEventListener('click', () => { tokens = Object.assign({}, DEFAULTS); buildControls(); commit(); hist.record(canonical()); syncHist(); refs.hint.textContent = t('ds.resetDone'); });
    $('#ds-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#ds-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });

    const refreshCss = () => { refs.cssOut.textContent = exportCSS(); };
    refreshCss();

    $('#ds-copy', root).addEventListener('click', async () => {
      const ok = await U.copyText(exportCSS());
      toast(ok ? t('ds.copied') : t('ds.copyFail'), ok ? 'success' : 'error');
    });
    $('#ds-export', root).addEventListener('click', () => {
      U.downloadText(exportCSS(), 'vistanology-tokens.css', 'text/css');
      toast(t('ds.exported'), 'success');
    });

    $('#ds-proj-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('ds.dbUnavailable'), 'error'); return; }
      const name = refs.projName.value.trim() || t('ds.projUntitled');
      refs.projName.value = name;
      try { await VT.db.put({ tool: 'design-lab', name, data: { tokens } }); toast(t('ds.projSaved', { name }), 'success'); loadProjects(); }
      catch (e) { toast(t('ds.dbError'), 'error'); }
    });

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) { syncHist(); refs.cssOut.textContent = exportCSS(); }
    });

    // wrap commit to refresh CSS source
    const _commit = commit;
    commit = function () { _commit(); refs.cssOut.textContent = exportCSS(); };

    hist.reset(canonical()); syncHist();
    loadProjects();

    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then((rec) => {
        if (!alive || !rec || rec.tool !== 'design-lab' || !rec.data || !rec.data.tokens) return;
        tokens = Object.assign({}, DEFAULTS, rec.data.tokens);
        buildControls(); applyVars(); hist.reset(canonical()); syncHist();
        refs.cssOut.textContent = exportCSS();
        refs.hint.textContent = t('ds.restored');
      }).catch(() => {});
    }

    return () => { alive = false; };
  }

  function unmount() { alive = false; hist = null; autosave = null; refs = {}; }

  const def = {
    id: 'design-lab', cat: 'creative', icon: 'palette', version: '0.1.0',
    name: { en: 'Design System Lab', pt: 'Laboratório de Sistema de Design' },
    tagline: {
      en: 'Tune a daylight glass design system live — base and accent colors, glass tint, blur, radius, shadow and type — preview it on real components, and export the CSS custom properties. Fully offline.',
      pt: 'Ajuste um sistema de design em vidro diurno ao vivo — cores base e de destaque, tom do vidro, desfoque, raio, sombra e tipografia — pré-visualize em componentes reais e exporte as propriedades CSS. Totalmente offline.'
    },
    tags: ['design', 'tokens', 'css', 'glass', 'theme', 'creative'],
    deps: [],
    docs: {
      en: {
        summary: 'A live design-token studio for the daylight Aero glass identity: edit colors, glass, shape and type, see it applied to sample components instantly, save presets and named themes, and export a CSS custom-properties stylesheet.',
        usage: 'Pick a preset to start, then adjust any control — the preview updates live. Undo/redo the whole token set, save your theme by name, and Copy CSS or Export .css. Values are validated by the browser (color pickers, sliders, fixed font choices).',
        privacy: 'All editing and export run in your browser. Exported CSS is generated by interpolating only validated token values — no scripts, no eval. Themes autosave on-device via IndexedDB. Nothing is uploaded.',
        limits: 'Covers the identity tokens that matter for a glassmorphism system (palette, glass, radius, shadow, type). It exports tokens and a sample rule, not a full component library. Font stacks reference common families; exact rendering depends on installed fonts.'
      },
      pt: {
        summary: 'Um estúdio de tokens de design ao vivo para a identidade Aero de vidro diurno: edite cores, vidro, forma e tipografia, veja a aplicação imediata em componentes de exemplo, salve predefinições e temas nomeados e exporte uma folha de propriedades CSS.',
        usage: 'Escolha uma predefinição para começar e ajuste qualquer controle — a prévia atualiza ao vivo. Desfaça/refaça todo o conjunto de tokens, salve seu tema por nome e Copie o CSS ou Exporte .css. Os valores são validados pelo navegador (seletores de cor, sliders, fontes fixas).',
        privacy: 'Toda a edição e exportação rodam no navegador. O CSS exportado é gerado interpolando apenas valores de token validados — sem scripts, sem eval. Os temas são salvos automaticamente no dispositivo via IndexedDB. Nada é enviado.',
        limits: 'Cobre os tokens da identidade que importam para um sistema glassmorphism (paleta, vidro, raio, sombra, tipografia). Exporta tokens e uma regra de exemplo, não uma biblioteca de componentes completa. As pilhas de fonte referenciam famílias comuns; a renderização exata depende das fontes instaladas.'
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'ds.title': 'Design System Lab', 'ds.presets': 'Presets', 'ds.reset': 'Reset', 'ds.copyCss': 'Copy CSS', 'ds.export': 'Export .css',
      'ds.controls': 'Controls', 'ds.preview': 'Preview', 'ds.cssLabel': 'CSS output',
      'ds.g.palette': 'Palette', 'ds.g.glass': 'Glass', 'ds.g.shape': 'Shape', 'ds.g.type': 'Type',
      'ds.f.base': 'Base surface', 'ds.f.accent': 'Accent', 'ds.f.accent2': 'Accent 2', 'ds.f.text': 'Text',
      'ds.f.glassAlpha': 'Glass tint', 'ds.f.blur': 'Blur', 'ds.f.borderAlpha': 'Border',
      'ds.f.radius': 'Radius', 'ds.f.shadowY': 'Shadow offset', 'ds.f.shadowBlur': 'Shadow blur', 'ds.f.shadowAlpha': 'Shadow opacity',
      'ds.f.displayFont': 'Display font', 'ds.f.uiFont': 'UI font',
      'ds.p.cosmic': 'Cosmic', 'ds.p.aurora': 'Aurora', 'ds.p.midnight': 'Midnight', 'ds.p.ember': 'Ember', 'ds.p.frost': 'Frost',
      'ds.badge': 'Liquid Glass', 'ds.heroTitle': 'Design your surface system', 'ds.heroLead': 'Every control updates these components live — tune the identity, then export the tokens.',
      'ds.btnPrimary': 'Primary', 'ds.btnGhost': 'Secondary', 'ds.cardTitle': 'A glass card', 'ds.cardText': 'Backdrop blur, tinted surface, soft border and elevation all follow your tokens.',
      'ds.inputPh': 'Type something…', 'ds.nested': 'Nested surface',
      'ds.copied': 'CSS copied to clipboard', 'ds.copyFail': 'Could not copy — export the file instead.', 'ds.exported': 'Tokens exported as CSS',
      'ds.resetDone': 'Reset to Cosmic defaults', 'ds.presetApplied': 'Preset "{name}" applied', 'ds.restored': 'Restored your last theme',
      'ds.projList': 'Themes', 'ds.projNamePh': 'Theme name…', 'ds.projSave': 'Save', 'ds.projOpen': 'Open', 'ds.projUntitled': 'Untitled theme', 'ds.projEmpty': 'No saved themes yet.', 'ds.projSaved': 'Saved "{name}"', 'ds.projOpened': 'Opened "{name}"', 'ds.dbUnavailable': 'Local storage unavailable — themes cannot be saved.', 'ds.dbError': 'Could not reach local storage.',
      'ds.privacy': 'You tune and export entirely in your browser. Exported CSS interpolates only validated token values — no scripts, no eval, and nothing is uploaded.'
    },
    pt: {
      'ds.title': 'Laboratório de Sistema de Design', 'ds.presets': 'Predefinições', 'ds.reset': 'Redefinir', 'ds.copyCss': 'Copiar CSS', 'ds.export': 'Exportar .css',
      'ds.controls': 'Controles', 'ds.preview': 'Prévia', 'ds.cssLabel': 'Saída CSS',
      'ds.g.palette': 'Paleta', 'ds.g.glass': 'Vidro', 'ds.g.shape': 'Forma', 'ds.g.type': 'Tipografia',
      'ds.f.base': 'Superfície base', 'ds.f.accent': 'Destaque', 'ds.f.accent2': 'Destaque 2', 'ds.f.text': 'Texto',
      'ds.f.glassAlpha': 'Tom do vidro', 'ds.f.blur': 'Desfoque', 'ds.f.borderAlpha': 'Borda',
      'ds.f.radius': 'Raio', 'ds.f.shadowY': 'Deslocamento da sombra', 'ds.f.shadowBlur': 'Suavidade da sombra', 'ds.f.shadowAlpha': 'Opacidade da sombra',
      'ds.f.displayFont': 'Fonte de exibição', 'ds.f.uiFont': 'Fonte de interface',
      'ds.p.cosmic': 'Cósmico', 'ds.p.aurora': 'Aurora', 'ds.p.midnight': 'Meia-noite', 'ds.p.ember': 'Brasa', 'ds.p.frost': 'Geada',
      'ds.badge': 'Vidro Líquido', 'ds.heroTitle': 'Desenhe seu sistema de superfícies', 'ds.heroLead': 'Cada controle atualiza estes componentes ao vivo — ajuste a identidade e exporte os tokens.',
      'ds.btnPrimary': 'Primário', 'ds.btnGhost': 'Secundário', 'ds.cardTitle': 'Um cartão de vidro', 'ds.cardText': 'Desfoque, superfície tingida, borda suave e elevação seguem seus tokens.',
      'ds.inputPh': 'Digite algo…', 'ds.nested': 'Superfície aninhada',
      'ds.copied': 'CSS copiado para a área de transferência', 'ds.copyFail': 'Não foi possível copiar — exporte o arquivo.', 'ds.exported': 'Tokens exportados como CSS',
      'ds.resetDone': 'Redefinido para o padrão Cósmico', 'ds.presetApplied': 'Predefinição "{name}" aplicada', 'ds.restored': 'Tema anterior restaurado',
      'ds.projList': 'Temas', 'ds.projNamePh': 'Nome do tema…', 'ds.projSave': 'Salvar', 'ds.projOpen': 'Abrir', 'ds.projUntitled': 'Tema sem nome', 'ds.projEmpty': 'Nenhum tema salvo ainda.', 'ds.projSaved': 'Salvo "{name}"', 'ds.projOpened': 'Aberto "{name}"', 'ds.dbUnavailable': 'Armazenamento local indisponível — temas não podem ser salvos.', 'ds.dbError': 'Não foi possível acessar o armazenamento local.',
      'ds.privacy': 'Você ajusta e exporta inteiramente no navegador. O CSS exportado interpola apenas valores de token validados — sem scripts, sem eval, e nada é enviado.'
    }
  });

  VT.registry.add(def);
  return def;
})();
