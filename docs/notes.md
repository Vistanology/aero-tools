# Notes Workspace · U15 (v0.19.0)

The flagship local-first Markdown notes bench. Keep many named notes in IndexedDB, write them in Markdown and
watch a safe live preview, search and filter by tag, undo/redo the body, autosave every note and reopen where you
left off — entirely in the browser, offline-capable. The preview is built by an escape-all-then-format pipeline, so
**untrusted text can never become markup or script**.

## What it does

- **Many named notes** — each note is `{ id, tool:'notes', title, tags[], body, createdAt, updatedAt }` stored in
  IndexedDB. The sidebar lists them newest-first with a title, a stripped snippet and a localized timestamp.
- **Safe live preview** — a split editor/preview layout renders Markdown through `md()`: headings, bold/italic/
  strike, inline and fenced code, links, ordered/unordered nested lists, blockquotes, rules and paragraphs.
- **Search & tag filter** — full-text search across title/body/tags, plus clickable tag chips that filter the list
  (click again to clear).
- **View modes** — Write (editor only), Split (editor + preview) and Preview (rendered only).
- **History** — undo/redo over the note body via `VT.history` (Ctrl+Z / Ctrl+Shift+Z); typing bursts coalesce.
- **Autosave + session restore** — every note autosaves on a 600 ms debounce and your last note + view reopen on
  return. Crucially, edits are **flushed** the moment you switch notes, create a new note, or leave the tool, so
  nothing is ever lost inside the debounce window.
- **Export** — Copy Markdown, Copy HTML (the rendered output) and Download the note as a `.md` file (the filename
  is sanitized to word characters).

## Why the preview is safe

`inline()` extracts code spans into placeholders, then HTML-escapes the **whole** line before applying any
formatting, and only re-injects the code spans (themselves escaped) at the end. There is no raw-HTML passthrough.
`safeUrl()` keeps only `http/https/mailto/#` protocols; anything else (e.g. `javascript:`) is dropped to plain
text. Remote images are rendered as safe links rather than embedded, so the preview never makes a network request.
A pasted `<script>` or `<img onerror>` therefore renders as inert text — verified in the browser (0 `<script>` /
`<img>` elements in the preview, a sentinel `window._pwn` is never set).

## Architecture

- `js/apps/notes.js` — an IIFE that registers a `def` with `VT.registry.add` and exposes its module at
  `VT.modules['notes']`.
- `def` shape: `{ id:'notes', cat:'productivity', icon:'target', version:'0.1.0', name, tagline, tags,
  deps:[], docs:{en,pt}, mount, unmount }`. `mount(root)` returns a cleanup closure that flushes any pending edit;
  `unmount()` flushes and clears state.
- Uses `VT.utils` (`$`, `$$`, `esc`, `debounce`, `copyText`, `downloadText`), `VT.store` (session), `VT.db`
  (notes), `VT.history`, `VT.i18n`, `VT.icons`, `VT.ui.toast` and `VT.ui.confirm` (delete).
- Styles: the `nt-*` block in `css/apps.css`, built from the shared design tokens; the rendered Markdown is styled
  under `.nt-preview`.

## Offline

Precached by the Service Worker (shell `v36`). Verified with the dev server stopped: navigation, `notes.js` and
`apps.css` all report `transferSize: 0`, and the tool mounts from cache — no network.
