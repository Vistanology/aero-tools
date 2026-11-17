# Text Diff · v1.0.0

Line-level diff of two texts with unified and side-by-side views, ignore whitespace/case, honest add/remove
counts, swap, copy and a unified `.diff` download — computed locally with an LCS algorithm.
Diff por linhas de dois textos com visões unificada e lado a lado, ignorar espaços/maiúsculas, contagens honestas
de adicionadas/removidas, inverter, copiar e baixar `.diff` unificado — computado localmente com um algoritmo LCS.

Category: 04 Developer Tools · Engine: LCS over lines (`Int32Array` DP + backtrack) · 100% local · no dependencies.

## Usage · Uso

- **Original / Modified** — paste the two texts (A and B), or load the sample. · Cole os dois textos (A e B) ou carregue o exemplo.
- **Unified / Split** — tab switches between a single unified column and two side-by-side columns with aligned blanks.
  **Unificado / Lado a lado** — a aba alterna entre coluna unificada e duas colunas com espaços alinhados.
- **Ignore whitespace / Ignore case** — comparison-only options; displayed lines keep their original formatting.
  **Ignorar espaços / maiúsculas** — afetam só a comparação; as linhas exibidas mantêm a formatação original.
- **Counts** — added / removed / unchanged line counts, plus a `+A / -R` status (neutral when identical).
  **Contagens** — linhas adicionadas / removidas / inalteradas e status `+A / -R` (neutro quando idêntico).
- **Swap / Sample / Clear** — exchange A↔B, load the example, or empty both panes. · Inverter A↔B, exemplo, limpar.
- **Copy diff / Download .diff** — copy the unified diff or save it as `vistanology.diff` (text/plain).
  **Copiar diff / Baixar .diff** — copia o diff unificado ou salva como `vistanology.diff`.
- **Persistence** — only view/ignore-whitespace/ignore-case survive reload (`localStorage`, key `vistanology:text-diff`);
  the texts are never stored. · Persistência — só visão/ignorar-espaços/ignorar-maiúsculas sobrevivem ao reload; os textos nunca são armazenados.

## Privacy · Privacidade

The diff runs in memory in your browser with an LCS algorithm. Nothing is uploaded and no text is persisted.
O diff roda em memória no navegador com um algoritmo LCS; nada é enviado e nenhum texto é persistido.

## Limits · Limites

- Comparison is line-based (not word/character level). · A comparação é por linhas (não por palavra/caractere).
- Each side is capped at 2000 lines to keep the O(n·m) LCS responsive; excess is truncated and flagged
  ("line limit reached"). · Cada lado é limitado a 2000 linhas; o excesso é truncado e sinalizado.
- Ignore options affect comparison only; displayed lines keep their original formatting.
  As opções de ignorar afetam só a comparação; as linhas exibidas mantêm a formatação original.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Empty state** — mounts clean, no console error; status "Waiting for two texts…", stats/output empty.
  Estado vazio monta sem erro; status e saída vazios.
- **Sample LCS** — `alpha/beta/gamma/delta/epsilon` vs `alpha/beta modified/gamma/epsilon/zeta` → `+2 / -2`, 3 unchanged;
  unified rows and old/new line numbers byte-identical to an independent LCS ground truth.
  Diff do exemplo conferido contra ground truth LCS independente (+2/−2, 3 inalteradas).
- **Split view** — two columns, 7 aligned rows each; deletions left, additions right, blanks opposite.
  Visão lado a lado com colunas e espaços alinhados.
- **Ignore whitespace** — `a  b` vs `a b` → `+1 / -1` off, identical on. · Conferido nos dois estados.
- **Ignore case** — `Hello/World` vs `hello/world` → `+2 / -2` off, identical on. · Conferido nos dois estados.
- **Swap** — A↔B exchanged; added/removed sets swap; counts stay symmetric `+2 / -2`. · Inverter conferido.
- **Identical / empty** — identical shows neutral status `+0 / -0 / 2`; clear empties panes, stats and output.
  Idêntico e vazio conferidos.
- **Line cap** — 2001 vs 2000 lines truncates to 2000 each → `+1 / -1 / 1999` with "line limit reached".
  Limite de 2000 linhas conferido e sinalizado.
- **Copy / Download** — copy returns the exact unified diff; download `vistanology.diff` (text/plain) byte-identical;
  denied clipboard produces the honest error toast and writes nothing. · Cópia e download conferidos; falha honesta.
- **Persistence** — `{view,ignws,igncase}` restored across reload; texts NOT persisted; 3 remounts → 0 new toasts,
  0 console errors. · Persistência só de configurações; remontagens limpas.
- **i18n & shell** — full EN/PT; library shows 18 cards including `text-diff` (`18 ferramentas`).
  Bilíngue e integração conferidas (library = 18).
- **Responsive** — 320/375/768/1280 with content: no horizontal overflow; inputs and split stack ≤1024, two columns at 1280.
  Sem overflow em nenhuma largura; colunas empilham ≤1024.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/text-diff-desktop.png`](shots/text-diff-desktop.png) (1280 px),
[`shots/text-diff-mobile.png`](shots/text-diff-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- The host preview panel is fixed at 319 px, so the desktop shot is a full-page capture of a same-origin
  1280-wide iframe at natural content height (shell hidden) and the mobile shot a 375×785 iframe cropped to 375×784;
  no physical device was available. · Captura desktop via iframe 1280 e mobile via iframe recortado.
- Real OS clipboard is denied in the embedded browser; copy verified via a stub plus the honest failure path.
  Clipboard real negado no navegador embutido; cópia verificada via stub + caminho de falha honesto.