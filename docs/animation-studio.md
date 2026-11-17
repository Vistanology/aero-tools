# CSS Animation Studio · v0.1.0

Build CSS `@keyframes` visually — timing, easing curves and per-stop transform, opacity, color and radius —
preview it live, and export clean CSS. No hand-written keyframes, no `eval`.
Crie `@keyframes` de CSS visualmente — tempo, curvas de easing e, por quadro, transformação, opacidade, cor e
raio — pré-visualize ao vivo e exporte CSS limpo. Sem keyframes escritos à mão, sem `eval`.

Category: 01 Creative · Engine: typed animation model → compiled CSS injected into a scoped `<style>` applied to
a live preview target + CSS serializer · 100% local · no dependencies · no `eval()`.

## Usage · Uso

- **Presets** — start from Pulse, Spin, Bounce, Slide in, Float or Shake, then refine. · **Predefinições** —
  comece por uma e refine.
- **Timing (left)** — duration, delay, iterations, direction, fill mode and an **easing** function. Choose a named
  easing or **cubic-bezier…** to reveal four sliders and watch the curve graph update. · **Tempo** — duração,
  atraso, iterações, direção, preenchimento e **easing**; escolha um nomeado ou **cubic-bezier…** para ver a curva.
- **Keyframe stops** — chips show each stop's position; select one, change its **At %**, or **+ Stop** / **Remove**
  (at least two remain). · **Quadros-chave** — selecione um quadro, ajuste a posição, adicione ou remova.
- **Selected stop properties** — Move X/Y, Rotate, Scale, Opacity, Color and Radius sliders edit the chosen stop;
  the preview and CSS update live. · **Propriedades do quadro** — sliders editam o quadro escolhido ao vivo.
- **Preview** — the animated target runs in a scoped style. **Pause/Play** toggles `animation-play-state` on the
  live frame (the exported CSS stays clean); **Restart** replays. The easing curve is drawn beside it. ·
  **Prévia** — o alvo anima; **Pausar/Reproduzir** e **Reiniciar**; a curva de easing ao lado.
- **Undo / Redo** — the whole animation is on `VT.history`; `Ctrl+Z` / `Ctrl+Shift+Z` when not focused in a control.
  **Copy CSS / Export .css** — the `@keyframes` + rule, downloaded as `vistanology-animation.css`. ·
  **Desfazer/Refazer**, **Copiar CSS / Exportar .css**.
- **Saved** — save the current animation by name to IndexedDB and reopen it; the working animation also
  **autosaves** (key `as:autosave`) and is restored + run when you return. · **Salvos** — salve por nome e reabra;
  a animação de trabalho tem **salvamento automático** e é restaurada e executada ao voltar.

## Privacy · Privacidade

All editing and export run in your browser. The stylesheet is compiled from browser-validated control values only
— sliders return clamped numbers, color pickers return hex, and iteration/direction/fill/easing come from fixed
option lists — so there is no free-text CSS, no scripts and no `eval`. Animations autosave on-device via IndexedDB.
Nothing is uploaded. · Tudo roda no navegador; a folha é compilada apenas de valores validados; nada é enviado.

## Limits · Limites

- Animates a single sample target with the properties that cover most UI motion (translate, rotate, scale,
  opacity, background, border-radius); it exports `@keyframes` + one rule, not multi-element timelines. · Anima um
  único alvo; exporta `@keyframes` + uma regra, não linhas do tempo com vários elementos.
- The easing curve graph is a visual guide to the timing function, not a keyframe timeline editor. · A curva é um
  guia visual da função de tempo, não um editor de linha do tempo.
- The preview uses standard CSS animations; very long or infinite animations keep running until Pause or Restart. ·
  A prévia usa animações CSS padrão; animações infinitas rodam até Pausar ou Reiniciar.

## Verified · Verificado

Run in Chromium against `http://localhost:8735` (increment evidence in [`checklist-u10.md`](checklist-u10.md)):

- **Mount** — 3 control groups; live target computed `animation-name: as-anim`, `animation-duration: 1.2s`,
  `ease-in-out`; CSS output contains `@keyframes as-anim`; easing curve SVG has a path. · Montagem conferida.
- **Preset** — Spin emits `360deg` + `linear`; Bounce builds 5 stops. · Predefinições conferidas.
- **Custom easing** — selecting cubic-bezier reveals 4 bezier sliders, writes `cubic-bezier(…)` into the CSS and
  draws 2 curve handles. · Easing personalizado conferido.
- **Stop property edit** — Scale slider → `scale(1.750)` in the compiled CSS. · Edição de quadro conferida.
- **Add stop** — chip count grows by one. · Adicionar quadro conferido.
- **Play/Pause** — live `<style>` gains `animation-play-state: paused` and the target gets `.is-paused`, while the
  **export panel stays clean** (no play-state baked in). · Pausar/Reproduzir conferido.
- **Undo** — reverts the last change; **Export** downloads `vistanology-animation.css` (toast confirmed). ·
  Desfazer e exportação conferidos.
- **Autosave + restore** — Bounce (5 stops) persisted to `as:autosave`; after reload it restored, ran, and the
  hint "Restored your last animation" stuck. · Autosave restaurado + executado conferido.
- **Named animations** — saved "BounceTest", switched to Spin, reopened → Bounce restored (5 stops, `-44px`). ·
  Animações nomeadas conferidas.
- **Offline** — server stopped (`curl` exit 000, port closed): navigation and `animation-studio.js` both
  `transferSize: 0`, tool mounted from cache, bounce restored and running with no network. · Offline provado.
- Console clean throughout (0 errors, 0 warnings). · Console limpo.

Screenshots: [`shots/animation-studio-preview.png`](shots/animation-studio-preview.png) (timing controls + live target).

### Pending / Limitações do ambiente de teste

- The embedded browser viewport is ~592 px, so the controls/preview/saved columns stack; the three-pane desktop
  layout was verified by DOM/computed-style checks rather than a wide physical capture. · Janela estreita; layout
  de três colunas verificado via DOM/estilo computado.
