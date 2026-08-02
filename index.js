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
const question = (text) => new Promise((resolve) => rl.question(text, resolve))
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
          
