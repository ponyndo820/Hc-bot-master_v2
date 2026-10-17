/*
   * index.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import fs from 'fs';
import os from 'os';
import path from 'path';
import pino from 'pino';
import chalk from 'chalk';
import readline from 'readline';
import makeWaSocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys';

import { Hc } from './Hc.js';
import { restoreJadibots } from './lib/jadibot.js';
import settings from './settings.js';
import { printMessageLog } from './lib/function.js';
import { dataBase, cmdDel, checkStatus } from './src/database.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const simpleStore = {
  messages: {},
  bind(ev) {
    ev.on('messages.upsert', ({ messages }) => {
      for (const msg of messages) {
        const jid = msg.key.remoteJid;
        if (!this.messages[jid]) {
          this.messages[jid] = { array: [] };
        }
        const chatStore = this.messages[jid];
        if (!chatStore.array.some(m => m.key.id === msg.key.id)) {
          chatStore.array.push(msg);
          if (chatStore.array.length > 100) chatStore.array.shift();
        }
      }
    });
  }
};

const store = simpleStore;

function displaySystemInfo() {
    console.log(chalk.red.bold(`
    ██╗  ██╗ ██████╗          ██████╗  ██████╗ ████████╗
    ██║  ██║██╔════╝          ██╔══██╗██╔═══██╗╚══██╔══╝
    ███████║██║     ████████╗ ██████╔╝██║   ██║   ██║   
    ██╔══██║██║     ╚═══════╝ ██╔══██╗██║   ██║   ██║   
    ██║  ██║╚██████╗          ██████╔╝╚██████╔╝   ██║   
    ╚═╝  ╚═╝ ╚═════╝          ╚═════╝  ╚═════╝    ╚═╝   
    ┌──────────────────────────────────────────────────┐
    │                  By Heart candy                  │
    └──────────────────────────────────────────────────┘
    `));
}

async function startHcbot() {
  const dbConnector = dataBase(settings.tempatDB || 'database.json');
  const { state, saveCreds } = await useMultiFileAuthState('sessions');
  const { version } = await fetchLatestBaileysVersion();

  try {
    const loadData = await dbConnector.read();
    if (!loadData || Object.keys(loadData).length === 0) {
      global.db = {
        hit: {},
        set: {},
        cmd: {},
        game: {},
        store: {},
        users: {},
        groups: {},
        database: {},
        sewa: [],
        premium: [],
        ...(loadData || {}),
      };
      await dbConnector.write(global.db);
    } else {
      global.db = loadData;
    }
    
    global.loadMessage = function (remotejid, id) {
      const messages = store.messages?.[remotejid]?.array;
      if (!messages) return null;
      return messages.find(msg => msg?.key?.id === id) || null;
    };

    if (!global._dbInterval) {
      global._dbInterval = setInterval(async () => {
        if (global.db) await dbConnector.write(global.db);
      }, 30 * 1000);
    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
  
  const hcOptions = {
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !settings.pairing_code,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['Mac OS', 'Chrome', '10.15.7'],
    generateHighQualityLinkPreview: true
  };
  
  const hc = makeWaSocket.default ? makeWaSocket.default(hcOptions) : makeWaSocket(hcOptions);
  
  store.bind(hc.ev);

  if (!hc.authState.creds.registered) {
    if (settings.pairing_code) {
      let phoneNumber = process.env.PHONE_NUMBER;
      if (!phoneNumber) {
        phoneNumber = await question(chalk.magenta('Masukin nomor bot Kamu disini ya sayang (contoh: 628xxx): '));
      }
      
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const code = await hc.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
      console.log(chalk.green.bold(`\n=======================================\n[INI CODE PAIRING KAMU SAYANG]: ${code}\n=======================================\n`));
    } else {
      console.log(chalk.yellowBright('[SYSTEM] Mode QR Code aktif. silahkan scan QR Code yang muncul di terminal.'));
    }
  }

  
  hc.ev.on('creds.update', saveCreds);
  hc.ev.on('connection.update', (update) => {
    const { connection } = update;
    if (connection === 'close') {
      console.log(chalk.yellowBright('[SYSTEM] Terputus, sedang mencoba menghubungkan ulang...'));
      startHcbot();
    } else if (connection === 'open') {
      console.log(chalk.yellowBright(`[SYSTEM] ${settings.botName} Berhasil Terhubung!`));

      // AUTO RESTORE JADIBOT (sekali saja per proses)
      if (!global._jadibotRestored) {
        global._jadibotRestored = true;
        restoreJadibots({ Hc, getDb: () => global.db }).catch(console.log);
      }
      
      // [PERBAIKAN] Simpan referensi terbaru; interval di bawah memakai soket & database yang aktif
      global.hcMain = hc;
      global.dbConnector = dbConnector;

      // AUTO BACKUP DATABASE (setiap 6 jam)
      // [PERBAIKAN] Dibuat sekali saja (sebelumnya menumpuk setiap bot reconnect), mengirim isi global.db
      // langsung (path file lama salah: database/ tidak ikut), dan dibungkus try/catch.
      if (!global._backupInterval) {
        global._backupInterval = setInterval(async () => {
          try {
            if (!global.hcMain || !global.db) return;
            const ownerJid = settings.ownerNumber[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            await global.hcMain.sendMessage(ownerJid, {
              document: Buffer.from(JSON.stringify(global.db, null, 2)),
              mimetype: 'application/json',
              fileName: `Backup_DB_${new Date().toISOString().split('T')[0]}.json`,
              caption: '📂 *AUTO BACKUP DATABASE*\nBerikut adalah file cadangan database otomatis bot (Interval 6 Jam).'
            });
            console.log(chalk.green('[SYSTEM] Auto Backup Database berhasil dikirim ke Owner.'));
          } catch (e) {
            console.log(chalk.red('[SYSTEM] Auto Backup gagal:'), e.message);
          }
        }, 6 * 60 * 60 * 1000);
      }

      // AUTO RESET LIMIT (sekali per hari)
      // [PERBAIKAN] Dulu mengecek detik tepat 00:00:00 (terlewat bila bot lag). Sekarang sekali per tanggal,
      // tercatat di db.lastLimitReset, dan tetap jalan walau bot mati saat tengah malam.
      if (!global._resetInterval) {
        const resetLimit = async () => {
          const today = new Date().toDateString();
          if (!global.db || global.db.lastLimitReset === today) return;
          for (const id in global.db.users || {}) {
            const u = global.db.users[id];
            if (u.vip) continue;
            u.limit = u.premium ? settings.limit.premium : settings.limit.free;
          }
          global.db.lastLimitReset = today;
          console.log(chalk.green('[SYSTEM] Limit harian semua user telah di-reset!'));
          await global.dbConnector.write(global.db);
        };
        resetLimit();
        global._resetInterval = setInterval(resetLimit, 60 * 1000);
      }
    }
  });
  
  hc.ev.on('call', async (calls) => {
      if (!global.anticall) return;
      for (const call of calls) {
          if (call.status === 'offer') {
              const caller = call.from;
              const ownerNumber = settings.ownerNumber[0]; 
              const ownerJid = ownerNumber + "@s.whatsapp.net";
              await hc.rejectCall(call.id, call.from).catch(() => {});
              const teksPesan = `Saat tidak dapat menerima panggilan jika @${caller.split('@')[0]} membutuhkan bantuan hubungi owner @${ownerNumber}`;
              
              await hc.sendMessage(caller, {
                  text: teksPesan,
                  mentions: [caller, ownerJid] 
              });
          }
      }
  });

  hc.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const m = chatUpdate.messages[0];
      if (!m.message) return;
      
      m.chat = m.key.remoteJid;
      m.isGroup = m.chat.endsWith('@g.us');
      m.sender = m.key.fromMe
        ? (hc.user.id.split(':')[0] + '@s.whatsapp.net')
        : (m.key.participant || m.key.remoteJid);
      
      await printMessageLog(hc, m);
      await Hc(hc, m, global.db);
      await dbConnector.write(global.db);
    } catch (err) {
      console.log(chalk.red("[SYSTEM ERROR]", err));
    }
  });
}

displaySystemInfo();
startHcbot();
