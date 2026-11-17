# Changelog

All notable changes to Vistanology Open are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased] — 2026-11-16

### Changed
- Initial route opens the Library directly. A compact aquatic header, decorative glass-tube separator and reduced-motion-aware entrance transition retain Aero identity without delaying access to tools. The editorial presentation remains at `#/about`.
- Complete the existing Vistanology brand integration: official local emblem, capsule navigation, system typography, mint italic accents, responsive menu and consistent favicon/PWA colors. Existing tool workspaces, data formats and installation IDs remain intact.
- Home now offers direct search and three concise workspace entry points. Library adds collection/name/recent sorting, a real recent-tools collection, native tool links and stable focus after removing favorites.
- Keyboard navigation includes a skip link, menu focus/Escape handling, visible active navigation and live result counts. Reduced motion also disables smooth scrolling.
- Documentation now distinguishes system interface fonts from bundled content fonts and records the actual brand/navigation contracts.

### Fixed
- Service Worker revalidation now writes to the cache it serves and keeps background writes alive. Installation requires the complete shell; activation removes only this application's old caches. The official emblem is precached in `v58-vistanology-brand`.
- Category entry points clear unrelated search/recent filters. The Documents category no longer promises PDF editing that the tool does not provide.

- Separate document/diagram autosaves from data/theme autosaves, with tool-checked legacy restoration and no deletion of old records.
- Persist undo/redo in page/component/document editors; synchronize document sample metadata and image export controls. New image autosaves and named projects preserve original-resolution PNG pixels.
- Initialize mind-map history and advance node IDs after restore. Kanban column typing retains focus and records history; Enter creates one card instead of two.
- SVG Studio keeps invalid-source errors visible and export disabled when other controls change.

### Validation
- All 12 flagship editors passed 74 checks across 21 scenarios with 19 validated downloads; all 22 utilities passed their valid and negative/limit cases. Final responsive and offline/cache regressions passed.
- New isolated-browser tests and screenshots are in `_dev/qoder-validation/`; see `docs/design-system/quality.md` for exact coverage and limitations.
- No runtime dependency, remote asset requirement, commit or deployment added. Pre-change source is preserved in `_dev/before-qoder-20261116/`.

## [0.25.0] — 2026-11-16

### Changed — the design system carries the work, not 34 one-off patches
- **One `.step` family for eleven tools** (`css/apps.css:10`): Font Preview, Gradient Lab, Image Compress/Convert/
  Resize/Meta, Lorem Ipsum, Password, QR Studio, SVG Studio and UUID now inherit the same stepped-bench markup
  (`.step` / `.step-head` / `.step-num` / `.step-title`) instead of each re-declaring a local variant. Numbering,
  head separation and padding live in one rule, so a bench in one tool cannot drift from a bench in another.
- **Porcelain surfaces got a well** (`css/components.css:352`, tokens `--well-fill` / `--well-shadow` at
  `css/tokens.css:110`): a field sitting on `.bench`, `.step` or `.bench-sec` is now painted recessed — fill darkens
  and the top highlight becomes an inner shadow — so it no longer reads as a white plate on white porcelain. The
  ocean substrates override the same two tokens rather than re-declaring a rule.
- **Discrete selection is a contract** (`--sel-fill` + `--sel-ink`, `css/tokens.css:146,153`): a pressed tile, row or
  option picks its fill and its ink from the substrate it is on (bench: `#0A5E88` under white labels, measured 7.0:1;
  light field: `#41B4E8` under `#001E31`). The continuous plates keep `--sel-line` + `--sel-tint`. Consistency did not
  flatten the tools: 787 controls still resolve to 68 distinct signatures, 40 of them specific to one tool.
- **Vazio deixou de ser erro / lista deixou de ser pilha de cartões**: QR Studio's empty stage renders a placeholder
  note with the canvas hidden and `role=alert` empty, and Notes Workspace shows rows with one selection indicator
  instead of a column of cards.
- **Key art: one distinct plate per category** (`assets/images/`), none of them reused elsewhere. `stage-all` is the
  catalogue's own establishing band; `cat-developer`, `cat-documents`, `cat-productivity` and `band-horizon` were
  re-made in the v54 family while `hero-aero`, `cat-creative`, `cat-generators` and `cat-media` stayed untouched as
  controls (measured in the before/after sheets).
- Home became an editorial brand composition rather than a card grid, Diagram Studio's bench reads as a professional
  editor, and the floating layers (modal, confirm, command palette) share one elevation and scrim contract.
- Service Worker cache token `v54-keyart-dawn` → **`v55-consolidated-system`**; `VT.version` 0.24.0 → **0.25.0**.

### Added
- `docs/design-system/` — identity, tokens, components, imagery rules, quality pipeline, governance and the
  `v1_css/` snapshot register, each with the measured numbers behind the rule instead of an aspirational description.
- Verification instruments: `_dev/verify-select-affordance.js` (walks the registry and asserts every select on
  porcelain keeps its chevron and its right padding), `_dev/verify-qr-states.js` (15 assertions over filled /
  empty / error), `_dev/shot-step-family.js` (before/after contact sheet of eleven tools plus a Library tile as
  control), `_dev/diff-region.js` and `_dev/revert-step-tree.js` (rebuilds the comparison tree without git).
- Documented capture conditions for before/after evidence: isolated before-tree, seeds that must pass on both trees,
  image-decode wait, atmosphere frozen through `body[data-motion="reduced"]`, and an applied-style comparison of the
  whole control subtree as the leak test.

### Fixed
- **The "Aberto" release list was silently truncated.** `js/shell/open.js:50` interpolated
  `VT.releases[*].notes` as raw HTML, and several notes quote the XSS payloads they neutralise
  (`<img onerror>`, `<script>`). The browser parsed those as markup, so the list stopped at the first
  entry containing one: measured before the fix, the page rendered 19 of 25 releases and 0.20.0–0.24.0 were
  invisible. Notes now go through `VT.utils.esc`; the page renders 25 rows, the last three are
  v0.23.0 / v0.24.0 / v0.25.0, zero `<script>`/`<img>` inside `.rel-notes` and zero console errors.
  (Inserting a `<script>` through `innerHTML` never executes, so this was a display defect, not an
  injection hole — but it hid four releases from users.)
- **Select chevrons erased by the well rule.** `background:` shorthand on `.bench/.step/.bench-sec .input` is more
  specific than `select.input` and wiped its `background-image` gradient: the Fill-Mode and Shape selects in Favicon
  Studio lost the only affordance a select has. The rule now sets `background-color` alone. Proved with a negative
  self-test (re-injecting the shorthand brings `background-image: none` back) and by the new guard over 42 selects.
- **Data Workspace's compact select** (`css/apps.css:560`): the `.dw-indent .input` shortcut shrank `padding-right`
  to 10px so the value ran under the chevron. The chevron reserve now returns for selects only.

### Removed
- `assets/images/empty-bloom.webp` left the bundle and the SW precache list: no HTML, CSS, JS, manifest or dynamic
  plate lookup could reach it (`js/shell/hub.js:7` / `js/shell/library.js:14` only name `cat-*` and `stage-all`), so
  it was 10.5 KB downloaded on every cold install and never painted. The byte-identical original is preserved in
  `_dev/pre-keyart/empty-bloom.webp` (md5 `8ca1d395a1a175c80d1cce1b93a4f88d`, verified equal to the live copy before
  removal) and in every `_dev/before-tree*`.
- `assets/images/stage-aqua.webp` was audited and **kept**: `_dev/shot-stage-plates.js:46,88` still uses it as the
  "before" plate of the stage comparison, so it is evidence material rather than dead weight.

## [0.24.0] — 2026-11-15

### Changed — full visual redesign to the Frutiger Aero identity
- **Every token re-voiced in place** (`css/tokens.css`): night-blue surfaces became daylight ones — `--void` → a
  luminous `--stage`, ink/mist/dim text tones flipped to dark-on-light, `color-scheme: light`, plus new
  `--aero-sky-1/2/3`, `--aero-foam`, `--aero-sun`, `--aero-water`, `--aero-garden`, `--glass-1/2/3`, `--line`,
  `--spec`, `--shadow-aqua`, `--ease-aero`. Token *names* were kept, so all 34 tools inherit the new look with no
  behavior change. One hue per category (`[data-cat]`) drives Home worlds, Library cards and tool accents.
- **Atmosphere** (`css/background.css`): the same five layers now read as sky bloom, rising bubbles, a shimmer
  horizon, a reflective sea and sun glare instead of aurora and stars.
- **Surfaces and components** (`css/glass.css`, `css/components.css`, `css/shell.css`): white frosted glass tiers,
  aqua gradients, editorial serif display type, restyled topbar/nav/buttons/inputs/selects/modals/toasts/menus/
  panels/toolbars/loading and empty states.
- **Home** is an immersive page: commissioned glass-pavilion hero image, privacy stat strip, six photographic
  category worlds and a closing landscape band. **Library** became a visual catalogue with per-category identity,
  watermark crests and an illustrated empty state.
- **Flagship benches** (`css/apps.css`) got their own light stages — CSS Animation Studio, Component Builder,
  Image Studio, Favicon Studio, SVG Editor, Notes, Design System Lab, Page Builder and Diagram/Mind Map now open on
  luminous paper with a grid, sun bloom and a horizon reflection.
- **New artwork** bundled in `assets/images/` (hero + 4 atmosphere plates + stage + empty state), converted to
  WebP (11 MB of PNG → 508 KB) and precached by the Service Worker; nothing is fetched from a network or CDN.
- Default documents created by the tools now start on daylight paper (SVG Editor, Diagram Studio, Mind Map Studio,
  Gradient Lab, Design System Lab), and the app icon, favicon, `app.webmanifest` and `theme-color` follow the palette.
- **Library stage band**: the catalogue opens on a photographic glass band (`stage-aqua`) carrying the title,
  subtitle and result count instead of a plain text header; the bubble atmosphere dims on library/app/settings
  views so a stray ring no longer reads as an artifact over content.
- Stale theme naming retired from current UI strings (Design System Lab, Component Builder taglines and docs);
  historical changelog entries keep their original wording.
- Service Worker cache moved to `v44-aero`.

### Added
- **CSS Animation Studio keyframe timeline** (`js/apps/animation-studio.js`): a track under the stage with a tick per
  stop (click a tick to select it), duration and `easing · direction` labels, and a live playhead driven by the
  target's own `getAnimations()` time — cancelled on unmount.
- `v1_css/` keeps the previous dark stylesheets untouched for reference.
- Evidence tooling in `_dev/`: `retheme-apps-css.js`/`retheme-apps-css2.js` (literal-colour remap with per-rule hit
  counts), `retheme-tool-defaults.js`, `retheme-shell-meta.js`, `retheme-narrow-grid.js`, `fix-ds-collision.js`,
  `probe-aero.js` (alpha-composited contrast + mobile overflow), `regress-aero.js`, `shots-aero.js`, `offline-aero.js`.

### Fixed
- **Design System Lab rendered an empty band**: Diagram Studio's stylesheet block redefined `.ds-stage/.ds-work/
  .ds-side/…` and won the cascade. Diagram Studio moved to its own `.dg-` prefix; the three-column bench and its live
  preview render again (verified at 1440×900).
- **Data Workspace segmented control**: the pressed state paired `--cyan` text with a `--cyan-soft` fill (1.4:1). It
  now uses a white label on the aqua gradient.
- **Mobile horizontal overflow** (was 9px shell-wide and 496px in Animation Studio at 375px): collapsed benches now
  use `minmax(0, 1fr)` with `min-width: 0` on their children, code panes scroll inside their column, toolbar button
  groups wrap, and the topbar compacts at ≤480px/≤420px. Measured `overflow: 0` at 375px and 768px.
- **White labels on aqua buttons/tabs/pills** were sitting on too-light gradient tops; the gradients were deepened and
  contrast re-measured with real alpha compositing.
- Atmosphere bubbles read as stray rings over tool views; they now carry an aqua edge and are dimmed on app/settings
  views.

### Verified (real Chromium, served from this folder)
- 34/34 tools mount; no console errors or page errors; Home images all `naturalWidth > 0`.
- Library search (`qr` → 1), category filter (media → 5), favourite toggle, command palette open/close with real
  `Ctrl+K`/`Escape`, i18n EN→PT→EN, IndexedDB available and `VT.store` round-trip.
- Contrast: nothing under 3:1 across 34 tools + 5 shell views (gradient bands composited over the page base).
- Responsive: `scrollWidth - clientWidth = 0` at 375px and 768px on Home, Library, Gradient Lab, Animation Studio,
  Document Workshop, Design System Lab, Page Builder, Settings and Component Builder.
- Offline: with the cache warmed (`vt-shell-v44-aero`, 76 entries) the server was stopped (`fetch` → `fetch-failed`),
  then the app booted with 34 tools, the canary key intact, 8/8 images painted, Animation Studio mounting its stage,
  timeline and generated CSS, and **64/64 resources served from cache with 0 bytes transferred**.
- Screenshots: `_dev/shots/01-home … 15-diagram-studio` (including 375px Home and Animation Studio).

## [0.23.0] — 2026-11-15

### Added
- U19 · **Mind Map Studio** (`js/apps/mind-map-studio.js`, v0.1.0, creative category) — the 34th tool; the flagship
  local-first radial mind-map bench:
  - **Tree model + radial layout** — grow a mind map from a central topic. Each node has a label, a colour and a
    collapsed flag; a deterministic client-side radial layout spreads children around their parent (weighted by leaf
    count), so the whole map re-flows as you edit it.
  - **Branch operations** — Add branch (child) and Add sibling, plus an on-node −/+ badge to collapse/expand a subtree.
    Deleting a branch cascades its entire subtree away behind a confirmation (the central topic cannot be deleted).
  - **Pointer nudge + Tidy** — drag any node to override its layout position (snapped to an 8px grid, clamped to the
    canvas); **Tidy** clears the manual overrides and snaps everything back to the computed radial layout.
  - **Live inspector** — edit the selected node's label and colour; the canvas and the connected branches re-render
    immediately. The map has a name field, and a live `nodes · branches` counter.
  - **Whole-map undo/redo** via the shared `VT.history` framework (a canonical JSON snapshot per structural change),
    wired to the Undo/Redo buttons and Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y.
  - **Persistence** — the map autosaves to IndexedDB (`mm:autosave`) and is restored on return; **named projects**
    save/open from the side panel (the autosave row is excluded, sorted newest-first). Edits flush the moment you switch
    documents or leave the tool so nothing is lost to the 600ms debounce.
  - **Export** — clean standalone **SVG**, a **2× PNG** (800×560 → 1600×1120) rasterized onto a canvas via a data-URL
    image, and the raw **JSON** tree — all from the same validated model, no external libraries.
  - **Safe by construction** — labels are SVG **text content**, never markup, and the export runs every label and
    colour through `esc()`; a pasted `<img onerror>`/`<script>`/`<b>` shows as inert text on the canvas and stays
    escaped in the saved `.svg` (`window.__pwned` never set). No `eval`, no raw-HTML passthrough, no network.

### Verified
- Full browser battery (see `docs/checklist-u19.md`): default = 1 central node; Sample = **11 nodes · 10 branches** with
  4 collapse badges; **node drag** moves (+71,+48) and **Tidy** restores the original position; **root collapse** hides
  the whole subtree (11 → 1) and expand restores it; a **level-1 branch collapse** hides just that sub-tree; **Add
  sibling** and **Add branch** each add exactly one node; **delete cascades the subtree** (11 → 8 when removing a branch
  with 2 children) and **undo/redo** restores it exactly; **root delete is blocked** (no confirm dialog); **autosave**
  captures a live rename and a **reload restores** it; **named project** save/open with the autosave row excluded;
  **Export SVG** escapes an XSS payload (inert, `window.__pwned` undefined, no raw `<img`/`<script>`), **Export JSON**
  parses back to a tree, **Export PNG** is a valid **1600×1120 (2×)** blob; **i18n EN↔PT** flips toolbar, counter and
  stats; the workspace **stacks to one column below 980px**. **Offline proven with the server stopped**: navigation and
  every asset report `transferSize: 0`. Console clean; notes / kanban / document-workshop / diagram-studio / hub all
  still mount. Consolidated to 0.23.0 (23rd release, 34 tools, Service Worker `v42`).

## [0.22.0] — 2026-11-15

### Added
- U18 · **Diagram Studio** (`js/apps/diagram-studio.js`, v0.1.0, creative category) — the 33rd tool; the flagship
  local-first SVG flowchart bench:
  - **Typed node model on a canvas** — add rectangle, diamond, capsule and note nodes, each pre-styled per kind.
    Drag any node on a grid-snapping canvas (8px snap on a 24px grid), clamped to the canvas bounds.
  - **Orthogonal arrow edges** — connect nodes with a two-step **Link** flow (select a source, press Link, click a
    target) producing axis-aligned elbow paths capped with an arrow marker; self-links are refused and duplicate
    edges are ignored.
  - **Live inspector** — click a node to edit its label, width, height, fill and stroke, or switch its kind; click an
    edge to edit its label. Every change reflects on the canvas immediately and re-flows the connected edges.
  - **Whole-diagram undo/redo** via the shared `VT.history` framework (a canonical JSON snapshot per structural
    change, including drags), wired to the Undo/Redo buttons and Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y.
  - **Persistence** — the diagram autosaves to IndexedDB (`ds:autosave`) and is restored on return; several **named
    projects** save/open from the side panel (the autosave row is excluded from the list). Edits flush the moment you
    switch documents or leave the tool so nothing is lost to the 600ms debounce window.
  - **Export** — a clean standalone SVG (built from the same validated model, labels/fills/strokes HTML-escaped) or
    a 2× rasterized PNG drawn from that SVG onto a canvas via a data-URL image, no external libraries.
  - **Safe by construction** — node/edge labels are SVG **text content**, never markup; the exported markup escapes
    `<`/`>`/`&`/quotes. A pasted `<img onerror>`/`<script>` renders as inert text on the live canvas and stays escaped
    in the saved `.svg` (`window.__pwned` never set). No `eval`, no raw-HTML passthrough, no network.

### Fixed
- The module's IIFE never ran `return def;`, so `VT.modules['diagram-studio']` was `undefined` after registration.
  Added the `return def;` tail so the module handle resolves like every other tool (verified: `present: true`).
- The `ds.stats` i18n key was referenced by `updateStats()` but absent from both dictionaries, so the counter showed
  the raw key. Added it to EN (`{nodes} node(s) · {edges} edge(s)`) and PT (`{nodes} no(s) · {edges} aresta(s)`).
- `scheduleSave()` dispatched through an `autosave` handle that was initialised to `null` and never wired to
  `saveSoon`, so live edits never persisted (only New/Sample/Open, which call `flushSave()`, did). Bound
  `autosave = saveSoon` in `mount()` — edits now autosave and a reload restores them (verified end-to-end).
- `selectNode()` re-rendered without refreshing the inspector, so a plain node click showed the selection ring but
  kept both inspector panels hidden. It now calls `updateInspector()`.
- The composed stats string went stale on a language switch (no other tool re-renders dynamic text on `vt:lang`).
  Added a `vt:lang` listener that re-runs `renderMeta`/`updateStats`/`loadProjects` on the mounted tool and removes it
  on unmount (verified: stats flip EN↔PT live).

### Verified
- Full browser battery (see `docs/checklist-u18.md`): sample renders 4 nodes + 3 edges + arrow markers; each node
  kind adds; node drag moves (40,60)→(120,112) with 8px snap; whole-diagram undo/redo of the drag restores exactly;
  two-step Link adds exactly one edge; edge click selects and its label edits into the SVG; deleting a node cascades
  its edges away (8→7 nodes, 4→2 edges); autosave captures a live edit and a reload restores it; named project
  save→mutate→Open restores the saved diagram and the autosave row stays out of the list; SVG export escapes an XSS
  payload (inert, `window.__pwned` undefined); PNG export is a valid 1440×960 (2×) blob; i18n flips EN↔PT including the
  stats; the layout stacks to a single column below 980px; **offline** with the server killed loads with navigation and
  every asset `transferSize: 0` while the Sample still renders. Console clean; notes / kanban / document-workshop /
  hub all still mount. Consolidated to 0.22.0 (22nd release, 33 tools, Service Worker `v41`).

## [0.21.0] — 2026-11-15

### Added
- U17 · **Document Workshop** (`js/apps/document-workshop.js`, v0.1.0, documents category) — the 32nd tool and the
  first to fill the previously empty Documents category; the flagship local-first, print-ready document bench:
  - **Sectioned document model** — compose a document as an ordered list of sections, each written in safe Markdown,
    under a cover header (title, author, date). Add, rename inline, reorder (up/down) and delete (with a
    confirmation) sections; the body supports headings (auto-headings capped to h3–h6 so they nest under each
    section's h2), bold/italic/strike, inline and fenced code, lists, task lists, blockquotes, rules and links.
  - **Automatic table of contents** — a `<nav class="dw-toc">` is generated whenever the document has 2+ sections,
    linking to each section anchor.
  - **Live preview, three modes** — Write / Split / Preview toggle (persisted to `VT.store`), with serif/sans themes
    and an adjustable 80–160% font size reflected live.
  - **Whole-document undo/redo** via the shared `VT.history` framework (a canonical JSON snapshot per structural
    change, coalesced for typing), wired to the Undo/Redo buttons and Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y.
  - **Persistence** — the document autosaves to IndexedDB (`dw:autosave`) and is restored on return; several
    **named projects** save/open from the side panel (the autosave row is excluded from the list). Edits are flushed
    the moment you switch documents or leave the tool so nothing is lost to the debounce window.
  - **Export & print** — export a standalone printable HTML (`standaloneHTML()` with inlined `DOC_STYLE` and a
    `@media print` block), export the source as Markdown, or send it straight to the browser print dialog through a
    same-document hidden iframe built from your own escaped markup.
  - **Safe by construction** — every user string is HTML-escaped and rendered from a plain data model; only
    `http(s):`, `mailto:` and `#` link protocols survive (`javascript:` becomes inert text). No `eval`, no raw-HTML
    passthrough, no network. A pasted `<img onerror>` or `<script>` shows as inert text and `window.__pwned` stays
    undefined.

### Fixed
- Document Workshop rendered **no sections** on first load and the New/Sample buttons did nothing: `recSoon()`,
  `flushSave()` and `applyDoc()` all read a `saveTimer` variable that was never declared, so `applyDoc()` threw a
  `ReferenceError` before assigning `doc`. Added `let saveTimer = null;` to the module state — New/Sample and the
  autosave/flush path now work (verified: default 1 section, Sample → 3 sections, stats update).
- Task-list checkboxes rendered as **escaped literal text** (`&lt;span class="dw-cb"&gt;`) instead of real elements:
  the freshly-built checkbox `<span>` was passed through `inline()`, which escapes HTML. It is now emitted raw and
  only the task text goes through `inline()` (verified: 3 `.dw-cb` spans, 2 `.dw-cb.on`, clean `li` text).
- Same undo/redo-button class of bug as Kanban: `record()` grew the history stack but didn't call `syncHist()`, so a
  `disabled` button swallowed the first Undo click. `record()` now calls `syncHist()` (verified: after one op Undo is
  enabled, button-undo 4→3, redo 3→4).

### Verified
- Real-browser runtime (Chromium via browser-use MCP, `http://127.0.0.1:8735`) against the built app: registry shows
  32 tools and the new 0.21.0 release; Sample renders headings/strong/inline+fenced code/blockquote/ul/ol/task-list
  (with real `.dw-cb` checkboxes) and a 3-link TOC with in-page anchors plus one `https://example.com` link carrying
  `rel="noopener noreferrer" target="_blank"`; `<hr>` renders from `---`; add/reorder/delete sections and the
  Undo/Redo **buttons** drive the whole-document history correctly (4→3→4); autosave writes `dw:autosave` (correct
  tool id) and a reload restores the content, section count and mode; named-project save/open round-trips with the
  autosave excluded; Export HTML emits a `<!doctype html>` file and Export Markdown a `# `-rooted `.md`; Print fires
  the iframe's `print()` and the built document carries a doctype and the rendered sections.
- Security: an `<img onerror>`/`<script>` body and a `javascript:` link render as inert escaped text; `https://` is
  kept; `window.__pwned` stays `undefined`; console clean across every navigation. i18n EN+PT (New ↔ Novo, etc.).
  Mode toggle collapses panes via `stage[data-mode]`.
- Offline: with the dev server killed (port closed, `curl` exit 7), a reload served the shell and **all 62 resources**
  — including the fixed `document-workshop.js` — from the Service Worker cache with `transferSize: 0`, the tool
  rendered 4 sections and the autosaved content restored from IndexedDB.
- Cross-tool regression after the consolidation edits: Kanban, Notes, Data Workspace, JSON Formatter, QR Studio, SVG
  Editor and Image Studio all still mount (3 children each) with no console errors; the hub renders.
- **Screenshot pending (honest note):** the in-app Browser surface reports `visibilityState=hidden`, so `take_screenshot`
  is unavailable in this environment (same limitation recorded for Kanban). Visual layout was validated through DOM
  structure and computed styles, not a captured image.

## [0.20.0] — 2026-11-15

### Added
- U16 · **Kanban Board** (`js/apps/kanban.js`, v0.1.0, productivity category) — the 31st of 31 tools and the
  flagship local-first task board:
  - **Columns and cards** — add columns, rename them inline, move them left/right and delete them (with a
    confirmation); add cards with a per-column composer (Enter to add, Shift+Enter for a new line), toggle a card
    done, and delete cards.
  - **Drag & drop** — pointer-based drag moves a card between columns and reorders it within a column, with a
    floating ghost and a dashed drop placeholder; works with mouse, touch and pen (pointer events, `touch-action: none`).
  - **Card editor panel** — click a card to edit title, description, comma-separated tags and the done flag in a
    side panel; changes update the board live.
  - **Whole-board undo/redo** via the shared `VT.history` framework (a canonical JSON snapshot per structural
    change, coalesced for typing), wired to the Undo/Redo buttons and Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y.
  - **Persistence** — the board autosaves to IndexedDB (`kanban:autosave`) and is restored on return; several
    **named projects** save/open from the side panel (the autosave row is excluded from the list).
  - **Search & export** — full-text search dims non-matching cards; export the board as JSON or Markdown.
  - **Safe by construction** — every column/card string is rendered from a plain data model via `textContent`/`esc`;
    no `eval`, no raw-HTML passthrough, no network. A pasted `<img onerror>` or `<script>` shows as inert text.

### Fixed
- Kanban undo/redo buttons stayed disabled after edits: the shared history stack grew correctly, but
  `syncHist()` (which flips the buttons' `disabled` state) was only called on undo/redo/apply/reset — and because a
  `disabled` `<button>` swallows its click, the first Undo press did nothing. `record()` now calls `syncHist()` so
  the buttons reflect the stack after every change. Verified: 3 add-column ops enable Undo, 3 undos walk the column
  count back and disable it, redos restore.

### Verified
- Real-browser runtime (Chromium via browser-use MCP, `http://localhost:8735`) against the built app: registry shows
  31 tools and the new 0.20.0 release; the board mounts (stage + 3 default columns); XSS payload renders as text and
  `window.__pwned` stays false (no image tag in the DOM); synthetic `PointerEvent` drag moves a card To do → In
  progress with a ghost + placeholder that clean up on drop, and the drag is undoable/redoable; add-column and the
  card composer add content; the side panel edits a card title and toggles done; search dims non-matching cards;
  autosave writes `kanban:autosave` to IndexedDB and a reload restores the board; named project save/open round-trips
  and the autosave row is excluded from the list; column delete confirms and removes; exports emit `My_board.json`
  and `My_board.md` (captured via a `downloadText` stub). Console clean (0 errors / 0 warnings).
- Genuine offline proof: dev server killed and confirmed unreachable (`curl` exit 7, `http=000`); after reload the
  navigation and `kanban.js` / `apps.css` / `app.js` all report `transferSize: 0`, the tool mounts from cache and the
  autosave board (3 columns / 4 cards) restores — no network.
- Cross-tool regression: notes, svg-editor and page-builder still mount (3 children each) and the library lists 31
  tools after wiring. Service Worker bumped v36 → v37 (add `kanban`) → v38 (0.20.0 shell refresh); 20 release entries.

## [0.19.0] — 2026-11-15

### Added
- U15 · **Notes Workspace** (`js/apps/notes.js`, v0.1.0, productivity category) — the 30th of 31 tools and the
  flagship local-first Markdown notes bench:
  - **Many named notes** stored on-device in IndexedDB (`tool: 'notes'`), each with title, comma-separated tags,
    Markdown body and created/updated timestamps; the sidebar lists them newest-first with a title, a stripped
    snippet and a localized timestamp.
  - **Safe live preview** — a split editor/preview layout renders Markdown through an escape-all-then-format
    pipeline (headings, bold/italic/strike, inline + fenced code, links, ordered/unordered nested lists,
    blockquotes, rules, paragraphs). All text is HTML-escaped first, raw HTML never passes through, and only
    `http/https/mailto/#` link protocols are kept (`javascript:` and others become inert text). No `eval`, no scripts.
  - **Search & tag filter** — full-text search across title/body/tags plus clickable tag chips that filter the list.
  - **Write / Split / Preview** view modes; **undo/redo** the note body via `VT.history` (Ctrl+Z / Ctrl+Shift+Z).
  - **Autosave + session restore** — every note autosaves (600 ms debounce) and your last note + view reopen on
    return. Edits are **flushed on note switch and on unmount**, so nothing is lost inside the debounce window.
  - **Export** — Copy Markdown, Copy HTML (rendered) and Download the note as a `.md` file (safe filename).

### Changed
- Service Worker shell cache bumped `v35 → v36` as the new app JS, `index.html`, `css/apps.css`, `app.js` and `registry.js` changed.
- `VT.version` `0.18.0 → 0.19.0`; `VT.releases` gained the 0.19.0 entry (19 releases); tool count 29 → 30.

### Verified
- Real browser (`localhost:8735`): mount + New note; **security** — a pasted `<script>window._pwn=1</script>` and
  `<img onerror>` render as escaped text (0 `<script>`/`<img>` in the preview, `window._pwn` never set) and a
  `javascript:alert(1)` link becomes plain text while the `https:` link is kept (1 anchor, 0 javascript: hrefs);
  Markdown formatting (h1/h2, strong/em/del, inline + fenced code, nested lists, blockquote) all render;
  **undo/redo** the body cycles correctly; **Write/Split/Preview** modes toggle pane visibility; **search** and
  **tag filter** narrow the list (guide→2, clear→3); **Copy MD / Copy HTML / Export .md** produce the right payload
  and a sanitized filename; **autosave → reload → restore** reopens the last note and view mode.
- One real bug found and fixed during verification: rapid note switching or leaving the tool within the 600 ms
  autosave debounce silently dropped the current note's edits (the old debounced save retargeted to the newly
  switched note). Replaced with an explicit dirty-flag + `flushSave()` invoked on `openNote`, `newNote` and
  `unmount`, so the outgoing note is persisted before the switch. Re-verified: three notes created/edited back-to-back
  with no debounce wait all persist their title, tags and body in IndexedDB.
- **Offline proven with the server stopped** (`curl` exit 000): navigation, `notes.js` and `apps.css` all
  `transferSize: 0`; the tool mounted from cache; 30 tools; shell `v36`.

## [0.18.0] — 2026-11-15

### Added
- U14 · **SVG Editor** (`js/apps/svg-editor.js`, v0.1.0, creative category) — the 29th of 31 tools and the
  flagship visual vector bench. Everything is built from a small, validated document model that drives both the
  on-screen `<svg>` and the exported markup, so what you edit is exactly what you download:
  - **Primitives** — rectangle, ellipse, line, triangle and star, each stored as a center + size + rotation so
    transforms stay uniform across types.
  - **Direct manipulation** — pointer drag to move, four corner handles to resize (anchored to the opposite
    corner, correct under rotation), a top handle to rotate around the center, arrow-key nudge (Shift = grid step),
    and a snap-to-grid toggle.
  - **Styling** — per-shape fill, stroke, stroke width, opacity and corner radius; canvas width/height, background
    color and a transparent-background toggle.
  - **Layers** — reorder (bring forward / send backward), hide/show, select, duplicate and delete.
  - **History & persistence** — undo/redo the whole document; autosave to IndexedDB (`se:autosave`) restored on
    return; **named projects** save/open (autosave excluded from the list).
  - **Export** — Copy SVG / Download SVG (clean markup, `xmlns`, per-shape transforms) and Download PNG at
    1×/2×/4× (locally rasterized from the same markup).

### Changed
- Service Worker shell cache bumped `v33 → v34` as the new app JS, `index.html`, CSS, `app.js` and `registry.js` changed.
- `VT.version` `0.17.0 → 0.18.0`; `VT.releases` gained the 0.18.0 entry (18 releases); tool count 28 → 29.

### Verified
- Real browser (`localhost:8735`): mount + 5 add buttons + live canvas; **drag** moved the shape (geo 240,160 →
  288,176, snapped to 8); **corner resize** grew 160×110 → 240×192 with the center shifting; **rotate handle**
  produced exactly **90°** (`transform="rotate(90 312 192)"`); **PNG export** at 2× decodes to **960×640** and the
  center pixel `[157,97,116]` is the **exact** blend of `#FF8FA3` @ 0.6 over `#0B1B2E`; **SVG export** carries
  `xmlns`, `stroke-width="8"`, `opacity="0.6"`; **undo/redo** cycles 3→2→1→2→3; **layer reorder** brings a shape
  forward and **visibility** hides it (2 of 3 rendered); **autosave → remount → restore** ("Restored your last
  artwork"); **named project** save + open round-trips (list 1, db 2); canvas width and transparent-background
  toggles update the viewBox and markup; **Sample** loads a 4-shape scene; **PT i18n** verified.
- Two real bugs found and fixed during verification: the live SVG output panel was not refreshed on edits (now
  updated in `commit()` and on pointer-up), and `hist.apply` was calling `applyDoc`, which reset the history and
  wiped the undo/redo stacks mid-navigation (split into `setDoc` for apply vs `applyDoc` for explicit loads). A
  third fix corrected the inverted bring-forward / send-backward directions.
- **Offline proven with the server stopped** (`curl` exit 000): navigation, `svg-editor.js` and `apps.css` all
  `transferSize: 0`; the tool mounted from cache with the autosaved sample; 29 tools; shell `v34`.

## [0.17.0] — 2026-11-15

### Added
- U13 · **Favicon & Icon Studio** (`js/apps/favicon-studio.js`, v0.1.0, generators category) — the 28th of 31
  tools and the flagship local icon-set generator. A single `renderIcon(size)` draw routine powers both the live
  preview grid and every exported PNG, so the download matches what you see:
  - **Source** — a text/emoji **monogram** (glyph, glyph size, foreground color) or a raster **image**
    (file picker, drag-and-drop, clipboard paste); the image is downscaled to ≤512px for storage.
  - **Background** — solid, two-stop gradient, or transparent fill.
  - **Shape & spacing** — square / rounded (radius %) / circle, plus a padding slider; a dashed crop overlay is
    not needed since the shape is the clip.
  - **Live grid** — all eight standard sizes (16, 32, 48, 64, 128, 180, 192, 512) rendered at true dimensions.
  - **Export** — Download any single size, **Export all** (eight PNGs, staggered), and **Copy / Export manifest**
    (`site.webmanifest` JSON referencing the set).
  - **History & persistence** — undo/redo the styling (source kept out of snapshots so memory stays bounded);
    autosave to IndexedDB (`fs:autosave`, incl. the source image) restored on return; **named presets** save/open.

### Changed
- Service Worker shell cache bumped `v32 → v33` as the new app JS, `index.html`, CSS, `app.js` and `registry.js` changed.
- `VT.version` `0.16.0 → 0.17.0`; `VT.releases` gained the 0.17.0 entry (17 releases); tool count 27 → 28.

### Verified
- Real browser (`localhost:8735`): mount + 8-cell grid (labels 16→512) + manifest referencing `icon-512x512.png`;
  monogram **512 export decodes to 512×512** with **96% opaque** pixels (glyph drawn); **Export all** produces the
  8 correctly-named PNGs; **circle + solid** → center alpha 255, corner alpha 0 (clipping correct); **image source**
  (generated red PNG fed through the file input) → exported center pixel **RGB [255,0,0]** and src-label "Image loaded";
  **undo/redo** steps the styling stack exactly (shape then fill revert and re-apply); **Copy manifest** parses to
  8 icons + app name; **Export manifest** downloads `site.webmanifest` (`application/manifest+json`);
  **autosave** writes src + opts (type image, shape circle) → reload → **restore** renders the green image at
  **RGB [0,255,136]** with hint "Restored your last icon set"; **named preset** adds a row while autosave stays
  excluded (list 1, db 2); 0 console errors/warnings.

## [0.16.0] — 2026-11-15

### Added
- U12 · **Image Studio** (`js/apps/image-studio.js`, v0.1.0, media category) — the 27th of 31
  tools and the flagship non-destructive local image editor. The source is decoded once into an
  offscreen canvas; every edit is a parameter applied at draw time, so the original is never mutated:
  - **Load** — file picker, drag-and-drop, clipboard paste, or a built-in generated sample.
  - **Transform** — rotate ±90°, flip horizontal/vertical, center-crop by aspect ratio
    (free / 1:1 / 4:3 / 3:2 / 16:9) with a dashed crop overlay on the preview.
  - **Adjust** — a CSS-filter stack: brightness, contrast, saturation, hue-rotate, grayscale,
    sepia and blur, each a live slider; **Reset edits** restores defaults.
  - **Compare** — toggles the preview to the untouched original (filter `none`) for A/B review.
  - **History** — undo/redo carries only the small edit state (not the pixels), bounded on `VT.history`.
  - **Persistence** — the working edit autosaves to IndexedDB (`is:autosave`, downscaled thumbnail +
    edit params) and is restored on return with a hint; **named projects** save/open from the side panel.
  - **Export** — re-renders the **full-resolution** frame with the same filter string and downloads
    PNG / JPEG / WebP (quality slider for lossy formats); `sample-edited.jpg` etc.

### Changed
- Service Worker shell cache bumped `v30 → v31` as the new app JS, `index.html`, CSS, `app.js` and `registry.js` changed.
- `VT.version` `0.15.0 → 0.16.0`; `VT.releases` gained the 0.16.0 entry (16 releases); tool count 26 → 27.

### Verified
- Real browser (`localhost:8735`): mount + dropzone + sample load (800×600, 8 sliders, 5 crop options);
  **rotate** swaps dims to 600×800; **crop 1:1** yields 600×600; **grayscale 100** verified at the pixel
  level (exported center pixel R=G=B); **export PNG** decodes to 600×600 (matches computed full-res dims);
  **undo** reverts brightness to 0 and **redo** restores 100; **Compare** toggles `is-active`; **JPEG export**
  honors the quality slider (`sample-edited.jpg`, `image/jpeg`, 20,989 bytes); **autosave** writes src + edit
  (brightness 150, crop 16:9) → reload → **restore** ("Restored your last edit", controls reflect the state);
  **named save** adds a row while the autosave stays excluded (list 1, db 2); 0 console errors/warnings.
- Offline with the server stopped (`curl` exit 000, port closed): navigation, `image-studio.js` and `apps.css`
  all `transferSize 0`, tool mounted from cache, last edit restored, 27 tools registered — no network.

## [0.15.0] — 2026-11-15

### Added
- U11 · **Component Builder** (`js/apps/component-builder.js`, v0.1.0, creative category) — the 26th of 31
  tools and the flagship visual UI-component composer. A typed properties model renders live in the Cosmic
  Liquid Glass identity and exports clean, escaped HTML + scoped CSS:
  - **4 component types** — Button (solid/outline/ghost × sm/md/lg), Badge (solid/soft/outline × sm/md/lg),
    Alert (info/success/warning/error, variant auto-sets the accent color) and Card (default/outline/elevated).
  - **Typed props** — label + body text, variant/size selects, accent color picker, corner-radius slider (capped
    40px, 999px for badges), and an icon toggle. Each edit re-renders the preview and both output panes at once.
  - **Live preview** — a scoped `<style>` carries the compiled CSS; the markup is rendered into the stage with
    all user text escaped (an `<img onerror>` typed into a label renders inert, never live).
  - **Undo/redo** the whole component via `VT.history`; **autosave** to IndexedDB (`cb:autosave`) restored on
    return with a hint; **named components** saved/opened from the side panel (autosave excluded from the list).
  - **Export** — Copy HTML, Copy CSS, or download a self-contained `vistanology-component.html`; the markup
    escapes all text and the CSS interpolates only browser-validated values — no free-form HTML, no eval.

### Changed
- Service Worker shell cache bumped `v28 → v29` as the new app JS, `index.html`, CSS, `app.js` and `registry.js` changed.
- `VT.version` `0.14.0 → 0.15.0`; `VT.releases` gained the 0.15.0 entry (15 releases); tool count 25 → 26.

### Verified
- Real browser (`localhost:8735`): mount + 4 type chips + 6 control rows + live button preview + HTML/CSS panes;
  switching to Alert exposes info/success/warning/error variants and the **error** variant auto-sets accent
  `#FF8FA3` in both HTML and CSS; typing `<img src=x onerror=alert(1)>` into a label is **escaped** in output and
  produces **zero live `<img>`** in the preview; undo restores the prior label ("Heads up") and redo re-applies it;
  autosave write → reload → restore ("Aurora Panel" card, hint "Restored your last component"); named save adds a
  row while the autosave stays excluded (list 1, db 2); Copy HTML/CSS and Export `.html` (DOCTYPE, `text/html`) fire;
  0 console errors/warnings.
- Offline with the server stopped (`curl` exit 000, port closed): navigation, `component-builder.js` and `apps.css`
  all `transferSize 0`, tool mounted from cache, "Aurora Panel" card restored, 26 tools registered — no network.

## [0.14.0] — 2026-11-15

### Added
- U10 · **CSS Animation Studio** (`js/apps/animation-studio.js`, v0.1.0, creative category) — the 25th of 31
  tools and the flagship visual `@keyframes` editor. A typed animation model compiles to plain CSS applied to a
  live preview target:
  - **Timing settings** — duration, delay, iteration count, direction, fill mode, and an easing function (five
    named easings or a **custom cubic-bezier** with four sliders and a live SVG curve graph + handles).
  - **Keyframe stops** — add/remove stops (min 2), set each stop's position, and edit per-stop **transform**
    (move X/Y, rotate, scale), **opacity**, **background color** and **border-radius**.
  - **Live preview** — a scoped `<style>` injects the compiled CSS; **Play/Pause** toggles `animation-play-state`
    on the live frame while the **exported** CSS stays clean (no play-state baked in); **Restart** replays.
  - **6 presets** — Pulse, Spin, Bounce, Slide in, Float, Shake.
  - **Undo/redo** the whole animation via `VT.history`; **autosave** to IndexedDB (`as:autosave`) restored + run
    on return with a hint; **named animations** saved/opened from the side panel.
  - **CSS export** — Copy CSS or download `vistanology-animation.css`; compiled only from browser-validated
    control values (sliders, color pickers, fixed option lists) — no free-text CSS, no scripts, no eval.

### Changed
- Service Worker shell cache bumped `v24 → v27` as the new app JS, `index.html`, CSS, `app.js` and `registry.js` changed.
- `VT.version` `0.13.0 → 0.14.0`; `VT.releases` gained the 0.14.0 entry (14 releases); tool count 24 → 25.

### Verified
- Real browser (`localhost:8735`): mount + 3 control groups + live target (`animation-name: as-anim`, 1.2s,
  ease-in-out) + easing curve SVG; preset Spin emits `360deg`/`linear`; custom easing shows 4 bezier sliders +
  `cubic-bezier` in CSS + 2 curve handles; stop property edit updates CSS (`scale(1.750)`); add stop grows chips;
  **play/pause** sets `animation-play-state: paused` on the live style while the export panel stays clean; undo
  works; export downloads `vistanology-animation.css`; autosave write → reload → restore + run (bounce, 5 stops,
  hint sticks); named save → switch → open round-trip; 0 console errors.
- Offline with the server stopped (`curl` exit 000, port closed): navigation and `animation-studio.js` both
  `transferSize 0`, tool mounted from cache, bounce animation restored and running with no network.

## [0.13.0] — 2026-11-15

### Added
- U9 · **Playground** (`js/apps/playground.js`, v0.1.0, developer category) — the 24th of 31 tools and the
  flagship sandboxed code playground. Write HTML, CSS and JavaScript and run them live in an isolated frame:
  - **Three editors** (HTML / CSS / JS tabs) + a **live preview** rendered inside a sandboxed `<iframe>`.
  - **Security by construction** — `sandbox="allow-scripts"` with **never** `allow-same-origin`, so user code runs
    in a unique opaque origin and cannot reach this app, its storage or the parent DOM. Verified: `parent.document`,
    `localStorage` and `parent.VT` all throw `SecurityError` from inside the frame. **No `eval()`** — the frame
    document is assigned via `srcdoc` and a stray `</script>` in the JS tab is neutralized.
  - **Captured console** — an in-frame shim serializes `log/info/warn/error/debug` plus `error` and
    `unhandledrejection` events and `postMessage`s them back; the parent renders them with `textContent` (never
    injected as HTML). Verified live output, warn/error coloring, and syntax-error capture.
  - **4 templates** (Welcome, DOM & events, Canvas animation, Live clock), **auto-run** (debounced),
    **desktop/mobile viewport** toggle, **Clear**, **Copy HTML** and **Export .html** (standalone file).
  - **Persistence** — autosave to IndexedDB (`pg:autosave`) restored + run on return with a hint; **named
    snippets** saved/opened from the side panel; a localStorage draft as a fast fallback.

### Changed
- Service Worker shell cache bumped `v21 → v24` as the new app JS, `index.html`, CSS, `app.js` and `registry.js` changed.
- `VT.version` `0.12.0 → 0.13.0`; `VT.releases` gained the 0.13.0 entry (13 releases); tool count 23 → 24.

### Verified
- Real browser (`localhost:8735`): mount + 3 tabs/iframe/console; console capture (log/warn/error + object
  serialization); runtime + syntax error capture; child DOM works; opaque-origin isolation (3 SecurityError
  probes); template apply; auto-run debounce; viewport toggle; Ctrl/Cmd+Enter run; autosave write → reload →
  restore + run (hint sticks); named save → open round-trip; export downloads standalone `.html`; 0 console errors.
- Offline with the server stopped (`curl` exit 000, port closed): navigation and `playground.js` both
  `transferSize 0`, tool mounted from cache, autosave snippet restored and run with no network.

## [0.12.0] — 2026-11-15

### Added
- U8 · **Design System Lab** (`js/apps/design-lab.js`, v0.1.0, creative category) — the 23rd of 31 tools and
  the flagship live token studio for the Cosmic Liquid Glass identity:
  - **Token model** across four groups — Palette (base, accent, accent 2, text), Glass (tint alpha, blur,
    border alpha), Shape (radius, shadow offset/blur/opacity), Type (display + UI font stacks).
  - **Live preview** on real sample components (hero, badge, primary/ghost buttons, glass card, input, chips,
    nested surface) driven entirely by CSS custom properties set on the preview root.
  - **5 presets** — Cosmic, Aurora, Midnight, Ember, Frost — as starting points.
  - **Undo/redo** the whole token set via `VT.history`; **autosave** to IndexedDB (`ds:autosave`) restored on
    return with a status hint; **named themes** saved/opened from the side panel.
  - **CSS export** — Copy CSS or download `vistanology-tokens.css`; the stylesheet interpolates only
    browser-validated token values (color pickers, numeric sliders, fixed font whitelist) — no scripts, no eval.

### Changed
- Service Worker shell cache bumped `v19 → v21` as the app JS, `index.html`, CSS and `registry.js` changed.
- `VT.version` `0.11.0 → 0.12.0`; `VT.releases` gained the 0.12.0 entry (12 releases); tool count 22 → 23.

### Verified
- Real browser (`localhost:8735`): mount + 4 groups/13 controls/5 presets; color edit updates live var + CSS;
  range edit updates var + value label + CSS; preset apply rebuilds controls + hint; undo restores prior token
  set; CSS export proven valid (`:root`, `--ds-surface`, `--ds-shadow`, name `vistanology-tokens.css`,
  `text/css`); autosave → reload → restore (frost theme); named theme save → switch → open round-trip (aurora
  restored over midnight); 0 console errors.
- Offline with the server stopped (`curl` exit 000, port closed): navigation `transferSize 0`, shell + tool
  loaded from cache, autosave theme restored from IndexedDB with no network.

## [0.11.0] — 2026-11-15

### Added
- U7 · **Visual Page Builder** (`js/apps/page-builder.js`, v0.1.0, creative category) — the 22nd of 31
  tools and the flagship drag-and-drop page composer. A typed block model renders into a live canvas,
  edited through a properties panel, reordered by dragging, and exported as clean, escaped HTML:
  - **12 block types** — hero, heading, paragraph, button, image, quote, list, columns, features grid,
    call-to-action, divider, spacer — each with its own editable fields and safe HTML renderer.
  - **Drag-and-drop** — drag a palette chip onto the canvas to insert at any position (drop indicator),
    reorder existing blocks by dragging or with the up/down tools, select a block and edit it live.
  - **Responsive preview** — desktop / tablet / mobile width presets applied to the canvas, persisted.
  - **Undo/redo** via `VT.history` over the whole document (blocks + preview width).
  - **HTML export** — Copy HTML or download `vistanology-page.html`; the document is generated from the
    typed model with all text escaped and `javascript:`/`data:` URLs neutralized (no scripts injected or
    evaluated). Export CSS mirrors the on-canvas styling.
  - **Local-first persistence** — autosave of the working document to IndexedDB (`pb:autosave`) restored
    on return with a status hint; named projects saved/opened from the palette column.

### Changed
- Service Worker shell cache bumped `v16 → v19` as the app JS, `index.html`, CSS and `registry.js` changed.
- `VT.version` `0.10.0 → 0.11.0`; `VT.releases` gained the 0.11.0 entry (11 releases); tool count 21 → 22.

### Verified
- Real browser (`localhost:8735`): mount + starter template, palette add, undo/redo, drag-reorder (up/down
  bug found and fixed), property editing (text/align), delete+undo, preview switch + persistence, HTML export
  (doctype, escaped text, `javascript:` href → `#`, no live `<script>`), IndexedDB project save → reload → open,
  autosave → reload → restore, drag-from-palette insertion (synthetic `DragEvent` with `DataTransfer`),
  new hero/features/CTA blocks render + export, EN/PT i18n, 0 console errors.
- Offline with the server stopped (`curl` exit 000, port closed): navigation `transferSize 0`, app shell and
  page-builder loaded from cache, 9-block document restored from IndexedDB autosave with no network.

## [0.10.0] — 2026-11-15

### Added
- U6 · **Data Workspace** (`js/apps/data-workspace.js`, v0.1.0, developer category) — the 21st of 31
  tools and the flagship JSON workbench. Organized as five cohesive tabs (not one giant screen):
  - **Editor** — live editable tree: add/rename/delete keys and array items, edit values with automatic
    type detection (number / boolean / null / quoted string), collapse/expand, `$.a.b[2].c` path chip,
    case-insensitive **search** that filters and force-expands matches, format **minify/pretty** and
    **sort keys**, import/export `.json`, live stats (keys/nodes/depth/size).
  - **CSV ↔ JSON** — RFC-4180 parser (embedded commas, escaped quotes, `\r\n`, quoted newlines), numeric
    coercion, per-row field-count warnings, JSON→CSV with nested values JSON-encoded and properly quoted,
    delimiter selector (`,` / `;` / tab), header toggle, load/export `.csv`.
  - **Compare** — structural document diff by path (added / removed / changed) with counts and an
    identical-state readout.
  - **Schema** — a dependency-free JSON Schema **subset** validator (`type`, `properties`, `required`,
    `items`, `enum`) reporting problems by path; sample schema included.
  - **Projects** — on-device persistence via `VT.db` (IndexedDB): save/open/delete named projects,
    **autosave** that survives reloads, and **backup/restore** (merge or replace).
- Undo/redo (`VT.history`) is integrated and **snapshots document content only** — `canonical()` is the
  recorded value, so view settings (minify/sort/indent/search) never create history noise.
- Large-document handling: arrays/objects render **incrementally** (200 children + “Show N more”), and
  `applySource` auto-collapses any document over 1500 nodes.

### Changed
- Service Worker: cache `VERSION` bumped `v11 → v16` across the four U6 increments (data-workspace.js,
  apps.css, app.js, registry.js edits), per the invalidation convention. `data-workspace` added to the
  precache `APPS` array (58 shell URLs).
- `js/core/ui.js` `tabs()` is now consumed by a flagship tool for the first time (five-panel layout).

### Verified (real browser, offline, file://)
- U6 increments 1–4 verified end-to-end in `http://localhost:8735`: tree edit/add/delete/type-detection,
  search filter (21→2→21 rows), minify/sort, path chip, undo/redo with view-setting isolation, CSV↔JSON
  round-trips incl. quoted-comma + numeric coercion + per-row warnings, structural diff (add/rem/chg),
  schema pass/fail/bad-schema, IndexedDB save/open/delete + autosave-across-reload + file-based restore,
  5000-item incremental render (201→401 rows, “Show 4800 more…”, apply ≈222 ms, no freeze).
- **Offline with the server stopped** (`curl` exit 7, port closed): navigation `transferSize: 0`, tool
  mounted from cache (5 tabs), projects listed and opened from IndexedDB with no network.
- **0 console errors** throughout. See [docs/checklist-u6.md](docs/checklist-u6.md).

## [0.9.0] — 2026-11-15

### Added
- U5b · `VT.history` reaches the other text editors. **JSON Formatter** (1.0.0 → 1.1.0) and **SVG Studio**
  (1.0.0 → 1.1.0) now adopt the undo/redo framework via Undo/Redo buttons (`aria-keyshortcuts`) plus
  `Ctrl+Z` / `Ctrl+Shift+Z` (`Ctrl+Y`). In JSON Formatter, typing, Sample and Clear are recorded and the
  `apply` path re-runs `process()`, so a redo re-validates the live output. In SVG Studio the recorded
  source covers typing, Clear, **Optimize, Recolor and Load-file**, and the `apply` path re-sanitizes,
  re-parses and re-renders — the view always matches the restored source. `syncHist` is hoisted to module
  scope so `loadFile` can update button state too. History is memory-only and `unmount` clears it.
- New separators/layout: `.jf-pane-actions` / `.jf-actions-sep` in the JSON input header and
  `.sv-srcmeta` (wraps; `#sv-count` pushed left) in SVG Studio, using `var(--line)`.

### Changed
- `js/core/history.js`, the shared `hist.*` strings and the `undo`/`redo` icons were already shipped in
  0.8.0; this release is pure adoption — **no core change** was needed, the apps just consume it.
- Service Worker: cache `VERSION` bumped `v7 → v8` after the shell content edits (`json-formatter.js`,
  `svg-studio.js`, `app.js`, `registry.js`), per the invalidation convention.

### Verified (evidence-gated, no cosmetic adoption)
- U4b · **Worker adoption evaluated with measurements and rejected with evidence.** On a 3200×2400 image,
  Image Compress/Converter do a 1:1 `drawImage` (measured ≈0 ms) and the browser already runs the encode
  off the main thread — **0 `longtask` entries** on either the current path or the worker path, and the
  outputs were **byte-identical** (SHA-256 `24cd359d…`). So offloading would add a bitmap copy, message
  round-trip and a parallel fallback path with **no responsiveness gain**. Metadata is pure EXIF/TIFF byte
  parsing (it breaks at SOS `0xDA` and does no canvas work) — the canvas worker cannot offload it. Only
  Image Resizer (real per-pixel scaling) keeps the worker. **No application code changed** for Compress /
  Converter / Metadata. See [docs/checklist-u4b.md](docs/checklist-u4b.md).

### Verification status
- ✅ Runtime in a real browser (`http://localhost:8735`): JSON Formatter undo/redo across typing/Sample/
  Clear + keyboard, with output re-validation on redo; SVG Studio undo/redo across typing/Clear/keyboard/
  Optimize/Recolor (via the HEX inputs)/Clear, remount reset (no leak); **0 console errors** throughout.
- ✅ Offline cold reload: navigation `transferSize: 0`, `history.js` + `json-formatter.js` +
  `svg-studio.js` confirmed served from the active cache; `VT.history` loaded.
- ✅ `file://` (no Service Worker): both tools mount and their undo/redo round-trips work.
- ✅ Regression: 20/20 tools mount clean. See [docs/checklist-u5b.md](docs/checklist-u5b.md).

## [0.8.0] — 2026-11-15

### Added
- U5 · Undo/redo framework: `js/core/history.js` — `VT.history.create({ apply, limit })`, a small
  memory-only **snapshot controller**. API: `reset/record/undo/redo/onKey` + `canUndo/canRedo/depth`.
  Coalescing is the caller's responsibility (a debounce on typing + explicit `record()` on programmatic
  changes), the stack is **bounded** (`limit`, default 100, oldest dropped) so a long session cannot
  grow without end, and nothing is ever persisted. `onKey` consumes `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`
  only when it has something to do, otherwise the event falls through to the browser.
- Markdown Preview (1.0.0 → 1.1.0) is the reference integration: **Undo/Redo buttons** in the actions
  row (with `aria-keyshortcuts`) plus keyboard handling, wired to typing (debounced), the Sample button
  and Clear. History resets on unmount — no cross-tool or cross-session leakage.
- Shared bilingual strings `hist.*` (Undo/Redo + tooltips) and two new icons (`undo`, `redo`) in the
  design-system style (24 grid, 1.5 stroke, cyan `.ia` signature).

### Changed
- Service Worker: `history.js` added to the app-shell precache (now **57** URLs) and cache `VERSION`
  bumped `v5 → v6` after the consolidation edits, per the documented invalidation convention.

### Verification status
- ✅ Runtime in a real browser: typing coalesces to one undo step per pause; `Ctrl+Z`/`Ctrl+Shift+Z`
  and the buttons round-trip Sample → edit → Clear; button disabled state tracks `canUndo/canRedo`;
  leaving the tool and returning resets history (no leak); **0 console errors**; full 20/20 tool
  regression mounted clean. Offline cold boot and `file://` exercised for the shell + module load.
  See [docs/checklist-u5.md](docs/checklist-u5.md).

## [0.7.0] — 2026-11-15

### Added
- U4 · Web Worker image pipeline: `js/core/workers.js` — `VT.workers`, a dependency-free worker host.
  The worker source is an **inline Blob** (no extra file to fetch or precache), which makes it work
  under `file://` and fully offline. `supported` probes `Worker + OffscreenCanvas +
  createImageBitmap`; `process(bitmap, opts, transferList)` posts the bitmap (transfer by default,
  copy mode when the main thread must keep it), with a 30 s timeout guard. On `onerror` the host is
  marked permanently `broken` and every caller falls back to an identical main-thread path.
- Image Resizer (1.0.0 → 1.1.0) is the reference integration: `HTMLImageElement` replaced by
  `createImageBitmap(file, {frame:0})` (first-frame semantics preserved; nested fallback for
  browsers without `frame`), scale + draw + encode moved to `VT.workers.process`, and an automatic
  `resizeSync()` main-thread fallback with byte-identical behavior.

### Changed
- Boot architecture decision, measured before made: **lazy loading evaluated and rejected with
  evidence** — full boot is 48 requests / ≈702 KB, of which ≈399 KB is the 20 tool scripts, all
  same-origin and already precached by the Service Worker; manifests are needed by Hub/Library/
  palette regardless. Per-tool dynamic imports would add complexity while saving only a few hundred
  KB on first tool visit — no user-perceptible gain. Workers were chosen as the U4 performance
  axis instead, where the data showed a real main-thread cost (121 ms long task on a 3000×2000 resize).
- Service Worker: `workers.js` added to the app-shell precache (now **56** URLs) and cache `VERSION`
  bumped `v4 → v5` after the consolidation edits (0.7.0 release notes), per the documented
  invalidation convention.

### Verification status
- ✅ **Byte-identity proven first** (SHA-256 of output blobs): worker `convertToBlob` ≡ main-thread
  `canvas.toBlob` for **PNG** (`929a…42`) and **JPEG** (`5058…55`) at identical parameters —
  deterministic encode, zero output change. Forced-fallback path produced the same bytes as the
  worker (`fallbackMatchesWorker: true`).
- ✅ Performance in a real browser: main-thread **long task 121 ms → 73 ms** on a seeded 3000×2000
  JPEG resize (worst frame gap 79 ms). Worker host reuse verified — one message per resize, one
  worker across four remount cycles; exactly one drop zone / file input after remounts.
- ✅ Runtime battery (online, `localhost`): sample load, percent/px/fit modes, aspect lock,
  upscale warning, WebP/PNG/JPEG outputs, animated-GIF first-frame path, SVG rejection toast,
  `file://` (worker supported, 161,408-byte PNG out, SW absent), and **offline cold boot**
  (server killed, `netstat` empty, `curl` exit 7, navigation `transferSize: 0`) — Image Resizer
  loaded a sample and produced a **byte-equal 8,148-byte WebP** through the worker offline.
  **0 console errors**; full 20/20 tool regression mounted clean after remount cycles.
  See [docs/checklist-u4.md](docs/checklist-u4.md).

## [0.6.0] — 2026-11-15

### Added
- U3 · Command palette: `js/core/palette.js` — `VT.palette`, opened with **Ctrl+K / ⌘K** (or **Ctrl+P**,
  or **`?`** outside text fields, or the new top-bar launcher). One fuzzy box over **all 20 tools**
  (name EN+PT, tagline, id, category, tags — multi-word AND matching, same spirit as Library search)
  plus commands: go to Home/Library/Docs/Open/Settings, switch language, toggle reduced motion and
  liquid/solid glass. Matched text is highlighted; results ranked by prefix > word-start > substring >
  subsequence scoring.
- Keyboard-complete and accessible: `↑`/`↓`/`Tab` move, `Enter` runs, `Esc` closes, `aria-expanded` +
  `aria-activedescendant` combobox pattern, focus is restored to the element you came from. The global
  listener never fires while typing in `input`/`textarea`/`select`, and existing shortcuts (`/` in
  Library) keep working.
- Bilingual EN/PT strings; footer legend inside the palette (`navigate / open / toggle`).

### Changed
- Top bar: command-palette launcher button (`aria-keyshortcuts="Ctrl+K"`) before the language toggle.
- Service Worker: `palette.js` added to the app-shell precache (now **55** URLs) and cache `VERSION`
  bumped `v1 → v2 → v3` (v3 after the final release-note edits), exercising the documented
  invalidation convention — the browser auto-updated and re-precached 55/55 with no manual intervention.

### Verification status
- ✅ Runtime in a real browser: open (button, Ctrl+K, Ctrl+P, `?`), toggle-close, Esc with focus
  restore, fuzzy ranking (`grad` → Gradient Lab first; multi-word `colo stu` → Color Studio), Enter
  navigates (`#/settings`, `#/tool/color-studio`, `#/tool/text-diff`), commands executed (language
  switch EN↔PT with chrome relabelled, motion toggle applied to `body[data-motion]` and restored),
  `?` ignored inside Library search, `/` unaffected. **Offline cold boot with the port confirmed
  closed** (`netstat` empty, `curl` exit 7, navigation `transferSize: 0`): palette opens, searches,
  opens tools and runs the language command from cache. `file://`: palette fully functional (SW
  correctly not registered). **0 console errors**; full 20/20 tool regression mounted clean.
  See [docs/checklist-u3.md](docs/checklist-u3.md).

## [0.5.0] — 2026-11-15

### Added
- U2 · Project store: `js/core/db.js` — `VT.db`, a local-first structured database on IndexedDB
  (`vistanology-open`, schema-versioned with an `onupgradeneeded` migration framework; `projects`
  store keyed by `id`, indexed by `tool` and `updatedAt`, plus a `meta` store holding `schemaVersion`).
  API: `available/open/put/get/list/remove/clear/count/exportAll/importAll` + `uid`. Nothing leaves
  the device; export/import are local files only.
- Gradient Lab (1.1.0) now saves **named gradients** to `VT.db`: a "Saved gradients" section with a
  name field + Save, a persisted list with Load (applies the exact saved geometry/stops/size and
  switches the type tab) and Delete behind a confirm dialog. The single working-state autosave in
  `VT.store` is unchanged.
- Settings "Saved projects" card: live count, **Export all** to a timestamped `.vistanology.json`
  backup, **Import** from file (JSON-parsed, shape-validated, merge mode, per-item skip of malformed
  entries), and **Erase projects** with confirm. "Reset all local data" now also clears `VT.db`.
- Bilingual EN/PT strings for all of the above; honest unavailability state when IndexedDB is blocked.

### Fixed
- `index.html`: removed a duplicated `<meta name="color-scheme">` left by the U1 edit.
- Service Worker: `db.js` added to the app-shell precache (now **54** URLs: 34 shell + 20 apps), so
  the project store loads offline; precache integrity re-verified 54/54 present on disk.

### Verification status
- ✅ Runtime in a real browser: full `VT.db` CRUD + sort + exportAll, `importAll` merge (imported 2,
  skipped 1 malformed) and replace; **persistence across reload**; `file://` works. Gradient Lab save
  → row appears → Load restores the saved 200° after changing the angle → Delete via modal; **offline
  cold boot** (server killed, `fetch` throws `TypeError`) renders and loads a saved gradient; reconnect
  recovers (HTTP 200). Settings: count/export/import (valid + invalid JSON + wrong-shape all handled),
  erase modal, and global reset clears both stores. EN + PT labels/counts/toasts verified; no horizontal
  overflow at narrow width; **0 console errors**; full 20/20 tool regression mounted clean.
  See [docs/checklist-u2.md](docs/checklist-u2.md).

## [0.4.0] — 2026-11-15

### Added
- U1 · Offline-first shell: Service Worker (`sw.js`) com precache do app shell (53 URLs) +
  stale-while-revalidate + fallback de navegação offline; `app.webmanifest` instalável; ícones SVG
  locais; registro condicionado a contexto seguro (não quebra `file://`); badge de rede honesto no
  topbar com i18n EN/PT e fallback reduced-motion.

### Verification status
- ✅ Static: syntax checks, valid manifest JSON, precache integrity (53/53 files present), app-list
  sync (disk == SW == index.html, 20/20/20), served MIME types.
- ✅ **Runtime offline (validated in a real browser):** SW registered → `activated` and controlling;
  `vt-shell-v1` populated with 53 entries; **server killed** and page reloaded → app booted from the
  SW cache (a test `fetch` threw `TypeError: Failed to fetch`, proving genuine disconnection, not a
  disk-cache false positive thanks to `no-store`), JSON Formatter still validated input to "Valid
  JSON" and Color Studio rendered its palette offline, SPA navigation and shell intact, 0 console
  errors; reconnect recovered cleanly (HTTP 200, SW still controller, badge cleared); manifest applied
  (`display:standalone`, 2 icons, valid `start_url`/`scope`); network badge verified offline/online and
  under `data-motion="reduced"`; `file://` unaffected (SW not registered, tools still work).
- ✅ **Network independence verified by inspection, not by label:** the page made **46 requests, all
  same-origin `localhost:8735`** (CSS, core/shell/app JS, woff2 fonts, bundled `qrcode.js`) — **zero
  cross-origin / CDN / external API calls.**
- Full F0+F1+F2 regression re-run: 20/20 tools mount with 0 console errors.
  See [docs/checklist-u1.md](docs/checklist-u1.md).

## [0.3.0] — 2026-11-15

### Added
- Image Compressor: local canvas re-encode of PNG/JPEG/WebP, live before/after wipe slider (drag +
  arrow keys) or side-by-side panes, quality 10–100, honest byte savings, busy indicator, one-click export.
- Image Converter: batch PNG/JPEG/WebP queue with per-file status/size deltas, transparency badge,
  chosen JPEG background, individual download plus a dependency-free store-only ZIP.
- Image Resizer: percent (1–400%), exact pixels with aspect-ratio lock, or fit-within box; resampling
  quality, live checker-board preview, honest upscale warning, real output bytes.
- Image Metadata: binary inspector for PNG chunks, JPEG EXIF + GPS, WebP/GIF/BMP headers, privacy
  warning and a one-click clean re-encode that strips all metadata.
- JSON Formatter: live validation with exact error line/column, pretty/minified (2/4/tab), recursive
  key sorting, syntax-highlighted code + collapsible tree, structure stats, copy and `.json` download.
- Base64: UTF-8-correct encode/decode, URL-safe variant, MIME 76-column wrap, invalid-input detection,
  byte/char stats, swap, copy and download.
- URL Toolkit: parse absolute URLs, edit/add/remove query params with a live rebuilt URL, plus
  URI-component encode/decode with malformed-escape detection.
- Regex Tester: live highlighted matches with index and positional/named groups, six flag toggles,
  measured timing, match cap, and a `$1`/`$&`/`$$` replace preview.
- Timestamp Converter: live now-clock, epoch↔date with auto s/ms detection, ISO/UTC/local/relative
  views, range validation and one-click copy of every output.
- Text Diff: line-level LCS diff with unified and side-by-side views, ignore whitespace/case, honest
  add/remove/unchanged counts, swap, copy and a unified `.diff` download.
- Hash Generator: SHA-1/256/384/512 of text or a local file via Web Crypto, uppercase hex, per-digest
  copy, identify-a-hash and `.txt` export.
- Markdown Preview: live local Markdown preview (split/preview/HTML), sanitized links, code fences,
  tables and nested lists, word/char/line stats, HTML/Markdown export.
- Bilingual per-tool docs (in-app + docs/*.md) and desktop/mobile screenshots for every F2 tool.
- F2 verification checklist with runtime evidence and the mandatory F0+F1+shell regression
  (docs/checklist-f2.md).

### Fixed
- Image Compressor: stale-metrics gap during encode (busy `…` + disabled download until settled).
- Text Diff: `.df-text` class shared by the textarea and diff-row span leaked `min-height` into rows
  (textarea renamed `.df-area`); identical status used the warn color instead of neutral.
- Hash Generator: text/file panels sat outside the `#hg-tab` root so tabs never switched (wrapped bar
  + panels); missing `hg.copy` i18n key added.
- Markdown Preview: `data:image/` URLs were rejected before the image branch; unsafe paren links left
  a stray `)` (one-nested-paren-tolerant URL group); rebuilt after a Write-tool NUL truncation.

### Changed
- README status: 20 / 31 tools; Media Lab and Developer Tools categories complete.
- F0 + F1 + shell regression clean: 20/20 tools mount with 0 console errors; settings, i18n, navigation,
  library search/favorites, modal focus trap and responsive 319–1280 re-verified.

## [0.2.0] — 2026-11-15

### Added
- Gradient Lab: linear/radial/conic gradients, live stage, up to eight editable stops, six presets,
  angle chips, CSS copy and PNG (512/1024/2048) / SVG export verified pixel-for-pixel.
- Font Preview: bundled/system/user fonts via local FontFace (never uploaded), specimen + waterfall +
  glyph views, measured metrics, live WCAG contrast, CSS/PNG export.
- SVG Studio: inspect, sanitize (scripts/handlers/external refs stripped), optimize, recolor, live
  preview with zoom/backgrounds, structure metrics, SVG copy/download and PNG 1×/2×/4×.
- Password Generator: crypto.getRandomValues with rejection sampling, characters + passphrase modes,
  live entropy/strength, memory-only history (never persisted).
- UUID Generator: RFC-4122 v4 and time-ordered v7 (monotonic sequence), 1–100 per batch,
  case/hyphens/wrapper formats, decoded v7 timestamp, copy-all and .txt export.
- Lorem Ipsum Generator: paragraphs/sentences/words from a 162-word classic vocabulary, classic
  opening, reproducible seeds (xmur3 + mulberry32), plain or HTML <p> wrap, serif preview vs exact
  source, .txt / .html export.
- Bilingual per-tool docs (in-app + docs/*.md) and desktop/mobile screenshots for every shipped tool.
- F1 verification checklist with runtime evidence (docs/checklist-f1.md).

### Fixed
- Gradient Lab: 90° canvas/CSS origin mismatch between stage and exports.
- Font Preview: webfont load race that produced stale metrics after reload; two small-screen layout bugs.
- SVG Studio / Password: doubled localStorage prefix (`vistanology:vistanology:…`); two tablists
  sharing one tabs instance (background tabs were dead); 320 px action-row overflow.
- UUID: `urn:uuid:` prefix was uppercased in upper mode (URN namespace requires lowercase).
- Lorem Ipsum: out-of-range stored count was clamped instead of rejected; literal `<p>` in
  tagline/summary/usage was swallowed as an HTML tag by innerHTML injection.

### Changed
- README status: 8 / 31 tools; Creative Studio and Generators categories complete.

## [0.1.0] — 2026-11-15

### Added
- Cosmic Liquid Glass design system: night-blue palette, luminous cyan, three glass
  elevations with holographic specular edges, editorial typography (Instrument Serif + Inter).
- Open Hub with atmospheric hero, category index, favorites and recents.
- Tool Library with search, category filters and favorites.
- App frame with breadcrumbs, favorite toggle, per-tool docs and local-only seal.
- Docs (in-app, bilingual) and Open page (license, releases, contributing, credits, privacy).
- Settings: language (EN/pt-BR), motion, transparency, local data reset.
- QR Studio: seven content types, colors, quiet zone, ECC, center logo (auto ECC H), PNG/SVG export.
- Color Studio: harmony palettes with locks, HEX/RGB/HSL inspector, k-means image extraction, WCAG contrast.
- Open-source scaffolding: MIT license, contributing guide, issue templates, privacy policy.

### Roadmap (not yet shipped)
- 0.6: U3 command palette; U4 lazy loading + Web Workers; U5 undo/redo; project stores rolled out to
  more flagship tools (Color Studio, SVG Studio, QR Studio, …).
- 0.7: Productivity (Focus, Pomodoro, Word Counter, Case, Text Cleaner, Units) + Documents (PDF suite).
- 1.0: full catalog verification and release. See [docs/VISION.md](docs/VISION.md).