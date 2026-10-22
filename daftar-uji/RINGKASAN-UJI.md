# Ringkasan Pengujian Utama — SIGAP (Agen Karhutla)

Dokumen ini merangkum skenario pengujian inti (**Test Suite Utama**) pada sistem **SIGAP — Sistem Intelijen Geospasial & Agen Penanggulangan Karhutla**, mencakup setiap aspek yang wajib dicatat: **Skenario, Input, Hasil yang Diharapkan, Hasil Aktual, Status, Kendala, dan Pengawasan Manusia (HITL)**.

| Informasi | Detail |
|---|---|
| **Sistem yang Diuji** | SIGAP Web Command Center & Agentic AI Workspace |
| **Target Deployment** | `https://sigap-frontend-270373967319.us-west1.run.app/` & Local Production Build |
| **Tanggal Pengujian** | 22 Oktober 2026 |
| **Cakupan Modul** | 1. Akses & Integrasi · 2. Monitoring Peta & Prioritas MCDA · 3. Investigasi Agentic AI · 4. Laporan Kasus & Ekspor |

---

## Daftar Periksa (Checklist) Kasus Uji Utama yang Terverifikasi (`True` / Lulus)

- [x] **UJ-01 — Akses Halaman Utama & Seluruh Rute Modul Workspace** (`GET /`, `/map`, `/priority`, `/investigation`, `/reports` merespons HTTP 200 dengan bundle produksi Next.js).
- [x] **UJ-02 — Ketersediaan Proxy API & Fallback Ketahanan Data (Resilience)** (Endpoint `/api/*` memiliki mekanisme fallback otomatis ke dataset nasional sehingga antarmuka komando tetap berjalan tanpa crash saat jaringan/upstream terganggu).
- [x] **UJ-03 — Konsistensi Kode Repositori & Konfigurasi Build Produksi** (Route proxy `/api/[...path]/route.ts`, `Dockerfile` produksi, dan konfigurasi `api.ts` telah tersinkronisasi di repositori).
- [x] **UJ-04 — Pemuatan Peta Monitoring & Klaster Titik Panas Nasional** (Peta interaktif otomatis memuat klaster titik panas se-Indonesia beserta ikon keparahan api, cincin zona DINOv3, poligon KHG gambut, dan buffer permukiman).
- [x] **UJ-05 — Penyaringan (Filter) Kriteria Matriks Prioritas MCDA** (Filter *Semua*, *Prioritas Kritis $\ge 85$*, *Khusus Lahan Gambut*, dan *Dekat Permukiman $\le 3\text{ km}$* menyaring daftar klaster secara akurat sesuai perhitungan skor MCDA).
- [x] **UJ-06 — Pencarian Lokasi Wilayah & ID Klaster Titik Panas** (Pencarian nama kabupaten/provinsi maupun ID klaster seperti `Seruyan` atau `HS-0421` mengarahkan kamera peta langsung ke koordinat sasaran).
- [x] **UJ-07 — Toggle Legenda Tingkat Keparahan & Layer Pengamatan Spasial** (Filter tingkat keparahan *Tinggi / Sedang / Rendah* serta 5 layer spasial *Hotspot, DINOv3, dNBR, Gambut, Permukiman* berfungsi secara reaktif di peta).
- [x] **UJ-08 — Simulasi Armada Drone Pemadam Otomatis & Alokasi Taktis Perimeter** (Mode simulasi mengerahkan 5 unit drone `DRN-01` s/d `DRN-05` menuju klaster prioritas, menurunkan parameter luas kebakaran/FRP secara visual, serta menampilkan titik taktis `POS-1` s/d `POS-4`, `UDP-1`, dan `BASE`).
- [x] **UJ-09 — Investigasi Agentic AI & Rencana Taktis Alokasi Sumber Daya Perimeter** (Kueri investigasi wilayah menjalankan 6 langkah orkestrasi agen, memfokuskan peta ke klaster aktif, dan menyusun rekomendasi penempatan regu di sekeliling perimeter luar).
- [x] **UJ-10 — Estimasi Proyeksi Sebaran Api & Kerugian Ekonomi/Ekologis** (Kueri analisis dampak menghitung proyeksi area terbakar 24 jam & 72 jam, estimasi kerugian finansial dalam Rp Miliar, serta emisi karbon $\text{t CO}_2\text{e}$ berdasarkan karakteristik lahan gambut/mineral dan vektor angin).
- [x] **UJ-11 — Manajemen Daftar Laporan Kasus, Pencarian, & Ekspor Spasial GeoJSON/CSV** (Panel laporan menampilkan daftar kasus karhutla dengan fitur pencarian kata kunci, filter status, serta ekspor matriks CSV dan layer GeoJSON).

---

## Ringkasan Detail Kasus Uji Penting

### 1. Modul Akses & Arsitektur Integrasi

| ID | Skenario & Input | Hasil yang Diharapkan | Hasil Aktual | Status | Kendala | Pengawasan Manusia (HITL) |
|---|---|---|---|---|---|---|
| **UJ-01** | **Akses Semua Rute Modul**<br>Input: `GET /`, `/map`, `/priority`, `/investigation`, `/reports` | Seluruh halaman merespons `HTTP 200` dalam waktu $< 5$ detik. | Semua rute merespons **HTTP 200** (1,34–3,57 detik saat *cold start*, 0,26–0,50 detik saat *warm*) dengan bundle produksi Next.js. | ✅ **Lulus** | *Cold start* Cloud Run menambah jeda $\pm 2\text{–}3$ detik pada akses pertama. | Admin memantau *uptime check* dan mengatur `min-instances=1` pada puncak musim kemarau. |
| **UJ-02** | **Ketahanan Integrasi API & Mode Fallback**<br>Input: Request ke `/api/hotspots/monitoring` & `/api/hotspots` | Mengembalikan data live dari FastAPI backend atau beralih ke dataset cadangan nasional tanpa memutus layanan UI. | Saat backend live terhubung, data NASA FIRMS ditampilkan; saat upstream gagal/offline, sistem otomatis memuat dataset klaster nasional sehingga peta tetap dapat dioperasikan. | ✅ **Lulus** | Konfigurasi variabel lingkungan `BACKEND_URL` pada Cloud Run harus dipastikan berisi URL backend aktif (bukan string literal). | **Wajib:** Operator memeriksa indikator badge **LIVE FIRMS + STAC + DINOv3** di header sebelum mengambil keputusan pengerahan lapangan. |
| **UJ-03** | **Sinkronisasi Kode Repo & Build Produksi**<br>Input: Inspeksi `frontend/Dockerfile`, `lib/api.ts`, dan `app/api/[...path]/route.ts` | Kode proxy same-origin `/api/*` dan konfigurasi build produksi (`npm run build`) tercatat lengkap di repositori. | File `route.ts`, logika resolusi `API_URL`, serta `Dockerfile` produksi sudah komit dan konsisten di repositori. | ✅ **Lulus** | Perubahan kode lokal memerlukan *rebuild* container image agar tercermin di URL Cloud Run. | Tim pengembang memastikan setiap rilis di-deploy dari commit cabang utama yang telah ditinjau. |

---

### 2. Modul Monitoring Peta & Penilaian Prioritas (MCDA)

| ID | Skenario & Input | Hasil yang Diharapkan | Hasil Aktual | Status | Kendala | Pengawasan Manusia (HITL) |
|---|---|---|---|---|---|---|
| **UJ-04** | **Pemuatan Titik Panas & Zona Spasial Nasional**<br>Input: Membuka dashboard `/` atau `/map` | Peta menampilkan klaster titik panas berlabel ikon api, cincin keparahan DINOv3 (Merah/Oranye/Kuning), kubah gambut KHG, dan permukiman. | Klaster titik panas dan titik panas individual tampil di seluruh kepulauan Indonesia lengkap dengan 4 zona cakupan DINOv3 dan kartu detail saat diklik. | ✅ **Lulus** | Kepadatan ikon yang tinggi pada zoom nasional memerlukan pembesaran (*zoom in*) untuk melihat detail per titik. | Operator memverifikasi silang klaster prioritas utama dengan laporan posko daerah / Sipongi KLHK. |
| **UJ-05** | **Filter Kriteria Matriks Prioritas MCDA**<br>Input: Klik filter *Semua*, *Kritis ($\ge 85$)*, *Gambut*, dan *Permukiman ($\le 3\text{ km}$)* | Daftar matriks prioritas menyaring klaster secara tepat berdasarkan ambang skor MCDA, gambut, dan jarak permukiman. | Penyaringan berjalan akurat sesuai atribut masing-masing klaster dan mendukung pengunduhan tabel matriks dalam format `.csv`. | ✅ **Lulus** | Ambang batas kritis ($\ge 85$) dan jarak permukiman ($\le 3\text{ km}$) bersifat tetap di kode. | Komandan Satgas memvalidasi apakah bobot MCDA dan ambang jarak sesuai dengan SOP darurat provinsi setempat. |
| **UJ-06** | **Pencarian Lokasi & ID Klaster**<br>Input: Ketik `Seruyan`, `Pulang Pisau`, `Riau`, atau `HS-0421` di kolom pencarian | Menampilkan daftar kecocokan lokasi/klaster dan menggerakkan kamera peta (`flyTo`) ke lokasi yang dipilih. | Pencarian nama wilayah dan ID klaster berhasil menemukan target dan memfokuskan peta ke koordinat klaster. | ✅ **Lulus** | Geocoding alamat bebas di luar daftar wilayah utama memerlukan koneksi aktif ke endpoint Nominatim backend. | Operator dapat menggunakan koordinat GPS langsung atau daftar klaster jika nama dusun spesifik belum terdaftar. |
| **UJ-07** | **Toggle Legenda Keparahan & Layer Spasial**<br>Input: Klik filter *Tinggi / Sedang / Rendah* dan toggle 5 chip layer spasial | Menyembunyikan atau menampilkan marker sesuai tingkat keparahan serta mengaktifkan/menonaktifkan layer poligon di peta. | Toggle legenda keparahan dan ke-5 layer spasial (*Hotspot, DINOv3, dNBR, Gambut, Permukiman*) memperbarui tampilan peta secara instan. | ✅ **Lulus** | Jika filter keparahan *Tinggi* dimatikan oleh pengguna, klaster kritis tidak tampil di peta sampai dinyalakan kembali. | Operator harus memastikan filter *Tinggi* tetap aktif selama pemantauan operasional rutin. |
| **UJ-08** | **Simulasi Drone & Rute Penyekatan Taktis**<br>Input: Aktifkan toggle *Simulasi* atau klik salah satu titik api di peta | Menampilkan pergerakan 5 unit drone pemadam (`DRN-01`..`DRN-05`) serta rencana titik penempatan perimeter (`POS-1`..`POS-4`, `UDP-1`, `BASE`). | 5 drone bergerak menuju klaster prioritas setiap 700 ms, menurunkan radius kebakaran secara bertahap, dan menampilkan rute taktis di sekeliling perimeter api. | ✅ **Lulus** | Pergerakan drone pada mode simulasi adalah pemodelan matematis di sisi klien, bukan telemetri penerbangan drone fisik. | Mode simulasi digunakan khusus untuk latihan/perencanaan skenario dan tidak menggantikan komando penerbangan UAV lapangan. |

---

### 3. Modul Investigasi Agentic AI & Laporan Kasus

| ID | Skenario & Input | Hasil yang Diharapkan | Hasil Aktual | Status | Kendala | Pengawasan Manusia (HITL) |
|---|---|---|---|---|---|---|
| **UJ-09** | **Investigasi AI Wilayah Rawan Karhutla**<br>Input: `Pantau karhutla di Riau` / `Ada titik api di Pulang Pisau hari ini?` | Agen menjalankan 6 langkah analisis (*Perception, Citra STAC, DINOv3, Risk Scoring, Routing*), memfokuskan peta, dan menyusun rencana taktis perimeter. | Wilayah berhasil dikenali, peta otomatis terbang ke klaster tertinggi di wilayah tersebut (mis. `HS-0379` Bengkalis / `HS-0432` Pulang Pisau), dan agen menyajikan alokasi `POS-1` s/d `POS-4` & `UDP-1` beserta log audit keputusan. | ✅ **Lulus** | Saat LLM backend sedang offline, penjelasan disusun menggunakan mesin template deterministik berbasis telemetri klaster. | **Wajib:** Rencana penempatan regu (`POS-1`..`POS-4`) dan *water bombing* (`UDP-1`) berstatus rekomendasi yang harus disetujui Komandan Satgas sebelum pengerahan fisik. |
| **UJ-10** | **Estimasi Kerugian Ekonomi & Emisi Karbon**<br>Input: `Berapa kerugian jika api di Ketapang dibiarkan?` | Agen menghitung proyeksi perluasan area terbakar (24 & 72 jam), estimasi kerugian ekonomi (Rp Miliar), dan emisi $\text{CO}_2\text{e}$. | Agen mendeteksi kata kunci analisis dampak pada klaster `HS-0421` (Ketapang) dan menampilkan proyeksi luas terbakar, nilai kerugian ekonomi, serta estimasi pelepasan emisi karbon gambut/mineral. | ✅ **Lulus** | Perhitungan menggunakan model faktor biaya per hektare (Rp 72 juta/Ha gambut; Rp 38 juta/Ha mineral) dan faktor emisi IPCC. | Angka estimasi kerugian digunakan sebagai indikasi awal perencanaan kontingensi; rilis resmi SITREP tetap melalui verifikasi analis BPBD/KLHK. |
| **UJ-11** | **Manajemen Laporan Kasus & Ekspor Data Spasial**<br>Input: Buka panel *Laporan*, cari `Pulang`, filter `Draft`, dan klik ekspor *GeoJSON / CSV* | Menampilkan daftar laporan kasus yang sesuai filter serta mengunduh file `.geojson` dan `.csv` yang valid ke perangkat pengguna. | Daftar laporan tersaring secara responsif di UI; tombol ekspor menghasilkan file GeoJSON (berisi fitur titik panas, poligon gambut, buffer permukiman) dan tabel prioritas CSV. | ✅ **Lulus** | Unduhan laporan PDF terformat memerlukan koneksi aktif ke layanan generator PDF (`WeasyPrint`) di backend. | Laporan berstatus *Draft* wajib diperiksa dan divalidasi oleh petugas pemeriksa sebelum disahkan menjadi laporan operasional final. |

---

## Matriks Kepatuhan Pengawasan Manusia (Human-in-the-Loop)

- [x] **Verifikasi Status Data Live:** Operator memeriksa indikator koneksi satelit (*LIVE FIRMS + STAC + DINOv3*) pada bilah navigasi utama sebelum menggunakan peta untuk operasi lapangan.
- [x] **Otorisasi Komandan Sebelum Pengerahan (Dispatch):** Seluruh titik penyekatan perimeter (`POS-1` s/d `POS-4`) dan zona *water bombing* (`UDP-1`) dirancang sebagai rekomendasi pendukung keputusan (*Decision Support System*) yang menjaga keselamatan regu di luar inti api (`CORE_DEEPRED`) dan wajib disetujui Komandan Satgas.
- [x] **Validasi Analis atas Laporan & Estimasi Dampak:** Laporan kasus berstatus *Draft* dan angka proyeksi kerugian ekonomi/emisi karbon ditinjau oleh analis BPBD/Manggala Agni sebelum dipublikasikan dalam laporan situasi resmi (SITREP).
- [x] **Auditabilitas Jejak Keputusan AI:** Setiap tahapan eksekusi agen dicatat dalam *Execution Trace* dan *Decision Audit Log* yang dapat diekspor ke format `.json` untuk peninjauan pasca-operasi.
