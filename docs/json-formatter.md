# JSON Formatter · v1.0.0

Validate, pretty-print, minify and sort JSON locally with live error line/column, a syntax-highlighted
code view and a collapsible tree, plus structure stats and copy/download.
Valide, formate, minifique e ordene JSON localmente com linha/coluna de erro ao vivo, visão de código com
realce de sintaxe e árvore recolhível, mais estatísticas de estrutura e copiar/baixar.

Category: 04 Developer Tools · Engine: native `JSON.parse`/`stringify` + a local recursive-descent error
locator + in-DOM highlight/tree render · 100% local · no dependencies.

## Usage · Uso

- **Input** — paste or type JSON, or load the built-in sample. · Entrada — cole/digite JSON ou carregue o exemplo.
- **Live validation** — status flips between valid / invalid; on error the exact line and column are
  shown (from the engine position when present, otherwise from a local scanner).
  **Validação ao vivo** — status válido/inválido; no erro, linha e coluna exatas.
- **Pretty / Minified** — output mode tabs; indent 2 / 4 / tab for pretty.
  **Formatado / Minificado** — abas de modo; indentação 2 / 4 / tab no formatado.
- **Sort keys** — optional recursive lexicographic key ordering (values untouched).
  **Ordenar chaves** — ordenação recursiva opcional (valores intactos).
- **Code / Tree** — highlighted code, or a collapsible tree with per-node child counts.
  **Código / Árvore** — código realçado ou árvore recolhível com contagem de filhos por nó.
- **Stats** — keys, nodes, depth and output size. · Estatísticas — chaves, nós, profundidade e tamanho.
- **Copy / Download** — copy the result (clipboard API with a fallback) or download `vistanology.json`.
  **Copiar / Baixar** — copia o resultado ou baixa `vistanology.json`.
- **Persistence** — only mode/view/indent/sort survive reload (`localStorage`, key
  `vistanology:json-formatter`); the document itself is never stored.
  **Persistência** — só modo/visão/indentação/ordenação sobrevivem ao reload; o documento nunca é armazenado.

## Privacy · Privacidade

Parsing, formatting, highlighting and tree rendering all happen in memory in your browser. Nothing is
uploaded and nothing is persisted. · Tudo roda em memória no navegador; nada é enviado nem persistido.

## Limits · Limites

- Strict JSON only: comments and trailing commas are rejected (with the error position).
  JSON estrito: comentários e vírgulas finais são rejeitados (com a posição do erro).
- Tree view falls back to code above ~4000 nodes to stay responsive.
  A árvore recorre ao código acima de ~4000 nós para manter a responsividade.
- Key sorting changes order, not values; it is recursive and lexicographic.
  A ordenação muda a ordem, não os valores; é recursiva e lexicográfica.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Empty state** — mounts clean (“Aguardando JSON…”), no console error. An initial mount crash (tabs root
  passed as the tablist itself) was found and fixed before testing. · Estado vazio monta sem erro (um crash
  de mount foi corrigido).
- **Sample + stats** — sample validates; stats `keys=10, nodes=18, depth=5, size=320 B` match a hand count
  of the sample; highlight spans present (10 keys / 7 strings / 3 numbers / 2 literals).
  Exemplo e estatísticas conferidos contra contagem manual.
- **Error line/col** — five invalid inputs each produced the correct position, e.g.
  `{"a":1,\n "b": ,\n}` → line 3 col 8; `{"a":1,}` → line 1 col 8; `[1, 2` → line 1 col 6;
  `{"a": tru}` → line 1 col 7; `not json` → line 1 col 1. Because this Chromium omits “position N” in some
  messages, a local recursive-descent scanner supplies the index; both paths verified.
  Linha/coluna conferidas em cinco casos (motor + scanner local).
- **Pretty / Minify / indent / sort** — `{"b":2,"a":1}` → pretty 2-space, minified `{"b":2,"a":1}`,
  indent 4 and tab verified byte-exact; sort reorders to `{"a":1,"b":2}`.
  Modos, indentação e ordenação conferidos byte a byte.
- **Tree** — collapsible `<details>` render with child counts; collapsing works; code/tree switch live.
  Árvore recolhível conferida.
- **Copy honesty** — success toast only when the copy actually succeeds; with clipboard denied AND
  `execCommand` forced false, the error toast shows (a false-success bug from ignoring `copyText`’s
  boolean return was found and fixed). · Cópia honesta: sucesso só quando copia; erro quando ambos falham.
- **Download** — `vistanology.json`, `application/json`, content equals the output.
  Download conferido (nome, MIME, conteúdo).
- **Persistence** — `{indent:'4', mode:'min', sort:true, view:'tree'}` restored across three remounts;
  the input document was NOT persisted (empty after remount); 0 toasts, 0 console errors.
  Persistência conferida; documento não persistido; três remontagens limpas.
- **i18n & shell** — full EN/PT; library shows 13 cards including `json-formatter` (`13 ferramentas`).
  Bilíngue e integração conferidas (library = 13).
- **Responsive** — 320/375/768/1280 with a loaded document: no horizontal overflow
  (scrollWidth 310/365/758/1270); panes stack ≤1024. · Sem overflow em nenhuma largura.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/json-formatter-desktop.png`](shots/json-formatter-desktop.png) (1280 px),
[`shots/json-formatter-mobile.png`](shots/json-formatter-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- The host preview panel is fixed at 592 px, so the desktop shot is a full-page capture of a
  same-origin 1280×900 iframe (shell hidden) and the mobile shot a 375×785 iframe cropped to 375×784;
  no physical device was available. · Captura desktop via iframe 1280×900 e mobile via iframe recortado.
- Real OS clipboard is denied in the embedded browser; copy was verified via a stub plus the
  `execCommand` fallback, and the total-failure path by forcing both to fail.
  Clipboard real negado no navegador embutido; cópia verificada via stub + fallback e via falha total forçada.