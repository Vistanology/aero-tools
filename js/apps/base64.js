window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['base64'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'b64.encode': 'Encode', 'b64.decode': 'Decode', 'b64.input': 'Input', 'b64.output': 'Output',
      'b64.inEnc': 'Text to encode', 'b64.inDec': 'Base64 to decode', 'b64.placeholderEnc': 'Type or paste text…',
      'b64.placeholderDec': 'Paste Base64…', 'b64.urlsafe': 'URL-safe', 'b64.wrap': 'Wrap 76 cols',
      'b64.sample': 'Sample', 'b64.clear': 'Clear', 'b64.copy': 'Copy', 'b64.download': 'Download',
      'b64.swap': 'Swap', 'b64.empty': 'Waiting for input…', 'b64.ok': 'OK', 'b64.bad': 'Invalid Base64',
      'b64.m.in': 'Input bytes', 'b64.m.out': 'Output chars', 'b64.m.outBytes': 'Output bytes',
      'b64.copied': 'Copied to clipboard', 'b64.copyFail': 'Could not copy — select and copy manually.',
      'b64.downloaded': 'Downloaded', 'b64.privacy': 'Encoding and decoding run entirely in your browser. Nothing is uploaded.'
    },
    pt: {
      'b64.encode': 'Codificar', 'b64.decode': 'Decodificar', 'b64.input': 'Entrada', 'b64.output': 'Saída',
      'b64.inEnc': 'Texto a codificar', 'b64.inDec': 'Base64 a decodificar', 'b64.placeholderEnc': 'Digite ou cole texto…',
      'b64.placeholderDec': 'Cole Base64…', 'b64.urlsafe': 'URL-safe', 'b64.wrap': 'Quebrar 76 col',
      'b64.sample': 'Exemplo', 'b64.clear': 'Limpar', 'b64.copy': 'Copiar', 'b64.download': 'Baixar',
      'b64.swap': 'Inverter', 'b64.empty': 'Aguardando entrada…', 'b64.ok': 'OK', 'b64.bad': 'Base64 inválido',
      'b64.m.in': 'Bytes de entrada', 'b64.m.out': 'Chars de saída', 'b64.m.outBytes': 'Bytes de saída',
      'b64.copied': 'Copiado para a área de transferência', 'b64.copyFail': 'Não foi possível copiar — selecione e copie manualmente.',
      'b64.downloaded': 'Baixado', 'b64.privacy': 'Codificação e decodificação rodam inteiramente no navegador. Nada é enviado.'
    }
  });

  const def = {
    id: 'base64', cat: 'developer', icon: 'binary', version: '1.0.0',
    name: { en: 'Base64', pt: 'Base64' },
    tagline: {
      en: 'Encode and decode Base64 with full UTF-8 support, a URL-safe variant and MIME line wrapping, with live validation.',
      pt: 'Codifique e decodifique Base64 com UTF-8 completo, variante URL-safe e quebra de linha MIME, com validação ao vivo.'
    },
    tags: ['base64', 'encode', 'decode', 'utf8', 'url-safe', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'A local Base64 workbench: text→Base64 and Base64→text with correct UTF-8 (multi-byte) handling, optional URL-safe alphabet (-_ without padding), optional 76-column MIME wrapping, live invalid-input detection, byte/char stats, swap, copy and download.',
        usage: [
          'Choose Encode or Decode.',
          'Type or paste the input (or load the sample).',
          'Toggle URL-safe for websafe tokens, or Wrap 76 cols for MIME-style output.',
          'Read the live status and byte/char stats; invalid Base64 is flagged on decode.',
          'Swap the result back into the input, copy it, or download it.'
        ],
        privacy: 'All conversion happens in memory in your browser. Nothing is uploaded or stored.',
        limits: [
          'Decode accepts standard and URL-safe alphabets and ignores whitespace; padding is restored automatically.',
          'Decoded bytes are interpreted as UTF-8; non-UTF-8 binary will show replacement characters.',
          'Very large inputs are processed synchronously and may briefly block the UI.'
        ]
      },
      pt: {
        summary: 'Uma bancada Base64 local: texto→Base64 e Base64→texto com UTF-8 (multi-byte) correto, alfabeto URL-safe opcional (-_ sem padding), quebra MIME opcional de 76 colunas, detecção ao vivo de entrada inválida, estatísticas de bytes/chars, inverter, copiar e baixar.',
        usage: [
          'Escolha Codificar ou Decodificar.',
          'Digite ou cole a entrada (ou carregue o exemplo).',
          'Ative URL-safe para tokens websafe, ou Quebrar 76 col para saída estilo MIME.',
          'Leia o status ao vivo e as estatísticas; Base64 inválido é sinalizado na decodificação.',
          'Inverta o resultado para a entrada, copie ou baixe.'
        ],
        privacy: 'Toda a conversão ocorre em memória no navegador. Nada é enviado ou armazenado.',
        limits: [
          'A decodificação aceita alfabetos padrão e URL-safe e ignora espaços; o padding é restaurado automaticamente.',
          'Os bytes decodificados são interpretados como UTF-8; binário não-UTF-8 mostrará caracteres de substituição.',
          'Entradas muito grandes são processadas de forma síncrona e podem bloquear a UI brevemente.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'base64';
  let alive = false;
  let state = { mode: 'encode', urlsafe: false, wrap: false };
  let lastOut = '';
  let refs = {};
  let modeTabs = null;

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (['encode', 'decode'].includes(s.mode)) state.mode = s.mode;
    if (typeof s.urlsafe === 'boolean') state.urlsafe = s.urlsafe;
    if (typeof s.wrap === 'boolean') state.wrap = s.wrap;
  }

  function encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    let b64 = btoa(bin);
    if (state.urlsafe) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (state.wrap) b64 = b64.replace(/(.{76})/g, '$1\n');
    return b64;
  }

  function decode(b64) {
    let s = b64.replace(/\s+/g, '');
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    if (/[^A-Za-z0-9+/=]/.test(s)) throw new Error(t('b64.bad'));
    while (s.length % 4) s += '=';
    let bin;
    try { bin = atob(s); } catch { throw new Error(t('b64.bad')); }
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function process() {
    if (!alive) return;
    const raw = refs.input.value;
    refs.status.className = 'b64-status';
    if (!raw) {
      refs.status.textContent = t('b64.empty');
      refs.out.textContent = '';
      refs.stats.hidden = true;
      lastOut = '';
      return;
    }
    let out;
    try { out = state.mode === 'encode' ? encode(raw) : decode(raw); }
    catch (e) {
      refs.status.classList.add('bad');
      refs.status.textContent = e.message;
      refs.out.textContent = '';
      refs.stats.hidden = true;
      lastOut = '';
      return;
    }
    lastOut = out;
    refs.status.classList.add('ok');
    refs.status.textContent = t('b64.ok');
    refs.out.textContent = out;
    const inBytes = new TextEncoder().encode(raw).length;
    const outBytes = new TextEncoder().encode(out).length;
    refs.stats.hidden = false;
    refs.stats.innerHTML =
      '<div><dt>' + t('b64.m.in') + '</dt><dd>' + inBytes + '</dd></div>' +
      '<div><dt>' + t('b64.m.out') + '</dt><dd>' + out.length + '</dd></div>' +
      '<div><dt>' + t('b64.m.outBytes') + '</dt><dd>' + outBytes + '</dd></div>';
  }
  const processSoon = U.debounce(process, 150);

  function syncLabels() {
    refs.input.placeholder = state.mode === 'encode' ? t('b64.placeholderEnc') : t('b64.placeholderDec');
    refs.input.setAttribute('aria-label', state.mode === 'encode' ? t('b64.inEnc') : t('b64.inDec'));
    refs.inLabel.textContent = state.mode === 'encode' ? t('b64.inEnc') : t('b64.inDec');
    refs.wrapField.hidden = state.mode !== 'encode';
  }

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="b64-stage glass-2">
        <div class="b64-bar">
          <div id="b64-mode"><div class="b64-tabs" role="tablist" aria-label="${t('b64.input')}">
            <button class="tab" role="tab" data-tab="encode" aria-selected="${state.mode === 'encode'}">${t('b64.encode')}</button>
            <button class="tab" role="tab" data-tab="decode" aria-selected="${state.mode === 'decode'}">${t('b64.decode')}</button>
          </div></div>
          <label class="b64-check"><input type="checkbox" id="b64-urlsafe"> ${t('b64.urlsafe')}</label>
          <label class="b64-check" id="b64-wrap-field"><input type="checkbox" id="b64-wrap"> ${t('b64.wrap')}</label>
          <span class="b64-status" id="b64-status"></span>
        </div>
        <div class="b64-panes">
          <div class="b64-pane">
            <div class="b64-pane-head"><span id="b64-inlabel"></span>
              <span class="b64-pane-actions">
                <button class="btn btn-ghost btn-sm" id="b64-sample">${I.sparkle} ${t('b64.sample')}</button>
                <button class="btn btn-ghost btn-sm" id="b64-clear">${I.x} ${t('b64.clear')}</button>
              </span></div>
            <textarea class="b64-input" id="b64-input" spellcheck="false"></textarea>
          </div>
          <div class="b64-pane">
            <div class="b64-pane-head"><span>${t('b64.output')}</span>
              <span class="b64-pane-actions">
                <button class="btn btn-ghost btn-sm" id="b64-swap">${I.swap} ${t('b64.swap')}</button>
                <button class="btn btn-ghost btn-sm" id="b64-copy">${I.copy} ${t('b64.copy')}</button>
                <button class="btn btn-ghost btn-sm" id="b64-dl">${I.download} ${t('b64.download')}</button>
              </span></div>
            <pre class="b64-out" id="b64-out" aria-live="polite"></pre>
          </div>
        </div>
        <dl class="b64-stats" id="b64-stats" hidden></dl>
        <p class="privacy-line">${I.shield} ${t('b64.privacy')}</p>
      </div>`;

    refs = {
      input: $('#b64-input', root), out: $('#b64-out', root), status: $('#b64-status', root),
      stats: $('#b64-stats', root), inLabel: $('#b64-inlabel', root), wrapField: $('#b64-wrap-field', root)
    };

    modeTabs = VT.ui.tabs($('#b64-mode', root), (id) => { state.mode = id; persist(); syncLabels(); process(); });
    const us = $('#b64-urlsafe', root); us.checked = state.urlsafe;
    us.addEventListener('change', () => { state.urlsafe = us.checked; persist(); process(); });
    const wr = $('#b64-wrap', root); wr.checked = state.wrap;
    wr.addEventListener('change', () => { state.wrap = wr.checked; persist(); process(); });

    refs.input.addEventListener('input', processSoon);
    $('#b64-sample', root).addEventListener('click', () => {
      refs.input.value = state.mode === 'encode' ? 'Vistanology Open — útil, local, aberto. 🌌' : 'VmlzdGFub2xvZ3kgT3Blbg==';
      process();
    });
    $('#b64-clear', root).addEventListener('click', () => { refs.input.value = ''; process(); refs.input.focus(); });
    $('#b64-swap', root).addEventListener('click', () => {
      if (!lastOut) return;
      refs.input.value = lastOut;
      state.mode = state.mode === 'encode' ? 'decode' : 'encode';
      persist();
      modeTabs.select(state.mode);
      syncLabels(); process();
    });
    $('#b64-copy', root).addEventListener('click', async () => {
      if (!lastOut) return;
      const ok = await U.copyText(lastOut);
      toast(ok ? t('b64.copied') : t('b64.copyFail'), ok ? 'success' : 'error');
    });
    $('#b64-dl', root).addEventListener('click', () => {
      if (!lastOut) return;
      U.downloadText(lastOut, state.mode === 'encode' ? 'vistanology.b64.txt' : 'vistanology-decoded.txt', 'text/plain');
      toast(t('b64.downloaded'), 'success');
    });

    syncLabels();
    process();
    return () => { alive = false; };
  }

  function unmount() { alive = false; lastOut = ''; }

  VT.registry.add(def);
  return def;
})();