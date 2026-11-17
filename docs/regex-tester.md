# Regex Tester · v1.0.0

A live regular-expression workbench: highlighted matches, capture groups (positional and named), flag
toggles, measured timing and a replace preview — all in your browser.
Uma bancada de expressões regulares ao vivo: matches destacados, grupos de captura (posicionais e nomeados),
flags, tempo medido e prévia de substituição — tudo no navegador.

Category: 04 Developer Tools · Engine: native `RegExp` (`exec` loop + `String.replace`) · 100% local ·
no dependencies.

## Usage · Uso

- **Pattern + flags** — type a pattern without slashes; toggle `g i m s u y`. Invalid patterns show the
  engine's own error message. · Padrão + flags — digite sem barras; alterne `g i m s u y`. Padrões inválidos
  mostram a mensagem de erro do motor.
- **Live matches** — the test text is re-rendered with every match highlighted; zero-length matches show a
  thin caret marker. · Matches ao vivo — o texto é re-renderizado com cada match destacado; matches de
  comprimento zero mostram um marcador fino.
- **Match detail** — each match lists its index, full text and capture groups (`$1…` plus named groups).
  Detalhe — cada match lista índice, texto completo e grupos de captura.
- **Stats** — match count, capture-group count and measured execution time in ms. · Estatísticas — contagem
  de matches, de grupos e tempo de execução medido em ms.
- **Replace preview** — a replacement template (`$1`, `$&`, `$$`) previews `String.replace` output; copy the
  result or the match list. · Prévia de substituição — modelo (`$1`, `$&`, `$$`) pré-visualiza a saída;
  copie o resultado ou a lista de matches.
- **Persistence** — only the flag selection survives reload (`localStorage`, key `vistanology:regex-tester`);
  pattern, text and replacement are never stored. · Persistência — só as flags sobrevivem ao reload; padrão,
  texto e substituição nunca são armazenados.

## Privacy · Privacidade

Matching and replacing happen in memory in your browser. Nothing is uploaded; only the six flag booleans are
persisted. · Busca e substituição ocorrem em memória; nada é enviado; apenas os seis booleanos de flags são
persistidos.

## Limits · Limites

- Matching is capped at 500 matches (status shows `500+` and a limit note) and test text at 50 000 characters.
  A busca é limitada a 500 matches (status mostra `500+`) e o texto a 50 000 caracteres.
- JavaScript regex is synchronous; a catastrophically backtracking pattern can still block the UI briefly.
  Regex em JS é síncrono; backtracking catastrófico ainda pode bloquear a UI brevemente.
- Zero-length matches advance one code unit per iteration to avoid infinite loops. · Matches de comprimento
  zero avançam uma unidade de código por iteração.
- Timing is a single measured run (`performance.now`), not an average; sub-millisecond values round to 0.0/0.1.
  O tempo é uma única execução medida, não uma média.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Empty state** — mounts clean, default flag `g`, no console error. · Estado vazio monta sem erro.
- **Sample vs ground truth** — `(\w+)@(\w+\.\w+)` on the sample yields 2 matches / 2 highlight marks / 2 detail
  cards; groups `ana` + `vistanology.dev` equal an independent `matchAll`; replace `$2/$1` byte-identical to
  `String.replace`. · Amostra conferida contra ground truth independente.
- **Invalid regex** — `(` flags “Regex inválida: … Unterminated group” and clears outputs. · Inválida reportada.
- **Zero-length** — `a*` with `g` on `bbb` returns 4 matches without hanging. · Comprimento zero sem loop.
- **Flags** — `i` matches `ANA ana Ana` (3); `m` makes `^line` match 2 lines; `u` enables `\p{Emoji_Presentation}`
  (2 emoji); unchecking `g` reduces `a` on `aaa` to 1 match. · Flags conferidas.
- **Named groups** — `(?<user>\w+)@(?<dom>\w+)` lists `$1,$2,user,dom`. · Grupos nomeados conferidos.
- **Match cap** — `.` on 600 chars reports `500+ matches · limite de matches atingido`. · Limite conferido.
- **Replace templates** — `[$&]` → `b[a]n[a]n[a]` and `$$` → `b$n$n$`, both equal independent ground truth.
  Modelos de substituição conferidos.
- **Singular/plural** — 1 match reads “1 match”, 2 read “2 matches”. · Singular/plural corretos.
- **Copy honesty** — result copy writes `bXnXnX`; match-list copy writes `#1 @1 a…`; with clipboard throwing
  AND `execCommand` false an error toast shows (no false success). · Cópia honesta nos dois caminhos.
- **Persistence** — `{flags:{g:true,i:true,…}}` restored across remounts (flags only); 3 remount cycles produce
  0 new toasts and 0 console errors. · Persistência só de flags; remontagens limpas.
- **i18n & shell** — full EN/PT; library shows 16 cards including `regex-tester` (`16 ferramentas`).
  Bilíngue e integração conferidas (library = 16).
- **Responsive** — 320/375/768/1280 with content: no horizontal overflow; panes stack ≤1024, flags wrap.
  Sem overflow em nenhuma largura.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/regex-tester-desktop.png`](shots/regex-tester-desktop.png) (1280×1115),
[`shots/regex-tester-mobile.png`](shots/regex-tester-mobile.png) (375×784).

### Pending / Limitações do ambiente de teste

- The host preview panel viewport is fixed (319×784 observed), so the desktop shot is a full-page capture of a
  same-origin 1280 px-wide iframe at its natural content height (1115 px, shell hidden) and the mobile shot a
  375×785 iframe (internal scrollbar hidden) cropped to 375×784; no physical device was available.
  Captura desktop via iframe de 1280 px na altura natural do conteúdo e mobile via iframe recortado.
- Real OS clipboard is denied in the embedded browser; copy verified via a stub plus the execCommand fallback.
  Clipboard real negado no navegador embutido; cópia verificada via stub + fallback.