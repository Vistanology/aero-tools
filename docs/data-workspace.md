# Data Workspace · v0.1.0

The flagship JSON workbench: edit any document as a live tree, convert CSV↔JSON, diff two documents,
validate against a JSON Schema subset, and persist projects locally — undo/redo throughout, fully offline.

Bancada JSON principal: edite qualquer documento como árvore ao vivo, converta CSV↔JSON, compare dois
documentos, valide contra um subconjunto de JSON Schema e guarde projetos localmente — com
desfazer/refazer e 100% offline.

Category: 04 Developer Tools · Engine: native `JSON.parse`/`stringify` + in-DOM editable tree + a local
RFC-4180 CSV codec + a structural path diff + a dependency-free JSON Schema subset validator + `VT.db`
(IndexedDB) for projects · 100% local · no dependencies.

The tool is organised as five cohesive tabs rather than one crowded screen: **Editor · CSV ↔ JSON ·
Compare · Schema · Projects**.

## Usage · Uso

- **Editor** — add / rename / delete keys and array items; edit any value with automatic type detection
  (`number`, `true`/`false`, `null`, quoted string, else string). Collapse/expand, `$.a.b[2].c` path chip
  on focus, case-insensitive **search** that filters the tree and force-expands matches, **Pretty/Minified**
  output, **Sort keys**, live stats (keys / nodes / depth / size), import/export `.json`.
  **Editor** — adicionar/renomear/excluir chaves e itens; editar valores com detecção de tipo; recolher/
  expandir; caminho ao focar; busca que filtra e expande; formatado/minificado; ordenar chaves; estatísticas;
  importar/exportar `.json`.
- **CSV ↔ JSON** — paste or load a `.csv`; delimiter selector (`,` / `;` / tab); header toggle; numeric
  coercion; per-row field-count warnings. The reverse direction turns the current document into CSV (nested
  arrays/objects JSON-encoded and properly quoted). Copy or export `.csv`.
  **CSV ↔ JSON** — colar ou carregar `.csv`; separador; cabeçalho; coerção numérica; avisos por linha.
  O caminho inverso gera CSV do documento atual. Copiar ou exportar `.csv`.
- **Compare** — paste a second document; the structural diff lists every added / removed / changed leaf by
  path, with counts and an identical-state readout.
  **Comparar** — cole um segundo documento; o diff estrutural lista adicionado/removido/alterado por caminho.
- **Schema** — validate the current document against a JSON Schema subset (`type`, `properties`, `required`,
  `items`, `enum`); problems are reported by path. A sample schema is included.
  **Schema** — valide contra um subconjunto de JSON Schema; problemas listados por caminho.
- **Projects** — save the document under a name, open or delete saved projects, **autosave** your work so it
  survives reloads, and **backup / restore** every project as one JSON file (merge or replace).
  **Projetos** — salvar com nome, abrir/excluir, salvamento automático entre recarregamentos, backup/restauração.
- **Undo / redo** — `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` and the toolbar buttons. Only document **content**
  is snapshotted (`canonical()`), so view settings never create history noise.
  **Desfazer/refazer** — só o conteúdo é registrado; ajustes de exibição não poluem o histórico.

## Privacy · Privacidade

Parsing, editing, CSV conversion, diffing, schema validation, formatting and persistence all happen on your
device. Projects are stored in IndexedDB and the working document is autosaved locally; nothing is ever
uploaded, and there are no trackers or analytics. · Tudo roda no dispositivo; projetos ficam em IndexedDB;
nada é enviado.

## Limits · Limites

- Strict JSON only (comments and trailing commas are rejected, with the error line/column).
  JSON estrito; comentários e vírgulas finais são rejeitados (com linha/coluna).
- The schema validator is a documented **subset** (type/properties/required/items/enum) — not a full
  draft-07 engine (no `$ref`, `oneOf`, format, etc.), chosen to add no dependencies.
  O validador é um **subconjunto** documentado, não um motor draft-07 completo (sem `$ref`/`oneOf`/format).
- CSV↔JSON targets tabular data (array of objects). Deeply nested documents flatten to JSON-encoded cells.
  CSV↔JSON visa dados tabulares; documentos aninhados viram células JSON codificadas.
- Large documents render **incrementally**: each branch shows 200 children plus “Show N more”, and any
  document over 1500 nodes is auto-collapsed on load. Editing is always available regardless of rendering.
  Documentos grandes usam renderização incremental (200 filhos + “mostrar mais”; auto-recolhe acima de 1500 nós).
- Projects need IndexedDB; in a context where it is unavailable the tool still works, only persistence is
  disabled with an honest message. · Sem IndexedDB a ferramenta funciona, só a persistência é desativada.

## Verified · Verificado

Run in Chromium against `http://localhost:8735` (and offline with the server stopped):

- **Tree editing** — edit/add/delete keys and items; type detection verified for number, quoted string,
  boolean and null; 21 sample rows render. · Edição da árvore e detecção de tipo conferidas.
- **Search** — query `tools` narrows 21→2 rows and hides non-matching branches; clearing restores 21.
  Busca reduzindo/expandido conferida.
- **Format / sort** — Minified removes newlines, Pretty restores; Sort keys reorders output to
  `active, author, categories, nested, owner, project, ratio, tools`. · Minificar/formatar/ordenar conferidos.
- **Undo isolation** — after one edit + three view-setting toggles, a single Undo reverts the value directly
  (no stepping through view noise); Redo re-applies; Undo starts disabled. · Undo sem ruído de exibição.
- **CSV → JSON** — `"Doe, John"` (embedded comma) parsed intact, `age` coerced to number, 2 rows clean;
  a mismatched row produced `Row 2: 2 fields, expected 3.` warnings. · CSV→JSON com aspas/vírgulas/avisos.
- **JSON → CSV** — object serialized to header + row; nested array/object cells JSON-encoded and quoted with
  `""` doubling. · JSON→CSV com escape correto.
- **Compare** — `A=[{a:1,b:2,c:3},{a:4,b:5,c:6}]` vs `B=[{a:1,b:2,c:3},{a:9,b:5},{d:7}]` → added `$[2].d`,
  removed `$[1].c`, changed `$[1].a` (1 each). · Diff estrutural conferido.
- **Schema** — fail case flagged `$.email` required-missing and `$.age` expected-integer-got-string; pass
  case clean; malformed schema reported honestly. · Validação de schema (falha/pass/erro) conferida.
- **Projects** — save → list → open round-trips the document; delete (confirm dialog) removes it; saving two
  different names creates two records, re-saving the same name updates in place (no silent overwrite).
  Autosave survives a full reload (`{hello:world,n:42}` restored); a file-based restore merged a new project.
  Projetos: salvar/abrir/excluir, autosave entre reloads e restauração por arquivo conferidos.
- **Large doc** — a 5000-object array renders 201 rows + “Show 4800 more…”; clicking shows 401 rows + “Show
  4600 more…”. Apply ≈222 ms, no freeze. · Documento grande com renderização incremental conferida.
- **Offline (server stopped)** — `curl` exit 7 / port closed confirmed, then navigation `transferSize: 0`,
  the tool mounted from cache (5 tabs), and projects listed and opened from IndexedDB with no network.
  **Offline com servidor parado**: `transferSize: 0`, montagem do cache e projetos do IndexedDB sem rede.
- **0 console errors** throughout; SW re-precached (shell `v11→v16`), `data-workspace` in the 58-URL precache.
  Console limpo; SW re-precacheado.

Screenshots: [`shots/data-workspace.png`](shots/data-workspace.png) (Editor),
[`shots/data-workspace-inc2.png`](shots/data-workspace-inc2.png) (search/minify/sort),
[`shots/data-workspace-inc3-csv.png`](shots/data-workspace-inc3-csv.png) (CSV),
[`shots/data-workspace-inc4-projects.png`](shots/data-workspace-inc4-projects.png) (Projects).

### Pending / Limitações do ambiente de teste

- The embedded browser is fixed-width; the shots above are full-page captures of the live tool at the host
  viewport. A physical mobile device was not available, so ≤820 px stacking was verified by CSS breakpoint
  and layout inspection rather than a real phone. · Capturas no navegador embutido; empilhamento ≤820 px
  verificado por breakpoint/CSS, não por aparelho físico.
- Real OS clipboard is denied in the embedded browser; CSV/JSON copy was exercised through the app’s copy
  path (clipboard API with `execCommand` fallback), consistent with the other tools. · Clipboard real negado
  no navegador embutido; cópia exercida pelo caminho da app (API + fallback).
