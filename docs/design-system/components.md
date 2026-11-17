# Componentes, materiais e tipografia

Cinco camadas, cada uma só pode consumir a anterior:

```
fonts.css → tokens.css → base.css → background.css → glass.css → components.css → shell.css → apps.css → responsive.css
```

## Tipografia

A interface usa a pilha de sistema institucional, sem download de fontes. Inter e Instrument Serif continuam locais, disponíveis para conteúdo e ferramentas.

| Papel | Fonte | Nota |
|---|---|---|
| Display + UI | Segoe UI / Trebuchet MS / Arial | `--font-display` = `--font-ui` = `--font-brand` |
| Acento editorial | Mesma pilha, itálico | `--font-accent`, menta no hero e nos princípios |
| Conteúdo serifado | Instrument Serif / Georgia | `--font-editorial`, não é a voz do shell |
| Código, números, rótulos técnicos | `ui-monospace` / Cascadia / Consolas | `--font-mono` |

Escala (`css/tokens.css`):

```
--display-xl  clamp(44,6.4vw,76)   peso 450   --track-display -.032em
--display-l   clamp(34,4.4vw,54)   peso 450
--display-m   32                   peso 400
--display-s   24
--body-size   16   --body-lead 1.65
--eyebrow     12   tracking .33em   maiúsculas
--micro       9.5  tracking .14em   maiúsculas
```

Regras que sustentam o "não é template":

- título grande é **leve e apertado**; bold em display está fora da identidade;
- tracking negativo em títulos (`-.032em`/`-.022em`), positivo e largo em rótulos;
- número de métrica é forte e a **unidade é leve**, separadas por hairline;
- o acento do shell é itálico de sistema; a serifa permanece disponível para conteúdo;
- texto em maiúsculas só existe com tracking ≥ .08em.

## Materiais (o cardápio fechado)

Não existe "um fundo qualquer". Escolhe-se um material:

| Classe | Material | Onde |
|---|---|---|
| `.glass` `.glass-2` `.glass-3` | vidro fosco diurno + rim refratado (`::before` com `--edge-grad`) | painéis de trabalho, modais, palettes |
| `.bench` | **porcelana**: fill claro, sem blur, sem rim, sem elevação | barras de ferramenta, rails, tiras de inspetor |
| `.mat` | **mesa de rascunho**: recessada, pontilhado 22px, sombra interna — e tinta própria ([tokens.md](tokens.md#a-mesa-é-um-terceiro-substrato)) | área do canvas; `.mat-sheet` é o papel em cima |
| `.ocean` `.ocean-2` `.ocean-3` | vidro de marca sobre o campo (tinta clara) | composições de Home/Library/Docs |
| `.plate` | chapa navy sólida (`--field-4→5`) | blocos que precisam de contraste real |
| `.orb` `.orb-sm` `.orb-lg` | aqua bubble (rim + dois inset shadows = esfera) | ícone de ferramenta |

Cinco materiais é o limite do sistema. Precisamos deles porque "não transforme cada
superfície em vidro": uma bancada inteira em `--glass-2` a 0.96 é cinza funcional, não
Aero — foi por isso que `.bench` (porcelana) e `.mat` (mesa recessada) existem, e por
que o rail da bancada deliberadamente **não** tem elevação: ele é parte da máquina,
não mais um card em cima da página.

**Anti-padrao: vidro dentro de vidro.** `.mm-stage` e `.se-canvas-wrap` foram
convertidos de `.glass` para `.mat` exatamente por isso — um painel de vidro montado
dentro de outro painel de vidro apaga a hierarquia e dobra o custo de blur.

## Botões

```
.btn                 estrutura base (gloss, estados, foco)
  .btn-primary       gloss split 49/51 — a assinatura
  .btn-field         botão que vive no campo oceânico, não na bancada
  .btn-aqua  .btn-danger
  .btn-ghost         quieto, não invisível
  .btn-sm  .btn-icon
```

`.btn-ghost` dentro de uma superfície de trabalho recebe uma chapa sutil
(`components.css:65`): uma fileira de ações que só aparece no hover faz a barra
parecer uma coleção de textos aleatórios. No campo aberto continua transparente, onde
o scrim ao redor já emquadra.

## Campos

```
.field  .field > label  .field.fixed  .field-row      agrupamento
.input  .check-row  .copy-row                          controles
```

O label do campo usa `--fg-3`: ele é sempre o terceiro nível de tinta do substrato,
nunca uma cor escolhida pela ferramenta.

### Campo composto: quem tem material é quem recebe o anel

Três controles do produto são um campo **dentro** de uma superfície que é o controle: a
chapa de busca da Library, a banda de busca da command palette e a folha do Notes. Os três
campos são sem borda e sem fundo de propósito — o `outline: none` neles está certo — e por
isso o anel não pode morar no campo: tem de morar na superfície, via `:focus-within`.

| Controle | Anel | Nota |
|---|---|---|
| `.search-bar` | `shell.css:349` — `outline: 2px solid var(--focus-ring)`, offset `+2px` | a chapa é um pill 999px; o anel por fora acompanha a forma |
| `.pal-search` | `components.css:248` — mesmo traço, offset `-2px` | por dentro, porque a banda encosta na borda do diálogo e um anel externo seria recortado pela chapa |
| `.nt-sheet` | `apps.css:1440` — halo `0 0 0 3px` | já existia; é o modelo que os outros dois deveriam ter seguido |

A regra é a razão de `_dev/probe-focus-loss.js` comparar o elemento focado com **o mesmo
elemento sem foco** e depois subir a cadeia: um campo pode estar certo e o produto inteiro
sem indicador, e nenhuma inspeção do CSS do campo responde isso. Ver
[quality.md](quality.md#onde-o-anel-mora).

## Bancada de edição (canvas editors)

Vocabulário compartilhado de Diagram Studio, Mind Map, SVG Editor, Notes, Page
Builder, Kanban, Document Workshop, Data Workspace, Component Builder, Animation
Studio e Image Studio (`components.css:258`). O rail agrupa controles
por intenção com separadores de 1px:

```html
<div class="pb-bar bench">
  <span class="bench-rail-group">…modelo / limpar…</span><span class="bench-sep"></span>
  <span class="bench-rail-group">…desfazer / refazer…</span><span class="bench-sep"></span>
  <span class="pb-seg bench-rail-group" role="group" aria-label="Largura da prévia">…</span>
  <span class="pb-bar-actions">…copiar · exportar…</span>
</div>

<div class="pb-work">
  <aside class="pb-palette bench">
    <h3 class="bench-sec-head">Blocos</h3>…
    <h3 class="bench-sec-head">Projetos</h3>…
  </aside>
  <section class="pb-canvas-wrap mat glass">
    <div class="pb-canvas mat-sheet">…página…</div>
    <div class="mat-empty" hidden>orb + título + corpo + CTA + atalho</div>
  </section>
  <aside class="pb-props">
    <section class="bench-sec glass"><h3 class="bench-sec-head">Heading</h3>…campos…</section>
    <section class="bench-sec glass bench-sec--quiet"><h3 class="bench-sec-head">Propriedades</h3><p>Nada selecionado.</p></section>
  </aside>
</div>
```

Cinco decisões de direção embutidas:
1. **agrupamento por intenção** com separador, em vez de uma fileira plana de 12 botões;
2. **o zoom é um controle de primeira classe** (−, % fixa com `tabular-nums`, +,
   Ajustar), não uma roda escondida;
3. **cada seção do inspetor tem nome** (`.bench-sec-head`); uma placa quieta
   (`.bench-sec--quiet`) substitui o formulário vazio, em vez de deixar um
   `min-height` ocioso.
4. **um único controle segmentado** (`.bench-seg`, `components.css:305`): Page
   Builder (largura de prévia), Document Workshop (modo do documento) e Data
   Workspace (Pretty/Minified) tinham cada um o seu — o do Data Workspace com um
   gradiente azul hardcoded (`#0F7BB4 → #05567F`) que nenhuma outra peça da
   interface usava. Dentro de um rail de porcelana um grupo com borda seria uma
   moldura dentro de outra moldura, então o controle não tem caixa: botões
   flat e apenas o pressionado recebe o fill do substrato.
5. **a linha de status e o rótulo do inspetor têm dialeto** (`.bench-hint`, com o
   slot `--hint-ink`, e `.bench-sec .field > label`): Animation Studio e Image
   Studio escreviam os dois por conta própria — nove cópias de linha de status e
   quatro de rótulo. A linha de status é a única tinta do rail que **não** é
   `--fg-2`: um feedback da mesma cor dos rótulos ao redor deixa de ler como
   feedback.

Duas consequências medidas depois, ambas resolvidas no sistema e não em cada
ferramenta:

- **a página vazia continua sendo uma página.** O `.mat-sheet` do Page Builder
  mantém altura quando não há blocos (`.pb-canvas:empty { min-height: 380px }`,
  `apps.css:943`) e o overlay `.mat-empty` pousa sobre o papel — sem o `min-height`
  a folha colapsava numa tira branca e o estado vazio ficava solto na mesa.
- **rail que quebra não tem separador.** Em ≤640px a barra de ferramentas vira
  várias linhas; um `.bench-sep` de 1px no fim de uma linha fica pendurado, então
  `responsive.css:190` o esconde nesse ponto de quebra para todas as bancadas.
- **uma tira de papel dentro do `.mat` precisa de `min-width: 0`.** O Kanban usa o
  mesmo `.mat-sheet` do Page Builder, mas como item de flex com
  `flex: 0 0 268px`: o tamanho mínimo automático do Flexbox ignorou o basis e cada
  coluna mediu 393px (`_dev/diag-kb-col2.js`), empurrando a terceira para fora da
  mesa. Com `min-width: 0` (`apps.css:1560`) as três colunas cabem nas 916px da mesa
  sem scroll horizontal.
- **cabeçalho de tira em duas linhas.** Com três controles em fluxo o título
  editável ficou com 95px — estreito demais para nomear uma coluna. A tentativa de
  resolvê-lo com um painel que só aparece em `:hover` foi pior: o `input` por baixo
  engolia o clique das ferramentas (o hit-testing do Playwright interceptou o
  `kb-col-del` 47 vezes), e um popover dentro da mesa seria cortado pelo
  `overflow-x: auto`. O `.kb-col-head` agora empilha o título (largura total) sobre
  uma linha quieta com a contagem à esquerda e as ações à direita
  (`apps.css:1561-1572`): sempre visíveis, sempre clicáveis, sem depender do
  ponteiro.
- **um prefixo por ferramenta.** O Document Workshop usava `dw-`, o mesmo do Data
  Workspace: `apps.css` carregava as regras do segundo sobre o palco e as linhas de
  projeto do primeiro (padding do palco 22px → 16px) sem que nenhuma das duas
  páginas mostrasse um erro. Renomear para `dwc-` fechou o vazamento
  (`_dev/shot-dw-rename.js` confere os dois palcos). É violação direta da regra de
  governança: um componente compartilhado não pode ser sobrescrito por uma
  ferramenta vizinha.
- **a folha é o papel, não o painel.** Com `.dwc-preview mat-sheet`, dar também um
  `background: #fff` ao `.dwc-doc` empilhava papel sobre papel e apagava a sombra
  da mesa. O sheet leva o branco e o scroll (`apps.css:1685-1686`); o documento fica
  transparente. Medido: `sheetBg rgb(255,255,255)`, `docBg rgba(0,0,0,0)`,
  `deskDoubleScroll 0` (`_dev/shot-dwc.js`) — o documento rola uma vez, dentro da
  folha.
- **ações de linha viram glifos.** `Up / Down / Delete` escritos repetiam três
  rótulos por seção descendo o rail e deixavam o campo de título apertado; agora é
  `↑ ↓ ×` com `title` + `aria-label`, o mesmo contrato das ferramentas de coluna do
  Kanban.

Regra de estado: **zoom, pan, seleção e largura de prévia não entram na pilha de
undo.** Undo de um nó não pode remudar a escala da mesa, e no Page Builder trocar
Desktop/Tablet/Celular apenas re-renderiza e persiste (`page-builder.js:489`) —
desfazer continua sendo desfazer uma edição.

### Estado vazio obrigatório

`Uma área de trabalho vazia não deve parecer uma tela inacabada.` Toda bancada de
canvas tem um `.mat-empty` com três partes:

- **título** (`display`, 20px) dizendo o que a mesa é;
- **corpo** (13px) dizendo o que fazer primeiro;
- **CTA + atalho** (`Novo nó · N`) — o atalho ensinado no lugar onde ele funciona.

O empty state se sobrepõe ao canvas (`position:absolute; inset:0`) e nunca a
renderização: ao adicionar o primeiro objeto ele é ocultado (`hidden`), e qualquer
caminho que mude `nodes.length` passa pelo mesmo `updateStats()`.

**O atalho mostrado tem de funcionar onde aparece.** O Document Workshop anuncia
`Ctrl + Z` ao lado do CTA "Abrir o exemplo", mas `applyDoc()` chamava
`hist.reset()`: clicar o CTA e desfazer não fazia nada (`_dev/diag-dwc-undo2.js`).
Trocar de documento (abrir um projeto salvo) continua zerando a pilha; Novo e
Exemplo são movimentos dentro do documento que está na tela e agora usam
`hist.record()` (`document-workshop.js:221`). Depois da correção: sample → undo →
1 seção / 99 chars → redo → 3 seções / 459 chars.

### Os dois empty states, e por que o de campo precisava de material

O produto tem dois componentes de estado vazio, e a distinção é de **substrato**, não
de tamanho:

| Componente | Onde vive | O que faz |
|---|---|---|
| `.mat-empty` | sobre o papel de uma bancada (Diagram, Document Workshop, Kanban) | overlay `position:absolute; inset:0` na área de trabalho |
| `.empty` | painel de resultado: grade da Library, painéis dentro de bancadas | bloco com borda, ícone, título, corpo e **saída** |

A saída é parte do componente, não um extra: sem affordance o painel é um beco sem
saída, e beco sem saída é o que lê como "tela inacabada". Na Library o botão desfaz
exatamente o filtro que produziu o vazio — favoritos volta para todas, busca limpa a
busca, categoria vazia volta para todas — nunca reseta as três coisas (`library.js`).

O `.empty` sobre o **campo aberto** tinha um defeito de material, não de gosto. A
receita antiga pintava ~20% sobre o fundo (`--gloss-ghost`: alfa .13/.18) sem
`backdrop-filter`, então a camada de atmosfera (`background.css:43`, `.nocturne
.stars`) atravessava o painel: uma bolha de 74 px ficava exatamente sobre a borda
esquerda do painel de favoritos e a linha de shimmer do horizonte cortava o painel ao
meio. O estado vazio passava a parecer artefato de renderização. A correção dá ao
painel a mesma receita de vidro de campo das demais superfícies (`--glass-on-field` +
`blur(var(--blur)) saturate(150%)`, `base.css:122`), o que também o faz obedecer a
Configurações → Transparência = Sólido de graça, porque `tokens.css:223-226` já troca
os dois tokens nesse modo.

Prova, não descrição (`_dev/shot-empty-material.js`, mesma página, mesmo estado,
animação da atmosfera congelada para as duas capturas):

| Caso | Pixels alterados | Pior diferença |
|---|---|---|
| Library sobre o campo (alvo) | **79,53%** | 180 |
| Image Compress dentro da bancada (controle) | **0,00%** | 0 |
| Color Studio dentro da bancada (controle) | **0,00%** | 0 |

Os dois controles são bit-idênticos porque `.glass .empty` / `.bench .empty` vence em
especificidade nos dois estados do CSS, e a regra nova ainda libera o
`backdrop-filter` dentro da bancada — a bancada já é a superfície; um segundo blur
seria custo sem ganho. Contraste medido dentro do painel novo: título 5,03:1, corpo
4,78:1, botão 4,55:1 (mínimo 4,5). O botão é o ponto mais apertado do conjunto e deve
ser re-medido se a paleta do campo mudar.

Um detalhe de método que a primeira versão deste script errou: o "antes" era montado
com `!important`, que sobrescrevia também o `.glass .empty` da bancada e produzia um
`antes` que nunca existiu no produto — a bancada aparecia azul. Sem `!important`, a
injeção reproduz a regra antiga respeitando a cascata real, e é isso que faz do
controle um controle.

### Bancada sem mesa: Data Workspace

Um inspetor de JSON não tem papel, então não recebe `.mat` — mas ainda assim tem
de usar as peças compartilhadas. O que mudou (`_dev/verify-dw.js` confirma o
comportamento, não só o visual):

- `.dw-bar` é `.bench`: a strip de porcelana agrupa Sample/Import · Collapse/
  Expand · Undo/Redo por intenção com `.bench-sep`, e INDENT + status passaram
  para um `.dw-bar-end` alinhado na mesma baseline, em vez do rótulo flutuando
  acima do select.
- os rótulos das placas são `.bench-sec-head`. Enquanto a tipografia ficava no
  contêiner (`.dw-pane-head` com `text-transform: uppercase`), cada controle
  dentro precisava se defender dela — `.dw-search`, `.dw-path`, `.dw-sort` e
  `.dw-seg` tinham `letter-spacing: 0; text-transform: none` repetidos quatro
  vezes. O rótulo agora é um único span; os resets sobraram e saíram.
- a tinta do bloco inteiro deixou de ser a paleta crua e passou no contrato de
  substrato (`--ice → --fg`, `--dim → --fg-3`, `--line → --hair`,
  `--cyan → --accent-ink`, `--ok/--warn → --ok-ink/--warn-ink`; 67 linhas em
  `_dev/ink-dw.js`). Os valores calculados são os mesmos numa superfície clara —
  a diferença é que a ferramenta passa a herdar a tinta certa se o substrato
  mudar. Hover de exclusão passou a `--err-ink`, como no Kanban.
- medido: 22 linhas de árvore, collapse 7→4→7, indent 4 espaços, minified 1
  linha / pretty 10, ordenação alfabética, undo/redo do rail, busca, chip de
  caminho no focus do valor (`$.alpha.beta[1]`), cinco tabs e o round-trip CSV —
  tudo sem erro de console e sem overflow em 375px.

### O Component Builder: o rail diz o que está na mesa

A bancada do Component Builder (`06-component-builder-*.png`) é a mesma
composição — rail `.bench`, inspetor em `.bench-sec glass`, code plate — com
uma decisão própria e uma corregida por medição:

- **a mesa é `.plate`, não `.mat`.** Os componentes gerados são publicados sobre
  o campo escuro da marca (o export independente escreve `body{background:#04070F}`),
  então prévia-los em papel de dia era uma mentira: amostrando o pixel composto
  do screenshot, o rótulo do botão `outline`/`ghost` (`--cyan` claro sobre a mesa
  clara) mede **1.4:1** — praticamente invisível — e o `card` parecia um chip que
  nunca apareceria no output. Na `.plate` os mesmos rótulos medem **10.57:1**
  (`_dev/shot-cb.js`, solid 13.67 nas duas mesas). A `.cb-scene` foi retirada da
  lista de estágios luminosos de `apps.css:1210`, que a vencia por ordem de
  carregamento e a pintava de dia mesmo com `.plate` no markup.
- **o seletor de tipo era um grupo de botões sem estado.** Sem `aria-pressed` a
  bancada não dizia qual componente estava na mesa; a única resposta de seleção
  era o hover sob o ponteiro. Agora o grupo é `.bench-seg` e `syncType()` mantém
  a pressão verdadeira inclusive no undo/redo e ao abrir um projeto salvo.
  Medido: antes `pressed: ",,,"`; depois `"true,false,false,false"`.
- o texto da ferramenta descrevia a mesa errada ("daylight Aero glass identity");
  passou a dizer o que a prévia realmente é — os componentes sobre o campo da
  marca, exatamente como serão publicados (EN/PT).

### As cinco peças que cada bancada tinha escrito para si

`components.css:326-349`. Três coisas que toda bancada precisa estavam
reescritas em `apps.css` ferramenta por ferramenta, com três valores diferentes
de preenchimento e uma colisão de prefixo:

| peça | antes | agora |
| --- | --- | --- |
| `.bench-row` (projeto salvo) | 14 cópias, 5 preenchimentos (`.55`, `.78`, `.88`, `--glass-2`, chip) | `--chip-bg` / `--chip-line` |
| `.bench-code` (placa de código) | 4 cópias, todas com `rgba(232,246,254,.8)` hardcoded | `--code-bg` / `--code-line` / `--code-ink` |
| `.bench-val` (leitura ao lado do controle) | 4 cópias, 40 / 46 / 52px | 52px, `tabular-nums` |
| `.bench-color` + `.bench-range` | 6 ferramentas + o par `is-` do Favicon Studio + `dg-color` 34×28 | 44×28 e `flex:1 1 auto` |
| `.bench-list` (coluna das linhas) | 12 cópias de `flex/column/gap 6px` | gap 6px; teto de altura fica com a ferramenta |
| `.bench-empty` (a linha "nada salvo") | 13 cópias: `--dim` vs `--fg-3`, três paddings, um itálico | 12px / `--fg-3` / `4px 2px`, sem itálico |

`.bench-list` fechou também uma dependência entre seções: o Diagram Studio usava
`.ds-proj-list`, uma regra definida **dentro do bloco do Design System Lab**. As
duas ferramentas compartilham o prefixo `ds-` sem sobrepor nenhum outro nome, então
não havia conflito — havia um empréstimo: apagar o bloco do Design System Lab
teria desmontado a lista de projetos do Diagram Studio sem erro visível.

Medido nos trilhos reais, com um projeto salvo em cada ferramenta
(`_dev/shot-rails.js`, as folhas `_dev/before-after/21-rail-*`):

| ferramenta | preenchimento da linha | raio | padding | linha vazia |
| --- | --- | --- | --- | --- |
| Diagram Studio | `.88 → .78` | `8px → 12px` | `6/8` | `13.12px itálico 6/0 → 12px normal 4/2` |
| Mind Map | `.88 → .78` | 12px | `8/10 → 6/8` | `6/2 → 4/2` |
| Kanban | `.78` | 12px | `7/8 → 6/8` | — |
| Document Workshop | `.78` | 12px | `7/8 → 6/8` | `0 → 4/2` |
| Favicon Studio | **`.55 → .78`** | 12px | `6/8` | `4/2` |
| Design System Lab | `.78` (já promovida) | 12px | `6/8` | `4/2` — controle: não mudou |

O Design System Lab é a linha de controle da tabela: ele já usava `.bench-row`,
e por isso seus números são idênticos nas duas árvores — a diferença das outras
cinco vem do código, não do medidor. O `.kb-cards-empty` (a linha "No cards"
**dentro** de uma coluna do quadro) ficou de fora de propósito: é um placeholder
de conteúdo na mesa, não uma linha de trilho, e tem outra tipografia.

A placa de código ganhou tokens próprios (`--code-*` nos dois blocos de
substrato de `glass.css`) porque é a única superfície do produto que precisa de
um fundo *e* de uma tinta que não mudam com o texto ao redor: sobre a bancada de
porcelana ela é papel azulado com tinta `--ice`, sobre o campo é a mesma chapa
escura com `#D2F7FF`.

**A colisão que a promoção fechou.** `.is-color`, `.is-range` e `.is-val`
estavam definidos **duas vezes** em `apps.css` — uma no bloco do Image Studio
(`min-width: 46px`) e outra no do Favicon Studio (`min-width: 40px`) — e as duas
ferramentas usavam os três nomes. Como o bloco do Favicon vem depois, ele
reestilava silenciosamente o inspetor do Image Studio. Medido com uma imagem
aberta na mesa (`_dev/shot-benchpieces.js`, as 7 leituras do painel Adjust):
antes `40,40,40,40,40,40,40`, depois `52,52,52,52,52,52,52` — o mesmo valor de
Animation Studio, Design System Lab e Favicon Studio. Nenhum dos dois paginava
um erro de console; só o número entregava.

Verificação: `_dev/verify-bench-pieces.js` percorre as 8 ferramentas promovidas,
guida cor/range/leitura/linha/placa e reporta `staleSelectors` (o replace
automático deixou 5 seletores pontados `'.is-range'` para trás — um seletor
vivo apontando para uma classe apagada é quebra funcional, não cosmética). Hoje
`staleSelectors: []` em todas, `probe-contrast2.js` 0 falhas em 39 vistas e
`regress-aero.js` 34/34 montadas sem erro.

### As duas bancadas que sobraram: Animation Studio e Image Studio

Depois das três promoções anteriores, estas eram as duas ferramentas que ainda
escreviam o vocabulário da bancada para si: **15 regras privadas** em `apps.css`
e um rail direito que era texto solto sobre o palco.

| peça | antes (privada) | agora (compartilhada) |
| --- | --- | --- |
| grupo de controles | `.as-group` / `.is-group` — `glass-1` + borda + raio 12px escritos à mão | `.bench-sec glass` |
| título de seção | `.as-group-head` / `.is-col-head` (`div`, 600) | `.bench-sec-head` (`h3`, 650) |
| linha de status | `.as-hint` / `.is-hint` (2 cópias de `--cyan-soft`) | `.bench-hint` + slot `--hint-ink` |
| rótulo do campo | `.as-ctrl > label` / `.is-ctrl > label` (4 cópias) | `.field` + `.bench-sec .field > label` |
| separador da barra | `.as-sep` / `.is-sep` | `.bench-sep` |
| rail direito | `as-col-head` + `as-proj-save` + lista + `as-css` sem superfície | duas `bench-sec glass` |
| palco da animação | gradiente luminoso re-declarado, 4 stops diferentes do compartilhado | entrou na lista `.as-scene, .mm-stage, .mm-svg, .ds-canvas-wrap, .sv-canvas` |

**Os dois buracos de estado.** O grupo de predefinições do Animation Studio e os
chips de rotação do Image Studio eram o mesmo defeito do Component Builder antes
da migração: o controle existia, mas a interface não dizia o que estava
selecionado. No Image Studio era pior — `syncControls()` procurava
`.is-chip[data-rot]` e o construtor **nunca setava `data-rot`**, então o estado
`is-on` estava morto há meses, sem erro de console. Medido:

| | antes | depois |
| --- | --- | --- |
| Animation Studio, presets | `aria-pressed` `null,null,null,null,null,null` | `false,true,false,false,false,false` |
| Image Studio, chips de rotação | `[data-rot]` encontrados: **0**, `aria-pressed` `",,,"` | **2**, `"false,true,false,false"` |
| rail direito (preenchimento / padding) | `rgba(0,0,0,0)` / `0px` | `rgba(255,255,255,.8)` / `14px` |
| primeiro stop do palco AS | `rgba(255,255,255,.88)` | `.86` (o valor compartilhado) |

**O que não mudou, e por isso a comparação vale.** As tintas ficaram idênticas
(`rgb(44,85,104)` nos rótulos, `rgb(58,96,116)` nos títulos, `rgb(8,85,124)` na
linha de status) porque os tokens de contrato resolvem para os mesmos valores
sobre a bancada de porcelana — a migração tirou a decisão de dentro da
ferramenta, não mudou a decisão. E a função foi batida nas duas árvores
(`_dev/verify-as-is.js`, um contexto de storage, dois carregamentos): salvar →
1 `.bench-row` com `rgba(255,255,255,.78)` → recarregar → 1 linha → abrir →
estado restaurado; undo/redo `895→639→895` caracteres de CSS no Animation Studio
e `600×800 → 800×600 → 600×800` no Image Studio. Os dois conjuntos de números
são iguais antes e depois.

**O que mudou de ritmo, honestamente:** altura de linha dos rótulos
18,15 → 14,85px, títulos 17 → 11px de caixa, separador da barra 34 → 24px de
altura e o gap dos presets 4 → 2px (o seg mentado do design system). São as
medidas das peças compartilhadas, não uma nova escolha — mas aparecem na folha
de contato, então é melhor conhecê-las do que descobri-las depois.

Os chips de rotação/virar do Image Studio ficaram com `.is-chip` e seu próprio
preenchimento: são dois toggles independentes, não um segmento de escolha única,
e `.bench-seg` mentiria sobre isso. O reflexo sob o alvo
(`.as-scene::after`) também continua sendo do Animation Studio.

Verificação: `probe-contrast2.js` 0 falhas, `verify-bench-pieces.js`
`staleSelectors: []` nas 8 ferramentas, `regress-aero.js` 34/34 montadas / 0
overflow mobile / sem erros de console, `offline-aero.js` com o cache
`vt-shell-v53-as-is-bench` (63/63 recursos do cache, 0 bytes de rede). Folhas:
`_dev/before-after/22-asis-animation-stage.png` e
`_dev/before-after/22-asis-image-stage.png`.

Um aviso de método, porque o primeiro par do Image Studio saiu **injusto**: o
probe clicava `.is-chip[data-rot="90"]`, um seletor que só passou a existir
depois da correção, então a metade "antes" mostrava a imagem sem rotação e a
metade "depois" mostrava rotacionada — diferença de conteúdo, não de design
system. Recapturado com `.is-chip` por índice, que as duas árvores respondem.
Se um medidor só funciona na árvore nova, ele não mede a árvore nova: mede o
medidor.

### A família `.step`: onze ferramentas que dividem o mesmo vocabulário

`font-preview, gradient-lab, image-compress, image-convert, image-resize, image-meta,
lorem-ipsum, password, qr-studio, svg-studio, uuid` montam o fluxo em três `.step`
(`01` escolha → `02` dados → `03` aparência/resultado). Onze ferramentas, uma classe,
nada de receita local — e por isso um defeito de aparência ali é um defeito do sistema,
não de uma ferramenta. O estado anterior era três chapas brancas idênticas, sem regra
entre o cabeçalho e o que se opera: lia como template de admin. O contrato agora
(`apps.css:10`):

```html
<section class="step glass">
  <div class="step-head"><span class="step-num">01</span><h2 class="step-title">Tipo de conteúdo</h2></div>
  …controles…
</section>
```

- `.step-head` traz o filete (`1px solid var(--hair-soft)`) que separa "o que é este
  passo" de "o que se faz aqui". Sem ele, título e controle eram a mesma massa.
- `.step-num` é disco (`--r-pill`, 26px, `--chip-bg`/`--chip-line`, mono 10.5px), não
  texto solto: o número é o estado da sequência, e um número sem forma é só tipografia.
- o raio é `--r-md` (16px), não `--r-lg` (22px). Um painel de bancada é um controle, não
  composição — a escada de forma diz que funcional fica crocante.
- os campos dentro de `.step`, `.bench` e `.bench-sec` sentam no **poço**
  (`--well-fill` + `--well-shadow`, `components.css:352`): fundo recuado e sombra interna,
  em vez da chapa branca sobre porcelana branca que é exatamente o tell proibido.

### Escolha única é controle com estado, não coleção de cartões

O seletor de tipo do QR Studio eram sete cartões brancos com filete — sete maneiras de
dizer "escolha um", nenhuma delas dizendo qual foi escolhido. Agora é o contrato de
seleção: `--chip-bg`/`--chip-line` no não-selecionado, `--sel-fill` + `--sel-ink` no
selecionado (`apps.css:33`). No substrato claro da bancada isso é `#0A5E88` com texto
branco, medido em **7,0:1** no pixel composto; a versão anterior (`--sel-tint` de 10% de
ciano sobre porcelana) era um estado que quase ninguém via.

### Lista não é pilha de cartões

A lista de notas do Notes Workspace tinha uma chapa branca com borda por linha, igual ao
problema do rail. Uma lista de itens é um bloco contíguo com filetes entre linhas
(`apps.css:1449`): `gap: 0` na `.nt-list`, `box-shadow: inset 0 -1px 0 var(--hair-soft)`
por linha, e só a linha escolhida recebe chapa. Com folga entre as linhas, cada linha
volta a ser um cartão — o `gap: 0` está na regra porque é a parte que quebra sozinha.

### Vazio não é erro

O QR Studio devolvia "Digite uma URL para codificar." em vermelho, dentro de um
`role="alert"`, **antes de o usuário digitar qualquer coisa** — e re-anunciava a cada
tecla. Campo em branco é o estado inicial da ferramenta, não uma falha de validação. O
palco agora tem uma composição própria (`apps.css:52`, `js/apps/qr-studio.js`):

```html
<div class="qr-pedestal">
  <canvas id="q-canvas" hidden></canvas>
  <div class="qr-empty" role="…só quando há erro real…">
    <div class="qr-empty-frame">…ícone…</div>
    <p class="qr-empty-note">Nada para codificar ainda — o código aparece aqui enquanto você digita.</p>
  </div>
</div>
```

A moldura tem o tamanho exato que o código vai ocupar (300px, `aspect-ratio: 1`), canto
esquadrado (um alvo escaneável não é um cartão arredondado) e uma linha neutra em
`--fg-3`. O pedestal é o poço (`--well-fill`), porque uma placa branca sobre vidro branco
desaparece. Formatos inválidos continuam como erro. As quatro chaves de mensagem que só
descreviam vazio (`qr.err.url`, `qr.err.text`, `qr.err.ssid`, `qr.err.name`) saíram dos
dois dicionários; entrou `qr.empty`. Prova em runtime: `_dev/verify-qr-states.js`, 15
asserções sobre vazio/inválido/válido, troca de tipo e modo sólido → `QR_STATES: OK`.

### O atalho `background:` apaga o chevron do select

`select.input` desenha a seta com `background-image` (`components.css:102`). Qualquer
regra de escopo mais específica (`.bench .input`, `.step .input`, `.bench-sec .input`) que
escreva o **atalho** `background:` zera esse gradiente, e o seletor vira uma caixa de
texto sem afordância. Medido no par antes/depois do rail do Favicon Studio: as setas
sumiram. Regra: em campo, use `background-color`; a reserva de 32px do chevron também é
do contrato, e um campo compacto que reescreva `padding:` precisa devolvê-la
(`.dw-indent select.input`, `apps.css:560`). Guarda permanente:
`_dev/verify-select-affordance.js` percorre os 42 selects das 34 bancadas e lê o estilo
computado; o autoteste negativo (reinjetar o atalho) mostra `background-image: none`,
então o instrumento pega a classe inteira do bug, não só o caso de hoje.

## Camadas flutuantes

Modal, confirm e command palette são a única parte do produto escrita duas vezes. Cada
overlay tinha seu próprio scrim, sua própria elevação, sua própria barra de cabeça e seu
próprio rodapé — e como "escrever duas vezes" nunca é escrever igual, os valores já tinham
divergido quando o probe olhou (`_dev/probe-overlay.js`):

| Papel | modal | palette | agora |
|---|---|---|---|
| scrim | `rgba(9,58,86,.34)` blur 10px sat 1.2 | `rgba(9,58,86,.32)` blur 12px sat 1.3 | `--scrim` + `--scrim-filter` |
| elevação | `0 40px 90px -30px` | `0 44px 96px -32px` | `--shadow-overlay` |
| barra de cabeça | gradiente branco→`#E8F7FE` .5 | gradiente branco→`#ECF9FF` .6 | `--surface-head` |
| barra de rodapé | `rgba(240,250,255,.6)` | `rgba(240,250,255,.6)` (mesmo literal, dois arquivos) | `--surface-foot` |

Um dos defeitos era de acessibilidade, não de gosto: o blur do scrim estava **literal** nos
dois overlays, então `data-glass="solid"` — a preferência que desliga transparência e
desfoque — deixava as 34 bancadas sólidas e mantinha o fundo da paleta borrado. A folha
`_dev/before-after/32-overlay-layers-pair.png` tem esse caso de propósito em tela inteira:
antes, a Biblioteca atrás da paleta é uma mancha; depois, está nítida. Medido:
`backdropFilter` do scrim passa de `blur(12px) saturate(1.3)` para `blur(0px) saturate(1.2)`
com a preferência ligada, e continua `blur(10px)` com ela desligada.

A linha-cursor da paleta era a **terceira** receita de seleção do produto
(`rgba(12,124,176,.34)` de aro + `rgba(31,160,216,.16)` de banho). Hoje usa o par
`--sel-line`/`--sel-tint` como qualquer controle discreto, e mantém o espelho por cima
(`linear-gradient(var(--spec), var(--sel-tint))`) porque o cursor de uma lista navegada por
teclado precisa parecer elevado, não apenas tingido — o que o contrato governa é o aro.

### A tecla (`kbd`)

O atom de teclado existia em três regras e nenhum delas cobria todos os usos:
`.search-bar .kbd` (pill 999px), `.pal-foot .kbd` (7px, `background: #fff`) e `.mat-kbd`
(6px, `rgba(255,255,255,.85)`, classe própria de quatro ferramentas). Consequência visível:
o "Esc" da command palette, que tem `class="kbd"` mas não estava dentro de `.pal-foot`,
**não recebia estilo nenhum** — aparecia como texto solto no canto da busca. Um componente
definido por dois seletores de contexto não é um componente, é um acidente.

Hoje há uma regra só (`.kbd` em `css/components.css`), com raio `--r-xs`, hairline `--hair`
e fundo `--gloss-ghost` — todos valores de contrato, por isso a mesma tecla funciona na
bancada, dentro de um diálogo e sobre o campo aberto. `.mat-kbd` virou `.kbd` nos quatro
chamados; o pill da barra de busca virou o componente. As duas regras de **espaçamento**
que sobraram (`.pal-foot .kbd` empurrando o rótulo, `+ .kbd` sobrepondo bordas) ficaram,
porque forma de chord não é material.

### A mensagem do confirm

`VT.ui.confirm` escrevia `<p class="mist" style="font-size:13.5px;line-height:1.6">` — o
único número mágico de tipografia do produto morando dentro do JavaScript compartilhado, de
onde sete ferramentas herdavam o mesmo tamanho. Agora é `<p class="modal-msg">`, com
`--body-size`/`--body-lead`/`--fg-2`. O diálogo ficou 5px mais alto e a frase passou de
13,5px para 16px: é a única mudança desta seção que um usuário vai notar sem procurar.

### Estados de trabalho: o que existe e o que não existe

A auditoria de interação pediu "loading states". Medido, o produto tem duas coisas e meia:

- `.spinner` (`css/base.css`) está **fora de uso** — nenhuma linha de `index.html` ou `js/`
  referencia a classe. Está correto de contrato (`--hair` + `--accent-ink`, e para de girar
  em `data-motion="reduced"`), mas é CSS morto enquanto não houver operação longa que o
  mostre. É pendência de produto, não de design system, e por isso não foi "consertado"
  inventando um uso.
- O único feedback real de trabalho em lote é o selo por arquivo do Image Converter
  (`.cv-status`, com `pending | busy | done | error` cobertos pelo CSS) e os placeholders
  `…` do Compressor. Ambos funcionam; nenhum deles é um componente compartilhado.
- A paleta de comandos, o boot das ferramentas e as capturas de worker não têm estado de
  carregamento desenhado — porque, medido no `_dev/offline-aero.js`, tudo isso resolve em
  cache local (`63/63 recursos do cache, 0 bytes de rede`), ou seja, não há espera real
  para mostrar.

O que coube consertar aqui foi disciplina: `.cv-status` pintava com cores absolutas
(`--cyan`, `--dim`, `--ok`, `--warn`) e raio `999px` escrito à mão. Passou para
`--accent-ink / --fg-3 / --ok-ink / --warn-ink / --hair / --r-pill`. Sobre `.glass` os dois
conjuntos resolvem para o mesmo pixel, e o caso `cv-status` de `_dev/shot-overlay.js` existe
para provar isso: **0,00%** do clipe mudou. Decisão registrada: o selo `error` continua com
a tinta de aviso (âmbar), como sempre esteve — trocá-la para a rosa seria uma mudança de
significado visual feita de passagem, e nada nesta missão pedia isso.

## Componentes de página (shell)

Hero, seções de marca, tiles de ferramenta, chips, breadcrumbs, cabeçalho de app,
seções de docs, cards de settings, faixas Open Source e o selo de privacidade estão
em `css/shell.css`. Eles usam `--on-field*` direto porque só existem sobre o campo —
a indireção existe para componentes que podem morar nos dois substratos, não para
decorar o que já é fixo.

## Padrões de layout

Uma moldura, quatro ritmos. Todos em `css/shell.css`, com `--max-w: 1280px`:

| Padrão | Estrutura | Linhas |
|---|---|---|
| Moldura de conteúdo | `#view` central em `--max-w`, `padding: 30px 24px 72px` | `shell.css:90` |
| Hero de marca | `.hero-content` limitado a **780px + sangria** com `padding: 44px 58px 44px 0`; na Home a moldura sangra até a borda da janela (`--bleed`) | `shell.css:147` |
| Faixa editorial | grade `1.1fr / .9fr`, imagem absoluta por trás, argumento em cima; `min-height: 280px` | `shell.css:220` |
| Mosaico de estúdios | `.world-grid` de 6 colunas com **spans desiguais**: card = 2, `.w-wide` = 4, `.w-half` = 3, `.is-feature` ocupa a linha toda e vira `1.16fr / .84fr` | `shell.css:177` |
| Grade responsiva | `.strip` `minmax(240px,1fr)` (atalhos), `.tool-grid` `minmax(300px,1fr)` (biblioteca) | `shell.css:251`, `328` |
| Palco da Library | `minmax(0,1fr) auto` — imagem atrás, cópia em cima, contagem no canto | `shell.css:261` |
| Docs | `250px / 1fr` (índice fixo + artigo) | `shell.css:401` |

Três regras que evitam o "template":

1. **alternar escala**: uma página de marca é hero → mosaico → faixa em banda larga →
   colunas pequenas → fechamento. Uma seção larga e sem moldura depois de uma grade de
   cards é o que faz a Home parecer "cards empilhados".
2. **largura de leitura em `ch`**, nunca em `%`: os blocks de texto usam 44–68ch
   (`.hero-sub` 52ch, `.band-sub` 46ch, `.section-sub` 68ch, `.ls-sub` 64ch).
3. **grade assimétrica por intenção**: `repeat(auto-fill, minmax(...))` é para
   catálogo; composição de marca usa fracionário fixo com um elemento dominante.

### O que quebra e o que rola

Em viewport estreito existem duas famílias de controle e elas têm destinos diferentes.

| Família | Comportamento | Onde |
|---|---|---|
| Grupo de botões soltos (`.dg-bar-actions`, `.mm-bar`, `.kb-bar`, `*-row`, `*-actions`) | **quebra** em duas linhas | guard-rail `responsive.css:238` |
| Controle segmentado com moldura própria (pílula de nós do Diagram Studio) | **rola** dentro da própria borda; nunca quebra | `responsive.css:247` |
| Trilha de abas, colunas de kanban, folha de 720px | já têm scrollport próprio; o corte é a solução, não o defeito | por bancada |

A pílula é o caso que obriga a distinguir as duas famílias: um `flex-wrap` dentro de um
raio `--r-pill` produziria duas linhas dentro de uma borda desenhada para uma, e o
controle não encolhe abaixo das próprias etiquetas — 378px de largura intrínseca medidos
contra 375px de viewport. A regra é de layout, vive no guard-rail de 980px e custa três
propriedades: `min-width: 0` (um item de flex não encolhe abaixo do conteúdo sem isso),
`max-width: 100%` e `overflow-x: auto`.

Duas consequências que só apareceram porque alguém mediu:

- **recorte come anel de foco.** `overflow` num container recorta os descendentes, e o
  `:focus-visible` do produto é `outline: 2px` com `outline-offset: 2px` — 4px para fora
  da caixa. Com o `padding: 3px` original, todo botão de nó perdia 1px do próprio anel.
  O padding da pílula estreita passou a `--sp-1` (6px); `_dev/probe-focus-ring.js` confere
  a folga medida (7px acima e abaixo).
- **o scroll-into-view não conhece a borda.** Sem isso, o último botão estaciona encostado
  no recorte e o anel perde 3px exatamente no item que o teclado alcança por último.
  `.dg-tool` leva `scroll-margin-inline: 4px` — a folga medida passou de 1px para 5px.

Nada aqui é desculpa para esconder conteúdo: os rótulos continuam no DOM, o grupo tem
`role="group"` com `aria-label`, e o item cortado é alcançado por rolagem ou tabulação.
O controle da folha `_dev/before-after/33-mobile-bar-pill-pair.png` é a mesma barra a
1440px, que tem de sair **inalterada** (0,00%): corrigir o estreito movendo o largo é
retoque, não correção.

### A moldura da Home (v54)

A Home era um painel arredondado com borda dentro da coluna: uma foto emoldurada,
isto é, um card. Agora ela é a moldura do produto. Seis decisões, todas medidas:

| Decisão | Mecanismo | Onde |
|---|---|---|
| **Sangria real, não `100vw`** | `hub.js` mede `documentElement.clientWidth − #view.width` e publica `--bleed = padding + metade do exterior`; `.hero`/`.hero-stats` usam `margin-inline: calc(-1 * --bleed)` | `js/shell/hub.js:124`, `shell.css:129` |
| **Cópia travada na linha da grade** | o texto volta para dentro por exatamente `--bleed` (`margin-left: calc(--bleed + --hero-in)`), então o título cai no mesmo x dos `.world-card` (104px) | `shell.css:147` |
| **Altura é a janela, não um número** | `min-height: clamp(520px, calc(100svh - 200px), 820px)` com fallback `vh`; o hero ocupa a primeira dobra menos o cabeçalho e um respiro | `shell.css:131` |
| **Ritmo desigual** | `.hub-section` 72px, `.hero-stats + .hub-section` 104px, `.band` 120px — um gap constante é o que faz página de marca parecer dashboard | `shell.css:193`, `245` |
| **Chrome que pertence à cena** | `body[data-view="hub"]:not([data-scrolled]) #topbar` vira um degradê que some no hero (sem blur, sem borda, sem sombra); `app.js` publica `[data-scrolled]` com rAF passivo e a volta ao vidro é no primeiro pixel de rolagem | `shell.css:37`, `js/app.js:93` |
| **Véu na unidade da legenda** | `.world-veil` sobe do fundo em **px** (0/88/140/196/268), não em % da altura do cartão: a legenda é um bloco de altura fixa (135–180px), então uma rampa percentual dava sombra diferente a cada tamanho de cartão | `shell.css:229` |

A sexta linha não é cosmética: com a rampa em % o índice `01` caía sobre arte quase
limpa (pior píxel 1,3:1) e, em 390px, um segundo bloco `@media (max-width:1024px)`
reafirmava a grade de 2 colunas **depois** da regra de coluna única, de modo que os
cartões tinham 169×174px com legendas de até 180px — texto fora do próprio cartão.
Medição e números completos em [imagery.md](imagery.md).

Por que `--bleed` em JS e não `100vw`: `100vw` inclui a barra de rolagem, então o
sangramento cria estouro horizontal em toda página com scroll. O que se mede é o
`clientWidth` vivo. O listener é devolvido pela view (`router.js` usa o retorno como
cleanup) — sem isso a Home vazaria um listener por navegação.

**O que isso custou em mobile, e é regra permanente.** Abaixo de 480px o `object-position`
estreito cai sobre a parte mais clara da chapa (céu + cachoeira) e a regra antiga de
responsividade trocava `.hero-veil` por um véu **branco** — com `.hero-title`/`.hero-sub`
em `--on-field`, quase brancos. Texto branco sobre branco, e nenhum teste pegou: pegou
o screenshot de 390px. O véu mobile é agora o mesmo material navy do desktop, e o piso
medido por pixel (`_dev/probe-photo-contrast.js`, WCAG sobre o recorte real do texto)
ficou **3.16–10.11** a 390px e **5.18–12.57** a 1440px — o 3.16 é um nome de card em
26px, cuja exigência AA é 3:1 por tamanho.

Regra derivada: **quem escreve um véu sobre foto escreve tinta, não decoração.** Se o
copy continua `--on-field`, o véu tem que ser escuro em todo breakpoint que re-cropar a
imagem. Trocar o crop sem trocar o véu é o bug, não o resultado.

A folha de contato que prova o conjunto é `_dev/before-after/24-home-composition-pair.png`
(`_dev/sheet-home-pair.js`). As duas colunas vêm do **mesmo script** de captura, com
viewport, offset de rolagem e espera idênticos; a coluna "antes" é uma árvore isolada
(`_dev/before-tree-v54art`) sobre a qual a key art nova foi **sobreposta**, para que a
diferença visível seja só composição — sem isso a folha mostraria #69 e #70 juntos e a
comparação não isolaria nada.

Ferramentas montam em `#app-body` (`js/shell/appframe.js:37`); a coluna de trabalho
de uma bancada é `.dg-work`-like (mesa flexível + lateral de largura fixa) e o
inspetor nunca espreme o canvas.

## Governança

- ferramenta não define paleta, botão, sombra, raio ou espaçamento próprios;
- layout específico pode viver em `apps.css`; material e tinta não;
- precisa de um componente novo? Ele nasce em `components.css`, com estado de foco,
  `prefers-reduced-motion` e as duas tintas de substrato resolvidas, e **não** dentro
  de uma ferramenta.
