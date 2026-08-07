/*
 * index.js
 * By Heart candy 
 */
import fs from 'fs';
import os from 'os';
import dns from 'dns';
import pino from 'pino';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import cron from 'node-cron';
import readline from 'readline';
import { Boom } from '@hapi/boom';
import NodeCache from 'node-cache';
import { fileURLToPath } from 'url';
import qrcode from 'qrcode-terminal';
import moment from 'moment-timezone';
import { exec } from 'child_process';
import { createRequire } from 'module';
import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  fetchLatestBaileysVersion, 
  makeCacheableSignalKeyStore,
  jidNormalizedUser 
} from '@whiskeysockets/baileys';

import './settings.js';
import { dataBase, cmdDel, checkStatus } from './src/database.js';
import { assertInstalled, customHttpsAgent } from './lib/function.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);	

let phoneNumber;
let pairingStarted = false;
const time_now = new Date();
const time_end = 60000 - (time_now.getSeconds() * 1000 + time_now.getMilliseconds());
const tempDir = path.join(__dirname, 'database/temp');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const pairingCode = process.argv.includes('--qr') ? false : process.argv.includes('--pairing-code') || global.pairing_code;
const print = (label, value) => console.log(`${chalk.green.bold('||')} ${chalk.cyan.bold(label.padEnd(16))}${chalk.yellow.bold(':')} ${value}`);

const userInfoSyt = () => {
  try {
    return os.userInfo().username;
  } catch (e) {
    return process.env.USER || process.env.USERNAME || 'unknown';
  }
};

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  console.log(chalk.yellowBright('[SYSTEM] Custom DNS Google & Cloudflare.'));
} catch (e) {
  console.log(chalk.yellowBright('[SYSTEM] failed to custom DNS:'), e.message);
}

const storeDB = dataBase(global.tempatStore);
const database = dataBase(global.tempatDB);
const msgRetryCounterCache = new NodeCache();

if (fs.existsSync(tempDir)) {
  fs.readdirSync(tempDir).forEach(file => {
    fs.unlinkSync(path.join(tempDir, file));
  });
} else {
  fs.mkdirSync(tempDir, { recursive: true });
}

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

// 1. TAMPILKAN GAMBAR ASCII LEBIH DULU DI PALING ATAS
displaySystemInfo();

// 2. TAMPILKAN INFO SISTEM DI BAWAHNYA
assertInstalled(process.platform === 'win32' ? 'where ffmpeg' : 'command -v ffmpeg', 'FFmpeg', 0);
console.log(chalk.greenBright('✅ ALL EXTERNAL DEPENDENCIES ARE SATISFIED'));
console.log(chalk.green.bold(`╔═════[${`${chalk.cyan(userInfoSyt())}@${chalk.cyan(os.hostname())}`}]═════`));
print('os', `${os.platform()} ${os.release()} ${os.arch()}`);
print('Uptime', `${Math.floor(os.uptime() / 3600)} h ${Math.floor((os.uptime() % 3600) / 60)} m`);
print('CPU', os.cpus()[0]?.model.trim() || 'unknown');
print('Memory', `${(os.freemem()/1024/1024).toFixed(0)} MiB / ${(os.totalmem()/1024/1024).toFixed(0)} MiB`);
print('Script version', `v${require('./package.json').version}`);
print('Node.js', process.version);
print('Baileys', `v${require('./package.json').dependencies['@whiskeysockets/baileys'] || 'v7.0.0'}`);
print('Date & Time', new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour12: false }));
console.log(chalk.green.bold('╚' + ('═'.repeat(30))));

async function startHc() {
  try {
    const loadData = await database.read();
    const storeLoadData = await storeDB.read();
    if (!loadData || Object.keys(loadData).length === 0) {
      global.db = {
        hit: {}, set: {}, cmd: {}, store: {}, users: {}, game: {}, groups: {}, database: {}, premium: [], sewa: [],
        ...(loadData || {}),
      };
      await database.write(global.db);
    } else {
      global.db = loadData;
    }
    if (!storeLoadData || Object.keys(storeLoadData).length === 0) {
      global.store = {
        contacts: {}, presences: {}, messages: {}, groupMetadata: {},
        ...(storeLoadData || {}),
      };
      await storeDB.write(global.store);
    } else {
      global.store = storeLoadData;
    }
    global.loadMessage = function (remoteJid, id) {
      const messages = store.messages?.[remoteJid]?.array;
      if (!messages) return null;
      return messages.find(msg => msg?.key?.id === id) || null;
    };
    if (!global._dbInterval) {
      global._dbInterval = setInterval(async () => {
        if (global.db) await database.write(global.store);
      }, 30 * 1000);
    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }

  const level = pino({ level: 'silent' });
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session_Heart_candy');
  
  const getMessage = async (key) => {
    if (global.store) {
      const msg = await global.loadMessage(key.remoteJid, key.id);
      return msg?.message || '';
    }
    return { conversation: 'Halo Sayang Saya Adalah Bot Heart candy' };
  };

  const sock = makeWASocket({
    version,
    logger: level,
    getMessage,
    syncFullHistory: false,
    maxMsgRetryCount: 15,
    msgRetryCounterCache,
    retryRequestDelayMs: 5,
    defaultQueryTimeoutMs: 0,
    connectTimeoutMs: 50000,
    keepAliveIntervalMs: 30000,
    browser: ['Mac OS', 'Chrome', '10.15.7'],
    generateHighQualityLinkPreview: false,
    transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 10 },
    appStateMacVerification: { patch: true, snapshot: true },
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, level),
    },
  });

  // INPUT NOMOR TELEPON PAIRING (JIKA BELUM REGISTER)
  if (pairingCode && !sock.authState.creds.registered && !phoneNumber) {
    phoneNumber = global.number_bot || process.env.BOT_NUMBER;
    if (!phoneNumber) {
      phoneNumber = await question(chalk.yellowBright('Tolong Masukkan Nomor WhatsApp Kamu Disini Ya Sayang (Contoh: 628xxx): '));
    }
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
  }

  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (update) => {
    const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications } = update;
    
    if ((connection === 'connecting' || !!qr) && pairingCode && phoneNumber && !sock.authState.creds.registered && !pairingStarted) {
      pairingStarted = true;
      setTimeout(async () => {
        console.log('Meminta Kode Pairing...');
        let code = await sock.requestPairingCode(phoneNumber);
        console.log(chalk.blue('Ini Kode Pairing Mu Sayang :'), chalk.magenta.bold(code), '\n', chalk.yellow('Akan Kadaluarsa Dalam Waktu 15 detik'));
      }, 3000);
    }

    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.connectionLost || reason === DisconnectReason.connectionClosed || reason === DisconnectReason.restartRequired || reason === DisconnectReason.timedOut || reason === DisconnectReason.badSession) {
        console.log('Koneksi terputus, Mencoba menyambungkan kembali...');
        startHc();
      } else if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.forbidden || reason === DisconnectReason.multideviceMismatch) {
        console.log('Sesi tidak valid/logged out. Menghapus sesi...');
        exec('rm -rf ./session_Heart_candy/*');
        process.exit(1);
      } else {
        sock.end(`Unknown DisconnectReason : ${reason}|${connection}`);
      }
    }

    if (connection === 'open') {
      console.log('Connected to : ' + JSON.stringify(sock.user, null, 2));
    }

    if (qr && !pairingCode) {
      qrcode.generate(qr, { small: true });
    }
  });

  sock.ev.on('messages.upsert', async (message) => {
    if (global.MessagesUpsert) await MessagesUpsert(sock, message, global.store);
  });

  return sock;
}

startHc();
