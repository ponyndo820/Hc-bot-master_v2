import fs from 'fs';
import path from 'path';
import Crypto from 'crypto';
import ff from 'fluent-ffmpeg';
import webp from 'node-webpmux';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { fileTypeFromFile } from 'file-type';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, '../database/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

async function imageToWebp(media) {
  const isPath = typeof media === 'string';
  const tmpFileIn = isPath ? media : path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);
  const tmpFileOut = path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  try {
    if (!isPath) await fs.promises.writeFile(tmpFileIn, media);
    await new Promise((resolve, reject) => {
      ff(tmpFileIn)
        .on('error', reject)
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vcodec', 'libwebp',
          '-vf', 'scale=500:500:force_original_aspect_ratio=decrease,setsar=1, pad=500:500:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse',
          '-loop', '0',
          '-preset', 'default'
        ])
        .toFormat('webp')
        .save(tmpFileOut);
    });
    return tmpFileOut;
  } catch (e) {
    if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut);
    throw new Error(`Terjadi kesalahan saat mengkonversi imageToWebp: ${e.message}`);
  } finally {
    if (!isPath && fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn);
  }
}

async function videoToWebp(media) {
  const isPath = typeof media === 'string';
  const tmpFileIn = isPath ? media : path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);
  const tmpFileOut = path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  try {
    if (!isPath) await fs.promises.writeFile(tmpFileIn, media);
    await new Promise((resolve, reject) => {
      ff(tmpFileIn)
        .on('error', reject)
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vcodec', 'libwebp',
          '-vf', "scale='min(320,iw)':'min(320,ih)':force_original_aspect_ratio=decrease,fps=20, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
          '-loop', '0',
          '-ss', '00:00:00',
          '-t', '00:00:05',
          '-preset', 'default',
          '-an', '-vsync', '0'
        ])
        .toFormat('webp')
        .save(tmpFileOut);
    });
    return tmpFileOut;
  } catch (e) {
    if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut);
    throw new Error(`Terjadi kesalahan saat mengkonversi video ke Webp: ${e.message}`);
  } finally {
    if (!isPath && fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn);
  }
}

async function gifToWebp(media) {
  const isPath = typeof media === 'string';
  const tmpFileIn  = isPath ? media : path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.gif`);
  const tmpFileOut = path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  try {
    if (!isPath) await fs.promises.writeFile(tmpFileIn, media);
    await new Promise((resolve, reject) => {
      ff(tmpFileIn)
        .on('error', reject)
        .on('end', () => resolve(true))
        .addOutputOptions([
          '-vf', 'scale=512:512:force_original_aspect_ratio=decrease',
          '-loop', '0',
          '-preset', 'default',
          '-an', '-vsync', '0'
        ])
        .toFormat('webp')
        .save(tmpFileOut);
    });
    return tmpFileOut;
  } catch (e) {
    if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut);
    throw new Error(`Error convert gifToWebp: ${e.message}`);
  } finally {
    if (!isPath && fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn);
  }
}

async function writeExif(media, data) {
  const isPath = typeof media === 'string';
  let tmpFileIn = isPath ? media : path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.tmp`);
  const tmpFileOut = path.join(tempDir, `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  try {
    if (!isPath) await fs.promises.writeFile(tmpFileIn, media);
    const anu = await fileTypeFromFile(tmpFileIn);
    if (!anu) throw new Error('Format file tidak dikenal');
    
    let wMedia;
    if (/webp/.test(anu.mime)) {
      wMedia = tmpFileIn;
    } else if (/image\/gif/.test(anu.mime)) {
      wMedia = await gifToWebp(tmpFileIn);
    } else if (/jpeg|jpg|png/.test(anu.mime)) {
      wMedia = await imageToWebp(tmpFileIn);
    } else if (/video/.test(anu.mime)) {
      wMedia = await videoToWebp(tmpFileIn);
    } else {
      throw new Error('Format tidak mendukung');
    }

    if (data) {
      const img = new webp.Image();
      const wra = data.pack_id ? data.pack_id : 'Heart candy';
      const wrb = data.packname ? data.packname : '@ponyndo';
      const wrc = data.author ? data.author : 'Hc';
      const wrd = data.categories ? data.categories : [''];
      const wre = data.isAvatar ? data.isAvatar : 0;

      const json = { 
        'sticker-pack-id': wra, 
        'sticker-pack-name': wrb, 
        'sticker-pack-publisher': wrc, 
        'emojis': wrd, 
        'is-avatar-sticker': wre 
      };

      const exifAttr = Buffer.from([
        0x49, 0x49, 0x2A, 0x00,
        0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x16, 0x00,
        0x00, 0x00
      ]);

      const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
      const exif = Buffer.concat([exifAttr, jsonBuff]);
      exif.writeUIntLE(jsonBuff.length, 14, 4);

      await img.load(wMedia);
      img.exif = exif;
      await img.save(tmpFileOut);

      if (wMedia !== tmpFileIn && fs.existsSync(wMedia)) fs.unlinkSync(wMedia);
      return tmpFileOut;
    }
    return wMedia;
  } catch (e) {
    throw new Error(`writeExif: ${e.message}`);
  } finally {
    if (!isPath && fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn);
  }
}

function ffmpeg(media, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    const isPath = typeof media === 'string';
    let tmp = isPath ? media : path.join(__dirname, '..database/temp', `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`);
    let out = path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext2}`);
    try {
      if (!isPath) await fs.promises.writeFile(tmp, media);
      spawn('ffmpeg', [
        '-y',
        '-i',
        tmp,
        ...args,
        out
      ])
      .on('error', (err) => {
        if (!isPath && fs.existsSync(tmp)) fs.unlinkSync(tmp);
        if (fs.existsSync(out)) fs.unlinkSync(out);
        reject(err);
      })
      .on('close', async (code) => {
        try {
          if (code !== 0) throw new Error(`FFmpeg exited with code ${code}`);
          resolve(out);
        } catch (e) {
          if (fs.existsSync(out)) fs.unlinkSync(out);
          reject(e);
        } finally {
          if (!isPath && fs.existsSync(tmp)) fs.unlinkSync(tmp);
        }
      });
    } catch (e) {
      if (!isPath && fs.existsSync(tmp)) fs.unlinkSync(tmp);
      reject(e);
    }
  })
}

function ffmpeg2(media, args = [], ext = '', ext2 = '') {
  return new Promise(async (resolve, reject) => {
    const isPath = typeof media === 'string';
    let tmp = isPath ? media : path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext}`);
    let out = path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.${ext2}`);
    try {
      if (!isPath) await fs.promises.writeFile(tmp, media);
      spawn('ffmpeg', [
        '-y',
        '-i',
        tmp,
        ...args,
        out
      ])
      .on('error', (err) => {
        if (!isPath && fs.existsSync(tmp)) fs.unlinkSync(tmp);
        if (fs.existsSync(out)) fs.unlinkSync(out);
        reject(err);
      })
        .on('close', async (code) => {
          try {
            if (code !== 0) throw new Error('FFmpeg exited with code ${code}');
            const resultBuffer = await fs.promises.readFile(out);
            resolve(resultBuffer);
          } catch (e) {
            reject(e);
          } finally {
            if (!isPath && fs.existsSync(tmp)) fs.unlinkSync(tmp);
            if (fs.existsSync(out)) fs.unlinkSync(out); 
          }
        })
      
    } catch (e) {
      if (!isPath && fs.existsSync(tmp)) fs.unlinkSync(tmp);
      reject(e); 
    }
  })
}

function toAudio(media, ext) {
  return ffmpeg(media, ['-vn', '-ac', '2', '-b:a', '128k', 'ar', '44100', '-f', 'mp3',], ext, 'mp3')
}

function toPTT(media, ext) {
	return ffmpeg2(media, ['-vn', '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-compression_level', '10'], ext, 'opus')
}

function toVideo(media, ext) {
	return ffmpeg(media, ['-c:v', 'libx264', '-c:a', 'aac', '-ab', '128k', '-ar', '44100', '-crf', '32', '-preset', 'slow'], ext, 'mp4')
}

export {
  toPTT,
  ffmpeg,
  ffmpeg2,
  toAudio,
  toVideo,
  writeExif,
  gifToWebp,
  imageToWebp,
  videoToWebp
};
