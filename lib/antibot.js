/*
   * fisht.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
const warnAt = new Map();
const INFO_TTL = 60 * 1000;
const infoCache = new Map();
const WARN_COOLDOWN = 5 * 60 * 1000;
const userPart = (j) => String(j || '').split('@')[0].split(':')[0];

export function detectBotId(id, strict = false) {
  id = String(id || '');
  if (id.startsWith('BAE5')) return `ID diawali BAE5 (Baileys lama), panjang ${id.length}`;
  if (id.startsWith('3EB0')) {
    if (id.length !== 22) return `ID diawali 3EB0 dengan panjang ${id.length} (bukan WhatsApp Web)`;
    if (strict) return 'ID diawali 3EB0 panjang 22 (mode ketat)';
  }
  return null;
}

function listed(g, m) {
  const list = Array.isArray(g.botList) ? g.botList : [];
  return [m.key.participant, m.key.participantAlt].filter(Boolean).some((j) => list.includes(userPart(j)));
}

async function getGroupInfo(hc, jid, force = false) {
  const key = userPart(hc.user?.id) + ':' + jid;
  const hit = infoCache.get(key);
  if (!force && hit && Date.now() - hit.t < INFO_TTL) return hit.v;
  try {
    const meta = await hc.groupMetadata(jid);
    const admins = new Set();
    for (const p of meta?.participants || []) {
      if (!p.admin) continue;
      [p.id, p.lid, p.phoneNumber, p.jid].filter(Boolean).forEach((x) => admins.add(userPart(x)));
    }
    const botIds = [hc.user?.id, hc.user?.lid, hc.user?.jid].filter(Boolean).map(userPart);
    const v = { admins, botIsAdmin: botIds.some((b) => admins.has(b)) };
    infoCache.set(key, { t: Date.now(), v });
    return v;
  } catch {
    return null;
  }
}

export const invalidateGroupInfo = (jid) => {
  for (const k of infoCache.keys()) if (k.endsWith(':' + jid)) infoCache.delete(k);
};

const isAdminMsg = (info, m) =>
  [m.key.participant, m.key.participantAlt].filter(Boolean).some((j) => info.admins.has(userPart(j)));

function isOwnerMsg(m, ownerNumbers = []) {
  return [m.key.participant, m.key.participantAlt].filter(Boolean)
    .some((j) => ownerNumbers.some((o) => userPart(j) === String(o).replace(/[^0-9]/g, '')));
}

function isOwnBot(m, isOwn, hcMain) {
  const ids = [m.key.participant, m.key.participantAlt].filter(Boolean).map(userPart);
  const main = [hcMain?.user?.id, hcMain?.user?.lid, hcMain?.user?.jid].filter(Boolean).map(userPart);
  return ids.some((i) => main.includes(i) || (typeof isOwn === 'function' && isOwn(i)));
}

export async function antibotGuard(hc, m, db, { ownerNumbers = [], isOwn, hcMain } = {}) {
  const from = m.key?.remoteJid;
  if (!from || !from.endsWith('@g.us') || m.key.fromMe || !m.key.participant) return false;
  const g = db?.groups?.[from];
  if (!g || !g.antibot) return false;

  const kind = Object.keys(m.message || {}).find((k) => !['senderKeyDistributionMessage', 'messageContextInfo'].includes(k));
  if (!kind || kind === 'protocolMessage' || kind === 'reactionMessage') return false;

  const reason = listed(g, m) ? 'ada di daftar manual' : detectBotId(m.key.id, !!g.antibotStrict);
  if (!reason) return false;

  if (isOwnerMsg(m, ownerNumbers) || isOwnBot(m, isOwn, hcMain || global.hcMain)) return false;

  const info = await getGroupInfo(hc, from);
  if (!info) return false;
  if (isAdminMsg(info, m)) return false;

  let deleted = false;
  if (info.botIsAdmin) {
    try { await hc.sendMessage(from, { delete: m.key }); deleted = true; } catch {
    }
  }

  const sender = m.key.participant;
  const wk = from + ':' + userPart(sender);
  const now = Date.now();
  if (now - (warnAt.get(wk) || 0) >= WARN_COOLDOWN) {
    warnAt.set(wk, now);
    if (warnAt.size > 500) for (const [k, t] of warnAt) if (now - t > WARN_COOLDOWN) warnAt.delete(k);
    const text = `⚠️ *ANTIBOT*\n@${userPart(sender)} terdeteksi sebagai bot. Bot lain tidak diizinkan di grup ini.\n`
      + (deleted ? 'Pesannya dihapus.' : 'Jadikan bot ini admin agar pesan bot lain bisa dihapus otomatis.');
    await hc.sendMessage(from, { text, mentions: [sender] }).catch(() => {});
  }
  return true;
}

function resolveTargets(args, contextInfo) {
  const out = new Set();
  if (contextInfo?.participant) out.add(userPart(contextInfo.participant));
  for (const j of contextInfo?.mentionedJid || []) out.add(userPart(j));
  for (const a of args) { const d = a.replace(/[^0-9]/g, ''); if (d.length >= 8) out.add(d); }
  return [...out];
}

export async function antibotCommand({ hc, m, db, args = [], prefix = '.', isCreator = false, contextInfo }) {
  const from = m.key.remoteJid;
  if (!from.endsWith('@g.us')) return { text: 'Fitur antibot hanya bisa dipakai di grup.' };
  db.groups = db.groups || {};
  const g = (db.groups[from] = db.groups[from] && typeof db.groups[from] === 'object' ? db.groups[from] : {});
  if (typeof g.antibot !== 'boolean') g.antibot = false;
  if (typeof g.antibotStrict !== 'boolean') g.antibotStrict = false;
  if (!Array.isArray(g.botList)) g.botList = [];

  const p = `${prefix}antibot`;
  const info = await getGroupInfo(hc, from, true);
  const isAdm = isCreator || (!!info && isAdminMsg(info, m));
  const sub = String(args[0] || '').toLowerCase();
  const rest = args.slice(1);
  const onoff = (v) => ({ on: true, aktif: true, '1': true, off: false, mati: false, '0': false })[String(v || '').toLowerCase()];

  if (!sub || sub === 'status') {
    return { text: `🛡️ *ANTIBOT*\nStatus: ${g.antibot ? 'aktif ✅' : 'nonaktif ❌'}\nMode ketat: ${g.antibotStrict ? 'aktif' : 'nonaktif'}\nDaftar manual: ${g.botList.length} akun\nBot ini admin: ${info ? (info.botIsAdmin ? 'ya, pesan bot lain dihapus + peringatan' : 'tidak, hanya peringatan') : 'tidak diketahui'}\n\n*Perintah (admin grup/owner)*\n${p} on / off\n${p} strict on / off\n${p} add (balas pesan bot) atau nomor\n${p} del (balas pesan bot) atau nomor\n${p} list\n${p} cek (balas pesan, lihat hasil deteksi)` };
  }

  if (!isAdm) return { text: info ? 'Perintah ini khusus admin grup atau owner.' : 'Gagal membaca data grup, coba lagi sebentar.' };

  if (sub === 'on' || sub === 'off') {
    g.antibot = sub === 'on';
    invalidateGroupInfo(from);
    const fresh = g.antibot ? await getGroupInfo(hc, from, true) : null;
    return { text: g.antibot
      ? `🛡️ Antibot *aktif*.\n${fresh?.botIsAdmin ? 'Bot ini admin: pesan bot lain akan dihapus + peringatan.' : 'Bot ini belum admin: pesan bot lain hanya diberi peringatan.'}\nTambahkan bot yang lolos deteksi dengan ${p} add (balas pesan bot itu).`
      : '🛡️ Antibot *dimatikan* di grup ini.' };
  }

  if (sub === 'strict') {
    const v = onoff(rest[0]);
    if (v === undefined) return { text: `Pakai: ${p} strict on atau ${p} strict off\nMode ketat juga menganggap ID 3EB0 sepanjang 22 karakter sebagai bot. Bot Baileys terbaru terdeteksi, tapi pengguna WhatsApp Web non-admin bisa ikut terkena.` };
    g.antibotStrict = v;
    return { text: `Mode ketat ${v ? '*aktif*. Pengguna WhatsApp Web non-admin bisa ikut terdeteksi, pantau dengan hati-hati.' : '*nonaktif*.'}` };
  }

  if (sub === 'add' || sub === 'del' || sub === 'hapus') {
    const targets = resolveTargets(rest, contextInfo);
    if (!targets.length) return { text: `Balas pesan bot yang dimaksud lalu ketik ${p} ${sub}, atau tulis nomornya.` };
    const done = [], skipped = [];
    for (const t of targets) {
      if (sub === 'add') {
        if (info?.admins.has(t)) { skipped.push(t + ' (admin grup)'); continue; }
        if (!g.botList.includes(t)) g.botList.push(t);
        done.push(t);
      } else {
        const i = g.botList.indexOf(t);
        if (i >= 0) { g.botList.splice(i, 1); done.push(t); } else skipped.push(t + ' (tidak ada di daftar)');
      }
    }
    return { text: `${sub === 'add' ? '➕ Ditambahkan' : '➖ Dihapus'}: ${done.length ? done.join(', ') : '-'}${skipped.length ? '\nDilewati: ' + skipped.join(', ') : ''}\nTotal daftar manual: ${g.botList.length}\n_Kalau nomor tidak mempan karena grup memakai ID LID, tambahkan lewat balas pesan._` };
  }

  if (sub === 'list') {
    return { text: g.botList.length ? `🛡️ *DAFTAR BOT (manual)*\n${g.botList.map((x, i) => `${i + 1}. ${x}`).join('\n')}` : 'Daftar manual kosong.' };
  }

  if (sub === 'cek') {
    if (!contextInfo?.stanzaId) return { text: `Balas pesan yang mau dicek lalu ketik ${p} cek.` };
    const id = contextInfo.stanzaId;
    const who = contextInfo.participant || '';
    const fake = { key: { participant: who } };
    const normal = detectBotId(id, false);
    const strict = detectBotId(id, true);
    return { text: `🔎 *CEK PESAN*\nID: ${id}\nPanjang: ${id.length}\nPengirim: ${userPart(who) || '-'}\nTerdeteksi (normal): ${normal || 'tidak'}\nTerdeteksi (ketat): ${strict || 'tidak'}\nDi daftar manual: ${listed(g, fake) ? 'ya' : 'tidak'}\nAdmin grup: ${info && who ? (isAdminMsg(info, fake) ? 'ya (dikecualikan)' : 'tidak') : '-'}` };
  }

  return { text: `Subcommand tidak dikenal. Ketik ${p} untuk melihat daftar perintah.` };
}
