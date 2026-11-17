# Base64 · v1.0.0

Encode and decode Base64 locally with full UTF-8 support, a URL-safe variant and MIME 76-column wrapping,
with live validation, byte/char stats, swap, copy and download.
Codifique e decodifique Base64 localmente com UTF-8 completo, variante URL-safe e quebra MIME de 76 colunas,
com validação ao vivo, estatísticas de bytes/chars, inverter, copiar e baixar.

Category: 04 Developer Tools · Engine: `TextEncoder`/`TextDecoder` + `btoa`/`atob` over a binary string ·
100% local · no dependencies.

## Usage · Uso

- **Encode / Decode** — mode tabs switch text→Base64 and Base64→text. · Abas alternam texto→Base64 e Base64→texto.
- **UTF-8 correct** — multi-byte characters (accents, CJK, emoji) encode/decode exactly.
  **UTF-8 correto** — caracteres multi-byte (acentos, CJK, emoji) codificam/decodificam exatamente.
- **URL-safe** — optional `-_` alphabet without `=` padding; decode accepts both alphabets.
  **URL-safe** — alfabeto `-_` opcional sem padding; a decodificação aceita ambos.
- **Wrap 76 cols** — optional MIME-style line wrapping on encode. · Quebra opcional de 76 colunas (MIME).
- **Live validation** — invalid Base64 is flagged immediately on decode. · Base64 inválido é sinalizado ao vivo.
- **Stats** — input bytes (UTF-8), output chars and output bytes. · Estatísticas de bytes/chars.
- **Swap / Copy / Download** — push the result back into the input (flipping mode), copy it, or download
  `vistanology.b64.txt` / `vistanology-decoded.txt`. · Inverter / copiar / baixar.
- **Persistence** — only mode/url-safe/wrap survive reload (`localStorage`, key `vistanology:base64`); the
  text is never stored. · Persistência — só modo/url-safe/quebra sobrevivem ao reload; o texto nunca é armazenado.

## Privacy · Privacidade

All conversion happens in memory in your browser. Nothing is uploaded and nothing is persisted.
Toda a conversão ocorre em memória no navegador; nada é enviado nem persistido.

## Limits · Limites

- Decode ignores whitespace and restores padding automatically; it accepts standard and URL-safe alphabets.
  A decodificação ignora espaços e restaura o padding; aceita alfabetos padrão e URL-safe.
- Decoded bytes are interpreted as UTF-8; non-UTF-8 binary shows replacement characters.
  Bytes decodificados são interpretados como UTF-8; binário não-UTF-8 mostra caracteres de substituição.
- Very large inputs are processed synchronously and may briefly block the UI.
  Entradas muito grandes são síncronas e podem bloquear a UI brevemente.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Empty state** — mounts clean, no console error. · Estado vazio monta sem erro.
- **UTF-8 encode** — `Vistanology — café, 日本語, 🌌` → Base64 byte-identical to an independent
  `btoa(TextEncoder…)` ground truth; stats input 38 bytes / output 52 chars.
  Codificação UTF-8 conferida contra ground truth independente.
- **Decode round-trip** — the encoded string decodes back to the exact original (accents + CJK + emoji).
  Round-trip de decodificação exato.
- **Invalid decode** — `!!!not-base64!!!` → “Base64 inválido”, output cleared. · Inválido sinalizado.
- **URL-safe** — `subjects?query=1&x=2+3/4` → no `+ / =` in output; decoding that URL-safe string returns the
  exact original. · URL-safe conferido (sem +/= e round-trip exato).
- **Wrap** — 200-char input wraps to lines of 76/76/76/40. · Quebra MIME conferida.
- **Swap** — encode→swap decodes back to the source; swap again re-encodes to the same Base64 (no listener
  stacking: the tabs instance is reused). · Inverter conferido nos dois sentidos.
- **Copy / Download** — copy returns the exact output; download `vistanology.b64.txt` (text/plain) with the
  exact content; copy uses the honest success/failure path. · Cópia e download conferidos.
- **Persistence** — `{mode:'decode', urlsafe:true}` restored across three remounts; text NOT persisted;
  0 new toasts and 0 console errors on remount (residual action toasts expire first).
  Persistência conferida; texto não persistido; remontagens limpas.
- **i18n & shell** — full EN/PT; library shows 14 cards including `base64` (`14 ferramentas`).
  Bilíngue e integração conferidas (library = 14).
- **Responsive** — 320/375/768/1280 with content: no horizontal overflow; panes stack ≤1024.
  Sem overflow em nenhuma largura.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/base64-desktop.png`](shots/base64-desktop.png) (1280 px),
[`shots/base64-mobile.png`](shots/base64-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- The host preview panel is fixed at 592 px, so the desktop shot is a full-page capture of a
  same-origin 1280×900 iframe (shell hidden) and the mobile shot a 375×785 iframe cropped to 375×784;
  no physical device was available. · Captura desktop via iframe 1280×900 e mobile via iframe recortado.
- Real OS clipboard is denied in the embedded browser; copy verified via a stub plus the execCommand fallback.
  Clipboard real negado no navegador embutido; cópia verificada via stub + fallback.