# Checklist · U8 — Design System Lab (release 0.12.0)

Increment-by-increment verification. Method: real browser (Chromium via browser-use MCP) against
`http://localhost:8735`, feature checks via `evaluate_script`, IndexedDB round-trips, and genuine offline proof
(dev server killed, `curl` exit 000, navigation `transferSize: 0`).

## Increment 1 — Token model, controls, live preview, export, history, autosave

| Area | Check | Result | Evidence |
|---|---|---|---|
| Registry | Tool visible, version 0.1.0, cat creative, icon palette | ✅ | `VT.registry.get('design-lab')` present; home card renders |
| Mount | 4 groups / 13 controls / 5 presets / preview / CSS out | ✅ | DOM counts; `--ds-accent #5FE6FF`, `--ds-blur 20px` on preview |
| Color edit | Accent picker → live var + CSS text | ✅ | `--ds-accent: #ff0000` (lowercased by input, correct) |
| Range edit | Blur slider → var + value label + CSS | ✅ | `--ds-blur: 32px`, label "32 px" |
| Preset | Ember applies, rebuilds, hint | ✅ | accent `#FFB27D`, hint `Preset "Ember" applied` |
| History | Undo restores previous token set | ✅ | accent back to `#ff0000`; canUndo/canRedo correct |
| CSS export | Copy + download `vistanology-tokens.css` | ✅ | Blob `text/css`, contains `:root`, `--ds-surface`, `--ds-shadow` |
| Autosave | Debounce writes `ds:autosave` to IndexedDB | ✅ | `{accent:#9DEAFF, blur:34}` after Frost |
| Restore | Reload restores working theme + hint | ✅ | accent `#9DEAFF` / blur `34px`, hint "Restored your last theme" |
| Named themes | Save by name, switch, reopen | ✅ | Brand Teal→Midnight→Open restored `#7FF0D4` |
| i18n | EN + PT keys for `ds.*` | ✅ | add() both locales; strings render |
| Aesthetics | Uses tokens (`--cyan`, `--glass-1`, `--r-*`, `--font-mono`) | ✅ | `css/apps.css` `ds-*` block; no new visual language |
| Mobile | Controls stack under preview at ≤980px | ✅ | `@media 980px` rules (narrow viewport stacked) |
| Offline | Shell + tool + autosave with no network | ✅ | transferSize 0, theme restored from IndexedDB |
| Console | 0 errors / 0 warnings | ✅ | `list_console_messages` clean |

## Consolidation 0.12.0

| Item | Result |
|---|---|
| `js/app.js` `VT.version` | 0.12.0 |
| `js/core/registry.js` `VT.releases` | 12 entries, new 0.12.0 (EN+PT 3 bullets) |
| `sw.js` VERSION | v21; APPS includes `page-builder`, `design-lab` (24 entries) |
| `index.html` | `design-lab.js` script tag added before `app.js` |
| `css/apps.css` | full `ds-*` block appended |
| Regression | version 0.12.0, 23 tools, 12 releases, SW v21, design-lab mounts |
| Offline regression | server killed → transferSize 0, 23 tools from cache, theme restored |
| `CHANGELOG.md` | [0.12.0] section added |
| `README.md` | 23/31, Design System Lab entry, +U8 header/checklist/verified bullets |
| `docs/VISION.md` | §4 U8 ✅ 0.12.0 (23ª), §6 next = U9 Playground |
| Docs | `docs/design-lab.md`, `docs/checklist-u8.md` |

**Unit status: ✅ U8 shipped as 0.12.0.**
