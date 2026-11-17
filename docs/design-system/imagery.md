# Imagem e direção de arte

`Uma única direção de arte coesa. Nunca a mesma imagem repetida em vários cartões.`

## O papel da imagem

A imagem não decora a interface: ela é o que separa "um hub de ferramentas" de "um
produto da Vistanology". Cada peça tem uma função compositiva declarada:

| Peça | Função |
|---|---|
| `hero-aero` | fundo do hero da Home; carrega a marca no primeiro dobra |
| `band-horizon` | faixa editorial entre seções — muda a escala da página e quebra a grade |
| `cat-*` (6) | uma placa por estúdio: a biblioteca é uma coleção de estúdios, não uma grade de cards |
| `stage-all` | establishing shot do catálogo inteiro: o palco da Library quando nenhuma categoria está selecionada (e também na view de favoritos, que é "o acervo todo" de novo) |
| `empty-bloom` | estado vazio de busca |

Regra de não-repetição: as seis placas `cat-*` são **seis assuntos diferentes**, cada
um sugerindo o trabalho daquela categoria. Reaproveitar uma placa em outro card está
proibido — foi uma das falhas da versão anterior (`docs/design-system/` existe também
para que isso não volte por esquecimento). O comentário em
`_dev/webp-convert.js:14` ("One plate per studio, each its own subject") é a
declaração executable dessa regra.

Na Library, a imagem do palco **troca com a categoria** (`library.js:12` `stageImg`),
então o catálogo tem atmosfera por categoria em vez de uma página plana com um filtro.

## Uma direção, não seis estilos

Todas as peças vêm do mesmo prompt-mestre: luz diurna úmida, água e céu, vidro e
acrílico, volume suave, alta luminância com profundidade real, paleta da marca
(`#026DA7`–`#41B4E8`–`#9EEAFF`) com verde de jardim e âmbar de sol como acentos, sem
figura humana, sem texto, sem logotipo. Uma peça que não pareça irmã das outras é
refeita, não aceita.

### A regra da hora única (v54)

"Mesma paleta" não bastou: o conjunto de v53 media 10 peças individualmente fortes e
ainda assim não era um mundo — as seis placas de categoria atravessavam quatro horas
do dia e duas temperaturas de cor (noite, pôr do sol fechado, interior âmbar, manhã).
Uma página que mostra pôr do sol num card e observatório noturno no outro lê como
banco de imagens, não como produto. A partir de v54 a direção tem uma cláusula
verificável, e ela vem antes do assunto:

- **uma hora**: amanhecer, sol baixo acabando de crestear o horizonte;
- **uma origem de luz**: o sol entra pelo **canto superior esquerdo** em todas as peças;
- **um horizonte**: água espelhada ocupando os **40–45 % inferiores** do quadro, com
  reflexo legível;
- **uma família fria**: navy → cobalto → ciano domina o quadro; âmbar **só** como sol
  direto e filete de borda, nunca como temperatura do interior inteiro;
- **uma assinatura de mundo**: arquitetura de vidro integrada à vegetação, cachoeira,
  e — nas peças abertas — a cidade de vidro no horizonte direito.

O teste de aceitação é a folha de contato, não o arquivo: `_dev/sheet-assets.js`
renderiza as dez peças no mesmo recorte 324×182 `cover`. Se uma peça precisar ser
olhada sozinha para fazer sentido, ela não pertence ao conjunto.

### Assuntos proibidos

Os clichês que entregam "template de Frutiger Aero" em vez de produto:

- robôs, androides, IA personificada;
- circuitos, placas-mãe, engrenagens de "tecnologia";
- escritório corporativo, aperto de mão, pessoas de estoque;
- servidores, datacenter, nuvem literal;
- neon roxo, cyberpunk, ficção militar / sci-fi de filme;
- ilustração infantil, cartoon, "fofinho" excessivamente arredondado.

## Formato, peso e offline

WebP sempre (Chrome/Edge/Firefox/Safari atuais). Pipeline: `_dev/webp-convert.js`
(PNG gerado → WebP via Chromium headless, largura e qualidade por peça).

Inventário medido (não estimado) — `_dev/measure-assets.js`, v54:

| Arquivo | Dimensão | Peso (v54) | Peso (v53) |
|---|---|---|---|
| `hero-aero.webp` | 1600×914 | 215.1 KB | 215.1 KB |
| `band-horizon.webp` | 1200×686 | 93.9 KB | 92.9 KB |
| `cat-media.webp` | 800×533 | 77.3 KB | 77.3 KB |
| `cat-developer.webp` | 800×533 | **77.0 KB** | 41.7 KB |
| `cat-creative.webp` | 800×533 | 69.4 KB | 69.4 KB |
| `cat-generators.webp` | 800×533 | 67.4 KB | 67.4 KB |
| `cat-productivity.webp` | 800×533 | **55.2 KB** | 68.6 KB |
| `cat-documents.webp` | 800×533 | **54.6 KB** | 51.2 KB |
| `stage-aqua.webp` | 1400×800 | 18.4 KB | 18.4 KB |
| `empty-bloom.webp` | 640×480 | 10.5 KB | 10.5 KB |
| **total** | — | **738.8 KB** | 712.4 KB |

O budget inteiro de arte de marca cabe em ~739 KB, local, uma vez. As seis linhas sem
alteração são o controle: foram reconvertidas do mesmo PNG de origem e voltaram com o
mesmo byte count, o que prova que o pipeline não mexeu no que não devia.

Fechamento 0.25.0, sem reescrever a medição acima: `empty-bloom.webp` (10,5 KB) saiu do
pacote, e `stage-aqua.webp` (18,4 KB) já não era servido. Restam **709,9 KB de arte
alcançável pelo app** — nove arquivos, todos na precache. A planilha continua sendo o
registro do que foi medido em v54, inclusive dos arquivos que já não existem.

### As quatro peças refeitas em v54

A folha `_dev/before-after/23-keyart-pair.png` mostra antes e depois no mesmo recorte.
Cada uma violava a hora única, e cada uma foi refeita com assunto próprio — nenhuma
placa foi duplicada para "harmonizar" o conjunto:

| Peça | O que estava errado | Assunto novo |
|---|---|---|
| `cat-developer` | observatório **noturno**, céu estrelado, luz fria vinda da própria arquitetura | colunata de vidro ao amanhecer com armilhas e grades cristalinas suspensas — instrumento de precisão, não circuito |
| `cat-productivity` | **pôr do sol** fechado, terraço residencial, âmbar dominando o quadro | plataformas de vidro escalonadas sobre lagoa espelhada, painéis finos em colunas ordenadas, cachoeiras entre níveis |
| `cat-documents` | interior de biblioteca **âmbar**, hora dourada por inteiro | pavilhão-arquivo de vidro ao amanhecer: a luz fria é a base, o âmbar existe só no único feixe que entra pela estrutura |
| `band-horizon` | atóis em **fim de tarde**, sem cidade nem planeta | faixa larga de amanhecer com ilhas de vidro flutuantes, cachoeiras, cidade à direita e o arco do planeta no alto-esquerda |

`cat-documents` teve duas gerações: a primeira voltou âmbar por dentro (o erro que
estava sendo corrigido). A peça aceita é a segunda, de dominante fria. A rejeitada está
em `vibe_images/rejected-warm-cat-documents_*.png`, fora do padrão de nome do pipeline,
para que `webp-convert.js` nunca a selecione.

### `pavilion.webp` saiu da árvore

`assets/hero/pavilion.webp` (1600×914, 147.7 KB, **noite/twilight**) não era carregado
por nenhum código: o hero da Home usa `hero-aero.webp` (`hub.js:35`) e a precache
(`sw.js:33-36`) nunca listou o caminho. Ele continuava listado em `README.md` e em
`docs/checklist-f1.md` / `checklist-f2.md` como "hub hero", ou seja, a documentação
afirmava que uma imagem noturna estava no produto quando não estava. O arquivo foi
movido para `_dev/pavilion-retired.webp` (cópia também em `_dev/pre-keyart/`) e as
três linhas de documentação corrigidas. Um arquivo morto de 148 KB que contradiz a
regra da hora única não deve sobreviver por inércia.

### A placa do palco: por que `stage-aqua` saiu e `stage-all` entrou

`stage-aqua` (1400×800) era a única peça do produto anterior à família v54. As
estatísticas medidas em `_dev/measure-assets.js` mostram o problema sem opinião:

| Peça | Dimensão | média RGB | σ RGB | entropia | peso |
|---|---|---|---|---|---|
| `stage-aqua` | 1400×800 | 205, 235, 239 | 28, 13, 22 | 5,76 | 18,4 KB |
| `cat-media` | 800×533 | 73, 110, 116 | 59, 53, 55 | 7,66 | 77,3 KB |
| `cat-developer` | 800×533 | 91, 107, 112 | 67, 50, 48 | 7,55 | 77,0 KB |
| `band-horizon` | 1200×686 | 73, 108, 133 | 68, 50, 53 | 7,63 | 93,9 KB |
| **`stage-all`** | 1024×215 | **85, 111, 129** | **54, 53, 65** | **7,65** | **31.1 KB** |

Média 205/235/239 com σ 28 é neblina: não há assunto, não há profundidade, e o
contraste entre o claro e o escuro é tão pequeno que a imagem vira textura atrás do
título. As placas de categoria têm média entre 73 e 112 e σ entre 48 e 68 — são
fotografia. O palco padrão, portanto, era o único lugar do produto que ainda parecia
template, e era justamente a primeira view da Library (e a view de favoritos).

A substituição tem duas decisões separadas, e a segunda é a que importa:

1. **Uma placa própria, não uma categoria reaproveitada.** Cair de volta em `cat-*`
   seria a quebra explícita da regra de não-repetição. O assunto é o estabelecimento
   do acervo inteiro: pavilhão de vidro com cachoeira à esquerda-centro, cristas
   enfumaçadas ao meio, cidade de vidro no horizonte direito, lago espelhado embaixo,
   sol entrando pelo alto-esquerda — a mesma hora única das seis placas.

2. **A faixa foi assada no arquivo, não delegada ao CSS.** O slot do palco é
   1232×260 (4,74:1). Entregue como panorama 1024×717 (1,43:1), o `object-fit: cover`
   com `object-position: 50% 42%` conservava só a faixa de água entre 29% e 59% da
   altura — de novo textura, agora por recorte. O `_dev/webp-convert.js` passou a
   extrair a faixa 1024×215 (4,76:1) que contém o pavilhão, a cachoeira, a orla e o
   começo do reflexo. O `rect` do job documenta os números. Assim o enquadramento é
   autoral: o que se vê é o que foi decidido, não o que o navegador cortou.

O custo é honesto: em 390×375 px o palco mostra 284–297 px dos 1024 de largura
(cerca de 28 % do quadro, centrado), então o pavilhão fica fora de enquadramento no
celular e a orla florestada assume o lugar. Em 768 px já são 612 de 1024 (60 %) e o
pavilhão volta a aparecer. Preferi não criar uma regra `data-cat="all"` de
`object-position` só para isso: deslocar o ponto focal compartilhado moveria também o
enquadramento das seis placas de categoria, que foi medido e aprovado, para beneficiar
uma. O `_dev/shots-stage/mobile-stage.png` guarda o estado real.

Verificação: `_dev/probe-library-cats.js` continua 28/28 (o pior ponto do palco novo é
o eyebrow de 12 px em 5,49:1), `_dev/shot-stage-plates.js` produz a folha de contato
com a geometria, o véu e a tipografia idênticos entre antes e depois — a única
variável é o arquivo de imagem — e `_dev/offline-aero.js` fecha em 63 recursos, 63 do
cache, 0 bytes.

## Auditoria dos dois arquivos órfãos (fechamento 0.25.0)

A predição acima — "ele sai junto com `empty-bloom.webp` na etapa de versionamento" —
foi conferida arquivo por arquivo antes de qualquer remoção, e o resultado é
diferente para cada um:

- **`empty-bloom.webp` saiu.** As referências vivas eram a entrada de precache em
  `sw.js` e nada mais: nenhum HTML, CSS, JS ou manifesto o nomeia, e os dois únicos
  caminhos construídos dinamicamente (`hub.js:7` `WORLD_IMG` e `library.js:14`
  `stageImg`) só produzem `cat-*` e `stage-all`. Ou seja: 10 794 bytes baixados em
  toda instalação fria e nunca desenhados. O original está preservado byte-idêntico em
  `_dev/pre-keyart/empty-bloom.webp` (MD5 `8ca1d395a1a175c80d1cce1b93a4f88d`, conferido
  contra a cópia viva antes de apagar) e em seis `_dev/before-tree*`, e `_dev/webp-convert.js:22`
  guarda a receita de geração. `_dev/sheet-keyart-pair.js` é a folha histórica que o
  citava como controle: ela tem ramo de arquivo ausente e desenha "—", e o PNG já
  produzido permanece como evidência.
- **`stage-aqua.webp` ficou.** Ele continua sem referência no produto — e é exatamente
  por isso que era preciso checar quem o lê: `_dev/shot-stage-plates.js:46` troca o
  `src` do palco por `assets/images/stage-aqua.webp` sobre a árvore viva e a linha 88
  lê o mesmo arquivo do disco para calcular a legenda medida (dimensão, média de
  canais, entropia). Remover o arquivo quebraria o instrumento que comprova a troca de
  placa do palco. Ele é material de comparação, não peso morto: continua fora da
  precache e nunca é servido pelo app.

Nada mais em `assets/images/` foi tocado; as árvores de comparação e as capturas de
evidência estão intactas.

**Nenhuma imagem vem de CDN.** As nove peças alcançáveis pelo app estão na precache do
Service Worker (`sw.js:33-36`: hero, palco `stage-all`, seis placas de categoria e a
orla de encerramento), então a Home e a Library continuam compostas offline. `stage-aqua`
não está na precache porque o produto não o alcança. Uma imagem nova só entra com o
caminho adicionado à precache no mesmo commit.

## Como a imagem é montada

- `<img>` com `alt=""` e `aria-hidden="true"` — é arte de orientação, não conteúdo;
  uma imagem que transmita informação (um diagrama do usuário) recebe `alt` real.
- `fetchpriority="high"` no hero, `loading="lazy"` em tudo abaixo da dobra
  (`hub.js:35`, `hub.js:69/100`, `library.js:16`).
- O texto nunca senta direto sobre a foto: vai sobre um scrim que é um material do
  sistema (`.ocean` / gradiente de `--field-*`), porque o contraste é uma
  propriedade da composição, não um reparo posterior.
- `object-fit: cover` + ponto focal escolhido por composição, nunca centro cego.

### Quando a montagem quebra a arte: dois casos medidos e corrigidos

`_dev/probe-crop-ratios.js` percorre Home, Library, Open, Docs, Settings e as 34
ferramentas e marca todo `<img>` com `object-fit: cover` cujo aspecto renderizado
difere do aspecto natural por ≥1,6×. Ele encontrou a mesma classe de defeito em dois
lugares diferentes, com causas diferentes.

**Biblioteca (stage).** O stage era uma faixa de conteúdo (`padding: 30px 32px`, sem
altura própria) que renderizava **1230×177** — 7:1 para uma placa 3:2 — sobre a qual
sentavam `opacity: .3` e **dois** gradientes navy de `.96`→`.62`. Medido: a placa
praticamente não chegava ao olho; o cabeçalho da Library lia como borrão escuro e as
seis identidades de categoria só existiam na Home. Corrigido dando ao stage altura
própria (260 px, render **1230×258**, recorte **6,96:1 → 4,77:1**), subindo a opacidade
para `.34` e substituindo o par de gradientes por **um** scrim direcional que protege
só a coluna de texto. `_dev/probe-library-cats.js` mede as sete categorias × quatro
peças de texto = 28 pontos: todos passam, pior texto pequeno 4,81:1.

**Home (mosaico).** Aqui o recorte era duro mas honesto — as placas 3:2 sentam em
cartões de altura fixa com a faixa de interesse no terço médio, e `_dev/shot-home-mosaic.js`
confirma que continuam a ler como lugares. O defeito era outro, e invisível no recorte:
o véu era uma rampa em **porcentagem da altura do cartão**, enquanto a legenda é um bloco
de altura **fixa** (medido: 135–180 px). Logo, a sombra sob o texto dependia da altura do
cartão. Em 1440 o índice `01` caía a 47–59% do cartão, onde a rampa tinha só ~.18–.59 de
tinta. Em 390 era pior: um segundo bloco `@media (max-width:1024px)` (os *guard-rails* de
redesign) reafirmava `repeat(2, …)` **depois** da regra de coluna única do mobile, e a
ordem de cascade vencia — cartões de 169×174 px com legendas de 155–180 px, isto é, o
`Developer Tools` começava a legenda em **−3%** do próprio cartão, fora dele.

Correção: os topos do véu passaram a ser **px desde a base** (`shell.css:229`), o que
rende a mesma sombra sob a legenda seja qual for a altura do cartão; a linha `.world-grid`
foi removida dos guard-rails (`responsive.css:214-228`), devolvendo a coluna única ao mobile;
e o `min-height` móvel de 176 px — mais curto que a sua própria legenda — passou a 260 px
(`responsive.css:51`), o que também melhorou o enquadramento: recorte 0,5:1 / 0,97:1 →
1,05:1 / 1,38:1. O índice, a única peça que ainda apanhava um realce especular da arte
(pior píxel 1,3:1 em `cat-media`, média 10,08), recebeu o mesmo tipo de halo de tinta que
o título do hero já usa sobre fotografia — e a sonda passou a ocultar o texto com
`color: transparent` em vez de `visibility: hidden`, porque esta última apagava também a
sombra que se estava a medir.

`_dev/probe-card-contrast.js` mede 6 cartões × 4 peças × 2 viewports = **48 pontos**:
antes 31 passavam, agora **48/48**. Folhas de contacto:
`_dev/before-after/27-mosaic-captions-pair.png` (mesmo key art nas duas colunas, árvore
de isolamento :8793 contra a atual :8791).

**Regra derivada.** A rampa de um véu é medida na unidade do que ela tem de proteger:
porcentagem só é correcta quando o que protege também é em porcentagem. Uma legenda de
altura fixa exige um véu de altura fixa. E um bloco `@media` de *guard-rails* nunca deve
reafirmar uma coluna que um breakpoint mais estreito já resolveu — em cascade, mais tarde
vence, não mais específico.
**Nenhuma peça de arte deve ser aceita por uma montagem que a apaga.**

## Áudio e vídeo

Não há mídia embutida no produto e não deve haver: a promessa local-first inclui não
puxar stream de terceiros. Preview de animação é CSS/SVG; preview de documento é HTML
impresso local; saída de imagem é `canvas`/`Blob` do próprio usuário.

## Pipeline de arte (para uma peça nova)

1. Escolher a **função compositiva** antes do assunto. Se não houver função, não há imagem.
2. Gerar a partir do prompt-mestre (mesma luz, mesma paleta, mesma temperatura de humor).
3. Conferir ao lado das outras: se destoar, refazer.
4. `node _dev/webp-convert.js` com a entrada certa em `JOBS` (largura = maior
   renderização real + uma margem, nunca mais).
5. Adicionar à precache em `sw.js` e bumpar `VERSION`.
6. Capturar a tela e verificar contraste do texto por cima dela com o probe real.
