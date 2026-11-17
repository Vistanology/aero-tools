# Image Metadata · v1.0.0

Inspect a raster image's real binary metadata locally — PNG chunks, JPEG EXIF/GPS, WebP flags, GIF/BMP
headers and embedded text — then download a clean, metadata-free re-encoded copy.
Inspecione os metadados binários reais de uma imagem localmente — chunks PNG, EXIF/GPS JPEG, flags WebP,
cabeçalhos GIF/BMP e texto embutido — e baixe uma cópia limpa, recodificada sem metadados.

Category: 03 Media Lab · Engine: in-memory binary parsers (PNG chunk walk, JPEG marker walk, EXIF/TIFF
IFD reader, WebP RIFF walk) + local `<canvas>` re-encode for the clean copy · 100% local · no dependencies.

## Usage · Uso

- **Source** — drop a raster image (PNG, JPEG, WebP, GIF, BMP), click the dropzone, or generate a local
  PNG sample (DPI + text + tIME) or JPEG sample (EXIF + GPS). · Origem — solte uma imagem raster, clique
  na dropzone ou gere um exemplo PNG (DPI + texto) ou JPEG (EXIF + GPS).
- **Overview** — dimensions, megapixels, aspect ratio, file size, MIME, modified date, bit depth, color
  type and DPI (from PNG `pHYs` / JPEG JFIF density). · Visão geral — dimensões, megapixels, proporção,
  tamanho, MIME, data, profundidade, tipo de cor e DPI.
- **Structure** — the real chunk/marker table: PNG `IHDR/IDAT/pHYs/tEXt/tIME/eXIf/IEND`, JPEG
  `0xFFEx/0xFFDx/0xFFCx` markers, WebP `VP8X/VP8/EXIF/XMP` chunks. Consecutive identical entries are
  aggregated as `type ×N` with total bytes. · Estrutura — tabela real de chunks/marcadores; entradas
  consecutivas iguais são agregadas como `tipo ×N` com bytes totais.
- **Metadata** — decoded EXIF (Make, Model, Orientation, DateTime, ExposureTime, FNumber, ISO,
  FocalLength, DateTimeOriginal), GPS as decimal degrees (S/W negated), WebP feature flags and `tIME`.
  **Metadados** — EXIF decodificado, GPS em graus decimais (S/W negativados), flags WebP e `tIME`.
- **Embedded text** — PNG `tEXt` key/value pairs and JPEG `COM` comments, shown verbatim.
  **Texto embutido** — pares `tEXt` do PNG e comentários `COM` do JPEG, exibidos na íntegra.
- **Privacy warning** — an amber banner appears when GPS or personal tags (Make/DateTime) are present.
  **Aviso de privacidade** — banner âmbar quando há GPS ou tags pessoais.
- **Clean copy** — re-encode on a local canvas to PNG/JPEG/WebP (quality 10–100 for lossy) and download
  `<name>-limpo.<ext>`; this drops EXIF, GPS, comments and ancillary chunks.
  **Cópia limpa** — recodifica em canvas local e baixa `<nome>-limpo.<ext>`, removendo todos os metadados.
- **Persistence** — only the clean-copy format/quality survive reload (`localStorage`, key
  `vistanology:image-meta`); the image and its bytes are never stored.
  **Persistência** — só formato/qualidade da cópia limpa sobrevivem ao reload; a imagem nunca é armazenada.

## Privacy · Privacidade

All parsing reads bytes in memory only; nothing is uploaded and nothing is persisted. The clean copy is
produced by local canvas re-encoding. This tool exists precisely to reveal and remove privacy-leaking
metadata (camera, timestamps, GPS) before you share an image.
Toda a leitura ocorre em memória; nada é enviado nem persistido. A cópia limpa é gerada por recodificação
local. A ferramenta existe para revelar e remover metadados que vazam privacidade antes de compartilhar.

## Limits · Limites

- EXIF decoding covers common IFD0 / Exif / GPS tags; maker-notes and proprietary blocks are listed in
  the structure table but not decoded. · EXIF cobre tags comuns IFD0/Exif/GPS; maker-notes são listados
  mas não decodificados.
- Compressed PNG text (`zTXt`, compressed `iTXt`) is listed but not inflated.
  Texto PNG comprimido é listado mas não descomprimido.
- The clean copy re-encodes pixels: lossy formats may change quality/size and animation is not preserved.
  A cópia limpa recodifica pixels: formatos com perdas podem mudar qualidade/tamanho; animação não é preservada.
- SVG is rejected by design (vector) with a pointer to SVG Studio.
  SVG é rejeitado por design (vetorial) com indicação ao SVG Studio.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Empty state** — mounts clean, no console error. · Estado vazio monta sem erro.
- **PNG sample** — 640×420, 0.27 MP, 32:21, RGBA 8-bit; `pHYs` 3780 ppm → `96×96 dpi`; `tEXt`
  `Author: Vistanology Open`; `tIME 2026-11-15 10:00:00`; chunk walk `IHDR / IDAT×68 / pHYs / tEXt / tIME / IEND`.
  Exemplo PNG conferido (DPI, texto, tIME e chunks).
- **JPEG sample** — 420×420, 1:1, 8-bit; markers `0xFFE1 351 B / 0xFFE0 16 B / 0xFFE2 472 B / 0xFFDB×2 /
  0xFFC0 / 0xFFC4×4`; EXIF `Make=Vistanology, Model=Open Cam, Orientation=1, DateTime=2026:11:15 10:00:00,
  ExposureTime=0.008, FNumber=2.8, ISO=200, FocalLength=50, DateTimeOriginal=2026:11:15 09:30:00`;
  GPS `-23.550000, -46.633333` (23°33′S 46°38′W, correctly negated); privacy banner visible.
  Exemplo JPEG conferido (EXIF completo + GPS com sinal correto + aviso).
- **WebP / GIF / BMP** — canvas WebP 120×80 → `VP8X / ICCP / VP8`; crafted GIF 2×3 → 1-bit; crafted BMP
  2×3 → 24-bit `DIB 40`. All dimensions match the bytes used to build them.
  WebP/GIF/BMP conferidos (dimensões batem com os bytes de origem).
- **Invalid files** — txt → unsupported toast; SVG → vector-reject toast; corrupt PNG → decode-fail
  toast; the loaded image is kept. · Arquivos inválidos conferidos sem perder a imagem.
- **Clean copy round-trip (the privacy proof)** — JPEG sample with GPS exported as
  `exemplo-exif-limpo.png` (147 771 B); re-inspecting that export shows “Nenhum metadado embutido
  encontrado”, warning hidden, text hidden, structure only `IHDR / IDAT×37 / IEND` — every EXIF/GPS/text
  chunk gone. JPEG clean (5 981 B) re-inspected clean too; WebP clean 2 976 B.
  Prova de privacidade: a cópia limpa re-inspecionada não tem mais nenhum metadado.
- **Quality gating** — quality slider disabled for PNG, enabled for JPEG/WebP.
  Qualidade desabilitada em PNG, habilitada em JPEG/WebP.
- **Persistence** — `{format:'webp', quality:70}` restored after reload; image not persisted.
  Persistência conferida; imagem não persistida.
- **Lifecycle** — three library↔tool remounts: zero toasts, zero console errors.
  Três remontagens sem listeners duplicados.
- **i18n & shell** — full EN/PT labels; hub/library show 12 tools including `image-meta`
  (`12 ferramentas`, 12 cards). · Bilíngue e integração conferidas (hub e library = 12).
- **Responsive** — 320/375/768/1280 with a loaded image: no horizontal overflow at any width
  (scrollWidth 310/365/758/1270). · Sem overflow em nenhuma largura.
- Console clean throughout. · Console limpo.

Bugs found and fixed during testing (all in the sample-fixture builder / parser boundary, not band-aids):
GPS rationals were written with an 8-byte stride instead of 4 (out-of-bounds `DataView` write); GPS `S`/`W`
refs were written as offsets instead of inline ≤4-byte ASCII (so signs were lost); `inspect()` on untrusted
bytes is now wrapped in try/catch so a malformed file can never crash the mount; consecutive identical
chunks are aggregated for readability.
Bugs corrigidos: stride dos racionais GPS, refs S/W inline, try/catch no parser e agregação de chunks.

Screenshots: [`shots/image-meta-desktop.png`](shots/image-meta-desktop.png) (1280 px),
[`shots/image-meta-mobile.png`](shots/image-meta-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- The host preview panel is fixed at 592 px, so the desktop shot is a full-page capture of a
  same-origin 1280×900 iframe (shell hidden) and the mobile shot a 375×785 iframe cropped to 375×784;
  no physical device was available. · Captura desktop via iframe 1280×900 e mobile via iframe recortado.
- EXIF/GPS samples are synthetic fixtures built to the TIFF/EXIF spec in-page (documented above), not
  camera originals; real-world maker-notes are out of scope. · Amostras EXIF/GPS são fixtures sintéticos
  construídos conforme a especificação, não originais de câmera.