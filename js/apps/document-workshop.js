window.VT = window.VT || {};

/* U17 · Document Workshop — a local-first, print-ready document authoring bench (fills the Documents category).
 * Write a document as an ordered list of sections, each a block of safe Markdown, with a cover header (title,
 * author, date), an auto table of contents, and a live preview you can export as a standalone printable HTML or
 * plain Markdown, or print straight from the browser. Undo/redo the whole document, autosave to IndexedDB and
 * reopen named projects. Every user string is HTML-escaped and rendered from a plain data model — no eval, no raw
 * HTML, nothing uploaded; it runs fully offline.
 */
VT.modules['document-workshop'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'document-workshop';
  const TOOL = 'document-workshop';
  const AUTOSAVE_ID = 'document-workshop:autosave';
  const LEGACY_AUTOSAVE_ID = 'dw:autosave';

  let alive = false;
  let refs = {};
  let hist = null;
  let autosave = null;
  let doc = null;
  let mode = 'split';
  let saveTimer = null;

  const uid = () => VT.db.uid();

  function DEFAULT_DOC() {
    return {
      meta: { title: t('dw.docDefault'), author: '', date: new Date().toISOString().slice(0, 10), theme: 'serif', size: 100 },
      sections: [{ id: uid(), heading: t('dw.sec1'), body: t('dw.sec1body') }]
    };
  }
  function SAMPLE_DOC() {
    return {
      meta: { title: t('dw.sampleTitle'), author: t('dw.sampleAuthor'), date: new Date().toISOString().slice(0, 10), theme: 'serif', size: 100 },
      sections: [
        { id: uid(), heading: t('dw.sampleH1'), body: t('dw.sampleB1') },
        { id: uid(), heading: t('dw.sampleH2'), body: t('dw.sampleB2') },
        { id: uid(), heading: t('dw.sampleH3'), body: t('dw.sampleB3') }
      ]
    };
  }
  function normalizeDoc(d) {
    const x = d && typeof d === 'object' ? d : {};
    const m = x.meta && typeof x.meta === 'object' ? x.meta : {};
    const sections = Array.isArray(x.sections) ? x.sections.map((s) => ({
      id: (s && s.id) || uid(),
      heading: s && typeof s.heading === 'string' ? s.heading : '',
      body: s && typeof s.body === 'string' ? s.body : ''
    })) : [];
    return {
      meta: {
        title: typeof m.title === 'string' ? m.title : t('dw.docDefault'),
        author: typeof m.author === 'string' ? m.author : '',
        date: typeof m.date === 'string' ? m.date : '',
        theme: m.theme === 'sans' ? 'sans' : 'serif',
        size: Math.max(80, Math.min(160, Number(m.size) || 100))
      },
      sections
    };
  }

  // ---------- safe markdown (escape-all-then-format; mirrors the Notes Workspace guarantees) ----------
  function safeUrl(u) {
    const s = (u || '').trim();
    return /^(https?:|mailto:|#)/i.test(s) ? s : '';
  }
  function inline(src) {
    const codes = [];
    let s = (src || '').replace(/`([^`]+)`/g, (_m, c) => { codes.push(c); return 'ZZCODE' + (codes.length - 1) + 'ZZ'; });
    s = esc(s);
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, url) => {
      const u = safeUrl(url);
      return u ? '<a href="' + esc(u) + '" rel="noopener noreferrer" target="_blank">' + txt + '</a>' : txt;
    });
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    s = s.replace(/ZZCODE(\d+)ZZ/g, (m, i) => '<code>' + esc(codes[+i]) + '</code>');
    return s;
  }
  function mdToHtml(src) {
    const lines = (src || '').replace(/\r\n?/g, '\n').split('\n');
    let out = '', para = [], i = 0;
    const flushPara = () => { if (para.length) { out += '<p>' + inline(para.join(' ')) + '</p>'; para = []; } };
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*```/.test(line)) {
        flushPara();
        const buf = []; i++;
        while (i < lines.length && !/^\s*```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out += '<pre class="dwc-pre"><code>' + esc(buf.join('\n')) + '</code></pre>';
        continue;
      }
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) { flushPara(); const lvl = Math.min(6, h[1].length + 2); out += '<h' + lvl + '>' + inline(h[2]) + '</h' + lvl + '>'; i++; continue; }
      if (/^\s*([-*_])\s*\1\s*\1[\s\-*_]*$/.test(line)) { flushPara(); out += '<hr>'; i++; continue; }
      if (/^\s*>/.test(line)) {
        flushPara(); const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out += '<blockquote>' + mdToHtml(buf.join('\n')) + '</blockquote>';
        continue;
      }
      const li = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
      if (li) {
        flushPara();
        const ordered = /\d/.test(li[2]);
        const items = [];
        while (i < lines.length) {
          const m2 = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
          if (!m2) break;
          let txt = m2[3]; let task = '';
          const tk = txt.match(/^\[([ xX])\]\s+(.*)$/);
          if (tk) { const done = tk[1].toLowerCase() === 'x'; task = ' class="dwc-task"' + (done ? ' data-done="1"' : ''); items.push('<li' + task + '><span class="dwc-cb' + (done ? ' on' : '') + '"></span> ' + inline(tk[2]) + '</li>'); }
          else { items.push('<li>' + inline(txt) + '</li>'); }
          i++;
        }
        out += (ordered ? '<ol>' : '<ul>') + items.join('') + (ordered ? '</ol>' : '</ul>');
        continue;
      }
      if (line.trim() === '') { flushPara(); i++; continue; }
      para.push(line.trim()); i++;
    }
    flushPara();
    return out;
  }

  // ---------- rendering ----------
  function sectionHeading(s) { return (s.heading || '').trim() || t('dw.untitledSection'); }
  function buildTOC() {
    if (doc.sections.length < 2) return '';
    const items = doc.sections.map((s) => '<li><a href="#dwc-sec-' + esc(s.id) + '">' + esc(sectionHeading(s)) + '</a></li>').join('');
    return '<nav class="dwc-toc"><h2>' + esc(t('dw.toc')) + '</h2><ol>' + items + '</ol></nav>';
  }
  function documentInner() {
    const m = doc.meta;
    let out = '<header class="dwc-cover"><h1>' + esc(m.title || t('dw.untitled')) + '</h1>';
    const byline = [m.author, m.date].filter(Boolean).map(esc).join(' <span class="dwc-dot">·</span> ');
    if (byline) out += '<p class="dwc-byline">' + byline + '</p>';
    out += '</header>';
    out += buildTOC();
    if (!doc.sections.length) out += '<p class="bench-empty dwc-empty">' + esc(t('dw.noSections')) + '</p>';
    doc.sections.forEach((s) => {
      out += '<section id="dwc-sec-' + esc(s.id) + '"><h2 class="dwc-sec-h">' + esc(sectionHeading(s)) + '</h2><div class="dwc-body">' + mdToHtml(s.body) + '</div></section>';
    });
    return out;
  }
  const DOC_STYLE = ''
    + '*{box-sizing:border-box}body{margin:0;background:#fff;color:#1a1a1a}'
    + '.dwc-doc{max-width:820px;margin:0 auto;padding:48px 40px;line-height:1.6}'
    + '.dwc-doc.theme-serif{font-family:Georgia,"Times New Roman",serif}.dwc-doc.theme-sans{font-family:-apple-system,"Segoe UI",Roboto,Arial,sans-serif}'
    + '.dwc-cover{border-bottom:2px solid #1a1a1a;padding-bottom:14px;margin-bottom:24px}'
    + '.dwc-cover h1{font-size:2.2em;margin:0 0 6px}.dwc-byline{margin:0;color:#555;font-size:.95em}'
    + '.dwc-dot{margin:0 6px;color:#999}'
    + '.dwc-toc{background:#f6f6f6;border:1px solid #e3e3e3;border-radius:8px;padding:14px 18px;margin-bottom:28px}'
    + '.dwc-toc h2{margin:0 0 8px;font-size:1.1em}.dwc-toc ol{margin:0;padding-left:22px}.dwc-toc a{color:#0b5cad;text-decoration:none}'
    + '.dwc-sec-h{font-size:1.5em;margin:1.6em 0 .5em;border-bottom:1px solid #eee;padding-bottom:4px}'
    + '.dwc-body h3{font-size:1.2em;margin:1.2em 0 .4em}.dwc-body h4,.dwc-body h5{font-size:1.05em;margin:1em 0 .3em}'
    + '.dwc-body p{margin:.6em 0}.dwc-body a{color:#0b5cad}'
    + '.dwc-body code{font-family:ui-monospace,Consolas,monospace;background:#f0f0f0;border-radius:4px;padding:1px 5px;font-size:.9em}'
    + '.dwc-body pre.dwc-pre{background:#0f1722;color:#e6f3ff;border-radius:8px;padding:14px 16px;overflow:auto}.dwc-body pre.dwc-pre code{background:none;color:inherit;padding:0}'
    + '.dwc-body blockquote{border-left:3px solid #0b5cad;margin:.8em 0;padding:.1em 0 .1em 14px;color:#444}'
    + '.dwc-body ul,.dwc-body ol{margin:.6em 0;padding-left:24px}.dwc-body li{margin:.2em 0}'
    + '.dwc-body hr{border:0;border-top:1px solid #ddd;margin:1.4em 0}'
    + '.dwc-cb{display:inline-block;width:12px;height:12px;border:1px solid #888;border-radius:3px;margin-right:4px;vertical-align:middle}'
    + '.dwc-cb.on{background:#0b5cad;border-color:#0b5cad}.dwc-task{list-style:none;margin-left:-20px}'
    + '.dwc-empty{color:#888;font-style:italic}'
    + '@media print{.dwc-doc{max-width:none;padding:0}.dwc-toc{background:none;border:none}a{color:inherit;text-decoration:none}section{break-inside:avoid}}';
  function standaloneHTML() {
    const theme = doc.meta.theme === 'sans' ? 'theme-sans' : 'theme-serif';
    const size = doc.meta.size || 100;
    return '<!doctype html>\n<html lang="' + (VT.i18n.lang === 'pt' ? 'pt' : 'en') + '">\n<head>\n<meta charset="utf-8">\n'
      + '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
      + '<title>' + esc(doc.meta.title || t('dw.untitled')) + '</title>\n<style>' + DOC_STYLE + '</style>\n</head>\n<body>\n'
      + '<article class="dwc-doc ' + theme + '" style="font-size:' + size + '%">\n' + documentInner() + '\n</article>\n</body>\n</html>\n';
  }
  function toMarkdown() {
    let out = '# ' + (doc.meta.title || t('dw.untitled')) + '\n';
    const byline = [doc.meta.author, doc.meta.date].filter(Boolean);
    if (byline.length) out += '\n_' + byline.join(' · ') + '_\n';
    doc.sections.forEach((s) => { out += '\n## ' + sectionHeading(s) + '\n\n' + (s.body || '').trim() + '\n'; });
    return out;
  }
  function stats() {
    const words = doc.sections.reduce((n, s) => n + ((s.body || '').match(/\S+/g) || []).length, 0);
    const chars = doc.sections.reduce((n, s) => n + (s.body || '').length, 0);
    return { words, chars, sections: doc.sections.length };
  }
  function safeName(n) { return (n || 'document').replace(/[^\w-]+/g, '_').slice(0, 60); }
  function exportHTML() { U.downloadText(standaloneHTML(), safeName(doc.meta.title) + '.html', 'text/html'); toast(t('dw.exportedHtml'), 'success'); }
  function exportMD() { U.downloadText(toMarkdown(), safeName(doc.meta.title) + '.md', 'text/markdown'); toast(t('dw.exportedMd'), 'success'); }
  function printDoc() {
    const html = standaloneHTML();
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
    document.body.appendChild(frame);
    const d = frame.contentDocument;
    d.open(); d.write(html); d.close();
    const go = () => { try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (_e) { toast(t('dw.printBlocked'), 'error'); } setTimeout(() => frame.remove(), 800); };
    setTimeout(go, 120);
  }

  // ---------- state + persistence plumbing ----------
  const canonical = () => JSON.stringify(doc);
  function record() { if (hist) { hist.record(canonical()); syncHist(); } }
  const recSoon = () => { if (saveTimer) clearTimeout(saveTimer); saveTimer = setTimeout(() => { saveTimer = null; record(); }, 500); };
  function scheduleSave() { if (autosave) autosave(); }
  function touch() { scheduleSave(); }
  function flushSave() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; record(); }
    if (!alive || !VT.db.available) return;
    VT.db.put({ id: AUTOSAVE_ID, tool: TOOL, name: '(autosave)', data: doc }).catch(() => {});
  }
  function commitRender() { renderEditor(); renderPreview(); updateStats(); }
  function applyLive() { renderPreview(); updateStats(); touch(); recSoon(); }

  function applyDoc(next, noHistory) {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    doc = normalizeDoc(next);
    // Opening a saved project is a different document, so its history starts
    // clean. New and Sample are moves within the document the user is looking
    // at, and must stay undoable: the desk literally advertises Ctrl + Z, and a
    // dead undo there would make the hint a lie.
    if (hist) { if (noHistory) hist.reset(canonical()); else hist.record(canonical()); }
    syncHist();
    renderMetaFields();
    commitRender();
    flushSave();
  }
  function addSection() {
    doc.sections.push({ id: uid(), heading: t('dw.newSection'), body: '' });
    commitRender(); record(); touch();
  }
  function deleteSection(id) {
    const s = doc.sections.find((x) => x.id === id);
    VT.ui.confirm({ title: t('dw.delSec'), body: t('dw.delSecQ', { name: sectionHeading(s || {}) }), confirmLabel: t('dw.del'), danger: true }).then((yes) => {
      if (!yes) return;
      doc.sections = doc.sections.filter((x) => x.id !== id);
      commitRender(); record(); touch();
    });
  }
  function moveSection(id, dir) {
    const i = doc.sections.findIndex((x) => x.id === id); const j = i + dir;
    if (i < 0 || j < 0 || j >= doc.sections.length) return;
    const [s] = doc.sections.splice(i, 1); doc.sections.splice(j, 0, s);
    commitRender(); record(); touch();
  }
  function setMeta(key, val) { doc.meta[key] = val; renderPreview(); updateStats(); touch(); recSoon(); }
  function setSection(id, field, val) {
    const s = doc.sections.find((x) => x.id === id); if (!s) return;
    s[field] = val;
    if (field === 'heading') { renderPreview(); } else { renderPreview(); }
    updateStats(); touch(); recSoon();
  }

  // ---------- render ----------
  function renderPreview() {
    if (!refs.preview) return;
    // A sheet with only a cover and "no sections yet" reads as a broken page; on an
    // empty document the desk shows the empty state instead of the paper.
    const hasBody = doc.sections.length > 0;
    if (refs.emptyEl) refs.emptyEl.hidden = hasBody;
    refs.preview.hidden = !hasBody;
    const theme = doc.meta.theme === 'sans' ? 'theme-sans' : 'theme-serif';
    refs.preview.innerHTML = '<article class="dwc-doc ' + theme + '" style="font-size:' + (doc.meta.size || 100) + '%">' + documentInner() + '</article>';
  }
  function updateStats() {
    if (!refs.stats) return;
    const s = stats();
    refs.stats.textContent = t('dw.stats', { words: s.words, chars: s.chars, sections: s.sections });
  }
  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }
  function renderEditor() {
    if (!refs.sections) return;
    refs.sections.innerHTML = '';
    doc.sections.forEach((s, idx) => {
      const wrap = document.createElement('div'); wrap.className = 'dwc-sec'; wrap.dataset.sec = s.id;
      const head = document.createElement('div'); head.className = 'dwc-sec-head';
      const hIn = document.createElement('input'); hIn.className = 'input dwc-sec-title'; hIn.value = s.heading; hIn.placeholder = t('dw.secHeadingPh'); hIn.setAttribute('aria-label', t('dw.secHeading'));
      hIn.addEventListener('input', () => setSection(s.id, 'heading', hIn.value));
      const tools = document.createElement('div'); tools.className = 'dwc-sec-tools';
      // Same contract as the Kanban column tools: three text buttons per section
      // repeated down the rail and squeezed the heading input; glyphs with an
      // accessible name keep the row about the document.
      tools.innerHTML =
        '<button class="btn btn-ghost btn-sm dwc-sec-mv" data-a="up" title="' + esc(t('dw.up')) + '" aria-label="' + esc(t('dw.up')) + '" ' + (idx === 0 ? 'disabled' : '') + '>&uarr;</button>' +
        '<button class="btn btn-ghost btn-sm dwc-sec-mv" data-a="down" title="' + esc(t('dw.down')) + '" aria-label="' + esc(t('dw.down')) + '" ' + (idx === doc.sections.length - 1 ? 'disabled' : '') + '>&darr;</button>' +
        '<button class="btn btn-ghost btn-sm dwc-sec-del" data-a="del" title="' + esc(t('dw.delSec')) + '" aria-label="' + esc(t('dw.delSec')) + '">&times;</button>';
      tools.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b || b.disabled) return; const a = b.dataset.a; if (a === 'up') moveSection(s.id, -1); else if (a === 'down') moveSection(s.id, 1); else if (a === 'del') deleteSection(s.id); });
      head.append(hIn, tools);
      const body = document.createElement('textarea'); body.className = 'input dwc-sec-body'; body.rows = 6; body.value = s.body; body.placeholder = t('dw.secBodyPh'); body.setAttribute('aria-label', t('dw.secBody'));
      body.addEventListener('input', () => setSection(s.id, 'body', body.value));
      wrap.append(head, body);
      refs.sections.append(wrap);
    });
  }

  function setMode(m) {
    mode = m;
    if (refs.stage) refs.stage.setAttribute('data-mode', m);
    $$('.bench-seg .btn', refs.stage || document).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    VT.store.set(KEY, { mode });
  }

  function loadProjects() {
    if (!refs.projList) return;
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty dwc-empty">' + esc(t('dw.dbUnavailable')) + '</div>'; return; }
    VT.db.list(TOOL).then((rows) => {
      const named = rows.filter((r) => r.id !== AUTOSAVE_ID && r.id !== LEGACY_AUTOSAVE_ID);
      refs.projList.innerHTML = '';
      if (!named.length) { refs.projList.innerHTML = '<div class="bench-empty dwc-empty">' + esc(t('dw.noProjects')) + '</div>'; return; }
      named.forEach((r) => {
        const row = document.createElement('div'); row.className = 'bench-row dwc-proj-row';
        const info = document.createElement('div'); info.className = 'dwc-proj-info';
        const st = document.createElement('strong'); st.textContent = r.name || t('dw.untitled');
        const sm = document.createElement('span'); sm.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(st, sm);
        const open = document.createElement('button'); open.className = 'btn btn-ghost btn-sm'; open.textContent = t('dw.open');
        open.addEventListener('click', () => { flushSave(); applyDoc(r.data, true); toast(t('dw.projOpened', { name: r.name || t('dw.untitled') }), 'success'); });
        const del = document.createElement('button'); del.className = 'btn btn-ghost btn-sm'; del.textContent = 'x'; del.title = t('dw.del');
        del.addEventListener('click', () => { VT.db.remove(r.id).then(loadProjects).catch(() => toast(t('dw.dbError'), 'error')); });
        row.append(info, open, del); refs.projList.append(row);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty dwc-empty">' + esc(t('dw.dbError')) + '</div>'; });
  }
  function saveProject() {
    if (!VT.db.available) { toast(t('dw.dbUnavailable'), 'error'); return; }
    const name = (refs.projName.value || '').trim() || doc.meta.title || t('dw.untitled');
    flushSave();
    VT.db.put({ tool: TOOL, name, data: doc }).then(() => { toast(t('dw.projSaved', { name }), 'success'); refs.projName.value = ''; loadProjects(); }).catch(() => toast(t('dw.dbError'), 'error'));
  }
  function renderMetaFields() {
    refs.mTitle.value = doc.meta.title; refs.mAuthor.value = doc.meta.author; refs.mDate.value = doc.meta.date;
    refs.mTheme.value = doc.meta.theme; refs.mSize.value = String(doc.meta.size); refs.mSizeOut.textContent = doc.meta.size + '%';
  }
  function loadDoc() {
    const s = VT.store.get(KEY, null);
    mode = s && s.mode ? s.mode : 'split';
    if (!VT.db.available) { doc = DEFAULT_DOC(); renderMetaFields(); commitRender(); setMode(mode); return Promise.resolve(); }
    return VT.db.get(AUTOSAVE_ID).then((rec) => {
      if (rec) return rec.tool === TOOL ? rec : null;
      return VT.db.get(LEGACY_AUTOSAVE_ID).then((legacy) => legacy && legacy.tool === TOOL ? legacy : null);
    }).then((rec) => {
      doc = (rec && rec.data) ? normalizeDoc(rec.data) : DEFAULT_DOC();
      renderMetaFields();
      if (hist) hist.reset(canonical());
      syncHist(); commitRender(); setMode(mode);
    }).catch(() => { doc = DEFAULT_DOC(); renderMetaFields(); commitRender(); setMode(mode); });
  }

  function mount(root) {
    alive = true;
    const I = VT.icons;
    root.innerHTML =
      '<div class="dwc-stage" data-mode="' + mode + '">'
      + '<div class="dwc-bar bench">'
      + '<span class="bench-rail-group">'
      + '<button class="btn btn-primary btn-sm" id="dwc-new">' + I.plus + ' ' + t('dw.new') + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="dwc-sample">' + I.sparkle + ' ' + t('dw.sample') + '</button>'
      + '</span><span class="bench-sep" aria-hidden="true"></span>'
      + '<span class="bench-rail-group">'
      + '<button class="btn btn-ghost btn-sm" id="dwc-undo" data-tip="' + t('hist.undo.tip') + '">' + I.undo + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="dwc-redo" data-tip="' + t('hist.redo.tip') + '">' + I.redo + '</button>'
      + '</span><span class="bench-sep" aria-hidden="true"></span>'
      + '<div class="bench-seg" role="group" aria-label="' + esc(t('dw.mode')) + '">'
      + '<button class="btn btn-ghost btn-sm" data-mode="write" aria-pressed="' + (mode === 'write') + '">' + t('dw.modeWrite') + '</button>'
      + '<button class="btn btn-ghost btn-sm" data-mode="split" aria-pressed="' + (mode === 'split') + '">' + t('dw.modeSplit') + '</button>'
      + '<button class="btn btn-ghost btn-sm" data-mode="preview" aria-pressed="' + (mode === 'preview') + '">' + t('dw.modePreview') + '</button>'
      + '</div>'
      + '<div class="dwc-bar-actions"><span class="dwc-stats" id="dwc-stats"></span>'
      + '<button class="btn btn-ghost btn-sm" id="dwc-print">' + I.book + ' ' + t('dw.print') + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="dwc-exp-html">' + I.download + ' ' + t('dw.exportHtml') + '</button>'
      + '<button class="btn btn-ghost btn-sm" id="dwc-exp-md">' + I.download + ' ' + t('dw.exportMd') + '</button>'
      + '</div></div>'
      + '<div class="dwc-work">'
      + '<div class="dwc-editor">'
      + '<section class="bench-sec glass"><h3 class="bench-sec-head">' + esc(t('dw.docMeta')) + '</h3>'
      + '<input class="input dwc-doc-title" id="dwc-m-title" type="text" placeholder="' + t('dw.docTitlePh') + '" aria-label="' + t('dw.docTitle') + '">'
      + '<div class="dwc-meta-row">'
      + '<input class="input" id="dwc-m-author" type="text" placeholder="' + t('dw.authorPh') + '" aria-label="' + t('dw.author') + '">'
      + '<input class="input dwc-date" id="dwc-m-date" type="date" aria-label="' + t('dw.date') + '">'
      + '<select class="input dwc-theme" id="dwc-m-theme" aria-label="' + t('dw.theme') + '"><option value="serif">' + t('dw.themeSerif') + '</option><option value="sans">' + t('dw.themeSans') + '</option></select>'
      + '<label class="dwc-size"><input id="dwc-m-size" type="range" min="80" max="160" step="5"><span id="dwc-m-size-out">100%</span></label>'
      + '</div></section>'
      + '<section class="bench-sec glass"><h3 class="bench-sec-head">' + esc(t('dw.sections')) + '</h3>'
      + '<div class="dwc-sections" id="dwc-sections"></div>'
      + '<button class="btn btn-ghost btn-sm dwc-add-sec" id="dwc-add-sec">' + I.plus + ' ' + t('dw.addSection') + '</button>'
      + '</section>'
      + '<section class="bench-sec glass"><h3 class="bench-sec-head">' + esc(t('dw.projects')) + '</h3>'
      + '<div class="dwc-proj-save"><input class="input" id="dwc-proj-name" type="text" placeholder="' + t('dw.projNamePh') + '" aria-label="' + t('dw.projNamePh') + '"><button class="btn btn-primary btn-sm" id="dwc-proj-save">' + t('dw.save') + '</button></div>'
      + '<div class="bench-list dwc-proj-list" id="dwc-proj-list"></div></section>'
      + '</div>'
      + '<section class="dwc-desk mat glass" aria-label="' + esc(t('dw.preview')) + '">'
      + '<div class="dwc-preview mat-sheet" id="dwc-preview"></div>'
      + '<div class="mat-empty" id="dwc-preview-empty" hidden>'
      + '<span class="orb orb-lg">' + I.book + '</span>'
      + '<div class="mat-empty-title">' + esc(t('dw.emptyTitle')) + '</div>'
      + '<p class="mat-empty-body">' + esc(t('dw.emptyBody')) + '</p>'
      + '<div class="mat-empty-cta">'
      + '<button class="btn btn-primary btn-sm" id="dwc-empty-sample">' + I.sparkle + ' ' + esc(t('dw.emptyCta')) + '</button>'
      + '<span class="mat-empty-keys"><span class="kbd">Ctrl</span> + <span class="kbd">Z</span> ' + esc(t('dw.emptyUndo')) + '</span>'
      + '</div></div>'
      + '</section>'
      + '</div>'
      + '<p class="privacy-line">' + I.shield + ' ' + t('dw.privacy') + '</p>'
      + '</div>';

    refs = {
      stage: $('.dwc-stage', root), sections: $('#dwc-sections', root), preview: $('#dwc-preview', root),
      emptyEl: $('#dwc-preview-empty', root),
      stats: $('#dwc-stats', root), undo: $('#dwc-undo', root), redo: $('#dwc-redo', root),
      mTitle: $('#dwc-m-title', root), mAuthor: $('#dwc-m-author', root), mDate: $('#dwc-m-date', root),
      mTheme: $('#dwc-m-theme', root), mSize: $('#dwc-m-size', root), mSizeOut: $('#dwc-m-size-out', root),
      projName: $('#dwc-proj-name', root), projList: $('#dwc-proj-list', root)
    };

    autosave = U.debounce(() => { if (!alive || !VT.db.available) return; VT.db.put({ id: AUTOSAVE_ID, tool: TOOL, name: '(autosave)', data: doc }).catch(() => {}); }, 600);
    hist = VT.history.create({ apply: (val) => { doc = normalizeDoc(JSON.parse(val)); renderMetaFields(); renderEditor(); renderPreview(); updateStats(); syncHist(); scheduleSave(); } });

    refs.mTitle.addEventListener('input', () => setMeta('title', refs.mTitle.value));
    refs.mAuthor.addEventListener('input', () => setMeta('author', refs.mAuthor.value));
    refs.mDate.addEventListener('input', () => setMeta('date', refs.mDate.value));
    refs.mTheme.addEventListener('change', () => setMeta('theme', refs.mTheme.value));
    refs.mSize.addEventListener('input', () => { refs.mSizeOut.textContent = refs.mSize.value + '%'; setMeta('size', Number(refs.mSize.value)); });

    $('#dwc-new', root).addEventListener('click', () => { flushSave(); applyDoc({ meta: DEFAULT_DOC().meta, sections: [{ id: uid(), heading: t('dw.sec1'), body: t('dw.sec1body') }] }); toast(t('dw.newDone'), 'success'); });
    const useSample = () => { flushSave(); applyDoc(SAMPLE_DOC()); };
    $('#dwc-sample', root).addEventListener('click', useSample);
    $('#dwc-empty-sample', root).addEventListener('click', useSample);
    $('#dwc-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#dwc-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });
    $$('.bench-seg .btn', root).forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    $('#dwc-add-sec', root).addEventListener('click', addSection);
    $('#dwc-print', root).addEventListener('click', printDoc);
    $('#dwc-exp-html', root).addEventListener('click', exportHTML);
    $('#dwc-exp-md', root).addEventListener('click', exportMD);
    $('#dwc-proj-save', root).addEventListener('click', saveProject);

    root.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (hist.onKey(e)) syncHist();
    });

    loadDoc();
    loadProjects();
    return () => { flushSave(); alive = false; };
  }

  function unmount() { flushSave(); alive = false; hist = null; autosave = null; refs = {}; doc = null; }

  const def = {
    id: 'document-workshop', cat: 'documents', icon: 'file', version: '0.1.0',
    name: { en: 'Document Workshop', pt: 'Bancada de Documentos' },
    tagline: {
      en: 'A local-first, print-ready document bench. Write a document as ordered sections of safe Markdown with a cover header, an auto table of contents and a live preview, then export a standalone printable HTML, plain Markdown, or print straight from the browser. No eval, no raw HTML, nothing uploaded.',
      pt: 'Uma bancada de documentos local-first pronta para impressao. Escreva um documento como secoes ordenadas de Markdown seguro com cabecalho, sumario automatico e previa ao vivo, depois exporte um HTML autonomo para impressao, Markdown puro ou imprima direto do navegador. Sem eval, sem HTML bruto, nada enviado.'
    },
    tags: ['document', 'markdown', 'print', 'resume', 'report', 'documents'],
    deps: [],
    docs: {
      en: {
        summary: 'A local-first document editor for print-ready output. Compose a document from ordered sections, each written in safe Markdown, with a cover header (title, author, date), an automatic table of contents, a serif or sans theme and an adjustable font size. Preview live, then export a standalone printable HTML file, export the source as Markdown, or send it to the browser print dialog (PDF via Save as PDF).',
        usage: [
          'Fill the document fields — title, optional author and date — then choose the Serif or Sans theme and the font size (80–160 %).',
          'Add a section, give it a heading and write Markdown in its body; reorder with ↑ / ↓ and remove with ×.',
          'Switch Write / Split / Preview to check the layout; the table of contents appears once you have two or more sections.',
          'Print opens the browser print dialog with print-only CSS, Export HTML gives a standalone file and Export Markdown the source.',
          'Save a named project, or start over with New / Sample; undo/redo covers the whole document.'
        ],
        privacy: 'The document is stored on-device (IndexedDB autosave + named projects) and never uploaded. Every user string is HTML-escaped and rendered from a plain data model via textContent and esc; only http/https/mailto/# link protocols are kept (javascript: and others become inert text). There is no eval and no raw-HTML passthrough. Print uses a same-document hidden iframe with your own generated, escaped markup.',
        limits: [
          'Headings written inside a section body are forced to h3–h6 so they nest under the section h2, and the Markdown subset has no images or tables.',
          'The table of contents only renders when the document has two or more sections.',
          'One active document at a time (named projects keep several), undo history is the shared in-memory stack that resets when you leave the tool, and a PDF depends on the browser print dialog: if it is blocked you get a notice instead, and the tool never converts the file itself.'
        ]
      },
      pt: {
        summary: 'Um editor de documentos local-first para saída pronta para impressão. Monte um documento a partir de seções ordenadas, cada uma em Markdown seguro, com cabeçalho (título, autor, data), sumário automático, tema serifado ou sem serifa e tamanho de fonte ajustável. Prévia ao vivo e depois exporte um arquivo HTML autônomo para impressão, exporte a fonte como Markdown, ou envie para a caixa de impressão do navegador.',
        usage: [
          'Preencha os campos do documento — título, autor e data opcionais — e escolha o tema Serifado ou Sem serifa e o tamanho da fonte (80–160 %).',
          'Adicione uma seção, dê um título a ela e escreva Markdown no corpo; reordene com ↑ / ↓ e remova com ×.',
          'Alterne Escrita / Dividido / Prévia para conferir o layout; o sumário aparece a partir de duas seções.',
          'Imprimir abre a caixa de impressão do navegador com CSS próprio de impressão; Exportar HTML gera um arquivo autônomo e Exportar Markdown, a fonte.',
          'Salve um projeto nomeado, ou recomece com Novo / Exemplo; desfazer/refaça cobre o documento inteiro.'
        ],
        privacy: 'O documento é armazenado no dispositivo (salvamento automático no IndexedDB + projetos nomeados) e nunca é enviado. Todo texto do usuário é escapado em HTML e renderizado de um modelo de dados puro via textContent e esc; apenas protocolos http/https/mailto/# são mantidos. Não há eval nem passagem de HTML bruto. A impressão usa um iframe oculto do mesmo documento com seu markup gerado e escapado.',
        limits: [
          'Cabeçalhos escritos dentro do corpo de uma seção são forçados a h3–h6 para se aninharem sob o h2 da seção, e o subconjunto de Markdown não tem imagens nem tabelas.',
          'O sumário só é renderizado quando o documento tem duas ou mais seções.',
          'Um documento ativo por vez (projetos nomeados mantêm vários), o histórico de desfazer é a pilha compartilhada em memória, zerada ao sair da ferramenta, e o PDF depende da caixa de impressão do navegador: se ela for bloqueada você recebe um aviso, e a ferramenta nunca converte o arquivo por conta própria.'
        ]
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'dw.docDefault': 'Untitled document', 'dw.sec1': 'Introduction', 'dw.sec1body': 'Start writing this section in **Markdown**. The preview and table of contents update live.',
      'dw.new': 'New', 'dw.sample': 'Sample', 'dw.newDone': 'Started a new document', 'dw.newSection': 'New section',
      'dw.modeWrite': 'Write', 'dw.modeSplit': 'Split', 'dw.modePreview': 'Preview',
      'dw.mode': 'Document view', 'dw.docMeta': 'Document', 'dw.sections': 'Sections', 'dw.preview': 'Document preview',
      'dw.emptyTitle': 'A blank sheet is still a document', 'dw.emptyBody': 'Write a section on the left, or open the sample to see how Markdown becomes a printable page.', 'dw.emptyCta': 'Open the sample', 'dw.emptyUndo': 'undo · the whole document is one history',
      'dw.print': 'Print', 'dw.exportHtml': 'Export HTML', 'dw.exportMd': 'Export Markdown',
      'dw.exportedHtml': 'Document exported as HTML', 'dw.exportedMd': 'Document exported as Markdown', 'dw.printBlocked': 'Print was blocked by the browser.',
      'dw.addSection': 'Add section', 'dw.secHeading': 'Section heading', 'dw.secHeadingPh': 'Section title...', 'dw.secBody': 'Section body', 'dw.secBodyPh': 'Write Markdown...',
      'dw.del': 'Delete', 'dw.delSec': 'Delete section', 'dw.delSecQ': 'Delete the section "{name}"? This cannot be undone.', 'dw.up': 'Up', 'dw.down': 'Down',
      'dw.docTitle': 'Document title', 'dw.docTitlePh': 'Document title...', 'dw.author': 'Author', 'dw.authorPh': 'Author', 'dw.date': 'Date', 'dw.theme': 'Theme', 'dw.themeSerif': 'Serif', 'dw.themeSans': 'Sans',
      'dw.toc': 'Contents', 'dw.noSections': 'No sections yet. Add one to begin.', 'dw.untitled': 'Untitled', 'dw.untitledSection': 'Untitled section',
      'dw.stats': '{words} words · {chars} chars · {sections} section(s)',
      'dw.projects': 'Projects', 'dw.save': 'Save', 'dw.open': 'Open', 'dw.projNamePh': 'Project name', 'dw.noProjects': 'No saved projects yet.',
      'dw.projSaved': 'Project "{name}" saved', 'dw.projOpened': 'Project "{name}" opened', 'dw.dbUnavailable': 'Local storage unavailable — the document cannot be saved.', 'dw.dbError': 'Could not reach local storage.',
      'dw.privacy': 'Your document stays on this device (IndexedDB). All text is escaped and rendered from a data model — no eval, no raw HTML, nothing uploaded.',
      'dw.sampleTitle': 'Quarterly Report', 'dw.sampleAuthor': 'Vistanology',
      'dw.sampleH1': 'Summary', 'dw.sampleB1': 'This sample shows the **Markdown** the preview supports: emphasis, `inline code`, [links](https://example.com), lists and more.\n\n- Revenue up twelve percent\n- Two new flagship tools shipped\n- Offline and privacy-first',
      'dw.sampleH2': 'Highlights', 'dw.sampleB2': '## Done this quarter\n\n- [x] Ship the Kanban Board\n- [x] Ship the Document Workshop\n- [ ] Collect community feedback\n\n> Everything runs locally in your browser.',
      'dw.sampleH3': 'Code', 'dw.sampleB3': 'Render blocks exactly:\n\n```\nfunction greet(name) {\n  return "hello, " + name;\n}\n```'
    },
    pt: {
      'dw.docDefault': 'Documento sem título', 'dw.sec1': 'Introdução', 'dw.sec1body': 'Comece a escrever esta seção em **Markdown**. A prévia e o sumário se atualizam ao vivo.',
      'dw.new': 'Novo', 'dw.sample': 'Exemplo', 'dw.newDone': 'Novo documento iniciado', 'dw.newSection': 'Nova seção',
      'dw.modeWrite': 'Escrita', 'dw.modeSplit': 'Dividido', 'dw.modePreview': 'Prévia',
      'dw.mode': 'Visão do documento', 'dw.docMeta': 'Documento', 'dw.sections': 'Seções', 'dw.preview': 'Prévia do documento',
      'dw.emptyTitle': 'Uma folha em branco ainda é um documento', 'dw.emptyBody': 'Escreva uma seção à esquerda ou abra o exemplo para ver o Markdown virar uma página pronta para impressão.', 'dw.emptyCta': 'Abrir o exemplo', 'dw.emptyUndo': 'desfazer · o documento inteiro é uma única história',
      'dw.print': 'Imprimir', 'dw.exportHtml': 'Exportar HTML', 'dw.exportMd': 'Exportar Markdown',
      'dw.exportedHtml': 'Documento exportado como HTML', 'dw.exportedMd': 'Documento exportado como Markdown', 'dw.printBlocked': 'A impressão foi bloqueada pelo navegador.',
      'dw.addSection': 'Adicionar seção', 'dw.secHeading': 'Título da seção', 'dw.secHeadingPh': 'Título da seção...', 'dw.secBody': 'Corpo da seção', 'dw.secBodyPh': 'Escreva Markdown...',
      'dw.del': 'Excluir', 'dw.delSec': 'Excluir seção', 'dw.delSecQ': 'Excluir a seção "{name}"? Isso não pode ser desfeito.', 'dw.up': 'Subir', 'dw.down': 'Descer',
      'dw.docTitle': 'Título do documento', 'dw.docTitlePh': 'Título do documento...', 'dw.author': 'Autor', 'dw.authorPh': 'Autor', 'dw.date': 'Data', 'dw.theme': 'Tema', 'dw.themeSerif': 'Serifado', 'dw.themeSans': 'Sem serifa',
      'dw.toc': 'Sumário', 'dw.noSections': 'Nenhuma seção ainda. Adicione uma para começar.', 'dw.untitled': 'Sem título', 'dw.untitledSection': 'Seção sem título',
      'dw.stats': '{words} palavras · {chars} caracteres · {sections} seção(ões)',
      'dw.projects': 'Projetos', 'dw.save': 'Salvar', 'dw.open': 'Abrir', 'dw.projNamePh': 'Nome do projeto', 'dw.noProjects': 'Nenhum projeto salvo ainda.',
      'dw.projSaved': 'Projeto "{name}" salvo', 'dw.projOpened': 'Projeto "{name}" aberto', 'dw.dbUnavailable': 'Armazenamento local indisponível — o documento não pode ser salvo.', 'dw.dbError': 'Não foi possível acessar o armazenamento local.',
      'dw.privacy': 'Seu documento fica neste dispositivo (IndexedDB). Todo texto é escapado e renderizado de um modelo de dados — sem eval, sem HTML bruto, nada enviado.',
      'dw.sampleTitle': 'Relatório Trimestral', 'dw.sampleAuthor': 'Vistanology',
      'dw.sampleH1': 'Resumo', 'dw.sampleB1': 'Este exemplo mostra o **Markdown** que a prévia aceita: ênfase, `código inline`, [links](https://example.com), listas e mais.\n\n- Receita doze por cento maior\n- Duas novas ferramentas principais entregues\n- Offline e orientado à privacidade',
      'dw.sampleH2': 'Destaques', 'dw.sampleB2': '## Concluído neste trimestre\n\n- [x] Entregar o Quadro Kanban\n- [x] Entregar a Bancada de Documentos\n- [ ] Coletar feedback da comunidade\n\n> Tudo roda localmente no seu navegador.',
      'dw.sampleH3': 'Código', 'dw.sampleB3': 'Renderize blocos exatamente assim:\n\n```\nfunction greet(nome) {\n  return "olá, " + nome;\n}\n```'
    }
  });

  VT.registry.add(def);
  return def;
})();
