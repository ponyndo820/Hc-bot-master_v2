/*
   * tictactoe-bot.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import TicTacToe from './tictactoe.js';

export const CFG = {
  waitTtlMs: 5 * 60 * 1000,    // room menunggu lawan dibatalkan setelah ini
  playTtlMs: 10 * 60 * 1000,   // game dibatalkan kalau tidak ada langkah selama ini
  maxRewardPerDay: 5,          // maksimal kemenangan berhadiah per orang per hari
  limitChance: 0.4,            // peluang hadiah berupa limit (selebihnya money)
  limitRange: [1, 3],          // jumlah limit acak
  moneyRange: [1000, 10000],   // jumlah money acak
  moneyStep: 500,              // kelipatan money
  tz: 'Asia/Jakarta',
};

const rooms = (global.tictactoe = global.tictactoe || {});

const NUM = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
const userPart = (j) => String(j || '').split('@')[0].split(':')[0];
const tag = (j) => '@' + userPart(j);
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const randInt = (a, b, rand) => a + Math.floor(rand() * (b - a + 1));

function boardText(game) {
  const r = game.render().map((v) => (v === 'X' ? '❌' : v === 'O' ? '⭕' : NUM[v - 1]));
  return [r.slice(0, 3).join(''), r.slice(3, 6).join(''), r.slice(6).join('')].join('\n');
}

const roomOf = (jid) => Object.values(rooms).find((r) => r.x === jid || r.o === jid);

function closeRoom(room) {
  clearTimeout(room.timer);
  if (rooms[room.id] === room) delete rooms[room.id];
}

function arm(room) {
  clearTimeout(room.timer);
  const waiting = room.state === 'WAITING';
  room.timer = setTimeout(() => {
    if (rooms[room.id] !== room) return;
    delete rooms[room.id];
    const who = [room.x, room.o].filter(Boolean);
    Promise.resolve(room.hc.sendMessage(room.chat, {
      text: `⌛ TicTacToe ${waiting ? 'tidak ada yang bergabung' : 'tidak ada aktivitas'}, game dibatalkan.\n${who.map(tag).join(' ')}`,
      mentions: who,
    })).catch(() => {});
  }, waiting ? CFG.waitTtlMs : CFG.playTtlMs);
  room.timer.unref?.();
}

// ---------- hadiah ----------

function giveReward(db, jid, now, rand, freeLimit) {
  db.users = db.users || {};
  const u = (db.users[jid] = db.users[jid] && typeof db.users[jid] === 'object' ? db.users[jid] : {});
  const day = new Date(now).toLocaleDateString('en-CA', { timeZone: CFG.tz });
  if (!u.ttt || typeof u.ttt !== 'object') u.ttt = { day: '', rewarded: 0, wins: 0 };
  if (u.ttt.day !== day) { u.ttt.day = day; u.ttt.rewarded = 0; }
  u.ttt.wins = (u.ttt.wins || 0) + 1;
  if (u.ttt.rewarded >= CFG.maxRewardPerDay) return null;
  u.ttt.rewarded++;
  if (rand() < CFG.limitChance) {
    const n = randInt(CFG.limitRange[0], CFG.limitRange[1], rand);
    u.limit = (Number.isFinite(u.limit) ? u.limit : freeLimit) + n;
    return { type: 'limit', amount: n };
  }
  const steps = Math.floor((CFG.moneyRange[1] - CFG.moneyRange[0]) / CFG.moneyStep);
  const n = CFG.moneyRange[0] + CFG.moneyStep * randInt(0, steps, rand);
  u.money = (Number.isFinite(u.money) ? u.money : 0) + n;
  return { type: 'money', amount: n };
}

// ---------- publik ----------

// true kalau pesan ini adalah langkah (angka 1-9) dari pemain yang sedang bermain di chat ini
export function isTictactoeMove(chat, sender, body) {
  if (!/^[1-9]$/.test(String(body || '').trim())) return false;
  return Object.values(rooms).some((r) => r.chat === chat && r.state === 'PLAYING' && (r.x === sender || r.o === sender));
}

export async function tictactoeMove({ hc, m, db, from, sender, body, settings, rand = Math.random, now = Date.now() }) {
  const room = Object.values(rooms).find((r) => r.chat === from && r.state === 'PLAYING' && (r.x === sender || r.o === sender));
  if (!room) return false;
  const send = (text, mentions) => hc.sendMessage(from, { text, mentions }, { quoted: m });
  const g = room.game;
  if (g.currentTurn !== sender) return true; // bukan giliranmu: abaikan tanpa membalas

  const r = g.turn(sender === g.playerX ? 0 : 1, parseInt(body, 10) - 1);
  if (r === 0) { await send('⚠️ Kotak itu sudah terisi, pilih angka lain.', []); return true; }
  if (r !== 1) return true;

  const pair = [g.playerX, g.playerO];
  const winner = g.winner;
  if (winner) {
    const loser = winner === g.playerX ? g.playerO : g.playerX;
    const prize = giveReward(db, winner, now, rand, settings?.limit?.free ?? 15);
    const prizeText = !prize
      ? `ℹ️ Batas hadiah harian (${CFG.maxRewardPerDay}x) sudah tercapai, kali ini tanpa hadiah.`
      : prize.type === 'limit' ? `🎁 Hadiah: *Limit +${prize.amount}*` : `🎁 Hadiah: *Money +${fmt(prize.amount)}* 💰`;
    closeRoom(room);
    await send(`🏆 *TIC TAC TOE*\n\n${boardText(g)}\n\n${tag(winner)} menang atas ${tag(loser)}!\n${prizeText}`, pair);
    return true;
  }
  if (g.board === 511) {
    closeRoom(room);
    await send(`🤝 *TIC TAC TOE*\n\n${boardText(g)}\n\nPermainan seri! Tidak ada pemenang.`, pair);
    return true;
  }
  arm(room);
  await send(`🎮 *TIC TAC TOE*\n\n${boardText(g)}\n\n❌ ${tag(g.playerX)}\n⭕ ${tag(g.playerO)}\n\nGiliran: ${tag(g.currentTurn)}`, pair);
  return true;
}

export async function tictactoeCommand({ hc, m, from, sender, args = [], prefix = '.', isGroup, contextInfo, reply, rand = Math.random }) {
  const p = `${prefix}tictactoe`;
  if (!isGroup) return reply('🎮 TicTacToe hanya bisa dimainkan di grup.');
  const sub = String(args[0] || '').toLowerCase();

  if (['help', 'bantuan'].includes(sub)) {
    return reply(`🎮 *TIC TAC TOE*\n${p} → buat room / gabung room\n${p} @user → tantang orang tertentu\n${p} nyerah → menyerah / batalkan room\nSaat giliranmu, ketik angka *1-9*.\n\n🎁 Pemenang dapat *limit atau money* acak (maks ${CFG.maxRewardPerDay}x per hari).`);
  }

  const mine = roomOf(sender);

  if (['stop', 'nyerah', 'surrender', 'keluar', 'cancel', 'batal'].includes(sub)) {
    if (!mine) return reply('Kamu tidak sedang dalam game TicTacToe.');
    if (mine.state === 'WAITING') { closeRoom(mine); return reply('🎮 Room TicTacToe dibatalkan.'); }
    const g = mine.game;
    const other = sender === g.playerX ? g.playerO : g.playerX;
    closeRoom(mine);
    return reply(`🏳️ ${tag(sender)} menyerah. ${tag(other)} menang! (menang karena menyerah tidak mendapat hadiah)`, { mentions: [sender, other] });
  }

  if (mine) {
    if (mine.state === 'WAITING') return reply(`⏳ Kamu masih menunggu lawan. Ketik *${p} nyerah* untuk membatalkan.`);
    const g = mine.game;
    return reply(`🎮 *TIC TAC TOE*${mine.chat !== from ? '\n(game kamu ada di grup lain)' : ''}\n\n${boardText(g)}\n\n❌ ${tag(g.playerX)}\n⭕ ${tag(g.playerO)}\n\nGiliran: ${tag(g.currentTurn)}`, { mentions: [g.playerX, g.playerO] });
  }

  // lawan yang ditantang (mention atau balas pesan), bukan diri sendiri dan bukan bot
  const botIds = [hc.user?.id, hc.user?.lid, hc.user?.jid].filter(Boolean).map(userPart);
  const target = [...(contextInfo?.mentionedJid || []), contextInfo?.participant]
    .filter(Boolean).find((j) => !botIds.includes(userPart(j)));
  if (target && userPart(target) === userPart(sender)) return reply('Kamu tidak bisa menantang dirimu sendiri 😅');

  // gabung ke room yang menunggu di grup ini (room terbuka, atau yang menantang kamu)
  const waiting = Object.values(rooms).find((r) => r.chat === from && r.state === 'WAITING'
    && (!r.reserved || userPart(r.reserved) === userPart(sender)));
  if (waiting && (!target || userPart(target) === userPart(waiting.x))) {
    let [x, o] = [waiting.x, sender];
    if (rand() < 0.5) [x, o] = [o, x]; // acak siapa yang jalan duluan
    waiting.game = new TicTacToe(x, o);
    waiting.x = x; waiting.o = o; waiting.state = 'PLAYING'; waiting.reserved = null;
    arm(waiting);
    const g = waiting.game;
    return reply(`🎮 *TIC TAC TOE DIMULAI*\n\n${boardText(g)}\n\n❌ ${tag(g.playerX)}\n⭕ ${tag(g.playerO)}\n\nGiliran: ${tag(g.currentTurn)}\nKetik angka *1-9* untuk memilih kotak.\n🎁 Pemenang dapat limit/money acak!`, { mentions: [g.playerX, g.playerO] });
  }

  // buat room baru
  if (target && roomOf(target)) return reply(`${tag(target)} sedang dalam game TicTacToe lain.`, { mentions: [target] });
  const id = `${from}:${Date.now()}:${Math.floor(rand() * 1e6)}`;
  const room = { id, chat: from, x: sender, o: null, reserved: target || null, game: null, state: 'WAITING', hc, timer: null };
  rooms[id] = room;
  arm(room);
  return reply(target
    ? `🎮 ${tag(sender)} menantang ${tag(target)} bermain TicTacToe!\n${tag(target)} ketik *${p}* untuk menerima.`
    : `🎮 ${tag(sender)} membuat room TicTacToe dan menunggu lawan.\nKetik *${p}* untuk bergabung.`,
  { mentions: target ? [sender, target] : [sender] });
}
