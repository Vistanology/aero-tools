window.VT = window.VT || {};

VT.i18n = (() => {
  const dicts = { en: {}, pt: {} };
  const stored = VT.store.get('lang', null);
  let lang = stored || (((navigator.language || 'en').toLowerCase().startsWith('pt')) ? 'pt' : 'en');

  function add(d) {
    for (const l of ['en', 'pt']) Object.assign(dicts[l], d[l] || {});
  }

  function t(key, vars) {
    let s = dicts[lang][key];
    if (s === undefined) s = dicts.en[key];
    if (s === undefined) return key;
    if (vars) for (const k of Object.keys(vars)) s = s.split('{' + k + '}').join(String(vars[k]));
    return s;
  }

  function setLang(l) {
    if (l !== 'en' && l !== 'pt') return;
    lang = l;
    VT.store.set('lang', l);
    document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
    window.dispatchEvent(new CustomEvent('vt:lang'));
  }

  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';

  return { add, t, setLang, get lang() { return lang; } };
})();

VT.i18n.add({
  en: {
    'nav.library': 'Library', 'nav.docs': 'Docs', 'nav.open': 'Open', 'nav.settings': 'Settings',
    'nav.favorites': 'Favorites', 'nav.main': 'Main navigation',
    'brand.tag': 'Open Tools',
    'footer.license': 'MIT License', 'footer.made': 'Engineered with care by Vistanology',
    'hub.kicker': 'A Vistanology product',
    'hub.title1': 'Useful technology.', 'hub.title2': 'Open possibilities.',
    'hub.sub': 'A growing collection of beautifully engineered, free and open-source digital tools. Everything runs in your browser — nothing leaves your device.',
    'hub.seal.free': 'Free', 'hub.seal.open': 'Open source', 'hub.seal.privacy': 'Privacy first',
    'hub.cta.library': 'Explore the library', 'hub.cta.docs': 'Read the docs',
    'hub.collection': 'The collection', 'hub.collection.sub': 'Six studios. One growing library.',
    'hub.principles': 'Principles',
    'hub.p1.lead': 'Local by default.', 'hub.p1.body': 'Every tool runs entirely in your browser. Your files, keys and texts never leave your device.',
    'hub.p2.lead': 'Open by design.', 'hub.p2.body': 'MIT licensed, documented and built to be extended. Read the code, fork it, improve it.',
    'hub.p3.lead': 'Engineered with care.', 'hub.p3.body': 'Real functionality, honest results, accessible interfaces. No placeholders, no trackers.',
    'hub.favorites': 'Your favorites', 'hub.recents': 'Recently used',
    'hub.count': '{n} available', 'hub.count.one': '{n} available',
    'hub.tools': '{n} TOOLS',
    'cat.creative.name': 'Creative Studio', 'cat.creative.desc': 'Color, gradients, type and vector craft.',
    'cat.generators.name': 'Generators', 'cat.generators.desc': 'Codes, keys and content on demand.',
    'cat.media.name': 'Media Lab', 'cat.media.desc': 'Compress, convert and inspect images.',
    'cat.developer.name': 'Developer Tools', 'cat.developer.desc': 'Precision instruments for code and data.',
    'cat.productivity.name': 'Productivity', 'cat.productivity.desc': 'Focus, text and everyday utilities.',
    'cat.documents.name': 'Documents', 'cat.documents.desc': 'Write, organize, export and print documents.',
    'lib.title': 'Tool Library', 'lib.sub': 'Search, filter and favorite. Every tool is free, open source and runs entirely on your device.',
    'lib.search': 'Search tools…', 'lib.all': 'All', 'lib.favorites': 'Favorites',
    'lib.count': '{n} tools', 'lib.count.one': '{n} tool',
    'lib.empty.title': 'No tools found', 'lib.empty.body': 'Try a different search or category.',
    'lib.empty.fav.title': 'No favorites yet', 'lib.empty.fav.body': 'Star a tool to keep it here.',
    'lib.empty.act.all': 'Show all tools', 'lib.empty.act.clear': 'Clear search',
    'app.docs': 'Docs', 'app.local': '100% local',
    'app.fav.add': 'Add to favorites', 'app.fav.remove': 'Remove from favorites',
    'app.notfound.title': 'Tool not found', 'app.notfound.body': 'This tool does not exist (yet). Browse the library to see what is available.',
    'docs.title': 'Documentation', 'docs.sub': 'What each tool does, how to use it, and exactly what happens to your data.',
    'docs.index': 'Overview', 'docs.usage': 'How to use', 'docs.privacy': 'Privacy', 'docs.limits': 'Limitations',
    'docs.deps': 'Dependencies', 'docs.open': 'Open tool', 'docs.none': 'No external dependencies.',
    'open.title': 'Open source', 'open.sub': 'Vistanology Open is free software under the MIT license. The code, the roadmap and the decisions are public.',
    'open.license': 'License', 'open.releases': 'Releases', 'open.contributing': 'Contributing',
    'open.credits': 'Credits & dependencies', 'open.privacy': 'Privacy',
    'open.contrib.1': 'Contributions are welcome: new tools, fixes, translations and documentation. Each tool is a self-contained module registered in a manifest, so adding one never touches the shell.',
    'open.contrib.2': 'Open an issue to report a bug or propose a tool. Keep changes local-first: no telemetry, no network calls, no server-side processing.',
    'open.privacy.1': 'Vistanology Open runs entirely in your browser. Files you open are processed in memory and never uploaded. There are no accounts, no analytics, no trackers and no cookies.',
    'open.privacy.2': 'Preferences, favorites and tool state are stored in your browser’s localStorage under the “vistanology:” prefix. You can erase everything at any time in Settings.',
    'open.privacy.3': 'The only network requests are the ones your browser makes to load the app itself (and its bundled fonts). Once loaded, every tool works offline.',
    'open.credits.sub': 'Bundled third-party software, all loaded locally:',
    'dep.name': 'Component', 'dep.version': 'Version', 'dep.license': 'License', 'dep.usedfor': 'Used for',
    'set.title': 'Settings',
    'set.lang': 'Language', 'set.lang.desc': 'Interface and documentation language.',
    'set.motion': 'Motion', 'set.motion.desc': 'Animations and transitions across the product.',
    'set.motion.full': 'Full', 'set.motion.reduced': 'Reduced',
    'set.glass': 'Transparency', 'set.glass.desc': 'Liquid Glass blur, or solid surfaces for maximum contrast.',
    'set.glass.liquid': 'Liquid', 'set.glass.solid': 'Solid',
    'set.data': 'Local data', 'set.data.desc': 'Preferences, favorites, saved tool state and local projects stored in this browser.',
    'set.data.reset': 'Reset all local data',
    'set.data.confirm.title': 'Reset local data?', 'set.data.confirm.body': 'This erases preferences, favorites, every tool’s saved state and all saved projects in this browser. It cannot be undone.',
    'set.data.done': 'Local data cleared',
    'common.copy': 'Copy', 'common.download': 'Download', 'common.cancel': 'Cancel', 'common.close': 'Close',
    'common.confirm': 'Confirm', 'common.copied': 'Copied', 'common.copyfail': 'Could not copy'
  },
  pt: {
    'nav.library': 'Biblioteca', 'nav.docs': 'Docs', 'nav.open': 'Open', 'nav.settings': 'Configurações',
    'nav.favorites': 'Favoritos', 'nav.main': 'Navegação principal',
    'brand.tag': 'Ferramentas',
    'footer.license': 'Licença MIT', 'footer.made': 'Feito com cuidado pela Vistanology',
    'hub.kicker': 'Um produto Vistanology',
    'hub.title1': 'Tecnologia útil.', 'hub.title2': 'Possibilidades abertas.',
    'hub.sub': 'Uma coleção crescente de ferramentas digitais belas, gratuitas e de código aberto. Tudo roda no seu navegador — nada sai do seu dispositivo.',
    'hub.seal.free': 'Gratuito', 'hub.seal.open': 'Código aberto', 'hub.seal.privacy': 'Privacidade primeiro',
    'hub.cta.library': 'Explorar a biblioteca', 'hub.cta.docs': 'Ler a documentação',
    'hub.collection': 'A coleção', 'hub.collection.sub': 'Seis estúdios. Uma biblioteca em crescimento.',
    'hub.principles': 'Princípios',
    'hub.p1.lead': 'Local por padrão.', 'hub.p1.body': 'Cada ferramenta roda inteiramente no seu navegador. Seus arquivos, chaves e textos nunca saem do seu dispositivo.',
    'hub.p2.lead': 'Aberto por design.', 'hub.p2.body': 'Licença MIT, documentado e feito para ser estendido. Leia o código, faça um fork, melhore.',
    'hub.p3.lead': 'Feito com cuidado.', 'hub.p3.body': 'Funcionalidade real, resultados honestos, interfaces acessíveis. Sem placeholders, sem rastreadores.',
    'hub.favorites': 'Seus favoritos', 'hub.recents': 'Usados recentemente',
    'hub.count': '{n} disponíveis', 'hub.count.one': '{n} disponível',
    'hub.tools': '{n} FERRAMENTAS',
    'cat.creative.name': 'Estúdio Criativo', 'cat.creative.desc': 'Cor, gradientes, tipografia e vetores.',
    'cat.generators.name': 'Geradores', 'cat.generators.desc': 'Códigos, chaves e conteúdo sob demanda.',
    'cat.media.name': 'Media Lab', 'cat.media.desc': 'Comprima, converta e inspecione imagens.',
    'cat.developer.name': 'Developer Tools', 'cat.developer.desc': 'Instrumentos de precisão para código e dados.',
    'cat.productivity.name': 'Produtividade', 'cat.productivity.desc': 'Foco, texto e utilidades do dia a dia.',
    'cat.documents.name': 'Documentos', 'cat.documents.desc': 'Escreva, organize, exporte e imprima documentos.',
    'lib.title': 'Biblioteca de Ferramentas', 'lib.sub': 'Busque, filtre e favorite. Cada ferramenta é gratuita, de código aberto e roda inteiramente no seu dispositivo.',
    'lib.search': 'Buscar ferramentas…', 'lib.all': 'Todas', 'lib.favorites': 'Favoritos',
    'lib.count': '{n} ferramentas', 'lib.count.one': '{n} ferramenta',
    'lib.empty.title': 'Nenhuma ferramenta encontrada', 'lib.empty.body': 'Tente outra busca ou categoria.',
    'lib.empty.fav.title': 'Nenhum favorito ainda', 'lib.empty.fav.body': 'Marque uma ferramenta com estrela para guardá-la aqui.',
    'lib.empty.act.all': 'Ver todas as ferramentas', 'lib.empty.act.clear': 'Limpar busca',
    'app.docs': 'Docs', 'app.local': '100% local',
    'app.fav.add': 'Adicionar aos favoritos', 'app.fav.remove': 'Remover dos favoritos',
    'app.notfound.title': 'Ferramenta não encontrada', 'app.notfound.body': 'Esta ferramenta não existe (ainda). Explore a biblioteca para ver o que está disponível.',
    'docs.title': 'Documentação', 'docs.sub': 'O que cada ferramenta faz, como usar e exatamente o que acontece com seus dados.',
    'docs.index': 'Visão geral', 'docs.usage': 'Como usar', 'docs.privacy': 'Privacidade', 'docs.limits': 'Limitações',
    'docs.deps': 'Dependências', 'docs.open': 'Abrir ferramenta', 'docs.none': 'Nenhuma dependência externa.',
    'open.title': 'Código aberto', 'open.sub': 'Vistanology Open é software livre sob a licença MIT. O código, o roadmap e as decisões são públicos.',
    'open.license': 'Licença', 'open.releases': 'Versões', 'open.contributing': 'Contribuindo',
    'open.credits': 'Créditos e dependências', 'open.privacy': 'Privacidade',
    'open.contrib.1': 'Contribuições são bem-vindas: novas ferramentas, correções, traduções e documentação. Cada ferramenta é um módulo autocontido registrado em um manifesto, então adicionar uma nunca toca no shell.',
    'open.contrib.2': 'Abra uma issue para relatar um bug ou propor uma ferramenta. Mantenha as mudanças local-first: sem telemetria, sem chamadas de rede, sem processamento no servidor.',
    'open.privacy.1': 'Vistanology Open roda inteiramente no seu navegador. Arquivos abertos são processados em memória e nunca enviados. Não há contas, analytics, rastreadores ou cookies.',
    'open.privacy.2': 'Preferências, favoritos e estado das ferramentas ficam no localStorage do navegador sob o prefixo “vistanology:”. Você pode apagar tudo a qualquer momento nas Configurações.',
    'open.privacy.3': 'As únicas requisições de rede são as que seu navegador faz para carregar o app (e suas fontes bundladas). Depois de carregado, tudo funciona offline.',
    'open.credits.sub': 'Software de terceiros bundlado, tudo carregado localmente:',
    'dep.name': 'Componente', 'dep.version': 'Versão', 'dep.license': 'Licença', 'dep.usedfor': 'Usado para',
    'set.title': 'Configurações',
    'set.lang': 'Idioma', 'set.lang.desc': 'Idioma da interface e da documentação.',
    'set.motion': 'Movimento', 'set.motion.desc': 'Animações e transições em todo o produto.',
    'set.motion.full': 'Completo', 'set.motion.reduced': 'Reduzido',
    'set.glass': 'Transparência', 'set.glass.desc': 'Blur do Liquid Glass, ou superfícies sólidas para contraste máximo.',
    'set.glass.liquid': 'Líquido', 'set.glass.solid': 'Sólido',
    'set.data': 'Dados locais', 'set.data.desc': 'Preferências, favoritos, estado salvo das ferramentas e projetos locais neste navegador.',
    'set.data.reset': 'Apagar todos os dados locais',
    'set.data.confirm.title': 'Apagar dados locais?', 'set.data.confirm.body': 'Isso apaga preferências, favoritos, todo o estado salvo das ferramentas e todos os projetos salvos neste navegador. Não pode ser desfeito.',
    'set.data.done': 'Dados locais apagados',
    'common.copy': 'Copiar', 'common.download': 'Baixar', 'common.cancel': 'Cancelar', 'common.close': 'Fechar',
    'common.confirm': 'Confirmar', 'common.copied': 'Copiado', 'common.copyfail': 'Não foi possível copiar'
  }
});

VT.i18n.add({
  en: {
    'nav.menu': 'Menu', 'nav.skip': 'Skip to content', 'nav.home': 'Home',
    'hub.featured': 'Start with an idea',
    'hub.featured.sub': 'Choose a workspace and turn it into something real.',
    'hub.featured.data-workspace': 'Explore JSON as a tree, convert CSV and check your data without uploading a file.',
    'hub.featured.page-builder': 'Build a page visually, preview every screen size and export an HTML file you own.',
    'hub.featured.image-studio': 'Crop, adjust and export your images. Keep the original, undo every edit.',
    'hub.search': 'Find a tool',
    'lib.sort': 'Sort by', 'lib.sort.collection': 'Collection order',
    'lib.sort.az': 'Name (A–Z)', 'lib.sort.recent': 'Recently used',
    'lib.recents': 'Recent tools', 'lib.recents.sub': 'Tools you recently opened on this device.',
    'lib.empty.recent.title': 'No recent tools yet',
    'lib.empty.recent.body': 'Open a tool and it will appear here.',
    'lib.empty.act.category': 'Clear category'
  },
  pt: {
    'nav.menu': 'Menu', 'nav.skip': 'Pular para conteúdo', 'nav.home': 'Início',
    'hub.featured': 'Comece com uma ideia',
    'hub.featured.sub': 'Escolha uma bancada e transforme sua ideia em algo real.',
    'hub.featured.data-workspace': 'Explore JSON em árvore, converta CSV e confira seus dados sem enviar um arquivo.',
    'hub.featured.page-builder': 'Monte uma página visualmente, confira cada tamanho de tela e exporte seu próprio HTML.',
    'hub.featured.image-studio': 'Recorte, ajuste e exporte suas imagens. Preserve o original e desfaça qualquer edição.',
    'hub.search': 'Encontrar uma ferramenta',
    'lib.sort': 'Ordenar por', 'lib.sort.collection': 'Ordem da coleção',
    'lib.sort.az': 'Nome (A–Z)', 'lib.sort.recent': 'Utilizadas recentemente',
    'lib.recents': 'Ferramentas recentes', 'lib.recents.sub': 'Ferramentas que você abriu recentemente neste dispositivo.',
    'lib.empty.recent.title': 'Nenhuma ferramenta recente ainda',
    'lib.empty.recent.body': 'Abra uma ferramenta e ela aparecerá aqui.',
    'lib.empty.act.category': 'Limpar categoria'
  }
});

VT.i18n.add({
  en: { 'net.offline': 'Offline — everything still runs locally', 'net.online': 'Online' },
  pt: { 'net.offline': 'Offline — tudo continua rodando localmente', 'net.online': 'Online' }
});

VT.i18n.add({
  en: {
    'set.projects': 'Saved projects', 'set.projects.desc': 'Gradients and other tool work you saved on this device. Stored locally; never uploaded.',
    'set.projects.count': '{n} saved', 'set.projects.count0': 'Nothing saved yet',
    'set.projects.export': 'Export all', 'set.projects.import': 'Import', 'set.projects.erase': 'Erase projects',
    'set.projects.erased': 'Saved projects erased',
    'set.projects.exported': 'Backup downloaded', 'set.projects.importing': 'Imported {n} project(s)',
    'set.projects.badFile': 'That file is not a valid Vistanology backup',
    'set.projects.unavailable': 'Local storage is unavailable in this browser.',
    'set.projects.eraseTitle': 'Erase all saved projects?', 'set.projects.eraseBody': 'This permanently deletes every saved project on this device. Export first if you want a backup.'
  },
  pt: {
    'set.projects': 'Projetos salvos', 'set.projects.desc': 'Gradientes e outros trabalhos de ferramentas que você salvou neste dispositivo. Armazenados localmente; nunca enviados.',
    'set.projects.count': '{n} salvos', 'set.projects.count0': 'Nada salvo ainda',
    'set.projects.export': 'Exportar tudo', 'set.projects.import': 'Importar', 'set.projects.erase': 'Apagar projetos',
    'set.projects.erased': 'Projetos salvos apagados',
    'set.projects.exported': 'Backup baixado', 'set.projects.importing': '{n} projeto(s) importados',
    'set.projects.badFile': 'Esse arquivo não é um backup válido da Vistanology',
    'set.projects.unavailable': 'O armazenamento local está indisponível neste navegador.',
    'set.projects.eraseTitle': 'Apagar todos os projetos salvos?', 'set.projects.eraseBody': 'Isso exclui permanentemente todo projeto salvo neste dispositivo. Exporte antes, se quiser um backup.'
  }
});

VT.i18n.add({
  en: {
    'pal.title': 'Command palette', 'pal.placeholder': 'Type a tool name or command…',
    'pal.empty': 'No matches for “{q}”', 'pal.kind.action': 'Action',
    'pal.foot.nav': 'navigate', 'pal.foot.run': 'open', 'pal.foot.toggle': 'toggle',
    'pal.tip': 'Command palette (Ctrl+K)',
    'pal.go.home': 'Go to Home', 'pal.go.library': 'Go to Library', 'pal.go.docs': 'Go to Docs',
    'pal.go.open': 'Go to Open Source', 'pal.go.settings': 'Go to Settings',
    'pal.lang.toggle': 'Switch language · English / Português',
    'pal.group.style': 'Style',
    'pal.motion.reduce': 'Reduce animations', 'pal.motion.restore': 'Restore full animations',
    'pal.glass.liquid': 'Switch to liquid glass', 'pal.glass.solid': 'Switch to solid glass'
  },
  pt: {
    'pal.title': 'Paleta de comandos', 'pal.placeholder': 'Digite um nome de ferramenta ou comando…',
    'pal.empty': 'Nada encontrado para “{q}”', 'pal.kind.action': 'Ação',
    'pal.foot.nav': 'navegar', 'pal.foot.run': 'abrir', 'pal.foot.toggle': 'alternar',
    'pal.tip': 'Paleta de comandos (Ctrl+K)',
    'pal.go.home': 'Ir para Início', 'pal.go.library': 'Ir para Biblioteca', 'pal.go.docs': 'Ir para Documentos',
    'pal.go.open': 'Ir para Código Aberto', 'pal.go.settings': 'Ir para Configurações',
    'pal.lang.toggle': 'Trocar idioma · Inglês / Português',
    'pal.group.style': 'Estilo',
    'pal.motion.reduce': 'Reduzir animações', 'pal.motion.restore': 'Restaurar animações completas',
    'pal.glass.liquid': 'Alternar para vidro líquido', 'pal.glass.solid': 'Alternar para vidro sólido'
  }
});

VT.i18n.add({
  en: {
    'hist.undo': 'Undo', 'hist.redo': 'Redo',
    'hist.undo.tip': 'Undo (Ctrl+Z)', 'hist.redo.tip': 'Redo (Ctrl+Shift+Z)'
  },
  pt: {
    'hist.undo': 'Desfazer', 'hist.redo': 'Refazer',
    'hist.undo.tip': 'Desfazer (Ctrl+Z)', 'hist.redo.tip': 'Refazer (Ctrl+Shift+Z)'
  }
});
VT.i18n.add({
  en: {
    'aero.hero.badge': 'Nothing is uploaded. Ever.',
    'aero.stat.tools': 'Tools on this device',
    'aero.stat.local': 'Local processing',
    'aero.stat.bytes': 'Bytes uploaded',
    'aero.worlds.sub': 'Every studio is a place to work. Pick an atmosphere and open the library there.',
    'aero.band.title': 'A future that feels like home.',
    'aero.band.sub': 'We build tools the way we would want to use them: fast, honest, yours.',
    'aero.band.cta': 'Explore the library',
    'lib.eyebrow': 'Catalogue', 'lib.open': 'Open'
  },
  pt: {
    'aero.hero.badge': 'Nada é enviado. Nunca.',
    'aero.stat.tools': 'Ferramentas neste dispositivo',
    'aero.stat.local': 'Processamento local',
    'aero.stat.bytes': 'Bytes enviados',
    'aero.worlds.sub': 'Cada estúdio é um lugar para trabalhar. Escolha uma atmosfera e abra a biblioteca ali.',
    'aero.band.title': 'Um futuro que parece casa.',
    'aero.band.sub': 'Construímos ferramentas do jeito que gostaríamos de usá-las: rápidas, honestas, suas.',
    'aero.band.cta': 'Explorar a biblioteca',
    'lib.eyebrow': 'Catálogo', 'lib.open': 'Abrir'
  }
});

VT.i18n.add({
  en: {
    'nav.modules': 'Modules', 'pal.go.modules': 'Go to Modules map',
    'mod.eyebrow': 'System map', 'mod.title': 'Module map',
    'mod.sub': 'Every registered tool, grouped by studio, with its version, its bundled dependencies and whether its documentation is complete in both languages.',
    'mod.search': 'Search modules…',
    'mod.count': '{n} modules', 'mod.count.one': '{n} module',
    'mod.cluster.count': '{n}',
    'mod.gaps.only': 'Docs gaps only',
    'mod.cover': '{done} of {total} fully documented',
    'mod.cover.sub': 'A tool counts as documented when summary, usage, privacy and limits exist in English and Portuguese. The badges below name exactly what is missing.',
    'mod.cover.done': 'Docs complete', 'mod.cover.gap': 'Docs gap',
    'mod.missing': 'Missing', 'mod.docs': 'Docs',
    'mod.deps': 'Bundled dependencies', 'mod.deps.sub': 'Everything the app ships is local: no CDN, no remote asset, no build step.',
    'mod.empty.title': 'No modules match', 'mod.empty.body': 'Try another search term or clear the category.',
    'mod.empty.act': 'Show the whole map',
    'mod.empty.gap.title': 'No documentation gaps', 'mod.empty.gap.body': 'Every registered tool documents summary, usage, privacy and limits in both languages.',
    'docs.search': 'Filter the documentation…', 'docs.contents': 'On this page',
    'docs.prev': 'Previous', 'docs.next': 'Next', 'docs.all': 'All tools',
    'docs.count': '{n} of {total} tools', 'docs.empty': 'No document matches that filter.'
  },
  pt: {
    'nav.modules': 'Módulos', 'pal.go.modules': 'Ir para o Mapa de módulos',
    'mod.eyebrow': 'Mapa do sistema', 'mod.title': 'Mapa de módulos',
    'mod.sub': 'Cada ferramenta registrada, agrupada por estúdio, com sua versão, suas dependências bundladas e se a documentação está completa nos dois idiomas.',
    'mod.search': 'Buscar módulos…',
    'mod.count': '{n} módulos', 'mod.count.one': '{n} módulo',
    'mod.cluster.count': '{n}',
    'mod.gaps.only': 'Só falhas de docs',
    'mod.cover': '{done} de {total} com docs completas',
    'mod.cover.sub': 'Uma ferramenta conta como documentada quando resumo, uso, privacidade e limites existem em inglês e português. Os selos abaixo dizem exatamente o que falta.',
    'mod.cover.done': 'Docs completas', 'mod.cover.gap': 'Falha de docs',
    'mod.missing': 'Falta', 'mod.docs': 'Docs',
    'mod.deps': 'Dependências bundladas', 'mod.deps.sub': 'Tudo o que o app entrega é local: sem CDN, sem recurso remoto, sem etapa de build.',
    'mod.empty.title': 'Nenhum módulo corresponde', 'mod.empty.body': 'Tente outro termo de busca ou limpe a categoria.',
    'mod.empty.act': 'Mostrar o mapa inteiro',
    'mod.empty.gap.title': 'Nenhuma falha de documentação', 'mod.empty.gap.body': 'Toda ferramenta registrada documenta resumo, uso, privacidade e limites nos dois idiomas.',
    'docs.search': 'Filtrar a documentação…', 'docs.contents': 'Nesta página',
    'docs.prev': 'Anterior', 'docs.next': 'Próxima', 'docs.all': 'Todas as ferramentas',
    'docs.count': '{n} de {total} ferramentas', 'docs.empty': 'Nenhum documento corresponde a esse filtro.'
  }
});
