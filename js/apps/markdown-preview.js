window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['markdown-preview'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'mp.split': 'Split', 'mp.preview': 'Preview', 'mp.html': 'HTML',
      'mp.editor': 'Markdown', 'mp.result': 'Preview', 'mp.source': 'Generated HTML',
      'mp.ph': 'Write Markdown…', 'mp.sample': 'Sample', 'mp.clear': 'Clear',
      'mp.copyHtml': 'Copy HTML', 'mp.dlHtml': 'Download .html', 'mp.dlMd': 'Download .md',
      'mp.words': 'words', 'mp.chars': 'chars', 'mp.lines': 'lines',
      'mp.empty': 'Waiting for Markdown…', 'mp.ready': 'rendered',
      'mp.copied': 'Copied to clipboard', 'mp.copyFail': 'Could not copy — select and copy manually.',
      'mp.privacy': 'Markdown is parsed and rendered locally. Remote images are never fetched; unsafe links are stripped.'
    },
    pt: {
      'mp.split': 'Dividido', 'mp.preview': 'Prévia', 'mp.html': 'HTML',
      'mp.editor': 'Markdown', 'mp.result': 'Prévia', 'mp.source': 'HTML gerado',
      'mp.ph': 'Escreva Markdown…', 'mp.sample': 'Exemplo', 'mp.clear': 'Limpar',
      'mp.copyHtml': 'Copiar HTML', 'mp.dlHtml': 'Baixar .html', 'mp.dlMd': 'Baixar .md',
      'mp.words': 'palavras', 'mp.chars': 'chars', 'mp.lines': 'linhas',
      'mp.empty': 'Aguardando Markdown…', 'mp.ready': 'renderizado',
      'mp.copied': 'Copiado para a área de transferência', 'mp.copyFail': 'Não foi possível copiar — selecione e copie manualmente.',
      'mp.privacy': 'O Markdown é parseado e renderizado localmente. Imagens remotas nunca são buscadas; links inseguros são removidos.'
    }
  });

  const def = {
    id: 'markdown-preview', cat: 'developer', icon: 'markdown', version: '1.1.0',
    name: { en: 'Markdown Preview', pt: 'Prévia de Markdown' },
    tagline: {
      en: 'Live local Markdown preview with split/preview/HTML views, sanitized links, code fences, tables and lists, plus HTML/Markdown export.',
      pt: 'Prévia local de Markdown ao vivo com visões dividida/prévia/HTML, links sanitizados, blocos de código, tabelas e listas, e exportação HTML/Markdown.'
    },
    tags: ['markdown', 'preview', 'html', 'editor', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'A local Markdown workbench: write Markdown and see a live rendered preview (split, preview-only, or generated-HTML views). Supports headings, emphasis, inline code, fenced code, links, lists, blockquotes, tables and rules. All HTML is escaped and link protocols are sanitized; remote images are never fetched.',
        usage: [
          'Write or paste Markdown, or load the sample.',
          'Switch Split / Preview / HTML to edit, read, or inspect the generated HTML.',
          'Undo/redo your edits with Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) or the Undo/Redo buttons.',
          'Copy the generated HTML, or download a standalone .html or the source .md.'
        ],
        privacy: 'Parsing and rendering happen in memory. No network requests are made; remote image URLs render as links instead of loading.',
        limits: [
          'Single newline inside a paragraph renders as a line break (preview-friendly), not a soft space.',
          'Remote images are not fetched (privacy); data: images render, other image URLs become links.',
          'Only http/https/mailto/# link protocols are kept; everything else (e.g. javascript:) is stripped to plain text.',
          'Undo history is in-memory only (never saved) and coalesces typing bursts into one step; it resets when you leave the tool.'
        ]
      },
      pt: {
        summary: 'Uma bancada local de Markdown: escreva Markdown e veja uma prévia renderizada ao vivo (visões dividida, só prévia ou HTML gerado). Suporta títulos, ênfase, código inline, blocos de código, links, listas, citações, tabelas e réguas. Todo HTML é escapado e protocolos de link sanitizados; imagens remotas nunca são buscadas.',
        usage: [
          'Escreva ou cole Markdown, ou carregue o exemplo.',
          'Alterne Dividido / Prévia / HTML para editar, ler ou inspecionar o HTML gerado.',
          'Desfaça/refaça edições com Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) ou os botões Desfazer/Refazer.',
          'Copie o HTML gerado ou baixe um .html independente ou o .md fonte.'
        ],
        privacy: 'Parse e renderização ocorrem em memória. Nenhuma requisição de rede é feita; URLs de imagem remotas viram links em vez de carregar.',
        limits: [
          'Quebra de linha simples dentro de parágrafo vira quebra visual (amigável à prévia), não espaço suave.',
          'Imagens remotas não são buscadas (privacidade); imagens data: renderizam, outras URLs de imagem viram links.',
          'Só protocolos http/https/mailto/# são mantidos; o resto (ex.: javascript:) vira texto puro.',
          'O histórico de desfazer fica só em memória (nunca é salvo) e agrupa rajadas de digitação em um passo; é reiniciado ao sair da ferramenta.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'markdown-preview';
  let state = { mode: 'split' };
  let refs = {};
  let lastHtml = '';
  let hist = null;

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (s && ['split', 'preview', 'html'].includes(s.mode)) state.mode = s.mode;
  }

  const safeUrl = (u) => { const s = u.trim(); return /^(https?:|mailto:|#)/i.test(s) ? s : null; };

  function inline(raw) {
    const codes = [];
    let s = raw.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return '@@C' + (codes.length - 1) + '@@'; });
    s = esc(s);
    s = s.replace(/!\[([^\]]*)\]\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, (m, alt, arg) => {
      const url = arg.trim().split(/\s+/)[0];
      if (/^data:image\//i.test(url)) return '<img src="' + url + '" alt="' + alt + '">';
      const u = safeUrl(url);
      if (u) return '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + (alt || u) + '</a>';
      return alt;
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
  const splitRow = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  const isTableSep = (l) => /^[\s|:-]+$/.test(l) && l.includes('-') && l.includes('|');
  const isListLine = (l) => /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(l);

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

  function mdToHtml(src) {
    const lines = src.replace(/\r\n?/g, '\n').split('\n');
    const out = [];
    let i = 0, m;
    while (i < lines.length) {
      const line = lines[i];
      if (/^\s*$/.test(line)) { i++; continue; }
      m = line.match(/^```(.*)$/);
      if (m) {
        const buf = []; i++;
        while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
        i++;
        out.push('<pre class="md-pre"><code>' + esc(buf.join('\n')) + '</code></pre>');
        continue;
      }
      m = line.match(/^(#{1,6})\s+(.*)$/);
      if (m) { const n = m[1].length; out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>'); i++; continue; }
      if (/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(line)) { out.push('<hr>'); i++; continue; }
      if (/^\s*>/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*>/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        out.push('<blockquote>' + mdToHtml(buf.join('\n')) + '</blockquote>');
        continue;
      }
      if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
        const header = splitRow(line); i += 2; const rows = [];
        while (i < lines.length && lines[i].includes('|') && !/^\s*$/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
        let tb = '<table><thead><tr>' + header.map(c => '<th>' + inline(c) + '</th>').join('') + '</tr></thead><tbody>';
        tb += rows.map(r => '<tr>' + r.map(c => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('');
        out.push(tb + '</tbody></table>');
        continue;
      }
      m = isListLine(line);
      if (m) {
        const items = [];
        while (i < lines.length) {
          const lm = isListLine(lines[i]); if (!lm) break;
          items.push({ indent: lm[1].length, ordered: /^\d+\./.test(lm[2]), text: lm[3] });
          i++;
        }
        out.push(buildList(items));
        continue;
      }
      const buf = [line]; i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,6}\s|```|\s*>)/.test(lines[i]) && !isListLine(lines[i]) && !/^\s*(\*{3,}|-{3,}|_{3,})\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      out.push('<p>' + buf.map(inline).join('<br>') + '</p>');
    }
    return out.join('\n');
  }
  const SAMPLE = [
    '# Vistanology', '',
    'Useful technology. **Open possibilities.**', '',
    '## Features', '',
    '- Local-first: nothing leaves your browser',
    '- *Zero* dependencies',
    '  - Nested item',
    '- ~~Uploads~~ removed', '',
    '1. Write Markdown',
    '2. See it rendered', '',
    '> Privacy is a feature, not a setting.', '',
    'Inline `code` and a [safe link](https://example.com).', '',
    '```js', 'const local = true;', '```', '',
    '| Tool | Local |', '| --- | --- |', '| Diff | yes |', '| Hash | yes |', '',
    '---', '',
    '![remote](https://example.com/x.png) stays a link.'
  ].join('\n');

  function applyLayout() {
    refs.body.dataset.mode = state.mode;
    refs.editorPane.hidden = state.mode !== 'split';
    refs.previewPane.hidden = state.mode === 'html';
    refs.htmlPane.hidden = state.mode !== 'html';
  }

  function render() {
    const text = refs.editor.value;
    refs.status.className = 'mp-status';
    if (!text) {
      lastHtml = ''; refs.preview.innerHTML = ''; refs.html.textContent = '';
      refs.status.textContent = t('mp.empty');
      refs.words.textContent = '0'; refs.chars.textContent = '0'; refs.lines.textContent = '0';
      return;
    }
    lastHtml = mdToHtml(text);
    refs.preview.innerHTML = lastHtml;
    refs.html.textContent = lastHtml;
    refs.status.classList.add('ok');
    refs.status.textContent = t('mp.ready');
    refs.words.textContent = String((text.match(/\S+/g) || []).length);
    refs.chars.textContent = String(text.length);
    refs.lines.textContent = String(text.split('\n').length);
  }
  const renderSoon = U.debounce(render, 150);

  function mount(root) {
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="mp-stage glass-2">
        <div class="mp-bar">
          <div id="mp-tab"><div class="mp-tabs" role="tablist" aria-label="${t('mp.result')}">
            <button class="tab" role="tab" data-tab="split" aria-selected="${state.mode === 'split'}">${t('mp.split')}</button>
            <button class="tab" role="tab" data-tab="preview" aria-selected="${state.mode === 'preview'}">${t('mp.preview')}</button>
            <button class="tab" role="tab" data-tab="html" aria-selected="${state.mode === 'html'}">${t('mp.html')}</button>
          </div></div>
          <span class="mp-status" id="mp-status"></span>
        </div>
        <div class="mp-body" id="mp-body" data-mode="${state.mode}">
          <div class="mp-pane" id="mp-editorpane">
            <label class="mp-label" for="mp-editor">${t('mp.editor')}</label>
            <textarea class="input mp-editor" id="mp-editor" spellcheck="false" placeholder="${t('mp.ph')}"></textarea>
          </div>
          <div class="mp-pane" id="mp-previewpane">
            <span class="mp-label">${t('mp.result')}</span>
            <div class="mp-preview" id="mp-preview"></div>
          </div>
          <div class="mp-pane" id="mp-htmlpane" hidden>
            <span class="mp-label">${t('mp.source')}</span>
            <pre class="mp-html" id="mp-html"></pre>
          </div>
        </div>
        <div class="mp-actions">
          <button class="btn btn-ghost btn-sm" id="mp-sample">${I.sparkle} ${t('mp.sample')}</button>
          <button class="btn btn-ghost btn-sm" id="mp-clear">${I.x} ${t('mp.clear')}</button>
          <span class="mp-actions-sep" aria-hidden="true"></span>
          <button class="btn btn-ghost btn-sm" id="mp-undo" data-tip="${t('hist.undo.tip')}" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
          <button class="btn btn-ghost btn-sm" id="mp-redo" data-tip="${t('hist.redo.tip')}" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
        </div>
        <dl class="mp-stats">
          <div><dt>${t('mp.words')}</dt><dd id="mp-words">0</dd></div>
          <div><dt>${t('mp.chars')}</dt><dd id="mp-chars">0</dd></div>
          <div><dt>${t('mp.lines')}</dt><dd id="mp-lines">0</dd></div>
        </dl>
        <div class="mp-actions">
          <button class="btn btn-ghost btn-sm" id="mp-copy">${I.copy} ${t('mp.copyHtml')}</button>
          <button class="btn btn-ghost btn-sm" id="mp-dlhtml">${I.download} ${t('mp.dlHtml')}</button>
          <button class="btn btn-ghost btn-sm" id="mp-dlmd">${I.download} ${t('mp.dlMd')}</button>
        </div>
        <p class="privacy-line">${I.shield} ${t('mp.privacy')}</p>
      </div>`;

    refs = {
      body: $('#mp-body', root), editor: $('#mp-editor', root), editorPane: $('#mp-editorpane', root),
      previewPane: $('#mp-previewpane', root), htmlPane: $('#mp-htmlpane', root),
      preview: $('#mp-preview', root), html: $('#mp-html', root), status: $('#mp-status', root),
      words: $('#mp-words', root), chars: $('#mp-chars', root), lines: $('#mp-lines', root)
    };

    hist = VT.history.create({ apply: (val) => { refs.editor.value = val; render(); syncHist(); } });
    hist.reset(refs.editor.value);
    function syncHist() {
      const u = $('#mp-undo', root), r = $('#mp-redo', root);
      if (u) u.disabled = !hist.canUndo();
      if (r) r.disabled = !hist.canRedo();
    }

    VT.ui.tabs($('#mp-tab', root), (id) => { state.mode = id; persist(); applyLayout(); });
    const recordSoon = U.debounce(() => { hist.record(refs.editor.value); syncHist(); }, 500);
    refs.editor.addEventListener('input', () => { renderSoon(); recordSoon(); });
    refs.editor.addEventListener('keydown', (e) => { hist.onKey(e); syncHist(); });
    $('#mp-sample', root).addEventListener('click', () => { refs.editor.value = SAMPLE; render(); hist.record(SAMPLE); syncHist(); });
    $('#mp-clear', root).addEventListener('click', () => { refs.editor.value = ''; render(); hist.record(''); syncHist(); refs.editor.focus(); });
    $('#mp-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); refs.editor.focus(); });
    $('#mp-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); refs.editor.focus(); });
    $('#mp-copy', root).addEventListener('click', async () => {
      if (!lastHtml) return;
      const ok = await U.copyText(lastHtml);
      toast(ok ? t('mp.copied') : t('mp.copyFail'), ok ? 'success' : 'error');
    });
    $('#mp-dlhtml', root).addEventListener('click', () => {
      if (!lastHtml) return;
      const doc = '<!doctype html><meta charset="utf-8"><title>Vistanology</title><style>body{font-family:system-ui,sans-serif;max-width:760px;margin:40px auto;padding:0 16px;line-height:1.6}pre{background:#f4f4f4;padding:12px;overflow:auto}code{font-family:ui-monospace,monospace}blockquote{border-left:3px solid #ccc;margin:0;padding-left:12px;color:#555}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px 10px}</style>' + lastHtml;
      U.downloadText(doc, 'vistanology.html', 'text/html');
    });
    $('#mp-dlmd', root).addEventListener('click', () => {
      if (!refs.editor.value) return;
      U.downloadText(refs.editor.value, 'vistanology.md', 'text/markdown');
    });

    applyLayout();
    render();
    syncHist();
    return () => {};
  }

  function unmount() { lastHtml = ''; hist = null; }

  VT.registry.add(def);
  return def;
})();