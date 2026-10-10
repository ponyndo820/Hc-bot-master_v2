/*
   * jadibot.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import NodeCache from 'node-cache';
import makeWaSocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason,
} from '@whiskeysockets/baileys';

export const SESSION_ROOT = path.resolve('database', 'jadibot');

const active = (global.__jadibots ||= new Map());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (n, msg) => console.log(`[JADIBOT ${n}] ${msg}`);

export const isJadibotActive = (number) => active.has(number);

function removeSession(number) {
  const dir = path.join(SESSION_ROOT, number);
  if (dir.startsWith(SESSION_ROOT + path.sep) && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function isRegistered(number) {
  try {
    const file = path.join(SESSION_ROOT, number, 'creds.json');
    return JSON.parse(fs.readFileSync(file, 'utf8')).registered === true;
  } catch {
    return false;
  }
}

/**
 * @param {string} number  nomor jadibot (62xxx)
 * @param {object} opts
 * @param {Function} opts.Hc        handler utama (Hc.js)
 * @param {Function} opts.getDb     () => database global
 * @param {Function} [opts.notify]  async (teks) => kirim info ke peminta (kosong saat auto-restore)
 * @param {Function} [opts.onOpen]  dipanggil saat berhasil terhubung
 * @param {boolean}  [opts.pair]    true = minta kode pairing bila belum terdaftar
 */
export async function startJadibot(number, { Hc, getDb, notify = async () => {}, onOpen, pair = false }) {
  if (active.has(number)) return;
  const entry = { sock: null, timer: null, stopped: false };
  active.set(number, entry);

  const sessionPath = path.join(SESSION_ROOT, number);
  fs.mkdirSync(sessionPath, { recursive: true });
  const msgRetryCounterCache = new NodeCache();
  let codeRequested = false;

  const stop = (deleteSession = false) => {
    entry.stopped = true;
    clearTimeout(entry.timer);
    try { entry.sock?.ev.removeAllListeners(); entry.sock?.end?.(undefined); } catch {}
    active.delete(number);
    if (deleteSession) removeSession(number);
  };

  const schedule = (ms) => {
    clearTimeout(entry.timer);
    if (!entry.stopped) entry.timer = setTimeout(connect, ms);
  };

  async function connect() {
    if (entry.stopped) return;
    try { entry.sock?.ev.removeAllListeners(); entry.sock?.end?.(undefined); } catch {}

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version } = await fetchLatestBaileysVersion();
    const opts = {
      version,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
      },
      browser: ['Mac OS', 'Chrome', '10.15.7'],
      msgRetryCounterCache,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false,

    };
    const sock = makeWaSocket.default ? makeWaSocket.default(opts) : makeWaSocket(opts);
    sock.isJadibot = true;
    entry.sock = sock;
    
    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (entry.stopped || entry.sock !== sock) return;
      
      if (connection === 'open') {
        log(number, 'terhubung');
        try { await onOpen?.(sock); } catch {}
        await notify(`✅ Berhasil terhubung! Nomor *${number}* sekarang resmi menjadi bot.`).catch(() => {});
      }
      
      if (connection === 'close') {
        const code = lastDisconnect?.error?.output?.statusCode;
        log(number, `terputus, kode: ${code}`);
        
        if (code === DisconnectReason.restartRequired) {
          return schedule(3000);
        }
        if (!sock.authState.creds.registered) {
          stop(true);
          return notify(`❌ Gagal menautkan perangkat untuk nomor *${number}*. Silakan coba lagi.`).catch(() => {});
        }
        if (code === DisconnectReason.loggedOut) {
          stop(true);
          return notify(`❌ Sesi jadibot *${number}* dikeluarkan dari WhatsApp.`).catch(() => {});
        }
        if (code === DisconnectReason.connectionReplaced) {
          log(number, 'sesi dipakai perangkat/proses lain, dihentikan tanpa menghapus sesi');
          return stop(false);
        }
        schedule(5000);
      }
    });
    
        sock.ev.on('messages.upsert', async (chatUpdate) => {
      try {
        if (chatUpdate.type !== 'notify') return;          // ← baris baru
        const msg = chatUpdate.messages?.[0];
        if (!msg?.message) return;

        const t = msg.messageTimestamp;                    // ← tiga baris baru
        const ts = typeof t === 'number' ? t : (t?.toNumber?.() ?? 0);
        if (ts && Date.now() / 1000 - ts > 60) return;     // abaikan pesan > 60 detik

        msg.chat = msg.key.remoteJid;                      // ← bagian ini tetap, jangan diubah
        msg.isGroup = msg.chat.endsWith('@g.us');
        msg.sender = msg.key.fromMe
          ? sock.user.id.split(':')[0] + '@s.whatsapp.net'
          : msg.key.participant || msg.key.remoteJid;
        await Hc(sock, msg, getDb());
      } catch (err) {
        console.log(`[JADIBOT ${number}]`, err);
      }
    });
    
    if (pair && !sock.authState.creds.registered && !codeRequested) {
      codeRequested = true;
      await notify(`⏳ *Sedang memproses kode pairing untuk nomor ${number}, mohon tunggu...*`).catch(() => {});
      await sleep(4000);
      if (entry.sock !== sock || entry.stopped) return;
      try {
        const code = await sock.requestPairingCode(number);
        const shown = code?.match(/.{1,4}/g)?.join('-') || code;
        await notify(
          `KODE PAIRING ANDA: *${shown}*\n\n⚠️ *PENTING:*\nMasukkan kode ini di HP dengan nomor WhatsApp *${number}*.\n\nCara: Buka WA ➔ Setelan ➔ Perangkat Tertaut ➔ Tautkan dengan nomor telepon.`
        );
      } catch (err) {
        console.error('Gagal mengambil kode pairing jadibot:', err);
        stop(true);
        await notify('❌ Gagal mengambil kode pairing. Pastikan nomor aktif dan coba kembali.').catch(() => {});
      }
    }
  }

  await connect();
}

export async function restoreJadibots(deps) {
  if (!fs.existsSync(SESSION_ROOT)) return;
  const numbers = fs.readdirSync(SESSION_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const number of numbers) {
    if (!isRegistered(number)) {
      removeSession(number);
      continue;
    }
    try {
      log(number, 'memulihkan sesi...');
      await startJadibot(number, { ...deps, pair: false });
    } catch (err) {
      console.log(`[JADIBOT ${number}] gagal dipulihkan:`, err.message);
    }
    await sleep(3000);
  }
}
