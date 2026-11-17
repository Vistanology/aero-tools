# U7 · Visual Page Builder — verification checklist

Increment-by-increment runtime evidence. Environment: Chromium via the embedded browser against
`http://localhost:8735`. Method: real DOM interaction + captured function output; offline proven by stopping
the dev server. "Verified" means an observed value, not a code read.

## Increment 1 — core model, canvas, add/select/edit, reorder, undo/redo, export, preview

| Item | Check | Observed | Status |
|---|---|---|---|
| Mount | starter renders, palette, props, toggles | 5 blocks, 12→(9) chips, props type "Heading", 3 seg buttons, canvas max-width 100% | ✅ |
| Add block | click palette divider | 5→6, last tag "Divider" | ✅ |
| Undo | #pb-undo | 6→5, undo disabled at oldest snapshot | ✅ |
| Redo | #pb-redo | 5→6, last tag "Divider" | ✅ |
| Reorder (up/down) | up tool on index 2 | BUG: no move (passed `i` not `i-1`) → **fixed** → Button moved to index 1, down restored it | ✅ (after fix) |
| Property: align | heading align select → center | first child `H1` class `pb-h pb-align-center` | ✅ |
| Property: text escape | paragraph text `<script>evil()</script><b>hi</b>` | rendered as literal textContent; 0 `<script>`, 0 `<b>` elements | ✅ |
| href neutralization | button href `javascript:alert(1)` | anchor `href="#"` | ✅ |
| Delete + undo | rm tool then undo | 5→4→5 | ✅ |
| Preview switch | mobile toggle | canvas `max-width: 390px`, `aria-pressed=true`, `localStorage {preview:'mobile'}` | ✅ |
| Export | captured downloadText | `<!DOCTYPE html>`, name `vistanology-page.html`, mime `text/html`, escaped `&lt;script&gt;` present, no live `<script>`, `href="#"`, button class present, len 2565 | ✅ |
| IndexedDB project | save "Marketing Hero" → reload → Open | 1 row, db count 1, 5 blocks stored; after reload Open restored heading "A landing page, built by dragging", 5 blocks | ✅ |
| i18n | setLang pt → remount | "Título", "Exportar .html", PT privacy line | ✅ |
| Console | errors/warnings | none | ✅ |

## Increment 2 — richer blocks, drag-from-palette, autosave/restore

| Item | Check | Observed | Status |
|---|---|---|---|
| New types present | palette after bump | 12 chips: Hero … Spacer (added Hero, Features, Call to action) | ✅ |
| Hero render | click Hero | `.pb-hero-title` "Ship your product page today" | ✅ |
| Features render | click Features | 3 `.pb-feat` cards | ✅ |
| CTA render | click CTA | `.pb-cta` contains a `.pb-btn` | ✅ |
| Autosave write | wait 900ms → db.get pb:autosave | 8 blocks stored, name "(autosave)" | ✅ |
| Autosave restore | reload → mount | 9 blocks restored, hint "Restored your last session (9 blocks)", hero present, 3 feature cards | ✅ |
| Drag insert | synthetic DragEvent (chip→block bottom) | Quote inserted at index 2 (Heading, Paragraph, Quote, Button), count 8→9 | ✅ |
| Drag reorder | synthetic DragEvent (block→top of index 0) | Quote moved to index 0 (Quote, Heading, Paragraph) | ✅ |
| Export new blocks | captured downloadText | contains `pb-hero-title`, `pb-feats`, `pb-cta`, `pb-quote`, len 4683 | ✅ |
| Console | errors/warnings | none | ✅ |

## Increment 3 — consolidation + offline

| Item | Check | Observed | Status |
|---|---|---|---|
| Version | VT.version | 0.11.0 | ✅ |
| Tool count | registry.all().length | 22 | ✅ |
| Releases | VT.releases.length | 11 | ✅ |
| SW shell | cache keys | vt-shell-v19, vt-asset-v19 | ✅ |
| Regression | home + tool load | home rendered, page-builder present, 0 console errors | ✅ |
| Offline | server stopped (curl exit 000, port closed) → reload | navigation `transferSize: 0`, version 0.11.0 + 22 tools from cache, tool mounted, 9 blocks restored from IndexedDB autosave, db available | ✅ |

## Bugs found and fixed during U7

1. **Up-reorder no-op** — the up tool called `moveBlock(id, i)` (the block's own pre-removal index), which
   re-inserted it at the same spot. Fixed to `moveBlock(id, i - 1)`. Re-verified: Button moves index 2→1 and back.
2. **Duplicate `AUTOSAVE_ID` declaration** — increment 1 had it in the persistence section; increment 2 added a
   module-level one, causing a `SyntaxError`. Removed the duplicate. Caught by `node --check` before browser test.
