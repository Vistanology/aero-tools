# Checklist · U9 — Playground (release 0.13.0)

Increment-by-increment verification. Method: real browser (Chromium via browser-use MCP) against
`http://localhost:8735`, feature checks via `evaluate_script`, IndexedDB round-trips, and genuine offline proof
(dev server killed, `curl` exit 000, navigation/resource `transferSize: 0`).

## Increment 1 — Sandboxed frame, editors, run, console capture, templates, persistence, export

| Area | Check | Result | Evidence |
|---|---|---|---|
| Registry | Tool visible, v0.1.0, cat developer, icon code | ✅ | `VT.registry.get('playground')` present; home card renders |
| Mount | 3 tabs + iframe + console | ✅ | `.pg-tab`×3, `#pg-frame`, `#pg-console` present |
| Sandbox | `iframe` `sandbox` attribute | ✅ | exactly `allow-scripts` (no `allow-same-origin`) |
| Console capture | log/warn/error + object serialization | ✅ | `PG hello {"a":1}` / `careful` / `boom` |
| Error capture | runtime + syntax errors | ✅ | `Uncaught SyntaxError: …` surfaced |
| Isolation | parent DOM / storage / parent.VT blocked | ✅ | 3× `SecurityError` from inside the frame |
| Child DOM | create + read elements in sandbox | ✅ | `CHILD_DOM:ok` |
| Templates | Canvas animation + Live clock | ✅ | live rings rendered in preview; JS/HTML match |
| Auto-run | debounced rebuild on input | ✅ | `srcdoc` gained `MARKER_XYZ` after ~600 ms |
| Viewport | desktop/mobile toggle | ✅ | `data-vp="mobile"` + `.pg-frame-mobile` |
| Shortcut | Ctrl/Cmd+Enter runs | ✅ | console gained `kbd-run 42` |
| Autosave | debounce writes `pg:autosave` | ✅ | `rec.data.html` contains marker |
| Restore | reload restores + runs + hint sticks | ✅ | value `<canvas id="c">`, ran, hint "Restored your last snippet" |
| Named snippets | save → scrub → open | ✅ | "MarkerTest" restored original |
| Export | standalone `.html` download | ✅ | toast "Downloaded standalone .html" |
| Copy | Copy HTML path | ✅ | wired to `standaloneHTML()` (no eval) |
| i18n | EN + PT keys for `pg.*` | ✅ | add() both locales; strings render |
| Aesthetics | uses tokens (`--cyan`, `--glass-*`, `--r-*`, `--font-mono`) | ✅ | `css/apps.css` `pg-*` block; no new visual language |
| Mobile | columns stack at ≤980px | ✅ | `@media 980px` rules (narrow viewport stacked) |
| Offline | shell + tool + autosave, no network | ✅ | navigation + `playground.js` `transferSize: 0`, snippet restored |
| Console | 0 errors / 0 warnings | ✅ | `list_console_messages` clean |

## Consolidation 0.13.0

| Item | Result |
|---|---|
| `js/app.js` `VT.version` | 0.13.0 |
| `js/core/registry.js` `VT.releases` | 13 entries, new 0.13.0 (EN+PT 3 bullets) |
| `sw.js` VERSION | v24; APPS includes `page-builder`, `design-lab`, `playground` (25 entries / 61 URLs) |
| `index.html` | `playground.js` script tag added before `app.js` |
| `css/apps.css` | full `pg-*` block appended |
| Regression | version 0.13.0, 24 tools, 13 releases, SW v24, playground mounts |
| Offline regression | server killed → transferSize 0, tool from cache, snippet restored + run |
| `CHANGELOG.md` | [0.13.0] section added |
| `README.md` | 24/31, Playground entry, +U9 header/checklist/verified bullets |
| `docs/VISION.md` | §4 U9 ✅ 0.13.0 (24ª), §6 next = U10 CSS Animation Studio |
| Docs | `docs/playground.md`, `docs/checklist-u9.md` |

**Unit status: ✅ U9 shipped as 0.13.0.**
