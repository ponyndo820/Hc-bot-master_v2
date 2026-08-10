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
import NodeCache from 'node-cache'
import { fileURLToPath } from 'url'
import qrcode from 'qrcode-terminal';
import moment from 'moment-timezone';
import { exec } from 'child_process';
import { createRequire } from 'module'
import makeWASocket, { DisconnectReason, useMultiFileAuthState,
fetchLatestBaileysVersion, makeCacheableSignalKeyStore,
jidNormalizedUser } from '@whiskeysockets/baileys';

import './settings.js';
import { app, server, PORT } from './src/server.js';
import { dataBase, cmdDel, checkStatus } from './src/database.js';
import { assertInstalled, customHttpsAgent } from './lib/function.js';
import { GroupUpdate } from './src/message.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);	

let phoneNumber;
let pairingStarted = false;
const time_now = new Date()
const time_end = 60000 - (time_now.getSeconds() * 1000 + time_now.getMilliseconds());
const tempDir = path.join(__dirname, 'database/temp');
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const pairingCode = process.argv.includes('--qr') ? false : process.argv.includes('--pairing-code') || global.pairing_code;
const print = (label, value) => console.log(`${chalk.green.bold('||')} ${chalk.cyan.bold(label.padEnd(16))}${chalk.yellow.bold(':')} ${value}`);
const userInfoSyt = () => {
 try {
  return os.userInfo().username
 } catch (e) {
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
displaySystemInfo();
assertInstalled(process.platform === 'win32' ? 'where ffmpeg' : 'command -v ffmpeg', 'FFmpeg', 0);
console.log(chalk.greenBright('✅ ALL EXTERNAL DEPENDENCIES ARE SATISFIED'));
console.log(chalk.green.bold(`╔═════[${`${chalk.cyan(userInfoSyt())}${chalk.cyan(os.hostname())}`}]═════`));
print('os', `${os.platform()} ${os.release()} ${os.arch()}`);
print('Uptime', `${Math.floor(os.uptime() / 3600)} h ${Math.floor((os.uptime() % 3600) / 60)} m`);
print('CPU', os.cpus()[0]?.model.trim() || 'unknown');
print('Memory', `${(os.freemem()/1024/1024).toFixed(0)} MiB / ${(os.totalmem()/1024/1024).toFixed(0)} MiB`);
print('Script version', `v${require('./package.json').version}`);
print('Node.js', process.version);
print('Baileys', `v${require('./package.json').dependencies.baileys}`);
print('Date & Time', new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta', hour12: false }));
console.log(chalk.green.bold('╚' + ('═'.repeat(30))));
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
 global.loadMessage = function (remoteJid, id) {
  const messages = store.messages?.[remoteJid]?.array;
 if (!messages) return null;
  return messages.find(msg => msg?.key?.id === id) || null;
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
const { version } = await fetchLatestBaileysVersion();
const { state, saveCreds } = await useMultiFileAuthState('./session_Heart_candy');
const getMessage = async (key) => {
if (global.store) {
 const msg = await global.loadMessage(key.remoteJid, key.id);
 return msg?.message || ''
}
 return {
  conversation: 'Halo Sayang Saya Adalah Bot Heart candy'
 }
}
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
  keys: makeCacheableSignalKeyStore(state.keys, level),
 },
})
 async function getPhoneNumber() {
  phoneNumber = global.number_bot ? global.number_bot : process.env.BOT_NUMBER || await question('Tolong Masuk kan Nomor WhatsApp Kamu Disini Ya Sayang : ');
  phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
  if (phoneNumber.length < 6) {
      console.log(chalk.bgBlack(chalk.redBright('Mulailah dengan kode WhatsApp negara Kamu Ya Sayang') + chalk.whiteBright(',') + chalk.greenBright(' Example : 62xxx')));
  }
      return await getPhoneNumber;
 }
 if (pairingCode && !phoneNumber && !sock.authState.creds.registered) {
 	await getPhoneNumber();
 exec('rm -rf ./session_Heart_candy/*');
 console.log('Nomor telepon berhasil di verifikasi. Menunggu koneksi...\n' + chalk.blueBright('Perkiraan waktu: sekitar 2 ~ 5 menit'));
}
//await Solving(sock, global.store)
sock.ev.on('creds.update', saveCreds)
sock.ev.on('connection.update', async (update) => {
	const { qr, connection, lastDisconnect, isNewLogin, receivedPendingNotifications } = update;
	if ((connection === 'connecting' || !!qr) && pairingCode && phoneNumber && !sock.authState.creds.registered && !pairingStarted) {
		setTimeout(async () => {
			pairingStarted = true;
			console.log('Meminta Kode Pairing...')
			let code = await sock.requestPairingCode(phoneNumber);
			console.log(chalk.blue('Ini Kode Pairing Mu Sayang :'), chalk.purple(code), '\n', chalk.yellow('Akan Kadaluarsa Dalam Waktu 15 detik'));
		}, 3000)
	}
	if (connection === 'close') {
			const reason = new Boom(lastDisconnect?.error)?.output.statusCode
			if (reason === DisconnectReason.connectionLost) {
				console.log('Koneksi ke Server Terputus, Mencoba MenyambungKan Kembali..');
				startHc()
			} else if (reason === DisconnectReason.connectionClosed) {
				console.log('Koneksi terputus, Mencoba menyambungkan kembali...');
				startHc()
			} else if (reason === DisconnectReason.restartRequired) {
				console.log('Restart Diperlukan...');
				startHc()
			} else if (reason === DisconnectReason.timedOut) {
				console.log('Koneksi Terputus karena Waktu Habis, Mencoba Menyambungkan Kembali...');
				startHc()
			} else if (reason === DisconnectReason.badSession) {
				console.log('Hapus sesi dan scan lagi...');
				startHc()
			} else if (reason === DisconnectReason.connectionReplaced) {
				console.log('Tutup sesi saat ini terlebih dahulu...');
			} else if (reason === DisconnectReason.loggedOut) {
				console.log('Scan lagi dan jalankan...');
				exec('rm -rf ./session_Heart_candy/*')
				process.exit(0)
			} else if (reason === DisconnectReason.forbidden) {
				console.log('Koneksi gagal, scan lagi dan jalankan...');
				exec('rm -rf ./session_Heart_candy/*')
				process.exit(1)
			} else if (reason === DisconnectReason.multideviceMismatch) {
				console.log('Scan lagi...');
				exec('rm -rf ./session_Heart_candy/*')
				process.exit(0)
			} else {
				sock.end(`Unknown DisconnectReason : ${reason}|${connection}`)
			}
		}
		if (connection == 'open') {
			console.log('Connected to : ' + JSON.stringify(sock.user, null, 2));
			let botNumber = await sock.decodeJid(sock.user.id);
			if (global.db?.set[botNumber] && !global.db?.set[botNumber]?.join) {
				if (my.ch.length > 0 && my.ch.includes('@newsletter')) {
					if (my.ch) await sock.newsletterMsg(my.ch, { type: 'follow' }).catch(e => {})
					db.set[botNumber].join = true
				}
			}
		}
		if (qr) {
			if (!pairingCode) qrcode.generate(qr, { small: true })
			app.use('/qr', async (req, res) => {
				res.setHeader('content-type', 'image/png')
				res.end(await toBuffer(qr))
			});
		}
		if (isNewLogin) console.log(chalk.green('[INFO] New device login detected...'))
		if (receivedPendingNotifications == 'true') {
			console.log(chalk.green('[INFO] Please wait About 1 Minute...'))
			sock.ev.flush()
		}
	});
sock.ev.on('call', async (call) => {
		let botNumber = await sock.decodeJid(sock.user.id);
		if (global.db?.set[botNumber]?.anticall) {
			for (let id of call) {
				if (id.status === 'offer') {
					let msg = await sock.sendMessage(id.from, { text: `Saat Ini, Kami Tidak Dapat Menerima Panggilan ${id.isVideo ? 'Video' : 'Suara'}.\nJika @${id.from.split('@')[0]} Memerlukan Bantuan, Silakan Hubungi Owner :)`, mentions: [id.from]});
					await sock.sendContact(id.from, global.owner, msg);
					await sock.rejectCall(id.id, id.from)
				}
			}
		}
	});
	sock.ev.on('messages.upsert', async (message) => {
		await MessagesUpsert(sock, message, global.store);
	});
	sock.ev.on('group-participants.update', async (update) => {
		await GroupParticipantsUpdate(sock, update, global.store);
	});
	sock.ev.on('groups.update', (update) => {
		for (const n of update) {
			if (global.store.groupMetadata[n.id]) {
				Object.assign(global.store.groupMetadata[n.id], n);
			} else global.store.groupMetadata[n.id] = n;
		}
	});
	sock.ev.on('presence.update', (update) => {
		const { id, presences } = update;
		store.presences[id] = global.store.presences?.[id] || {};
		Object.assign(global.store.presences[id], presences);
	});
	cron.schedule('00 00 * * *', async () => {
		cmdDel(global.db.hit);
		console.log(chalk.cyan('[INFO] Reseted Limit Users'));
		let user = Object.keys(global.db.users)
		let botNumber = await sock.decodeJid(sock.user.id);
		for (let jid of user) {
			const limitUser = global.db.users[jid].vip ? global.limit.vip : checkStatus(jid, global.db.premium) ? global.limit.premium : global.limit.free
			if (global.db.users[jid].limit < limitUser) global.db.users[jid].limit = limitUser
		}
		if (global.db?.set[botNumber].autobackup) {
			let datanya = './database/' + global.tempatDB;
			if (global.tempatDB.startsWith('mongodb')) {
				datanya = './database/backup_database.json';
				fs.writeFileSync(datanya, JSON.stringify(global.db, null, 2), 'utf-8');
			}
			for (let o of ownerNumber) {
				try {
					await sock.sendMessage(o, { document: fs.readFileSync(datanya), mimetype: 'application/json', fileName: new Date().toISOString().replace(/[:.]/g, '-') + '_database.json' })
					console.log(chalk.cyanBright(`[AUTO BACKUP] Backup success send to ${o}`));
				} catch (e) {
					console.error(chalk.cyanBright(`[AUTO BACKUP] Failed to Sending Backup ${o}:`, error));
				}
			}
		}
	}, {
		scheduled: true,
		timezone: global.timezone
	});
	if (!global.intervalSholat) global.intervalSholat = null;
	if (!global.waktusholat) global.waktusholat = {};
	if (global.intervalSholat) clearInterval(global.intervalSholat); 
	setTimeout(() => {
		global.intervalSholat = setInterval(async() => {
			const sekarang = moment.tz(global.timezone);
			const jamSholat = sekarang.format('HH:mm');
			const hariIni = sekarang.format('YYYY-MM-DD');
			const detik = sekarang.format('ss');
			if (detik !== '00') return;
			for (const [sholat, waktu] of Object.entries(global.jadwalSholat)) {
				if (jamSholat === waktu && global.waktusholat[sholat] !== hariIni) {
					global.waktusholat[sholat] = hariIni
					for (const [idnya, settings] of Object.entries(global.db.groups)) {
						if (settings.waktusholat) {
							await sock.sendMessage(idnya, { text: `Waktu *${sholat}* telah tiba, ambilah air wudhu dan segeralah shalat🙂.\n\n*${waktu.slice(0, 5)}*\n_untuk wilayah ${global.timezone} dan sekitarnya._` }, { ephemeralExpiration: store?.messages[idnya]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 }).catch(e => {})
						}
					}
				}
			}
		}, 60000)
	}, time_end);
	
	if (!global._dbPresence) {
		global._dbPresence = setInterval(async () => {
			if (sock?.user?.id) await sock.sendPresenceUpdate('available', sock.decodeJid(sock.user.id)).catch(e => {})
		}, 10 * 60 * 1000);
	}

	return sock;
	}

   // Sampai di sini dulu esok lanjut lagi
startHc();
