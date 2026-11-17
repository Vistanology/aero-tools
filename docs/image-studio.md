# Image Studio · U12 (v0.16.0)

The flagship non-destructive local image editor. Load an image, edit it with transforms and
a CSS-filter stack, compare against the original, and export at full resolution — entirely in
the browser, offline-capable. The original pixels are never overwritten.

## What it does

- **Load** — file picker, drag-and-drop onto the dropzone, clipboard paste, or a built-in
  generated sample (a starfield gradient). The image is decoded once into an offscreen canvas
  at its natural size.
- **Transform** — rotate ±90°, flip horizontal/vertical, and center-crop by aspect ratio
  (free / 1:1 / 4:3 / 3:2 / 16:9). A dashed cyan crop overlay is drawn on the preview.
- **Adjust** — a CSS-filter stack: brightness, contrast, saturation, hue-rotate, grayscale,
  sepia and blur, each a live slider. **Reset edits** restores defaults (keeping the chosen
  export format/quality).
- **Compare** — toggles the preview to the untouched original (filter `none`) for A/B review.
- **History** — undo/redo carries **only the small edit state**, not the pixels, so memory
  stays bounded regardless of image size.
- **Persistence** — the working edit autosaves to IndexedDB (`is:autosave`) as a downscaled
  JPEG thumbnail + the edit params, and is restored on return with a hint. **Named projects**
  save/open from the side panel (autosave excluded from the list).
- **Export** — re-renders the **full-resolution** frame with the same filter string and
  downloads PNG / JPEG / WebP (quality slider for lossy formats).

## Why "non-destructive"

Every edit is a parameter (`edit` object) applied at draw time via `ctx.filter`, `ctx.rotate`
and `ctx.scale`. The decoded source canvas is never mutated, so undo/redo, compare and export
all re-derive from the pristine source. The live preview and the export share `filterString()`
and `computeDims()`, so **what you see is what you download**.

## Verification highlights (real browser)

- Grayscale 100% → the exported center pixel has **R = G = B** (filter genuinely applied).
- Rotate ±90 → output dimensions swap (800×600 → 600×800).
- Crop 1:1 → exported PNG decodes to **600×600**, matching the computed full-res dims.
- JPEG export honors the quality slider (`image/jpeg`, smaller than PNG).

## Security model

- No `eval`, no scripts, no external assets. The image never leaves the device.
- Imported image data is only ever drawn into a canvas and re-encoded — never inserted as HTML.
- Autosave/project storage is on-device IndexedDB.

## Architecture

- `js/apps/image-studio.js` — an IIFE that registers a `def` with `VT.registry.add` and exposes
  its module at `VT.modules['image-studio']`.
- `def` shape: `{ id, cat:'media', icon:'image', version:'0.1.0', name, tagline, tags, deps:[],
  docs:{en,pt}, mount, unmount }`. `mount(root)` returns a cleanup closure; `unmount()` clears state.
- Uses `VT.utils` (`loadImage`, `readFileAsDataURL`, `downloadBlob`, `debounce`, `esc`), `VT.store`,
  `VT.db`, `VT.history`, `VT.i18n`, `VT.icons`, `VT.ui.toast`.
- Styles: `is-*` block in `css/apps.css`, built from the shared design tokens.

## Offline

Precached by the Service Worker (shell `v31`). Verified with the dev server stopped: navigation,
`image-studio.js` and `apps.css` all report `transferSize: 0`, the tool mounts from cache and the
last edit is restored — no network.
