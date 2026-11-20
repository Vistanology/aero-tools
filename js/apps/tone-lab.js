window.VT = window.VT || {};
VT.modules = VT.modules || {};

/* Tone Lab — an oscillator bench you can prove.
   The waveform, the envelope and the WAV byte layout are a pure core delimited below, with no
   Web Audio and no DOM in it, so _dev/probe-tone.js drives the same functions this file ships:
   the samples you hear are the samples the encoder writes, byte for byte. Web Audio appears
   once, in audition(), where the rendered array is handed to an AudioBuffer.
*/
VT.modules['tone-lab'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;
  const I = VT.icons;

  VT.i18n.add({
    en: {
      'tl.pitch': 'Pitch and waveform', 'tl.shape': 'Envelope', 'tl.render': 'Render and export',
      'tl.wave': 'Waveform', 'tl.w.sine': 'sine', 'tl.w.square': 'square', 'tl.w.triangle': 'triangle', 'tl.w.sawtooth': 'sawtooth',
      'tl.note': 'Note', 'tl.notePh': 'A4, C#5, Bb3 or a frequency', 'tl.hz': 'Frequency (Hz)',
      'tl.ref': 'Reference A4', 'tl.raise': 'Raise one semitone', 'tl.lower': 'Lower one semitone',
      'tl.a': 'Attack (ms)', 'tl.d': 'Decay (ms)', 'tl.s': 'Sustain level (%)', 'tl.hold': 'Sustain time (ms)', 'tl.r': 'Release (ms)',
      'tl.sweep': 'Sweep to (Hz)', 'tl.sweepPh': 'off', 'tl.curve': 'Sweep curve', 'tl.exp': 'exponential', 'tl.lin': 'linear',
      'tl.gain': 'Output level', 'tl.envLen': 'Envelope length', 'tl.total': '{n} ms, {s} samples',
      'tl.f.nearest': 'Nearest note', 'tl.f.cents': 'Cents off', 'tl.f.midi': 'MIDI number', 'tl.f.period': 'Period',
      'tl.f.wave': 'Wavelength in air', 'tl.f.samples': 'Samples', 'tl.f.bytes': 'WAV size', 'tl.f.peak': 'Peak',
      'tl.f.rms': 'RMS', 'tl.f.cross': 'Zero crossings', 'tl.f.cycle': 'One cycle',
      'tl.audition': 'Audition', 'tl.stop': 'Stop', 'tl.dl': 'Download .wav',
      'tl.ready': 'Rendered {n} samples at {sr} Hz — peak {p}, {b} bytes of PCM.',
      'tl.badNote': 'Not a note name, and not a frequency we can place.',
      'tl.badRange': 'Keep the frequency between {lo} and {hi} Hz.',
      'tl.noAudio': 'This browser gave us no audio output; the numbers and the file are still exact.',
      'tl.playing': 'Playing {s} s through Web Audio.',
      'tl.written': 'WAV written: {b} bytes.',
      'tl.clip': 'The level is above full scale in {n} samples; the encoder clamps them.',
      'tl.privacy': 'The tone is computed here from numbers you typed, then played by your own browser. Nothing is fetched, uploaded or stored in IndexedDB. The patch — waveform, pitch, reference, envelope, level — is the only thing written to localStorage, under `vistanology:tone-lab`.'
    },
    pt: {
      'tl.pitch': 'Tom e forma de onda', 'tl.shape': 'Envelope', 'tl.render': 'Renderizar e exportar',
      'tl.wave': 'Forma de onda', 'tl.w.sine': 'senoidal', 'tl.w.square': 'quadrada', 'tl.w.triangle': 'triangular', 'tl.w.sawtooth': 'dente de serra',
      'tl.note': 'Nota', 'tl.notePh': 'A4, C#5, Bb3 ou uma frequência', 'tl.hz': 'Frequência (Hz)',
      'tl.ref': 'Réfera A4', 'tl.raise': 'Subir um semitom', 'tl.lower': 'Descer um semitom',
      'tl.a': 'Ataque (ms)', 'tl.d': 'Decaimento (ms)', 'tl.s': 'Nível de sustentação (%)', 'tl.hold': 'Tempo de sustentação (ms)', 'tl.r': 'Release (ms)',
      'tl.sweep': 'Varredura até (Hz)', 'tl.sweepPh': 'desligado', 'tl.curve': 'Curva da varredura', 'tl.exp': 'exponencial', 'tl.lin': 'linear',
      'tl.gain': 'Nível de saída', 'tl.envLen': 'Duração do envelope', 'tl.total': '{n} ms, {s} amostras',
      'tl.f.nearest': 'Nota mais próxima', 'tl.f.cents': 'Desvio em cents', 'tl.f.midi': 'Número MIDI', 'tl.f.period': 'Período',
      'tl.f.wave': 'Comprimento de onda no ar', 'tl.f.samples': 'Amostras', 'tl.f.bytes': 'Tamanho do WAV', 'tl.f.peak': 'Pico',
      'tl.f.rms': 'RMS', 'tl.f.cross': 'Cruzamentos de zero', 'tl.f.cycle': 'Um ciclo',
      'tl.audition': 'Ouvir', 'tl.stop': 'Parar', 'tl.dl': 'Baixar .wav',
      'tl.ready': '{n} amostras renderizadas a {sr} Hz — pico {p}, {b} bytes de PCM.',
      'tl.badNote': 'Não é nome de nota, nem frequência que possamos posicionar.',
      'tl.badRange': 'Mantenha a frequência entre {lo} e {hi} Hz.',
      'tl.noAudio': 'Este navegador não deu saída de áudio; os números e o arquivo continuam exatos.',
      'tl.playing': 'Tocando {s} s via Web Audio.',
      'tl.written': 'WAV gerado: {b} bytes.',
      'tl.clip': 'O nível passa do fundo de escala em {n} amostras; o codificador as limita.',
      'tl.privacy': 'O tom é calculado aqui a partir dos números que você digitou e tocado pelo seu próprio navegador. Nada é buscado, enviado ou gravado no IndexedDB. O patch — forma de onda, frequência, referência, envelope, nível — é o único valor escrito no localStorage, em `vistanology:tone-lab`.'
    }
  });

  const def = {
    id: 'tone-lab', cat: 'media', icon: 'wave', version: '1.0.0',
    name: { en: 'Tone Lab', pt: 'Bancada de Tom' },
    tagline: {
      en: 'An oscillator bench you can prove: equal-temperament pitch from a reference you choose, four waveforms, an ADSR envelope, and a 16-bit WAV whose bytes come out of the same pure core that draws the curve and feeds Web Audio.',
      pt: 'Uma bancada de oscilador que se pode provar: afinação de temperamento igual a partir de uma referência sua, quatro formas de onda, envelope ADSR e um WAV de 16 bits cujos bytes saem do mesmo núcleo puro que desenha a curva e alimenta o Web Audio.'
    },
    tags: ['audio', 'oscillator', 'frequency', 'note', 'envelope', 'adsr', 'wav', 'synth'],
    deps: [],
    docs: {
      en: {
        summary: 'A pitch-and-envelope bench with a verifiable signal path. Frequency comes from equal temperament around a reference A4 you can move: `f = a4 · 2^((m−69)/12)`, and the reverse direction names the nearest note and the cents it sits off. Four naive waveforms — sine, square, triangle, sawtooth — are sampled at 44 100 Hz, shaped by an ADSR envelope whose segments are exact sample counts, and written as mono 16-bit PCM by an encoder that is just arithmetic. The same rendered array is handed to Web Audio for audition, so what you hear and what you download are the same numbers; the sweep is either linear in hertz or exponential, whose midpoint is the geometric mean of the two frequencies.',
        usage: [
          'Pick a waveform, then set the pitch: type a note (`C#5`, `Bb3`), a frequency, or step one semitone at a time. The two fields stay in sync through the equal-temperament formula.',
          'Move the reference A4 if you tune to something else — 440, 435, 415, 465 are one tap each. Changing it scales the frequency you have, so a free pitch keeps its relation to the new reference.',
          'Shape the envelope in milliseconds and percent. The curve you see is the gain array the renderer multiplies the waveform by, sampled to 120 points.',
          'Optionally sweep to a second frequency, linearly or exponentially. The exponential midpoint is `√(f₀·f₁)`, which is why a glide sounds even to the ear. The sweep is kept as a ratio, clamped between 0.1× and 10×, so it transposes with the note.',
          'Read the facts: period, wavelength in air at 343 m/s, samples, WAV size, peak, RMS and zero crossings — all measured off the rendered array, not estimated.',
          'Audition plays the rendered buffer through Web Audio; Download .wav writes the identical samples as a RIFF file. The warning mark on a row of numbers tells you the encoder had to clamp.'
        ],
        privacy: 'The tone is computed in this page from the numbers you typed and played by your browser. No fetch, no worker, no upload, no IndexedDB. The patch (waveform, frequency, reference A4, envelope, level, sweep) is remembered under `localStorage` key `vistanology:tone-lab`; nothing you listen to is stored anywhere.',
        limits: [
          'Naive oscillators, not band-limited ones. Square and sawtooth are one sample per value, so they alias above roughly 2 kHz — audible as extra partials, and honest as a teaching bench. A production synth would use polyBLEP or wavetables.',
          'The reference A4 field changes the tuning the page computes; it does not measure your speakers, and no automatic gain or calibration is applied.',
          'Wavelength uses 343 m/s, the speed of sound in dry air near 20 °C. Humidity, temperature and CO₂ shift it; the number is a physics readout, not a room measurement.',
          'The envelope has no per-segment curve: attack, decay and release are straight lines between exact sample boundaries. A real synth often uses exponential curves, which change the sound of a pluck more than these numbers do.',
          'Audition needs an audio device and a user gesture. Where the browser refuses, the numbers, the curve and the WAV stay exact — only playback is missing.'
        ]
      },
      pt: {
        summary: 'Uma bancada de tom e envelope com cadeia de sinal verificável. A frequência vem do temperamento igual em torno de um A4 de referência que você move: `f = a4 · 2^((m−69)/12)`, e a direção inversa nomeia a nota mais próxima e os cents do desvio. Quatro formas de onda ingênuas — senoidal, quadrada, triangular, dente de serra — são amostradas a 44 100 Hz, moldadas por um envelope ADSR cujos segmentos são contagens exatas de amostras e gravadas como PCM mono de 16 bits por um codificador que é só aritmética. O mesmo array renderizado vai para o Web Audio na audição: o que você ouve e o que você baixa são os mesmos números. A varredura é linear em hertz ou exponencial, cujo ponto médio é a média geométrica das duas frequências.',
        usage: [
          'Escolha a forma de onda e defina o tom: digite uma nota (`C#5`, `Bb3`), uma frequência ou avance um semitom por vez. Os dois campos se sincronizam pela fórmula de temperamento igual.',
          'Mova o A4 de referência se você afina diferente — 440, 435, 415, 465 a um toque cada. Mudar isso escala a frequência que está no ar, então um tom livre mantém sua relação com a nova referência.',
          'Modele o envelope em milissegundos e porcentagem. A curva que você vê é o array de ganho que o renderizador multiplica na onda, amostrado em 120 pontos.',
          'Opcionalmente varra até uma segunda frequência, linear ou exponencial. O ponto médio exponencial é `√(f₀·f₁)` — por isso um glide soa uniforme para o ouvido. A varredura é guardada como razão, limitada entre 0,1× e 10×, então ela transpõe junto com a nota.',
          'Leia os fatos: período, comprimento de onda no ar a 343 m/s, amostras, tamanho do WAV, pico, RMS e cruzamentos de zero — todos medidos no array renderizado, não estimados.',
          'Ouvir toca o buffer renderizado via Web Audio; Baixar .wav escreve as mesmas amostras num arquivo RIFF. O aviso nos números diz quando o codificador precisou limitar.'
        ],
        privacy: 'O tom é calculado nesta página a partir dos números digitados e tocado pelo seu navegador. Nada é buscado, enviado ou gravado no IndexedDB. O patch (forma de onda, frequência, A4 de referência, envelope, nível, varredura) fica em `localStorage` na chave `vistanology:tone-lab`; nada do que você ouve é armazenado.',
        limits: [
          'Osciladores ingênuos, sem limitação de banda. Quadrada e dente de serra são um valor por amostra, então aliasam acima de ~2 kHz — ouvível como parciais extras, e honesto como bancada didática. Um synth de produção usaria polyBLEP ou wavetables.',
          'O campo de A4 muda a afinação que a página calcula; ele não mede seus alto-falantes, e nenhuma calibração ou ganho automático é aplicado.',
          'O comprimento de onda usa 343 m/s, a velocidade do som em ar seco perto de 20 °C. Umidade, temperatura e CO₂ alteram esse valor; é um dado de física, não uma medição da sala.',
          'O envelope não tem curva por segmento: ataque, decaimento e release são retas entre fronteiras exatas de amostras. Synths reais costumam usar curvas exponenciais, que mudam mais o som de um pluck do que estes números.',
          'A audição exige dispositivo de saída e um gesto seu. Onde o navegador recusar, os números, a curva e o WAV continuam exatos — falta só a reprodução.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'tone-lab';
  const SR = 44100;
  const WAVES = ['sine', 'square', 'triangle', 'sawtooth'];
  const REFS = [440, 435, 415, 465];
  const MIN_HZ = 20;
  const MAX_HZ = 20000;
  const SOUND_SPEED = 343; // dry air, about 20 °C

  let state = {
    wave: 'sine', hz: 440, a4: 440, gain: 0.8, curve: 'exp', sweepOn: false, sweepRatio: 2,
    env: { a: 10, d: 70, s: 70, hold: 180, r: 140 }
  };
  let refs = {};
  let el = null;
  let alive = false;
  let rendered = null;
  let audioCtx = null;
  let playing = null;

  /* ---------- pure core, sliced by _dev/probe-tone.js ---------- */
  const PC_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const LETTER_PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

  function midiToFreq(m, a4) { return a4 * Math.pow(2, (m - 69) / 12); }
  function freqToMidi(f, a4) { return Math.round(69 + 12 * Math.log(f / a4) / Math.LN2); }
  function noteName(m) { return PC_NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1); }

  function parseNote(text) {
    const m = /^\s*([a-gA-G])([#sb]?)(-?\d{1,2})\s*$/.exec((text || '').trim());
    if (!m) return null;
    const acc = m[2] === 'b' ? -1 : m[2] ? 1 : 0;
    return (Number(m[3]) + 1) * 12 + LETTER_PC[m[1].toUpperCase()] + acc;
  }

  function describeFreq(f, a4) {
    const midi = freqToMidi(f, a4);
    const exact = midiToFreq(midi, a4);
    return { hz: f, midi, name: noteName(midi), exact, cents: 1200 * Math.log(f / exact) / Math.LN2 };
  }

  function waveSample(type, phase) {
    const p = phase - Math.floor(phase);
    if (type === 'sine') return Math.sin(2 * Math.PI * p);
    if (type === 'square') return p < 0.5 ? 1 : -1;
    if (type === 'triangle') return p < 0.25 ? 4 * p : p < 0.75 ? 2 - 4 * p : 4 * p - 4;
    return 2 * p - 1;
  }
  function cycleSamples(type, count) {
    const out = new Array(count);
    for (let i = 0; i < count; i++) out[i] = waveSample(type, i / count);
    return out;
  }

  // Each segment is defined so that its LAST sample lands exactly on the segment target:
  // attack ends at 1, decay ends at the sustain level, release ends at 0. A zero-length
  // segment is skipped, which is why an instant attack still reaches 1 on sample 0.
  function envShape(env, sampleRate) {
    const ms = (v) => Math.max(0, Number(v) || 0);
    const n = (v) => Math.round(ms(v) * sampleRate / 1000);
    const level = Math.min(1, Math.max(0, (Number(env.s) || 0) / 100));
    const s = {
      nA: Math.max(1, n(env.a)), nD: n(env.d), nH: n(env.hold), nR: n(env.r), level,
      ms: { a: ms(env.a), d: ms(env.d), hold: ms(env.hold), r: ms(env.r) }
    };
    s.total = s.nA + s.nD + s.nH + s.nR;
    s.secs = s.total / sampleRate;
    s.msTotal = s.total * 1000 / sampleRate;
    return s;
  }
  function envGainAt(i, s) {
    if (i < s.nA) return (i + 1) / s.nA;
    i -= s.nA;
    if (i < s.nD) return 1 + ((i + 1) / s.nD) * (s.level - 1);
    i -= s.nD;
    if (i < s.nH) return s.level;
    i -= s.nH;
    return s.level * (1 - (i + 1) / s.nR);
  }
  function envCurve(s) {
    const out = new Array(s.total);
    for (let i = 0; i < s.total; i++) out[i] = envGainAt(i, s);
    return out;
  }

  function freqAt(i, f0, f1, mode, total) {
    if (f1 === null || f1 === undefined || f1 === f0) return f0;
    const k = total <= 1 ? 1 : i / (total - 1);
    return mode === 'lin' ? f0 + (f1 - f0) * k : f0 * Math.pow(f1 / f0, k);
  }

  function renderTone(opts) {
    const s = envShape(opts.env, opts.sampleRate);
    const total = Math.max(1, s.total);
    const sweep = opts.sweepTo && opts.sweepTo !== opts.hz ? opts.sweepTo : null;
    const out = new Array(total);
    let phase = 0;
    for (let i = 0; i < total; i++) {
      out[i] = waveSample(opts.wave, phase) * envGainAt(i, s) * opts.gain;
      phase += (sweep ? freqAt(i, opts.hz, sweep, opts.curve, total) : opts.hz) / opts.sampleRate;
      if (phase >= 1) phase -= Math.floor(phase);
    }
    return { samples: out, env: s, hz: opts.hz, sweep, wave: opts.wave };
  }

  function statsOf(samples) {
    let peak = 0, sum2 = 0, cross = 0, clipped = 0, prev = 0;
    for (let i = 0; i < samples.length; i++) {
      const x = samples[i];
      const a = Math.abs(x);
      if (a > peak) peak = a;
      if (a > 1) clipped++;
      sum2 += x * x;
      if (i > 0 && x !== 0 && prev !== 0 && (x < 0) !== (prev < 0)) cross++;
      prev = x;
    }
    return { peak, rms: Math.sqrt(sum2 / samples.length), cross, clipped, n: samples.length };
  }

  function encodeWav(samples, sampleRate) {
    const n = samples.length;
    const bytes = new Uint8Array(44 + 2 * n);
    const dv = new DataView(bytes.buffer);
    const tag = (off, text) => { for (let i = 0; i < text.length; i++) bytes[off + i] = text.charCodeAt(i); };
    tag(0, 'RIFF'); dv.setUint32(4, 36 + 2 * n, true); tag(8, 'WAVE');
    tag(12, 'fmt '); dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sampleRate, true); dv.setUint32(28, sampleRate * 2, true);
    dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
    tag(36, 'data'); dv.setUint32(40, 2 * n, true);
    for (let i = 0; i < n; i++) {
      const v = Math.max(-1, Math.min(1, samples[i]));
      dv.setInt16(44 + 2 * i, Math.round(v * 32767), true);
    }
    return bytes;
  }

  function previewPoints(values, w, h, count) {
    const out = [];
    const n = values.length;
    if (!n) return out;
    for (let i = 0; i < count; i++) {
      const idx = n === 1 ? 0 : Math.round(i * (n - 1) / (count - 1));
      const x = count === 1 ? 0 : (i * w) / (count - 1);
      out.push([x, h / 2 - values[idx] * (h / 2)]);
    }
    return out;
  }
  function toPath(points) {
    return points.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  }
  /* ---------- end pure core ---------- */

  function currentOpts() {
    return {
      wave: state.wave, hz: state.hz, sampleRate: SR, gain: state.gain,
      env: state.env,
      sweepTo: state.sweepOn ? state.hz * state.sweepRatio : null,
      curve: state.curve
    };
  }

  function mount(root) {
    alive = true;
    el = root;
    restore();
    root.innerHTML = `
      <div class="tl-work">
        <section class="step glass">
          <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('tl.pitch')}</h3></div>
          <div class="field"><label>${t('tl.wave')}</label>
            <div class="tl-waves" role="group" aria-label="${t('tl.wave')}">
              ${WAVES.map((w) => '<button type="button" class="chip tl-wave" data-wave="' + w + '" aria-pressed="false">' +
                '<svg class="tl-wave-ico" viewBox="0 0 40 16" aria-hidden="true"><path d="' + toPath(previewPoints(cycleSamples(w, 48), 40, 14, 48)) +
                '" transform="translate(0 1)"/></svg><span>' + t('tl.w.' + w) + '</span></button>').join('')}
            </div>
          </div>
          <div class="field-row">
            <div class="field"><label for="tl-note">${t('tl.note')}</label>
              <input class="input mono" id="tl-note" type="text" spellcheck="false" autocomplete="off" placeholder="${t('tl.notePh')}"></div>
            <div class="field"><label for="tl-hz">${t('tl.hz')}</label>
              <input class="input mono" id="tl-hz" type="number" step="0.01" min="${MIN_HZ}" max="${MAX_HZ}"></div>
          </div>
          <div class="bench-row">
            <button class="btn btn-ghost btn-sm" id="tl-lower" aria-label="${t('tl.lower')}">${I.arrowLeft} −1</button>
            <button class="btn btn-ghost btn-sm" id="tl-raise" aria-label="${t('tl.raise')}">+1 ${I.arrowRight}</button>
            <span class="bench-hint">${t('tl.ref')}</span>
            ${REFS.map((r) => '<button type="button" class="chip chip-sm mono tl-ref" data-ref="' + r + '" aria-pressed="false">' + r + '</button>').join('')}
          </div>
          <p class="tl-status" id="tl-status" role="status" aria-live="polite"></p>
        </section>

        <section class="step glass">
          <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('tl.shape')}</h3></div>
          <div class="tl-env-grid">
            <div class="field"><label for="tl-a">${t('tl.a')}</label><input class="input mono" id="tl-a" type="number" min="0" max="2000" step="5"></div>
            <div class="field"><label for="tl-d">${t('tl.d')}</label><input class="input mono" id="tl-d" type="number" min="0" max="4000" step="5"></div>
            <div class="field"><label for="tl-s">${t('tl.s')}</label><input class="input mono" id="tl-s" type="number" min="0" max="100" step="1"></div>
            <div class="field"><label for="tl-hold">${t('tl.hold')}</label><input class="input mono" id="tl-hold" type="number" min="0" max="4000" step="10"></div>
            <div class="field"><label for="tl-r">${t('tl.r')}</label><input class="input mono" id="tl-r" type="number" min="0" max="4000" step="5"></div>
          </div>
          <svg class="tl-curve" id="tl-curve" viewBox="0 0 300 72" preserveAspectRatio="none" role="img" aria-label="${t('tl.shape')}">
            <path class="tl-curve-grid" d="M0 36 H300"/>
            <path class="tl-curve-env" id="tl-env-path" d=""/>
            <path class="tl-curve-wave" id="tl-wave-path" d=""/>
          </svg>
          <p class="bench-hint" id="tl-envlen"></p>
        </section>

        <section class="step glass">
          <div class="step-head"><span class="step-num">03</span><h3 class="step-title">${t('tl.render')}</h3></div>
          <div class="field-row">
            <div class="field"><label for="tl-sweep">${t('tl.sweep')}</label>
              <input class="input mono" id="tl-sweep" type="number" step="0.01" min="${MIN_HZ}" max="${MAX_HZ}" placeholder="${t('tl.sweepPh')}"></div>
            <div class="field"><label for="tl-curve-mode">${t('tl.curve')}</label>
              <select class="input" id="tl-curve-mode">
                <option value="exp">${t('tl.exp')}</option><option value="lin">${t('tl.lin')}</option>
              </select></div>
          </div>
          <div class="field"><label for="tl-gain">${t('tl.gain')} — <span class="mono" id="tl-gain-read"></span></label>
            <input id="tl-gain" type="range" min="0" max="1" step="0.05"></div>
          <div class="export-row">
            <button class="btn btn-ghost btn-sm" id="tl-audition">${I.play} <span>${t('tl.audition')}</span></button>
            <button class="btn btn-ghost btn-sm" id="tl-dl">${I.download} ${t('tl.dl')}</button>
          </div>
          <table class="tl-facts">
            <tbody id="tl-facts"></tbody>
          </table>
        </section>

        <p class="privacy-line">${I.shield} ${t('tl.privacy')}</p>
      </div>`;

    refs = {
      note: $('#tl-note', root), hz: $('#tl-hz', root), status: $('#tl-status', root),
      envPath: $('#tl-env-path', root), wavePath: $('#tl-wave-path', root), envLen: $('#tl-envlen', root),
      sweep: $('#tl-sweep', root), curveMode: $('#tl-curve-mode', root),
      gain: $('#tl-gain', root), gainRead: $('#tl-gain-read', root), facts: $('#tl-facts', root),
      audition: $('#tl-audition', root), dl: $('#tl-dl', root)
    };

    U.$$('.tl-wave', root).forEach((b) => b.addEventListener('click', () => { state.wave = b.dataset.wave; persist(); sync(); }));
    U.$$('.tl-ref', root).forEach((b) => b.addEventListener('click', () => {
      const next = Number(b.dataset.ref);
      // Retuning scales the current frequency, so a free pitch keeps its relation to the reference.
      state.hz = U.clamp(state.hz * (next / state.a4), MIN_HZ, MAX_HZ);
      state.a4 = next;
      persist(); sync();
    }));
    // The text is captured when the event fires, not when the debounce runs: a blur can
    // otherwise land between the two and have the bench re-echo over what was just typed.
    const onNoteInput = U.debounce(onNote, 140);
    const onHzInput = U.debounce(onHz, 140);
    refs.note.addEventListener('input', (e) => onNoteInput(e.target.value));
    refs.hz.addEventListener('input', (e) => onHzInput(e.target.value));
    $('#tl-lower', root).addEventListener('click', () => step(-1));
    $('#tl-raise', root).addEventListener('click', () => step(1));
    ['a', 'd', 's', 'hold', 'r'].forEach((k) => {
      const input = $('#tl-' + k, root);
      const apply = U.debounce((value) => {
        state.env[k] = U.clamp(Math.round(Number(value) || 0), 0, k === 's' ? 100 : 4000);
        persist(); sync();
      }, 120);
      input.addEventListener('input', (e) => apply(e.target.value));
    });
    refs.sweep.addEventListener('input', (e) => onSweep(e.target.value));
    refs.curveMode.addEventListener('change', () => { state.curve = refs.curveMode.value; persist(); sync(); });
    // Leaving a text field normalises what it shows; while typing, the reader keeps their own text.
    [refs.note, refs.hz, refs.sweep].forEach((f) => f.addEventListener('change', () => sync(true)));
    refs.gain.addEventListener('input', () => { state.gain = Number(refs.gain.value); refs.gainRead.textContent = Math.round(state.gain * 100) + '%'; });
    refs.gain.addEventListener('change', () => { persist(); sync(); });
    refs.audition.addEventListener('click', audition);
    refs.dl.addEventListener('click', downloadWav);

    sync();
  }

  function unmount() {
    alive = false;
    stopAudio();
    rendered = null; refs = {}; el = null;
  }

  function onNote(raw0) {
    const raw = (raw0 || '').trim();
    if (!raw) return;
    // A letter and an accidental are a note still being typed, not a mistake.
    if (/^[a-gA-G][#sb]?$/.test(raw)) return;
    const midi = parseNote(raw);
    if (midi !== null && midi >= 0 && midi <= 127) { state.hz = midiToFreq(midi, state.a4); persist(); sync(); return; }
    const f = Number(raw.replace(',', '.'));
    if (Number.isFinite(f) && f >= MIN_HZ && f <= MAX_HZ) { state.hz = f; persist(); sync(); return; }
    status(t('tl.badNote'), true);
  }

  function onHz(raw) {
    const f = Number(raw);
    if (!Number.isFinite(f) || f < MIN_HZ || f > MAX_HZ) { status(t('tl.badRange', { lo: MIN_HZ, hi: MAX_HZ }), true); return; }
    state.hz = f;
    persist(); sync();
  }

  const onSweep = U.debounce((raw) => {
    const f = Number(raw);
    state.sweepOn = Number.isFinite(f) && f >= MIN_HZ && f <= MAX_HZ;
    if (state.sweepOn) state.sweepRatio = U.clamp(f / state.hz, 0.1, 10);
    persist(); sync();
  }, 140);

  // Stepping is a keyboard action: it lands on the next note of the temperament,
  // so a free pitch snaps to the grid the moment you start stepping it.
  function step(semitones) {
    state.hz = midiToFreq(U.clamp(freqToMidi(state.hz, state.a4) + semitones, 0, 127), state.a4);
    persist(); sync();
  }

  // A field the reader is typing into is never rewritten under their cursor.
  function echo(field, value, force) {
    if (force || document.activeElement !== field) field.value = value;
  }

  function sync(force) {
    if (!alive || !refs.note) return;
    const opts = currentOpts();
    const hz = opts.hz;
    const info = describeFreq(hz, state.a4);

    U.$$('.tl-wave', el).forEach((b) => {
      b.classList.toggle('on', b.dataset.wave === state.wave);
      b.setAttribute('aria-pressed', String(b.dataset.wave === state.wave));
    });
    U.$$('.tl-ref', el).forEach((b) => {
      b.classList.toggle('on', Number(b.dataset.ref) === state.a4);
      b.setAttribute('aria-pressed', String(Number(b.dataset.ref) === state.a4));
    });

    echo(refs.note, info.name, force);
    echo(refs.hz, hz.toFixed(2), force);
    refs.gain.value = String(state.gain);
    refs.gainRead.textContent = Math.round(state.gain * 100) + '%';
    refs.curveMode.value = state.curve;
    echo(refs.sweep, state.sweepOn ? (hz * state.sweepRatio).toFixed(2) : '', force);

    rendered = renderTone(opts);
    const st = statsOf(rendered.samples);
    const shape = rendered.env;

    refs.envPath.setAttribute('d', toPath(previewPoints(envCurve(shape), 300, 72, 120)));
    refs.wavePath.setAttribute('d', toPath(previewPoints(rendered.samples, 300, 72, 300)));
    refs.envLen.textContent = t('tl.total', { n: Math.round(shape.msTotal), s: shape.total });

    status(t('tl.ready', {
      n: st.n, sr: SR, p: st.peak.toFixed(3), b: 44 + 2 * st.n
    }) + (st.clipped ? ' ' + t('tl.clip', { n: st.clipped }) : ''), false);

    const rows = [
      ['tl.f.nearest', info.name + ' · ' + info.exact.toFixed(2) + ' Hz'],
      ['tl.f.cents', (info.cents >= 0 ? '+' : '') + info.cents.toFixed(1) + ' ¢'],
      ['tl.f.midi', String(info.midi)],
      ['tl.f.period', (1000 / hz).toFixed(3) + ' ms'],
      ['tl.f.wave', (SOUND_SPEED / hz).toFixed(3) + ' m'],
      ['tl.f.samples', String(st.n)],
      ['tl.f.bytes', U.formatBytes(44 + 2 * st.n)],
      ['tl.f.peak', st.peak.toFixed(3)],
      ['tl.f.rms', st.rms.toFixed(4)],
      ['tl.f.cross', String(st.cross)]
    ];
    refs.facts.innerHTML = rows.map((r) =>
      '<tr><th scope="row" data-label="' + esc(t(r[0])) + '">' + esc(t(r[0])) + '</th>' +
      '<td class="mono">' + esc(r[1]) + '</td></tr>').join('');
  }

  function status(msg, bad) {
    refs.status.textContent = msg;
    refs.status.className = 'tl-status ' + (bad ? 'bad' : 'ok');
  }

  function stopAudio() {
    if (playing) { try { playing.stop(); } catch { /* already finished */ } playing = null; }
  }

  function audition() {
    if (!rendered) return;
    if (playing) { stopAudio(); setPlayLabel(false); return; }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) { toast(t('tl.noAudio'), 'warn'); return; }
    try {
      audioCtx = audioCtx || new Ctor();
      const buf = audioCtx.createBuffer(1, rendered.samples.length, SR);
      buf.copyToChannel(Float32Array.from(rendered.samples), 0);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      src.connect(audioCtx.destination);
      src.onended = () => { if (playing === src) { playing = null; setPlayLabel(false); } };
      src.start();
      playing = src;
      setPlayLabel(true);
      status(t('tl.playing', { s: rendered.env.secs.toFixed(3) }), false);
    } catch { toast(t('tl.noAudio'), 'warn'); }
  }

  function setPlayLabel(on) {
    refs.audition.querySelector('span').textContent = t(on ? 'tl.stop' : 'tl.audition');
    refs.audition.classList.toggle('on', on);
  }

  function downloadWav() {
    if (!rendered) return;
    const bytes = encodeWav(rendered.samples, SR);
    const near = describeFreq(state.hz, state.a4);
    U.downloadBlob(new Blob([bytes], { type: 'audio/wav' }),
      'vistanology-tone-' + state.wave + '-' + near.name.replace(/[#b]/, '') + '-' + Math.round(state.hz) + 'Hz.wav');
    toast(t('tl.written', { b: bytes.length }), 'ok');
  }

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    try {
      const s = VT.store.get(KEY);
      if (!s) return;
      if (WAVES.indexOf(s.wave) >= 0) state.wave = s.wave;
      if (Number.isFinite(s.hz) && s.hz >= MIN_HZ && s.hz <= MAX_HZ) state.hz = Number(s.hz);
      if (REFS.indexOf(Number(s.a4)) >= 0) state.a4 = Number(s.a4);
      if (Number.isFinite(s.gain)) state.gain = U.clamp(Number(s.gain), 0, 1);
      if (s.curve === 'lin' || s.curve === 'exp') state.curve = s.curve;
      state.sweepOn = !!s.sweepOn;
      if (Number.isFinite(s.sweepRatio)) state.sweepRatio = U.clamp(Number(s.sweepRatio), 0.1, 10);
      if (s.env) {
        ['a', 'd', 's', 'hold', 'r'].forEach((k) => {
          if (Number.isFinite(Number(s.env[k]))) state.env[k] = U.clamp(Math.round(Number(s.env[k])), 0, k === 's' ? 100 : 4000);
        });
      }
    } catch { /* the patch is a convenience */ }
  }

  VT.registry.add(def);
  return def;
})();
