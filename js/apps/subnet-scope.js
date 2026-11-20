window.VT = window.VT || {};
VT.modules = VT.modules || {};

/* Subnet Scope — an IPv4 block read the way a router reads it.
   Everything below the marker is integer arithmetic on 32-bit numbers: no Date, no fetch,
   no locale. _dev/probe-subnet.js slices that core out of this shipping file and checks it
   against hand-computed blocks, so the mask maths the page prints is the maths the probe
   proved.
*/
VT.modules['subnet-scope'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;
  const I = VT.icons;

  VT.i18n.add({
    en: {
      'ss.addr': 'Address and mask', 'ss.cidr': 'Address', 'ss.cidrPh': '192.168.0.0/22, or an address with a mask',
      'ss.mask': 'Subnet mask', 'ss.prefix': 'Prefix', 'ss.presets': 'Presets', 'ss.sample': 'Use sample', 'ss.clear': 'Clear',
      'ss.scope': 'What the block covers', 'ss.split': 'Split it into smaller blocks',
      'ss.in': 'Input', 'ss.role': 'Block role', 'ss.rfc': 'Defined by',
      'ss.network': 'Network address', 'ss.broadcast': 'Broadcast address', 'ss.wildcard': 'Wildcard mask',
      'ss.first': 'First usable', 'ss.last': 'Last usable', 'ss.total': 'Addresses in block',
      'ss.usable': 'Usable hosts', 'ss.interesting': 'Interesting octet', 'ss.step': 'Block size in that octet',
      'ss.reverse': 'Reverse lookup name', 'ss.zone': 'Delegated reverse zone', 'ss.hostRoute': 'host route',
      'ss.p2p': 'point-to-point', 'ss.public': 'public unicast', 'ss.publicRfc': 'IANA global table',
      'ss.target': 'Split into /', 'ss.count': 'Subnets produced', 'ss.showing': 'first {n} of {total}',
      'ss.col.net': 'Network', 'ss.col.mask': 'Mask', 'ss.col.first': 'First', 'ss.col.last': 'Last', 'ss.col.bcast': 'Broadcast',
      'ss.copy': 'Copy subnets', 'ss.dl': 'Download .csv', 'ss.copied': 'Copied', 'ss.copyFail': 'Copy failed',
      'ss.downloaded': 'File downloaded', 'ss.needInput': 'Type an address first.',
      'ss.badOctets': 'An IPv4 address is four numbers separated by dots, not {n}.',
      'ss.badFormat': 'Only digits and dots belong in an IPv4 address.',
      'ss.badRange': 'Each octet goes from 0 to 255; {s} does not.',
      'ss.badLeading': 'Leading zeros are read differently by different stacks — write {s} plain.',
      'ss.badPrefix': 'The prefix runs from 0 to 32, not {n}.',
      'ss.badMask': '{s} is not a contiguous subnet mask.',
      'ss.badCidr': 'Expected address or address/prefix.',
      'ss.privacy': 'The address is read by this page alone, as four numbers, and never leaves it. Nothing is fetched, no registry is queried, and no address is stored: only the split size you picked survives a reload, under `vistanology:subnet-scope`.'
    },
    pt: {
      'ss.addr': 'Endereço e máscara', 'ss.cidr': 'Endereço', 'ss.cidrPh': '192.168.0.0/22, ou um endereço com máscara',
      'ss.mask': 'Máscara de rede', 'ss.prefix': 'Prefixo', 'ss.presets': 'Exemplos prontos', 'ss.sample': 'Usar exemplo', 'ss.clear': 'Limpar',
      'ss.scope': 'O que o bloco cobre', 'ss.split': 'Dividir em blocos menores',
      'ss.in': 'Entrada', 'ss.role': 'Papel do bloco', 'ss.rfc': 'Definido por',
      'ss.network': 'Endereço de rede', 'ss.broadcast': 'Endereço de broadcast', 'ss.wildcard': 'Máscara curinga',
      'ss.first': 'Primeiro utilizável', 'ss.last': 'Último utilizável', 'ss.total': 'Endereços no bloco',
      'ss.usable': 'Hosts utilizáveis', 'ss.interesting': 'Octeto interessante', 'ss.step': 'Tamanho do bloco nesse octeto',
      'ss.reverse': 'Nome de busca reversa', 'ss.zone': 'Zona reversa delegada', 'ss.hostRoute': 'rota de host',
      'ss.p2p': 'ponto a ponto', 'ss.public': 'unicast público', 'ss.publicRfc': 'tabela global da IANA',
      'ss.target': 'Dividir em /', 'ss.count': 'Sub-redes produzidas', 'ss.showing': 'as {n} primeiras de {total}',
      'ss.col.net': 'Rede', 'ss.col.mask': 'Máscara', 'ss.col.first': 'Primeiro', 'ss.col.last': 'Último', 'ss.col.bcast': 'Broadcast',
      'ss.copy': 'Copiar sub-redes', 'ss.dl': 'Baixar .csv', 'ss.copied': 'Copiado', 'ss.copyFail': 'Falha ao copiar',
      'ss.downloaded': 'Arquivo baixado', 'ss.needInput': 'Digite um endereço primeiro.',
      'ss.badOctets': 'Um endereço IPv4 são quatro números separados por pontos, não {n}.',
      'ss.badFormat': 'Só dígitos e pontos pertencem a um endereço IPv4.',
      'ss.badRange': 'Cada octeto vai de 0 a 255; {s} não.',
      'ss.badLeading': 'Zeros à esquerda são lidos de modos diferentes — escreva {s} sem eles.',
      'ss.badPrefix': 'O prefixo vai de 0 a 32, não {n}.',
      'ss.badMask': '{s} não é uma máscara de rede contígua.',
      'ss.badCidr': 'Esperava endereço ou endereço/prefixo.',
      'ss.privacy': 'O endereço é lido só por esta página, como quatro números, e não sai dela. Nada é buscado, nenhum registro é consultado e nenhum endereço é gravado: só o tamanho de divisão escolhido sobrevive a um reload, em `vistanology:subnet-scope`.'
    }
  });

  const def = {
    id: 'subnet-scope', cat: 'developer', icon: 'globe', version: '1.0.0',
    name: { en: 'Subnet Scope', pt: 'Escopo de Sub-rede' },
    tagline: {
      en: 'Point at any IPv4 address and a mask and get the whole block back: network and broadcast, wildcard, first and last usable, exact counts, the IANA role of the range, the reverse-DNS names it implies, and a split into smaller subnets you can export.',
      pt: 'Aponte para um endereço IPv4 e uma máscara e receba o bloco inteiro: rede e broadcast, curinga, primeiro e último utilizáveis, contagens exatas, o papel do intervalo na IANA, os nomes reversos que ele implica e a divisão em sub-redes menores que você pode exportar.'
    },
    tags: ['ipv4', 'cidr', 'subnet', 'netmask', 'network', 'dhcp', 'arpa', 'routing'],
    deps: [],
    docs: {
      en: {
        summary: 'A calculator for IPv4 blocks, done in integers. An address is four octets packed into one 32-bit number, a mask is the top `p` bits set, and everything else follows from AND and OR: network, broadcast, wildcard, the usable span, and how many subnets a split produces. Host counts are exact rather than floating, because 2³² still fits in a double, and the two exceptions to the minus-two rule are printed instead of hidden — a /31 is a point-to-point link with two usable ends (RFC 3074) and a /32 is one host. The block is then matched against the IANA special-purpose registry, so `100.64.x.x` tells you it is shared address space rather than pretending to be private, and the reverse-DNS name and the delegated `in-addr.arpa` zone come out of the same numbers.',
        usage: [
          'Type an address, with or without a prefix, or paste `192.168.0.0/22` — a dotted mask after a space works too, and a bare address is read with its classful mask.',
          'Read the scope table: network, broadcast, wildcard, first and last usable, the exact count of addresses and of hosts, and the octet where the block actually steps.',
          'Look at the block role. It is matched against the IANA special-purpose registry by longest prefix, so a documentation range, a link-local address or a benchmarking range says which RFC reserves it.',
          'Use the reverse names: the `in-addr.arpa` form of the address you typed, and the classful zone a delegation of this block would sit in.',
          'Pick a target prefix to split the block: the count is `2^(target − current)`, and the table lists the subnets with their own first and last usable addresses.',
          'Copy or download the split as CSV for a DHCP scope or a routing note. Clear drops the address; the split size is the only thing remembered.'
        ],
        privacy: 'The address is parsed in this page into four numbers and read from a static table of reserved ranges. No fetch, no worker, no upload, no IndexedDB, and no address is ever written to storage. The only persisted value is the split size, under `localStorage` key `vistanology:subnet-scope`.',
        limits: [
          'IPv4 only, and no IPv6 translation. A `::ffff:` mapped address is not accepted, because pretending otherwise would be a bigger promise than a four-octet parser can keep.',
          'Leading zeros are refused rather than guessed. `010.0.0.1` is octal in some stacks and decimal in others, so the page asks you to write it plainly.',
          'Reserved ranges come from a table of the IANA special-purpose registry kept inside this file. It is accurate for the ranges it lists and silent about the rest; it is not a live query, so a recent assignment may be missing.',
          'Minus two is the rule, and the two exceptions are shown as they are: a /31 has no broadcast address in the RFC 3074 sense and a /32 is a single host. Anything that assumes every block has a usable middle will disagree with those rows.',
          'This is arithmetic, not a survey of your network. Nothing probes a host, and no claim here means an address is actually free, routed or reachable.'
        ]
      },
      pt: {
        summary: 'Uma calculadora de blocos IPv4 feita em inteiros. Um endereço são quatro octetos empacotados num número de 32 bits, uma máscara são os `p` bits de cima ligados, e todo o resto vem de AND e OR: rede, broadcast, curinga, a faixa utilizável e quantas sub-redes uma divisão produz. As contagens são exatas e não de ponto flutuante, porque 2³² ainda cabe num double, e as duas exceções da regra do menos dois são impressas em vez de escondidas — um /31 é um enlace ponto a ponto com duas pontas utilizáveis (RFC 3074) e um /32 é um único host. O bloco é comparado com o registro de usos especiais da IANA, então `100.64.x.x` diz que é espaço de endereço compartilhado em vez de fingir ser privado, e o nome reverso e a zona `in-addr.arpa` delegada saem dos mesmos números.',
        usage: [
          'Digite um endereço, com ou sem prefixo, ou cole `192.168.0.0/22` — uma máscara em pontos após um espaço também funciona, e um endereço sozinho é lido com sua máscara classful.',
          'Leia a tabela do escopo: rede, broadcast, curinga, primeiro e último utilizáveis, a contagem exata de endereços e de hosts, e o octeto onde o bloco realmente salta.',
          'Veja o papel do bloco. Ele é casado pelo prefixo mais longo no registro de usos especiais da IANA, então um intervalo de documentação, um link-local ou um de benchmark dizem qual RFC os reserva.',
          'Use os nomes reversos: a forma `in-addr.arpa` do endereço digitado e a zona classful onde uma delegação deste bloco ficaria.',
          'Escolha um prefixo de destino para dividir o bloco: a contagem é `2^(destino − atual)`, e a tabela lista as sub-redes com seus próprios primeiro e último utilizáveis.',
          'Copie ou baixe a divisão como CSV para um escopo de DHCP ou uma nota de roteamento. Limpar remove o endereço; o tamanho da divisão é o único valor lembrado.'
        ],
        privacy: 'O endereço é parseado nesta página em quatro números e lido numa tabela fixa de intervalos reservados. Nada é buscado, enviado ou gravado no IndexedDB, e nenhum endereço vai para o armazenamento. O único valor persistido é o tamanho da divisão, na chave `localStorage` `vistanology:subnet-scope`.',
        limits: [
          'Só IPv4, sem tradução de IPv6. Um endereço mapeado `::ffff:` não é aceito, porque prometer o contrário seria maior do que um parser de quatro octetos pode cumprir.',
          'Zeros à esquerda são recusados, não adivinhados. `010.0.0.1` é octal em umas pilhas e decimal em outras, então a página pede que você escreva sem eles.',
          'Os intervalos reservados vêm de uma tabela do registro de usos especiais da IANA mantida neste arquivo. Ela é exata para o que lista e silenciosa para o resto; não é consulta ao vivo, então uma designação recente pode faltar.',
          'Menos dois é a regra, e as duas exceções aparecem como são: um /31 não tem broadcast no sentido da RFC 3074 e um /32 é um único host. Quem assumir que todo bloco tem um meio utilizável vai discordar dessas linhas.',
          'Isto é aritmética, não uma varredura da sua rede. Nada sonda host algum, e nenhuma afirmação aqui significa que um endereço esteja livre, roteado ou acessível.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'subnet-scope';
  const SAMPLE = '192.168.0.0/22';
  const PRESETS = ['10.0.0.0/8', '192.168.1.0/24', '172.16.5.130/20', '100.64.1.1/10', '169.254.10.20/16', '198.51.100.0/24'];

  let state = { target: 24 };
  let refs = {};
  let el = null;
  let alive = false;
  let scope = null;

  /* ---------- pure core, sliced by _dev/probe-subnet.js ---------- */
  const OCTET_MAX = 255;
  // How many subnets the split table lists. The count it reports is never capped.
  const LIST_CAP = 32;

  function parseOctets(text) {
    const parts = String(text === undefined || text === null ? '' : text).trim().split('.');
    if (parts.length !== 4) return { error: 'octets', got: parts.length };
    if (parts.some((p) => !/^\d+$/.test(p))) return { error: 'format' };
    if (parts.some((p) => p.length > 1 && p[0] === '0')) return { error: 'leading', shown: parts.find((p) => p.length > 1 && p[0] === '0') };
    const octets = parts.map(Number);
    if (octets.some((n) => n > OCTET_MAX)) return { error: 'range', shown: octets.find((n) => n > OCTET_MAX) };
    return { octets, int: toInt(octets) };
  }
  function toInt(o) { return ((o[0] << 24) | (o[1] << 16) | (o[2] << 8) | o[3]) >>> 0; }
  function toOctets(n) { return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]; }
  function ipText(n) { return toOctets(n).join('.'); }
  function maskFromPrefix(p) { return p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0; }
  function prefixFromMask(n) {
    const x = n >>> 0;
    for (let p = 0; p <= 32; p++) if (maskFromPrefix(p) === x) return p;
    return -1;
  }

  // One address, one prefix, everything else derived with AND and OR.
  function scopeOf(ipInt, prefix) {
    const mask = maskFromPrefix(prefix);
    const wildcard = (~mask) >>> 0;
    const network = (ipInt & mask) >>> 0;
    const broadcast = (network | wildcard) >>> 0;
    const total = Math.pow(2, 32 - prefix);
    let usable, first, last, kind = null;
    if (prefix === 32) { usable = 1; first = network; last = network; kind = 'hostRoute'; }
    else if (prefix === 31) { usable = 2; first = network; last = broadcast; kind = 'p2p'; }
    else { usable = total - 2; first = (network + 1) >>> 0; last = (broadcast - 1) >>> 0; }
    // The "interesting octet" is the first one the mask does not fully cover: that is
    // where consecutive blocks of this size step.
    const maskOctets = toOctets(mask);
    const idx = maskOctets.findIndex((v) => v < 255);
    const interesting = idx === -1 ? null : { index: idx + 1, maskValue: maskOctets[idx], step: 256 - maskOctets[idx] };
    return {
      prefix, mask, wildcard, network, broadcast, first, last, total, usable, kind,
      wildcardOctets: toOctets(wildcard), interesting
    };
  }

  // IANA special-purpose IPv4 ranges, longest prefix wins. Static on purpose:
  // the page never asks a network what a number means.
  const RESERVED = [
    { cidr: '0.0.0.0/8', rfc: 'RFC 1122', key: 'thisNet' },
    { cidr: '10.0.0.0/8', rfc: 'RFC 1918', key: 'private' },
    { cidr: '100.64.0.0/10', rfc: 'RFC 6598', key: 'shared' },
    { cidr: '127.0.0.0/8', rfc: 'RFC 1122', key: 'loopback' },
    { cidr: '169.254.0.0/16', rfc: 'RFC 3927', key: 'linkLocal' },
    { cidr: '172.16.0.0/12', rfc: 'RFC 1918', key: 'private' },
    { cidr: '192.0.0.0/24', rfc: 'RFC 6890', key: 'ietfProto' },
    { cidr: '192.0.2.0/24', rfc: 'RFC 5737', key: 'doc' },
    { cidr: '192.88.99.0/32', rfc: 'RFC 7526', key: 'sixToFour' },
    { cidr: '192.168.0.0/16', rfc: 'RFC 1918', key: 'private' },
    { cidr: '198.18.0.0/15', rfc: 'RFC 2544', key: 'benchmark' },
    { cidr: '198.51.100.0/24', rfc: 'RFC 5737', key: 'doc' },
    { cidr: '203.0.113.0/24', rfc: 'RFC 5737', key: 'doc' },
    { cidr: '224.0.0.0/4', rfc: 'RFC 5771', key: 'multicast' },
    { cidr: '240.0.0.0/4', rfc: 'RFC 1112', key: 'future' },
    { cidr: '255.255.255.255/32', rfc: 'RFC 1122', key: 'bcast' }
  ];
  const RESERVED_MATCHES = RESERVED.map((r) => {
    const slash = r.cidr.indexOf('/');
    const parsed = parseOctets(r.cidr.slice(0, slash));
    const p = Number(r.cidr.slice(slash + 1));
    return { key: r.key, rfc: r.rfc, cidr: r.cidr, prefix: p, network: scopeOf(parsed.int, p).network, mask: maskFromPrefix(p) };
  });
  function classify(ipInt) {
    let best = null;
    for (const r of RESERVED_MATCHES) {
      if (((ipInt & r.mask) >>> 0) === r.network && (!best || r.prefix > best.prefix)) best = r;
    }
    return best || { key: 'public', rfc: 'IANA global', cidr: null, prefix: 0, network: 0, mask: 0 };
  }

  function splitInto(sc, target) {
    if (target <= sc.prefix || target > 32) return null;
    const count = Math.pow(2, target - sc.prefix);
    const step = Math.pow(2, 32 - target);
    const blocks = [];
    for (let i = 0; i < Math.min(count, LIST_CAP); i++) {
      blocks.push(scopeOf((sc.network + i * step) >>> 0, target));
    }
    return { count, blocks, shown: blocks.length };
  }
  // Smallest block whose usable hosts cover the request.
  function prefixForHosts(want) {
    if (!(want > 0)) return 31;
    return 32 - Math.ceil(Math.log(want + 2) / Math.LN2);
  }

  function reverseName(ipInt) { return toOctets(ipInt).reverse().join('.') + '.in-addr.arpa'; }
  function arpaZone(network, prefix) {
    const o = toOctets(network);
    if (prefix <= 8) return { level: 0, zone: 'in-addr.arpa' };
    if (prefix <= 16) return { level: 8, zone: o.slice(0, 1).reverse().join('.') + '.in-addr.arpa' };
    if (prefix <= 24) return { level: 16, zone: o.slice(0, 2).reverse().join('.') + '.in-addr.arpa' };
    return { level: 24, zone: o.slice(0, 3).reverse().join('.') + '.in-addr.arpa' };
  }

  // Accepts `a.b.c.d`, `a.b.c.d/nn` and `a.b.c.d a.b.c.d` (dotted mask).
  function parseInput(text) {
    const raw = String(text === undefined || text === null ? '' : text).trim();
    if (!raw) return { error: 'empty' };
    let ipPart = raw, prefix = null, maskText = null;
    const slash = raw.indexOf('/');
    if (slash !== -1) {
      ipPart = raw.slice(0, slash);
      const tail = raw.slice(slash + 1).trim();
      if (!/^\d{1,2}$/.test(tail)) return { error: 'cidr' };
      prefix = Number(tail);
    } else {
      const pieces = raw.split(/\s+/);
      if (pieces.length === 2) maskText = pieces[1];
      else if (pieces.length > 2) return { error: 'cidr' };
      ipPart = pieces[0];
    }
    const parsed = parseOctets(ipPart);
    if (parsed.error) return parsed;
    if (maskText !== null) {
      const m = parseOctets(maskText);
      if (m.error) return m.error === 'octets' ? { error: 'mask', shown: maskText } : m;
      const found = prefixFromMask(m.int);
      if (found < 0) return { error: 'mask', shown: maskText };
      prefix = found;
    }
    if (prefix === null) prefix = defaultPrefixFor(parsed.int);
    if (prefix > 32) return { error: 'prefix', got: prefix };
    return { ok: true, ip: parsed.int, prefix, scoped: scopeOf(parsed.int, prefix), text: ipText(parsed.int) + '/' + prefix };
  }
  // The classful mask of the address, used only when the reader gives a bare address.
  function defaultPrefixFor(ipInt) {
    const first = (ipInt >>> 24) & 255;
    if (first < 128) return 8;
    if (first < 192) return 16;
    return 24;
  }
  function groupBits(n) {
    return toOctets(n).map((o) => o.toString(2).padStart(8, '0')).join('.');
  }
  /* ---------- end pure core ---------- */

  const ROLE_NAMES = {
    thisNet: { en: 'this network on this host', pt: 'esta rede neste host' },
    private: { en: 'private (internal) use', pt: 'uso privado (interno)' },
    shared: { en: 'shared address space (CGNAT)', pt: 'espaço de endereço compartilhado (CGNAT)' },
    loopback: { en: 'loopback', pt: 'loopback' },
    linkLocal: { en: 'link-local', pt: 'link-local' },
    ietfProto: { en: 'IETF protocol assignments', pt: 'atribuições de protocolo IETF' },
    doc: { en: 'documentation range', pt: 'intervalo de documentação' },
    sixToFour: { en: '6to4 relay anycast (deprecated)', pt: 'anycast de relay 6to4 (obsoleto)' },
    benchmark: { en: 'network device benchmarking', pt: 'benchmark de equipamento de rede' },
    multicast: { en: 'multicast', pt: 'multicast' },
    future: { en: 'reserved for future use', pt: 'reservado para uso futuro' },
    bcast: { en: 'limited broadcast', pt: 'broadcast limitado' },
    public: { en: 'public unicast', pt: 'unicast público' }
  };
  const ERRORS = {
    empty: 'ss.cidrPh', octets: 'ss.badOctets', format: 'ss.badFormat', range: 'ss.badRange',
    leading: 'ss.badLeading', prefix: 'ss.badPrefix', mask: 'ss.badMask', cidr: 'ss.badCidr'
  };

  function mount(root) {
    alive = true;
    el = root;
    restore();
    root.innerHTML = `
      <div class="ss-work">
        <section class="step glass">
          <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('ss.addr')}</h3></div>
          <div class="field"><label for="ss-cidr">${t('ss.cidr')}</label>
            <input class="input mono" id="ss-cidr" type="text" spellcheck="false" autocomplete="off"
              placeholder="${t('ss.cidrPh')}" aria-describedby="ss-status"></div>
          <div class="field-row">
            <div class="field"><label for="ss-mask">${t('ss.mask')}</label>
              <input class="input mono" id="ss-mask" type="text" spellcheck="false" autocomplete="off" placeholder="255.255.252.0"></div>
            <div class="field"><label for="ss-prefix">${t('ss.prefix')}</label>
              <input class="input mono" id="ss-prefix" type="number" min="0" max="32" step="1"></div>
          </div>
          <div class="ss-presets" role="group" aria-label="${t('ss.presets')}">
            ${PRESETS.map((p) => '<button type="button" class="chip chip-sm mono ss-preset" data-preset="' + esc(p) + '">' + esc(p) + '</button>').join('')}
          </div>
          <div class="bench-row">
            <button class="btn btn-ghost btn-sm" id="ss-sample">${I.sparkle} ${t('ss.sample')}</button>
            <button class="btn btn-ghost btn-sm" id="ss-clear">${I.x} ${t('ss.clear')}</button>
          </div>
          <p class="ss-status" id="ss-status" role="status" aria-live="polite"></p>
        </section>

        <section class="step glass" id="ss-scope-step" hidden>
          <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('ss.scope')}</h3></div>
          <table class="ss-table ss-facts"><tbody id="ss-facts"></tbody></table>
          <p class="bench-hint ss-bits" id="ss-bits" hidden></p>
        </section>

        <section class="step glass" id="ss-split-step" hidden>
          <div class="step-head"><span class="step-num">03</span><h3 class="step-title">${t('ss.split')}</h3></div>
          <div class="field-row">
            <div class="field"><label for="ss-target">${t('ss.target')}</label>
              <select class="input mono" id="ss-target"></select></div>
            <div class="bench-hint" id="ss-split-count"></div>
          </div>
          <table class="ss-table ss-subnets">
            <thead><tr><th scope="col">#</th><th scope="col">${t('ss.col.net')}</th><th scope="col">${t('ss.col.mask')}</th>
              <th scope="col">${t('ss.col.first')}</th><th scope="col">${t('ss.col.last')}</th><th scope="col">${t('ss.col.bcast')}</th></tr></thead>
            <tbody id="ss-subnets"></tbody>
          </table>
          <div class="export-row">
            <button class="btn btn-ghost btn-sm" id="ss-copy" disabled>${I.copy} ${t('ss.copy')}</button>
            <button class="btn btn-ghost btn-sm" id="ss-dl" disabled>${I.download} ${t('ss.dl')}</button>
          </div>
        </section>

        <p class="privacy-line">${I.shield} ${t('ss.privacy')}</p>
      </div>`;

    refs = {
      cidr: $('#ss-cidr', root), mask: $('#ss-mask', root), prefix: $('#ss-prefix', root),
      status: $('#ss-status', root), scopeStep: $('#ss-scope-step', root), facts: $('#ss-facts', root),
      bits: $('#ss-bits', root), splitStep: $('#ss-split-step', root), target: $('#ss-target', root),
      splitCount: $('#ss-split-count', root), subnets: $('#ss-subnets', root),
      copy: $('#ss-copy', root), dl: $('#ss-dl', root)
    };

    // Text is captured when the event fires, not when the debounce runs: a blur can
    // otherwise land between the two and have the bench re-echo over what was typed.
    const onCidrInput = U.debounce((value) => parseAndRender(value), 160);
    const onPrefixInput = U.debounce(applyPrefix, 160);
    const onMaskInput = U.debounce(applyMask, 160);
    refs.cidr.addEventListener('input', (e) => onCidrInput(e.target.value));
    refs.prefix.addEventListener('input', (e) => onPrefixInput(e.target.value));
    refs.mask.addEventListener('input', (e) => onMaskInput(e.target.value));
    // Blur re-echoes the three fields from the address line; only the address line itself
    // is ever parsed, so a mask or prefix blur cannot be mistaken for a new address.
    const reEcho = () => { if (alive && refs.cidr && refs.cidr.isConnected) parseAndRender(refs.cidr.value, true); };
    refs.cidr.addEventListener('change', reEcho);
    refs.prefix.addEventListener('change', reEcho);
    refs.mask.addEventListener('change', reEcho);
    $('#ss-sample', root).addEventListener('click', () => { refs.cidr.value = SAMPLE; parseAndRender(SAMPLE, true); refs.cidr.focus(); });
    $('#ss-clear', root).addEventListener('click', () => {
      refs.cidr.value = ''; refs.prefix.value = ''; refs.mask.value = '';
      parseAndRender(''); refs.cidr.focus();
    });
    U.$$('.ss-preset', root).forEach((b) => b.addEventListener('click', () => {
      refs.cidr.value = b.dataset.preset; parseAndRender(b.dataset.preset, true);
    }));
    refs.target.addEventListener('change', () => { state.target = Number(refs.target.value); persist(); renderSplit(); });
    refs.copy.addEventListener('click', copySubnets);
    refs.dl.addEventListener('click', downloadSubnets);

    parseAndRender(refs.cidr.value);
  }

  function unmount() {
    alive = false;
    scope = null; refs = {}; el = null;
  }

  function applyPrefix(value) {
    if (!alive || !refs.cidr) return;
    const p = Number(value);
    if (!Number.isInteger(p) || p < 0 || p > 32) { status(t('ss.badPrefix', { n: value }), true); return; }
    const parsed = parseOctets(refs.cidr.value.split(/[/\s]/)[0]);
    if (parsed.error) { parseAndRender(refs.cidr.value); return; }
    const text = ipText(parsed.int) + '/' + p;
    refs.cidr.value = text;
    parseAndRender(text);
  }

  function applyMask(value) {
    if (!alive || !refs.cidr) return;
    const m = parseOctets(value);
    if (m.error) { parseAndRender(refs.cidr.value); return; }
    const p = prefixFromMask(m.int);
    if (p < 0) { status(t('ss.badMask', { s: value }), true); return; }
    const parsed = parseOctets(refs.cidr.value.split(/[/\s]/)[0]);
    if (parsed.error) return;
    const text = ipText(parsed.int) + '/' + p;
    refs.cidr.value = text;
    parseAndRender(text);
  }

  function parseAndRender(text, force) {
    scope = parseInput(text);
    render(force);
  }

  // A field the reader is typing into is never rewritten under their cursor.
  function echo(field, value, force) {
    if (force || document.activeElement !== field) field.value = value;
  }

  function render(force) {
    if (!alive || !refs.cidr) return;
    if (!scope || !scope.ok) {
      refs.scopeStep.hidden = true;
      refs.splitStep.hidden = true;
      refs.subnets.innerHTML = '';
      setExportEnabled(false);
      const err = (scope && scope.error) || 'empty';
      const bad = err !== 'empty';
      const msg = err === 'empty' ? t('ss.cidrPh') : t(ERRORS[err] || 'ss.badCidr', {
        n: scope.got || scope.prefix || 0, s: scope.shown || ''
      });
      status(msg, bad);
      return;
    }
    const sc = scope.scoped;
    const role = classify(sc.network);
    const zone = arpaZone(sc.network, sc.prefix);
    status(t('ss.in') + ' ' + scope.text + ' — ' + ipText(sc.network) + '/' + sc.prefix, false);
    echo(refs.prefix, String(sc.prefix), force);
    echo(refs.mask, ipText(sc.mask), force);

    refs.scopeStep.hidden = false;
    refs.facts.innerHTML = describeScope(sc, role, zone).map((row) =>
      '<tr><th scope="row" data-label="' + esc(row.label) + '">' + esc(row.label) + '</th>' +
      '<td class="mono">' + esc(row.value) + '</td></tr>').join('');
    refs.bits.hidden = false;
    refs.bits.textContent = groupBits(sc.mask) + '  ·  ' + groupBits(sc.wildcard);

    const options = [];
    for (let p = sc.prefix + 1; p <= 30; p++) options.push('<option value="' + p + '">/' + p + '</option>');
    refs.target.innerHTML = options.join('');
    if (!options.length) { refs.splitStep.hidden = true; refs.subnets.innerHTML = ''; setExportEnabled(false); return; }
    refs.target.value = String(U.clamp(state.target, sc.prefix + 1, 30));
    refs.splitStep.hidden = false;
    renderSplit();
  }

  function renderSplit() {
    if (!alive || !scope || !scope.ok || !refs.target || refs.splitStep.hidden) return;
    const split = splitInto(scope.scoped, Number(refs.target.value));
    if (!split) { refs.subnets.innerHTML = ''; setExportEnabled(false); return; }
    refs.splitCount.textContent = split.count + ' × /' + Number(refs.target.value) +
      (split.count > split.shown ? ' (' + t('ss.showing', { n: split.shown, total: split.count }) + ')' : '');
    refs.subnets.innerHTML = split.blocks.map((b, i) =>
      '<tr><td data-label="#" class="mono">' + (i + 1) + '</td>' +
      '<td data-label="' + esc(t('ss.col.net')) + '" class="mono">' + ipText(b.network) + '/' + b.prefix + '</td>' +
      '<td data-label="' + esc(t('ss.col.mask')) + '" class="mono">' + ipText(b.mask) + '</td>' +
      '<td data-label="' + esc(t('ss.col.first')) + '" class="mono">' + ipText(b.first) + '</td>' +
      '<td data-label="' + esc(t('ss.col.last')) + '" class="mono">' + ipText(b.last) + '</td>' +
      '<td data-label="' + esc(t('ss.col.bcast')) + '" class="mono">' + ipText(b.broadcast) + '</td></tr>').join('');
    setExportEnabled(true);
  }

  function describeScope(sc, role, zone) {
    const rows = [
      { label: t('ss.network'), value: ipText(sc.network) + '/' + sc.prefix },
      { label: t('ss.mask'), value: ipText(sc.mask) },
      { label: t('ss.wildcard'), value: ipText(sc.wildcard) },
      { label: t('ss.broadcast'), value: ipText(sc.broadcast) },
      { label: t('ss.first'), value: sc.kind === 'hostRoute' ? ipText(sc.first) + ' (' + t('ss.hostRoute') + ')' : ipText(sc.first) },
      { label: t('ss.last'), value: ipText(sc.last) },
      { label: t('ss.total'), value: String(sc.total) },
      { label: t('ss.usable'), value: sc.kind ? String(sc.usable) + ' (' + t('ss.' + sc.kind) + ')' : String(sc.usable) },
      { label: t('ss.reverse'), value: reverseName(scope.ip) },
      { label: t('ss.zone'), value: zone.zone }
    ];
    if (sc.interesting) {
      rows.push({ label: t('ss.interesting'), value: '#' + sc.interesting.index + ' · ' + sc.interesting.maskValue });
      rows.push({ label: t('ss.step'), value: String(sc.interesting.step) });
    }
    const names = ROLE_NAMES[role.key] || ROLE_NAMES.public;
    rows.push({ label: t('ss.role'), value: names[VT.i18n.lang] });
    rows.push({ label: t('ss.rfc'), value: role.rfc });
    return rows;
  }

  function status(msg, bad) {
    refs.status.textContent = msg;
    refs.status.className = 'ss-status ' + (bad ? 'bad' : 'ok');
  }
  function setExportEnabled(on) { refs.copy.disabled = !on; refs.dl.disabled = !on; }

  function subnetsCsv() {
    const split = splitInto(scope.scoped, Number(refs.target.value));
    const rows = split ? split.blocks : [];
    return 'network,mask,first,last,broadcast,usable\n' + rows.map((b) =>
      [ipText(b.network) + '/' + b.prefix, ipText(b.mask), ipText(b.first), ipText(b.last), ipText(b.broadcast), b.usable].join(',')).join('\n') + '\n';
  }
  async function copySubnets() {
    if (!scope || !scope.ok) { toast(t('ss.needInput'), 'warn'); return; }
    const done = await U.copyText(subnetsCsv());
    toast(done ? t('ss.copied') : t('ss.copyFail'), done ? 'ok' : 'bad');
  }
  function downloadSubnets() {
    if (!scope || !scope.ok) { toast(t('ss.needInput'), 'warn'); return; }
    U.downloadText(subnetsCsv(), 'vistanology-subnet-scope-' + ipText(scope.scoped.network).replace(/\./g, '-') + '.csv', 'text/csv');
    toast(t('ss.downloaded'), 'ok');
  }

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    try {
      const s = VT.store.get(KEY);
      if (s && Number.isInteger(Number(s.target))) state.target = U.clamp(Number(s.target), 1, 30);
    } catch { /* the split size is a convenience */ }
  }

  VT.registry.add(def);
  return def;
})();
