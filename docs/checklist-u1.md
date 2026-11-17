# U1 Checklist · Offline-first shell

Escopo: transformar a Vistanology em PWA offline-first sem tocar nas 20 ferramentas.
Additivo: Service Worker + manifest instalável + ícones locais + registro seguro + indicador de
rede honesto. · Scope: offline-first PWA shell, additive over the 20 tools.

## Arquivos · Files
- `sw.js` — precache do app shell (53 URLs: 33 de shell + 20 apps), stale-while-revalidate
  same-origin, fallback de navegação offline ao shell, versionamento de cache,
  `skipWaiting`/`clients.claim`, mensageria.
- `app.webmanifest` — nome/ícones/`start_url`/`scope`/`display:standalone`/cores/shortcuts.
- `assets/icons/icon.svg`, `assets/icons/icon-maskable.svg` — ícone da marca (motivo do wordmark).
- `index.html` — `<link rel="manifest">` + `color-scheme:dark`.
- `js/app.js` — registro do SW **apenas em contexto seguro** (https/localhost/127.0.0.1; não quebra
  `file://`), badge de rede no topbar, versão interna (`0.3.0`→`0.4.0`).
- `js/core/i18n.js` — chaves `net.offline` / `net.online` (EN/PT).
- `css/shell.css`, `css/responsive.css` — estilo do badge; colapsa só-ponto em ≤640 px com fallback
  de texto acessível; `data-motion="reduced"` desliga o pulse.

## Verificação estática · Static verification
- ✅ `node --check` em `sw.js`, `js/app.js`, `js/core/i18n.js` — sintaxe OK.
- ✅ `app.webmanifest` é JSON válido (parse OK).
- ✅ **Integridade do precache:** todos os 53 URLs de `sw.js` existem no disco (0 ausentes). Sem isso
  o offline falharia silenciosamente.
- ✅ **Sincronia das listas de apps:** 20 em disco == 20 pré-cacheadas no SW == 20 carregadas no
  `index.html` (sem drift; nenhuma ferramenta ficaria fora do cache offline).
- ✅ **Servido + MIME:** `sw.js`→`text/javascript`, `app.webmanifest`→`application/manifest+json`,
  ícones→`image/svg+xml`, app script→`text/javascript` (200 em todas as rotas testadas). SW exige
  MIME de JS; manifest exige JSON — confirmados.

## Verificado em navegador (offline real) · Verified in browser (true offline)
> Executado com o dev server `serve_u1.js` (`http://localhost:8735`, `cache-control: no-store`, que
> elimina o cache de disco do navegador como falsa evidência). Cada item abaixo tem resultado real.

- ✅ **Registro/ativação do SW:** `navigator.serviceWorker.register('sw.js')` em `http://localhost:8735`
  — estado `activated`; `navigator.serviceWorker.controller` não-nulo (SW controla a página). Escopo
  `http://localhost:8735/`.
- ✅ **Caches populadas:** `vt-shell-v1` com **53** entradas (33 shell + 20 apps) e `vt-asset-v1`
  criada pelo SWR. Limpeza de caches de versão anterior executada no `activate`.
- ✅ **Recarga offline REAL (prova mais forte):** o **servidor foi derrubado** (`serve_u1.js` parado)
  e então a página foi recarregada. O app montou a partir do cache do SW; um `fetch` de teste lançou
  `TypeError: Failed to fetch` — confirmando que **não havia rede**, não apenas "cache aparente".
  Sob essa condição offline:
  - JSON Formatter abriu por hash (`#/tool/json-formatter`) e validou/formatou um JSON de exemplo →
    saída "Valid JSON", caracteres unicode preservados.
  - Color Studio (`#/tool/color-studio`) montou e renderizou sua paleta (swatches presentes).
  - Navegação SPA entre rotas (`#/library`, `#/settings`) funcionou offline; shell (topbar/footer)
    íntegro; 20 ferramentas listadas na biblioteca.
  - Console: **nenhum erro**, exceto o `TypeError` do próprio probe intencional de desconexão.
- ✅ **Recuperação ao reconectar:** servidor religado → `fetch` volta a responder 200; o SW continua
  como controller; o badge some; nada precisa de refresh manual para voltar ao normal.
- ✅ **Manifest aplicável:** `app.webmanifest` servido com MIME `application/manifest+json`, parseia,
  `display:standalone`, 2 ícones (any + maskable), `start_url`/`scope` válidos, theme/background
  `#04070F`, 2 shortcuts. Pré-requisitos de instalabilidade atendidos. (O prompt de instalação do SO
  em si não é disparável por automação — ver nota em Limitações.)
- ✅ **Indicador de rede honesto:** com `navigator.onLine` forçado a `false`, o badge fica visível com
  o texto EN/PT correto e a ponto `.net-dot` pulsando (`animation: net-pulse`); em
  `body[data-motion="reduced"]` a animação vira `none`; ao voltar "online" o badge se oculta.
- ✅ **`file://` intacto:** abrindo por `file://` o app boota normalmente e as ferramentas funcionam
  (UUID gerou 5 identificadores v4 válidos), e o SW **não** é registrado (proteção de contexto
  seguro em `js/app.js`) — exatamente o comportamento pretendido.
- ✅ **Regressão completa:** as 20 ferramentas montam limpas, **0 erros de console**; topbar/footer,
  settings, i18n EN↔PT, navegação e biblioteca intactos.
- ✅ **Independência de rede verificada por inspeção, não por selo:** a lista de requisições de rede
  da página tem **46 requisições, todas em `http://localhost:8735` (same-origin)** — CSS, JS core/
  shell/apps, fontes woff2 e o vendor `qrcode.js`. **Zero chamadas cross-origin/CDN/API externa.**
  Isso é a evidência real da premissa "nada essencial depende da internet", em vez de um rótulo.

## Limitações honestas · Known limits
- **Prompt de instalação nativo:** os pré-requisitos (SW ativo + manifest válido + contexto seguro)
  estão comprovados, mas o *click* no botão "Instalar" do navegador/OS não é exercitável por esta
  automação. Instalabilidade estrutural: confirmada. UX de instalação no device: a validar manualmente.
- **Prime visita fria totalmente offline:** se o app **nunca** esteve online antes de a rede cair, o
  shell funciona mas um script de app individual ainda não pré-cacheado pode faltar até a rede voltar.
  Depois de uma única visita online, todas as 20 apps entram no cache e o offline passa a ser completo.
  Decisão documentada, não um bug.

## Decisões de arquitetura · Notes
- Estratégia **precache do shell + SWR do resto**: robusta e de baixa manutenção. Após uma visita
  online, tudo fica disponível offline (as 20 apps são carregadas no boot, logo entram no cache).
- Registro condicionado a contexto seguro: não polui `file://`, respeita o modo de execução atual.
- Sem reload automático em update (não interrompe o trabalho do usuário); refresh manual.
- `no-store` no servidor de dev: garante que o offline observado vem do SW, não do cache HTTP do
  navegador — a prova de offline não é falsa-positiva.
- Atualização do precache quando novas apps forem adicionadas: manter `APPS`/`SHELL` em `sw.js` em
  sincronia (o checklist acima automatiza a checagem de integridade 53/53).

## Veredito · Verdict
U1 concluída **e validada em navegador com offline real** (servidor derrubado, `fetch` lança
`TypeError`, ferramentas ainda funcionam) **mais inspeção de rede sem cross-origin**. Regressão
20/20 sem erros e `file://` preservado. U1 está pronta; U2+ não iniciadas.
