import { getContentType } from '@whiskeysockets/baileys';
import settings from './settings.js';

async function Hc(hc, m, db) {
  try {
    if (!m.message) return;
    
    let msg = m.message;
    if (msg.ephemeralMessage) msg = msg.ephemeralMessage.message;
    if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message;
    if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message;
    
    const type = getContentType(msg);
    if (!type) return;
    
    const body = (type === 'conversation') ? msg.conversation 
               : (type === 'extendedTextMessage') ? msg.extendedTextMessage?.text 
               : (type === 'imageMessage') ? msg.imageMessage?.caption 
               : (type === 'videoMessage') ? msg.videoMessage?.caption 
               : '';
               
    if (!body) return;
    
    const prefixUsed = settings.prefix.find(p => body.startsWith(p));
    if (!prefixUsed) return;
    
    const command = body.slice(prefixUsed.length).trim().split(/ +/).shift().toLowerCase();
    const sender = m.key.remoteJid;
    
    const reply = async (text) => {
      return await hc.sendMessage(sender, { text }, { quoted: m });
    };
    
    switch (command) {
      case 'tes': {
        await reply('Ya\nsayang');
        break;
      }
    }
  } catch (err) {
    console.error("[ERROR HC]", err);
  }
}

export { Hc };
