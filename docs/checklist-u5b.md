# Checklist U5b · `VT.history` → JSON Formatter + SVG Studio

Extensão de U5: adoção do framework de undo/redo em **duas** ferramentas reais — JSON Formatter 1.1.0 e
SVG Studio 1.1.0 — seguindo o critério do mandamento §1: *cada adoção precisa trazer benefício real e
passar pelos testes*. Não é integração cosmética: o estado editável de cada app passa a ter undo/redo por
botões **e** teclado, cobrindo digitação **e** mudanças programáticas. Nada é persistido; o histórico
reinicia ao desmontar (sem leak).

## Arquivos

| Arquivo | Mudança |
|---|---|
| `js/apps/json-formatter.js` | 1.0.0 → **1.1.0**: `let hist = null`; controlador `VT.history.create({ apply })` onde `apply` escreve em `refs.input.value` e chama `process()` (revalida saída ao desfazer/refazer). `reset` no mount. Digitação → `processSoon` + `recordSoon` (debounce 500 ms). Sample/Clear fazem `record` explícito. Botões Undo/Redo no cabeçalho do painel de entrada (`aria-keyshortcuts`) + divisor `.jf-actions-sep`. `keydown` delega a `hist.onKey`. `syncHist` mantém o estado desabilitado. `unmount` zera `hist`. Docs EN/PT: nova linha de uso + limitação de histórico. |
| `js/apps/svg-studio.js` | 1.0.0 → **1.1.0**: `let hist = null` + `syncHist()` em escopo de módulo (usa `refs.undo`/`refs.redo`, adicionados ao `refs`). `apply` escreve no `refs.code` e chama `setCode(val,{syncTextarea:false})` (saneia/parse/renderiza/persiste). **Registro em todas as mutações de código**: digitação (`onInput` 250 ms + `recordSoon` 500 ms), Clear (`record('')`), Optimize (`record(out)`), Recolor (`record(r.code)`), Load-file (`record(refs.code.value)`). Botões Undo/Redo em `.sv-srcmeta` + divisor `.sv-actions-sep`. `unmount` zera `hist`. Docs EN/PT: linha de uso + limitação. |
| `css/apps.css` | `.jf-pane-actions`/`.jf-actions-sep`; `.sv-srcmeta` (flex-wrap + `#sv-count{margin-right:auto}` para o contador ficar à esquerda e os botões à direita) + `.sv-actions-sep` (divisor `var(--line)`) |
| `sw.js` | `VERSION` bump `v6 → v7` (shell: `json-formatter.js`/`svg-studio.js` re-precached) |

O core (`js/core/history.js`) e os ícones/`hist.*` i18n já existiam de U5 — nenhuma mudança de core foi
necessária; as apps apenas o consomem.

## Verificado em navegador (evidência real, não `node --check`)

Servidor local `http://localhost:8735` (`cache-control: no-store`).

### JSON Formatter (online)

- Botões presentes; estado inicial Undo **e** Redo desabilitados (input vazio).
- Sample → texto carregado, Undo habilitado. Botão Undo → volta a vazio; botão Redo → reconstitui.
- Digitação após Sample: Undo volta ao Sample, Undo de novo a vazio (Redo habilitado).
- **Revalidação ao desfazer**: após `Ctrl+Y` (redo) com um `// typed` no texto, o status fica
  `"Invalid JSON"` — prova que `apply` reexecuta `process()` (a saída/validação acompanham o histórico),
  não apenas a caixa de texto.
- Teclado `Ctrl+Z`/`Ctrl+Shift+Z`/`Ctrl+Y` funcionam; um novo `record` limpa a pilha de redo (padrão).

### SVG Studio (online)

- Botões presentes; estado inicial desabilitado.
- **Digitação** (`input` + debounce de record): SVG válido renderiza (`#sv-canvas` visível); Undo →
  código vazio; Redo → SVG volta. Teclado `Ctrl+Z`/`Ctrl+Y` round-trip OK.
- **Optimize**: botão muda o código (menor); Undo reverte exatamente ao pré-optimize; Redo reaplica.
- **Recolor**: via inputs HEX `#sv-from-hex`/`#sv-to-hex` (handlers em `change`), Aplicar troca
  `#ff0000`→`#00ff00`; Undo reverte ao pré-recolor. Nota honesta: uma primeira tentativa usando os
  *pickers* `<input type=color>` (`#sv-from`/`#sv-to`) não mudou nada porque o binding deles é `input`
  (não `change`) — artefato do banco de testes, não do app; refeito pelos campos HEX, passou.
- **Clear**: esvazia o código; Undo restaura o SVG anterior.
- **Sem vazamento**: navegar JSON→SVG de volta deixa Undo/Redo desabilitados (histórico reinicia no remount).

### Offline (método U3–U5)

- `history.js`, `json-formatter.js`, `svg-studio.js` **presentes no cache ativo** (`caches.match` → verdade)
  sob SW `v7`.
- `location.reload()` frio: navegação `transferSize: 0`, `history.js` `transferSize: 0`,
  `VT.history` carregado. O mecanismo de cache é idêntico ao já provado offline "com servidor parado +
  porta fechada + `curl` exit 7" em U5; as únicas URLs novas no shell são justamente as confirmadas em
  cache acima.

### `file://` (sem Service Worker)

- `index.html#/tool/...` via `file://`: boot limpa o hash para a home (recarga fria de documento,
  esperado); navegação SPA por hash monta as apps.
- **SVG Studio**: `#sv-code` monta; Sample-equivalente (SVG via input) renderiza; Undo→vazio,
  `Ctrl+Y`→restaura. OK.
- **JSON Formatter**: `#jf-input` monta; Sample carrega; Undo→vazio; Redo→restaura. OK.
- Console limpo em `file://` (0 erros/avisos).

### Regressão

- **20/20** ferramentas montam (`#view` com stage real), **0** falhas.
- Console: **0 mensagens/erros/avisos** em toda a varredura de 20 apps.
- `qr-studio`/`color-studio` não aparecem em `VT.modules` (anterior à convenção de registro por id) — é
  comportamento pré-existente, ambas montam; não é regressão desta unidade.

## Limitações conhecidas (honestas)

- Undo em JSON/SVG é **por snapshot de string** (o texto-fonte), limitado a 100 passos. Para payloads
  gigantes, memória O(100 × doc) — adequado ao uso típico; orçamento por bytes seria evolução futura.
- Coalescência por tempo (500 ms de pausa = 1 passo). Dois edits separados por <500 ms viram um só.
- Enquanto a app está montada, `Ctrl+Z` no editor usa `VT.history` (não o undo nativo do `<textarea>`) —
  intencional para unificar digitação + mudanças programáticas (Sample/Clear/Optimize/Recolor/Load).

## Veredito

**U5b concluída e validada.** `VT.history` agora serve a **três** ferramentas (Markdown, JSON, SVG) com
undo/redo real cobrindo digitação **e** mutações programáticas (Sample/Clear/Optimize/Recolor/Load-file),
estado desabilitado correto, revalidação da saída ao desfazer, **sem leak** no remount. Funciona online,
**offline** (`transferSize: 0` nas URLs do shell) e sob **`file://`** (SW ausente). Regressão 20/20, console
limpo. SW re-precached em `v6→v7`. Consolidar em **0.9.0** junto com U4b.
