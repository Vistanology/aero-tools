window.VT = window.VT || {};

/* U16 · Kanban Board — a local-first task board. Columns and cards you drag between them, inline editing,
 * undo/redo of the whole board, autosave + session restore in IndexedDB, named projects, search, and export to
 * JSON or Markdown. All card/column text is HTML-escaped and rendered from a plain data model — no eval, no raw
 * HTML, nothing uploaded. It runs fully offline.
 */
VT.modules['kanban'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'kanban';
  const TOOL = 'kanban';
  const AUTOSAVE_ID = 'kb:autosave';

  let alive = false;
  let refs = {};
  let hist = null;
  let autosave = null;
  let board = null;
  let selectedCardId = null;
  let query = '';
  let drag = null;

  const uid = () => VT.db.uid();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function DEFAULT_BOARD() {
    return {
      name: t('kb.boardDefault'),
      columns: [
        { id: uid(), title: t('kb.col.todo'), cards: [] },
        { id: uid(), title: t('kb.col.doing'), cards: [] },
        { id: uid(), title: t('kb.col.done'), cards: [] }
      ]
    };
  }

  function SAMPLE_BOARD() {
    return {
      name: t('kb.boardDefault'),
      columns: [
        { id: uid(), title: t('kb.col.todo'), cards: [
          { id: uid(), title: t('kb.s.c1'), desc: t('kb.s.c1d'), tags: ['ui'], done: false },
          { id: uid(), title: t('kb.s.c2'), desc: '', tags: ['docs'], done: false }
        ] },
        { id: uid(), title: t('kb.col.doing'), cards: [
          { id: uid(), title: t('kb.s.c3'), desc: t('kb.s.c3d'), tags: ['core'], done: false }
        ] },
        { id: uid(), title: t('kb.col.done'), cards: [
          { id: uid(), title: t('kb.s.c4'), desc: '', tags: ['local'], done: true }
        ] }
      ]
    };
  }

  function findCard(cardId) {
    for (const col of board.columns) {
      const idx = col.cards.findIndex((c) => c.id === cardId);
      if (idx >= 0) return { col, idx, card: col.cards[idx] };
    }
    return null;
  }
  function findCol(colId) { return board.columns.find((c) => c.id === colId) || null; }

  const canonical = () => JSON.stringify(board);
  function record() { if (hist) { hist.record(canonical()); syncHist(); } }
  function commit() { renderBoard(); renderPanel(); if (autosave) autosave(); }

  // ---------- board ops ----------
  function addColumn(title) {
    board.columns.push({ id: uid(), title: (title || t('kb.col.new')).trim() || t('kb.col.new'), cards: [] });
    commit(); record();
  }
  function renameColumn(id, title) { const c = findCol(id); if (!c) return; c.title = title; if (autosave) autosave(); record(); }
  function deleteColumn(id, title) {
    VT.ui.confirm({ title: t('kb.delCol'), body: t('kb.delColQ', { name: title }), confirmLabel: t('kb.del'), danger: true }).then((yes) => {
      if (!yes) return;
      board.columns = board.columns.filter((c) => c.id !== id);
      if (selectedCardId && !findCard(selectedCardId)) selectedCardId = null;
      commit(); record();
    });
  }
  function moveColumn(id, dir) {
    const i = board.columns.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= board.columns.length) return;
    const [c] = board.columns.splice(i, 1); board.columns.splice(j, 0, c);
    commit(); record();
  }
  function addCard(colId, title) {
    const c = findCol(colId); if (!c || !title) return;
    const card = { id: uid(), title: title.trim(), desc: '', tags: [], done: false };
    if (!card.title) return;
    c.cards.push(card);
    selectedCardId = card.id;
    commit(); record();
  }
  function deleteCard(id) {
    const f = findCard(id); if (!f) return;
    f.col.cards.splice(f.idx, 1);
    if (selectedCardId === id) selectedCardId = null;
    commit(); record();
  }
  function toggleDone(id) { const f = findCard(id); if (!f) return; f.card.done = !f.card.done; commit(); record(); }

  function moveCard(cardId, toColId, toIdx) {
    const f = findCard(cardId); if (!f) return;
    const toCol = findCol(toColId); if (!toCol) return;
    const [card] = f.col.cards.splice(f.idx, 1);
    let idx = toIdx;
    if (f.col === toCol && toIdx > f.idx) idx = toIdx; // placeholder index already accounts for removal gap
    idx = clamp(idx, 0, toCol.cards.length);
    toCol.cards.splice(idx, 0, card);
    commit(); record();
  }

  // ---------- rendering ----------
  function matches(card) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (card.title || '').toLowerCase().includes(q) || (card.desc || '').toLowerCase().includes(q) || (card.tags || []).some((tg) => tg.toLowerCase().includes(q));
  }

  function renderBoard() {
    if (!refs.board) return;
    refs.board.innerHTML = '';
    // The empty state belongs to the desk, so it survives the re-render: innerHTML
    // detaches it and it is put back before the columns are appended.
    if (refs.emptyEl) refs.board.append(refs.emptyEl);
    if (refs.emptyEl) refs.emptyEl.hidden = board.columns.length > 0;
    board.columns.forEach((col, ci) => {
      const colEl = document.createElement('div'); colEl.className = 'kb-col mat-sheet'; colEl.dataset.col = col.id;
      const head = document.createElement('div'); head.className = 'kb-col-head';
      const meta = document.createElement('div'); meta.className = 'kb-col-meta';
      const title = document.createElement('input'); title.className = 'kb-col-title'; title.value = col.title; title.setAttribute('aria-label', t('kb.colTitle'));
      title.addEventListener('input', () => renameColumn(col.id, title.value));
      const count = document.createElement('span'); count.className = 'kb-col-count'; count.textContent = String(col.cards.length);
      const tools = document.createElement('div'); tools.className = 'kb-col-tools';
      tools.innerHTML =
        '<button class="btn btn-ghost btn-sm kb-col-mv" data-act="left" title="' + esc(t('kb.moveLeft')) + '" ' + (ci === 0 ? 'disabled' : '') + '>←</button>' +
        '<button class="btn btn-ghost btn-sm kb-col-mv" data-act="right" title="' + esc(t('kb.moveRight')) + '" ' + (ci === board.columns.length - 1 ? 'disabled' : '') + '>→</button>' +
        '<button class="btn btn-ghost btn-sm kb-col-del" data-act="del" title="' + esc(t('kb.delCol')) + '" aria-label="' + esc(t('kb.delCol')) + '">&times;</button>';
      tools.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || b.disabled) return;
        const act = b.dataset.act;
        if (act === 'left') moveColumn(col.id, -1);
        else if (act === 'right') moveColumn(col.id, 1);
        else if (act === 'del') deleteColumn(col.id, col.title);
      });
      meta.append(count, tools);
      head.append(title, meta);

      const cards = document.createElement('div'); cards.className = 'kb-cards'; cards.dataset.col = col.id;
      col.cards.forEach((card) => cards.append(renderCard(card)));
      if (!col.cards.length) { const e = document.createElement('div'); e.className = 'kb-cards-empty'; e.textContent = t('kb.emptyCol'); cards.append(e); }

      const composer = document.createElement('div'); composer.className = 'kb-composer';
      const addBtn = document.createElement('button'); addBtn.className = 'btn btn-ghost btn-sm kb-add-card';
      addBtn.textContent = '+ ' + t('kb.addCard');
      const ta = document.createElement('textarea'); ta.className = 'kb-new-card input'; ta.rows = 2; ta.placeholder = t('kb.newCardPh'); ta.hidden = true;
      addBtn.addEventListener('click', () => { ta.hidden = false; ta.focus(); });
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const value = ta.value; ta.value=''; ta.hidden=true; addCard(col.id, value); refs.board.querySelector('[data-col="' + col.id + '"] .kb-add-card')?.focus(); }
        else if (e.key === 'Escape') { ta.value=''; ta.hidden=true; addBtn.focus(); }
      });
      ta.addEventListener('blur', () => { const value = ta.value; ta.value=''; ta.hidden=true; if (value.trim()) addCard(col.id, value); });
      composer.append(addBtn, ta);

      colEl.append(head, cards, composer);
      refs.board.append(colEl);
    });
    layoutBoard();
  }

  function renderCard(card) {
    const el = document.createElement('article');
    el.className = 'kb-card' + (card.done ? ' is-done' : '') + (card.id === selectedCardId ? ' is-sel' : '') + (matches(card) ? '' : ' is-dim');
    el.dataset.card = card.id;
    el.tabIndex = 0;
    const top = document.createElement('div'); top.className = 'kb-card-top';
    const chk = document.createElement('button'); chk.type = 'button'; chk.className = 'kb-card-check' + (card.done ? ' on' : ''); chk.title = t('kb.toggleDone');
    chk.innerHTML = card.done ? '✓' : '';
    chk.addEventListener('click', (e) => { e.stopPropagation(); toggleDone(card.id); });
    const ttl = document.createElement('div'); ttl.className = 'kb-card-title'; ttl.textContent = card.title;
    const del = document.createElement('button'); del.type = 'button'; del.className = 'kb-card-del'; del.title = t('kb.delCard'); del.setAttribute('aria-label', t('kb.delCard')); del.textContent = '×';
    del.addEventListener('click', (e) => { e.stopPropagation(); deleteCard(card.id); });
    top.append(chk, ttl, del);
    el.append(top);
    if (card.desc) { const d = document.createElement('div'); d.className = 'kb-card-desc'; d.textContent = card.desc; el.append(d); }
    if (card.tags && card.tags.length) {
      const tg = document.createElement('div'); tg.className = 'kb-card-tags';
      card.tags.forEach((tag) => { const s = document.createElement('span'); s.className = 'kb-tag'; s.textContent = tag; tg.append(s); });
      el.append(tg);
    }
    el.addEventListener('pointerdown', onCardPointerDown);
    el.addEventListener('click', () => { selectedCardId = card.id; renderBoard(); renderPanel(); });
    el.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      selectedCardId = card.id; renderBoard(); renderPanel(); refs.panel.querySelector('.kb-field input, .kb-field textarea')?.focus();
    });
    return el;
  }

  function layoutBoard() {
    // Columns are a fixed-width horizontal strip (flex) that scrolls; nothing to compute.
  }

  // ---------- card edit panel ----------
  function renderPanel() {
    if (!refs.panel) return;
    const f = selectedCardId ? findCard(selectedCardId) : null;
    if (!f) { refs.panel.innerHTML = '<div class="kb-panel-empty">' + esc(t('kb.panelEmpty')) + '</div>'; return; }
    const card = f.card;
    refs.panel.innerHTML =
      '<label class="kb-field"><span>' + esc(t('kb.cardTitle')) + '</span><input class="input" id="kb-p-title" type="text"></label>' +
      '<label class="kb-field"><span>' + esc(t('kb.cardDesc')) + '</span><textarea class="input" id="kb-p-desc" rows="4"></textarea></label>' +
      '<label class="kb-field"><span>' + esc(t('kb.cardTags')) + '</span><input class="input" id="kb-p-tags" type="text"></label>' +
      '<label class="kb-check"><input id="kb-p-done" type="checkbox"' + (card.done ? ' checked' : '') + '><span>' + esc(t('kb.toggleDone')) + '</span></label>' +
      '<div class="kb-panel-meta">' + esc(f.col.title) + '</div>' +
      '<button class="btn btn-ghost btn-sm kb-panel-del" id="kb-p-del">' + esc(t('kb.delCard')) + '</button>';
    const ti = $('#kb-p-title', refs.panel), de = $('#kb-p-desc', refs.panel), tg = $('#kb-p-tags', refs.panel), dn = $('#kb-p-done', refs.panel);
    ti.value = card.title; de.value = card.desc || ''; tg.value = (card.tags || []).join(', ');
    const recSoon = U.debounce(record, 500);
    const apply = () => {
      card.title = ti.value; card.desc = de.value;
      card.tags = tg.value.split(',').map((s) => s.trim()).filter(Boolean);
      card.done = dn.checked;
      renderBoard(); recSoon(); if (autosave) autosave();
    };
    [ti, de, tg, dn].forEach((el) => el.addEventListener('input', apply));
    $('#kb-p-del', refs.panel).addEventListener('click', () => deleteCard(card.id));
  }

  // ---------- pointer drag ----------
  function onCardPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest('button, input, textarea, .kb-card-del, .kb-card-check')) return;
    const cardEl = e.target.closest('.kb-card'); if (!cardEl) return;
    const cardId = cardEl.dataset.card;
    const f = findCard(cardId); if (!f) return;
    e.preventDefault();
    const rect = cardEl.getBoundingClientRect();
    const ghost = cardEl.cloneNode(true);
    ghost.classList.add('kb-ghost'); ghost.classList.remove('is-sel');
    ghost.style.width = rect.width + 'px'; ghost.style.left = rect.left + 'px'; ghost.style.top = rect.top + 'px';
    document.body.append(ghost);
    const ph = document.createElement('div'); ph.className = 'kb-drop';
    cardEl.classList.add('kb-drag-src');
    drag = { cardId, fromCol: f.col.id, fromIdx: f.idx, ghost, ph, cardEl, offX: e.clientX - rect.left, offY: e.clientY - rect.top, toCol: f.col.id, toIdx: f.idx, startX: e.clientX, startY: e.clientY, moved: false };
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', onDragUp);
  }

  function onDragMove(e) {
    if (!drag) return;
    // A pointer press that never travels is a selection, not a move: the drag only
    // becomes real past a few pixels, otherwise the re-render would swallow the click.
    if (!drag.moved && Math.abs(e.clientX - drag.startX) + Math.abs(e.clientY - drag.startY) < 5) return;
    drag.moved = true;
    drag.ghost.style.left = (e.clientX - drag.offX) + 'px';
    drag.ghost.style.top = (e.clientY - drag.offY) + 'px';
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const colEl = under && under.closest ? under.closest('.kb-col') : null;
    if (!colEl) return;
    const toCol = colEl.dataset.col;
    const cardsWrap = colEl.querySelector('.kb-cards');
    const cardEls = [...cardsWrap.querySelectorAll('.kb-card')].filter((el) => el.dataset.card !== drag.cardId);
    let idx = cardEls.length;
    for (let i = 0; i < cardEls.length; i++) {
      const r = cardEls[i].getBoundingClientRect();
      if (e.clientY < r.top + r.height / 2) { idx = i; break; }
    }
    drag.toCol = toCol; drag.toIdx = idx;
    const ref = cardEls[idx] || null;
    if (ref) cardsWrap.insertBefore(drag.ph, ref); else cardsWrap.append(drag.ph);
  }

  function onDragUp() {
    if (!drag) return;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    const { cardId, toCol, toIdx, moved } = drag;
    drag.ghost.remove();
    if (drag.ph && drag.ph.parentElement) drag.ph.remove();
    drag.cardEl.classList.remove('kb-drag-src');
    drag = null;
    if (!moved) { selectedCardId = cardId; renderBoard(); renderPanel(); return; }
    moveCard(cardId, toCol, toIdx);
  }

  // ---------- export ----------
  function exportJSON() {
    U.downloadText(JSON.stringify(board, null, 2), safeName(board.name) + '.json', 'application/json');
    toast(t('kb.exportedJson'), 'success');
  }
  function toMarkdown() {
    let out = '# ' + board.name + '\n';
    board.columns.forEach((col) => {
      out += '\n## ' + col.title + ' (' + col.cards.length + ')\n';
      if (!col.cards.length) out += '\n_(empty)_\n';
      col.cards.forEach((c) => {
        out += '\n- [' + (c.done ? 'x' : ' ') + '] ' + c.title;
        if (c.tags && c.tags.length) out += '  `#' + c.tags.join('` `#') + '`';
        if (c.desc) out += '\n  ' + c.desc.replace(/\n+/g, ' ');
        out += '\n';
      });
    });
    return out;
  }
  function exportMD() {
    U.downloadText(toMarkdown(), safeName(board.name) + '.md', 'text/markdown');
    toast(t('kb.exportedMd'), 'success');
  }
  function safeName(n) { return (n || 'board').replace(/[^\w-]+/g, '_').slice(0, 60); }

  // ---------- projects ----------
  function loadProjects() {
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty kb-empty">' + esc(t('kb.dbUnavailable')) + '</div>'; return; }
    VT.db.list(TOOL).then((rows) => {
      const named = rows.filter((r) => r.id !== AUTOSAVE_ID);
      refs.projList.innerHTML = '';
      if (!named.length) { refs.projList.innerHTML = '<div class="bench-empty kb-empty">' + esc(t('kb.noProjects')) + '</div>'; return; }
      named.forEach((r) => {
        const row = document.createElement('div'); row.className = 'bench-row kb-proj-row';
        const info = document.createElement('div'); info.className = 'kb-proj-info';
        const st = document.createElement('strong'); st.textContent = r.name || t('kb.untitled');
        const sm = document.createElement('span'); sm.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(st, sm);
        const open = document.createElement('button'); open.className = 'btn btn-ghost btn-sm'; open.textContent = t('kb.open');
        open.addEventListener('click', () => openProject(r));
        const del = document.createElement('button'); del.className = 'btn btn-ghost btn-sm'; del.textContent = '×'; del.title = t('kb.del'); del.setAttribute('aria-label', t('kb.del'));
        del.addEventListener('click', () => { VT.db.remove(r.id).then(loadProjects).catch(() => toast(t('kb.dbError'), 'error')); });
        row.append(info, open, del);
        refs.projList.append(row);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty kb-empty">' + esc(t('kb.dbError')) + '</div>'; });
  }
  function saveProject() {
    if (!VT.db.available) { toast(t('kb.dbUnavailable'), 'error'); return; }
    const name = (refs.projName.value || '').trim() || board.name;
    board.name = name;
    VT.db.put({ tool: TOOL, name, data: board }).then(() => { toast(t('kb.projSaved', { name }), 'success'); refs.projName.value = ''; loadProjects(); renderBoard(); }).catch(() => toast(t('kb.dbError'), 'error'));
  }
  function openProject(rec) {
    applyBoard(rec.data);
    toast(t('kb.projOpened', { name: rec.name || t('kb.untitled') }), 'success');
  }

  function applyBoard(data) {
    board = normalizeBoard(data);
    selectedCardId = null; query = ''; if (refs.search) refs.search.value = '';
    if (hist) hist.reset(canonical()); syncHist();
    renderBoard(); renderPanel(); if (autosave) autosave();
  }

  function normalizeBoard(d) {
    const b = d && typeof d === 'object' ? d : DEFAULT_BOARD();
    const columns = Array.isArray(b.columns) ? b.columns.map((c) => ({
      id: c.id || uid(),
      title: typeof c.title === 'string' ? c.title : t('kb.col.new'),
      cards: Array.isArray(c.cards) ? c.cards.map((k) => ({
        id: k.id || uid(),
        title: typeof k.title === 'string' ? k.title : '',
        desc: typeof k.desc === 'string' ? k.desc : '',
        tags: Array.isArray(k.tags) ? k.tags.filter((x) => typeof x === 'string') : [],
        done: !!k.done
      })) : []
    })) : [];
    return { name: typeof b.name === 'string' ? b.name : t('kb.boardDefault'), columns: columns.length ? columns : DEFAULT_BOARD().columns };
  }

  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }

  function persistSession() { VT.store.set(KEY, { selectedCardId }); }

  function loadBoard() {
    if (!VT.db.available) { renderBoard(); renderPanel(); return Promise.resolve(); }
    return VT.db.get(AUTOSAVE_ID).then((rec) => {
      board = normalizeBoard(rec && rec.data);
      const s = VT.store.get(KEY, null);
      if (s && s.selectedCardId && findCard(s.selectedCardId)) selectedCardId = s.selectedCardId;
      if (hist) hist.reset(canonical()); syncHist();
      renderBoard(); renderPanel();
    }).catch(() => { board = DEFAULT_BOARD(); renderBoard(); renderPanel(); });
  }

  function mount(root) {
    alive = true;
    const I = VT.icons;

    root.innerHTML = `
      <div class="kb-stage">
        <div class="kb-bar bench">
          <span class="bench-rail-group">
            <button class="btn btn-primary btn-sm" id="kb-addcol">${I.plus} ${t('kb.addCol')}</button>
            <button class="btn btn-ghost btn-sm" id="kb-sample">${I.sparkle} ${t('kb.sample')}</button>
          </span>
          <span class="bench-sep" aria-hidden="true"></span>
          <span class="bench-rail-group">
            <button class="btn btn-ghost btn-sm" id="kb-undo" data-tip="${t('hist.undo.tip')}" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
            <button class="btn btn-ghost btn-sm" id="kb-redo" data-tip="${t('hist.redo.tip')}" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
          </span>
          <input class="input kb-search" id="kb-search" type="search" placeholder="${t('kb.searchPh')}" aria-label="${t('kb.searchPh')}">
          <span class="kb-bar-actions">
            <button class="btn btn-ghost btn-sm" id="kb-exp-json">${I.download} ${t('kb.exportJson')}</button>
            <button class="btn btn-ghost btn-sm" id="kb-exp-md">${I.download} ${t('kb.exportMd')}</button>
          </span>
        </div>

        <div class="kb-work">
          <div class="kb-main">
            <div class="kb-board mat glass" id="kb-board">
              <div class="mat-empty" id="kb-board-empty" hidden>
                <span class="orb orb-lg">${I.layers}</span>
                <div class="mat-empty-title">${t('kb.emptyTitle')}</div>
                <p class="mat-empty-body">${t('kb.emptyBody')}</p>
                <div class="mat-empty-cta">
                  <button class="btn btn-primary btn-sm" id="kb-empty-sample">${I.sparkle} ${t('kb.emptyCta')}</button>
                  <span class="mat-empty-keys"><span class="kbd">Ctrl</span> + <span class="kbd">Z</span> ${t('kb.emptyUndo')}</span>
                </div>
              </div>
            </div>
          </div>
          <aside class="kb-side">
            <section class="bench-sec glass">
              <h3 class="bench-sec-head">${t('kb.cardEditor')}</h3>
              <div class="kb-panel" id="kb-panel"></div>
            </section>
            <section class="bench-sec glass">
              <h3 class="bench-sec-head">${t('kb.projects')}</h3>
              <div class="kb-proj-save">
                <input class="input" id="kb-proj-name" type="text" placeholder="${t('kb.projNamePh')}" aria-label="${t('kb.projNamePh')}">
                <button class="btn btn-primary btn-sm" id="kb-proj-save">${t('kb.save')}</button>
              </div>
              <div class="bench-list kb-proj-list" id="kb-proj-list"></div>
            </section>
          </aside>
        </div>

        <p class="privacy-line">${I.shield} ${t('kb.privacy')}</p>
      </div>`;

    refs = {
      board: $('#kb-board', root), panel: $('#kb-panel', root), search: $('#kb-search', root),
      emptyEl: $('#kb-board-empty', root),
      undo: $('#kb-undo', root), redo: $('#kb-redo', root), projName: $('#kb-proj-name', root), projList: $('#kb-proj-list', root)
    };

    autosave = U.debounce(() => {
      if (!alive || !VT.db.available) return;
      VT.db.put({ id: AUTOSAVE_ID, tool: TOOL, name: '(autosave)', data: board }).catch(() => {});
    }, 500);

    hist = VT.history.create({ apply: (val) => { board = normalizeBoard(JSON.parse(val)); if (selectedCardId && !findCard(selectedCardId)) selectedCardId = null; renderBoard(); renderPanel(); if (autosave) autosave(); syncHist(); } });

    $('#kb-addcol', root).addEventListener('click', () => addColumn());
    $('#kb-sample', root).addEventListener('click', () => applyBoard(SAMPLE_BOARD()));
    $('#kb-empty-sample', root).addEventListener('click', () => applyBoard(SAMPLE_BOARD()));
    $('#kb-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#kb-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });
    refs.search.addEventListener('input', () => { query = refs.search.value; renderBoard(); });
    $('#kb-exp-json', root).addEventListener('click', exportJSON);
    $('#kb-exp-md', root).addEventListener('click', exportMD);
    $('#kb-proj-save', root).addEventListener('click', saveProject);

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) syncHist();
    });

    loadBoard();
    loadProjects();

    return () => { alive = false; };
  }

  function unmount() {
    if (drag) { if (drag.ghost) drag.ghost.remove(); if (drag.ph) drag.ph.remove(); window.removeEventListener('pointermove', onDragMove); window.removeEventListener('pointerup', onDragUp); drag = null; }
    alive = false; hist = null; autosave = null; refs = {};
    board = null; selectedCardId = null; query = '';
  }

  const def = {
    id: 'kanban', cat: 'productivity', icon: 'layers', version: '0.1.0',
    name: { en: 'Kanban Board', pt: 'Quadro Kanban' },
    tagline: {
      en: 'A local-first task board. Columns and cards you drag between them, inline editing, undo/redo of the whole board, autosave and session restore in IndexedDB, named projects, search and export to JSON or Markdown. Everything stays on your device and runs offline.',
      pt: 'Um quadro de tarefas local-first. Colunas e cartões que você arrasta entre elas, edição inline, desfazer/refazer do quadro inteiro, salvamento automático e restauração da sessão no IndexedDB, projetos nomeados, busca e exportação para JSON ou Markdown. Tudo fica no seu dispositivo e roda offline.'
    },
    tags: ['kanban', 'board', 'tasks', 'productivity', 'pwa'],
    deps: [],
    docs: {
      en: {
        summary: 'A drag-and-drop Kanban board: add columns and cards, drag cards between columns and reorder them, edit each card (title, description, tags, done) in a side panel, undo/redo the whole board, autosave to IndexedDB, reopen named projects, filter by search, and export the board as JSON or Markdown.',
        usage: 'Add a column, then add cards to it. Drag a card onto another column or to a new position — a placeholder shows where it will land. Click a card to edit it in the right panel; the checkbox marks it done. Use Undo/Redo to step through changes, Save to store a named project, and Export JSON or Export Markdown to take the board with you. Search dims cards that do not match.',
        privacy: 'The board is stored on-device (IndexedDB autosave + named projects) and never uploaded. All card and column text is rendered from a plain data model with HTML escaping — there is no eval, no raw-HTML passthrough and no network requests.',
        limits: 'One active board at a time (named projects let you keep several). Drag uses pointer events, so it works with mouse, touch and pen; it is disabled on the card’s own buttons and inputs so you can still click them. Undo history is in-memory only and resets when you leave the tool.'
      },
      pt: {
        summary: 'Um quadro Kanban de arrastar-e-soltar: adicione colunas e cartões, arraste cartões entre colunas e reordene-os, edite cada cartão (título, descrição, tags, concluído) num painel lateral, desfaça/refaça o quadro inteiro, salve automaticamente no IndexedDB, reabra projetos nomeados, filtre pela busca e exporte o quadro como JSON ou Markdown.',
        usage: 'Adicione uma coluna e depois cartões a ela. Arraste um cartão para outra coluna ou para uma nova posição — um espaço reservado mostra onde ele vai cair. Clique num cartão para editá-lo no painel da direita; a caixa o marca como concluído. Use Desfazer/Refazer para percorrer mudanças, Salvar para guardar um projeto nomeado e Exportar JSON ou Exportar Markdown para levar o quadro. A busca esmaece os cartões que não correspondem.',
        privacy: 'O quadro é armazenado no dispositivo (autosave no IndexedDB + projetos nomeados) e nunca é enviado. Todo texto de cartão e coluna é renderizado a partir de um modelo de dados puro com escape de HTML — não há eval, não há passagem de HTML bruto e não há requisições de rede.',
        limits: 'Um quadro ativo por vez (projetos nomeados permitem manter vários). O arraste usa eventos de ponteiro, então funciona com mouse, toque e caneta; fica desativado nos botões e campos do próprio cartão para que você ainda possa clicá-los. O histórico de desfazer é só em memória e é reiniciado ao sair da ferramenta.'
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'kb.boardDefault': 'My board', 'kb.addCol': 'Add column', 'kb.sample': 'Sample',
      'kb.col.todo': 'To do', 'kb.col.doing': 'In progress', 'kb.col.done': 'Done', 'kb.col.new': 'New column',
      'kb.colTitle': 'Column title', 'kb.moveLeft': 'Move left', 'kb.moveRight': 'Move right',
      'kb.del': 'Delete', 'kb.delCol': 'Delete column', 'kb.delColQ': 'Delete column "{name}" and all its cards? This cannot be undone.',
      'kb.addCard': 'Add card', 'kb.newCardPh': 'Card title… (Enter to add, Shift+Enter for a new line)', 'kb.emptyCol': 'No cards',
      'kb.emptyTitle': 'An empty board is still a board', 'kb.emptyBody': 'Add a column, or open the sample board to see how cards move across a workflow.',
      'kb.emptyCta': 'Open the sample', 'kb.emptyUndo': 'undo · dragging a card is an edit',
      'kb.delCard': 'Delete card', 'kb.toggleDone': 'Done', 'kb.cardTitle': 'Title', 'kb.cardDesc': 'Description', 'kb.cardTags': 'Tags (comma separated)',
      'kb.cardEditor': 'Card editor', 'kb.panelEmpty': 'Select a card to edit it.', 'kb.projects': 'Projects', 'kb.save': 'Save',
      'kb.projNamePh': 'Project name', 'kb.open': 'Open', 'kb.noProjects': 'No saved projects yet.', 'kb.untitled': 'Untitled',
      'kb.searchPh': 'Search cards…', 'kb.exportJson': 'Export JSON', 'kb.exportMd': 'Export Markdown',
      'kb.exportedJson': 'Board exported as JSON', 'kb.exportedMd': 'Board exported as Markdown',
      'kb.projSaved': 'Project "{name}" saved', 'kb.projOpened': 'Project "{name}" opened',
      'kb.dbUnavailable': 'Local storage unavailable — the board cannot be saved.', 'kb.dbError': 'Could not reach local storage.',
      'kb.privacy': 'Your board stays on this device (IndexedDB). Card text is escaped and rendered from a data model — no eval, no raw HTML, nothing uploaded.',
      'kb.s.c1': 'Design the empty state', 'kb.s.c1d': 'Show a friendly hint when a column has no cards.',
      'kb.s.c2': 'Write the docs', 'kb.s.c3': 'Wire pointer drag', 'kb.s.c3d': 'Move cards between columns with a drop placeholder.',
      'kb.s.c4': 'Store locally'
    },
    pt: {
      'kb.boardDefault': 'Meu quadro', 'kb.addCol': 'Adicionar coluna', 'kb.sample': 'Exemplo',
      'kb.col.todo': 'A fazer', 'kb.col.doing': 'Em progresso', 'kb.col.done': 'Concluído', 'kb.col.new': 'Nova coluna',
      'kb.colTitle': 'Título da coluna', 'kb.moveLeft': 'Mover para a esquerda', 'kb.moveRight': 'Mover para a direita',
      'kb.del': 'Excluir', 'kb.delCol': 'Excluir coluna', 'kb.delColQ': 'Excluir a coluna "{name}" e todos os seus cartões? Isso não pode ser desfeito.',
      'kb.addCard': 'Adicionar cartão', 'kb.newCardPh': 'Título do cartão… (Enter para adicionar, Shift+Enter para nova linha)', 'kb.emptyCol': 'Sem cartões',
      'kb.emptyTitle': 'Um quadro vazio ainda é um quadro', 'kb.emptyBody': 'Adicione uma coluna ou abra o quadro de exemplo para ver os cartões atravessarem o fluxo.',
      'kb.emptyCta': 'Abrir o exemplo', 'kb.emptyUndo': 'desfazer · arrastar um cartão é uma edição',
      'kb.delCard': 'Excluir cartão', 'kb.toggleDone': 'Concluído', 'kb.cardTitle': 'Título', 'kb.cardDesc': 'Descrição', 'kb.cardTags': 'Tags (separadas por vírgula)',
      'kb.cardEditor': 'Editor do cartão', 'kb.panelEmpty': 'Selecione um cartão para editá-lo.', 'kb.projects': 'Projetos', 'kb.save': 'Salvar',
      'kb.projNamePh': 'Nome do projeto', 'kb.open': 'Abrir', 'kb.noProjects': 'Nenhum projeto salvo ainda.', 'kb.untitled': 'Sem nome',
      'kb.searchPh': 'Buscar cartões…', 'kb.exportJson': 'Exportar JSON', 'kb.exportMd': 'Exportar Markdown',
      'kb.exportedJson': 'Quadro exportado como JSON', 'kb.exportedMd': 'Quadro exportado como Markdown',
      'kb.projSaved': 'Projeto "{name}" salvo', 'kb.projOpened': 'Projeto "{name}" aberto',
      'kb.dbUnavailable': 'Armazenamento local indisponível — o quadro não pode ser salvo.', 'kb.dbError': 'Não foi possível acessar o armazenamento local.',
      'kb.privacy': 'Seu quadro fica neste dispositivo (IndexedDB). O texto dos cartões é escapado e renderizado de um modelo de dados — sem eval, sem HTML bruto, nada enviado.',
      'kb.s.c1': 'Desenhar o estado vazio', 'kb.s.c1d': 'Mostrar uma dica amigável quando a coluna não tem cartões.',
      'kb.s.c2': 'Escrever a documentação', 'kb.s.c3': 'Conectar o arraste por ponteiro', 'kb.s.c3d': 'Mover cartões entre colunas com um espaço reservado.',
      'kb.s.c4': 'Armazenar localmente'
    }
  });

  VT.registry.add(def);
  return def;
})();
