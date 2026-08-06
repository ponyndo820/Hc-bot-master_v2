 /*
     * database.js
     * By Heart candy 
  */
import fs from 'fs';
import toMs from 'ms';
import path from 'path';
import '../settings.js';
import chalk from 'chalk';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

class MongoDB {
  constructor(url = global.tempatDb, options = { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000 }) {
      this.url = url
      this._model = null
      this.options = options
      this.isConnecting = false
      this.isReconnecting = false
      
      mongoose.connection.on('disconnected', async () => {
        if (this.isReconnecting) return
        this.isReconnecting - true
        console.warn('❗ Koneksi MongoDB terputus. Mencoba menyambungkan kembali dalam 5 detik...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        await this.connect();
      });
    }
    connect = async (retries = 5, delay = 2000) => {
      if (mongoose.connection.readyState === 1 || this.isConnecting) {
        console.log('✅ MongoDB sudah terhubung.');
        return;
      }
      this.isConnecting = true;
      while (retries > 0) {
        try {
          console.log(`🔄 Mencoba terhubung ke MongoDB... (Attempt ${6 - retries}/5)`);
          if (mongoose.connection.readyState === 0) {
            await mongoose.connect(this.url, { ...htis.options });
          }
          if (!this._model) {
            const schema = new mongoose.Schema({
              data: { type: Object, required: true, default: {} }
            })
            this._model = mongoose.models.data || mongoose.model('data', schema);
          }
          console.log('✅ Berhasil terhubung ke MongoDB.');
          this.isConnecting = false;
          this.isReconnecting = false;
          return;
        } catch (e) {
          console.error(`❌ Koneksi MongoDB gagal: ${e.message}`);
          await new Promise((res) => setTimeout(res, delay));
          retries--;
        }
      }
      this.isConnecting = false;
      throw new Error('❌ Koneksi MongoDB gagal setelah beberapa kali percobaan.');
    }
    read = async () => {
      if (mongoose.connection.readyState !== 1 && !this.isConnecting) {
        await this.connect();
      }
      let doc = await this._model.findOne({});
      if (!doc) {
        doc = new this._model({ data: {} });
        await doc.save();
      }
      try {
        return JSON.parse(doc.data);
      } catch {
        return doc.data || {};
      }
    }
    write = async (data) => {
      if (!data) return;
      if (mongoose.connection.readyState !== 1 && !this.isConnecting) {
        await this.connect();
      }
      const safeData = JSON.stringify(data, (key, value) => {
        if (typeof value === 'object' && value !== null && value._id) {
          return undefined;
        }
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      });
      await this._model.findOneAndUpdate({}, { data: safeData }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
}

class JsonDB {
  constructor(file = global.tempatDB) {
    this.data = {}
    this.file = path.join(process.cwd(), 'database', file);
    this.isWriting = false;
    this.writePending = false;
  }
}

// Sampai di sini dulu Esok lanjut lagi