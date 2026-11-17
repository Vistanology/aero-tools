window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['url-toolkit'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'ut.url': 'URL', 'ut.comp': 'Component', 'ut.input': 'URL', 'ut.placeholder': 'https://example.com/path?a=1&b=2#frag',
      'ut.components': 'Components', 'ut.params': 'Query parameters', 'ut.add': 'Add param', 'ut.remove': 'Remove',
      'ut.key': 'Key', 'ut.value': 'Value', 'ut.output': 'Rebuilt URL', 'ut.copy': 'Copy', 'ut.sample': 'Sample', 'ut.clear': 'Clear',
      'ut.bad': 'Invalid URL', 'ut.empty': 'Waiting for a URL…', 'ut.ok': 'Valid URL',
      'ut.encode': 'Encode', 'ut.decode': 'Decode', 'ut.compIn': 'Text', 'ut.compPlaceholder': 'Text to encode or decode…',
      'ut.compOut': 'Result', 'ut.compBad': 'Malformed escape sequence', 'ut.compEmpty': 'Waiting for text…', 'ut.compOk': 'OK',
      'ut.copied': 'Copied to clipboard', 'ut.copyFail': 'Could not copy — select and copy manually.',
      'ut.privacy': 'Parsing and encoding run entirely in your browser. Nothing is uploaded.',
      'ut.c.protocol': 'Protocol', 'ut.c.host': 'Host', 'ut.c.port': 'Port', 'ut.c.path': 'Path', 'ut.c.hash': 'Hash', 'ut.c.origin': 'Origin', 'ut.c.auth': 'Credentials'
    },
    pt: {
      'ut.url': 'URL', 'ut.comp': 'Componente', 'ut.input': 'URL', 'ut.placeholder': 'https://exemplo.com/caminho?a=1&b=2#frag',
      'ut.components': 'Componentes', 'ut.params': 'Parâmetros de query', 'ut.add': 'Adicionar param', 'ut.remove': 'Remover',
      'ut.key': 'Chave', 'ut.value': 'Valor', 'ut.output': 'URL reconstruída', 'ut.copy': 'Copiar', 'ut.sample': 'Exemplo', 'ut.clear': 'Limpar',
      'ut.bad': 'URL inválida', 'ut.empty': 'Aguardando uma URL…', 'ut.ok': 'URL válida',
      'ut.encode': 'Codificar', 'ut.decode': 'Decodificar', 'ut.compIn': 'Texto', 'ut.compPlaceholder': 'Texto a codificar ou decodificar…',
      'ut.compOut': 'Resultado', 'ut.compBad': 'Sequência de escape malformada', 'ut.compEmpty': 'Aguardando texto…', 'ut.compOk': 'OK',
      'ut.copied': 'Copiado para a área de transferência', 'ut.copyFail': 'Não foi possível copiar — selecione e copie manualmente.',
      'ut.privacy': 'A leitura e a codificação rodam inteiramente no navegador. Nada é enviado.',
      'ut.c.protocol': 'Protocolo', 'ut.c.host': 'Host', 'ut.c.port': 'Porta', 'ut.c.path': 'Caminho', 'ut.c.hash': 'Hash', 'ut.c.origin': 'Origem', 'ut.c.auth': 'Credenciais'
    }
  });

  const def = {
    id: 'url-toolkit', cat: 'developer', icon: 'link', version: '1.0.0',
    name: { en: 'URL Toolkit', pt: 'Toolkit de URL' },
    tagline: {
      en: 'Parse a URL into components, edit query parameters live and rebuild it — plus URI component encode/decode with validation.',
      pt: 'Decomponha uma URL em componentes, edite parâmetros de query ao vivo e reconstrua — mais encode/decode de componente URI com validação.'
    },
    tags: ['url', 'parse', 'query', 'encode', 'decode', 'uri', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'A local URL workbench: the URL tab parses any absolute URL into protocol/host/port/path/hash/origin, lists query parameters as editable key/value rows (add/remove) and rebuilds the URL live; the Component tab encodes/decodes URI components with malformed-escape detection.',
        usage: [
          'URL tab: paste an absolute URL (or load the sample).',
          'Read the component breakdown; edit, add or remove query parameters.',
          'Copy the rebuilt URL (normalized by the URL engine).',
          'Component tab: choose Encode or Decode and paste text.',
          'Copy the result; malformed % escapes are flagged on decode.'
        ],
        privacy: 'Parsing, rebuilding and encoding happen in memory only. Nothing is uploaded or stored.',
        limits: [
          'The URL tab requires an absolute URL (with protocol); relative references are rejected.',
          'Rebuilt URLs are normalized by the browser URL engine (e.g. default ports omitted, trailing slash added).',
          'Credentials in a URL are shown but discouraged; they are never sent anywhere by this tool.'
        ]
      },
      pt: {
        summary: 'Uma bancada de URL local: a aba URL decompõe qualquer URL absoluta em protocolo/host/porta/caminho/hash/origem, lista parâmetros de query como linhas editáveis de chave/valor (adicionar/remover) e reconstrói a URL ao vivo; a aba Componente codifica/decodifica componentes URI com detecção de escapes malformados.',
        usage: [
          'Aba URL: cole uma URL absoluta (ou carregue o exemplo).',
          'Leia a decomposição em componentes; edite, adicione ou remova parâmetros de query.',
          'Copie a URL reconstruída (normalizada pelo motor de URL).',
          'Aba Componente: escolha Codificar ou Decodificar e cole texto.',
          'Copie o resultado; escapes % malformados são sinalizados na decodificação.'
        ],
        privacy: 'Leitura, reconstrução e codificação ocorrem apenas em memória. Nada é enviado ou armazenado.',
        limits: [
          'A aba URL exige URL absoluta (com protocolo); referências relativas são rejeitadas.',
          'URLs reconstruídas são normalizadas pelo motor do navegador (portas padrão omitidas, barra final adicionada).',
          'Credenciais na URL são exibidas mas desaconselhadas; nunca são enviadas por esta ferramenta.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'url-toolkit';
  let alive = false;
  let state = { tab: 'url', compMode: 'encode' };
  let work = null;      // working URL clone for the URL tab
  let lastUrl = '', lastComp = '';
  let refs = {};

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (['url', 'comp'].includes(s.tab)) state.tab = s.tab;
    if (['encode', 'decode'].includes(s.compMode)) state.compMode = s.compMode;
  }

  const row = (k, v) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v || '—') + '</dd></div>';

  function renderComponents() {
    if (!work) { refs.components.innerHTML = ''; return; }
    let html = row(t('ut.c.protocol'), work.protocol) + row(t('ut.c.host'), work.hostname) +
      row(t('ut.c.port'), work.port) + row(t('ut.c.path'), work.pathname) +
      row(t('ut.c.hash'), work.hash) + row(t('ut.c.origin'), work.origin);
    if (work.username || work.password) html += row(t('ut.c.auth'), work.username + (work.password ? ':•••' : ''));
    refs.components.innerHTML = html;
  }

  function rebuild() {
    if (!work) { lastUrl = ''; refs.urlOut.textContent = ''; return; }
    work.search = '';
    const rows = [...refs.params.querySelectorAll('.ut-param')];
    for (const r of rows) {
      const k = r.querySelector('.ut-k').value;
      const v = r.querySelector('.ut-v').value;
      if (k) work.searchParams.append(k, v);
    }
    lastUrl = work.toString();
    refs.urlOut.textContent = lastUrl;
  }

  function paramRow(k, v) {
    const div = document.createElement('div');
    div.className = 'ut-param';
    div.innerHTML = '<input class="input ut-k" placeholder="' + t('ut.key') + '" aria-label="' + t('ut.key') + '">' +
      '<input class="input ut-v" placeholder="' + t('ut.value') + '" aria-label="' + t('ut.value') + '">' +
      '<button class="btn btn-ghost btn-sm ut-rm" aria-label="' + t('ut.remove') + '">' + VT.icons.x + '</button>';
    div.querySelector('.ut-k').value = k || '';
    div.querySelector('.ut-v').value = v || '';
    div.querySelector('.ut-k').addEventListener('input', rebuild);
    div.querySelector('.ut-v').addEventListener('input', rebuild);
    div.querySelector('.ut-rm').addEventListener('click', () => { div.remove(); rebuild(); });
    return div;
  }

  function parseURL() {
    const raw = refs.urlIn.value.trim();
    refs.urlStatus.className = 'ut-status';
    if (!raw) {
      refs.urlStatus.textContent = t('ut.empty');
      work = null; refs.components.innerHTML = ''; refs.params.innerHTML = '';
      refs.urlOut.textContent = ''; lastUrl = '';
      return;
    }
    let u;
    try { u = new URL(raw); } catch { u = null; }
    if (!u) {
      refs.urlStatus.classList.add('bad'); refs.urlStatus.textContent = t('ut.bad');
      work = null; refs.components.innerHTML = ''; refs.params.innerHTML = '';
      refs.urlOut.textContent = ''; lastUrl = '';
      return;
    }
    work = u;
    refs.urlStatus.classList.add('ok'); refs.urlStatus.textContent = t('ut.ok');
    renderComponents();
    refs.params.innerHTML = '';
    for (const [k, v] of u.searchParams) refs.params.appendChild(paramRow(k, v));
    rebuild();
  }
  const parseSoon = U.debounce(parseURL, 180);

  function processComp() {
    const raw = refs.compIn.value;
    refs.compStatus.className = 'ut-status';
    if (!raw) { refs.compStatus.textContent = t('ut.compEmpty'); refs.compOut.textContent = ''; lastComp = ''; return; }
    let out;
    try { out = state.compMode === 'encode' ? encodeURIComponent(raw) : decodeURIComponent(raw); }
    catch { refs.compStatus.classList.add('bad'); refs.compStatus.textContent = t('ut.compBad'); refs.compOut.textContent = ''; lastComp = ''; return; }
    lastComp = out;
    refs.compStatus.classList.add('ok'); refs.compStatus.textContent = t('ut.compOk');
    refs.compOut.textContent = out;
  }
  const compSoon = U.debounce(processComp, 150);

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="ut-stage glass-2">
        <div id="ut-tab">
        <div class="ut-bar">
          <div class="ut-tabs" role="tablist" aria-label="${t('ut.input')}">
            <button class="tab" role="tab" data-tab="url" aria-selected="${state.tab === 'url'}">${I.link} ${t('ut.url')}</button>
            <button class="tab" role="tab" data-tab="comp" aria-selected="${state.tab === 'comp'}">${I.code} ${t('ut.comp')}</button>
          </div>
        </div>

        <div data-panel="url" id="ut-panel-url">
          <div class="ut-field"><label for="ut-url-in">${t('ut.input')}</label>
            <input class="input ut-url-in" id="ut-url-in" spellcheck="false" placeholder="${t('ut.placeholder')}"></div>
          <div class="ut-actions">
            <button class="btn btn-ghost btn-sm" id="ut-sample">${I.sparkle} ${t('ut.sample')}</button>
            <button class="btn btn-ghost btn-sm" id="ut-clear">${I.x} ${t('ut.clear')}</button>
            <span class="ut-status" id="ut-status"></span>
          </div>
          <h3 class="ut-h">${t('ut.components')}</h3>
          <dl class="ut-components" id="ut-components"></dl>
          <h3 class="ut-h">${t('ut.params')}</h3>
          <div class="ut-params" id="ut-params"></div>
          <button class="btn btn-sm" id="ut-add">${I.plus} ${t('ut.add')}</button>
          <h3 class="ut-h">${t('ut.output')}</h3>
          <div class="ut-outrow"><pre class="ut-out" id="ut-url-out"></pre>
            <button class="btn btn-ghost btn-sm" id="ut-url-copy">${I.copy} ${t('ut.copy')}</button></div>
        </div>

        <div data-panel="comp" id="ut-panel-comp" hidden>
          <div class="ut-bar">
            <div id="ut-compmode"><div class="ut-tabs" role="tablist" aria-label="${t('ut.comp')}">
              <button class="tab" role="tab" data-tab="encode" aria-selected="${state.compMode === 'encode'}">${t('ut.encode')}</button>
              <button class="tab" role="tab" data-tab="decode" aria-selected="${state.compMode === 'decode'}">${t('ut.decode')}</button>
            </div></div>
            <span class="ut-status" id="ut-comp-status"></span>
          </div>
          <div class="ut-field"><label for="ut-comp-in">${t('ut.compIn')}</label>
            <textarea class="input ut-comp-in" id="ut-comp-in" spellcheck="false" placeholder="${t('ut.compPlaceholder')}"></textarea></div>
          <h3 class="ut-h">${t('ut.compOut')}</h3>
          <div class="ut-outrow"><pre class="ut-out" id="ut-comp-out"></pre>
            <button class="btn btn-ghost btn-sm" id="ut-comp-copy">${I.copy} ${t('ut.copy')}</button></div>
        </div>
        </div>

        <p class="privacy-line">${I.shield} ${t('ut.privacy')}</p>
      </div>`;

    refs = {
      urlIn: $('#ut-url-in', root), urlStatus: $('#ut-status', root), components: $('#ut-components', root),
      params: $('#ut-params', root), urlOut: $('#ut-url-out', root),
      compIn: $('#ut-comp-in', root), compStatus: $('#ut-comp-status', root), compOut: $('#ut-comp-out', root)
    };

    VT.ui.tabs($('#ut-tab', root), (id) => { state.tab = id; persist(); });
    VT.ui.tabs($('#ut-compmode', root), (id) => { state.compMode = id; persist(); processComp(); });

    refs.urlIn.addEventListener('input', parseSoon);
    $('#ut-sample', root).addEventListener('click', () => { refs.urlIn.value = 'https://open.vistanology.dev/tools?cat=media&lang=pt-BR#docs'; parseURL(); });
    $('#ut-clear', root).addEventListener('click', () => { refs.urlIn.value = ''; parseURL(); refs.urlIn.focus(); });
    $('#ut-add', root).addEventListener('click', () => { refs.params.appendChild(paramRow('', '')); rebuild(); });
    $('#ut-url-copy', root).addEventListener('click', async () => {
      if (!lastUrl) return;
      const ok = await U.copyText(lastUrl);
      toast(ok ? t('ut.copied') : t('ut.copyFail'), ok ? 'success' : 'error');
    });
    refs.compIn.addEventListener('input', compSoon);
    $('#ut-comp-copy', root).addEventListener('click', async () => {
      if (!lastComp) return;
      const ok = await U.copyText(lastComp);
      toast(ok ? t('ut.copied') : t('ut.copyFail'), ok ? 'success' : 'error');
    });

    parseURL();
    processComp();
    return () => { alive = false; };
  }

  function unmount() { alive = false; work = null; lastUrl = ''; lastComp = ''; }

  VT.registry.add(def);
  return def;
})();