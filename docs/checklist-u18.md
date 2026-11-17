# U18 · Diagram Studio — Verification checklist (v0.22.0)

All results below were produced by driving the **real browser** (browser-use MCP `evaluate_script`) against the local
dev server (`serve_u1.js`, port 8735, `cache-control: no-store`), not by reasoning or by `node --check` alone. Each row
records the concrete observed value. Nothing here is claimed unless a runtime assertion returned it.

## Environment notes

- The Service Worker **stale-cache trap** was handled before every assertion: `caches.keys()→delete all` +
  `getRegistrations()→unregister each`, then a hard reload on a fresh `?cb=` URL, then confirming the *served bytes*
  (`fetch(no-store)` + `grep`) reflected each fix before trusting a result. Two reloads were needed after the final
  `sw.js` version bump so the page was actually controlled by `v41`.
- **Screenshots are pending** — the in-app Browser surface reports `visibilityState=hidden`, so `take_screenshot` fails
  with `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE` (same limitation documented for Kanban U16 and Document Workshop U17).
  Layout was validated through the DOM and computed styles instead.

## Consolidation

| Field | Value |
|---|---|
| `VT.version` (js/app.js) | `0.22.0` |
| Registry tools (`VT.registry.all().length`) | `33` |
| Releases (`VT.releases.length`, newest) | `22` · `0.22.0` |
| Service Worker `VERSION` | `v41` (was `v40`) |
| APPS precache | includes `diagram-studio` |
| index.html script tag | `diagram-studio.js` present |
| `VT.modules['diagram-studio']` | defined (`return def;` restored) |
| Category / icon | `creative` / `branch` |

## Functional evidence

| # | Check | Observed |
|---|---|---|
| 1 | Mounts on `#/tool/diagram-studio` | `#view` children `3`; `#ds-svg` present; viewBox `0 0 720 480`; 4 add-kind buttons |
| 2 | Default empty | stats `0 node(s) · 0 edge(s)`, 0 `.ds-node` |
| 3 | Sample renders | `4 node(s) · 3 edge(s)`; 4 `.ds-node`; 6 edge paths (3 visible + 3 hit); 1 `marker` |
| 4 | Add each node kind | Rectangle/Diamond/Capsule/Note each add → `8 node(s)` |
| 5 | Node click → selection + inspector | 1 `.ds-node.is-sel`; `.ds-insp` and `.ds-insp-node` un-hidden; label input prefilled `Start` |
| 6 | Live label edit | typing into inspector label updates the SVG `.ds-label` text immediately |
| 7 | Drag node (synthetic PointerEvents via `getScreenCTM`) | moved `(40,60) → (120,112)`; both multiples of the 8px snap |
| 8 | Undo / redo the drag | undo → `(40,60)`; redo → `(120,112)`; undo again → `(40,60)` (exact) |
| 9 | Two-step Link adds one edge | Sample `3 edges → 4 edges` after arm+target (armed source showed `.is-link`) |
| 10 | Edge click → select + edit label | edge panel shown; label `EDGE-LBL` appears as SVG text |
| 11 | Delete node cascades edges (confirm dialog) | `8 → 7 nodes`, `4 → 2 edges` (deleted node's 2 edges removed); modal had Cancel + Delete |
| 12 | Autosave captures live edit | after New→add→rename `SAVE-MARKER-42`, `VT.db.get('ds:autosave')` contains it (nodes=1) |
| 13 | Reload restores from autosave | fresh reload → node label `SAVE-MARKER-42`, `1 node(s) · 0 edge(s)` |
| 14 | Named project save | `#ds-proj-save` → row `My Flow A` with Open/Delete; autosave row **absent** from the list |
| 15 | Project Open round-trips | add node (`5`) → Open saved (`4`) restores the saved diagram |
| 16 | Export SVG | `<svg>`-rooted, 7 `<g` groups, name `Untitled_diagram.svg`, mime `image/svg+xml`, 2410 bytes |
| 17 | Export PNG | `downloadBlob` fired; `image/png`, 76402 bytes, decoded `1440×960` = 2× the 720×480 canvas |
| 18 | Security — XSS label | `<img onerror>`/`<script>` label is inert on the canvas (`window.__pwned` `undefined`) and **escaped** in the export (`&lt;img … onerror=&quot;…&quot;&gt;&lt;script&gt;`); no raw `<img`/`<script` |
| 19 | i18n EN↔PT | New↔Novo, Sample↔Exemplo; composed stats flip too (`4 node(s) · 3 edge(s)` ↔ `4 no(s) · 3 aresta(s)`) on `vt:lang` |
| 20 | Responsive | at `666px` viewport `.ds-work` grid = single `622px` column (≤980 media rule active) |
| 21 | Offline (server killed) | `curl` exit 7 / `http=000`; navigation `transferSize:0`; **every** asset `transferSize:0`; zero network bytes; Sample still rendered 4 nodes on `0.22.0` |
| 22 | Console | clean — no errors or warnings |
| 23 | Cross-tool regression | notes / kanban / document-workshop / diagram-studio each mount with 3 children; hub mounts with 4 |

## Bugs found and fixed during verification

| Bug | Root cause | Fix | Evidence |
|---|---|---|---|
| `VT.modules['diagram-studio']` was `undefined` | the module IIFE ended `VT.registry.add(def); })();` with no `return def;` | added `return def;` | `present:true` |
| Stats label showed the raw key `ds.stats` | the i18n key used by `updateStats()` existed in neither dict | added `ds.stats` to **EN and PT** | renders `0 node(s) · 0 edge(s)` |
| Autosave never captured edits | `scheduleSave()` calls `autosave()`, but `autosave` was set to `null` in mount and never bound to `saveSoon`; only `flushSave()` (New/Sample/Open/unmount) wrote | `autosave = saveSoon;` in mount | autosave now contains live label edit; reload restores it |
| Inspector stayed hidden on node click | `selectNode()` only did `renderDiagram()`, not `updateInspector()` | `selectNode()` also calls `updateInspector()` | panels un-hide, label input prefilled |
| Stats went stale after a language switch | no tool re-renders `t()`-composed strings on `vt:lang` | added a `vt:lang` listener → `renderMeta`/`updateStats`/`loadProjects`, removed on cleanup | stats flip EN↔PT |

A second edit initially deleted the `hist = VT.history.create(...)` line while fixing `autosave`; it was restored and
re-checked (`node --check` OK, undo/redo verified live).

## Honest status

Diagram Studio is implemented for real, integrated with the shell (registry, router, i18n, history, IndexedDB store,
Service Worker, docs) and validated end-to-end in a browser, including offline with the server stopped. **The only
outstanding item is a screenshot**, blocked by the hidden in-app Browser surface (documented, not a functional gap).
