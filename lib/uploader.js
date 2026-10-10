/*
   * uploader.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import fs from 'fs';
import axios from 'axios';
import BodyForm from 'form-data';
import * as cheerio from 'cheerio';
import { fileTypeFromFile } from 'file-type';


async function UguuSe(filePath) {
  const form = new BodyForm();
  const type = await fileTypeFromFile(filePath);
  const ext = type ? type.ext : 'bin';
  const stream = fs.createReadStream(filePath);
  form.append('files[]', stream, { filename: 'data.' + ext });
  try {
    const { data } = await axios.post('https://uguu.se/upload.php', form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      timeout: 120000,
    });
    return data.files[0];
  } finally {
    stream.destroy();
  }
}


const BASE = 'https://ezgif.com';
const UA = 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const http = axios.create({
  timeout: 120000,
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
  headers: { 'User-Agent': UA, Referer: `${BASE}/webp-to-mp4`, Origin: BASE },
});

async function post(url, form) {
  try {
    const { data } = await http.post(url, form, { headers: form.getHeaders() });
    return data;
  } catch (e) {
    const st = e.response?.status;
    if (st === 403 || st === 429 || st === 503) {
      throw new Error(`Ezgif menolak request (HTTP ${st}), kemungkinan rate limit atau Cloudflare.`);
    }
    throw new Error(`Gagal menghubungi Ezgif: ${e.message}`);
  }
}

async function convert(filePath) {
  const form = new BodyForm();
  form.append('new-image-url', '');
  const stream = fs.createReadStream(filePath);
  form.append('new-image', stream, { filename: 'sticker.webp', contentType: 'image/webp' });

  let page1;
  try {
    page1 = await post(`${BASE}/webp-to-mp4`, form);
  } finally {
    stream.destroy();
  }

  const $1 = cheerio.load(page1);
  const file = $1('input[name="file"]').attr('value');
  if (!file) {
    const err = $1('.error, p.error').first().text().trim();
    throw new Error(err || 'Upload ke Ezgif gagal (file bukan WebP valid atau diblokir).');
  }

  const form2 = new BodyForm();
  form2.append('file', file);
  form2.append('convert', 'Convert WebP to MP4!');
  const page2 = await post(`${BASE}/webp-to-mp4/${encodeURIComponent(file)}`, form2);

  const $2 = cheerio.load(page2);
  const src =
    $2('div#output > p.outfile > video > source').attr('src') ||
    $2('video > source').attr('src') ||
    $2('video').attr('src');
  if (!src) throw new Error('URL video hasil konversi tidak ditemukan di halaman Ezgif.');

  return new URL(src, BASE).href;
}

async function webp2mp4File(filePath, retries = 2) {
  if (!fs.existsSync(filePath)) throw new Error(`File webp tidak ditemukan: ${filePath}`);

  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await convert(filePath);
      return { status: true, message: 'Success', result };
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(1500 * (i + 1));
    }
  }
  throw lastErr;
}

async function webp2mp4Buffer(filePath) {
  const { result } = await webp2mp4File(filePath);
  const { data } = await http.get(result, { responseType: 'arraybuffer' });
  return Buffer.from(data);
}

export { UguuSe, webp2mp4File, webp2mp4Buffer };
