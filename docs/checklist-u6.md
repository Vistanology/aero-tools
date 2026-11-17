# U6 · Data Workspace — verification checklist

Flagship tool (21st of 31). Built in four increments, each verified in a real browser at
`http://localhost:8735`, plus a genuine offline run with the dev server stopped. No claim below is
asserted without the recorded runtime evidence.

## Increment 1 — editable JSON tree core

| Check | Result |
| --- | --- |
| Mounts, 21 sample rows render | ✅ |
| Edit leaf value → `setAt` + commit | ✅ |
| Add key / add item, Delete node | ✅ |
| Type detection: number, boolean, null, quoted string, plain string | ✅ |
| Collapse all / expand all | ✅ |
| Source Apply: valid + invalid (line/col) | ✅ |
| Path chip `$.nested.a[2].c` | ✅ |
| Stats keys/nodes/depth/size | ✅ |
| Undo/redo: disabled→enabled→revert→redo (history seeded via `hist.reset(canonical())`) | ✅ |
| i18n EN↔PT remount | ✅ |
| Console errors | 0 |

## Increment 2 — search / format / sort / undo isolation

| Check | Result |
| --- | --- |
| Search `tools` filters 21→2 rows, hides `author`, clears→21 | ✅ |
| Minified removes newlines; Pretty restores; aria-pressed tracks state | ✅ |
| Sort keys reorders output alphabetically | ✅ |
| Undo after edit + 3 view toggles reverts value directly (no view noise) | ✅ |
| Redo re-applies; Undo starts disabled | ✅ |
| Console errors | 0 |

## Increment 3 — CSV↔JSON / diff / schema

| Check | Result |
| --- | --- |
| JSON→CSV: object → header+row; nested array/object JSON-encoded, `""` escaping | ✅ |
| CSV→JSON: `"Doe, John"` embedded comma intact; `age`→number; 2 rows clean | ✅ |
| CSV row-length mismatch → `Row 2: 2 fields, expected 3.` warnings | ✅ |
| Compare: added `$[2].d`, removed `$[1].c`, changed `$[1].a` (counts 1/1/1) | ✅ |
| Schema fail: `$.email` required-missing, `$.age` expected-integer-got-string | ✅ |
| Schema pass: valid document → pass banner | ✅ |
| Schema bad input: malformed schema → honest error | ✅ |
| Console errors | 0 |

## Increment 4 — persistence / large-doc / offline

| Check | Result |
| --- | --- |
| Save project → appears in list with date+size | ✅ |
| Open project → document restored | ✅ |
| Delete project (confirm `.btn-danger`) → removed, list empty | ✅ |
| Rename-and-save creates a NEW record (no silent overwrite); same-name re-save updates in place | ✅ |
| Autosave survives a full reload (`{hello:world,n:42}` restored, hint shown) | ✅ |
| Backup/restore: file-based restore merged `ProjC` alongside existing | ✅ |
| Large doc: 5000-object array → 201 rows + “Show 4800 more…”, click → 401 + “Show 4600 more…” | ✅ |
| Large doc apply time | ≈222 ms, no freeze |
| **Offline (server stopped)**: `curl` exit 7 / port closed, then navigation `transferSize: 0` | ✅ |
| Offline: tool mounted from cache (5 tabs), projects opened from IndexedDB | ✅ |
| SW precache contains `data-workspace.js` + `apps.css` (58 URLs) | ✅ |
| Console errors | 0 |

## Environment limitations

- Embedded browser is fixed-width; mobile ≤820 px stacking verified via CSS breakpoint + layout inspection,
  not a physical phone.
- Real OS clipboard denied in the embedded browser; copy exercised through the app path (API + fallback).
- The `file://` cold-load clears the hash to home; reaching the tool requires setting
  `location.hash = '#/tool/data-workspace'` after load (router uses `#/tool/<id>`, not `#/app/<id>`).

## Consolidation (0.10.0)

- `VT.version` 0.9.0 → 0.10.0; registry `VT.releases` gained the 0.10.0 entry (EN/PT).
- CHANGELOG [0.10.0], README status (21/31) + verified header (+U6) + tool bullet + checklist link,
  VISION §4/§6, `docs/data-workspace.md`.
- Service Worker `VERSION` v11 → v16 across the increments; `data-workspace` added to the precache APPS.
