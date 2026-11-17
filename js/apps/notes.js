window.VT = window.VT || {};

/* U15 · Notes Workspace — a local-first Markdown notes bench. Keep many named notes in IndexedDB,
 * write them in Markdown and see a safe live preview (escape-all-then-format, only http/https/mailto/#
 * link protocols, no raw HTML, no eval). Search and filter by tag, undo/redo the body, autosave every
 * note, restore your session, and export a note as .md or copy its Markdown / rendered HTML.
 * Nothing leaves the browser; it runs fully offline.
 */
VT.modules['notes'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'notes';
  const TOOL = 'notes';

  let alive = false;
  let refs = {};
  let hist = null;
  let saveTimer = null;
  let dirty = false;
  let notes = [];
  let currentId = null;
  let mode = 'split';
  let query = '';
  let tagFilter = null;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function current() { return notes.find((n) => n.id === currentId) || null; }

  // ---------- safe Markdown ----------
  const safeUrl = (u) => { const s = (u || '').trim(); return /^(https?:|mailto:|#)/i.test(s) ? s : null; };

  function inline(raw) {
    const codes = [];
    let s = raw.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return '@@C' + (codes.length - 1) + '@@'; });
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, (m, alt, arg) => {
      const url = arg.trim().split(/\s+/)[0];
      const u = safeUrl(url);
      return u ? '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + (alt || u) + '</a>' : alt;
    });
    s = s.replace(/\[([^\]]+)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, (m, txt, arg) => {
      const u = safeUrl(arg.trim().split(/\s+/)[0]);
      return u ? '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + txt + '</a>' : txt;
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/_([^_]+)_/g, '<em>$1</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    s = s.replace(/@@C(\d+)@@/g, (m, i) => '<code>' + esc(codes[+i]) + '</code>');
    return s;
  }
  const listLine = (l) => /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(l);

  function buildList(items) {
    const ordered = items[0].ordered;
    let html = ordered ? '<ol>' : '<ul>';
    let i = 0;
    while (i < items.length) {
      const it = items[i];
      let j = i + 1; const kids = [];
      while (j < items.length && items[j].indent > it.indent) { kids.push(items[j]); j++; }
      html += '<li>' + inline(it.text) + (kids.length ? buildList(kids) : '') + '</li>';
      i = j;
    }
    return html + (ordered ? '</ol>' : '</ul>');
  }

  function md(src) {
    const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let i = 0, m;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*$/.test(line)) { i++; continue; }
      m = line.match(/^```(.*)$/);
      if (m) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; } i++; out.push('<pre class="nt-pre"><code>' + esc(buf.join('\n')) + '</code></pre>'); continue; }
      m = line.match(/^(#{1,6})\s+(.*)$/);
      if (m) { const n = m[1].length; out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>'); i++; continue; }
      if (/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
      if (/^\s*>/.test(line)) { const buf = []; while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; } out.push('<blockquote>' + md(buf.join('\n')) + '</blockquote>'); continue; }
      m = listLine(line);
      if (m) { const items = []; while (i < lines.length) { const lm = listLine(lines[i]); if (!lm) break; items.push({ indent: lm[1].length, ordered: /^\d+\./.test(lm[2]), text: lm[3] }); i++; } out.push(buildList(items)); continue; }
      const buf = [line]; i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|```|\s*>)/.test(lines[i]) && !listLine(lines[i]) && !/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      out.push('<p>' + buf.map(inline).join('<br>') + '</p>');
    }
    return out.join('\n');
  }

  // ---------- rendering ----------
  function allTags() {
    const set = new Set();
    notes.forEach((n) => (n.tags || []).forEach((tag) => set.add(tag)));
    return [...set].sort();
  }

  function renderTags() {
    if (!refs.tagbar) return;
    refs.tagbar.innerHTML = '';
    const tags = allTags();
    if (!tags.length) return;
    tags.forEach((tag) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'nt-tag' + (tagFilter === tag ? ' is-on' : ''); b.textContent = tag;
      b.addEventListener('click', () => { tagFilter = tagFilter === tag ? null : tag; renderTags(); renderSidebar(); });
      refs.tagbar.append(b);
    });
  }

  function snippet(body) {
    return String(body || '').replace(/[#>*`_~\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function renderSidebar() {
    if (!refs.list) return;
    refs.list.innerHTML = '';
    const q = query.toLowerCase();
    const rows = notes.filter((n) => {
      if (tagFilter && !(n.tags || []).includes(tagFilter)) return false;
      if (!q) return true;
      return (n.title || '').toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q) || (n.tags || []).some((tg) => tg.toLowerCase().includes(q));
    });
    if (!rows.length) { refs.list.innerHTML = '<div class="bench-empty nt-empty">' + esc(notes.length ? t('nt.noMatch') : t('nt.listEmpty')) + '</div>'; return; }
    rows.forEach((n) => {
      const row = document.createElement('div'); row.className = 'nt-row' + (n.id === currentId ? ' is-sel' : '');
      const main = document.createElement('div'); main.className = 'nt-row-main';
      const ti = document.createElement('strong'); ti.textContent = n.title || t('nt.untitled');
      const sn = document.createElement('span'); sn.textContent = snippet(n.body) || t('nt.blank');
      const meta = document.createElement('span'); meta.className = 'nt-row-meta'; meta.textContent = new Date(n.updatedAt).toLocaleString();
      main.append(ti, sn, meta);
      const del = document.createElement('button'); del.type = 'button'; del.className = 'btn btn-ghost btn-sm nt-del'; del.textContent = '×'; del.title = t('nt.del');
      del.addEventListener('click', (e) => { e.stopPropagation(); removeNote(n.id, n.title); });
      row.append(main, del);
      row.addEventListener('click', () => openNote(n.id));
      refs.list.append(row);
    });
  }

  function renderPreview() {
    if (!refs.preview) return;
    const n = current();
    if (!n || !n.body) { refs.preview.innerHTML = '<p class="bench-empty nt-empty">' + esc(t('nt.previewEmpty')) + '</p>'; return; }
    refs.preview.innerHTML = md(n.body);
  }

  function updateCounts() {
    if (!refs.counts) return;
    const n = current(); const body = (n && n.body) || '';
    const words = body.trim() ? body.trim().split(/\s+/).length : 0;
    refs.counts.textContent = t('nt.counts', { w: words, c: body.length, l: body.split('\n').length });
  }

  function applyMode() {
    if (!refs.editorPane || !refs.previewPane) return;
    refs.stage.dataset.mode = mode;
    refs.editorPane.hidden = mode === 'preview';
    refs.previewPane.hidden = mode === 'write';
    $$('.nt-mode .btn', refs.stage).forEach((b) => b.classList.toggle('is-on', b.dataset.mode === mode));
  }

  // ---------- note ops ----------
  function openNote(id) {
    if (id !== currentId) flushSave();
    const n = notes.find((x) => x.id === id); if (!n) return;
    currentId = id;
    if (refs.title) refs.title.value = n.title || '';
    if (refs.tags) refs.tags.value = (n.tags || []).join(', ');
    if (refs.body) refs.body.value = n.body || '';
    renderPreview(); updateCounts();
    if (hist) hist.reset(n.body || ''); syncHist();
    renderSidebar();
    persistSession();
  }

  function newNote() {
    if (!VT.db.available) { toast(t('nt.dbUnavailable'), 'error'); return; }
    flushSave();
    const n = { id: VT.db.uid(), tool: TOOL, title: '', body: '', tags: [], createdAt: Date.now(), updatedAt: Date.now() };
    VT.db.put(n).then((rec) => {
      notes.unshift(rec);
      renderTags(); openNote(rec.id);
      if (refs.title) refs.title.focus();
      toast(t('nt.created'), 'success');
    }).catch(() => toast(t('nt.dbError'), 'error'));
  }

  function saveCurrent() {
    const n = current(); if (!n || !VT.db.available) return;
    n.updatedAt = Date.now();
    VT.db.put(n).then((rec) => {
      const i = notes.findIndex((x) => x.id === rec.id); if (i >= 0) notes[i] = rec;
      renderSidebar();
    }).catch(() => {});
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { saveTimer = null; dirty = false; if (alive) saveCurrent(); }, 600);
  }
  function touch() { dirty = true; scheduleSave(); }
  function flushSave() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (dirty) { dirty = false; saveCurrent(); }
  }

  function removeNote(id, title) {
    VT.ui.confirm({ title: t('nt.del'), body: t('nt.delQ', { name: title || t('nt.untitled') }), confirmLabel: t('nt.del'), danger: true }).then((yes) => {
      if (!yes) return;
      VT.db.remove(id).then(() => {
        notes = notes.filter((x) => x.id !== id);
        if (currentId === id) { if (notes[0]) openNote(notes[0].id); else { currentId = null; if (refs.title) refs.title.value = ''; if (refs.tags) refs.tags.value = ''; if (refs.body) refs.body.value = ''; renderPreview(); updateCounts(); } }
        renderTags(); renderSidebar();
        toast(t('nt.deleted'), 'success');
      }).catch(() => toast(t('nt.dbError'), 'error'));
    });
  }

  function onEdit() {
    const n = current(); if (!n) return;
    n.title = refs.title.value;
    n.tags = refs.tags.value.split(',').map((s) => s.trim()).filter(Boolean);
    n.body = refs.body.value;
    renderPreview(); updateCounts(); renderSidebar(); renderTags();
    hist.record(n.body); syncHist();
    touch();
  }

  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }

  // ---------- export ----------
  function exportMd() {
    const n = current(); if (!n) { toast(t('nt.noNote'), 'error'); return; }
    U.downloadText(n.body || '', (n.title || 'note').replace(/[^\w-]+/g, '_').slice(0, 60) + '.md', 'text/markdown');
    toast(t('nt.exportedMd'), 'success');
  }
  async function copyMd() { const n = current(); if (!n) return; const ok = await U.copyText(n.body || ''); toast(ok ? t('nt.copiedMd') : t('nt.copyFail'), ok ? 'success' : 'error'); }
  async function copyHtml() { const n = current(); if (!n) return; const ok = await U.copyText(md(n.body || '')); toast(ok ? t('nt.copiedHtml') : t('nt.copyFail'), ok ? 'success' : 'error'); }

  function persistSession() { VT.store.set(KEY, { currentId, mode }); }

  // ---------- persistence ----------
  function loadNotes() {
    if (!VT.db.available) { refs.list.innerHTML = '<div class="bench-empty nt-empty">' + esc(t('nt.dbUnavailable')) + '</div>'; return Promise.resolve(); }
    return VT.db.list(TOOL).then((rows) => {
      notes = rows;
      renderTags(); renderSidebar();
      const s = VT.store.get(KEY, null);
      if (s && ['write', 'split', 'preview'].includes(s.mode)) mode = s.mode;
      const wanted = s && s.currentId && notes.find((n) => n.id === s.currentId);
      const target = wanted || notes[0];
      if (target) openNote(target.id); else { refs.body.value = ''; renderPreview(); updateCounts(); }
      applyMode();
    }).catch(() => { refs.list.innerHTML = '<div class="bench-empty nt-empty">' + esc(t('nt.dbError')) + '</div>'; });
  }

  function mount(root) {
    alive = true;
    const I = VT.icons;

    root.innerHTML = `
      <div class="nt-stage glass-2" id="nt-stage" data-mode="split">
        <div class="nt-bar bench">
          <span class="bench-rail-group">
            <button class="btn btn-primary btn-sm" id="nt-new">${I.file} ${t('nt.new')}</button>
          </span>
          <span class="bench-sep" aria-hidden="true"></span>
          <span class="nt-mode bench-rail-group" role="group" aria-label="${t('nt.mode')}">
            <button class="btn btn-ghost btn-sm" data-mode="write">${t('nt.mode.write')}</button>
            <button class="btn btn-ghost btn-sm" data-mode="split">${t('nt.mode.split')}</button>
            <button class="btn btn-ghost btn-sm" data-mode="preview">${t('nt.mode.preview')}</button>
          </span>
          <span class="bench-sep" aria-hidden="true"></span>
          <span class="bench-rail-group">
            <button class="btn btn-ghost btn-sm" id="nt-undo" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
            <button class="btn btn-ghost btn-sm" id="nt-redo" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
          </span>
          <span class="nt-bar-actions">
            <button class="btn btn-ghost btn-sm" id="nt-copy-md">${I.copy} ${t('nt.copyMd')}</button>
            <button class="btn btn-ghost btn-sm" id="nt-copy-html">${I.code} ${t('nt.copyHtml')}</button>
            <button class="btn btn-primary btn-sm" id="nt-export">${I.download} ${t('nt.export')}</button>
          </span>
        </div>
        <div class="nt-hint" id="nt-hint" role="status" aria-live="polite"></div>

        <div class="nt-work">
          <aside class="nt-side bench">
            <input class="input" id="nt-search" type="search" placeholder="${t('nt.searchPh')}" aria-label="${t('nt.searchPh')}">
            <div class="nt-tagbar" id="nt-tagbar"></div>
            <h3 class="bench-sec-head">${t('nt.list')}</h3>
            <div class="bench-list nt-list" id="nt-list" aria-label="${t('nt.list')}"></div>
          </aside>

          <section class="nt-editor-pane mat" id="nt-editor-pane" aria-label="${t('nt.editor')}">
            <div class="nt-sheet mat-sheet">
              <input class="input nt-title" id="nt-title" type="text" placeholder="${t('nt.titlePh')}" aria-label="${t('nt.titlePh')}">
              <input class="input nt-tags" id="nt-tags" type="text" placeholder="${t('nt.tagsPh')}" aria-label="${t('nt.tagsPh')}">
              <textarea class="input nt-body" id="nt-body" placeholder="${t('nt.bodyPh')}" aria-label="${t('nt.bodyPh')}"></textarea>
            </div>
            <div class="nt-counts" id="nt-counts"></div>
          </section>

          <section class="nt-preview-pane mat" id="nt-preview-pane" aria-label="${t('nt.preview')}">
            <div class="nt-sheet mat-sheet">
              <div class="nt-preview md-body" id="nt-preview"></div>
            </div>
          </section>
        </div>

        <p class="privacy-line">${I.shield} ${t('nt.privacy')}</p>
      </div>`;

    refs = {
      stage: $('#nt-stage', root), list: $('#nt-list', root), search: $('#nt-search', root), tagbar: $('#nt-tagbar', root),
      editorPane: $('#nt-editor-pane', root), previewPane: $('#nt-preview-pane', root), preview: $('#nt-preview', root),
      title: $('#nt-title', root), tags: $('#nt-tags', root), body: $('#nt-body', root), counts: $('#nt-counts', root),
      undo: $('#nt-undo', root), redo: $('#nt-redo', root), hint: $('#nt-hint', root)
    };

    hist = VT.history.create({
      apply: (val) => {
        const n = current(); if (!n) return;
        n.body = val || '';
        refs.body.value = n.body;
        renderPreview(); updateCounts(); renderSidebar();
        touch();
      }
    });

    refs.body.addEventListener('input', onEdit);
    refs.title.addEventListener('input', onEdit);
    refs.tags.addEventListener('input', onEdit);
    refs.search.addEventListener('input', () => { query = refs.search.value; renderSidebar(); });

    $('#nt-new', root).addEventListener('click', () => newNote());
    $('#nt-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#nt-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });
    $('#nt-copy-md', root).addEventListener('click', () => copyMd());
    $('#nt-copy-html', root).addEventListener('click', () => copyHtml());
    $('#nt-export', root).addEventListener('click', () => exportMd());
    $$('.nt-mode .btn', root).forEach((b) => b.addEventListener('click', () => { mode = b.dataset.mode; applyMode(); persistSession(); }));

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) syncHist();
    });

    loadNotes();

    return () => { flushSave(); alive = false; };
  }

  function unmount() {
    flushSave();
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    dirty = false;
    alive = false; hist = null; refs = {};
    notes = []; currentId = null; query = ''; tagFilter = null; mode = 'split';
  }

  const def = {
    id: 'notes', cat: 'productivity', icon: 'target', version: '0.1.0',
    name: { en: 'Notes Workspace', pt: 'Bancada de Notas' },
    tagline: {
      en: 'A local-first Markdown notes bench. Keep many named notes in IndexedDB, write them in Markdown with a safe live preview, search and filter by tag, undo/redo the body, autosave every note, and export a note as .md or copy its Markdown or rendered HTML. Deterministic, local, offline.',
      pt: 'Uma bancada de notas Markdown local-first. Guarde muitas notas nomeadas no IndexedDB, escreva-as em Markdown com uma prévia segura ao vivo, busque e filtre por tag, desfaça/refaça o corpo, salve cada nota automaticamente e exporte uma nota como .md ou copie seu Markdown ou HTML renderizado. Determinístico, local, offline.'
    },
    tags: ['notes', 'markdown', 'writing', 'productivity', 'pwa'],
    deps: [],
    docs: {
      en: {
        summary: 'A Markdown notes workspace: many named notes stored in IndexedDB, a split editor/preview, tag filtering, full-text search, undo/redo over the body, autosave and session restore, and export to .md or copy as Markdown / rendered HTML.',
        usage: 'Click New note, give it a title and optional comma-separated tags, and write Markdown in the editor — the preview renders live. Switch Write / Split / Preview, search notes or click a tag to filter, undo/redo the body, and Copy Markdown, Copy HTML or Export .md. Everything autosaves and your last note reopens when you return.',
        privacy: 'Notes are stored on-device via IndexedDB and never uploaded. The preview renders Markdown through an escape-all-then-format pipeline: all text is HTML-escaped first, raw HTML is not passed through, and only http/https/mailto/# link protocols are kept (javascript: and others become plain text). No eval, no scripts.',
        limits: 'Supports a solid Markdown subset (headings, bold/italic/strike, inline and fenced code, links, ordered/unordered lists, blockquotes, horizontal rules, paragraphs). It is a notes bench, not a static-site generator; images from remote URLs are rendered as safe links rather than embedded to keep the preview network-free.'
      },
      pt: {
        summary: 'Uma bancada de notas Markdown: muitas notas nomeadas armazenadas no IndexedDB, editor/prévia divididos, filtro por tags, busca de texto completo, desfazer/refazer do corpo, salvamento automático e restauração da sessão, além de exportação para .md ou cópia como Markdown / HTML renderizado.',
        usage: 'Clique em Nova nota, dê um título e tags opcionais separadas por vírgula, e escreva Markdown no editor — a prévia renderiza ao vivo. Alterne Escrita / Dividido / Prévia, busque notas ou clique numa tag para filtrar, desfaça/refaça o corpo, e Copie Markdown, Copie HTML ou Exporte .md. Tudo é salvo automaticamente e sua última nota reabre quando você volta.',
        privacy: 'As notas ficam no dispositivo via IndexedDB e nunca são enviadas. A prévia renderiza Markdown por um fluxo de escapar-tudo-antes-de-formatar: todo texto é escapado em HTML primeiro, HTML bruto não passa, e apenas protocolos de link http/https/mailto/# são mantidos (javascript: e outros viram texto puro). Sem eval, sem scripts.',
        limits: 'Suporta um subconjunto sólido de Markdown (títulos, negrito/itálico/tachado, código inline e em bloco, links, listas ordenadas/não ordenadas, citações, linhas horizontais, parágrafos). É uma bancada de notas, não um gerador de sites estáticos; imagens de URLs remotas são renderizadas como links seguros em vez de embutidas, para manter a prévia sem rede.'
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'nt.new': 'New note', 'nt.mode': 'View', 'nt.mode.write': 'Write', 'nt.mode.split': 'Split', 'nt.mode.preview': 'Preview',
      'nt.copyMd': 'Copy MD', 'nt.copyHtml': 'Copy HTML', 'nt.export': 'Export .md',
      'nt.searchPh': 'Search notes…', 'nt.list': 'Notes', 'nt.editor': 'Editor', 'nt.preview': 'Preview',
      'nt.titlePh': 'Note title', 'nt.tagsPh': 'tags, comma, separated', 'nt.bodyPh': 'Write Markdown here…',
      'nt.counts': '{w} words · {c} chars · {l} lines', 'nt.untitled': 'Untitled note', 'nt.blank': 'Blank note',
      'nt.noMatch': 'No notes match.', 'nt.listEmpty': 'No notes yet — create one.', 'nt.previewEmpty': 'Nothing to preview yet.',
      'nt.del': 'Delete', 'nt.delQ': 'Delete "{name}"? This cannot be undone.', 'nt.deleted': 'Note deleted',
      'nt.created': 'New note created', 'nt.noNote': 'No note selected.',
      'nt.exportedMd': 'Note exported as .md', 'nt.copiedMd': 'Markdown copied', 'nt.copiedHtml': 'HTML copied', 'nt.copyFail': 'Could not copy.',
      'nt.dbUnavailable': 'Local storage unavailable — notes cannot be saved.', 'nt.dbError': 'Could not reach local storage.',
      'nt.privacy': 'Notes stay on your device via IndexedDB. The preview escapes all text, blocks raw HTML and keeps only safe link protocols — no scripts, no eval, and nothing is ever uploaded.'
    },
    pt: {
      'nt.new': 'Nova nota', 'nt.mode': 'Visão', 'nt.mode.write': 'Escrita', 'nt.mode.split': 'Dividido', 'nt.mode.preview': 'Prévia',
      'nt.copyMd': 'Copiar MD', 'nt.copyHtml': 'Copiar HTML', 'nt.export': 'Exportar .md',
      'nt.searchPh': 'Buscar notas…', 'nt.list': 'Notas', 'nt.editor': 'Editor', 'nt.preview': 'Prévia',
      'nt.titlePh': 'Título da nota', 'nt.tagsPh': 'tags, separadas, por vírgula', 'nt.bodyPh': 'Escreva Markdown aqui…',
      'nt.counts': '{w} palavras · {c} caracteres · {l} linhas', 'nt.untitled': 'Nota sem nome', 'nt.blank': 'Nota em branco',
      'nt.noMatch': 'Nenhuma nota corresponde.', 'nt.listEmpty': 'Nenhuma nota ainda — crie uma.', 'nt.previewEmpty': 'Nada para pré-visualizar ainda.',
      'nt.del': 'Excluir', 'nt.delQ': 'Excluir "{name}"? Isso não pode ser desfeito.', 'nt.deleted': 'Nota excluída',
      'nt.created': 'Nova nota criada', 'nt.noNote': 'Nenhuma nota selecionada.',
      'nt.exportedMd': 'Nota exportada como .md', 'nt.copiedMd': 'Markdown copiado', 'nt.copiedHtml': 'HTML copiado', 'nt.copyFail': 'Não foi possível copiar.',
      'nt.dbUnavailable': 'Armazenamento local indisponível — notas não podem ser salvas.', 'nt.dbError': 'Não foi possível acessar o armazenamento local.',
      'nt.privacy': 'As notas ficam no seu dispositivo via IndexedDB. A prévia escapa todo texto, bloqueia HTML bruto e mantém apenas protocolos de link seguros — sem scripts, sem eval, e nada é enviado.'
    }
  });

  VT.registry.add(def);
  return def;
})();
