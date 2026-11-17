# Checklist · U12 — Image Studio (release 0.16.0)

Increment-by-increment verification. Method: real browser (Chromium via browser-use MCP) against
`http://localhost:8735`, feature checks via `evaluate_script`, `createImageBitmap` pixel inspection on the
exported blob, IndexedDB round-trips, and genuine offline proof (dev server killed, `curl` exit 000,
navigation/resource `transferSize: 0`).

## Increment 1 — Load, transforms, filter stack, compare, history, persistence, full-res export

| Area | Check | Result | Evidence |
|---|---|---|---|
| Registry | Tool visible, v0.1.0, cat media, icon image | ✅ | `VT.registry.all().length === 27`; breadcrumb "Media Lab / Image Studio" |
| Mount | dropzone + sample load | ✅ | after sample: editor shown, dropzone hidden, hint "Loaded 800×600px image" |
| Controls | 8 sliders + 5 crop options + format select | ✅ | `.is-range` = 7 adjust + 1 quality; `#is-crop` = free/1:1/4:3/3:2/16:9 |
| Rotate | ±90 swaps dims | ✅ | dims 800×600 → **600×800** |
| Crop 1:1 | square output | ✅ | dims → **600 × 600 px** |
| Grayscale filter | applied at pixel level | ✅ | exported center pixel **R=G=B** (decoded via `createImageBitmap`) |
| Export PNG | full-res, correct dims | ✅ | blob decodes to **600×600**, name `sample-edited.png`, type `image/png`, 165,266 B |
| Export JPEG | quality slider honored | ✅ | `sample-edited.jpg`, type `image/jpeg`, 20,989 B; quality row visible for lossy only |
| Undo/redo | edit-state history | ✅ | undo → brightness 0; redo → brightness 100; redo re-enabled after undo |
| Compare | toggles original view | ✅ | `#is-compare.is-active` on, off again |
| Autosave | writes src + edit to `is:autosave` | ✅ | `rec.data.src` present; `rec.data.edit = {brightness:150, crop:'16:9'}` |
| Restore | reload restores image + edits + hint | ✅ | editor visible, brightness 150, crop 16:9, hint "Restored your last edit" |
| Named saves | save adds row, autosave excluded | ✅ | list rows = 1, db records = 2 ("SunsetEdit" present) |
| i18n | EN + PT keys for `is.*` | ✅ | `add()` both locales; EN verified in screenshots |
| Aesthetics | uses tokens (`--cyan`, `--glass-*`, `--r-*`, `--font-mono`) | ✅ | `css/apps.css` `is-*` block; no new visual language |
| Mobile | columns stack at ≤980px | ✅ | `@media 980px` `.is-editor { grid-template-columns: 1fr }` |
| Offline | shell + tool + autosave, no network | ✅ | navigation + `image-studio.js` + `apps.css` `transferSize: 0`; last edit restored; 27 tools |
| Console | 0 errors / 0 warnings | ✅ | `list_console_messages` clean |

## Consolidation 0.16.0

| Item | Result |
|---|---|
| `js/app.js` `VT.version` | 0.16.0 |
| `js/core/registry.js` `VT.releases` | 16 entries, new 0.16.0 (EN+PT 3 bullets) |
| `sw.js` VERSION | v30 → v31; APPS includes `…`, `component-builder`, `image-studio` (27 entries) |
| `index.html` | `image-studio.js` script tag added before `app.js` |
| `css/apps.css` | full `is-*` block appended |
| Regression | version 0.16.0, 27 tools, 16 releases, SW v31, image-studio mounts |
| Offline regression | server killed → transferSize 0, tool from cache, edit restored |
| `CHANGELOG.md` | [0.16.0] section added |
| `README.md` | 27/31, Image Studio entry, +U12 header/checklist/verified bullets |
| `docs/VISION.md` | §4 U12 ✅ 0.16.0 (27ª), §6 next = U13 Editor SVG avançado |
| Docs | `docs/image-studio.md`, `docs/checklist-u12.md`, `docs/shots/image-studio-preview.png`, `docs/shots/release-0.16.0.png` |

**Unit status: ✅ U12 shipped as 0.16.0.**
