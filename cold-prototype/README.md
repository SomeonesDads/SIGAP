# SIGAP: Agen Karhutla — Cold Prototype (Standalone / Offline-Ready)

Prototipe mandiri (*Cold Prototype*) dari platform **SIGAP (Sistem Informasi dan Tanggap Cepat Karhutla)** yang berjalan **100% di sisi klien (frontend/statik)** tanpa memerlukan server backend Python, Docker, Redis, kredensial Google Cloud Vertex AI, Google Earth Engine, maupun kunci API NASA FIRMS.

Seluruh data telemetri satelit, poligon segmentasi **DINOv3 BurnSeg**, cekungan hidrologis gambut (**KHG KLHK**), zona buffer permukiman, matriks prioritas **MCDA**, simulasi **5 Drone Otonom**, orkestrasi percakapan **6 Sub-Agen AI**, hingga pembuatan dokumen **PDF SITREP** dan **GeoJSON** telah dipaketkan (*pre-baked*) secara deterministik di dalam aplikasi.

---

## Fitur Utama yang Berfungsi Penuh Tanpa Backend

1. **Peta Komando Interaktif Multi-Layer (`/` & `/map`)**
   - **Klaster & Titik Panas NASA FIRMS (VIIRS 375m)**: Menampilkan klaster kebakaran aktif lintas kepulauan Indonesia beserta ratusan titik anomali termal individual.
   - **Segmentasi DINOv3 BurnSeg 4-Zona**: Poligon keparahan luka bakar (*Zona Merah Tua, Merah-Oranye, Oranye-Kuning, dan Kuning*) yang dihitung berdasarkan arah/kecepatan angin dan indeks flamabilitas lahan.
   - **Lapisan Lahan Gambut (KHG) & Buffer Permukiman**: Poligon Kesatuan Hidrologis Gambut dan kota/permukiman di seluruh Indonesia.
   - **Alokasi Taktis Perimeter (`BASE`, `POS-1` s/d `POS-4`, `UDP-1`)**: Rute konvoi darat, manuver jepit sayap, garis sekat bakar depan, dan koridor lintas udara.
2. **Simulasi Swarm 5 Drone Pemadam Otonom**
   - Aktifkan tombol **Simulasi** di bilah atas untuk mengerahkan 5 drone pemadam yang terbang menuju klaster prioritas, menjatuhkan cairan *retardant*, menyusutkan radius api secara waktu nyata, dan kembali ke posko (*base*) untuk pengisian ulang.
3. **AI Wildfire Command Center & Jejak Penalaran 6 Agen (`/investigation`)**
   - Mendukung instruksi bahasa alami untuk rencana alokasi sumber daya perimeter, proyeksi kerugian ekonomi/ekologis & emisi karbon (24 jam / 72 jam), pemeringkatan prioritas MCDA per provinsi/kabupaten, serta *Domain Guardrail* otomatis untuk pertanyaan di luar konteks karhutla.
   - Menampilkan tahapan eksekusi 6 agen (*Execution Timeline*) dan catatan keputusan (*Decision Audit Log*).
4. **Matriks Prioritas MCDA & Ekspor CSV/PDF (`/priority`)**
   - Filter interaktif berdasarkan kategori Kritis ($\ge 85$), Lahan Gambut, dan Jarak Permukiman ($\le 3\text{ km}$), dilengkapi rincian alasan penilaian (*Why This Area*) dan unduhan matriks `.csv` serta instruksi `.pdf`.
5. **Laporan Investigasi & Ekspor Offline PDF/GeoJSON (`/reports`)**
   - Menghasilkan berkas dokumen **PDF 1.4 SITREP** dan **GeoJSON FeatureCollection** secara langsung di peramban (*client-side*) tanpa panggilan jaringan ke backend.

---

## Cara Menjalankan

### 1. Mode Pengembangan Interaktif
```bash
npm run dev
```
Buka `http://localhost:3000` di peramban.

### 2. Membangun Paket Statik Murni (`out/`)
Proyek ini telah dikonfigurasi dengan `output: "export"` pada `next.config.ts`:
```bash
npm run build
```
Hasil kompilasi statik sepenuhnya tersedia di dalam direktori `out/` dan dapat disajikan menggunakan server berkas statik apa pun:
```bash
npm run start
```
