# Color Studio · v1.0.0

Harmony palettes with locks, a precision inspector, image color extraction and WCAG contrast.
Paletas com harmonias e travas, inspector de precisão, extração de cores de imagem e contraste WCAG.

Category: 01 Creative Studio · Engine: own color math + k-means · 100% local.

## Usage · Uso

- **Palette stage** — five swatches. Click a swatch to copy its HEX; use the picker or HEX field
  to edit; lock a swatch to keep it while the others regenerate.
  **Palco da paleta** — cinco amostras. Clique para copiar o HEX; edite pelo picker ou campo HEX;
  trave uma amostra para mantê-la ao regenerar as demais.
- **Harmonies** — random, complementary, analogous, triadic, split-complementary, monochromatic.
  **Harmonias** — aleatória, complementar, análoga, triádica, complementar dividida, monocromática.
- **Inspector** — live preview plus HEX / RGB / HSL fields, each editable, each copyable.
  Invalid HEX reverts with a toast. · HEX inválido reverte com toast.
- **Contrast (WCAG 2.1)** — foreground/background pickers + HEX, swap, relative-luminance ratio,
  sample text and four verdicts: AA normal, AA large, AAA normal, AAA large.
  **Contraste (WCAG 2.1)** — razão de luminância relativa e quatro vereditos AA/AAA.
- **Image extraction** — drop or pick an image; k-means clusters its pixels into up to six dominant
  colors; copy a chip or apply the whole set as your palette.
  **Extração de imagem** — solte uma imagem; k-means agrupa os pixels em até seis cores dominantes.
- **Export** — CSS custom properties (`--vistanology-1…5`), plain HEX list, or JSON.
  **Exportar** — variáveis CSS, lista HEX ou JSON.

## Privacy · Privacidade

Images are read with `FileReader` and drawn to an in-memory canvas only. No upload, ever.
Imagens são lidas com `FileReader` e desenhadas apenas em canvas na memória. Nunca há upload.

## Limits · Limites

- Extraction samples ≤4000 pixels and runs 10 k-means iterations: fast and approximate by design.
  A extração amostra ≤4000 pixels com 10 iterações: rápida e aproximada por design.
- Transparent pixels are ignored; fully transparent images yield no colors.
  Pixels transparentes são ignorados.
- Contrast verdicts follow WCAG 2.1 thresholds (4.5 / 3 / 7 / 4.5).
  Vereditos seguem os limiares WCAG 2.1.

## Verified · Verificado

Analogous harmony hues at exact 15° steps; locks preserved across regeneration; HEX/RGB/HSL edit
paths and invalid-HEX revert; ratio 17.96:1 for `#071827` on `#FFFFFF` matches the WCAG formula;
pass/fail cells correct for high and low contrast pairs; extraction recovered four exact colors
from a synthetic test image; export modal produces valid CSS/JSON.
Harmonias análogas em passos de 15°; travas preservadas; caminhos HEX/RGB/HSL e reversão de HEX
inválido; razão 17.96:1 confere com a fórmula WCAG; extração recuperou quatro cores exatas;
exportação CSS/JSON válida.