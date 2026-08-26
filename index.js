/*
   * index.js
   * By Heart candy
   * Sc ini open source
*/
import fs from 'fs';
import os from 'os';
import pino from 'pino';
import chalk from 'chalk';
import readline from 'readline';
import makeWaSocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys';

import { Hc } from './Hc.js'
import settings from './settings.js';
import { printMessageLog } from './lib/function.js';
import { dataBase, cmdDel, checkStatus} from './src/database.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

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
  if (!hc.authState.creds.registered) {
    if (settings.pairing_code) {
      const phoneNumber = await question(chalk.magenta('Masukin nomor bot Kamu disini ya sayang (contoh: 628xxx):'));
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
