# Image Resizer · v1.0.0

Resize images locally by percent, exact pixels or a fit box, with aspect lock, resampling quality and
a live preview.
Redimensione imagens localmente por percentual, pixels exatos ou caixa, com trava de proporção,
qualidade de reamostragem e prévia ao vivo.

Category: 03 Media Lab · Engine: local `<canvas>` `drawImage` resample + `toBlob` re-encode ·
100% local · no dependencies.

## Usage · Uso

- **Source** — drop a raster image (PNG, JPEG, WebP, GIF, BMP), click the dropzone, or generate a local
  1200×800 grid sample. · Origem — solte uma imagem raster, clique na dropzone ou gere um exemplo local.
- **Sizing mode** — percent (1–400%), exact pixels (width/height), or fit within a max box; tabs switch
  mode. · Modo — percentual (1–400%), pixels exatos ou caber numa caixa máxima; abas alternam o modo.
- **Aspect lock** — in pixels mode, locking makes editing one side derive the other from the source
  ratio. · Trava de proporção — no modo pixels, editar um lado deriva o outro pela razão de origem.
- **Resampling** — high (smooth), medium, or low (nearest-neighbour / pixelated).
  **Reamostragem** — alta (suave), média ou baixa (vizinho mais próximo / pixelada).
- **Output** — keep source format or force PNG/JPEG/WebP; quality 10–100 for lossy formats.
  **Saída** — mantém a origem ou força PNG/JPEG/WebP; qualidade 10–100 nos formatos com perdas.
- **Preview & metrics** — live resized preview on a checker board; original dims, new dims, scale % and
  real output bytes; an honest warning when upscaling. · Prévia e métricas ao vivo; aviso honesto ao ampliar.
- **Export** — download `<name>-<w>x<h>.<ext>`; replace or remove at any time.
  **Exportação** — baixe `<nome>-<w>x<h>.<ext>`; troque ou remova quando quiser.
- **Persistence** — only settings survive reload (`localStorage`, key `vistanology:image-resize`); the
  image is never stored. · Persistência — só configurações sobrevivem ao reload; a imagem nunca é armazenada.

## Privacy · Privacidade

Resizing and re-encoding happen on a local canvas. The image is never uploaded and never persisted.
Redimensionamento e recodificação rodam em canvas local. A imagem nunca é enviada nem persistida.

## Limits · Limites

- Dimensions are clamped to 1–8000 px per side (canvas safety limit).
  Dimensões limitadas a 1–8000 px por lado.
- Upscaling beyond 100% interpolates pixels; it cannot recover detail that is not there (a warning shows).
  Ampliar além de 100% interpola pixels; não recupera detalhe inexistente (um aviso aparece).
- Low resampling is nearest-neighbour (pixelated); high uses smooth interpolation.
  Reamostragem baixa é vizinho mais próximo; alta usa interpolação suave.
- GIF/BMP are decoded but animation is not preserved: only the first frame is resized.
  GIF/BMP são decodificados, mas só o primeiro quadro é redimensionado.
- SVG is rejected by design (vector) with a pointer to SVG Studio.
  SVG é rejeitado por design (vetorial) com indicação ao SVG Studio.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Empty state** — mounts with no image and no console error (an unguarded `outType()` read of a null
  source was found and fixed before testing). · Estado vazio monta sem erro (um acesso não guardado foi corrigido).
- **Percent** — sample 1200×800 at 50% → metrics `600×400`, scale `50%`; export
  `exemplo-vistanology-600x400.png` and `createImageBitmap` confirmed 600×400.
  Percentual conferido (métricas + dimensões do blob exportado).
- **Pixels + aspect lock** — switching to pixels initialized 1200×800; with lock on, width 300 derived
  height 200 (`300×200`); with lock off, height 100 left width 300 (`300×100`).
  Pixels e trava conferidos (deriva com trava; independente sem trava).
- **Fit box** — max 400×400 on the 1200×800 source → `400×267` (33%), the contain ratio.
  Caixa conferida (razão contain).
- **Upscale warning** — percent 200 → `2400×1600` and the upscale hint became visible.
  Aviso de ampliação conferido.
- **Resampling** — high vs low produced different output bytes (158.4 KB vs 157.9 KB), proving the
  smoothing setting actually changes the resample. · Reamostragem conferida (bytes diferentes high/low).
- **Invalid files** — txt / SVG / corrupt PNG produced three distinct localized toasts and kept the
  loaded image. · Arquivos inválidos conferidos sem perder a imagem.
- **Clear** — Remove returns to the empty state. · Limpar conferido.
- **Persistence** — fit mode / 512×400 / low / WebP / lock-off restored after reload; the image was NOT
  persisted. · Persistência conferida; imagem não persistida.
- **Lifecycle** — three library↔tool remounts produced zero toasts and zero console errors; settings
  stable. · Três remontagens sem listeners duplicados.
- **i18n & shell** — full EN/PT labels; docs render summary / 5 usage steps / 5 limits / privacy; hub
  shows “11 FERRAMENTAS”, library shows 11 cards including `image-resize`.
  Bilíngue e integração conferidas (hub e library = 11).
- **Responsive** — 320/375/768/1280 with a loaded image: no horizontal overflow; layout one column
  ≤768 (two at 1280); metrics two columns ≤768 (four at 1280); preview 260 px ≤480 else 360 px.
  Sem overflow em nenhuma largura; colunas e altura da prévia conferidas.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/image-resize-desktop.png`](shots/image-resize-desktop.png) (1280 px),
[`shots/image-resize-mobile.png`](shots/image-resize-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- The host preview panel is fixed at 592 px, so the desktop shot is a full-page capture of a
  same-origin 1280×900 iframe (shell hidden) and the mobile shot a 375×785 iframe cropped to 375×784;
  no physical device was available. · Captura desktop via iframe 1280×900 e mobile via iframe recortado.