# Guia: uma ferramenta nova que já nasce alinhada

O contrato é pequeno; o que costuma dar errado é o que vem dele pela metade.

## 1. Estrutura mínima

```js
/* VISTANOLOGY / OPEN — My Tool (<o que faz>, local-first) */
VT.modules['my-tool'] = (function () {
  'use strict';
  const TOOL = 'my-tool';
  const U = VT.utils, t = (k, v) => VT.i18n.t(k, v), esc = U.esc;

  function mount(el) { /* render + listeners */ }
  function unmount() { /* solta listeners/timers, faz flush do autosave */ }

  const def = {
    id: TOOL, cat: 'productivity', icon: 'split', version: '0.1.0',
    name: { en: 'My Tool', pt: 'Minha Ferramenta' },
    tagline: { en: 'One honest line about what it does.', pt: 'Uma linha honesta sobre o que faz.' },
    tags: ['my', 'tags'],
    deps: [],
    // Os docs são o contrato de honestidade da ferramenta: o que faz, como usar,
    // o que fica no dispositivo e onde ela termina.
    docs: { en: { summary: '…', usage: '…', privacy: '…', limits: '…' },
            pt: { summary: '…', usage: '…', privacy: '…', limits: '…' } },
    mount: mount, unmount: unmount
  };

  VT.i18n.add({ en: { 'my.key': 'Text' }, pt: { 'my.key': 'Texto' } });
  VT.registry.add(def);
  return def;
})();
```

```html
<!-- index.html, junto dos outros <script src="js/apps/..."> -->
<script src="js/apps/my-tool.js"></script>
```

`sw.js`: adicione o caminho na precache e bump `VERSION`. Sem isso a ferramenta
funciona online e quebra offline — que é a falha mais grave possível num produto
local-first.

`docs.privacy` e `docs.limits` não são burocracia: elas obrigam a frase "nada sai do
navegador" a ser verdadeira para esta ferramenta específica, e a dizer onde ela para.

O prefixo de classe/`id` é **uma sigla por ferramenta, e ela não pode começar como
prefixo de outra já existente**: `dw-` para Document Workshop colidia com Data
Workspace e `apps.css` aplicava os estilos de um sobre o outro sem erro visível.
`dwc-` resolveu. Antes de escolher, procure o prefixo em `css/apps.css`.

## 2. O que a ferramenta **não** define

| Não faça | Faça |
|---|---|
| `color: #123456` | `color: var(--fg-2)` (a tinta vem do substrato) |
| `background: linear-gradient(...)` num botão | `<button class="btn btn-primary">` |
| `border-radius: 7px` | `var(--r-sm)` / `var(--r-md)` |
| `padding: 13px` | `var(--sp-2)` / `var(--sp-3)` |
| `<div style="background:rgba(0,0,0,.5)">` atrás de texto | material do sistema (`.glass`, `.ocean`, `.bench`) |
| card dentro de card | uma superfície com seções rotuladas (`.bench-sec`) |

Em `css/apps.css` a ferramenta pode escrever **layout do próprio domínio**
(alturas de coluna, grade de resultados, posição de um gizmo). É a única camada onde
isso é permitido, e ainda assim só com tokens de material.

**O prefixo do nome de classe é o espaço de nomes da ferramenta — use um só, e só
o seu.** `apps.css` é uma folha global: uma regra `.is-val { min-width: 40px }` do
Favicon Studio reestiliza o inspetor do Image Studio se os dois usam `is-`, e nada
na página denuncia isso. Três colisões já aconteceram e cada uma foi encontrada por
medição, não por leitura:

| prefixo | dono | vazou para | sintoma |
|---|---|---|---|
| `dw-` | Data Workspace | Document Workshop | padding do palco 22→16px nas linhas de projeto; renomeado a `dwc-` |
| `is-` | Image Studio | Favicon Studio | as duas ferramentas definiram `.is-color/.is-range/.is-val`; a segunda definição venceu a primeira (leitura 46→40px) |
| `ds-` | Design System Lab | Diagram Studio | ids colidem mas são escopados por `$(sel, root)` (inofensivo); **`.ds-proj-list` era uma classe** definida no bloco do Design System Lab de que o Diagram Studio dependia (`js/apps/diagram-studio.js:500` emitia a classe do vizinho) — o empréstimo acabou quando a lista virou `.bench-list` |

A correção não é "renomear de novo": é **não reescrever a peça**. Linha de projeto
salvo, placa de código, leitura de controle, amostra de cor e slider já existem como
`.bench-row`, `.bench-code`, `.bench-val`, `.bench-color`, `.bench-range`
(`components.css:326-349`) — a ferramenta acrescenta ao markup o nome compartilhado
junto do seu (`class="bench-row is-proj-row"`) e mantém no seu bloco apenas o que é
geometria própria. O que não tem peça compartilhada é o que a ferramenta pode escrever.

## 3. Checklist de direção de arte (por ferramenta)

- [ ] Monto dentro de `#app-body` com um único elemento de bancada (`.bench`, `.mat`,
      `.bench-sec`) e **não** invento painel;
- [ ] Escolho o substrato conscientemente (`.glass` claro para trabalhar, `.ocean`
      para peça de marca) e **não** misturo os dois dentro de um mesmo painel;
- [ ] A barra de ferramentas agrupa por intenção com `.bench-rail-group` +
      `.bench-sep`, em vez de uma fileira plana de botões;
- [ ] Todo texto visível usa `--fg/--fg-2/--fg-3/--fg-4`;
- [ ] Linha de projeto, placa de código, leitura de controle, cor e slider são as
      peças `.bench-*`, não uma regra nova no meu prefixo;
- [ ] Meu prefixo de classe não é o de nenhuma outra ferramenta (`grep -n "\.xx-" css/apps.css`);
- [ ] Estado vazio existe, é um `.mat-empty` (título + corpo + CTA com atalho) e some
      com o primeiro objeto, sem trocar o caminho de render;
- [ ] Estados de erro/sucesso usam `--ok-ink/--err-ink` **com** ícone ou texto;
- [ ] Zoom/pan/seleção são configurações de **vista**: persistem, não entram no undo;
- [ ] `Ctrl+Z`/`Ctrl+Shift+Z` via `VT.history` quando há edição;
- [ ] Persistência via `VT.db` (autosave com debounce + flush ao desmontar);
- [ ] i18n: **nenhuma** string literal de UI em PT ou EN — tudo por `t()` nos dois idiomas;
- [ ] Nada sai do navegador: sem `fetch` externo, sem CDN, sem `eval()`.

## 4. Se a ferramenta é um editor de canvas

Siga Diagram Studio como referência (`js/apps/diagram-studio.js`), porque ele resolve
os três problemas que toda bancada de desenho tem:

1. **a folha vs. a mesa** — o documento é `.mat-sheet` (papel com sombra própria)
   sobre `.mat` (mesa recessada pontilhada). Uma área de desenho sem borda própria é
   indistinguível de um bug de render;
2. **o espaço de trabalho não acaba quando o conteúdo acaba** — por isso o empty state
   mora na mesa, não num painel lateral;
3. **inspetor sem seleção não é formulário vazio** — é uma placa `.bench-sec--quiet`
   dizendo o que fazer.

Também já resolvidos ali e reaproveitáveis: dimensionar a folha por zoom (não escalar
o container), grade com linhas maiores a cada 5 células, e `fitZoom()` medindo o
container real em vez de um número chutado.

## 5. Ferramenta nova é uma decisão editorial

`Prefiro poucas ferramentas excelentes a muitas superficiais.` Antes de cadastrar
uma: ela muda algo que já existe? Tem fluxo real de ponta a ponta (entrar → editar →
desfazer → salvar → exportar)? Se a resposta for não, o que falta é profundidade na
ferramenta existente, não mais um card na Home.

## 6. Prova de que está pronta

```bash
PORT=8791 node serve.js &
NODE_PATH=<node_modules> node _dev/regress-aero.js      # montou? sem erros de console?
NODE_PATH=<node_modules> node _dev/probe-contrast2.js   # CONTRAST FAILURES: 0
```

Mais: capturar a ferramenta em desktop **e** em 375px, nas duas saídas de
acessibilidade (`data-glass="solid"`, `data-motion="reduced"`), e olhar as imagens.
Nenhum dos quatro passos é opcional — ver
[quality.md](quality.md#verificação-visual-é-obrigatória).
