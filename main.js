import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { watchFile, unwatchFile } from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function main() {
  let args = [path.join(__dirname, 'index.js'),...process.argv.slice(2)]
  let p = spawn(process.args[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc']
  }) .on('message', data => {
    if (data === 'reset') {
      console.log(chalk.yellow.bold('[BOT] Restarting...'))
      p.kill()
      setTimeout(() => {
        main()
      }, 1000);
    } else if (data === 'uptime') {
      p.send(process.uptime())
    }
  }).on('exit', code => {
    if (code !== 0) {
      console.error(chalk.red.bold(`[BOT] Keluar dengan kode: ${code}`));
      setTimeout(() => {
        main()
      }, 2000);
    } else {
      console.log(chalk.green.bold('[BOT] Proses berakhir dengan bersih. Sampai jumpa!'));
      process.exit(0)
    }
  })
}
main()