# Checklist U5 · Undo/redo framework (`VT.history`)

Unidade: framework de desfazer/refazer opt-in, só em memória, com pilha limitada e coalescência de
digitação, integrado como referência à Prévia de Markdown 1.1.0. Nada é persistido; o histórico reinicia
ao sair da ferramenta (sem vazamento entre ferramentas/sessões).

## Arquivos

| Arquivo | Mudança |
|---|---|
| `js/core/history.js` | **novo** — `VT.history.create({ apply, limit=100, equal })`: controlador de snapshots. API `reset/record/undo/redo/onKey` + `canUndo/canRedo/depth/limit`. `record` deduplica valor igual e limpa a pilha de redo (novo passo invalida redo); pilha limitada (descarta o mais antigo). `onKey` consome `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` **só quando há o que fazer**; caso contrário o evento cai para o navegador. |
| `js/apps/markdown-preview.js` | 1.0.0 → **1.1.0**: cria o controlador no mount, `reset` ao valor inicial; digitação → `renderSoon` + `recordSoon` (debounce 500 ms = um passo por pausa); Sample/Clear fazem `record` explícito; botões Undo/Redo na linha de ações (`aria-keyshortcuts`) + `keydown` no editor; `syncHist` mantém o estado desabilitado; `unmount` zera a referência (GC, sem leak). Docs EN/PT: nova linha de uso + limitação de histórico. |
| `js/core/icons.js` | ícones `undo` / `redo` no estilo do sistema (grade 24, traço 1.5, assinatura ciano `.ia`) |
| `js/core/i18n.js` | bloco `hist.*` EN+PT (Undo/Redo + tooltips) |
| `css/apps.css` | `.mp-actions-sep` (divisor vertical fino usando `var(--line)`) + `align-items: center` na linha |
| `index.html` | `<script src="js/core/history.js">` após `workers.js` |
| `sw.js` | `js/core/history.js` no SHELL (**57** URLs) + `VERSION` bump `v5 → v6` |
| `js/app.js` | `VT.version` `0.7.0 → 0.8.0` |
| `js/core/registry.js` | release note `0.8.0` EN+PT |
| `README.md` / `CHANGELOG.md` / `docs/VISION.md` | status, feature bullet, evidência U5, roadmap U5 ✅ / U6 ▶️ |

## Decisão de design (snapshot vs command; por que não só o undo nativo do `<textarea>`)

- **Snapshot controller** escolhido sobre padrão command para U5: as ferramentas-alvo (Markdown/JSON/SVG)
  editam um valor de texto único; um snapshot por passo é simples, determinístico e fácil de limitar.
- O `<textarea>` tem undo nativo, mas ele (a) só funciona com o campo focado, (b) é quebrado por
  atribuições programáticas (Sample/Clear fazem `value = …`), e (c) não sobrevive ao remount nem é
  perceptível para o usuário. **Tomar o controle** com `VT.history` dá undo/redo uniforme que cobre
  digitação **e** mudanças programáticas, com botões visíveis. Trade-off honesto documentado: enquanto a
  ferramenta está montada, `Ctrl+Z` no editor usa o histórico da app, não o nativo do textarea.
- **Coalescência** por debounce (500 ms): rajadas de digitação viram **um** passo, sem estourar a pilha.
- **Sem persistência**: snapshots vivem só na closure do mount; `unmount` zera. Nada vai para
  `localStorage`/`VT.db`/rede.

## Estático

- `node --check` em `history.js`, `icons.js`, `i18n.js`, `markdown-preview.js`, `app.js`, `sw.js`,
  `registry.js` → OK.
- 57/57 URLs de precache presentes no disco; `history.js` confirmado na lista SHELL do `sw.js`.

## Verificado em navegador (evidência real, não `node --check`)

Servidor local `http://localhost:8735` com `cache-control: no-store`.

**Botões + estados desabilitados**
- Estado inicial: editor vazio, Undo **e** Redo desabilitados.
- Sample → texto carregado, Undo habilitado, Redo desabilitado.
- Digitar após Sample → Undo habilitado; `undo` volta ao Sample; `undo` de novo volta a vazio (Undo
  desabilitado, Redo habilitado); dois `redo` reconstroem Sample→digitado e desabilitam Redo.
- 14/14 asserções da bateria de botões passaram (`undo1BackToSample`, `undo2Empty`, `redo2Typed`, etc.).

**Coalescência de digitação**
- 5 eventos `input` rápidos dentro de uma janela de debounce (≈200 ms) → **um** único passo de undo:
  um `Ctrl+Z` levou direto de volta ao valor anterior à rajada (`coalescedToOneStep: true`).

**Teclado**
- `Ctrl+Z` desfaz; `Ctrl+Shift+Z` refaz; `Ctrl+Y` refaz (testado após um undo para popular a pilha de
  redo). Nota honesta: um novo `record` (ex.: digitar/Clear) **limpa** a pilha de redo — comportamento
  padrão de editores; um teste inicial de `Ctrl+Y` sem undo prévio corretamente não refez nada.

**Sem vazamento (remount)**
- Navegar para a Library e voltar: editor vazio, Undo e Redo desabilitados (histórico reiniciado).
  Confirma que o estado não vaza entre montagens nem sessões.

**i18n**
- Botões EN "Undo/Redo"; ao trocar para PT via `VT.i18n.setLang('pt')` (remonta) viram
  "Desfazer/Refazer"; volta a EN correta.

**Offline (prova central, método de U3/U4)**
- Servidor derrubado **e porta confirmada fechada** (`netstat` sem LISTENING em 8735, `curl` → exit 7)
  antes do `location.reload()`.
- Recarga fria: navegação `transferSize: 0`, `responseStatus: 200` (servida pelo SW), `VT.version: 0.8.0`,
  `VT.history` presente, ferramenta monta, Sample carrega, **Undo funciona** (reverte a vazio).
- Nota de honestidade: um `location.href` para o mesmo hash **não** recarrega o documento (só troca o
  hash), então a primeira medição deu `transferSize: 3996` (a carga online anterior). A prova real exigiu
  `location.reload()` → `transferSize: 0`.

**`file://`**
- `index.html` via `file://`: SW corretamente **não** registrado (0 registrations). `VT.history` presente,
  ferramenta monta, Sample carrega, Undo habilitado e funcional (reverte a vazio). Console limpo.

**Regressão**
- 20/20 ferramentas montam (`#view` com conteúdo real), 0 falhas, em `0.8.0`.
- Console: **0 mensagens/erros** (online, offline, file://).

**Atualização do SW (convenção de invalidação)**
- `history.js` entrou no SHELL ⇒ `VERSION` bump `v5 → v6` feito **por último**, após as edições de
  conteúdo (`app.js` 0.8.0, release note `registry.js`). O navegador instalou/ativou v6 sozinho
  (`reg.update()` + reload) e re-pré-cacheou 57/57; a página passou a servir `0.8.0`. Convenção mantida:
  **editar shell ⇒ bump de `VERSION` no mesmo commit**.

## Limitações conhecidas (honestas)

- Enquanto a ferramenta está montada, `Ctrl+Z` no editor é interceptado por `VT.history` (não o undo
  nativo do `<textarea>`). É intencional para unificar digitação + mudanças programáticas; usuários que
  esperam undo nativo de textarea veem o comportamento do app, que é um superconjunto.
- Coalescência por tempo (500 ms): dois passos de digitação separados por <500 ms viram um só. Aceitável
  para edição de texto; um refinamento futuro seria dividir por fronteira de palavra.
- Snapshots são strings completas; a pilha é limitada a 100 entradas (mais antigas descartadas). Para
  documentos de texto muito grandes isso é memória O(100 × tamanho do doc) — adequado a Markdown/JSON
  típicos; um orçamento por bytes seria a evolução se alguma ferramenta editar payloads gigantes.
- Só **Markdown Preview** integra o framework por ora (referência vertical). JSON Formatter e SVG Studio
  são adoções baratas seguintes (o core já existe), não pré-requisito de U5.
- O histórico não aparece na paleta de comandos (U3) nem tem "últimas ações" — entrada natural para
  um registro de ações por app no futuro.

## Veredito

**U5 concluída e validada.** `VT.history` entrega undo/redo com botões + teclado, **coalescendo rajadas
de digitação em um passo**, com estado desabilitado correto e **sem vazamento** (remount reinicia; nada é
persistido). Funciona online, **offline** (`transferSize: 0`, undo reverte) e sob **`file://`** (SW ausente).
Regressão 20/20, console limpo, i18n EN/PT correto, SW re-pré-cacheado 57/57 em `v5→v6`. Próxima unidade:
**U6 — Flagship Data Workspace** (JSON tree edit + query + CSV↔JSON + schema).
