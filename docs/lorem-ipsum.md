# Lorem Ipsum Generator · v1.0.0

Placeholder prose by paragraphs, sentences or words — classic opening, reproducible seeds and
HTML `<p>` wrapping, previewed as editorial prose or as the exact export source.
Texto de preenchimento por parágrafos, frases ou palavras — abertura clássica, sementes
reproduzíveis e envoltório HTML `<p>, com prévia em prosa editorial ou no código exato da exportação.

Category: 02 Generators · Engine: seeded PRNG (xmur3 + mulberry32) over a 162-word classic
vocabulary · 100% local · no dependencies.

## Usage · Uso

- **Unit & count** — paragraphs (1–10), sentences (1–20) or words (1–300), slider with live value.
  **Unidade e quantidade** — parágrafos (1–10), frases (1–20) ou palavras (1–300).
- **Classic opening** — optionally start with “Lorem ipsum dolor sit amet, consectetur…”.
  **Abertura clássica** — opcionalmente começar com “Lorem ipsum dolor sit amet, consectetur…”.
- **Seed** — type a seed for reproducible text, roll a random one, or leave empty for a fresh
  draw on every generate. · Semente — digite para reproduzir, sorteie, ou vazio para sorteio novo.
- **Wrap** — plain text or HTML `<p>` paragraphs; the download switches between `.txt` and `.html`.
  **Envoltório** — texto puro ou parágrafos HTML `<p>`; o download alterna `.txt` / `.html`.
- **Preview / Source** — read the prose in the serif stage, or inspect the exact payload.
  **Prévia / Código** — leia a prosa no palco serifado ou inspecione o payload exato.
- **Metrics & export** — live paragraphs / sentences / words / characters; copy or download.
  **Métricas e exportação** — parágrafos / frases / palavras / caracteres ao vivo; copiar ou baixar.
- **Persistence** — only settings survive reload (`localStorage`, key `vistanology:lorem-ipsum`).
  **Persistência** — apenas as configurações sobrevivem ao reload.

## Privacy · Privacidade

Text is assembled in your browser from a built-in wordlist. Seeded output uses a deterministic
PRNG; unseeded output draws its seed from `crypto.getRandomValues`. Nothing is stored or sent.
O texto é montado no seu navegador a partir de uma lista embutida. Com semente usa PRNG
determinístico; sem semente sorteia via `crypto.getRandomValues`. Nada é armazenado ou enviado.

## Limits · Limites

- Counts are clamped per unit: paragraphs 1–10, sentences 1–20, words 1–300.
  Quantidades limitadas por unidade.
- A seed reproduces text only while unit, count, classic opening and wrap stay the same.
  Uma semente reproduz o texto apenas com as mesmas configurações.
- The vocabulary is the classic Cicero-derived lorem wordlist (162 unique words); it is placeholder
  text, not real Latin prose. · Vocabulário lorem clássico derivado de Cícero; não é prosa latina real.
- The words unit emits one unpunctuated paragraph (sentence metric reads 0).
  A unidade palavras emite um parágrafo sem pontuação (métrica de frases = 0).
- Clipboard writes can be denied by the browser; an honest error toast is shown on failure.
  A área de transferência pode ser negada; toast honesto em falha.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Determinism** — seed `vista` produced identical payloads across regenerate and across a seed
  change-and-back; a different seed produced different text; empty seed varied between generates.
  Determinismo conferido (mesma semente = mesmo texto; semente diferente = texto diferente; vazio varia).
- **Units** — paragraphs 5 → 5 prose paragraphs; sentences 7 → 1 paragraph / 7 sentences;
  words 40 → exactly 40 words, 0 sentences, no terminal period. · Unidades conferidas nas três formas.
- **Classic opening** — with the option on, the first sentence is exactly the canonical opening;
  off, it is not; the words unit starts from the classic word sequence. · Abertura clássica conferida.
- **Wrap & exports** — every payload line wrapped `<p>…</p>`; download produced
  `vistanology-lorem-ipsum.html` (`text/html`) and `vistanology-lorem-ipsum.txt` (`text/plain`);
  copy placed the exact payload on the clipboard with a word-count toast.
  Envoltório e exportações conferidos (.html / .txt / copiar).
- **Preview / Source** — clicking Source hides the prose and shows the payload; a real ArrowLeft
  key press moved selection and focus back to Preview. · Abas conferidas com teclado real.
- **Persistence** — settings (sentences / 7 / classic off / seed `vista` / wrap p / source) restored
  after reload and the seeded payload was byte-identical across the reload.
  Persistência conferida; payload idêntico após reload.
- **Corrupt storage** — a stored object with bogus unit / count 999 / non-boolean classic / numeric
  seed falls back to clean defaults on a fresh load (an out-of-range count was initially clamped
  instead of rejected; fixed to strict range validation). · Storage corrompido cai em padrões limpos.
- **Lifecycle** — three library↔tool remounts then one copy produced exactly one toast.
  Três remontagens sem listeners duplicados.
- **i18n & shell** — full EN/PT labels; docs render 5 usage steps / 4 limits / 0 deps; registry and
  library show 8 tools; search `lorem`, `placeholder`, `ipsum seed` each return the tool.
  Bilíngue e integração conferidas.
- **Escaping** — the literal `<p>` in tagline/summary/usage is entity-escaped so innerHTML injection
  shows it as text (a tag-swallowing bug was found in the first screenshot and fixed).
  Escape de `<p>` conferido; um bug de tag engolida foi encontrado e corrigido.
- **Responsive** — 320/375/768/1280: `scrollWidth == clientWidth`, no element outside the viewport.
  Sem overflow em nenhuma largura.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/lorem-ipsum-desktop.png`](shots/lorem-ipsum-desktop.png) (1280 px),
[`shots/lorem-ipsum-mobile.png`](shots/lorem-ipsum-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- Clipboard success verified with a stub (embedded document never focused); the denial path shows an
  honest error toast. · Clipboard via stub; negação real mostra toast honesto.
- The host preview panel was narrowed to 592 px mid-session, so the desktop shot was captured as a
  full-page capture of a same-origin 1280×900 iframe (shell hidden), and the mobile shot as a
  375×785 iframe cropped from a viewport capture; no physical device was available.
  Captura desktop via iframe 1280×900 (full-page) e mobile via iframe 375×785 recortado.