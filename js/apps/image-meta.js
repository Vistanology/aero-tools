window.VT = window.VT || {};
VT.modules = VT.modules || {};

VT.modules['image-meta'] = (() => {
  const U = VT.utils;
  const { $, esc } = U;
  const { toast } = VT.ui;
  const t = VT.i18n.t;

  VT.i18n.add({
    en: {
      'mt.source': 'Image', 'mt.drop': 'Drop an image or click to browse', 'mt.dropHint': 'PNG, JPEG, WebP, GIF or BMP — inspected locally, never uploaded',
      'mt.samplePng': 'PNG sample (DPI + text)', 'mt.sampleJpg': 'JPEG sample (EXIF + GPS)',
      'mt.replace': 'Replace image', 'mt.clear': 'Remove',
      'mt.overview': 'Overview', 'mt.m.dims': 'Dimensions', 'mt.m.mp': 'Megapixels', 'mt.m.aspect': 'Aspect', 'mt.m.size': 'File size',
      'mt.m.mime': 'MIME', 'mt.m.modified': 'Modified', 'mt.m.depth': 'Bit depth', 'mt.m.color': 'Color type', 'mt.m.dpi': 'Resolution',
      'mt.structure': 'Structure', 'mt.meta': 'Metadata', 'mt.texts': 'Embedded text', 'mt.none': 'No embedded metadata found.',
      'mt.exif': 'EXIF', 'mt.gps': 'GPS', 'mt.flags': 'WebP features',
      'mt.clean': 'Clean copy', 'mt.cleanHint': 'Re-encoding on a local canvas drops EXIF, GPS, comments and ancillary chunks. It may also change size/quality.',
      'mt.format': 'Format', 'mt.quality': 'Quality', 'mt.download': 'Download clean copy',
      'mt.privacyWarn': 'Metadata can reveal camera, time and GPS location. Inspect before sharing; use the clean copy to strip it.',
      'mt.badType': 'Unsupported file: choose a raster image (PNG, JPEG, WebP, GIF, BMP).',
      'mt.badDecode': 'Could not decode this image.', 'mt.badParse': 'Could not parse this file’s metadata.',
      'mt.svgReject': 'SVG is vector: use SVG Studio to inspect it instead.',
      'mt.cleaned': 'Clean copy downloaded', 'mt.privacy': 'Inspection reads bytes in memory only. Nothing is uploaded or stored.'
    },
    pt: {
      'mt.source': 'Imagem', 'mt.drop': 'Solte uma imagem ou clique para escolher', 'mt.dropHint': 'PNG, JPEG, WebP, GIF ou BMP — inspecionado localmente, nunca enviado',
      'mt.samplePng': 'Exemplo PNG (DPI + texto)', 'mt.sampleJpg': 'Exemplo JPEG (EXIF + GPS)',
      'mt.replace': 'Trocar imagem', 'mt.clear': 'Remover',
      'mt.overview': 'Visão geral', 'mt.m.dims': 'Dimensões', 'mt.m.mp': 'Megapixels', 'mt.m.aspect': 'Proporção', 'mt.m.size': 'Tamanho',
      'mt.m.mime': 'MIME', 'mt.m.modified': 'Modificado', 'mt.m.depth': 'Profundidade', 'mt.m.color': 'Tipo de cor', 'mt.m.dpi': 'Resolução',
      'mt.structure': 'Estrutura', 'mt.meta': 'Metadados', 'mt.texts': 'Texto embutido', 'mt.none': 'Nenhum metadado embutido encontrado.',
      'mt.exif': 'EXIF', 'mt.gps': 'GPS', 'mt.flags': 'Recursos WebP',
      'mt.clean': 'Cópia limpa', 'mt.cleanHint': 'Recodificar em canvas local remove EXIF, GPS, comentários e chunks auxiliares. Pode alterar tamanho/qualidade.',
      'mt.format': 'Formato', 'mt.quality': 'Qualidade', 'mt.download': 'Baixar cópia limpa',
      'mt.privacyWarn': 'Metadados podem revelar câmera, hora e localização GPS. Inspecione antes de compartilhar; use a cópia limpa para removê-los.',
      'mt.badType': 'Arquivo não suportado: escolha uma imagem raster (PNG, JPEG, WebP, GIF, BMP).',
      'mt.badDecode': 'Não foi possível decodificar esta imagem.', 'mt.badParse': 'Não foi possível ler os metadados deste arquivo.',
      'mt.svgReject': 'SVG é vetorial: use o SVG Studio para inspecioná-lo.',
      'mt.cleaned': 'Cópia limpa baixada', 'mt.privacy': 'A inspeção lê bytes apenas em memória. Nada é enviado ou armazenado.'
    }
  });

  const def = {
    id: 'image-meta', cat: 'media', icon: 'meta', version: '1.0.0',
    name: { en: 'Image Metadata', pt: 'Metadados de Imagem' },
    tagline: {
      en: 'Inspect PNG chunks, JPEG EXIF/GPS, WebP flags and embedded text locally — then download a clean, metadata-free copy.',
      pt: 'Inspecione chunks PNG, EXIF/GPS JPEG, flags WebP e texto embutido localmente — e baixe uma cópia limpa, sem metadados.'
    },
    tags: ['image', 'metadata', 'exif', 'gps', 'png', 'jpeg', 'webp', 'privacy', 'inspect'],
    deps: [],
    docs: {
      en: {
        summary: 'Read a raster image’s real metadata in your browser: PNG chunk table (IHDR, pHYs DPI, tEXt, tIME, eXIf), JPEG markers with EXIF camera/exposure tags and GPS coordinates, WebP RIFF feature flags and EXIF/XMP, GIF/BMP headers — plus a one-click clean re-encode that strips it all.',
        usage: [
          'Drop an image (or click the dropzone), or generate a PNG / JPEG sample with embedded metadata.',
          'Read the overview: dimensions, megapixels, aspect, bit depth, color type, DPI, size, MIME, modified date.',
          'Inspect the structure table (PNG chunks / JPEG markers / WebP chunks) and any EXIF, GPS or embedded text.',
          'Note the privacy warning if GPS or personal tags are present.',
          'Download a clean copy: a local canvas re-encode that removes all metadata.'
        ],
        privacy: 'Bytes are parsed in memory only; nothing is uploaded, nothing is stored. The clean copy is produced by local re-encoding.',
        limits: [
          'EXIF parsing covers common IFD0 / Exif / GPS tags; maker-notes and proprietary blocks are listed but not decoded.',
          'Compressed PNG text (zTXt / compressed iTXt) is listed but not inflated.',
          'The clean copy re-encodes pixels: lossy formats may change quality/size; animation is not preserved.',
          'SVG is rejected by design (vector): use SVG Studio instead.'
        ]
      },
      pt: {
        summary: 'Leia os metadados reais de uma imagem raster no navegador: tabela de chunks PNG (IHDR, pHYs DPI, tEXt, tIME, eXIf), marcadores JPEG com tags EXIF de câmera/exposição e coordenadas GPS, flags de recursos WebP RIFF e EXIF/XMP, cabeçalhos GIF/BMP — mais uma recodificação limpa em um clique que remove tudo.',
        usage: [
          'Solte uma imagem (ou clique na dropzone), ou gere um exemplo PNG / JPEG com metadados embutidos.',
          'Leia a visão geral: dimensões, megapixels, proporção, profundidade, tipo de cor, DPI, tamanho, MIME, data de modificação.',
          'Inspecione a tabela de estrutura (chunks PNG / marcadores JPEG / chunks WebP) e qualquer EXIF, GPS ou texto embutido.',
          'Observe o aviso de privacidade se houver GPS ou tags pessoais.',
          'Baixe uma cópia limpa: recodificação em canvas local que remove todos os metadados.'
        ],
        privacy: 'Os bytes são lidos apenas em memória; nada é enviado, nada é armazenado. A cópia limpa é produzida por recodificação local.',
        limits: [
          'A leitura EXIF cobre tags comuns IFD0 / Exif / GPS; maker-notes e blocos proprietários são listados mas não decodificados.',
          'Texto PNG comprimido (zTXt / iTXt comprimido) é listado mas não descomprimido.',
          'A cópia limpa recodifica pixels: formatos com perdas podem mudar qualidade/tamanho; animação não é preservada.',
          'SVG é rejeitado por design (vetorial): use o SVG Studio.'
        ]
      }
    },
    mount, unmount
  };

  const KEY = 'image-meta';
  let alive = false;
  let state = { format: 'png', quality: 90 };
  let srcImg = null, srcMeta = null, srcUrl = null, info = null;
  let refs = {};

  function persist() { VT.store.set(KEY, state); }
  function restore() {
    const s = VT.store.get(KEY, null);
    if (!s || typeof s !== 'object') return;
    if (['png', 'jpeg', 'webp'].includes(s.format)) state.format = s.format;
    const q = Number(s.quality); if (Number.isInteger(q) && q >= 10 && q <= 100) state.quality = q;
  }

  /* ---------- binary readers ---------- */
  const dv = (b) => new DataView(b.buffer || b, b.byteOffset || 0, b.byteLength);
  const ascii = (b, o, n) => String.fromCharCode(...b.subarray(o, o + n));
  const cstr = (b, o) => { let e = o; while (e < b.length && b[e] !== 0) e++; return ascii(b, o, e - o); };

  const COLOR_TYPES = { 0: 'Grayscale', 2: 'RGB', 3: 'Palette', 4: 'Gray+Alpha', 6: 'RGBA' };

  function readExifValue(view, b, entry, le) {
    const { type, count, vo } = entry;
    const sizes = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
    const sz = (sizes[type] || 1) * count;
    const at = sz <= 4 ? vo : view.getUint32(vo, le);
    const g16 = (o) => view.getUint16(o, le);
    const g32 = (o) => view.getUint32(o, le);
    const rat = (o) => { const n = g32(o), d = g32(o + 4); return d ? n / d : 0; };
    if (type === 2) return ascii(b, at, count).replace(/\0+$/, '');
    if (type === 3) return count === 1 ? g16(at) : Array.from({ length: count }, (_, i) => g16(at + i * 2));
    if (type === 4) return count === 1 ? g32(at) : Array.from({ length: count }, (_, i) => g32(at + i * 4));
    if (type === 5 || type === 10) return count === 1 ? rat(at) : Array.from({ length: count }, (_, i) => rat(at + i * 8));
    if (type === 1 || type === 7) return count === 1 ? b[at] : Array.from(b.subarray(at, at + count));
    return null;
  }

  function parseIfd(view, b, off, le, tags) {
    const out = {};
    if (off <= 0 || off + 2 > b.length) return out;
    const n = view.getUint16(off, le);
    for (let i = 0; i < n; i++) {
      const eo = off + 2 + i * 12;
      if (eo + 12 > b.length) break;
      const tag = view.getUint16(eo, le);
      const type = view.getUint16(eo + 2, le);
      const count = view.getUint32(eo + 4, le);
      const entry = { type, count, vo: eo + 8 };
      if (tags[tag]) out[tags[tag]] = readExifValue(view, b, entry, le);
      else if (tag === 0x8769 || tag === 0x8825) out[tag === 0x8769 ? '_exif' : '_gps'] = view.getUint32(eo + 8, le);
    }
    return out;
  }

  function parseExif(b) {
    if (b.length < 8) return null;
    const le = ascii(b, 0, 2) === 'II';
    const view = dv(b);
    if (view.getUint16(2, le) !== 42) return null;
    const ifd0 = view.getUint32(4, le);
    const T0 = { 0x010F: 'Make', 0x0110: 'Model', 0x0112: 'Orientation', 0x0132: 'DateTime', 0x011A: 'XResolution', 0x011B: 'YResolution', 0x0128: 'ResolutionUnit', 0x0131: 'Software' };
    const TE = { 0x829A: 'ExposureTime', 0x829D: 'FNumber', 0x8827: 'ISO', 0x920A: 'FocalLength', 0x9003: 'DateTimeOriginal', 0xA002: 'PixelX', 0xA003: 'PixelY' };
    const TG = { 0x0001: 'LatRef', 0x0002: 'Lat', 0x0003: 'LonRef', 0x0004: 'Lon', 0x0006: 'Altitude' };
    const a = parseIfd(view, b, ifd0, le, T0);
    const exif = a._exif ? parseIfd(view, b, a._exif, le, TE) : {};
    const gps = a._gps ? parseIfd(view, b, a._gps, le, TG) : {};
    delete a._exif; delete a._gps;
    const res = { ...a, ...exif };
    if (gps.Lat && gps.Lon) {
      const dms = (v) => (Array.isArray(v) ? v[0] + v[1] / 60 + v[2] / 3600 : v);
      let lat = dms(gps.Lat), lon = dms(gps.Lon);
      if (gps.LatRef === 'S') lat = -lat;
      if (gps.LonRef === 'W') lon = -lon;
      res.GPS = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    }
    return res;
  }

  function parsePNG(b) {
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    if (!sig.every((v, i) => b[i] === v)) return null;
    const view = dv(b);
    const info = { format: 'PNG', chunks: [], texts: [] };
    let o = 8;
    while (o + 8 <= b.length) {
      const len = view.getUint32(o, false);
      const type = ascii(b, o + 4, 4);
      const data = o + 8;
      info.chunks.push({ type, length: len });
      if (type === 'IHDR') {
        info.width = view.getUint32(data, false); info.height = view.getUint32(data + 4, false);
        info.bitDepth = b[data + 8]; info.colorType = COLOR_TYPES[b[data + 9]] || String(b[data + 9]);
        info.interlace = b[data + 12];
      } else if (type === 'pHYs' && len >= 9) {
        const px = view.getUint32(data, false), py = view.getUint32(data + 4, false), unit = b[data + 8];
        if (unit === 1) info.dpi = `${Math.round(px * 0.0254)}×${Math.round(py * 0.0254)} dpi`;
      } else if (type === 'tIME' && len >= 7) {
        info.time = `${view.getUint16(data, false)}-${String(b[data + 2]).padStart(2, '0')}-${String(b[data + 3]).padStart(2, '0')} ${String(b[data + 4]).padStart(2, '0')}:${String(b[data + 5]).padStart(2, '0')}:${String(b[data + 6]).padStart(2, '0')}`;
      } else if (type === 'tEXt') {
        const k = cstr(b, data); info.texts.push({ key: k, value: ascii(b, data + k.length + 1, len - k.length - 1) });
      } else if (type === 'iTXt') {
        const k = cstr(b, data); info.texts.push({ key: k, value: '(iTXt)' });
      } else if (type === 'zTXt') {
        const k = cstr(b, data); info.texts.push({ key: k, value: '(compressed)' });
      } else if (type === 'eXIf') {
        info.exif = parseExif(b.subarray(data, data + len));
      }
      o = data + len + 4;
      if (type === 'IEND') break;
    }
    return info;
  }

  function parseJPEG(b) {
    if (b[0] !== 0xFF || b[1] !== 0xD8) return null;
    const view = dv(b);
    const info = { format: 'JPEG', markers: [], texts: [] };
    let o = 2;
    while (o + 4 <= b.length) {
      if (b[o] !== 0xFF) { o++; continue; }
      const marker = b[o + 1];
      if (marker === 0xD8 || (marker >= 0xD0 && marker <= 0xD7) || marker === 0x01) { o += 2; continue; }
      if (marker === 0xDA || marker === 0xD9) break;
      const len = view.getUint16(o + 2, false);
      const data = o + 4;
      const name = '0xFF' + marker.toString(16).toUpperCase().padStart(2, '0');
      info.markers.push({ type: name, length: len });
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        info.bitDepth = b[data]; info.height = view.getUint16(data + 1, false); info.width = view.getUint16(data + 3, false);
      } else if (marker === 0xE0 && ascii(b, data, 5) === 'JFIF\0') {
        const units = b[data + 7];
        if (units === 1) info.dpi = `${view.getUint16(data + 8, false)}×${view.getUint16(data + 10, false)} dpi`;
        else if (units === 2) info.dpi = `${Math.round(view.getUint16(data + 8, false) * 2.54)}×${Math.round(view.getUint16(data + 10, false) * 2.54)} dpi`;
      } else if (marker === 0xE1 && ascii(b, data, 6) === 'Exif\0\0') {
        info.exif = parseExif(b.subarray(data + 6, data + len - 2));
      } else if (marker === 0xFE) {
        info.texts.push({ key: 'COM', value: ascii(b, data, len - 2) });
      }
      o += 2 + len;
    }
    return info;
  }

  function parseWebP(b) {
    if (ascii(b, 0, 4) !== 'RIFF' || ascii(b, 8, 4) !== 'WEBP') return null;
    const view = dv(b);
    const info = { format: 'WebP', chunks: [], texts: [], flags: [] };
    let o = 12;
    while (o + 8 <= b.length) {
      const four = ascii(b, o, 4);
      const len = view.getUint32(o + 4, true);
      const data = o + 8;
      info.chunks.push({ type: four, length: len });
      if (four === 'VP8X' && len >= 10) {
        const f = b[data];
        if (f & 0x20) info.flags.push('ICC');
        if (f & 0x10) info.flags.push('Alpha');
        if (f & 0x08) info.flags.push('EXIF');
        if (f & 0x04) info.flags.push('XMP');
        if (f & 0x02) info.flags.push('Animation');
        info.width = 1 + (b[data + 4] | (b[data + 5] << 8) | (b[data + 6] << 16));
        info.height = 1 + (b[data + 7] | (b[data + 8] << 8) | (b[data + 9] << 16));
      } else if (four === 'VP8 ' && len >= 10) {
        info.width = view.getUint16(data + 6, true) & 0x3FFF;
        info.height = view.getUint16(data + 8, true) & 0x3FFF;
      } else if (four === 'VP8L' && len >= 5) {
        const bits = view.getUint32(data + 1, true);
        info.width = (bits & 0x3FFF) + 1;
        info.height = ((bits >> 14) & 0x3FFF) + 1;
      } else if (four === 'EXIF') {
        info.exif = parseExif(b.subarray(data, data + len));
      } else if (four === 'XMP ') {
        info.texts.push({ key: 'XMP', value: ascii(b, data, Math.min(len, 400)) });
      }
      o = data + len + (len % 2);
    }
    return info;
  }

  function parseGIF(b) {
    const sig = ascii(b, 0, 6);
    if (sig !== 'GIF87a' && sig !== 'GIF89a') return null;
    const view = dv(b);
    return { format: 'GIF', width: view.getUint16(6, true), height: view.getUint16(8, true), bitDepth: ((b[10] >> 4) & 7) + 1, chunks: [{ type: sig, length: 6 }] };
  }

  function parseBMP(b) {
    if (ascii(b, 0, 2) !== 'BM') return null;
    const view = dv(b);
    const hsize = view.getUint32(14, true);
    const w = view.getInt32(18, true);
    const h = Math.abs(view.getInt32(22, true));
    return { format: 'BMP', width: w, height: h, bitDepth: view.getUint16(28, true), chunks: [{ type: 'DIB ' + hsize, length: hsize }] };
  }

  function inspect(b) {
    return parsePNG(b) || parseJPEG(b) || parseWebP(b) || parseGIF(b) || parseBMP(b);
  }

  /* ---------- sample fixtures (synthetic, built to spec) ---------- */
  const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
  const crc32 = (bytes) => { let c = 0xFFFFFFFF; for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };

  function pngChunk(type, data) {
    const td = new Uint8Array(4 + data.length);
    td.set([type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)], 0);
    td.set(data, 4);
    const out = new Uint8Array(12 + data.length);
    const v = dv(out);
    v.setUint32(0, data.length, false);
    out.set(td, 4);
    v.setUint32(8 + data.length, crc32(td), false);
    return out;
  }

  function baseCanvas(w, h) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#0D2438'); g.addColorStop(1, '#5FE6FF');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(234,247,255,0.8)';
    ctx.beginPath(); ctx.arc(w / 2, h / 2, Math.min(w, h) / 4, 0, Math.PI * 2); ctx.fill();
    return cv;
  }

  function samplePNG() {
    return new Promise((res) => {
      baseCanvas(640, 420).toBlob(async (blob) => {
        const b = new Uint8Array(await blob.arrayBuffer());
        // insert pHYs (3780 ppm = 96 dpi), tEXt and tIME before IEND
        const iend = b.length - 12;
        const phys = new Uint8Array(9); const pv = dv(phys);
        pv.setUint32(0, 3780, false); pv.setUint32(4, 3780, false); phys[8] = 1;
        const text = new TextEncoder().encode('Author\0Vistanology Open');
        const time = new Uint8Array(7); const tv = dv(time);
        tv.setUint16(0, 2026, false); time[2] = 11; time[3] = 15; time[4] = 10; time[5] = 0; time[6] = 0;
        const extra = [pngChunk('pHYs', phys), pngChunk('tEXt', text), pngChunk('tIME', time)];
        const extraLen = extra.reduce((n, c) => n + c.length, 0);
        const out = new Uint8Array(b.length + extraLen);
        out.set(b.subarray(0, iend), 0);
        let o = iend;
        for (const c of extra) { out.set(c, o); o += c.length; }
        out.set(b.subarray(iend), o);
        res(new File([out], 'exemplo-meta.png', { type: 'image/png' }));
      }, 'image/png');
    });
  }

  function buildExif() {
    // little-endian TIFF: IFD0(Make,Model,DateTime,Orientation,ExifPtr,GpsPtr) + ExifIFD + GPSIFD
    const enc = new TextEncoder();
    const make = enc.encode('Vistanology\0'), model = enc.encode('Open Cam\0'), dt = enc.encode('2026:11:15 10:00:00\0');
    const dto = enc.encode('2026:11:15 09:30:00\0');
    const latRef = enc.encode('S\0'), lonRef = enc.encode('W\0');
    const ifd0Size = 2 + 6 * 12 + 4, exifSize = 2 + 5 * 12 + 4, gpsSize = 2 + 4 * 12 + 4;
    let cur = 8;
    const ifd0At = cur; cur += ifd0Size;
    const makeAt = cur; cur += make.length;
    const modelAt = cur; cur += model.length;
    const dtAt = cur; cur += dt.length;
    const exifAt = cur; cur += exifSize;
    const expAt = cur; cur += 8;
    const fnAt = cur; cur += 8;
    const focAt = cur; cur += 8;
    const dtoAt = cur; cur += dto.length;
    const gpsAt = cur; cur += gpsSize;
    const latRefAt = cur; cur += latRef.length;
    const lonRefAt = cur; cur += lonRef.length;
    const latAt = cur; cur += 24;
    const lonAt = cur; cur += 24;
    const b = new Uint8Array(cur);
    const v = dv(b);
    b[0] = 0x49; b[1] = 0x49; v.setUint16(2, 42, true); v.setUint32(4, ifd0At, true);
    const entry = (at, i, tag, type, count, valOrOff) => {
      const eo = at + 2 + i * 12;
      v.setUint16(eo, tag, true); v.setUint16(eo + 2, type, true); v.setUint32(eo + 4, count, true);
      if (type === 3 && count === 1) v.setUint16(eo + 8, valOrOff, true);
      else if (valOrOff instanceof Uint8Array) b.set(valOrOff, eo + 8);
      else v.setUint32(eo + 8, valOrOff, true);
    };
    v.setUint16(ifd0At, 6, true);
    entry(ifd0At, 0, 0x010F, 2, make.length, makeAt);
    entry(ifd0At, 1, 0x0110, 2, model.length, modelAt);
    entry(ifd0At, 2, 0x0112, 3, 1, 1);
    entry(ifd0At, 3, 0x0132, 2, dt.length, dtAt);
    entry(ifd0At, 4, 0x8769, 4, 1, exifAt);
    entry(ifd0At, 5, 0x8825, 4, 1, gpsAt);
    v.setUint32(ifd0At + 2 + 6 * 12, 0, true);
    b.set(make, makeAt); b.set(model, modelAt); b.set(dt, dtAt);
    v.setUint16(exifAt, 5, true);
    entry(exifAt, 0, 0x829A, 5, 1, expAt);
    entry(exifAt, 1, 0x829D, 5, 1, fnAt);
    entry(exifAt, 2, 0x8827, 3, 1, 200);
    entry(exifAt, 3, 0x920A, 5, 1, focAt);
    entry(exifAt, 4, 0x9003, 2, dto.length, dtoAt);
    v.setUint32(exifAt + 2 + 5 * 12, 0, true);
    v.setUint32(expAt, 1, true); v.setUint32(expAt + 4, 125, true);
    v.setUint32(fnAt, 28, true); v.setUint32(fnAt + 4, 10, true);
    v.setUint32(focAt, 50, true); v.setUint32(focAt + 4, 1, true);
    b.set(dto, dtoAt);
    v.setUint16(gpsAt, 4, true);
    entry(gpsAt, 0, 0x0001, 2, latRef.length, latRef);
    entry(gpsAt, 1, 0x0002, 5, 3, latAt);
    entry(gpsAt, 2, 0x0003, 2, lonRef.length, lonRef);
    entry(gpsAt, 3, 0x0004, 5, 3, lonAt);
    v.setUint32(gpsAt + 2 + 4 * 12, 0, true);
    b.set(latRef, latRefAt); b.set(lonRef, lonRefAt);
    const lat = [23, 1, 33, 1, 0, 1]; const lon = [46, 1, 38, 1, 0, 1];
    lat.forEach((n, i) => v.setUint32(latAt + i * 4, n, true));
    lon.forEach((n, i) => v.setUint32(lonAt + i * 4, n, true));
    return b;
  }

  function sampleJPEG() {
    return new Promise((res) => {
      baseCanvas(420, 420).toBlob(async (blob) => {
        const b = new Uint8Array(await blob.arrayBuffer());
        const exif = buildExif();
        const app1 = new Uint8Array(2 + 2 + 6 + exif.length);
        const v = dv(app1);
        app1[0] = 0xFF; app1[1] = 0xE1;
        v.setUint16(2, 2 + 6 + exif.length, false);
        app1.set([0x45, 0x78, 0x69, 0x66, 0, 0], 4);
        app1.set(exif, 10);
        const out = new Uint8Array(b.length + app1.length);
        out.set(b.subarray(0, 2), 0);
        out.set(app1, 2);
        out.set(b.subarray(2), 2 + app1.length);
        res(new File([out], 'exemplo-exif.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg');
    });
  }

  /* ---------- render ---------- */
  const row = (k, v) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`;

  function render() {
    if (!alive) return;
    const has = !!srcImg;
    refs.empty.hidden = has;
    refs.work.hidden = !has;
    refs.meta.textContent = has ? `${srcMeta.name} · ${srcMeta.type || '?'} · ${U.formatBytes(srcMeta.size)}` : '';
    refs.qualityVal.textContent = state.quality + '%';
    refs.quality.disabled = state.format === 'png';
    if (!has || !info) return;
    const mp = (info.width * info.height) / 1e6;
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const g = gcd(info.width, info.height) || 1;
    let ov = row(t('mt.m.dims'), `${info.width}×${info.height}`) + row(t('mt.m.mp'), mp.toFixed(2) + ' MP') +
      row(t('mt.m.aspect'), `${info.width / g}:${info.height / g}`) + row(t('mt.m.size'), U.formatBytes(srcMeta.size)) +
      row(t('mt.m.mime'), srcMeta.type || '?') + row(t('mt.m.modified'), new Date(srcMeta.lastModified).toLocaleString());
    if (info.bitDepth) ov += row(t('mt.m.depth'), info.bitDepth + ' bit');
    if (info.colorType) ov += row(t('mt.m.color'), info.colorType);
    if (info.dpi) ov += row(t('mt.m.dpi'), info.dpi);
    refs.overview.innerHTML = ov;

    const struct = info.chunks || info.markers || [];
    const runs = [];
    for (const c of struct) {
      const last = runs[runs.length - 1];
      if (last && last.type === c.type) { last.n++; last.bytes += c.length; }
      else runs.push({ type: c.type, n: 1, bytes: c.length });
    }
    refs.structure.innerHTML = runs.length
      ? runs.map((r) => `<tr><td class="mono">${esc(r.type)}${r.n > 1 ? ' ×' + r.n : ''}</td><td class="mono">${r.bytes} B</td></tr>`).join('')
      : `<tr><td colspan="2">${esc(t('mt.none'))}</td></tr>`;

    const ex = info.exif || {};
    const exKeys = Object.keys(ex);
    const hasGps = !!ex.GPS;
    refs.privacyWarn.hidden = !(hasGps || ex.Make || ex.DateTime);
    let metaHtml = '';
    if (exKeys.length) {
      metaHtml += `<h4>${t('mt.exif')}</h4><dl class="mt-kv">` + exKeys.filter((k) => k !== 'GPS').map((k) => row(k, String(ex[k]))).join('') + '</dl>';
      if (hasGps) metaHtml += `<h4>${t('mt.gps')}</h4><dl class="mt-kv">${row('GPS', ex.GPS)}</dl>`;
    }
    if (info.flags && info.flags.length) metaHtml += `<h4>${t('mt.flags')}</h4><dl class="mt-kv">${row('flags', info.flags.join(', '))}</dl>`;
    if (info.time) metaHtml += `<dl class="mt-kv">${row('tIME', info.time)}</dl>`;
    refs.metaBox.innerHTML = metaHtml || `<p class="hint">${esc(t('mt.none'))}</p>`;
    refs.texts.innerHTML = (info.texts && info.texts.length)
      ? info.texts.map((x) => `<div class="mt-text"><strong>${esc(x.key)}</strong><pre>${esc(x.value)}</pre></div>`).join('')
      : `<p class="hint">${esc(t('mt.none'))}</p>`;
    refs.textsWrap.hidden = !(info.texts && info.texts.length);
  }

  function clearImage() {
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    srcImg = null; srcMeta = null; srcUrl = null; info = null;
    render();
  }

  async function loadFile(file) {
    if (!file) return;
    if (file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)) { toast(t('mt.svgReject'), 'error'); return; }
    if (!file.type.startsWith('image/')) { toast(t('mt.badType'), 'error'); return; }
    const url = URL.createObjectURL(file);
    let img;
    try { img = await U.loadImage(url); }
    catch { URL.revokeObjectURL(url); toast(t('mt.badDecode'), 'error'); return; }
    const buf = new Uint8Array(await file.arrayBuffer());
    let parsed = null;
    try { parsed = inspect(buf); }
    catch (err) { console.error('image-meta parse:', err && err.stack || err); }
    if (!parsed) { URL.revokeObjectURL(url); toast(t('mt.badParse'), 'error'); return; }
    if (!parsed.width) { parsed.width = img.naturalWidth; parsed.height = img.naturalHeight; }
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    srcImg = img; srcUrl = url; info = parsed;
    srcMeta = { name: file.name, type: file.type, size: file.size, lastModified: file.lastModified };
    render();
  }

  function mount(root) {
    alive = true;
    restore();
    const I = VT.icons;
    root.innerHTML = `
      <div class="mt-layout">
        <div class="mt-left">
          <section class="mt-stage glass-2">
            <div class="empty" id="mt-empty">
              <span class="orb orb-lg">${I.meta}</span>
              <strong>${t('mt.none')}</strong>
              <span>${t('mt.dropHint')}</span>
              <div class="mt-samples">
                <button class="btn btn-sm" id="mt-sample-png">${I.sparkle} ${t('mt.samplePng')}</button>
                <button class="btn btn-sm" id="mt-sample-jpg">${I.sparkle} ${t('mt.sampleJpg')}</button>
              </div>
            </div>
            <div id="mt-work" hidden>
              <p class="hint mt-warn" id="mt-privacy-warn" hidden>${I.shield} ${t('mt.privacyWarn')}</p>
              <h3 class="mt-h">${t('mt.overview')}</h3>
              <dl class="mt-overview" id="mt-overview"></dl>
              <h3 class="mt-h">${t('mt.structure')}</h3>
              <table class="mt-table"><tbody id="mt-structure"></tbody></table>
              <h3 class="mt-h">${t('mt.meta')}</h3>
              <div id="mt-meta-box"></div>
              <div id="mt-texts-wrap" hidden>
                <h3 class="mt-h">${t('mt.texts')}</h3>
                <div id="mt-texts"></div>
              </div>
              <div class="export-row">
                <button class="btn" id="mt-replace">${I.upload} ${t('mt.replace')}</button>
              </div>
            </div>
            <p class="privacy-line">${I.shield} ${t('mt.privacy')}</p>
          </section>
        </div>
        <div class="mt-controls">
          <section class="step glass">
            <div class="step-head"><span class="step-num">01</span><h3 class="step-title">${t('mt.source')}</h3></div>
            <div class="dropzone" id="mt-drop" tabindex="0" role="button" aria-label="${t('mt.drop')}">
              <span class="orb orb-sm">${I.upload}</span>
              <strong>${t('mt.drop')}</strong><span>${t('mt.dropHint')}</span>
            </div>
            <input type="file" id="mt-file" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp" hidden>
            <div class="mt-srcmeta"><span class="hint" id="mt-meta"></span>
              <button class="btn btn-ghost btn-sm" id="mt-clear">${I.x} ${t('mt.clear')}</button></div>
          </section>
          <section class="step glass">
            <div class="step-head"><span class="step-num">02</span><h3 class="step-title">${t('mt.clean')}</h3></div>
            <p class="hint">${t('mt.cleanHint')}</p>
            <div class="field"><label for="mt-format">${t('mt.format')}</label>
              <select class="input" id="mt-format"><option value="png">PNG</option><option value="jpeg">JPEG</option><option value="webp">WebP</option></select></div>
            <div class="field"><label for="mt-quality">${t('mt.quality')} · <span id="mt-quality-val"></span></label>
              <input type="range" id="mt-quality" min="10" max="100" step="1"></div>
            <button class="btn btn-primary mt-dl" id="mt-dl">${I.download} ${t('mt.download')}</button>
          </section>
        </div>
      </div>`;

    refs = {
      empty: $('#mt-empty', root), work: $('#mt-work', root), meta: $('#mt-meta', root),
      overview: $('#mt-overview', root), structure: $('#mt-structure', root),
      metaBox: $('#mt-meta-box', root), texts: $('#mt-texts', root), textsWrap: $('#mt-texts-wrap', root),
      privacyWarn: $('#mt-privacy-warn', root), qualityVal: $('#mt-quality-val', root), quality: $('#mt-quality', root),
      drop: $('#mt-drop', root), file: $('#mt-file', root), dl: $('#mt-dl', root)
    };

    const fmt = $('#mt-format', root); fmt.value = state.format;
    fmt.addEventListener('change', () => { state.format = fmt.value; persist(); render(); });
    const q = refs.quality; q.value = state.quality;
    q.addEventListener('input', () => { state.quality = U.clamp(Number(q.value), 10, 100); persist(); render(); });

    refs.drop.addEventListener('click', () => refs.file.click());
    refs.drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); refs.file.click(); } });
    ['dragover', 'dragenter'].forEach((ev) => refs.drop.addEventListener(ev, (e) => { e.preventDefault(); refs.drop.classList.add('dragover'); }));
    ['dragleave', 'dragend'].forEach((ev) => refs.drop.addEventListener(ev, () => refs.drop.classList.remove('dragover')));
    refs.drop.addEventListener('drop', (e) => { e.preventDefault(); refs.drop.classList.remove('dragover'); loadFile(e.dataTransfer.files[0]); });
    refs.file.addEventListener('change', () => { loadFile(refs.file.files[0]); refs.file.value = ''; });
    $('#mt-sample-png', root).addEventListener('click', async () => { loadFile(await samplePNG()); });
    $('#mt-sample-jpg', root).addEventListener('click', async () => { loadFile(await sampleJPEG()); });
    $('#mt-replace', root).addEventListener('click', () => refs.file.click());
    $('#mt-clear', root).addEventListener('click', clearImage);
    refs.dl.addEventListener('click', () => {
      if (!srcImg) return;
      const cv = document.createElement('canvas');
      cv.width = srcImg.naturalWidth; cv.height = srcImg.naturalHeight;
      const ctx = cv.getContext('2d');
      const type = 'image/' + state.format;
      if (type === 'image/jpeg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, cv.width, cv.height); }
      ctx.drawImage(srcImg, 0, 0);
      cv.toBlob((blob) => {
        if (!blob || !alive) return;
        const base = srcMeta.name.replace(/\.[^.]+$/, '') || 'imagem';
        const ext = { png: 'png', jpeg: 'jpg', webp: 'webp' }[state.format];
        U.downloadBlob(blob, `${base}-limpo.${ext}`);
        toast(t('mt.cleaned'), 'success');
      }, type, state.quality / 100);
    });

    render();
    return () => { alive = false; };
  }

  function unmount() {
    alive = false;
    if (srcUrl) URL.revokeObjectURL(srcUrl);
    srcImg = null; srcMeta = null; srcUrl = null; info = null;
  }

  VT.registry.add(def);
  return def;
})();