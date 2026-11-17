# Checklist · U13 — Favicon & Icon Studio (release 0.17.0)

Increment-by-increment verification. Method: real browser (Chromium via browser-use MCP) against
`http://localhost:8735`, feature checks via `evaluate_script`, `createImageBitmap` pixel inspection on the
exported blobs (stubbing `VT.utils.downloadBlob` to capture them), IndexedDB round-trips, and genuine offline
proof (dev server killed, `curl` exit 000, navigation/resource `transferSize: 0`).

## Increment 1 — Source, one render path, background/shape, live grid, export, manifest, history, persistence

| Area | Check | Result | Evidence |
|---|---|---|---|
| Registry | Tool visible, v0.1.0, cat generators, icon palette | ✅ | `VT.registry.all().length === 28`; breadcrumb "Generators / Favicon & Icon Studio" |
| Mount | controls + live grid + side panel | ✅ | `.fs-controls`, 8 `.fs-cell`, `.fs-manifest` present; monogram tab active by default |
| Grid | all eight sizes at true dims | ✅ | cells 16/32/48/64/128/180/192/512, each labeled `W×W`, CSS-capped ≤128px |
| Monogram render | glyph drawn, opaque | ✅ | 512 export ≈ **96%** non-transparent pixels (text + fill); default `V` visible |
| Circle shape | corner clipping at pixel level | ✅ | center alpha **255**, corner alpha **0** (decoded from `createImageBitmap`) |
| Image source | loaded color preserved | ✅ | red source → export center pixel RGB **[255,0,0]** |
| Background fill | solid / gradient / transparent | ✅ | `bgMode` select drives fill path; gradient row shows only when `gradient`; transparent leaves corners alpha 0 with no bg |
| Shape + radius/pad | `renderIcon` honors radius & padding | ✅ | `roundRect` clip scales with `size*radius/100`; inner box = `size*(1-2*pad/100)` |
| Export one | single PNG at correct dims | ✅ | `exportOne(512)` → blob decodes **512×512**, name `icon-512x512.png`, type `image/png` |
| Export all | batch, staggered | ✅ | 8 `setTimeout`s at 250 ms → 8 blobs captured; toast "Exported 8 icon sizes" |
| Manifest | valid JSON, 8 icons | ✅ | `buildManifest()` `JSON.parse`s; `icons.length === 8`; `background_color`/`theme_color` follow fill mode |
| Manifest export | copy + download | ✅ | `downloadText(site.webmanifest, application/manifest+json)`; copy → clipboard toast |
| Undo/redo | options-only history | ✅ | deterministic cycle: change bgMode→shape, undo→undo restores solid, redo→redo re-applies; `srcThumb` never in snapshots |
| Autosave | writes opts + src to `fs:autosave` | ✅ | `rec.data.opts` present; `rec.data.src` (≤512 png dataURL) round-trips |
| Restore | reload restores image + opts + hint | ✅ | green source → reload → export center RGB **[0,255,136]**; hint "Restored your last icon set" |
| Named presets | save adds row, autosave excluded | ✅ | list rows = 1 ("Brand set"), db records = 2 (autosave filtered from list) |
| **Bug fix** | `#fs-src-label` after loading image | ✅ | previously stayed "No image loaded"; now `syncTypeUI()` sets "Image loaded" (EN/PT) |
| Bad-type guard | non-image rejected | ✅ | `fs.badType` toast; type regex `/^image\//` |
| i18n | EN + PT keys for `fs.*` | ✅ | `add()` both locales; EN verified in screenshots |
| Aesthetics | uses tokens (`--cyan`, `--glass-*`, `--r-*`, `--font-mono`) | ✅ | `css/apps.css` `fs-*` block; no new visual language |
| Mobile | work columns stack at ≤980px | ✅ | `@media 980px` collapses `.fs-work { grid-template-columns: 280px 1fr 300px }` |
| Offline | shell + tool + autosave, no network | ✅ | navigation + `favicon-studio.js` + `apps.css` `transferSize: 0`; last set restored; 28 tools |
| Console | 0 errors / 0 warnings | ✅ | `list_console_messages` clean |

## Consolidation 0.17.0

| Item | Result |
|---|---|
| `js/app.js` `VT.version` | 0.17.0 |
| `js/core/registry.js` `VT.releases` | 17 entries, new 0.17.0 (EN+PT 3 bullets) |
| `sw.js` VERSION | v32 → v33; APPS includes `…`, `image-studio`, `favicon-studio` (28 entries) |
| `index.html` | `favicon-studio.js` script tag added before `app.js` |
| `css/apps.css` | full `fs-*` block appended |
| Regression | version 0.17.0, 28 tools, 17 releases, SW v33, favicon-studio mounts, cross-tool `#view` regression clean |
| Offline regression | server killed → transferSize 0, tool from cache, last set restored |
| `CHANGELOG.md` | [0.17.0] section added |
| `README.md` | 28/31, Favicon entry, +U13 header/checklist/verified bullets |
| `docs/VISION.md` | §4 U13 ✅ 0.17.0 (28ª), §6 next = U14 Editor SVG avançado |
| Docs | `docs/favicon-studio.md`, `docs/checklist-u13.md`, `docs/shots/release-0.17.0.png` |

**Unit status: ✅ U13 shipped as 0.17.0.**
