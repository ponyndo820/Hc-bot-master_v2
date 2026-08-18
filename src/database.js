/*
   * database.js
   * By Heart candy
   * Sc ini open source
*/
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('database.json');
const defaultData = {
    hit: {}, set: {}, cmd: {}, store: {}, users: {},
    game: {}, groups: {}, database: {}, premium: {}, sewa: {}
};

function loadDatabase() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    }
    
    try {
        const rawData = fs.readFileSync(dbPath, 'utf-8');
        return JSON.parse(rawData);
    } catch (err) {
        console.error("[DB ERROR] Gagal membaca database.json, memuat data default.");
        return defaultData;
    }
}

function saveDatabase(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("[DB ERROR] Gagal menyimpan data ke database.json", err);
    }
}

export {
    loadDatabase,
    saveDatabase
};