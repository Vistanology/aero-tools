# Checklist · U16 — Kanban Board (release 0.20.0)

Increment-by-increment verification. Method: real browser (Chromium via browser-use MCP) against
`http://localhost:8735`, feature checks via `evaluate_script`, synthetic `PointerEvent` dispatch on cards and
columns, IndexedDB round-trips, a `VT.utils.downloadText` stub to capture exports, a `VT.ui.confirm` stub to accept
deletions, and genuine offline proof (dev server killed, `curl` exit 7 / `http=000`, reload, resource `transferSize: 0`).

## Increment 1 — Board, columns, cards, drag, history, persistence, export

| Area | Check | Result | Evidence |
|---|---|---|---|
| Registry | Tool visible, 31 tools, cat productivity, icon layers | ✅ | `VT.registry.all().length === 31`; `get('kanban')` + `modules['kanban']` present |
| Mount | stage + 3 default columns + composer per column | ✅ | `#view .kb-stage` present; `.kb-col` = 3; `.kb-add-card` = 3; view children 3 |
| Sample | loads 3 columns with 2/1/1 cards | ✅ | `[{To do:2},{In progress:1},{Done:1}]` |
| Add column | creates a 4th column | ✅ | col count 3 → **4** |
| Rename column | inline header input updates title | ✅ | typed title persists in data + re-render |
| Move column | ◀/▶ reorder | ✅ | column order changes (left/right disabled at ends) |
| Add card | composer Enter appends card | ✅ | col0 cards 2 → 3, last title "Manual card" |
| Drag between columns | ghost + placeholder, source hides | ✅ | card "Design the empty state" *To do → In progress*; ghost=1 placeholder=1 during, 0/0 after |
| Reorder within column | drops at pointer position | ✅ | insertion index computed from card midpoints |
| Card edit (panel) | select card → edit title live | ✅ | title became "Write the docs EDITED" on card + board |
| Toggle done | checkbox marks done + styling | ✅ | `.is-done` true |
| Delete card | × removes it | ✅ | card gone from column |
| Undo/redo whole board | column count walks back/forward | ✅ | adds→4/5/6, undo→5/4/3, redo→4/5; buttons enable/disable with stack |
| Undo of a drag | reverses the move | ✅ | In progress → (undo) To do → (redo) In progress |
| Search | dims non-matching cards | ✅ | query "EDITED": dimmed 5, not-dimmed 1 |
| Autosave | writes `kanban:autosave` (tool 'kanban') | ✅ | IDB record contains a unique marker card after debounce |
| Restore | reload reopens autosaved board | ✅ | marker card + 5 columns present after reload |
| Named projects | save adds row, autosave excluded | ✅ | list row "Proj A", `db.list('kanban')` = 2, no "(autosave)" row |
| Project open | restores saved board | ✅ | open "Proj A" → 5 columns incl. marker |
| Export JSON | serialized board | ✅ | stub captured `My_board.json` `application/json` (1566 bytes) |
| Export Markdown | columns as `##`, cards as task items | ✅ | stub captured `My_board.md` `text/markdown` (356 bytes) |
| Delete column | confirm then remove | ✅ | confirm stubbed true → 5 → 4 columns |
| Security | no eval / no raw HTML | ✅ | `<img src=x onerror="window.__pwned=true">` renders as text; 0 image tag in card title; `window.__pwned` false |
| i18n | EN + PT for `kb.*` | ✅ | "Add column" ↔ "Adicionar coluna"; PT renders on remount |
| Aesthetics | tokens (`--glass-2`, `--cyan`, `--ok`, `--r-*`) | ✅ | `css/apps.css` `kb-*`; card bg `rgba(13,36,56,.68)` = `--glass-2` |
| Mobile | work columns stack at ≤980px | ✅ | `@media 980px` `.kb-work { grid-template-columns: 1fr }` |
| Offline | shell + tool + autosave, no network | ✅ | server killed → nav + `kanban.js` + `apps.css` + `app.js` `transferSize: 0`; board restored (3 cols/4 cards); 31 tools |
| Console | 0 errors / 0 warnings | ✅ | `list_console_messages(['error','warn'])` clean (whole session) |
| Regression | cross-tool mount after wiring | ✅ | notes / svg-editor / page-builder / kanban each mount; library lists 31 tools |

## Bugs found and fixed during verification

| Bug | Root cause | Fix |
|---|---|---|
| Undo/Redo did nothing; buttons stuck disabled after edits | The shared history stack grew correctly, but `syncHist()` (which flips the buttons' `disabled`) was only called on undo/redo/apply/reset. A `disabled` `<button>` swallows its click, so the first Undo press never reached `hist.undo()`. Verified the stack itself was fine by probing `VT.history` in isolation. | `record()` now calls `syncHist()` after `hist.record(...)` so the buttons reflect the stack after every change. Re-verified: 3 add-columns enable Undo, 3 undos walk count back and disable it, redos restore, and a drag is undoable. |
| Autosave appeared to miss a marker | Test artifact, not a bug: the read happened before the debounced async IDB `put` resolved. | Re-read after the write settled — `kb:autosave` contained the marker; documented as a timing note. |

## Notes

- Column **titles are user data**: after creating a board in EN, its saved column names stay EN even when the UI
  language is switched to PT (only freshly created default boards localize). This is correct — the model stores the
  names the user typed, not chrome strings.
- Screenshot `docs/shots/kanban-preview.png` is pending: the in-app Browser surface was not focusable at capture time
  (`visibilityState: hidden`), and the harness refuses a screenshot for a hidden surface rather than fabricate pixels.
  Structural + token evidence above stands in its place.

## Consolidation 0.20.0

| Item | Result |
|---|---|
| `js/app.js` `VT.version` | 0.20.0 |
| `js/core/registry.js` `VT.releases` | 20 entries, new 0.20.0 (EN+PT 3 bullets) |
| `sw.js` VERSION | v36 → v37 (add `kanban`) → v38 (0.20.0 shell refresh); APPS includes `…`, `notes`, `kanban` (31 entries) |
| `index.html` | `kanban.js` script tag added after `notes.js` |
| `css/apps.css` | full `kb-*` block appended |
| Regression | version 0.20.0, 31 tools, 20 releases, SW v38, kanban mounts, cross-tool `#view` regression clean |
| Offline regression | server killed → `curl` exit 7, transferSize 0, tool from cache, board restored |
| `CHANGELOG.md` | [0.20.0] section added (incl. the disabled-button fix) |
| `README.md` | 31/31, Kanban Board entry + Productivity row, +U16 header/checklist link/verified bullet |
| `docs/VISION.md` | §4 U16 ✅ 0.20.0 (31ª), §6 next = U17 Document Workshop (Documents) |
| Docs | `docs/kanban.md`, `docs/checklist-u16.md` |

**Unit status: ✅ U16 shipped as 0.20.0 — the 31st and final tool of the 31-tool roadmap target.**
