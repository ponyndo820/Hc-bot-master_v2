/*
   * banchat.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
const userPart = (j) => String(j || '').split('@')[0].split(':')[0];

function extractText(message) {
  let msg = message || {};
  for (let i = 0; i < 3; i++) {
    const inner = msg.ephemeralMessage?.message || msg.viewOnceMessage?.message
      || msg.viewOnceMessageV2?.message || msg.documentWithCaptionMessage?.message;
    if (!inner) break;
    msg = inner;
  }
  return msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption
    || msg.videoMessage?.caption || msg.documentMessage?.caption || '';
}

const senderIds = (m) => [m.key.participant, m.key.participantAlt].filter(Boolean).map(userPart);
const isOwnerMsg = (m, owners = []) => senderIds(m).some((i) => owners.some((o) => i === String(o).replace(/[^0-9]/g, '')));

// true = admin, false = bukan admin, null = gagal membaca data grup
async function isGroupAdmin(hc, from, m) {
  try {
    const meta = await hc.groupMetadata(from);
    const me = senderIds(m);
    return (meta?.participants || []).some((p) => p.admin
      && [p.id, p.lid, p.phoneNumber, p.jid].filter(Boolean).map(userPart).some((x) => me.includes(x)));
  } catch {
    return null;
  }
}

export const isChatBanned = (db, jid) => !!db?.groups?.[jid]?.banned;

// ---------- penjaga: dipanggil di awal setiap pesan ----------
// Mengembalikan true kalau pesan harus diabaikan (grup sedang di-ban).
// Satu-satunya pengecualian: .unbanchat dari admin/owner, yang dibiarkan lewat ke handler perintah.

export async function banchatGuard(hc, m, db, { prefixes = ['.'], ownerNumbers = [] } = {}) {
  const from = m.key?.remoteJid;
  if (!from || !from.endsWith('@g.us') || !isChatBanned(db, from)) return false;

  const text = extractText(m.message).trim();
  const p = prefixes.find((x) => text.startsWith(x));
  const cmd = p ? text.slice(p.length).trim().split(/\s+/)[0].toLowerCase() : '';
  if (cmd !== 'unbanchat') return true;

  if (m.key.fromMe || isOwnerMsg(m, ownerNumbers)) return false;
  return (await isGroupAdmin(hc, from, m)) !== true; // bukan admin / tidak bisa dipastikan: abaikan
}

// ---------- perintah ----------

function normGroupJid(s) {
  const t = String(s || '').trim();
  if (/^[0-9]+(-[0-9]+)?@g\.us$/.test(t)) return t;
  if (/^[0-9]{10,}(-[0-9]+)?$/.test(t)) return t + '@g.us';
  return null;
}

export async function banchatCommand({ hc, m, db, command = 'banchat', args = [], prefix = '.', isCreator = false }) {
  const from = m.key.remoteJid;
  const inGroup = from.endsWith('@g.us');
  const unban = String(command).toLowerCase() === 'unbanchat';
  const p = `${prefix}${unban ? 'unbanchat' : 'banchat'}`;
  db.groups = db.groups || {};

  // daftar grup yang di-ban (owner)
  if (!unban && String(args[0] || '').toLowerCase() === 'list') {
    if (!isCreator) return { text: 'Perintah ini khusus owner.' };
    const ids = Object.keys(db.groups).filter((j) => db.groups[j]?.banned);
    if (!ids.length) return { text: 'Tidak ada grup yang sedang di-ban.' };
    const rows = [];
    for (const j of ids.slice(0, 30)) {
      let name = '';
      try { name = (await hc.groupMetadata(j))?.subject || ''; } catch { /* abaikan */ }
      rows.push(`${rows.length + 1}. ${name ? name + '\n    ' : ''}${j}`);
    }
    return { text: `🚫 *GRUP DI-BAN* (${ids.length})\n${rows.join('\n')}${ids.length > 30 ? `\n...dan ${ids.length - 30} lainnya` : ''}\n\nBuka: ${prefix}unbanchat <id grup>` };
  }

  // target: id grup yang ditulis (khusus owner) atau grup tempat perintah dijalankan
  const remote = args[0] ? normGroupJid(args[0]) : null;
  if (args[0] && !remote) return { text: `Id grup tidak valid. Contoh: ${p} 120363012345678901@g.us` };
  const target = remote || (inGroup ? from : null);
  if (!target) return { text: `Pakai di dalam grup, atau owner bisa menulis id grupnya: ${p} <id grup>@g.us` };

  if (remote && remote !== from) {
    if (!isCreator) return { text: 'Mengatur grup lain hanya bisa dilakukan owner.' };
  } else if (!isCreator) {
    const adm = await isGroupAdmin(hc, from, m);
    if (adm !== true) return { text: adm === false ? 'Perintah ini khusus admin grup atau owner.' : 'Gagal membaca data grup, coba lagi sebentar.' };
  }

  const g = (db.groups[target] = db.groups[target] && typeof db.groups[target] === 'object' ? db.groups[target] : {});
  let name = '';
  if (target !== from) { try { name = (await hc.groupMetadata(target))?.subject || ''; } catch { /* abaikan */ } }
  const label = target === from ? 'grup ini' : `grup ${name || target}`;

  if (unban) {
    if (!g.banned) return { text: `ℹ️ ${label[0].toUpperCase() + label.slice(1)} tidak sedang di-ban.` };
    g.banned = false;
    delete g.bannedBy; delete g.bannedAt;
    return { text: `✅ Bot diaktifkan kembali di ${label}.` };
  }

  if (g.banned) return { text: `ℹ️ ${label[0].toUpperCase() + label.slice(1)} sudah di-ban.` };
  g.banned = true;
  g.bannedBy = m.key.participant || from;
  g.bannedAt = Date.now();
  return { text: `🚫 Bot dinonaktifkan di ${label}.\nAdmin grup atau owner bisa mengaktifkannya lagi dengan *${prefix}unbanchat*.` };
}
