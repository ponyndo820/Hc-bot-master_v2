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
    
        const participant = m.key.participant || sender; 
        const isCreator = m.key.fromMe || settings.ownerNumber.some(owner => participant.includes(owner));
    
    switch (command) {
      case 'tes': {
        await reply('Ya\nsayang');
      }
      break
      
      // Owner Menu
      case 'shutdown': case 'off': {
        if (!isCreator) return reply(settings.mess.owner);
        reply(`*[Bot] Process Shutdown...*`).then(() => {
          process.exit(0);
        });
      }
      break
      case 'sc': case 'script': {
        reply return (settings.mess.fitur)
      }
      break
      case 'donasi': case 'donate': {
        reply('Donasi Dapat Melalui Url Dibawah ini :\nhttps://saweria.co/Ponyndo')
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
      break
      case 'quotesislami': {
        try {
          const rawData = fs.readFileSync('./lib/quotesislami.json', 'utf-8');
          const data = JSON.parse(rawData);
          if (!data || !Array.isArray(data) || data.length === 0){
            return reply('Maaf ada masalah teknis atau data kosong❗');
          }
          const randomQuote = data[Math.floor(Math.random() * data.length)];
          const { arabic = 'Tidak ada huruf Arab', arti = 'Tidak ada arti', title = 'Quotes Islami' } = randomQuote;
          const caption = `*By: Heart candy*\n*{arabic}*\n\n_Artinya: ${arti}_`;
          reply(caption);
        } catch (err) {
          console.error(err);
          reply('Terjadi Kesalahan saat membaca database❗')
        }
      }
      break
      
      
    }
  } catch (err) {
    console.error("[ERROR HC.js]", err);
  }
}

export { Hc };
