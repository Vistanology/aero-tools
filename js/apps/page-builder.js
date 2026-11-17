window.VT = window.VT || {};

/* U7 · Visual Page Builder — drag-and-drop page composition, local-first.
 * A typed block model is rendered into a live canvas, edited through a properties
 * panel, reordered by dragging, and exported as clean, escaped HTML. No eval, no
 * raw innerHTML of user text (everything goes through esc()), no network.
 */
VT.modules['page-builder'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'page-builder';

  let alive = false;
  let refs = {};
  let hist = null;
  let blocks = [];          // [{id, type, props}]
  let selected = null;      // block id
  let seq = 0;              // id counter
  let preview = 'desktop';  // canvas width preset
  let state = { preview: 'desktop' };
  let autosave = null;      // debounced IndexedDB autosave of the working document
  const AUTOSAVE_ID = 'pb:autosave';

  function restore() {
    const s = VT.store.get(KEY, null);
    if (s && typeof s === 'object') state = Object.assign(state, s);
    preview = state.preview || 'desktop';
  }
  function persist() { VT.store.set(KEY, { preview }); }

  const uid = () => 'b' + (++seq) + Date.now().toString(36).slice(-3);
  const clone = (o) => (typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o)));

  // ---------- block catalogue ----------
  // Each type: label key, defaults(), fields[], html(props) -> safe inner HTML.
  const TYPES = {
    heading: {
      label: 'pb.t.heading',
      defaults: () => ({ text: 'Build something great', level: 'h1', align: 'left' }),
      fields: [
        { key: 'text', kind: 'text' },
        { key: 'level', kind: 'select', options: ['h1', 'h2', 'h3', 'h4'] },
        { key: 'align', kind: 'select', options: ['left', 'center', 'right'] }
      ],
      html: (p) => '<' + p.level + ' class="pb-h pb-align-' + p.align + '">' + esc(p.text) + '</' + p.level + '>'
    },
    paragraph: {
      label: 'pb.t.paragraph',
      defaults: () => ({ text: 'Describe your product in a sentence or two. Everything you type stays on this device.', align: 'left' }),
      fields: [
        { key: 'text', kind: 'textarea' },
        { key: 'align', kind: 'select', options: ['left', 'center', 'right'] }
      ],
      html: (p) => '<p class="pb-p pb-align-' + p.align + '">' + esc(p.text).replace(/\n/g, '<br>') + '</p>'
    },
    button: {
      label: 'pb.t.button',
      defaults: () => ({ text: 'Get started', href: '#', align: 'left', style: 'primary' }),
      fields: [
        { key: 'text', kind: 'text' },
        { key: 'href', kind: 'text' },
        { key: 'style', kind: 'select', options: ['primary', 'ghost'] },
        { key: 'align', kind: 'select', options: ['left', 'center', 'right'] }
      ],
      html: (p) => '<div class="pb-align-' + p.align + '"><a class="pb-btn pb-btn-' + p.style + '" href="' + esc(safeHref(p.href)) + '">' + esc(p.text) + '</a></div>'
    },
    image: {
      label: 'pb.t.image',
      defaults: () => ({ src: '', alt: 'Image', ratio: '16/9' }),
      fields: [
        { key: 'src', kind: 'text' },
        { key: 'alt', kind: 'text' },
        { key: 'ratio', kind: 'select', options: ['16/9', '4/3', '1/1', '3/2'] }
      ],
      html: (p) => p.src
        ? '<figure class="pb-fig"><img class="pb-img" src="' + esc(safeSrc(p.src)) + '" alt="' + esc(p.alt) + '" style="aspect-ratio:' + esc(p.ratio) + '"></figure>'
        : '<div class="pb-img-ph" style="aspect-ratio:' + esc(p.ratio) + '">' + esc(t('pb.imageEmpty')) + '</div>'
    },
    quote: {
      label: 'pb.t.quote',
      defaults: () => ({ text: 'A short, memorable testimonial or pull-quote.', who: 'Customer name' }),
      fields: [{ key: 'text', kind: 'textarea' }, { key: 'who', kind: 'text' }],
      html: (p) => '<blockquote class="pb-quote"><p>' + esc(p.text).replace(/\n/g, '<br>') + '</p>' + (p.who ? '<cite>— ' + esc(p.who) + '</cite>' : '') + '</blockquote>'
    },
    list: {
      label: 'pb.t.list',
      defaults: () => ({ items: 'First benefit\nSecond benefit\nThird benefit', ordered: false }),
      fields: [
        { key: 'items', kind: 'textarea' },
        { key: 'ordered', kind: 'check' }
      ],
      html: (p) => {
        const tag = p.ordered ? 'ol' : 'ul';
        const lis = String(p.items).split('\n').filter((s) => s.trim()).map((s) => '<li>' + esc(s) + '</li>').join('');
        return '<' + tag + ' class="pb-list">' + lis + '</' + tag + '>';
      }
    },
    columns: {
      label: 'pb.t.columns',
      defaults: () => ({ left: 'Left column content.', right: 'Right column content.' }),
      fields: [{ key: 'left', kind: 'textarea' }, { key: 'right', kind: 'textarea' }],
      html: (p) => '<div class="pb-cols"><div class="pb-col">' + esc(p.left).replace(/\n/g, '<br>') + '</div><div class="pb-col">' + esc(p.right).replace(/\n/g, '<br>') + '</div></div>'
    },
    divider: {
      label: 'pb.t.divider',
      defaults: () => ({ space: 'md' }),
      fields: [{ key: 'space', kind: 'select', options: ['sm', 'md', 'lg'] }],
      html: (p) => '<hr class="pb-hr pb-hr-' + p.space + '">'
    },
    spacer: {
      label: 'pb.t.spacer',
      defaults: () => ({ size: '48' }),
      fields: [{ key: 'size', kind: 'text' }],
      html: (p) => '<div class="pb-spacer" style="height:' + esc(String(parseInt(p.size, 10) || 0)) + 'px"></div>'
    },
    hero: {
      label: 'pb.t.hero',
      defaults: () => ({ title: 'Ship your product page today', sub: 'Everything you need to launch — built locally, exported as clean HTML.', text: 'Get started', href: '#', align: 'center' }),
      fields: [
        { key: 'title', kind: 'text' },
        { key: 'sub', kind: 'textarea' },
        { key: 'text', kind: 'text' },
        { key: 'href', kind: 'text' },
        { key: 'align', kind: 'select', options: ['left', 'center'] }
      ],
      html: (p) => '<section class="pb-hero pb-align-' + p.align + '"><h1 class="pb-hero-title">' + esc(p.title) + '</h1><p class="pb-hero-sub">' + esc(p.sub).replace(/\n/g, '<br>') + '</p>' + (p.text ? '<a class="pb-btn pb-btn-primary" href="' + esc(safeHref(p.href)) + '">' + esc(p.text) + '</a>' : '') + '</section>'
    },
    features: {
      label: 'pb.t.features',
      defaults: () => ({ items: 'Local-first :: Nothing ever leaves your device.\nReal-time preview :: See the page as you build it.\nClean export :: Production-ready HTML in one click.' }),
      fields: [{ key: 'items', kind: 'textarea' }],
      html: (p) => {
        const cards = String(p.items).split('\n').filter((s) => s.trim()).map((line) => {
          const parts = line.split('::'); const title = (parts[0] || '').trim(); const body = (parts[1] || '').trim();
          return '<div class="pb-feat"><h4>' + esc(title) + '</h4><p>' + esc(body) + '</p></div>';
        }).join('');
        return '<div class="pb-feats">' + cards + '</div>';
      }
    },
    cta: {
      label: 'pb.t.cta',
      defaults: () => ({ title: 'Ready to build?', text: 'Start your page', href: '#', sub: 'No account, no upload, no tracking.' }),
      fields: [
        { key: 'title', kind: 'text' },
        { key: 'sub', kind: 'text' },
        { key: 'text', kind: 'text' },
        { key: 'href', kind: 'text' }
      ],
      html: (p) => '<section class="pb-cta"><div class="pb-cta-txt"><h3>' + esc(p.title) + '</h3>' + (p.sub ? '<p>' + esc(p.sub) + '</p>' : '') + '</div>' + (p.text ? '<a class="pb-btn pb-btn-primary" href="' + esc(safeHref(p.href)) + '">' + esc(p.text) + '</a>' : '') + '</section>'
    }
  };
  const ORDER = ['hero', 'heading', 'paragraph', 'button', 'image', 'quote', 'list', 'columns', 'features', 'cta', 'divider', 'spacer'];

  function safeHref(h) {
    const s = String(h || '#').trim();
    if (/^javascript:/i.test(s) || /^data:/i.test(s)) return '#';
    return s || '#';
  }
  function safeSrc(s) {
    const v = String(s || '').trim();
    if (/^javascript:/i.test(v)) return '';
    return v; // http(s), data:image, and relative are acceptable for a local preview
  }

  // ---------- model ----------
  const canonical = () => JSON.stringify({ blocks, preview });
  const findBlock = (id) => blocks.find((b) => b.id === id);

  function addBlock(type, at) {
    const b = { id: uid(), type, props: TYPES[type].defaults() };
    if (at == null || at < 0 || at > blocks.length) blocks.push(b); else blocks.splice(at, 0, b);
    selected = b.id;
    commit();
  }
  function removeBlock(id) {
    blocks = blocks.filter((b) => b.id !== id);
    if (selected === id) selected = blocks.length ? blocks[0].id : null;
    commit();
  }
  function moveBlock(id, toIndex) {
    const from = blocks.findIndex((b) => b.id === id);
    if (from < 0) return;
    const [b] = blocks.splice(from, 1);
    toIndex = Math.max(0, Math.min(blocks.length, toIndex > from ? toIndex - 1 : toIndex));
    blocks.splice(toIndex, 0, b);
    commit();
  }

  function commit() {
    if (!alive) return;
    renderCanvas(); renderProps();
    hist.record(canonical()); syncHist();
    if (autosave) autosave();
  }

  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }

  // ---------- canvas ----------
  function renderCanvas() {
    const c = refs.canvas; c.innerHTML = '';
    refs.emptyEl.hidden = blocks.length > 0;
    if (!blocks.length) return;
    blocks.forEach((b, i) => {
      const def = TYPES[b.type]; if (!def) return;
      const wrap = document.createElement('div');
      wrap.className = 'pb-block' + (b.id === selected ? ' is-sel' : '');
      wrap.draggable = true; wrap.dataset.id = b.id; wrap.dataset.index = i;
      const body = document.createElement('div'); body.className = 'pb-block-body'; body.innerHTML = def.html(b.props);
      const tools = document.createElement('div'); tools.className = 'pb-block-tools';
      const up = mkBtn('↑', t('pb.up'), () => { if (i > 0) moveBlock(b.id, i - 1); });
      const dn = mkBtn('↓', t('pb.down'), () => { if (i < blocks.length - 1) moveBlock(b.id, i + 2); });
      const rm = mkBtn('✕', t('pb.delete'), () => removeBlock(b.id), 'rm');
      tools.append(up, dn, rm);
      const tag = document.createElement('span'); tag.className = 'pb-block-tag'; tag.textContent = t(def.label);
      wrap.append(tools, tag, body);
      wrap.addEventListener('click', (ev) => { if (ev.target.closest('.pb-block-tools')) return; select(b.id); });
      wireDrag(wrap, i);
      c.append(wrap);
    });
  }

  function mkBtn(txt, label, fn, cls) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pb-tool' + (cls ? ' ' + cls : '');
    b.textContent = txt; b.title = label; b.setAttribute('aria-label', label);
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    return b;
  }

  function select(id) { selected = id; renderCanvas(); renderProps(); }

  // ---------- properties panel ----------
  function renderProps() {
    const p = refs.props; p.innerHTML = '';
    const b = findBlock(selected);
    if (!b) {
      const e = document.createElement('section'); e.className = 'bench-sec glass bench-sec--quiet';
      e.innerHTML = '<h3 class="bench-sec-head">' + esc(t('pb.props')) + '</h3><p>' + esc(t('pb.selectNone')) + '</p>';
      p.append(e); return;
    }
    const sec = document.createElement('section'); sec.className = 'bench-sec glass pb-prop-sec';
    const head = document.createElement('h3'); head.className = 'bench-sec-head';
    head.textContent = t(TYPES[b.type].label);
    sec.append(head);
    TYPES[b.type].fields.forEach((f) => sec.append(fieldRow(b, f)));
    p.append(sec);
  }

  function fieldRow(b, f) {
    const row = document.createElement('div'); row.className = 'pb-field';
    const lab = document.createElement('label'); lab.textContent = t('pb.f.' + f.key);
    let input;
    const val = b.props[f.key];
    if (f.kind === 'select') {
      input = document.createElement('select'); input.className = 'input';
      (f.options || []).forEach((o) => { const op = document.createElement('option'); op.value = o; op.textContent = o; input.append(op); });
      input.value = val;
      input.addEventListener('change', () => { b.props[f.key] = input.value; commit(); });
    } else if (f.kind === 'check') {
      input = document.createElement('input'); input.type = 'checkbox'; input.checked = !!val;
      input.addEventListener('change', () => { b.props[f.key] = input.checked; commit(); });
    } else if (f.kind === 'textarea') {
      input = document.createElement('textarea'); input.className = 'input pb-ta'; input.rows = 3; input.value = val;
      input.addEventListener('input', U.debounce(() => { b.props[f.key] = input.value; commit(); }, 350));
    } else {
      input = document.createElement('input'); input.type = 'text'; input.className = 'input'; input.value = val;
      input.addEventListener('input', U.debounce(() => { b.props[f.key] = input.value; commit(); }, 350));
    }
    row.append(lab, input);
    return row;
  }

  // ---------- drag reorder + palette insert ----------
  let dragId = null;   // id of an existing block being moved
  let dragNew = null;  // type of a palette chip being dropped in

  function wireDrag(wrap, index) {
    wrap.addEventListener('dragstart', (e) => { dragId = wrap.dataset.id; dragNew = null; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (_) {} wrap.classList.add('is-drag'); });
    wrap.addEventListener('dragend', () => { wrap.classList.remove('is-drag'); dragId = null; clearDrop(); });
    wrap.addEventListener('dragover', (e) => {
      e.preventDefault(); e.dataTransfer.dropEffect = dragNew ? 'copy' : 'move';
      const rect = wrap.getBoundingClientRect();
      const after = (e.clientY - rect.top) > rect.height / 2;
      clearDrop();
      wrap.classList.add(after ? 'drop-after' : 'drop-before');
    });
  }

  function dropIndexAt(clientY, targetEl) {
    if (!targetEl) return blocks.length;
    const rect = targetEl.getBoundingClientRect();
    const after = (clientY - rect.top) > rect.height / 2;
    return Number(targetEl.dataset.index) + (after ? 1 : 0);
  }

  function wireCanvasDnD() {
    const wrap = refs.canvasWrap;
    wrap.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = dragNew ? 'copy' : 'move'; });
    wrap.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetEl = e.target.closest('.pb-block');
      const idx = dropIndexAt(e.clientY, targetEl);
      clearDrop();
      if (dragNew) { addBlock(dragNew, idx); }
      else if (dragId) { moveBlock(dragId, idx); }
      dragNew = null; dragId = null;
    });
  }
  function clearDrop() { $$('.pb-block', refs.canvas).forEach((el) => el.classList.remove('drop-before', 'drop-after')); }

  // ---------- export ----------
  function exportHTML() {
    const inner = blocks.map((b) => '  ' + TYPES[b.type].html(b.props).replace(/></g, '>\n    <')).join('\n');
    return '<!DOCTYPE html>\n<html lang="' + VT.i18n.lang + '">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>Vistanology Page</title>\n  <style>\n' + EXPORT_CSS + '  </style>\n</head>\n<body>\n  <main class="page">\n' + inner + '\n  </main>\n</body>\n</html>';
  }

  const EXPORT_CSS = [
    ':root{--ink:#0e1420;--muted:#5b6675;--accent:#0aa9c9;--line:#e6e9ef;--bg:#f7f9fc;--r:14px}',
    '*{box-sizing:border-box}',
    'body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6}',
    '.page{max-width:960px;margin:0 auto;padding:48px 24px;display:flex;flex-direction:column;gap:28px}',
    '.pb-h{margin:0;font-weight:700;line-height:1.15}',
    '.pb-align-left{text-align:left}.pb-align-center{text-align:center}.pb-align-right{text-align:right}',
    '.pb-p{margin:0;color:var(--muted)}',
    '.pb-btn{display:inline-block;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:600}',
    '.pb-btn-primary{background:var(--accent);color:#fff}.pb-btn-ghost{border:1px solid var(--line);color:var(--ink)}',
    '.pb-fig{margin:0}.pb-img{width:100%;object-fit:cover;border-radius:var(--r);border:1px solid var(--line)}',
    '.pb-img-ph{display:flex;align-items:center;justify-content:center;border:1px dashed var(--line);border-radius:var(--r);color:var(--muted)}',
    '.pb-quote{margin:0;padding:16px 20px;border-left:3px solid var(--accent);background:#fff;border-radius:var(--r)}',
    '.pb-quote p{margin:0}.pb-quote cite{display:block;margin-top:8px;color:var(--muted);font-style:normal}',
    '.pb-list{margin:0;padding-left:22px;color:var(--muted)}',
    '.pb-cols{display:grid;grid-template-columns:1fr 1fr;gap:24px;color:var(--muted)}',
    '@media(max-width:640px){.pb-cols{grid-template-columns:1fr}}',
    '.pb-hr{border:0;border-top:1px solid var(--line);margin:0}.pb-hr-sm{margin:8px 0}.pb-hr-lg{margin:32px 0}',
    '.pb-spacer{width:100%}',
    '.pb-hero{padding:56px 24px;border-radius:var(--r);background:linear-gradient(180deg,rgba(10,169,201,.10),rgba(10,169,201,0));border:1px solid var(--line)}',
    '.pb-hero-title{margin:0 0 12px;font-size:40px;font-weight:800;line-height:1.1;color:var(--ink)}',
    '.pb-hero-sub{margin:0 0 20px;color:var(--muted);font-size:17px;max-width:60ch}',
    '.pb-hero.pb-align-center .pb-hero-sub{margin-left:auto;margin-right:auto}',
    '.pb-feats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}',
    '.pb-feat{padding:18px;border:1px solid var(--line);border-radius:var(--r);background:#fff}',
    '.pb-feat h4{margin:0 0 6px;font-size:15px;color:var(--ink)}.pb-feat p{margin:0;color:var(--muted);font-size:14px}',
    '.pb-cta{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:24px;border-radius:var(--r);background:linear-gradient(90deg,rgba(10,169,201,.12),rgba(10,169,201,.04));border:1px solid var(--line)}',
    '.pb-cta h3{margin:0;font-size:20px;color:var(--ink)}.pb-cta p{margin:4px 0 0;color:var(--muted)}',
    '@media(max-width:720px){.pb-feats{grid-template-columns:1fr}.pb-cta{flex-direction:column;align-items:flex-start}.pb-hero-title{font-size:30px}}'
  ].map((l) => '    ' + l).join('\n') + '\n';

  // ---------- starter template ----------
  function starter() {
    seq = 0;
    blocks = [
      { id: uid(), type: 'heading', props: { text: 'A landing page, built by dragging', level: 'h1', align: 'left' } },
      { id: uid(), type: 'paragraph', props: { text: 'Compose sections, text, buttons and media into a real page — then export clean HTML. All of it happens in your browser.', align: 'left' } },
      { id: uid(), type: 'button', props: { text: 'Get started', href: '#', align: 'left', style: 'primary' } },
      { id: uid(), type: 'columns', props: { left: 'Local-first: nothing is uploaded.', right: 'Export production-ready HTML.' } },
      { id: uid(), type: 'quote', props: { text: 'The best tool I have used to prototype a page.', who: 'Early user' } }
    ];
    selected = blocks[0].id;
  }

  // ---------- persistence ----------
  function loadProjects() {
    refs.projList.innerHTML = '';
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="pb-props-empty">' + esc(t('pb.dbUnavailable')) + '</div>'; return; }
    VT.db.list('page-builder').then((rows) => {
      rows = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.projList.innerHTML = '<div class="pb-props-empty">' + esc(t('pb.projEmpty')) + '</div>'; return; }
      rows.forEach((r) => {
        const el = document.createElement('div'); el.className = 'bench-row pb-proj-row';
        const info = document.createElement('div'); info.className = 'pb-proj-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('pb.projUntitled');
        const meta = document.createElement('span'); meta.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(nm, meta);
        const open = document.createElement('button'); open.type = 'button'; open.className = 'btn btn-ghost btn-sm'; open.textContent = t('pb.projOpen');
        open.addEventListener('click', () => { blocks = (r.data && r.data.blocks) || []; preview = (r.data && r.data.preview) || 'desktop'; applyPreview(); selected = blocks[0] ? blocks[0].id : null; commit(); hist.reset(canonical()); syncHist(); toast(t('pb.projOpened', { name: r.name || t('pb.projUntitled') }), 'success'); });
        el.append(info, open);
        refs.projList.append(el);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="pb-props-empty">' + esc(t('pb.dbError')) + '</div>'; });
  }

  // ---------- preview width ----------
  function applyPreview() {
    const map = { desktop: '100%', tablet: '720px', mobile: '390px' };
    refs.canvas.style.maxWidth = map[preview] || '100%';
    $$('.bench-seg .btn', refs.stage).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preview === preview)));
  }

  function mount(root) {
    alive = true;
    restore();
    starter();
    const I = VT.icons;

    root.innerHTML = `
      <div class="pb-stage" id="pb-stage">
        <div class="pb-bar bench">
          <span class="bench-rail-group">
            <button class="btn btn-ghost btn-sm" id="pb-starter">${I.sparkle} ${t('pb.starter')}</button>
            <button class="btn btn-ghost btn-sm" id="pb-clear">${I.broom} ${t('pb.clear')}</button>
          </span>
          <span class="bench-sep" aria-hidden="true"></span>
          <span class="bench-rail-group">
            <button class="btn btn-ghost btn-sm" id="pb-undo" data-tip="${t('hist.undo.tip')}" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
            <button class="btn btn-ghost btn-sm" id="pb-redo" data-tip="${t('hist.redo.tip')}" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
          </span>
          <span class="bench-sep" aria-hidden="true"></span>
          <span class="bench-seg" role="group" aria-label="${t('pb.preview')}">
            <button class="btn btn-ghost btn-sm" data-preview="desktop" aria-pressed="true">${t('pb.desktop')}</button>
            <button class="btn btn-ghost btn-sm" data-preview="tablet" aria-pressed="false">${t('pb.tablet')}</button>
            <button class="btn btn-ghost btn-sm" data-preview="mobile" aria-pressed="false">${t('pb.mobile')}</button>
          </span>
          <span class="pb-bar-actions">
            <button class="btn btn-ghost btn-sm" id="pb-copy">${I.copy} ${t('pb.copyHtml')}</button>
            <button class="btn btn-primary btn-sm" id="pb-export">${I.download} ${t('pb.export')}</button>
          </span>
        </div>
        <p class="pb-hint" id="pb-hint" role="status" aria-live="polite"></p>

        <div class="pb-work">
          <aside class="pb-palette bench" aria-label="${t('pb.palette')}">
            <h3 class="bench-sec-head">${t('pb.palette')}</h3>
            <div class="pb-palette-grid">
              ${ORDER.map((k) => '<button class="pb-pal" type="button" draggable="true" data-type="' + k + '"><span class="pb-pal-name">' + esc(t(TYPES[k].label)) + '</span><span class="pb-pal-hint">' + esc(t('pb.addHint')) + '</span></button>').join('')}
            </div>
            <h3 class="bench-sec-head">${t('pb.projList')}</h3>
            <div class="bench-list pb-proj-list" id="pb-proj-list"></div>
            <div class="pb-proj-save">
              <input class="input" id="pb-proj-name" type="text" placeholder="${t('pb.projNamePh')}" aria-label="${t('pb.projNamePh')}">
              <button class="btn btn-ghost btn-sm" id="pb-proj-save">${I.file} ${t('pb.projSave')}</button>
            </div>
          </aside>

          <section class="pb-canvas-wrap mat glass" aria-label="${t('pb.canvas')}">
            <div class="pb-canvas mat-sheet" id="pb-canvas"></div>
            <div class="mat-empty" id="pb-canvas-empty" hidden>
              <span class="orb orb-lg">${I.wand}</span>
              <div class="mat-empty-title">${t('pb.emptyTitle')}</div>
              <p class="mat-empty-body">${t('pb.empty')}</p>
              <div class="mat-empty-cta">
                <button class="btn btn-primary btn-sm" id="pb-empty-starter">${I.sparkle} ${t('pb.starter')}</button>
                <span class="mat-empty-keys"><span class="kbd">Ctrl</span> + <span class="kbd">Z</span> ${t('pb.emptyUndo')}</span>
              </div>
            </div>
          </section>

          <aside class="pb-props" id="pb-props" aria-label="${t('pb.props')}"></aside>
        </div>

        <p class="privacy-line">${I.shield} ${t('pb.privacy')}</p>
      </div>`;

    refs = {
      stage: $('#pb-stage', root), canvas: $('#pb-canvas', root), props: $('#pb-props', root),
      canvasWrap: $('.pb-canvas-wrap', root), hint: $('#pb-hint', root),
      emptyEl: $('#pb-canvas-empty', root),
      undo: $('#pb-undo', root), redo: $('#pb-redo', root), projList: $('#pb-proj-list', root),
      projName: $('#pb-proj-name', root)
    };

    autosave = U.debounce(() => {
      if (!alive || !VT.db.available) return;
      VT.db.put({ id: AUTOSAVE_ID, tool: 'page-builder', name: '(autosave)', data: { blocks, preview } }).catch(() => {});
    }, 700);

    hist = VT.history.create({ apply: (val) => { const m = val ? JSON.parse(val) : { blocks: [], preview: 'desktop' }; blocks = m.blocks || []; preview = m.preview || 'desktop'; selected = blocks[0] ? blocks[0].id : null; applyPreview(); renderCanvas(); renderProps(); syncHist(); if (autosave) autosave(); } });

    $$('.pb-pal', root).forEach((btn) => {
      btn.addEventListener('click', () => addBlock(btn.dataset.type));
      btn.addEventListener('dragstart', (e) => { dragNew = btn.dataset.type; dragId = null; e.dataTransfer.effectAllowed = 'copy'; try { e.dataTransfer.setData('text/plain', 'new:' + btn.dataset.type); } catch (_) {} });
      btn.addEventListener('dragend', () => { dragNew = null; clearDrop(); });
    });
    wireCanvasDnD();
    const useStarter = () => { starter(); commit(); hist.record(canonical()); syncHist(); };
    $('#pb-starter', root).addEventListener('click', useStarter);
    $('#pb-empty-starter', root).addEventListener('click', useStarter);
    $('#pb-clear', root).addEventListener('click', () => {
      blocks = []; selected = null; commit(); hist.record(canonical()); syncHist();
      if (VT.db.available) VT.db.remove(AUTOSAVE_ID).catch(() => {});
    });
    $('#pb-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#pb-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });
    // Preview width is a view state, not an edit: it re-renders and persists but
    // never enters the undo stack, same rule the other benches follow.
    $$('.bench-seg .btn', root).forEach((b) => b.addEventListener('click', () => { preview = b.dataset.preview; state.preview = preview; persist(); applyPreview(); if (autosave) autosave(); }));

    $('#pb-copy', root).addEventListener('click', async () => {
      const ok = await U.copyText(exportHTML());
      toast(ok ? t('pb.copied') : t('pb.copyFail'), ok ? 'success' : 'error');
    });
    $('#pb-export', root).addEventListener('click', () => {
      U.downloadText(exportHTML(), 'vistanology-page.html', 'text/html');
      toast(t('pb.exported'), 'success');
    });

    $('#pb-proj-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('pb.dbUnavailable'), 'error'); return; }
      const name = refs.projName.value.trim() || t('pb.projUntitled');
      refs.projName.value = name;
      try { await VT.db.put({ tool: 'page-builder', name, data: { blocks, preview } }); toast(t('pb.projSaved', { name }), 'success'); loadProjects(); }
      catch (e) { toast(t('pb.dbError'), 'error'); }
    });

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) syncHist();
    });

    applyPreview();
    renderCanvas(); renderProps();
    hist.reset(canonical()); syncHist();
    loadProjects();

    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then((rec) => {
        if (!alive || !rec || !rec.data || !Array.isArray(rec.data.blocks)) return;
        blocks = rec.data.blocks; preview = rec.data.preview || preview; state.preview = preview; persist();
        selected = blocks[0] ? blocks[0].id : null;
        applyPreview(); renderCanvas(); renderProps(); hist.reset(canonical()); syncHist();
        refs.hint.textContent = t('pb.restored', { n: blocks.length });
      }).catch(() => {});
    }

    return () => { alive = false; };
  }

  function unmount() { alive = false; hist = null; blocks = []; selected = null; refs = {}; }

  const def = {
    id: 'page-builder', cat: 'creative', icon: 'wand', version: '0.1.0',
    name: { en: 'Visual Page Builder', pt: 'Construtor Visual de Páginas' },
    tagline: {
      en: 'Compose a real landing page by dragging blocks — hero, text, buttons, media, features, CTA — edit each in a properties panel, preview responsively, autosave locally, and export clean HTML. Fully offline.',
      pt: 'Monte uma landing page de verdade arrastando blocos — destaque, texto, botões, mídia, recursos, CTA — edite cada um num painel de propriedades, pré-visualize de forma responsiva, salve automaticamente no dispositivo e exporte HTML limpo. Totalmente offline.'
    },
    tags: ['page', 'builder', 'html', 'drag', 'design', 'creative'],
    deps: [],
    docs: {
      en: {
        summary: 'A drag-and-drop visual page builder with a typed block model, live canvas, properties panel, responsive preview, undo/redo, local projects and clean HTML export.',
        usage: 'Drag a block from the palette onto the canvas (or click it to append), then reorder by dragging or with the up/down tools. Select a block and edit it in the right-hand properties panel. Switch desktop/tablet/mobile to preview responsiveness. Your work autosaves on-device; Copy HTML or Export .html to ship.',
        privacy: 'Composition, preview and export run entirely in your browser. Exported HTML is generated from a typed model with all text escaped — no scripts are ever injected or evaluated. Projects are stored on-device via IndexedDB.',
        limits: 'Blocks cover common landing-page sections (heading, paragraph, button, image, quote, list, columns, divider, spacer). Image sources accept a URL or data: image; remote images load only if you add their URL. Export is static HTML + CSS, not a full site.'
      },
      pt: {
        summary: 'Um construtor visual de páginas com arrastar-e-soltar: modelo de blocos tipado, tela ao vivo, painel de propriedades, pré-visualização responsiva, desfazer/refazer, projetos locais e exportação de HTML limpo.',
        usage: 'Arraste um bloco da paleta para a tela (ou clique para adicionar) e reordene arrastando ou com as setas. Selecione um bloco e edite no painel de propriedades à direita. Alterne desktop/tablet/celular para ver a responsividade. Seu trabalho é salvo automaticamente no dispositivo; Copie o HTML ou Exporte .html para publicar.',
        privacy: 'Composição, pré-visualização e exportação rodam inteiramente no navegador. O HTML exportado é gerado de um modelo tipado com todo texto escapado — nenhum script é injetado ou avaliado. Projetos ficam no dispositivo via IndexedDB.',
        limits: 'Os blocos cobrem seções comuns de landing page (título, parágrafo, botão, imagem, citação, lista, colunas, divisor, espaçador). Imagens aceitam URL ou data:; imagens remotas só carregam se você adicionar a URL. A exportação é HTML + CSS estático, não um site completo.'
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'pb.title': 'Visual Page Builder', 'pb.starter': 'Template', 'pb.clear': 'Clear', 'pb.preview': 'Preview width',
      'pb.desktop': 'Desktop', 'pb.tablet': 'Tablet', 'pb.mobile': 'Mobile', 'pb.copyHtml': 'Copy HTML', 'pb.export': 'Export .html',
      'pb.palette': 'Blocks', 'pb.canvas': 'Page canvas', 'pb.props': 'Properties', 'pb.addHint': 'click to add',
      'pb.emptyTitle': 'Start your page', 'pb.empty': 'Add a block from the palette on the left, or open the ready-made template.',
      'pb.emptyUndo': 'undo · Del removes the selection',
      'pb.selectNone': 'Select a block to edit its properties.',
      'pb.up': 'Move up', 'pb.down': 'Move down', 'pb.delete': 'Delete block', 'pb.imageEmpty': 'Image placeholder',
      'pb.copied': 'HTML copied to clipboard', 'pb.copyFail': 'Could not copy — select the export and copy manually.',
      'pb.exported': 'Page exported as HTML',
      'pb.restored': 'Restored your last session ({n} blocks)',
      'pb.t.heading': 'Heading', 'pb.t.paragraph': 'Paragraph', 'pb.t.button': 'Button', 'pb.t.image': 'Image', 'pb.t.quote': 'Quote', 'pb.t.list': 'List', 'pb.t.columns': 'Columns', 'pb.t.divider': 'Divider', 'pb.t.spacer': 'Spacer',
      'pb.t.hero': 'Hero', 'pb.t.features': 'Features', 'pb.t.cta': 'Call to action',
      'pb.f.text': 'Text', 'pb.f.level': 'Level', 'pb.f.align': 'Align', 'pb.f.href': 'Link URL', 'pb.f.style': 'Style', 'pb.f.src': 'Image URL', 'pb.f.alt': 'Alt text', 'pb.f.ratio': 'Ratio', 'pb.f.who': 'Attribution', 'pb.f.items': 'Items (one per line)', 'pb.f.ordered': 'Numbered', 'pb.f.left': 'Left column', 'pb.f.right': 'Right column', 'pb.f.space': 'Space', 'pb.f.size': 'Height (px)', 'pb.f.title': 'Title', 'pb.f.sub': 'Subtitle',
      'pb.projList': 'Projects', 'pb.projNamePh': 'Page name…', 'pb.projSave': 'Save', 'pb.projOpen': 'Open', 'pb.projUntitled': 'Untitled page', 'pb.projEmpty': 'No saved pages yet.', 'pb.projSaved': 'Saved "{name}"', 'pb.projOpened': 'Opened "{name}"', 'pb.dbUnavailable': 'Local storage unavailable — projects cannot be saved.', 'pb.dbError': 'Could not reach local storage.',
      'pb.privacy': 'You build and export entirely in your browser. Exported HTML is escaped from a typed model — no scripts are injected or evaluated, and nothing is uploaded.'
    },
    pt: {
      'pb.title': 'Construtor Visual de Páginas', 'pb.starter': 'Modelo', 'pb.clear': 'Limpar', 'pb.preview': 'Largura da prévia',
      'pb.desktop': 'Desktop', 'pb.tablet': 'Tablet', 'pb.mobile': 'Celular', 'pb.copyHtml': 'Copiar HTML', 'pb.export': 'Exportar .html',
      'pb.palette': 'Blocos', 'pb.canvas': 'Tela da página', 'pb.props': 'Propriedades', 'pb.addHint': 'clique para adicionar',
      'pb.emptyTitle': 'Comece sua página', 'pb.empty': 'Adicione um bloco pela paleta à esquerda ou abra o modelo pronto.',
      'pb.emptyUndo': 'desfazer · Exclui remove a seleção',
      'pb.selectNone': 'Selecione um bloco para editar as propriedades.',
      'pb.up': 'Mover para cima', 'pb.down': 'Mover para baixo', 'pb.delete': 'Excluir bloco', 'pb.imageEmpty': 'Espaço de imagem',
      'pb.copied': 'HTML copiado para a área de transferência', 'pb.copyFail': 'Não foi possível copiar — selecione a exportação e copie manualmente.',
      'pb.exported': 'Página exportada como HTML',
      'pb.restored': 'Sessão anterior restaurada ({n} blocos)',
      'pb.t.heading': 'Título', 'pb.t.paragraph': 'Parágrafo', 'pb.t.button': 'Botão', 'pb.t.image': 'Imagem', 'pb.t.quote': 'Citação', 'pb.t.list': 'Lista', 'pb.t.columns': 'Colunas', 'pb.t.divider': 'Divisor', 'pb.t.spacer': 'Espaçador',
      'pb.t.hero': 'Destaque', 'pb.t.features': 'Recursos', 'pb.t.cta': 'Chamada para ação',
      'pb.f.text': 'Texto', 'pb.f.level': 'Nível', 'pb.f.align': 'Alinhamento', 'pb.f.href': 'URL do link', 'pb.f.style': 'Estilo', 'pb.f.src': 'URL da imagem', 'pb.f.alt': 'Texto alternativo', 'pb.f.ratio': 'Proporção', 'pb.f.who': 'Atribuição', 'pb.f.items': 'Itens (um por linha)', 'pb.f.ordered': 'Numerada', 'pb.f.left': 'Coluna esquerda', 'pb.f.right': 'Coluna direita', 'pb.f.space': 'Espaço', 'pb.f.size': 'Altura (px)', 'pb.f.title': 'Título', 'pb.f.sub': 'Subtítulo',
      'pb.projList': 'Projetos', 'pb.projNamePh': 'Nome da página…', 'pb.projSave': 'Salvar', 'pb.projOpen': 'Abrir', 'pb.projUntitled': 'Página sem nome', 'pb.projEmpty': 'Nenhuma página salva ainda.', 'pb.projSaved': 'Salvo "{name}"', 'pb.projOpened': 'Aberto "{name}"', 'pb.dbUnavailable': 'Armazenamento local indisponível — projetos não podem ser salvos.', 'pb.dbError': 'Não foi possível acessar o armazenamento local.',
      'pb.privacy': 'Você monta e exporta inteiramente no navegador. O HTML exportado é escapado de um modelo tipado — nenhum script é injetado ou avaliado, e nada é enviado.'
    }
  });

  VT.registry.add(def);
  return def;
})();
