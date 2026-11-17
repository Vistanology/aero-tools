window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['hash-generator'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'hg.text': 'Text', 'hg.file': 'File', 'hg.textPh': 'Type or paste text to hash…',
      'hg.drop': 'Drop a file here, or', 'hg.choose': 'choose a file', 'hg.upper': 'Uppercase hex',
      'hg.sample': 'Sample', 'hg.clear': 'Clear', 'hg.dl': 'Download .txt',
      'hg.bytes': 'input bytes', 'hg.algs': 'algorithms', 'hg.result': 'Digests',
      'hg.match': 'Identify a hash', 'hg.matchPh': 'Paste a hash to identify its algorithm…',
      'hg.matchNone': 'No match', 'hg.matchEmpty': 'Paste a hash to identify',
      'hg.empty': 'Waiting for input…', 'hg.ready': 'hashed', 'hg.fileErr': 'Could not read file.',
      'hg.noCrypto': 'Web Crypto is unavailable in this context.',
      'hg.copied': 'Copied to clipboard', 'hg.copyFail': 'Could not copy — select and copy manually.',
      'hg.copy': 'Copy',
      'hg.privacy': 'Hashes are computed locally with Web Crypto. Nothing is uploaded.'
    },
    pt: {
      'hg.text': 'Texto', 'hg.file': 'Arquivo', 'hg.textPh': 'Digite ou cole o texto para hashear…',
      'hg.drop': 'Solte um arquivo aqui, ou', 'hg.choose': 'escolha um arquivo', 'hg.upper': 'Hex maiúsculo',
      'hg.sample': 'Exemplo', 'hg.clear': 'Limpar', 'hg.dl': 'Baixar .txt',
      'hg.bytes': 'bytes de entrada', 'hg.algs': 'algoritmos', 'hg.result': 'Digests',
      'hg.match': 'Identificar um hash', 'hg.matchPh': 'Cole um hash para identificar o algoritmo…',
      'hg.matchNone': 'Sem correspondência', 'hg.matchEmpty': 'Cole um hash para identificar',
      'hg.empty': 'Aguardando entrada…', 'hg.ready': 'hasheado', 'hg.fileErr': 'Não foi possível ler o arquivo.',
      'hg.noCrypto': 'Web Crypto indisponível neste contexto.',
      'hg.copied': 'Copiado para a área de transferência', 'hg.copyFail': 'Não foi possível copiar — selecione e copie manualmente.',
      'hg.copy': 'Copiar',
      'hg.privacy': 'Os hashes são computados localmente com Web Crypto. Nada é enviado.'
    }
  });

  const def = {
    id: 'hash-generator', cat: 'developer', icon: 'hash', version: '1.0.0',
    name: { en: 'Hash Generator', pt: 'Gerador de Hash' },
    tagline: {
      en: 'SHA-1 / SHA-256 / SHA-384 / SHA-512 of text or a local file via Web Crypto, with uppercase hex, per-digest copy, hash identification and .txt export.',
      pt: 'SHA-1 / SHA-256 / SHA-384 / SHA-512 de texto ou arquivo local via Web Crypto, com hex maiúsculo, cópia por digest, identificação de hash e exportação .txt.'
    },
    tags: ['hash', 'sha', 'sha256', 'checksum', 'crypto', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'A local checksum workbench: hash text or a local file with SHA-1, SHA-256, SHA-384 and SHA-512 using the browser Web Crypto API, toggle uppercase hex, copy any digest, identify which algorithm a pasted hash belongs to, and export all digests as a .txt.',
        usage: [
          'Choose Text or File mode; type/paste text or drop/choose a local file.',
          'Read the four digests; toggle uppercase hex as needed.',
          'Copy a single digest, or download all of them as a .txt.',
          'Paste a known hash into "Identify a hash" to see which algorithm produced it.'
        ],
        privacy: 'All hashing runs in memory via crypto.subtle. Files never leave the browser; only mode and hex-case are persisted.',
        limits: [
          'Only the SHA family provided by Web Crypto (SHA-1/256/384/512); MD5 is not available in Web Crypto.',
          'SHA-1 is included for legacy checksums only and is not collision-resistant.',
          'Very large files are hashed in one pass and may briefly block the UI.'
        ]
      },
      pt: {
        summary: 'Uma bancada local de checksums: hasheie texto ou um arquivo local com SHA-1, SHA-256, SHA-384 e SHA-512 usando a Web Crypto API do navegador, alterne hex maiúsculo, copie qualquer digest, identifique a qual algoritmo um hash colado pertence e exporte todos como .txt.',
        usage: [
          'Escolha Texto ou Arquivo; digite/cole texto ou solte/escolha um arquivo local.',
          'Leia os quatro digests; alterne hex maiúsculo conforme necessário.',
          'Copie um digest individual ou baixe todos como .txt.',
          'Cole um hash conhecido em "Identificar um hash" para ver qual algoritmo o produziu.'
        ],
        privacy: 'Todo o hashing roda em memória via crypto.subtle. Arquivos nunca saem do navegador; só modo e caixa do hex são persistidos.',
        limits: [
          'Apenas a família SHA da Web Crypto (SHA-1/256/384/512); MD5 não existe na Web Crypto.',
          'SHA-1 é incluído só para checksums legados e não é resistente a colisões.',
          'Arquivos muito grandes são hasheados em uma passada e podem bloquear a UI brevemente.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'hash-generator';
  const ALGS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
  let state = { mode: 'text', upper: false };
  let refs = {};
  let digests = null;
  let fileBuffer = null;
  let fileInfo = null;
  let seq = 0;

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (['text', 'file'].includes(s.mode)) state.mode = s.mode;
    if (typeof s.upper === 'boolean') state.upper = s.upper;
  }

  const hex = (buf) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const shown = (h) => state.upper ? h.toUpperCase() : h;

  async function compute(buffer) {
    const my = ++seq;
    if (!crypto || !crypto.subtle) {
      digests = null; refs.status.className = 'hg-status bad'; refs.status.textContent = t('hg.noCrypto');
      refs.out.innerHTML = ''; return;
    }
    const res = {};
    for (const alg of ALGS) {
      const d = await crypto.subtle.digest(alg, buffer);
      if (my !== seq) return;
      res[alg] = hex(d);
    }
    if (my !== seq) return;
    digests = res;
    refs.status.className = 'hg-status ok';
    refs.status.textContent = t('hg.ready');
    renderOut(); updateMatch();
  }

  function renderOut() {
    if (!digests) { refs.out.innerHTML = ''; return; }
    refs.out.innerHTML = ALGS.map(alg =>
      '<div class="hg-row"><span class="hg-alg">' + alg + '</span>' +
      '<code class="hg-digest" id="hg-d-' + alg + '">' + esc(shown(digests[alg])) + '</code>' +
      '<button class="btn btn-ghost btn-sm hg-copy" data-alg="' + alg + '" aria-label="' + t('hg.copy') + ' ' + alg + '">' + VT.icons.copy + '</button></div>'
    ).join('');
  }

  function updateMatch() {
    const q = refs.match.value.trim().toLowerCase();
    refs.matchStatus.className = 'hg-matchstatus';
    if (!q) { refs.matchStatus.textContent = t('hg.matchEmpty'); return; }
    if (!digests) { refs.matchStatus.textContent = t('hg.empty'); return; }
    const hits = ALGS.filter(a => digests[a] === q);
    if (hits.length) { refs.matchStatus.classList.add('ok'); refs.matchStatus.textContent = hits.join(' · '); }
    else { refs.matchStatus.classList.add('bad'); refs.matchStatus.textContent = t('hg.matchNone'); }
  }

  function setBytes(n) { refs.bytes.textContent = n == null ? '—' : U.formatBytes(n); }

  function run() {
    refs.status.className = 'hg-status';
    if (state.mode === 'text') {
      const txt = refs.text.value;
      if (!txt) { digests = null; refs.status.textContent = t('hg.empty'); refs.out.innerHTML = ''; setBytes(null); updateMatch(); return; }
      const enc = new TextEncoder().encode(txt);
      setBytes(enc.length);
      compute(enc.buffer);
    } else {
      if (!fileBuffer) { digests = null; refs.status.textContent = t('hg.empty'); refs.out.innerHTML = ''; setBytes(null); updateMatch(); return; }
      setBytes(fileInfo ? fileInfo.size : fileBuffer.byteLength);
      compute(fileBuffer);
    }
  }
  const runSoon = U.debounce(run, 180);

  async function loadFile(file) {
    if (!file) return;
    try {
      fileBuffer = await file.arrayBuffer();
      fileInfo = { name: file.name, size: file.size };
      refs.fname.textContent = file.name;
      refs.fsize.textContent = U.formatBytes(file.size);
      refs.filemeta.hidden = false;
      run();
    } catch (e) {
      fileBuffer = null; fileInfo = null;
      refs.status.className = 'hg-status bad'; refs.status.textContent = t('hg.fileErr');
    }
  }

  function mount(root) {
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="hg-stage glass-2">
        <div id="hg-tab">
        <div class="hg-bar">
          <div class="hg-tabs" role="tablist" aria-label="${t('hg.result')}">
            <button class="tab" role="tab" data-tab="text" aria-selected="${state.mode === 'text'}">${t('hg.text')}</button>
            <button class="tab" role="tab" data-tab="file" aria-selected="${state.mode === 'file'}">${t('hg.file')}</button>
          </div>
          <label class="hg-check"><input type="checkbox" id="hg-upper" ${state.upper ? 'checked' : ''}> ${t('hg.upper')}</label>
          <span class="hg-status" id="hg-status"></span>
        </div>
        <div id="hg-panel-text" data-panel="text">
          <textarea class="input hg-text" id="hg-text" spellcheck="false" placeholder="${t('hg.textPh')}"></textarea>
        </div>
        <div id="hg-panel-file" data-panel="file" hidden>
          <div class="hg-drop" id="hg-drop">
            ${I.upload}
            <span>${t('hg.drop')} <button class="hg-choose" id="hg-choose">${t('hg.choose')}</button></span>
            <input type="file" id="hg-file" hidden>
          </div>
          <p class="hg-filemeta" id="hg-filemeta" hidden><span id="hg-fname"></span> · <span id="hg-fsize"></span></p>
        </div>
        </div>
        <div class="hg-actions">
          <button class="btn btn-ghost btn-sm" id="hg-sample">${I.sparkle} ${t('hg.sample')}</button>
          <button class="btn btn-ghost btn-sm" id="hg-clear">${I.x} ${t('hg.clear')}</button>
        </div>
        <dl class="hg-stats">
          <div><dt>${t('hg.bytes')}</dt><dd id="hg-bytes">—</dd></div>
          <div><dt>${t('hg.algs')}</dt><dd>${ALGS.length}</dd></div>
        </dl>
        <span class="hg-label">${t('hg.result')}</span>
        <div class="hg-out" id="hg-out"></div>
        <div class="hg-matchwrap">
          <label class="hg-label" for="hg-match">${t('hg.match')}</label>
          <input class="input hg-match" id="hg-match" spellcheck="false" placeholder="${t('hg.matchPh')}">
          <span class="hg-matchstatus" id="hg-matchstatus"></span>
        </div>
        <div class="hg-actions">
          <button class="btn btn-ghost btn-sm" id="hg-dl">${I.download} ${t('hg.dl')}</button>
        </div>
        <p class="privacy-line">${I.shield} ${t('hg.privacy')}</p>
      </div>`;

    refs = {
      text: $('#hg-text', root), status: $('#hg-status', root), out: $('#hg-out', root),
      bytes: $('#hg-bytes', root), match: $('#hg-match', root), matchStatus: $('#hg-matchstatus', root),
      file: $('#hg-file', root), drop: $('#hg-drop', root), fname: $('#hg-fname', root),
      fsize: $('#hg-fsize', root), filemeta: $('#hg-filemeta', root)
    };

    VT.ui.tabs($('#hg-tab', root), (id) => { state.mode = id; persist(); run(); });
    refs.text.addEventListener('input', runSoon);
    $('#hg-upper', root).addEventListener('change', (e) => { state.upper = e.target.checked; persist(); renderOut(); });
    refs.match.addEventListener('input', updateMatch);
    $('#hg-sample', root).addEventListener('click', () => { refs.text.value = 'Vistanology — café, 日本語, 🌌'; run(); });
    $('#hg-clear', root).addEventListener('click', () => {
      refs.text.value = ''; fileBuffer = null; fileInfo = null; refs.filemeta.hidden = true;
      refs.match.value = ''; run();
    });
    $('#hg-choose', root).addEventListener('click', () => refs.file.click());
    refs.file.addEventListener('change', () => loadFile(refs.file.files[0]));
    refs.drop.addEventListener('dragover', (e) => { e.preventDefault(); refs.drop.classList.add('over'); });
    refs.drop.addEventListener('dragleave', () => refs.drop.classList.remove('over'));
    refs.drop.addEventListener('drop', (e) => { e.preventDefault(); refs.drop.classList.remove('over'); loadFile(e.dataTransfer.files[0]); });
    refs.out.addEventListener('click', async (e) => {
      const btn = e.target.closest('.hg-copy'); if (!btn || !digests) return;
      const ok = await U.copyText(shown(digests[btn.dataset.alg]));
      toast(ok ? t('hg.copied') : t('hg.copyFail'), ok ? 'success' : 'error');
    });
    $('#hg-dl', root).addEventListener('click', () => {
      if (!digests) return;
      const body = ALGS.map(a => a + ': ' + shown(digests[a])).join('\n');
      U.downloadText(body, 'vistanology-hashes.txt', 'text/plain');
    });

    run();
    return () => {};
  }

  function unmount() { seq++; digests = null; fileBuffer = null; fileInfo = null; }

  VT.registry.add(def);
  return def;
})();