
import fs from 'fs';
import path from 'path';
import https from 'https';
import axios from 'axios';
import chalk from 'chalk';
import crypto from 'crypto';
import chokidar from 'chokidar';
// import FileType from 'file-type';
import { fileURLToPath } from 'url';
import PhoneNumber from 'awesome-phonenumber';
import { jidNormalizedUser, proto, getBinaryNodeChildren, getBinaryNodeChildString, getBinaryNodeChild, generateMessageIDV2, jidEncode, encodeSignedDeviceIdentity, generateWAMessageContent, generateForwardMessageContent, prepareWAMessageMedia, delay, areJidsSameUser, extractMessageContent, generateMessageID, downloadContentFromMessage, generateWAMessageFromContent, jidDecode, generateWAMessage, toBuffer, getContentType, getDevice } from '@whiskeysockets/baileys';


import '../settings.js';
import { checkStatus } from './database.js';
import { imageToWebp, videoToWebp, writeExif, gifToWebp,} from '../lib/converter.js';
import { getBuffer, getSizeMedia, fetchJson, sleep, axiosss, fixBytes } from '../lib/function.js'


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const hcPath = fileURLToPath(new URL('../Hc.js', import.meta.url));

let hcHandler = null;
const botStartTime = Date.now();
const groupMetadataTimers = {};
const reloadHandler = async () => {
  try {
    hcHandler = (await import(`../Hc.js?update=${Date.now()}`)).default;
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
  if (global.db?.groups?.[m.chat] && store?.groupMetadata?.[m.chat]) {
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
      const newAdminValue = type === 29 ? 'admin' : null
      if (metadata.participants?.length) {
        metadata.participants = metadata.participants.map(p => {
          const key = metadata.addressingMode === 'lid' ? jidNormalizedUser(p.id) : jidNormalizedUser(p.phoneNumber)
          if (key === target) {
            return { ...p, admin: newAdminValue }
          }
          return p
        })
      }
    } else if (type === 27) {
      if (!metadata.participants.some(a => (a.id === (normalizedTarget.id || normalizedTarget) || a.phoneNumber === (normalizedTarget.id || normalizedTarget)))) {
        clearTimeout(groupMetadataTimers[m.chat])
        groupMetadataTimers[m.chat] = setTimeout(async () => {
          store.grouoMetadata[m.chat] = await hc.grouoMetadata(m.chat).catch(e => ({ ...store.grouoMetadata[m.chat] }));
        }, 5000);
      }
    } else if (type === 28 || type === 32) {
      if (m.fromMe && ((jidNormalizedUser(hc.user.id) == (normalizedTarget.id || normalizedTarget)) || (jidNormalizedUser(hc.user.lid) == (normalizedTarget.id || normalizedTarget)))) {
        delete store.messages[m.chat];
        delete store.presences[m.chat];
        delete store.groupMetadata[m.chat];
      }
      if(!!metadata) metadata.participants = metadata.participants.filter(p => {
        const key = metadata.addressingMode === 'lid' ? jidNormalizedUser(p.id) : jidNormalizedUser(p.phoneNumber)
        return key !== (normalizedTarget.id || normalizedTarget)
      });
    } else {
      console.log({
        messageStubType: m.messageStubType, type,
        messageStubParameters: m.messageStubParameters,
      })
    }
  }
}

/* async function GroupParticipantsUpdate(hc,update store) {
  try {
    const { id, participants, author, action } = update;
    function updateAdmminStatus(participants,metadataParticipants, status) {
      for (const participants of metadataParticipants)
      if (participants.include(jidNormalizedUser(participant.id)) || participants.includes(jidNormalizedUser(participant.phoneNumber))) {
        participant.admin = status;
      }
    }
  }
  if (global.db?.group?.[id] && store?.groupMetadata?.[id]) {
    const metadata = store.groupMetadata[id];
    for (let n of participant) {
      const jid = typeof n === 'string'? n : (n?.phoneNumber || n?.id ||'');
      const participant = metadata.participants.find(a => a.id == jidNormalizedUser(jid))
      let profile;
      try {
        profile = await hc.profilePictureUrl(jid, 'image');
      } catch {
        profile = 'https://telegra.ph/file/95670d63378f7f4210f03.png';
      }
      let messageText;
      if (action === 'add') {
        if (global.db.groups[id]?.Welcome) messageText = global.db.groups[id]?.text?.setwelcome || `Welcome to ${metadata.subject}\n@`;
        if (!participant) {
          clearTimeout(groupMetadataTimers[id])
          groupMetadataTimers[id] = setTimeout(async () => {
            store.groupMetadata[id] await hc.grouoMetadata(id).catch(e => ({ ...store.groupMetadata[id] }));
          }, 5000);
        }
      } else if (action === 'remove') {
        if (global.db.groups[id]?.leave) messageText = global.db.groups[id]?.text?.setleave || `@\nLeaving From ${metadata.subject}`;
        if ((jidNormalizedUser(hc.user.lid) == jidNormalizedUser(jid)) || (jidNormalizedUser(hc.userid) == jidNormalizedUser(jid))) {
          
        }
      }
    }
  }
}
*/
export {
  GroupUpdate,
};

const watcher = chokidar.watch(hcPath, {
  ignored: /^\./,
  persistent: true,
  awaitWriteFinish: {
    stabilityThreshold: 100,
    pollInterval: 100
  }
})

watcher.on('change', async (filePath) => {
  console.log(chalk.yellowBright(`[UPDATE] ${filePath}`));
  await reloadHandler();
}); 

// Tanda ini // untuk mematikan fitur yang belum selesai di buat
