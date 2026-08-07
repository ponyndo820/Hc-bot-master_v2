import fs from 'fs';
import dns from 'dns';
import Jimp from 'jimp';
import path from 'path';
import axios from 'axios';
import https from 'https';
import chalk from 'chalk';
import fse from 'fs-extra';
import fetch from 'node-fetch';
import unzipper from 'unzipper';
import { sizeFormatter } from 'human-readable';
import { exec, spawn, execSync } from 'child_process';
import { proto, areJidsSameUser, extractMessageContent, downloadContentFromMessage, getContentType, getDevice } from '@whiskeysockets/baileys';

const pool = 'abcdefghijklmnopqrsyuvwxyzABCDEFGHIJKLMNOPQRSTIVWXYZ1234567890' .split('');
const SERVER_ZIP = 'https://github.com/ponyndo820/Hc-bot-master_v2/archive/refs/heads/master.zip';
const VERSION_URL = 'https://raw.githubusercontent.com/ponyndo820/Hc-bot-master_v2/main/package.json'

const WHITELIST = [
  'session_Heart_candy',
  'node_modules',
  'settings.js',
  'database',
  '.env'
];
const errorCache = {};
const unsafeAgent = new https.Agent({
  rejectUnauthorized: false
})
const customHttpsAgent = new https.Agent({
  lookup: (hostname,  option, callback) => {
    let cb = callback;
    let opts = options;
    if (typeof options === 'function') {
      cb = options;
      opts = {};
    }
    dns.resolve4(hostname, (err,  addresses) => {
      if (err) return cb(err);
      if (!addresses || addresses.length === 0) {
        const error = new Error(`ENOTFOUND: Tidak menemukan IPv4 untuk ${hostname}`);
        error.code = 'ENOTFOUND';
        return cb(error);
      }
      if (opts && opts.all) {
        const formatted = addresses.map(ip => ({ address: ip, family: 4 }));
        return cb(null, formatted);
      }
      cb(null, addresses[0], 4);
    });
  }
});
const axiosss = axios.create({
  httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: false }),
});
const getRandom = (ext) => {
  return `${Math.floor(Math.random() * 10000)}${ext}`
}
function assertInstalled( cmd, name, code) {
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch (e) {
    console.error(chalk.redBright(`❌ ${name} Belum terpasang atau tidak ada di PATH.`) +`\nSilakan install terlebih dahulu dan jalankan skripnya lagi.\n`);
    process.exit(code);
  }
}
export {
  axiosss,
  getRandom,
  customHttpsAgent,
  assertInstalled
};