# Checklist U3 · Command palette + central shortcuts

Unidade: paleta de comandos global (`Ctrl+K` / `⌘K` / `Ctrl+P` / `?`), fuzzy sobre as 20 ferramentas
+ comandos de shell, 100% por teclado, offline e `file://`.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `js/core/palette.js` | **novo** — `VT.palette`: catálogo (20 tools + 5 navegações + idioma + 2 estilos), scoring fuzzy (prefixo > início de palavra > substring > subsequência, AND multi-palavra), UI combobox com `aria-activedescendant`, foco devolvido, atalhos globais |
| `js/core/i18n.js` | bloco `pal.*` EN+PT (título, placeholder, vazio, rodapé, ações, estilos) |
| `js/app.js` | botão lançador `#cmd-k` na topbar (`aria-keyshortcuts="Ctrl+K"`) + wiring; versão `0.6.0` |
| `index.html` | `<script src="js/core/palette.js">` após router |
| `css/components.css` | seção "Command palette": `.pal-backdrop` (z 170), `.pal`, `.pal-search`, `.pal-row/.on`, `.pal-hit`, `.pal-meta`, `.pal-empty`, `.pal-foot` |
| `sw.js` | `VERSION` `v1 → v2 → v3` + `js/core/palette.js` no SHELL (**55** URLs) |
| `js/core/registry.js` | release note `0.6.0` EN+PT |
| `README.md` / `CHANGELOG.md` / `docs/VISION.md` | status, evidências, roadmap U3 ✅ |

## Estático

- `node --check` em `palette.js`, `i18n.js`, `app.js`, `sw.js`, `registry.js` → OK.
- 55/55 URLs de precache presentes no disco (recalculado como em U1/U2).

## Verificado em navegador (evidência real, não `node --check`)

Servidor local `http://localhost:8735` com `cache-control: no-store`.

**Atualização do SW (convenção de invalidação exercida de verdade)**
- Com `VERSION` bump `v1→v2`, o navegador instalou/ativou sozinho: `cacheKeys: ["vt-shell-v2"]`,
  `shellCount: 55`, `hasPalette: true`, `active: "activated"` — sem limpeza manual de caches.
- **Captura honesta de regime:** durante a consolidação (notas de release `0.6.0` em
  `app.js`/`registry.js` escritas *depois* do precache v2), a página servida ainda mostrava
  `v0.5.0` — exatamente a armadilha documentada em U1 (precache só é refeito quando os bytes do
  `sw.js` mudam). Corrigido com bump `v2→v3`; a verificação final abaixo roda contra conteúdo fresco.
  Convenção mantida: **editar shell ⇒ bump de `VERSION` no mesmo commit**.

**Abertura e foco**
- Botão `#cmd-k` (clique real) abre; `Ctrl+K` abre; `Ctrl+P` abre; `?` abre fora de campos.
- Input recebe foco (`inputFocused: true`); 28 itens listados (20 tools + 8 comandos).
- Toggle: segundo `Ctrl+K` fecha (`toggleWorks: true`). `Esc` fecha e devolve foco
  (`focusRestored: "H1"` ao voltar da página; no Library, devolve para `#lib-q`).

**Busca fuzzy (ranking real observado)**
- `grad` → `["Gradient Lab", "Regex Tester", "UUID Generator"]` com highlight `.pal-hit` ("Grad"iente).
- Multi-palavra `colo stu` → **Color Studio** primeiro.
- `settings` → `["Go to Settings", "Image Metadata"]`; `json` → JSON Formatter; `zzzzqqq` →
  vazio honesto "No matches for …".
- `idioma` (busca em PT com UI em EN) encontra "Switch language" — o haystack inclui os dois idiomas.

**Execução por teclado**
- `Enter` sobre "Go to Settings" → `#/settings`, paleta fecha.
- `Enter` sobre Color Studio → `#/tool/color-studio`, app montado.
- `Enter` sobre "Reduce animations" → `VT.settings.get().motion: "reduced"`,
  `body[data-motion="reduced"]`; segundo uso restaura `full`.
- Comando de idioma → `VT.i18n.lang: "pt"`, chrome relabelizado ("Biblioteca"), `pal.title` vira
  "Paleta de comandos"; volta a `en`.

**Não sequestro de digitação**
- `?` disparado dentro de `#lib-q` (focado) → paleta **não** abre; foco permanece no campo.
- `/` continua focando a busca da Library sem abrir a paleta.

**Offline (prova central)**
- Servidor derrubado **e porta confirmada fechada** (`netstat` sem LISTENING, `curl` → exit 7 /
  `000`) antes do reload frio.
- Reload: shell renderiza do cache — navegação com `transferSize: 0`, `responseStatus: 200`.
  Nota de precisão: um `fetch` de recurso dentro da página **não** lança `TypeError` neste setup
  porque o SW intercepta e devolve do cache mesmo com `cache: 'reload'` (comportamento correto do
  SWR); a desconexão real é atestada por `netstat`/`curl` externos + `transferSize: 0` da navegação.
- Paleta abre offline, busca (`diff` → Text Diff), `Enter` monta `#/tool/text-diff` (`toolMounted: true`)
  e o comando de idioma executa offline (EN→PT, "Biblioteca").

**`file://`**
- `index.html` via `file://`: SW corretamente **não** registrado (0 registrations), paleta abre com
  `Ctrl+K`, busca `uuid` → "Gerador de UUID" (idioma persistido), `Enter` monta a ferramenta,
  `VT.db` continua funcionando (count 0).

**Regressão**
- 20/20 ferramentas montam (`#app-body` com filhos), 0 falhas.
- Console: **0 mensagens/erros** em todas as passadas (online, offline, file://).

## Limitações conhecidas (honestas)

- O evento sintético de teclado usado na automação não exercita o **layout físico** de teclado
  (ex.: `⌘K` real em macOS, interferência de extensões do navegador) — comportamento padrão de
  `keydown` com `ctrlKey/metaKey`, mapeado como nos apps de referência.
- `Ctrl+P` substitui o atalho de impressão do navegador enquanto a página tem foco; é intencional
  (paleta), mas usuários que imprimem a página devem usar o menu do navegador.
- A paleta lista comandos de shell fixos; ações **dentro** de cada ferramenta (ex.: "exportar PNG")
  ainda não são comandos — entrada natural para U5 (undo/redo) e para um registro de ações por app.
- Sem histórico de "últimos comandos" por enquanto (recents de ferramentas continua só no Hub).

## Veredito

**U3 concluída e validada.** Abertura por 4 caminhos, ranking fuzzy multi-palavra com os dois
idiomas, execução de navegação/idioma/estilo por teclado, foco devolvido, nenhum sequestro de
digitação, 100% funcional offline com a porta fechada e sob `file://`, regressão 20/20 com console
limpo. A bump de `VERSION` do SW foi exercida de ponta a ponta, confirmando a convenção de
atualização de cache documentada em U1/U2.
