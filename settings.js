import fs from 'fs';
import chalk from 'chalk'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

//Tempat Buat Settings Global
global.owner = ['6285823709413']
global.author = 'Heart candy'
global.botname = 'Hc-bot'
global.packname = '@ponyndo'
global.timezone = 'Asia/Jakarta'
global.locale = 'en'
global.listprefix = ['+',',','.','!']
global.tempatDB = 'database.json'
global.tempatStore = 'baileys_store.json'
global.pairing_code = true
global.number_bot = ''
global.mode = 'public'

global.fake = {
	anonim: 'https://telegra.ph/file/95670d63378f7f4210f03.png',
	thumbnailUrl: 'https://files.catbox.moe/kbqo64.jpg',
	listfakedocs: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/pdf'],
}

global.my = {
	yt: 'https://youtube.com/@ponyndo?si=k9PQEkINzEREkE6p',
	gh: 'https://github.com/ponyndo820/Hc-bot',
	gc: 'https://chat.whatsapp.com/E50d9VEtLnc3acHPFeRdqY?mode=gi_t',
	ch: '120363421709200388@newsletter',
}

global.limit = {
	free: 20,
	premium: 9999,
	vip: 9000
}

global.money = {
	free: 10000,
	premium: 10000000000,
	vip: 10000000
}

global.mess = {
	owner: "Khusus Owner❗",
	admin: "Bot harus menjadi admin terlebih dahulu❗",
	botAdmin: "Bot harus Admin❗",
	onWa: "Nomor tersebut tidak terdaftar di WhatsApp❗",
	group: "Khusus Grup❗",
	private: "Khusus Private Chat 🔏",
	quoted: "Reply pesannya❗",
	limit: "Limit habis❗",
	prem: "Khusus Premium❗",
	text: "Masukkan teksnya 🔤",
	media: "Kirim medianya 📁",
	wait: "Proses...",
	fail: "Gagal ❌",
	error: "Error 🙁",
	done: "Selesai ✅"
}

global.APIs = {
	neosantara: 'https://api.neosantara.xyz/v1',
}
global.APIKeys = {
	'https://api.neosantara.xyz/v1': 'nsk_e24111f0fbe94c9689b9049bd7f13771',
}

// Lainnya
global.jadwalSholat = {
	Subuh: '04:30',
	Dzuhur: '12:06',
	Ashar: '15:21',
	Maghrib: '18:08',
	Isya: '19:00'
}

global.badWords = ['dongo', 'konsol'] // input kata-kata toxic yg lain. ex: ['dongo','dongonya']
global.chatLength = 1000

fs.watchFile(__filename, async () => {
	console.log(chalk.yellowBright(`[UPDATE] ${__filename}`))
});
