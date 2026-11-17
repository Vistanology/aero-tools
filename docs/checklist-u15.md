# Checklist · U15 — Notes Workspace (release 0.19.0)

Verification. Method: real browser (Chromium via browser-use MCP) against `http://localhost:8735`, feature checks
via `evaluate_script` (synthetic `input` events on the editor fields, direct IndexedDB reads through `VT.db.list`),
`downloadText`/`copyText` stubs to capture exports, a `VT.ui.confirm` stub for delete, full page reloads for session
restore, and a genuine offline proof (dev server killed, `curl` exit 000, navigation/resource `transferSize: 0`).

## Increment 1 — Notes model, safe Markdown preview, search/tags, modes, history, autosave, export, restore

| Area | Check | Result | Evidence |
|---|---|---|---|
| Registry | Tool visible, v0.1.0, cat productivity, icon target | ✅ | `VT.registry.all().length === 30`; `VT.registry.get('notes')` cat `productivity`, docs en+pt |
| Mount | stage + bar + sidebar + editor + preview present | ✅ | `.nt-stage`, `#nt-new`, `#nt-title`, `#nt-body`, `#nt-preview`, 3 `.nt-mode .btn` |
| New note | creates an IndexedDB record, focuses title | ✅ | `#nt-new` → `VT.db.list('notes')` grows, row appears |
| Safe preview — script | pasted `<script>` renders as escaped text, no exec | ✅ | 0 `<script>` in preview; `window._pwn` never set; innerHTML `&lt;script&gt;` |
| Safe preview — img onerror | `<img onerror>` escaped, not embedded | ✅ | 0 `<img>` elements in preview |
| Safe preview — javascript: link | `javascript:alert(1)` link → plain text | ✅ | 0 `javascript:` hrefs; only the `https:` anchor kept (1 anchor) |
| Markdown formatting | h1/h2, strong/em/del, inline+code, nested lists, blockquote | ✅ | `h1`,`h2`,`strong`,`em`,`del`,`code`,`pre.nt-pre`,`blockquote`,`ul` nested all present |
| Undo/redo body | body reverts and re-applies | ✅ | append → undo restores original → redo re-applies |
| Modes | Write hides preview, Preview hides editor | ✅ | write `{e:false,p:true}`, preview `{e:true,p:false}` |
| Search | filters list; no-match shows empty | ✅ | "ide"→3 (guide/ideas match), "zzz"→0 + `.nt-empty`, ""→3 |
| Tag filter | chip filters; re-click clears | ✅ | "guide"→2 rows, clear→3 |
| Copy MD | raw Markdown payload | ✅ | stub captured `## Bloqueado\n\nUm [bo…` |
| Copy HTML | rendered HTML payload | ✅ | stub captured `<h2>Bloqueado</h2>…` |
| Export .md | downloadText with sanitized filename | ✅ | `Seguran_a.md`, `text/markdown`, 140 chars |
| Delete confirm | danger confirm, removes record | ✅ | `VT.ui.confirm` stubbed true → row removed, `.nt-empty` shown, body "Delete … cannot be undone" |
| Autosave (debounce) | edits persist after idle | ✅ | note "D" body `ddd` in `VT.db.list` after 800 ms |
| Session restore | last note + view reopen after reload | ✅ | reload → title "Segurança", mode `write`, preview hidden |

## Bug found and fixed during verification

| Bug | Root cause | Fix |
|---|---|---|
| Rapid note switching or leaving the tool within the 600 ms autosave debounce silently dropped the current note's edits | the old `scheduleSave = debounce(saveCurrent)` retargeted the pending save onto whichever note was `current()` when the timer fired — after a switch that was the *new* (empty) note, so the *outgoing* note's edits were never written | replaced with an explicit `dirty` flag + `saveTimer`; `flushSave()` is now called at the top of `openNote` (when switching), at the top of `newNote`, and in both `unmount()` and the mount cleanup, persisting the outgoing note synchronously before the switch |

Re-verified after the fix: three notes created and edited back-to-back with **no** debounce wait all persist their
title, tags and body in IndexedDB (`Welcome`/`guide`, `Segurança`/`seg,guide`, `Ideias`/`ideas`), and a single note
edited then navigated away from immediately persists its body (`"eee"`).

> Note: an intermediate round of "failures" was traced to a **stale Service Worker cache** serving the pre-fix
> `notes.js`, not to the code. Caches were cleared and the SW unregistered, then re-verified against the freshly
> served file — the fix is genuine.

## Consolidation 0.19.0

| Item | Result |
|---|---|
| `js/app.js` `VT.version` | 0.19.0 |
| `js/core/registry.js` `VT.releases` | 19 entries, new 0.19.0 (EN+PT 3 bullets) |
| `sw.js` VERSION | v35 → v36; APPS includes `…`, `svg-editor`, `notes` (30 entries) |
| `index.html` | `notes.js` script tag added after `svg-editor.js` |
| `css/apps.css` | full `nt-*` block appended (stage/bar/mode/work/side/tag/list/row/editor/preview + rendered Markdown under `.nt-preview` + `@media 980px` stack) |
| Regression | version 0.19.0, 30 tools, 19 releases, SW v36, notes mounts, cross-tool `#view` regression clean (16 tools), console 0 errors/warnings |
| Offline regression | server killed (`curl` exit 000) → navigation + `notes.js` + `apps.css` `transferSize: 0`, tool mounts from cache |
| `CHANGELOG.md` | [0.19.0] section added |
| `README.md` | 30/31, Notes Workspace entry, Productivity row filled, +U15 header/checklist/verified bullets |
| `docs/VISION.md` | §4 U15 ✅ 0.19.0 (30ª), §6 next = U16 Kanban Board |
| Docs | `docs/notes.md`, `docs/checklist-u15.md`, `docs/shots/notes-preview.png`, `docs/shots/notes-split.png` |

**Unit status: ✅ U15 shipped as 0.19.0.**
