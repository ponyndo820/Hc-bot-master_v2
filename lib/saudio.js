/*
   * saudio.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawn, execFile } from 'child_process';
import { proto, prepareWAMessageMedia, generateWAMessageFromContent } from '@whiskeysockets/baileys';

import { writeExif } from './converter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '../database/temp');
fs.mkdirSync(tempDir, { recursive: true });

const MAX_VIDEO_SECONDS = 5;
const MAX_IMAGE_SECONDS = 10;
const FIELD_STICKER_AUDIO = 26;
const FIELD_AUDIO_STICKER = 134;
const MAX_STICKER_BYTES = 1_000_000;
const TARGET_BYTES = MAX_STICKER_BYTES - 8192;
const LADDER = [
  { size: 512, fps: 20, q: 70 },
  { size: 512, fps: 15, q: 65 },
  { size: 512, fps: 15, q: 55 },
  { size: 448, fps: 15, q: 50 },
  { size: 448, fps: 15, q: 40 },
  { size: 384, fps: 12, q: 50 },
  { size: 320, fps: 12, q: 45 },
];

let patched = false;

export function installAudioStickerPatch() {
  if (patched) return;
  const M = proto.Message;
  const S = M.StickerMessage;

  if (!Object.prototype.hasOwnProperty.call(M.prototype, 'audioStickerMessage')) {
    const encMessage = M.encode;
    M.encode = function (m, w) {
      w = encMessage.call(this, m, w);
      if (m && m.audioStickerMessage) {
        M.FutureProofMessage.encode(
          m.audioStickerMessage,
          w.uint32((FIELD_AUDIO_STICKER << 3) | 2).fork()
        ).ldelim();
      }
      return w;
    };
  }

  if (!Object.prototype.hasOwnProperty.call(S.prototype, 'audioMessage')) {
    const encSticker = S.encode;
    S.encode = function (m, w) {
      w = encSticker.call(this, m, w);
      if (m && m.audioMessage) {
        M.AudioMessage.encode(
          m.audioMessage,
          w.uint32((FIELD_STICKER_AUDIO << 3) | 2).fork()
        ).ldelim();
      }
      return w;
    };
  }
  patched = true;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args);
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('error', reject);
    p.on('close', (code) => {
      if (code === 0) return resolve();
      const tail = err.split('\n').filter(Boolean).slice(-2).join(' ');
      reject(new Error(tail || `${cmd} keluar dengan kode ${code}`));
    });
  });
}

function probe(args) {
  return new Promise((resolve, reject) => {
    execFile('ffprobe', ['-v', 'error', ...args], (err, stdout) => (err ? reject(err) : resolve(String(stdout).trim())));
  });
}

async function toOpus(inputBuffer, maxSeconds) {
  const id = crypto.randomBytes(6).toString('hex');
  const inFile = path.join(tempDir, `${id}.tmp`);
  const outFile = path.join(tempDir, `${id}.ogg`);
  try {
    await fs.promises.writeFile(inFile, inputBuffer);
    const streams = await probe(['-select_streams', 'a', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', inFile]);
    if (!streams) throw new Error('File ini tidak punya suara');

    await run('ffmpeg', [
      '-y', '-i', inFile, '-vn', '-t', String(maxSeconds),
      '-c:a', 'libopus', '-b:a', '32k', '-ac', '1', '-ar', '48000',
      '-vbr', 'on', '-compression_level', '10', '-frame_duration', '20',
      '-avoid_negative_ts', 'make_zero',
      '-f', 'ogg', outFile,
    ]);

    const buffer = await fs.promises.readFile(outFile);
    let seconds = maxSeconds;
    try {
      const d = parseFloat(await probe(['-show_entries', 'format=duration', '-of', 'csv=p=0', outFile]));
      if (Number.isFinite(d) && d > 0) seconds = Math.min(maxSeconds, Math.max(1, Math.round(d)));
    } catch { /* pakai maxSeconds */ }
    return { buffer, seconds };
  } finally {
    for (const f of [inFile, outFile]) if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}


async function videoToWebpFit(videoBuffer) {
  const id = crypto.randomBytes(6).toString('hex');
  const inFile = path.join(tempDir, `${id}.mp4`);
  const made = [];
  let tries = 0;

  const encode = async (i) => {
    const { size, fps, q } = LADDER[i];
    const out = path.join(tempDir, `${id}_${i}.webp`);
    made.push(out);
    tries++;
    await run('ffmpeg', [
      '-y', '-i', inFile,
      '-vf', `scale=${size}:${size}:force_original_aspect_ratio=decrease:flags=lanczos,fps=${fps},format=yuva420p,pad=${size}:${size}:(ow-iw)/2:(oh-ih)/2:color=black@0.0`,
      '-vcodec', 'libwebp', '-lossless', '0', '-q:v', String(q), '-compression_level', '4',
      '-loop', '0', '-t', String(MAX_VIDEO_SECONDS), '-an', '-fps_mode', 'passthrough', out,
    ]);
    return { i, out, bytes: fs.statSync(out).size };
  };

  try {
    await fs.promises.writeFile(inFile, videoBuffer);
    let best = null;
    const first = await encode(0);
    if (first.bytes <= TARGET_BYTES) {
      best = first;
    } else {
      let lo = 1, hi = LADDER.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const r = await encode(mid);
        if (r.bytes <= TARGET_BYTES) { best = r; hi = mid - 1; } else { lo = mid + 1; }
      }
    }
    if (!best) throw new Error('Video terlalu rumit untuk stiker (di atas 1 MB walau kualitas diturunkan). Pakai video yang lebih pendek/sederhana');
    const { size, fps, q } = LADDER[best.i];
    console.log(`[SAUDIO] ${size}px fps${fps} q${q} -> ${Math.round(best.bytes / 1024)} KB (${tries}x encode)`);
    return await fs.promises.readFile(best.out);
  } finally {
    for (const f of [inFile, ...made]) if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

export async function sendAudioSticker(hc, jid, mediaBuffer, { packname, author, audioBuffer, isVideo = true } = {}) {
  installAudioStickerPatch();
  if (!isVideo && !audioBuffer) throw new Error('Gambar tidak punya suara. Reply audio dengan gambar + caption perintah');
  const maxSeconds = isVideo ? MAX_VIDEO_SECONDS : MAX_IMAGE_SECONDS;

  const buatWebp = async () => {
    const sumber = isVideo ? await videoToWebpFit(mediaBuffer) : mediaBuffer;
    const webpPath = await writeExif(sumber, { packname, author });
    
    try { return await fs.promises.readFile(webpPath); } finally { if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath); }
  };
  
  const buatSuara = () => toOpus(audioBuffer || mediaBuffer, maxSeconds);
  
  let webp, suara;
  if (isVideo) {
    webp = await buatWebp();
    suara = await buatSuara();
  } else {
    [webp, suara] = await Promise.all([buatWebp(), buatSuara()]);
  }
  if (webp.length > MAX_STICKER_BYTES) throw new Error('Stiker lebih dari 1 MB (batas WhatsApp), pakai media yang lebih pendek/sederhana');
  
  const { buffer: opus, seconds } = suara;
  const upload = hc.waUploadToServer;
  const [st, au] = await Promise.all([
    prepareWAMessageMedia(
      { sticker: webp, mimetype: 'image/webp', isAnimated: isVideo, width: 512, height: 512 },
      { upload }
    ),
    prepareWAMessageMedia(
      { audio: opus, mimetype: 'audio/ogg; codecs=opus', ptt: true, seconds },
      { upload }
    ),
  ]);
  
  const stickerMessage = { ...st.stickerMessage, audioMessage: au.audioMessage };
  const content = {
    audioStickerMessage: { message: { stickerMessage } },
    messageContextInfo: { messageSecret: crypto.randomBytes(32) },
  };
  const msg = generateWAMessageFromContent(jid, content, { userJid: hc.user.id });
  await hc.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}
