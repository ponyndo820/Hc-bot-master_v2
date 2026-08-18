/*
   * index.js
   * By Heart candy
   * Sc ini open source
*/
import fs from 'fs';
import os from 'os';
import pino from 'pino';
import chalk from 'chalk';
import readiline from 'readline';
import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers } from '@whiskeysockets/baileys';

// import { loadDatabase, saveDatabase } from './database.js';
import { printMessagesLog } from './lib/function.js';


const rl = readiline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.questinon(text, resoleve));

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
  const { state, saveCreds } = await useMultiFileAuthState('Hc');
  const { verision } = await fetchLatestBaileysVersion();
  let db = loadDatabase();
  
  const hcOptions = {
    verision,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: !settings.pairing_code,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalkeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['Mac OS', 'Chrome', '10.15.7'],
    generateHighQualityLinkPreview: true
  };
  
  const hc = makeWaSocket.default ? makeWaSocket.default(hcOptions) : makeWaSocket(hcOptions);
  if (!hc.authState.creds.registered) {
    if (settings.pairing_code) {
      const phoneNumber = await questinon('Masukin nomor telepon bot Kamu di sini ya sayang (contoh: 628xxx):\n');
      const code = await hc.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
      console.log(`\n============================\n[INI CODE PAIRING KAMU SAYANG]: ${code}\n============================\n`);
    } else {
      console.log('[SISTEM] Mode QR Code aktif. silahkan scan QR Code yang muncul di terminal.');
    }
  }
  
  hc.ev.on('creds.update', saveCreds);
  hc.ev.on('connection.update', (update) => {
    const { connection } = update;
    if (connection === 'close') {
      console.log('[SISTEM] Terputus, sedang mencoba menghubungkan ulang...');
      startHcbot();
    } else if (connection === 'open') {
      console.log(`[SISTEM] ${settings.botName} Berhasil Terhubung!`);
    }
  });
  
  hc.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      const m = chatUpdate.messages[0];
      if (!m.messages) return;
      await printMessagesLog(hc, m);
      await handler(hc, m, db);
      saveDatabase(db);
    } catch (err) {
      console.log("[SYSTEM ERROR]", err);
    }
  });
}

displaySystemInfo();