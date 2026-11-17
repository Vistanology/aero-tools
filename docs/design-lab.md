# Design System Lab · v0.1.0

Tune a Cosmic Liquid Glass design system live — base and accent colors, glass tint, backdrop blur, radius,
shadow and type — preview it on real components, save themes locally, and export the CSS custom properties.
Ajuste um sistema de design Cosmic Liquid Glass ao vivo — cores base e de destaque, tom do vidro, desfoque,
raio, sombra e tipografia — pré-visualize em componentes reais, salve temas localmente e exporte as propriedades CSS.

Category: 01 Creative · Engine: token model → derived CSS custom properties applied to a live preview root +
CSS serializer · 100% local · no dependencies · no `eval()`.

## Usage · Uso

- **Presets** — start from Cosmic, Aurora, Midnight, Ember or Frost, then refine. · **Predefinições** — comece
  por uma e refine.
- **Controls (left)** — four groups: Palette (base / accent / accent 2 / text color pickers), Glass (tint, blur,
  border sliders), Shape (radius, shadow offset/blur/opacity sliders), Type (display + UI font selects). Every
  change updates the preview and the CSS source instantly. · **Controles** — quatro grupos; cada mudança atualiza
  prévia e CSS ao vivo.
- **Preview (center)** — real components (hero, badge, primary/ghost buttons, glass card, input, chips, nested
  surface) rendered entirely from the current tokens via CSS variables. · **Prévia** — componentes reais guiados
  só pelos tokens atuais.
- **Undo / Redo** — the whole token set is on `VT.history`; `Ctrl+Z` / `Ctrl+Shift+Z` when not focused in a control.
  **Desfazer/Refazer** — conjunto de tokens inteiro no histórico.
- **Copy CSS / Export .css** — generate a `:root { … }` custom-properties block plus a sample rule and download
  `vistanology-tokens.css`. · **Copiar CSS / Exportar .css** — gera bloco `:root` com regra de exemplo.
- **Themes** — save the current token set by name to IndexedDB and reopen it; the working theme also **autosaves**
  (key `ds:autosave`) and is restored with a hint when you return. · **Temas** — salve por nome no IndexedDB e
  reabra; o tema de trabalho tem **salvamento automático** e é restaurado com dica.

## Privacy · Privacidade

All editing and export run in your browser. Exported CSS interpolates only browser-validated token values — color
pickers return hex, sliders return clamped numbers, and fonts come from a fixed whitelist — so no scripts and no
`eval` are ever involved. Themes and autosave are stored on-device via IndexedDB. Nothing is uploaded. · Tudo roda
no navegador; o CSS exportado interpola apenas valores validados; nada é enviado.

## Limits · Limites

- Covers the identity tokens that matter for a glassmorphism system (palette, glass, shape, type); it exports
  tokens + one sample rule, not a full component library. · Cobre os tokens da identidade; exporta tokens + uma
  regra de exemplo, não uma biblioteca completa.
- Font stacks reference common families; exact rendering depends on the fonts installed on the viewing machine.
  As pilhas de fonte referenciam famílias comuns; a renderização exata depende das fontes instaladas.
- `backdrop-filter` blur is shown where the browser supports it. · O desfoque `backdrop-filter` aparece onde o
  navegador o suporta.

## Verified · Verificado

Run in Chromium against `http://localhost:8735` (increment evidence in [`checklist-u8.md`](checklist-u8.md)):

- **Mount** — 4 control groups, 13 controls, 5 presets, live preview with `--ds-*` variables set (accent `#5FE6FF`,
  blur `20px`), CSS source 933 chars. · Montagem conferida.
- **Color edit** — accent picker → `--ds-accent` becomes `#ff0000` on the preview root and in the CSS output. ·
  Cor ao vivo conferida.
- **Range edit** — blur slider → `--ds-blur: 32px`, value label "32 px", CSS updated. · Slider conferido.
- **Preset** — Ember sets accent `#FFB27D`, rebuilds controls, hint "Preset \"Ember\" applied". · Predefinição conferida.
- **Undo** — restores the previous token set (accent back to `#ff0000`). · Desfazer conferido.
- **CSS export** — captured download is `vistanology-tokens.css`, `text/css`, contains `:root`, `--ds-surface`,
  `--ds-shadow`. · Exportação CSS conferida.
- **Autosave + restore** — applying Frost wrote `{accent:#9DEAFF, blur:34}` to `ds:autosave`; after reload the
  preview restored accent `#9DEAFF` / blur `34px` with hint "Restored your last theme" and the CSS source matched. ·
  Autosave restaurado conferido.
- **Named themes** — saved "Brand Teal" (Aurora), switched to Midnight (accent `#5FE6FF`), then Open restored the
  Aurora accent `#7FF0D4`. · Temas nomeados conferidos.
- **Offline** — server stopped (`curl` exit 000, port closed): navigation `transferSize: 0`, shell + tool loaded
  from cache, autosave theme restored from IndexedDB with no network. · Offline provado.
- Console clean throughout (0 errors, 0 warnings). · Console limpo.

Screenshots: [`shots/design-lab-preview.png`](shots/design-lab-preview.png) (live glass preview).

### Pending / Limitações do ambiente de teste

- The embedded browser viewport is ~592 px, so the three columns stack; the desktop three-pane layout was
  verified by DOM/computed-style checks rather than a wide physical capture. · Janela estreita; layout de três
  colunas verificado via DOM/estilo computado.
