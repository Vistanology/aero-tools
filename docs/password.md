# Password Generator · v1.0.0

Cryptographically secure passwords and passphrases with unbiased sampling, live entropy and a
memory-only history.
Senhas e frases criptograficamente seguras com amostragem sem viés, entropia ao vivo e histórico
só na memória.

Category: 02 Generators · Engine: `crypto.getRandomValues` + rejection sampling · 100% local · no dependencies.

## Usage · Uso

- **Mode** — Characters or Passphrase (diceware-style from a built-in wordlist).
  **Modo** — Caracteres ou Frase (lista de palavras embutida).
- **Characters** — length 8–64; toggle lowercase / uppercase / digits / symbols; exclude ambiguous
  glyphs (`I l 1 O 0`); require at least one of each selected set (guaranteed then shuffled).
  **Caracteres** — comprimento 8–64; conjuntos; excluir ambíguos; exigir um de cada conjunto.
- **Passphrase** — 3–8 words, separator (hyphen/dot/underscore/space/none), capitalize, trailing digit.
  **Frase** — 3–8 palavras, separador, capitalizar, dígito final.
- **Entropy & strength** — live bits estimate and Weak/Fair/Strong/Excellent meter.
  **Entropia e força** — bits ao vivo e medidor Fraca/Razoável/Forte/Excelente.
- **Output** — generate, copy, hide/show on screen. · Gerar, copiar, ocultar/mostrar.
- **Recent** — up to 8 memory-only entries with per-row copy and a Clear button; never persisted.
  **Recentes** — até 8 entradas só na memória, copiar por linha e Limpar; nunca persistidas.
- **Persistence** — only the settings survive reload (`localStorage`, key `vistanology:password`).
  **Persistência** — apenas as configurações sobrevivem ao reload.

## Privacy · Privacidade

Randomness comes from `crypto.getRandomValues` with rejection sampling (no modulo bias). Passwords
and history exist only in memory: never written to localStorage, never uploaded, never logged.
Aleatoriedade de `crypto.getRandomValues` com amostragem por rejeição (sem viés de módulo). Senhas e
histórico só na memória: nunca no localStorage, nunca enviados, nunca registrados.

## Limits · Limites

- Entropy is an estimate: length × log2(pool) for characters, words × log2(wordlist) for passphrases;
  requiring one of each set slightly reduces the true space.
  Entropia estimada; exigir um de cada conjunto reduz um pouco o espaço real.
- The passphrase wordlist is fixed and built-in; entropy per word = log2 of its size.
  Lista de palavras fixa e embutida.
- History holds at most 8 entries, cleared on reload or by Clear.
  Histórico no máximo 8 entradas, limpo no reload ou por Limpar.
- Clipboard writes can be denied by the browser; an honest error toast is shown on failure.
  A área de transferência pode ser negada; toast honesto em falha.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Characters** — default 20 chars contained lower+upper+digit+symbol; 128 bits = 20 × log2(85),
  labelled Excellent. · 20 caracteres com todas as classes; 128 bits conferidos.
- **Unbiased sampling** — digits-only with ambiguous excluded (pool = 8): 64 chars → 192 bits
  (64 × log2 8); 30 generations = 1920 draws tallied per digit, min 209 / max 263 around the expected
  240 (uniform), and zero ambiguous glyphs across all generations.
  Amostragem uniforme conferida por contagem (1920 sorteios), sem ambíguos.
- **Validation** — unchecking every set shows “select at least one character set” and empties the
  output. · Validação de conjunto vazio.
- **Passphrase** — 5 capitalized words + dot separator + trailing digit produced
  `Rune.Sage.Basil.Ulna.Quasar9`; 38 bits = 5 × log2(128) + log2(10), labelled Fair.
  Frase conferida em formato e entropia.
- **History & masking** — capped at 8 rows; per-row copy matches the row value; Hide shows bullets
  while Copy still copies the real secret; Clear empties the list.
  Histórico limitado a 8, copiar por linha, ocultar com bullets, copiar real, limpar.
- **Persistence (security)** — the stored object contains only settings keys
  (`mode,length,lower,upper,digits,symbols,exclude,require,words,sep,cap,num`); no password value and
  no history. After reload the old history is gone (a single fresh generation appears) while
  mode/words/capitalize are restored. · Só configurações persistem; segredos nunca.
- **Lifecycle** — three library↔tool remounts produced exactly one copy toast (no duplicate listeners).
  Três remontagens sem listeners duplicados.
- **i18n & shell** — full PT labels; docs render 6 usage steps / 4 limits / 0 deps; hub shows 6 tools.
  Bilíngue e integração conferidas.
- **Responsive** — 320/375/768/1280: `scrollWidth == clientWidth`, no element outside the viewport.
  A 320 px overflow of the three-button action row was found and fixed (wrap ≤480).
  Sem overflow; um overflow em 320 px foi encontrado e corrigido.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/password-desktop.png`](shots/password-desktop.png),
[`shots/password-mobile.png`](shots/password-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- Clipboard success verified with a stub (embedded document never focused); the denial path shows an
  honest error toast. · Clipboard via stub; negação real mostra toast honesto.
- Mobile screenshot uses a same-origin 375×785 iframe cropped from a viewport capture; no physical
  device was available. · Captura mobile via iframe 375×785.