# VISTANOLOGY / OPEN

**Useful technology. Open possibilities.**
**Tecnologia útil. Possibilidades abertas.**

An open-source hub of genuinely functional, local-first browser tools — designed as one
contemplative product, not a pile of widgets. Every tool runs entirely in your browser:
your files, keys, texts and images never leave your device.

Um hub open-source de ferramentas de navegador realmente funcionais e local-first —
desenhado como um produto único e contemplativo, não como um amontoado de widgets.
Tudo roda no seu navegador: seus arquivos, chaves, textos e imagens nunca saem do dispositivo.

---

## Visual identity · Identidade visual

Vistanology's own daylight identity: open sky, crystal water, sunlight on glass — the Frutiger Aero language as a
starting point, not as a costume. The goal is a product that looks like Vistanology, not like a theme.
Vistanology tem identidade diurna própria: céu aberto, água cristalina, luz do sol sobre vidro — a linguagem
Frutiger Aero como ponto de partida, não como fantasia. A meta é parecer Vistanology, não parecer um tema.

- Daylight atmosphere layers (sky bloom, rising bubbles, shimmer horizon, reflective sea) behind every view.
- White frosted glass surfaces, aqua gradients, ink-on-paper serif display type, one hue per category.
- Shared bench vocabulary (`.bench`, `.step`, `.bench-sec`) carries eleven stepped tools and the porcelain wells;
  a tool keeps its personality inside that contract — consistency is not sameness.
- Original commissioned artwork, one distinct plate per category and never reused, ships as WebP and is
  precached, so the look is identical online and offline. Nothing is fetched from a CDN.
- The previous night-blue "Cosmic Liquid Glass" theme is preserved untouched in [`v1_css/`](v1_css/) for reference.
- Camadas de atmosfera diurna (brilho do céu, bolhas, linha de horizonte, mar refletivo) atrás de todas as telas.
- Superfícies de vidro branco fosco, gradientes aqua, tipografia serifada tinta sobre papel, uma cor por categoria.
- Vocabulário de bancada compartilhado (`.bench`, `.step`, `.bench-sec`) sustenta as onze ferramentas em etapas e os
  poços de porcelana; cada ferramenta mantém sua personalidade dentro desse contrato — consistência não é mesmice.
- Arte original comissionada em WebP — uma placa distinta por categoria, nunca reaproveitada — pré-carregada no cache:
  o visual é igual on-line e off-line. Nada vem de CDN.
- O tema noturno anterior ("Cosmic Liquid Glass") está preservado sem alterações em `v1_css/`.

---

## Status · F2 complete · U1 offline-first · U2 project store · U3 command palette · U4 worker pipeline (+ U4b evidence-gated adoption) · U5 undo/redo (+ U5b JSON/SVG) · U6 flagship Data Workspace · U7 flagship Visual Page Builder · U8 flagship Design System Lab · U9 flagship Playground · U10 flagship CSS Animation Studio · U11 flagship Component Builder · U12 flagship Image Studio · U13 flagship Favicon & Icon Studio · U14 flagship SVG Editor · U15 flagship Notes Workspace · U16 flagship Kanban Board · U17 flagship Document Workshop · U18 flagship Diagram Studio · U19 flagship Mind Map Studio · AERO full visual redesign (0.24.0) · C design-system consolidation, key art and offline re-verification (0.25.0) — 37 tools (the 31-tool target is met and exceeded)

| Category | Shipped now | Planned |
|---|---|---|
| 01 Creative Studio | Color Studio, Palette Extractor, Gradient Lab, Font Preview, SVG Studio, SVG Editor, Diagram Studio, Mind Map Studio | — |
| 02 Generators | QR Studio, Password, UUID, Lorem Ipsum, Barcode Studio, Favicon & Icon Studio | — |
| 03 Media Lab | Compressor, Converter, Resizer, Metadata | — |
| 04 Developer Tools | JSON, Base64, URL, Regex, Timestamp, Diff, Hash, JWT Inspector, Markdown | — |
| 05 Productivity | Notes Workspace, Kanban Board | Focus Workspace, Pomodoro, Word Counter, Case Converter, Text Cleaner, Unit Converter |
| 06 Documents | Document Workshop | PDF Merge, Split, PDF→Images, Image→PDF, Document Inspector |

The library only lists tools that actually exist and work. Roadmap lives in
[CHANGELOG.md](CHANGELOG.md) — never as dead buttons in the interface.
A biblioteca lista apenas ferramentas que existem e funcionam. O roadmap vive no
CHANGELOG — nunca como botões mortos na interface.

## Run it · Como rodar

No build step, no install, no network required. · Sem build, sem install, sem rede.

```bash
# option 1 — just open it / apenas abra
open index.html            # macOS
start index.html           # Windows
xdg-open index.html        # Linux

# option 2 — serve locally (recommended) / sirva localmente (recomendado)
python -m http.server 8735
# then visit / depois visite http://localhost:8735
```

Works from `file://` as well (classic scripts, no modules, no fetch of local assets).
Funciona também via `file://` (scripts clássicos, sem modules, sem fetch de assets locais).

Serving over `http://localhost` (or https) also enables the **offline-first shell**: the Service
Worker caches the app and the PWA becomes installable; a reload without network keeps working. Over
`file://` the Service Worker is not registered (browsers require a secure context) — every tool still
runs. · Servir via `http://localhost` (ou https) habilita o **shell offline-first**: o Service Worker
cacheia o app e o PWA fica instalável; recarregar sem rede continua funcionando. Em `file://` o SW
não é registrado (exige contexto seguro) — todas as ferramentas continuam rodando.

This offline behavior is **verified in a real browser**, not claimed: with the dev server stopped, a
reload still boots the shell and tools from the Service Worker cache — and saved projects (IndexedDB)
stay readable and writable offline. · Esse comportamento offline foi **verificado em navegador real**,
não apenas afirmado: com o servidor de desenvolvimento parado, recarregar ainda abre o shell e as
ferramentas a partir do cache do Service Worker — e os projetos salvos (IndexedDB) continuam
legíveis e graváveis offline.

## What is inside · O que há dentro

- **Open Hub** — atmospheric hero, category index, favorites and recents, principles.
- **Tool Library** — search (`/` shortcut), category chips, favorites, honest empty states.
- **Project store** — a local-first structured database (`VT.db`, IndexedDB) where tools persist your
  saved work (named gradients today); exported/imported as a `.json` backup in Settings, offline-capable.
- **Command palette** — `Ctrl+K` (or `?`) anywhere: fuzzy-search every tool and run commands
  (navigate, language, motion, glass) without touching the mouse. Works online, offline and `file://`.
- **Worker pipeline** — heavy image scaling (`VT.workers`, inline-Blob Web Worker + OffscreenCanvas) runs
  off the main thread in Image Resizer; the same work falls back to an identical main-thread path when
  Workers/OffscreenCanvas are unavailable. Output bytes are identical. Adoption was measured first and
  applied only where a real main-thread block exists — Compress/Converter/Metadata were evaluated and
  kept on the main thread with the measurements documented. Works online, offline and `file://`.
- **Undo/redo** — `VT.history`, an opt-in, memory-only snapshot controller (bounded stack, coalesced
  typing steps, `Ctrl+Z` / `Ctrl+Shift+Z`) that editors adopt for a professional editing feel. Ships in
  Markdown Preview, JSON Formatter and SVG Studio today; nothing is persisted. · desfazer/refazer só em memória, pilha limitada.
- **Individual applications** — each tool is its own staged workbench with a live stage,
  not a form in a card. · cada ferramenta é uma bancada própria com palco ao vivo.
- **Docs** — per-tool documentation, bilingual, inside the app and in [`docs/`](docs/).
- **Open** — license, releases, contributing, credits/dependencies, privacy.
- **Settings** — language (EN/pt-BR), motion (full/reduced), glass (liquid/solid), saved-projects
  backup/restore/erase, reset local data.

### Shipped tools · Ferramentas entregues

- **[QR Studio](docs/qr-studio.md)** — 7 content types (URL, text, e-mail, phone, SMS, Wi-Fi,
  vCard), colors, quiet zone, ECC, center logo (auto-locks ECC H), PNG/SVG export.
- **[Color Studio](docs/color-studio.md)** — harmony palettes with per-swatch locks, precision
  inspector (HEX/RGB/HSL), WCAG 2.1 contrast checker, k-means image extraction, CSS/HEX/JSON export.
- **[Palette Extractor](docs/palette-extractor.md)** — median cut over the pixels the browser samples:
  2–16 colours with the share of the grid each one holds, the sampling resolution you control, transparency
  skipped or counted, the WCAG ratio of every pair among the leading six, and `:root` CSS / JSON / hex-list
  exports. Deterministic and locally provable — `_dev/probe-palette.js` runs the shipping `medianCut()` against
  hand-computed cases, and the sample image is four flat quadrants whose palette is known before it is read.
  (Color Studio's k-means answers "what dominates this image in six colours"; this answers "what is in the file,
  how much of it is there, and can those colours carry text".)
- **[Gradient Lab](docs/gradient-lab.md)** — linear/radial/conic gradients, live stage, up to eight
  editable stops, six presets, CSS copy and PNG (512/1024/2048) / SVG export verified pixel-for-pixel.
- **[Font Preview](docs/font-preview.md)** — bundled/system/your-own fonts (local FontFace, never
  uploaded), specimen + waterfall + glyph views, measured metrics, live WCAG contrast, CSS/PNG export.
- **[SVG Studio](docs/svg-studio.md)** — inspect, sanitize (strips scripts/handlers/external refs),
  optimize, recolor and export SVG; live preview with zoom/backgrounds, real structure metrics, PNG 1×/2×/4×.
- **[SVG Editor](docs/svg-editor.md)** — a visual vector bench built on a small document model: place rects,
  ellipses, lines, triangles and stars, drag to move, resize from the corners, rotate around the center, snap to
  a grid, style fill/stroke/opacity/corners, reorder/hide/duplicate/delete layers, undo/redo the whole document,
  autosave + named projects, and export clean SVG markup or a crisp PNG (1×/2×/4×) — the canvas and the export
  share one model, so what you edit is exactly what you download. No `eval`, nothing uploaded, offline.
- **[Notes Workspace](docs/notes.md)** — a local-first Markdown notes bench: keep many named notes in IndexedDB
  with tags, write Markdown and see a safe live preview (escape-all-then-format, raw HTML blocked, only
  `http/https/mailto/#` links kept), search across title/body/tags, filter by tag chip, switch Write/Split/Preview,
  undo/redo the body, autosave every note and reopen where you left off — edits flush the instant you switch notes
  or leave the tool, so nothing is lost to the debounce window. Copy Markdown / Copy HTML / Export `.md`. No `eval`,
  no scripts, nothing uploaded, offline.
- **[Kanban Board](docs/kanban.md)** — a local-first task board: build columns, add cards and drag them between
  columns and reorder them with a live ghost + drop placeholder (pointer events, so mouse/touch/pen), edit each card
  (title, description, tags, done) in a side panel, undo/redo the whole board, autosave to IndexedDB and reopen where
  you left off, keep several named projects, dim non-matching cards with search, and export the board as JSON or
  Markdown. All card/column text is rendered from a data model with full HTML escaping — no `eval`, no raw HTML,
  nothing uploaded, offline.
- **[Document Workshop](docs/document-workshop.md)** — a local-first, print-ready document bench (the first tool in the
  Documents category): compose a document from ordered sections of safe Markdown under a cover header (title, author,
  date), with an automatic table of contents, serif/sans themes and an adjustable font size. Preview live in
  Write / Split / Preview modes, undo/redo the whole document, reorder or delete sections, autosave to IndexedDB and
  reopen where you left off, keep several named projects, then export a standalone printable HTML or plain Markdown, or
  send it straight to the browser print dialog (print-only CSS). Every string is HTML-escaped and rendered from a plain
  data model; only `http(s)/mailto/#` links survive (`javascript:` is inert) — no `eval`, no raw HTML, nothing uploaded,
  offline.
- **[Diagram Studio](docs/diagram-studio.md)** — a local-first SVG flowchart bench: add typed nodes (rectangle,
  diamond, capsule, note), connect them with orthogonal arrow edges through a two-step Link flow, and drag them on a
  grid-snapping canvas. Edit the selected node or edge in a live inspector (label, size, fill, stroke, kind),
  undo/redo the whole diagram, autosave to IndexedDB and reopen where you left off, keep several named projects, then
  export clean SVG markup or a 2× rasterized PNG from the same data model. Node/edge labels are SVG text content and
  HTML-escaped in the export — a pasted `<img onerror>`/`<script>` stays inert — no `eval`, no raw HTML, nothing
  uploaded, offline.
- **[Mind Map Studio](docs/mind-map-studio.md)** — a local-first radial mind-map bench: grow a tree from a central
  topic, add branches and sub-branches, collapse/expand a subtree from its on-node badge, and nudge nodes with the
  pointer (grid-snapped, with a **Tidy** reset to the computed layout). Edit the selected node's label and colour in a
  live inspector, undo/redo the whole map, autosave to IndexedDB and reopen where you left off, keep named projects,
  then export clean SVG markup, a 2× PNG, or the raw JSON tree. Labels are SVG text content and HTML-escaped in the
  export — a pasted `<img onerror>`/`<script>` stays inert — no `eval`, no raw HTML, nothing uploaded, offline.
- **[Password Generator](docs/password.md)** — crypto.getRandomValues with rejection sampling (no modulo
  bias), characters + passphrase modes, live entropy/strength, memory-only history that is never stored.
- **[UUID Generator](docs/uuid.md)** — RFC-4122 v4 (122 random bits) and v7 (time-ordered, monotonic
  sequence), 1–100 per batch, case/hyphens/wrapper formats, decoded v7 timestamp, copy-all and .txt export.
- **[Lorem Ipsum Generator](docs/lorem-ipsum.md)** — paragraphs / sentences / words from a 162-word
  classic vocabulary, classic opening, reproducible seeds (xmur3 + mulberry32), plain or HTML `<p>`
  wrap, serif preview vs exact source, .txt / .html export.
- **[Barcode Studio](docs/barcode-studio.md)** — EAN-13 and Code 128 drawn from the published symbol
  tables (extracted and validated by `_dev/extract-ean13.js` / `_dev/extract-code128.js`): the check digit
  is computed for 12 digits and verified for 13, Code 128 picks Code C for digit runs, Code B for text and
  Code A for control characters, the module structure is reported row by row, and the same geometry writes
  both the PNG and the SVG. The value is never uploaded and never stored.
- **[Favicon & Icon Studio](docs/favicon-studio.md)** — monogram or image source rendered through one
  shared routine to true 16/32/48/64/128/180/192/512 px, solid / gradient / transparent fills, circle /
  rounded / square shapes with adjustable radius and padding, live grid at real dimensions, single or
  staggered batch export, a generated `site.webmanifest`, undo/redo over options only (never the image),
  autosave and named presets; nothing leaves the browser.
- **[Image Compressor](docs/image-compress.md)** — local canvas re-encode of PNG/JPEG/WebP with a live
  before/after wipe slider (drag + arrow keys) or side-by-side panes, quality 10–100, honest byte
  savings (can be negative), busy indicator during encode, one-click export; image never persisted.
- **[Image Converter](docs/image-convert.md)** — batch queue converting PNG/JPEG/WebP locally with
  per-file status/size deltas, a transparency badge, chosen JPEG background for transparent pixels,
  individual download plus a dependency-free store-only ZIP (validated with an independent parser).
- **[Image Resizer](docs/image-resize.md)** — resize by percent (1–400%), exact pixels with aspect-ratio
  lock, or a fit-within box; resampling quality (smooth→pixelated), live preview on a checker board,
  honest upscale warning, real output bytes and `<name>-<w>x<h>` export.
- **[Image Metadata](docs/image-meta.md)** — binary inspector for PNG chunks (DPI/text/tIME), JPEG
  EXIF + GPS, WebP flags and GIF/BMP headers, with a privacy warning and a one-click clean re-encode
  that provably strips all metadata.
- **[Image Studio](docs/image-studio.md)** — the flagship non-destructive local image editor: load via file,
  drag-and-drop, clipboard paste or a built-in sample; rotate, flip and center-crop by aspect ratio; tune a
  CSS-filter stack (brightness, contrast, saturation, hue, grayscale, sepia, blur); toggle Compare against the
  untouched original; undo/redo the edit stack, autosave + save named projects to IndexedDB, and export at full
  resolution as PNG/JPEG/WebP (quality slider). The original pixels are never overwritten and the export uses the
  same filter string as the live preview. Local-first and verified offline.
- **[JSON Formatter](docs/json-formatter.md)** — live validation with exact error line/column, pretty /
  minified output (2/4/tab indent), recursive key sorting, syntax-highlighted code and a collapsible
  tree, structure stats, honest copy and `.json` download.
- **[Data Workspace](docs/data-workspace.md)** — the flagship JSON workbench: edit any document as a live
  tree (values, keys, items, nesting) with automatic type detection, path navigation, search, format/minify
  and sort; RFC-4180 **CSV↔JSON** with per-row error handling; **structural diff** by path; a dependency-free
  **JSON Schema subset** validator; **undo/redo**, **IndexedDB** projects with autosave, and **backup/restore**
  — all local-first, incremental rendering for large documents, and verified offline.
- **[Visual Page Builder](docs/page-builder.md)** — the flagship drag-and-drop page composer: build a real
  landing page from 12 block types (hero, heading, paragraph, button, image, quote, list, columns, features,
  call-to-action, divider, spacer). Drag palette chips onto the canvas to insert anywhere, reorder by dragging
  or with up/down tools, edit each block in a properties panel, preview desktop/tablet/mobile, undo/redo the
  whole document, autosave to IndexedDB and restore on return, save named projects, and export clean HTML —
  generated from a typed model with all text escaped and `javascript:`/`data:` URLs neutralized. Local-first
  and verified offline.
- **[Design System Lab](docs/design-lab.md)** — the flagship live token studio for the daylight glass
  identity: tune palette (base/accent/text), glass tint + blur + border, radius scale, shadow and font stacks,
  see it applied instantly to real sample components (hero, buttons, glass card, input, chips), start from one
  of 5 presets, undo/redo the whole token set, autosave + save named themes to IndexedDB, and export a CSS
  custom-properties stylesheet — generated by interpolating only browser-validated values (no scripts, no eval).
  Local-first and verified offline.
- **[Playground](docs/playground.md)** — the flagship sandboxed code playground: write HTML, CSS and JavaScript
  and run them live in an isolated `<iframe>` (`allow-scripts`, never `allow-same-origin`) so your code executes
  in a unique opaque origin and cannot reach this app or its storage. A captured console surfaces your
  log/warn/error calls plus runtime and syntax errors; 4 templates, auto-run, a desktop/mobile viewport toggle,
  named-snippet autosave to IndexedDB, and standalone `.html` export — all with no `eval()`. Local-first and
  verified offline.
- **[CSS Animation Studio](docs/animation-studio.md)** — the flagship visual `@keyframes` editor: tune timing
  (duration, delay, iteration, direction, fill) and an easing curve (named or a custom cubic-bezier with a live
  graph), shape keyframe stops with transform / opacity / color / radius, preview it live with Play/Pause/Restart,
  start from 6 presets, undo/redo the whole animation, autosave + save named animations to IndexedDB, and export
  clean CSS — compiled only from browser-validated control values (no hand-written CSS, no eval). Local-first and
  verified offline.
- **[Component Builder](docs/component-builder.md)** — the flagship visual UI-component composer: pick a type
  (Button, Badge, Alert, Card), tune label / body / variant / size / accent / radius / icon, and watch it render
  live in the daylight glass identity while the HTML + CSS output updates at once. Undo/redo the whole
  component, autosave + save named components to IndexedDB, and Copy HTML / Copy CSS or Export a self-contained
  `.html`. Exported markup escapes all text and the CSS interpolates only browser-validated values (no free-form
  HTML, no eval). Local-first and verified offline.
- **[Base64](docs/base64.md)** — UTF-8-correct encode/decode with URL-safe variant, MIME 76-column wrap,
  live invalid-input detection, byte/char stats, swap, copy and download.
- **[URL Toolkit](docs/url-toolkit.md)** — parse absolute URLs into components, edit/add/remove query params
  with a live rebuilt URL, plus URI-component encode/decode with malformed-escape detection and honest copy.
- **[Regex Tester](docs/regex-tester.md)** — live highlighted matches with index and positional/named capture
  groups, six flag toggles, measured timing, match cap, and a `$1`/`$&`/`$$` replace preview with honest copy.
- **[Timestamp Converter](docs/timestamp.md)** — live now-clock, epoch↔date with auto s/ms detection, ISO/UTC/
  local/locale-aware relative views, range validation and one-click copy of every output.
- **[Text Diff](docs/text-diff.md)** — line-level LCS diff with unified and side-by-side views, ignore
  whitespace/case, honest add/remove/unchanged counts, swap, copy and a unified `.diff` download.
- **[Hash Generator](docs/hash-generator.md)** — SHA-1/256/384/512 of text or a local file via Web Crypto, uppercase
  hex, per-digest copy, identify-a-hash and `.txt` export.
- **[JWT Inspector](docs/jwt-inspector.md)** — Base64url decode of header and payload into a claims table with the
  registered names explained, local-format dates, a validity badge from `exp`/`nbf`, HS256/384/512 signature
  verification through `crypto.subtle`, and an honest refusal for asymmetric and `alg: none` tokens. Token and
  secret are never uploaded and never stored.
- **[Markdown Preview](docs/markdown-preview.md)** — live local Markdown preview (split/preview/HTML), sanitized links,
  code fences, tables and nested lists, word/char/line stats, HTML/Markdown export.

## Principles · Princípios

1. **Local by default.** No uploads, no analytics, no trackers, no accounts.
   **Local por padrão.** Sem uploads, sem analytics, sem rastreadores, sem contas.
2. **Open by design.** MIT license, readable code, documented engines, real changelog.
   **Aberto por design.** Licença MIT, código legível, motores documentados, changelog real.
3. **Made with care.** Real functionality, honest results, accessible interfaces, reduced-motion
   and solid-glass fallbacks. · Funcionalidade real, resultados honestos, interfaces acessíveis.

## Structure · Estrutura

```
vistanology-open/
├── index.html            # shell entry / entrada do shell
├── sw.js                 # offline-first service worker (precache + stale-while-revalidate)
├── app.webmanifest       # instalável PWA manifest / installable PWA manifest
├── css/                  # tokens, base, background, glass, components, shell, apps, responsive
├── js/
│   ├── core/             # utils, storage, db (IndexedDB), i18n, icons, ui, registry, router, palette, workers, history
│   ├── shell/            # hub, library, appframe, docs, open, settings
│   └── apps/             # one file per tool / um arquivo por ferramenta
├── assets/
│   ├── fonts/            # Instrument Serif + Inter (OFL) + LICENSES.md
│   ├── images/           # 10 WebP key-art plates, one per category world (generated for this project)
│   ├── icons/            # PWA app icons (SVG, project asset)
│   └── vendor/           # qrcode.js (MIT, Kazuhiko Arase)
├── docs/                 # per-tool docs / docs por ferramenta
├── LICENSE  CONTRIBUTING.md  CHANGELOG.md  PRIVACY.md
└── .github/ISSUE_TEMPLATE/
```

Architecture: registry-driven SPA. A tool registers a manifest (id, category, icons, bilingual
name/tagline, docs, deps, `mount`, `unmount`); the shell discovers it automatically — hub counts,
library, search, docs and favorites update with zero shell changes.
Arquitetura: SPA dirigida por registry. Cada ferramenta registra um manifesto; o shell a descobre
sozinho — hub, biblioteca, busca, docs e favoritos atualizam sem tocar no shell.

## Dependencies · Dependências

| Asset | Version | License | Use |
|---|---|---|---|
| qrcode-generator (Kazuhiko Arase) | 1.4.4 | MIT | QR matrix engine |
| Instrument Serif | — | OFL 1.1 | display type |
| Inter | — | OFL 1.1 | UI type |
| Key art `assets/images/*.webp` | — | project asset | 10 commissioned plates, one light direction (see `docs/design-system/imagery.md`) |

Full credits in-app: **Open → Credits & dependencies**. · Créditos completos no app: **Open → Créditos**.

## Verified in browser · Verificado no navegador (F0 + F1 + F2 + U1 + U2 + U3 + U4 + U4b + U5 + U5b + U6 + U7 + U8 + U9 + U10 + U11 + U12 + U13 + U14 + U15 + U16 + U17 + U18 + U19)

Runtime evidence, not promises. Full checklists: [docs/checklist-f1.md](docs/checklist-f1.md) ·
[docs/checklist-f2.md](docs/checklist-f2.md) · [docs/checklist-u1.md](docs/checklist-u1.md) ·
[docs/checklist-u2.md](docs/checklist-u2.md) · [docs/checklist-u3.md](docs/checklist-u3.md) · [docs/checklist-u4.md](docs/checklist-u4.md) · [docs/checklist-u4b.md](docs/checklist-u4b.md) · [docs/checklist-u5.md](docs/checklist-u5.md) · [docs/checklist-u5b.md](docs/checklist-u5b.md) · [docs/checklist-u6.md](docs/checklist-u6.md) · [docs/checklist-u7.md](docs/checklist-u7.md) · [docs/checklist-u8.md](docs/checklist-u8.md) · [docs/checklist-u9.md](docs/checklist-u9.md) · [docs/checklist-u10.md](docs/checklist-u10.md) · [docs/checklist-u11.md](docs/checklist-u11.md) · [docs/checklist-u12.md](docs/checklist-u12.md) · [docs/checklist-u13.md](docs/checklist-u13.md) · [docs/checklist-u14.md](docs/checklist-u14.md) · [docs/checklist-u15.md](docs/checklist-u15.md) · [docs/checklist-u16.md](docs/checklist-u16.md).
Evidência de runtime, não promessas. Checklists completos: [docs/checklist-f1.md](docs/checklist-f1.md) ·
[docs/checklist-f2.md](docs/checklist-f2.md) · [docs/checklist-u1.md](docs/checklist-u1.md) ·
[docs/checklist-u2.md](docs/checklist-u2.md) · [docs/checklist-u3.md](docs/checklist-u3.md) · [docs/checklist-u4.md](docs/checklist-u4.md) · [docs/checklist-u4b.md](docs/checklist-u4b.md) · [docs/checklist-u5.md](docs/checklist-u5.md) · [docs/checklist-u5b.md](docs/checklist-u5b.md) · [docs/checklist-u6.md](docs/checklist-u6.md) · [docs/checklist-u7.md](docs/checklist-u7.md) · [docs/checklist-u8.md](docs/checklist-u8.md) · [docs/checklist-u9.md](docs/checklist-u9.md) · [docs/checklist-u10.md](docs/checklist-u10.md) · [docs/checklist-u11.md](docs/checklist-u11.md) · [docs/checklist-u12.md](docs/checklist-u12.md) · [docs/checklist-u13.md](docs/checklist-u13.md) · [docs/checklist-u14.md](docs/checklist-u14.md) · [docs/checklist-u15.md](docs/checklist-u15.md) · [docs/checklist-u16.md](docs/checklist-u16.md).

- ✅ **Flagship Image Studio (U12):** a 27th tool and the flagship non-destructive local image editor. Verified
  in a real browser: mount + dropzone + sample load (800×600, 8 sliders, 5 crop options); **rotate ±90** swaps
  dims to 600×800; **crop 1:1** yields 600×600; **grayscale 100** verified at the **pixel level** (exported center
  pixel R=G=B); **export PNG** decodes to 600×600 — matching the computed full-resolution dimensions; **undo**
  reverts brightness to 0 and **redo** restores 100; **Compare** toggles the original view; **JPEG export** honors
  the quality slider (`sample-edited.jpg`, `image/jpeg`, 20,989 B); **autosave** writes src + edit (brightness 150,
  crop 16:9) → reload → **restore** ("Restored your last edit", controls reflect the state); **named save** adds a
  row while the autosave stays excluded (list 1, db 2). Original pixels never overwritten; export uses the same
  filter string as the preview. **Offline proven with the server stopped** (`curl` exit 000): navigation,
  `image-studio.js` and `apps.css` all `transferSize: 0`, tool mounted from cache, last edit restored, 27 tools.
  0 console errors/warnings; SW re-precached (shell `v30→v31`). See [docs/checklist-u12.md](docs/checklist-u12.md).
- ✅ **Flagship SVG Editor (U14):** a 29th tool and the flagship visual vector bench. Verified in a real browser:
  mount with 5 shape buttons + a live SVG canvas; **drag** moved the shape (geo 240,160 → 288,176, snapped to 8);
  **corner resize** grew 160×110 → **240×192** with the center shifting; the **rotate handle** produced exactly
  **90°** (`transform="rotate(90 312 192)"`); **PNG export** at 2× decodes to **960×640** and the center pixel
  `[157,97,116]` is the **exact** blend of `#FF8FA3` @ 0.6 over `#0B1B2E`; **SVG export** carries `xmlns`,
  `stroke-width="8"`, `opacity="0.6"`; **undo/redo** cycles 3→2→1→2→3; **layer reorder** brings a shape forward
  and **visibility** hides it (2 of 3 rendered); **autosave → remount → restore** ("Restored your last artwork");
  a **named project** save + open round-trips (list 1, db 2); canvas width and the transparent-background toggle
  update the viewBox and markup; **Sample** loads a 4-shape scene. Fixed three real bugs found while verifying:
  the live SVG output panel not refreshing on edits, `hist.apply` calling `applyDoc` (which reset the history and
  wiped undo/redo mid-navigation), and inverted bring-forward/send-backward. **Offline proven with the server
  stopped** (`curl` exit 000): navigation, `svg-editor.js` and `apps.css` all `transferSize: 0`, tool mounted from
  cache with the autosaved sample, 29 tools. 0 console errors/warnings; SW re-precached (shell `v33→v34`).
  See [docs/checklist-u14.md](docs/checklist-u14.md).
- ✅ **Flagship Notes Workspace (U15):** a 30th tool and the flagship local-first Markdown notes bench. Verified
  in a real browser: mount + **New note**; **security** — a pasted `<script>window._pwn=1</script>` and
  `<img onerror>` render as escaped text (0 `<script>`/`<img>` in the preview, `window._pwn` never set) and a
  `javascript:alert(1)` link becomes plain text while the `https:` link is kept (1 anchor, 0 `javascript:` hrefs);
  Markdown (h1/h2, strong/em/del, inline + fenced code, nested lists, blockquote) renders; **undo/redo** the body
  cycles; **Write/Split/Preview** toggle pane visibility; **search** and **tag filter** narrow the list (guide→2,
  clear→3); **Copy MD / Copy HTML / Export .md** return the right payload and a sanitized filename; **autosave →
  reload → restore** reopens the last note and view. Fixed a real bug found while verifying: rapid note switching or
  leaving the tool inside the 600 ms autosave debounce silently dropped the current note's edits — replaced with an
  explicit dirty flag and `flushSave()` on `openNote`/`newNote`/`unmount`, re-verified so three back-to-back notes
  all persist title, tags and body. **Offline proven with the server stopped** (`curl` exit 000): navigation,
  `notes.js` and `apps.css` all `transferSize: 0`, tool mounted from cache, 30 tools. 0 console errors/warnings;
  SW re-precached (shell `v35→v36`). See [docs/checklist-u15.md](docs/checklist-u15.md).
- ✅ **Flagship Kanban Board (U16):** a 31st tool and the flagship local-first task board. Verified in a real browser:
  registry shows **31 tools** and the new **0.20.0** release; mount renders the stage + 3 default columns and **Sample**
  loads 2/1/1 cards. **Security** — a pasted `<img src=x onerror=...>` card title renders as inert text (0 image tags
  in the DOM, `window.__pwned` never set); text flows only through `textContent`/`esc`, no `eval`/raw HTML. **Drag &
  drop** via synthetic `PointerEvent` moves a card *To do → In progress* with a floating ghost + dashed placeholder that
  clean up on drop, and the same drag is **undo/redo**-able. **Undo/redo** the whole board walks the column count
  (3 adds → count 4/5/6, undo → 5/4/3, redo → 4/5) and the buttons enable/disable with the stack. Add-column and the
  card composer add content; the **side panel** edits a card title and toggles **done**; **search** dims non-matching
  cards; **autosave → reload → restore** brings the board (incl. a marker card) back from `kanban:autosave`; **named
  project** save + open round-trips (list 1, db 2, autosave row excluded); column **delete** confirms then removes;
  **Export JSON / Markdown** emit `My_board.json` + `My_board.md` (captured via a `downloadText` stub). Fixed a real
  bug found while verifying: the Undo/Redo buttons stayed `disabled` after edits because `syncHist()` only ran on
  undo/redo/apply — and a disabled button swallows its click, so the first Undo did nothing; `record()` now refreshes
  the buttons. **Offline proven with the server stopped** (`curl` exit 7 / `http=000`): navigation, `kanban.js`,
  `apps.css` and `app.js` all `transferSize: 0`, tool mounted from cache with the autosave board restored (3 cols /
  4 cards), 31 tools. 0 console errors/warnings; SW re-precached (shell `v36→v37→v38`). Cross-tool regression clean.
  See [docs/checklist-u16.md](docs/checklist-u16.md).
- ✅ **Flagship Document Workshop (U17):** a 32nd tool — the first to fill the **Documents** category — and the
  flagship local-first, print-ready document bench. Verified in a real browser: registry shows **32 tools** and the new
  **0.21.0** release; **default loads 1 section** and **Sample → 3 sections** (73 words · 459 chars). The safe-Markdown
  renderer produces headings, **strong**, **inline + fenced code**, **blockquote**, **ul/ol**, **`---` → `<hr>`** and
  **task lists with real `.dw-cb` checkboxes** (3 spans, 2 checked) plus a **3-link TOC** with in-page anchors and one
  `https://example.com` link carrying `rel="noopener noreferrer" target="_blank"`. **Add / reorder / delete** sections
  work and the **Undo/Redo buttons** drive the whole-document history (4 → 3 → 4). **Autosave** writes `dw:autosave`
  (correct tool id) and a **reload restores** the content, section count and mode; **named project** save/open
  round-trips with the autosave row excluded. **Export HTML** yields a `<!doctype html>` file, **Export Markdown** a
  `#`-rooted `.md`, and **Print** fires the hidden iframe's `print()` against a document that carries a **doctype + the
  rendered sections** (the iframe `print()` was patched so no real dialog opened). **Security** — an `<img onerror>` /
  `<script>` body and a `javascript:` link render as inert escaped text (`https://` kept) and **`window.__pwned` stays
  `undefined`**. **i18n EN+PT** (New ↔ Novo). **Offline proven with the server stopped** (`curl` exit 7): navigation +
  **all 62 resources** incl. the fixed `document-workshop.js` served with `transferSize: 0`, tool rendered 4 sections
  and autosave restored from IndexedDB. Fixed three real bugs while verifying: an undeclared `saveTimer` (threw before
  `applyDoc` assigned `doc` → nothing rendered), task checkboxes escaped instead of emitted, and `record()` not calling
  `syncHist()` (same disabled-Undo-button class as Kanban). 0 console errors/warnings; SW re-precached (shell
  `v39→v40`); cross-tool regression clean. **Screenshot pending** — the in-app Browser surface reports
  `visibilityState=hidden`, so `take_screenshot` is unavailable here (as recorded for Kanban); layout validated via DOM
  + computed styles. See [docs/checklist-u17.md](docs/checklist-u17.md).
- ✅ **Flagship Diagram Studio (U18):** a 33rd tool and the flagship local-first SVG flowchart bench. Verified in a real
  browser: registry shows **33 tools** and the new **0.22.0** release; the module handle resolves (`VT.modules['diagram-studio']`
  defined) and the tool mounts with **3 children**. **Sample → 4 nodes · 3 edges** with an arrow marker and live stats;
  each of the **4 node kinds** adds (→ 8 nodes). A **node drag** via synthetic PointerEvents moves the node (40,60) →
  (120,112) snapped to the 8px grid, and **undo/redo of the whole diagram** restores exactly (120,112 → 40,60 → 120,112).
  **Select → live inspector**: the label edit flows into the SVG text immediately. The **two-step Link** adds exactly one
  edge (3 → 4); an **edge click** selects it and its label edits into the markup; **delete node cascades its edges**
  (8 → 7 nodes, 4 → 2 edges) through a confirm dialog. **Autosave** now captures live edits and a **reload restores** them
  (this fixed a real bug — `scheduleSave()` dispatched a never-wired `autosave` handle); a **named project**
  save → mutate → **Open** round-trips with the autosave row excluded. **Export SVG** is `<svg>`-rooted with labels
  HTML-escaped; **Export PNG** is a valid **1440×960 (2×)** blob. **Security** — an `<img onerror>` / `<script>` label is
  inert on the canvas and stays escaped (`&lt;img…&gt;`) in the export, `window.__pwned` `undefined`. **i18n EN↔PT flips
  the composed stats too** (added a `vt:lang` re-render). **Responsive**: at a 666px viewport the workspace collapses to a
  single stacked column (≤980 media rule). **Offline proven with the server stopped** (`curl` exit 7): navigation + every
  asset served with `transferSize: 0`, zero network bytes, and Sample still rendered on v0.22.0. Fixed five real bugs while
  verifying (missing `return def`, missing `ds.stats` EN+PT keys, unwired `autosave`, `selectNode` not refreshing the
  inspector, stale stats on language switch). 0 console errors/warnings; SW re-precached (shell `v40→v41`); cross-tool
  regression clean (notes / kanban / document-workshop / hub all mount). **Screenshot pending** — the in-app Browser
  surface reports `visibilityState=hidden`, so `take_screenshot` is unavailable here (as for Kanban/Document Workshop);
  layout validated via DOM + computed styles. See [docs/checklist-u18.md](docs/checklist-u18.md).
- ✅ **Flagship Mind Map Studio (U19):** a 34th tool and the flagship local-first radial mind-map bench. Verified in a
  real browser: registry shows **34 tools** and the new **0.23.0** release; the module handle resolves
  (`VT.modules['mind-map-studio']` defined) and mounts with **3 children**; default is **1 central node**, Sample is
  **11 nodes · 10 branches** with 4 collapse badges. **Node drag** (synthetic PointerEvents) moves a node (+71,+48) and
  **Tidy** restores the computed radial layout; **root collapse** hides the whole subtree (11 → 1) and expand restores
  it; a **level-1 collapse** hides just that sub-tree. **Add branch** / **Add sibling** each add exactly one node;
  **delete cascades the subtree** (11 → 8 for a branch with 2 children) and **undo/redo** restores it exactly; **root
  delete is blocked** (no confirm dialog). **Autosave** captures a live rename and a **reload restores** it; a **named
  project** save/open with the autosave row excluded. **Export SVG** escapes an XSS payload (inert, `window.__pwned`
  `undefined`, no raw `<img`/`<script>`), **Export JSON** parses back to a tree, **Export PNG** is a valid
  **1600×1120 (2×)** blob. **i18n EN↔PT** flips toolbar, counter and stats; **responsive** — at a 666px viewport the
  workspace collapses to a single column (≤980 media rule). **Offline proven with the server stopped**: navigation +
  every asset `transferSize: 0`. Fixed during verification: a PT `mm.addSibling` typo and a pluralization nit in the PT
  stats string. 0 console errors/warnings; SW re-precached (shell `v41→v42`); cross-tool regression clean. **Screenshot
  pending** — the in-app Browser surface reports `visibilityState=hidden` (as for Kanban/Document Workshop/Diagram
  Studio); layout validated via DOM + computed styles. See [docs/checklist-u19.md](docs/checklist-u19.md).
- ✅ **Flagship Favicon & Icon Studio (U13):** a 28th tool and the flagship local favicon/app-icon generator.
  Verified in a real browser: mount with monogram/image tabs and an 8-cell grid at true dims; **export all**
  yields 8 PNGs; a **512** export decodes to **512×512** with **~96%** opaque pixels in the monogram; **circle**
  shape clips corners (center alpha 255, corner alpha 0); **image** source exports the loaded color
  (center pixel RGB `[255,0,0]`); **undo/redo** cycle `bgMode`/`shape` over options only (never the image);
  the generated **`site.webmanifest`** is valid JSON listing 8 icons; **autosave → reload → restore** reproduces
  the loaded image (center pixel RGB `[0,255,136]`); a **named preset** appears in the side list (1) while the
  autosave stays out of it (2 in db). Fixed a real bug where `#fs-src-label` did not refresh after loading an
  image. **Offline proven with the server stopped** (`curl` exit 000): navigation, `favicon-studio.js` and
  `apps.css` all `transferSize: 0`, tool mounted from cache, 28 tools. 0 console errors/warnings; SW
  re-precached (shell `v32→v33`). See [docs/checklist-u13.md](docs/checklist-u13.md).
- ✅ **Flagship Component Builder (U11):** a 26th tool and the flagship visual UI-component composer. Verified
  in a real browser: mount with 4 type chips (Button/Badge/Alert/Card) + 6 control rows + a live button preview +
  HTML/CSS output panes; switching to **Alert** exposes info/success/warning/error variants and the **error**
  variant auto-sets accent `#FF8FA3` in both the HTML and CSS; typing `<img src=x onerror=alert(1)>` into a label
  is **escaped** in the output and yields **zero live `<img>`** in the preview; **undo** restores the prior label
  ("Heads up") and **redo** re-applies it; **autosave → reload → restore** brings back the "Aurora Panel" card with
  hint "Restored your last component"; **named save** adds a row while the autosave stays excluded from the list
  (list 1, db 2); **Copy HTML / Copy CSS** and **Export** a self-contained `vistanology-component.html` (DOCTYPE,
  `text/html`) all fire. Exported markup escapes all text and CSS interpolates only browser-validated values (no
  free-form HTML, no eval). **Offline proven with the server stopped** (`curl` exit 000): navigation,
  `component-builder.js` and `apps.css` all `transferSize: 0`, tool mounted from cache, "Aurora Panel" card restored,
  26 tools registered. 0 console errors/warnings; SW re-precached (shell `v28→v29`). See [docs/checklist-u11.md](docs/checklist-u11.md).
- ✅ **Flagship CSS Animation Studio (U10):** a 25th tool and the flagship visual `@keyframes` editor. Verified
  in a real browser: mount with 3 control groups + a live preview target (`animation-name: as-anim`, `1.2s`,
  `ease-in-out`) + an easing-curve SVG; **preset** Spin emits `360deg`/`linear`; **custom easing** reveals 4
  bezier sliders, writes `cubic-bezier(…)` into the CSS and draws 2 curve handles; a **stop property** edit
  updates the compiled CSS (`scale(1.750)`); **add stop** grows the chips; **play/pause** sets
  `animation-play-state: paused` on the live `<style>` while the **export panel stays clean** (no play-state
  baked in); **undo** works; **Export** downloads `vistanology-animation.css`; **autosave → reload → restore +
  run** (bounce, 5 stops, hint "Restored your last animation" sticks); **named animation** save → switch → open
  round-trip. CSS compiles only from browser-validated control values (no free-text CSS, no eval). **Offline
  proven with the server stopped** (`curl` exit 000): navigation and `animation-studio.js` both `transferSize: 0`,
  tool mounted from cache, bounce restored and running. 0 console errors; SW re-precached (shell `v24→v27`);
  `animation-studio` added to the 62-URL precache. See [docs/checklist-u10.md](docs/checklist-u10.md).
- ✅ **Flagship Playground (U9):** a 24th tool and the flagship sandboxed code playground. Verified in a real
  browser: mount with 3 editor tabs + sandboxed iframe + captured console; **console capture** proven (log/warn/error
  with object serialization); **runtime + syntax error** capture; child DOM works inside the frame;
  **opaque-origin isolation** proven — from inside the sandbox `parent.document`, `localStorage` and `parent.VT` all
  throw `SecurityError` (the frame is `allow-scripts` only, never `allow-same-origin`, and **no `eval`** is used);
  template apply, **auto-run** debounce, desktop/mobile viewport toggle and **Ctrl/Cmd+Enter** run all work;
  **autosave → reload → restore + run** (hint "Restored your last snippet" sticks); **named snippet** save → open
  round-trip; **Export .html** downloads a standalone file. **Offline proven with the server stopped** (`curl` exit
  000): navigation and `playground.js` both `transferSize: 0`, tool mounted from cache, snippet restored and run.
  0 console errors; SW re-precached (shell `v21→v24`); `playground` added to the 61-URL precache.
  See [docs/checklist-u9.md](docs/checklist-u9.md).
- ✅ **Flagship Design System Lab (U8):** a 23rd tool and the flagship live token studio for the identity.
  Verified in a real browser: mount with 4 control groups / 13 controls / 5 presets; color edit updates the live
  `--ds-accent` var and the CSS source; range edit updates `--ds-blur` + value label + CSS; preset apply rebuilds
  controls and shows a hint; **undo** restores the prior token set; **CSS export** proven valid (`:root`,
  `--ds-surface`, `--ds-shadow`, `vistanology-tokens.css`, `text/css`); **autosave → reload → restore** (frost
  theme back, hint shown); **named theme** save → switch → open round-trip (aurora restored over midnight).
  Exported CSS interpolates only browser-validated values (no scripts, no eval). **Offline proven with the server
  stopped** (`curl` exit 000): navigation `transferSize: 0`, shell + tool from cache, autosave theme restored from
  IndexedDB. 0 console errors; SW re-precached (shell `v19→v21`); `design-lab` added to the 60-URL precache.
  See [docs/checklist-u8.md](docs/checklist-u8.md).
- ✅ **Flagship Visual Page Builder (U7):** a 22nd tool and the strongest drag-and-drop composer in the
  ecosystem — a typed block model rendered into a live canvas, edited through a properties panel and exported
  as clean HTML. Verified in a real browser: mount + starter template (5 blocks); palette add + delete with
  undo restore (5→4→5); **drag-from-palette insertion** and **drag-reorder** via synthetic `DragEvent`/`DataTransfer`
  (quote dropped to index 2, then moved to index 0); up/down reorder (a coordinate bug was found and fixed);
  property editing (text + align → `pb-align-center`); responsive preview switch (mobile → canvas `390px`,
  persisted to `localStorage`); **HTML export** proven to be a full document with the malicious text rendered as
  escaped `&lt;script&gt;` (0 live `<script>`/`<b>` elements) and a `javascript:` href neutralized to `#`;
  **IndexedDB** project save → reload → open (heading text restored) and **autosave → reload → restore**
  (9 blocks, status hint shown); hero/features/CTA blocks render and export; full EN/PT i18n. **Offline proven
  with the server stopped** (`curl` exit 000, port closed): navigation `transferSize: 0`, shell + tool loaded
  from cache, autosave document restored from IndexedDB with no network. 0 console errors; SW re-precached
  (shell `v16→v19`); `page-builder` added to the 59-URL precache. See [docs/checklist-u7.md](docs/checklist-u7.md).
- ✅ **Flagship Data Workspace (U6):** a 21st tool and the strongest JSON workbench in the ecosystem —
  five cohesive tabs (Editor · CSV↔JSON · Compare · Schema · Projects), not one crowded screen. Verified
  in a real browser: live tree edit/add/delete with automatic type detection; case-insensitive **search**
  that filters and force-expands (21→2→21 rows); **minify/pretty** + **sort keys** that never pollute
  undo (history snapshots `canonical()` content only); RFC-4180 **CSV↔JSON** with embedded commas, escaped
  quotes, numeric coercion and per-row field-count warnings; **structural diff** by path (added/removed/
  changed); a dependency-free **JSON Schema subset** validator (type/properties/required/items/enum) with
  pass/fail/bad-schema handling; **IndexedDB** save/open/delete + **autosave across reload** + file-based
  **backup/restore** (merge or replace). Large arrays render **incrementally** (200 children + “Show N
  more”; 5000-item doc: 201→401 rows, apply ≈222 ms, no freeze). **Offline proven with the server stopped**
  (`curl` exit 7): navigation `transferSize: 0`, tool mounted from cache, projects opened from IndexedDB.
  0 console errors; SW re-precached (shell `v11→…→v16`); `data-workspace` added to the 58-URL precache.
  See [docs/checklist-u6.md](docs/checklist-u6.md).
- ✅ **Undo/redo (U5 + U5b):** `VT.history` snapshot controller wired into Markdown Preview, JSON
  Formatter and SVG Studio (all 1.1.0). Verified in a real browser: typing coalesces to **one undo step
  per pause** (500 ms debounce); `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` and the Undo/Redo buttons
  round-trip Sample → edit → Clear; in JSON Formatter a redo **re-validates the live output**; in SVG
  Studio undo/redo covers **Optimize, Recolor and Load-file** and the apply path **re-sanitizes,
  re-parses and re-renders**; button disabled state tracks `canUndo`/`canRedo`; leaving the tool and
  returning **resets history** (no cross-tool or cross-session leak — memory-only, nothing persisted).
  0 console errors; 20/20 regression clean; SW re-precached (shell `v5→v6→v7→v8`); offline cold reload
  (`transferSize: 0`) and `file://` both exercised. See [docs/checklist-u5.md](docs/checklist-u5.md) and
  [docs/checklist-u5b.md](docs/checklist-u5b.md).
- ✅ **Worker adoption evaluated, not assumed (U4b):** Compress/Converter/Metadata were measured against
  the Resizer's worker path before deciding. On 3200×2400 images the 1:1 `drawImage` cost ≈0 ms and the
  browser encodes off the main thread — **0 `longtask` entries** either way, outputs **byte-identical**
  (SHA-256), so offloading offered no responsiveness gain; Metadata is pure EXIF byte parsing the canvas
  worker cannot offload. All three integrations were **rejected with the measurements documented**; no
  application code changed. Only Image Resizer keeps the worker. See [docs/checklist-u4b.md](docs/checklist-u4b.md).

- ✅ **Worker pipeline (U4):** `VT.workers` (inline-Blob Web Worker + OffscreenCanvas) drives Image
  Resizer 1.1.0. **Byte-identity proven by SHA-256**: worker `convertToBlob` output equals the main-thread
  `canvas.toBlob` reference for both PNG (`929a891304bddb42`) and JPEG (`5058bc03a90d9855`) at identical
  params; the forced fallback path produces the same bytes as the worker. **Long task 121 ms → 73 ms** on a
  3000×2000 resize (worst frame gap 79 ms), UI stays responsive. Works online, **offline** (server killed,
  `netstat` empty, `curl` exit 7, `transferSize: 0`: a resize yields the byte-identical 8,148 B WebP), and
  `file://` (worker `supported`, SW absent, PNG output produced). 0 console errors; 20/20 regression clean
  after remount cycles; lazy loading evaluated and rejected (≈702 KB same-origin boot, Service Worker already
  precaches ≈399 KB tool scripts — complexity without perceptible gain). SW re-precached 56/56 on `v4→v5`.

- ✅ **Command palette (U3):** `Ctrl+K` / `⌘K` / `Ctrl+P` / `?` / top-bar button all open it; fuzzy
  ranking (`grad` → Gradient Lab first; multi-word `colo stu` → Color Studio), `↑↓`/`Tab`/`Enter`/`Esc`
  verified with focus restored to the origin element; commands executed: navigation (`#/settings`,
  `#/tool/color-studio`), language switch EN↔PT with chrome relabelled, motion and glass toggles applied
  and restored. Typing `?` inside the Library search is ignored; `/` still works. **Offline cold boot
  with the port confirmed closed** (curl exit 7, navigation `transferSize: 0`): palette opens, searches,
  launches tools and runs commands from cache. `file://`: fully functional. 0 console errors; 20/20
  regression clean; SW auto-updated `v1→v2` and re-precached 55/55.

- ✅ **Project store (U2):** `VT.db` (IndexedDB) full CRUD/sort/exportAll/importAll (merge + replace,
  malformed records skipped) verified in a real browser; **persists across reload**; works on
  `http://localhost`, `file://`, and **offline** (cold boot with the server killed renders and loads a
  saved Gradient Lab gradient, angle 200° applied; reconnect recovers). Settings count/export/import/
  erase and the global "Reset local data" (now also clearing projects) all verified; EN + PT strings
  correct; 0 console errors; no horizontal overflow; 20/20 tool regression clean.

- ✅ **Offline-first (U1):** SW registers → `activated` and controls the page; `vt-shell-v1` holds 53
  entries; **with the server killed** a reload boots the app from cache (a probe `fetch` throws
  `TypeError`, proving genuine disconnection under `no-store`), JSON Formatter still returns "Valid
  JSON" and Color Studio renders its palette offline, SPA nav + shell intact, 0 console errors;
  reconnect recovers cleanly; manifest applies (`display:standalone`, 2 icons); network badge verified
  offline/online and under reduced motion; `file://` unaffected (SW not registered); **46 network
  requests, all same-origin — zero cross-origin/CDN calls.**

- ✅ Hub, Library, Docs, Open, Settings render; console clean (no errors/warnings).
- ✅ Library: multi-word search, category chips, favorites persisted (`localStorage`), `/` shortcut, empty states.
- ✅ i18n: full EN↔PT switch incl. apps, docs, open, settings; persisted; plural forms correct.
- ✅ QR Studio: URL / Wi-Fi (escaped `; : " space`) / Unicode text round-trip **decoded with jsQR**;
  logo → ECC H locked and still decodable; SVG export rasterized and decoded; PNG export 512 px;
  invalid input → localized error + disabled exports; state survives remount (size/ECC/logo UI in sync).
- ✅ Color Studio: 6 harmonies (analogous hues verified at 15° steps), locks keep swatches on regenerate,
  inspector HEX/RGB/HSL paths + invalid-HEX revert with toast, contrast 17.96:1 matches WCAG math,
  4 WCAG cells pass/fail correctly, swap, k-means extraction of 4 exact colors from a synthetic image,
  "use as palette", export modal CSS/HEX/JSON.
- ✅ Gradient Lab: linear geometry at 0/45/90/180/225/270° verified against exported pixels; CSS, PNG
  and SVG return identical samples even with an out-of-order stop list; radial circle/ellipse and
  conic angles match the math (a 90° canvas/CSS origin bug was found and fixed); 2048 px export
  measured 2048×1280; min-2/max-8 guards, clamping, focus kept while typing, four remount cycles
  without duplicated listeners, corrupt-storage fallback, EN/PT docs and library integration.
- ✅ Font Preview: metrics equal independent Canvas math (967 px / cap 46 / x 33 / asc 63 / desc 20
  at 64 px) and survive reload (a webfont race was found and fixed); contrast 15.92 / 4.00 / 17.96:1
  match WCAG; PNG alignment bboxes, multiline, tracking, transform and colors verified pixel-for-pixel
  (2000 chars → 1200×4000); real .woff2 load, duplicate `-2`, bad-ext/bad-content/9 MB rejects, remove,
  session-only; real key presses (ArrowRight 64→65, typing updates live); corrupt-storage sanitize;
  320/375/768/1280 clean (two layout bugs fixed); F0 regression passed.
- ✅ SVG Studio: hostile SVG (script/onload/javascript:/foreignObject/external use/data:svg/external
  url()/@import) sanitized with 8 items removed and clean preview + copy/download payloads; optimize
  476→414 B render-preserving; recolor by chip + HEX; PNG 2× measured 200×200; validation, clear,
  persistence, 3 remounts without duplicate listeners, EN/PT, 320–1280 clean.
- ✅ Password Generator: unbiased sampling verified by tallying 1920 draws (uniform, no ambiguous
  glyphs); entropy math checked (128/192/38 bits); passphrase format; history capped at 8 and
  memory-only (stored object holds settings only, no secrets); hide/copy; 320 px overflow fixed.
- ✅ UUID Generator: v4 (5 and 100) and v7 (100) matched RFC-4122 regexes, unique and time-sorted;
  fresh v7 timestamp decoded to the probe clock; upper/no-hyphen/braces/urn formats checked (URN
  prefix-casing bug found and fixed); copy 100 lines + .txt download 100 lines; settings-only
  persistence; 3 remounts without duplicate listeners; 320–1280 clean.
- ✅ Lorem Ipsum: seed determinism (same seed = identical payload across regenerate and reload,
  different seed differs, empty varies); units 5 paragraphs / 7 sentences / 40 words exact; classic
  opening on/off; `<p>` wrap + .html/.txt exports + copy; Preview/Source tabs with real ArrowLeft;
  corrupt-storage fallback (out-of-range count rejection fixed); literal-`<p>` escaping fixed;
  3 remounts single toast; 320–1280 clean.
- ✅ Image Compressor: sample 1 249 118 B PNG; PNG→PNG honest `−0.0%`; JPEG quality monotonic and
  byte-exact vs a direct `toBlob` ground truth (q80 88 496 / q30 18 736 / q10 7 456 B); WebP measured;
  busy `…` + disabled download during encode (stale-metrics gap fixed); export name/type/dims verified
  via `createImageBitmap`; real-key slider (±2 / Shift±10 / Home / End) + pointer drag; side-by-side;
  txt/SVG/corrupt-PNG rejects keep the loaded image; settings-only persistence; 3 remounts 0 toasts;
  320–1280 clean.
- ✅ Image Converter: 2-file batch with live per-row status and totals; PNG→PNG honest `−0.0%`;
  transparency badge only on the alpha sample; JPEG background fill verified pixel-exact (white then
  red center); JPEG/WebP deltas measured; individual export name/type/size; ZIP unzipped with
  **fflate** (independent parser) → correct names, JPEG magic and byte-identical sizes; txt/SVG/corrupt
  rejects leave the queue intact; remove/clear; settings-only persistence; 3 remounts 0 toasts;
  320–1280 clean.
- ✅ Image Resizer: percent 50 → 600×400 verified via `createImageBitmap` on the export; pixels mode
  aspect-lock derives 300→200 and unlocks to 300×100; fit box 400×400 → 400×267; percent 200 →
  2400×1600 with honest upscale warning; high vs low resampling changes output bytes; txt/SVG/corrupt
  rejects keep the image; settings-only persistence; 3 remounts 0 toasts; 320–1280 clean.
- ✅ Image Metadata: PNG sample 96×96 dpi + `tEXt` + `tIME` decoded; JPEG sample full EXIF and GPS
  `-23.550000, -46.633333` (S/W negated) with privacy banner; WebP/GIF/BMP headers parsed; clean-copy
  round-trip re-inspected shows zero metadata (EXIF/GPS/text stripped); txt/SVG/corrupt rejects;
  settings-only persistence; 3 remounts 0 toasts; 320–1280 clean.
- ✅ JSON Formatter: sample stats hand-verified (10 keys / 18 nodes / depth 5); five invalid inputs give
  correct line/col (engine position + local scanner fallback); pretty/minify/2/4/tab/sort byte-exact;
  collapsible tree; copy shows success only on real success and error when clipboard+fallback both fail;
  `.json` download; settings-only persistence; 3 remounts 0 toasts; 320–1280 clean.
- ✅ Base64: UTF-8 encode byte-identical to an independent ground truth and decode round-trips emoji/CJK;
  URL-safe (no +/=) round-trips; 76-col wrap = 76/76/76/40; invalid flagged; swap both directions;
  copy/download exact; settings-only persistence; 3 remounts 0 new toasts; 320–1280 clean.
- ✅ URL Toolkit: components + rebuilt URL byte-identical to an independent `new URL` ground truth; param
  edit/add/remove live (`utm=open hub` → `utm=open+hub`); invalid and relative URLs rejected; credentials +
  port preserved; Unicode percent-encoded; component encode matches `encodeURIComponent` and decode
  round-trips emoji/CJK; malformed `%ZZ` / trailing `%` flagged; honest copy incl. total-failure error toast;
  settings-only persistence; 3 remounts 0 new toasts; 320–1280 clean.
- ✅ Regex Tester: sample matches/groups/replace byte-identical to an independent `matchAll`/`replace` ground
  truth; invalid regex reports the engine error; zero-length `a*` safe; `i`/`m`/`u`/non-`g` and named groups
  verified; 500-match cap reported; `$&`/`$$` templates exact; singular/plural correct; honest copy incl.
  total-failure error toast; flags-only persistence; 3 remounts 0 new toasts; 320–1280 clean.
- ✅ Timestamp Converter: auto s/ms and explicit-unit conversions byte-identical to an independent `Date`
  ground truth (incl. negative epoch); invalid and out-of-range flagged with error styling; date→epoch and
  local picker verified; relative label localized (PT/EN); live now-clock ticks; honest copy; settings-only
  persistence with interval cleared on unmount; 3 remounts 0 new toasts; 320–1280 clean.
- ✅ Text Diff: sample LCS byte-identical to an independent ground truth (+2/−2, 3 unchanged, correct line
  numbers); split columns aligned with blanks; ignore whitespace/case toggle identical↔changed; swap symmetric;
  identical/empty neutral; 2000-line cap truncates and flags; copy + `.diff` download byte-exact with honest
  failure toast; settings-only persistence; 3 remounts 0 new toasts; 320–1280 clean.
- ✅ Hash Generator: all four digests byte-identical to an independent Node `crypto` ground truth for text, a UTF-8
  sample and a local file; uppercase hex, identify-a-hash (match + no-match), per-digest copy and `.txt` export exact
  with honest failure toast; settings-only persistence; 3 remounts 0 new toasts; 320–1280 clean.
- ✅ Markdown Preview: sample structure byte-matches hand-computed HTML (headings/emphasis/nested lists/quote/code/
  table/hr); XSS-safe (script/onerror escaped, javascript: stripped, remote images never fetched, data: images render);
  split/preview/HTML views correct; copy + `.html`/`.md` exports exact with honest failure toast; settings-only
  persistence; 3 remounts 0 new toasts; 320–1280 clean.
- ✅ Settings: motion/glass toggles apply `body[data-*]` and persist; reset asks confirmation and cancels safely.
- ✅ Navigation: hash routes, back/forward, per-view cleanup, focus management.
- ✅ Responsive at 375 / 768 / 1000 / 1280: no horizontal overflow; stage-first on small screens;
  wordmark compacts; grids collapse 5→2 / 4→3→2 columns.
- ✅ Accessibility basics: focus-visible rings, aria-pressed/labels on tiles and locks, modal focus trap + ESC,
  `prefers-reduced-motion` and solid-glass fallbacks.

### Known limitations · Limitações conhecidas

- Clipboard write can be denied in embedded/preview browsers; the app falls back to `execCommand`
  and shows an honest error toast when both fail. · Clipboard pode ser negado em browsers embutidos.
- QR center logo covers ~20% of the code; ECC is locked to H while a logo is present. Keep strong contrast.
- k-means extraction is approximate by design (≤4000 sampled pixels, 10 iterations).
- `file://` works, but some browsers restrict `localStorage` per-file; serving locally is recommended.

## Contributing · Contribuindo

Read [CONTRIBUTING.md](CONTRIBUTING.md) — how to add a tool, code style, and the verification bar
("do not claim tested what was not tested"). Issues and feature requests via GitHub templates.
Leia o CONTRIBUTING — como adicionar uma ferramenta, estilo de código e a barra de verificação.

## License · Licença

[MIT](LICENSE) © 2026 Vistanology. Fonts and vendor libraries keep their own licenses (OFL / MIT).