import settings from './settings.js';

async function Hc(hc, m, db) {
  try {
    if (!m.message) return;
    
    const type = Object.keys(m.message)[0];
    const body = type === 'conversation' ? m.message.conversation 
               : type === 'extendedTextMessage' ? m.message.extendedTextMessage.text 
               : type === 'imageMessage' ? m.message.imageMessage.caption 
               : type === 'videoMessage' ? m.message.videoMessage.caption 
               : '';
               
    const prefixUsed = settings.prefix.find(p => body.startsWith(p));
    if (!prefixUsed) return;
    
    const command = body.slice(prefixUsed.length).trim().split(/ +/).shift().toLowerCase();
    const sender = m.key.remoteJid;

    switch (command) {
      case 'tes': {
        await hc.sendMessage(sender, { text: 'Ya\nsayang' }, { quoted: m });
        break;
      }
    }
  } catch (err) {
    console.error("[ERROR HC]", err);
  }
}

export { Hc };
