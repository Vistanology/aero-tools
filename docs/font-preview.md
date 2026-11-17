# Font Preview · v1.0.0

Test bundled, system and your own font files with a live specimen, waterfall, glyphs, measured
metrics and CSS/PNG export.
Teste fontes incluídas, do sistema e as suas com espécime ao vivo, cascata, glifos, medidas reais
e export CSS/PNG.

Category: 01 Creative Studio · Engine: FontFace API + Canvas 2D `measureText` · 100% local ·
deps: Instrument Serif + Inter (OFL 1.1).

## Usage · Uso

- **Typeface** — three groups in one select: bundled OFL faces (Instrument Serif, Inter), system
  stacks (System UI, Serif, Sans-serif, Monospace, Cursive, Fantasy) and your loaded files.
  **Fonte** — três grupos: incluídas (OFL), pilhas do sistema e suas fontes carregadas.
- **Your fonts** — drop or browse `.woff2 / .woff / .ttf / .otf`, up to 8 MB each. Files are read
  with FileReader and registered via the FontFace API in memory; a duplicate name gets a `-2`
  suffix; each loaded font has a remove button.
  **Suas fontes** — solte ou escolha arquivos de até 8 MB; nomes duplicados ganham sufixo `-2`;
  cada fonte tem botão de remover.
- **Sample text** — free text (2000 characters max) plus five presets: pangram EN, Portuguese
  text, alphabet, digits, paragraph. · Texto livre (máx. 2000) e cinco presets.
- **Views** — Specimen, Waterfall (12/16/20/24/32/48/64/96 px) and Glyphs; clicking a glyph copies
  it. · Espécime, Cascata e Glifos; clicar num glifo copia o caractere.
- **Type settings** — size 8–160 px, weight 100–900, normal/italic, letter spacing −3…24 (0.5
  steps), line height 0.8–2.4 (0.05 steps), transform none/uppercase/lowercase/capitalize,
  alignment left/center/right. · Corpo, peso, estilo, entreletra, entrelinha, transformação e
  alinhamento.
- **Colors** — text and background pickers with HEX fields; the WCAG contrast ratio and AA badge
  update live. · Cores com razão de contraste WCAG e selo AA ao vivo.
- **Measured** — text width, cap height, x-height, ascent, descent, character and word counts,
  read from the rendered face. · Medidas reais da face renderizada.
- **Export** — Copy CSS (a user font emits an `@font-face` with its data URL) and PNG specimen,
  1200 px wide. · Copiar CSS (com `@font-face` em data URL para fontes próprias) e PNG de 1200 px.
- **Persistence** — settings survive navigation and reload (`localStorage`, key
  `vistanology:font-preview`); loaded fonts are memory-only.
  **Persistência** — ajustes sobrevivem; fontes carregadas vivem só na memória.

## Privacy · Privacidade

Font files never leave the device: FileReader → FontFace in memory. No upload, no network
request, no font bytes in `localStorage`, no telemetry.
Arquivos de fonte nunca saem do dispositivo: FileReader → FontFace na memória. Sem upload, sem
rede, sem bytes de fonte no armazenamento, sem telemetria.

## Limits · Limites

- Custom fonts are session-only: they survive navigation but not a page reload.
  Fontes próprias duram a sessão: sobrevivem à navegação, não ao reload.
- Weights and italics a file does not contain are synthesized by the browser.
  Pesos/itálicos ausentes no arquivo são sintetizados pelo navegador.
- Metrics come from Canvas `measureText`, so they reflect the rendered face at the current size.
  As medidas vêm do `measureText` e refletem a face renderizada no corpo atual.
- PNG letter spacing needs `ctx.letterSpacing` (Chrome 99+, Safari 17.4+, Firefox 126+); older
  engines ignore the tracking value. · Entreletra no PNG exige `ctx.letterSpacing`.
- Sample text capped at 2000 characters; PNG is 1200 px wide and at most 4000 px tall.
  Texto limitado a 2000 caracteres; PNG de 1200 px de largura e no máximo 4000 px de altura.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`, reading exported pixels back through
`createImageBitmap` + `getImageData` and comparing metrics against independent Canvas math:

- **Metrics** — at 64 px Instrument Serif, pangram: width 967 px, cap 46.0, x-height 33.0,
  ascent 63.0, descent 20.0, 43 chars, 9 words — identical to an independent `measureText`
  computation, and identical again after a reload. A webfont race (metrics computed against the
  fallback face while the webfont loaded) was found and fixed with a `document.fonts.load` guard.
  Medidas conferem com matemática independente e sobrevivem ao reload; uma corrida de webfont foi
  encontrada e corrigida.
- **Contrast** — default pair 15.92:1; a 4.00:1 pair shows the below-AA warning; 17.96:1 shows AA
  pass. All three match an independent WCAG 2.1 computation. · Três razões conferidas com WCAG.
- **PNG** — 1200×240 for “AA”: left-aligned ink bbox x 62–122, centered 570–629, right 1077–1137;
  multiline specimen 276 px tall; tracking +12 widens the ink; uppercase transform applied;
  red-on-white corner pixel exact; 2000 characters → 1200×4000, 729,088 bytes.
  Alinhamentos, multilinha, entreletra, transformação e cores conferidos pixel a pixel.
- **CSS** — snippet carries the live values; `text-transform: uppercase` (an invalid `upper`
  value was found and fixed); a loaded user font emits `@font-face` with its data URL.
  CSS conferido; um valor inválido de `text-transform` foi corrigido.
- **Font loading** — a real `.woff2` loads and renders; duplicate name becomes `-2`; `.txt`,
  garbage bytes and a 9 MB file are each rejected with a localized toast; remove drops the list
  5→4; after reload the custom font is gone (session-only). · Carga, duplicata, rejeições e
  remoção conferidas; fonte própria some no reload.
- **Keyboard** — real CDP key presses: ArrowRight on the size slider 64→65 with live specimen;
  typing “A” into the sample grew it to 44 chars with the metric updating live; tab lists respond
  to ArrowLeft/Right/Home/End; the dropzone activates with Enter/Space.
  Teclas reais verificadas (seta no corpo, digitação no texto, abas e dropzone).
- **Clipboard** — the real write is denied in this embedded panel (“Document is not focused”);
  the app showed its honest error toast on that real failure path. The success payload was
  verified with a stub and matches the CSS snippet exactly.
  Escrita real negada no painel embutido → toast de erro honesto; payload de sucesso via stub.
- **Lifecycle & robustness** — three remounts kept a single listener set; corrupt
  `localStorage` JSON is sanitized back to defaults (e.g. size 65→64) with no console errors.
  Três remontagens sem listeners duplicados; armazenamento corrompo volta aos padrões.
- **i18n & shell** — every key present in EN and PT; docs render 6 usage steps, 5 limits, 2 deps;
  hub shows 4 tools / Creative Studio 3; library search, singular/plural counts, favorites and
  recents all update. · Bilíngue completo; hub/biblioteca/favoritos integrados.
- **Responsive** — same-origin iframes at 320/375/768/1280: `scrollWidth == clientWidth`, no
  element outside the viewport. Two layout bugs found and fixed: tabs squeezed into a scroll
  strip at 375 (now a full-width row ≤480) and a pre-existing topbar overflow at 320 (new ≤360
  compaction, also fixes hub/library). · Sem overflow; dois bugs de layout corrigidos.
- **F0 regression** — QR Studio still encodes (29×29 modules, ECC M) and exports a 512 px PNG;
  Color Studio returns 15.36:1 with 4 passing WCAG cells, reverts invalid HEX and swaps pairs;
  Gradient Lab conic PNG pixels still match the math exactly. Console clean everywhere.
  Regressão F0 aprovada; console limpo.

Screenshots: [`shots/font-preview-desktop.png`](shots/font-preview-desktop.png),
[`shots/font-preview-waterfall.png`](shots/font-preview-waterfall.png),
[`shots/font-preview-glyphs.png`](shots/font-preview-glyphs.png),
[`shots/font-preview-mobile.png`](shots/font-preview-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- The clipboard success path cannot be exercised for real here (the embedded document is never
  focused); it was verified with a stub, and the real denial path was verified end-to-end.
  O caminho de sucesso da área de transferência não é exercitável de verdade neste ambiente.
- Mobile screenshots use a same-origin 375×785 iframe rendered by the same engine, cropped from
  a viewport capture; no physical device was available. · Capturas mobile via iframe 375×785.