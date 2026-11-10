/*
   * toqr.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import zlib from 'zlib';
import QRCode from 'qrcode-terminal/vendor/QRCode/index.js';
import QRErrorCorrectLevel from 'qrcode-terminal/vendor/QRCode/QRErrorCorrectLevel.js';

export const MAX_BYTES = 1000; // batas isi (dalam byte UTF-8; huruf biasa = 1 byte, emoji = 4 byte)

// ---------- PNG ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

// raw = tiap baris: 1 byte filter (0) + `width` byte abu-abu
function encodePng(width, height, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 0; // abu-abu
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- QR ----------

function buildQr(text) {
  const bytes = Buffer.from(String(text), 'utf8');
  if (!bytes.length) throw new Error('EMPTY');
  if (bytes.length > MAX_BYTES) throw new Error('TOO_LONG');
  // Pustaka QR menulis tiap karakter sebagai 8 bit, jadi teks diberikan sebagai deretan byte UTF-8
  // (satu karakter = satu byte). Kalau tidak, emoji dan huruf non-Latin akan rusak.
  const qr = new QRCode(-1, QRErrorCorrectLevel.M);
  qr.addData(bytes.toString('latin1'));
  try {
    qr.make();
  } catch {
    throw new Error('TOO_LONG');
  }
  return qr;
}

export function makeQrPng(text, { quiet = 4, target = 640 } = {}) {
  const qr = buildQr(text);
  const n = qr.getModuleCount();
  const total = n + quiet * 2;                                   // kotak + zona tenang di tepi
  const scale = Math.max(4, Math.min(20, Math.ceil(target / total)));
  const size = total * scale;
  const raw = Buffer.alloc((size + 1) * size, 255);              // semuanya putih
  for (let y = 0; y < size; y++) {
    const off = y * (size + 1);
    raw[off] = 0;                                                // filter: none
    const my = Math.floor(y / scale) - quiet;
    if (my < 0 || my >= n) continue;
    for (let mx = 0; mx < n; mx++) {
      if (qr.isDark(my, mx)) raw.fill(0, off + 1 + (mx + quiet) * scale, off + 1 + (mx + quiet + 1) * scale);
    }
  }
  return encodePng(size, size, raw);
}
