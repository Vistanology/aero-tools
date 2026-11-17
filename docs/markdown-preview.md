# Markdown Preview · v1.0.0

Live local Markdown preview with split / preview / generated-HTML views, sanitized links, code fences, tables and
lists, word/char/line stats, and HTML / Markdown export — 100% local, no network requests.
Prévia local de Markdown ao vivo com visões dividida / prévia / HTML gerado, links sanitizados, blocos de código,
tabelas e listas, estatísticas de palavras/chars/linhas e exportação HTML / Markdown — 100% local, sem requisições de rede.

Category: 04 Developer Tools · Engine: local line-based Markdown parser (escaped HTML + sanitized URLs) · no dependencies.

## Usage · Uso

- **Split / Preview / HTML** — edit side-by-side, read the rendered preview, or inspect the generated HTML.
  **Dividido / Prévia / HTML** — edite lado a lado, leia a prévia renderizada ou inspecione o HTML gerado.
- **Supported syntax** — headings, bold/italic/strikethrough, inline code, fenced code, links, nested unordered/ordered
  lists, blockquotes, tables and horizontal rules. · Sintaxe suportada: títulos, ênfase, código, blocos, links, listas
  aninhadas, citações, tabelas e réguas.
- **Copy HTML / Download .html / Download .md** — copy the generated HTML, save a standalone `.html`, or save the source `.md`.
  **Copiar HTML / Baixar .html / Baixar .md** — copia o HTML gerado, salva um `.html` independente ou o `.md` fonte.
- **Stats** — words, chars and lines of the source. · Estatísticas de palavras, chars e linhas.
- **Persistence** — only the view mode survives reload (`localStorage`, key `vistanology:markdown-preview`); the text is
  never stored. · Persistência — só o modo de visão sobrevive ao reload; o texto nunca é armazenado.

## Privacy · Privacidade

Parsing and rendering happen in memory. No network requests are made: remote image URLs render as links instead of
loading, and unsafe link protocols are stripped. · Parse e renderização em memória; nenhuma requisição de rede; imagens
remotas viram links e protocolos inseguros são removidos.

## Limits · Limites

- Single newline inside a paragraph renders as a line break (preview-friendly), not a soft space.
  Quebra simples dentro de parágrafo vira quebra visual, não espaço suave.
- Remote images are not fetched (privacy); `data:` images render, other image URLs become links.
  Imagens remotas não são buscadas; `data:` renderizam, outras URLs viram links.
- Only `http/https/mailto/#` link protocols are kept; everything else (e.g. `javascript:`) becomes plain text.
  Só `http/https/mailto/#` são mantidos; o resto vira texto puro.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Empty state** — mounts clean, no console error; "Waiting for Markdown…", preview empty, stats 0. · Estado vazio limpo.
- **Structure** — sample renders `<h1>`, `<strong>`, `<em>`, `<del>`, nested `<ul>` inside `<li>`, `<ol>`, `<blockquote>`,
  inline `<code>`, sanitized `<a target=_blank rel=noopener>`, `<pre class=md-pre>`, a full `<table>` and `<hr>`, all
  byte-matching hand-computed expected HTML. · Estrutura conferida contra HTML esperado.
- **XSS safety** — `<script>` and `<img onerror>` are escaped (no live elements); `[x](javascript:…)` produces no anchor
  and no stray characters; remote `![…](https://…)` yields a link, never an `<img>` (no fetch). · Segurança XSS conferida.
- **data: image** — `![p](data:image/png;…)` renders an `<img>` with the data URI. · Imagem data: conferida.
- **Titled / parenthesized links** — `[ok](https://a.b "title")` → href `https://a.b`; `[p](https://a.b/(x))` keeps `(x)`.
  Links com título e parênteses conferidos.
- **Views** — Split shows editor+preview; Preview hides editor; HTML shows the generated source equal to the preview HTML.
  Visões conferidas.
- **Copy / Download** — copy returns the exact generated HTML; `.html` export is a standalone doctype document containing
  it; `.md` export equals the editor text; denied clipboard produces the honest error toast. · Cópia e downloads conferidos.
- **Clear** — empties editor/preview/stats and returns to the waiting state. · Limpar conferido.
- **Persistence** — `{mode}` restored across reload; text NOT persisted; 3 remounts → 0 new toasts, 0 console errors.
  Persistência só de configurações; remontagens limpas.
- **i18n & shell** — full EN/PT; library shows 20 cards including `markdown-preview`. · Bilíngue; library = 20.
- **Responsive** — 320/375/768/1280 with content: no horizontal overflow; split stacks ≤1024, two columns at 1280.
  Sem overflow; split empilha ≤1024.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/markdown-preview-desktop.png`](shots/markdown-preview-desktop.png) (1280 px, split),
[`shots/markdown-preview-mobile.png`](shots/markdown-preview-mobile.png) (375 px, preview).

### Pending / Limitações do ambiente de teste

- The host preview panel is fixed at 319 px, so the desktop shot is a full-page capture of a same-origin 1280-wide iframe
  at natural content height (shell hidden) and the mobile shot a 375×785 iframe cropped to 375×784; no physical device was
  available. · Captura desktop via iframe 1280 e mobile via iframe recortado.
- Real OS clipboard is denied in the embedded browser; copy verified via a stub plus the honest failure path.
  Clipboard real negado; cópia verificada via stub + caminho de falha honesto.