Sc/Script ini masih dalam tahap pengembangan ❗

Terimakasih telah mengunjungi repositori ini.
Run ⬇️

	yarn install or npm install
	yarn start or npm start

Install pkg⬇️

	pkg update && pkg upgrade
	pkg install git
	pkg install nodejs
	pkg install ffmpeg
	pkg install imagemagick
	pkg install yarn

# Sosial media
- [Subscribe](https://youtube.com/@ponyndo?si=rMY2tSN5BbeNZWQ4)
- [Follow our Instagram account](https://www.instagram.com/ponyndo1_original?igsh=NDZ0dmYwNDltZHFu)
- [Follow our WhatsApp Channel](https://whatsapp.com/channel/0029Vb6en2iAu3aXA7AcFI0Y)

 
# Hc-bot-master_v2
Alur kerja 
Membuat sistem pairing code dan qr code 
Membuat sistem database
Membuat sistem Handler command

File 
index.js
package.json
database.js
database.json
Hc.js

File fungsi 
index.js Berfungsi untuk membuat sistem pairing code atau qr code dan ini juga adalah otak untuk memproses semua data, dan tempat untuk membuat log pesan yang terkirim dan log pesan yang di terima oleh bot dan juga log pesan yang dikirim oleh bot itu sendiri dan log pesan yang dikirim oleh owner bot itu sendiri mengikuti nomor telepon yang digunakan untuk menghubungkan bot.

package.json Berfungsi untuk menaruh semua pake yang harus di install di aplikasi terminal maupun vps.

database.js Berfungsi untuk membuat file backup yang bernama database.json dan berfungsi untuk menulis data hit, set, cmd, store, users, game, groups, database, premium, sewa, ...loadData.
yang di simpan di database.json.

database.json Berfungsi menyimpan data seperti hit, set, cmd, store, users, game, groups, database, premium, sewa, ...loadData.

Hc.js Berfungsi untuk memproses semua command yang masuk sekaligus juga menjadi tempat Handler command case.

