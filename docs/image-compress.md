# Image Compressor · v1.0.0

Shrink PNG, JPEG and WebP entirely in your browser with a live before/after slider, honest byte
savings and one-click export.
Reduza PNG, JPEG e WebP inteiramente no navegador com slider antes/depois ao vivo, economia de
bytes honesta e exportação em um clique.

Category: 03 Media Lab · Engine: local `<canvas>` decode + `toBlob` re-encode · 100% local ·
no dependencies.

## Usage · Uso

- **Source** — drop a raster image (PNG, JPEG, WebP, GIF, BMP), click the dropzone, or generate a
  local 1200×800 sample. · Origem — solte uma imagem raster, clique na dropzone ou gere um exemplo local.
- **Quality & format** — quality 10–100 with live value; output keeps the source format or forces
  JPEG / WebP / PNG. · Qualidade e formato — 10–100 ao vivo; mantém a origem ou força JPEG/WebP/PNG.
- **Before / after** — drag the cyan handle (or arrow keys) to wipe between original and compressed,
  or switch to side-by-side panes. · Antes/depois — arraste a alça ciano (ou setas) ou use lado a lado.
- **Metrics** — original bytes, compressed bytes, savings % (green when down, amber when up) and
  output dimensions + format. · Métricas — bytes originais, comprimidos, economia % e dimensões/formato.
- **Export** — download `<name>-comprimido.<ext>`; replace or remove the image at any time.
  **Exportação** — baixe `<nome>-comprimido.<ext>`; troque ou remova quando quiser.
- **Persistence** — only quality / format / compare-mode survive reload
  (`localStorage`, key `vistanology:image-compress`); the image itself is never stored.
  **Persistência** — só qualidade/formato/modo sobrevivem ao reload; a imagem nunca é armazenada.

## Privacy · Privacidade

Decoding and re-encoding happen on a local canvas; the image is never uploaded and never persisted.
A busy indicator (`…` + disabled download) is shown while the encoder runs so metrics are never stale.
Decodificação e recodificação rodam em canvas local; a imagem nunca é enviada nem persistida.
Um indicador de ocupado (`…` + download desabilitado) aparece durante o encode para nunca mostrar métrica velha.

## Limits · Limites

- PNG output is lossless — the quality slider only affects JPEG/WebP (a hint explains this).
  PNG é sem perdas — o slider só afeta JPEG/WebP (um hint explica).
- Savings can be negative: re-encoding an already-optimal file may grow it; the metric shows the truth.
  A economia pode ser negativa; a métrica mostra a verdade.
- GIF/BMP are decoded but animation is not preserved — only the first frame is re-encoded.
  GIF/BMP são decodificados, mas só o primeiro quadro é recodificado.
- SVG is rejected by design (vector) with a pointer to SVG Studio.
  SVG é rejeitado por design (vetorial) com indicação ao SVG Studio.
- Output keeps the source pixel dimensions; resizing is a separate tool (Image Resizer).
  A saída mantém as dimensões de origem; redimensionar é outra ferramenta.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Sample & honest baseline** — the generated sample is `exemplo-vistanology.png`, 1 249 118 B
  (1.19 MB), 1200×800. PNG→PNG reports `−0.0%` (lossless re-encode of the same pixels), not a fake saving.
  Exemplo e linha de base honesta conferidos (PNG→PNG = −0.0%).
- **Quality monotonicity (byte-exact)** — JPEG on the sample: q80 = 88 496 B (86.4 KB, −92.9%),
  q30 = 18 736 B (18.3 KB, −98.5%), q10 = 7 456 B (7.3 KB). The UI metrics matched a direct
  `canvas.toBlob` ground-truth encode byte-for-byte at all three qualities. WebP q80 ≈ 11.6 KB.
  Monotonicidade de qualidade conferida byte a byte contra o encoder direto; WebP medido.
- **Busy state** — during an encode the compressed/saved metrics read `…` and the download button is
  disabled; both resolve when the callback lands (a stale-metrics gap was found and fixed).
  Estado de ocupado conferido; um gap de métrica velha foi encontrado e corrigido.
- **Exports** — download produced `exemplo-vistanology-comprimido.jpg` (`image/jpeg`, 88 496 B at q80,
  18 736 B at q30); `createImageBitmap` on the exported blob confirmed 1200×800.
  Exportações conferidas (nome, tipo, tamanho e dimensões do blob exportado).
- **Compare slider** — real key presses on the focused handle: ArrowRight 75→77, Shift+ArrowRight
  77→87, Home→0, End→100 (`aria-valuenow` tracked); a pointer drag to 75% set `--pct:75%`.
  Slider conferido com teclado real e arraste de ponteiro.
- **Side-by-side** — the mode tab hides the handle and lays the panes out relative; switching back to
  slider restores the wipe. · Lado a lado conferido (alça oculta, painéis relativos) e volta ao slider.
- **Invalid files** — dropping `notes.txt` → “unsupported file” toast; `icon.svg` → “SVG is vector”
  toast; corrupt PNG bytes → “could not decode” toast; the loaded image survived all three.
  Arquivos inválidos conferidos (texto / SVG / PNG corrompido) sem perder a imagem carregada.
- **Clear** — Remove returns to the empty state and clears the meta line. · Limpar conferido.
- **Persistence** — quality 65 / WebP / side-by-side restored after reload; the image was NOT
  persisted (empty state on a fresh load). · Persistência conferida; imagem não persistida.
- **Lifecycle** — three library↔tool remounts produced zero toasts and zero console errors; settings
  stayed stable across remounts. · Três remontagens sem listeners duplicados.
- **i18n & shell** — full EN/PT labels; docs render summary / 5 usage steps / 4 limits / privacy;
  hub shows “9 FERRAMENTAS”, library shows 9 cards including `image-compress`.
  Bilíngue e integração conferidas (hub e library = 9).
- **Responsive** — 320/375/768/1280 with a loaded image: no horizontal overflow; layout collapses to
  one column ≤768 and metrics to two columns ≤768 (four at 1280); side-by-side panes stack ≤480.
  Sem overflow em nenhuma largura; colunas conferidas.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/image-compress-desktop.png`](shots/image-compress-desktop.png) (1280 px),
[`shots/image-compress-mobile.png`](shots/image-compress-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- JPEG encoding of the noisy 1200×800 sample takes ~1 s in the embedded browser, so probes wait
  ≥1.5 s per encode; an early probe misread a persisted quality-30 result as “q80 unchanged” — a
  direct-encoder ground truth proved the app correct (no bug). · Encode JPEG ~1 s; sondagens esperam
  ≥1,5 s; um falso alarme inicial foi descartado com prova direta do encoder.
- The host preview panel is fixed at 592 px, so the desktop shot is a full-page capture of a
  same-origin 1280×900 iframe (shell hidden) and the mobile shot a 375×785 iframe cropped to 375×784;
  no physical device was available. · Captura desktop via iframe 1280×900 e mobile via iframe recortado.