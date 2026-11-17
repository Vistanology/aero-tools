# Qualidade: acessibilidade, responsividade e verificação

`Não invente resultados de testes. Não diga que algo funciona sem evidência.`
Este arquivo documenta **como** se prova, não o que foi provado uma vez.

## Ciclo de integração de marca — 2026-11-16

Validação desta árvore, distinta dos relatórios históricos abaixo:

A entrada abre a Biblioteca; a apresentação editorial permanece em `#/about`. A regressão final verifica a rota inicial com 34 links, separador decorativo oculto da árvore acessível, animação desativada por movimento reduzido, seis larguras e boot offline da nova entrada.

- `_dev/qa-shell-qoder.js`: 34 ferramentas em 1440, 1280, 1024, 768, 390 e 375px (204 montagens); Home/Biblioteca em PT/EN; busca, ordenação, favoritos, estados vazios, menu e paleta. Zero overflow de página/bancada e zero erros de console no ensaio.
- `_dev/qa-offline-qoder.js`: inicia seu próprio servidor na porta 18795, encerra-o e confirma falha de conexão fora do navegador; recarrega o produto, abre as 34 ferramentas e verifica edição/exportação/restauração IndexedDB sem rede. Cache `vt-shell-v58-vistanology-brand`, 80 entradas, incluindo emblema.
- `_dev/qa-cache-qoder.js`: servidor isolado em porta dinâmica; comprova atualização do cache efetivamente servido, preservação do shell anterior quando falta um asset e preservação de caches de outras aplicações.
- `_dev/probe-contrast2.js http://127.0.0.1:18791/`: nenhum contraste de texto reprovado na amostragem renderizada das 39 vistas. É uma amostragem de pixels visíveis, não certificação WCAG completa.
- `_dev/verify-v1-css.js`: nove arquivos históricos intactos.
- `_dev/qa-flagships-qoder.js`: 12 ferramentas principais, 21 cenários, 74 verificações e 19 downloads validados; zero falhas. Inclui edição, desfazer/refazer, reload, resolução original de imagem, isolamento de autosaves e CRUD/export/import IndexedDB. Evidências em `_dev/qa-flagships-qoder.json`.
- `_dev/qa-utilities-qoder.js`: 22/22 utilitários aprovados, incluindo 20 casos inválidos/limites. Evidências em `_dev/qoder-validation/utilities-report.json`.

As falhas funcionais encontradas foram corrigidas e os ensaios repetidos: colisões de autosave, persistência de desfazer, metadados de documentos, IDs/histórico de mapas mentais, edição/duplicação no Kanban e estado inválido do SVG Studio. Imagens agora preservam os pixels originais nos novos autosaves e projetos; pixels já perdidos por salvamentos antigos não podem ser recuperados.

Resultados e capturas reais: `_dev/qoder-validation/`. Os testes usam perfis descartáveis, sem acessar dados pessoais do navegador. Playwright continua sendo dependência apenas de desenvolvimento, disponível via `NODE_PATH` documentado abaixo. Para o ensaio novo de shell, iniciar `PORT=18791 node serve.js`.

A cobertura não equivale a testar cada combinação de parâmetros de todas as ferramentas, todos os leitores de tela ou outros motores de navegador.

## Verificação visual é obrigatória

Nenhum trabalho de direção de arte termina com "rodou `node --check`" ou com um
relatório escrito. Termina com captura real de navegador comparada com a referência.

### Pipeline

```bash
# 1. servidor local (porta custom; o app inteiro é estático)
PORT=8791 node serve.js &

# 2. Playwright + Chromium real (sem dependências no app)
export NODE_PATH="C:/Users/csarn/OneDrive/Documentos/Projects/windows/aero-software/node_modules"

node _dev/regress-aero.js        # 34 ferramentas montam, sem erros de console
node _dev/probe-contrast2.js     # contraste medido em pixel composto, todas as vistas
node _dev/probe-token-conformance.js  # cada valor pintado existe na escada de tokens?
node _dev/probe-overlay.js       # o que modal, confirm e paleta pintam de verdade
node _dev/probe-mobile-benches.js  # overflow horizontal das 34 bancadas em viewport estreito
node _dev/probe-focus-ring.js    # o corte de um container com scroll come o anel de foco?
node _dev/probe-focus-loss.js    # cada focável do produto: o estado focado muda alguma coisa?
node _dev/verify-select-affordance.js  # todo select de porcelana ainda tem chevron e reserva?
node _dev/verify-qr-states.js    # vazio / inválido / válido do QR Studio, em runtime
node _dev/verify-v1-css.js       # integridade do snapshot v1_css/
node _dev/offline-aero.js        # SW/offline
```

Cada script tem um número de saída e um artefato. Se um deles não rodar, o item é
relatado como **não verificado**, não como aprovado.

### O que cada um realmente faz

| Script | Afirmação | Artefato |
|---|---|---|
| `_dev/regress-aero.js` | 34/34 ferramentas montam; busca/filtro/aba; paleta abre e fecha; i18n troca PT↔EN; IndexedDB grava; as 8 imagens da Home carregam; overflow horizontal mobile = 0px; zero console errors | `_dev/shots/*.png` |
| `_dev/probe-contrast2.js` | para todo elemento com texto visível, captura o screenshot, relê o PNG por canvas e usa a **cor modal do pixel** sob a caixa como fundo. Compara com `color` computado; AA 4.5:1, 3:1 para texto grande (`px≥24 \|\| px≥18.66 \|\| (peso≥700 && px≥17.33)`) | `_dev/contrast-report.json` |
| `_dev/verify-v1-css.js` | confere SHA-256 dos 9 arquivos de `v1_css/` contra `_dev/v1-css-hashes.json` e avisa se apareceu arquivo não registrado | stdout `V1_CSS_INTEGRITY: OK (9 arquivos…)` |
| `_dev/offline-aero.js` | sobe online, grava um canário em storage, **pára o servidor** e recheca: boot offline, uma ferramenta montando e as requisições de rede realmente usadas | stdout (`offline boot` / `offline tool` / `offline network usage`) |
| `_dev/probe-token-conformance.js` | lê a escada (`--r-*`, pesos) do documento vivo e pergunta, por propriedade, se o valor que um controle pinta é um valor que o sistema sabe nomear. Raio composto (abas) e `0px` são contados como papel, não como deriva | stdout (valores em uso × fora da escada × ferramentas) |
| `_dev/probe-overlay.js` | abre o confirm real de uma ferramenta e a paleta real, e mede scrim, elevação, cabeça, rodapé, linha-cursor e teclas — inclusive com `data-glass="solid"` ligado, que é onde a preferência de acessibilidade estava vazando | stdout |
| `_dev/probe-mobile-benches.js` | percorre as 34 bancadas em viewport estreito (largura é argumento) e mede, por ferramenta: `scrollWidth − clientWidth` do documento, quantos elementos passam da borda direita e quantos têm scroll próprio. Elemento dentro de um corte interno **não** é overflow: é a solução | stdout (`ferramentas / com overflow ou estouro / límpias`) |
| `_dev/probe-focus-ring.js` | pergunta se o recorte de um container com scroll come o anel de foco: mede a folga vertical de cada botão dentro da pílula e marca os que estão fora do scrollport. É o instrumento que transforma "rolou" em "continua acessível ao teclado" | `_dev/shots-ovl/dg-focus-ring-375.png` |
| `_dev/probe-focus-loss.js` | percorre **todo elemento focável** de 15 vistas, foca com `focus({focusVisible:true})` (é o que faz `:focus-visible` casar; um `focus()` comum mede o anel errado e dá falso negativo), lê o estilo, tira o foco e compara. Se nada mudou em outline, box-shadow, borda ou fundo, pergunta aos ancestrais se algum assumiu o anel — e separa "herdado do container" de "sem indicador nenhum" | stdout (`focáveis medidos / sem indicador / anel herdado`) |
| `_dev/shot-focus.js` | folha antes/depois dos controles que o probe marcou: chapa de busca da Library, banda de busca da paleta e as abas do Data Workspace, com o mesmo estado de foco dos dois lados e um tile que tinha de continuar idêntico | `_dev/before-after/34-focus-ring-pair.png` |
| `_dev/shot-overlay.js` · `_dev/shot-control-governance.js` · `_dev/shot-selected-contract.js` | folhas de contato antes/depois entre duas árvores servidas em portas separadas. Cada caso **coloca as duas árvores no mesmo estado** (nota criada, camada selecionada, diálogo aberto) e recusa fotografar se o estado não se confirmar; um controle por folha tem de provar que não se moveu | `_dev/before-after/30…33-*.png` |
| `_dev/shot-step-family.js` | a folha da família `.step` (11 ferramentas): QR preenchido, QR vazio, Gradient Lab, Font Preview, UUID, rail do Favicon Studio, painel de presets, lista do Notes e um tile da Biblioteca como controle. Cada caso afirma o estado antes de fotografar (≥1000 px escuros no canvas do QR, exatamente um `aria-pressed`, exatamente uma nota selecionada) e, quando o clip muda de tamanho, imprime os **valores computados** em vez de um % | `_dev/before-after/35-step-family-pair.png`, `_dev/shots-step/*.png` |
| `_dev/verify-qr-states.js` | 15 asserções de runtime sobre o palco do QR Studio: vazio mostra a moldura e não o alerta, inválido mostra erro, válido desenha, trocar de tipo volta a vazio, e o modo sólido continua legível. Sai com código ≠ 0 se qualquer uma falhar | stdout `QR_STATES: OK` |
| `_dev/verify-select-affordance.js` | os 42 `select.input` das 34 bancadas: o chevron (`background-image: linear-gradient`) sobrevive e o `padding-right` ainda reserva espaço para ele. É a guarda da classe de bug que o atalho `background:` cria — e o autoteste negativo (reinjetar o atalho) mostra `background-image: none`, logo o instrumento pega a classe, não o caso | stdout `SELECT_AFFORDANCE: OK` |
| `_dev/diff-region.js` | recebe dois PNGs e diz **onde** eles diferem: bounding box, contagem por linha e uma máscara vermelha. É o instrumento que separa diferença de estilo de diferença de horário, de fase de animação e de antialiasing de borda | `_dev/shots-step/diff-region.png` |
| `_dev/revert-step-tree.js` | a receita da árvore-before isolada deste incremento: cópia da árvore atual com as hunks do incremento revertidas (servida em 8799). Sem git, é o único modo de reconstruir a comparação — e é por isso que ela fica no repositório, não numa sessão | `_dev/before-tree-step/` |
| `_dev/shot-consolidated-0-25.js` | a captura de fechamento de versão: Home, Biblioteca e oito bancadas flagship nas mesmas condições (1440×900, imagens decodificadas, atmosfera congelada), recusando fotografar qualquer vista cujo elemento definidor não apareceu. Verifica o que o bump pode quebrar e "34 montam" não vê: `VT.version` = a versão do arquivo, o badge do shell = a mesma versão, a página Aberto termina na release nova, nenhuma imagem quebrada (é assim que se prova que um asset removido era mesmo inalcançável) e zero erro de console | `_dev/before-after/36-consolidated-state.png`, `_dev/shots-final/consolidated-report.json` |

### Condições de captura equivalentes (a parte difícil do antes/depois)

Sem git, a comparação honesta exige árvore isolada **e** método. O que foi medido até
achar o piso de ruído, nesta ordem:

1. **A árvore "antes" tem de ser a deste incremento.** Comparar com uma cópia antiga
   (8798) deu controle 0,79% sem nenhum estilo ter mudado. A cópia isolada
   `_dev/before-tree-step/` (porta 8799) é a árvore atual com só as seis hunks deste
   incremento revertidas.
2. **O seed tem de funcionar nas duas árvores.** Um seed que clica `#nt-save` ou aperta
   `Ctrl+S` — ids/atalhos que o Notes nunca teve — fotografa a árvore nova e a si mesmo.
   O Notes não tem atalho de salvar: o autosave dispara 600ms depois do último input
   (`js/apps/notes.js:199`), e os tempos do seed são os medidos (400ms após "Nova",
   1400ms após o título). Com wait apertado em texto de DOM, a primeira nota era salva
   sem título — artefato da folha, corrigido na folha, não no produto.
3. **Esperar decode.** Sem `reload({waitUntil:'networkidle'})` + `document.images`
   completos + settle, o CONTROLE acusava 0,17% com a cadeia inteira de estilos
   computados idêntica. A máscara de diferença mostrava o arco do brilho e os cantos do
   clip: pixels de imagem, não de estilo.
4. **Congelar a atmosfera.** Os tiles da Biblioteca são vidro translúcido sobre
   `css/background.css`, que tem animações infinitas (`vt-bubbles`, `vt-shimmer`,
   `vt-tide`). Na mesma árvore, duas passadas, o controle variou de 0,00% a 0,53% — 519
   px na faixa diagonal do brilho. A condição de captura passa a ser
   `body[data-motion="reduced"]` (o contrato de acessibilidade do produto,
   `tokens.css:268`), aplicada **nas duas árvores**; com ela, a mesma árvore dá 0,00% e o
   controle da folha dá 0,00%.
5. **O controle é medido por estilo aplicado, não por pixel.** A folha compara, em cada
   um dos 37 elementos dentro do clip do controle, todas as propriedades calculadas que
   não são customizadas: idênticas. As únicas diferenças são as declarações
   `--well-fill`/`--well-shadow`, que agora existem no `:root` e se herdam — e nenhum
   consumo delas está dentro do tile (os consumidores são `components.css:352` e
   `apps.css:43`). Propriedade customizada sozinha não é evidência visual; o que conta é
   a propriedade aplicada que a lê.
6. **Quando o clip muda de tamanho, o % não é a prova.** `qr-filled` passou de
   1232×715 para 1232×727; a folha imprime `paddingTop 22→20`, `borderRadius 22→16`,
   `borderBottomWidth 0→1px`, `--sel-fill` do tile, o poço do pedestal. O número de
   pixels entre imagens de tamanhos diferentes não significa nada.
7. **Quando o conteúdo também muda, medir o ruído do conteúdo.** Na lista do Notes as
   duas árvores têm horários diferentes por construção (IndexedDB por porta). Duas
   passadas da **mesma** árvore se diferenciam em 0,55% (só os dígitos, colunas 94–124);
   o par antes/depois dá 17,48%. A diferença é de estilo, e isso é uma medição, não uma
   alegação.

Por que o probe lê pixels de verdade: gradientes empilhados, `backdrop-filter` e
imagens tornam o "fundo" de um texto uma coisa que nenhuma inspeção de CSS responde.
Foi assim que apareceram as 14 falhas de uma só classe — o badge em tinta escura
sobre chapa navy — e assim que se confirma que elas sumiram: **0 falhas nas vistas
cobertas**, com o relatório JSON aberto para conferência.

O contador não é decorativo, e já provou isso três vezes. Uma falha voltou a aparecer
depois de um incremento que não tocava em texto nenhum: o rótulo inativo do seletor
EN|PT media 3,88:1 sobre o hero da Home, e o motivo era a *trilha* translúcida do
toggle, não a tinta (branco puro daria 4,43 nesse fundo). E o probe de camadas flagrou
que `data-glass="solid"` — a preferência de acessibilidade — desligava o desfoque nas
34 bancadas e o deixava ligado atrás da command palette, porque os dois overlays
escreviam o próprio `blur()`. E a terceira é do lote de foco: `[tabindex="-1"]:focus { outline: none }`
parece uma regra sobre containers, mas as abas do Data Workspace são `button[role=tab]`
com `tabindex="-1"` — padrão de tablist — e estavam sem nenhum indicador, assim como o
campo de busca da Library, cujo `outline: none` vivia numa regra de estado normal.
Nenhum dos três apareceria em revisão de código; os três
só existem porque algo mediu o pixel.

### Estado atual (medição, não memória)

Reproduzível com os comandos acima. A primeira lista é de `2026-11-16`, re-run depois da
família `.step` (folha 35) e da correção do chevron. O bloco seguinte é a **mesma suíte
rodada de novo sobre a versão consolidada 0.25.0** (bump + Service Worker `v55` + saída
do `empty-bloom` do pacote), porque resultado antigo não vale como teste de versão nova:

```
tools mounted: 34 / 34     mobile overflow (Home): 0px     console errors: nenhuma
overflow do documento nas 34 bancadas, 375px e 320px: 0px em todas
CONTRAST FAILURES: 0       V1_CSS_INTEGRITY: OK (9 arquivos, nenhum não registrado)
ferramentas: 34 | controles: 787 | assinaturas distintas: 68 | isoladas: 40
focáveis medidos: 586 | sem indicador: 0 | anel herdado do container: 5
SELECT_AFFORDANCE: OK (42 selects)   QR_STATES: OK (15 asserções)
raio: 9 valores em uso, 1 fora da escada (o excepcional autorizado: input.ds-input 10px)
offline: 34 ferramentas / 63 de 63 recursos do cache / 0 bytes de rede
CONTROLE da folha 35: 0,00% de pixels e 37 elementos com estilo aplicado idêntico
```

```
0.25.0 (2026-11-16, pós-bump):
tools mounted: 34 / 34 · home images 8/8 · persistence db:true · i18n OK · console: nenhuma
CONTRAST FAILURES: 0 · biblioteca 28/28 pontos ok (pior razão medida 5,15)
controles: 787 · assinaturas: 68 · isoladas: 40
focáveis: 586 · sem indicador: 0 · anel herdado: 5
SELECT_AFFORDANCE: OK (42 selects) · QR_STATES: OK · V1_CSS_INTEGRITY: OK (9 arquivos)
mobile: 34 ferramentas, 3 com scroll próprio, overflow do documento 0px, 0 erros
offline (servidor parado): cache vt-shell-v55-consolidated-system · shell 79 entradas ·
  63/63 recursos do cache · 0 bytes · 34 ferramentas montadas · hero e 8 imagens ok
Aberto: 25 releases renderizadas (antes da correção: 19) · badge do shell v0.25.0
folha final: _dev/before-after/36-consolidated-state.png (10 vistas, movimento reduzido)
```

Três ferramentas (`data-workspace`, `kanban`, `diagram-studio`) continuam com elementos
que passam da borda direita em 375px **dentro de containers com scroll próprio**
(`scrollWidth − clientWidth` do documento = 0px nelas também). Isso é a solução, não
overflow, e está registrado aqui para não ser relido como regressão.

O que a folha 35 encontrou de verdade foram duas regressões causadas por ela mesma, ambas
corrigidas antes do fechamento e ambas agora guardadas por instrumento: o atalho
`background:` no poço apagava o chevron dos selects (rail do Favicon Studio) e o
`padding:` do campo compacto do Data Workspace devorava a reserva do chevron
(`#dw-indent`). Nada disso apareceria em "34 ferramentas montam".

## Acessibilidade

| Requisito | Como está garantido |
|---|---|
| Contraste de texto | arquitetura de tinta por substrato ([tokens.md](tokens.md#contrato-de-substrato)); medida em pixel real, 0 falhas |
| Contraste não-texto | bordas de chapa ≥ 3:1; brilho e sombra interna **não** contam como contraste |
| Foco visível | `outline: 2px solid var(--focus-ring)` com `outline-offset: 2px` em `:focus-visible` (`base.css:47`). Medido, não prometido: `_dev/probe-focus-loss.js` percorre **586** elementos focáveis de 15 vistas e hoje conta **0 sem indicador**; 5 campos são transparentes por projeto e recebem o anel pelo container (`.search-bar`, `.pal-search`, `.nt-sheet`) |
| Sem dependência de cor | estado, erro e sucesso sempre acompanhados de ícone e/ou texto |
| Movimento reduzido | `prefers-reduced-motion` **e** `body[data-motion="reduced"]` desligam animação/transição globais |
| Sem blur | `body[data-glass="solid"]` remove blur e fecha os vidros — todas as elevações continuam legíveis |
| Teclado | `Ctrl+K` (paleta), `?` (atalhos), atalhos por bancada; `Ctrl+Shift+Z` = refazer em todos os editores com undo |
| Imagem decorativa | `alt=""` + `aria-hidden="true"`; leitor de tela não anuncia arte de fundo |
| Idioma | i18n PT/EN em todo texto de UI; nada de string hardcoded em ferramenta nova |
| Semântica | landmarks do shell, headings em ordem, `hidden` em vez de `display:none` para estados |

Isto não é uma auditoria formal: o teste automatizado cobre contraste, foco programático
e atalhos. Validação com leitor de tela real não foi executada e não deve ser
declarada como feita.

### Onde o anel mora

O anel é um, e quem o pinta depende do que o usuário vê. Três casos existiam no produto
sem indicador nenhum, e os três passaram a existir porque `_dev/probe-focus-loss.js` comparou
o estado focado com o mesmo elemento sem foco — inspeção de CSS não responde nenhuma deles:

| Caso | O que estava acontecendo | Onde o anel foi morar |
|---|---|---|
| Abas do Data Workspace | `button[role=tab]` com `tabindex="-1"` (padrão de tablist: só a aba selecionada está na fila de TAB; as setas movem entre elas) caía dentro de `[tabindex="-1"]:focus { outline: none }`, que é uma regra sobre **containers** | a regra agora exclui controle interativo (`base.css:57`); as quatro abas voltaram a ter anel |
| Chapa de busca da Library | o campo é sem borda de propósito — quem tem material é a chapa — e `outline: none` no input calava o controle inteiro | `.search-bar:focus-within` (`shell.css:349`) |
| Banda de busca da paleta | idem, e um anel por fora seria recortado pela borda do diálogo | `.pal-search:focus-within` com `outline-offset: -2px` (`components.css:248`) |

A cor do anel era um literal escrito em dois arquivos e sem nome; hoje é `--focus-ring`
([tokens.md](tokens.md)). E o anel tem de caber onde o controle é recortado: um container
com `overflow` recorta os descendentes, inclusive o retângulo de foco — ver
[components.md](components.md#o-que-quebra-e-o-que-rola).

## Responsividade

Breakpoints em `css/responsive.css`: **1024 / 980 / 768 / 640 / 480 / 420 / 360**.

- as composições de marca passam de coluna dupla para coluna única e o hero troca
  `display-xl` pela escala menor;
- as bancadas de canvas empilham rail → mesa → inspetor (o inspetor não espreme o
  canvas);
- mobile é verificado com viewport real (375px no regress) e a métrica é **overflow
  horizontal em pixels**, que hoje é 0. Tela estreita sem captura é opinião, não teste.

### As 34 bancadas, não só a Home

O regress media a Home e a Biblioteca. `_dev/probe-mobile-benches.js` percorre as 34
ferramentas a 375×720 e mede o documento, o que passa da borda direita e o que tem corte
interno. Em `2026-11-16`, a 375px e a 320px: **overflow do documento = 0px nas 34**.

O que sobrou não é defeito: `data-workspace` (trilha de abas), `kanban` (colunas) e
`diagram-studio` (a pílula de nós e a folha A4 de 720px) têm elementos que ultrapassam a
borda direita **dentro de um scrollport próprio** — o corte é a solução, não o problema.

O que era defeito tinha nome: a pílula segmentada de nós do Diagram Studio media 378px de
largura intrínseca contra 375px de viewport e empurrava o documento 32px para o lado. Um
controle segmentado não pode quebrar em duas linhas dentro de um raio 999px, nem encolher
abaixo das próprias etiquetas. A correção é de layout, no guard-rail de 980px: a pílula
rola dentro da própria borda. Duas consequências tiveram de ser medidas, não presumidas:

- um container com recorte também **recorta o anel de foco**: com `padding: 3px` e o anel
  de 2px em `outline-offset: 2px`, cada botão perdia 1px do retângulo de foco. O padding
  passou a `--sp-1` (6px) e `_dev/probe-focus-ring.js` confere a folga (7px acima/abaixo).
- o scroll-into-view estacionava o último botão encostado na borda de recorte, comendo 3px
  do anel. `.dg-tool` levou `scroll-margin-inline: 4px` — a folga medida passou de 1px para 5px.

O controle da folha `_dev/before-after/33-mobile-bar-pill-pair.png` é a mesma barra a
1440px: 378px de largura, `overflow-x: visible`, `padding: 3px`, **0,00% de pixels
alterados**. Corrigir o estreito sem mover o largo é o teste que separa correção de
retoque.

## `v1_css/` — o snapshot

Diretiva §2: o CSS do site institucional fica **congelado, com hash e manifesto**.

- 9 arquivos copiados de `https://vistanology.github.io/our-site/`, documentados por
  uso em [snapshots.md](snapshots.md);
- `_dev/write-snapshot-manifest.js` regenera `snapshots.md`; `_dev/verify-v1-css.js`
  confere os hashes contra `_dev/v1-css-hashes.json`;
- **nada é importado** do snapshot: ele é referência de consulta (medir paleta,
  hierarquia de tipo, ritmo de espaçamento). Copiar as regras produziria um clone de
  baixa qualidade do site — que é exatamente o que a missão proíbe;
- nenhum arquivo novo é escrito dentro de `v1_css/`; se o site institucional mudar, a
  decisão de re-snapshot é explícita e documentada, não automática.

## Cache e versão

`sw.js` carrega uma `VERSION` que muda junto com qualquer alteração visível de CSS ou
arte; sem o bump, o offline serve a marca antiga e o "antes/depois" passa a comparar
duas versões diferentes do app. `VT.version` (`js/app.js:2`) é a versão do produto e
muda por release, não por ajuste fino.

Fechamento 0.25.0 (2026-11-16): `VT.version` 0.24.0 → **0.25.0**, `sw.js:12`
`v54-keyart-dawn` → **`v55-consolidated-system`**. Os cinco lugares que precisam
concordar e foram conferidos um a um: `js/app.js:2`, `sw.js:12`, a entrada nova em
`VT.releases` (`js/core/registry.js`, usada pela página "Aberto" em `js/shell/open.js:46`),
`CHANGELOG.md` e o título de status de `README.md:40`. `package.json`/`app.webmanifest`
não carregam versão. O `v1_css/` continua registrando 0.23.0 por definição — é o
snapshot anterior ao redesign, não uma versão corrente.

**Razão da mudança:** `0.24.0 → 0.25.0` é *minor*: nenhuma ferramenta nova, nenhuma
API pública alterada, nada quebrado — é o sistema visual consolidado (famílias de
bancada, poço, seleção, key art v54) sobre as mesmas 34 ferramentas. Houve remoção de
um arquivo de arte, mas ele era inalcançável, então não é breaking para ninguém.

## Checklist de fechamento de um ciclo de direção de arte

1. `node serve.js` de pé e a mudança visível em navegador real (não em descrição).
2. Captura da tela alterada + da tela relacionada (Home/biblioteca/ferramenta).
3. Comparar com `_dev/ref/` (site oficial) **e** com o estado anterior (`_dev/shots-v3/`).
4. Rodar regress + probe + verify; registrar as saídas.
5. Checar os dois substratos e as duas saídas de acessibilidade (`solid`, `reduced`).
6. Perguntar: *isto parece desenhado por uma equipe profissional de produto e direção
   de arte, ou parece um template bem arrumado?* Se for a segunda opção, o ciclo
   continua — a resposta não é do relatório.
7. Atualizar este diretório quando a decisão for de sistema (não quando for de pixel).
