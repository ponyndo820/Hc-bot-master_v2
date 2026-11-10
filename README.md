<div align="center">
  <img src="https://cdn.imagetourls.com/uploads/tyImg/13aSRpnk8.png" width="200">
</div>

<p align="center">
  <a href="https://wa.me/6285823709413">
    <img src="https://img.shields.io/badge/WhatsApp-25D366?logo=whatsapp&logoColor=white" alt="WhatsApp">
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://whatsapp.com/channel/0029Vb6en2iAu3aXA7AcFI0Y">
    <img src="https://img.shields.io/badge/WhatsApp%20Channel-25D366?logo=whatsapp&logoColor=white" alt="WhatsApp Channel">
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://youtube.com/@ponyndo?si=rMY2tSN5BbeNZWQ4">
    <img src="https://img.shields.io/badge/YouTube-EA7EA3?logo=youtube&logoColor=white" alt="YouTube">
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://www.instagram.com/ponyndo1_original?igsh=NDZ0dmYwNDltZHFu">
    <img src="https://img.shields.io/badge/Instagram-E4405F?logo=instagram&logoColor=white" alt="Instagram">
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://saweria.co/Ponyndo">
    <img src="https://img.shields.io/badge/Saweria-F4C430?logo=ko-fi&logoColor=white" alt="Saweria">
  </a>
	  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="Panduan%20penggunaan/Panduanrun.md">
    <img src="https://img.shields.io/badge/Panduan-Lengkap-3B82F6?logo=readthedocs&logoColor=white" alt="Panduan Lengkap">
  </a>
</p>


- Sc/Script ini masih dalam tahap pengembangan ❗
- Terimakasih telah mengunjungi repositori ini.

# Run ⬇️

	yarn install or npm install
	yarn start or npm start

# Install pkg⬇️

	pkg update && pkg upgrade
	pkg install git
	pkg install ruby
	pkg install yarn
	pkg install nodejs
	pkg install ffmpeg
	pkg install imagemagick
	pkg install python ffmpeg
	
# Install via npm 📦

Bot ini juga tersedia di npm:

	npm install @heart867n/hc-bot

Setelah terpasang, masuk ke folder paketnya, isi `settings.js`, lalu jalankan:

	cd node_modules/@heart867n/hc-bot
	nano settings.js
	npm start

Ganti `Gemini` dan `APIKeys` di `settings.js` dengan API key milikmu sendiri. Pastikan juga paket sistem di atas (`ffmpeg`, `imagemagick`, `ruby`, `python`) sudah terpasang.

## 🗂 Structure Project
```
├── Panduan penggunaan
│   └── Panduanrun.md
├── database
│   ├── A
│   └── A.txt
├── game
│   ├── fisht.js
│   ├── tictactoe-bot.js
│   └── tictactoe.js
├── lib
│   ├── antibot.js
│   ├── antilink.js
│   ├── banchat.js
│   ├── converter.js
│   ├── function.js
│   ├── igdl.js
│   ├── jadibot.js
│   ├── maintenance.js
│   ├── randompony.rb
│   ├── removebg.js
│   ├── savenow.js
│   ├── ssweb.rb
│   ├── toqr.js
│   ├── uploader.js
│   ├── welcome.js
│   ├── ytdlp-opts.js
│   └── ytmp4.js
├── scrape
│   ├── doaharian.json
│   ├── quotes.json
│   ├── quotesislami.json
│   └── tahlil.json
├── src
│   ├── media
│   │   └── menu.mp4
│   ├── database.js
│   ├── message.js
│   └── server.js
├── .gitignore
├── Dockerfile
├── Hc.js
├── LICENSE
├── Procfile
├── README.md
├── app.json
├── gitignore.txt
├── index.js
├── main.js
├── package.json
├── settings.js
└── speed.py
```

> Folder `sessions` dan file database dibuat otomatis saat bot pertama kali dijalankan.


# pm2
Disarankan untuk menggunakan pm2 di bot ini supaya bot ini bisa berjalan 24 jam non stop.

*Tentang PM2*

PM2 adalah manajer proses (process manager) tingkat produksi untuk aplikasi berbasis Node.js yang dilengkapi dengan fitur load balancer bawaan. Alat ini dirancang untuk membantu menjaga aplikasi agar tetap berjalan terus-menerus (24/7), melakukan restart otomatis jika terjadi crash, serta memudahkan pengelolaan aplikasi di latar belakang server tanpa takut terputus meskipun terminal ditutup.

*Cara install dan menggunakannya*

- Instal PM2 secara global
  Jalankan perintah ini di Termux untuk memasang PM2
  
      npm install -g pm2

- Menjalankan bot dengan PM2
Masuk ke direktori folder bot, lalu jalankan perintah berikut untuk mulai menyalakannya

      cd Hc-bot-master_v2
      pm2 start index.js --name "Hc-bot-master_v2"

- Melihat log/aktivitas bot secara real-time

      pm2 logs Hc-bot-master_v2

- Merestart bot (misalnya setelah update)

      pm2 restart Hc-bot-master_v2

- Menghentikan bot sementara

      pm2 stop Hc-bot-master_v2
      
      
# Bahasa program
 - Ruby
 - NodeJs
 - Python
