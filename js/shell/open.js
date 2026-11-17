window.VT = window.VT || {};
VT.shell = VT.shell || {};

VT.shell.open = (el) => {
  const t = VT.i18n.t, L = VT.i18n.lang, I = VT.icons;

  const MIT = `MIT License

Copyright (c) 2026 Vistanology

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

  el.innerHTML = `
    <div class="open-hero">
      <h1>${t('open.title')}</h1>
      <p>${t('open.sub')}</p>
    </div>
    <div class="open-nav" id="open-nav">
      ${['license', 'releases', 'contributing', 'credits', 'privacy'].map((s) => `<button class="chip" data-target="open-${s}">${t('open.' + s)}</button>`).join('')}
    </div>

    <section class="open-section glass" id="open-license">
      <h2>${t('open.license')}</h2>
      <pre>${MIT}</pre>
    </section>

    <section class="open-section glass" id="open-releases">
      <h2>${t('open.releases')}</h2>
      <div>
        ${VT.releases.map((r) => `
          <div class="rel-row">
            <span class="rel-ver">v${r.version}</span>
            <span class="rel-date">${r.date}</span>
            <span class="rel-notes">${r.notes[L].map((n) => '<span>· ' + VT.utils.esc(n) + '</span>').join('')}</span>
          </div>`).join('')}
      </div>
    </section>

    <section class="open-section glass" id="open-contributing">
      <h2>${t('open.contributing')}</h2>
      <div class="prose"><p>${t('open.contrib.1')}</p><p>${t('open.contrib.2')}</p></div>
    </section>

    <section class="open-section glass" id="open-credits">
      <h2>${t('open.credits')}</h2>
      <p class="hint">${t('open.credits.sub')}</p>
      <table class="dep-table">
        <thead><tr><th>${t('dep.name')}</th><th>${t('dep.version')}</th><th>${t('dep.license')}</th><th>${t('dep.usedfor')}</th></tr></thead>
        <tbody>
          ${VT.deps.map((d) => `<tr><td>${d.name}<br><span class="hint">${d.author}</span></td><td class="mono">${d.version}</td><td>${d.license}</td><td>${d.used[L]}</td></tr>`).join('')}
        </tbody>
      </table>
    </section>

    <section class="open-section glass" id="open-privacy">
      <h2>${t('open.privacy')}</h2>
      <div class="prose"><p>${t('open.privacy.1')}</p><p>${t('open.privacy.2')}</p><p>${t('open.privacy.3')}</p></div>
    </section>`;

  VT.utils.$$('#open-nav .chip', el).forEach((b) => {
    b.addEventListener('click', () => {
      const target = VT.utils.$('#' + b.dataset.target, el);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
};