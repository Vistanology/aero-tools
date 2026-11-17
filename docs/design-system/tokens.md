# Tokens

Fonte única: `css/tokens.css`. Nada de valor mágico em componente — se um número
precisa existir, ele é um token ou já existe um que serve.

## Famílias

| Família | Tokens | Uso |
|---|---|---|
| Campo oceânico | `--field-1…5` | fundo das vistas de marca; `--field-4/5` são a chapa sólida navy (`.plate`, `.principle`) |
| Tinta do campo | `--on-field…-4` | 4 tiers, todos ≥ luminância 0.79 (ver AA abaixo) |
| Tinta de bancada | `--ice --mist --dim --void --night --abyss --cyan --crystal` | texto escuro sobre vidro claro |
| Estado | `--ok --warn --err` + `--*-on-field` | semântico, em duas leituras (claro/escuro) |
| Seleção | `--sel-line --sel-tint` + `--sel-fill --sel-ink` | "este foi o escolhido", em duas leituras: tintura para chapas contínuas, preenchimento + tinta para controles discretos |
| Poço | `--well-fill --well-shadow` | o recesso onde um controle senta (campo sobre porcelana, pedestal do QR) |
| Foco | `--focus-ring` | o anel de teclado: era um literal escrito em dois arquivos e não tinha nome para o terceiro controle que precisava dele (a chapa de busca) — ver [quality.md](quality.md#onde-o-anel-mora) |
| Atmosfera | `--aero-sky-* --aero-foam --aero-sun --aero-water --aero-garden --stage` | composições claras, key art, ilustração |
| Vidro | `--glass-1/2/3`, `--glass-on-field[-2/3]`, `--line`, `--line-strong` | elevações |
| Espéculo/gloss | `--spec --spec-soft --edge-grad --gloss-primary --gloss-ghost --gloss-plate --bubble-*` | materiais Aero |
| Tipografia | `--font-* --display-* --weight-display --track-* --eyebrow-* --micro-* --body-*` | escala |
| Ritmo | `--sp-1…8` (6→100px) | espaçamento; `--sp-8` = respiração entre seções de marca |
| Forma | `--r-xs…2xl --r-pill --r-field` | funcional fica crocante (8–16), só composição amolece (22–40); `--r-field` (14px) é o raio da caixa onde se digita |
| Sombra | `--shadow-1/2 --shadow-aqua --shadow-field --shadow-overlay` | profundidade |
| Camada flutuante | `--scrim --scrim-filter --surface-head --surface-foot` | modal, confirm e command palette: o scrim, o desfoque do scrim e as duas barras de um diálogo |
| Movimento | `--ease --ease-aero --t-fast/med/slow` | 160/240/320ms |

## Peso e família do display

`--weight-display: 450` acompanha os títulos medidos no site institucional. A interface usa `--font-brand` (Segoe UI, Trebuchet MS, Arial), não Inter. O navegador escolhe a face disponível mais próxima: a limitação 400–700 do Inter local não se aplica mais ao shell.

O acento do hero declara peso 350, itálico e `--brand-mint`. As medições históricas de `_dev/shot-hero-weight.js` precedem essa troca de família e não comprovam a aparência atual.

Os tokens `--bar-*` e `--nav-*` centralizam material, altura, margens, sombras e seleção da cápsula. `--topbar-h` deriva da altura mais as margens verticais. Os breakpoints em `responsive.css` reduzem margens em 1180px, ativam o menu em 1024px e compactam a marca em 480px.

Camada menor (22–30px: `.world-name`, `.tt-name`, `.section-head h2`, `.set-card h2`,
`.hs-v`) fica em 400 declarado — renderiza como declarado, e peso de display em corpo
de card engrossa a grade.

## Contrato de substrato

A regra mais importante do sistema, e a mais fácil de violar sem perceber.

Componentes **nunca** usam uma cor de tinta absoluta. Eles usam aliases:

```
--fg  --fg-2  --fg-3  --fg-4        texto (título, corpo, rótulo, meta)
--hair  --hair-soft                 filetes
--ok-ink --err-ink --warn-ink --accent-ink
--badge-fg/-line/-bg  (+ -ok/-err/-warn/-aqua)
--hover-fill --hover-line --hover-spec
--chip-bg --chip-line
```

Os defaults em `:root` são a **tinta clara do campo**. `css/glass.css:48` troca tudo
para tinta escura dentro de `.glass / .glass-2 / .glass-3 / .bench` e
`css/glass.css:60` devolve a tinta clara dentro de `.ocean / .ocean-2 / .ocean-3`.

```css
/* A ferramenta declara o material; o material declara a tinta. */
<div class="glass">   … --fg vira #08293A, --hair vira rgba(12,110,150,.16)
<div class="ocean">   … --fg volta a #F5FCFF, --hair vira rgba(180,244,255,.31)
```

Consequência prática: colocar um texto em cima de uma foto escura não é escolha de
cor, é escolha de material. Se o contraste falha, a superfície é que está errada.

## Seleção: `--sel-line` + `--sel-tint`, um par por substrato

"Este aqui é o que o usuário escolheu" é um estado, e estado tem que vir do contrato —
senão cada ferramenta inventa o seu. Antes de existir o par, havia três receitas
diferentes no produto: `rgba(31,160,216,.5)` escrito à mão em quatro lugares, `.45` em
Favicon Studio, e `--glass-2` (uma superfície, não um estado) usado como preenchimento de
seleção em Notes e no SVG Editor.

| Substrato | `--sel-line` | `--sel-tint` |
|---|---|---|
| bancada (`--r` em `.glass*`/`.bench`) | `rgba(31,160,216,.5)` | `rgba(31,160,216,.10)` |
| campo (`--r` em `.ocean*`) | `rgba(210,247,255,.42)` | `rgba(2,44,72,.42)` |

No campo, a tinta da bancada não serve: `rgba(31,160,216,.10)` sobre navy não é visível,
então a seleção no campo usa a linha aqua clara dos badges sobre a chapa funda dos chips.

O efeito visível da troca foi em Notes Workspace: a nota selecionada era um cartão branco
(`--glass-2`, `rgba(255,255,255,.88)`) e agora é a mesma chapa ciano da camada selecionada
do SVG Editor. No par antes/depois o clipe contém o horário criado em cada nota, então o
29,4% medido (`_dev/shot-selected-contract.js`, folha
`_dev/shots-sel/selected-contract-pair.png`) é a mudança de chapa **mais** a diferença de
relógio entre as duas passadas — a comparação honesta é a legenda da folha, não o número.
Nos outros três casos o token valia exatamente o que já estava pintado: 0,00–0,72% de
diferença, ou seja, a troca foi contratual, não estética. Dizer isso é o ponto: a maior
parte da governança não deixa o produto mais bonito, deixa a próxima ferramenta incapaz de
divergir sem que o probe pegue.

## Seleção discreta: `--sel-fill` + `--sel-ink`

`--sel-tint` é uma tintura: serve para dar estado a uma **chapa contínua** (a linha
selecionada do Notes, a camada do SVG Editor). Não serve para um **controle discreto** —
tile de tipo de conteúdo, segmento de tamanho de export, aba do rail. Nesses, "escolhido"
precisa ser uma superfície com tinta em cima, e tinta em cima exige par declarado:

| Substrato | `--sel-fill` | `--sel-ink` |
|---|---|---|
| bancada (`--r` em `.glass*`/`.bench`) | `--cyan` = `#0A5E88` | `#FFFFFF` |
| campo (`--r` em `.ocean*`) | `#41B4E8` | `#001E31` |

O par da bancada foi medido no pixel composto do screenshot: **7,0:1** de texto branco
sobre a chapa. A versão anterior — `--sel-tint` (10% de ciano) sobre porcelana — é o
estado que quase ninguém vê, e foi isso que fez o seletor de tipo do QR Studio parecer
sete cartões iguais. Ver
[components.md](components.md#escolha-única-é-controle-com-estado-não-coleção-de-cartões).

## O poço: `--well-fill` + `--well-shadow`

Placa é onde algo **senta**; poço é onde algo **está dentro**. Até aqui o produto só tinha
a primeira palavra, e o campo de texto sobre a bancada era uma chapa branca sobre porcelana
branca — literalmente o "painel branco com borda azul" que a diretiva proíbe. O par
(`tokens.css:110`) é um só porque uma bandeja de escolha e um campo digitável são o mesmo
gesto, e duas cópias escritas à mão já tinham começado a discordar:

```css
/* tokens.css — bancada: filme ciano de 5,5% + sombra funda e curta */
--well-fill: rgba(12, 110, 150, .055);  --well-shadow: rgba(11, 72, 102, .12);
/* glass.css .ocean/* — campo: sobre navy, filme de 5,5% é invisível;
   o recesso no campo é a chapa funda dos chips */
--well-fill: rgba(2, 44, 72, .42);      --well-shadow: rgba(0, 16, 32, .38);
```

Consumidores: `.bench .input, .step .input, .bench-sec .input` (`components.css:352`) e
`.qr-pedestal` (`apps.css:43`). Os três escopos são as superfícies de porcelana do produto
— rail, fluxo em passos e seção de rail — e por isso ficam em uma única regra.

Duas armadilhas derivadas, ambas medidas nesta etapa:

1. escrever o **atalho** `background:` ali apaga o `background-image` do
   `select.input` (o chevron) por especificidade; o contrato usa `background-color`.
2. `--well-fill` é tinta de **superfície**, não de texto: ele nunca entra em par de
   contraste, e o contraste continua sendo medido com o poço já composto por baixo
   (`probe-contrast2.js`: 0 falhas com o poço ativo).

## Por que o alias é re-declarado dentro do seletor

A resolução de `var()` acontece **no elemento que declara**, não no que consome. Por
isso as duas listas de tinta em `glass.css` repetem os mesmos nomes dentro de
`.glass/.bench` e `.ocean/*` — e é isso que faz um único componente funcionar nos dois
substratos. O caso mais visível hoje é o chip:

```css
/* tokens.css  — default (campo): chapa escura, filete claro */
--chip-bg: rgba(2, 44, 72, .42);   --chip-line: var(--field-line-soft);
/* glass.css .glass/.bench — bancada: chapa clara, filete escuro */
--chip-bg: rgba(255, 255, 255, .78); --chip-line: var(--line);
/* glass.css .ocean/* — de volta ao campo: chapa escura outra vez */
--chip-bg: rgba(2, 44, 72, .42);     --chip-line: var(--field-line-soft);

/* shell.css — o componente só conhece os aliases */
.chip { color: var(--fg-2); border: 1px solid var(--chip-line); background: var(--chip-bg); }
```

Regra derivada: quem precisa de um substrato dentro de outro (uma chapa navy dentro
de uma bancada clara) **declara os aliases naquele elemento**, senão o componente
filho herda a tinta do avesso. Foi assim que um badge ficou texto escuro sobre chapa
navy: `--field-*` e `--fg-2` no mesmo elemento não fazem o alias recalcular.

### A mesa é um terceiro substrato

`.mat` é **mais escura que o `.glass` em que ela fica** (rebaixo + sombra interna),
então a tier-3 da bancada não segura AA em cima dela. Medido: `--dim` dá 4.49 sobre o
pixel composto da mesa; `--mist` dá 5.34. Por isso `components.css` re-declara

```css
.mat { --fg-3: var(--mist); --fg-4: var(--mist); }
```

e não porque a mesa "precisa de texto mais forte": porque o contrato é com o
**fundo composto**, não com o nome do token. Declaração em `components.css` (depois
de `glass.css`) vence por ordem de carga quando `.mat` vem junto com `.glass`.


Nas páginas de marca (`shell.css`) o texto usa `--on-field*` direto — aquilo só
existe sobre o campo, e dizer isso no código é mais honesto do que fingir
indireção.


## O terceiro substrato: papel

Dois substratos são documentados (campo e bancada). Existe um terceiro, e ele não é
decoração: o preview do Document Workshop é **a folha**, não a interface. Uma página
que o usuário vai imprimir precisa parecer papel — neutra, sem tinta oceânica — e por
isso ela tem paleta própria, nomeada em `tokens.css` como `--paper-*` (fundo, quatro
tiers de tinta, duas réguas, dois preenchimentos, link, código).

A regra de adjudicação é: **uma cor só pode ser hardcoded se o substrato dela não
existir no sistema.** Antes disso, o `.dwc-preview` carregava 14 hexes avulsos
(`#555`, `#999`, `#eee`, `#0b5cad`…) e o Diagram Studio pintava sua etiqueta de aresta
com `#35637A`, um cinza-azulado que não estava em lugar nenhum. A etiqueta virou
`var(--dim)` (mesma família, ΔE desprezível). As 14 cores de papel viraram tokens com
**os mesmos valores**, e `_dev/verify-paper-tokens.js` prova isso em browser real:
carrega o documento de exemplo e afirma que cada elemento resolve para o `rgb()` exato
que o hex tinha — 14/14 idênticos, zero erros de console. Renomear token sem essa
sonda é trocar segurança por asseveração.

Uma exceção legítima, e ela é medida no mesmo lugar: o HTML exportado e a janela de
impressão embutem a própria folha de estilo com hexes literais
(`js/apps/document-workshop.js:169`), porque o artefato sai do app e não carrega
`tokens.css`. Ali o literal não é deriva — é a única forma de o documento impresso
existir sozinho.

## AA: por que os tiers são tão próximos

Na base da marca `#026DA7` (luminância relativa ≈ 0.138), o piso de 4.5:1 exige
luminância do texto ≥ **0.794** ((L+0.05)/(0.138+0.05) ≥ 4.5). Ou seja, no campo não
existe "texto apagado" — todo tier tem que ser quase branco. Hierarquia no campo é
feita com **tamanho, peso e tracking**, não com opacidade.

Ratios nos comentários de `tokens.css` são medidos **sobre `--field-2` nu**; o campo
real tem bloom, que clareia o fundo e derruba a razão. Por isso `--on-field-3` subiu
de `#B4E4FA` para `#DCF3FF`: o probe mede pixel composto, não o token isolado.

Na bancada, o problema é inverso: vidro claro sobre campo escuro compõe perto de
`#C7DFF1`, não de `#FFFFFF`, e as tintas antigas mediam 3.3:1 ali. Os valores de
`--mist/--dim/--cyan` foram graduados contra a **bancada composta**.

### Quando subir o branco não salva: o seletor de idioma

O `_dev/probe-contrast2.js` marcou um único elemento no produto inteiro: o rótulo inativo
do seletor EN|PT na Home — `--on-field-3` sobre o pixel composto do hero, **3,88:1**
(a arte clara atrás da topbar compõe perto de `#577C98`). A correção intuitiva é escalar a
tinta, e ela não existe: sobre `#577C98`, **branco puro dá 4,43** — ainda abaixo de 4.5.
Nenhum texto claro passa AA nesse fundo. O que estava errado era a superfície: a trilha do
toggle usava `--gloss-ghost`, um wash translúcido que deixa o hero aparecer. Trocando pela
chapa do contrato (`--chip-bg` = `rgba(2,44,72,.42)` sobre o campo), a mesma tinta `#DCF3FF`
de 10,5px sobe para ~6.3:1 (composto calculado dos próprios tokens) sem tocar em escala,
peso ou cor. `.net-badge` tinha a mesma trilha e recebeu a mesma troca. Par visual: caso
`topbar-lang` de `_dev/shot-overlay.js`, e o contador do probe, que voltou a marcar **0
falhas**.

É o exemplo mais limpo da regra do contrato de substrato: **se o contraste falha, a
superfície é que está errada** — e aqui isso não é uma formulação elegante, é aritmética.

## Preferências que reescrevem tokens

| Seletor | O que muda |
|---|---|
| `body[data-glass="solid"]` | vidros sobem para 0.94–0.99 de opacidade, `--blur: 0px`, `--scrim-filter: blur(0px)` |
| `body[data-motion="reduced"]` + `@media (prefers-reduced-motion)` | toda animação/transição desligada |

São as duas saídas de acessibilidade do produto e funcionam em todas as 34
ferramentas porque nenhuma delas fixa sua própria opacidade.

Isso já não era verdade uma vez: os dois overlays escreviam `blur(10px)`/`blur(12px)`
no próprio CSS, então o modo sólido desligava o desfoque em todo o produto e o deixava
ligado atrás da command palette. É o argumento mais forte que existe para a regra de
governança — não é purismo de arquivo único, é que uma preferência declarada num lugar
só consegue valer em todos os lugares quando nenhum componente escolhe seu próprio valor.
A medição está em `_dev/probe-overlay.js` e o par visual no caso `palette-solid` de
`_dev/shot-overlay.js`.

## Tokens por vista

`document.body.dataset.view` ∈ `hub | library | docs | open | settings | app`.
`css/background.css:99` usa isso para baixar o campo a `opacity: .58` nas vistas de
trabalho — a atmosfera continua presente, mas quem carrega a composição é a bancada.
Isso é direcionamento de arte centralizado: uma linha, todas as ferramentas.
