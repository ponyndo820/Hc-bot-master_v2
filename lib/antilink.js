/*
 * lib/antilink.js - ANTILINK untuk grup
 *
 * Saat dinyalakan di sebuah grup (.antilink on), pesan yang berisi link dari anggota biasa akan:
 *   - bot ini ADMIN       -> pesan dihapus + peringatan
 *   - bot ini bukan admin -> hanya peringatan
 * Opsional (.antilink kick on): anggota dikeluarkan setelah beberapa kali mengirim link.
 *
 * Mode:
 *   wa  (bawaan) hanya link undangan grup/channel WhatsApp
 *   all          semua link (kecuali domain yang diizinkan lewat .antilink allow <domain>)
 *
 * Tidak pernah terkena: admin grup, owner, bot sendiri (bot utama dan jadibot).
 * Pesan yang berupa command bot (mis. .ytmp3 https://...) tidak dianggap pelanggaran untuk link biasa,
 * tapi link undangan WhatsApp tetap diblokir walau dibungkus command.
 */

export const CFG = {
  warnCooldownMs: 60 * 1000,         // peringatan per orang per grup
  kickAfter: 3,                      // jumlah pelanggaran sebelum dikeluarkan (jika mode kick aktif)
  strikeWindowMs: 24 * 3600 * 1000,  // pelanggaran dihitung dalam rentang ini
  infoTtlMs: 60 * 1000,              // cache data admin grup
};

const userPart = (j) => String(j || '').split('@')[0].split(':')[0];
const infoCache = new Map();
const warnAt = new Map();
const strikes = new Map();

// ============================== DETEKSI ==============================

const WA_RE = /(?:https?:\/\/)?(?:chat\.whatsapp\.com\/(?:invite\/)?[A-Za-z0-9]{8,}|(?:www\.)?whatsapp\.com\/channel\/[A-Za-z0-9]+)/i;
const TLD = 'com|net|org|id|co|io|me|xyz|info|biz|link|site|online|app|dev|ly|gg|tv|cc|to|ws|club|top|shop|store|us|uk|in|ru|cn|jp|kr|vip|live|fun|pro|tech|cloud|page|blog|news|stream|link|click|work|today|world';
const URL_RE = new RegExp(`(?:https?:\\/\\/|www\\.)[^\\s<>"']+|\\b(?:[a-z0-9-]{1,63}\\.)+(?:${TLD})\\b(?:\\/[^\\s<>"']*)?`, 'gi');

const hostOf = (u) => String(u).toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[\/?#:]/)[0].replace(/[.,;!)]+$/, '');

export function normDomain(s) {
  const h = hostOf(String(s || '').trim());
  return /^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(h) ? h : null;
}

// Mengembalikan { kind: 'wa' | 'url', match } atau null
export function detectLink(text, { mode = 'wa', allow = [] } = {}) {
  const t = String(text || '').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');
  const wa = t.match(WA_RE);
  if (wa) return { kind: 'wa', match: wa[0] };
  if (mode !== 'all') return null;
  URL_RE.lastIndex = 0;
  let r;
  while ((r = URL_RE.exec(t))) {
    if (t[r.index - 1] === '@') continue; // bagian dari alamat email
    const host = hostOf(r[0]);
    if (!host.includes('.')) continue;
    if (allow.some((d) => host === d || host.endsWith('.' + d))) continue;
    return { kind: 'url', match: r[0] };
  }
  return null;
}

function extractText(message) {
  let msg = message || {};
  for (let i = 0; i < 3; i++) {
    const inner = msg.ephemeralMessage?.message || msg.viewOnceMessage?.message
      || msg.viewOnceMessageV2?.message || msg.documentWithCaptionMessage?.message;
    if (!inner) break;
    msg = inner;
  }
  const ext = msg.extendedTextMessage;
  return [msg.conversation, ext?.text, ext?.matchedText, ext?.canonicalUrl,
    msg.imageMessage?.caption, msg.videoMessage?.caption, msg.documentMessage?.caption]
    .filter(Boolean).join('\n');
}

// ============================== DATA GRUP ==============================

async function getGroupInfo(hc, jid, force = false) {
  const key = userPart(hc.user?.id) + ':' + jid;
  const hit = infoCache.get(key);
  if (!force && hit && Date.now() - hit.t < CFG.infoTtlMs) return hit.v;
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

const invalidate = (jid) => { for (const k of infoCache.keys()) if (k.endsWith(':' + jid)) infoCache.delete(k); };
const senderIds = (m) => [m.key.participant, m.key.participantAlt].filter(Boolean);
const isAdminMsg = (info, m) => senderIds(m).some((j) => info.admins.has(userPart(j)));
const isOwnerMsg = (m, owners = []) => senderIds(m).some((j) => owners.some((o) => userPart(j) === String(o).replace(/[^0-9]/g, '')));
function isOwnBot(m, isOwn, hcMain) {
  const ids = senderIds(m).map(userPart);
  const main = [hcMain?.user?.id, hcMain?.user?.lid, hcMain?.user?.jid].filter(Boolean).map(userPart);
  return ids.some((i) => main.includes(i) || (typeof isOwn === 'function' && isOwn(i)));
}

// ============================== PENJAGA PESAN ==============================
// Mengembalikan true kalau pesan berisi link terlarang dan sudah ditangani (hentikan pemrosesan lain).

export async function antilinkGuard(hc, m, db, { ownerNumbers = [], isOwn, hcMain, isCommand } = {}) {
  const from = m.key?.remoteJid;
  if (!from || !from.endsWith('@g.us') || m.key.fromMe || !m.key.participant) return false;
  const g = db?.groups?.[from];
  if (!g || !g.antilink) return false;

  const text = extractText(m.message);
  if (!text) return false;
  const found = detectLink(text, { mode: g.antilinkMode === 'all' ? 'all' : 'wa', allow: g.antilinkAllow || [] });
  if (!found) return false;
  if (found.kind === 'url' && typeof isCommand === 'function' && isCommand(text.split('\n')[0])) return false;

  if (isOwnerMsg(m, ownerNumbers) || isOwnBot(m, isOwn, hcMain || global.hcMain)) return false;
  const info = await getGroupInfo(hc, from);
  if (!info) return false;               // tidak bisa memastikan pengirim bukan admin: jangan bertindak
  if (isAdminMsg(info, m)) return false; // admin dikecualikan

  let deleted = false;
  if (info.botIsAdmin) {
    try { await hc.sendMessage(from, { delete: m.key }); deleted = true; } catch { /* abaikan */ }
  }

  const sender = m.key.participant;
  const key = from + ':' + userPart(sender);
  const now = Date.now();

  // hitung pelanggaran (untuk mode kick)
  let st = strikes.get(key);
  if (!st || now - st.t > CFG.strikeWindowMs) st = { n: 0, t: now };
  st.n++;
  strikes.set(key, st);
  if (strikes.size > 1000) for (const [k, v] of strikes) if (now - v.t > CFG.strikeWindowMs) strikes.delete(k);

  if (g.antilinkKick && info.botIsAdmin && st.n >= CFG.kickAfter) {
    try {
      await hc.groupParticipantsUpdate(from, [sender], 'remove');
      strikes.delete(key);
      await hc.sendMessage(from, { text: `🚫 *ANTILINK*\n@${userPart(sender)} dikeluarkan karena mengirim link sebanyak ${CFG.kickAfter} kali.`, mentions: [sender] }).catch(() => {});
      return true;
    } catch { /* gagal mengeluarkan: lanjut ke peringatan biasa */ }
  }

  if (now - (warnAt.get(key) || 0) >= CFG.warnCooldownMs) {
    warnAt.set(key, now);
    if (warnAt.size > 1000) for (const [k, t] of warnAt) if (now - t > CFG.warnCooldownMs) warnAt.delete(k);
    const kickNote = g.antilinkKick && info.botIsAdmin ? `\nPeringatan ${Math.min(st.n, CFG.kickAfter)}/${CFG.kickAfter}. Mengirim link ${CFG.kickAfter} kali akan dikeluarkan.` : '';
    const text2 = `⚠️ *ANTILINK*\n@${userPart(sender)} dilarang mengirim link di grup ini.\n`
      + (deleted ? 'Pesannya dihapus.' : 'Jadikan bot ini admin agar link otomatis dihapus.') + kickNote;
    await hc.sendMessage(from, { text: text2, mentions: [sender] }).catch(() => {});
  }
  return true;
}

// ============================== PERINTAH .antilink ==============================

export async function antilinkCommand({ hc, m, db, args = [], prefix = '.', isCreator = false }) {
  const from = m.key.remoteJid;
  if (!from.endsWith('@g.us')) return { text: 'Fitur antilink hanya bisa dipakai di grup.' };
  db.groups = db.groups || {};
  const g = (db.groups[from] = db.groups[from] && typeof db.groups[from] === 'object' ? db.groups[from] : {});
  if (typeof g.antilink !== 'boolean') g.antilink = false;
  if (g.antilinkMode !== 'all') g.antilinkMode = 'wa';
  if (typeof g.antilinkKick !== 'boolean') g.antilinkKick = false;
  if (!Array.isArray(g.antilinkAllow)) g.antilinkAllow = [];

  const p = `${prefix}antilink`;
  const info = await getGroupInfo(hc, from, true);
  const isAdm = isCreator || (!!info && isAdminMsg(info, m));
  const sub = String(args[0] || '').toLowerCase();
  const rest = args.slice(1);
  const onoff = (v) => ({ on: true, aktif: true, '1': true, off: false, mati: false, '0': false })[String(v || '').toLowerCase()];

  if (!sub || sub === 'status') {
    return { text: `🔗 *ANTILINK*\nStatus: ${g.antilink ? 'aktif ✅' : 'nonaktif ❌'}\nMode: ${g.antilinkMode === 'all' ? 'all (semua link)' : 'wa (link grup/channel WhatsApp)'}\nKick setelah ${CFG.kickAfter}x: ${g.antilinkKick ? 'aktif' : 'nonaktif'}\nDomain diizinkan: ${g.antilinkAllow.length}\nBot ini admin: ${info ? (info.botIsAdmin ? 'ya, link dihapus + peringatan' : 'tidak, hanya peringatan') : 'tidak diketahui'}\n\n*Perintah (admin grup/owner)*\n${p} on / off\n${p} mode wa / all\n${p} kick on / off\n${p} allow <domain>\n${p} unallow <domain>\n${p} list\n${p} cek <teks>` };
  }

  if (sub === 'cek') {
    const t = rest.join(' ');
    if (!t) return { text: `Pakai: ${p} cek <teks atau link>` };
    const r = detectLink(t, { mode: g.antilinkMode, allow: g.antilinkAllow });
    const rAll = detectLink(t, { mode: 'all', allow: g.antilinkAllow });
    return { text: `🔎 *CEK LINK*\nMode sekarang (${g.antilinkMode}): ${r ? 'TERDETEKSI (' + r.kind + ': ' + r.match + ')' : 'aman'}\nMode all: ${rAll ? 'TERDETEKSI (' + rAll.kind + ': ' + rAll.match + ')' : 'aman'}` };
  }

  if (!isAdm) return { text: info ? 'Perintah ini khusus admin grup atau owner.' : 'Gagal membaca data grup, coba lagi sebentar.' };

  if (sub === 'on' || sub === 'off') {
    g.antilink = sub === 'on';
    invalidate(from);
    const fresh = g.antilink ? await getGroupInfo(hc, from, true) : null;
    return { text: g.antilink
      ? `🔗 Antilink *aktif* (mode ${g.antilinkMode}).\n${fresh?.botIsAdmin ? 'Bot ini admin: link akan dihapus + peringatan.' : 'Bot ini belum admin: link hanya diberi peringatan.'}`
      : '🔗 Antilink *dimatikan* di grup ini.' };
  }

  if (sub === 'mode') {
    const v = String(rest[0] || '').toLowerCase();
    if (!['wa', 'all'].includes(v)) return { text: `Pakai: ${p} mode wa (hanya link grup/channel WhatsApp) atau ${p} mode all (semua link)` };
    g.antilinkMode = v;
    return { text: `🔗 Mode antilink: *${v}*${v === 'all' ? '\nSemua link dari anggota biasa akan ditindak. Izinkan domain tertentu dengan ' + p + ' allow <domain>.' : ''}` };
  }

  if (sub === 'kick') {
    const v = onoff(rest[0]);
    if (v === undefined) return { text: `Pakai: ${p} kick on atau ${p} kick off\nAnggota yang mengirim link ${CFG.kickAfter} kali (dalam 24 jam) akan dikeluarkan, hanya jika bot ini admin.` };
    g.antilinkKick = v;
    return { text: `Kick antilink *${v ? 'aktif' : 'nonaktif'}*.${v && !info?.botIsAdmin ? '\n⚠️ Bot ini belum admin, jadi kick belum bisa berjalan.' : ''}` };
  }

  if (sub === 'allow' || sub === 'unallow') {
    const d = normDomain(rest[0]);
    if (!d) return { text: `Tulis domainnya. Contoh: ${p} ${sub} youtube.com` };
    if (sub === 'allow') {
      if (!g.antilinkAllow.includes(d)) g.antilinkAllow.push(d);
      return { text: `✅ Domain *${d}* (dan subdomainnya) diizinkan.\nTotal: ${g.antilinkAllow.length}` };
    }
    const i = g.antilinkAllow.indexOf(d);
    if (i < 0) return { text: `Domain ${d} tidak ada di daftar.` };
    g.antilinkAllow.splice(i, 1);
    return { text: `➖ Domain *${d}* dihapus dari daftar izin.\nTotal: ${g.antilinkAllow.length}` };
  }

  if (sub === 'list') {
    return { text: g.antilinkAllow.length ? `🔗 *DOMAIN DIIZINKAN*\n${g.antilinkAllow.map((x, i) => `${i + 1}. ${x}`).join('\n')}` : 'Belum ada domain yang diizinkan.' };
  }

  return { text: `Subcommand tidak dikenal. Ketik ${p} untuk melihat daftar perintah.` };
}
