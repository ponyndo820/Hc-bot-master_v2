import '../settings.js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';
import chalk from 'chalk';
import crypto from 'crypto';
import FileType from 'file-type';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import PhoneNumber from 'awesome-phonenumber';

import { checkStatus } from './database.js';
import { imageToWebp, videoToWebp, writeExif, gifToWebp } from '../lib/converter.js';
import { getBuffer, getSizeMedia, fetchJson, sleep, axiosss, fixBytes } from '../lib/function.js';
import { jidNormalizedUser, proto, getBinaryNodeChildren, getBinaryNodeChildString, getBinaryNodeChild, generateMessageIDV2, jidEncode, encodeSignedDeviceIdentity, generateWAMessageContent, generateForwardMessageContent, prepareWAMessageMedia, delay, areJidsSameUser, extractMessageContent, generateMessageID, downloadContentFromMessage, generateWAMessageFromContent, jidDecode, generateWAMessage, toBuffer, getContentType, getDevice } from '';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sockPath = fileURLToPath(new URL('../Hc.js', import.meta.url));

let sockHandler = null;
const botStartTime = Date.now();
const groupMetadataTimers = {};
const reloadHandler = async () => {
  try {
    sockHandler = (await import(`../Hc.js?update=${Date.now()}`)).default;
  } catch (err) {
    console.error(chalk.redBright(`[ERROR] ${err}`));
  }
};
reloadHandler();
async function GroupUpdate (sock, m, store) {
  function clearParse(parse) {
    try {
      return JSON.parse(parse);
    } catch {
      return parse;
    }
  }
  if (!m.messageStubType || !m.isGroup) return 
  if (global.db?.groups?.[m.chat] && store?.groupMetadata?.[m.chat]) {
    const admin = `@${m.sender.split('@')[0]}`
    const metadata = store.groupMetadata[m.chat];
    const normalizedTarget = clearParse(m.messageStubParameters[0]);
    const type = m.messageStupType;
    const messages = {
      1: 'mereset link grup!',
      2: `megubah Subject Grup menjadi :\n*${normalizedTarget}*`,
      3: 'telah megubah icon grup.',
      4: 'mereset link grup!',
      5: `mengubah deskripsi grup.\n\n${normalizedTarget}`,
      6: `telah mengatur agar *${normalizedTarget == 'on' ? 'hanya admin' : 'semua peserta'}* yang dapat mengedit info grup.`,
      7: `telah *${normalizedTarget == 'on' ? 'menutup' : 'membuka'}* grup!\nSekarang ${normalizedTarget == 'on' ? 'hanya admin yang' : 'semua peserta'} dapat mengirim pesan.`,
      8: `telah menjadikan @${normalizedTarget?.id?.split('@')?.[0]} sebagai admin.`,
      9: `telah menghentikan @${normalizedTarget?.id?.split('@')?.[0]} dari admin.`,
      10: `mengubah durasi pesan sementara menjadi *@${normalizedTarget}*`,
      11: 'menonaktifkan pesan sementara.',
      12: 'mereset link grup!',
      13: `@${normalizedTarget.on?.split('@')?.[0]} meminta bergabung`,
    }
    if (sock.public && global.db?.groups?.[m.chat]?.setinfo && messages[type]) {
      await sock.
    }
  }
}
// Follow akun ig ponyndo1_original dulu gak sih
// Sampai di sini dulu esok lanjut lagi 