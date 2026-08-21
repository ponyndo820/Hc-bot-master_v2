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
  selfMode: false
}

settings.mess = {
  owner: "Khusus Owner Ya Sayang❗",
  admin: "Khusus Admin Ya Sayang❗",
  fitur: "Fitur Ini Belum Tersedia Ya Syang ❗",
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


fs.watchFile(__filename, async () => {
  console.log(chalk.yellowBright(`[UPDATE] ${__filename}`))
});

export default settings;
