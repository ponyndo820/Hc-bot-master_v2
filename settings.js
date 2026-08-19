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
  botName: ['Hc-bot-master_v2'],
  ownerNumber: ['2685823709413'],
  pairing_code: true,
  prefix: ['+', ',', '.', '!'],
  autoRead: false,
  selfMode: false
}

settings.mess = {
  owner: "Khusus Owner Ya Sayang❗",
  admin: "Khusus Admin Ya Sayang❗",
}
fs.watchFile(__filename, async () => {
  console.log(chalk.yellowBright(`[UPDATE] ${__filename}`))
});

export default settings;
