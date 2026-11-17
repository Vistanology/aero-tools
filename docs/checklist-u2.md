# U2 Checklist · Project store (`VT.db`) + backup/restore

Escopo: dar à Vistanology um repositório estruturado **local-first** para o trabalho salvo do
usuário, com persistência, migração de schema, export/import e integração real a uma ferramenta.
Additivo: nenhuma das outras 19 ferramentas mudou. · Scope: a local-first structured project store,
additive; the other 19 tools are untouched.

## Arquivos · Files
- `js/core/db.js` — **novo** · `VT.db`: IndexedDB `vistanology-open` (schema v1), object store
  `projects` (keyPath `id`, índices `tool` e `updatedAt`) + `meta` (guarda `schemaVersion`).
  `onupgradeneeded` versionado com esqueleto de migração futura. API: `available/open/put/get/
  list/remove/clear/count/exportAll/importAll` + `uid`. Retorna Promises; nunca toca a rede.
- `js/apps/gradient-lab.js` — **1.0.0 → 1.1.0**: seção "Gradientes salvos" (campo nome + Salvar,
  lista com Carregar/Excluir com confirmação), persistida em `VT.db`. Autosave do estado de trabalho
  em `VT.store` permanece intacto.
- `js/shell/settings.js` — card "Projetos salvos": contagem ao vivo, Exportar tudo (`.json`),
  Importar (arquivo, com validação), Apagar (com confirmação). "Apagar dados locais" agora também
  limpa `VT.db`.
- `js/core/i18n.js` — chaves EN/PT de projetos + ajuste honesto de `set.data.*` (passa a citar projetos).
- `sw.js` — `db.js` adicionado ao precache do shell (agora **54** URLs: 34 shell + 20 apps).
- `index.html` — carrega `js/core/db.js` após `storage.js`; removido `<meta color-scheme>` duplicado.
- `js/app.js` — versão interna `0.4.0 → 0.5.0`. `css/apps.css` — estilo da lista salva.

## Verificação estática · Static verification
- ✅ `node --check` em `db.js`, `gradient-lab.js`, `settings.js`, `i18n.js`, `registry.js`, `sw.js`.
- ✅ Integridade do precache: **54/54** URLs existem no disco; `db.js` presente no shell.
- ✅ Sem dependências novas de runtime; nada envia dados (procedimento local puro).

## Verificado em navegador (real browser, evidence-based)
Testado contra `serve_u1.js` (`http://localhost:8735`, `cache-control: no-store`).

### Núcleo `VT.db`
- ✅ `available` true, `SCHEMA_VERSION` 1, banco criado via `onupgradeneeded`.
- ✅ `put` gera id UUID-v4 + `createdAt`/`updatedAt`; `put` com mesmo `id` mantém `createdAt` e
  atualiza `updatedAt` (update real). `get` retorna o registro. `list()` ordena por `updatedAt` desc.
- ✅ `list(toolId)` filtra por ferramenta (gradient-lab e color-studio isolados).
- ✅ `count`, `remove` corretos; `clear` zera.
- ✅ `exportAll` → `{ app, kind, schemaVersion, exportedAt, projects[] }`.
- ✅ `importAll` **merge**: 2 válidos importados + 1 malformado (sem `data`) **skipped** (não corrompe).
  **replace**: limpa e importa exatamente 1.
- ✅ **Persistência entre recargas** (`http://localhost`).
- ✅ **Funciona em `file://`**: IndexedDB disponível na origem; put/get/remove ok. (Caminho de rejeição
  gracioso existe para contextos que bloqueiam IDB.)

### Gradient Lab (integração via UI real)
- ✅ Salvar pelo botão cria 1 linha e grava em `VT.db` com snapshot válido (type/2 stops/angle/size).
- ✅ Carregar restaura o gradiente salvo: mudei o ângulo para 270° via chip, clicar em Carregar
  restaurou 135° (`restoredToSaved` true) e atualizou o palco/CSS.
- ✅ Excluir abre o modal de confirmação (`.btn-danger`); confirmar remove a linha e zera o store.
- ✅ A saída principal continua íntegra: `linear-gradient(90deg, …)` gerado e preview atualiza ao vivo.
- ✅ i18n: título "Gradientes salvos" e botão "Salvar" em PT.

### Settings (backup/restore via UI real)
- ✅ Card renderiza (5 cards), contagem "N saved", botões habilitados quando o banco está disponível.
- ✅ Exportar → toast "Backup downloaded" (caminho `downloadText`).
- ✅ Importar arquivo **válido** (via `DataTransfer`) → merge 2 → contagem 2→4, toast "Imported 2".
- ✅ Importar **JSON inválido** e **JSON sem `projects`** → ambos rejeitados com o toast correto,
  contagem inalterada.
- ✅ Apagar projetos → modal → confirmar → contagem 0, exibição "Nothing saved yet", toast
  "Saved projects erased".
- ✅ **Reset global ("Apagar dados locais") limpa AMBOS os stores**: favoritos 3→0 **e** projetos 1→0.
- ✅ Sem overflow horizontal em viewport estreito; ações quebram linha; rótagens PT completas
  (labels/botões/contagem/modal/toast).

### Offline (premissa central do produto)
- ✅ `db.js` no precache; servido pelo SW. **Boot a frio offline** (servidor **derrubado**, `fetch`
  lança `TypeError: Failed to fetch`): o shell + Gradient Lab montam a partir do cache, a lista salva
  renderiza, e **Carregar** aplica o gradiente salvo (200°) — tudo sem rede. Gravar offline também
  funciona (IndexedDB é local).
- ✅ Reconexão recupera: `fetch` volta a 200, SW segue controller, store íntegro.

## Regressão e console · Regression & console
- ✅ **20/20** ferramentas montam via hash, **0 erros**, sem "not found"; Gradient Lab inalterado no
  essencial.
- ✅ **Console limpo** em todas as interações (navegação, ferramentas, Settings, offline).

## Limitações honestas · Known limits
- **Migração de schema**: o caminho de criação v1 está provado; um upgrade v1→v2 ainda não foi
  exercitado porque não existe v2 — o esqueleto de migração em `onupgradeneeded` fica pronto para ele.
- **Uma ferramenta integrada** de propósito (valor > quantidade): as demais adotarão o mesmo padrão em
  incrementos futuros; o backup/export já cobre qualquer registro escrito em `VT.db`.
- O botão nativo de "Instalar" do navegador/OS segue não exercitável por automação (ver checklist-u1).

## Veredito · Verdict
U2 (a+b+c) concluída e **validada em navegador real**, incluindo persistência, import/export com
validação, reset combinado e **partida a frio offline** com carregar/gravar projeto. Regressão 20/20
sem erros. U3+ não iniciadas.
