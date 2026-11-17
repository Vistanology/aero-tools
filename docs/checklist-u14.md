# Checklist · U14 — SVG Editor (release 0.18.0)

Increment-by-increment verification. Method: real browser (Chromium via browser-use MCP) against
`http://localhost:8735`, feature checks via `evaluate_script`, synthetic `PointerEvent` dispatch on the
canvas/handles for move/resize/rotate, `createImageBitmap` pixel inspection on the exported PNG blob,
`downloadText`/`downloadBlob` stubs to capture exports, IndexedDB round-trips, and genuine offline proof
(dev server killed, `curl` exit 000, navigation/resource `transferSize: 0`).

## Increment 1 — Model, primitives, direct manipulation, styling, layers, history, persistence, export

| Area | Check | Result | Evidence |
|---|---|---|---|
| Registry | Tool visible, v0.1.0, cat creative, icon layers | ✅ | `VT.registry.all().length === 29`; breadcrumb "Creative Studio / SVG Editor" |
| Mount | 5 add buttons + canvas + props + geo | ✅ | `.se-adds .btn` = 5; `#se-canvas`, `#se-props`, geo "0 shape(s)…" |
| Add rect | shape rendered, selected | ✅ | `[data-id]` tag `rect`, fill `#5FE6FF`, width 160; overlay + 4 handles present |
| Move (drag) | body drag updates center, snapped | ✅ | geo 240,160 → **288,176** (Δ48,16, snap 8); rect x=208,y=121 |
| Resize (corner) | `se` handle grows bbox, center shifts | ✅ | 160×110 → **240×192**, center 288,176 → 312,192 |
| Rotate (handle) | top handle sets rotation around center | ✅ | produced exactly **90°**, `transform="rotate(90 312 192)"` |
| Fill edit | color input updates shape + output | ✅ | `#se-fill`→`#FF8FA3`; shape fill `#ff8fa3`; live SVG output contains the color |
| Stroke/opacity | range inputs update markup | ✅ | exported SVG has `stroke-width="8"`, `opacity="0.6"`; shape opacity attr `0.6` |
| Export SVG | clean markup, xmlns | ✅ | `Untitled.svg`, `image/svg+xml`, `xmlns`, per-shape `stroke-width`/`opacity` |
| Export PNG | rasterized at scale, pixel-accurate | ✅ | `Untitled@2x.png` decodes **960×640**; center `[157,97,116]` = `#FF8FA3`@0.6 over `#0B1B2E` (exact blend) |
| Undo/redo | document-level history | ✅ | 3 shapes → undo 2 → undo 1 → redo 2 → redo 3 |
| Layers reorder | bring forward changes paint order | ✅ | Rect (bottom) → ▲ → top-first list [Rect, Ellipse] |
| Layers visibility | eye toggle hides shape | ✅ | hidden → only 2 of 3 rendered; re-shown → 3 |
| Delete | removes selection | ✅ | Delete button → shape count 2 → 1 |
| Autosave | writes doc to `se:autosave` | ✅ | `rec.data.shapes.length === 3` after edits |
| Restore | remount restores doc + hint | ✅ | "Restored your last artwork"; layer rows 3 (1 hidden) |
| Named projects | save adds row, autosave excluded | ✅ | list rows 1 ("My Scene"), db records 2 |
| Project open | restores saved doc | ✅ | Open → 3 shapes (1 hidden) back on canvas |
| Canvas size | width updates viewBox + output | ✅ | `#se-cw`→600 → `viewBox="0 0 600 320"`; output matches |
| Transparent bg | toggle removes bg rect | ✅ | `.se-bg` count 0; output has no background rect |
| Sample | loads 4-shape scene | ✅ | tags `rect, polygon, ellipse, line` |
| i18n | EN + PT keys for `se.*` | ✅ | PT "Retângulo"/"Estrela", geo "4 forma(s)…" |
| Aesthetics | uses tokens (`--cyan`, `--glass-*`, `--r-*`, `--font-mono`) | ✅ | `css/apps.css` `se-*` block; identity screenshot confirmed |
| Mobile | work columns stack at ≤980px | ✅ | `@media 980px` `.se-work { grid-template-columns: 1fr }` |
| Offline | shell + tool + autosave, no network | ✅ | navigation + `svg-editor.js` + `apps.css` `transferSize: 0`; sample restored; 29 tools |
| Console | 0 errors / 0 warnings | ✅ | `list_console_messages` clean |

## Bugs found and fixed during verification

| Bug | Root cause | Fix |
|---|---|---|
| Live SVG output panel stale | `commit()`/pointer-up didn't refresh `#se-svg-out` | Update `refs.manifestOut` in `commit()` and in `onUp()` |
| Redo did not advance (undo/redo broke) | `hist.apply` called `applyDoc`, which runs `hist.reset()` and wipes the undo/redo stacks mid-navigation | Split into `setDoc()` (hydrate + render, no history) used by `apply`, vs `applyDoc()` (explicit load: `setDoc` + reset + autosave + toast) |
| Bring-forward / send-backward inverted | layer list is top-first (reverse of paint order), so the `dir` signs were backwards | `up` → `moveLayer(id, +1)`, `down` → `moveLayer(id, -1)` |

## Consolidation 0.18.0

| Item | Result |
|---|---|
| `js/app.js` `VT.version` | 0.18.0 |
| `js/core/registry.js` `VT.releases` | 18 entries, new 0.18.0 (EN+PT 3 bullets) |
| `sw.js` VERSION | v33 → v34; APPS includes `…`, `favicon-studio`, `svg-editor` (29 entries) |
| `index.html` | `svg-editor.js` script tag added after `favicon-studio.js` |
| `css/apps.css` | full `se-*` block appended |
| Regression | version 0.18.0, 29 tools, 18 releases, SW v34, svg-editor mounts, cross-tool `#view` regression clean |
| Offline regression | server killed → transferSize 0, tool from cache, sample restored |
| `CHANGELOG.md` | [0.18.0] section added |
| `README.md` | 29/31, SVG Editor entry, +U14 header/checklist/verified bullets |
| `docs/VISION.md` | §4 U14 ✅ 0.18.0 (29ª), §6 next = U15 Notes Workspace |
| Docs | `docs/svg-editor.md`, `docs/checklist-u14.md`, `docs/shots/svg-editor-preview.png` |

**Unit status: ✅ U14 shipped as 0.18.0.**
