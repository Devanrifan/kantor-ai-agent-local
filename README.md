# Kantor AI

Kantor isometrik 3D berisi 23 karyawan AI untuk digital agency. Klik karakter, lalu ngobrol langsung dengan orangnya.

**Isi kantor** (satu ruangan per divisi):

| Divisi | Tim |
|---|---|
| Proposal Writer | Rina (leader), Bagas, Siti, Dimas |
| Ads Copywriter | Putri (leader), Fajar, Anisa, Yoga |
| Social Media | Dewi (leader), Raka, Nadia, Eko |
| Web QA | Hendra (leader), Laras, Andi, Maya |
| Developer Helper | Arief (leader), Citra, Bayu, Tari |
| Reporting | Kirana |
| Account Manager | Rizky |
| Finance | Melati |

Leader pakai model yang lebih pintar (Sonnet), anggota tim pakai model yang lebih murah (Haiku). Semua agent hanya membuat **draft**, tidak mengirim apa pun ke klien.

**Bisa jalan gratis di komputer sendiri** tanpa API key, memakai model lokal Qwen3 lewat llama.cpp (lihat [bab 4](#4-model-lokal-gratis-qwen3-via-llamacpp)). Leader juga bisa **mendelegasikan tugas ke anggota timnya** ([bab 5](#5-delegasi-tugas-leader-ke-tim)).

**Teknologi:** Node.js + Express (backend, Anthropic SDK atau model lokal OpenAI-compatible), JavaScript biasa + Three.js (frontend), Vite (dev server dan build). Tanpa database.

## Daftar isi

1. [Persiapan](#1-persiapan)
2. [Install di Windows (lokal)](#2-install-di-windows-lokal)
3. [Install di MacBook (lokal)](#3-install-di-macbook-lokal)
4. [Model lokal gratis (Qwen3 via llama.cpp)](#4-model-lokal-gratis-qwen3-via-llamacpp)
5. [Delegasi tugas leader ke tim](#5-delegasi-tugas-leader-ke-tim)
6. [Install di VPS (domainkamu.com)](#6-install-di-vps-domainkamucom)
7. [Keamanan dan biaya](#7-keamanan-dan-biaya)
8. [Mengubah karyawan](#8-mengubah-karyawan)
9. [Struktur project](#9-struktur-project)
10. [Follow for support](#follow-for-support)

> Ganti `domainkamu.com` di seluruh panduan ini dengan domain milikmu sendiri.

---

## 1. Persiapan

**Yang dibutuhkan**

- **Node.js 20 atau lebih baru** (disarankan versi LTS terbaru).
- **Folder project** `kantor-ai` (hasil clone atau extract).
- **API key Anthropic** (opsional untuk tes tampilan, wajib untuk jawaban sungguhan). Buat di https://console.anthropic.com

**Mode demo vs mode live**

| Mode | Penjelasan |
|---|---|
| Demo | `ANTHROPIC_API_KEY` kosong. Jawaban berupa contoh, gratis. Cocok untuk tes tampilan. |
| Live (Claude) | `ANTHROPIC_API_KEY` terisi. Jawaban sungguhan dari Claude, dikenai biaya API. |
| Live (lokal) | `MODEL_LEADER` / `MODEL_TEAM` diawali `local:` dan model lokal menyala. Gratis, tanpa API key. Lihat [bab 4](#4-model-lokal-gratis-qwen3-via-llamacpp). |

**Variabel di file `.env`**

Salin `.env.example` menjadi `.env`, lalu isi sesuai kebutuhan.

| Variabel | Default | Fungsi |
|---|---|---|
| `ANTHROPIC_API_KEY` | (kosong) | API key. Kosong = mode demo. |
| `ACCESS_CODE` | (kosong) | Kode yang harus dimasukkan pengunjung. **Wajib diisi kalau situs publik.** |
| `PORT` | `3001` | Port server backend. |
| `MODEL_LEADER` | `claude-sonnet-5-5` | Model untuk leader divisi. Awali `local:` untuk model lokal, mis. `local:qwen3-4b`. |
| `MODEL_TEAM` | `claude-haiku-4-5-20251001` | Model untuk anggota tim. Boleh dicampur: leader Claude, tim lokal. |
| `MAX_TOKENS` | `1500` | Panjang maksimal jawaban. Untuk model lokal di CPU, pakai `350`-`700`. |
| `LOCAL_LLM_URL` | `http://127.0.0.1:8080/v1` | Alamat server model lokal (llama-server / LM Studio / Ollama). |
| `LOCAL_NO_THINK` | `1` | `1` = matikan mode thinking Qwen3. **Isi `0` untuk Qwen3-4B-Instruct-2507.** |
| `RATE_PER_MINUTE` | `15` | Batas request per IP per menit. |
| `DAILY_MAX_REQUESTS` | `300` | Batas total request per hari (jam Jakarta). |

**Soal `ACCESS_CODE`:** kode ini kamu bikin sendiri, bukan dapat dari mana-mana. Tulis kode apa saja setelah tanda `=`, misalnya `ACCESS_CODE=kantorku-2026-xyz`. Pakai kombinasi huruf, angka, dan tanda hubung, minimal 12 karakter. Untuk kode acak:

```bash
node -e "console.log(require('crypto').randomBytes(12).toString('hex'))"
```

> **Penting:** jangan pernah membagikan atau meng-commit file `.env`. Isinya API key pribadi. File ini sudah masuk `.gitignore`.

---

## 2. Install di Windows (lokal)

Cocok untuk mencoba atau mengembangkan di laptop Windows 10/11. Hasil akhirnya bisa dibuka di http://localhost:5173.

**Langkah 1: Install Node.js**

1. Buka https://nodejs.org, unduh installer versi LTS (Windows Installer `.msi`).
2. Jalankan installer, klik Next sampai selesai dengan pengaturan bawaan.
3. Atau lewat terminal: `winget install -e --id OpenJS.NodeJS.LTS`. Tutup lalu buka terminal baru, lalu cek versinya:

```powershell
node -v
npm -v
```

Pastikan `node -v` menampilkan v20 atau lebih tinggi.

**Langkah 2: Ambil project**

Pakai Git:

```powershell
git clone https://github.com/Devanrifan/kantor-ai-agent-local.git
cd kantor-ai-agent-local
```

Atau extract file ZIP ke folder seperti `C:\Projects\kantor-ai`. Hindari folder yang dilindungi seperti Program Files.

**Langkah 3: Install dependency**

```powershell
npm install
```

**Langkah 4: Buat file `.env`**

```powershell
copy .env.example .env
notepad .env
```

Di Notepad, isi `ANTHROPIC_API_KEY` (kosongkan untuk mode demo), simpan, lalu tutup.

**Langkah 5: Jalankan**

```powershell
npm run dev
```

Buka browser ke http://localhost:5173. Untuk berhenti, tekan `Ctrl + C` di PowerShell.

**Kendala umum di Windows**

| Masalah | Solusi |
|---|---|
| `"npm" is not recognized` | Tutup dan buka ulang PowerShell. Kalau masih gagal, install ulang Node.js. |
| `npm.ps1 cannot be loaded` (execution policy) | Pakai `cmd` (ketik `cmd` di address bar folder), atau `npm.cmd run dev`, atau jalankan sekali: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| Port 5173 atau 3001 sudah dipakai | Tutup aplikasi lain yang memakai port itu, atau ubah `PORT` di `.env`. |
| Perubahan `.env` tidak terbaca | Hentikan (`Ctrl + C`) lalu jalankan `npm run dev` lagi. |

---

## 3. Install di MacBook (lokal)

Berlaku untuk MacBook Intel maupun Apple Silicon (M1/M2/M3/M4). Hasil akhirnya bisa dibuka di http://localhost:5173.

**Langkah 1: Install Node.js**

- **Opsi A (paling mudah):** unduh installer macOS (`.pkg`) versi LTS dari https://nodejs.org, lalu jalankan.
- **Opsi B (via Homebrew):** buka Terminal, lalu jalankan:

```bash
brew install node
```

Cek versinya, pastikan v20 atau lebih tinggi:

```bash
node -v
npm -v
```

**Langkah 2: Ambil project**

Pakai Git:

```bash
git clone https://github.com/Devanrifan/kantor-ai-agent-local.git
cd kantor-ai-agent-local
```

Atau klik dua kali file ZIP di Finder, lalu pindahkan foldernya ke lokasi yang mudah, misalnya `~/Projects/kantor-ai`.

**Langkah 3: Install dependency**

```bash
npm install
```

**Langkah 4: Buat file `.env`**

```bash
cp .env.example .env
nano .env
```

Isi `ANTHROPIC_API_KEY` (kosongkan untuk mode demo). Di nano: `Ctrl + O` lalu Enter untuk menyimpan, `Ctrl + X` untuk keluar.

**Langkah 5: Jalankan**

```bash
npm run dev
```

Buka Safari atau Chrome ke http://localhost:5173. Untuk berhenti, tekan `Control + C` di Terminal.

**Kendala umum di Mac**

| Masalah | Solusi |
|---|---|
| `command not found: brew` | Pakai Opsi A (installer `.pkg`), atau install Homebrew dari https://brew.sh |
| `EACCES` / permission denied saat `npm install` | Pastikan folder project ada di folder milikmu (bukan folder sistem). Jangan pakai `sudo` untuk `npm install`. |
| Port 5173 atau 3001 sudah dipakai | Tutup proses lain yang memakai port itu, atau ubah `PORT` di `.env`. |
| `.env` tidak kelihatan di Finder | Tekan `Command + Shift + titik`. |
| `code .` tidak dikenali | Di VS Code tekan `Cmd + Shift + P`, jalankan **Shell Command: Install 'code' command in PATH**. |

---

## 4. Model lokal gratis (Qwen3 via llama.cpp)

Jalankan Kantor AI **tanpa API key dan tanpa biaya** memakai model yang berjalan di komputermu sendiri. Ada tiga program yang menyala bersamaan:

```
[1] llama-server + Qwen3  (port 8080)   <-  model AI
[2] Kantor AI server      (port 3001)   <-  npm run dev
[3] Browser               (localhost:5173)
```

**Kebutuhan:** RAM 8 GB (model 4B) atau 16 GB (model 8B), disk kosong sekitar 6-10 GB, Node.js 20+.

> Server model hanya mendengarkan di `127.0.0.1` (komputer sendiri). Jangan membukanya ke jaringan tanpa firewall dan API key.

### 4.1 Install Node.js

Windows (PowerShell atau cmd):

```powershell
winget install -e --id OpenJS.NodeJS.LTS
```

Mac: unduh installer LTS dari https://nodejs.org, atau `brew install node`.

**Tutup terminal lalu buka yang baru**, kemudian cek:

```bash
node -v
npm -v

node -e "console.log('Node.js berhasil!')"
```

### 4.2 Download llama.cpp

Buka https://github.com/ggml-org/llama.cpp/releases lalu unduh zip terbaru:

| Sistem | File |
|---|---|
| Windows | `win-cpu-x64` (bukan cuda/vulkan/arm) |
| Mac Intel | `macos-x64` |
| Mac Apple Silicon | `macos-arm64` |

Ekstrak ke folder tanpa spasi, mis. `C:\ai-lokal` atau `~/ai-lokal`. Biarkan semua file `.exe` dan `.dll` tetap satu folder. Mac juga bisa lewat `brew install llama.cpp`.

> Jangan pakai llamafile di Windows. Sering gagal dengan error "unsupported 16-bit application".

### 4.3 Download model

Unduh file `.gguf` dari Hugging Face lalu taruh di folder yang sama dengan `llama-server`:

| Model | Repo | Ukuran | Cocok untuk |
|---|---|---|---|
| Qwen3 4B Instruct 2507 (**disarankan, lebih cepat**) | https://huggingface.co/bartowski/Qwen_Qwen3-4B-Instruct-2507-GGUF | sekitar 2,5 GB | RAM 8 GB, CPU biasa |
| Qwen3 8B | https://huggingface.co/bartowski/Qwen_Qwen3-8B-GGUF | sekitar 5 GB | RAM 16 GB, lebih pintar tapi lebih lambat |

File yang dipilih: `Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf`. Cocokkan nama persisnya di halaman Hugging Face (tab Files and versions).

### 4.4 Jalankan model

Buka terminal **di folder model** (Windows: buka folder di Explorer, klik address bar, ketik `cmd`, Enter), lalu:

```bash
llama-server.exe -m Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf --port 8080 -c 4096 -np 1 -t 6
```

Mac / Linux:

```bash
./llama-server -m Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf --port 8080 -c 4096 -np 1 -t 6
```

| Opsi | Arti |
|---|---|
| `-m` | File model |
| `--port 8080` | Port server model |
| `-c 4096` | Panjang konteks. Naikkan ke 8192 kalau RAM lega |
| `-np 1` | Satu slot saja (hemat memori untuk pemakaian sendiri) |
| `-t 6` | Jumlah thread CPU. Samakan dengan jumlah core |

Tunggu sampai muncul `listening on http://127.0.0.1:8080`, lalu **biarkan jendela ini tetap terbuka**. Cek di browser: http://127.0.0.1:8080

Mac: kalau muncul peringatan developer tidak terverifikasi, jalankan `xattr -dr com.apple.quarantine .` di folder model.

### 4.5 Arahkan Kantor AI ke model lokal

Isi `.env` di folder project (`ANTHROPIC_API_KEY` boleh kosong):

```dotenv
MODEL_LEADER=local:qwen3-4b
MODEL_TEAM=local:qwen3-4b
LOCAL_LLM_URL=http://127.0.0.1:8080/v1
LOCAL_NO_THINK=0
MAX_TOKENS=350
```

> Nama file harus persis `.env` (pakai titik di depan), bukan `env` atau `.env.txt`.

Lalu di folder project, di terminal lain:

```bash
npm install
npm run dev
```

Pastikan di terminal muncul `Mode: LIVE  leader=local:qwen3-4b ... (model lokal: http://127.0.0.1:8080/v1)`, lalu buka http://localhost:5173. Kalau masih tertulis `Mode: DEMO`, cek lagi nama dan isi `.env`, lalu restart `npm run dev` (file `.env` hanya dibaca saat server start).

**Pakai Qwen3 8B?** Ganti nama file di perintah `llama-server`, set `local:qwen3-8b`, dan `LOCAL_NO_THINK=1`.

**Pakai LM Studio atau Ollama?** Nyalakan server lokalnya, lalu ubah `LOCAL_LLM_URL` menjadi `http://127.0.0.1:1234/v1` (LM Studio) atau `http://127.0.0.1:11434/v1` (Ollama), dan sesuaikan nama model setelah `local:`.

**Campur Claude dan lokal:** isi `ANTHROPIC_API_KEY`, set `MODEL_LEADER=claude-sonnet-5-5` dan `MODEL_TEAM=local:qwen3-4b`.

### 4.6 Urutan pemakaian sehari-hari

| Urutan | Terminal | Perintah |
|---|---|---|
| 1 | Folder model | `llama-server.exe -m Qwen_Qwen3-4B-Instruct-2507-Q4_K_M.gguf --port 8080 -c 4096 -np 1 -t 6` |
| 2 | Folder project | `npm run dev` |
| 3 | Browser | http://localhost:5173 |
| Selesai | Kedua terminal | `Ctrl + C` |

### 4.7 Kendala model lokal

| Masalah | Solusi |
|---|---|
| Masih tulisan "Mode demo" | `.env` salah nama (harus `.env`), model belum diawali `local:`, atau server belum direstart |
| `llama-server.exe is not recognized` | Terminal tidak berada di folder model. Buka folder di Explorer lalu ketik `cmd` di address bar. PowerShell: pakai `.\llama-server.exe` |
| Server model lokal tidak bisa dihubungi | `llama-server` belum jalan atau port/`LOCAL_LLM_URL` tidak cocok |
| Sangat lambat | Pakai model 4B, `MAX_TOKENS=350`, `-c 4096`, tutup aplikasi berat. Pesan pertama selalu paling lama (membaca prompt). Mulai chat baru kalau riwayat sudah panjang |
| Jawaban berisi teks aneh `/no_think` | Set `LOCAL_NO_THINK=0` untuk Qwen3-4B-Instruct-2507 |
| `npm.ps1 cannot be loaded` | Pakai `cmd` atau `npm.cmd run dev` (lihat bab 2) |
| Port 8080 dipakai | Jalankan dengan `--port 8081` dan ubah `LOCAL_LLM_URL` ke `:8081` |

Kecepatan realistis di CPU 6 core: sekitar 8-15 token per detik untuk model 4B. Hasil model lokal cocok untuk draf dan ide; tetap cek sebelum dipakai ke klien.

---

## 5. Delegasi tugas leader ke tim

Leader divisi (Rina, Putri, Dewi, Hendra, Arief) bisa membagi tugas ke anggota timnya. Tulis kata **"delegasikan"** di pesan ke leader:

> Delegasikan: bikin proposal website toko Shopify untuk klien F&B

Alurnya:

1. Leader memecah permintaan menjadi maksimal 3 tugas dan memilih anggota yang relevan.
2. Tiap anggota mengerjakan tugasnya (tampil berurutan di chat).
3. Leader mereview hasilnya (bagus, lemah, perbaikan) lalu menulis versi final.

Kata pemicu lain: `/tim`, "suruh tim", "minta tim", "tugasin ke tim", "libatkan tim". Tanpa kata itu, leader menjawab seperti biasa.

Catatan: satu permintaan delegasi memanggil model sekitar 5 kali, jadi lebih lama (di model lokal bisa beberapa menit) dan lebih banyak token kalau memakai Claude. Kalau model gagal membuat rencana yang valid, leader mengerjakan sendiri. Logika ada di `server/delegate.js`.

---

## 6. Install di VPS (domainkamu.com)

Frontend dan backend berjalan dari satu server Node. Contoh di bawah untuk Ubuntu 22.04 atau 24.04, dengan alamat akhir `https://office.domainkamu.com` (subdomain boleh diganti sesukamu).

> **Sebelum mulai:** siapkan akses SSH ke VPS, akses pengaturan DNS domain, dan API key Anthropic.

**Langkah 1: Arahkan DNS**

Di pengaturan DNS `domainkamu.com`, buat A record untuk subdomain `office` yang mengarah ke IP VPS. Tunggu beberapa menit sampai aktif (propagasi).

| Type | Name | Value |
|---|---|---|
| A | `office` | IP publik VPS kamu |

**Langkah 2: Install Node.js, nginx, dan pm2**

Masuk ke VPS lewat SSH, lalu jalankan:

```bash
sudo apt update && sudo apt install -y nginx git curl unzip
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v
```

**Langkah 3: Upload project**

Cara termudah, lewat Git:

```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/Devanrifan/kantor-ai-agent-local.git kantor-ai
```

Kalau repo private, VPS akan meminta login GitHub (pakai Personal Access Token sebagai password), atau gunakan SSH key.

Alternatif lewat ZIP, dari komputer lokal:

```bash
scp kantor-ai.zip user@IP_VPS:/tmp/
```

Lalu di VPS:

```bash
sudo mkdir -p /var/www
sudo unzip /tmp/kantor-ai.zip -d /var/www/
sudo rm -rf /var/www/__MACOSX
sudo chown -R $USER:$USER /var/www/kantor-ai
```

**Langkah 4: Install, build, dan isi `.env`**

```bash
cd /var/www/kantor-ai
npm install
npm run build
cp .env.example .env
nano .env
```

Isi minimal dua baris ini:

```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
ACCESS_CODE=kode-rahasia-yang-susah-ditebak
```

> **Wajib:** `ACCESS_CODE` harus diisi sebelum situs bisa diakses publik. Tanpa itu, siapa pun yang tahu link bisa memakai API key kamu.

**Langkah 5: Jalankan dengan pm2**

```bash
pm2 start server/index.js --name kantor-ai
pm2 save
pm2 startup
```

Perintah `pm2 startup` akan mencetak satu baris perintah. Salin dan jalankan baris itu agar aplikasi otomatis hidup lagi setelah VPS restart. Cek statusnya:

```bash
pm2 status
pm2 logs kantor-ai
```

Di log seharusnya tampil `Mode: LIVE` bila API key sudah terbaca.

**Langkah 6: Konfigurasi nginx**

Buat file konfigurasi:

```bash
sudo nano /etc/nginx/sites-available/kantor-ai
```

Isi dengan:

```nginx
server {
  server_name office.domainkamu.com;

  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # chat streaming: jangan di-buffer
  location /api/chat {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_buffering off;
    proxy_read_timeout 120s;
  }
}
```

Aktifkan dan muat ulang nginx:

```bash
sudo ln -s /etc/nginx/sites-available/kantor-ai /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Langkah 7: Pasang HTTPS (SSL gratis)**

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d office.domainkamu.com
```

Ikuti petunjuk di layar. Setelah selesai, buka `https://office.domainkamu.com` dan masukkan kode akses.

**Firewall (disarankan)**

```bash
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"
sudo ufw enable
```

**Update di kemudian hari**

```bash
cd /var/www/kantor-ai
git pull && npm install && npm run build && pm2 restart kantor-ai
```

Kalau memakai ZIP, upload dan extract versi baru (jangan timpa file `.env`), lalu jalankan `npm install && npm run build && pm2 restart kantor-ai`.

**Kendala umum di VPS**

| Masalah | Solusi |
|---|---|
| 502 Bad Gateway | Aplikasi belum jalan. Cek `pm2 status` dan `pm2 logs kantor-ai`. |
| Halaman putih / file tidak ditemukan | Jalankan `npm run build` lagi, lalu `pm2 restart kantor-ai`. |
| Certbot gagal | Pastikan A record sudah mengarah ke IP VPS dan port 80/443 terbuka. |
| Jawaban chat muncul sekaligus, tidak mengalir | Pastikan blok `location /api/chat` di nginx memakai `proxy_buffering off`. |
| Mode masih DEMO | `ANTHROPIC_API_KEY` belum terbaca. Cek `.env` lalu `pm2 restart kantor-ai`. |

---

## 7. Keamanan dan biaya

- **Wajib isi `ACCESS_CODE`** kalau situs bisa diakses publik.
- API key hanya tersimpan di server (`.env`), tidak pernah dikirim ke browser.
- Pengaman bawaan: `RATE_PER_MINUTE` (batas per IP), `DAILY_MAX_REQUESTS` (batas total per hari, jam Jakarta), dan `MAX_TOKENS` (panjang jawaban).
- Pasang juga **batas pengeluaran bulanan** di Console Anthropic.
- Pemakaian token tiap chat tercatat di log (`pm2 logs kantor-ai`).
- Semua karyawan AI hanya membuat draft. Tidak ada yang mengirim apa pun ke klien.

---

## 8. Mengubah karyawan

| Yang ingin diubah | File / pengaturan |
|---|---|
| Nama, peran, keahlian, tampilan, tombol cepat | `shared/roster.js` |
| Aturan kerja umum dan prompt tiap divisi | `server/prompts.js` |
| Model yang dipakai | `MODEL_LEADER` dan `MODEL_TEAM` di `.env` (Claude atau `local:...`) |
| Isi ruangan (furniture) | `src/office.js` dan `src/furniture.js` |

Setelah mengubah file di atas: di lokal, server dev akan reload otomatis. Di VPS, jalankan `npm run build` lalu `pm2 restart kantor-ai`.

Link langsung ke satu karyawan: `https://office.domainkamu.com/#rina`

---

## 9. Struktur project

```
shared/roster.js   data karyawan & divisi (dipakai frontend dan backend)
server/            Express + Claude API / model lokal (streaming, batas pemakaian)
  index.js         endpoint chat, batas pemakaian
  local.js         klien model lokal (OpenAI-compatible)
  delegate.js      delegasi leader ke anggota tim
  prompts.js       system prompt per karyawan
src/               Three.js: scene, karakter, kamera, panel chat
```

---

## Follow for support

- Instagram: https://www.instagram.com/devanrifan/
- YouTube: https://www.youtube.com/@devanprogramming
- LinkedIn: https://id.linkedin.com/in/devanrifan
- Website: https://devanrifan.com/
- Tiktok: https://www.tiktok.com/@devanrifan
