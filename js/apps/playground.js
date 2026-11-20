window.VT = window.VT || {};

/* PG · HTML/CSS/JS Playground — Frutiger Aero Web Lab
 * True 2000s browser simulation: preview is the HERO, editor is a tool panel.
 * Live iframe, Aero glass chrome, Frutiger Aero templates, console capture.
 */
VT.modules['playground'] = (() => {
  const U = VT.utils;
  const $ = U.$, $$ = U.$$, esc = U.esc;
  const t = (k, v) => VT.i18n.t(k, v);
  const toast = (m, ty) => VT.ui.toast(m, ty);
  const KEY = 'playground';
  const AUTOSAVE_ID = 'pg:autosave';
  const MAX_CONSOLE = 200;

  let alive = false;
  let refs = {};
  let autosave = null;
  let autoRun = true;
  let runTimer = null;
  let editorPanelOpen = true;
  let editors = { html: null, css: null, js: null };
  let simpleGutters = {};
  let currentTemplate = 'aero';
  let conCount = 0;
  let conErrors = 0;
  let zoomLevel = 1;

  // ---------- In-frame console shim ----------
  const SHIM = [
    '<' + 'script>(function(){',
    'function fmt(a){try{var args=Array.prototype.slice.call(a);if(args.length&&typeof args[0]==="string"&&args[0].indexOf("%c")>=0){args=args.filter(function(x,i){return !(i>0&&typeof x==="string"&&x.indexOf(";")>=0&&x.indexOf(":")>=0)});args[0]=args[0].replace(/%c/g,"")}return args.map(function(x){if(x&&typeof x==="object"){try{return JSON.stringify(x)}catch(e){return String(x)}}return String(x)}).join(" ")}catch(e){return "[unserializable]"}}',
    'function send(l,a){try{parent.postMessage({__pg:1,level:l,msg:fmt(a)},"*")}catch(e){}}',
    '["log","info","warn","error","debug"].forEach(function(k){window.console[k]=function(){send(k==="debug"?"log":k,arguments)}});',
    'window.addEventListener("error",function(e){send("error",[e.message+(e.lineno?(" (line "+e.lineno+")"):"")])});',
    'window.addEventListener("unhandledrejection",function(e){var r=e.reason;send("error",["Unhandled promise rejection: "+((r&&r.message)?r.message:String(r))])});',
    '})();</' + 'script>'
  ].join('');

  const guardScript = (js) => String(js).replace(/<\/(script)/gi, '<\\/$1');

  function buildSrcdoc(html, css, js) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<style>' + (css || '') + '</style></head><body>' +
      (html || '') + SHIM + '<' + 'script>' + guardScript(js || '') + '</' + 'script>' +
      '</body></html>';
  }

  // ---------- Frutiger Aero / Web 2.0 / Vista Templates ----------
  const TEMPLATES = {
    aero: {
      name: 'pg.tpl.aero',
      html: `<div class="aero-desktop">
  <div class="aero-window" id="main-window">
    <div class="aero-titlebar" id="titlebar">
      <div class="aero-titlebar-left">
        <div class="aero-window-icon">🌊</div>
        <div class="aero-window-title">Frutiger Aero Laboratory</div>
      </div>
      <div class="aero-window-controls">
        <button class="aero-btn-min" title="Minimize" aria-label="Minimize">─</button>
        <button class="aero-btn-max" title="Maximize" aria-label="Maximize">☐</button>
        <button class="aero-btn-close" title="Close" aria-label="Close">✕</button>
      </div>
    </div>
    <div class="aero-toolbar">
      <div class="aero-nav">
        <button class="aero-nav-btn back" disabled aria-label="Back">←</button>
        <button class="aero-nav-btn forward" disabled aria-label="Forward">→</button>
        <button class="aero-nav-btn reload" aria-label="Refresh">⟳</button>
        <button class="aero-nav-btn home" aria-label="Home">🏠</button>
      </div>
      <div class="aero-addressbar">
        <span class="aero-lock" title="Secure">🔒</span>
        <input type="text" value="https://aero.vistanology.local/welcome" readonly aria-label="Address">
      </div>
      <div class="aero-search">
        <input type="search" placeholder="Search the web..." aria-label="Search">
        <button class="aero-go">Go</button>
      </div>
    </div>
    <div class="aero-tabs">
      <button class="aero-tab active" data-tab="lab">🧪 Aero Lab</button>
      <button class="aero-tab" data-tab="docs">📖 Docs</button>
      <button class="aero-tab" data-tab="gallery">🖼️ Gallery</button>
      <button class="aero-tab-new" aria-label="New tab">+</button>
    </div>
    <div class="aero-content">
      <aside class="aero-sidebar">
        <div class="aero-panel glass">
          <h3>🧭 Navigation</h3>
          <ul>
            <li><a href="#" data-section="welcome">Welcome</a></li>
            <li><a href="#" data-section="principles">Aero Principles</a></li>
            <li><a href="#" data-section="colors">Color System</a></li>
            <li><a href="#" data-section="glass">Glass Effects</a></li>
            <li><a href="#" data-section="animation">Animation</a></li>
          </ul>
        </div>
        <div class="aero-panel glass">
          <h3>🎨 Quick Colors</h3>
          <div class="aero-swatch-row">
            <div class="aero-swatch" style="--c:#026DA7" title="Ocean Base"></div>
            <div class="aero-swatch" style="--c:#00D2FF" title="Cyan Light"></div>
            <div class="aero-swatch" style="--c:#5FE6FF" title="Aqua Glow"></div>
            <div class="aero-swatch" style="--c:#B29CFF" title="Violet Accent"></div>
            <div class="aero-swatch" style="--c:#A8FF78" title="Mint Green"></div>
            <div class="aero-swatch" style="--c:#FFC46B" title="Amber"></div>
          </div>
        </div>
        <div class="aero-panel glass">
          <h3>📊 Live Stats</h3>
          <div class="aero-stat"><span>FPS:</span><strong id="stat-fps">60</strong></div>
          <div class="aero-stat"><span>Elements:</span><strong id="stat-el">0</strong></div>
          <div class="aero-stat"><span>Memory:</span><strong id="stat-mem">0 KB</strong></div>
        </div>
      </aside>
      <main class="aero-main">
        <section class="aero-hero glass" id="welcome">
          <div class="aero-hero-bg"></div>
          <h1>Frutiger Aero Laboratory</h1>
          <p class="aero-tagline">Where code meets water, light, and glass</p>
          <div class="aero-hero-actions">
            <button class="aero-btn-primary" data-action="new">🧪 New Experiment</button>
            <button class="aero-btn-secondary" data-action="templates">📋 Templates</button>
          </div>
        </section>
        <section class="aero-section glass" id="principles" hidden>
          <h2>✨ Aero Design Principles</h2>
          <div class="aero-grid">
            <article class="aero-card glass"><h3>💎 Translucency</h3><p>Layers of glass that reveal depth without obscuring content.</p></article>
            <article class="aero-card glass"><h3>🌊 Fluid Motion</h3><p>Animations that flow like water — natural, responsive, alive.</p></article>
            <article class="aero-card glass"><h3>☀️ Luminosity</h3><p>Light that breathes. Highlights, caustics, reflections.</p></article>
            <article class="aero-card glass"><h3>🌈 Chromatic Depth</h3><p>Ocean blues, cyan lights, violet accents, mint highlights.</p></article>
            <article class="aero-card glass"><h3>🔮 Dimensionality</h3><p>Every surface has thickness. Every edge catches light.</p></article>
            <article class="aero-card glass"><h3>⚡ Responsiveness</h3><p>Instant feedback. No lag between thought and result.</p></article>
          </div>
        </section>
        <section class="aero-section glass" id="colors" hidden>
          <h2>🎨 Color System</h2>
          <div class="aero-palette">
            <div class="aero-color-group">
              <h3>Ocean Depths</h3>
              <div class="aero-swatches">
                <div class="aero-swatch-lg" style="background:#01294B" data-hex="#01294B"><code>#01294B</code></div>
                <div class="aero-swatch-lg" style="background:#013560" data-hex="#013560"><code>#013560</code></div>
                <div class="aero-swatch-lg" style="background:#014C79" data-hex="#014C79"><code>#014C79</code></div>
                <div class="aero-swatch-lg" style="background:#026DA7" data-hex="#026DA7"><code>#026DA7</code></div>
              </div>
            </div>
            <div class="aero-color-group">
              <h3>Luminous Cyan</h3>
              <div class="aero-swatches">
                <div class="aero-swatch-lg" style="background:#00D2FF" data-hex="#00D2FF"><code>#00D2FF</code></div>
                <div class="aero-swatch-lg" style="background:#58E6FF" data-hex="#58E6FF"><code>#58E6FF</code></div>
                <div class="aero-swatch-lg" style="background:#A0EFFF" data-hex="#A0EFFF"><code>#A0EFFF</code></div>
                <div class="aero-swatch-lg" style="background:#EAF7FF" data-hex="#EAF7FF"><code>#EAF7FF</code></div>
              </div>
            </div>
            <div class="aero-color-group">
              <h3>Accent Spectrum</h3>
              <div class="aero-swatches">
                <div class="aero-swatch-lg" style="background:#B29CFF" data-hex="#B29CFF"><code>#B29CFF</code> Violet</div>
                <div class="aero-swatch-lg" style="background:#FF5EA8" data-hex="#FF5EA8"><code>#FF5EA8</code> Magenta</div>
                <div class="aero-swatch-lg" style="background:#A8FF78" data-hex="#A8FF78"><code>#A8FF78</code> Mint</div>
                <div class="aero-swatch-lg" style="background:#FFC46B" data-hex="#FFC46B"><code>#FFC46B</code> Amber</div>
              </div>
            </div>
          </div>
        </section>
        <section class="aero-section glass" id="glass" hidden>
          <h2>🔮 Glass Effects</h2>
          <div class="aero-glass-demo">
            <div class="aero-glass-sample glass-1"><h4>Glass 1</h4><p>Light surface</p></div>
            <div class="aero-glass-sample glass-2"><h4>Glass 2</h4><p>Medium surface</p></div>
            <div class="aero-glass-sample glass-3"><h4>Glass 3</h4><p>Heavy surface</p></div>
            <div class="aero-glass-sample ocean"><h4>Ocean</h4><p>Dark field surface</p></div>
            <div class="aero-glass-sample ocean-2"><h4>Ocean 2</h4><p>Mid field surface</p></div>
            <div class="aero-glass-sample ocean-3"><h4>Ocean 3</h4><p>Deep field surface</p></div>
          </div>
        </section>
        <section class="aero-section glass" id="animation" hidden>
          <h2>⚡ Live Animation Lab</h2>
          <div class="aero-anim-stage">
            <div class="aero-orb" id="orb1"></div>
            <div class="aero-orb" id="orb2"></div>
            <div class="aero-orb" id="orb3"></div>
            <div class="aero-orb" id="orb4"></div>
            <div class="aero-orb" id="orb5"></div>
          </div>
          <div class="aero-anim-controls">
            <label><input type="range" id="anim-speed" min="0.1" max="3" step="0.1" value="1"> Speed: <span id="speed-val">1x</span></label>
            <label><input type="range" id="anim-count" min="3" max="20" step="1" value="5"> Orbs: <span id="count-val">5</span></label>
            <label><input type="checkbox" id="anim-trails" checked> Trails</label>
            <label><input type="checkbox" id="anim-glow" checked> Glow</label>
          </div>
        </section>
      </main>
    </div>
    <div class="aero-statusbar">
      <div class="aero-status-left">
        <span>🌊 Frutiger Aero Lab v1.0</span>
        <span class="aero-sep">|</span>
        <span id="status-msg">Ready</span>
      </div>
      <div class="aero-status-right">
        <span id="zoom-level">100%</span>
        <div class="aero-zoom-btns">
          <button aria-label="Zoom out">−</button>
          <button aria-label="Zoom in">+</button>
        </div>
      </div>
    </div>
  </div>
  <!-- Ambient bubbles -->
  <div class="aero-ambient" aria-hidden="true"></div>
</div>`,
      css: `@import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;500;600;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --ocean-900: #01294B; --ocean-800: #013560; --ocean-700: #014C79; --ocean-600: #026DA7;
  --ocean-500: #037BC4; --ocean-400: #0495E0; --ocean-300: #58E6FF; --ocean-200: #A0EFFF;
  --ocean-100: #EAF7FF; --ocean-50: #F3FAFE;
  --cyan: #00D2FF; --aqua: #5FE6FF; --mint: #A8FF78; --violet: #B29CFF;
  --magenta: #FF5EA8; --amber: #FFC46B; --coral: #FF6B6B;
  --glass-1: rgba(255,255,255,0.85); --glass-2: rgba(255,255,255,0.65);
  --glass-3: rgba(255,255,255,0.45); --glass-dark: rgba(10,20,40,0.7);
  --fg: #01294B; --fg-soft: #025080; --fg-muted: #036BA0;
}
html, body { height: 100%; overflow: hidden; font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(135deg, #01294B 0%, #026DA7 40%, #00D2FF 100%); color: var(--fg); }
.aero-desktop { display: flex; flex-direction: column; height: 100vh; width: 100vw; position: relative; }

/* ===== Ambient Background ===== */
.aero-ambient {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-image:
    radial-gradient(ellipse 80% 60% at 20% 10%, rgba(0,210,255,0.12), transparent),
    radial-gradient(ellipse 60% 40% at 80% 90%, rgba(178,156,255,0.08), transparent),
    radial-gradient(ellipse 40% 40% at 50% 50%, rgba(95,230,255,0.05), transparent);
  animation: ambientShift 20s ease-in-out infinite alternate;
}
@keyframes ambientShift {
  0% { transform: translate(0,0) scale(1); opacity: 0.8; }
  100% { transform: translate(-2%,2%) scale(1.02); opacity: 1; }
}

/* Floating bubbles */
.aero-ambient::before, .aero-ambient::after {
  content: ""; position: absolute; border-radius: 50%; opacity: 0.4;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(0,210,255,0.2) 60%, transparent);
  animation: bubbleRise 15s linear infinite;
}
.aero-ambient::before { width: 80px; height: 80px; left: 10%; bottom: -100px; animation-delay: 0s; }
.aero-ambient::after { width: 50px; height: 50px; right: 15%; bottom: -100px; animation-delay: -7s; }
@keyframes bubbleRise {
  0% { transform: translateY(0) scale(1); opacity: 0.4; }
  50% { opacity: 0.6; }
  100% { transform: translateY(-120vh) scale(0.8); opacity: 0; }
}

/* ===== Aero Window ===== */
.aero-window {
  flex: 1; display: flex; flex-direction: column;
  background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(245,250,255,0.9) 100%);
  border: 1px solid rgba(95,230,255,0.3);
  border-radius: 12px;
  box-shadow: 
    0 32px 80px rgba(0,0,0,0.25),
    0 8px 24px rgba(0,20,40,0.15),
    inset 0 1px 0 rgba(255,255,255,0.8),
    inset 0 -1px 0 rgba(0,20,40,0.05);
  backdrop-filter: blur(20px) saturate(150%);
  overflow: hidden;
  position: relative; z-index: 10;
  margin: 8px; max-width: calc(100vw - 16px); max-height: calc(100vh - 16px);
}

/* ===== Titlebar ===== */
.aero-titlebar {
  display: flex; align-items: center; justify-content: space-between;
  height: 38px; padding: 0 14px;
  background: linear-gradient(180deg, rgba(95,230,255,0.18) 0%, rgba(255,255,255,0.1) 50%, rgba(10,40,70,0.05) 100%);
  border-bottom: 1px solid rgba(95,230,255,0.25);
  -webkit-app-region: drag; user-select: none;
}
.aero-titlebar-left { display: flex; align-items: center; gap: 10px; }
.aero-window-icon { width: 20px; height: 20px; font-size: 16px; filter: drop-shadow(0 2px 4px rgba(0,210,255,0.3)); animation: iconFloat 3s ease-in-out infinite; }
@keyframes iconFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
.aero-window-title { font-size: 13px; font-weight: 600; color: var(--fg); text-shadow: 0 1px 0 rgba(255,255,255,0.6); letter-spacing: -0.01em; }
.aero-window-controls { display: flex; gap: 6px; -webkit-app-region: no-drag; }
.aero-titlebar button {
  width: 14px; height: 14px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.12);
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(230,235,245,0.8));
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 1px 2px rgba(0,0,0,0.1);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 9px; line-height: 1; color: #445; transition: all 0.15s ease;
}
.aero-titlebar button:hover { transform: scale(1.1); box-shadow: inset 0 1px 0 rgba(255,255,255,0.9), 0 0 8px rgba(95,230,255,0.4); }
.aero-btn-close { background: linear-gradient(180deg, #FC625D, #D14843) !important; border-color: #A83D3A !important; color: #fff !important; }
.aero-btn-close:hover { box-shadow: 0 0 12px rgba(252,98,93,0.6) !important; }
.aero-btn-max { background: linear-gradient(180deg, #34C84A, #28A73C) !important; border-color: #1E822F !important; color: #fff !important; }
.aero-btn-min { background: linear-gradient(180deg, #FBBC40, #E6AC2A) !important; border-color: #B88A20 !important; color: #fff !important; }

/* ===== Toolbar ===== */
.aero-toolbar {
  display: flex; align-items: center; gap: 10px;
  height: 48px; padding: 0 12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(245,250,255,0.85));
  border-bottom: 1px solid rgba(95,230,255,0.15);
}
.aero-nav { display: flex; gap: 2px; }
.aero-nav-btn {
  width: 28px; height: 28px; border-radius: 4px;
  border: 1px solid rgba(95,230,255,0.2);
  background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(240,245,255,0.8));
  cursor: pointer; font-size: 12px; color: var(--fg);
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
  transition: all 0.1s;
}
.aero-nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.aero-nav-btn:hover:not(:disabled) { background: rgba(95,230,255,0.12); border-color: rgba(95,230,255,0.4); box-shadow: 0 0 8px rgba(95,230,255,0.2); }
.aero-addressbar { flex: 1; max-width: 480px; display: flex; align-items: center; gap: 8px; }
.aero-lock { color: #34C84A; font-size: 11px; margin-left: 4px; }
.aero-addressbar input {
  flex: 1; padding: 6px 12px; border: 1px solid rgba(95,230,255,0.25);
  border-radius: 6px; background: rgba(10,20,35,0.85);
  color: var(--fg); font-size: 12px; font-family: 'Segoe UI', monospace;
  outline: none; transition: all 0.15s;
}
.aero-addressbar input:focus { border-color: var(--cyan); box-shadow: 0 0 0 3px rgba(0,210,255,0.15), inset 0 1px 2px rgba(0,0,0,0.05); }
.aero-search { display: flex; gap: 4px; }
.aero-search input { padding: 6px 12px; border: 1px solid rgba(95,230,255,0.25); border-radius: 6px; background: rgba(10,20,35,0.85); color: var(--fg); font-size: 11px; width: 180px; outline: none; }
.aero-go { padding: 6px 14px; border: 1px solid rgba(95,230,255,0.4); background: linear-gradient(180deg, rgba(95,230,255,0.2), rgba(10,60,100,0.3)); border-radius: 6px; color: var(--fg); cursor: pointer; font-size: 11px; font-weight: 500; }
.aero-go:hover { background: linear-gradient(180deg, rgba(95,230,255,0.3), rgba(10,80,120,0.4)); box-shadow: 0 0 10px rgba(95,230,255,0.2); }

/* ===== Tabs ===== */
.aero-tabs {
  display: flex; height: 30px; background: linear-gradient(180deg, rgba(255,255,255,0.04), transparent);
  border-bottom: 1px solid rgba(95,230,255,0.08); padding: 0 8px;
}
.aero-tab {
  padding: 4px 16px; border: 1px solid transparent; border-bottom: none;
  border-radius: 4px 4px 0 0; background: transparent; color: #88B0D0;
  font-size: 10px; font-weight: 500; cursor: pointer;
  margin-bottom: -1px; transition: all 0.1s;
}
.aero-tab.active { background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85)); border-color: rgba(95,230,255,0.3); border-bottom-color: transparent; color: var(--ocean-600); font-weight: 600; box-shadow: inset 0 1px 0 rgba(255,255,255,0.8); }
.aero-tab:hover:not(.active) { background: rgba(95,230,255,0.05); color: var(--cyan); }
.aero-tab-new { margin-left: auto; width: 22px; height: 22px; border: 1px solid rgba(95,230,255,0.2); border-radius: 4px; background: transparent; color: var(--cyan); font-size: 14px; cursor: pointer; }

/* ===== Content Area ===== */
.aero-content { display: flex; flex: 1; overflow: hidden; position: relative; }

/* ===== Sidebar ===== */
.aero-sidebar {
  width: 240px; flex-shrink: 0;
  background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(240,248,255,0.85));
  border-right: 1px solid rgba(95,230,255,0.15);
  padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;
}
.aero-panel { background: var(--glass-1); border: 1px solid rgba(95,230,255,0.18); border-radius: 10px; padding: 14px; backdrop-filter: blur(10px); }
.aero-panel h3 { margin: 0 0 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--cyan); font-weight: 600; display: flex; align-items: center; gap: 6px; }
.aero-panel ul { list-style: none; padding: 0; margin: 0; }
.aero-panel li { margin: 6px 0; }
.aero-panel a { color: var(--fg-soft); text-decoration: none; font-size: 12px; padding: 4px 8px; border-radius: 4px; display: block; transition: all 0.1s; }
.aero-panel a:hover { background: rgba(95,230,255,0.15); color: var(--cyan); }

/* Swatches */
.aero-swatch-row { display: flex; flex-wrap: wrap; gap: 6px; }
.aero-swatch { width: 28px; height: 28px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.4); box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 6px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.15s; }
.aero-swatch:hover { transform: scale(1.15); box-shadow: 0 0 12px currentColor; }
.aero-swatch-lg { width: 100%; height: 50px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.4); position: relative; overflow: hidden; box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 12px rgba(0,0,0,0.15); }
.aero-swatch-lg code { position: absolute; bottom: 4px; left: 8px; font-size: 9px; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); font-family: monospace; }

/* Stats */
.aero-stat { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(95,230,255,0.1); font-size: 11px; }
.aero-stat:last-child { border-bottom: none; }
.aero-stat span { color: var(--fg-muted); }
.aero-stat strong { color: var(--cyan); font-family: monospace; }

/* ===== Main Content ===== */
.aero-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 20px 24px; gap: 20px; }
.aero-hero {
  position: relative; padding: 60px 40px; text-align: center;
  background: linear-gradient(135deg, rgba(0,210,255,0.08), rgba(178,156,255,0.06), transparent);
  border: 1px solid rgba(95,230,255,0.2); border-radius: 16px; overflow: hidden;
}
.aero-hero-bg { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 0%, rgba(0,210,255,0.15), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(178,156,255,0.1), transparent 50%); pointer-events: none; }
.aero-hero h1 { margin: 0 0 12px; font-size: clamp(28px, 4vw, 42px); font-weight: 400; color: var(--fg); letter-spacing: -0.02em; background: linear-gradient(135deg, var(--ocean-600), var(--cyan), var(--violet)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.aero-tagline { margin: 0 0 28px; font-size: 16px; color: var(--fg-soft); line-height: 1.5; max-width: 500px; margin-left: auto; margin-right: auto; }
.aero-hero-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
.aero-btn-primary, .aero-btn-secondary {
  padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; border: 1px solid transparent;
}
.aero-btn-primary { background: linear-gradient(180deg, var(--ocean-600), var(--ocean-700)); border-color: rgba(95,230,255,0.4); color: #fff; box-shadow: 0 4px 16px rgba(2,109,167,0.4), inset 0 1px 0 rgba(255,255,255,0.2); }
.aero-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(2,109,167,0.5), inset 0 1px 0 rgba(255,255,255,0.3); }
.aero-btn-secondary { background: rgba(255,255,255,0.8); border: 1px solid rgba(95,230,255,0.3); color: var(--ocean-600); backdrop-filter: blur(10px); }
.aero-btn-secondary:hover { background: rgba(95,230,255,0.1); border-color: var(--cyan); }

.aero-section { animation: sectionEnter 0.4s ease-out both; }
@keyframes sectionEnter { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
.aero-section h2 { margin: 0 0 20px; font-size: 22px; font-weight: 500; color: var(--fg); display: flex; align-items: center; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid rgba(95,230,255,0.15); }
.aero-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.aero-card { padding: 20px; background: var(--glass-1); border: 1px solid rgba(95,230,255,0.15); border-radius: 12px; transition: all 0.2s; backdrop-filter: blur(10px); }
.aero-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,20,40,0.15); border-color: rgba(95,230,255,0.3); }
.aero-card h3 { margin: 0 0 8px; font-size: 14px; font-weight: 600; color: var(--fg); }
.aero-card p { margin: 0; font-size: 12px; color: var(--fg-soft); line-height: 1.5; }

/* Palette */
.aero-palette { display: flex; flex-direction: column; gap: 24px; }
.aero-color-group h3 { margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.6px; color: var(--fg-muted); }
.aero-swatches { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; }

/* Glass Demo */
.aero-glass-demo { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; }
.aero-glass-sample { padding: 24px; border-radius: 12px; text-align: center; border: 1px solid; transition: all 0.2s; }
.aero-glass-sample:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.15); }
.aero-glass-sample h4 { margin: 0 0 6px; font-size: 13px; font-weight: 600; }
.aero-glass-sample p { margin: 0; font-size: 11px; color: var(--fg-muted); }
.aero-glass-sample.glass-1 { background: linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.45)); border-color: rgba(255,255,255,0.4); color: #013050; }
.aero-glass-sample.glass-2 { background: linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.3)); border-color: rgba(255,255,255,0.3); color: #013050; }
.aero-glass-sample.glass-3 { background: linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.15)); border-color: rgba(255,255,255,0.2); color: #013050; }
.aero-glass-sample.ocean { background: linear-gradient(180deg, rgba(10,40,70,0.7), rgba(10,25,50,0.9)); border-color: rgba(95,230,255,0.25); color: var(--ocean-100); }
.aero-glass-sample.ocean-2 { background: linear-gradient(180deg, rgba(10,50,80,0.6), rgba(10,30,55,0.85)); border-color: rgba(95,230,255,0.2); color: var(--ocean-100); }
.aero-glass-sample.ocean-3 { background: linear-gradient(180deg, rgba(10,35,60,0.8), rgba(10,20,40,0.95)); border-color: rgba(95,230,255,0.15); color: var(--ocean-100); }

/* Animation Stage */
.aero-anim-stage { display: flex; justify-content: center; gap: 20px; padding: 40px 20px; min-height: 160px; }
.aero-orb {
  width: 60px; height: 60px; border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), var(--cyan) 60%, var(--ocean-600));
  box-shadow: 0 8px 24px rgba(0,210,255,0.4), inset 0 -4px 12px rgba(0,0,0,0.2), 0 0 30px rgba(0,210,255,0.3);
  animation: orbFloat 4s ease-in-out infinite;
}
.aero-orb:nth-child(1) { animation-delay: 0s; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), var(--cyan) 60%, var(--ocean-600)); }
.aero-orb:nth-child(2) { animation-delay: -0.8s; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), var(--violet) 60%, #6B4CFF); }
.aero-orb:nth-child(3) { animation-delay: -1.6s; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), var(--mint) 60%, #5DE06B); }
.aero-orb:nth-child(4) { animation-delay: -2.4s; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), var(--amber) 60%, #E0A040); }
.aero-orb:nth-child(5) { animation-delay: -3.2s; background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), var(--magenta) 60%, #E04080); }
@keyframes orbFloat { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } }
.aero-anim-controls { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; padding: 16px; background: var(--glass-1); border-radius: 10px; border: 1px solid rgba(95,230,255,0.15); font-size: 12px; }
.aero-anim-controls label { display: flex; align-items: center; gap: 8px; color: var(--fg-soft); cursor: pointer; }
.aero-anim-controls input[type="range"] { accent-color: var(--cyan); width: 120px; }
.aero-anim-controls input[type="checkbox"] { accent-color: var(--cyan); width: 16px; height: 16px; }

/* Statusbar */
.aero-statusbar { display: flex; justify-content: space-between; align-items: center; height: 28px; padding: 0 12px; background: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,250,255,0.8)); border-top: 1px solid rgba(95,230,255,0.1); font-size: 10px; color: var(--fg-muted); }
.aero-status-left { display: flex; align-items: center; gap: 10px; }
.aero-sep { color: rgba(95,230,255,0.3); }
.aero-status-right { display: flex; align-items: center; gap: 8px; }
.aero-zoom-btns button { width: 18px; height: 18px; border: 1px solid rgba(95,230,255,0.2); border-radius: 3px; background: rgba(255,255,255,0.6); cursor: pointer; font-size: 11px; display: flex; align-items: center; justify-content: center; }

/* Utility */
.hidden { display: none !important; }
code { font-family: 'Segoe UI', monospace; font-size: 0.85em; }

/* Responsive for iframe */
@media (max-width: 768px) {
  .aero-window { margin: 4px; border-radius: 8px; }
  .aero-titlebar { height: 34px; padding: 0 10px; }
  .aero-toolbar { height: 44px; padding: 0 8px; gap: 6px; }
  .aero-nav-btn { width: 26px; height: 26px; }
  .aero-addressbar { max-width: 280px; }
  .aero-search input { width: 120px; }
  .aero-sidebar { width: 200px; padding: 12px; }
  .aero-main { padding: 16px; gap: 16px; }
  .aero-hero { padding: 40px 24px; }
  .aero-hero h1 { font-size: 24px; }
  .aero-grid { grid-template-columns: 1fr; }
  .aero-swatches { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .aero-sidebar { display: none; } /* Could be a slide-out */
  .aero-toolbar { flex-wrap: wrap; height: auto; padding: 8px; gap: 6px; }
  .aero-nav { order: 1; }
  .aero-addressbar { order: 2; flex: 1 1 100%; max-width: none; }
  .aero-search { order: 3; flex: 1 1 100%; }
  .aero-search input { width: 100%; }
  .aero-hero { padding: 30px 16px; }
  .aero-hero h1 { font-size: 20px; }
  .aero-hero-actions { flex-direction: column; }
}
`,
      js: `// Frutiger Aero Laboratory - Interactive Demo
console.log('%c🌊 Frutiger Aero Laboratory', 'color: #00D2FF; font-size: 18px; font-weight: bold; text-shadow: 0 2px 8px rgba(0,210,255,0.4);');
console.log('%c✨ Aero Glass • Fluid Motion • Luminosity', 'color: #5FE6FF; font-size: 12px');
console.log('%c🎨 Ocean Depths → Cyan Light → Violet Accent', 'color: #B29CFF; font-size: 12px');

// ===== Navigation =====
document.querySelectorAll('.aero-panel a[data-section]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    document.querySelectorAll('.aero-section').forEach(s => s.hidden = true);
    document.querySelectorAll('.aero-panel a').forEach(a => a.style.background = '', a.style.color = '');
    const target = document.getElementById(section);
    if (target) { target.hidden = false; target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    link.style.background = 'rgba(95,230,255,0.15)'; link.style.color = '#00D2FF';
    console.log('Navigate to:', section);
  });
});

// Tab switching
document.querySelectorAll('.aero-tab[data-tab]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.aero-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    console.log('Tab:', tab.dataset.tab);
  });
});

// Hero buttons
document.querySelector('[data-action="new"]')?.addEventListener('click', () => {
  alert('🧪 New Experiment\\n\\nThis would open a blank canvas for your Aero creation!');
  console.log('New experiment requested');
});
document.querySelector('[data-action="templates"]')?.addEventListener('click', () => {
  const sections = document.getElementById('principles');
  if (sections) { sections.hidden = false; sections.scrollIntoView({ behavior: 'smooth' }); }
  console.log('Templates panel opened');
});

// ===== Live Stats =====
let frameCount = 0; let lastTime = performance.now();
function updateStats() {
  frameCount++; const now = performance.now();
  if (now - lastTime >= 1000) {
    const fps = Math.round(frameCount * 1000 / (now - lastTime));
    document.getElementById('stat-fps').textContent = fps;
    document.getElementById('stat-el').textContent = document.querySelectorAll('*').length;
    document.getElementById('stat-mem').textContent = Math.round((performance.memory?.usedJSHeapSize || 0) / 1024) + ' KB';
    frameCount = 0; lastTime = now;
  }
  requestAnimationFrame(updateStats);
}
updateStats();

// ===== Animation Lab =====
const orbs = document.querySelectorAll('.aero-orb');
const speedInput = document.getElementById('anim-speed');
const countInput = document.getElementById('anim-count');
const speedVal = document.getElementById('speed-val');
const countVal = document.getElementById('count-val');
const trailsCheck = document.getElementById('anim-trails');
const glowCheck = document.getElementById('anim-glow');

let animSpeed = 1; let orbCount = 5; let trails = true; let glow = true;

speedInput?.addEventListener('input', () => { animSpeed = parseFloat(speedInput.value); speedVal.textContent = animSpeed + 'x'; orbs.forEach(o => { o.style.animationDuration = (4 / animSpeed) + 's'; }); });
countInput?.addEventListener('input', () => { orbCount = parseInt(countInput.value); countVal.textContent = orbCount; updateOrbVisibility(); });
trailsCheck?.addEventListener('change', () => { trails = trailsCheck.checked; updateTrailStyle(); });
glowCheck?.addEventListener('change', () => { glow = glowCheck.checked; updateGlowStyle(); });

function updateOrbVisibility() { orbs.forEach((orb, i) => { orb.style.display = i < orbCount ? 'block' : 'none'; }); }
function updateTrailStyle() { orbs.forEach(o => { o.style.boxShadow = trails ? '0 8px 24px rgba(0,210,255,0.4), inset 0 -4px 12px rgba(0,0,0,0.2), 0 0 30px rgba(0,210,255,0.3)' : '0 8px 24px rgba(0,210,255,0.3), inset 0 -4px 12px rgba(0,0,0,0.15)'; }); }
function updateGlowStyle() { orbs.forEach(o => { o.style.filter = glow ? 'drop-shadow(0 0 20px currentColor)' : 'none'; }); }

// Window controls
document.querySelector('.aero-btn-close')?.addEventListener('click', () => console.log('Close window'));
document.querySelector('.aero-btn-max')?.addEventListener('click', () => console.log('Maximize'));
document.querySelector('.aero-btn-min')?.addEventListener('click', () => console.log('Minimize'));

// Nav buttons
document.querySelector('.aero-nav-btn.reload')?.addEventListener('click', () => { console.log('Reload'); location.reload(); });
document.querySelector('.aero-nav-btn.home')?.addEventListener('click', () => console.log('Home'));

// Search
document.querySelector('.aero-go')?.addEventListener('click', () => { const q = document.querySelector('.aero-search input').value; console.log('Search:', q); });
document.querySelector('.aero-search input')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.querySelector('.aero-go').click(); });

// Color swatch clicks
document.querySelectorAll('.aero-swatch, .aero-swatch-lg').forEach(s => {
  s.addEventListener('click', () => {
    const color = s.style.backgroundColor || s.style.background;
    console.log('Color picked:', color);
    navigator.clipboard.writeText(color).then(() => console.log('Copied:', color));
  });
});

// Status messages
const statuses = ['Ready', 'Rendering...', 'Aero Glass Active', '60 FPS', 'Glass: Ocean', 'Luminosity: High'];
let si = 0;
setInterval(() => { document.getElementById('status-msg').textContent = statuses[si = (si + 1) % statuses.length]; }, 3000);

// Zoom buttons
document.querySelectorAll('.aero-zoom-btns button').forEach((btn, i) => {
  btn.addEventListener('click', () => { console.log(i === 0 ? 'Zoom out' : 'Zoom in'); });
});

console.log('%c✅ Aero Laboratory Ready — Welcome to the future of 2000s web', 'color: #A8FF78; font-size: 13px; font-weight: bold;');`,
    },
    portal: {
      name: 'pg.tpl.portal',
      html: `<div class="portal-desktop">
  <div class="portal-taskbar" id="taskbar">
    <button class="portal-start" id="startBtn"><span class="start-flag">🏁</span><span>Start</span></button>
    <div class="portal-quicklaunch">
      <button class="ql-btn" title="Internet Explorer" data-app="ie">🌐</button>
      <button class="ql-btn" title="Outlook Express" data-app="oe">📧</button>
      <button class="ql-btn" title="Windows Media Player" data-app="wmp">🎵</button>
      <button class="ql-btn" title="My Computer" data-app="explorer">💻</button>
    </div>
    <div class="portal-taskband" id="taskband"></div>
    <div class="portal-tray">
      <span class="tray-item" title="Volume">🔊</span>
      <span class="tray-item" title="Network">📡</span>
      <span class="tray-clock" id="trayClock">2:41 PM</span>
    </div>
  </div>
  <div class="portal-window" id="ieWindow" data-app="ie">
    <div class="portal-titlebar">
      <div class="portal-titlebar-left">
        <div class="portal-icon">🌐</div>
        <div class="portal-title">MSN.com - Microsoft Internet Explorer</div>
      </div>
      <div class="portal-controls">
        <button class="p-btn min" aria-label="Minimize">_</button>
        <button class="p-btn max" aria-label="Maximize">□</button>
        <button class="p-btn close" aria-label="Close">×</button>
      </div>
    </div>
    <div class="portal-menubar">
      <span class="p-menu">File</span>
      <span class="p-menu">Edit</span>
      <span class="p-menu">View</span>
      <span class="p-menu">Favorites</span>
      <span class="p-menu">Tools</span>
      <span class="p-menu">Help</span>
    </div>
    <div class="portal-toolbar">
      <div class="p-nav">
        <button class="p-tbtn back" disabled title="Back">←</button>
        <button class="p-tbtn forward" disabled title="Forward">→</button>
        <button class="p-tbtn stop" title="Stop">⬜</button>
        <button class="p-tbtn refresh" title="Refresh">⟳</button>
        <button class="p-tbtn home" title="Home">🏠</button>
        <button class="p-tbtn search" title="Search">🔍</button>
        <button class="p-tbtn favorites" title="Favorites">⭐</button>
        <button class="p-tbtn history" title="History">📜</button>
      </div>
      <div class="p-address">
        <label>Address</label>
        <input type="text" value="https://www.msn.com/" readonly>
      </div>
    </div>
    <div class="portal-tabs">
      <button class="p-tab active">MSN.com</button>
      <button class="p-tab">Hotmail</button>
      <button class="p-tab">Search</button>
      <button class="p-tab-new">+</button>
    </div>
    <div class="portal-content">
      <div class="portal-sidebar">
        <div class="p-panel">
          <h3>📰 Today on MSN</h3>
          <ul>
            <li>🌤️ Weather: Sunny, 72°F</li>
            <li>📈 Stocks: MSFT +2.3%</li>
            <li>📰 Top Story: Windows Vista Launch</li>
            <li>🎮 Games: New Xbox Live Arcade</li>
          </ul>
        </div>
        <div class="p-panel">
          <h3>🔗 Quick Links</h3>
          <ul>
            <li><a href="#">Hotmail</a></li>
            <li><a href="#">MSN Messenger</a></li>
            <li><a href="#">MSN Spaces</a></li>
            <li><a href="#">MSN Groups</a></li>
            <li><a href="#">Shopping</a></li>
          </ul>
        </div>
      </div>
      <div class="portal-main">
        <div class="p-hero">
          <h1>Welcome to MSN</h1>
          <p>Your window to the world of information</p>
          <button class="p-btn-primary">Sign in to Hotmail</button>
        </div>
        <div class="p-news">
          <article class="p-article"><h3>💻 Windows Vista Released to Manufacturing</h3><p>The long-awaited Windows Vista has reached RTM. Featuring Aero Glass, Sidebar gadgets, and a completely redesigned UI...</p></article>
          <article class="p-article"><h3>🎵 Zune Challenges iPod Dominance</h3><p>Microsoft enters the portable media player market with the Zune, featuring wireless sharing and FM radio...</p></article>
          <article class="p-article"><h3>🌐 Internet Explorer 7: Tabbed Browsing Arrives</h3><p>After years of waiting, IE7 brings tabbed browsing, RSS support, and improved security...</p></article>
        </div>
      </div>
    </div>
    <div class="portal-statusbar">
      <span>Done</span>
      <span class="p-zone">🔒 Secure | </span>
      <span class="p-zoom">100%</span>
    </div>
  </div>
  <div class="portal-window" id="explorerWindow" data-app="explorer" style="top: 80px; left: 400px; width: 500px; height: 400px;">
    <div class="portal-titlebar">
      <div class="portal-titlebar-left"><div class="portal-icon">💻</div><div class="portal-title">My Computer</div></div>
      <div class="portal-controls"><button class="p-btn min">_</button><button class="p-btn max">□</button><button class="p-btn close">×</button></div>
    </div>
    <div class="portal-toolbar"><div class="p-address"><label>Address</label><input type="text" value="My Computer" readonly></div></div>
    <div class="portal-content explorer-view">
      <div class="exp-sidebar"><h4>System Tasks</h4><ul><li>📁 View system information</li><li>⚙️ Add or remove programs</li><li>🔧 Change a setting</li></ul><h4>Other Places</h4><ul><li>💾 Local Disk (C:)</li><li>📀 CD Drive (D:)</li><li>🌐 My Network Places</li></ul><h4>Details</h4><ul><li>💻 Intel Pentium 4</li><li>🧠 1.00 GB RAM</li></ul></div>
      <div class="exp-main"><div class="exp-item"><span class="exp-icon">💾</span><span>Local Disk (C:)</span></div><div class="exp-item"><span class="exp-icon">💾</span><span>Data (D:)</span></div><div class="exp-item"><span class="exp-icon">📀</span><span>CD Drive (E:)</span></div><div class="exp-item"><span class="exp-icon">📁</span><span>Shared Documents</span></div></div>
    </div>
  </div>
</div>`,
      css: `@import url('https://fonts.googleapis.com/css2?family=Tahoma:wght@400;700&family=Trebuchet+MS:wght@400;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; font-family: Tahoma, 'Trebuchet MS', sans-serif; background: #0A246A url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Cpath d='M0 0h4v4H0z' fill='%2314348C'/%3E%3C/svg%3E") repeat; background-size: 4px 4px; color: #000; overflow: hidden; }
.portal-desktop { position: relative; height: 100vh; width: 100vw; }
.portal-taskbar { position: fixed; bottom: 0; left: 0; right: 0; height: 30px; background: linear-gradient(180deg, #C0D8F0 0%, #A8C8E8 50%, #8AA8D8 100%); border-top: 1px solid #FFFFFF; border-bottom: 1px solid #4A6A9A; display: flex; align-items: center; padding: 0 4px; z-index: 1000; box-shadow: 0 -2px 4px rgba(0,0,0,0.2); }
.portal-start { display: flex; align-items: center; gap: 4px; height: 24px; padding: 0 8px 0 6px; background: linear-gradient(180deg, #E8F0FA 0%, #D0E0F0 50%, #B8D0E8 100%); border: 1px solid; border-color: #FFFFFF #7A9AC8 #5A7AC8 #A8C8E8; cursor: pointer; font-family: Tahoma; font-size: 11px; font-weight: 700; color: #000; transition: all 0.1s; }
.portal-start:hover { background: linear-gradient(180deg, #FFFFFF, #E0E8F0); }
.portal-start .start-flag { width: 16px; height: 16px; background: linear-gradient(45deg, #0054E3 0%, #0054E3 50%, #FFD700 50%, #FFD700 100%); border: 1px solid #0038A0; margin-right: 2px; }
.portal-quicklaunch { display: flex; gap: 2px; margin-left: 4px; }
.ql-btn { width: 24px; height: 24px; border: 1px solid; border-color: #FFFFFF #7A9AC8 #5A7AC8 #A8C8E8; background: linear-gradient(180deg, #E8F0FA, #D0E0F0); cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
.ql-btn:hover { background: linear-gradient(180deg, #FFFFFF, #E8F0FA); border-color: #FFFFFF #5A7AC8 #3A5AB8 #88A8D8; }
.ql-btn:active { background: linear-gradient(180deg, #C8D8F0, #E8F0FA); border-color: #5A7AC8 #FFFFFF #FFFFFF #5A7AC8; }
.portal-taskband { flex: 1; display: flex; gap: 2px; overflow: hidden; }
.portal-tray { display: flex; align-items: center; gap: 6px; padding-right: 8px; font-family: Tahoma; font-size: 10px; color: #000; }
.tray-item { padding: 2px 4px; cursor: pointer; border-radius: 2px; }
.tray-item:hover { background: rgba(255,255,255,0.3); }
.tray-clock { font-weight: 700; font-family: Tahoma; min-width: 60px; text-align: right; }

.portal-window { position: absolute; background: #D4D0C8; border: 1px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; box-shadow: 2px 2px 8px rgba(0,0,0,0.3); min-width: 300px; min-height: 200px; z-index: 10; }
.portal-titlebar { display: flex; justify-content: space-between; align-items: center; height: 22px; background: linear-gradient(90deg, #000080, #1030A0); color: #FFF; font-family: Tahoma; font-size: 11px; font-weight: 700; padding: 0 4px; cursor: default; }
.portal-titlebar-left { display: flex; align-items: center; gap: 4px; }
.portal-icon { width: 16px; height: 16px; margin-left: 2px; }
.portal-controls { display: flex; gap: 2px; margin-right: 2px; }
.p-btn { width: 16px; height: 16px; border: 1px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; background: #D4D0C8; font-family: 'Marlett', sans-serif; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.p-btn:hover { background: #E8E4DC; }
.p-btn:active { border-color: #808080 #FFFFFF #FFFFFF #808080; }
.p-btn.close { font-family: Tahoma; font-weight: 700; font-size: 11px; line-height: 1; }
.portal-menubar { display: flex; background: #D4D0C8; border-bottom: 1px solid; border-color: #FFFFFF #808080; padding: 0 4px; height: 20px; }
.p-menu { padding: 2px 8px; cursor: default; font-family: Tahoma; font-size: 11px; color: #000; }
.p-menu:hover { background: #000080; color: #FFF; }
.portal-toolbar { display: flex; align-items: center; gap: 2px; padding: 2px 4px; background: #D4D0C8; border-bottom: 1px solid; border-color: #FFFFFF #808080; }
.p-nav { display: flex; gap: 1px; }
.p-tbtn { width: 24px; height: 22px; border: 1px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; background: #D4D0C8; cursor: pointer; font-family: 'Marlett', sans-serif; font-size: 10px; display: flex; align-items: center; justify-content: center; }
.p-tbtn:disabled { opacity: 0.4; cursor: default; }
.p-tbtn:hover:not(:disabled) { border-color: #FFFFFF #808080 #808080 #FFFFFF; background: #E8E4DC; }
.p-tbtn:active { border-color: #808080 #FFFFFF #FFFFFF #808080; }
.p-address { display: flex; align-items: center; gap: 4px; flex: 1; }
.p-address label { font-family: Tahoma; font-size: 11px; color: #000; white-space: nowrap; }
.p-address input { flex: 1; height: 20px; border: 1px inset #FFFFFF; border-color: #FFFFFF #808080 #808080 #FFFFFF; background: #FFF; font-family: Tahoma; font-size: 11px; padding: 0 4px; color: #000; }
.portal-tabs { display: flex; background: #D4D0C8; border-bottom: 1px solid #808080; }
.p-tab { padding: 2px 12px; border: 1px solid transparent; border-bottom: none; border-radius: 0; background: #D4D0C8; color: #000; font-family: Tahoma; font-size: 11px; cursor: default; margin-bottom: -1px; }
.p-tab.active { border: 1px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; border-bottom: 1px solid #D4D0C8; margin-bottom: -1px; }
.p-tab-new { margin-left: auto; width: 18px; height: 18px; border: 1px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; background: #D4D0C8; font-family: Tahoma; font-size: 12px; cursor: pointer; }
.portal-content { display: flex; flex: 1; overflow: hidden; background: #D4D0C8; }
.portal-sidebar { width: 180px; flex-shrink: 0; background: #D4D0C8; border-right: 1px solid #808080; padding: 8px; overflow-y: auto; }
.p-panel { background: #D4D0C8; border: 1px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; margin-bottom: 8px; }
.p-panel h3 { padding: 4px 8px; margin: 0; font-family: Tahoma; font-size: 11px; font-weight: 700; color: #000; background: linear-gradient(90deg, #000080, #1030A0); color: #FFF; margin: -1px -1px 0 -1px; border: 1px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; }
.p-panel ul { list-style: none; padding: 4px 8px; margin: 0; font-family: Tahoma; font-size: 11px; }
.p-panel li { margin: 3px 0; }
.p-panel a { color: #0000CC; text-decoration: none; }
.p-panel a:hover { text-decoration: underline; }
.portal-main { flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px; }
.p-hero { text-align: center; padding: 20px; background: linear-gradient(135deg, #E8F0FA 0%, #FFFFFF 100%); border: 1px solid #A8C8E8; }
.p-hero h1 { margin: 0 0 8px; font-family: 'Trebuchet MS'; font-size: 22px; color: #003366; }
.p-hero p { margin: 0 0 16px; color: #333; font-family: Tahoma; font-size: 12px; }
.p-btn-primary { padding: 6px 16px; background: linear-gradient(180deg, #0066CC, #004499); border: 1px solid #003388; color: #FFF; font-family: Tahoma; font-size: 11px; font-weight: 700; cursor: pointer; }
.p-news { display: flex; flex-direction: column; gap: 10px; }
.p-article { background: #FFF; border: 1px solid #C0C0C0; padding: 12px; }
.p-article h3 { margin: 0 0 6px; font-family: Tahoma; font-size: 12px; color: #003366; }
.p-article p { margin: 0; font-family: Tahoma; font-size: 11px; color: #333; line-height: 1.5; }
.explorer-view { display: flex; height: 100%; }
.exp-sidebar { width: 180px; background: #D4D0C8; border-right: 1px solid #808080; padding: 8px; overflow-y: auto; }
.exp-sidebar h4 { margin: 8px 0 4px; font-family: Tahoma; font-size: 11px; font-weight: 700; color: #000; }
.exp-sidebar ul { list-style: none; padding-left: 12px; margin: 0; font-family: Tahoma; font-size: 11px; }
.exp-sidebar li { margin: 2px 0; cursor: pointer; }
.exp-main { flex: 1; padding: 8px; display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; }
.exp-item { display: flex; align-items: center; gap: 6px; width: 120px; padding: 4px; cursor: pointer; font-family: Tahoma; font-size: 11px; }
.exp-item:hover { background: #000080; color: #FFF; }
.exp-icon { font-size: 16px; }
.portal-statusbar { height: 20px; background: #D4D0C8; border-top: 1px solid; border-color: #FFFFFF #808080; display: flex; justify-content: space-between; align-items: center; padding: 0 8px; font-family: Tahoma; font-size: 10px; color: #000; }
.p-zone { color: #000080; }
.p-zoom { font-family: Tahoma; font-weight: 700; }

/* Window dragging simulation */
.portal-window { transition: box-shadow 0.1s; }
.portal-window:hover { box-shadow: 4px 4px 16px rgba(0,0,0,0.4); }
`,
      js: `// MSN Portal 2005 / Windows XP Simulation
console.log('%c🌐 MSN Portal - Internet Explorer 6.0', 'color: #0054E3; font-size: 14px; font-weight: bold;');
console.log('%c💻 Windows XP Professional - Build 2600', 'color: #003366; font-size: 11px');
console.log('%c🌐 MSN.com - Your window to the world', 'color: #0066CC; font-size: 11px');

// Live clock
function updateClock() { const c=document.getElementById('trayClock'); if(c){ const n=new Date(); c.textContent=n.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}); } }
updateClock(); setInterval(updateClock, 1000);

// Window dragging
let dragged=null, offset={x:0,y:0}, z=100;
document.querySelectorAll('.portal-titlebar').forEach(t=>{ t.addEventListener('mousedown',e=>{ if(e.target.closest('.p-btn')) return; dragged=t.closest('.portal-window'); const r=dragged.getBoundingClientRect(); offset.x=e.clientX-r.left; offset.y=e.clientY-r.top; dragged.style.zIndex=++z; e.preventDefault(); }); });
document.addEventListener('mousemove',e=>{ if(dragged){ dragged.style.left=(e.clientX-offset.x)+'px'; dragged.style.top=(e.clientY-offset.y)+'px'; } });
document.addEventListener('mouseup',()=>dragged=null);

// Window controls
document.querySelectorAll('.p-btn.close').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); const w=e.target.closest('.portal-window'); w.style.display='none'; console.log('Closed:',w.id); }));
document.querySelectorAll('.p-btn.min').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); const w=e.target.closest('.portal-window'); w.style.animation='winMin 0.3s ease-in forwards'; setTimeout(()=>w.style.display='none',300); }));
document.querySelectorAll('.p-btn.max').forEach(b=>b.addEventListener('click',e=>{ e.stopPropagation(); const w=e.target.closest('.portal-window'); w.style.width='100%'; w.style.height='calc(100% - 30px)'; w.style.top='0'; w.style.left='0'; }));
const s=document.createElement('style'); s.textContent='@keyframes winMin{0%{transform:scale(1);opacity:1}100%{transform:scale(0.1) translateY(100px);opacity:0}}'; document.head.appendChild(s);

// Taskbar buttons
document.querySelectorAll('.ql-btn').forEach(b=>{ b.addEventListener('click',()=>{ const app=b.dataset.app; const w=document.getElementById(app+'Window'); if(w){ w.style.display='block'; w.style.zIndex=++z; console.log('Open:',app); } }); });

// Start button
document.getElementById('startBtn')?.addEventListener('click',()=>alert('Start Menu\\n\\nPrograms\\nDocuments\\nSettings\\nSearch\\nRun\\n\\nShut Down'));

// Toolbar buttons
document.querySelector('.p-tbtn.refresh')?.addEventListener('click',()=>location.reload());
document.querySelector('.p-tbtn.home')?.addEventListener('click',()=>console.log('Home'));
document.querySelector('.p-tbtn.search')?.addEventListener('click',()=>console.log('Search'));

// Tab switching
document.querySelectorAll('.p-tab').forEach(t=>{ t.addEventListener('click',()=>{ document.querySelectorAll('.p-tab').forEach(x=>x.classList.remove('active')); t.classList.add('active'); console.log('Tab:',t.textContent); }); });

console.log('%c✅ MSN Portal Ready — Welcome to 2005', 'color: #0054E3; font-size: 12px; font-weight: bold;');`,
    },
    web20: {
      name: 'pg.tpl.web20',
      html: `<div class="web20-site">
  <header class="web20-header">
    <div class="web20-logo">
      <span class="logo-bubble">✦</span>
      <span class="logo-text">My<span>Space</span></span>
      <span class="logo-beta">BETA</span>
    </div>
    <nav class="web20-nav">
      <a href="#" class="active">Home</a>
      <a href="#">Profile</a>
      <a href="#">Friends</a>
      <a href="#">Blog</a>
      <a href="#">Photos</a>
      <a href="#">Music</a>
      <a href="#">Videos</a>
      <a href="#">Groups</a>
      <a href="#">Events</a>
    </nav>
    <div class="web20-search">
      <input type="search" placeholder="Search for people...">
      <button>Search</button>
    </div>
  </header>
  <div class="web20-body">
    <aside class="web20-sidebar">
      <div class="web20-module glass">
        <h3>👤 About Me</h3>
        <div class="web20-avatar">🎭</div>
        <p class="web20-user">Alex Rider</p>
        <p class="web20-location">📍 Seattle, WA</p>
        <div class="web20-stats">
          <span>👥 847 friends</span>
          <span>📸 234 photos</span>
          <span>🎵 56 songs</span>
        </div>
      </div>
      <div class="web20-module glass">
        <h3>🎵 Music Player</h3>
        <div class="web20-player">
          <div class="web20-track">Dashboard - Modest Mouse</div>
          <div class="web20-progress"><div class="web20-bar" style="width: 45%"></div></div>
          <div class="web20-controls">
            <button>⏮</button>
            <button class="play">⏸</button>
            <button>⏭</button>
          </div>
        </div>
      </div>
      <div class="web20-module glass">
        <h3>📅 Calendar</h3>
        <div class="web20-cal">Aug 2007</div>
      </div>
      <div class="web20-module glass">
        <h3>💬 Comments</h3>
        <div class="web20-minicomment">
          <div class="mc-avatar">😎</div>
          <div class="mc-text"><strong>Jessica</strong> OMG that concert was amazing!</div>
        </div>
        <div class="web20-minicomment">
          <div class="mc-avatar">🤘</div>
          <div class="mc-text"><strong>Mike</strong> Nice layout!!</div>
        </div>
        <div class="web20-minicomment">
          <div class="mc-avatar">💕</div>
          <div class="mc-text"><strong>Sarah</strong> Teach me the glitter thing!</div>
        </div>
      </div>
    </aside>
    <main class="web20-main">
      <div class="web20-module glass web20-hero">
        <h2>Welcome to my profile! 🌟</h2>
        <p>Thanks for stopping by! This is my little corner of the internet. Feel free to leave a comment, check out my photos, or listen to my playlist!</p>
        <div class="web20-badges">
          <span class="badge">🌈 Rainbow Theme</span>
          <span class="badge">💖 glitter graphics</span>
          <span class="badge">✨ custom cursor</span>
          <span class="badge">🎵 autoplay music</span>
          <span class="badge">🖼️ photo slideshow</span>
        </div>
      </div>
      <div class="web20-module glass">
        <h3>📝 Latest Blog Entry</h3>
        <div class="web20-blog-meta">Posted <strong>2 hours ago</strong> • <a href="#">5 comments</a></div>
        <p>Just got back from the concert last night! The energy was absolutely incredible. The light show, the crowd, the music... everything was perfect. Still ringing in my ears but totally worth it.</p>
        <p>Currently working on my new layout — trying to get the perfect combination of glitter backgrounds, custom scrollbars, and that one song that plays automatically. You know the one.</p>
        <div class="web20-tags">Tags: <a href="#">music</a>, <a href="#">concert</a>, <a href="#">life</a>, <a href="#">awesome</a></div>
      </div>
      <div class="web20-module glass">
        <h3>💬 Comments</h3>
        <div class="web20-comment">
          <div class="web20-comment-avatar">😎</div>
          <div class="web20-comment-body">
            <strong>Jessica</strong> <span>3 hours ago</span>
            <p>OMG that sounds amazing!!! Wish I could've gone!</p>
          </div>
        </div>
        <div class="web20-comment">
          <div class="web20-comment-avatar">🤘</div>
          <div class="web20-comment-body">
            <strong>Mike</strong> <span>2 hours ago</span>
            <p>Nice! What songs did they play?</p>
          </div>
        </div>
        <div class="web20-comment">
          <div class="web20-comment-avatar">💕</div>
          <div class="web20-comment-body">
            <strong>Sarah</strong> <span>1 hour ago</span>
            <p>Your layout is so cute!! Can you teach me how to do the glitter thing?</p>
          </div>
        </div>
      </div>
      <div class="web20-module glass">
        <h3>📸 Latest Photos</h3>
        <div class="web20-gallery">
          <div class="web20-photo">📷</div>
          <div class="web20-photo">📷</div>
          <div class="web20-photo">📷</div>
          <div class="web20-photo">📷</div>
        </div>
      </div>
    </main>
  </div>
  <footer class="web20-footer">
    © 2007 MySpace.com • <a href="#">Terms</a> • <a href="#">Privacy</a> • <a href="#">Safety Tips</a> • <a href="#">Contact</a>
  </footer>
</div>`,
      css: `@import url('https://fonts.googleapis.com/css2?family=Verdana:wght@400;700&family=Trebuchet+MS:wght@400;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; font-family: 'Trebuchet MS', Verdana, sans-serif; background: #8A2BE2 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M0 0h100v100H0z' fill='%237B1FA2'/%3E%3Cpath d='M0 0h50v50H0zM50 50h50v50H50z' fill='%239C27B0'/%3E%3C/svg%3E") repeat; background-size: 60px 60px; color: #2A2A2A; overflow: auto; }
.web20-site { max-width: 980px; margin: 10px auto; background: #FFF; border: 2px solid #FF00FF; border-radius: 4px; box-shadow: 0 0 30px rgba(255,0,255,0.3), inset 0 1px 0 rgba(255,255,255,0.5); min-height: 100vh; }
.web20-header { background: linear-gradient(90deg, #FF00FF, #8A2BE2, #00FFFF); padding: 10px 15px; border-bottom: 3px double #FFF; position: relative; }
.web20-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #FF00FF, #FFFF00, #00FFFF, #FF00FF); background-size: 200% 100%; animation: shimmer 3s linear infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.web20-logo { display: flex; align-items: center; gap: 8px; }
.logo-bubble { font-size: 28px; text-shadow: 2px 2px 0 #FFF, 4px 4px 0 #FF00FF; animation: float 2s ease-in-out infinite; }
@keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-4px) rotate(3deg); } }
.logo-text { font-size: 26px; font-weight: 700; color: #FFF; text-shadow: 2px 2px 0 #8A2BE2, 4px 4px 0 #000; }
.logo-text span { color: #FFFF00; text-shadow: 2px 2px 0 #FF00FF, 4px 4px 0 #000; }
.logo-beta { background: #FF00FF; color: #FFF; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px; margin-left: 8px; animation: pulse 1s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
.web20-nav { display: flex; gap: 4px; margin: 10px 0; flex-wrap: wrap; }
.web20-nav a { background: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.5); padding: 4px 12px; border-radius: 12px; color: #FFF; text-decoration: none; font-size: 11px; font-weight: 700; text-transform: uppercase; transition: all 0.1s; }
.web20-nav a.active, .web20-nav a:hover { background: #FFF; color: #8A2BE2; }
.web20-search { display: flex; gap: 4px; margin-top: 8px; }
.web20-search input { padding: 4px 8px; border: 1px solid #8A2BE2; border-radius: 3px; font-size: 11px; width: 180px; }
.web20-search button { background: #FF00FF; border: 1px solid #FFF; color: #FFF; padding: 4px 10px; border-radius: 3px; font-size: 11px; cursor: pointer; }
.web20-body { display: flex; padding: 15px; gap: 15px; }
.web20-sidebar { width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 15px; }
.web20-module { background: #FFF; border: 2px solid; border-radius: 8px; padding: 12px; position: relative; }
.web20-module.glass { background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.7)); border: 1px solid rgba(255,255,255,0.5); box-shadow: 0 4px 16px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8); backdrop-filter: blur(10px); }
.web20-module:nth-child(1) { border-color: #FF00FF; }
.web20-module:nth-child(2) { border-color: #00FFFF; }
.web20-module:nth-child(3) { border-color: #FFFF00; }
.web20-module:nth-child(4) { border-color: #FF6600; }
.web20-module h3 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }
.web20-module:nth-child(1) h3 { color: #FF00FF; }
.web20-module:nth-child(2) h3 { color: #00FFFF; }
.web20-module:nth-child(3) h3 { color: #CC9900; }
.web20-module:nth-child(4) h3 { color: #FF6600; }
.web20-avatar { width: 80px; height: 80px; border: 3px solid #FF00FF; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 36px; background: linear-gradient(135deg, #FFE6FF, #E6FFFF); box-shadow: 0 4px 12px rgba(255,0,255,0.3); }
.web20-user { text-align: center; margin: 0 0 4px; font-weight: 700; font-size: 14px; }
.web20-location { text-align: center; margin: 0 0 10px; font-size: 11px; color: #666; }
.web20-stats { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #444; text-align: center; }
.web20-player { background: #F0F0F0; border: 1px inset #CCC; padding: 10px; border-radius: 4px; }
.web20-track { font-size: 11px; font-weight: 700; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.web20-progress { height: 6px; background: #DDD; border: 1px inset #AAA; border-radius: 3px; overflow: hidden; }
.web20-bar { height: 100%; background: linear-gradient(90deg, #FF00FF, #00FFFF); border-radius: 3px; transition: width 0.3s; box-shadow: 0 0 8px currentColor; }
.web20-controls { display: flex; justify-content: center; gap: 8px; margin-top: 8px; }
.web20-controls button { width: 28px; height: 28px; border: 1px outset #CCC; background: #F0F0F0; border-radius: 3px; cursor: pointer; font-size: 12px; transition: all 0.1s; }
.web20-controls button:active { border-style: inset; }
.web20-controls button.play { background: linear-gradient(180deg, #FF00FF, #CC00CC); color: #FFF; border-color: #FFF #888 #888 #FFF; box-shadow: 0 2px 8px rgba(255,0,255,0.4); }
.web20-cal { text-align: center; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.8; }
.web20-main { flex: 1; display: flex; flex-direction: column; gap: 15px; }
.web20-hero { background: linear-gradient(135deg, #FFE6FF 0%, #E6FFFF 50%, #FFFFE6 100%); border: 2px solid #FF00FF; border-radius: 8px; padding: 20px; text-align: center; position: relative; overflow: hidden; }
.web20-hero::before { content: '✨ 💖 ✨ 💖 ✨'; position: absolute; top: 10px; right: 10px; font-size: 12px; opacity: 0.5; animation: float 4s ease-in-out infinite; }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
.web20-hero h2 { margin: 0 0 10px; font-size: 20px; color: #8A2BE2; text-shadow: 1px 1px 0 #FFF; }
.web20-hero p { margin: 0 0 15px; color: #444; line-height: 1.5; }
.web20-badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.badge { background: linear-gradient(135deg, #FF00FF, #00FFFF); color: #FFF; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; border: 1px solid #FFF; box-shadow: 0 2px 4px rgba(0,0,0,0.2); animation: badgeFloat 3s ease-in-out infinite; }
.badge:nth-child(2) { animation-delay: 0.5s; } .badge:nth-child(3) { animation-delay: 1s; } .badge:nth-child(4) { animation-delay: 1.5s; } .badge:nth-child(5) { animation-delay: 2s; }
@keyframes badgeFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
.web20-blog-meta { font-size: 11px; color: #666; margin-bottom: 8px; }
.web20-blog-meta a { color: #00FFFF; text-decoration: underline; }
.web20-module p { margin: 0 0 10px; line-height: 1.6; color: #333; }
.web20-tags { font-size: 11px; color: #666; margin-top: 10px; }
.web20-tags a { color: #FF00FF; text-decoration: underline; }
.web20-comment { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px dashed #DDD; }
.web20-comment:last-child { border-bottom: none; }
.web20-comment-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #FFE6FF, #E6FFFF); display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid #FF00FF; flex-shrink: 0; box-shadow: 0 2px 6px rgba(255,0,255,0.2); }
.web20-comment-body strong { color: #8A2BE2; }
.web20-comment-body span { font-size: 10px; color: #999; margin-left: 8px; }
.web20-comment-body p { margin: 4px 0 0; font-size: 12px; color: #333; }
.web20-minicomment { display: flex; gap: 8px; padding: 8px 0; border-bottom: 1px solid rgba(255,0,255,0.1); }
.web20-minicomment:last-child { border-bottom: none; }
.mc-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #FFE6FF, #E6FFFF); display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2px solid #FF00FF; flex-shrink: 0; }
.mc-text { font-size: 11px; color: #333; line-height: 1.4; }
.mc-text strong { color: #8A2BE2; }
.web20-gallery { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.web20-photo { aspect-ratio: 1; background: linear-gradient(135deg, #FFE6FF, #E6FFFF); border: 2px solid #FF00FF; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: all 0.2s; }
.web20-photo:hover { transform: scale(1.05) rotate(2deg); box-shadow: 0 8px 20px rgba(255,0,255,0.3); }
.web20-footer { background: #F0F0F0; border-top: 1px solid #DDD; padding: 10px; text-align: center; font-size: 10px; color: #666; }
.web20-footer a { color: #00FFFF; text-decoration: underline; }

/* Sparkle cursor trail */
@keyframes trailFade { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0); opacity: 0; } }
`,
      js: `// MySpace Profile 2007 - Web 2.0 Experience
console.log('%c✨ MySpace Profile Loaded', 'color: #FF00FF; font-size: 16px; font-weight: bold; text-shadow: 1px 1px 0 #000');
console.log('%c🎵 Music: Dashboard - Modest Mouse', 'color: #00FFFF; font-size: 12px');
console.log('%c💖 Layout: Custom Glitter Theme v3.2', 'color: #FFFF00; font-size: 12px; text-shadow: 1px 1px 0 #F00');
console.log('%c🌈 Cursor: Custom (trail enabled)', 'color: #00FF00; font-size: 12px');

// Music player
let playing=true; const playBtn=document.querySelector('.web20-controls .play'); const bar=document.querySelector('.web20-bar');
if(playBtn&&bar){ playBtn.addEventListener('click',()=>{ playing=!playing; playBtn.textContent=playing?'⏸':'▶'; console.log(playing?'♪ Resumed':'⏸ Paused'); }); let p=45; setInterval(()=>{ if(playing){ p=(p+0.5)%100; bar.style.width=p+'%'; } },1000); }

// Nav
document.querySelectorAll('.web20-nav a').forEach(l=>{ l.addEventListener('click',e=>{ e.preventDefault(); document.querySelectorAll('.web20-nav a').forEach(x=>x.classList.remove('active')); l.classList.add('active'); console.log('Nav:',l.textContent); }); });

// Sparkle trail
let lastTrail=0; document.addEventListener('mousemove',e=>{ const n=Date.now(); if(n-lastTrail>50){ const t=document.createElement('div'); t.textContent=['✨','💖','⭐','✦'][Math.floor(Math.random()*4)]; t.style.cssText='position:fixed;left:'+e.clientX+'px;top:'+e.clientY+'px;font-size:10px;pointer-events:none;z-index:9999;animation:trailFade 0.8s ease-out forwards'; document.body.appendChild(t); setTimeout(()=>t.remove(),800); lastTrail=n; } });
const ts=document.createElement('style'); ts.textContent='@keyframes trailFade{0%{transform:scale(1);opacity:1}100%{transform:scale(0);opacity:0}}'; document.head.appendChild(ts);

// Floating sparkles
setInterval(()=>{ const s=document.createElement('div'); s.textContent=['✨','💖','⭐','✦'][Math.floor(Math.random()*4)]; s.style.cssText='position:fixed;left:'+Math.random()*innerWidth+'px;top:'+innerHeight+'px;font-size:16px;pointer-events:none;z-index:9999;animation:sparkleFall 3s linear forwards'; document.body.appendChild(s); setTimeout(()=>s.remove(),3000); },800);
const ss=document.createElement('style'); ss.textContent='@keyframes sparkleFall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(-'+(innerHeight+100)+'px) rotate(360deg);opacity:0}}'; document.head.appendChild(ss);

// Comment hover
document.querySelectorAll('.web20-comment').forEach(c=>{ c.style.cursor='pointer'; c.addEventListener('mouseenter',()=>c.style.background='rgba(255,0,255,0.05)'); c.addEventListener('mouseleave',()=>c.style.background='transparent'); });

console.log('%c🌐 Welcome to Web 2.0 — social, shiny, slightly broken', 'color: #FF00FF; font-size: 13px; font-weight: bold;');`,
    },
    vista: {
      name: 'pg.tpl.vista',
      html: `<div class="vista-desktop">
  <div class="vista-sidebar">
    <div class="sidebar-header">Windows Vista</div>
    <nav class="sidebar-nav">
      <a href="#" class="active"><span>📁</span> Documents</a>
      <a href="#"><span>🖼️</span> Pictures</a>
      <a href="#"><span>🎵</span> Music</a>
      <a href="#"><span>🎬</span> Videos</a>
      <a href="#"><span>🌐</span> Internet Explorer</a>
      <a href="#"><span>⚙️</span> Control Panel</a>
      <a href="#"><span>🎮</span> Games</a>
      <a href="#"><span>📎</span> Default Programs</a>
      <a href="#"><span>❓</span> Help and Support</a>
    </nav>
    <div class="sidebar-footer">
      <div class="search-box"><input type="search" placeholder="Search"></div>
    </div>
  </div>
  <div class="vista-main">
    <div class="vista-toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" title="Organize">Organize ▼</button>
        <button class="toolbar-btn" title="Views">Views ▼</button>
        <div class="view-slider">
          <span>Extra Large</span>
          <input type="range" min="0" max="4" value="2" id="viewSlider">
          <span>Details</span>
        </div>
      </div>
      <div class="toolbar-right">
        <div class="address-bar">
          <button class="nav-btn back" disabled>←</button>
          <button class="nav-btn forward" disabled>→</button>
          <button class="nav-btn up">↑</button>
          <div class="address-path">
            <span class="crumb">🖥️ Computer</span>
            <span class="sep">›</span>
            <span class="crumb">💾 Local Disk (C:)</span>
            <span class="sep">›</span>
            <span class="crumb active">👤 Users</span>
            <span class="sep">›</span>
            <span class="crumb active">Alex</span>
            <span class="sep">›</span>
            <span class="crumb active">📁 Documents</span>
          </div>
        </div>
        <div class="search-box"><input type="search" placeholder="Search Documents"></div>
      </div>
    </div>
    <div class="vista-content">
      <div class="file-list" id="fileList">
        <div class="file-item folder" data-name="My Projects"><div class="file-icon">📁</div><div class="file-info"><div class="file-name">My Projects</div><div class="file-details">File folder • Modified today</div></div></div>
        <div class="file-item folder" data-name="School Work"><div class="file-icon">📁</div><div class="file-info"><div class="file-name">School Work</div><div class="file-details">File folder • Modified yesterday</div></div></div>
        <div class="file-item folder" data-name="Personal"><div class="file-icon">📁</div><div class="file-info"><div class="file-name">Personal</div><div class="file-details">File folder • Modified last week</div></div></div>
        <div class="file-item" data-name="Resume.docx"><div class="file-icon">📄</div><div class="file-info"><div class="file-name">Resume.docx</div><div class="file-details">Microsoft Word Document • 24 KB • 2/14/2007</div></div></div>
        <div class="file-item" data-name="Budget.xlsx"><div class="file-icon">📊</div><div class="file-info"><div class="file-name">Budget.xlsx</div><div class="file-details">Microsoft Excel Workbook • 18 KB • 2/10/2007</div></div></div>
        <div class="file-item" data-name="Vacation.jpg"><div class="file-icon">🖼️</div><div class="file-info"><div class="file-name">Vacation.jpg</div><div class="file-details">JPEG Image • 2.4 MB • 1/20/2007</div></div></div>
        <div class="file-item" data-name="Notes.txt"><div class="file-icon">📝</div><div class="file-info"><div class="file-name">Notes.txt</div><div class="file-details">Text Document • 2 KB • 2/15/2007</div></div></div>
        <div class="file-item" data-name="Presentation.pptx"><div class="file-icon">📽️</div><div class="file-info"><div class="file-name">Presentation.pptx</div><div class="file-details">Microsoft PowerPoint • 1.2 MB • 2/12/2007</div></div></div>
      </div>
    </div>
    <div class="vista-details-pane">
      <div class="details-header">2 items selected</div>
      <div class="details-preview">
        <div class="preview-icon">📄</div>
        <div class="preview-info">
          <div class="preview-name">Resume.docx</div>
          <div class="preview-meta">Microsoft Word Document • 24 KB</div>
          <div class="preview-meta">Date Modified: 2/14/2007 3:45 PM</div>
          <div class="preview-meta">Author: Alex</div>
        </div>
      </div>
      <div class="details-tags">
        <span>Tags:</span>
        <span class="tag">work</span>
        <span class="tag">important</span>
        <button class="add-tag">+ Add tag</button>
      </div>
    </div>
    <div class="vista-statusbar">
      <div class="status-left">8 items • 2 selected • 3.64 MB</div>
      <div class="status-right">
        <span>Show preview pane</span>
        <div class="zoom-slider"><button>-</button><input type="range" min="0" max="100" value="50"><button>+</button></div>
        <span>100%</span>
      </div>
    </div>
  </div>
  <div class="vista-taskbar">
    <button class="start-btn"><span class="start-orb">⬤</span><span>Start</span></button>
    <div class="quick-launch">
      <button class="ql-btn" title="Internet Explorer">🌐</button>
      <button class="ql-btn" title="Windows Media Player">🎵</button>
      <button class="ql-btn" title="Windows Mail">📧</button>
    </div>
    <div class="taskband">
      <button class="task-btn active">📁 Documents</button>
      <button class="task-btn">🌐 Internet Explorer</button>
    </div>
    <div class="system-tray">
      <div class="tray-item">🔊</div>
      <div class="tray-item">📶</div>
      <div class="tray-item">🔋</div>
      <div class="tray-clock">2:41 PM<br>2/15/2007</div>
    </div>
  </div>
</div>`,
      css: `@import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(180deg, #0A3D6E 0%, #004F8A 40%, #003D6B 100%); color: #1A1A1A; overflow: hidden; }
.vista-desktop { display: flex; flex-direction: column; height: 100vh; }
.vista-sidebar { width: 220px; flex-shrink: 0; background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(240,245,250,0.9)); border-right: 1px solid rgba(255,255,255,0.3); display: flex; flex-direction: column; box-shadow: inset -1px 0 0 rgba(255,255,255,0.5), 4px 0 24px rgba(0,0,0,0.1); }
.sidebar-header { padding: 16px 20px; font-size: 16px; font-weight: 600; color: #003D6B; border-bottom: 1px solid rgba(0,77,138,0.1); background: linear-gradient(180deg, rgba(0,100,180,0.05), transparent); }
.sidebar-nav { flex: 1; padding: 8px 4px; overflow: auto; }
.sidebar-nav a { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 4px; color: #333; text-decoration: none; font-size: 13px; margin: 2px 8px; transition: all 0.15s; }
.sidebar-nav a span:first-child { font-size: 16px; width: 20px; text-align: center; }
.sidebar-nav a:hover { background: rgba(0,120,215,0.15); color: #0078D7; }
.sidebar-nav a.active { background: rgba(0,120,215,0.25); color: #005A9E; font-weight: 600; box-shadow: inset 2px 0 0 #0078D7; }
.sidebar-footer { padding: 12px; border-top: 1px solid rgba(0,77,138,0.1); }
.search-box input { width: 100%; padding: 6px 10px 6px 30px; border: 1px solid rgba(0,77,138,0.2); border-radius: 4px; background: rgba(255,255,255,0.8) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23666' d='M7 12a5 5 0 100-10 5 5 0 000 10zm0-1a4 4 0 110-8 4 4 0 010 8zm6.5-6.5l3.5 3.5-1 1-3.5-3.5 1-1z'/%3E%3C/svg%3E") no-repeat 8px center; background-size: 14px; font-size: 12px; color: #333; outline: none; }
.vista-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.vista-toolbar { display: flex; justify-content: space-between; align-items: center; height: 60px; padding: 0 12px; background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(240,245,250,0.9)); border-bottom: 1px solid rgba(0,77,138,0.1); box-shadow: 0 2px 8px rgba(0,0,0,0.05); flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; align-items: center; gap: 8px; }
.toolbar-btn { padding: 6px 12px; border: 1px solid rgba(0,77,138,0.2); border-radius: 4px; background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(240,245,250,0.8)); color: #333; font-size: 12px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.1s; }
.toolbar-btn:hover { background: linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,0.9)); border-color: rgba(0,120,215,0.4); box-shadow: 0 2px 6px rgba(0,120,215,0.15); }
.view-slider { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #666; }
.view-slider input { width: 120px; accent-color: #0078D7; }
.toolbar-right { display: flex; align-items: center; gap: 12px; flex: 1; justify-content: flex-end; }
.address-bar { flex: 1; max-width: 500px; display: flex; align-items: center; gap: 4px; }
.nav-btn { width: 28px; height: 28px; border: 1px solid rgba(0,77,138,0.2); border-radius: 3px; background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(240,245,250,0.8)); cursor: pointer; font-size: 12px; color: #333; transition: all 0.1s; display: flex; align-items: center; justify-content: center; }
.nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.nav-btn:hover:not(:disabled) { background: rgba(0,120,215,0.1); border-color: rgba(0,120,215,0.4); }
.address-path { flex: 1; display: flex; align-items: center; gap: 2px; padding: 4px 8px; background: rgba(255,255,255,0.5); border: 1px solid rgba(0,77,138,0.1); border-radius: 3px; font-size: 12px; min-width: 200px; overflow: auto; }
.crumb { padding: 2px 6px; border-radius: 3px; cursor: pointer; transition: background 0.1s; user-select: none; }
.crumb:hover { background: rgba(0,120,215,0.15); }
.crumb.active { background: rgba(0,120,215,0.2); color: #005A9E; font-weight: 600; }
.sep { color: #999; margin: 0 2px; }
.search-box input { padding: 5px 10px 5px 30px; border: 1px solid rgba(0,77,138,0.2); border-radius: 4px; background: rgba(255,255,255,0.8) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23666' d='M7 12a5 5 0 100-10 5 5 0 000 10zm0-1a4 4 0 110-8 4 4 0 010 8zm6.5-6.5l3.5 3.5-1 1-3.5-3.5 1-1z'/%3E%3C/svg%3E") no-repeat 8px center; background-size: 14px; font-size: 12px; width: 200px; color: #333; outline: none; }
.vista-content { flex: 1; display: flex; overflow: hidden; }
.file-list { flex: 1; padding: 12px; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
.file-item { display: flex; gap: 10px; padding: 10px; background: rgba(255,255,255,0.6); border: 1px solid transparent; border-radius: 4px; cursor: pointer; transition: all 0.15s; }
.file-item:hover { background: rgba(0,120,215,0.1); border-color: rgba(0,120,215,0.3); }
.file-item.selected { background: rgba(0,120,215,0.2); border-color: #0078D7; box-shadow: inset 0 0 0 1px #0078D7; }
.file-icon { font-size: 32px; width: 48px; text-align: center; }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 12px; font-weight: 600; color: #1A1A1A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-details { font-size: 10px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vista-details-pane { width: 320px; flex-shrink: 0; background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,248,252,0.9)); border-left: 1px solid rgba(0,77,138,0.1); padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow: auto; }
.details-header { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
.details-preview { display: flex; gap: 12px; }
.preview-icon { font-size: 48px; width: 64px; text-align: center; }
.preview-info { flex: 1; min-width: 0; }
.preview-name { font-weight: 600; font-size: 13px; color: #1A1A1A; }
.preview-meta { font-size: 11px; color: #666; margin-top: 2px; }
.details-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 11px; color: #666; }
.tag { background: rgba(0,120,215,0.15); color: #005A9E; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
.add-tag { background: transparent; border: 1px dashed rgba(0,120,215,0.4); color: #0078D7; padding: 2px 8px; border-radius: 10px; font-size: 11px; cursor: pointer; }
.add-tag:hover { background: rgba(0,120,215,0.1); border-style: solid; }
.vista-statusbar { display: flex; justify-content: space-between; align-items: center; height: 28px; padding: 0 12px; background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(240,245,250,0.9)); border-top: 1px solid rgba(0,77,138,0.1); font-size: 11px; color: #666; }
.zoom-slider { display: flex; align-items: center; gap: 6px; }
.zoom-slider input { width: 100px; accent-color: #0078D7; }
.zoom-slider button { width: 20px; height: 20px; border: 1px solid rgba(0,77,138,0.2); border-radius: 3px; background: rgba(255,255,255,0.8); cursor: pointer; font-size: 12px; }
.vista-taskbar { position: relative; height: 40px; background: linear-gradient(180deg, rgba(0,60,100,0.95), rgba(0,40,80,0.98)); border-top: 1px solid rgba(0,100,180,0.3); display: flex; align-items: center; padding: 0 8px; box-shadow: 0 -4px 24px rgba(0,0,0,0.3); z-index: 100; }
.start-btn { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; background: linear-gradient(180deg, rgba(0,120,215,0.6), rgba(0,80,150,0.8)); color: #FFF; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.3); transition: all 0.1s; }
.start-btn:hover { background: linear-gradient(180deg, rgba(0,140,235,0.7), rgba(0,100,170,0.9)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 12px rgba(0,120,215,0.4); }
.start-orb { width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #00D4FF, #0078D7 70%); box-shadow: 0 0 12px #00D4FF, inset 0 -2px 4px rgba(0,0,0,0.3); animation: orbPulse 2s ease-in-out infinite; }
@keyframes orbPulse { 0%,100% { box-shadow: 0 0 12px #00D4FF, inset 0 -2px 4px rgba(0,0,0,0.3); } 50% { box-shadow: 0 0 20px #00D4FF, 0 0 30px rgba(0,212,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3); } }
.quick-launch { display: flex; gap: 4px; margin: 0 8px; }
.ql-btn { width: 30px; height: 30px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(255,255,255,0.05); color: #FFF; font-size: 14px; cursor: pointer; transition: all 0.1s; }
.ql-btn:hover { background: rgba(0,120,215,0.3); border-color: rgba(0,120,215,0.5); box-shadow: 0 0 8px rgba(0,212,255,0.3); }
.taskband { flex: 1; display: flex; gap: 2px; padding: 4px; overflow: hidden; }
.task-btn { display: flex; align-items: center; gap: 6px; padding: 4px 12px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: #FFF; font-size: 12px; cursor: pointer; transition: all 0.1s; white-space: nowrap; }
.task-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
.task-btn.active { background: linear-gradient(180deg, rgba(0,120,215,0.5), rgba(0,80,150,0.7)); border-color: rgba(0,120,215,0.6); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 8px rgba(0,120,215,0.3); }
.system-tray { display: flex; align-items: center; gap: 8px; padding: 0 8px; }
.tray-item { font-size: 14px; color: #FFF; opacity: 0.8; cursor: pointer; padding: 4px; border-radius: 3px; transition: all 0.1s; }
.tray-item:hover { opacity: 1; background: rgba(255,255,255,0.1); }
.tray-clock { font-size: 11px; color: #FFF; text-align: right; line-height: 1.2; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }

/* File selection */
.file-item { transition: all 0.15s; }
.file-item:focus { outline: none; box-shadow: 0 0 0 2px #0078D7; }
`,
      js: `// Windows Vista - Explorer Simulation
console.log('%c🪟 Windows Vista Ultimate', 'color: #0078D7; font-size: 16px; font-weight: bold;');
console.log('%c🎨 Windows Aero — Glass, Reflections, Translucency', 'color: #00D4FF; font-size: 12px');
console.log('%c🔍 Instant Search Indexing...', 'color: #FFCC00; font-size: 12px');
console.log('%c🛡️ UAC Enabled — Secure Desktop', 'color: #FF6B6B; font-size: 12px');

// Live clock
function updateClock() { const c=document.querySelector('.tray-clock'); if(c){ const n=new Date(); c.innerHTML=n.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true})+'<br>'+n.toLocaleDateString('en-US',{month:'numeric',day:'numeric',year:'2-digit'}); } }
updateClock(); setInterval(updateClock, 1000);

// File selection
const items=document.querySelectorAll('.file-item');
items.forEach(it=>{ it.addEventListener('click',e=>{ if(e.ctrlKey||e.metaKey){ it.classList.toggle('selected'); }else{ items.forEach(x=>x.classList.remove('selected')); it.classList.add('selected'); } updateDetails(); }); it.addEventListener('dblclick',()=>{ console.log('Opening:',it.dataset.name); alert('Opening '+it.dataset.name+'...'); }); });
function updateDetails(){ const sel=document.querySelectorAll('.file-item.selected'); const h=document.querySelector('.details-header'); const p=document.querySelector('.details-preview'); if(h) h.textContent=sel.length+' item'+(sel.length!==1?'s':'')+' selected'; if(p&&sel.length===1){ const n=sel[0].dataset.name; const i=sel[0].querySelector('.file-icon').textContent; const d=sel[0].querySelector('.file-details').textContent; p.innerHTML='<div class="preview-icon">'+i+'</div><div class="preview-info"><div class="preview-name">'+n+'</div><div class="preview-meta">'+d+'</div></div>'; }else if(p){ p.innerHTML='<div class="preview-icon">📁</div><div class="preview-info"><div class="preview-name">'+sel.length+' items selected</div></div>'; } }
document.querySelectorAll('.toolbar-btn').forEach(b=>b.addEventListener('click',()=>console.log('Toolbar:',b.textContent.trim())));
const vs=document.getElementById('viewSlider'); if(vs){ const v=['Extra Large','Large','Medium','Small','Details']; const l=vs.parentElement.querySelector('span'); vs.addEventListener('input',()=>{ if(l) l.textContent=v[vs.value]; console.log('View:',v[vs.value]); }); }
document.querySelectorAll('.crumb').forEach(c=>c.addEventListener('click',()=>console.log('Navigate:',c.textContent.trim())));
document.querySelectorAll('.search-box input').forEach(i=>i.addEventListener('keypress',e=>{ if(e.key==='Enter') console.log('Search:',i.value); }));
document.querySelector('.start-btn')?.addEventListener('click',()=>alert('Start Menu\\n\\nPrograms\\nDocuments\\nSettings\\nSearch\\nRun\\n\\nShut Down'));
document.querySelectorAll('.task-btn').forEach(b=>b.addEventListener('click',()=>{ document.querySelectorAll('.task-btn').forEach(x=>x.classList.remove('active')); b.classList.add('active'); console.log('Switch:',b.textContent.trim()); }));
document.querySelectorAll('.tray-item').forEach(t=>t.addEventListener('click',()=>console.log('Tray:',t.textContent.trim())));
document.querySelector('.start-btn')?.addEventListener('click',()=>alert('Start Menu\\n\\nPrograms\\nDocuments\\nSettings\\nSearch\\nRun\\n\\nShut Down'));

console.log('%c✅ Windows Vista Ready — Experience the Wow', 'color: #0078D7; font-size: 13px; font-weight: bold;');`,
    },
  };

  // ---------- Console capture ----------
  function refreshConBadge() {
    if (!refs.conCount) return;
    refs.conCount.textContent = String(conCount);
    refs.conCount.classList.toggle('has-errors', conErrors > 0);
    refs.conCount.title = conErrors > 0 ? (conErrors + ' error' + (conErrors === 1 ? '' : 's')) : '';
  }
  function logLine(level, msg) {
    if (!alive || !refs.console) return;
    const empty = refs.console.querySelector('.pg-con-empty');
    if (empty) empty.remove();
    const line = document.createElement('div');
    line.className = 'pg-con-line pg-con-' + level;
    const tag = document.createElement('span'); tag.className = 'pg-con-tag'; tag.textContent = level.toUpperCase();
    const body = document.createElement('span'); body.className = 'pg-con-msg'; body.textContent = msg;
    line.append(tag, body);
    refs.console.append(line);
    while (refs.console.children.length > MAX_CONSOLE) refs.console.removeChild(refs.console.firstChild);
    refs.console.scrollTop = refs.console.scrollHeight;
    conCount += 1;
    if (level === 'error') conErrors += 1;
    refreshConBadge();
  }
  function clearConsole() {
    conCount = 0;
    conErrors = 0;
    refreshConBadge();
    if (!refs.console) return;
    refs.console.innerHTML = '';
    const e = document.createElement('div');
    e.className = 'pg-con-empty';
    e.textContent = t('pg.conEmpty');
    refs.console.append(e);
  }
  let messageHandler = null;
  function onMessage(e) {
    if (!refs.frame || e.source !== refs.frame.contentWindow) return;
    const d = e.data;
    if (!d || d.__pg !== 1) return;
    logLine(String(d.level || 'log'), String(d.msg == null ? '' : d.msg));
  }

  // ---------- Run ----------
  function current() { return { html: editors.html?.getValue() || refs.htmlTa?.value || '', css: editors.css?.getValue() || refs.cssTa?.value || '', js: editors.js?.getValue() || refs.jsTa?.value || '' }; }
  function setAddress(id) { if (refs.addressBar) refs.addressBar.value = 'lab/' + (id || 'draft'); }
  function run() {
    if (!alive) return;
    clearConsole();
    const src = buildSrcdoc(current().html, current().css, current().js);
    refs.frame.srcdoc = src;
    refs.hint.textContent = t('pg.ran');
    if (refs.statusEl) refs.statusEl.textContent = t('pg.ran');
    setAddress(currentTemplate);
    if (autosave) autosave();
  }
  function scheduleRun() { if (!autoRun) return; clearTimeout(runTimer); runTimer = setTimeout(run, 250); }

  // ---------- Export ----------
  function standaloneHTML() { const d = current(); return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Vistanology Playground Export</title><style>${d.css}</style></head><body>${d.html}<script>${d.js}<\/script></body></html>`; }

  // ---------- Persistence ----------
  function loadProjects() {
    refs.projList.innerHTML = '';
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty pg-empty">' + esc(t('pg.dbUnavailable')) + '</div>'; return; }
    VT.db.list('playground').then(rows => {
      rows = rows.filter(r => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.projList.innerHTML = '<div class="bench-empty pg-empty">' + esc(t('pg.projEmpty')) + '</div>'; return; }
      rows.forEach(r => {
        const el = document.createElement('div'); el.className = 'bench-row pg-proj-row';
        const info = document.createElement('div'); info.className = 'pg-proj-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('pg.projUntitled');
        const meta = document.createElement('span'); meta.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(nm, meta);
        const open = document.createElement('button'); open.type = 'button'; open.className = 'btn btn-ghost btn-sm'; open.textContent = t('pg.projOpen');
        open.addEventListener('click', () => { const data = r.data || {}; currentTemplate = null; setEditorContent('html', data.html || ''); setEditorContent('css', data.css || ''); setEditorContent('js', data.js || ''); run(); toast(t('pg.projOpened', { name: r.name || t('pg.projUntitled') }), 'success'); });
        el.append(info, open); refs.projList.append(el);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty pg-empty">' + esc(t('pg.dbError')) + '</div>'; });
  }
  function setEditorContent(name, content) {
    if (editors[name]) { editors[name].setValue(content); return; }
    const ta = refs[name + 'Ta'];
    if (!ta) return;
    ta.value = content;
    if (simpleGutters[name]) simpleGutters[name]();
  }
  function applyTemplate(id) {
    const p = TEMPLATES[id]; if (!p) return;
    setEditorContent('html', p.html);
    setEditorContent('css', p.css);
    setEditorContent('js', p.js);
    currentTemplate = id;
    run();
    refs.hint.textContent = t('pg.tplApplied', { name: t(p.name) });
    if (refs.statusEl) refs.statusEl.textContent = t(p.name);
  }

  // ---------- Panels & tabs ----------
  function selectTab(name, focus) {
    $$('.pg-tab', refs.stage).forEach(b => {
      const on = b.dataset.tab === name;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
    });
    $$('.pg-editor', refs.stage).forEach(p => { p.hidden = p.dataset.pane !== name; });
    if (simpleGutters[name]) simpleGutters[name]();
    if (focus === false) return;
    if (editors[name]) setTimeout(() => editors[name].focus(), 50);
    else refs[name + 'Ta']?.focus();
  }

  function setViewport(vp) {
    if (!refs.frameWrap) return;
    const names = { desktop: 'pg.vpDesktop', tablet: 'pg.vpTablet', mobile: 'pg.vpMobile' };
    refs.frameWrap.dataset.vp = vp;
    (refs.vpBtns || []).forEach(b => {
      const on = b.dataset.vp === vp;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (refs.statusVp) refs.statusVp.textContent = t(names[vp] || 'pg.vpDesktop');
  }

  function setBrowserTab(name) {
    if (!refs.stage) return;
    $$('.browser-tab', refs.stage).forEach(b => {
      const on = b.dataset.tab === name;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-selected', String(on));
    });
    $$('.browser-tabpanel', refs.stage).forEach(p => { p.hidden = p.dataset.tab !== name; });
    if (refs.consoleBtn) refs.consoleBtn.setAttribute('aria-pressed', String(name === 'console'));
    if (name === 'console' && refs.console) refs.console.scrollTop = refs.console.scrollHeight;
  }

  function setEditorOpen(open, opts) {
    editorPanelOpen = !!open;
    if (!refs.stage) return;
    refs.stage.classList.toggle('editor-collapsed', !editorPanelOpen);
    if (refs.editorToggle) refs.editorToggle.setAttribute('aria-pressed', String(editorPanelOpen));
    if (editorPanelOpen && opts && opts.focus) {
      const tab = refs.stage.querySelector('.pg-tab.is-on');
      const name = tab ? tab.dataset.tab : 'html';
      setTimeout(() => (editors[name] || refs[name + 'Ta'])?.focus(), 280);
    }
  }

  function applyZoom() {
    if (!refs.frame) return;
    refs.frame.style.transform = 'scale(' + zoomLevel + ')';
    refs.frame.style.transformOrigin = 'top center';
    if (refs.zoomValue) {
      refs.zoomValue.textContent = Math.round(zoomLevel * 100) + '%';
      refs.zoomValue.title = t('pg.zoomReset');
    }
  }
  function adjustZoom(factor) { zoomLevel = Math.max(0.3, Math.min(2, zoomLevel * factor)); applyZoom(); }
  function resetZoom() { zoomLevel = 1; applyZoom(); }

  // ---------- Editor setup ----------
  function initEditors() {
    if (window.monaco) {
      require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
      require(['vs/editor/editor.main'], () => {
        editors.html = monaco.editor.create(refs.htmlEd, { value: refs.htmlTa.value, language: 'html', theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', tabSize: 2, wordWrap: 'on', brackets: 'languageDefined', autoClosingBrackets: 'always', autoClosingQuotes: 'always', folding: true, renderLineHighlight: 'all', scrollBeyondLastLine: false });
        editors.css = monaco.editor.create(refs.cssEd, { value: refs.cssTa.value, language: 'css', theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', tabSize: 2, wordWrap: 'on', brackets: 'languageDefined', autoClosingBrackets: 'always', autoClosingQuotes: 'always', folding: true, renderLineHighlight: 'all', scrollBeyondLastLine: false });
        editors.js = monaco.editor.create(refs.jsEd, { value: refs.jsTa.value, language: 'javascript', theme: 'vs-dark', automaticLayout: true, minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on', tabSize: 2, wordWrap: 'on', brackets: 'languageDefined', autoClosingBrackets: 'always', autoClosingQuotes: 'always', folding: true, renderLineHighlight: 'all', scrollBeyondLastLine: false });
        [editors.html, editors.css, editors.js].forEach(ed => ed.onDidChangeModelContent(() => { scheduleRun(); if (autosave) autosave(); }));
        refs.htmlTa.style.display = 'none'; refs.cssTa.style.display = 'none'; refs.jsTa.style.display = 'none';
        selectTab('html');
      });
    } else { initSimpleEditors(); }
  }
  function initSimpleEditors() {
    ['html', 'css', 'js'].forEach(name => {
      const ta = refs[name + 'Ta'];
      const wrap = ta.parentElement;
      const gutter = document.createElement('div');
      gutter.className = 'pg-gutter';
      gutter.setAttribute('aria-hidden', 'true');
      wrap.insertBefore(gutter, ta);
      const updateGutter = () => {
        const lines = ta.value.split('\n').length;
        gutter.innerHTML = Array.from({ length: Math.max(lines, 1) }, (_, i) => '<div>' + (i + 1) + '</div>').join('');
        gutter.scrollTop = ta.scrollTop;
      };
      simpleGutters[name] = updateGutter;
      ta.addEventListener('input', updateGutter);
      ta.addEventListener('scroll', () => { gutter.scrollTop = ta.scrollTop; });
      ta.addEventListener('keydown', e => {
        if (e.key !== 'Tab') return;
        e.preventDefault();
        const s = ta.selectionStart, e2 = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(e2);
        ta.selectionStart = ta.selectionEnd = s + 2;
        updateGutter();
        scheduleRun();
        if (autosave) autosave();
      });
      updateGutter();
    });
    selectTab('html', false);
  }

  function mount(root) {
    alive = true; autoRun = true;
    const saved = VT.store.get(KEY, null);
    const hasSaved = !!(saved && saved.doc);
    const doc = hasSaved ? saved.doc : { html: TEMPLATES.aero.html, css: TEMPLATES.aero.css, js: TEMPLATES.aero.js };
    currentTemplate = hasSaved ? null : 'aero';
    zoomLevel = 1;
    const I = VT.icons;

    const startOpen = window.innerWidth > 860;
    editorPanelOpen = startOpen;

    root.innerHTML = `
      <div class="pg-stage glass-2${startOpen ? '' : ' editor-collapsed'}" id="pg-stage">
        <div class="pg-toolbar">
          <div class="pg-toolbar-left">
            <button class="btn btn-primary btn-sm pg-run" id="pg-run" aria-keyshortcuts="Control+Enter" title="${t('pg.runTip')}">${I.arrowRight}<span>${t('pg.run')}</span></button>
            <label class="pg-auto" title="${t('pg.autoTip')}">
              <input type="checkbox" id="pg-auto" checked>
              <span class="pg-auto-track" aria-hidden="true"></span>
              <span class="pg-auto-label">${t('pg.autoRun')}</span>
            </label>
            <div class="pg-vp" role="group" aria-label="${t('pg.viewport')}">
              <button class="pg-vp-btn is-on" type="button" data-vp="desktop" title="${t('pg.vpDesktop')}" aria-pressed="true">${I.grid}</button>
              <button class="pg-vp-btn" type="button" data-vp="tablet" title="${t('pg.vpTablet')}" aria-pressed="false">${I.image}</button>
              <button class="pg-vp-btn" type="button" data-vp="mobile" title="${t('pg.vpMobile')}" aria-pressed="false">${I.phone}</button>
            </div>
          </div>
          <div class="pg-toolbar-center">
            <label class="pg-tpl-wrap">
              <span class="pg-tpl-label">${t('pg.templates')}</span>
              <select class="input pg-select" id="pg-tpl" aria-label="${t('pg.templates')}">
                <option value="">${t('pg.tplChoose')}</option>
                ${Object.keys(TEMPLATES).map(k => '<option value="' + k + '">' + esc(t(TEMPLATES[k].name)) + '</option>').join('')}
              </select>
            </label>
          </div>
          <div class="pg-toolbar-right">
            <button class="pg-tool" type="button" id="pg-console-btn" aria-pressed="false" title="${t('pg.console')}">${I.code}<span>${t('pg.console')}</span></button>
            <button class="pg-tool" type="button" id="pg-toggle-editor" aria-pressed="${startOpen}" title="${t('pg.editor')}">${I.braces}<span>${t('pg.editor')}</span></button>
            <span class="pg-sep" aria-hidden="true"></span>
            <button class="pg-tool" type="button" id="pg-reset" title="${t('pg.reset')}">${I.broom}<span>${t('pg.reset')}</span></button>
            <button class="pg-tool" type="button" id="pg-copy" title="${t('pg.copy')}">${I.copy}<span>${t('pg.copy')}</span></button>
            <button class="pg-tool" type="button" id="pg-export" title="${t('pg.export')}">${I.download}<span>${t('pg.export')}</span></button>
            <button class="pg-tool" type="button" id="pg-fullscreen" title="${t('pg.fullscreen')}">${I.resize}</button>
          </div>
        </div>

        <div class="pg-hint" id="pg-hint" role="status" aria-live="polite"></div>

        <div class="pg-work">
          <aside class="pg-editor-panel" id="pg-editor-panel" aria-label="${t('pg.editors')}">
            <div class="pg-editor-head">
              <span class="pg-editor-title">${I.code} <span>${t('pg.editors')}</span></span>
              <div class="pg-editor-head-actions">
                <button class="pg-icon-btn" type="button" id="pg-close-editor" aria-label="${t('pg.closeEditor')}" title="${t('pg.closeEditor')}">${I.x}</button>
              </div>
            </div>
            <div class="pg-tabs" role="tablist" aria-label="${t('pg.editors')}">
              <button class="pg-tab is-on" type="button" role="tab" data-tab="html" aria-selected="true"><span class="pg-tab-dot" aria-hidden="true"></span>HTML</button>
              <button class="pg-tab" type="button" role="tab" data-tab="css" aria-selected="false"><span class="pg-tab-dot" aria-hidden="true"></span>CSS</button>
              <button class="pg-tab" type="button" role="tab" data-tab="js" aria-selected="false"><span class="pg-tab-dot" aria-hidden="true"></span>JS</button>
            </div>
            <div class="pg-pane pg-editor" data-pane="html"><div class="pg-editor-wrapper" id="pg-html-wrap"><textarea id="pg-html" spellcheck="false" wrap="off" aria-label="HTML"></textarea></div></div>
            <div class="pg-pane pg-editor" data-pane="css" hidden><div class="pg-editor-wrapper" id="pg-css-wrap"><textarea id="pg-css" spellcheck="false" wrap="off" aria-label="CSS"></textarea></div></div>
            <div class="pg-pane pg-editor" data-pane="js" hidden><div class="pg-editor-wrapper" id="pg-js-wrap"><textarea id="pg-js" spellcheck="false" wrap="off" aria-label="JavaScript"></textarea></div></div>
            <div class="pg-editor-foot">
              <div class="pg-proj-save">
                <input class="input" id="pg-proj-name" type="text" placeholder="${t('pg.projNamePh')}" aria-label="${t('pg.projNamePh')}">
                <button class="btn btn-ghost btn-sm" type="button" id="pg-proj-save">${I.download} ${t('pg.projSave')}</button>
              </div>
              <div class="pg-proj-list" id="pg-proj-list"></div>
            </div>
          </aside>

          <main class="pg-preview" aria-label="${t('pg.preview')}">
            <div class="aero-browser-frame" id="pg-browser-frame">
              <div class="browser-titlebar">
                <span class="browser-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                <span class="browser-title"><span class="browser-title-icon">🌊</span> Vistanology Aero Browser</span>
                <span class="browser-tag">2000s</span>
              </div>
              <div class="browser-toolbar">
                <div class="browser-nav">
                  <button class="nav-btn" type="button" disabled aria-label="${t('pg.back')}" title="${t('pg.back')}">←</button>
                  <button class="nav-btn" type="button" disabled aria-label="${t('pg.forward')}" title="${t('pg.forward')}">→</button>
                  <button class="nav-btn" type="button" id="pg-nav-refresh" aria-label="${t('pg.refresh')}" title="${t('pg.refresh')}">⟳</button>
                  <button class="nav-btn" type="button" id="pg-nav-home" aria-label="${t('pg.home')}" title="${t('pg.home')}">⌂</button>
                </div>
                <div class="browser-address">
                  <span class="address-scheme">aero://</span>
                  <input type="text" id="pg-address" value="lab/aero" readonly aria-label="${t('pg.address')}">
                  <span class="address-lock" title="${t('pg.sandbox')}">🔒</span>
                </div>
                <div class="browser-zoom">
                  <button class="zoom-btn" type="button" id="pg-zoom-out" aria-label="${t('pg.zoomOut')}">−</button>
                  <button class="zoom-value" type="button" id="pg-zoom-reset" title="${t('pg.zoomReset')}">100%</button>
                  <button class="zoom-btn" type="button" id="pg-zoom-in" aria-label="${t('pg.zoomIn')}">+</button>
                </div>
              </div>
              <div class="browser-tabs" role="tablist" aria-label="${t('pg.preview')}">
                <button class="browser-tab is-on" type="button" role="tab" data-tab="preview" aria-selected="true"><span class="browser-tab-favicon" aria-hidden="true">▣</span>${t('pg.previewTab')}</button>
                <button class="browser-tab" type="button" role="tab" data-tab="console" aria-selected="false"><span class="browser-tab-favicon" aria-hidden="true">{ }</span>${t('pg.consoleTab')}<span class="pg-con-count" id="pg-con-count">0</span></button>
                <span class="browser-tabs-fill"></span>
                <span class="pg-live"><i aria-hidden="true"></i>${t('pg.live')}</span>
              </div>
              <div class="browser-content">
                <section class="browser-tabpanel" data-tab="preview" role="tabpanel">
                  <div class="pg-frame-wrap" id="pg-frame-wrap" data-vp="desktop">
                    <iframe id="pg-frame" class="pg-frame" sandbox="allow-scripts" title="${t('pg.preview')}"></iframe>
                  </div>
                </section>
                <section class="browser-tabpanel" data-tab="console" role="tabpanel" hidden>
                  <div class="pg-console-bar">
                    <span class="pg-console-bar-title">${I.code}<span>${t('pg.console')}</span></span>
                    <button class="btn btn-ghost btn-sm" type="button" id="pg-console-clear">${t('pg.clear')}</button>
                  </div>
                  <div class="pg-console" id="pg-console" aria-live="polite"></div>
                </section>
              </div>
              <div class="browser-statusbar">
                <span class="browser-status-left"><span class="status-dot" aria-hidden="true"></span><span id="pg-status">${t('pg.ready')}</span></span>
                <span class="browser-status-right">
                  <span id="pg-status-vp">${t('pg.vpDesktop')}</span>
                  <span class="browser-status-sep">•</span>
                  <span>${t('pg.sandboxShort')}</span>
                </span>
              </div>
            </div>
          </main>
        </div>

        <p class="privacy-line">${I.shield} ${t('pg.privacy')}</p>
      </div>`;

    refs = {
      stage: $('#pg-stage', root),
      htmlTa: $('#pg-html', root), cssTa: $('#pg-css', root), jsTa: $('#pg-js', root),
      htmlEd: $('#pg-html-wrap', root), cssEd: $('#pg-css-wrap', root), jsEd: $('#pg-js-wrap', root),
      frame: $('#pg-frame', root), frameWrap: $('#pg-frame-wrap', root),
      console: $('#pg-console', root), hint: $('#pg-hint', root),
      auto: $('#pg-auto', root), tpl: $('#pg-tpl', root),
      projList: $('#pg-proj-list', root), projName: $('#pg-proj-name', root),
      editorPanel: $('#pg-editor-panel', root),
      editorToggle: $('#pg-toggle-editor', root),
      consoleBtn: $('#pg-console-btn', root),
      conCount: $('#pg-con-count', root),
      browserFrame: $('#pg-browser-frame', root),
      addressBar: $('#pg-address', root),
      statusEl: $('#pg-status', root),
      statusVp: $('#pg-status-vp', root),
      zoomValue: $('#pg-zoom-reset', root),
      vpBtns: $$('.pg-vp-btn', root),
    };

    refs.htmlTa.value = doc.html || '';
    refs.cssTa.value = doc.css || '';
    refs.jsTa.value = doc.js || '';

    autosave = U.debounce(() => { if (!alive) return; VT.store.set(KEY, { doc: current() }); if (VT.db.available) VT.db.put({ id: AUTOSAVE_ID, tool: 'playground', name: '(autosave)', data: current() }).catch(() => {}); }, 700);

    messageHandler = onMessage; window.addEventListener('message', messageHandler);
    clearConsole();

    refs.auto.addEventListener('change', () => { autoRun = refs.auto.checked; refs.hint.textContent = autoRun ? t('pg.autoOn') : t('pg.autoOff'); if (autoRun) scheduleRun(); });
    [refs.htmlTa, refs.cssTa, refs.jsTa].forEach(ta => ta.addEventListener('input', () => {
      currentTemplate = null;
      scheduleRun();
      if (autosave) autosave();
    }));

    $('#pg-run', root).addEventListener('click', () => {
      if (editorPanelOpen && window.innerWidth <= 860) setEditorOpen(false);
      if (refs.consoleBtn.getAttribute('aria-pressed') === 'true') setBrowserTab('preview');
      run();
    });

    $$('.pg-tab', root).forEach(b => b.addEventListener('click', () => selectTab(b.dataset.tab)));

    refs.vpBtns.forEach(b => b.addEventListener('click', () => setViewport(b.dataset.vp)));

    refs.tpl.addEventListener('change', () => {
      if (!refs.tpl.value) return;
      applyTemplate(refs.tpl.value);
      refs.tpl.selectedIndex = 0;
      setBrowserTab('preview');
      if (window.innerWidth <= 860) setEditorOpen(false);
    });

    $('#pg-reset', root).addEventListener('click', () => {
      currentTemplate = null;
      setEditorContent('html', '');
      setEditorContent('css', '');
      setEditorContent('js', '');
      run();
      refs.hint.textContent = t('pg.resetDone');
    });

    $('#pg-console-clear', root).addEventListener('click', clearConsole);
    refs.consoleBtn.addEventListener('click', () => setBrowserTab(refs.consoleBtn.getAttribute('aria-pressed') === 'true' ? 'preview' : 'console'));
    $$('.browser-tab', root).forEach(b => b.addEventListener('click', () => setBrowserTab(b.dataset.tab)));

    $('#pg-copy', root).addEventListener('click', async () => { const ok = await U.copyText(standaloneHTML()); toast(ok ? t('pg.copied') : t('pg.copyFail'), ok ? 'success' : 'error'); });

    $('#pg-export', root).addEventListener('click', () => { U.downloadText(standaloneHTML(), 'vistanology-playground.html', 'text/html'); toast(t('pg.exported'), 'success'); });

    $('#pg-fullscreen', root).addEventListener('click', () => {
      if (document.fullscreenElement) { document.exitFullscreen?.().catch(() => {}); return; }
      refs.browserFrame.requestFullscreen?.().catch(() => {});
    });

    $('#pg-nav-refresh', root).addEventListener('click', () => {
      run();
      const btn = $('#pg-nav-refresh', root);
      if (btn) { btn.classList.add('is-spinning'); setTimeout(() => btn.classList.remove('is-spinning'), 520); }
    });
    $('#pg-nav-home', root).addEventListener('click', () => {
      applyTemplate('aero');
      setBrowserTab('preview');
      if (window.innerWidth <= 860) setEditorOpen(false);
    });

    $('#pg-zoom-in', root).addEventListener('click', () => adjustZoom(1.1));
    $('#pg-zoom-out', root).addEventListener('click', () => adjustZoom(1 / 1.1));
    refs.zoomValue.addEventListener('click', resetZoom);

    refs.editorToggle.addEventListener('click', () => setEditorOpen(!editorPanelOpen, { focus: true }));
    $('#pg-close-editor', root).addEventListener('click', () => { setEditorOpen(false); refs.editorToggle.focus(); });

    $('#pg-proj-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('pg.dbUnavailable'), 'error'); return; }
      const name = refs.projName.value.trim() || t('pg.projUntitled');
      refs.projName.value = name;
      try {
        await VT.db.put({ tool: 'playground', name, data: current() });
        toast(t('pg.projSaved', { name }), 'success');
        loadProjects();
      } catch (e) { toast(t('pg.dbError'), 'error'); }
    });

    root.addEventListener('keydown', e => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key === 'Enter') { e.preventDefault(); run(); return; }
      if (meta && (e.key === 's' || e.key === 'S')) { e.preventDefault(); $('#pg-proj-save', root)?.click(); return; }
      if (e.key === 'Escape') {
        if (refs.consoleBtn.getAttribute('aria-pressed') === 'true') { setBrowserTab('preview'); return; }
        if (editorPanelOpen) { setEditorOpen(false); refs.editorToggle.focus(); }
      }
    });

    setEditorOpen(startOpen);
    setViewport('desktop');
    setBrowserTab('preview');
    setAddress(currentTemplate || 'draft');
    selectTab('html', false);
    loadProjects();
    initEditors();

    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then(rec => {
        if (!alive) return;
        const restored = !!(rec && rec.data);
        if (restored) {
          currentTemplate = null;
          setEditorContent('html', rec.data.html || '');
          setEditorContent('css', rec.data.css || '');
          setEditorContent('js', rec.data.js || '');
        }
        run();
        if (restored) refs.hint.textContent = t('pg.restored');
      }).catch(() => { if (alive) run(); });
    } else {
      run();
    }

    return () => {
      alive = false;
      clearTimeout(runTimer);
      if (messageHandler) window.removeEventListener('message', messageHandler);
      messageHandler = null;
      VT.store.set(KEY, { doc: current() });
      Object.values(editors).forEach(ed => ed?.dispose?.());
      editors = {};
      simpleGutters = {};
    };
  }

  function unmount() {
    if (alive) VT.store.set(KEY, { doc: current() });
    alive = false;
    autosave = null;
    runTimer = null;
    if (messageHandler) { window.removeEventListener('message', messageHandler); messageHandler = null; }
    Object.values(editors).forEach(ed => ed?.dispose?.());
    editors = {};
    simpleGutters = {};
    refs = {};
  }

  const def = { id: 'playground', cat: 'developer', icon: 'code', version: '2.1.0', name: { en: 'Playground', pt: 'Playground' }, tagline: { en: 'Frutiger Aero Web Lab — live preview in a 2000s browser, Aero glass chrome, four authentic retro templates, line-numbered editors, console, export.', pt: 'Laboratório Web Frutiger Aero — preview ao vivo em navegador dos anos 2000, chrome Aero glass, quatro templates retrô autênticos, editores com números de linha, console, exportação.' }, tags: ['html','css','js','playground','sandbox','code','developer','aero','retro','web20','vista'], deps: [], docs: { en: { summary: 'A Frutiger Aero web laboratory. Write HTML, CSS, JS and watch it live in a 2000s browser simulation with authentic Aero glass chrome. Four templates: Aero Lab, MSN Portal, Web 2.0 Profile, Windows Vista Explorer. Line-numbered editors, auto-run, captured console, standalone export.', usage: ['Pick a template — Aero Lab, MSN Portal, Web 2.0 Profile, Windows Vista Explorer — or start blank.', 'Edit HTML, CSS, JS tabs; auto-run refreshes 250ms after you stop typing; Ctrl+Enter to run manually.', 'Preview is the HERO — a full 2000s browser with Aero glass chrome, tabs, address bar, live iframe.', 'Editor panel slides in from the left (toggle with the Editor button); the console is a tab in the browser chrome.', 'Viewport switch: Desktop / Tablet / Mobile. Save/load projects to IndexedDB.', 'Export standalone .html with CSS+JS inlined. Copy to clipboard.'], privacy: 'Code runs in sandboxed iframe (allow-scripts only, opaque origin). No eval. No upload. Console captured via postMessage shim.', limits: ['Sandboxed iframe: no localStorage, cookies, parent access. Network requests subject to CORS.', 'Console serializes to JSON; functions/DOM nodes become "[unserializable]".'] }, pt: { summary: 'Um laboratório web Frutiger Aero. Escreva HTML, CSS, JS e veja ao vivo em uma simulação de navegador dos anos 2000 com chrome Aero glass autêntico. Quatro templates: Aero Lab, Portal MSN, Perfil Web 2.0, Windows Vista Explorer. Editores com números de linha, execução automática, console capturado, exportação.', usage: ['Escolha um template — Aero Lab, Portal MSN, Perfil Web 2.0, Windows Vista Explorer — ou comece do zero.', 'Edite abas HTML, CSS, JS; execução automática atualiza 250ms após parar de digitar; Ctrl+Enter executa manual.', 'Preview é o HERÓI — um navegador 2000s completo com chrome Aero glass, tabs, barra de endereço, iframe ao vivo.', 'Painel do editor desliza da esquerda (o botão Editor alterna); o console é uma aba do navegador.', 'Viewport: Desktop / Tablet / Mobile. Salve/carregue projetos no IndexedDB.', 'Exporte .html autônomo com CSS+JS embutidos. Copie para clipboard.'], privacy: 'Código roda em iframe sandboxed (allow-scripts, origem opaca). Sem eval. Sem upload. Console via postMessage shim.', limits: ['Iframe sandboxed: sem localStorage, cookies, acesso ao pai. Requisições de rede sujeitas a CORS.', 'Console serializa para JSON; funções/nós DOM viram "[unserializable]".'] } }, mount, unmount };

  VT.i18n.add({ en: { 'pg.run': 'Run', 'pg.autoRun': 'Auto-run', 'pg.viewport': 'Viewport', 'pg.vpDesktop': 'Desktop', 'pg.vpMobile': 'Mobile', 'pg.vpTablet': 'Tablet', 'pg.templates': 'Templates', 'pg.reset': 'Clear', 'pg.copy': 'Copy HTML', 'pg.export': 'Export .html', 'pg.clear': 'Clear', 'pg.editor': 'Editor', 'pg.editors': 'Editors', 'pg.preview': 'Preview', 'pg.console': 'Console', 'pg.projects': 'Projects', 'pg.tpl.aero': 'Aero Lab', 'pg.tpl.portal': 'MSN Portal', 'pg.tpl.web20': 'Web 2.0 Profile', 'pg.tpl.vista': 'Windows Vista', 'pg.conEmpty': 'No output yet — type code to see live preview.', 'pg.ran': 'Code executed', 'pg.autoOn': 'Auto-run on', 'pg.autoOff': 'Auto-run off', 'pg.tplApplied': 'Template "{name}" loaded', 'pg.resetDone': 'Editors cleared', 'pg.restored': 'Restored your last snippet', 'pg.copied': 'HTML copied to clipboard', 'pg.copyFail': 'Could not copy — export the file instead.', 'pg.exported': 'Downloaded standalone .html', 'pg.projNamePh': 'Project name…', 'pg.projSave': 'Save', 'pg.projOpen': 'Open', 'pg.projUntitled': 'Untitled project', 'pg.projEmpty': 'Nothing saved yet.', 'pg.projSaved': 'Saved "{name}"', 'pg.projOpened': 'Opened "{name}"', 'pg.dbUnavailable': 'Local storage unavailable — projects cannot be saved.', 'pg.dbError': 'Could not reach local storage.', 'pg.privacy': 'Code runs only in a sandboxed frame with a unique opaque origin — it cannot reach this app or your files. No eval, no upload.' }, pt: { 'pg.run': 'Executar', 'pg.autoRun': 'Execução automática', 'pg.viewport': 'Janela', 'pg.vpDesktop': 'Desktop', 'pg.vpMobile': 'Mobile', 'pg.vpTablet': 'Tablet', 'pg.templates': 'Modelos', 'pg.reset': 'Limpar', 'pg.copy': 'Copiar HTML', 'pg.export': 'Exportar .html', 'pg.clear': 'Limpar', 'pg.editor': 'Editor', 'pg.editors': 'Editores', 'pg.preview': 'Prévia', 'pg.console': 'Console', 'pg.projects': 'Projetos', 'pg.tpl.aero': 'Laboratório Aero', 'pg.tpl.portal': 'Portal MSN', 'pg.tpl.web20': 'Perfil Web 2.0', 'pg.tpl.vista': 'Windows Vista', 'pg.conEmpty': 'Sem saída ainda — digite código para ver preview ao vivo.', 'pg.ran': 'Código executado', 'pg.autoOn': 'Execução automática ativada', 'pg.autoOff': 'Execução automática desativada', 'pg.tplApplied': 'Modelo "{name}" carregado', 'pg.resetDone': 'Editores limpos', 'pg.restored': 'Snippet anterior restaurado', 'pg.copied': 'HTML copiado para a área de transferência', 'pg.copyFail': 'Não foi possível copiar — exporte o arquivo.', 'pg.exported': 'Arquivo .html autônomo baixado', 'pg.projNamePh': 'Nome do projeto…', 'pg.projSave': 'Salvar', 'pg.projOpen': 'Abrir', 'pg.projUntitled': 'Projeto sem nome', 'pg.projEmpty': 'Nada salvo ainda.', 'pg.projSaved': 'Salvo "{name}"', 'pg.projOpened': 'Aberto "{name}"', 'pg.dbUnavailable': 'Armazenamento local indisponível — projetos não podem ser salvos.', 'pg.dbError': 'Não foi possível acessar o armazenamento local.', 'pg.privacy': 'O código roda apenas em um quadro isolado com origem opaca única — não alcança este app nem seus arquivos. Sem eval, sem envio.' } });

  VT.i18n.add({
    en: {
      'pg.runTip': 'Run now (Ctrl+Enter)',
      'pg.autoTip': 'Re-render 250 ms after you stop typing',
      'pg.tplChoose': 'Open a template…',
      'pg.fullscreen': 'Fullscreen preview',
      'pg.closeEditor': 'Close editor',
      'pg.back': 'Back',
      'pg.forward': 'Forward',
      'pg.refresh': 'Run again',
      'pg.home': 'Lab home',
      'pg.address': 'Address',
      'pg.sandbox': 'Sandboxed frame: scripts only, opaque origin',
      'pg.sandboxShort': 'sandbox: scripts only',
      'pg.zoomOut': 'Zoom out',
      'pg.zoomIn': 'Zoom in',
      'pg.zoomReset': 'Reset zoom to 100%',
      'pg.previewTab': 'Live preview',
      'pg.consoleTab': 'Console',
      'pg.live': 'Live',
      'pg.ready': 'Ready'
    },
    pt: {
      'pg.runTip': 'Executar agora (Ctrl+Enter)',
      'pg.autoTip': 'Re-renderiza 250 ms depois que você para de digitar',
      'pg.tplChoose': 'Abrir um modelo…',
      'pg.fullscreen': 'Prévia em tela cheia',
      'pg.closeEditor': 'Fechar editor',
      'pg.back': 'Voltar',
      'pg.forward': 'Avançar',
      'pg.refresh': 'Executar de novo',
      'pg.home': 'Início do laboratório',
      'pg.address': 'Endereço',
      'pg.sandbox': 'Frame isolado: apenas scripts, origem opaca',
      'pg.sandboxShort': 'sandbox: apenas scripts',
      'pg.zoomOut': 'Diminuir zoom',
      'pg.zoomIn': 'Aumentar zoom',
      'pg.zoomReset': 'Restaurar zoom para 100%',
      'pg.previewTab': 'Prévia ao vivo',
      'pg.consoleTab': 'Console',
      'pg.live': 'Ao vivo',
      'pg.ready': 'Pronto'
    }
  });

  VT.registry.add(def); return def;
})();
