# Playground — v2.1.0

Write HTML, CSS and JavaScript and watch it run live in a sandboxed frame — four turn-of-the-millennium templates,
auto-run, a captured console and a standalone export. Your code never reaches this app and no `eval` is used.
Escreva HTML, CSS e JavaScript e veja rodar ao vivo em um quadro isolado — quatro modelos da virada do milênio,
execução automática, console capturado e exportação autônoma. Seu código nunca alcança este app e nenhum `eval` é usado.

Category: 04 Developer · Engine: three line-numbered code editors → a sandboxed `<iframe>` (`srcdoc`) + a serialized
postMessage console shim · 100% local · no dependencies · no `eval()`.

## Usage · Uso

- **Editor panel** — HTML / CSS / JS tabs with line numbers and a synced gutter. It opens beside the preview on
  desktop and starts collapsed on narrow screens; toggle it with **Editor**, close it with **×** or `Esc`. ·
  **Painel do editor** — abas HTML / CSS / JS com números de linha e gutter sincronizado. Abre ao lado da prévia
  no desktop e começa recolhido em telas estreitas; alterne com **Editor**, feche com **×** ou `Esc`.
- **Templates** — Aero Lab, MSN Portal, Web 2.0 Profile and Windows Vista. Picking one fills the three tabs and runs
  it immediately. · **Modelos** — Laboratório Aero, Portal MSN, Perfil Web 2.0 e Windows Vista. Escolher um preenche
  as três abas e executa na hora.
- **Run / Auto-run** — press **Run** or `Ctrl/Cmd+Enter`; with auto-run on, the preview rebuilds 250 ms after you
  stop typing. · **Executar / Execução automática** — botão ou atalho; com a execução automática ligada, a prévia
  é reconstruída 250 ms depois que você para de digitar.
- **Preview is the hero** — a 2000s browser with Aero glass chrome, traffic dots, nav/address/zoom toolbar,
  Preview ↔ Console tabs, live badge and status bar. The address reads `aero://lab/<template>`, or `lab/draft`
  once you edit. · **A prévia é a protagonista** — um navegador dos anos 2000 com chrome Aero glass, semáforo,
  barra de endereço/zoom, abas Prévia ↔ Console, selo ao vivo e barra de status. O endereço mostra
  `aero://lab/<modelo>`, ou `lab/draft` quando você edita.
- **Viewport** — Desktop, Tablet (768 px) or Mobile (390 px), with zoom (− / 100% / +, click the percentage to
  reset) and fullscreen preview. · **Janela** — Desktop, Tablet (768 px) ou Mobile (390 px), com zoom (− / 100% / +,
  clique na porcentagem para restaurar) e prévia em tela cheia.
- **Console** — a browser tab, not a drawer: shows `log/info/warn/error/debug`, runtime and syntax errors, with a
  counter that turns red when an error is captured. **Clear** empties it. · **Console** — uma aba do navegador,
  não uma gaveta: mostra `log/info/warn/error/debug`, erros de execução e sintaxe, com um contador que fica
  vermelho quando há erro. **Limpar** esvazia.
- **Copy HTML / Export .html** — produce a single self-contained `.html` document you can save or share. ·
  **Copiar HTML / Exportar .html** — gera um documento único e autossuficiente.
- **Saved** — save by name to IndexedDB and reopen it; the working snippet also **autosaves** (key `pg:autosave`)
  and is restored + run when you return. · **Salvos** — salve por nome no IndexedDB e reabra; o snippet de trabalho
  tem **salvamento automático** e é restaurado e executado ao voltar.

## Privacy · Privacidade

This is the core guarantee of the tool. The preview is an `<iframe sandbox="allow-scripts">` that **never** receives
`allow-same-origin`, so your code runs in a unique opaque origin. Verified from inside the frame: reading
`window.parent.document`, calling `localStorage`, and touching `parent.VT` each throw `SecurityError` — the snippet
cannot read or write this app, its storage, or the page around it. Nothing is uploaded. · Esta é a garantia central
da ferramenta. A prévia é um `<iframe sandbox="allow-scripts">` que **nunca** recebe `allow-same-origin`, então seu
código roda numa origem opaca única. Verificado de dentro do quadro: `parent.document`, `localStorage` e `parent.VT`
lançam `SecurityError`. Nada é enviado.

No `eval()` is used anywhere. The frame document is built by assigning `iframe.srcdoc`; a stray `</script>` in the
JS tab is neutralized (`<\/script`), and legitimate inline `<script>` you write in the HTML tab still runs — inside
the sandbox. The console is captured by a small in-frame shim that serializes each message and `postMessage`s it to
this page; the parent accepts messages only from its own preview frame and renders them with `textContent`, never as
HTML. · Nenhum `eval()`. O documento é atribuído via `srcdoc`; um `</script>` perdido na aba JS é neutralizado;
`<script>` legítimo na aba HTML roda no sandbox. O console é capturado por um shim que serializa cada mensagem via
`postMessage`; a página pai aceita apenas mensagens do próprio quadro e as renderiza com `textContent`.

## Limits · Limites

- Because the sandbox blocks same-origin APIs, `localStorage`, cookies and parent access are unavailable **inside
  the preview** by design — keep demos self-contained. · Como o sandbox bloqueia APIs de mesma origem,
  `localStorage`, cookies e acesso ao pai não estão disponíveis **na prévia** por design — mantenha as demos
  autossuficientes.
- Network `fetch` from the preview is limited to what the browser permits for an opaque origin; many APIs will
  reject it. · O `fetch` na prévia é limitado pelo navegador para origem opaca; muitas APIs rejeitam.
- The desktop editors are plain `<textarea>`s with line numbers and horizontal scrolling (no wrapping) — no
  autocompletion or syntax highlighting. · Os editores do desktop são `<textarea>` simples com números de linha e
  rolagem horizontal (sem quebra) — sem autocompletar nem realce de sintaxe.
- The console shows serialized string output (objects are JSON-stringified), not an interactive object inspector;
  `%c` styling is stripped from captured messages. · O console mostra saída serializada (objetos viram JSON), não
  um inspetor interativo; o estilo `%c` é removido das mensagens capturadas.
- Long-running or infinite loops in the preview keep consuming memory until the next Run reloads the frame. · Loops
  longos/infinitos consomem memória até a próxima Execução recarregar o quadro.

## Verified · Verificado

Run in Chromium against `http://localhost:8735` (increment evidence in [`checklist-u9.md`](checklist-u9.md)):

- **Mount** — preview browser, three editor tabs, console tab and status bar mount with zero page errors. · Montagem
  conferida, sem erros de página.
- **Templates** — all four templates load and run with no syntax errors; the address follows the template name. ·
  Os quatro modelos carregam sem erros; o endereço acompanha o nome do modelo.
- **Live typing** — a marker appended to the HTML tab appears in `srcdoc` after the 250 ms debounce; the address
  becomes `lab/draft`. · Digitação ao vivo conferida; o endereço vira `lab/draft`.
- **Console** — `log` lines captured; a thrown `Error` appears as `Uncaught Error` and the counter turns red; Clear
  resets the counter and restores the empty state. · Console conferido; erro pinta o contador; Limpar restaura.
- **Viewport / zoom** — Tablet is 768 px and Mobile 390 px after the width transition; zoom reaches 121% and the
  percentage resets to 100%. · Janela/zoom conferidos.
- **Editor panel** — toggle collapses/expands with `aria-pressed`; `Esc` collapses it. · Painel do editor conferido.
- **Autosave + restore** — the working snippet persisted and was restored and run on reload. · Autosave conferido.
- **Named snippets** — saved “Teste Aero”, reopened it from the list. · Snippets nomeados conferidos.
- **Export** — downloads `vistanology-playground.html`. · Exportação conferida.
- **Keyboard** — `Ctrl+Enter` re-runs; `Esc` closes the console tab first, then the editor. · Atalhos conferidos.
- **Live site** — the same run was repeated on `https://vistanology.github.io/aero-tools/` after deploy, with the
  service worker unregistered and both cache generations deleted: mount clean, four templates clean, console, viewport,
  zoom and export all behave as above. · A mesma verificação foi repetida no site publicado, com o service worker
  desregistrado e os caches apagados.
- **Mobile** — a 390 px capture was taken through the frame harness: editor starts collapsed, the 390 px frame is
  centred with no horizontal overflow, and the Aero Lab header loads cleanly. · **Mobile** — captura em 390 px feita
  pelo harness de frames: o editor começa recolhido, o frame de 390 px fica centralizado sem overflow horizontal, e o
  cabeçalho do Laboratório Aero carrega limpo.

### Pending · Limitações do ambiente de teste

- The embedded browser viewport is ~1280 px, so the 1180/980/860/720/580/480/380 px breakpoints were verified by
  DOM/computed-style checks and code review rather than physical device captures. · A janela embutida tem ~1280 px;
  os breakpoints foram verificados por DOM/estilo computado e revisão de código, não em dispositivos físicos.

Screenshots: [`shots/playground-desktop.png`](shots/playground-desktop.png) (1280 px, Aero Lab live preview with the
editor panel open) · [`shots/playground-mobile.png`](shots/playground-mobile.png) (390 px, editor recolhido, prévia
ao vivo como protagonista).
