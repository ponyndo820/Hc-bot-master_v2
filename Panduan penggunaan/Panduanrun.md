# Panduan Menjalankan Hc-bot-master_v2

Bot WhatsApp berbasis Baileys (multi device) dengan tema MLP. Panduan ini merangkum instalasi di **Termux (Android)** dan **Railway**, pengaturan rahasia (API key, cookies), manajemen database dan sesi, fitur jadibot dan downloader YouTube, serta daftar masalah yang pernah muncul beserta solusinya.

> Jangan pernah menaruh API key, cookies, atau folder sesi di GitHub. Lihat bagian **Keamanan**.

---

## 1. Persyaratan

- Node.js **20 atau lebih baru** (`engines` di `package.json`: `>=20.0.0`)
- `ffmpeg` (konversi audio, video, stiker)
- `python` (dibutuhkan yt-dlp untuk `.ytmp3` dan `.ytmp4`)
- `git`, `ruby`, `imagemagick` (dipakai beberapa fitur di folder `lib/`)
- Satu nomor WhatsApp untuk bot (login memakai **kode pairing**, bukan QR)

## 2. Struktur project

```
├── database/            data bot (database.json, jadibot/, temp/, kunci API, cookies)
├── lib/                 modul pendukung
│   ├── converter.js     konversi ffmpeg (.toaudio, .togif, dll)
│   ├── jadibot.js       sesi jadibot + pemulihan otomatis + stopJadibot
│   ├── maintenance.js   backup, info/arsip/hapus sesi, pembersihan sampah
│   ├── ytmp4.js         unduh video YouTube
│   ├── ytdlp-opts.js    opsi yt-dlp, cookies, pembaruan yt-dlp
│   ├── savenow.js       jalur cadangan unduhan lewat API SaveNow
│   ├── removebg.js      hapus background (API remove.bg)
│   ├── uploader.js      Uguu.se dan konversi webp ke mp4 (Ezgif)
│   ├── function.js      fungsi bantu
│   ├── ssweb.rb         screenshot web
│   └── igdl.js          unduh Instagram
├── src/                 database.js dan message.js
├── scrape/              data JSON (doa, quotes, tahlil)
├── Hc.js                semua command bot
├── index.js             koneksi WhatsApp, event, interval otomatis
├── main.js              pembungkus: me-restart bot otomatis bila crash
├── settings.js          pengaturan bot
├── Dockerfile / Procfile / app.json   untuk deploy
└── package.json
```

`main.js` menjalankan `index.js` dan memuat ulang bot dalam 2 detik bila proses keluar dengan kode selain 0. Karena itu satu error fatal akan terlihat berulang-ulang di log.

---

## 3. Instalasi di Termux (Android)

Sebaiknya pasang Termux dari **F-Droid** (bukan Play Store).

### 3.1 Pasang paket

```bash
pkg update && pkg upgrade
pkg install git
pkg install ruby
pkg install yarn
pkg install nodejs
pkg install ffmpeg
pkg install imagemagick
pkg install python
```

### 3.2 Ambil kode dan pasang dependensi

```bash
git clone https://github.com/ponyndo820/Hc-bot-master_v2.git
cd Hc-bot-master_v2
yarn install
```

### 3.3 Atur `settings.js`

Buka `settings.js` dan ubah minimal:

```js
ownerNumber: ['628xxxxxxxxxx'],   // nomor owner, tanpa tanda +
botName: ['Hc-bot'],
prefix: ['+', ',', '.', '!'],
tempatDB: 'database.json',        // nama file database (JSON) di folder database/
```

Bagian `limit`, `money`, `mess`, dan `bypasslimit` bisa disesuaikan sesuai kebutuhan.

### 3.4 Jalankan dan login

```bash
yarn start
```

Bot menanyakan nomor bot (contoh `628xxxxxxxxxx`) lalu menampilkan **kode pairing**. Di WhatsApp nomor bot: **Setelan → Perangkat tertaut → Tautkan dengan nomor telepon**, lalu masukkan kodenya. Setelah tersambung, sesi disimpan di folder `sessions/`, jadi login tidak perlu diulang.

Pada pairing pertama sering muncul satu kali `Terputus, sedang mencoba menghubungkan ulang...`. Itu normal.

### 3.5 Jalan 24 jam

Gunakan pm2 supaya bot tetap hidup saat terminal ditutup:

```bash
npm install -g pm2
pm2 start main.js --name hc-bot
pm2 logs hc-bot        # lihat log
pm2 restart hc-bot     # mulai ulang
pm2 stop hc-bot        # hentikan
```

Agar bot otomatis jalan saat HP menyala, pasang **Termux:Boot** (dari F-Droid, satu sumber dengan Termux) dan buat skrip di `~/.termux/boot/` yang menjalankan perintah `pm2 resurrect` atau `cd ~/Hc-bot-master_v2 && node main.js`.

### 3.6 Catatan untuk fitur YouTube dan arsip sesi

- `.ytmp3` dan `.ytmp4` memakai yt-dlp. Saat bot menyala, yt-dlp **diperbarui otomatis** (log menampilkan `[YTDLP] versi ...`).
- Opsi JavaScript yt-dlp (`--js-runtimes node` dan `--remote-components ejs:github`) aktif otomatis bila versi yt-dlp cukup baru, jadi tidak perlu mengatur variabel apa pun di Termux.
- Di Termux (IP rumahan) cookies YouTube biasanya tidak diperlukan.
- `.getsession` memakai perintah `tar`, yang sudah ada di Termux. Bila belum, pasang dengan `pkg install tar`.

### 3.7 Memperbarui kode

```bash
cd ~/Hc-bot-master_v2
git pull origin mf
yarn install        # bila package.json berubah
```

---

## 4. Deploy di Railway

1. Hubungkan repo GitHub ke Railway. Railway memakai `Dockerfile` (Node LTS + git, ruby, ffmpeg, imagemagick, python3).
2. Di tab **Variables** tambahkan `PHONE_NUMBER` (nomor bot, contoh `628xxxxxxxxxx`). Kode pairing akan muncul di **Deploy Logs**.
3. Setelah tersambung, jangan lupa memasang **Volume** (lihat 4.1).
4. Variabel baru di Railway berstatus **draft** sampai Anda menekan tombol **Deploy** / **Apply changes** di bagian atas. Tanpa itu variabel tidak berlaku.

### 4.1 Volume (penting)

Sistem file di Railway **kembali kosong setiap deploy ulang**, kecuali ada Volume. Folder `database/` berisi data user, sesi jadibot, cookies YouTube, dan API key. Pasang Volume dengan **mount path** `/app/database` supaya data itu tetap ada.

Catatan: folder `sessions/` (login bot utama) berada di luar `database/`. Tanpa penyimpanan permanen untuk folder itu, login bot utama perlu pairing ulang setiap deploy (kode pairing muncul lagi di Deploy Logs karena `PHONE_NUMBER` sudah terisi). Periksa batas Volume pada paket Railway Anda.

Tanpa Volume, setelah **setiap deploy** Anda harus:
- mengirim ulang `.setytcookies`,
- mengirim ulang `.setsavenow` dan `.setremovebg` (atau memakai variabel lingkungan),
- membuat ulang jadibot (sesinya ikut hilang).

---

## 5. Variabel lingkungan

| Variabel | Fungsi |
|---|---|
| `PHONE_NUMBER` | Nomor bot untuk kode pairing tanpa prompt (Railway) |
| `YT_COOKIES` | Isi `cookies.txt` YouTube (format Netscape), cadangan bila file cookies tidak ada |
| `YT_COOKIES_FILE` | Path ke file `cookies.txt` |
| `YT_PROXY` | Proxy untuk yt-dlp, mis. `http://user:pass@host:port` |
| `YT_JS_RUNTIME` | Runtime JavaScript untuk yt-dlp. **Aktif otomatis (`node`)** bila yt-dlp versi 2025.11.12 atau lebih baru. Isi nilai lain untuk menimpa, atau `off` untuk mematikan |
| `YT_REMOTE_COMPONENTS` | Komponen tambahan yt-dlp. **Aktif otomatis (`ejs:github`)** bila yt-dlp mendukung. Isi `off` untuk mematikan |
| `YT_DEBUG` | `1` = tampilkan peringatan yt-dlp di log (untuk mencari penyebab error) |
| `YT_AUTO_UPDATE` | `0` = matikan pembaruan otomatis yt-dlp saat bot menyala |
| `SAVENOW_API_KEY` | API key SaveNow (jalur cadangan unduhan YouTube) |
| `SAVENOW_VIDEO_FORMAT` | Resolusi video untuk jalur cadangan, bawaan `480` |
| `SAVENOW_BASE` | Alamat dasar API SaveNow (biasanya tidak perlu diubah) |
| `PORT` / `SERVER_PORT` | Port server bila platform menyediakannya |

`.ytmp3` dan `.ytmp4` sudah terbukti berfungsi di **Railway** (dengan cookies YouTube dari `.setytcookies`) dan di **Termux**. Opsi JavaScript yt-dlp sekarang aktif otomatis, jadi `YT_JS_RUNTIME` dan `YT_REMOTE_COMPONENTS` tidak wajib diisi lagi. Keduanya hanya dipakai untuk menimpa nilai bawaan atau mematikannya. `YT_DEBUG=1` boleh dimatikan setelah semuanya stabil.

---

## 6. Menyimpan rahasia lewat command (khusus owner)

Command ini hanya bisa dipakai nomor di `ownerNumber`. Pesan yang berisi rahasia akan dihapus otomatis oleh bot bila memungkinkan.

| Command | Fungsi | Tersimpan di |
|---|---|---|
| `.setgemini <key>` | API key Gemini untuk `.ai` | `settings.js` (baris `settings.APIKeys`) |
| `.setremovebg <key>` | API key remove.bg untuk `.removebg` | `database/apikey_removebg.json` |
| `.setsavenow <key>` | API key SaveNow (cadangan YouTube) | `database/apikey_savenow.json` |
| `.setytcookies <isi cookies>` | Cookies YouTube | `database/yt-cookies.txt` |
| `.updateytdlp` | Perbarui yt-dlp lalu tampilkan versinya (`stable` untuk versi stabil) | binary di `node_modules` |

Catatan:
- `.setgemini` menulis key polos ke `settings.js`. **Jangan commit `settings.js` setelah key terisi.** Cek juga bahwa nama model Gemini di `Hc.js` masih valid bila `.ai` gagal.
- Cookies YouTube bisa dikirim sebagai pesan biasa, atau tempel dulu lalu **balas** pesan itu dengan `.setytcookies`. WhatsApp kadang mengubah TAB jadi spasi, dan bot memperbaikinya otomatis. Bot menolak isi yang bukan cookies YouTube atau tidak memuat cookies login.

### 6.1 Cara mengekspor cookies YouTube dari HP

1. Pakai **akun YouTube cadangan**, bukan akun utama.
2. Pasang **Firefox** (Android) lalu ekstensi **cookies.txt** (addons.mozilla.org/addon/cookies-txt). Chrome di Android tidak mendukung ekstensi.
3. Di pengaturan ekstensi, nyalakan **Run in private tabs**.
4. Buka **tab pribadi**, login YouTube, lalu buka `https://www.youtube.com/robots.txt` di tab yang sama.
5. Buka menu ⋮ → **Add-ons** → **cookies.txt** → pilih **Current Site → Copy**.
6. Tutup semua tab pribadi.
7. Kirim ke bot: `.setytcookies <tempel isinya>`. Bot membalas jumlah cookies yang tersimpan.
8. Hapus pesan itu dari riwayat chat bila bot tidak menghapusnya otomatis.

Isi yang benar diawali `# Netscape HTTP Cookie File` dan memuat nama seperti `SID`, `SAPISID`, `__Secure-3PSID`, dan `LOGIN_INFO`. Cookies adalah kunci masuk ke akun, jadi **jangan dikirim ke siapa pun**. Cookies bisa kedaluwarsa, ulangi langkah di atas bila nanti `.ytmp3` kembali diblokir.

---

## 7. Manajemen database dan sesi (khusus owner)

Semua command di bagian ini **hanya bisa dipakai owner** dan **hanya di Bot Utama** (jadibot menolaknya). Setiap command punya fungsi sendiri.

| Command | Fungsi |
|---|---|
| `.backup` | Kirim file cadangan database (`Backup_DB_<tanggal>.json`) ke chat saat itu juga |
| `.database` | Tampilkan ringkasan database: jenis penyimpanan (JSON atau MongoDB), jumlah user dan grup, ukuran, waktu terakhir disimpan, reset limit terakhir, dan status auto backup |
| `.autobackup <jam>` | Aktifkan atau ubah interval auto backup (angka 1 sampai 168). Tanpa angka, menampilkan status |
| `.delautobackup` | Matikan auto backup |
| `.session` | Info sesi bot utama (nomor, status login, jumlah dan ukuran file) dan daftar jadibot (aktif atau tidak) |
| `.getsession` | Kirim arsip `.tar.gz` sesi **bot utama** |
| `.getsession <nomor>` | Kirim arsip sesi **satu jadibot** |
| `.deletesession` | Hapus sesi bot utama. Perlu konfirmasi: `.deletesession ya` |
| `.deletesession <nomor>` | Hapus dan hentikan sesi satu jadibot |
| `.deletesampah` | Hapus isi `database/temp`, file `.tmp`, dan `.corrupt-*` di folder database |

Catatan penting:

- **Auto backup**: bawaannya aktif setiap 6 jam dan dikirim ke nomor pertama di `ownerNumber`. Pengaturan dari `.autobackup` dan `.delautobackup` tersimpan di database (`db.autoBackup`), jadi bertahan setelah restart. Hanya ada satu timer walau bot reconnect.
- **`.getsession` mengirim kunci login WhatsApp.** Siapa pun yang memegang arsipnya bisa mengambil alih nomor itu. Perintah ini hanya jalan di chat pribadi. Simpan arsipnya, lalu hapus pesannya dari chat.
- **`.deletesession` (tanpa nomor)** menghapus folder `sessions/`, lalu proses keluar dengan kode 1 sehingga `main.js` memuat ulang bot dan meminta **pairing ulang**. Di Railway, kode pairing muncul di Deploy Logs. Perangkat bot di WhatsApp tetap perlu dikeluarkan manual lewat **Perangkat tertaut**.
- **`.deletesampah`** tidak menyentuh `sessions/`, `database.json`, file `.bak`, maupun `database/jadibot/`. File yang berumur kurang dari 2 menit dilewati karena bisa sedang dipakai unduhan atau konversi.
- Data pada `.database` untuk MongoDB hanya menampilkan data di memori. Backup selalu berasal dari data yang sedang aktif di memori.

---

## 8. Fitur penting

### 8.1 Downloader YouTube (`.ytmp3`, `.ytmp4`)

- Bot mencoba **yt-dlp** lebih dulu (dengan cookies bila tersedia).
- Bila gagal karena blokir anti-bot YouTube dan API key SaveNow tersedia, bot memakai jalur cadangan SaveNow dan memberi tahu "mencoba jalur cadangan".
- Server di datacenter (Railway dan sejenisnya) sering diblokir YouTube, sehingga perlu cookies. Di Termux (IP rumahan) biasanya tidak perlu cookies.
- Opsi JavaScript yt-dlp aktif otomatis, dan yt-dlp diperbarui otomatis saat bot menyala. Gunakan `.updateytdlp` untuk memperbarui manual.
- Unduhan YouTube dapat melanggar ketentuan layanan YouTube. Pakai untuk keperluan pribadi.

### 8.2 Jadibot (`.jadibot <nomor>`)

- Menjadikan nomor lain sebagai bot dengan kode pairing (nomor harus diawali kode negara, mis. `62...`).
- Sesi tersimpan di `database/jadibot/<nomor>/`.
- Saat bot utama dinyalakan ulang, semua jadibot yang sesinya terdaftar **tersambung kembali otomatis** (`restoreJadibots`), dengan jeda 3 detik per sesi.
- Sesi hanya dihapus bila WhatsApp benar-benar mengeluarkan perangkat atau pairing tidak selesai.
- Untuk melihat, mengarsipkan, atau menghapus sesi jadibot, pakai `.session`, `.getsession <nomor>`, dan `.deletesession <nomor>`.
- Saat ada yang pairing, bot bisa terasa lag beberapa menit karena sinkronisasi awal WhatsApp. Itu normal.
- Command ini belum dibatasi hanya untuk owner. Pertimbangkan membatasinya, karena tiap jadibot membuka koneksi baru dan memakai RAM.

### 8.3 Konversi media

- `.toaudio`, `.togif`, stiker, dan sejenisnya memakai `ffmpeg` lewat `lib/converter.js`.
- File sementara ditulis ke `database/temp/`.
- Konversi webp ke mp4 memakai Ezgif (`lib/uploader.js`), yang bergantung pada situs itu dan bisa gagal kapan saja.

### 8.4 Interval otomatis (di `index.js`)

- Backup database ke nomor owner (bawaan setiap 6 jam, bisa diatur lewat `.autobackup` dan dimatikan lewat `.delautobackup`).
- Reset limit harian sekali per tanggal (tercatat di `db.lastLimitReset`).
- Keduanya hanya dibuat sekali walau bot reconnect.

---

## 9. Keamanan dan `.gitignore`

Isi `.gitignore` yang dianjurkan:

```
node_modules/
sessions/
.env
*.log

# Rahasia dan data bot: jangan pernah di-push ke GitHub
database/jadibot/
database/yt-cookies.txt
database/apikey_*.json
database/database.json
database/*.bak
database/*.tmp
database/*.corrupt-*
```

Sebelum `git push`, periksa apakah ada file rahasia yang sudah terlacak:

```bash
git ls-files | grep -E "yt-cookies|apikey_|database.json|jadibot|sessions"
```

Bila ada hasilnya, hentikan pelacakannya (file di perangkat tidak terhapus):

```bash
git rm --cached <nama_file>
```

Bila rahasia sempat ter-push ke repo publik, anggap sudah bocor: keluarkan perangkat bot di WhatsApp (**Perangkat tertaut**), buat ulang API key, dan ganti sesi cookies.

---

## 10. Alur kerja saat mengubah kode

1. Edit file.
2. Cek sintaks sebelum push (di Termux):
   ```bash
   node --check Hc.js && node --check index.js && echo OK
   ```
3. Commit dan push ke GitHub.
4. Railway melakukan deploy otomatis. Tunggu sampai status **Active**.
5. Setelah deploy: kirim ulang `.setytcookies` (bila tanpa Volume), lalu uji `.tes`, `.ytmp3`, `.ytmp4`.

Tip: salin file lewat file manager atau fitur **Upload files** di GitHub. Menempel kode dari chat ke editor ponsel pernah menghilangkan tanda kutip dan menyebabkan error.

---

## 11. Pemecahan masalah

| Pesan error | Penyebab | Solusi |
|---|---|---|
| `ERR_MODULE_NOT_FOUND ... lib/jadibot.js` | File modul belum ada di folder `lib/` | Salin file yang hilang ke `lib/` |
| `does not provide an export named 'default'` (`file-type`) | `file-type` v22 hanya punya named export | Pakai `import { fileTypeFromFile } from 'file-type'` |
| `Identifier '...' has already been declared` | Import ganda di satu file (hasil menempel kode) | Hapus import yang dobel |
| `Duplicate export` | Fungsi diekspor dua kali | Ekspor sekali saja |
| `ENOENT ... lib/..database/temp/...` | Path salah (`..database`, tanpa garis miring) | Pakai `../database/temp` (sudah diperbaiki di `converter.js`) |
| `SyntaxError: Invalid or unexpected token` pada baris import | Tanda kutip penutup atau titik koma hilang | Lengkapi baris itu, lalu `node --check` |
| `Sign in to confirm you're not a bot` | YouTube memblokir IP server | Kirim `.setytcookies`, atau pakai SaveNow / proxy / jalankan di Termux |
| `Requested format is not available` | yt-dlp tidak menjalankan JavaScript YouTube (perintah di log tidak memuat `--js-runtimes`) | Pakai `lib/ytdlp-opts.js` terbaru (opsi aktif otomatis) dan kirim `.updateytdlp`. Cara darurat: `export YT_JS_RUNTIME=node YT_REMOTE_COMPONENTS=ejs:github` sebelum menjalankan bot |
| `The page needs to be reloaded` | yt-dlp versi lama | Kirim `.updateytdlp` |
| Perintah di log tidak memuat `--cookies` | Cookies hilang setelah deploy, atau `ytmp4.js` lama | Kirim ulang `.setytcookies`; pastikan `lib/ytmp4.js` terbaru |
| Jadibot logout setelah restart | Sesi tidak dipulihkan, atau folder hilang di Railway | Pakai `lib/jadibot.js` terbaru dan Volume `/app/database` |
| Variabel Railway tidak berlaku | Masih draft | Tekan **Deploy** / **Apply changes** |
| `.setgemini` tampak berhasil tapi hilang saat restart | Pola penggantian tidak cocok dengan bentuk string `APIKeys` | Gunakan `Hc.js` terbaru |
| Log Termux penuh pesan `@newsletter` | Kiriman saluran WhatsApp ikut dicetak | Bisa difilter di `index.js` bila mengganggu |
| `.getsession` gagal membuat arsip | Perintah `tar` tidak tersedia | Di Termux: `pkg install tar` |
| Bot minta pairing ulang setelah `.deletesession` | Memang disengaja: sesi bot utama sudah dihapus | Masukkan kode pairing baru, atau di Railway lihat kode di Deploy Logs |

---

## 12. Daftar command pengelolaan

```
.menu              daftar fitur
.tes               cek bot hidup dan lama aktif
.jadibot <nomor>   jadikan nomor lain sebagai bot
.setgemini         simpan API key Gemini        (owner)
.setremovebg       simpan API key remove.bg     (owner)
.setsavenow        simpan API key SaveNow       (owner)
.setytcookies      simpan cookies YouTube       (owner)
.updateytdlp       perbarui yt-dlp              (owner)

.backup            kirim cadangan database sekarang      (owner)
.database          info ringkas database                 (owner)
.autobackup <jam>  aktifkan/ubah interval auto backup    (owner)
.delautobackup     matikan auto backup                   (owner)
.session           info sesi bot utama dan jadibot       (owner)
.getsession [nomor] kirim arsip sesi                     (owner, chat pribadi)
.deletesession [nomor|ya] hapus sesi                     (owner)
.deletesampah      bersihkan file sampah                 (owner)
```
