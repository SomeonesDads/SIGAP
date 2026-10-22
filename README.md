# SIGAP: Agen Karhutla
### Platform Investigasi Otonom dan Prioritisasi Respons Kebakaran Hutan dan Lahan

SIGAP (Sistem Informasi dan Tanggap Cepat Karhutla) adalah platform berbasis kecerdasan buatan dan sistem multi agen untuk pemantauan, investigasi geospasial, serta penentuan prioritas respons operasional kebakaran hutan dan lahan (karhutla) di Indonesia. Sistem ini menyatukan deteksi anomali termal satelit secara waktu nyata, akuisisi citra satelit multispektral, segmentasi area terbakar berbasis pemelajaran mendalam (deep learning), analisis tingkat keparahan kebakaran melalui indeks spektral dNBR, serta pemeringkatan risiko multikriteria ke dalam satu alur kerja terpadu.

Target pengguna utama platform ini meliputi:
* **BPBD (Badan Penanggulangan Bencana Daerah)**: Pusat komando penanggulangan bencana daerah yang mengoordinasikan respons darurat, logistik pemadaman, dan perlindungan warga.
* **Manggala Agni (KLHK)**: Brigade pengendalian kebakaran hutan dan lahan di bawah Kementerian Lingkungan Hidup dan Kehutanan yang bertugas pada operasi pemadaman darat dan sekat bakar.
* **KPH (Kesatuan Pengelolaan Hutan)**: Unit pengelolaan hutan yang mengawasi konsesi kehutanan, hutan konservasi, dan wilayah perbatasan hutan masyarakat.
* **Tim Analis Kebakaran dan GIS**: Spesialis penginderaan jauh yang mengevaluasi luasan area terbakar, estimasi emisi karbon, dan kepatuhan lingkungan pascakebakaran.

## 1. Masalah

Penanganan kebakaran hutan dan lahan di Indonesia, khususnya pada ekosistem lahan gambut tropis di Kalimantan dan Sumatra, menghadapi sejumlah kendala struktural dan operasional yang krusial:

1. **Fragmentasi Sumber Data dan Keterlambatan Analisis**
   Petugas operasional harus memeriksa berbagai portal terpisah secara manual, mulai dari titik panas (hotspot) satelit pada NASA FIRMS dan Sipongi KLHK, data cuaca dan arah angin dari BMKG, peta kedalaman gambut, hingga citra optik dari Landsat dan Sentinel. Proses pengumpulan, pengunduhan, dan pengolahan data spasial ini memakan waktu yang sangat lama (mulai dari hitungan jam hingga hari), sedangkan api di lahan gambut menyebar dengan cepat di bawah permukaan tanah.

2. **Tingginya Anomali Semu (False Positives) pada Titik Panas**
   Deteksi titik panas satelit merupakan anomali termal, bukan konfirmasi kebakaran nyata. Pantulan panas atap industri, suar gas (flaring), atau pembakaran terkendali skala kecil sering memicu peringatan palsu. Tanpa verifikasi cerdas berbasis penginderaan jauh dan fusi multisensor, pengerahan tim darat ke lokasi yang salah akan menguras bahan bakar, logistik, dan tenaga personel.

3. **Alokasi Sumber Daya yang Statis dan Tidak Optimal**
   Sistem pemantauan konvensional bekerja secara linear dan terisolasi per tiket laporan. Ketika ratusan titik panas muncul bersamaan pada puncak musim kemarau atau periode El Nino, pencocokan tim pemadam hanya berdasarkan jarak garis lurus terdekat (greedy dispatch) menyebabkan tim terkunci di lokasi berisiko rendah, sementara kebakaran gambut dalam yang mengancam permukiman kehilangan waktu emas pemadaman awal.

4. **Hambatan Tutupan Awan dan Ketiadaan Bukti Terukur**
   Wilayah tropis Indonesia sering tertutup awan tebal dan kabut asap yang menghalangi citra satelit optik. Sistem pemantauan biasa gagal memberikan estimasi luasan area terbakar dan tingkat keparahan ketika citra tertutup awan, serta tidak menyediakan jejak penalaran (audit trail) yang transparan bagi komandan lapangan untuk mempertanggungjawabkan keputusan pengerahan tim.

## 2. Arsitektur Agent

Berbeda dari dasbor pemantauan pasif yang hanya menampilkan peta titik panas, SIGAP mengimplementasikan arsitektur **Multi Agent AI** menggunakan **Google Agent Development Kit (ADK)** yang ditenagai oleh model **Gemini** melalui **Google Cloud Vertex AI**.

Sistem ini menggunakan pola delegasi hierarkis yang dipimpin oleh satu agen pengarah utama (**Wildfire Response Orchestrator**) yang mengoordinasikan **6 agen spesialis**. Alur kerja bersifat siklikal, adaptif, dan mampu menyusun ulang rencana operasi secara menyeluruh apabila kondisi cuaca atau situasi lapangan berubah.

### Agen Pengarah Utama: Wildfire Response Orchestrator (`root_agent`)
Bertugas sebagai pusat penalaran dan pengendali alur kerja. Agen ini menerima perintah pengguna dalam bahasa Indonesia melalui antarmuka percakapan (AI Command Center) maupun pemicu data satelit, memecah tujuan menjadi rencana investigasi, mendelegasikan tugas ke 6 agen spesialis, menyatukan temuan menjadi laporan situasi (SITREP), serta menginisiasi perencanaan ulang (dynamic replanning) ketika muncul titik api kritis baru atau perubahan arah angin ekstrem.

### Enam Agen Spesialis

1. **Perception and Fusion Agent (`perception_fusion`)**
   * **Peran**: Menyatukan data anomali termal dari NASA FIRMS (sensor VIIRS 375m dan MODIS 1km), laporan cuaca, serta pengamatan lapangan untuk menghitung probabilitas kebakaran nyata.
   * **Kapabilitas**: Mengelompokkan titik panas menggunakan algoritma spasial DBSCAN dengan jarak Haversine untuk menyaring derau suar industri, memanggil citra satelit pra kebakaran dan pasca kebakaran melalui Google Earth Engine dan AWS Earth Search (Sentinel 2 L2A), serta mengevaluasi persentase tutupan awan pada Area of Interest (AOI).
   * **Perangkat (Tools)**: `fetch_hotspots`, `fetch_satellite_imagery`, `assess_image_quality`, serta agen bantu pencarian web (`GoogleSearchTool`) dan pembacaan konteks URL (`url_context`).

2. **Risk Scoring Agent (`risk_scoring`)**
   * **Peran**: Menghitung skor prioritas risiko dinamis (skala 0 hingga 100) untuk setiap klaster aktif relatif terhadap seluruh insiden lain yang sedang berlangsung.
   * **Kapabilitas**: Menjalankan analisis keputusan multikriteria (MCDA) dengan mempertimbangkan kerentanan lahan gambut (Kesatuan Hidrologis Gambut), jarak terhadap permukiman warga, arah dan kecepatan angin pembawa asap, tren pertumbuhan klaster, serta riwayat kebakaran berulang. Bobot penilaian beradaptasi sesuai konteks musim kemarau dan ancaman asap lintas batas.
   * **Perangkat (Tools)**: `score_hotspot_priority`, `rank_all_active_hotspots`, `explain_priority`, dan `overlay_risk_layers`.

3. **Verification Agent (`verification_agent`)**
   * **Peran**: Menjalankan kerangka keputusan nilai informasi (Value of Information) sebelum tim pemadam darat dikerahkan serta memvalidasi bukti kerusakan lahan.
   * **Kapabilitas**: Menimbang biaya pengerahan tim terhadap risiko keterlambatan pemadaman gambut untuk memutuskan apakah suatu klaster memerlukan pengerahan langsung (`DIRECT_DISPATCH`), verifikasi drone intai, atau pengecekan oleh Masyarakat Peduli Api (MPA). Agen ini juga mengeksekusi model pemelajaran mendalam **DINOv3 BurnSeg** (hibrid Vision Transformer dan UNet spektral 11 kanal) serta **UNet 6 kanal** untuk menghasilkan poligon area terbakar, menghitung luasan dalam hektare pada proyeksi luas setara, dan menghitung indeks keparahan **dNBR** (Differenced Normalized Burn Ratio).
   * **Perangkat (Tools)**: `segment_burned_area`, `compute_dnbr`, dan `compute_burned_area`.

4. **Routing and Dispatch Agent (`routing_dispatch`)**
   * **Peran**: Menyelesaikan optimasi penugasan banyak tim ke banyak titik api (many to many global fleet optimization) agar total kerugian wilayah dapat ditekan seminimal mungkin.
   * **Perangkat dan Logika**: Menghitung penempatan pos taktis pemadaman, estimasi waktu tempuh berdasarkan akses medan, serta mengidentifikasi ketersediaan sumber air terdekat seperti kanal gambut, sekat kanal, dan sungai untuk kebutuhan pompa bertekanan tinggi.
   * **Perangkat (Tools)**: `optimize_team_assignments`, `estimate_travel_time`, `find_nearest_water_sources`, dan agen bantu pencarian kondisi akses jalan.

5. **Coordination Agent (`coordination_agent`)**
   * **Peran**: Menjembatani komunikasi operasional dua arah antara pusat komando dan regu pemadam di lapangan.
   * **Kapabilitas**: Menyusun paket instruksi misi berbahasa Indonesia yang jelas, memantau pembaruan waktu tiba (ETA), menangani laporan hambatan akses di lapangan (seperti jembatan kayu putus atau perubahan angin), serta memicu eskalasi peringatan dini kepada pengawas manusia (Human in the Loop) apabila api mendekati batas aman permukiman.
   * **Perangkat (Tools)**: `estimate_travel_time` dan `explain_priority`.

6. **Feedback and Learning Agent (`feedback_learning`)**
   * **Peran**: Melakukan evaluasi pascainsiden setelah operasi pemadaman selesai dan diverifikasi petugas.
   * **Kapabilitas**: Membandingkan prediksi awal model dan skor risiko terhadap temuan faktual di lapangan, mengevaluasi ketepatan estimasi luasan hektare terbakar, serta memberikan rekomendasi kalibrasi bobot risiko agar akurasi sistem meningkat secara berkelanjutan.
   * **Perangkat (Tools)**: `score_hotspot_priority` dan `compute_burned_area`.

## 3. Dependensi

Proyek SIGAP dibangun menggunakan arsitektur modern yang memisahkan antarmuka web geospasial, layanan API dan orkestrasi agen, serta modul pemelajaran mesin dan pemrosesan penginderaan jauh.

### Persyaratan Sistem Utama
* **Python**: Versi 3.11 atau lebih baru
* **Node.js**: Versi 20.x atau lebih baru beserta pengelola paket `npm`
* **Docker dan Docker Compose**: Untuk menjalankan seluruh layanan dalam kontainer terisolasi
* **Kredensial Layanan Eksternal**:
  * Proyek **Google Cloud Platform (GCP)** dengan Vertex AI API aktif dan Application Default Credentials (atau berkas JSON Service Account)
  * Akun **Google Earth Engine (GEE)** yang terdaftar pada proyek GCP
  * Kunci API **NASA FIRMS** (`NASA_FIRMS_API_KEY`) untuk pengambilan data titik panas VIIRS dan MODIS

### Dependensi Backend, Agen AI, dan Pemelajaran Mesin (Python)
Seluruh pustaka Python didefinisikan di dalam berkas `pyproject.toml` dan `backend/requirements.txt`:
* **Kerangka Kerja API dan Server**: `fastapi` (>=0.115.0), `uvicorn` (>=0.30.0), `pydantic` (>=2.8.0), `pydantic_settings` (>=2.4.0), `python_dotenv` (>=1.0.1)
* **Orkestrasi Multi Agen dan LLM**: `google_adk` (>=1.0.0), `google_genai` (>=1.0.0), `google_auth` (>=2.29.0)
* **Pemelajaran Mendalam dan Visi Komputer**: `torch` (>=2.2.0), `torchvision` (>=0.17.0), `scikit_learn` (>=1.4.0), `numpy` (>=1.26.0, <2.0.0), `Pillow` (>=10.2.0)
* **Penginderaan Jauh dan Geospasial**: `earthengine_api` (>=0.1.400), `rasterio` (>=1.3.10), `geopandas` (>=1.0.0), `shapely` (>=2.0.0)
* **Jaringan, Penyimpanan Sementara, dan Pelaporan**: `httpx` (>=0.27.0), `requests` (>=2.31.0), `redis` (>=5.0.0), `weasyprint` (>=62.0)
* **Pengujian dan Kualitas Kode**: `pytest` (>=8.3.0), `pytest_asyncio` (>=0.24.0), `ruff` (>=0.6.0), `mypy` (>=1.11.0)

### Dependensi Frontend (Node.js dan TypeScript)
Seluruh pustaka antarmuka pengguna didefinisikan di dalam berkas `frontend/package.json`:
* **Kerangka Kerja Web**: `next` (15.1.7) dengan App Router, `react` (19.0.0), `react_dom` (19.0.0), `typescript` (5.7.3)
* **Visualisasi Peta Geospasial**: `leaflet` (1.9.4), `react_leaflet` (5.0.0)
* **Antarmuka dan Gaya Visual**: `tailwindcss` (4.0.0), `lucide_react` (0.475.0), `clsx` (2.1.1), `tailwind_merge` (2.6.0), `postcss` (8.5.1), `autoprefixer` (10.4.20)

## 4. Cara Menjalankan

Anda dapat menjalankan proyek SIGAP menggunakan Docker Compose (direkomendasikan untuk kemudahan integrasi) maupun secara langsung pada lingkungan lokal untuk pengembangan.

### Tahap 1: Konfigurasi Variabel Lingkungan

1. Masuk ke direktori utama proyek `SIGAP`.
2. Salin berkas templat konfigurasi `.env.example` menjadi berkas `.env`:
   ```bash
   cp .env.example .env
   ```
3. Buka berkas `.env` dan isi variabel konfigurasi sesuai kredensial Anda:
   ```env
   GOOGLE_CLOUD_PROJECT=id_proyek_gcp_anda
   GOOGLE_APPLICATION_CREDENTIALS=/jalur/menuju/kredensial_gcp.json
   VERTEX_LOCATION=us_west1
   EARTH_ENGINE_PROJECT=id_proyek_gcp_anda
   NASA_FIRMS_API_KEY=kunci_api_firms_anda
   REDIS_URL=redis://localhost:6379/0
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
   > Catatan: Apabila kunci API eksternal belum diatur, sistem memiliki mekanisme cadangan (fallback) pada pusat pemantauan agar antarmuka dan simulasi alur investigasi tetap dapat diuji.

### Tahap 2: Opsi A, Menjalankan dengan Docker Compose (Direkomendasikan)

Jalankan perintah berikut dari direktori `SIGAP` untuk membangun dan menyalakan layanan Redis, FastAPI Backend, serta Next.js Frontend secara bersamaan:

```bash
docker compose up
```

Setelah seluruh kontainer aktif, akses layanan melalui peramban web:
* **Aplikasi Web Frontend**: `http://localhost:3000`
* **Dokumentasi Interaktif API Backend (Swagger UI)**: `http://localhost:8000/docs`
* **Pemeriksaan Status Layanan (Health Check)**: `http://localhost:8000/health`

### Tahap 3: Opsi B, Menjalankan Secara Lokal untuk Pengembangan

#### 1. Menjalankan Layanan Backend dan Agen AI
Dari direktori `SIGAP`, buat lingkungan virtual Python, pasang dependensi, dan jalankan server FastAPI:

```bash
virtualenv .venv
```

Aktifkan lingkungan virtual pada Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
```

Atau aktifkan pada Linux dan macOS:
```bash
source .venv/bin/activate
```

Pasang seluruh paket dependensi Python dan jalankan server:
```bash
pip install .
uvicorn backend.main:app
```

Server API akan berjalan di `http://localhost:8000`.

#### 2. Menjalankan Aplikasi Web Frontend
Buka terminal baru, masuk ke direktori `frontend`, pasang dependensi Node.js, dan jalankan server pengembangan Next.js:

```bash
cd frontend
npm install
npm run dev
```

Buka `http://localhost:3000` pada peramban untuk menggunakan dasbor pemantauan, peta analisis kebakaran, ruang kerja investigasi AI, penilaian prioritas, dan unduhan laporan.

### Tahap 4: Menjalankan Pengujian Otomatis

Untuk memverifikasi fungsionalitas agen, peralatan geospasial, model pemelajaran mesin, dan rute API, jalankan perintah berikut dari direktori `SIGAP`:

```bash
pytest
```

## 5. Struktur Direktori Proyek

* `agent/`: Definisi sistem multi agen Google ADK (`agent.py`), konfigurasi model, templat instruksi tiap agen (`prompts/`), dan pembungkus peralatan domain (`tools/`).
* `backend/`: Aplikasi REST API dan SSE streaming menggunakan FastAPI (`main.py`), rute endpoint (`api/routes/`), skema data Pydantic (`models/`), serta layanan orkestrasi investigasi (`services/`).
* `frontend/`: Aplikasi web interaktif Next.js 15 (`src/app/`), komponen peta dan percakapan agen (`src/components/`), pengait logika klien (`src/hooks/`), serta pustaka pemodelan taktis (`src/lib/`).
* `ml/`: Pipeline pemelajaran mendalam PyTorch yang mencakup arsitektur dan inferensi **DINOv3 BurnSeg** (`ml/dinov3/`) serta **UNet 6 kanal** (`ml/unet/`) beserta bobot model terlatih.
* `data/`: Klien integrasi data eksternal untuk NASA FIRMS (`data/firms/`), Google Earth Engine dan STAC (`data/earth_engine/`), serta algoritma klasterisasi DBSCAN, perhitungan dNBR, dan skoring prioritas (`data/geospatial/`).
* `docs/`: Dokumentasi arsitektur sistem tingkat tinggi.
* `tests/`: Rangkaian pengujian unit dan integrasi untuk agen, API, peralatan, dan model ML.

## 6. Kontribusi Anggota

Pengembangan platform SIGAP dilaksanakan melalui kolaborasi tim lintas disiplin dengan pembagian peran dan kontribusi sebagai berikut:

* **Natanael I Manurung (Hacker)**
  Membangun keseluruhan tumpukan teknologi (full stack) aplikasi, meliputi pengembangan antarmuka web Next.js, arsitektur layanan backend FastAPI, integrasi jaringan data geospasial dan peta interaktif, penyambungan pipeline model ke dalam aplikasi, serta konfigurasi kontainer dan infrastruktur sistem.

* **Kurt Mikhael Purba (Hacker)**
  Mengembangkan sistem kecerdasan buatan (AI), perancangan arsitektur dan instruksi multi agen, eksperimen pemelajaran mesin, serta pelatihan dan penyesuaian model (model tuning) segmentasi area terbakar DINOv3 BurnSeg dan UNet.

* **Aurelia Jennifer Gunawan (Hipster)**
  Merancang desain antarmuka dan pengalaman pengguna (UI/UX) secara menyeluruh pada Figma, menyusun sistem desain visual dasbor operasional, serta berkontribusi dalam pembuatan materi presentasi (pitch deck).

* **Hakam Avicena Mustain (Hustler)**
  Menyusun analisis permasalahan operasional, perumusan nilai solusi dan strategi implementasi, pembuatan materi presentasi (pitch deck), serta produksi video demonstrasi produk.

* **Nathan Edward Christofer Marpaung (Hustler)**
  Menyusun narasi produk, pembuatan materi presentasi (pitch deck), pengambilan gambar, serta pembuatan script dan penyuntingan video demonstrasi produk.

## 7. Lisensi

Proyek ini didistribusikan di bawah Lisensi MIT sebagaimana tercantum pada konfigurasi proyek.
