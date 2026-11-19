window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['jwt-inspector'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3Zpc3Rhbm9sb2d5LmV4YW1wbGUiLCJzdWIiOiJ1c2VyLTQyIiwiYXVkIjoiYWVyby10b29scyIsImlhdCI6MTc5NDg3MzYwMCwiZXhwIjoyMTEwNDkyODAwLCJqdGkiOiIwZTljLTFmMmEiLCJuYW1lIjoiVmlzdGEiLCJyb2xlIjpbImh1YiIsImRvY3MiXSwidmlwIjpmYWxzZX0.vY03Ax4LEZh9LVUupSYbSAarSRV5eGv3sky5JIcbUlM';
  const SAMPLE_SECRET = 'vistanology-demo-secret';
  const HMAC = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' };
  const REGISTERED = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'];

  VT.i18n.add({
    en: {
      'jwt.token': 'Token', 'jwt.tokenPh': 'Paste a JSON Web Token: header.payload.signature',
      'jwt.sample': 'Sample', 'jwt.clear': 'Clear', 'jwt.raw': 'Show raw JSON',
      'jwt.decode': 'Decode', 'jwt.header': 'Header', 'jwt.payload': 'Payload', 'jwt.claims': 'Claims',
      'jwt.claim': 'Claim', 'jwt.value': 'Value', 'jwt.note': 'Meaning', 'jwt.wait': 'Paste a token to decode it.',
      'jwt.badParts': 'Not a JWT — expected three parts separated by dots.',
      'jwt.badHead': 'The header is not valid Base64url JSON.',
      'jwt.badBody': 'The payload is not valid Base64url JSON.',
      'jwt.sign': 'Signature', 'jwt.alg': 'Algorithm', 'jwt.secret': 'Shared secret',
      'jwt.secretPh': 'The key that signed this token', 'jwt.verify': 'Verify',
      'jwt.copyPayload': 'Copy payload', 'jwt.dlPayload': 'Download .json',
      'jwt.signed': 'Signature matches the secret.', 'jwt.notSigned': 'Signature does not match — wrong secret or a tampered token.',
      'jwt.needsSecret': 'Type the shared secret, then verify.',
      'jwt.noVerify': 'Verifying {alg} needs the issuer’s public key; this tool only checks HMAC signatures.',
      'jwt.unsigned': 'This token is unsigned (alg "none") — nobody signed it.',
      'jwt.copied': 'Payload copied to clipboard.', 'jwt.copyFail': 'Could not copy — select and copy manually.',
      'jwt.downloaded': 'Payload downloaded.',
      'jwt.valid': 'In its validity window', 'jwt.expired': 'Expired {when}', 'jwt.notYet': 'Not valid before {when}',
      'jwt.noTime': 'No exp or nbf claim',
      'jwt.r.iss': 'Issuer — who signed it', 'jwt.r.sub': 'Subject — whose token this is',
      'jwt.r.aud': 'Audience — who may accept it', 'jwt.r.exp': 'Expires at',
      'jwt.r.nbf': 'Not valid before', 'jwt.r.iat': 'Issued at', 'jwt.r.jti': 'Unique token id',
      'jwt.privacy': 'Decoding and HMAC verification run in this page. The token, its claims and the secret you type are never uploaded and never saved — only the raw-JSON switch is remembered.'
    },
    pt: {
      'jwt.token': 'Token', 'jwt.tokenPh': 'Cole um JSON Web Token: cabeçalho.conteúdo.assinatura',
      'jwt.sample': 'Exemplo', 'jwt.clear': 'Limpar', 'jwt.raw': 'Mostrar JSON bruto',
      'jwt.decode': 'Decodificar', 'jwt.header': 'Cabeçalho', 'jwt.payload': 'Conteúdo', 'jwt.claims': 'Claims',
      'jwt.claim': 'Claim', 'jwt.value': 'Valor', 'jwt.note': 'Significado', 'jwt.wait': 'Cole um token para decodificá-lo.',
      'jwt.badParts': 'Não é um JWT — esperava três partes separadas por ponto.',
      'jwt.badHead': 'O cabeçalho não é um JSON Base64url válido.',
      'jwt.badBody': 'O conteúdo não é um JSON Base64url válido.',
      'jwt.sign': 'Assinatura', 'jwt.alg': 'Algoritmo', 'jwt.secret': 'Segredo compartilhado',
      'jwt.secretPh': 'A chave que assinou este token', 'jwt.verify': 'Verificar',
      'jwt.copyPayload': 'Copiar conteúdo', 'jwt.dlPayload': 'Baixar .json',
      'jwt.signed': 'A assinatura confere com o segredo.', 'jwt.notSigned': 'A assinatura não confere — segredo errado ou token alterado.',
      'jwt.needsSecret': 'Digite o segredo compartilhado e verifique.',
      'jwt.noVerify': 'Verificar {alg} exige a chave pública do emissor; esta ferramenta só confere assinaturas HMAC.',
      'jwt.unsigned': 'Este token não tem assinatura (alg "none") — ninguém o assinou.',
      'jwt.copied': 'Conteúdo copiado para a área de transferência.', 'jwt.copyFail': 'Não foi possível copiar — selecione e copie manualmente.',
      'jwt.downloaded': 'Conteúdo baixado.',
      'jwt.valid': 'Dentro da janela de validade', 'jwt.expired': 'Expirou em {when}', 'jwt.notYet': 'Válido a partir de {when}',
      'jwt.noTime': 'Sem claim exp ou nbf',
      'jwt.r.iss': 'Emissor — quem assinou', 'jwt.r.sub': 'Assunto — de quem é o token',
      'jwt.r.aud': 'Audiência — quem pode aceitá-lo', 'jwt.r.exp': 'Expira em',
      'jwt.r.nbf': 'Válido a partir de', 'jwt.r.iat': 'Emitido em', 'jwt.r.jti': 'Id único do token',
      'jwt.privacy': 'A decodificação e a verificação HMAC acontecem nesta página. O token, suas claims e o segredo digitado nunca são enviados nem salvos — só a opção de JSON bruto fica na memória local.'
    }
  });

  const def = {
    id: 'jwt-inspector', cat: 'developer', icon: 'key', version: '1.0.0',
    name: { en: 'JWT Inspector', pt: 'Inspetor de JWT' },
    tagline: {
      en: 'Decode a JSON Web Token offline: read the header, inspect every claim with its registered meaning, check the validity window, and verify HMAC signatures with Web Crypto.',
      pt: 'Decodifique um JSON Web Token offline: leia o cabeçalho, inspecione cada claim com seu significado registrado, confira a janela de validade e verifique assinaturas HMAC com Web Crypto.'
    },
    tags: ['jwt', 'token', 'auth', 'signature', 'hmac', 'claims', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'A local JWT workbench. The token is split on its dots, header and payload are Base64url-decoded as UTF-8 JSON, and the payload is rendered as a claims table in which the seven registered names (iss, sub, aud, exp, nbf, iat, jti) carry their meaning and every numeric date is shown in your local format. A badge compares exp and nbf with your clock. HS256/384/512 signatures are recomputed with crypto.subtle HMAC against a secret you type; RS*, PS* and ES* tokens decode but are reported as not verifiable here. Nothing leaves the page and the token is never stored.',
        usage: [
          'Paste a token, or press Sample for a working HS256 one.',
          'Read the header badges for alg and typ, then the claims table; Show raw JSON switches the panes back to the decoded text.',
          'Watch the validity badge, which compares exp and nbf with your clock.',
          'Type the shared secret and press Verify to recompute the HMAC signature.',
          'Copy payload or Download .json to hand the claims to another tool.'
        ],
        privacy: 'Decoding and verification happen in this page. The token, its claims and the secret you type are not uploaded, logged or saved; the only thing written to localStorage is the raw-JSON switch. The HMAC is computed locally by crypto.subtle.',
        limits: [
          'Only HMAC algorithms (HS256/384/512) can be verified, because that is what a shared secret makes possible; asymmetric tokens are decoded and clearly reported as unverifiable.',
          'Verification needs a secure context: crypto.subtle is not exposed on plain http origins other than localhost, so the Verify button does nothing there.',
          'A token is decoded, not trusted. This tool reports what a token claims and whether a signature matches a key you supply — never whether the real issuer signed it.'
        ]
      },
      pt: {
        summary: 'Uma bancada de JWT local. O token é dividido nos pontos, cabeçalho e conteúdo são decodificados como JSON UTF-8 em Base64url e o conteúdo vira uma tabela de claims em que os sete nomes registrados (iss, sub, aud, exp, nbf, iat, jti) trazem seu significado e cada data numérica aparece no seu formato local. Um selo compara exp e nbf com o seu relógio. Assinaturas HS256/384/512 são recalculadas com HMAC de crypto.subtle contra um segredo que você digita; tokens RS*, PS* e ES* são decodificados, mas informados como não verificáveis aqui. Nada sai da página e o token nunca é guardado.',
        usage: [
          'Cole um token ou pressione Exemplo para um HS256 que funciona.',
          'Leia os selos de alg e typ no cabeçalho e depois a tabela de claims; Mostrar JSON bruto devolve o texto decodificado.',
          'Observe o selo de validade, que compara exp e nbf com o seu relógio.',
          'Digite o segredo compartilhado e pressione Verificar para recalcular a assinatura HMAC.',
          'Copiar conteúdo ou Baixar .json leva as claims para outra ferramenta.'
        ],
        privacy: 'A decodificação e a verificação acontecem nesta página. O token, suas claims e o segredo digitado não são enviados, registrados nem salvos; o único valor escrito no localStorage é a opção de JSON bruto. O HMAC é calculado localmente pelo crypto.subtle.',
        limits: [
          'Só algoritmos HMAC (HS256/384/512) podem ser verificados, porque é o que um segredo compartilhado permite; tokens assimétricos são decodificados e claramente informados como não verificáveis.',
          'A verificação exige contexto seguro: crypto.subtle não aparece em origem http comum fora de localhost, então o botão Verificar não tem efeito ali.',
          'O token é decodificado, não confiado. A ferramenta diz o que o token alega e se a assinatura bate com a chave que você forneceu — nunca se o emissor real o assinou.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'jwt-inspector';
  let alive = false;
  let state = { raw: false };
  let refs = {};
  let parsed = null;

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (s && typeof s.raw === 'boolean') state.raw = s.raw;
  }

  function b64urlBytes(seg) {
    let s = seg.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    if (/[^A-Za-z0-9+/]/.test(s)) throw new Error('not base64url');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function textOf(seg) { return new TextDecoder().decode(b64urlBytes(seg)); }

  function fmtDate(unix) {
    return new Intl.DateTimeFormat(VT.i18n.lang === 'pt' ? 'pt-BR' : 'en-US',
      { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(unix * 1000));
  }

  function valueCell(v) {
    if (typeof v === 'string') return '<span class="jwt-str">' + esc(v) + '</span>';
    if (typeof v === 'number' || typeof v === 'boolean' || v === null) return '<span class="jwt-lit">' + esc(String(v)) + '</span>';
    return '<span class="jwt-struct">' + esc(JSON.stringify(v)) + '</span>';
  }

  function claimsTable(obj) {
    const rows = Object.keys(obj).map((k) => {
      const v = obj[k];
      const when = (k === 'exp' || k === 'nbf' || k === 'iat') && typeof v === 'number'
        ? '<span class="jwt-when">' + esc(fmtDate(v)) + '</span>' : '';
      return '<tr><td class="mono">' + esc(k) + '</td><td>' + valueCell(v) + when + '</td>' +
        '<td class="jwt-note">' + (REGISTERED.includes(k) ? esc(t('jwt.r.' + k)) : '') + '</td></tr>';
    }).join('');
    return '<table class="jwt-claims"><thead><tr><th>' + esc(t('jwt.claim')) + '</th><th>' + esc(t('jwt.value')) +
      '</th><th>' + esc(t('jwt.note')) + '</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function timeBadge(body) {
    const now = Math.floor(Date.now() / 1000);
    if (typeof body.exp === 'number' && body.exp <= now)
      return { cls: 'badge-warn', label: t('jwt.expired', { when: fmtDate(body.exp) }) };
    if (typeof body.nbf === 'number' && body.nbf > now)
      return { cls: 'badge-warn', label: t('jwt.notYet', { when: fmtDate(body.nbf) }) };
    if (typeof body.exp === 'number' || typeof body.nbf === 'number')
      return { cls: 'badge-ok', label: t('jwt.valid') };
    return { cls: '', label: t('jwt.noTime') };
  }

  function status(msg, kind) {
    refs.status.className = 'jwt-status' + (kind ? ' ' + kind : '');
    refs.status.textContent = msg;
  }

  function reset() {
    parsed = null;
    refs.badges.innerHTML = '';
    refs.head.textContent = '';
    refs.body.innerHTML = '<p class="hint">' + esc(t('jwt.wait')) + '</p>';
    refs.time.innerHTML = '';
    refs.copy.disabled = true;
    refs.dl.disabled = true;
    refs.verify.disabled = true;
    status('', '');
  }

  function parse() {
    if (!alive) return;
    const raw = refs.input.value.trim();
    reset();
    if (!raw) return;

    const segs = raw.split('.');
    // An alg "none" token is legitimately header.payload. — the third part may be empty.
    if (segs.length !== 3 || !segs[0] || !segs[1]) { status(t('jwt.badParts'), 'bad'); return; }

    let head, body;
    try { head = JSON.parse(textOf(segs[0])); } catch { status(t('jwt.badHead'), 'bad'); return; }
    try { body = JSON.parse(textOf(segs[1])); } catch { status(t('jwt.badBody'), 'bad'); return; }
    if (!head || typeof head !== 'object' || !body || typeof body !== 'object') { status(t('jwt.badHead'), 'bad'); return; }

    parsed = { segs, head, body, bodyJson: JSON.stringify(body, null, 2) };

    refs.badges.innerHTML = '<span class="badge badge-aqua mono">' + esc(String(head.alg || '—')) + '</span>' +
      (head.typ ? '<span class="badge mono">' + esc(String(head.typ)) + '</span>' : '');
    refs.head.textContent = state.raw ? textOf(segs[0]) : JSON.stringify(head, null, 2);
    refs.body.innerHTML = state.raw ? '<pre class="jwt-raw">' + esc(textOf(segs[1])) + '</pre>' : claimsTable(body);
    refs.copy.disabled = false;
    refs.dl.disabled = false;

    const tb = timeBadge(body);
    refs.time.innerHTML = '<span class="badge ' + tb.cls + '">' + esc(tb.label) + '</span>';

    const alg = String(head.alg || '');
    if (alg === 'none') status(t('jwt.unsigned'), 'warn');
    else if (HMAC[alg]) { refs.verify.disabled = false; status(t('jwt.needsSecret'), ''); }
    else status(t('jwt.noVerify', { alg }), 'warn');
  }
  const parseSoon = U.debounce(parse, 180);

  async function verify() {
    if (!parsed || !HMAC[String(parsed.head.alg)]) return;
    const secret = refs.secret.value;
    if (!secret) { status(t('jwt.needsSecret'), ''); return; }
    let expected;
    try {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
        { name: 'HMAC', hash: HMAC[String(parsed.head.alg)] }, false, ['sign']);
      expected = new Uint8Array(await crypto.subtle.sign('HMAC', key,
        new TextEncoder().encode(parsed.segs[0] + '.' + parsed.segs[1])));
    } catch { status(t('jwt.notSigned'), 'bad'); return; }
    let actual;
    try { actual = b64urlBytes(parsed.segs[2]); } catch { actual = new Uint8Array(0); }
    let diff = expected.length ^ actual.length;
    for (let i = 0; i < Math.min(expected.length, actual.length); i++) diff |= expected[i] ^ actual[i];
    const ok = actual.length === expected.length && diff === 0;
    status(t(ok ? 'jwt.signed' : 'jwt.notSigned'), ok ? 'ok' : 'bad');
  }

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="jwt-work">
        <section class="step glass">
          <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('jwt.decode')}</h3></div>
          <div class="field"><label for="jwt-input">${t('jwt.token')}</label>
            <textarea class="input jwt-text" id="jwt-input" rows="4" spellcheck="false" placeholder="${t('jwt.tokenPh')}"></textarea></div>
          <div class="bench-row">
            <button class="btn btn-ghost btn-sm" id="jwt-sample">${I.sparkle} ${t('jwt.sample')}</button>
            <button class="btn btn-ghost btn-sm" id="jwt-clear">${I.x} ${t('jwt.clear')}</button>
            <label class="check-row jwt-rawtoggle"><input type="checkbox" id="jwt-raw"> ${t('jwt.raw')}</label>
          </div>
        </section>

        <section class="step glass">
          <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('jwt.header')}</h3></div>
          <div class="jwt-badges" id="jwt-badges"></div>
          <pre class="jwt-out" id="jwt-header-out" aria-live="polite"></pre>
        </section>

        <section class="step glass">
          <div class="step-head"><span class="step-num">03</span><h3 class="step-title">${t('jwt.payload')}</h3>
            <span class="jwt-time" id="jwt-time"></span></div>
          <div id="jwt-body"></div>
          <div class="export-row">
            <button class="btn btn-ghost btn-sm" id="jwt-copy" disabled>${I.copy} ${t('jwt.copyPayload')}</button>
            <button class="btn btn-ghost btn-sm" id="jwt-dl" disabled>${I.download} ${t('jwt.dlPayload')}</button>
          </div>
        </section>

        <section class="step glass">
          <div class="step-head"><span class="step-num">04</span><h3 class="step-title">${t('jwt.sign')}</h3></div>
          <div class="field"><label for="jwt-secret">${t('jwt.secret')}</label>
            <input class="input" id="jwt-secret" type="text" spellcheck="false" autocomplete="off" placeholder="${t('jwt.secretPh')}"></div>
          <button class="btn btn-primary btn-sm" id="jwt-verify" disabled>${I.check} ${t('jwt.verify')}</button>
          <p class="jwt-status" id="jwt-status" role="status" aria-live="polite"></p>
        </section>

        <p class="privacy-line">${I.shield} ${t('jwt.privacy')}</p>
      </div>`;

    refs = {
      input: $('#jwt-input', root), head: $('#jwt-header-out', root), body: $('#jwt-body', root),
      badges: $('#jwt-badges', root), time: $('#jwt-time', root), status: $('#jwt-status', root),
      secret: $('#jwt-secret', root), verify: $('#jwt-verify', root),
      copy: $('#jwt-copy', root), dl: $('#jwt-dl', root)
    };

    refs.input.addEventListener('input', parseSoon);
    const rawBox = $('#jwt-raw', root);
    rawBox.checked = state.raw;
    rawBox.addEventListener('change', () => { state.raw = rawBox.checked; persist(); parse(); });

    $('#jwt-sample', root).addEventListener('click', () => {
      refs.input.value = SAMPLE;
      refs.secret.value = SAMPLE_SECRET;
      parse();
      verify();
    });
    $('#jwt-clear', root).addEventListener('click', () => {
      refs.input.value = '';
      refs.secret.value = '';
      reset();
      refs.input.focus();
    });
    refs.verify.addEventListener('click', verify);
    refs.secret.addEventListener('keydown', (e) => { if (e.key === 'Enter') verify(); });

    refs.copy.addEventListener('click', async () => {
      if (!parsed) return;
      const ok = await U.copyText(parsed.bodyJson);
      toast(ok ? t('jwt.copied') : t('jwt.copyFail'), ok ? 'success' : 'error');
    });
    refs.dl.addEventListener('click', () => {
      if (!parsed) return;
      U.downloadText(parsed.bodyJson, 'vistanology-jwt-payload.json', 'application/json');
      toast(t('jwt.downloaded'), 'success');
    });

    parse();
    return () => { alive = false; };
  }

  function unmount() {
    alive = false;
    parsed = null;
    refs = {};
  }

  VT.registry.add(def);
  return def;
})();
