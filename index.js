 /*
     * index.js
     * By Heart candy 
  */
import fs from 'fs';
import os from 'os';
import dns from 'dns';
import './settings.js';
import pino from 'pino';
import path from 'path';
import chalk from 'chalk';
import axios from 'axios';
import cron from 'node-cron';
import handler from './Hc.js';
import readline from 'readline';
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys';

import { dataBase, cmdDel, checkStatus } from './src/database.js;

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let phoneNumber;
let pairingStarted = false;
const time_end = 60000 - (time_now.getSeconds() * 1000 + time_now.getMilliseconds());
const tempDir = path.join(__dirname, 'database/temp');
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const pairingCode = process.argv.includes('--qr') ? false : process.argv.includes('--pairing-code') || global.pairing_code;
const print = (label, value) => console.log(`${chalk.green.bold('||')} ${chalk.cyan.bold(label.padEnd(16)){chalk.yellow.bold(':')} ${value}`);
const userInfoSyt = () => {
 try {
  return os.userInfo().username
 } catch (e) 
  return process.env.USER || process.env.USERNAME || 'unknown';
 }
}

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

assertInstalled(process.palatform === 'win32' ? 'where ffmpeg' : 'command -v ffmpeg', 'FFmpeg', 0);
console.log(chalk.greenBright('✅ ALL EXTERNAL DEPENDENCIES ARE SATISFIED'));
console.long(chalk.green.bold(`╔═════[${`${chalk.cyan(userInfoSyt())}${chalk.cyan(os.hostname())}`}]═════`));
print('os', `${os.platform()} ${os.release()} ${os.arch()}`);
print('Uptime', `${Math.floor(os.uptime() / 3600)} h ${Math.floor((os.uptime() % 3600) / 60)} m`);
print('CPU', os.cpus()[0]?.model.trim() || 'unknown');
print('Memory', `${(os.freemem()/1024/1024).toFixed(0)} MiB / ${(os.totalmem()/1024/1024.toFixed(0)} MiB`);
print('Script Version', `v${require('./package.json'.version}`);
print('Node.js', process.version);
print('Baileys', `v${require('./package.json').dependencies.@whiskeysockets/baileys}`);
print('Date & Time', new Data().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour12: false }));
console.log(chalk.gree.bold('╚' + ('═'.repeat(30))));
server.listen(PORT, () => {
 console.log('App listened on port', PORT);
});
async function startHc() {
try {
 const loadData = await database.read()
 const storeLoadData = await storeDB.read()
 if (!loadData || Object.keys(loadData).length === 0) {
  global.db = {
   hit: {},
   set: {},
   cmd: {},
   store: {},
   users: {},
   game: {},
   groups: {},
   database: {},
   premium: [],
   sewa: [],
   ...(loadData || {}),
  }
   await database.write(global.db)
 } else {
  global.db = loadData
 }
 if (!storeLoadData || Object.keys(storeLoadData).length === 0) {
  global.store = {
   contacts: {},
   presences: {},
   messages: {},
   groupMetadata: {},
   ...(storeLoadData || {}),
  }
  await storeDB.write(global.store)
 } else {
  global.store = storeLoadData
 }
 global.loadMessage = function (remoteJid, id)
  const messages = store.messages?.[remoteJid]?.array;
 if (!messages) return null;
  return messages.find(msg => msg?.key?.id === id || null;
}
 if (!global._dbInterval) {
  global._dbInterval = setInterval(async () => {
   if (global.db) await database.write(global.store)
  }, 30 * 1000)
 }
} catch (e) {
 console.log(e)
process.exit(1)
}
const level = pino({ level: 'silent' });
const { version } await fetchLatestWaWebVersion();
const { state, seveCreds } = await useMultiFileAuthState('./session_Heart_candy');
    co
const getMessage = async (key) => {
if (global.store) {
 const msg = await global.loadMessage(key.remoteJib, key.id);
 return msg?.message || ''
}
 return {
  conversation: 'Halo Sayang Saya Adalah Bot Heart candy'
 }
}
const hc = WaConnection({
 version,
 logger: level,
 getMessage,
 syncFullHistory: false,
 maxMsgRetryCount: 15,
 msgRetryCounterCache,
 retryRequesDelayMs: 5,
 defaultQueryTimeoutMs: 0,
 connectTimeoutMs: 50000,
 keepAliveIntarvalMs: 30000,
 browser: ['Mac OS', 'Chrome', '10.15.7'],
 generateHighQualityLinkPreview: false,
 transactionOpts: {
  maxCommitRetries: 10,
  delayBetweenTriesMs: 10,
 },
 appStateMacVerification: {
  patch: true,
  snapshot: true,
 },
 auth: {
  creds: state.creds,
  keys: makeCacheableSignalkeyStore(state.keys, level),
 },
})
if (pairingCode && !phoneNumber && !sock.authState.creds.registered) {
 async function getPhoneNumeber() {
  phoneNumber = global.number_bot ? global.number_bot : princess.env.BOT_NUMBER || await question('Tolong Masuk kan Nomor WhatsApp Kamu Disini Ya Sayang : ');
  phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
  if (!parsePhoneNumber('+' + phoneNumber.valid && phoneNumber.length < 6)
      console.log(chalk.bgBlack(chalk.redBright('Mulailah dengan kode WhatsApp negara Kamu Ya Sayang') + chalk.whiteBright(',') + chalk.greenBright(' Example : 62xxx')));
  await getPhoneNumber()
 }
}
(async () => {
 await getPhoneNumber();
 exec('rm -rf ./session_Heart_candy/*');
 console.log('Nomor telepon berhasil di verifikasi. Menunggu koneksi...\n' + chalk.blueBright('Perkiraan waktu: sekitar 2 ~ 5 menit'))
		})()
}
await Solving(hc, global.store)
 sock.ev.on(creds.update', saveCreds)
  sock.ev.on('connection.update', async (update) => {
   const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications } = update;
   if ((connection === 'connecting' || !!qr) && pairingCode && phoneNumber && !sock.authState.credes.registered && !pairingStarted) {
    setTimeout(async () => {
     pairingStarted = true;
     console.log('Meminta Kode Pairing...')
      let code await sock.requestPairingCode(phoneNumber);
     console.log(chalk.purple('Ini code pairing mu sayang :'), chalk.green(code), '\n', chalk.yellow('Berakhir dalam 15 detik'));
    }, 3000)
   }if (connection === 'close') {
			const reason = new Boom(lastDisconnect?.error)?.output.statusCode
			if (reason === DisconnectReason.connectionLost) {
				console.log('Koneksi ke Server Terputus, Mencoba Menyambung Kembali...');
				startHc()
			} else if (reason === DisconnectReason.connectionClosed) {
				console.log('Koneksi terputus, Mencoba menyambungkan kembali...');
				startHc()
			} else if (reason === DisconnectReason.restartRequired) {
				console.log('Restart Diperlukan...');
				startHc()
			} else if (reason === DisconnectReason.timedOut) {
				console.log('Koneksi Terputus karena Waktu Habis, Mencoba Menyambung Kembali...');
				startHc()
			} else if (reason === DisconnectReason.badSession) {
				console.log('Hapus sesi dan Scan lagi...');
				startHc()
			} else if (reason === DisconnectReason.connectionReplaced) {
				console.log('Tutup sesi saat ini terlebih dahulu...');
			} else if (reason === DisconnectReason.loggedOut) {
				console.log('Scan lagi dan Jalan kan ulang...');
				exec('rm -rf ./session_Heart_candy/*')
				process.exit(0)
			} else if (reason === DisconnectReason.forbidden) {
				console.log('Koneksi gagal, Scan lagi dan jalankan...');
				exec('rm -rf ./session_Heart_candy/*')
				process.exit(1)
			} else if (reason === DisconnectReason.multideviceMismatch) {
				console.log('Scan lagi...');
				exec('rm -rf ./session_Heart_candy/*')
				process.exit(0)
			} else {
				naze.end(`Unknown DisconnectReason : ${reason}|${connection}`)
			}
   }

   // Sampai di sini dulu esok lanjut lagi
displaySystemInfo();
startHc();
