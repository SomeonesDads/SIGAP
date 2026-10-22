# Sumber & Penggunaan AI — SIGAP

> Dokumen terkait: [Daftar Uji](../daftar-uji/README.md). Kode UJ-xx di dokumen ini merujuk ke kasus uji di sana.

Dokumen ini mencatat **model, tools, API, dataset, dan lisensi** yang dipakai SIGAP, serta **komponen mana yang benar-benar dibantu agentic AI**. Semua isi diambil dari kode di `main@0899560`, checkpoint model di `ml/`, dan hasil uji deployment tanggal 22 Oktober 2026. Hal yang belum bisa dipastikan ditandai **(perlu dicek)**.

---

## 1. Ringkasan Singkat

| Pertanyaan | Jawaban Singkat |
|---|---|
| LLM apa yang dipanggil aplikasi? | **Gemini 2.5 Flash** lewat Vertex AI REST (`us-central1`) di `POST /api/chat`. |
| Apakah sistem multi-agen Google ADK sudah jalan? | **Belum tersambung.** 13 `LlmAgent` (Gemini 3.5 Flash) sudah didefinisikan di `agent/agent.py`, tapi tidak di-import atau dijalankan oleh backend maupun frontend. |
| Model ML apa yang dipakai? | **DINOv3 BurnSeg** (checkpoint `ml/dinov3_burnseg*.pt`) untuk segmentasi area terbakar. Ada catatan penting, lihat bagian 2.3. |
| Data live dari mana? | NASA FIRMS, AWS Earth Search (Sentinel-2 L2A), OSM Nominatim & Overpass, NASA GIBS. Di deployment saat ini **semuanya tidak sampai ke UI** karena proxy 502 ([UJ-02](../daftar-uji/01-akses-dan-integrasi.md#uj-02)). |
| Lisensi proyek? | `pyproject.toml` menyatakan **MIT**, tapi **belum ada file `LICENSE`** di repo. |

---

## 2. Model AI

### 2.1 Daftar Model

| Model | Jenis | Penyedia | Dipakai di | Status Nyata | Ketentuan / Lisensi |
|---|---|---|---|---|---|
| `gemini-2.5-flash` | LLM | Google Vertex AI (`us-central1`) | `backend/api/routes/chat.py` (endpoint `/api/chat`), auth Application Default Credentials. Suhu 0,2, maks 768 token. | **Aktif** bila backend berjalan dan kredensial GCP tersedia. Di deployment saat ini tidak terpanggil ([UJ-02](../daftar-uji/01-akses-dan-integrasi.md#uj-02)). | Google Cloud Terms of Service + Generative AI Prohibited Use Policy. Berbayar per token. |
| `gemini-3.5-flash` | LLM | Google Vertex AI (`global`) lewat kelas `GlobalGemini` | `agent/agent.py`: root orchestrator + 6 sub-agen + 6 agen bantu Search/URL | **Belum dipakai runtime.** Tidak ada `Runner` ADK yang dipanggil dari `backend/`. | Sama dengan di atas. |
| DINOv3 BurnSeg (kustom) | Segmentasi citra (hibrid ViT + U-Net spektral 11 kanal) | Dilatih tim; backbone dari Meta `vit_large_patch16_dinov3.sat493m` | `ml/dinov3/`, endpoint `/api/map/segmentation/live` | **Aktif, dengan keterbatasan** (lihat 2.3) | Bobot backbone: **DINOv3 License (Meta)** (perlu dicek apakah sesuai untuk pemakaian instansi). Bobot head: milik tim. |
| U-Net 6-band | Segmentasi citra | Kode tim (`ml/unet/`) | Fallback di `agent/tools/unet_tool.py` | **Tanpa bobot terlatih.** Folder `ml/weights/` tidak ada di repo. | Kode MIT (lisensi proyek) |

### 2.2 Algoritma Non-AI yang Sering Disangka AI

Bagian-bagian ini **deterministik** (rumus atau aturan), bukan hasil penalaran LLM:

| Komponen | Lokasi | Metode |
|---|---|---|
| Klasterisasi titik panas | `data/geospatial/clustering.py` | DBSCAN haversine (scikit-learn) |
| Skor prioritas risiko | `data/geospatial/priority.py`, `agent/tools/priority_tool.py` | MCDA berbobot (gambut, permukiman, angin, pertumbuhan) |
| Indeks keparahan | `data/geospatial/dnbr.py` | dNBR (ambang 0,27 / 0,44) |
| Model rambat api | `frontend/src/lib/monitoring.ts:500` | Rasio panjang-lebar Rothermel/Anderson |
| Rencana taktis POS-1…POS-4 & UDP-1 | `frontend/src/lib/monitoring.ts:792` `buildTacticalAllocationPlan` | Geometri tetap mengikuti arah angin |
| Estimasi kerugian | `frontend/src/hooks/use-chat.ts` | Rp 72 jt/Ha (gambut) / Rp 38 jt/Ha, emisi 420 / 95 t CO₂e/Ha |
| "Langkah agen" 1–6 di panel chat | `frontend/src/hooks/use-chat.ts` | **Animasi berurutan di klien**, bukan jejak eksekusi agen ADK |

### 2.3 Catatan Penting tentang DINOv3 BurnSeg

Dibaca langsung dari isi checkpoint `ml/dinov3_burnseg.pt`:

| Atribut | Nilai |
|---|---|
| Backbone | `vit_large_patch16_dinov3.sat493m` (DINOv3 ViT-L/16, pretrain citra satelit SAT-493M) |
| Ukuran input | 512 px; 6 band (blue, green, red, nir, swir1, swir2) + 5 indeks spektral = 11 kanal |
| Ambang | prob 0,4; keparahan prob [0,6; 0,8]; dNBR [0,27; 0,44] |
| Jenis label latih | **`pseudo`** (label semu, bukan label hasil anotasi manual) |
| Jumlah data | **13 latih / 11 validasi / 7 uji** (scene/patch) |
| Epoch terbaik | 10 |
| Metrik validasi | IoU 0,413 · F1 0,585 · Presisi 0,550 · Recall 0,624 |
| Metrik uji | IoU **0,498** · F1 **0,665** · Presisi 0,773 · Recall 0,584 |

**Keterbatasan yang perlu diungkap:**
1. **Backbone ViT tidak dijalankan.** Checkpoint hanya memuat 4 LayerNorm dari backbone, dan `timm` tidak ada di `requirements.txt`. `DINOv3BackboneAdapter` selalu memakai jalur fallback: fitur spektral diproyeksikan, bukan fitur ViT (`ml/dinov3/model.py:70-90`).
2. **Peta probabilitas didominasi pola radial sintetis**: `prob_map = 0.32 × keluaran_model + 0.76 × pola_lingkaran` (`ml/dinov3/predict.py:278-280`). Bila inferensi gagal, hasilnya 100% pola lingkaran.
3. **Kecepatan angin dan flamabilitas** di respons segmentasi diturunkan dari hash koordinat (`sin(lat·12.98 + lon·78.23)`), bukan data BMKG.
4. Dataset sangat kecil dan berlabel semu, jadi metrik di atas **belum layak** dijadikan dasar klaim luas area untuk keperluan hukum (sejalan dengan `AGENTS.md` §9.2 butir 3).

---

## 3. Tools Agen (Google ADK)

Didefinisikan di `agent/agent.py`. **Belum dijalankan oleh aplikasi** (lihat 2.1).

| Agen | Tools yang Terpasang | Implementasi |
|---|---|---|
| `Wildfire_Response_Orchestrator` (root) | Agen bantu Google Search, agen bantu URL Context; sub-agen: 6 agen di bawah | ADK bawaan |
| `perception_fusion` | `fetch_hotspots`, `fetch_satellite_imagery`, `assess_image_quality`, Google Search, URL Context | FIRMS live bila `FIRMS_MAP_KEY` ada, selain itu **stub** |
| `risk_scoring` | `score_hotspot_priority`, `rank_all_active_hotspots`, `explain_priority`, `overlay_risk_layers` | MCDA; antrian **stub** bila data kosong |
| `verification_agent` | `segment_burned_area`, `compute_dnbr`, `compute_burned_area` | DINOv3 → U-Net → **stub**; `compute_burned_area` memakai jumlah piksel tetap 66.950 |
| `routing_dispatch` | `optimize_team_assignments`, `estimate_travel_time`, `find_nearest_water_sources`, Google Search | **Stub** berbasis doktrin taktis (bukan routing jaringan jalan) |
| `coordination_agent` | `estimate_travel_time`, `explain_priority` | Belum ada integrasi WhatsApp |
| `feedback_learning` | `score_hotspot_priority`, `compute_burned_area` | Belum ada kalibrasi bobot persisten |

**Selisih dengan spesifikasi `AGENTS.md` §6.2:** tool berikut tercantum di spesifikasi tapi **belum ada di kode**: `sipongi_sync_tool`, `bmkg_weather_tool`, `wind_dispersion_tool`, `drone_tasking_tool`, `community_query_tool`, `road_network_routing_tool` (OSRM), `whatsapp_broadcast_tool`, `supervisor_alert_tool`, `weight_calibration_tool`, `audit_logger_tool`.

---

## 4. API & Layanan Eksternal

| Layanan | Host | Fungsi di SIGAP | Dipanggil dari | Autentikasi | Ketentuan / Lisensi Data |
|---|---|---|---|---|---|
| NASA FIRMS | `firms.modaps.eosdis.nasa.gov` | Titik panas VIIRS/MODIS NRT | `data/firms/client.py` | `FIRMS_MAP_KEY` (gratis) | Data NASA terbuka; cantumkan sitasi FIRMS. Ada batas transaksi per MAP_KEY. |
| AWS Earth Search (Element 84) | `earth-search.aws.element84.com` | Pencarian STAC & COG Sentinel-2 L2A | `data/earth_engine/client.py` | Tanpa kunci | Data Copernicus Sentinel: bebas pakai, wajib atribusi *"Contains modified Copernicus Sentinel data [tahun]"*. |
| Google Vertex AI | `us-central1-aiplatform.googleapis.com` | Gemini 2.5 Flash untuk chat | `backend/api/routes/chat.py` | ADC / service account | Google Cloud ToS; berbayar. Project ID default tertanam di kode (`chat.py:57`). |
| Google Search (grounding) | lewat ADK `GoogleSearchTool` | Pencarian berita/jalan putus oleh agen | `agent/agent.py` | Vertex AI | Ada ketentuan tampilan saran pencarian dari Google (perlu dicek). Belum aktif. |
| OSM Nominatim | `nominatim.openstreetmap.org` | Geocoding & reverse geocoding | `backend/api/routes/` | Tanpa kunci | Data **ODbL**, wajib atribusi "© OpenStreetMap contributors". Kebijakan pemakaian: maks 1 permintaan/detik dan User-Agent yang valid. |
| Overpass API | `overpass-api.de` | Permukiman & poligon gambut di sekitar titik | `backend/api/routes/map.py` | Tanpa kunci | Data ODbL; instans publik dengan aturan pemakaian wajar. |
| NASA GIBS | `gibs.earthdata.nasa.gov` | Tile citra VIIRS Corrected Reflectance | frontend & `map.py` | Tanpa kunci | Terbuka; cantumkan atribusi NASA EOSDIS GIBS. |
| EOX Sentinel-2 Cloudless 2021 | `tiles.maps.eox.at` | Basemap citra "pre-fire" | `map.py`, frontend | Tanpa kunci | **CC BY-NC-SA 4.0: non-komersial.** Perlu izin atau lisensi komersial jika SIGAP dipakai secara komersial. |
| Esri ArcGIS Online | `server.arcgisonline.com` | Basemap Topo & Physical | frontend | Tanpa kunci | Esri Terms of Use, atribusi wajib (perlu dicek untuk pemakaian produksi). |
| Google Maps tiles | `mt1.google.com` | Basemap satelit | `map.py`, frontend | Tanpa kunci | **Akses tile langsung tidak diizinkan oleh Google Maps Platform ToS.** Sebaiknya diganti dengan Maps API resmi atau sumber lain. |
| UN-SPIDER | `www.un-spider.org` | Rujukan metodologi dNBR (tautan dokumentasi) | `data/geospatial/` | — | Hanya rujukan |

**Layanan yang disebut di `AGENTS.md` tapi belum diintegrasikan:** KLHK Sipongi, BMKG, Google Earth Engine (hanya stub di `backend/api/deps.py`), WhatsApp Business API, OSRM, Redis cache.

---

## 5. Dataset

| Dataset | Dipakai untuk | Sumber | Status / Catatan |
|---|---|---|---|
| Data latih DINOv3 BurnSeg | Melatih head segmentasi | **Label semu** (13/11/7 sampel). Asal citra & cara pembuatan label **belum didokumentasikan** (perlu dicek ke tim ML). | Tidak ada di repo |
| SAT-493M | Pretrain backbone DINOv3 (oleh Meta) | Meta AI (citra satelit Maxar) | Mengikuti DINOv3 License; backbone tidak dijalankan (2.3) |
| NASA FIRMS VIIRS/MODIS NRT | Titik panas live | NASA LANCE | Runtime, tidak disimpan |
| Sentinel-2 L2A | Input segmentasi | ESA Copernicus via AWS | Runtime, patch 128 px |
| OpenStreetMap | Permukiman, nama wilayah | OSM contributors | Runtime |
| `SAMPLE_HOTSPOTS` (10 klaster) | Data cadangan ketika backend gagal | **Data contoh buatan tim**, `frontend/src/lib/monitoring.ts:75` | Diberi label *"Terkonfirmasi citra (Live FIRMS)"* padahal fiktif, sehingga perlu diberi label "CONTOH" |
| `KHG_PEATLAND_BASINS` | Lapisan peta Kesatuan Hidrologis Gambut | **Aproksimasi elips buatan tim** (titik pusat + sumbu), `monitoring.ts:1066` | Komentar kode menyebut "Official KLHK", tapi ini bukan poligon resmi KLHK. Ganti dengan data KHG KLHK resmi. |
| `INITIAL_REPORTS` (SIGAP-2026-089) | Laporan contoh | Buatan tim | Fiktif, perlu label "CONTOH" |

---

## 6. Lisensi Perangkat Lunak

**Proyek:** `pyproject.toml` → `license = MIT`; `frontend/package.json` → `"private": true`. **Belum ada file `LICENSE` di root repo**, jadi tambahkan sebelum dipublikasikan.

### 6.1 Dependensi Frontend (versi terpasang)

| Paket | Versi | Lisensi |
|---|---|---|
| next | 15.5.28 | MIT |
| react / react-dom | 19.3.1 | MIT |
| leaflet | 1.9.4 | BSD-2-Clause |
| react-leaflet | 5.0.0 | **Hippocratic License 2.1** (lisensi etis, bukan open source versi OSI; ada larangan pemakaian yang melanggar HAM, jadi perlu ditinjau) |
| lucide-react | 0.475.0 | ISC |
| tailwindcss | 4.3.3 | MIT |
| clsx / tailwind-merge | 2.1.1 / 2.6.1 | MIT |
| typescript (dev) | 5.9.3 | Apache-2.0 |

### 6.2 Dependensi Backend & ML (`requirements.txt`)

| Paket | Lisensi |
|---|---|
| google-adk, google-genai, earthengine-api | Apache-2.0 |
| fastapi, pydantic, pydantic-settings, redis | MIT |
| uvicorn, httpx, python-dotenv | BSD-3-Clause |
| torch, torchvision, numpy, scikit-learn, rasterio, geopandas, shapely | BSD-3-Clause |
| Pillow | MIT-CMU (HPND) |
| weasyprint | BSD-3-Clause |

> Lisensi paket Python di atas berasal dari metadata PyPI resmi masing-masing, bukan dari lingkungan terpasang (torch dkk. tidak terpasang di mesin penguji).

---

## 7. Komponen yang Dibantu Agentic AI

### 7.1 Di Dalam Produk SIGAP (saat runtime)

| Komponen | Klaim di UI | Kenyataan di Kode | Tingkat AI |
|---|---|---|---|
| Jawaban chat investigasi | "SIGAP Wildfire Response Orchestrator (Google ADK & Gemini)" | Satu panggilan Gemini 2.5 Flash dengan system prompt berisi fakta FIRMS. Bila gagal, dipakai **template Markdown** dari klien. | LLM tunggal (bukan multi-agen) |
| Panel "Agent Trace" 6 langkah | Perception → Citra → DINOv3 → Risk → Routing | Urutan langkah ditulis tetap di `use-chat.ts`, statusnya diubah berurutan setelah fetch API | Bukan agentic |
| Orkestrasi 6 sub-agen + re-planning | Disebut di `AGENTS.md` | Didefinisikan di `agent/agent.py`, **tidak dipanggil** | Belum aktif |
| Segmentasi area terbakar | "DINOv3 BurnSeg" | Model ML + pola radial (2.3) | ML (bukan agentic) |
| Skor prioritas, rencana POS, estimasi kerugian | Ditampilkan sebagai keputusan agen ("Risk Scoring Agent (MCDA)") | Rumus deterministik (2.2) | Bukan AI |
| Pencarian web & bacaan URL oleh agen | — | `GoogleSearchTool`, `url_context` terpasang di agen ADK | Belum aktif |

**Kesimpulan:** saat ini satu-satunya komponen AI generatif yang benar-benar dipanggil aplikasi adalah **Gemini 2.5 Flash di `/api/chat`**, dan itu pun belum tersambung di deployment. Arsitektur multi-agen ADK masih di tahap definisi.

### 7.2 Dalam Proses Pengembangan

| Komponen | Alat AI | Peran AI | Peninjau Manusia |
|---|---|---|---|
| Folder `daftar-uji/` (dokumen bukti uji, skrip `sim-fallback.mjs`, log uji) | Claude Code (Claude Opus 5.5, Anthropic) | Menjalankan uji HTTP, menganalisis kode & checkpoint, menulis dokumen | Kurt-Mikhael |
| _Komponen lain (frontend, backend, agent, ml)_ | _diisi tim_ | _diisi tim_ | _diisi tim_ |

> Riwayat git tidak memuat trailer `Co-authored-by` dari alat AI, jadi penggunaan AI pada komponen lain **tidak bisa dipastikan dari repo** dan perlu diisi sendiri oleh masing-masing anggota tim.

---

## 8. Pengawasan Manusia atas Keluaran AI

| Keluaran AI | Risiko | Kontrol Manusia yang Diperlukan |
|---|---|---|
| Jawaban Gemini di chat | Halusinasi; system prompt bisa menyatakan "AMAN" bila FIRMS kosong (`chat.py:104`) | Operator memverifikasi ke Sipongi/FIRMS sebelum menindaklanjuti |
| Luas area terbakar (DINOv3) | Model kecil, label semu, pola radial | Validasi dengan GPS lapangan atau orthomosaic drone sebelum dipakai di laporan resmi |
| Rencana dispatch / POS | Geometri tetap, belum memperhitungkan jalan | Disetujui Komandan Satgas (lihat [UJ-17](../daftar-uji/04-laporan-dan-hitl.md#uj-17)) |
| Estimasi kerugian | Konstanta tanpa rujukan | Divalidasi analis BPBD/KLHK sebelum publikasi |
| Agen ADK (saat nanti diaktifkan) | Agen bisa mencari web dan mengambil URL secara otonom | Log audit semua tool call dan batasi domain URL |

---

## 9. Rekomendasi

1. Tambahkan file `LICENSE` (MIT) dan `NOTICE` berisi atribusi data: NASA FIRMS/GIBS, Copernicus Sentinel, © OpenStreetMap contributors, Esri.
2. Ganti basemap `mt1.google.com` dan tinjau pemakaian EOX s2cloudless (non-komersial).
3. Tinjau Hippocratic License pada `react-leaflet` dan DINOv3 License untuk konteks instansi pemerintah.
4. Dokumentasikan dataset latih DINOv3: asal citra, cara pembuatan label semu, dan wilayahnya.
5. Samakan klaim di UI dengan kenyataan: model "Gemini 2.5 Flash" (bukan 3.5/ADK), panel trace sebagai visualisasi, dan data contoh diberi label "CONTOH".
6. Sambungkan `root_agent` ADK ke backend (misalnya lewat `google.adk.runners.Runner`) jika arsitektur multi-agen ingin diklaim sebagai fitur yang berjalan.
