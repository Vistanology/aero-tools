# VISTANOLOGY AERO — design system

O sistema visual do Vista-Tools (`aero-tools`). Esta pasta é a referência: quando o
código e este texto discordarem, **o código vence e este texto deve ser corrigido** —
mas qualquer mudança deliberada de direção deve ser documentada aqui no mesmo ciclo.

## Índice

| Documento | Conteúdo |
|---|---|
| [identity.md](identity.md) | A identidade real da marca, medida no site institucional, e os dois substratos do produto |
| [tokens.md](tokens.md) | Tokens, o contrato de substrato e as restrições de contraste que elas carregam |
| [components.md](components.md) | Tipografia, materiais, componentes e os padrões de bancada/layout |
| [imagery.md](imagery.md) | Direção de arte das imagens, formato, offline e o que está proibido |
| [new-tool.md](new-tool.md) | Guia para construir uma ferramenta que já nasce alinhada ao sistema |
| [quality.md](quality.md) | Acessibilidade, responsividade, pipeline de verificação e o snapshot `v1_css/` |

## Regra de governança

Nenhuma ferramenta define paleta, botão, sombra, raio ou espaçamento próprios.

`css/apps.css` pode descrever **layout** de um tool (grades, alturas, posições) e
**estados** do seu domínio (um nó selecionado, uma célula de cor). Ele não pode:

- criar um gradiente novo para um botão;
- fixar uma cor de texto que já exista como token de tinta;
- introduzir um raio ou sombra fora da escala.

Quando uma ferramenta precisa de algo que não existe, isso é um sinal de que o
sistema está incompleto: adicione o componente em `css/components.css`, documente em
[components.md](components.md) e use-o.

### Como isso é medido, e o que a medição não prova

A regra acima já foi violada sem que ninguém percebesse, porque revisão de código não
encontra um valor que não está no CSS que você está olhando. `_dev/probe-token-conformance.js`
abre as 34 ferramentas num navegador real e pergunta, para cada controle pintado, se o valor
que ele usa existe na escada — lida do documento, não do arquivo. Hoje:

- **raio**: 9 valores em uso, **1 fora da escada** (`10px` no `input.ds-input`, ver exceções).
- **peso**: 5 valores; o `500` do `.type-tile` era o único fora e foi para `550`.
- **sombra / borda**: os valores restantes exclusivos de uma ferramenta são papel, não
  deriva — um identificador de 13px na timeline e um tile de ícone não devem ter a mesma
  sombra de um botão de 28px.

Uma medição computed-style **não distingue** `var(--sel-line)` de `rgba(31,160,216,.5)`
escrito à mão: os dois pintam o mesmo pixel. O probe diz se o produto está coerente; ele não
diz se o fonte está disciplinado. Para isso existe a regra de que um valor de estado em
`apps.css` só entra com token nomeado.

### Exceções autorizadas (e por quê)

| Onde | O que | Por que fica fora |
|---|---|---|
| Design System Lab (`.ds-*`) | escala própria `--ds-r-sm: 10px … --ds-r-xl: 28px` | o assunto da ferramenta *é* um conjunto de tokens; ela renderiza uma mesa de demonstração dentro do `.ds-preview`, não a chrome do produto |
| Component Builder (`.cb-*`) | raio, raio e glow vindos de `--cb-*` | idem: é o CSS que a ferramenta gera para o usuário copiar |
| Diagram Studio (`.dg-zbtn`, `.dg-zval`) | raio `0px`, sem borda | botões sobrepostos ao canvas; ali a crispidez é o acerto |
| Playground (`.pg-tab`) | raio composto `12px 12px 0 0` | aba que se funde à superfície embaixo — forma por papel, não violação |
| Document Workshop (`.dwc-*`) | bloco de código escuro sobre papel | é o que sai no PDF; achatar na receita de tela mudaria o documento impresso |

Uma exceção nova precisa entrar nesta tabela com um motivo, ou vira deriva.

## Como o CSS é carregado

`index.html` nesta ordem — ela é o sistema, não é arbitrária:

```
fonts.css → tokens.css → base.css → background.css → glass.css → components.css → shell.css → apps.css → responsive.css
```

`tokens.css` declara valores, `glass.css` declara materiais **e o contrato de tinta
por substrato**, `components.css` declara componentes, `shell.css` declara as páginas
de marca, `apps.css` declara as bancadas. Cada camada só pode consumir a anterior.

## Antes de abrir uma Issue sobre "visual"

1. Rode o pipeline de verificação ([quality.md](quality.md#pipeline)). O contador de
   falhas de contraste é um número, não uma opinião: hoje é **0** nas 39 telas.
2. Compare com as capturas de referência em `_dev/ref/` (site institucional) e com o
   estado atual em `_dev/shots-v4/`.
3. Pergunte: o problema é **material errado**, **substrato errado** ou **composição**?
   Os dois primeiros têm correção central; o terceiro é trabalho de página.

## Exemplo: certo × errado

```html
<!-- Certo: a ferramenta declara o substrato e deixa o sistema escolher a tinta. -->
<div class="cs-panel glass">
  <button class="btn btn-primary">Gerar paleta</button>
  <section class="bench-sec glass bench-sec--quiet"><p>Texto de apoio</p></section>
</div>

<!-- Errado: a ferramenta inventa material, tinta e raio. -->
<div style="background:linear-gradient(#111,#222);border-radius:6px">
  <button style="background:#00e5ff;color:#000">Gerar paleta</button>
  <p style="color:#8aa">…</p>
</div>
```

O segundo exemplo passa no teste visual de "bonito" e quebra o sistema: a tinta do
texto não vem do substrato, o botão não tem gloss nem estado, e o parágrafo fica
ilegível em `data-glass="solid"`.
