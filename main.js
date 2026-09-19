/*
   * main.js
   * By Heart candy
   * Sc ini open source
   * ❗Peringatan Script ini tidak boleh di perjual belikan. Jika melanggar akan berurusan dengan hukum.
*/
import path from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function main() {
  let args = [path.join(__dirname, 'index.js'), ...process.argv.slice(2)];
  let p = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit']
  });
  p.on('exit', code => {
    if (code !== 0) {
      console.error(chalk.red.bold(`[BOT] Keluar dengan kode: ${code}, memuat ulang bot...`));
      setTimeout(() => {
        main();
      }, 2000);
    } else {
      console.log(chalk.green.bold('[BOT] Proses berakhir dengan bersih. Sampai jumpa!'));
      process.exit(0);
    }
  });
}

main();
