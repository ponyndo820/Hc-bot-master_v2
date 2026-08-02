 /*
     * index.js
     * By Heart candy 
  */
import fs from 'fs';
import './settings.js';
import pino from 'pino';
import path from 'path';
import chalk from 'chalk';
import cron from 'node-cron';
import handler from './Hc.js';
import readline from 'readline';
import makeWASocket, { 
    DisconnectReason, 
    useMultiFileAuthState, 
    fetchLatestBaileysVersion, 
    makeCacheableSignalKeyStore
} from '@whiskeysockets/baileys';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const dbFile = './database/database.json';
const backupDir = './database/backup';

if (!fs.existsSync(dbFile)) {
    if (!fs.existsSync('./database')) {
        fs.mkdirSync('./database', { recursive: true });
    }
    fs.writeFileSync(dbFile, JSON.stringify({ users: {}, stats: {} }, null, 2));
}

global.db = JSON.parse(fs.readFileSync(dbFile));
global.saveDB = () => {
    try {
        fs.writeFileSync(dbFile, JSON.stringify(global.db, null, 2));
    } catch (err) {
        console.error('[DATABASE ERROR] Gagal menyimpan data ke database.json:', err);
    }
};
if (!global.intervalSaveDB) {
    global.intervalSaveDB = setInterval(() => {
        if (typeof global.saveDB === 'function') {
            global.saveDB();
            console.log(chalk.green('[DATABASE]: Berhasil auto-save otomatis ke lokal.'));
        }
    }, 20000); 
}

const autoBackup = () => {
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    const fileName = `database-${Date.now()}.json`;
    const dest = path.join(backupDir, fileName);

    try {
        if (fs.existsSync(dbFile)) {
            fs.copyFileSync(dbFile, dest);
            console.log(`[BACKUP] Berhasil mencadangkan database: ${fileName}`);
        }
    } catch (err) {
        console.error('[BACKUP ERROR] Gagal mencadangkan database:', err);
    }
};
setInterval(autoBackup, 6 * 60 * 60 * 1000);
cron.schedule('0 0 * * *', () => {
    try {
        const users = global.db.users;
        let count = 0;
        
        if (users) {
            for (let jid in users) {
                if (users[jid] && !users[jid].isPremium) {
                    users[jid].limit = 20; 
                    count++;
                }
            }
            global.saveDB();
            console.log(`[RESET SYSTEM] Berhasil mereset limit harian untuk ${count} user.`);
        }
    } catch (err) {
        console.error('[RESET ERROR] Gagal menjalankan reset limit otomatis:', err);
    }
}, {
    scheduled: true,
    timezone: "Asia/Jakarta"
});

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

async function getPhoneNumber() {
    while (true) {
        let num = await question(chalk.yellow('Masukkan Nomor WhatsApp Lu (contoh: 628xxx): '));
        num = num.replace(/[^0-9]/g, '');
        if (num.length < 10 || !num.startsWith('62')) {
            console.log(chalk.red('Format salah! Wajib gunakan kode negara 62. Contoh 62XXX\n'));
        } else {
            return num;
        }
    }
}

async function startHc() {
    const { state, saveCreds } = await useMultiFileAuthState('./session_Heart_candy');
    const { version } = await fetchLatestBaileysVersion();
    
    let phoneNumber = null;
    
    if (!state.creds || !state.creds.registered) {
        phoneNumber = await getPhoneNumber();
    }
    
    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        browser: ['Mac OS', 'Chrome', '10.15.7'],
        printQRinTerminal: false,
        defaultQueryTimeoutMs: undefined,
        getMessage: async (key) => { 
            return { conversation: 'Heart Candy' };
        }
    });
    
    let pairingSent = false;
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log(chalk.green.bold('Bot Connected dan siap Digunakan!'));
        }
        
        if (connection === 'connecting' && !sock.authState.creds.registered && phoneNumber && !pairingSent) {
            pairingSent = true;
            setTimeout(async () => {
                try {
                    let code = await sock.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code;
                    console.log(chalk.green.bold('\nKODE PAIRING LU:'), chalk.magentaBright(code));
                } catch (e) {
                    console.log(chalk.red('Gagal meminta code pairing, silakan coba lagi.'));
                    pairingSent = false;
                }
            }, 3000);
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || DisconnectReason.loggedOut;
            console.log(chalk.yellow(`Koneksi terputus. Reason: ${reason}`));
            
            if (reason !== DisconnectReason.loggedOut) {
                console.log(chalk.dim('Mencoba menghubungkan kembali dalam 5 detik...'));
                setTimeout(() => startHc(), 5000); 
            }
        }
    });
    sock.ev.on('messages.upsert', async (event) => {
        for (const m of event.messages) {
            await sock.readMessages([m.key]);
            try {
                await handler(sock, m);
            } catch (error) {
                console.error(chalk.red('[ERROR HANDLER]'), error);
            }
        }
    });
    sock.ev.on('group-participants.update', async (update) => {
        try {
            if (typeof GroupParticipantsUpdate !== 'undefined') {
                await GroupParticipantsUpdate(sock, update, global.store);
            }
        } catch (e) {
            console.error('[ERROR GROUP UPDATE]', e);
        }
    });
    sock.ev.on('presences.update', (update) => {
        try {
            const { id, presences } = update;
            if (!global.store) global.store = {};
            if (!global.store.presences) global.store.presences = {};

            global.store.presences[id] = global.store.presences[id] || {};
            Object.assign(global.store.presences[id], presences);
        } catch (e) {
        }
    });
}

displaySystemInfo();
startHc();
          
