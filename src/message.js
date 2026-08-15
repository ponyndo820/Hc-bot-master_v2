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
  if (!m.messageStubType || !m.isGroup) return;
  if (global.db?.groups?.[m.chat] && store?.groupMetadata?.[m.chat]) {
    const admin = `@${m.sender.split('@')[0]}`;
    const metadata = store.groupMetadata[m.chat];
    const normalizedTarget = clearParse(m.messageStubParameters[0]);
    const type = m.messageStubType; // FIXED: Typo messageStupType
    const messages = {
      1: 'mereset link grup!',
      2: `mengubah Subject Grup menjadi :\n*${normalizedTarget}*`,
      3: 'telah mengubah icon grup.',
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
      await sock.sendMessage(m.chat, {
          text: `${admin} ${messages[type]}`, 
          mentions: [m.sender, ...((normalizedTarget?.id || normalizedTarget)?.includes('@') ? [`${normalizedTarget.id || normalizedTarget}`] : [])].filter(Boolean)
      }, { 
          ephemeralExpiration: m.expiration || m?.metadata?.ephemeralDuration || store?.messages[m.chat]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0
      });
    }
    
    if (type === 20) {
      clearTimeout(groupMetadataTimers[m.chat])
      groupMetadataTimers[m.chat] = setTimeout(async () => {
        store.groupMetadata[m.chat] = await sock.groupMetadata(m.chat).catch(e => ({ ...store.groupMetadata[m.chat] }));
      }, 5000);
    } else if (type === 8 || type === 9) {
      const target = jidNormalizedUser(normalizedTarget.id || normalizedTarget);
      const newAdminValue = type === 8 ? 'admin' : null;
      
      if (metadata?.participants?.length) {
        metadata.participants = metadata.participants.map(p => {
          const key = metadata.addressingMode === 'lid' ? jidNormalizedUser(p.id) : jidNormalizedUser(p.phoneNumber);
          if (key === target) {
            return { ...p, admin: newAdminValue };
          }
          return p;
        });
      }
    } else if (type === 27) {
      if (!metadata.participants.some(a => (a.id === (normalizedTarget.id || normalizedTarget) || a.phoneNumber === (normalizedTarget.id || normalizedTarget)))) {
        clearTimeout(groupMetadataTimers[m.chat])
        groupMetadataTimers[m.chat] = setTimeout(async () => {
          store.groupMetadata[m.chat] = await sock.groupMetadata(m.chat).catch(e => ({ ...store.groupMetadata[m.chat] }));
        }, 5000);
      } else if (type === 28 || type === 32) {
        if (m.fromMe && ((jidNormalizedUser(sock.user.id) == (normalizedTarget.id || normalizedTarget)) || (jidNormalizedUser(sock.user.lid) == (normalizedTarget.id || normalizedTarget)))) {
          delete store.messages[m.chat];
          delete store.presences[m.chat];
          delete store.groupMetadata[m.chat];
        }
        if(!!metadata) metadata.participants = metadata.participants.filter(p => {
          const key = metadata.addressingMode === 'lid' ? jidNormalizedUser(p.id) : jidNormalizedUser(p.phoneNumber);
          return key !== (normalizedTarget.id || normalizedTarget);
        });
      } else {
        console.log({
          messageStubType: m.messageStubType, type,
          messageStubParameters: m.messageStubParameters,
        });
      }
    }
  }
}

async function GroupParticipantsUpdate(sock, update, store) {
  try {
    const { id, participants, author, action } = update;
    
    function updateAdminStatus(updateParticipants, metadataParticipants, status) {
      for (const participant of metadataParticipants) {
        if (updateParticipants.includes(jidNormalizedUser(participant.id)) || updateParticipants.includes(jidNormalizedUser(participant.phoneNumber))) {
          participant.admin = status;
        }
      }
    }

    if (global.db?.groups?.[id] && store?.groupMetadata?.[id]) {
      const metadata = store.groupMetadata[id];
      
      for (let n of participants) {
        const jid = typeof n === 'string' ? n : n.id;
        let profile;
        try {
          profile = await sock.profilePictureUrl(jid, 'image');
        } catch {
          profile = 'https://telegra.ph/file/95670d63378f7f4210f03.png';
        }
        
        let messageText;
        const participant = metadata?.participants?.find(p => p.id === jid);
        
        if (action === 'add') {
          if (global.db.groups[id]?.welcome) messageText = global.db.groups[id].text?.setwelcome || `Welcome to ${metadata.subject}\n@`;
          if (!participant) {
            clearTimeout(groupMetadataTimers[id])
            groupMetadataTimers[id] = setTimeout(async () => {
              store.groupMetadata[id] = await sock.groupMetadata(id).catch(e => ({ ...store.groupMetadata[id] }));
            }, 5000);
          }
        } else if (action === 'remove') {
          if (global.db.groups[id]?.leave) messageText = global.db.groups[id]?.text?.setleave || `@\nLeaving From ${metadata.subject}`;
          if ((jidNormalizedUser(sock.user.lid) == jidNormalizedUser(jid)) || (jidNormalizedUser(sock.user.id) == jidNormalizedUser(jid))) {
            delete store.messages[id];
            delete store.presences[id];
            delete store.groupMetadata[id];
          }
          if(metadata) metadata.participants = metadata.participants.filter(p => !participants.includes(metadata.addressingMode == 'lid' ? jidNormalizedUser(p.id) : jidNormalizedUser(p.phoneNumber)));
        } else if (action === 'promote') {
          if (global.db.groups[id]?.promote) messageText = global.db.groups[id]?.text?.setpromote || `#\nPromote From ${metadata.subject}\nBy @admin`;
          updateAdminStatus(participants, metadata.participants, 'admin');
        }

        if (messageText && sock.public) {
          await sock.sendMessage(id, {
            text: messageText.replace('@subject', metadata.subject).replace('@admin', author ? `@${author.split('@')[0]}` : '@admin').replace(/(?<=\s|^)@(?!\w)/g, `@${jid.split('@')[0]}`),
            contextInfo: {
              mentionedJid: [jid, author].filter(Boolean),
              externalAdReply: {
                title: action == 'add' ? 'Welcome' : action == 'remove' ? 'Leaving' : action.charAt(0).toUpperCase() + action.slice(1),
                mediaType: 1,
                previewType: 0,
                thumbnailUrl: profile,
                renderLargerThumbnail: true,
                sourceUrl: global.my?.gh || '' 
              }
            }
          }, { ephemeralExpiration: metadata?.ephemeralDuration || store?.messages[id]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 });
        }
      }
    }
  } catch (e) {
    throw e;
  }
}
async function MessagesUpsert(sock, message, store) {
  try {
    let botNumber = await sock.decodejid(sock.user.id);
    const msg = message.messages[0]
    if ((msg?.messageTimestamp * 1000) < botStartTime) return;
    const remotejid = msg.key.remotejid;
    (store.message ??= {})[remotejid] ??= {};
    store.messages[remotejid].array ??= [];
    store.messages[remotejid].keyId ??= new Set();
    if (!(store.messages[remotejid].keyId instanceof Set)) {
      store.messages[remotejid].keyId = new Set(store.messages[remotejid].array.map(m => m.key.id));
    }
    if (store.messages[remotejid].keyId.has(msg.key.id)) return;
    store.message[remotejid].array.push(msg);
    store.message[remotejid].keyId.add(msg.key.id);
    if (!store.groupMetadata || Object.keys(store.groupMetadata).length === 0) store.groupMetadata ??= await sock.groupFetchAllPartucipating().catch(e => ({}));
    const type = msg.message ? (getContentType(msg.message) || Object.keys(msg.message)[0]) : '';
    const m = await Serialize(sock, msg, store);
    if (sockHandler) {
      sockHandler(sock, m, msg, store);
    } else {
      await reloadSock();
      if (sockHandler) sockHandler(sock, m, msg, store);
    }
    if (global.db?.set?.[botNumber]?.readsw && msg.key.remotejid === 'status@broadcast') {
      
    }
  }
}

export {
  GroupUpdate,
  MessagesUpsert,
  GroupParticipantsUpdate,
}
// Follow akun ig ponyndo1_original dulu gak sih
// Sampai di sini dulu esok lanjut lagi 
