
import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';
import chalk from 'chalk';
import crypto from 'crypto';
import chokidar from 'chokidar';
import FileType from 'file-type';
import { fileURLToPath } from 'url';
import PhoneNumber from 'awesome-phonenumber';
import { jidNormalizedUser, proto, getBinaryNodeChildren, getBinaryNodeChildString, getBinaryNodeChild, generateMessageIDV2, jidEncode, encodeSignedDeviceIdentity, generateWAMessageContent, generateForwardMessageContent, prepareWAMessageMedia, delay, areJidsSameUser, extractMessageContent, generateMessageID, downloadContentFromMessage, generateWAMessageFromContent, jidDecode, generateWAMessage, toBuffer, getContentType, getDevice } from '@whiskeysockets/baileys';


import '../settings.js';
import { checkStatus } from './database.js';
import { imageToWebp, videoToWebp, writeExif, gifToWebp, getBuffer, getSizeMedia, fetchJson, sleep, axiosss, fixBytes } from '../lib/function.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hcPath = fileURLToPath(new URL('../Hc.js', import.mete.url));

let hcHandler = null;
const botStartTime = Date.now();
const groupMetadataTimers = {};
const reloadHandler = async () => {
  try {
    chHandler = (await import(`../Hc.js?update=${Date.now()}`)).default;
  } catch (err) {
    console.error(chalk.redBright(`[ERROR] ${err}`));
  }
};

reloadHandler();

async function GroupUpdate(hc, m, store) {
  function clearParse(parse) {
    try {
      return JSON.parse(parse);
    } catch {
      return parse;
    }
  }
  if (!m.messageStubType || !m.isGroup) return
  if (settings.db?.groups?.[m.chat] && store?.groupMetadata?.[m.chat]) {
    const admin = `@${m.sender.split('@')[0]}`
    const metadata = store.groupMetadata[m.chat];
    const normalizedTarget = clearParse(m.messageStubParameters[0]);
    const type = m.messageStubType;
    const messages = {
      1: 'mereset link grup❗',
      21: `mengubah Subject Grup menjadi :\n*${normalizedTarget}*`,
      22: 'telah mengubah icon grup.',
      23: 'mereset link grup ❗',
      24: `mengubah deskripsi grup.\n\n${normalizedTarget}`,
      25: `telah mengatur agar &${normalizedTarget == 'on'?'hanya admin' : 'semua peserta'}* yang dapat mengedit info grup.`,
      26: `telah *${normalizedTarget == 'on' ? 'menutup' : 'membuka'}* grup!\nSekarang ${normalizedTarget == 'on' ? 'hanya admin yang' : 'semua peserta'} dapat mengirim pesan.`,
			29: `telah menjadikan @${normalizedTarget?.id?.split('@')?.[0]} sebagai admin.`,
			30: `telah memberhentikan @${normalizedTarget?.id?.split('@')?.[0]} dari admin.`,
			72: `mengubah durasi pesan sementara menjadi *@${normalizedTarget}*`,
			123: 'menonaktifkan pesan sementara.',
			132: 'mereset link grup!',
			172: `@${normalizedTarget?.pn?.split('@')?.[0]} meminta bergabung`,
    }
    if (hc.public && settings.db?.groups?.[m.chat]?.setinfo && messages[type]) {
      await hc.sendMessage(m.chat, { text: `${admin} ${messages[type]}`, mentions: [m.sender, ...((normalizedTarget?.id || normalizedTarget)?.include('@')?[`${normalizedTarget.id || normalizedTarget}`] : [])].filter(Boolean)}, { ephemeralExpiration: m.expiration || m?.metadata?.ephemeralDuration || store?.messages[m.chat]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 })
    }
    if (type === 20) {
      clearTimeout(groupMetadataTimers[m.chat])
      groupsMetadataTimers[m.chat] = setTimeout(async () => {
        store.groupMetadata[m.chat] = await ch.groupsMetadata(m.chat).catch(e => ({ ...store.groupMetadata[m.chat] }));
      }, 5000);
    } else if (type === 29 || type === 30) {
      const target = jidNormalizeduser(normalizedTarget.id || normalizedTarget)
      /* 
        Oke sampai disini dulu esok lanjut lagi, punggung gw sakit jir ☕🗿
      */
    }
    
  }
}

