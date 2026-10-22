# Daftar Uji — SIGAP Frontend

Bukti uji untuk frontend SIGAP (Agen Karhutla) yang sudah di-deploy. Setiap kasus uji mencatat **skenario, input, hasil yang diharapkan, hasil aktual, status, kendala, dan pengawasan manusia**.

| Item | Keterangan |
|---|---|
| Target uji | https://sigap-frontend-270373967319.us-west1.run.app/ |
| Tanggal uji | 22 Oktober 2026 (uji pertama UTC 01:43, diulang UTC 02:03 dengan hasil yang sama) |
| Versi kode acuan | branch `main` @ `0899560` (feat: mobile view) |
| Penguji | Tim SIGAP, dibantu Claude Code |

## Metode Uji

1. **Uji HTTP langsung ke deployment.** Semua halaman dan endpoint `/api/*` diakses dengan `curl`. Log mentahnya ada di [lampiran/log-uji-http.txt](lampiran/log-uji-http.txt).
2. **Inspeksi bundle produksi.** File JavaScript yang benar-benar dikirim ke browser diunduh untuk mengecek alamat API yang dipakai ([lampiran/potongan-bundle.txt](lampiran/potongan-bundle.txt)).
3. **Simulasi logika fallback.** `lib/api.ts` dan `lib/monitoring.ts` yang asli dijalankan di Node.js dengan semua `fetch` dipaksa gagal (HTTP 502), sama seperti kondisi deployment saat ini. Dengan cara ini kita tahu data apa yang akan tampil di UI ([lampiran/log-simulasi-fallback.txt](lampiran/log-simulasi-fallback.txt), skrip: [lampiran/sim-fallback.mjs](lampiran/sim-fallback.mjs)).
4. **Pemeriksaan visual di browser belum dilakukan.** Kasus yang masih perlu dicek dengan mata ditandai **Perlu verifikasi manual**. Kolom "Hasil Aktual (Manual)" di kasus tersebut dibiarkan kosong untuk diisi tim, sebaiknya disertai screenshot di `lampiran/screenshot/`.

## Ringkasan Hasil

| ID | Modul | Skenario | Status |
|---|---|---|---|
| [UJ-01](01-akses-dan-integrasi.md#uj-01) | Akses | Membuka halaman utama & semua rute modul | ✅ Lulus |
| [UJ-02](01-akses-dan-integrasi.md#uj-02) | Integrasi | Proxy `/api/*` ke backend | ❌ Gagal (kritis) |
| [UJ-03](01-akses-dan-integrasi.md#uj-03) | Integrasi | Konsistensi kode repo vs deployment | ⚠️ Temuan |
| [UJ-04](02-monitoring-peta.md#uj-04) | Monitoring | Memuat titik panas nasional saat dashboard dibuka | ⚠️ Lulus bersyarat (data sampel, bukan live) |
| [UJ-05](02-monitoring-peta.md#uj-05) | Monitoring | Filter kriteria prioritas | ✅ Lulus (logika) · Perlu verifikasi manual |
| [UJ-06](02-monitoring-peta.md#uj-06) | Monitoring | Pencarian lokasi | ⚠️ Lulus sebagian |
| [UJ-07](02-monitoring-peta.md#uj-07) | Monitoring | Toggle legenda keparahan | Perlu verifikasi manual |
| [UJ-08](02-monitoring-peta.md#uj-08) | Monitoring | Simulasi drone | Perlu verifikasi manual |
| [UJ-09](03-investigasi-ai.md#uj-09) | Investigasi AI | Investigasi wilayah yang ada di data sampel (Riau) | ⚠️ Lulus bersyarat |
| [UJ-10](03-investigasi-ai.md#uj-10) | Investigasi AI | Investigasi Pulang Pisau | ❌ Gagal (kritis: false negative) |
| [UJ-11](03-investigasi-ai.md#uj-11) | Investigasi AI | Investigasi wilayah di luar data sampel (Medan, Bogor) | ❌ Gagal (kritis) |
| [UJ-12](03-investigasi-ai.md#uj-12) | Investigasi AI | Estimasi kerugian ekonomi (Ketapang) | ⚠️ Lulus bersyarat |
| [UJ-13](03-investigasi-ai.md#uj-13) | Investigasi AI | Pesan sapaan non-investigasi | ❌ Gagal (minor) |
| [UJ-14](04-laporan-dan-hitl.md#uj-14) | Laporan | Daftar laporan kasus | ⚠️ Lulus bersyarat |
| [UJ-15](04-laporan-dan-hitl.md#uj-15) | Laporan | Unduh laporan PDF | ❌ Gagal |
| [UJ-16](04-laporan-dan-hitl.md#uj-16) | Laporan | Unduh GeoJSON per kasus | ❌ Gagal (tanpa pesan error) |
| [UJ-17](04-laporan-dan-hitl.md#uj-17) | HITL | Persetujuan komandan sebelum dispatch | ❌ Belum tersedia |

**Total: 17 kasus.** 1 lulus · 1 lulus logika · 5 lulus bersyarat/sebagian · 6 gagal · 1 belum tersedia · 1 temuan · 2 hanya perlu verifikasi manual.

## Temuan Utama

1. **Backend tidak terhubung sama sekali.** Semua endpoint `/api/*` di domain frontend membalas `HTTP 502` karena variabel lingkungan Cloud Run berisi teks literal `$BACKEND_URL`, bukan URL backend (UJ-02). Akibatnya **tidak ada satu pun data live** (FIRMS, STAC, DINOv3, Gemini) yang sampai ke UI.
2. **UI tidak memberi tahu pengguna bahwa sedang offline.** Badge "LIVE" memang disembunyikan, tetapi tidak ada banner yang bilang data sedang offline atau berasal dari sampel. Di chat, sumber data hanya ditandai teks kecil "FIRMS Cache".
3. **False negative yang berbahaya (UJ-10, UJ-11).** Untuk wilayah yang tidak ada di 10 data sampel, chat menjawab *"Tidak ditemukan kebakaran aktif… berdasarkan pemindaian satelit NASA FIRMS (VIIRS 375m NRT) dalam 48 jam terakhir… Tidak diperlukan pengerahan regu pemadam"*, padahal pemindaian itu tidak pernah terjadi. Jawaban ini bahkan bertentangan dengan laporan SIGAP-2026-089 yang tampil di UI yang sama (Pulang Pisau, 1.240 Ha, prioritas Kritis 95).
4. **Angka yang tidak berasal dari analisis ditampilkan seolah hasil analisis.** Contohnya scene `S2A_49MFM_L2A`, awan 6,8%, RH ~64%, dan angin 12 km/j adalah nilai tetap di kode yang dipakai kalau backend gagal.
5. **Belum ada titik persetujuan manusia (HITL)** sebelum rencana dispatch, padahal `AGENTS.md` §8 mewajibkannya.

## Sumber & Penggunaan AI

Daftar model, tools, API, dataset, lisensi, dan komponen yang dibantu agentic AI ada di folder terpisah: [sumber-dan-penggunaan-ai/](../sumber-dan-penggunaan-ai/README.md).

## Rekomendasi Prioritas

| Prioritas | Tindakan |
|---|---|
| P0 | Isi env `BACKEND_URL` di layanan Cloud Run frontend dengan URL backend yang sebenarnya, lalu redeploy. Ulangi UJ-02. |
| P0 | Saat data tidak live, **jangan pernah** menyimpulkan "AMAN / tidak perlu pengerahan". Ganti dengan status "DATA TIDAK TERSEDIA — perlu verifikasi manual". |
| P1 | Tampilkan banner global "Mode Offline / Data Sampel" setiap kali `is_live=false`. |
| P1 | Hentikan pemakaian angka default sebagai nilai hasil analisis. Tampilkan "–" atau beri label "estimasi default". |
| P1 | Unduh PDF/GeoJSON harus mengecek status respons dan menampilkan pesan error. |
| P2 | Commit kode proxy `/api` yang sudah ter-deploy ke repo (UJ-03). |
| P2 | Tambahkan tombol persetujuan komandan sebelum rencana POS/UDP dianggap final (UJ-17). |

## Struktur Folder

```
daftar-uji/
├── README.md                     ← ringkasan (file ini)
├── 01-akses-dan-integrasi.md     ← UJ-01 s/d UJ-03
├── 02-monitoring-peta.md         ← UJ-04 s/d UJ-08
├── 03-investigasi-ai.md          ← UJ-09 s/d UJ-13
├── 04-laporan-dan-hitl.md        ← UJ-14 s/d UJ-17
├── TEMPLATE-KASUS-UJI.md         ← template untuk menambah kasus uji
└── lampiran/
    ├── log-uji-http.txt
    ├── log-simulasi-fallback.txt
    ├── potongan-bundle.txt
    └── sim-fallback.mjs
```

## Menjalankan Ulang Uji

```bash
# Uji HTTP (dari root repo)
curl -s -w "\n%{http_code}\n" "https://sigap-frontend-270373967319.us-west1.run.app/api/hotspots/monitoring?region=Indonesia&limit=35"

# Simulasi fallback (butuh `npm install` di folder frontend terlebih dulu)
mkdir -p /tmp/simout
node daftar-uji/lampiran/sim-fallback.mjs "$(pwd)/frontend" /tmp/simout
```

Setelah backend tersambung, jalankan ulang semua kasus. Hasil yang diharapkan untuk UJ-04 dan UJ-09 s/d UJ-12 akan berubah karena data live akan menggantikan data sampel.
