# VISTANOLOGY · Visão Estratégica & Auditoria

> Documento de produto e engenharia. Grounded no código real em `vistanology-open/` (20 ferramentas,
> F0–F2 aprovadas). Não é uma lista de desejos: cada gap abaixo foi verificado no código, e cada
> proposta tem problema, público, viabilidade local, segurança e forma de teste.
>
> EN abstract: A grounded audit of the current 20-tool registry-driven SPA, followed by a product
> vision, an opportunity backlog scored by value/feasibility/independence/security, an architecture
> plan centered on offline-first independence, and an incremental, auditable roadmap.

---

## 1. Auditoria · Etapa A (o que existe, o que funciona, o que falta)

### 1.1 Fundação sólida (preservar)
- **SPA dirigida por registry** (`js/core/registry.js`): cada ferramenta registra um manifesto
  (`id, cat, icon, name/tagline bilíngues, docs, deps, mount, unmount`); o shell descobre sozinho.
  Hub, biblioteca, busca, docs e favoritos atualizam sem tocar no shell. **Excelente para crescer.**
- **Separação limpa**: `core/` (utils, storage, i18n, icons, ui, registry, router), `shell/`
  (hub, library, appframe, docs, open, settings), `apps/` (um arquivo por ferramenta).
- **20 ferramentas realmente funcionais**, cada uma testada com ground truth independente antes de
  avançar (F0: QR, Color; F1: Gradient, Font, SVG, Password, UUID, Lorem; F2: 4 Media + 8 Developer).
- **Identidade visual consolidada**: identidade diurna própria da Vistanology (redesign 0.24.0, sistema consolidado em
  0.25.0) — céu diurno, água e luz sobre vidro branco fosco, acentos aqua, Instrument Serif + Inter, três elevações de
  vidro, motion/glass configuráveis com fallback sólido e reduced-motion. A linguagem Frutiger Aero é ponto de partida,
  não fantasia: a meta é parecer Vistanology. O contrato vivo está em `docs/design-system/` (identidade, tokens,
  componentes, imagens, qualidade, governança); vocabulário de bancada compartilhado (`.bench`/`.step`/`.bench-sec`),
  poço e seleção são regras centrais, e cada ferramenta conserva personalidade dentro delas. O tema anterior (Cosmic
  Liquid Glass, azul-noturno + ciano) está preservado sem alterações em `v1_css/`.
- **i18n completo EN/pt-BR** (shell + apps + docs), persistido.
- **Segurança já presente**: sanitizer de SVG (scripts/handlers/refs externas) e de Markdown
  (sem HTML cru, `javascript:` removido, imagens remotas nunca buscadas). Sampling de senha sem
  viés de módulo. Processamento 100% local por construção.
- **Persistência de preferências** (`VT.store`, localStorage com prefixo `vistanology:`), favoritos
  e recentes. Conteúdo do usuário **não** é persistido por padrão (privacidade).

### 1.2 Gaps verificados no código (não supostos)
| Área | Estado atual | Evidência | Impacto |
|---|---|---|---|
| **Offline-first (HTTP)** | Ausente | Sem `serviceWorker`, sem `caches.`, sem `.webmanifest` em todo o repo | Reload offline sobre HTTP falha; não instalável como PWA. `file://` funciona, mas o cenário "sem internet" hospedado não. |
| **Armazenamento de projetos** | Ausente | Sem `indexedDB`; só localStorage JSON | Sem projetos, sem sessões recuperáveis, sem arquivos grandes. |
| **Backup / export / restore** | Ausente | Sem `showSaveFilePicker`, sem export de workspace | Usuário não transporta/recupera o trabalho fora da plataforma. |
| **Versionamento / migrações** | Ausente | `VT.store` sem schema/version | Risco de quebra ao evoluir o formato. |
| **Web Workers** | Ausente | Sem `new Worker` | Processamento pesado (imagens) na main thread; busy indicator mitiga UX mas bloqueia. |
| **Carregamento sob demanda** | Ausente | 34 scripts clássicos eager no `index.html` (vendor+7 core+6 shell+20 apps+app.js) | Boot carrega todas as apps mesmo sem uso; não escala para 31+ e além. |
| **Desfazer / refazer** | Ausente | Sem `undo`/`redo` em `js/` | Editores sem histórico de ações. |
| **Paleta de comandos / atalhos globais** | Parcial | Só o atalho `/` (busca) | Descoberta de recursos exige memorizar a biblioteca. |
| **CSP / hardening de shell** | Ausente | Sem `<meta http-equiv="Content-Security-Policy">` | Defesa em profundidade recomendada ao importar conteúdo. |
| **Indicador de rede / honestidade offline** | Ausente | Sem UI de status de conexão | Usuário não sabe o que depende de rede (quase nada, mas deve ser explícito). |

### 1.3 Dívidas menores
- `apps.css` e `responsive.css` crescem por ferramenta (ok até ~31; avaliar escopo por app depois).
- Sem testes automatizados versionados (a verificação é runtime manual documentada em checklists).
- Sem `git` no diretório de trabalho atual (histórico de commits não inicializado aqui).

---

## 2. Visão de produto · Etapa B

### 2.1 Tese
A Vistanology deve ser **um ambiente de trabalho digital independente**: um lugar onde uma ideia
vira algo concreto — criar, desenvolver, projetar, organizar, processar, exportar — **sem depender
de internet, contas ou assinaturas**, e onde o trabalho do usuário é **dele** (exportável,
transportável, recuperável). Não um amontoado de widgets; um ecossistema com profundidade,
integração e uma estética reconhecível.

Três pilares que faltam e que definem o salto de qualidade:
1. **Independência real** (offline-first de engenharia, não um selo): a plataforma continua útil sem
   rede; o trabalho persiste, exportа e restaurа.
2. **Experiência unificada** (paleta de comandos, atalhos, recentes, projetos, desfazer/refazer): a
   plataforma fica mais eficiente conforme o usuário a usa.
3. **Ferramentas-flagship de criação/engenharia** que pareçam software profissional, não formulários.

### 2.2 Análise de oportunidades (priorizada)
Critérios: **V**alor · **R**elevância/frequência · **O**riginalidade · **F**viabilidade local ·
**C**omplexidade (↓ melhor) · **I**ndependência de rede · **S**egurança · **Int**egração.
Escala 1–5 (C invertido: 5 = simples). Score = soma orientativa, não fórmula rígida.

| # | Oportunidade | Problema / público | V | R | O | F | C | I | S | Int | Prioridade |
|---|---|---|---|---|---|---|---|---|---|---|---|
| A | **Offline-first shell** (SW + cache + manifest + status de rede) | Plataforma morre sem internet; qualquer usuário hospedado | 5 | 5 | 3 | 5 | 4 | 5 | 5 | 5 | **P0** |
| B | **Project store + backup/restore** (IndexedDB + export/import JSON + migrações) | Trabalho não persiste nem viaja; criadores/devs | 5 | 5 | 4 | 5 | 3 | 5 | 4 | 5 | **P0** |
| C | **Paleta de comandos + atalhos globais + central de atalhos** | Descoberta/eficiência; todos | 5 | 5 | 3 | 5 | 4 | 5 | 5 | 5 | **P0** |
| D | **Lazy loading de apps** (registry sob demanda) | Boot pesado; escala do catálogo | 4 | 4 | 2 | 5 | 3 | 5 | 5 | 4 | **P1** |
| E | **Undo/redo framework** (por app, opt-in) | Editores sem histórico; criadores/devs | 4 | 4 | 3 | 5 | 3 | 5 | 5 | 4 | **P1** |
| F | **Web Workers p/ imagem + hashing** | Main thread bloqueia em arquivos grandes | 4 | 3 | 2 | 5 | 3 | 5 | 5 | 3 | **P1** |
| G | **CSS Lab / box-shadow & glass generator** | Criar superfícies/efeitos sem sair da plataforma; designers | 4 | 4 | 4 | 5 | 4 | 5 | 5 | 4 | **P1 flagship** |
| H | **SVG/Vector editor visual** (path, boolean, export) | Edição vetorial leve sem app externo; designers | 5 | 4 | 5 | 4 | 2 | 5 | 4 | 4 | **P2 flagship** |
| I | **JSON/Data workspace** (tree edit, query, CSV↔JSON, schema) | Manipular dados sem serviço externo; devs | 5 | 5 | 4 | 5 | 3 | 5 | 4 | 5 | **P1 flagship** |
| J | **Markdown/Notes workspace** (editor + preview + projetos) | Escrever/organizar com persistência local; todos | 4 | 5 | 3 | 5 | 3 | 5 | 4 | 5 | **P2** |
| K | **PDF suite** (merge/split/pdf↔img, via lib local) | Documentos sem upload; todos | 5 | 5 | 3 | 3 | 2 | 5 | 4 | 3 | **P2** (dep justificada) |
| L | **Productivity** (Focus, Pomodoro, Word Counter, Case, Cleaner, Units) | Tarefas cotidianas; todos | 3 | 4 | 2 | 5 | 5 | 5 | 5 | 3 | **P2** (catálogo) |
| M | **Component/UI playground** (HTML/CSS/JS sandbox seguro) | Prototipar sem ferramenta externa; devs/designers | 4 | 4 | 5 | 4 | 2 | 5 | 2 | 4 | **P3** (sandbox rigoroso) |
| N | **Animação / keyframe lab** | Criar motion sem app externo; designers | 3 | 3 | 5 | 4 | 2 | 5 | 5 | 3 | **P3** |

**Descartadas por ora** (redundantes/superficiais ou risco alto sem valor claro): geradores de
"texto bonito" decorativos, clones de redes sociais, qualquer coisa que exija backend/conta,
ferramentas que só aumentam número na biblioteca.

### 2.3 Princípio de seleção
> Não desenvolver porque é fácil; desenvolver porque existe razão real. Menos ferramentas
> excelentes > dezenas superficiais. Se duas ferramentas funcionam melhor juntas, integrar. Se uma
> funcionalidade justifica experiência própria, não reduzi-la a um formulário dentro de outra página.

---

## 3. Arquitetura & experiência · Etapa C

Evoluir a base **sem reescrever** o que funciona. Tudo aditivo, auditável, preservando as 20 apps.

### 3.1 Independência offline-first (P0 — o coração da diretiva)
- **Service Worker** (`sw.js`) com estratégia *app-shell*: pré-cache de `index.html`, CSS, core,
  shell, fontes, ícones, hero e vendor; *stale-while-revalidate* para assets; fallback offline.
  Registro apenas em contexto seguro/HTTP (não quebra `file://`). Versionamento de cache + `skipWaiting`
  controlado + limpeza de caches antigos.
- **Web App Manifest** (`.webmanifest`): nome, ícones (SVG/PNG locais), `display: standalone`,
  `theme_color`, `background_color` → instalável, sem CDN.
- **Indicador de rede honesto**: badge discreto "Offline — tudo continua funcionando localmente"
  quando `navigator.onLine === false`; nenhuma funcionalidade essencial depende de rede (verificar
  por inspeção de requests, não por selo).
- **Verificação real**: carregar, cortar rede (DevTools offline / `context.setOffline`), recarregar e
  confirmar que shell + apps montam e que uma ferramenta produz resultado. Registrar evidência.

### 3.2 Armazenamento de projetos + backup (P0)
- **`VT.db`** sobre IndexedDB (wrapper mínimo, sem dependência): stores `projects`, `sessions`,
  `meta`. Fallback para localStorage quando IndexedDB indisponível (modo privado).
- **Schema versionado** (`meta.schemaVersion`) + **migrações** explícitas; nunca quebrar dados antigos.
- **Backup/restore**: exportar todo o workspace como um único `.vistanology.json` (preferências,
  favoritos, projetos, sessões) via `downloadBlob`; importar com validação + confirmação + merge
  seguro. O arquivo é **autossuficiente** (legível fora da plataforma).
- **Privacidade**: projetos são opt-in por ferramenta; conteúdo sensível (senhas) nunca persiste.
  Confirmação antes de sobrescrever/restaurar. Limites de tamanho documentados.

### 3.3 Experiência unificada (P0/P1)
- **Paleta de comandos** (`Ctrl/Cmd+K`): busca fuzzy de ferramentas + ações rápidas (ir para,
  favoritos, alternar idioma/motion/glass, exportar backup). Reusa `registry.search`.
- **Atalhos globais** + **central de atalhos** (`?`): `/` busca, `g h` hub, `g l` biblioteca,
  `g s` settings, `Esc` fecha modal/paleta. Respeita foco em inputs.
- **Desfazer/refazer framework** (`VT.history`, opt-in por app): pilha de estados serializáveis,
  `Ctrl+Z`/`Ctrl+Shift+Z`, limites de memória. Aplicar primeiro onde há edição (Markdown, JSON, SVG).
- **Sessão/recuperação**: recents já existe; adicionar "retomar último projeto" quando houver db.

### 3.4 Desempenho & escala (P1)
- **Lazy loading**: registry passa a suportar `load()` assíncrono; apps carregados sob demanda ao
  navegar (mantendo compatibilidade com o boot eager atual via migração gradual). Reduz boot.
- **Web Workers** para re-encode de imagem e hashing de arquivos grandes; main thread livre;
  progresso real; fallback síncrono quando Worker indisponível.
- **Gestão de memória**: `URL.revokeObjectURL` centralizado, limpeza de listeners no `unmount`
  (já praticado), limites de pixels/bytes documentados por ferramenta.

### 3.5 Segurança & hardening (contínuo)
- **CSP** por meta (default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline';
  script-src 'self') — validar que não quebra inline styles existentes; ajustar com justificativa.
- Conteúdo importado (SVG/HTML/projetos) **nunca** é confiável: sanitizar antes de renderizar;
  não executar código importado automaticamente. Sandbox rigoroso para qualquer playground (P3).
- Sem dependências ocultas; toda dep nova avaliada (tamanho, licença, manutenção, offline, alternativa).

### 3.6 Acessibilidade & qualidade (inegociável, contínuo)
- Teclado completo, foco visível, leitores de tela (aria), contraste WCAG, reduced-motion,
  responsivo 320–1280, zoom. Acessibilidade desde o design, não correção final.
- Cada unidade: caminho normal + inválidos + extremos + vazios + falhas + persistência + import/export
  + teclado + responsivo + offline (quando aplicável) + console + requests externas + memória/listeners
  + integração shell + docs atualizadas na mesma entrega.

---

## 4. Roadmap incremental · Etapa D (unidades coerentes, auditáveis)

Cada unidade é desenvolvida, testada, corrigida e documentada **antes** da próxima. Regressão
obrigatória ao fim de cada unidade (20 apps + shell intactos).

**Status da roadmap:** U1 ✅ concluída e validada (navegador, offline real) · U2 ✅ concluída e
validada (navegador: `VT.db`, Gradient Lab, Settings) · U3 ✅ concluída e validada (navegador:
paleta, atalhos, offline, `file://`) · U4 ✅ concluída e validada (worker pipeline; lazy loading
rejeitado com evidência) · U4b ✅ **avaliada com medições e rejeitada** (Compress/Converter/Metadata sem
ganho mensurável; só o Resizador mantém o worker) · U5 ✅ concluída e validada (undo/redo em Markdown) ·
U5b ✅ **VT.history em JSON Formatter + SVG Studio** (0.9.0) · U6 ✅ **Flagship Data Workspace** (0.10.0,
21ª ferramenta: árvore editável + busca + CSV↔JSON + diff + schema + projetos IndexedDB, validada offline) ·
U7 ✅ **Flagship Visual Page Builder** (0.11.0, 22ª ferramenta: 12 blocos arrastáveis, tela ao vivo, painel de
propriedades, prévia responsiva, undo/redo, autosave IndexedDB, exportação HTML escapada, validado offline) ·
U8 ✅ **Flagship Design System Lab** (0.12.0, 23ª ferramenta: estúdio de tokens ao vivo — paleta, vidro, forma,
tipografia — prévia em componentes reais, 5 predefinições, undo/redo, autosave + temas nomeados, exportação CSS
validada, validado offline) · U9 ✅ **Flagship Playground** (0.13.0, 24ª ferramenta: HTML/CSS/JS com prévia em
iframe isolado `allow-scripts` sem `allow-same-origin` (origem opaca, sem `eval`), console capturado, 4 modelos,
execução automática, viewport desktop/mobile, autosave + snippets nomeados, exportação `.html` autônoma, validado
offline) · U10 ✅ **Flagship CSS Animation Studio** (0.14.0, 25ª ferramenta: editor visual de @keyframes — tempo,
curvas de easing (nomeadas ou cubic-bezier com gráfico), quadros-chave com transformação/opacidade/cor/raio,
prévia ao vivo com play/pause/restart, 6 predefinições, undo/redo, autosave + animações nomeadas, exportação de
CSS puro validado, validado offline) · U11 ✅ **Flagship Component Builder** (0.15.0, 26ª ferramenta: compositor
visual de componentes de UI — botão/selo/alerta/cartão com propriedades tipadas (rótulo, corpo, variante, tamanho,
cor de destaque, raio, ícone), prévia ao vivo na identidade visual vigente (na época, Cosmic Liquid Glass; hoje, Frutiger Aero), saída HTML + CSS simultânea,
markup escapado e valores validados sem `eval`, undo/redo, autosave + componentes nomeados, exportação `.html`
autossuficiente, validado offline) · U12 ✅ **Flagship Image Studio** (0.16.0, 27ª ferramenta: editor de imagens
local não destrutivo — carregar por arquivo/arrastar/colar/exemplo, girar, espelhar, recorte por proporção, pilha
de filtros CSS (brilho/contraste/saturação/matiz/cinza/sépia/desfoque), Comparar com o original, undo/redo do
estado de edição, autosave + projetos nomeados no IndexedDB, exportação em resolução total PNG/JPEG/WebP com a
mesma string de filtros da prévia, validado offline) · U13 ✅ **Flagship Favicon & Icon Studio** (0.17.0, 28ª
ferramenta: gerador local de favicon/ícone de app — origem monograma ou imagem, renderizado por uma única rotina
compartilhada nas resoluções reais 16/32/48/64/128/180/192/512 px, preenchimento sólido/degradê/transparente, forma
círculo/arredondado/quadrado com raio e padding ajustáveis, grade ao vivo nas dimensões exatas, exportação individual
ou em lote escalonado, `site.webmanifest` gerado, undo/redo apenas das opções (nunca da imagem), autosave + presets
nomeados no IndexedDB, validado offline) · U14 ✅ **Flagship SVG Editor** (0.18.0, 29ª ferramenta: bancada vetorial
visual — primitivas retângulo/elipse/linha/triângulo/estrela com modelo de documento (centro+tamanho+rotação),
arrastar para mover, alças de canto para redimensionar, alça superior para girar, ajuste à grade, estilo por forma
(preenchimento/traço/opacidade/raio), camadas reordenáveis/ocultáveis/duplicáveis, undo/redo do documento inteiro,
autosave + projetos nomeados no IndexedDB, exportação de markup SVG limpo e PNG 1×/2×/4× rasterizado do mesmo modelo,
validado offline) · U15 ✅ **Flagship Notes Workspace** (0.19.0, 30ª ferramenta: bancada de notas Markdown local-first —
muitas notas nomeadas no IndexedDB com tags, editor/prévia divididos com prévia segura (escapa todo texto, bloqueia HTML
bruto e mantém só protocolos http/https/mailto/#), busca de texto completo, filtro por tag, modos Escrita/Dividido/Prévia,
undo/redo do corpo, autosave com *flush* ao trocar de nota ou sair (nada se perde na janela do debounce), restauração da
última nota/visão, copiar Markdown/HTML e exportar `.md`; sem `eval`, sem scripts, validado offline) · U16 ✅ **Flagship Kanban Board** (0.20.0, 31ª ferramenta: quadro de tarefas local-first — colunas e cartões com arrastar-e-soltar por ponteiro (fantasma + espaço reservado), editor lateral do cartão (título, descrição, tags, concluído), undo/redo do quadro inteiro via `VT.history`, autosave/restore no IndexedDB (`kanban:autosave`), projetos nomeados, busca que esmaece não-correspondentes e exportação JSON/Markdown; todo texto escapado, sem `eval`, sem HTML bruto, validado offline) · U17 ✅ **Flagship Document Workshop** (0.21.0, 32ª ferramenta, **primeira da categoria Documents**: bancada de documentos local-first pronta para impressão — seções ordenadas em Markdown seguro com cabeçalho (título/autor/data), sumário automático, temas serifa/sem serifa e tamanho de fonte, modos Escrita/Dividido/Prévia, reordenar/excluir seções, undo/redo do documento inteiro via `VT.history`, autosave/restore no IndexedDB (`dw:autosave` + projetos nomeados), exportação HTML autônomo/`.md` e impressão pelo diálogo do navegador (iframe oculto + CSS de impressão); prévia segura escapa todo texto e mantém só protocolos http/https/mailto/# (`javascript:` inerte), checkboxes de tarefa reais, sem `eval`, sem HTML bruto, validado offline; 3 bugs reais corrigidos na verificação — `saveTimer` não declarado, checkboxes escapados, `record()` sem `syncHist()`) · U18 ✅ **Flagship Diagram Studio** (0.22.0, 33ª ferramenta: estúdio de fluxogramas/diagramas SVG local-first — nós tipados (retângulo/losango/cápsula/anotação), conexões ortogonais com setas via Link em duas etapas, arrastar por ponteiro com snap de 8px, inspetor ao vivo do nó/aresta (rótulo, tamanho, cores, tipo), undo/redo do diagrama inteiro via `VT.history`, autosave/restore no IndexedDB (`ds:autosave` + projetos nomeados), exportação SVG limpo e PNG 2×; rótulos são texto SVG escapado no export (`<img onerror>`/`<script>` inertes), sem `eval`, sem HTML bruto, validado offline; 5 bugs reais corrigidos na verificação — `return def` ausente, chave `ds.stats` faltando em EN+PT, `autosave` nunca ligado a `saveSoon`, `selectNode` sem `updateInspector`, stats defasadas no idioma) · demais pendentes.
Ver `docs/checklist-u1.md`, `docs/checklist-u2.md`, `docs/checklist-u3.md`, `docs/checklist-u4.md`, `docs/checklist-u4b.md`, `docs/checklist-u5.md`, `docs/checklist-u5b.md`, `docs/checklist-u6.md`, `docs/checklist-u7.md`, `docs/checklist-u8.md`, `docs/checklist-u9.md`, `docs/checklist-u10.md`, `docs/checklist-u11.md`, `docs/checklist-u12.md`, `docs/checklist-u13.md`, `docs/checklist-u14.md`, `docs/checklist-u15.md`, `docs/checklist-u16.md`, `docs/checklist-u17.md` e `docs/checklist-u18.md` para as evidências.

- **U1 — Offline-first shell** (P0) · ✅ **CONCLUÍDA** (`v0.4.0`): `sw.js` + manifest + ícones +
  status de rede + registro seguro. *Validado:* reload offline monta shell e ferramentas produzem
  resultado; 0 requests externas; `file://` intacto.
- **U2 — Project store + backup/restore** (P0) · ✅ **CONCLUÍDA** (`v0.5.0`): `VT.db` (IndexedDB) +
  schema/migrações + export/import `.json` + card em Settings. *Validado:* round-trip de backup;
  restore com confirmação; Gradient Lab salva/carrega presets offline (servidor derrubado); reset
  limpa `VT.db`; fallback priv-mode.
- **U3 — Paleta de comandos + atalhos + central** (P0) · ✅ **CONCLUÍDA** (`v0.6.0`): `Ctrl+K`, fuzzy,
  ações rápidas, `?`. *Validado:* teclado completo (abrir/mover/executar/ESC com foco devolvido), não
  dispara em inputs, i18n EN/PT, offline com porta fechada e `file://`, SW `v1→v2` auto-atualizado.
- **U4 — Worker pipeline for image tools** (P1) · ✅ **CONCLUÍDA** (`v0.7.0`): `VT.workers` inline-Blob
  Web Worker + OffscreenCanvas, integrado a Image Resizer 1.1.0; lazy loading avaliado e **rejeitado com
  evidência** (≈702 KB same-origin, SW já pré-cacheia ≈399 KB de scripts de apps — complexidade sem ganho
  perceptível). *Validado:* bytes idênticos por SHA-256 (`929a891304bddb42` PNG / `5058bc03a90d9855` JPEG)
  worker ≡ main-thread; long task 121 ms → 73 ms; fallback automático idêntico; online, offline
  (`transferSize: 0`, WebP 8.148 bytes) e `file://` (SW ausente); 20/20 regressão, 0 erros.
- **U4b — Adoção de worker em Compress/Converter/Metadata** (P1) · ✅ **AVALIADA E REJEITADA com evidência**
  (`v0.9.0`, decisão documentada): medido em navegador real (3200×2400) antes de integrar. O blit 1:1 custa
  **≈0 ms** e o navegador já codifica fora da thread principal → **0 long tasks** no caminho atual e no
  worker, com saída **byte-idêntica** (SHA-256 `24cd359d…`) — logo, sem ganho de responsividade. Metadata é
  parsing EXIF puro (para no SOS `0xDA`, sem canvas) que o worker não atende. **Nenhuma linha de código das
  apps mudou**; só o Resizador (escala por pixel real) mantém o worker. Ver `docs/checklist-u4b.md`.
- **U5 — Undo/redo framework** (P1) · ✅ **CONCLUÍDA** (`v0.8.0`): `VT.history` (controller de
  snapshots só em memória, pilha limitada, coalescência de digitação, `Ctrl+Z`/`Ctrl+Shift+Z`/`Ctrl+Y`),
  integrado à Prévia de Markdown 1.1.0 (botões + teclado). *Validado:* um passo por pausa; round-trip
  Sample→editar→Limpar; estado desabilitado segue `canUndo/canRedo`; sair da ferramenta reinicia o
  histórico (sem vazamento); 0 erros; regressão 20/20.
- **U5b — `VT.history` → JSON Formatter + SVG Studio** (P1) · ✅ **CONCLUÍDA** (`v0.9.0`): as duas apps
  1.1.0 consomem o framework **sem mudança de core**. JSON Formatter registra digitação/Exemplo/Limpar e o
  `apply` reexecuta `process()` (refazer revalida a saída). SVG Studio registra digitação/Limpar/**Otimizar
  /Recolorir/Carregar arquivo** e o `apply` re-saneia/re-analisa/re-renderiza; `syncHist` promovido a escopo
  de módulo para o `loadFile`. *Validado (navegador real):* round-trip por botões e teclado em todos os
  caminhos; remount reinicia sem leak; saída revalidada; **0 console erros**; regressão 20/20; offline
  `transferSize: 0` (história.js + as duas apps servidas do cache do shell `v7→v8`); `file://` funcional.
- **U6 — Flagship Data Workspace** (P1): JSON tree edit + query + CSV↔JSON + schema (integra JSON
  Formatter existente, sem redundância). *Verificação:* ground truth independente, export válido.
- **U7 — Flagship CSS/Glass Lab** (P1): gerador visual de superfícies/gradientes/sombras alinhado à
  identidade (integra Gradient Lab). *Verificação:* CSS exportado == preview pixel-a-pixel.
- **U8 — Productivity + Documents** (P2): catálogo restante (Focus, Pomodoro, Word Counter, Case,
  Cleaner, Units; PDF suite com dep local justificada). *Verificação:* por ferramenta, como F2.
- **U9 — Flagship Vector/Notes/Playground** (P2/P3): conforme valor e segurança comprovados.
- **U10 — Release 1.0**: verificação total, docs, inventário, licenças, git, performance/a11y audit.

> O roadmap é adaptativo (diretiva §14): a ordem pode mudar conforme descobertas, mas cada unidade
> permanece coerente e auditável. Não implementar tudo de uma vez.

---

## 5. Critérios de excelência & regras inegociáveis (carregados da diretiva)

Avaliar continuamente: **Produto** (resolve problema? merece existir?) · **Design** (profissional?
identidade? hierarquia? todos os estados?) · **Engenharia** (sólido? erros? sustentável?) ·
**Independência** (offline? assets locais? dados no dispositivo? exportável?) · **Documentação**
(aprende-se? limitações claras? confere com a implementação?) · **Confiabilidade** (testes executados?
evidências? regressões? resultados conferidos?).

Regras: preservar o aprovado · não destruir o existente · sem ferramentas superficiais · sem inventar
testes · sem protótipo como produto · sem dep sem justificativa · sem CDN para o essencial · sem envio
silencioso · sem sacrificar a11y por estética · sem sacrificar performance por animação · sem doc
faltando · não ignorar problemas de teste · não esconder limitações · "compila" ≠ concluído ·
criatividade além das sugestões iniciais.

---

## 6. Próximo passo · Veredito

Auditoria e visão (Etapas A–C) concluídas. Fundação sólida e aprovada. O salto de qualidade está na
**independência real** e na **experiência unificada**, antes de expandir o catálogo.

**Progresso:** U1 (offline-first shell), U2 (project store + backup/restore), U3 (paleta de comandos),
U4 (worker pipeline de imagens), U5 (undo/redo em Markdown), U5b (desfazer/refazer em JSON Formatter +
SVG Studio), U4b (avaliação evidence-gated de worker em Compress/Converter/Metadata), **U6 (Flagship Data
Workspace — 21ª ferramenta)**, **U7 (Flagship Visual Page Builder — 22ª ferramenta)**, **U8 (Flagship Design
System Lab — 23ª ferramenta)**, **U9 (Flagship Playground — 24ª ferramenta)**, **U10 (Flagship CSS Animation Studio — 25ª ferramenta)**, **U11 (Flagship Component Builder — 26ª ferramenta)**, **U12 (Flagship Image Studio — 27ª ferramenta)**, **U13 (Flagship Favicon & Icon Studio — 28ª ferramenta)**, **U14 (Flagship SVG Editor — 29ª ferramenta)** e **U15 (Flagship Notes Workspace — 30ª ferramenta)** foram implementadas e **validadas em navegador com evidências reais** — não apenas
`node --check`. A plataforma persiste projetos localmente (IndexedDB), sobrevive a recarga offline, navega por
teclado de ponta a ponta, roda o escalonamento pesado de imagem fora da thread principal com byte-identidade
provada, oferece desfazer/refazer profissional em três editores, entrega uma bancada JSON completa (árvore
editável, busca, CSV↔JSON, diff estrutural, validação de schema, autosave e backup/restore, renderização
incremental de documentos grandes), um construtor visual de páginas com 12 blocos arrastáveis, prévia responsiva,
autosave IndexedDB e exportação HTML escapada (sem `eval`, URLs `javascript:`/`data:` neutralizadas), um estúdio
de tokens ao vivo que sintoniza a identidade de vidro diurno (Frutiger Aero) e exporta CSS a partir apenas de valores
validados, e um playground de HTML/CSS/JS que executa o código do usuário num iframe isolado de origem opaca
(`allow-scripts`, nunca `allow-same-origin`, sem `eval`) — com isolamento comprovado por três sondas `SecurityError`
e console capturado via shim de `postMessage` serializado —, um estúdio visual de animação CSS que compila
`@keyframes` a partir apenas de valores validados pelos controles (tempo, curva de easing com gráfico, quadros com
transformação/opacidade/cor/raio) e prévia ao vivo com play/pause/restart —, e um construtor visual de componentes
de UI (botão/selo/alerta/cartão) que renderiza ao vivo na identidade, produz saída HTML + CSS simultânea com todo
texto escapado e apenas valores validados (sem HTML livre, sem `eval`), com undo/redo, autosave e exportação
`.html` autossuficiente — e um estúdio de imagem local não destrutivo que decodifica a imagem uma vez num canvas e
aplica cada edição (rotação, espelhamento, recorte por proporção, pilha de filtros CSS) como parâmetro no momento
do desenho, com Comparar, undo/redo do estado de edição, autosave + projetos nomeados e exportação em resolução
total (PNG/JPEG/WebP) usando a mesma string de filtros da prévia — e um estúdio de favicon/ícone de app que renderiza
monograma ou imagem por uma única rotina compartilhada nas resoluções reais 16–512 px, com formas (círculo/arredondado/
quadrado), preenchimentos (sólido/degradê/transparente), grade ao vivo, exportação em lote, `site.webmanifest` gerado e
undo/redo apenas das opções (nunca da imagem) — e uma bancada vetorial visual que manipula um pequeno modelo de
documento (centro+tamanho+rotação por forma) tanto no canvas ao vivo quanto no markup exportado, com arrastar/redimensionar/girar,
grade, camadas reordenáveis, undo/redo do documento inteiro, autosave + projetos nomeados e exportação SVG/PNG — e uma bancada de
notas Markdown local-first que guarda muitas notas nomeadas no IndexedDB com tags, oferece prévia ao vivo segura (escapa todo texto,
bloqueia HTML bruto e mantém só protocolos http/https/mailto/#, sem `eval`), busca, filtro por tag, modos Escrita/Dividido/Prévia,
undo/redo do corpo, autosave com *flush* ao trocar de nota ou sair (nada se perde na janela do debounce) e restauração da última
nota/visão — e, onde o dado não apoiou (Compress/Converter/Metadata), **recusou a integração com as medições
documentadas**, em vez de integrar por integrar.

**U16 ✅ CONCLUÍDA — Quadro Kanban / Kanban Board** (0.20.0, 31ª ferramenta, flagship): quadro de
tarefas local-first com colunas e cartões arrastáveis por ponteiro (fantasma + espaço reservado), editor lateral do
cartão (título, descrição, tags, concluído), undo/redo do quadro inteiro via `VT.history`, autosave/restore no
IndexedDB (`kanban:autosave`), projetos nomeados, busca e exportação JSON/Markdown. *Validado em navegador com
evidências reais:* arrastar-e-soltar *To do → In progress* com posição confirmada e undo/redo do arraste; ida e volta
de cartões/colunas no IndexedDB com restore pós-reload; segurança (payload `<img onerror>` vira texto inerte, sem
`eval`/HTML bruto); botões de desfazer habilitando conforme a pilha (bug real encontrado e corrigido); responsivo e
**offline** (servidor derrubado: `curl` exit 7, navegação e `kanban.js`/`apps.css`/`app.js` com `transferSize: 0`).

**U17 ✅ CONCLUÍDA — Bancada de Documentos / Document Workshop** (0.21.0, 32ª ferramenta, flagship; **primeira a
preencher a categoria Documents**): editor local-first de documentos prontos para impressão — seções ordenadas em
Markdown seguro sob um cabeçalho (título, autor, data), sumário automático, temas serifa/sem serifa e tamanho de fonte
ajustável, modos Escrever/Dividido/Prévia, reordenação/exclusão de seções, undo/redo do documento inteiro via
`VT.history`, autosave/restore no IndexedDB (`dw:autosave` + projetos nomeados) e exportação para HTML autônomo
imprimível, `.md` e impressão pelo diálogo do navegador (iframe oculto com CSS só de impressão). *Validado em navegador
com evidências reais:* Sample → 3 seções (73 palavras) com headings/negrito/código (inline + cercado)/citação/listas/
réguas e **checkboxes reais** (`dw-cb`, 3, 2 marcados) + TOC de 3 âncoras; botões de desfazer/refazer do documento
(4→3→4); ida e volta no IndexedDB com restore pós-reload (seções + modo); projeto nomeado com autosave excluído;
Export HTML (`<!doctype html>`) e MD (`#`-raiz) capturados via stub; **Print** comprovado com `print()` do iframe
remendado (sem diálogo real) e documento com doctype + seções. **Segurança:** `<img onerror>`/`<script>`/`javascript:`
viram texto inerte, `window.__pwned` fica `undefined`, sem `eval`/HTML bruto. i18n EN+PT. **Offline** (servidor
derrubado, `curl` exit 7): navegação + **62 recursos** (incl. `document-workshop.js` corrigido) com `transferSize: 0`.
Três bugs reais encontrados e corrigidos na verificação: `saveTimer` não declarado (impedia toda renderização),
checkboxes de tarefa escapados em vez de emitidos, e `record()` sem `syncHist()` (mesma classe do bug do Kanban).
*Nota honesta:* screenshot pendente — a superfície do navegador embutido reporta `visibilityState: hidden` (mesma
limitação registrada no Kanban); o layout foi validado por DOM + estilos computados. Ver `docs/checklist-u17.md`.

**U18 ✅ CONCLUÍDA — Estúdio de Diagramas / Diagram Studio** (0.22.0, 33ª ferramenta, flagship): editor local-first de
fluxogramas/diagramas em SVG — nós tipados (retângulo, losango, cápsula, anotação) com estilos por tipo, conexões
ortogonais com setas via fluxo **Link** em duas etapas, arrastar-e-soltar por ponteiro (reaproveitando a técnica da
Kanban Board) com **snap a grade de 8px**, inspetor ao vivo (rótulo, tamanho, preenchimento, contorno, tipo) do nó ou da
aresta selecionada, undo/redo do diagrama inteiro via `VT.history`, autosave/restore no IndexedDB (`ds:autosave` +
projetos nomeados) e exportação **SVG** limpo e **PNG** 2× a partir do mesmo modelo. *Validado em navegador com
evidências reais:* Sample → **4 nós · 3 arestas** com marcador de seta; cada um dos **4 tipos** adiciona nó; **arrastar
um nó** (PointerEvents sintéticos) move (40,60)→(120,112) com snap e **undo/redo** restaura exatamente; **Link em duas
etapas** adiciona exatamente 1 aresta; clique na aresta seleciona e edita o rótulo no SVG; **excluir nó cascateia suas
arestas** (8→7 nós, 4→2 arestas) por diálogo de confirmação; **autosave captura edições ao vivo** e **reload restaura**;
projeto nomeado save→mudar→**Open** com autosave excluído da lista; **Export SVG** com rótulos escapados e **Export PNG**
blob válido **1440×960**. **Segurança:** rótulo `<img onerror>`/`<script>` fica inerte no quadro e escapado
(`&lt;img…&gt;`) no export, `window.__pwned` `undefined`, sem `eval`/HTML bruto. **i18n EN↔PT reverbera até o contador de
stats.** **Responsivo:** a 666px o quadro colapsa para coluna única (regra ≤980px). **Offline** (servidor derrubado,
`curl` exit 7): navegação + **todos os recursos** com `transferSize: 0`, zero bytes de rede, Sample ainda renderiza na
0.22.0. Cinco bugs reais encontrados e corrigidos na verificação: `return def` ausente (handle do módulo `undefined`),
chave `ds.stats` ausente em EN+PT, `scheduleSave()` despachando um handle `autosave` nunca ligado a `saveSoon` (edições
não persistiam), `selectNode()` sem `updateInspector()` (painéis ficavam ocultos) e stats defasadas ao trocar idioma
(ouvido `vt:lang` adicionado). 0 erros/avisos no console; SW reprecachado (`v40→v41`); regressão cross-tool limpa
(notes / kanban / document-workshop / hub montam). *Nota honesta:* screenshot pendente — a superfície do navegador
embutido reporta `visibilityState: hidden` (mesma limitação do Kanban/Document Workshop); layout validado por DOM +
estilos computados. Ver `docs/checklist-u18.md`.

**Próxima unidade · U19 — Estúdio de Mapas Mentais / Mind Map Studio** (P1 flagship, alta utilidade e impacto visual):
editor local-first de mapas mentais — um nó central com ramificações recursivas, expansão/colapso de ramos, layout radial
ou em árvore calculado no cliente, arrastar para reposicionar, edição de rótulo, cores por ramo, undo/redo do mapa
inteiro via `VT.history`, autosave/restore no IndexedDB (`mm:autosave` + projetos nomeados) e exportação **SVG**/**PNG** e
um formato estruturado (JSON) reaproveitando o pipeline de exportação do Diagram Studio. *Verificação planejada:*
criar/fundir/expandir nós com evidência de posição, desfazer/refazer do mapa, ida e volta no IndexedDB com restore,
export SVG/PNG capturados via stub com dimensões reais, segurança (rótulo `<img onerror>`/`<script>` inerte, sem `eval`),
responsivo (≤980px), **offline** com servidor derrubado e `transferSize: 0`, console limpo e regressão cross-tool. A
escolha de U19 segue impacto, utilidade e viabilidade com qualidade acima de quantidade; nenhuma biblioteca externa é
necessária (SVG + Canvas nativos). Alternativas igualmente locais e de alta qualidade para a sequência: **Estúdio de
Linha do Tempo / Timeline Studio** e **Quadro de Wireframes / Wireframe Board**.

As unidades U18 (Diagram Studio), U17 (Document Workshop), U16 (Kanban Board), U15 (Notes Workspace), U14 (SVG Editor),
U13 (Favicon & Icon Studio), U12 (Image Studio), U11 (Component Builder) e anteriores estão concluídas. Lazy loading e a
adoção adicional de `VT.workers` permanecem rejeitados com evidência — ver §4/U4b; `VT.history` já está ativo onde traz
benefício real (U5b, U6, U7, U8, U9, U10, U11, U12, U13, U14, U15, U16, U17, U18).