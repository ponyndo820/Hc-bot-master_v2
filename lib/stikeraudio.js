
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

const FIELD_AUDIO_STICKER = 134;
const FIELD_STICKER_AUDIO = 26;
const MAX_SECONDS = 5;
const MAX_STICKER_BYTES = 1024 * 1024;

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

async function videoToOpus(videoBuffer, maxSeconds = MAX_SECONDS) {
  const id = crypto.randomBytes(6).toString('hex');
  const inFile = path.join(tempDir, `${id}.mp4`);
  const outFile = path.join(tempDir, `${id}.ogg`);
  try {
    await fs.promises.writeFile(inFile, videoBuffer);
    const streams = await probe(['-select_streams', 'a', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0', inFile]);
    if (!streams) throw new Error('Video ini tidak punya suara');

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
    } catch {
      
    }
    return { buffer, seconds };
  } finally {
    for (const f of [inFile, outFile]) if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

export async function sendAudioSticker(hc, jid, videoBuffer, { packname, author } = {}) {
  installAudioStickerPatch();

  const webpPath = await writeExif(videoBuffer, { packname, author });
  let webp;
  try { webp = await fs.promises.readFile(webpPath); } finally { if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath); }
  if (webp.length > MAX_STICKER_BYTES) throw new Error('Stiker lebih dari 1 MB, pakai video yang lebih pendek/sederhana');

  const { buffer: opus, seconds } = await videoToOpus(videoBuffer);
  const upload = hc.waUploadToServer;
  const st = await prepareWAMessageMedia(
    { sticker: webp, mimetype: 'image/webp', isAnimated: true, width: 512, height: 512 },
    { upload }
  );
  const au = await prepareWAMessageMedia(
    { audio: opus, mimetype: 'audio/ogg; codecs=opus', ptt: true, seconds },
    { upload }
  );

  const stickerMessage = { ...st.stickerMessage, audioMessage: au.audioMessage };
  const content = {
    audioStickerMessage: { message: { stickerMessage } },
    messageContextInfo: { messageSecret: crypto.randomBytes(32) },
  };
  const msg = generateWAMessageFromContent(jid, content, { userJid: hc.user.id });
  await hc.relayMessage(jid, msg.message, { messageId: msg.key.id });
  return msg;
}
