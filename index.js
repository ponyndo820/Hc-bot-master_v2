/*
   * index.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import fs from 'fs';
import os from 'os';
import pino from 'pino';
import chalk from 'chalk';
import readline from 'readline';
import makeWaSocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys';

import { Hc } from './Hc.js';
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
      const phoneNumber = await question(chalk.magenta('Masukin nomor bot Kamu disini ya sayang (contoh: 628xxx): '));
      const code = await hc.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
      console.log(chalk.green.bold(`\n============================\n[INI CODE PAIRING KAMU SAYANG]: ${code}\n============================\n`));
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
      
      // AUTO BACKUP DATABASE (Setiap 6 Jam)
      setInterval(async () => {
          let dbPath = path.join(process.cwd(), 'database', settings.tempatDB || 'database.json');
          
          if (fs.existsSync(dbPath)) {
              let ownerJid = settings.ownerNumber[0] + '@s.whatsapp.net';
              await hc.sendMessage(ownerJid, {
                  document: fs.readFileSync(dbPath),
                  mimetype: 'application/json',
                  fileName: `Backup_DB_${new Date().toISOString().split('T')[0]}.json`,
                  caption: '📂 *AUTO BACKUP DATABASE*\nBerikut adalah file cadangan database otomatis bot (Interval 6 Jam).'
              });
              console.log(chalk.green('[SYSTEM] Auto Backup Database berhasil dikirim ke Owner.'));
          }
      }, 6 * 60 * 60 * 1000);
      
      // AUTO RESET LIMIT (Tepat Pukul 00:00)
      setInterval(() => {
          let now = new Date();
          if (now.getHours() === 0 && now.getMinutes() === 0 && now.getSeconds() === 0) {
              if (global.db && global.db.users) {
                  for (let user in global.db.users) {
                      global.db.users[user].limit = settings.limit.free;
                  }
                  console.log(chalk.green('[SYSTEM] Limit harian semua user telah di-reset!'));
                  dbConnector.write(global.db);
              }
          }
      }, 1000);
    }
  });
  hc.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const m = chatUpdate.messages[0];
      if (!m.message) return;
      
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
