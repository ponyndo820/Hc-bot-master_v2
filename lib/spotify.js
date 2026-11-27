/*
   * spotify.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import fs from 'fs';
import path from 'path';

const URL_RE = /https?:\/\/(?:open\.spotify\.com|spotify\.link|spotify\.app\.link)\/[^\s]+/i;
const URI_RE = /spotify:track:([A-Za-z0-9]{22})/i;
const TRACK_RE = /open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]{22})/i;
const SHORT_HOSTS = ['spotify.link', 'spotify.app.link'];

export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export function extractSpotifyUrl(str) {
  if (!str || typeof str !== 'string') return '';
  const uri = str.match(URI_RE);
  if (uri) return `https://open.spotify.com/track/${uri[1]}`;
  const m = str.match(URL_RE);
  return m ? m[0].replace(/[)\].,!?]+$/, '') : '';
}

export async function normalizeSpotifyUrl(rawUrl) {
  let url = rawUrl;
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (SHORT_HOSTS.includes(host)) {
      const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
      url = res.url || url;
    }
  } catch {
    return null;
  }
  const t = url.match(TRACK_RE);
  if (t) return { url: `https://open.spotify.com/track/${t[1]}` };
  const other = url.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(album|playlist|artist|episode|show)\//i);
  if (other) return { type: other[1].toLowerCase() };
  return null;
}

let clientPromise = null;

async function getClient() {
  if (clientPromise) return clientPromise;
  clientPromise = (async () => {
    let mod;
    try {
      mod = await import('spotifydl-x');
    } catch (e) {
      clientPromise = null;
      throw new Error('Paket spotifydl-x belum terpasang. Jalankan: npm install spotifydl-x@0.3.0');
    }
    const hasApi = (x) => x && (typeof x.getTrack === 'function' || typeof x.prototype?.getTrack === 'function');
    const candidates = [mod.Spotify, mod.default?.Spotify, mod.default?.default, mod.default, mod];
    const Impl = candidates.find(hasApi);
    if (!Impl) {
      clientPromise = null;
      throw new Error('Bentuk export spotifydl-x tidak dikenali (butuh getTrack/downloadTrack).');
    }
    if (typeof Impl.prototype?.getTrack === 'function') {
      const id = process.env.SPOTIFY_CLIENT_ID;
      const secret = process.env.SPOTIFY_CLIENT_SECRET;
      return id && secret ? new Impl({ clientId: id, clientSecret: secret }) : new Impl();
    }
    return Impl;
  })();
  return clientPromise;
}

const withTimeout = (p, ms, label) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timeout`)), ms))]);

function normalizeInfo(t = {}) {
  const artists = Array.isArray(t.artists)
    ? t.artists.map((a) => (typeof a === 'string' ? a : a?.name)).filter(Boolean).join(', ')
    : (t.artists || t.artist || '');
  return {
    title: t.name || t.title || 'Unknown',
    artists: artists || 'Unknown',
    album: t.album_name || t.album?.name || (typeof t.album === 'string' ? t.album : ''),
    release: t.release_date || t.album?.release_date || '',
    cover: t.cover_url || t.cover || t.album?.images?.[0]?.url || '',
  };
}

export async function downloadSpotifyTrack(trackUrl, outDir = './database/temp') {
  const sp = await getClient();
  fs.mkdirSync(outDir, { recursive: true });

  const track = await withTimeout(sp.getTrack(trackUrl), 30000, 'Ambil info lagu');
  const info = normalizeInfo(track);

  let data;
  try {
    data = await withTimeout(sp.downloadTrack(trackUrl), 240000, 'Unduh lagu');
  } catch (e) {
    if (e instanceof TypeError) data = await withTimeout(sp.downloadTrack(track), 240000, 'Unduh lagu');
    else throw e;
  }

  const filePath = path.join(outDir, `spotify_${Date.now()}.mp3`);
  if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
    fs.writeFileSync(filePath, data);
  } else if (typeof data === 'string' && fs.existsSync(data)) {
    fs.copyFileSync(data, filePath);
    if (path.resolve(data) !== path.resolve(filePath)) { try { fs.unlinkSync(data); } catch {} }
  } else {
    throw new Error('Hasil unduhan spotifydl-x tidak dikenali (bukan Buffer maupun path file).');
  }
  if (!fs.statSync(filePath).size) {
    fs.unlinkSync(filePath);
    throw new Error('File hasil unduhan kosong.');
  }
  return { info, filePath };
}
