import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BASE = () => (process.env.SAVENOW_BASE || 'https://p.savenow.to').replace(/\/$/, '');
const KEY_FILE = path.join(process.cwd(), 'database', 'apikey_savenow.json');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function getSavenowKey() {
  if (process.env.SAVENOW_API_KEY) return process.env.SAVENOW_API_KEY.trim();
  try {
    return JSON.parse(fs.readFileSync(KEY_FILE, 'utf-8')).key || null;
  } catch {
    return null;
  }
}

export function setSavenowKey(key) {
  fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });
  fs.writeFileSync(KEY_FILE, JSON.stringify({ key }), { encoding: 'utf-8', mode: 0o600 });
}

function pickLink(d) {
  if (!d || d.success === false) return null;
  const alt = Array.isArray(d.alternative_download_urls) ? d.alternative_download_urls[0] : null;
  const altUrl = typeof alt === 'string' ? alt : alt?.url;
  const link = d.download_url || d.downloadUrl || altUrl || (typeof d.url === 'string' ? d.url : null);
  return typeof link === 'string' && /^https?:\/\//.test(link) ? link : null;
}

export async function savenowGetLink(ytUrl, format = 'mp3', { timeoutMs = 240000, intervalMs = 3000 } = {}) {
  const apikey = getSavenowKey();
  if (!apikey) throw new Error('API key SaveNow belum diatur (.setsavenow atau SAVENOW_API_KEY).');

  const { data: start } = await axios.get(`${BASE()}/api/v2/download`, {
    params: { format, url: ytUrl, apikey },
    timeout: 30000,
  });
  if (!start?.success) throw new Error(`SaveNow menolak permintaan: ${start?.message || start?.error || 'tidak ada keterangan'}`);

  const title = start.title || start.info?.title || '-';
  const thumbnail = start.thumbnail_url || start.info?.image || null;
  const direct = pickLink(start);
  if (direct) return { title, thumbnail, link: direct };

  const progressUrl = start.progress_url;
  if (!progressUrl) throw new Error('Respons SaveNow tidak memuat progress_url.');

  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    await sleep(intervalMs);
    try {
      const { data } = await axios.get(progressUrl, { timeout: 30000 });
      last = data;
      const link = pickLink(data);
      if (link) return { title, thumbnail, link };
      if (data?.success === false && data.message && !/not found/i.test(data.message)) {
        throw new Error(`SaveNow gagal: ${data.message}`);
      }
    } catch (e) {
      if (/^SaveNow gagal/.test(e.message)) throw e;
      last = { message: e.message };
    }
  }
  throw new Error(`Waktu tunggu SaveNow habis (${last?.text || last?.message || 'tanpa respons'}).`);
}

export async function savenowToFile(ytUrl, format, destPath, opts = {}) {
  const maxBytes = opts.maxBytes || 100 * 1024 * 1024;
  const { title, thumbnail, link } = await savenowGetLink(ytUrl, format, opts);

  const res = await axios.get(link, { responseType: 'stream', timeout: 120000, maxContentLength: maxBytes });
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  let size = 0;
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(destPath);
    res.data.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) { res.data.destroy(new Error('File terlalu besar untuk dikirim.')); }
    });
    res.data.on('error', (e) => { out.destroy(); reject(e); });
    out.on('error', reject);
    out.on('finish', resolve);
    res.data.pipe(out);
  });
  if (size === 0) { fs.rmSync(destPath, { force: true }); throw new Error('File hasil unduhan kosong.'); }
  return { title, thumbnail, path: destPath };
}
