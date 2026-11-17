# Contributing to Vistanology Open

Thank you for considering a contribution. Vistanology Open is a growing collection of
free, open-source, local-first digital tools.

## Principles

1. **Local-first.** Tools must run entirely in the browser. No telemetry, no analytics,
   no network calls, no server-side processing of user data.
2. **Real functionality.** No placeholder buttons, no simulated results. If a feature
   cannot be implemented honestly, it does not ship.
3. **Bilingual.** Every user-facing string exists in English and Portuguese (`en`/`pt`).
4. **Accessible.** Semantic HTML, keyboard navigation, visible focus, ARIA where needed,
   and `prefers-reduced-motion` respected.

## Adding a tool

Each tool is a self-contained module:

1. Create `js/apps/<tool-id>.js`.
2. Register a manifest with `VT.registry.add({ id, cat, icon, version, name, tagline, tags, deps, docs, mount, unmount })`.
   - `name`, `tagline` and `docs` are bilingual objects (`{ en, pt }`).
   - `mount(el)` renders the tool into the provided element; `unmount()` tears down timers/listeners.
3. Add its strings with `VT.i18n.add({ en: {...}, pt: {...} })`.
4. Add its styles to `css/apps.css` (or a dedicated sheet) and its icon to `js/core/icons.js` if needed.
5. Add the script tag to `index.html`.
6. Document it: the manifest `docs` feeds the in-app Docs page; add `docs/<tool-id>.md` for the repository.

The shell (Hub, Library, search, favorites, Docs, Open) picks the tool up automatically.

## Workflow

- Open an issue first for new tools or significant changes.
- Keep commits small and isolated so each one builds and runs on its own.
- Test in a real browser before submitting: golden path, edge cases, keyboard, and
  375px / 768px widths. Never claim something was tested if it was not.
- Run the app from a static server (`python -m http.server 8080`) or directly from
  `index.html` — both must work.

## Code style

- Vanilla ES6+, classic scripts (no build step, no framework), global `VT` namespace.
- No comments except where a non-obvious constraint needs explaining.
- Revoke object URLs, clear timers and remove listeners on unmount.

## License

By contributing, you agree that your contributions are licensed under the MIT license.