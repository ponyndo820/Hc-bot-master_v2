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
import { jidNormalizedUser, proto, getBinaryNodeChildren, getBinaryNodeChildString, getBinaryNodeChild, generateMessageIDV2, jidEncode, encodeSignedDeviceIdentity, generateWAMessageContent, generateForwardMessageContent, prepareWAMessageMedia, delay, areJidsSameUser, extractMessageContent, generateMessageID, downloadContentFromMessage, generateWAMessageFromContent, jidDecode, generateWAMessage, toBuffer, getContentType, getDevice } from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/*const sockPath = fileURLToPath(new URL('../Hc.js', import.meta.url));

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
reloadHandler();*/

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
/*21*/      2: `megubah Subject Grup menjadi :\n*${normalizedTarget}*`,
/*22*/      3: 'telah megubah icon grup.',
/*23*/      4: 'mereset link grup!',
/*24*/      5: `mengubah deskripsi grup.\n\n${normalizedTarget}`,
/*25*/      6: `telah mengatur agar *${normalizedTarget == 'on' ? 'hanya admin' : 'semua peserta'}* yang dapat mengedit info grup.`,
/*26*/      7: `telah *${normalizedTarget == 'on' ? 'menutup' : 'membuka'}* grup!\nSekarang ${normalizedTarget == 'on' ? 'hanya admin yang' : 'semua peserta'} dapat mengirim pesan.`,
/*29*/      8: `telah menjadikan @${normalizedTarget?.id?.split('@')?.[0]} sebagai admin.`,
/*30*/      9: `telah menghentikan @${normalizedTarget?.id?.split('@')?.[0]} dari admin.`,
 /*72*/     10: `mengubah durasi pesan sementara menjadi *@${normalizedTarget}*`,
/*123*/      11: 'menonaktifkan pesan sementara.',
/*132*/      12: 'mereset link grup!',
/*172*/     13: `@${normalizedTarget.on?.split('@')?.[0]} meminta bergabung`,
    }
    if (sock.public && global.db?.groups?.[m.chat]?.setinfo && messages[type]) {
      await sock.sendMessage(m.chat, {text: `${admin} ${messages[type]}`, mentions: [m.sender, ...((normalizedTarget?.id || normalizedTarget)?.includes('@') ? [`${normalizedTarget.id || normalizedTarget}`] : [])].filter(Boolean)}, { eohemeralExpiration: m.expiration || m?.metadata?.ephemeralDuration || store?.messages[m.chat]?.array?.sice(-1)[0]?.metadata?.ephemeralDuration || 0 })
    }
    if (type === 20) {
      clearTimeout(groupMetadataTimers[m.chat])
      groupMetadataTimers[m.chat] = setTimeout(async () => {
        store.groupMetadata[m.chat] = await sock.groupMetadata(m.chat).catch(e => ({ ...store.groupMetadata[m.chat] }));
      }, 5000);
    } else if (type === 8 || type === 9) {
      const target = jidNormalizedUser(normalizedTarget.id || normalizedTarget)
      const newAdmunValue = type === 8 ? 'admin' : null
      if (metadata?.participants?.length) {
        metadata.participants = metadata.participants.map(p => {
          const key = metadata.addressingMode === 'lid'?jidNormalizedUser(p.id) : jidNormalizedUser(p.phoneNumber)
          if (key === tatget) {
            return { ...p, admin: newAdminValue }
          }
          return p
        })
      }
    } else if (type === 27) {
      if (!metadata.participants.some(a => (a.id === (normalizedTarget.id || normalizedTarget) || a.phoneNumber === (normalizedTarget.id || normalizedTarget)))) {
        clearTimeout(groupMetadataTimers[m.chat])
        groupMetadataTimers[m.chat] = setTimeout(async () => {
          store.groupMetadata[m.chat] = await sock.groupMetadata(m.chat).catch(e => ({ ...store.groupMetadata[m.chat] }));
        }, 5000);
      } else if (type === 28 || type === 32) {
        if (m.fromMe && ((jidNormalizedUser(sock.user.id) == (normalizedTarget.id || normalizedTarget)) || (jiNomalizedUser(sock.user.lid) == (normalizedTarget.id || normalizedTarget)))) {
          delete store.messages[m.chat];
          delete store.presences[m.chat];
          delete store.groupMetadata[m.chat];
        }
        if(!!metadata) metadata.participants = metadata.participants.filter(p => {
          const key = metadata.addressingMode === 'lid' ? jidNormalizedUser(p.id) : jidNormalizedUser(p.phoneNumber)
          return key !== (normalizedTarget.id || normalizedTarget)
        });
      } else {
        consolelog({
          messageStubType: m.messageStubType, type,
          messageStubParameters: m.messageStubParameters,
        })
      }
    }
  }
}

async function GroupParticipantsUpdate(sock, update, store) {
  try {
    const { id, participants, author, action } = update;
    function updateAdminStatus(participants, metadataParticipants, status) {
      for (const participants of metadataParticipants) {
        if (participants.includes(jidNormalizedUser(participants.id)) || participants.includes(jidNormalizedUser(participantd.phoneNumber))) {
          participant.admin = status;
        }
      }
    }
    if (global.db?.groups?.[id] && store?.groupMetadata?.[id]) {
      const metadata = store.groupMetadata[id];
      for (let n of participants) {
        const jid = typeof n === 'string'
        let profile;
        try {
          profile = await sock.profilePictureUrl(jid, 'image');
        } catch {
          profile = 'https://telegra.ph/file/95670d63378f7f4210f03.png';
        }
        let messagesText;
        if (action === 'add') {
          if (global.db.groups[id]?.welcome) messageText = global.db.groups[id].text?.setwelcome || `Welcome to ${meradata.subject}\n@`;
          if (!participant) {
            clearTimeout(groupMetadataTimers[id])
            groupMetadataTimers[id] = setTimeout(async () => {
              store.groupMetadata[id] = await sock.groupMetadata(id).catch(e => {{ ...store.groupMetadata[id]}));
            }, 5000);
          }
        } else if (action === 'remove') {
          if (global.db.groups[id]?.leave) messageText = global.db.groups[id]?.text?.setleave || `@\nLeaving From ${metadata.subject}`;
          if ((jidNormalizedUser(sock.user.lid) == jidNormalizedUser(jid)) || (jidNormalizedUser(sock.user.id) == jidNormalizedUser(jid))) {
            delete store.messages[id];
            delete store.presences[id];
            delete store.groupMetadata[id];
          }
          if(metadata) metadata.participants = metadata.participants.filter(p => !participants.includes(metadata.addressingMode === 'lid' ? jidNormalizedUser(p.id) : jidNormalizedUser(p.phoneNumber)));
        } else if (action === 'promote') {
          if (global.db.groups[id]?.promote) messageText = global.db.groups[id]?.text?.setpromote || `@\nPtomote From ${metadata.subject}\nBy @admin`;
        }
      }
    }
  }
}

export {
  GroupUpdate,
}
// Follow akun ig ponyndo1_original dulu gak sih
// Sampai di sini dulu esok lanjut lagi 