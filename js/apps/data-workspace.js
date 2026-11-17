window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['data-workspace'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'dw.title': 'Data Workspace',
      'dw.tree': 'Tree', 'dw.json': 'JSON', 'dw.source': 'Source', 'dw.sourcePh': 'Paste JSON here, then Apply…',
      'dw.apply': 'Apply', 'dw.import': 'Import .json', 'dw.export': 'Export .json', 'dw.copy': 'Copy',
      'dw.sample': 'Sample', 'dw.collapse': 'Collapse all', 'dw.expand': 'Expand all',
      'dw.valid': 'Valid JSON', 'dw.invalid': 'Invalid JSON', 'dw.empty': 'Empty document',
      'dw.line': 'line', 'dw.col': 'column', 'dw.indent': 'Indent', 'dw.addKey': 'Add key', 'dw.addItem': 'Add item',
      'dw.del': 'Delete', 'dw.newKey': 'newKey', 'dw.type': 'Type',
      'dw.m.keys': 'Keys', 'dw.m.nodes': 'Nodes', 'dw.m.depth': 'Depth', 'dw.m.size': 'Size',
      'dw.copied': 'Copied to clipboard', 'dw.copyFail': 'Could not copy — select and copy manually.',
      'dw.exported': 'Document exported', 'dw.imported': 'Imported {name}', 'dw.badImport': 'Could not read that file as JSON.',
      'dw.applied': 'Source applied to tree', 'dw.big': 'Large document — collapsed for performance. Edit or expand nodes as needed.',
      'dw.privacy': 'Everything runs in your browser: parsing, editing, formatting and export happen in memory. Nothing is uploaded.',
      'dw.root': 'root', 'dw.unnamed': '(root)', 'dw.added': 'Added', 'dw.deleted': 'Node deleted',
      'dw.searchPh': 'Search keys and values…', 'dw.format': 'Output format', 'dw.pretty': 'Pretty', 'dw.minified': 'Minified', 'dw.sort': 'Sort keys',
      'dw.modes': 'Workspace modes', 'dw.tabEditor': 'Editor', 'dw.tabCsv': 'CSV ↔ JSON', 'dw.tabCompare': 'Compare', 'dw.tabSchema': 'Schema',
      'dw.csvIn': 'CSV input', 'dw.csvOut': 'JSON → CSV', 'dw.csvLoad': 'Load .csv', 'dw.csvPh': 'Paste CSV rows here…', 'dw.csvHeader': 'First row is header', 'dw.csvDelim': 'Delimiter',
      'dw.csvTo': 'CSV → JSON', 'dw.csvBack': 'JSON → CSV', 'dw.csvExport': 'Export .csv',
      'dw.csvUnterminated': 'Warning: unterminated quote at end of input.', 'dw.csvEmpty': 'No rows found.',
      'dw.csvRowIssue': 'Row {n}: {got} fields, expected {want}.', 'dw.csvWarn': 'Imported with warnings:', 'dw.csvOk': 'Parsed {n} rows cleanly.',
      'dw.csvToDone': 'Loaded {n} rows into the tree', 'dw.csvLoaded': 'Loaded {name}', 'dw.csvExported': 'CSV exported',
      'dw.cmpA': 'A (current)', 'dw.cmpBPh': 'Paste a second JSON document to compare against the current one…', 'dw.cmpRun': 'Compare',
      'dw.cmpAdded': 'Added', 'dw.cmpRemoved': 'Removed', 'dw.cmpChanged': 'Changed', 'dw.cmpSame': 'Status', 'dw.cmpEqual': 'identical', 'dw.cmpEqualMsg': 'The two documents are identical.',
      'dw.cmpBadB': 'Document B is not valid JSON.', 'dw.cmpNoA': 'No current document to compare — edit or import one first.',
      'dw.schemaIn': 'JSON Schema', 'dw.schemaSample': 'Sample schema', 'dw.schemaPh': 'Paste a JSON Schema (subset: type, properties, required, items, enum)…', 'dw.schemaRun': 'Validate document',
      'dw.schemaNote': 'Validates the current document against a lightweight subset of JSON Schema.', 'dw.schemaResult': 'Result',
      'dw.schBadSchema': 'Schema is not valid JSON.', 'dw.schPass': 'Document is valid against the schema.', 'dw.schFail': '{n} problem(s) found',
      'dw.schType': 'Expected {want}, got {got}.', 'dw.schEnum': 'Value not in allowed set {want}.', 'dw.schReq': 'Required property "{k}" is missing.', 'dw.schFalse': 'This position is not allowed.',
      'dw.tabProjects': 'Projects', 'dw.showMore': 'Show {n} more…',
      'dw.projNamePh': 'Project name…', 'dw.projSave': 'Save project', 'dw.projList': 'Saved projects', 'dw.projUntitled': 'Untitled',
      'dw.projBackup': 'Backup & restore', 'dw.projBackupDesc': 'Export every saved project as one JSON file, or restore a previous backup.', 'dw.projBackupBtn': 'Download backup', 'dw.projRestoreBtn': 'Restore backup', 'dw.projReplace': 'Replace existing (instead of merge)', 'dw.projNote': 'Projects are stored on this device with IndexedDB. Your work is also autosaved locally so it survives reloads.',
      'dw.projLoad': 'Open', 'dw.projDelete': 'Delete', 'dw.projDeleteQ': 'Delete project "{name}"? This cannot be undone.', 'dw.projDeleted': 'Project deleted',
      'dw.projEmpty': 'No saved projects yet. Edit a document and press Save project.', 'dw.projNothing': 'Nothing to save — the document is empty.',
      'dw.projLoaded': 'Opened "{name}"', 'dw.projLoadedToast': 'Opened "{name}"', 'dw.projSaved': 'Saved as "{name}"', 'dw.projSavedToast': 'Project saved',
      'dw.projBackupDone': 'Backup downloaded ({n} projects)', 'dw.projRestored': 'Restored {imported} project(s), skipped {skipped}', 'dw.projBadBackup': 'That file is not a valid Vistanology backup.',
      'dw.projRestoredHint': 'Restored your last autosaved session', 'dw.dbUnavailable': 'Local storage (IndexedDB) is unavailable in this context, so projects cannot be saved.', 'dw.dbError': 'Could not reach local project storage.'
    },
    pt: {
      'dw.title': 'Área de Dados',
      'dw.tree': 'Árvore', 'dw.json': 'JSON', 'dw.source': 'Código', 'dw.sourcePh': 'Cole JSON aqui e clique Aplicar…',
      'dw.apply': 'Aplicar', 'dw.import': 'Importar .json', 'dw.export': 'Exportar .json', 'dw.copy': 'Copiar',
      'dw.sample': 'Exemplo', 'dw.collapse': 'Recolher tudo', 'dw.expand': 'Expandir tudo',
      'dw.valid': 'JSON válido', 'dw.invalid': 'JSON inválido', 'dw.empty': 'Documento vazio',
      'dw.line': 'linha', 'dw.col': 'coluna', 'dw.indent': 'Indentação', 'dw.addKey': 'Adicionar chave', 'dw.addItem': 'Adicionar item',
      'dw.del': 'Excluir', 'dw.newKey': 'novaChave', 'dw.type': 'Tipo',
      'dw.m.keys': 'Chaves', 'dw.m.nodes': 'Nós', 'dw.m.depth': 'Profundidade', 'dw.m.size': 'Tamanho',
      'dw.copied': 'Copiado para a área de transferência', 'dw.copyFail': 'Não foi possível copiar — selecione e copie manualmente.',
      'dw.exported': 'Documento exportado', 'dw.imported': 'Importado {name}', 'dw.badImport': 'Não foi possível ler esse arquivo como JSON.',
      'dw.applied': 'Código aplicado à árvore', 'dw.big': 'Documento grande — recolhido por desempenho. Edite ou expanda nós conforme necessário.',
      'dw.privacy': 'Tudo roda no seu navegador: análise, edição, formatação e exportação acontecem em memória. Nada é enviado.',
      'dw.root': 'raiz', 'dw.unnamed': '(raiz)', 'dw.added': 'Adicionado', 'dw.deleted': 'Nó excluído',
      'dw.searchPh': 'Buscar chaves e valores…', 'dw.format': 'Formato da saída', 'dw.pretty': 'Formatado', 'dw.minified': 'Minificado', 'dw.sort': 'Ordenar chaves',
      'dw.modes': 'Modos da bancada', 'dw.tabEditor': 'Editor', 'dw.tabCsv': 'CSV ↔ JSON', 'dw.tabCompare': 'Comparar', 'dw.tabSchema': 'Schema',
      'dw.csvIn': 'Entrada CSV', 'dw.csvOut': 'JSON → CSV', 'dw.csvLoad': 'Carregar .csv', 'dw.csvPh': 'Cole linhas CSV aqui…', 'dw.csvHeader': 'Primeira linha é cabeçalho', 'dw.csvDelim': 'Separador',
      'dw.csvTo': 'CSV → JSON', 'dw.csvBack': 'JSON → CSV', 'dw.csvExport': 'Exportar .csv',
      'dw.csvUnterminated': 'Aviso: aspas não fechadas no fim da entrada.', 'dw.csvEmpty': 'Nenhuma linha encontrada.',
      'dw.csvRowIssue': 'Linha {n}: {got} campos, esperados {want}.', 'dw.csvWarn': 'Importado com avisos:', 'dw.csvOk': '{n} linhas analisadas sem problemas.',
      'dw.csvToDone': '{n} linhas carregadas na árvore', 'dw.csvLoaded': 'Carregado {name}', 'dw.csvExported': 'CSV exportado',
      'dw.cmpA': 'A (atual)', 'dw.cmpBPh': 'Cole um segundo documento JSON para comparar com o atual…', 'dw.cmpRun': 'Comparar',
      'dw.cmpAdded': 'Adicionado', 'dw.cmpRemoved': 'Removido', 'dw.cmpChanged': 'Alterado', 'dw.cmpSame': 'Status', 'dw.cmpEqual': 'idênticos', 'dw.cmpEqualMsg': 'Os dois documentos são idênticos.',
      'dw.cmpBadB': 'O documento B não é JSON válido.', 'dw.cmpNoA': 'Nenhum documento atual para comparar — edite ou importe um primeiro.',
      'dw.schemaIn': 'JSON Schema', 'dw.schemaSample': 'Schema de exemplo', 'dw.schemaPh': 'Cole um JSON Schema (subconjunto: type, properties, required, items, enum)…', 'dw.schemaRun': 'Validar documento',
      'dw.schemaNote': 'Valida o documento atual contra um subconjunto leve de JSON Schema.', 'dw.schemaResult': 'Resultado',
      'dw.schBadSchema': 'O schema não é JSON válido.', 'dw.schPass': 'O documento é válido contra o schema.', 'dw.schFail': '{n} problema(s) encontrado(s)',
      'dw.schType': 'Esperado {want}, obtido {got}.', 'dw.schEnum': 'Valor fora do conjunto permitido {want}.', 'dw.schReq': 'Propriedade obrigatória "{k}" ausente.', 'dw.schFalse': 'Esta posição não é permitida.',
      'dw.tabProjects': 'Projetos', 'dw.showMore': 'Mostrar mais {n}…',
      'dw.projNamePh': 'Nome do projeto…', 'dw.projSave': 'Salvar projeto', 'dw.projList': 'Projetos salvos', 'dw.projUntitled': 'Sem nome',
      'dw.projBackup': 'Backup e restauração', 'dw.projBackupDesc': 'Exporte todos os projetos salvos em um único arquivo JSON, ou restaure um backup anterior.', 'dw.projBackupBtn': 'Baixar backup', 'dw.projRestoreBtn': 'Restaurar backup', 'dw.projReplace': 'Substituir existentes (em vez de mesclar)', 'dw.projNote': 'Os projetos são guardados neste dispositivo com IndexedDB. Seu trabalho também é salvo automaticamente no dispositivo e sobrevive a recarregamentos.',
      'dw.projLoad': 'Abrir', 'dw.projDelete': 'Excluir', 'dw.projDeleteQ': 'Excluir o projeto "{name}"? Isso não pode ser desfeito.', 'dw.projDeleted': 'Projeto excluído',
      'dw.projEmpty': 'Nenhum projeto salvo ainda. Edite um documento e clique Salvar projeto.', 'dw.projNothing': 'Nada para salvar — o documento está vazio.',
      'dw.projLoaded': 'Aberto "{name}"', 'dw.projLoadedToast': 'Aberto "{name}"', 'dw.projSaved': 'Salvo como "{name}"', 'dw.projSavedToast': 'Projeto salvo',
      'dw.projBackupDone': 'Backup baixado ({n} projetos)', 'dw.projRestored': '{imported} projeto(s) restaurado(s), {skipped} ignorado(s)', 'dw.projBadBackup': 'Esse arquivo não é um backup válido do Vistanology.',
      'dw.projRestoredHint': 'Sua última sessão salva automaticamente foi restaurada', 'dw.dbUnavailable': 'O armazenamento local (IndexedDB) não está disponível neste contexto, então projetos não podem ser salvos.', 'dw.dbError': 'Não foi possível acessar o armazenamento local de projetos.'
    }
  });

  const def = {
    id: 'data-workspace', cat: 'developer', icon: 'layers', version: '0.1.0',
    name: { en: 'Data Workspace', pt: 'Área de Dados' },
    tagline: {
      en: 'A flagship JSON workbench: edit any document as a live tree (values, keys, items, nesting), with path navigation, search, format/minify, CSV↔JSON, schema validation, undo/redo and local persistence.',
      pt: 'Uma bancada JSON principal: edite qualquer documento como árvore ao vivo (valores, chaves, itens, nesting), com navegação por caminho, busca, formatar/minificar, CSV↔JSON, validação de schema, desfazer/refazer e persistência local.'
    },
    tags: ['json', 'tree', 'editor', 'csv', 'schema', 'developer'],
    deps: [],
    docs: {
      en: {
        summary: 'The Data Workspace turns any JSON into an editable tree. Click a value to change it (with type detection), add or delete keys and array items, expand/collapse branches, and watch the formatted JSON update live. Import and export files, copy the result, and undo/redo every change. Search, path navigation, CSV↔JSON, schema validation and local project persistence build on the same model.',
        usage: [
          'Paste JSON in the Source pane and Apply it, or Import a .json file, or load the Sample.',
          'Click any value in the tree to edit it — numbers, booleans and null are detected automatically.',
          'Use Add key / Add item to grow objects and arrays, and the trash button to delete a node.',
          'Expand or collapse branches; Collapse all / Expand all act on the whole document.',
          'Switch indent and copy or export the live JSON on the right.',
          'Undo/redo with Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) or the buttons — every edit is reversible.'
        ],
        privacy: 'Parsing, editing, formatting and export happen in memory only. Nothing is uploaded or stored unless you use Save project.',
        limits: [
          'The tree is a full snapshot editor; very large documents are collapsed by default to stay responsive.',
          'Leaf editing infers type from the text; quote a value (e.g. "123") to force it to stay a string.',
          'Undo history is in-memory only and resets when you leave the tool.'
        ]
      },
      pt: {
        summary: 'A Área de Dados transforma qualquer JSON em uma árvore editável. Clique num valor para alterá-lo (com detecção de tipo), adicione ou exclua chaves e itens, expanda ou recolha ramos e veja o JSON formatado atualizar ao vivo. Importe e exporte arquivos, copie o resultado e desfaça/refaça cada mudança. Busca, navegação por caminho, CSV↔JSON, validação de schema e persistência local de projetos constroem sobre o mesmo modelo.',
        usage: [
          'Cole JSON no painel Código e Aplique, ou importe um arquivo .json, ou carregue o Exemplo.',
          'Clique em qualquer valor na árvore para editá-lo — números, booleanos e null são detectados automaticamente.',
          'Use Adicionar chave / Adicionar item para crescer objetos e arrays, e o botão de lixeira para excluir um nó.',
          'Expanda ou recolha ramos; Recolher tudo / Expandir tudo agem sobre todo o documento.',
          'Troque a indentação e copie ou exporte o JSON ao vivo à direita.',
          'Desfaça/refaça com Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) ou os botões — toda edição é reversível.'
        ],
        privacy: 'Leitura, edição, formatação e exportação ocorrem só em memória. Nada é enviado ou salvo, exceto se você usar Salvar projeto.',
        limits: [
          'A árvore é um editor de snapshot completo; documentos muito grandes começam recolhidos para manter a fluidez.',
          'A edição de folha infere o tipo pelo texto; coloque aspas (ex.: "123") para forçar que continue string.',
          'O histórico de desfazer fica só em memória e reinicia ao sair da ferramenta.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'data-workspace';
  let alive = false;
  let refs = {};
  let hist = null;
  let doc;                 // current parsed value
  let lastText = '';       // formatted output of doc
  let collapsed = new Set();
  let query = '';
  let slices = new Map();  // pathKey -> rendered child count (large-doc incremental render)
  const SLICE = 200;       // children rendered per branch before "show more"
  const AUTOSAVE_ID = 'dw:autosave';
  let currentId = null;    // id of the loaded/saved project (null = unnamed)
  let currentName = '';    // name tied to currentId, so renaming creates a new project instead of overwriting
  let autosave = null;     // debounced autosave fn, set in mount
  let state = { indent: '2', mode: 'pretty', sort: false };

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (['2', '4', 'tab'].includes(s.indent)) state.indent = s.indent;
    if (['pretty', 'min'].includes(s.mode)) state.mode = s.mode;
    if (typeof s.sort === 'boolean') state.sort = s.sort;
  }

  const sortDeep = (x) => Array.isArray(x) ? x.map(sortDeep)
    : (isObj(x) ? Object.keys(x).sort().reduce((o, k) => (o[k] = sortDeep(x[k]), o), {}) : x);

  const clone = (v) => (typeof structuredClone === 'function' ? structuredClone(v) : JSON.parse(JSON.stringify(v)));
  const indentStr = () => (state.indent === 'tab' ? '\t' : Number(state.indent));

  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const typeOf = (v) => Array.isArray(v) ? 'array' : (v === null ? 'null' : typeof v);

  // ---- path helpers (path = array of keys/indices) ----
  function parentOf(path) { let cur = doc; for (let i = 0; i < path.length - 1; i++) cur = cur[path[i]]; return cur; }
  function setAt(path, value) {
    if (!path.length) { doc = value; return; }
    const parent = parentOf(path); const last = path[path.length - 1];
    parent[last] = value;
  }
  function deleteAt(path) {
    if (!path.length) { doc = null; return; }
    const parent = parentOf(path); const last = path[path.length - 1];
    if (Array.isArray(parent)) parent.splice(Number(last), 1); else delete parent[last];
  }
  function uniqueKey(obj) {
    let n = 1; let k = t('dw.newKey');
    while (Object.prototype.hasOwnProperty.call(obj, k)) { n++; k = t('dw.newKey') + n; }
    return k;
  }

  function coerce(str) {
    const s = str.trim();
    if (s === '') return '';
    if (s === 'true') return true;
    if (s === 'false') return false;
    if (s === 'null') return null;
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(s)) return Number(s);
    if ((s[0] === '"' && s[s.length - 1] === '"') || (s[0] === "'" && s[s.length - 1] === "'")) {
      try { return JSON.parse(s[0] === '"' ? s : '"' + s.slice(1, -1).replace(/"/g, '\\"') + '"'); } catch { return str; }
    }
    return str;
  }
  const displayVal = (v) => (typeof v === 'string' ? v : v === null ? 'null' : String(v));

  function findError(s) {
    let i = 0; const n = s.length;
    const ws = () => { while (i < n && /\s/.test(s[i])) i++; };
    const fail = () => { throw i; };
    const isD = (c) => c >= '0' && c <= '9';
    function str() { if (s[i] !== '"') fail(); i++; while (i < n) { const c = s[i]; if (c === '\\') { i += 2; continue; } if (c === '"') { i++; return; } if (c === '\n') fail(); i++; } fail(); }
    function num() { if (s[i] === '-') i++; if (!isD(s[i])) fail(); while (i < n && isD(s[i])) i++; if (s[i] === '.') { i++; if (!isD(s[i])) fail(); while (i < n && isD(s[i])) i++; } if (s[i] === 'e' || s[i] === 'E') { i++; if (s[i] === '+' || s[i] === '-') i++; if (!isD(s[i])) fail(); while (i < n && isD(s[i])) i++; } }
    function val() {
      ws(); const c = s[i];
      if (c === '"') return str();
      if (c === '{') { i++; ws(); if (s[i] === '}') { i++; return; } for (;;) { ws(); if (s[i] !== '"') fail(); str(); ws(); if (s[i] !== ':') fail(); i++; val(); ws(); if (s[i] === ',') { i++; continue; } if (s[i] === '}') { i++; return; } fail(); } }
      if (c === '[') { i++; ws(); if (s[i] === ']') { i++; return; } for (;;) { val(); ws(); if (s[i] === ',') { i++; continue; } if (s[i] === ']') { i++; return; } fail(); } }
      if (c === 't') { if (s.startsWith('true', i)) { i += 4; return; } fail(); }
      if (c === 'f') { if (s.startsWith('false', i)) { i += 5; return; } fail(); }
      if (c === 'n') { if (s.startsWith('null', i)) { i += 4; return; } fail(); }
      if (c === '-' || isD(c)) return num();
      fail();
    }
    try { val(); ws(); if (i !== n) fail(); return -1; } catch (e) { return typeof e === 'number' ? e : -1; }
  }
  function errPos(msg, src) {
    const m = /position (\d+)/i.exec(msg);
    let idx = m ? +m[1] : findError(src);
    if (idx < 0) return null;
    idx = Math.min(idx, src.length);
    const upto = src.slice(0, idx);
    return { line: upto.split('\n').length, col: idx - upto.lastIndexOf('\n') };
  }

  function highlight(src) {
    const re = /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;
    let out = '', last = 0, m;
    while ((m = re.exec(src))) {
      out += esc(src.slice(last, m.index));
      const tok = m[0];
      let cls = 'num';
      if (tok[0] === '"') cls = /:$/.test(tok) ? 'key' : 'str';
      else if (/^(?:true|false|null)$/.test(tok)) cls = 'lit';
      out += '<span class="dw-t-' + cls + '">' + esc(tok) + '</span>';
      last = m.index + tok.length;
    }
    return out + esc(src.slice(last));
  }

  function stats(v) {
    let keys = 0, nodes = 0, depth = 0;
    const walk = (x, d) => {
      nodes++; if (d > depth) depth = d;
      if (Array.isArray(x)) x.forEach((y) => walk(y, d + 1));
      else if (x && typeof x === 'object') { const ks = Object.keys(x); keys += ks.length; ks.forEach((k) => walk(x[k], d + 1)); }
    };
    walk(v, 1);
    return { keys, nodes, depth };
  }

  // ---- rendering ----
  function pathKey(path) { return JSON.stringify(path); }

  function makeLeaf(value, path, depth) {
    const row = document.createElement('div');
    row.className = 'dw-row dw-leaf';
    row.style.paddingLeft = (depth * 14) + 'px';

    const key = document.createElement('span');
    key.className = 'dw-key';
    key.textContent = path.length ? String(path[path.length - 1]) : t('dw.unnamed');
    const colon = document.createElement('span'); colon.className = 'dw-colon'; colon.textContent = ':';

    const input = document.createElement('input');
    input.className = 'dw-input mono';
    input.value = displayVal(value);
    input.setAttribute('aria-label', key.textContent);
    input.addEventListener('focus', () => showPath(path));
    input.addEventListener('change', () => { setAt(path, coerce(input.value)); commit(); });

    const badge = document.createElement('span');
    badge.className = 'dw-badge'; badge.textContent = typeOf(value);

    row.append(key, colon, input, badge);
    if (path.length) row.append(delBtn(path));
    return row;
  }

  function delBtn(path) {
    const b = document.createElement('button');
    b.className = 'dw-x'; b.type = 'button'; b.title = t('dw.del');
    b.innerHTML = VT.icons.x;
    b.addEventListener('click', () => { deleteAt(path); commit(); toast(t('dw.deleted'), 'info'); });
    return b;
  }

  function addBtn(path, isArray) {
    const b = document.createElement('button');
    b.className = 'dw-add'; b.type = 'button';
    b.textContent = isArray ? t('dw.addItem') : t('dw.addKey');
    b.addEventListener('click', () => {
      const node = isArray ? doc && path.reduce((a, k) => a[k], doc) : doc && path.reduce((a, k) => a[k], doc);
      if (isArray) { node.push(''); } else { node[uniqueKey(node)] = ''; }
      collapsed.delete(pathKey(path));
      commit();
    });
    return b;
  }

  function makeBranch(value, path, depth, vis) {
    const isArray = Array.isArray(value);
    const wrap = document.createElement('div'); wrap.className = 'dw-branch';

    const head = document.createElement('div');
    head.className = 'dw-row dw-head';
    head.style.paddingLeft = (depth * 14) + 'px';

    const caret = document.createElement('button');
    caret.className = 'dw-caret'; caret.type = 'button';
    const isOpen = vis ? true : !collapsed.has(pathKey(path));
    caret.textContent = isOpen ? '▾' : '▸';

    const key = document.createElement('span');
    key.className = 'dw-key';
    key.textContent = path.length ? String(path[path.length - 1]) : t('dw.unnamed');

    const open = document.createElement('span'); open.className = 'dw-brace'; open.textContent = isArray ? '[' : '{';
    const count = document.createElement('span'); count.className = 'dw-count';
    count.textContent = String(isArray ? value.length : Object.keys(value).length);
    const close = document.createElement('span'); close.className = 'dw-brace'; close.textContent = isArray ? ']' : '}';

    caret.addEventListener('click', () => {
      const k = pathKey(path);
      if (collapsed.has(k)) collapsed.delete(k); else collapsed.add(k);
      renderTree();
    });

    head.append(caret, key, open, count, close, addBtn(path, isArray));
    if (path.length) head.append(delBtn(path));
    wrap.append(head);

    if (isOpen) {
      const kids = document.createElement('div'); kids.className = 'dw-kids';
      const append = (child, p) => { const n = nodeRow(child, p, depth + 1, vis); if (n) kids.append(n); };
      const entries = isArray ? value.map((child, i) => [child, path.concat(i)]) : Object.keys(value).map((k) => [value[k], path.concat(k)]);
      const limit = vis ? entries.length : (slices.get(pathKey(path)) || SLICE);
      entries.slice(0, limit).forEach(([child, p]) => append(child, p));
      if (entries.length > limit) {
        const more = document.createElement('button');
        more.type = 'button'; more.className = 'dw-more';
        more.style.paddingLeft = ((depth + 1) * 14) + 'px';
        more.textContent = t('dw.showMore', { n: entries.length - limit });
        more.addEventListener('click', () => { slices.set(pathKey(path), limit + SLICE); renderTree(); });
        kids.append(more);
      }
      if (!kids.children.length) { const e = document.createElement('div'); e.className = 'bench-empty dw-empty'; e.style.paddingLeft = ((depth + 1) * 14) + 'px'; e.textContent = isArray ? '[]' : '{}'; kids.append(e); }
      wrap.append(kids);
    }
    return wrap;
  }

  function nodeRow(value, path, depth, vis) {
    if (vis && !vis.has(pathKey(path))) return null;
    if (value && typeof value === 'object') return makeBranch(value, path, depth, vis);
    return makeLeaf(value, path, depth);
  }

  function markVisible(value, path, set) {
    const q = query;
    const keyMatch = String(path.length ? path[path.length - 1] : '').toLowerCase().includes(q);
    let childVisible = false;
    if (value && typeof value === 'object') {
      const entries = Array.isArray(value) ? value.map((v, i) => [i, v]) : Object.keys(value).map((k) => [k, value[k]]);
      for (const [k, v] of entries) if (markVisible(v, path.concat(k), set)) childVisible = true;
    }
    const valMatch = !(value && typeof value === 'object') && displayVal(value).toLowerCase().includes(q);
    const visible = keyMatch || valMatch || childVisible;
    if (visible) set.add(pathKey(path));
    return visible;
  }

  function renderTree() {
    refs.tree.innerHTML = '';
    if (doc === undefined) return;
    let vis = null;
    if (query) { vis = new Set(); markVisible(doc, [], vis); }
    const n = nodeRow(doc, [], 0, vis);
    if (n) refs.tree.append(n);
  }

  function showPath(path) {
    refs.path.textContent = pathStr(path);
  }

  function renderOutput() {
    if (doc === undefined) { lastText = ''; refs.out.innerHTML = '<p class="hint">' + esc(t('dw.empty')) + '</p>'; refs.stats.hidden = true; return; }
    const view = state.sort ? sortDeep(clone(doc)) : doc;
    lastText = state.mode === 'min' ? JSON.stringify(view) : JSON.stringify(view, null, indentStr());
    refs.out.innerHTML = highlight(lastText);
    const st = stats(view);
    refs.stats.hidden = false;
    refs.stats.innerHTML =
      '<div><dt>' + t('dw.m.keys') + '</dt><dd>' + st.keys + '</dd></div>' +
      '<div><dt>' + t('dw.m.nodes') + '</dt><dd>' + st.nodes + '</dd></div>' +
      '<div><dt>' + t('dw.m.depth') + '</dt><dd>' + st.depth + '</dd></div>' +
      '<div><dt>' + t('dw.m.size') + '</dt><dd>' + U.formatBytes(new Blob([lastText]).size) + '</dd></div>';
  }

  const canonical = () => (doc === undefined ? '' : JSON.stringify(doc));

  function setStatus(kind, text) {
    refs.status.className = 'dw-status' + (kind ? ' ' + kind : '');
    refs.status.textContent = text;
  }

  function commit() {
    if (!alive) return;
    renderTree(); renderOutput();
    hist.record(canonical()); syncHist();
    if (autosave) autosave();
  }

  function syncHist() {
    if (refs.undo) refs.undo.disabled = !hist || !hist.canUndo();
    if (refs.redo) refs.redo.disabled = !hist || !hist.canRedo();
  }

  function applySource(text, opts) {
    opts = opts || {};
    if (!text.trim()) { doc = undefined; setStatus('', t('dw.empty')); commit(); return true; }
    try {
      doc = JSON.parse(text);
      setStatus('ok', t('dw.valid'));
      // auto-collapse deep/large docs
      const st = stats(doc);
      if (st.nodes > 1500) { collapsed = new Set(collectPaths(doc, [])); if (!opts.silent) toast(t('dw.big'), 'info'); }
      commit();
      if (!opts.silent) toast(t('dw.applied'), 'success');
      return true;
    } catch (e) {
      const pos = errPos(e.message, text);
      setStatus('bad', t('dw.invalid') + (pos ? ` (${t('dw.line')} ${pos.line}, ${t('dw.col')} ${pos.col})` : ''));
      return false;
    }
  }
  function collectPaths(v, path) {
    const set = new Set();
    const walk = (x, p) => {
      if (x && typeof x === 'object' && p.length) { set.add(pathKey(p)); }
      if (Array.isArray(x)) x.forEach((y, i) => walk(y, p.concat(i)));
      else if (x && typeof x === 'object') Object.keys(x).forEach((k) => walk(x[k], p.concat(k)));
    };
    walk(v, path);
    return set;
  }

  function pathStr(path) {
    let s = '$';
    for (const p of path) s += (typeof p === 'number' ? '[' + p + ']' : '.' + p);
    return s;
  }

  // ---- CSV ----
  function parseCSV(text, delim) {
    const rows = [];
    let field = '', row = [], inQ = false, started = false;
    const endField = () => { row.push(field); field = ''; started = true; };
    const endRow = () => { endField(); rows.push(row); row = []; started = false; };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') { inQ = true; started = true; }
      else if (c === delim) endField();
      else if (c === '\n') endRow();
      else if (c === '\r') { /* ignore; \r\n handled by \n */ }
      else { field += c; started = true; }
    }
    if (started || field !== '' || row.length) endRow();
    if (inQ) return { rows, error: t('dw.csvUnterminated') };
    return { rows, error: '' };
  }

  function csvToObjects(text, delim, hasHeader) {
    const { rows, error } = parseCSV(text, delim);
    const data = rows.filter((r) => !(r.length === 1 && r[0] === ''));
    const problems = [];
    if (error) problems.push(error);
    if (!data.length) return { out: [], problems: hasHeader ? problems : [t('dw.csvEmpty')] };
    const headers = hasHeader ? data[0].map((h, i) => (h.trim() || ('col' + (i + 1)))) : data[0].map((_, i) => 'col' + (i + 1));
    const body = hasHeader ? data.slice(1) : data;
    const objs = body.map((r, ri) => {
      if (r.length !== headers.length) problems.push(t('dw.csvRowIssue', { n: hasHeader ? ri + 2 : ri + 1, got: r.length, want: headers.length }));
      const o = {};
      headers.forEach((h, ci) => { o[h] = coerce(r[ci] === undefined ? '' : r[ci]); });
      return o;
    });
    return { out: objs, problems };
  }

  function csvCell(v, delim) {
    const s = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (s.includes('"') || s.includes(delim) || s.includes('\n') || s.includes('\r')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function objectsToCSV(value, delim) {
    let rows;
    if (Array.isArray(value)) {
      if (!value.length) return '';
      if (value.every((x) => x === null || typeof x !== 'object')) {
        rows = [['value'], ...value.map((v) => [v])];
      } else {
        const keys = [];
        value.forEach((o) => { if (o && typeof o === 'object') Object.keys(o).forEach((k) => { if (!keys.includes(k)) keys.push(k); }); });
        rows = [keys, ...value.map((o) => keys.map((k) => (o && typeof o === 'object' ? o[k] : '')))];
      }
    } else if (value && typeof value === 'object') {
      const keys = Object.keys(value);
      rows = [keys, keys.map((k) => value[k])];
    } else {
      rows = [['value'], [value]];
    }
    return rows.map((r) => r.map((c) => csvCell(c, delim)).join(delim)).join('\r\n');
  }

  // ---- structural diff ----
  function flatten(v, path, out) {
    if (v && typeof v === 'object') {
      const entries = Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.keys(v).map((k) => [k, v[k]]);
      if (!entries.length) out.set(pathStr(path), v);
      for (const [k, val] of entries) flatten(val, path.concat(k), out);
    } else out.set(pathStr(path), v);
    return out;
  }

  function diffDocs(a, b) {
    const fa = flatten(a, [], new Map()), fb = flatten(b, [], new Map());
    const added = [], removed = [], changed = [];
    for (const [p, v] of fb) if (!fa.has(p)) added.push({ p, v });
    for (const [p, v] of fa) {
      if (!fb.has(p)) removed.push({ p, v });
      else if (JSON.stringify(fa.get(p)) !== JSON.stringify(fb.get(p))) changed.push({ p, from: fa.get(p), to: fb.get(p) });
    }
    return { added, removed, changed, same: fa.size + fb.size - added.length - removed.length - changed.length * 2 > 0 };
  }

  // ---- minimal JSON Schema validator (subset) ----
  function typeMatches(v, type) {
    const types = Array.isArray(type) ? type : [type];
    return types.some((tp) => {
      if (tp === 'null') return v === null;
      if (tp === 'array') return Array.isArray(v);
      if (tp === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v);
      if (tp === 'integer') return typeof v === 'number' && Number.isInteger(v);
      if (tp === 'number') return typeof v === 'number';
      if (tp === 'string') return typeof v === 'string';
      if (tp === 'boolean') return typeof v === 'boolean';
      return true;
    });
  }

  function validateSchema(value, schema, path, errs) {
    if (schema === true || schema == null) return;
    if (schema === false) { errs.push({ p: pathStr(path), m: t('dw.schFalse') }); return; }
    if (typeof schema !== 'object') return;
    if (schema.type && !typeMatches(value, schema.type)) { errs.push({ p: pathStr(path), m: t('dw.schType', { want: schema.type, got: typeOf(value) }) }); return; }
    if (Array.isArray(schema.enum) && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) errs.push({ p: pathStr(path), m: t('dw.schEnum', { want: JSON.stringify(schema.enum) }) });
    if (Array.isArray(schema.required) && value && typeof value === 'object') {
      for (const k of schema.required) if (!(k in value)) errs.push({ p: pathStr(path.concat(k)), m: t('dw.schReq', { k }) });
    }
    if (schema.properties && value && typeof value === 'object') {
      for (const k of Object.keys(schema.properties)) if (k in value) validateSchema(value[k], schema.properties[k], path.concat(k), errs);
    }
    if (schema.items && Array.isArray(value)) {
      if (Array.isArray(schema.items)) value.forEach((x, i) => validateSchema(x, schema.items[i] === undefined ? true : schema.items[i], path.concat(i), errs));
      else value.forEach((x, i) => validateSchema(x, schema.items, path.concat(i), errs));
    }
  }

  const SCHEMA_SAMPLE = {
    type: 'object',
    required: ['project', 'tools'],
    properties: {
      project: { type: 'string' },
      active: { type: 'boolean' },
      tools: { type: 'integer' },
      ratio: { type: 'number' },
      owner: { type: ['string', 'null'] },
      categories: { type: 'array', items: { type: 'string' } },
      author: { type: 'object', properties: { name: { type: 'string' }, site: { type: 'string' } } }
    }
  };

  const SAMPLE = {
    project: 'Vistanology', active: true, tools: 20, ratio: 0.65, owner: null,
    categories: ['creative', 'generators', 'media', 'developer'],
    author: { name: 'Nuwget', site: 'https://example.invalid' },
    nested: { a: [1, 2, { b: null, c: 'x' }] }
  };

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    doc = clone(SAMPLE);
    collapsed = new Set();

    root.innerHTML = `
      <div class="dw-stage glass-2">
        <div class="dw-modes tabs" role="tablist" aria-label="${t('dw.modes')}">
          <button class="tab" data-tab="editor" role="tab" aria-selected="true">${t('dw.tabEditor')}</button>
          <button class="tab" data-tab="csv" role="tab" aria-selected="false">${t('dw.tabCsv')}</button>
          <button class="tab" data-tab="compare" role="tab" aria-selected="false">${t('dw.tabCompare')}</button>
          <button class="tab" data-tab="schema" role="tab" aria-selected="false">${t('dw.tabSchema')}</button>
          <button class="tab" data-tab="projects" role="tab" aria-selected="false">${t('dw.tabProjects')}</button>
        </div>

        <div class="dw-panel" data-panel="editor">
        <div class="dw-bar bench">
          <span class="bench-rail-group">
          <button class="btn btn-ghost btn-sm" id="dw-sample">${I.sparkle} ${t('dw.sample')}</button>
          <button class="btn btn-ghost btn-sm" id="dw-import">${I.upload} ${t('dw.import')}</button>
          <input type="file" id="dw-file" accept="application/json,.json" hidden>
          </span><span class="bench-sep" aria-hidden="true"></span>
          <span class="bench-rail-group">
          <button class="btn btn-ghost btn-sm" id="dw-collapse">${t('dw.collapse')}</button>
          <button class="btn btn-ghost btn-sm" id="dw-expand">${t('dw.expand')}</button>
          </span><span class="bench-sep" aria-hidden="true"></span>
          <span class="bench-rail-group">
          <button class="btn btn-ghost btn-sm" id="dw-undo" data-tip="${t('hist.undo.tip')}" aria-keyshortcuts="Control+Z">${I.undo} ${t('hist.undo')}</button>
          <button class="btn btn-ghost btn-sm" id="dw-redo" data-tip="${t('hist.redo.tip')}" aria-keyshortcuts="Control+Shift+Z">${I.redo} ${t('hist.redo')}</button>
          </span>
          <span class="dw-bar-end">
          <span class="dw-indent"><label for="dw-indent">${t('dw.indent')}</label>
            <select class="input" id="dw-indent"><option value="2">2</option><option value="4">4</option><option value="tab">tab</option></select></span>
          <span class="dw-status" id="dw-status"></span>
          </span>
        </div>
        <div class="dw-source">
          <div class="dw-source-head"><span class="bench-sec-head">${t('dw.source')}</span>
            <button class="btn btn-ghost btn-sm" id="dw-apply">${I.arrowRight} ${t('dw.apply')}</button></div>
          <textarea class="dw-source-ta mono" id="dw-src" spellcheck="false" placeholder="${t('dw.sourcePh')}"></textarea>
        </div>
        <div class="dw-panes">
          <div class="dw-pane dw-pane-tree">
            <div class="dw-pane-head"><span class="bench-sec-head">${t('dw.tree')}</span>
              <input class="input dw-search" id="dw-search" type="search" placeholder="${t('dw.searchPh')}" aria-label="${t('dw.searchPh')}">
              <code class="dw-path" id="dw-path">$</code></div>
            <div class="dw-tree" id="dw-tree"></div>
          </div>
          <div class="dw-pane dw-pane-json">
            <div class="dw-pane-head"><span class="bench-sec-head">${t('dw.json')}</span>
              <span class="bench-seg" role="group" aria-label="${t('dw.format')}">
                <button class="btn btn-ghost btn-sm" id="dw-mode-pretty" aria-pressed="true">${t('dw.pretty')}</button>
                <button class="btn btn-ghost btn-sm" id="dw-mode-min" aria-pressed="false">${t('dw.minified')}</button>
              </span>
              <label class="dw-sort"><input type="checkbox" id="dw-sort"> ${t('dw.sort')}</label>
              <span class="dw-pane-actions">
                <button class="btn btn-ghost btn-sm" id="dw-copy">${I.copy} ${t('dw.copy')}</button>
                <button class="btn btn-ghost btn-sm" id="dw-export">${I.download} ${t('dw.export')}</button>
              </span></div>
            <pre class="dw-out" id="dw-out" aria-live="polite"></pre>
            <dl class="dw-stats" id="dw-stats" hidden></dl>
          </div>
        </div>
        </div>

        <div class="dw-panel" data-panel="csv" hidden>
          <div class="dw-csv-grid">
            <section class="dw-csv-col">
              <div class="dw-pane-head"><span class="bench-sec-head">${t('dw.csvIn')}</span>
                <span class="dw-pane-actions">
                  <button class="btn btn-ghost btn-sm" id="dw-csv-load">${I.upload} ${t('dw.csvLoad')}</button>
                  <input type="file" id="dw-csv-file" accept="text/csv,.csv" hidden>
                </span></div>
              <textarea class="dw-source-ta mono" id="dw-csv-ta" spellcheck="false" placeholder="${t('dw.csvPh')}"></textarea>
              <div class="dw-csv-opts">
                <label class="dw-sort"><input type="checkbox" id="dw-csv-header" checked> ${t('dw.csvHeader')}</label>
                <label class="dw-csv-delim"><span>${t('dw.csvDelim')}</span>
                  <select class="input" id="dw-csv-delim"><option value=",">,</option><option value=";">;</option><option value="\t">tab</option></select></label>
                <button class="btn btn-primary btn-sm" id="dw-csv-tojson">${I.arrowRight} ${t('dw.csvTo')}</button>
              </div>
            </section>
            <section class="dw-csv-col">
              <div class="dw-pane-head"><span class="bench-sec-head">${t('dw.csvOut')}</span>
                <span class="dw-pane-actions">
                  <button class="btn btn-ghost btn-sm" id="dw-json-tocsv">${t('dw.csvBack')}</button>
                  <button class="btn btn-ghost btn-sm" id="dw-csv-copy">${I.copy} ${t('dw.copy')}</button>
                  <button class="btn btn-ghost btn-sm" id="dw-csv-export">${I.download} ${t('dw.csvExport')}</button>
                </span></div>
              <pre class="dw-out" id="dw-csv-out" aria-live="polite"></pre>
              <div class="dw-csv-msg" id="dw-csv-msg"></div>
            </section>
          </div>
        </div>

        <div class="dw-panel" data-panel="compare" hidden>
          <div class="dw-cmp-bar">
            <span class="dw-cmp-a">${t('dw.cmpA')} <code class="dw-path">$</code></span>
            <textarea class="input dw-cmp-ta mono" id="dw-cmp-b" spellcheck="false" placeholder="${t('dw.cmpBPh')}"></textarea>
            <button class="btn btn-primary btn-sm" id="dw-cmp-run">${I.arrowRight} ${t('dw.cmpRun')}</button>
          </div>
          <div class="dw-cmp-legend">
            <span class="dw-diff add">${t('dw.cmpAdded')}: <b id="dw-cmp-nadd">0</b></span>
            <span class="dw-diff rem">${t('dw.cmpRemoved')}: <b id="dw-cmp-nrem">0</b></span>
            <span class="dw-diff chg">${t('dw.cmpChanged')}: <b id="dw-cmp-nchg">0</b></span>
            <span class="dw-cmp-same">${t('dw.cmpSame')}: <b id="dw-cmp-same">–</b></span>
          </div>
          <div class="dw-cmp-list" id="dw-cmp-list" aria-live="polite"></div>
        </div>

        <div class="dw-panel" data-panel="schema" hidden>
          <div class="dw-csv-grid">
            <section class="dw-csv-col">
              <div class="dw-pane-head"><span class="bench-sec-head">${t('dw.schemaIn')}</span>
                <span class="dw-pane-actions">
                  <button class="btn btn-ghost btn-sm" id="dw-schema-sample">${t('dw.schemaSample')}</button>
                </span></div>
              <textarea class="dw-source-ta mono" id="dw-schema-ta" spellcheck="false" placeholder="${t('dw.schemaPh')}"></textarea>
              <div class="dw-csv-opts">
                <button class="btn btn-primary btn-sm" id="dw-schema-run">${I.shield} ${t('dw.schemaRun')}</button>
                <span class="dw-schema-note">${t('dw.schemaNote')}</span>
              </div>
            </section>
            <section class="dw-csv-col">
              <div class="dw-pane-head"><span class="bench-sec-head">${t('dw.schemaResult')}</span></div>
              <div class="dw-schema-out" id="dw-schema-out" aria-live="polite"></div>
            </section>
          </div>
        </div>

        <div class="dw-panel" data-panel="projects" hidden>
          <div class="dw-proj-save">
            <input class="input" id="dw-proj-name" type="text" placeholder="${t('dw.projNamePh')}" aria-label="${t('dw.projNamePh')}">
            <button class="btn btn-primary btn-sm" id="dw-proj-save">${I.file} ${t('dw.projSave')}</button>
            <span class="dw-proj-hint" id="dw-proj-hint"></span>
          </div>
          <div class="dw-proj-grid">
            <section class="dw-proj-col">
              <div class="dw-pane-head"><span class="bench-sec-head">${t('dw.projList')}</span></div>
              <div class="bench-list dw-proj-list" id="dw-proj-list" aria-live="polite"></div>
            </section>
            <section class="dw-proj-col">
              <div class="dw-pane-head"><span class="bench-sec-head">${t('dw.projBackup')}</span></div>
              <p class="dw-proj-desc">${t('dw.projBackupDesc')}</p>
              <div class="dw-csv-opts">
                <button class="btn btn-ghost btn-sm" id="dw-proj-backup">${I.download} ${t('dw.projBackupBtn')}</button>
                <button class="btn btn-ghost btn-sm" id="dw-proj-restore">${I.upload} ${t('dw.projRestoreBtn')}</button>
                <input type="file" id="dw-proj-restore-file" accept="application/json,.json" hidden>
                <label class="dw-sort"><input type="checkbox" id="dw-proj-replace"> ${t('dw.projReplace')}</label>
              </div>
              <p class="dw-proj-desc">${t('dw.projNote')}</p>
            </section>
          </div>
        </div>

        <p class="privacy-line">${I.shield} ${t('dw.privacy')}</p>
      </div>`;

    refs = {
      tree: $('#dw-tree', root), out: $('#dw-out', root), stats: $('#dw-stats', root),
      status: $('#dw-status', root), path: $('#dw-path', root), src: $('#dw-src', root),
      undo: $('#dw-undo', root), redo: $('#dw-redo', root),
      search: $('#dw-search', root), modeP: $('#dw-mode-pretty', root), modeM: $('#dw-mode-min', root), sort: $('#dw-sort', root),
      csvTa: $('#dw-csv-ta', root), csvOut: $('#dw-csv-out', root), csvMsg: $('#dw-csv-msg', root),
      csvHeader: $('#dw-csv-header', root), csvDelim: $('#dw-csv-delim', root),
      cmpB: $('#dw-cmp-b', root), cmpList: $('#dw-cmp-list', root),
      schTa: $('#dw-schema-ta', root), schOut: $('#dw-schema-out', root),
      projName: $('#dw-proj-name', root), projHint: $('#dw-proj-hint', root), projList: $('#dw-proj-list', root)
    };

    function syncView() {
      const pretty = state.mode !== 'min';
      refs.modeP.setAttribute('aria-pressed', String(pretty));
      refs.modeM.setAttribute('aria-pressed', String(!pretty));
      refs.sort.checked = !!state.sort;
    }

    hist = VT.history.create({ apply: (val) => { doc = val ? JSON.parse(val) : undefined; renderTree(); renderOutput(); syncHist(); } });

    const ind = $('#dw-indent', root); ind.value = state.indent;
    ind.addEventListener('change', () => { state.indent = ind.value; persist(); renderOutput(); });

    refs.search.addEventListener('input', () => { query = refs.search.value.trim().toLowerCase(); renderTree(); });
    refs.modeP.addEventListener('click', () => { state.mode = 'pretty'; persist(); syncView(); renderOutput(); });
    refs.modeM.addEventListener('click', () => { state.mode = 'min'; persist(); syncView(); renderOutput(); });
    refs.sort.addEventListener('change', () => { state.sort = refs.sort.checked; persist(); renderOutput(); });

    $('#dw-sample', root).addEventListener('click', () => { refs.src.value = JSON.stringify(SAMPLE, null, indentStr()); applySource(refs.src.value); hist.record(canonical()); syncHist(); });
    $('#dw-apply', root).addEventListener('click', () => { applySource(refs.src.value); hist.record(canonical()); syncHist(); });
    $('#dw-collapse', root).addEventListener('click', () => { collapsed = new Set(collectPaths(doc, [])); renderTree(); });
    $('#dw-expand', root).addEventListener('click', () => { collapsed = new Set(); renderTree(); });
    $('#dw-import', root).addEventListener('click', () => $('#dw-file', root).click());
    $('#dw-file', root).addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { refs.src.value = String(rd.result || ''); if (applySource(refs.src.value, { silent: true })) { hist.record(canonical()); syncHist(); toast(t('dw.imported', { name: f.name }), 'success'); } else toast(t('dw.badImport'), 'error'); };
      rd.onerror = () => toast(t('dw.badImport'), 'error');
      rd.readAsText(f);
      e.target.value = '';
    });
    $('#dw-copy', root).addEventListener('click', async () => {
      if (!lastText) return;
      const ok = await U.copyText(lastText);
      toast(ok ? t('dw.copied') : t('dw.copyFail'), ok ? 'success' : 'error');
    });
    $('#dw-export', root).addEventListener('click', () => {
      if (!lastText) return;
      U.downloadText(lastText, 'vistanology-data.json', 'application/json');
      toast(t('dw.exported'), 'success');
    });
    $('#dw-undo', root).addEventListener('click', () => { hist.undo(); syncHist(); });
    $('#dw-redo', root).addEventListener('click', () => { hist.redo(); syncHist(); });
    root.addEventListener('keydown', (e) => { if (e.target === refs.src) return; hist.onKey(e); syncHist(); });

    // ---- CSV tab ----
    let csvCache = '';
    function renderCsvOut() {
      const delim = refs.csvDelim.value === '\\t' ? '\t' : refs.csvDelim.value;
      if (doc === undefined) { refs.csvOut.textContent = ''; refs.csvMsg.innerHTML = ''; return; }
      csvCache = objectsToCSV(doc, delim);
      refs.csvOut.textContent = csvCache;
    }
    $('#dw-json-tocsv', root).addEventListener('click', renderCsvOut);
    refs.csvDelim.addEventListener('change', renderCsvOut);
    $('#dw-csv-tojson', root).addEventListener('click', () => {
      const delim = refs.csvDelim.value === '\\t' ? '\t' : refs.csvDelim.value;
      const { out, problems } = csvToObjects(refs.csvTa.value, delim, refs.csvHeader.checked);
      doc = out;
      refs.src.value = JSON.stringify(doc, null, indentStr());
      setStatus('ok', t('dw.valid'));
      commit(); hist.record(canonical()); syncHist();
      refs.csvMsg.innerHTML = problems.length
        ? '<span class="dw-warn">' + esc(t('dw.csvWarn')) + '</span>' + problems.map((p) => '<div class="dw-csv-prob">' + esc(p) + '</div>').join('')
        : '<span class="dw-ok">' + esc(t('dw.csvOk', { n: out.length })) + '</span>';
      renderCsvOut();
      toast(t('dw.csvToDone', { n: out.length }), problems.length ? 'info' : 'success');
    });
    $('#dw-csv-load', root).addEventListener('click', () => $('#dw-csv-file', root).click());
    $('#dw-csv-file', root).addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => { refs.csvTa.value = String(rd.result || ''); toast(t('dw.csvLoaded', { name: f.name }), 'success'); };
      rd.onerror = () => toast(t('dw.badImport'), 'error');
      rd.readAsText(f); e.target.value = '';
    });
    $('#dw-csv-copy', root).addEventListener('click', async () => {
      if (!csvCache) renderCsvOut();
      if (!csvCache) return;
      const ok = await U.copyText(csvCache);
      toast(ok ? t('dw.copied') : t('dw.copyFail'), ok ? 'success' : 'error');
    });
    $('#dw-csv-export', root).addEventListener('click', () => {
      if (!csvCache) renderCsvOut();
      if (!csvCache) return;
      U.downloadText(csvCache, 'vistanology-data.csv', 'text/csv');
      toast(t('dw.csvExported'), 'success');
    });

    // ---- Compare tab ----
    $('#dw-cmp-run', root).addEventListener('click', () => {
      let b;
      try { b = refs.cmpB.value.trim() ? JSON.parse(refs.cmpB.value) : undefined; }
      catch (e) { refs.cmpList.innerHTML = '<div class="dw-cmp-err">' + esc(t('dw.cmpBadB')) + '</div>'; return; }
      if (doc === undefined) { refs.cmpList.innerHTML = '<div class="dw-cmp-err">' + esc(t('dw.cmpNoA')) + '</div>'; return; }
      const d = diffDocs(doc, b);
      $('#dw-cmp-nadd', root).textContent = d.added.length;
      $('#dw-cmp-nrem', root).textContent = d.removed.length;
      $('#dw-cmp-nchg', root).textContent = d.changed.length;
      const clean = !d.added.length && !d.removed.length && !d.changed.length;
      $('#dw-cmp-same', root).textContent = clean ? t('dw.cmpEqual') : '–';
      const row = (cls, p, a, bt) => '<div class="dw-cmp-row ' + cls + '"><code>' + esc(p) + '</code>' +
        (a !== undefined ? '<span class="dw-cmp-old">' + esc(displayVal(a)) + '</span>' : '') +
        (bt !== undefined ? '<span class="dw-cmp-new">' + esc(displayVal(bt)) + '</span>' : '') + '</div>';
      let html = d.added.map((x) => row('add', x.p, undefined, x.v)).join('') +
        d.removed.map((x) => row('rem', x.p, x.v, undefined)).join('') +
        d.changed.map((x) => row('chg', x.p, x.from, x.to)).join('');
      refs.cmpList.innerHTML = clean ? '<div class="dw-cmp-eq">' + esc(t('dw.cmpEqualMsg')) + '</div>' : html;
    });

    // ---- Schema tab ----
    $('#dw-schema-sample', root).addEventListener('click', () => { refs.schTa.value = JSON.stringify(SCHEMA_SAMPLE, null, indentStr()); });
    $('#dw-schema-run', root).addEventListener('click', () => {
      let schema;
      try { schema = JSON.parse(refs.schTa.value); }
      catch (e) { refs.schOut.innerHTML = '<div class="dw-cmp-err">' + esc(t('dw.schBadSchema')) + '</div>'; return; }
      if (doc === undefined) { refs.schOut.innerHTML = '<div class="dw-cmp-err">' + esc(t('dw.cmpNoA')) + '</div>'; return; }
      const errs = [];
      validateSchema(doc, schema, [], errs);
      if (!errs.length) { refs.schOut.innerHTML = '<div class="dw-sch-pass">' + I.shield + ' ' + esc(t('dw.schPass')) + '</div>'; return; }
      refs.schOut.innerHTML = '<div class="dw-sch-head">' + esc(t('dw.schFail', { n: errs.length })) + '</div>' +
        errs.map((x) => '<div class="dw-sch-row"><code>' + esc(x.p) + '</code><span>' + esc(x.m) + '</span></div>').join('');
    });

    // ---- Projects tab (VT.db persistence + backup/restore) ----
    autosave = U.debounce(() => {
      if (!alive || !VT.db.available) return;
      VT.db.put({ id: AUTOSAVE_ID, tool: 'data-workspace', name: '(autosave)', data: doc === undefined ? null : doc }).catch(() => {});
    }, 700);

    function applyDoc(value) {
      doc = value;
      refs.src.value = doc === undefined ? '' : JSON.stringify(doc, null, indentStr());
      setStatus('ok', doc === undefined ? t('dw.empty') : t('dw.valid'));
      renderTree(); renderOutput();
      hist.reset(canonical()); syncHist();
    }

    function fmtDate(ms) {
      try { return new Date(ms).toLocaleString(VT.i18n.lang === 'pt' ? 'pt-BR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }); }
      catch (e) { return new Date(ms).toISOString(); }
    }

    async function loadProjects() {
      if (!VT.db.available) { refs.projList.innerHTML = '<div class="dw-cmp-err">' + esc(t('dw.dbUnavailable')) + '</div>'; return; }
      let rows = [];
      try { rows = await VT.db.list('data-workspace'); } catch (e) { refs.projList.innerHTML = '<div class="dw-cmp-err">' + esc(t('dw.dbError')) + '</div>'; return; }
      rows = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.projList.innerHTML = '<div class="dw-proj-empty">' + esc(t('dw.projEmpty')) + '</div>'; return; }
      refs.projList.innerHTML = '';
      rows.forEach((r) => {
        const el = document.createElement('div'); el.className = 'bench-row dw-proj-row';
        const info = document.createElement('div'); info.className = 'dw-proj-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('dw.projUntitled');
        const meta = document.createElement('span');
        const size = r.data === null || r.data === undefined ? 0 : new Blob([JSON.stringify(r.data)]).size;
        meta.textContent = fmtDate(r.updatedAt) + ' · ' + U.formatBytes(size);
        info.append(nm, meta);
        const actions = document.createElement('span'); actions.className = 'dw-proj-actions';
        const load = document.createElement('button'); load.type = 'button'; load.className = 'btn btn-ghost btn-sm'; load.textContent = t('dw.projLoad');
        load.addEventListener('click', () => { applyDoc(r.data); currentId = r.id; currentName = r.name || ''; refs.projName.value = r.name || ''; refs.projHint.textContent = t('dw.projLoaded', { name: r.name || t('dw.projUntitled') }); toast(t('dw.projLoadedToast', { name: r.name || t('dw.projUntitled') }), 'success'); });
        const del = document.createElement('button'); del.type = 'button'; del.className = 'btn btn-ghost btn-sm dw-proj-del'; del.textContent = t('dw.projDelete');
        del.addEventListener('click', async () => {
          const yes = await VT.ui.confirm({ title: t('dw.projDelete'), body: t('dw.projDeleteQ', { name: r.name || t('dw.projUntitled') }), confirmLabel: t('dw.projDelete'), danger: true });
          if (!yes) return;
          try { await VT.db.remove(r.id); if (currentId === r.id) currentId = null; toast(t('dw.projDeleted'), 'success'); loadProjects(); }
          catch (e) { toast(t('dw.dbError'), 'error'); }
        });
        actions.append(load, del);
        el.append(info, actions);
        refs.projList.append(el);
      });
    }

    $('#dw-proj-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('dw.dbUnavailable'), 'error'); return; }
      if (doc === undefined) { toast(t('dw.projNothing'), 'error'); return; }
      const name = refs.projName.value.trim() || t('dw.projUntitled');
      refs.projName.value = name;
      const reuse = currentId && name === currentName ? currentId : undefined;
      try {
        const rec = await VT.db.put({ id: reuse, tool: 'data-workspace', name, data: doc });
        currentId = rec.id; currentName = name;
        refs.projHint.textContent = t('dw.projSaved', { name });
        toast(t('dw.projSavedToast', { name }), 'success');
        loadProjects();
      } catch (e) { toast(t('dw.dbError'), 'error'); }
    });

    $('#dw-proj-backup', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('dw.dbUnavailable'), 'error'); return; }
      try {
        const payload = await VT.db.exportAll();
        U.downloadText(JSON.stringify(payload, null, 2), 'vistanology-projects-backup.json', 'application/json');
        toast(t('dw.projBackupDone', { n: payload.projects.length }), 'success');
      } catch (e) { toast(t('dw.dbError'), 'error'); }
    });

    $('#dw-proj-restore', root).addEventListener('click', () => $('#dw-proj-restore-file', root).click());
    $('#dw-proj-restore-file', root).addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = async () => {
        let payload;
        try { payload = JSON.parse(String(rd.result || '')); }
        catch (err) { toast(t('dw.projBadBackup'), 'error'); return; }
        const mode = $('#dw-proj-replace', root).checked ? 'replace' : 'merge';
        try {
          const res = await VT.db.importAll(payload, mode);
          toast(t('dw.projRestored', { imported: res.imported, skipped: res.skipped }), 'success');
          loadProjects();
        } catch (err) { toast(t('dw.projBadBackup'), 'error'); }
      };
      rd.onerror = () => toast(t('dw.projBadBackup'), 'error');
      rd.readAsText(f); e.target.value = '';
    });

    VT.ui.tabs(root, (id) => { if (id === 'csv') renderCsvOut(); if (id === 'projects') loadProjects(); });

    refs.src.value = JSON.stringify(doc, null, indentStr());
    setStatus('ok', t('dw.valid'));
    query = ''; syncView();
    renderTree(); renderOutput();
    hist.reset(canonical());
    syncHist();

    // Restore last autosave (survives reload/navigation) without clobbering the fresh sample until it arrives.
    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then((rec) => {
        if (!alive || !rec || rec.tool !== 'data-workspace' || rec.data === null || rec.data === undefined) return;
        applyDoc(rec.data);
        refs.projHint.textContent = t('dw.projRestoredHint');
      }).catch(() => {});
    }

    return () => { alive = false; };
  }

  function unmount() { alive = false; hist = null; doc = undefined; lastText = ''; collapsed = new Set(); query = ''; slices = new Map(); currentId = null; currentName = ''; autosave = null; }

  VT.registry.add(def);
  return def;
})();
