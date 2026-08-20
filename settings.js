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
  botName: ['Hc-bot-master_v2'],
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
fs.watchFile(__filename, async () => {
  console.log(chalk.yellowBright(`[UPDATE] ${__filename}`))
});

export default settings;
