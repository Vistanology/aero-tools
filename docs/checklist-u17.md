# Checklist · U17 — Document Workshop (release 0.21.0)

Verification method: real browser (Chromium via browser-use MCP) against `http://127.0.0.1:8735`, feature checks via
`evaluate_script`, IndexedDB round-trips, a `VT.utils.downloadText` stub to capture exports, a `VT.ui.confirm` stub to
accept deletions, a patched `iframe.contentWindow.print` spy so Print is proven without opening a real dialog, and
genuine offline proof (dev server killed, `curl` exit 7 / `http=000`, reload, resource `transferSize: 0`).

## Feature battery

| Area | Check | Result | Evidence |
|---|---|---|---|
| Registry | Tool visible, 32 tools, cat documents, icon file | ✅ | `VT.registry.all().length === 32`; `get('document-workshop')` + `modules['document-workshop']` present |
| Mount | stage + editor + preview | ✅ | `.dw-stage` present, `#view` children 3, `.dw-preview` present |
| Default load | 1 section | ✅ | `.dw-sec` = 1, stats "…1 section(s)" |
| Sample | 3 sections render | ✅ | `.dw-sec` = 3, preview 1721 chars, stats "73 words · 459 chars · 3 section(s)" |
| Markdown — headings | `##`→h2, `#`→capped h3–h6 | ✅ | 5 headings, 3 `.dw-sec-h` |
| Markdown — inline | `**bold**`, `` `code` `` | ✅ | strong = 1, inline `<code>` = 1 |
| Markdown — fenced | ``` ``` block | ✅ | `pre.dw-pre code` present |
| Markdown — blockquote | `>` | ✅ | blockquote present |
| Markdown — lists | ul / ol | ✅ | ul = 2, ol = 1 |
| Markdown — rule | `---` → `<hr>` | ✅ | injected test body → `<hr>` count 1 |
| Markdown — task list | `- [ ]` / `- [x]` | ✅ | 3 `li.dw-task` with **real** `.dw-cb` spans (3), 2 `.dw-cb.on` |
| TOC | 2+ sections → nav with anchors | ✅ | 3 `.dw-toc` links to `#dw-sec-<id>` |
| Links safe | `https://` kept, `javascript:` dropped | ✅ | sample link → `rel="noopener noreferrer" target="_blank"`; `javascript:` body → no `javascript:` href in output |
| Add section | composer creates a section | ✅ | count 3 → 4 |
| Reorder section | ◀/▶ move | ✅ | order changed (heads array reorders, end buttons disabled) |
| Delete section | confirm then remove | ✅ | confirm stubbed true → 4 → 3 |
| Undo/redo (buttons) | whole-doc walk | ✅ | after one op Undo enabled; button-undo 4→3, redo 3→4 |
| Autosave | writes `dw:autosave` (tool 'document-workshop') | ✅ | IDB record contains unique marker after debounce (~1.5 s) |
| Restore | reload reopens autosaved doc | ✅ | marker text + 4 sections + `split` mode restored |
| Named projects | save adds row, autosave excluded | ✅ | list row "MyProj", `db.list('document-workshop')` named = 1 |
| Export HTML | standalone file | ✅ | stub captured `Quarterly_Report.html` `text/html`, contains `<!doctype html>` (3508 bytes) |
| Export Markdown | `#`-rooted source | ✅ | stub captured `Quarterly_Report.md` `text/markdown`, starts with `# ` (335 bytes) |
| Print | hidden iframe built + `print()` fired | ✅ | iframe `print` spy called 1×; built document has a **doctype** + the rendered sections |
| Security | no eval / no raw HTML | ✅ | `<img onerror>`/`<script>` body renders as escaped text; `window.__pwned` stays `undefined` |
| Modes | Write / Split / Preview | ✅ | `stage[data-mode]=preview`; `.dw-preview` shown, `.dw-editor` hidden |
| i18n | EN + PT for `dw.*` | ✅ | "New" ↔ "Novo" via `t()`; both dicts registered |
| Mobile | ≤980px stacks work grid | ✅ | `@media 980px` `.dw-work { grid-template-columns: 1fr }` |
| Aesthetics | tokens (`--glass-2`, `--cyan`, `--void`, `--ok`) | ✅ | `css/apps.css` `dw-*` block |
| Offline | shell + tool + autosave, no network | ✅ | server killed (`curl` exit 7) → nav + **all 62 resources** incl. fixed `document-workshop.js` `transferSize: 0`; 4 sections rendered; autosave restored |
| Console | 0 errors / 0 warnings | ✅ | `list_console_messages(['error','warn'])` clean (whole session) |
| Regression | cross-tool mount after wiring | ✅ | kanban / notes / data-workspace / json-formatter / qr-studio / svg-editor / image-studio each mount (3 children); hub renders; 32 tools |

## Bugs found and fixed during verification

| Symptom | Root cause | Fix + re-verify |
|---|---|---|
| Nothing rendered — default and Sample both showed 0 sections; New/Sample did nothing | `recSoon()`, `flushSave()` and `applyDoc()` read a `saveTimer` variable that was never declared, so `applyDoc()` threw `ReferenceError` before assigning `doc`. (Console showed no message because the throw happened inside a click handler on a freshly reloaded page.) | Added `let saveTimer = null;` to the module state. Re-verified: default 1 section, Sample 3 sections, stats correct. |
| Task-list checkboxes appeared as literal text `<span class="dw-cb on">…` | The freshly-built checkbox `<span>` was fed back through `inline()`, which escapes HTML — so it rendered inert. | Emit the `<span>` raw and only pass `tk[2]` through `inline()`. Re-verified: 3 real `.dw-cb` spans (2 `.on`), clean `li` text. |
| Undo/Redo buttons stayed disabled after edits (same class as the Kanban bug) | `record()` grew the history stack but didn't call `syncHist()`; a `disabled` `<button>` swallows its click, so the first Undo did nothing. | `record()` now calls `syncHist()` after `hist.record(...)`. Re-verified: button-undo 4→3, redo 3→4. |

## Notes

- **Stale Service-Worker cache trap (recurred here):** after editing the precached `document-workshop.js`, the running
  page still executed the old module even though `fetch(...,{cache:'no-store'})` showed the new bytes. The reliable
  procedure used between every fix: `caches.delete` all keys → `navigator.serviceWorker.getRegistration().unregister()`
  → navigate to a **fresh cache-buster URL** → confirm the served module reflects the change *and* the behavior is
  correct before trusting a test result.
- **Autosave timing:** the first autosave probe read too early (debounce 600 ms + async IndexedDB write). Re-reading
  after ~1.5 s confirmed `dw:autosave` present with the marker. Not a bug — documented as a timing note.
- **Print** is proven through a patched `iframe.contentWindow.print` spy, so no native print dialog was opened during
  the automated run; the spy asserts the hidden iframe was built with a real doctype and the rendered document.
- Screenshot `docs/shots/document-workshop-preview.png` is **pending**: the in-app Browser surface reports
  `visibilityState: hidden` in this environment (same limitation recorded for Kanban), and the harness refuses a
  screenshot for a hidden surface rather than fabricate pixels. Structural + computed-style evidence above stands in
  its place.

## Consolidation 0.21.0

| Item | Result |
|---|---|
| `js/app.js` `VT.version` | 0.21.0 |
| `js/core/registry.js` `VT.releases` | 21 entries, new 0.21.0 (EN+PT, 3 bullets each) |
| `sw.js` VERSION | v38 → v39 (added `document-workshop` to APPS) → v40 (0.21.0 shell refresh); APPS = 32 entries |
| `index.html` | `document-workshop.js` script tag after `kanban.js` |
| `css/apps.css` | full `dw-*` block appended |
| `CHANGELOG.md` | [0.21.0] section (Added + three Fixes + Verified) |
| `README.md` | status → 32 tools; Documents category row + Document Workshop entry; +U17 verified header/checklist link/bullet |
| `docs/VISION.md` | §4 U17 ✅ 0.21.0 (32ª), §6 next unit |
| Docs | `docs/document-workshop.md`, `docs/checklist-u17.md` |
| Regression | version 0.21.0, 32 tools, 21 releases, SW v40, document-workshop mounts, cross-tool `#view` regression clean, console clean |
| Offline regression | server killed → `curl` exit 7, nav + 62 resources `transferSize: 0`, tool from cache, autosave restored |

**Unit status: ✅ U17 shipped as 0.21.0 — the 32nd tool and the first to fill the Documents category. The 31-tool
roadmap target is met and exceeded.**
