# Component Builder · U11 (v0.15.0)

The flagship visual UI-component composer. Pick a component type, tune its typed
properties, watch it render live in the **Cosmic Liquid Glass** identity, and export
clean, escaped HTML + scoped CSS — entirely in the browser, offline-capable.

## What it does

- **4 component types**
  - **Button** — variants `solid / outline / ghost`, sizes `sm / md / lg`.
  - **Badge** — variants `solid / soft / outline`, sizes `sm / md / lg`; radius defaults
    to a pill (999px, slider capped at 999 for badges).
  - **Alert** — variants `info / success / warning / error`; choosing a variant
    auto-sets the accent color (`#5FE6FF / #7FE0B0 / #FFD08A / #FF8FA3`).
  - **Card** — variants `default / outline / elevated`; carries a title + body.
- **Typed properties panel** — label + body text, variant/size selects, accent color
  picker, corner-radius slider (capped 40px for non-badges), and an icon toggle. Every
  edit re-renders the live preview and both output panes at once.
- **Live preview** — a scoped `<style>` carries the compiled CSS; the markup is rendered
  into the stage with all user text escaped.
- **Undo/redo** — the whole component state is on `VT.history` (memory-only, bounded).
- **Persistence** — the working component autosaves to IndexedDB (`cb:autosave`) and is
  restored on return with a hint; **named components** are saved/opened from the side
  panel (the autosave record is excluded from the saved list).
- **Export** — Copy HTML, Copy CSS, or download a self-contained `vistanology-component.html`.

## Security model

- Exported markup runs every user string through `VT.utils.esc` — typing
  `<img src=x onerror=alert(1)>` into a label renders inert text, never a live element.
- The CSS interpolates **only browser-validated values**: color from `<input type=color>`,
  radius from a numeric range, variant/size from fixed option lists. There is no
  free-form HTML or CSS field and no `eval`.
- The icon set is static, trusted inline SVG baked into the module.

## Architecture

- `js/apps/component-builder.js` — an IIFE that registers a `def` with `VT.registry.add`
  and exposes its module at `VT.modules['component-builder']`.
- `def` shape: `{ id, cat:'creative', icon:'layers', version:'0.1.0', name, tagline, tags,
  deps:[], docs:{en,pt}, mount, unmount }`. `mount(root)` returns a cleanup closure;
  `unmount()` clears state.
- Uses `VT.utils` (`esc`, `copyText`, `downloadText`, `debounce`), `VT.store`, `VT.db`,
  `VT.history`, `VT.i18n`, `VT.icons`, `VT.ui.toast`.
- Styles: `cb-*` block in `css/apps.css`, built from the shared design tokens
  (`--cyan`, `--glass-*`, `--r-*`, `--font-mono`, …).

## i18n

Full EN + PT strings under the `cb.*` namespace, registered via `VT.i18n.add`.

## Offline

Precached by the Service Worker (shell `v29`). Verified with the dev server stopped:
navigation, `component-builder.js` and `apps.css` all report `transferSize: 0`, the tool
mounts from cache and the last component is restored — no network.
