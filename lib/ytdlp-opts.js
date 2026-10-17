import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFile } from 'child_process';

export const COOKIES_FILE = path.join(process.cwd(), 'database', 'yt-cookies.txt');

let envCache = { raw: null, file: null };

function resolveCookiesPath() {
  if (fs.existsSync(COOKIES_FILE)) return COOKIES_FILE;
  if (process.env.YT_COOKIES_FILE && fs.existsSync(process.env.YT_COOKIES_FILE)) return process.env.YT_COOKIES_FILE;
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

export function saveYoutubeCookies(rawText) {
  const out = ['# Netscape HTTP Cookie File'];
  let count = 0;
  let hasAuth = false;

  for (const original of String(rawText).replace(/\r/g, '').split('\n')) {
    let line = original.trim();
    if (!line) continue;
   
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

export function ytdlpBaseOptions() {
  const cookies = resolveCookiesPath();
  const opts = {
    noCheckCertificates: true,
    noWarnings: true,
    addHeader: ['referer:https://www.youtube.com'],
  };
  if (cookies) {
    opts.cookies = cookies;
  } else {
    opts.extractorArgs = 'youtube:player_client=android,web';
  }
  if (process.env.YT_PROXY) opts.proxy = process.env.YT_PROXY;
  if (process.env.YT_JS_RUNTIME) opts.jsRuntimes = process.env.YT_JS_RUNTIME;
  if (process.env.YT_REMOTE_COMPONENTS) opts.remoteComponents = process.env.YT_REMOTE_COMPONENTS;
  if (process.env.YT_DEBUG === '1') delete opts.noWarnings;
  return opts;
}

const YTDLP_BIN = path.join(process.cwd(), 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp');

const runYtdlp = (args, timeout) => new Promise((resolve) => {
  execFile(YTDLP_BIN, args, { timeout }, (err, stdout, stderr) => {
    resolve({ ok: !err, out: `${stdout || ''}${stderr || ''}`.trim() });
  });
});

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

if (process.env.YT_AUTO_UPDATE !== '0') {
  const t = setTimeout(() => {
    updateYtdlp()
      .then((r) => console.log(`[YTDLP] versi ${r.after}${r.changed ? ` (diperbarui dari ${r.before})` : ''}`))
      .catch((e) => console.log('[YTDLP] pembaruan otomatis dilewati:', e.message));
  }, 5000);
  t.unref?.();
}


export function isYoutubeBotBlock(err) {
  const msg = `${err?.stderr || ''} ${err?.message || ''}`;
  return /confirm you.?re not a bot|Sign in to confirm/i.test(msg);
}

export function youtubeErrorMessage(err, fallback) {
  if (isYoutubeBotBlock(err)) {
    return '❌ YouTube sedang memblokir server bot ini (verifikasi anti-bot).\nOwner perlu memperbarui cookies YouTube (.setytcookies atau YT_COOKIES). Coba lagi nanti.';
  }
  return fallback;
}
