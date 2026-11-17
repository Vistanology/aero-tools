# SVG Editor · U14 (v0.18.0)

The flagship visual vector bench. Place primitive shapes on a live SVG canvas, move/resize/rotate them
directly, style each one, reorder layers, undo/redo the whole document, and export clean SVG markup or a
crisp PNG — entirely in the browser, offline-capable. The canvas and the export are produced from the
same document model, so **what you edit is exactly what you download**.

## What it does

- **Primitives** — rectangle, ellipse, line, triangle and star. Each shape is stored as a center + size +
  rotation, which keeps move/resize/rotate math uniform across every type.
- **Direct manipulation** — pointer-drag the body to move, the four corner handles to resize (anchored to
  the opposite corner and correct under rotation), and the top handle to rotate around the center. Arrow
  keys nudge (Shift = one grid step). A snap-to-grid toggle rounds positions and sizes.
- **Styling** — per-shape fill, stroke, stroke width, opacity and corner radius; canvas width/height, a
  background color and a transparent-background toggle.
- **Layers** — a top-first list: click to select, ▲/▼ to bring forward / send backward, the eye to show or
  hide, plus Duplicate and Delete.
- **History** — undo/redo over the whole document (a single canonical snapshot), so a stray drag or delete
  is always recoverable.
- **Persistence** — the document autosaves to IndexedDB (`se:autosave`) and is restored on return, along
  with canvas size and background. **Named projects** save/open from the side panel (the autosave row is
  excluded from the list).
- **Export** — Copy SVG / Download SVG (clean markup with `xmlns` and per-shape transforms) and Download
  PNG at 1×/2×/4×, rasterized locally from the same markup.

## Why the canvas equals the export

Both are derived from `doc` through one geometry function, `shapeGeometry(shape)`. The on-screen `<svg>`
and `serializeSVG()` emit the identical tag, attributes and `rotate(deg cx cy)` transform for each shape,
so there is no "preview vs. production" path that could drift. PNG export feeds that same serialized markup
through an `Image` → canvas → `toBlob`, which is why a pixel check on the exported PNG matches the styled
shape exactly.

## Security model

- No `eval`, no scripts, no external assets. The document is a plain data model; shapes are built with
  `createElementNS` and attribute setting, never innerHTML of user text.
- Nothing is uploaded; projects and autosave live on-device (IndexedDB / localStorage).
- The exported SVG is assembled from validated numeric geometry and color-picker values.

## Architecture

- `js/apps/svg-editor.js` — an IIFE that registers a `def` with `VT.registry.add` and exposes its module at
  `VT.modules['svg-editor']`.
- `def` shape: `{ id:'svg-editor', cat:'creative', icon:'layers', version:'0.1.0', name, tagline, tags,
  deps:[], docs:{en,pt}, mount, unmount }`. `mount(root)` returns a cleanup closure; `unmount()` clears state
  and removes the window resize listener.
- Uses `VT.utils` (`downloadText`, `downloadBlob`, `copyText`, `debounce`, `esc`), `VT.store`, `VT.db`,
  `VT.history`, `VT.i18n`, `VT.icons`, `VT.ui.toast`.
- Styles: the `se-*` block in `css/apps.css`, built from the shared design tokens.

## Offline

Precached by the Service Worker (shell `v34`). Verified with the dev server stopped: navigation,
`svg-editor.js` and `apps.css` all report `transferSize: 0`, the tool mounts from cache, and the last
document (including the sample scene) is restored — no network.
