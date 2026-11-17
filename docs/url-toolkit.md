# URL Toolkit · v1.0.0

Parse any absolute URL into its components, edit query parameters live and rebuild the URL — plus a
URI-component encode/decode tab with malformed-escape detection.
Decomponha qualquer URL absoluta em componentes, edite parâmetros de query ao vivo e reconstrua a URL —
mais uma aba de encode/decode de componente URI com detecção de escapes malformados.

Category: 04 Developer Tools · Engine: native `URL` / `URLSearchParams` + `encodeURIComponent` /
`decodeURIComponent` · 100% local · no dependencies.

## Usage · Uso

- **URL tab** — paste an absolute URL (or load the sample). The component breakdown shows protocol, host,
  port, path, hash and origin (plus credentials when present). · Aba URL — cole uma URL absoluta; a
  decomposição mostra protocolo, host, porta, caminho, hash e origem (mais credenciais quando houver).
- **Editable query params** — each `key=value` pair is a row you can edit, add or remove; the rebuilt URL
  updates live. · Parâmetros editáveis — cada par `chave=valor` é uma linha editável/adicionável/removível;
  a URL reconstruída atualiza ao vivo.
- **Rebuilt URL** — normalized by the browser URL engine and copyable in one click. · URL reconstruída —
  normalizada pelo motor do navegador e copiável em um clique.
- **Component tab** — Encode / Decode mode tabs run `encodeURIComponent` / `decodeURIComponent` on arbitrary
  text; malformed `%` escapes are flagged on decode. · Aba Componente — abas Codificar/Decodificar; escapes
  `%` malformados são sinalizados na decodificação.
- **Honest copy** — success toast only when the clipboard write actually succeeds; an error toast when both
  the async clipboard and the `execCommand` fallback fail. · Cópia honesta — sucesso só quando a escrita
  realmente ocorre; erro quando clipboard e fallback falham.
- **Persistence** — only the active tab and the component mode survive reload (`localStorage`, key
  `vistanology:url-toolkit`); no URL or text is ever stored. · Persistência — só a aba ativa e o modo do
  componente sobrevivem ao reload; nenhuma URL ou texto é armazenado.

## Privacy · Privacidade

Parsing, rebuilding and encoding happen in memory in your browser. Nothing is uploaded and nothing is
persisted beyond the two mode settings. Credentials embedded in a URL are displayed (masked in the component
list) but are never sent anywhere by this tool.
Leitura, reconstrução e codificação ocorrem em memória no navegador. Nada é enviado nem persistido além dos
dois ajustes de modo. Credenciais embutidas na URL são exibidas (mascaradas na lista de componentes) mas
nunca são enviadas por esta ferramenta.

## Limits · Limites

- The URL tab requires an absolute URL (with protocol); relative references like `/path?a=1` are rejected.
  A aba URL exige URL absoluta (com protocolo); referências relativas são rejeitadas.
- Rebuilt URLs are normalized by the URL engine: default ports omitted, a trailing slash added to empty
  paths, spaces in query values encoded as `+`, non-ASCII percent-encoded. · URLs reconstruídas são
  normalizadas: portas padrão omitidas, barra final adicionada, espaços viram `+`, não-ASCII percent-encoded.
- The component tab operates on whole text (not per-URL); it does not validate whether the result is a URL.
  A aba Componente opera sobre texto inteiro; não valida se o resultado é uma URL.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Empty state** — mounts clean, no console error; URL panel visible, Component panel hidden.
  Estado vazio monta sem erro; painéis corretos.
- **Component breakdown** — sample `https://open.vistanology.dev/tools?cat=media&lang=pt-BR#docs` yields
  protocol `https:`, host `open.vistanology.dev`, port `—`, path `/tools`, hash `#docs`, origin
  `https://open.vistanology.dev`, matching an independent `new URL(...)` ground truth; params parsed as
  `[cat,media]`, `[lang,pt-BR]`. · Decomposição conferida contra ground truth independente.
- **Rebuild fidelity** — rebuilt URL byte-identical to `new URL(sample).toString()`. · Reconstrução idêntica.
- **Param edit / add / remove** — editing `cat` to `developer` reflects immediately; adding `utm=open hub`
  encodes as `utm=open+hub`; removing the row drops it cleanly. · Editar/adicionar/remover conferidos.
- **Invalid & relative** — `not a url` and `/tools?cat=media` both flag “URL inválida” and clear the output.
  Inválida e relativa rejeitadas.
- **Credentials + port** — `ftp://user:pass@files.example.com:2121/pub/readme.txt?x=1#top` shows 7 components
  (incl. Credentials) and preserves port `2121`. · Credenciais e porta conferidas.
- **Unicode** — `https://exemplo.com/café?q=ação#seção` percent-encodes to `caf%C3%A9`, `a%C3%A7%C3%A3o`,
  `se%C3%A7%C3%A3o`. · Unicode conferido.
- **Component encode** — `ação & café = 100% /日本?q=x#y` matches an independent `encodeURIComponent` ground
  truth; decoding that output round-trips to the exact original; `hello 🌍 日本` round-trips.
  Encode conferido contra ground truth; round-trips exatos (acentos, CJK, emoji).
- **Malformed escapes** — `abc%ZZdef` and `100%` flag “Sequência de escape malformada” and clear the output.
  Escapes malformados sinalizados.
- **Copy honesty** — URL copy writes the exact rebuilt URL; component copy writes `a%20b`; with the clipboard
  throwing AND `execCommand` returning false, an error toast is shown (no false success).
  Cópia honesta nos dois caminhos.
- **Persistence** — `{tab:'comp', compMode:'decode'}` restored across remounts (settings only, no secrets);
  3 remount cycles produce 0 new toasts and 0 console errors. · Persistência só de ajustes; remontagens limpas.
- **i18n & shell** — full EN/PT (tabs, buttons, component labels, statuses); library shows 15 cards including
  `url-toolkit` (`15 ferramentas`). · Bilíngue e integração conferidas (library = 15).
- **Responsive** — 320/375/768/1280 with content on both tabs: no horizontal overflow; components collapse to
  one column and param rows stack on small screens. · Sem overflow em nenhuma largura.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/url-toolkit-desktop.png`](shots/url-toolkit-desktop.png) (1280×946),
[`shots/url-toolkit-mobile.png`](shots/url-toolkit-mobile.png) (375×784).

### Pending / Limitações do ambiente de teste

- The host preview panel viewport is fixed (319×784 observed), so the desktop shot is a full-page capture of a
  same-origin 1280 px-wide iframe at its natural content height (946 px, shell hidden) and the mobile shot a
  375×785 iframe (internal scrollbar hidden) cropped to 375×784; no physical device was available.
  Captura desktop via iframe de 1280 px na altura natural do conteúdo e mobile via iframe recortado.
- Real OS clipboard is denied in the embedded browser; copy verified via a stub plus the execCommand fallback.
  Clipboard real negado no navegador embutido; cópia verificada via stub + fallback.