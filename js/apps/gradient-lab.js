window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['gradient-lab'] = (() => {
  const U = VT.utils;
  const { $, $$, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'gl.type': 'Gradient type', 'gl.linear': 'Linear', 'gl.radial': 'Radial', 'gl.conic': 'Conic',
      'gl.angle': 'Angle', 'gl.from': 'Start angle', 'gl.shape': 'Shape', 'gl.circle': 'Circle', 'gl.ellipse': 'Ellipse',
      'gl.pos': 'Center position', 'gl.stops': 'Color stops', 'gl.add': 'Add stop', 'gl.reverse': 'Reverse',
      'gl.even': 'Distribute evenly', 'gl.random': 'Randomize', 'gl.presets': 'Presets',
      'gl.remove': 'Remove stop', 'gl.stopcolor': 'Stop color', 'gl.stoppos': 'Stop position (%)',
      'gl.css': 'CSS', 'gl.copycss': 'Copy CSS', 'gl.png': 'PNG', 'gl.svg': 'SVG',
      'gl.size': 'Export width', 'gl.stage': 'Live canvas', 'gl.copied': 'CSS copied to clipboard',
      'gl.pngok': 'PNG downloaded', 'gl.svgok': 'SVG downloaded', 'gl.svgconic': 'SVG export supports linear and radial gradients only.',
      'gl.conicpng': 'This browser cannot rasterize conic gradients.', 'gl.minstops': 'A gradient needs at least two stops.',
      'gl.maxstops': 'Maximum of 8 stops.', 'gl.pngfail': 'Could not export PNG',
      'gl.pos.center': 'Center', 'gl.pos.top': 'Top', 'gl.pos.bottom': 'Bottom', 'gl.pos.left': 'Left', 'gl.pos.right': 'Right',
      'gl.pos.tl': 'Top left', 'gl.pos.tr': 'Top right', 'gl.pos.bl': 'Bottom left', 'gl.pos.br': 'Bottom right',
      'gl.hint': 'Drag the sliders or edit stops — the canvas, CSS and exports update live.'
    },
    pt: {
      'gl.type': 'Tipo de gradiente', 'gl.linear': 'Linear', 'gl.radial': 'Radial', 'gl.conic': 'Cônico',
      'gl.angle': 'Ângulo', 'gl.from': 'Ângulo inicial', 'gl.shape': 'Forma', 'gl.circle': 'Círculo', 'gl.ellipse': 'Elipse',
      'gl.pos': 'Posição do centro', 'gl.stops': 'Paradas de cor', 'gl.add': 'Adicionar parada', 'gl.reverse': 'Inverter',
      'gl.even': 'Distribuir uniformemente', 'gl.random': 'Aleatorizar', 'gl.presets': 'Presets',
      'gl.remove': 'Remover parada', 'gl.stopcolor': 'Cor da parada', 'gl.stoppos': 'Posição da parada (%)',
      'gl.css': 'CSS', 'gl.copycss': 'Copiar CSS', 'gl.png': 'PNG', 'gl.svg': 'SVG',
      'gl.size': 'Largura de exportação', 'gl.stage': 'Palco ao vivo', 'gl.copied': 'CSS copiado para a área de transferência',
      'gl.pngok': 'PNG baixado', 'gl.svgok': 'SVG baixado', 'gl.svgconic': 'Exportação SVG suporta apenas gradientes lineares e radiais.',
      'gl.conicpng': 'Este navegador não rasteriza gradientes cônicos.', 'gl.minstops': 'Um gradiente precisa de pelo menos duas paradas.',
      'gl.maxstops': 'Máximo de 8 paradas.', 'gl.pngfail': 'Não foi possível exportar PNG',
      'gl.pos.center': 'Centro', 'gl.pos.top': 'Topo', 'gl.pos.bottom': 'Base', 'gl.pos.left': 'Esquerda', 'gl.pos.right': 'Direita',
      'gl.pos.tl': 'Sup. esquerdo', 'gl.pos.tr': 'Sup. direito', 'gl.pos.bl': 'Inf. esquerdo', 'gl.pos.br': 'Inf. direito',
      'gl.hint': 'Arraste os sliders ou edite as paradas — palco, CSS e exportações atualizam ao vivo.'
    }
  });

  VT.i18n.add({
    en: {
      'gl.saved': 'Saved gradients', 'gl.saveName': 'Name this gradient', 'gl.save': 'Save',
      'gl.savedEmpty': 'No saved gradients yet. Design one, name it, and save it here.',
      'gl.load': 'Load', 'gl.del': 'Delete', 'gl.unnamed': 'Untitled',
      'gl.savedOk': 'Gradient saved', 'gl.loaded': 'Gradient loaded', 'gl.deleted': 'Gradient deleted',
      'gl.loadfail': 'Could not load this gradient', 'gl.nameRequired': 'Enter a name to save',
      'gl.delTitle': 'Delete this gradient?', 'gl.delBody': 'This removes the saved gradient from this browser. It cannot be undone.',
      'gl.dbUnavailable': 'Local storage is unavailable in this browser context.'
    },
    pt: {
      'gl.saved': 'Gradientes salvos', 'gl.saveName': 'Nomeie este gradiente', 'gl.save': 'Salvar',
      'gl.savedEmpty': 'Nenhum gradiente salvo ainda. Crie um, dê um nome e salve aqui.',
      'gl.load': 'Carregar', 'gl.del': 'Excluir', 'gl.unnamed': 'Sem nome',
      'gl.savedOk': 'Gradiente salvo', 'gl.loaded': 'Gradiente carregado', 'gl.deleted': 'Gradiente excluído',
      'gl.loadfail': 'Não foi possível carregar este gradiente', 'gl.nameRequired': 'Digite um nome para salvar',
      'gl.delTitle': 'Excluir este gradiente?', 'gl.delBody': 'Isso remove o gradiente salvo deste navegador. Não pode ser desfeito.',
      'gl.dbUnavailable': 'O armazenamento local está indisponível neste contexto do navegador.'
    }
  });

  const POS = { center: [50, 50], top: [50, 0], bottom: [50, 100], left: [0, 50], right: [100, 50], tl: [0, 0], tr: [100, 0], bl: [0, 100], br: [100, 100] };
  const PRESETS = [
    { name: 'Aurora', type: 'linear', angle: 135, stops: [['#04070F', 0], ['#0D2438', 45], ['#5FE6FF', 100]] },
    { name: 'Sunset', type: 'linear', angle: 200, stops: [['#2B1055', 0], ['#D7263D', 55], ['#F4B942', 100]] },
    { name: 'Ocean', type: 'radial', shape: 'circle', pos: 'center', stops: [['#9DEAFF', 0], ['#38B6E8', 40], ['#0A1B2E', 100]] },
    { name: 'Forest', type: 'linear', angle: 160, stops: [['#0B2B26', 0], ['#1B998B', 60], ['#7FF0D4', 100]] },
    { name: 'Neon', type: 'conic', from: 0, pos: 'center', stops: [['#5FE6FF', 0], ['#8FA0FF', 35], ['#F50F73', 70], ['#5FE6FF', 100]] },
    { name: 'Ice', type: 'linear', angle: 180, stops: [['#EAF7FF', 0], ['#9FB8C8', 100]] }
  ];

  const def = {
    id: 'gradient-lab', cat: 'creative', icon: 'gradient', version: '1.1.0',
    name: { en: 'Gradient Lab', pt: 'Gradient Lab' },
    tagline: {
      en: 'Design linear, radial and conic gradients with live canvas, stop editing and CSS/PNG/SVG export.',
      pt: 'Crie gradientes lineares, radiais e cônicos com palco ao vivo, edição de paradas e export CSS/PNG/SVG.'
    },
    tags: ['gradient', 'css', 'color', 'background', 'conic', 'radial'],
    deps: [],
    docs: {
      en: {
        summary: 'A gradient workbench: pick a type, shape the angle or center, edit up to eight color stops, and export production-ready CSS, PNG or SVG.',
        usage: [
          'Choose Linear, Radial or Conic — the controls adapt to the type.',
          'Linear uses an angle (0° points up, 90° points right); radial and conic use a center position, and conic adds a start angle.',
          'Edit each stop’s color and position, add up to eight stops, or remove them down to two.',
          'Reverse, distribute evenly, randomize colors, or start from one of the six presets.',
          'Copy the CSS snippet, or export PNG (512/1024/2048 px) and SVG. Canvas, CSS and exports always match.',
          'Design a gradient you like, give it a name and save it under “Saved gradients”; load it back anytime, or back all saved gradients up in Settings.'
        ],
        privacy: 'Gradients are computed and rasterized in your browser. Nothing is uploaded. Saved gradients live in this browser’s local database (IndexedDB) and can be exported/imported in Settings.',
        limits: [
          'SVG export covers linear and radial gradients — SVG has no conic primitive, so the SVG button is disabled for conic.',
          'Conic PNG export requires createConicGradient (Chrome 99+, Safari 16.4+, Firefox 112+).',
          'Stops are always emitted in ascending position order, matching how browsers render CSS gradients.',
          'Saved gradients persist in this browser’s IndexedDB and are available offline; “Reset local data” in Settings clears them.'
        ]
      },
      pt: {
        summary: 'Uma bancada de gradientes: escolha o tipo, ajuste ângulo ou centro, edite até oito paradas de cor e exporte CSS, PNG ou SVG prontos para produção.',
        usage: [
          'Escolha Linear, Radial ou Cônico — os controles se adaptam ao tipo.',
          'Linear usa ângulo (0° aponta para cima, 90° para a direita); radial e cônico usam posição do centro, e o cônico acrescenta ângulo inicial.',
          'Edite cor e posição de cada parada, adicione até oito paradas ou remova até sobrar duas.',
          'Inverta, distribua uniformemente, aleatorize as cores ou parta de um dos seis presets.',
          'Copie o trecho CSS ou exporte PNG (512/1024/2048 px) e SVG. Palco, CSS e exportações sempre coincidem.',
          'Crie um gradiente do seu jeito, dê um nome e salve em “Gradientes salvos”; recarregue quando quiser ou faça backup de todos salvos nas Configurações.'
        ],
        privacy: 'Gradientes são calculados e rasterizados no seu navegador. Nada é enviado. Os gradientes salvos ficam no banco de dados local do navegador (IndexedDB) e podem ser exportados/importados nas Configurações.',
        limits: [
          'Export SVG cobre lineares e radiais — SVG não tem primitiva cônica, então o botão SVG fica desabilitado no cônico.',
          'PNG cônico exige createConicGradient (Chrome 99+, Safari 16.4+, Firefox 112+).',
          'As paradas são sempre emitidas em ordem crescente de posição, como os navegadores renderizam gradientes CSS.',
          'Os gradientes salvos persistem no IndexedDB deste navegador e funcionam offline; “Apagar dados locais” nas Configurações os remove.'
        ]
      }
    },
    mount, unmount
  };

  let alive = false;
  let typeTabs = null;
  const saved = VT.store.get('gradient-lab', null);
  const state = Object.assign({
    type: 'linear', angle: 135, shape: 'circle', pos: 'center', from: 0,
    stops: [{ c: '#7FD8F4', p: 0 }, { c: '#0B5C84', p: 100 }], size: 1024
  }, saved || {});

  const persist = U.debounce(() => VT.store.set('gradient-lab', state), 400);
  const clampP = (n) => U.clamp(Math.round(n), 0, 100);
  const sortedStops = () => state.stops.slice().sort((a, b) => a.p - b.p);

  function cssGradient() {
    const stops = sortedStops().map((s) => s.c + ' ' + s.p + '%').join(', ');
    if (state.type === 'linear') return 'linear-gradient(' + state.angle + 'deg, ' + stops + ')';
    if (state.type === 'radial') return 'radial-gradient(' + state.shape + ' at ' + posLabel(state.pos) + ', ' + stops + ')';
    return 'conic-gradient(from ' + state.from + 'deg at ' + posLabel(state.pos) + ', ' + stops + ')';
  }
  const posLabel = (k) => ({ center: 'center', top: 'top', bottom: 'bottom', left: 'left', right: 'right', tl: 'top left', tr: 'top right', bl: 'bottom left', br: 'bottom right' }[k]);

  function render(structural = false) {
    if (!alive) return;
    $('#gl-preview').style.backgroundImage = cssGradient();
    $('#gl-css').textContent = 'background-image: ' + cssGradient() + ';';
    $('#gl-angle-field').hidden = state.type !== 'linear';
    $('#gl-from-field').hidden = state.type !== 'conic';
    $('#gl-shape-field').hidden = state.type !== 'radial';
    $('#gl-pos-field').hidden = state.type === 'linear';
    $('#gl-svg').disabled = state.type === 'conic';
    $('#gl-svg').title = state.type === 'conic' ? t('gl.svgconic') : '';
    if (structural) renderStops();
    persist();
  }

  function renderStops() {
    const wrap = $('#gl-stops');
    wrap.innerHTML = state.stops.map((s, i) =>
      '<div class="gl-stop">' +
        '<input type="color" class="input" value="' + s.c + '" aria-label="' + t('gl.stopcolor') + ' ' + (i + 1) + '">' +
        '<input type="number" class="input mono" min="0" max="100" value="' + s.p + '" aria-label="' + t('gl.stoppos') + ' ' + (i + 1) + '">' +
        '<button class="btn btn-icon btn-sm gl-stop-x" aria-label="' + t('gl.remove') + ' ' + (i + 1) + '"' + (state.stops.length <= 2 ? ' disabled' : '') + '>' + VT.icons.x + '</button>' +
      '</div>').join('');
    $$('.gl-stop', wrap).forEach((row, i) => {
      const stop = state.stops[i];
      const col = $('input[type="color"]', row);
      const num = $('input[type="number"]', row);
      col.addEventListener('input', () => { stop.c = col.value.toUpperCase(); render(); });
      num.addEventListener('input', () => { stop.p = clampP(+num.value || 0); render(); });
      num.addEventListener('change', () => {
        stop.p = clampP(+num.value || 0);
        state.stops = sortedStops();
        render(true);
        if (document.activeElement === num) {
          const again = $$('.gl-stop input[type="number"]')[state.stops.indexOf(stop)];
          if (again) { again.focus(); again.select(); }
        }
      });
      $('.gl-stop-x', row).addEventListener('click', () => {
        if (state.stops.length <= 2) { toast(t('gl.minstops'), 'warn'); return; }
        state.stops.splice(state.stops.indexOf(stop), 1); render(true);
      });
    });
  }

  function paintCanvas(canvas, w, h) {
    const ctx = canvas.getContext('2d');
    canvas.width = w; canvas.height = h;
    const stops = sortedStops();
    const add = (g) => stops.forEach((s) => g.addColorStop(s.p / 100, s.c));
    if (state.type === 'linear') {
      const a = state.angle * Math.PI / 180;
      const dx = Math.sin(a), dy = -Math.cos(a);
      const len = Math.abs(w * dx) + Math.abs(h * dy);
      const g = ctx.createLinearGradient(w / 2 - dx * len / 2, h / 2 - dy * len / 2, w / 2 + dx * len / 2, h / 2 + dy * len / 2);
      add(g); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      return true;
    }
    const [px, py] = [POS[state.pos][0] / 100 * w, POS[state.pos][1] / 100 * h];
    if (state.type === 'radial') {
      const mx = Math.max(px, w - px), my = Math.max(py, h - py);
      ctx.save(); ctx.translate(px, py);
      if (state.shape === 'ellipse') ctx.scale(mx * Math.SQRT2, my * Math.SQRT2);
      else ctx.scale(Math.hypot(mx, my), Math.hypot(mx, my));
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      add(g); ctx.fillStyle = g;
      ctx.fillRect(-px / (state.shape === 'ellipse' ? mx * Math.SQRT2 : Math.hypot(mx, my)) - 1, -py / (state.shape === 'ellipse' ? my * Math.SQRT2 : Math.hypot(mx, my)) - 1, w + 2, h + 2);
      ctx.restore();
      return true;
    }
    if (!ctx.createConicGradient) return false;
    const g = ctx.createConicGradient((state.from - 90) * Math.PI / 180, px, py);
    add(g); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    return true;
  }

  function svgMarkup() {
    const w = 160, h = 100;
    const n = (v) => Math.round(v * 1000) / 1000;
    const stops = sortedStops()
      .map((s) => '<stop offset="' + s.p + '%" stop-color="' + s.c + '"/>').join('');
    let el, attrs;
    if (state.type === 'linear') {
      const a = state.angle * Math.PI / 180;
      const dx = Math.sin(a), dy = -Math.cos(a);
      const len = Math.abs(w * dx) + Math.abs(h * dy);
      attrs = 'gradientUnits="userSpaceOnUse" x1="' + n(w / 2 - dx * len / 2) + '" y1="' + n(h / 2 - dy * len / 2) + '" x2="' + n(w / 2 + dx * len / 2) + '" y2="' + n(h / 2 + dy * len / 2) + '"';
      el = 'linearGradient';
    } else {
      const [px, py] = [POS[state.pos][0] / 100 * w, POS[state.pos][1] / 100 * h];
      const mx = Math.max(px, w - px), my = Math.max(py, h - py);
      const r = state.shape === 'ellipse' ? 1 : Math.hypot(mx, my);
      const transform = state.shape === 'ellipse' ? ' gradientTransform="translate(' + n(px) + ' ' + n(py) + ') scale(' + n(mx * Math.SQRT2) + ' ' + n(my * Math.SQRT2) + ') translate(' + n(-px) + ' ' + n(-py) + ')"' : '';
      attrs = 'gradientUnits="userSpaceOnUse" cx="' + n(px) + '" cy="' + n(py) + '" r="' + n(r) + '"' + transform;
      el = 'radialGradient';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + state.size + '" height="' + Math.round(state.size * h / w) + '" viewBox="0 0 ' + w + ' ' + h + '"><defs><' + el + ' id="g" ' + attrs + '>' + stops + '</' + el + '></defs><rect width="' + w + '" height="' + h + '" fill="url(#g)"/></svg>';
  }

  function snapshot() {
    return {
      type: state.type, angle: state.angle, shape: state.shape, pos: state.pos,
      from: state.from, size: state.size, stops: state.stops.map((s) => ({ c: s.c, p: s.p }))
    };
  }

  function applySaved(d) {
    if (!d || !Array.isArray(d.stops) || d.stops.length < 2) return false;
    state.type = ['linear', 'radial', 'conic'].includes(d.type) ? d.type : 'linear';
    state.angle = U.clamp(Math.round(+d.angle || 0), 0, 360);
    state.from = U.clamp(Math.round(+d.from || 0), 0, 360);
    state.shape = d.shape === 'ellipse' ? 'ellipse' : 'circle';
    state.pos = POS[d.pos] ? d.pos : 'center';
    state.size = [512, 1024, 2048].includes(+d.size) ? +d.size : 1024;
    state.stops = d.stops.slice(0, 8).map((s) => ({
      c: /^#[0-9a-fA-F]{6}$/.test(s && s.c) ? String(s.c).toUpperCase() : '#000000',
      p: clampP(s && s.p)
    }));
    const ang = $('#gl-angle'); if (ang) ang.value = state.angle;
    const angV = $('#gl-angle-val'); if (angV) angV.textContent = state.angle + '°';
    const fr = $('#gl-from'); if (fr) fr.value = state.from;
    const frV = $('#gl-from-val'); if (frV) frV.textContent = state.from + '°';
    const sh = $('#gl-shape'); if (sh) sh.value = state.shape;
    const po = $('#gl-pos'); if (po) po.value = state.pos;
    const si = $('#gl-size'); if (si) si.value = String(state.size);
    if (typeTabs) typeTabs.select(state.type, false);
    render(true);
    return true;
  }

  function renderSaved() {
    const wrap = $('#gl-saved');
    if (!wrap) return;
    VT.db.list('gradient-lab').then((rows) => {
      if (!alive || !$('#gl-saved')) return;
      if (!rows.length) { wrap.innerHTML = '<p class="hint" style="text-align:center">' + t('gl.savedEmpty') + '</p>'; return; }
      wrap.innerHTML = rows.map((r) =>
        '<div class="gl-saved-row" data-id="' + esc(r.id) + '">' +
          '<button class="btn btn-sm btn-ghost gl-load" aria-label="' + t('gl.load') + ' ' + esc(r.name || t('gl.unnamed')) + '">' + esc(r.name || t('gl.unnamed')) + '</button>' +
          '<button class="btn btn-icon btn-sm gl-del" aria-label="' + t('gl.del') + ' ' + esc(r.name || t('gl.unnamed')) + '">' + VT.icons.x + '</button>' +
        '</div>').join('');
      $$('.gl-saved-row', wrap).forEach((row) => {
        const id = row.dataset.id;
        $('.gl-load', row).addEventListener('click', () => {
          VT.db.get(id).then((rec) => {
            if (!alive) return;
            if (rec && applySaved(rec.data)) toast(t('gl.loaded'), 'success');
            else toast(t('gl.loadfail'), 'error');
          }).catch(() => { if (alive) toast(t('gl.loadfail'), 'error'); });
        });
        $('.gl-del', row).addEventListener('click', async () => {
          const ok = await VT.ui.confirm({ title: t('gl.delTitle'), body: t('gl.delBody'), confirmLabel: t('gl.del') });
          if (!ok || !alive) return;
          try { await VT.db.remove(id); toast(t('gl.deleted'), 'success'); renderSaved(); }
          catch (e) { toast(t('gl.dbUnavailable'), 'error'); }
        });
      });
    }).catch(() => { if (alive && $('#gl-saved')) $('#gl-saved').innerHTML = '<p class="hint" style="text-align:center">' + t('gl.dbUnavailable') + '</p>'; });
  }

  function mount(el) {
    alive = true;
    const I = VT.icons;
    el.innerHTML = `
      <div class="gl-layout">
        <section class="gl-stage glass-2">
          <span class="gl-stage-title">${t('gl.stage')}</span>
          <div class="gl-canvas-wrap"><div id="gl-preview" role="img" aria-label="${t('gl.stage')}"></div></div>
          <div class="gl-code copy-row"><code id="gl-css" class="mono"></code><button id="gl-copy" class="btn btn-icon" data-tip="${t('gl.copycss')}" aria-label="${t('gl.copycss')}">${I.copy}</button></div>
          <div class="export-row">
            <button id="gl-png" class="btn btn-primary">${I.download} ${t('gl.png')}</button>
            <button id="gl-svg" class="btn btn-aqua">${I.download} ${t('gl.svg')}</button>
          </div>
          <p class="hint" style="text-align:center">${t('gl.hint')}</p>
        </section>
        <div class="gl-controls">
          <section class="step glass">
            <div class="field" id="gl-type-field"><label id="gl-type-label">${t('gl.type')}</label>
              <div class="tabs" id="gl-type" role="tablist" aria-labelledby="gl-type-label">
                ${['linear', 'radial', 'conic'].map((k) => `<button class="tab" data-tab="${k}" role="tab" aria-selected="${state.type === k}">${t('gl.' + k)}</button>`).join('')}
              </div>
            </div>
            <div class="field" id="gl-angle-field"><label for="gl-angle">${t('gl.angle')} <span class="mono" id="gl-angle-val">${state.angle}°</span></label>
              <input type="range" id="gl-angle" min="0" max="360" value="${state.angle}">
              <div class="gl-quick">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<button class="chip chip-sm" data-a="${a}">${a}°</button>`).join('')}</div>
            </div>
            <div class="field" id="gl-from-field"><label for="gl-from">${t('gl.from')} <span class="mono" id="gl-from-val">${state.from}°</span></label>
              <input type="range" id="gl-from" min="0" max="360" value="${state.from}">
            </div>
            <div class="field" id="gl-shape-field"><label for="gl-shape">${t('gl.shape')}</label>
              <select id="gl-shape" class="input"><option value="circle">${t('gl.circle')}</option><option value="ellipse">${t('gl.ellipse')}</option></select>
            </div>
            <div class="field" id="gl-pos-field"><label for="gl-pos">${t('gl.pos')}</label>
              <select id="gl-pos" class="input">${Object.keys(POS).map((k) => `<option value="${k}">${t('gl.pos.' + k)}</option>`).join('')}</select>
            </div>
            <div class="field"><label for="gl-size">${t('gl.size')}</label>
              <select id="gl-size" class="input"><option value="512">512 px</option><option value="1024">1024 px</option><option value="2048">2048 px</option></select>
            </div>
          </section>
          <section class="step glass">
            <div class="step-head"><h2 class="step-title">${t('gl.stops')}</h2></div>
            <div id="gl-stops" class="gl-stops"></div>
            <div class="field-row" style="margin-top:10px">
              <button id="gl-add" class="btn btn-sm">${I.plus} ${t('gl.add')}</button>
              <button id="gl-reverse" class="btn btn-sm btn-ghost">${I.swap} ${t('gl.reverse')}</button>
              <button id="gl-even" class="btn btn-sm btn-ghost">${I.ruler} ${t('gl.even')}</button>
              <button id="gl-random" class="btn btn-sm btn-ghost">${I.dice} ${t('gl.random')}</button>
            </div>
          </section>
          <section class="step glass">
            <div class="step-head"><h2 class="step-title">${t('gl.presets')}</h2></div>
            <div class="gl-presets">${PRESETS.map((p, i) => `<button class="gl-preset" data-i="${i}" style="background:${presetCss(p)}" aria-label="${p.name}"></button>`).join('')}</div>
          </section>
          <section class="step glass">
            <div class="step-head"><h2 class="step-title">${t('gl.saved')}</h2></div>
            <div class="gl-save-row">
              <input id="gl-save-name" class="input" type="text" maxlength="60" autocomplete="off" placeholder="${t('gl.saveName')}" aria-label="${t('gl.saveName')}">
              <button id="gl-save-btn" class="btn btn-sm btn-primary">${I.plus} ${t('gl.save')}</button>
            </div>
            <div id="gl-saved" class="gl-saved" aria-live="polite"></div>
          </section>
        </div>
      </div>`;

    $('#gl-shape').value = state.shape;
    $('#gl-pos').value = state.pos;
    $('#gl-size').value = String(state.size);

    typeTabs = VT.ui.tabs($('#gl-type-field'), (val) => { state.type = val; render(); });
    $('#gl-angle').addEventListener('input', (e) => { state.angle = +e.target.value; $('#gl-angle-val').textContent = state.angle + '°'; render(); });
    $$('.gl-quick .chip').forEach((b) => b.addEventListener('click', () => { state.angle = +b.dataset.a; $('#gl-angle').value = state.angle; $('#gl-angle-val').textContent = state.angle + '°'; render(); }));
    $('#gl-from').addEventListener('input', (e) => { state.from = +e.target.value; $('#gl-from-val').textContent = state.from + '°'; render(); });
    $('#gl-shape').addEventListener('change', (e) => { state.shape = e.target.value; render(); });
    $('#gl-pos').addEventListener('change', (e) => { state.pos = e.target.value; render(); });
    $('#gl-size').addEventListener('change', (e) => { state.size = +e.target.value; persist(); });
    $('#gl-add').addEventListener('click', () => {
      if (state.stops.length >= 8) { toast(t('gl.maxstops'), 'warn'); return; }
      const sorted = sortedStops();
      let gap = -1, at = 50;
      for (let i = 0; i < sorted.length - 1; i++) { const d = sorted[i + 1].p - sorted[i].p; if (d > gap) { gap = d; at = Math.round((sorted[i].p + sorted[i + 1].p) / 2); } }
      const stop = { c: U.randomHex(), p: at };
      state.stops = sorted.concat([stop]).sort((a, b) => a.p - b.p);
      render(true);
    });
    $('#gl-reverse').addEventListener('click', () => { state.stops = sortedStops().reverse().map((s) => ({ c: s.c, p: 100 - s.p })); render(true); });
    $('#gl-even').addEventListener('click', () => { const s = sortedStops(); s.forEach((stop, i) => { stop.p = Math.round(i * 100 / (s.length - 1)); }); state.stops = s; render(true); });
    $('#gl-random').addEventListener('click', () => { state.stops = state.stops.map((s) => ({ c: U.randomHex(), p: s.p })); render(true); });
    $$('.gl-preset').forEach((b) => b.addEventListener('click', () => {
      const p = PRESETS[+b.dataset.i];
      state.type = p.type; state.angle = p.angle ?? state.angle; state.from = p.from ?? state.from;
      state.shape = p.shape ?? state.shape; state.pos = p.pos ?? state.pos;
      state.stops = p.stops.map(([c, pos]) => ({ c, p: pos }));
      $('#gl-angle').value = state.angle; $('#gl-angle-val').textContent = state.angle + '°';
      $('#gl-from').value = state.from; $('#gl-from-val').textContent = state.from + '°';
      $('#gl-shape').value = state.shape; $('#gl-pos').value = state.pos;
      typeTabs.select(p.type, false);
      render(true);
    }));
    $('#gl-copy').addEventListener('click', async () => {
      (await U.copyText('background-image: ' + cssGradient() + ';')) ? toast(t('gl.copied'), 'success') : toast(t('common.copyfail'), 'error');
    });
    $('#gl-png').addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      const w = state.size, h = Math.round(w * 0.625);
      if (!paintCanvas(canvas, w, h)) { toast(t('gl.conicpng'), 'error'); return; }
      canvas.toBlob((blob) => {
        if (!blob) { toast(t('gl.pngfail'), 'error'); return; }
        U.downloadBlob(blob, 'vistanology-gradient-' + state.type + '-' + w + '.png');
        toast(t('gl.pngok'), 'success');
      }, 'image/png');
    });
    $('#gl-svg').addEventListener('click', () => {
      U.downloadText(svgMarkup(), 'vistanology-gradient-' + state.type + '.svg', 'image/svg+xml');
      toast(t('gl.svgok'), 'success');
    });

    $('#gl-save-btn').addEventListener('click', async () => {
      const input = $('#gl-save-name');
      const name = (input.value || '').trim().slice(0, 60);
      if (!name) { toast(t('gl.nameRequired'), 'warn'); input.focus(); return; }
      try {
        await VT.db.put({ tool: 'gradient-lab', name, data: snapshot() });
        input.value = '';
        toast(t('gl.savedOk'), 'success');
        renderSaved();
      } catch (e) { toast(t('gl.dbUnavailable'), 'error'); }
    });
    $('#gl-save-name').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('#gl-save-btn').click(); } });

    render(true);
    renderSaved();
  }

  function presetCss(p) {
    const stops = p.stops.map(([c, pos]) => c + ' ' + pos + '%').join(', ');
    if (p.type === 'linear') return 'linear-gradient(' + p.angle + 'deg, ' + stops + ')';
    if (p.type === 'radial') return 'radial-gradient(' + p.shape + ' at center, ' + stops + ')';
    return 'conic-gradient(from ' + p.from + 'deg at center, ' + stops + ')';
  }

  function unmount() { alive = false; VT.store.set('gradient-lab', state); }

  VT.registry.add(def);
  return def;
})();