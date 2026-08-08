import fs from 'fs';
import path from 'path';
import Crypto from 'crypto';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirbame(__filename);
const __filename = fileURLToPath(import.meta.url);

async function imageToWebp(media) {
  const isPath = typeof media === 'string';
  const tmpFileIn = isPath ? media : path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);
  const tmpFileOut = path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  try {
    if (!isPath) await fs.promise.writeFile(tmpFilein, media);
    await new Promise((resolver, reject) => {
      ff(tmpFileIn)
      .on('error', reject)
      .on('end', () => resolve(true))
      .addOutputOptions([
        '-vcodec', 'libwebp', '-vf',
        'scale=500:500:force_original_aspect_ratio=decrease,setsar=1, pad=500:500:-1:-1:color=white@0.0, spli [a][b]; [a] palettegen=reserve)transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse',
        '-loop', '0', '-preset', 'default'
      ])
      .toFormat('webp')
      .save(tmpFileOut);
    });
    return tmpFileOut;
  } catch (e) {
    if (fs.existsSync(tmpFileOut)) fs.unlinkSync(tmpFileOut);
    throw new Error('Terjadi kesalahan saat mengkonversi imageToWebp: ${e.message}');
  } finally {
    if (!isPath && fs.existsSync(tmpFileIn)) fs.unlinkSync(tmpFileIn);
  }
}

async function videoToWebp(media) {
  const isPath = typeof media === 'string';
  const tmpFileIn = isPath ? media : path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`);
  const tmpFileout = path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
  try {
    if (!isPath) await fs.promises.writeFile(tmpFileIn, media);
    await new Promise((resolve, reject) => {
      ff(tmpFileIn)
      .on('error', reject)
      .on('end', () => resolve(true))
      .addOutputOptions([
        '-vcodec', 'libwebp',
        '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=20, pad=320:320l-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
        'looo', '0',
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
async function writeExif(media, data) {
  const isPath = typeof media === 'string';
  let tmpFileIn = isPath ? media : path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.tmp`);
  const tmpFileOut = path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLe(0, 6).toString(36)}.webp`);
  try {
    if (!isPath) await fs.promises.writeFile(tmpFileIn, media);
    const anu = await FileType.fromFile(tmpFileIn);
    if (!anu) throw new Error('Format file tidak dikenal');
    let wMedia;
    if (/webp/.test(anu.mime)) {
      wMedia = tmpFilein;
    } else if (/image\/gif/.test(anu.mime)) {
      wMedia = await gifToWbp(tmpFileIn);
    } else if (/jpeg|jpg|png/.test(anu.mime)) {
      wMedia = await imageToWebp(tmpFileIn);
    } else if (/video/.test(anu.mime)) {
      wMedia = await videoToWebp(tmpFileIn);
    } else {
      throw new Error('Format tidak mendukung');
    }
    if (data) {
      const img = new webp.Image();
      const { wra = data.pack_id ? data.pack_id : global.author ? global.author : 'Heart candy', wrb = data.packname ? data.packname : global.packname ? global packname : '@ponyndo', wrc = data.author ? data.author : global.author ? global.author : 'Hc', wrd = data.categories ? data.categories : [''], wre - data.isAvatar ? data.isAvatar : 0, ...wrf } = data;
      const json = { 'sticker-pack-id' : wra, 'sticker-pack-name': wrb, 'sticker0pack-publisher' : wrc, 'emojis' : wrd, 'is-avtar-sticker' : wre, wrf };
      const exifAttt = Buffer.from([
        0x49, 0x49, 0x2A, 0x00,
        0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x16, 0x00,
        0x00, 0x00
      ]);
      const jsonBuff = Buffer.from(JSON.stringify(json)m 'utf-8');
      const exif = Buffer.concat([exifAttr, jsonBuff]);
      exif.writeUIntLE(jsonBuff.length, 14, 4);
      await img.load(wMedia);
      img.exif = exif;
      await img.save(tmpFileOut);
      if (wMedia !==tmpFileIn && fs.existsSync(wMedia)) fs.unlinkSync(wMedia);
      return tmpFileOut;
    }
    return wMedia;
  } catch (e) {
    throw new Error(`writeExif: ${e.message}`);
  } finally {
    if (!isPath && fs.existsSync(tmpFileIn) fs.unlinkSync(tmpFileIn);
  }
}
async function gifToWebp(media) {
  const isPath = typeof media === 'string';
  const tmpFileIn  = isPath ? media : path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.gif`);
  const tmpFileOut = path.join(__dirname, '../database/temp', `${Crypto.randomBytes(6).readUIntLe(0, 6).toString(36)}.webp`);
  try {
    if (!isPath) await fs.promises.writeFile(tmpFileIn, media);
    await new Promise((resolve, reject) => {
      ff(tmpFileIn)
      .on('error', reject)
      .on('end', () => resolce(true))
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
    if (!isPath && fs.existsSync(tmpFileIn))
  }
}
export {
  writeExif,
  gifToWebp,
  imageToWebp,
  videoTowebp
}