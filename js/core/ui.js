window.VT = window.VT || {};

VT.ui = (() => {
  const { $, $$, esc } = VT.utils;
  const t = (k, v) => VT.i18n.t(k, v);

  /* ---------- Toasts ---------- */
  function toast(msg, type = 'info', timeout = 3200) {
    const icons = { success: VT.icons.check, error: VT.icons.alert, warn: VT.icons.alert, info: VT.icons.info };
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.setAttribute('role', 'status');
    el.innerHTML = (icons[type] || icons.info) + '<span>' + esc(msg) + '</span>';
    $('#toasts').appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 300);
    }, timeout);
  }

  /* ---------- Modals ---------- */
  let openModals = [];

  function modal({ title, body, actions = [], wide = false, onClose }) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML =
      '<div class="modal glass-3' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
        '<div class="modal-head"><h2>' + esc(title) + '</h2>' +
          '<button class="btn btn-ghost btn-icon modal-x" aria-label="' + esc(t('common.close')) + '">' + VT.icons.x + '</button></div>' +
        '<div class="modal-body"></div>' +
        (actions.length ? '<div class="modal-actions"></div>' : '') +
      '</div>';
    const root = backdrop.firstElementChild;
    const bodyEl = $('.modal-body', root);
    bodyEl.innerHTML = body;
    const actionsEl = $('.modal-actions', root);

    const prevFocus = document.activeElement;
    const entry = { root, close };

    function close() {
      backdrop.remove();
      openModals = openModals.filter((m) => m !== entry);
      document.removeEventListener('keydown', onKey, true);
      if (onClose) onClose();
      if (prevFocus && prevFocus.focus) prevFocus.focus();
    }

    function onKey(e) {
      if (openModals[openModals.length - 1] !== entry) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key === 'Tab') {
        const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', root)
          .filter((el) => !el.disabled && el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    actions.forEach((a) => {
      const b = document.createElement('button');
      b.className = 'btn ' + (a.className || '');
      b.innerHTML = (a.icon || '') + '<span>' + esc(a.label) + '</span>';
      b.addEventListener('click', () => a.onClick && a.onClick({ body: bodyEl, close }));
      actionsEl.appendChild(b);
    });

    $('.modal-x', root).addEventListener('click', close);
    backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
    document.addEventListener('keydown', onKey, true);

    $('#modal-root').appendChild(backdrop);
    openModals.push(entry);
    const focusables = $$('button, [href], input, select, textarea', root).filter((el) => !el.disabled);
    (focusables[0] || root).focus();
    return { body: bodyEl, root, close };
  }

  function confirm({ title, body, confirmLabel, danger = true }) {
    return new Promise((resolve) => {
      let settled = false;
      const done = (v) => { if (!settled) { settled = true; resolve(v); } };
      modal({
        title,
        body: '<p class="modal-msg">' + esc(body) + '</p>',
        onClose: () => done(false),
        actions: [
          { label: t('common.cancel'), className: 'btn-ghost', onClick: ({ close }) => { close(); } },
          {
            label: confirmLabel || t('common.confirm'),
            className: danger ? 'btn-danger' : 'btn-primary',
            onClick: ({ close }) => { done(true); close(); }
          }
        ]
      });
    });
  }

  /* ---------- Tabs ---------- */
  function tabs(root, onChange) {
    const list = $('[role="tablist"]', root);
    const btns = $$('[role="tab"]', list);
    function select(id, fire = true) {
      btns.forEach((b) => {
        const on = b.dataset.tab === id;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
      });
      $$('[data-panel]', root).forEach((p) => { p.hidden = p.dataset.panel !== id; });
      if (fire && onChange) onChange(id);
    }
    btns.forEach((b) => b.addEventListener('click', () => select(b.dataset.tab)));
    list.addEventListener('keydown', (e) => {
      const i = btns.indexOf(document.activeElement);
      if (i < 0) return;
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % btns.length;
      if (e.key === 'ArrowLeft') j = (i - 1 + btns.length) % btns.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = btns.length - 1;
      if (j !== null) { e.preventDefault(); btns[j].focus(); select(btns[j].dataset.tab); }
    });
    const initial = btns.find((b) => b.getAttribute('aria-selected') === 'true') || btns[0];
    if (initial) select(initial.dataset.tab, false);
    return { select };
  }

  return { toast, modal, confirm, tabs };
})();