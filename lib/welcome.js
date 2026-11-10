/*
   * welcome.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
export const CFG = {
  dedupeMs: 30 * 1000,   // abaikan event yang sama dalam rentang ini (mis. bot utama + jadibot di grup yang sama)
  maxMentions: 15,       // maksimal nama yang di-mention dalam satu pesan
  imageTimeoutMs: 10 * 1000,
  imageMaxBytes: 5 * 1024 * 1024,
  maxTextLength: 1000,
};

const DEFAULT_WELCOME = `👋 *SELAMAT DATANG*\n@user\n\nSelamat bergabung di grup\n*@group* 🎉\nKamu member ke-@jumlah. Jangan lupa baca aturan grup dan berkenalan ya!`;
const DEFAULT_LEAVE = `👋 *SAMPAI JUMPA*\n@user telah meninggalkan grup\n*@group*.\nSisa member: @jumlah`;
const DEFAULT_KICK = `🚪 *DIKELUARKAN*\n@user dikeluarkan dari *@group*.\nSisa member: @jumlah`;

const userPart = (j) => String(j || '').split('@')[0].split(':')[0];
const seen = (global.__welcomeSeen ||= new Map());
const imgCache = new Map();

// Bantuan
function normParticipant(p) {
  if (typeof p === 'string') return { jid: p, ids: [userPart(p)] };
  const raw = [p?.id, p?.lid, p?.phoneNumber, p?.jid].filter(Boolean);
  return { jid: p?.id || p?.phoneNumber || p?.lid || p?.jid, ids: raw.map(userPart) };
}

async function groupSnapshot(hc, id) {
  try {
    const meta = await hc.groupMetadata(id);
    const set = new Set();
    for (const p of meta?.participants || []) [p.id, p.lid, p.phoneNumber, p.jid].filter(Boolean).forEach((x) => set.add(userPart(x)));
    return { subject: meta?.subject, size: (meta?.participants || []).length, set };
  } catch {
    return null;
  }
}

// Metadata bisa sudah atau belum memuat perubahan, jadi jumlah dihitung dengan memeriksa keduanya
function countAfter(action, snap, parts) {
  const inGroup = parts.filter((p) => p.ids.some((i) => snap.set.has(i))).length;
  return action === 'add' ? snap.size + (parts.length - inGroup) : snap.size - inGroup;
}

function render(tpl, { jids, subject, count }) {
  const shown = jids.slice(0, CFG.maxMentions).map((j) => '@' + userPart(j));
  let users = shown.join(' ');
  if (jids.length > CFG.maxMentions) users += ` dan ${jids.length - CFG.maxMentions} lainnya`;
  return tpl.replace(/@(user|group|jumlah)/gi, (_, k) => ({ user: users, group: subject, jumlah: String(count) })[k.toLowerCase()]);
}

async function defaultFetchImage(url) {
  if (imgCache.has(url)) return imgCache.get(url);
  const res = await fetch(url, { signal: AbortSignal.timeout(CFG.imageTimeoutMs) });
  if (!res.ok || !/^image\//i.test(res.headers.get('content-type') || '')) throw new Error('bukan gambar');
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length > CFG.imageMaxBytes) throw new Error('ukuran gambar tidak sesuai');
  if (imgCache.size >= 8) imgCache.delete(imgCache.keys().next().value);
  imgCache.set(url, buf);
  return buf;
}

async function sendGreeting(hc, id, text, mentions, settings, { rand = Math.random, fetchImage = defaultFetchImage } = {}) {
  const urls = settings?.thumbnailUrl?.url;
  const pool = Array.isArray(urls) ? urls.filter(Boolean) : [];
  if (pool.length) {
    try {
      const image = await fetchImage(pool[Math.floor(rand() * pool.length)]);
      return await hc.sendMessage(id, { image, caption: text, mentions });
    } catch {
      
    }
  }
  return hc.sendMessage(id, { text, mentions });
}

// Event anggota masuk / keluar

export async function handleGroupParticipants(hc, update, db, settings, opts = {}) {
  const { id, participants, action, author } = update || {};
  if (!id || !String(id).endsWith('@g.us') || !['add', 'remove'].includes(action) || !participants?.length) return;
  const g = db?.groups?.[id];
  if (!g || g.banned || !g[action === 'add' ? 'welcome' : 'leave']) return; // grup yang di-ban (banchat): bot diam

  const parts = participants.map(normParticipant).filter((p) => p.jid);
  const botIds = [hc.user?.id, hc.user?.lid, hc.user?.jid].filter(Boolean).map(userPart);
  const now = Date.now();
  const fresh = [];
  for (const p of parts) {
    if (p.ids.some((i) => botIds.includes(i))) continue; // bot sendiri
    const key = `${id}:${action}:${p.ids[0]}`;
    if (now - (seen.get(key) || 0) < CFG.dedupeMs) continue;
    seen.set(key, now);
    fresh.push(p);
  }
  if (seen.size > 500) for (const [k, t] of seen) if (now - t > CFG.dedupeMs) seen.delete(k);
  if (!fresh.length) return;

  const snap = await groupSnapshot(hc, id);
  const subject = snap?.subject || 'grup ini';
  const count = snap ? countAfter(action, snap, parts) : '-';
  const kicked = action === 'remove' && !!author && !fresh.some((p) => p.ids.includes(userPart(author)));
  const tpl = action === 'add'
    ? (g.text?.setwelcome || DEFAULT_WELCOME)
    : (g.text?.setleave || (kicked ? DEFAULT_KICK : DEFAULT_LEAVE));
  const jids = fresh.map((p) => p.jid);
  await sendGreeting(hc, id, render(tpl, { jids, subject, count }), jids.slice(0, CFG.maxMentions), settings, opts);
}

// Perintah

async function senderIsAdmin(hc, from, m) {
  try {
    const meta = await hc.groupMetadata(from);
    const me = [m.key.participant, m.key.participantAlt].filter(Boolean).map(userPart);
    return (meta?.participants || []).some((p) => p.admin
      && [p.id, p.lid, p.phoneNumber, p.jid].filter(Boolean).map(userPart).some((x) => me.includes(x)));
  } catch {
    return null;
  }
}

export async function welcomeCommand({ hc, m, db, command = 'welcome', args = [], prefix = '.', isCreator = false, settings, rand, fetchImage }) {
  const from = m.key.remoteJid;
  if (!from.endsWith('@g.us')) return { text: 'Fitur sambutan hanya bisa dipakai di grup.' };
  db.groups = db.groups || {};
  const g = (db.groups[from] = db.groups[from] && typeof db.groups[from] === 'object' ? db.groups[from] : {});
  if (typeof g.welcome !== 'boolean') g.welcome = false;
  if (typeof g.leave !== 'boolean') g.leave = false;
  if (!g.text || typeof g.text !== 'object') g.text = {};

  const cmd = String(command).toLowerCase();
  const isSet = cmd.startsWith('set');
  const kind = /welcome/.test(cmd) ? 'welcome' : 'leave';
  const label = kind === 'welcome' ? 'welcome' : 'goodbye';
  const sub = String(args[0] || '').toLowerCase();
  const pool = settings?.thumbnailUrl?.url;
  const imgCount = Array.isArray(pool) ? pool.filter(Boolean).length : 0;

  // status: terlihat oleh semua orang
  if (!isSet && !sub) {
    return { text: `👋 *SAMBUTAN GRUP*\nWelcome (anggota baru): ${g.welcome ? 'aktif ✅' : 'nonaktif ❌'}${g.text.setwelcome ? ' (teks kustom)' : ''}\nGoodbye (anggota keluar): ${g.leave ? 'aktif ✅' : 'nonaktif ❌'}${g.text.setleave ? ' (teks kustom)' : ''}\nGambar acak: ${imgCount ? imgCount + ' gambar' : 'tidak ada (settings.thumbnailUrl kosong)'}\n\n*Perintah (admin grup/owner)*\n${prefix}welcome on / off / test\n${prefix}goodbye on / off / test\n${prefix}setwelcome <teks> / reset\n${prefix}setgoodbye <teks> / reset\n\nPlaceholder: @user @group @jumlah` };
  }

  if (!isCreator) {
    const adm = await senderIsAdmin(hc, from, m);
    if (adm !== true) return { text: adm === false ? 'Perintah ini khusus admin grup atau owner.' : 'Gagal membaca data grup, coba lagi sebentar.' };
  }

  if (isSet) {
    const text = args.join(' ').trim();
    const key = kind === 'welcome' ? 'setwelcome' : 'setleave';
    if (!text) return { text: `Pakai: ${prefix}set${label} <teks>\nContoh: ${prefix}set${label} ${kind === 'welcome' ? 'Halo @user, selamat datang di @group!' : '@user keluar dari @group.'}\nPlaceholder: @user @group @jumlah\nHapus teks kustom: ${prefix}set${label} reset` };
    if (['reset', 'default', 'hapus'].includes(text.toLowerCase())) {
      delete g.text[key];
      return { text: `Teks ${label} dikembalikan ke bawaan.` };
    }
    if (text.length > CFG.maxTextLength) return { text: `Teks terlalu panjang (maksimal ${CFG.maxTextLength} karakter).` };
    g.text[key] = text;
    return { text: `✅ Teks ${label} disimpan.\nLihat hasilnya dengan ${prefix}${label} test` };
  }

  if (sub === 'on' || sub === 'off') {
    g[kind] = sub === 'on';
    return { text: g[kind]
      ? `✅ ${kind === 'welcome' ? 'Sambutan anggota baru' : 'Pesan anggota keluar'} *diaktifkan*.${imgCount ? '' : '\n(settings.thumbnailUrl kosong, pesan dikirim tanpa gambar)'}`
      : `❌ ${kind === 'welcome' ? 'Sambutan anggota baru' : 'Pesan anggota keluar'} *dimatikan*.` };
  }

  if (sub === 'test') {
    const me = m.key.participant;
    const snap = await groupSnapshot(hc, from);
    const tpl = kind === 'welcome' ? (g.text.setwelcome || DEFAULT_WELCOME) : (g.text.setleave || DEFAULT_LEAVE);
    const text = render(tpl, { jids: [me], subject: snap?.subject || 'grup ini', count: snap?.size ?? '-' });
    await sendGreeting(hc, from, text, [me], settings, { rand, fetchImage });
    return {};
  }

  return { text: `Pakai: ${prefix}${label} on / off / test` };
}
