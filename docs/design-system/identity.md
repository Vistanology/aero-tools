# Identidade

Referência única: **https://vistanology.github.io/our-site/**. Nada neste arquivo é
gosto — cada valor abaixo foi medido no CSS/HTML do próprio site (capturas de
referência em `_dev/ref/`). O objetivo da missão não é "parecer Frutiger Aero", é
**parecer Vistanology**: a mesma qualidade de direção, composição e acabamento.

## 1. A marca, medida

| Papel | Valor | Onde |
|---|---|---|
| Base da marca | `#026DA7` | fundo do site (deep ocean field) |
| Destaque aqua | `#41B4E8` / `#0073E5` | botões, links, foco |
| Tinta sobre o campo | `#F5FCFF` | corpo do texto |
| Texto secundário | `#9EEAFF` | apoio |
| CTA sobre destaque | `#001E31` | texto do botão aqua |
| Faixa de categoria | `#3099D3 → #001F33` | faixas horizontais |
| Seção clara institucional | `#F9FCFE` / `#E9F3F9` / texto `#5C6E79` | blocos de texto longos |

Três assinaturas de detalhe, não de cor:

1. **Gloss split** — o botão primário tem um corte duro em 49%/51% (mais claro
   acima, mais profundo abaixo, com elevação na base). É a assinatura do material
   Aqua, não um gradiente decorativo: `--gloss-primary`.
2. **Campo com bloom** — o fundo é um degradê céu→mar com duas luminárias
   (teal/ciano) e uma faixa de horizonte. O produto tem uma versão própria disso,
   mais contida, em `background.css`.
3. **Tipografia editorial de sistema** — `Segoe UI`, `Trebuchet MS`, Arial, sans-serif, com tracking negativo. O acento é itálico leve em menta `#C5FFDF`, não uma serifa.
4. **Cápsula de navegação** — emblema oficial, nome com 25px e tracking de -.7px, raio de 40px e reflexos internos. O produto adiciona um fundo escuro à placa para preservar a leitura sobre bancadas em movimento.

## 2. O que a marca não é

Estes eram o template que a missão pediu para matar:

- painel branco com borda azul;
- coleção de cards iguais em grade;
- input e botão de admin-template;
- "sopa de gradientes" em tudo;
- foto genérica colada atrás do conteúdo;
- neon roxo, cyberpunk, circuitos, servidores, robôs, escritório corporativo.

## 3. Os dois substratos do produto

O Vista-Tools tem uma tensão real: a marca é um **campo oceânico escuro** com luz
editorial, mas uma ferramenta de trabalho precisa de uma **superfície clara** onde o
usuário olha por vinte minutos. Resolver isso trocando um pelo outro foi o erro da
tentativa anterior ("o produto inteiro ficou uma superfície pálida").

A resposta do sistema é **dois substratos que coexistem de propósito**:

| Substrato | Tokens | Onde | Tinta |
|---|---|---|---|
| **Campo** (deep ocean) | `--field-1..5`, `--on-field*` | Home, Library, Open, Docs | clara (`#F5FCFF`) |
| **Bancada** (daylight) | `--stage`, `--glass-*`, `--void/--night/--abyss` | as 34 superfícies de trabalho | escura (`#08293A`) |

A escolha é sempre do ponto de vista da experiência, não da conveniência do arquivo:

- **Home** = experiência de marca → campo (hero, faixa de coleção, categorias,
  manifesto, fechamento). A Home **clara** continua sendo uma possibilidade
  legítima; o que não é negociável é a qualidade de composição.
- **Library** = campo, mas com atmosfera por categoria (cada categoria tem uma
  imagem-chave própria, nunca a mesma em seis cards).
- **Ferramenta** = bancada clara. Uma área de trabalho vazia não pode parecer tela
  inacabada — ver o padrão de [estado vazio](components.md#estado-vazio-obrigatório).

O contrato que torna isso barato de manter está em [tokens.md](tokens.md#contrato-de-substrato):
o componente usa `--fg`, nunca a cor absoluta, e quem troca de substrato troca de tinta.

## 4. Voz e hierarquia

- Título grande: `--weight-display` = **450**, `--track-display` (-.032em). Nunca bold.
  O valor acompanha o our-site; a face renderizada depende da pilha de sistema disponível — ver [tokens.md](tokens.md#peso-e-família-do-display).
- Eyebrow: 12px, `--eyebrow-track` (.33em), maiúsculas, sempre sobre um token de tinta.
- Lead: 17–20px, peso 250–300, line-height 1.4–1.55.
- Rótulo de interface: 10–11px, `--micro-track` (.14em), maiúsculas, peso 500–650.
- Métrica: número grande e forte **com a unidade em peso leve** ao lado, separados por
  um hairline (padrão `.stat-num` / `.stat-unit` / `.stat-label`).

A hierarquia no campo é feita de **tamanho, peso e tracking**, nunca de lavar o texto:
o piso de contraste AA no `#026DA7` força toda tinta acima de luminância relativa 0.79,
então os quatro tiers de tinta do campo têm passos de luminância pequenos por construção.

## 5. Relação com o site institucional

O site institucional é a **fonte da verdade da identidade**; o Vista-Tools é um
produto da mesma marca com um trabalho diferente. Então:

- **compartilha**: paleta medida, a assinatura de gloss, a voz tipográfica (sans leve,
  450 no display, tracking negativo), o ritmo largo e **desigual** entre seções de
  marca, a direção de arte das imagens;
- **não copia**: o layout de landing page, as fotos específicas, a estrutura de navegação;
- **acrescenta** o que um produto precisa e um site não tem: o contrato de substrato,
  os componentes de bancada, o estado vazio, o atalho de teclado como elemento visual.

Copiar a superfície produz um clone de baixa qualidade. Alcançar o padrão de direção
produz um produto da marca. Esta é a distinção que a missão pede para manter.

## 6. Integração do produto

O shell usa `assets/brand/emblem.svg`, extraído do site oficial e já presente no projeto. O favicon usa o ícone local correspondente; os IDs de instalação e armazenamento não mudam. A cápsula expõe Biblioteca, Favoritos, Docs e Open; abaixo de 1024px, o menu inclui Configurações, retorna foco com Escape e recebe foco no primeiro link ao abrir. Busca e idioma continuam acessíveis fora do menu.

A Home oferece busca direta, três entradas editoriais para bancadas e categorias com assets locais existentes. Na Biblioteca, links nativos permitem abrir em outra aba; a estrela é um botão separado. Ordenação por coleção, nome ou uso recente e coleção de recentes usam dados reais do registry e do armazenamento local. Não se inventa classificação de utilização ausente nos manifestos.

## 7. Snapshot imutável

O CSS do site está congelado e verificado por hash em `v1_css/` — ver
[snapshots.md](snapshots.md). Ele é referência de consulta, **não** importação.
Nenhum arquivo novo é escrito dentro de `v1_css/`.
