# Timestamp Converter · v1.0.0

Convert Unix epochs to readable dates and back, with a live now-clock, auto seconds/milliseconds detection,
UTC/local/relative views and honest validation.
Converta epochs Unix em datas legíveis e vice-versa, com relógio ao vivo, detecção auto segundos/milissegundos,
visões UTC/local/relativa e validação honesta.

Category: 04 Developer Tools · Engine: native `Date` + `Intl.RelativeTimeFormat` · 100% local · no dependencies.

## Usage · Uso

- **Live now-clock** — current epoch seconds, milliseconds and ISO 8601 update every second; “Use now” loads
  the current epoch into the input. · Relógio ao vivo — epoch s/ms e ISO atualizam a cada segundo; “Usar agora”
  carrega o epoch atual.
- **Epoch → Date** — paste a Unix timestamp; unit Auto/Seconds/Milliseconds. Auto treats |value| ≥ 1e12 as ms.
  Epoch → Data — cole um timestamp; unidade Auto/Segundos/Milissegundos.
- **Views** — ISO 8601 UTC, UTC string, local string (device timezone) and a locale-aware relative label
  (“há 10 meses” / “10 months ago”). · Visões — ISO UTC, string UTC, string local e rótulo relativo conforme o idioma.
- **Date → Epoch** — type any parseable date string or pick a local date/time; outputs epoch seconds,
  milliseconds and ISO. · Data → Epoch — string parseável ou seletor local; saídas epoch s/ms e ISO.
- **Copy** — one-click copy for ISO, epoch s, epoch ms (both tabs), with honest success/failure.
  Cópia em um clique com sucesso/falha honestos.
- **Persistence** — only the unit and active tab survive reload (`localStorage`, key `vistanology:timestamp`);
  inputs are never stored. · Persistência — só unidade e aba ativa sobrevivem; entradas nunca são armazenadas.

## Privacy · Privacidade

Conversion uses the device clock and the native Date engine in memory. Nothing is uploaded; only two settings
are persisted. · A conversão usa o relógio do dispositivo e o motor Date em memória; nada é enviado; só dois
ajustes são persistidos.

## Limits · Limites

- Auto unit detection treats |value| ≥ 1e12 as milliseconds; pre-2001 millisecond epochs need the explicit unit.
  A detecção auto trata |valor| ≥ 1e12 como ms; epochs ms anteriores a 2001 exigem unidade explícita.
- Values outside the JavaScript Date range (±8.64e15 ms) are rejected with “Fora do intervalo de Date”.
  Valores fora do intervalo do Date são rejeitados.
- Date-string parsing delegates to the browser Date parser; ambiguous locale formats may vary by browser.
  A leitura de strings delega ao parser Date do navegador.
- The local string reflects the device timezone; the relative label is rounded to the largest sensible unit.
  A string local reflete o fuso do dispositivo; o relativo é arredondado à maior unidade sensata.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **Empty state** — mounts clean, live now-clock ticking (value changes across a 1.1 s wait), no console error.
  Estado vazio monta sem erro; relógio ao vivo confirmado.
- **Auto s vs ms** — `1770000000` (s) and `1770000000000` (ms) both yield ISO `2026-02-02T02:40:00.000Z`,
  byte-identical to an independent `new Date(...)`; normalized s/ms correct. · Auto s/ms conferido.
- **Explicit unit** — unit=ms on `1770000000` yields `1970-01-21T11:40:00.000Z` (ground truth). · Unidade explícita.
- **Negative epoch** — `-1` → `1969-12-31T23:59:59.000Z`. · Epoch negativo conferido.
- **Invalid / out-of-range** — `abc` flags “Valor inválido”; `9000000000000000` flags “Fora do intervalo de
  Date”; both carry the error (bad) styling and clear outputs. · Inválido e fora do intervalo conferidos.
- **Date → Epoch** — `2026-11-15T12:00:00Z` → s `1794744000`, ms `1794744000000`, ISO equal to ground truth;
  `not a date` flagged; the local picker fills the text input and converts. · Data → Epoch conferido.
- **Relative i18n** — PT “há 10 meses” / EN “10 months ago” (and “há 57 anos” / “57 years ago” for 1970).
  Relativo bilíngue conferido.
- **Copy honesty** — ISO/s/ms copies write exact values; with clipboard throwing AND execCommand false an error
  toast shows. · Cópia honesta nos dois caminhos.
- **Persistence** — `{tab:'date', unit:'ms'}` restored across remounts (settings only); 3 remount cycles produce
  0 new toasts and 0 console errors; the interval is cleared on unmount. · Persistência só de ajustes; remontagens limpas.
- **i18n & shell** — full EN/PT; library shows 17 cards including `timestamp` (`17 ferramentas`).
  Bilíngue e integração conferidas (library = 17).
- **Responsive** — 320/375/768/1280 with content: no horizontal overflow; now-clock and fields wrap.
  Sem overflow em nenhuma largura.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/timestamp-desktop.png`](shots/timestamp-desktop.png) (1280×950),
[`shots/timestamp-mobile.png`](shots/timestamp-mobile.png) (375×784).

### Pending / Limitações do ambiente de teste

- The host preview panel viewport is fixed (319×784 observed), so the desktop shot is a full-page capture of a
  same-origin 1280 px-wide iframe at its natural content height (950 px, shell hidden) and the mobile shot a
  375×785 iframe (internal scrollbar hidden) cropped to 375×784; no physical device was available.
  Captura desktop via iframe de 1280 px na altura natural do conteúdo e mobile via iframe recortado.
- Real OS clipboard is denied in the embedded browser; copy verified via a stub plus the execCommand fallback.
  Clipboard real negado no navegador embutido; cópia verificada via stub + fallback.
- The local-timezone string in screenshots reflects the test machine (GMT-0300); other devices will differ.
  A string de fuso local nas capturas reflete a máquina de teste (GMT-0300).