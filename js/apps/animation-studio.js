window.VT = window.VT || {};

/* U10 · CSS Animation Studio — a visual @keyframes editor. A small typed model
 * (global timing settings + a list of stops, each with transform/opacity/color/radius)
 * compiles to plain CSS that is injected into a scoped <style> and applied to a preview
 * target. Every value comes from a browser-validated control (range/color/select), so the
 * exported stylesheet is safe to interpolate — no eval, no user-typed CSS. Fully local.
 */
VT.modules['animation-studio'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'animation-studio';
  const AUTOSAVE_ID = 'as:autosave';

  let alive = false;
  let refs = {};
  let hist = null;
  let anim = {};
  let selStop = 0;
  let autosave = null;
  let paused = false;
  let tlRaf = null;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const EASINGS = {
    'linear': [0, 0, 1, 1],
    'ease': [0.25, 0.1, 0.25, 1],
    'ease-in': [0.42, 0, 1, 1],
    'ease-out': [0, 0, 0.58, 1],
    'ease-in-out': [0.42, 0, 0.58, 1]
  };
  const EASING_OPTS = ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out', 'custom'];

  const stopProps = (o) => Object.assign({ x: 0, y: 0, rot: 0, scale: 1, opacity: 1, color: '#1FA0D8', radius: 14 }, o || {});
  const stop = (pct, o) => ({ pct: clamp(pct, 0, 100), props: stopProps(o) });

  const DEFAULT = () => ({
    duration: 1200, delay: 0, iteration: 'infinite', direction: 'normal', fill: 'both',
    easing: 'ease-in-out', bezier: [0.25, 0.1, 0.25, 1],
    stops: [stop(0, { scale: 1, opacity: 1 }), stop(50, { scale: 1.18, opacity: 0.75 }), stop(100, { scale: 1, opacity: 1 })]
  });

  const PRESETS = {
    pulse: { name: 'as.p.pulse', make: () => Object.assign(DEFAULT(), { duration: 1000, easing: 'ease-in-out', stops: [stop(0, { scale: 1 }), stop(50, { scale: 1.18, opacity: 0.7 }), stop(100, { scale: 1 })] }) },
    spin: { name: 'as.p.spin', make: () => Object.assign(DEFAULT(), { duration: 1500, easing: 'linear', stops: [stop(0, { rot: 0 }), stop(100, { rot: 360 })] }) },
    bounce: { name: 'as.p.bounce', make: () => Object.assign(DEFAULT(), { duration: 1000, easing: 'ease-in-out', stops: [stop(0, { y: 0 }), stop(25, { y: -44 }), stop(50, { y: 0 }), stop(75, { y: -22 }), stop(100, { y: 0 })] }) },
    slide: { name: 'as.p.slide', make: () => Object.assign(DEFAULT(), { duration: 800, easing: 'ease-out', iteration: '1', fill: 'both', stops: [stop(0, { x: -140, opacity: 0 }), stop(100, { x: 0, opacity: 1 })] }) },
    float: { name: 'as.p.float', make: () => Object.assign(DEFAULT(), { duration: 3000, easing: 'ease-in-out', stops: [stop(0, { y: 0 }), stop(50, { y: -18 }), stop(100, { y: 0 })] }) },
    shake: { name: 'as.p.shake', make: () => Object.assign(DEFAULT(), { duration: 500, easing: 'ease-in-out', stops: [stop(0, { x: 0 }), stop(20, { x: -12 }), stop(40, { x: 12 }), stop(60, { x: -8 }), stop(80, { x: 8 }), stop(100, { x: 0 })] }) }
  };

  // ---------- CSS compilation ----------
  function tfValue() {
    if (anim.easing === 'custom') {
      const b = anim.bezier.map((n) => Number(n).toFixed(3));
      return 'cubic-bezier(' + b.join(', ') + ')';
    }
    return anim.easing;
  }
  function transformStr(p) {
    return 'translate(' + Math.round(p.x) + 'px, ' + Math.round(p.y) + 'px) rotate(' + Math.round(p.rot) + 'deg) scale(' + Number(p.scale).toFixed(3) + ')';
  }
  function keyframesBlock() {
    const lines = anim.stops.slice().sort((a, b) => a.pct - b.pct).map((s) => {
      const p = s.props;
      return '  ' + s.pct + '% { transform: ' + transformStr(p) + '; opacity: ' + Number(p.opacity).toFixed(3) + '; background: ' + p.color + '; border-radius: ' + Math.round(p.radius) + 'px; }';
    });
    return '@keyframes as-anim {\n' + lines.join('\n') + '\n}';
  }
  function ruleBlock(withPlayState) {
    return '.as-target {\n' +
      '  animation-name: as-anim;\n' +
      '  animation-duration: ' + Math.round(anim.duration) + 'ms;\n' +
      '  animation-timing-function: ' + tfValue() + ';\n' +
      '  animation-delay: ' + Math.round(anim.delay) + 'ms;\n' +
      '  animation-iteration-count: ' + anim.iteration + ';\n' +
      '  animation-direction: ' + anim.direction + ';\n' +
      '  animation-fill-mode: ' + anim.fill + ';\n' +
      (withPlayState ? '  animation-play-state: ' + (paused ? 'paused' : 'running') + ';\n' : '') +
      '}';
  }
  // buildCSS(false) = live stylesheet (carries play-state); buildCSS(true) = export (no play-state)
  function buildCSS(forExport) { return keyframesBlock() + '\n\n' + ruleBlock(!forExport) + '\n'; }

  const canonical = () => JSON.stringify(anim);

  function renderPreview() {
    if (!refs.style) return;
    refs.style.textContent = buildCSS(false);
    if (refs.target) refs.target.classList.toggle('is-paused', paused);
    renderTimeline();
  }

  // ---------- timeline ----------
  function renderTimeline() {
    if (!refs.tlTicks) return;
    refs.tlTicks.innerHTML = anim.stops.map((s, i) =>
      '<button type="button" class="as-tl-tick' + (i === selStop ? ' is-on' : '') + '" data-i="' + i +
      '" data-pct="' + s.pct + '" style="left:' + clamp(s.pct, 0, 100) + '%" aria-label="' + s.pct + '%"></button>').join('');
    if (refs.tlDur) refs.tlDur.textContent = Math.round(anim.duration) + 'ms';
    if (refs.tlMid) refs.tlMid.textContent = (anim.easing === 'custom' ? 'cubic-bezier' : anim.easing) + ' · ' + anim.direction;
  }

  function tickTimeline(now) {
    if (!alive || !refs.tlPh) return;
    const d = Math.max(1, Number(anim.duration) || 1);
    const delay = Number(anim.delay) || 0;
    let pos = 0;
    const running = refs.target && refs.target.getAnimations ? refs.target.getAnimations()[0] : null;
    if (running && running.currentTime != null) {
      const elapsed = Number(running.currentTime) - delay;
      pos = elapsed <= 0 ? 0 : (elapsed % d) / d;
    } else {
      pos = ((now || 0) % d) / d;
    }
    const pct = (pos * 100).toFixed(2) + '%';
    refs.tlPh.style.left = pct;
    refs.tlFill.style.width = pct;
    tlRaf = requestAnimationFrame(tickTimeline);
  }

  function commit() {
    if (!alive) return;
    renderPreview();
    if (refs.cssOut) refs.cssOut.textContent = buildCSS(true);
    hist.record(canonical()); syncHist();
    if (autosave) autosave();
  }
  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }

  function restart() {
    if (!refs.style) return;
    paused = false;
    if (refs.play) refs.play.textContent = t('as.pause');
    refs.style.textContent = '';
    void (refs.stage && refs.stage.offsetWidth);
    renderPreview();
  }

  // ---------- controls ----------
  function settingRow(key, kind, extra) {
    const row = document.createElement('div'); row.className = 'field as-ctrl';
    const lab = document.createElement('label'); lab.textContent = t('as.f.' + key);
    let input, valEl;
    if (kind === 'range') {
      input = document.createElement('input'); input.type = 'range'; input.className = 'bench-range';
      input.min = extra.min; input.max = extra.max; input.step = extra.step; input.value = anim[key];
      valEl = document.createElement('span'); valEl.className = 'bench-val';
      const show = () => { valEl.textContent = (extra.unit ? Math.round(Number(input.value)) + ' ' + extra.unit : Number(input.value).toFixed(2)); };
      show();
      input.addEventListener('input', () => { anim[key] = Number(input.value); show(); commit(); });
    } else if (kind === 'select') {
      input = document.createElement('select'); input.className = 'input as-select';
      extra.options.forEach((o) => { const op = document.createElement('option'); op.value = o; op.textContent = t('as.opt.' + key + '.' + o); input.append(op); });
      input.value = anim[key];
      input.addEventListener('change', () => { anim[key] = input.value; commit(); if (key === 'easing') buildControls(); });
    }
    row.append(lab);
    const line = document.createElement('div'); line.className = 'as-ctrl-line'; line.append(input); if (valEl) line.append(valEl);
    row.append(line);
    return row;
  }

  function bezierRow(i) {
    const row = document.createElement('div'); row.className = 'field as-ctrl';
    const lab = document.createElement('label'); lab.textContent = t('as.f.bez' + (i + 1));
    const input = document.createElement('input'); input.type = 'range'; input.className = 'bench-range';
    input.min = (i % 2 === 0 ? 0 : -0.5); input.max = (i % 2 === 0 ? 1 : 1.5); input.step = 0.01; input.value = anim.bezier[i];
    const valEl = document.createElement('span'); valEl.className = 'bench-val'; valEl.textContent = Number(anim.bezier[i]).toFixed(2);
    input.addEventListener('input', () => { anim.bezier[i] = Number(input.value); valEl.textContent = Number(input.value).toFixed(2); commit(); });
    row.append(lab);
    const line = document.createElement('div'); line.className = 'as-ctrl-line'; line.append(input, valEl);
    row.append(line);
    return row;
  }

  function stopPropRow(key, kind, extra) {
    const p = anim.stops[selStop].props;
    const row = document.createElement('div'); row.className = 'field as-ctrl';
    const lab = document.createElement('label'); lab.textContent = t('as.p.' + key);
    let input, valEl;
    if (kind === 'color') {
      input = document.createElement('input'); input.type = 'color'; input.className = 'bench-color'; input.value = p[key];
      valEl = document.createElement('span'); valEl.className = 'bench-val'; valEl.textContent = p[key];
      input.addEventListener('input', () => { p[key] = input.value; valEl.textContent = input.value; commit(); });
    } else {
      input = document.createElement('input'); input.type = 'range'; input.className = 'bench-range';
      input.min = extra.min; input.max = extra.max; input.step = extra.step; input.value = p[key];
      valEl = document.createElement('span'); valEl.className = 'bench-val';
      const show = () => { valEl.textContent = (extra.unit ? Math.round(Number(input.value)) + ' ' + extra.unit : Number(input.value).toFixed(2)); };
      show();
      input.addEventListener('input', () => { p[key] = Number(input.value); show(); commit(); });
    }
    row.append(lab);
    const line = document.createElement('div'); line.className = 'as-ctrl-line'; line.append(input); if (valEl) line.append(valEl);
    row.append(line);
    return row;
  }

  function buildControls() {
    const wrap = refs.controls; if (!wrap) return;
    wrap.innerHTML = '';

    const g1 = document.createElement('div'); g1.className = 'bench-sec glass';
    g1.append(head(t('as.g.timing')));
    g1.append(settingRow('duration', 'range', { min: 200, max: 4000, step: 50, unit: 'ms' }));
    g1.append(settingRow('delay', 'range', { min: 0, max: 1000, step: 50, unit: 'ms' }));
    g1.append(settingRow('iteration', 'select', { options: ['infinite', '1', '2', '3'] }));
    g1.append(settingRow('direction', 'select', { options: ['normal', 'reverse', 'alternate', 'alternate-reverse'] }));
    g1.append(settingRow('fill', 'select', { options: ['none', 'forwards', 'backwards', 'both'] }));
    g1.append(settingRow('easing', 'select', { options: EASING_OPTS }));
    if (anim.easing === 'custom') { [0, 1, 2, 3].forEach((i) => g1.append(bezierRow(i))); }
    wrap.append(g1);

    const g2 = document.createElement('div'); g2.className = 'bench-sec glass';
    g2.append(head(t('as.g.stops')));
    const chips = document.createElement('div'); chips.className = 'as-stops';
    anim.stops.slice().sort((a, b) => a.pct - b.pct).forEach((s) => {
      const idx = anim.stops.indexOf(s);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'as-stop' + (idx === selStop ? ' is-on' : ''); b.textContent = s.pct + '%';
      b.addEventListener('click', () => { selStop = idx; buildControls(); });
      chips.append(b);
    });
    g2.append(chips);
    const stopBtns = document.createElement('div'); stopBtns.className = 'as-stop-btns';
    const add = document.createElement('button'); add.type = 'button'; add.className = 'btn btn-ghost btn-sm'; add.textContent = t('as.addStop');
    add.addEventListener('click', addStop);
    const rem = document.createElement('button'); rem.type = 'button'; rem.className = 'btn btn-ghost btn-sm'; rem.textContent = t('as.removeStop'); rem.disabled = anim.stops.length <= 2;
    rem.addEventListener('click', () => { if (anim.stops.length > 2) { anim.stops.splice(selStop, 1); selStop = clamp(selStop, 0, anim.stops.length - 1); buildControls(); commit(); } });
    const pct = document.createElement('label'); pct.className = 'as-pct';
    const pctInput = document.createElement('input'); pctInput.type = 'number'; pctInput.className = 'input as-pct-input'; pctInput.min = 0; pctInput.max = 100; pctInput.value = anim.stops[selStop].pct;
    pctInput.addEventListener('change', () => { anim.stops[selStop].pct = clamp(Math.round(Number(pctInput.value) || 0), 0, 100); buildControls(); commit(); });
    pct.append(document.createTextNode(t('as.pct')), pctInput);
    stopBtns.append(add, rem, pct);
    g2.append(stopBtns);
    wrap.append(g2);

    const g3 = document.createElement('div'); g3.className = 'bench-sec glass';
    g3.append(head(t('as.g.props')));
    g3.append(stopPropRow('x', 'range', { min: -160, max: 160, step: 1, unit: 'px' }));
    g3.append(stopPropRow('y', 'range', { min: -160, max: 160, step: 1, unit: 'px' }));
    g3.append(stopPropRow('rot', 'range', { min: -360, max: 360, step: 1, unit: 'deg' }));
    g3.append(stopPropRow('scale', 'range', { min: 0, max: 2, step: 0.05 }));
    g3.append(stopPropRow('opacity', 'range', { min: 0, max: 1, step: 0.05 }));
    g3.append(stopPropRow('color', 'color'));
    g3.append(stopPropRow('radius', 'range', { min: 0, max: 40, step: 1, unit: 'px' }));
    wrap.append(g3);

    drawCurve();
    renderTimeline();
  }

  function head(txt) { const h = document.createElement('h3'); h.className = 'bench-sec-head'; h.textContent = txt; return h; }

  function addStop() {
    const sorted = anim.stops.slice().sort((a, b) => a.pct - b.pct);
    let bestGap = -1, at = 50;
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].pct - sorted[i].pct;
      if (gap > bestGap) { bestGap = gap; at = Math.round((sorted[i].pct + sorted[i + 1].pct) / 2); }
    }
    if (anim.stops.some((s) => s.pct === at)) at = clamp(at + 5, 0, 100);
    const base = sorted[0] ? sorted[0].props : stopProps();
    anim.stops.push(stop(at, Object.assign({}, base)));
    selStop = anim.stops.length - 1;
    buildControls(); commit();
  }

  // ---------- easing curve ----------
  function drawCurve() {
    if (!refs.curve) return;
    const pts = anim.easing === 'custom' ? anim.bezier : (EASINGS[anim.easing] || EASINGS.linear);
    const X = (v) => Number(v) * 100;
    const Y = (v) => 100 - Number(v) * 100;
    const path = 'M ' + X(0) + ' ' + Y(0) + ' C ' + X(pts[0]) + ' ' + Y(pts[1]) + ', ' + X(pts[2]) + ' ' + Y(pts[3]) + ', ' + X(1) + ' ' + Y(1);
    refs.curve.innerHTML =
      '<svg viewBox="-6 -6 112 112" preserveAspectRatio="none" class="as-svg">' +
      '<line x1="0" y1="0" x2="100" y2="0" class="as-grid"/><line x1="0" y1="100" x2="100" y2="100" class="as-grid"/>' +
      '<line x1="0" y1="0" x2="0" y2="100" class="as-grid"/><line x1="100" y1="0" x2="100" y2="100" class="as-grid"/>' +
      '<line x1="0" y1="100" x2="' + X(pts[0]) + '" y2="' + Y(pts[1]) + '" class="as-handle"/>' +
      '<line x1="100" y1="0" x2="' + X(pts[2]) + '" y2="' + Y(pts[3]) + '" class="as-handle"/>' +
      '<path d="' + path + '" class="as-curve"/>' +
      '<circle cx="' + X(pts[0]) + '" cy="' + Y(pts[1]) + '" r="3" class="as-dot"/>' +
      '<circle cx="' + X(pts[2]) + '" cy="' + Y(pts[3]) + '" r="3" class="as-dot"/>' +
      '</svg>';
    if (refs.curveLabel) refs.curveLabel.textContent = t('as.tf') + ': ' + tfValue();
  }

  // ---------- persistence ----------
  function loadProjects() {
    refs.projList.innerHTML = '';
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty as-empty">' + esc(t('as.dbUnavailable')) + '</div>'; return; }
    VT.db.list('animation-studio').then((rows) => {
      rows = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.projList.innerHTML = '<div class="bench-empty as-empty">' + esc(t('as.projEmpty')) + '</div>'; return; }
      rows.forEach((r) => {
        const el = document.createElement('div'); el.className = 'bench-row as-proj-row';
        const info = document.createElement('div'); info.className = 'as-proj-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('as.projUntitled');
        const meta = document.createElement('span'); meta.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(nm, meta);
        const open = document.createElement('button'); open.type = 'button'; open.className = 'btn btn-ghost btn-sm'; open.textContent = t('as.projOpen');
        open.addEventListener('click', () => {
          anim = Object.assign(DEFAULT(), (r.data && r.data.anim) || {});
          selStop = clamp(selStop, 0, anim.stops.length - 1);
          buildControls(); renderPreview(); hist.reset(canonical()); syncHist();
          refs.cssOut.textContent = buildCSS(true);
          toast(t('as.projOpened', { name: r.name || t('as.projUntitled') }), 'success');
        });
        el.append(info, open);
        refs.projList.append(el);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty as-empty">' + esc(t('as.dbError')) + '</div>'; });
  }

  function applyPreset(id) {
    const p = PRESETS[id]; if (!p) return;
    anim = p.make(); selStop = 0;
    buildControls(); commit();
    restart();
    refs.hint.textContent = t('as.presetApplied', { name: t(p.name) });
  }

  function mount(root) {
    alive = true;
    paused = false;
    const s = VT.store.get(KEY, null);
    anim = Object.assign(DEFAULT(), (s && s.anim) || {});
    if (!anim.stops || !anim.stops.length) anim = DEFAULT();
    const I = VT.icons;

    root.innerHTML = `
      <div class="as-stage glass-2" id="as-stage">
        <style id="as-style"></style>
        <div class="as-bar">
          <button class="btn btn-primary btn-sm" id="as-play">${I.check} ${t('as.pause')}</button>
          <button class="btn btn-ghost btn-sm" id="as-restart">${I.undo} ${t('as.restart')}</button>
          <span class="bench-sep" aria-hidden="true"></span>
          <span class="bench-seg as-presets" role="group" aria-label="${t('as.presets')}">
            ${Object.keys(PRESETS).map((k) => '<button class="btn btn-ghost btn-sm" data-preset="' + k + '" aria-pressed="false">' + esc(t(PRESETS[k].name)) + '</button>').join('')}
          </span>
          <span class="as-bar-actions">
            <button class="btn btn-ghost btn-sm" id="as-undo" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
            <button class="btn btn-ghost btn-sm" id="as-redo" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
            <button class="btn btn-ghost btn-sm" id="as-copy">${I.copy} ${t('as.copy')}</button>
            <button class="btn btn-primary btn-sm" id="as-export">${I.download} ${t('as.export')}</button>
          </span>
        </div>
        <div class="bench-hint" id="as-hint" role="status" aria-live="polite"></div>

        <div class="as-work">
          <aside class="as-controls" id="as-controls" aria-label="${t('as.controls')}"></aside>

          <section class="as-preview-wrap" aria-label="${t('as.preview')}">
            <div class="as-scene" id="as-scene">
              <div class="as-target" id="as-target"></div>
            </div>
            <div class="as-tl" id="as-tl">
              <div class="as-tl-head">
                <span>0</span>
                <span class="as-tl-mid" id="as-tl-mid"></span>
                <span id="as-tl-dur"></span>
              </div>
              <div class="as-tl-track">
                <div class="as-tl-fill" id="as-tl-fill"></div>
                <div class="as-tl-ticks" id="as-tl-ticks"></div>
                <div class="as-tl-ph" id="as-tl-ph"></div>
              </div>
            </div>
            <div class="as-curve-box">
              <div class="as-curve" id="as-curve" aria-hidden="true"></div>
              <span class="as-curve-label" id="as-curve-label"></span>
            </div>
          </section>

          <aside class="as-side">
            <section class="bench-sec glass">
              <h3 class="bench-sec-head">${t('as.projList')}</h3>
              <div class="as-proj-save">
                <input class="input" id="as-proj-name" type="text" placeholder="${t('as.projNamePh')}" aria-label="${t('as.projNamePh')}">
                <button class="btn btn-ghost btn-sm" id="as-proj-save">${I.file} ${t('as.projSave')}</button>
              </div>
              <div class="bench-list as-proj-list" id="as-proj-list"></div>
            </section>
            <section class="bench-sec glass" aria-label="${t('as.cssLabel')}">
              <h3 class="bench-sec-head">${t('as.cssLabel')}</h3>
              <pre class="bench-code as-css-out" id="as-css-out"></pre>
            </section>
          </aside>
        </div>

        <p class="privacy-line">${I.shield} ${t('as.privacy')}</p>
      </div>`;

    refs = {
      stage: $('#as-stage', root), style: $('#as-style', root), controls: $('#as-controls', root),
      scene: $('#as-scene', root), target: $('#as-target', root), curve: $('#as-curve', root), curveLabel: $('#as-curve-label', root),
      hint: $('#as-hint', root), cssOut: $('#as-css-out', root), play: $('#as-play', root),
      tlTicks: $('#as-tl-ticks', root), tlFill: $('#as-tl-fill', root), tlPh: $('#as-tl-ph', root),
      tlDur: $('#as-tl-dur', root), tlMid: $('#as-tl-mid', root),
      undo: $('#as-undo', root), redo: $('#as-redo', root), projList: $('#as-proj-list', root), projName: $('#as-proj-name', root)
    };

    autosave = U.debounce(() => {
      if (!alive) return;
      VT.store.set(KEY, { anim });
      if (VT.db.available) VT.db.put({ id: AUTOSAVE_ID, tool: 'animation-studio', name: '(autosave)', data: { anim } }).catch(() => {});
    }, 700);

    hist = VT.history.create({ apply: (val) => { anim = val ? JSON.parse(val) : DEFAULT(); selStop = clamp(selStop, 0, anim.stops.length - 1); buildControls(); renderPreview(); if (refs.cssOut) refs.cssOut.textContent = buildCSS(true); syncHist(); } });

    buildControls();
    renderPreview();

    $('#as-play', root).addEventListener('click', () => {
      paused = !paused;
      refs.play.innerHTML = paused ? (I.check + ' ' + t('as.play')) : (I.check + ' ' + t('as.pause'));
      renderPreview();
      refs.hint.textContent = paused ? t('as.paused') : t('as.playing');
    });
    $('#as-restart', root).addEventListener('click', restart);
    refs.tlTicks.addEventListener('click', (e) => {
      const tick = e.target.closest('.as-tl-tick');
      if (!tick) return;
      selStop = Number(tick.dataset.i) || 0;
      buildControls();
    });
    tlRaf = requestAnimationFrame(tickTimeline);
    $$('.as-presets .btn', root).forEach((b) => b.addEventListener('click', () => { applyPreset(b.dataset.preset); $$('.as-presets .btn', root).forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));

    $('#as-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); restart(); });
    $('#as-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); restart(); });

    $('#as-copy', root).addEventListener('click', async () => {
      const ok = await U.copyText(buildCSS(true));
      toast(ok ? t('as.copied') : t('as.copyFail'), ok ? 'success' : 'error');
    });
    $('#as-export', root).addEventListener('click', () => {
      U.downloadText('/* Vistanology CSS Animation Studio */\n' + buildCSS(true), 'vistanology-animation.css', 'text/css');
      toast(t('as.exported'), 'success');
    });

    $('#as-proj-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('as.dbUnavailable'), 'error'); return; }
      const name = refs.projName.value.trim() || t('as.projUntitled');
      refs.projName.value = name;
      try { await VT.db.put({ tool: 'animation-studio', name, data: { anim } }); toast(t('as.projSaved', { name }), 'success'); loadProjects(); }
      catch (e) { toast(t('as.dbError'), 'error'); }
    });

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) { syncHist(); restart(); }
    });

    hist.reset(canonical()); syncHist();
    refs.cssOut.textContent = buildCSS(true);
    loadProjects();

    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then((rec) => {
        if (!alive || !rec || !rec.data || !rec.data.anim) return;
        anim = Object.assign(DEFAULT(), rec.data.anim);
        selStop = clamp(selStop, 0, anim.stops.length - 1);
        buildControls(); renderPreview(); hist.reset(canonical()); syncHist();
        refs.cssOut.textContent = buildCSS(true);
        refs.hint.textContent = t('as.restored');
      }).catch(() => {});
    }

    return () => { alive = false; };
  }

  function unmount() { alive = false; if (tlRaf) cancelAnimationFrame(tlRaf); tlRaf = null; hist = null; autosave = null; refs = {}; }

  const def = {
    id: 'animation-studio', cat: 'creative', icon: 'sparkle', version: '0.1.0',
    name: { en: 'CSS Animation Studio', pt: 'Estúdio de Animação CSS' },
    tagline: {
      en: 'Build CSS @keyframes visually — timing, easing curves and per-stop transform, opacity, color and radius — preview it live, and export clean CSS. No hand-written keyframes, no eval. Fully offline.',
      pt: 'Crie @keyframes de CSS visualmente — tempo, curvas de easing e, por quadro, transformação, opacidade, cor e raio — pré-visualize ao vivo e exporte CSS limpo. Sem keyframes escritos à mão, sem eval. Totalmente offline.'
    },
    tags: ['css', 'animation', 'keyframes', 'easing', 'motion', 'creative'],
    deps: [],
    docs: {
      en: {
        summary: 'A visual CSS animation editor: set duration, delay, iteration, direction, fill and an easing curve (named or cubic-bezier), then shape keyframe stops with transform, opacity, color and radius. Preview it live and export the @keyframes + rule as plain CSS.',
        usage: 'Pick a preset (Pulse, Spin, Bounce, Slide, Float, Shake) to start, tune the timing, and edit the selected stop with the property sliders. Add or remove stops to place keyframes, choose an easing (or a custom cubic-bezier and watch the curve), and Play/Pause or Restart the preview. Copy CSS or Export .css to save the stylesheet.',
        privacy: 'All editing and export run in your browser. The stylesheet is compiled from browser-validated control values (sliders, color pickers, fixed option lists) — no free-text CSS, no scripts, no eval. Animations autosave on-device via IndexedDB. Nothing is uploaded.',
        limits: 'Animates a single sample target with the properties that cover most UI motion (translate, rotate, scale, opacity, background, border-radius). It exports @keyframes + one rule, not multi-element timelines. The preview uses standard CSS animations; the easing curve is a visual guide to the timing function.'
      },
      pt: {
        summary: 'Um editor visual de animação CSS: defina duração, atraso, iteração, direção, preenchimento e uma curva de easing (nomeada ou cubic-bezier) e, então, modele quadros com transformação, opacidade, cor e raio. Pré-visualize ao vivo e exporte os @keyframes + regra como CSS puro.',
        usage: 'Escolha uma predefinição (Pulso, Giro, Quicar, Deslizar, Flutuar, Tremer) para começar, ajuste o tempo e edite o quadro selecionado com os sliders de propriedade. Adicione ou remova quadros para posicionar keyframes, escolha um easing (ou um cubic-bezier personalizado e veja a curva) e Reproduza/Pauseie ou Reinicie a prévia. Copie o CSS ou Exporte .css para salvar a folha.',
        privacy: 'Toda a edição e exportação rodam no navegador. A folha é compilada a partir de valores validados pelo navegador (sliders, seletores de cor, listas de opções fixas) — sem CSS em texto livre, sem scripts, sem eval. As animações são salvas automaticamente no dispositivo via IndexedDB. Nada é enviado.',
        limits: 'Anima um único alvo de exemplo com as propriedades que cobrem a maior parte do movimento de UI (transladar, girar, escalar, opacidade, fundo, raio). Exporta @keyframes + uma regra, não linhas do tempo com vários elementos. A prévia usa animações CSS padrão; a curva de easing é um guia visual da função de tempo.'
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'as.presets': 'Presets', 'as.play': 'Play', 'as.pause': 'Pause', 'as.restart': 'Restart', 'as.copy': 'Copy CSS', 'as.export': 'Export .css',
      'as.controls': 'Controls', 'as.preview': 'Preview', 'as.cssLabel': 'CSS output', 'as.projList': 'Saved', 'as.tf': 'Timing',
      'as.g.timing': 'Timing', 'as.g.stops': 'Keyframe stops', 'as.g.props': 'Selected stop',
      'as.f.duration': 'Duration', 'as.f.delay': 'Delay', 'as.f.iteration': 'Iterations', 'as.f.direction': 'Direction', 'as.f.fill': 'Fill mode', 'as.f.easing': 'Easing',
      'as.f.bez1': 'cubic-bezier x1', 'as.f.bez2': 'y1', 'as.f.bez3': 'x2', 'as.f.bez4': 'y2',
      'as.p.x': 'Move X', 'as.p.y': 'Move Y', 'as.p.rot': 'Rotate', 'as.p.scale': 'Scale', 'as.p.opacity': 'Opacity', 'as.p.color': 'Color', 'as.p.radius': 'Radius',
      'as.opt.iteration.infinite': 'infinite', 'as.opt.iteration.1': '1', 'as.opt.iteration.2': '2', 'as.opt.iteration.3': '3',
      'as.opt.direction.normal': 'normal', 'as.opt.direction.reverse': 'reverse', 'as.opt.direction.alternate': 'alternate', 'as.opt.direction.alternate-reverse': 'alternate-reverse',
      'as.opt.fill.none': 'none', 'as.opt.fill.forwards': 'forwards', 'as.opt.fill.backwards': 'backwards', 'as.opt.fill.both': 'both',
      'as.opt.easing.linear': 'linear', 'as.opt.easing.ease': 'ease', 'as.opt.easing.ease-in': 'ease-in', 'as.opt.easing.ease-out': 'ease-out', 'as.opt.easing.ease-in-out': 'ease-in-out', 'as.opt.easing.custom': 'cubic-bezier…',
      'as.addStop': '+ Stop', 'as.removeStop': 'Remove', 'as.pct': 'At %',
      'as.p.pulse': 'Pulse', 'as.p.spin': 'Spin', 'as.p.bounce': 'Bounce', 'as.p.slide': 'Slide in', 'as.p.float': 'Float', 'as.p.shake': 'Shake',
      'as.copied': 'CSS copied to clipboard', 'as.copyFail': 'Could not copy — export the file instead.', 'as.exported': 'Animation exported as CSS',
      'as.paused': 'Paused', 'as.playing': 'Playing', 'as.presetApplied': 'Preset "{name}" applied', 'as.restored': 'Restored your last animation',
      'as.projNamePh': 'Animation name…', 'as.projSave': 'Save', 'as.projOpen': 'Open', 'as.projUntitled': 'Untitled animation',
      'as.projEmpty': 'Nothing saved yet.', 'as.projSaved': 'Saved "{name}"', 'as.projOpened': 'Opened "{name}"',
      'as.dbUnavailable': 'Local storage unavailable — animations cannot be saved.', 'as.dbError': 'Could not reach local storage.',
      'as.privacy': 'You build and export entirely in your browser. The stylesheet compiles from validated control values only — no hand-written CSS, no eval, and nothing is uploaded.'
    },
    pt: {
      'as.presets': 'Predefinições', 'as.play': 'Reproduzir', 'as.pause': 'Pausar', 'as.restart': 'Reiniciar', 'as.copy': 'Copiar CSS', 'as.export': 'Exportar .css',
      'as.controls': 'Controles', 'as.preview': 'Prévia', 'as.cssLabel': 'Saída CSS', 'as.projList': 'Salvos', 'as.tf': 'Tempo',
      'as.g.timing': 'Tempo', 'as.g.stops': 'Quadros-chave', 'as.g.props': 'Quadro selecionado',
      'as.f.duration': 'Duração', 'as.f.delay': 'Atraso', 'as.f.iteration': 'Iterações', 'as.f.direction': 'Direção', 'as.f.fill': 'Preenchimento', 'as.f.easing': 'Easing',
      'as.f.bez1': 'cubic-bezier x1', 'as.f.bez2': 'y1', 'as.f.bez3': 'x2', 'as.f.bez4': 'y2',
      'as.p.x': 'Mover X', 'as.p.y': 'Mover Y', 'as.p.rot': 'Girar', 'as.p.scale': 'Escalar', 'as.p.opacity': 'Opacidade', 'as.p.color': 'Cor', 'as.p.radius': 'Raio',
      'as.opt.iteration.infinite': 'infinitas', 'as.opt.iteration.1': '1', 'as.opt.iteration.2': '2', 'as.opt.iteration.3': '3',
      'as.opt.direction.normal': 'normal', 'as.opt.direction.reverse': 'reversa', 'as.opt.direction.alternate': 'alternada', 'as.opt.direction.alternate-reverse': 'alternada reversa',
      'as.opt.fill.none': 'nenhum', 'as.opt.fill.forwards': 'para frente', 'as.opt.fill.backwards': 'para trás', 'as.opt.fill.both': 'ambos',
      'as.opt.easing.linear': 'linear', 'as.opt.easing.ease': 'ease', 'as.opt.easing.ease-in': 'ease-in', 'as.opt.easing.ease-out': 'ease-out', 'as.opt.easing.ease-in-out': 'ease-in-out', 'as.opt.easing.custom': 'cubic-bezier…',
      'as.addStop': '+ Quadro', 'as.removeStop': 'Remover', 'as.pct': 'Em %',
      'as.p.pulse': 'Pulso', 'as.p.spin': 'Giro', 'as.p.bounce': 'Quicar', 'as.p.slide': 'Deslizar', 'as.p.float': 'Flutuar', 'as.p.shake': 'Tremer',
      'as.copied': 'CSS copiado para a área de transferência', 'as.copyFail': 'Não foi possível copiar — exporte o arquivo.', 'as.exported': 'Animação exportada como CSS',
      'as.paused': 'Pausado', 'as.playing': 'Reproduzindo', 'as.presetApplied': 'Predefinição "{name}" aplicada', 'as.restored': 'Animação anterior restaurada',
      'as.projNamePh': 'Nome da animação…', 'as.projSave': 'Salvar', 'as.projOpen': 'Abrir', 'as.projUntitled': 'Animação sem nome',
      'as.projEmpty': 'Nada salvo ainda.', 'as.projSaved': 'Salvo "{name}"', 'as.projOpened': 'Aberto "{name}"',
      'as.dbUnavailable': 'Armazenamento local indisponível — animações não podem ser salvas.', 'as.dbError': 'Não foi possível acessar o armazenamento local.',
      'as.privacy': 'Você cria e exporta inteiramente no navegador. A folha compila apenas a partir de valores validados pelos controles — sem CSS escrito à mão, sem eval, e nada é enviado.'
    }
  });

  VT.registry.add(def);
  return def;
})();
