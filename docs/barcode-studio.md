# Barcode Studio · v1.0.0

Encode EAN-13 and Code 128 in the browser from the published symbol tables: the check digit is computed for 12
digits and verified for 13, Code 128 chooses its code set for you, and the structure of the symbol is reported
module by module before you export PNG or SVG.
Codifique EAN-13 e Code 128 no navegador a partir das tabelas publicadas: o dígito verificador é calculado para 12
dígitos e conferido para 13, o Code 128 escolhe o conjunto de códigos sozinho e a estrutura do símbolo é informada
módulo por módulo antes de exportar PNG ou SVG.

Category: 02 Generators · Engine: width tables embedded from `_dev/code128-table.json` and `_dev/ean13-table.json`,
`<canvas>` 2D for the preview, the same geometry serialized as SVG · 100% local · no dependencies.

## Usage · Uso

- **Symbology** — the segmented control switches between EAN-13 (12 or 13 digits) and Code 128 (any ASCII text);
  switching clears the report rather than showing a stale one. · **Simbologia** — o controle segmentado alterna entre
  EAN-13 (12 ou 13 dígitos) e Code 128 (qualquer texto ASCII).
- **Value** — typing is debounced 160 ms; Sample loads `590123412345` for EAN-13 (the published example whose check
  digit is 7) and `Vistanology-42` for Code 128. · **Valor** — a digitação é debounced; Exemplo carrega o exemplo
  publicado.
- **Code set** — Auto is what the printed examples use: four or more consecutive digits fold into Code C pairs,
  control characters open Code A, everything else stays in Code B, and a character that Code A cannot carry directly
  goes through the Shift symbol. Forcing a set is offered for the cases where a scanner profile demands it, and a value
  that set cannot carry is refused instead of being silently re-encoded. · **Conjunto** — Automático; forçar um
  conjunto recusa o que ele não carrega.
- **Shape** — bar height 30–220 px and narrowest bar 1–8 px; the quiet zone is always 10 modules on each side and
  scales with the module width, so the module count never changes with the shape. · **Forma** — altura e largura da
  barra mais estreita; a zona de silêncio de 10 módulos escala junto.
- **Ink and paper** — two colour pickers plus a live WCAG ratio with a printable/verify-with-scanner badge; the badge
  is a screen measurement, not a print guarantee. · **Tinta e papel** — dois seletores de cor e a razão WCAG ao vivo.
- **Human-readable text** — EAN-13 places the first digit outside the left quiet zone, the two halves under their
  halves and the check digit outside the right one; Code 128 centres the text and prints nothing when the value holds
  control characters. · **Texto legível** — EAN-13 com as posições publicadas; Code 128 centralizado.
- **Structure** — modules, the parity pattern actually used, the check value, the code sets traversed, the symbol
  count, the narrowest bar in pixels and the contrast ratio. · **Estrutura** — módulos, paridade, verificação,
  conjuntos, símbolos, barra mínima e contraste.
- **Export** — PNG (canvas at the preview resolution) and SVG (one `<rect>` per bar, same geometry), plus copy SVG
  markup and copy encoded value. · **Exportação** — PNG e SVG da mesma geometria, mais cópia do markup e do valor.
- **Persistence** — symbology, code set, height, bar width, text switch and the two colours survive reload under
  `localStorage` key `vistanology:barcode-studio`. The encoded value is never written. · Só as configurações são
  lembradas; o valor nunca é gravado.

## Privacy · Privacidade

The tables ship inside the app, so encoding needs no network: no fetch, no worker, no upload. Nothing is written to
`VT.db` (IndexedDB), the value never reaches `localStorage`, and the only persisted object is the seven shape fields.
Clearing the field leaves nothing behind; unmount drops the last result from memory.
As tabelas vêm no arquivo: nada é buscado, nada é enviado. O IndexedDB não é tocado e o valor não é gravado.

## Limits · Limites

- EAN-13 only among the EAN family. EAN-8, UPC-A and ITF-14 are not implemented; a UPC-A number can be encoded as
  EAN-13 with a leading zero, which is what the specification says it is.
  Só EAN-13; EAN-8, UPC-A e ITF-14 não estão implementados.
- Code 128 stops at ASCII 0–127 and the three code sets. FNC1–FNC4, the Latin-1 extension above 127 and GS1-128
  element-string rules are refused rather than guessed, so a value containing `é` is reported as out of range instead
  of being mangled into a symbol that scans as something else.
  Code 128 para no ASCII; FNC e GS1-128 são recusados, não adivinhados.
- Check digits are computed and verified, but a screen is not a printer. Module widths on a display, dot gain on paper
  and the minimum reflectance difference have to be confirmed with a real scanner before production use — the 10-module
  quiet zone is drawn, not guaranteed by the output device.
  Verificador conferido, porém tela não é impressora: valide em leitor real.
- The EAN-13 parity row shown is the one the first digit selects; the tool reports what it encoded, it does not look up
  a company prefix in the GS1 registry, and it never claims a number is assigned or valid in commerce.
  Nada consulta o registro GS1.

## Verified · Verificado

Run in headless Chromium against the local preview (`node serve.js`), harness `_dev/qa-barcode-qoder.js`
(109 assertions, 0 failed), the Node-side encoder probe `_dev/probe-barcode.js` (17,149 probes, 0 failed) and
`_dev/qa-newtool-responsive-qoder.js` (10 probes, 0 failed):

- **Empty state** — canvas collapsed to 0 × 0, waiting line in the status, no structure rows, all four export buttons
  disabled. · Estado vazio limpo.
- **Published example** — `590123412345` reports check digit 7 and value `5901234123457`, parity `LGGLLG + RRRRRR`,
  95 / 95 modules. · Exemplo publicado reproduzido.
- **Bars read off the pixels** — the harness walks the rendered image, divides every element by the narrowest one and
  compares the resulting 95-module string with the one it built itself from `_dev/ean13-table.json`; the guards
  (`101`, `01010`, `101` at 0/45/92), the left-half parity and the right-half R symbols are then re-decoded from the
  image and read back `5901234123457`. Nothing in this check trusts the app's own bit string.
  Os barras são lidas da imagem e decodificadas de novo — nada confia na string do app.
- **Code 128 from the pixels** — the sample's image starts with the Start B widths `211214`, ends with the stop pattern
  `1100011101011`, splits into 11-module symbols that all map back to table values, and the checksum recomputed from
  the decoded symbol values equals the symbol actually emitted; decoding the values returns `Vistanology-42`.
  Sumo e fim, valores, checksum e texto reconferidos a partir dos pixels.
- **Code-set behaviour** — `12345678` → Code C, 7 symbols, 79 modules; `Vist12345678logy` → `B → C → B`, 17 symbols,
  189 modules; `abc` → B; `a<TAB>b` → A; forced C refuses letters and an odd digit count; forced B refuses the control
  character; `café` is refused as out of range. · Conjuntos e recusas conferidos.
- **Validation** — a wrong check digit is rejected with the expected digit named, non-digits and short input rejected,
  `5901234 1234-57` accepted (spaces and dots stripped), exports disabled while an error stands. · Validação medida.
- **Shape and colour** — 6 px modules double the canvas width but not the module count; height 150 adds a 30 px text
  band; text off drops it; black on white measures 21.00:1 with the ok badge, `#cccccc` ink drops below 4.5:1 and
  switches to the warn badge. · Forma, cores e selo de contraste.
- **Exports** — PNG carries the `89504e47` signature and the preview's exact pixel size; the SVG's `<rect>` list, read
  back from the downloaded file, rebuilds the published bit string exactly and carries the human-readable value;
  suggested names are `vistanology-ean13-…`; both copy buttons hand over the markup and the value.
  PNG e SVG conferidos byte a byte a partir do arquivo baixado.
- **Privacy** — exactly one storage key, `vistanology:barcode-studio`, holding only the seven shape fields and no
  `5901234…`; after reload the value field is empty and the shape is restored. · Promessa de privacidade medida.
- **i18n** — the `bc.*` keys are present in EN and PT (`_dev/scan-i18n-parity.js`: PARITY FAILURES: 0); in PT the
  titles, structure labels and rejection messages render without a raw key. · Paridade bilíngue conferida.
- **Contrast** — `_dev/probe-contrast2.js`: 31 text elements sampled on this view, 0 below AA. · 31 elementos, 0 falhas.
- **Responsive** — 1440/1280/1024/768/390/375 in glass, plus Transparency = Solid and Motion = Reduced at 1440 and
  375, with a real EAN-13 encoded: no horizontal overflow, console clean. · Sem overflow em nenhuma largura.
- **Docs contract** — `_dev/qa-docs-all.js`: 36 pages, 0 failures; this page's Summary/How to use/Privacy/Limits all
  render from the registry arrays. · Página de docs dentro do contrato.

Screenshots: [`shots/barcode-studio-desktop.png`](shots/barcode-studio-desktop.png) (1280 px),
[`shots/barcode-studio-mobile.png`](shots/barcode-studio-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- The pixel and SVG checks measure the geometry the browser drew. They cannot say anything about print output: dot
  gain, printer resolution and the reflectance difference a real scanner requires are untested here.
  A geometria é conferida; a impressão não.
- Code 128 was verified against the published width table, the start/stop symbols and the checksum rule, but not
  against a scanner or a reference library — the two independent decoders in this run are both written by us.
  Dois decodificadores independentes, ambos nossos; nenhum leitor comercial.
- EAN-13 was exercised with the published example and a handful of synthetic numbers; company-prefix and country-code
  semantics are out of scope and were not validated.
  Prefixos de empresa não foram validados.
