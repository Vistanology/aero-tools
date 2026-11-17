# Kanban Board · U16 (v0.20.0)

The local-first task board. Build columns, add cards, and drag them between columns (or reorder them in place) on a
live board that autosaves to your device. Edit each card in a side panel, undo/redo the whole board, keep several
named projects, filter by search and export as JSON or Markdown. The board you manipulate is the exact data model that
saves and exports — no hidden server state, nothing uploaded.

## What it does

- **Columns** — add a column, rename it inline (the header is an input), move it left/right and delete it (behind a
  confirmation). Empty columns show a placeholder and still accept dropped cards.
- **Cards** — add a card with a per-column composer (Enter to add, Shift+Enter for a new line), toggle it **done**
  (a checkbox + strikethrough styling), delete it, or open it in the side panel to edit **title, description, tags**
  (comma-separated) and the done flag.
- **Drag & drop** — pointer-based, so mouse, touch and pen all work. Dragging a card raises a floating ghost, hides
  the source, and shows a dashed drop placeholder at the target position (across columns and within a column). On
  release the card moves in the data model and the board re-renders.
- **History** — undo/redo over the whole board using the shared `VT.history` framework. Each structural change records
  a canonical JSON snapshot (typing in the panel is coalesced with a 500 ms debounce); the Undo/Redo buttons track the
  stack and Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y work when focus is not in a text field.
- **Persistence** — the board autosaves to IndexedDB (`kanban:autosave`) and is restored on return; **named projects**
  save/open from the side panel (the autosave row is excluded from the list, which is sorted newest-first).
- **Search & export** — the search box dims cards that do not match the query (title/desc/tags). Export the board as
  pretty JSON or as Markdown (columns as `##` headings, cards as task-list items with `#tags`).

## Why the board is safe

The board is a plain data model (`{ name, columns:[{ id, title, cards:[{ id, title, desc, tags[], done }] }] }`).
Column titles are rendered through an `<input>` `value`; card titles, descriptions and tags are set with
`textContent`; the only `innerHTML` writes use `esc()` around interpolated strings (button labels, tooltips). There is
no `eval`, no scripts, no raw-HTML passthrough and no network calls. A pasted `<img src=x onerror=…>` or `<script>` in
a card title renders as inert text.

## Architecture

- `js/apps/kanban.js` — an IIFE that registers a `def` with `VT.registry.add` and exposes its module at
  `VT.modules['kanban']`.
- `def` shape: `{ id:'kanban', cat:'productivity', icon:'layers', version:'0.1.0', name, tagline, tags, deps:[],
  docs:{en,pt}, mount, unmount }`. `mount(root)` returns a cleanup closure; `unmount()` tears down any in-flight drag
  (removing the ghost/placeholder and the `pointermove`/`pointerup` listeners) and clears state.
- Uses `VT.utils` (`$`, `$$`, `esc`, `debounce`, `downloadText`, `copyText`), `VT.store`, `VT.db` (`put`/`get`/`list`/
  `remove` + `uid`), `VT.history`, `VT.i18n`, `VT.icons`, `VT.ui.confirm`/`toast`.
- Styles: the `kb-*` block in `css/apps.css`, built from the shared design tokens (`--glass-1/2`, `--cyan`, `--ok`,
  `--line`, `--r-*`, `--font-display/mono`).

## Offline

Precached by the Service Worker (shell `v38`). Verified with the dev server stopped (`curl` exit 7 / `http=000`):
navigation, `kanban.js`, `apps.css` and `app.js` all report `transferSize: 0`, the tool mounts from cache and the last
board (including the sample scene) is restored from IndexedDB — no network.
