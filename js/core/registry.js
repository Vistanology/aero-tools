window.VT = window.VT || {};

VT.cats = [
  { id: 'creative', num: '01', icon: 'sparkle' },
  { id: 'generators', num: '02', icon: 'wand' },
  { id: 'media', num: '03', icon: 'image' },
  { id: 'developer', num: '04', icon: 'code' },
  { id: 'productivity', num: '05', icon: 'target' },
  { id: 'documents', num: '06', icon: 'file' }
];

VT.registry = (() => {
  const list = [];
  function add(manifest) { list.push(manifest); }
  const get = (id) => list.find((m) => m.id === id) || null;
  const byCat = (cat) => list.filter((m) => m.cat === cat);
  const all = () => list.slice();
  function search(q) {
    const s = q.trim().toLowerCase();
    if (!s) return list.slice();
    return list.filter((m) => {
      const hay = [
        m.id, m.cat,
        m.name.en, m.name.pt, m.tagline.en, m.tagline.pt,
        ...(m.tags || [])
      ].join(' ').toLowerCase();
      return s.split(/\s+/).every((word) => hay.includes(word));
    });
  }
  return { add, get, byCat, all, search };
})();

VT.deps = [
  { name: 'qrcode-generator', version: '1.4.4', license: 'MIT', author: 'Kazuhiko Arase', used: { en: 'QR matrix generation (QR Studio)', pt: 'Geração da matriz QR (QR Studio)' } },
  { name: 'Instrument Serif', version: '—', license: 'OFL 1.1', author: 'Rodrigo Fuenzalida / Jordan Egstad', used: { en: 'Editorial display typeface (bundled)', pt: 'Tipografia display editorial (bundlada)' } },
  { name: 'Inter', version: '4.x', license: 'OFL 1.1', author: 'Rasmus Andersson', used: { en: 'Typeface available for tool content (bundled)', pt: 'Fonte disponível para conteúdo das ferramentas (local)' } }
];

VT.releases = [
  {
    version: '0.1.0', date: '2026-11-15',
    notes: {
      en: [
        'First public foundation: Cosmic Liquid Glass design system, Open Hub, Tool Library, Docs and Open pages.',
        'Bilingual interface (English / Portuguese) with persistent preference.',
        'QR Studio: seven content types, colors, center logo, PNG/SVG export.',
        'Color Studio: harmony palettes with locks, inspector, image extraction, WCAG contrast.'
      ],
      pt: [
        'Primeira fundação pública: design system Cosmic Liquid Glass, Open Hub, Biblioteca, Docs e página Open.',
        'Interface bilíngue (inglês / português) com preferência persistente.',
        'QR Studio: sete tipos de conteúdo, cores, logo central, exportação PNG/SVG.',
        'Color Studio: paletas com harmonias e travas, inspector, extração de imagem, contraste WCAG.'
      ]
    }
  },
  {
    version: '0.2.0', date: '2026-11-15',
    notes: {
      en: [
        'Gradient Lab, Font Preview and SVG Studio complete the Creative Studio.',
        'Password, UUID and Lorem Ipsum generators ship under Generators.',
        'Bilingual per-tool docs and screenshots for every shipped tool.'
      ],
      pt: [
        'Gradient Lab, Font Preview e SVG Studio completam o Estúdio Criativo.',
        'Geradores de senha, UUID e Lorem Ipsum chegam em Geradores.',
        'Docs por ferramenta (bilíngues) e screenshots para cada ferramenta entregue.'
      ]
    }
  },
  {
    version: '0.3.0', date: '2026-11-15',
    notes: {
      en: [
        'Media Lab complete: Image Compressor, Converter, Resizer and Metadata inspector.',
        'Developer Tools complete: JSON Formatter, Base64, URL Toolkit, Regex Tester, Timestamp, Text Diff, Hash Generator, Markdown Preview.',
        '20 tools shipped; F0 + F1 + F2 runtime regression clean (0 console errors).'
      ],
      pt: [
        'Media Lab completo: compressor, conversor, redimensionador e inspetor de metadados de imagem.',
        'Developer Tools completo: JSON Formatter, Base64, URL Toolkit, Regex Tester, Timestamp, Text Diff, Hash Generator, Markdown Preview.',
        '20 ferramentas entregues; regressão runtime F0 + F1 + F2 limpa (0 erros de console).'
      ]
    }
  },
  {
    version: '0.4.0', date: '2026-11-15',
    notes: {
      en: [
        'U1 · Offline-first shell: Service Worker with app-shell precache, stale-while-revalidate and offline navigation fallback.',
        'Installable web manifest, local SVG icons, secure-context-only registration (file:// untouched), honest network badge.',
        'Validated in a real browser: offline reload with the server killed keeps the shell and tools working; zero cross-origin requests.'
      ],
      pt: [
        'U1 · Shell offline-first: Service Worker com precache do app shell, stale-while-revalidate e fallback de navegação offline.',
        'Manifest instalável, ícones SVG locais, registro apenas em contexto seguro (não afeta file://), indicador de rede honesto.',
        'Validado em navegador real: recarga offline com o servidor derrubado mantém shell e ferramentas funcionando; zero requisições cross-origin.'
      ]
    }
  },
  {
    version: '0.5.0', date: '2026-11-15',
    notes: {
      en: [
        'U2 · Project store: a local-first structured database (IndexedDB, versioned schema) that keeps your saved tool work on the device.',
        'Gradient Lab now saves named gradients (save, load, delete) that persist across reloads and keep working fully offline.',
        'Settings gained a Saved projects card: count, export all to a .json backup, import (with validation), and erase — and Reset local data now also clears projects.',
        'All verified in a real browser, including an offline cold boot that renders and loads a saved gradient with the server stopped.'
      ],
      pt: [
        'U2 · Repositório de projetos: um banco estruturado local-first (IndexedDB, schema versionado) que guarda seu trabalho salvo no dispositivo.',
        'Gradient Lab agora salva gradientes nomeados (salvar, carregar, excluir) que persistem entre recargas e funcionam totalmente offline.',
        'Configurações ganhou o card Projetos salvos: contagem, exportar tudo em backup .json, importar (com validação) e apagar — e Apagar dados locais agora também limpa os projetos.',
        'Tudo validado em navegador real, incluindo uma partida offline que renderiza e carrega um gradiente salvo com o servidor parado.'
      ]
    }
  },
  {
    version: '0.6.0', date: '2026-11-15',
    notes: {
      en: [
        'U3 · Command palette: press Ctrl+K (or ?) anywhere to fuzzy-search all 20 tools and run commands — navigate, switch language, toggle motion and glass styles.',
        'Fully keyboard-driven: arrows/Tab to move, Enter to run, Esc to close, focus returned to where you came from. Never hijacks typing inside inputs.',
        'Launcher button in the top bar; works online, offline and under file:// — verified in a real browser with the server stopped.'
      ],
      pt: [
        'U3 · Paleta de comandos: pressione Ctrl+K (ou ?) em qualquer lugar para buscar as 20 ferramentas com fuzzy e executar comandos — navegar, trocar idioma, alternar animações e estilo do vidro.',
        'Totalmente por teclado: setas/Tab para mover, Enter para abrir, Esc para fechar, com o foco devolvido ao ponto de origem. Nunca atrapalha a digitação dentro de campos.',
        'Botão lançador na barra superior; funciona online, offline e sob file:// — validado em navegador real com o servidor parado.'
      ]
    }
  },
  {
    version: '0.7.0', date: '2026-11-15',
    notes: {
      en: [
        'U4 · Web Worker image pipeline: Image Resizer now scales and encodes on a background thread, so the interface stays responsive during big resizes (measured main-thread long task: 121 ms → 73 ms).',
        'Byte-identical results: worker and main-thread encoders produce exactly the same PNG/JPEG bytes (SHA-256 verified), so nothing about the output changed.',
        'Automatic, invisible fallback: if a browser lacks Workers/OffscreenCanvas or the worker fails, the identical main-thread path runs instead. Verified online, offline with the server stopped, and under file://.',
        'Lazy loading was evaluated and rejected with evidence: the boot payload (≈399 KB of tool code, same-origin, cached by the Service Worker) did not justify the complexity. The next performance unit will measure first and act only where the data supports it.'
      ],
      pt: [
        'U4 · Pipeline de imagens em Web Worker: o Redimensionador de Imagens agora escala e codifica em uma thread de fundo, mantendo a interface responsiva em redimensionamentos grandes (long task na thread principal medido: 121 ms → 73 ms).',
        'Resultados byte-idênticos: o worker e a thread principal produzem exatamente os mesmos bytes PNG/JPEG (verificado por SHA-256) — nada mudou na saída.',
        'Fallback automático e invisível: se o navegador não tiver Workers/OffscreenCanvas ou o worker falhar, o caminho idêntico da thread principal assume. Validado online, offline com o servidor parado e sob file://.',
        'Carregamento sob demanda foi avaliado e rejeitado com evidência: o payload de boot (~399 KB de código de ferramentas, same-origin e já em cache pelo Service Worker) não justificava a complexidade. A próxima unidade de desempenho mede primeiro e só age onde os dados apoiam.'
      ]
    }
  },
  {
    version: '0.8.0', date: '2026-11-15',
    notes: {
      en: [
        'U5 · Undo/redo framework: `VT.history` — a small, memory-only snapshot controller with a bounded stack, coalesced typing steps and Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) handling that tools opt into.',
        'Markdown Preview (1.1.0) is the first integration: undo/redo buttons plus keyboard shortcuts now cover typing, the Sample button and Clear — history is never saved and resets when you leave the tool.',
        'Same local-first guarantee: history lives only in memory during the session; nothing is persisted or uploaded.'
      ],
      pt: [
        'U5 · Framework de desfazer/refazer: `VT.history` — um controlador de snapshots pequeno e só em memória, com pilha limitada, passos de digitação agrupados e tratamento de Ctrl+Z / Ctrl+Shift+Z (Ctrl+Y) que as ferramentas ativam quando querem.',
        'Prévia de Markdown (1.1.0) é a primeira integração: botões desfazer/refazer e atalhos de teclado agora cobrem digitação, o botão Exemplo e Limpar — o histórico nunca é salvo e reinicia ao sair da ferramenta.',
        'Mesma garantia local-first: o histórico fica só em memória durante a sessão; nada é persistido nem enviado.'
      ]
    }
  },
  {
    version: '0.9.0', date: '2026-11-15',
    notes: {
      en: [
        'U5b · Undo/redo reaches the other text editors: JSON Formatter (1.1.0) and SVG Studio (1.1.0) now use `VT.history`, covering typing, Sample/Clear, and — in SVG Studio — Optimize, Recolor and Load-file, so every source change is reversible.',
        'Undo replays the app’s real pipeline: in JSON Formatter a redo re-validates the output; in SVG Studio it re-sanitizes, re-parses and re-renders — so what you see always matches the restored source. History is memory-only and resets when you leave the tool (no leak between mounts).',
        'U4b · Worker adoption evaluated with evidence, not assumption: measured Image Compress and Converter against the Resizer’s worker path. The 1:1 image blit costs ~0 ms and the browser already encodes off the main thread, so neither produced a main-thread long task to remove — output was byte-identical (SHA-256) but there was no responsiveness gain. Metadata is pure EXIF byte parsing the canvas worker cannot offload. All three integrations were rejected with the measurements documented; only the Resizer (real per-pixel scaling) keeps the worker.'
      ],
      pt: [
        'U5b · O desfazer/refazer alcança os outros editores de texto: Formatador JSON (1.1.0) e SVG Studio (1.1.0) agora usam `VT.history`, cobrindo digitação, Exemplo/Limpar e — no SVG Studio — Otimizar, Recolorir e Carregar arquivo, para que toda mudança no código seja reversível.',
        'O desfazer reproduz o pipeline real da app: no Formatador JSON o refazer revalida a saída; no SVG Studio ele re-saneia, re-analisa e re-renderiza — assim o que você vê sempre corresponde ao código restaurado. O histórico é só em memória e reinicia ao sair da ferramenta (sem vazamento entre montagens).',
        'U4b · Adoção de worker avaliada com evidência, não suposição: Compress e Converter foram medidos contra o caminho de worker do Redimensionador. O blit 1:1 da imagem custa ~0 ms e o navegador já codifica fora da thread principal, então nenhum dos dois gerou um long task a remover — a saída era byte-idêntica (SHA-256), mas sem ganho de responsividade. O de Metadados é parsing EXIF puro que o worker de canvas não consegue offload. As três integrações foram rejeitadas com as medições documentadas; só o Redimensionador (escala real por pixel) mantém o worker.'
      ]
    }
  },
  {
    version: '0.10.0', date: '2026-11-15',
    notes: {
      en: [
        'U6 · New flagship tool: Data Workspace (21st of 31) — a JSON workbench that edits any document as a live tree: add/rename/delete keys and items, edit values with automatic type detection (number, boolean, null, quoted string), collapse/expand, path navigation, and case-insensitive search that filters and force-expands matches.',
        'Data Workspace also converts CSV↔JSON with RFC-4180 quoting (embedded commas, escaped quotes, numeric coercion) and per-row length warnings, runs a structural document diff (added/removed/changed by path), and validates against a lightweight JSON Schema subset (type, properties, required, items, enum) — no extra dependencies.',
        'It is fully local-first and handles big documents: undo/redo snapshots the document content only (view settings like minify/sort never pollute history), projects persist on-device via IndexedDB with autosave that survives reloads, plus backup/restore (merge or replace). Large arrays render incrementally (200 children + “show more”), and verified offline with the server stopped: navigation transferSize 0 and project loading from IndexedDB both work with no network.'
      ],
      pt: [
        'U6 · Nova ferramenta principal: Área de Dados (21ª de 31) — uma bancada JSON que edita qualquer documento como árvore ao vivo: adicionar/renomear/excluir chaves e itens, editar valores com detecção automática de tipo (número, booleano, null, string entre aspas), recolher/expandir, navegação por caminho e busca sem distinção de maiúsculas que filtra e expande as correspondências.',
        'A Área de Dados também converte CSV↔JSON com aspas RFC-4180 (vírgulas embutidas, aspas escapadas, coerção numérica) e avisos por linha de tamanho divergente, executa diff estrutural de documentos (adicionado/removido/alterado por caminho) e valida contra um subconjunto leve de JSON Schema (type, properties, required, items, enum) — sem dependências extras.',
        'É totalmente local-first e lida com documentos grandes: desfazer/refazer guarda instantâneos apenas do conteúdo do documento (ajustes de exibição como minificar/ordenar nunca poluem o histórico), os projetos persistem no dispositivo via IndexedDB com salvamento automático que sobrevive a recarregamentos, além de backup/restauração (mesclar ou substituir). Arrays grandes são renderizados de forma incremental (200 filhos + “mostrar mais”), e validado offline com o servidor parado: navegação com transferSize 0 e carregamento de projeto do IndexedDB funcionam sem rede.'
      ]
    }
  },
  {
    version: '0.11.0', date: '2026-11-15',
    notes: {
      en: [
        'U7 · New flagship tool: Visual Page Builder (22nd of 31) — compose a real landing page by dragging blocks onto a live canvas. Twelve block types cover the sections that matter: hero, heading, paragraph, button, image, quote, list, columns, features grid and call-to-action, plus divider and spacer.',
        'Drag blocks from the palette to insert them anywhere, reorder by dragging or with up/down tools, and edit every block in a properties panel. Switch desktop/tablet/mobile widths to preview responsiveness, undo/redo the whole document, and export clean, production-ready HTML with one click.',
        'It is local-first and safe by design: exported HTML is generated from a typed model with all text escaped and javascript:/data: URLs neutralized — no scripts are ever injected or evaluated. Your work autosaves on-device via IndexedDB and is restored when you return, projects can be saved by name, and the whole tool runs offline with the server stopped.'
      ],
      pt: [
        'U7 · Nova ferramenta principal: Construtor Visual de Páginas (22ª de 31) — monte uma landing page de verdade arrastando blocos para uma tela ao vivo. Doze tipos de bloco cobrem as seções que importam: destaque, título, parágrafo, botão, imagem, citação, lista, colunas, grade de recursos e chamada para ação, além de divisor e espaçador.',
        'Arraste blocos da paleta para inseri-los em qualquer ponto, reordene arrastando ou com as setas, e edite cada bloco num painel de propriedades. Alterne as larguras desktop/tablet/celular para ver a responsividade, desfaça/refaça todo o documento e exporte HTML limpo e pronto para produção com um clique.',
        'É local-first e seguro por design: o HTML exportado é gerado de um modelo tipado com todo texto escapado e URLs javascript:/data: neutralizadas — nenhum script é injetado ou avaliado. Seu trabalho é salvo automaticamente no dispositivo via IndexedDB e restaurado quando você volta, os projetos podem ser salvos por nome, e toda a ferramenta roda offline com o servidor parado.'
      ]
    }
  },
  {
    version: '0.12.0', date: '2026-11-15',
    notes: {
      en: [
        'U8 · New flagship tool: Design System Lab (23rd of 31) — a live token studio for the Cosmic Liquid Glass identity. Tune the base and accent colors, glass tint, backdrop blur, border strength, radius scale, shadow offset/blur/opacity and the display/UI font stacks, and watch real sample components (hero, badge, buttons, glass card, input, chips, nested surface) update instantly.',
        'Start from one of five presets (Cosmic, Aurora, Midnight, Ember, Frost), then refine any control. Undo/redo the whole token set, save named themes to IndexedDB, and your working theme autosaves and is restored when you return.',
        'Export a ready-to-use CSS custom-properties stylesheet (Copy CSS or download vistanology-tokens.css). The output interpolates only browser-validated token values — no scripts, no eval. Fully local-first and verified offline with the server stopped.'
      ],
      pt: [
        'U8 · Nova ferramenta principal: Laboratório de Sistema de Design (23ª de 31) — um estúdio de tokens ao vivo para a identidade Cosmic Liquid Glass. Ajuste as cores base e de destaque, o tom do vidro, o desfoque, a força da borda, a escala de raio, o deslocamento/suavidade/opacidade da sombra e as pilhas de fonte de exibição/interface, e veja componentes reais de exemplo (destaque, selo, botões, cartão de vidro, campo, chips, superfície aninhada) atualizarem instantaneamente.',
        'Comece por uma das cinco predefinições (Cósmico, Aurora, Meia-noite, Brasa, Geada) e refine qualquer controle. Desfaça/refaça todo o conjunto de tokens, salve temas nomeados no IndexedDB, e seu tema de trabalho é salvo automaticamente e restaurado quando você volta.',
        'Exporte uma folha de propriedades CSS pronta para uso (Copiar CSS ou baixar vistanology-tokens.css). A saída interpola apenas valores de token validados pelo navegador — sem scripts, sem eval. Totalmente local-first e validado offline com o servidor parado.'
      ]
    }
  },
  {
    version: '0.13.0', date: '2026-11-15',
    notes: {
      en: [
        'U9 · New flagship tool: Playground (24th of 31) — write HTML, CSS and JavaScript and watch it run live in a sandboxed frame. Edit the three tabs, press Run (or Ctrl/Cmd+Enter), and read a captured console that surfaces your log/warn/error calls plus runtime and syntax errors.',
        'Security by construction: the preview runs in an iframe with allow-scripts but never allow-same-origin, so your code executes in a unique opaque origin and cannot read or write this app, its storage or the surrounding page. No eval is used anywhere — the frame document is assigned directly and the console is captured through a serialized postMessage shim.',
        'Start from one of four templates (Welcome, DOM & events, Canvas animation, Live clock), toggle a desktop/mobile viewport, enable auto-run for live refresh, save named snippets to IndexedDB, and export a single standalone .html file. Fully local-first and verified offline with the server stopped.'
      ],
      pt: [
        'U9 · Nova ferramenta principal: Playground (24ª de 31) — escreva HTML, CSS e JavaScript e veja rodar ao vivo em um quadro isolado. Edite as três abas, pressione Executar (ou Ctrl/Cmd+Enter) e leia um console capturado que mostra suas chamadas log/warn/erro além de erros de execução e de sintaxe.',
        'Segurança por construção: a prévia roda em um iframe com allow-scripts, mas nunca allow-same-origin, então seu código executa em uma origem opaca única e não consegue ler nem escrever neste app, em seu armazenamento ou na página ao redor. Nenhum eval é usado em lugar algum — o documento do quadro é atribuído diretamente e o console é capturado por um shim de postMessage serializado.',
        'Comece por um dos quatro modelos (Boas-vindas, DOM e eventos, Animação em canvas, Relógio ao vivo), alterne a janela desktop/mobile, ative a execução automática para atualizar ao vivo, salve snippets nomeados no IndexedDB e exporte um único arquivo .html autônomo. Totalmente local-first e validado offline com o servidor parado.'
      ]
    }
  },
  {
    version: '0.14.0', date: '2026-11-15',
    notes: {
      en: [
        'U10 · New flagship tool: CSS Animation Studio (25th of 31) — build @keyframes visually instead of by hand. Tune duration, delay, iteration, direction, fill and an easing curve (named or a custom cubic-bezier with a live curve graph), then shape keyframe stops with transform (move / rotate / scale), opacity, background color and border-radius.',
        'A small typed model compiles to plain CSS injected into a scoped style and applied to a live preview target — Play/Pause and Restart included. Start from six presets (Pulse, Spin, Bounce, Slide in, Float, Shake), add or remove stops, undo/redo the whole animation, save named animations to IndexedDB, and your working animation autosaves and is restored when you return.',
        'Export the @keyframes + rule as clean, ready-to-use CSS (Copy CSS or download vistanology-animation.css). The stylesheet is compiled only from browser-validated control values — no hand-written CSS, no scripts, no eval. Fully local-first and verified offline with the server stopped.'
      ],
      pt: [
        'U10 · Nova ferramenta principal: Estúdio de Animação CSS (25ª de 31) — crie @keyframes visualmente em vez de à mão. Ajuste duração, atraso, iteração, direção, preenchimento e uma curva de easing (nomeada ou um cubic-bezier personalizado com gráfico de curva ao vivo) e, então, modele quadros-chave com transformação (mover / girar / escalar), opacidade, cor de fundo e raio.',
        'Um pequeno modelo tipado compila para CSS puro injetado em um estilo com escopo e aplicado a um alvo de prévia ao vivo — com Reproduzir/Pausar e Reiniciar. Comece por seis predefinições (Pulso, Giro, Quicar, Deslizar, Flutuar, Tremer), adicione ou remova quadros, desfaça/refaça toda a animação, salve animações nomeadas no IndexedDB, e sua animação de trabalho é salva automaticamente e restaurada quando você volta.',
        'Exporte os @keyframes + regra como CSS limpo e pronto para uso (Copiar CSS ou baixar vistanology-animation.css). A folha é compilada apenas a partir de valores validados pelo navegador — sem CSS escrito à mão, sem scripts, sem eval. Totalmente local-first e validado offline com o servidor parado.'
      ]
    }
  },
  {
    version: '0.15.0', date: '2026-11-15',
    notes: {
      en: [
        'U11 · New flagship tool: Component Builder (26th of 31) — assemble reusable UI components from a typed properties model instead of hand-coding markup. Pick a type (Button, Badge, Alert, Card), tune its label, body, variant, size, accent color, corner radius and icon, and watch it render live in the Cosmic Liquid Glass identity.',
        'Every edit updates the preview and the HTML + CSS output at once. Undo/redo the whole component, save named components to IndexedDB, and your working component autosaves and is restored when you return. Copy HTML, Copy CSS, or Export a self-contained .html you can open anywhere.',
        'Exported markup escapes all user text and the CSS interpolates only browser-validated values (color pickers, numeric radius, fixed variant/size lists) — no free-form HTML, no scripts, no eval. Fully local-first and verified offline with the server stopped.'
      ],
      pt: [
        'U11 · Nova ferramenta principal: Construtor de Componentes (26ª de 31) — monte componentes de UI reutilizáveis a partir de um modelo tipado de propriedades em vez de codificar o markup à mão. Escolha um tipo (Botão, Selo, Alerta, Cartão), ajuste rótulo, corpo, variante, tamanho, cor de destaque, raio dos cantos e ícone, e veja-o renderizar ao vivo na identidade Cosmic Liquid Glass.',
        'Cada edição atualiza a prévia e a saída HTML + CSS ao mesmo tempo. Desfaça/refaça todo o componente, salve componentes nomeados no IndexedDB, e seu componente de trabalho é salvo automaticamente e restaurado quando você volta. Copie o HTML, Copie o CSS ou Exporte um .html autossuficiente que abre em qualquer lugar.',
        'O markup exportado escapa todo texto do usuário e o CSS interpola apenas valores validados pelo navegador (seletores de cor, raio numérico, listas fixas de variante/tamanho) — sem HTML livre, sem scripts, sem eval. Totalmente local-first e validado offline com o servidor parado.'
      ]
    }
  },
  {
    version: '0.16.0', date: '2026-11-15',
    notes: {
      en: [
        'U12 · New flagship tool: Image Studio (27th of 31) — a non-destructive local image editor. Load any image (file, drag-and-drop, clipboard paste, or a built-in sample), then rotate, flip, center-crop by aspect ratio and tune a CSS-filter stack: brightness, contrast, saturation, hue-rotate, grayscale, sepia and blur.',
        'The original pixels are never overwritten — every edit is a parameter applied at draw time, so undo/redo only carries the small edit state. Toggle Compare to reveal the untouched original, save named projects to IndexedDB, and your working edit autosaves and is restored when you return.',
        'Export at the image’s full resolution as PNG, JPEG or WebP (with a quality slider); the exported file is rendered with the same filter string as the live preview, so what you see is what you download. No upload, no analytics, no eval. Fully local-first and verified offline with the server stopped.'
      ],
      pt: [
        'U12 · Nova ferramenta principal: Estúdio de Imagem (27ª de 31) — um editor de imagens local não destrutivo. Carregue qualquer imagem (arquivo, arrastar e soltar, colar da área de transferência ou um exemplo embutido) e, então, gire, espelhe, recorte centralmente por proporção e ajuste uma pilha de filtros CSS: brilho, contraste, saturação, matiz, escala de cinza, sépia e desfoque.',
        'Os pixels originais nunca são sobrescritos — cada edição é um parâmetro aplicado no momento do desenho, então desfazer/refazer carrega apenas o pequeno estado de edição. Ative Comparar para revelar o original intacto, salve projetos nomeados no IndexedDB, e sua edição de trabalho é salva automaticamente e restaurada quando você volta.',
        'Exporte na resolução total da imagem como PNG, JPEG ou WebP (com controle de qualidade); o arquivo exportado é renderizado com a mesma string de filtros da prévia ao vivo, então o que você vê é o que você baixa. Sem upload, sem analytics, sem eval. Totalmente local-first e validado offline com o servidor parado.'
      ]
    }
  },
  {
    version: '0.17.0', date: '2026-11-15',
    notes: {
      en: [
        'U13 · New flagship tool: Favicon & Icon Studio (28th of 31) — generate a complete app/favicon icon set from a raster image or a text/emoji monogram. Tune the fill (solid, gradient or transparent), the shape (square, rounded, circle), padding and colors, and every standard size (16, 32, 48, 64, 128, 180, 192, 512) renders live in one preview grid from a single shared draw routine.',
        'Download any single size, Export all eight as PNGs, and copy or download a ready-to-use site.webmanifest that references the set. Undo/redo the styling, save named presets to IndexedDB, and your work autosaves and is restored when you return — including the source image.',
        'Icons are drawn to a canvas on-device and exported as files you keep; the exported PNG matches the preview because both use the same code path. No upload, no analytics, no eval. Fully local-first and verified offline with the server stopped.'
      ],
      pt: [
        'U13 · Nova ferramenta principal: Estúdio de Favicon e Ícones (28ª de 31) — gere um conjunto completo de ícones de app/favicon a partir de uma imagem raster ou de um monograma de texto/emoji. Ajuste o preenchimento (sólido, gradiente ou transparente), a forma (quadrado, arredondado, círculo), o espaçamento e as cores, e todos os tamanhos padrão (16, 32, 48, 64, 128, 180, 192, 512) são renderizados ao vivo numa grade de prévia a partir de uma única rotina de desenho compartilhada.',
        'Baixe qualquer tamanho único, Exporte todos os oito como PNGs, e copie ou baixe um site.webmanifest pronto para uso que referencia o conjunto. Desfaça/refaça o estilo, salve predefinições nomeadas no IndexedDB, e seu trabalho é salvo automaticamente e restaurado quando você volta — incluindo a imagem de origem.',
        'Os ícones são desenhados num canvas no dispositivo e exportados como arquivos seus; o PNG exportado corresponde à prévia porque ambos usam o mesmo caminho de código. Sem upload, sem analytics, sem eval. Totalmente local-first e validado offline com o servidor parado.'
      ]
    }
  },
  {
    version: '0.18.0', date: '2026-11-15',
    notes: {
      en: [
        'U14 · New flagship tool: SVG Editor (29th of 31) — a visual vector bench. Place rectangles, ellipses, lines, triangles and stars, then drag to move, resize from the corners and rotate around the center on a live SVG canvas with grid snapping. Tune fill, stroke, opacity and corner radius per shape.',
        'Reorder, hide and rename layers, duplicate or delete the selection, nudge with the arrow keys, and undo/redo the whole document. Save named projects to IndexedDB, and your work autosaves and is restored when you return — including canvas size and background.',
        'Export clean SVG markup (Copy or Download) or a crisp rasterized PNG at 1×/2×/4× — the on-screen canvas and the exported markup come from the same document model, so what you edit is exactly what you download. No upload, no analytics, no eval. Fully local-first and verified offline with the server stopped.'
      ],
      pt: [
        'U14 · Nova ferramenta principal: Editor SVG (29ª de 31) — uma bancada vetorial visual. Posicione retângulos, elipses, linhas, triângulos e estrelas, depois arraste para mover, redimensione pelos cantos e gire em torno do centro num canvas SVG ao vivo com ajuste à grade. Ajuste preenchimento, traço, opacidade e raio do canto por forma.',
        'Reordene, oculte e renomeie camadas, duplique ou exclua a seleção, ajuste com as setas e desfaça/refaça todo o documento. Salve projetos nomeados no IndexedDB, e seu trabalho é salvo automaticamente e restaurado quando você volta — incluindo o tamanho do canvas e o fundo.',
        'Exporte markup SVG limpo (Copiar ou Baixar) ou um PNG nítido em 1×/2×/4× — o canvas na tela e o markup exportado vêm do mesmo modelo de documento, então o que você edita é exatamente o que baixa. Sem upload, sem analytics, sem eval. Totalmente local-first e validado offline com o servidor parado.'
      ]
    }
  },
  {
    version: '0.19.0', date: '2026-11-15',
    notes: {
      en: [
        'U15 · New flagship tool: Notes Workspace (30th of 31) — a local-first Markdown notes bench. Keep many named notes in IndexedDB, write them in Markdown and watch a safe live preview in a split editor/preview layout, with full-text search and tag filtering.',
        'Undo/redo the note body, switch Write / Split / Preview, and every note autosaves. Your last note and view are restored when you return — and edits are flushed the moment you switch notes or leave the tool, so nothing is ever lost to the debounce window.',
        'The preview escapes all text and blocks raw HTML (a pasted <script> or javascript: link renders as inert text), keeping only http/https/mailto/# protocols — no eval, no scripts. Copy Markdown, Copy HTML or Export .md. No upload, no analytics. Fully local-first and verified offline with the server stopped.'
      ],
      pt: [
        'U15 · Nova ferramenta principal: Bancada de Notas (30ª de 31) — uma bancada de notas Markdown local-first. Guarde muitas notas nomeadas no IndexedDB, escreva-as em Markdown e veja uma prévia segura ao vivo num layout dividido editor/prévia, com busca de texto completo e filtro por tags.',
        'Desfaça/refaça o corpo da nota, alterne Escrita / Dividido / Prévia, e cada nota é salva automaticamente. Sua última nota e visão são restauradas quando você volta — e as edições são gravadas no instante em que você troca de nota ou sai da ferramenta, então nada se perde na janela do debounce.',
        'A prévia escapa todo texto e bloqueia HTML bruto (um <script> colado ou um link javascript: é renderizado como texto inerte), mantendo apenas protocolos http/https/mailto/# — sem eval, sem scripts. Copie Markdown, Copie HTML ou Exporte .md. Sem upload, sem analytics. Totalmente local-first e validado offline com o servidor parado.'
      ]
    }
  },
  {
    version: '0.20.0', date: '2026-11-15',
    notes: {
      en: [
        'U16 · New flagship tool: Kanban Board (31st of 31) — a local-first task board. Build columns, add cards, and drag them between columns and reorder them with a live drop placeholder, all on-device.',
        'Edit each card in a side panel (title, description, tags, done), undo/redo the whole board with the shared history framework, and the board autosaves to IndexedDB and is restored when you return. Keep several named projects, filter cards by search, and export the board as JSON or Markdown.',
        'Card and column text is rendered from a plain data model with full HTML escaping — a pasted <img onerror> or <script> shows as inert text, with no eval, no raw-HTML passthrough and nothing uploaded. Fully local-first and verified offline with the server stopped (navigation and every asset report a transfer size of 0).'
      ],
      pt: [
        'U16 · Nova ferramenta principal: Quadro Kanban (31ª de 31) — um quadro de tarefas local-first. Monte colunas, adicione cartões e arraste-os entre colunas e os reordene com um espaço reservado de soltura ao vivo, tudo no dispositivo.',
        'Edite cada cartão num painel lateral (título, descrição, tags, concluído), desfaça/refaça o quadro inteiro com o framework de histórico compartilhado, e o quadro é salvo automaticamente no IndexedDB e restaurado quando você volta. Mantenha vários projetos nomeados, filtre cartões pela busca e exporte o quadro como JSON ou Markdown.',
        'O texto de cartões e colunas é renderizado de um modelo de dados puro com escape completo de HTML — um <img onerror> ou <script> colado aparece como texto inerte, sem eval, sem passagem de HTML bruto e nada enviado. Totalmente local-first e validado offline com o servidor parado (navegação e todos os recursos reportam tamanho de transferência 0).'
      ]
    }
  },
  {
    version: '0.21.0', date: '2026-11-15',
    notes: {
      en: [
        'U17 · New flagship tool: Document Workshop (32nd tool — the first to fill the Documents category) — a local-first, print-ready document bench. Compose a document from ordered sections of safe Markdown, with a cover header (title, author, date), an automatic table of contents, a serif/sans theme and an adjustable font size, all on-device.',
        'Preview live in Write / Split / Preview modes, undo/redo the whole document, reorder or delete sections, autosave to IndexedDB and reopen it when you return, keep several named projects, then export a standalone printable HTML or plain Markdown, or send it straight to the browser print dialog with print-only CSS.',
        'Every user string is HTML-escaped and rendered from a plain data model — a pasted <img onerror> or <script> and a javascript: link show as inert text, with no eval, no raw-HTML passthrough and nothing uploaded. Fully local-first and verified offline with the server stopped (navigation and every asset report a transfer size of 0).'
      ],
      pt: [
        'U17 · Nova ferramenta principal: Bancada de Documentos (32ª ferramenta — a primeira a preencher a categoria Documentos) — uma bancada de documentos local-first pronta para impressão. Monte um documento a partir de seções ordenadas de Markdown seguro, com cabeçalho (título, autor, data), sumário automático, tema com ou sem serifa e tamanho de fonte ajustável, tudo no dispositivo.',
        'Veja a prévia ao vivo nos modos Escrever / Dividido / Prévia, desfaça/refaça o documento inteiro, reordene ou exclua seções, salve automaticamente no IndexedDB e reabra ao voltar, mantenha vários projetos nomeados e exporte um HTML autônomo para impressão ou Markdown puro, ou envie direto para a caixa de impressão do navegador com CSS só para impressão.',
        'Todo texto do usuário é escapado em HTML e renderizado de um modelo de dados puro — um <img onerror> ou <script> colado e um link javascript: aparecem como texto inerte, sem eval, sem passagem de HTML bruto e nada enviado. Totalmente local-first e validado offline com o servidor parado (navegação e todos os recursos reportam tamanho de transferência 0).'
      ]
    }
  },
  {
    version: '0.22.0', date: '2026-11-15',
    notes: {
      en: [
        'U18 · New flagship tool: Diagram Studio (33rd tool) — a local-first SVG flowchart bench. Author typed nodes (rectangle, diamond, capsule, note), connect them with orthogonal arrow edges in a two-step Link flow, and drag them on a grid-snapping canvas, all on-device.',
        'Edit the selected node or edge from a live inspector (label, size, fill, stroke), undo/redo the whole diagram, autosave to IndexedDB and reopen where you left off, keep named projects, then export clean SVG markup or a 2x rasterized PNG from the same data model.',
        'Node and edge labels are rendered as SVG text content and HTML-escaped in the exported markup — a pasted <img onerror> or <script> shows as inert text both on the live canvas and in the saved .svg, with no eval, no raw-HTML passthrough and nothing uploaded. Fully local-first and verified offline with the server stopped (navigation and every asset report a transfer size of 0).'
      ],
      pt: [
        'U18 · Nova ferramenta principal: Estúdio de Diagramas (33ª ferramenta) — uma bancada de fluxogramas em SVG, local-first. Crie nós tipados (retângulo, losango, cápsula, nota), conecte-os com setas ortogonais num fluxo Link em duas etapas e arraste-os num quadro com encaixe na grade, tudo no dispositivo.',
        'Edite o nó ou a aresta selecionada num inspetor ao vivo (rótulo, tamanho, preenchimento, contorno), desfaça/refaça o diagrama inteiro, salve automaticamente no IndexedDB e reabra de onde parou, mantenha projetos nomeados e exporte um SVG limpo ou um PNG rasterizado 2x a partir do mesmo modelo de dados.',
        'Os rótulos de nós e arestas são texto SVG escapado em HTML no markup exportado — um <img onerror> ou <script> colado aparece como texto inerte tanto no quadro ao vivo quanto no .svg salvo, sem eval, sem passagem de HTML bruto e nada enviado. Totalmente local-first e validado offline com o servidor parado (navegação e todos os recursos reportam tamanho de transferência 0).'
      ]
    }
  },
  {
    version: '0.23.0', date: '2026-11-15',
    notes: {
      en: [
        'U19 · New flagship tool: Mind Map Studio (34th tool) — a local-first radial mind-map bench. Grow a tree from a central topic, add branches and sub-branches, collapse or expand any node, and nudge nodes with the pointer on a snapping layout, all on-device.',
        'Edit the selected node\u2019s label and colour in a live inspector, tidy the radial layout, undo/redo the whole map, autosave to IndexedDB and reopen where you left off, keep named projects, then export clean SVG markup, a 2x rasterized PNG, or the JSON tree from the same data model.',
        'Node labels are rendered as SVG text content and HTML-escaped in the exported markup — a pasted <img onerror> or <script> shows as inert text both on the live canvas and in the saved .svg, with no eval, no raw-HTML passthrough and nothing uploaded. Fully local-first and verified offline with the server stopped (navigation and every asset report a transfer size of 0).'
      ],
      pt: [
        'U19 · Nova ferramenta principal: Estúdio de Mapas Mentais (34ª ferramenta) — uma bancada radial de mapas mentais, local-first. Faça crescer uma árvore a partir de um tópico central, adicione ramos e sub-ramos, recolha ou expanda qualquer nó e ajuste a posição arrastando com encaixe na grade, tudo no dispositivo.',
        'Edite o rótulo e a cor do nó selecionado num inspetor ao vivo, organize o layout radial, desfaça/refaça o mapa inteiro, salve automaticamente no IndexedDB e reabra de onde parou, mantenha projetos nomeados e exporte um SVG limpo, um PNG rasterizado 2x ou a árvore em JSON a partir do mesmo modelo de dados.',
        'Os rótulos dos nós são texto SVG escapado em HTML no markup exportado — um <img onerror> ou <script> colado aparece como texto inerte tanto no quadro ao vivo quanto no .svg salvo, sem eval, sem passagem de HTML bruto e nada enviado. Totalmente local-first e validado offline com o servidor parado (navegação e todos os recursos reportam tamanho de transferência 0).'
      ]
    }
  },
  {
    version: '0.24.0', date: '2026-11-15',
    notes: {
      en: [
        'Visual redesign · Frutiger Aero identity. The whole product moved from the night-blue Cosmic Glass theme to a daylight one: open sky backgrounds, white frosted glass, water and sun glow, ink-on-paper typography. Every token was re-mapped in place, so all 34 tools inherit the new look without changing their behavior.',
        'Home is now an immersive page: a commissioned glass-pavilion hero image, a privacy stat strip, six category worlds rendered as photographic cards and a closing landscape band. The Library became a visual catalogue with per-category identity, watermark crests and an illustrated empty state.',
        'Flagship editors got their own light stages — CSS Animation Studio gained a keyframe timeline with draggable ticks and a live playhead, and the SVG, diagram and mind-map benches now open on daylight paper with ink labels. Original artwork is bundled as WebP and precached, so the redesign works fully offline.',
        'The previous dark theme is preserved untouched in v1_css/ for reference. The Service Worker cache moved to v44-aero, the Library opens on a photographic stage band, single-column benches can no longer be widened by a code pane, white labels on aqua buttons were re-checked against the composited gradient, and the app icon, favicon and manifest colors follow the new palette.'
      ],
      pt: [
        'Redesign visual · identidade Frutiger Aero. O produto inteiro saiu do tema noturno Cosmic Glass para um tema diurno: céu aberto, vidro branco fosco, brilho de água e sol e tipografia tinta sobre papel. Cada token foi re-mapeado no lugar, então as 34 ferramentas herdam o novo visual sem mudar de comportamento.',
        'Home virou uma página imersiva: imagem hero comissionada de um pavilhão de vidro, faixa de estatísticas de privacidade, seis mundos de categoria como cartões fotográficos e um panorama de encerramento. A Biblioteca passou a catálogo visual, com identidade por categoria, brasão d’água e estado vazio ilustrado.',
        'Os editores principais ganharam palcos claros — o Estúdio de Animação CSS recebeu uma linha do tempo de keyframes com marcadores clicáveis e cursor ao vivo, e as bancadas de SVG, diagramas e mapas mentais abrem em papel claro com rótulos em tinta. A arte original vem em WebP e entra no pre-cache, então o redesign funciona 100% offline.',
        'O tema escuro anterior está preservado sem alterações em v1_css/ para consulta. O cache do Service Worker passou para v43-aero, as bancadas em coluna única não podem mais ser alargadas por um bloco de código, os rótulos brancos sobre botões aqua foram conferidos sobre o gradiente composto, e ícone, favicon e cores do manifesto seguem a nova paleta.'
      ]
    }
  },
  {
    version: '0.25.0', date: '2026-11-16',
    notes: {
      en: [
        'Consolidation instead of per-tool patching. The eleven tools that build a stepped bench now inherit one shared `.step` family, and the three porcelain work surfaces (`.bench`, `.step`, `.bench-sec`) share a single recessed well treatment for fields, so a control on white glass reads as pressed into the surface rather than as a white plate on white porcelain.',
        'Selection became an explicit contract: discrete controls use `--sel-fill` + `--sel-ink` per substrate (measured 7.0:1 for white on aqua on the bench, dark ink on the light field), while continuous plates keep `--sel-line` + `--sel-tint`. Tools kept their own personality — consistency never meant identical controls.',
        'Two interaction states were re-defined. QR Studio now shows an empty stage as an empty state (placeholder text, canvas hidden, no error message) instead of raising a role=alert, and Notes Workspace renders a list of rows with one selection instead of a stack of cards.',
        'A regression was caught with evidence and fixed: the well rule used the `background:` shorthand, which overrode `select.input` and erased its chevron gradient, so the selects in Favicon Studio and Data Workspace lost their only affordance. The rule now paints `background-color` only, and a new guard checks every select in all 34 tools (42 selects verified). The Open page had its own defect: release notes were interpolated as raw HTML, so the entries that quote the payloads they neutralise broke the list and the last four releases were invisible — notes are escaped now and all 25 render.',
        'Key art is one distinct commissioned plate per category, never reused. `assets/images/empty-bloom.webp` left the bundle and the Service Worker precache — nothing in the app could reach it, and the byte-identical original stays archived; `stage-aqua.webp` remains because the stage before/after instrument reads it. The cache moved to v55-consolidated-system and the design-system documentation now matches the shipped tokens and components.'
      ],
      pt: [
        'Consolidação em vez de remendo por ferramenta. As onze ferramentas que montam uma bancada em etapas agora herdam uma única família `.step`, e as três superfícies de porcelana (`.bench`, `.step`, `.bench-sec`) compartilham um só poço recessado para os campos: um controle sobre vidro branco lê como afundado na superfície, não como prato branco sobre porcelana branca.',
        'A seleção virou contrato explícito: controles discretos usam `--sel-fill` + `--sel-ink` por substrato (medido 7,0:1 para branco sobre aqua na bancada, tinta escura no campo claro), enquanto as placas contínuas mantêm `--sel-line` + `--sel-tint`. Cada ferramenta conservou a própria personalidade — consistência nunca significou controles idênticos.',
        'Dois estados de interação foram redefinidos. O QR Studio agora apresenta o palco vazio como estado vazio (texto de placeholder, canvas escondido, sem mensagem de erro) em vez de disparar um role=alert, e o Notes Workspace mostra uma lista de linhas com uma seleção em lugar de uma pilha de cartões.',
        'Uma regressão foi pega com evidência e corrigida: a regra do poço usava a forma curta `background:`, que sobrepunha `select.input` e apagava o gradiente do chevron — os selects do Favicon Studio e do Data Workspace perdiam a única afordância. A regra agora pinta só `background-color`, e um verificador novo confere cada select das 34 ferramentas (42 selects verificados). A página Aberto tinha um defeito próprio: as notas de release eram interpoladas como HTML cru, então as entradas que citam os payloads que elas neutralizam quebravam a lista e as últimas quatro versões ficavam invisíveis — as notas agora são escapadas e as 25 aparecem.',
        'A key art é uma placa comissionada distinta por categoria, nunca reaproveitada. `assets/images/empty-bloom.webp` saiu do pacote e do pre-cache do Service Worker — nada no app conseguia alcançá-lo, e o original byte-idêntico fica arquivado; `stage-aqua.webp` permanece porque o instrumento de antes/depois do palco o lê. O cache passou para v55-consolidated-system e a documentação do design system agora corresponde aos tokens e componentes entregues.'
      ]
    }
  }
];