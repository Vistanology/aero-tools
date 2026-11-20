# Palette Extractor · v1.0.0

Read an image locally and get the palette it actually contains: median-cut colours with the share of pixels each one
holds, the WCAG ratio between every pair, and CSS or JSON you can drop straight into a stylesheet.
Leia uma imagem localmente e receba a paleta que ela realmente contém: cores por median cut com a participação de
pixels de cada uma, a razão WCAG entre cada par e CSS ou JSON prontos para a folha de estilo.

Category: 01 Creative Studio · Engine: median cut over the pixels the browser samples with `getImageData`, deterministic
tie-broken sorts, exports serialized from the same result object · 100% local · no dependencies.

## Usage · Uso

- **Source** — drop a PNG/JPEG/WebP/GIF/BMP, pick one, or press *Use sample*. The sample is four flat 100 × 100
  quadrants, so its answer is known before the image is read: exactly `#026DA7 #7ED321 #F5A623 #4A235A` at 25 % each.
  · **Imagem** — arraste, escolha ou use o exemplo; o exemplo tem resposta conhecida.
- **Colours requested** — 2–16 boxes. Median cut splits by pixel count, so asking for fewer colours than the image
  holds merges them, and asking for more than it holds returns fewer rather than inventing any. · **Cores pedidas** —
  pedir menos une, pedir mais não inventa.
- **Sampling resolution** — 60–400 px on the long edge; the reading line reports the grid actually sampled, so you can
  see that a 200 px image at 140 px was read as 140 × 140 = 19 600 pixels. A budget larger than the image never
  upscales it. · **Resolução** — o resumo informa a grade realmente lida; nunca amplia.
- **Skip transparent pixels** — on by default. Fully transparent pixels are dropped and counted; with the switch off
  they join the sample as their stored RGB, which is usually black and pulls the palette dark. · **Ignorar
  transparentes** — ligado por padrão; desligado, entram como o RGB armazenado.
- **Order** — by share, by lightness or by hue; equal populations fall back to the hex string so the order is stable
  across renders. · **Ordem** — participação, brilho ou matiz; empate se resolve pelo hex.
- **Swatches** — hex, share and HSL per colour; the label ink is picked from whichever of black or white reads better
  on that exact colour, and clicking copies the hex. · **Amostras** — hex, participação e HSL; clique copia.
- **Reading** — requested versus returned, sampled pixels with the grid, transparent skipped, lightest and darkest
  with their luminance, near-grey count, dominant hue, share-weighted mean luminance. · **Leitura** — pedidas versus
  retornadas, pixels, ignorados, mais clara e mais escura, quase-cinza, matiz dominante, luminância média.
- **Contrast** — every unordered pair of the six leading colours, strongest first, with AA / AA-large / not-readable
  badges from the WCAG relative-luminance formula. · **Contraste** — pares das seis principais, do mais forte ao mais
  fraco.
- **Export** — a `:root` custom-property block (live in the textarea, copyable, downloadable), a JSON file with the
  sampling parameters and per-colour rgb/hsl/share/contrast, and a plain hex list. · **Exportar** — CSS, JSON e lista
  de hex.
- **Persistence** — only the four settings (colour count, resolution, order, transparent switch) survive reload under
  `localStorage` key `vistanology:palette-extractor`. The image, the sampled pixels and the palette live in memory and
  disappear when you leave the view. · Só os quatro ajustes são lembrados.

## Privacy · Privacidade

The file is read as bytes in memory, decoded by the browser and sampled through a canvas; nothing is uploaded, no fetch
is issued, no pixel data reaches IndexedDB (`VT.db` is never opened by this tool) and the only persisted value is the
four settings. Leaving the view or loading a file that fails to decode clears the bench, so an error is never shown
next to a palette that no longer has a source.
O arquivo é lido em memória e amostrado por um canvas; nada é enviado, nada vai ao IndexedDB e só os quatro ajustes
ficam no localStorage. Sair da view limpa a bancada.

## Limits · Limites

- Median cut is a fast, deterministic approximation, not a perceptual colour model: it splits along the widest channel
  of a box, so a photograph can return several near-identical blues and miss a small but meaningful colour. The merge
  step folds exact duplicate hexes only.
  Median cut é aproximação determinística, não modelo perceptual.
- The reported share belongs to the sampled grid, not to the original image: scaling averages neighbouring pixels, so
  thin lines and hard edges are under-represented. Raise the resolution to check a detail.
  A participação pertence à grade amostrada.
- Transparency is skipped by default. A semi-transparent colour is sampled as the RGB the browser decoded, and a PNG
  that carries alpha can hand back a tight band of near-values rather than one exact number; those pixels stay in one
  box, but the box mean is then an average of that band.
  Pixels semitransparentes entram com o RGB decodificado.
- Contrast is computed for the sRGB values as given. It says nothing about the background the colour will sit on in
  your interface, about images behind text, or about how the palette looks to a colour-blind viewer.
  O contraste usa os valores sRGB como estão.

## Verified · Verificado

Run in headless Chromium against the local preview (`node serve.js`), harness `_dev/qa-palette-qoder.js`
(155 assertions, 0 failed), the Node-side algorithm probe `_dev/probe-palette.js` (384 probes, 0 failed) and
`_dev/qa-newtool-responsive-qoder.js` (10 probes, 0 failed):

- **Algorithm, outside the browser** — `_dev/probe-palette.js` loads `channelRange`, `cmpChannel` and `medianCut` out
  of `js/apps/palette-extractor.js` and exercises them directly: k = 1 is the mean of the sample; four flat quadrants
  of 2 500 px each come back as exactly those four colours at n = 2 500 for every k ≥ 4; populations always sum to the
  input; boxes never exceed k; a flat input stops the loop instead of inventing boxes; a shuffled input yields an
  identical palette; a 0–255 greyscale ramp at k = 4 yields four ascending quartile means; 60 seeded random clouds
  re-check all of the above. · O algoritmo é testado fora do navegador.
- **Sample palette** — the four quadrant hexes, 25.0 % each, 40 000 sampled pixels at 200 × 200, and every HSL string
  recomputed by the harness from the published conversion. · Paleta do exemplo conferida dígito a dígito.
- **Reading recomputed** — lightest `#7ED321 · L 51.1`, darkest `#4A235A · L 3.4`, near-grey 0 / 4, dominant hue and
  the share-weighted mean luminance are all recomputed with a harness-side WCAG implementation instead of trusted.
  Todos os números do resumo são recalculados pelo harness.
- **Contrast matrix** — the six unordered pairs, ordered strongest first; each displayed ratio equals the truncated
  true value and each badge follows the true ratio, not the rounded text. · Pares, ordem, truncamento e selos.
- **Count and resolution sweeps** — k = 2 merges to two 50 % boxes, k = 4 recovers the quadrants, k = 16 still returns
  four and reports `16 / 4`; resolution 60 samples 3 600 pixels and keeps 25 % shares, resolution 400 never upscales a
  200 px image. · Varreduras de contagem e resolução.
- **Transparency through the drop handler** — a PNG built in the page with one fully transparent quadrant is fed
  through a real `DataTransfer` drop: 30 000 sampled, 10 000 skipped, and the three remaining hues come back pure at
  33.3 % each. Switching the skip off adds the stored black at 25 %. · Transparência medida pelo handler real.
- **File picker path** — PNG bytes made in the page are handed to the input through a `filechooser`, and the same
  four colours appear; the dropzone is reachable by keyboard (`Enter`) and the input value is reset so the same file
  can be picked twice. · Caminho do seletor de arquivo.
- **Failure states** — a text file is refused with a toast and leaves the palette untouched; a truncated PNG clears
  the swatches, the reading rows, the contrast table, the export box, the preview and the source line, and disables
  every export; an all-transparent image reports that it has no visible pixels. · Estados de falha limpos.
- **Exports** — the CSS block equals the palette in DOM order with lowercase hexes and the share in each comment; the
  downloaded CSS, JSON and hex files are read back from disk, and the JSON is checked colour by colour for rgb/hex
  agreement, shares summing to 100, hsl and contrast against the harness math. · Arquivos baixados relidos.
- **Privacy** — after loading the sample, `localStorage` holds exactly one key with exactly the four setting fields and
  no `data:`/base64 payload, `VT.db.count()` stays 0, and neither the palette nor the image survives a reload or a
  visit to another view. · Promessa de privacidade medida.
- **Persistence** — k = 5, resolution 140, hue order and the skip switch off are restored after a reload, and the
  restored readouts match the controls. · Ajustes restaurados.
- **i18n** — the `pe.*` keys are present in EN and PT (`_dev/scan-i18n-parity.js`: PARITY FAILURES: 0); in PT the
  status line, the eight reading labels, the badges, the rejection toast and the privacy line render with no raw key,
  and the same image under the same settings yields the same numbers. · Paridade bilíngue conferida.
- **Contrast** — `_dev/probe-contrast2.js`: 34 text elements sampled on this view, 0 below AA. · 34 elementos, 0 falhas.
- **Responsive** — 1440/1280/1024/768/390/375 in glass, plus Transparency = Solid and Motion = Reduced at 1440 and
  375, with a real palette extracted: no horizontal overflow, console clean. · Sem overflow em nenhuma largura.
- **Docs contract** — `_dev/qa-docs-all.js`: 37 pages, 0 failures; this page's Summary/How to use/Privacy/Limits all
  render from the registry arrays. · Página dentro do contrato.

Two defects were caught by these runs rather than by looking at the screen. Median cut originally cut at half the
pixel count, which bisects a long run of identical colours: a red/green/blue image with one transparent quadrant came
back with `#AA5500` as its 50 % dominant colour — a colour the image never contained. The cut now moves to the nearest
real colour boundary, and that image returns three pure hues. And a 2.995:1 pair displayed as `3.00:1` under a
*not readable* badge, so ratios are truncated instead of rounded: the tool never claims more contrast than it measured.
Duas falhas saíram destas execuções, não do olho: o corte por contagem dividia runs idênticos e inventava `#AA5500`;
e `2,995:1` aparecia como `3,00:1` sob o selo "ilegível". Agora o corte busca a fronteira real e a razão é truncada.

Screenshots: [`shots/palette-extractor-desktop.png`](shots/palette-extractor-desktop.png) (1280 px),
[`shots/palette-extractor-mobile.png`](shots/palette-extractor-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- Both the app and the harness implement median cut and WCAG luminance from the published descriptions. They agree,
  and the Node probe pins the algorithm to hand-computed cases, but neither is checked against a reference colour
  library such as `node-vibrant` or against a spectrophotometer reading.
  As duas implementações são nossas; nenhuma biblioteca de referência.
- The transparency cases were built with canvas-encoded PNGs. Real-world files from cameras, design tools or
  EXIF-rotated JPEGs were not sampled, and colour profiles (Display P3, CMYK-derived JPEGs) are ignored: the browser
  hands over decoded sRGB and that is what is measured.
  Perfis de cor não são considerados.
- Photo inputs were exercised through the resolution and count sweeps with synthetic clouds in the Node probe, not with
  a corpus of real photographs, so "which colour dominates a portrait" remains a judgement call you should verify on
  the swatch grid.
  Retatos reais não foram amostrados.
