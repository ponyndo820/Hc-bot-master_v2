/*
   * lib/ytdlp-opts.js
   * Opsi bersama untuk yt-dlp (.ytmp3 / .ytmp4).
   * [PERBAIKAN] Menangani error YouTube "Sign in to confirm you're not a bot"
   * yang muncul saat bot berjalan di server (Railway, dll) karena IP datacenter diblokir YouTube.
   *
   * Sumber cookies (urutan prioritas):
   *   1) database/yt-cookies.txt   -> disimpan lewat command .setytcookies (tidak ikut ke GitHub)
   *   2) YT_COOKIES_FILE           -> path ke file cookies.txt (opsional)
   *   3) YT_COOKIES                -> isi cookies.txt lewat Environment Variable (Railway)
   *   YT_PROXY (opsional)          -> proxy, mis. http://user:pass@host:port
   *   YT_JS_RUNTIME (opsional)     -> mis. node  (diteruskan sebagai --js-runtimes; butuh yt-dlp baru)
   *   YT_REMOTE_COMPONENTS (opsional) -> mis. ejs:github (diteruskan sebagai --remote-components)
   *   YT_DEBUG=1 (opsional)        -> tampilkan peringatan yt-dlp di log (untuk mencari penyebab error)
   *   YT_AUTO_UPDATE=0 (opsional)  -> matikan pembaruan otomatis yt-dlp saat bot menyala
   *
   * CATATAN: yt-dlp hanya mengenali format Netscape (teks), bukan JSON,
   * jadi file cookies disimpan sebagai .txt walaupun Anda menyebutnya "cookies.json".
*/
import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';

export const COOKIES_FILE = path.join(process.cwd(), 'database', 'yt-cookies.txt');

let envCache = { raw: null, file: null };

function resolveCookiesPath() {
  // 1) File yang disimpan lewat command .setytcookies
  if (fs.existsSync(COOKIES_FILE)) return COOKIES_FILE;
  // 2) File di path yang ditentukan
  if (process.env.YT_COOKIES_FILE && fs.existsSync(process.env.YT_COOKIES_FILE)) return process.env.YT_COOKIES_FILE;
  // 3) Isi cookies dari environment variable (cocok untuk Railway)
  const raw = process.env.YT_COOKIES;
  if (raw && raw.trim()) {
    if (envCache.raw === raw && envCache.file) return envCache.file;
    const text = raw.includes('\n') ? raw : raw.replace(/\\n/g, '\n');
    const file = path.join(os.tmpdir(), 'yt-cookies.txt');
    fs.writeFileSync(file, text.trim() + '\n', { mode: 0o600 });
    envCache = { raw, file };
    return file;
  }
  return null;
}

/**
 * [PERBAIKAN] Menyimpan cookies yang dikirim lewat chat ke database/yt-cookies.txt.
 * WhatsApp bisa mengubah karakter TAB menjadi spasi, padahal format Netscape wajib TAB,
 * jadi baris diperbaiki otomatis. Melempar Error bila isinya tidak tampak seperti cookies YouTube.
 */
export function saveYoutubeCookies(rawText) {
  const out = ['# Netscape HTTP Cookie File'];
  let count = 0;
  let hasAuth = false;

  for (const original of String(rawText).replace(/\r/g, '').split('\n')) {
    let line = original.trim();
    if (!line) continue;
    // Komentar biasa dilewati, kecuali baris "#HttpOnly_" yang merupakan data cookies
    if (line.startsWith('#') && !line.startsWith('#HttpOnly_')) continue;

    let fields = line.includes('\t') ? line.split('\t') : line.split(/\s+/);
    if (fields.length < 7) continue;
    if (fields.length > 7) fields = [...fields.slice(0, 6), fields.slice(6).join(' ')];
    if (!/youtube\.com|google\.com/i.test(fields[0])) continue;

    if (/^(SID|SAPISID|LOGIN_INFO|__Secure-[13]PSID|__Secure-3PAPISID)$/.test(fields[5])) hasAuth = true;
    out.push(fields.join('\t'));
    count++;
  }

  if (count < 3) throw new Error('Isi tidak terbaca sebagai cookies.txt (format Netscape) dari youtube.com.');
  if (!hasAuth) throw new Error('Cookies login tidak ditemukan (SID/SAPISID/LOGIN_INFO). Pastikan Anda sudah login YouTube sebelum mengekspor.');

  fs.mkdirSync(path.dirname(COOKIES_FILE), { recursive: true });
  fs.writeFileSync(COOKIES_FILE, out.join('\n') + '\n', { mode: 0o600 });
  return { count, file: COOKIES_FILE };
}

/** Opsi dasar yang dipakai semua pemanggilan yt-dlp */
export function ytdlpBaseOptions() {
  const cookies = resolveCookiesPath();
  const opts = {
    noCheckCertificates: true,
    noWarnings: true,
    addHeader: ['referer:https://www.youtube.com'],
  };
  if (cookies) {
    // Klien "android" tidak mendukung cookies, jadi biarkan yt-dlp memilih klien sendiri
    opts.cookies = cookies;
  } else {
    opts.extractorArgs = 'youtube:player_client=android,web';
  }
  if (process.env.YT_PROXY) opts.proxy = process.env.YT_PROXY;
  // [PERBAIKAN] Opsi opsional untuk YouTube yang kini butuh runtime JavaScript (hanya aktif bila variabelnya diisi,
  // karena yt-dlp versi lama akan menolak opsi ini)
  if (process.env.YT_JS_RUNTIME) opts.jsRuntimes = process.env.YT_JS_RUNTIME;
  if (process.env.YT_REMOTE_COMPONENTS) opts.remoteComponents = process.env.YT_REMOTE_COMPONENTS;
  // [PERBAIKAN] Mode debug: peringatan yt-dlp biasanya disembunyikan (noWarnings) dan itu menyulitkan mencari sebab error
  if (process.env.YT_DEBUG === '1') delete opts.noWarnings;
  return opts;
}

/* ---------- [PERBAIKAN] Pembaruan yt-dlp ----------
   Binary yt-dlp diunduh saat `npm install`. Di Railway/Docker, langkah itu sering ikut cache sehingga
   versinya lama, padahal YouTube sering berubah dan versi lama gagal (mis. "The page needs to be reloaded"). */
const YTDLP_BIN = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp');

const runYtdlp = (args, timeout) => new Promise((resolve) => {
  execFile(YTDLP_BIN, args, { timeout }, (err, stdout, stderr) => {
    resolve({ ok: !err, out: `${stdout || ''}${stderr || ''}`.trim() });
  });
});

/** Perbarui yt-dlp ke versi terbaru. channel: 'nightly' (default) atau 'stable' */
export async function updateYtdlp(channel = 'nightly') {
  if (!fs.existsSync(YTDLP_BIN)) throw new Error('Binary yt-dlp tidak ditemukan di node_modules.');
  const before = (await runYtdlp(['--version'], 20000)).out;
  const upd = await runYtdlp(['--update-to', channel], 120000);
  const after = (await runYtdlp(['--version'], 20000)).out;
  return {
    ok: upd.ok,
    before,
    after,
    changed: before !== after,
    output: upd.out.split('\n').slice(-4).join('\n'),
  };
}

// Pembaruan otomatis sekali saat bot menyala (tidak menghambat startup; matikan dengan YT_AUTO_UPDATE=0)
if (process.env.YT_AUTO_UPDATE !== '0') {
  const t = setTimeout(() => {
    updateYtdlp()
      .then((r) => console.log(`[YTDLP] versi ${r.after}${r.changed ? ` (diperbarui dari ${r.before})` : ''}`))
      .catch((e) => console.log('[YTDLP] pembaruan otomatis dilewati:', e.message));
  }, 5000);
  t.unref?.();
}

/** Cek apakah error berasal dari blokir bot YouTube */
export function isYoutubeBotBlock(err) {
  const msg = `${err?.stderr || ''} ${err?.message || ''}`;
  return /confirm you.?re not a bot|Sign in to confirm/i.test(msg);
}

/** Pesan ramah untuk dikirim ke user */
export function youtubeErrorMessage(err, fallback) {
  if (isYoutubeBotBlock(err)) {
    return '❌ YouTube sedang memblokir server bot ini (verifikasi anti-bot).\nOwner perlu memperbarui cookies YouTube (.setytcookies atau YT_COOKIES). Coba lagi nanti.';
  }
  return fallback;
}
