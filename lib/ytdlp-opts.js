
import fs from 'fs';
import os from 'os';
import path from 'path';

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
  return opts;
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
