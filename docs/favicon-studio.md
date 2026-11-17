# Favicon & Icon Studio · U13 (v0.17.0)

The flagship local favicon / app-icon generator. Feed it a raster image or a short text/emoji
monogram, style it, and it renders the whole standard icon set — 16, 32, 48, 64, 128, 180, 192, 512
— from a single shared draw routine, then exports the PNGs plus a ready-to-use `site.webmanifest`.
Everything happens in the browser; nothing is uploaded, and it runs offline.

## What it does

- **Two sources** — a *monogram* (text / emoji, up to 4 chars, with adjustable glyph size and
  foreground color) or an *image* (file picker, drag-and-drop, or clipboard paste). An imported
  image is downscaled to ≤512 px and kept only in memory.
- **One render path** — `renderIcon(size)` is the single routine used for the live preview grid
  **and** for every export, at the true pixel dimensions. What you see in the grid is byte-for-byte
  the drawing logic you download.
- **Background** — solid, gradient (start + end color) or transparent.
- **Shape** — square, rounded (with a corner-radius slider) or circle, plus a padding slider that
  insets the source/monogram.
- **Live grid** — all eight sizes rendered at real dimensions (capped at 128 px on screen for
  layout), each with its `W×H` label and an individual **Download** button.
- **Export** — single size, or **Export all PNGs** (staggered so the browser doesn't drop the
  batch), plus a generated **`site.webmanifest`** you can copy to the clipboard or download.
- **History** — undo/redo carries **only the option state** (`optsCanonical`), never the source
  image, so memory stays bounded and the image is preserved across edits.
- **Persistence** — the design autosaves to `localStorage` (options) and to IndexedDB
  (`fs:autosave`, options + downscaled image) and is restored on return with a hint. **Named
  presets** save/open from the side panel (the autosave row is excluded from the list).

## Why the preview equals the export

The grid and every download call the same `renderIcon(size)` with the same `opts`. Shape clipping,
fill (solid / linear gradient / transparent) and source drawing (contain-fit, image) or text metrics
(centered monogram) are computed from the `size` argument, so there is no separate "preview vs.
production" code path that could drift. The generated manifest sets `background_color`/`theme_color`
from the chosen fill, falling back sensibly for the transparent mode.

## Security model

- No `eval`, no scripts, no external assets. The image never leaves the device.
- The image source is only ever decoded into a canvas and re-encoded as PNG — never inserted as HTML.
- The manifest is produced from validated fields (app name, sizes) via `JSON.stringify`, not string
  concatenation, so a crafted name cannot break the JSON.
- Autosave/presets live on-device (IndexedDB / localStorage).

## Architecture

- `js/apps/favicon-studio.js` — an IIFE that registers a `def` with `VT.registry.add` and exposes its
  module at `VT.modules['favicon-studio']`.
- `def` shape: `{ id:'favicon-studio', cat:'generators', icon:'palette', version:'0.1.0', name,
  tagline, tags, deps:[], docs:{en,pt}, mount, unmount }`. `mount(root)` returns a cleanup closure;
  `unmount()` clears state.
- Uses `VT.utils` (`loadImage`, `readFileAsDataURL`, `downloadBlob`, `downloadText`, `copyText`,
  `debounce`, `esc`), `VT.store`, `VT.db`, `VT.history`, `VT.i18n`, `VT.icons`, `VT.ui.toast`.
- Styles: the `fs-*` block in `css/apps.css`, built from the shared design tokens.

## Offline

Precached by the Service Worker (shell `v33`). Verified with the dev server stopped: navigation,
`favicon-studio.js` and `apps.css` all report `transferSize: 0`, the tool mounts from cache, and the
last icon set is restored — no network.
