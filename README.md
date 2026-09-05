![image alt](https://files.catbox.moe/9gxjhx.jpg)
- Sc/Script ini masih dalam tahap pengembangan ❗
- Terimakasih telah mengunjungi repositori ini.

# Run ⬇️

	yarn install or npm install
	yarn start or npm start

# Install pkg⬇️

	pkg update && pkg upgrade
	pkg install git
	pkg install yarn
	pkg install nodejs
	pkg install ffmpeg
	pkg install imagemagick
	pkg install python ffmpeg

# Sosial media
- [Subscribe](https://youtube.com/@ponyndo?si=rMY2tSN5BbeNZWQ4)
- [Follow our Instagram account](https://www.instagram.com/ponyndo1_original?igsh=NDZ0dmYwNDltZHFu)
- [Follow our WhatsApp Channel](https://whatsapp.com/channel/0029Vb6en2iAu3aXA7AcFI0Y)

 
## 🗂 Structure Project
```
├── database
│       └── database.json
├── lib
│   ├── converter.js
│   ├── function.js
│   └── quotes.js
├── src
│   └── database.js
├── Hc.js
├── LICENSE
├── README.md
├── index.js
├── main.js
├── package.json
├── settings.js
├── speed.py
```


# pm2
Disarankan untuk menggunakan pm2 di bot ini supaya bot ini bisa berjalan 24 jam non stop.

*Tentang PM2*

PM2 adalah manajer proses (process manager) tingkat produksi untuk aplikasi berbasis Node.js yang dilengkapi dengan fitur load balancer bawaan. Alat ini dirancang untuk membantu menjaga aplikasi agar tetap berjalan terus-menerus (24/7), melakukan restart otomatis jika terjadi crash, serta memudahkan pengelolaan aplikasi di latar belakang server tanpa takut terputus meskipun terminal ditutup.

*Cara install dan menggunakannya*

- Instal PM2 secara global
  Jalankan perintah ini di Termux untuk memasang PM2
  
      npm install g pm2

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
