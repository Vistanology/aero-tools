# Diagram Studio · U18 (v0.22.0)

The local-first SVG flowchart bench — the 33rd tool. Author typed nodes, connect them with orthogonal arrow edges in a
two-step Link flow, and drag them on a grid-snapping canvas. Edit the selection in a live inspector, undo/redo the whole
diagram, autosave to your device and reopen where you left off, keep several named projects, then export clean SVG
markup or a 2× rasterized PNG. The diagram you edit is the exact data model that saves and exports — no hidden server
state, nothing uploaded, no `eval`.

## What it does

- **Typed nodes** — add a **rectangle**, **diamond**, **capsule** or **note**. Each kind carries its own default size and
  fill/stroke (`KIND_STYLE`); you can switch a selected node's kind from the inspector and it keeps its position.
- **Orthogonal arrow edges** — connect two nodes with the **Link** flow: select a source, press **Link** (the source
  gets a dashed "linking" ring), then click a target. Edges render as axis-aligned elbow paths capped with an arrow
  marker. Self-links are refused and duplicate edges are ignored.
- **Drag on a snapping canvas** — drag any node with the pointer (mouse / touch / pen). Positions snap to an 8px grid
  inside a 24px visual grid and clamp to the canvas bounds; connected edges re-flow live.
- **Live inspector** — click a **node** to edit its label, width, height, fill and stroke, or change its kind; click an
  **edge** to edit its label. Every change reflects on the canvas immediately.
- **Canvas controls** — edit the diagram name and the canvas width/height and toggle the grid and snap on/off.
- **History** — undo/redo over the whole diagram with the shared `VT.history` framework: every structural change
  (add, delete, link, drag, inspector edit, canvas change) records a canonical JSON snapshot, and Ctrl+Z /
  Ctrl+Shift+Z / Ctrl+Y work when focus is not in a text field. Undo/redo restores the entire diagram, including drags.
- **Persistence** — the diagram autosaves to IndexedDB (`ds:autosave`) and is restored on return; **named projects**
  save/open from the side panel (the autosave row is excluded from the list, sorted newest-first). Edits are flushed the
  moment you switch documents or leave the tool so nothing is lost to the 600ms debounce window.
- **Export** — a clean standalone **SVG** built from the same validated model, or a **2× PNG** rasterized from that SVG
  onto a `<canvas>` (720×480 → 1440×960) via a data-URL image. No external libraries.

## Why the diagram is safe

The diagram is a plain data model
(`{ name, canvas:{ w, h, bg, grid, snap }, nodes:[{ id, kind, label, x, y, w, h, fill, stroke }], edges:[{ id, from, to, label }] }`).
Labels are rendered as **SVG `<text>` content**, never markup, so they are inert on the live canvas by construction. The
exported SVG string runs every label, fill and stroke through `esc()`, so a pasted `<img src=x onerror=…>` or `<script>`
comes out as `&lt;img …&gt;` / `&lt;script&gt;` in the saved `.svg`. There is no `eval`, no raw-HTML passthrough and no
network call.

## Architecture

- `js/apps/diagram-studio.js` — an IIFE that registers a `def` with `VT.registry.add` and exposes its module at
  `VT.modules['diagram-studio']` (the IIFE `return def;` is required — without it the handle is `undefined`).
- `def` shape: `{ id:'diagram-studio', cat:'creative', icon:'branch', version:'0.1.0', name, tagline, tags,
  deps:[], docs:{en,pt}, mount, unmount }`. `mount(root)` returns a cleanup closure that removes the `vt:lang` listener,
  flushes the save and marks the instance dead; `unmount()` clears `hist`/`autosave`/`refs`/`doc`/selection.
- Uses `VT.utils` (`$`, `$$`, `esc`, `clamp`, `debounce`, `downloadText`, `downloadBlob`), `VT.store`, `VT.db`
  (`put`/`get`/`list`/`remove` + `uid`), `VT.history`, `VT.i18n`, `VT.icons`, `VT.ui.confirm`/`toast`.
- Pointer → SVG coordinates go through `refs.svg.createSVGPoint()` + `getScreenCTM().inverse()`, so dragging is correct
  regardless of the responsive scale of the `<svg>`.
- Styles: the `ds-*` block in `css/apps.css`, built from the shared design tokens (`--glass-1/2`, `--cyan`, `--void`,
  `--line`, `--dim`, `--font-ui`, `--r-*`). The workspace is a `1fr 300px` grid that collapses to a single column under
  980px, and the canvas sets `touch-action: none` so pointer dragging works on touch.

## Offline

Precached by the Service Worker (shell `v41`; `diagram-studio` is in the APPS list). Verified with the dev server
stopped (`curl` exit 7 / `http=000`): navigation and every resource report `transferSize: 0` with zero network bytes,
and the tool mounts from cache and renders its Sample — no network. See [docs/checklist-u18.md](checklist-u18.md) for
the evidence table.
