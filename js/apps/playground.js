window.VT = window.VT || {};

/* U9 · HTML/CSS/JS Playground — write HTML, CSS and JS and see it run live in a
 * sandboxed <iframe> (allow-scripts, never allow-same-origin) so user code runs in a
 * unique opaque origin and cannot reach this app, its storage, the network identity or
 * the parent DOM. No eval() anywhere: the frame is built by assigning an srcdoc string,
 * and the console is captured by a small in-frame shim that postMessages serialized
 * strings back to this page. Fully local and offline-capable.
 */
VT.modules['playground'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'playground';
  const AUTOSAVE_ID = 'pg:autosave';
  const MAX_CONSOLE = 200;

  let alive = false;
  let refs = {};
  let autosave = null;
  let autoRun = false;
  let runTimer = null;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- in-frame console/network-free shim (serialized strings only) ----------
  const SHIM = [
    '<' + 'script>(function(){',
    'function fmt(a){try{return Array.prototype.slice.call(a).map(function(x){if(x&&typeof x==="object"){try{return JSON.stringify(x)}catch(e){return String(x)}}return String(x)}).join(" ")}catch(e){return "[unserializable]"}}',
    'function send(l,a){try{parent.postMessage({__pg:1,level:l,msg:fmt(a)},"*")}catch(e){}}',
    '["log","info","warn","error","debug"].forEach(function(k){window.console[k]=function(){send(k==="debug"?"log":k,arguments)}});',
    'window.addEventListener("error",function(e){send("error",[e.message+(e.lineno?(" (line "+e.lineno+")"):"")])});',
    'window.addEventListener("unhandledrejection",function(e){var r=e.reason;send("error",["Unhandled promise rejection: "+((r&&r.message)?r.message:String(r))])});',
    '})();</' + 'script>'
  ].join('');

  // Guard the JS tab against a stray closing tag breaking the frame document;
  // inside JS string literals "<\/script" is identical to "</script", so behavior is preserved.
  const guardScript = (js) => String(js).replace(/<\/(script)/gi, '<\\/$1');

  function buildSrcdoc(html, css, js) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<style>' + (css || '') + '</style></head><body>' +
      (html || '') + SHIM + '<' + 'script>' + guardScript(js || '') + '</' + 'script>' +
      '</body></html>';
  }

  // ---------- templates ----------
  const TEMPLATES = {
    welcome: {
      name: 'pg.tpl.welcome',
      html: '<main class="wrap">\n  <h1>Hello, Playground</h1>\n  <p>Edit <b>HTML</b>, <b>CSS</b> and <b>JS</b> on the left and press <b>Run</b>.</p>\n  <button id="go">Click me</button>\n  <p id="out"></p>\n</main>',
      css: 'body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;background:#0A1B2E;color:#EAF7FF;margin:0;padding:24px}\n.wrap{max-width:460px}\nh1{color:#5FE6FF;margin:0 0 8px}\nbutton{background:#5FE6FF;border:0;color:#04070F;font-weight:600;padding:10px 16px;border-radius:10px;cursor:pointer}\n#out{color:#9DEAFF;margin-top:12px}',
      js: 'let n = 0;\ndocument.getElementById("go").addEventListener("click", () => {\n  n++;\n  document.getElementById("out").textContent = "Clicked " + n + " time(s)";\n  console.log("clicked", n);\n});'
    },
    dom: {
      name: 'pg.tpl.dom',
      html: '<ul id="list"></ul>\n<input id="add" placeholder="new item" />\n<button id="addBtn">Add</button>',
      css: 'body{font-family:system-ui,sans-serif;background:#123049;color:#EAF7FF;padding:24px}\nul{padding-left:18px}\nli{margin:6px 0}\ninput,button{padding:8px;border-radius:8px;border:1px solid rgba(157,234,255,.3);background:#0D2438;color:#EAF7FF}\nbutton{cursor:pointer}',
      js: 'const list = document.getElementById("list");\nfunction add(){\n  const v = document.getElementById("add").value.trim();\n  if(!v) return;\n  const li = document.createElement("li");\n  li.textContent = v;\n  list.appendChild(li);\n  document.getElementById("add").value = "";\n}\ndocument.getElementById("addBtn").addEventListener("click", add);\ndocument.getElementById("add").addEventListener("keydown", e => { if(e.key==="Enter") add(); });'
    },
    canvas: {
      name: 'pg.tpl.canvas',
      html: '<canvas id="c"></canvas>',
      css: 'body{margin:0;background:#04070F}\ncanvas{display:block;width:100vw;height:100vh}',
      js: 'const c = document.getElementById("c");\nconst ctx = c.getContext("2d");\nfunction size(){ c.width = innerWidth; c.height = innerHeight; }\nsize(); addEventListener("resize", size);\nlet t = 0;\nfunction loop(){\n  ctx.clearRect(0,0,c.width,c.height);\n  for(let i=0;i<6;i++){\n    ctx.beginPath();\n    ctx.strokeStyle = "hsl(" + ((t*0.6 + i*30) % 360) + ",90%,65%)";\n    ctx.lineWidth = 3;\n    const r = 60 + i*22 + Math.sin(t/30 + i)*10;\n    ctx.arc(c.width/2, c.height/2, r, 0, Math.PI*2);\n    ctx.stroke();\n  }\n  t++;\n  requestAnimationFrame(loop);\n}\nloop();'
    },
    clock: {
      name: 'pg.tpl.clock',
      html: '<div id="clock">--:--:--</div>',
      css: 'body{display:grid;place-items:center;height:100vh;margin:0;background:#0A1B2E}\n#clock{font:600 clamp(2rem,10vw,5rem)/1 ui-monospace,monospace;color:#5FE6FF;letter-spacing:2px}',
      js: 'const el = document.getElementById("clock");\nfunction tick(){\n  const d = new Date();\n  el.textContent = [d.getHours(),d.getMinutes(),d.getSeconds()].map(n => String(n).padStart(2,"0")).join(":");\n}\ntick();\nsetInterval(tick, 1000);'
    }
  };

  // ---------- console capture ----------
  function logLine(level, msg) {
    if (!alive || !refs.console) return;
    const empty = refs.console.querySelector('.pg-con-empty');
    if (empty) empty.remove();
    const line = document.createElement('div');
    line.className = 'pg-con-line pg-con-' + level;
    const tag = document.createElement('span'); tag.className = 'pg-con-tag'; tag.textContent = level;
    const body = document.createElement('span'); body.className = 'pg-con-msg'; body.textContent = msg;
    line.append(tag, body);
    refs.console.append(line);
    while (refs.console.children.length > MAX_CONSOLE) refs.console.removeChild(refs.console.firstChild);
    refs.console.scrollTop = refs.console.scrollHeight;
  }

  function clearConsole() {
    refs.console.innerHTML = '';
    const e = document.createElement('div'); e.className = 'pg-con-empty'; e.textContent = t('pg.conEmpty');
    refs.console.append(e);
  }

  let messageHandler = null;
  function onMessage(e) {
    const d = e.data;
    if (!d || d.__pg !== 1) return;
    logLine(String(d.level || 'log'), String(d.msg == null ? '' : d.msg));
  }

  // ---------- run ----------
  function current() {
    return {
      html: refs.htmlTa.value,
      css: refs.cssTa.value,
      js: refs.jsTa.value
    };
  }

  function run() {
    if (!alive) return;
    clearConsole();
    refs.frame.srcdoc = buildSrcdoc(refs.htmlTa.value, refs.cssTa.value, refs.jsTa.value);
    refs.hint.textContent = t('pg.ran');
    if (autosave) autosave();
  }

  function scheduleRun() {
    if (!autoRun) return;
    clearTimeout(runTimer);
    runTimer = setTimeout(run, 600);
  }

  // ---------- standalone export ----------
  function standaloneHTML() {
    const d = current();
    return '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>Vistanology Playground</title>\n<style>\n' + d.css + '\n</style>\n</head>\n<body>\n' + d.html + '\n<script>\n' + d.js + '\n<\/script>\n</body>\n</html>\n';
  }

  // ---------- persistence ----------
  function loadProjects() {
    refs.projList.innerHTML = '';
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty pg-empty">' + esc(t('pg.dbUnavailable')) + '</div>'; return; }
    VT.db.list('playground').then((rows) => {
      rows = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.projList.innerHTML = '<div class="bench-empty pg-empty">' + esc(t('pg.projEmpty')) + '</div>'; return; }
      rows.forEach((r) => {
        const el = document.createElement('div'); el.className = 'bench-row pg-proj-row';
        const info = document.createElement('div'); info.className = 'pg-proj-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('pg.projUntitled');
        const meta = document.createElement('span'); meta.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(nm, meta);
        const open = document.createElement('button'); open.type = 'button'; open.className = 'btn btn-ghost btn-sm'; open.textContent = t('pg.projOpen');
        open.addEventListener('click', () => {
          const data = (r.data) || {};
          refs.htmlTa.value = data.html || ''; refs.cssTa.value = data.css || ''; refs.jsTa.value = data.js || '';
          run(); toast(t('pg.projOpened', { name: r.name || t('pg.projUntitled') }), 'success');
        });
        el.append(info, open);
        refs.projList.append(el);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty pg-empty">' + esc(t('pg.dbError')) + '</div>'; });
  }

  function applyTemplate(id) {
    const p = TEMPLATES[id]; if (!p) return;
    refs.htmlTa.value = p.html; refs.cssTa.value = p.css; refs.jsTa.value = p.js;
    run();
    refs.hint.textContent = t('pg.tplApplied', { name: t(p.name) });
  }

  // ---------- tabs ----------
  function selectTab(name) {
    $$('.pg-tab', refs.stage).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    $$('.pg-editor', refs.stage).forEach((p) => { p.hidden = p.dataset.pane !== name; });
  }

  function mount(root) {
    alive = true;
    autoRun = false;
    const saved = VT.store.get(KEY, null);
    const doc = saved && saved.doc ? saved.doc : { html: TEMPLATES.welcome.html, css: TEMPLATES.welcome.css, js: TEMPLATES.welcome.js };
    const I = VT.icons;

    root.innerHTML = `
      <div class="pg-stage glass-2" id="pg-stage">
        <div class="pg-bar">
          <button class="btn btn-primary btn-sm" id="pg-run" aria-keyshortcuts="Control+Enter">${I.check} ${t('pg.run')}</button>
          <label class="pg-toggle"><input type="checkbox" id="pg-auto"><span>${t('pg.autoRun')}</span></label>
          <span class="pg-sep" aria-hidden="true"></span>
          <span class="pg-vp" role="group" aria-label="${t('pg.viewport')}">
            <button class="btn btn-ghost btn-sm is-on" data-vp="desktop">${t('pg.vpDesktop')}</button>
            <button class="btn btn-ghost btn-sm" data-vp="mobile">${t('pg.vpMobile')}</button>
          </span>
          <span class="pg-sep" aria-hidden="true"></span>
          <select class="input pg-select" id="pg-tpl" aria-label="${t('pg.templates')}">
            <option value="">${t('pg.templates')}</option>
            ${Object.keys(TEMPLATES).map((k) => '<option value="' + k + '">' + esc(t(TEMPLATES[k].name)) + '</option>').join('')}
          </select>
          <button class="btn btn-ghost btn-sm" id="pg-reset">${I.broom} ${t('pg.reset')}</button>
          <span class="pg-bar-actions">
            <button class="btn btn-ghost btn-sm" id="pg-copy">${I.copy} ${t('pg.copy')}</button>
            <button class="btn btn-ghost btn-sm" id="pg-export">${I.download} ${t('pg.export')}</button>
          </span>
        </div>
        <div class="pg-hint" id="pg-hint" role="status" aria-live="polite"></div>

        <div class="pg-work">
          <section class="pg-editors" aria-label="${t('pg.editors')}">
            <div class="pg-tabs" role="tablist">
              <button class="pg-tab is-on" role="tab" data-tab="html" aria-selected="true">HTML</button>
              <button class="pg-tab" role="tab" data-tab="css" aria-selected="false">CSS</button>
              <button class="pg-tab" role="tab" data-tab="js" aria-selected="false">JS</button>
            </div>
            <div class="pg-pane pg-editor" data-pane="html"><textarea id="pg-html" spellcheck="false" aria-label="HTML"></textarea></div>
            <div class="pg-pane pg-editor" data-pane="css" hidden><textarea id="pg-css" spellcheck="false" aria-label="CSS"></textarea></div>
            <div class="pg-pane pg-editor" data-pane="js" hidden><textarea id="pg-js" spellcheck="false" aria-label="JavaScript"></textarea></div>
          </section>

          <section class="pg-right" aria-label="${t('pg.preview')}">
            <div class="pg-frame-wrap" id="pg-frame-wrap">
              <iframe id="pg-frame" class="pg-frame" sandbox="allow-scripts" title="${t('pg.preview')}"></iframe>
            </div>
            <div class="pg-con-head">${I.code} ${t('pg.console')} <button class="btn btn-ghost btn-sm pg-con-clear" id="pg-con-clear">${t('pg.clear')}</button></div>
            <div class="pg-console" id="pg-console" aria-live="polite"></div>
          </section>

          <aside class="pg-side">
            <div class="pg-col-head">${t('pg.projList')}</div>
            <div class="pg-proj-save">
              <input class="input" id="pg-proj-name" type="text" placeholder="${t('pg.projNamePh')}" aria-label="${t('pg.projNamePh')}">
              <button class="btn btn-ghost btn-sm" id="pg-proj-save">${I.file} ${t('pg.projSave')}</button>
            </div>
            <div class="bench-list pg-proj-list" id="pg-proj-list"></div>
          </aside>
        </div>

        <p class="privacy-line">${I.shield} ${t('pg.privacy')}</p>
      </div>`;

    refs = {
      stage: $('#pg-stage', root),
      htmlTa: $('#pg-html', root), cssTa: $('#pg-css', root), jsTa: $('#pg-js', root),
      frame: $('#pg-frame', root), frameWrap: $('#pg-frame-wrap', root),
      console: $('#pg-console', root), hint: $('#pg-hint', root),
      auto: $('#pg-auto', root), tpl: $('#pg-tpl', root),
      projList: $('#pg-proj-list', root), projName: $('#pg-proj-name', root)
    };

    refs.htmlTa.value = doc.html || '';
    refs.cssTa.value = doc.css || '';
    refs.jsTa.value = doc.js || '';

    autosave = U.debounce(() => {
      if (!alive) return;
      VT.store.set(KEY, { doc: current() });
      if (VT.db.available) VT.db.put({ id: AUTOSAVE_ID, tool: 'playground', name: '(autosave)', data: current() }).catch(() => {});
    }, 700);

    messageHandler = onMessage;
    window.addEventListener('message', messageHandler);

    clearConsole();

    refs.auto.addEventListener('change', () => { autoRun = refs.auto.checked; refs.hint.textContent = autoRun ? t('pg.autoOn') : t('pg.autoOff'); if (autoRun) scheduleRun(); });

    [refs.htmlTa, refs.cssTa, refs.jsTa].forEach((ta) => {
      ta.addEventListener('input', () => { scheduleRun(); if (autosave) autosave(); });
    });

    $('#pg-run', root).addEventListener('click', run);

    $$('.pg-tab', root).forEach((b) => b.addEventListener('click', () => selectTab(b.dataset.tab)));

    $$('.pg-vp .btn', root).forEach((b) => b.addEventListener('click', () => {
      $$('.pg-vp .btn', root).forEach((x) => x.classList.remove('is-on'));
      b.classList.add('is-on');
      const vp = b.dataset.vp;
      refs.frameWrap.dataset.vp = vp;
      refs.frame.classList.toggle('pg-frame-mobile', vp === 'mobile');
    }));

    refs.tpl.addEventListener('change', () => { if (refs.tpl.value) { applyTemplate(refs.tpl.value); refs.tpl.selectedIndex = 0; } });

    $('#pg-reset', root).addEventListener('click', () => {
      refs.htmlTa.value = ''; refs.cssTa.value = ''; refs.jsTa.value = '';
      run(); refs.hint.textContent = t('pg.resetDone');
    });

    $('#pg-con-clear', root).addEventListener('click', clearConsole);

    $('#pg-copy', root).addEventListener('click', async () => {
      const ok = await U.copyText(standaloneHTML());
      toast(ok ? t('pg.copied') : t('pg.copyFail'), ok ? 'success' : 'error');
    });

    $('#pg-export', root).addEventListener('click', () => {
      U.downloadText(standaloneHTML(), 'vistanology-playground.html', 'text/html');
      toast(t('pg.exported'), 'success');
    });

    $('#pg-proj-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('pg.dbUnavailable'), 'error'); return; }
      const name = refs.projName.value.trim() || t('pg.projUntitled');
      refs.projName.value = name;
      try { await VT.db.put({ tool: 'playground', name, data: current() }); toast(t('pg.projSaved', { name }), 'success'); loadProjects(); }
      catch (e) { toast(t('pg.dbError'), 'error'); }
    });

    root.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    });

    selectTab('html');
    loadProjects();

    // restore autosave (authoritative over the localStorage draft), run it once, then label the restore
    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then((rec) => {
        if (!alive) return;
        const restored = !!(rec && rec.data);
        if (restored) {
          refs.htmlTa.value = rec.data.html || ''; refs.cssTa.value = rec.data.css || ''; refs.jsTa.value = rec.data.js || '';
        }
        run();
        if (restored) refs.hint.textContent = t('pg.restored');
      }).catch(() => { if (alive) run(); });
    } else {
      run();
    }

    return () => {
      alive = false;
      clearTimeout(runTimer);
      if (messageHandler) window.removeEventListener('message', messageHandler);
      messageHandler = null;
      VT.store.set(KEY, { doc: current() });
    };
  }

  function unmount() {
    alive = false; autosave = null; runTimer = null; refs = {};
    if (messageHandler) { window.removeEventListener('message', messageHandler); messageHandler = null; }
  }

  const def = {
    id: 'playground', cat: 'developer', icon: 'code', version: '0.1.0',
    name: { en: 'Playground', pt: 'Playground' },
    tagline: {
      en: 'Write HTML, CSS and JavaScript and watch it run live in a sandboxed frame — templates, auto-run, a captured console and standalone export. Your code never reaches this app and no eval is used. Fully offline.',
      pt: 'Escreva HTML, CSS e JavaScript e veja rodar ao vivo em um quadro isolado — modelos, execução automática, console capturado e exportação autônoma. Seu código nunca alcança este app e nenhum eval é usado. Totalmente offline.'
    },
    tags: ['html', 'css', 'js', 'playground', 'sandbox', 'code', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'A local code playground. Type HTML, CSS and JS, run them in a sandboxed iframe, read the captured console, load templates, and export a single standalone .html file.',
        usage: [
          'Pick a template — Welcome, DOM & events, Canvas animation or Live clock — or start from the blank document.',
          'Edit the HTML, CSS and JS tabs, then press Run or Ctrl/Cmd+Enter; tick Auto-run to refresh 600 ms after you stop typing.',
          'Switch the frame between Desktop and Mobile to check the layout.',
          'Read your log/warn/error output in the console (Clear empties it), then Copy HTML or Export .html.'
        ],
        privacy: 'Your code runs only inside a sandboxed iframe with allow-scripts but never allow-same-origin, so it executes in a unique opaque origin: it cannot read or write this app, its storage or the page around it. Nothing is uploaded. No eval() is used — the frame is built by assigning its document and the console is captured through a serialized postMessage shim.',
        limits: [
          'The frame is sandbox="allow-scripts" without allow-same-origin, so localStorage, cookies and any parent access are unavailable inside the preview by design.',
          'Code you write can still make its own network requests: they leave from an opaque origin and are subject to CORS, which most third-party APIs reject — keep demos self-contained.',
          'The console keeps the last 200 lines and serializes logged values as JSON, so functions and DOM nodes arrive lossy or as "[unserializable]".'
        ]
      },
      pt: {
        summary: 'Um playground de código local. Digite HTML, CSS e JS, execute-os em um iframe isolado, leia o console capturado, carregue modelos e exporte um arquivo .html autônomo.',
        usage: [
          'Escolha um modelo — Boas-vindas, DOM e eventos, Animação em canvas ou Relógio ao vivo — ou comece pelo documento em branco.',
          'Edite as abas HTML, CSS e JS e pressione Executar ou Ctrl/Cmd+Enter; marque Execução automática para atualizar 600 ms depois de você parar de digitar.',
          'Alterne o quadro entre Desktop e Celular para conferir o layout.',
          'Leia sua saída de log/aviso/erro no console (Limpar esvazia), depois Copie o HTML ou exporte .html.'
        ],
        privacy: 'Seu código roda apenas dentro de um iframe isolado com allow-scripts, mas nunca allow-same-origin, então executa em uma origem opaca única: não consegue ler nem escrever neste app, em seu armazenamento ou na página ao redor. Nada é enviado. Nenhum eval() é usado — o quadro é construído atribuindo seu documento e o console é capturado por um shim de postMessage serializado.',
        limits: [
          'O quadro é sandbox="allow-scripts" sem allow-same-origin, então localStorage, cookies e qualquer acesso ao pai ficam indisponíveis na prévia, por projeto.',
          'O código que você escreve ainda pode fazer requisições próprias: elas saem de uma origem opaca e estão sujeitas a CORS, que a maioria das APIs de terceiros rejeita — mantenha as demos autossuficientes.',
          'O console guarda as últimas 200 linhas e serializa os valores logados como JSON, então funções e nós do DOM chegam com perdas ou como "[unserializable]".'
        ]
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'pg.run': 'Run', 'pg.autoRun': 'Auto-run', 'pg.viewport': 'Viewport', 'pg.vpDesktop': 'Desktop', 'pg.vpMobile': 'Mobile',
      'pg.templates': 'Templates', 'pg.reset': 'Clear', 'pg.copy': 'Copy HTML', 'pg.export': 'Export .html', 'pg.clear': 'Clear',
      'pg.editors': 'Editors', 'pg.preview': 'Preview', 'pg.console': 'Console', 'pg.projList': 'Saved',
      'pg.tpl.welcome': 'Welcome', 'pg.tpl.dom': 'DOM & events', 'pg.tpl.canvas': 'Canvas animation', 'pg.tpl.clock': 'Live clock',
      'pg.conEmpty': 'No output yet — press Run.', 'pg.ran': 'Ran your code', 'pg.autoOn': 'Auto-run on', 'pg.autoOff': 'Auto-run off',
      'pg.tplApplied': 'Template "{name}" loaded', 'pg.resetDone': 'Editors cleared', 'pg.restored': 'Restored your last snippet',
      'pg.copied': 'HTML copied to clipboard', 'pg.copyFail': 'Could not copy — export the file instead.', 'pg.exported': 'Downloaded standalone .html',
      'pg.projNamePh': 'Snippet name…', 'pg.projSave': 'Save', 'pg.projOpen': 'Open', 'pg.projUntitled': 'Untitled snippet',
      'pg.projEmpty': 'Nothing saved yet.', 'pg.projSaved': 'Saved "{name}"', 'pg.projOpened': 'Opened "{name}"',
      'pg.dbUnavailable': 'Local storage unavailable — snippets cannot be saved.', 'pg.dbError': 'Could not reach local storage.',
      'pg.privacy': 'Code runs only in a sandboxed frame with a unique opaque origin — it cannot reach this app or your files. No eval, no upload.'
    },
    pt: {
      'pg.run': 'Executar', 'pg.autoRun': 'Execução automática', 'pg.viewport': 'Janela', 'pg.vpDesktop': 'Desktop', 'pg.vpMobile': 'Mobile',
      'pg.templates': 'Modelos', 'pg.reset': 'Limpar', 'pg.copy': 'Copiar HTML', 'pg.export': 'Exportar .html', 'pg.clear': 'Limpar',
      'pg.editors': 'Editores', 'pg.preview': 'Prévia', 'pg.console': 'Console', 'pg.projList': 'Salvos',
      'pg.tpl.welcome': 'Boas-vindas', 'pg.tpl.dom': 'DOM e eventos', 'pg.tpl.canvas': 'Animação em canvas', 'pg.tpl.clock': 'Relógio ao vivo',
      'pg.conEmpty': 'Sem saída ainda — pressione Executar.', 'pg.ran': 'Seu código foi executado', 'pg.autoOn': 'Execução automática ativada', 'pg.autoOff': 'Execução automática desativada',
      'pg.tplApplied': 'Modelo "{name}" carregado', 'pg.resetDone': 'Editores limpos', 'pg.restored': 'Snippet anterior restaurado',
      'pg.copied': 'HTML copiado para a área de transferência', 'pg.copyFail': 'Não foi possível copiar — exporte o arquivo.', 'pg.exported': 'Arquivo .html autônomo baixado',
      'pg.projNamePh': 'Nome do snippet…', 'pg.projSave': 'Salvar', 'pg.projOpen': 'Abrir', 'pg.projUntitled': 'Snippet sem nome',
      'pg.projEmpty': 'Nada salvo ainda.', 'pg.projSaved': 'Salvo "{name}"', 'pg.projOpened': 'Aberto "{name}"',
      'pg.dbUnavailable': 'Armazenamento local indisponível — snippets não podem ser salvos.', 'pg.dbError': 'Não foi possível acessar o armazenamento local.',
      'pg.privacy': 'O código roda apenas em um quadro isolado com origem opaca única — não alcança este app nem seus arquivos. Sem eval, sem envio.'
    }
  });

  VT.registry.add(def);
  return def;
})();
