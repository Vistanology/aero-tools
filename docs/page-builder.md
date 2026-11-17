# Visual Page Builder · v0.1.0

Compose a real landing page by dragging blocks onto a live canvas, edit each block in a properties panel,
preview responsively, autosave locally, undo/redo the whole document, and export clean, production-ready HTML.
Monte uma landing page de verdade arrastando blocos para uma tela ao vivo, edite cada bloco num painel de
propriedades, pré-visualize de forma responsiva, salve automaticamente no dispositivo, desfaça/refaça o
documento e exporte HTML limpo e pronto para produção.

Category: 01 Creative · Engine: typed block model → in-DOM canvas renderer + properties panel + HTML serializer
· 100% local · no dependencies · no `eval()`.

## Usage · Uso

- **Palette (left)** — 12 blocks: Hero, Heading, Paragraph, Button, Image, Quote, List, Columns, Features,
  Call to action, Divider, Spacer. Click to append, or **drag** a chip onto the canvas to insert at that position.
  **Paleta (esquerda)** — 12 blocos. Clique para adicionar ou **arraste** um chip para inserir naquele ponto.
- **Canvas (center)** — live preview of the page. Select a block to edit it; hover reveals the block tools
  (up / down / delete) and a type tag. Drag any block to reorder; a cyan line shows the drop position.
  **Tela (centro)** — prévia ao vivo. Selecione um bloco para editá-lo; ao passar o mouse aparecem as ferramentas
  (subir/descer/excluir) e a etiqueta do tipo. Arraste um bloco para reordenar; uma linha ciano marca a posição.
- **Properties (right)** — fields adapt to the selected block (text, textarea, select, checkbox). Edits are
  debounced and applied live. · **Propriedades (direita)** — campos adaptados ao bloco; edição em tempo real.
- **Preview width** — Desktop / Tablet / Mobile presets resize the canvas; the choice persists across reloads.
  **Largura da prévia** — Desktop / Tablet / Celular redimensionam a tela; a escolha persiste.
- **Undo / Redo** — the whole document (blocks + preview) is on `VT.history`; `Ctrl+Z` / `Ctrl+Shift+Z` work
  when focus is not in a text field. · **Desfazer/Refazer** — documento inteiro no histórico.
- **Copy HTML / Export .html** — generate a standalone document with embedded CSS and download `vistanology-page.html`.
  **Copiar HTML / Exportar .html** — gera documento autônomo com CSS embutido.
- **Projects** — save the current page by name to IndexedDB and reopen it; the working document also **autosaves**
  (key `pb:autosave`) and is restored with a status hint when you return.
  **Projetos** — salve por nome no IndexedDB e reabra; o documento de trabalho tem **salvamento automático**.
- **Template / Clear** — reload the starter page, or clear all blocks (also clears the autosave).
  **Modelo / Limpar** — recarrega o exemplo ou limpa tudo (também limpa o autosave).

## Privacy · Privacidade

Composition, preview and export run entirely in your browser. Exported HTML is generated from a typed model with
all text escaped and `javascript:`/`data:` URLs neutralized — no scripts are ever injected or evaluated. Projects
and autosave are stored on-device via IndexedDB. Nothing is uploaded. · Tudo roda no navegador; o HTML exportado é
gerado de um modelo tipado com texto escapado e URLs perigosas neutralizadas; nada é enviado.

## Limits · Limites

- Blocks cover common landing-page sections; export is static HTML + CSS, not a full multi-page site.
  Blocos cobrem seções comuns; a exportação é HTML + CSS estático, não um site multipágina.
- Image sources accept a URL or `data:` image; remote images load only if you add their URL.
  Imagens aceitam URL ou `data:`; imagens remotas só carregam se você adicionar a URL.
- Drag-and-drop uses the HTML5 drag API; on touch devices use the up/down tools to reorder.
  Em telas de toque, use as setas para reordenar.

## Verified · Verificado

Run in Chromium against `http://localhost:8735` (increment-by-increment evidence in
[`checklist-u7.md`](checklist-u7.md)):

- **Mount + template** — starter renders 5 blocks (heading, paragraph, button, columns, quote); 12 palette chips;
  properties panel shows the selected block type; 3 preview toggles. · Montagem e modelo conferidos.
- **Add / delete / undo** — divider appended (5→6), undo restores (6→5, undo disabled at oldest snapshot), redo
  re-applies (5→6); delete then undo round-trips (5→4→5). · Adicionar/excluir/desfazer conferidos.
- **Reorder** — up/down tools move a block one slot (a coordinate bug in the up handler was found and fixed);
  drag-reorder via synthetic `DragEvent`+`DataTransfer` moved Quote to index 0. · Reordenação conferida.
- **Property editing** — text and align edits apply live (heading → `pb-h pb-align-center`); debounced inputs
  coalesce without console noise. · Edição de propriedades conferida.
- **Preview + persistence** — Mobile sets canvas `max-width: 390px`, marks the toggle `aria-pressed`, and writes
  `{preview:'mobile'}` to `localStorage`. · Prévia e persistência conferidas.
- **Export honesty** — captured export is a full `<!DOCTYPE html>` document, `vistanology-page.html`, `text/html`;
  malicious paragraph text appears as escaped `&lt;script&gt;` with **0 live `<script>`/`<b>` elements**, and a
  `javascript:alert(1)` href is serialized as `href="#"`. Hero/Features/CTA markup is present in the export.
  Exportação conferida byte a byte (doctype, escape, neutralização de URL).
- **Projects + autosave** — saved "Marketing Hero" (IndexedDB count 1, 5 blocks) survived a reload and reopened
  with the correct heading text; after adding hero/features/CTA the autosave wrote 8 blocks to `pb:autosave`, and a
  reload restored 9 blocks with the hint "Restored your last session (9 blocks)". · Projetos e autosave conferidos.
- **i18n** — full EN/PT (palette names, field labels, buttons, privacy, restore hint). · Bilíngue conferido.
- **Offline** — with the server stopped (`curl` exit 000, port closed) navigation `transferSize: 0`, the shell and
  tool loaded from cache, and the 9-block autosave document restored from IndexedDB with no network.
  Offline provado com o servidor parado.
- Console clean throughout (0 errors, 0 warnings). · Console limpo.

Screenshots: [`shots/page-builder-canvas.png`](shots/page-builder-canvas.png) (live canvas with selected block +
properties), [`shots/page-builder-inc2-blocks.png`](shots/page-builder-inc2-blocks.png) (hero / features / CTA).

### Pending / Limitações do ambiente de teste

- The embedded browser viewport is ~592 px, so the three columns stack vertically; desktop three-pane layout was
  verified by DOM/computed-style checks rather than a wide physical capture. · Janela de teste estreita; layout de
  três colunas verificado via DOM/estilo computado.
- HTML5 drag-and-drop cannot be driven by a real mouse in the harness; insertion and reorder were exercised with
  synthetic `DragEvent`s carrying a genuine `DataTransfer`, which run the exact production handlers.
  Arrastar-e-soltar validado via `DragEvent` sintético com `DataTransfer` real (mesmos handlers de produção).
