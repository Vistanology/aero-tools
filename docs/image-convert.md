# Image Converter · v1.0.0

Batch-convert PNG, JPEG and WebP entirely in your browser with per-file status, transparency-aware
JPEG background and a one-click ZIP.
Converta PNG, JPEG e WebP em lote inteiramente no navegador com status por arquivo, fundo JPEG
ciente de transparência e ZIP em um clique.

Category: 03 Media Lab · Engine: local `<canvas>` decode + `toBlob` re-encode; dependency-free
store-only ZIP writer · 100% local · no dependencies.

## Usage · Uso

- **Queue** — drop several raster images at once (PNG, JPEG, WebP, GIF, BMP) or add two local samples
  (one with transparency). · Fila — solte várias imagens raster de uma vez ou adicione dois exemplos (um com transparência).
- **Target format** — PNG, JPEG or WebP applied to the whole queue; quality 10–100 for lossy formats.
  **Formato-alvo** — PNG, JPEG ou WebP para toda a fila; qualidade 10–100 nos formatos com perdas.
- **JPEG background** — a color picker replaces transparent pixels when converting to JPEG; a hint
  explains why. · Fundo JPEG — um seletor de cor substitui pixels transparentes ao converter para JPEG.
- **Per-file rows** — thumbnail, source format/size/dimensions, a “has transparency” badge, target
  format, output size, size delta and live status (queued / converting / ready / failed).
  **Linhas por arquivo** — thumbnail, formato/tamanho/dimensões de origem, badge de transparência,
  formato-alvo, tamanho de saída, delta e status ao vivo.
- **Export** — download each file, or grab the whole queue as one `.zip`; convert-all and clear-queue
  actions. · Exportação — baixe cada arquivo ou a fila inteira em um `.zip`; converter todas / limpar.
- **Persistence** — only format / quality / background survive reload
  (`localStorage`, key `vistanology:image-convert`); the queue is never stored.
  **Persistência** — só formato/qualidade/fundo sobrevivem ao reload; a fila nunca é armazenada.

## Privacy · Privacidade

Decoding and re-encoding happen on a local canvas; the ZIP is assembled in memory from the converted
blobs. Images are never uploaded and never persisted.
Decodificação e recodificação rodam em canvas local; o ZIP é montado em memória a partir dos blobs
convertidos. As imagens nunca são enviadas nem persistidas.

## Limits · Limites

- PNG output is lossless — quality only affects JPEG/WebP (a hint explains this).
  PNG é sem perdas — a qualidade só afeta JPEG/WebP.
- GIF/BMP are decoded but animation is not preserved: only the first frame is converted.
  GIF/BMP são decodificados, mas só o primeiro quadro é convertido.
- SVG is rejected by design (vector) with a pointer to SVG Studio.
  SVG é rejeitado por design (vetorial) com indicação ao SVG Studio.
- The ZIP uses the store method (no compression): it bundles files, it does not shrink them further.
  O ZIP usa o método store (sem compressão): agrupa arquivos, não os reduz mais.
- Transparency is detected on a 64×64 downscale; a fully-opaque image is never flagged.
  A transparência é detectada em downscale 64×64; imagem opaca nunca é marcada.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Batch & honest baseline** — two samples (271.4 KB 640×420 + 136.4 KB 420×420 = 407.8 KB) queued and
  converted sequentially; PNG→PNG totals `407.8 KB → 407.8 KB` (−0.0%), not a fake saving.
  Lote e linha de base honesta conferidos (PNG→PNG sem economia inventada).
- **Transparency** — only the alpha sample shows the “has transparency” badge; converting to JPEG with
  white background made the formerly-transparent center pixel `[255,255,255,255]`; switching the
  background to `#FF0000` re-converted and the center became `[254,0,0,255]`.
  Transparência conferida: badge só na imagem alpha; centro transparente preenchido com o fundo escolhido.
- **Formats & deltas** — JPEG q90: 8.4 KB (−96.9%) and 8.9 KB (−93.5%); WebP q70: 4.0 KB and 4.3 KB;
  per-row status reached `done` and totals updated live (`2/2 … 407.8 KB → 17.4 KB`).
  Formatos e deltas conferidos (JPEG e WebP) com totais ao vivo.
- **Individual export** — row download produced `exemplo-alpha.jpg` (`image/jpeg`, 9 913 B).
  Exportação individual conferida (nome, tipo, tamanho).
- **ZIP (independent validation)** — “Download all” produced `vistanology-convert.zip`
  (`application/zip`, 18 793 B). The blob was unzipped with **fflate 0.8.2** (a third-party parser, not
  our writer): 2 entries `exemplo-200.jpg` / `exemplo-alpha.jpg`, JPEG magic `FF D8 FF`, sizes
  8 642 / 9 913 B — the latter byte-identical to the individual download.
  ZIP validado por parser independente (fflate): entradas, magic JPEG e tamanhos conferidos.
- **Invalid files** — dropping `notes.txt` / `icon.svg` / corrupt PNG bytes produced three distinct
  localized toasts and left the queue unchanged (2 rows). · Arquivos inválidos conferidos sem alterar a fila.
- **Remove & clear** — removing a row updated totals to `1/1`; clear returned to the empty state and
  disabled the ZIP button. · Remover e limpar conferidos.
- **Persistence** — format WebP / quality 70 / background `#123456` restored after reload; the queue was
  NOT persisted (empty on fresh load). · Persistência conferida; fila não persistida.
- **Lifecycle** — three library↔tool remounts produced zero toasts and zero console errors; settings
  stable across remounts. · Três remontagens sem listeners duplicados.
- **i18n & shell** — full EN/PT labels; docs render summary / 5 usage steps / 4 limits / privacy; hub
  shows “10 FERRAMENTAS”, library shows 10 cards including `image-convert`.
  Bilíngue e integração conferidas (hub e library = 10).
- **Responsive** — 320/375/768/1280 with a loaded queue: no horizontal overflow; layout one column
  ≤768 (two at 1280); rows collapse from 4 columns to 2 ≤768; action buttons stay reachable.
  Sem overflow em nenhuma largura; colunas da linha conferidas.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/image-convert-desktop.png`](shots/image-convert-desktop.png) (1280 px),
[`shots/image-convert-mobile.png`](shots/image-convert-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- ZIP compatibility was proven with fflate loaded from a CDN at test time only (it is NOT a shipped
  dependency); the shipped writer is dependency-free. · Compatibilidade do ZIP provada com fflate
  carregado só no teste; o writer embarcado não tem dependências.
- The host preview panel is fixed at 592 px, so the desktop shot is a full-page capture of a
  same-origin 1280×900 iframe (shell hidden) and the mobile shot a 375×785 iframe cropped to 375×784;
  no physical device was available. · Captura desktop via iframe 1280×900 e mobile via iframe recortado.