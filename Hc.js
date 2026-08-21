/*
   * Hc.js
   * By Heart candy
   * Sc ini open source
*/
import fs from 'fs';
import path from 'path';
import chalk from 'chalk'; 
import speed from 'performance-now';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { getContentType, downloadMediaMessage } from '@whiskeysockets/baileys';

import settings from './settings.js';
import { writeExif } from './lib/converter.js';

async function Hc(hc, m, db) {
  try {
    if (!m.message) return;
    
    let msg = m.message;
    if (msg.ephemeralMessage) msg = msg.ephemeralMessage.message;
    if (msg.viewOnceMessage) msg = msg.viewOnceMessage.message;
    if (msg.viewOnceMessageV2) msg = msg.viewOnceMessageV2.message;
    
    const type = getContentType(msg);
    if (!type) return;
    
    const body = (type === 'conversation') ? msg.conversation : 
    (type === 'extendedTextMessage') ? msg.extendedTextMessage?.text :
    (type === 'imageMessage') ? msg.imageMessage?.caption : 
    (type === 'videoMessage') ? msg.videoMessage?.caption : 
    (type === 'interactiveResponMessage' && m.quoted) ? (m.message.interactiveResponseMessage?.nativeFlowResponseMessage?.singleSelectReply.selectrdRowId || '') : '';
               
    if (!body) return;
    
    const prefixUsed = settings.prefix.find(p => body.startsWith(p));
    if (!prefixUsed) return;
    
    const sender = m.key.remoteJid;
    const command = body.slice(prefixUsed.length).trim().split(/ +/).shift().toLowerCase();
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(' ');
    const prefix = prefixUsed;
    
    const reply = async (text) => {
      return await hc.sendMessage(sender, { text }, { quoted: m });
    };
    
    const participant = m.key.participant || sender; 
    const isCreator = m.key.fromMe || settings.ownerNumber.some(owner => participant.includes(owner));
    
    const contextInfo = m.message.extendedTextMessage?.contextInfo || m.message.imageMessage?.contextInfo || m.message.videoMessage?.contextInfo;
    const isQuoted = !!contextInfo?.quotedMessage;
    const quoted = isQuoted ? contextInfo.quotedMessage : msg;
    const quotedType = getContentType(quoted);
    const mime = quoted[quotedType]?.mimetype || '';
    const qmsg = isQuoted ? { message: quoted } : m;
    
    const author = settings.author || 'Heart candy';
    const packname = settings.packname || 'ponyndo';
    const botname = settings.botName?.[0] || 'Hc-bot';

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
        reply(settings.mess.fitur)
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
          const caption = `*By: Heart candy*\n*${arabic}*\n\n_Artinya: ${arti}_`;
          reply(caption);
        } catch (err) {
          console.error(err);
          reply('Terjadi Kesalahan saat membaca database❗')
        }
      }
      break
      // Tools Menu
      case 'sticker': case 'stiker': case 's': case 'stickergif': case 'stikergif': case 'sgif': case 'stickerwm': case 'swm': case 'curi': case 'colong': case 'take': case 'stickergifwm': case 'sgifwm': {
        if (!/image|video|sticker/.test(quotedType)) return reply(`Kirim/reply gambar/video/gif dengan caption ${prefix + command}\nDurasi Image/Video/Gif 1-9 Detik`);
        const targetMsg = isQuoted ? { key: m.key, message: quoted } : m;
        let mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});
        let teks1 = text.split('|')[0] || packname;
        let teks2 = text.split('|')[1] || author;
        let stickerFile = await writeExif(mediaBuffer, { packname: teks1, author: teks2 });
        await hc.sendMessage(sender, { sticker: { url: stickerFile } },
        { quoted: m });
        if (fs.existsSync(stickerFile)) fs.unlinkSync(stickerFile);
      }
      break
      case 'speedtest': case 'speed': {
        reply('Testing Speed...')
        let cp = require('child_process')
        let { promisify } = require('util')
        let exec = promisify(cp.exec).bind(cp)
        let o
        try {
          o = await exec('python3 speed.py --share')
        } catch (e) {
          o = e
        } finally {
          let { stdout, stderr } = o
          if (stdout.trim()) reply(stdout)
          if (stderr.trim()) reply(stderr)
        }
      }
      break
      
      
    } // Penutup case command
  } catch (err) {
    console.error("[ERROR HC.js]", err);
  }
}

export { Hc };
