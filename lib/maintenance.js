import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';

export const DB_DIR = path.join(process.cwd(), 'database');
export const TEMP_DIR = path.join(DB_DIR, 'temp');
export const SESSION_DIR = path.join(process.cwd(), 'sessions');
export const JADIBOT_DIR = path.join(DB_DIR, 'jadibot');

export const fmtBytes = (n) => {
  if (!n) return '0 B';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), u.length - 1);
  return `${(n / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`;
};

const safeJson = (obj, space) => JSON.stringify(obj, (k, v) => (typeof v === 'bigint' ? v.toString() : v), space);

export function dirStats(dir) {
  let files = 0, bytes = 0;
  if (!fs.existsSync(dir)) return { files, bytes };
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      const s = dirStats(p); files += s.files; bytes += s.bytes;
    } else {
      files++; try { bytes += fs.statSync(p).size; } catch {}
    }
  }
  return { files, bytes };
}

export function getDatabaseInfo(db, dbFileName = 'database.json') {
  const isMongo = /^mongodb/i.test(String(dbFileName));
  const info = {
    backend: isMongo ? 'MongoDB' : 'JSON (file)',
    users: Object.keys(db?.users || {}).length,
    groups: Object.keys(db?.groups || {}).length,
    keys: Object.keys(db || {}).length,
    memoryBytes: Buffer.byteLength(safeJson(db || {})),
    file: null,
    fileBytes: 0,
    fileMtime: null,
    lastLimitReset: db?.lastLimitReset || '-',
  };
  if (!isMongo) {
    const f = path.join(DB_DIR, dbFileName);
    if (fs.existsSync(f)) {
      const st = fs.statSync(f);
      info.file = f; info.fileBytes = st.size; info.fileMtime = st.mtime;
    }
  }
  return info;
}

export function buildBackup(db) {
  const date = new Date().toISOString().split('T')[0];
  const buffer = Buffer.from(safeJson(db, 2));
  return { buffer, fileName: `Backup_DB_${date}.json` };
}

export async function sendBackup(hc, jid, db, caption, options = {}) {
  const { buffer, fileName } = buildBackup(db);
  await hc.sendMessage(jid, { document: buffer, mimetype: 'application/json', fileName, caption }, options);
  return { fileName, bytes: buffer.length };
}


let deps = null;

export function getAutoBackupState(db) {
  const s = db?.autoBackup || {};
  return { enabled: s.enabled !== false, hours: Number(s.hours) > 0 ? Number(s.hours) : 6 };
}

function stopTimer() {
  if (global._backupInterval) { clearInterval(global._backupInterval); global._backupInterval = null; }
}

function startTimer(hours) {
  stopTimer();
  global._backupInterval = setInterval(async () => {
    try {
      const hc = deps?.getHc(); const db = deps?.getDb();
      if (!hc || !db) return;
      await sendBackup(hc, deps.getOwnerJid(), db,
        `📂 *AUTO BACKUP DATABASE*\n ini adalah file cadangan database otomatis bot (Interval ${hours} Jam).`);
      console.log('[SYSTEM] Auto Backup Database berhasil dikirim ke Owner.');
    } catch (e) {
      console.log('[SYSTEM] Auto Backup gagal:', e.message);
    }
  }, hours * 60 * 60 * 1000);
  global._backupInterval.unref?.();
}


export function initAutoBackup(d) {
  deps = d;
  const st = getAutoBackupState(d.getDb());
  if (st.enabled && !global._backupInterval) startTimer(st.hours);
  return st;
}


export function setAutoBackup(db, hours) {
  db.autoBackup = { enabled: true, hours };
  startTimer(hours);
  return getAutoBackupState(db);
}

export function disableAutoBackup(db) {
  const was = getAutoBackupState(db).enabled && !!global._backupInterval;
  db.autoBackup = { enabled: false, hours: getAutoBackupState(db).hours };
  stopTimer();
  return was;
}


const readCreds = (dir) => {
  try { return JSON.parse(fs.readFileSync(path.join(dir, 'creds.json'), 'utf8')); } catch { return null; }
};


export function getSessionInfo(isActive = () => false) {
  const mc = readCreds(SESSION_DIR);
  const main = {
    exists: fs.existsSync(SESSION_DIR),
    ...dirStats(SESSION_DIR),
    registered: mc?.registered === true,
    number: mc?.me?.id ? String(mc.me.id).split(':')[0].split('@')[0] : null,
  };
  const jadibots = [];
  if (fs.existsSync(JADIBOT_DIR)) {
    for (const e of fs.readdirSync(JADIBOT_DIR, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      const dir = path.join(JADIBOT_DIR, e.name);
      jadibots.push({ number: e.name, ...dirStats(dir), registered: readCreds(dir)?.registered === true, active: !!isActive(e.name) });
    }
  }
  return { main, jadibots };
}


export function archiveSession(target = 'main') {
  const isMain = target === 'main';
  const dir = isMain ? SESSION_DIR : path.join(JADIBOT_DIR, target);
  if (!isMain && !/^\d{6,20}$/.test(target)) return Promise.reject(new Error('Nomor jadibot tidak valid.'));
  if (!fs.existsSync(dir)) return Promise.reject(new Error(isMain ? 'Folder sessions/ tidak ditemukan.' : `Sesi jadibot ${target} tidak ditemukan.`));
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const name = `${isMain ? 'session' : 'jadibot_' + target}_${new Date().toISOString().split('T')[0]}.tar.gz`;
  const out = path.join(TEMP_DIR, `${Date.now()}_${name}`);
  return new Promise((resolve, reject) => {
    execFile('tar', ['-czf', out, '-C', path.dirname(dir), path.basename(dir)], { timeout: 60000 }, (err) => {
      if (err) return reject(new Error('Gagal membuat arsip (tar): ' + err.message));
      resolve({ file: out, fileName: name, bytes: fs.statSync(out).size });
    });
  });
}


export function deleteMainSession() {
  const { files } = dirStats(SESSION_DIR);
  fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  return files;
}


export function deleteJadibotFolder(number) {
  if (!/^\d{6,20}$/.test(number)) throw new Error('Nomor jadibot tidak valid.');
  const dir = path.join(JADIBOT_DIR, number);
  if (!dir.startsWith(JADIBOT_DIR + path.sep)) throw new Error('Path tidak valid.');
  const { files } = dirStats(dir);
  fs.rmSync(dir, { recursive: true, force: true });
  return files;
}


export function cleanJunk({ minAgeMs = 2 * 60 * 1000 } = {}) {
  const now = Date.now();
  let count = 0, bytes = 0, skipped = 0;
  const removeEntry = (p) => {
    let st; try { st = fs.statSync(p); } catch { return; }
    if (now - st.mtimeMs < minAgeMs) { skipped++; return; }
    const size = st.isDirectory() ? dirStats(p).bytes : st.size;
    try { fs.rmSync(p, { recursive: true, force: true }); count++; bytes += size; } catch {}
  };
  if (fs.existsSync(TEMP_DIR)) for (const n of fs.readdirSync(TEMP_DIR)) removeEntry(path.join(TEMP_DIR, n));
  if (fs.existsSync(DB_DIR)) {
    for (const n of fs.readdirSync(DB_DIR)) {
      if (/\.tmp$/.test(n) || /\.corrupt-/.test(n)) removeEntry(path.join(DB_DIR, n));
    }
  }
  return { count, bytes, skipped };
}
