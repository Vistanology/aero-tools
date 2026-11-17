# Checklist · U10 — CSS Animation Studio (release 0.14.0)

Increment-by-increment verification. Method: real browser (Chromium via browser-use MCP) against
`http://localhost:8735`, feature checks via `evaluate_script`, IndexedDB round-trips, and genuine offline proof
(dev server killed, `curl` exit 000, navigation/resource `transferSize: 0`).

## Increment 1 — Animation model, controls, live preview, easing curve, presets, history, persistence, export

| Area | Check | Result | Evidence |
|---|---|---|---|
| Registry | Tool visible, v0.1.0, cat creative, icon sparkle | ✅ | `VT.registry.get('animation-studio')` present; home card renders |
| Mount | 3 groups + live target + curve SVG | ✅ | `animation-name: as-anim`, `1.2s`, `ease-in-out`; `@keyframes as-anim` in CSS; curve path present |
| Preset | Spin / Bounce | ✅ | Spin → `360deg`+`linear`; Bounce → 5 stops |
| Custom easing | bezier sliders + CSS + curve | ✅ | 4 bezier sliders, `cubic-bezier(…)` in CSS, 2 handles |
| Stop edit | property slider → CSS | ✅ | Scale → `scale(1.750)` |
| Add stop | chips grow | ✅ | stop count +1 |
| Play/Pause | live style play-state, export clean | ✅ | live `animation-play-state: paused` + `.is-paused`; export panel has no play-state |
| History | undo reverts | ✅ | cssOut changes after undo |
| Export | download `.css` | ✅ | toast "Animation exported as CSS" |
| Autosave | debounce writes `as:autosave` | ✅ | `rec.data.anim.stops.length === 5` |
| Restore | reload restores + runs + hint sticks | ✅ | 5 stops, `-44px`, `as-anim` running, hint "Restored your last animation" |
| Named saves | save → switch → open | ✅ | "BounceTest" restored over Spin |
| i18n | EN + PT keys for `as.*` | ✅ | add() both locales; strings render |
| Aesthetics | uses tokens (`--cyan`, `--glass-*`, `--r-*`, `--font-mono`) | ✅ | `css/apps.css` `as-*` block; no new visual language |
| Mobile | columns stack at ≤980px | ✅ | `@media 980px` rules (narrow viewport stacked) |
| Offline | shell + tool + autosave, no network | ✅ | navigation + `animation-studio.js` `transferSize: 0`, bounce restored |
| Console | 0 errors / 0 warnings | ✅ | `list_console_messages` clean |

## Consolidation 0.14.0

| Item | Result |
|---|---|
| `js/app.js` `VT.version` | 0.14.0 |
| `js/core/registry.js` `VT.releases` | 14 entries, new 0.14.0 (EN+PT 3 bullets) |
| `sw.js` VERSION | v27; APPS includes `page-builder`, `design-lab`, `playground`, `animation-studio` (26 entries / 62 URLs) |
| `index.html` | `animation-studio.js` script tag added before `app.js` |
| `css/apps.css` | full `as-*` block appended |
| Regression | version 0.14.0, 25 tools, 14 releases, SW v27, animation-studio mounts |
| Offline regression | server killed → transferSize 0, tool from cache, animation restored + running |
| `CHANGELOG.md` | [0.14.0] section added |
| `README.md` | 25/31, CSS Animation Studio entry, +U10 header/checklist/verified bullets |
| `docs/VISION.md` | §4 U10 ✅ 0.14.0 (25ª), §6 next = U11 Component Builder |
| Docs | `docs/animation-studio.md`, `docs/checklist-u10.md` |

**Unit status: ✅ U10 shipped as 0.14.0.**
