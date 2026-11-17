# SVG Studio · v1.0.0

Inspect, sanitize, optimize, recolor and export SVG — parsed and rasterized entirely in your browser.
Inspecione, sanitize, otimize, recolora e exporte SVG — lido e rasterizado inteiramente no seu navegador.

Category: 01 Creative Studio · Engine: DOMParser + XMLSerializer + Canvas 2D · 100% local · no dependencies.

## Usage · Uso

- **Source** — paste SVG code or drop an `.svg` file (up to 512 KB). It is parsed, sanitized and
  previewed immediately; three built-in samples (Mark, Chart, Icon) demonstrate the pipeline.
  **Código** — cole SVG ou solte um `.svg` (até 512 KB); lido, sanitizado e pré-visualizado na hora;
  três exemplos embutidos.
- **Preview** — zoom Fit / 100% / 200% and background dark / light / checker to judge the artwork.
  **Pré-visualização** — zoom Ajustar / 100% / 200% e fundo escuro / claro / xadrez.
- **Inspector** — width, height, viewBox, element / path / gradient counts, byte size, optimized
  size and percentage saved. · Inspetor com dimensões, viewBox, contagens, tamanho e economia.
- **Colors found** — every explicit fill/stroke/stop-color hex; click a chip to make it the recolor
  source, pick a target and apply across the whole document.
  **Cores encontradas** — clique numa cor para recolorir a partir dela em todo o documento.
- **Optimize** — safe, render-preserving passes: remove comments, metadata/title/desc, collapse
  whitespace, drop empty groups, shorten hex colors, round number precision (0–4).
  **Otimizar** — passes seguros que preservam a renderização.
- **Export** — copy the sanitized SVG, download the `.svg`, or rasterize to PNG at 1×/2×/4×.
  **Exportar** — copiar SVG, baixar `.svg` ou rasterizar em PNG 1×/2×/4×.
- **Persistence** — code, zoom, background, optimize toggles, precision, recolor pair and PNG scale
  survive navigation and reload (`localStorage`, key `vistanology:svg-studio`).
  **Persistência** — tudo sobrevive à navegação e ao reload.

## Privacy · Privacidade

SVG is parsed with DOMParser and rasterized with Canvas in memory. Unsafe nodes/attributes are
stripped **before** anything is rendered or exported. No upload, no network request, no telemetry.
O SVG é lido com DOMParser e rasterizado com Canvas na memória. Nós/atributos inseguros são
removidos antes de qualquer renderização ou exportação. Sem upload, sem rede, sem telemetria.

## Limits · Limites

- Sanitizing removes `<script>`, event handlers (`on*`), `foreignObject`, embedded media,
  `javascript:` URLs, external `href`/`xlink:href`, external `url(...)` and `@import`; such SVGs
  render without those parts. Internal `url(#…)` references and embedded raster `data:image/*`
  are kept. · A sanitização remove scripts, handlers, foreignObject, URLs javascript:, referências
  externas e @import; referências internas `url(#…)` e raster embutido são mantidos.
- Optimization is conservative: it never strips inherited presentation defaults, so rendering
  stays identical. · Otimização conservadora: nunca remove defaults herdados.
- Number precision rounds coordinates; very high precision loss can shift hairline geometry.
  Precisão numérica arredonda coordenadas; perda alta pode deslocar geometrias finas.
- PNG uses the SVG intrinsic size (width/height or viewBox); percentage-only sizes fall back to
  viewBox or 300×150. · PNG usa o tamanho intrínseco; só-% cai para viewBox ou 300×150.
- Source capped at 512 KB; larger input is rejected to keep the editor responsive.
  Código limitado a 512 KB.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`, reading exported bytes/pixels back:

- **Pipeline** — Mark sample: 476 B, 8 elements, 1 path, 1 gradient, viewBox `0 0 120 120`,
  colors `#5FE6FF / #8FA0FF / #0A1B2E`; optimized preview 414 B (13% saved). Applying optimize
  rewrote the source 476→414 B and removed the comment. · Pipeline e otimização conferidos.
- **Zoom / background** — 200% sets the rendered width to 240 px (2×120); dark/light/checker
  switch independently of zoom (two separate tab lists, selection preserved).
  Zoom e fundo independentes, largura 240 px em 200%.
- **Recolor** — clicking the `#8FA0FF` chip set it as source; target `#FFD08A` applied and the
  palette updated to `#5FE6FF / #FFD08A / #0A1B2E` (source color fully replaced).
  Recoloração por chip + HEX conferida.
- **Sanitize (security)** — a well-formed hostile SVG carrying `<script>`, `onload`,
  `javascript:` href, `foreignObject`, external `<use>`, `data:image/svg+xml` `<image>`,
  external `url()` in `style` and `@import` in `<style>` reported **8 removed items**; the live
  preview contained no script/foreignObject and the safe `stroke:#5FE6FF` survived. Copy and
  download payloads were re-checked and contain none of the unsafe constructs.
  SVG hostil sanitizado (8 itens removidos); preview e exports limpos.
- **Export** — copy payload clean (359 chars); `vistanology-svg.svg` clean; PNG at 2× measured
  200×200 `image/png` named `vistanology-svg-2x.png`. · Exportações conferidas byte/pixel.
- **Validation** — unclosed tag → “not well-formed XML” line; non-`<svg>` root → root error;
  valid input re-enables exports; Clear returns to the empty state with exports disabled and the
  inspector hidden. · Validação e estado vazio conferidos.
- **Persistence** — chart source (493 chars) + zoom 100% + light background + metadata toggle all
  restored after a full reload (rendered width 200 px). · Persistência conferida no reload.
- **Lifecycle & keyboard** — three library↔tool remounts produced exactly one optimize toast (no
  duplicated listeners); ArrowRight on the zoom tab list moves selection.
  Três remontagens sem listeners duplicados; teclado nas abas.
- **i18n & shell** — full PT labels with no raw keys; docs render 6 usage steps / 5 limits / 0 deps;
  hub shows 5 tools; library search `svg`→3 and `vector`→1. · Bilíngue e integração conferidas.
- **Responsive** — same-origin iframes at 320/375/768/1280: `scrollWidth == clientWidth`, no element
  outside the viewport; ≤480 the zoom/background bars stack full-width. · Sem overflow.
- Console clean (no errors/warnings) throughout. · Console limpo.

Screenshots: [`shots/svg-studio-desktop.png`](shots/svg-studio-desktop.png),
[`shots/svg-studio-mobile.png`](shots/svg-studio-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- Clipboard success verified with a stub (the embedded document is never focused, so real writes
  are denied); the denial path shows an honest error toast. · Clipboard via stub; negação real
  mostra toast honesto.
- Mobile screenshot uses a same-origin 375×785 iframe cropped from a viewport capture; no physical
  device was available. · Captura mobile via iframe 375×785.