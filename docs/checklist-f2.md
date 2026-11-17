# F2 Checklist · Checkpoint da F2

Runtime evidence for the twelve F2 tools (4 Media Lab + 8 Developer Tools), collected in Chromium
against `http://localhost:8735` (dev server, no-store). Every line below was observed in the browser,
not assumed. · Evidência de runtime das doze ferramentas da F2, coletada em Chromium contra
`http://localhost:8735`. Cada linha abaixo foi observada no navegador, não suposta.

Legend · Legenda: ✅ observed pass · 🛠 bug found **and fixed**, then re-verified.

---

## 03 · Media Lab

### Image Compressor
- ✅ Sample 1 249 118 B PNG; PNG→PNG honest `−0.0%`; JPEG quality monotonic and byte-exact vs a
  direct `toBlob` ground truth (q80 88 496 / q30 18 736 / q10 7 456 B); WebP measured.
- ✅ Busy `…` + disabled download during encode. 🛠 stale-metrics gap fixed.
- ✅ Export name/type/dims verified via `createImageBitmap`; before/after wipe slider (drag + arrow
  keys) and side-by-side panes.
- ✅ Real-key slider (±2 / Shift±10 / Home / End) + pointer drag; txt/SVG/corrupt-PNG rejects keep the
  loaded image; settings-only persistence; 3 remounts 0 toasts; 320–1280 clean.
- Shots · Capturas: `shots/image-compress-desktop.png`, `shots/image-compress-mobile.png`.

### Image Converter
- ✅ 2-file batch with live per-row status and totals; PNG→PNG honest `−0.0%`; transparency badge only
  on the alpha sample; JPEG background fill verified pixel-exact (white then red center).
- ✅ JPEG/WebP deltas measured; individual export name/type/size; ZIP unzipped with **fflate**
  (independent parser) → correct names, JPEG magic and byte-identical sizes.
- ✅ txt/SVG/corrupt rejects leave the queue intact; remove/clear; settings-only persistence;
  3 remounts 0 toasts; 320–1280 clean.
- Shots: `shots/image-convert-desktop.png`, `shots/image-convert-mobile.png`.

### Image Resizer
- ✅ Percent 50 → 600×400 verified via `createImageBitmap` on the export; pixels mode aspect-lock
  derives 300→200 and unlocks to 300×100; fit box 400×400 → 400×267.
- ✅ Percent 200 → 2400×1600 with honest upscale warning; high vs low resampling changes output bytes;
  txt/SVG/corrupt rejects keep the image; settings-only persistence; 3 remounts 0 toasts; 320–1280 clean.
- Shots: `shots/image-resize-desktop.png`, `shots/image-resize-mobile.png`.

### Image Metadata
- ✅ PNG sample 96×96 dpi + `tEXt` + `tIME` decoded; JPEG sample full EXIF and GPS
  `-23.550000, -46.633333` (S/W negated) with privacy banner; WebP/GIF/BMP headers parsed.
- ✅ Clean-copy round-trip re-inspected shows zero metadata (EXIF/GPS/text stripped); txt/SVG/corrupt
  rejects; settings-only persistence; 3 remounts 0 toasts; 320–1280 clean.
- Shots: `shots/image-meta-desktop.png`, `shots/image-meta-mobile.png`.

## 04 · Developer Tools

### JSON Formatter
- ✅ Sample stats hand-verified (10 keys / 18 nodes / depth 5); five invalid inputs give correct
  line/col (engine position + local scanner fallback); pretty/minify/2/4/tab/sort byte-exact.
- ✅ Collapsible tree; copy shows success only on real success and error when clipboard+fallback both
  fail; `.json` download; settings-only persistence; 3 remounts 0 toasts; 320–1280 clean.
- Shots: `shots/json-formatter-desktop.png`, `shots/json-formatter-mobile.png`.

### Base64
- ✅ UTF-8 encode byte-identical to an independent ground truth and decode round-trips emoji/CJK;
  URL-safe (no +/=) round-trips; 76-col wrap = 76/76/76/40; invalid flagged; swap both directions.
- ✅ Copy/download exact; settings-only persistence; 3 remounts 0 new toasts; 320–1280 clean.
- Shots: `shots/base64-desktop.png`, `shots/base64-mobile.png`.

### URL Toolkit
- ✅ Components + rebuilt URL byte-identical to an independent `new URL` ground truth; param
  edit/add/remove live (`utm=open hub` → `utm=open+hub`); invalid and relative URLs rejected;
  credentials + port preserved; Unicode percent-encoded.
- ✅ Component encode matches `encodeURIComponent` and decode round-trips emoji/CJK; malformed `%ZZ` /
  trailing `%` flagged; honest copy incl. total-failure error toast; settings-only persistence;
  3 remounts 0 new toasts; 320–1280 clean.
- Shots: `shots/url-toolkit-desktop.png`, `shots/url-toolkit-mobile.png`.

### Regex Tester
- ✅ Sample matches/groups/replace byte-identical to an independent `matchAll`/`replace` ground truth;
  invalid regex reports the engine error; zero-length `a*` safe; `i`/`m`/`u`/non-`g` and named groups
  verified; 500-match cap reported.
- ✅ `$&`/`$$` templates exact; singular/plural correct; honest copy incl. total-failure error toast;
  flags-only persistence; 3 remounts 0 new toasts; 320–1280 clean.
- Shots: `shots/regex-tester-desktop.png`, `shots/regex-tester-mobile.png`.

### Timestamp Converter
- ✅ Auto s/ms and explicit-unit conversions byte-identical to an independent `Date` ground truth
  (incl. negative epoch); invalid and out-of-range flagged with error styling; date→epoch and local
  picker verified; relative label localized (PT/EN); live now-clock ticks.
- ✅ Honest copy; settings-only persistence with interval cleared on unmount; 3 remounts 0 new toasts;
  320–1280 clean.
- Shots: `shots/timestamp-desktop.png`, `shots/timestamp-mobile.png`.

### Text Diff
- ✅ Sample LCS byte-identical to an independent ground truth (+2/−2, 3 unchanged, correct line
  numbers); split columns aligned with blanks; ignore whitespace/case toggle identical↔changed; swap
  symmetric; identical/empty neutral; 2000-line cap truncates and flags.
- 🛠 `.df-text` class shared by textarea and diff-row span leaked `min-height` into rows — textarea
  renamed `.df-area`; row height back to 22 px. 🛠 identical status used warn color — now neutral.
- ✅ Copy + `.diff` download byte-exact with honest failure toast; settings-only persistence;
  3 remounts 0 new toasts; 320–1280 clean.
- Shots: `shots/text-diff-desktop.png`, `shots/text-diff-mobile.png`.

### Hash Generator
- ✅ All four digests byte-identical to an independent Node `crypto` ground truth for text, a UTF-8
  sample and a local file; uppercase hex; identify-a-hash (match + no-match); per-digest copy and
  `.txt` export exact with honest failure toast.
- 🛠 text/file panels were outside the `#hg-tab` root so tabs never switched — wrapped bar + panels;
  missing `hg.copy` i18n key added.
- ✅ Settings-only persistence; 3 remounts 0 new toasts; 320–1280 clean.
- Shots: `shots/hash-generator-desktop.png`, `shots/hash-generator-mobile.png`.

### Markdown Preview
- ✅ Sample structure byte-matches hand-computed HTML (headings/emphasis/nested lists/quote/code/
  table/hr); XSS-safe (script/onerror escaped, `javascript:` stripped, remote images never fetched,
  `data:` images render); split/preview/HTML views correct.
- 🛠 Write-tool NUL truncation rebuilt with ASCII sentinels + chunked writes; 🛠 `data:` images were
  rejected before the image branch — `data:image/` tested first; 🛠 unsafe paren link left a stray
  `)` — one-nested-paren-tolerant URL group.
- ✅ Copy + `.html`/`.md` exports exact with honest failure toast; settings-only persistence;
  3 remounts 0 new toasts; 320–1280 clean.
- Shots: `shots/markdown-preview-desktop.png`, `shots/markdown-preview-mobile.png`.

---

## F0 + F1 + shell regression · Regressão F0 + F1 + shell

Mandatory end-of-phase sweep, run in Chromium against `http://localhost:8735/?v=reg1` after a fresh
reload with the test helpers reinstalled. · Varredura obrigatória de fim de fase, executada em
Chromium após reload limpo com os helpers de teste reinstalados.

- ✅ **All 20 tools mount clean**: every `#/tool/<id>` route mounts `#app-body` with interactive
  content and **0 console errors/warnings** across the whole sweep (`__errs.length === 0`).
- ✅ F0/F1 signatures present on mount: `#q-canvas`, `#cs-palette`, `#gl-css`, `#fp-specimen`,
  `#sv-canvas`, `#pw-out`, `#uu-out`, `#li-prose`.
- ✅ **F0 functional**: QR Studio renders `https://vistanology.open/regression` → 27 776 dark pixels,
  meta `29×29 modules · ECC M`, no error. Color Studio `#FF8800` → R255/G136/B0; Generate → 5 swatches.
- ✅ **F1 functional**: Gradient Lab CSS `linear-gradient(135deg, …)` + live preview background set;
  Font Preview specimen non-empty, size slider → `80 px`; SVG Studio parses a 40×40 rect → `<svg>`
  present, 2 nodes, no error; Password output 52 chars / `333 bits`; UUID 8 lines all RFC-4122 v4;
  Lorem 3 paragraphs / 112 words.
- ✅ **F2 representative**: Hash Generator `hello` → SHA-256
  `2cf24dba…938b9824` and SHA-1 `aaf4c61d…aea9434d`, byte-identical to the independent ground truth.
- ✅ **Settings**: motion `reduced` + glass `solid` apply `body[data-motion]/[data-glass]` and
  `aria-pressed=true`; restored to `full`/`liquid`.
- ✅ **i18n**: EN→PT remounts Settings as `Configurações`, PT→EN as `Settings`; `VT.i18n.lang` tracks.
- ✅ **Navigation**: back from `#/tool/uuid` → `#/library` (20 tiles); forward → `#/tool/uuid` mounted.
- ✅ **Library**: search `hash` → 1 tool; `zzznomatch` → honest empty state; category `developer` → 8
  correct ids; favorite toggle persists (`aria-pressed`, `VT.favs`) and favorites filter works;
  cleanup restored 20 tiles.
- ✅ **Accessibility**: tiles `role=link` / `tabindex=0` / `aria-label`; favorite buttons `aria-label`;
  reset-confirm modal `role=dialog` / `aria-modal=true`, focus captured on open, Tab traps (wraps to
  first), ESC closes + restores focus + **no data cleared**.
- ✅ **Responsive**: native 319 px viewport — hub/library/markdown/hash/text-diff `scrollWidth ==
  clientWidth` (309), zero overflow; 1280 px iframe — library (20 tiles) and markdown-preview no
  overflow. Per-tool 320/375/768/1280 already verified during each F2 task.
- ✅ Console clean (no errors/warnings) across the entire regression.

## Dependencies & licenses · Dependências e licenças

F2 added **no new runtime dependencies**. · A F2 não adicionou dependências de runtime novas.
`fflate` appears only as an **independent test parser** to unzip the Image Converter ZIP during
verification — it is not shipped or loaded by the app. · `fflate` aparece apenas como parser
independente de teste para abrir o ZIP do Image Converter — não é embarcado nem carregado pelo app.

| Asset | Version | License | Use |
|---|---|---|---|
| qrcode-generator (Kazuhiko Arase) | 1.4.4 | MIT | QR matrix engine (F0) |
| Instrument Serif | — | OFL 1.1 | display type |
| Inter | — | OFL 1.1 | UI type |
| key art `assets/images/*.webp` | — | project asset | 10 commissioned plates (hub hero + category worlds); see `docs/design-system/imagery.md` |

All F2 engines (canvas re-encode, store-only ZIP writer, binary PNG/JPEG/WebP/GIF/BMP parsers, JSON
scanner, Base64 UTF-8, URL parser, regex harness, epoch math, LCS diff, Web Crypto hashing, Markdown
parser/sanitizer) are original code in `js/apps/`, MIT like the project.
Todos os motores da F2 são código original em `js/apps/`, MIT como o projeto.

## Known issues · Problemas conhecidos

1. Clipboard write can be denied in embedded/preview browsers; success paths verified with a stub and
   the denial path shows an honest error toast. · Clipboard pode ser negado em browsers embutidos;
   sucesso via stub, negação com toast honesto.
2. `file://` works but some browsers restrict per-file localStorage; serving locally is recommended.
   `file://` funciona, mas alguns browsers restringem localStorage por arquivo.
3. Image tools rely on browser canvas codecs: WebP encode support varies by browser; honest byte
   deltas can be negative (re-encode may grow a file). · Codecs de canvas variam por browser; deltas
   honestos podem ser negativos.
4. Image Metadata clean-copy strips metadata by re-encoding (lossy for JPEG) — it is a privacy copy,
   not a byte-preserving edit. · Clean-copy re-codifica (lossy em JPEG) — cópia de privacidade.
5. Markdown Preview is a safe subset (no raw HTML pass-through; remote images never fetched).
   Markdown Preview é um subconjunto seguro (sem HTML cru; imagens remotas nunca buscadas).
6. No physical mobile device: mobile shots are same-origin 375×785 iframes cropped from viewport
   captures. · Sem dispositivo físico: capturas mobile via iframe 375×785 recortadas.

## Verdict · Veredito

F2 scope complete: twelve tools (4 Media Lab + 8 Developer) implemented, individually tested and
corrected before moving on; F0 + F1 + shell intact, mandatory regression clean (0 console errors,
20/20 tools). **F3 not started** — awaiting checkpoint approval.
Escopo da F2 completo: doze ferramentas implementadas, testadas e corrigidas individualmente;
F0 + F1 + shell intactas, regressão obrigatória limpa (0 erros de console, 20/20 ferramentas).
**F3 não iniciada** — aguardando aprovação do checkpoint.