/*
   * Hc.js
   * By Heart candy
   * Sc ini open source
*/
import fs from 'fs';
import path from 'path';
import chalk from 'chalk'; 
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
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
      }
      break
      // Owner Menu
      case 'shutdown': case 'off': {
        if (!isCreator) reply(setting.mess.owner)
        reply(`*[Bot] Process Shutdown...*`).then(() => {
          process.exit(0)
        })
      }
      break
      
      // Quotes Menu
      case 'quotes': {
        try {
          const rawData = fs.readFileSync('./lib/quotes.json', 'utf-8');
          const data = JSON.parse(rawData);
          const quotesList = data && data.quotes;
          if (!Array.isArray(quotesList) || quotesList.length === 0){
            return await reply('Maaf ada masalah teknis atau data kosong!');
          }
          const randomItem = quotesList[Math.floor(Math.random() * quotesList.length)];
          const textQuote = randomItem.quotes || 'Tidak ada quotes';
          const caption = `*By: Heart candy*\n${textQuote}`;
          await reply(caption);
        } catch (err) {
          console.error(err);
          await reply('Terjadi kesalahan saat membaca database❗');
        }
      }
      break;
      
    }
  } catch (err) {
    console.error("[ERROR HC.js]", err);
  }
}

export { Hc };
