# Playground · v0.1.0

Write HTML, CSS and JavaScript and watch it run live in a sandboxed frame — templates, auto-run, a captured
console and a standalone export. Your code never reaches this app and no `eval` is used.
Escreva HTML, CSS e JavaScript e veja rodar ao vivo em um quadro isolado — modelos, execução automática, console
capturado e exportação autônoma. Seu código nunca alcança este app e nenhum `eval` é usado.

Category: 04 Developer · Engine: three text editors → a sandboxed `<iframe>` (`srcdoc`) + a serialized
postMessage console shim · 100% local · no dependencies · no `eval()`.

## Usage · Uso

- **Editors** — three tabs (HTML / CSS / JS). Type or pick a **Template** (Welcome, DOM & events, Canvas
  animation, Live clock) to start. · **Editores** — três abas; escolha um **Modelo** para começar.
- **Run** — press Run or `Ctrl/Cmd+Enter` to build the preview. **Auto-run** rebuilds (debounced ~600 ms) as you
  type. · **Executar** — botão ou atalho; **Execução automática** atualiza ao digitar.
- **Preview** — the code runs inside a sandboxed iframe. Toggle **Desktop / Mobile** to constrain the frame width.
  · **Prévia** — roda em iframe isolado; alterne **Desktop / Mobile**.
- **Console** — shows your `log/info/warn/error/debug` output plus runtime and syntax errors, color-coded. **Clear**
  empties it. · **Console** — mostra sua saída e erros; **Limpar** esvazia.
- **Copy HTML / Export .html** — produce a single self-contained `.html` document you can save or share. ·
  **Copiar HTML / Exportar .html** — gera um documento único e autossuficiente.
- **Saved** — save the current snippet by name to IndexedDB and reopen it; the working snippet also **autosaves**
  (key `pg:autosave`) and is restored + run when you return. · **Salvos** — salve por nome no IndexedDB e reabra;
  o snippet de trabalho tem **salvamento automático** e é restaurado e executado ao voltar.

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
this page; the parent renders it with `textContent`, never as HTML. · Nenhum `eval()`. O documento é atribuído via
`srcdoc`; um `</script>` perdido na aba JS é neutralizado; `<script>` legítimo na aba HTML roda no sandbox. O console
é capturado por um shim que serializa cada mensagem via `postMessage`; a página pai a renderiza com `textContent`.

## Limits · Limites

- Because the sandbox blocks same-origin APIs, `localStorage`, cookies and parent access are unavailable **inside
  the preview** by design — keep demos self-contained. · Como o sandbox bloqueia APIs de mesma origem, `localStorage`,
  cookies e acesso ao pai não estão disponíveis **na prévia** por design — mantenha as demos autossuficientes.
- Network `fetch` from the preview is limited to what the browser permits for an opaque origin; many APIs will
  reject it. · O `fetch` na prévia é limitado pelo navegador para origem opaca; muitas APIs rejeitam.
- The console shows serialized string output (objects are JSON-stringified), not an interactive object inspector. ·
  O console mostra saída serializada (objetos viram JSON), não um inspetor interativo.
- Long-running or infinite loops in the preview keep consuming memory until the next Run reloads the frame. · Loops
  longos/infinitos consomem memória até a próxima Execução recarregar o quadro.

## Verified · Verificado

Run in Chromium against `http://localhost:8735` (increment evidence in [`checklist-u9.md`](checklist-u9.md)):

- **Mount** — 3 editor tabs + sandboxed iframe + console panel; `frame` `sandbox` attribute is exactly
  `allow-scripts`. · Montagem conferida.
- **Console capture** — `console.log('PG','hello',{a:1})` → `PG hello {"a":1}`; `warn` and `error` lines color-coded. ·
  Captura de console conferida.
- **Error capture** — a syntax error and a runtime throw both surface as `Uncaught SyntaxError…` / error lines. ·
  Captura de erros conferida.
- **Isolation** — from inside the frame: `parent.document`, `localStorage.getItem`, and `parent.VT` all →
  `SecurityError`. · Isolamento provado (3 sondas).
- **Child DOM** — code creates and reads elements inside the sandbox. · DOM do filho funciona.
- **Templates** — Canvas animation renders live rings in the preview; Live clock loads correct snippet. · Modelos conferidos.
- **Auto-run** — enabling it and typing rebuilt `srcdoc` (marker present) after the debounce. · Execução automática conferida.
- **Viewport** — Mobile sets `data-vp="mobile"` + `.pg-frame-mobile`. · Alternância de janela conferida.
- **Ctrl/Cmd+Enter** — runs without the Run button. · Atalho conferido.
- **Autosave + restore** — a distinctive snippet persisted to `pg:autosave`; after reload it restored, ran, and the
  hint "Restored your last snippet" stuck. · Autosave restaurado + executado conferido.
- **Named snippets** — saved "MarkerTest", scrubbed, reopened → original restored. · Snippets nomeados conferidos.
- **Export** — downloads a standalone `.html`; toast "Downloaded standalone .html". · Exportação conferida.
- **Offline** — server stopped (`curl` exit 000, port closed): navigation and `playground.js` both `transferSize: 0`,
  tool mounted from cache, snippet restored and run with no network. · Offline provado.
- Console clean throughout (0 errors, 0 warnings). · Console limpo.

Screenshots: [`shots/playground-preview.png`](shots/playground-preview.png) (live canvas animation in the sandboxed frame).

### Pending / Limitações do ambiente de teste

- The embedded browser viewport is ~592 px, so the editor/preview/saved columns stack; the three-pane desktop layout
  was verified by DOM/computed-style checks rather than a wide physical capture. · Janela estreita; layout de três
  colunas verificado via DOM/estilo computado.
