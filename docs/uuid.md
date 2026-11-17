# UUID Generator · v1.0.0

Bulk RFC-4122 UUIDs: version 4 (122 random bits) or version 7 (48-bit millisecond timestamp +
random, so output sorts by creation time), with case / hyphen / wrapper formatting.
UUIDs RFC-4122 em lote: versão 4 (122 bits aleatórios) ou versão 7 (timestamp de 48 bits em ms +
aleatório, ordenando por criação), com formatação de caixa / hífens / envoltório.

Category: 02 Generators · Engine: `crypto.getRandomValues` · 100% local · no dependencies.

## Usage · Uso

- **Version** — v4 (random) or v7 (time-ordered). · Versão — v4 (aleatório) ou v7 (ordenado por tempo).
- **Count** — 1–100 per batch, slider with live value. · Quantidade — 1–100 por lote.
- **Format** — upper/lower case, hyphens on/off, wrapper none / `{braces}` / `urn:uuid:`.
  **Formato** — caixa, hífens, envoltório nenhum / chaves / urn:uuid:.
- **Output** — generate, copy all, download a `.txt` list (one UUID per line).
  **Saída** — gerar, copiar todos, baixar lista `.txt` (um por linha).
- **v7 info** — the info line decodes the embedded timestamp of the first UUID (ISO-8601).
  **Info v7** — a linha de informação decodifica o timestamp do primeiro UUID.
- **Persistence** — only the settings survive reload (`localStorage`, key `vistanology:uuid`);
  the generated list is memory-only. · Persistência — só configurações; a lista vive na memória.

## Privacy · Privacidade

Random bytes come from `crypto.getRandomValues`; v7 timestamps come from the local clock. Nothing
is stored or sent: the list exists only in memory and is regenerated on reload.
Bytes aleatórios de `crypto.getRandomValues`; timestamps v7 do relógio local. Nada é armazenado ou
enviado: a lista vive só na memória e é regenerada no reload.

## Limits · Limites

- v7 ordering is monotonic within a millisecond via an incrementing 12-bit sequence; across clock
  jumps it follows the local clock. · Ordenação v7 monotônica dentro do ms; entre saltos, relógio local.
- The `urn:uuid:` wrapper forces hyphens (the URN namespace requires the canonical form).
  O envoltório `urn:uuid:` força hífens (forma canônica exigida).
- Count is clamped to 1–100. · Quantidade limitada a 1–100.
- Clipboard writes can be denied by the browser; an honest error toast is shown on failure.
  A área de transferência pode ser negada; toast honesto em falha.

## Verified · Verificado

Run in Chromium against `http://localhost:8735`:

- **v4 correctness** — 5 and 100 UUIDs matched the RFC-4122 v4 regex
  (`xxxxxxxx-xxxx-4xxx-[89ab]xxx-xxxxxxxxxxxx`) and were all unique.
  v4 conferido por regex e unicidade (5 e 100).
- **v7 correctness** — 100 UUIDs matched the v7 regex (version nibble `7`, variant `[89ab]`) and
  sorted lexicographically in generation order; the decoded timestamp of a freshly generated batch
  was within milliseconds of the probe clock (`timestampFresh: true`), e.g.
  `2026-11-15T06:19:47.307Z`. · v7 conferido por regex, ordenação e timestamp fresco.
- **Formats** — upper + no hyphens produced `01A1DDDCA4EB7036A88CBED622B549D4`; braces produced
  `{01A1DDDCA4EB7036A88CBED622B549D4}`; the URN wrapper keeps the prefix lowercase even in upper
  mode: `urn:uuid:01A1DDDD-5964-7B8D-BCCF-81CA1F56F32F` (a prefix-casing bug was found and fixed).
  Formatos conferidos; um bug de caixa no prefixo URN foi encontrado e corrigido.
- **Copy & download** — copy-all placed 100 lines on the clipboard; download produced
  `vistanology-uuids.txt` with exactly 100 lines. · Copiar 100 linhas; download .txt com 100 linhas.
- **Persistence** — settings (v7 / count 100 / upper / hyphens off / urn) restored after reload;
  the stored object holds settings only, no generated values. · Configurações restauradas; lista nunca persistida.
- **Lifecycle** — three library↔tool remounts produced exactly one copy toast (no duplicate listeners).
  Três remontagens sem listeners duplicados.
- **i18n & shell** — full PT labels; docs render 5 usage steps / 3 limits / 0 deps; hub shows 7 tools.
  Bilíngue e integração conferidas.
- **Responsive** — 320/375/768/1280: `scrollWidth == clientWidth`, no element outside the viewport.
  Sem overflow em nenhuma largura.
- Console clean throughout. · Console limpo.

Screenshots: [`shots/uuid-desktop.png`](shots/uuid-desktop.png),
[`shots/uuid-mobile.png`](shots/uuid-mobile.png) (375 px).

### Pending / Limitações do ambiente de teste

- Clipboard success verified with a stub (embedded document never focused); the denial path shows an
  honest error toast. · Clipboard via stub; negação real mostra toast honesto.
- Mobile screenshot uses a same-origin 375×785 iframe cropped from a viewport capture; no physical
  device was available. · Captura mobile via iframe 375×785.