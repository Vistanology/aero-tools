# Gradient Lab · v1.0.0

Linear, radial and conic gradients with a live stage, stop editing and CSS/PNG/SVG export.
Gradientes lineares, radiais e cônicos com palco ao vivo, edição de paradas e export CSS/PNG/SVG.

Category: 01 Creative Studio · Engine: own gradient math + Canvas 2D · 100% local · no dependencies.

## Usage · Uso

- **Type** — Linear / Radial / Conic tabs. Controls adapt: linear shows the angle, radial shows
  shape + center, conic shows start angle + center.
  **Tipo** — abas Linear / Radial / Cônico. Os controles se adaptam ao tipo escolhido.
- **Angle** — slider 0–360° plus eight quick chips (0/45/90/135/180/225/270/315).
  0° points up, 90° points right, matching CSS. · 0° aponta para cima, 90° para a direita, como no CSS.
- **Stops** — up to eight. Each row has a color picker and a position (0–100%). Add inserts a stop
  in the largest gap; remove is disabled at two stops. Reverse, distribute evenly and randomize
  colors are one click away. · Até oito paradas; adicionar insere na maior lacuna; remover é
  desabilitado com duas; inverter, distribuir e aleatorizar em um clique.
- **Presets** — Aurora, Sunset, Ocean, Forest, Neon, Ice. Applying a preset also switches type,
  angle/center and shape. · Aplicar um preset também troca tipo, ângulo/centro e forma.
- **Export** — copy the CSS snippet, download PNG at 512/1024/2048 px (16:10) or SVG
  (linear and radial). Stage, CSS and exports always agree.
  **Exportar** — copiar o CSS, baixar PNG em 512/1024/2048 px (16:10) ou SVG (linear e radial).
- **Persistence** — type, angle, shape, center, stops and export width survive navigation and
  reload (`localStorage`, key `vistanology:gradient-lab`).
  **Persistência** — tudo sobrevive à navegação e ao reload.

## Privacy · Privacidade

Gradients are computed and rasterized in memory with Canvas 2D. No network request, no upload,
no telemetry. · Gradientes são calculados e rasterizados na memória. Nenhuma requisição de rede.

## Limits · Limites

- SVG has no conic primitive: the SVG button is disabled for conic gradients (with an explanation).
  SVG não tem primitiva cônica: o botão SVG fica desabilitado no cônico.
- Conic PNG needs `createConicGradient` (Chrome 99+, Safari 16.4+, Firefox 112+). Without it the
  app shows an error toast and exports nothing instead of failing silently.
  PNG cônico exige `createConicGradient`; sem ele, um toast de erro e nenhuma exportação.
- Stops are always emitted in ascending position order — the same fix-up browsers apply to CSS
  gradients — so an out-of-order edit list never changes the result.
  As paradas são sempre emitidas em ordem crescente, como os navegadores fazem com CSS.
- Positions are clamped to 0–100 and rounded to integers; non-numeric input becomes 0.
  Posições são limitadas a 0–100 e arredondadas; entrada não numérica vira 0.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`, reading real exported pixels back through
`createImageBitmap` + `getImageData`:

- **Linear geometry** — red→blue at 0/45/90/180/225/270°: corners and center match CSS semantics
  (0° bottom = 0%, 90° left = 0%, 45° bottom-left = 0% and top-right = 100%, center = 50%,
  perpendicular corners symmetric). · Cantos e centro conferem com a semântica CSS.
- **Cross-format consistency** — with an intentionally unsorted edit list (`0,100,25,75`), CSS,
  PNG and SVG returned identical samples: `(250,5,0) / (0,255,0) / (253,253,0) / (3,3,252)`.
  Com a lista de edição fora de ordem, CSS, PNG e SVG devolveram amostras idênticas.
- **Radial** — circle at center: center `#9DEAFF`, farthest corner `#0A1B2E`, mid-top
  `(46,150,193)` equals the computed farthest-corner interpolation. Ellipse: mid-top and mid-right
  both ≈`(33,104,138)` as expected for farthest-side × √2. At `bottom right`, the rasterized SVG
  matched the PNG pixel-for-pixel. · Radial círculo/elipse e SVG rasterizado conferem com o PNG.
- **Conic** — from 0°: up `#5FE6FF`, 126° `#8FA0FF` (exact), 252° `#F50F73` (exact); from 90° the
  start moves to the right. A 90° canvas/CSS origin mismatch was found and fixed during this run.
  Um descompasso de 90° entre canvas e CSS foi encontrado e corrigido nesta verificação.
- **Degenerate stops** — eight stops all at 50% produce a hard transition (white left, black right)
  in PNG and eight `<stop>` elements in SVG, without errors. · Oito paradas em 50% sem erros.
- **Exports** — 2048 px PNG measured 2048×1280, 587,731 bytes, named
  `vistanology-gradient-linear-2048.png`; conic PNG named `…-conic-512.png`.
- **Guards** — min 2 / max 8 stops with toasts; clamping of `-30 → 0` and `250 → 100`; `abc → 0`;
  conic SVG disabled; `createConicGradient` removed at runtime → error toast, zero exports, zero
  exceptions. · Guardas de mínimo/máximo, clamp e caminho de erro do cônico sem exceções.
- **Editing UX** — focus stays in the same input while typing a position or picking a color;
  committing with Enter re-sorts the list and restores focus/selection.
  O foco permanece no mesmo campo durante a digitação; Enter reordena e devolve o foco.
- **Lifecycle** — four library↔tool round trips kept a single layout and no duplicated listeners
  (one click on “Add stop” added exactly one stop). State persisted and restored exactly.
  Quatro ciclos de navegação sem listeners duplicados; estado restaurado exatamente.
- **Shell integration** — hub shows “3 FERRAMENTAS”; library search `conic` and `gradiente` each
  return one tile; empty state, category filter, favorites toggle and persistence, recents,
  breadcrumb, docs link and version badge all work; `#/docs/gradient-lab` renders 5 usage steps
  and 3 limitations in EN and PT. · Hub, biblioteca, favoritos, docs bilíngues conferidos.
- **Responsive** — same-origin iframes at 375, 768 and 1280 px: `scrollWidth == clientWidth`,
  no element outside the viewport, single column below 1024 px, two columns (814 + 360) at 1280,
  quick chips wrap to two rows. · Sem overflow em 375/768/1280.
- **Robustness** — corrupt `localStorage` JSON falls back to defaults with no console errors.
  JSON corrompido no armazenamento volta aos padrões sem erros.
- **F0 regression** — QR Studio still encodes (29×29 modules, ECC M) and exports PNG + SVG;
  Color Studio still returns 21.00:1 for black/white, reverts invalid HEX with a toast and swaps
  pairs. · QR e Color do F0 continuam funcionando.

### Pending / Limitações do ambiente de teste

- Real key presses and screenshots require the in-app Browser panel to be visible. While it is
  hidden, CDP key events do not reach the page (verified: a focused number input did not change),
  so keyboard handling was exercised with synthetic events — arrow keys, Home/End and wrap on the
  type tabs all behaved correctly. Clipboard write is also blocked while hidden
  (`NotAllowedError`); the copied payload was verified with a stub and matches the CSS exactly.
  Teclas reais e capturas de tela exigem o painel do navegador visível; com o painel oculto a
  área de transferência é bloqueada e o payload foi verificado com stub.
- Viewport resizing is not available in this environment; responsive checks use same-origin
  iframes rendered by the same engine. · Redimensionamento real indisponível; usamos iframes.