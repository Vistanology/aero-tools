# Checklist U4 · Worker pipeline for image tools (lazy loading rejeitado com evidência)

Unidade: tirar o trabalho pesado de imagem da thread principal (`VT.workers`, Web Worker inline-Blob +
`OffscreenCanvas`), integrado ao Image Resizer 1.1.0 como referência. Lazy loading de apps foi avaliado
e **rejeitado com evidência** (ver §Decisão). Byte-identidade provada por SHA-256; fallback automático
idêntico; funciona online, offline (servidor parado) e sob `file://`.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `js/core/workers.js` | **novo** — `VT.workers`: host de Web Worker a partir de um Blob inline (sem arquivo extra no precache; funciona `file://` e offline). `supported` = `Worker + OffscreenCanvas + createImageBitmap`. `process(bitmap, opts, transferList)` postando o bitmap (transfer por omissão; cópia quando a thread principal precisa mantê-lo, como no Resizer). Timeout de 30 s. Em `onerror` marca `broken` e derruba todos os pendentes → todos os chamadores caem para o caminho síncrono idêntico. |
| `js/apps/image-resize.js` | 1.0.0 → **1.1.0**: `HTMLImageElement` substituído por `createImageBitmap(file, {frame:0})` (com fallback aninhado para Safari); scale + draw + encode movidos para `VT.workers.process(..., null)` (modo cópia); `resizeSync()` é o fallback síncrono idêntico; `__lastOut()` hook de verificação em ambos os caminhos; token de desmontagem + `bitmap.close()`. Docs EN/PT com a nota do worker/fallback. |
| `index.html` | `<script src="js/core/workers.js">` após `palette.js` |
| `sw.js` | `js/core/workers.js` no SHELL (**56** URLs) + `VERSION` bump `v4 → v5` após a consolidação (armadilha de staleness documentada e exercida de verdade) |
| `js/app.js` | `VT.version` `0.6.0 → 0.7.0` |
| `js/core/registry.js` | release note `0.7.0` EN+PT |
| `README.md` / `CHANGELOG.md` / `docs/VISION.md` | status, evidências, roadmap U4 ✅ / U5 ▶️ |

## Decisão de arquitetura (lazy loading, rejeitado com evidência)

Antes de escrever qualquer código de carregamento sob demanda, medimos o custo real do boot:

- **48 requests / ≈702 KB** no total, dos quais **≈399 KB** são os 20 scripts de ferramentas
  (`js/apps/*.js`). Tudo **same-origin** e **já pré-cacheado pelo Service Worker** (U1).
- Os **manifests** (nome/tagline/i18n das 20 ferramentas) são consumidos pelo Hub, pela Library **e
  pela paleta de comandos (U3)** — logo um import dinâmico por app economizaria bytes apenas na
  **primeira visita a uma ferramenta**, nunca na experiência geral, e adicionaria um registry
  assíncrono, estados de carregamento e complexidade de cache.

Conclusão honesta: **o ganho perceptível é ~0; a complexidade é alta** → lazy loading **não** entra no
escopo de U4. O gargalo real é a **thread principal travando durante resize codificado** (long task
medido), e é isso que os **Web Workers** resolvem — com byte-identidade e fallback. Decisão registrada
em `docs/VISION.md` §4 e §6.

## Estático

- `node --check` em `workers.js`, `image-resize.js`, `app.js`, `sw.js`, `registry.js` → OK.
- 56/56 URLs de precache presentes no disco.

## Verificado em navegador (evidência real, não `node --check`)

Servidor local `http://localhost:8735` com `cache-control: no-store`.

**Byte-identidade (prova central — antes de adotar o worker)**
- Imagem de teste determinística: 3000×2000 com ruído por seed (mesma entrada sempre).
- **PNG:** SHA-256 do blob do worker == SHA-256 do blob de referência main-thread
  (`929a891304bddb42…`). → `workerPngMatchesReference: true`.
- **JPEG:** mesma igualdade em parâmetros idênticos (`5058bc03a90d9855…`).
  → `workerJpegMatchesReference: true`.
- **Fallback forçado** (worker marcado indisponível) produz os **mesmos bytes** que o worker
  (`fallbackMatchesWorker: true`). A codificação é determinística; a saída não muda.
- Nota de honestidade: a primeira comparação deu falso-positivo porque o estado persistido tinha
  `format='png'` (19,49 MB) enquanto a referência era JPEG. Comparação *like-for-like* (mesmo formato)
  fecha a igualdade. Um hook de verificação `VT.modules['image-resize'].__lastOut()` foi adicionado
  (o Blob de saída não é alcançável via `fetch(blobUrl)` no mundo de automação).

**Desempenho (long task na thread principal)**
- Baseline (caminho síncrono): **121 ms** de long task num resize 3000×2000.
- Caminho worker: **73 ms** de long task; pior frame gap observado **79 ms**.
- O `drawImage`/encode pesado sai da thread principal → interface responsiva. A *duração total* do
  resize não diminui (mesmo trabalho); o que cai é o **bloqueio da UI**.

**Funcional (regime worker)**
- Sample → output 67.9 KB; modo fit → 600×400 (50% scale); WebP selecionado → `image/webp`; preview
  natural 600×400; download habilitado.
- Rejeição de `.svg` (não raster): toast "Unsupported file…" exibido. Decodificação inválida → toast
  `badDecode`, sem crash.
- GIFs animados: `createImageBitmap(file, {frame:0})` = semântica de primeiro quadro (equivale ao
  caminho antigo com `HTMLImageElement`). O caminho de fallback aninhado cobre navegadores sem o
  construtor de opções (Safari). (Um GIF sintético malformado lança `InvalidStateError`, exercitando o
  ramo de erro de decode.)

**Higiene de remount**
- 4 ciclos de montar→desmontar: **1** dropzone, **1** input de arquivo (sem duplicatas), ferramenta
  remonta limpa (`remounted: true`).
- Contagem de mensagens ao host: **1 por operação** (sample=1, 1 por debounce), sem worker duplicado
  (o host é singleton, lazy, reusa o único Worker). Estado (formato `webp`) persiste no remount e sai
  8.0 KB; round-trip correto.

**Regressão**
- 20/20 ferramentas montam (`#view` com conteúdo real), 0 falhas.
- Console: **0 mensagens/erros** (online).

**Offline (prova central, método de U3 reutilizado)**
- Servidor derrubado **e porta confirmada fechada** (`netstat` sem LISTENING em 8735, `curl` → exit 7)
  antes do reload frio para `#/tool/image-resize`.
- Navegação servida pelo SW: `transferSize: 0`. Ferramenta monta; `VT.workers.supported: true`
  (Worker+OffscreenCanvas+createImageBitmap offline); sample → **WebP 8.148 bytes idêntico** ao run
  online; download habilitado; badge de rede honesto "Offline — everything still runs locally".
- Nota (`onLine: true`): o SO continua com rede; o que está derrubado é o `localhost`. A prova
  externa (`netstat`/`curl`) + `transferSize: 0` é a que atesta a desconexão do app.

**`file://`**
- `index.html` via `file://`: SW corretamente **não** registrado (0 registrations). `VT.workers.supported:
  true` (o worker nasce de Blob URL, não precisa de servidor). Resize de sample → **PNG 161.408 bytes**
  (origem `file://` tem localStorage próprio → formato default PNG, valor esperado, não regressão);
  download habilitado; worker `broken: false`. Console limpo.
- Confirma o objetivo de design: worker inline-Blob funciona offline e sob `file://` sem mudar o SW.

## Atualização do SW (convenção de invalidação exercida de verdade)

- `js/core/workers.js` entrou no SHELL ⇒ `VERSION` bump (precaches só são refeitos quando os bytes do
  `sw.js` mudam — armadilha documentada em U1, capturada de novo em U3). Bump `v4 → v5` feito **por
  último**, depois das edições de conteúdo (`app.js` 0.7.0, release note `registry.js`), conforme a
  convenção: **editar shell ⇒ bump de `VERSION` no mesmo commit**. Verificação final roda contra
  conteúdo fresco (auto-update do navegador instalou/ativou v5 e re-pré-cacheou 56/56 sem limpeza
  manual).

## Limitações conhecidas (honestas)

- `workers.js` usa `imageSmoothingQuality` mapeada de `smooth` (`high`→`high`, `medium`→`medium`,
  `low`→`nearest` inválido, ignorado silenciosamente; inofensivo porque `imageSmoothingEnabled=false`
  já cobre o caso "low"). Mantido por paridade com o caminho síncrono.
- A automação mede **long tasks** com um `PerformanceObserver`; não captura o layout físico de teclado
  nem condições de hardware reais de usuários. Os números são desta máquina/viewport.
- Apenas o **Image Resizer** integra o worker por ora (referência vertical). Compress/Converter/Metadata
  ainda rodam síncronos — migração deles é uma extensão natural (e barata: o host já existe), não um
  pré-requisito de U4.
- O hook `__lastOut()` fica no código de propósito: é uma conveniência de verificação runtime (expõe o
  último blob de saída), não vazamento de dados — nada é enviado para fora do dispositivo.

## Veredito

**U4 concluída e validada.** Web Worker inline-Blob tira o encode de imagem da thread principal com
**byte-identidade provada por SHA-256** (PNG e JPEG) e **fallback automático idêntico**; long task
**121 ms → 73 ms** num resize 3000×2000. Funciona online, **offline** (WebP 8.148 bytes com a porta
fechada e `transferSize: 0`) e sob **`file://`** (PNG 161.408 bytes, SW ausente, worker suportado).
Regressão 20/20, console limpo, remounts sem duplicatas/duplicação de worker. **Lazy loading
rejeitado com evidência** de boot (≈702 KB same-origin já pré-cacheado). Bump `v4→v5` do SW exercido
pela convenção. Próxima unidade: **U5 — undo/redo framework** (Markdown/JSON/SVG).
