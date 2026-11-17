# Hash Generator · v1.0.0

SHA-1 / SHA-256 / SHA-384 / SHA-512 of text or a local file via the browser Web Crypto API, with uppercase hex,
per-digest copy, hash identification and `.txt` export — 100% local.
SHA-1 / SHA-256 / SHA-384 / SHA-512 de texto ou arquivo local via Web Crypto do navegador, com hex maiúsculo,
cópia por digest, identificação de hash e exportação `.txt` — 100% local.

Category: 04 Developer Tools · Engine: `crypto.subtle.digest` (Web Crypto) · 100% local · no dependencies.

## Usage · Uso

- **Text / File** — mode tabs: hash typed/pasted text, or drop/choose a local file (read with `arrayBuffer`).
  **Texto / Arquivo** — abas: hasheie texto digitado/colado, ou solte/escolha um arquivo local.
- **Four digests** — SHA-1, SHA-256, SHA-384, SHA-512 computed live (text) or on load (file).
  **Quatro digests** — computados ao vivo (texto) ou ao carregar (arquivo).
- **Uppercase hex** — toggle the case of every digest and of copies/exports. · Alterna a caixa de todos os digests.
- **Identify a hash** — paste a known hash; it reports which algorithm(s) produced it, or "No match".
  **Identificar um hash** — cole um hash conhecido; informa qual algoritmo o produziu, ou "Sem correspondência".
- **Copy / Download** — copy any single digest, or download all four as `vistanology-hashes.txt` (text/plain).
  **Copiar / Baixar** — copie um digest ou baixe os quatro como `vistanology-hashes.txt`.
- **Stats** — input bytes (UTF-8 for text, file size for files) and algorithm count. · Bytes de entrada e nº de algoritmos.
- **Persistence** — only mode/uppercase survive reload (`localStorage`, key `vistanology:hash-generator`); text, files
  and digests are never stored. · Persistência — só modo/maiúsculas sobrevivem ao reload; texto/arquivos/digests nunca são armazenados.

## Privacy · Privacidade

All hashing runs in memory via `crypto.subtle`. Files never leave the browser; nothing is uploaded or persisted.
Todo o hashing roda em memória via `crypto.subtle`; arquivos nunca saem do navegador; nada é enviado nem persistido.

## Limits · Limites

- Only the Web Crypto SHA family (SHA-1/256/384/512); MD5 is not available in Web Crypto.
  Apenas a família SHA da Web Crypto; MD5 não existe na Web Crypto.
- SHA-1 is included for legacy checksums only and is not collision-resistant.
  SHA-1 é incluído só para checksums legados e não é resistente a colisões.
- Very large files are hashed in one pass and may briefly block the UI.
  Arquivos muito grandes são hasheados em uma passada e podem bloquear a UI brevemente.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`, digests compared to an **independent Node `crypto` ground truth**:

- **Empty state** — mounts clean, no console error; "Waiting for input…", digests empty. · Estado vazio limpo.
- **Text `hello`** — all four digests byte-identical to Node `createHash` (SHA-1 `aaf4c61d…`, SHA-256 `2cf24dba…`,
  SHA-384 `59e17487…`, SHA-512 `9b71d224…`); input 5 B. · Conferido contra ground truth Node.
- **UTF-8 sample** — `Vistanology — café, 日本語, 🌌` → all four digests byte-identical to Node; input 38 B.
  Amostra UTF-8 conferida (38 B).
- **File mode** — panels toggle; a local `hello.txt` (5 B) hashes to the same digests as the text; name/size shown.
  Modo arquivo conferido (mesmos digests do texto).
- **Uppercase** — digests, copy and export all switch case correctly. · Maiúsculas conferidas.
- **Identify** — pasting the SHA-256 of `hello` reports `SHA-256`; `deadbeef` reports "No match" (error styling).
  Identificação conferida (acerto e erro).
- **Copy / Download** — per-digest copy returns the exact (case-correct) digest; download `vistanology-hashes.txt`
  (text/plain, 4 lines) byte-exact; denied clipboard produces the honest error toast and writes nothing.
  Cópia e download conferidos; falha honesta.
- **Clear** — empties text/file/digests/stats and returns to the waiting state. · Limpar conferido.
- **Persistence** — `{mode,upper}` restored across reload; text NOT persisted; 3 remounts → 0 new toasts, 0 errors.
  Persistência só de configurações; remontagens limpas.
- **i18n & shell** — full EN/PT; library shows 19 cards including `hash-generator`. · Bilíngue; library = 19.
- **Responsive** — 320/375/768/1280 with content: no horizontal overflow; digest rows reflow (algorithm on its own
  line ≤480) and long digests wrap. · Sem overflow; linhas reflowam.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/hash-generator-desktop.png`](shots/hash-generator-desktop.png) (1280 px),
[`shots/hash-generator-mobile.png`](shots/hash-generator-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- The host preview panel is fixed at 319 px, so the desktop shot is a full-page capture of a same-origin 1280-wide
  iframe at natural content height (shell hidden) and the mobile shot a 375×785 iframe cropped to 375×784; no physical
  device was available. · Captura desktop via iframe 1280 e mobile via iframe recortado.
- Real OS clipboard is denied in the embedded browser; copy verified via a stub plus the honest failure path.
  Clipboard real negado; cópia verificada via stub + caminho de falha honesto.
- File hashing verified with an in-page `File`/`DataTransfer` (no OS file picker available in the embedded browser).
  Hash de arquivo verificado com `File`/`DataTransfer` em página (sem seletor de OS no navegador embutido).