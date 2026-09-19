![image alt](https://files.catbox.moe/9gxjhx.jpg)
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
	
## 🗂 Structure Project
```
├── database
│       └── temp
├── lib
│   ├── ytmp4
│   ├── ssweb.rb
│   ├── quotes.js
│   ├── function.js
│   ├── converter.js
│   ├── randompony.rb
│   └── quotesislami.json
├── src
│   └── database.js
├── Hc.js
├── main.js
├── LICENSE
├── speed.py
├── app.json
├── index.js
├── Procfile
├── README.md
├── Dockerfile
├── settings.js
├── package.json
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
      
      
# Bahasa program
 - Ruby
 - NodeJs
 - Python
