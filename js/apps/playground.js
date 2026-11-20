window.VT = window.VT || {};

/* PG · HTML/CSS/JS Playground — Frutiger Aero Web Lab
 * 2000s browser simulation, live preview, syntax highlighting, console capture.
 * Sandbox iframe, postMessage console shim, local persistence, standalone export.
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
  let editors = { html: null, css: null, js: null };

  // ---------- in-frame console shim (serialized strings only) ----------
  const SHIM = [
    '<' + 'script>(function(){',
    'function fmt(a){try{return Array.prototype.slice.call(a).map(function(x){if(x&&typeof x==="object"){try{return JSON.stringify(x)}catch(e){return String(x)}}return String(x)}).join(" ")}catch(e){return "[unserializable]"}}',
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

  // ---------- Frutiger Aero / Web 2.0 Templates ----------
  const TEMPLATES = {
    portal: {
      name: 'pg.tpl.portal',
      html: `<div class="aero-browser-chrome">
  <div class="aero-window" data-theme="aqua">
    <div class="aero-titlebar">
      <div class="aero-icon">🌐</div>
      <div class="aero-title">MSN Portal — Internet Explorer 7</div>
      <div class="aero-controls">
        <button class="aero-btn" title="Minimize">_</button>
        <button class="aero-btn" title="Maximize">□</button>
        <button class="aero-btn close" title="Close">✕</button>
      </div>
    </div>
    <div class="aero-toolbar">
      <div class="aero-address">
        <span class="aero-lock">🔒</span>
        <input type="text" value="https://www.msn.com/" readonly>
      </div>
      <div class="aero-search">
        <input type="search" placeholder="Search the web...">
        <button class="aero-go">Go</button>
      </div>
    </div>
    <div class="aero-tabs">
      <button class="aero-tab active">MSN Home</button>
      <button class="aero-tab">News</button>
      <button class="aero-tab">Weather</button>
      <button class="aero-tab">Mail</button>
      <button class="aero-tab-new">+</button>
    </div>
    <div class="aero-content">
      <div class="aero-sidebar">
        <div class="aero-panel">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#">Hotmail</a></li>
            <li><a href="#">Messenger</a></li>
            <li><a href="#">Spaces</a></li>
            <li><a href="#">Groups</a></li>
          </ul>
        </div>
        <div class="aero-panel">
          <h3>Today</h3>
          <div class="aero-weather">☀️ 24°C Sunny</div>
          <div class="aero-stocks">📈 MSFT +2.3%</div>
        </div>
      </div>
      <div class="aero-main">
        <div class="aero-hero">
          <h1>Welcome to the Web 2.0</h1>
          <p>Experience the internet like it's 2007</p>
          <button class="aero-btn-primary">Get Started</button>
        </div>
        <div class="aero-news-grid">
          <article class="aero-card"><h3>Breaking: Vista Released</h3><p>Windows Vista brings Aero Glass...</p></article>
          <article class="aero-card"><h3>iPhone Changes Everything</h3><p>Apple unveils revolutionary phone...</p></article>
          <article class="aero-card"><h3>Web 2.0 Summit</h3><p>Social media, AJAX, and the future...</p></article>
        </div>
      </div>
    </div>
    <div class="aero-statusbar">
      <span>Done</span>
      <span class="aero-zoom">100%</span>
    </div>
  </div>
</div>`,
      css: `@import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(135deg, #0a2a4a 0%, #1a4a6a 50%, #0a3a5a 100%); min-height: 100vh; padding: 20px; color: #eaf7ff; }
.aero-browser-chrome { display: flex; justify-content: center; }
.aero-window { width: 100%; max-width: 900px; background: rgba(10, 30, 50, 0.9); border: 1px solid rgba(95, 230, 255, 0.3); border-radius: 8px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); }
.aero-titlebar { display: flex; align-items: center; padding: 8px 12px; background: linear-gradient(180deg, rgba(95, 230, 255, 0.15), rgba(10, 40, 70, 0.8)); border-bottom: 1px solid rgba(95, 230, 255, 0.2); }
.aero-icon { width: 16px; height: 16px; margin-right: 8px; }
.aero-title { flex: 1; font-size: 12px; font-weight: 600; color: #eaf7ff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
.aero-controls { display: flex; gap: 4px; }
.aero-btn { width: 20px; height: 20px; border: 1px solid rgba(95, 230, 255, 0.3); background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02)); border-radius: 3px; color: #eaf7ff; font-size: 11px; cursor: pointer; }
.aero-btn.close { background: linear-gradient(180deg, rgba(255,100,100,0.2), rgba(200,50,50,0.2)); border-color: rgba(255,100,100,0.4); }
.aero-toolbar { display: flex; gap: 8px; padding: 8px; background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0)); border-bottom: 1px solid rgba(95, 230, 255, 0.1); }
.aero-address { flex: 1; max-width: 400px; }
.aero-address input { width: 100%; padding: 6px 10px; border: 1px solid rgba(95, 230, 255, 0.3); border-radius: 4px; background: rgba(255,255,255,0.1); color: #eaf7ff; font-size: 12px; }
.aero-search { display: flex; gap: 4px; }
.aero-search input { padding: 6px 10px; border: 1px solid rgba(95, 230, 255, 0.3); border-radius: 4px; background: rgba(255,255,255,0.1); color: #eaf7ff; font-size: 12px; width: 200px; }
.aero-go { padding: 6px 14px; border: 1px solid rgba(95, 230, 255, 0.5); background: linear-gradient(180deg, rgba(95, 230, 255, 0.2), rgba(10, 60, 100, 0.3)); border-radius: 4px; color: #eaf7ff; cursor: pointer; }
.aero-tabs { display: flex; background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0)); border-bottom: 1px solid rgba(95, 230, 255, 0.1); padding: 0 8px; }
.aero-tab { padding: 6px 16px; border: 1px solid transparent; border-bottom: none; border-radius: 4px 4px 0 0; background: transparent; color: #a8d0e6; font-size: 11px; cursor: pointer; margin-bottom: -1px; }
.aero-tab.active { background: rgba(10, 30, 50, 0.9); border-color: rgba(95, 230, 255, 0.3); border-bottom-color: rgba(10, 30, 50, 0.9); color: #5fe6ff; font-weight: 600; }
.aero-tab-new { margin-left: auto; width: 24px; height: 24px; border: 1px solid rgba(95, 230, 255, 0.3); border-radius: 4px; background: transparent; color: #5fe6ff; font-size: 16px; cursor: pointer; }
.aero-content { display: flex; padding: 16px; gap: 16px; min-height: 300px; }
.aero-sidebar { width: 200px; flex-shrink: 0; display: flex; flex-direction: column; gap: 12px; }
.aero-panel { background: rgba(10, 40, 70, 0.6); border: 1px solid rgba(95, 230, 255, 0.15); border-radius: 6px; padding: 12px; }
.aero-panel h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #5fe6ff; }
.aero-panel ul { margin: 0; padding-left: 18px; font-size: 12px; }
.aero-panel li { margin: 4px 0; }
.aero-panel a { color: #a8d0e6; text-decoration: none; }
.aero-panel a:hover { color: #5fe6ff; }
.aero-weather, .aero-stocks { font-size: 12px; color: #c8e8f8; margin: 4px 0; }
.aero-main { flex: 1; display: flex; flex-direction: column; gap: 16px; }
.aero-hero { background: linear-gradient(135deg, rgba(95, 230, 255, 0.1), rgba(168, 208, 230, 0.05)); border: 1px solid rgba(95, 230, 255, 0.2); border-radius: 8px; padding: 24px; text-align: center; }
.aero-hero h1 { margin: 0 0 8px; font-size: 24px; color: #5fe6ff; text-shadow: 0 2px 10px rgba(95, 230, 255, 0.3); }
.aero-hero p { margin: 0 0 16px; color: #c8e8f8; }
.aero-btn-primary { padding: 10px 24px; border: 1px solid rgba(95, 230, 255, 0.5); background: linear-gradient(180deg, rgba(95, 230, 255, 0.2), rgba(10, 60, 100, 0.4)); border-radius: 4px; color: #eaf7ff; font-weight: 600; cursor: pointer; }
.aero-news-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.aero-card { background: rgba(10, 40, 70, 0.5); border: 1px solid rgba(95, 230, 255, 0.1); border-radius: 6px; padding: 12px; }
.aero-card h3 { margin: 0 0 6px; font-size: 13px; color: #eaf7ff; }
.aero-card p { margin: 0; font-size: 11px; color: #a8d0e6; line-height: 1.4; }
.aero-statusbar { display: flex; justify-content: space-between; padding: 4px 12px; background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0)); border-top: 1px solid rgba(95, 230, 255, 0.1); font-size: 11px; color: #a8d0e6; }
.aero-zoom { color: #5fe6ff; }`,
      js: `// MSN Portal 2007 - Interactive Elements
console.log('%c🌐 MSN Portal Loaded', 'color: #5fe6ff; font-size: 14px; font-weight: bold');
console.log('Internet Explorer 7.0.5730.13');
console.log('Rendering engine: Trident 4.0');

// Tab switching simulation
document.querySelectorAll('.aero-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.aero-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    console.log('Tab switched to:', tab.textContent);
  });
});

// Button interactions
document.querySelector('.aero-btn-primary')?.addEventListener('click', () => {
  alert('Welcome to the Web 2.0! 🌊');
  console.log('User clicked Get Started');
});

document.querySelector('.aero-go')?.addEventListener('click', () => {
  console.log('Search initiated');
});

// Window controls
document.querySelector('.aero-btn.close')?.addEventListener('click', () => {
  console.log('Window close requested');
});

// Animate cards on load
document.querySelectorAll('.aero-card').forEach((card, i) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  setTimeout(() => {
    card.style.transition = 'all 0.5s ease';
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 100 + i * 150);
});

// Simulate live clock
const statusText = document.querySelector('.aero-statusbar span');
if (statusText) {
  setInterval(() => {
    const now = new Date();
    statusText.textContent = 'Done • ' + now.toLocaleTimeString();
  }, 1000);
}

console.log('%c✨ Portal ready — Web 2.0 experience loaded', 'color: #a8ff78; font-size: 12px');`,
    },
    web20: {
      name: 'pg.tpl.web20',
      html: `<div class="web20-site">
  <div class="web20-header">
    <div class="web20-logo">
      <span class="logo-icon">✨</span>
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
    </nav>
    <div class="web20-search">
      <input type="search" placeholder="Search for people...">
      <button>Search</button>
    </div>
  </div>
  <div class="web20-body">
    <aside class="web20-sidebar">
      <div class="web20-module">
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
      <div class="web20-module">
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
      <div class="web20-module">
        <h3>📅 Calendar</h3>
        <div class="web20-cal">Aug 2007</div>
      </div>
    </aside>
    <main class="web20-main">
      <div class="web20-module web20-hero">
        <h2>Welcome to my profile! 🌟</h2>
        <p>Thanks for stopping by! This is my little corner of the internet. Feel free to leave a comment, check out my photos, or listen to my playlist!</p>
        <div class="web20-badges">
          <span class="badge">🌈 Rainbow Theme</span>
          <span class="badge">💖 glitter graphics</span>
          <span class="badge">✨ custom cursor</span>
          <span class="badge">🎵 autoplay music</span>
        </div>
      </div>
      <div class="web20-module">
        <h3>📝 Latest Blog Entry</h3>
        <div class="web20-blog-meta">Posted <strong>2 hours ago</strong> • <a href="#">5 comments</a></div>
        <p>Just got back from the concert last night! The energy was absolutely incredible. The light show, the crowd, the music... everything was perfect. Still ringing in my ears but totally worth it.</p>
        <p>Currently working on my new layout — trying to get the perfect combination of glitter backgrounds, custom scrollbars, and that one song that plays automatically. You know the one.</p>
        <div class="web20-tags">Tags: <a href="#">music</a>, <a href="#">concert</a>, <a href="#">life</a>, <a href="#">awesome</a></div>
      </div>
      <div class="web20-module">
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
    </main>
  </div>
  <footer class="web20-footer">
    © 2007 MySpace.com • <a href="#">Terms</a> • <a href="#">Privacy</a> • <a href="#">Safety Tips</a> • <a href="#">Contact</a>
  </footer>
</div>`,
      css: `@import url('https://fonts.googleapis.com/css2?family=Verdana:wght@400;700&family=Trebuchet+MS:wght@400;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Trebuchet MS', Verdana, sans-serif; background: #8a2be2 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M0 0h100v100H0z' fill='%237b1fa2'/%3E%3Cpath d='M0 0h50v50H0zM50 50h50v50H50z' fill='%239c27b0'/%3E%3C/svg%3E") repeat; background-size: 60px 60px; color: #2a2a2a; min-height: 100vh; padding: 10px; }
.web20-site { max-width: 980px; margin: 0 auto; background: #fff; border: 2px solid #ff00ff; border-radius: 4px; box-shadow: 0 0 30px rgba(255, 0, 255, 0.3); overflow: hidden; }
.web20-header { background: linear-gradient(90deg, #ff00ff, #8a2be2, #00ffff); padding: 10px 15px; border-bottom: 3px double #fff; position: relative; }
.web20-header::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #ff00ff, #ffff00, #00ffff, #ff00ff); background-size: 200% 100%; animation: shimmer 3s linear infinite; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.web20-logo { display: flex; align-items: center; gap: 8px; }
.logo-icon { font-size: 28px; text-shadow: 2px 2px 0 #fff, 4px 4px 0 #ff00ff; }
.logo-text { font-size: 26px; font-weight: bold; color: #fff; text-shadow: 2px 2px 0 #8a2be2, 4px 4px 0 #000; }
.logo-text span { color: #ffff00; text-shadow: 2px 2px 0 #ff00ff, 4px 4px 0 #000; }
.logo-beta { background: #ff00ff; color: #fff; font-size: 9px; font-weight: bold; padding: 2px 6px; border-radius: 3px; margin-left: 8px; animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.web20-nav { display: flex; gap: 4px; margin: 10px 0; flex-wrap: wrap; }
.web20-nav a { background: rgba(255,255,255,0.3); border: 1px solid rgba(255,255,255,0.5); padding: 4px 12px; border-radius: 12px; color: #fff; text-decoration: none; font-size: 11px; font-weight: bold; text-transform: uppercase; }
.web20-nav a.active, .web20-nav a:hover { background: #fff; color: #8a2be2; }
.web20-search { display: flex; gap: 4px; margin-top: 8px; }
.web20-search input { padding: 4px 8px; border: 1px solid #8a2be2; border-radius: 3px; font-size: 11px; width: 180px; }
.web20-search button { background: #ff00ff; border: 1px solid #fff; color: #fff; padding: 4px 10px; border-radius: 3px; font-size: 11px; cursor: pointer; }
.web20-body { display: flex; padding: 15px; gap: 15px; }
.web20-sidebar { width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 15px; }
.web20-module { background: #fff; border: 2px solid; border-radius: 8px; padding: 12px; }
.web20-module:nth-child(1) { border-color: #ff00ff; }
.web20-module:nth-child(2) { border-color: #00ffff; }
.web20-module:nth-child(3) { border-color: #ffff00; }
.web20-module h3 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 6px; }
.web20-module:nth-child(1) h3 { color: #ff00ff; }
.web20-module:nth-child(2) h3 { color: #00ffff; }
.web20-module:nth-child(3) h3 { color: #cc9900; }
.web20-avatar { width: 80px; height: 80px; border: 3px solid #ff00ff; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-size: 36px; background: linear-gradient(135deg, #ffe6ff, #e6ffff); }
.web20-user { text-align: center; margin: 0 0 4px; font-weight: bold; font-size: 14px; }
.web20-location { text-align: center; margin: 0 0 10px; font-size: 11px; color: #666; }
.web20-stats { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #444; }
.web20-player { background: #f0f0f0; border: 1px inset #ccc; padding: 10px; border-radius: 4px; }
.web20-track { font-size: 11px; font-weight: bold; margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.web20-progress { height: 6px; background: #ddd; border: 1px inset #aaa; border-radius: 3px; overflow: hidden; }
.web20-bar { height: 100%; background: linear-gradient(90deg, #ff00ff, #00ffff); border-radius: 3px; transition: width 0.3s; }
.web20-controls { display: flex; justify-content: center; gap: 8px; margin-top: 8px; }
.web20-controls button { width: 28px; height: 28px; border: 1px outset #ccc; background: #f0f0f0; border-radius: 3px; cursor: pointer; font-size: 12px; }
.web20-controls button:active { border-style: inset; }
.web20-controls button.play { background: #ff00ff; color: #fff; }
.web20-cal { text-align: center; font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.8; }
.web20-main { flex: 1; display: flex; flex-direction: column; gap: 15px; }
.web20-hero { background: linear-gradient(135deg, #ffe6ff 0%, #e6ffff 50%, #ffffe6 100%); border: 2px solid #ff00ff; border-radius: 8px; padding: 20px; text-align: center; position: relative; overflow: hidden; }
.web20-hero::before { content: '✨ 💖 ✨ 💖 ✨'; position: absolute; top: 10px; right: 10px; font-size: 12px; opacity: 0.5; animation: float 4s ease-in-out infinite; }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
.web20-hero h2 { margin: 0 0 10px; font-size: 20px; color: #8a2be2; text-shadow: 1px 1px 0 #fff; }
.web20-hero p { margin: 0 0 15px; color: #444; line-height: 1.5; }
.web20-badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
.badge { background: linear-gradient(135deg, #ff00ff, #00ffff); color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; border: 1px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.web20-blog-meta { font-size: 11px; color: #666; margin-bottom: 8px; }
.web20-blog-meta a { color: #00ffff; }
.web20-module p { margin: 0 0 10px; line-height: 1.6; color: #333; }
.web20-tags { font-size: 11px; color: #666; margin-top: 10px; }
.web20-tags a { color: #ff00ff; text-decoration: underline; }
.web20-comment { display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px dashed #ddd; }
.web20-comment:last-child { border-bottom: none; }
.web20-comment-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #ffe6ff, #e6ffff); display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid #ff00ff; flex-shrink: 0; }
.web20-comment-body strong { color: #8a2be2; }
.web20-comment-body span { font-size: 10px; color: #999; margin-left: 8px; }
.web20-comment-body p { margin: 4px 0 0; font-size: 12px; color: #333; }
.web20-footer { background: #f0f0f0; border-top: 1px solid #ddd; padding: 10px; text-align: center; font-size: 10px; color: #666; }
.web20-footer a { color: #00ffff; text-decoration: underline; }`,
      js: `// MySpace Profile 2007 - Web 2.0 Experience
console.log('%c✨ MySpace Profile Loaded', 'color: #ff00ff; font-size: 16px; font-weight: bold; text-shadow: 1px 1px 0 #000');
console.log('%c🎵 Music: Dashboard - Modest Mouse', 'color: #00ffff; font-size: 12px');
console.log('%c💖 Layout: Custom Glitter Theme v3.2', 'color: #ffff00; font-size: 12px; text-shadow: 1px 1px 0 #f00');
console.log('%c🌈 Cursor: Custom (trail enabled)', 'color: #00ff00; font-size: 12px');

// Music player simulation
let isPlaying = true;
const playBtn = document.querySelector('.web20-controls .play');
const progressBar = document.querySelector('.web20-bar');
if (playBtn && progressBar) {
  playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸' : '▶';
    console.log(isPlaying ? '♪ Resumed playback' : '⏸ Paused');
  });
  // Animate progress
  let progress = 45;
  setInterval(() => {
    if (isPlaying) {
      progress = (progress + 0.5) % 100;
      progressBar.style.width = progress + '%';
    }
  }, 1000);
}

// Nav interactions
document.querySelectorAll('.web20-nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.web20-nav a').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    console.log('Navigating to:', link.textContent);
  });
});

// Comment interactions
document.querySelectorAll('.web20-comment').forEach(comment => {
  comment.style.cursor = 'pointer';
  comment.addEventListener('mouseenter', () => {
    comment.style.background = 'rgba(255, 0, 255, 0.05)';
  });
  comment.addEventListener('mouseleave', () => {
    comment.style.background = 'transparent';
  });
});

// Floating sparkles
function createSparkle() {
  const sparkle = document.createElement('div');
  sparkle.textContent = ['✨', '💖', '⭐', '✦'][Math.floor(Math.random() * 4)];
  sparkle.style.position = 'fixed';
  sparkle.style.left = Math.random() * window.innerWidth + 'px';
  sparkle.style.top = window.innerHeight + 'px';
  sparkle.style.fontSize = '16px';
  sparkle.style.pointerEvents = 'none';
  sparkle.style.zIndex = '9999';
  sparkle.style.animation = 'sparkleFall 3s linear forwards';
  document.body.appendChild(sparkle);
  setTimeout(() => sparkle.remove(), 3000);
}
const style = document.createElement('style');
style.textContent = '@keyframes sparkleFall { 0% { transform: translateY(0) rotate(0deg); opacity: 1; } 100% { transform: translateY(-' + (window.innerHeight + 100) + 'px) rotate(360deg); opacity: 0; } }';
document.head.appendChild(style);
setInterval(createSparkle, 800);

// Glitter trail on mouse move
let lastTrail = 0;
document.addEventListener('mousemove', (e) => {
  const now = Date.now();
  if (now - lastTrail > 50) {
    const trail = document.createElement('div');
    trail.textContent = '✨';
    trail.style.position = 'fixed';
    trail.style.left = e.clientX + 'px';
    trail.style.top = e.clientY + 'px';
    trail.style.fontSize = '10px';
    trail.style.pointerEvents = 'none';
    trail.style.zIndex = '9999';
    trail.style.animation = 'trailFade 0.8s ease-out forwards';
    document.body.appendChild(trail);
    setTimeout(() => trail.remove(), 800);
    lastTrail = now;
  }
});
const trailStyle = document.createElement('style');
trailStyle.textContent = '@keyframes trailFade { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0); opacity: 0; } }';
document.head.appendChild(trailStyle);

console.log('%c🌐 Welcome to Web 2.0 — where everything is social, shiny, and slightly broken', 'color: #ff00ff; font-size: 13px; font-weight: bold');`,
    },
    aqua: {
      name: 'pg.tpl.aqua',
      html: `<div class="aqua-os">
  <div class="aqua-desktop">
    <div class="aqua-dock" id="dock">
      <div class="dock-item" data-app="finder"><span class="dock-icon">😀</span><span class="dock-label">Finder</span></div>
      <div class="dock-item" data-app="safari"><span class="dock-icon">🧭</span><span class="dock-label">Safari</span></div>
      <div class="dock-item" data-app="mail"><span class="dock-icon">📬</span><span class="dock-label">Mail</span></div>
      <div class="dock-item" data-app="ichat"><span class="dock-icon">💬</span><span class="dock-label">iChat</span></div>
      <div class="dock-item" data-app="itunes"><span class="dock-icon">🎵</span><span class="dock-label">iTunes</span></div>
      <div class="dock-item" data-app="photos"><span class="dock-icon">🖼️</span><span class="dock-label">Photos</span></div>
      <div class="dock-item" data-app="dashboard"><span class="dock-icon">📊</span><span class="dock-label">Dashboard</span></div>
      <div class="dock-divider"></div>
      <div class="dock-item" data-app="trash"><span class="dock-icon">🗑️</span><span class="dock-label">Trash</span></div>
    </div>
    <div class="aqua-window" id="safari-window" data-app="safari">
      <div class="window-titlebar">
        <div class="window-controls">
          <button class="close" title="Close"></button>
          <button class="minimize" title="Minimize"></button>
          <button class="zoom" title="Zoom"></button>
        </div>
        <div class="window-title">Safari — Apple</div>
        <div class="window-proxy">🧭</div>
      </div>
      <div class="window-toolbar">
        <div class="nav-buttons">
          <button class="toolbar-btn back" disabled>◀</button>
          <button class="toolbar-btn forward" disabled>▶</button>
        </div>
        <div class="address-bar">
          <span class="lock-icon">🔒</span>
          <input type="text" value="https://www.apple.com/" readonly>
        </div>
        <div class="search-field">
          <input type="search" placeholder="Search or enter address">
        </div>
      </div>
      <div class="window-tabs">
        <button class="tab active">Apple</button>
        <button class="tab">Mac</button>
        <button class="tab">iPod</button>
        <button class="tab">iPhone</button>
        <button class="tab">Support</button>
        <button class="new-tab">+</button>
      </div>
      <div class="window-content">
        <div class="aqua-hero">
          <h1>Mac OS X Tiger</h1>
          <p class="version">Version 10.4 — "Spotlight on everything"</p>
          <div class="hero-features">
            <div class="feature"><span class="feature-icon">🔍</span><h3>Spotlight</h3><p>Search your Mac instantly</p></div>
            <div class="feature"><span class="feature-icon">📊</span><h3>Dashboard</h3><p>Mini-apps at your fingertips</p></div>
            <div class="feature"><span class="feature-icon">💬</span><h3>iChat AV</h3><p>Video conferencing built-in</p></div>
            <div class="feature"><span class="feature-icon">🎵</span><h3>iTunes 6</h3><p>Podcasts, videos, music</p></div>
          </div>
        </div>
      </div>
      <div class="window-statusbar">
        <span>Done</span>
        <span class="resize-handle">⋮⋮</span>
      </div>
    </div>
    <div class="aqua-window" id="finder-window" data-app="finder" style="top: 100px; left: 600px; width: 400px; height: 300px;">
      <div class="window-titlebar">
        <div class="window-controls">
          <button class="close" title="Close"></button>
          <button class="minimize" title="Minimize"></button>
          <button class="zoom" title="Zoom"></button>
        </div>
        <div class="window-title">Documents</div>
        <div class="window-proxy">📁</div>
      </div>
      <div class="window-toolbar finder-toolbar">
        <div class="view-buttons">
          <button class="view-btn active" data-view="icons">⬜</button>
          <button class="view-btn" data-view="list">☰</button>
          <button class="view-btn" data-view="columns">⏐⏐</button>
        </div>
        <div class="path-bar">📁 Macintosh HD › Users › alex › Documents</div>
      </div>
      <div class="window-content finder-content">
        <div class="sidebar">
          <div class="sidebar-section">
            <h4>FAVORITES</h4>
            <ul><li>🖥️ Desktop</li><li>🏠 Home</li><li>💾 Applications</li></ul>
          </div>
          <div class="sidebar-section">
            <h4>DEVICES</h4>
            <ul><li>💿 Macintosh HD</li><li>📀 Install DVD</li></ul>
          </div>
          <div class="sidebar-section">
            <h4>SHARED</h4>
            <ul><li>🖥️ Alex's MacBook</li></ul>
          </div>
        </div>
        <div class="file-list">
          <div class="file-item"><span class="file-icon">📄</span><span>Resume.pdf</span></div>
          <div class="file-item"><span class="file-icon">📊</span><span>Budget.xls</span></div>
          <div class="file-item"><span class="file-icon">🖼️</span><span>Vacation.jpg</span></div>
          <div class="file-item"><span class="file-icon">📝</span><span>Notes.txt</span></div>
          <div class="file-item"><span class="file-icon">📁</span><span>Projects</span></div>
          <div class="file-item"><span class="file-icon">📁</span><span>Photos</span></div>
        </div>
      </div>
    </div>
    <div class="menu-bar">
      <div class="menu-apple">🍎</div>
      <div class="menu-items">
        <span class="menu-item">Finder</span>
        <span class="menu-item">File</span>
        <span class="menu-item">Edit</span>
        <span class="menu-item">View</span>
        <span class="menu-item">Go</span>
        <span class="menu-item">Window</span>
        <span class="menu-item">Help</span>
      </div>
      <div class="menu-right">
        <span class="menu-extra">🔍</span>
        <span class="menu-extra">📊</span>
        <span class="menu-extra">🔋</span>
        <span class="menu-extra">📅</span>
        <span class="menu-clock">10:41 AM</span>
      </div>
    </div>
  </div>
</div>`,
      css: `@import url('https://fonts.googleapis.com/css2?family=Lucida+Grande:wght@400;600&display=swap');
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Lucida Grande', 'Segoe UI', sans-serif; background: linear-gradient(135deg, #4a90d9 0%, #2a6ab5 50%, #1a4a8a 100%); min-height: 100vh; color: #1a1a1a; overflow: hidden; }
.aqua-desktop { position: relative; width: 100%; height: 100vh; overflow: hidden; }
.aqua-dock { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); display: flex; align-items: flex-end; gap: 4px; padding: 6px 12px; background: linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1)); border: 1px solid rgba(255,255,255,0.3); border-radius: 40px; box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.5); backdrop-filter: blur(20px); z-index: 100; }
.dock-item { display: flex; flex-direction: column; align-items: center; padding: 8px 12px 4px; cursor: pointer; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; }
.dock-item:hover { transform: translateY(-8px) scale(1.2); z-index: 10; }
.dock-item::before { content: ''; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 8px; height: 8px; background: #00d4ff; border-radius: 50%; opacity: 0; transition: opacity 0.2s; }
.dock-item:hover::before { opacity: 1; }
.dock-icon { font-size: 32px; margin-bottom: 2px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3)); transition: transform 0.2s; }
.dock-item:hover .dock-icon { transform: scale(1.3); }
.dock-label { font-size: 9px; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); white-space: nowrap; opacity: 0; transition: opacity 0.15s; pointer-events: none; }
.dock-item:hover .dock-label { opacity: 1; }
.dock-divider { width: 2px; height: 48px; background: linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent); margin: 0 4px; }
.aqua-window { position: absolute; background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85)); border: 1px solid rgba(255,255,255,0.5); border-radius: 8px 8px 6px 6px; box-shadow: 0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8); overflow: hidden; min-width: 300px; min-height: 200px; z-index: 10; transition: box-shadow 0.2s; }
.aqua-window:focus-within, .aqua-window:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9); z-index: 20; }
.window-titlebar { display: flex; align-items: center; height: 32px; padding: 0 12px; background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6)); border-bottom: 1px solid rgba(255,255,255,0.3); cursor: move; -webkit-app-region: drag; }
.window-controls { display: flex; gap: 6px; -webkit-app-region: no-drag; }
.window-controls button { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.15); box-shadow: inset 0 1px 0 rgba(255,255,255,0.5); cursor: pointer; transition: all 0.15s; }
.window-controls .close { background: linear-gradient(180deg, #fc625d, #d14843); border-color: #a83d3a; }
.window-controls .close:hover { background: linear-gradient(180deg, #ff7a76, #e85d58); box-shadow: 0 0 8px rgba(252, 98, 93, 0.5); }
.window-controls .minimize { background: linear-gradient(180deg, #fdbc40, #e6ac2a); border-color: #b88a20; }
.window-controls .minimize:hover { background: linear-gradient(180deg, #ffe458, #fdc83e); }
.window-controls .zoom { background: linear-gradient(180deg, #34c84a, #28a73c); border-color: #1e822f; }
.window-controls .zoom:hover { background: linear-gradient(180deg, #4ae060, #3cd84f); }
.window-title { flex: 1; text-align: center; font-size: 12px; font-weight: 600; color: #333; text-shadow: 0 1px 0 rgba(255,255,255,0.8); -webkit-app-region: drag; }
.window-proxy { width: 16px; height: 16px; font-size: 14px; -webkit-app-region: no-drag; }
.window-toolbar { display: flex; align-items: center; gap: 8px; height: 48px; padding: 0 12px; background: linear-gradient(180deg, rgba(240,240,240,0.9), rgba(220,220,220,0.8)); border-bottom: 1px solid rgba(255,255,255,0.3); }
.nav-buttons { display: flex; gap: 2px; }
.toolbar-btn { width: 28px; height: 28px; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px; background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(230,230,230,0.8)); cursor: pointer; font-size: 12px; color: #333; transition: all 0.1s; box-shadow: inset 0 1px 0 rgba(255,255,255,0.6); }
.toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.toolbar-btn:hover:not(:disabled) { background: linear-gradient(180deg, rgba(255,255,255,1), rgba(240,240,240,0.9)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.8), 0 0 8px rgba(0,212,255,0.3); }
.address-bar { flex: 1; max-width: 400px; display: flex; align-items: center; gap: 6px; padding: 0 10px; height: 28px; background: rgba(255,255,255,0.8); border: 1px solid rgba(0,0,0,0.1); border-radius: 14px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
.lock-icon { color: #34c84a; font-size: 11px; }
.address-bar input { border: none; background: transparent; font-size: 12px; color: #333; width: 100%; outline: none; }
.search-field { width: 160px; }
.search-field input { width: 100%; padding: 4px 10px 4px 28px; border: 1px solid rgba(0,0,0,0.1); border-radius: 14px; background: rgba(255,255,255,0.8) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23666' d='M7 12a5 5 0 100-10 5 5 0 000 10zm0-1a4 4 0 110-8 4 4 0 010 8zm6.5-6.5l3.5 3.5-1 1-3.5-3.5 1-1z'/%3E%3C/svg%3E") no-repeat 8px center; background-size: 14px; font-size: 11px; color: #333; outline: none; }
.window-tabs { display: flex; height: 28px; background: linear-gradient(180deg, rgba(230,230,230,0.9), rgba(210,210,210,0.8)); border-bottom: 1px solid rgba(255,255,255,0.3); }
.tab { padding: 0 16px; border: none; background: transparent; border-right: 1px solid rgba(255,255,255,0.3); border-left: 1px solid rgba(0,0,0,0.05); font-size: 11px; color: #333; cursor: pointer; transition: background 0.1s; height: 100%; }
.tab:first-child { border-left: none; border-radius: 6px 0 0 0; }
.tab.active { background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85)); font-weight: 600; color: #1a1a1a; }
.tab:hover:not(.active) { background: rgba(255,255,255,0.4); }
.new-tab { width: 28px; border: none; background: transparent; font-size: 18px; color: #666; cursor: pointer; border-radius: 0 6px 0 0; margin-left: auto; }
.window-content { flex: 1; overflow: auto; }
.aqua-hero { padding: 40px 60px; text-align: center; background: linear-gradient(135deg, rgba(0,212,255,0.08), rgba(100,200,255,0.04)); }
.aqua-hero h1 { margin: 0 0 8px; font-size: 36px; font-weight: 400; color: #1a3a5c; letter-spacing: -1px; }
.version { margin: 0 0 32px; font-size: 14px; color: #666; }
.hero-features { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 32px; }
.feature { text-align: center; padding: 20px; background: rgba(255,255,255,0.5); border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); transition: transform 0.2s, box-shadow 0.2s; }
.feature:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
.feature-icon { font-size: 32px; display: block; margin-bottom: 12px; }
.feature h3 { margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #1a3a5c; }
.feature p { margin: 0; font-size: 12px; color: #666; }
.window-statusbar { display: flex; justify-content: space-between; height: 20px; padding: 0 8px; background: linear-gradient(180deg, rgba(230,230,230,0.9), rgba(210,210,210,0.8)); border-top: 1px solid rgba(255,255,255,0.3); font-size: 11px; color: #666; }
.resize-handle { cursor: se-resize; opacity: 0.5; }
.finder-toolbar { height: 40px; }
.view-buttons { display: flex; gap: 2px; margin-right: 12px; }
.view-btn { width: 28px; height: 28px; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px; background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(230,230,230,0.8)); cursor: pointer; font-size: 12px; transition: all 0.1s; }
.view-btn.active { background: linear-gradient(180deg, rgba(0,212,255,0.3), rgba(0,180,230,0.2)); border-color: rgba(0,212,255,0.5); color: #00a3cc; }
.path-bar { flex: 1; padding: 6px 10px; background: rgba(255,255,255,0.5); border: 1px solid rgba(0,0,0,0.05); border-radius: 4px; font-size: 11px; color: #666; font-family: 'Lucida Grande', monospace; }
.finder-content { display: flex; height: calc(100% - 80px); overflow: hidden; }
.sidebar { width: 160px; background: linear-gradient(180deg, rgba(240,240,240,0.9), rgba(220,220,220,0.8)); border-right: 1px solid rgba(255,255,255,0.3); padding: 12px; overflow: auto; }
.sidebar-section { margin-bottom: 16px; }
.sidebar-section h4 { margin: 0 0 6px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #999; }
.sidebar-section ul { margin: 0; padding-left: 16px; font-size: 11px; list-style: none; }
.sidebar-section li { margin: 3px 0; cursor: pointer; color: #333; }
.sidebar-section li:hover { color: #00a3cc; }
.file-list { flex: 1; padding: 16px; overflow: auto; display: flex; flex-wrap: wrap; gap: 16px; align-content: flex-start; }
.file-item { display: flex; flex-direction: column; align-items: center; width: 80px; cursor: pointer; transition: background 0.15s; border-radius: 6px; padding: 8px; }
.file-item:hover { background: rgba(0,212,255,0.15); }
.file-icon { font-size: 28px; margin-bottom: 6px; }
.file-item span:last-child { font-size: 11px; text-align: center; color: #333; word-break: break-word; }
.menu-bar { position: fixed; top: 0; left: 0; right: 0; height: 22px; background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.8)); border-bottom: 1px solid rgba(255,255,255,0.3); display: flex; align-items: center; padding: 0 10px; z-index: 50; box-shadow: 0 1px 4px rgba(0,0,0,0.1); }
.menu-apple { font-size: 16px; margin-right: 20px; cursor: pointer; }
.menu-items { display: flex; gap: 18px; }
.menu-item { font-size: 12px; color: #333; cursor: pointer; padding: 2px 4px; border-radius: 3px; transition: background 0.1s; }
.menu-item:hover { background: rgba(0,212,255,0.2); }
.menu-right { margin-left: auto; display: flex; align-items: center; gap: 12px; }
.menu-extra { font-size: 14px; cursor: pointer; padding: 2px 6px; border-radius: 3px; transition: background 0.1s; }
.menu-extra:hover { background: rgba(0,212,255,0.15); }
.menu-clock { font-size: 12px; font-weight: 600; color: #333; font-variant-numeric: tabular-nums; }`,
      js: `// Mac OS X Tiger 10.4 - Aqua Interface Simulation
console.log('%c🍎 Mac OS X Tiger 10.4', 'color: #00d4ff; font-size: 16px; font-weight: bold');
console.log('%c🎨 Aqua Interface — Brushed Metal + Glass', 'color: #00ffff; font-size: 12px');
console.log('%c🔍 Spotlight Indexing...', 'color: #ffcc00; font-size: 12px');
console.log('%c📊 Dashboard Widgets Loaded', 'color: #34c84a; font-size: 12px');

// Live clock
function updateClock() {
  const clock = document.querySelector('.menu-clock');
  if (clock) {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}
updateClock();
setInterval(updateClock, 1000);

// Dock magnification
const dockItems = document.querySelectorAll('.dock-item');
dockItems.forEach(item => {
  item.addEventListener('click', () => {
    const app = item.dataset.app;
    const window = document.getElementById(app + '-window');
    if (window) {
      window.style.zIndex = ++windowZIndex;
      window.style.display = 'block';
      console.log('Opening:', app);
    }
  });
});

let windowZIndex = 20;

// Window dragging
let draggedWindow = null;
let dragOffset = { x: 0, y: 0 };

document.querySelectorAll('.window-titlebar').forEach(titlebar => {
  titlebar.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    draggedWindow = titlebar.closest('.aqua-window');
    const rect = draggedWindow.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    draggedWindow.style.zIndex = ++windowZIndex;
    e.preventDefault();
  });
});

document.addEventListener('mousemove', (e) => {
  if (draggedWindow) {
    draggedWindow.style.left = (e.clientX - dragOffset.x) + 'px';
    draggedWindow.style.top = (e.clientY - dragOffset.y) + 'px';
  }
});

document.addEventListener('mouseup', () => {
  draggedWindow = null;
});

// Window controls
document.querySelectorAll('.window-controls .close').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const win = e.target.closest('.aqua-window');
    win.style.animation = 'windowClose 0.3s ease-in forwards';
    setTimeout(() => win.style.display = 'none', 300);
    console.log('Window closed');
  });
});

document.querySelectorAll('.window-controls .minimize').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const win = e.target.closest('.aqua-window');
    win.style.animation = 'windowMinimize 0.3s ease-in forwards';
    setTimeout(() => win.style.display = 'none', 300);
    console.log('Window minimized');
  });
});

const closeStyle = document.createElement('style');
closeStyle.textContent = '@keyframes windowClose { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.8); opacity: 0; } } @keyframes windowMinimize { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(0.1) translateY(200px); opacity: 0; } }';
document.head.appendChild(closeStyle);

// Tab switching
document.querySelectorAll('.window-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.window-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    console.log('Tab:', tab.textContent);
  });
});

// Finder view buttons
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    console.log('View:', btn.dataset.view);
  });
});

// File selection
document.querySelectorAll('.file-item').forEach(file => {
  file.addEventListener('click', () => {
    document.querySelectorAll('.file-item').forEach(f => f.style.background = 'transparent');
    file.style.background = 'rgba(0, 212, 255, 0.25)';
    console.log('Selected:', file.textContent.trim());
  });
});

// Genie effect on dock hover (CSS handles it, just log)
dockItems.forEach(item => {
  item.addEventListener('mouseenter', () => {
    console.log('Dock hover:', item.dataset.app);
  });
});

console.log('%c✨ Aqua Desktop Ready — Welcome to Tiger', 'color: #00d4ff; font-size: 13px; font-weight: bold');`,
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
        <div class="file-item folder" data-name="My Projects">
          <div class="file-icon">📁</div>
          <div class="file-info"><div class="file-name">My Projects</div><div class="file-details">File folder • Modified today</div></div>
        </div>
        <div class="file-item folder" data-name="School Work">
          <div class="file-icon">📁</div>
          <div class="file-info"><div class="file-name">School Work</div><div class="file-details">File folder • Modified yesterday</div></div>
        </div>
        <div class="file-item folder" data-name="Personal">
          <div class="file-icon">📁</div>
          <div class="file-info"><div class="file-name">Personal</div><div class="file-details">File folder • Modified last week</div></div>
        </div>
        <div class="file-item" data-name="Resume.docx">
          <div class="file-icon">📄</div>
          <div class="file-info"><div class="file-name">Resume.docx</div><div class="file-details">Microsoft Word Document • 24 KB • 2/14/2007</div></div>
        </div>
        <div class="file-item" data-name="Budget.xlsx">
          <div class="file-icon">📊</div>
          <div class="file-info"><div class="file-name">Budget.xlsx</div><div class="file-details">Microsoft Excel Workbook • 18 KB • 2/10/2007</div></div>
        </div>
        <div class="file-item" data-name="Vacation.jpg">
          <div class="file-icon">🖼️</div>
          <div class="file-info"><div class="file-name">Vacation.jpg</div><div class="file-details">JPEG Image • 2.4 MB • 1/20/2007</div></div>
        </div>
        <div class="file-item" data-name="Notes.txt">
          <div class="file-icon">📝</div>
          <div class="file-info"><div class="file-name">Notes.txt</div><div class="file-details">Text Document • 2 KB • 2/15/2007</div></div>
        </div>
        <div class="file-item" data-name="Presentation.pptx">
          <div class="file-icon">📽️</div>
          <div class="file-info"><div class="file-name">Presentation.pptx</div><div class="file-details">Microsoft PowerPoint • 1.2 MB • 2/12/2007</div></div>
        </div>
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
        <div class="zoom-slider">
          <button>-</button>
          <input type="range" min="0" max="100" value="50">
          <button>+</button>
        </div>
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
      <div class="tray-clock">2:41 PM\n2/15/2007</div>
    </div>
  </div>
</div>`,
      css: `@import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;600;700&display=swap');
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Segoe UI', Tahoma, sans-serif; background: linear-gradient(180deg, #0a3d6e 0%, #004f8a 40%, #003d6b 100%); min-height: 100vh; color: #1a1a1a; overflow: hidden; }
.vista-desktop { display: flex; flex-direction: column; height: 100vh; }
.vista-sidebar { width: 220px; flex-shrink: 0; background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(240,245,250,0.9)); border-right: 1px solid rgba(255,255,255,0.3); display: flex; flex-direction: column; box-shadow: inset -1px 0 0 rgba(255,255,255,0.5), 4px 0 24px rgba(0,0,0,0.1); }
.sidebar-header { padding: 16px 20px; font-size: 16px; font-weight: 600; color: #003d6b; border-bottom: 1px solid rgba(0,77,138,0.1); background: linear-gradient(180deg, rgba(0,100,180,0.05), transparent); }
.sidebar-nav { flex: 1; padding: 8px 4px; overflow: auto; }
.sidebar-nav a { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 4px; color: #333; text-decoration: none; font-size: 13px; margin: 2px 8px; transition: all 0.15s; }
.sidebar-nav a span:first-child { font-size: 16px; width: 20px; text-align: center; }
.sidebar-nav a:hover { background: rgba(0,120,215,0.15); color: #0078d7; }
.sidebar-nav a.active { background: rgba(0,120,215,0.25); color: #005a9e; font-weight: 600; box-shadow: inset 2px 0 0 #0078d7; }
.sidebar-footer { padding: 12px; border-top: 1px solid rgba(0,77,138,0.1); }
.search-box input { width: 100%; padding: 6px 10px 6px 30px; border: 1px solid rgba(0,77,138,0.2); border-radius: 4px; background: rgba(255,255,255,0.8) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23666' d='M7 12a5 5 0 100-10 5 5 0 000 10zm0-1a4 4 0 110-8 4 4 0 010 8zm6.5-6.5l3.5 3.5-1 1-3.5-3.5 1-1z'/%3E%3C/svg%3E") no-repeat 8px center; background-size: 14px; font-size: 12px; color: #333; outline: none; }
.vista-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.vista-toolbar { display: flex; justify-content: space-between; align-items: center; height: 60px; padding: 0 12px; background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(240,245,250,0.9)); border-bottom: 1px solid rgba(0,77,138,0.1); box-shadow: 0 2px 8px rgba(0,0,0,0.05); flex-wrap: wrap; gap: 8px; }
.toolbar-left { display: flex; align-items: center; gap: 8px; }
.toolbar-btn { padding: 6px 12px; border: 1px solid rgba(0,77,138,0.2); border-radius: 4px; background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(240,245,250,0.8)); color: #333; font-size: 12px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: all 0.1s; }
.toolbar-btn:hover { background: linear-gradient(180deg, rgba(255,255,255,1), rgba(255,255,255,0.9)); border-color: rgba(0,120,215,0.4); box-shadow: 0 2px 6px rgba(0,120,215,0.15); }
.view-slider { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #666; }
.view-slider input { width: 120px; accent-color: #0078d7; }
.toolbar-right { display: flex; align-items: center; gap: 12px; flex: 1; justify-content: flex-end; }
.address-bar { flex: 1; max-width: 500px; display: flex; align-items: center; gap: 4px; }
.nav-btn { width: 28px; height: 28px; border: 1px solid rgba(0,77,138,0.2); border-radius: 3px; background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(240,245,250,0.8)); cursor: pointer; font-size: 12px; color: #333; transition: all 0.1s; display: flex; align-items: center; justify-content: center; }
.nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.nav-btn:hover:not(:disabled) { background: rgba(0,120,215,0.1); border-color: rgba(0,120,215,0.4); }
.address-path { flex: 1; display: flex; align-items: center; gap: 2px; padding: 4px 8px; background: rgba(255,255,255,0.5); border: 1px solid rgba(0,77,138,0.1); border-radius: 3px; font-size: 12px; min-width: 200px; overflow: auto; }
.crumb { padding: 2px 6px; border-radius: 3px; cursor: pointer; transition: background 0.1s; user-select: none; }
.crumb:hover { background: rgba(0,120,215,0.15); }
.crumb.active { background: rgba(0,120,215,0.2); color: #005a9e; font-weight: 600; }
.sep { color: #999; margin: 0 2px; }
.search-box input { padding: 5px 10px 5px 30px; border: 1px solid rgba(0,77,138,0.2); border-radius: 4px; background: rgba(255,255,255,0.8) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath fill='%23666' d='M7 12a5 5 0 100-10 5 5 0 000 10zm0-1a4 4 0 110-8 4 4 0 010 8zm6.5-6.5l3.5 3.5-1 1-3.5-3.5 1-1z'/%3E%3C/svg%3E") no-repeat 8px center; background-size: 14px; font-size: 12px; width: 200px; color: #333; outline: none; }
.vista-content { flex: 1; display: flex; overflow: hidden; }
.file-list { flex: 1; padding: 12px; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
.file-item { display: flex; gap: 10px; padding: 10px; background: rgba(255,255,255,0.6); border: 1px solid transparent; border-radius: 4px; cursor: pointer; transition: all 0.15s; }
.file-item:hover { background: rgba(0,120,215,0.1); border-color: rgba(0,120,215,0.3); }
.file-item.selected { background: rgba(0,120,215,0.2); border-color: #0078d7; box-shadow: inset 0 0 0 1px #0078d7; }
.file-icon { font-size: 32px; width: 48px; text-align: center; }
.file-info { flex: 1; min-width: 0; }
.file-name { font-size: 12px; font-weight: 600; color: #1a1a1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-details { font-size: 10px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vista-details-pane { width: 320px; flex-shrink: 0; background: linear-gradient(180deg, rgba(255,255,255,0.9), rgba(245,248,252,0.9)); border-left: 1px solid rgba(0,77,138,0.1); padding: 16px; display: flex; flex-direction: column; gap: 16px; overflow: auto; }
.details-header { font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
.details-preview { display: flex; gap: 12px; }
.preview-icon { font-size: 48px; width: 64px; text-align: center; }
.preview-info { flex: 1; min-width: 0; }
.preview-name { font-weight: 600; font-size: 13px; color: #1a1a1a; }
.preview-meta { font-size: 11px; color: #666; margin-top: 2px; }
.details-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 11px; color: #666; }
.tag { background: rgba(0,120,215,0.15); color: #005a9e; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
.add-tag { background: transparent; border: 1px dashed rgba(0,120,215,0.4); color: #0078d7; padding: 2px 8px; border-radius: 10px; font-size: 11px; cursor: pointer; }
.add-tag:hover { background: rgba(0,120,215,0.1); border-style: solid; }
.vista-statusbar { display: flex; justify-content: space-between; align-items: center; height: 28px; padding: 0 12px; background: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(240,245,250,0.9)); border-top: 1px solid rgba(0,77,138,0.1); font-size: 11px; color: #666; }
.zoom-slider { display: flex; align-items: center; gap: 6px; }
.zoom-slider input { width: 100px; accent-color: #0078d7; }
.zoom-slider button { width: 20px; height: 20px; border: 1px solid rgba(0,77,138,0.2); border-radius: 3px; background: rgba(255,255,255,0.8); cursor: pointer; font-size: 12px; }
.vista-taskbar { position: relative; height: 40px; background: linear-gradient(180deg, rgba(0,60,100,0.95), rgba(0,40,80,0.98)); border-top: 1px solid rgba(0,100,180,0.3); display: flex; align-items: center; padding: 0 8px; box-shadow: 0 -4px 24px rgba(0,0,0,0.3); z-index: 100; }
.start-btn { display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; background: linear-gradient(180deg, rgba(0,120,215,0.6), rgba(0,80,150,0.8)); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 2px 8px rgba(0,0,0,0.3); transition: all 0.1s; }
.start-btn:hover { background: linear-gradient(180deg, rgba(0,140,235,0.7), rgba(0,100,170,0.9)); box-shadow: inset 0 1px 0 rgba(255,255,255,0.3), 0 2px 12px rgba(0,120,215,0.4); }
.start-orb { width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 30% 30%, #00d4ff, #0078d7 70%); box-shadow: 0 0 12px #00d4ff, inset 0 -2px 4px rgba(0,0,0,0.3); animation: orbPulse 2s ease-in-out infinite; }
@keyframes orbPulse { 0%, 100% { box-shadow: 0 0 12px #00d4ff, inset 0 -2px 4px rgba(0,0,0,0.3); } 50% { box-shadow: 0 0 20px #00d4ff, 0 0 30px rgba(0,212,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.3); } }
.quick-launch { display: flex; gap: 4px; margin: 0 8px; }
.ql-btn { width: 30px; height: 30px; border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; background: rgba(255,255,255,0.05); color: #fff; font-size: 14px; cursor: pointer; transition: all 0.1s; }
.ql-btn:hover { background: rgba(0,120,215,0.3); border-color: rgba(0,120,215,0.5); box-shadow: 0 0 8px rgba(0,212,255,0.3); }
.taskband { flex: 1; display: flex; gap: 2px; padding: 4px; overflow: hidden; }
.task-btn { display: flex; align-items: center; gap: 6px; padding: 4px 12px; border: 1px solid transparent; border-radius: 4px; background: transparent; color: #fff; font-size: 12px; cursor: pointer; transition: all 0.1s; white-space: nowrap; }
.task-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }
.task-btn.active { background: linear-gradient(180deg, rgba(0,120,215,0.5), rgba(0,80,150,0.7)); border-color: rgba(0,120,215,0.6); box-shadow: inset 0 1px 0 rgba(255,255,255,0.2), 0 0 8px rgba(0,120,215,0.3); }
.system-tray { display: flex; align-items: center; gap: 8px; padding: 0 8px; }
.tray-item { font-size: 14px; color: #fff; opacity: 0.8; cursor: pointer; padding: 4px; border-radius: 3px; transition: all 0.1s; }
.tray-item:hover { opacity: 1; background: rgba(255,255,255,0.1); }
.tray-clock { font-size: 11px; color: #fff; text-align: right; line-height: 1.2; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }`,
      js: `// Windows Vista - Explorer Simulation
console.log('%c🪟 Windows Vista Ultimate', 'color: #0078d7; font-size: 16px; font-weight: bold');
console.log('%c🎨 Windows Aero — Glass, Reflections, Translucency', 'color: #00d4ff; font-size: 12px');
console.log('%c🔍 Instant Search Indexing...', 'color: #ffcc00; font-size: 12px');
console.log('%c🛡️ UAC Enabled — Secure Desktop', 'color: #ff6b6b; font-size: 12px');

// Live clock
function updateClock() {
  const clock = document.querySelector('.tray-clock');
  if (clock) {
    const now = new Date();
    clock.innerHTML = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) + '<br>' + now.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  }
}
updateClock();
setInterval(updateClock, 1000);

// File selection
const fileItems = document.querySelectorAll('.file-item');
fileItems.forEach(item => {
  item.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey) {
      item.classList.toggle('selected');
    } else {
      fileItems.forEach(f => f.classList.remove('selected'));
      item.classList.add('selected');
    }
    updateDetailsPane();
  });
  item.addEventListener('dblclick', () => {
    console.log('Opening:', item.dataset.name);
    alert('Opening ' + item.dataset.name + '...');
  });
});

function updateDetailsPane() {
  const selected = document.querySelectorAll('.file-item.selected');
  const detailsHeader = document.querySelector('.details-header');
  const detailsPreview = document.querySelector('.details-preview');
  if (detailsHeader) detailsHeader.textContent = selected.length + ' item' + (selected.length !== 1 ? 's' : '') + ' selected';
  if (detailsPreview && selected.length === 1) {
    const name = selected[0].dataset.name;
    const icon = selected[0].querySelector('.file-icon').textContent;
    const detail = selected[0].querySelector('.file-details').textContent;
    detailsPreview.innerHTML = '<div class="preview-icon">' + icon + '</div><div class="preview-info"><div class="preview-name">' + name + '</div><div class="preview-meta">' + detail + '</div></div>';
  } else if (detailsPreview) {
    detailsPreview.innerHTML = '<div class="preview-icon">📁</div><div class="preview-info"><div class="preview-name">' + selected.length + ' items selected</div></div>';
  }
}

// Toolbar buttons
document.querySelectorAll('.toolbar-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    console.log('Toolbar:', btn.textContent.trim());
  });
});

// View slider
const viewSlider = document.getElementById('viewSlider');
if (viewSlider) {
  const views = ['Extra Large', 'Large', 'Medium', 'Small', 'Details'];
  const viewLabel = viewSlider.parentElement.querySelector('span');
  viewSlider.addEventListener('input', () => {
    if (viewLabel) viewLabel.textContent = views[viewSlider.value];
    console.log('View changed to:', views[viewSlider.value]);
  });
}

// Address bar crumbs
document.querySelectorAll('.crumb').forEach(crumb => {
  crumb.addEventListener('click', () => {
    console.log('Navigate to:', crumb.textContent.trim());
  });
});

// Search boxes
document.querySelectorAll('.search-box input').forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      console.log('Search:', input.value);
    }
  });
});

// Start button
document.querySelector('.start-btn')?.addEventListener('click', () => {
  console.log('Start menu clicked');
  alert('Start Menu\n\nPrograms\nDocuments\nSettings\nSearch\nRun\n\nShut Down');
});

// Taskbar buttons
document.querySelectorAll('.task-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.task-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    console.log('Switch to:', btn.textContent.trim());
  });
});

// Tray items
document.querySelectorAll('.tray-item').forEach(item => {
  item.addEventListener('click', () => {
    console.log('Tray:', item.textContent.trim());
  });
});

console.log('%c✅ Windows Vista Ready — Experience the Wow', 'color: #0078d7; font-size: 13px; font-weight: bold');`,
    },
  };

  // ---------- Console capture ----------
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
  }

  function clearConsole() {
    refs.console.innerHTML = '';
    const e = document.createElement('div'); e.className = 'pg-con-empty'; e.textContent = t('pg.conEmpty');
    refs.console.append(e);
  }

  let messageHandler = null;
  function onMessage(e) {
    const d = e.data;
    if (!d || d.__pg !== 1) return;
    logLine(String(d.level || 'log'), String(d.msg == null ? '' : d.msg));
  }

  // ---------- run ----------
  function current() {
    return {
      html: editors.html?.getValue() || refs.htmlTa?.value || '',
      css: editors.css?.getValue() || refs.cssTa?.value || '',
      js: editors.js?.getValue() || refs.jsTa?.value || ''
    };
  }

  function run() {
    if (!alive) return;
    clearConsole();
    const src = buildSrcdoc(current().html, current().css, current().js);
    refs.frame.srcdoc = src;
    refs.hint.textContent = t('pg.ran');
    if (autosave) autosave();
  }

  function scheduleRun() {
    if (!autoRun) return;
    clearTimeout(runTimer);
    runTimer = setTimeout(run, 300);
  }

  // ---------- standalone export ----------
  function standaloneHTML() {
    const d = current();
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Vistanology Playground Export</title>
<style>
${d.css}
</style>
</head>
<body>
${d.html}
<script>
${d.js}
<\/script>
</body>
</html>`;
  }

  // ---------- persistence ----------
  function loadProjects() {
    refs.projList.innerHTML = '';
    if (!VT.db.available) { refs.projList.innerHTML = '<div class="bench-empty pg-empty">' + esc(t('pg.dbUnavailable')) + '</div>'; return; }
    VT.db.list('playground').then((rows) => {
      rows = rows.filter((r) => r.id !== AUTOSAVE_ID);
      if (!rows.length) { refs.projList.innerHTML = '<div class="bench-empty pg-empty">' + esc(t('pg.projEmpty')) + '</div>'; return; }
      rows.forEach((r) => {
        const el = document.createElement('div'); el.className = 'bench-row pg-proj-row';
        const info = document.createElement('div'); info.className = 'pg-proj-info';
        const nm = document.createElement('strong'); nm.textContent = r.name || t('pg.projUntitled');
        const meta = document.createElement('span'); meta.textContent = new Date(r.updatedAt).toLocaleString();
        info.append(nm, meta);
        const open = document.createElement('button'); open.type = 'button'; open.className = 'btn btn-ghost btn-sm'; open.textContent = t('pg.projOpen');
        open.addEventListener('click', () => {
          const data = (r.data) || {};
          setEditorContent('html', data.html || '');
          setEditorContent('css', data.css || '');
          setEditorContent('js', data.js || '');
          run(); toast(t('pg.projOpened', { name: r.name || t('pg.projUntitled') }), 'success');
        });
        el.append(info, open);
        refs.projList.append(el);
      });
    }).catch(() => { refs.projList.innerHTML = '<div class="bench-empty pg-empty">' + esc(t('pg.dbError')) + '</div>'; });
  }

  function setEditorContent(name, content) {
    if (editors[name]) {
      editors[name].setValue(content);
    } else {
      refs[name + 'Ta'].value = content;
    }
  }

  function applyTemplate(id) {
    const p = TEMPLATES[id]; if (!p) return;
    setEditorContent('html', p.html);
    setEditorContent('css', p.css);
    setEditorContent('js', p.js);
    run();
    refs.hint.textContent = t('pg.tplApplied', { name: t(p.name) });
  }

  // ---------- tabs ----------
  function selectTab(name) {
    $$('.pg-tab', refs.stage).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
    $$('.pg-editor', refs.stage).forEach((p) => { p.hidden = p.dataset.pane !== name; });
    // Focus the editor
    if (editors[name]) {
      setTimeout(() => editors[name].focus(), 50);
    } else {
      refs[name + 'Ta']?.focus();
    }
  }

  // ---------- Monaco/simple editor setup ----------
  function initEditors() {
    // Try to load Monaco Editor from CDN for syntax highlighting
    if (window.monaco) {
      initMonacoEditors();
    } else {
      // Fallback: simple textarea with basic highlighting via Prism-like approach
      initSimpleEditors();
    }
  }

  function initMonacoEditors() {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
    require(['vs/editor/editor.main'], () => {
      editors.html = monaco.editor.create(refs.htmlEd, {
        value: refs.htmlTa.value,
        language: 'html',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        tabSize: 2,
        wordWrap: 'on',
        brackets: 'languageDefined',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        folding: true,
        renderLineHighlight: 'all',
        scrollBeyondLastLine: false,
      });
      editors.css = monaco.editor.create(refs.cssEd, {
        value: refs.cssTa.value,
        language: 'css',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        tabSize: 2,
        wordWrap: 'on',
        brackets: 'languageDefined',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        folding: true,
        renderLineHighlight: 'all',
        scrollBeyondLastLine: false,
      });
      editors.js = monaco.editor.create(refs.jsEd, {
        value: refs.jsTa.value,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        tabSize: 2,
        wordWrap: 'on',
        brackets: 'languageDefined',
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        folding: true,
        renderLineHighlight: 'all',
        scrollBeyondLastLine: false,
      });

      [editors.html, editors.css, editors.js].forEach(ed => {
        ed.onDidChangeModelContent(() => { scheduleRun(); if (autosave) autosave(); });
      });

      // Hide textareas
      refs.htmlTa.style.display = 'none';
      refs.cssTa.style.display = 'none';
      refs.jsTa.style.display = 'none';

      selectTab('html');
    });
  }

  function initSimpleEditors() {
    // Enhanced textareas with line numbers and basic syntax highlighting
    ['html', 'css', 'js'].forEach(name => {
      const ta = refs[name + 'Ta'];
      const wrapper = ta.parentElement;
      wrapper.style.position = 'relative';

      // Create line numbers gutter
      const gutter = document.createElement('div');
      gutter.className = 'pg-gutter';
      gutter.setAttribute('aria-hidden', 'true');
      wrapper.insertBefore(gutter, ta);

      // Sync scroll and update line numbers
      function updateGutter() {
        const lines = ta.value.split('\\n').length;
        gutter.innerHTML = Array.from({ length: Math.max(lines, 1) }, (_, i) => '<div>' + (i + 1) + '</div>').join('');
        gutter.scrollTop = ta.scrollTop;
      }

      ta.addEventListener('input', () => {
        updateGutter();
        scheduleRun();
        if (autosave) autosave();
      });
      ta.addEventListener('scroll', () => { gutter.scrollTop = ta.scrollTop; });
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          ta.value = ta.value.slice(0, start) + '  ' + ta.value.slice(end);
          ta.selectionStart = ta.selectionEnd = start + 2;
          updateGutter();
          scheduleRun();
        }
      });

      updateGutter();
    });

    selectTab('html');
  }

  function mount(root) {
    alive = true;
    autoRun = true;
    const saved = VT.store.get(KEY, null);
    const doc = saved && saved.doc ? saved.doc : { html: TEMPLATES.welcome.html, css: TEMPLATES.welcome.css, js: TEMPLATES.welcome.js };
    const I = VT.icons;

    root.innerHTML = `
      <div class="pg-stage glass-2" id="pg-stage">
        <!-- Top Toolbar -->
        <div class="pg-toolbar">
          <div class="pg-toolbar-left">
            <button class="btn btn-primary btn-sm" id="pg-run" aria-keyshortcuts="Control+Enter" title="Run (Ctrl+Enter)">${I.arrowRight} <span>${t('pg.run')}</span></button>
            <label class="pg-toggle" title="Auto-run on keystroke"><input type="checkbox" id="pg-auto" checked><span>${t('pg.autoRun')}</span></label>
            <span class="pg-sep" aria-hidden="true"></span>
            <span class="pg-vp" role="group" aria-label="${t('pg.viewport')}">
              <button class="btn btn-ghost btn-sm is-on" data-vp="desktop" title="Desktop">${I.image}</button>
              <button class="btn btn-ghost btn-sm" data-vp="tablet" title="Tablet">${I.image}</button>
              <button class="btn btn-ghost btn-sm" data-vp="mobile" title="Mobile">${I.phone}</button>
            </span>
          </div>
          <div class="pg-toolbar-center">
            <select class="input pg-select" id="pg-tpl" aria-label="${t('pg.templates')}">
              <option value="">${t('pg.templates')}</option>
              ${Object.keys(TEMPLATES).map((k) => '<option value="' + k + '">' + esc(t(TEMPLATES[k].name)) + '</option>').join('')}
            </select>
          </div>
          <div class="pg-toolbar-right">
            <button class="btn btn-ghost btn-sm" id="pg-reset" title="Clear all editors">${I.broom} <span>${t('pg.reset')}</span></button>
            <span class="pg-sep" aria-hidden="true"></span>
            <button class="btn btn-ghost btn-sm" id="pg-copy" title="Copy standalone HTML">${I.copy} <span>${t('pg.copy')}</span></button>
            <button class="btn btn-ghost btn-sm" id="pg-export" title="Export .html file">${I.download} <span>${t('pg.export')}</span></button>
            <button class="btn btn-ghost btn-sm" id="pg-fullscreen" title="Fullscreen preview">${I.resize}</button>
          </div>
        </div>

        <div class="pg-hint" id="pg-hint" role="status" aria-live="polite"></div>

        <!-- Main Work Area -->
        <div class="pg-work">
          <!-- Left: Editors -->
          <section class="pg-editors" aria-label="${t('pg.editors')}">
            <div class="pg-tabs" role="tablist">
              <button class="pg-tab is-on" role="tab" data-tab="html" aria-selected="true"><span>${I.code}</span> HTML</button>
              <button class="pg-tab" role="tab" data-tab="css" aria-selected="false"><span>${I.palette}</span> CSS</button>
              <button class="pg-tab" role="tab" data-tab="js" aria-selected="false"><span>${I.braces}</span> JS</button>
            </div>
            <div class="pg-pane pg-editor" data-pane="html">
              <div class="pg-editor-wrapper" id="pg-html-wrap">
                <textarea id="pg-html" spellcheck="false" aria-label="HTML"></textarea>
              </div>
            </div>
            <div class="pg-pane pg-editor" data-pane="css" hidden>
              <div class="pg-editor-wrapper" id="pg-css-wrap">
                <textarea id="pg-css" spellcheck="false" aria-label="CSS"></textarea>
              </div>
            </div>
            <div class="pg-pane pg-editor" data-pane="js" hidden>
              <div class="pg-editor-wrapper" id="pg-js-wrap">
                <textarea id="pg-js" spellcheck="false" aria-label="JavaScript"></textarea>
              </div>
            </div>
          </section>

          <!-- Center: Live Preview (2000s Browser) -->
          <section class="pg-preview" aria-label="${t('pg.preview')}">
            <div class="aero-browser-frame" id="pg-browser-frame">
              <div class="browser-titlebar">
                <div class="browser-icon">🌐</div>
                <div class="browser-title">Live Preview — Vistanology Web Lab</div>
                <div class="browser-controls">
                  <button class="browser-btn minimize" title="Minimize" aria-label="Minimize">_</button>
                  <button class="browser-btn maximize" title="Maximize" aria-label="Maximize">□</button>
                  <button class="browser-btn close" title="Close" aria-label="Close">✕</button>
                </div>
              </div>
              <div class="browser-toolbar">
                <div class="browser-nav">
                  <button class="nav-btn back" id="pg-nav-back" disabled aria-label="Back">←</button>
                  <button class="nav-btn forward" id="pg-nav-forward" disabled aria-label="Forward">→</button>
                  <button class="nav-btn refresh" id="pg-nav-refresh" aria-label="Refresh">⟳</button>
                  <button class="nav-btn home" id="pg-nav-home" aria-label="Home">🏠</button>
                </div>
                <div class="browser-address">
                  <span class="lock-icon" title="Secure">🔒</span>
                  <input type="text" id="pg-address" value="about:blank" readonly aria-label="Address">
                </div>
                <div class="browser-search">
                  <input type="search" placeholder="Search..." aria-label="Search">
                  <button class="search-go">Go</button>
                </div>
              </div>
              <div class="browser-tabs">
                <button class="browser-tab active" data-tab="preview" aria-selected="true">Preview</button>
                <button class="browser-tab" data-tab="console" aria-selected="false">Console</button>
                <button class="browser-tab-new" aria-label="New tab">+</button>
              </div>
              <div class="browser-content">
                <div class="browser-tabpanel" data-tab="preview" role="tabpanel">
                  <div class="pg-frame-wrap" id="pg-frame-wrap">
                    <iframe id="pg-frame" class="pg-frame" sandbox="allow-scripts" title="${t('pg.preview')}" loading="lazy"></iframe>
                  </div>
                </div>
                <div class="browser-tabpanel" data-tab="console" role="tabpanel" hidden>
                  <div class="pg-con-head">${I.code} ${t('pg.console')} <button class="btn btn-ghost btn-sm pg-con-clear" id="pg-con-clear">${t('pg.clear')}</button></div>
                  <div class="pg-console" id="pg-console" aria-live="polite"></div>
                </div>
              </div>
              <div class="browser-statusbar">
                <span id="pg-status">Ready</span>
                <div class="browser-zoom">
                  <button id="pg-zoom-out" aria-label="Zoom out">-</button>
                  <span id="pg-zoom-level">100%</span>
                  <button id="pg-zoom-in" aria-label="Zoom in">+</button>
                </div>
              </div>
            </div>
          </section>

          <!-- Right: Sidebar (Projects + Console) -->
          <aside class="pg-side" aria-label="${t('pg.projList')}">
            <div class="pg-side-tabs" role="tablist">
              <button class="pg-side-tab is-on" role="tab" data-side="projects" aria-selected="true">${I.file} ${t('pg.projects')}</button>
              <button class="pg-side-tab" role="tab" data-side="snippets" aria-selected="false">${I.layers} ${t('pg.snippets')}</button>
            </div>
            <div class="pg-side-panel" data-side="projects">
              <div class="pg-proj-save">
                <input class="input" id="pg-proj-name" type="text" placeholder="${t('pg.projNamePh')}" aria-label="${t('pg.projNamePh')}">
                <button class="btn btn-ghost btn-sm" id="pg-proj-save">${I.download} ${t('pg.projSave')}</button>
              </div>
              <div class="bench-list pg-proj-list" id="pg-proj-list"></div>
            </div>
            <div class="pg-side-panel" data-side="snippets" hidden>
              <div class="pg-snippets-list" id="pg-snippets-list"></div>
            </div>
          </aside>
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
      snippetsList: $('#pg-snippets-list', root),
      // Browser frame refs
      browserFrame: $('#pg-browser-frame', root),
      addressBar: $('#pg-address', root),
      statusEl: $('#pg-status', root),
      zoomLevel: $('#pg-zoom-level', root),
      // Viewport
      vpBtns: $$('.pg-vp .btn', root),
    };

    // Initialize editors with saved content
    refs.htmlTa.value = doc.html || '';
    refs.cssTa.value = doc.css || '';
    refs.jsTa.value = doc.js || '';

    autosave = U.debounce(() => {
      if (!alive) return;
      VT.store.set(KEY, { doc: current() });
      if (VT.db.available) VT.db.put({ id: AUTOSAVE_ID, tool: 'playground', name: '(autosave)', data: current() }).catch(() => {});
    }, 700);

    messageHandler = onMessage;
    window.addEventListener('message', messageHandler);

    clearConsole();

    refs.auto.addEventListener('change', () => { autoRun = refs.auto.checked; refs.hint.textContent = autoRun ? t('pg.autoOn') : t('pg.autoOff'); if (autoRun) scheduleRun(); });

    [refs.htmlTa, refs.cssTa, refs.jsTa].forEach((ta) => {
      ta.addEventListener('input', () => { scheduleRun(); if (autosave) autosave(); });
    });

    $('#pg-run', root).addEventListener('click', run);

    $$('.pg-tab', root).forEach((b) => b.addEventListener('click', () => selectTab(b.dataset.tab)));

    $$('.pg-vp .btn', root).forEach((b) => b.addEventListener('click', () => {
      $$('.pg-vp .btn', root).forEach((x) => x.classList.remove('is-on'));
      b.classList.add('is-on');
      const vp = b.dataset.vp;
      refs.frameWrap.dataset.vp = vp;
      refs.frame.classList.toggle('pg-frame-mobile', vp === 'mobile');
      refs.frame.classList.toggle('pg-frame-tablet', vp === 'tablet');
    }));

    refs.tpl.addEventListener('change', () => { if (refs.tpl.value) { applyTemplate(refs.tpl.value); refs.tpl.selectedIndex = 0; } });

    $('#pg-reset', root).addEventListener('click', () => {
      setEditorContent('html', '');
      setEditorContent('css', '');
      setEditorContent('js', '');
      run(); refs.hint.textContent = t('pg.resetDone');
    });

    $('#pg-con-clear', root).addEventListener('click', clearConsole);

    $('#pg-copy', root).addEventListener('click', async () => {
      const ok = await U.copyText(standaloneHTML());
      toast(ok ? t('pg.copied') : t('pg.copyFail'), ok ? 'success' : 'error');
    });

    $('#pg-export', root).addEventListener('click', () => {
      U.downloadText(standaloneHTML(), 'vistanology-playground.html', 'text/html');
      toast(t('pg.exported'), 'success');
    });

    $('#pg-fullscreen', root).addEventListener('click', () => {
      refs.browserFrame.requestFullscreen?.().catch(() => {});
    });

    $('#pg-nav-refresh', root).addEventListener('click', run);
    $('#pg-nav-home', root).addEventListener('click', () => {
      refs.frame.srcdoc = buildSrcdoc('', '', '');
      refs.addressBar.value = 'about:blank';
    });

    // Browser tab switching (Preview / Console)
    $$('.browser-tab', root).forEach((b) => b.addEventListener('click', () => {
      $$('.browser-tab', root).forEach((x) => {
        x.setAttribute('aria-selected', String(x.dataset.tab === b.dataset.tab));
        x.classList.toggle('active', x.dataset.tab === b.dataset.tab);
      });
      $$('.browser-tabpanel', root).forEach((p) => { p.hidden = p.dataset.tab !== b.dataset.tab; });
    }));

    $('#pg-zoom-in', root).addEventListener('click', () => adjustZoom(1.1));
    $('#pg-zoom-out', root).addEventListener('click', () => adjustZoom(0.9));

    $$('.pg-side-tab', root).forEach((b) => b.addEventListener('click', () => {
      $$('.pg-side-tab', root).forEach((x) => x.setAttribute('aria-selected', String(x.dataset.side === b.dataset.side)));
      $$('.pg-side-panel', root).forEach((p) => { p.hidden = p.dataset.side !== b.dataset.side; });
    }));

    $('#pg-proj-save', root).addEventListener('click', async () => {
      if (!VT.db.available) { toast(t('pg.dbUnavailable'), 'error'); return; }
      const name = refs.projName.value.trim() || t('pg.projUntitled');
      refs.projName.value = name;
      try { await VT.db.put({ tool: 'playground', name, data: current() }); toast(t('pg.projSaved', { name }), 'success'); loadProjects(); }
      catch (e) { toast(t('pg.dbError'), 'error'); }
    });

    root.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); $('#pg-proj-save', root)?.click(); }
    });

    selectTab('html');
    loadProjects();
    initEditors();

    // Restore autosave
    if (VT.db.available) {
      VT.db.get(AUTOSAVE_ID).then((rec) => {
        if (!alive) return;
        const restored = !!(rec && rec.data);
        if (restored) {
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

    // Initial viewport sync
    refs.frameWrap.dataset.vp = 'desktop';

    return () => {
      alive = false;
      clearTimeout(runTimer);
      if (messageHandler) window.removeEventListener('message', messageHandler);
      messageHandler = null;
      VT.store.set(KEY, { doc: current() });
      // Dispose Monaco editors
      Object.values(editors).forEach(ed => ed?.dispose?.());
    };
  }

  function unmount() {
    alive = false; autosave = null; runTimer = null; refs = {};
    if (messageHandler) { window.removeEventListener('message', messageHandler); messageHandler = null; }
    Object.values(editors).forEach(ed => ed?.dispose?.());
    editors = {};
  }

  let zoomLevel = 1;
  function adjustZoom(factor) {
    zoomLevel = Math.max(0.3, Math.min(2, zoomLevel * factor));
    refs.frame.style.transform = 'scale(' + zoomLevel + ')';
    refs.frame.style.transformOrigin = 'top center';
    refs.zoomLevel.textContent = Math.round(zoomLevel * 100) + '%';
  }

  const def = {
    id: 'playground', cat: 'developer', icon: 'code', version: '1.0.0',
    name: { en: 'Playground', pt: 'Playground' },
    tagline: {
      en: 'A Frutiger Aero web laboratory — write HTML, CSS, JS and watch it live in a 2000s browser simulation. Syntax highlighting, auto-run, console, templates, export.',
      pt: 'Um laboratório web Frutiger Aero — escreva HTML, CSS, JS e veja ao vivo em uma simulação de navegador dos anos 2000. Syntax highlighting, execução automática, console, modelos, exportação.'
    },
    tags: ['html', 'css', 'js', 'playground', 'sandbox', 'code', 'developer', 'aero', 'retro'],
    deps: [],
    docs: {
      en: {
        summary: 'A local code playground with 2000s browser aesthetics. Type HTML, CSS and JS, run them in a sandboxed iframe with live preview, read the captured console, load retro templates, and export a standalone .html file.',
        usage: [
          'Pick a template — MSN Portal, Web 2.0 Profile, Mac OS X Aqua, Windows Vista Explorer — or start blank.',
          'Edit the HTML, CSS and JS tabs, press Run or Ctrl/Cmd+Enter; Auto-run refreshes 300 ms after you stop typing.',
          'Switch the preview between Desktop, Tablet and Mobile to check responsive layout.',
          'Read your log/warn/error output in the Console tab, then Copy HTML or Export .html.',
          'Save snippets locally with the Projects sidebar.'
        ],
        privacy: 'Your code runs only inside a sandboxed iframe with allow-scripts but never allow-same-origin, so it executes in a unique opaque origin: it cannot read or write this app, its storage or the page around it. Nothing is uploaded. No eval() is used — the frame is built by assigning its document and the console is captured through a serialized postMessage shim.',
        limits: [
          'The frame is sandbox="allow-scripts" without allow-same-origin, so localStorage, cookies and any parent access are unavailable inside the preview by design.',
          'Code you write can still make its own network requests: they leave from an opaque origin and are subject to CORS, which most third-party APIs reject — keep demos self-contained.',
          'The console keeps the last 200 lines and serializes logged values as JSON, so functions and DOM nodes arrive lossy or as "[unserializable]".'
        ]
      },
      pt: {
        summary: 'Um playground de código local com estética dos anos 2000. Digite HTML, CSS e JS, execute-os em um iframe isolado com preview ao vivo, leia o console capturado, carregue modelos retrô e exporte um arquivo .html autônomo.',
        usage: [
          'Escolha um modelo — Portal MSN, Perfil Web 2.0, Mac OS X Aqua, Windows Vista Explorer — ou comece do zero.',
          'Edite as abas HTML, CSS e JS e pressione Executar ou Ctrl/Cmd+Enter; Execução automática atualiza 300 ms após você parar de digitar.',
          'Alterne a prévia entre Desktop, Tablet e Celular para conferir o layout responsivo.',
          'Leia sua saída de log/aviso/erro na aba Console, depois Copie o HTML ou exporte .html.',
          'Salve snippets localmente na barra lateral de Projetos.'
        ],
        privacy: 'Seu código roda apenas dentro de um iframe isolado com allow-scripts, mas nunca allow-same-origin, então executa em uma origem opaca única: não consegue ler nem escrever neste app, em seu armazenamento ou na página ao redor. Nada é enviado. Nenhum eval() é usado — o quadro é construído atribuindo seu documento e o console é capturado por um shim de postMessage serializado.',
        limits: [
          'O quadro é sandbox="allow-scripts" sem allow-same-origin, então localStorage, cookies e qualquer acesso ao pai ficam indisponíveis na prévia, por projeto.',
          'O código que você escreve ainda pode fazer requisições próprias: elas saem de uma origem opaca e estão sujeitas a CORS, que a maioria das APIs de terceiros rejeita — mantenha as demos autossuficientes.',
          'O console guarda as últimas 200 linhas e serializa os valores logados como JSON, então funções e nós do DOM chegam com perdas ou como "[unserializable]".'
        ]
      }
    },
    mount, unmount
  };

  VT.i18n.add({
    en: {
      'pg.run': 'Run', 'pg.autoRun': 'Auto-run', 'pg.viewport': 'Viewport', 'pg.vpDesktop': 'Desktop', 'pg.vpMobile': 'Mobile', 'pg.vpTablet': 'Tablet',
      'pg.templates': 'Templates', 'pg.reset': 'Clear', 'pg.copy': 'Copy HTML', 'pg.export': 'Export .html', 'pg.clear': 'Clear',
      'pg.editors': 'Editors', 'pg.preview': 'Preview', 'pg.console': 'Console', 'pg.projects': 'Projects', 'pg.snippets': 'Snippets',
      'pg.tpl.portal': 'MSN Portal', 'pg.tpl.web20': 'Web 2.0 Profile', 'pg.tpl.aqua': 'Mac OS X Aqua', 'pg.tpl.vista': 'Windows Vista',
      'pg.conEmpty': 'No output yet — press Run or type.', 'pg.ran': 'Code executed', 'pg.autoOn': 'Auto-run on', 'pg.autoOff': 'Auto-run off',
      'pg.tplApplied': 'Template "{name}" loaded', 'pg.resetDone': 'Editors cleared', 'pg.restored': 'Restored your last snippet',
      'pg.copied': 'HTML copied to clipboard', 'pg.copyFail': 'Could not copy — export the file instead.', 'pg.exported': 'Downloaded standalone .html',
      'pg.projNamePh': 'Project name…', 'pg.projSave': 'Save', 'pg.projOpen': 'Open', 'pg.projUntitled': 'Untitled project',
      'pg.projEmpty': 'Nothing saved yet.', 'pg.projSaved': 'Saved "{name}"', 'pg.projOpened': 'Opened "{name}"',
      'pg.dbUnavailable': 'Local storage unavailable — projects cannot be saved.', 'pg.dbError': 'Could not reach local storage.',
      'pg.privacy': 'Code runs only in a sandboxed frame with a unique opaque origin — it cannot reach this app or your files. No eval, no upload.'
    },
    pt: {
      'pg.run': 'Executar', 'pg.autoRun': 'Execução automática', 'pg.viewport': 'Janela', 'pg.vpDesktop': 'Desktop', 'pg.vpMobile': 'Mobile', 'pg.vpTablet': 'Tablet',
      'pg.templates': 'Modelos', 'pg.reset': 'Limpar', 'pg.copy': 'Copiar HTML', 'pg.export': 'Exportar .html', 'pg.clear': 'Limpar',
      'pg.editors': 'Editores', 'pg.preview': 'Prévia', 'pg.console': 'Console', 'pg.projects': 'Projetos', 'pg.snippets': 'Snippets',
      'pg.tpl.portal': 'Portal MSN', 'pg.tpl.web20': 'Perfil Web 2.0', 'pg.tpl.aqua': 'Mac OS X Aqua', 'pg.tpl.vista': 'Windows Vista',
      'pg.conEmpty': 'Sem saída ainda — pressione Executar ou digite.', 'pg.ran': 'Código executado', 'pg.autoOn': 'Execução automática ativada', 'pg.autoOff': 'Execução automática desativada',
      'pg.tplApplied': 'Modelo "{name}" carregado', 'pg.resetDone': 'Editores limpos', 'pg.restored': 'Snippet anterior restaurado',
      'pg.copied': 'HTML copiado para a área de transferência', 'pg.copyFail': 'Não foi possível copiar — exporte o arquivo.', 'pg.exported': 'Arquivo .html autônomo baixado',
      'pg.projNamePh': 'Nome do projeto…', 'pg.projSave': 'Salvar', 'pg.projOpen': 'Abrir', 'pg.projUntitled': 'Projeto sem nome',
      'pg.projEmpty': 'Nada salvo ainda.', 'pg.projSaved': 'Salvo "{name}"', 'pg.projOpened': 'Aberto "{name}"',
      'pg.dbUnavailable': 'Armazenamento local indisponível — projetos não podem ser salvos.', 'pg.dbError': 'Não foi possível acessar o armazenamento local.',
      'pg.privacy': 'O código roda apenas em um quadro isolado com origem opaca única — não alcança este app nem seus arquivos. Sem eval, sem envio.'
    }
  });

  VT.registry.add(def);
  return def;
})();