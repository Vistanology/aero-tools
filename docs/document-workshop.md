# Document Workshop · U17 (v0.21.0)

The local-first, print-ready document bench — the first tool in the **Documents** category. Compose a document as an
ordered list of sections written in safe Markdown, under a cover header (title, author, date), with an automatic table
of contents, a serif/sans theme and an adjustable font size. Preview live, undo/redo the whole document, autosave to
your device and reopen where you left off, keep several named projects, then export a standalone printable HTML or
plain Markdown, or send it straight to the browser print dialog. The document you edit is the exact data model that
saves, exports and prints — no hidden server state, nothing uploaded, no `eval`.

## What it does

- **Sections** — each section has a heading (an inline input) and a body (a Markdown textarea). Add a section, move it
  up/down and delete it (behind a confirmation). Auto headings inside a body are capped to `h3`–`h6` so they nest
  under each section's `h2`.
- **Cover header** — a document title, optional author and date, a serif/sans theme and a 80–160% font size, all
  reflected in the live preview and in every export/print.
- **Automatic table of contents** — when the document has 2+ sections a `<nav class="dw-toc">` lists each section as a
  link to its `#dw-sec-<id>` anchor.
- **Safe Markdown** — headings, **bold** / *italic* / ~~strike~~, inline `code` and fenced ``` blocks, links,
  ordered/unordered lists, task lists (`- [ ]` / `- [x]` rendered as real checkboxes), blockquotes and `---` rules.
  The parser escapes **everything first** and only then applies formatting, so user text can never inject markup.
- **Modes** — Write / Split / Preview collapse the editor/preview panes via `stage[data-mode]`; the choice is stored
  in `VT.store` and restored on return.
- **History** — undo/redo over the whole document with the shared `VT.history` framework: each structural change
  records a canonical JSON snapshot, typing in a body/heading or meta field is coalesced with a 500 ms debounce, and
  Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y work when focus is not in a text field. The Undo/Redo buttons track the stack.
- **Persistence** — the document autosaves to IndexedDB (`dw:autosave`) and is restored on return; **named projects**
  save/open from the side panel (the autosave row is excluded from the list, which is sorted newest-first). Edits are
  flushed the moment you switch documents or leave the tool so nothing is lost to the debounce window.
- **Export & print** — export a standalone printable HTML (a full `<!doctype html>` with the stylesheet inlined and a
  `@media print` block), export the source as Markdown, or print through a same-document hidden iframe built from your
  own escaped markup (Save-as-PDF lives in the browser dialog).

## Why the document is safe

The document is a plain data model (`{ meta:{ title, author, date, theme, size }, sections:[{ id, heading, body }] }`).
Every string passes through `esc()` and the Markdown renderer escapes the full text before inserting any formatting.
Links keep only `http(s):`, `mailto:` and `#` protocols — a `javascript:` URL is dropped and the text rendered inert.
There is no `eval`, no raw-HTML passthrough and no network call. A pasted `<img src=x onerror=…>` or `<script>` shows
up as literal text and never runs.

## Architecture

- `js/apps/document-workshop.js` — an IIFE that registers a `def` with `VT.registry.add` and exposes its module at
  `VT.modules['document-workshop']`.
- `def` shape: `{ id:'document-workshop', cat:'documents', icon:'file', version:'0.1.0', name, tagline, tags,
  deps:[], docs:{en,pt}, mount, unmount }`. `mount(root)` returns a cleanup closure that flushes the save and marks the
  instance dead; `unmount()` clears `hist`/`autosave`/`refs`/`doc`.
- Uses `VT.utils` (`$`, `$$`, `esc`, `debounce`, `downloadText`), `VT.store`, `VT.db` (`put`/`get`/`list`/`remove` +
  `uid`), `VT.history`, `VT.i18n`, `VT.icons`, `VT.ui.confirm`/`toast`.
- Styles: the `dw-*` block in `css/apps.css`, built from the shared design tokens (`--glass-2`, `--cyan`, `--void`,
  `--line`, `--ok`, `--r-*`). The preview "paper" and the exported/printed document share the same `DOC_STYLE` so the
  on-screen preview matches the file you export or print.

## Offline

Precached by the Service Worker (shell `v40`; `document-workshop` is in the APPS list). Verified with the dev server
stopped (`curl` exit 7 / `http=000`): navigation and every resource report `transferSize: 0`, the tool mounts from
cache, and the last document (sections, mode) is restored from IndexedDB — no network. See
[docs/checklist-u17.md](checklist-u17.md) for the evidence table.
