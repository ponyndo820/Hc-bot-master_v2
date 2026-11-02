/*
   * fisht.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/

const TZ_DEFAULT = 'Asia/Jakarta';

// ============================== DATA ==============================

export const CFG = {
  energyMax: 10,                 // energi maksimum awal
  energyRegenMs: 5 * 60 * 1000,  // 1 energi pulih tiap 5 menit
  baseCapMs: 5 * 60 * 1000,      // lama maksimum satu sesi memancing
  bagMax: 150,                   // kapasitas tas ikan
  startCoins: 300,
  gachaCost: 3000,               // naik 10% per level pemain
  mutBase: 0.08,                 // peluang mutasi dasar
  prestigeLevel: 30,
  rodMaxLevel: 10,
  upgradeMax: 10,
  boostMs: 30 * 60 * 1000,
};

const need = (lvl) => Math.floor(60 * Math.pow(lvl, 1.6)); // XP untuk naik dari lvl ke lvl+1

const RARITY = [
  { id: 'common',    name: 'Common',    e: '⚪', w: 650, xp: 4 },
  { id: 'uncommon',  name: 'Uncommon',  e: '🟢', w: 250, xp: 8 },
  { id: 'rare',      name: 'Rare',      e: '🔵', w: 75,  xp: 20 },
  { id: 'epic',      name: 'Epic',      e: '🟣', w: 20,  xp: 50 },
  { id: 'legendary', name: 'Legendary', e: '🟡', w: 4,   xp: 150 },
  { id: 'mythic',    name: 'Mythic',    e: '🔴', w: 0.5, xp: 500 },
];

// index 0 = tanpa mutasi. w = bobot kemunculan antar mutasi.
const MUTS = [
  { id: 'none',    name: 'Normal',  e: '',   mult: 1,   w: 0 },
  { id: 'albino',  name: 'Albino',  e: '🤍', mult: 1.5, w: 50 },
  { id: 'shiny',   name: 'Shiny',   e: '✨', mult: 2,   w: 30 },
  { id: 'golden',  name: 'Golden',  e: '🥇', mult: 3,   w: 14 },
  { id: 'crystal', name: 'Crystal', e: '💎', mult: 5,   w: 5 },
  { id: 'void',    name: 'Void',    e: '🌌', mult: 10,  w: 1 },
];

// fish: [nama, indeks rarity, harga dasar, kg min, kg max]
const ISLANDS = {
  kolam: {
    name: 'Kolam Tenang', e: '🏞️', minLevel: 1, xp: 1,
    fish: [
      ['Lele Mungil', 0, 10, 0.2, 0.8], ['Nila Manis', 0, 12, 0.3, 1.2], ['Mas Koki', 0, 15, 0.1, 0.6],
      ['Gurame Tenang', 1, 40, 0.8, 3], ['Belut Licin', 1, 50, 0.5, 2],
      ['Ikan Pelangi', 2, 150, 0.5, 2.5], ['Koi Emas', 3, 600, 2, 9],
      ['Naga Kolam', 4, 3500, 8, 40], ['Roh Teratai', 5, 18000, 20, 120],
    ],
  },
  hutan: {
    name: 'Danau Hutan', e: '🌲', minLevel: 5, xp: 1.5,
    fish: [
      ['Bawal Lumut', 0, 30, 0.3, 1.5], ['Patin Rimba', 0, 36, 0.5, 2.5], ['Udang Sungai', 0, 40, 0.05, 0.3],
      ['Arwana Hijau', 1, 110, 1, 6], ['Sidat Hutan', 1, 130, 0.8, 4],
      ['Ikan Kunang', 2, 400, 0.5, 3], ['Raja Gabus', 3, 1600, 3, 15],
      ['Penjaga Pohon', 4, 9000, 10, 60], ['Roh Hutan Purba', 5, 45000, 30, 200],
    ],
  },
  karang: {
    name: 'Teluk Karang', e: '🪸', minLevel: 10, xp: 2,
    fish: [
      ['Kerapu Mini', 0, 80, 0.5, 3], ['Kakap Merah', 0, 95, 0.8, 4], ['Badut Karang', 0, 110, 0.1, 0.5],
      ['Pari Pasir', 1, 260, 2, 12], ['Kuda Laut', 1, 300, 0.05, 0.3],
      ['Hiu Karang', 2, 900, 10, 80], ['Penyu Mutiara', 3, 3500, 20, 150],
      ['Gurita Mahkota', 4, 20000, 15, 90], ['Leviathan Karang', 5, 100000, 200, 1500],
    ],
  },
  salju: {
    name: 'Fjord Beku', e: '🧊', minLevel: 18, xp: 3,
    fish: [
      ['Teri Es', 0, 200, 0.05, 0.4], ['Cod Beku', 0, 230, 1, 8], ['Haring Salju', 0, 260, 0.3, 1.5],
      ['Salmon Kristal', 1, 600, 2, 10], ['Pike Utara', 1, 700, 3, 15],
      ['Narwhal Mini', 2, 2100, 40, 200], ['Hiu Glasial', 3, 8000, 100, 600],
      ['Paus Aurora', 4, 45000, 500, 4000], ['Naga Es Kuno', 5, 220000, 800, 6000],
    ],
  },
  vulkan: {
    name: 'Palung Vulkanik', e: '🌋', minLevel: 25, xp: 4.5,
    fish: [
      ['Ikan Bara', 0, 450, 0.2, 1.5], ['Belut Magma', 0, 520, 1, 6], ['Tetra Lava', 0, 600, 0.05, 0.3],
      ['Pari Obsidian', 1, 1400, 5, 40], ['Hiu Abu', 1, 1600, 20, 150],
      ['Pedang Api', 2, 5000, 30, 200], ['Kepiting Magma', 3, 18000, 5, 40],
      ['Feniks Laut', 4, 100000, 20, 100], ['Raja Palung', 5, 500000, 500, 5000],
    ],
  },
};

// price = harga beli, lvl = level pemain minimal, luck = bonus luck, iv = detik per ikan
const RODS = {
  bambu:   { name: 'Joran Bambu',   price: 0,       lvl: 1,  luck: 0,    iv: 20 },
  fiber:   { name: 'Joran Fiber',   price: 1500,    lvl: 3,  luck: 0.10, iv: 17 },
  baja:    { name: 'Joran Baja',    price: 10000,   lvl: 8,  luck: 0.25, iv: 14 },
  karbon:  { name: 'Joran Karbon',  price: 60000,   lvl: 15, luck: 0.50, iv: 11 },
  mithril: { name: 'Joran Mithril', price: 350000,  lvl: 22, luck: 0.90, iv: 8.5 },
  langit:  { name: 'Joran Langit',  price: 2000000, lvl: 28, luck: 1.50, iv: 6.5 },
};

const ENCHANTS = {
  lucky:     { name: 'Lucky',     desc: 'Luck +25%',                     cost: 8000,  luck: 0.25 },
  swift:     { name: 'Swift',     desc: 'Tangkapan 20% lebih cepat',     cost: 12000, speed: 0.20 },
  greedy:    { name: 'Greedy',    desc: 'Harga jual +20%',               cost: 15000, value: 0.20 },
  mutant:    { name: 'Mutant',    desc: 'Peluang mutasi +6%',            cost: 20000, mut: 0.06 },
  bountiful: { name: 'Bountiful', desc: '15% peluang ikan ganda',        cost: 25000, extra: 0.15 },
  vast:      { name: 'Vast',      desc: 'Sesi memancing 50% lebih lama', cost: 30000, cap: 0.5 },
};

// Upgrade permanen memakai token prestige
const UPGRADES = {
  luck:     { name: 'Luck',     desc: '+5% luck per level' },
  energy:   { name: 'Energi',   desc: '+2 energi maksimum per level' },
  speed:    { name: 'Kecepatan', desc: '3% lebih cepat per level' },
  value:    { name: 'Nilai',    desc: '+8% harga jual per level' },
  mutation: { name: 'Mutasi',   desc: '+1.5% peluang mutasi per level' },
};

const TOKEN_SHOP = {
  ticket: { name: 'Tiket Gacha',        cost: 2, desc: '1 tiket gacha' },
  energy: { name: 'Isi Energi Penuh',   cost: 1, desc: 'Energi langsung penuh' },
  boost:  { name: 'Luck Boost 30 Menit', cost: 2, desc: 'Luck +50% selama 30 menit' },
  coins:  { name: 'Paket Koin',          cost: 1, desc: '10.000 koin (x level prestige)' },
};

// prizes: [bobot, jenis, nilai]
const JACKPOTS = {
  bronze: { name: 'Bronze', e: '🥉', cost: 2000, prizes: [
    [35, 'zonk'], [25, 'coins', 0.5], [20, 'coins', 1.5], [8, 'coins', 3], [7, 'energy', 5], [4, 'limit', 2], [1, 'limit', 5]] },
  silver: { name: 'Silver', e: '🥈', cost: 10000, prizes: [
    [30, 'zonk'], [25, 'coins', 0.5], [20, 'coins', 1.5], [10, 'coins', 3], [6, 'energy', 10], [5, 'limit', 5], [3, 'limit', 10], [1, 'premium', 6]] },
  gold: { name: 'Gold', e: '🥇', cost: 50000, prizes: [
    [25, 'zonk'], [25, 'coins', 0.5], [22, 'coins', 1.5], [12, 'coins', 3], [2, 'coins', 6], [5, 'energy', 99],
    [4, 'limit', 10], [3, 'limit', 20], [1.5, 'premium', 24], [0.5, 'unlimited']] },
  diamond: { name: 'Diamond', e: '💎', cost: 250000, prizes: [
    [25, 'zonk'], [22, 'coins', 0.5], [22, 'coins', 1.5], [12, 'coins', 3], [2, 'coins', 8], [6, 'limit', 20],
    [4, 'limit', 50], [3, 'premium', 72], [1, 'premium', 168], [2, 'unlimited']] },
};

const GACHA_PRIZES = [
  [30, 'coins', 600], [25, 'coins', 1200], [15, 'coins', 2500], [6, 'coins', 6000], [1.5, 'coins', 20000],
  [10, 'energy', 5], [4, 'energy', 99], [4, 'ticket', 1], [1.5, 'rod'], [1, 'token', 1],
];

// ============================== UTIL ==============================

const FISH = {}; // id -> { name, ri, price, isl }
for (const [key, isl] of Object.entries(ISLANDS)) {
  isl.key = key;
  isl.fish.forEach((x, i) => { FISH[key + i] = { name: x[0], ri: x[1], price: x[2], isl: key }; });
}

const fmt = (n) => String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const fmtKg = (kg) => (kg >= 100 ? kg.toFixed(0) : kg.toFixed(2)) + ' kg';
const pct = (x) => (x * 100).toFixed(0) + '%';
const bar = (v, max, n = 10) => {
  const k = Math.max(0, Math.min(n, Math.round((v / Math.max(1, max)) * n)));
  return '▰'.repeat(k) + '▱'.repeat(n - k);
};
const dur = (ms) => {
  let s = Math.max(1, Math.ceil(ms / 1000));
  if (s < 60) return `${s} dtk`;
  const m = Math.floor(s / 60); s %= 60;
  if (m < 60) return `${m} mnt${s ? ' ' + s + ' dtk' : ''}`;
  const h = Math.floor(m / 60);
  return `${h} jam ${m % 60} mnt`;
};
const dayKey = (now, tz) => new Date(now).toLocaleDateString('en-CA', { timeZone: tz });
const msToMidnight = (now, tz) => {
  const [h, m, s] = new Date(now).toLocaleTimeString('en-GB', { timeZone: tz, hour12: false }).split(':').map(Number);
  return (24 * 3600 - (h % 24) * 3600 - m * 60 - s) * 1000;
};

function pickW(weights, rand) {
  let t = 0;
  for (const w of weights) t += w;
  let r = rand() * t;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i; }
  return weights.length - 1;
}

function findKey(obj, q) {
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  q = norm(q);
  if (!q) return null;
  const keys = Object.keys(obj);
  if (/^\d+$/.test(q) && keys[Number(q) - 1]) return keys[Number(q) - 1];
  return keys.find((k) => k === q)
    || keys.find((k) => norm(obj[k].name) === q)
    || keys.find((k) => k.startsWith(q) || norm(obj[k].name).includes(q))
    || null;
}

function fill(target, defaults) {
  for (const k of Object.keys(defaults)) {
    const d = defaults[k];
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      if (!target[k] || typeof target[k] !== 'object') target[k] = {};
      fill(target[k], d);
    } else if (target[k] === undefined || target[k] === null || (typeof d === 'number' && !Number.isFinite(target[k]))) {
      target[k] = Array.isArray(d) ? [...d] : d;
    }
  }
}

function getState(db, sender, name, now) {
  db.users = db.users || {};
  if (!db.users[sender] || typeof db.users[sender] !== 'object') db.users[sender] = {};
  const u = db.users[sender];
  if (!u.fisht || typeof u.fisht !== 'object') u.fisht = {};
  const f = u.fisht;
  fill(f, {
    name: '', coins: CFG.startCoins, energy: CFG.energyMax, energyAt: now, xp: 0, level: 1,
    island: 'kolam', rod: 'bambu', rods: { bambu: { level: 0, enchant: '' } },
    tickets: 0, tokens: 0, boostUntil: 0, up: {}, prestige: { count: 0 }, daily: { last: '', streak: 0 },
    book: {}, mutBook: {},
    stats: { casts: 0, caught: 0, sold: 0, earned: 0, jackpots: 0, gachas: 0, mutated: 0 },
  });
  if (!Array.isArray(f.bag)) f.bag = [];
  if (!Array.isArray(f.stats.byRarity)) f.stats.byRarity = [0, 0, 0, 0, 0, 0];
  if (!ISLANDS[f.island]) f.island = 'kolam';
  if (!RODS[f.rod] || !f.rods[f.rod]) { f.rod = 'bambu'; f.rods.bambu = f.rods.bambu || { level: 0, enchant: '' }; }
  if (name) f.name = String(name).slice(0, 24);
  return { u, f };
}

const emax = (f) => CFG.energyMax + 2 * (f.up.energy || 0);

function tickEnergy(f, now) {
  const max = emax(f);
  if (f.energy >= max) { f.energyAt = now; return; }
  const gain = Math.floor((now - f.energyAt) / CFG.energyRegenMs);
  if (gain > 0) {
    f.energy = Math.min(max, f.energy + gain);
    f.energyAt = f.energy >= max ? now : f.energyAt + gain * CFG.energyRegenMs;
  }
}

function calc(f, now) {
  const rod = RODS[f.rod];
  const rs = f.rods[f.rod];
  const en = rs.enchant ? ENCHANTS[rs.enchant] || {} : {};
  const up = f.up;
  let luck = rod.luck + 0.04 * rs.level + 0.05 * (up.luck || 0) + (en.luck || 0);
  if (f.boostUntil > now) luck += 0.5;
  const iv = Math.max(3, rod.iv * (1 - 0.02 * rs.level) * (1 - 0.03 * (up.speed || 0)) * (1 - (en.speed || 0)));
  return {
    rod, rs, en, luck, iv,
    cap: CFG.baseCapMs * (1 + (en.cap || 0)),
    mut: Math.min(0.4, CFG.mutBase + 0.015 * (up.mutation || 0) + (en.mut || 0)),
    extra: en.extra || 0,
    sellMult: (1 + 0.08 * (up.value || 0) + (en.value || 0)) * (1 + 0.1 * f.prestige.count),
  };
}

function gainXp(f, xp) {
  f.xp += xp;
  let ups = 0, bonus = 0;
  while (f.xp >= need(f.level)) {
    f.xp -= need(f.level);
    f.level++; ups++; bonus += f.level * 100;
  }
  f.coins += bonus;
  return { ups, bonus };
}

// v >= 99 berarti "isi penuh"; selain itu menambah, boleh melewati maksimum sampai 2x
const addEnergy = (f, v) => { f.energy = v >= 99 ? Math.max(f.energy, emax(f)) : Math.min(emax(f) * 2, f.energy + v); };
const spend = (f, n) => { f.coins -= n; };
const earn = (f, n) => { f.coins += n; f.stats.earned += n; };

// ============================== PERINTAH ==============================

function help(p) {
  return `*FISHIT GAME*
_Sistem permainan memancing terlengkap_

*FISHING*
\`${p} mancing\` _Mulai memancing_
\`${p} view\` _Ambil tangkapan_
\`${p} sell\` _Jual ikan_
\`${p} fishbook\` _Koleksi ikan_
\`${p} mutbook\` _Koleksi mutasi_
\`${p} top\` _Leaderboard_

*PROFILE*
\`${p} me\` _Profil kamu_
\`${p} stats\` _Stats detail_
\`${p} daily\` _Daily reward_

*PULAU & ROD*
\`${p} travel\` _Daftar pulau_
\`${p} travel <pulau>\` _Pindah pulau_
\`${p} shop\` _Toko rod_
\`${p} buy <rod>\` _Beli rod_
\`${p} equip <rod>\` _Pasang rod_
\`${p} rods\` _Koleksi rod_
\`${p} enchant <key>\` _Enchant rod_
\`${p} enchants\` _Daftar enchant_
\`${p} rodup\` _Upgrade rod_

*PRESTIGE*
\`${p} prestige\` _Info prestige_
\`${p} tokens\` _Token store_
\`${p} upgrade\` _Upgrade stats_
\`${p} gacha\` _Gacha_
\`${p} gacha ticket\` _Gacha pakai tiket_

*JACKPOT*
\`${p} jackpot\` _Daftar jackpot_
\`${p} jackpot <tier>\` _Main jackpot_
_Jackpot bisa kasih Premium, Energi, Limit, bahkan UNLIMITED!_`;
}

function cmdMancing(f, now, p) {
  if (f.session) {
    const s = f.session;
    const ivMs = s.iv * 1000;
    const ready = Math.floor(Math.min(now - s.t, s.cap) / ivMs);
    const max = Math.floor(s.cap / ivMs);
    const left = s.cap - (now - s.t);
    return `🎣 Kamu masih memancing di *${ISLANDS[s.isl].name}*.\nTangkapan siap: *${ready}/${max}* ikan\n${left > 0 ? 'Sesi penuh dalam ' + dur(left) : 'Sesi sudah penuh!'}\nAmbil dengan *${p} view*`;
  }
  if (f.energy < 1) {
    const next = f.energyAt + CFG.energyRegenMs - now;
    return `🔋 Energi habis. 1 energi pulih dalam ${dur(next)}.\nAmbil *${p} daily* untuk isi energi penuh.`;
  }
  const st = calc(f, now);
  f.energy -= 1;
  f.stats.casts++;
  f.session = { t: now, iv: st.iv, cap: st.cap, luck: st.luck, mut: st.mut, extra: st.extra, isl: f.island };
  const isl = ISLANDS[f.island];
  const max = Math.floor(st.cap / (st.iv * 1000));
  return `🎣 *Memancing di ${isl.name}* ${isl.e}\nRod: ${st.rod.name} | Luck: ${pct(st.luck)}\n1 ikan tiap ~${st.iv.toFixed(1)} dtk, maksimal ${max} ikan.\nAmbil tangkapan dengan *${p} view*`;
}

function pickRarity(luck, rand) {
  return pickW(RARITY.map((r, i) => r.w * Math.pow(1 + luck, 0.5 * i)), rand);
}

function catchOne(s, isl, rand) {
  const ri = pickRarity(s.luck, rand);
  let pool = isl.fish.map((x, i) => ({ x, i })).filter((o) => o.x[1] === ri);
  if (!pool.length) pool = isl.fish.map((x, i) => ({ x, i }));
  const o = pool[Math.floor(rand() * pool.length)];
  const [name, , price, mn, mx] = o.x;
  const kg = mn + (mx - mn) * Math.pow(rand(), 1.3);
  const wf = (kg - mn) / Math.max(0.0001, mx - mn);
  const mi = rand() < s.mut ? 1 + pickW(MUTS.slice(1).map((m) => m.w), rand) : 0;
  return {
    id: isl.key + o.i, name, ri, mi,
    kg: Math.round(kg * 100) / 100,
    value: Math.round(price * (0.7 + 0.6 * wf) * MUTS[mi].mult),
    xp: RARITY[ri].xp * isl.xp * (mi ? 1.5 : 1),
  };
}

function cmdView(f, now, rand, p) {
  const s = f.session;
  if (!s) return `Kamu belum memancing. Mulai dengan *${p} mancing*.`;
  const ivMs = s.iv * 1000;
  const elapsed = Math.min(now - s.t, s.cap);
  const n = Math.floor(elapsed / ivMs);
  if (n < 1) return `⏳ Belum ada tangkapan. Tunggu ${dur(ivMs - elapsed)} lagi.`;
  let total = n;
  for (let i = 0; i < n; i++) if (rand() < s.extra) total++;
  if (f.bag.length + total > CFG.bagMax) {
    return `🎒 Tas penuh (${f.bag.length}/${CFG.bagMax}). Jual ikan dulu dengan *${p} sell*, lalu ambil tangkapan lagi.`;
  }
  const isl = ISLANDS[s.isl];
  const got = [];
  let xp = 0, value = 0;
  const fresh = [];
  for (let i = 0; i < total; i++) {
    const c = catchOne(s, isl, rand);
    got.push(c);
    xp += c.xp; value += c.value;
    f.bag.push([c.id, c.kg, c.mi, c.value]);
    if (!f.book[c.id]) { f.book[c.id] = { n: 0, best: 0 }; fresh.push(c.name); }
    f.book[c.id].n++;
    f.book[c.id].best = Math.max(f.book[c.id].best, c.kg);
    if (c.mi) { f.mutBook[MUTS[c.mi].id] = (f.mutBook[MUTS[c.mi].id] || 0) + 1; f.stats.mutated++; }
    f.stats.byRarity[c.ri]++;
    if (!f.stats.biggest || c.kg > f.stats.biggest.kg) f.stats.biggest = { name: c.name, kg: c.kg };
  }
  f.stats.caught += total;
  f.session = null;
  const lv = gainXp(f, Math.round(xp));

  const counts = RARITY.map((r, i) => ({ r, n: got.filter((c) => c.ri === i).length })).filter((x) => x.n);
  const notable = got.filter((c) => c.ri >= 2 || c.mi).sort((a, b) => b.value - a.value).slice(0, 6);
  let t = `🎣 *TANGKAPAN DIAMBIL!* (${total} ikan)\n`;
  t += counts.map((x) => `${x.r.e}${x.n}`).join(' ') + '\n';
  if (notable.length) {
    t += '\n' + notable.map((c) => `${RARITY[c.ri].e} ${c.mi ? MUTS[c.mi].e + ' ' + MUTS[c.mi].name + ' ' : ''}${c.name} (${fmtKg(c.kg)}) ~${fmt(c.value)}`).join('\n') + '\n';
  }
  if (fresh.length) t += `\n🆕 Ikan baru: ${fresh.join(', ')}\n`;
  t += `\n💰 Nilai: ~${fmt(value)} koin (jual dengan *${p} sell*)\n✨ XP +${fmt(xp)} | Lv ${f.level} ${bar(f.xp, need(f.level))}`;
  if (lv.ups) t += `\n⬆️ *NAIK LEVEL ${f.level}!* Bonus +${fmt(lv.bonus)} koin`;
  t += `\n🎒 Tas: ${f.bag.length}/${CFG.bagMax}`;
  return t;
}

function cmdSell(f, now, arg, p) {
  if (!f.bag.length) return `🎒 Tasmu kosong. Pancing dulu dengan *${p} mancing*.`;
  const a = String(arg || '').toLowerCase();
  const ri = RARITY.findIndex((r) => r.id === a);
  const match = (it) => {
    if (!a || a === 'all' || a === 'semua') return true;
    if (a === 'normal') return it[2] === 0;
    if (ri >= 0) return (FISH[it[0]] ? FISH[it[0]].ri : 0) === ri;
    return false;
  };
  if (a && a !== 'all' && a !== 'semua' && a !== 'normal' && ri < 0) {
    return `Filter tidak dikenal.\nPakai: *${p} sell* (semua), *${p} sell normal* (tanpa mutasi), atau *${p} sell <rarity>* (${RARITY.map((r) => r.id).join('/')}).`;
  }
  const sold = f.bag.filter(match);
  if (!sold.length) return 'Tidak ada ikan yang cocok dengan filter itu.';
  f.bag = f.bag.filter((it) => !match(it));
  const base = sold.reduce((s, it) => s + (it[3] || 0), 0);
  const st = calc(f, now);
  const gain = Math.round(base * st.sellMult);
  earn(f, gain);
  f.stats.sold += sold.length;
  return `💰 *IKAN TERJUAL*\n${sold.length} ikan → +${fmt(gain)} koin${st.sellMult > 1 ? ` (bonus x${st.sellMult.toFixed(2)})` : ''}\n🪙 Saldo: ${fmt(f.coins)} koin\n🎒 Tas: ${f.bag.length}/${CFG.bagMax}`;
}

function cmdMe(f, now, p, jid) {
  const st = calc(f, now);
  const isl = ISLANDS[f.island];
  let t = `🎣 *PROFIL FISHIT*\n👤 ${f.name || '@' + jid.split('@')[0]}\n`;
  t += `⭐ Level ${f.level} ${bar(f.xp, need(f.level))} ${fmt(f.xp)}/${fmt(need(f.level))}\n`;
  t += `🪙 Koin: ${fmt(f.coins)}\n⚡ Energi: ${f.energy}/${emax(f)}`;
  if (f.energy < emax(f)) t += ` (+1 dalam ${dur(f.energyAt + CFG.energyRegenMs - now)})`;
  t += `\n${isl.e} Pulau: ${isl.name}\n🎣 Rod: ${st.rod.name} Lv ${st.rs.level}${st.rs.enchant ? ' [' + ENCHANTS[st.rs.enchant].name + ']' : ''}\n`;
  t += `🍀 Luck: ${pct(st.luck)}${f.boostUntil > now ? ' (boost aktif)' : ''}\n`;
  t += `🎟️ Tiket: ${f.tickets} | 🔷 Token: ${f.tokens} | 🏆 Prestige: ${f.prestige.count}\n🎒 Tas: ${f.bag.length}/${CFG.bagMax}\n`;
  if (f.session) {
    const ivMs = f.session.iv * 1000;
    t += `\n🌊 Sedang memancing, siap: ${Math.floor(Math.min(now - f.session.t, f.session.cap) / ivMs)} ikan`;
  } else t += `\n💤 Tidak sedang memancing`;
  return t;
}

function cmdStats(f, now) {
  const s = f.stats;
  const st = calc(f, now);
  let t = `📊 *STATS FISHIT*\n\n`;
  t += `Sesi memancing: ${fmt(s.casts)}\nIkan ditangkap: ${fmt(s.caught)}\nIkan terjual: ${fmt(s.sold)}\nIkan bermutasi: ${fmt(s.mutated)}\n`;
  t += `Total pendapatan: ${fmt(s.earned)} koin\n`;
  t += `Ikan terbesar: ${s.biggest ? `${s.biggest.name} (${fmtKg(s.biggest.kg)})` : '-'}\n`;
  t += `Jackpot dimainkan: ${fmt(s.jackpots)} | Gacha: ${fmt(s.gachas)}\n`;
  t += `Streak daily: ${f.daily.streak} hari\n\n*Per rarity*\n`;
  t += RARITY.map((r, i) => `${r.e} ${r.name}: ${fmt(s.byRarity[i])}`).join('\n');
  t += `\n\n*Efek aktif*\nLuck ${pct(st.luck)} | Mutasi ${pct(st.mut)}\nKecepatan 1 ikan/${st.iv.toFixed(1)} dtk | Bonus jual x${st.sellMult.toFixed(2)}\nEnergi maks ${emax(f)}`;
  return t;
}

function cmdDaily(f, now, tz, p) {
  const today = dayKey(now, tz);
  if (f.daily.last === today) return `🎁 Daily sudah diambil hari ini.\nBisa diambil lagi dalam ${dur(msToMidnight(now, tz))} (00.00).`;
  f.daily.streak = f.daily.last === dayKey(now - 24 * 3600 * 1000, tz) ? f.daily.streak + 1 : 1;
  f.daily.last = today;
  const coins = Math.round((500 + Math.min(f.daily.streak, 7) * 150 + f.level * 25) * (1 + 0.5 * f.prestige.count));
  earn(f, coins);
  f.energy = Math.max(f.energy, emax(f));
  let t = `🎁 *DAILY REWARD*\n🔥 Streak: ${f.daily.streak} hari\n🪙 +${fmt(coins)} koin\n⚡ Energi terisi penuh`;
  if (f.daily.streak % 7 === 0) { f.tickets++; t += `\n🎟️ +1 Tiket Gacha (bonus streak 7 hari!)`; }
  else t += `\n_Streak kelipatan 7 hari dapat tiket gacha._`;
  return t;
}

function findIsland(q) { return findKey(ISLANDS, q); }

function cmdTravel(f, rest, p) {
  const q = rest.join(' ');
  if (!q) {
    let t = `🗺️ *DAFTAR PULAU*\n\n`;
    Object.entries(ISLANDS).forEach(([k, isl], i) => {
      const found = isl.fish.filter((_, idx) => f.book[k + idx]).length;
      const status = k === f.island ? '📍' : f.level >= isl.minLevel ? '✅' : '🔒';
      t += `${status} ${i + 1}. ${isl.e} *${isl.name}*\n    Lv ${isl.minLevel}+ | XP x${isl.xp} | Ikan ${found}/${isl.fish.length}\n`;
    });
    return t + `\nPindah: *${p} travel <nama/nomor>*`;
  }
  const k = findIsland(q);
  if (!k) return `Pulau "${q}" tidak ditemukan. Lihat daftar dengan *${p} travel*.`;
  const isl = ISLANDS[k];
  if (f.level < isl.minLevel) return `🔒 ${isl.name} butuh Level ${isl.minLevel}. Levelmu ${f.level}.`;
  if (f.island === k) return `Kamu sudah berada di ${isl.name}.`;
  f.island = k;
  return `${isl.e} Kamu pindah ke *${isl.name}*.\nXP x${isl.xp}. Mulai memancing dengan *${p} mancing*.`;
}

function cmdShop(f, p) {
  let t = `🛒 *TOKO ROD*\n🪙 Koin: ${fmt(f.coins)}\n\n`;
  Object.entries(RODS).forEach(([k, r], i) => {
    const own = f.rods[k] ? '✅' : f.level >= r.lvl ? '🛍️' : '🔒';
    t += `${own} ${i + 1}. *${r.name}* (${k})\n    ${r.price ? fmt(r.price) + ' koin' : 'Gratis'} | Lv ${r.lvl}+ | Luck ${pct(r.luck)} | ${r.iv} dtk/ikan\n`;
  });
  return t + `\nBeli: *${p} buy <rod>*`;
}

function cmdBuy(f, rest, p) {
  const q = rest.join(' ');
  if (!q) return `Pilih rod yang mau dibeli.\nContoh: *${p} buy baja*\nLihat daftar: *${p} shop*`;
  const k = findKey(RODS, q);
  if (!k) return `Rod "${q}" tidak ditemukan. Lihat *${p} shop*.`;
  const r = RODS[k];
  if (f.rods[k]) return `Kamu sudah punya ${r.name}.`;
  if (f.level < r.lvl) return `🔒 ${r.name} butuh Level ${r.lvl}. Levelmu ${f.level}.`;
  if (f.coins < r.price) return `🪙 Koin kurang. ${r.name} harganya ${fmt(r.price)}, kamu punya ${fmt(f.coins)}.`;
  spend(f, r.price);
  f.rods[k] = { level: 0, enchant: '' };
  return `✅ Berhasil membeli *${r.name}*!\nPasang dengan *${p} equip ${k}*.\n🪙 Sisa koin: ${fmt(f.coins)}`;
}

function cmdEquip(f, rest, p) {
  const q = rest.join(' ');
  if (!q) return `Pilih rod yang mau dipasang.\nContoh: *${p} equip baja*\nKoleksimu: *${p} rods*`;
  const owned = Object.fromEntries(Object.keys(f.rods).filter((k) => RODS[k]).map((k) => [k, RODS[k]]));
  const k = findKey(owned, q);
  if (!k) return `Kamu belum punya rod "${q}". Lihat *${p} rods*.`;
  f.rod = k;
  return `🎣 *${RODS[k].name}* terpasang.${f.session ? '\n_Sesi yang sedang berjalan tetap memakai rod lama._' : ''}`;
}

function cmdRods(f, p) {
  let t = `🎣 *KOLEKSI ROD*\n\n`;
  for (const [k, rs] of Object.entries(f.rods)) {
    const r = RODS[k];
    if (!r) continue;
    t += `${k === f.rod ? '✅' : '▫️'} *${r.name}* Lv ${rs.level}/${CFG.rodMaxLevel}\n    Luck ${pct(r.luck + 0.04 * rs.level)} | ${rs.enchant ? 'Enchant: ' + ENCHANTS[rs.enchant].name : 'Tanpa enchant'}\n`;
  }
  return t + `\nPasang: *${p} equip <rod>*`;
}

function cmdEnchants(f, p) {
  const cur = f.rods[f.rod].enchant;
  let t = `✨ *DAFTAR ENCHANT*\nRod aktif: ${RODS[f.rod].name} ${cur ? '[' + ENCHANTS[cur].name + ']' : '(belum ada enchant)'}\n\n`;
  for (const [k, e] of Object.entries(ENCHANTS)) {
    t += `${cur === k ? '✅' : '▫️'} *${k}* - ${e.desc}\n    ${fmt(e.cost)} koin\n`;
  }
  return t + `\nPasang: *${p} enchant <key>* (menimpa enchant lama)`;
}

function cmdEnchant(f, rest, p) {
  const q = rest.join(' ');
  if (!q) return cmdEnchants(f, p);
  const k = findKey(ENCHANTS, q);
  if (!k) return `Enchant "${q}" tidak ada. Lihat *${p} enchants*.`;
  const e = ENCHANTS[k];
  const rs = f.rods[f.rod];
  if (rs.enchant === k) return `${RODS[f.rod].name} sudah memakai enchant ${e.name}.`;
  if (f.coins < e.cost) return `🪙 Koin kurang. Enchant ${e.name} harganya ${fmt(e.cost)}, kamu punya ${fmt(f.coins)}.`;
  spend(f, e.cost);
  const old = rs.enchant ? ENCHANTS[rs.enchant].name : null;
  rs.enchant = k;
  return `✨ *${RODS[f.rod].name}* kini memakai enchant *${e.name}*\n${e.desc}${old ? `\n(menggantikan ${old})` : ''}\n🪙 Sisa koin: ${fmt(f.coins)}`;
}

function cmdRodup(f) {
  const rs = f.rods[f.rod];
  const r = RODS[f.rod];
  if (rs.level >= CFG.rodMaxLevel) return `🎣 ${r.name} sudah level maksimum (${CFG.rodMaxLevel}).`;
  const cost = Math.round(Math.max(r.price, 2000) * 0.2 * Math.pow(rs.level + 1, 1.4));
  if (f.coins < cost) return `🪙 Koin kurang. Upgrade ${r.name} ke Lv ${rs.level + 1} butuh ${fmt(cost)}, kamu punya ${fmt(f.coins)}.`;
  spend(f, cost);
  rs.level++;
  return `⬆️ *${r.name}* naik ke Lv ${rs.level}/${CFG.rodMaxLevel}\nLuck +4% dan 2% lebih cepat per level.\n🪙 Sisa koin: ${fmt(f.coins)}${rs.level < CFG.rodMaxLevel ? `\nUpgrade berikutnya: ${fmt(Math.round(Math.max(r.price, 2000) * 0.2 * Math.pow(rs.level + 1, 1.4)))} koin` : ''}`;
}

function cmdPrestige(f, rest, p) {
  const gain = 3 + Math.max(0, Math.floor((f.level - CFG.prestigeLevel) / 5)) + f.prestige.count;
  if (String(rest[0] || '').toLowerCase() !== 'confirm') {
    return `🏆 *PRESTIGE*\nPrestige sekarang: ${f.prestige.count}\nSyarat: Level ${CFG.prestigeLevel} (kamu Lv ${f.level})\n\n*Hadiah:* ${gain} token, bonus harga jual +10% permanen, dan daily lebih besar.\n*Direset:* level, koin, rod, pulau, tas ikan, dan sesi.\n*Tetap:* token, upgrade, tiket, koleksi, dan stats.\n\n${f.level >= CFG.prestigeLevel ? `Lanjut dengan *${p} prestige confirm*` : 'Kamu belum memenuhi syarat.'}`;
  }
  if (f.level < CFG.prestigeLevel) return `🔒 Butuh Level ${CFG.prestigeLevel} untuk prestige. Levelmu ${f.level}.`;
  f.prestige.count++;
  f.tokens += gain;
  f.level = 1; f.xp = 0; f.coins = CFG.startCoins + 1000 * f.prestige.count;
  f.island = 'kolam'; f.rod = 'bambu'; f.rods = { bambu: { level: 0, enchant: '' } };
  f.bag = []; f.session = null; f.energy = emax(f);
  return `🏆 *PRESTIGE ${f.prestige.count}!*\n+${gain} token (total ${f.tokens})\nBonus harga jual kini +${f.prestige.count * 10}%.\nBelanjakan token di *${p} tokens* dan *${p} upgrade*.`;
}

function cmdTokens(f, rest, now, p) {
  const sub = String(rest[0] || '').toLowerCase();
  if (sub === 'buy' || sub === 'beli') {
    const q = rest.slice(1).join(' ');
    const k = findKey(TOKEN_SHOP, q);
    if (!k) return `Item tidak ditemukan. Contoh: *${p} tokens buy ticket*`;
    const it = TOKEN_SHOP[k];
    if (f.tokens < it.cost) return `🔷 Token kurang. ${it.name} butuh ${it.cost} token, kamu punya ${f.tokens}.`;
    f.tokens -= it.cost;
    let out = '';
    if (k === 'ticket') { f.tickets++; out = `🎟️ Tiket: ${f.tickets}`; }
    if (k === 'energy') { f.energy = Math.max(f.energy, emax(f)); out = '⚡ Energi penuh'; }
    if (k === 'boost') { f.boostUntil = Math.max(f.boostUntil, now) + CFG.boostMs; out = '🍀 Luck +50% aktif 30 menit'; }
    if (k === 'coins') { const c = 10000 * (1 + f.prestige.count); earn(f, c); out = `🪙 +${fmt(c)} koin`; }
    return `✅ Membeli *${it.name}*\n${out}\n🔷 Sisa token: ${f.tokens}`;
  }
  let t = `🔷 *TOKEN STORE*\nToken kamu: ${f.tokens}\n_Token didapat dari prestige._\n\n`;
  for (const [k, it] of Object.entries(TOKEN_SHOP)) t += `▫️ *${k}* - ${it.name}\n    ${it.cost} token | ${it.desc}\n`;
  return t + `\nBeli: *${p} tokens buy <item>*`;
}

function cmdUpgrade(f, rest, p) {
  const q = rest.join(' ');
  const cost = (lv) => lv + 1;
  if (!q) {
    let t = `📈 *UPGRADE STATS*\nToken kamu: ${f.tokens}\n\n`;
    for (const [k, u] of Object.entries(UPGRADES)) {
      const lv = f.up[k] || 0;
      t += `▫️ *${k}* Lv ${lv}/${CFG.upgradeMax} - ${u.desc}\n    ${lv >= CFG.upgradeMax ? 'MAX' : cost(lv) + ' token'}\n`;
    }
    return t + `\nUpgrade: *${p} upgrade <stat>*`;
  }
  const k = findKey(UPGRADES, q);
  if (!k) return `Stat "${q}" tidak ada. Lihat *${p} upgrade*.`;
  const lv = f.up[k] || 0;
  if (lv >= CFG.upgradeMax) return `📈 ${UPGRADES[k].name} sudah level maksimum.`;
  if (f.tokens < cost(lv)) return `🔷 Token kurang. Upgrade ${UPGRADES[k].name} butuh ${cost(lv)} token, kamu punya ${f.tokens}.`;
  f.tokens -= cost(lv);
  f.up[k] = lv + 1;
  return `📈 *${UPGRADES[k].name}* naik ke Lv ${lv + 1}/${CFG.upgradeMax}\n${UPGRADES[k].desc}\n🔷 Sisa token: ${f.tokens}`;
}

function gachaCost(f) { return Math.round(CFG.gachaCost * (1 + 0.1 * f.level)); }

function cmdGacha(f, rest, rand, p) {
  const sub = String(rest[0] || '').toLowerCase();
  const cost = gachaCost(f);
  if (sub === 'info') {
    const tot = GACHA_PRIZES.reduce((s, x) => s + x[0], 0);
    return `🎰 *GACHA*\nBiaya: ${fmt(cost)} koin atau 1 tiket\n\n` + GACHA_PRIZES.map((x) => {
      const nm = { coins: `Koin ${fmt(x[2] * (1 + f.level * 0.1))}`, energy: x[2] >= 99 ? 'Energi penuh' : `Energi +${x[2]}`, ticket: 'Tiket gacha', rod: 'Rod acak', token: 'Token prestige' }[x[1]];
      return `▫️ ${nm} (${((x[0] / tot) * 100).toFixed(1)}%)`;
    }).join('\n');
  }
  const useTicket = sub === 'ticket' || sub === 'tiket';
  if (useTicket) {
    if (f.tickets < 1) return `🎟️ Kamu tidak punya tiket. Dapatkan dari daily streak 7 hari atau token store.`;
    f.tickets--;
  } else {
    if (f.coins < cost) return `🪙 Koin kurang. Gacha butuh ${fmt(cost)} koin, kamu punya ${fmt(f.coins)}.\nAtau pakai tiket: *${p} gacha ticket*`;
    spend(f, cost);
  }
  f.stats.gachas++;
  const pr = GACHA_PRIZES[pickW(GACHA_PRIZES.map((x) => x[0]), rand)];
  let out;
  if (pr[1] === 'coins') { const c = Math.round(pr[2] * (1 + f.level * 0.1)); earn(f, c); out = `🪙 +${fmt(c)} koin`; }
  else if (pr[1] === 'energy') { addEnergy(f, pr[2]); out = pr[2] >= 99 ? '⚡ Energi terisi penuh' : `⚡ Energi +${pr[2]}`; }
  else if (pr[1] === 'ticket') { f.tickets++; out = '🎟️ +1 Tiket gacha (gratis tarik lagi!)'; }
  else if (pr[1] === 'token') { f.tokens++; out = '🔷 +1 Token prestige!'; }
  else {
    const unowned = Object.keys(RODS).filter((k) => !f.rods[k]);
    if (unowned.length) {
      const k = unowned[Math.floor(rand() * unowned.length)];
      f.rods[k] = { level: 0, enchant: '' };
      out = `🎣 *ROD BARU: ${RODS[k].name}!*`;
    } else { const c = 100000; earn(f, c); out = `🪙 +${fmt(c)} koin (semua rod sudah dimiliki)`; }
  }
  return `🎰 *GACHA* ${useTicket ? '(tiket)' : `(-${fmt(cost)} koin)`}\n${out}\n🪙 Koin: ${fmt(f.coins)} | 🎟️ Tiket: ${f.tickets}`;
}

function prizeText(pr, tier) {
  const [, kind, v] = pr;
  if (kind === 'zonk') return 'Zonk';
  if (kind === 'coins') return `${fmt(tier.cost * v)} koin`;
  if (kind === 'energy') return v >= 99 ? 'Energi penuh' : `Energi +${v}`;
  if (kind === 'limit') return `Limit +${v}`;
  if (kind === 'premium') return `Premium ${v >= 24 ? v / 24 + ' hari' : v + ' jam'}`;
  return 'UNLIMITED limit';
}

function cmdJackpot(f, u, rest, now, rand, limits, p) {
  const q = rest.join(' ');
  if (!q) {
    let t = `🎰 *JACKPOT*\n🪙 Koin: ${fmt(f.coins)}\n\n`;
    for (const [k, tier] of Object.entries(JACKPOTS)) {
      const tot = tier.prizes.reduce((s, x) => s + x[0], 0);
      const rare = tier.prizes.filter((x) => ['premium', 'unlimited', 'limit'].includes(x[1])).map((x) => prizeText(x, tier)).join(', ');
      t += `${tier.e} *${k}* - ${fmt(tier.cost)} koin\n    Hadiah: koin, energi, ${rare}\n    Zonk ${((tier.prizes.filter((x) => x[1] === 'zonk').reduce((s, x) => s + x[0], 0) / tot) * 100).toFixed(0)}%\n`;
    }
    return t + `\nMain: *${p} jackpot <tier>*`;
  }
  const k = findKey(JACKPOTS, q);
  if (!k) return `Tier "${q}" tidak ada. Lihat *${p} jackpot*.`;
  const tier = JACKPOTS[k];
  if (f.coins < tier.cost) return `🪙 Koin kurang. Jackpot ${tier.name} butuh ${fmt(tier.cost)}, kamu punya ${fmt(f.coins)}.`;
  spend(f, tier.cost);
  f.stats.jackpots++;
  const pr = tier.prizes[pickW(tier.prizes.map((x) => x[0]), rand)];
  const [, kind, v] = pr;
  let out = '';
  if (kind === 'zonk') out = '💨 Zonk! Belum beruntung.';
  else if (kind === 'coins') { const c = Math.round(tier.cost * v); earn(f, c); out = `🪙 *+${fmt(c)} koin* (x${v})`; }
  else if (kind === 'energy') { addEnergy(f, v); out = v >= 99 ? '⚡ *Energi terisi penuh!*' : `⚡ *Energi +${v}*`; }
  else if (kind === 'limit') { u.limit = (Number.isFinite(u.limit) ? u.limit : limits.free) + v; out = `🎫 *Limit +${v}* (limit kamu: ${fmt(u.limit)})`; }
  else if (kind === 'premium') {
    u.premium = true;
    u.premiumUntil = Math.max(u.premiumUntil || 0, now) + v * 3600 * 1000;
    u.limit = Math.max(Number.isFinite(u.limit) ? u.limit : 0, limits.premium);
    out = `👑 *PREMIUM ${v >= 24 ? v / 24 + ' hari' : v + ' jam'}!*\nLimit harian jadi ${fmt(limits.premium)}.`;
  } else { u.limit = 999999999; out = `♾️ *UNLIMITED LIMIT!*\nBerlaku sampai reset limit harian (00.00).`; }
  return `${tier.e} *JACKPOT ${tier.name.toUpperCase()}* (-${fmt(tier.cost)} koin)\n${out}\n🪙 Koin: ${fmt(f.coins)}`;
}

function cmdTop(db, f, jid) {
  const rows = Object.entries(db.users || {})
    .filter(([, u]) => u && u.fisht && u.fisht.stats)
    .map(([id, u]) => ({ id, name: u.fisht.name, lv: u.fisht.level || 1, pr: u.fisht.prestige?.count || 0, earned: u.fisht.stats.earned || 0 }))
    .sort((a, b) => b.earned - a.earned);
  const label = (r) => r.name || (() => { const n = r.id.split('@')[0]; return n.length > 7 ? n.slice(0, 4) + '****' + n.slice(-3) : n; })();
  const medal = ['🥇', '🥈', '🥉'];
  let t = `🏆 *LEADERBOARD FISHIT*\n_Berdasarkan total pendapatan_\n\n`;
  rows.slice(0, 10).forEach((r, i) => { t += `${medal[i] || (i + 1) + '.'} ${label(r)} - Lv ${r.lv}${r.pr ? ' ⭐' + r.pr : ''}\n    ${fmt(r.earned)} koin\n`; });
  const me = rows.findIndex((r) => r.id === jid);
  if (me >= 10) t += `\nPeringkatmu: #${me + 1} (${fmt(rows[me].earned)} koin)`;
  return t;
}

function cmdFishbook(f, rest, p) {
  const arg = rest.join(' ').toLowerCase();
  const all = arg === 'all' || arg === 'semua';
  const only = all ? null : arg ? findIsland(arg) : f.island;
  if (arg && !all && !only) return `Pulau "${arg}" tidak ditemukan. Lihat *${p} travel*.`;
  let total = 0, got = 0;
  const detail = [];
  const summary = [];
  for (const [k, isl] of Object.entries(ISLANDS)) {
    const found = isl.fish.filter((_, i) => f.book[k + i]).length;
    total += isl.fish.length; got += found;
    summary.push(`${isl.e} ${isl.name}: ${found}/${isl.fish.length}`);
    if (only && only !== k) continue;
    detail.push(`${isl.e} *${isl.name}*\n` + isl.fish.map((x, i) => {
      const b = f.book[k + i];
      return b ? `${RARITY[x[1]].e} ${x[0]} x${b.n} (maks ${fmtKg(b.best)})` : `${RARITY[x[1]].e} ???`;
    }).join('\n'));
  }
  return `📖 *KOLEKSI IKAN* (${got}/${total})\n${summary.join('\n')}\n\n${detail.join('\n\n')}\n\n_Pulau lain: ${p} fishbook <pulau> | semua: ${p} fishbook all_`;
}

function cmdMutbook(f) {
  let t = `🧬 *KOLEKSI MUTASI*\n\n`;
  MUTS.slice(1).forEach((m) => {
    const n = f.mutBook[m.id] || 0;
    t += n ? `${m.e} *${m.name}* (x${m.mult}) - ${n} ikan\n` : `❔ ??? (belum ditemukan)\n`;
  });
  return t + `\nPeluang mutasi dasar ${pct(CFG.mutBase)}. Naikkan dengan enchant Mutant dan upgrade.`;
}

// ============================== ENTRY POINT ==============================

export function fishtCommand({
  args = [], db, sender, name = '', prefix = '.', tz = TZ_DEFAULT,
  limits = { free: 15, premium: 999 }, now = Date.now(), rand = Math.random,
}) {
  const p = `${prefix}fisht`;
  const { u, f } = getState(db, sender, name, now);
  tickEnergy(f, now);
  const sub = String(args[0] || '').toLowerCase();
  const rest = args.slice(1);

  switch (sub) {
    case '': case 'help': case 'menu': return help(p);
    case 'mancing': case 'cast': return cmdMancing(f, now, p);
    case 'view': case 'ambil': return cmdView(f, now, rand, p);
    case 'sell': case 'jual': return cmdSell(f, now, rest[0], p);
    case 'fishbook': case 'book': return cmdFishbook(f, rest, p);
    case 'mutbook': return cmdMutbook(f);
    case 'top': case 'leaderboard': return cmdTop(db, f, sender);
    case 'me': case 'profile': case 'profil': return cmdMe(f, now, p, sender);
    case 'stats': case 'stat': return cmdStats(f, now);
    case 'daily': return cmdDaily(f, now, tz, p);
    case 'travel': case 'pulau': return cmdTravel(f, rest, p);
    case 'shop': case 'toko': return cmdShop(f, p);
    case 'buy': case 'beli': return cmdBuy(f, rest, p);
    case 'equip': case 'pasang': return cmdEquip(f, rest, p);
    case 'rods': case 'rod': return cmdRods(f, p);
    case 'enchants': return cmdEnchants(f, p);
    case 'enchant': return cmdEnchant(f, rest, p);
    case 'rodup': return cmdRodup(f);
    case 'prestige': return cmdPrestige(f, rest, p);
    case 'tokens': case 'token': return cmdTokens(f, rest, now, p);
    case 'upgrade': return cmdUpgrade(f, rest, p);
    case 'gacha': return cmdGacha(f, rest, rand, p);
    case 'jackpot': return cmdJackpot(f, u, rest, now, rand, limits, p);
    default: return `Subcommand "${sub}" tidak dikenal.\nKetik *${p}* untuk melihat daftar perintah.`;
  }
}
