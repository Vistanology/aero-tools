# Checklist · U11 — Component Builder (release 0.15.0)

Increment-by-increment verification. Method: real browser (Chromium via browser-use MCP) against
`http://localhost:8735`, feature checks via `evaluate_script`, IndexedDB round-trips, and genuine offline proof
(dev server killed, `curl` exit 000, navigation/resource `transferSize: 0`).

## Increment 1 — Typed props model, live preview, esc safety, history, persistence, export

| Area | Check | Result | Evidence |
|---|---|---|---|
| Registry | Tool visible, v0.1.0, cat creative, icon layers | ✅ | `VT.registry.all().length === 26`; home card renders |
| Mount | 4 type chips + 6 control rows + live preview + HTML/CSS panes | ✅ | `#cb-stage` present; Button default renders `cb-btn data-v="solid" data-size="md"` |
| Type switch | Alert exposes info/success/warning/error | ✅ | `.cb-select` options = those four values |
| Variant→accent | Alert **error** auto-sets accent | ✅ | `#FF8FA3` appears in both HTML and CSS panes |
| Esc safety | `<img src=x onerror=…>` in label | ✅ | output shows `&lt;img`; **0 live `<img>`** in preview |
| History | undo reverts label, redo re-applies | ✅ | undo → "Heads up"; redo → the escaped string back |
| Autosave | debounce writes `cb:autosave` | ✅ | `VT.db.get('cb:autosave').data.props.text === 'PersistenceCheck'` |
| Restore | reload restores component + hint | ✅ | "Aurora Panel" card restored; hint "Restored your last component" |
| Named saves | save adds row, autosave excluded from list | ✅ | list rows = 1, db records = 2 ("MyCard" present) |
| Copy HTML/CSS | clipboard receives markup / CSS | ✅ | captured HTML len 481, CSS contains `cb-` |
| Export | self-contained `.html` | ✅ | `<!DOCTYPE html>`, mime `text/html`, name `vistanology-component.html` |
| i18n | EN + PT keys for `cb.*` | ✅ | `add()` both locales; strings render (EN verified in screenshot) |
| Aesthetics | uses tokens (`--cyan`, `--glass-*`, `--r-*`, `--font-mono`) | ✅ | `css/apps.css` `cb-*` block; no new visual language |
| Mobile | columns stack at ≤980px | ✅ | `@media 980px` `.cb-work { grid-template-columns: 1fr }` |
| Offline | shell + tool + autosave, no network | ✅ | navigation + `component-builder.js` + `apps.css` `transferSize: 0`; "Aurora Panel" restored; 26 tools |
| Console | 0 errors / 0 warnings | ✅ | `list_console_messages` clean |

## Consolidation 0.15.0

| Item | Result |
|---|---|
| `js/app.js` `VT.version` | 0.15.0 |
| `js/core/registry.js` `VT.releases` | 15 entries, new 0.15.0 (EN+PT 3 bullets) |
| `sw.js` VERSION | v28 → v29; APPS includes `page-builder`, `design-lab`, `playground`, `animation-studio`, `component-builder` (26 entries) |
| `index.html` | `component-builder.js` script tag added before `app.js` |
| `css/apps.css` | full `cb-*` block appended |
| Regression | version 0.15.0, 26 tools, 15 releases, SW v29, component-builder mounts |
| Offline regression | server killed → transferSize 0, tool from cache, component restored |
| `CHANGELOG.md` | [0.15.0] section added |
| `README.md` | 26/31, Component Builder entry, +U11 header/checklist/verified bullets |
| `docs/VISION.md` | §4 U11 ✅ 0.15.0 (26ª), §6 next = U12 Image Studio avançado |
| Docs | `docs/component-builder.md`, `docs/checklist-u11.md`, `docs/shots/component-builder-preview.png`, `docs/shots/release-0.15.0.png` |

**Unit status: ✅ U11 shipped as 0.15.0.**
