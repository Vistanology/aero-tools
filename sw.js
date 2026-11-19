/* Vistanology Open — Service Worker · offline-first app shell
 * Estratégia:
 *  - install: pré-cache do "app shell" (HTML, CSS, core, shell, todas as apps, fontes, hero,
 *    vendor, manifest, ícones). O install só termina com o shell completo em cache.
 *  - fetch: navegação => network-first com fallback offline ao shell; demais recursos same-origin
 *    => stale-while-revalidate (serve cache, atualiza em background). Cross-origin ignorado.
 *  - activate: remove caches de versões antigas; clients.claim().
 * Tudo é local: nenhum recurso essencial depende de rede. Se uma app ainda não estiver em cache
 * (ex.: primeira visita a uma ferramenta nunca aberta), ela é buscada na rede e entra no cache.
 */

const VERSION = 'v59-aero-atmosphere';
const SHELL_CACHE = 'vt-shell-' + VERSION;
const ASSET_CACHE = 'vt-asset-' + VERSION;

const APPS = [
  'qr-studio', 'color-studio', 'gradient-lab', 'font-preview', 'svg-studio', 'password', 'uuid',
  'lorem-ipsum', 'image-compress', 'image-convert', 'image-resize', 'image-meta', 'json-formatter', 'data-workspace',
  'base64', 'url-toolkit', 'regex-tester', 'timestamp', 'text-diff', 'hash-generator', 'markdown-preview', 'page-builder', 'design-lab', 'playground', 'animation-studio', 'component-builder', 'image-studio', 'favicon-studio', 'svg-editor', 'notes', 'kanban', 'document-workshop', 'diagram-studio', 'mind-map-studio'
];

const SHELL = [
  './', 'index.html', 'app.webmanifest',
  'css/fonts.css', 'css/tokens.css', 'css/base.css', 'css/background.css', 'css/glass.css',
  'css/components.css', 'css/shell.css', 'css/apps.css', 'css/responsive.css',
  'js/core/utils.js', 'js/core/storage.js', 'js/core/db.js', 'js/core/i18n.js', 'js/core/icons.js', 'js/core/ui.js',
  'js/core/registry.js', 'js/core/router.js', 'js/core/palette.js', 'js/core/workers.js', 'js/core/history.js', 'js/app.js',
  'js/shell/hub.js', 'js/shell/library.js', 'js/shell/appframe.js', 'js/shell/docs.js', 'js/shell/modules.js',
  'js/shell/open.js', 'js/shell/settings.js',
  'assets/vendor/qrcode.js',
  'assets/fonts/instrument-serif-normal-400.woff2', 'assets/fonts/instrument-serif-italic-400.woff2',
  'assets/fonts/inter-normal-400-700.woff2',
  'assets/images/hero-aero.webp', 'assets/images/stage-all.webp',
  'assets/images/cat-creative.webp', 'assets/images/cat-generators.webp', 'assets/images/cat-media.webp',
  'assets/images/cat-developer.webp', 'assets/images/cat-productivity.webp', 'assets/images/cat-documents.webp',
  'assets/images/band-horizon.webp',
  'assets/icons/icon.svg', 'assets/icons/icon-maskable.svg', 'assets/brand/emblem.svg'
].concat(APPS.map((a) => 'js/apps/' + a + '.js'));
const SHELL_URLS = new Set(SHELL.map((u) => new URL(u, self.registration.scope).href));

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await cache.addAll(SHELL);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => /^(vt-shell-|vt-asset-)/.test(k) && k !== SHELL_CACHE && k !== ASSET_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

async function cachePut(req, res) {
  const cache = await caches.open(SHELL_URLS.has(req.url) ? SHELL_CACHE : ASSET_CACHE);
  await cache.put(req, res);
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegações (SPA): network-first, fallback ao shell pré-cacheado quando offline.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const net = await fetch(req);
        if (!net.ok) throw new Error('Navigation unavailable');
        const shell = await caches.open(SHELL_CACHE);
        await shell.put('./', net.clone());
        return net;
      } catch (err) {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match('./')) || (await cache.match('index.html')) || Response.error();
      }
    })());
    return;
  }

  // Demais recursos same-origin: stale-while-revalidate.
  const network = fetch(req).then(async (res) => {
    if (res.ok) await cachePut(req, res.clone());
    return res;
  }).catch(() => null);
  e.waitUntil(network.then(() => undefined));
  e.respondWith((async () => {
    const cache = await caches.open(SHELL_URLS.has(req.url) ? SHELL_CACHE : ASSET_CACHE);
    const cached = await cache.match(req);
    return cached || await network || Response.error();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'vt-skip-cache') self.skipWaiting();
});