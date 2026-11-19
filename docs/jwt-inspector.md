# JWT Inspector · v1.0.0

Decode a JSON Web Token locally: header and payload as Base64url UTF-8 JSON, a claims table that explains the
registered names and formats every date in your locale, a validity badge read from `exp`/`nbf`, and HMAC signature
verification through Web Crypto.
Decodifique um JSON Web Token localmente: cabeçalho e conteúdo como JSON UTF-8 em Base64url, uma tabela de claims
que explica os nomes registrados e formata cada data no seu idioma, um selo de validade lido de `exp`/`nbf` e
verificação de assinatura HMAC via Web Crypto.

Category: 04 Developer Tools · Engine: `atob` + `TextDecoder` for Base64url, `crypto.subtle` HMAC for HS256/384/512 ·
100% local · no dependencies.

## Usage · Uso

- **Paste or sample** — the token is parsed while you type (debounced 180 ms); Sample loads a real HS256 token that
  verifies against the secret the button also fills in.
  **Cole ou use o exemplo** — o token é lido enquanto você digita; o Exemplo carrega um HS256 real que verifica.
- **Header** — `alg` and `typ` become badges and the decoded object is shown below. · **Cabeçalho** — `alg` e `typ`
  viram selos e o objeto decodificado aparece abaixo.
- **Claims table** — one row per key: the raw value, a local date under `exp`/`nbf`/`iat`, and the meaning for the
  seven registered names (`iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`). Arrays and objects are shown as JSON.
  Tabela de claims com valor cru, data local e significado das claims registradas.
- **Validity badge** — compares your clock with `exp`/`nbf`: in the window, expired (with the moment), not yet valid,
  or no time claim at all. · **Selo de validade** — compara seu relógio com `exp`/`nbf`.
- **Verify** — type the shared secret and press Verify (Enter works too); the signature is recomputed with
  `crypto.subtle` and compared byte by byte. · **Verificar** — digite o segredo e a assinatura é recalculada.
- **Raw JSON** — switch replaces the table and the pretty-printed header with the decoded text as it was written.
  **JSON bruto** — mostra o texto decodificado como foi escrito.
- **Copy payload / Download .json** — the payload re-serialized with two-space indent. · Copiar ou baixar o conteúdo.
- **Persistence** — only the raw-JSON switch survives reload (`localStorage`, key `vistanology:jwt-inspector`). The
  token, its claims and the secret are never written anywhere. · Só a chave de JSON bruto é lembrada.

## Privacy · Privacidade

Nothing is uploaded. The token and the secret stay in page memory for the lifetime of the view and are cleared on
unmount; `VT.db` (IndexedDB) is never touched, and the only localStorage value is `{"raw":true|false}`. The HMAC is
computed locally by the browser's own crypto.
Nada é enviado. Token e segredo ficam só na memória da view e são limpos no desmonte; o IndexedDB não é tocado e o
único valor salvo é `{"raw":true|false}`. O HMAC é calculado localmente.

## Limits · Limites

- HMAC only. `HS256/384/512` can be verified because a shared secret makes that possible; `RS*`, `PS*` and `ES*`
  tokens are decoded and clearly reported as needing the issuer's public key — no fake verdict is printed.
  Só HMAC; tokens assimétricos são decodificados e informados como não verificáveis.
- `alg: none` is surfaced as an unsigned token, not as a verified one. · `alg: none` é mostrado como sem assinatura.
- Verification needs a secure context: `crypto.subtle` is absent on plain `http` origins other than localhost, so
  Verify does nothing there. · Verificação exige contexto seguro.
- Decoding is not trusting: the tool reports what a token claims and whether a signature matches a key you supply —
  never whether the real issuer signed it, and never an OCSP/CRL status.
  Decodificar não é confiar: nada consulta o emissor.

## Verified · Verificado

Run in headless Chromium against the local preview (`node serve.js`), harness `_dev/qa-jwt-qoder.js`
(41 assertions, 0 failed) and `_dev/qa-newtool-responsive-qoder.js` (10 probes, 0 failed):

- **Empty state** — waiting hint, Copy and Verify disabled, no console error. · Estado vazio limpo.
- **Malformed input** — `abc` and a four-part string both report “expected three parts separated by dots” and leave
  the panes empty. · Entrada inválida sinalizada.
- **HS256 decode** — header parses to `alg: HS256`, `typ: JWT`, badges render both; 9 claim rows for 9 payload keys;
  `role` renders as JSON array, `vip` as `false`, `exp` keeps `2110492800` and adds the local date.
  Decodificação conferida chave a chave.
- **Registered claim note** — `iss` row explains “Issuer — who signed it”. · Claim registrada explicada.
- **Validity** — the long-lived sample reads “In its validity window”. · Selo de validade conferido.
- **Signature** — wrong secret → “does not match” (bad); the documented secret → “matches the secret” (ok); replacing
  the signature segment with 43 valid Base64url characters while keeping the secret → “does not match”. Tamper
  detection is proven, not assumed.
  Assinatura: segredo errado, correto e token adulterado conferidos.
- **alg none** — `header.payload.` (empty signature is legal) decodes and warns “nobody signed it”; Verify stays
  disabled. · Token sem assinatura tratado como tal.
- **RS256** — decodes, lists its 2 claims, and says verification needs the issuer's public key; Verify stays disabled.
  Assimétrico decodificado sem veredito falso.
- **Raw JSON switch** — payload pane becomes the decoded text (`{"iss":…`), header becomes `{"alg"…`, the table
  disappears and returns on toggle back. · Alternância conferida nos dois sentidos.
- **Privacy** — exactly one storage key, `vistanology:jwt-inspector`, whose value matches `^{"raw":(true|false)}$`
  and contains no `eyJ…` and no secret. Clear resets both fields. · Promessa de privacidade medida.
- **i18n** — 43 keys in EN and the same 43 in PT (`_dev/scan-i18n-parity.js`: PARITY FAILURES: 0); in PT the
  placeholder reads “Cole um JSON Web Token…”, the verify message “…a assinatura confere…”, the third table header
  “Significado”. · Paridade bilíngue conferida.
- **Contrast** — `_dev/probe-contrast2.js`: 28 text elements sampled on this view, 0 below AA. · 28 elementos, 0 falhas.
- **Responsive** — 1440/1280/1024/768/390/375 in glass, plus Transparency = Solid and Motion = Reduced at 1440 and
  375: no horizontal overflow, no offending element crossing the viewport, view height above the floor, console clean.
  Sem overflow em nenhuma largura ou material.
- **Docs contract** — `_dev/qa-docs-all.js`: 35 pages, 0 failures; this page's Summary/How to use/Privacy/Limits all
  render from the registry arrays. · Página de docs dentro do contrato.

Screenshots: [`shots/jwt-inspector-desktop.png`](shots/jwt-inspector-desktop.png) (1280 px),
[`shots/jwt-inspector-mobile.png`](shots/jwt-inspector-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- The secret comparison was exercised with one secret and one algorithm family (HS256); HS384/HS512 share the code
  path with a different hash parameter and were not separately signed in this run.
  HS384/HS512 usam o mesmo caminho com outro hash; não foram assinados separadamente nesta bateria.
- Copy uses the real clipboard API when the browser grants it; in headless Chromium the harness asserts the button
  state and the payload string rather than the OS clipboard contents.
  A cópia é conferida pelo estado e pelo texto, não pela área de transferência do sistema.
