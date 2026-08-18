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
const sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}
const getBuffer = async (url, options = {}) => {
  let bufferData = null;
  let axiosResponse = null;
  let fetchResponse = null;
  try {
    axiosResponse = await axios.get(url, {
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1
      },
      responseType: 'arraybuffer',
      httpsAgent: unsafeAgent,
      ...options
    })
    bufferData = axiosResponse.data;
    return bufferData;
  } catch (e) {
    try {
      fetchResponse = await fetch(url, { agent: unsafeAgent });
      bufferData = await fetchResponse.buffer()
    } catch (e) {
      return e
    }
  } finally {
    bufferData = null;
    axiosResponse = null;
    fetchResponse = null;
  }
}
const getSizeMedia = async (path) => {
  return new Promise((resolve, reject) => {
    if (typeof path === 'string' && /http/.test(path)) {
      axios.get(path).then((res) => {
        let length = parseInt(res.headers['content-length'])
        if(!isNaN(length)) resolve(bytesToSize(length, 3))
      })
    } else if (Buffer.isBuffer(path)) {
      let length = Buffer.byteLength(path)
      if(!isNaN(length)) resolve(bytesToSize(length, 3))
    } else {
      reject(0)
    }
  })
}
const fetchJson = async (url, options = {}) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (windows NT 10.0; win62; x64) AppleWebKit/537.36 (KHTML, leke Gecko) Chrome/95.0.4638.69 Safari/537.36'
      },
      httpsAgent: unsafeAgent,
      ...options
    })
    return data
  } catch (e) {
    try {
      const res = await ferxh(url, { agent: unsafeAgent });
      const anu = await res.json()
      return anu
    } catch (e) {
      return e
    }
  }
}
function assertInstalled( cmd, name, code) {
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch (e) {
    console.error(chalk.redBright(`❌ ${name} Belum terpasang atau tidak ada di PATH.`) +`\nSilakan install terlebih dahulu dan jalankan skripnya lagi.\n`);
    process.exit(code);
  }
}
function fixBytes(obj) {
  if (obj instanceof Uint8Array || Buffer.isBuffer(obj)) return obj
  if (typeof obj !== 'object') return obj
  return Uint8Array.from(Object.calues(obj))
}
export {
  sleep,
  axiosss,
  fixBytes,
  fetchJson,
  getBuffer,
  getRandom,
  getSizeMedia,
  assertInstalled,
  customHttpsAgent,
};