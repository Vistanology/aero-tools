window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['timestamp'] = (() => {
  const U = VT.utils;
  const { $ } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'ts.now': 'Now', 'ts.useNow': 'Use now', 'ts.epoch': 'Epoch → Date', 'ts.date': 'Date → Epoch',
      'ts.epochIn': 'Unix timestamp', 'ts.epochPh': 'e.g. 1770000000', 'ts.unit': 'Unit',
      'ts.auto': 'Auto', 'ts.sec': 'Seconds', 'ts.ms': 'Milliseconds',
      'ts.iso': 'ISO 8601 (UTC)', 'ts.utc': 'UTC string', 'ts.local': 'Local string', 'ts.rel': 'Relative',
      'ts.normS': 'Epoch seconds', 'ts.normMs': 'Epoch milliseconds',
      'ts.dateIn': 'Date string', 'ts.datePh': 'e.g. 2026-11-15T12:00:00Z', 'ts.pick': 'Pick local date/time',
      'ts.outS': 'Epoch seconds', 'ts.outMs': 'Epoch milliseconds', 'ts.outIso': 'ISO 8601 (UTC)',
      'ts.copy': 'Copy', 'ts.clear': 'Clear', 'ts.empty': 'Waiting for input…', 'ts.bad': 'Invalid value',
      'ts.badRange': 'Out of Date range', 'ts.copied': 'Copied to clipboard', 'ts.copyFail': 'Could not copy — select and copy manually.',
      'ts.privacy': 'All conversion uses your device clock and runs in your browser. Nothing is uploaded.'
    },
    pt: {
      'ts.now': 'Agora', 'ts.useNow': 'Usar agora', 'ts.epoch': 'Epoch → Data', 'ts.date': 'Data → Epoch',
      'ts.epochIn': 'Timestamp Unix', 'ts.epochPh': 'ex.: 1770000000', 'ts.unit': 'Unidade',
      'ts.auto': 'Auto', 'ts.sec': 'Segundos', 'ts.ms': 'Milissegundos',
      'ts.iso': 'ISO 8601 (UTC)', 'ts.utc': 'String UTC', 'ts.local': 'String local', 'ts.rel': 'Relativo',
      'ts.normS': 'Epoch em segundos', 'ts.normMs': 'Epoch em milissegundos',
      'ts.dateIn': 'String de data', 'ts.datePh': 'ex.: 2026-11-15T12:00:00Z', 'ts.pick': 'Escolher data/hora local',
      'ts.outS': 'Epoch em segundos', 'ts.outMs': 'Epoch em milissegundos', 'ts.outIso': 'ISO 8601 (UTC)',
      'ts.copy': 'Copiar', 'ts.clear': 'Limpar', 'ts.empty': 'Aguardando entrada…', 'ts.bad': 'Valor inválido',
      'ts.badRange': 'Fora do intervalo de Date', 'ts.copied': 'Copiado para a área de transferência', 'ts.copyFail': 'Não foi possível copiar — selecione e copie manualmente.',
      'ts.privacy': 'Toda conversão usa o relógio do dispositivo e roda no navegador. Nada é enviado.'
    }
  });

  const def = {
    id: 'timestamp', cat: 'developer', icon: 'clock', version: '1.0.0',
    name: { en: 'Timestamp Converter', pt: 'Conversor de Timestamp' },
    tagline: {
      en: 'Convert Unix epochs to readable dates and back, with a live now-clock, auto s/ms detection, UTC/local/relative views and honest validation.',
      pt: 'Converta epochs Unix em datas legíveis e vice-versa, com relógio ao vivo, detecção auto s/ms, visões UTC/local/relativa e validação honesta.'
    },
    tags: ['timestamp', 'epoch', 'unix', 'date', 'iso', 'utc', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'A local time workbench: a live now-clock shows the current epoch (s and ms) and ISO; the Epoch tab turns a Unix timestamp into ISO/UTC/local/relative strings (auto-detecting seconds vs milliseconds, overridable); the Date tab parses a date string or local picker into epoch seconds/milliseconds and ISO.',
        usage: [
          'Read the live now-clock, or press “Use now” to load the current epoch.',
          'Epoch tab: paste a Unix timestamp; choose Auto/Seconds/Milliseconds.',
          'Read ISO 8601 UTC, UTC string, local string and a locale-aware relative label.',
          'Date tab: type a parseable date string or pick a local date/time.',
          'Copy any epoch or ISO output.'
        ],
        privacy: 'Conversion uses the device clock and the native Date engine in memory. Nothing is uploaded; only the unit and active tab are persisted.',
        limits: [
          'Auto unit detection treats |value| ≥ 1e12 as milliseconds; older ms epochs need the explicit unit.',
          'Values outside the JavaScript Date range (±8.64e15 ms) are rejected.',
          'Date-string parsing delegates to the browser Date parser; ambiguous locale formats may vary.'
        ]
      },
      pt: {
        summary: 'Uma bancada de tempo local: um relógio ao vivo mostra o epoch atual (s e ms) e ISO; a aba Epoch transforma um timestamp Unix em strings ISO/UTC/local/relativa (detectando segundos vs milissegundos, com override); a aba Data converte uma string de data ou seletor local em epoch segundos/milissegundos e ISO.',
        usage: [
          'Leia o relógio ao vivo ou pressione “Usar agora” para carregar o epoch atual.',
          'Aba Epoch: cole um timestamp Unix; escolha Auto/Segundos/Milissegundos.',
          'Leia ISO 8601 UTC, string UTC, string local e um rótulo relativo conforme o idioma.',
          'Aba Data: digite uma string de data parseável ou escolha data/hora local.',
          'Copie qualquer saída de epoch ou ISO.'
        ],
        privacy: 'A conversão usa o relógio do dispositivo e o motor Date nativo em memória. Nada é enviado; só a unidade e a aba ativa são persistidas.',
        limits: [
          'A detecção auto trata |valor| ≥ 1e12 como milissegundos; epochs ms antigos exigem a unidade explícita.',
          'Valores fora do intervalo do Date (±8.64e15 ms) são rejeitados.',
          'A leitura de strings de data delega ao parser Date do navegador; formatos ambíguos podem variar.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'timestamp';
  const MAX_MS = 8.64e15;
  let state = { tab: 'epoch', unit: 'auto' };
  let refs = {};
  let timer = null;
  let last = { iso: '', s: '', ms: '', ds: '', dms: '', diso: '' };

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (['epoch', 'date'].includes(s.tab)) state.tab = s.tab;
    if (['auto', 's', 'ms'].includes(s.unit)) state.unit = s.unit;
  }

  const locale = () => (VT.i18n.lang === 'pt' ? 'pt-BR' : 'en');

  function relative(d) {
    const diffMs = d.getTime() - Date.now();
    const sec = Math.round(diffMs / 1000);
    const abs = Math.abs(sec);
    let unit, val;
    if (abs < 60) { unit = 'second'; val = sec; }
    else if (abs < 3600) { unit = 'minute'; val = Math.round(sec / 60); }
    else if (abs < 86400) { unit = 'hour'; val = Math.round(sec / 3600); }
    else if (abs < 2592000) { unit = 'day'; val = Math.round(sec / 86400); }
    else if (abs < 31536000) { unit = 'month'; val = Math.round(sec / 2592000); }
    else { unit = 'year'; val = Math.round(sec / 31536000); }
    return new Intl.RelativeTimeFormat(locale(), { numeric: 'auto' }).format(val, unit);
  }

  function tickNow() {
    const n = Date.now();
    refs.nowS.textContent = String(Math.floor(n / 1000));
    refs.nowMs.textContent = String(n);
    refs.nowIso.textContent = new Date(n).toISOString();
  }

  function clearEpoch() {
    refs.epIso.textContent = ''; refs.epUtc.textContent = ''; refs.epLocal.textContent = ''; refs.epRel.textContent = '';
    refs.epS.textContent = ''; refs.epMs.textContent = '';
    last.iso = ''; last.s = ''; last.ms = '';
  }

  function runEpoch() {
    const raw = refs.epochIn.value.trim();
    refs.epStatus.className = 'ts-status';
    if (!raw) { refs.epStatus.textContent = t('ts.empty'); clearEpoch(); return; }
    if (!/^-?\d+(\.\d+)?$/.test(raw)) { refs.epStatus.classList.add('bad'); refs.epStatus.textContent = t('ts.bad'); clearEpoch(); return; }
    const num = Number(raw);
    let ms;
    if (state.unit === 's') ms = num * 1000;
    else if (state.unit === 'ms') ms = num;
    else ms = Math.abs(num) >= 1e12 ? num : num * 1000;
    if (!isFinite(ms) || Math.abs(ms) > MAX_MS) { refs.epStatus.classList.add('bad'); refs.epStatus.textContent = t('ts.badRange'); clearEpoch(); return; }
    const d = new Date(ms);
    if (isNaN(d.getTime())) { refs.epStatus.classList.add('bad'); refs.epStatus.textContent = t('ts.bad'); clearEpoch(); return; }
    refs.epStatus.classList.add('ok'); refs.epStatus.textContent = 'OK';
    last.iso = d.toISOString(); last.s = String(Math.floor(ms / 1000)); last.ms = String(Math.round(ms));
    refs.epIso.textContent = last.iso;
    refs.epUtc.textContent = d.toUTCString();
    refs.epLocal.textContent = d.toString();
    refs.epRel.textContent = relative(d);
    refs.epS.textContent = last.s;
    refs.epMs.textContent = last.ms;
  }

  function clearDate() {
    refs.dtS.textContent = ''; refs.dtMs.textContent = ''; refs.dtIso.textContent = '';
    last.ds = ''; last.dms = ''; last.diso = '';
  }

  function runDate() {
    const raw = refs.dateIn.value.trim();
    refs.dtStatus.className = 'ts-status';
    if (!raw) { refs.dtStatus.textContent = t('ts.empty'); clearDate(); return; }
    const d = new Date(raw);
    if (isNaN(d.getTime())) { refs.dtStatus.classList.add('bad'); refs.dtStatus.textContent = t('ts.bad'); clearDate(); return; }
    const ms = d.getTime();
    if (Math.abs(ms) > MAX_MS) { refs.dtStatus.classList.add('bad'); refs.dtStatus.textContent = t('ts.badRange'); clearDate(); return; }
    refs.dtStatus.classList.add('ok'); refs.dtStatus.textContent = 'OK';
    last.ds = String(Math.floor(ms / 1000)); last.dms = String(ms); last.diso = d.toISOString();
    refs.dtS.textContent = last.ds; refs.dtMs.textContent = last.dms; refs.dtIso.textContent = last.diso;
  }

  const copyBtn = (getter) => async () => {
    const v = getter();
    if (!v) return;
    const ok = await U.copyText(v);
    toast(ok ? t('ts.copied') : t('ts.copyFail'), ok ? 'success' : 'error');
  };

  function mount(root) {
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="ts-stage glass-2">
        <div class="ts-now glass-1">
          <span class="ts-now-label">${I.clock} ${t('ts.now')}</span>
          <code id="ts-now-s"></code><code id="ts-now-ms"></code><code id="ts-now-iso"></code>
          <button class="btn btn-ghost btn-sm" id="ts-usenow">${I.sparkle} ${t('ts.useNow')}</button>
        </div>
        <div id="ts-tab">
          <div class="ts-bar">
            <div class="ts-tabs" role="tablist" aria-label="${t('ts.now')}">
              <button class="tab" role="tab" data-tab="epoch" aria-selected="${state.tab === 'epoch'}">${t('ts.epoch')}</button>
              <button class="tab" role="tab" data-tab="date" aria-selected="${state.tab === 'date'}">${t('ts.date')}</button>
            </div>
          </div>
          <div data-panel="epoch" id="ts-panel-epoch">
            <div class="ts-fieldrow">
              <div class="ts-field"><label for="ts-epoch-in">${t('ts.epochIn')}</label>
                <input class="input ts-mono" id="ts-epoch-in" spellcheck="false" inputmode="numeric" placeholder="${t('ts.epochPh')}"></div>
              <div class="ts-field ts-unitfield"><label for="ts-unit">${t('ts.unit')}</label>
                <select class="input" id="ts-unit">
                  <option value="auto" ${state.unit === 'auto' ? 'selected' : ''}>${t('ts.auto')}</option>
                  <option value="s" ${state.unit === 's' ? 'selected' : ''}>${t('ts.sec')}</option>
                  <option value="ms" ${state.unit === 'ms' ? 'selected' : ''}>${t('ts.ms')}</option>
                </select></div>
              <button class="btn btn-ghost btn-sm" id="ts-clear">${I.x} ${t('ts.clear')}</button>
            </div>
            <span class="ts-status" id="ts-ep-status"></span>
            <dl class="ts-out">
              <div><dt>${t('ts.iso')}</dt><dd><code id="ts-ep-iso"></code><button class="btn btn-ghost btn-sm ts-copy" id="ts-copy-iso">${I.copy}</button></dd></div>
              <div><dt>${t('ts.utc')}</dt><dd><code id="ts-ep-utc"></code></dd></div>
              <div><dt>${t('ts.local')}</dt><dd><code id="ts-ep-local"></code></dd></div>
              <div><dt>${t('ts.rel')}</dt><dd><code id="ts-ep-rel"></code></dd></div>
              <div><dt>${t('ts.normS')}</dt><dd><code id="ts-ep-s"></code><button class="btn btn-ghost btn-sm ts-copy" id="ts-copy-s">${I.copy}</button></dd></div>
              <div><dt>${t('ts.normMs')}</dt><dd><code id="ts-ep-ms"></code><button class="btn btn-ghost btn-sm ts-copy" id="ts-copy-ms">${I.copy}</button></dd></div>
            </dl>
          </div>
          <div data-panel="date" id="ts-panel-date" hidden>
            <div class="ts-fieldrow">
              <div class="ts-field"><label for="ts-date-in">${t('ts.dateIn')}</label>
                <input class="input ts-mono" id="ts-date-in" spellcheck="false" placeholder="${t('ts.datePh')}"></div>
              <div class="ts-field"><label for="ts-date-pick">${t('ts.pick')}</label>
                <input class="input" type="datetime-local" id="ts-date-pick" step="1"></div>
            </div>
            <span class="ts-status" id="ts-dt-status"></span>
            <dl class="ts-out">
              <div><dt>${t('ts.outS')}</dt><dd><code id="ts-dt-s"></code><button class="btn btn-ghost btn-sm ts-copy" id="ts-copy-ds">${I.copy}</button></dd></div>
              <div><dt>${t('ts.outMs')}</dt><dd><code id="ts-dt-ms"></code><button class="btn btn-ghost btn-sm ts-copy" id="ts-copy-dms">${I.copy}</button></dd></div>
              <div><dt>${t('ts.outIso')}</dt><dd><code id="ts-dt-iso"></code><button class="btn btn-ghost btn-sm ts-copy" id="ts-copy-diso">${I.copy}</button></dd></div>
            </dl>
          </div>
        </div>
        <p class="privacy-line">${I.shield} ${t('ts.privacy')}</p>
      </div>`;

    refs = {
      nowS: $('#ts-now-s', root), nowMs: $('#ts-now-ms', root), nowIso: $('#ts-now-iso', root),
      epochIn: $('#ts-epoch-in', root), unit: $('#ts-unit', root), epStatus: $('#ts-ep-status', root),
      epIso: $('#ts-ep-iso', root), epUtc: $('#ts-ep-utc', root), epLocal: $('#ts-ep-local', root), epRel: $('#ts-ep-rel', root),
      epS: $('#ts-ep-s', root), epMs: $('#ts-ep-ms', root),
      dateIn: $('#ts-date-in', root), datePick: $('#ts-date-pick', root), dtStatus: $('#ts-dt-status', root),
      dtS: $('#ts-dt-s', root), dtMs: $('#ts-dt-ms', root), dtIso: $('#ts-dt-iso', root)
    };

    VT.ui.tabs($('#ts-tab', root), (id) => { state.tab = id; persist(); });
    refs.epochIn.addEventListener('input', U.debounce(runEpoch, 150));
    refs.unit.addEventListener('change', () => { state.unit = refs.unit.value; persist(); runEpoch(); });
    refs.dateIn.addEventListener('input', U.debounce(runDate, 150));
    refs.datePick.addEventListener('change', () => {
      if (refs.datePick.value) { refs.dateIn.value = refs.datePick.value; runDate(); }
    });
    $('#ts-usenow', root).addEventListener('click', () => {
      refs.epochIn.value = String(Math.floor(Date.now() / 1000));
      state.unit = 's'; refs.unit.value = 's'; persist(); runEpoch();
    });
    $('#ts-clear', root).addEventListener('click', () => { refs.epochIn.value = ''; runEpoch(); refs.epochIn.focus(); });
    $('#ts-copy-iso', root).addEventListener('click', copyBtn(() => last.iso));
    $('#ts-copy-s', root).addEventListener('click', copyBtn(() => last.s));
    $('#ts-copy-ms', root).addEventListener('click', copyBtn(() => last.ms));
    $('#ts-copy-ds', root).addEventListener('click', copyBtn(() => last.ds));
    $('#ts-copy-dms', root).addEventListener('click', copyBtn(() => last.dms));
    $('#ts-copy-diso', root).addEventListener('click', copyBtn(() => last.diso));

    tickNow();
    timer = setInterval(tickNow, 1000);
    runEpoch(); runDate();
    return () => { if (timer) { clearInterval(timer); timer = null; } };
  }

  function unmount() { if (timer) { clearInterval(timer); timer = null; } last = { iso: '', s: '', ms: '', ds: '', dms: '', diso: '' }; }

  VT.registry.add(def);
  return def;
})();