# Privacy Policy — Vistanology Open

**Last updated: 2026-11-15**

Vistanology Open is a local-first application. This policy explains exactly what
happens to your data — which is: nothing leaves your device.

## What we collect

Nothing. There are no accounts, no analytics, no trackers, no cookies, no
fingerprinting, and no server-side components.

## How your data is processed

- Files you open (images, and in future releases PDFs and documents) are decoded
  and processed **in memory** by your browser. They are never uploaded.
- Text you type (URLs, Wi-Fi credentials, contacts, code, notes) stays in the page.
- QR codes, palettes, conversions and every other result are computed locally.

## What is stored on your device

Preferences (language, motion, transparency), favorites, recently used tools and
per-tool state are kept in your browser's `localStorage` under the `vistanology:`
prefix. You can erase all of it at any time: **Settings → Reset all local data**.

## Network requests

The only requests are those your browser makes to load the application itself:
`index.html`, its stylesheets, scripts, bundled fonts and the hero image. All
assets are served from the same origin; there are no third-party requests at
runtime. Once loaded, every tool works offline.

## Third-party code

Bundled libraries (see the in-app **Open → Credits & dependencies** page) run
locally and make no network calls.

## Contact

Questions about privacy can be raised as issues in the public repository.