const COOLDOWN_MS = 5000
const usedCommandRecently = new Set()

const isFiltered = (from) => usedCommandRecently.has(from)
const addFilter = (from) => {
  usedCommandRecently.add(from)
  setTimeout(() => usedCommandRecently.delete(from), COOLDOWN_MS)
}

export const antiSpam = {
  isFiltered,
  addFilter
}

export function getBotSet(db, botId) {
  const key = String(botId || '').split(':')[0].replace(/[^0-9]/g, '')
  if (!db.set || typeof db.set !== 'object' || Array.isArray(db.set)) db.set = {}
  let set = db.set[key]
  if (!set || typeof set !== 'object' || Array.isArray(set)) set = db.set[key] = {}
  if (typeof set.antispam !== 'boolean') set.antispam = false
  return set
}

export async function antispamCommand({ db, botNumber, args = [], prefix = '.' }) {
  const set = getBotSet(db, botNumber)
  const p = `${prefix}antispam`
  const sub = String(args[0] || '').toLowerCase()
  const detik = COOLDOWN_MS / 1000

  if (!sub || sub === 'status') {
    return { text: `🛡️ *ANTISPAM*\nStatus: ${set.antispam ? 'aktif ✅' : 'nonaktif ❌'}\nJeda antar perintah: ${detik} detik (owner dikecualikan)\n\nKetik ${p} on atau ${p} off` }
  }
  if (['on', 'aktif', '1'].includes(sub)) {
    set.antispam = true
    return { text: `🛡️ Antispam *aktif*.\nPerintah beruntun dari user yang sama diabaikan selama ${detik} detik.` }
  }
  if (['off', 'mati', '0'].includes(sub)) {
    set.antispam = false
    return { text: '🛡️ Antispam *dimatikan*.' }
  }
  return { text: `Pakai: ${p} on atau ${p} off` }
}
