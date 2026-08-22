/*
   * Hc.js
   * By Heart candy
   * Sc ini open source
*/
import fs from 'fs';
import util from 'util';
import path from 'path';
import chalk from 'chalk'; 
import { promisify } from 'util';
import speed from 'performance-now';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { exec, spawn, execSync } from 'child_process';
import { getContentType, downloadMediaMessage, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

import settings from './settings.js';
import { writeExif, toAudio, toPTT, toVideo } from './lib/converter.js';

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
    const react = async (emoji) => {
      return await hc.sendMessage(sender, { react: { text: emoji, key: m.key } });
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
        await react('⏳');
        const targetMsg = isQuoted ? { key: m.key, message: quoted } : m;
        let mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});
        let teks1 = text.split('|')[0] || packname;
        let teks2 = text.split('|')[1] || author;
        let stickerFile = await writeExif(mediaBuffer, { packname: teks1, author: teks2 });
        await hc.sendMessage(sender, { sticker: { url: stickerFile } }, { quoted: m });
        if (fs.existsSync(stickerFile)) fs.unlinkSync(stickerFile);
      }
      break
      case 'speedtest': case 'speed': {
        reply('Testing Speed...');
        let o;
        try {
          const execPromise = promisify(exec);
          o = await execPromise('python3 speed.py --share');
        } catch (e) {
          o = e;
        } finally {
          let { stdout, stderr } = o || {};
          if (stdout && stdout.trim()) reply(stdout);
          if (stderr && stderr.trim()) reply(stderr);
        }
      }
      break
      case 'tovn': case 'toptt': case 'tovoice': {
        if (!/video|audio/.test(mime)) return reply(`Kirim/Reply Video/Audio Yang Ingin Dijadikan Audio Dengan Caption ${prefix + command}`);
        await react('⏳');
        const targetMsg = isQuoted ? { key: m.key, message: quoted } : m;
        let mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});
        try {
          let audioRes = await toPTT(mediaBuffer, 'mp4');
          let audioData = typeof audioRes === 'string' ? { url: audioRes } : audioRes;
          const waveform = new Uint8Array(Array.from({ length: 64 }, () => Math.floor(Math.random() * 100)));
          await hc.sendMessage(sender, { 
            audio: audioData, 
            mimetype: 'audio/ogg; codecs=opus', 
            ptt: true,
            waveform: waveform
          }, { quoted: m });
          if (typeof audioRes === 'string' && fs.existsSync(audioRes)) {
            fs.unlinkSync(audioRes);
          }
        } catch (e) {
          console.error(e);
          await reply('Gagal mengonversi media ke Voice Note!');
        }
      }
      break
      //Bot Menu
      case 'sc': case 'script': {
        reply(settings.mess.fitur)
      }
      break
      case 'donasi': case 'donate': {
        reply('Donasi Dapat Melalui Url Dibawah ini :\nhttps://saweria.co/Ponyndo')
      }
      break
      case 'tagme': {
        await reply(`@${m.sender.split('@')[0]}`, { mentions: [m.sender] })
      }
      break
      // Menu
      case 'menu': {
        const menuText = `*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *Menu*
│⭔ ${prefix}ownermenu
│⭔ ${prefix}quotesmenu
│⭔ ${prefix}toolsmenu
│⭔ ${prefix}allmenu
╰────❍`;

        const buttons = [
          { buttonId: `${prefix}ownermenu`, buttonText: { displayText: '👑 Owner Menu' }, type: 1 },
          { buttonId: `${prefix}quotesmenu`, buttonText: { displayText: '📜 Quotes Menu' }, type: 1 },
          { buttonId: `${prefix}toolsmenu`, buttonText: { displayText: '🛠️ Tools Menu' }, type: 1 }
        ];

        const buttonMessage = {
          text: menuText,
          footer: 'Tekan tombol di bawah untuk memilih menu',
          buttons: buttons,
          headerType: 1
        };

        await hc.sendMessage(sender, buttonMessage, { quoted: m });
      }
      break
      case 'botmenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *BOT MENU*
│⭔ ${prefix}sc
│⭔ ${prefix}donasi
╰────❍`)
      }
      break
      case 'ownermenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *OWNER MENU*
│⭔ ${prefix}shutdown
╰────❍`)
      }
      break
      case 'quotesmenu': {
       await reply(` *━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *QUOTES MENU*
│⭔ ${prefix}quotes
│⭔ ${prefix}quotesislami
╰────❍`)
      }
      break
      case 'toolsmenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *TOOLS MENU*
│⭔ ${prefix}tovn
│⭔ ${prefix}sticker
│⭔ ${prefix}speedtest
╰────❍`)
      }
      break
      case 'allmenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *ALL MENU*
│⭔ ${prefix}sc
│⭔ ${prefix}donasi
│⭔ ${prefix}shutdown
│⭔ ${prefix}quotes
│⭔ ${prefix}quotesislami
│⭔ ${prefix}tovn
│⭔ ${prefix}sticker
│⭔ ${prefix}speedtes
╰────❍`)
      }
      break
      
    } // Penutup case command
  } catch (err) {
    console.error("[ERROR HC.js]", err);
  }
}

export { Hc };
