/*
   * Hc.js
   * By Heart candy
   * Sc ini open source
*/
import fs from 'fs';
import util from 'util';
import path from 'path';
import chalk from 'chalk'; 
import yts from 'yt-search';
import { promisify } from 'util';
import speed from 'performance-now';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import youtubedl from 'youtube-dl-exec';
import { exec, spawn, execSync } from 'child_process';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getContentType, downloadMediaMessage, generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';

import settings from './settings.js';
import { GroupUpdate } from './src/message.js';
import { writeExif, toAudio, toPTT, toVideo } from './lib/converter.js';
import { getRandomImage, getRandomWaifu, searchWaifu, getBuffer, pickRandom } from './lib/function.js';

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
    
    const sender = m.key.remoteJid;
    const isGroup = sender.endsWith('@g.us');
    
    global.activeAutoAI = global.activeAutoAI || new Set();
    
    const prefixUsed = settings.prefix.find(p => body.startsWith(p));
    const isCmd = !!prefixUsed;
    const prefix = isCmd ? prefixUsed : '';
    
    if (!isCmd && !global.activeAutoAI.has(sender)) return;
    
    const command = isCmd ? body.slice(prefix.length).trim().split(/ +/).shift().toLowerCase() : '';
    const args = isCmd ? body.trim().split(/ +/).slice(1) : [];
    const text = isCmd ? args.join(' ') : body;
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
    const setv = pickRandom(settings.listv)
    if (!!m.isGroup && global.activeAutoAI.has(sender) && !isCmd) {
        if (m.key.id?.startsWith('3EB0') || m.key.id?.startsWith('BAE5') || text.startsWith('❌') || text.startsWith('✅')) return;
        if (text) {
            await react('🤖');
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const apiKey = settings.APIKeys;
                
                if (!apiKey || apiKey === 'YOUR_API_KEY') {
                    return reply(`⚠️ API Key Gemini belum diatur!\nSilakan atur menggunakan perintah:\n*${prefix}setgemini <API_KEY>*`);
                }
                
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
                const result = await model.generateContent(text);
                return await reply(result.response.text());
            } catch (err) {
                console.error("Error dari Gemini API:", err);
                global.activeAutoAI.delete(sender);
                return await reply('❌ Error: Terjadi kesalahan saat menghubungi layanan AI. (Mode Auto AI dimatikan otomatis)');
            }
        }
    }
    
    switch (command) {
      case 'tes': {
        await reply('Ya sayang');
      }
      break
      
      // Owner Menu
      case 'shutdown': case 'off': {
        if (!isCreator) return reply(settings.mess.owr);
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
      case 'sticker': case 'stiker': case 's': case 'stickergif': case 'stikergif': case 'sgif': case 'stickerwm': case 'swm': case 'curi': case 'colong': case 'take': case 'stickergifwm': case 'sgifwm': case 'wm': {
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
      case 'readviewonce': case 'readviewone': case 'rvo': {
        if (!isQuoted) return reply(settings.mess.qud);
        try {
          let viewOnceMsg = quoted;
          if (viewOnceMsg.viewOnceMessage) viewOnceMsg = viewOnceMsg.viewOnceMessage.message;
          else if (viewOnceMsg.viewOnceMessageV2) viewOnceMsg = viewOnceMsg.viewOnceMessageV2.message;
          else if (viewOnceMsg.viewOnceMessageV2Extension) viewOnceMsg = viewOnceMsg.viewOnceMessageV2Extension.message;
          const mediaType = getContentType(viewOnceMsg);
          if (!mediaType || !/imageMessage|videoMessage|audioMessage/.test(mediaType)) {
            return reply(`Reply pesan media View Once!\nContoh: *${prefix + command}*`);
          }
          
          await react('⏳');
          const targetMsg = { key: m.key, message: viewOnceMsg };
          const mediaBuffer = await downloadMediaMessage(targetMsg, 'buffer', {});
          if (!mediaBuffer) return reply('Gagal mengunduh media View Once.');
          const caption = viewOnceMsg[mediaType]?.caption || '';
          
          if (/imageMessage/.test(mediaType)) {
            await hc.sendMessage(sender, { image: mediaBuffer, caption: caption }, { quoted: m });
          } else if (/videoMessage/.test(mediaType)) {
            await hc.sendMessage(sender, { video: mediaBuffer, caption: caption }, { quoted: m });
          } else if (/audioMessage/.test(mediaType)) {
            await hc.sendMessage(sender, { audio: mediaBuffer, mimetype: 'audio/mp4', ptt: true }, { quoted: m });
          }
        } catch (e) {
          console.error(e);
          await reply('Media Tidak Valid atau gagal diproses❗');
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
      case 'brat': {
        if (!text) return reply(`Teksnya mana?\nContoh: *${prefix}brat halo semua*`);
        await react('⏳');
        try {
          const media = await getBuffer(`https://api.siputzx.my.id/api/m/brat?text=${encodeURIComponent(text)}`);
          const stickerFile = await writeExif(media, { packname: packname, author: author });
          
          await hc.sendMessage(sender, { sticker: { url: stickerFile } }, { quoted: m });
        
          if (fs.existsSync(stickerFile)) fs.unlinkSync(stickerFile);
        } catch (err) {
          console.error(err);
          await reply('Terjadi kesalahan saat memproses stiker brat❗');
        }
      }
      break
      case 'bratvid': case 'bratvideo': {
        if (!text) return reply(`Teksnya mana?\nContoh: *${prefix}bratvid halo semua*`);
        await react('⏳');
        try {
          
          const media = await getBuffer(`https://brat.siputzx.my.id/mp4?text=${encodeURIComponent(text)}`);
          if (!media || media.length < 1000) {
             return reply('Gagal mengambil video brat! Server API mungkin sedang down atau merespons error.');
          }
          const stickerFile = await writeExif(media, { packname: packname, author: author });
          await hc.sendMessage(sender, { sticker: { url: stickerFile } }, { quoted: m });
          
          if (fs.existsSync(stickerFile)) fs.unlinkSync(stickerFile);
        } catch (err) {
          console.error(err);
          await reply('Maaf, fitur stiker video brat sedang mengalami gangguan teknis.');
        }
      }
      break
      case 'alyabrat': { // Fitur ini masih dalam tahap pengembangan.
        if (!text) return reply(`Teksnya mana bang?\nContoh: *${prefix}alyabrat halo*`);
        await react('⏳');
        try {
          const Jimp = await import('jimp');
          const imageUrl = 'https://files.catbox.moe/5zv26f.jpg';
          const image = await Jimp.default.read(imageUrl);
          image.resize(512, Jimp.default.AUTO);
          const width = image.bitmap.width;
          const height = image.bitmap.height;
          const paperW = Math.round(width * 0.58);
          const paperH = Math.round(height * 0.20);
          const textCanvas = new Jimp.default(paperW, paperH, 0x00000000);
          const font = await Jimp.default.loadFont(Jimp.default.FONT_SANS_64_BLACK);
          textCanvas.print(font, 0, 0, {
            text: text,
            alignmentX: Jimp.default.HORIZONTAL_ALIGN_CENTER,
            alignmentY: Jimp.default.VERTICAL_ALIGN_MIDDLE
          }, paperW, paperH);
          
          textCanvas.rotate(+5, false);
          
          const posX = Math.round(width * 0.21);
          const posY = Math.round(height * 0.58);
          
          image.composite(textCanvas, posX, posY);
          
          const buffer = await image.getBufferAsync(Jimp.default.MIME_JPEG);
          const stickerFile = await writeExif(buffer, { packname: packname, author: author });
          await hc.sendMessage(sender, { sticker: { url: stickerFile } }, { quoted: m });
          
          if (fs.existsSync(stickerFile)) fs.unlinkSync(stickerFile);
        } catch (err) {
          console.error(err);
          reply('❌ Error saat membuat stiker alyabrat');
        }
      }
      break

      //Bot Menu
      case 'sc': case 'script': {
        reply('Donasi dulu')
      }
      break
      case 'donasi': case 'donate': {
        reply('Donasi Dapat Melalui Url Dibawah ini :\nhttps://saweria.co/Ponyndo')
      }
      break
      case 'tagme': {
        const userTag = m.key.participant || m.sender || sender;
        const userNumber = typeof userTag === 'string' ? userTag.split('@')[0] : sender.split('@')[0];
        await hc.sendMessage(sender, { 
          text: `@${userNumber}`, 
          mentions: [userTag] 
        }, { quoted: m });
      }
      break      
      case 'req': case 'request': {
        if (!text) return reply('Mau Request apa ke Owner?');
        await reply(`*Request Telah Terkirim Ke Owner*\n_Terima Kasih🙏_ Telah Menyusahkan Owner`);
        const targetOwner = settings.ownerNumber[0] + '@s.whatsapp.net';
        await hc.sendMessage(targetOwner, { 
          text: `Pesan Dari : @${sender.split('@')[0]}\nUntuk Owner\n\nRequest: ${text}`, mentions: [sender] });
      }
      break
      
      // Random Images Menu
      case 'randomimage': case 'randomimg': case 'randomimages': {
        await react('⏳');
        try {
          const imageBuffer = await getRandomImage();
          if (!imageBuffer) {
            return reply('Maaf, server gambar sedang sibuk atau down.');
          }
          await hc.sendMessage(sender, { 
            image: imageBuffer, 
            caption: `Nih gambar random-nya!` 
          }, { quoted: m });
        } catch (err) {
          console.error(err);
          await reply('Terjadi kesalahan saat memproses gambar❗');
        }
      }
      break
      // Waifu Menu
      case 'randomwaifu': case 'waifu': {
        await react('⏳');
        try {
          const imageBuffer = await getRandomWaifu();
          if (!imageBuffer) return reply('Maaf, server sedang sibuk atau gambar tidak ditemukan.');
          
          await hc.sendMessage(sender, { 
            image: imageBuffer, 
            caption: `*By: Heart candy*\nIstri online-mu sudah datang!` 
          }, { quoted: m });
        } catch (err) {
          console.error(err);
          await reply('Terjadi kesalahan saat memproses gambar❗');
        }
      }
      break
      case 'cariwaifu': {
        if (!text) return reply(`Ketik nama karakter yang ingin dicari!\nContoh: *${prefix}waifu nurse redheart*`);
        
        await react('⏳');
        try {
          const imageBuffer = await searchWaifu(text);
          if (!imageBuffer) return reply(`Maaf, gambar untuk *${text}* tidak ditemukan. Coba gunakan nama bahasa Inggris atau nama lengkapnya.`);
          
          await hc.sendMessage(sender, { 
            image: imageBuffer, 
            caption: `*By: Heart candy*\nHasil pencarian untuk: *${text}*` 
          }, { quoted: m });
        } catch (err) {
          console.error(err);
          await reply('Terjadi kesalahan saat mencari gambar❗');
        }
      }
      break
      // Downloader Menu
      case 'ytmp3': case 'play': {
        if (!text) return reply(`Masukkan link YouTube atau judul lagu yang ingin dicari!\nContoh: *${prefix}ytmp3 https://youtu.com/xxxxx*`);
        await react('⏳');
        try {
          const output = await youtubedl(text, {
            extractAudio: true,
            audioFormat: 'mp3',
            output: './lib/temp_audio.mp3',
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:https://www.youtube.com']
          });
          await hc.sendMessage(sender, { 
            audio: { url: './lib/temp_audio.mp3' }, 
            mimetype: 'audio/mpeg', 
            ptt: false 
          }, { quoted: m });
          if (fs.existsSync('./lib/temp_audio.mp3')) {
            fs.unlinkSync('./lib/temp_audio.mp3');
          }
        } catch (err) {
          console.error(err);
          await reply('Gagal mengunduh audio dari YouTube. Pastikan link-nya benar!');
        }
      }
      break
      case 'ytmp4': case 'video': {
        if (!text) return reply(`Masukkan link YouTube!\nContoh: *${prefix}ytmp4 https://youtu.com/xxxxx*`);
        await react('⏳');
        try {
          const output = await youtubedl(text, {
            format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            mergeOutputFormat: 'mp4',
            output: './lib/temp_video.mp4',
            noCheckCertificates: true,
            noWarnings: true,
            preferFreeFormats: true,
            addHeader: ['referer:https://www.youtube.com']
          });
          await hc.sendMessage(sender, { 
            video: { url: './lib/temp_video.mp4' }, 
            caption: `*By: Heart candy*\nNih videonya!` 
          }, { quoted: m });
          if (fs.existsSync('./lib/temp_video.mp4')) {
            fs.unlinkSync('./lib/temp_video.mp4');
          }
        } catch (err) {
          console.error(err);
          await reply('Gagal mengunduh video dari YouTube! Pastikan link valid dan video tidak dibatasi umur.');
        }
      }
      break
      // Search Menu
      case 'search': case 'yts': case 'ytsearch': {
        if (!text) return reply(`Masukkan kata kunci pencarian!\nContoh: *${prefix}search mlp*`);
        await react('🔍');
        
        try {
          const searchResults = await yts(text);
          const videos = searchResults.videos.slice(0, 5);
          
          if (videos.length === 0) return reply('Maaf, video yang kamu cari tidak ditemukan.');
          let resultText = `*━━━━━━━━━━━━━━━━━━━━*\n`;
          resultText += ` 🔍 *YOUTUBE SEARCH* 🔍\n`;
          resultText += `*━━━━━━━━━━━━━━━━━━━━*\n\n`;
          resultText += `Hasil pencarian untuk: *${text}*\n\n`;
          for (let i = 0; i < videos.length; i++) {
            let vid = videos[i];
            resultText += `*${i + 1}. ${vid.title}*\n`;
            resultText += `⏱️ *Durasi:* ${vid.timestamp}\n`;
            resultText += `👁️ *Views:* ${vid.views}\n`;
            resultText += `🔗 *Link:* ${vid.url}\n`;
            resultText += `\n*📥 Opsi Download:*\n`;
            resultText += `🎧 Audio ➔ *${prefix}ytmp3 ${vid.url}*\n`;
            resultText += `🎥 Video ➔ *${prefix}ytmp4 ${vid.url}*\n`;
            resultText += `──────────────────\n\n`;
          }
          await hc.sendMessage(sender, {
            image: { url: videos[0].thumbnail },
            caption: resultText.trim()
          }, { quoted: m });
        } catch (err) {
          console.error("Error pada fitur search:", err);
          await reply('Terjadi kesalahan saat mencari video di YouTube.');
        }
      }
      break
      // Ai Menu
      case 'cai': case 'autoai': case 'roomai': case 'chatai': {
        if (isGroup) return reply(settings.mess.priv);
        if (global.activeAutoAI.has(sender)) return reply('🤖 Mode Auto AI sudah aktif di chat ini.');
        
        global.activeAutoAI.add(sender);
        reply(`✅ Mode Auto AI diaktifkan!\nKetik ${prefix}delautoai untuk mematikan.`);
      }
      break
      case 'delautoai': {
        if (isGroup) return reply(settings.mess.priv);
        if (!global.activeAutoAI.has(sender)) return reply('⚠️ Mode Auto AI belum aktif.');
        
        global.activeAutoAI.delete(sender);
        reply('❌ Mode Auto AI dimatikan.');
      }
      break
      // Set API_KEY
      case 'setapikeygemini': case 'setgemini': {
        if (!isCreator) return reply(settings.mess.owr);
        if (!text) return reply(`Masukkan API Key Gemini-nya!\nContoh: *${prefix}setapikeygemini AIzaSy...*`);
        
        const key = text.trim();
        settings.APIKeys = key;
        
        try {
          let settingsContent = fs.readFileSync('./settings.js', 'utf-8');
          settingsContent = settingsContent.replace(
            /settings\.APIKeys\s*=\s*\{[\s\S]*?\}/,
            `settings.APIKeys = '${key}'`
          );
          
          fs.writeFileSync('./settings.js', settingsContent, 'utf-8');
          reply('✅ API Key Gemini berhasil disimpan secara permanen ke *settings.js*!');
        } catch (err) {
          console.error(err);
          reply('❌ Gagal menulis API Key ke settings.js\ncoba isi secara manual');
        }
      }
      break
      case 'ai': case 'gemini': case 'google': case 'bard': case 'ia': {
        if (!text) return reply(`Mau tanya apa?\nContoh: *${prefix + command} Bagaimana cuaca hari ini?*`);
        await react('🤖');
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const apiKey = settings.APIKeys;
          
          if (!apiKey || apiKey === 'YOUR_API_KEY') {
            return reply('⚠️ Fitur AI belum bisa digunakan karena API Key belum diatur oleh Owner!');
            
          }
          
          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
          const result = await model.generateContent(text);
          await reply(result.response.text());
          
        } catch (err) {
          console.error("Error dari Gemini API (AI):", err);
          if (err.status === 429 || err.message?.includes('429') || err.message?.includes('Quota exceeded')) {
            return await reply('⚠️ Limit penggunaan AI sedang habis atau mencapai batas harian. Silakan coba lagi nanti atau ganti API Key!');
            
          }
          await reply('❌ Error: Terjadi kesalahan saat memproses permintaan AI.');
          
        }
        
      }
      break
      // Menu
      case 'menu': {
        await react('✨');
        const menuText = `*━━━━━━━━━━━━━━━━━━━━*
              🌈 *HC-BOT* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*

╭──❍ *MENU*
│${setv} ${prefix}botmenu
│${setv} ${prefix}allmenu
│${setv} ${prefix}aimenu
│${setv} ${prefix}animemenu
│${setv} ${prefix}toolsmenu
│${setv} ${prefix}ownermenu
│${setv} ${prefix}quotesmenu
│${setv} ${prefix}downloadermenu
╰────❍`;
        try {
          const animasiMenu = fs.readFileSync('./src/media/menu.mp4');
          await hc.sendMessage(sender, {
            video: animasiMenu,
            caption: menuText,
            gifPlayback: true
          }, { quoted: m });
          
        } catch (err) {
          console.error("Gagal memuat animasi menu:", err);
          await reply(menuText);
        }
      }
      break
      case 'botmenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *BOT*
│${setv} ${prefix}sc
│${setv} ${prefix}tagme
│${setv} ${prefix}donasi
│${setv} ${prefix}request (text)
╰────❍`)
      }
      break
      case 'ownermenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *OWNER*
|${setv} ${prefix}shutdown
|${setv} ${prefix}setapikeygemini
╰────❍`)
      }
      break
      case 'quotesmenu': {
       await reply(` *━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *QUOTES*
│${setv} ${prefix}quotes
│${setv} ${prefix}quotesislami
╰────❍`)
      }
      break
      case 'toolsmenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *TOOLS*
│${setv} ${prefix}tovn (reply pesan)
│${setv} ${prefix}sticker (send/reply img/vid)
│${setv} ${prefix}speedtest
│${setv} ${prefix}rvo (reply pesan viewone)
╰────❍`)
      }
      break
      break
      case 'animemenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *ANIME*
│${setv} ${prefix}cariwaifu (query)
│${setv} ${prefix}randomwaifu
╰────❍`)
      }
      break
      case 'downloadermenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *DOWNLOADER*
│${setv} ${prefix}ytmp4 (url)
│${setv} ${prefix}ytmp3 (url)
╰────❍`)
      }
      break
      case 'Searchmenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *SEARCH*
│${setv} ${prefix}ytsearch (query)
╰────❍`)
      }
      break
      case 'aimenu': {
        await reply(`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *AI*
|${setv} ${prefix}autoai
╰────❍`)
      }
      break
      case 'allmenu': {
        await react('✨');
        const menuText =`*━━━━━━━━━━━━━━━━━━━━*
              🌈 *Hc-bot* 🌈
               *By Heart candy*
*━━━━━━━━━━━━━━━━━━━━*
╭──❍ *BOT*
│${setv} ${prefix}sc
│${setv} ${prefix}tagme
│${setv} ${prefix}donasi
│${setv} ${prefix}request (text)
╰┬───❍
╭┴─❍ *OWMER*
│${setv} ${prefix}shutdown
╰┬──❍
╭┴─❍ *QUOTES*
│${setv} ${prefix}quotes
│${setv} ${prefix}quotesislami
╰┬───❍
╭┴─❍ *RANDOM IMAGE*
│${setv} ${prefix}randomimage
╰┬──❍
╭┴─❍ *AI*
│${setv} ${prefix}autoai
╰┬──❍
╭┴─❍ *ANIME*
│${setv} ${prefix}cariwaifu (query)
│${setv} ${prefix}randomwaifu
╰┬───❍
╭┴─❍ *Search*
│${setv} ${prefix}ytsearch (query)
╰┬───❍
╭┴─❍ *DOWNLOADER*
│${setv} ${prefix}ytmp4 (url)
│${setv} ${prefix}ytmp3 (url)
╰┬───❍
╭┴─❍ *TOOLS*
│${setv} ${prefix}rvo (reply pesan viewone)
│${setv} ${prefix}brat
│${setv} ${prefix}bratvid
│${setv} ${prefix}tovn (reply pesan)
│${setv} ${prefix}sticker (send/reply img/vid)
│${setv} ${prefix}speedtest
╰────❍
Bot ini masih di kembangkan.\nTerima kasih telah menggunakan bot whatsapp kami.`;
       try {
          const animasiMenu = fs.readFileSync('./src/media/menu.mp4');
          await hc.sendMessage(sender, {
            video: animasiMenu,
            caption: menuText,
            gifPlayback: true
          }, { quoted: m });
        } catch (err) {
          console.error("Gagal memuat animasi menu:", err);
          await reply(menuText);
        }
      }
      break
      
    } // Penutup case command
  } catch (err) {
    console.error("[ERROR HC.js]", err);
  }
}

export { Hc };
