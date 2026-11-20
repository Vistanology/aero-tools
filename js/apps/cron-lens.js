window.VT = window.VT || {};
VT.modules = VT.modules || {};

/* Cron Lens — POSIX crontab reader.
   The scheduler is a pure core over year/month/day/hour/minute structs with no Date
   objects and no timezone reads, so _dev/probe-cron.js drives the very functions this
   file ships and compares them against hand-computed occurrence lists (day of week
   comes from Sakamoto's formula inside the core and is cross-checked there against
   Date.UTC). The browser only stamps the resulting wall-clock structs into instants,
   which is where a DST gap can appear — that is reported, not hidden.
*/
VT.modules['cron-lens'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;
  const I = VT.icons;

  VT.i18n.add({
    en: {
      'cl.expr': 'Crontab expression', 'cl.exprPh': 'minute hour day-of-month month day-of-week',
      'cl.explain': 'Reading', 'cl.runs': 'Next occurrences', 'cl.presets': 'Presets',
      'cl.sample': 'Use sample', 'cl.clear': 'Clear', 'cl.anchor': 'Starting from',
      'cl.count': 'Occurrences', 'cl.n5': '5', 'cl.n10': '10', 'cl.n20': '20',
      'cl.field': 'Field', 'cl.spec': 'Written', 'cl.valueCount': 'Values', 'cl.values': 'Resolved values',
      'cl.all': 'every value', 'cl.ok': 'Five fields parsed: {e}',
      'cl.errTitle': 'Cannot read this expression', 'cl.wait': 'Type a five-field expression, or press a preset.',
      'cl.none': 'No occurrence in the search window of about {n} years — this expression never fires.',
      'cl.impossible': 'Day {d} of month {m} does not exist in any year, so this schedule can never fire.',
      'cl.orSemantics': 'Day-of-month and day-of-week are both restricted: POSIX fires when either one matches, not when both do.',
      'cl.local': 'Local wall clock', 'cl.utc': 'UTC', 'cl.relative': 'Relative', 'cl.day': 'Day',
      'cl.dst': 'This wall clock does not exist in your timezone on that date; the browser resolved it as {adj}.',
      'cl.copyRuns': 'Copy list', 'cl.dlRuns': 'Download .txt', 'cl.copied': 'Copied', 'cl.copyFail': 'Copy failed',
      'cl.downloaded': 'File downloaded', 'cl.needRuns': 'Fix the expression first.',
      'cl.in': 'in {d}', 'cl.ago': '{d} ago', 'cl.now': 'right now',
      'cl.inWords': 'In words',
      'cl.privacy': 'The expression and the dates are read by this page alone, over the text you typed and the clock of your machine. Nothing is fetched, uploaded or written to IndexedDB; the expression and the start date are never persisted, and the only remembered setting is how many occurrences to list.'
    },
    pt: {
      'cl.expr': 'Expressão crontab', 'cl.exprPh': 'minuto hora dia-do-mês mês dia-da-semana',
      'cl.explain': 'Leitura', 'cl.runs': 'Próximas ocorrências', 'cl.presets': 'Exemplos prontos',
      'cl.sample': 'Usar exemplo', 'cl.clear': 'Limpar', 'cl.anchor': 'A partir de',
      'cl.count': 'Ocorrências', 'cl.n5': '5', 'cl.n10': '10', 'cl.n20': '20',
      'cl.field': 'Campo', 'cl.spec': 'Escrito', 'cl.valueCount': 'Valores', 'cl.values': 'Valores resolvidos',
      'cl.all': 'todo valor', 'cl.ok': 'Cinco campos lidos: {e}',
      'cl.errTitle': 'Não dá para ler esta expressão', 'cl.wait': 'Digite uma expressão de cinco campos ou toque num exemplo pronto.',
      'cl.none': 'Nenhuma ocorrência na janela de busca de cerca de {n} anos — esta expressão nunca dispara.',
      'cl.impossible': 'O dia {d} do mês {m} não existe em nenhum ano, então esta agenda nunca pode disparar.',
      'cl.orSemantics': 'Dia do mês e dia da semana estão ambos restritos: no POSIX dispara quando qualquer um deles bate, não quando os dois batem.',
      'cl.local': 'Relógio local', 'cl.utc': 'UTC', 'cl.relative': 'Relativo', 'cl.day': 'Dia',
      'cl.dst': 'Este horário não existe no seu fuso naquela data; o navegador resolveu como {adj}.',
      'cl.copyRuns': 'Copiar lista', 'cl.dlRuns': 'Baixar .txt', 'cl.copied': 'Copiado', 'cl.copyFail': 'Falha ao copiar',
      'cl.downloaded': 'Arquivo baixado', 'cl.needRuns': 'Corrija a expressão primeiro.',
      'cl.in': 'em {d}', 'cl.ago': 'há {d}', 'cl.now': 'agora mesmo',
      'cl.inWords': 'Em palavras',
      'cl.privacy': 'A expressão e as datas são lidas só por esta página, sobre o texto que você digitou e o relógio da sua máquina. Nada é buscado, enviado ou gravado no IndexedDB; a expressão e a data inicial não são persistidas, e o único ajuste lembrado é quantas ocorrências listar.'
    }
  });

  const def = {
    id: 'cron-lens', cat: 'developer', icon: 'clock', version: '1.0.0',
    name: { en: 'Cron Lens', pt: 'Lente de Cron' },
    tagline: {
      en: 'Read a crontab expression the way cron does: every field expanded to the values it really selects, the POSIX day-of-month or day-of-week rule applied, and the next occurrences listed in local wall clock and UTC.',
      pt: 'Leia uma expressão crontab como o cron faz: cada campo expandido nos valores que realmente escolhe, a regra POSIX de dia do mês ou da semana aplicada e as próximas ocorrências em relógio local e UTC.'
    },
    tags: ['cron', 'crontab', 'schedule', 'posix', 'timer', 'date', 'utc', 'devops'],
    deps: [],
    docs: {
      en: {
        summary: 'A five-field POSIX crontab reader. Each field is expanded to the concrete set of values it selects — `*/15` in minutes becomes 0, 15, 30, 45 and `MON-FRI` in day-of-week becomes 1 through 5 — and the expression is then scheduled by a pure core that walks candidate days and hours instead of guessing. Day of week comes from Sakamoto\u2019s calendar formula inside that core, so the whole computation is reproducible in Node and independent of the machine timezone; the browser only turns the resulting wall-clock structs into instants. Occurrences are listed at or after the anchor you choose (the clock on your machine by default) in local time and UTC, with the weekday, the distance from now, and a mark on any row whose wall clock falls into a daylight-saving gap.',
        usage: [
          'Type a five-field expression such as `30 4 1,15 * *`, or press a preset chip; typing is debounced 160 ms.',
          'Read the field table: what was written, how many values it resolves to, and the values themselves, truncated after the first twelve.',
          'Read the sentence under In words. It names the POSIX rule it applied, so a restricted day-of-month next to a restricted day-of-week says plainly that either one fires.',
          'Set Starting from and pick 5, 10 or 20 occurrences. Each row shows the weekday, the local wall clock, the same instant in UTC and how far off it is.',
          'A row with a warning mark is a wall clock that does not exist in your timezone on that date; cron on that machine would not fire at the time you wrote.',
          'Copy the list or download it as plain text for a runbook. Clear drops the expression and both panels.'
        ],
        privacy: 'Parsing and scheduling happen in this page, over the text you typed and the clock of your machine. No fetch, no worker, no upload, no IndexedDB. The expression and the anchor date are never written to storage — only the number of occurrences you asked for survives a reload, under `localStorage` key `vistanology:cron-lens`.',
        limits: [
          'Five fields only. A leading seconds field (Quartz and some 6-field crontabs) is refused rather than silently dropped, and Quartz\u2019s `?`, its year field and the `L`, `W`, `#` day modifiers are reported as unknown values.',
          'Ranges do not wrap. `FRI-SUN` is refused because Friday is 5 and Sunday is 0 or 7; write `FRI,SAT,SUN` or `5-7`. This follows the published POSIX rule, not every cron implementation.',
          'Day-of-month and day-of-week combine as OR when both are restricted and AND when only one is — that is how cron behaves, and it surprises people often enough that the page prints which rule it used.',
          'Occurrences are wall-clock structs first and instants second. In a timezone with daylight saving, the time you wrote either does not exist once a year or happens twice; the table marks the row instead of pretending the schedule is exact. Cron on that machine follows its own timezone database, not this page.',
          'A schedule that never matches — `0 0 31 2 *` — is answered after a bounded search of about twelve years. That bound is what makes a February-29th schedule reachable in one frame; anything rarer is answered with "never fires" rather than a guess.'
        ]
      },
      pt: {
        summary: 'Um leitor de crontab POSIX de cinco campos. Cada campo é expandido no conjunto concreto de valores que escolhe — `*/15` em minutos vira 0, 15, 30, 45 e `SEG-SEX` em dia da semana vira 1 a 5 — e a expressão é agendada por um núcleo puro que percorre dias e horas candidatos em vez de adivinhar. O dia da semana vem da fórmula de calendário de Sakamoto dentro desse núcleo, então todo o cálculo é reproduzível em Node e independente do fuso da máquina; o navegador só converte as estruturas de relógio obtidas em instantes. As ocorrências são listadas a partir do marco escolhido (o relógio da sua máquina, por padrão), em hora local e UTC, com o dia da semana, a distância de agora e uma marca em toda linha cujo horário caia num buraco de horário de verão.',
        usage: [
          'Digite uma expressão de cinco campos como `30 4 1,15 * *`, ou toque num exemplo pronto; a digitação é debounced em 160 ms.',
          'Leia a tabela de campos: o que foi escrito, quantos valores resultam e os próprios valores, truncados depois da décima segunda.',
          'Leia a frase em Em palavras. Ela nomeia a regra POSIX aplicada, então um dia do mês restrito ao lado de um dia da semana restrito diz claramente que qualquer um dos dois dispara.',
          'Defina A partir de e escolha 5, 10 ou 20 ocorrências. Cada linha mostra o dia da semana, o relógio local, o mesmo instante em UTC e o quanto falta.',
          'Uma linha com marca de aviso é um relógio que não existe no seu fuso naquela data; o cron daquela máquina não dispararia no horário escrito.',
          'Copie a lista ou baixe como texto simples para um runbook. Limpar remove a expressão e os dois painéis.'
        ],
        privacy: 'A leitura e o agendamento acontecem nesta página, sobre o texto que você digitou e o relógio da sua máquina. Nada é buscado, enviado ou gravado no IndexedDB. A expressão e a data inicial nunca vão para o armazenamento — só a quantidade de ocorrências pedida sobrevive a um reload, na chave `localStorage` `vistanology:cron-lens`.',
        limits: [
          'Só cinco campos. Um campo de segundos à esquerda (Quartz e alguns crontabs de 6 campos) é recusado em vez de descartado em silêncio, e o `?` do Quartz, seu campo de ano e os modificadores `L`, `W`, `#` aparecem como valores desconhecidos.',
          'Intervalos não dão a volta. `SEX-DOM` é recusado porque sexta é 5 e domingo é 0 ou 7; escreva `SEX,SAB,DOM` ou `5-7`. Isto segue a regra POSIX publicada, não todas as implementações de cron.',
          'Dia do mês e dia da semana se combinam como OU quando ambos estão restritos e como E quando só um está — é assim que o cron se comporta, e isso surpreende o bastante para a página imprimir qual regra usou.',
          'As ocorrências são estruturas de relógio antes e instantes depois. Num fuso com horário de verão, o horário escrito ou não existe uma vez por ano ou acontece duas vezes; a tabela marca a linha em vez de fingir que a agenda é exata. O cron da máquina segue a base de fusos dele, não esta página.',
          'Uma agenda que nunca casa — `0 0 31 2 *` — é respondida depois de uma busca limitada a cerca de doze anos. Esse limite é o que torna alcançável uma agenda de 29 de fevereiro; algo mais raro recebe "nunca dispara" em vez de um palpite.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'cron-lens';
  const PRESETS = ['0 9 * * 1-5', '*/15 9-17 * * 1-5', '30 4 1,15 * *', '0 0 * * 0', '15 10 * * SAT', '0 0 29 2 *'];
  const SAMPLE = '0 9 * * 1-5';
  // About twelve years of candidate days: the bound that makes a February-29 schedule
  // reachable inside one frame, and still answers the never-matching ones.
  const DAY_LIMIT = 4400;

  let state = { count: 10 };
  let refs = {};
  let parsed = null;
  let runs = [];
  let alive = true;

  /* ---------- pure core, sliced by _dev/probe-cron.js ---------- */
  // The label tables are indexed by the value they name, so a month keeps a placeholder
  // at 0 (there is no month 0) while day-of-week starts at SUN = 0.
  const MONTH_NAMES = ['', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const DOW_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const FIELDS = [
    { key: 'minute', min: 0, max: 59, names: null },
    { key: 'hour', min: 0, max: 23, names: null },
    { key: 'dom', min: 1, max: 31, names: null },
    { key: 'month', min: 1, max: 12, names: MONTH_NAMES },
    { key: 'dow', min: 0, max: 6, names: DOW_NAMES, altMax: 7 }
  ];
  const MONTH_LENGTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysInMonth(y, m) { return m === 2 && isLeap(y) ? 29 : MONTH_LENGTH[m - 1]; }
  function pad(n) { return String(n).padStart(2, '0'); }

  // Sakamoto's method: 0 = Sunday, 1 = Monday. No Date objects, so it is portable to Node.
  function dowFromYMD(y, m, d) {
    const t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    let yy = y;
    if (m < 3) yy -= 1;
    return (yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) + t[m - 1] + d) % 7;
  }

  function allValues(field) {
    const v = [];
    for (let i = field.min; i <= field.max; i++) v.push(i);
    return v;
  }

  function normalize(value, field) {
    return field.key === 'dow' && value === 7 ? 0 : value;
  }

  function parseValue(text, field) {
    const s = String(text).trim();
    if (field.names) {
      const up = s.toUpperCase().slice(0, 3);
      // The tables are indexed by value, so the index is the answer; the empty slot at
      // month 0 must not match the empty string.
      if (up.length === 3) {
        const idx = field.names.findIndex((n) => n && n.slice(0, 3) === up);
        if (idx !== -1) return idx;
      }
    }
    if (!/^\d+$/.test(s)) return null;
    return Number(s);
  }

  function termValues(term, field) {
    const token = String(term).trim();
    if (!token) return { error: 'empty' };
    let body = token, step = 1, hasStep = false;
    const slash = token.indexOf('/');
    if (slash !== -1) {
      body = token.slice(0, slash);
      const raw = token.slice(slash + 1);
      if (!/^\d+$/.test(raw) || Number(raw) < 1) return { error: 'step' };
      step = Number(raw);
      hasStep = true;
    }
    const top = field.altMax || field.max;
    let lo, hi;
    if (body === '*') {
      if (!hasStep) return { star: true };
      lo = field.min; hi = field.max;
    } else {
      const dash = body.indexOf('-');
      if (dash === -1) {
        const single = parseValue(body, field);
        if (single === null) return { error: 'value' };
        lo = single;
        // POSIX: "a/n" steps from a up to the field's maximum.
        hi = hasStep ? field.max : single;
      } else {
        const a = parseValue(body.slice(0, dash), field);
        const b = parseValue(body.slice(dash + 1), field);
        if (a === null || b === null) return { error: 'value' };
        lo = a; hi = b;
      }
    }
    if (lo < field.min || lo > top || hi < field.min || hi > top) return { error: 'range' };
    if (hi < lo) return { error: 'reversed' };
    const set = new Set();
    for (let v = lo; v <= hi; v += step) set.add(normalize(v, field));
    const values = Array.from(set).sort((a, b) => a - b);
    if (!values.length) return { error: 'range' };
    return { values };
  }

  function expandField(spec, field) {
    const parts = String(spec).split(',');
    const got = new Set();
    let star = false;
    for (const part of parts) {
      const r = termValues(part, field);
      if (r.error) return { error: r.error, values: [], star: false };
      if (r.star) { star = true; continue; }
      r.values.forEach((v) => got.add(v));
    }
    if (star && got.size === 0) return { values: null, star: true, error: null };
    if (star) return { values: [], star: true, error: 'mixed-star' };
    return { values: Array.from(got).sort((a, b) => a - b), star: false, error: null };
  }

  // Does day d ever exist in month m, in some year?
  function dayEverExists(d, m) { return d <= (m === 2 ? 29 : MONTH_LENGTH[m - 1]); }

  function impossibleDay(parsed) {
    // Only when the day of week is unrestricted: with both restricted, POSIX fires on
    // the OR rule, so the weekdays still carry the schedule.
    if (!parsed.dowStar) return null;
    const days = parsed.fields.dom.star ? allValues(FIELDS[2]) : parsed.fields.dom.values;
    const months = parsed.fields.month.star ? allValues(FIELDS[3]) : parsed.fields.month.values;
    let all = true;
    for (const m of months) {
      let anyOk = false;
      for (const d of days) if (dayEverExists(d, m)) anyOk = true;
      if (anyOk) all = false;
    }
    if (!all) return null;
    for (const m of months) for (const d of days) if (!dayEverExists(d, m)) return { d, m };
    return null;
  }

  function parseCron(expr) {
    const text = String(expr || '').trim();
    if (!text) return { ok: false, error: 'empty' };
    const parts = text.split(/\s+/);
    if (parts.length === 6) return { ok: false, error: 'six-fields' };
    if (parts.length !== 5) return { ok: false, error: 'field-count', got: parts.length };
    const out = {};
    for (let i = 0; i < FIELDS.length; i++) {
      const f = FIELDS[i];
      const r = expandField(parts[i], f);
      if (r.error) return { ok: false, error: r.error, field: f.key, spec: parts[i] };
      out[f.key] = { values: r.values, star: r.star, spec: parts[i] };
    }
    const parsed = { ok: true, fields: out, domStar: out.dom.star, dowStar: out.dow.star, text: parts.join(' ') };
    parsed.impossible = impossibleDay(parsed);
    return parsed;
  }

  function dayMatches(parsed, y, m, d) {
    const domOk = valueOf(parsed.fields.dom, FIELDS[2]).indexOf(d) !== -1 && d <= daysInMonth(y, m);
    const dowOk = valueOf(parsed.fields.dow, FIELDS[4]).indexOf(dowFromYMD(y, m, d)) !== -1;
    if (parsed.domStar && parsed.dowStar) return true;
    if (parsed.domStar) return dowOk;
    if (parsed.dowStar) return domOk;
    return domOk || dowOk;
  }

  function valueOf(info, field) { return info.star ? allValues(field) : info.values; }

  // Wall-clock structs only: same answer in Node and in the browser. The caller turns
  // each struct into an instant, and that is where a timezone can move it.
  function nextRuns(parsed, from, count, dayLimit) {
    if (!parsed || !parsed.ok) return [];
    const limit = dayLimit || DAY_LIMIT;
    const months = valueOf(parsed.fields.month, FIELDS[3]);
    const hours = valueOf(parsed.fields.hour, FIELDS[1]);
    const minutes = valueOf(parsed.fields.minute, FIELDS[0]);
    const res = [];
    let { y, m, d } = from;
    for (let i = 0; i < limit && res.length < count; i++) {
      if (months.indexOf(m) !== -1 && dayMatches(parsed, y, m, d)) {
        const isAnchorDay = y === from.y && m === from.m && d === from.d;
        for (const h of hours) {
          if (res.length >= count) break;
          if (isAnchorDay && h < from.h) continue;
          for (const mi of minutes) {
            if (isAnchorDay && h === from.h && mi < from.mi) continue;
            res.push({ y, m, d, h, mi, dow: dowFromYMD(y, m, d) });
            if (res.length >= count) break;
          }
        }
      }
      d++;
      if (d > daysInMonth(y, m)) { d = 1; m++; if (m > 12) { m = 1; y++; } }
    }
    return res;
  }

  // The field table echoes the crontab tokens (language-neutral on purpose), but the
  // sentence is prose, so it names the days and months in the reader's language.
  const NAMES = {
    en: {
      everyMinute: 'every minute', everyMinuteOf: 'every minute', ofEveryHour: 'of every hour',
      at: 'at', minute: 'at minute', minutes: 'at minutes',
      ofHour: 'of hour', ofHours: 'of hours', onDay: 'on day(s)', onDow: 'on weekday(s)',
      everyDay: 'every day', inMonth: 'in', and: 'and', or: 'OR',
      labels: { dow: DOW_NAMES, month: MONTH_NAMES }
    },
    pt: {
      everyMinute: 'a cada minuto', everyMinuteOf: 'a cada minuto', ofEveryHour: 'de todas as horas',
      at: 'às', minute: 'no minuto', minutes: 'nos minutos',
      ofHour: 'da hora', ofHours: 'das horas', onDay: 'no(s) dia(s)', onDow: 'no(s) dia(s) da semana',
      everyDay: 'todos os dias', inMonth: 'de', and: 'e', or: 'OU',
      labels: {
        dow: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
        month: ['', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
          'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
      }
    }
  };

  // `labels` is an array indexed by value (the crontab token tables are), or null for a
  // numeric field.
  function listText(values, labels, cap) {
    const max = cap || 12;
    const shown = values.slice(0, max).map((v) => (labels ? labels[v] : String(v))).join(', ');
    return values.length > max ? shown + ' …' : shown;
  }

  function describe(parsed, names) {
    if (!parsed || !parsed.ok) return '';
    const f = parsed.fields;
    const L = names.labels || {};
    const mins = valueOf(f.minute, FIELDS[0]);
    const hrs = valueOf(f.hour, FIELDS[1]);
    const hourClause = f.hour.star ? names.ofEveryHour
      : (hrs.length === 1 ? names.ofHour : names.ofHours) + ' ' + listText(hrs, null);
    let time;
    if (f.minute.star && f.hour.star) time = names.everyMinute;
    else if (f.minute.star) time = names.everyMinuteOf + ' ' + names.ofHours + ' ' + listText(hrs, null);
    else if (mins.length === 1 && hrs.length === 1) time = names.at + ' ' + pad(hrs[0]) + ':' + pad(mins[0]);
    else if (mins.length === 1) time = names.minute + ' ' + mins[0] + ' ' + hourClause;
    else time = names.minutes + ' ' + listText(mins, null) + ' ' + hourClause;
    const bits = [];
    if (!f.dom.star) bits.push(names.onDay + ' ' + listText(valueOf(f.dom, FIELDS[2]), null));
    if (!f.dow.star) bits.push(names.onDow + ' ' + listText(valueOf(f.dow, FIELDS[4]), L.dow));
    // Both restricted means the OR rule, so the sentence joins with "or"; joining with
    // "and" would describe a schedule cron does not run.
    const day = bits.length > 1 ? bits.join(' ' + names.or + ' ') : bits.length ? bits[0] : names.everyDay;
    const month = f.month.star ? '' : ' ' + names.inMonth + ' ' + listText(valueOf(f.month, FIELDS[3]), L.month);
    return time + ' ' + day + month;
  }
  /* ---------- end pure core ---------- */

  const ERRORS = {
    empty: 'cl.wait', 'field-count': 'cl.errFields', 'six-fields': 'cl.errSix', value: 'cl.errValue',
    range: 'cl.errRange', reversed: 'cl.errReversed', step: 'cl.errStep', 'mixed-star': 'cl.errMixedStar'
  };
  VT.i18n.add({
    en: {
      'cl.errFields': 'Expected 5 fields, found {n}.',
      'cl.errSix': 'Six fields look like a crontab with seconds; this reader is the POSIX five-field one.',
      'cl.errValue': 'Unknown value in the {f} field: "{s}".',
      'cl.errRange': 'A value in the {f} field is outside the range it allows.',
      'cl.errReversed': 'The {f} field has a range that runs backwards: "{s}". Ranges do not wrap.',
      'cl.errStep': 'The step after / in the {f} field is not a whole number from 1 up.',
      'cl.errMixedStar': 'The {f} field mixes * with other terms; use one or the other.',
      'cl.f.minute': 'minute', 'cl.f.hour': 'hour', 'cl.f.dom': 'day-of-month', 'cl.f.month': 'month', 'cl.f.dow': 'day-of-week'
    },
    pt: {
      'cl.errFields': 'Esperados 5 campos, encontrados {n}.',
      'cl.errSix': 'Seis campos parecem um crontab com segundos; este leitor é o POSIX de cinco campos.',
      'cl.errValue': 'Valor desconhecido no campo {f}: "{s}".',
      'cl.errRange': 'Um valor do campo {f} está fora do intervalo que ele permite.',
      'cl.errReversed': 'O campo {f} tem um intervalo que volta: "{s}". Intervalos não dão a volta.',
      'cl.errStep': 'O passo depois de / no campo {f} não é um inteiro a partir de 1.',
      'cl.errMixedStar': 'O campo {f} mistura * com outros termos; use uma coisa ou outra.',
      'cl.f.minute': 'minuto', 'cl.f.hour': 'hora', 'cl.f.dom': 'dia do mês', 'cl.f.month': 'mês', 'cl.f.dow': 'dia da semana'
    }
  });

  function mount(root) {
    alive = true;
    restore();
    root.innerHTML = `
      <div class="cl-work">
        <section class="step glass">
          <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('cl.expr')}</h3></div>
          <div class="field"><label for="cl-expr">${t('cl.expr')}</label>
            <input class="input mono" id="cl-expr" type="text" spellcheck="false" autocomplete="off"
              placeholder="${t('cl.exprPh')}" aria-describedby="cl-status"></div>
          <div class="cl-presets" role="group" aria-label="${t('cl.presets')}">
            ${PRESETS.map((p) => '<button type="button" class="chip chip-sm mono" data-preset="' + esc(p) + '">' + esc(p) + '</button>').join('')}
          </div>
          <div class="bench-row">
            <button class="btn btn-ghost btn-sm" id="cl-sample">${I.sparkle} ${t('cl.sample')}</button>
            <button class="btn btn-ghost btn-sm" id="cl-clear">${I.x} ${t('cl.clear')}</button>
          </div>
          <p class="cl-status" id="cl-status" role="status" aria-live="polite"></p>
        </section>

        <section class="step glass" id="cl-reading-step" hidden>
          <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('cl.explain')}</h3></div>
          <div class="field"><label for="cl-desc">${t('cl.inWords')}</label>
            <p class="cl-inwords" id="cl-desc"></p></div>
          <p class="bench-hint" id="cl-semantics" hidden></p>
          <table class="cl-table cl-fields-table">
            <thead><tr><th scope="col">${t('cl.field')}</th><th scope="col">${t('cl.spec')}</th>
              <th scope="col">${t('cl.valueCount')}</th><th scope="col">${t('cl.values')}</th></tr></thead>
            <tbody id="cl-fields"></tbody>
          </table>
        </section>

        <section class="step glass" id="cl-runs-step" hidden>
          <div class="step-head"><span class="step-num">03</span><h3 class="step-title">${t('cl.runs')}</h3></div>
          <div class="field-row">
            <div class="field"><label for="cl-anchor">${t('cl.anchor')}</label>
              <input class="input" id="cl-anchor" type="datetime-local" step="60"></div>
            <div class="field"><label for="cl-count">${t('cl.count')}</label>
              <select class="input" id="cl-count">
                <option value="5">${t('cl.n5')}</option><option value="10">${t('cl.n10')}</option><option value="20">${t('cl.n20')}</option>
              </select></div>
          </div>
          <table class="cl-table cl-runs-table">
            <thead><tr><th scope="col">#</th><th scope="col">${t('cl.day')}</th><th scope="col">${t('cl.local')}</th>
              <th scope="col">${t('cl.utc')}</th><th scope="col">${t('cl.relative')}</th></tr></thead>
            <tbody id="cl-runs"></tbody>
          </table>
          <div class="export-row">
            <button class="btn btn-ghost btn-sm" id="cl-copy" disabled>${I.copy} ${t('cl.copyRuns')}</button>
            <button class="btn btn-ghost btn-sm" id="cl-dl" disabled>${I.download} ${t('cl.dlRuns')}</button>
          </div>
        </section>

        <p class="privacy-line">${I.shield} ${t('cl.privacy')}</p>
      </div>`;

    refs = {
      expr: $('#cl-expr', root), status: $('#cl-status', root),
      reading: $('#cl-reading-step', root), fields: $('#cl-fields', root), desc: $('#cl-desc', root),
      semantics: $('#cl-semantics', root), runsStep: $('#cl-runs-step', root), runs: $('#cl-runs', root),
      anchor: $('#cl-anchor', root), count: $('#cl-count', root), copy: $('#cl-copy', root), dl: $('#cl-dl', root)
    };
    refs.count.value = String(state.count);
    refs.anchor.value = localInputValue(new Date());

    $('#cl-sample', root).addEventListener('click', () => setExpr(SAMPLE));
    $('#cl-clear', root).addEventListener('click', () => { setExpr(''); refs.expr.focus(); });
    U.$$('.cl-presets .chip', root).forEach((b) => b.addEventListener('click', () => setExpr(b.dataset.preset)));
    refs.expr.addEventListener('input', U.debounce(() => parseAndRender(), 160));
    refs.anchor.addEventListener('change', () => computeRuns());
    refs.count.addEventListener('change', () => {
      state.count = U.clamp(Number(refs.count.value) || 10, 1, 50);
      persist();
      computeRuns();
    });
    refs.copy.addEventListener('click', copyRuns);
    refs.dl.addEventListener('click', downloadRuns);
    parseAndRender();
  }

  function unmount() {
    alive = false;
    parsed = null; runs = []; refs = {};
  }

  function setExpr(text) {
    refs.expr.value = text;
    parseAndRender();
  }

  function parseAndRender() {
    parsed = parseCron(refs.expr.value);
    render();
  }

  function render() {
    if (!alive || !refs.expr) return;
    if (!parsed.ok) {
      runs = [];
      refs.reading.hidden = true;
      refs.runsStep.hidden = true;
      const err = parsed.error || 'empty';
      const bad = err !== 'empty';
      const msg = t(ERRORS[err] || 'cl.errValue', {
        n: parsed.got || 0, s: parsed.spec || '',
        f: err === 'empty' ? '' : t('cl.f.' + (parsed.field || 'minute'))
      });
      statusLine(bad ? t('cl.errTitle') + ' — ' + msg : msg, bad);
      setExportEnabled(false);
      return;
    }
    statusLine(t('cl.ok', { e: parsed.text }) + (parsed.impossible ? ' — ' +
      t('cl.impossible', { d: parsed.impossible.d, m: monthName(parsed.impossible.m) }) : ''), !!parsed.impossible);
    refs.reading.hidden = false;
    refs.desc.textContent = describe(parsed, NAMES[VT.i18n.lang]);
    refs.desc.classList.toggle('cl-warn', !!parsed.impossible);
    const both = !parsed.domStar && !parsed.dowStar;
    refs.semantics.hidden = !both;
    if (both) refs.semantics.textContent = t('cl.orSemantics');
    refs.fields.innerHTML = FIELDS.map((f) => {
      const info = parsed.fields[f.key];
      const vals = info.star ? null : info.values;
      const total = vals ? vals.length : f.max - f.min + 1;
      const shown = vals ? listText(vals, f.names, 12) : t('cl.all');
      return '<tr><th scope="row">' + t('cl.f.' + f.key) + '</th><td class="mono">' + esc(info.spec) +
        '</td><td class="mono">' + total + '</td><td class="mono">' + esc(shown) + '</td></tr>';
    }).join('');
    computeRuns();
  }

  function computeRuns() {
    if (!alive || !parsed || !parsed.ok || !refs.runs) return;
    const structs = nextRuns(parsed, anchorFromInput(), state.count, DAY_LIMIT);
    runs = structs.map((s, i) => {
      const date = new Date(s.y, s.m - 1, s.d, s.h, s.mi);
      const shifted = date.getHours() !== s.h || date.getMinutes() !== s.mi;
      return {
        i, struct: s, date, shifted,
        local: s.y + '-' + pad(s.m) + '-' + pad(s.d) + ' ' + pad(s.h) + ':' + pad(s.mi),
        utc: pad(date.getUTCFullYear()) + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate()) +
          ' ' + pad(date.getUTCHours()) + ':' + pad(date.getUTCMinutes()),
        adj: pad(date.getHours()) + ':' + pad(date.getMinutes())
      };
    });
    refs.runsStep.hidden = false;
    setExportEnabled(runs.length > 0);
    if (!runs.length) {
      refs.runs.innerHTML = '<tr><td colspan="5" class="cl-none">' +
        esc(t('cl.none', { n: Math.round(DAY_LIMIT / 365) })) + '</td></tr>';
      return;
    }
    refs.runs.innerHTML = runs.map((r) =>
      '<tr><td data-label="#" class="mono">' + (r.i + 1) + '</td>' +
      '<td data-label="' + esc(t('cl.day')) + '">' + dowLabel(r.struct.dow) + '</td>' +
      '<td data-label="' + esc(t('cl.local')) + '" class="mono">' + r.local + (r.shifted ? ' <span class="cl-dst" title="' +
        esc(t('cl.dst', { adj: r.adj })) + '">' + I.alert + '</span>' : '') + '</td>' +
      '<td data-label="' + esc(t('cl.utc')) + '" class="mono">' + r.utc + '</td>' +
      '<td data-label="' + esc(t('cl.relative')) + '">' + relative(r.date) + '</td></tr>').join('');
  }

  const DOW_PT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const DOW_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function dowLabel(i) { return (VT.i18n.lang === 'pt' ? DOW_PT : DOW_EN)[i]; }
  function monthName(m) { return VT.i18n.lang === 'pt' ? ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][m - 1] : MONTH_NAMES[m - 1]; }

  function relative(date) {
    const diff = date.getTime() - Date.now();
    const mins = Math.round(Math.abs(diff) / 60000);
    if (mins < 1) return t('cl.now');
    let text;
    if (mins < 60) text = mins + ' min';
    else if (mins < 1440) text = Math.floor(mins / 60) + ' h ' + (mins % 60) + ' min';
    else text = Math.floor(mins / 1440) + ' d ' + Math.floor((mins % 1440) / 60) + ' h';
    return diff > 0 ? t('cl.in', { d: text }) : t('cl.ago', { d: text });
  }

  function anchorFromInput() {
    const d = refs.anchor.value ? new Date(refs.anchor.value) : new Date();
    return isNaN(d.getTime()) ? structFrom(new Date()) : structFrom(d);
  }
  function structFrom(d) {
    return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate(), h: d.getHours(), mi: d.getMinutes() };
  }
  function localInputValue(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function statusLine(msg, bad) {
    refs.status.textContent = msg;
    refs.status.className = 'cl-status ' + (bad ? 'bad' : 'ok');
  }
  function setExportEnabled(on) { refs.copy.disabled = !on; refs.dl.disabled = !on; }

  function runListText() {
    return parsed.text + '\n' + runs.map((r) =>
      (r.i + 1) + '. ' + dowLabel(r.struct.dow) + '  local ' + r.local + '  utc ' + r.utc +
      (r.shifted ? '  (DST-adjusted to ' + r.adj + ')' : '')).join('\n') + '\n';
  }

  async function copyRuns() {
    if (!runs.length) { toast(t('cl.needRuns'), 'warn'); return; }
    const ok = await U.copyText(runListText());
    toast(ok ? t('cl.copied') : t('cl.copyFail'), ok ? 'ok' : 'bad');
  }

  function downloadRuns() {
    if (!runs.length) { toast(t('cl.needRuns'), 'warn'); return; }
    U.downloadText(runListText(), 'vistanology-cron-lens.txt', 'text/plain');
    toast(t('cl.downloaded'), 'ok');
  }

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    try {
      const s = VT.store.get(KEY);
      if (s && s.count) state.count = U.clamp(Number(s.count), 1, 50);
    } catch { /* the settings are a convenience */ }
  }

  VT.registry.add(def);
  return def;
})();
