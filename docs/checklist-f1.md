# F1 Checklist · Checkpoint da F1

Runtime evidence for the six F1 tools, collected in Chromium against `http://localhost:8735`
(dev server, no-store). Every line below was observed in the browser, not assumed.
Evidência de runtime das seis ferramentas da F1, coletada em Chromium contra
`http://localhost:8735`. Cada linha abaixo foi observada no navegador, não suposta.

Legend · Legenda: ✅ observed pass · 🛠 bug found **and fixed**, then re-verified.

---

## 01 · Gradient Lab

- ✅ Linear geometry at 0/45/90/180/225/270° matched exported pixel samples.
- ✅ CSS, PNG and SVG exports return identical samples, including with an out-of-order stop list.
- ✅ Radial circle/ellipse and conic angles match the math. 🛠 90° canvas/CSS origin bug fixed.
- ✅ 2048 px export measured 2048×1280 via `createImageBitmap`.
- ✅ Min-2 / max-8 stop guards, clamping, focus kept while typing.
- ✅ Four remount cycles without duplicated listeners; corrupt-storage fallback.
- ✅ EN/PT docs and library integration; 320–1280 no overflow.
- Shots · Capturas: `shots/gradient-lab-desktop.png` (1280), `shots/gradient-lab-mobile.png` (375).

## 02 · Font Preview

- ✅ Metrics equal independent Canvas math (967 px / cap 46 / x 33 / asc 63 / desc 20 at 64 px).
- 🛠 Webfont race produced stale metrics after reload — fixed, metrics survive reload.
- ✅ Contrast 15.92 / 4.00 / 17.96:1 match WCAG formula.
- ✅ PNG alignment bboxes, multiline, tracking, transform, colors verified pixel-for-pixel
  (2000 chars → 1200×4000).
- ✅ Real .woff2 load; duplicate name gets `-2`; bad extension / bad content / 9 MB rejected; remove;
  session-only (never persisted, never uploaded).
- ✅ Real key presses: ArrowRight 64→65; typing updates the specimen live.
- ✅ Corrupt-storage sanitize; 🛠 two small-screen layout bugs fixed; 320/375/768/1280 clean.
- Shots: `shots/font-preview-desktop.png`, `-waterfall.png`, `-glyphs.png`, `-mobile.png`.

## 03 · SVG Studio

- ✅ Hostile SVG (script / onload / javascript: / foreignObject / external use / data:svg /
  external url() / @import) sanitized: 8 unsafe items removed; preview, copy and download clean.
- ✅ Optimize 476→414 B render-preserving; recolor by chip and by HEX.
- ✅ PNG 2× measured 200×200; validation, clear, persistence.
- 🛠 Two tablists under one `VT.ui.tabs` root left background tabs dead — split into two instances.
- 🛠 Doubled storage prefix fixed (`vistanology:vistanology:…` → `vistanology:svg-studio`).
- ✅ 3 remounts → single toast; EN/PT; 320–1280 clean.
- Shots: `shots/svg-studio-desktop.png`, `shots/svg-studio-mobile.png`.

## 04 · Password Generator

- ✅ Unbiased sampling: digits-only pool 8, 30 generations = 1920 draws tallied, min 209 / max 263
  around expected 240; zero ambiguous glyphs.
- ✅ Entropy math exact: 128 / 192 / 38 bits; strength labels correct.
- ✅ Passphrase format (`Rune.Sage.Basil.Ulna.Quasar9`), separators, capitalize, trailing digit.
- ✅ History capped at 8, memory-only: stored object holds settings keys only, no secrets.
- ✅ Hide shows bullets while Copy copies the real secret; per-row copy; Clear.
- 🛠 320 px three-button overflow fixed (wrap ≤480); re-verified 320/375.
- ✅ 3 remounts → single toast; EN/PT docs 6 usage / 4 limits.
- Shots: `shots/password-desktop.png`, `shots/password-mobile.png`.

## 05 · UUID Generator

- ✅ v4: 5 and 100 UUIDs match RFC-4122 regex, all unique.
- ✅ v7: 100 match regex, sort in generation order; decoded timestamp fresh vs probe clock
  (e.g. `2026-11-15T06:19:47.307Z`).
- ✅ Formats: upper+no-hyphen `01A1DDDCA4EB7036A88CBED622B549D4`; braces `{…}`;
  🛠 URN prefix casing fixed → `urn:uuid:01A1DDDD-5964-7B8D-BCCF-81CA1F56F32F`.
- ✅ Copy-all 100 lines; download `vistanology-uuids.txt` with 100 lines.
- ✅ Settings-only persistence (v7/100/upper/no-hyphens/urn restored); list memory-only.
- ✅ 3 remounts → single toast; docs 5 usage / 3 limits; 320–1280 clean.
- Shots: `shots/uuid-desktop.png`, `shots/uuid-mobile.png`.

## 06 · Lorem Ipsum Generator

- ✅ Determinism: seed `vista` identical across regenerate and across reload; different seed differs;
  empty seed varies between generates.
- ✅ Units exact: 5 paragraphs → 5; 7 sentences → 1 paragraph / 7 sentences; 40 words → 40 words,
  0 sentences, no terminal period.
- ✅ Classic opening on/off; words unit starts from the classic sequence.
- ✅ `<p>` wrap: every line `<p>…</p>`; downloads `vistanology-lorem-ipsum.html` (text/html) and
  `.txt` (text/plain); copy equals payload with word-count toast.
- ✅ Preview/Source tabs; real ArrowLeft key moves selection and focus.
- ✅ Settings restored after reload; seeded payload byte-identical across reload.
- 🛠 Out-of-range stored count (999) was clamped instead of rejected — strict validation added;
  corrupt object now falls back to clean defaults on fresh load.
- 🛠 Literal `<p>` in tagline/summary/usage was swallowed by innerHTML — entity-escaped, re-verified.
- ✅ 3 remounts → single toast; docs 5 usage / 4 limits / 0 deps; search `lorem` / `placeholder` /
  `ipsum seed` → 1 result; 320–1280 clean.
- Shots: `shots/lorem-ipsum-desktop.png` (1280), `shots/lorem-ipsum-mobile.png` (375).

---

## Shell & F0 regression · Regressão da F0

- ✅ Hub renders hero + 6 categories and shows **8 FERRAMENTAS**; library lists 8 tiles.
- ✅ Library search (`qr` → 1), category chips, favorites, `/` shortcut, empty states.
- ✅ QR Studio: empty URL → localized error + disabled exports; valid URL → `29×29 módulos · ECC M`,
  SVG export is real `<svg>`; error node empties on valid input.
- ✅ Color Studio: 5 swatches, regenerate changes palette, contrast ratio renders (`15.36:1`).
- ✅ Docs / Open / Settings routes render; EN↔PT switch incl. hub hero and app labels; persisted.
- ✅ Console clean (no errors/warnings) across all routes and probes.
- ✅ Responsive 320/375/768/1280: `scrollWidth == clientWidth`, zero out-of-viewport elements.
- Shots · Capturas: `shots/qr-studio-desktop.png` / `-mobile.png`, `shots/color-studio-desktop.png` /
  `-mobile.png`, `shots/hub-mobile.png`.

## Dependencies & licenses · Dependências e licenças

F1 added **no new dependencies**. · A F1 não adicionou dependências novas.

| Asset | Version | License | Use |
|---|---|---|---|
| qrcode-generator (Kazuhiko Arase) | 1.4.4 | MIT | QR matrix engine (F0) |
| Instrument Serif | — | OFL 1.1 | display type |
| Inter | — | OFL 1.1 | UI type |
| key art `assets/images/*.webp` | — | project asset | 10 commissioned plates (hub hero + category worlds); see `docs/design-system/imagery.md` |

All F1 engines (gradient math, FontFace metrics, SVG sanitizer, rejection sampling, UUID v4/v7,
xmur3 + mulberry32) are original code in `js/apps/`, MIT like the project.
Todos os motores da F1 são código original em `js/apps/`, MIT como o projeto.

## Known issues · Problemas conhecidos

1. Clipboard write can be denied in embedded/preview browsers ("Document is not focused"); success
   paths were verified with a stub and the denial path shows an honest error toast.
   Clipboard pode ser negado em browsers embutidos; sucesso via stub, negação com toast honesto.
2. `file://` works but some browsers restrict per-file localStorage; serving locally is recommended.
   `file://` funciona, mas alguns browsers restringem localStorage por arquivo.
3. k-means extraction is approximate by design (≤4000 sampled pixels, 10 iterations).
   Extração k-means é aproximada por design.
4. QR center logo covers ~20% of the code; ECC locks to H while a logo is present.
   Logo central cobre ~20%; ECC trava em H com logo.
5. UUID v7 ordering follows the local clock across clock jumps (monotonic only within a ms).
   Ordenação v7 segue o relógio local entre saltos.
6. Lorem words unit emits one unpunctuated paragraph (sentence metric reads 0) — intentional.
   Unidade palavras emite um parágrafo sem pontuação (frases = 0) — intencional.
7. No physical mobile device: mobile shots are same-origin 375×785 iframes cropped from viewport
   captures; the lorem/gradient desktop shots are full-page captures of 1280×900 iframes because the
   host preview panel was narrowed to 592 px mid-session.
   Sem dispositivo físico: capturas mobile via iframe 375×785; desktop do lorem/gradient via
   iframe 1280×900 (full-page) pois o painel de preview foi estreitado para 592 px.

## Verdict · Veredito

F1 scope complete: six tools implemented, individually tested and corrected before moving on;
F0 intact. **F2 not started** — awaiting checkpoint approval.
Escopo da F1 completo: seis ferramentas implementadas, testadas e corrigidas individualmente;
F0 intacta. **F2 não iniciada** — aguardando aprovação do checkpoint.