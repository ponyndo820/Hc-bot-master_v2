/*
   * settings.js
   * By Heart candy
   * Sc ini open source
*/
import fs from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const settings = {
  ownerNumber: ['6285823709413'],
  author: 'Heart candy',
  botName: ['Hc-bot'],
  packname: 'ponyndo',
  pairing_code: true,
  prefix: ['+', ',', '.', '!'],
  autoRead: false,
  selfMode: false,
  tempatDB: 'database.json',
  tempatStore: 'baileys_store.json',
  listv: ['•','●','■','✿','▲','➩','➢','➣','➤','✦','✧','△','❀','○','□','♤','♡','◇','♧','々','〆']
}

settings.my = {
  yt: '',
  gh: '',
  gc: '',
  ch: '',
}

settings.mess = {
  owr: "Khusus Owner Ya Sayang❗",
  adm: "Khusus Admin Ya Sayang❗",
  fit: "Fitur Ini Belum Tersedia Ya Syang ❗",
  qud: "Reply pesannya ya Sayang❗",
  don: "selesai✅",
}

settings.limit = {
  free: 15,
  premium: 999,
  vip: 9999
}

settings.money = {
  free: 10000,
  premium: 1000000,
  vip: 100000000
  
}

settings.jadwalSholat = {
  Subuh: '04:30',
  Dzuhur: '12:06',
  Ashar: '15:21',
  Maghrib: '18:08',
  Isya: '19:00'
}

settings.badWords = ['dongo','kontol'] // input kata-kata toxic di sini ya Sayang. ex: ['dongo','dongonya']
settings.chatLength = 1000


fs.watchFile(__filename, async () => {
  console.log(chalk.yellowBright(`[UPDATE] ${__filename}`))
});

export default settings;
